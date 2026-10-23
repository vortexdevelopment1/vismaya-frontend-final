/**
 * Trending Talent Calculation Job
 * Computes rolling 30-day trending scores without paid or verification boosts.
 * Sets `isTrending` for top candidates in each category who are not `trendingExcluded`.
 */

import TalentProfile from "../models/talentProfile.model.js";
import CreditViewHistory from "../models/creditViewHistory.model.js";
import Application from "../models/application.model.js";

export const TOP_TRENDING_LIMIT_PER_CATEGORY = 5;

export const calculateTrendingTalent = async (): Promise<{ updatedCount: number }> => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Reset current trending flag for non-excluded profiles
        await TalentProfile.updateMany(
            {},
            { $set: { isTrending: false } }
        );

        // Fetch active, searchable talent profiles that are not excluded from trending
        const profiles = await TalentProfile.find({
            isSearchable: true,
            isInformational: { $ne: true },
            trendingExcluded: { $ne: true }
        });

        if (profiles.length === 0) {
            return { updatedCount: 0 };
        }

        const categoryBuckets: Record<string, Array<{ profileId: any; score: number }>> = {};

        for (const profile of profiles) {
            const cat = profile.category || "open_talent";
            if (!categoryBuckets[cat]) {
                categoryBuckets[cat] = [];
            }

            // Metric 1: Views in last 30 days
            const recentViewsCount = await CreditViewHistory.countDocuments({
                talentId: profile.userId,
                createdAt: { $gte: thirtyDaysAgo }
            });

            // Metric 2: Applications / selections in last 30 days
            const recentAppsCount = await Application.countDocuments({
                talentId: profile.userId,
                createdAt: { $gte: thirtyDaysAgo }
            });

            const recentSelectionsCount = await Application.countDocuments({
                talentId: profile.userId,
                status: "selected",
                updatedAt: { $gte: thirtyDaysAgo }
            });

            // Score formula: views * 2 + applications * 3 + selections * 10, weighted by profile completion
            const completionWeight = (profile.profileCompletionPercentage || 60) / 100;
            const rawScore = (recentViewsCount * 2) + (recentAppsCount * 3) + (recentSelectionsCount * 10);
            const trendingScore = rawScore * completionWeight;

            categoryBuckets[cat].push({
                profileId: profile._id,
                score: trendingScore
            });
        }

        let totalTrendingSet = 0;

        for (const cat of Object.keys(categoryBuckets)) {
            const list = categoryBuckets[cat];
            list.sort((a, b) => b.score - a.score);
            const topTalents = list.slice(0, TOP_TRENDING_LIMIT_PER_CATEGORY);

            for (const item of topTalents) {
                await TalentProfile.findByIdAndUpdate(item.profileId, {
                    isTrending: true
                });
                totalTrendingSet++;
            }
        }

        return { updatedCount: totalTrendingSet };

    } catch (error) {
        console.error("Trending job error:", error);
        throw error;
    }
};

export default {
    calculateTrendingTalent,
    TOP_TRENDING_LIMIT_PER_CATEGORY
};
