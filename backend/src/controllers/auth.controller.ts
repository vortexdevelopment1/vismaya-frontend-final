import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/user.model.js";
import Otp from "../models/otp.model.js";
import RegistrationDraft from "../models/registrationDraft.model.js";
import Organization from "../models/organization.model.js";
import TalentProfile from "../models/talentProfile.model.js";
import Verification from "../models/verification.model.js";
import CreditLedger from "../models/creditLedger.model.js";
import { sendEmail } from "../services/email.service.js";
import { sendSms } from "../services/sms.service.js";
import { notifyUser } from "../services/notification.service.js";
import { createSession, getUserSessions as fetchUserSessions, revokeSession as revokeSessionById, revokeAllUserSessions } from "../services/session.service.js";
import { verifyGoogleToken } from "../services/authProvider.service.js";
import { isValidEmail, sanitizeEmail } from "../utils/sanitize.util.js";
import {
    validateRegisterInput,
    validateLoginInput,
    validateChangePasswordInput,
    validateGoogleLoginInput,
    validateDraftInput
} from "../validators/auth.validator.js";

const hashToken = (token: string): string => crypto.createHash("sha256").update(token).digest("hex");

const calculateRegistrationStep = async (user: any): Promise<string> => {
    if (user.role === "talent") {
        const profile = await TalentProfile.findOne({ userId: user._id });
        if (!profile) return "talent_profile";
        if (!user.isPaid) return "payment_pending";
        return "completed";
    }
    if (user.role === "organization") {
        const org = await Organization.findOne({ userId: user._id });
        if (!org) return "org_profile";
        if (!user.isPaid) return "payment_pending";
        return "completed";
    }
    return "completed";
};

const getAccountStatusError = (status: string): string => {
    if (status === "pending") return "Your account is currently under review";
    if (status === "suspended") return "Your account has been suspended. Please contact support.";
    if (status === "restricted") return "Your account access is currently restricted. Please contact support.";
    if (status === "banned") return "Your account has been permanently banned.";
    if (status === "rejected") return "Your account application was rejected. Please contact support.";
    if (status === "deletion_requested") return "Your account is pending deletion and cannot be accessed.";
    if (status === "deleted") return "This account no longer exists.";
    return `Account is ${status}`;
};

export const registerUser = async (req: Request, res: Response): Promise<any> => {
    try {
        const validation = validateRegisterInput(req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.errors[0],
                errors: validation.errors
            });
        }

        const { name, email, password, role, mobile } = validation.sanitized;

        // Double safeguard: ensure role strictly comes from allowlist
        if (!["talent", "organization"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role must be either 'talent' or 'organization'"
            });
        }

        // Check whether email already exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        if (mobile) {
            const raw10 = String(mobile).replace(/[^0-9]/g, "").slice(-10);
            const with91 = `+91${raw10}`;
            const existingMobile = await User.findOne({
                $or: [{ mobile }, { mobile: raw10 }, { mobile: with91 }]
            });
            if (existingMobile) {
                return res.status(409).json({
                    success: false,
                    message: "User with this mobile number already exists"
                });
            }
        }

        // Create user with status: "pending"
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            mobile,
            password: hashedPassword,
            role,
            status: "pending",
            isEmailVerified: false,
            isPaid: Boolean(validation.sanitized?.isPaid)
        });

        // Atomically initialize domain profile so data is not lost prior to approval
        try {
            if (role === "talent") {
                let vismayaId = "";
                let isUnique = false;
                while (!isUnique) {
                    vismayaId = `VIS-${crypto.randomInt(100000, 999999)}`;
                    const existing = await TalentProfile.exists({ vismayaId });
                    if (!existing) isUnique = true;
                }

                await TalentProfile.create({
                    userId: user._id,
                    vismayaId,
                    stageName: validation.sanitized.stageName || name,
                    primaryProfession: validation.sanitized.primaryProfession || "Actor / Screen Artist",
                    skills: (validation.sanitized.skills || []).map((s: string) => ({ name: s, proficiency: "intermediate" })),
                    bio: validation.sanitized.bio || "",
                    currentCity: validation.sanitized.city || "Mumbai",
                    profilePhoto: validation.sanitized.profilePhoto || "",
                    isPaid: user.isPaid,
                    status: "pending"
                });
            } else if (role === "organization") {
                const org = await Organization.create({
                    userId: user._id,
                    organizationName: validation.sanitized.studioName || name,
                    organizationType: validation.sanitized.companyType || "Production House",
                    location: {
                        city: validation.sanitized.city || "Mumbai",
                        country: "India"
                    },
                    contactNumber: mobile,
                    verificationState: "pending",
                    status: "pending",
                    cinNumber: validation.sanitized.cinNumber,
                    registrationNumber: validation.sanitized.registrationNumber || validation.sanitized.cinNumber,
                    gstNumber: validation.sanitized.gstNumber,
                    website: validation.sanitized.website,
                    description: validation.sanitized.description
                });

                try {
                    await CreditLedger.create({
                        organizationId: org._id,
                        includedCredits: 100,
                        balance: 100
                    });
                } catch (creditErr) {
                    console.warn("[RegisterUser] Credit ledger init notice:", creditErr);
                }

                try {
                    await Verification.create({
                        userId: user._id,
                        verificationType: "organization_business",
                        status: "pending",
                        businessData: {
                            businessRegType: validation.sanitized.cinNumber ? "cin" : (validation.sanitized.gstNumber ? "gstin" : "other"),
                            businessRegNumber: validation.sanitized.cinNumber || validation.sanitized.gstNumber || "PENDING",
                            legalEntityName: validation.sanitized.studioName || name,
                            documentUrl: ""
                        },
                        submittedAt: new Date()
                    });
                } catch (verErr) {
                    console.warn("[RegisterUser] Verification record init notice:", verErr);
                }
            }
        } catch (initErr) {
            console.warn("[RegisterUser] Profile initialization notice:", initErr);
        }

        // Clean up any registration draft for this email
        await RegistrationDraft.deleteOne({ email });

        // Generate 6-digit registration OTP
        const otpCode = crypto.randomInt(100000, 1000000).toString();
        const otpHash = await bcrypt.hash(otpCode, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await Otp.deleteMany({ email, purpose: "registration" });
        await Otp.create({
            email,
            otpHash,
            purpose: "registration",
            attempts: 0,
            isUsed: false,
            expiresAt
        });

        await sendEmail({
            to: email,
            subject: "Verify Your Vismaya Account Registration",
            text: `Hello ${user.name},\n\nYour 6-digit account verification code for Vismaya Creative Studios is: ${otpCode}\n\nThis code expires in 10 minutes.\n\nBest regards,\nVismaya Security Team`
        });

        res.status(201).json({
            success: true,
            message: "Registration successful. Please verify the 6-digit OTP sent to your email.",
            email: user.email,
            status: user.status
        });

    } catch (error: any) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0] || "field";
            return res.status(409).json({
                success: false,
                message: `User with this ${field} already exists`
            });
        }
        console.error("Registration error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while registering user"
        });
    }
};

