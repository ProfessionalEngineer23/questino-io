// src/SurveyRunner.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ID, Functions } from "appwrite";
import { db, account } from "./lib/appwrite";
import { Client } from "appwrite";
import { getSurveyBySlug, getQuestionsForSurvey } from "./surveyApi";
import { APPWRITE_CONFIG } from "./config/appwrite";

const DB_ID = APPWRITE_CONFIG.DATABASE_ID;
const RESPONSES = APPWRITE_CONFIG.COLLECTIONS.RESPONSES;
const FN_ID = APPWRITE_CONFIG.FUNCTIONS.WATSON_NLU;

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const fx = new Functions(client);

async function ensureSession() {
  try { await account.get(); }
  catch { await account.createAnonymousSession(); }
}

export default function SurveyRunner() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { questionId: value }
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [currentSection, setCurrentSection] = useState(0);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await ensureSession();
        const s = await getSurveyBySlug(slug);
        if (!s) {
          setError("Survey not found.");
          return;
        }
        setSurvey(s);

        // respect creator's privacy setting
        if (s.isPublic === false) {
          setError("This survey is private.");
          return;
        }

        const qs = await getQuestionsForSurvey(s.$id);
        setQuestions(qs || []);
        
        // Group questions into sections
        const sections = [];
        let currentSection = { title: "Introduction", description: "", questions: [] };
        
        (qs || []).forEach(q => {
          if (q.type === "section") {
            if (currentSection.questions.length > 0) {
              sections.push(currentSection);
            }
            currentSection = {
              title: q.sectionTitle || "Untitled Section",
              description: q.sectionDescription || "",
              questions: []
            };
          } else {
            currentSection.questions.push(q);
          }
        });
        
        if (currentSection.questions.length > 0) {
          sections.push(currentSection);
        }
        
        setSections(sections);
      } catch (e) {
        console.error(e);
        setError("Failed to load survey.");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const setAnswer = (qid, value) =>
    setAnswers((prev) => ({ ...prev, [qid]: value }));

  const goToSection = (sectionIndex) => {
    setCurrentSection(Math.max(0, Math.min(sectionIndex, sections.length - 1)));
  };

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const getProgress = () => {
    if (sections.length === 0) return 0;
    return ((currentSection + 1) / sections.length) * 100;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      await ensureSession();

      const freeTextParts = questions
        .filter((q) => q.type === "text")
        .map((q) => String(answers[q.$id] || ""))
        .filter(Boolean);

      const freeText = freeTextParts.join("\n\n") || null;

      // Create the response document
      const response = await db.createDocument(DB_ID, RESPONSES, ID.unique(), {
        questionnaireId: survey.$id,
        participantId: null, // anonymous
        answers: JSON.stringify(answers),
        freeText: freeText,
        submittedAt: new Date().toISOString(),
      });

      // Trigger Watson NLU analysis if there's text to analyze
      if (freeText && freeText.trim()) {
        try {
          const functions = new Functions(client);
          // Use the correct Watson function ID
          const functionId = import.meta.env.VITE_APPWRITE_FUNCTION_WATSON_NLU_ID || "68b2b9fe0008a37d0428";
          
          await functions.createExecution(
            functionId,
            JSON.stringify({
              responseId: response.$id,
              questionId: null, // Overall analysis for the entire response
              text: freeText
            })
          );
          console.log(`✅ Watson NLU analysis triggered with function ID: ${functionId}`);
          console.log(`📝 Analyzing text: "${freeText.substring(0, 100)}${freeText.length > 100 ? '...' : ''}"`);
          console.log(`🆔 Response ID: ${response.$id}`);
        } catch (error) {
          console.error("Failed to trigger Watson NLU:", error);
        }
      }

      setSubmitted(true);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to submit.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-brand-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading survey...</p>
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
          {/* Animated checkmark */}
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto bg-green-500 rounded-full flex items-center justify-center animate-in scale-in" style={{ animationDelay: '200ms' }}>
              <svg className="w-12 h-12 text-white animate-in slide-in" style={{ animationDelay: '600ms' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            {/* Celebration particles */}
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '800ms' }}></div>
            <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '1000ms' }}></div>
            <div className="absolute top-4 -left-4 w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '1200ms' }}></div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent animate-in fade-in-up" style={{ animationDelay: '400ms' }}>
              Thank you!
            </h1>
            <p className="text-xl text-gray-600 animate-in fade-in-up" style={{ animationDelay: '600ms' }}>
              Your response has been recorded and is being analyzed.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 animate-in fade-in-up" style={{ animationDelay: '800ms' }}>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Analysis in progress...</span>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-brand-100 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-accent-100 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
          {survey.title}
        </h1>
        {survey.description && (
          <p className="text-gray-600 mt-2 text-lg">{survey.description}</p>
        )}
      </div>

      {/* Progress Bar */}
      {sections.length > 1 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Section {currentSection + 1} of {sections.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(getProgress())}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-brand-500 to-accent-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        </div>
      )}

      {/* Section Navigation */}
      {sections.length > 1 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {sections.map((section, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToSection(index)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  index === currentSection
                    ? 'bg-brand-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Section */}
      {sections.length > 0 && sections[currentSection] && (
        <div className="animate-in fade-in-up">
          {/* Section Header */}
          <div className="text-center mb-8 p-6 bg-gradient-to-r from-brand-50 to-accent-50 rounded-xl border border-brand-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {sections[currentSection].title}
            </h2>
            {sections[currentSection].description && (
              <p className="text-gray-600">{sections[currentSection].description}</p>
            )}
          </div>

          {/* Section Questions */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {sections[currentSection].questions.map((q) => {
          // options may be JSON string from DB
          let opts = [];
          if (q.type === "mcq") {
            try { opts = Array.isArray(q.options) ? q.options : JSON.parse(q.options || "[]"); }
            catch { opts = []; }
          }

          return (
            <div key={q.$id} className="rounded-xl border border-gray-200 p-6 bg-white shadow-sm hover:shadow-md transition-all duration-200">
              <div className="font-semibold text-gray-800 mb-3">
                {q.text} {q.required ? <span className="text-red-500">*</span> : null}
              </div>

              <div className="mt-3">
                {q.type === "scale" && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{q.scaleMin}</span>
                    <input
                      type="range"
                      min={q.scaleMin ?? 1}
                      max={q.scaleMax ?? 5}
                      value={Number(answers[q.$id] ?? q.scaleMin ?? 1)}
                      onChange={(e) => setAnswer(q.$id, Number(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-500">{q.scaleMax}</span>
                    <span className="ml-2 text-sm">
                      {Number(answers[q.$id] ?? q.scaleMin ?? 1)}
                    </span>
                  </div>
                )}

                {q.type === "slider" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{q.scaleMin}</span>
                      <input
                        type="range"
                        min={q.scaleMin ?? 0}
                        max={q.scaleMax ?? 10}
                        value={Number(answers[q.$id] ?? q.scaleMin ?? 0)}
                        onChange={(e) => setAnswer(q.$id, Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #0ea5e9 0%, #0ea5e9 ${((Number(answers[q.$id] ?? q.scaleMin ?? 0) - (q.scaleMin ?? 0)) / ((q.scaleMax ?? 10) - (q.scaleMin ?? 0))) * 100}%, #e5e7eb ${((Number(answers[q.$id] ?? q.scaleMin ?? 0) - (q.scaleMin ?? 0)) / ((q.scaleMax ?? 10) - (q.scaleMin ?? 0))) * 100}%, #e5e7eb 100%)`
                        }}
                      />
                      <span className="text-sm text-gray-500">{q.scaleMax}</span>
                    </div>
                    <div className="flex justify-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand-100 text-brand-800">
                        {Number(answers[q.$id] ?? q.scaleMin ?? 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}

                {q.type === "text" && (
                  <textarea
                    className="w-full border rounded p-2"
                    rows={3}
                    value={answers[q.$id] ?? ""}
                    onChange={(e) => setAnswer(q.$id, e.target.value)}
                    placeholder="Type your answer…"
                  />
                )}

                {q.type === "mcq" && (
                  <div className="flex flex-col gap-2">
                    {opts.map((opt, i) => (
                      <label key={i} className="flex items-center gap-2">
                        <input
                          type="radio"            // single choice for now
                          name={q.$id}
                          checked={answers[q.$id] === opt}
                          onChange={() => setAnswer(q.$id, opt)}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
            })}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={prevSection}
                disabled={currentSection === 0}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  currentSection === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ← Previous
              </button>

              <div className="text-center">
                <div className="text-sm text-gray-500">
                  Section {currentSection + 1} of {sections.length}
                </div>
              </div>

              {currentSection === sections.length - 1 ? (
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-brand-500 to-accent-500 text-white rounded-lg font-medium hover:from-brand-600 hover:to-accent-600 transition-all shadow-lg hover:shadow-xl"
                >
                  Submit Survey
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextSection}
                  className="px-6 py-3 bg-gradient-to-r from-brand-500 to-accent-500 text-white rounded-lg font-medium hover:from-brand-600 hover:to-accent-600 transition-all"
                >
                  Next →
                </button>
              )}
            </div>

            {error && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}
          </form>
        </div>
      )}

      {/* Fallback for surveys without sections */}
      {sections.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No questions found in this survey.</div>
        </div>
      )}
    </main>
  );
}
