import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { account } from '../lib/appwrite';
import { FEATURES } from '../featureFlags';
import { useToast } from './Toast';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [mode, setMode] = useState('otp'); // 'otp' or 'magic'
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { push } = useToast();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await account.get();
        navigate('/app');
      } catch (error) {
        // User is not logged in, stay on auth page
      }
    };
    checkAuth();
  }, [navigate]);

  const sendOTP = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (authMode === 'signup') {
        // For signup, create account first, then send verification
        await account.create('unique()', email, '', email);
        await account.createEmailToken('unique()', email);
        push('Account created! Verification code sent to your email!', 'success');
      } else {
        // For signin, just send verification code
        await account.createEmailToken('unique()', email);
        push('Verification code sent to your email!', 'success');
      }
      setSent(true);
    } catch (error) {
      console.error('Failed to send OTP:', error);
      if (error.message?.includes('already exists')) {
        setError('An account with this email already exists. Try signing in instead.');
        setAuthMode('signin');
      } else {
        setError('Failed to send verification code. Please try again.');
      }
      push('Failed to send verification code', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMagicLink = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (authMode === 'signup') {
        // For signup, create account first, then send magic link
        await account.create('unique()', email, '', email);
        await account.createMagicURLSession('unique()', email, `${window.location.origin}/auth/callback`);
        push('Account created! Magic link sent to your email!', 'success');
      } else {
        // For signin, just send magic link
        await account.createMagicURLSession('unique()', email, `${window.location.origin}/auth/callback`);
        push('Magic link sent to your email!', 'success');
      }
      setSent(true);
    } catch (error) {
      console.error('Failed to send magic link:', error);
      if (error.message?.includes('already exists')) {
        setError('An account with this email already exists. Try signing in instead.');
        setAuthMode('signin');
      } else {
        setError('Failed to send magic link. Please try again.');
      }
      push('Failed to send magic link', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!code.trim() || code.length < 4) {
      setError('Please enter a valid verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await account.createSession(email, code);
      push('Successfully signed in!', 'success');
      navigate('/app');
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      setError('Invalid verification code. Please try again.');
      push('Invalid verification code', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'otp') {
      if (sent) {
        verifyOTP();
      } else {
        sendOTP();
      }
    } else {
      if (sent) {
        // For magic link, we just show success message
        return;
      } else {
        sendMagicLink();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/50 w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="icon-mail text-3xl text-indigo-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {authMode === 'signup' ? 'Create your account' : 'Sign in to Questino'}
          </h1>
          <p className="text-gray-600">Passwordless and secure authentication</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              disabled={isLoading || (sent && mode === 'magic')}
              required
            />
          </div>

          {/* Sign in / Sign up toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setSent(false);
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                authMode === 'signin'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              disabled={isLoading}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setSent(false);
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                authMode === 'signup'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              disabled={isLoading}
            >
              Create Account
            </button>
          </div>

          {FEATURES.AUTH_EMAIL_OTP && FEATURES.AUTH_MAGIC_LINK && (
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setMode('otp');
                  setSent(false);
                  setError('');
                }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  mode === 'otp'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                disabled={isLoading}
              >
                Email Code
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('magic');
                  setSent(false);
                  setError('');
                }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  mode === 'magic'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                disabled={isLoading}
              >
                Magic Link
              </button>
            </div>
          )}

          {sent && mode === 'otp' && (
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Enter 6-digit code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                inputMode="numeric"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest"
                disabled={isLoading}
                required
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !email.trim() || (sent && mode === 'otp' && code.length < 4)}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : sent ? (
              mode === 'otp' ? (
                <>
                  <span className="icon-check" />
                  {authMode === 'signup' ? 'Verify & Create Account' : 'Verify & Sign in'}
                </>
              ) : (
                <>
                  <span className="icon-check" />
                  Check Your Email
                </>
              )
            ) : (
              <>
                <span className="icon-send" />
                {authMode === 'signup' 
                  ? (mode === 'otp' ? 'Create Account & Send Code' : 'Create Account & Send Link')
                  : (mode === 'otp' ? 'Send Code' : 'Send Magic Link')
                }
              </>
            )}
          </button>
        </form>

        {sent && mode === 'magic' && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-blue-700 text-sm text-center">
              📧 Check your inbox and click the magic link. We'll sign you in automatically.
            </p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={() => navigate('/app')}
            className="w-full text-gray-500 hover:text-gray-700 py-2 text-sm font-medium transition-colors duration-200"
          >
            ← Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}
