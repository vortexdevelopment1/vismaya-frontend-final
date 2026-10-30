import { Request, Response } from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import User from "../models/user.model.js";
import Opportunity from "../models/opportunity.model.js";
import Project from "../models/project.model.js";
import Organization from "../models/organization.model.js";
import TalentProfile from "../models/talentProfile.model.js";
import PaymentTransaction from "../models/paymentTransaction.model.js";
import AdminAuditLog from "../models/adminAuditLog.model.js";
import Verification from "../models/verification.model.js";
import Application from "../models/application.model.js";
import Notification from "../models/notification.model.js";
import MediaItem from "../models/mediaItem.model.js";
import Coupon from "../models/coupon.model.js";
import CreditLedger from "../models/creditLedger.model.js";
import CreditTransaction from "../models/creditTransaction.model.js";
import Report from "../models/report.model.js";
import ProjectShortlist from "../models/projectShortlist.model.js";
import Audition from "../models/audition.model.js";
import { logAdminAction } from "../services/audit.service.js";
import { notifyUser } from "../services/notification.service.js";
import { revokeAllUserSessions } from "../services/session.service.js";
import { escapeRegex } from "../utils/sanitize.util.js";
import { validateCouponInput } from "../validators/coupon.validator.js";
import { calculateProfileCompletion } from "../utils/profileCompletion.util.js";

// --- USER OPERATIONS ---

const findUserByIdOrVismayaId = async (idOrVismayaId: any): Promise<any> => {
    if (!idOrVismayaId) return null;
    const str = String(idOrVismayaId).trim();
    if (!str) return null;

    // 1. Check if it's a Vismaya ID (e.g., VIS-607537 or prefix VIS-60753)
    if (str.toUpperCase().startsWith("VIS-")) {
        let profile = await TalentProfile.findOne({
            vismayaId: new RegExp(`^${escapeRegex(str)}$`, "i")
        });
        if (!profile) {
            profile = await TalentProfile.findOne({
                vismayaId: new RegExp(`^${escapeRegex(str)}`, "i")
            });
        }
        if (profile && profile.userId) {
            return await User.findById(profile.userId);
        }
    }

    // 2. Check if valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(str)) {
        // A) Directly a User ID
        const user = await User.findById(str);
        if (user) return user;

        // B) A TalentProfile ID
        const profile = await TalentProfile.findById(str);
        if (profile && profile.userId) {
            return await User.findById(profile.userId);
        }

        // C) An Organization ID
        const org = await Organization.findById(str);
        if (org && org.userId) {
            return await User.findById(org.userId);
        }
    }

    // 3. Check if numeric digits (e.g., 60753 or 607537) corresponding to VIS-xxxxx
    if (/^\d{4,8}$/.test(str)) {
        let profile = await TalentProfile.findOne({
            vismayaId: new RegExp(`^VIS-${escapeRegex(str)}`, "i")
        });
        if (profile && profile.userId) {
            return await User.findById(profile.userId);
        }
    }

    // 4. Check by email
    if (str.includes("@")) {
        const user = await User.findOne({ email: str.toLowerCase() });
        if (user) return user;
    }

    // 5. Fallback: check TalentProfile by vismayaId substring or stageName
    const profile = await TalentProfile.findOne({
        $or: [
            { vismayaId: new RegExp(escapeRegex(str), "i") },
            { stageName: new RegExp(`^${escapeRegex(str)}$`, "i") }
        ]
    });
    if (profile && profile.userId) {
        return await User.findById(profile.userId);
    }

    // 6. Fallback: check User by name
    const userByName = await User.findOne({ name: new RegExp(`^${escapeRegex(str)}$`, "i") });
    if (userByName) return userByName;

    return null;
};

const findTalentProfileByIdOrVismayaId = async (idOrVismayaId: any): Promise<any> => {
    if (!idOrVismayaId) return null;
    const str = String(idOrVismayaId).trim();
    if (!str) return null;

    // 1. Direct Vismaya ID (e.g. VIS-607537)
    if (str.toUpperCase().startsWith("VIS-")) {
        let profile = await TalentProfile.findOne({
            vismayaId: new RegExp(`^${escapeRegex(str)}$`, "i")
        }).populate("userId", "name email mobile status isPaid createdAt");
        if (!profile) {
            profile = await TalentProfile.findOne({
                vismayaId: new RegExp(`^${escapeRegex(str)}`, "i")
            }).populate("userId", "name email mobile status isPaid createdAt");
        }
        if (profile) return profile;
    }

    // 2. Valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(str)) {
        // A) Directly TalentProfile ID
        let profile = await TalentProfile.findById(str)
            .populate("userId", "name email mobile status isPaid createdAt");
        if (profile) return profile;

        // B) By userId
        profile = await TalentProfile.findOne({ userId: str })
            .populate("userId", "name email mobile status isPaid createdAt");
        if (profile) return profile;
    }

    // 3. Numeric digits corresponding to VIS-xxxxx
    if (/^\d{4,8}$/.test(str)) {
        const profile = await TalentProfile.findOne({
            vismayaId: new RegExp(`^VIS-${escapeRegex(str)}`, "i")
        }).populate("userId", "name email mobile status isPaid createdAt");
        if (profile) return profile;
    }

    // 4. By email of user
    if (str.includes("@")) {
        const user = await User.findOne({ email: str.toLowerCase() });
        if (user) {
            const profile = await TalentProfile.findOne({ userId: user._id })
                .populate("userId", "name email mobile status isPaid createdAt");
            if (profile) return profile;
        }
    }

    // 5. Fallback: by stageName or partial vismayaId
    const profile = await TalentProfile.findOne({
        $or: [
            { vismayaId: new RegExp(escapeRegex(str), "i") },
            { stageName: new RegExp(`^${escapeRegex(str)}$`, "i") }
        ]
    }).populate("userId", "name email mobile status isPaid createdAt");
    if (profile) return profile;

    // 6. Fallback: by User name
    const userByName = await User.findOne({ name: new RegExp(`^${escapeRegex(str)}$`, "i") });
    if (userByName) {
        const p = await TalentProfile.findOne({ userId: userByName._id })
            .populate("userId", "name email mobile status isPaid createdAt");
        if (p) return p;
    }

    return null;
};

const extractTargetUserId = (req: Request): any => {
    const rawCandidates = [
        req.params.talentId,
        req.params.userId,
        req.params.orgId,
        req.params.id,
        req.body?.talentId,
        req.body?.userId,
        req.body?.vismayaId,
        req.body?.profileId,
        req.body?.id
    ];

    // Pick first candidate that is not null/undefined and not the literal placeholder "id" or "undefined"
    const valid = rawCandidates.find(
        (c) => c && typeof c === "string" && c.trim() && !["id", "undefined", "null"].includes(c.trim().toLowerCase())
    );
    if (valid) return valid.trim();

    // Fallback: return the first non-empty candidate or null
    const fallback = rawCandidates.find((c) => c && typeof c === "string" && c.trim());
    return fallback ? fallback.trim() : null;
};

const generateUniqueVismayaId = async (): Promise<string> => {
    // crypto imported at top
    let isUnique = false;
    let candidate = "";
    while (!isUnique) {
        const randomDigits = crypto.randomInt(100000, 1000000);
        candidate = `VIS-${randomDigits}`;
        const existing = await TalentProfile.exists({ vismayaId: candidate });
        if (!existing) {
            isUnique = true;
        }
    }
    return candidate;
};

const resolveTalentAndUserForModeration = async (targetId: any): Promise<{ profile: any; user: any }> => {
    if (!targetId) return { profile: null, user: null };
    const str = String(targetId).trim();
    if (!str || ["id", "undefined", "null"].includes(str.toLowerCase())) return { profile: null, user: null };

    // 1. Try finding TalentProfile first
    let profile = await findTalentProfileByIdOrVismayaId(str);
    let user = null;

    if (profile) {
        // Resolve linked user
        const rawUserId = profile.userId && profile.userId._id ? profile.userId._id : profile.userId;
        if (rawUserId) {
            user = await User.findById(rawUserId);
        }
    } else {
        // Try finding User
        user = await findUserByIdOrVismayaId(str);
        if (user) {
            // Find or create TalentProfile for this user
            profile = await TalentProfile.findOne({ userId: user._id });
            if (!profile) {
                const vismayaId = await generateUniqueVismayaId();
                profile = new TalentProfile({
                    userId: user._id,
                    vismayaId,
                    stageName: user.name || "Artist",
                    currentCity: "Mumbai",
                    currentState: "Maharashtra",
                    primaryProfession: "Actor / Performer"
                });
            }
        }
    }

    // Ensure profile has a unique vismayaId
    if (profile && !profile.vismayaId) {
        profile.vismayaId = await generateUniqueVismayaId();
    }

    return { profile, user };
};

export const approveTalentProfile = async (req: Request, res: Response): Promise<any> => {
    try {
        const targetId = extractTargetUserId(req);
        const { profile, user } = await resolveTalentAndUserForModeration(targetId);

        if (!profile && !user) {
            return res.status(404).json({
                success: false,
                message: `Talent profile not found for identifier: ${targetId || "unspecified"}`
            });
        }

        const badgeType = req.body?.badgeType || "verified";
        const note = req.body?.note || req.body?.statusNote || "Profile approved by Vismaya Admin";
        const adminId = req.user?.userId || (req.user as any)?._id;

        // 1. Update Profile in DB
        profile.status = "approved";
        profile.isProfileApproved = true;
        profile.isVerified = true;
        profile.verifiedAt = new Date();
        profile.badgeType = badgeType;
        profile.statusReason = note;
        profile.reviewedBy = adminId;
        profile.reviewedAt = new Date();

        // 2. Update linked User in DB so status reflects across all portals
        if (user) {
            user.status = "active";
            await user.save();
            profile.isSearchable = ((profile.profileCompletionPercentage || 0) >= 60) && !!user.isPaid;
        }

        await profile.save();

        // 3. Audit log (guarded)
        try {
            await logAdminAction({
                adminId,
                action: "APPROVE_TALENT_PROFILE",
                targetType: "TalentProfile",
                targetId: profile._id,
                details: `Talent profile approved for ${profile.stageName || user?.name || profile.vismayaId} (${profile.vismayaId}). Badge: ${badgeType}.`,
                req
            });
        } catch (auditErr: any) {
            console.warn("[ApproveTalentProfile] Audit log warning:", auditErr.message);
        }

        // 4. In-app / external notification (guarded)
        const recipientId = user?._id || profile.userId?._id || profile.userId;
        if (recipientId) {
            try {
                await notifyUser({
                    recipientId,
                    type: "account_status",
                    title: "Talent Profile Approved",
                    message: "Your Vismaya talent profile has been verified and approved by admin. You can now apply to live casting calls and auditions."
                });
            } catch (notifErr: any) {
                console.warn("[ApproveTalentProfile] Notification warning:", notifErr.message);
            }
        }

        const populatedProfile = await TalentProfile.findById(profile._id)
            .populate("userId", "name email mobile status isPaid createdAt");

        return res.status(200).json({
            success: true,
            message: "Talent profile approved successfully",
            profile: populatedProfile || profile,
            data: populatedProfile || profile,
            user: user ? {
                id: user._id.toString(),
                _id: user._id.toString(),
                userId: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            } : null
        });
    } catch (error: any) {
        console.error("Approve talent profile error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Something went wrong while approving talent profile"
        });
    }
};

export const rejectTalentProfile = async (req: Request, res: Response): Promise<any> => {
    try {
        const targetId = extractTargetUserId(req);
        const { profile, user } = await resolveTalentAndUserForModeration(targetId);

        if (!profile && !user) {
            return res.status(404).json({
                success: false,
                message: `Talent profile not found for identifier: ${targetId || "unspecified"}`
            });
        }

        const { reason } = req.body || {};
        const rejectionReason = reason || "Profile did not meet verification criteria";
        const adminId = req.user?.userId || (req.user as any)?._id;

        // 1. Update Profile in DB
        profile.status = "rejected";
        profile.isProfileApproved = false;
        profile.isVerified = false;
        profile.isSearchable = false;
        profile.statusReason = rejectionReason;
        profile.rejectionReason = rejectionReason;
        profile.reviewedBy = adminId;
        profile.reviewedAt = new Date();
        await profile.save();

        // 2. Update linked User if requested
        if (user && req.body?.rejectUser === true) {
            user.status = "rejected";
            await user.save();
        }

        // 3. Audit log (guarded)
        try {
            await logAdminAction({
                adminId,
                action: "REJECT_TALENT_PROFILE",
                targetType: "TalentProfile",
                targetId: profile._id,
                details: `Talent profile rejected. Reason: ${rejectionReason}`,
                req
            });
        } catch (auditErr: any) {
            console.warn("[RejectTalentProfile] Audit log warning:", auditErr.message);
        }

        // 4. Notification (guarded)
        const recipientId = user?._id || profile.userId?._id || profile.userId;
        if (recipientId) {
            try {
                await notifyUser({
                    recipientId,
                    type: "account_status",
                    title: "Talent Profile Review Update",
                    message: `Your talent profile was not approved: ${rejectionReason}`
                });
            } catch (notifErr: any) {
                console.warn("[RejectTalentProfile] Notification warning:", notifErr.message);
            }
        }

        const populatedProfile = await TalentProfile.findById(profile._id)
            .populate("userId", "name email mobile status isPaid createdAt");

        return res.status(200).json({
            success: true,
            message: "Talent profile rejected successfully",
            profile: populatedProfile || profile,
            data: populatedProfile || profile,
            user: user ? {
                id: user._id.toString(),
                _id: user._id.toString(),
                name: user.name,
                email: user.email,
                status: user.status
            } : null
        });
    } catch (error: any) {
        console.error("Reject talent profile error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Something went wrong while rejecting talent profile"
        });
    }
};

export const suspendTalentProfile = async (req: Request, res: Response): Promise<any> => {
    try {
        const targetId = extractTargetUserId(req);
        const { profile, user } = await resolveTalentAndUserForModeration(targetId);

        if (!profile && !user) {
            return res.status(404).json({
                success: false,
                message: `Talent profile not found for identifier: ${targetId || "unspecified"}`
            });
        }

        const { reason } = req.body || {};
        const suspendReason = reason || "Profile suspended by administrator";
        const adminId = req.user?.userId || (req.user as any)?._id;

        // 1. Update Profile in DB
        profile.status = "suspended";
        profile.isProfileApproved = false;
        profile.isSearchable = false;
        profile.statusReason = suspendReason;
        profile.reviewedBy = adminId;
        profile.reviewedAt = new Date();
        await profile.save();

        // 2. Update linked User in DB and revoke sessions across all portals
        if (user) {
            user.status = "suspended";
            await user.save();
            try {
                await revokeAllUserSessions(user._id);
            } catch (sessErr: any) {
                console.warn("[SuspendTalentProfile] Session revocation warning:", sessErr.message);
            }
        }

        // 3. Audit log (guarded)
        try {
            await logAdminAction({
                adminId,
                action: "SUSPEND_TALENT_PROFILE",
                targetType: "TalentProfile",
                targetId: profile._id,
                details: `Talent profile suspended. Reason: ${suspendReason}`,
                req
            });
        } catch (auditErr: any) {
            console.warn("[SuspendTalentProfile] Audit log warning:", auditErr.message);
        }

        // 4. Notification (guarded)
        const recipientId = user?._id || profile.userId?._id || profile.userId;
        if (recipientId) {
            try {
                await notifyUser({
                    recipientId,
                    type: "account_status",
                    title: "Talent Account Suspended",
                    message: `Your talent account has been temporarily suspended by administration. Reason: ${suspendReason}`
                });
            } catch (notifErr: any) {
                console.warn("[SuspendTalentProfile] Notification warning:", notifErr.message);
            }
        }

        const populatedProfile = await TalentProfile.findById(profile._id)
            .populate("userId", "name email mobile status isPaid createdAt");

        return res.status(200).json({
            success: true,
            message: "Talent profile suspended successfully",
            profile: populatedProfile || profile,
            data: populatedProfile || profile,
            user: user ? {
                id: user._id.toString(),
                _id: user._id.toString(),
                name: user.name,
                email: user.email,
                status: user.status
            } : null
        });
    } catch (error: any) {
        console.error("Suspend talent profile error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Something went wrong while suspending talent profile"
        });
    }
};

