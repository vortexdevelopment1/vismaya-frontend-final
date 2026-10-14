const mongoose = require("mongoose");
const User = require("../models/user.model");
const Opportunity = require("../models/opportunity.model");
const Project = require("../models/project.model");
const Organization = require("../models/organization.model");
const TalentProfile = require("../models/talentProfile.model");
const PaymentTransaction = require("../models/paymentTransaction.model");
const AdminAuditLog = require("../models/adminAuditLog.model");
const Verification = require("../models/verification.model");
const Application = require("../models/application.model");
const MediaItem = require("../models/mediaItem.model");
const Coupon = require("../models/coupon.model");
const CreditLedger = require("../models/creditLedger.model");
const CreditTransaction = require("../models/creditTransaction.model");
const Report = require("../models/report.model");
const ProjectShortlist = require("../models/projectShortlist.model");
const Audition = require("../models/audition.model");
const { logAdminAction } = require("../services/audit.service");
const { notifyUser } = require("../services/notification.service");
const { revokeAllUserSessions } = require("../services/session.service");
const { escapeRegex } = require("../utils/sanitize.util");
const { validateCouponInput } = require("../validators/coupon.validator");
const { calculateProfileCompletion } = require("../utils/profileCompletion.util");


// --- USER OPERATIONS ---

const findUserByIdOrVismayaId = async (idOrVismayaId) => {
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

const findTalentProfileByIdOrVismayaId = async (idOrVismayaId) => {
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

const extractTargetUserId = (req) => {
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

const generateUniqueVismayaId = async () => {
    const crypto = require("crypto");
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

const resolveTalentAndUserForModeration = async (targetId) => {
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

const approveTalentProfile = async (req, res) => {
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
        const adminId = req.user?.userId || req.user?._id;

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
        } catch (auditErr) {
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
            } catch (notifErr) {
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
    } catch (error) {
        console.error("Approve talent profile error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Something went wrong while approving talent profile"
        });
    }
};

const rejectTalentProfile = async (req, res) => {
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
        const adminId = req.user?.userId || req.user?._id;

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
        } catch (auditErr) {
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
            } catch (notifErr) {
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
    } catch (error) {
        console.error("Reject talent profile error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Something went wrong while rejecting talent profile"
        });
    }
};

const suspendTalentProfile = async (req, res) => {
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
        const adminId = req.user?.userId || req.user?._id;

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
            } catch (sessErr) {
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
        } catch (auditErr) {
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
            } catch (notifErr) {
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
    } catch (error) {
        console.error("Suspend talent profile error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Something went wrong while suspending talent profile"
        });
    }
};

const reactivateTalentProfile = async (req, res) => {
    try {
        const targetId = extractTargetUserId(req);
        const { profile, user } = await resolveTalentAndUserForModeration(targetId);

        if (!profile && !user) {
            return res.status(404).json({
                success: false,
                message: `Talent profile not found for identifier: ${targetId || "unspecified"}`
            });
        }

        const adminId = req.user?.userId || req.user?._id;

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
        } catch (auditErr) {
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
            } catch (notifErr) {
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
    } catch (error) {
        console.error("Reactivate talent profile error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Something went wrong while reactivating talent profile"
        });
    }
};

const getPendingTalentProfiles = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
        const skip = (pageNum - 1) * limitNum;

        const filter = {
            $or: [
                { status: "pending" },
                { isProfileApproved: false },
                { isProfileApproved: { $exists: false } }
            ]
        };

        const [profiles, total] = await Promise.all([
            TalentProfile.find(filter)
                .populate("userId", "name email mobile status isPaid createdAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            TalentProfile.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            count: profiles.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            profiles,
            data: profiles
        });
    } catch (error) {
        console.error("Get pending talent profiles error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching pending talent profiles" });
    }
};

const getTalentProfileById = async (req, res) => {
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
                category: "open_talent",
                currentCity: "Mumbai",
                currentState: "Maharashtra",
                primaryProfession: "Actor / Performer",
                status: user.status === "suspended" ? "suspended" : (user.status === "active" ? "pending" : user.status),
                isProfileApproved: user.status === "active",
                isVerified: false,
                profileCompletionPercentage: 35,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            };
        }

        res.status(200).json({
            success: true,
            profile,
            data: profile
        });
    } catch (error) {
        console.error("Get talent profile by ID error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching talent profile" });
    }
};

