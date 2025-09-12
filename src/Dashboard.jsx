// src/Dashboard.jsx
import { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ensureSession, getMySurveys, createSurvey, addQuestion } from "./surveyApi";
import { resolveCopyNameConflict } from "./utils/surveyNameResolver";
import { useToast } from "./components/Toast.jsx";
import { useAuth } from "./hooks/useAuth";
import AuthModal from "./components/AuthModal";
import { LoadingSkeleton } from "./components/LoadingSpinner";
import TumbleweedAnimation from "./components/TumbleweedAnimation";
import CheerfulQAnimation from "./components/CheerfulQAnimation";
import FireButton from "./components/FireButton";
import SignOutPrompt from "./components/SignOutPrompt";
import { FEATURES } from './featureFlags';
import AICreateModal from './components/AICreateModal';
import { endSessionButKeepGuestIndex, ensureGuestSession, getGuestSurveys, isGuestUser, addGuestSurveyId } from './lib/guest';
import QRCode from "qrcode"; // npm i qrcode

export default function Dashboard() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState({});
  const [openShare, setOpenShare] = useState(null);
  const [qr, setQr] = useState({ open: false, title: "", dataUrl: "" });
  const [showAuth, setShowAuth] = useState(false);
  const [bulkAction, setBulkAction] = useState(null); // "delete" | "duplicate"
  const [showTemplates, setShowTemplates] = useState(false);
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [showTumbleweed, setShowTumbleweed] = useState(false);
  const [showCheerfulQ, setShowCheerfulQ] = useState(false);
  const [hasShownInitialAnimation, setHasShownInitialAnimation] = useState(false);
  const [animationInProgress, setAnimationInProgress] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showSignOutPrompt, setShowSignOutPrompt] = useState(false);
  const [lastTemplateCreation, setLastTemplateCreation] = useState(null);
  const nav = useNavigate();
  const { push } = useToast();
  const { user, isAuthenticated, logout: originalLogout, userMode, isGuest, loading: authLoading } = useAuth();
  const templateRef = useRef(null);
  const buttonRef = useRef(null);

  // Custom logout handler that shows sign-out prompt
  const handleLogout = async () => {
    if (FEATURES.SIGNOUT_PROMPT) {
      setShowSignOutPrompt(true);
    } else {
      await originalLogout();
    }
  };

  // Handle sign-out prompt choice
  const handleSignOutChoice = async (choice) => {
    setShowSignOutPrompt(false);
    
    if (choice === 'cancel') {
      return;
    }

    // End session but keep guest data
    await endSessionButKeepGuestIndex();

    if (choice === 'guest') {
      // Re-create anonymous session and stay on dashboard
      const success = await ensureGuestSession();
      if (success) {
        push('Continuing as Guest', 'info');
        // Refresh surveys to show guest surveys
        window.location.reload();
      } else {
        push('Failed to continue as Guest', 'error');
      }
    } else if (choice === 'signin') {
      // Navigate to auth page
      nav('/auth');
    }
  };

  // Helper function to trigger animations safely
  const triggerAnimation = (type) => {
    if (animationInProgress) {
      console.log(`Animation already in progress, skipping ${type} animation`);
      return;
    }
    
    setAnimationInProgress(true);
    
    if (type === 'tumbleweed') {
      setShowTumbleweed(true);
    } else if (type === 'cheerfulQ') {
      setShowCheerfulQ(true);
    }
  };

  // Function to load surveys
  const loadSurveys = async () => {
    try {
      await ensureSession();
      const docs = await getMySurveys();
      
      // If user is a guest, also load guest surveys from localStorage
      if (FEATURES.GUEST_PERSIST_LOCAL) {
        const isGuest = await isGuestUser();
        if (isGuest) {
          const guestSurveys = await getGuestSurveys();
          // Merge guest surveys with regular surveys, avoiding duplicates
          const allSurveys = [...docs];
          guestSurveys.forEach(guestSurvey => {
            if (!allSurveys.find(s => s.$id === guestSurvey.$id)) {
              allSurveys.push(guestSurvey);
            }
          });
          setSurveys(allSurveys);
        } else {
          setSurveys(docs);
        }
      } else {
        setSurveys(docs);
      }
    } catch (error) {
      console.error("Failed to load surveys:", error);
      push("Failed to load surveys", "error");
    }
  };

  const loadGuestSurveys = () => {
    try {
      const guestSurveys = localStorage.getItem('questino_guest_surveys');
      return guestSurveys ? JSON.parse(guestSurveys) : [];
    } catch (e) {
      console.error("Failed to load guest surveys:", e);
      return [];
    }
  };

  const saveGuestSurveys = (surveys) => {
    try {
      localStorage.setItem('questino_guest_surveys', JSON.stringify(surveys));
    } catch (e) {
      console.error("Failed to save guest surveys:", e);
    }
  };

  useEffect(() => {
    // Don't run until auth state is determined
    if (authLoading) return;
    
    let isMounted = true;
    
    (async () => {
      try {
        // Load surveys from Appwrite (for all users)
        await ensureSession();
        const docs = await getMySurveys();
        
        if (isMounted) {
          // If user is a guest, also load guest surveys from localStorage
          let allSurveys = docs;
          if (FEATURES.GUEST_PERSIST_LOCAL) {
            const isGuest = await isGuestUser();
            if (isGuest) {
              const guestSurveys = await getGuestSurveys();
              // Merge guest surveys with regular surveys, avoiding duplicates
              allSurveys = [...docs];
              guestSurveys.forEach(guestSurvey => {
                if (!allSurveys.find(s => s.$id === guestSurvey.$id)) {
                  allSurveys.push(guestSurvey);
                }
              });
            }
          }
          
          setSurveys(allSurveys);
          
          // Check for animation trigger from other components
          const animationTrigger = localStorage.getItem('questino_trigger_animation');
          if (animationTrigger) {
            localStorage.removeItem('questino_trigger_animation');
            triggerAnimation(animationTrigger);
          } else if (!hasShownInitialAnimation) {
            // Trigger initial animation based on survey count
            if (allSurveys.length === 0) {
              triggerAnimation('tumbleweed');
            }
            setHasShownInitialAnimation(true);
          }
        }
      } catch (e) {
        console.error("Failed to load surveys:", e);
        if (isMounted) {
          push("Failed to load surveys: " + (e.message || "Unknown error"), "error");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();
    
    return () => {
      isMounted = false;
    };
  }, [push, isGuest, authLoading]);

  // Refresh surveys when user returns to dashboard (e.g., from SurveyBuilder)
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Refresh surveys when page becomes visible (user returns from another tab/page)
      if (!document.hidden && !authLoading && !loading) {
        (async () => {
          try {
            await ensureSession();
            const docs = await getMySurveys();
            setSurveys(docs);
          } catch (e) {
            console.error("Failed to refresh surveys:", e);
          }
        })();
      }
    };

    const handleFocus = () => {
      // Also refresh on window focus as backup
      if (!authLoading && !loading) {
        (async () => {
          try {
            await ensureSession();
            const docs = await getMySurveys();
            setSurveys(docs);
          } catch (e) {
            console.error("Failed to refresh surveys:", e);
          }
        })();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [authLoading, loading]);

  // Close templates dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (templateRef.current && !templateRef.current.contains(event.target)) {
        setShowTemplates(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const allChecked = useMemo(
    () => surveys.length > 0 && surveys.every((s) => checked[s.$id]),
    [surveys, checked]
  );

  const toggleAll = () => {
    if (allChecked) setChecked({});
    else setChecked(Object.fromEntries(surveys.map((s) => [s.$id, true])));
  };

  const createFromTemplate = async (templateType) => {
    // Prevent multiple calls
    if (creatingTemplate) {
      console.log('Template creation already in progress, aborting');
      return;
    }
    
    // Prevent rapid successive calls (within 2 seconds)
    const now = Date.now();
    if (lastTemplateCreation && (now - lastTemplateCreation) < 2000) {
      console.log('Template creation too recent, ignoring');
      return;
    }
    
    console.log(`Starting template creation for: ${templateType}`);
    setLastTemplateCreation(now);
    setShowTemplates(false);
    setCreatingTemplate(true);

    try {
      push("Creating survey...", "info");
      
      if (!isGuest) {
        await ensureSession();
      }
      
      // Define template data
      const templates = {
        happiness: {
          title: "Happiness Assessment",
          description: "Research-based evaluation of your wellbeing across 6 key life areas from the World Happiness Report framework",
          questions: [
            // Economic Wellbeing (1 question)
            { text: "How easily can you afford basic necessities (food, housing, healthcare)?", type: "scale", scaleMin: 0, scaleMax: 10, required: true, order: 1 },
            
            // Social Connections (2 questions)
            { text: "How satisfied are you with your family relationships?", type: "scale", scaleMin: 0, scaleMax: 10, required: true, order: 2 },
            { text: "How many people can you count on for help in tough times?", type: "scale", scaleMin: 0, scaleMax: 10, required: true, order: 3 },
            
            // Health (2 questions)
            { text: "How would you rate your overall physical health?", type: "scale", scaleMin: 0, scaleMax: 10, required: true, order: 4 },
            { text: "How would you rate your mental and emotional well-being?", type: "scale", scaleMin: 0, scaleMax: 10, required: true, order: 5 },
            
            // Freedom (1 question)
            { text: "How much control do you feel you have over your life?", type: "scale", scaleMin: 0, scaleMax: 10, required: true, order: 6 },
            
            // Purpose & Meaning (2 questions)
            { text: "How much sense of purpose do you have in life?", type: "scale", scaleMin: 0, scaleMax: 10, required: true, order: 7 },
            { text: "How meaningful does your life feel overall?", type: "scale", scaleMin: 0, scaleMax: 10, required: true, order: 8 },
            
            // Trust & Safety (1 question)
            { text: "How safe do you feel in your daily life?", type: "scale", scaleMin: 0, scaleMax: 10, required: true, order: 9 },
            
            // Overall Assessment (1 question)
            { text: "How would you rate your overall life satisfaction?", type: "scale", scaleMin: 0, scaleMax: 10, required: true, order: 10 },
            
            // Open-ended questions for emotion analysis
            { text: "What aspects of your life bring you the most joy?", type: "text", required: false, order: 11 },
            { text: "What challenges or stressors are you currently facing?", type: "text", required: false, order: 12 },
            { text: "What would you most like to improve in your life?", type: "text", required: false, order: 13 },
            { text: "Describe a recent moment when you felt truly happy or fulfilled.", type: "text", required: false, order: 14 },
            { text: "What gives your life the most meaning and purpose?", type: "text", required: false, order: 15 }
          ]
        },
        feedback: {
          title: "Customer Feedback Survey",
          description: "Help us improve our service by sharing your experience",
          questions: [
            { text: "How likely are you to recommend our service to a friend or colleague?", type: "scale", scaleMin: 0, scaleMax: 10, required: true, order: 1 },
            { text: "How satisfied are you with our customer service?", type: "scale", scaleMin: 1, scaleMax: 5, required: true, order: 2 },
            { text: "How would you rate the quality of our product/service?", type: "scale", scaleMin: 1, scaleMax: 5, required: true, order: 3 },
            { text: "How easy was it to use our service?", type: "scale", scaleMin: 1, scaleMax: 5, required: true, order: 4 },
            { text: "What did you like most about our service?", type: "text", required: false, order: 5 },
            { text: "What could we improve?", type: "text", required: false, order: 6 },
            { text: "Any additional comments or suggestions?", type: "text", required: false, order: 7 }
          ]
        },
        employee: {
          title: "Employee Engagement Survey",
          description: "Help us understand your work experience and improve our workplace culture",
          questions: [
            { text: "How satisfied are you with your current role?", type: "scale", scaleMin: 1, scaleMax: 5, required: true, order: 1 },
            { text: "How would you rate your work-life balance?", type: "scale", scaleMin: 1, scaleMax: 5, required: true, order: 2 },
            { text: "How satisfied are you with your manager's support?", type: "scale", scaleMin: 1, scaleMax: 5, required: true, order: 3 },
            { text: "How would you rate the company culture?", type: "scale", scaleMin: 1, scaleMax: 5, required: true, order: 4 },
            { text: "How likely are you to recommend this company as a place to work?", type: "scale", scaleMin: 0, scaleMax: 10, required: true, order: 5 },
            { text: "What do you enjoy most about working here?", type: "text", required: false, order: 6 },
            { text: "What would you like to see improved?", type: "text", required: false, order: 7 }
          ]
        }
      };

      const template = templates[templateType];
      if (!template) {
        push("Template not found", "error");
        return;
      }

      let survey;
      
      // Create survey in Appwrite (for all users)
      survey = await createSurvey({
        title: template.title,
        description: template.description,
        allowAnonymous: true,
        isPublic: true
      });
      
      if (!survey || !survey.$id) {
        throw new Error("Survey creation failed");
      }

      // Add to guest survey index if user is a guest
      if (FEATURES.GUEST_PERSIST_LOCAL) {
        const isGuest = await isGuestUser();
        if (isGuest) {
          addGuestSurveyId(survey.$id);
        }
      }

      // Check if the title was modified due to name conflict
      if (survey.title !== template.title) {
        push(`Survey renamed to "${survey.title}" to avoid duplicates`, "info");
      }
      
      // Create the questions
      push(`Creating ${template.questions.length} questions...`, "info");
      
      const questionPromises = template.questions.map(questionData => 
        addQuestion(survey.$id, questionData)
      );
      
      await Promise.all(questionPromises);

      // Show success message and navigate to the survey
      push(`✅ ${template.title} created successfully!`, "success");
      
      // Refresh surveys list
      const updatedSurveys = await getMySurveys();
      setSurveys(updatedSurveys);
      
      nav(`/edit/${survey.$id}`);
      
    } catch (error) {
      console.error("Template creation failed:", error);
      push(`Failed to create survey: ${error.message}`, "error");
    } finally {
      setCreatingTemplate(false);
      // Reset the timestamp after a delay to allow for proper cleanup
      setTimeout(() => {
        setLastTemplateCreation(null);
      }, 3000);
    }
  };

  const selectedCount = Object.values(checked).filter(Boolean).length;

  const handleBulkDelete = async () => {
    const selectedIds = Object.entries(checked)
      .filter(([_, isChecked]) => isChecked)
      .map(([id, _]) => id);

    if (selectedIds.length === 0) {
      push("No surveys selected", "warning");
      return;
    }

    if (!confirm(`Delete ${selectedIds.length} survey(s)? This cannot be undone.`)) {
      return;
    }

    try {
      push("Deleting surveys...", "info");
      // Import deleteSurveys from surveyApi
      const { deleteSurveys } = await import("./surveyApi");
      await deleteSurveys(selectedIds);
      
      setSurveys(prev => prev.filter(s => !selectedIds.includes(s.$id)));
      setChecked({});
      push(`✅ Deleted ${selectedIds.length} survey(s)`, "success");
      
      // Trigger tumbleweed animation for survey deletion
      triggerAnimation('tumbleweed');
    } catch (error) {
      push(`Failed to delete surveys: ${error.message}`, "error");
      console.error(error);
    }
  };

  const handleBulkDuplicate = async () => {
    const selectedSurveys = surveys.filter(s => checked[s.$id]);
    
    if (selectedSurveys.length === 0) {
      push("No surveys selected", "warning");
      return;
    }

    try {
      push(`Duplicating ${selectedSurveys.length} survey(s)...`, "info");
      const { createSurvey, getQuestionsForSurvey, addQuestion } = await import("./surveyApi");
      
      // Get current surveys to resolve copy name conflicts
      const currentSurveys = await getMySurveys();
      
      for (const survey of selectedSurveys) {
        // Resolve copy name conflict
        const copyTitle = resolveCopyNameConflict(survey.title, currentSurveys);
        
        // Create new survey with resolved copy name
        const newSurvey = await createSurvey({
          title: copyTitle,
          description: survey.description,
          allowAnonymous: survey.allowAnonymous,
          isPublic: survey.isPublic,
          statsPublic: survey.statsPublic,
        });

        // Copy questions
        const questions = await getQuestionsForSurvey(survey.$id);
        for (const [index, question] of questions.entries()) {
          await addQuestion(newSurvey.$id, {
            text: question.text,
            type: question.type,
            required: question.required,
            order: index + 1,
            options: question.type === "mcq" ? question.options : undefined,
            scaleMin: question.type === "scale" ? question.scaleMin : undefined,
            scaleMax: question.type === "scale" ? question.scaleMax : undefined,
          });
        }
      }

      // Refresh surveys
      const docs = await getMySurveys();
      setSurveys(docs);
      setChecked({});
      push(`✅ Duplicated ${selectedSurveys.length} survey(s)`, "success");
    } catch (error) {
      push(`Failed to duplicate surveys: ${error.message}`, "error");
      console.error(error);
    }
  };

  const makePublicBadge = (s) => (
    <span
      className={`ml-2 rounded-full px-2 py-0.5 text-[11px] ${
        s.isPublic ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
      }`}
      title={s.isPublic ? "This survey is public" : "This survey is private"}
    >
      {s.isPublic ? "Public" : "Private"}
    </span>
  );

  const onShare = async (s, action) => {
    const url = `${window.location.origin}/s/${s.slug}`;
    try {
      if (action === "copy") {
        await navigator.clipboard.writeText(url);
        push("✅ Public link copied to clipboard", "success");
      } else if (action === "qr") {
        const dataUrl = await QRCode.toDataURL(url, { margin: 1, scale: 6 });
        setQr({ open: true, title: s.title || "Survey", dataUrl });
      }
    } catch (error) {
      push(`Failed to ${action === "copy" ? "copy link" : "generate QR code"}: ${error.message}`, "error");
    }
    setOpenShare(null);
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative overflow-hidden">
      {/* Simplified background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-transparent to-cyan-50/30"></div>
      
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200/30 sticky top-0 z-50 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">Q</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Questino.io</h1>
                  <p className="text-sm text-gray-600 font-medium">Survey Platform</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative" ref={templateRef}>
                <FireButton
                  ref={buttonRef}
                  onClick={() => setShowTemplates(!showTemplates)}
                  disabled={showTemplates}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                >
                  <span className="icon-plus" />
                  Create Survey
                  <span className="icon-chevron-down ml-1" />
                </FireButton>
                <div className={`absolute top-full right-0 mt-2 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/50 z-[99999999] transition-all duration-300 ease-out transform ${
                  showTemplates 
                    ? 'opacity-100 translate-y-0 scale-100' 
                    : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
                }`}>
                <div onClick={(e) => e.stopPropagation()}>
                    <div className="p-4">
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4 px-2">Templates</div>
                      <button 
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (creatingTemplate) {
                            console.log('Template creation already in progress, ignoring click');
                            return;
                          }
                          try {
                            await createFromTemplate('happiness');
                          } catch (error) {
                            console.error('Template creation failed:', error);
                            push(`Failed to create template: ${error.message}`, "error");
                          }
                        }}
                        disabled={creatingTemplate}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 rounded-xl flex items-center gap-3 mb-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-transparent hover:border-indigo-200/50"
                      >
                        <span className="text-lg">🌟</span>
                        <div className="flex-1">
                          <div className="font-medium">Happiness Assessment</div>
                          <div className="text-xs text-gray-500">15 questions across key life areas</div>
                        </div>
                        {creatingTemplate && <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>}
                      </button>
                      <button 
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (creatingTemplate) return;
                          try {
                            await createFromTemplate('feedback');
                          } catch (error) {
                            push(`Failed to create template: ${error.message}`, "error");
                          }
                        }}
                        disabled={creatingTemplate}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 rounded-xl flex items-center gap-3 mb-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-transparent hover:border-indigo-200/50"
                      >
                        <span className="text-lg">💬</span>
                        <div>
                          <div className="font-medium">Customer Feedback</div>
                          <div className="text-xs text-gray-500">NPS, satisfaction, and open feedback</div>
                        </div>
                      </button>
                      <button 
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (creatingTemplate) return;
                          try {
                            await createFromTemplate('employee');
                          } catch (error) {
                            push(`Failed to create template: ${error.message}`, "error");
                          }
                        }}
                        disabled={creatingTemplate}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 rounded-xl flex items-center gap-3 mb-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-transparent hover:border-indigo-200/50"
                      >
                        <span className="text-lg">👥</span>
                        <div>
                          <div className="font-medium">Employee Engagement</div>
                          <div className="text-xs text-gray-500">Work satisfaction and culture</div>
                        </div>
                      </button>
                      <div className="border-t border-gray-100 my-2"></div>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowTemplates(false);
                          nav("/create");
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-md flex items-center gap-2"
                      >
                        <span className="text-lg">📝</span>
                        <div>
                          <div className="font-medium">Start from scratch</div>
                          <div className="text-xs text-gray-500">Build your own custom survey</div>
                        </div>
                      </button>
                      
                      {FEATURES.AI_BUILDER && (
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowTemplates(false);
                            setShowAIModal(true);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-md flex items-center gap-2"
                        >
                          <span className="text-lg">🤖</span>
                          <div>
                            <div className="font-medium">Start from scratch (AI)</div>
                            <div className="text-xs text-gray-500">AI-powered survey generation</div>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Hi, {user?.name || user?.email}</span>
                  <button 
                    onClick={handleLogout} 
                    className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center hover:from-gray-300 hover:to-gray-400 transition-all duration-200" 
                    title="Sign out"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <button onClick={() => setShowAuth(true)} className="btn btn-ghost">
                    <span className="icon-user" /> Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 relative z-10">
        {/* Add top margin to prevent dropdown overlap */}
        <div className="mt-80"></div>
        <div className="mb-6 flex items-center justify-between">
          <div
            className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none"
            onClick={toggleAll}
            role="button"
          >
            <input
              id="sel-all"
              type="checkbox"
              className="cursor-pointer"
              checked={allChecked}
              onChange={(e) => {
                e.stopPropagation();
                toggleAll();
              }}
            />
            <label htmlFor="sel-all">Select all</label>
            <span className="text-gray-500">{surveys.length} total</span>
          </div>

          {selectedCount > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">{selectedCount} selected</span>
              <button
                onClick={handleBulkDuplicate}
                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                title="Duplicate selected surveys"
              >
                <span className="icon-copy" /> Duplicate
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                title="Delete selected surveys"
              >
                <span className="icon-trash-2" /> Delete
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            <LoadingSkeleton lines={3} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card p-4">
                  <LoadingSkeleton lines={2} />
                </div>
              ))}
            </div>
          </div>
        ) : surveys.length === 0 ? (
          <div className="mt-20 grid place-items-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 w-full max-w-lg p-12 text-center shadow-xl">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <span className="icon-plus text-3xl text-indigo-500" />
              </div>
              <div className="mb-4 text-2xl font-bold text-gray-900">
                {isAuthenticated ? "No surveys yet" : "Sign in to manage your surveys"}
              </div>
              <p className="text-gray-600 text-lg mb-8">
                {isAuthenticated 
                  ? 'Create your first survey to start collecting insights and feedback.'
                  : "Create an account to save and manage your surveys."
                }
              </p>
              {!isAuthenticated && (
                <button 
                  onClick={() => setShowAuth(true)} 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 mx-auto"
                >
                  <span className="icon-user" />
                  Get Started
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {surveys.map((s, index) => (
              <div 
                key={s.$id} 
                data-survey-id={s.$id}
                className="survey-card rounded-2xl p-6 border-l-4 border-l-indigo-500 group relative z-10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      className="cursor-pointer rounded border-gray-300 mt-1 flex-shrink-0"
                      checked={!!checked[s.$id]}
                      onChange={() => setChecked((c) => ({ ...c, [s.$id]: !c[s.$id] }))}
                    />
                    <div className="flex-1 min-w-0">
                      <button
                        className="text-left text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors group-hover:text-indigo-600 break-words leading-tight"
                        onClick={() => nav(`/edit/${s.$id}`)}
                        title="Edit survey"
                      >
                        {s.title || "Untitled survey"}
                      </button>
                      <div className="mt-3 flex items-center gap-3 text-sm">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          s.isPublic 
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}>
                          {s.isPublic ? "🌐 Public" : "🔒 Private"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button 
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all duration-200 flex items-center gap-2" 
                      onClick={() => nav(`/stats/${s.$id}`)}
                      title="View statistics"
                    >
                      <span className="icon-bar-chart" />
                      Stats
                    </button>
                    
                    <div className="relative">
                      <button
                        className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                        onClick={() => setOpenShare(openShare === s.$id ? null : s.$id)}
                      >
                        <span className="icon-share-2" />
                        Share
                      </button>

                      {openShare === s.$id && createPortal(
                        <div className="fixed w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200/50 z-[999999999] animate-in scale-in" 
                             style={{
                               top: `${document.querySelector(`[data-survey-id="${s.$id}"]`)?.getBoundingClientRect().bottom + window.scrollY + 8}px`,
                               left: `${document.querySelector(`[data-survey-id="${s.$id}"]`)?.getBoundingClientRect().right - 192 + window.scrollX}px`
                             }}
                             onMouseLeave={() => setOpenShare(null)}>
                          <button className="w-full text-left px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 rounded-lg flex items-center gap-3 transition-all duration-200" onClick={() => onShare(s, "copy")}>
                            <span className="icon-copy" />
                            Copy public link
                          </button>
                          <button className="w-full text-left px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 rounded-lg flex items-center gap-3 transition-all duration-200" onClick={() => onShare(s, "qr")}>
                            <span className="icon-qr-code" />
                            Show QR code
                          </button>
                        </div>,
                        document.body
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {qr.open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50"
          onClick={() => setQr({ open: false, dataUrl: "", title: "" })}
        >
          <div className="card p-6 w-[360px]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 text-sm text-gray-500">Share</div>
            <div className="text-lg font-semibold">{qr.title}</div>
            <img
              src={qr.dataUrl}
              alt="QR"
              className="mx-auto my-4 h-56 w-56 rounded-xl bg-white p-2 shadow-inner"
            />
            <button
              className="btn btn-primary w-full"
              onClick={async () => {
                try {
                  const blob = await (await fetch(qr.dataUrl)).blob();
                  const file = new File([blob], "survey-qr.png", { type: "image/png" });
                  if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: qr.title });
                  } else {
                    const a = document.createElement("a");
                    a.href = qr.dataUrl;
                    a.download = "survey-qr.png";
                    a.click();
                  }
                } catch {
                  push("Could not share QR", "error");
                }
              }}
            >
              Download / Share
            </button>
          </div>
        </div>
      )}

      <AuthModal 
        open={showAuth} 
        onClose={() => setShowAuth(false)}
        onSuccess={() => {
          // Refresh surveys after successful auth
          window.location.reload();
        }}
      />

      {showAIModal && (
        <AICreateModal 
          onClose={() => setShowAIModal(false)} 
          onSurveyCreated={() => {
            // Refresh surveys list
            loadSurveys();
          }}
        />
      )}

      {/* Animation Components */}
      {showTumbleweed && (
        <TumbleweedAnimation onComplete={() => {
          setShowTumbleweed(false);
          setAnimationInProgress(false);
        }} />
      )}
      
      {showCheerfulQ && (
        <CheerfulQAnimation onComplete={() => {
          setShowCheerfulQ(false);
          setAnimationInProgress(false);
        }} />
      )}

      {showSignOutPrompt && (
        <SignOutPrompt 
          onChoice={handleSignOutChoice}
          onClose={() => setShowSignOutPrompt(false)}
        />
      )}
    </div>
  );
}
