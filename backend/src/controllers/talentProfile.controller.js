const crypto = require("crypto");
const TalentProfile = require("../models/talentProfile.model");
const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const Verification = require("../models/verification.model");
const MediaItem = require("../models/mediaItem.model");
const CreditViewHistory = require("../models/creditViewHistory.model");
const { calculateProfileCompletion, calculateProfileCompletionDetails } = require("../utils/profileCompletion.util");
const { validateTalentProfileInput, calculateAge } = require("../validators/talentProfile.validator");
const { toCard, toLimitedPreview, toFullProfile } = require("../utils/serializers/talent");
const { consumeProfileViewCredit } = require("../services/credit.service");
const { recordProfileView, getTalentAnalytics } = require("../services/analytics.service");
const { escapeRegex } = require("../utils/sanitize.util");
const { notifyUser } = require("../services/notification.service");

// Helper to generate unique Vismaya ID using CSPRNG with retry
const generateVismayaId = async () => {
    let unique = false;
    let vismayaId = "";
    let attempts = 0;
    while (!unique && attempts < 10) {
        attempts++;
        const randomDigits = crypto.randomInt(100000, 1000000);
        vismayaId = `VIS-${randomDigits}`;
        const existing = await TalentProfile.findOne({ vismayaId });
        if (!existing) unique = true;
    }
    return vismayaId;
};

// Helper to fetch verification badges for a list of userIds
const getVerificationBadgesMap = async (userIds) => {
    if (!userIds || userIds.length === 0) return {};
    const verifications = await Verification.find({
        userId: { $in: userIds },
        status: "verified"
    }).select("userId verificationType");

    const map = {};
    for (const id of userIds) {
        map[id.toString()] = {
            identityVerified: false,
            professionalVerified: false
        };
    }

    for (const v of verifications) {
        const idStr = v.userId.toString();
        if (map[idStr]) {
            if (v.verificationType === "identity") map[idStr].identityVerified = true;
            if (v.verificationType === "professional") map[idStr].professionalVerified = true;
        }
    }

    return map;
};

const createOrUpdateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const rawBody = req.body || {};

        // Run validator
        const validation = validateTalentProfileInput(rawBody);
        if (!validation.isValid) {
            console.error("Talent profile validation failed:", validation.errors);
            return res.status(400).json({
                success: false,
                message: validation.errors.join("; "),
                errors: validation.errors
            });
        }

        // Whitelist allowed user-editable fields
        const allowedFields = [
            "stageName", "firstName", "middleName", "lastName", "headline", "bio",
            "profilePhoto", "dob", "gender", "nationality", "careerStage", "category",
            "primaryProfession", "secondaryProfessions", "primaryDepartment", "primaryDesignation",
            "specializations", "secondaryDepartments", "voiceAttributes", "danceAttributes",
            "crewAttributes", "socialLinks", "currentCity", "currentState", "country",
            "workingCities", "willingToTravel", "willingToRelocate", "passportAvailable",
            "skills", "languages", "accentsAndDialects", "credits", "training", "awards",
            "portfolio", "guardianDetails", "physicalAttributes", "remunerationExpectation",
            "availability", "openToWorkAnywhere", "remoteMode", "experienceRange", "professionData"
        ];

        const updateData = {};
        for (const field of allowedFields) {
            if (rawBody[field] !== undefined) {
                updateData[field] = rawBody[field];
            }
        }

        let profile = await TalentProfile.findOne({ userId });

        // Under-18 calculation
        if (updateData.dob) {
            const age = calculateAge(updateData.dob);
            if (age !== null && age < 18) {
                updateData.isUnder18 = true;
                if (updateData.guardianDetails) {
                    updateData.guardianDetails.consentDate = updateData.guardianDetails.consentDate || new Date();
                }
            } else if (age !== null) {
                updateData.isUnder18 = false;
            }
        }

        let pendingChangesTriggered = false;

        if (!profile) {
            // Initial Profile Creation
            const vismayaId = await generateVismayaId();
            profile = new TalentProfile({
                userId,
                vismayaId,
                ...updateData
            });
        } else {
            // Category change is strictly blocked (403)
            if (updateData.category && updateData.category !== profile.category) {
                return res.status(403).json({
                    success: false,
                    message: "Direct switching of talent category is restricted. Please contact Vismaya Admin."
                });
            }

            // Check for Critical Fields Edit Workflow (T6: name, dob, primaryProfession)
            const criticalFields = ["firstName", "lastName", "dob", "primaryProfession", "primaryDepartment"];
            const pending = {};

            for (const cField of criticalFields) {
                if (updateData[cField] !== undefined && profile[cField] !== undefined && profile[cField] !== null) {
                    const oldVal = profile[cField] instanceof Date ? profile[cField].toISOString() : String(profile[cField]);
                    const newVal = updateData[cField] instanceof Date ? updateData[cField].toISOString() : String(updateData[cField]);
                    if (oldVal !== newVal) {
                        pending[cField] = updateData[cField];
                        delete updateData[cField]; // Don't apply immediately to live profile
                    }
                }
            }

            if (Object.keys(pending).length > 0) {
                profile.pendingChanges = { ...(profile.pendingChanges || {}), ...pending };
                profile.pendingChangesSubmittedAt = new Date();
                pendingChangesTriggered = true;
            }

            // Apply non-critical updates
            Object.assign(profile, updateData);
        }

        // Calculate weighted completion percentage
        const completion = calculateProfileCompletion(profile);
        profile.profileCompletionPercentage = completion;

        // Searchable check: completion >= 60% AND isPaid
        const user = await User.findById(userId).select("isPaid status");
        profile.isSearchable = completion >= 60 && !!user?.isPaid && user?.status === "active";

        await profile.save();

        if (pendingChangesTriggered) {
            await notifyUser({
                recipientId: userId,
                type: "profile_change",
                title: "Profile Changes Under Review",
                message: "Your critical profile updates (e.g. name, DOB, or primary profession) have been submitted for admin verification. Your current profile remains live."
            });
        }

        res.status(200).json({
            success: true,
            message: pendingChangesTriggered
                ? "Profile updated. Critical changes submitted for admin review while minor updates are published."
                : "Talent profile saved successfully",
            profile,
            pendingChanges: profile.pendingChanges
        });

    } catch (error) {
        console.error("Create/update talent profile error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while saving talent profile"
        });
    }
};

