/**
 * Audition Entity Mapper
 */

import { toFrontendStatus, toBackendStatus } from "../statusMapper.js";

function safeIsoDate(val, fallback = null) {
  if (!val) return fallback;
  const d = new Date(val);
  return !isNaN(d.getTime()) ? d.toISOString() : (typeof val === "string" ? val : fallback);
}

export function fromApi(audition) {
  if (!audition) return null;

  const id = audition._id ? String(audition._id) : (audition.id ? String(audition.id) : "");

  // Extract Populated Entities
  const appObj = audition.applicationId && typeof audition.applicationId === "object" ? audition.applicationId : null;
  const applicationId = appObj ? String(appObj._id || appObj.id) : (audition.applicationId ? String(audition.applicationId) : "");

  const oppObj = audition.opportunityId && typeof audition.opportunityId === "object" ? audition.opportunityId : null;
  const opportunityId = oppObj ? String(oppObj._id || oppObj.id) : (audition.opportunityId ? String(audition.opportunityId) : "");
  const opportunityTitle = oppObj?.title || audition.opportunityTitle || "";

  const projObj = audition.projectId && typeof audition.projectId === "object" ? audition.projectId : null;
  const projectId = projObj ? String(projObj._id || projObj.id) : (audition.projectId ? String(audition.projectId) : "");
  const projectName = projObj?.projectName || projObj?.title || audition.projectName || "";

  const orgObj = audition.organizationId && typeof audition.organizationId === "object" ? audition.organizationId : null;
  const organizationId = orgObj ? String(orgObj._id || orgObj.id) : (audition.organizationId ? String(audition.organizationId) : "");

  const talentObj = audition.talentId && typeof audition.talentId === "object" ? audition.talentId : null;
  const talentId = talentObj ? String(talentObj._id || talentObj.id) : (audition.talentId ? String(audition.talentId) : "");
  const talentName = talentObj?.name || audition.talentName || "Talent Actor";
  const talentEmail = talentObj?.email || audition.talentEmail || "";
  const talentAvatar = talentObj?.profilePhoto || talentObj?.avatar || audition.talentAvatar || "";

  // Normalize self tape submission
  const selfTape = audition.selfTapeSubmission ? {
    videoUrl: audition.selfTapeSubmission.videoUrl || "",
    thumbnailUrl: audition.selfTapeSubmission.thumbnailUrl || "",
    durationSeconds: audition.selfTapeSubmission.durationSeconds || null,
    fileSizeBytes: audition.selfTapeSubmission.fileSizeBytes || null,
    notes: audition.selfTapeSubmission.notes || "",
    submittedAt: safeIsoDate(audition.selfTapeSubmission.submittedAt, null),
  } : null;

  const schedIso = safeIsoDate(audition.scheduledAt, null);
  const deadIso = safeIsoDate(audition.deadline, null);

  return {
    id,
    _id: id,
    applicationId,
    opportunityId,
    opportunityTitle,
    projectId,
    projectName,
    organizationId,
    orgId: organizationId,
    talentId,
    talentName,
    talentEmail,
    talentAvatar,
    type: audition.type || "self_tape",
    role: audition.role || oppObj?.role || "Lead Role",
    sceneBrief: audition.sceneBrief || "",
    instructions: audition.instructions || "",
    scriptUrl: audition.scriptUrl || "",
    meetingLink: audition.meetingLink || "",
    location: audition.location || "",
    scheduledAt: schedIso,
    scheduledDate: schedIso ? schedIso.split("T")[0] : (audition.scheduledDate || ""),
    deadline: deadIso ? deadIso.split("T")[0] : (audition.deadline || ""),
    status: toFrontendStatus("audition", audition.status || "requested"),
    rawStatus: audition.status || "requested",
    vismayaApproval: typeof audition.vismayaApproval === "string" ? audition.vismayaApproval : audition.vismayaApproval ? {
      status: audition.vismayaApproval.status || "pending",
      reviewedAt: safeIsoDate(audition.vismayaApproval.reviewedAt, null),
      reviewedBy: audition.vismayaApproval.reviewedBy || null,
      adminNote: audition.vismayaApproval.adminNote || "",
    } : null,
    selfTapeSubmission: selfTape,
    submission: selfTape,
    feedback: audition.organizationFeedback || "",
    organizationFeedback: audition.organizationFeedback || "",
    rating: audition.organizationRating || null,
    organizationRating: audition.organizationRating || null,
    reviewedAt: safeIsoDate(audition.reviewedAt, null),
    createdAt: safeIsoDate(audition.createdAt, new Date().toISOString()),
  };
}

export function toApi(audition) {
  if (!audition) return {};

  const payload = {
    applicationId: audition.applicationId,
    opportunityId: audition.opportunityId,
    projectId: audition.projectId,
    type: audition.type || "self_tape",
    role: audition.role,
    sceneBrief: audition.sceneBrief,
    instructions: audition.instructions,
    scriptUrl: audition.scriptUrl,
    meetingLink: audition.meetingLink,
    location: audition.location,
    videoUrl: audition.videoUrl || audition.selfTapeSubmission?.videoUrl,
  };

  if (audition.scheduledAt || audition.scheduledDate) {
    payload.scheduledAt = new Date(audition.scheduledAt || audition.scheduledDate).toISOString();
  }

  if (audition.deadline) {
    payload.deadline = new Date(audition.deadline).toISOString();
  }

  if (audition.status) {
    payload.status = toBackendStatus("audition", audition.status);
  }

  if (audition.selfTapeSubmission || audition.videoUrl) {
    payload.selfTapeSubmission = {
      videoUrl: audition.selfTapeSubmission?.videoUrl || audition.videoUrl,
      thumbnailUrl: audition.selfTapeSubmission?.thumbnailUrl || audition.thumbnailUrl,
      durationSeconds: audition.selfTapeSubmission?.durationSeconds,
      fileSizeBytes: audition.selfTapeSubmission?.fileSizeBytes,
      notes: audition.selfTapeSubmission?.notes || audition.notes,
    };
  }


  if (audition.organizationFeedback || audition.feedback) {
    payload.organizationFeedback = audition.organizationFeedback || audition.feedback;
  }

  if (audition.organizationRating || audition.rating) {
    payload.organizationRating = Number(audition.organizationRating || audition.rating);
  }

  return payload;
}

export default {
  fromApi,
  toApi,
};
