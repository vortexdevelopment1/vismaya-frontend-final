/**
 * Opportunity Entity Mapper
 * 
 * Supports bidirectional mapping between:
 * 1. Backend flat model (role + positionsCount)
 * 2. Backend target contract (roles[] array)
 * 3. Frontend multi-role model (roles[] array with sub-role definitions)
 */

import { toFrontendStatus, toBackendStatus } from "../statusMapper.js";

function safeIsoDate(val, fallback = null) {
  if (!val) return fallback;
  const d = new Date(val);
  return !isNaN(d.getTime()) ? d.toISOString() : (typeof val === "string" ? val : fallback);
}

export function fromApi(opp) {
  if (!opp) return null;

  const id = opp._id ? String(opp._id) : (opp.id ? String(opp.id) : "");
  
  // Extract project information
  const projObj = opp.projectId && typeof opp.projectId === "object" ? opp.projectId : null;
  const projectId = projObj ? String(projObj._id || projObj.id) : (opp.projectId ? String(opp.projectId) : "");
  const projectName = projObj?.projectName || projObj?.title || opp.projectName || "";
  const orgId = projObj?.organizationId ? String(projObj.organizationId) : (opp.orgId || "");

  // Format deadline date as YYYY-MM-DD
  let deadlineFormatted = "";
  if (opp.deadline) {
    const iso = safeIsoDate(opp.deadline);
    deadlineFormatted = iso ? iso.split("T")[0] : String(opp.deadline);
  }

  // Normalize Roles: support both backend single role and target roles[]
  let roles = [];
  if (Array.isArray(opp.roles) && opp.roles.length > 0) {
    roles = opp.roles.map((r, idx) => ({
      id: r._id ? String(r._id) : (r.id || `r-${id}-${idx + 1}`),
      roleName: r.roleName || r.name || r.role || opp.role || "Lead Role",
      count: Number(r.count || r.positionsCount) || 1,
      ageRange: r.ageRange || (r.ageMin && r.ageMax ? `${r.ageMin} - ${r.ageMax} years` : "18 - 45 years"),
      gender: r.gender || "Any",
      description: r.description || opp.summary || "",
      skills: Array.isArray(r.skills) ? r.skills : (opp.eligibility?.skills || []),
      language: Array.isArray(r.languages) 
        ? r.languages.join(", ") 
        : (r.language || (Array.isArray(opp.eligibility?.languages) ? opp.eligibility.languages.join(", ") : "Hindi, English")),
    }));
  } else {
    // Expand single backend role to roles[] array expected by UI
    roles = [
      {
        id: `r-${id}-1`,
        roleName: opp.role || "Lead Role",
        count: Number(opp.positionsCount) || 1,
        ageRange: opp.eligibility?.ageRange || (opp.eligibility?.ageMin && opp.eligibility?.ageMax ? `${opp.eligibility.ageMin} - ${opp.eligibility.ageMax} years` : "18 - 45 years"),
        gender: opp.eligibility?.gender || "Any",
        description: opp.summary || "",
        skills: Array.isArray(opp.eligibility?.skills) ? opp.eligibility.skills : [],
        language: Array.isArray(opp.eligibility?.languages)
          ? opp.eligibility.languages.join(", ")
          : (opp.eligibility?.languages || "Hindi, English"),
      },
    ];
  }

  const primaryRole = roles[0] || {};

  // Custom Screening Questions normalization
  const customQuestions = Array.isArray(opp.customQuestions)
    ? opp.customQuestions.map((q, idx) => ({
        id: q._id ? String(q._id) : (q.id || `cq-${idx + 1}`),
        questionText: q.questionText || q.question || "",
        question: q.questionText || q.question || "",
        isRequired: Boolean(q.isRequired),
        required: Boolean(q.isRequired),
      }))
    : [];

  return {
    id,
    _id: id,
    projectId,
    projectName,
    orgId,
    title: opp.title || "Untitled Opportunity",
    summary: opp.summary || "",
    role: opp.role || primaryRole.roleName || "",
    opportunityType: opp.opportunityType || projObj?.projectType || "Casting Call",
    roles,
    positionsCount: Number(opp.positionsCount) || roles.reduce((acc, r) => acc + (Number(r.count) || 1), 0),
    location: opp.location || "Mumbai",
    remuneration: opp.remuneration || "₹50,000 / day",
    deadline: deadlineFormatted,
    eligibility: {
      professions: Array.isArray(opp.eligibility?.professions) ? opp.eligibility.professions : [primaryRole.roleName].filter(Boolean),
      minExperienceYears: Number(opp.eligibility?.minExperienceYears) || 0,
      languages: Array.isArray(opp.eligibility?.languages) 
        ? opp.eligibility.languages 
        : (primaryRole.language ? primaryRole.language.split(",").map((s) => s.trim()) : ["Hindi", "English"]),
      workingCities: Array.isArray(opp.eligibility?.workingCities) ? opp.eligibility.workingCities : [opp.location].filter(Boolean),
      skills: Array.isArray(opp.eligibility?.skills) ? opp.eligibility.skills : (primaryRole.skills || []),
      ageMin: Number(opp.eligibility?.ageMin) || 18,
      ageMax: Number(opp.eligibility?.ageMax) || 60,
      gender: opp.eligibility?.gender || primaryRole.gender || "Any",
    },
    customQuestions,
    fullBrief: opp.summary || opp.fullBrief || "",
    status: toFrontendStatus("opportunity", opp.status || "pending"),
    rawStatus: opp.status || "pending",
    adminNote: opp.correctionNotes || opp.adminNote || "",
    rejectionReason: opp.rejectionReason || "",
    correctionNotes: opp.correctionNotes || "",
    cancellationReason: opp.cancellationReason || "",
    cancellationRequestedAt: safeIsoDate(opp.cancellationRequestedAt, null),
    createdAt: safeIsoDate(opp.createdAt, new Date().toISOString()),
    publishedAt: safeIsoDate(opp.publishedAt, null),
  };
}

