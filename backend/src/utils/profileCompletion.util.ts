/**
 * Weighted Profile Completion Calculator for Vismaya Creative Studios
 * Enforces profession-aware weighted score calculation and exposes missing sections.
 * 
 * Master Spec Rules:
 * - Minimum 60% weighted profile completion is mandatory for searchability and opportunity applications.
 * - Single source of truth backend function returning { percentage, breakdown, missingSections }.
 * - Returns breakdown array: [{ section, weight, earned, missing: string[] }].
 * - Weights sum to 100 for every profession.
 */

import { getProfessionCompletionConfig, ProfileCompletionItemRule } from "../config/profileCompletionWeights.js";
import { calculateAge } from "../validators/talentProfile.validator.js";

export interface ProfileCompletionSectionBreakdown {
    section: string;
    weight: number;
    earned: number;
    missing: string[];
}

// Backward-compatible step breakdown for legacy consumers
export interface ProfileCompletionLegacyBreakdown {
    step1: number;
    step2: number;
    step3: number;
    step4: number;
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
    breakdown: ProfileCompletionSectionBreakdown[];
    missingSections: string[];
    // Legacy support fields for existing frontend/test compatibility
    legacyBreakdown?: ProfileCompletionLegacyBreakdown;
    stepsCompletion: StepsCompletionStatus;
}

/**
 * Calculates weighted and profession-aware profile completion details.
 * This is the SINGLE SOURCE OF TRUTH across the application.
 */
