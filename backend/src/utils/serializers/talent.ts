/**
 * Vismaya Creative Studios — Talent Privacy Serializers
 * Implements strict role-aware serializers per Specification §7 & §14
 */

export const FORBIDDEN_PUBLIC_KEYS: readonly string[] = [
    "email",
    "mobile",
    "phone",
    "contactNumber",
    "guardianEmail",
    "guardianDetails",
    "remunerationExpectation",
    "physicalAttributes",
    "password",
    "otp",
    "token",
    "identityData"
];

export const FORBIDDEN_ORGANIZATION_FULL_KEYS: readonly string[] = [
    "email",
    "mobile",
    "phone",
    "contactNumber",
    "guardianEmail",
    "guardianDetails",
    "remunerationExpectation",
    "physicalAttributes",
    "password",
    "otp",
    "token",
    "identityData"
];

export const formatLastNameInitial = (firstName?: string | null, lastName?: string | null, stageName?: string | null): string => {
    if (stageName) return stageName;
    if (!firstName && !lastName) return "Anonymous";
    if (firstName && !lastName) return firstName;
    const initial = (lastName || "").trim().charAt(0).toUpperCase();
    return `${(firstName || "").trim()} ${initial}.`;
};

export const toCard = (profile?: any, viewerRole = "guest", badges: Record<string, unknown> = {}): Record<string, unknown> | null => {
    if (!profile) return null;
    const p = profile.toObject ? profile.toObject() : { ...profile };

    const card: Record<string, unknown> = {
        _id: p._id,
        vismayaId: p.vismayaId,
        displayName: formatLastNameInitial(p.firstName, p.lastName, p.stageName),
        stageName: p.stageName,
        firstName: p.firstName,
        lastNameInitial: p.lastName ? `${p.lastName.trim().charAt(0).toUpperCase()}.` : undefined,
        headline: p.headline,
        profilePhoto: p.profilePhoto,
        category: p.category,
        primaryProfession: p.primaryProfession,
        secondaryProfessions: p.secondaryProfessions || [],
        primaryDepartment: p.primaryDepartment,
        primaryDesignation: p.primaryDesignation,
        careerStage: p.careerStage,
        skills: (p.skills || []).slice(0, 5),
        languages: (p.languages || []).slice(0, 3),
        profileCompletionPercentage: p.profileCompletionPercentage,
        isFeatured: !!p.isFeatured,
        isTrending: !!p.isTrending,
        verificationBadges: badges || { identityVerified: false, professionalVerified: false },
        createdAt: p.createdAt
    };

    // City is visible to industry/org/admin, but hidden for talent viewers on cards per D3
    if (viewerRole === "organization" || viewerRole === "admin") {
        card.currentCity = p.currentCity;
        card.currentState = p.currentState;
    }

    return card;
};

export const toLimitedPreview = (profile?: any, viewerRole = "guest", badges: Record<string, unknown> = {}): Record<string, unknown> | null => {
    if (!profile) return null;
    const p = profile.toObject ? profile.toObject() : { ...profile };

    return {
        _id: p._id,
        vismayaId: p.vismayaId,
        displayName: formatLastNameInitial(p.firstName, p.lastName, p.stageName),
        stageName: p.stageName,
        firstName: p.firstName,
        lastNameInitial: p.lastName ? `${p.lastName.trim().charAt(0).toUpperCase()}.` : undefined,
        headline: p.headline,
        bio: p.bio,
        profilePhoto: p.profilePhoto,
        category: p.category,
        primaryProfession: p.primaryProfession,
        secondaryProfessions: p.secondaryProfessions || [],
        primaryDepartment: p.primaryDepartment,
        primaryDesignation: p.primaryDesignation,
        secondaryDepartments: p.secondaryDepartments || [],
        specializations: p.specializations || [],
        careerStage: p.careerStage,
        currentCity: p.currentCity,
        currentState: p.currentState,
        country: p.country,
        skills: p.skills || [],
        languages: p.languages || [],
        creditsCount: (p.credits || []).length,
        profileCompletionPercentage: p.profileCompletionPercentage,
        isFeatured: !!p.isFeatured,
        isTrending: !!p.isTrending,
        verificationBadges: badges || { identityVerified: false, professionalVerified: false },
        isUnlocked: false
    };
};

export const toFullProfile = (
    profile?: any,
    viewer: { userId?: string; role?: string } | null = null,
    options: { badges?: Record<string, unknown>; user?: any; isUnlocked?: boolean } = {}
): Record<string, unknown> | null => {
    if (!profile) return null;
    const p = profile.toObject ? profile.toObject() : { ...profile };
    const { badges = {}, user = null, isUnlocked = false } = options;

    const isOwner = viewer && viewer.userId === String(p.userId);
    const isAdmin = viewer && viewer.role === "admin";

    // Full Raw for Owner / Admin
    if (isOwner || isAdmin) {
        return {
            ...p,
            status: p.status || (p.isProfileApproved ? "approved" : (p.isVerified ? "active" : (user?.status || "pending"))),
            isProfileApproved: Boolean(p.isProfileApproved),
            statusReason: p.statusReason || p.rejectionReason || null,
            contactDetails: {
                email: user?.email,
                mobile: user?.mobile,
                name: user?.name
            },
            verificationBadges: badges,
            isUnlocked: true,
            isOwner,
            isAdmin
        };
    }

    // For Organization or Guest: clean forbidden keys
    const safeProfile = { ...p };

    // Strip strictly forbidden keys
    for (const key of FORBIDDEN_ORGANIZATION_FULL_KEYS) {
        delete safeProfile[key];
    }
    delete safeProfile.pendingChanges;
    delete safeProfile.pendingChangesSubmittedAt;

    return {
        ...safeProfile,
        verificationBadges: badges,
        isUnlocked: !!isUnlocked
    };
};

/**
 * Deny-list verification helper to test serialization safety
 */
export const checkDenyList = (obj: any, forbiddenKeys: readonly string[] = FORBIDDEN_PUBLIC_KEYS): boolean => {
    if (!obj || typeof obj !== "object") return true;

    for (const key of Object.keys(obj)) {
        if (forbiddenKeys.includes(key)) {
            return false;
        }
        if (typeof obj[key] === "object" && obj[key] !== null) {
            const childValid = checkDenyList(obj[key], forbiddenKeys);
            if (!childValid) return false;
        }
    }
    return true;
};

export default {
    FORBIDDEN_PUBLIC_KEYS,
    FORBIDDEN_ORGANIZATION_FULL_KEYS,
    formatLastNameInitial,
    toCard,
    toLimitedPreview,
    toFullProfile,
    checkDenyList
};
