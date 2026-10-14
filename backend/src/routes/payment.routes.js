const express = require("express");
const { paymentLimiter } = require("../middleware/rateLimit.middleware");
const { authenticateUser } = require("../middleware/auth.middleware");

const {
    applyCoupon,
    createPaymentOrder,
    verifyPayment,
    handlePaymentWebhook,
    getPaymentReceipt,
    getMyTransactions
} = require("../controllers/payment.controller");

const { validateObjectIdParam } = require("../middleware/validateObjectId.middleware");

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

module.exports = router;
