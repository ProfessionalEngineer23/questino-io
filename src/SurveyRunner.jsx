// src/SurveyRunner.jsx
import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ID } from "appwrite";
import { databases, account, functions } from "./lib/appwrite";
import { getSurveyBySlug, getQuestionsForSurvey } from "./surveyApi";
import { APPWRITE_CONFIG } from "./config/appwrite";
import { FEATURES } from "./featureFlags";
import { motion, AnimatePresence } from 'framer-motion';
import { playSfx, stopAll } from './lib/sfx';
import { speak, stopSpeak, canTTS } from './lib/voice';
import VoiceControls from './components/VoiceControls';
import "./styles/thankyou.css";
import "./styles/rewards.css";
import styles from "./SurveyRunner.module.css";

const DB_ID = APPWRITE_CONFIG.DATABASE_ID;
const RESPONSES = APPWRITE_CONFIG.COLLECTIONS.RESPONSES;
const FN_ID =
  APPWRITE_CONFIG.FUNCTIONS?.WATSON_NLU ||
  import.meta.env.VITE_APPWRITE_FUNCTION_WATSON_NLU_ID ||
  "68b2b9fe0008a37d0428"; // last-resort fallback

// client-side guard: don't enqueue Watson for micro-texts
const MIN_TEXT_FOR_NLU = Number(import.meta.env.VITE_WATSON_MINLEN || 8);

async function ensureSession() {
  try {
    await account.get();
  } catch {
    await account.createAnonymousSession();
  }
}

