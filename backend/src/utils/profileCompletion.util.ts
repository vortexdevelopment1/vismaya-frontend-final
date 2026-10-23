/**
 * Weighted Profile Completion Calculator for Vismaya Creative Studios
 * Enforces profession-aware weighted score calculation and exposes missing sections
 */

import { getProfessionFormConfig } from "../config/taxonomy.js";
import { calculateAge } from "../validators/talentProfile.validator.js";

export interface ProfileCompletionBreakdown {
    step1: number; // Professional details (max 40)
    step2: number; // Portfolio & media (max 25)
    step3: number; // Work experience (max 15)
    step4: number; // Personal info & physical (max 20)
    basicInfo?: number;
    profession?: number;
    skillsAndLanguages?: number;
    credits?: number;
    portfolio?: number;
    travelAndTraining?: number;
}

export interface StepsCompletionStatus {
    step1: boolean;
    step2: boolean;
    step3: boolean;
    step4: boolean;
    isMinor: boolean;
}

export interface ProfileCompletionDetails {
    percentage: number;
    missingSections: string[];
    breakdown: ProfileCompletionBreakdown;
    stepsCompletion: StepsCompletionStatus;
}

export const calculateProfileCompletionDetails = (profile?: any): ProfileCompletionDetails => {
    if (!profile) {
        return {
            percentage: 0,
            missingSections: [
                "Step 1: Professional Details (Category, Profession, Bio >= 200 chars, City, Skills, Languages)",
                "Step 2: Portfolio & Media (Profile Photo, at least 1 Media item)",
                "Step 3: Work Experience (Add at least 1 Credit)",
                "Step 4: Personal Info (Height, Physical specs, Guardian details if minor)"
            ],
            breakdown: {
                step1: 0,
                step2: 0,
                step3: 0,
                step4: 0,
                basicInfo: 0,
                profession: 0,
                skillsAndLanguages: 0,
                credits: 0,
                portfolio: 0,
                travelAndTraining: 0
            },
            stepsCompletion: {
                step1: false,
                step2: false,
                step3: false,
                step4: false,
                isMinor: false
            }
        };
    }

    let score = 0;
    const missingSections: string[] = [];

    // Determine minor status on server
    const age = profile.dob ? calculateAge(profile.dob) : null;
    const isMinor = age !== null ? age < 18 : Boolean(profile.isUnder18);

    // ==========================================
    // STEP 1: Professional Details (40 points max)
    // ==========================================
    let step1Points = 0;

    // 1a. Category & Profession (10 pts)
    const hasCategory = Boolean(profile.category);
    const hasProfession = Boolean(
        profile.primaryProfession || 
        profile.primaryDepartment || 
        profile.profession ||
        (profile.personal && profile.personal.primaryRole)
    );
    if (hasCategory && hasProfession) {
        step1Points += 10;
    } else {
        missingSections.push("Step 1: Set Talent Category and Primary Profession.");
    }

    // 1b. Bio & Headline (10 pts)
    const bioText = (profile.bio || (profile.personal && profile.personal.bio) || "").trim();
    const hasValidBio = bioText.length >= 200 && bioText.length <= 1000;
    if (hasValidBio) {
        step1Points += 10;
    } else {
        missingSections.push("Step 1: Add a Professional Bio between 200 and 1000 characters.");
    }

    // 1c. Location & Availability (10 pts)
    const currentCity = (profile.currentCity || profile.city || (profile.personal && profile.personal.city) || "").trim();
    if (currentCity) {
        step1Points += 10;
    } else {
        missingSections.push("Step 1: Provide your current City.");
    }

    // 1d. Skills & Languages (10 pts)
    const hasSkills = Array.isArray(profile.skills) && profile.skills.length > 0;
    const hasLanguages = Array.isArray(profile.languages) && profile.languages.length > 0;
    if (hasSkills && hasLanguages) {
        step1Points += 10;
    } else {
        missingSections.push("Step 1: Add at least 1 Performing Skill and 1 Language.");
    }

    const step1Complete = (hasCategory && hasProfession) && hasValidBio && Boolean(currentCity) && (hasSkills && hasLanguages);
    score += step1Points;

    // ==========================================
    // STEP 2: Portfolio & Media (25 points max)
    // ==========================================
    let step2Points = 0;

    // 2a. Main Profile Photo (10 pts)
    const hasPhoto = Boolean(profile.profilePhoto || profile.avatar || (profile.personal && profile.personal.avatar));
    if (hasPhoto) {
        step2Points += 10;
    } else {
        missingSections.push("Step 2: Upload a Main Profile Photo.");
    }

    // 2b. Portfolio Media item (15 pts)
    const photoCount = profile.portfolio?.photos?.length || (Array.isArray(profile.photos) ? profile.photos.length : 0);
    const videoCount = profile.portfolio?.videos?.length || (Array.isArray(profile.videos) ? profile.videos.length : 0);
    const hasShowreel = Boolean(profile.portfolio?.showreelUrl || profile.showreel);
    const hasMedia = photoCount > 0 || videoCount > 0 || hasShowreel;
    if (hasMedia) {
        step2Points += 15;
    } else {
        missingSections.push("Step 2: Upload at least 1 portfolio photo or showreel video.");
    }

    const step2Complete = hasPhoto && hasMedia;
    score += step2Points;

    // ==========================================
    // STEP 3: Work Experience (15 points max)
    // ==========================================
    let step3Points = 0;
    const creditCount = Array.isArray(profile.credits) ? profile.credits.length : (Array.isArray(profile.experience) ? profile.experience.length : 0);
    if (creditCount > 0) {
        step3Points = 15;
    } else {
        missingSections.push("Step 3: Add at least 1 past work credit or experience.");
    }

    const step3Complete = creditCount > 0;
    score += step3Points;

    // ==========================================
    // STEP 4: Personal Info & Physical (20 points max)
    // ==========================================
    let step4Points = 0;
    const pa = profile.physicalAttributes || profile.physical || {};
    const heightVal = pa.heightCm || (pa.height ? Number(pa.height) : null);
    const hasHeight = heightVal !== null && !isNaN(heightVal) && heightVal >= 50 && heightVal <= 260;

    if (isMinor) {
        // Minor: 10 pts for physical, 10 pts for guardian details
        if (hasHeight) step4Points += 10;
        else missingSections.push("Step 4: Add your height measurement.");

        const gd = profile.guardianDetails || profile.guardianConsent || {};
        const hasGuardian = Boolean(
            gd.guardianName && 
            (gd.relationship || gd.relation) && 
            (gd.contactNumber || gd.guardianPhone || gd.phone) && 
            gd.consentGiven
        );
        if (hasGuardian) {
            step4Points += 10;
        } else {
            missingSections.push("Step 4: Complete mandatory Legal Guardian details and consent for minors.");
        }
    } else {
        // Adult: 20 pts for physical measurements
        if (hasHeight) {
            step4Points += 20;
        } else {
            missingSections.push("Step 4: Add your height and physical measurements.");
        }
    }

    const step4Complete = isMinor 
        ? (hasHeight && Boolean(profile.guardianDetails?.guardianName && (profile.guardianDetails?.relationship || profile.guardianDetails?.relation) && (profile.guardianDetails?.contactNumber || profile.guardianDetails?.guardianPhone || profile.guardianDetails?.phone) && profile.guardianDetails?.consentGiven))
        : hasHeight;

    score += step4Points;

    const percentage = Math.min(Math.round(score), 100);

    const breakdown: ProfileCompletionBreakdown = {
        step1: step1Points,
        step2: step2Points,
        step3: step3Points,
        step4: step4Points,
        basicInfo: step1Points,
        profession: hasCategory && hasProfession ? 20 : 0,
        skillsAndLanguages: hasSkills && hasLanguages ? 15 : 0,
        credits: step3Points,
        portfolio: step2Points,
        travelAndTraining: 10
    };

    const stepsCompletion: StepsCompletionStatus = {
        step1: step1Complete,
        step2: step2Complete,
        step3: step3Complete,
        step4: step4Complete,
        isMinor
    };

    return {
        percentage,
        missingSections,
        breakdown,
        stepsCompletion
    };
};

export const calculateProfileCompletion = (profile?: any): number => {
    return calculateProfileCompletionDetails(profile).percentage;
};

export default {
    calculateProfileCompletion,
    calculateProfileCompletionDetails
};

