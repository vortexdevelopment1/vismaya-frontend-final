/**
 * Legal Policy & User Consent API Service
 * Handles policy retrieval and recorded audit consent
 */

import { apiClient } from "../client.js";
import { isRealMode } from "../config.js";
import { LEGAL_METADATA } from "../../config/legalPolicies.js";

export const legalService = {
  /**
   * Get policy published metadata
   * @param {string} type 'privacy-policy' | 'terms-and-conditions'
   */
  async getPolicyInfo(type = "privacy-policy") {
    if (!isRealMode("legal")) {
      return {
        success: true,
        policy: {
          ...LEGAL_METADATA,
          type,
        },
      };
    }
    try {
      const res = await apiClient.get(`/api/legal/policies/${type}`);
      return res?.data || res;
    } catch (err) {
      console.warn("Could not fetch remote policy info, using default metadata:", err);
      return {
        success: true,
        policy: {
          ...LEGAL_METADATA,
          type,
        },
      };
    }
  },

  /**
   * Record explicit user consent for a policy
   * @param {Object} payload { policyType, policyVersion, context, metadata }
   */
  async recordConsent(payload) {
    if (!isRealMode("legal")) {
      return {
        success: true,
        consent: {
          policyType: payload.policyType,
          policyVersion: payload.policyVersion || "v2.0",
          acceptedAt: new Date().toISOString(),
        },
      };
    }
    const res = await apiClient.post("/api/legal/consent", payload);
    return res?.data || res;
  },

  /**
   * Fetch active user's recorded consents
   */
  async getConsentStatus() {
    if (!isRealMode("legal")) {
      return {
        success: true,
        consents: {
          terms_and_conditions: { isAccepted: true, policyVersion: "v2.0" },
          privacy_policy: { isAccepted: true, policyVersion: "v2.0" },
        },
      };
    }
    const res = await apiClient.get("/api/legal/consent/status");
    return res?.data || res;
  },
};
