import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISkill {
    name: string;
    category?: string;
    proficiency: "beginner" | "intermediate" | "advanced" | "expert";
}

export interface ILanguage {
    language: string;
    proficiency: "basic" | "conversational" | "professional" | "fluent" | "native";
}

export interface ICredit {
    _id?: Types.ObjectId;
    projectTitle: string;
    projectType?: string;
    projectStatus: "released" | "completed" | "in_production" | "upcoming";
    roleOrDesignation?: string;
    year?: number;
    directorOrProduction?: string;
    characterName?: string;
    referenceLink?: string;
    workEvidenceUrl?: string;
    isVerifiedCredit: boolean;
}

export interface ITraining {
    _id?: Types.ObjectId;
    institution: string;
    courseName: string;
    mentor?: string;
    yearCompleted?: number;
}

export interface IAward {
    _id?: Types.ObjectId;
    title: string;
    organization?: string;
    year?: number;
    category?: string;
}

export interface ITalentProfile extends Document {
    userId: Types.ObjectId;
    vismayaId: string;
    stageName?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    headline?: string;
    bio?: string;
    profilePhoto?: string;
    dob?: Date;
    gender: "male" | "female" | "non_binary" | "transgender" | "prefer_not_to_say" | "other";
    nationality: string;
    careerStage: "aspiring" | "emerging" | "experienced" | "early_career" | "mid_level" | "veteran";
    category: "open_talent" | "film_and_tv" | "voice_over" | "dance_and_performing_arts" | "crew_and_production";
    screenAgeMin?: number;
    screenAgeMax?: number;
    primaryProfession?: string;
    secondaryProfessions: string[];
    primaryDepartment?: string;
    primaryDesignation?: string;
    specializations: string[];
    secondaryDepartments: string[];
    voiceAttributes?: {
        vocalRange?: string;
        voiceTexture?: string;
        accent?: string;
        studioSetup?: boolean;
    };
    danceAttributes?: {
        danceStyles: string[];
        choreographyCredits: string[];
    };
    crewAttributes?: {
        roleCategory?: string;
        equipmentList: string[];
        notableProjects: string[];
    };
    socialLinks?: {
        instagram?: string;
        imdb?: string;
        youtube?: string;
        website?: string;
        linkedin?: string;
        twitter?: string;
    };
    currentCity?: string;
    currentState?: string;
    country: string;
    workingCities: string[];
    willingToTravel: boolean;
    willingToRelocate: boolean;
    passportAvailable: boolean;
    skills: ISkill[];
    languages: ILanguage[];
    accentsAndDialects: string[];
    credits: ICredit[];
    training: ITraining[];
    awards: IAward[];
    portfolio?: {
        photos: string[];
        videos: string[];
        showreelUrl?: string;
    };
    availability?: {
        status: "available_now" | "occupied" | "available_from" | "unavailable" | "open_to_opportunities";
        from?: Date;
    };
    openToWorkAnywhere: boolean;
    remoteMode: "in_person" | "remote" | "hybrid";
    experienceRange?: "<1" | "1-3" | "3-5" | "5-10" | "10+";
    professionData?: Record<string, unknown>;
    isUnder18: boolean;
    guardianDetails?: {
        guardianName?: string;
        relationship?: string;
        contactNumber?: string;
        guardianEmail?: string;
        supportingDocumentUrl?: string;
        consentGiven?: boolean;
        consentDate?: Date;
    };
    physicalAttributes?: {
        heightCm?: number;
        weightKg?: number;
        eyeColor?: string;
        hairColor?: string;
        skinTone?: string;
        bodyType?: string;
    };
    remunerationExpectation?: {
        ratePerDay?: number;
        ratePerProject?: number;
        currency: string;
        isNegotiable: boolean;
    };
    status: "pending" | "active" | "approved" | "rejected" | "suspended";
    isProfileApproved: boolean;
    isVerified: boolean;
    verifiedAt?: Date;
    badgeType: "none" | "verified" | "elite" | "pro";
    statusReason?: string;
    rejectionReason?: string;
    reviewedBy?: Types.ObjectId;
    reviewedAt?: Date;
    featuredWork: Types.ObjectId[];
    featuredNominations: Types.ObjectId[];
    isFeatured: boolean;
    isTrending: boolean;
    trendingExcluded: boolean;
    pendingChanges?: Record<string, unknown> | null;
    pendingChangesSubmittedAt?: Date;
    profileCompletionPercentage: number;
    isPaid: boolean;
    paidAt?: Date;
    isSearchable: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const skillSchema = new Schema<ISkill>(
    {
        name: { type: String, required: true, trim: true },
        category: { type: String, trim: true },
        proficiency: {
            type: String,
            enum: ["beginner", "intermediate", "advanced", "expert"],
            default: "intermediate"
        }
    },
    { _id: false }
);

const languageSchema = new Schema<ILanguage>(
    {
        language: { type: String, required: true, trim: true },
        proficiency: {
            type: String,
            enum: ["basic", "conversational", "professional", "fluent", "native"],
            default: "conversational"
        }
    },
    { _id: false }
);

const creditSchema = new Schema<ICredit>(
    {
        projectTitle: { type: String, required: true, trim: true },
        projectType: { type: String, trim: true },
        projectStatus: {
            type: String,
            enum: ["released", "completed", "in_production", "upcoming"],
            default: "completed"
        },
        roleOrDesignation: { type: String, trim: true },
        year: { type: Number },
        directorOrProduction: { type: String, trim: true },
        characterName: { type: String, trim: true },
        referenceLink: { type: String, trim: true },
        workEvidenceUrl: { type: String, trim: true },
        isVerifiedCredit: { type: Boolean, default: false }
    },
    { _id: true }
);

const trainingSchema = new Schema<ITraining>(
    {
        institution: { type: String, required: true, trim: true },
        courseName: { type: String, required: true, trim: true },
        mentor: { type: String, trim: true },
        yearCompleted: { type: Number }
    },
    { _id: true }
);

const awardSchema = new Schema<IAward>(
    {
        title: { type: String, required: true, trim: true },
        organization: { type: String, trim: true },
        year: { type: Number },
        category: { type: String, trim: true }
    },
    { _id: true }
);

const talentProfileSchema = new Schema<ITalentProfile>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        vismayaId: {
            type: String,
            unique: true,
            required: true,
            trim: true
        },