const approveUser = async (req, res) => {
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
                    isVerified: true
                }
            }
        );

        await logAdminAction({
            adminId: req.user.userId,
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
    } catch (error) {
        console.error("Approve user error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while approving user" });
    }
};

const getPendingUsers = async (req, res) => {
    try {
        const users = await User.find({ status: "pending" }).select("-password");
        res.status(200).json({ success: true, count: users.length, users });
    } catch (error) {
        console.error("Get pending users error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching pending users" });
    }
};

const rejectUser = async (req, res) => {
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
            { $set: { status: "rejected", isVerified: false } }
        );

        await logAdminAction({
            adminId: req.user.userId,
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
    } catch (error) {
        console.error("Reject user error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while rejecting user" });
    }
};

const suspendUser = async (req, res) => {
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
            adminId: req.user.userId,
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
    } catch (error) {
        console.error("Suspend user error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while suspending user" });
    }
};

const reactivateUser = async (req, res) => {
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
            adminId: req.user.userId,
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
    } catch (error) {
        console.error("Reactivate user error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while reactivating user" });
    }
};

const banUser = async (req, res) => {
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
            adminId: req.user.userId,
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
    } catch (error) {
        console.error("Ban user error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while banning user" });
    }
};

const unbanUser = async (req, res) => {
    try {
        const targetId = extractTargetUserId(req);
        const user = await findUserByIdOrVismayaId(targetId);

        if (!user) {
            return res.status(404).json({ success: false, message: `User not found for identifier: ${targetId || "unspecified"}` });
        }

        user.status = "active";
        await user.save();

        await logAdminAction({
            adminId: req.user.userId,
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
    } catch (error) {
        console.error("Unban user error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while unbanning user" });
    }
};

const finalizeUserDeletion = async (req, res) => {
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
            adminId: req.user.userId,
            action: "FINALIZE_USER_DELETION",
            targetType: "User",
            targetId: user._id,
            details: "User account finalized as deleted and PII scrubbed"
        });

        res.status(200).json({
            success: true,
            message: "User account permanently finalized as deleted and PII scrubbed"
        });
    } catch (error) {
        console.error("Finalize deletion error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while finalizing user deletion" });
    }
};


const getAllUsers = async (req, res) => {
    try {
        const { role, status, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (role) filter.role = role;
        if (status) filter.status = status;

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
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
    } catch (error) {
        console.error("Get all users error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching users" });
    }
};

// --- DIRECTORIES ---