export const reactivateTalentProfile = async (req: Request, res: Response): Promise<any> => {
    try {
        const targetId = extractTargetUserId(req);
        const { profile, user } = await resolveTalentAndUserForModeration(targetId);

        if (!profile && !user) {
            return res.status(404).json({
                success: false,
                message: `Talent profile not found for identifier: ${targetId || "unspecified"}`
            });
        }

        const adminId = req.user?.userId || (req.user as any)?._id;

        // 1. Update Profile in DB
        profile.status = "approved";
        profile.isProfileApproved = true;
        profile.isVerified = true;
        profile.statusReason = null;
        profile.reviewedBy = adminId;
        profile.reviewedAt = new Date();

        // 2. Update linked User in DB so status reflects across all portals
        if (user) {
            user.status = "active";
            await user.save();
            profile.isSearchable = ((profile.profileCompletionPercentage || 0) >= 60) && !!user.isPaid;
        }

        await profile.save();

        // 3. Audit log (guarded)
        try {
            await logAdminAction({
                adminId,
                action: "REACTIVATE_TALENT_PROFILE",
                targetType: "TalentProfile",
                targetId: profile._id,
                details: "Talent profile reactivated.",
                req
            });
        } catch (auditErr: any) {
            console.warn("[ReactivateTalentProfile] Audit log warning:", auditErr.message);
        }

        // 4. Notification (guarded)
        const recipientId = user?._id || profile.userId?._id || profile.userId;
        if (recipientId) {
            try {
                await notifyUser({
                    recipientId,
                    type: "account_status",
                    title: "Talent Account Reactivated",
                    message: "Your artist profile and account have been reactivated by administration."
                });
            } catch (notifErr: any) {
                console.warn("[ReactivateTalentProfile] Notification warning:", notifErr.message);
            }
        }

        const populatedProfile = await TalentProfile.findById(profile._id)
            .populate("userId", "name email mobile status isPaid createdAt");

        return res.status(200).json({
            success: true,
            message: "Talent profile reactivated successfully",
            profile: populatedProfile || profile,
            data: populatedProfile || profile,
            user: user ? {
                id: user._id.toString(),
                _id: user._id.toString(),
                name: user.name,
                email: user.email,
                status: user.status
            } : null
        });
    } catch (error: any) {
        console.error("Reactivate talent profile error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Something went wrong while reactivating talent profile"
        });
    }
};

export const getPendingTalentProfiles = async (req: Request, res: Response): Promise<any> => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 100);
        const skip = (pageNum - 1) * limitNum;

        const filter = {
            isInformational: { $ne: true },
            $or: [
                { status: "pending" },
                { isProfileApproved: false },
                { isProfileApproved: { $exists: false } }
            ]
        };

        const [profiles, total] = await Promise.all([
            TalentProfile.find(filter as any)
                .populate("userId", "name email mobile status isPaid createdAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            TalentProfile.countDocuments(filter as any)
        ]);

        const mappedProfiles = profiles.map(p => {
            const pObj = (p && (p as any).toObject) ? (p as any).toObject() : { ...p };
            const u = pObj.userId;
            const userMobile = (typeof u === "object" ? u?.mobile : null) || pObj.mobile || pObj.phone || "";
            const userEmail = (typeof u === "object" ? u?.email : null) || pObj.email || "";
            const userName = (typeof u === "object" ? u?.name : null) || pObj.name || pObj.stageName || "";
            return {
                ...pObj,
                mobile: userMobile,
                phone: userMobile,
                email: userEmail,
                name: userName,
                contactDetails: {
                    ...(pObj.contactDetails || {}),
                    mobile: userMobile,
                    phone: userMobile,
                    email: userEmail,
                    name: userName,
                }
            };
        });

        res.status(200).json({
            success: true,
            count: mappedProfiles.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            profiles: mappedProfiles,
            data: mappedProfiles
        });
    } catch (error: any) {
        console.error("Get pending talent profiles error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching pending talent profiles" });
    }
};

export const getTalentProfileById = async (req: Request, res: Response): Promise<any> => {
    try {
        const targetId = extractTargetUserId(req);
        let profile = await findTalentProfileByIdOrVismayaId(targetId);

        if (!profile) {
            const user = await findUserByIdOrVismayaId(targetId);
            if (!user) {
                return res.status(404).json({ success: false, message: `Talent profile not found for identifier: ${targetId || "unspecified"}` });
            }
            // Synthesize profile representation just like getTalentDirectory does for unprofiled users
            profile = {
                _id: user._id,
                id: user._id.toString(),
                userId: user,
                vismayaId: `VIS-${user._id.toString().slice(-6).toUpperCase()}`,
                stageName: user.name || "Artist",
                name: user.name || "Artist",
                category: "open_talent",
                currentCity: "Mumbai",
                currentState: "Maharashtra",
                primaryProfession: "Actor / Performer",
                status: user.status === "suspended" ? "suspended" : (user.status === "active" ? "pending" : user.status),
                isProfileApproved: user.status === "active",
                isVerified: false,
                profileCompletionPercentage: 35,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                mobile: user.mobile || "",
                phone: user.mobile || "",
                email: user.email || ""
            };
        }

        const profileObj = (profile && (profile as any).toObject) ? (profile as any).toObject() : { ...profile };
        const u = profileObj.userId;
        const userMobile = (typeof u === "object" ? u?.mobile : null) || profileObj.mobile || profileObj.phone || "";
        const userEmail = (typeof u === "object" ? u?.email : null) || profileObj.email || "";
        const userName = (typeof u === "object" ? u?.name : null) || profileObj.name || profileObj.stageName || "";

        const fullProfile = {
            ...profileObj,
            mobile: userMobile,
            phone: userMobile,
            email: userEmail,
            name: userName,
            contactDetails: {
                ...(profileObj.contactDetails || {}),
                mobile: userMobile,
                phone: userMobile,
                email: userEmail,
                name: userName,
            }
        };

        res.status(200).json({
            success: true,
            profile: fullProfile,
            data: fullProfile
        });
    } catch (error: any) {
        console.error("Get talent profile by ID error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching talent profile" });
    }
};

export const approveUser = async (req: Request, res: Response): Promise<any> => {
    try {
        const targetId = extractTargetUserId(req);
        const user = await findUserByIdOrVismayaId(targetId);

        if (!user) {
            return res.status(404).json({ success: false, message: `User not found for identifier: ${targetId || "unspecified"}` });
        }

        const prevStatus = user.status;
        user.status = "active";
        await user.save();

        // Synchronize associated TalentProfile in database
        await TalentProfile.updateMany(
            { userId: user._id },
            {
                $set: {
                    status: "approved",
                    isVerified: true,
                    isProfileApproved: true,
                    verifiedAt: new Date(),
                    badgeType: "verified"
                }
            }
        );

        // Synchronize associated Organization in database
        await Organization.updateMany(
            { userId: user._id },
            {
                $set: {
                    status: "active",
                    verificationState: "verified",
                    "verificationStatus.businessVerified": true,
                    isVerified: true
                }
            }
        );

        await Verification.updateMany(
            { userId: user._id, status: "pending" },
            {
                $set: {
                    status: "verified",
                    reviewedAt: new Date(),
                    reviewedBy: req.user?.userId
                }
            }
        );

        await logAdminAction({
            adminId: (req.user?.userId as any),
            action: "APPROVE_USER",
            targetType: "User",
            targetId: user._id,
            details: `User status changed from ${prevStatus} to active`
        });

        await notifyUser({
            recipientId: user._id,
            type: "account_status",
            title: "Account Approved",
            message: "Your Vismaya Creative Studios account has been approved by admin."
        });

        res.status(200).json({
            success: true,
            message: "User approved successfully",
            user: {
                id: user._id.toString(),
                _id: user._id.toString(),
                userId: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (error: any) {
        console.error("Approve user error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while approving user" });
    }
};

export const getPendingUsers = async (req: Request, res: Response): Promise<any> => {
    try {
        const users = await User.find({ status: "pending" }).select("-password");
        res.status(200).json({ success: true, count: users.length, users });
    } catch (error: any) {
        console.error("Get pending users error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching pending users" });
    }
};

export const rejectUser = async (req: Request, res: Response): Promise<any> => {
    try {
        const targetId = extractTargetUserId(req);
        const { reason } = req.body || {};
        const user = await findUserByIdOrVismayaId(targetId);

        if (!user) {
            return res.status(404).json({ success: false, message: `User not found for identifier: ${targetId || "unspecified"}` });
        }

        user.status = "rejected";
        await user.save();

        await TalentProfile.updateMany(
            { userId: user._id },
            { $set: { status: "rejected", isProfileApproved: false } }
        );

        await Organization.updateMany(
            { userId: user._id },
            { $set: { status: "rejected", verificationState: "rejected", isVerified: false } }
        );

        await Verification.updateMany(
            { userId: user._id, status: "pending" },
            {
                $set: {
                    status: "rejected",
                    reviewedAt: new Date(),
                    reviewedBy: req.user?.userId,
                    rejectionReason: reason || "Rejected by admin"
                }
            }
        );

        await logAdminAction({
            adminId: (req.user?.userId as any),
            action: "REJECT_USER",
            targetType: "User",
            targetId: user._id,
            details: `User rejected. Reason: ${reason || "Not specified"}`
        });

        res.status(200).json({
            success: true,
            message: "User rejected successfully",
            user: {
                id: user._id.toString(),
                _id: user._id.toString(),
                userId: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (error: any) {
        console.error("Reject user error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while rejecting user" });
    }
};

export const suspendUser = async (req: Request, res: Response): Promise<any> => {
    try {
        const targetId = extractTargetUserId(req);
        const { reason } = req.body || {};
        const user = await findUserByIdOrVismayaId(targetId);

        if (!user) {
            return res.status(404).json({ success: false, message: `User not found for identifier: ${targetId || "unspecified"}` });
        }

        user.status = "suspended";
        await user.save();

        await TalentProfile.updateMany(
            { userId: user._id },
            { $set: { status: "suspended", isProfileApproved: false } }
        );

        await Organization.updateMany(
            { userId: user._id },
            { $set: { status: "suspended", isVerified: false } }
        );

        await revokeAllUserSessions(user._id);

        await logAdminAction({
            adminId: (req.user?.userId as any),
            action: "SUSPEND_USER",
            targetType: "User",
            targetId: user._id,
            details: `User suspended. Reason: ${reason || "Violation of terms"}`
        });

        res.status(200).json({
            success: true,
            message: "User suspended successfully",
            user: {
                id: user._id.toString(),
                _id: user._id.toString(),
                userId: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (error: any) {
        console.error("Suspend user error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while suspending user" });
    }
};

export const reactivateUser = async (req: Request, res: Response): Promise<any> => {
    try {
        const targetId = extractTargetUserId(req);
        const user = await findUserByIdOrVismayaId(targetId);

        if (!user) {
            return res.status(404).json({ success: false, message: `User not found for identifier: ${targetId || "unspecified"}` });
        }

        user.status = "active";
        await user.save();

        await TalentProfile.updateMany(
            { userId: user._id },
            { $set: { status: "active", isVerified: true, isProfileApproved: true } }
        );

        await Organization.updateMany(
            { userId: user._id },
            { $set: { status: "active", isVerified: true } }
        );

        await logAdminAction({
            adminId: (req.user?.userId as any),
            action: "REACTIVATE_USER",
            targetType: "User",
            targetId: user._id,
            details: "User reactivated to active status"
        });

        res.status(200).json({
            success: true,
            message: "User reactivated successfully",
            user: {
                id: user._id.toString(),
                _id: user._id.toString(),
                userId: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (error: any) {
        console.error("Reactivate user error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while reactivating user" });
    }
};

export const banUser = async (req: Request, res: Response): Promise<any> => {
    try {
        const targetId = extractTargetUserId(req);
        const { reason } = req.body || {};
        const user = await findUserByIdOrVismayaId(targetId);

        if (!user) {
            return res.status(404).json({ success: false, message: `User not found for identifier: ${targetId || "unspecified"}` });
        }

        user.status = "banned";
        await user.save();

        await revokeAllUserSessions(user._id);

        await logAdminAction({
            adminId: (req.user?.userId as any),
            action: "BAN_USER",
            targetType: "User",
            targetId: user._id,
            details: `User banned. Reason: ${reason || "Administrative ban"}`
        });

        res.status(200).json({
            success: true,
            message: "User banned successfully and all active sessions revoked",
            user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status }
        });
    } catch (error: any) {
        console.error("Ban user error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while banning user" });
    }
};

export const unbanUser = async (req: Request, res: Response): Promise<any> => {
    try {
        const targetId = extractTargetUserId(req);
        const user = await findUserByIdOrVismayaId(targetId);

        if (!user) {
            return res.status(404).json({ success: false, message: `User not found for identifier: ${targetId || "unspecified"}` });
        }

        user.status = "active";
        await user.save();

        await logAdminAction({
            adminId: (req.user?.userId as any),
            action: "UNBAN_USER",
            targetType: "User",
            targetId: user._id,
            details: "User unbanned to active status"
        });

        res.status(200).json({
            success: true,
            message: "User unbanned successfully",
            user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status }
        });
    } catch (error: any) {
        console.error("Unban user error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while unbanning user" });
    }
};

export const finalizeUserDeletion = async (req: Request, res: Response): Promise<any> => {
    try {
        const targetId = extractTargetUserId(req);
        const user = await findUserByIdOrVismayaId(targetId);

        if (!user) {
            return res.status(404).json({ success: false, message: `User not found for identifier: ${targetId || "unspecified"}` });
        }

        user.status = "deleted";
        user.name = "Deleted User";
        user.email = `deleted_${user._id}@deleted.local`;
        user.mobile = undefined;
        await user.save();

        await revokeAllUserSessions(user._id);

        await logAdminAction({
            adminId: (req.user?.userId as any),
            action: "FINALIZE_USER_DELETION",
            targetType: "User",
            targetId: user._id,
            details: "User account finalized as deleted and PII scrubbed"
        });

        res.status(200).json({
            success: true,
            message: "User account permanently finalized as deleted and PII scrubbed"
        });
    } catch (error: any) {
        console.error("Finalize deletion error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while finalizing user deletion" });
    }
};


export const getAllUsers = async (req: Request, res: Response): Promise<any> => {
    try {
        const { role, status, page = 1, limit = 20 } = req.query;
        const filter: any = {};
        if (role) filter.role = role;
        if (status) filter.status = status;

        const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 20, 1), 100);
        const skip = (pageNum - 1) * limitNum;

        const [users, total] = await Promise.all([
            User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limitNum),
            User.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            count: users.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            users
        });
    } catch (error: any) {
        console.error("Get all users error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching users" });
    }
};

// --- DIRECTORIES ---

export const getTalentDirectory = async (req: Request, res: Response): Promise<any> => {
    try {
        const { profession, city, status, search, page = 1, limit = 50 } = req.query;
        const filter: any = { isInformational: { $ne: true } };
        if (profession) filter.primaryProfession = new RegExp(escapeRegex(profession), "i");
        if (city) filter.currentCity = new RegExp(escapeRegex(city), "i");

        const andConditions: any[] = [];

        if (status && status !== "all") {
            const st = String(status).toLowerCase().trim();
            if (st === "pending") {
                andConditions.push({
                    $or: [
                        { status: "pending" },
                        { isProfileApproved: false },
                        { isProfileApproved: { $exists: false } }
                    ]
                });
            } else if (st === "approved" || st === "active" || st === "verified") {
                andConditions.push({
                    $or: [
                        { status: { $in: ["approved", "active"] } },
                        { isProfileApproved: true }
                    ]
                });
            } else if (st === "rejected") {
                andConditions.push({ status: "rejected" });
            } else if (st === "suspended") {
                andConditions.push({ status: "suspended" });
            } else {
                andConditions.push({ status: st });
            }
        }

        if (search && String(search).trim()) {
            const searchRegex = new RegExp(escapeRegex(String(search).trim()), "i");
            const searchOr: any[] = [
                { stageName: searchRegex },
                { firstName: searchRegex },
                { lastName: searchRegex },
                { vismayaId: searchRegex },
                { currentCity: searchRegex },
                { primaryProfession: searchRegex }
            ];

            const matchingUsers = await User.find({
                $or: [{ name: searchRegex }, { email: searchRegex }],
                role: "talent"
            }).select("_id");

            if (matchingUsers.length > 0) {
                searchOr.push({ userId: { $in: matchingUsers.map(u => u._id) } });
            }

            andConditions.push({ $or: searchOr });
        }

        if (andConditions.length > 0) {
            filter.$and = andConditions;
        }

        const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 100);
        const skip = (pageNum - 1) * limitNum;

        const [profiles, total] = await Promise.all([
            TalentProfile.find(filter as any)
                .populate("userId", "name email mobile status isPaid createdAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            TalentProfile.countDocuments(filter as any)
        ]);

        // Synthesize only if searching all or specific unprofiled matches
        let syntheticProfiles: any[] = [];
        if (!status || status === "all" || status === "pending" || status === "active" || status === "suspended") {
            const profileUserIds = profiles.map(p => p.userId?._id?.toString()).filter(Boolean);
            const userFilter: any = {
                role: "talent",
                _id: { $nin: profileUserIds }
            };
            if (status === "pending") userFilter.status = "pending";
            if (status === "active") userFilter.status = "active";
            if (status === "suspended") userFilter.status = "suspended";

            const unprofiledUsers = await User.find(userFilter as any)
                .select("-password")
                .sort({ createdAt: -1 })
                .limit(20);

            syntheticProfiles = unprofiledUsers.map((u: any) => ({
                _id: u._id,
                userId: u,
                stageName: u.name,
                currentCity: "Mumbai",
                currentState: "Maharashtra",
                primaryProfession: "Actor / Performer",
                gender: "Any",
                status: u.status === "active" ? "active" : (u.status === "suspended" ? "suspended" : "pending"),
                isProfileApproved: u.status === "active",
                createdAt: u.createdAt,
                photos: []
            }));
        }

        const allProfiles = [...profiles, ...syntheticProfiles];
        const mappedProfiles = allProfiles.map((p: any) => {
            const pObj = p?.toObject ? p.toObject() : { ...p };
            const u = pObj.userId;
            const userMobile = (typeof u === "object" ? u?.mobile : null) || pObj.mobile || pObj.phone || "";
            const userEmail = (typeof u === "object" ? u?.email : null) || pObj.email || "";
            const userName = (typeof u === "object" ? u?.name : null) || pObj.name || pObj.stageName || "";
            return {
                ...pObj,
                mobile: userMobile,
                phone: userMobile,
                email: userEmail,
                name: userName,
                contactDetails: {
                    ...(pObj.contactDetails || {}),
                    mobile: userMobile,
                    phone: userMobile,
                    email: userEmail,
                    name: userName,
                }
            };
        });

        res.status(200).json({
            success: true,
            count: mappedProfiles.length,
            total: total + syntheticProfiles.length,
            page: pageNum,
            totalPages: Math.ceil((total + syntheticProfiles.length) / limitNum) || 1,
            profiles: mappedProfiles,
            data: mappedProfiles
        });
    } catch (error: any) {
        console.error("Get talent directory error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching talent directory" });
    }
};

export const getOrganizationDirectory = async (req: Request, res: Response): Promise<any> => {
    try {
        const { type, page = 1, limit = 50 } = req.query;
        const filter: any = {};
        if (type) filter.organizationType = new RegExp(escapeRegex(type), "i");

        const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 100);
        const skip = (pageNum - 1) * limitNum;

        const [organizations, total] = await Promise.all([
            Organization.find(filter)
                .populate("userId", "name email mobile status isPaid createdAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Organization.countDocuments(filter)
        ]);

        const orgIds = organizations.map(o => o._id);
        const ledgers = await CreditLedger.find({ organizationId: { $in: orgIds } });
        const ledgerMap = new Map(ledgers.map(l => [l.organizationId.toString(), l.balance]));

        const enrichedOrgs = organizations.map((o: any) => {
            const orgObj = o.toObject ? o.toObject() : { ...o };
            orgObj.credits = ledgerMap.get(orgObj._id.toString()) ?? 100;
            orgObj.status = orgObj.status || (orgObj.userId as any)?.status || orgObj.verificationState || "pending";
            return orgObj;
        });

        const orgUserIds = organizations.map(o => o.userId?._id?.toString()).filter(Boolean);
        const unprofiledUsers = await User.find({
            role: "organization",
            _id: { $nin: orgUserIds }
        }).select("-password").sort({ createdAt: -1 }).limit(limitNum);

        const syntheticOrgs = unprofiledUsers.map((u: any) => ({
            _id: u._id,
            userId: u,
            organizationName: u.name,
            contactPerson: u.name,
            contactEmail: u.email,
            contactNumber: u.mobile,
            organizationType: "Production House",
            status: u.status || "pending",
            credits: 100,
            createdAt: u.createdAt
        }));

        const allOrgs = [...enrichedOrgs, ...syntheticOrgs];

        res.status(200).json({
            success: true,
            count: allOrgs.length,
            total: total + unprofiledUsers.length,
            page: pageNum,
            totalPages: Math.ceil((total + unprofiledUsers.length) / limitNum),
            organizations: allOrgs
        });
    } catch (error: any) {
        console.error("Get organization directory error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching organization directory" });
    }
};

