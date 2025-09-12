// src/components/EmotionTrends.tsx
import { useEffect, useState, useMemo } from "react";
import { listResponsesBySurvey, listAnalysisJoinedBySurvey } from "../surveyApi";
import { FEATURES } from "../featureFlags";

interface EmotionTrendsProps {
  questionnaireId: string;
}

interface WeeklyData {
  week: string;
  joy: number;
  sadness: number;
  positive: number;
  count: number;
}

export default function EmotionTrends({ questionnaireId }: EmotionTrendsProps) {
  const [responses, setResponses] = useState([]);
  const [analysis, setAnalysis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        
        const [responsesData, analysisData] = await Promise.all([
          listResponsesBySurvey(questionnaireId),
          listAnalysisJoinedBySurvey(questionnaireId).catch(() => ({ responses: [], analysis: [] }))
        ]);
        
        setResponses(responsesData || []);
        setAnalysis(analysisData?.analysis || []);
      } catch (err) {
        console.error("Error fetching emotion trends data:", err);
        setError("Failed to load emotion trends data");
      } finally {
        setLoading(false);
      }
    };

    if (questionnaireId) {
      fetchData();
    }
  }, [questionnaireId]);

  // Process data into weekly buckets
  const weeklyData = useMemo(() => {
    if (!responses.length || !analysis.length) return [];

    // Create a map of responseId to createdAt
    const responseMap = new Map();
    responses.forEach(response => {
      responseMap.set(response.$id, response.$createdAt);
    });

    // Group analysis by week
    const weeklyBuckets = new Map<string, {
      joy: number[];
      sadness: number[];
      sentiment: number[];
      count: number;
    }>();

    analysis.forEach(analysisItem => {
      const responseCreatedAt = responseMap.get(analysisItem.responseId);
      if (!responseCreatedAt) return;

      // Get week start date (Monday)
      const date = new Date(responseCreatedAt);
      const dayOfWeek = date.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, adjust to Monday
      const monday = new Date(date);
      monday.setDate(date.getDate() + mondayOffset);
      monday.setHours(0, 0, 0, 0);
      
      const weekKey = monday.toISOString().split('T')[0]; // YYYY-MM-DD format

      if (!weeklyBuckets.has(weekKey)) {
        weeklyBuckets.set(weekKey, {
          joy: [],
          sadness: [],
          sentiment: [],
          count: 0
        });
      }

      const bucket = weeklyBuckets.get(weekKey)!;
      
      // Add emotion scores if available
      if (typeof analysisItem.joy === 'number') {
        bucket.joy.push(analysisItem.joy);
      }
      if (typeof analysisItem.sadness === 'number') {
        bucket.sadness.push(analysisItem.sadness);
      }
      
      // Add sentiment if available
      if (typeof analysisItem.sentiment === 'number') {
        bucket.sentiment.push(analysisItem.sentiment);
      } else if (typeof analysisItem.sentiment_score === 'number') {
        bucket.sentiment.push(analysisItem.sentiment_score);
      } else if (typeof analysisItem.sentiment_label === 'string') {
        const sentimentMap = { positive: 1, neutral: 0, negative: -1 };
        if (analysisItem.sentiment_label in sentimentMap) {
          bucket.sentiment.push(sentimentMap[analysisItem.sentiment_label]);
        }
      }
      
      bucket.count++;
    });

    // Convert to array and calculate averages
    const result: WeeklyData[] = Array.from(weeklyBuckets.entries())
      .map(([week, data]) => {
        const avgJoy = data.joy.length > 0 ? data.joy.reduce((sum, val) => sum + val, 0) / data.joy.length : 0;
        const avgSadness = data.sadness.length > 0 ? data.sadness.reduce((sum, val) => sum + val, 0) / data.sadness.length : 0;
        const positiveCount = data.sentiment.filter(s => s > 0).length;
        const positivePercentage = data.sentiment.length > 0 ? (positiveCount / data.sentiment.length) * 100 : 0;

        return {
          week,
          joy: Math.round(avgJoy * 100) / 100,
          sadness: Math.round(avgSadness * 100) / 100,
          positive: Math.round(positivePercentage * 10) / 10,
          count: data.count
        };
      })
      .sort((a, b) => a.week.localeCompare(b.week));

    return result;
  }, [responses, analysis]);

  // Get current week data
  const currentWeekData = useMemo(() => {
    if (!weeklyData.length) return null;
    
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() + mondayOffset);
    currentMonday.setHours(0, 0, 0, 0);
    const currentWeekKey = currentMonday.toISOString().split('T')[0];
    
    return weeklyData.find(week => week.week === currentWeekKey);
  }, [weeklyData]);

  if (!FEATURES.EMOTION_TRENDS) {
    return null;
  }

  if (loading) {
    return (
      <div className="survey-card p-6 animate-in fade-in-up border-l-4 border-l-purple-500 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="icon-trending-up text-purple-600"></span>
          Emotion Trends
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="survey-card p-6 animate-in fade-in-up border-l-4 border-l-red-500 shadow-lg bg-red-50">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-800">
          <span className="icon-alert-circle text-red-600"></span>
          Emotion Trends
        </h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (weeklyData.length === 0) {
    return (
      <div className="survey-card p-6 animate-in fade-in-up border-l-4 border-l-purple-500 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="icon-trending-up text-purple-600"></span>
          Emotion Trends
        </h3>
        <p className="text-gray-500 text-center py-4">No emotion analysis data available yet.</p>
      </div>
    );
  }

  return (
    <div className="survey-card p-6 animate-in fade-in-up border-l-4 border-l-purple-500 shadow-lg">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="icon-trending-up text-purple-600"></span>
        Emotion Trends
      </h3>
      
      {/* Current Week Stats */}
      {currentWeekData && (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg">
          <div className="text-sm text-purple-700 mb-2">This week:</div>
          <div className="text-2xl font-bold text-purple-800">
            {currentWeekData.positive}% positive
          </div>
          <div className="text-sm text-purple-600 mt-1">
            {currentWeekData.count} responses analyzed
          </div>
        </div>
      )}

      {/* Line Chart */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">Joy vs Sadness Over Time</h4>
        
        {/* Simple line chart visualization */}
        <div className="relative h-64 bg-gray-50 rounded-lg p-4">
          <div className="flex items-end justify-between h-full">
            {weeklyData.map((week, index) => {
              const maxValue = Math.max(...weeklyData.map(w => Math.max(w.joy, w.sadness)));
              const joyHeight = maxValue > 0 ? (week.joy / maxValue) * 100 : 0;
              const sadnessHeight = maxValue > 0 ? (week.sadness / maxValue) * 100 : 0;
              
              return (
                <div key={week.week} className="flex flex-col items-center flex-1">
                  <div className="flex flex-col items-center justify-end h-40 w-full">
                    {/* Joy bar */}
                    <div 
                      className="w-3 bg-green-400 rounded-t"
                      style={{ height: `${joyHeight}%` }}
                      title={`Joy: ${week.joy}`}
                    />
                    {/* Sadness bar */}
                    <div 
                      className="w-3 bg-red-400 rounded-t mt-1"
                      style={{ height: `${sadnessHeight}%` }}
                      title={`Sadness: ${week.sadness}`}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    {new Date(week.week).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded"></div>
              <span className="text-sm text-gray-600">Joy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded"></div>
              <span className="text-sm text-gray-600">Sadness</span>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">
              {weeklyData.length > 0 ? 
                (weeklyData.reduce((sum, week) => sum + week.joy, 0) / weeklyData.length).toFixed(2) : 
                '0.00'
              }
            </div>
            <div className="text-sm text-green-700">Avg Joy</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-lg font-bold text-red-600">
              {weeklyData.length > 0 ? 
                (weeklyData.reduce((sum, week) => sum + week.sadness, 0) / weeklyData.length).toFixed(2) : 
                '0.00'
              }
            </div>
            <div className="text-sm text-red-700">Avg Sadness</div>
          </div>
        </div>
      </div>
    </div>
  );
}
