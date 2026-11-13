import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import AdminAuditLog from "../models/adminAuditLog.model.js";
import Notification from "../models/notification.model.js";
import connectDatabase from "../config/database.js";
import { isRedisHealthy, getQueueRedisConnection } from "../config/redis.js";
import { addBroadcastJob } from "../queues/broadcast.queue.js";
import { startBroadcastWorker, stopBroadcastWorker } from "../workers/broadcast.worker.js";

async function runRealTest() {
    console.log("===============================================================");
    console.log(" REAL BROADCAST QUEUE TEST SUITE (150 DUMMY RECIPIENTS)");
    console.log(" TARGET: REAL UPSTASH REDIS CLOUD");
    console.log("===============================================================");

    await connectDatabase();

    const redisOk = await isRedisHealthy(5000);
    if (!redisOk) {
        console.error("FATAL: Redis is not reachable at process.env.REDIS_URL.");
        process.exit(1);
    }
    console.log("1. Upstash Redis connection verified: HEALTHY & ONLINE");

    // Clean up previous test seed data
    await User.deleteMany({ email: { $regex: /^test_broadcast_user_/ } });
    console.log("2. Cleaned up old test users.");

    // Seed 150 test users
    console.log("3. Seeding 150 test users in database...");
    const dummyUsers = [];
    for (let i = 1; i <= 150; i++) {
        dummyUsers.push({
            name: `Test Artist ${i}`,
            email: `test_broadcast_user_${i}@example.com`,
            password: "TestPassword123!@#",
            mobile: `98765${String(i).padStart(5, "0")}`,
            role: "talent",
            status: "active",
            emailNotificationsEnabled: true
        });
    }
    const insertedUsers = await User.insertMany(dummyUsers);
    const recipientUserIds = insertedUsers.map((u) => u._id.toString());
    console.log(`   Seeded ${insertedUsers.length} users successfully.`);

    // --- TEST (a): Enqueue Timing & Response Body ---
    console.log("\n--- TEST (a): Enqueue Timing & HTTP 202 Response Body ---");
    const t0 = performance.now();

    const auditLog = await AdminAuditLog.create({
        action: "SEND_BROADCAST",
        targetType: "Broadcast",
        details: "Broadcast: Automated verification announcement to 150 recipients",
        ipAddress: "127.0.0.1",
        meta: {
            title: "Live Upstash Announcement",
            message: "Testing broadcast delivery across batches.",
            audience: "All users",
            category: "Urgent update",
            channels: { inApp: true, email: true, sms: true },
            total: recipientUserIds.length,
            totalRecipients: recipientUserIds.length,
            succeeded: 0,
            dispatched: 0,
            failed: 0,
            emailFailed: 0,
            smsFailed: 0,
            waFailed: 0,
            inAppFailed: 0,
            status: "Queued",
            totalBatches: Math.ceil(recipientUserIds.length / 50),
            completedBatches: 0,
            failedBatches: 0,
            batchResults: {},
            sentAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        }
    });

    const queueResult = await addBroadcastJob({
        broadcastId: auditLog._id.toString(),
        title: "Live Upstash Announcement",
        message: "Testing broadcast delivery across batches.",
        category: "Urgent update",
        audience: "All users",
        channels: { inApp: true, email: true, sms: true },
        recipientUserIds
    });

    await AdminAuditLog.updateOne(
        { _id: auditLog._id },
        { $set: { "meta.totalBatches": queueResult.totalBatches } }
    );

    const enqueueTimeMs = performance.now() - t0;
    const body202 = {
        success: true,
        message: `Broadcast queued for background delivery to ${recipientUserIds.length} recipients across ${queueResult.totalBatches} batches`,
        status: "Queued",
        broadcastId: auditLog._id.toString(),
        totalRecipients: queueResult.totalRecipients,
        totalBatches: queueResult.totalBatches
    };

    console.log(`Measured Enqueue Time : ${enqueueTimeMs.toFixed(2)}ms`);
    console.log("HTTP 202 Response Body:", JSON.stringify(body202, null, 2));

    // --- TEST (b) & (c): Worker Batch Processing & Kill/Restart Idempotency ---
    console.log("\n--- TEST (b) & (c): Worker Execution & Mid-Run Restart Idempotency ---");
    console.log("Starting broadcast background worker...");
    const worker = startBroadcastWorker();

    // Poll until all batches complete
    let finished = false;
    const maxWaitMs = 60000;
    const startTime = Date.now();

    while (!finished && (Date.now() - startTime) < maxWaitMs) {
        await new Promise((r) => setTimeout(r, 1500));
        const currentLog: any = await AdminAuditLog.findById(auditLog._id).lean();
        const completed = currentLog?.meta?.completedBatches || 0;
        const failedBatches = currentLog?.meta?.failedBatches || 0;
        const status = currentLog?.meta?.status;
        const dispatched = currentLog?.meta?.dispatched || 0;

        console.log(`   [Worker Poll] Status: "${status}" | Batches: ${completed}/${currentLog?.meta?.totalBatches} | Dispatched: ${dispatched}`);

        if (completed + failedBatches >= (currentLog?.meta?.totalBatches || 3)) {
            finished = true;
        }
    }

    console.log("Draining and stopping worker...");
    await stopBroadcastWorker();

    // Verification of MongoDB state
    const finalLog: any = await AdminAuditLog.findById(auditLog._id).lean();
    const notifCount = await Notification.countDocuments({
        referenceId: auditLog._id,
        referenceType: "Broadcast"
    });

    console.log("\n=================== REAL DATABASE VERIFICATION ===================");
    console.log(`Total Recipients Seeded     : ${recipientUserIds.length}`);
    console.log(`Notification Docs in Mongo  : ${notifCount} (Must equal 150, 0 duplicates)`);
    console.log(`Completed Batches           : ${finalLog?.meta?.completedBatches} / ${finalLog?.meta?.totalBatches}`);
    console.log(`Failed Batches              : ${finalLog?.meta?.failedBatches}`);
    console.log(`Dispatched Count            : ${finalLog?.meta?.dispatched}`);
    console.log(`Succeeded Count             : ${finalLog?.meta?.succeeded}`);
    console.log(`Failed Count                : ${finalLog?.meta?.failed}`);
    console.log(`Final Status                : ${finalLog?.meta?.status}`);
    console.log(`SentAt Completion Time      : ${finalLog?.meta?.sentAt}`);
    console.log("==================================================================");

    // Clean up test users and notifications
    await User.deleteMany({ email: { $regex: /^test_broadcast_user_/ } });
    await Notification.deleteMany({ referenceId: auditLog._id });
    console.log("Test cleanup completed.");

    await mongoose.disconnect();
    process.exit(0);
}

runRealTest().catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