        stageName: { type: String, trim: true },
        firstName: { type: String, trim: true },
        middleName: { type: String, trim: true },
        lastName: { type: String, trim: true },
        headline: { type: String, trim: true },
        bio: { type: String, trim: true },
        profilePhoto: { type: String, trim: true },
        dob: { type: Date },
        gender: {
            type: String,
            enum: ["male", "female", "non_binary", "transgender", "prefer_not_to_say", "other"],
            default: "prefer_not_to_say"
        },
        nationality: { type: String, default: "Indian", trim: true },
        careerStage: {
            type: String,
            enum: ["aspiring", "emerging", "experienced", "early_career", "mid_level", "veteran"],
            default: "aspiring"
        },

        category: {
            type: String,
            enum: [
                "open_talent",
                "film_and_tv",
                "voice_over",
                "dance_and_performing_arts",
                "crew_and_production"
            ],
            default: "open_talent"
        },

        screenAgeMin: { type: Number },
        screenAgeMax: { type: Number },

        primaryProfession: { type: String, trim: true },
        secondaryProfessions: [{ type: String, trim: true }],

        primaryDepartment: { type: String, trim: true },
        primaryDesignation: { type: String, trim: true },
        specializations: [{ type: String, trim: true }],
        secondaryDepartments: [{ type: String, trim: true }],

        voiceAttributes: {
            vocalRange: { type: String, trim: true },
            voiceTexture: { type: String, trim: true },
            accent: { type: String, trim: true },
            studioSetup: { type: Boolean, default: false }
        },

        danceAttributes: {
            danceStyles: [{ type: String, trim: true }],
            choreographyCredits: [{ type: String, trim: true }]
        },

        crewAttributes: {
            roleCategory: { type: String, trim: true },
            equipmentList: [{ type: String, trim: true }],
            notableProjects: [{ type: String, trim: true }]
        },

