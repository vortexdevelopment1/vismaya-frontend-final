import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IReport extends Document {
    reporterId: Types.ObjectId;
    targetType: "Opportunity" | "User" | "MediaItem";
    targetId: Types.ObjectId;
    reason: "misleading_information" | "scam_or_fraud" | "offensive_content" | "copyright_infringement" | "impersonation" | "other";
    details?: string;
    status: "pending" | "investigating" | "resolved" | "dismissed";
    adminNotes?: string;
    resolvedAt?: Date;
    resolvedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
    {
        reporterId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        targetType: {
            type: String,
            enum: ["Opportunity", "User", "MediaItem"],
            required: true
        },

        targetId: {
            type: Schema.Types.ObjectId,
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
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

reportSchema.index({ reporterId: 1, targetType: 1, targetId: 1 }, { unique: true });
reportSchema.index({ status: 1, createdAt: -1 });

export const Report: Model<IReport> = mongoose.model<IReport>("Report", reportSchema);
export default Report;
