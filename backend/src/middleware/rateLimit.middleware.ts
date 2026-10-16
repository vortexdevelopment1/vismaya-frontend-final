import rateLimit from "express-rate-limit";

/**
 * General API rate limiter (protects against high-volume API abuse / scraping)
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "production" ? 500 : 10000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests from this IP. Please try again after 15 minutes."
    }
});

/**
 * Strict authentication limiter (protects against brute-force password guessing)
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "production" ? 20 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again after 15 minutes."
    }
});

/**
 * Rate limiter for draft registration endpoints
 */
export const draftLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "production" ? 30 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many draft operations from this IP. Please try again later."
    }
});

/**
 * Rate limiter for admin endpoints
 */
export const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "production" ? 100 : 10000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many administrative operations from this IP. Please try again later."
    }
});

/**
 * Extra-strict rate limiter for Admin Login attempts (5 requests per 15 min window)
 */
export const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many admin login attempts from this IP. Account access temporarily locked. Please try again after 15 minutes."
    }
});

/**
 * Extra-strict OTP limiter (protects against OTP brute-forcing and email bombing)
 */
export const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 OTP requests / verifications per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many password reset / OTP requests. Please try again after 15 minutes."
    }
});

/**
 * Payment operations limiter (protects against payment gateway order flooding)
 */
export const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 30 payment operations per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many payment requests. Please try again later."
    }
});

export default {
    apiLimiter,
    authLimiter,
    draftLimiter,
    adminLimiter,
    otpLimiter,
    paymentLimiter
};
