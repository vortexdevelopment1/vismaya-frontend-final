import { isValidEmail, sanitizeEmail } from "../utils/sanitize.util.js";

export const validateRegisterInput = (data: any): { isValid: boolean; errors: string[]; sanitized: any } => {
    const rawMobile = data?.mobile || data?.phone;
    const { name, email, password, role } = data || {};
    const errors: string[] = [];

    if (!name || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
        errors.push("Name is required and must be between 2 and 100 characters");
    }

    const normalizedEmail = sanitizeEmail(email);
    if (!email || !isValidEmail(normalizedEmail)) {
        errors.push("A valid email address is required");
    }

    let cleanMobile: string | undefined = undefined;
    if (rawMobile) {
        cleanMobile = String(rawMobile).replace(/[^0-9+]/g, "").trim();
        if (!/^(\+91)?[6-9]\d{9}$/.test(cleanMobile)) {
            errors.push("Mobile number must be a valid 10-digit Indian number (e.g. +91XXXXXXXXXX or 9876543210)");
        }
    }

    if (!password || typeof password !== "string" || password.length < 8) {
        errors.push("Password must be at least 8 characters long");
    } else if (password.length > 128) {
        errors.push("Password cannot exceed 128 characters");
    }

    const ALLOWED_PUBLIC_ROLES = ["talent", "organization"];
    if (!role || typeof role !== "string" || !ALLOWED_PUBLIC_ROLES.includes(role)) {
        errors.push("Role must be either 'talent' or 'organization'");
    }

    return {
        isValid: errors.length === 0,
        errors,
        sanitized: {
            name: name ? name.trim() : "",
            email: normalizedEmail,
            mobile: cleanMobile,
            phone: cleanMobile,
            password,
            role: ALLOWED_PUBLIC_ROLES.includes(role) ? role : undefined,
            city: data?.city ? String(data.city).trim() : undefined,
            profilePhoto: data?.profilePhoto ? String(data.profilePhoto).trim() : undefined,
            stageName: data?.stageName ? String(data.stageName).trim() : undefined,
            primaryProfession: data?.primaryProfession ? String(data.primaryProfession).trim() : undefined,
            skills: Array.isArray(data?.skills) ? data.skills : (data?.skills ? String(data.skills).split(",").map((s: string) => s.trim()).filter(Boolean) : undefined),
            bio: data?.bio ? String(data.bio).trim() : undefined,
            companyType: data?.companyType ? String(data.companyType).trim() : undefined,
            studioName: data?.studioName ? String(data.studioName).trim() : undefined,
            cinNumber: data?.cinNumber ? String(data.cinNumber).trim() : undefined,
            registrationNumber: (data?.registrationNumber || data?.cinNumber) ? String(data.registrationNumber || data.cinNumber).trim() : undefined,
            gstNumber: data?.gstNumber ? String(data.gstNumber).trim() : undefined,
            website: data?.website ? String(data.website).trim() : undefined,
            description: (data?.description || data?.aboutStudio || data?.about) ? String(data.description || data.aboutStudio || data.about).trim() : undefined,
        }
    };
};

export const validateLoginInput = (data: any): { isValid: boolean; errors: string[]; sanitized: any } => {
    const { email, password } = data || {};
    const errors: string[] = [];

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

export const validateChangePasswordInput = (data: any): { isValid: boolean; errors: string[] } => {
    const { currentPassword, otp, newPassword } = data || {};
    const errors: string[] = [];

    if (!currentPassword && !otp) {
        errors.push("Current password or OTP verification code is required");
    }
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

export const validateGoogleLoginInput = (data: any): { isValid: boolean; errors: string[] } => {
    const { idToken, role } = data || {};
    const errors: string[] = [];

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

export const validateDraftInput = (data: any): { isValid: boolean; errors: string[]; sanitized: any } => {
    const { email, role, currentStep, formData } = data || {};
    const errors: string[] = [];

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

export default {
    validateRegisterInput,
    validateLoginInput,
    validateChangePasswordInput,
    validateGoogleLoginInput,
    validateDraftInput
};