const getTalentDirectory = async (req, res) => {
    try {
        const { profession, city, status, search, page = 1, limit = 50 } = req.query;
        const filter = {};
        if (profession) filter.primaryProfession = new RegExp(escapeRegex(profession), "i");
        if (city) filter.currentCity = new RegExp(escapeRegex(city), "i");

        const andConditions = [];

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

        if (search && search.trim()) {
            const searchRegex = new RegExp(escapeRegex(search.trim()), "i");
            const searchOr = [
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

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
        const skip = (pageNum - 1) * limitNum;

        const [profiles, total] = await Promise.all([
            TalentProfile.find(filter)
                .populate("userId", "name email mobile status isPaid createdAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            TalentProfile.countDocuments(filter)
        ]);

        // Synthesize only if searching all or specific unprofiled matches
        let syntheticProfiles = [];
        if (!status || status === "all" || status === "pending" || status === "active" || status === "suspended") {
            const profileUserIds = profiles.map(p => p.userId?._id?.toString()).filter(Boolean);
            const userFilter = {
                role: "talent",
                _id: { $nin: profileUserIds }
            };
            if (status === "pending") userFilter.status = "pending";
            if (status === "active") userFilter.status = "active";
            if (status === "suspended") userFilter.status = "suspended";

            const unprofiledUsers = await User.find(userFilter)
                .select("-password")
                .sort({ createdAt: -1 })
                .limit(20);

            syntheticProfiles = unprofiledUsers.map(u => ({
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

        res.status(200).json({
            success: true,
            count: allProfiles.length,
            total: total + syntheticProfiles.length,
            page: pageNum,
            totalPages: Math.ceil((total + syntheticProfiles.length) / limitNum) || 1,
            profiles: allProfiles,
            data: allProfiles
        });
    } catch (error) {
        console.error("Get talent directory error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching talent directory" });
    }
};

const getOrganizationDirectory = async (req, res) => {
    try {
        const { type, page = 1, limit = 50 } = req.query;
        const filter = {};
        if (type) filter.organizationType = new RegExp(escapeRegex(type), "i");

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
        const skip = (pageNum - 1) * limitNum;

        const [organizations, total] = await Promise.all([
            Organization.find(filter)
                .populate("userId", "name email mobile status isPaid createdAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Organization.countDocuments(filter)
        ]);

        const orgUserIds = organizations.map(o => o.userId?._id?.toString()).filter(Boolean);
        const unprofiledUsers = await User.find({
            role: "organization",
            _id: { $nin: orgUserIds }
        }).select("-password").sort({ createdAt: -1 }).limit(limitNum);

        const syntheticOrgs = unprofiledUsers.map(u => ({
            _id: u._id,
            userId: u,
            organizationName: u.name,
            contactPerson: u.name,
            contactEmail: u.email,
            contactNumber: u.mobile,
            organizationType: "Production House",
            status: u.status,
            createdAt: u.createdAt
        }));

        const allOrgs = [...organizations, ...syntheticOrgs];

        res.status(200).json({
            success: true,
            count: allOrgs.length,
            total: total + unprofiledUsers.length,
            page: pageNum,
            totalPages: Math.ceil((total + unprofiledUsers.length) / limitNum),
            organizations: allOrgs
        });
    } catch (error) {
        console.error("Get organization directory error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching organization directory" });
    }
};

// --- OPPORTUNITIES ADMIN QUEUE ---

const getAllOpportunitiesAdmin = async (req, res) => {
    try {
        const { status, organizationId, projectId, page = 1, limit = 100 } = req.query;
        const filter = {};
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
            const orgProjects = await Project.find({ organizationId }).select("_id");
            filter.projectId = { $in: orgProjects.map(p => p._id) };
        } else if (projectId) {
            filter.projectId = projectId;
        }

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 200);
        const skip = (pageNum - 1) * limitNum;

        const [opportunities, total] = await Promise.all([
            Opportunity.find(filter)
                .populate({
                    path: "projectId",
                    select: "projectName organizationId projectType title type",
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

        res.status(200).json({
            success: true,
            count: opportunities.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            opportunities
        });
    } catch (error) {
        console.error("Get all admin opportunities error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching opportunities" });
    }
};

const getAllApplicationsAdmin = async (req, res) => {
    try {
        const { opportunityId, talentId, status, page = 1, limit = 100 } = req.query;
        const filter = {};
        if (opportunityId) filter.opportunityId = opportunityId;
        if (talentId) filter.talentId = talentId;
        if (status && status !== "ALL") {
            filter.status = status.toLowerCase().replace(/\s+/g, "_");
        }

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 200);
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

        const enrichedApplications = applications.map(app => {
            const appObj = app.toObject();
            const prof = app.talentId?._id ? profileMap.get(app.talentId._id.toString()) : null;
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
    } catch (error) {
        console.error("Get all admin applications error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching applications" });
    }
};

const getAllProjectsAdmin = async (req, res) => {
    try {
        const { organizationId, status, page = 1, limit = 100 } = req.query;
        const filter = {};
        if (organizationId) filter.organizationId = organizationId;
        if (status && status !== "ALL") filter.status = status.toLowerCase();

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 200);
        const skip = (pageNum - 1) * limitNum;

        const [projects, total] = await Promise.all([
            Project.find(filter)
                .populate("organizationId", "organizationName contactPerson contactEmail contactNumber")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Project.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            count: projects.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            projects
        });
    } catch (error) {
        console.error("Get all admin projects error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching projects" });
    }
};

const getPendingOpportunities = async (req, res) => {
    try {
        const opportunities = await Opportunity.find({
            status: { $in: ["pending", "under_vismaya_review"] }
        }).populate({
            path: "projectId",
            select: "projectName organizationId projectType",
            populate: {
                path: "organizationId",
                select: "organizationName contactPerson contactEmail contactNumber"
            }
        }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: opportunities.length, opportunities });
    } catch (error) {
        console.error("Get pending opportunities error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching pending opportunities" });
    }
};

const approveOpportunity = async (req, res) => {
    try {
        const oppId = req.params.opportunityId || req.params.id || req.body?.opportunityId || req.body?.id;
        const opportunity = await Opportunity.findById(oppId);

        if (!opportunity) {
            return res.status(404).json({ success: false, message: "Opportunity not found" });
        }

        opportunity.status = "published";
        opportunity.publishedAt = new Date();
        opportunity.approvedAt = new Date();
        opportunity.approvedBy = req.user.userId;
        await opportunity.save();

        await logAdminAction({
            adminId: req.user.userId,
            action: "APPROVE_OPPORTUNITY",
            targetType: "opportunity",
            targetId: opportunity._id,
            details: `Approved opportunity: ${opportunity.title}`
        });

        res.status(200).json({ success: true, message: "Opportunity approved and published successfully", opportunity });
    } catch (error) {
        console.error("Approve opportunity error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while approving opportunity" });
    }
};

const rejectOpportunity = async (req, res) => {
    try {
        const oppId = req.params.opportunityId || req.params.id || req.body?.opportunityId || req.body?.id;
        const { rejectionReason } = req.body || {};

        const opportunity = await Opportunity.findById(oppId);
        if (!opportunity) {
            return res.status(404).json({ success: false, message: "Opportunity not found" });
        }

        opportunity.status = "rejected";
        opportunity.rejectionReason = rejectionReason || "Does not meet Vismaya standards";
        await opportunity.save();

        await logAdminAction({
            adminId: req.user.userId,
            action: "REJECT_OPPORTUNITY",
            targetType: "opportunity",
            targetId: opportunity._id,
            details: `Rejected opportunity. Reason: ${opportunity.rejectionReason}`
        });

        res.status(200).json({ success: true, message: "Opportunity rejected", opportunity });
    } catch (error) {
        console.error("Reject opportunity error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while rejecting opportunity" });
    }
};

const requestOpportunityCorrections = async (req, res) => {
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
        opportunity.correctionRequestedBy = req.user.userId;
        await opportunity.save();

        await logAdminAction({
            adminId: req.user.userId,
            action: "REQUEST_OPPORTUNITY_CORRECTIONS",
            targetType: "opportunity",
            targetId: opportunity._id,
            details: `Corrections requested: ${correctionNotes}`
        });

        res.status(200).json({ success: true, message: "Corrections requested from organization", opportunity });
    } catch (error) {
        console.error("Request corrections error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while requesting corrections" });
    }
};

