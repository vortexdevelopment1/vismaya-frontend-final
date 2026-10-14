/**
 * Security & Sanitization Utilities
 */

/**
 * Escapes characters with special meaning in Regular Expressions
 * to prevent ReDoS (Regular Expression Denial of Service) and RegExp injection attacks.
 * @param {string} text - Untrusted user input string
 * @returns {string} Safe escaped string
 */
const escapeRegex = (text) => {
    if (!text || typeof text !== "string") return "";
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

/**
 * Validates whether a string matches standard RFC 5322 email format
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
    if (!email || typeof email !== "string") return false;
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return emailRegex.test(email.trim()) && email.length <= 254;
};

/**
 * Normalizes email address (lowercased, trimmed)
 * @param {string} email
 * @returns {string}
 */
const sanitizeEmail = (email) => {
    if (!email || typeof email !== "string") return "";
    return email.toLowerCase().trim();
};

/**
 * Validates that a URL uses safe protocols (http/https) to prevent XSS via javascript: or data: URIs
 * @param {string} urlString
 * @returns {boolean}
 */
const isSafeUrl = (urlString) => {
    if (!urlString || typeof urlString !== "string") return false;
    try {
        const parsed = new URL(urlString);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        // If relative URL starting with '/', allow it
        return urlString.startsWith("/") && !urlString.startsWith("//");
    }
};

module.exports = {
    escapeRegex,
    isValidEmail,
    sanitizeEmail,
    isSafeUrl
};