export const verifyRegistration = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and 6-digit OTP code are required"
            });
        }

        const normalizedEmail = sanitizeEmail(email);
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found"
            });
        }

        if (user.status === "active" && user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: "Account is already verified. Please log in."
            });
        }

        const otpRecord = await Otp.findOne({
            email: normalizedEmail,
            purpose: "registration",
            isUsed: false,
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired registration verification code. Please request a new code."
            });
        }

        if (otpRecord.attempts >= 5) {
            await Otp.deleteOne({ _id: otpRecord._id });
            return res.status(429).json({
                success: false,
                message: "Too many incorrect attempts. Code has been invalidated. Please request a new code."
            });
        }

        const isValid = await bcrypt.compare(String(otp).trim(), otpRecord.otpHash);
        if (!isValid) {
            const updated = await Otp.findByIdAndUpdate(
                otpRecord._id,
                { $inc: { attempts: 1 } },
                { new: true, returnDocument: "after" }
            );

            if (updated && updated.attempts >= 5) {
                await Otp.deleteOne({ _id: otpRecord._id });
                return res.status(429).json({
                    success: false,
                    message: "Too many incorrect attempts. Code has been invalidated. Please request a new code."
                });
            }

            return res.status(400).json({
                success: false,
                message: `Invalid code. ${5 - (updated?.attempts || 0)} attempts remaining.`
            });
        }

        // Mark OTP used
        await Otp.findByIdAndUpdate(otpRecord._id, { isUsed: true });

        // Activate user
        user.status = "active";
        user.isEmailVerified = true;
        await user.save();

        // Create session & tokens
        const session = await createSession(user._id, req);
        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role,
                sessionId: session?.sessionId
            },
            process.env.JWT_SECRET as string,
            {
                expiresIn: "7d"
            }
        );

        const registrationStep = await calculateRegistrationStep(user);

        res.status(200).json({
            success: true,
            message: "Email verified successfully and account activated",
            token,
            sessionId: session?.sessionId,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                status: user.status,
                isPaid: user.isPaid,
                isEmailVerified: user.isEmailVerified,
                registrationStep
            }
        });

    } catch (error) {
        console.error("Verify registration error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while verifying registration"
        });
    }
};

export const resendRegistrationOtp = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const normalizedEmail = sanitizeEmail(email);
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Account is already active or cannot receive registration OTP"
            });
        }

        const otpCode = crypto.randomInt(100000, 1000000).toString();
        const otpHash = await bcrypt.hash(otpCode, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await Otp.deleteMany({ email: normalizedEmail, purpose: "registration" });
        await Otp.create({
            email: normalizedEmail,
            otpHash,
            purpose: "registration",
            attempts: 0,
            isUsed: false,
            expiresAt
        });

        await sendEmail({
            to: normalizedEmail,
            subject: "Your New Vismaya Account Verification Code",
            text: `Hello ${user.name},\n\nYour new verification code is: ${otpCode}\n\nValid for 10 minutes.\n\nBest regards,\nVismaya Security Team`
        });

        res.status(200).json({
            success: true,
            message: "Registration verification code resent successfully"
        });

    } catch (error) {
        console.error("Resend registration OTP error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while resending registration code"
        });
    }
};

