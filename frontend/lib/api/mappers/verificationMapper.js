/**
 * Verification Entity Mapper
 */

import { toFrontendStatus, toBackendStatus } from "../statusMapper.js";

export function fromApi(verif) {
  if (!verif) return null;

  const id = verif._id ? String(verif._id) : (verif.id ? String(verif.id) : "");
  const userObj = verif.userId && typeof verif.userId === "object" ? verif.userId : null;
  const userId = userObj ? String(userObj._id || userObj.id) : (verif.userId ? String(verif.userId) : "");

  return {
    id,
    _id: id,
    userId,
    userName: userObj?.name || verif.userName || "",
    userEmail: userObj?.email || verif.userEmail || "",
    verificationType: verif.verificationType || "identity",
    type: verif.verificationType || "identity",
    identityData: verif.identityData || {},
    professionalData: verif.professionalData || {},
    businessData: verif.businessData || {},
    status: toFrontendStatus("verification", verif.status || "pending"),
    rawStatus: verif.status || "pending",
    rejectionReason: verif.rejectionReason || "",
    moreInfoRequested: Boolean(verif.moreInfoRequested),
    moreInfoNotes: verif.moreInfoNotes || "",
    submittedAt: verif.submittedAt ? new Date(verif.submittedAt).toISOString() : new Date().toISOString(),
    reviewedAt: verif.reviewedAt ? new Date(verif.reviewedAt).toISOString() : null,
    createdAt: verif.createdAt ? new Date(verif.createdAt).toISOString() : new Date().toISOString(),
  };
}

export function toApi(verif) {
  if (!verif) return {};

  const payload = {
    verificationType: verif.verificationType || verif.type,
  };

  if (verif.documentType) payload.documentType = verif.documentType;
  if (verif.documentNumber) payload.documentNumber = verif.documentNumber;
  if (verif.documentUrl) payload.documentUrl = verif.documentUrl;

  if (verif.identityData) payload.identityData = verif.identityData;
  if (verif.professionalData) payload.professionalData = verif.professionalData;
  if (verif.businessData) payload.businessData = verif.businessData;


  if (verif.status) {
    payload.status = toBackendStatus("verification", verif.status);
  }

  if (verif.rejectionReason) payload.rejectionReason = verif.rejectionReason;
  if (verif.moreInfoNotes) payload.moreInfoNotes = verif.moreInfoNotes;

  return payload;
}

export default {
  fromApi,
  toApi,
};