// Single Question Renderer Component
function QuestionRenderer({ question, value, onChange }) {
  if (!question) return null;

  // Ensure MCQ options array
  let options = [];
  if (question.type === "mcq") {
    try {
      options = Array.isArray(question.options)
        ? question.options
        : JSON.parse(question.options || "[]");
    } catch {
      options = [];
    }
  }

  return (
    <div className={styles.questionCard}>
      <div className={styles.questionTitle}>
        {question.text}
        {question.required && <span className={styles.required}> *</span>}
      </div>

      <div className="mt-4">
        {question.type === "scale" && (
          <>
            {/* Emoji Scale for 1-5 scales */}
            {(question.scaleMin ?? 1) === 1 && (question.scaleMax ?? 5) === 5 ? (
              <div className={styles.emojiRow}>
                {['😞','😐','🙂','😀','🤩'].map((emoji, idx) => {
                  const val = idx + 1;
                  const active = value === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      className={active ? styles.emojiActive : styles.emoji}
                      onClick={() => onChange(val)}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Regular slider for other scales */
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 font-medium">{question.scaleMin}</span>
                <input
                  type="range"
                  min={question.scaleMin ?? 1}
                  max={question.scaleMax ?? 5}
                  value={Number(value ?? question.scaleMin ?? 1)}
                  onChange={(e) => onChange(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm text-gray-500 font-medium">{question.scaleMax}</span>
                <span className="ml-4 text-lg font-semibold text-brand-600 min-w-[2rem] text-center">
                  {value ?? question.scaleMin ?? 1}
                </span>
              </div>
            )}
            
          </>
        )}

        {question.type === "mcq" && (
          <div className="space-y-2">
            {options.map((opt, i) => (
              <label key={i} className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={question.$id}
                  value={opt}
                  checked={value === opt}
                  onChange={(e) => onChange(e.target.value)}
                  className="mr-3 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        )}

        {question.type === "text" && (
          <textarea
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            rows={4}
          />
        )}

        {question.type === "yes_no" && (
          <div className="flex gap-4">
            <label className="flex items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer flex-1">
              <input
                type="radio"
                name={question.$id}
                value="yes"
                checked={value === "yes"}
                onChange={(e) => onChange(e.target.value)}
                className="mr-3 text-green-600 focus:ring-green-500"
              />
              <span className="text-gray-700 font-medium">Yes</span>
            </label>
            <label className="flex items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer flex-1">
              <input
                type="radio"
                name={question.$id}
                value="no"
                checked={value === "no"}
                onChange={(e) => onChange(e.target.value)}
                className="mr-3 text-red-600 focus:ring-red-500"
              />
              <span className="text-gray-700 font-medium">No</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SurveyRunner() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [sections, setSections] = useState([]);
  const [currentSection, setCurrentSection] = useState(0);

  const [answers, setAnswers] = useState({}); // { [questionId]: value }
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Single question navigation state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Conversational and voice features state
  const keyConvo = (id) => `convo:${id}`;
  const keyFx = (id) => `fx:${id}`;
  
  const [conversational, setConversational] = useState(() => {
    try { return localStorage.getItem(keyConvo(survey?.$id)) === '1'; } catch { return false; }
  });
  const [effectsOn, setEffectsOn] = useState(() => {
    try { return localStorage.getItem(keyFx(survey?.$id)) !== '0'; } catch { return true; } // default ON
  });
  
  // Reward animation state
  const [showConfetti, setShowConfetti] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const [submitCelebrating, setSubmitCelebrating] = useState(false);
  const wasAnsweredRef = useRef(false);
  const typingTimeoutRef = useRef(null);

  // ---------- Load survey + questions ----------
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        await ensureSession();

        const s = await getSurveyBySlug(slug);
        if (!s) {
          setError("Survey not found.");
          return;
        }

        // Check if survey is public
        if (!s.isPublic) {
          setError("This survey is private and not accessible.");
          return;
        }

        setSurvey(s);

        const qs = await getQuestionsForSurvey(s.$id);
        setQuestions(qs || []);

        // Build sections: a question with type === "section" starts a new section
        const built = [];
        let cur = { title: "Section 1", description: "", questions: [] };
        let secIdx = 1;

        (qs || []).forEach((q) => {
          if (q.type === "section") {
            if (cur.questions.length > 0) built.push(cur);
            secIdx += 1;
            cur = {
              title: q.sectionTitle || `Section ${secIdx}`,
              description: q.sectionDescription || "",
              questions: [],
            };
          } else {
            cur.questions.push(q);
          }
        });
        if (cur.questions.length > 0) built.push(cur);

        // If no explicit section markers, show everything in one section
        if (built.length === 0 && (qs || []).length > 0) {
          built.push({ title: "Questions", description: "", questions: qs });
        }

        setSections(built);
        setCurrentSection(0);
      } catch (e) {
        console.error(e);
        setError("Failed to load survey.");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // ---------- Answer handling ----------
  const setAnswer = (qid, value) =>
    setAnswers((prev) => ({ ...prev, [qid]: value }));

  const nextSection = () =>
    currentSection < sections.length - 1 && setCurrentSection((s) => s + 1);

  const prevSection = () =>
    currentSection > 0 && setCurrentSection((s) => s - 1);

  const goToSection = (i) =>
    setCurrentSection((s) =>
      Math.max(0, Math.min(i, Math.max(0, sections.length - 1))),
    );

  const progressPct = useMemo(() => {
    if (!sections.length) return 0;
    return ((currentSection + 1) / sections.length) * 100;
  }, [sections.length, currentSection]);

  // ---------- Single Question Navigation ----------
  // Flatten all questions from all sections
  const allQuestions = useMemo(() => {
    return sections.flatMap(section => section.questions);
  }, [sections]);

  const totalQuestions = allQuestions.length;
  const currentQuestion = allQuestions[currentQuestionIndex];
  
  // Calculate progress based on answered questions
  const answeredCount = allQuestions.filter(q => {
    const answer = answers[q.$id];
    return answer !== undefined && answer !== null && answer !== '';
  }).length;
  
  const questionProgressPct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  
  // Navigation state
  const canGoBack = currentQuestionIndex > 0;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  
  // Check if current question is answered (for required questions)
  const isCurrentAnswered = useMemo(() => {
    if (!currentQuestion) return true;
    if (!currentQuestion.required) return true;
    
    const answer = answers[currentQuestion.$id];
    if (answer === undefined || answer === null || answer === '') return false;
    if (Array.isArray(answer) && answer.length === 0) return false;
    return true;
  }, [currentQuestion, answers]);

  // Navigation functions
  const goToNext = () => {
    if (!isCurrentAnswered) return; // Guard for required questions
    
    if (isLastQuestion) {
      // Submit the survey
      handleSubmit();
    } else {
      setCurrentQuestionIndex(prev => Math.min(prev + 1, totalQuestions - 1));
    }
  };

  const goToPrevious = () => {
    setCurrentQuestionIndex(prev => Math.max(prev - 1, 0));
  };

  // Reset question index when sections change
  useEffect(() => {
    setCurrentQuestionIndex(0);
  }, [sections]);

  // localStorage persistence for toggles
  useEffect(() => { 
    try {
      conversational ? localStorage.setItem(keyConvo(survey?.$id),'1') : localStorage.removeItem(keyConvo(survey?.$id));
    } catch{} 
  }, [conversational, survey?.$id]);

  useEffect(() => { 
    try {
      effectsOn ? localStorage.removeItem(keyFx(survey?.$id)) : localStorage.setItem(keyFx(survey?.$id),'0');
    } catch{} 
  }, [effectsOn, survey?.$id]);

  // Reward animation functions
  function triggerConfetti(){
    setShowConfetti(true);
    setTimeout(()=> setShowConfetti(false), 900);
  }

  function pulseCard(){
    setPulseKey(k=>k+1); // change key to retrigger CSS animation class
  }

  // Conversational read-out when entering a question
  useEffect(() => {
    stopSpeak();
    if (!FEATURES.CONVERSATIONAL_MODE || !conversational || !canTTS()) return;
    if (!currentQuestion) return;
    
    // Add a small delay to ensure the question has fully loaded
    const timer = setTimeout(() => {
      const idx = currentQuestionIndex + 1;
      const total = allQuestions.length;
      const opts = Array.isArray(currentQuestion.options) && currentQuestion.options.length
        ? '. Options: ' + currentQuestion.options.join(', ')
        : '';
      const text = `Hello. Question ${idx} of ${total}. ${currentQuestion.text}${opts}`;
      console.log('Speaking:', text); // Debug log
      speak(text);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [conversational, currentQuestionIndex, currentQuestion?.$id, allQuestions?.length]);

  // Trigger reward sound + animation on answer
  useEffect(() => {
    const q = currentQuestion;
    if (!q) return;
    const val = answers[q.$id];
    const required = !!q.required;

    const isAnswered = !(val === undefined || val === '' || (Array.isArray(val) && val.length === 0));
    
    // For text inputs, add a delay to avoid triggering during typing
    if (q.type === 'text' && isAnswered && !wasAnsweredRef.current) {
      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set a delay before triggering animation
      typingTimeoutRef.current = setTimeout(() => {
        if (effectsOn && FEATURES.REWARD_SOUNDS) {
          playSfx('progress', 0.45);
        }
        if (effectsOn && FEATURES.REWARD_ANIMATIONS) {
          triggerConfetti();
          pulseCard();
        }
      }, 1000); // 1 second delay for text inputs
    } else if (q.type !== 'text' && !wasAnsweredRef.current && isAnswered) {
      // For non-text inputs, trigger immediately
      if (effectsOn && FEATURES.REWARD_SOUNDS) {
        playSfx('progress', 0.45);
      }
      if (effectsOn && FEATURES.REWARD_ANIMATIONS) {
        triggerConfetti();
        pulseCard();
      }
    }
    
    wasAnsweredRef.current = isAnswered;
    
    // Cleanup timeout when question changes
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [currentQuestion?.$id, answers[currentQuestion?.$id], effectsOn]);

  // Validate required questions in the current section only
  const validateRequired = () => {
    const cur = sections[currentSection];
    if (!cur) return true;
    for (const q of cur.questions) {
      if (!q.required) continue;
      const v = answers[q.$id];
      if (q.type === "text" && !String(v || "").trim()) return false;
      if (q.type === "mcq" && !v) return false;
      if (q.type === "yes_no" && !v) return false;
      if (q.type === "scale" && (v === undefined || v === null)) return false;
    }
    return true;
  };

  // ---------- Submit ----------
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError("");

    try {
      await ensureSession();

      // Get survey data to check allowAnonymous
      const surveyData = await getSurveyBySlug(slug);
      
      const payload = {
        questionnaireId: survey.$id,
        answers: JSON.stringify(answers),
        participantId: null, // Default value
        submittedAt: new Date().toISOString(), // Required field
      };

      // Conditionally exclude participantId based on feature flag and survey settings
      if (FEATURES.ANON_ENFORCE && surveyData.allowAnonymous) {
        delete payload.participantId;
      }

      const doc = await databases.createDocument(DB_ID, RESPONSES, ID.unique(), payload);

      // Enqueue per-text-question analysis (so Stats can show per-question NLU)
      for (const q of questions) {
        if (q.type !== "text") continue;
        const t = String(answers[q.$id] || "").trim();
        if (t.length < MIN_TEXT_FOR_NLU) continue;
        try {
          await functions.createExecution(
            FN_ID,
            JSON.stringify({
              responseId: doc.$id,
              questionId: q.$id,
              text: t,
            }),
          );
          console.log(`[Watson] q=${q.$id} enqueued`);
        } catch (fxErr) {
          console.error(`[Watson] enqueue failed for q=${q.$id}:`, fxErr);
        }
      }

      setSubmitted(true);
      
      // Play celebration sound and show confetti
      if (FEATURES.REWARD_SOUNDS && effectsOn) {
        playSfx('celebration', 0.7);
      }
      if (FEATURES.REWARD_ANIMATIONS && effectsOn) {
        triggerConfetti();
        // Trigger submit button celebration animation
        setSubmitCelebrating(true);
        setTimeout(() => setSubmitCelebrating(false), 1200);
      }
      
      // Show confetti animation and navigate to appropriate page
      if (FEATURES.THANK_YOU_ANIM) {
        setTimeout(() => {
          // Check if this is a Happiness Assessment survey
          if (survey.title?.includes("Happiness Assessment")) {
            // Store response data for the results page
            const responseData = {
              response: doc,
              survey: survey
            };
            
            // Store in localStorage for the results page to access
            try {
              const existingResponses = JSON.parse(localStorage.getItem('questino_guest_responses') || '[]');
              existingResponses.push(doc);
              localStorage.setItem('questino_guest_responses', JSON.stringify(existingResponses));
              
              const existingSurveys = JSON.parse(localStorage.getItem('questino_guest_surveys') || '[]');
              const surveyExists = existingSurveys.find(s => s.$id === survey.$id);
              if (!surveyExists) {
                existingSurveys.push(survey);
                localStorage.setItem('questino_guest_surveys', JSON.stringify(existingSurveys));
              }
            } catch (error) {
              console.error('Error storing response data:', error);
            }
            
            // Navigate to happiness results page
            navigate(`/happiness-results/${slug}?responseId=${doc.$id}&surveyId=${survey.$id}`);
          } else {
            // Regular thank you page for other surveys
            navigate(`/thanks?slug=${slug}&statsPublic=${survey.statsPublic}`);
          }
        }, 900);
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- UI ----------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-brand-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading survey…</p>
        </div>
      </div>
    );
  }
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!survey) return <div className="p-6">No survey</div>;

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-accent-50">
        <div className="text-center animate-in fade-in-up">
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto bg-green-500 rounded-full flex items-center justify-center animate-in scale-in">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
            Thank You!
          </h1>
          <p className="text-gray-600 mt-2">Your response has been recorded and is being analyzed.</p>
          <div className="mt-2 text-sm text-gray-500">Analysis in progress…</div>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      {/* Accessibility: Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Question {currentQuestionIndex + 1} of {totalQuestions}
      </div>
      {/* Header with gradient background */}
      <div className={styles.header}>
        <h1 className={styles.header.h1}>
          {survey.title}
        </h1>
        {survey.description && (
          <p className={styles.header.p}>
            {survey.description}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill} 
          style={{ width: `${questionProgressPct}%` }}
        />
      </div>

      {/* Progress Info */}
      <div className={styles.progressInfo}>
        <span className={styles.questionCounter}>
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </span>
        <span className={styles.progressPercentage}>
          {questionProgressPct}% Complete
        </span>
      </div>

      {/* Feature Toggles */}
      <div className={styles.featureToggles}>
        {FEATURES.CONVERSATIONAL_MODE && (
          <label className={`${styles.featureToggle} ${conversational ? styles.active : ''}`}>
            <div className={styles.customCheckbox}>
              <input 
                type="checkbox" 
                checked={conversational} 
                onChange={e=>{ setConversational(e.target.checked); stopSpeak(); }} 
              />
              <span className={styles.checkmark}></span>
            </div>
            <span className={styles.toggleIcon}>💬</span>
            Conversational mode
          </label>
        )}
        {(FEATURES.REWARD_SOUNDS || FEATURES.REWARD_ANIMATIONS) && (
          <label className={`${styles.featureToggle} ${effectsOn ? styles.active : ''}`}>
            <div className={styles.customCheckbox}>
              <input 
                type="checkbox" 
                checked={effectsOn} 
                onChange={e=>{ setEffectsOn(e.target.checked); if(!e.target.checked){ stopAll(); } }} 
              />
              <span className={styles.checkmark}></span>
            </div>
            <span className={styles.toggleIcon}>✨</span>
            Effects (sound & animation)
          </label>
        )}
      </div>

      {/* Single Question Card with Motion */}
      {currentQuestion && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.$id + ':' + pulseKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className={`${styles.card} slideIn ${FEATURES.REWARD_ANIMATIONS && effectsOn ? 'pulse' : ''}`}
          >
            <QuestionRenderer
              question={currentQuestion}
              value={answers[currentQuestion.$id]}
              onChange={(value) => setAnswer(currentQuestion.$id, value)}
            />
            <VoiceControls
              text={(currentQuestion?.text || '') + (Array.isArray(currentQuestion?.options) ? '. Options: ' + currentQuestion.options.join(', ') : '')}
              enableRead={FEATURES.VOICE_READOUT}
              enableRec={FEATURES.VOICE_INPUT}
              onTranscript={(t)=> setAnswers(prev => ({ ...prev, [currentQuestion.$id]: t }))}
              questionType={currentQuestion?.type}
              options={currentQuestion?.type === 'mcq' ? (() => {
                try {
                  return Array.isArray(currentQuestion.options)
                    ? currentQuestion.options
                    : JSON.parse(currentQuestion.options || "[]");
                } catch {
                  return [];
                }
              })() : undefined}
              scaleMin={currentQuestion?.type === 'scale' ? (currentQuestion.scaleMin ?? 1) : undefined}
              scaleMax={currentQuestion?.type === 'scale' ? (currentQuestion.scaleMax ?? 5) : undefined}
              onOptionSelect={(value) => setAnswers(prev => ({ ...prev, [currentQuestion.$id]: value }))}
              onScaleSelect={(value) => setAnswers(prev => ({ ...prev, [currentQuestion.$id]: value }))}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Navigation Actions */}
      <div className={styles.actions}>
        <button
          onClick={goToPrevious}
          disabled={!canGoBack}
          className={`${styles.button} ${styles.buttonBack}`}
        >
          <span className="icon-arrow-left"></span>
          Back
        </button>

        <button
          onClick={goToNext}
          disabled={!isCurrentAnswered}
          className={`${styles.button} ${styles.buttonNext} ${submitCelebrating && FEATURES.REWARD_ANIMATIONS && effectsOn ? 'submit-celebration' : ''}`}
        >
          {isLastQuestion ? (
            <>
              {submitting ? "Submitting..." : "Submit Survey"}
              <span className="icon-check"></span>
            </>
          ) : (
            <>
              Next
              <span className="icon-arrow-right"></span>
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm text-center">{error}</p>
        </div>
      )}

      {/* No Questions Message */}
      {totalQuestions === 0 && (
        <div className="text-center py-12 text-gray-500">
          No questions found in this survey.
        </div>
      )}
      
      {/* Reward confetti overlay */}
      {FEATURES.REWARD_ANIMATIONS && showConfetti && effectsOn && (
        <div className="reward-overlay">
          <div className="confetti" />
        </div>
      )}
      
      {/* Confetti animation */}
      {FEATURES.THANK_YOU_ANIM && submitted && <div className="confetti" />}
    </main>
  );
}
