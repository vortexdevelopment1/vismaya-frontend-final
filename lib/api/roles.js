/**
 * Vismaya Role Mapping & Helpers
 * 
 * Maps between Frontend role conventions ("recruiter", URLs /recruiter/*)
 * and Backend role conventions ("organization").
 */

export const ROLES = {
  TALENT: "talent",
  ORGANIZATION: "organization", // Backend
  RECRUITER: "recruiter",       // Frontend
  ADMIN: "admin",
};

/**
 * Convert frontend role string to backend enum value.
 * @param {string} role - "recruiter" | "talent" | "admin"
 * @returns {string} - "organization" | "talent" | "admin"
 */
export function toBackendRole(role) {
  if (!role) return "talent";
  const normalized = String(role).toLowerCase().trim();
  if (normalized === "recruiter" || normalized === "organization") {
    return "organization";
  }
  if (normalized === "admin") {
    return "admin";
  }
  return "talent";
}

/**
 * Convert backend role string to frontend role convention.
 * @param {string} role - "organization" | "talent" | "admin"
 * @returns {string} - "recruiter" | "talent" | "admin"
 */
export function toFrontendRole(role) {
  if (!role) return "talent";
  const normalized = String(role).toLowerCase().trim();
  if (normalized === "organization" || normalized === "recruiter") {
    return "recruiter";
  }
  if (normalized === "admin") {
    return "admin";
  }
  return "talent";
}

/**
 * Determine the destination dashboard route for a given user role.
 * @param {string} role
 * @returns {string}
 */
export function getDashboardPath(role) {
  const feRole = toFrontendRole(role);
  switch (feRole) {
    case "recruiter":
      return "/recruiter/dashboard";
    case "admin":
      return "/admin/dashboard";
    case "talent":
    default:
      return "/talent/dashboard";
  }
}

export function isTalent(role) {
  const norm = String(role || "").toLowerCase().trim();
  return norm === "talent";
}

export function isRecruiter(role) {
  const norm = String(role || "").toLowerCase().trim();
  return norm === "recruiter" || norm === "organization";
}

export function isOrganization(role) {
  return isRecruiter(role);
}

export function isAdmin(role) {
  const norm = String(role || "").toLowerCase().trim();
  return norm === "admin";
}

export default {
  ROLES,
  toBackendRole,
  toFrontendRole,
  getDashboardPath,
  isTalent,
  isRecruiter,
  isOrganization,
  isAdmin,
};
