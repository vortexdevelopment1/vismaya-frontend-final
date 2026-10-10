/**
 * Vismaya API Client
 * 
 * Centralized fetch wrapper providing:
 * - Base URL resolution from config
 * - Automatic Bearer token injection (localStorage: vismaya_auth_token)
 * - Automatic JSON parsing & backend envelope unwrapping ({ success, message, ...data })
 * - Normalized error handling with status codes
 * - 401 redirection (real mode only, avoids loops)
 * - AbortController & Timeout support (default 15s)
 * - Safe mutation handling (no retries on POST/PATCH/DELETE)
 */

import { API_URL, USE_MOCK } from "./config.js";

export const AUTH_TOKEN_KEY = "vismaya_auth_token";

/**
 * Standardized API Error class
 */
export class ApiError extends Error {
  constructor(message, status = 500, errors = [], raw = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = Array.isArray(errors) ? errors : [errors].filter(Boolean);
    this.raw = raw;
  }
}

let memoryAuthToken = null;

/**
 * Get the current JWT token from localStorage or in-memory fallback
 */
export function getAuthToken() {
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY) || memoryAuthToken;
    } catch {
      return memoryAuthToken;
    }
  }
  return memoryAuthToken;
}

/**
 * Save JWT token to localStorage & memory
 */
export function setAuthToken(token) {
  memoryAuthToken = token || null;
  if (typeof window !== "undefined") {
    try {
      if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    } catch {}
  }
}

/**
 * Remove JWT token from localStorage & memory
 */
export function removeAuthToken() {
  memoryAuthToken = null;
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch {}
  }
}


/**
 * Handle 401 Unauthorized responses.
 * Clears the stored token and redirects to /login in real mode.
 */
function handle401Unauthorized() {
  if (typeof window === "undefined") return;
  removeAuthToken();

  // Redirect only when running in real API mode and not already on an auth page
  if (!USE_MOCK) {
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.startsWith("/login") || currentPath.startsWith("/register");
    if (!isAuthPage) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(currentPath + window.location.search)}`;
      window.location.href = redirectUrl;
    }
  }
}

/**
 * Core fetch wrapper
 * 
 * @param {string} endpoint - API path (e.g. "/api/auth/login" or full URL)
 * @param {Object} options - Standard fetch options + timeoutMs, params
 * @returns {Promise<any>} Parsed response data
 */
export async function apiFetch(endpoint, options = {}) {
  const {
    timeoutMs = 15000,
    params,
    headers = {},
    body,
    signal: customSignal,
    ...fetchOptions
  } = options;

  // Build target URL
  let url = endpoint.startsWith("http://") || endpoint.startsWith("https://")
    ? endpoint
    : `${API_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  // Append query parameters if provided
  if (params && typeof params === "object") {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        if (Array.isArray(val)) {
          val.forEach((item) => searchParams.append(key, item));
        } else {
          searchParams.append(key, val);
        }
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  // Build headers
  const finalHeaders = new Headers(headers);

  // Set default Content-Type for non-FormData bodies
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (!isFormData && body && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }

  // Inject Bearer token if present and not already provided
  const token = getAuthToken();
  if (token && !finalHeaders.has("Authorization")) {
    finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  // Prepare body
  let serializedBody = body;
  if (body && typeof body === "object" && !isFormData && !(body instanceof URLSearchParams) && typeof body !== "string") {
    serializedBody = JSON.stringify(body);
  }

  // Setup timeout and abort controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  // Chain custom signal if passed
  if (customSignal) {
    customSignal.addEventListener("abort", () => controller.abort());
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: finalHeaders,
      body: serializedBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse JSON or plain text
    const contentType = (response.headers && typeof response.headers.get === "function")
      ? (response.headers.get("content-type") || "")
      : (response.headers && response.headers["content-type"]) || "";
    let data;
    if (contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      data = await response.text();
    }

    // Handle HTTP error statuses
    if (!response.ok) {
      if (response.status === 401) {
        handle401Unauthorized();
      }

      let errorMessage = "An error occurred during request processing";
      let errorList = [];

      if (data && typeof data === "object") {
        errorMessage = data.message || data.error || errorMessage;
        if (Array.isArray(data.errors)) {
          errorList = data.errors;
        }
      } else if (typeof data === "string" && data.trim()) {
        errorMessage = data;
      }

      throw new ApiError(errorMessage, response.status, errorList, data);
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      throw new ApiError("Request timed out. Please check your connection and try again.", 408);
    }
    if (err instanceof ApiError) {
      throw err;
    }

    // Network error or unexpected client error
    throw new ApiError(
      err.message || "Network error. Please check your internet connection.",
      0,
      [],
      err
    );
  }
}

/**
 * Convenience API client methods
 */
export const apiClient = {
  get: (endpoint, options = {}) => apiFetch(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options = {}) => apiFetch(endpoint, { ...options, method: "POST", body }),
  put: (endpoint, body, options = {}) => apiFetch(endpoint, { ...options, method: "PUT", body }),
  patch: (endpoint, body, options = {}) => apiFetch(endpoint, { ...options, method: "PATCH", body }),
  delete: (endpoint, options = {}) => apiFetch(endpoint, { ...options, method: "DELETE" }),
  setToken: (token) => setAuthToken(token),
  getToken: () => getAuthToken(),
  clearToken: () => removeAuthToken(),
};


export default apiClient;
