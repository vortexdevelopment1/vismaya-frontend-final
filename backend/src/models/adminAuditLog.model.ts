import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAdminAuditLog extends Document {
    adminId?: Types.ObjectId;
    actor?: Types.ObjectId;
    actorRole: "admin" | "talent" | "organization" | "system";
    action: string;
    targetType?: string;
    entityType?: string;
    targetId?: Types.ObjectId;
    entityId?: Types.ObjectId;
    requestId?: string;
    details?: any;
    meta?: any;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}

const adminAuditLogSchema = new Schema<IAdminAuditLog>(
    {
        adminId: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },

        actor: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },

        actorRole: {
            type: String,
            enum: ["admin", "talent", "organization", "system"],
            default: "admin"
        },

        action: {
            type: String,
            required: true,
            trim: true
        },

        targetType: {
            type: String,
            enum: [
                "User",
                "TalentProfile",
                "Organization",
                "Opportunity",
                "Application",
                "Audition",
                "Verification",
                "MediaItem",
                "CreditLedger",
                "Project",
                "PaymentTransaction",
                "System",
                "Report",
                "Broadcast"
            ]
        },

        entityType: {
            type: String,
            enum: [
                "User",
                "TalentProfile",
                "Organization",
                "Opportunity",
                "Application",
                "Audition",
                "Verification",
                "MediaItem",
                "CreditLedger",
                "Project",
                "PaymentTransaction",
                "System",
                "Report",
                "Broadcast"
            ]
        },

        targetId: {
            type: Schema.Types.ObjectId
        },

        entityId: {
            type: Schema.Types.ObjectId
        },

        requestId: {
            type: String,
            trim: true
        },

        details: {
            type: Schema.Types.Mixed
        },

        meta: {
            type: Schema.Types.Mixed
        },

        ipAddress: {
            type: String,
            trim: true
        },

        userAgent: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: { createdAt: true, updatedAt: false }
    }
);

adminAuditLogSchema.index({ adminId: 1, createdAt: -1 });
adminAuditLogSchema.index({ actor: 1, createdAt: -1 });
adminAuditLogSchema.index({ targetType: 1, targetId: 1 });
adminAuditLogSchema.index({ entityType: 1, entityId: 1 });
adminAuditLogSchema.index({ action: 1, createdAt: -1 });

export const AdminAuditLog: Model<IAdminAuditLog> = mongoose.model<IAdminAuditLog>("AdminAuditLog", adminAuditLogSchema);
export default AdminAuditLog;
