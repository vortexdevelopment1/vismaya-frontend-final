import { Request, Response } from "express";
import User from "../models/user.model.js";
import AdminAuditLog from "../models/adminAuditLog.model.js";
import { notifyUser } from "../services/notification.service.js";
import { logAdminAction } from "../services/audit.service.js";
import { isRedisHealthy } from "../config/redis.js";
import { addBroadcastJob, removeBroadcastJobs } from "../queues/broadcast.queue.js";

/**
 * POST /api/admin/broadcasts
 * Admin sends or schedules a broadcast notification to a target audience.
 * Channels: inApp (always), email, sms, whatsapp (optional)
 * SMS and WhatsApp only fire for "Urgent update" category.
 *
 * Implements non-blocking HTTP 202 response via BullMQ queue & batch processing.
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

        // 1. Validation
        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: "Message body is required" });
        }
        if (message.trim().length < 10) {
            return res.status(400).json({ success: false, message: "Message must be at least 10 characters" });
        }
        if (message.trim().length > 500) {
            return res.status(400).json({ success: false, message: "Message cannot exceed 500 characters" });
        }

        // 2. Build user filter based on audience
        const filter: Record<string, unknown> = { status: "active" };

        if (audience === "All talent") {
            filter.role = "talent";
        } else if (audience === "All organizations") {
            filter.role = "organization";
        } else if (typeof audience === "string" && audience.startsWith("Talent in ")) {
            filter.role = "talent";
        } else if (typeof audience === "string" && audience.startsWith("Organizations (")) {
            filter.role = "organization";
        }

        const users = await User.find(filter).select("_id").lean();

        // If zero recipients, keep existing behavior (do not enqueue empty jobs)
        if (!users.length) {
            return res.status(200).json({
                success: true,
                message: "No matching users found for this audience",
                dispatched: 0
            });
        }

        // 3. Pre-flight Redis Health Check (Before creating audit log)
        const redisAvailable = await isRedisHealthy(1500);
        if (!redisAvailable) {
            console.warn("[BroadcastController] Redis health check failed. Aborting broadcast enqueue.");
            return res.status(503).json({
                success: false,
                message: "Queue service unavailable"
            });
        }

        // 4. Determine Delivery State & Batching
        const isUrgent = category === "Urgent update";
        const sendEmail = channels.email === true;
        const sendSms = isUrgent && channels.sms === true;
        const sendWa = isUrgent && channels.whatsapp === true;

        const broadcastTitle = title?.trim() || `Vismaya: ${category}`;

        const isScheduled = Boolean(
            scheduledFor &&
            !isNaN(new Date(scheduledFor).getTime()) &&
            new Date(scheduledFor).getTime() > Date.now()
        );
        const initialStatus = isScheduled ? "Scheduled" : "Queued";

        const rawBatchSize = parseInt(process.env.BROADCAST_BATCH_SIZE || "50", 10);
        const batchSize = Math.max(1, isNaN(rawBatchSize) ? 50 : rawBatchSize);
        const totalBatches = Math.ceil(users.length / batchSize);

        // 5. Create Audit Log in Queued/Scheduled state
        const auditLog = await AdminAuditLog.create({
            adminId: req.user?.userId,
            action: "SEND_BROADCAST",
            targetType: "Broadcast",
            details: `Broadcast to ${users.length} users. Channels: inApp${sendEmail ? " + email" : ""}${sendSms ? " + SMS" : ""}${sendWa ? " + WhatsApp" : ""}. Audience: ${audience}`,
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
                status: initialStatus,
                total: users.length,
                totalRecipients: users.length,
                succeeded: 0,
                dispatched: 0,
                failed: 0,
                emailFailed: 0,
                smsFailed: 0,
                waFailed: 0,
                inAppFailed: 0,
                totalBatches,
                completedBatches: 0,
                failedBatches: 0,
                scheduledFor: isScheduled ? new Date(scheduledFor).toISOString() : null,
                sentAt: !isScheduled ? new Date().toISOString() : null,
                createdAt: new Date().toISOString()
            }
        });

        // 6. Enqueue batch jobs into BullMQ
        let enqueueResult;
        try {
            enqueueResult = await addBroadcastJob({
                broadcastId: auditLog._id.toString(),
                title: broadcastTitle,
                message: message.trim(),
                category,
                audience,
                channels: {
                    inApp: true,
                    email: sendEmail,
                    sms: sendSms,
                    whatsapp: sendWa
                },
                recipientUserIds: users.map((u: any) => u._id.toString()),
                scheduledFor: isScheduled ? new Date(scheduledFor).toISOString() : null
            });

            // Explicitly ensure meta.totalBatches is set to actual enqueued batches
            await AdminAuditLog.updateOne(
                { _id: auditLog._id },
                { $set: { "meta.totalBatches": enqueueResult.totalBatches } }
            );
        } catch (enqueueErr) {
            console.error("[BroadcastController] Failed to enqueue broadcast batches:", enqueueErr);
            // Revert state to Failed via atomic updateOne so no orphan "Queued" logs remain
            await AdminAuditLog.updateOne(
                { _id: auditLog._id },
                {
                    $set: {
                        "meta.status": "Failed",
                        "meta.failureReason": "Failed to enqueue jobs to Redis queue"
                    }
                }
            );
            return res.status(500).json({
                success: false,
                message: "Failed to queue broadcast for delivery"
            });
        }

        // 7. Return HTTP 202 Accepted immediately
        return res.status(202).json({
            success: true,
            message: isScheduled
                ? `Broadcast scheduled for delivery to ${users.length} recipients`
                : `Broadcast queued for delivery to ${users.length} recipients across ${totalBatches} batches`,
            broadcastId: auditLog._id.toString(),
            status: initialStatus,
            totalRecipients: users.length,
            totalBatches,
            channels: {
                inApp: true,
                email: sendEmail,
                sms: sendSms,
                whatsapp: sendWa
            },
            broadcast: {
                id: auditLog._id.toString(),
                _id: auditLog._id.toString(),
                title: broadcastTitle,
                message: message.trim(),
                audience,
                category,
                status: initialStatus,
                scheduledFor: isScheduled ? new Date(scheduledFor).toISOString() : null,
                sentAt: null,
                createdAt: auditLog.createdAt || new Date().toISOString(),
                stats: {
                    reachCount: users.length,
                    readCount: 0
                }
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
                status: meta.status || "Sent",
                sentAt: meta.sentAt || log.createdAt,
                createdAt: log.createdAt,
                recipientsCount: meta.dispatched ?? meta.succeeded ?? meta.total ?? 0,
                deliveredCount: meta.dispatched ?? meta.succeeded ?? meta.total ?? 0,
                stats: {
                    reachCount: meta.dispatched ?? meta.succeeded ?? meta.total ?? 0,
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
        const broadcastId = String(req.params.broadcastId);

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
            sentAt: meta.sentAt || log.createdAt,
            createdAt: log.createdAt,
            recipientsCount: meta.dispatched ?? meta.succeeded ?? meta.total ?? 0,
            stats: {
                reachCount: meta.dispatched ?? meta.succeeded ?? meta.total ?? 0,
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
 * In-flight broadcasts (Queued or Processing) cannot be edited (returns 409).
 */
