import { Request, Response } from "express";
import SuccessStory from "../models/successStory.model.js";
import TalentProfile from "../models/talentProfile.model.js";
import User from "../models/user.model.js";
import { logAdminAction } from "../services/audit.service.js";
import { notifyUser } from "../services/notification.service.js";

/**
 * Submit a success story by talent (§42)
 * POST /api/success-stories
 */
export const submitSuccessStory = async (req: Request, res: Response): Promise<any> => {
    try {
        const talentId = req.user?.userId;
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

        const trimmedQuote = (quote || "").trim();
        if (!trimmedQuote || trimmedQuote.length < 20 || trimmedQuote.length > 300) {
            return res.status(400).json({
                success: false,
                message: "Quote is required and must be between 20 and 300 characters long"
            });
        }

        const trimmedRole = (roleOrProfession || (req.body as any).profession || (req.body as any).role || "").trim();
        if (!trimmedRole) {
            return res.status(400).json({
                success: false,
                message: "Role or profession is required"
            });
        }

        const user = await User.findById(talentId).select("name status");
        if (!user || user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Only active talent accounts may submit a success story"
            });
        }

        const profile = await TalentProfile.findOne({ userId: talentId });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Talent profile not found"
            });
        }

        if (!profile.isProfileApproved && !profile.isVerified && profile.status !== "approved" && profile.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Only verified or approved talent profiles may submit a success story"
            });
        }

        // Limit: Max 1 pending story per talent
        const existingPending = await SuccessStory.findOne({ talentId, status: "pending" });
        if (existingPending) {
            return res.status(400).json({
                success: false,
                message: "You already have a success story pending editorial review. Please wait for the current submission to be reviewed."
            });
        }

        const resolvedPhotoUrl = photoUrl || (req.body as any).photo || profile.profilePhoto;
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
            roleOrProfession: trimmedRole,
            projectName: (projectName || "").trim(),
            organizationName: (organizationName || "").trim(),
            photoUrl: resolvedPhotoUrl,
            quote: trimmedQuote,
            externalSharingConsent: Boolean(externalSharingConsent),
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
export const getPublishedStories = async (req: Request, res: Response): Promise<any> => {
    try {
        const { limit = 10, page = 1 } = req.query;
        const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 10, 1), 50);
        const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
        const skip = (pageNum - 1) * limitNum;

        const filter: any = { status: "approved" };

        const [stories, total] = await Promise.all([
            SuccessStory.find(filter)
                .select("talentName roleOrProfession projectName organizationName photoUrl quote createdAt reviewedAt")
                .sort({ reviewedAt: -1, createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            SuccessStory.countDocuments(filter)
        ]);

        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.status(200).json({
            success: true,
            count: stories.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
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
 * Talent: Get own submitted success stories
 * GET /api/success-stories/mine
 */
export const getMySuccessStories = async (req: Request, res: Response): Promise<any> => {
    try {
        const talentId = req.user?.userId;
        const stories = await SuccessStory.find({ talentId })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: stories.length,
            stories
        });
    } catch (error) {
        console.error("Get my success stories error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching your success stories"
        });
    }
};

/**
 * Admin: Get pending success stories
 * GET /api/success-stories/pending
 */
export const getPendingStories = async (req: Request, res: Response): Promise<any> => {
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
export const reviewSuccessStory = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = req.params.storyId || req.params.id;
        const { decision, rejectionReason, displayOrder } = req.body;
        const resolvedDecision = decision || (req.body as any).action;

        if (!["approve", "reject"].includes(resolvedDecision)) {
            return res.status(400).json({
                success: false,
                message: "Decision must be 'approve' or 'reject'"
            });
        }

        if (resolvedDecision === "reject" && (!rejectionReason || !String(rejectionReason).trim())) {
            return res.status(400).json({
                success: false,
                message: "Rejection reason is required when rejecting a success story"
            });
        }

        const story = await SuccessStory.findById(String(id));
        if (!story) {
            return res.status(404).json({
                success: false,
                message: "Success story not found"
            });
        }

        story.status = resolvedDecision === "approve" ? "approved" : "rejected";
        story.reviewedBy = req.user?.userId as any;
        story.reviewedAt = new Date();
        if (rejectionReason) story.rejectionReason = rejectionReason;
        if (displayOrder !== undefined) story.displayOrder = displayOrder;

        await story.save();

        if (resolvedDecision === "approve") {
            await notifyUser({
                recipientId: story.talentId,
                type: "featured_nomination_update",
                title: "Success Story Approved",
                message: `Your success story for "${story.projectName || "your project"}" has been approved and published to the platform showcase.`,
                referenceId: story._id,
                referenceType: "System"
            });
        } else if (resolvedDecision === "reject") {
            await notifyUser({
                recipientId: story.talentId,
                type: "featured_nomination_update",
                title: "Success Story Rejected",
                message: `Your success story for "${story.projectName || "your project"}" was not approved. Reason: ${rejectionReason}`,
                referenceId: story._id,
                referenceType: "System"
            });
        }

        await logAdminAction({
            adminId: req.user?.userId,
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

/**
 * Admin: Get success stories with status filtering and accurate counts per status (§42, §44)
 * GET /api/admin/success-stories?status=
 */
export const getAdminSuccessStories = async (req: Request, res: Response): Promise<any> => {
    try {
        const { status, page = 1, limit = 50 } = req.query;
        const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 100);
        const skip = (pageNum - 1) * limitNum;

        const [pendingCount, approvedCount, unpublishedCount, rejectedCount] = await Promise.all([
            SuccessStory.countDocuments({ status: "pending" }),
            SuccessStory.countDocuments({ status: "approved" }),
            SuccessStory.countDocuments({ status: "unpublished" }),
            SuccessStory.countDocuments({ status: "rejected" })
        ]);

        const counts = {
            pending: pendingCount,
            approved: approvedCount,
            published: approvedCount,
            unpublished: unpublishedCount,
            rejected: rejectedCount,
            total: pendingCount + approvedCount + unpublishedCount + rejectedCount
        };

        const filter: any = {};
        const normalizedStatus = String(status || "").toLowerCase().trim();
        if (normalizedStatus === "pending") {
            filter.status = "pending";
        } else if (normalizedStatus === "published" || normalizedStatus === "approved") {
            filter.status = "approved";
        } else if (normalizedStatus === "unpublished") {
            filter.status = "unpublished";
        } else if (normalizedStatus === "rejected") {
            filter.status = "rejected";
        } else if (normalizedStatus === "all") {
            // all
        } else if (!status) {
            // Default to pending for backwards compatibility
            filter.status = "pending";
        }

        const [stories, totalFiltered] = await Promise.all([
            SuccessStory.find(filter)
                .populate("talentId", "name email mobile")
                .populate("reviewedBy", "name email")
                .populate("unpublishedBy", "name email")
                .sort({ updatedAt: -1, createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            SuccessStory.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            counts,
            count: stories.length,
            total: totalFiltered,
            page: pageNum,
            totalPages: Math.ceil(totalFiltered / limitNum),
            stories,
            data: stories
        });
    } catch (error) {
        console.error("Get admin success stories error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching success stories"
        });
    }
};

/**
 * Admin: Unpublish an approved success story
 * PATCH /api/admin/success-stories/:storyId/unpublish
 */
export const unpublishSuccessStory = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = req.params.storyId || req.params.id;
        const { reason } = req.body;
        const trimmedReason = (reason || (req.body as any).unpublishReason || "").trim();

        if (!trimmedReason) {
            return res.status(400).json({
                success: false,
                message: "A reason is required to unpublish a success story"
            });
        }

        const story = await SuccessStory.findById(String(id));
        if (!story) {
            return res.status(404).json({
                success: false,
                message: "Success story not found"
            });
        }

        if (story.status !== "approved") {
            return res.status(400).json({
                success: false,
                message: `Only approved success stories can be unpublished. Current status: ${story.status}`
            });
        }

        story.status = "unpublished";
        story.unpublishReason = trimmedReason;
        story.unpublishedAt = new Date();
        story.unpublishedBy = req.user?.userId as any;
        await story.save();

        await notifyUser({
            recipientId: story.talentId,
            type: "featured_nomination_update",
            title: "Success Story Unpublished",
            message: `Your success story for "${story.projectName || "your project"}" was unpublished. Reason: ${trimmedReason}`,
            referenceId: story._id,
            referenceType: "System"
        });

        await logAdminAction({
            adminId: req.user?.userId,
            action: "success_story_unpublish",
            targetType: "System",
            targetId: story._id,
            details: { reason: trimmedReason },
            req
        });

        res.status(200).json({
            success: true,
            message: "Success story unpublished successfully",
            story
        });
    } catch (error) {
        console.error("Unpublish success story error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while unpublishing success story"
        });
    }
};

/**
 * Admin: Republish an unpublished success story
 * PATCH /api/admin/success-stories/:storyId/republish
 */
export const republishSuccessStory = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = req.params.storyId || req.params.id;

        const story = await SuccessStory.findById(String(id));
        if (!story) {
            return res.status(404).json({
                success: false,
                message: "Success story not found"
            });
        }

        if (story.status !== "unpublished") {
            return res.status(400).json({
                success: false,
                message: `Only unpublished success stories can be republished. Current status: ${story.status}`
            });
        }

        story.status = "approved";
        story.reviewedAt = new Date();
        story.reviewedBy = req.user?.userId as any;
        await story.save();

        await notifyUser({
            recipientId: story.talentId,
            type: "featured_nomination_update",
            title: "Success Story Republished",
            message: `Your success story for "${story.projectName || "your project"}" has been republished to the platform showcase.`,
            referenceId: story._id,
            referenceType: "System"
        });

        await logAdminAction({
            adminId: req.user?.userId,
            action: "success_story_republish",
            targetType: "System",
            targetId: story._id,
            details: { previousUnpublishReason: story.unpublishReason },
            req
        });

        res.status(200).json({
            success: true,
            message: "Success story republished successfully",
            story
        });
    } catch (error) {
        console.error("Republish success story error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while republishing success story"
        });
    }
};

