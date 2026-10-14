const crypto = require("crypto");
const PaymentTransaction = require("../models/paymentTransaction.model");
const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const TalentProfile = require("../models/talentProfile.model");
const { addPurchasedCredits, initializeOrganizationCredits } = require("../services/credit.service");
const { validateAndApplyCoupon, recordCouponUsage } = require("../services/coupon.service");
const { notifyUser } = require("../services/notification.service");
const { sendEmail } = require("../services/email.service");
const { fulfilTransaction, PACKAGE_CONFIG } = require("../services/paymentFulfillment.service");


/**
 * Preview / Apply Coupon Endpoint
 * POST /api/payments/apply-coupon
 */
const applyCoupon = async (req, res) => {
    try {
        const { couponCode, packageType } = req.body;

        if (!couponCode || !packageType) {
            return res.status(400).json({
                success: false,
                message: "couponCode and packageType are required"
            });
        }

        const pkg = PACKAGE_CONFIG[packageType];
        if (!pkg) {
            return res.status(400).json({
                success: false,
                message: "Invalid package type"
            });
        }

        const couponResult = await validateAndApplyCoupon({
            couponCode,
            packageType,
            orderAmount: pkg.amount
        });

        if (!couponResult.isValid) {
            return res.status(400).json({
                success: false,
                message: couponResult.message
            });
        }

        res.status(200).json({
            success: true,
            couponCode: couponResult.couponCode,
            originalAmount: pkg.amount,
            discountAmount: couponResult.discountAmount,
            finalAmount: couponResult.finalAmount,
            message: couponResult.message
        });

    } catch (error) {
        console.error("Apply coupon error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while validating coupon"
        });
    }
};

/**
 * Create a new payment order
 * POST /api/payments/create-order
 */
const createPaymentOrder = async (req, res) => {
    try {
        const userId = req.user.userId;
        const role = req.user.role;
        const { packageType, couponCode } = req.body;

        const pkg = PACKAGE_CONFIG[packageType];
        if (!pkg) {
            return res.status(400).json({
                success: false,
                message: "Invalid package type. Valid options: talent_annual_999, industry_annual_4999, credit_single_100, credit_bundle_25_2000"
            });
        }

        if (pkg.allowedRole !== role) {
            return res.status(403).json({
                success: false,
                message: `Package '${packageType}' is only available for role '${pkg.allowedRole}'`
            });
        }

        let organizationId = null;
        if (role === "organization") {
            const org = await Organization.findOne({ userId });
            if (!org) {
                return res.status(404).json({
                    success: false,
                    message: "Organization profile not found. Please complete organization setup first."
                });
            }
            organizationId = org._id;
        }

        // Apply coupon if provided
        let finalAmount = pkg.amount;
        let discountAmount = 0;
        let appliedCouponCode = null;

        if (couponCode) {
            const couponResult = await validateAndApplyCoupon({
                couponCode,
                packageType,
                orderAmount: pkg.amount
            });

            if (!couponResult.isValid) {
                return res.status(400).json({
                    success: false,
                    message: couponResult.message
                });
            }

            finalAmount = couponResult.finalAmount;
            discountAmount = couponResult.discountAmount;
            appliedCouponCode = couponResult.couponCode;
        }

        const uniqueSuffix = Date.now().toString() + "_" + crypto.randomBytes(4).toString("hex");
        const orderId = `order_vis_${uniqueSuffix}`;

        const transaction = await PaymentTransaction.create({
            userId,
            organizationId,
            packageType,
            amount: finalAmount,
            originalAmount: pkg.amount,
            discountAmount,
            couponCode: appliedCouponCode,
            currency: "INR",
            orderId,
            status: "created",
            creditsAwarded: pkg.credits,
            paymentGateway: "razorpay"
        });

        res.status(201).json({
            success: true,
            message: "Payment order created successfully",
            order: {
                orderId: transaction.orderId,
                amount: transaction.amount,
                originalAmount: transaction.originalAmount,
                discountAmount: transaction.discountAmount,
                couponCode: transaction.couponCode,
                currency: transaction.currency,
                packageType: transaction.packageType,
                packageName: pkg.name,
                key: process.env.RAZORPAY_KEY_ID || "rzp_test_mock_key"
            }
        });

    } catch (error) {
        console.error("Create payment order error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while creating payment order"
        });
    }
};

/**
 * Verify and fulfill payment (Idempotent Handler)
 * POST /api/payments/verify
 */
