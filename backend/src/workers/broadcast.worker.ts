import "dotenv/config";
import { Worker, Job } from "bullmq";
import mongoose from "mongoose";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { createWorkerRedisConnection, getQueueRedisConnection } from "../config/redis.js";
import connectDatabase from "../config/database.js";
import AdminAuditLog from "../models/adminAuditLog.model.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import { notifyUser } from "../services/notification.service.js";
import { sendEmail } from "../services/email.service.js";
import { sendSms } from "../services/sms.service.js";
import { BROADCAST_QUEUE_NAME } from "../queues/broadcast.queue.js";
import { BroadcastBatchJobData, BroadcastBatchJobResult } from "../types/broadcastJob.types.js";

/**
 * Shared Token-Bucket Rate Limiter across concurrent jobs in this worker process.
 */
class RateLimiter {
    private tokens: number;
    private maxTokens: number;
    private refillRatePerMs: number;
    private lastRefill: number;

    constructor(ratePerSecond: number) {
        this.maxTokens = Math.max(1, ratePerSecond);
        this.tokens = this.maxTokens;
        this.refillRatePerMs = this.maxTokens / 1000;
        this.lastRefill = Date.now();
    }

    private refill() {
        const now = Date.now();
        const elapsed = now - this.lastRefill;
        this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRatePerMs);
        this.lastRefill = now;
    }

    async acquire(): Promise<void> {
        this.refill();
        if (this.tokens >= 1) {
            this.tokens -= 1;
            return;
        }
        const waitMs = Math.ceil((1 - this.tokens) / this.refillRatePerMs);
        await new Promise((resolve) => setTimeout(resolve, Math.max(10, waitMs)));
        return this.acquire();
    }
}

// Module-level rate limiters configured from environment
const rawEmailRate = parseInt(process.env.BROADCAST_EMAIL_RATE_LIMIT || "15", 10);
const rawSmsRate = parseInt(process.env.BROADCAST_SMS_RATE_LIMIT || "5", 10);
const emailLimiter = new RateLimiter(isNaN(rawEmailRate) ? 15 : rawEmailRate);
const smsLimiter = new RateLimiter(isNaN(rawSmsRate) ? 5 : rawSmsRate);

const IDEMPOTENCY_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Processes a single batch of recipient user IDs for a broadcast.
 */
