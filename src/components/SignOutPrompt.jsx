import { useState } from 'react';
import { FEATURES } from '../featureFlags';

export default function SignOutPrompt({ onChoice, onClose }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleChoice = async (choice) => {
    setIsLoading(true);
    try {
      await onChoice(choice);
    } finally {
      setIsLoading(false);
    }
  };

  if (!FEATURES.SIGNOUT_PROMPT) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999999]">
      <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl border border-gray-200/50">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="icon-log-out text-2xl text-indigo-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Leave your account?</h3>
          <p className="text-gray-600 leading-relaxed">
            You can continue as Guest (your surveys on this device stay available), or sign in with your account.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleChoice('guest')}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="icon-user" />
                Continue as Guest
              </>
            )}
          </button>

          <button
            onClick={() => handleChoice('signin')}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="icon-mail" />
                Sign in with Email
              </>
            )}
          </button>

          <button
            onClick={() => handleChoice('cancel')}
            disabled={isLoading}
            className="w-full text-gray-500 hover:text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            💡 Your surveys will be saved on this device even if you continue as Guest
          </p>
        </div>
      </div>
    </div>
  );
}
