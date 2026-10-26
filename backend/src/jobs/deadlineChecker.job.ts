import Opportunity from "../models/opportunity.model.js";
import Project from "../models/project.model.js";
import Organization from "../models/organization.model.js";
import Application from "../models/application.model.js";
import Notification from "../models/notification.model.js";
import ProjectShortlist from "../models/projectShortlist.model.js";
import { isDeadlineExpired } from "../utils/date.util.js";

/**
 * Check and automatically close opportunities whose deadlines have passed.
 * Respects Asia/Kolkata date boundaries (closed after the end of the deadline date).
 * Idempotent: only touches opportunities with status "published".
 * Notifies the owning organization once.
 * 
 * @param targetOpportunityIds Optional filter for testing on specific opportunity IDs without touching live records.
 */
export const checkAndCloseExpiredOpportunities = async (
    targetOpportunityIds?: (string | any)[]
): Promise<{ closedCount: number; closedIds?: string[]; error?: string }> => {
    try {
        const now = new Date();
        const query: any = {
            status: "published"
        };

        if (targetOpportunityIds && targetOpportunityIds.length > 0) {
            query._id = { $in: targetOpportunityIds };
        }

        const publishedOpportunities = await Opportunity.find(query);

        if (!publishedOpportunities || publishedOpportunities.length === 0) {
            return { closedCount: 0, closedIds: [] };
        }

        const expiredOpportunities = publishedOpportunities.filter(opp =>
            isDeadlineExpired(opp.deadline, now)
        );

        if (expiredOpportunities.length === 0) {
            return { closedCount: 0, closedIds: [] };
        }

        const closedOppIds: string[] = [];

        for (const opp of expiredOpportunities) {
            // Strictly update only if still published (idempotency guard)
            const updateResult = await Opportunity.updateOne(
                { _id: opp._id, status: "published" },
                {
                    $set: {
                        status: "closed",
                        closedAt: now,
                        autoClosedAt: now
                    }
                }
            );

            if (updateResult.modifiedCount === 0) {
                continue;
            }

            closedOppIds.push(String(opp._id));

            // Expire project shortlists tied to closed opportunities (§8: Shortlists expire when the opportunity closes)
            await ProjectShortlist.updateMany(
                { opportunityId: opp._id, status: "shortlisted" },
                { $set: { status: "archived" as any } }
            );

            // Notify owning organization once
            try {
                const project = await Project.findById(opp.projectId);
                if (project?.organizationId) {
                    const organization = await Organization.findById(project.organizationId);
                    if (organization?.userId) {
                        const appCount = await Application.countDocuments({ opportunityId: opp._id });

                        // Check if notification already exists to guarantee strictly one notification
                        const existingNotif = await Notification.findOne({
                            recipient: organization.userId,
                            type: "opportunity_closed",
                            referenceId: opp._id
                        });

                        if (!existingNotif) {
                            await Notification.create({
                                recipient: organization.userId,
                                type: "opportunity_closed",
                                title: "Opportunity Closed",
                                message: `Your opportunity ${opp.title} has closed. ${appCount} applications received`,
                                referenceId: opp._id,
                                referenceType: "Opportunity"
                            });
                        }
                    }
                }
            } catch (notifErr) {
                console.error(`[DeadlineChecker Job] Failed to notify organization for opportunity ${opp._id}:`, notifErr);
            }
        }

        if (closedOppIds.length > 0) {
            console.log(`[DeadlineChecker Job]: Auto-closed ${closedOppIds.length} expired opportunities and notified owning organizations.`);
        }

        return { closedCount: closedOppIds.length, closedIds: closedOppIds };
    } catch (error: any) {
        console.error("[DeadlineChecker Job Error]:", error);
        return { closedCount: 0, error: error?.message || String(error) };
    }
};

/**
 * Start periodic interval for background auto-closure
 */
let intervalId: NodeJS.Timeout | null = null;

export const startDeadlineChecker = (intervalMs = 60 * 60 * 1000): void => { // Defaults to 1 hour
    // Run immediately once on startup
    checkAndCloseExpiredOpportunities().catch(() => {});

    if (!intervalId) {
        intervalId = setInterval(() => {
            checkAndCloseExpiredOpportunities().catch(() => {});
        }, intervalMs);
    }
};

export const stopDeadlineChecker = (): void => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
};

export default {
    checkAndCloseExpiredOpportunities,
    startDeadlineChecker,
    stopDeadlineChecker
};