const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        let profile = await TalentProfile.findOne({ userId });

        if (!profile && req.user.role === "admin") {
            profile = await TalentProfile.findOne();
        }

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Talent profile not found. Please create your profile."
            });
        }

        const effectiveUserId = profile.userId || userId;
        const user = await User.findById(effectiveUserId).select("email mobile name status isPaid");
        const badgesMap = await getVerificationBadgesMap([effectiveUserId]);

        const fullProfile = toFullProfile(profile, req.user, {
            user,
            badges: badgesMap[effectiveUserId.toString()]
        });

        // Determine effective status: reflect talent profile review state accurately
        const isApproved = Boolean(profile.isProfileApproved || profile.status === "approved");
        const effectiveStatus = profile.status || (isApproved ? "approved" : "pending");
        fullProfile.status = effectiveStatus;
        fullProfile.isVerified = Boolean(profile.isVerified);
        fullProfile.isProfileApproved = isApproved;
        fullProfile.statusReason = profile.statusReason || profile.rejectionReason || null;

        let statusNote = "Your profile has been submitted and is pending verification by Vismaya Admin.";
        if (isApproved) {
            statusNote = "Your profile has been verified and approved by Vismaya Admin. You can now apply to live casting calls.";
        } else if (effectiveStatus === "rejected") {
            statusNote = profile.statusReason || profile.rejectionReason || "Your profile was not approved by admin. Please update your details and resubmit.";
        } else if (effectiveStatus === "suspended") {
            statusNote = profile.statusReason || "Your profile has been suspended by admin.";
        }
        fullProfile.statusNote = statusNote;

        fullProfile.userId = user ? {
            _id: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            status: user.status
        } : profile.userId;

        res.status(200).json({
            success: true,
            profile: fullProfile,
            verificationBadges: badgesMap[effectiveUserId.toString()] || { identityVerified: Boolean(profile.isVerified), professionalVerified: false }
        });

    } catch (error) {
        console.error("Get my profile error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching your profile"
        });
    }
};

/**
 * Talent Directory Search Endpoint (GET /api/talent-profiles/search, /api/talent/search)
 * Implements role-aware filtering, pagination, and strict card privacy serializers
 */
