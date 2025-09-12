import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSurveyBySlug, getQuestionsForSurvey, listResponsesBySurvey, listAnalysisJoinedBySurvey } from "../surveyApi";
import { computeStats } from "../utils/computeStats";
import { useToast } from "./Toast";
import { Histogram, PieChart, AnimatedBarChart, EmotionRadar } from "./Charts";
import { LoadingSkeleton } from "./LoadingSpinner";
import EmotionTrends from "./EmotionTrends";
import AIInsightsCard from "./AIInsightsCard";
import { FEATURES } from "../featureFlags";

export default function PublicStats() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState([]);
  const [analysis, setAnalysis] = useState([]);
  const [stats, setStats] = useState({});

  // Compute overall emotions (optional global view)
  const nluAvg = useMemo(() => {
    if (!analysis || analysis.length === 0) return null;
    const keys = ["joy", "sadness", "anger", "fear", "disgust"];
    const sums = Object.fromEntries(keys.map((k) => [k, 0]));
    analysis.forEach((a) => keys.forEach((k) => (sums[k] += Number(a[k] || 0))));
    return Object.fromEntries(keys.map((k) => [k, sums[k] / analysis.length]));
  }, [analysis]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get survey data
        const surveyData = await getSurveyBySlug(slug);
        if (!surveyData) {
          push("Survey not found", "error");
          navigate('/');
          return;
        }

        // Check if stats are public
        if (!surveyData.statsPublic) {
          push("Stats are not public for this survey", "error");
          navigate('/');
          return;
        }

        setSurvey(surveyData);

        // Get questions, responses, and analysis
        const [questionsData, responsesData, analysisData] = await Promise.all([
          getQuestionsForSurvey(surveyData.$id),
          listResponsesBySurvey(surveyData.$id),
          listAnalysisJoinedBySurvey(surveyData.$id).catch(() => ({ responses: [], analysis: [] }))
        ]);

        setQuestions(questionsData);
        setResponses(responsesData);
        setAnalysis((analysisData && analysisData.analysis) || []);

        // Compute stats
        if (questionsData.length > 0 && responsesData.length > 0) {
          const computedStats = computeStats(questionsData, responsesData);
          setStats(computedStats);
        }

        console.log(`📊 Loaded ${responsesData?.length || 0} responses and ${analysisData?.analysis?.length || 0} analysis records`);

      } catch (error) {
        console.error("Failed to load public stats:", error);
        push("Failed to load survey results", "error");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug, push, navigate]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-gray-50">
        <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="loading-skeleton h-8 w-16" />
          <div className="loading-skeleton h-6 w-32" />
          <div className="loading-skeleton h-8 w-20" />
        </header>
        <main className="mx-auto max-w-5xl px-4 pb-24">
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="card p-4">
              <LoadingSkeleton lines={2} />
            </div>
            <div className="card p-4 md:col-span-2">
              <LoadingSkeleton lines={3} />
            </div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card p-4">
                <LoadingSkeleton lines={4} />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!survey || !questions.length || !responses.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">No Results Yet</h1>
          <p className="text-gray-600 mb-6">This survey hasn't received any responses yet.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{survey.title}</h1>
              <p className="text-gray-600">{survey.description}</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Analytics Section */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Top Row - Overview Cards */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <div className="survey-card p-6 animate-in fade-in-up border-l-4 border-l-brand-500 shadow-lg group relative">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
                <span className="icon-bar-chart text-brand-600 text-xl"></span>
              </div>
              <div>
                <div className="text-sm text-gray-500">Total responses</div>
                <div className="mt-1 text-3xl font-bold tabular-nums text-brand-600">{responses.length}</div>
              </div>
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Number of completed survey responses
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>

          <div className="survey-card p-6 animate-in fade-in-up border-l-4 border-l-accent-500 shadow-lg group relative">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center">
                <span className="icon-brain text-accent-600 text-xl"></span>
              </div>
              <div>
                <div className="text-sm text-gray-500">Analysis records</div>
                <div className="mt-1 text-3xl font-bold tabular-nums text-accent-600">{analysis.length}</div>
              </div>
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              AI emotion analysis records for responses
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>

          <div className="survey-card p-6 animate-in fade-in-up border-l-4 border-l-green-500 shadow-lg group relative">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="icon-trending-up text-green-600 text-xl"></span>
              </div>
              <div>
                <div className="text-sm text-gray-500">Completion rate</div>
                <div className="mt-1 text-3xl font-bold tabular-nums text-green-600">
                  {responses.length > 0 ? Math.round((responses.length / Math.max(questions.length, 1)) * 100) : 0}%
                </div>
              </div>
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Responses ÷ Questions × 100
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
        </div>

        {/* AI Insights Row */}
        {FEATURES.INSIGHTS_ASSISTANT && (
          <div className="mb-8">
            <AIInsightsCard
              survey={survey}
              stats={stats}
              emotions={nluAvg}
              weekSummary={{ positivePct: 80 }}
              questions={questions}
              responses={responses}
            />
          </div>
        )}

        {nluAvg && (
          <div className="mt-8">
            <div className="survey-card p-6 animate-in fade-in-up" style={{ animationDelay: '100ms' }}>
              <EmotionRadar emotions={nluAvg} title="Overall emotion analysis" />
            </div>
          </div>
        )}

        {/* Analysis Status */}
        {responses.length > 0 && analysis.length === 0 && (
          <div className="mt-8">
            <div className="survey-card p-6 animate-in fade-in-up border-l-4 border-l-yellow-500 shadow-lg bg-yellow-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <span className="icon-clock text-yellow-600 text-xl"></span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800">Analysis in Progress</h3>
                  <p className="text-sm text-yellow-700">
                    Watson NLU is processing {responses.length} response{responses.length !== 1 ? 's' : ''}. 
                    This may take a few moments. Results will appear here once analysis is complete.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Factor Analysis for Slider Questions */}
        {questions.some(q => q.type === "slider") && (
          <div className="mt-8">
            <div className="survey-card p-6 animate-in fade-in-up border-l-4 border-l-brand-500 shadow-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="icon-trending-up text-brand-600"></span>
                Factor Analysis
              </h3>
              <FactorBreakdown questions={questions} responses={responses} />
            </div>
          </div>
        )}

        {/* Basic Stats Section */}
        {Object.keys(stats).length > 0 && (
          <div className="mt-8">
            <div className="survey-card p-6 animate-in fade-in-up border-l-4 border-l-green-500 shadow-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="icon-bar-chart text-green-600"></span>
                Basic Statistics
              </h3>
              <div className="space-y-6">
                {questions.map((q, index) => {
                  const questionStats = stats[q.$id];
                  if (!questionStats || questionStats.count === 0) return null;
                  
                  return (
                    <div key={q.$id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="mb-3 font-medium text-gray-800">{q.text || "(Untitled question)"}</div>
                      
                      {questionStats.type === 'multiple_choice' && (
                        <div className="space-y-3">
                          <div className="text-sm text-gray-600 mb-2">Responses: {questionStats.count}</div>
                          <PieChart 
                            data={Object.entries(questionStats.counts).map(([option, count]) => ({
                              label: option,
                              value: count
                            }))}
                            title="Response Distribution"
                          />
                        </div>
                      )}
                      
                      {questionStats.type === 'scale' && (
                        <div className="space-y-3">
                          <div className="text-sm text-gray-600 mb-2">Responses: {questionStats.count}</div>
                          <div className="text-lg font-semibold text-brand-600">
                            Average: {questionStats.average}
                          </div>
                          {questionStats.min !== undefined && questionStats.max !== undefined && (
                            <div className="text-sm text-gray-500">
                              Range: {questionStats.min} - {questionStats.max}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {questionStats.type === 'yes_no' && (
                        <div className="space-y-3">
                          <div className="text-sm text-gray-600 mb-2">Responses: {questionStats.count}</div>
                          <PieChart 
                            data={[
                              { label: 'Yes', value: questionStats.yes },
                              { label: 'No', value: questionStats.no }
                            ]}
                            title="Yes/No Distribution"
                          />
                        </div>
                      )}
                      
                      {questionStats.type === 'text' && (
                        <div className="text-sm text-gray-600">
                          Text responses: {questionStats.count}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Emotion Trends Section */}
        <EmotionTrends questionnaireId={survey?.$id} />

        {/* Per-question breakdown with NLU for text questions */}
        <div className="mt-8 space-y-6">
          {questions.map((q, index) => (
            <div key={q.$id} className="survey-card p-6 animate-in fade-in-up hover:shadow-lg transition-all duration-300 border-l-4 border-l-accent-500" style={{ animationDelay: `${(index + 2) * 100}ms` }}>
              <div className="mb-1 font-semibold">{q.text || "(Untitled question)"}</div>

              {q.type === "text" ? (
                <TextStats q={q} responses={responses} analysis={analysis} />
              ) : q.type === "scale" ? (
                <ScaleStats q={q} responses={responses} />
              ) : q.type === "slider" ? (
                <SliderStats q={q} responses={responses} />
              ) : (
                <ChoiceStats q={q} responses={responses} />
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

/* ---------- Helper Functions for each question type ---------- */

function TextStats({ q, responses, analysis }) {
  // collect text answers & remember which responseIds answered this question
  const items = [];
  const answeredResponseIds = new Set();

  responses.forEach((r) => {
    try {
      const obj = JSON.parse(r.answers || "{}");
      const val = obj[q.$id];
      if (typeof val === "string" && val.trim()) {
        items.push({ text: val.trim(), responseId: r.$id, when: r.$createdAt });
        answeredResponseIds.add(r.$id);
      }
    } catch {}
  });

  if (items.length === 0)
    return <div className="text-sm text-gray-500">No answers yet.</div>;

  // aggregate Watson NLU for those responses that answered THIS question
  const emotionKeys = ["joy", "sadness", "anger", "fear", "disgust"];
  const sums = Object.fromEntries(emotionKeys.map((k) => [k, 0]));
  let countWithAnalysis = 0;
  let sentimentSum = 0;
  let sentimentCount = 0;

  analysis.forEach((a) => {
    // Filter by responseId AND questionId (if available)
    if (!answeredResponseIds.has(a.responseId)) return;
    if (a.questionId && a.questionId !== q.$id) return;

    let hasAny = false;
    emotionKeys.forEach((k) => {
      if (a[k] != null) {
        sums[k] += Number(a[k] || 0);
        hasAny = true;
      }
    });
    if (hasAny) countWithAnalysis++;

    // optional sentiment support
    if (typeof a.sentiment === "number") {
      sentimentSum += a.sentiment; sentimentCount++;
    } else if (typeof a.sentiment_score === "number") {
      sentimentSum += a.sentiment_score; sentimentCount++;
    } else if (typeof a.sentiment_label === "string") {
      const m = { positive: 1, neutral: 0, negative: -1 };
      if (a.sentiment_label in m) { sentimentSum += m[a.sentiment_label]; sentimentCount++; }
    }
  });

  const emotionAvg =
    countWithAnalysis > 0
      ? Object.fromEntries(emotionKeys.map((k) => [k, sums[k] / countWithAnalysis]))
      : null;

  const sentimentAvg = sentimentCount > 0 ? sentimentSum / sentimentCount : null;

  const recent = items.slice(-10).reverse().map((x) => x.text);

  return (
    <div className="space-y-3">
      {emotionAvg ? (
        <div className="space-y-4">
          <EmotionRadar emotions={emotionAvg} title="Emotion analysis for this question" />
          {sentimentAvg != null && (
            <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
              <span className="font-semibold">Average sentiment: {sentimentAvg.toFixed(3)}</span>
              <span className="opacity-70 ml-2">(−1 = negative, +1 = positive)</span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
          No Watson NLU analysis available for this question yet.
        </div>
      )}

      <div>
        <div className="mb-1 text-sm text-gray-500">
          {items.length} text answers · showing last {recent.length}
        </div>
        <ul className="space-y-2">
          {recent.map((t, i) => (
            <li key={i} className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ScaleStats({ q, responses }) {
  const values = [];
  responses.forEach((r) => {
    try {
      const obj = JSON.parse(r.answers || "{}");
      const val = Number(obj[q.$id]);
      if (!Number.isNaN(val)) values.push(val);
    } catch {}
  });
  
  if (values.length === 0) {
    return <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">No answers yet.</div>;
  }
  
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const min = q.scaleMin || Math.min(...values);
  const max = q.scaleMax || Math.max(...values);
  
  return (
    <div className="space-y-4">
      <div className="text-sm p-3 bg-gray-50 rounded-lg">
        <span className="font-semibold">Average: {avg.toFixed(2)}</span>
        <span className="ml-4">Responses: <span className="font-semibold">{values.length}</span></span>
      </div>
      <Histogram 
        data={values} 
        min={min} 
        max={max} 
        title="Response distribution"
      />
    </div>
  );
}

function ChoiceStats({ q, responses }) {
  let opts = [];
  try {
    opts = Array.isArray(q.options) ? q.options : JSON.parse(q.options || "[]");
  } catch {
    opts = [];
  }

  const counts = new Map();
  opts.forEach((o) => counts.set(o, 0));

  responses.forEach((r) => {
    try {
      const obj = JSON.parse(r.answers || "{}");
      const ans = obj[q.$id];
      if (ans == null) return;
      if (Array.isArray(ans)) {
        ans.forEach((a) => counts.set(a, (counts.get(a) || 0) + 1));
      } else {
        counts.set(ans, (counts.get(ans) || 0) + 1);
      }
    } catch {}
  });

  const entries = [...counts.entries()];
  if (entries.length === 0) {
    return <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">No answers yet.</div>;
  }

  const chartData = entries.map(([label, value]) => ({ label, value }));

  return (
    <div className="space-y-4">
      <AnimatedBarChart data={chartData} title="Response distribution" />
      <PieChart data={chartData} title="Response breakdown" />
    </div>
  );
}

function SliderStats({ q, responses }) {
  const values = [];
  
  responses.forEach((r) => {
    try {
      const obj = JSON.parse(r.answers || "{}");
      const val = obj[q.$id];
      if (typeof val === "number" && !isNaN(val)) {
        values.push(val);
      }
    } catch {}
  });

  if (values.length === 0) {
    return <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">No answers yet.</div>;
  }

  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const median = values.sort((a, b) => a - b)[Math.floor(values.length / 2)];

  // Create histogram data
  const bins = 10;
  const range = (q.scaleMax || 10) - (q.scaleMin || 0);
  const binSize = range / bins;
  const histogram = Array(bins).fill(0);
  
  values.forEach(val => {
    const binIndex = Math.min(Math.floor((val - (q.scaleMin || 0)) / binSize), bins - 1);
    histogram[binIndex]++;
  });

  const histogramData = histogram.map((count, i) => ({
    label: `${((q.scaleMin || 0) + i * binSize).toFixed(1)}-${((q.scaleMin || 0) + (i + 1) * binSize).toFixed(1)}`,
    value: count
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-brand-50 rounded-lg">
          <div className="text-2xl font-bold text-brand-600">{avg.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Average</div>
        </div>
        <div className="text-center p-3 bg-accent-50 rounded-lg">
          <div className="text-2xl font-bold text-accent-600">{median.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Median</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{max.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Highest</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{min.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Lowest</div>
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="font-medium text-gray-700">Distribution</h4>
        <AnimatedBarChart data={histogramData} title="Response distribution" />
      </div>
    </div>
  );
}

function FactorBreakdown({ questions, responses }) {
  // Group slider questions by potential factors (based on keywords in question text)
  const factors = {
    "Economic Wellbeing": [],
    "Social Connections": [],
    "Health & Wellness": [],
    "Personal Freedom": [],
    "Purpose & Meaning": [],
    "Trust & Safety": [],
    "Other": []
  };

  const factorKeywords = {
    "Economic Wellbeing": ["income", "financial", "money", "economic", "afford", "save", "expense"],
    "Social Connections": ["family", "friend", "social", "relationship", "support", "community", "belong"],
    "Health & Wellness": ["health", "energy", "sleep", "fitness", "mental", "emotional", "wellness"],
    "Personal Freedom": ["control", "freedom", "autonomy", "decision", "work-life", "balance", "independence"],
    "Purpose & Meaning": ["purpose", "meaning", "growth", "work", "contribute", "help", "generous"],
    "Trust & Safety": ["safe", "secure", "trust", "reliable", "government", "fair", "crime"]
  };

  questions.filter(q => q.type === "slider").forEach(q => {
    const text = q.text.toLowerCase();
    let assigned = false;
    
    for (const [factor, keywords] of Object.entries(factorKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        factors[factor].push(q);
        assigned = true;
        break;
      }
    }
    
    if (!assigned) {
      factors["Other"].push(q);
    }
  });

  // Calculate factor scores
  const factorScores = {};
  
  Object.entries(factors).forEach(([factorName, factorQuestions]) => {
    if (factorQuestions.length === 0) return;
    
    const factorValues = [];
    responses.forEach(r => {
      try {
        const answers = JSON.parse(r.answers || "{}");
        const questionValues = factorQuestions
          .map(q => answers[q.$id])
          .filter(val => typeof val === "number" && !isNaN(val));
        
        if (questionValues.length > 0) {
          factorValues.push(questionValues.reduce((sum, val) => sum + val, 0) / questionValues.length);
        }
      } catch {}
    });
    
    if (factorValues.length > 0) {
      factorScores[factorName] = {
        average: factorValues.reduce((sum, val) => sum + val, 0) / factorValues.length,
        count: factorValues.length,
        questions: factorQuestions.length
      };
    }
  });

  if (Object.keys(factorScores).length === 0) {
    return <div className="text-sm text-gray-500">No slider questions found for factor analysis.</div>;
  }

  // Sort factors by score
  const sortedFactors = Object.entries(factorScores).sort((a, b) => b[1].average - a[1].average);

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Analysis of {Object.values(factorScores).reduce((sum, f) => sum + f.count, 0)} responses across {Object.keys(factorScores).length} life areas
      </div>
      
      <div className="space-y-3">
        {sortedFactors.map(([factorName, data]) => {
          const percentage = (data.average / 10) * 100;
          const isHigh = data.average >= 7;
          const isLow = data.average <= 4;
          
          return (
            <div key={factorName} className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-gray-800">{factorName}</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{data.count} responses</span>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                    isHigh ? 'bg-green-100 text-green-800' : 
                    isLow ? 'bg-red-100 text-red-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {data.average.toFixed(1)}/10
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    isHigh ? 'bg-green-500' : 
                    isLow ? 'bg-red-500' : 
                    'bg-yellow-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              <div className="text-xs text-gray-500 mt-1">
                Based on {data.questions} question{data.questions !== 1 ? 's' : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
