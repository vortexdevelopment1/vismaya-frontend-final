/**
 * API Configuration & Feature Flags
 * 
 * Provides per-module toggles for switching between Mock mode and Real Backend API mode.
 * Mock mode is the DEFAULT (NEXT_PUBLIC_USE_MOCK=true).
 */

// Comma-separated list of enabled modules when USE_MOCK is false (e.g. "auth,public")
const rawModules = (process.env.NEXT_PUBLIC_API_MODULES || "").toLowerCase().trim();
export const API_MODULES = rawModules
  ? rawModules.split(",").map((m) => m.trim()).filter(Boolean)
  : [];

const rawUseMock = process.env.NEXT_PUBLIC_USE_MOCK;
// Default to mock mode (true) if not explicitly set to false, or if no real API modules are configured
export const USE_MOCK =
  rawUseMock === undefined ||
  rawUseMock === "" ||
  String(rawUseMock).toLowerCase() !== "false" ||
  API_MODULES.length === 0;

export const resolveApiUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && (envUrl.includes("|") || envUrl.includes(","))) {
    const urls = envUrl.split(/[,|]/).map(u => u.trim().replace(/\/+$/, "")).filter(Boolean);
    if (typeof window !== "undefined") {
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (isLocal) {
        const localCandidate = urls.find(u => u.includes("localhost") || u.includes("127.0.0.1"));
        if (localCandidate) return localCandidate;
      } else {
        const remoteCandidate = urls.find(u => !u.includes("localhost") && !u.includes("127.0.0.1"));
        if (remoteCandidate) return remoteCandidate;
      }
    }
    return (process.env.NODE_ENV === "development"
      ? urls.find(u => u.includes("localhost") || u.includes("127.0.0.1")) || urls[0]
      : urls.find(u => !u.includes("localhost") && !u.includes("127.0.0.1")) || urls[0]);
  }
  return (envUrl || "https://vismaya-frontend-final.onrender.com").replace(/\/+$/, "");
};

export const API_URL = resolveApiUrl();

export const SUPPORTED_MODULES = [
  "auth",
  "public",
  "talent",
  "recruiter",
  "admin",
  "notifications",
  "uploads",
  "media",
  "payments",
  "applications",
  "auditions",
  "credits",
  "opportunities",
  "projects",
  "verifications",
];

/**
 * Checks whether a specific feature module should use the real backend API.
 * Returns false if global USE_MOCK is true (default).
 * If USE_MOCK is false, returns true ONLY if:
 *   - NEXT_PUBLIC_API_MODULES is explicitly set to "*" or "all"
 *   - OR the specific module is explicitly listed in NEXT_PUBLIC_API_MODULES
 * An empty or missing NEXT_PUBLIC_API_MODULES means NO module is real.
 *
 * @param {string} moduleName - e.g. "auth", "public", "talent", "recruiter", "admin", "notifications", "uploads", "media", "payments"
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

  const normalized = moduleName.toLowerCase().trim();
  if (normalized === "media" || normalized === "uploads") {
    return modulesList.includes("media") || modulesList.includes("uploads");
  }

  return modulesList.includes(normalized);
}

export const API_CONFIG = {
  USE_MOCK,
  API_URL,
  SUPPORTED_MODULES,
  API_MODULES,
  isRealMode,
};

export default API_CONFIG;
