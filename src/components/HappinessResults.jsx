import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from './Toast.jsx';
import { getSurveyById } from '../surveyApi';

export default function HappinessResults() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const [sharing, setSharing] = useState(false);
  const [freshSurvey, setFreshSurvey] = useState(null);

  // Get the latest response data from localStorage or URL params
  const responseData = useMemo(() => {
    try {
      // Try to get from URL params first (if redirected from survey completion)
      const urlParams = new URLSearchParams(window.location.search);
      const responseId = urlParams.get('responseId');
      const surveyId = urlParams.get('surveyId');
      
      if (responseId && surveyId) {
        // Get from localStorage
        const guestResponses = localStorage.getItem('questino_guest_responses');
        const guestSurveys = localStorage.getItem('questino_guest_surveys');
        
        if (guestResponses && guestSurveys) {
          const responses = JSON.parse(guestResponses);
          const surveys = JSON.parse(guestSurveys);
          
          const response = responses.find(r => r.$id === responseId);
          const survey = surveys.find(s => s.$id === surveyId);
          
          if (response && survey) {
            return { response, survey };
          }
        }
      }
      
      // Fallback: get latest response for this survey
      const guestResponses = localStorage.getItem('questino_guest_responses');
      const guestSurveys = localStorage.getItem('questino_guest_surveys');
      
      if (guestResponses && guestSurveys) {
        const responses = JSON.parse(guestResponses);
        const surveys = JSON.parse(guestSurveys);
        
        const survey = surveys.find(s => s.slug === slug);
        if (survey) {
          const surveyResponses = responses.filter(r => r.questionnaireId === survey.$id);
          const latestResponse = surveyResponses[surveyResponses.length - 1];
          
          if (latestResponse) {
            return { response: latestResponse, survey };
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error loading response data:', error);
      return null;
    }
  }, [slug]);

  const insights = useMemo(() => {
    if (!responseData) {
      console.log('No response data found');
      return null;
    }

    const { response, survey } = responseData;
    console.log('Response data:', response);
    console.log('Survey data:', survey);
    console.log('Survey statsPublic:', survey?.statsPublic);
    
    const answers = JSON.parse(response.answers || '{}');
    console.log('Parsed answers:', answers);
    
    // Get questions in order - try different possible structures
    let questions = [];
    if (survey.questions && Array.isArray(survey.questions)) {
      questions = survey.questions;
    } else if (survey.questions && typeof survey.questions === 'object') {
      // If questions is an object, convert to array
      questions = Object.values(survey.questions);
    }
    
    const orderedQuestions = questions.sort((a, b) => (a.order || 0) - (b.order || 0));
    console.log('Questions found:', questions.length);
    console.log('Ordered questions:', orderedQuestions);

    // Map question order to answers
    const questionScores = {};
    orderedQuestions.forEach(q => {
      const answer = answers[q.$id];
      if (answer !== undefined && answer !== null && answer !== '') {
        questionScores[q.order] = parseFloat(answer) || 0;
      }
    });
    
    // If no questions found, try to extract scores directly from answers
    if (orderedQuestions.length === 0) {
      console.log('No ordered questions found, trying direct answer extraction');
      const answerValues = Object.values(answers).filter(val => 
        val !== null && val !== undefined && val !== '' && !isNaN(parseFloat(val))
      );
      console.log('Direct answer values:', answerValues);
      
      // If we have scale answers, use them directly
      if (answerValues.length > 0) {
        const numericAnswers = answerValues.map(val => parseFloat(val));
        const avgScore = numericAnswers.reduce((sum, val) => sum + val, 0) / numericAnswers.length;
        console.log('Average score from direct answers:', avgScore);
        
        // Extract open-ended responses (non-numeric answers)
        const openEndedResponses = {};
        Object.entries(answers).forEach(([key, value]) => {
          if (value && typeof value === 'string' && isNaN(parseFloat(value))) {
            // This is likely an open-ended response
            openEndedResponses[key] = value;
          }
        });
        
        // Create a simple factor score based on average
        return {
          factorScores: {
            economic: avgScore,
            social: avgScore,
            health: avgScore,
            freedom: avgScore,
            purpose: avgScore,
            trust: avgScore,
            overall: avgScore
          },
          weightedScore: avgScore,
          questionScores: {},
          openEndedResponses: openEndedResponses,
          survey
        };
      }
    }
    
    console.log('Question scores:', questionScores);
    console.log('Ordered questions:', orderedQuestions);

    // Calculate factor scores based on World Happiness Report framework
    // Use fallback values if questions are missing
    const factorScores = {
      economic: questionScores[1] || 0, // Basic needs
      social: ((questionScores[2] || 0) + (questionScores[3] || 0)) / 2, // Family + Support
      health: ((questionScores[4] || 0) + (questionScores[5] || 0)) / 2, // Physical + Mental health
      freedom: questionScores[6] || 0, // Life control
      purpose: ((questionScores[7] || 0) + (questionScores[8] || 0)) / 2, // Purpose + Meaning
      trust: questionScores[9] || 0, // Safety
      overall: questionScores[10] || 0 // Overall life satisfaction
    };
    
    console.log('Factor scores:', factorScores);

    // Calculate weighted overall score based on World Happiness Report research
    const weights = {
      social: 0.25,
      economic: 0.20,
      health: 0.18,
      freedom: 0.15,
      purpose: 0.12,
      trust: 0.10
    };

    const weightedScore = 
      factorScores.economic * weights.economic +
      factorScores.social * weights.social +
      factorScores.health * weights.health +
      factorScores.freedom * weights.freedom +
      factorScores.purpose * weights.purpose +
      factorScores.trust * weights.trust;

    // Get all open-ended responses
    const openEndedResponses = {};
    orderedQuestions.forEach(q => {
      if (q.type === 'text' && q.order >= 11) {
        const answer = answers[q.$id];
        if (answer && answer.trim()) {
          openEndedResponses[q.order] = answer.trim();
        }
      }
    });

    return {
      factorScores,
      weightedScore,
      questionScores,
      openEndedResponses,
      survey
    };
  }, [responseData]);

  // Fetch fresh survey data from server to get current settings
  useEffect(() => {
    const fetchFreshSurvey = async () => {
      try {
        if (responseData?.survey?.$id) {
          const freshSurveyData = await getSurveyById(responseData.survey.$id);
          setFreshSurvey(freshSurveyData);
          console.log('Fresh survey data:', freshSurveyData);
          console.log('Fresh survey statsPublic:', freshSurveyData?.statsPublic);
        }
      } catch (error) {
        console.error('Error fetching fresh survey data:', error);
      }
    };

    fetchFreshSurvey();
  }, [responseData?.survey?.$id]);

  if (!insights) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Results Not Found</h1>
          <p className="text-gray-600 mb-6">Unable to load your happiness assessment results.</p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { factorScores, weightedScore, questionScores, openEndedResponses, survey } = insights;

  // Determine happiness level
  const getHappinessLevel = (score) => {
    if (score >= 8.5) return { level: "Exceptional", emoji: "🌟", color: "text-green-600", bgColor: "bg-green-50" };
    if (score >= 7.5) return { level: "High", emoji: "😊", color: "text-green-500", bgColor: "bg-green-50" };
    if (score >= 6.5) return { level: "Good", emoji: "🙂", color: "text-blue-500", bgColor: "bg-blue-50" };
    if (score >= 5.5) return { level: "Moderate", emoji: "😐", color: "text-yellow-500", bgColor: "bg-yellow-50" };
    if (score >= 4.0) return { level: "Below Average", emoji: "😔", color: "text-orange-500", bgColor: "bg-orange-50" };
    return { level: "Low", emoji: "😟", color: "text-red-500", bgColor: "bg-red-50" };
  };

  const happinessLevel = getHappinessLevel(weightedScore);

    // Generate personalized insights
    const generateInsights = () => {
      const insights = [];

      // Economic insights
      const incomeScore = questionScores[1] || 0;
      const needsScore = questionScores[2] || 0;
      
      if (incomeScore <= 4 && needsScore <= 4) {
        insights.push({
          category: "💰 Economic Wellbeing Analysis",
          insight: `Your financial satisfaction is low across income (${incomeScore.toFixed(1)}/10) and basic needs (${needsScore.toFixed(1)}/10), suggesting significant financial challenges that may be impacting your overall happiness.`,
          priority: "high"
        });
      } else if (incomeScore >= 7 && needsScore <= 4) {
        insights.push({
          category: "💰 Economic Wellbeing Analysis",
          insight: `You're satisfied with your income (${incomeScore.toFixed(1)}/10) but struggle with basic needs (${needsScore.toFixed(1)}/10), which may indicate high living costs or lifestyle inflation.`,
          priority: "medium"
        });
      } else if (incomeScore >= 6 && needsScore >= 6) {
        insights.push({
          category: "💰 Economic Wellbeing Analysis",
          insight: `Your financial situation appears solid across income (${incomeScore.toFixed(1)}/10) and basic needs (${needsScore.toFixed(1)}/10), providing a stable foundation for your happiness.`,
          priority: "low"
        });
      } else {
        insights.push({
          category: "💰 Economic Wellbeing Analysis",
          insight: `Your financial satisfaction varies across areas - income (${incomeScore.toFixed(1)}/10) and basic needs (${needsScore.toFixed(1)}/10) each tell different parts of your financial story.`,
          priority: "medium"
        });
      }

      // Social insights
      const familyScore = questionScores[3] || 0;
      const friendsScore = questionScores[4] || 0;
      const supportScore = questionScores[5] || 0;
      
      if (familyScore >= 7 && friendsScore <= 4) {
        insights.push({
          category: "👥 Social Connections Analysis",
          insight: `You have strong family relationships (${familyScore.toFixed(1)}/10) but limited friendships (${friendsScore.toFixed(1)}/10). Your support comes primarily from family rather than chosen relationships.`,
          priority: "medium"
        });
      } else if (supportScore <= 4) {
        insights.push({
          category: "👥 Social Connections Analysis",
          insight: `You have limited people to count on for help (${supportScore.toFixed(1)}/10), which can significantly impact your sense of security and happiness.`,
          priority: "high"
        });
      } else if (familyScore >= 6 && friendsScore >= 6 && supportScore >= 6) {
        insights.push({
          category: "👥 Social Connections Analysis",
          insight: `Your social connections are strong across family (${familyScore.toFixed(1)}/10), friends (${friendsScore.toFixed(1)}/10), and support network (${supportScore.toFixed(1)}/10), providing excellent social foundation.`,
          priority: "low"
        });
      } else {
        insights.push({
          category: "👥 Social Connections Analysis",
          insight: `Your relationship satisfaction varies - family (${familyScore.toFixed(1)}/10), friends (${friendsScore.toFixed(1)}/10), and support network (${supportScore.toFixed(1)}/10) each have different strengths.`,
          priority: "medium"
        });
      }

      // Health insights
      const physicalScore = questionScores[6] || 0;
      const mentalScore = questionScores[7] || 0;
      
      if (physicalScore >= 6 && mentalScore <= 4) {
        insights.push({
          category: "🏥 Health & Wellness Analysis",
          insight: `Your physical health is good (${physicalScore.toFixed(1)}/10) but mental health needs attention (${mentalScore.toFixed(1)}/10). Physical wellness doesn't always translate to mental wellness.`,
          priority: "high"
        });
      } else if (physicalScore <= 4 && mentalScore <= 4) {
        insights.push({
          category: "🏥 Health & Wellness Analysis",
          insight: `Both physical (${physicalScore.toFixed(1)}/10) and mental health (${mentalScore.toFixed(1)}/10) are concerning areas that likely reinforce each other and significantly impact your happiness.`,
          priority: "high"
        });
      } else if (physicalScore >= 6 && mentalScore >= 6) {
        insights.push({
          category: "🏥 Health & Wellness Analysis",
          insight: `Your health and wellness are strong across physical (${physicalScore.toFixed(1)}/10) and mental health (${mentalScore.toFixed(1)}/10), providing excellent foundation for happiness.`,
          priority: "low"
        });
      } else {
        insights.push({
          category: "🏥 Health & Wellness Analysis",
          insight: `Your health varies across areas - physical health (${physicalScore.toFixed(1)}/10) and mental wellness (${mentalScore.toFixed(1)}/10) each have different strengths.`,
          priority: "medium"
        });
      }

      // Freedom insights
      const controlScore = questionScores[8] || 0;
      const decisionScore = questionScores[9] || 0;
      
      if (controlScore <= 4 && decisionScore <= 4) {
        insights.push({
          category: "🗽 Personal Freedom Analysis",
          insight: `You feel little control over your life (${controlScore.toFixed(1)}/10) and constrained in decisions (${decisionScore.toFixed(1)}/10), which can create significant psychological stress.`,
          priority: "high"
        });
      } else if (controlScore >= 6 && decisionScore >= 6) {
        insights.push({
          category: "🗽 Personal Freedom Analysis",
          insight: `You have strong personal freedom with good life control (${controlScore.toFixed(1)}/10) and decision autonomy (${decisionScore.toFixed(1)}/10), enabling authentic living.`,
          priority: "low"
        });
      } else {
        insights.push({
          category: "🗽 Personal Freedom Analysis",
          insight: `Your sense of control varies - life control (${controlScore.toFixed(1)}/10) and decision freedom (${decisionScore.toFixed(1)}/10) each have different strengths.`,
          priority: "medium"
        });
      }

      // Purpose insights
      const purposeScore = questionScores[10] || 0;
      const meaningScore = questionScores[11] || 0;
      
      if (purposeScore <= 4 && meaningScore <= 4) {
        insights.push({
          category: "🎯 Purpose & Meaning Analysis",
          insight: `You're experiencing both lack of purpose (${purposeScore.toFixed(1)}/10) and meaninglessness (${meaningScore.toFixed(1)}/10), suggesting deeper existential questioning.`,
          priority: "high"
        });
      } else if (purposeScore >= 7 && meaningScore >= 7) {
        insights.push({
          category: "🎯 Purpose & Meaning Analysis",
          insight: `Both your sense of purpose (${purposeScore.toFixed(1)}/10) and meaning (${meaningScore.toFixed(1)}/10) are strong - you have clarity about direction and find life fulfilling.`,
          priority: "low"
        });
      } else {
        insights.push({
          category: "🎯 Purpose & Meaning Analysis",
          insight: `With moderate purpose (${purposeScore.toFixed(1)}/10) and meaning (${meaningScore.toFixed(1)}/10) scores, you may be in a transitional phase or seeking greater clarity about your direction.`,
          priority: "medium"
        });
      }

      // Trust insights
      const safetyScore = questionScores[12] || 0;
      const trustScore = questionScores[13] || 0;
      
      if (safetyScore <= 4 && trustScore <= 4) {
        insights.push({
          category: "🤝 Trust & Safety Analysis",
          insight: `You feel unsafe (${safetyScore.toFixed(1)}/10) and have little trust in people (${trustScore.toFixed(1)}/10), which can significantly impact your daily happiness and social connections.`,
          priority: "high"
        });
      } else if (safetyScore >= 6 && trustScore >= 6) {
        insights.push({
          category: "🤝 Trust & Safety Analysis",
          insight: `You have strong trust and safety with good personal security (${safetyScore.toFixed(1)}/10) and trust in people (${trustScore.toFixed(1)}/10), enabling confident social engagement.`,
          priority: "low"
        });
      } else {
        insights.push({
          category: "🤝 Trust & Safety Analysis",
          insight: `Trust levels vary - personal safety (${safetyScore.toFixed(1)}/10) and trust in people (${trustScore.toFixed(1)}/10) each have different levels.`,
          priority: "medium"
        });
      }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const personalizedInsights = generateInsights();

  const handleShare = async () => {
    setSharing(true);
    try {
      const shareText = `I just completed a Happiness Assessment! ${happinessLevel.emoji} ${happinessLevel.level} Happiness with an overall score of ${weightedScore.toFixed(1)}/10. Check out this research-based tool!`;
      const shareUrl = window.location.origin + `/survey/${slug}`;
      
      if (navigator.share) {
        await navigator.share({
          title: 'My Happiness Assessment Results',
          text: shareText,
          url: shareUrl
        });
      } else {
        // Fallback - copy to clipboard
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        push('Results copied to clipboard!', 'success');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      push('Failed to share results', 'error');
    } finally {
      setSharing(false);
    }
  };

  const handleViewStats = () => {
    navigate(`/public-stats/${slug}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🔍 Personal Insights & Analysis
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Based on your specific response patterns and score combinations
          </p>
          <p className="text-sm text-gray-500 italic">
            These insights analyze relationships between your individual answers to provide personalized observations rather than generic advice.
          </p>
        </div>

        {/* Overall Score Card */}
        <div className={`${happinessLevel.bgColor} rounded-2xl p-8 mb-8 shadow-lg`}>
          <div className="text-center">
            <div className={`text-6xl font-bold ${happinessLevel.color} mb-4`}>
              {happinessLevel.emoji} {weightedScore.toFixed(1)}/10
            </div>
            <div className={`text-2xl font-semibold ${happinessLevel.color} mb-2`}>
              {happinessLevel.level} Happiness
            </div>
            <div className="text-gray-600">
              Research-based weighted score across all life areas
            </div>
          </div>
        </div>

        {/* Factor Breakdown */}
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">📊 Life Area Breakdown</h2>
          <div className="grid gap-4">
            {Object.entries(factorScores).filter(([key]) => key !== 'overall').map(([factor, score]) => {
              const factorNames = {
                economic: "💰 Economic Wellbeing",
                social: "👥 Social Connections", 
                health: "🏥 Health & Wellness",
                freedom: "🗽 Personal Freedom",
                purpose: "🎯 Purpose & Meaning",
                trust: "🤝 Trust & Safety"
              };
              
              const percentage = (score / 10) * 100;
              const colorClass = score >= 7 ? 'bg-green-500' : score >= 5 ? 'bg-yellow-500' : 'bg-red-500';
              
              return (
                <div key={factor} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-700">{factorNames[factor]}</span>
                    <span className="text-lg font-bold text-gray-600">{score.toFixed(1)}/10</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${colorClass} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>


        {/* Open-ended Reflections */}
        {Object.keys(openEndedResponses).length > 0 && (
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">💭 Your Reflections</h2>
            <div className="space-y-4">
              {openEndedResponses[11] && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6">
                  <h3 className="font-bold text-gray-800 mb-3 text-lg">🌟 What Brings You Joy</h3>
                  <p className="text-gray-700 italic leading-relaxed">"{openEndedResponses[11]}"</p>
                </div>
              )}
              
              {openEndedResponses[12] && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-6">
                  <h3 className="font-bold text-gray-800 mb-3 text-lg">⚠️ Current Challenges</h3>
                  <p className="text-gray-700 italic leading-relaxed">"{openEndedResponses[12]}"</p>
                </div>
              )}
              
              {openEndedResponses[13] && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                  <h3 className="font-bold text-gray-800 mb-3 text-lg">🎯 Areas for Improvement</h3>
                  <p className="text-gray-700 italic leading-relaxed">"{openEndedResponses[13]}"</p>
                </div>
              )}
              
              {openEndedResponses[14] && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                  <h3 className="font-bold text-gray-800 mb-3 text-lg">✨ Recent Happy Moment</h3>
                  <p className="text-gray-700 italic leading-relaxed">"{openEndedResponses[14]}"</p>
                </div>
              )}
              
              {openEndedResponses[15] && (
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-6">
                  <h3 className="font-bold text-gray-800 mb-3 text-lg">🎯 Life Purpose & Meaning</h3>
                  <p className="text-gray-700 italic leading-relaxed">"{openEndedResponses[15]}"</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={handleShare}
            disabled={sharing}
            className="btn btn-primary text-lg px-8 py-4"
          >
            {sharing ? 'Sharing...' : '📤 Share Results'}
          </button>
          
          {(() => {
            // Use fresh survey data if available, otherwise fall back to localStorage data
            const currentSurvey = freshSurvey || survey;
            console.log('Button visibility check:', {
              survey: currentSurvey?.title,
              statsPublic: currentSurvey?.statsPublic,
              freshStatsPublic: freshSurvey?.statsPublic,
              shouldShow: currentSurvey?.statsPublic
            });
            return currentSurvey?.statsPublic;
          })() && (
            <button
              onClick={handleViewStats}
              className="btn btn-secondary text-lg px-8 py-4"
            >
              📊 View Stats Page
            </button>
          )}
        </div>

        {/* Research Note */}
        <div className="bg-blue-50 rounded-lg p-6 text-center">
          <p className="text-blue-800">
            <strong>Research Note:</strong> These insights are based on the World Happiness Report's research framework, 
            which identifies six key factors that contribute to human happiness and life satisfaction.
          </p>
        </div>
      </div>
    </div>
  );
}