        socialLinks: {
            instagram: { type: String, trim: true },
            imdb: { type: String, trim: true },
            youtube: { type: String, trim: true },
            website: { type: String, trim: true },
            linkedin: { type: String, trim: true },
            twitter: { type: String, trim: true }
        },

        currentCity: { type: String, trim: true },
        currentState: { type: String, trim: true },
        country: { type: String, default: "India", trim: true },
        workingCities: [{ type: String, trim: true }],
        willingToTravel: { type: Boolean, default: true },
        willingToRelocate: { type: Boolean, default: false },
        passportAvailable: { type: Boolean, default: false },

        skills: [skillSchema],
        languages: [languageSchema],
        accentsAndDialects: [{ type: String, trim: true }],

        credits: [creditSchema],
        training: [trainingSchema],
        awards: [awardSchema],

        portfolio: {
            photos: [{ type: String, trim: true }],
            videos: [{ type: String, trim: true }],
            showreelUrl: { type: String, trim: true }
        },

        availability: {
            status: {
                type: String,
                enum: ["available_now", "occupied", "available_from", "unavailable", "open_to_opportunities"],
                default: "available_now"
            },
            from: { type: Date }
        },
        openToWorkAnywhere: { type: Boolean, default: false },
        remoteMode: {
            type: String,
            enum: ["in_person", "remote", "hybrid"],
            default: "in_person"
        },
        experienceRange: {
            type: String,
            enum: ["<1", "1-3", "3-5", "5-10", "10+"]
        },

        professionData: {
            type: Schema.Types.Mixed,
            default: {}
        },

        isUnder18: { type: Boolean, default: false },
        guardianDetails: {
            guardianName: { type: String, trim: true },
            relationship: { type: String, trim: true },
            contactNumber: { type: String, trim: true },
            guardianEmail: { type: String, trim: true },
            supportingDocumentUrl: { type: String, trim: true },
            consentGiven: { type: Boolean, default: false },
            consentDate: { type: Date }
        },

        physicalAttributes: {
            heightCm: { type: Number },
            weightKg: { type: Number },
            eyeColor: { type: String, trim: true },
            hairColor: { type: String, trim: true },
            skinTone: { type: String, trim: true },
            bodyType: { type: String, trim: true }
        },

        remunerationExpectation: {
            ratePerDay: { type: Number },
            ratePerProject: { type: Number },
            currency: { type: String, default: "INR" },
            isNegotiable: { type: Boolean, default: true }
        },

        status: {
            type: String,
            enum: ["pending", "active", "approved", "rejected", "suspended"],
            default: "pending"
        },

        isProfileApproved: {
            type: Boolean,
            default: false
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        verifiedAt: {
            type: Date
        },

        badgeType: {
            type: String,
            enum: ["none", "verified", "elite", "pro"],
            default: "none"
        },

        statusReason: {
            type: String,
            trim: true
        },

        rejectionReason: {
            type: String,
            trim: true
        },

        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },

        reviewedAt: {
            type: Date
        },

        featuredWork: [{
            type: Schema.Types.ObjectId,
            ref: "MediaItem"
        }],
        featuredNominations: [{
            type: Schema.Types.ObjectId,
            ref: "MediaItem"
        }],
        isFeatured: {
            type: Boolean,
            default: false
        },
        isTrending: {
            type: Boolean,
            default: false
        },
        trendingExcluded: {
            type: Boolean,
            default: false
        },

        pendingChanges: {
            type: Schema.Types.Mixed,
            default: null
        },
        pendingChangesSubmittedAt: {
            type: Date
        },

        profileCompletionPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },

        isPaid: {
            type: Boolean,
            default: false
        },

        paidAt: {
            type: Date
        },

        isSearchable: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

talentProfileSchema.index({ category: 1, primaryProfession: 1, currentCity: 1 });
talentProfileSchema.index({ primaryDepartment: 1, primaryDesignation: 1 });
talentProfileSchema.index({ isSearchable: 1, profileCompletionPercentage: -1 });

export const TalentProfile: Model<ITalentProfile> = mongoose.model<ITalentProfile>("TalentProfile", talentProfileSchema);
export default TalentProfile;
