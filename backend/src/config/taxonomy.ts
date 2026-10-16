/**
 * Vismaya Creative Studios — Master Taxonomy Configuration
 * Source: Master Website Specification v2.0 (§10, §17-§25)
 */

export const OPEN_TALENT_PROFESSIONS: readonly string[] = [
    "Actors",
    "Models",
    "Photographers (non-wedding)",
    "Cinematographers",
    "Singers & Rappers",
    "Percussionists",
    "Dancers",
    "Choreographers",
    "Fight Masters",
    "Action Actors",
    "Make-Up Artists",
    "Art Directors",
    "Writers & Lyricists",
    "Music Director",
    "Composers",
    "Costume Designers",
    "Stylists",
    "Editors",
    "Production Managers"
];

export interface TaxonomyCategory {
    designations: string[];
    specializations: string[];
}

export const FILM_AND_TV_TAXONOMY: Record<string, TaxonomyCategory> = {
    "Direction & Writing": {
        designations: [
            "Directors",
            "Assistant Directors",
            "Writers",
            "Screenwriters",
            "Dialogue Writers",
            "Lyricists",
            "Script Supervisors"
        ],
        specializations: [
            "Feature Film", "Short Film", "OTT Series", "TV Commercial", "Music Video", "Documentary", "Theatre"
        ]
    },
    "Casting": {
        designations: [
            "Casting Directors",
            "Casting Associates",
            "Casting Assistants",
            "Casting Coordinators"
        ],
        specializations: [
            "Lead Casting", "Background/Crowd Casting", "Child Casting", "Regional/Dialect Casting", "Voice Casting"
        ]
    },
    "Production": {
        designations: [
            "Executive Producers",
            "Line Producers",
            "Production Managers",
            "Production Coordinators",
            "Production Assistants",
            "Location Managers"
        ],
        specializations: [
            "Budgeting", "Scheduling", "Logistics", "Permits & Locations", "Post-Production Coordination"
        ]
    },
    "Cinematography & Camera": {
        designations: [
            "Directors of Photography",
            "Cinematographers",
            "Camera Operators",
            "1st AC / Focus Pullers",
            "2nd AC",
            "Camera Assistants",
            "Drone Operators"
        ],
        specializations: [
            "Feature/Fiction", "Commercial/Ad", "High-Speed", "Underwater", "Aerial", "Virtual Production", "Steadicam"
        ]
    },
    "Editing & Post-Production": {
        designations: [
            "Editors",
            "Assistant Editors",
            "Colorists",
            "DI Professionals",
            "Online Editors",
            "Post-Production Supervisors",
            "VFX Artists",
            "VFX Supervisors",
            "Motion Graphics Artists"
        ],
        specializations: [
            "Feature Editing", "Trailer Editing", "Color Grading", "Compositing", "3D Modeling", "Cleanup & Rotoscopy"
        ]
    },
    "Art & Production Design": {
        designations: [
            "Production Designers",
            "Art Directors",
            "Set Designers",
            "Prop Designers",
            "Prop Masters",
            "Set Decorators",
            "Graphic Artists"
        ],
        specializations: [
            "Period Sets", "Contemporary Sets", "Miniatures", "Digital Set Extension", "Prop Fabrication"
        ]
    },
    "Costume, Hair & Make-Up": {
        designations: [
            "Costume Designers",
            "Costume Stylists",
            "Wardrobe Stylists",
            "Make-Up Artists",
            "Hair Stylists",
            "Special Effects Make-Up Artists"
        ],
        specializations: [
            "Prosthetics & SFX", "Period Costume", "Contemporary Fashion", "Bridal & Glamour", "High-Fashion Hair"
        ]
    },
    "Sound & Music": {
        designations: [
            "Music Directors",
            "Music Producers",
            "Composers",
            "Singers",
            "Rappers",
            "Lyricists",
            "Sound Designers",
            "Sound Engineers",
            "Foley Artists",
            "Recording Engineers"
        ],
        specializations: [
            "Background Score", "Song Composition", "Sync Sound Recording", "Dialogue Editing", "Foley & SFX", "Dolby Atmos Mixing"
        ]
    },
    "Choreography & Performance": {
        designations: [
            "Choreographers",
            "Dancers",
            "Fight Masters",
            "Stunt Coordinators",
            "Stunt Performers",
            "Action Directors",
            "Action Actors"
        ],
        specializations: [
            "Bollywood / Commercial", "Contemporary / Western", "Classical Indian", "Martial Arts / Hand-to-Hand", "Wire Work / Falls", "Vehicle Action"
        ]
    },
    "Actors & On-Screen Talent": {
        designations: [
            "Actors",
            "Child Actors",
            "Character Artists",
            "Supporting Artists",
            "Models",
            "Voice Artists",
            "Anchors / Presenters"
        ],
        specializations: [
            "Lead Roles", "Negative/Antagonist", "Comic Roles", "Character Roles", "Voiceover / Dubbing", "Live Emcee"
        ]
    },
    "Photography": {
        designations: [
            "Unit Photographers",
            "Still Photographers",
            "Behind-the-Scenes Photographers",
            "Promotional Photographers"
        ],
        specializations: [
            "On-Set Stills", "Lookbook & Posters", "BTS / Publicity", "Editorial & Advertising"
        ]
    }
};

