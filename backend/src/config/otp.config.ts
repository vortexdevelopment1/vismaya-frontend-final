/**
 * OTP Configuration
 * Supports production random OTPs and a configurable demo mode for environments without SMS/Email providers.
 */
export const OTP_CONFIG = {
    DEMO_CODE: "123456",
    isDemoMode: (): boolean => process.env.OTP_DEMO_MODE === "true"
};

export default OTP_CONFIG;
