/**
 * Vismaya Creative Studios — Profile Completion Weights Configuration
 * 
 * Spec Reference:
 * - Master Website Specification v2.0 (§8 "Common Talent Field Dictionary", §9 "Under-18 Guardian Flow", §17-§25 "Profession-Specific Registration")
 * - Minimum 60% weighted profile completion is mandatory for searchability and opportunity applications.
 * - Single source of truth config for all categories and professions.
 * - Every profession/category configuration sums to exactly 100 points.
 * 
 * In this configuration:
 * - Items marked with [SPEC] are directly mandated by the Vismaya Specification for that profession/flow.
 * - Weight point distributions across sections/items are our architectural decisions to ensure 100% total,
 *   logical graduation of completion, and meaningful 60% gating (basic profile + key media reaches >= 60%).
 */

export interface ProfileCompletionItemRule {
    key: string;
    label: string;
    section: "identity" | "bio" | "location" | "professional" | "skills_languages" | "experience" | "portfolio" | "profession_specific";
    weight: number;
    specOrigin: "SPEC_MANDATED" | "SYSTEM_STANDARD";
    description: string;
}

export interface ProfessionCompletionConfig {
    key: string;
    title: string;
    category: string;
    items: ProfileCompletionItemRule[];
}

/**
 * Common item rules present across all talent profiles:
 * - Basic Identity & Names: 10 pts [SPEC: §8]
 * - Profile Photo: 10 pts [SPEC: §8, §15 Mandatory before payment]
 * - Bio & Headline: 10 pts [SPEC: §8 200-1000 chars]
 * - Location (City & State/Country): 10 pts [SPEC: §8]
 * - Professional Identity (Category & Profession/Department): 10 pts [SPEC: §8, §10]
 * - Skills & Languages: 10 pts [SPEC: §8]
 * - Experience / Credits: 10 pts [SPEC: §8, §16]
 * Total Common Core = 70 points
 * 
 * Remaining 30 points are tailored to the profession/category:
 * - Performers (Actors): Headshot photo (10 pts), Intro video (10 pts), Physical specs / Height (10 pts) [SPEC: §17]
 * - Models: 3+ Portfolio Photos / Headshot + Mid + Full (15 pts), Height & Measurements (15 pts) [SPEC: §18]
 * - Photographers (non-wedding): 8+ Portfolio photos (20 pts), Equipment & Genres (10 pts) [SPEC: §19.1]
 * - Cinematographers: Showreel / Video reel (15 pts), 2+ Portfolio items (10 pts), Camera / Rigging / Equipment (5 pts) [SPEC: §19.2]
 * - Singers & Rappers: Performance video / Demo link (15 pts), Voice attributes (vocal range/texture) (10 pts), 1+ Portfolio photos (5 pts) [SPEC: §23]
 * - Dancers & Choreographers: Performance video (15 pts), Dance styles & dance attributes (10 pts), 1+ Portfolio photos (5 pts) [SPEC: §24]
 * - Direction & Writing: Portfolio sample / Showreel / Scripts (20 pts), Genre / Specialization (10 pts) [SPEC: §20]
 * - Production: Budget / Logistics / Capabilities (15 pts), Scale / Team experience (15 pts) [SPEC: §21.1]
 * - Editing & Post-Production: Technical software & tools (15 pts), Portfolio video / samples (15 pts) [SPEC: §21.2]
 * - Art, Costume, Hair & Make-Up: 5+ Portfolio samples (20 pts), Specialties & Design tools (10 pts) [SPEC: §22]
 * - Sound & Music / Composers: 2+ Work samples / audio/video links (15 pts), DAWs / Genres / Instruments (15 pts) [SPEC: §23]
 * - Voice Over & Presenters: Voice reel / Intro video (15 pts), Voice attributes (voice type / accent / studio) (15 pts) [SPEC: §25]
 * - General Open Talent / Fallback: Portfolio media (photos/videos) (20 pts), Physical specs or additional details (10 pts)
 */

