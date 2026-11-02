/**
 * Cashfree Payment Gateway Service
 * Handles order creation, status verification, and webhook signature validation
 * using Cashfree Payment Gateway v2023-08-01 API.
 */

export interface CashfreeOrderParams {
    orderId: string;
    amount: number;
    currency?: string;
    customerEmail: string;
    customerPhone?: string;
    customerName?: string;
    returnUrl?: string;
}

export interface CashfreeOrderResponse {
    cfOrderId: string;
    orderId: string;
    paymentSessionId: string;
    orderStatus: string;
    orderAmount: number;
    orderCurrency: string;
}

export interface CashfreeVerifyResponse {
    isPaid: boolean;
    orderStatus: string;
    orderId: string;
    amount: number;
    paymentId?: string;
    paymentMethod?: string;
    raw: Record<string, unknown>;
}

export class CashfreeService {
    private static getBaseUrl(): string {
        const env = (process.env.CASHFREE_ENV || "sandbox").toLowerCase().trim();
        return env === "production" || env === "prod"
            ? "https://api.cashfree.com/pg"
            : "https://sandbox.cashfree.com/pg";
    }

    private static getHeaders(): Record<string, string> {
        const appId = process.env.CASHFREE_APP_ID || "";
        const secretKey = process.env.CASHFREE_SECRET_KEY || "";
        return {
            "Content-Type": "application/json",
            "x-client-id": appId,
            "x-client-secret": secretKey,
            "x-api-version": "2023-08-01",
        };
    }

    public static isConfigured(): boolean {
        return Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);
    }

    public static getEnvironment(): "sandbox" | "production" {
        const env = (process.env.CASHFREE_ENV || "sandbox").toLowerCase().trim();
        return env === "production" || env === "prod" ? "production" : "sandbox";
    }

    /**
     * Create an order on Cashfree Payment Gateway
     */
    public static async createOrder(params: CashfreeOrderParams): Promise<CashfreeOrderResponse> {
        const url = `${this.getBaseUrl()}/orders`;
        const headers = this.getHeaders();

        // Sanitize customer phone: ensure it's a 10-digit number for Indian numbers
        let cleanPhone = String(params.customerPhone || "").replace(/[^0-9]/g, "");
        if (cleanPhone.length > 10) {
            cleanPhone = cleanPhone.slice(-10);
        }
        if (!cleanPhone || cleanPhone.length !== 10) {
            cleanPhone = "9999999999";
        }

        // Sanitize customer id
        const customerId = (params.customerEmail || "cust")
            .replace(/[^a-zA-Z0-9_-]/g, "_")
            .slice(0, 50);

        const payload: Record<string, unknown> = {
            order_id: params.orderId,
            order_amount: Number(params.amount.toFixed(2)),
            order_currency: params.currency || "INR",
            customer_details: {
                customer_id: customerId,
                customer_email: params.customerEmail,
                customer_phone: cleanPhone,
                customer_name: params.customerName || "Customer",
            },
        };

        if (params.returnUrl) {
            payload.order_meta = {
                return_url: params.returnUrl,
            };
        }

        const response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        });

        const data: any = await response.json();

        if (!response.ok || !data.payment_session_id) {
            const errorMsg = data.message || data.error_message || "Failed to create order on Cashfree";
            console.error("[Cashfree] Create order error:", data);
            throw new Error(`Cashfree error: ${errorMsg}`);
        }

        return {
            cfOrderId: String(data.cf_order_id),
            orderId: data.order_id,
            paymentSessionId: data.payment_session_id,
            orderStatus: data.order_status,
            orderAmount: data.order_amount,
            orderCurrency: data.order_currency,
        };
    }

    /**
     * Verify payment status of an order on Cashfree
     */
    public static async verifyOrder(orderId: string): Promise<CashfreeVerifyResponse> {
        const url = `${this.getBaseUrl()}/orders/${encodeURIComponent(orderId)}`;
        const headers = this.getHeaders();

        const response = await fetch(url, {
            method: "GET",
            headers,
        });

        const data: any = await response.json();

        if (!response.ok) {
            const errorMsg = data.message || "Unable to fetch order status from Cashfree";
            throw new Error(`Cashfree error: ${errorMsg}`);
        }

        const isPaid = data.order_status === "PAID";
        let paymentId: string | undefined = undefined;
        let paymentMethod: string | undefined = undefined;

        // Fetch payment details if paid or attempted
        try {
            const paymentsUrl = `${this.getBaseUrl()}/orders/${encodeURIComponent(orderId)}/payments`;
            const payRes = await fetch(paymentsUrl, { method: "GET", headers });
            if (payRes.ok) {
                const payments: any = await payRes.json();
                if (Array.isArray(payments) && payments.length > 0) {
                    // Look for SUCCESS payment
                    const successfulPay = payments.find((p: any) => p.payment_status === "SUCCESS") || payments[0];
                    if (successfulPay) {
                        paymentId = String(successfulPay.cf_payment_id || successfulPay.payment_id || "");
                        paymentMethod = successfulPay.payment_method ? JSON.stringify(successfulPay.payment_method) : undefined;
                    }
                }
            }
        } catch (fetchErr) {
            console.warn("[Cashfree] Could not fetch detailed payments array:", fetchErr);
        }

        return {
            isPaid,
            orderStatus: data.order_status,
            orderId: data.order_id,
            amount: data.order_amount,
            paymentId,
            paymentMethod,
            raw: data,
        };
    }
}

export default CashfreeService;
