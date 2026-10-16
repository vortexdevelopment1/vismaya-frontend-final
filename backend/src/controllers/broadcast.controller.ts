import { Request, Response } from "express";
import User from "../models/user.model.js";
import AdminAuditLog from "../models/adminAuditLog.model.js";
import { notifyUser } from "../services/notification.service.js";
import { logAdminAction } from "../services/audit.service.js";

/**
 * POST /api/admin/broadcasts
 * Admin sends a broadcast notification to a target audience.
 * Channels: inApp (always), email, sms, whatsapp (optional)
 * SMS and WhatsApp only fire for "Urgent update" category.
 */
export const sendBroadcast = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            title,
            message,
            audience = "All users",
            category = "Platform announcement",
            channels = {},
            scheduledFor
        } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: "Message body is required" });
        }
        if (message.trim().length < 10) {
            return res.status(400).json({ success: false, message: "Message must be at least 10 characters" });
        }
        if (message.trim().length > 500) {
            return res.status(400).json({ success: false, message: "Message cannot exceed 500 characters" });
        }

        // ── Build user filter based on audience ──────────────────────────────
        const filter: Record<string, unknown> = { status: "active" };

        if (audience === "All talent") {
            filter.role = "talent";
        } else if (audience === "All organizations") {
            filter.role = "organization";
        } else if (typeof audience === "string" && audience.startsWith("Talent in ")) {
            filter.role = "talent";
            // City-level targeting requires TalentProfile lookup — targeting all talent for now
        } else if (typeof audience === "string" && audience.startsWith("Organizations (")) {
            filter.role = "organization";
        }
        // "All users" → no extra role filter

        const users = await User.find(filter).select("_id").lean();

        if (!users.length) {
            return res.status(200).json({
                success: true,
                message: "No matching users found for this audience",
                dispatched: 0
            });
        }

        // ── Channel flags ────────────────────────────────────────────────────
        // SMS and WhatsApp are restricted to "Urgent update" category only
        const isUrgent  = category === "Urgent update";
        const sendEmail = channels.email === true;
        const sendSms   = isUrgent && channels.sms === true;
        const sendWa    = isUrgent && channels.whatsapp === true;

        const broadcastTitle = title?.trim() || `Vismaya: ${category}`;

        // ── Dispatch notifications (in parallel, errors don't abort others) ──
        const results = await Promise.allSettled(
            users.map(user =>
                notifyUser({
                    recipientId:       user._id,
                    type:              "broadcast",
                    title:             broadcastTitle,
                    message:           message.trim(),
                    referenceType:     "Broadcast",
                    sendEmailAlert:    sendEmail,
                    sendSmsAlert:      sendSms,
                    sendWhatsappAlert: sendWa
                })
            )
        );

        const succeeded = results.filter(r => r.status === "fulfilled" && (r as PromiseFulfilledResult<any>).value).length;
        const failed    = results.length - succeeded;

        // Audit log for traceability
        await logAdminAction({
            adminId:    req.user?.userId,
            action:     "SEND_BROADCAST",
            targetType: "Broadcast",
            details:    `Broadcast to ${succeeded}/${users.length} users. Channels: inApp${sendEmail ? " + email" : ""}${sendSms ? " + SMS" : ""}${sendWa ? " + WhatsApp" : ""}. Audience: ${audience}`,
            meta: {
                title: broadcastTitle,
                message: message.trim(),
                audience,
                category,
                channels: {
                    inApp: true,
                    email: sendEmail,
                    sms: sendSms,
                    whatsapp: sendWa
                },
                dispatched: succeeded,
                total: users.length,
                status: "Sent"
            }
        });

        return res.status(200).json({
            success:    true,
            message:    `Broadcast dispatched to ${succeeded} user(s)${failed ? ` (${failed} failed)` : ""}`,
            dispatched: succeeded,
            failed,
            total:      users.length,
            channels: {
                inApp:    true,
                email:    sendEmail,
                sms:      sendSms,
                whatsapp: sendWa
            },
            broadcast: {
                title:     broadcastTitle,
                message:   message.trim(),
                audience,
                category,
                sentAt:    new Date().toISOString()
            }
        });

    } catch (error) {
        console.error("[BroadcastController] Error:", error);
        return res.status(500).json({ success: false, message: "Failed to send broadcast" });
    }
};

/**
 * GET /api/admin/broadcasts
 * Retrieves list of past broadcasts dispatched by administrators from the audit ledger.
 */
export const getBroadcasts = async (req: Request, res: Response): Promise<any> => {
    try {
        const logs = await AdminAuditLog.find({
            $or: [{ action: "SEND_BROADCAST" }, { targetType: "Broadcast" }]
        })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const broadcasts = logs.map((log: any) => {
            const meta = log.meta || {};
            const audience = meta.audience || "All users";
            const message = meta.message || (typeof log.details === "string" ? log.details : "");
            const channels = meta.channels
                ? Object.keys(meta.channels).filter(k => meta.channels[k])
                : ["in_app"];

            return {
                id: log._id.toString(),
                _id: log._id.toString(),
                title: meta.title || "Platform Announcement",
                message,
                audience,
                targetAudience: audience,
                channels: channels.length > 0 ? channels : ["in_app"],
                priority: meta.priority || "Normal",
                status: "Sent",
                sentAt: log.createdAt,
                createdAt: log.createdAt,
                recipientsCount: meta.dispatched || meta.total || 0,
                stats: {
                    reachCount: meta.dispatched || meta.total || 0,
                    readCount: 0
                }
            };
        });

        return res.status(200).json({
            success: true,
            data: broadcasts,
            broadcasts
        });
    } catch (error) {
        console.error("[BroadcastController] getBroadcasts error:", error);
        return res.status(500).json({ success: false, message: "Failed to retrieve broadcasts" });
    }
};

