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

    if (role === "organization") {
        // 1. Registration number (required)
        const rawRegNum = data?.registrationNumber || data?.cinNumber;
        if (!rawRegNum || typeof rawRegNum !== "string" || !rawRegNum.trim()) {
            errors.push("Registration number (CIN / LLPIN / Udyam) is required");
        } else {
            const cleanReg = rawRegNum.trim().toUpperCase();
            // Looks like CIN: 21 characters or starts with [LU]\d{5}
            if (cleanReg.length === 21 || /^[LU]\d{5}/.test(cleanReg)) {
                const cinRegex = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
                if (!cinRegex.test(cleanReg)) {
                    errors.push("CIN must be 21 characters matching standard format (e.g. U92100MH2018PTC312456)");
                }
            } else {
                // Otherwise 6-30 alphanumeric characters
                const altRegex = /^[A-Z0-9-]{6,30}$/;
                if (!altRegex.test(cleanReg)) {
                    errors.push("Registration number must be 6-30 alphanumeric characters (e.g. LLP-1234 or UDYAM-MH-12-0012345)");
                }
            }
        }

        // 2. Business registration document upload (required)
        const businessRegDoc = data?.businessRegistrationDocUrl || data?.documentUrl;
        if (!businessRegDoc || typeof businessRegDoc !== "string" || !businessRegDoc.trim()) {
            errors.push("Business registration document upload is required");
        }

        // 3. GSTIN + GST Certificate (or "Not GST registered" with reason)
        const isGstExempt = data?.isGstExempt === true || data?.isGstExempt === "true";
        if (isGstExempt) {
            const reason = data?.gstExemptionReason;
            if (!reason || typeof reason !== "string" || reason.trim().length < 3) {
                errors.push("A valid reason for GST exemption is required (minimum 3 characters)");
            }
        } else {
            const rawGst = data?.gstin || data?.gstNumber;
            if (!rawGst || typeof rawGst !== "string" || !rawGst.trim()) {
                errors.push("GST Identification Number (GSTIN) is required (or select 'Not GST registered')");
            } else {
                const cleanGst = rawGst.trim().toUpperCase();
                const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
                if (!gstinRegex.test(cleanGst)) {
                    errors.push("GSTIN must be a valid 15-character uppercase GST number (e.g. 27AABCZ1234F1Z5)");
                }
            }

            const gstCert = data?.gstCertificateUrl;
            if (!gstCert || typeof gstCert !== "string" || !gstCert.trim()) {
                errors.push("GST certificate upload is required when GST registered");
            }
        }

        // 4. Professional / industry proof (at least one of website/portfolio URL or uploaded doc)
        const websiteUrl = data?.website || data?.professionalProofUrl;
        const proofDoc = data?.professionalProofDocUrl;
        const hasWebsite = websiteUrl && typeof websiteUrl === "string" && websiteUrl.trim().length > 0;
        const hasProofDoc = proofDoc && typeof proofDoc === "string" && proofDoc.trim().length > 0;

        if (!hasWebsite && !hasProofDoc) {
            errors.push("Professional/industry proof is required: please provide a website/portfolio URL or upload a proof document");
        }

        // 5. Other evidence (optional, up to 2 files)
        const otherUrls = Array.isArray(data?.otherEvidenceUrls) ? data.otherEvidenceUrls : [];
        if (otherUrls.length > 2) {
            errors.push("Other evidence cannot exceed 2 files");
        }
    }

    const rawRegNum = (data?.registrationNumber || data?.cinNumber) ? String(data.registrationNumber || data.cinNumber).trim().toUpperCase() : undefined;
    const isGstExempt = data?.isGstExempt === true || data?.isGstExempt === "true";
    const rawGst = (data?.gstin || data?.gstNumber) ? String(data.gstin || data.gstNumber).trim().toUpperCase() : undefined;

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
            cinNumber: rawRegNum,
            registrationNumber: rawRegNum,
            gstNumber: isGstExempt ? undefined : rawGst,
            gstin: isGstExempt ? undefined : rawGst,
            isGstExempt,
            gstExemptionReason: isGstExempt && data?.gstExemptionReason ? String(data.gstExemptionReason).trim() : undefined,
            gstCertificateUrl: !isGstExempt && data?.gstCertificateUrl ? String(data.gstCertificateUrl).trim() : undefined,
            gstCertificateDocName: !isGstExempt && data?.gstCertificateDocName ? String(data.gstCertificateDocName).trim() : undefined,
            businessRegistrationDocUrl: (data?.businessRegistrationDocUrl || data?.documentUrl) ? String(data.businessRegistrationDocUrl || data.documentUrl).trim() : undefined,
            documentUrl: (data?.businessRegistrationDocUrl || data?.documentUrl) ? String(data.businessRegistrationDocUrl || data.documentUrl).trim() : undefined,
            businessRegistrationDocName: data?.businessRegistrationDocName ? String(data.businessRegistrationDocName).trim() : undefined,
            professionalProofUrl: data?.professionalProofUrl ? String(data.professionalProofUrl).trim() : (data?.website ? String(data.website).trim() : undefined),
            professionalProofDocUrl: data?.professionalProofDocUrl ? String(data.professionalProofDocUrl).trim() : undefined,
            professionalProofDocName: data?.professionalProofDocName ? String(data.professionalProofDocName).trim() : undefined,
            otherEvidenceUrls: Array.isArray(data?.otherEvidenceUrls) ? data.otherEvidenceUrls.filter(Boolean) : [],
            otherEvidenceDocNames: Array.isArray(data?.otherEvidenceDocNames) ? data.otherEvidenceDocNames.filter(Boolean) : [],
            website: data?.website ? String(data.website).trim() : (data?.professionalProofUrl ? String(data.professionalProofUrl).trim() : undefined),
            description: (data?.description || data?.aboutStudio || data?.about) ? String(data.description || data.aboutStudio || data.about).trim() : undefined,
        }
    };
};

export const validateLoginInput = (data: any): { isValid: boolean; errors: string[]; sanitized: any } => {
    const { email, password } = data || {};
    const errors: string[] = [];

    if (!email) {
        errors.push("Email is required");
    } else if (!isValidEmail(sanitizeEmail(email))) {
        errors.push("Please enter a valid email address");
    }
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
