/**
 * Verification Entity Mapper
 */

import { toFrontendStatus, toBackendStatus } from "../statusMapper.js";

export function fromApi(verif) {
  if (!verif) return null;

  const id = verif._id ? String(verif._id) : (verif.id ? String(verif.id) : "");
  const userObj = verif.userId && typeof verif.userId === "object" ? verif.userId : null;
  const rawUserId = userObj ? (userObj._id || userObj.id) : verif.userId;
  const isUserMissing = !rawUserId;
  const userId = rawUserId ? String(rawUserId) : "";

  const regNum = verif.businessData?.businessRegNumber;
  const isRealRegNum = regNum && String(regNum).trim().toUpperCase() !== "PENDING" && String(regNum).trim() !== "";
  const regType = verif.businessData?.businessRegType;
  const entityName = verif.businessData?.legalEntityName;

  const regTypeLabels = {
    cin: "Corporate Identity Number (CIN)",
    gstin: "GSTIN / Tax Number",
    llpin: "LLPIN",
    trade_license: "Trade License",
    udyam: "Udyam Registration",
  };
  const regLabel = regTypeLabels[regType] || (regType && regType !== "other" ? regType.toUpperCase() : "Business Registration");

  let documentType = verif.documentType || "Verification Document";
  if (verif.identityData?.idType) {
    documentType = `Government ID (${verif.identityData.idType.toUpperCase()})`;
  } else if (verif.businessData?.businessRegType) {
    documentType = regType === "other" ? "Business Registration Document" : regLabel;
  }

  const docUrl = verif.identityData?.documentFrontUrl || verif.businessData?.documentUrl || verif.documentUrl || "";
  let documentName = "";
  if (docUrl) {
    try {
      const urlParts = docUrl.split("/");
      const lastPart = urlParts[urlParts.length - 1];
      documentName = decodeURIComponent(lastPart.split("?")[0]);
    } catch {
      documentName = "Uploaded Document";
    }
  }

  let portfolioEvidence = "";
  if (isRealRegNum) {
    portfolioEvidence = `${regLabel}: ${regNum}${entityName ? ` • Entity: ${entityName}` : ""}`;
  } else if (entityName) {
    portfolioEvidence = `Entity: ${entityName}`;
  } else if (Array.isArray(verif.professionalData?.creditsLinks) && verif.professionalData.creditsLinks.length > 0) {
    portfolioEvidence = verif.professionalData.creditsLinks.join(", ");
  } else if (verif.portfolioEvidence && !String(verif.portfolioEvidence).toUpperCase().includes("PENDING")) {
    portfolioEvidence = verif.portfolioEvidence;
  }

  return {
    id,
    _id: id,
    userId,
    userMissing: isUserMissing,
    isUserMissing,
    userName: userObj?.name || verif.userName || (isUserMissing ? "User no longer exists" : ""),
    userEmail: userObj?.email || verif.userEmail || (isUserMissing ? "Account deleted" : ""),
    verificationType: verif.verificationType || "identity",
    type: verif.verificationType || "identity",
    identityData: verif.identityData || {},
    professionalData: verif.professionalData || {},
    businessData: verif.businessData || {},
    businessRegistrationDocUrl: verif.businessData?.businessRegistrationDocUrl || verif.businessData?.documentUrl || verif.documentUrl || "",
    businessRegistrationDocName: verif.businessData?.businessRegistrationDocName || "",
    gstin: verif.businessData?.gstin || "",
    isGstExempt: Boolean(verif.businessData?.isGstExempt),
    gstExemptionReason: verif.businessData?.gstExemptionReason || "",
    gstCertificateUrl: verif.businessData?.gstCertificateUrl || "",
    gstCertificateDocName: verif.businessData?.gstCertificateDocName || "",
    professionalProofType: verif.businessData?.professionalProofType || "",
    professionalProofUrl: verif.businessData?.professionalProofUrl || "",
    professionalProofDocUrl: verif.businessData?.professionalProofDocUrl || "",
    professionalProofDocName: verif.businessData?.professionalProofDocName || "",
    otherEvidenceUrls: Array.isArray(verif.businessData?.otherEvidenceUrls) ? verif.businessData.otherEvidenceUrls : [],
    otherEvidenceDocNames: Array.isArray(verif.businessData?.otherEvidenceDocNames) ? verif.businessData.otherEvidenceDocNames : [],
    documentType,
    documentName: documentName || documentType,
    documentUrl: docUrl,
    selfieUrl: verif.identityData?.selfiePhotoUrl || verif.selfieUrl || "",
    portfolioEvidence,
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
