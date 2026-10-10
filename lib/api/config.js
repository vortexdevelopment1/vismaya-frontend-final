/**
 * API Configuration & Feature Flags
 * 
 * Provides per-module toggles for switching between Mock mode and Real Backend API mode.
 * Mock mode is the DEFAULT (NEXT_PUBLIC_USE_MOCK=true).
 */

const rawUseMock = process.env.NEXT_PUBLIC_USE_MOCK;
export const USE_MOCK = rawUseMock === undefined || rawUseMock === "" 
  ? true 
  : rawUseMock.toLowerCase() !== "false";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

export const SUPPORTED_MODULES = [
  "auth",
  "public",
  "talent",
  "recruiter",
  "admin",
  "notifications",
  "uploads",
  "payments"
];

// Comma-separated list of enabled modules when USE_MOCK is false (e.g. "auth,public")
const rawModules = (process.env.NEXT_PUBLIC_API_MODULES || "").toLowerCase().trim();
export const API_MODULES = rawModules
  ? rawModules.split(",").map((m) => m.trim()).filter(Boolean)
  : [];

/**
 * Checks whether a specific feature module should use the real backend API.
 * Returns false if global USE_MOCK is true (default).
 * If USE_MOCK is false, returns true ONLY if:
 *   - NEXT_PUBLIC_API_MODULES is explicitly set to "*" or "all"
 *   - OR the specific module is explicitly listed in NEXT_PUBLIC_API_MODULES
 * An empty or missing NEXT_PUBLIC_API_MODULES means NO module is real.
 *
 * @param {string} moduleName - e.g. "auth", "public", "talent", "recruiter", "admin", "notifications", "uploads", "payments"
 * @returns {boolean}
 */
export function isRealMode(moduleName) {
  const currentUseMock = process.env.NEXT_PUBLIC_USE_MOCK;
  const isMock = currentUseMock === undefined || currentUseMock === "" 
    ? true 
    : currentUseMock.toLowerCase() !== "false";

  if (isMock) return false;

  const currentModules = (process.env.NEXT_PUBLIC_API_MODULES || "").toLowerCase().trim();
  const modulesList = currentModules
    ? currentModules.split(",").map((m) => m.trim()).filter(Boolean)
    : [];

  // An empty or missing NEXT_PUBLIC_API_MODULES means NO module is real
  if (modulesList.length === 0) {
    return false;
  }

  if (modulesList.includes("*") || modulesList.includes("all")) {
    return true;
  }

  if (!moduleName) return false;

  return modulesList.includes(moduleName.toLowerCase().trim());
}

export const API_CONFIG = {
  USE_MOCK,
  API_URL,
  SUPPORTED_MODULES,
  API_MODULES,
  isRealMode,
};

export default API_CONFIG;