// --- OPPORTUNITIES ADMIN QUEUE ---

export const getAllOpportunitiesAdmin = async (req: Request, res: Response): Promise<any> => {
    try {
        const { status, organizationId, projectId, page = 1, limit = 100 } = req.query;
        const filter: any = {};
        if (status && status !== "ALL") {
            const s = String(status).trim();
            if (s.toLowerCase() === "submitted" || s.toLowerCase() === "pending") {
                filter.status = { $in: ["pending", "under_vismaya_review"] };
            } else if (s.toLowerCase() === "changes requested" || s.toLowerCase() === "corrections_requested") {
                filter.status = "corrections_requested";
            } else if (s.toLowerCase() === "cancel requested" || s.toLowerCase() === "cancellation_requested") {
                filter.status = "cancellation_requested";
            } else {
                filter.status = s.toLowerCase();
            }
        }
        if (organizationId) {
            const orgProjects = await Project.find({ organizationId } as any).select("_id");
            filter.projectId = { $in: orgProjects.map((p: any) => p._id) };
        } else if (projectId) {
            filter.projectId = projectId;
        }

        const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 100, 1), 200);
        const skip = (pageNum - 1) * limitNum;

        const [opportunities, total] = await Promise.all([
            Opportunity.find(filter)
                .populate({
                    path: "projectId",
                    select: "projectName organizationId projectType title type description status",
                    populate: {
                        path: "organizationId",
                        select: "organizationName contactPerson contactEmail contactNumber"
                    }
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Opportunity.countDocuments(filter)
        ]);

        const rawProjectIds = opportunities
            .map((o: any) => o.projectId?._id || o.projectId)
            .filter(Boolean);
        const projectObjectIds = rawProjectIds
            .filter((id: any) => mongoose.Types.ObjectId.isValid(id.toString()))
            .map((id: any) => new mongoose.Types.ObjectId(id.toString()));
        const projectIdStrings = rawProjectIds.map((id: any) => id.toString());
        const allProjectIds = [...projectObjectIds, ...projectIdStrings];

        const oppCounts = allProjectIds.length > 0 ? await Opportunity.aggregate([
            {
                $match: {
                    projectId: { $in: allProjectIds },
                    status: { $ne: "deleted" },
                    isDeleted: { $ne: true }
                }
            },
            { $group: { _id: "$projectId", count: { $sum: 1 } } }
        ]) : [];

        const countMap = new Map<string, number>();
        for (const c of oppCounts) {
            const key = c._id.toString();
            countMap.set(key, (countMap.get(key) || 0) + c.count);
        }

        const enrichedOpportunities = opportunities.map((opp: any) => {
            const oppObj = opp.toObject ? opp.toObject() : { ...opp };
            if (oppObj.projectId && typeof oppObj.projectId === "object") {
                const pId = oppObj.projectId._id?.toString() || oppObj.projectId.id?.toString() || "";
                oppObj.projectId.opportunityCount = countMap.get(pId) || 0;
                oppObj.projectId.opportunitiesCount = oppObj.projectId.opportunityCount;
            }
            return oppObj;
        });

        res.status(200).json({
            success: true,
            count: enrichedOpportunities.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            opportunities: enrichedOpportunities
        });
    } catch (error: any) {
        console.error("Get all admin opportunities error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching opportunities" });
    }
};

export const getAllApplicationsAdmin = async (req: Request, res: Response): Promise<any> => {
    try {
        const { opportunityId, talentId, status, page = 1, limit = 100 } = req.query;
        const filter: any = {};
        if (opportunityId) filter.opportunityId = opportunityId;
        if (talentId) filter.talentId = talentId;
        if (status && status !== "ALL") {
            filter.status = String(status).toLowerCase().replace(/\s+/g, "_");
        }

        const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 100, 1), 200);
        const skip = (pageNum - 1) * limitNum;

        const [applications, total] = await Promise.all([
            Application.find(filter)
                .populate({
                    path: "opportunityId",
                    select: "title role projectId remuneration location deadline",
                    populate: {
                        path: "projectId",
                        select: "projectName organizationId"
                    }
                })
                .populate("talentId", "name email mobile status role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Application.countDocuments(filter)
        ]);

        const talentUserIds = applications.map(a => a.talentId?._id).filter(Boolean);
        const profiles = await TalentProfile.find({ userId: { $in: talentUserIds } });
        const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

        const enrichedApplications = applications.map((app: any) => {
            const appObj = app.toObject();
            const prof: any = app.talentId?._id ? profileMap.get(app.talentId._id.toString()) : null;
            if (prof) {
                appObj.talentProfile = prof;
                appObj.talentName = prof.stageName || prof.personalDetails?.stageName || prof.personalDetails?.fullName || appObj.talentId?.name;
                appObj.talentAvatar = prof.profilePhoto || prof.avatar;
            } else if (appObj.talentId) {
                appObj.talentName = appObj.talentId.name;
            }
            return appObj;
        });

        res.status(200).json({
            success: true,
            count: enrichedApplications.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            applications: enrichedApplications
        });
    } catch (error: any) {
        console.error("Get all admin applications error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching applications" });
    }
};

export const getAllProjectsAdmin = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, status, page = 1, limit = 100 } = req.query;
        const filter: any = {};
        if (organizationId) filter.organizationId = organizationId;
        if (status && status !== "ALL") filter.status = String(status).toLowerCase();

        const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 100, 1), 200);
        const skip = (pageNum - 1) * limitNum;

        const [projects, total] = await Promise.all([
            Project.find(filter)
                .populate("organizationId", "organizationName contactPerson contactEmail contactNumber")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Project.countDocuments(filter)
        ]);

        const rawProjectIds = projects.map(p => p._id).filter(Boolean);
        const projectObjectIds = rawProjectIds
            .filter((id: any) => mongoose.Types.ObjectId.isValid(id.toString()))
            .map((id: any) => new mongoose.Types.ObjectId(id.toString()));
        const projectIdStrings = rawProjectIds.map((id: any) => id.toString());
        const allProjectIds = [...projectObjectIds, ...projectIdStrings];

        const opportunityCounts = allProjectIds.length > 0 ? await Opportunity.aggregate([
            {
                $match: {
                    projectId: { $in: allProjectIds },
                    status: { $ne: "deleted" },
                    isDeleted: { $ne: true }
                }
            },
            { $group: { _id: "$projectId", count: { $sum: 1 } } }
        ]) : [];

        const oppCountMap: Record<string, number> = {};
        for (const item of opportunityCounts) {
            const key = item._id.toString();
            oppCountMap[key] = (oppCountMap[key] || 0) + item.count;
        }

        const projectsWithStats = projects.map((p: any) => {
            const pObj = p.toObject ? p.toObject() : { ...p };
            pObj.opportunityCount = oppCountMap[p._id.toString()] || 0;
            pObj.opportunitiesCount = pObj.opportunityCount;
            return pObj;
        });

        res.status(200).json({
            success: true,
            count: projectsWithStats.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            projects: projectsWithStats
        });
    } catch (error: any) {
        console.error("Get all admin projects error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching projects" });
    }
};

export const getPendingOpportunities = async (req: Request, res: Response): Promise<any> => {
    try {
        const opportunities = await Opportunity.find({
            status: { $in: ["pending", "under_vismaya_review"] }
        }).populate({
            path: "projectId",
            select: "projectName organizationId projectType title type description status",
            populate: {
                path: "organizationId",
                select: "organizationName contactPerson contactEmail contactNumber"
            }
        }).sort({ createdAt: -1 });

        const rawProjectIds = opportunities
            .map((o: any) => o.projectId?._id || o.projectId)
            .filter(Boolean);
        const projectObjectIds = rawProjectIds
            .filter((id: any) => mongoose.Types.ObjectId.isValid(id.toString()))
            .map((id: any) => new mongoose.Types.ObjectId(id.toString()));
        const projectIdStrings = rawProjectIds.map((id: any) => id.toString());
        const allProjectIds = [...projectObjectIds, ...projectIdStrings];

        const oppCounts = allProjectIds.length > 0 ? await Opportunity.aggregate([
            {
                $match: {
                    projectId: { $in: allProjectIds },
                    status: { $ne: "deleted" },
                    isDeleted: { $ne: true }
                }
            },
            { $group: { _id: "$projectId", count: { $sum: 1 } } }
        ]) : [];

        const countMap = new Map<string, number>();
        for (const c of oppCounts) {
            const key = c._id.toString();
            countMap.set(key, (countMap.get(key) || 0) + c.count);
        }

        const enrichedOpportunities = opportunities.map((opp: any) => {
            const oppObj = opp.toObject ? opp.toObject() : { ...opp };
            if (oppObj.projectId && typeof oppObj.projectId === "object") {
                const pId = oppObj.projectId._id?.toString() || oppObj.projectId.id?.toString() || "";
                oppObj.projectId.opportunityCount = countMap.get(pId) || 0;
                oppObj.projectId.opportunitiesCount = oppObj.projectId.opportunityCount;
            }
            return oppObj;
        });

        res.status(200).json({ success: true, count: enrichedOpportunities.length, opportunities: enrichedOpportunities });
    } catch (error: any) {
        console.error("Get pending opportunities error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching pending opportunities" });
    }
};

export const approveOpportunity = async (req: Request, res: Response): Promise<any> => {
    try {
        const oppId = req.params.opportunityId || req.params.id || req.body?.opportunityId || req.body?.id;
        const opportunity = await Opportunity.findById(oppId);

        if (!opportunity) {
            return res.status(404).json({ success: false, message: "Opportunity not found" });
        }

        const project = await Project.findById(opportunity.projectId);
        if (project && project.status === "suspended") {
            return res.status(400).json({
                success: false,
                message: "Cannot approve opportunity: The parent project is suspended."
            });
        }

        opportunity.status = "published";
        opportunity.publishedAt = new Date();
        opportunity.approvedAt = new Date();
        opportunity.approvedBy = req.user?.userId as any;
        await opportunity.save();

        await logAdminAction({
            adminId: (req.user?.userId as any),
            action: "APPROVE_OPPORTUNITY",
            targetType: "opportunity",
            targetId: opportunity._id,
            details: `Approved opportunity: ${opportunity.title}`
        });

        // Notify the organization (in-app notification + email respecting user email toggle)
        try {
            const project = await Project.findById(opportunity.projectId);
            const organization = project ? await Organization.findById(project.organizationId) : null;
            const recipientId = organization?.userId;
            if (recipientId) {
                await notifyUser({
                    recipientId,
                    type: "opportunity_approved",
                    title: "Opportunity Approved",
                    message: `Your casting opportunity "${opportunity.title}" has been approved and published on Vismaya.`,
                    referenceId: opportunity._id,
                    referenceType: "Opportunity",
                    sendEmailAlert: true,
                    emailSubject: `Opportunity Approved: ${opportunity.title}`
                });
            }
        } catch (notifErr: any) {
            console.warn("[ApproveOpportunity] Notification warning:", notifErr.message);
        }

        res.status(200).json({ success: true, message: "Opportunity approved and published successfully", opportunity });
    } catch (error: any) {
        console.error("Approve opportunity error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while approving opportunity" });
    }
};