const getCancellationRequests = async (req, res) => {
    try {
        const opportunities = await Opportunity.find({ status: "cancellation_requested" })
            .populate({
                path: "projectId",
                select: "projectName organizationId projectType",
                populate: {
                    path: "organizationId",
                    select: "organizationName contactPerson contactEmail contactNumber"
                }
            })
            .sort({ cancellationRequestedAt: -1 });

        res.status(200).json({ success: true, count: opportunities.length, opportunities });
    } catch (error) {
        console.error("Get cancellation requests error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching cancellation requests" });
    }
};

const reviewOpportunityCancellation = async (req, res) => {
    try {
        const { opportunityId } = req.params;
        const { action } = req.body; // "approve" or "reject"

        const opportunity = await Opportunity.findById(opportunityId);
        if (!opportunity) {
            return res.status(404).json({ success: false, message: "Opportunity not found" });
        }

        if (action === "approve") {
            opportunity.status = "cancelled";
        } else {
            const isExpired = opportunity.applicationDeadline && new Date(opportunity.applicationDeadline) < new Date();
            opportunity.status = isExpired ? "closed" : (opportunity.statusBeforeCancellationRequest || "published");
        }

        opportunity.cancellationReviewedAt = new Date();
        opportunity.cancellationReviewedBy = req.user.userId;
        await opportunity.save();

        await logAdminAction({
            adminId: req.user.userId,
            action: `CANCELLATION_${action.toUpperCase()}`,
            targetType: "Opportunity",
            targetId: opportunity._id,
            details: `Cancellation request ${action}d`
        });

        res.status(200).json({ success: true, message: `Cancellation request ${action}d successfully`, opportunity });
    } catch (error) {
        console.error("Review cancellation error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while reviewing cancellation" });
    }
};

const completeOpportunity = async (req, res) => {
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
            adminId: req.user.userId,
            action: "COMPLETE_OPPORTUNITY",
            targetType: "Opportunity",
            targetId: opportunity._id,
            details: `Opportunity completed and closed: ${opportunity.title}`
        });

        // Notify organization owner
        const org = await Organization.findById(opportunity.organizationId);
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
    } catch (error) {
        console.error("Complete opportunity error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while completing opportunity" });
    }
};

// --- REPORTS MANAGEMENT ---

