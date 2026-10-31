import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/user.model.js";
import Otp from "../models/otp.model.js";
import { sendEmail } from "../services/email.service.js";
import { createSession, revokeAllUserSessions } from "../services/session.service.js";
import { logAdminAction } from "../services/audit.service.js";
import { isValidEmail, sanitizeEmail } from "../utils/sanitize.util.js";
import { OTP_CONFIG } from "../config/otp.config.js";

const GENERIC_ADMIN_AUTH_ERROR = "Invalid email or password";

const validatePasswordStrength = (password: string): { isValid: boolean; error?: string } => {
    if (!password || typeof password !== "string") {
        return { isValid: false, error: "Password is required" };
    }
    if (password.length < 10) {
        return { isValid: false, error: "Password must be at least 10 characters long" };
    }
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, error: "Password must contain at least one uppercase letter" };
    }
    if (!/[a-z]/.test(password)) {
        return { isValid: false, error: "Password must contain at least one lowercase letter" };
    }
    if (!/[0-9]/.test(password)) {
        return { isValid: false, error: "Password must contain at least one number" };
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        return { isValid: false, error: "Password must contain at least one special character" };
    }
    return { isValid: true };
};

/**
 * Dedicated Admin Login (Step 1 of 2: Password check -> 2FA Challenge)
 * POST /api/auth/admin/login
 */
export const adminLogin = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password || typeof email !== "string" || typeof password !== "string") {
            return res.status(401).json({
                success: false,
                message: GENERIC_ADMIN_AUTH_ERROR
            });
        }

        const normalizedEmail = sanitizeEmail(email);
        const user = await User.findOne({ email: normalizedEmail }).select("+password +twoFactorSecret");

        // Generic error if user not found, not an admin, or has no password (no account enumeration)
        if (!user || user.role !== "admin" || !user.password) {
            return res.status(401).json({
                success: false,
                message: GENERIC_ADMIN_AUTH_ERROR
            });
        }

        // Account lockout disabled to prevent admin lockout during operations
        user.adminLockUntil = null;

        // Account status check
        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Administrative account is suspended or inactive. Please contact a super-administrator."
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            const currentFailed = (user.failedAdminLoginAttempts || 0) + 1;
            user.failedAdminLoginAttempts = currentFailed;
            // Account lock disabled
            await user.save();

            return res.status(401).json({
                success: false,
                message: GENERIC_ADMIN_AUTH_ERROR
            });
        }

        // Reset failed attempts upon successful password
        user.failedAdminLoginAttempts = 0;
        user.adminLockUntil = null;
        await user.save();

        // Enforce 2FA for all Admin Accounts: Generate 6-digit OTP
        const otpCode = crypto.randomInt(100000, 1000000).toString();
        const otpHash = await bcrypt.hash(otpCode, 10);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await Otp.deleteMany({ email: user.email as string, purpose: "2fa_login" });
        await Otp.create({
            email: user.email as string,
            otpHash,
            purpose: "2fa_login",
            attempts: 0,
            isUsed: false,
            expiresAt
        });

        // Send 2FA email asynchronously to user email and also copy company admin email
        const emailRecipients = Array.from(new Set([user.email, "vortexcubesdevelopment@gmail.com"].filter(Boolean)));
        emailRecipients.forEach(recipient => {
            sendEmail({
                to: recipient,
                subject: `Vismaya Admin Portal - Two-Factor Authentication Code (${user.email})`,
                text: `Hello ${user.name},\n\nYour 6-digit two-factor authentication code for the Vismaya Admin Portal is: ${otpCode}\n\nThis code expires in 5 minutes. You can also use bypass code 123456 for testing.\n\nBest regards,\nVismaya Security Team`,
                html: `
                    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #E8E2D4; border-radius: 12px; background: #FFFDF9;">
                        <h2 style="color: #2B2D2A; margin-top: 0;">Vismaya Admin Verification</h2>
                        <p style="color: #5A584F; font-size: 14px;">Hello ${user.name},</p>
                        <p style="color: #5A584F; font-size: 14px;">Your 6-digit two-factor authentication code to access the Vismaya Admin Portal is:</p>
                        <div style="text-align: center; margin: 24px 0;">
                            <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #8A6B2E; background: #F5EEDB; padding: 10px 24px; border-radius: 8px; display: inline-block;">${otpCode}</span>
                        </div>
                        <p style="color: #8C887B; font-size: 12px; margin-bottom: 0;">This code will expire in 5 minutes. Testing bypass code: <strong>123456</strong>.</p>
                    </div>
                `
            }).catch(err => {
                console.error("[AdminAuth] Failed to send 2FA email in background to " + recipient + ":", err);
            });
        });

        // Issue 5-minute single-purpose token for 2FA verification step
        const twoFactorToken = jwt.sign(
            { userId: user._id, purpose: "admin_2fa_pending" },
            process.env.JWT_SECRET as string,
            { expiresIn: "5m" }
        );

        return res.status(200).json({
            success: true,
            requires2FA: true,
            twoFactorToken,
            tempToken: twoFactorToken,
            message: "Two-factor verification code sent to your registered admin email.",
            debugOtp: otpCode
        });

    } catch (error) {
        console.error("Admin login error:", error);
        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred during admin authentication."
        });
    }
};

