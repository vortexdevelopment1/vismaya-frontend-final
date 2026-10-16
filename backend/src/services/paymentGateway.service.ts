import crypto from "crypto";
import Razorpay from "razorpay";

/**
 * Payment Gateway Provider Abstraction
 * Supports Razorpay (live/test) and graceful mock fallback for local dev.
 */

let razorpayInstance: any = null;

const getRazorpay = (): any => {
    if (razorpayInstance) return razorpayInstance;

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        return null; // Fall back to mock mode
    }

    try {
        const RazorpayClass = (Razorpay as any).default || Razorpay;
        razorpayInstance = new RazorpayClass({ key_id: keyId, key_secret: keySecret });
        return razorpayInstance;
    } catch (err) {
        console.error("[PaymentGateway] Razorpay SDK not installed. Run: npm install razorpay");
        return null;
    }
};

export interface CreateOrderParams {
    amount: number;
    currency?: string;
    receipt?: string;
    notes?: Record<string, string>;
}

/**
 * Create a Razorpay order (or mock order in dev mode)
 */
export const createGatewayOrder = async ({ amount, currency = "INR", receipt, notes = {} }: CreateOrderParams): Promise<any> => {
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
 */
export const verifyGatewaySignature = ({
    orderId,
    paymentId,
    signature,
    secret
}: {
    orderId?: string;
    paymentId?: string;
    signature?: string;
    secret?: string;
}): boolean => {
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
 */
export const verifyWebhookSignature = (rawBody?: Buffer | string, signature?: string, secret?: string): boolean => {
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
 */
export const fetchOrder = async (orderId: string): Promise<any> => {
    const razorpay = getRazorpay();
    if (!razorpay) {
        console.warn("[PaymentGateway] fetchOrder skipped — mock mode");
        return null;
    }
    return await razorpay.orders.fetch(orderId);
};

export default {
    createGatewayOrder,
    verifyGatewaySignature,
    verifyWebhookSignature,
    fetchOrder
};