export const CAREER_STAGES: readonly string[] = [
    "Aspiring Talent",
    "Emerging Talent",
    "Experienced Professional"
];

export const FAVOURITE_TAGS: readonly string[] = [
    "Priority",
    "Lead Candidate",
    "Supporting Candidate",
    "Audition Ready",
    "Voice Match",
    "Commercial Fit",
    "Backup",
    "Recommended by Casting",
    "Future Project"
];

export interface PortfolioRequirements {
    minPhotos: number;
    minVideos: number;
    introVideoRequired?: boolean;
    showreelRequired?: boolean;
}

export interface ProfessionFormConfig {
    category: string;
    requiredFields: string[];
    portfolioRequirements: PortfolioRequirements;
    specificFields: string[];
}

export const PROFESSION_FORM_CONFIGS: Record<string, ProfessionFormConfig> = {
    "Actors": {
        category: "open_talent",
        requiredFields: ["bio", "dob", "currentCity"],
        portfolioRequirements: { minPhotos: 1, minVideos: 1, introVideoRequired: true },
        specificFields: ["screenAgeMin", "screenAgeMax", "accentsAndDialects", "physicalAttributes"]
    },
    "Models": {
        category: "open_talent",
        requiredFields: ["bio", "dob", "currentCity", "physicalAttributes"],
        portfolioRequirements: { minPhotos: 3, minVideos: 0 },
        specificFields: ["physicalAttributes.heightCm", "physicalAttributes.weightKg"]
    },
    "Photographers (non-wedding)": {
        category: "open_talent",
        requiredFields: ["bio", "currentCity"],
        portfolioRequirements: { minPhotos: 8, minVideos: 0 },
        specificFields: ["professionData.equipment", "professionData.genres"]
    },
    "Cinematographers": {
        category: "open_talent",
        requiredFields: ["bio", "currentCity"],
        portfolioRequirements: { minPhotos: 2, minVideos: 1, showreelRequired: true },
        specificFields: ["professionData.cameraKits", "professionData.lighting"]
    },
    "Singers & Rappers": {
        category: "open_talent",
        requiredFields: ["bio", "currentCity"],
        portfolioRequirements: { minPhotos: 1, minVideos: 1 },
        specificFields: ["voiceAttributes.vocalRange", "voiceAttributes.voiceTexture"]
    },
    "Dancers": {
        category: "open_talent",
        requiredFields: ["bio", "currentCity"],
        portfolioRequirements: { minPhotos: 1, minVideos: 1 },
        specificFields: ["danceAttributes.danceStyles"]
    },
    "Choreographers": {
        category: "open_talent",
        requiredFields: ["bio", "currentCity"],
        portfolioRequirements: { minPhotos: 1, minVideos: 1 },
        specificFields: ["danceAttributes.danceStyles", "danceAttributes.choreographyCredits"]
    },
    "Art Directors": {
        category: "open_talent",
        requiredFields: ["bio", "currentCity"],
        portfolioRequirements: { minPhotos: 5, minVideos: 0 },
        specificFields: ["professionData.designTools", "professionData.portfolioUrl"]
    },
    "Composers": {
        category: "open_talent",
        requiredFields: ["bio", "currentCity"],
        portfolioRequirements: { minPhotos: 1, minVideos: 2 },
        specificFields: ["professionData.daws", "professionData.genres"]
    },
    "Make-Up Artists": {
        category: "open_talent",
        requiredFields: ["bio", "currentCity"],
        portfolioRequirements: { minPhotos: 5, minVideos: 0 },
        specificFields: ["professionData.specialties"]
    }
};

export const getProfessionFormConfig = (profession?: string | null): ProfessionFormConfig | null => {
    if (!profession) return null;
    const matchKey = Object.keys(PROFESSION_FORM_CONFIGS).find(
        key => key.toLowerCase() === profession.trim().toLowerCase()
    );
    return matchKey ? PROFESSION_FORM_CONFIGS[matchKey] : {
        category: "open_talent",
        requiredFields: ["bio", "currentCity"],
        portfolioRequirements: { minPhotos: 1, minVideos: 0 },
        specificFields: []
    };
};

const taxonomy = {
    OPEN_TALENT_PROFESSIONS,
    FILM_AND_TV_TAXONOMY,
    CAREER_STAGES,
    FAVOURITE_TAGS,
    PROFESSION_FORM_CONFIGS,
    getProfessionFormConfig
};

export default taxonomy;