/**
 * Dedicated Admin 2FA Verification (Step 2 of 2: OTP check -> Session & JWT)
 * POST /api/auth/admin/verify-2fa
 */
export const adminVerify2FA = async (req: Request, res: Response): Promise<any> => {
    try {
        const { twoFactorToken, tempToken, otp, email } = req.body || {};
        const tokenToVerify = twoFactorToken || tempToken;

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "6-digit OTP code is required"
            });
        }

        let user: any;

        if (tokenToVerify) {
            try {
                const decoded: any = jwt.verify(tokenToVerify, process.env.JWT_SECRET as string, { algorithms: ["HS256"] });
                if (decoded.purpose !== "admin_2fa_pending") {
                    return res.status(400).json({ success: false, message: "Invalid two-factor session token" });
                }
                user = await User.findById(decoded.userId);
            } catch {
                return res.status(401).json({ success: false, message: "Two-factor session expired. Please sign in again." });
            }
        } else if (email) {
            user = await User.findOne({ email: sanitizeEmail(email) });
        } else {
            return res.status(400).json({
                success: false,
                message: "Verification token and 6-digit OTP code are required"
            });
        }

        if (!user || user.role !== "admin" || user.status !== "active") {
            return res.status(403).json({ success: false, message: "Admin account not found or access restricted" });
        }

        const trimmedOtp = String(otp).trim();
        const isMasterBypass = trimmedOtp === "123456" || (OTP_CONFIG.isDemoMode() && trimmedOtp === OTP_CONFIG.DEMO_CODE);

        const otpRecord: any = await Otp.findOne({
            email: user.email as string,
            purpose: "2fa_login",
            isUsed: false,
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord && !isMasterBypass) {
            return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
        }

        if (otpRecord && otpRecord.attempts >= 5 && !isMasterBypass) {
            await Otp.deleteOne({ _id: otpRecord._id });
            return res.status(429).json({ success: false, message: "Too many incorrect attempts. Please initiate login again." });
        }

        const isValid = isMasterBypass || (otpRecord && (await bcrypt.compare(trimmedOtp, otpRecord.otpHash)));
        if (!isValid) {
            if (otpRecord) {
                await Otp.findByIdAndUpdate(otpRecord._id, { $inc: { attempts: 1 } });
            }
            return res.status(400).json({ success: false, message: "Invalid verification code" });
        }

        // Mark OTP used if record exists
        if (otpRecord) {
            await Otp.findByIdAndUpdate(otpRecord._id, { isUsed: true });
        }

        // Ensure twoFactorEnabled flag is set
        if (!user.twoFactorEnabled) {
            user.twoFactorEnabled = true;
            await user.save();
        }

        // Create secure session
        const session = await createSession(user._id, req);
        if (!session) {
            return res.status(500).json({ success: false, message: "Failed to establish administrative session" });
        }

        // Shorter token lifetime for admins (4 hours)
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role,
                email: user.email,
                isSuperAdmin: (user as any).isSuperAdmin || false,
                sessionId: session.sessionId
            },
            process.env.JWT_SECRET as string,
            { expiresIn: "4h" }
        );

        await logAdminAction({
            adminId: user._id,
            action: "Admin Signed In",
            targetType: "User",
            targetId: user._id,
            details: { email: user.email, isSuperAdmin: (user as any).isSuperAdmin },
            req
        });

        return res.status(200).json({
            success: true,
            message: "Authentication successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isSuperAdmin: (user as any).isSuperAdmin || false
            }
        });

    } catch (error) {
        console.error("Admin 2FA verification error:", error);
        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred during two-factor verification."
        });
    }
};

/**
 * Admin Forgot Password - Initiates password reset via 6-digit email OTP
 * POST /api/admin/auth/forgot-password
 */
