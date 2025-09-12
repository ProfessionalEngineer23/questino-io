import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ThankYou() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const slug = searchParams.get('slug');
  const statsPublic = searchParams.get('statsPublic') === 'true';
  const [showMessage, setShowMessage] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Show message with delay for smooth animation
    const messageTimer = setTimeout(() => setShowMessage(true), 300);
    const confettiTimer = setTimeout(() => setShowConfetti(true), 600);
    
    // Auto-redirect based on stats visibility
    const redirectTimer = setTimeout(() => {
      if (statsPublic && slug) {
        // Redirect to public stats page if stats are public
        navigate(`/public-stats/${slug}`);
      } else {
        // Redirect to homepage if stats are private
        navigate('/');
      }
    }, 4000);

    return () => {
      clearTimeout(messageTimer);
      clearTimeout(confettiTimer);
      clearTimeout(redirectTimer);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-200/30 to-blue-200/30 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-200/20 to-blue-200/20 rounded-full animate-pulse delay-500"></div>
      </div>

      {/* Confetti animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 max-w-lg w-full text-center">
        {/* Success icon with animation */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
            <svg 
              className="w-12 h-12 text-white transform transition-transform duration-500 hover:scale-110" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Thank you message with smooth reveal */}
        <div className={`transition-all duration-1000 transform ${showMessage ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Thank You!
          </h1>
          <p className="text-xl text-gray-600 mb-2 font-medium">
            Your response has been recorded
          </p>
          <p className="text-lg text-gray-500 mb-8">
            Your feedback makes a difference ✨
          </p>
        </div>

        {/* Floating elements */}
        <div className="flex justify-center space-x-4 mb-8">
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce delay-100"></div>
          <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
        </div>

        {/* Subtle redirect message */}
        <div className={`transition-all duration-1000 delay-1000 transform ${showMessage ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <p className="text-sm text-gray-400 font-medium">
            {statsPublic ? 'Viewing results...' : 'Returning to homepage...'}
          </p>
        </div>
      </div>
    </div>
  );
}