export const loginUser = async (req: Request, res: Response): Promise<any> => {
    try {
        const validation = validateLoginInput(req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.errors[0]
            });
        }

        const { email, password } = validation.sanitized;

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check password (if local user)
        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: "This account uses Google login. Please sign in with Google."
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check account status
        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: getAccountStatusError(user.status),
                isEmailVerified: user.isEmailVerified
            });
        }

        // 2FA Challenge if enabled
        if (user.twoFactorEnabled) {
            const twoFactorToken = jwt.sign(
                { userId: user._id, purpose: "2fa_pending" },
                process.env.JWT_SECRET as string,
                { expiresIn: "5m" }
            );

            const otpCode = crypto.randomInt(100000, 1000000).toString();
            const otpHash = await bcrypt.hash(otpCode, 10);
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

            await Otp.deleteMany({ email: user.email, purpose: "2fa_login" });
            await Otp.create({
                email: user.email,
                otpHash,
                purpose: "2fa_login",
                attempts: 0,
                isUsed: false,
                expiresAt
            });

            await sendEmail({
                to: user.email,
                subject: "Your Vismaya Two-Factor Login Code",
                text: `Hello ${user.name},\n\nYour 6-digit two-factor login verification code is: ${otpCode}\n\nThis code expires in 5 minutes.\n\nBest regards,\nVismaya Security Team`
            });

            return res.status(200).json({
                success: true,
                requires2FA: true,
                twoFactorToken,
                message: "Two-factor verification code sent to your registered email"
            });
        }

        // Create active server-side session (fail closed if session creation fails per S6)
        const session = await createSession(user._id, req);
        if (!session) {
            return res.status(500).json({
                success: false,
                message: "Failed to create secure user session. Please try again."
            });
        }

        // Generate JWT with attached sessionId
        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role,
                sessionId: session.sessionId
            },
            process.env.JWT_SECRET as string,
            {
                expiresIn: "7d"
            }
        );

        const registrationStep = await calculateRegistrationStep(user);

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            sessionId: session.sessionId,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                status: user.status,
                isPaid: user.isPaid,
                isEmailVerified: user.isEmailVerified,
                registrationStep
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while logging in"
        });
    }
};

/**
 * Google Authentication via Provider Abstraction
 * POST /api/auth/google
 */
export const googleLogin = async (req: Request, res: Response): Promise<any> => {
    try {
        const validation = validateGoogleLoginInput(req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.errors[0]
            });
        }

        const { idToken, role = "talent" } = req.body;

        // Disallow administrative or invalid role request via Google login
        if (role !== "talent" && role !== "organization") {
            return res.status(400).json({
                success: false,
                message: "Public registration only allows 'talent' and 'organization' roles"
            });
        }

        const googlePayload = await verifyGoogleToken(idToken);

        if (googlePayload.email_verified !== true) {
            return res.status(400).json({
                success: false,
                message: "Google email address is not verified"
            });
        }

        let user = await User.findOne({ email: googlePayload.email });

        // Never allow Google login to link or log in an admin account (S1)
        if (user && (user.role === "admin" || (user as any).isSuperAdmin)) {
            return res.status(403).json({
                success: false,
                message: "Google authentication is disabled for administrative accounts. Please use admin login."
            });
        }

        if (!user) {
            // New user registration via Google
            user = await User.create({
                name: googlePayload.name || googlePayload.email.split("@")[0],
                email: googlePayload.email,
                googleId: googlePayload.sub,
                authProvider: "google",
                role: role === "organization" ? "organization" : "talent",
                status: "active",
                isEmailVerified: true
            });
        } else if (!user.googleId) {
            // Link existing account
            user.googleId = googlePayload.sub;
            user.authProvider = "google";
            user.isEmailVerified = true;
            await user.save();
        }

        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: getAccountStatusError(user.status),
                isEmailVerified: user.isEmailVerified
            });
        }

        const session = await createSession(user._id, req);
        if (!session) {
            return res.status(500).json({
                success: false,
                message: "Failed to create secure user session. Please try again."
            });
        }

        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role,
                sessionId: session.sessionId
            },
            process.env.JWT_SECRET as string,
            {
                expiresIn: "7d"
            }
        );

        const registrationStep = await calculateRegistrationStep(user);

        res.status(200).json({
            success: true,
            message: "Google authentication successful",
            token,
            sessionId: session.sessionId,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                status: user.status,
                isPaid: user.isPaid,
                isEmailVerified: user.isEmailVerified,
                registrationStep
            }
        });

    } catch (error: any) {
        console.error("Google login error:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Google authentication failed"
        });
    }
};

/**
 * Change Password for Authenticated Users (Requires current password)
 * POST /api/auth/change-password
 */
export const changePassword = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const validation = validateChangePasswordInput(req.body);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.errors[0]
            });
        }

        const { currentPassword, otp, newPassword } = req.body;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found"
            });
        }

        if (otp) {
            const otpRecord: any = await Otp.findOne({
                email: user.email,
                purpose: "password_change" as any,
                isUsed: false,
                expiresAt: { $gt: new Date() }
            });

            if (!otpRecord) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or expired password verification code"
                });
            }

            const isValid = await bcrypt.compare(String(otp).trim(), otpRecord.otpHash);
            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid password verification code"
                });
            }

            await Otp.findByIdAndUpdate(otpRecord._id, { isUsed: true });
        } else {
            if (!user.password) {
                return res.status(400).json({
                    success: false,
                    message: "This account was created with Google login and does not have a password set. Please use OTP verification to set a password."
                });
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: "Incorrect current password"
                });
            }
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        // Revoke all existing sessions upon password change (S5)
        await revokeAllUserSessions(user._id);

        // Dispatch security notification
        await notifyUser({
            recipientId: user._id,
            type: "security_alert",
            title: "Password Updated",
            message: "Your password was successfully changed from your account settings. All active sessions have been signed out."
        });

        res.status(200).json({
            success: true,
            message: "Password changed successfully. Please log in again with your new password."
        });

    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while changing password"
        });
    }
};

