import { Request, Response } from "express";
import Organization from "../models/organization.model.js";
import TalentProfile from "../models/talentProfile.model.js";
import CreditLedger from "../models/creditLedger.model.js";
import CreditTransaction from "../models/creditTransaction.model.js";
import CreditViewHistory from "../models/creditViewHistory.model.js";
import { consumeProfileViewCredit, initializeOrganizationCredits } from "../services/credit.service.js";
import { toFullProfile, toCard } from "../utils/serializers/talent.js";
import { recordProfileView } from "../services/analytics.service.js";

import User from "../models/user.model.js";

const getOrCreateOrganization = async (userId: string | any) => {
    if (!userId) return null;
    let organization = await Organization.findOne({ userId });
    if (!organization) {
        const user = await User.findById(userId);
        if (user && user.role === "organization") {
            const baseName = user.name || "My Organization";
            const cleanSlug = baseName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)+/g, "");
            organization = await Organization.create({
                userId,
                organizationName: baseName,
                slug: `${cleanSlug || "org"}-${user._id.toString().slice(-4)}`
            });
        }
    }
    return organization;
};

export const getMyCreditBalance = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;

        const organization = await getOrCreateOrganization(userId);
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        let ledger: any = await CreditLedger.findOne({ organizationId: organization._id });
        if (!ledger) {
            return res.status(200).json({
                success: true,
                balance: 0,
                includedCredits: 0,
                purchasedCredits: 0,
                consumedCredits: 0,
                lowBalanceWarning: true,
                buyMoreViews: true,
                warningMessage: "You have not activated your subscription yet."
            });
        }

        const isLowBalance = ledger.balance < 10;

        res.status(200).json({
            success: true,
            balance: ledger.balance,
            includedCredits: ledger.includedCredits,
            purchasedCredits: ledger.purchasedCredits,
            consumedCredits: ledger.consumedCredits,
            lowBalanceWarning: isLowBalance,
            buyMoreViews: ledger.balance === 0,
            warningMessage: isLowBalance
                ? `Low balance alert: You have only ${ledger.balance} profile-view credits remaining.`
                : null
        });

    } catch (error) {
        console.error("Get credit balance error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching credit balance"
        });
    }
};

export const getCreditHistory = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { page = 1, limit = 20 } = req.query as { page?: string; limit?: string };

        const organization = await getOrCreateOrganization(userId);
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        const pageNum = parseInt(String(page), 10) || 1;
        const limitNum = Math.min(parseInt(String(limit), 10) || 20, 50);
        const skip = (pageNum - 1) * limitNum;

        const [transactions, total] = await Promise.all([
            CreditTransaction.find({ organizationId: organization._id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            CreditTransaction.countDocuments({ organizationId: organization._id })
        ]);

        res.status(200).json({
            success: true,
            count: transactions.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            transactions
        });

    } catch (error) {
        console.error("Get credit history error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching credit history"
        });
    }
};

/**
 * GET /api/credits/viewed
 * Returns list of talent previously viewed/unlocked by this organization (paginated)
 */
export const getViewedTalents = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { page = 1, limit = 12 } = req.query as { page?: string; limit?: string };

        const organization = await getOrCreateOrganization(userId);
        if (!organization) {
            return res.status(404).json({ success: false, message: "Organization not found" });
        }

        const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 12, 1), 50);
        const skip = (pageNum - 1) * limitNum;

        const [historyItems, total] = await Promise.all([
            CreditViewHistory.find({ organizationId: organization._id })
                .sort({ lastViewedAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            CreditViewHistory.countDocuments({ organizationId: organization._id })
        ]);

        const talentUserIds = historyItems.map((h: any) => h.talentId);
        const profiles = await TalentProfile.find({ userId: { $in: talentUserIds } }).lean();
        const profileMap: Record<string, any> = {};
        for (const p of profiles) {
            profileMap[p.userId.toString()] = p;
        }

        const results = historyItems.map((item: any) => {
            const profile = profileMap[item.talentId.toString()];
            const card = profile ? toCard(profile, "organization") : null;
            return {
                viewHistoryId: item._id,
                talentId: item.talentId,
                firstViewedAt: item.firstViewedAt,
                lastViewedAt: item.lastViewedAt,
                exemptionExpiresAt: item.exemptionExpiresAt,
                isExemptionActive: item.exemptionExpiresAt > new Date(),
                profile: card
            };
        });

        res.status(200).json({
            success: true,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            count: results.length,
            viewedTalents: results
        });

    } catch (error) {
        console.error("Get viewed talents error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch viewed talents" });
    }
};

export const unlockFullTalentProfile = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { talentIdOrVismayaId } = req.params;

        // 1. Verify Organization Account
        const organization = await getOrCreateOrganization(userId);
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        // 2. Find Target Talent Profile
        const query = typeof talentIdOrVismayaId === "string" && talentIdOrVismayaId.startsWith("VIS-")
            ? { vismayaId: talentIdOrVismayaId }
            : { $or: [{ userId: talentIdOrVismayaId }, { _id: talentIdOrVismayaId }] };

        const talentProfile = await TalentProfile.findOne(query);

        if (!talentProfile) {
            return res.status(404).json({
                success: false,
                message: "Talent profile not found"
            });
        }

        const targetTalentUserId = talentProfile.userId;

        // 3. Atomically consume credit (or apply 7-day exemption)
        const creditResult = await consumeProfileViewCredit(organization._id, targetTalentUserId);

        if (!creditResult.allowed) {
            return res.status(402).json({
                success: false,
                errorCode: "INSUFFICIENT_CREDITS",
                message: creditResult.message,
                currentBalance: creditResult.balance,
                buyMoreViews: creditResult.balance === 0,
                purchaseOptions: [
                    { name: "Single Profile View", priceINR: 100, credits: 1 },
                    { name: "25 Profile Views Bundle", priceINR: 2000, credits: 25 }
                ]
            });
        }

        // Record talent analytics view for unlocked view
        recordProfileView({
            talentId: targetTalentUserId,
            viewerId: userId,
            viewerRole: "organization",
            isFullProfile: true
        });

        // 4. Return Full Unlocked Profile with Serializer (no contact details)
        const badges = {
            identityVerified: talentProfile.isVerified,
            professionalVerified: talentProfile.badgeType === "verified"
        };

        const safeFullProfile = toFullProfile(talentProfile, req.user || null, {
            badges,
            isUnlocked: true
        });

        const isLowBalance = creditResult.balance !== undefined && creditResult.balance < 10;

        res.status(200).json({
            success: true,
            message: creditResult.isExempt
                ? "Profile viewed under active 7-day free exemption (0 credits consumed)"
                : "Profile unlocked successfully (1 credit consumed)",
            lowBalanceWarning: isLowBalance,
            warning: isLowBalance ? `Low balance alert: You have only ${creditResult.balance} profile-view credits remaining.` : null,
            creditInfo: {
                consumed: creditResult.consumed,
                isExempt: creditResult.isExempt,
                remainingBalance: creditResult.balance,
                exemptionExpiresAt: creditResult.exemptionExpiresAt,
                lowBalanceWarning: isLowBalance,
                warningMessage: isLowBalance ? `Low balance alert: You have only ${creditResult.balance} profile-view credits remaining.` : null,
                buyMoreViews: creditResult.balance === 0
            },
            profile: safeFullProfile
        });

    } catch (error) {
        console.error("Unlock full talent profile error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while unlocking talent profile"
        });
    }
};

export default {
    getMyCreditBalance,
    getCreditHistory,
    getViewedTalents,
    unlockFullTalentProfile
};
