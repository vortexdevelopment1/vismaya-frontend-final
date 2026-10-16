import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/user.model.js";
import Otp from "../models/otp.model.js";
import { sendEmail } from "../services/email.service.js";
import { createSession } from "../services/session.service.js";
import { logAdminAction } from "../services/audit.service.js";
import { isValidEmail, sanitizeEmail } from "../utils/sanitize.util.js";

const GENERIC_ADMIN_AUTH_ERROR = "Invalid email or password";

const validatePasswordStrength = (password: string): { isValid: boolean; error?: string } => {
    if (!password || typeof password !== "string") {
        return { isValid: false, error: "Password is required" };
    }
    if (password.length < 12) {
        return { isValid: false, error: "Password must be at least 12 characters long" };
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

        // Account Lockout check (5 failed attempts -> 15 min lock)
        if (user.adminLockUntil && user.adminLockUntil > new Date()) {
            const minutesLeft = Math.ceil((user.adminLockUntil.getTime() - Date.now()) / (60 * 1000));
            return res.status(429).json({
                success: false,
                message: `Account is temporarily locked due to repeated failed login attempts. Please try again in ${minutesLeft} minute(s).`
            });
        }

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
            if (currentFailed >= 5) {
                user.adminLockUntil = new Date(Date.now() + 15 * 60 * 1000);
            }
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

        // Send 2FA email
        await sendEmail({
            to: user.email,
            subject: "Vismaya Admin Portal - Two-Factor Authentication Code",
            text: `Hello ${user.name},\n\nYour 6-digit two-factor authentication code for the Vismaya Admin Portal is: ${otpCode}\n\nThis code expires in 5 minutes. Do not share this code with anyone.\n\nBest regards,\nVismaya Security Team`
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
            message: "Two-factor verification code sent to your registered admin email."
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

        const otpRecord: any = await Otp.findOne({
            email: user.email as string,
            purpose: "2fa_login",
            isUsed: false,
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
        }

        if (otpRecord.attempts >= 5) {
            await Otp.deleteOne({ _id: otpRecord._id });
            return res.status(429).json({ success: false, message: "Too many incorrect attempts. Please initiate login again." });
        }

        const isValid = await bcrypt.compare(String(otp).trim(), otpRecord.otpHash);
        if (!isValid) {
            await Otp.findByIdAndUpdate(otpRecord._id, { $inc: { attempts: 1 } });
            return res.status(400).json({ success: false, message: "Invalid verification code" });
        }

        // Mark OTP used
        await Otp.findByIdAndUpdate(otpRecord._id, { isUsed: true });

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
