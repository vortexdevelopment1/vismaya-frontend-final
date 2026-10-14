const mongoose = require("mongoose");

const mediaItemSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        mediaType: {
            type: String,
            enum: [
                "photo",
                "video",
                "document",
                "external_link"
            ],
            required: true
        },

        category: {
            type: String,
            enum: [
                "headshot",
                "full_length",
                "lookbook",
                "showreel",
                "audition_clip",
                "scene_work",
                "resume_pdf",
                "certificate",
                "press_clipping",
                "other"
            ],
            default: "other"
        },

        title: {
            type: String,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        url: {
            type: String,
            required: true,
            trim: true
        },

        thumbnailUrl: {
            type: String,
            trim: true
        },

        mimeType: {
            type: String,
            trim: true
        },

        fileSizeBytes: {
            type: Number
        },

        durationSeconds: {
            type: Number
        },

        displayOrder: {
            type: Number,
            default: 0
        },

        visibility: {
            type: String,
            enum: ["public", "industry_only", "private"],
            default: "industry_only"
        },

        rightsConfirmed: {
            type: Boolean,
            required: true,
            default: true
        },

        contentHash: {
            type: String,
            trim: true
        },

        isMainProfilePhoto: {
            type: Boolean,
            default: false
        },

        isFeatured: {
            type: Boolean,
            default: false
        },

        isNominatedFeatured: {
            type: Boolean,
            default: false
        },

        disputeState: {
            type: String,
            enum: ["none", "disputed", "resolved"],
            default: "none"
        },

        disputeReason: {
            type: String,
            trim: true
        },

        disputedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        // Moderation State Machine
        moderationState: {
            type: String,
            enum: [
                "uploaded",
                "automated_check",
                "live",
                "restricted",
                "admin_review",
                "removed"
            ],
            default: "live"
        },

        moderationNotes: {
            type: String,
            trim: true
        },

        moderatedAt: {
            type: Date
        },

        moderatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

mediaItemSchema.pre("save", function () {
    if (!this.contentHash && this.url) {
        const crypto = require("crypto");
        this.contentHash = crypto.createHash("sha256").update(this.url.trim()).digest("hex");
    }
});

mediaItemSchema.index({ owner: 1, contentHash: 1 }, { unique: true, partialFilterExpression: { contentHash: { $type: "string" } } });
mediaItemSchema.index({ owner: 1, visibility: 1, moderationState: 1 });
mediaItemSchema.index({ moderationState: 1, createdAt: -1 });

const MediaItem = mongoose.model("MediaItem", mediaItemSchema);

module.exports = MediaItem;