/**
 * Get active server-side sessions
 * GET /api/auth/sessions
 */
export const getUserSessions = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const currentSessionId = req.user?.sessionId;

        const sessions = await fetchUserSessions(userId, currentSessionId);

        res.status(200).json({
            success: true,
            count: sessions.length,
            sessions
        });
    } catch (error) {
        console.error("Get sessions error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching active sessions"
        });
    }
};

/**
 * Revoke specific session
 * DELETE /api/auth/sessions/:sessionId
 */
export const revokeUserSession = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { sessionId } = req.params;

        await revokeSessionById(userId, String(sessionId));

        res.status(200).json({
            success: true,
            message: "Session revoked successfully"
        });
    } catch (error) {
        console.error("Revoke session error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while revoking session"
        });
    }
};

/**
 * Logout current session
 * POST /api/auth/logout
 */
export const logoutUser = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const sessionId = req.user?.sessionId;

        if (sessionId) {
            await revokeSessionById(userId, sessionId);
        }

        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while logging out"
        });
    }
};

/**
 * Logout all active sessions
 * POST /api/auth/logout-all
 */
export const logoutAllSessions = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;

        await revokeAllUserSessions(userId);

        res.status(200).json({
            success: true,
            message: "All active sessions have been revoked successfully"
        });
    } catch (error) {
        console.error("Logout all error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while logging out from all sessions"
        });
    }
};

/**
 * Registration Draft Autosave / Update (S4)
 * POST /api/auth/draft
 * PUT /api/auth/draft
 */
export const saveRegistrationDraft = async (req: Request, res: Response): Promise<any> => {
    try {
        const validation = validateDraftInput(req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.errors[0]
            });
        }

        const { email, role, currentStep, formData } = validation.sanitized;
        const incomingDraftToken = (req.headers["x-draft-token"] || req.headers["draft-token"]) as string | undefined;

        // Check if user already exists and is paid
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser.isPaid) {
            return res.status(400).json({
                success: false,
                message: "Registration draft is locked because payment has already been completed."
            });
        }

        const existingDraft = await RegistrationDraft.findOne({ email }).select("+tokenHash");

        let draftToken = incomingDraftToken;

        if (existingDraft) {
            // Verify ownership via token if tokenHash exists
            if (existingDraft.tokenHash) {
                if (!incomingDraftToken || hashToken(incomingDraftToken) !== existingDraft.tokenHash) {
                    return res.status(403).json({
                        success: false,
                        message: "Invalid or missing x-draft-token. You cannot modify another user's draft."
                    });
                }
            } else {
                // If legacy draft without tokenHash, assign one
                draftToken = crypto.randomBytes(32).toString("hex");
                existingDraft.tokenHash = hashToken(draftToken);
            }

            existingDraft.role = role || existingDraft.role;
            existingDraft.currentStep = currentStep || existingDraft.currentStep;
            existingDraft.formData = formData !== undefined ? formData : existingDraft.formData;
            existingDraft.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await existingDraft.save();

            if (draftToken) res.setHeader("x-draft-token", draftToken);
            return res.status(200).json({
                success: true,
                message: "Registration draft updated successfully",
                draftToken,
                draft: {
                    email: existingDraft.email,
                    role: existingDraft.role,
                    currentStep: existingDraft.currentStep,
                    formData: existingDraft.formData,
                    expiresAt: existingDraft.expiresAt
                }
            });
        }

        // New draft creation: generate 32-byte secret draft token
        draftToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = hashToken(draftToken);

        const newDraft = await RegistrationDraft.create({
            email,
            role,
            currentStep,
            formData,
            tokenHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        res.setHeader("x-draft-token", draftToken);
        res.status(201).json({
            success: true,
            message: "Registration draft created successfully",
            draftToken,
            draft: {
                email: newDraft.email,
                role: newDraft.role,
                currentStep: newDraft.currentStep,
                formData: newDraft.formData,
                expiresAt: newDraft.expiresAt
            }
        });

    } catch (error) {
        console.error("Save draft error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while saving registration draft"
        });
    }
};

/**
 * Get saved registration draft (Requires x-draft-token header, S4)
 * GET /api/auth/draft
 */
export const getRegistrationDraft = async (req: Request, res: Response): Promise<any> => {
    try {
        const draftToken = (req.headers["x-draft-token"] || req.headers["draft-token"]) as string | undefined;

        if (!draftToken || typeof draftToken !== "string") {
            return res.status(401).json({
                success: false,
                message: "x-draft-token header is required to retrieve registration draft"
            });
        }

        const tokenHash = hashToken(draftToken.trim());
        const draft = await RegistrationDraft.findOne({ tokenHash });

        if (!draft) {
            return res.status(404).json({
                success: false,
                message: "No saved registration draft found matching this draft token"
            });
        }

        // If email was optionally passed as query, verify matching
        if (req.query.email && sanitizeEmail(String(req.query.email)) !== draft.email) {
            return res.status(403).json({
                success: false,
                message: "Draft token does not match the provided email"
            });
        }

        res.status(200).json({
            success: true,
            draft: {
                email: draft.email,
                role: draft.role,
                currentStep: draft.currentStep,
                formData: draft.formData,
                expiresAt: draft.expiresAt
            }
        });

    } catch (error) {
        console.error("Get draft error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching registration draft"
        });
    }
};

/**
 * Delete registration draft (Requires x-draft-token header, S4)
 * DELETE /api/auth/draft
 */
