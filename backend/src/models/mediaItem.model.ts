import mongoose, { Schema, Document, Model, Types } from "mongoose";
import crypto from "crypto";

export interface IMediaItem extends Document {
    owner: Types.ObjectId;
    mediaType: "photo" | "video" | "document" | "external_link";
    category: "headshot" | "full_length" | "lookbook" | "showreel" | "audition_clip" | "scene_work" | "resume_pdf" | "certificate" | "press_clipping" | "other";
    title?: string;
    description?: string;
    url: string;
    thumbnailUrl?: string;
    mimeType?: string;
    fileSizeBytes?: number;
    durationSeconds?: number;
    displayOrder: number;
    visibility: "public" | "industry_only" | "private";
    rightsConfirmed: boolean;
    contentHash?: string;
    isMainProfilePhoto: boolean;
    isFeatured: boolean;
    isNominatedFeatured: boolean;
    disputeState: "none" | "disputed" | "resolved";
    disputeReason?: string;
    disputedBy?: Types.ObjectId;
    moderationState: "uploaded" | "automated_check" | "live" | "restricted" | "admin_review" | "removed";
    moderationNotes?: string;
    moderatedAt?: Date;
    moderatedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const mediaItemSchema = new Schema<IMediaItem>(
    {
        owner: {
            type: Schema.Types.ObjectId,
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
            type: Schema.Types.ObjectId,
            ref: "User"
        },

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
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

mediaItemSchema.pre("save", function (this: IMediaItem) {
    if (!this.contentHash && this.url) {
        this.contentHash = crypto.createHash("sha256").update(this.url.trim()).digest("hex");
    }
});

mediaItemSchema.index({ owner: 1, contentHash: 1 }, { unique: true, partialFilterExpression: { contentHash: { $type: "string" } } });
mediaItemSchema.index({ owner: 1, visibility: 1, moderationState: 1 });
mediaItemSchema.index({ moderationState: 1, createdAt: -1 });

export const MediaItem: Model<IMediaItem> = mongoose.model<IMediaItem>("MediaItem", mediaItemSchema);
export default MediaItem;
