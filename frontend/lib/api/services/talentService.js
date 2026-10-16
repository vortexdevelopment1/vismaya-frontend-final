/**
 * Talent Domain API Service
 * Manages talent profile, applications, auditions, self-tape submissions, share cards, and analytics.
 */

import { apiClient } from "../client.js";
import { isRealMode } from "../config.js";
import { mapTalentProfile, mapTalentProfileToBackend, mapApplication, mapAudition } from "../mappers/index.js";
import {
  initialProfileData,
  initialApplications,
} from "../../talent/mockData.js";
import { mockApplications, mockAuditions } from "./mockSeedData.js";

export const talentService = {
  /**
   * Fetch authenticated talent's profile
   */
  async getMyProfile() {
    if (!isRealMode("talent")) {
      return {
        success: true,
        data: mapTalentProfile(initialProfileData),
      };
    }

    const res = await apiClient.get("/api/talent/profile/my");
    const doc = res?.data || res?.profile || res;
    return {
      success: true,
      data: doc ? mapTalentProfile(doc) : null,
      verificationBadges: res?.verificationBadges,
    };
  },

  /**
   * Create or update talent profile
   * @param {Object} payload Frontend formatted profile or backend payload
   */
  async saveProfile(payload) {
    if (!isRealMode("talent")) {
      return {
        success: true,
        data: mapTalentProfile({ ...initialProfileData, ...payload }),
      };
    }

    const body = mapTalentProfileToBackend(payload);
    const res = await apiClient.post("/api/talent/profile", body);

    const doc = res?.data || res?.profile || res;
    return {
      success: true,
      data: doc ? mapTalentProfile(doc) : null,
      message: res?.message,
    };
  },

  /**
   * Fetch talent profile completion percentage and missing fields
   */
  async getCompletionStatus() {
    if (!isRealMode("talent")) {
      return {
        success: true,
        data: {
          completionPercentage: 85,
          missingSections: ["Voice Samples", "Showreel"],
          isEligibleToApply: true,
          isSearchable: true,
        },
      };
    }

    const res = await apiClient.get("/api/talent/profile/completion-status");
    return {
      success: true,
      data: res?.data || res,
    };
  },

  /**
   * Fetch talent analytics (profile views, searches, unlocks)
   */
  async getMyAnalytics() {
    if (!isRealMode("talent")) {
      return {
        success: true,
        data: {
          profileViews: 142,
          searchAppearances: 310,
          shortlistedCount: 8,
          auditionRequests: 3,
        },
      };
    }

    const res = await apiClient.get("/api/talent/profile/analytics");
    return {
      success: true,
      data: res?.data || res?.analytics || res,
    };
  },

  /**
   * Generate shareable public card
   * @param {string} vismayaIdOrId
   */
  async getShareCard(vismayaIdOrId) {
    if (!isRealMode("talent")) {
      return {
        success: true,
        card: { vismayaId: vismayaIdOrId, stageName: "Aarav Sharma" },
        shareUrl: `https://vismayacreativestudios.com/talent/${vismayaIdOrId}`,
      };
    }
    const res = await apiClient.get(`/api/talent/${vismayaIdOrId}/share-card`);
    return {
      success: true,
      card: res?.card,
      shareUrl: res?.shareUrl,
    };
  },

  /**
   * Fetch all applications submitted by authenticated talent
   */
  async getMyApplications() {
    if (!isRealMode("applications")) {
      return {
        success: true,
        data: initialApplications.map(mapApplication),
      };
    }

    const res = await apiClient.get("/api/applications/my");
    const docs = Array.isArray(res?.data) ? res.data : Array.isArray(res?.applications) ? res.applications : Array.isArray(res) ? res : [];
    return {
      success: true,
      data: docs.map(mapApplication),
    };
  },

  /**
   * Apply for an opportunity
   * @param {string} opportunityId
   * @param {Object} payload { roleApplied, coverNote, customAnswers, consentGiven }
   */
  async applyToOpportunity(opportunityId, payload) {
    if (!isRealMode("applications")) {
      const mockApp = {
        id: "app_mock_" + Date.now(),
        opportunityId,
        talentId: "tal-904",
        status: "Applied",
        submittedAt: new Date().toISOString(),
        ...payload,
      };
      return {
        success: true,
        data: mapApplication(mockApp),
      };
    }

    const res = await apiClient.post(`/api/applications/${opportunityId}/apply`, {
      consentGiven: true,
      ...payload,
    });
    const doc = res?.data || res?.application || res;
    return {
      success: true,
      data: doc ? mapApplication(doc) : null,
      message: res?.message,
    };
  },

  /**
   * Withdraw an active application
   * @param {string} applicationId
   * @param {Object} payload { withdrawalReason, confirm }
   */
  async withdrawApplication(applicationId, payload = {}) {
    if (!isRealMode("applications")) {
      return {
        success: true,
        data: { id: applicationId, status: "Withdrawn" },
      };
    }

    const res = await apiClient.patch(`/api/applications/${applicationId}/withdraw`, {
      confirm: true,
      withdrawalReason: payload.withdrawalReason || "Personal reasons",
      ...payload,
    });
    const doc = res?.data || res?.application || res;
    return {
      success: true,
      data: doc ? mapApplication(doc) : null,
      message: res?.message,
    };
  },

  /**
   * Request re-application permission after withdrawal
   * @param {string} applicationId
   * @param {Object} payload { reason }
   */
  async requestReapplication(applicationId, payload) {
    if (!isRealMode("applications")) {
      return {
        success: true,
        message: "Re-application request submitted for Admin review (Mock)",
      };
    }

    const res = await apiClient.post(`/api/applications/${applicationId}/reapplication-request`, payload);
    return {
      success: true,
      data: res?.data || res?.application || res,
      message: res?.message,
    };
  },

  /**
   * Fetch all auditions scheduled for authenticated talent
   */
  async getMyAuditions() {
    if (!isRealMode("auditions")) {
      return {
        success: true,
        data: mockAuditions.map(mapAudition),
      };
    }

    const res = await apiClient.get("/api/auditions/my");
    const docs = Array.isArray(res?.data) ? res.data : Array.isArray(res?.auditions) ? res.auditions : Array.isArray(res) ? res : [];
    return {
      success: true,
      data: docs.map(mapAudition),
    };
  },

  /**
   * Submit self-tape video for an audition
   * @param {string} auditionId
   * @param {Object} payload { videoUrl, notes, durationSeconds }
   */
  async submitSelfTape(auditionId, payload) {
    if (!isRealMode("auditions")) {
      return {
        success: true,
        data: mapAudition({
          id: auditionId,
          status: "Self-tape Received",
          selfTapeUrl: payload.videoUrl || payload.selfTapeUrl,
          selfTapeNotes: payload.notes,
          submittedAt: new Date().toISOString(),
        }),
      };
    }

    const body = {
      videoUrl: payload.videoUrl || payload.selfTapeUrl,
      thumbnailUrl: payload.thumbnailUrl,
      durationSeconds: payload.durationSeconds,
      fileSizeBytes: payload.fileSizeBytes,
      notes: payload.notes,
    };

    const res = await apiClient.post(`/api/auditions/${auditionId}/self-tape`, body);
    const doc = res?.data || res?.audition || res;
    return {
      success: true,
      data: doc ? mapAudition(doc) : null,
      message: res?.message,
    };
  },
};