export const deleteRegistrationDraft = async (req: Request, res: Response): Promise<any> => {
    try {
        const draftToken = (req.headers["x-draft-token"] || req.headers["draft-token"]) as string | undefined;

        if (!draftToken || typeof draftToken !== "string") {
            return res.status(401).json({
                success: false,
                message: "x-draft-token header is required to delete registration draft"
            });
        }

        const tokenHash = hashToken(draftToken.trim());
        const result = await RegistrationDraft.findOneAndDelete({ tokenHash });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "No registration draft found matching this draft token"
            });
        }

        res.status(200).json({
            success: true,
            message: "Registration draft removed"
        });
    } catch (error) {
        console.error("Delete draft error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while deleting registration draft"
        });
    }
};

/**
 * Initiate password recovery by sending a 6-digit OTP (via Email or Mobile)
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, mobile } = req.body;

        if (!email && !mobile) {
            return res.status(400).json({
                success: false,
                message: "Email or mobile number is required"
            });
        }

        let user: any = null;
        let normalizedEmail: string | null = null;
        let cleanMobile: string | null = null;

        if (email) {
            normalizedEmail = sanitizeEmail(email);
            if (!isValidEmail(normalizedEmail)) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide a valid email address"
                });
            }
            user = await User.findOne({ email: normalizedEmail });
        } else if (mobile) {
            cleanMobile = String(mobile).replace(/[^0-9+]/g, "").trim();
            user = await User.findOne({ mobile: cleanMobile });
        }

        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If your account is registered, you will receive a password reset code."
            });
        }

        // Generate cryptographically secure 6-digit OTP using CSPRNG
        const otpCode = crypto.randomInt(100000, 1000000).toString();
        const otpHash = await bcrypt.hash(otpCode, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        if (normalizedEmail) {
            await Otp.deleteMany({ email: normalizedEmail, purpose: "password_reset" });
            await Otp.create({
                email: normalizedEmail,
                otpHash,
                purpose: "password_reset",
                attempts: 0,
                isUsed: false,
                expiresAt
            });

            await sendEmail({
                to: normalizedEmail,
                subject: "Your Vismaya Password Reset Code",
                text: `Hello ${user.name},\n\nYour 6-digit password reset code for Vismaya Creative Studios is: ${otpCode}\n\nThis code will expire in 10 minutes. If you did not request this, please ignore this email.\n\nBest regards,\nVismaya Security Team`
            });
        } else if (cleanMobile) {
            await Otp.deleteMany({ mobile: cleanMobile, purpose: "password_reset" });
            await Otp.create({
                mobile: cleanMobile,
                otpHash,
                purpose: "password_reset",
                attempts: 0,
                isUsed: false,
                expiresAt
            });

            await sendSms({
                to: cleanMobile,
                message: `Your Vismaya password reset code is: ${otpCode}. Valid for 10 minutes.`
            });
        }

        res.status(200).json({
            success: true,
            message: "If your account is registered, you will receive a password reset code."
        });

    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while requesting password reset"
        });
    }
};

/**
 * Verify OTP and exchange for a temporary Reset Token (S5)
 * POST /api/auth/verify-otp
 */
export const verifyOtp = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, mobile, otp } = req.body;

        if ((!email && !mobile) || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email or mobile and 6-digit OTP code are required"
            });
        }

        const otpFilter: any = {
            purpose: "password_reset",
            isUsed: false,
            expiresAt: { $gt: new Date() }
        };

        let identifierClaim: any = {};

        if (email) {
            const normalizedEmail = sanitizeEmail(email);
            otpFilter.email = normalizedEmail;
            identifierClaim = { email: normalizedEmail };
        } else {
            const cleanMobile = String(mobile).replace(/[^0-9+]/g, "").trim();
            otpFilter.mobile = cleanMobile;
            identifierClaim = { mobile: cleanMobile };
        }

        const otpRecord = await Otp.findOne(otpFilter);

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired password reset code. Please request a new code."
            });
        }

        // Check attempt count (max 5 attempts before invalidation per S5)
        if (otpRecord.attempts >= 5) {
            await Otp.deleteOne({ _id: otpRecord._id });
            return res.status(429).json({
                success: false,
                message: "Too many incorrect attempts. Code has been invalidated. Please request a new code."
            });
        }

        const isValid = await bcrypt.compare(String(otp).trim(), otpRecord.otpHash);

        if (!isValid) {
            const updated = await Otp.findByIdAndUpdate(
                otpRecord._id,
                { $inc: { attempts: 1 } },
                { new: true, returnDocument: "after" }
            );

            if (updated && updated.attempts >= 5) {
                await Otp.deleteOne({ _id: otpRecord._id });
                return res.status(429).json({
                    success: false,
                    message: "Too many incorrect attempts. Code has been invalidated. Please request a new code."
                });
            }

            return res.status(400).json({
                success: false,
                message: `Invalid code. ${5 - (updated?.attempts || 0)} attempts remaining.`
            });
        }

        const resetToken = jwt.sign(
            { ...identifierClaim, purpose: "password_reset", otpId: otpRecord._id.toString() },
            process.env.JWT_SECRET as string,
            { expiresIn: "15m" }
        );

        res.status(200).json({
            success: true,
            message: "OTP code verified successfully",
            resetToken
        });

    } catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while verifying OTP"
        });
    }
};

