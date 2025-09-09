import { useState, useEffect, useCallback } from "react";
import { account } from "../lib/appwrite";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const userData = await account.get();
      setUser(userData);
    } catch (error) {
      setUser(null);
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
      await account.deleteSession("current");
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refresh: checkAuth,
  };
}
