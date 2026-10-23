import { Request, Response } from "express";
import Audition from "../models/audition.model.js";
import Application from "../models/application.model.js";
import Opportunity from "../models/opportunity.model.js";
import Project from "../models/project.model.js";
import Organization from "../models/organization.model.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import { notifyUser } from "../services/notification.service.js";
import { logAdminAction } from "../services/audit.service.js";
import { isSafeUrl } from "../utils/sanitize.util.js";
import { AUDITION_CONFIG, maxResubmissionsAfterRejection } from "../config/audition.config.js";

export const createAudition = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const applicationId = req.params.applicationId || req.body?.applicationId;

        const {
            type,
            role,
            sceneBrief,
            instructions,
            scriptUrl,
            meetingLink,
            location,
            venue,
            scheduledAt,
            preferredDate,
            deadline,
            note
        } = req.body;

        // Enforce live audition feature flag
        if (!AUDITION_CONFIG.ENABLE_LIVE_AUDITION) {
            if (type && type !== "self_tape" && type !== "Audition" && type !== "self tape" && type !== "Self-tape" && type !== "self-tape") {
                return res.status(400).json({
                    success: false,
                    message: "Live auditions are currently disabled. Only self-tape auditions are supported."
                });
            }
        }

        // Normalize format/type
        let normType: "self_tape" | "in_person_audition" | "video_interview" = "self_tape";
        if (type === "video_interview" || type === "Virtual Interview" || type === "online") {
            normType = "video_interview";
        } else if (type === "in_person_audition" || type === "Screen Test" || type === "in-person" || type === "in_person") {
            normType = "in_person_audition";
        } else {
            normType = "self_tape";
        }

        const finalScheduledAt = scheduledAt ? new Date(scheduledAt) : (preferredDate ? new Date(preferredDate) : (normType !== "self_tape" ? new Date(Date.now() + 2 * 86400000) : undefined));
        const finalLocation = location || venue || (normType === "in_person_audition" ? "Vismaya Studio, Mumbai" : undefined);
        const finalMeetingLink = meetingLink || (normType === "video_interview" ? "https://meet.google.com/vsm-audition-session" : undefined);
        const finalInstructions = instructions || note || sceneBrief || "Please follow casting directions.";

        // Find application
        const application = await Application.findById(String(applicationId));
        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        // U2: Only for shortlisted applications (or auto-shortlist if applied/under_review)
        if (application.status !== "shortlisted") {
            if (["applied", "under_review"].includes(application.status)) {
                application.status = "shortlisted";
                await application.save();
            } else {
                return res.status(400).json({
                    success: false,
                    message: `Audition or interview can only be scheduled for shortlisted applications. Current status is ${application.status}`
                });
            }
        }

        // U2: One audition per application
        let existingAudition = await Audition.findOne({ applicationId: String(applicationId) });
        if (existingAudition) {
            return res.status(409).json({
                success: false,
                message: "An audition request already exists for this application",
                audition: existingAudition
            });
        }

        // Find opportunity & project
        const opportunity = await Opportunity.findById(application.opportunityId);
        if (!opportunity) {
            return res.status(404).json({
                success: false,
                message: "Opportunity not found"
            });
        }

        const project = await Project.findById(opportunity.projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        // U2: Verify owning organization
        const organization = await Organization.findOne({ userId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        if (project.organizationId.toString() !== organization._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only schedule auditions for your own opportunities"
            });
        }

        // U2: Deadline requirement (strictly mandatory for self-tape audition)
        if (normType === "self_tape" && !deadline) {
            return res.status(400).json({
                success: false,
                message: "A submit by deadline date and time is required for self-tape auditions."
            });
        }
        const finalDeadline = deadline ? new Date(deadline) : (opportunity.deadline ? new Date(opportunity.deadline) : undefined);
        if (normType === "self_tape" && (!finalDeadline || isNaN(finalDeadline.getTime()))) {
            return res.status(400).json({
                success: false,
                message: "A valid submit by deadline date and time is required for self-tape auditions."
            });
        }

        const audition = await Audition.create({
            applicationId: String(applicationId),
            opportunityId: opportunity._id,
            projectId: project._id,
            organizationId: organization._id,
            talentId: application.talentId,
            type: normType,
            role: role || opportunity.role,
            sceneBrief: sceneBrief || finalInstructions,
            instructions: finalInstructions,
            scriptUrl,
            meetingLink: finalMeetingLink,
            location: finalLocation,
            scheduledAt: finalScheduledAt,
            deadline: finalDeadline,
            status: "requested",
            vismayaApproval: "pending"
        });

        // Notify Admins for relay moderation (talent is NOT notified until admin relays)
        const adminUsers = await User.find({ role: "admin" }).select("_id");
        for (const admin of adminUsers) {
            await notifyUser({
                recipientId: admin._id,
                type: "audition_request_submitted",
                title: "Audition Request Submitted",
                message: `An audition request for "${audition.role || opportunity.role || 'Role'}" in "${opportunity.title}" requires moderation before relay to talent.`,
                referenceId: audition._id,
                referenceType: "Audition",
                sendEmailAlert: true
            });
        }

        res.status(201).json({
            success: true,
            message: `${normType.replace(/_/g, " ")} requested successfully and submitted for Vismaya moderation`,
            audition
        });

    } catch (error) {
        console.error("Create audition error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while scheduling audition"
        });
    }
};

