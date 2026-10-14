const mongoose = require("mongoose");

const adminAuditLogSchema = new mongoose.Schema(
    {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        actor: {
            type: mongoose.Schema.Types.ObjectId,
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
            type: mongoose.Schema.Types.ObjectId
        },

        entityId: {
            type: mongoose.Schema.Types.ObjectId
        },

        requestId: {
            type: String,
            trim: true
        },

        details: {
            type: mongoose.Schema.Types.Mixed
        },

        meta: {
            type: mongoose.Schema.Types.Mixed
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

const AdminAuditLog = mongoose.model("AdminAuditLog", adminAuditLogSchema);

module.exports = AdminAuditLog;
