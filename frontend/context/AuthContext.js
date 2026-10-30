"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/api/services/authService";
import { getAuthToken, setAuthToken, removeAuthToken } from "@/lib/api/client";
import { toFrontendRole, getDashboardPath, isTalent, isRecruiter, isAdmin } from "@/lib/api/roles";
import { USE_MOCK, isRealMode } from "@/lib/api/config";

const AuthContext = createContext(null);

const STORAGE_USER_KEY = "vismaya_user_data";
const CURRENT_APP_VERSION = "2.1.0-prod";

const DOMAIN_STORAGE_KEYS = [
  STORAGE_USER_KEY,
  "vismaya_user_data",
  "vismaya_auth_token",
  "vismaya_talent_profile",
  "vismaya_talent_portfolio",
  "vismaya_workflow_store_v2",
  "vismaya_payment_talent_status",
  "vismaya_credits",
  "vismaya_recruiter_profile",
  "vismaya_admin_analytics",
  "vismaya_registration_draft",
  "vismaya_draft_token",
  "vismaya_reg_session_active"
];

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState(null);

  // Restore session on mount (SSR safe) & auto-flush stale browser cache from older deployments
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const savedVersion = localStorage.getItem("vismaya_app_version");
        if (savedVersion !== CURRENT_APP_VERSION) {
          // Flush obsolete cached keys from prior releases/demo logins
          DOMAIN_STORAGE_KEYS.forEach(k => {
            try {
              localStorage.removeItem(k);
              sessionStorage.removeItem(k);
            } catch {}
          });
          localStorage.setItem("vismaya_app_version", CURRENT_APP_VERSION);
          removeAuthToken();
          setUser(null);
          setToken(null);
          setIsLoading(false);
          return;
        }
      }

      const storedToken = getAuthToken();
      const rawUser = typeof window !== "undefined" ? localStorage.getItem(STORAGE_USER_KEY) : null;
      
      // Both token and user must exist to be considered valid; otherwise clear ghost session
      if (storedToken && rawUser) {
        try {
          const parsed = JSON.parse(rawUser);
          if (parsed && (parsed.id || parsed._id)) {
            setToken(storedToken);
            setUser(parsed);
          } else {
            removeAuthToken();
            if (typeof window !== "undefined") localStorage.removeItem(STORAGE_USER_KEY);
          }
        } catch {
          removeAuthToken();
          if (typeof window !== "undefined") localStorage.removeItem(STORAGE_USER_KEY);
        }
      } else if (rawUser && !storedToken) {
        if (typeof window !== "undefined") localStorage.removeItem(STORAGE_USER_KEY);
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
        const oldUser = localStorage.getItem(STORAGE_USER_KEY);
        if (oldUser) {
          try {
            const parsed = JSON.parse(oldUser);
            if (parsed?.id && newUser?.id && parsed.id !== newUser.id) {
              ["vismaya_talent_profile", "vismaya_talent_portfolio", "vismaya_workflow_store_v2", "vismaya_credits", "vismaya_recruiter_profile"].forEach(k => localStorage.removeItem(k));
            }
          } catch {}
        }
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(newUser));
      } catch {}
    }
  }, []);

  const updateUser = useCallback((partialUser) => {
    setUser((prev) => {
      const updated = { ...(prev || {}), ...partialUser };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    removeAuthToken();
    if (typeof window !== "undefined") {
      try {
        DOMAIN_STORAGE_KEYS.forEach(k => {
          localStorage.removeItem(k);
          sessionStorage.removeItem(k);
        });
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
        if (res.token && res.user.status === "active") {
          saveSession(res.user, res.token);
        }
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

  const loginWithGoogle = useCallback(async (idToken, role) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.loginWithGoogle(idToken, role);
      if (res.success && res.user) {
        saveSession(res.user, res.token);
        return { success: true, user: res.user, token: res.token };
      } else {
        const msg = res.message || "Google sign-in is not available yet. Please use email and password.";
        setError(msg);
        return { success: false, error: msg };
      }
    } catch (err) {
      const msg = "Google sign-in is not available yet. Please use email and password.";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, [saveSession]);

  const logout = useCallback(async (customRedirect) => {
    setIsLoggingOut(true);
    setIsLoading(true);
    try {
      await authService.logout();
    } catch {
      // ignore network errors on logout
    } finally {
      clearSession();
      setIsLoading(false);
      if (typeof window !== "undefined") {
        router.replace(customRedirect || "/");
      }
      setTimeout(() => {
        setIsLoggingOut(false);
      }, 800);
    }
  }, [clearSession, router]);

  const normalizedRole = user?.role ? toFrontendRole(user.role) : null;
  const isAuthenticated = Boolean(user && (USE_MOCK || token));

  const value = {
    user,
    token,
    role: normalizedRole,
    rawRole: user?.role || null,
    isLoading,
    isLoggingOut,
    isAuthenticated,
    error,
    login,
    loginWithGoogle,
    register,
    logout,
    clearSession,
    saveSession,
    updateUser,
    isTalent: isTalent(user?.role),
    isRecruiter: isRecruiter(user?.role),
    isAdmin: isAdmin(user?.role),
    getDashboardPath: (overrideRole) => getDashboardPath(overrideRole || user?.role),
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