const getReports = async (req, res) => {
    try {
        const { status, targetType, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (targetType) filter.targetType = targetType;

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
        const skip = (pageNum - 1) * limitNum;

        const [reports, total] = await Promise.all([
            Report.find(filter)
                .populate("reporterId", "name email role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Report.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            count: reports.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            reports
        });
    } catch (error) {
        console.error("Get reports error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching reports" });
    }
};

const reviewReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { action, resolutionNotes } = req.body; // "resolve" or "dismiss"

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
        report.resolvedBy = req.user.userId;
        await report.save();

        await logAdminAction({
            adminId: req.user.userId,
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
    } catch (error) {
        console.error("Review report error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while reviewing report" });
    }
};

// --- AUDITIONS QUEUE & REVIEW ---

const getPendingAuditions = async (req, res) => {
    try {
        const { page = 1, limit = 50, status, all } = req.query;
        const filter = {};
        if (all === "true" || all === true) {
            // No approval filter, return all
        } else if (status && status !== "ALL") {
            const s = String(status).toLowerCase().replace(/\s+/g, "_");
            if (s === "requested") {
                filter.status = "requested";
            } else if (s.includes("relay")) {
                filter.status = "relayed_to_talent";
            } else if (s.includes("self_tape") || s.includes("submitted")) {
                filter.status = { $in: ["submitted", "self_tape_received", "self_tape_submitted"] };
            } else if (s.includes("forward")) {
                filter.status = "forwarded_to_org";
            } else {
                filter.status = s;
            }
        } else {
            filter.vismayaApproval = "pending";
        }

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
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
    } catch (error) {
        console.error("Get pending auditions error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch pending auditions" });
    }
};

const reviewAudition = async (req, res) => {
    try {
        const auditionId = req.params.auditionId || req.params.id;
        const { action, scriptUrl, rejectionReason } = req.body; // "approve" or "reject"

        const audition = await Audition.findById(auditionId);
        if (!audition) {
            return res.status(404).json({ success: false, message: "Audition not found" });
        }

        if (action === "approve") {
            audition.vismayaApproval = "approved";
            audition.vismayaReviewedBy = req.user.userId;
            audition.vismayaReviewedAt = new Date();
            if (scriptUrl) {
                audition.scriptUrl = scriptUrl;
            }
            await audition.save();

            await logAdminAction({
                adminId: req.user.userId,
                action: "AUDITION_APPROVE",
                targetType: "Audition",
                targetId: audition._id,
                details: `Audition approved for application ${audition.applicationId}`
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

            res.status(200).json({
                success: true,
                message: "Audition approved and invitation sent to talent",
                audition
            });
        } else {
            audition.vismayaApproval = "rejected";
            audition.vismayaReviewedBy = req.user.userId;
            audition.vismayaReviewedAt = new Date();
            audition.vismayaRejectionReason = rejectionReason || "Does not meet guidelines";
            audition.status = "cancelled";
            await audition.save();

            await logAdminAction({
                adminId: req.user.userId,
                action: "AUDITION_REJECT",
                targetType: "Audition",
                targetId: audition._id,
                details: `Audition rejected. Reason: ${audition.vismayaRejectionReason}`
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

            res.status(200).json({
                success: true,
                message: "Audition request rejected",
                audition
            });
        }
    } catch (error) {
        console.error("Review audition error:", error);
        res.status(500).json({ success: false, message: "Failed to review audition" });
    }
};

// --- REAPPLICATIONS ---

const getReapplicationRequests = async (req, res) => {
    try {
        const applications = await Application.find({
            status: "withdrawn",
            reapplicationRequested: true,
            reapplicationReviewedAt: { $exists: false }
        }).populate("talentId", "name email").populate("opportunityId", "title").sort({ reapplicationRequestedAt: -1 });

        res.status(200).json({ success: true, count: applications.length, applications });
    } catch (error) {
        console.error("Get reapplication requests error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching reapplication requests" });
    }
};

const reviewReapplication = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { action, decisionNotes } = req.body; // "approve" or "reject"

        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        application.reapplicationApproved = action === "approve";
        application.reapplicationReviewedAt = new Date();
        application.reapplicationReviewedBy = req.user.userId;
        application.reapplicationDecisionNotes = decisionNotes || "";

        // If approved, delete old withdrawn record so talent can apply fresh
        if (action === "approve") {
            await Application.deleteOne({ _id: application._id });
        } else {
            await application.save();
        }

        await logAdminAction({
            adminId: req.user.userId,
            action: `REAPPLICATION_${action.toUpperCase()}`,
            targetType: "application",
            targetId: application._id,
            details: `Reapplication ${action}d. Notes: ${decisionNotes || "None"}`
        });

        res.status(200).json({ success: true, message: `Reapplication request ${action}d successfully` });
    } catch (error) {
        console.error("Review reapplication error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while reviewing reapplication" });
    }
};

