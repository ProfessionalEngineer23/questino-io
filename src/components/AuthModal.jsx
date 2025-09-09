import { useState } from "react";
import { account } from "../lib/appwrite";
import { useToast } from "./Toast.jsx";

export default function AuthModal({ open, onClose, onSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const { push } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "register") {
        await account.create("unique()", formData.email, formData.password, formData.name);
        await account.createEmailSession(formData.email, formData.password);
        push("Account created successfully!");
      } else {
        await account.createEmailSession(formData.email, formData.password);
        push("Welcome back!");
      }
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Auth error:", error);
      push(error.message || "Authentication failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50" onClick={onClose}>
      <div 
        className="card w-full max-w-md p-8 animate-in scale-in" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {mode === "login" 
              ? "Sign in to manage your surveys" 
              : "Join Questino.io to create and share surveys"
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required={mode === "register"}
                className="w-full rounded-xl2 border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Enter your name"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full rounded-xl2 border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={8}
              className="w-full rounded-xl2 border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Enter your password"
            />
            {mode === "register" && (
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            {mode === "login" 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"
            }
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  );
}
