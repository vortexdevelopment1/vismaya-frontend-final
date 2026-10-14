const crypto = require("crypto");

/**
 * Payment Gateway Provider Abstraction
 * Supports Razorpay (live/test) and graceful mock fallback for local dev.
 * 
 * Required ENV vars:
 *   RAZORPAY_KEY_ID     - from Razorpay Dashboard → Settings → API Keys
 *   RAZORPAY_KEY_SECRET - from Razorpay Dashboard → Settings → API Keys
 */

// Lazily initialise Razorpay only when keys are present
let razorpayInstance = null;

const getRazorpay = () => {
    if (razorpayInstance) return razorpayInstance;

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        return null; // Fall back to mock mode
    }

    try {
        const Razorpay = require("razorpay");
        razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
        return razorpayInstance;
    } catch (err) {
        console.error("[PaymentGateway] Razorpay SDK not installed. Run: npm install razorpay");
        return null;
    }
};

/**
 * Create a Razorpay order (or mock order in dev mode)
 * @param {Object} params
 * @param {number}  params.amount   - Amount in INR (NOT paise — we convert here)
 * @param {string}  params.currency - Default: "INR"
 * @param {string}  params.receipt  - Short unique reference string
 * @param {Object}  params.notes    - Optional key-value notes attached to order
 * @returns {Promise<Object>} Razorpay order object
 */
const createGatewayOrder = async ({ amount, currency = "INR", receipt, notes = {} }) => {
    const razorpay = getRazorpay();

    if (razorpay) {
        // Live / Test mode — create a real Razorpay order
        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100), // Convert INR → paise
            currency,
            receipt: receipt || `rcpt_${Date.now()}`,
            notes,
            payment_capture: 1 // Auto-capture on successful payment
        });

        console.log(`[PaymentGateway] Razorpay order created: ${order.id}`);
        return order;
    }

    // ─── Mock / Dev fallback ─────────────────────────────────────────────────
    // Used when RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set.
    console.warn("[PaymentGateway] RAZORPAY keys not configured — using mock order");
    const mockOrderId = `order_mock_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    return {
        id: mockOrderId,
        amount: Math.round(amount * 100),
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        status: "created",
        notes
    };
};

/**
 * Verify Razorpay payment signature (HMAC-SHA256)
 * Call this after the frontend receives razorpay_payment_id & razorpay_signature
 * 
 * @param {Object} params
 * @param {string} params.orderId   - razorpay_order_id
 * @param {string} params.paymentId - razorpay_payment_id
 * @param {string} params.signature - razorpay_signature from frontend
 * @param {string} [params.secret]  - Override key secret (optional, uses env by default)
 * @returns {boolean}
 */
const verifyGatewaySignature = ({ orderId, paymentId, signature, secret }) => {
    if (!orderId || !paymentId || !signature) return false;

    const keySecret = secret || process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
        // No secret configured — skip verification in dev/mock mode
        console.warn("[PaymentGateway] RAZORPAY_KEY_SECRET not set, skipping signature verification (mock mode)");
        return true;
    }

    const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

    if (signature.length !== expectedSignature.length) return false;

    return crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expectedSignature, "hex")
    );
};

/**
 * Verify Razorpay webhook signature
 * @param {Buffer|string} rawBody   - Raw request body (must be Buffer or string, NOT parsed JSON)
 * @param {string}        signature - Value of x-razorpay-signature header
 * @param {string}        secret    - RAZORPAY_WEBHOOK_SECRET
 * @returns {boolean}
 */
const verifyWebhookSignature = (rawBody, signature, secret) => {
    if (!rawBody || !signature || !secret) return false;

    const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);
    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

    if (signature.length !== expectedSignature.length) return false;

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
};

/**
 * Fetch a Razorpay order by its ID (useful for server-side status checks)
 * @param {string} orderId - Razorpay order ID
 * @returns {Promise<Object|null>}
 */
const fetchOrder = async (orderId) => {
    const razorpay = getRazorpay();
    if (!razorpay) {
        console.warn("[PaymentGateway] fetchOrder skipped — mock mode");
        return null;
    }
    return await razorpay.orders.fetch(orderId);
};

module.exports = {
    createGatewayOrder,
    verifyGatewaySignature,
    verifyWebhookSignature,
    fetchOrder
};