function isAllowedVideoType(url: string, mimeType?: string): boolean {
    if (mimeType && (AUDITION_CONFIG.SELF_TAPE_ALLOWED_TYPES as readonly string[]).includes(mimeType)) {
        return true;
    }
    const cleanUrl = url.split("?")[0].toLowerCase();
    return cleanUrl.endsWith(".mp4") || cleanUrl.endsWith(".mov") || cleanUrl.endsWith(".webm");
}

export const submitSelfTape = async (req: Request, res: Response): Promise<any> => {
    try {
        const talentId = req.user?.userId;
        const { auditionId } = req.params;
        const { videoUrl, videoUrls, videos, thumbnailUrl, durationSeconds, fileSizeBytes, notes } = req.body;

        const audition = await Audition.findById(String(auditionId));
        if (!audition) {
            return res.status(404).json({
                success: false,
                message: "Audition request not found"
            });
        }

        // Validate talent ownership
        if (audition.talentId.toString() !== talentId) {
            return res.status(403).json({
                success: false,
                message: "You can only submit self-tapes for your own audition requests"
            });
        }

        // Validate type
        if (audition.type !== "self_tape") {
            return res.status(400).json({
                success: false,
                message: "This request is not a self-tape audition"
            });
        }

        // Do not allow submission if the audition request itself is closed or cancelled
        if (audition.status === "cancelled" || audition.status === "completed") {
            return res.status(400).json({
                success: false,
                message: "Audition request is closed or cancelled. Resubmission is not permitted."
            });
        }

        // Validate deadline
        if (audition.deadline && new Date() > new Date(audition.deadline)) {
            return res.status(400).json({
                success: false,
                message: "Self-tape submission deadline has passed"
            });
        }

        const isResubmission = audition.status === "rejected";

        if (isResubmission) {
            const currentCount = audition.resubmissionCount || 0;
            if (currentCount >= maxResubmissionsAfterRejection) {
                return res.status(403).json({
                    success: false,
                    message: "Resubmission limit reached. Please contact Vismaya support."
                });
            }
        } else {
            // Initial submission validation
            if (audition.selfTapeSubmission?.submittedAt || audition.status === "submitted" || audition.status === "forwarded_to_org") {
                return res.status(400).json({
                    success: false,
                    message: "Self-tape has already been submitted for this audition and is under review. Second uploads or replacements are not permitted."
                });
            }

            if (audition.vismayaApproval !== "approved" && audition.status !== "requested") {
                return res.status(403).json({
                    success: false,
                    message: "Cannot submit self-tape: audition request is awaiting Vismaya approval or has been rejected"
                });
            }

            if (audition.status !== "requested") {
                return res.status(400).json({
                    success: false,
                    message: `Self-tape can only be submitted for requested auditions. Current status is ${audition.status}.`
                });
            }
        }

        // Normalize video list
        let videoList: any[] = [];
        if (Array.isArray(videos) && videos.length > 0) {
            videoList = videos.map((v: any) => ({
                videoUrl: typeof v === "string" ? v : (v.videoUrl || v.url),
                durationSeconds: v.durationSeconds || durationSeconds,
                fileSizeBytes: v.fileSizeBytes || fileSizeBytes,
                thumbnailUrl: v.thumbnailUrl || thumbnailUrl,
                fileName: v.fileName,
                mimeType: v.mimeType
            }));
        } else if (Array.isArray(videoUrls) && videoUrls.length > 0) {
            videoList = videoUrls.map((u: string) => ({ videoUrl: u, durationSeconds, fileSizeBytes, thumbnailUrl }));
        } else if (videoUrl) {
            videoList = [{ videoUrl, durationSeconds, fileSizeBytes, thumbnailUrl }];
        }

        if (videoList.length === 0) {
            return res.status(400).json({
                success: false,
                message: "A valid and safe video URL is required for self-tape submission"
            });
        }

        if (videoList.length > AUDITION_CONFIG.SELF_TAPE_MAX_VIDEOS_PER_AUDITION) {
            return res.status(400).json({
                success: false,
                message: `You can upload up to ${AUDITION_CONFIG.SELF_TAPE_MAX_VIDEOS_PER_AUDITION} video`
            });
        }

        const maxBytes = AUDITION_CONFIG.SELF_TAPE_MAX_FILE_MB * 1024 * 1024;
        const maxDurationSec = AUDITION_CONFIG.SELF_TAPE_MAX_DURATION_MIN * 60;

        for (const item of videoList) {
            if (!item.videoUrl || !isSafeUrl(item.videoUrl)) {
                return res.status(400).json({
                    success: false,
                    message: "A valid and safe video URL is required for self-tape submission"
                });
            }
            if (!isAllowedVideoType(item.videoUrl, item.mimeType)) {
                return res.status(400).json({
                    success: false,
                    message: "Only MP4, MOV or WebM files are allowed"
                });
            }
            const itemSize = item.fileSizeBytes || fileSizeBytes;
            if (itemSize && itemSize > maxBytes) {
                return res.status(400).json({
                    success: false,
                    message: `File is too large. Maximum is ${AUDITION_CONFIG.SELF_TAPE_MAX_FILE_MB} MB`
                });
            }
            const itemDuration = item.durationSeconds || durationSeconds;
            if (itemDuration && itemDuration > maxDurationSec) {
                return res.status(400).json({
                    success: false,
                    message: `Video duration exceeds maximum of ${AUDITION_CONFIG.SELF_TAPE_MAX_DURATION_MIN} minutes`
                });
            }
        }

        const primaryVideo = videoList[0];
        const allUrls = videoList.map((v: any) => v.videoUrl);

        if (isResubmission) {
            if (!audition.rejectionHistory) {
                audition.rejectionHistory = [];
            }
            audition.rejectionHistory.push({
                videoUrl: audition.selfTapeSubmission?.videoUrl || audition.selfTapeSubmission?.videos?.[0]?.videoUrl,
                reason: audition.vismayaRejectionReason || "Self-tape rejected by Vismaya moderation",
                rejectedBy: audition.vismayaReviewedBy,
                rejectedAt: audition.vismayaReviewedAt || new Date()
            });
            audition.resubmissionCount = (audition.resubmissionCount || 0) + 1;
        }

        audition.selfTapeSubmission = {
            videoUrl: primaryVideo.videoUrl,
            videoUrls: allUrls,
            videos: videoList,
            thumbnailUrl: primaryVideo.thumbnailUrl || thumbnailUrl,
            durationSeconds: primaryVideo.durationSeconds || durationSeconds,
            fileSizeBytes: primaryVideo.fileSizeBytes || fileSizeBytes,
            notes: notes || audition.selfTapeSubmission?.notes,
            submittedAt: new Date()
        };
        audition.status = "submitted";
        audition.vismayaApproval = "pending";

        await audition.save();

        if (isResubmission) {
            await logAdminAction({
                adminId: talentId as any,
                action: "AUDITION_SELF_TAPE_RESUBMIT",
                targetType: "Audition",
                targetId: audition._id,
                details: `Self-tape resubmitted by talent (attempt ${audition.resubmissionCount}).`,
                req
            });

            // Notify Admins of resubmission
            try {
                const adminUsers = await User.find({ role: "admin", status: "active" }).select("_id");
                for (const admin of adminUsers) {
                    await notifyUser({
                        recipientId: admin._id,
                        type: "audition_resubmitted",
                        title: "Audition Tape Resubmitted",
                        message: `Talent has resubmitted an audition tape for "${audition.role || 'Audition'}". Review required before relay to casting team.`,
                        referenceId: audition._id,
                        referenceType: "Audition",
                        sendEmailAlert: false
                    });
                }
            } catch (notifErr: any) {
                console.warn("[SubmitSelfTape] Admin notification warning:", notifErr.message);
            }
        } else {
            // Notify Admins for initial review before relaying to organization
            try {
                const adminUsers = await User.find({ role: "admin", status: "active" }).select("_id");
                for (const admin of adminUsers) {
                    await notifyUser({
                        recipientId: admin._id,
                        type: "audition_selftape_submitted",
                        title: "Self-Tape Submitted",
                        message: `Talent has submitted a self-tape for "${audition.role || 'Audition'}". Review required before relay to casting team.`,
                        referenceId: audition._id,
                        referenceType: "Audition",
                        sendEmailAlert: true
                    });
                }
            } catch (notifErr: any) {
                console.warn("[SubmitSelfTape] Admin notification warning:", notifErr.message);
            }
        }

        res.status(200).json({
            success: true,
            message: isResubmission ? "Self-tape resubmitted successfully and is pending Vismaya review" : "Self-tape submitted successfully",
            audition
        });

    } catch (error) {
        console.error("Submit self-tape error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while submitting self-tape"
        });
    }
};

