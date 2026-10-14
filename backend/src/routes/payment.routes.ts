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

// Coupon validation
router.post(
    "/apply-coupon",
    authenticateUser,
    applyCoupon
);

// Order creation & verification
router.post(
    "/create-order",
    authenticateUser,
    paymentLimiter,
    createPaymentOrder
);

router.post(
    "/verify",
    authenticateUser,
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
