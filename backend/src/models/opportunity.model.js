const mongoose = require("mongoose");

const customQuestionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: true,
        trim: true
    },
    isRequired: {
        type: Boolean,
        default: false
    }
}, { _id: true });

const opportunitySchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        summary: {
            type: String,
            required: true,
            trim: true
        },

        role: {
            type: String,
            required: true,
            trim: true
        },

        location: {
            type: String,
            required: true,
            trim: true
        },

        deadline: {
            type: Date,
            required: true
        },

        remuneration: {
            type: String,
            trim: true
        },

        positionsCount: {
            type: Number,
            min: 1
        },

        // Eligibility Requirements
        eligibility: {
            professions: [{ type: String, trim: true }],
            minExperienceYears: { type: Number, default: 0 },
            languages: [{ type: String, trim: true }],
            workingCities: [{ type: String, trim: true }],
            skills: [{ type: String, trim: true }]
        },

        // Custom Screening Questions
        customQuestions: [customQuestionSchema],

        // Lifecycle & Vismaya Review State Machine
        status: {
            type: String,
            enum: [
                "pending",
                "under_vismaya_review",
                "corrections_requested",
                "published",
                "rejected",
                "cancellation_requested",
                "cancelled",
                "closed",
                "completed"
            ],
            default: "pending"
        },

        statusBeforeCancellationRequest: {
            type: String
        },

        completionRequested: {
            type: Boolean,
            default: false
        },
        completionRequestedAt: {
            type: Date
        },

        // Review notes & rejection reasons
        rejectionReason: {
            type: String,
            trim: true
        },

        correctionNotes: {
            type: String,
            trim: true
        },
        correctionRequestedAt: {
            type: Date
        },
        correctionRequestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        // Submission & Review Timestamps
        submittedAt: {
            type: Date,
            default: Date.now
        },
        resubmittedAt: {
            type: Date
        },
        approvedAt: {
            type: Date
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        // Cancellation workflow
        cancellationReason: {
            type: String,
            trim: true
        },
        cancellationRequestedAt: {
            type: Date
        },
        cancellationReviewedAt: {
            type: Date
        },
        cancellationReviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        // Timestamps
        publishedAt: {
            type: Date
        },
        closedAt: {
            type: Date
        },
        autoClosedAt: {
            type: Date
        },
        completedAt: {
            type: Date
        },
        completedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

// Helpful compound index for talent queries
opportunitySchema.index({ status: 1, deadline: 1 });
opportunitySchema.index({ projectId: 1 });

const Opportunity = mongoose.model("Opportunity", opportunitySchema);

module.exports = Opportunity;