export const rejectOpportunity = async (req: Request, res: Response): Promise<any> => {
    try {
        const oppId = req.params.opportunityId || req.params.id || req.body?.opportunityId || req.body?.id;
        const { rejectionReason, reason } = req.body || {};
        const finalReason = (rejectionReason || reason || "").trim();

        if (!finalReason || finalReason.length < 10) {
            return res.status(400).json({
                success: false,
                message: "Rejection reason is required and must be at least 10 characters"
            });
        }

        const opportunity = await Opportunity.findById(oppId);
        if (!opportunity) {
            return res.status(404).json({ success: false, message: "Opportunity not found" });
        }

        opportunity.status = "rejected";
        opportunity.rejectionReason = finalReason;
        opportunity.rejectedAt = new Date();
        if (req.user?.userId) {
            opportunity.rejectedBy = req.user.userId as any;
        }
        await opportunity.save();

        await logAdminAction({
            adminId: (req.user?.userId as any),
            action: "REJECT_OPPORTUNITY",
            targetType: "opportunity",
            targetId: opportunity._id,
            details: `Rejected opportunity. Reason: ${opportunity.rejectionReason}`
        });

        // Notify the organization (in-app notification + email respecting user email toggle)
        try {
            const project = await Project.findById(opportunity.projectId);
            const organization = project ? await Organization.findById(project.organizationId) : null;
            const recipientId = organization?.userId;
            if (recipientId) {
                await notifyUser({
                    recipientId,
                    type: "opportunity_rejected",
                    title: "Opportunity Rejected",
                    message: `Your casting opportunity "${opportunity.title}" was rejected. Reason: ${finalReason}`,
                    referenceId: opportunity._id,
                    referenceType: "Opportunity",
                    sendEmailAlert: true,
                    emailSubject: `Opportunity Rejected: ${opportunity.title}`
                });
            }
        } catch (notifErr: any) {
            console.warn("[RejectOpportunity] Notification warning:", notifErr.message);
        }

        res.status(200).json({ success: true, message: "Opportunity rejected successfully", opportunity });
    } catch (error: any) {
        console.error("Reject opportunity error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while rejecting opportunity" });
    }
};

export const requestOpportunityCorrections = async (req: Request, res: Response): Promise<any> => {
    try {
        const oppId = req.params.opportunityId || req.params.id || req.body?.opportunityId || req.body?.id;
        const { correctionNotes } = req.body || {};

        if (!correctionNotes) {
            return res.status(400).json({ success: false, message: "Correction notes are required" });
        }

        const opportunity = await Opportunity.findById(oppId);
        if (!opportunity) {
            return res.status(404).json({ success: false, message: "Opportunity not found" });
        }

        opportunity.status = "corrections_requested";
        opportunity.correctionNotes = correctionNotes;
        opportunity.correctionRequestedAt = new Date();
        opportunity.correctionRequestedBy = req.user?.userId as any;
        await opportunity.save();

        await logAdminAction({
            adminId: (req.user?.userId as any),
            action: "REQUEST_OPPORTUNITY_CORRECTIONS",
            targetType: "opportunity",
            targetId: opportunity._id,
            details: `Corrections requested: ${correctionNotes}`
        });

        // Notify the organization (in-app notification + email respecting user email toggle)
        try {
            const project = await Project.findById(opportunity.projectId);
            const organization = project ? await Organization.findById(project.organizationId) : null;
            const recipientId = organization?.userId;
            if (recipientId) {
                await notifyUser({
                    recipientId,
                    type: "opportunity_corrections_requested",
                    title: "Opportunity Corrections Requested",
                    message: `Corrections requested for your casting opportunity "${opportunity.title}": ${correctionNotes}`,
                    referenceId: opportunity._id,
                    referenceType: "Opportunity",
                    sendEmailAlert: true,
                    emailSubject: `Corrections Requested: ${opportunity.title}`
                });
            }
        } catch (notifErr: any) {
            console.warn("[RequestCorrections] Notification warning:", notifErr.message);
        }

        res.status(200).json({ success: true, message: "Corrections requested from organization", opportunity });
    } catch (error: any) {
        console.error("Request corrections error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while requesting corrections" });
    }
};

export const getCancellationRequests = async (req: Request, res: Response): Promise<any> => {
    try {
        const opportunities = await Opportunity.find({
            $or: [
                { "cancellationRequest.decision": { $in: ["pending", "approved", "declined"] } },
                { status: "cancellation_requested" },
                { status: "cancelled", cancellationReason: { $exists: true, $ne: "" } }
            ]
        })
            .populate({
                path: "projectId",
                select: "projectName organizationId projectType",
                populate: {
                    path: "organizationId",
                    select: "organizationName contactPerson contactEmail contactNumber name"
                }
            })
            .sort({ "cancellationRequest.requestedAt": -1, cancellationRequestedAt: -1, updatedAt: -1 });

        const formattedRequests = opportunities.map((opp: any) => {
            const oppObj = opp.toObject ? opp.toObject() : opp;
            let reqRecord = oppObj.cancellationRequest;

            if (!reqRecord) {
                let decision: "pending" | "approved" | "declined" = "pending";
                if (oppObj.status === "cancelled") {
                    decision = "approved";
                } else if (oppObj.status === "cancellation_requested") {
                    decision = "pending";
                } else {
                    decision = "declined";
                }

                reqRecord = {
                    reason: oppObj.cancellationReason || "No reason provided",
                    requestedAt: oppObj.cancellationRequestedAt || oppObj.updatedAt || oppObj.createdAt,
                    decision,
                    decidedAt: oppObj.cancellationReviewedAt || null,
                    decidedBy: oppObj.cancellationReviewedBy || null,
                    adminNote: oppObj.correctionNotes || "",
                    declineReason: decision === "declined" ? (oppObj.rejectionReason || "Request declined") : ""
                };
            }

            const proj = oppObj.projectId || {};
            const org = oppObj.organizationId || proj.organizationId || {};
            const orgName = org.organizationName || org.name || "Unknown Organization";
            const projectName = proj.projectName || oppObj.projectName || "Unknown Project";

            return {
                ...oppObj,
                cancellationRequest: reqRecord,
                decision: reqRecord.decision,
                reason: reqRecord.reason,
                requestedAt: reqRecord.requestedAt,
                decidedAt: reqRecord.decidedAt,
                adminNote: reqRecord.adminNote,
                declineReason: reqRecord.declineReason,
                opportunityTitle: oppObj.title,
                projectName,
                organizationName: orgName
            };
        });

        res.status(200).json({
            success: true,
            count: formattedRequests.length,
            opportunities: formattedRequests,
            requests: formattedRequests,
            data: formattedRequests
        });
    } catch (error: any) {
        console.error("Get cancellation requests error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching cancellation requests" });
    }
};

export const reviewOpportunityCancellation = async (req: Request, res: Response): Promise<any> => {
    try {
        const { opportunityId } = req.params;
        const { action, reason, adminNote, declineReason } = req.body; // "approve" or "reject"
        const normalizedAction = (action || "").toLowerCase() === "approve" ? "approve" : "reject";
        const note = adminNote || reason || "";
        const declineNote = declineReason || adminNote || reason || "Cancellation request was not approved";

        const opportunity = await Opportunity.findById(opportunityId);
        if (!opportunity) {
            return res.status(404).json({ success: false, message: "Opportunity not found" });
        }

        const alreadyProcessed = (normalizedAction === "approve" && opportunity.status === "cancelled" && opportunity.cancellationRequest?.decision === "approved") ||
            (normalizedAction === "reject" && opportunity.cancellationRequest?.decision === "declined");
        let affectedCount = 0;

        if (normalizedAction === "approve") {
            opportunity.status = "cancelled";
            opportunity.cancellationReviewedAt = new Date();
            opportunity.cancellationReviewedBy = req.user?.userId as any;

            if (!opportunity.cancellationRequest) {
                opportunity.cancellationRequest = {
                    reason: opportunity.cancellationReason || "Cancellation requested",
                    requestedAt: opportunity.cancellationRequestedAt || opportunity.updatedAt || new Date(),
                    decision: "approved"
                };
            }
            opportunity.cancellationRequest.decision = "approved";
            opportunity.cancellationRequest.decidedBy = req.user?.userId as any;
            opportunity.cancellationRequest.decidedAt = new Date();
            opportunity.cancellationRequest.adminNote = note;

            if (!alreadyProcessed) {
                // Find all active applications (applied, under_review, shortlisted, selected)
                const activeApplications = await Application.find({
                    opportunityId: opportunity._id,
                    status: { $in: ["applied", "under_review", "shortlisted", "selected"] }
                });
                affectedCount = activeApplications.length;

                if (affectedCount > 0) {
                    await Application.updateMany(
                        {
                            opportunityId: opportunity._id,
                            status: { $in: ["applied", "under_review", "shortlisted", "selected"] }
                        },
                        {
                            $set: { status: "opportunity_cancelled" }
                        }
                    );
                }

                // Notify each affected talent exactly once
                for (const app of activeApplications) {
                    const existingNotif = await Notification.findOne({
                        recipient: app.talentId,
                        referenceId: opportunity._id,
                        type: "opportunity_cancelled"
                    });
                    if (!existingNotif) {
                        await notifyUser({
                            recipientId: app.talentId,
                            type: "opportunity_cancelled",
                            title: "Opportunity Cancelled",
                            message: `The opportunity "${opportunity.title}" has been cancelled by the organization.`,
                            referenceId: opportunity._id,
                            referenceType: "Opportunity",
                            sendEmailAlert: true
                        });
                    }
                }

                // Resolve org
                let org = (opportunity as any).organizationId ? await Organization.findById((opportunity as any).organizationId) : null;
                if (!org && opportunity.projectId) {
                    const project = await Project.findById(opportunity.projectId);
                    if (project?.organizationId) {
                        org = await Organization.findById(project.organizationId);
                    }
                }

                // Notify organization user exactly once
                if (org && org.userId) {
                    const existingOrgNotif = await Notification.findOne({
                        recipient: org.userId,
                        referenceId: opportunity._id,
                        type: "opportunity_cancelled"
                    });
                    if (!existingOrgNotif) {
                        await notifyUser({
                            recipientId: org.userId,
                            type: "opportunity_cancelled",
                            title: "Opportunity Cancellation Approved",
                            message: `Your cancellation request for opportunity "${opportunity.title}" has been approved.${note ? ` Note: ${note}` : ""}`,
                            referenceId: opportunity._id,
                            referenceType: "Opportunity",
                            sendEmailAlert: true
                        });
                    }
                }
            }
        } else {
            const isExpired = (opportunity as any).applicationDeadline && new Date((opportunity as any).applicationDeadline) < new Date();
            opportunity.status = (isExpired ? "closed" : (opportunity.statusBeforeCancellationRequest || "published")) as any;
            opportunity.cancellationReviewedAt = new Date();
            opportunity.cancellationReviewedBy = req.user?.userId as any;

            if (!opportunity.cancellationRequest) {
                opportunity.cancellationRequest = {
                    reason: opportunity.cancellationReason || "Cancellation requested",
                    requestedAt: opportunity.cancellationRequestedAt || opportunity.updatedAt || new Date(),
                    decision: "declined"
                };
            }
            opportunity.cancellationRequest.decision = "declined";
            opportunity.cancellationRequest.decidedBy = req.user?.userId as any;
            opportunity.cancellationRequest.decidedAt = new Date();
            opportunity.cancellationRequest.declineReason = declineNote;
            opportunity.cancellationRequest.adminNote = declineNote;

            if (!alreadyProcessed) {
                // Resolve org
                let org = (opportunity as any).organizationId ? await Organization.findById((opportunity as any).organizationId) : null;
                if (!org && opportunity.projectId) {
                    const project = await Project.findById(opportunity.projectId);
                    if (project?.organizationId) {
                        org = await Organization.findById(project.organizationId);
                    }
                }

                // Notify organization of rejection with decline reason
                if (org && org.userId) {
                    await notifyUser({
                        recipientId: org.userId,
                        type: "opportunity_cancellation_reviewed",
                        title: "Opportunity Cancellation Request Rejected",
                        message: `Your cancellation request for opportunity "${opportunity.title}" was not approved by administration. Reason: ${declineNote}. The opportunity remains active.`,
                        referenceId: opportunity._id,
                        referenceType: "Opportunity",
                        sendEmailAlert: true
                    });
                }
            }
        }

        if (!alreadyProcessed) {
            await opportunity.save();

            await logAdminAction({
                adminId: (req.user?.userId as any),
                action: `CANCELLATION_${normalizedAction.toUpperCase()}`,
                targetType: "Opportunity",
                targetId: opportunity._id,
                details: `Cancellation request ${normalizedAction}d. Reason: ${note || declineNote}. Applications affected: ${affectedCount}`
            });
        }

        res.status(200).json({
            success: true,
            message: `Cancellation request ${normalizedAction}d successfully`,
            opportunity,
            applicationsAffected: affectedCount
        });
    } catch (error: any) {
        console.error("Review cancellation error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while reviewing cancellation" });
    }
};

export const completeOpportunity = async (req: Request, res: Response): Promise<any> => {
    try {
        const opportunityId = req.params.opportunityId || req.params.id;
        const opportunity = await Opportunity.findById(opportunityId);
        if (!opportunity) {
            return res.status(404).json({ success: false, message: "Opportunity not found" });
        }

        opportunity.status = "completed";
        opportunity.completedAt = new Date();
        opportunity.completionRequested = false;
        await opportunity.save();

        // Delete temporary shortlists for this completed opportunity
        await ProjectShortlist.deleteMany({ opportunityId: opportunity._id });

        await logAdminAction({
            adminId: (req.user?.userId as any),
            action: "COMPLETE_OPPORTUNITY",
            targetType: "Opportunity",
            targetId: opportunity._id,
            details: `Opportunity completed and closed: ${opportunity.title}`
        });

        // Notify organization owner
        const org = await Organization.findById((opportunity as any).organizationId);
        if (org) {
            await notifyUser({
                recipientId: org.userId,
                type: "opportunity_status",
                title: "Opportunity Completed",
                message: `Your opportunity "${opportunity.title}" has been successfully completed by Vismaya Admin.`
            });
        }

        res.status(200).json({
            success: true,
            message: "Opportunity marked as completed successfully",
            opportunity
        });
    } catch (error: any) {
        console.error("Complete opportunity error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while completing opportunity" });
    }
};

// --- REPORTS MANAGEMENT ---

export const getReports = async (req: Request, res: Response): Promise<any> => {
    try {
        const { status, targetType, page = 1, limit = 50 } = req.query;
        const filter: any = {};
        if (status && status !== "ALL") filter.status = status;
        if (targetType) filter.targetType = targetType;

        const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 100);
        const skip = (pageNum - 1) * limitNum;

        const [reports, total] = await Promise.all([
            Report.find(filter)
                .populate("reporterId", "name email role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Report.countDocuments(filter)
        ]);

        const mediaTargetIds = reports.filter(r => r.targetType === "MediaItem").map(r => r.targetId);
        const oppTargetIds = reports.filter(r => r.targetType === "Opportunity").map(r => r.targetId);

        const [mediaItems, oppItems] = await Promise.all([
            mediaTargetIds.length > 0 ? MediaItem.find({ _id: { $in: mediaTargetIds } }).populate("owner", "name email").lean() : [],
            oppTargetIds.length > 0 ? Opportunity.find({ _id: { $in: oppTargetIds } }).select("title role location status").lean() : []
        ]);

        const mediaMap = new Map((mediaItems as any[]).map(m => [m._id.toString(), m]));
        const oppMap = new Map((oppItems as any[]).map(o => [o._id.toString(), o]));

        const enrichedReports = reports.map((r: any) => {
            let targetPreview = null;
            if (r.targetType === "MediaItem") {
                const m = mediaMap.get(r.targetId.toString());
                if (m) {
                    targetPreview = {
                        url: m.url,
                        thumbnailUrl: m.thumbnailUrl || m.url,
                        type: m.mediaType || m.category || "Media",
                        title: m.title || "Media Item",
                        moderationState: m.moderationState,
                        ownerName: (m.owner as any)?.name || "Talent"
                    };
                }
            } else if (r.targetType === "Opportunity") {
                const o = oppMap.get(r.targetId.toString());
                if (o) {
                    targetPreview = {
                        title: o.title,
                        role: o.role,
                        location: o.location,
                        status: o.status
                    };
                }
            }
            return {
                ...r,
                targetPreview
            };
        });

        res.status(200).json({
            success: true,
            count: enrichedReports.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            reports: enrichedReports,
            data: enrichedReports
        });
    } catch (error: any) {
        console.error("Get reports error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching reports" });
    }
};