const verifyPayment = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { orderId, paymentId, signature } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "orderId is required"
            });
        }

        const transaction = await PaymentTransaction.findOne({ orderId });
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Payment transaction record not found"
            });
        }

        // Authorization check
        if (transaction.userId.toString() !== userId && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only verify your own payment transactions."
            });
        }

        // Idempotency check
        if (transaction.status === "successful") {
            return res.status(200).json({
                success: true,
                message: "Payment was already verified and fulfilled successfully (Idempotent)",
                transaction
            });
        }

        // Verify Razorpay signature if provided and secret exists
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (secret && signature && paymentId) {
            const expectedSignature = crypto
                .createHmac("sha256", secret)
                .update(`${orderId}|${paymentId}`)
                .digest("hex");

            if (signature !== expectedSignature) {
                transaction.status = "failed";
                await transaction.save();

                return res.status(400).json({
                    success: false,
                    message: "Invalid payment signature verification failed"
                });
            }
        }

        // Fulfill Transaction via Unified Service
        const fulfillment = await fulfilTransaction({
            orderId,
            paymentId,
            signature
        });

        if (!fulfillment.success) {
            return res.status(fulfillment.statusCode || 400).json({
                success: false,
                message: fulfillment.message || "Failed to fulfill payment transaction"
            });
        }

        res.status(200).json({
            success: true,
            message: fulfillment.alreadyFulfilled
                ? "Payment was already verified and fulfilled successfully (Idempotent)"
                : "Payment verified and membership/credits activated successfully",
            transaction: fulfillment.transaction
        });

    } catch (error) {
        console.error("Verify payment error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while verifying payment"
        });
    }
};

/**
 * Handle Gateway Webhook
 * POST /api/payments/webhook
 */
const handlePaymentWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers["x-razorpay-signature"];

        if (!webhookSecret) {
            if (process.env.NODE_ENV !== "test") {
                return res.status(500).json({ success: false, message: "Webhook secret is not configured" });
            }
            return res.status(200).json({ status: "ok", note: "Webhook secret not configured in test" });
        }

        if (!signature) {
            return res.status(401).json({ success: false, message: "Missing webhook signature" });
        }

        // Get raw body bytes (Buffer)
        const rawBody = Buffer.isBuffer(req.body)
            ? req.body
            : (typeof req.body === "string" ? Buffer.from(req.body) : Buffer.from(JSON.stringify(req.body)));

        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(rawBody)
            .digest("hex");

        if (signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
            return res.status(400).json({ success: false, message: "Invalid webhook signature" });
        }

        let parsedBody;
        try {
            parsedBody = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString("utf8")) : req.body;
        } catch (e) {
            return res.status(400).json({ success: false, message: "Malformed JSON payload in webhook" });
        }

        const event = parsedBody?.event;
        const payload = parsedBody?.payload?.payment?.entity;

        if (event === "payment.captured" && payload?.order_id) {
            await fulfilTransaction({
                orderId: payload.order_id,
                paymentId: payload.id,
                gatewayResponse: parsedBody
            });
        }

        res.status(200).json({ status: "ok" });

    } catch (error) {
        console.error("Payment webhook error:", error);
        res.status(500).json({ success: false, message: "Webhook processing error" });
    }
};


/**
 * Get Payment Receipt / Digital Invoice
 * GET /api/payments/receipt/:transactionId
 */
const getPaymentReceipt = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { transactionId } = req.params;

        const transaction = await PaymentTransaction.findById(transactionId)
            .populate("userId", "name email mobile")
            .populate("organizationId", "organizationName");

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            });
        }

        if (transaction.userId._id.toString() !== userId && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only view your own receipts."
            });
        }

        res.status(200).json({
            success: true,
            receipt: {
                invoiceNumber: transaction.invoiceNumber || `INV-${transaction._id.toString().slice(-6).toUpperCase()}`,
                orderId: transaction.orderId,
                paymentId: transaction.paymentId,
                status: transaction.status,
                packageName: PACKAGE_CONFIG[transaction.packageType]?.name || transaction.packageType,
                packageType: transaction.packageType,
                originalAmount: transaction.originalAmount || transaction.amount,
                discountAmount: transaction.discountAmount || 0,
                couponCode: transaction.couponCode || null,
                totalAmountPaid: transaction.amount,
                currency: transaction.currency,
                paidAt: transaction.paidAt || transaction.createdAt,
                customer: {
                    name: transaction.userId.name,
                    email: transaction.userId.email,
                    mobile: transaction.userId.mobile
                },
                issuedBy: "Vismaya Creative Studios"
            }
        });

    } catch (error) {
        console.error("Get receipt error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while generating receipt"
        });
    }
};

/**
 * Get current user's transaction history
 * GET /api/payments/my-transactions
 */
const getMyTransactions = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 20 } = req.query;

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
        const skip = (pageNum - 1) * limitNum;

        const [transactions, total] = await Promise.all([
            PaymentTransaction.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            PaymentTransaction.countDocuments({ userId })
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
        console.error("Get my transactions error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching transactions"
        });
    }
};

module.exports = {
    applyCoupon,
    createPaymentOrder,
    verifyPayment,
    handlePaymentWebhook,
    getPaymentReceipt,
    getMyTransactions
};