export const reviewAuditionSubmission = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { auditionId } = req.params;
        const { organizationFeedback, organizationRating } = req.body;

        const audition = await Audition.findById(String(auditionId));
        if (!audition) {
            return res.status(404).json({
                success: false,
                message: "Audition not found"
            });
        }

        // Find organization & verify ownership
        const organization = await Organization.findOne({ userId });
        if (!organization || audition.organizationId.toString() !== organization._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only review auditions for your own organization"
            });
        }

        // U3: Require existing submission for self-tape
        if (audition.type === "self_tape" && (!audition.selfTapeSubmission || !audition.selfTapeSubmission.submittedAt)) {
            return res.status(400).json({
                success: false,
                message: "Cannot review self-tape before talent submits tape"
            });
        }

        audition.organizationFeedback = organizationFeedback || "";
        if (organizationRating !== undefined && organizationRating !== null) {
            const numRating = Number(organizationRating);
            if (numRating >= 1 && numRating <= 5) {
                audition.organizationRating = numRating;
            }
        }
        audition.reviewedAt = new Date();
        audition.reviewedBy = userId as any;
        // U3: Ignore client-provided status and set to 'reviewed'
        audition.status = "reviewed";

        await audition.save();

        // U3: Notify talent of feedback
        await notifyUser({
            recipientId: audition.talentId,
            type: "audition_reviewed",
            title: "Audition Feedback Received",
            message: `Your audition has been reviewed by the casting team.`,
            referenceId: audition._id,
            referenceType: "Audition"
        });

        res.status(200).json({
            success: true,
            message: "Audition review recorded successfully",
            audition
        });

    } catch (error) {
        console.error("Review audition error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while reviewing audition"
        });
    }
};

