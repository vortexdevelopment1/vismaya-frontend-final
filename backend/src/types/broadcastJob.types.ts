/**
 * Strong TypeScript types for BullMQ Broadcast Queue & Background Workers
 */

export type BroadcastStatus = "Queued" | "Processing" | "Sent" | "Partially Failed" | "Failed";

export interface BroadcastChannelFlags {
    inApp?: boolean;
    email?: boolean;
    sms?: boolean;
    whatsapp?: boolean;
}

export interface BroadcastBatchJobData {
    broadcastId: string;
    batchIndex: number;
    totalBatches: number;
    title: string;
    message: string;
    category: string;
    audience: string;
    channels: BroadcastChannelFlags;
    recipientUserIds: string[]; // Only recipient IDs - worker loads user details
    scheduledFor?: string | null;
}

export interface BroadcastBatchJobResult {
    broadcastId: string;
    batchIndex: number;
    dispatched: number;
    failed: number;
    skipped: number;
    errors?: Array<{ userId: string; channel: string; error: string }>;
}
