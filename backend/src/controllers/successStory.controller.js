const SuccessStory = require("../models/successStory.model");
const TalentProfile = require("../models/talentProfile.model");
const User = require("../models/user.model");
const { logAdminAction } = require("../services/audit.service");

/**
 * Submit a success story by talent (§42)
 * POST /api/success-stories
 */
const submitSuccessStory = async (req, res) => {
    try {
        const talentId = req.user.userId;
        const {
            quote,
            photoUrl,
            roleOrProfession,
            projectName,
            organizationName,
            applicationId,
            opportunityId,
            externalSharingConsent
        } = req.body;

        if (!quote || quote.trim().length < 20) {
            return res.status(400).json({
                success: false,
                message: "Quote is required and must be at least 20 characters long"
            });
        }

        const profile = await TalentProfile.findOne({ userId: talentId });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Talent profile not found"
            });
        }

        const user = await User.findById(talentId).select("name");
        const resolvedPhotoUrl = photoUrl || profile.profilePhoto;

        if (!resolvedPhotoUrl) {
            return res.status(400).json({
                success: false,
                message: "A photo is required for your success story testimonial"
            });
        }

        const story = await SuccessStory.create({
            talentId,
            talentProfileId: profile._id,
            applicationId: applicationId || null,
            opportunityId: opportunityId || null,
            talentName: profile.stageName || user?.name || "Talent",
            roleOrProfession: roleOrProfession || profile.primaryDesignation || profile.primaryProfession || "Creative Artist",
            projectName: projectName || "",
            organizationName: organizationName || "",
            photoUrl: resolvedPhotoUrl,
            quote: quote.trim(),
            externalSharingConsent: !!externalSharingConsent,
            status: "pending"
        });

        res.status(201).json({
            success: true,
            message: "Success story submitted successfully. It will appear on the homepage carousel once approved.",
            story
        });

    } catch (error) {
        console.error("Submit success story error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while submitting success story"
        });
    }
};

/**
 * Get approved success stories for public homepage carousel (§42)
 * GET /api/success-stories
 */
const getPublishedStories = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

        const stories = await SuccessStory.find({ status: "approved" })
            .select("talentName roleOrProfession projectName organizationName photoUrl quote createdAt")
            .sort({ displayOrder: 1, createdAt: -1 })
            .limit(limitNum)
            .lean();

        res.status(200).json({
            success: true,
            count: stories.length,
            stories
        });

    } catch (error) {
        console.error("Get published success stories error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching success stories"
        });
    }
};

/**
 * Admin: Get pending success stories
 * GET /api/success-stories/pending
 */
const getPendingStories = async (req, res) => {
    try {
        const stories = await SuccessStory.find({ status: "pending" })
            .populate("talentId", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: stories.length,
            stories
        });

    } catch (error) {
        console.error("Get pending success stories error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching pending stories"
        });
    }
};

/**
 * Admin: Review success story (Approve / Reject)
 * PATCH /api/success-stories/:storyId/review
 */
const reviewSuccessStory = async (req, res) => {
    try {
        const { storyId } = req.params;
        const { decision, rejectionReason, displayOrder } = req.body;

        if (!["approve", "reject"].includes(decision)) {
            return res.status(400).json({
                success: false,
                message: "Decision must be 'approve' or 'reject'"
            });
        }

        const story = await SuccessStory.findById(storyId);
        if (!story) {
            return res.status(404).json({
                success: false,
                message: "Success story not found"
            });
        }

        story.status = decision === "approve" ? "approved" : "rejected";
        story.reviewedBy = req.user.userId;
        story.reviewedAt = new Date();
        if (rejectionReason) story.rejectionReason = rejectionReason;
        if (displayOrder !== undefined) story.displayOrder = displayOrder;

        await story.save();

        await logAdminAction({
            adminId: req.user.userId,
            action: `success_story_${decision}`,
            targetType: "System",
            targetId: story._id,
            details: { decision, rejectionReason },
            req
        });

        res.status(200).json({
            success: true,
            message: `Success story ${decision === "approve" ? "approved" : "rejected"} successfully`,
            story
        });

    } catch (error) {
        console.error("Review success story error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while reviewing success story"
        });
    }
};

module.exports = {
    submitSuccessStory,
    getPublishedStories,
    getPendingStories,
    reviewSuccessStory
};