export const processBroadcastBatch = async (job: Job<BroadcastBatchJobData>): Promise<BroadcastBatchJobResult> => {
    const {
        broadcastId,
        batchIndex,
        totalBatches,
        title,
        message,
        category,
        channels = {},
        recipientUserIds
    } = job.data;

    // 1. Verify Audit Log existence & valid processing status
    const auditLog: any = await AdminAuditLog.findById(broadcastId);
    if (!auditLog) {
        console.warn(`[Worker:Broadcast] Audit log ${broadcastId} not found (cancelled or deleted). Skipping batch ${batchIndex}.`);
        return {
            broadcastId,
            batchIndex,
            dispatched: 0,
            failed: 0,
            skipped: recipientUserIds.length
        };
    }

    const currentStatus = auditLog.meta?.status;
    if (!["Queued", "Scheduled", "Processing"].includes(currentStatus)) {
        console.log(`[Worker:Broadcast] Broadcast ${broadcastId} status is "${currentStatus}". Skipping batch ${batchIndex}.`);
        return {
            broadcastId,
            batchIndex,
            dispatched: 0,
            failed: 0,
            skipped: recipientUserIds.length
        };
    }

    // 2. Atomic state transition to "Processing" on first batch
    await AdminAuditLog.updateOne(
        {
            _id: broadcastId,
            "meta.status": { $in: ["Queued", "Scheduled"] }
        },
        {
            $set: {
                "meta.status": "Processing",
                "meta.startedAt": new Date().toISOString()
            }
        }
    );

    // 3. Load user recipients by IDs
    const users = await User.find({
        _id: { $in: recipientUserIds },
        status: "active"
    }).select("_id name email mobile emailNotificationsEnabled").lean();

    const redis = getQueueRedisConnection();

    const isUrgent = category === "Urgent update";
    const sendEmailAlert = channels.email === true;
    const sendSmsAlert = isUrgent && channels.sms === true;
    const sendWaAlert = isUrgent && channels.whatsapp === true;
    const broadcastTitle = title?.trim() || `Vismaya: ${category}`;

    let batchDispatched = 0;
    let batchFailed = 0;
    let batchEmailFailed = 0;
    let batchSmsFailed = 0;
    let batchWaFailed = 0;
    let batchInAppFailed = 0;
    const errors: Array<{ userId: string; channel: string; error: string }> = [];

    // 4. Process each recipient channel by channel with granular idempotency
    for (const user of users) {
        const userId = user._id.toString();
        let userHadSuccess = false;
        let userHadFailure = false;

        // --- Channel 1: In-App Notification (Always enabled by default) ---
        if (channels.inApp !== false) {
            const inappKey = `bc:${broadcastId}:${userId}:inapp`;
            try {
                const alreadySent = await redis.get(inappKey);
                if (alreadySent) {
                    userHadSuccess = true;
                } else {
                    const existsInDb = await Notification.exists({
                        recipient: user._id,
                        referenceId: new mongoose.Types.ObjectId(broadcastId),
                        referenceType: "Broadcast"
                    });

                    if (!existsInDb) {
                        const notif = await notifyUser({
                            recipientId: user._id,
                            type: "broadcast",
                            title: broadcastTitle,
                            message: message.trim(),
                            referenceId: new mongoose.Types.ObjectId(broadcastId),
                            referenceType: "Broadcast",
                            sendEmailAlert: false,
                            sendSmsAlert: false,
                            sendWhatsappAlert: false
                        });

                        if (!notif) {
                            userHadFailure = true;
                            batchInAppFailed++;
                            errors.push({ userId, channel: "inapp", error: "Notification creation returned null" });
                        } else {
                            await redis.set(inappKey, "1", "EX", IDEMPOTENCY_TTL_SECONDS);
                            userHadSuccess = true;
                        }
                    } else {
                        await redis.set(inappKey, "1", "EX", IDEMPOTENCY_TTL_SECONDS);
                        userHadSuccess = true;
                    }
                }
            } catch (inappErr: any) {
                userHadFailure = true;
                batchInAppFailed++;
                errors.push({ userId, channel: "inapp", error: inappErr?.message || "In-app error" });
                console.error(`[Worker:Broadcast] In-app error for user ${userId}:`, inappErr?.message || inappErr);
            }
        }

        // --- Channel 2: Email Alert ---
        if (sendEmailAlert && user.email && user.emailNotificationsEnabled !== false) {
            const emailKey = `bc:${broadcastId}:${userId}:email`;
            try {
                const alreadySentEmail = await redis.get(emailKey);
                if (alreadySentEmail) {
                    userHadSuccess = true;
                } else {
                    await emailLimiter.acquire();
                    const emailRes = await sendEmail({
                        to: user.email,
                        subject: broadcastTitle,
                        text: `Hello ${user.name || "Artist"},\n\n${message.trim()}\n\nBest regards,\nVismaya Creative Studios Team`
                    });

                    if (emailRes?.success) {
                        await redis.set(emailKey, "1", "EX", IDEMPOTENCY_TTL_SECONDS);
                        userHadSuccess = true;
                    } else {
                        userHadFailure = true;
                        batchEmailFailed++;
                        errors.push({
                            userId,
                            channel: "email",
                            error: emailRes?.message || "Email send failed"
                        });
                        console.error(`[Worker:Broadcast] Email failed for user ${userId}:`, emailRes?.message);
                    }
                }
            } catch (emailErr: any) {
                userHadFailure = true;
                batchEmailFailed++;
                errors.push({ userId, channel: "email", error: emailErr?.message || "Email exception" });
                console.error(`[Worker:Broadcast] Email error for user ${userId}:`, emailErr?.message || emailErr);
            }
        }

        // --- Channel 3: SMS Alert (Fast2SMS) ---
        if (sendSmsAlert && user.mobile) {
            const smsKey = `bc:${broadcastId}:${userId}:sms`;
            try {
                const alreadySentSms = await redis.get(smsKey);
                if (alreadySentSms) {
                    userHadSuccess = true;
                } else {
                    await smsLimiter.acquire();
                    let result = await sendSms({
                        to: user.mobile,
                        message: `Vismaya: ${broadcastTitle} — ${message.trim()}`.slice(0, 160)
                    });

                    // Fast2SMS 429 robust backoff retry
                    const is429 = Boolean(
                        result?.error && (
                            result.error.includes("429") ||
                            result.error.toLowerCase().includes("too many requests") ||
                            result.error.toLowerCase().includes("rate limit")
                        )
                    );
                    if (!result?.success && is429) {
                        await new Promise((r) => setTimeout(r, 1500));
                        result = await sendSms({
                            to: user.mobile,
                            message: `Vismaya: ${broadcastTitle} — ${message.trim()}`.slice(0, 160)
                        });
                    }

                    if (result?.success) {
                        await redis.set(smsKey, "1", "EX", IDEMPOTENCY_TTL_SECONDS);
                        userHadSuccess = true;
                    } else {
                        userHadFailure = true;
                        batchSmsFailed++;
                        errors.push({
                            userId,
                            channel: "sms",
                            error: result?.error || "SMS send failed"
                        });
                    }
                }
            } catch (smsErr: any) {
                userHadFailure = true;
                batchSmsFailed++;
                errors.push({ userId, channel: "sms", error: smsErr?.message || "SMS exception" });
                console.error(`[Worker:Broadcast] SMS error for user ${userId}:`, smsErr?.message || smsErr);
            }
        }

        // --- Channel 4: WhatsApp Alert ---
        if (sendWaAlert && user.mobile) {
            const waKey = `bc:${broadcastId}:${userId}:wa`;
            try {
                const alreadySentWa = await redis.get(waKey);
                if (alreadySentWa) {
                    userHadSuccess = true;
                } else {
                    await smsLimiter.acquire();
                    let result = await sendSms({
                        to: user.mobile,
                        message: `[Vismaya WhatsApp] ${broadcastTitle}: ${message.trim()}`.slice(0, 160)
                    });

                    const is429 = Boolean(
                        result?.error && (
                            result.error.includes("429") ||
                            result.error.toLowerCase().includes("too many requests") ||
                            result.error.toLowerCase().includes("rate limit")
                        )
                    );
                    if (!result?.success && is429) {
                        await new Promise((r) => setTimeout(r, 1500));
                        result = await sendSms({
                            to: user.mobile,
                            message: `[Vismaya WhatsApp] ${broadcastTitle}: ${message.trim()}`.slice(0, 160)
                        });
                    }

                    if (result?.success) {
                        await redis.set(waKey, "1", "EX", IDEMPOTENCY_TTL_SECONDS);
                        userHadSuccess = true;
                    } else {
                        userHadFailure = true;
                        batchWaFailed++;
                        errors.push({
                            userId,
                            channel: "whatsapp",
                            error: result?.error || "WhatsApp send failed"
                        });
                    }
                }
            } catch (waErr: any) {
                userHadFailure = true;
                batchWaFailed++;
                errors.push({ userId, channel: "whatsapp", error: waErr?.message || "WhatsApp exception" });
            }
        }

        if (userHadSuccess) {
            batchDispatched++;
        } else if (userHadFailure) {
            batchFailed++;
        }
    }

    // 5. Atomic and idempotent batch-completion update using findOneAndUpdate
    const batchResultKey = `meta.batchResults.${batchIndex}`;
    const updatedLog: any = await AdminAuditLog.findOneAndUpdate(
        {
            _id: broadcastId,
            [batchResultKey]: { $exists: false }
        },
        {
            $set: {
                [batchResultKey]: {
                    status: "completed",
                    dispatched: batchDispatched,
                    failed: batchFailed,
                    emailFailed: batchEmailFailed,
                    smsFailed: batchSmsFailed,
                    waFailed: batchWaFailed,
                    inAppFailed: batchInAppFailed,
                    totalErrors: errors.length,
                    errors: errors.slice(0, 20),
                    completedAt: new Date().toISOString()
                }
            },
            $inc: {
                "meta.completedBatches": 1,
                "meta.dispatched": batchDispatched,
                "meta.succeeded": batchDispatched,
                "meta.failed": batchFailed,
                "meta.emailFailed": batchEmailFailed,
                "meta.smsFailed": batchSmsFailed,
                "meta.waFailed": batchWaFailed,
                "meta.inAppFailed": batchInAppFailed
            }
        },
        { new: true, returnDocument: "after" }
    );

    // 6. Check and resolve final status if all batches are completed or failed
    const currentDoc: any = updatedLog || (await AdminAuditLog.findById(broadcastId).lean());
    if (currentDoc) {
        const completed = currentDoc.meta?.completedBatches || 0;
        const failedBatches = currentDoc.meta?.failedBatches || 0;

        if (completed + failedBatches >= totalBatches) {
            const totalDisp = currentDoc.meta?.dispatched || 0;
            const totalFail = currentDoc.meta?.failed || 0;
            const emailFail = currentDoc.meta?.emailFailed || 0;
            const smsFail = currentDoc.meta?.smsFailed || 0;
            const waFail = currentDoc.meta?.waFailed || 0;
            const inAppFail = currentDoc.meta?.inAppFailed || 0;

            const anyChannelFailed = (emailFail > 0 || smsFail > 0 || waFail > 0 || inAppFail > 0);

            let finalStatus = "Sent";
            if (totalDisp === 0) {
                finalStatus = "Failed";
            } else if (totalFail > 0 || anyChannelFailed) {
                finalStatus = "Partially Failed";
            } else {
                finalStatus = "Sent";
            }

            const nowIso = new Date().toISOString();
            await AdminAuditLog.updateOne(
                {
                    _id: broadcastId,
                    "meta.status": "Processing"
                },
                {
                    $set: {
                        "meta.status": finalStatus,
                        "meta.sentAt": nowIso,
                        "meta.completedAt": nowIso
                    }
                }
            );
            console.log(`[Worker:Broadcast] Broadcast ${broadcastId} finished all batches. Final status: ${finalStatus}.`);
        }
    }

    return {
        broadcastId,
        batchIndex,
        dispatched: batchDispatched,
        failed: batchFailed,
        skipped: recipientUserIds.length - (batchDispatched + batchFailed),
        errors: errors.length > 0 ? errors : undefined
    };
};

