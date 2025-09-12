import { useState, useEffect, useCallback } from "react";
import { account } from "../lib/appwrite";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userMode, setUserMode] = useState(null); // 'account' | 'guest' | null

  const checkAuth = useCallback(async () => {
    try {
      // Check if user is in guest mode first
      const guestId = localStorage.getItem('questino_guest_id');
      const mode = localStorage.getItem('questino_user_mode');
      
      if (mode === 'guest' && guestId) {
        // Create a guest user object
        const guestUser = {
          $id: guestId,
          name: 'Guest User',
          email: 'guest@questino.io',
          isGuest: true
        };
        setUser(guestUser);
        setUserMode('guest');
        setLoading(false);
        return;
      }

      // Only try to get real account if not in guest mode
      if (mode !== 'guest') {
        try {
          const userData = await account.get();
          setUser(userData);
          setUserMode('account');
        } catch (accountError) {
          // If account.get() fails, user is not authenticated
          setUser(null);
          setUserMode(null);
        }
      } else {
        // Clear guest mode if no guest ID
        setUser(null);
        setUserMode(null);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setUser(null);
      setUserMode(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      await account.createEmailSession(email, password);
      await checkAuth();
      return true;
    } catch (error) {
      throw error;
    }
  }, [checkAuth]);

  const register = useCallback(async (email, password, name) => {
    try {
      await account.create("unique()", email, password, name);
      await account.createEmailSession(email, password);
      await checkAuth();
      return true;
    } catch (error) {
      throw error;
    }
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      if (userMode === 'guest') {
        // Clear guest data
        localStorage.removeItem('questino_guest_id');
        localStorage.removeItem('questino_user_mode');
        localStorage.removeItem('questino_guest_surveys');
      } else {
        // Logout from account
        await account.deleteSession("current");
      }
      setUser(null);
      setUserMode(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [userMode]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    userMode,
    isGuest: userMode === 'guest',
    login,
    register,
    logout,
    refresh: checkAuth,
  };
}