export const getAuditionsForApplication = async (req: Request, res: Response): Promise<any> => {
    try {
        const { applicationId } = req.params;

        const application = await Application.findById(String(applicationId));
        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        // Validate access: Talent, owning Organization, or Admin
        if (req.user?.role === "talent" && application.talentId.toString() !== req.user?.userId) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        if (req.user?.role === "organization") {
            const organization = await Organization.findOne({ userId: req.user?.userId });
            const opportunity = await Opportunity.findById(application.opportunityId);
            const project = opportunity ? await Project.findById(opportunity.projectId) : null;
            if (!organization || !project || project.organizationId.toString() !== organization._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied"
                });
            }
        }

        const queryFilter: any = { applicationId: String(applicationId) };
        if (req.user?.role === "talent") {
            queryFilter.talentId = req.user.userId;
            queryFilter.$or = [
                { vismayaApproval: "approved" },
                { status: { $in: ["submitted", "forwarded_to_org", "rejected", "reviewed", "completed"] } }
            ];
        }

        const rawAuditions = await Audition.find(queryFilter)
            .populate("opportunityId", "title role location deadline")
            .populate("projectId", "projectName")
            .populate("organizationId", "organizationName")
            .sort({ createdAt: -1 });

        const isOrg = req.user?.role === "organization";
        const auditions = rawAuditions.map(aud => {
            const doc = aud.toObject ? aud.toObject() : { ...aud };
            const isApprovedByAdmin = doc.vismayaApproval === "approved" && (doc.status === "forwarded_to_org" || doc.status === "reviewed");
            if (isOrg && doc.type === "self_tape" && !isApprovedByAdmin) {
                delete doc.selfTapeSubmission;
                delete doc.vismayaRejectionReason;
                delete doc.rejectionHistory;
                if (doc.status === "submitted" || doc.status === "rejected") {
                    doc.status = "requested";
                }
            }
            return doc;
        });

        res.status(200).json({
            success: true,
            count: auditions.length,
            auditions
        });

    } catch (error) {
        console.error("Get application auditions error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching auditions"
        });
    }
};

