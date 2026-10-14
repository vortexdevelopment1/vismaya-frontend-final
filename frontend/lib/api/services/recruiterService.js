/**
 * Recruiter / Organization API Service
 * Manages organization profile, projects, project shortlists, casting briefs (opportunities), applicants, auditions, and credits.
 */

import { apiClient } from "../client.js";
import { isRealMode } from "../config.js";
import {
  mapOrganization,
  mapOrganizationToApi,
  mapProject,
  mapProjectToApi,
  mapOpportunity,
  mapOpportunityToApi,
  mapApplication,
  mapApplicationToApi,
  mapAudition,
  mapAuditionToApi,
  mapCreditTransaction,
} from "../mappers/index.js";

import {
  initialCompanyProfile,
  initialRequirements,
  initialShortlistedTalent,
} from "../../recruiter/mockData.js";
import {
  mockProjects,
  mockApplications,
  mockAuditions,
} from "./mockSeedData.js";

export const recruiterService = {
  /**
   * Fetch recruiter's organization profile
   */
  async getOrganizationProfile() {
    if (!isRealMode("recruiter")) {
      return {
        success: true,
        data: mapOrganization(initialCompanyProfile),
      };
    }

    const res = await apiClient.get("/api/organization/profile");
    const doc = res?.data || res?.organization || res;
    return {
      success: true,
      data: doc ? mapOrganization(doc) : null,
    };
  },

  /**
   * Create or update organization profile
   * @param {Object} payload Organization profile details
   */
  async saveOrganizationProfile(payload) {
    if (!isRealMode("recruiter")) {
      return {
        success: true,
        data: mapOrganization({ ...initialCompanyProfile, ...payload }),
      };
    }

    const mappedPayload = mapOrganizationToApi(payload);
    const res = await apiClient.post("/api/organization/profile", mappedPayload);
    const doc = res?.data || res?.organization || res;
    return {
      success: true,
      data: doc ? mapOrganization(doc) : null,
      message: res?.message,
    };
  },

  /**
   * Upload organization verification document
   * @param {Object} payload { docType, docCategory, fileUrl }
   */
  async uploadVerificationDoc(payload) {
    if (!isRealMode("recruiter")) {
      return { success: true, message: "Verification document uploaded (Mock)" };
    }
    return apiClient.post("/api/organization/verification-doc", payload);
  },

  /**
   * Fetch all projects created by organization
   */
  async getMyProjects() {
    if (!isRealMode("projects")) {
      return {
        success: true,
        data: mockProjects.map(mapProject),
      };
    }

    const res = await apiClient.get("/api/projects");
    const docs = Array.isArray(res?.data) ? res.data : Array.isArray(res?.projects) ? res.projects : Array.isArray(res) ? res : [];
    return {
      success: true,
      data: docs.map(mapProject),
    };
  },

  /**
   * Fetch a single project by ID
   * @param {string} projectId
   */
  async getProjectById(projectId) {
    if (!isRealMode("projects")) {
      const proj = mockProjects.find((p) => p.id === projectId) || mockProjects[0];
      return {
        success: true,
        data: mapProject(proj),
      };
    }

    const res = await apiClient.get(`/api/projects/${projectId}`);
    const doc = res?.data || res?.project || res;
    return {
      success: true,
      data: doc ? mapProject(doc) : null,
      opportunities: res?.opportunities,
      shortlists: res?.shortlists,
    };
  },

  /**
   * Create a new project
   * @param {Object} payload { projectName, projectType, description }
   */
  async createProject(payload) {
    if (!isRealMode("projects")) {
      const newProj = {
        id: "proj_mock_" + Date.now(),
        orgId: "org-1",
        title: payload.projectName || payload.title,
        type: payload.projectType || payload.type || "Feature Film",
        description: payload.description || "",
        status: "Active",
        createdAt: new Date().toISOString(),
      };
      return {
        success: true,
        data: mapProject(newProj),
      };
    }

    const mappedPayload = mapProjectToApi(payload);
    const res = await apiClient.post("/api/projects", mappedPayload);
    const doc = res?.data || res?.project || res;
    return {
      success: true,
      data: doc ? mapProject(doc) : null,
    };
  },

  /**
   * Update an existing project
   * @param {string} projectId
   * @param {Object} payload
   */
  async updateProject(projectId, payload) {
    if (!isRealMode("projects")) {
      return {
        success: true,
        data: mapProject({ id: projectId, ...payload }),
      };
    }

    const mappedPayload = mapProjectToApi(payload);
    const res = await apiClient.patch(`/api/projects/${projectId}`, mappedPayload);
    const doc = res?.data || res?.project || res;

    return {
      success: true,
      data: doc ? mapProject(doc) : null,
    };
  },

  /**
   * Add talent to project shortlist
   * @param {string} projectId
   * @param {Object} payload { talentId, vismayaId, role, opportunityId }
   */
  async addToShortlist(projectId, payload) {
    if (!isRealMode("projects")) {
      return { success: true, message: "Talent added to shortlist (Mock)" };
    }
    return apiClient.post(`/api/projects/${projectId}/shortlist`, payload);
  },

  /**
   * Fetch project shortlist
   * @param {string} projectId
   * @param {Object} params { status, role }
   */
  async getProjectShortlist(projectId, params = {}) {
    if (!isRealMode("projects")) {
      return { success: true, data: [] };
    }
    const res = await apiClient.get(`/api/projects/${projectId}/shortlist`, { params });
    return {
      success: true,
      data: res?.data || res?.shortlist || res || [],
    };
  },

  /**
   * Update shortlisted talent status in project
   * @param {string} projectId
   * @param {string} shortlistId
   * @param {Object} payload { status, role }
   */
  async updateShortlistItem(projectId, shortlistId, payload) {
    if (!isRealMode("projects")) {
      return { success: true, message: "Shortlist updated (Mock)" };
    }
    return apiClient.patch(`/api/projects/${projectId}/shortlist/${shortlistId}`, payload);
  },

  /**
   * Remove talent from project shortlist
   * @param {string} projectId
   * @param {string} shortlistId
   */
  async removeFromShortlist(projectId, shortlistId) {
    if (!isRealMode("projects")) {
      return { success: true, message: "Shortlist item removed (Mock)" };
    }
    return apiClient.delete(`/api/projects/${projectId}/shortlist/${shortlistId}`);
  },

  /**
   * Fetch all casting briefs created by organization
   */
  async getMyOpportunities() {
    if (!isRealMode("opportunities")) {
      return {
        success: true,
        data: initialRequirements.map(mapOpportunity),
      };
    }

    const res = await apiClient.get("/api/opportunities/my-opportunities");
    const docs = Array.isArray(res?.data) ? res.data : Array.isArray(res?.opportunities) ? res.opportunities : Array.isArray(res) ? res : [];
    return {
      success: true,
      data: docs.map(mapOpportunity),
    };
  },

  /**
   * Create a new casting brief (opportunity)
   * @param {Object} payload Casting brief details
   */
  async createOpportunity(payload) {
    if (!isRealMode("opportunities")) {
      const mockOpp = {
        id: "opp_mock_" + Date.now(),
        orgId: "org-1",
        title: payload.title,
        status: payload.isDraft ? "Draft" : "Submitted",
        ...payload,
      };
      return {
        success: true,
        data: mapOpportunity(mockOpp),
      };
    }

    const mappedPayload = mapOpportunityToApi(payload);
    const res = await apiClient.post("/api/opportunities", mappedPayload);
    const doc = res?.data || res?.opportunity || res;
    return {
      success: true,
      data: doc ? mapOpportunity(doc) : null,
    };
  },

  /**
   * Edit and resubmit opportunity
   * @param {string} opportunityId
   * @param {Object} payload
   */
  async updateOpportunity(opportunityId, payload) {
    if (!isRealMode("opportunities")) {
      return {
        success: true,
        data: mapOpportunity({ id: opportunityId, ...payload }),
      };
    }

    const mappedPayload = mapOpportunityToApi(payload);
    const res = await apiClient.put(`/api/opportunities/${opportunityId}`, mappedPayload);
    const doc = res?.data || res?.opportunity || res;

    return {
      success: true,
      data: doc ? mapOpportunity(doc) : null,
      message: res?.message,
    };
  },

  /**
   * Request cancellation for an opportunity
   * @param {string} opportunityId
   * @param {Object} payload { cancellationReason }
   */
  async requestOpportunityCancellation(opportunityId, payload) {
    if (!isRealMode("opportunities")) {
      return {
        success: true,
        message: "Cancellation requested (Mock)",
      };
    }

    const res = await apiClient.post(`/api/opportunities/${opportunityId}/cancel-request`, payload);
    return {
      success: true,
      data: res?.data || res,
      message: res?.message,
    };
  },

  /**
   * Mark opportunity completed
   * @param {string} opportunityId
   */
  async completeOpportunity(opportunityId) {
    if (!isRealMode("opportunities")) {
      return { success: true, message: "Opportunity marked completed (Mock)" };
    }
    return apiClient.post(`/api/opportunities/${opportunityId}/complete`);
  },

  /**
   * Fetch applications for a specific opportunity
   * @param {string} opportunityId
   */
  async getOpportunityApplications(opportunityId) {
    if (!isRealMode("applications")) {
      const shortlisted = initialShortlistedTalent[opportunityId] || [];
      const apps = shortlisted.length > 0
        ? shortlisted
        : mockApplications.filter((a) => a.opportunityId === opportunityId || a.reqId === opportunityId);
      return {
        success: true,
        data: (apps.length > 0 ? apps : mockApplications).map(mapApplication),
      };
    }

    const res = await apiClient.get(`/api/applications/opportunity/${opportunityId}`);
    const docs = Array.isArray(res?.data) ? res.data : Array.isArray(res?.applicants) ? res.applicants : Array.isArray(res) ? res : [];
    return {
      success: true,
      data: docs.map(mapApplication),
    };
  },

  /**
   * Mark application as under review
   * @param {string} applicationId
   */
  async markApplicationUnderReview(applicationId) {
    if (!isRealMode("applications")) {
      return {
        success: true,
        data: mapApplication({ id: applicationId, status: "Under Review" }),
      };
    }

    const res = await apiClient.patch(`/api/applications/${applicationId}/review`);
    const doc = res?.data || res?.application || res;
    return {
      success: true,
      data: doc ? mapApplication(doc) : null,
    };
  },

  /**
   * Shortlist candidate application
   * @param {string} applicationId
   * @param {Object} payload { note }
   */
  async shortlistApplication(applicationId, payload = {}) {
    if (!isRealMode("applications")) {
      return {
        success: true,
        data: mapApplication({ id: applicationId, status: "Shortlisted" }),
      };
    }

    const res = await apiClient.patch(`/api/applications/${applicationId}/shortlist`, payload);
    const doc = res?.data || res?.application || res;
    return {
      success: true,
      data: doc ? mapApplication(doc) : null,
    };
  },

  /**
   * Select candidate for role
   * @param {string} applicationId
   * @param {Object} payload { note }
   */
  async selectApplication(applicationId, payload = {}) {
    if (!isRealMode("applications")) {
      return {
        success: true,
        data: mapApplication({ id: applicationId, status: "Selected" }),
      };
    }

    const res = await apiClient.patch(`/api/applications/${applicationId}/select`, payload);
    const doc = res?.data || res?.application || res;
    return {
      success: true,
      data: doc ? mapApplication(doc) : null,
    };
  },

  /**
   * Mark application as not selected
   * @param {string} applicationId
   * @param {Object} payload { reason }
   */
  async markNotSelected(applicationId, payload = {}) {
    if (!isRealMode("applications")) {
      return {
        success: true,
        data: mapApplication({ id: applicationId, status: "Not Selected" }),
      };
    }

    const res = await apiClient.patch(`/api/applications/${applicationId}/not-selected`, payload);
    const doc = res?.data || res?.application || res;
    return {
      success: true,
      data: doc ? mapApplication(doc) : null,
    };
  },

  /**
   * Request an audition round from candidate
   * @param {string} applicationId
   * @param {Object} payload { type, deadline, sceneBrief, instructions, scriptSidesUrl }
   */
  async requestAudition(applicationId, payload) {
    if (!isRealMode("auditions")) {
      const mockAud = {
        id: "aud_mock_" + Date.now(),
        applicationId,
        status: "Requested",
        ...payload,
      };
      return {
        success: true,
        data: mapAudition(mockAud),
      };
    }

    const res = await apiClient.post(`/api/auditions/application/${applicationId}`, payload);
    const doc = res?.data || res?.audition || res;
    return {
      success: true,
      data: doc ? mapAudition(doc) : null,
    };
  },

  /**
   * Review submitted audition
   * @param {string} auditionId
   * @param {Object} payload { organizationFeedback, organizationRating }
   */
  async reviewAudition(auditionId, payload) {
    if (!isRealMode("auditions")) {
      return {
        success: true,
        data: mapAudition({ id: auditionId, ...payload }),
      };
    }

    const res = await apiClient.patch(`/api/auditions/${auditionId}/review`, payload);
    const doc = res?.data || res?.audition || res;
    return {
      success: true,
      data: doc ? mapAudition(doc) : null,
    };
  },

  /**
   * Fetch all auditions scheduled by organization
   */
  async getOrganizationAuditions() {
    if (!isRealMode("auditions")) {
      return { success: true, data: mockAuditions.map(mapAudition) };
    }
    const res = await apiClient.get("/api/auditions/organization");
    const docs = Array.isArray(res?.data) ? res.data : Array.isArray(res?.auditions) ? res.auditions : Array.isArray(res) ? res : [];
    return {
      success: true,
      data: docs.map(mapAudition),
    };
  },

  /**
   * Fetch organization credit balance
   */
  async getCreditBalance() {
    if (!isRealMode("credits")) {
      return {
        success: true,
        balance: 42,
        data: { balance: 42, usedCredits: 18, totalAllocated: 60 },
      };
    }

    const res = await apiClient.get("/api/credits/balance");
    return {
      success: true,
      balance: res?.balance ?? res?.data?.balance ?? 0,
      data: res?.data || res,
    };
  },


  /**
   * Fetch credit transaction history
   */
  async getCreditHistory() {
    if (!isRealMode("credits")) {
      return {
        success: true,
        data: [
          mapCreditTransaction({
            id: "tx-1",
            amount: 50,
            type: "purchase",
            description: "Credit Pack Standard",
            createdAt: "2026-09-01T10:00:00.000Z",
          }),
        ],
      };
    }

    const res = await apiClient.get("/api/credits/history");
    const docs = Array.isArray(res?.data) ? res.data : Array.isArray(res?.history) ? res.history : Array.isArray(res) ? res : [];
    return {
      success: true,
      data: docs.map(mapCreditTransaction),
    };
  },

  /**
   * Fetch previously unlocked talent profiles
   */
  async getViewedTalents() {
    if (!isRealMode("credits")) {
      return { success: true, data: [] };
    }
    const res = await apiClient.get("/api/credits/viewed");
    return {
      success: true,
      data: res?.data || res?.viewedTalents || res || [],
    };
  },

  /**
   * Unlock candidate contact info using 1 credit
   * @param {string} talentIdOrVismayaId
   */
  async unlockTalentProfile(talentIdOrVismayaId) {
    if (!isRealMode("credits")) {
      return {
        success: true,
        message: "Profile unlocked successfully (Mock)",
        phone: "+91 98765 43210",
        email: "talent.verified@vismaya.com",
      };
    }

    const res = await apiClient.post(`/api/credits/unlock/${talentIdOrVismayaId}`);
    return {
      success: true,
      data: res?.data || res,
      message: res?.message,
    };
  },

  /**
   * Fetch recruiter favourites
   */
  async getFavourites() {
    if (!isRealMode("recruiter")) {
      return {
        success: true,
        data: [],
      };
    }

    const res = await apiClient.get("/api/organization/favourites");
    return {
      success: true,
      data: res?.data || res?.favourites || res || [],
    };
  },

  /**
   * Add talent to favourites
   * @param {string} talentId
   */
  async addFavourite(talentId) {
    if (!isRealMode("recruiter")) {
      return { success: true, message: "Added to favourites (Mock)" };
    }
    return apiClient.post("/api/organization/favourites", { talentId });
  },

  /**
   * Check favourite status
   * @param {string} talentId
   */
  async checkFavourite(talentId) {
    if (!isRealMode("recruiter")) {
      return { success: true, isFavourite: false };
    }
    return apiClient.get(`/api/organization/favourites/check/${talentId}`);
  },

  /**
   * Remove talent from favourites
   * @param {string} talentId
   */
  async removeFavourite(talentId) {
    if (!isRealMode("recruiter")) {
      return { success: true, message: "Removed from favourites (Mock)" };
    }
    return apiClient.delete(`/api/organization/favourites/${talentId}`);
  },

  /**
   * Update candidate application status (dispatch helper)
   * @param {string} applicationId
   * @param {string} newStatus
   * @param {Object} payload
   */
  async updateCandidateStatus(applicationId, newStatus, payload = {}) {
    const status = String(newStatus || "").toLowerCase().trim();
    if (status.includes("under_review") || status.includes("review")) {
      return this.markApplicationUnderReview(applicationId);
    }
    if (status.includes("shortlist")) {
      return this.shortlistApplication(applicationId, payload);
    }
    if (status.includes("select") && !status.includes("not")) {
      return this.selectApplication(applicationId, payload);
    }
    if (status.includes("not") || status.includes("reject")) {
      return this.markNotSelected(applicationId, payload);
    }
    return this.shortlistApplication(applicationId, payload);
  },

  // Aliases for compatibility
  async getMyOrganization() { return this.getOrganizationProfile(); },
  async updateOrganization(payload) { return this.saveOrganizationProfile(payload); },
  async getOpportunities() { return this.getMyOpportunities(); },
  async requestCancellation(opportunityId, payload) { return this.requestOpportunityCancellation(opportunityId, payload); },
  async deleteOpportunity(opportunityId, payload) { return this.requestOpportunityCancellation(opportunityId, payload); },
};