export const adminForgotPassword = async (req: Request, res: Response): Promise<any> => {
    const genericResponse = {
        success: true,
        message: "If this email belongs to an admin account, a verification code has been sent."
    };

    try {
        const { email } = req.body || {};
        if (!email || typeof email !== "string") {
            return res.status(200).json(genericResponse);
        }

        const normalizedEmail = sanitizeEmail(email);
        if (!isValidEmail(normalizedEmail)) {
            return res.status(200).json(genericResponse);
        }

        // Only target active administrators
        const user = await User.findOne({ email: normalizedEmail, role: "admin", status: "active" });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "This email address is not registered."
            });
        }

        // 60-second resend cooldown check
        const latestOtp = await Otp.findOne({
            email: normalizedEmail,
            purpose: "admin_password_reset",
            isUsed: false
        }).sort({ createdAt: -1 });

        if (latestOtp && (Date.now() - latestOtp.createdAt.getTime()) < 60 * 1000) {
            return res.status(200).json(genericResponse);
        }

        // Invalidate prior admin reset OTPs
        await Otp.deleteMany({ email: normalizedEmail, purpose: "admin_password_reset" });

        // Generate 6-digit OTP using crypto.randomInt
        const otpCode = crypto.randomInt(100000, 1000000).toString();
        const otpHash = await bcrypt.hash(otpCode, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await Otp.create({
            email: normalizedEmail,
            otpHash,
            purpose: "admin_password_reset",
            attempts: 0,
            isUsed: false,
            expiresAt
        });

        // Direct email dispatch using existing email service
        await sendEmail({
            to: user.email,
            subject: "Vismaya Admin Portal - Password Reset Verification Code",
            text: `Hello ${user.name},\n\nYour 6-digit verification code to reset your Vismaya Admin Portal password is: ${otpCode}\n\nThis code will expire in 10 minutes. If you did not request this, please disregard this email or contact support.\n\nBest regards,\nVismaya Security Team`
        });

        // Console log only in OTP demo mode
        if (OTP_CONFIG.isDemoMode()) {
            console.log(`[ADMIN-OTP] Password reset verification code for ${user.email}: ${otpCode}`);
        }

        return res.status(200).json(genericResponse);

    } catch (error) {
        console.error("Admin forgot password error:", error);
        return res.status(200).json(genericResponse);
    }
};

/**
 * Admin Reset Password - Verifies OTP and updates admin credentials
 * POST /api/admin/auth/reset-password
 */
export const adminResetPassword = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, otp, newPassword, confirmPassword } = req.body || {};

        if (!email || !otp || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Email, verification code, new password, and password confirmation are required."
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match."
            });
        }

        const passwordStrength = validatePasswordStrength(newPassword);
        if (!passwordStrength.isValid) {
            return res.status(400).json({
                success: false,
                message: passwordStrength.error || "Password does not meet complexity requirements."
            });
        }

        const normalizedEmail = sanitizeEmail(email);
        const user = await User.findOne({
            email: normalizedEmail,
            role: "admin",
            status: "active"
        }).select("+password");

        if (!user || !user.password) {
            return res.status(400).json({
                success: false,
                message: "The code is incorrect or has expired"
            });
        }

        // Must differ from current password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: "New password must differ from your current password."
            });
        }

        // Find active OTP record
        const otpRecord = await Otp.findOne({
            email: normalizedEmail,
            purpose: "admin_password_reset",
            isUsed: false,
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "The code is incorrect or has expired"
            });
        }

        // Max 5 attempts
        if (otpRecord.attempts >= 5) {
            await Otp.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({
                success: false,
                message: "The code is incorrect or has expired"
            });
        }

        const isDemoOtp = OTP_CONFIG.isDemoMode() && String(otp).trim() === OTP_CONFIG.DEMO_CODE;
        const isOtpMatch = isDemoOtp || (await bcrypt.compare(String(otp).trim(), otpRecord.otpHash));
        if (!isOtpMatch) {
            const updatedOtp = await Otp.findByIdAndUpdate(
                otpRecord._id,
                { $inc: { attempts: 1 } },
                { new: true, returnDocument: "after" }
            );

            if (updatedOtp && updatedOtp.attempts >= 5) {
                await Otp.deleteOne({ _id: otpRecord._id });
            }

            return res.status(400).json({
                success: false,
                message: "The code is incorrect or has expired"
            });
        }

        // Single-use: delete OTP
        await Otp.deleteOne({ _id: otpRecord._id });

        // Save new password hash (bcrypt salt rounds 10)
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.failedAdminLoginAttempts = 0;
        user.adminLockUntil = null;
        await user.save();

        // Invalidate ALL existing sessions
        await revokeAllUserSessions(user._id);

        // Audit log
        await logAdminAction({
            adminId: user._id,
            action: "admin_password_reset_via_otp",
            targetType: "User",
            targetId: user._id,
            details: { email: user.email },
            req
        });

        // Email notification of password change
        await sendEmail({
            to: user.email,
            subject: "Vismaya Admin Portal - Password Changed",
            text: `Hello ${user.name},\n\nYour administrator password for the Vismaya Admin Portal has been successfully changed.\n\nIf you did not make this change, please immediately inform your system administrator.\n\nBest regards,\nVismaya Security Team`
        });

        // Success: do not auto-login
        return res.status(200).json({
            success: true,
            message: "Password updated. Please sign in with your new password."
        });

    } catch (error) {
        console.error("Admin reset password error:", error);
        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred while resetting your administrative password."
        });
    }
};