/**
 * Reset password using verified token or direct email/mobile+otp (S5)
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req: Request, res: Response): Promise<any> => {
    try {
        const { resetToken, email, mobile, otp, newPassword } = req.body;

        if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "New password is required and must be at least 8 characters long"
            });
        }

        if (newPassword.length > 128) {
            return res.status(400).json({
                success: false,
                message: "New password cannot exceed 128 characters"
            });
        }

        let userFilter: any = null;

        if (resetToken) {
            try {
                const decoded = jwt.verify(resetToken, process.env.JWT_SECRET as string, { algorithms: ["HS256"] }) as any;
                if (decoded.purpose !== "password_reset") {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid reset token purpose"
                    });
                }
                if (decoded.email) userFilter = { email: sanitizeEmail(decoded.email) };
                else if (decoded.mobile) userFilter = { mobile: decoded.mobile };

                // Atomically verify that OTP is unused and mark used (S5 single-use enforcement)
                if (decoded.otpId) {
                    const otpRecord = await Otp.findOneAndUpdate(
                        { _id: decoded.otpId, isUsed: false },
                        { isUsed: true },
                        { new: true, returnDocument: "after" }
                    );

                    if (!otpRecord) {
                        return res.status(401).json({
                            success: false,
                            message: "Reset token has already been used or expired. Please request a new code."
                        });
                    }
                }
            } catch (err) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid or expired reset token. Please request a new code."
                });
            }
        } else if ((email || mobile) && otp) {
            const otpFilter: any = {
                purpose: "password_reset",
                isUsed: false,
                expiresAt: { $gt: new Date() }
            };
            if (email) {
                otpFilter.email = sanitizeEmail(email);
                userFilter = { email: otpFilter.email };
            } else {
                otpFilter.mobile = String(mobile).replace(/[^0-9+]/g, "").trim();
                userFilter = { mobile: otpFilter.mobile };
            }

            const otpRecord = await Otp.findOne(otpFilter);

            if (!otpRecord) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or expired password reset code"
                });
            }

            if (otpRecord.attempts >= 5) {
                await Otp.deleteOne({ _id: otpRecord._id });
                return res.status(429).json({
                    success: false,
                    message: "Too many incorrect attempts. Code has been invalidated. Please request a new code."
                });
            }

            const isValid = await bcrypt.compare(String(otp).trim(), otpRecord.otpHash);
            if (!isValid) {
                const updated = await Otp.findByIdAndUpdate(
                    otpRecord._id,
                    { $inc: { attempts: 1 } },
                    { new: true, returnDocument: "after" }
                );

                if (updated && updated.attempts >= 5) {
                    await Otp.deleteOne({ _id: otpRecord._id });
                    return res.status(429).json({
                        success: false,
                        message: "Too many incorrect attempts. Code has been invalidated. Please request a new code."
                    });
                }

                return res.status(400).json({
                    success: false,
                    message: "Invalid password reset code"
                });
            }

            // Atomically mark used
            await Otp.findByIdAndUpdate(otpRecord._id, { isUsed: true });
        } else {
            return res.status(400).json({
                success: false,
                message: "Either valid resetToken or identifier and otp are required"
            });
        }

        const user = await User.findOne(userFilter);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        // Clean up OTPs
        if (userFilter.email) await Otp.deleteMany({ email: userFilter.email });
        if (userFilter.mobile) await Otp.deleteMany({ mobile: userFilter.mobile });

        // Revoke all user sessions upon password reset (S5)
        await revokeAllUserSessions(user._id);

        await notifyUser({
            recipientId: user._id,
            type: "security_alert",
            title: "Password Changed",
            message: "Your account password was successfully updated. All active sessions have been signed out."
        });

        if (user.email) {
            await sendEmail({
                to: user.email,
                subject: "Your Vismaya Password Has Been Changed",
                text: `Hello ${user.name},\n\nThis is a confirmation that your password for Vismaya Creative Studios was recently changed.\n\nIf you did not perform this change, please contact support immediately.\n\nBest regards,\nVismaya Security Team`
            });
        }

        res.status(200).json({
            success: true,
            message: "Password has been reset successfully. You can now log in with your new password."
        });

    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while resetting password"
        });
    }
};

/**
 * 2FA Management Endpoints (A4)
 */
export const setup2FA = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const otpCode = crypto.randomInt(100000, 1000000).toString();
        const otpHash = await bcrypt.hash(otpCode, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await Otp.deleteMany({ email: user.email, purpose: "2fa_setup" });
        await Otp.create({
            email: user.email,
            otpHash,
            purpose: "2fa_setup",
            attempts: 0,
            isUsed: false,
            expiresAt
        });

        await sendEmail({
            to: user.email,
            subject: "Your Vismaya 2FA Setup Verification Code",
            text: `Hello ${user.name},\n\nYour 6-digit code to enable Two-Factor Authentication is: ${otpCode}\n\nValid for 10 minutes.\n\nBest regards,\nVismaya Security Team`
        });

        res.status(200).json({
            success: true,
            message: "2FA setup verification code sent to your email"
        });
    } catch (error) {
        console.error("Setup 2FA error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while setting up 2FA" });
    }
};

