/**
 * Organization Entity Mapper
 */

export function fromApi(org) {
  if (!org) return null;

  const id = org._id ? String(org._id) : (org.id ? String(org.id) : "");
  const userIdObj = org.userId && typeof org.userId === "object" ? org.userId : null;
  const userId = userIdObj ? String(userIdObj._id || userIdObj.id) : (org.userId ? String(org.userId) : "");

  return {
    id,
    _id: id,
    userId,
    name: org.organizationName || org.name || "Organization",
    organizationName: org.organizationName || org.name || "Organization",
    type: org.organizationType || org.type || "Production House",
    organizationType: org.organizationType || org.type || "Production House",
    description: org.description || "",
    website: org.website || "",
    contactNumber: org.contactNumber || org.contactPhone || "",
    contactPhone: org.contactNumber || org.contactPhone || "",
    contactPerson: org.contactPerson || userIdObj?.name || "",
    contactEmail: org.contactEmail || userIdObj?.email || "",
    address: org.address || "",
    registrationNumber: org.registrationNumber || "",
    gstNumber: org.gstNumber || "",
    status: org.status || "Verified",
    avatar: org.avatar || "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&auto=format&fit=crop&q=80",
    createdAt: org.createdAt ? new Date(org.createdAt).toISOString() : null,
    updatedAt: org.updatedAt ? new Date(org.updatedAt).toISOString() : null,
  };
}

export function toApi(org) {
  if (!org) return {};

  return {
    organizationName: org.organizationName?.trim() || org.name?.trim(),
    organizationType: org.organizationType?.trim() || org.type?.trim(),
    description: org.description?.trim(),
    website: org.website?.trim(),
    contactNumber: org.contactNumber?.trim() || org.contactPhone?.trim(),
    address: org.address?.trim(),
  };
}

export default {
  fromApi,
  toApi,
};
