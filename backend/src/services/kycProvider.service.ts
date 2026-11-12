import { IKycProviderService } from "./kycProvider.interface.js";
import { MockKycProviderService } from "./mockKycProvider.service.js";
import { CashfreeVerificationService } from "./cashfreeVerification.service.js";

const cashfreeService = new CashfreeVerificationService();
const mockService = new MockKycProviderService();

/**
 * Returns the active KYC verification provider.
 * Respects production safety gates: mock is strictly forbidden in production.
 */
export function getActiveKycProvider(): IKycProviderService {
    if (cashfreeService.isConfigured()) {
        return cashfreeService;
    }

    if (process.env.NODE_ENV === "production") {
        // Return cashfree service so it throws clean "pending configuration" message instead of mocking
        return cashfreeService;
    }

    return mockService;
}
