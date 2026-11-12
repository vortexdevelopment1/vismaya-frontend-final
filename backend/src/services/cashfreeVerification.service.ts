import { IKycProviderService, InitiateOtpResult, VerifyOtpResult } from "./kycProvider.interface.js";

/**
 * Cashfree Aadhaar Verification Provider
 * Uses Cashfree Identity Verification Suite API (v2023 / offline-aadhaar)
 * Ready for manager-supplied credentials.
 */
export class CashfreeVerificationService implements IKycProviderService {
    public readonly providerName = "cashfree_verification";

    private getBaseUrl(): string {
        const env = (process.env.CASHFREE_VERIFICATION_ENV || process.env.CASHFREE_ENV || "sandbox").toLowerCase().trim();
        return env === "production" || env === "prod"
            ? "https://api.cashfree.com/verification"
            : "https://sandbox.cashfree.com/verification";
    }

    private getHeaders(): Record<string, string> {
        const appId = process.env.CASHFREE_VERIFICATION_APP_ID || process.env.CASHFREE_APP_ID || "";
        const secretKey = process.env.CASHFREE_VERIFICATION_SECRET_KEY || process.env.CASHFREE_SECRET_KEY || "";
        return {
            "Content-Type": "application/json",
            "x-client-id": appId,
            "x-client-secret": secretKey,
        };
    }

    public isConfigured(): boolean {
        const appId = process.env.CASHFREE_VERIFICATION_APP_ID || process.env.CASHFREE_APP_ID;
        const secretKey = process.env.CASHFREE_VERIFICATION_SECRET_KEY || process.env.CASHFREE_SECRET_KEY;
        const enabled = process.env.CASHFREE_VERIFICATION_ENABLED === "true";
        return Boolean(enabled && appId && secretKey);
    }

    public async initiateAadhaarOtp(aadhaarNumber: string): Promise<InitiateOtpResult> {
        if (!this.isConfigured()) {
            throw new Error("Cashfree Aadhaar Verification is awaiting configuration from administration. Please use manual document verification or try again later.");
        }

        const cleanAadhaar = String(aadhaarNumber).replace(/\D/g, "");
        const url = `${this.getBaseUrl()}/offline-aadhaar/otp`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({ aadhaar_number: cleanAadhaar })
            });

            const data = await response.json() as any;

            if (!response.ok || data.status === "ERROR" || data.status === "FAILED") {
                return {
                    success: false,
                    refId: "",
                    message: data.message || "Failed to trigger OTP from Aadhaar verification gateway."
                };
            }

            return {
                success: true,
                refId: data.ref_id || data.reference_id,
                message: data.message || "OTP sent successfully to registered mobile number."
            };
        } catch (error: any) {
            console.error("Cashfree initiate Aadhaar OTP error:", error);
            return {
                success: false,
                refId: "",
                message: error?.message || "Could not connect to Aadhaar verification provider."
            };
        }
    }

    public async verifyAadhaarOtp(refId: string, otp: string): Promise<VerifyOtpResult> {
        if (!this.isConfigured()) {
            throw new Error("Cashfree Aadhaar Verification is awaiting configuration from administration.");
        }

        const url = `${this.getBaseUrl()}/offline-aadhaar/verify`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({
                    ref_id: refId,
                    otp: String(otp).trim()
                })
            });

            const data = await response.json() as any;

            if (!response.ok || data.status !== "VALID" && data.status !== "SUCCESS") {
                return {
                    success: false,
                    refId,
                    isAgeEligible: false,
                    message: data.message || "Invalid or expired verification code."
                };
            }

            // Data minimization: calculate age eligibility only (do not store raw DOB or gender)
            let isAgeEligible = true;
            if (data.dob) {
                const birthYear = new Date(data.dob).getFullYear();
                const currentYear = new Date().getFullYear();
                if (!isNaN(birthYear) && (currentYear - birthYear) < 18) {
                    isAgeEligible = false;
                }
            }

            const lastFour = data.last_four_digits || data.last_4_digits || "XXXX";

            return {
                success: true,
                refId: data.ref_id || refId,
                nameOnId: data.name ? String(data.name).trim() : undefined,
                isAgeEligible,
                maskedAadhaarPreview: String(lastFour),
                message: "Aadhaar e-KYC verified successfully."
            };
        } catch (error: any) {
            console.error("Cashfree verify Aadhaar OTP error:", error);
            return {
                success: false,
                refId,
                isAgeEligible: false,
                message: error?.message || "Verification gateway connection failure."
            };
        }
    }
}
