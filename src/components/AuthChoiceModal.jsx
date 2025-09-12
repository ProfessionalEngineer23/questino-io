import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { account } from '../lib/appwrite';
import { ensureGuestSession } from '../lib/guest';

export default function AuthChoiceModal({ onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleGuestChoice = async () => {
    setIsLoading(true);
    try {
      // Check if user already has a session
      try {
        await account.get();
        // User already has a session, go to dashboard
        navigate('/app');
      } catch (error) {
        // No session, create guest session
        const success = await ensureGuestSession();
        if (success) {
          navigate('/app');
        } else {
          console.error('Failed to create guest session');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInChoice = () => {
    navigate('/auth');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999999]">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/50 w-full max-w-md mx-4 p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="icon-rocket text-3xl text-indigo-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Started with Questino</h2>
          <p className="text-gray-600 leading-relaxed">
            Choose how you'd like to start creating surveys
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGuestChoice}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="icon-user text-xl" />
                <div className="text-left">
                  <div className="font-bold">Continue as Guest</div>
                  <div className="text-sm opacity-90">Start creating surveys immediately</div>
                </div>
              </>
            )}
          </button>

          <button
            onClick={handleSignInChoice}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="icon-mail text-xl" />
            <div className="text-left">
              <div className="font-bold">Sign in or Create Account</div>
              <div className="text-sm opacity-70">Secure passwordless authentication</div>
            </div>
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            💡 You can always sign in later to save your surveys permanently
          </p>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200"
        >
          <span className="icon-x text-gray-500" />
        </button>
      </div>
    </div>
  );
}