export const rescheduleAudition = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { auditionId } = req.params;
        const { scheduledAt, preferredDate, location, venue, meetingLink, instructions, note } = req.body;

        const audition = await Audition.findById(String(auditionId));
        if (!audition) {
            return res.status(404).json({ success: false, message: "Audition not found" });
        }

        const organization = await Organization.findOne({ userId });
        if (!organization || audition.organizationId.toString() !== organization._id.toString()) {
            return res.status(403).json({ success: false, message: "You can only reschedule auditions for your own organization" });
        }

        const newDate = scheduledAt ? new Date(scheduledAt) : (preferredDate ? new Date(preferredDate) : audition.scheduledAt);
        if (newDate) audition.scheduledAt = newDate;
        if (location || venue) audition.location = location || venue;
        if (meetingLink) audition.meetingLink = meetingLink;
        if (instructions || note) audition.instructions = instructions || note;

        await audition.save();

        const opportunity = await Opportunity.findById(audition.opportunityId);
        const methodLabel = audition.type === "video_interview"
            ? "Live Virtual Audition (Google Meet / Zoom)"
            : audition.type === "in_person_audition"
                ? "In-Person Audition / Screen Test"
                : "Video Self-Tape Submission";

        const dateStr = audition.scheduledAt
            ? new Date(audition.scheduledAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
            : "TBD";

        const venueOrLinkStr = audition.type === "video_interview"
            ? (audition.meetingLink ? `Meeting Link: ${audition.meetingLink}` : "")
            : audition.type === "in_person_audition"
                ? (audition.location ? `Venue: ${audition.location}` : "")
                : "";

        const notifMessage = `Your audition for ${audition.role || opportunity?.role || 'Role'} in "${opportunity?.title || 'Opportunity'}" has been rescheduled. Method: ${methodLabel}. New Date & Time: ${dateStr}.${venueOrLinkStr ? ` ${venueOrLinkStr}.` : ""}${audition.instructions ? ` Instructions: ${audition.instructions}` : ""}`;

        await notifyUser({
            recipientId: audition.talentId,
            type: "audition_rescheduled",
            title: "Audition Rescheduled",
            message: notifMessage,
            referenceId: audition.applicationId,
            referenceType: "Application",
            sendEmailAlert: true
        });

        res.status(200).json({
            success: true,
            message: "Audition rescheduled successfully",
            audition
        });
    } catch (error) {
        console.error("Reschedule audition error:", error);
        res.status(500).json({ success: false, message: "Failed to reschedule audition" });
    }
};

