import { Request, Response } from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import PaymentTransaction from "../models/paymentTransaction.model.js";
import Organization from "../models/organization.model.js";
import { validateAndApplyCoupon } from "../services/coupon.service.js";
import { fulfilTransaction, PACKAGE_CONFIG } from "../services/paymentFulfillment.service.js";

/**
 * Determine payment mode ('mock' | 'razorpay')
 * Defaults to 'mock' if not set.
 */
export const getPaymentMode = (): "mock" | "razorpay" => {
    return (process.env.PAYMENT_MODE as "mock" | "razorpay") || "mock";
};

let razorpayClient: Razorpay | null = null;
const getRazorpayClient = (): Razorpay => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
        throw new Error("Razorpay credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are missing or not configured");
    }
    if (!razorpayClient) {
        razorpayClient = new Razorpay({
            key_id: keyId,
            key_secret: keySecret
        });
    }
    return razorpayClient;
};

/**
 * Preview / Apply Coupon Endpoint
 * POST /api/payments/apply-coupon
 */
export const applyCoupon = async (req: Request, res: Response): Promise<any> => {
    try {
        const { couponCode, packageType } = req.body;

        if (!couponCode || !packageType) {
            return res.status(400).json({
                success: false,
                message: "couponCode and packageType are required"
            });
        }

        const pkg = (PACKAGE_CONFIG as Record<string, any>)[packageType];
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
export const createPaymentOrder = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const role = req.user?.role;
        const { packageType, couponCode } = req.body;
        const mode = getPaymentMode();

        if (mode === "mock" && process.env.NODE_ENV === "production") {
            return res.status(500).json({
                success: false,
                message: "Mock payment mode is strictly disabled in production"
            });
        }

        const pkg = (PACKAGE_CONFIG as Record<string, any>)[packageType];
        if (!pkg) {
            return res.status(400).json({
                success: false,
                message: "Invalid package type. Valid options: talent_annual_999, industry_annual_4999, credit_single_100, credit_bundle_25_2000"
            });
        }

        const isRegistrationOrder = packageType === "talent_annual_999" || packageType === "industry_annual_4999";
        const emailInput = req.body.email || req.body.userEmail || req.user?.email;
        let normalizedEmail: string | undefined = undefined;

        if (!userId) {
            if (!isRegistrationOrder) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication is required to purchase credit packs"
                });
            }
            if (!emailInput || typeof emailInput !== "string" || !emailInput.includes("@")) {
                return res.status(400).json({
                    success: false,
                    message: "Valid email address is required for registration payment order"
                });
            }
            normalizedEmail = emailInput.trim().toLowerCase();
        } else {
            if (pkg.allowedRole !== role) {
                return res.status(403).json({
                    success: false,
                    message: `Package '${packageType}' is only available for role '${pkg.allowedRole}'`
                });
            }
            if (emailInput) normalizedEmail = String(emailInput).trim().toLowerCase();
        }

        let organizationId = null;
        if (role === "organization" && userId) {
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

        if (mode === "razorpay") {
            // Real Razorpay Order via SDK
            const rzp = getRazorpayClient();
            const amountInPaise = Math.round(finalAmount * 100);

            let rzpOrder: any;
            try {
                rzpOrder = await rzp.orders.create({
                    amount: amountInPaise,
                    currency: "INR",
                    receipt: `rcpt_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
                    notes: {
                        userId: userId?.toString() || "",
                        packageType,
                        organizationId: organizationId ? organizationId.toString() : ""
                    }
                });
            } catch (rzpErr: any) {
                console.error("Razorpay order creation error:", rzpErr);
                return res.status(502).json({
                    success: false,
                    message: rzpErr?.error?.description || rzpErr?.message || "Failed to create order with Razorpay gateway"
                });
            }

            const transaction: any = await PaymentTransaction.create({
                userId: userId || undefined,
                email: normalizedEmail,
                customerEmail: normalizedEmail,
                organizationId: organizationId || undefined,
                packageType,
                amount: finalAmount,
                originalAmount: pkg.amount,
                discountAmount,
                couponCode: appliedCouponCode || undefined,
                currency: "INR",
                orderId: rzpOrder.id,
                status: "created",
                creditsAwarded: pkg.credits,
                paymentGateway: "razorpay",
                gatewayResponse: rzpOrder
            });

            return res.status(201).json({
                success: true,
                message: "Payment order created successfully",
                mode: "razorpay",
                razorpayOrderId: rzpOrder.id,
                orderId: rzpOrder.id,
                keyId: process.env.RAZORPAY_KEY_ID,
                amount: transaction.amount,
                currency: transaction.currency,
                order: {
                    orderId: rzpOrder.id,
                    razorpayOrderId: rzpOrder.id,
                    keyId: process.env.RAZORPAY_KEY_ID,
                    key: process.env.RAZORPAY_KEY_ID,
                    amount: transaction.amount,
                    originalAmount: transaction.originalAmount,
                    discountAmount: transaction.discountAmount,
                    couponCode: transaction.couponCode,
                    currency: transaction.currency,
                    packageType: transaction.packageType,
                    packageName: pkg.name,
                    mode: "razorpay"
                }
            });
        }

        // Mock mode (non-production only)
        const uniqueSuffix = Date.now().toString() + "_" + crypto.randomBytes(4).toString("hex");
        const orderId = `order_vis_${uniqueSuffix}`;

        const transaction: any = await PaymentTransaction.create({
            userId: userId || undefined,
            email: normalizedEmail,
            customerEmail: normalizedEmail,
            organizationId: organizationId || undefined,
            packageType,
            amount: finalAmount,
            originalAmount: pkg.amount,
            discountAmount,
            couponCode: appliedCouponCode || undefined,
            currency: "INR",
            orderId,
            status: "created",
            creditsAwarded: pkg.credits,
            paymentGateway: "razorpay"
        });

        return res.status(201).json({
            success: true,
            message: "Payment order created successfully",
            mode: "mock",
            order: {
                orderId: transaction.orderId,
                amount: transaction.amount,
                originalAmount: transaction.originalAmount,
                discountAmount: transaction.discountAmount,
                couponCode: transaction.couponCode,
                currency: transaction.currency,
                packageType: transaction.packageType,
                packageName: pkg.name,
                key: process.env.RAZORPAY_KEY_ID || "rzp_test_mock_key",
                mode: "mock"
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
export const verifyPayment = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { orderId, paymentId, signature } = req.body;
        const mode = getPaymentMode();

        if (mode === "mock" && process.env.NODE_ENV === "production") {
            return res.status(500).json({
                success: false,
                message: "Mock payment verification is strictly disabled in production"
            });
        }

        // Field requirements based on PAYMENT_MODE
        if (mode === "razorpay") {
            if (!orderId || !paymentId || !signature) {
                return res.status(400).json({
                    success: false,
                    message: "orderId, paymentId, and signature are required in razorpay mode"
                });
            }
        } else {
            if (!orderId) {
                return res.status(400).json({
                    success: false,
                    message: "orderId is required"
                });
            }
        }

        const transaction = await PaymentTransaction.findOne({ orderId });
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Payment transaction record not found"
            });
        }

        // Authorization check
        if (transaction.userId && transaction.userId.toString() !== userId && req.user?.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only verify your own payment transactions."
            });
        }

        // Idempotency check: if already fulfilled, return cleanly
        if (transaction.status === "successful") {
            return res.status(200).json({
                success: true,
                message: "Payment was already verified and fulfilled successfully (Idempotent)",
                mode,
                transaction
            });
        }

        // Signature verification
        if (mode === "razorpay") {
            const secret = process.env.RAZORPAY_KEY_SECRET;
            if (!secret) {
                return res.status(500).json({
                    success: false,
                    message: "Razorpay secret key is not configured"
                });
            }

            const expectedSignature = crypto
                .createHmac("sha256", secret)
                .update(`${orderId}|${paymentId}`)
                .digest("hex");

            const sigBuf = Buffer.from(signature);
            const expBuf = Buffer.from(expectedSignature);

            if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
                transaction.status = "failed";
                await transaction.save();

                return res.status(400).json({
                    success: false,
                    message: "Invalid payment signature verification failed"
                });
            }
        } else {
            // Mock mode: verify signature only if provided and secret exists
            const secret = process.env.RAZORPAY_KEY_SECRET;
            if (secret && signature && paymentId) {
                const expectedSignature = crypto
                    .createHmac("sha256", secret)
                    .update(`${orderId}|${paymentId}`)
                    .digest("hex");

                const sigBuf = Buffer.from(signature);
                const expBuf = Buffer.from(expectedSignature);

                if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
                    transaction.status = "failed";
                    await transaction.save();

                    return res.status(400).json({
                        success: false,
                        message: "Invalid payment signature verification failed"
                    });
                }
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
            mode,
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
export const handlePaymentWebhook = async (req: Request, res: Response): Promise<any> => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers["x-razorpay-signature"] as string | undefined;

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
        const rawBody: Buffer = Buffer.isBuffer(req.body)
            ? req.body
            : (typeof req.body === "string" ? Buffer.from(req.body) : Buffer.from(JSON.stringify(req.body)));

        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(rawBody)
            .digest("hex");

        if (signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
            return res.status(400).json({ success: false, message: "Invalid webhook signature" });
        }

        let parsedBody: any;
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
export const getPaymentReceipt = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { transactionId } = req.params;

        const transaction = await PaymentTransaction.findById(String(transactionId))
            .populate("userId", "name email mobile")
            .populate("organizationId", "organizationName");

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            });
        }

        const customerUser = transaction.userId as any;
        if (customerUser._id.toString() !== userId && req.user?.role !== "admin") {
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
                packageName: (PACKAGE_CONFIG as Record<string, any>)[transaction.packageType]?.name || transaction.packageType,
                packageType: transaction.packageType,
                originalAmount: transaction.originalAmount || transaction.amount,
                discountAmount: transaction.discountAmount || 0,
                couponCode: transaction.couponCode || null,
                totalAmountPaid: transaction.amount,
                currency: transaction.currency,
                paidAt: transaction.paidAt || (transaction as any).createdAt,
                customer: {
                    name: customerUser.name,
                    email: customerUser.email,
                    mobile: customerUser.mobile
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
export const getMyTransactions = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { page = 1, limit = 20 } = req.query;

        const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 20, 1), 50);
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