let workerInstance: Worker<BroadcastBatchJobData> | null = null;

export const startBroadcastWorker = (): Worker<BroadcastBatchJobData> => {
    if (workerInstance) {
        return workerInstance;
    }

    const workerConnection = createWorkerRedisConnection();
    const rawConcurrency = parseInt(process.env.BROADCAST_CONCURRENCY || "3", 10);
    const concurrency = Math.max(1, isNaN(rawConcurrency) ? 3 : rawConcurrency);

    workerInstance = new Worker<BroadcastBatchJobData>(
        BROADCAST_QUEUE_NAME,
        async (job: Job<BroadcastBatchJobData>) => {
            return processBroadcastBatch(job);
        },
        {
            connection: workerConnection,
            concurrency,
            lockDuration: 180000,   // 3 minutes
            stalledInterval: 30000  // 30 seconds
        }
    );

    workerInstance.on("completed", (job: Job<BroadcastBatchJobData>) => {
        console.log(`[Worker:Broadcast] Batch ${job.data.batchIndex + 1}/${job.data.totalBatches} completed for broadcast ${job.data.broadcastId}.`);
    });

    workerInstance.on("failed", async (job: Job<BroadcastBatchJobData> | undefined, err: Error) => {
        console.error(`[Worker:Broadcast] Batch failed:`, job?.id, err.message);
        if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
            // Batch exhausted all retries - update atomically with same idempotent pattern
            const broadcastId = job.data.broadcastId;
            const batchIndex = job.data.batchIndex;
            const totalBatches = job.data.totalBatches;
            const batchRecipientCount = job.data.recipientUserIds.length;
            const batchResultKey = `meta.batchResults.${batchIndex}`;

            const updatedLog: any = await AdminAuditLog.findOneAndUpdate(
                {
                    _id: broadcastId,
                    [batchResultKey]: { $exists: false }
                },
                {
                    $set: {
                        [batchResultKey]: {
                            status: "failed",
                            failed: batchRecipientCount,
                            error: err.message,
                            failedAt: new Date().toISOString()
                        }
                    },
                    $inc: {
                        "meta.failedBatches": 1,
                        "meta.failed": batchRecipientCount
                    }
                },
                { new: true, returnDocument: "after" }
            );

            const currentDoc: any = updatedLog || (await AdminAuditLog.findById(broadcastId).lean());
            if (currentDoc) {
                const completed = currentDoc.meta?.completedBatches || 0;
                const failedBatches = currentDoc.meta?.failedBatches || 0;

                if (completed + failedBatches >= totalBatches) {
                    const totalDisp = currentDoc.meta?.dispatched || 0;
                    const totalFail = currentDoc.meta?.failed || 0;
                    const emailFail = currentDoc.meta?.emailFailed || 0;
                    const smsFail = currentDoc.meta?.smsFailed || 0;
                    const waFail = currentDoc.meta?.waFailed || 0;
                    const inAppFail = currentDoc.meta?.inAppFailed || 0;

                    const anyChannelFailed = (emailFail > 0 || smsFail > 0 || waFail > 0 || inAppFail > 0);

                    let finalStatus = "Sent";
                    if (totalDisp === 0) {
                        finalStatus = "Failed";
                    } else if (totalFail > 0 || anyChannelFailed) {
                        finalStatus = "Partially Failed";
                    } else {
                        finalStatus = "Sent";
                    }

                    const nowIso = new Date().toISOString();
                    await AdminAuditLog.updateOne(
                        {
                            _id: broadcastId,
                            "meta.status": "Processing"
                        },
                        {
                            $set: {
                                "meta.status": finalStatus,
                                "meta.sentAt": nowIso,
                                "meta.completedAt": nowIso
                            }
                        }
                    );
                    console.log(`[Worker:Broadcast] Broadcast ${broadcastId} finished after batch failure. Final status: ${finalStatus}.`);
                }
            }
        }
    });

    workerInstance.on("error", (err: Error) => {
        console.warn("[Worker:Broadcast] Worker connection error:", err.message);
    });

    console.log(`[Worker:Broadcast] Worker started on queue "${BROADCAST_QUEUE_NAME}" with concurrency ${concurrency}.`);
    return workerInstance;
};

