const Opportunity = require("../models/opportunity.model");
const ProjectShortlist = require("../models/projectShortlist.model");

/**
 * Check and automatically close opportunities whose deadlines have passed
 */
const checkAndCloseExpiredOpportunities = async () => {
    try {
        const now = new Date();
        const expiredOpportunities = await Opportunity.find({
            status: "published",
            deadline: { $lte: now }
        });

        if (!expiredOpportunities || expiredOpportunities.length === 0) {
            return { closedCount: 0 };
        }

        const oppIds = expiredOpportunities.map(o => o._id);

        // Update opportunity status to closed
        await Opportunity.updateMany(
            { _id: { $in: oppIds } },
            {
                $set: {
                    status: "closed",
                    closedAt: now,
                    autoClosedAt: now
                }
            }
        );

        // Expire project shortlists tied to closed opportunities (§8: Shortlists expire when the opportunity closes)
        await ProjectShortlist.updateMany(
            { opportunityId: { $in: oppIds }, status: "shortlisted" },
            { $set: { status: "archived" } }
        );

        console.log(`[DeadlineChecker Job]: Auto-closed ${oppIds.length} expired opportunities and archived associated shortlists.`);
        return { closedCount: oppIds.length };
    } catch (error) {
        console.error("[DeadlineChecker Job Error]:", error);
        return { error: error.message };
    }
};

/**
 * Start periodic interval for background auto-closure
 */
let intervalId = null;

const startDeadlineChecker = (intervalMs = 60 * 60 * 1000) => { // Defaults to 1 hour
    // Run immediately once on startup
    checkAndCloseExpiredOpportunities().catch(() => {});

    if (!intervalId) {
        intervalId = setInterval(() => {
            checkAndCloseExpiredOpportunities().catch(() => {});
        }, intervalMs);
    }
};

const stopDeadlineChecker = () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
};

module.exports = {
    checkAndCloseExpiredOpportunities,
    startDeadlineChecker,
    stopDeadlineChecker
};
