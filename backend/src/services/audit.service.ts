import AdminAuditLog, { IAdminAuditLog } from "../models/adminAuditLog.model.js";
import { Request } from "express";

/**
 * Log administrative intervention for audit trail
 */
const formatTargetType = (t?: string): string | undefined => {
    if (!t || typeof t !== "string") return undefined;
    const lower = t.toLowerCase();
    const map: Record<string, string> = {
        user: "User",
        organization: "Organization",
        opportunity: "Opportunity",
        application: "Application",
        audition: "Audition",
        verification: "Verification",
        mediaitem: "MediaItem",
        media: "MediaItem",
        creditledger: "CreditLedger",
        project: "Project",
        paymenttransaction: "PaymentTransaction",
        payment: "PaymentTransaction",
        system: "System",
        report: "Report",
        broadcast: "Broadcast"
    };
    return map[lower] || (t.charAt(0).toUpperCase() + t.slice(1));
};

export const logAdminAction = async ({
    adminId,
    action,
    targetType,
    targetId,
    details,
    meta,
    req
}: {
    adminId?: any;
    action: string;
    targetType?: string;
    targetId?: any;
    details?: any;
    meta?: any;
    req?: Request;
}): Promise<IAdminAuditLog | null> => {
    try {
        const ipAddress = req ? (req.headers?.["x-forwarded-for"] || req.socket?.remoteAddress) : null;
        const userAgent = req ? req.headers?.["user-agent"] : null;
        const normalizedTargetType = formatTargetType(targetType);

        return await AdminAuditLog.create({
            adminId,
            action,
            targetType: normalizedTargetType,
            entityType: normalizedTargetType,
            targetId,
            details,
            meta,
            ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : (ipAddress || undefined),
            userAgent: userAgent || undefined
        });
    } catch (error) {
        console.error("Audit log error:", error);
        // Do not throw to avoid failing the parent operation
        return null;
    }
};

export default {
    logAdminAction
};
