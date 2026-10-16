/**
 * Weighted Profile Completion Calculator for Vismaya Creative Studios
 * Enforces profession-aware weighted score calculation and exposes missing sections
 */

import { getProfessionFormConfig } from "../config/taxonomy.js";

export interface ProfileCompletionBreakdown {
    basicInfo: number;
    profession: number;
    skillsAndLanguages: number;
    credits: number;
    portfolio: number;
    travelAndTraining: number;
}

export interface ProfileCompletionDetails {
    percentage: number;
    missingSections: string[];
    breakdown: ProfileCompletionBreakdown;
}

export const calculateProfileCompletionDetails = (profile?: any): ProfileCompletionDetails => {
    if (!profile) {
        return {
            percentage: 0,
            missingSections: [
                "Basic Information (Name, Photo, Bio >= 200 chars, City, DOB, Gender)",
                "Profession & Category Setup",
                "Skills & Languages",
                "Credits & Work Experience",
                "Portfolio & Showreel Media",
                "Working Cities & Training"
            ],
            breakdown: {
                basicInfo: 0,
                profession: 0,
                skillsAndLanguages: 0,
                credits: 0,
                portfolio: 0,
                travelAndTraining: 0
            }
        };
    }

    let score = 0;
    const missingSections: string[] = [];
    const breakdown: ProfileCompletionBreakdown = {
        basicInfo: 0,
        profession: 0,
        skillsAndLanguages: 0,
        credits: 0,
        portfolio: 0,
        travelAndTraining: 0
    };

    // 1. Basic Info (20 points)
    let basicPoints = 0;
    if (profile.firstName || profile.stageName) basicPoints += 5;
    if (profile.profilePhoto) basicPoints += 5;
    if (profile.bio && profile.bio.trim().length >= 200) {
        basicPoints += 5;
    }
    if (profile.dob && profile.gender && profile.currentCity) basicPoints += 5;
    breakdown.basicInfo = basicPoints;
    score += basicPoints;
    if (basicPoints < 20) {
        if (!profile.bio || profile.bio.trim().length < 200) {
            missingSections.push("Add a bio with at least 200 characters.");
        }
        if (!profile.profilePhoto) {
            missingSections.push("Upload a profile photo.");
        }
        if (!profile.dob || !profile.gender || !profile.currentCity) {
            missingSections.push("Complete DOB, gender, and current city.");
        }
    }

    // 2. Profession Setup (20 points)
    let professionPoints = 0;
    if (profile.category) {
        if (profile.category === "open_talent" && profile.primaryProfession) {
            professionPoints = 20;
        } else if (profile.category === "film_and_tv" && profile.primaryDepartment && profile.primaryDesignation) {
            professionPoints = 20;
        } else if (profile.primaryProfession || profile.primaryDepartment) {
            professionPoints = 20;
        }
    }
    breakdown.profession = professionPoints;
    score += professionPoints;
    if (professionPoints < 20) {
        missingSections.push("Set primary profession or department & designation.");
    }

    // 3. Skills & Languages (15 points)
    let skillPoints = 0;
    if (Array.isArray(profile.skills) && profile.skills.length > 0) skillPoints += 8;
    if (Array.isArray(profile.languages) && profile.languages.length > 0) skillPoints += 7;
    breakdown.skillsAndLanguages = skillPoints;
    score += skillPoints;
    if (skillPoints < 15) {
        missingSections.push("Add at least 1 skill and 1 language with proficiency.");
    }

    // 4. Credits & Work Experience (20 points)
    let creditPoints = 0;
    if (Array.isArray(profile.credits) && profile.credits.length > 0) {
        creditPoints = Math.min(profile.credits.length * 10, 20);
    }
    breakdown.credits = creditPoints;
    score += creditPoints;
    if (creditPoints < 20) {
        missingSections.push("Add at least 2 past credits or work experiences.");
    }

    // 5. Portfolio & Showreel Links (15 points)
    let portfolioPoints = 0;
    const photoCount = profile.portfolio?.photos?.length || 0;
    const videoCount = profile.portfolio?.videos?.length || 0;
    const hasShowreel = !!profile.portfolio?.showreelUrl;

    const formConfig = profile.primaryProfession ? getProfessionFormConfig(profile.primaryProfession) : null;
    const reqPhotos = formConfig?.portfolioRequirements?.minPhotos || 1;
    const reqVideos = formConfig?.portfolioRequirements?.minVideos || 0;

    const hasAnyMedia = photoCount > 0 || videoCount > 0 || hasShowreel;
    if (hasAnyMedia && (photoCount >= reqPhotos || (reqVideos > 0 && videoCount >= reqVideos) || hasShowreel)) {
        portfolioPoints = 15;
    }
    breakdown.portfolio = portfolioPoints;
    score += portfolioPoints;
    if (portfolioPoints < 15) {
        missingSections.push("Upload portfolio media meeting your profession's minimum requirements.");
    }

    // 6. Travel, Relocation & Training (10 points)
    let extraPoints = 0;
    if (Array.isArray(profile.workingCities) && profile.workingCities.length > 0) extraPoints += 5;
    if ((Array.isArray(profile.training) && profile.training.length > 0) || (Array.isArray(profile.awards) && profile.awards.length > 0)) {
        extraPoints += 5;
    }
    breakdown.travelAndTraining = extraPoints;
    score += extraPoints;
    if (extraPoints < 10) {
        missingSections.push("Add working cities and formal training / awards.");
    }

    const percentage = Math.min(Math.round(score), 100);

    return {
        percentage,
        missingSections,
        breakdown
    };
};

export const calculateProfileCompletion = (profile?: any): number => {
    return calculateProfileCompletionDetails(profile).percentage;
};

export default {
    calculateProfileCompletion,
    calculateProfileCompletionDetails
};