export const updateBroadcast = async (req: Request, res: Response): Promise<any> => {
    try {
        const broadcastId = String(req.params.broadcastId);
        const { title, message, audience, category, status, scheduledFor } = req.body;

        const log: any = await AdminAuditLog.findById(broadcastId);
        if (!log) {
            return res.status(404).json({ success: false, message: "Broadcast not found" });
        }

        const currentStatus = log.meta?.status || "Sent";
        if (currentStatus === "Queued" || currentStatus === "Processing") {
            return res.status(409).json({
                success: false,
                message: "Cannot edit a broadcast while it is queued or actively being processed."
            });
        }

        const updateSet: Record<string, any> = {
            "meta.updatedAt": new Date().toISOString()
        };

        if (title !== undefined) {
            updateSet["meta.title"] = title.trim();
        }
        if (message !== undefined) {
            updateSet["meta.message"] = message.trim();
            updateSet["details"] = `Broadcast: ${message.trim().slice(0, 100)}`;
        }
        if (audience !== undefined) {
            updateSet["meta.audience"] = audience;
        }
        if (category !== undefined) {
            updateSet["meta.category"] = category;
        }
        if (status !== undefined) {
            updateSet["meta.status"] = status;
        }

        // Handle rescheduling for scheduled broadcast
        if (scheduledFor !== undefined && currentStatus === "Scheduled") {
            const newScheduledTime = new Date(scheduledFor).getTime();
            if (!isNaN(newScheduledTime) && newScheduledTime > Date.now()) {
                updateSet["meta.scheduledFor"] = new Date(scheduledFor).toISOString();
                // Remove old delayed jobs and re-add with new delay
                await removeBroadcastJobs(broadcastId, log.meta?.totalBatches || 50);

                const filter: Record<string, unknown> = { status: "active" };
                const aud = audience || log.meta?.audience || "All users";
                if (aud === "All talent") filter.role = "talent";
                else if (aud === "All organizations") filter.role = "organization";

                const users = await User.find(filter).select("_id").lean();
                if (users.length > 0) {
                    await addBroadcastJob({
                        broadcastId,
                        title: title?.trim() || log.meta?.title || "Platform Announcement",
                        message: message?.trim() || log.meta?.message || "",
                        category: category || log.meta?.category || "Platform announcement",
                        audience: aud,
                        channels: log.meta?.channels || { inApp: true },
                        recipientUserIds: users.map((u: any) => u._id.toString()),
                        scheduledFor: new Date(scheduledFor).toISOString()
                    });
                }
            }
        }

        // Strictly update specific paths using updateOne to avoid overwriting worker $inc counters
        await AdminAuditLog.updateOne({ _id: broadcastId }, { $set: updateSet });

        const updatedLog: any = await AdminAuditLog.findById(broadcastId).lean();
        const updatedMeta = updatedLog?.meta || {};

        const updatedBroadcast = {
            id: broadcastId,
            _id: broadcastId,
            title: updatedMeta.title || "Platform Announcement",
            message: updatedMeta.message || updatedLog?.details,
            audience: updatedMeta.audience || "All users",
            category: updatedMeta.category || "Platform announcement",
            status: updatedMeta.status || "Sent",
            scheduledFor: updatedMeta.scheduledFor || null,
            createdAt: updatedLog?.createdAt,
            updatedAt: updatedMeta.updatedAt || new Date().toISOString()
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
 * In-flight broadcasts (Queued or Processing) cannot be deleted (returns 409).
 */
export const deleteBroadcast = async (req: Request, res: Response): Promise<any> => {
    try {
        const broadcastId = String(req.params.broadcastId);

        const log: any = await AdminAuditLog.findById(broadcastId).lean();
        if (!log) {
            return res.status(404).json({ success: false, message: "Broadcast not found" });
        }

        const currentStatus = log.meta?.status || "Sent";
        if (currentStatus === "Queued" || currentStatus === "Processing") {
            return res.status(409).json({
                success: false,
                message: "Cannot delete a broadcast while it is queued or actively being processed."
            });
        }

        // If it was Scheduled, remove delayed jobs from BullMQ queue
        if (currentStatus === "Scheduled" || log.meta?.totalBatches) {
            await removeBroadcastJobs(broadcastId, log.meta?.totalBatches || 50);
        }

        await AdminAuditLog.findByIdAndDelete(broadcastId);

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
