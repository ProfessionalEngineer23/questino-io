import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { account } from '../lib/appwrite';
import { useToast } from './Toast';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    const handleMagicLinkCallback = async () => {
      try {
        // Get the session from URL parameters
        const userId = searchParams.get('userId');
        const secret = searchParams.get('secret');

        if (userId && secret) {
          // Complete the magic URL session
          await account.updateMagicURLSession(userId, secret);
          
          // Verify the session was created successfully
          const user = await account.get();
          if (user) {
            setStatus('success');
            push('Successfully signed in!', 'success');
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
              navigate('/app');
            }, 1500);
          }
        } else {
          throw new Error('Invalid magic link parameters');
        }
      } catch (error) {
        console.error('Magic link verification failed:', error);
        setStatus('error');
        push('Failed to sign in. The magic link may be invalid or expired.', 'error');
        
        // Redirect to auth page after showing error
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      }
    };

    handleMagicLinkCallback();
  }, [searchParams, navigate, push]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/50 w-full max-w-md p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          {status === 'verifying' && (
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          )}
          {status === 'success' && (
            <span className="icon-check text-3xl text-green-500" />
          )}
          {status === 'error' && (
            <span className="icon-x text-3xl text-red-500" />
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {status === 'verifying' && 'Verifying your sign-in...'}
          {status === 'success' && 'Welcome back!'}
          {status === 'error' && 'Sign-in failed'}
        </h1>

        <p className="text-gray-600">
          {status === 'verifying' && 'Please wait while we complete your authentication.'}
          {status === 'success' && 'Redirecting you to your dashboard...'}
          {status === 'error' && 'Redirecting you to the sign-in page...'}
        </p>

        {status === 'error' && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">
              The magic link may be invalid or expired. Please try signing in again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
