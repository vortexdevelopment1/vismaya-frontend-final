import { Queue, QueueOptions, JobsOptions } from "bullmq";
import { getQueueRedisConnection } from "../config/redis.js";
import { BroadcastBatchJobData, BroadcastChannelFlags } from "../types/broadcastJob.types.js";

/**
 * BullMQ Broadcast Queue Definition & Job Producer
 *
 * Implements deterministic job IDs, chunking by BROADCAST_BATCH_SIZE,
 * automatic retries with exponential backoff, and bulk enqueuing.
 */

export const BROADCAST_QUEUE_NAME = "broadcast-queue";

let broadcastQueueInstance: Queue<BroadcastBatchJobData> | null = null;

export const getBroadcastQueue = (): Queue<BroadcastBatchJobData> => {
    if (broadcastQueueInstance) {
        return broadcastQueueInstance;
    }

    const redisConnection = getQueueRedisConnection();

    const defaultJobOptions: JobsOptions = {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000
        },
        removeOnComplete: {
            count: 100
        },
        removeOnFail: {
            count: 500
        }
    };

    const queueOptions: QueueOptions = {
        connection: redisConnection,
        defaultJobOptions
    };

    broadcastQueueInstance = new Queue<BroadcastBatchJobData>(BROADCAST_QUEUE_NAME, queueOptions);

    broadcastQueueInstance.on("error", (err) => {
        console.warn("[Queue:Broadcast] Queue error:", err.message);
    });

    return broadcastQueueInstance;
};

export interface AddBroadcastParams {
    broadcastId: string;
    title: string;
    message: string;
    category: string;
    audience: string;
    channels: BroadcastChannelFlags;
    recipientUserIds: string[];
    scheduledFor?: string | null;
}

export interface AddBroadcastResult {
    broadcastId: string;
    totalRecipients: number;
    totalBatches: number;
}

/**
 * Splits recipientUserIds into chunks of BROADCAST_BATCH_SIZE,
 * builds deterministic job IDs (bc_{broadcastId}_b_{batchIndex}),
 * and atomically enqueues all batches using queue.addBulk().
 */
export const addBroadcastJob = async (params: AddBroadcastParams): Promise<AddBroadcastResult> => {
    const {
        broadcastId,
        title,
        message,
        category,
        audience,
        channels,
        recipientUserIds,
        scheduledFor
    } = params;

    const totalRecipients = recipientUserIds.length;
    if (totalRecipients === 0) {
        return {
            broadcastId,
            totalRecipients: 0,
            totalBatches: 0
        };
    }

    const rawBatchSize = parseInt(process.env.BROADCAST_BATCH_SIZE || "50", 10);
    const batchSize = Math.max(1, isNaN(rawBatchSize) ? 50 : rawBatchSize);
    const totalBatches = Math.ceil(totalRecipients / batchSize);

    // Compute delay if scheduledFor is in the future
    let delayMs = 0;
    if (scheduledFor) {
        const scheduledTime = new Date(scheduledFor).getTime();
        const now = Date.now();
        if (!isNaN(scheduledTime) && scheduledTime > now) {
            delayMs = scheduledTime - now;
        }
    }

    const bulkJobs = [];

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * batchSize;
        const end = start + batchSize;
        const batchUserIds = recipientUserIds.slice(start, end);

        const jobData: BroadcastBatchJobData = {
            broadcastId,
            batchIndex,
            totalBatches,
            title,
            message,
            category,
            audience,
            channels,
            recipientUserIds: batchUserIds,
            scheduledFor: scheduledFor || null
        };

        const jobOptions: JobsOptions = {
            jobId: `bc_${broadcastId}_b_${batchIndex}`,
            ...(delayMs > 0 ? { delay: delayMs } : {})
        };

        bulkJobs.push({
            name: "DISPATCH_BROADCAST_BATCH",
            data: jobData,
            opts: jobOptions
        });
    }

    const queue = getBroadcastQueue();
    await queue.addBulk(bulkJobs);

    return {
        broadcastId,
        totalRecipients,
        totalBatches
    };
};

/**
 * Removes all batch jobs for a broadcast from the queue (used on cancel/delete/reschedule of scheduled broadcasts)
 */
export const removeBroadcastJobs = async (broadcastId: string, totalBatches: number = 100): Promise<number> => {
    try {
        const queue = getBroadcastQueue();
        let removed = 0;
        const maxBatches = Math.max(1, totalBatches);

        for (let batchIndex = 0; batchIndex < maxBatches; batchIndex++) {
            const jobId = `bc_${broadcastId}_b_${batchIndex}`;
            const job = await queue.getJob(jobId);
            if (job) {
                await job.remove();
                removed++;
            }
        }
        return removed;
    } catch (err: any) {
        console.warn(`[Queue:Broadcast] Failed to remove jobs for broadcast ${broadcastId}:`, err.message);
        return 0;
    }
};

export const closeBroadcastQueue = async (): Promise<void> => {
    if (broadcastQueueInstance) {
        try {
            await broadcastQueueInstance.close();
        } finally {
            broadcastQueueInstance = null;
        }
    }
};

export default {
    BROADCAST_QUEUE_NAME,
    getBroadcastQueue,
    addBroadcastJob,
    closeBroadcastQueue
};