export const verify2FASetup = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { otp } = req.body;
        if (!otp) {
            return res.status(400).json({ success: false, message: "OTP code is required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const otpRecord = await Otp.findOne({
            email: user.email,
            purpose: "2fa_setup",
            isUsed: false,
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: "Invalid or expired 2FA setup code" });
        }

        const isValid = await bcrypt.compare(String(otp).trim(), otpRecord.otpHash);
        if (!isValid) {
            return res.status(400).json({ success: false, message: "Invalid 2FA setup code" });
        }

        await Otp.findByIdAndUpdate(otpRecord._id, { isUsed: true });
        user.twoFactorEnabled = true;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Two-factor authentication enabled successfully"
        });
    } catch (error) {
        console.error("Verify 2FA setup error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while verifying 2FA setup" });
    }
};

export const disable2FA = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { password } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.role === "admin" || (user as any).isSuperAdmin) {
            return res.status(403).json({ success: false, message: "Two-factor authentication is mandatory for administrator accounts" });
        }

        if (user.password) {
            if (!password) {
                return res.status(400).json({ success: false, message: "Current password is required to disable 2FA" });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: "Incorrect password" });
            }
        }

        user.twoFactorEnabled = false;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Two-factor authentication disabled successfully"
        });
    } catch (error) {
        console.error("Disable 2FA error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while disabling 2FA" });
    }
};

export const verify2FALogin = async (req: Request, res: Response): Promise<any> => {
    try {
        const { twoFactorToken, otp } = req.body;
        if (!twoFactorToken || !otp) {
            return res.status(400).json({ success: false, message: "twoFactorToken and OTP are required" });
        }

        let decoded: any;
        try {
            decoded = jwt.verify(twoFactorToken, process.env.JWT_SECRET as string, { algorithms: ["HS256"] });
            if (decoded.purpose !== "2fa_pending") {
                return res.status(400).json({ success: false, message: "Invalid 2FA token purpose" });
            }
        } catch (err) {
            return res.status(401).json({ success: false, message: "Invalid or expired 2FA session token" });
        }

        const user = await User.findById(decoded.userId);
        if (!user || user.status !== "active") {
            return res.status(403).json({ success: false, message: "User account inactive or not found" });
        }

        const otpRecord = await Otp.findOne({
            email: user.email,
            purpose: "2fa_login",
            isUsed: false,
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: "Invalid or expired 2FA code" });
        }

        if (otpRecord.attempts >= 5) {
            await Otp.deleteOne({ _id: otpRecord._id });
            return res.status(429).json({ success: false, message: "Too many incorrect attempts. Please log in again." });
        }

        const isValid = await bcrypt.compare(String(otp).trim(), otpRecord.otpHash);
        if (!isValid) {
            await Otp.findByIdAndUpdate(otpRecord._id, { $inc: { attempts: 1 } });
            return res.status(400).json({ success: false, message: "Invalid 2FA code" });
        }

        await Otp.findByIdAndUpdate(otpRecord._id, { isUsed: true });

        const session = await createSession(user._id, req);
        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role,
                sessionId: session?.sessionId
            },
            process.env.JWT_SECRET as string,
            { expiresIn: "7d" }
        );

        const registrationStep = await calculateRegistrationStep(user);

        res.status(200).json({
            success: true,
            message: "2FA authentication successful",
            token,
            sessionId: session?.sessionId,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                status: user.status,
                isPaid: user.isPaid,
                isEmailVerified: user.isEmailVerified,
                registrationStep
            }
        });
    } catch (error) {
        console.error("Verify 2FA login error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while completing 2FA login" });
    }
};

export const requestChangePasswordOtp = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User account not found" });
        }

        const otpCode = crypto.randomInt(100000, 1000000).toString();
        const otpHash = await bcrypt.hash(otpCode, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await Otp.deleteMany({ email: user.email as string, purpose: "password_change" as any });
        await Otp.create({
            email: user.email,
            otpHash,
            purpose: "password_change" as any,
            attempts: 0,
            isUsed: false,
            expiresAt
        });

        await sendEmail({
            to: user.email,
            subject: "Your Vismaya Password Change Verification Code",
            text: `Hello ${user.name},\n\nYour 6-digit verification code to change your account password is: ${otpCode}\n\nValid for 10 minutes.\n\nBest regards,\nVismaya Security Team`
        });

        return res.status(200).json({
            success: true,
            message: "Password change verification code sent to your registered email"
        });
    } catch (error) {
        console.error("Request change password OTP error:", error);
        return res.status(500).json({ success: false, message: "Failed to send password verification code" });
    }
};

/**
 * Account Lifecycle & Self-Deletion (A8 / Spec §38)
 * Request deletion OTP -> Confirm with OTP
 */
export const requestAccountDeletionOtp = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const otpCode = crypto.randomInt(100000, 1000000).toString();
        const otpHash = await bcrypt.hash(otpCode, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await Otp.deleteMany({ email: user.email as string, purpose: "account_deletion" as any });
        await Otp.create({
            email: user.email,
            otpHash,
            purpose: "account_deletion" as any,
            attempts: 0,
            isUsed: false,
            expiresAt
        });

        await sendEmail({
            to: user.email,
            subject: "Your Vismaya Account Deletion Code",
            text: `Hello ${user.name},\n\nYour 6-digit confirmation code to permanently delete your Vismaya artist account is: ${otpCode}\n\nValid for 10 minutes. If you did not request this, please contact support immediately.\n\nBest regards,\nVismaya Security Team`
        });

        return res.status(200).json({
            success: true,
            message: "Account deletion confirmation code sent to your registered email"
        });
    } catch (error) {
        console.error("Request account deletion OTP error:", error);
        return res.status(500).json({ success: false, message: "Failed to send deletion verification code" });
    }
};