/**
 * GET /api/admin/broadcasts/:broadcastId
 * Retrieves a single broadcast entry by its ID.
 */
export const getBroadcastById = async (req: Request, res: Response): Promise<any> => {
    try {
        const { broadcastId } = req.params;

        const log: any = await AdminAuditLog.findById(broadcastId).lean();
        if (!log || (log.action !== "SEND_BROADCAST" && log.targetType !== "Broadcast")) {
            return res.status(404).json({ success: false, message: "Broadcast not found" });
        }

        const meta = log.meta || {};
        const audience = meta.audience || "All users";
        const message = meta.message || (typeof log.details === "string" ? log.details : "");
        const channels = meta.channels
            ? Object.keys(meta.channels).filter(k => meta.channels[k])
            : ["in_app"];

        const broadcast = {
            id: log._id.toString(),
            _id: log._id.toString(),
            title: meta.title || "Platform Announcement",
            message,
            audience,
            targetAudience: audience,
            category: meta.category || "Platform announcement",
            channels: channels.length > 0 ? channels : ["in_app"],
            priority: meta.priority || "Normal",
            status: meta.status || "Sent",
            sentAt: log.createdAt,
            createdAt: log.createdAt,
            recipientsCount: meta.dispatched || meta.total || 0,
            stats: {
                reachCount: meta.dispatched || meta.total || 0,
                readCount: 0
            }
        };

        return res.status(200).json({
            success: true,
            data: broadcast,
            broadcast
        });
    } catch (error) {
        console.error("[BroadcastController] getBroadcastById error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch broadcast" });
    }
};

/**
 * PATCH /api/admin/broadcasts/:broadcastId
 * Updates a broadcast draft or scheduled announcement metadata.
 */
export const updateBroadcast = async (req: Request, res: Response): Promise<any> => {
    try {
        const { broadcastId } = req.params;
        const { title, message, audience, category, status } = req.body;

        const log: any = await AdminAuditLog.findById(broadcastId);
        if (!log) {
            return res.status(404).json({ success: false, message: "Broadcast not found" });
        }

        log.meta = log.meta || {};
        if (title) log.meta.title = title.trim();
        if (message) {
            log.meta.message = message.trim();
            log.details = `Broadcast: ${message.trim().slice(0, 100)}`;
        }
        if (audience) log.meta.audience = audience;
        if (category) log.meta.category = category;
        if (status) log.meta.status = status;

        await log.save();

        const updatedBroadcast = {
            id: log._id.toString(),
            _id: log._id.toString(),
            title: log.meta.title || "Platform Announcement",
            message: log.meta.message || log.details,
            audience: log.meta.audience || "All users",
            category: log.meta.category || "Platform announcement",
            status: log.meta.status || "Sent",
            createdAt: log.createdAt,
            updatedAt: log.updatedAt
        };

        return res.status(200).json({
            success: true,
            message: "Broadcast announcement updated successfully",
            data: updatedBroadcast,
            broadcast: updatedBroadcast
        });
    } catch (error) {
        console.error("[BroadcastController] updateBroadcast error:", error);
        return res.status(500).json({ success: false, message: "Failed to update broadcast" });
    }
};

/**
 * DELETE /api/admin/broadcasts/:broadcastId
 * Removes or cancels a broadcast announcement.
 */
export const deleteBroadcast = async (req: Request, res: Response): Promise<any> => {
    try {
        const { broadcastId } = req.params;

        const deleted = await AdminAuditLog.findByIdAndDelete(broadcastId);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Broadcast not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Broadcast announcement deleted successfully"
        });
    } catch (error) {
        console.error("[BroadcastController] deleteBroadcast error:", error);
        return res.status(500).json({ success: false, message: "Failed to delete broadcast" });
    }
};

/**
 * GET /api/admin/broadcasts/reach
 * Estimates recipient audience reach based on filter target.
 */
export const getBroadcastReach = async (req: Request, res: Response): Promise<any> => {
    try {
        const { target = "all" } = req.query;
        let count = 0;

        const cleanTarget = String(target).toLowerCase().trim();
        if (cleanTarget === "talent" || cleanTarget === "talents") {
            count = await User.countDocuments({ role: "talent", status: "active" });
        } else if (cleanTarget === "recruiter" || cleanTarget === "organization" || cleanTarget === "organizations") {
            count = await User.countDocuments({ role: "organization", status: "active" });
        } else {
            count = await User.countDocuments({ status: "active" });
        }

        return res.status(200).json({
            success: true,
            target,
            estimatedReach: count,
            data: {
                target,
                estimatedReach: count
            }
        });
    } catch (error) {
        console.error("[BroadcastController] getBroadcastReach error:", error);
        return res.status(500).json({ success: false, message: "Failed to calculate audience reach" });
    }
};

export default {
    sendBroadcast,
    getBroadcasts,
    getBroadcastById,
    updateBroadcast,
    deleteBroadcast,
    getBroadcastReach
};