const searchTalentDirectory = async (req, res) => {
    try {
        const viewer = req.user;
        const viewerRole = viewer?.role || "guest";

        const {
            q,
            search,
            category,
            profession,
            department,
            designation,
            gender,
            careerStage,
            skill,
            language,
            state,
            city,
            willingToTravel,
            willingToRelocate,
            openToWorkAnywhere,
            remoteMode,
            availability,
            experienceRange,
            isFeatured,
            isTrending,
            verifiedOnly,
            minCompletion = 60,
            sortBy = "completion",
            page = 1,
            limit = 12
        } = req.query;

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);
        const skip = (pageNum - 1) * limitNum;

        // Base searchable filter: only active users whose profile isSearchable and completion >= 60
        const activeUsers = await User.find({ status: "active", isPaid: true }).select("_id");
        const activeUserIds = activeUsers.map(u => u._id);

        const filter = {
            userId: { $in: activeUserIds },
            isSearchable: true,
            profileCompletionPercentage: { $gte: Math.max(parseInt(minCompletion, 10) || 60, 60) }
        };

        // Text search across safe indexed fields
        const queryText = (q || search || "").trim();
        if (queryText) {
            const regex = new RegExp(escapeRegex(queryText), "i");
            filter.$or = [
                { stageName: regex },
                { firstName: regex },
                { lastName: regex },
                { headline: regex },
                { bio: regex },
                { primaryProfession: regex },
                { secondaryProfessions: regex },
                { primaryDepartment: regex },
                { primaryDesignation: regex },
                { "skills.name": regex }
            ];
        }

        if (category && ["open_talent", "film_and_tv", "voice_over", "dance_and_performing_arts", "crew_and_production"].includes(category)) {
            filter.category = category;
        }

        if (profession) {
            const profRegex = new RegExp(escapeRegex(profession.trim()), "i");
            filter.$and = filter.$and || [];
            filter.$and.push({
                $or: [
                    { primaryProfession: profRegex },
                    { secondaryProfessions: profRegex }
                ]
            });
        }

        if (department) {
            const deptRegex = new RegExp(escapeRegex(department.trim()), "i");
            filter.$and = filter.$and || [];
            filter.$and.push({
                $or: [
                    { primaryDepartment: deptRegex },
                    { secondaryDepartments: deptRegex }
                ]
            });
        }

        if (designation) {
            const desigRegex = new RegExp(escapeRegex(designation.trim()), "i");
            filter.$and = filter.$and || [];
            filter.$and.push({
                $or: [
                    { primaryDesignation: desigRegex },
                    { specializations: desigRegex }
                ]
            });
        }

        if (gender) {
            filter.gender = gender;
        }

        if (careerStage) {
            filter.careerStage = careerStage;
        }

        if (skill) {
            filter["skills.name"] = new RegExp(escapeRegex(skill.trim()), "i");
        }

        if (language) {
            filter["languages.language"] = new RegExp(escapeRegex(language.trim()), "i");
        }

        if (state) {
            filter.currentState = new RegExp(escapeRegex(state.trim()), "i");
        }

        if (city) {
            const cityRegex = new RegExp(escapeRegex(city.trim()), "i");
            filter.$and = filter.$and || [];
            filter.$and.push({
                $or: [
                    { currentCity: cityRegex },
                    { workingCities: cityRegex }
                ]
            });
        }

        if (willingToTravel !== undefined) {
            filter.willingToTravel = willingToTravel === "true" || willingToTravel === true;
        }

        if (willingToRelocate !== undefined) {
            filter.willingToRelocate = willingToRelocate === "true" || willingToRelocate === true;
        }

        if (openToWorkAnywhere !== undefined) {
            filter.openToWorkAnywhere = openToWorkAnywhere === "true" || openToWorkAnywhere === true;
        }

        if (remoteMode) {
            filter.remoteMode = remoteMode;
        }

        if (availability) {
            filter["availability.status"] = availability;
        }

        if (experienceRange) {
            filter.experienceRange = experienceRange;
        }

        if (isFeatured !== undefined) {
            filter.isFeatured = isFeatured === "true" || isFeatured === true;
        }

        if (isTrending !== undefined) {
            filter.isTrending = isTrending === "true" || isTrending === true;
        }

        if (verifiedOnly === "true" || verifiedOnly === true) {
            const verifiedRecords = await Verification.find({ status: "verified" }).select("userId");
            const verifiedUserIds = verifiedRecords.map(v => v.userId);
            filter.userId = { $in: activeUserIds.filter(id => verifiedUserIds.some(vid => vid.equals(id))) };
        }

        // Sorting
        let sortOption = { profileCompletionPercentage: -1, createdAt: -1 };
        if (sortBy === "recent") {
            sortOption = { createdAt: -1 };
        } else if (sortBy === "name") {
            sortOption = { firstName: 1, stageName: 1 };
        }

        const [profiles, total] = await Promise.all([
            TalentProfile.find(filter)
                .sort(sortOption)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            TalentProfile.countDocuments(filter)
        ]);

        const userIds = profiles.map(p => p.userId);
        const badgesMap = await getVerificationBadgesMap(userIds);

        const cards = profiles.map(p => {
            const userIdStr = p.userId.toString();
            return toCard(p, viewerRole, badgesMap[userIdStr]);
        });

        res.status(200).json({
            success: true,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            count: cards.length,
            cards
        });

    } catch (error) {
        console.error("Search talent directory error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while searching talent directory"
        });
    }
};

