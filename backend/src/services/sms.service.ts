/**
 * SMS & WhatsApp Notification Service
 * Provider: Fast2SMS (https://www.fast2sms.com)
 *
 * Required ENV vars:
 *   FAST2SMS_API_KEY  — from Fast2SMS Dashboard → Dev API
 *   FAST2SMS_SENDER_ID — (optional) your DLT approved sender ID, defaults to TXTIND
 */

import https from "https";

export interface SendSmsResult {
    success: boolean;
    to?: string;
    messageId?: string;
    error?: string;
}

/**
 * Send SMS via Fast2SMS Bulk DLT route
 */
export const sendSms = async ({ to, message }: { to: string; message: string }): Promise<SendSmsResult> => {
    if (!to || !message) {
        throw new Error("Phone number and message text are required");
    }

    // Normalise: Fast2SMS expects 10-digit number without +91
    const cleanMobile = String(to)
        .replace(/[^0-9]/g, "")
        .replace(/^91/, "")   // strip country code
        .trim();

    if (cleanMobile.length !== 10) {
        console.warn(`[SMS] Invalid mobile number: ${to} → ${cleanMobile}`);
        return { success: false, error: "Invalid mobile number — must be 10 digits" };
    }

    // Dev/test fallback — no real API call
    if (process.env.NODE_ENV === "test") {
        return { success: true, to: cleanMobile, messageId: "test_sms_" + Date.now() };
    }

    const apiKey = process.env.FAST2SMS_API_KEY;
    const senderId = process.env.FAST2SMS_SENDER_ID || "TXTIND";

    if (!apiKey) {
        // Dev mode — just log, never crash
        console.log(`\n[SMS DEV] To: ${cleanMobile}\nMessage: ${message}\n`);
        return { success: true, to: cleanMobile, messageId: "dev_sms_" + Date.now() };
    }

    return new Promise((resolve) => {
        const body = JSON.stringify({
            route: "v3",
            sender_id: senderId,
            message: message.slice(0, 160), // single SMS limit
            language: "english",
            flash: 0,
            numbers: cleanMobile
        });

        const options = {
            hostname: "www.fast2sms.com",
            path: "/dev/bulkV2",
            method: "POST",
            headers: {
                authorization: apiKey,
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(body),
                "cache-control": "no-cache"
            }
        };

        const req = https.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => data += chunk);
            res.on("end", () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.return === true) {
                        console.log(`[SMS] Sent to ${cleanMobile} | request_id: ${parsed.request_id}`);
                        resolve({ success: true, to: cleanMobile, messageId: parsed.request_id });
                    } else {
                        console.error("[SMS] Fast2SMS error:", parsed.message);
                        resolve({ success: false, error: parsed.message });
                    }
                } catch (e) {
                    resolve({ success: false, error: "Failed to parse Fast2SMS response" });
                }
            });
        });

        req.on("error", (err) => {
            console.error("[SMS] Network error:", err.message);
            resolve({ success: false, error: err.message });
        });

        req.write(body);
        req.end();
    });
};

export default {
    sendSms
};