// --- VERIFICATIONS ---

const getPendingVerifications = async (req, res) => {
    try {
        const verifications = await Verification.find({ status: "pending" })
            .populate("userId", "name email role")
            .sort({ submittedAt: -1 });

        res.status(200).json({ success: true, count: verifications.length, verifications });
    } catch (error) {
        console.error("Get pending verifications error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching verifications" });
    }
};

const reviewVerification = async (req, res) => {
    try {
        const { verificationId } = req.params;
        const { action, notes, rejectionReason } = req.body; // "approve" or "reject"

        const verification = await Verification.findById(verificationId);
        if (!verification) {
            return res.status(404).json({ success: false, message: "Verification record not found" });
        }

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

            verification.status = "verified";
            verification.verifiedAt = new Date();
            verification.verifiedBy = req.user.userId;
            verification.reviewNotes = notes || "";
            verification.rejectionReason = undefined;

            await TalentProfile.findOneAndUpdate(
                { userId: verification.userId },
                {
                    isVerified: true,
                    verifiedAt: new Date(),
                    badgeType: "verified"
                }
            );
        } else {
            verification.status = "rejected";
            verification.verifiedAt = undefined;
            verification.verifiedBy = req.user.userId;
            verification.reviewNotes = notes || "";
            verification.rejectionReason = rejectionReason || "Documents insufficient";
        }

        await verification.save();

        await logAdminAction({
            adminId: req.user.userId,
            action: `VERIFICATION_${action.toUpperCase()}`,
            targetType: "Verification",
            targetId: verification._id,
            details: `Verification ${action}d for user ${verification.userId}`
        });

        res.status(200).json({ success: true, message: `Verification ${action}d successfully`, verification });
    } catch (error) {
        console.error("Review verification error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while reviewing verification" });
    }
};

// --- MEDIA MODERATION ---

const getPendingMedia = async (req, res) => {
    try {
        const media = await MediaItem.find({
            moderationState: { $in: ["admin_review", "uploaded", "restricted"] }
        })
            .populate("owner", "name email role")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: media.length, media });
    } catch (error) {
        console.error("Get pending media error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching media moderation queue" });
    }
};

const reviewMediaItem = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const { action, moderationReason } = req.body; // "approve", "reject", "restrict"

        if (!["approve", "reject", "restrict"].includes(action)) {
            return res.status(400).json({ success: false, message: "Action must be approve, reject, or restrict" });
        }

        const media = await MediaItem.findById(mediaId);
        if (!media) {
            return res.status(404).json({ success: false, message: "Media item not found" });
        }

        const stateMap = {
            approve: "live",
            reject: "removed",
            restrict: "restricted"
        };

        media.moderationState = stateMap[action];
        media.moderatedAt = new Date();
        media.moderatedBy = req.user.userId;
        media.moderationNotes = moderationReason || "";
        await media.save();

        await logAdminAction({
            adminId: req.user.userId,
            action: `MEDIA_MODERATION_${action.toUpperCase()}`,
            targetType: "media",
            targetId: media._id,
            details: `Media ${action}d. Reason: ${moderationReason || "None"}`
        });

        res.status(200).json({ success: true, message: `Media item ${action}d successfully`, media });
    } catch (error) {
        console.error("Review media error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while reviewing media" });
    }
};

// --- TRANSACTIONS & CREDITS ---

const getPaymentTransactions = async (req, res) => {
    try {
        const { status, packageType, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (packageType) filter.packageType = packageType;

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
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
    } catch (error) {
        console.error("Get payment transactions error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching transactions" });
    }
};

const adjustCreditBalance = async (req, res) => {
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
            });
        }

        const prevBalance = ledger.balance;
        const newBalance = Math.max(0, prevBalance + amount);
        ledger.balance = newBalance;
        if (amount > 0) ledger.totalPurchased += amount;
        await ledger.save();

        await CreditTransaction.create({
            organizationId,
            transactionType: amount > 0 ? "admin_grant" : "admin_deduct",
            amount: Math.abs(amount),
            balanceAfter: newBalance,
            description: reason || `Admin credit adjustment by ${req.user.email}`
        });

        await logAdminAction({
            adminId: req.user.userId,
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
    } catch (error) {
        console.error("Adjust credits error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while adjusting credits" });
    }
};

// --- COUPON MANAGEMENT ---