export const cancelAudition = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { auditionId } = req.params;
        const { reason } = req.body;

        const audition = await Audition.findById(String(auditionId));
        if (!audition) {
            return res.status(404).json({ success: false, message: "Audition not found" });
        }

        const organization = await Organization.findOne({ userId });
        if (!organization || audition.organizationId.toString() !== organization._id.toString()) {
            return res.status(403).json({ success: false, message: "You can only cancel auditions for your own organization" });
        }

        audition.status = "cancelled";
        await audition.save();

        const opportunity = await Opportunity.findById(audition.opportunityId);
        const notifMessage = `Your audition for ${audition.role || opportunity?.role || 'Role'} in "${opportunity?.title || 'Opportunity'}" has been cancelled by the organization.${reason ? ` Reason: ${reason}` : ""}`;

        await notifyUser({
            recipientId: audition.talentId,
            type: "audition_cancelled",
            title: "Audition Cancelled",
            message: notifMessage,
            referenceId: audition.applicationId,
            referenceType: "Application",
            sendEmailAlert: true
        });

        res.status(200).json({
            success: true,
            message: "Audition cancelled successfully",
            audition
        });
    } catch (error) {
        console.error("Cancel audition error:", error);
        res.status(500).json({ success: false, message: "Failed to cancel audition" });
    }
};

export const getMyAuditions = async (req: Request, res: Response): Promise<any> => {
    try {
        const talentId = req.user?.userId;

        const auditions = await Audition.find({
            talentId,
            $or: [
                { vismayaApproval: "approved" },
                { status: { $in: ["submitted", "forwarded_to_org", "rejected", "reviewed", "completed"] } }
            ]
        })
            .populate("opportunityId", "title role location deadline")
            .populate("projectId", "projectName")
            .populate("organizationId", "organizationName")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: auditions.length,
            auditions
        });

    } catch (error) {
        console.error("Get my auditions error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching your auditions"
        });
    }
};

export const getOrganizationAuditions = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;

        const organization = await Organization.findOne({ userId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        const rawAuditions = await Audition.find({ organizationId: organization._id })
            .populate("talentId", "name email")
            .populate("opportunityId", "title role")
            .populate("projectId", "projectName")
            .sort({ createdAt: -1 });

        const auditions = rawAuditions.map(aud => {
            const doc = aud.toObject ? aud.toObject() : { ...aud };
            const isApprovedByAdmin = doc.vismayaApproval === "approved" && (doc.status === "forwarded_to_org" || doc.status === "reviewed");
            if (doc.type === "self_tape" && !isApprovedByAdmin) {
                delete doc.selfTapeSubmission;
                delete doc.vismayaRejectionReason;
                delete doc.rejectionHistory;
                if (doc.status === "submitted" || doc.status === "rejected") {
                    doc.status = "requested";
                }
            }
            return doc;
        });

        res.status(200).json({
            success: true,
            count: auditions.length,
            auditions
        });

    } catch (error) {
        console.error("Get organization auditions error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching organization auditions"
        });
    }
};
