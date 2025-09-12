import { useMemo } from 'react';

export default function HappinessInsights({ responses, questions }) {
  const insights = useMemo(() => {
    if (!responses || !questions || responses.length === 0) return null;

    // Get the latest response
    const latestResponse = responses[responses.length - 1];
    const answers = JSON.parse(latestResponse.answers || '{}');

    // Map question order to answers
    const questionScores = {};
    questions.forEach(q => {
      const answer = answers[q.$id];
      if (answer !== undefined && answer !== null && answer !== '') {
        questionScores[q.order] = parseFloat(answer) || 0;
      }
    });

    // Calculate factor scores based on World Happiness Report framework
    const factorScores = {
      economic: (questionScores[1] + questionScores[2]) / 2, // Income + Basic needs
      social: (questionScores[3] + questionScores[4] + questionScores[5]) / 3, // Family + Friends + Support
      health: (questionScores[6] + questionScores[7]) / 2, // Physical + Mental health
      freedom: (questionScores[8] + questionScores[9]) / 2, // Life control + Decision freedom
      purpose: (questionScores[10] + questionScores[11]) / 2, // Purpose + Meaning
      trust: (questionScores[12] + questionScores[13]) / 2, // Safety + Trust in people
      overall: questionScores[14] // Overall life satisfaction
    };

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
    questions.forEach(q => {
      if (q.type === 'text' && q.order >= 15) {
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
      openEndedResponses
    };
  }, [responses, questions]);

  if (!insights) return null;

  const { factorScores, weightedScore, questionScores, openEndedResponses } = insights;

  // Determine happiness level
  const getHappinessLevel = (score) => {
    if (score >= 8.5) return { level: "Exceptional", emoji: "🌟", color: "text-green-600" };
    if (score >= 7.5) return { level: "High", emoji: "😊", color: "text-green-500" };
    if (score >= 6.5) return { level: "Good", emoji: "🙂", color: "text-blue-500" };
    if (score >= 5.5) return { level: "Moderate", emoji: "😐", color: "text-yellow-500" };
    if (score >= 4.0) return { level: "Below Average", emoji: "😔", color: "text-orange-500" };
    return { level: "Low", emoji: "😟", color: "text-red-500" };
  };

  const happinessLevel = getHappinessLevel(weightedScore);

  // Generate personalized insights
  const generateInsights = () => {
    const insights = [];

    // Economic insights
    if (questionScores[1] <= 4 && questionScores[2] <= 4) {
      insights.push({
        category: "💰 Economic Wellbeing",
        insight: `Your financial satisfaction is low across income (${questionScores[1].toFixed(1)}/10) and basic needs (${questionScores[2].toFixed(1)}/10), suggesting significant financial challenges that may be impacting your overall happiness.`,
        priority: "high"
      });
    } else if (questionScores[1] >= 7 && questionScores[2] <= 4) {
      insights.push({
        category: "💰 Economic Wellbeing",
        insight: `You're satisfied with your income (${questionScores[1].toFixed(1)}/10) but struggle with basic needs (${questionScores[2].toFixed(1)}/10), which may indicate high living costs or lifestyle inflation.`,
        priority: "medium"
      });
    }

    // Social insights
    if (questionScores[3] >= 7 && questionScores[4] <= 4) {
      insights.push({
        category: "👥 Social Connections",
        insight: `You have strong family relationships (${questionScores[3].toFixed(1)}/10) but limited friendships (${questionScores[4].toFixed(1)}/10). Your support comes primarily from family rather than chosen relationships.`,
        priority: "medium"
      });
    } else if (questionScores[5] <= 4) {
      insights.push({
        category: "👥 Social Connections",
        insight: `You have limited people to count on for help (${questionScores[5].toFixed(1)}/10), which can significantly impact your sense of security and happiness.`,
        priority: "high"
      });
    }

    // Health insights
    if (questionScores[6] >= 6 && questionScores[7] <= 4) {
      insights.push({
        category: "🏥 Health & Wellness",
        insight: `Your physical health is good (${questionScores[6].toFixed(1)}/10) but mental health needs attention (${questionScores[7].toFixed(1)}/10). Physical wellness doesn't always translate to mental wellness.`,
        priority: "high"
      });
    } else if (questionScores[6] <= 4 && questionScores[7] <= 4) {
      insights.push({
        category: "🏥 Health & Wellness",
        insight: `Both physical (${questionScores[6].toFixed(1)}/10) and mental health (${questionScores[7].toFixed(1)}/10) are concerning areas that likely reinforce each other and significantly impact your happiness.`,
        priority: "high"
      });
    }

    // Freedom insights
    if (questionScores[8] <= 4 && questionScores[9] <= 4) {
      insights.push({
        category: "🗽 Personal Freedom",
        insight: `You feel little control over your life (${questionScores[8].toFixed(1)}/10) and constrained in decisions (${questionScores[9].toFixed(1)}/10), which can create significant psychological stress.`,
        priority: "high"
      });
    }

    // Purpose insights
    if (questionScores[10] <= 4 && questionScores[11] <= 4) {
      insights.push({
        category: "🎯 Purpose & Meaning",
        insight: `You're experiencing both lack of purpose (${questionScores[10].toFixed(1)}/10) and meaninglessness (${questionScores[11].toFixed(1)}/10), suggesting deeper existential questioning.`,
        priority: "high"
      });
    } else if (questionScores[10] >= 7 && questionScores[11] >= 7) {
      insights.push({
        category: "🎯 Purpose & Meaning",
        insight: `Both your sense of purpose (${questionScores[10].toFixed(1)}/10) and meaning (${questionScores[11].toFixed(1)}/10) are strong - you have clarity about direction and find life fulfilling.`,
        priority: "low"
      });
    }

    // Trust insights
    if (questionScores[12] <= 4 && questionScores[13] <= 4) {
      insights.push({
        category: "🤝 Trust & Safety",
        insight: `You feel unsafe (${questionScores[12].toFixed(1)}/10) and have little trust in people (${questionScores[13].toFixed(1)}/10), which can significantly impact your daily happiness and social connections.`,
        priority: "high"
      });
    }

    // Overall satisfaction insights
    if (questionScores[14] <= 4) {
      insights.push({
        category: "📊 Overall Assessment",
        insight: `Your overall life satisfaction is low (${questionScores[14].toFixed(1)}/10), indicating multiple areas need attention. Consider focusing on the highest priority areas first.`,
        priority: "high"
      });
    } else if (questionScores[14] >= 8) {
      insights.push({
        category: "📊 Overall Assessment",
        insight: `Your overall life satisfaction is excellent (${questionScores[14].toFixed(1)}/10)! You've found a good balance across life areas.`,
        priority: "low"
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const personalizedInsights = generateInsights();

  return (
    <div className="survey-card p-6 animate-in fade-in-up">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          🔍 Personal Happiness Insights
        </h3>
        <p className="text-sm text-gray-600">
          Based on your specific response patterns and the World Happiness Report research framework
        </p>
      </div>

      {/* Overall Score */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
        <div className="text-center">
          <div className={`text-4xl font-bold ${happinessLevel.color} mb-2`}>
            {happinessLevel.emoji} {weightedScore.toFixed(1)}/10
          </div>
          <div className={`text-lg font-semibold ${happinessLevel.color}`}>
            {happinessLevel.level} Happiness
          </div>
          <div className="text-sm text-gray-600 mt-2">
            Research-based weighted score across all life areas
          </div>
        </div>
      </div>

      {/* Factor Breakdown */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">📊 Life Area Breakdown</h4>
        <div className="grid gap-3">
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
              <div key={factor} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">{factorNames[factor]}</span>
                  <span className="text-sm font-bold text-gray-600">{score.toFixed(1)}/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${colorClass} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Personalized Insights */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">💡 Personalized Analysis</h4>
        <div className="space-y-4">
          {personalizedInsights.map((insight, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg border-l-4 ${
                insight.priority === 'high' ? 'bg-red-50 border-red-400' :
                insight.priority === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                'bg-green-50 border-green-400'
              }`}
            >
              <div className="font-semibold text-gray-800 mb-2">{insight.category}</div>
              <div className="text-sm text-gray-700">{insight.insight}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Open-ended Reflections */}
      {Object.keys(openEndedResponses).length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">💭 Your Reflections</h4>
          
          {openEndedResponses[15] && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4">
              <h5 className="font-semibold text-gray-800 mb-2">🌟 What Brings You Joy</h5>
              <p className="text-gray-700 italic">"{openEndedResponses[15]}"</p>
            </div>
          )}
          
          {openEndedResponses[16] && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4">
              <h5 className="font-semibold text-gray-800 mb-2">⚠️ Current Challenges</h5>
              <p className="text-gray-700 italic">"{openEndedResponses[16]}"</p>
            </div>
          )}
          
          {openEndedResponses[17] && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
              <h5 className="font-semibold text-gray-800 mb-2">🎯 Areas for Improvement</h5>
              <p className="text-gray-700 italic">"{openEndedResponses[17]}"</p>
            </div>
          )}
          
          {openEndedResponses[18] && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
              <h5 className="font-semibold text-gray-800 mb-2">✨ Recent Happy Moment</h5>
              <p className="text-gray-700 italic">"{openEndedResponses[18]}"</p>
            </div>
          )}
          
          {openEndedResponses[19] && (
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-4">
              <h5 className="font-semibold text-gray-800 mb-2">🎯 Life Purpose & Meaning</h5>
              <p className="text-gray-700 italic">"{openEndedResponses[19]}"</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> These insights are based on the World Happiness Report's research framework, 
          which identifies six key factors that contribute to human happiness and life satisfaction.
        </p>
      </div>
    </div>
  );
}
