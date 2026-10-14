const mongoose = require("mongoose");

const auditionSchema = new mongoose.Schema(
    {
        applicationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Application",
            required: true
        },

        opportunityId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Opportunity",
            required: true
        },

        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },

        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true
        },

        talentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            enum: [
                "self_tape",
                "in_person_audition",
                "video_interview"
            ],
            required: true
        },

        role: {
            type: String,
            trim: true
        },

        sceneBrief: {
            type: String,
            trim: true
        },

        instructions: {
            type: String,
            trim: true
        },

        scriptUrl: {
            type: String,
            trim: true
        },

        meetingLink: {
            type: String,
            trim: true
        },

        location: {
            type: String,
            trim: true
        },

        scheduledAt: {
            type: Date
        },

        deadline: {
            type: Date
        },

        status: {
            type: String,
            enum: [
                "requested",
                "scheduled",
                "submitted",
                "reviewed",
                "completed",
                "cancelled"
            ],
            default: "requested"
        },

        // Self-Tape Talent Submission
        selfTapeSubmission: {
            videoUrl: {
                type: String,
                trim: true
            },
            thumbnailUrl: {
                type: String,
                trim: true
            },
            durationSeconds: {
                type: Number
            },
            fileSizeBytes: {
                type: Number
            },
            notes: {
                type: String,
                trim: true
            },
            submittedAt: {
                type: Date
            }
        },

        // Organization Feedback & Review
        organizationFeedback: {
            type: String,
            trim: true
        },
        organizationRating: {
            type: Number,
            min: 1,
            max: 5
        },
        reviewedAt: {
            type: Date
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        // Vismaya Admin Approval
        vismayaApproval: {
            type: String,
            enum: [
                "pending",
                "approved",
                "rejected"
            ],
            default: "pending"
        },
        vismayaReviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        vismayaReviewedAt: {
            type: Date
        },
        vismayaRejectionReason: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

auditionSchema.index({ applicationId: 1 }, { unique: true });
auditionSchema.index({ talentId: 1, status: 1 });
auditionSchema.index({ organizationId: 1, status: 1 });
auditionSchema.index({ vismayaApproval: 1, createdAt: -1 });

const Audition = mongoose.model("Audition", auditionSchema);

module.exports = Audition;