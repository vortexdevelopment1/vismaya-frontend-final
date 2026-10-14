/**
 * Public & Discovery API Service
 * Manages public landing page data, taxonomy, directory search, company profiles, and guest brief details.
 */

import { apiClient } from "../client.js";
import { isRealMode } from "../config.js";
import { mapOpportunity, mapTalentProfile, mapOrganization } from "../mappers/index.js";
import { eliteTalentRoster } from "../../public/homeData.js";
import { mockOpportunities } from "./mockSeedData.js";

const defaultStats = {
  verifiedArtists: "12,400+",
  castingCalls: "450+",
  productionHouses: "180+",
  auditRate: "98.4%",
};

export const publicService = {
  /**
   * Fetch published opportunities with optional search filters
   * @param {Object} params { search, profession, city, page, limit }
   */
  async getPublishedOpportunities(params = {}) {
    if (!isRealMode("opportunities")) {
      const published = mockOpportunities.filter((o) => o.status === "Published");
      return {
        success: true,
        data: published.map(mapOpportunity),
      };
    }

    const res = await apiClient.get("/api/opportunities/published", { params });
    const docs = Array.isArray(res?.data) ? res.data : Array.isArray(res?.opportunities) ? res.opportunities : Array.isArray(res) ? res : [];
    return {
      success: true,
      data: docs.map(mapOpportunity),
      count: res?.count || docs.length,
      total: res?.total,
    };
  },

  /**
   * Fetch single opportunity details by ID
   * @param {string} opportunityId
   */
  async getOpportunityById(opportunityId) {
    if (!isRealMode("opportunities")) {
      const opp = mockOpportunities.find((o) => o.id === opportunityId) || mockOpportunities[0];
      return {
        success: true,
        data: mapOpportunity(opp),
      };
    }

    const res = await apiClient.get(`/api/opportunities/${opportunityId}`);
    const doc = res?.data || res?.opportunity || res;
    return {
      success: true,
      data: doc ? mapOpportunity(doc) : null,
    };
  },

  /**
   * Search talent directory with criteria
   * @param {Object} params { q, category, profession, city, gender, page, limit }
   */
  async searchTalentDirectory(params = {}) {
    if (!isRealMode("talent")) {
      return {
        success: true,
        data: eliteTalentRoster.map(mapTalentProfile),
      };
    }

    const res = await apiClient.get("/api/talent/profile/search", { params });
    const docs = Array.isArray(res?.data) ? res.data : Array.isArray(res?.cards) ? res.cards : Array.isArray(res) ? res : [];
    return {
      success: true,
      data: docs.map(mapTalentProfile),
      total: res?.total,
    };
  },

  /**
   * Fetch featured talents for showcase
   */
  async getFeaturedTalent() {
    if (!isRealMode("talent")) {
      return {
        success: true,
        data: eliteTalentRoster.map(mapTalentProfile),
      };
    }

    const res = await apiClient.get("/api/talent/profile/featured");
    const docs = Array.isArray(res?.data) ? res.data : Array.isArray(res?.cards) ? res.cards : Array.isArray(res) ? res : [];
    return {
      success: true,
      data: docs.map(mapTalentProfile),
    };
  },

  /**
   * Fetch single public talent profile details by vismayaId or Mongo ID
   * @param {string} vismayaIdOrId
   */
  async getPublicTalentProfile(vismayaIdOrId) {
    if (!isRealMode("talent")) {
      const found = eliteTalentRoster.find((t) => t.slug === vismayaIdOrId || t.name === vismayaIdOrId) || eliteTalentRoster[0];
      return {
        success: true,
        data: found ? mapTalentProfile(found) : null,
        isUnlocked: false,
      };
    }

    const res = await apiClient.get(`/api/talent/profile/${vismayaIdOrId}`);
    const doc = res?.data || res?.profile || res;
    return {
      success: true,
      data: doc ? mapTalentProfile(doc) : null,
      isUnlocked: res?.isUnlocked,
      media: res?.media,
      verificationBadges: res?.verificationBadges,
    };
  },

  /**
   * Fetch public company profile by slug
   * @param {string} slug
   */
  async getPublicCompanyProfile(slug) {
    if (!isRealMode("public")) {
      return {
        success: true,
        data: mapOrganization({ name: slug, organizationName: slug }),
      };
    }
    const res = await apiClient.get(`/api/company/${slug}`);
    const doc = res?.data || res?.company || res?.organization || res;
    return {
      success: true,
      data: doc ? mapOrganization(doc) : null,
    };
  },

  /**
   * Public landing page aggregate statistics
   */
  async getPlatformStats() {
    if (!isRealMode("public")) {
      return {
        success: true,
        data: defaultStats,
      };
    }

    const res = await apiClient.get("/api/public/stats");
    return {
      success: true,
      data: res?.data || res || defaultStats,
    };
  },

  /**
   * Fetch platform success stories
   */
  async getSuccessStories() {
    if (!isRealMode("public")) {
      return {
        success: true,
        data: [],
      };
    }

    const res = await apiClient.get("/api/success-stories");
    return {
      success: true,
      data: res?.data || res?.stories || res || [],
    };
  },

  /**
   * Submit talent success story
   * @param {Object} payload { story, role, projectName }
   */
  async submitSuccessStory(payload) {
    if (!isRealMode("public")) {
      return { success: true, message: "Success story submitted for review (Mock)" };
    }
    return apiClient.post("/api/success-stories", payload);
  },

  /**
   * Public contact inquiry submission
   * @param {Object} payload { name, email, message }
   */
  async submitContactForm(payload) {
    if (!isRealMode("public")) {
      return {
        success: true,
        message: "Message received. Our production support team will contact you within 24 hours. (Mock)",
      };
    }

    const res = await apiClient.post("/api/contact", payload);
    return {
      success: true,
      data: res?.data || res,
      message: res?.message,
    };
  },

  /**
   * Fetch taxonomy professions and categories
   */
  async getTaxonomies() {
    if (!isRealMode("public")) {
      return { success: true, data: { categories: ["open_talent", "film_and_tv"] } };
    }
    const res = await apiClient.get("/api/taxonomy");
    return {
      success: true,
      data: res?.data || res,
    };
  },

  /**
   * Fetch dynamic profession form schema
   * @param {string} profession
   */
  async getProfessionForm(profession) {
    if (!isRealMode("public")) {
      return { success: true, data: { fields: [] } };
    }
    const res = await apiClient.get(`/api/taxonomy/${profession}/form`);
    return {
      success: true,
      data: res?.data || res,
    };
  },
};
