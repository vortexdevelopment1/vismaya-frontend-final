/**
 * Admin Domain API Service
 * Handles user moderation, opportunity lifecycle review, verifications, media moderation, reports, coupons, audit logs, and broadcasts.
 */

import { apiClient } from "../client.js";
import { isRealMode } from "../config.js";
import {
  mapUser,
  mapOpportunity,
  mapVerification,
  mapBroadcast,
} from "../mappers/index.js";
import {
  initialTalents,
  initialRecruiters,
  initialRequirementRequests,
  initialMediaQueue,
  initialBroadcasts,
  initialRecentAdminActivity,
  initialAnalyticsData,
} from "../../admin/mockData.js";

export const adminService = {
  /**
   * Fetch all registered users
   * @param {Object} params { role, status, page, limit }
   */
  async getAllUsers(params = {}) {
    if (!isRealMode("admin")) {
      const all = [...initialTalents, ...initialRecruiters];
      return {
        success: true,
        data: all.map(mapUser),
      };
    }

    const res = await apiClient.get("/api/admin/users", { params });
    const docs = Array.isArray(res?.data) ? res.data : Array.isArray(res?.users) ? res.users : [];
    return {
      success: true,
      data: docs.map(mapUser),
    };
  },

  /**
   * Fetch pending user approvals queue
   */
  async getPendingUsers() {
    if (!isRealMode("admin")) {
      const pending = [...initialTalents, ...initialRecruiters].filter(
        (u) => (u.status || "").toLowerCase() === "pending"
      );
      return {
        success: true,
        data: pending.map(mapUser),
      };
    }

    const res = await apiClient.get("/api/admin/users/pending");
    const docs = Array.isArray(res?.data) ? res.data : Array.isArray(res?.users) ? res.users : [];
    return {
      success: true,
      data: docs.map(mapUser),
    };
  },

  /**
   * Approve a pending user account
   * @param {string} userId
   */
  async approveUser(userId) {
    if (!isRealMode("admin")) {
      return {
        success: true,
        data: mapUser({ id: userId, status: "Approved" }),
      };
    }

    const res = await apiClient.patch(`/api/admin/users/${userId}/approve`);
    const doc = res?.data || res?.user || res;
    return {
      success: true,
      data: doc ? mapUser(doc) : null,
      message: res?.message,
    };
  },

  /**
   * Reject a user registration
   * @param {string} userId
   * @param {Object} payload { reason }
   */
  async rejectUser(userId, payload = {}) {
    if (!isRealMode("admin")) {
      return {
        success: true,
        data: mapUser({ id: userId, status: "Rejected", ...payload }),
      };
    }

    const res = await apiClient.patch(`/api/admin/users/${userId}/reject`, payload);
    const doc = res?.data || res?.user || res;
    return {
      success: true,
      data: doc ? mapUser(doc) : null,
      message: res?.message,
    };
  },

  /**
   * Suspend a user account
   * @param {string} userId
   * @param {Object} payload { reason }
   */
  async suspendUser(userId, payload = {}) {
    if (!isRealMode("admin")) {
      return {
        success: true,
        data: mapUser({ id: userId, status: "Suspended", ...payload }),
      };
    }

    const res = await apiClient.patch(`/api/admin/users/${userId}/suspend`, payload);
    const doc = res?.data || res?.user || res;
    return {
      success: true,
      data: doc ? mapUser(doc) : null,
      message: res?.message,
    };
  },

  /**
   * Reactivate a suspended account
   * @param {string} userId
   */
  async reactivateUser(userId) {
    if (!isRealMode("admin")) {
      return {
        success: true,
        data: mapUser({ id: userId, status: "Approved" }),
      };
    }

    const res = await apiClient.patch(`/api/admin/users/${userId}/reactivate`);
    const doc = res?.data || res?.user || res;
    return {
      success: true,
      data: doc ? mapUser(doc) : null,
      message: res?.message,
    };
  },

  /**
   * Ban user account
   * @param {string} userId
   * @param {Object} payload { reason }
   */
  async banUser(userId, payload = {}) {
    if (!isRealMode("admin")) {
      return { success: true, message: "User banned (Mock)" };
    }
    return apiClient.patch(`/api/admin/users/${userId}/ban`, payload);
  },

  /**
   * Unban user account
   * @param {string} userId
   */
  async unbanUser(userId) {
    if (!isRealMode("admin")) {
      return { success: true, message: "User unbanned (Mock)" };
    }
    return apiClient.patch(`/api/admin/users/${userId}/unban`);
  },

  /**
   * Finalize user deletion
   * @param {string} userId
   */
  async finalizeUserDeletion(userId) {
    if (!isRealMode("admin")) {
      return { success: true, message: "User deletion finalized (Mock)" };
    }
    return apiClient.post(`/api/admin/users/${userId}/finalize-deletion`);
  },

  /**
   * Fetch talent directory (Admin view)
   */
  async getTalentDirectory(params = {}) {
    if (!isRealMode("admin")) {
      return { success: true, data: initialTalents.map(mapUser) };
    }
    const res = await apiClient.get("/api/admin/talents", { params });
    const docs = Array.isArray(res?.data) ? res.data : Array.isArray(res?.talents) ? res.talents : [];
    return {
      success: true,
      data: docs.map(mapUser),
    };
  },

  /**
   * Fetch organization directory (Admin view)
   */
  async getOrganizationDirectory(params = {}) {
    if (!isRealMode("admin")) {
      return { success: true, data: initialRecruiters.map(mapUser) };
    }
    const res = await apiClient.get("/api/admin/organizations", { params });
    const docs = Array.isArray(res?.data) ? res.data : Array.isArray(res?.organizations) ? res.organizations : [];
    return {
      success: true,
      data: docs.map(mapUser),
    };
  },

  /**
   * Update talent trending status
   * @param {string} talentId
   * @param {Object} payload { isTrending }
   */
  async updateTalentTrendingStatus(talentId, payload) {
    if (!isRealMode("admin")) {
      return { success: true, message: "Trending status updated (Mock)" };
    }
    return apiClient.patch(`/api/admin/talents/${talentId}/trending`, payload);
  },

  /**
   * Fetch pending profile changes review queue
   */
  async getPendingProfileChanges() {
    if (!isRealMode("admin")) {
      return { success: true, data: [] };
    }
    const res = await apiClient.get("/api/admin/profile-changes");
    return {
      success: true,
      data: res?.data || res?.profileChanges || res || [],
    };
  },

  /**
   * Review critical profile change request
   * @param {string} profileId
   * @param {Object} payload { action, notes }
   */
  async reviewProfileChange(profileId, payload) {
    if (!isRealMode("admin")) {
      return { success: true, message: "Profile change reviewed (Mock)" };
    }
    return apiClient.patch(`/api/admin/profile-changes/${profileId}/review`, payload);
  },

  /**
   * Fetch pending opportunities review queue
   */
  async getPendingOpportunities() {
    if (!isRealMode("admin")) {
      return {
        success: true,
        data: initialRequirementRequests.map(mapOpportunity),
      };
    }

    const res = await apiClient.get("/api/admin/opportunities/pending");
    const docs = Array.isArray(res?.data) ? res.data : Array.isArray(res?.opportunities) ? res.opportunities : Array.isArray(res) ? res : [];
    return {
      success: true,
      data: docs.map(mapOpportunity),
    };
  },

  /**
   * Fetch opportunity cancellation requests
   */
  async getCancellationRequests(params = {}) {
    if (!isRealMode("admin")) {
      return {
        success: true,
        data: initialRequirementRequests.map(mapOpportunity),
      };
    }

    const res = await apiClient.get("/api/admin/opportunities/cancellations", { params });
    const docs = Array.isArray(res?.data) ? res.data : Array.isArray(res?.cancellations) ? res.cancellations : Array.isArray(res) ? res : [];
    return {
      success: true,
      data: docs.map(mapOpportunity),
    };
  },

  /**
   * Approve and publish a submitted opportunity
   * @param {string} opportunityId
   */
  async approveOpportunity(opportunityId) {
    if (!isRealMode("admin")) {
      return {
        success: true,
        data: mapOpportunity({ id: opportunityId, status: "Published" }),
      };
    }

    const res = await apiClient.patch(`/api/admin/opportunities/${opportunityId}/approve`);
    const doc = res?.data || res?.opportunity || res;
    return {
      success: true,
      data: doc ? mapOpportunity(doc) : null,
      message: res?.message,
    };
  },

  /**
   * Reject a submitted opportunity
   * @param {string} opportunityId
   * @param {Object} payload { rejectionReason }
   */
  async rejectOpportunity(opportunityId, payload = {}) {
    if (!isRealMode("admin")) {
      return {
        success: true,
        data: mapOpportunity({ id: opportunityId, status: "Rejected", ...payload }),
      };
    }

    const res = await apiClient.patch(`/api/admin/opportunities/${opportunityId}/reject`, payload);
    const doc = res?.data || res?.opportunity || res;
    return {
      success: true,
      data: doc ? mapOpportunity(doc) : null,
      message: res?.message,
    };
  },

  /**
   * Request corrections on a submitted opportunity
   * @param {string} opportunityId
   * @param {Object} payload { correctionNotes }
   */
  async requestOpportunityCorrections(opportunityId, payload) {
    if (!isRealMode("admin")) {
      return {
        success: true,
        data: mapOpportunity({ id: opportunityId, status: "Changes Requested", ...payload }),
      };
    }

    const res = await apiClient.patch(`/api/admin/opportunities/${opportunityId}/request-corrections`, payload);
    const doc = res?.data || res?.opportunity || res;
    return {
      success: true,
      data: doc ? mapOpportunity(doc) : null,
      message: res?.message,
    };
  },

  /**
   * Review cancellation request
   * @param {string} opportunityId
   * @param {Object} payload { action, adminNotes }
   */
  async reviewOpportunityCancellation(opportunityId, payload) {
    if (!isRealMode("admin")) {
      return {
        success: true,
        data: mapOpportunity({
          id: opportunityId,
          status: payload.action === "approve" ? "Cancelled" : "Published",
        }),
      };
    }

    const res = await apiClient.patch(`/api/admin/opportunities/${opportunityId}/review-cancellation`, payload);
    const doc = res?.data || res?.opportunity || res;
    return {
      success: true,
      data: doc ? mapOpportunity(doc) : null,
      message: res?.message,
    };
  },

  /**
   * Mark opportunity completed (Admin workflow)
   * @param {string} opportunityId
   */
  async completeOpportunity(opportunityId) {
    if (!isRealMode("admin")) {
      return { success: true, message: "Opportunity completed (Mock)" };
    }
    return apiClient.patch(`/api/admin/opportunities/${opportunityId}/complete`);
  },

  /**
   * Fetch moderation reports
   */
  async getReports(params = {}) {
    if (!isRealMode("admin")) {
      return { success: true, data: [] };
    }
    const res = await apiClient.get("/api/admin/reports", { params });
    return {
      success: true,
      data: res?.data || res?.reports || res || [],
    };
  },

  /**
   * Review a moderation report
   * @param {string} reportId
   * @param {Object} payload { action, adminNotes }
   */
  async reviewReport(reportId, payload) {
    if (!isRealMode("admin")) {
      return { success: true, message: "Report reviewed (Mock)" };
    }
    return apiClient.patch(`/api/admin/reports/${reportId}/review`, payload);
  },

  /**
   * Fetch pending auditions moderation queue
   */
  async getPendingAuditions(params = {}) {
    if (!isRealMode("admin")) {
      return { success: true, data: [] };
    }
    const res = await apiClient.get("/api/admin/auditions/pending", { params });
    return {
      success: true,
      data: res?.data || res?.auditions || res || [],
    };
  },

  /**
   * Review audition request (Approve / Reject)
   * @param {string} auditionId
   * @param {Object} payload { action, rejectionReason }
   */
  async reviewAudition(auditionId, payload) {
    if (!isRealMode("admin")) {
      return { success: true, message: "Audition reviewed (Mock)" };
    }
    return apiClient.patch(`/api/admin/auditions/${auditionId}/review`, payload);
  },

  /**
   * Fetch re-application requests
   */
  async getReapplicationRequests(params = {}) {
    if (!isRealMode("admin")) {
      return { success: true, data: [] };
    }
    const res = await apiClient.get("/api/admin/reapplications/pending", { params });
    return {
      success: true,
      data: res?.data || res?.reapplications || res || [],
    };
  },

  /**
   * Review re-application request
   * @param {string} applicationId
   * @param {Object} payload { action, adminNotes }
   */
  async reviewReapplication(applicationId, payload) {
    if (!isRealMode("admin")) {
      return { success: true, message: "Reapplication reviewed (Mock)" };
    }
    return apiClient.patch(`/api/admin/reapplications/${applicationId}/review`, payload);
  },

  /**
   * Fetch pending identity/professional/business verifications
   */
  async getPendingVerifications() {
    if (!isRealMode("admin")) {
      return {
        success: true,
        data: [],
      };
    }

    const res = await apiClient.get("/api/admin/verifications/pending");
    const docs = Array.isArray(res?.data) ? res.data : Array.isArray(res?.verifications) ? res.verifications : Array.isArray(res) ? res : [];
    return {
      success: true,
      data: docs.map(mapVerification),
    };
  },

  /**
   * Review a verification submission
   * @param {string} verificationId
   * @param {Object} payload { status, notes }
   */
  async reviewVerification(verificationId, payload) {
    if (!isRealMode("admin")) {
      return {
        success: true,
        data: mapVerification({ id: verificationId, ...payload }),
      };
    }

    const res = await apiClient.patch(`/api/admin/verifications/${verificationId}/review`, payload);
    const doc = res?.data || res?.verification || res;
    return {
      success: true,
      data: doc ? mapVerification(doc) : null,
      message: res?.message,
    };
  },

  /**
   * Fetch pending media items for moderation
   */
  async getPendingMedia(params = {}) {
    if (!isRealMode("admin")) {
      return { success: true, data: initialMediaQueue };
    }
    const res = await apiClient.get("/api/admin/media/pending", { params });
    return {
      success: true,
      data: res?.data || res?.mediaItems || res || [],
    };
  },

  /**
   * Review a media item
   * @param {string} mediaId
   * @param {Object} payload { action, notes }
   */
  async reviewMediaItem(mediaId, payload) {
    if (!isRealMode("admin")) {
      return { success: true, message: "Media reviewed (Mock)" };
    }
    return apiClient.patch(`/api/admin/media/${mediaId}/review`, payload);
  },

  /**
   * Fetch payment transactions (Admin view)
   */
  async getPaymentTransactions(params = {}) {
    if (!isRealMode("admin")) {
      return { success: true, data: [] };
    }
    const res = await apiClient.get("/api/admin/transactions", { params });
    return {
      success: true,
      data: res?.data || res?.transactions || res || [],
    };
  },

  /**
   * Adjust organization credit balance
   * @param {Object} payload { organizationId, delta, reason }
   */
  async adjustCreditBalance(payload) {
    if (!isRealMode("admin")) {
      return { success: true, message: "Credits adjusted (Mock)" };
    }
    return apiClient.post("/api/admin/credits/adjust", payload);
  },

  /**
   * Fetch discount coupons list
   */
  async getCoupons(params = {}) {
    if (!isRealMode("admin")) {
      return { success: true, data: [] };
    }
    const res = await apiClient.get("/api/admin/coupons", { params });
    return {
      success: true,
      data: res?.data || res?.coupons || res || [],
    };
  },

  /**
   * Create a discount coupon
   * @param {Object} payload { code, discountPercent, validUntil }
   */
  async createCoupon(payload) {
    if (!isRealMode("admin")) {
      return { success: true, message: "Coupon created (Mock)" };
    }
    return apiClient.post("/api/admin/coupons", payload);
  },

  /**
   * Update a coupon
   * @param {string} couponId
   * @param {Object} payload
   */
  async updateCoupon(couponId, payload) {
    if (!isRealMode("admin")) {
      return { success: true, message: "Coupon updated (Mock)" };
    }
    return apiClient.patch(`/api/admin/coupons/${couponId}`, payload);
  },

  /**
   * Delete a coupon
   * @param {string} couponId
   */
  async deleteCoupon(couponId) {
    if (!isRealMode("admin")) {
      return { success: true, message: "Coupon deleted (Mock)" };
    }
    return apiClient.delete(`/api/admin/coupons/${couponId}`);
  },

  /**
   * Fetch admin dashboard metrics
   */
  async getDashboardMetrics() {
    if (!isRealMode("admin")) {
      return { success: true, data: initialAnalyticsData };
    }
    const res = await apiClient.get("/api/admin/dashboard");
    return {
      success: true,
      data: res?.data || res?.metrics || res,
    };
  },

  /**
   * Fetch admin aggregated dashboard stats (alias)
   */
  async getDashboardStats() {
    return this.getDashboardMetrics();
  },

  /**
   * Fetch platform analytics (alias)
   */
  async getAnalytics(params = {}) {
    return this.getDashboardMetrics();
  },

  /**
   * Fetch admin audit logs
   */
  async getAuditLogs(params = {}) {
    if (!isRealMode("admin")) {
      return {
        success: true,
        data: initialRecentAdminActivity,
      };
    }

    const res = await apiClient.get("/api/admin/audit-logs", { params });
    return {
      success: true,
      data: res?.data || res?.auditLogs || res,
    };
  },

  /**
   * Global search across users, opportunities, applications
   * @param {string} query
   */
  async globalSearch(query) {
    if (!isRealMode("admin")) {
      return {
        success: true,
        data: { users: [], opportunities: [], applications: [] },
      };
    }

    const res = await apiClient.get("/api/admin/search", { params: { q: query } });
    return {
      success: true,
      data: res?.data || res?.results || res,
    };
  },

  /**
   * Export operational data as CSV
   * @param {string} type 'users' | 'talents' | 'organizations' | 'opportunities' | 'transactions'
   */
  async exportAdminData(type) {
    if (!isRealMode("admin")) {
      return { success: true, message: "Data exported (Mock)" };
    }
    return apiClient.get(`/api/admin/export/${type}`);
  },

  // Aliases for backward compatibility & dispatching
  async reviewOpportunity(opportunityId, payload = {}) {
    const status = String(payload.status || "").toLowerCase().trim();
    if (status.includes("publish") || status.includes("approve")) {
      return this.approveOpportunity(opportunityId);
    }
    if (status.includes("reject")) {
      return this.rejectOpportunity(opportunityId, { rejectionReason: payload.adminNote || payload.reason });
    }
    if (status.includes("change") || status.includes("correction") || status.includes("request")) {
      return this.requestOpportunityCorrections(opportunityId, { correctionNotes: payload.adminNote || payload.notes || payload.reason });
    }
    return this.approveOpportunity(opportunityId);
  },
  async resolveCancellation(requestId, payload) { return this.reviewOpportunityCancellation(requestId, payload); },
  async forwardSelfTape(auditionId, payload) { return this.forwardAudition(auditionId, payload); },
  async createBroadcast(payload) { return this.sendBroadcast(payload); },
  async saveBroadcastDraft(payload) { return this.sendBroadcast({ ...payload, scheduledFor: payload.scheduledFor || "draft" }); },
  async cancelBroadcast(broadcastId) { return this.deleteBroadcast(broadcastId); },
  async listTalents(params) { return this.getTalentDirectory(params); },
  async listOrganizations(params) { return this.getOrganizationDirectory(params); },
  async getAuditionsForRelay(params) { return this.getPendingAuditions(params); },
  async relayAudition(auditionId, payload) { return this.reviewAudition(auditionId, { action: "approve", ...payload }); },
  async forwardAudition(auditionId, payload) { return this.reviewAudition(auditionId, { action: "approve", ...payload }); },
  async getMediaForModeration(params) { return this.getPendingMedia(params); },
  async moderateMedia(mediaId, payload) { return this.reviewMediaItem(mediaId, payload); },
  async getSystemFeed() { return this.getAuditLogs(); },

  /**
   * Admin platform broadcasts list
   */
  async getBroadcasts() {
    if (!isRealMode("admin")) {
      return {
        success: true,
        data: initialBroadcasts.map(mapBroadcast),
      };
    }

    const res = await apiClient.get("/api/admin/broadcasts");
    const docs = Array.isArray(res?.data) ? res.data : Array.isArray(res?.broadcasts) ? res.broadcasts : Array.isArray(res) ? res : [];
    return {
      success: true,
      data: docs.map(mapBroadcast),
    };
  },

  /**
   * Admin single broadcast detail
   */
  async getBroadcastById(broadcastId) {
    if (!isRealMode("admin")) {
      const bc = initialBroadcasts.find((b) => b.id === broadcastId) || initialBroadcasts[0];
      return {
        success: true,
        data: mapBroadcast(bc),
      };
    }

    const res = await apiClient.get(`/api/admin/broadcasts/${broadcastId}`);
    const doc = res?.data || res?.broadcast || res;
    return {
      success: true,
      data: doc ? mapBroadcast(doc) : null,
    };
  },

  /**
   * Admin broadcast creation & dispatch
   */
  async sendBroadcast(payload) {
    if (!isRealMode("admin")) {
      const newBc = {
        id: "bc_mock_" + Date.now(),
        ...payload,
        status: payload.scheduledFor ? "Scheduled" : "Sent",
        sentAt: payload.scheduledFor ? null : new Date().toISOString(),
      };
      return {
        success: true,
        data: mapBroadcast(newBc),
      };
    }

    const res = await apiClient.post("/api/admin/broadcasts", payload);
    const doc = res?.data || res?.broadcast || res;
    return {
      success: true,
      data: doc ? mapBroadcast(doc) : mapBroadcast(payload),
    };
  },

  /**
   * Admin broadcast update
   */
  async updateBroadcast(broadcastId, payload) {
    if (!isRealMode("admin")) {
      return {
        success: true,
        data: mapBroadcast({ id: broadcastId, ...payload }),
      };
    }

    const res = await apiClient.patch(`/api/admin/broadcasts/${broadcastId}`, payload);
    const doc = res?.data || res?.broadcast || res;
    return {
      success: true,
      data: doc ? mapBroadcast(doc) : null,
    };
  },

  /**
   * Admin broadcast deletion
   */
  async deleteBroadcast(broadcastId) {
    if (!isRealMode("admin")) {
      return {
        success: true,
        message: "Broadcast deleted (Mock)",
      };
    }

    const res = await apiClient.delete(`/api/admin/broadcasts/${broadcastId}`);
    return {
      success: true,
      data: res?.data || res,
    };
  },

  /**
   * Admin broadcast audience reach estimation
   */
  async getBroadcastReach(target = "all") {
    if (!isRealMode("admin")) {
      const reachMap = { all: 18450, talent: 14200, recruiter: 4250 };
      return {
        success: true,
        data: { target, estimatedReach: reachMap[target] || 18450 },
      };
    }

    const res = await apiClient.get("/api/admin/broadcasts/reach", { params: { target } });
    return {
      success: true,
      data: res?.data || res,
    };
  },
};
