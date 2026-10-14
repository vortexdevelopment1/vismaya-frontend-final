const { isValidEmail, sanitizeEmail } = require("../utils/sanitize.util");

const validateRegisterInput = (data) => {
    const { name, email, password, role, mobile } = data || {};
    const errors = [];

    if (!name || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
        errors.push("Name is required and must be between 2 and 100 characters");
    }

    const normalizedEmail = sanitizeEmail(email);
    if (!email || !isValidEmail(normalizedEmail)) {
        errors.push("A valid email address is required");
    }

    if (mobile) {
        const cleanMobile = String(mobile).replace(/[^0-9+]/g, "").trim();
        if (!/^(\+91)?[6-9]\d{9}$/.test(cleanMobile)) {
            errors.push("Mobile number must be a valid 10-digit Indian number (e.g. +91XXXXXXXXXX or 9876543210)");
        }
    }

    if (!password || typeof password !== "string" || password.length < 8) {
        errors.push("Password must be at least 8 characters long");
    } else if (password.length > 128) {
        errors.push("Password cannot exceed 128 characters");
    }

    if (!["talent", "organization"].includes(role)) {
        errors.push("Role must be either 'talent' or 'organization'");
    }

    return {
        isValid: errors.length === 0,
        errors,
        sanitized: {
            name: name ? name.trim() : "",
            email: normalizedEmail,
            mobile: mobile ? String(mobile).replace(/[^0-9+]/g, "").trim() : undefined,
            password,
            role
        }
    };
};


const validateLoginInput = (data) => {
    const { email, password } = data || {};
    const errors = [];

    if (!email) errors.push("Email is required");
    if (!password) errors.push("Password is required");

    return {
        isValid: errors.length === 0,
        errors,
        sanitized: {
            email: sanitizeEmail(email),
            password
        }
    };
};

const validateChangePasswordInput = (data) => {
    const { currentPassword, newPassword } = data || {};
    const errors = [];

    if (!currentPassword) errors.push("Current password is required");
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
        errors.push("New password must be at least 8 characters long");
    } else if (newPassword.length > 128) {
        errors.push("New password cannot exceed 128 characters");
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
        errors.push("New password must be different from current password");
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

const validateGoogleLoginInput = (data) => {
    const { idToken, role } = data || {};
    const errors = [];

    if (!idToken || typeof idToken !== "string") {
        errors.push("Google ID token is required");
    }

    if (role && !["talent", "organization"].includes(role)) {
        errors.push("Role must be 'talent' or 'organization'");
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

const validateDraftInput = (data) => {
    const { email, role, currentStep, formData } = data || {};
    const errors = [];

    const normalizedEmail = sanitizeEmail(email);
    if (!email || !isValidEmail(normalizedEmail)) {
        errors.push("A valid email address is required");
    }

    if (!role || !["talent", "organization"].includes(role)) {
        errors.push("Role must be 'talent' or 'organization'");
    }

    return {
        isValid: errors.length === 0,
        errors,
        sanitized: {
            email: normalizedEmail,
            role,
            currentStep: typeof currentStep === "number" ? currentStep : 1,
            formData: typeof formData === "object" && formData !== null ? formData : {}
        }
    };
};

module.exports = {
    validateRegisterInput,
    validateLoginInput,
    validateChangePasswordInput,
    validateGoogleLoginInput,
    validateDraftInput
};