const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: coupons.length, coupons });
    } catch (error) {
        console.error("Get coupons error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching coupons" });
    }
};

const createCoupon = async (req, res) => {
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
            createdBy: req.user.userId
        });

        await logAdminAction({
            adminId: req.user.userId,
            action: "CREATE_COUPON",
            targetType: "coupon",
            targetId: coupon._id,
            details: `Created coupon ${cleanCode}`
        });

        res.status(201).json({ success: true, message: "Coupon created successfully", coupon });
    } catch (error) {
        console.error("Create coupon error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while creating coupon" });
    }
};

const updateCoupon = async (req, res) => {
    try {
        const { couponId } = req.params;
        const coupon = await Coupon.findById(couponId);
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        const allowedFields = ["discountType", "discountValue", "minOrderAmount", "maxDiscountAmount", "applicablePackages", "maxUses", "validUntil", "isActive"];
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                coupon[field] = req.body[field];
            }
        }

        await coupon.save();

        res.status(200).json({ success: true, message: "Coupon updated successfully", coupon });
    } catch (error) {
        console.error("Update coupon error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while updating coupon" });
    }
};

const deleteCoupon = async (req, res) => {
    try {
        const { couponId } = req.params;
        await Coupon.findByIdAndDelete(couponId);
        res.status(200).json({ success: true, message: "Coupon deleted successfully" });
    } catch (error) {
        console.error("Delete coupon error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while deleting coupon" });
    }
};

// --- DASHBOARD & ANALYTICS ---

