import { useMemo } from "react";

// Simple histogram component for scale questions
export function Histogram({ data, min, max, title, className = "" }) {
  const buckets = useMemo(() => {
    const bucketCount = Math.min(10, max - min + 1);
    const bucketSize = (max - min + 1) / bucketCount;
    const buckets = Array(bucketCount).fill(0);
    
    data.forEach(value => {
      const bucketIndex = Math.min(Math.floor((value - min) / bucketSize), bucketCount - 1);
      buckets[bucketIndex]++;
    });
    
    return buckets.map((count, i) => ({
      count,
      range: `${Math.round(min + i * bucketSize)}-${Math.round(min + (i + 1) * bucketSize - 1)}`,
      percentage: data.length > 0 ? (count / data.length) * 100 : 0
    }));
  }, [data, min, max]);

  const maxCount = Math.max(...buckets.map(b => b.count));

  return (
    <div className={`space-y-2 ${className}`}>
      {title && <h4 className="text-sm font-semibold text-gray-700">{title}</h4>}
      <div className="space-y-1">
        {buckets.map((bucket, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-12 text-gray-500">{bucket.range}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-4 relative overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${bucket.percentage}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-white font-medium">
                {bucket.count > 0 && bucket.count}
              </span>
            </div>
            <span className="w-8 text-gray-500 text-right">{bucket.percentage.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Pie chart component for multiple choice questions
export function PieChart({ data, title, className = "" }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <div className={`text-center text-gray-500 ${className}`}>
        <p className="text-sm">No data available</p>
      </div>
    );
  }

  let cumulativePercentage = 0;

  return (
    <div className={`space-y-3 ${className}`}>
      {title && <h4 className="text-sm font-semibold text-gray-700">{title}</h4>}
      
      {/* Legend */}
      <div className="space-y-2">
        {data.map((item, i) => {
          const percentage = (item.value / total) * 100;
          const color = getColorForIndex(i);
          
          return (
            <div key={i} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="flex-1">{item.label}</span>
              <span className="text-gray-500 font-medium">
                {item.value} ({percentage.toFixed(1)}%)
              </span>
            </div>
          );
        })}
      </div>

      {/* Simple pie representation */}
      <div className="flex justify-center">
        <div className="relative w-32 h-32 rounded-full overflow-hidden">
          {data.map((item, i) => {
            const percentage = (item.value / total) * 100;
            const startAngle = cumulativePercentage * 3.6; // 360 degrees / 100
            const endAngle = (cumulativePercentage + percentage) * 3.6;
            
            cumulativePercentage += percentage;
            
            if (percentage === 0) return null;
            
            return (
              <div
                key={i}
                className="absolute inset-0"
                style={{
                  background: `conic-gradient(from ${startAngle}deg, ${getColorForIndex(i)} 0deg, ${getColorForIndex(i)} ${endAngle - startAngle}deg, transparent ${endAngle - startAngle}deg)`
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Enhanced bar chart with animations
export function AnimatedBarChart({ data, title, className = "" }) {
  const maxValue = Math.max(...data.map(item => item.value));

  return (
    <div className={`space-y-3 ${className}`}>
      {title && <h4 className="text-sm font-semibold text-gray-700">{title}</h4>}
      <div className="space-y-2">
        {data.map((item, i) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          
          return (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-700">{item.label}</span>
                <span className="text-gray-500 font-medium">{item.value}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${percentage}%`,
                    animationDelay: `${i * 100}ms`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Emotion radar chart
export function EmotionRadar({ emotions, title, className = "" }) {
  const emotionKeys = ["joy", "sadness", "anger", "fear", "disgust"];
  const maxValue = Math.max(...emotionKeys.map(key => emotions[key] || 0));

  return (
    <div className={`space-y-3 ${className}`}>
      {title && <h4 className="text-sm font-semibold text-gray-700">{title}</h4>}
      <div className="grid grid-cols-2 gap-3">
        {emotionKeys.map((emotion, i) => {
          const value = emotions[emotion] || 0;
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const color = getEmotionColor(emotion);
          
          return (
            <div key={emotion} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="capitalize text-gray-700">{emotion}</span>
                <span className="text-gray-500 font-medium">{value.toFixed(3)}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: color,
                    animationDelay: `${i * 150}ms`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper functions
function getColorForIndex(index) {
  const colors = [
    "#f02e65", // brand-500
    "#3b82f6", // blue-500
    "#10b981", // emerald-500
    "#f59e0b", // amber-500
    "#8b5cf6", // violet-500
    "#ef4444", // red-500
    "#06b6d4", // cyan-500
    "#84cc16", // lime-500
  ];
  return colors[index % colors.length];
}

function getEmotionColor(emotion) {
  const colors = {
    joy: "#10b981",      // emerald-500
    sadness: "#3b82f6",  // blue-500
    anger: "#ef4444",    // red-500
    fear: "#8b5cf6",     // violet-500
    disgust: "#f59e0b",  // amber-500
  };
  return colors[emotion] || "#6b7280";
}
