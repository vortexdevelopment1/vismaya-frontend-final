import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface INotification extends Document {
    recipient: Types.ObjectId;
    type: string;
    title: string;
    message: string;
    referenceId?: Types.ObjectId;
    referenceType: "Application" | "Opportunity" | "Audition" | "Project" | "User" | "Broadcast" | "System";
    isRead: boolean;
    readAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        recipient: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            enum: [
                "application_submitted",
                "application_status_changed",
                "selected",
                "not_selected",
                "audition_invitation",
                "audition_submitted",
                "audition_approved",
                "audition_rejected",
                "audition_reviewed",
                "opportunity_approved",
                "opportunity_rejected",
                "opportunity_corrections_requested",
                "opportunity_cancellation_reviewed",
                "reapplication_reviewed",
                "verification_update",
                "payment_receipt",
                "payment_success",
                "payment_failure",
                "credit_update",
                "security_alert",
                "account_status",
                "profile_change",
                "profile_correction",
                "media_dispute_update",
                "featured_nomination_update",
                "broadcast",
                "system"
            ],
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        },

        referenceId: {
            type: Schema.Types.ObjectId
        },

        referenceType: {
            type: String,
            enum: ["Application", "Opportunity", "Audition", "Project", "User", "Broadcast", "System"],
            default: "System"
        },

        isRead: {
            type: Boolean,
            default: false
        },

        readAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification: Model<INotification> = mongoose.model<INotification>("Notification", notificationSchema);
export default Notification;
