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
  initialPortfolioMedia,
  initialCastingCalls,
  initialNotifications,
} from "../../talent/mockData.js";
import { mockApplications, mockAuditions } from "./mockSeedData.js";

export const talentService = {
  getInitialState() {
    if (isRealMode("talent")) {
      return {
        profile: null,
        portfolio: [],
        castingCalls: [],
        applications: [],
        notifications: [],
      };
    }
    return {
      profile: mapTalentProfile(initialProfileData),
      portfolio: initialPortfolioMedia,
      castingCalls: initialCastingCalls,
      applications: initialApplications.map(mapApplication),
      notifications: initialNotifications,
    };
  },
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
      stepsCompletion: res?.stepsCompletion || null,
      profileCompletionPercentage: res?.profileCompletionPercentage !== undefined ? res.profileCompletionPercentage : null,
      message: res?.message,
    };
  },

  /**
   * Add a work credit
   * @param {Object} creditData { projectTitle, roleOrDesignation, projectType, year, referenceLink }
   */
  async addCredit(creditData) {
    if (!isRealMode("talent")) {
      const mockCredit = {
        id: "c_" + Date.now(),
        _id: "c_" + Date.now(),
        ...creditData,
        isVerifiedCredit: false,
        verificationStatus: "pending"
      };
      return { success: true, data: mockCredit, message: "Credit submitted for verification (Mock)" };
    }

    const res = await apiClient.post("/api/talent/profile/credits", creditData);
    return res;
  },

  /**
   * Update a work credit
   * @param {string} creditId
   * @param {Object} creditData
   */
  async updateCredit(creditId, creditData) {
    if (!isRealMode("talent")) {
      return { success: true, data: { id: creditId, ...creditData, verificationStatus: "pending" } };
    }

    const res = await apiClient.put(`/api/talent/profile/credits/${creditId}`, creditData);
    return res;
  },

  /**
   * Delete a work credit
   * @param {string} creditId
   */
  async deleteCredit(creditId) {
    if (!isRealMode("talent")) {
      return { success: true, message: "Credit removed (Mock)" };
    }

    const res = await apiClient.delete(`/api/talent/profile/credits/${creditId}`);
    return res;
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
    const roleName = payload?.roleName || payload?.roleApplied || payload?.role;
    if (!isRealMode("applications")) {
      const mockApp = {
        id: "app_mock_" + Date.now(),
        opportunityId,
        talentId: payload?.talentId || "demo_talent",
        roleName,
        roleApplied: roleName,
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
      roleName,
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
    if (!isRealMode("auditions") && !isRealMode("talent")) {
      return {
        success: true,
        data: mapAudition({
          id: auditionId,
          status: "Submitted",
          rawStatus: "submitted",
          selfTapeSubmission: {
            videoUrl: payload.videoUrl || payload.selfTapeUrl,
            videoUrls: payload.videoUrls || (payload.videoUrl ? [payload.videoUrl] : []),
            videos: payload.videos || [],
            notes: payload.notes,
            submittedAt: new Date().toISOString(),
          },
        }),
      };
    }

    const body = {
      videoUrl: payload.videoUrl || payload.selfTapeUrl,
      videoUrls: payload.videoUrls,
      videos: payload.videos,
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

  /**
   * Fetch authenticated talent account settings (Spec §34 & §38)
   */
  async getSettings() {
    if (!isRealMode("talent")) {
      return {
        success: true,
        data: {
          fullName: "Riya Sharma",
          name: "Riya Sharma",
          email: "artist@vismaya.io",
          mobile: "+91 98765 43210",
          phone: "+91 98765 43210",
          city: "Mumbai, Maharashtra",
          isEmailVerified: true,
          twoFactorEnabled: false,
          emailNotificationsEnabled: true,
        },
      };
    }
    const res = await apiClient.get("/api/talent/settings");
    return {
      success: true,
      data: res?.settings || res?.data || res,
    };
  },

  /**
   * Persist talent account settings changes (whitelisted fields: fullName/name, city)
   * @param {Object} payload { fullName, city, profilePhoto }
   */
  async updateSettings(payload) {
    if (!isRealMode("talent")) {
      return {
        success: true,
        data: payload,
        message: "Settings saved successfully (Mock)",
      };
    }
    const res = await apiClient.put("/api/talent/settings", payload);
    return {
      success: true,
      data: res?.user || res?.data || res,
      profile: res?.profile ? mapTalentProfile(res.profile) : null,
      message: res?.message,
    };
  },

  /**
   * Update notification channel preferences (Spec §38: Email toggle only)
   * @param {Object} payload { emailNotificationsEnabled }
   */
  async updateNotificationSettings(payload) {
    if (!isRealMode("talent")) {
      return {
        success: true,
        message: "Notification preferences updated (Mock)",
      };
    }
    return apiClient.put("/api/talent/settings/notifications", payload);
  },

  /**
   * Fetch authenticated talent's auditions
   */
  async getMyAuditions() {
    if (!isRealMode("talent")) {
      return { success: true, data: [] };
    }
    const res = await apiClient.get("/api/auditions/my");
    const docs = Array.isArray(res?.data) ? res.data : Array.isArray(res?.auditions) ? res.auditions : Array.isArray(res) ? res : [];
    return {
      success: true,
      data: docs.map(mapAudition),
    };
  },

  /**
   * Fetch authenticated talent's submitted success stories
   */
  async getMySuccessStories() {
    if (!isRealMode("talent")) {
      return { success: true, data: [], stories: [] };
    }
    const res = await apiClient.get("/api/success-stories/mine");
    const items = res?.stories || res?.data || [];
    const arr = Array.isArray(items) ? items : [];
    return {
      success: true,
      data: arr,
      stories: arr,
    };
  },

  /**
   * Submit talent success story
   */
  async submitSuccessStory(payload) {
    if (!isRealMode("talent")) {
      return { success: true, message: "Success story submitted (Mock)" };
    }
    const res = await apiClient.post("/api/success-stories", payload);
    return res?.data || res;
  },
};