export const reviewReport = async (req: Request, res: Response): Promise<any> => {
    try {
        const reportId = req.params.reportId || req.params.id;
        const { action, resolutionNotes, mediaAction } = req.body; // "resolve" or "dismiss", mediaAction: "remove" | "restrict"

        if (!["resolve", "dismiss", "resolved", "dismissed"].includes(action)) {
            return res.status(400).json({ success: false, message: "Action must be resolve or dismiss" });
        }

        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }

        const statusMapped = action.startsWith("resolve") ? "resolved" : "dismissed";
        report.status = statusMapped;
        report.adminNotes = resolutionNotes || "";
        report.resolvedAt = new Date();
        report.resolvedBy = req.user?.userId as any;
        await report.save();

        // If resolving a media report with an action (remove or restrict)
        if (statusMapped === "resolved" && report.targetType === "MediaItem") {
            const effectiveMediaAction = mediaAction || (action === "resolve" ? "remove" : null);
            if (effectiveMediaAction === "remove" || effectiveMediaAction === "restrict") {
                const media = await MediaItem.findById(report.targetId);
                if (media) {
                    media.moderationState = effectiveMediaAction === "remove" ? "removed" : "restricted";
                    media.moderatedAt = new Date();
                    media.moderatedBy = req.user?.userId as any;
                    media.moderationNotes = resolutionNotes || `Report ${report._id} resolved with ${effectiveMediaAction}`;
                    await media.save();

                    // Notify content owner if removed
                    if (effectiveMediaAction === "remove") {
                        try {
                            await Notification.create({
                                recipient: media.owner,
                                type: "account_status",
                                title: "Content Removed Following User Report",
                                message: `Your media item "${media.title || 'Portfolio Item'}" was removed following a community report review. Reason: ${resolutionNotes || "Violated community guidelines"}`,
                                referenceId: media._id,
                                referenceType: "System",
                                isRead: false
                            });
                        } catch (notifErr: any) {
                            console.warn("Owner notification warning:", notifErr?.message);
                        }
                    }
                }
            }
        }

        // Notify reporter that report was reviewed (no outcome details beyond "reviewed")
        try {
            await Notification.create({
                recipient: report.reporterId,
                type: "system",
                title: "Report Reviewed",
                message: "Thank you for helping keep Vismaya safe. Your report has been reviewed by our moderation team.",
                referenceId: report._id,
                referenceType: "System",
                isRead: false
            });
        } catch (notifErr: any) {
            console.warn("Reporter notification warning:", notifErr?.message);
        }

        await logAdminAction({
            adminId: (req.user?.userId as any),
            action: `REPORT_${statusMapped.toUpperCase()}`,
            targetType: "Report",
            targetId: report._id,
            details: `Report ${statusMapped}. Notes: ${resolutionNotes || "None"}`
        });

        res.status(200).json({
            success: true,
            message: `Report ${statusMapped} successfully`,
            report
        });
    } catch (error: any) {
        console.error("Review report error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while reviewing report" });
    }
};

// --- AUDITIONS QUEUE & REVIEW ---

export const getPendingAuditions = async (req: Request, res: Response): Promise<any> => {
    try {
        const { page = 1, limit = 50, status, all } = req.query;
        const filter: any = {};
        if (String(all) === "true") {
            // No approval filter, return all
        } else if (status && status !== "ALL") {
            const s = String(status).toLowerCase().replace(/\s+/g, "_");
            if (s === "requested" || s === "needs_relay" || s.includes("relay_request")) {
                filter.status = "requested";
                filter.vismayaApproval = "pending";
            } else if (s === "relayed_to_talent" || s === "relayed") {
                filter.status = "requested";
                filter.vismayaApproval = "approved";
            } else if (s.includes("self_tape") || s.includes("submitted")) {
                filter.status = { $in: ["submitted", "self_tape_received", "self_tape_submitted"] };
            } else if (s.includes("forward")) {
                filter.status = "forwarded_to_org";
            } else if (s.includes("reject")) {
                filter.status = "rejected";
            } else {
                filter.status = s;
            }
        } else {
            // Default pending queue: auditions where vismayaApproval is pending OR status is submitted
            filter.$or = [{ vismayaApproval: "pending" }, { status: "submitted" }];
        }

        const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 100);
        const skip = (pageNum - 1) * limitNum;

        const [auditions, total] = await Promise.all([
            Audition.find(filter)
                .populate("talentId", "name email mobile")
                .populate("organizationId", "organizationName")
                .populate("opportunityId", "title role location remuneration")
                .populate("projectId", "projectName")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Audition.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            count: auditions.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            auditions
        });
    } catch (error: any) {
        console.error("Get pending auditions error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch pending auditions" });
    }
};

export const reviewAudition = async (req: Request, res: Response): Promise<any> => {
    try {
        const auditionId = req.params.auditionId || req.params.id;
        const { action, scriptUrl, rejectionReason } = req.body; // "approve" or "reject"

        const audition = await Audition.findById(auditionId);
        if (!audition) {
            return res.status(404).json({ success: false, message: "Audition not found" });
        }

        const isSelfTapeReview = audition.status === "submitted" || !!audition.selfTapeSubmission?.submittedAt;

        if (action === "approve") {
            audition.vismayaApproval = "approved";
            audition.vismayaReviewedBy = req.user?.userId as any;
            audition.vismayaReviewedAt = new Date();
            if (scriptUrl) {
                audition.scriptUrl = scriptUrl;
            }

            if (isSelfTapeReview) {
                audition.status = "forwarded_to_org";
                await audition.save();

                await logAdminAction({
                    adminId: (req.user?.userId as any),
                    action: "AUDITION_SELF_TAPE_APPROVE",
                    targetType: "Audition",
                    targetId: audition._id,
                    details: `Self-tape approved and forwarded to organization for audition ${audition._id}`,
                    req
                });

                const opp = await Opportunity.findById(audition.opportunityId);
                const roleStr = audition.role || opp?.role || "Role";
                const titleStr = opp?.title || "Opportunity";

                // Notify Talent
                await notifyUser({
                    recipientId: audition.talentId,
                    type: "audition_selftape_approved",
                    title: "Self-Tape Approved",
                    message: `Your self-tape for ${roleStr} in "${titleStr}" has been approved by Vismaya and relayed to the casting team.`,
                    referenceId: audition._id,
                    referenceType: "Audition",
                    sendEmailAlert: true
                });

                // Notify Organization
                const org = await Organization.findById(audition.organizationId);
                if (org) {
                    await notifyUser({
                        recipientId: org.userId,
                        type: "audition_selftape_relayed",
                        title: "Self-Tape Ready for Review",
                        message: `A self-tape submission for ${roleStr} in "${titleStr}" has been approved and is ready for your review.`,
                        referenceId: audition._id,
                        referenceType: "Audition",
                        sendEmailAlert: true
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Self-tape approved and forwarded to organization",
                    audition
                });
            } else {
                await audition.save();

                await logAdminAction({
                    adminId: (req.user?.userId as any),
                    action: "AUDITION_APPROVE",
                    targetType: "Audition",
                    targetId: audition._id,
                    details: `Audition approved for application ${audition.applicationId}`,
                    req
                });

                // Notify talent via email + in-app per U1
                const opp = await Opportunity.findById(audition.opportunityId);
                await notifyUser({
                    recipientId: audition.talentId,
                    type: "audition_invitation",
                    title: `Audition Invitation: ${audition.type.replace(/_/g, " ")}`,
                    message: `You have received an audition request for "${opp?.title || 'Opportunity'}".`,
                    referenceId: audition._id,
                    referenceType: "Audition",
                    sendEmailAlert: true,
                    emailSubject: `Audition Invitation: ${opp?.title || 'Opportunity'}`
                });

                return res.status(200).json({
                    success: true,
                    message: "Audition approved and invitation sent to talent",
                    audition
                });
            }
        } else {
            if (isSelfTapeReview) {
                const finalReason = (rejectionReason || req.body?.reason || req.body?.adminNote || "").trim();
                if (!finalReason || finalReason.length < 10) {
                    return res.status(400).json({
                        success: false,
                        message: "Rejection reason is required and must be at least 10 characters"
                    });
                }

                audition.status = "rejected";
                audition.vismayaApproval = "rejected";
                audition.vismayaReviewedBy = req.user?.userId as any;
                audition.vismayaReviewedAt = new Date();
                audition.vismayaRejectionReason = finalReason;
                await audition.save();

                await logAdminAction({
                    adminId: (req.user?.userId as any),
                    action: "AUDITION_SELF_TAPE_REJECT",
                    targetType: "Audition",
                    targetId: audition._id,
                    details: `Self-tape rejected. Reason: ${finalReason}`,
                    req
                });

                const opp = await Opportunity.findById(audition.opportunityId);
                const roleStr = audition.role || opp?.role || "Role";
                const titleStr = opp?.title || "Opportunity";

                // Notify Talent
                await notifyUser({
                    recipientId: audition.talentId,
                    type: "audition_selftape_rejected",
                    title: "Self-Tape Rejected",
                    message: `Your self-tape submission for ${roleStr} in "${titleStr}" was rejected by Vismaya moderation. Reason: ${finalReason}`,
                    referenceId: audition._id,
                    referenceType: "Audition",
                    sendEmailAlert: true
                });

                return res.status(200).json({
                    success: true,
                    message: "Self-tape rejected. Talent notified.",
                    audition
                });
            } else {
                audition.vismayaApproval = "rejected";
                audition.vismayaReviewedBy = req.user?.userId as any;
                audition.vismayaReviewedAt = new Date();
                audition.vismayaRejectionReason = rejectionReason || "Does not meet guidelines";
                audition.status = "cancelled";
                await audition.save();

                await logAdminAction({
                    adminId: (req.user?.userId as any),
                    action: "AUDITION_REJECT",
                    targetType: "Audition",
                    targetId: audition._id,
                    details: `Audition rejected. Reason: ${audition.vismayaRejectionReason}`,
                    req
                });

                // Notify organization
                const org = await Organization.findById(audition.organizationId);
                if (org) {
                    await notifyUser({
                        recipientId: org.userId,
                        type: "audition_rejected",
                        title: "Audition Request Rejected",
                        message: `Your audition request was rejected by Vismaya moderation. Reason: ${audition.vismayaRejectionReason}`,
                        referenceId: audition._id,
                        referenceType: "Audition"
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Audition request rejected",
                    audition
                });
            }
        }
    } catch (error: any) {
        console.error("Review audition error:", error);
        res.status(500).json({ success: false, message: "Failed to review audition" });
    }
};

export const relayAuditionRequest = async (req: Request, res: Response): Promise<any> => {
    try {
        const auditionId = req.params.auditionId || req.params.id;
        const audition = await Audition.findById(auditionId);
        if (!audition) {
            return res.status(404).json({ success: false, message: "Audition not found" });
        }

        audition.vismayaApproval = "approved";
        audition.vismayaReviewedBy = req.user?.userId as any;
        audition.vismayaReviewedAt = new Date();
        await audition.save();

        await logAdminAction({
            adminId: req.user?.userId as any,
            action: "AUDITION_REQUEST_RELAY",
            targetType: "Audition",
            targetId: audition._id,
            details: `Audition request approved and relayed to talent for audition ${audition._id}`,
            req
        });

        const opp = await Opportunity.findById(audition.opportunityId);
        const dateStr = audition.deadline
            ? new Date(audition.deadline).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
            : "TBD";

        const notifTitle = audition.type === "self_tape" ? "Self-Tape Requested" : "Audition Scheduled";
        const notifMessage = audition.type === "self_tape"
            ? `Self-tape requested for ${audition.role || opp?.role || 'Role'} in "${opp?.title || 'Opportunity'}". Submit by ${dateStr}.${audition.scriptUrl ? ` Script Sides: ${audition.scriptUrl}.` : ""}${audition.instructions ? ` Instructions: ${audition.instructions}` : ""}`
            : `Audition scheduled for ${audition.role || opp?.role || 'Role'} in "${opp?.title || 'Opportunity'}".`;

        await notifyUser({
            recipientId: audition.talentId,
            type: "audition_invitation",
            title: notifTitle,
            message: notifMessage,
            referenceId: audition._id,
            referenceType: "Audition",
            sendEmailAlert: true,
            emailSubject: notifTitle
        });

        return res.status(200).json({
            success: true,
            message: "Audition request relayed to talent successfully",
            audition
        });
    } catch (error: any) {
        console.error("Relay audition request error:", error);
        res.status(500).json({ success: false, message: "Failed to relay audition request" });
    }
};

export const rejectAuditionRequest = async (req: Request, res: Response): Promise<any> => {
    try {
        const auditionId = req.params.auditionId || req.params.id;
        const { reason, rejectionReason } = req.body;
        const finalReason = (reason || rejectionReason || "").trim();

        if (!finalReason) {
            return res.status(400).json({
                success: false,
                message: "Rejection reason is required"
            });
        }

        const audition = await Audition.findById(auditionId);
        if (!audition) {
            return res.status(404).json({ success: false, message: "Audition not found" });
        }

        audition.vismayaApproval = "rejected";
        audition.status = "rejected";
        audition.vismayaReviewedBy = req.user?.userId as any;
        audition.vismayaReviewedAt = new Date();
        audition.vismayaRejectionReason = finalReason;
        await audition.save();

        await logAdminAction({
            adminId: req.user?.userId as any,
            action: "AUDITION_REQUEST_REJECT",
            targetType: "Audition",
            targetId: audition._id,
            details: `Audition request rejected. Reason: ${finalReason}`,
            req
        });

        const org = await Organization.findById(audition.organizationId);
        if (org) {
            await notifyUser({
                recipientId: org.userId,
                type: "audition_rejected",
                title: "Audition Request Rejected",
                message: `Your audition request was rejected by Vismaya moderation. Reason: ${finalReason}`,
                referenceId: audition._id,
                referenceType: "Audition",
                sendEmailAlert: true
            });
        }

        return res.status(200).json({
            success: true,
            message: "Audition request rejected",
            audition
        });
    } catch (error: any) {
        console.error("Reject audition request error:", error);
        res.status(500).json({ success: false, message: "Failed to reject audition request" });
    }
};

// --- REAPPLICATIONS ---

export const getReapplicationRequests = async (req: Request, res: Response): Promise<any> => {
    try {
        const applications = await Application.find({
            status: "withdrawn",
            reapplicationRequested: true,
            reapplicationReviewedAt: { $exists: false }
        }).populate("talentId", "name email").populate("opportunityId", "title").sort({ reapplicationRequestedAt: -1 });

        res.status(200).json({ success: true, count: applications.length, applications });
    } catch (error: any) {
        console.error("Get reapplication requests error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching reapplication requests" });
    }
};

export const reviewReapplication = async (req: Request, res: Response): Promise<any> => {
    try {
        const { applicationId } = req.params;
        const { action, decisionNotes } = req.body; // "approve" or "reject"

        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        application.reapplicationApproved = action === "approve";
        application.reapplicationReviewedAt = new Date();
        application.reapplicationReviewedBy = req.user?.userId as any;
        application.reapplicationDecisionNotes = decisionNotes || "";

        // If approved, delete old withdrawn record so talent can apply fresh
        if (action === "approve") {
            await Application.deleteOne({ _id: application._id });
        } else {
            await application.save();
        }

        await logAdminAction({
            adminId: (req.user?.userId as any),
            action: `REAPPLICATION_${action.toUpperCase()}`,
            targetType: "application",
            targetId: application._id,
            details: `Reapplication ${action}d. Notes: ${decisionNotes || "None"}`
        });

        res.status(200).json({ success: true, message: `Reapplication request ${action}d successfully` });
    } catch (error: any) {
        console.error("Review reapplication error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while reviewing reapplication" });
    }
};

// --- VERIFICATIONS ---

export const getPendingVerifications = async (req: Request, res: Response): Promise<any> => {
    try {
        const { verificationType, department, status } = req.query;
        const filter: any = {};
        if (status && status !== "all") {
            filter.status = status;
        } else if (!status) {
            filter.status = "pending";
        }
        if (verificationType && verificationType !== "all") {
            filter.verificationType = verificationType;
        }
        if (department && department !== "all") {
            filter.department = department;
        }

        const verifications = await Verification.find(filter)
            .populate("userId", "name email role")
            .sort({ submittedAt: -1 })
            .lean();

        res.status(200).json({ success: true, count: verifications.length, verifications });
    } catch (error: any) {
        console.error("Get pending verifications error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching verifications" });
    }
};

