const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
    {
        reporterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        targetType: {
            type: String,
            enum: ["Opportunity", "User", "MediaItem"],
            required: true
        },

        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },

        reason: {
            type: String,
            enum: [
                "misleading_information",
                "scam_or_fraud",
                "offensive_content",
                "copyright_infringement",
                "impersonation",
                "other"
            ],
            required: true
        },

        details: {
            type: String,
            trim: true
        },

        status: {
            type: String,
            enum: [
                "pending",
                "investigating",
                "resolved",
                "dismissed"
            ],
            default: "pending"
        },

        adminNotes: {
            type: String,
            trim: true
        },

        resolvedAt: {
            type: Date
        },

        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

reportSchema.index({ reporterId: 1, targetType: 1, targetId: 1 }, { unique: true });
reportSchema.index({ status: 1, createdAt: -1 });

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;
