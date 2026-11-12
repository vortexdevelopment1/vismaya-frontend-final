export interface InitiateOtpResult {
    success: boolean;
    refId: string;
    message: string;
}

export interface VerifyOtpResult {
    success: boolean;
    refId: string;
    nameOnId?: string;
    isAgeEligible: boolean;
    maskedAadhaarPreview?: string;
    message: string;
}

export interface IKycProviderService {
    readonly providerName: string;
    initiateAadhaarOtp(aadhaarNumber: string): Promise<InitiateOtpResult>;
    verifyAadhaarOtp(refId: string, otp: string): Promise<VerifyOtpResult>;
}
