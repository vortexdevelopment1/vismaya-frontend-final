const TalentViewEvent = require("../models/talentViewEvent.model");

/**
 * Record a talent profile view event per Master Specification §14
 */
const recordProfileView = async ({ talentId, viewerId, viewerRole, isFullProfile = true }) => {
    try {
        if (!talentId) return;

        // Rule 1: Own view NEVER counts
        if (viewerId && viewerId.toString() === talentId.toString()) {
            return;
        }

        // Rule 2: Admin view NEVER counts
        if (viewerRole === "admin") {
            return;
        }

        // Rule 3: Industry limited preview DOES NOT count; only full profile view counts
        if (viewerRole === "organization" && !isFullProfile) {
            return;
        }

        await TalentViewEvent.create({
            talentId,
            viewerId: viewerId || null,
            viewerRole: viewerRole || "guest",
            isFullProfile
        });

    } catch (error) {
        console.error("Record profile view error:", error);
        // Do not throw to avoid failing the profile retrieval endpoint
    }
};

/**
 * Get talent profile view analytics (Lifetime + Last 30 Days numeric totals)
 * Excludes viewer identities and demographic data per §14
 */
const getTalentAnalytics = async (talentUserId) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const [lifetimeViews, last30DaysViews] = await Promise.all([
            TalentViewEvent.countDocuments({ talentId: talentUserId }),
            TalentViewEvent.countDocuments({
                talentId: talentUserId,
                createdAt: { $gte: thirtyDaysAgo }
            })
        ]);

        return {
            lifetimeViews,
            last30DaysViews
        };

    } catch (error) {
        console.error("Get talent analytics error:", error);
        throw error;
    }
};

module.exports = {
    recordProfileView,
    getTalentAnalytics
};