export function toApi(opp) {
  if (!opp) return {};

  const roles = Array.isArray(opp.roles) && opp.roles.length > 0 ? opp.roles : [];
  const firstRole = roles[0] || null;
  const totalPositions = roles.length > 0
    ? roles.reduce((acc, r) => acc + (Number(r.count) || 1), 0)
    : (Number(opp.positionsCount) || 1);

  const payload = {
    projectId: opp.projectId,
    title: opp.title?.trim(),
    summary: opp.summary?.trim() || opp.fullBrief?.trim() || opp.description?.trim() || "",
    role: firstRole?.roleName?.trim() || opp.role?.trim() || opp.title?.trim(),
    location: opp.location?.trim() || "Mumbai",
    remuneration: opp.remuneration?.trim(),
    positionsCount: totalPositions,

    // Provide both flat model and target roles[] contract
    roles: roles.map((r) => ({
      roleName: r.roleName || r.name,
      count: Number(r.count) || 1,
      ageRange: r.ageRange,
      gender: r.gender,
      description: r.description,
      skills: Array.isArray(r.skills) ? r.skills : [],
      languages: typeof r.language === "string" ? r.language.split(",").map((s) => s.trim()) : (r.languages || []),
    })),
    eligibility: {
      professions: Array.isArray(opp.eligibility?.professions) 
        ? opp.eligibility.professions 
        : (firstRole ? [firstRole.roleName] : []),
      minExperienceYears: Number(opp.eligibility?.minExperienceYears) || 0,
      languages: Array.isArray(opp.eligibility?.languages)
        ? opp.eligibility.languages
        : (firstRole?.language ? firstRole.language.split(",").map((s) => s.trim()) : ["Hindi", "English"]),
      workingCities: Array.isArray(opp.eligibility?.workingCities) 
        ? opp.eligibility.workingCities 
        : (opp.location ? [opp.location] : []),
      skills: Array.isArray(opp.eligibility?.skills)
        ? opp.eligibility.skills
        : (firstRole?.skills || []),
    },
    customQuestions: Array.isArray(opp.customQuestions)
      ? opp.customQuestions.map((q) => ({
          questionText: q.questionText || q.question || "",
          isRequired: Boolean(q.isRequired || q.required),
        }))
      : [],
  };

  if (opp.deadline) {
    payload.deadline = new Date(opp.deadline).toISOString();
  }

  if (opp.status) {
    payload.status = toBackendStatus("opportunity", opp.status);
  }

  if (opp.cancellationReason) {
    payload.cancellationReason = opp.cancellationReason;
  }

  return payload;
}

export default {
  fromApi,
  toApi,
};
