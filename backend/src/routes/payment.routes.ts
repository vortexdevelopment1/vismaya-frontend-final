import express, { Router, Request, Response, NextFunction } from "express";
import {  paymentLimiter  } from "../middleware/rateLimit.middleware.js";
import {  authenticateUser  } from "../middleware/auth.middleware.js";

import { 
    applyCoupon,
    createPaymentOrder,
    verifyPayment,
    handlePaymentWebhook,
    getPaymentReceipt,
    getMyTransactions
 } from "../controllers/payment.controller.js";

import {  validateObjectIdParam  } from "../middleware/validateObjectId.middleware.js";

const router = express.Router();

router.param("transactionId", validateObjectIdParam);

// Support optional authentication for registration flows where user account does not exist yet
const optionalAuthForRegistration = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authenticateUser(req, res, next);
    }
    const pkg = req.body?.packageType;
    const isRegistrationPkg = pkg === "talent_annual_999" || pkg === "industry_annual_4999";
    if (isRegistrationPkg || req.path === "/verify" || req.path === "/mock-confirm") {
        return next();
    }
    return res.status(401).json({
        success: false,
        message: "Authentication token is required"
    });
};

// Coupon validation
router.post(
    "/apply-coupon",
    optionalAuthForRegistration,
    applyCoupon
);

// Order creation & verification
router.post(
    "/create-order",
    optionalAuthForRegistration,
    paymentLimiter,
    createPaymentOrder
);

router.post(
    "/verify",
    optionalAuthForRegistration,
    paymentLimiter,
    verifyPayment
);

router.post(
    "/mock-confirm",
    optionalAuthForRegistration,
    paymentLimiter,
    verifyPayment
);

// Webhook endpoint (gateway server-to-server)
router.post(
    "/webhook",
    handlePaymentWebhook
);

// Receipt & Invoice
router.get(
    "/receipt/:transactionId",
    authenticateUser,
    getPaymentReceipt
);

// Transaction history
router.get(
    "/my-transactions",
    authenticateUser,
    getMyTransactions
);

export default router;
