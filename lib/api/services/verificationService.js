/**
 * Verification API Service
 * Handles identity (Aadhaar/Passport), professional (IMDb/Credits), and business (GST/CIN) verifications.
 */

import { apiClient } from "../client.js";
import { isRealMode } from "../config.js";
import { mapVerification } from "../mappers/index.js";

export const verificationService = {
  /**
   * Submit Government Identity Verification
   * @param {Object} payload { documentType, documentNumber, frontImageUrl, backImageUrl }
   */
  async submitIdentityVerification(payload) {
    if (!isRealMode("verifications")) {
      const mockVer = {
        id: "ver_mock_" + Date.now(),
        type: "identity",
        status: "Pending",
        submittedAt: new Date().toISOString(),
        ...payload,
      };
      return {
        success: true,
        data: mapVerification(mockVer),
      };
    }

    const res = await apiClient.post("/api/verifications/identity", payload);
    const doc = res?.data || res;
    return {
      success: true,
      data: doc ? mapVerification(doc) : null,
    };
  },

  /**
   * Submit Professional Work Verification (Talent)
   * @param {Object} payload { imdbUrl, workLinks, references }
   */
  async submitProfessionalVerification(payload) {
    if (!isRealMode("verifications")) {
      const mockVer = {
        id: "ver_mock_prof_" + Date.now(),
        type: "professional",
        status: "Pending",
        submittedAt: new Date().toISOString(),
        ...payload,
      };
      return {
        success: true,
        data: mapVerification(mockVer),
      };
    }

    const res = await apiClient.post("/api/verifications/professional", payload);
    const doc = res?.data || res;
    return {
      success: true,
      data: doc ? mapVerification(doc) : null,
    };
  },

  /**
   * Submit Business Legal Verification (Organization)
   * @param {Object} payload { cin, gstNumber, incorporationDocUrl }
   */
  async submitBusinessVerification(payload) {
    if (!isRealMode("verifications")) {
      const mockVer = {
        id: "ver_mock_biz_" + Date.now(),
        type: "business",
        status: "Pending",
        submittedAt: new Date().toISOString(),
        ...payload,
      };
      return {
        success: true,
        data: mapVerification(mockVer),
      };
    }

    const res = await apiClient.post("/api/verifications/business", payload);
    const doc = res?.data || res;
    return {
      success: true,
      data: doc ? mapVerification(doc) : null,
    };
  },

  /**
   * Fetch verification status for authenticated user
   */
  async getMyVerifications() {
    if (!isRealMode("verifications")) {
      return {
        success: true,
        data: [
          mapVerification({
            id: "ver-1",
            type: "identity",
            status: "Verified",
            submittedAt: "2026-09-01T10:00:00.000Z",
          }),
        ],
      };
    }

    const res = await apiClient.get("/api/verifications/my");
    const docs = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    return {
      success: true,
      data: docs.map(mapVerification),
    };
  },
};
