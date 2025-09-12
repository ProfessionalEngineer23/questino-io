import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "./Toast.jsx";
import { ensureSession } from "../surveyApi";
import { account } from "../lib/appwrite";
import { ID } from "appwrite";

export default function AuthChoice() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { push } = useToast();

  const handleGuestMode = async () => {
    setLoading(true);
    try {
      // For guest mode, we'll create a temporary session
      // This will be stored in localStorage and treated as a "guest account"
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem('questino_guest_id', guestId);
      localStorage.setItem('questino_user_mode', 'guest');
      
      push("Welcome! You're now in guest mode. Your surveys will be saved locally.", "success");
      navigate("/app", { replace: true });
    } catch (error) {
      console.error("Guest mode setup failed:", error);
      push("Failed to start guest mode. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      // Check if user is already signed in
      try {
        const user = await account.get();
        if (user) {
          localStorage.setItem('questino_user_mode', 'account');
          push(`Welcome back, ${user.name || user.email}!`, "success");
          navigate("/app", { replace: true });
          return;
        }
      } catch (e) {
        // User not signed in, continue to sign in flow
      }

      // For now, we'll create a simple sign-in flow
      // In a real app, this would redirect to OAuth or show a sign-in form
      const email = prompt("Enter your email to sign in:");
      if (!email) {
        setLoading(false);
        return;
      }

      const password = prompt("Enter your password:");
      if (!password) {
        setLoading(false);
        return;
      }

      try {
        // Try to sign in
        await account.createEmailSession(email, password);
        const user = await account.get();
        localStorage.setItem('questino_user_mode', 'account');
        push(`Welcome back, ${user.name || user.email}!`, "success");
        navigate("/app", { replace: true });
      } catch (signInError) {
        // If sign in fails, try to create account
        try {
          const name = prompt("Account not found. Enter your name to create a new account:");
          if (!name) {
            setLoading(false);
            return;
          }

          await account.create(ID.unique(), email, password, name);
          await account.createEmailSession(email, password);
          localStorage.setItem('questino_user_mode', 'account');
          push(`Welcome to Questino.io, ${name}!`, "success");
          navigate("/app", { replace: true });
        } catch (createError) {
          console.error("Account creation failed:", createError);
          push("Failed to create account. Please try again.", "error");
        }
      }
    } catch (error) {
      console.error("Sign in failed:", error);
      push("Sign in failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
            <span className="text-white text-2xl font-bold">Q</span>
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-bold text-gray-800">Questino.io</h1>
            <p className="text-sm text-gray-600">Survey Platform</p>
          </div>
        </div>

        {/* Auth Choice Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
            How would you like to continue?
          </h2>
          
          <div className="space-y-4">
            {/* Guest Mode */}
            <button
              onClick={handleGuestMode}
              disabled={loading}
              className="w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="flex items-center justify-center">
                <span className="icon-user mr-3"></span>
                Continue as Guest
              </div>
              <p className="text-sm opacity-90 mt-2">
                Your surveys will be saved locally
              </p>
            </button>

            {/* Sign In */}
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full p-4 bg-white text-purple-600 rounded-xl font-semibold border-2 border-purple-500 hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="flex items-center justify-center">
                <span className="icon-login mr-3"></span>
                Sign In to Account
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Access your surveys from anywhere
              </p>
            </button>
          </div>

          {loading && (
            <div className="text-center mt-6">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
              <p className="text-gray-500 mt-2">Setting up your experience...</p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>Guest mode: Surveys saved locally • Account: Cloud sync & backup</p>
        </div>
      </div>
    </div>
  );
}
