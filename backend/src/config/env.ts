export const env = {
    get NODE_ENV(): string {
        return process.env.NODE_ENV || "development";
    },
    get PORT(): number {
        return Number(process.env.PORT) || 5000;
    },
    get MONGODB_URI(): string {
        return process.env.MONGODB_URI || "";
    },
    get JWT_SECRET(): string {
        return process.env.JWT_SECRET || "";
    },
    get JWT_EXPIRES_IN(): string {
        return process.env.JWT_EXPIRES_IN || "7d";
    },
    get ALLOW_LEGACY_TOKENS(): boolean {
        return process.env.ALLOW_LEGACY_TOKENS === "true";
    },
    get TRUST_PROXY_HOPS(): number {
        return Number(process.env.TRUST_PROXY_HOPS || 0);
    },
    get CORS_ORIGIN(): string | undefined {
        return process.env.CORS_ORIGIN;
    },
    get CLIENT_URL(): string | undefined {
        return process.env.CLIENT_URL;
    },
    get CLOUDINARY_CLOUD_NAME(): string | undefined {
        return process.env.CLOUDINARY_CLOUD_NAME;
    },
    get CLOUDINARY_API_KEY(): string | undefined {
        return process.env.CLOUDINARY_API_KEY;
    },
    get CLOUDINARY_API_SECRET(): string | undefined {
        return process.env.CLOUDINARY_API_SECRET;
    },
    get GOOGLE_CLIENT_ID(): string | undefined {
        return process.env.GOOGLE_CLIENT_ID;
    },
    get ALLOW_FAKE_GOOGLE_TOKENS(): boolean {
        return process.env.ALLOW_FAKE_GOOGLE_TOKENS === "true";
    },
    get RAZORPAY_KEY_ID(): string | undefined {
        return process.env.RAZORPAY_KEY_ID;
    },
    get RAZORPAY_KEY_SECRET(): string | undefined {
        return process.env.RAZORPAY_KEY_SECRET;
    },
    get RAZORPAY_WEBHOOK_SECRET(): string | undefined {
        return process.env.RAZORPAY_WEBHOOK_SECRET;
    },
    get SMTP_HOST(): string | undefined {
        return process.env.SMTP_HOST;
    },
    get SMTP_PORT(): number {
        return parseInt(process.env.SMTP_PORT || "587", 10);
    },
    get SMTP_USER(): string | undefined {
        return process.env.SMTP_USER;
    },
    get SMTP_PASS(): string | undefined {
        return process.env.SMTP_PASS;
    },
    get EMAIL_FROM(): string {
        return process.env.EMAIL_FROM || "no-reply@vismayastudios.com";
    },
    get FAST2SMS_API_KEY(): string | undefined {
        return process.env.FAST2SMS_API_KEY;
    },
    get FAST2SMS_SENDER_ID(): string {
        return process.env.FAST2SMS_SENDER_ID || "TXTIND";
    },
    get MAX_UNLOCKS_PER_HOUR(): number {
        return parseInt(process.env.MAX_UNLOCKS_PER_HOUR || "50", 10);
    },
    get MAX_ACTIVE_APPLICATIONS(): number {
        return parseInt(process.env.MAX_ACTIVE_APPLICATIONS || "20", 10);
    },
    get GUARDIAN_DOC_REQUIRED(): boolean {
        return process.env.GUARDIAN_DOC_REQUIRED === "true";
    }
};

export default env;