export const reviewVerification = async (req: Request, res: Response): Promise<any> => {
    try {
        const { verificationId } = req.params;
        const { action: inputAction, status: inputStatus, decision, notes, rejectionReason } = req.body;

        // Normalize action from various client payloads
        let action = inputAction || decision;
        if (!action && inputStatus) {
            if (inputStatus === "verified" || inputStatus === "approved") {
                action = "approve";
            } else if (inputStatus === "rejected") {
                action = "reject";
            } else if (inputStatus === "request_more_info" || inputStatus === "more_info_needed") {
                action = "request_more_info";
            }
        }

        if (!action || !["approve", "reject", "request_more_info"].includes(action)) {
            return res.status(400).json({
                success: false,
                message: "Invalid action. Must be 'approve', 'reject', or 'request_more_info'."
            });
        }

        const verification = await Verification.findById(verificationId);
        if (!verification) {
            return res.status(404).json({ success: false, message: "Verification record not found" });
        }

        // Rule for rejected items: Cannot approve a rejected verification directly
        if (verification.status === "rejected" && action === "approve") {
            return res.status(400).json({
                success: false,
                message: "Cannot approve a rejected verification. A new verification request must be submitted."
            });
        }

        if (verification.status === "verified" && action === "approve") {
            return res.status(400).json({
                success: false,
                message: "Verification is already approved."
            });
        }

        if (!verification.userId) {
            return res.status(400).json({
                success: false,
                message: "User account not found for this verification record."
            });
        }

        const user = await User.findById(verification.userId);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User account no longer exists for this verification record."
            });
        }

        const adminUserId = req.user?.userId || (req.user as any)?._id;

        if (action === "approve") {
            // T9: Professional verification requirements check
            if (verification.verificationType === "professional") {
                const profile = await TalentProfile.findOne({ userId: verification.userId });
                const liveMediaCount = await MediaItem.countDocuments({ owner: verification.userId, moderationState: "live" });
                const creditsCount = profile?.credits?.length || 0;

                if (profile?.careerStage === "aspiring" && creditsCount === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Aspiring talent with zero credits cannot be granted professional verification."
                    });
                }

                if (creditsCount < 1 || liveMediaCount < 1) {
                    return res.status(400).json({
                        success: false,
                        message: "Professional verification requires at least 1 credit and 1 live portfolio media item."
                    });
                }
            }

            if (verification.verificationType === "organization_business") {
                const org = await Organization.findOne({
                    $or: [{ userId: verification.userId }, { _id: verification.userId }]
                });
                if (!org) {
                    return res.status(400).json({
                        success: false,
                        message: "Organization record not found for this verification."
                    });
                }

                await Organization.findByIdAndUpdate(org._id, {
                    verificationState: "verified",
                    status: "active",
                    "verificationStatus.businessVerified": true,
                    isVerified: true
                });
                await User.findByIdAndUpdate(verification.userId, { status: "active", isVerified: true });
            }

            verification.status = "verified";
            (verification as any).verifiedAt = new Date();
            (verification as any).verifiedBy = adminUserId;
            (verification as any).reviewNotes = notes || "";
            verification.rejectionReason = undefined;
            verification.moreInfoRequested = false;

            await TalentProfile.findOneAndUpdate(
                { userId: verification.userId },
                {
                    isVerified: true,
                    verifiedAt: new Date(),
                    badgeType: "verified"
                }
            );

            await notifyUser({
                recipientId: verification.userId,
                type: "verification_update",
                title: "Verification Approved",
                message: `Your ${verification.verificationType || "account"} verification has been approved by Vismaya Admin.`
            });
        } else if (action === "request_more_info") {
            // Keep status within schema enum ["pending", "verified", "rejected", "suspended"]
            verification.status = "pending";
            verification.moreInfoRequested = true;
            verification.moreInfoNotes = notes || "Additional documentation required.";
            (verification as any).reviewNotes = notes || "Additional documentation required.";

            await notifyUser({
                recipientId: verification.userId,
                type: "verification_update",
                title: "More Verification Information Requested",
                message: notes || "Vismaya Admin requested additional verification documents to complete your review."
            });
        } else {
            verification.status = "rejected";
            (verification as any).verifiedAt = undefined;
            (verification as any).verifiedBy = adminUserId;
            (verification as any).reviewNotes = notes || "";
            verification.rejectionReason = rejectionReason || notes || "Documents insufficient";
            verification.moreInfoRequested = false;

            if (verification.verificationType === "organization_business") {
                await Organization.findOneAndUpdate(
                    { $or: [{ userId: verification.userId }, { _id: verification.userId }] },
                    {
                        verificationState: "rejected",
                        status: "rejected",
                        isVerified: false
                    }
                );
            }

            await notifyUser({
                recipientId: verification.userId,
                type: "verification_update",
                title: "Verification Not Approved",
                message: `Your verification request was not approved. Reason: ${rejectionReason || notes || "Documents provided were insufficient."}`
            });
        }

        await verification.save();

        await logAdminAction({
            adminId: adminUserId,
            action: `VERIFICATION_${action.toUpperCase()}`,
            targetType: "Verification",
            targetId: verification._id,
            details: `Verification ${action}d for user ${verification.userId}`
        });

        res.status(200).json({ success: true, message: `Verification ${action}d successfully`, verification });
    } catch (error: any) {
        console.error("Review verification error:", error?.message, error?.stack);
        if (error?.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: `Validation failed: ${Object.keys(error.errors || {}).join(", ")}`
            });
        }
        if (error?.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: `Invalid identifier format: ${error.path}`
            });
        }
        res.status(500).json({ success: false, message: "Something went wrong while reviewing verification" });
    }
};

// --- CONTENT MODERATION ---

/**
 * Reverted to return ONLY items needing review per Spec
 * GET /api/admin/media/pending
 */
export const getPendingMedia = async (req: Request, res: Response): Promise<any> => {
    try {
        const media = await MediaItem.find({
            moderationState: { $in: ["admin_review", "uploaded", "restricted"] }
        })
            .populate("owner", "name email role")
            .sort({ createdAt: -1 })
            .lean();

        // Enrich with owner stageName / vismayaId
        const ownerIds = media.map((m: any) => m.owner?._id || m.owner).filter(Boolean);
        const profiles = await TalentProfile.find({ userId: { $in: ownerIds } })
            .select("userId stageName vismayaId")
            .lean();
        const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

        const enrichedMedia = media.map((m: any) => {
            const ownerIdStr = (m.owner?._id || m.owner || "").toString();
            const prof = profileMap.get(ownerIdStr);
            const ownerName = prof?.stageName || m.owner?.name || "Talent";
            return {
                ...m,
                ownerName,
                ownerVismayaId: prof?.vismayaId || "",
                talentName: ownerName
            };
        });

        res.status(200).json({ success: true, count: enrichedMedia.length, media: enrichedMedia, data: enrichedMedia });
    } catch (error: any) {
        console.error("Get pending media error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching media moderation queue" });
    }
};

/**
 * Serves all moderation tabs (Pending, Approved, Rejected, All) with accurate per-state counts
 * GET /api/admin/media
 */
export const getAdminMedia = async (req: Request, res: Response): Promise<any> => {
    try {
        const { state, page = 1, limit = 50 } = req.query;
        const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 100);
        const skip = (pageNum - 1) * limitNum;

        let filter: any = {};
        const stateStr = String(state || "").toLowerCase().trim();

        if (stateStr === "live" || stateStr === "approved") {
            filter.moderationState = "live";
        } else if (stateStr === "pending" || stateStr === "admin_review") {
            filter.moderationState = { $in: ["admin_review", "uploaded", "restricted"] };
        } else if (stateStr === "restricted") {
            filter.moderationState = "restricted";
        } else if (stateStr === "removed" || stateStr === "rejected") {
            filter.moderationState = { $in: ["removed", "restricted"] };
        } else if (stateStr === "all" || !stateStr) {
            filter = {};
        }

        const [items, totalFiltered, pendingCount, approvedCount, rejectedCount, allCount] = await Promise.all([
            MediaItem.find(filter)
                .populate("owner", "name email role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            MediaItem.countDocuments(filter),
            MediaItem.countDocuments({ moderationState: { $in: ["admin_review", "uploaded", "restricted"] } }),
            MediaItem.countDocuments({ moderationState: "live" }),
            MediaItem.countDocuments({ moderationState: { $in: ["removed", "restricted"] } }),
            MediaItem.countDocuments({})
        ]);

        const ownerIds = items.map((m: any) => m.owner?._id || m.owner).filter(Boolean);
        const profiles = await TalentProfile.find({ userId: { $in: ownerIds } })
            .select("userId stageName vismayaId currentCity")
            .lean();
        const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

        const enrichedItems = items.map((m: any) => {
            const ownerIdStr = (m.owner?._id || m.owner || "").toString();
            const prof = profileMap.get(ownerIdStr);
            const ownerName = prof?.stageName || m.owner?.name || "Talent";
            return {
                ...m,
                ownerName,
                ownerVismayaId: prof?.vismayaId || "",
                talentName: ownerName
            };
        });

        res.status(200).json({
            success: true,
            media: enrichedItems,
            data: enrichedItems,
            count: enrichedItems.length,
            total: totalFiltered,
            page: pageNum,
            totalPages: Math.ceil(totalFiltered / limitNum),
            counts: {
                pending: pendingCount,
                approved: approvedCount,
                rejected: rejectedCount,
                all: allCount
            },
            pendingCount,
            approvedCount,
            rejectedCount,
            allCount
        });
    } catch (error: any) {
        console.error("Get admin media error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching admin media" });
    }
};

export const reviewMediaItem = async (req: Request, res: Response): Promise<any> => {
    try {
        const { mediaId } = req.params;
        const rawAction = String(req.body.action || "").toLowerCase().trim();
        const action = rawAction === "remove" ? "reject" : rawAction; // Normalize "remove" -> "reject"
        const moderationReason = String(req.body.moderationReason ?? req.body.notes ?? req.body.reason ?? "").trim();

        if (!["approve", "reject", "restrict"].includes(action)) {
            return res.status(400).json({ success: false, message: "Action must be approve, reject, remove, or restrict" });
        }

        if (action === "reject" && !moderationReason) {
            return res.status(400).json({ success: false, message: "Moderation reason is required to reject or remove content" });
        }

        const media = await MediaItem.findById(mediaId);
        if (!media) {
            return res.status(404).json({ success: false, message: "Media item not found" });
        }

        const stateMap: any = {
            approve: "live",
            reject: "removed",
            restrict: "restricted"
        };

        media.moderationState = stateMap[action];
        media.moderatedAt = new Date();
        media.moderatedBy = req.user?.userId as any;
        media.moderationNotes = moderationReason || "";
        await media.save();

        await logAdminAction({
            adminId: (req.user?.userId as any),
            action: `MEDIA_MODERATION_${action.toUpperCase()}`,
            targetType: "media",
            targetId: media._id,
            details: `Media ${action}d. Reason: ${moderationReason || "None"}`
        });

        // Notify content owner if removed
        if (action === "reject") {
            try {
                await Notification.create({
                    recipient: media.owner,
                    type: "account_status",
                    title: "Content Removed by Moderation",
                    message: `Your media item "${media.title || 'Portfolio Item'}" was removed during moderation. Reason: ${moderationReason}`,
                    referenceId: media._id,
                    referenceType: "System",
                    isRead: false
                });
            } catch (notifErr: any) {
                console.warn("[reviewMediaItem] Notification warning:", notifErr?.message);
            }
        }

        res.status(200).json({ success: true, message: `Media item ${action === "reject" ? "removed" : action + "d"} successfully`, media });
    } catch (error: any) {
        console.error("Review media error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while reviewing media" });
    }
};

/**
 * Featured Work selection (max 4 per profile - Spec Section 15 & 44)
 */
export const setMediaFeaturedWork = async (req: Request, res: Response): Promise<any> => {
    try {
        const { mediaId } = req.params;
        const rawFeatured = req.body.isFeatured !== undefined ? req.body.isFeatured : req.body.isFeaturedWork;

        if (rawFeatured === undefined || typeof rawFeatured !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isFeatured (boolean) is required"
            });
        }
        const isFeatured = Boolean(rawFeatured);

        const media = await MediaItem.findById(mediaId);
        if (!media) {
            return res.status(404).json({ success: false, message: "Media item not found" });
        }

        const profile = await TalentProfile.findOne({ userId: media.owner });
        if (!profile) {
            return res.status(404).json({ success: false, message: "Talent profile not found for media owner" });
        }

        if (isFeatured) {
            const currentFeaturedCount = await MediaItem.countDocuments({
                owner: media.owner,
                isFeatured: true,
                _id: { $ne: media._id }
            });

            if (currentFeaturedCount >= 4) {
                return res.status(400).json({
                    success: false,
                    message: "Maximum 4 featured works allowed per talent profile (Spec §15)."
                });
            }

            media.isFeatured = true;
            if (!profile.featuredWork.map(id => id.toString()).includes(media._id.toString())) {
                profile.featuredWork.push(media._id as any);
            }
        } else {
            media.isFeatured = false;
            profile.featuredWork = profile.featuredWork.filter(id => id.toString() !== media._id.toString());
        }

        await Promise.all([media.save(), profile.save()]);

        await logAdminAction({
            adminId: (req.user?.userId as any),
            action: isFeatured ? "FEATURE_WORK_APPROVE" : "FEATURE_WORK_REMOVE",
            targetType: "MediaItem",
            targetId: media._id,
            details: `Media item ${media._id} ${isFeatured ? "selected as Featured Work (max 4)" : "unfeatured"}.`
        });

        res.status(200).json({
            success: true,
            message: `Media item ${isFeatured ? "marked as featured" : "unfeatured"} successfully`,
            media,
            featuredCount: profile.featuredWork.length
        });
    } catch (error: any) {
        console.error("Set media featured work error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while updating featured work" });
    }
};

/**
 * Copyright Dispute Management (temporarily hide/restore disputed media - Spec Section 40 & 44)
 */
export const handleCopyrightDispute = async (req: Request, res: Response): Promise<any> => {
    try {
        const { mediaId } = req.params;
        const { disputeState, reason, disputeReason } = req.body; // "disputed", "resolved", "none"
        const effectiveReason = disputeReason || reason;

        if (!["none", "disputed", "resolved"].includes(disputeState)) {
            return res.status(400).json({ success: false, message: "disputeState must be 'none', 'disputed', or 'resolved'" });
        }

        const media = await MediaItem.findById(mediaId);
        if (!media) {
            return res.status(404).json({ success: false, message: "Media item not found" });
        }

        media.disputeState = disputeState;
        if (disputeState === "disputed") {
            media.disputeReason = effectiveReason || "Copyright claim received. Temporarily hidden per spec Section 40.";
            media.moderationState = "restricted";
        } else if (disputeState === "resolved") {
            media.moderationState = "live";
            media.disputeReason = effectiveReason ? `Resolved: ${effectiveReason}` : "Dispute resolved by admin";
        }

        await media.save();

        await logAdminAction({
            adminId: (req.user?.userId as any),
            action: `COPYRIGHT_DISPUTE_${disputeState.toUpperCase()}`,
            targetType: "MediaItem",
            targetId: media._id,
            details: `Copyright dispute updated to '${disputeState}'. Notes: ${effectiveReason || "None"}`
        });

        res.status(200).json({
            success: true,
            message: `Copyright dispute status updated to '${disputeState}'`,
            media,
            mediaItem: media
        });
    } catch (error: any) {
        console.error("Handle copyright dispute error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while updating copyright dispute" });
    }
};

/**
 * Informational Profiles (Spec Section 41 & 44)
 * Vismaya may create informational profiles for selected established/notable professionals only.
 */