export const calculateProfileCompletionDetails = (profile?: any): ProfileCompletionDetails => {
    const primaryProfession = profile?.primaryProfession || 
                              profile?.profession || 
                              profile?.primaryDesignation || 
                              profile?.personal?.primaryRole || 
                              "";
    const category = profile?.category || "open_talent";

    const config = getProfessionCompletionConfig(primaryProfession, category);

    // If profile is empty/missing
    if (!profile) {
        const breakdown: ProfileCompletionSectionBreakdown[] = config.items.map(item => ({
            section: item.label,
            weight: item.weight,
            earned: 0,
            missing: [item.description]
        }));
        const missingSections = breakdown.flatMap(b => b.missing);
        return {
            percentage: 0,
            breakdown,
            missingSections,
            legacyBreakdown: {
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

    // Determine minor status
    const dob = profile.dob || profile.personal?.dob;
    const age = dob ? calculateAge(dob) : null;
    const isMinor = age !== null ? age < 18 : Boolean(profile.isUnder18);

    // Extraction helper with fallbacks across flat and nested schemas
    const firstName = (profile.firstName || profile.personal?.firstName || profile.name || "").trim();
    const lastName = (profile.lastName || profile.personal?.lastName || "").trim();
    const stageName = (profile.stageName || profile.personal?.stageName || "").trim();
    const hasBasicIdentity = Boolean((firstName || stageName) && dob);

    const profilePhoto = (profile.profilePhoto || profile.avatar || profile.personal?.avatar || profile.personal?.profilePhoto || "").trim();
    const hasProfilePhoto = Boolean(profilePhoto);

    const bioText = (profile.bio || profile.personal?.bio || "").trim();
    const hasValidBio = bioText.length >= 200 && bioText.length <= 1000;

    const currentCity = (profile.currentCity || profile.city || profile.personal?.city || "").trim();
    const hasLocation = Boolean(currentCity);

    const hasCategory = Boolean(profile.category);
    const hasProfession = Boolean(
        profile.primaryProfession || 
        profile.primaryDepartment || 
        profile.profession ||
        (profile.personal && profile.personal.primaryRole)
    );
    const hasProfessionalIdentity = hasCategory && hasProfession;

    const hasSkills = Array.isArray(profile.skills) && profile.skills.length > 0;
    const hasLanguages = Array.isArray(profile.languages) && profile.languages.length > 0;
    const hasSkillsAndLanguages = hasSkills && hasLanguages;

    const creditCount = Array.isArray(profile.credits) 
        ? profile.credits.length 
        : (Array.isArray(profile.experience) ? profile.experience.length : 0);
    const hasCredits = creditCount > 0;

    // Portfolio extraction
    const photos: string[] = profile.portfolio?.photos || (Array.isArray(profile.photos) ? profile.photos : []);
    const videos: string[] = profile.portfolio?.videos || (Array.isArray(profile.videos) ? profile.videos : []);
    const showreelUrl = (profile.portfolio?.showreelUrl || profile.showreel || "").trim();

    // Physical attributes extraction
    const pa = profile.physicalAttributes || profile.physical || {};
    const heightVal = pa.heightCm !== undefined ? Number(pa.heightCm) : (pa.height !== undefined ? Number(pa.height) : null);
    const hasHeight = heightVal !== null && !isNaN(heightVal) && heightVal >= 50 && heightVal <= 260;

    // Guardian details for minor
    const gd = profile.guardianDetails || profile.guardianConsent || {};
    const hasGuardian = Boolean(
        gd.guardianName && 
        (gd.relationship || gd.relation) && 
        (gd.contactNumber || gd.guardianPhone || gd.phone) && 
        gd.consentGiven
    );

    // Compute earned points and missing items per configured item rule
    let totalScore = 0;
    const breakdown: ProfileCompletionSectionBreakdown[] = [];
    const missingSections: string[] = [];

    for (const item of config.items) {
        let earned = 0;
        const itemMissing: string[] = [];

        switch (item.key) {
            case "basic_identity":
                if (hasBasicIdentity) {
                    earned = item.weight;
                } else {
                    itemMissing.push("Identity: Add your full name and date of birth.");
                }
                break;

            case "profile_photo":
                if (hasProfilePhoto) {
                    earned = item.weight;
                } else {
                    itemMissing.push("Profile Photo: Upload a high-quality portrait photo.");
                }
                break;

            case "bio_headline":
                if (hasValidBio) {
                    earned = item.weight;
                } else {
                    itemMissing.push("Bio: Write a professional bio between 200 and 1,000 characters.");
                }
                break;

            case "location":
                if (hasLocation) {
                    earned = item.weight;
                } else {
                    itemMissing.push("Location: Specify your current city.");
                }
                break;

            case "professional_identity":
                if (hasProfessionalIdentity) {
                    earned = item.weight;
                } else {
                    itemMissing.push("Profession: Select your category and primary profession.");
                }
                break;

            case "skills_languages":
                if (hasSkillsAndLanguages) {
                    earned = item.weight;
                } else {
                    itemMissing.push("Skills & Languages: Add at least 1 professional skill and 1 language.");
                }
                break;

            case "experience_credits":
                if (hasCredits) {
                    earned = item.weight;
                } else {
                    itemMissing.push("Credits: Add at least 1 past work credit or experience entry.");
                }
                break;

            // Actor / Performer specific items
            case "headshot_photos":
                if (photos.length >= 1) {
                    earned = item.weight;
                } else {
                    itemMissing.push("Headshot: Upload at least 1 close-up headshot photo.");
                }
                break;

            case "intro_video":
                // Intro video or showreel
                if (videos.length >= 1 || showreelUrl) {
                    earned = item.weight;
                } else {
                    itemMissing.push("Intro Video: Upload an introductory video or showreel link.");
                }
                break;

            case "physical_specs":
                if (isMinor) {
                    if (hasHeight && hasGuardian) {
                        earned = item.weight;
                    } else {
                        if (!hasHeight) itemMissing.push("Physical: Add your height measurement.");
                        if (!hasGuardian) itemMissing.push("Guardian: Complete mandatory legal guardian details and consent.");
                    }
                } else {
                    if (hasHeight) {
                        earned = item.weight;
                    } else {
                        itemMissing.push("Physical: Add your height measurement.");
                    }
                }
                break;

            // Model specific items
            case "portfolio_photos":
                // If weight is for 8+ photos (Photographers) vs 3+ photos (Models) vs 5+ (Makeup/Art) vs default 1+
                if (item.label.includes("8") || item.description.includes("8")) {
                    if (photos.length >= 8) earned = item.weight;
                    else itemMissing.push(`Portfolio: Upload at least 8 photo samples (currently ${photos.length}).`);
                } else if (item.label.includes("5") || item.description.includes("5")) {
                    if (photos.length >= 5) earned = item.weight;
                    else itemMissing.push(`Portfolio: Upload at least 5 portfolio samples (currently ${photos.length}).`);
                } else if (item.label.includes("3") || item.description.includes("3")) {
                    if (photos.length >= 3) earned = item.weight;
                    else itemMissing.push(`Portfolio: Upload at least 3 photos (headshot, mid-shot, full-length; currently ${photos.length}).`);
                } else {
                    if (photos.length >= 1) earned = item.weight;
                    else itemMissing.push("Portfolio: Upload at least 1 portfolio photo.");
                }
                break;

            // Cinematographer specific items
            case "showreel":
                if (Boolean(showreelUrl) || videos.length >= 1) {
                    earned = item.weight;
                } else {
                    itemMissing.push("Showreel: Upload or link your cinematographer showreel.");
                }
                break;

            case "camera_gear":
                const pDataCine = profile.professionData || {};
                const hasCameraGear = Boolean(pDataCine.cameraKits || pDataCine.lighting || profile.crewAttributes?.equipmentList?.length);
                if (hasCameraGear) {
                    earned = item.weight;
                } else {
                    itemMissing.push("Equipment: Specify your camera systems or lighting proficiencies.");
                }
                break;

            // Singer / Dancer / Choreographer specific items
            case "performance_video":
                if (videos.length >= 1 || showreelUrl) {
                    earned = item.weight;
                } else {
                    itemMissing.push("Performance Video: Upload at least 1 performance video or demo reel.");
                }
                break;

            case "voice_attributes":
                const va = profile.voiceAttributes || profile.professionData || {};
                const hasVoiceAttrs = Boolean(va.vocalRange || va.voiceTexture || va.accent || va.studioSetup !== undefined);
                if (hasVoiceAttrs) {
                    earned = item.weight;
                } else {
                    itemMissing.push("Voice Attributes: Add your vocal range, texture, or studio setup details.");
                }
                break;

            case "dance_styles":
                const da = profile.danceAttributes || profile.professionData || {};
                const hasDanceStyles = (Array.isArray(da.danceStyles) && da.danceStyles.length > 0) || (Array.isArray(da.choreographyCredits) && da.choreographyCredits.length > 0);
                if (hasDanceStyles) {
                    earned = item.weight;
                } else {
                    itemMissing.push("Dance Styles: Add your primary dance styles or choreography credits.");
                }
                break;

            // Art & Makeup specific
            case "portfolio_samples":
                if (photos.length >= 5 || videos.length >= 2) {
                    earned = item.weight;
                } else {
                    itemMissing.push("Portfolio: Upload at least 5 work samples.");
                }
                break;

            case "design_tools":
                const pDataArt = profile.professionData || {};
                const hasArtTools = Boolean(pDataArt.designTools || pDataArt.portfolioUrl || (Array.isArray(profile.skills) && profile.skills.length >= 2));
                if (hasArtTools) {
                    earned = item.weight;
                } else {
                    itemMissing.push("Design Tools: List your design software proficiencies.");
                }
                break;

            case "specialties":
                const pDataMu = profile.professionData || {};
                const hasMuSpecialties = Boolean(pDataMu.specialties || pDataMu.genres || (Array.isArray(profile.skills) && profile.skills.length >= 2));
                if (hasMuSpecialties) {
                    earned = item.weight;
                } else {
                    itemMissing.push("Specialties: List your make-up or styling specialties.");
                }
                break;

            // Music / Composer specific
            case "work_samples":
                if (photos.length + videos.length >= 2 || (videos.length >= 1 && showreelUrl)) {
                    earned = item.weight;
                } else {
                    itemMissing.push("Work Samples: Upload at least 2 music tracks, video clips, or reels.");
                }
                break;

            case "daws_genres":
                const pDataComp = profile.professionData || {};
                const hasDaws = Boolean(pDataComp.daws || pDataComp.genres || (Array.isArray(profile.skills) && profile.skills.length >= 2));
                if (hasDaws) {
                    earned = item.weight;
                } else {
                    itemMissing.push("DAWs & Genres: List your digital audio workstations and music genres.");
                }
                break;

            // Voice-over & Presenter specific
            case "voice_reel":
                if (videos.length >= 1 || showreelUrl) {
                    earned = item.weight;
                } else {
                    itemMissing.push("Voice Reel: Upload a voice demo clip or intro video.");
                }
                break;

            // Crew & Production specific
            case "crew_attributes":
                const ca = profile.crewAttributes || profile.professionData || {};
                const hasCrewAttrs = Boolean(ca.roleCategory || ca.equipmentList?.length || ca.notableProjects?.length || ca.capabilities);
                if (hasCrewAttrs) {
                    earned = item.weight;
                } else {
                    itemMissing.push("Production Expertise: Specify your equipment access and production capabilities.");
                }
                break;

            case "equipment_genres":
                const pDataPhoto = profile.professionData || {};
                const hasPhotoEquip = Boolean(pDataPhoto.equipment || pDataPhoto.genres || (Array.isArray(profile.skills) && profile.skills.length >= 2));
                if (hasPhotoEquip) {
                    earned = item.weight;
                } else {
                    itemMissing.push("Equipment & Genres: Specify your camera equipment access and photography genres.");
                }
                break;

            // Default fallback media & details
            case "portfolio_media":
                if (photos.length > 0 || videos.length > 0 || showreelUrl) {
                    earned = item.weight;
                } else {
                    itemMissing.push("Portfolio: Upload at least 1 portfolio photo or showreel video.");
                }
                break;

            case "profession_details":
                const hasAnySpecificDetail = hasHeight || Boolean(profile.professionData && Object.keys(profile.professionData).length > 0) || Boolean(showreelUrl);
                if (hasAnySpecificDetail) {
                    earned = item.weight;
                } else {
                    itemMissing.push("Details: Complete profession-specific details or showreel link.");
                }
                break;

            default:
                earned = item.weight;
                break;
        }

        totalScore += earned;
        breakdown.push({
            section: item.label,
            weight: item.weight,
            earned,
            missing: itemMissing
        });
        if (itemMissing.length > 0) {
            missingSections.push(...itemMissing);
        }
    }

    const percentage = Math.min(Math.round(totalScore), 100);

    // Legacy 4-step status mapping for existing wizards and backwards compatibility
    const step1Complete = hasProfessionalIdentity && hasValidBio && hasLocation && hasSkillsAndLanguages;
    const step2Complete = hasProfilePhoto && (photos.length > 0 || videos.length > 0 || Boolean(showreelUrl));
    const step3Complete = hasCredits;
    const step4Complete = isMinor ? (hasHeight && hasGuardian) : hasHeight;

    const stepsCompletion: StepsCompletionStatus = {
        step1: step1Complete,
        step2: step2Complete,
        step3: step3Complete,
        step4: step4Complete,
        isMinor
    };

    return {
        percentage,
        breakdown,
        missingSections,
        legacyBreakdown: {
            step1: step1Complete ? 40 : 0,
            step2: step2Complete ? 25 : 0,
            step3: step3Complete ? 15 : 0,
            step4: step4Complete ? 20 : 0,
            basicInfo: hasBasicIdentity ? 10 : 0,
            profession: hasProfessionalIdentity ? 20 : 0,
            skillsAndLanguages: hasSkillsAndLanguages ? 15 : 0,
            credits: hasCredits ? 15 : 0,
            portfolio: step2Complete ? 25 : 0,
            travelAndTraining: 10
        },
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
