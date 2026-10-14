/**
 * Security & Sanitization Utilities
 */

/**
 * Escapes characters with special meaning in Regular Expressions
 * to prevent ReDoS (Regular Expression Denial of Service) and RegExp injection attacks.
 * @param text - Untrusted user input string
 * @returns Safe escaped string
 */
export const escapeRegex = (text?: unknown): string => {
    if (!text || typeof text !== "string") return "";
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

/**
 * Validates whether a string matches standard RFC 5322 email format
 * @param email
 * @returns boolean
 */
export const isValidEmail = (email?: unknown): boolean => {
    if (!email || typeof email !== "string") return false;
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return emailRegex.test(email.trim()) && email.length <= 254;
};

/**
 * Normalizes email address (lowercased, trimmed)
 * @param email
 * @returns string
 */
export const sanitizeEmail = (email?: unknown): string => {
    if (!email || typeof email !== "string") return "";
    return email.toLowerCase().trim();
};

/**
 * Validates that a URL uses safe protocols (http/https) to prevent XSS via javascript: or data: URIs
 * @param urlString
 * @returns boolean
 */
export const isSafeUrl = (urlString?: unknown): boolean => {
    if (!urlString || typeof urlString !== "string") return false;
    try {
        const parsed = new URL(urlString);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        // If relative URL starting with '/', allow it
        return urlString.startsWith("/") && !urlString.startsWith("//");
    }
};

export default {
    escapeRegex,
    isValidEmail,
    sanitizeEmail,
    isSafeUrl
};
