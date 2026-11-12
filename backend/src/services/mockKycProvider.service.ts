import crypto from "crypto";
import { IKycProviderService, InitiateOtpResult, VerifyOtpResult } from "./kycProvider.interface.js";

/**
 * Development-Only Mock Aadhaar Verification Provider
 * Strictly prohibited and blocked in production environments.
 */
export class MockKycProviderService implements IKycProviderService {
    public readonly providerName = "mock_harness_dev";

    public async initiateAadhaarOtp(aadhaarNumber: string): Promise<InitiateOtpResult> {
        if (process.env.NODE_ENV === "production") {
            throw new Error("Mock Aadhaar provider is strictly disabled in production. Real provider credentials are required.");
        }

        // Clean digits check
        const cleanAadhaar = String(aadhaarNumber).replace(/\D/g, "");
        if (cleanAadhaar.length !== 12) {
            return {
                success: false,
                refId: "",
                message: "Please enter a valid 12-digit Aadhaar number."
            };
        }

        const lastFour = cleanAadhaar.slice(-4);
        const refId = `mock_ref_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

        return {
            success: true,
            refId,
            message: `OTP sent to mobile linked with Aadhaar ending in XXXX-XXXX-${lastFour} (Dev test OTP: 123456)`
        };
    }

    public async verifyAadhaarOtp(refId: string, otp: string): Promise<VerifyOtpResult> {
        if (process.env.NODE_ENV === "production") {
            throw new Error("Mock Aadhaar provider is strictly disabled in production. Real provider credentials are required.");
        }

        const cleanOtp = String(otp).trim();
        // Standard test OTP is 123456 in development
        if (cleanOtp !== "123456") {
            return {
                success: false,
                refId,
                isAgeEligible: false,
                message: "Incorrect verification code. Please enter the valid OTP (test OTP is 123456)."
            };
        }

        return {
            success: true,
            refId,
            nameOnId: "Verified Talent Artist",
            isAgeEligible: true,
            maskedAadhaarPreview: "XXXX",
            message: "Aadhaar e-KYC verified successfully (Development Sandbox)."
        };
    }
}
