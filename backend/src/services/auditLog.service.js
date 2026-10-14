const AdminAuditLog = require("../models/adminAuditLog.model");

/**
 * Strips sensitive keys from audit metadata
 */
const sanitizeAuditMeta = (obj) => {
    if (!obj || typeof obj !== "object") return obj;

    const sensitivePattern = /password|otp|token|secret|jwt|cvv|cardnumber|idnumber|authorization/i;

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeAuditMeta(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (sensitivePattern.test(key)) {
            continue; // completely omit sensitive fields
        }
        if (value && typeof value === "object" && !(value instanceof Date)) {
            sanitized[key] = sanitizeAuditMeta(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
};

/**
 * Records an audit event
 */
const audit = async ({
    actor,
    actorRole = "admin",
    action,
    entityType = "System",
    entityId,
    requestId,
    meta,
    ipAddress,
    userAgent
}) => {
    try {
        if (!action) return null;

        const cleanMeta = sanitizeAuditMeta(meta);

        const logEntry = await AdminAuditLog.create({
            adminId: actor,
            actor,
            actorRole,
            action,
            targetType: entityType,
            entityType,
            targetId: entityId,
            entityId,
            requestId,
            details: cleanMeta,
            meta: cleanMeta,
            ipAddress,
            userAgent
        });

        return logEntry;
    } catch (error) {
        console.error("[AuditLogService] Failed to record audit log:", error);
        return null;
    }
};

module.exports = {
    audit,
    sanitizeAuditMeta
};