export const createInformationalProfile = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            firstName,
            lastName,
            stageName,
            primaryProfession,
            category = "open_talent",
            headline,
            bio,
            profilePhoto,
            currentCity,
            currentState,
            country = "India",
            notableCredits = [],
            isClaimable = true
        } = req.body;

        if (!firstName && !stageName) {
            return res.status(400).json({ success: false, message: "First name or stage name is required" });
        }

        if (!primaryProfession) {
            return res.status(400).json({ success: false, message: "Primary profession is required" });
        }

        // Normalize category enum for TalentProfile
        let resolvedCategory: any = "open_talent";
        const allowedCategories = ["open_talent", "film_and_tv", "voice_over", "dance_and_performing_arts", "crew_and_production"];
        if (allowedCategories.includes(category)) {
            resolvedCategory = category;
        } else if (category === "screen" || category === "film" || category === "television") {
            resolvedCategory = "film_and_tv";
        } else if (category === "voice" || category === "voiceover") {
            resolvedCategory = "voice_over";
        } else if (category === "dance" || category === "theatre") {
            resolvedCategory = "dance_and_performing_arts";
        } else if (category === "crew" || category === "technical") {
            resolvedCategory = "crew_and_production";
        }

        // Generate distinct Vismaya ID
        let vismayaId = "";
        let unique = false;
        let attempts = 0;
        while (!unique && attempts < 10) {
            attempts++;
            const randomDigits = Math.floor(100000 + Math.random() * 900000);
            vismayaId = `VIS-INFO-${randomDigits}`;
            const existing = await TalentProfile.findOne({ vismayaId });
            if (!existing) unique = true;
        }

        // Create virtual placeholder User for informational profile
        const infoEmail = `info-${Date.now()}-${Math.floor(Math.random() * 1000)}@vismaya.placeholder`;
        const user = await User.create({
            name: `${firstName || ""} ${lastName || ""}`.trim() || stageName,
            email: infoEmail,
            password: crypto.randomBytes(24).toString("hex") + "A1!",
            role: "talent",
            status: "active",
            isEmailVerified: true,
            isPaid: true
        });

        const profile = await TalentProfile.create({
            userId: user._id,
            vismayaId,
            firstName,
            lastName,
            stageName,
            headline: headline || `Notable ${primaryProfession}`,
            bio: bio || "Informational profile created by Vismaya Creative Studios.",
            profilePhoto,
            category: resolvedCategory,
            primaryProfession,
            currentCity,
            currentState,
            country,
            credits: (notableCredits || []).map((c: any) => ({
                projectTitle: c.projectTitle || c.title || "Project",
                roleOrDesignation: c.role || c.roleOrDesignation || primaryProfession,
                year: c.year || new Date().getFullYear(),
                projectStatus: "released",
                isVerifiedCredit: true
            })),
            isInformational: true,
            isClaimable: isClaimable !== false,
            status: "approved",
            isProfileApproved: true,
            isVerified: true,
            isSearchable: true,
            profileCompletionPercentage: 80,
            isPaid: true
        });

        await logAdminAction({
            adminId: (req.user?.userId as any),
            action: "CREATE_INFORMATIONAL_PROFILE",
            targetType: "TalentProfile",
            targetId: profile._id,
            details: `Created informational profile for notable professional '${profile.stageName || profile.firstName}' (${vismayaId}). Claimable: ${profile.isClaimable}`
        });

        res.status(201).json({
            success: true,
            message: "Informational profile created successfully",
            profile
        });
    } catch (error: any) {
        console.error("Create informational profile error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while creating informational profile" });
    }
};

export const getInformationalProfiles = async (req: Request, res: Response): Promise<any> => {
    try {
        const { status = "active", archived } = req.query;
        const filter: any = { isInformational: true };
        if (status === "archived" || String(archived) === "true") {
            filter.isArchived = true;
        } else {
            filter.isArchived = { $ne: true };
        }

        const profiles = await TalentProfile.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: profiles.length,
            profiles
        });
    } catch (error: any) {
        console.error("Get informational profiles error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching informational profiles" });
    }
};

export const updateInformationalProfile = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const {
            firstName,
            lastName,
            stageName,
            primaryProfession,
            category,
            headline,
            bio,
            currentCity,
            currentState,
            country,
            notableCredits,
            profilePhoto,
            isClaimable,
            isArchived
        } = req.body;

        const profile = await TalentProfile.findOne({ _id: id, isInformational: true });
        if (!profile) {
            return res.status(404).json({ success: false, message: "Informational profile not found" });
        }

        if (stageName !== undefined) profile.stageName = String(stageName).trim();
        if (firstName !== undefined) profile.firstName = String(firstName).trim();
        if (lastName !== undefined) profile.lastName = String(lastName).trim();

        if (!profile.stageName && !profile.firstName) {
            return res.status(400).json({ success: false, message: "First name or stage name is required" });
        }

        if (primaryProfession !== undefined) {
            const trimmedProfession = String(primaryProfession).trim();
            if (!trimmedProfession) {
                return res.status(400).json({ success: false, message: "Primary profession is required" });
            }
            profile.primaryProfession = trimmedProfession;
        }

        if (category !== undefined) {
            const allowedCategories = ["open_talent", "film_and_tv", "voice_over", "dance_and_performing_arts", "crew_and_production"];
            if (allowedCategories.includes(category)) {
                profile.category = category as any;
            } else if (category === "screen" || category === "film" || category === "television") {
                profile.category = "film_and_tv";
            } else if (category === "voice" || category === "voiceover") {
                profile.category = "voice_over";
            } else if (category === "dance" || category === "theatre") {
                profile.category = "dance_and_performing_arts";
            } else if (category === "crew" || category === "technical") {
                profile.category = "crew_and_production";
            }
        }

        if (headline !== undefined) profile.headline = String(headline).trim();
        if (bio !== undefined) profile.bio = String(bio).trim();
        if (currentCity !== undefined) profile.currentCity = String(currentCity).trim();
        if (currentState !== undefined) profile.currentState = String(currentState).trim();
        if (country !== undefined) profile.country = String(country).trim();
        if (profilePhoto !== undefined) profile.profilePhoto = String(profilePhoto).trim();
        if (isClaimable !== undefined) profile.isClaimable = Boolean(isClaimable);
        if (isArchived !== undefined) {
            profile.isArchived = Boolean(isArchived);
            profile.archivedAt = profile.isArchived ? new Date() : undefined;
        }

        if (Array.isArray(notableCredits)) {
            profile.credits = notableCredits.map((c: any) => ({
                projectTitle: c.projectTitle || c.title || "Project",
                roleOrDesignation: c.role || c.roleOrDesignation || profile.primaryProfession,
                year: c.year || new Date().getFullYear(),
                projectStatus: "released",
                isVerifiedCredit: true
            })) as any;
        }

        await profile.save();

        await logAdminAction({
            adminId: (req.user?.userId as any),
            action: "UPDATE_INFORMATIONAL_PROFILE",
            targetType: "TalentProfile",
            targetId: profile._id,
            details: `Updated informational profile for '${profile.stageName || profile.firstName}' (${profile.vismayaId})`
        });

        res.status(200).json({
            success: true,
            message: "Informational profile updated successfully",
            profile
        });
    } catch (error: any) {
        console.error("Update informational profile error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while updating informational profile" });
    }
};

export const archiveInformationalProfile = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const profile = await TalentProfile.findOne({ _id: id, isInformational: true });
        if (!profile) {
            return res.status(404).json({ success: false, message: "Informational profile not found" });
        }

        profile.isArchived = true;
        profile.archivedAt = new Date();
        await profile.save();

        await logAdminAction({
            adminId: (req.user?.userId as any),
            action: "ARCHIVE_INFORMATIONAL_PROFILE",
            targetType: "TalentProfile",
            targetId: profile._id,
            details: `Archived informational profile '${profile.stageName || profile.firstName}' (${profile.vismayaId})`
        });

        res.status(200).json({
            success: true,
            message: "Informational profile archived successfully",
            profile
        });
    } catch (error: any) {
        console.error("Archive informational profile error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while archiving informational profile" });
    }
};

export const restoreInformationalProfile = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const profile = await TalentProfile.findOne({ _id: id, isInformational: true });
        if (!profile) {
            return res.status(404).json({ success: false, message: "Informational profile not found" });
        }

        profile.isArchived = false;
        profile.archivedAt = undefined;
        await profile.save();

        await logAdminAction({
            adminId: (req.user?.userId as any),
            action: "RESTORE_INFORMATIONAL_PROFILE",
            targetType: "TalentProfile",
            targetId: profile._id,
            details: `Restored informational profile '${profile.stageName || profile.firstName}' (${profile.vismayaId})`
        });

        res.status(200).json({
            success: true,
            message: "Informational profile restored successfully",
            profile
        });
    } catch (error: any) {
        console.error("Restore informational profile error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while restoring informational profile" });
    }
};

// --- TRANSACTIONS & CREDITS ---

export const getPaymentTransactions = async (req: Request, res: Response): Promise<any> => {
    try {
        const { status, packageType, page = 1, limit = 20 } = req.query;
        const filter: any = {};
        if (status) filter.status = status;
        if (packageType) filter.packageType = packageType;

        const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 20, 1), 100);
        const skip = (pageNum - 1) * limitNum;

        const [transactions, total] = await Promise.all([
            PaymentTransaction.find(filter)
                .populate("userId", "name email role")
                .populate("organizationId", "organizationName")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            PaymentTransaction.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            count: transactions.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            transactions
        });
    } catch (error: any) {
        console.error("Get payment transactions error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching transactions" });
    }
};

/**
 * GET /api/admin/credits/ledger
 * Admin: Paginated credit transaction ledger with org-wise balance summary.
 * Filters: organizationId, type, dateFrom, dateTo
 */
export const getAdminCreditLedger = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            organizationId,
            type,
            dateFrom,
            dateTo,
            page = 1,
            limit = 20
        } = req.query;

        const filter: any = {};

        if (organizationId) {
            filter.organizationId = organizationId;
        }

        if (type) {
            filter.type = type;
        }

        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) filter.createdAt.$gte = new Date(String(dateFrom));
            if (dateTo) filter.createdAt.$lte = new Date(String(dateTo));
        }

        const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 20, 1), 100);
        const skip = (pageNum - 1) * limitNum;

        const [rows, total] = await Promise.all([
            CreditTransaction.find(filter)
                .populate("organizationId", "organizationName")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            CreditTransaction.countDocuments(filter)
        ]);

        // Helper to extract clean hex ObjectId string regardless of whether populated
        const getOrgIdStr = (org: any): string | null => {
            if (!org) return null;
            if (typeof org === "object" && org._id) return String(org._id);
            return String(org);
        };

        // Build per-org balance summary from CreditLedger for orgs visible in this page
        const orgIds = [...new Set(rows.map(r => getOrgIdStr(r.organizationId)).filter(Boolean))];
        const ledgers = orgIds.length > 0
            ? await CreditLedger.find({ organizationId: { $in: orgIds } })
                .select("organizationId includedCredits purchasedCredits consumedCredits balance")
            : [];

        const ledgerMap: Record<string, any> = {};
        for (const l of ledgers) {
            const idKey = getOrgIdStr(l.organizationId) || String(l.organizationId);
            ledgerMap[idKey] = {
                includedCredits: l.includedCredits,
                purchasedCredits: l.purchasedCredits,
                consumedCredits: l.consumedCredits,
                balance: l.balance
            };
        }

        const ledgerRows = rows.map(r => {
            const orgIdStr = getOrgIdStr(r.organizationId) || "";
            return {
                _id: r._id,
                organization: r.organizationId,   // populated: { _id, organizationName }
                type: r.type,
                amount: r.amount,
                balanceAfter: r.balanceAfter,
                description: r.description,
                adminId: r.adminId,
                paymentTransactionId: r.paymentTransactionId,
                createdAt: r.createdAt,
                orgBalance: ledgerMap[orgIdStr] || null
            };
        });

        res.status(200).json({
            success: true,
            count: ledgerRows.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            ledger: ledgerRows
        });

    } catch (error: any) {
        console.error("Get admin credit ledger error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching credit ledger" });
    }
};

export const adjustCreditBalance = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, amount, reason } = req.body;

        if (!organizationId || typeof amount !== "number" || amount === 0) {
            return res.status(400).json({
                success: false,
                message: "organizationId and non-zero amount number are required"
            });
        }

        let ledger = await CreditLedger.findOne({ organizationId });
        if (!ledger) {
            ledger = await CreditLedger.create({
                organizationId,
                balance: 0,
                totalPurchased: 0,
                totalConsumed: 0
            } as any);
        }

        const prevBalance = ledger.balance;
        const newBalance = Math.max(0, prevBalance + amount);
        ledger.balance = newBalance;
        if (amount > 0) (ledger as any).totalPurchased += amount;
        await ledger.save();

        await CreditTransaction.create({
            organizationId,
            transactionType: amount > 0 ? "admin_grant" : "admin_deduct",
            amount: Math.abs(amount),
            balanceAfter: newBalance,
            description: reason || `Admin credit adjustment by ${(req.user as any)?.email || "admin"}`
        } as any);

        await logAdminAction({
            adminId: (req.user?.userId as any),
            action: "ADJUST_CREDITS",
            targetType: "organization",
            targetId: organizationId,
            details: `Adjusted credits by ${amount}. Previous: ${prevBalance}, New: ${newBalance}. Reason: ${reason || "None"}`
        });

        res.status(200).json({
            success: true,
            message: "Credit balance adjusted successfully",
            organizationId,
            previousBalance: prevBalance,
            currentBalance: newBalance
        });
    } catch (error: any) {
        console.error("Adjust credits error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while adjusting credits" });
    }
};

// --- COUPON MANAGEMENT ---

export const getCoupons = async (req: Request, res: Response): Promise<any> => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: coupons.length, coupons });
    } catch (error: any) {
        console.error("Get coupons error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching coupons" });
    }
};

export const createCoupon = async (req: Request, res: Response): Promise<any> => {
    try {
        const validation = validateCouponInput(req.body);
        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: validation.errors[0] });
        }

        const { code, discountType, discountValue, minOrderAmount, maxDiscountAmount, applicablePackages, maxUses, validUntil } = req.body;

        const cleanCode = String(code).trim().toUpperCase();
        const existing = await Coupon.findOne({ code: cleanCode });
        if (existing) {
            return res.status(409).json({ success: false, message: "Coupon code already exists" });
        }

        const coupon = await Coupon.create({
            code: cleanCode,
            discountType,
            discountValue,
            minOrderAmount: minOrderAmount || 0,
            maxDiscountAmount,
            applicablePackages: applicablePackages || [],
            maxUses: maxUses || 100,
            validUntil: validUntil ? new Date(validUntil) : undefined,
            createdBy: req.user?.userId
        });

        await logAdminAction({
            adminId: (req.user?.userId as any),
            action: "CREATE_COUPON",
            targetType: "coupon",
            targetId: coupon._id,
            details: `Created coupon ${cleanCode}`
        });

        res.status(201).json({ success: true, message: "Coupon created successfully", coupon });
    } catch (error: any) {
        console.error("Create coupon error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while creating coupon" });
    }
};

export const updateCoupon = async (req: Request, res: Response): Promise<any> => {
    try {
        const { couponId } = req.params;
        const coupon = await Coupon.findById(couponId);
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        const allowedFields = ["discountType", "discountValue", "minOrderAmount", "maxDiscountAmount", "applicablePackages", "maxUses", "validUntil", "isActive"];
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                (coupon as any)[field] = req.body[field];
            }
        }

        await coupon.save();

        res.status(200).json({ success: true, message: "Coupon updated successfully", coupon });
    } catch (error: any) {
        console.error("Update coupon error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while updating coupon" });
    }
};

export const deleteCoupon = async (req: Request, res: Response): Promise<any> => {
    try {
        const { couponId } = req.params;
        await Coupon.findByIdAndDelete(couponId);
        res.status(200).json({ success: true, message: "Coupon deleted successfully" });
    } catch (error: any) {
        console.error("Delete coupon error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while deleting coupon" });
    }
};

// --- DASHBOARD & ANALYTICS ---

