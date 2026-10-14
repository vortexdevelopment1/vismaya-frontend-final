const Organization = require("../models/organization.model");
const TalentProfile = require("../models/talentProfile.model");
const CreditLedger = require("../models/creditLedger.model");
const CreditTransaction = require("../models/creditTransaction.model");
const CreditViewHistory = require("../models/creditViewHistory.model");
const Verification = require("../models/verification.model");
const { consumeProfileViewCredit, initializeOrganizationCredits } = require("../services/credit.service");
const { toFullProfile, toCard } = require("../utils/serializers/talent");
const { recordProfileView } = require("../services/analytics.service");

const getMyCreditBalance = async (req, res) => {
    try {
        const userId = req.user.userId;

        const organization = await Organization.findOne({ userId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        let ledger = await CreditLedger.findOne({ organizationId: organization._id });
        if (!ledger) {
            ledger = await initializeOrganizationCredits(organization._id);
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

const getCreditHistory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 20 } = req.query;

        const organization = await Organization.findOne({ userId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        const pageNum = parseInt(page, 10) || 1;
        const limitNum = Math.min(parseInt(limit, 10) || 20, 50);
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
const getViewedTalents = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 12 } = req.query;

        const organization = await Organization.findOne({ userId });
        if (!organization) {
            return res.status(404).json({ success: false, message: "Organization not found" });
        }

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);
        const skip = (pageNum - 1) * limitNum;

        const [historyItems, total] = await Promise.all([
            CreditViewHistory.find({ organizationId: organization._id })
                .sort({ lastViewedAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            CreditViewHistory.countDocuments({ organizationId: organization._id })
        ]);

        const talentUserIds = historyItems.map(h => h.talentId);
        const profiles = await TalentProfile.find({ userId: { $in: talentUserIds } }).lean();
        const profileMap = {};
        for (const p of profiles) {
            profileMap[p.userId.toString()] = p;
        }

        const results = historyItems.map(item => {
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

const unlockFullTalentProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { talentIdOrVismayaId } = req.params;

        // 1. Verify Organization Account
        const organization = await Organization.findOne({ userId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        // 2. Find Target Talent Profile
        const query = talentIdOrVismayaId.startsWith("VIS-")
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

        const safeFullProfile = toFullProfile(talentProfile, req.user, {
            badges,
            isUnlocked: true
        });

        res.status(200).json({
            success: true,
            message: creditResult.isExempt
                ? "Profile viewed under active 7-day free exemption (0 credits consumed)"
                : "Profile unlocked successfully (1 credit consumed)",
            creditInfo: {
                consumed: creditResult.consumed,
                isExempt: creditResult.isExempt,
                remainingBalance: creditResult.balance,
                exemptionExpiresAt: creditResult.exemptionExpiresAt,
                lowBalanceWarning: creditResult.lowBalanceWarning,
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

module.exports = {
    getMyCreditBalance,
    getCreditHistory,
    getViewedTalents,
    unlockFullTalentProfile
};
