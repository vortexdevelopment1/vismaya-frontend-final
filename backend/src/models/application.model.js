const mongoose = require("mongoose");

const customAnswerSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId
    },
    questionText: {
        type: String,
        trim: true
    },
    answerText: {
        type: String,
        trim: true
    }
}, { _id: false });

const applicationSchema = new mongoose.Schema(
    {
        opportunityId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Opportunity",
            required: true
        },

        talentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Application content
        coverNote: {
            type: String,
            trim: true
        },

        customAnswers: [customAnswerSchema],

        consentGiven: {
            type: Boolean,
            default: false
        },

        eligibilityWarnings: [{
            type: String,
            trim: true
        }],

        // Lifecycle State Machine
        status: {
            type: String,
            enum: [
                "applied",
                "under_review",
                "shortlisted",
                "selected",
                "not_selected",
                "withdrawn"
            ],
            default: "applied"
        },

        // Withdrawal Information
        withdrawalReason: {
            type: String,
            trim: true
        },
        withdrawnAt: {
            type: Date
        },

        // Reapplication Permission Flow (Explicit Admin Approval)
        reapplicationRequested: {
            type: Boolean,
            default: false
        },
        reapplicationRequestedAt: {
            type: Date
        },
        reapplicationRequestReason: {
            type: String,
            trim: true
        },
        reapplicationApproved: {
            type: Boolean,
            default: false
        },
        reapplicationReviewedAt: {
            type: Date
        },
        reapplicationReviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        reapplicationDecisionNotes: {
            type: String,
            trim: true
        },

        // Selection / Rejection Audit
        selectedAt: {
            type: Date
        },
        selectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        notSelectedAt: {
            type: Date
        },
        notSelectedReason: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

// Compound unique index to prevent race-condition duplicate applications
applicationSchema.index({ opportunityId: 1, talentId: 1 }, { unique: true });
applicationSchema.index({ talentId: 1, status: 1 });
applicationSchema.index({ opportunityId: 1, status: 1 });

const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;