export const getDashboardMetrics = async (req: Request, res: Response): Promise<any> => {
    try {
        const infoProfiles = await TalentProfile.find({ isInformational: true }).select("userId");
        const infoUserIds = infoProfiles.map(p => p.userId).filter(Boolean);

        const [
            totalUsers,
            talentCount,
            orgCount,
            pendingUsers,
            verifiedTalentCount,
            activeOrgCount,
            totalOpportunities,
            publishedOpportunities,
            pendingOpportunities,
            pendingCancellations,
            totalApplications,
            totalAuditions,
            pendingAuditionsToRelay,
            selfTapesToForward,
            totalRevenueAgg,
            pendingVerifications,
            itemsNeedingReviewCount,
            openReportsCount,
            categoryAgg,
            cityAgg,
            underReviewApps,
            shortlistedApps,
            selectedApps,
            appMonthlyAgg,
            userMonthlyAgg
        ] = await Promise.all([
            User.countDocuments({ _id: { $nin: infoUserIds } }),
            User.countDocuments({ role: "talent", _id: { $nin: infoUserIds } } as any),
            User.countDocuments({ role: "organization" } as any),
            User.countDocuments({ status: "pending", _id: { $nin: infoUserIds } }),
            User.countDocuments({ role: "talent", status: { $in: ["active", "approved", "verified"] }, _id: { $nin: infoUserIds } } as any),
            User.countDocuments({ role: "organization", status: { $in: ["active", "approved", "verified"] } } as any),
            Opportunity.countDocuments(),
            Opportunity.countDocuments({ status: "published" } as any),
            Opportunity.countDocuments({ status: { $in: ["pending", "under_vismaya_review"] } } as any),
            Opportunity.countDocuments({
                $or: [
                    { "cancellationRequest.decision": "pending" },
                    { status: "cancellation_requested" }
                ]
            } as any),
            Application.countDocuments(),
            Audition.countDocuments(),
            Audition.countDocuments({ status: "requested" }),
            Audition.countDocuments({ status: { $in: ["submitted", "self_tape_received", "self_tape_submitted"] } } as any),
            PaymentTransaction.aggregate([
                { $match: { status: "successful" } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]),
            Verification.countDocuments({ status: "pending" }),
            MediaItem.countDocuments({ moderationState: { $in: ["admin_review", "uploaded", "restricted"] } }),
            Report.countDocuments({ status: { $in: ["pending", "investigating"] } }),
            Project.aggregate([
                { $match: { projectType: { $exists: true, $ne: "" } } },
                { $group: { _id: "$projectType", count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            TalentProfile.aggregate([
                { $match: { currentCity: { $exists: true, $ne: "" }, isInformational: { $ne: true } } },
                { $group: { _id: "$currentCity", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]),
            Application.countDocuments({ status: { $in: ["under_review", "shortlisted", "selected"] } }),
            Application.countDocuments({ status: { $in: ["shortlisted", "selected"] } }),
            Application.countDocuments({ status: "selected" }),
            Application.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" }
                        },
                        count: { $sum: 1 }
                    }
                }
            ]),
            User.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" },
                            role: "$role"
                        },
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        const totalRevenue = totalRevenueAgg[0]?.total || 0;
        const pendingMediaCount = (itemsNeedingReviewCount || 0) + (openReportsCount || 0);

        // Formulate 6-month timeline labels
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const now = new Date();
        const past6Months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            past6Months.push({
                year: d.getFullYear(),
                month: d.getMonth() + 1,
                name: monthNames[d.getMonth()]
            });
        }

        const applicationsMonthly = past6Months.map(m => {
            const found = (appMonthlyAgg || []).find(a => a._id?.year === m.year && a._id?.month === m.month);
            return {
                month: m.name,
                count: found ? found.count : 0
            };
        });

        let cumTalent = 0;
        let cumRecruiter = 0;
        const userGrowth = past6Months.map(m => {
            const tFound = (userMonthlyAgg || []).find(u => u._id?.year === m.year && u._id?.month === m.month && u._id?.role === "talent");
            const rFound = (userMonthlyAgg || []).find(u => u._id?.year === m.year && u._id?.month === m.month && u._id?.role === "organization");
            cumTalent += (tFound ? tFound.count : 0);
            cumRecruiter += (rFound ? rFound.count : 0);
            return {
                label: m.name,
                talent: cumTalent,
                recruiters: cumRecruiter
            };
        });

        const totalCategoryCount = (categoryAgg || []).reduce((sum, c) => sum + c.count, 0) || 1;
        const categories = (categoryAgg && categoryAgg.length > 0)
            ? categoryAgg.map(c => ({
                name: c._id || "Other",
                value: Math.round((c.count / totalCategoryCount) * 100),
                count: c.count
            }))
            : [];

        const topCities = (cityAgg && cityAgg.length > 0)
            ? cityAgg.map(c => ({
                city: c._id,
                count: c.count,
                share: talentCount > 0 ? Math.round((c.count / talentCount) * 100) : 0
            }))
            : [];

        const funnel = [
            { stage: "Applications Submitted", count: totalApplications, percent: 100 },
            { stage: "Under Review", count: underReviewApps, percent: totalApplications > 0 ? Math.round((underReviewApps / totalApplications) * 100) : 0 },
            { stage: "Shortlisted for Audition", count: shortlistedApps, percent: totalApplications > 0 ? Math.round((shortlistedApps / totalApplications) * 100) : 0 },
            { stage: "Final Bookings & Selected", count: selectedApps, percent: totalApplications > 0 ? Math.round((selectedApps / totalApplications) * 100) : 0 }
        ];

        res.status(200).json({
            success: true,
            metrics: {
                users: {
                    total: totalUsers,
                    talent: talentCount,
                    organization: orgCount,
                    pending: pendingUsers,
                    verifiedTalent: verifiedTalentCount,
                    activeOrganization: activeOrgCount
                },
                opportunities: {
                    total: totalOpportunities,
                    published: publishedOpportunities,
                    pendingReview: pendingOpportunities,
                    cancellationRequests: pendingCancellations
                },
                applications: { total: totalApplications },
                auditions: {
                    total: totalAuditions,
                    pendingRelay: pendingAuditionsToRelay,
                    selfTapesToForward: selfTapesToForward
                },
                revenue: { totalINR: totalRevenue },
                moderation: {
                    pendingVerifications,
                    pendingMedia: pendingMediaCount
                },
                analytics: {
                    userGrowth,
                    categories,
                    topCities,
                    funnel,
                    applicationsMonthly
                }
            }
        });
    } catch (error: any) {
        console.error("Dashboard metrics error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while generating dashboard metrics" });
    }
};

export const getAuditLogs = async (req: Request, res: Response): Promise<any> => {
    try {
        const { action, targetType, page = 1, limit = 50 } = req.query;
        const filter: any = {};
        if (action) filter.action = action;
        if (targetType) filter.targetType = targetType;

        const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 100);
        const skip = (pageNum - 1) * limitNum;

        const [logs, total] = await Promise.all([
            AdminAuditLog.find(filter)
                .populate("adminId", "name email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            AdminAuditLog.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            count: logs.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            logs
        });
    } catch (error: any) {
        console.error("Get audit logs error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching audit logs" });
    }
};

export const globalAdminSearch = async (req: Request, res: Response): Promise<any> => {
    try {
        const { q, search } = req.query;
        const queryText = String(q || search || "").trim();

        if (!queryText) {
            return res.status(400).json({ success: false, message: "Search query 'q' is required" });
        }

        // F-06: Cap search query length to 100 characters to prevent ReDoS attacks
        if (queryText.length > 100) {
            return res.status(400).json({ success: false, message: "Search query cannot exceed 100 characters" });
        }

        const escapedQuery = escapeRegex(queryText);
        const regex = new RegExp(escapedQuery, "i");

        const [users, organizations, opportunities, payments, talentProfiles] = await Promise.all([
            User.find({ $or: [{ name: regex }, { email: regex }, { mobile: regex }] }).select("name email role status isPaid createdAt").limit(10).lean(),
            Organization.find({ $or: [{ organizationName: regex }, { organizationType: regex }] }).populate("userId", "name email status").limit(10).lean(),
            Opportunity.find({ $or: [{ title: regex }, { role: regex }, { summary: regex }] }).populate("projectId", "projectName").limit(10).lean(),
            PaymentTransaction.find({ $or: [{ orderId: regex }, { paymentId: regex }, { invoiceNumber: regex }] }).populate("userId", "name email").limit(10).lean(),
            TalentProfile.find({ isInformational: { $ne: true }, $or: [{ vismayaId: regex }, { stageName: regex }, { firstName: regex }, { lastName: regex }, { primaryProfession: regex }] }).select("vismayaId stageName firstName lastName primaryProfession").limit(10).lean()
        ]);

        res.status(200).json({
            success: true,
            query: queryText,
            results: {
                users,
                talentProfiles,
                organizations,
                opportunities,
                payments
            }
        });
    } catch (error: any) {
        console.error("Global admin search error:", error);
        res.status(500).json({ success: false, message: "Something went wrong during admin search" });
    }
};

// --- PROFILE CHANGES & TRENDING MANAGEMENT ---

export const getPendingProfileChanges = async (req: Request, res: Response): Promise<any> => {
    try {
        const profiles = await TalentProfile.find({
            pendingChanges: { $ne: null }
        })
            .populate("userId", "name email mobile")
            .sort({ pendingChangesSubmittedAt: -1 });

        res.status(200).json({
            success: true,
            count: profiles.length,
            profiles
        });
    } catch (error: any) {
        console.error("Get pending profile changes error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching pending profile changes" });
    }
};

export const reviewProfileChange = async (req: Request, res: Response): Promise<any> => {
    try {
        const { profileId } = req.params;
        const { action, rejectionReason } = req.body; // "approve" or "reject"

        const profile = await TalentProfile.findById(profileId);
        if (!profile) {
            return res.status(404).json({ success: false, message: "Talent profile not found" });
        }

        if (!profile.pendingChanges) {
            return res.status(400).json({ success: false, message: "Profile has no pending changes to review" });
        }

        if (action === "approve") {
            const pending = profile.pendingChanges;
            Object.assign(profile, pending);
            profile.pendingChanges = undefined as any;
            profile.pendingChangesSubmittedAt = undefined as any;

            // Recalculate completion and searchability
            const completion = calculateProfileCompletion(profile);
            profile.profileCompletionPercentage = completion;
            const user = await User.findById(profile.userId).select("isPaid status");
            profile.isSearchable = completion >= 60 && !!user?.isPaid && user?.status === "active";

            await profile.save();

            await logAdminAction({
                adminId: (req.user?.userId as any),
                action: "PROFILE_CHANGE_APPROVE",
                targetType: "User",
                targetId: (profile.userId as any),
                details: "Critical profile changes approved and merged into active profile"
            });

            await notifyUser({
                recipientId: profile.userId,
                type: "profile_change",
                title: "Profile Changes Approved",
                message: "Your requested profile updates have been approved by Vismaya Admin and are now live."
            });

            res.status(200).json({
                success: true,
                message: "Profile changes approved successfully",
                profile
            });
        } else {
            profile.pendingChanges = undefined as any;
            profile.pendingChangesSubmittedAt = undefined as any;
            await profile.save();

            await logAdminAction({
                adminId: (req.user?.userId as any),
                action: "PROFILE_CHANGE_REJECT",
                targetType: "User",
                targetId: (profile.userId as any),
                details: `Critical profile changes rejected. Reason: ${rejectionReason || "Not approved"}`
            });

            await notifyUser({
                recipientId: profile.userId,
                type: "profile_change",
                title: "Profile Changes Rejected",
                message: `Your requested profile updates were not approved. Reason: ${rejectionReason || "Updates do not meet verification criteria."}`
            });

            res.status(200).json({
                success: true,
                message: "Profile changes rejected successfully",
                profile
            });
        }
    } catch (error: any) {
        console.error("Review profile change error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while reviewing profile change" });
    }
};

export const exportAdminData = async (req: Request, res: Response): Promise<any> => {
    try {
        const { type } = req.params;
        let csvContent = "";

        if (type === "users") {
            const users = await User.find().select("name email role status isPaid createdAt").lean();
            csvContent = "ID,Name,Email,Role,Status,IsPaid,CreatedAt\n" +
                users.map(u => `"${u._id}","${u.name || ''}","${u.email}","${u.role}","${u.status}",${!!u.isPaid},"${u.createdAt?.toISOString() || ''}"`).join("\n");
        } else if (type === "organizations") {
            const orgs = await Organization.find().select("organizationName slug organizationType verifiedStatus createdAt").lean();
            csvContent = "ID,OrganizationName,Slug,OrganizationType,VerifiedStatus,CreatedAt\n" +
                orgs.map(o => `"${o._id}","${o.organizationName || ''}","${o.slug || ''}","${o.organizationType || ''}","${(o as any).verifiedStatus || ''}","${o.createdAt?.toISOString() || ''}"`).join("\n");
        } else if (type === "opportunities") {
            const opps = await Opportunity.find().select("title role location category status positionsCount applicationDeadline createdAt").lean();
            csvContent = "ID,Title,Role,Location,Category,Status,PositionsCount,Deadline,CreatedAt\n" +
                opps.map(op => `"${op._id}","${op.title || ''}","${op.role || ''}","${op.location || ''}","${(op as any).category || ''}","${op.status}",${op.positionsCount || 0},"${(op as any).applicationDeadline?.toISOString() || ''}","${op.createdAt?.toISOString() || ''}"`).join("\n");
        } else if (type === "applications") {
            const apps = await Application.find().select("opportunityId talentId status consentGiven createdAt").lean();
            csvContent = "ID,OpportunityId,TalentId,Status,ConsentGiven,CreatedAt\n" +
                apps.map(a => `"${a._id}","${a.opportunityId}","${a.talentId}","${a.status}",${!!a.consentGiven},"${a.createdAt?.toISOString() || ''}"`).join("\n");
        } else if (type === "transactions") {
            const txs = await PaymentTransaction.find().select("userId orderId paymentId amount status invoiceNumber createdAt").lean();
            csvContent = "ID,UserId,OrderId,PaymentId,Amount,Status,InvoiceNumber,CreatedAt\n" +
                txs.map(t => `"${t._id}","${t.userId}","${t.orderId || ''}","${t.paymentId || ''}",${t.amount || 0},"${t.status}","${t.invoiceNumber || ''}","${t.createdAt?.toISOString() || ''}"`).join("\n");
        } else {
            return res.status(400).json({
                success: false,
                message: `Unsupported export type '${type}'. Supported types: users, organizations, opportunities, applications, transactions`
            });
        }

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="export-${type}.csv"`);
        return res.status(200).send(csvContent);
    } catch (error: any) {
        console.error("Export admin data error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while exporting data" });
    }
};

export const updateTalentTrendingStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { talentId } = req.params;
        const { remove, isTrending } = req.body;

        const profile = await TalentProfile.findOne({
            $or: [{ _id: talentId }, { userId: talentId }]
        });

        if (!profile) {
            return res.status(404).json({ success: false, message: "Talent profile not found" });
        }

        if (remove === true) {
            profile.trendingExcluded = true;
            profile.isTrending = false;
        } else if (isTrending !== undefined) {
            profile.isTrending = isTrending === true;
        }

        await profile.save();

        await logAdminAction({
            adminId: (req.user?.userId as any),
            action: "UPDATE_TRENDING_STATUS",
            targetType: "User",
            targetId: (profile.userId as any),
            details: `Trending status updated. Excluded: ${profile.trendingExcluded}, isTrending: ${profile.isTrending}`
        });

        res.status(200).json({
            success: true,
            message: "Talent trending status updated successfully",
            profile
        });
    } catch (error: any) {
        console.error("Update talent trending error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while updating trending status" });
    }
};



export const getAdminProfile = async (req: Request, res: Response): Promise<any> => {
    try {
        const adminId = (req.user as any)?.userId || (req.user as any)?._id;
        const admin = await User.findById(adminId).select("-password -twoFactorSecret");
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin profile not found" });
        }
        return res.status(200).json({
            success: true,
            profile: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                mobile: admin.mobile || "",
                avatar: (admin as any).avatar || null,
                role: admin.role,
                isSuperAdmin: (admin as any).isSuperAdmin || false,
                twoFactorEnabled: admin.twoFactorEnabled || false,
                status: admin.status,
                createdAt: admin.createdAt
            }
        });
    } catch (error: any) {
        console.error("Get admin profile error:", error);
        return res.status(500).json({ success: false, message: "Failed to retrieve admin profile" });
    }
};

export const updateAdminProfile = async (req: Request, res: Response): Promise<any> => {
    try {
        const adminId = (req.user as any)?.userId || (req.user as any)?._id;
        const admin = await User.findById(adminId);
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }
        const { name, avatar, mobile } = req.body;
        if (typeof name === "string" && name.trim()) {
            admin.name = name.trim();
        }
        if (avatar !== undefined) {
            (admin as any).avatar = avatar || null;
        }
        if (typeof mobile === "string") {
            admin.mobile = mobile.trim();
        }
        await admin.save();

        await logAdminAction({
            adminId: (admin._id as any),
            action: "UPDATE_ADMIN_PROFILE",
            targetType: "User",
            targetId: (admin._id as any),
            details: `Admin profile updated. Name: ${admin.name}, Avatar: ${Boolean((admin as any).avatar)}`
        });

        return res.status(200).json({
            success: true,
            message: "Admin profile updated successfully",
            profile: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                mobile: admin.mobile || "",
                avatar: (admin as any).avatar || null,
                role: admin.role,
                isSuperAdmin: (admin as any).isSuperAdmin || false,
                twoFactorEnabled: admin.twoFactorEnabled || false,
                status: admin.status
            }
        });
    } catch (error: any) {
        console.error("Update admin profile error:", error);
        return res.status(500).json({ success: false, message: "Failed to update admin profile" });
    }
};
