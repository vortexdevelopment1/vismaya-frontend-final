const mongoose = require("mongoose");

const officeSchema = new mongoose.Schema({
    officeName: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, default: "India", trim: true },
    address: { type: String, trim: true },
    isHeadquarters: { type: Boolean, default: false }
}, { _id: true });

const projectExperienceSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    projectType: { type: String, trim: true },
    year: { type: Number },
    description: { type: String, trim: true },
    referenceLink: { type: String, trim: true }
}, { _id: true });

const portfolioCaseStudySchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    client: { type: String, trim: true },
    description: { type: String, trim: true },
    mediaUrl: { type: String, trim: true },
    caseStudyUrl: { type: String, trim: true }
}, { _id: true });

const verificationDocSchema = new mongoose.Schema({
    docType: { type: String, trim: true }, // e.g. "business_registration", "gst_cert", "identity_doc"
    docCategory: {
        type: String,
        enum: ["business_registration", "tax_gst", "professional_proof", "other"],
        default: "business_registration"
    },
    fileUrl: { type: String, trim: true },
    status: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        default: "pending"
    },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewNotes: { type: String, trim: true }
}, { _id: true });

const organizationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        organizationName: {
            type: String,
            required: true,
            trim: true
        },

        legalBusinessName: {
            type: String,
            trim: true
        },

        slug: {
            type: String,
            trim: true,
            unique: true,
            sparse: true
        },

        verificationState: {
            type: String,
            enum: ["pending", "verified", "rejected", "more_info_needed"],
            default: "pending"
        },

        organizationType: {
            type: String,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        website: {
            type: String,
            trim: true
        },

        contactNumber: {
            type: String,
            trim: true
        },

        address: {
            type: String,
            trim: true
        },

        // Responsible person
        responsiblePerson: {
            name: { type: String, trim: true },
            designation: { type: String, trim: true },
            email: { type: String, trim: true },
            phone: { type: String, trim: true }
        },

        // Detailed location
        location: {
            country: { type: String, default: "India", trim: true },
            state: { type: String, trim: true },
            city: { type: String, trim: true },
            postalCode: { type: String, trim: true },
            address: { type: String, trim: true }
        },

        // Multiple offices
        offices: [officeSchema],

        // Experience, Projects, and Credits
        experienceAndProjects: [projectExperienceSchema],

        // Portfolio and Case Studies
        portfolioCaseStudies: [portfolioCaseStudySchema],

        // Team Size & Dynamic Services
        teamSize: {
            type: String,
            enum: ["1-10", "11-50", "51-200", "201-500", "500+", ""],
            default: ""
        },

        services: [{ type: String, trim: true }],

        // Verification Statuses & Documents
        verificationStatus: {
            businessVerified: { type: Boolean, default: false },
            identityVerified: { type: Boolean, default: false },
            professionalVerified: { type: Boolean, default: false }
        },

        verificationDocuments: [verificationDocSchema],

        logoUrl: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

organizationSchema.index({ organizationName: 1 });
organizationSchema.index({ "location.city": 1, organizationType: 1 });

const Organization = mongoose.model("Organization", organizationSchema);

module.exports = Organization;