const getFeaturedTalent = async (req, res) => {
    try {
        const viewerRole = req.user?.role || "guest";
        const featuredProfiles = await TalentProfile.find({
            isSearchable: true,
            $or: [{ isFeatured: true }, { isTrending: true }]
        })
            .sort({ isFeatured: -1, isTrending: -1, profileCompletionPercentage: -1 })
            .limit(10)
            .lean();

        const userIds = featuredProfiles.map(p => p.userId);
        const badgesMap = await getVerificationBadgesMap(userIds);

        const cards = featuredProfiles.map(p => {
            const userIdStr = p.userId.toString();
            return toCard(p, viewerRole, badgesMap[userIdStr]);
        });

        res.status(200).json({
            success: true,
            count: cards.length,
            cards
        });
    } catch (error) {
        console.error("Get featured talent error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching featured talent"
        });
    }
};

const getPublicTalentProfile = async (req, res) => {
    try {
        const { vismayaIdOrId } = req.params;

        const query = vismayaIdOrId.startsWith("VIS-")
            ? { vismayaId: vismayaIdOrId }
            : { _id: vismayaIdOrId };

        const profile = await TalentProfile.findOne(query);

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Talent profile not found"
            });
        }

        // Check if talent user is active
        const user = await User.findById(profile.userId).select("email mobile name status isPaid");
        if (!user || user.status !== "active") {
            return res.status(404).json({
                success: false,
                message: "Profile unavailable or no longer active"
            });
        }

        const viewer = req.user;
        const isOwner = viewer && viewer.userId === profile.userId.toString();
        const isAdmin = viewer && viewer.role === "admin";
        let isUnlocked = false;
        let exemptionExpiresAt = null;

        // Check 7-day exemption for organization
        if (viewer && viewer.role === "organization") {
            const org = await Organization.findOne({ userId: viewer.userId });
            if (org) {
                const viewHistory = await CreditViewHistory.findOne({
                    organizationId: org._id,
                    talentId: profile.userId,
                    exemptionExpiresAt: { $gt: new Date() }
                });

                if (viewHistory) {
                    isUnlocked = true;
                    exemptionExpiresAt = viewHistory.exemptionExpiresAt;
                }
            }
        }

        const badgesMap = await getVerificationBadgesMap([profile.userId]);
        const badges = badgesMap[profile.userId.toString()] || { identityVerified: false, professionalVerified: false };

        // Fetch live media
        const isIndustryViewer = viewer && (viewer.role === "organization" || viewer.role === "admin");
        const mediaVisibilityFilter = isIndustryViewer
            ? { $in: ["public", "industry_only"] }
            : "public";

        const mediaItems = await MediaItem.find({
            owner: profile.userId,
            moderationState: "live",
            visibility: mediaVisibilityFilter
        }).sort({ isMainProfilePhoto: -1, displayOrder: 1, createdAt: -1 });

        // Case A: Owner or Admin
        if (isOwner || isAdmin) {
            const full = toFullProfile(profile, viewer, { user, badges, isUnlocked: true });
            return res.status(200).json({
                success: true,
                isUnlocked: true,
                isOwner,
                isAdmin,
                profile: full,
                media: mediaItems,
                verificationBadges: badges
            });
        }

        // Case B: Unlocked Organization
        if (isUnlocked) {
            recordProfileView({
                talentId: profile.userId,
                viewerId: viewer.userId,
                viewerRole: "organization",
                isFullProfile: true
            });

            const full = toFullProfile(profile, viewer, { badges, isUnlocked: true });
            return res.status(200).json({
                success: true,
                isUnlocked: true,
                exemptionExpiresAt,
                profile: full,
                media: mediaItems,
                verificationBadges: badges
            });
        }

        // Case C: Masked Limited Preview
        if (viewer?.role !== "organization") {
            recordProfileView({
                talentId: profile.userId,
                viewerId: viewer?.userId,
                viewerRole: viewer?.role || "guest",
                isFullProfile: true
            });
        }

        const preview = toLimitedPreview(profile, viewer?.role, badges);

        return res.status(200).json({
            success: true,
            isUnlocked: false,
            creditCost: 1,
            unlockPrompt: viewer?.role === "organization"
                ? "Unlock full profile with 1 credit to access complete professional portfolio and credit details."
                : "Sign in with an active Industry account to unlock full talent profile details.",
            profile: preview,
            media: mediaItems,
            verificationBadges: badges
        });

    } catch (error) {
        console.error("Get talent profile details error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching talent profile"
        });
    }
};