const getDashboardMetrics = async (req, res) => {
    try {
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
            pendingMediaCount,
            categoryAgg,
            cityAgg,
            underReviewApps,
            shortlistedApps,
            selectedApps,
            appMonthlyAgg,
            userMonthlyAgg
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: "talent" }),
            User.countDocuments({ role: "organization" }),
            User.countDocuments({ status: "pending" }),
            User.countDocuments({ role: "talent", status: { $in: ["active", "approved", "verified"] } }),
            User.countDocuments({ role: "organization", status: { $in: ["active", "approved", "verified"] } }),
            Opportunity.countDocuments(),
            Opportunity.countDocuments({ status: "published" }),
            Opportunity.countDocuments({ status: { $in: ["pending", "under_vismaya_review"] } }),
            Opportunity.countDocuments({ status: "cancellation_requested" }),
            Application.countDocuments(),
            Audition.countDocuments(),
            Audition.countDocuments({ status: "requested" }),
            Audition.countDocuments({ status: { $in: ["submitted", "self_tape_received", "self_tape_submitted"] } }),
            PaymentTransaction.aggregate([
                { $match: { status: "successful" } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]),
            Verification.countDocuments({ status: "pending" }),
            MediaItem.countDocuments({ status: "pending" }),
            Project.aggregate([
                { $match: { projectType: { $exists: true, $ne: "" } } },
                { $group: { _id: "$projectType", count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            TalentProfile.aggregate([
                { $match: { currentCity: { $exists: true, $ne: "" } } },
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
    } catch (error) {
        console.error("Dashboard metrics error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while generating dashboard metrics" });
    }
};

const getAuditLogs = async (req, res) => {
    try {
        const { action, targetType, page = 1, limit = 50 } = req.query;
        const filter = {};
        if (action) filter.action = action;
        if (targetType) filter.targetType = targetType;

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
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
    } catch (error) {
        console.error("Get audit logs error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching audit logs" });
    }
};

const globalAdminSearch = async (req, res) => {
    try {
        const { q, search } = req.query;
        const queryText = (q || search || "").trim();

        if (!queryText) {
            return res.status(400).json({ success: false, message: "Search query 'q' is required" });
        }

        const escapedQuery = escapeRegex(queryText);
        const regex = new RegExp(escapedQuery, "i");

        const [users, organizations, opportunities, payments, talentProfiles] = await Promise.all([
            User.find({ $or: [{ name: regex }, { email: regex }, { mobile: regex }] }).select("name email role status isPaid createdAt").limit(10).lean(),
            Organization.find({ $or: [{ organizationName: regex }, { organizationType: regex }] }).populate("userId", "name email status").limit(10).lean(),
            Opportunity.find({ $or: [{ title: regex }, { role: regex }, { summary: regex }] }).populate("projectId", "projectName").limit(10).lean(),
            PaymentTransaction.find({ $or: [{ orderId: regex }, { paymentId: regex }, { invoiceNumber: regex }] }).populate("userId", "name email").limit(10).lean(),
            TalentProfile.find({ $or: [{ vismayaId: regex }, { stageName: regex }, { firstName: regex }, { lastName: regex }, { primaryProfession: regex }] }).select("vismayaId stageName firstName lastName primaryProfession").limit(10).lean()
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
    } catch (error) {
        console.error("Global admin search error:", error);
        res.status(500).json({ success: false, message: "Something went wrong during admin search" });
    }
};

// --- PROFILE CHANGES & TRENDING MANAGEMENT ---

const getPendingProfileChanges = async (req, res) => {
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
    } catch (error) {
        console.error("Get pending profile changes error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while fetching pending profile changes" });
    }
};

const reviewProfileChange = async (req, res) => {
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
            profile.pendingChanges = null;
            profile.pendingChangesSubmittedAt = null;

            // Recalculate completion and searchability
            const completion = calculateProfileCompletion(profile);
            profile.profileCompletionPercentage = completion;
            const user = await User.findById(profile.userId).select("isPaid status");
            profile.isSearchable = completion >= 60 && !!user?.isPaid && user?.status === "active";

            await profile.save();

            await logAdminAction({
                adminId: req.user.userId,
                action: "PROFILE_CHANGE_APPROVE",
                targetType: "User",
                targetId: profile.userId,
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
            profile.pendingChanges = null;
            profile.pendingChangesSubmittedAt = null;
            await profile.save();

            await logAdminAction({
                adminId: req.user.userId,
                action: "PROFILE_CHANGE_REJECT",
                targetType: "User",
                targetId: profile.userId,
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
    } catch (error) {
        console.error("Review profile change error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while reviewing profile change" });
    }
};

const exportAdminData = async (req, res) => {
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
                orgs.map(o => `"${o._id}","${o.organizationName || ''}","${o.slug || ''}","${o.organizationType || ''}","${o.verifiedStatus || ''}","${o.createdAt?.toISOString() || ''}"`).join("\n");
        } else if (type === "opportunities") {
            const opps = await Opportunity.find().select("title role location category status positionsCount applicationDeadline createdAt").lean();
            csvContent = "ID,Title,Role,Location,Category,Status,PositionsCount,Deadline,CreatedAt\n" +
                opps.map(op => `"${op._id}","${op.title || ''}","${op.role || ''}","${op.location || ''}","${op.category || ''}","${op.status}",${op.positionsCount || 0},"${op.applicationDeadline?.toISOString() || ''}","${op.createdAt?.toISOString() || ''}"`).join("\n");
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
    } catch (error) {
        console.error("Export admin data error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while exporting data" });
    }
};

const updateTalentTrendingStatus = async (req, res) => {
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
            adminId: req.user.userId,
            action: "UPDATE_TRENDING_STATUS",
            targetType: "User",
            targetId: profile.userId,
            details: `Trending status updated. Excluded: ${profile.trendingExcluded}, isTrending: ${profile.isTrending}`
        });

        res.status(200).json({
            success: true,
            message: "Talent trending status updated successfully",
            profile
        });
    } catch (error) {
        console.error("Update talent trending error:", error);
        res.status(500).json({ success: false, message: "Something went wrong while updating trending status" });
    }
};

module.exports = {
    approveUser,
    getPendingUsers,
    rejectUser,
    suspendUser,
    reactivateUser,
    banUser,
    unbanUser,
    finalizeUserDeletion,
    getAllUsers,
    getTalentDirectory,
    getOrganizationDirectory,
    getPendingOpportunities,
    approveOpportunity,
    rejectOpportunity,
    requestOpportunityCorrections,
    getCancellationRequests,
    reviewOpportunityCancellation,
    completeOpportunity,
    getReports,
    reviewReport,
    getPendingAuditions,
    reviewAudition,
    getReapplicationRequests,
    reviewReapplication,
    getPendingVerifications,
    reviewVerification,
    getPendingMedia,
    reviewMediaItem,
    getPendingProfileChanges,
    reviewProfileChange,
    updateTalentTrendingStatus,
    getPaymentTransactions,
    adjustCreditBalance,
    getCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    getAllOpportunitiesAdmin,
    getAllApplicationsAdmin,
    getAllProjectsAdmin,
    getDashboardMetrics,
    getAuditLogs,
    globalAdminSearch,
    exportAdminData,
    approveTalentProfile,
    rejectTalentProfile,
    suspendTalentProfile,
    reactivateTalentProfile,
    getPendingTalentProfiles,
    getTalentProfileById
};


