/**
 * Authentication API Service
 * Handles user registration, login, OTP verification, session tokens, password recovery, and profile queries.
 */

import { apiClient } from "../client.js";
import { isRealMode } from "../config.js";
import { mapUser } from "../mappers/index.js";
import { toBackendRole } from "../roles.js";

export const authService = {
  /**
   * Register a new user
   * @param {Object} payload { email, password, role, name, studioName, ... }
   */
  async register(payload) {
    if (!isRealMode("auth")) {
      return {
        success: true,
        user: {
          id: "usr_mock_reg_" + Date.now(),
          email: payload.email,
          role: payload.role || "talent",
          name: payload.name || "New User",
          status: "pending",
        },
        token: "mock_jwt_token_" + Date.now(),
      };
    }

    const backendPayload = { ...payload, role: toBackendRole(payload.role) };
    const res = await apiClient.post("/api/auth/register", backendPayload);
    const data = res?.data || res;
    const rawUser = res?.user || res?.data?.user || (data?.email ? data : null);
    const token = res?.token || res?.data?.token || data?.token;
    return {
      success: true,
      user: rawUser ? mapUser(rawUser) : null,
      token: token || null,
      message: res?.message || data?.message,
    };
  },

  /**
   * Verify email OTP for account activation
   * @param {Object} payload { email, otp }
   */
  async verifyRegistration({ email, otp }) {
    if (!isRealMode("auth")) {
      return {
        success: true,
        message: "Email verified successfully (Mock)",
        token: "mock_jwt_verified",
        user: { id: "usr_mock", email, status: "active" },
      };
    }
    const res = await apiClient.post("/api/auth/verify-registration", { email, otp });
    return {
      success: true,
      message: res?.message || "Verified successfully",
      token: res?.token || res?.data?.token,
      user: res?.user ? mapUser(res.user) : null,
    };
  },

  /**
   * Resend registration verification OTP
   * @param {Object} payload { email }
   */
  async resendRegistrationOtp({ email }) {
    if (!isRealMode("auth")) {
      return { success: true, message: "Verification OTP resent (Mock)" };
    }
    return apiClient.post("/api/auth/resend-registration-otp", { email });
  },

  /**
   * Save registration draft directly to MongoDB database
   * @param {Object} payload { email, role, currentStep, formData }
   * @param {string} draftToken
   */
  async saveDraft(payload, draftToken = null) {
    if (!isRealMode("auth")) {
      return { success: true, draft: payload };
    }
    const headers = {};
    if (draftToken) headers["x-draft-token"] = draftToken;
    const res = await apiClient.post("/api/auth/draft", payload, { headers });
    return res?.data || res;
  },

  /**
   * Get registration draft from MongoDB database
   * @param {string} draftToken
   * @param {string} email
   */
  async getDraft(draftToken, email = null) {
    if (!isRealMode("auth") || !draftToken) {
      return { success: false };
    }
    const headers = { "x-draft-token": draftToken };
    const query = email ? `?email=${encodeURIComponent(email)}` : "";
    const res = await apiClient.get(`/api/auth/draft${query}`, { headers });
    return res?.data || res;
  },

  /**
   * Delete registration draft from MongoDB database
   * @param {string} draftToken
   */
  async deleteDraft(draftToken) {
    if (!isRealMode("auth") || !draftToken) {
      return { success: true };
    }
    const headers = { "x-draft-token": draftToken };
    const res = await apiClient.delete("/api/auth/draft", { headers });
    return res?.data || res;
  },

  /**
   * Log in an existing user
   * @param {Object} credentials { email, password }
   */
  async login({ email, password }) {
    if (!isRealMode("auth")) {
      let role = "talent";
      if (email?.includes("recruiter") || email?.includes("org") || email?.includes("zee") || email?.includes("dharma")) {
        role = "organization";
      } else if (email?.includes("admin")) {
        role = "admin";
      }

      return {
        success: true,
        user: {
          id: "usr_mock_" + role,
          email,
          role,
          name: role === "admin" ? "Admin User" : role === "organization" ? "Zee Films Recruiter" : "Aarav Sharma",
          status: "active",
        },
        token: "mock_jwt_token_auth",
      };
    }

    const res = await apiClient.post("/api/auth/login", { email, password });
    const data = res?.data || res;
    const rawUser = res?.user || res?.data?.user || (data?.email ? data : null);
    const token = res?.token || res?.data?.token || data?.token;
    return {
      success: true,
      user: rawUser ? mapUser(rawUser) : null,
      token: token || null,
      sessionId: res?.sessionId || data?.sessionId,
    };
  },

  /**
   * Initiate password recovery
   * @param {Object} payload { email }
   */
  async forgotPassword({ email }) {
    if (!isRealMode("auth")) {
      return { success: true, message: "OTP sent to your email (Mock)" };
    }
    return apiClient.post("/api/auth/forgot-password", { email });
  },

  /**
   * Verify OTP code for password recovery
   * @param {Object} payload { email, otp }
   */
  async verifyOtp({ email, otp }) {
    if (!isRealMode("auth")) {
      return { success: true, message: "OTP verified (Mock)" };
    }
    return apiClient.post("/api/auth/verify-otp", { email, otp });
  },

  /**
   * Reset password with verified OTP
   * @param {Object} payload { email, otp, newPassword }
   */
  async resetPassword({ email, otp, newPassword }) {
    if (!isRealMode("auth")) {
      return { success: true, message: "Password updated successfully (Mock)" };
    }
    return apiClient.post("/api/auth/reset-password", { email, otp, newPassword });
  },

  /**
   * Authenticated password change
   * @param {Object} payload { currentPassword, newPassword }
   */
  async changePassword({ currentPassword, newPassword }) {
    if (!isRealMode("auth")) {
      return { success: true, message: "Password updated successfully (Mock)" };
    }
    return apiClient.post("/api/auth/change-password", { currentPassword, newPassword });
  },

  /**
   * Active login sessions list
   */
  async getSessions() {
    if (!isRealMode("auth")) {
      return {
        success: true,
        data: [
          {
            id: "sess_mock_1",
            device: "Chrome on Windows 11",
            ip: "127.0.0.1",
            lastActive: new Date().toISOString(),
            isCurrent: true,
          },
        ],
      };
    }
    const res = await apiClient.get("/api/auth/sessions");
    return {
      success: true,
      data: res?.data || res?.sessions || res || [],
    };
  },

  /**
   * Revoke specific login session
   * @param {string} sessionId
   */
  async revokeSession(sessionId) {
    if (!isRealMode("auth")) {
      return { success: true, message: "Session revoked (Mock)" };
    }
    return apiClient.delete(`/api/auth/sessions/${sessionId}`);
  },

  /**
   * Revoke all other login sessions
   */
  async revokeAllSessions() {
    if (!isRealMode("auth")) {
      return { success: true, message: "All other sessions revoked (Mock)" };
    }
    return apiClient.post("/api/auth/logout-all");
  },

  /**
   * Google OAuth sign-in / registration
   * Backend endpoint: POST /api/auth/google
   * @param {string} idToken Google ID token / credential from Google Identity Services
   * @param {string} [role] Optional role selected during registration ('talent' | 'organization')
   */
  async loginWithGoogle(idToken, role) {
    if (!isRealMode("auth")) {
      return {
        success: true,
        user: {
          id: "usr_mock_google_" + Date.now(),
          email: "google.user@vismaya.io",
          role: role || "talent",
          name: "Google Verified User",
          status: "active",
        },
        token: "mock_jwt_token_google",
      };
    }

    // Call backend POST /api/auth/google with { idToken, role }
    // Map frontend role ("recruiter") to backend enum ("organization") before sending
    const res = await apiClient.post("/api/auth/google", { idToken, role: toBackendRole(role) });
    const data = res?.data || res;
    const rawUser = res?.user || res?.data?.user || (data?.email ? data : null);
    const token = res?.token || res?.data?.token || data?.token;
    return {
      success: true,
      user: rawUser ? mapUser(rawUser) : null,
      token: token || null,
      message: res?.message || data?.message,
    };
  },

  /**
   * Server-side token invalidation / logout
   */
  async logout() {
    if (!isRealMode("auth")) {
      return { success: true, message: "Logged out (Mock)" };
    }
    return apiClient.post("/api/auth/logout");
  },
};