export const stopBroadcastWorker = async (): Promise<void> => {
    if (workerInstance) {
        try {
            console.log("[Worker:Broadcast] Gracefully stopping worker (finishing active jobs)...");
            await workerInstance.close();
        } finally {
            workerInstance = null;
        }
    }
};

// Check if running as standalone process
const isMainModule = (): boolean => {
    if (!process.argv[1]) return false;
    try {
        const currentFile = path.resolve(fileURLToPath(import.meta.url));
        const scriptFile = path.resolve(process.argv[1]);
        return currentFile === scriptFile;
    } catch {
        return false;
    }
};

if (isMainModule()) {
    (async () => {
        try {
            await connectDatabase();
            startBroadcastWorker();

            const shutdown = async (signal: string) => {
                console.log(`[Worker:Broadcast] Received ${signal}. Starting graceful shutdown...`);
                await stopBroadcastWorker();
                await mongoose.disconnect();
                process.exit(0);
            };

            process.on("SIGTERM", () => shutdown("SIGTERM"));
            process.on("SIGINT", () => shutdown("SIGINT"));
        } catch (err: any) {
            console.error("[Worker:Broadcast] Fatal startup error:", err.message);
            process.exit(1);
        }
    })();
}

export default {
    startBroadcastWorker,
    stopBroadcastWorker,
    processBroadcastBatch
};