const unlockTalentProfile = async (req, res) => {
    try {
        const { vismayaIdOrId } = req.params;
        const userId = req.user.userId;

        const organization = await Organization.findOne({ userId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        const query = vismayaIdOrId.startsWith("VIS-")
            ? { vismayaId: vismayaIdOrId }
            : { _id: vismayaIdOrId };

        const talentProfile = await TalentProfile.findOne(query);
        if (!talentProfile) {
            return res.status(404).json({
                success: false,
                message: "Talent profile not found"
            });
        }

        const result = await consumeProfileViewCredit(organization._id, talentProfile.userId);

        if (!result.allowed) {
            return res.status(402).json({
                success: false,
                error: result.error,
                balance: result.balance,
                buyMoreViews: result.balance === 0,
                message: result.message
            });
        }

        // Record talent analytics view for unlocked view
        recordProfileView({
            talentId: talentProfile.userId,
            viewerId: userId,
            viewerRole: "organization",
            isFullProfile: true
        });

        const badgesMap = await getVerificationBadgesMap([talentProfile.userId]);
        const badges = badgesMap[talentProfile.userId.toString()] || { identityVerified: false, professionalVerified: false };

        const fullProfile = toFullProfile(talentProfile, req.user, { badges, isUnlocked: true });

        res.status(200).json({
            success: true,
            message: result.consumed
                ? "Talent profile unlocked successfully (1 credit consumed)"
                : "Profile is currently unlocked under active 7-day exemption (0 credits consumed)",
            isUnlocked: true,
            consumed: result.consumed,
            creditBalance: result.balance,
            exemptionExpiresAt: result.exemptionExpiresAt,
            lowBalanceWarning: result.lowBalanceWarning,
            profile: fullProfile
        });

    } catch (error) {
        console.error("Unlock talent profile error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while unlocking talent profile"
        });
    }
};

const getCompletionStatus = async (req, res) => {
    try {
        const userId = req.user.userId;
        const profile = await TalentProfile.findOne({ userId });
        const user = await User.findById(userId).select("isPaid");

        if (!profile) {
            return res.status(200).json({
                success: true,
                completionPercentage: 0,
                isEligibleToApply: false,
                isSearchable: false,
                isPaid: !!user?.isPaid,
                message: "Profile not started yet"
            });
        }

        const details = calculateProfileCompletionDetails(profile);
        const completionPercentage = details.percentage;
        const isPaid = !!user?.isPaid;
        const isEligibleToApply = completionPercentage >= 60 && isPaid;

        res.status(200).json({
            success: true,
            vismayaId: profile.vismayaId,
            completionPercentage,
            missingSections: details.missingSections,
            breakdown: details.breakdown,
            isEligibleToApply,
            isSearchable: profile.isSearchable,
            isPaid
        });

    } catch (error) {
        console.error("Get completion status error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while checking profile completion status"
        });
    }
};

const getMyAnalytics = async (req, res) => {
    try {
        const userId = req.user.userId;
        const analytics = await getTalentAnalytics(userId);

        res.status(200).json({
            success: true,
            analytics
        });
    } catch (error) {
        console.error("Get talent analytics error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching analytics"
        });
    }
};

const getShareCard = async (req, res) => {
    try {
        const { vismayaIdOrId } = req.params;
        const query = vismayaIdOrId.startsWith("VIS-")
            ? { vismayaId: vismayaIdOrId }
            : { _id: vismayaIdOrId };

        const profile = await TalentProfile.findOne(query);
        if (!profile) {
            return res.status(404).json({ success: false, message: "Profile not found" });
        }

        const badgesMap = await getVerificationBadgesMap([profile.userId]);
        const card = toCard(profile, "public", badgesMap[profile.userId.toString()]);

        res.status(200).json({
            success: true,
            card,
            shareUrl: `https://vismayacreativestudios.com/talent/${profile.vismayaId}`
        });
    } catch (error) {
        console.error("Get share card error:", error);
        res.status(500).json({ success: false, message: "Failed to generate share card" });
    }
};

module.exports = {
    createOrUpdateProfile,
    getMyProfile,
    searchTalentDirectory,
    getFeaturedTalent,
    getPublicTalentProfile,
    unlockTalentProfile,
    getCompletionStatus,
    getMyAnalytics,
    getShareCard
};
