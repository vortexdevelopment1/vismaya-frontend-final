/**
 * Vismaya Creative Studios — Abuse Detection Service
 * Monitors high-volume profile viewing and unlock velocity.
 */

const CreditTransaction = require("../models/creditTransaction.model");
const AdminAuditLog = require("../models/adminAuditLog.model");
const { notifyUser } = require("./notification.service");
const User = require("../models/user.model");

const checkHighVolumeUnlocks = async (organizationId) => {
    try {
        const maxUnlocksPerHour = parseInt(process.env.MAX_UNLOCKS_PER_HOUR, 10) || 50;
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const recentUnlocksCount = await CreditTransaction.countDocuments({
            organizationId,
            type: "profile_view_deduction",
            createdAt: { $gte: oneHourAgo }
        });

        if (recentUnlocksCount >= maxUnlocksPerHour) {
            // Flag high volume unlock activity
            const admins = await User.find({ role: "admin", status: "active" }).select("_id");

            await AdminAuditLog.create({
                action: "HIGH_VOLUME_UNLOCK_ALERT",
                targetType: "Organization",
                targetId: organizationId,
                details: `Organization exceeded unlock velocity threshold with ${recentUnlocksCount} profile unlocks within the last hour.`
            });

            for (const admin of admins) {
                await notifyUser({
                    recipientId: admin._id,
                    type: "security_alert",
                    title: "High-Volume Unlock Alert",
                    message: `Organization ${organizationId} unlocked ${recentUnlocksCount} profiles in 1 hour (limit: ${maxUnlocksPerHour}).`
                });
            }

            return {
                flagged: true,
                unlocksCount: recentUnlocksCount,
                threshold: maxUnlocksPerHour
            };
        }

        return { flagged: false, unlocksCount: recentUnlocksCount };

    } catch (error) {
        console.error("Abuse detection error:", error);
        return { flagged: false, error: error.message };
    }
};

module.exports = {
    checkHighVolumeUnlocks
};
