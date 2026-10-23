import { Router } from "express";
import {
    adminLogin,
    adminVerify2FA,
    adminForgotPassword,
    adminResetPassword
} from "../controllers/adminAuth.controller.js";
import {
    adminLoginLimiter,
    adminForgotPasswordLimiter,
    adminResetPasswordLimiter
} from "../middleware/rateLimit.middleware.js";

const router = Router();

// Dedicated Admin Authentication & Recovery Routes
// Mounted at /api/admin/auth and /api/auth/admin
router.post("/login", adminLoginLimiter, adminLogin);
router.post("/verify-2fa", adminVerify2FA);
router.post("/forgot-password", adminForgotPasswordLimiter, adminForgotPassword);
router.post("/reset-password", adminResetPasswordLimiter, adminResetPassword);

export default router;
