const crypto = require("crypto");
const PaymentTransaction = require("../models/paymentTransaction.model");
const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const TalentProfile = require("../models/talentProfile.model");
const { getNextInvoiceNumber } = require("../models/counter.model");
const { addPurchasedCredits, initializeOrganizationCredits } = require("./credit.service");
const { recordCouponUsage } = require("./coupon.service");
const { notifyUser } = require("./notification.service");
const { sendEmail } = require("./email.service");

const PACKAGE_CONFIG = {
    talent_annual_999: {
        amount: 999,
        allowedRole: "talent",
        credits: 0,
        name: "Talent Annual Membership (₹999)"
    },
    industry_annual_4999: {
        amount: 4999,
        allowedRole: "organization",
        credits: 100,
        name: "Industry Annual Membership (₹4,999)"
    },
    credit_single_100: {
        amount: 100,
        allowedRole: "organization",
        credits: 1,
        name: "Single Profile View Credit (₹100)"
    },
    credit_bundle_25_2000: {
        amount: 2000,
        allowedRole: "organization",
        credits: 25,
        name: "Bundle of 25 Profile View Credits (₹2,000)"
    }
};

/**
 * Idempotent Payment Fulfillment Service
 * Handles sequential invoice generation, status transitions, role activations and credit awards.
 */
const fulfilTransaction = async ({ orderId, paymentId, signature, gatewayResponse = {} }) => {
    try {
        const existingTx = await PaymentTransaction.findOne({ orderId });

        if (!existingTx) {
            return {
                success: false,
                statusCode: 404,
                message: "Payment transaction record not found"
            };
        }

        // Idempotency check: if already fulfilled, return cleanly
        if (existingTx.status === "successful") {
            return {
                success: true,
                alreadyFulfilled: true,
                transaction: existingTx
            };
        }

        // Generate sequential invoice number (INV-YYYY-XXXXX)
        const invoiceNumber = await getNextInvoiceNumber();
        const resolvedPaymentId = paymentId || `pay_mock_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

        // Atomic transition from created/attempted -> successful
        const transaction = await PaymentTransaction.findOneAndUpdate(
            { orderId, status: { $ne: "successful" } },
            {
                $set: {
                    status: "successful",
                    paymentId: resolvedPaymentId,
                    signature: signature || "",
                    invoiceNumber,
                    paidAt: new Date(),
                    gatewayResponse
                }
            },
            { returnDocument: "after" }
        );

        if (!transaction) {
            // Concurrently fulfilled by another request/webhook
            const recheck = await PaymentTransaction.findOne({ orderId });
            return {
                success: true,
                alreadyFulfilled: true,
                transaction: recheck
            };
        }

        // Record coupon usage if applicable
        if (transaction.couponCode) {
            try {
                await recordCouponUsage(transaction.couponCode);
            } catch (couponErr) {
                console.warn("[Fulfillment] Coupon usage recording warning:", couponErr.message);
            }
        }

        // Activate User paid status
        const user = await User.findById(transaction.userId);
        if (user) {
            user.isPaid = true;
            await user.save();
        }

        // Role-specific activations
        if (transaction.packageType === "talent_annual_999") {
            await TalentProfile.findOneAndUpdate(
                { userId: transaction.userId },
                { $set: { isPaid: true, paidAt: new Date() } }
            );

            const profile = await TalentProfile.findOne({ userId: transaction.userId });
            if (profile) {
                profile.isSearchable = (profile.profileCompletionPercentage || 0) >= 60;
                await profile.save();
            }
        } else if (transaction.packageType === "industry_annual_4999") {
            const org = await Organization.findOneAndUpdate(
                { userId: transaction.userId },
                { $set: { isPaid: true, paidAt: new Date() } },
                { returnDocument: "after" }
            );

            const targetOrgId = org ? org._id : (transaction.organizationId || transaction.userId);
            await initializeOrganizationCredits(targetOrgId);
        } else if (transaction.packageType === "credit_single_100" || transaction.packageType === "credit_bundle_25_2000") {
            let targetOrgId = transaction.organizationId;
            if (!targetOrgId) {
                const org = await Organization.findOne({ userId: transaction.userId });
                targetOrgId = org ? org._id : transaction.userId;
            }

            await addPurchasedCredits(
                targetOrgId,
                transaction.creditsAwarded,
                transaction._id
            );
        }

        // Send notifications and confirmation email
        try {
            await notifyUser({
                recipientId: transaction.userId,
                type: "payment_success",
                title: "Payment Successful",
                message: `Your payment of ₹${transaction.amount} was successfully processed. Invoice: ${invoiceNumber}`
            });

            if (user && user.email) {
                await sendEmail({
                    to: user.email,
                    subject: `Vismaya Payment Receipt - ${invoiceNumber}`,
                    text: `Hello ${user.name},\n\nThank you for your payment of ₹${transaction.amount} on Vismaya Creative Studios.\n\nInvoice Number: ${invoiceNumber}\nPackage: ${PACKAGE_CONFIG[transaction.packageType]?.name || transaction.packageType}\nOrder ID: ${transaction.orderId}\nPayment ID: ${resolvedPaymentId}\n\nYour account has been activated.\n\nBest regards,\nVismaya Billing Team`
                });
            }
        } catch (notifErr) {
            console.warn("[Fulfillment] Notification/email warning:", notifErr.message);
        }

        return {
            success: true,
            alreadyFulfilled: false,
            transaction
        };

    } catch (error) {
        console.error("fulfilTransaction error:", error);
        throw error;
    }
};

module.exports = {
    PACKAGE_CONFIG,
    fulfilTransaction
};
