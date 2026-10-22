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
  const orgId = projObj?.organizationId
    ? (typeof projObj.organizationId === "object" && projObj.organizationId !== null ? String(projObj.organizationId._id || projObj.organizationId.id || "") : String(projObj.organizationId))
    : (opp.orgId || "");

  const project = projObj ? {
    id: projectId,
    _id: projectId,
    title: projObj.projectName || projObj.title || "Not provided",
    projectName: projObj.projectName || projObj.title || "Not provided",
    description: projObj.description || "Not provided",
    type: projObj.projectType || projObj.type || "Not provided",
    projectType: projObj.projectType || projObj.type || "Not provided",
    status: toFrontendStatus("project", (projObj.status || "active").toLowerCase()),
    rawStatus: projObj.status || "active",
    organizationName: projObj.organizationId && typeof projObj.organizationId === "object" ? (projObj.organizationId.organizationName || "Not provided") : "Not provided",
    opportunitiesCount: Number(projObj.opportunityCount ?? projObj.opportunitiesCount ?? 0),
    opportunityCount: Number(projObj.opportunityCount ?? projObj.opportunitiesCount ?? 0),
  } : null;

  // Format deadline date as YYYY-MM-DD
  let deadlineFormatted = "";
  if (opp.deadline) {
    const iso = safeIsoDate(opp.deadline);
    deadlineFormatted = iso ? iso.split("T")[0] : String(opp.deadline);
  }

  // Normalize Roles: support both real roles[] array and legacy single flat role
  let roles = [];
  if (Array.isArray(opp.roles) && opp.roles.length > 0) {
    roles = opp.roles.map((r, idx) => {
      const skills = Array.isArray(r.skills)
        ? r.skills
        : (typeof r.skills === "string" ? r.skills.split(",").map((s) => s.trim()).filter(Boolean) : []);
      const languages = Array.isArray(r.languages)
        ? r.languages
        : (typeof r.language === "string" ? r.language.split(",").map((s) => s.trim()).filter(Boolean) : (Array.isArray(r.language) ? r.language : []));
      const languageStr = languages.length > 0 ? languages.join(", ") : (typeof r.language === "string" && r.language.trim() ? r.language.trim() : "Not provided");
      
      const ageRange = r.ageRange || (r.ageMin && r.ageMax ? `${r.ageMin} - ${r.ageMax} years` : (r.ageMin ? `${r.ageMin}+ years` : (r.ageMax ? `Up to ${r.ageMax} years` : "Not provided")));

      return {
        id: r._id ? String(r._id) : (r.id || `r-${id}-${idx + 1}`),
        roleName: r.roleName || r.name || r.role || "Not provided",
        count: Number(r.count || r.positionsCount) || 1,
        positionsCount: Number(r.positionsCount || r.count) || 1,
        ageRange,
        ageMin: r.ageMin !== undefined && r.ageMin !== null ? Number(r.ageMin) : undefined,
        ageMax: r.ageMax !== undefined && r.ageMax !== null ? Number(r.ageMax) : undefined,
        gender: r.gender || "Not provided",
        description: r.description || "Not provided",
        skills,
        languages,
        language: languageStr,
      };
    });
  } else {
    // Old opportunities in DB that only have one role: show as they are from flat fields without inventing data
    const skills = Array.isArray(opp.eligibility?.skills) ? opp.eligibility.skills : [];
    const languages = Array.isArray(opp.eligibility?.languages) ? opp.eligibility.languages : [];
    const languageStr = languages.length > 0 ? languages.join(", ") : (opp.eligibility?.languages || "Not provided");
    const ageRange = opp.eligibility?.ageRange || 
      (opp.eligibility?.ageMin && opp.eligibility?.ageMax ? `${opp.eligibility.ageMin} - ${opp.eligibility.ageMax} years` : 
      (opp.eligibility?.ageMin ? `${opp.eligibility.ageMin}+ years` : 
      (opp.eligibility?.ageMax ? `Up to ${opp.eligibility.ageMax} years` : "Not provided")));

    roles = [
      {
        id: `r-${id}-1`,
        roleName: opp.role || "Not provided",
        count: Number(opp.positionsCount) || 1,
        positionsCount: Number(opp.positionsCount) || 1,
        ageRange,
        gender: opp.eligibility?.gender || "Not provided",
        description: opp.summary || "Not provided",
        skills,
        languages,
        language: languageStr,
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
    project,
    orgId,
    title: opp.title || "Not provided",
    summary: opp.summary || "",
    role: opp.role || primaryRole.roleName || "Not provided",
    opportunityType: opp.opportunityType || projObj?.projectType || "Casting Call",
    roles,
    positionsCount: Number(opp.positionsCount) || roles.reduce((acc, r) => acc + (Number(r.count) || 1), 0),
    location: opp.location || "Not provided",
    remuneration: opp.remuneration || "Not provided",
    deadline: deadlineFormatted || "Not provided",
    eligibility: {
      professions: Array.isArray(opp.eligibility?.professions) ? opp.eligibility.professions : [primaryRole.roleName].filter(Boolean),
      minExperienceYears: Number(opp.eligibility?.minExperienceYears) || 0,
      languages: Array.isArray(opp.eligibility?.languages) 
        ? opp.eligibility.languages 
        : (primaryRole.languages && primaryRole.languages.length > 0 ? primaryRole.languages : []),
      workingCities: Array.isArray(opp.eligibility?.workingCities) ? opp.eligibility.workingCities : [opp.location].filter(Boolean),
      skills: Array.isArray(opp.eligibility?.skills) ? opp.eligibility.skills : (primaryRole.skills || []),
      ageMin: Number(opp.eligibility?.ageMin) || undefined,
      ageMax: Number(opp.eligibility?.ageMax) || undefined,
      gender: opp.eligibility?.gender || primaryRole.gender || "Not provided",
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
    applicantStats: opp.applicantStats || null,
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
    ...(opp.projectName && !opp.projectId ? { projectName: opp.projectName.trim() } : {}),
    title: opp.title?.trim(),
    summary: opp.summary?.trim() || opp.fullBrief?.trim() || opp.description?.trim() || "",
    role: firstRole?.roleName?.trim() || opp.role?.trim() || opp.title?.trim() || "",
    location: opp.location?.trim() || "",
    remuneration: opp.remuneration?.trim() || "",
    positionsCount: totalPositions,

    // Provide both flat model and target roles[] contract
    roles: roles.map((r) => {
      const skills = Array.isArray(r.skills)
        ? r.skills
        : (typeof r.skills === "string" ? r.skills.split(",").map((s) => s.trim()).filter(Boolean) : []);
      const languages = Array.isArray(r.languages)
        ? r.languages
        : (typeof r.language === "string" ? r.language.split(",").map((s) => s.trim()).filter(Boolean) : (Array.isArray(r.language) ? r.language : []));
      return {
        roleName: (r.roleName || r.name || r.role || "").trim(),
        count: Number(r.count || r.positionsCount) || 1,
        positionsCount: Number(r.positionsCount || r.count) || 1,
        ageRange: r.ageRange?.trim() || undefined,
        ageMin: r.ageMin !== undefined && r.ageMin !== null ? Number(r.ageMin) : undefined,
        ageMax: r.ageMax !== undefined && r.ageMax !== null ? Number(r.ageMax) : undefined,
        gender: r.gender?.trim() || undefined,
        description: r.description?.trim() || undefined,
        skills,
        languages,
      };
    }),
    eligibility: {
      professions: Array.isArray(opp.eligibility?.professions) 
        ? opp.eligibility.professions 
        : (firstRole?.roleName ? [firstRole.roleName] : []),
      minExperienceYears: Number(opp.eligibility?.minExperienceYears) || 0,
      languages: Array.isArray(opp.eligibility?.languages)
        ? opp.eligibility.languages
        : (firstRole?.languages || (typeof firstRole?.language === "string" ? firstRole.language.split(",").map((s) => s.trim()).filter(Boolean) : [])),
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
