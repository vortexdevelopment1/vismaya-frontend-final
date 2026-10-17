import { getProfessionFormConfig } from "../config/taxonomy.js";

export const calculateAge = (dob: any): number | null => {
    if (!dob) return null;
    const diffMs = Date.now() - new Date(dob).getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
};

export const validateTalentProfileInput = (data: any, isCreation = false): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Bio validation (T3: 200 - 1000 chars)
    if (data.bio !== undefined && data.bio !== null) {
        let trimmedBio = String(data.bio).trim();
        if (trimmedBio.length > 1000) {
            trimmedBio = trimmedBio.slice(0, 1000);
            data.bio = trimmedBio;
        }
        if (trimmedBio.length > 0 && trimmedBio.length < 200) {
            errors.push("Bio must be at least 200 characters in length.");
        }
    }

    // Working cities limit (T3: max 5)
    if (Array.isArray(data.workingCities) && data.workingCities.length > 5) {
        errors.push("A maximum of 5 working cities is permitted.");
    }

    // Credits limit (T3: max 50)
    if (Array.isArray(data.credits) && data.credits.length > 50) {
        errors.push("A maximum of 50 credits is permitted.");
    }

    // Open Talent secondary professions limit (max 3)
    if (data.category === "open_talent" && Array.isArray(data.secondaryProfessions) && data.secondaryProfessions.length > 3) {
        errors.push("Open Talent allows 1 primary profession and a maximum of 3 secondary professions.");
    }

    // Film & TV secondary departments limit (max 2)
    if (data.category === "film_and_tv" && Array.isArray(data.secondaryDepartments) && data.secondaryDepartments.length > 2) {
        errors.push("Film & TV allows a primary department and a maximum of 2 secondary departments.");
    }

    // Under-18 / Guardian validation (T3)
    if (data.dob) {
        const age = calculateAge(data.dob);
        if (age !== null && age < 18) {
            const g = data.guardianDetails;
            if (!g || !g.guardianName || !g.relationship || !g.contactNumber || !g.consentGiven) {
                errors.push("Talent under 18 years of age requires mandatory guardian name, relationship, contact number, and explicit consent.");
            }
            if (process.env.GUARDIAN_DOC_REQUIRED === "true" && (!g || !g.supportingDocumentUrl)) {
                errors.push("Guardian supporting document proof is required for minors.");
            }
        }
    }

    // Physical attributes ranges
    if (data.physicalAttributes) {
        const { heightCm, weightKg } = data.physicalAttributes;
        if (heightCm !== undefined && heightCm !== null && heightCm !== "") {
            const h = Number(heightCm);
            if (isNaN(h) || h < 50 || h > 260) {
                errors.push("Height must be a number between 50 cm and 260 cm.");
            }
        }
        if (weightKg !== undefined && weightKg !== null && weightKg !== "") {
            const w = Number(weightKg);
            if (isNaN(w) || w < 20 || w > 300) {
                errors.push("Weight must be a number between 20 kg and 300 kg.");
            }
        }
    }

    // Dynamic Profession Data Validation (T4)
    if (data.primaryProfession && data.professionData) {
        const formConfig: any = getProfessionFormConfig(data.primaryProfession);
        if (formConfig && formConfig.requiredProfessionFields) {
            for (const reqField of formConfig.requiredProfessionFields) {
                if (!data.professionData[reqField]) {
                    errors.push(`Missing required profession detail '${reqField}' for ${data.primaryProfession}.`);
                }
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

export default {
    calculateAge,
    validateTalentProfileInput
};
