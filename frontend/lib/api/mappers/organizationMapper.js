/**
 * Organization Entity Mapper
 */

export function fromApi(org) {
  if (!org) return null;

  const id = org._id ? String(org._id) : (org.id ? String(org.id) : "");
  const userIdObj = org.userId && typeof org.userId === "object" ? org.userId : null;
  const userId = userIdObj ? String(userIdObj._id || userIdObj.id) : (org.userId ? String(org.userId) : "");

  const company = org.organizationName || org.company || org.companyName || org.name || userIdObj?.name || "Organization";
  const contactPerson = org.contactPerson || org.responsiblePerson?.name || userIdObj?.name || "Contact";
  const email = org.contactEmail || org.responsiblePerson?.email || userIdObj?.email || org.email || "";
  const phone = org.contactNumber || org.contactPhone || org.responsiblePerson?.phone || userIdObj?.mobile || userIdObj?.phone || org.phone || org.mobile || "";
  const city = org.location?.city || org.city || "Mumbai";
  const state = org.location?.state || org.state || "Maharashtra";
  const type = org.organizationType || org.companyType || org.type || "Production House";
  const regNumber = org.registrationNumber || org.cinNumber || org.regNumber || "";
  const gstNumber = org.gstNumber || "";
  const website = org.website || "";

  // Normalize verification state and accreditation
  const hasSubmittedKyc = Boolean(
    org.hasSubmittedKyc ||
    org.verificationRecord ||
    (org.registrationNumber && org.registrationNumber.trim() && org.registrationNumber.trim() !== "PENDING") ||
    (org.cinNumber && org.cinNumber.trim() && org.cinNumber.trim() !== "PENDING") ||
    (org.verificationDocs && org.verificationDocs.length > 0) ||
    (org.documents && org.documents.length > 0)
  );

  const verificationState = String(
    (typeof org.verificationStatus === "string" ? org.verificationStatus : null) ||
    org.verificationState ||
    org.verificationStatus?.overallStatus ||
    (org.verificationStatus?.businessVerified ? "verified" : "") ||
    "pending"
  ).toLowerCase();

  const isVerified = verificationState === "verified" || verificationState === "approved" || Boolean(org.verificationStatus?.businessVerified) || org.isVerified === true;
  const isPendingReview = !isVerified && (hasSubmittedKyc || verificationState === "pending" || verificationState === "in_review");
  const verificationStatus = isVerified ? "verified" : (isPendingReview ? "in_review" : (verificationState === "more_info_needed" ? "more_info_needed" : (verificationState === "rejected" ? "rejected" : "pending")));

  // Account / Organization Status: "Pending" | "Verified" | "Rejected" | "Suspended"
  let status = "Pending";
  if (isVerified) {
    status = "Verified";
  } else if (verificationState === "rejected" || org.status === "rejected") {
    status = "Rejected";
  } else if (org.status === "suspended") {
    status = "Suspended";
  } else {
    status = "Pending";
  }

  const rawStatus = (org.status || org.verificationState || "pending").toLowerCase();

  const joinedDate = org.createdAt ? new Date(org.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recent";

  const documents = (org.verificationDocuments || org.verificationDocs || []).map((d) => ({
    name: d.docType || d.title || d.name || "Document",
    file: d.fileUrl || d.url || d.file || "Document File",
    verified: d.status === "verified" || Boolean(d.verified),
  }));

  return {
    id,
    _id: id,
    userId,
    company,
    companyName: company,
    name: company,
    organizationName: company,
    contactPerson,
    contactName: contactPerson,
    email,
    contactEmail: email,
    phone,
    mobile: phone,
    contactNumber: phone,
    contactPhone: phone,
    type,
    companyType: type,
    organizationType: type,
    city,
    location: city,
    state,
    regNumber,
    registrationNumber: regNumber,
    cinNumber: org.cinNumber || regNumber,
    gstNumber,
    website,
    status,
    rawStatus,
    hasSubmittedKyc,
    isPendingReview,
    isVerified,
    verificationStatus,
    verificationState,
    isKycCompleted: isVerified,
    credits: org.credits ?? org.walletCredits ?? 100,
    walletCredits: org.credits ?? org.walletCredits ?? 100,
    requirementsCount: org.requirementsCount ?? org.requirementsPosted ?? 0,
    requirementsPosted: org.requirementsCount ?? org.requirementsPosted ?? 0,
    description: org.description || org.about || "",
    about: org.description || org.about || "",
    address: org.address || "",
    avatar: org.avatar || org.logoUrl || null,
    documents,
    verificationDocs: documents,
    joinedDate,
    createdAt: org.createdAt ? new Date(org.createdAt).toISOString() : null,
    updatedAt: org.updatedAt ? new Date(org.updatedAt).toISOString() : null,
  };
}

export function toApi(org) {
  if (!org) return {};

  return {
    organizationName: org.organizationName?.trim() || org.companyName?.trim() || org.name?.trim(),
    organizationType: org.organizationType?.trim() || org.companyType?.trim() || org.type?.trim(),
    description: org.description?.trim() || org.about?.trim(),
    website: org.website?.trim(),
    contactNumber: org.contactNumber?.trim() || org.contactPhone?.trim() || org.phone?.trim() || org.mobile?.trim(),
    address: org.address?.trim(),
    city: org.city?.trim() || org.location?.city?.trim(),
    cinNumber: org.cinNumber?.trim() || org.registrationNumber?.trim(),
    registrationNumber: org.registrationNumber?.trim() || org.cinNumber?.trim(),
    gstNumber: org.gstNumber?.trim(),
  };
}

export default {
  fromApi,
  toApi,
};