export const requestAccountDeletion = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const otp = req.body?.otp || req.headers["x-otp"] || req.query?.otp;
        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "Verification OTP code is required to confirm account deletion"
            });
        }

        const otpRecord: any = await Otp.findOne({
            email: user.email as string,
            purpose: "account_deletion" as any,
            isUsed: false,
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired deletion verification code"
            });
        }

        const isValid = await bcrypt.compare(String(otp).trim(), otpRecord.otpHash);
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid deletion verification code"
            });
        }

        await Otp.findByIdAndUpdate(otpRecord._id, { isUsed: true });

        user.status = "deletion_requested";
        user.deletionRequestedAt = new Date();
        await user.save();

        await revokeAllUserSessions(user._id);

        res.status(200).json({
            success: true,
            message: "Account deletion requested successfully. All active sessions have been terminated."
        });
    } catch (error) {
        console.error("Request account deletion error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while requesting account deletion" });
    }
};

/**
 * Email Change with Re-Verification (A9)
 * POST /api/auth/change-email
 * POST /api/auth/verify-email-change
 */
export const requestEmailChange = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { newEmail, password } = req.body;

        if (!newEmail || !isValidEmail(sanitizeEmail(newEmail))) {
            return res.status(400).json({ success: false, message: "A valid new email address is required" });
        }

        const normalizedNewEmail = sanitizeEmail(newEmail);
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (normalizedNewEmail === user.email) {
            return res.status(400).json({ success: false, message: "New email must be different from current email" });
        }

        const emailInUse = await User.findOne({ email: normalizedNewEmail });
        if (emailInUse) {
            return res.status(409).json({ success: false, message: "Email is already in use by another account" });
        }

        if (user.password) {
            if (!password) {
                return res.status(400).json({ success: false, message: "Current password is required to change email" });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: "Incorrect password" });
            }
        }

        const otpCode = crypto.randomInt(100000, 1000000).toString();
        const otpHash = await bcrypt.hash(otpCode, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await Otp.deleteMany({ email: normalizedNewEmail, purpose: "email_change" });
        await Otp.create({
            email: normalizedNewEmail,
            otpHash,
            purpose: "email_change",
            metadata: { userId: user._id.toString() },
            attempts: 0,
            isUsed: false,
            expiresAt
        });

        await sendEmail({
            to: normalizedNewEmail,
            subject: "Verify Your New Email Address for Vismaya",
            text: `Hello ${user.name},\n\nYour 6-digit verification code to confirm this new email address is: ${otpCode}\n\nValid for 10 minutes.\n\nBest regards,\nVismaya Security Team`
        });

        res.status(200).json({
            success: true,
            message: "Verification code sent to your new email address"
        });
    } catch (error) {
        console.error("Request email change error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while requesting email change" });
    }
};

export const verifyEmailChange = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { newEmail, otp } = req.body;

        if (!newEmail || !otp) {
            return res.status(400).json({ success: false, message: "newEmail and OTP code are required" });
        }

        const normalizedNewEmail = sanitizeEmail(newEmail);
        const otpRecord = await Otp.findOne({
            email: normalizedNewEmail,
            purpose: "email_change",
            isUsed: false,
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: "Invalid or expired email change verification code" });
        }

        if (otpRecord.metadata?.userId && otpRecord.metadata.userId !== userId?.toString()) {
            return res.status(403).json({ success: false, message: "Verification code does not belong to this user" });
        }

        const isValid = await bcrypt.compare(String(otp).trim(), otpRecord.otpHash);
        if (!isValid) {
            return res.status(400).json({ success: false, message: "Invalid verification code" });
        }

        await Otp.findByIdAndUpdate(otpRecord._id, { isUsed: true });

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.email = normalizedNewEmail;
        user.isEmailVerified = true;
        await user.save();

        await revokeAllUserSessions(user._id);

        res.status(200).json({
            success: true,
            message: "Email changed successfully. Please log in with your new email address."
        });
    } catch (error) {
        console.error("Verify email change error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while verifying email change" });
    }
};

export const changeMobile = async (req: Request, res: Response): Promise<any> => {
    return res.status(403).json({
        success: false,
        message: "Mobile number change is not permitted. Please contact support."
    });
};

/**
 * Check if email or mobile number is already in use
 * POST /api/auth/check-availability
 */
export const checkAvailability = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, mobile } = req.body || {};
        if (email) {
            const normalizedEmail = sanitizeEmail(email);
            const existingEmail = await User.findOne({ email: normalizedEmail });
            if (existingEmail) {
                return res.status(200).json({
                    success: true,
                    available: false,
                    field: "email",
                    message: "User with this email already exists"
                });
            }
        }
        if (mobile) {
            const clean = String(mobile).replace(/[^0-9+]/g, "").trim();
            const raw10 = clean.replace(/[^0-9]/g, "").slice(-10);
            const with91 = `+91${raw10}`;
            const existingMobile = await User.findOne({
                $or: [
                    { mobile: clean },
                    { mobile: raw10 },
                    { mobile: with91 }
                ]
            });
            if (existingMobile) {
                return res.status(200).json({
                    success: true,
                    available: false,
                    field: "mobile",
                    message: "User with this mobile number already exists"
                });
            }
        }
        return res.status(200).json({
            success: true,
            available: true
        });
    } catch (error) {
        return res.status(200).json({
            success: true,
            available: true
        });
    }
};
