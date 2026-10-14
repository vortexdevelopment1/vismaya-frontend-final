const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    proficiency: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
        default: "intermediate"
    }
}, { _id: false });

const languageSchema = new mongoose.Schema({
    language: { type: String, required: true, trim: true },
    proficiency: {
        type: String,
        enum: ["basic", "conversational", "professional", "fluent", "native"],
        default: "conversational"
    }
}, { _id: false });

const creditSchema = new mongoose.Schema({
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
}, { _id: true });

const trainingSchema = new mongoose.Schema({
    institution: { type: String, required: true, trim: true },
    courseName: { type: String, required: true, trim: true },
    mentor: { type: String, trim: true },
    yearCompleted: { type: Number }
}, { _id: true });

const awardSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    organization: { type: String, trim: true },
    year: { type: Number },
    category: { type: String, trim: true }
}, { _id: true });

const talentProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
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

        // Personal Information
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

        // Category & Profession Architecture
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

        // Screen Age Range
        screenAgeMin: { type: Number },
        screenAgeMax: { type: Number },

        // Open Talent specifics (1 primary + up to 3 secondary)
        primaryProfession: { type: String, trim: true },
        secondaryProfessions: [{ type: String, trim: true }],

        // Film & TV specifics (primary dept/desig + up to 2 secondary depts)
        primaryDepartment: { type: String, trim: true },
        primaryDesignation: { type: String, trim: true },
        specializations: [{ type: String, trim: true }],
        secondaryDepartments: [{ type: String, trim: true }],

        // Voice Over specifics
        voiceAttributes: {
            vocalRange: { type: String, trim: true },
            voiceTexture: { type: String, trim: true },
            accent: { type: String, trim: true },
            studioSetup: { type: Boolean, default: false }
        },

        // Dance & Performing Arts specifics
        danceAttributes: {
            danceStyles: [{ type: String, trim: true }],
            choreographyCredits: [{ type: String, trim: true }]
        },

        // Crew & Production specifics
        crewAttributes: {
            roleCategory: { type: String, trim: true },
            equipmentList: [{ type: String, trim: true }],
            notableProjects: [{ type: String, trim: true }]
        },

        // Social Links
        socialLinks: {
            instagram: { type: String, trim: true },
            imdb: { type: String, trim: true },
            youtube: { type: String, trim: true },
            website: { type: String, trim: true },
            linkedin: { type: String, trim: true },
            twitter: { type: String, trim: true }
        },

        // Location & Mobility
        currentCity: { type: String, trim: true },
        currentState: { type: String, trim: true },
        country: { type: String, default: "India", trim: true },
        workingCities: [{ type: String, trim: true }],
        willingToTravel: { type: Boolean, default: true },
        willingToRelocate: { type: Boolean, default: false },
        passportAvailable: { type: Boolean, default: false },

        // Skills, Languages & Dialects
        skills: [skillSchema],
        languages: [languageSchema],
        accentsAndDialects: [{ type: String, trim: true }],

        // Credits & Work Experience
        credits: [creditSchema],

        // Training & Education
        training: [trainingSchema],

        // Awards & Recognitions
        awards: [awardSchema],

        // Portfolio Links / Embeds
        portfolio: {
            photos: [{ type: String, trim: true }],
            videos: [{ type: String, trim: true }],
            showreelUrl: { type: String, trim: true }
        },

        // Availability & Work Preferences
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

        // Dynamic Profession Form Data
        professionData: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        // Under-18 / Guardian Flow
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

        // Physical Attributes (Private / Masked in basic public views)
        physicalAttributes: {
            heightCm: { type: Number },
            weightKg: { type: Number },
            eyeColor: { type: String, trim: true },
            hairColor: { type: String, trim: true },
            skinTone: { type: String, trim: true },
            bodyType: { type: String, trim: true }
        },

        // Remuneration Expectation (Private)
        remunerationExpectation: {
            ratePerDay: { type: Number },
            ratePerProject: { type: Number },
            currency: { type: String, default: "INR" },
            isNegotiable: { type: Boolean, default: true }
        },

        // Verification & Badges (T6)
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
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        reviewedAt: {
            type: Date
        },

        // Featured & Trending (T8)
        featuredWork: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "MediaItem"
        }],
        featuredNominations: [{
            type: mongoose.Schema.Types.ObjectId,
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

        // Critical Edit Workflow (T6)
        pendingChanges: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },
        pendingChangesSubmittedAt: {
            type: Date
        },

        // Completion & Visibility States
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

const TalentProfile = mongoose.model("TalentProfile", talentProfileSchema);

module.exports = TalentProfile;
