import CreditLedger from "../models/creditLedger.model.js";
import CreditTransaction from "../models/creditTransaction.model.js";
import CreditViewHistory from "../models/creditViewHistory.model.js";
import { checkHighVolumeUnlocks } from "./abuseDetection.service.js";

/**
 * Initializes organization credit ledger with 100 registration credits
 */
export const initializeOrganizationCredits = async (organizationId: any): Promise<any> => {
    try {
        let ledger: any = await CreditLedger.findOne({ organizationId });
        if (!ledger) {
            ledger = await CreditLedger.create({
                organizationId,
                includedCredits: 100,
                purchasedCredits: 0,
                consumedCredits: 0,
                balance: 100
            });

            await CreditTransaction.create({
                organizationId,
                type: "registration_bonus",
                amount: 100,
                balanceAfter: 100,
                description: "Initial 100 registration credits bonus"
            });
        }
        return ledger;
    } catch (error) {
        console.error("Initialize credits error:", error);
        throw error;
    }
};

export interface ConsumeProfileCreditResult {
    allowed: boolean;
    consumed: boolean;
    isExempt?: boolean;
    exemptionExpiresAt?: Date;
    balance?: number;
    lowBalanceWarning?: boolean;
    error?: string;
    buyMoreViews?: boolean;
    message?: string;
}

/**
 * Consumes 1 credit atomically for a full profile view, respecting the 7-day exemption rule.
 */
export const consumeProfileViewCredit = async (organizationId: any, talentId: any): Promise<ConsumeProfileCreditResult> => {
    try {
        const now = new Date();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

        // Ensure ledger exists
        let ledger: any = await CreditLedger.findOne({ organizationId });
        if (!ledger) {
            ledger = await initializeOrganizationCredits(organizationId);
        }

        // Step 1: Check 7-Day Exemption View History
        const viewHistory = await CreditViewHistory.findOne({ organizationId, talentId });

        if (viewHistory && viewHistory.exemptionExpiresAt > now) {
            // Within 7-day exemption: 0 credit consumed
            return {
                allowed: true,
                consumed: false,
                isExempt: true,
                exemptionExpiresAt: viewHistory.exemptionExpiresAt,
                balance: ledger?.balance ?? 0,
                lowBalanceWarning: (ledger?.balance ?? 0) < 10
            };
        }

        // Step 2: Atomic Credit Deduction Guard
        // Uses atomic update requiring balance >= 1 to prevent concurrency race conditions
        const updatedLedger: any = await CreditLedger.findOneAndUpdate(
            { organizationId, balance: { $gte: 1 } },
            {
                $inc: { balance: -1, consumedCredits: 1 },
                $set: { lastTransactionAt: now }
            },
            { returnDocument: 'after' }
        );

        if (!updatedLedger) {
            // Insufficient balance
            const curBalance = ledger?.balance ?? 0;
            return {
                allowed: false,
                consumed: false,
                error: "INSUFFICIENT_CREDITS",
                balance: curBalance,
                buyMoreViews: curBalance === 0,
                message: "Insufficient profile-view credits. Please purchase additional credits to unlock full profiles."
            };
        }

        // Step 3: Record Transaction & Update 7-Day Exemption
        const exemptionExpiry = new Date(now.getTime() + sevenDaysMs);

        await Promise.all([
            CreditTransaction.create({
                organizationId,
                type: "profile_view_deduction",
                amount: -1,
                balanceAfter: updatedLedger.balance,
                talentId,
                description: "Full talent profile unlock deduction (1 credit)"
            }),
            CreditViewHistory.findOneAndUpdate(
                { organizationId, talentId },
                {
                    $set: {
                        lastViewedAt: now,
                        exemptionExpiresAt: exemptionExpiry
                    },
                    $setOnInsert: { firstViewedAt: now }
                },
                { upsert: true, returnDocument: 'after' }
            )
        ]);

        // Check abuse velocity hook in background
        checkHighVolumeUnlocks(organizationId).catch(err => console.error("Abuse detection check error:", err));

        return {
            allowed: true,
            consumed: true,
            isExempt: false,
            exemptionExpiresAt: exemptionExpiry,
            balance: updatedLedger.balance,
            lowBalanceWarning: updatedLedger.balance < 10
        };

    } catch (error) {
        console.error("Consume profile view credit error:", error);
        throw error;
    }
};

/**
 * Admin adjustments to organization credit ledger
 */
export const adjustCreditsByAdmin = async (organizationId: any, amount: number, reason?: string, adminId?: any): Promise<any> => {
    try {
        let ledger: any = await CreditLedger.findOne({ organizationId });
        if (!ledger) {
            ledger = await initializeOrganizationCredits(organizationId);
        }

        const newBalance = Math.max((ledger?.balance ?? 0) + amount, 0);

        const updatedLedger = await CreditLedger.findOneAndUpdate(
            { organizationId },
            {
                $set: { balance: newBalance, lastTransactionAt: new Date() }
            },
            { returnDocument: 'after' }
        );

        if (!updatedLedger) {
            throw new Error("Failed to update credit ledger");
        }

        await CreditTransaction.create({
            organizationId,
            type: "admin_adjustment",
            amount,
            balanceAfter: updatedLedger.balance,
            description: reason || "Administrative balance adjustment",
            adminId
        });

        return updatedLedger;

    } catch (error) {
        console.error("Admin adjust credits error:", error);
        throw error;
    }
};

/**
 * Adds purchased credits from a verified payment transaction
 */
export const addPurchasedCredits = async (organizationId: any, creditsCount: number, paymentTransactionId?: any): Promise<any> => {
    try {
        let ledger: any = await CreditLedger.findOne({ organizationId });
        if (!ledger) {
            ledger = await initializeOrganizationCredits(organizationId);
        }

        const updatedLedger = await CreditLedger.findOneAndUpdate(
            { organizationId },
            {
                $inc: { balance: creditsCount, purchasedCredits: creditsCount },
                $set: { lastTransactionAt: new Date() }
            },
            { returnDocument: 'after' }
        );

        if (!updatedLedger) {
            throw new Error("Failed to update credit ledger for purchase");
        }

        await CreditTransaction.create({
            organizationId,
            type: "purchase",
            amount: creditsCount,
            balanceAfter: updatedLedger.balance,
            paymentTransactionId,
            description: `Purchased ${creditsCount} profile view credits`
        });

        return updatedLedger;
    } catch (error) {
        console.error("Add purchased credits error:", error);
        throw error;
    }
};

export default {
    initializeOrganizationCredits,
    consumeProfileViewCredit,
    adjustCreditsByAdmin,
    addPurchasedCredits
};
