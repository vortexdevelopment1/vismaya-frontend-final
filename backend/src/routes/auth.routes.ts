import express, { Router, Request, Response, NextFunction } from "express";
import {  authLimiter, otpLimiter, draftLimiter, adminLoginLimiter, adminForgotPasswordLimiter, adminResetPasswordLimiter  } from "../middleware/rateLimit.middleware.js";
import {  authenticateUser  } from "../middleware/auth.middleware.js";
import {
    adminLogin,
    adminVerify2FA,
    adminForgotPassword,
    adminResetPassword
} from "../controllers/adminAuth.controller.js";

import { 
    registerUser,
    verifyRegistration,
    resendRegistrationOtp,
    loginUser,
    googleLogin,
    setup2FA,
    verify2FASetup,
    disable2FA,
    verify2FALogin,
    changePassword,
    requestChangePasswordOtp,
    requestAccountDeletion,
    requestAccountDeletionOtp,
    requestEmailChange,
    verifyEmailChange,
    changeMobile,
    getUserSessions,
    revokeUserSession,
    logoutUser,
    logoutAllSessions,
    saveRegistrationDraft,
    getRegistrationDraft,
    deleteRegistrationDraft,
    forgotPassword,
    verifyOtp,
    resetPassword,
    checkAvailability,
    uploadAccreditationDocument,
    getOtpConfig
 } from "../controllers/auth.controller.js";
import { handleAccreditationUpload, verifyUploadMagicBytes } from "../middleware/upload.middleware.js";

const router = express.Router();

// Public OTP Configuration
router.get("/otp-config", getOtpConfig);

// Dedicated Admin Authentication
router.post("/admin/login", adminLoginLimiter, adminLogin);
router.post("/admin/verify-2fa", otpLimiter, adminVerify2FA);
router.post("/admin/forgot-password", adminForgotPasswordLimiter, adminForgotPassword);
router.post("/admin/reset-password", adminResetPasswordLimiter, adminResetPassword);

// Registration & Verification
router.post("/check-availability", draftLimiter, checkAvailability);
router.post("/register", authLimiter, registerUser);
router.post(
    "/upload-accreditation-document",
    draftLimiter,
    handleAccreditationUpload,
    verifyUploadMagicBytes,
    uploadAccreditationDocument
);
router.post("/verify-registration", otpLimiter, verifyRegistration);
router.post("/resend-registration-otp", otpLimiter, resendRegistrationOtp);

// Login & SSO
router.post("/login", authLimiter, loginUser);
router.post("/google", authLimiter, googleLogin);

// 2FA Endpoints
router.post("/2fa/setup", authenticateUser, setup2FA);
router.post("/2fa/enable", authenticateUser, setup2FA);
router.post("/2fa/verify", authenticateUser, verify2FASetup);
router.post("/2fa/disable", authenticateUser, disable2FA);
router.post("/2fa/challenge", otpLimiter, verify2FALogin);
router.post("/verify-2fa", otpLimiter, verify2FALogin);

// Account Lifecycle (Spec §38)
router.post("/delete-account/request-otp", authenticateUser, otpLimiter, requestAccountDeletionOtp);
router.post("/delete-account/confirm", authenticateUser, otpLimiter, requestAccountDeletion);
router.delete("/account", authenticateUser, requestAccountDeletion);

// Email & Mobile Updates
router.post("/change-email", authenticateUser, otpLimiter, requestEmailChange);
router.post("/verify-email-change", authenticateUser, otpLimiter, verifyEmailChange);
router.put("/change-mobile", authenticateUser, changeMobile);
router.post("/change-mobile", authenticateUser, changeMobile);

// Registration Draft Autosave & Resume (Pre-payment, protected by draftLimiter & x-draft-token)
router.post("/draft", draftLimiter, saveRegistrationDraft);
router.put("/draft", draftLimiter, saveRegistrationDraft);
router.get("/draft", draftLimiter, getRegistrationDraft);
router.delete("/draft", draftLimiter, deleteRegistrationDraft);

// Password recovery routes (protected by strict OTP rate limiter)
router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/verify-otp", otpLimiter, verifyOtp);
router.post("/reset-password", otpLimiter, resetPassword);

// Authenticated Password Change (Spec §38: Current password OR OTP)
router.post("/change-password/request-otp", authenticateUser, otpLimiter, requestChangePasswordOtp);
router.post("/change-password", authenticateUser, changePassword);

// Active Server-Side Session Management & Logout
router.get("/sessions", authenticateUser, getUserSessions);
router.delete("/sessions/:sessionId", authenticateUser, revokeUserSession);
router.post("/logout", authenticateUser, logoutUser);
router.post("/logout-all", authenticateUser, logoutAllSessions);

export default router;