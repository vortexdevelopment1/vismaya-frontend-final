const Audition = require("../models/audition.model");
const Application = require("../models/application.model");
const Opportunity = require("../models/opportunity.model");
const Project = require("../models/project.model");
const Organization = require("../models/organization.model");
const { notifyUser } = require("../services/notification.service");
const { isSafeUrl } = require("../utils/sanitize.util");

const createAudition = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { applicationId } = req.params;

        const {
            type,
            role,
            sceneBrief,
            instructions,
            scriptUrl,
            meetingLink,
            location,
            scheduledAt,
            deadline
        } = req.body;

        if (!type || !["self_tape", "in_person_audition", "video_interview"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Valid audition type is required: 'self_tape', 'in_person_audition', or 'video_interview'"
            });
        }

        // Validate type-specific requirements
        if (type === "video_interview" && !scheduledAt) {
            return res.status(400).json({
                success: false,
                message: "Scheduled date and time is required for video interviews"
            });
        }

        if (type === "in_person_audition" && (!scheduledAt || !location)) {
            return res.status(400).json({
                success: false,
                message: "Scheduled time and location are required for in-person auditions"
            });
        }

        // Find application
        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        // U2: Only for shortlisted applications
        if (application.status !== "shortlisted") {
            return res.status(400).json({
                success: false,
                message: `Audition or interview can only be scheduled for shortlisted applications. Current status is ${application.status}`
            });
        }

        // U2: One audition per application
        const existingAudition = await Audition.findOne({ applicationId });
        if (existingAudition) {
            return res.status(409).json({
                success: false,
                message: "An audition request already exists for this application"
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

        // U2: Deadline equals opportunity deadline
        const finalDeadline = opportunity.deadline || (deadline ? new Date(deadline) : undefined);

        const audition = await Audition.create({
            applicationId,
            opportunityId: opportunity._id,
            projectId: project._id,
            organizationId: organization._id,
            talentId: application.talentId,
            type,
            role: role || opportunity.role,
            sceneBrief,
            instructions,
            scriptUrl,
            meetingLink,
            location,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
            deadline: finalDeadline,
            status: type === "self_tape" ? "requested" : "scheduled",
            vismayaApproval: "pending"
        });

        // U1: Talent is NOT notified here; talent is notified ONLY after admin approves.
        res.status(201).json({
            success: true,
            message: `${type.replace(/_/g, " ")} request submitted for Vismaya moderation`,
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

const submitSelfTape = async (req, res) => {
    try {
        const talentId = req.user.userId;
        const { auditionId } = req.params;
        const { videoUrl, thumbnailUrl, durationSeconds, fileSizeBytes, notes } = req.body;

        if (!videoUrl || !isSafeUrl(videoUrl)) {
            return res.status(400).json({
                success: false,
                message: "A valid and safe video URL is required for self-tape submission"
            });
        }

        const audition = await Audition.findById(auditionId);
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

        // Validate admin approval
        if (audition.vismayaApproval !== "approved") {
            return res.status(400).json({
                success: false,
                message: "Audition request has not been approved by Vismaya moderation"
            });
        }

        // Validate deadline
        if (audition.deadline && new Date() > new Date(audition.deadline)) {
            return res.status(400).json({
                success: false,
                message: "Self-tape submission deadline has passed"
            });
        }

        // U2: Atomic single submission update
        const updatedAudition = await Audition.findOneAndUpdate(
            {
                _id: auditionId,
                talentId,
                type: "self_tape",
                "selfTapeSubmission.submittedAt": { $exists: false }
            },
            {
                $set: {
                    selfTapeSubmission: {
                        videoUrl,
                        thumbnailUrl,
                        durationSeconds,
                        fileSizeBytes,
                        notes,
                        submittedAt: new Date()
                    },
                    status: "submitted"
                }
            },
            { new: true, returnDocument: "after" }
        );

        if (!updatedAudition) {
            return res.status(400).json({
                success: false,
                message: "Self-tape has already been submitted. Multiple submissions are prohibited."
            });
        }

        // U3: Notify organization when self-tape is submitted
        const org = await Organization.findById(updatedAudition.organizationId);
        if (org) {
            await notifyUser({
                recipientId: org.userId,
                type: "audition_submitted",
                title: "Self-Tape Submitted",
                message: `Talent has submitted a self-tape for "${updatedAudition.role || 'Audition'}".`,
                referenceId: updatedAudition._id,
                referenceType: "Audition"
            });
        }

        res.status(200).json({
            success: true,
            message: "Self-tape submitted successfully",
            audition: updatedAudition
        });

    } catch (error) {
        console.error("Submit self-tape error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while submitting self-tape"
        });
    }
};

const reviewAuditionSubmission = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { auditionId } = req.params;
        const { organizationFeedback, organizationRating } = req.body;

        const audition = await Audition.findById(auditionId);
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
        audition.reviewedBy = userId;
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

const getAuditionsForApplication = async (req, res) => {
    try {
        const { applicationId } = req.params;

        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        // Validate access: Talent, owning Organization, or Admin
        if (req.user.role === "talent" && application.talentId.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        if (req.user.role === "organization") {
            const organization = await Organization.findOne({ userId: req.user.userId });
            const opportunity = await Opportunity.findById(application.opportunityId);
            const project = opportunity ? await Project.findById(opportunity.projectId) : null;
            if (!organization || !project || project.organizationId.toString() !== organization._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied"
                });
            }
        }

        const filter = { applicationId };
        if (req.user.role === "talent") {
            filter.vismayaApproval = "approved";
        }

        const auditions = await Audition.find(filter).sort({ createdAt: -1 });

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

const getMyAuditions = async (req, res) => {
    try {
        const talentId = req.user.userId;

        const auditions = await Audition.find({ talentId, vismayaApproval: "approved" })
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

const getOrganizationAuditions = async (req, res) => {
    try {
        const userId = req.user.userId;

        const organization = await Organization.findOne({ userId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        const auditions = await Audition.find({ organizationId: organization._id })
            .populate("talentId", "name email")
            .populate("opportunityId", "title role")
            .populate("projectId", "projectName")
            .sort({ createdAt: -1 });

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

module.exports = {
    createAudition,
    submitSelfTape,
    reviewAuditionSubmission,
    getAuditionsForApplication,
    getMyAuditions,
    getOrganizationAuditions
};