export const PROFILE_COMPLETION_CONFIGS: Record<string, ProfessionCompletionConfig> = {
    "Actors": {
        key: "Actors",
        title: "Actors & On-Screen Talent",
        category: "open_talent",
        items: [
            { key: "basic_identity", label: "Basic Identity (Name & DOB)", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "First name, last name, DOB, and stage name" },
            { key: "profile_photo", label: "Main Profile Photo", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "Mandatory portrait profile photo" },
            { key: "bio_headline", label: "Bio & Headline", section: "bio", weight: 10, specOrigin: "SPEC_MANDATED", description: "Professional bio between 200 and 1,000 characters" },
            { key: "location", label: "Current City & Location", section: "location", weight: 10, specOrigin: "SPEC_MANDATED", description: "Base city for auditions and casting" },
            { key: "professional_identity", label: "Professional Hierarchy", section: "professional", weight: 10, specOrigin: "SPEC_MANDATED", description: "Primary profession and career stage" },
            { key: "skills_languages", label: "Skills & Languages", section: "skills_languages", weight: 10, specOrigin: "SPEC_MANDATED", description: "At least 1 acting skill and 1 language" },
            { key: "experience_credits", label: "Work Experience / Credits", section: "experience", weight: 10, specOrigin: "SPEC_MANDATED", description: "At least 1 film/TV/commercial credit or experience entry" },
            { key: "headshot_photos", label: "Headshot / Portfolio Photos", section: "portfolio", weight: 10, specOrigin: "SPEC_MANDATED", description: "Close-up / mid-shot headshot photos" },
            { key: "intro_video", label: "Intro Video", section: "portfolio", weight: 10, specOrigin: "SPEC_MANDATED", description: "Introduction video (up to 90 seconds)" },
            { key: "physical_specs", label: "Physical Specs (Height/Measurements)", section: "profession_specific", weight: 10, specOrigin: "SPEC_MANDATED", description: "Height in cm (and guardian details if minor)" }
        ]
    },
    "Models": {
        key: "Models",
        title: "Fashion & Commercial Models",
        category: "open_talent",
        items: [
            { key: "basic_identity", label: "Basic Identity (Name & DOB)", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "First name, last name, DOB" },
            { key: "profile_photo", label: "Main Profile Photo", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "Mandatory portrait profile photo" },
            { key: "bio_headline", label: "Bio & Headline", section: "bio", weight: 10, specOrigin: "SPEC_MANDATED", description: "Professional bio between 200 and 1,000 characters" },
            { key: "location", label: "Current City & Location", section: "location", weight: 10, specOrigin: "SPEC_MANDATED", description: "Base city" },
            { key: "professional_identity", label: "Professional Hierarchy", section: "professional", weight: 10, specOrigin: "SPEC_MANDATED", description: "Model type / career stage" },
            { key: "skills_languages", label: "Skills & Languages", section: "skills_languages", weight: 10, specOrigin: "SPEC_MANDATED", description: "Skills and languages" },
            { key: "experience_credits", label: "Work Experience / Credits", section: "experience", weight: 10, specOrigin: "SPEC_MANDATED", description: "Past runway/brand/print credits" },
            { key: "portfolio_photos", label: "Model Portfolio (Headshot, Mid, Full)", section: "portfolio", weight: 15, specOrigin: "SPEC_MANDATED", description: "Minimum 3 photos (headshot, mid-shot, full-length)" },
            { key: "physical_specs", label: "Height & Physical Measurements", section: "profession_specific", weight: 15, specOrigin: "SPEC_MANDATED", description: "Mandatory height and body measurements" }
        ]
    },
    "Photographers (non-wedding)": {
        key: "Photographers (non-wedding)",
        title: "Photographers (Non-Wedding)",
        category: "open_talent",
        items: [
            { key: "basic_identity", label: "Basic Identity", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "First name, last name" },
            { key: "profile_photo", label: "Profile Photo", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "Profile photo" },
            { key: "bio_headline", label: "Bio & Headline", section: "bio", weight: 10, specOrigin: "SPEC_MANDATED", description: "Professional bio between 200 and 1,000 characters" },
            { key: "location", label: "Current City & Location", section: "location", weight: 10, specOrigin: "SPEC_MANDATED", description: "Base city" },
            { key: "professional_identity", label: "Professional Hierarchy", section: "professional", weight: 10, specOrigin: "SPEC_MANDATED", description: "Specialization and career stage" },
            { key: "skills_languages", label: "Skills & Languages", section: "skills_languages", weight: 10, specOrigin: "SPEC_MANDATED", description: "Photography skills, software & languages" },
            { key: "experience_credits", label: "Work Experience / Credits", section: "experience", weight: 10, specOrigin: "SPEC_MANDATED", description: "Past shoot/brand credits" },
            { key: "portfolio_photos", label: "Portfolio Samples (Minimum 8)", section: "portfolio", weight: 20, specOrigin: "SPEC_MANDATED", description: "Minimum 8 categorized portfolio images" },
            { key: "equipment_genres", label: "Equipment Access & Genres", section: "profession_specific", weight: 10, specOrigin: "SPEC_MANDATED", description: "Camera equipment access and photography genres" }
        ]
    },
    "Cinematographers": {
        key: "Cinematographers",
        title: "Cinematographers & DPs",
        category: "open_talent",
        items: [
            { key: "basic_identity", label: "Basic Identity", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "First name, last name" },
            { key: "profile_photo", label: "Profile Photo", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "Profile photo" },
            { key: "bio_headline", label: "Bio & Headline", section: "bio", weight: 10, specOrigin: "SPEC_MANDATED", description: "Professional bio between 200 and 1,000 characters" },
            { key: "location", label: "Current City & Location", section: "location", weight: 10, specOrigin: "SPEC_MANDATED", description: "Base city" },
            { key: "professional_identity", label: "Professional Hierarchy", section: "professional", weight: 10, specOrigin: "SPEC_MANDATED", description: "Cinematography designation & specialization" },
            { key: "skills_languages", label: "Skills & Languages", section: "skills_languages", weight: 10, specOrigin: "SPEC_MANDATED", description: "Camera/lighting skills and languages" },
            { key: "experience_credits", label: "Work Experience / Credits", section: "experience", weight: 10, specOrigin: "SPEC_MANDATED", description: "Feature/commercial/OTT credits" },
            { key: "showreel", label: "Showreel / Video Reel", section: "portfolio", weight: 15, specOrigin: "SPEC_MANDATED", description: "Showreel video or video portfolio item" },
            { key: "portfolio_photos", label: "Portfolio Stills / Frames", section: "portfolio", weight: 10, specOrigin: "SYSTEM_STANDARD", description: "At least 2 visual portfolio frame stills" },
            { key: "camera_gear", label: "Camera Kits & Rigging Knowledge", section: "profession_specific", weight: 5, specOrigin: "SPEC_MANDATED", description: "Camera systems and lighting/movement competencies" }
        ]
    },
    "Singers & Rappers": {
        key: "Singers & Rappers",
        title: "Singers & Rappers",
        category: "open_talent",
        items: [
            { key: "basic_identity", label: "Basic Identity", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "First name, last name" },
            { key: "profile_photo", label: "Profile Photo", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "Profile photo" },
            { key: "bio_headline", label: "Bio & Headline", section: "bio", weight: 10, specOrigin: "SPEC_MANDATED", description: "Professional bio between 200 and 1,000 characters" },
            { key: "location", label: "Current City & Location", section: "location", weight: 10, specOrigin: "SPEC_MANDATED", description: "Base city" },
            { key: "professional_identity", label: "Professional Hierarchy", section: "professional", weight: 10, specOrigin: "SPEC_MANDATED", description: "Vocal designation & genres" },
            { key: "skills_languages", label: "Skills & Languages", section: "skills_languages", weight: 10, specOrigin: "SPEC_MANDATED", description: "Vocal skills and singing languages" },
            { key: "experience_credits", label: "Work Experience / Credits", section: "experience", weight: 10, specOrigin: "SPEC_MANDATED", description: "Song/album/gig credits" },
            { key: "performance_video", label: "Performance Video / Demo Reel", section: "portfolio", weight: 15, specOrigin: "SPEC_MANDATED", description: "Performance video clip or showreel" },
            { key: "voice_attributes", label: "Voice Attributes (Range & Texture)", section: "profession_specific", weight: 10, specOrigin: "SPEC_MANDATED", description: "Vocal range, texture, and delivery" },
            { key: "portfolio_photos", label: "Artist Photos", section: "portfolio", weight: 5, specOrigin: "SYSTEM_STANDARD", description: "At least 1 artist press/stage photo" }
        ]
    },
    "Dancers": {
        key: "Dancers",
        title: "Dancers & Performers",
        category: "open_talent",
        items: [
            { key: "basic_identity", label: "Basic Identity", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "First name, last name" },
            { key: "profile_photo", label: "Profile Photo", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "Profile photo" },
            { key: "bio_headline", label: "Bio & Headline", section: "bio", weight: 10, specOrigin: "SPEC_MANDATED", description: "Professional bio between 200 and 1,000 characters" },
            { key: "location", label: "Current City & Location", section: "location", weight: 10, specOrigin: "SPEC_MANDATED", description: "Base city" },
            { key: "professional_identity", label: "Professional Hierarchy", section: "professional", weight: 10, specOrigin: "SPEC_MANDATED", description: "Dance category & stage" },
            { key: "skills_languages", label: "Skills & Languages", section: "skills_languages", weight: 10, specOrigin: "SPEC_MANDATED", description: "Dance skills and languages" },
            { key: "experience_credits", label: "Work Experience / Credits", section: "experience", weight: 10, specOrigin: "SPEC_MANDATED", description: "Performance credits" },
            { key: "performance_video", label: "Dance Performance Video", section: "portfolio", weight: 15, specOrigin: "SPEC_MANDATED", description: "Video clip of dance performance or choreography" },
            { key: "dance_styles", label: "Dance Styles & Specializations", section: "profession_specific", weight: 10, specOrigin: "SPEC_MANDATED", description: "Dance styles (Classical, Bollywood, Contemporary, etc.)" },
            { key: "portfolio_photos", label: "Dance Action Stills", section: "portfolio", weight: 5, specOrigin: "SYSTEM_STANDARD", description: "At least 1 dance action photo" }
        ]
    },
    "Choreographers": {
        key: "Choreographers",
        title: "Choreographers",
        category: "open_talent",
        items: [
            { key: "basic_identity", label: "Basic Identity", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "First name, last name" },
            { key: "profile_photo", label: "Profile Photo", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "Profile photo" },
            { key: "bio_headline", label: "Bio & Headline", section: "bio", weight: 10, specOrigin: "SPEC_MANDATED", description: "Professional bio between 200 and 1,000 characters" },
            { key: "location", label: "Current City & Location", section: "location", weight: 10, specOrigin: "SPEC_MANDATED", description: "Base city" },
            { key: "professional_identity", label: "Professional Hierarchy", section: "professional", weight: 10, specOrigin: "SPEC_MANDATED", description: "Choreography designation & stage" },
            { key: "skills_languages", label: "Skills & Languages", section: "skills_languages", weight: 10, specOrigin: "SPEC_MANDATED", description: "Choreography skills and languages" },
            { key: "experience_credits", label: "Work Experience / Credits", section: "experience", weight: 10, specOrigin: "SPEC_MANDATED", description: "Choreography work credits" },
            { key: "performance_video", label: "Choreography Showreel / Video", section: "portfolio", weight: 15, specOrigin: "SPEC_MANDATED", description: "Video reel of choreographed projects" },
            { key: "dance_styles", label: "Styles & Choreography Credits", section: "profession_specific", weight: 10, specOrigin: "SPEC_MANDATED", description: "Dance styles and notable choreo credits" },
            { key: "portfolio_photos", label: "Production / Rehearsal Photos", section: "portfolio", weight: 5, specOrigin: "SYSTEM_STANDARD", description: "At least 1 on-set / rehearsal photo" }
        ]
    },
    "Art Directors": {
        key: "Art Directors",
        title: "Art Directors & Production Designers",
        category: "open_talent",
        items: [
            { key: "basic_identity", label: "Basic Identity", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "First name, last name" },
            { key: "profile_photo", label: "Profile Photo", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "Profile photo" },
            { key: "bio_headline", label: "Bio & Headline", section: "bio", weight: 10, specOrigin: "SPEC_MANDATED", description: "Professional bio between 200 and 1,000 characters" },
            { key: "location", label: "Current City & Location", section: "location", weight: 10, specOrigin: "SPEC_MANDATED", description: "Base city" },
            { key: "professional_identity", label: "Professional Hierarchy", section: "professional", weight: 10, specOrigin: "SPEC_MANDATED", description: "Art direction designation & stage" },
            { key: "skills_languages", label: "Skills & Languages", section: "skills_languages", weight: 10, specOrigin: "SPEC_MANDATED", description: "Set design/art skills and languages" },
            { key: "experience_credits", label: "Work Experience / Credits", section: "experience", weight: 10, specOrigin: "SPEC_MANDATED", description: "Past art direction credits" },
            { key: "portfolio_samples", label: "Art Portfolio Samples (Min 5)", section: "portfolio", weight: 20, specOrigin: "SPEC_MANDATED", description: "At least 5 set/prop/design work samples" },
            { key: "design_tools", label: "Design Tools & Portfolio Link", section: "profession_specific", weight: 10, specOrigin: "SPEC_MANDATED", description: "Software proficiencies & external portfolio link" }
        ]
    },
    "Composers": {
        key: "Composers",
        title: "Music Composers & Directors",
        category: "open_talent",
        items: [
            { key: "basic_identity", label: "Basic Identity", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "First name, last name" },
            { key: "profile_photo", label: "Profile Photo", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "Profile photo" },
            { key: "bio_headline", label: "Bio & Headline", section: "bio", weight: 10, specOrigin: "SPEC_MANDATED", description: "Professional bio between 200 and 1,000 characters" },
            { key: "location", label: "Current City & Location", section: "location", weight: 10, specOrigin: "SPEC_MANDATED", description: "Base city" },
            { key: "professional_identity", label: "Professional Hierarchy", section: "professional", weight: 10, specOrigin: "SPEC_MANDATED", description: "Music direction & composition role" },
            { key: "skills_languages", label: "Skills & Languages", section: "skills_languages", weight: 10, specOrigin: "SPEC_MANDATED", description: "Composition skills and languages" },
            { key: "experience_credits", label: "Work Experience / Credits", section: "experience", weight: 10, specOrigin: "SPEC_MANDATED", description: "Film/OTT/commercial music credits" },
            { key: "work_samples", label: "Work Samples / Video Reels (Min 2)", section: "portfolio", weight: 15, specOrigin: "SPEC_MANDATED", description: "At least 2 composed tracks, video reels, or project links" },
            { key: "daws_genres", label: "DAWs, Instruments & Genres", section: "profession_specific", weight: 15, specOrigin: "SPEC_MANDATED", description: "Digital audio workstations (Logic, Pro Tools, etc.) & genres" }
        ]
    },
    "Make-Up Artists": {
        key: "Make-Up Artists",
        title: "Make-Up & Prosthetic Artists",
        category: "open_talent",
        items: [
            { key: "basic_identity", label: "Basic Identity", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "First name, last name" },
            { key: "profile_photo", label: "Profile Photo", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "Profile photo" },
            { key: "bio_headline", label: "Bio & Headline", section: "bio", weight: 10, specOrigin: "SPEC_MANDATED", description: "Professional bio between 200 and 1,000 characters" },
            { key: "location", label: "Current City & Location", section: "location", weight: 10, specOrigin: "SPEC_MANDATED", description: "Base city" },
            { key: "professional_identity", label: "Professional Hierarchy", section: "professional", weight: 10, specOrigin: "SPEC_MANDATED", description: "Make-up designation & stage" },
            { key: "skills_languages", label: "Skills & Languages", section: "skills_languages", weight: 10, specOrigin: "SPEC_MANDATED", description: "Make-up techniques and languages" },
            { key: "experience_credits", label: "Work Experience / Credits", section: "experience", weight: 10, specOrigin: "SPEC_MANDATED", description: "Film/shoot make-up credits" },
            { key: "portfolio_photos", label: "Looks Portfolio (Minimum 5)", section: "portfolio", weight: 20, specOrigin: "SPEC_MANDATED", description: "At least 5 make-up/hair lookbook samples" },
            { key: "specialties", label: "Specialties & Techniques", section: "profession_specific", weight: 10, specOrigin: "SPEC_MANDATED", description: "SFX, bridal, period, or contemporary specialties" }
        ]
    },
    "voice_over": {
        key: "voice_over",
        title: "Voice-Over Artists & Anchors",
        category: "voice_over",
        items: [
            { key: "basic_identity", label: "Basic Identity", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "First name, last name" },
            { key: "profile_photo", label: "Profile Photo", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "Profile photo" },
            { key: "bio_headline", label: "Bio & Headline", section: "bio", weight: 10, specOrigin: "SPEC_MANDATED", description: "Professional bio between 200 and 1,000 characters" },
            { key: "location", label: "Current City & Location", section: "location", weight: 10, specOrigin: "SPEC_MANDATED", description: "Base city" },
            { key: "professional_identity", label: "Professional Hierarchy", section: "professional", weight: 10, specOrigin: "SPEC_MANDATED", description: "Voice role designation" },
            { key: "skills_languages", label: "Skills & Languages", section: "skills_languages", weight: 10, specOrigin: "SPEC_MANDATED", description: "Voice delivery skills and languages" },
            { key: "experience_credits", label: "Work Experience / Credits", section: "experience", weight: 10, specOrigin: "SPEC_MANDATED", description: "Dubbing / voice-over credits" },
            { key: "voice_reel", label: "Voice Reel / Demo Video", section: "portfolio", weight: 15, specOrigin: "SPEC_MANDATED", description: "Audio/video demo reel" },
            { key: "voice_attributes", label: "Voice Attributes & Studio Setup", section: "profession_specific", weight: 15, specOrigin: "SPEC_MANDATED", description: "Vocal range, tone, accents, and home studio status" }
        ]
    },
    "crew_and_production": {
        key: "crew_and_production",
        title: "Crew & Production Technicians",
        category: "crew_and_production",
        items: [
            { key: "basic_identity", label: "Basic Identity", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "First name, last name" },
            { key: "profile_photo", label: "Profile Photo", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "Profile photo" },
            { key: "bio_headline", label: "Bio & Headline", section: "bio", weight: 10, specOrigin: "SPEC_MANDATED", description: "Professional bio between 200 and 1,000 characters" },
            { key: "location", label: "Current City & Location", section: "location", weight: 10, specOrigin: "SPEC_MANDATED", description: "Base city" },
            { key: "professional_identity", label: "Department & Designation", section: "professional", weight: 10, specOrigin: "SPEC_MANDATED", description: "Primary department and designation" },
            { key: "skills_languages", label: "Skills & Languages", section: "skills_languages", weight: 10, specOrigin: "SPEC_MANDATED", description: "Technical skills and languages" },
            { key: "experience_credits", label: "Work Experience / Credits", section: "experience", weight: 10, specOrigin: "SPEC_MANDATED", description: "Production / shoot credits" },
            { key: "portfolio_media", label: "Work Portfolio / Samples", section: "portfolio", weight: 15, specOrigin: "SPEC_MANDATED", description: "Portfolio photos or project links" },
            { key: "crew_attributes", label: "Equipment & Production Expertise", section: "profession_specific", weight: 15, specOrigin: "SPEC_MANDATED", description: "Equipment familiarity, budget/scale experience" }
        ]
    },
    "default": {
        key: "default",
        title: "Standard Creative Professional",
        category: "open_talent",
        items: [
            { key: "basic_identity", label: "Basic Identity", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "First name, last name" },
            { key: "profile_photo", label: "Profile Photo", section: "identity", weight: 10, specOrigin: "SPEC_MANDATED", description: "Mandatory profile photo" },
            { key: "bio_headline", label: "Bio & Headline", section: "bio", weight: 10, specOrigin: "SPEC_MANDATED", description: "Professional bio between 200 and 1,000 characters" },
            { key: "location", label: "Current City & Location", section: "location", weight: 10, specOrigin: "SPEC_MANDATED", description: "Base city" },
            { key: "professional_identity", label: "Professional Hierarchy", section: "professional", weight: 10, specOrigin: "SPEC_MANDATED", description: "Category & primary profession" },
            { key: "skills_languages", label: "Skills & Languages", section: "skills_languages", weight: 10, specOrigin: "SPEC_MANDATED", description: "Key skills and languages" },
            { key: "experience_credits", label: "Work Experience / Credits", section: "experience", weight: 10, specOrigin: "SPEC_MANDATED", description: "Past work credits or experience" },
            { key: "portfolio_media", label: "Portfolio Media (Photo or Video)", section: "portfolio", weight: 15, specOrigin: "SPEC_MANDATED", description: "At least 1 portfolio media sample" },
            { key: "profession_details", label: "Professional Details / Attributes", section: "profession_specific", weight: 15, specOrigin: "SYSTEM_STANDARD", description: "Physical attributes, equipment, or portfolio showreel" }
        ]
    }
};

/**
 * Helper to retrieve the matching completion config for any profile
 */
export const getProfessionCompletionConfig = (profession?: string | null, category?: string | null): ProfessionCompletionConfig => {
    // 1. Direct match on profession name
    if (profession) {
        const profTrim = profession.trim().toLowerCase();
        for (const [key, config] of Object.entries(PROFILE_COMPLETION_CONFIGS)) {
            if (key.toLowerCase() === profTrim) {
                return config;
            }
        }
    }

    // 2. Direct match on category
    if (category) {
        const catTrim = category.trim().toLowerCase();
        if (catTrim === "voice_over" && PROFILE_COMPLETION_CONFIGS["voice_over"]) {
            return PROFILE_COMPLETION_CONFIGS["voice_over"];
        }
        if (catTrim === "crew_and_production" && PROFILE_COMPLETION_CONFIGS["crew_and_production"]) {
            return PROFILE_COMPLETION_CONFIGS["crew_and_production"];
        }
    }

    // 3. Fallback
    return PROFILE_COMPLETION_CONFIGS["default"];
};
