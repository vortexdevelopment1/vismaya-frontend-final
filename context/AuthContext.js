"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService } from "@/lib/api/services/authService";
import { getAuthToken, setAuthToken, removeAuthToken } from "@/lib/api/client";
import { toFrontendRole, getDashboardPath, isTalent, isRecruiter, isAdmin } from "@/lib/api/roles";
import { USE_MOCK, isRealMode } from "@/lib/api/config";

const AuthContext = createContext(null);

const STORAGE_USER_KEY = "vismaya_user_data";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore session on mount (SSR safe)
  useEffect(() => {
    try {
      const storedToken = getAuthToken();
      const rawUser = typeof window !== "undefined" ? localStorage.getItem(STORAGE_USER_KEY) : null;
      
      if (storedToken) {
        setToken(storedToken);
      }

      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser);
          setUser(parsed);
        } catch {
          // ignore corrupted JSON
        }
      }
    } catch {
      // Storage unavailable
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSession = useCallback((newUser, newToken) => {
    setUser(newUser);
    if (newToken) {
      setToken(newToken);
      setAuthToken(newToken);
    }
    if (typeof window !== "undefined" && newUser) {
      try {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(newUser));
      } catch {}
    }
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    removeAuthToken();
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_USER_KEY);
      } catch {}
    }
  }, []);

  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.login(credentials);
      if (res.success && res.user) {
        saveSession(res.user, res.token);
        return { success: true, user: res.user, token: res.token };
      } else {
        const msg = res.message || "Invalid credentials. Please check your email and password.";
        setError(msg);
        return { success: false, error: msg };
      }
    } catch (err) {
      const msg = err.message || "Login failed. Please try again.";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, [saveSession]);

  const register = useCallback(async (payload) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.register(payload);
      if (res.success && res.user) {
        saveSession(res.user, res.token);
        return { success: true, user: res.user, token: res.token };
      } else {
        const msg = res.message || "Registration failed. Please check your details.";
        setError(msg);
        return { success: false, error: msg };
      }
    } catch (err) {
      const msg = err.message || "Registration error occurred.";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, [saveSession]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch {
      // ignore network errors on logout
    } finally {
      clearSession();
      setIsLoading(false);
    }
  }, [clearSession]);

  const normalizedRole = user?.role ? toFrontendRole(user.role) : null;
  const isAuthenticated = Boolean(user && (USE_MOCK || token));

  const value = {
    user,
    token,
    role: normalizedRole,
    rawRole: user?.role || null,
    isLoading,
    isAuthenticated,
    error,
    login,
    register,
    logout,
    clearSession,
    saveSession,
    isTalent: isTalent(user?.role),
    isRecruiter: isRecruiter(user?.role),
    isAdmin: isAdmin(user?.role),
    getDashboardPath: () => getDashboardPath(user?.role),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
