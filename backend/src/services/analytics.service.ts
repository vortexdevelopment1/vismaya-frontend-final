import TalentViewEvent from "../models/talentViewEvent.model.js";

/**
 * Record a talent profile view event per Master Specification §14
 */
export const recordProfileView = async ({
    talentId,
    viewerId,
    viewerRole,
    isFullProfile = true
}: {
    talentId?: any;
    viewerId?: any;
    viewerRole?: string;
    isFullProfile?: boolean;
}): Promise<void> => {
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
            viewerRole: (viewerRole as any) || "guest",
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
export const getTalentAnalytics = async (talentUserId: any): Promise<{ lifetimeViews: number; last30DaysViews: number }> => {
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

export default {
    recordProfileView,
    getTalentAnalytics
};
