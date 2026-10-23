import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IOffice {
    _id?: Types.ObjectId;
    officeName?: string;
    city?: string;
    state?: string;
    country: string;
    address?: string;
    isHeadquarters: boolean;
}

export interface IProjectExperience {
    _id?: Types.ObjectId;
    title: string;
    projectType?: string;
    year?: number;
    description?: string;
    referenceLink?: string;
}

export interface IPortfolioCaseStudy {
    _id?: Types.ObjectId;
    title: string;
    client?: string;
    description?: string;
    mediaUrl?: string;
    caseStudyUrl?: string;
}

export interface IVerificationDoc {
    _id?: Types.ObjectId;
    docType?: string;
    docCategory: "business_registration" | "tax_gst" | "professional_proof" | "other";
    fileUrl?: string;
    status: "pending" | "verified" | "rejected";
    submittedAt: Date;
    reviewedAt?: Date;
    reviewNotes?: string;
}

export interface IOrganization extends Document {
    userId: Types.ObjectId;
    organizationName: string;
    legalBusinessName?: string;
    slug?: string;
    verificationState: "pending" | "verified" | "rejected" | "more_info_needed";
    status?: "pending" | "active" | "suspended" | "rejected";
    cinNumber?: string;
    registrationNumber?: string;
    gstNumber?: string;
    isGstExempt?: boolean;
    gstExemptionReason?: string;
    organizationType?: string;
    description?: string;
    website?: string;
    contactNumber?: string;
    address?: string;
    responsiblePerson?: {
        name?: string;
        designation?: string;
        email?: string;
        phone?: string;
    };
    location?: {
        country: string;
        state?: string;
        city?: string;
        postalCode?: string;
        address?: string;
    };
    offices: IOffice[];
    experienceAndProjects: IProjectExperience[];
    portfolioCaseStudies: IPortfolioCaseStudy[];
    teamSize?: "1-10" | "11-50" | "51-200" | "201-500" | "500+" | "";
    services: string[];
    verificationStatus: {
        businessVerified: boolean;
        identityVerified: boolean;
        professionalVerified: boolean;
    };
    verificationDocuments: IVerificationDoc[];
    logoUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

const officeSchema = new Schema<IOffice>({
    officeName: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, default: "India", trim: true },
    address: { type: String, trim: true },
    isHeadquarters: { type: Boolean, default: false }
}, { _id: true });

const projectExperienceSchema = new Schema<IProjectExperience>({
    title: { type: String, required: true, trim: true },
    projectType: { type: String, trim: true },
    year: { type: Number },
    description: { type: String, trim: true },
    referenceLink: { type: String, trim: true }
}, { _id: true });

const portfolioCaseStudySchema = new Schema<IPortfolioCaseStudy>({
    title: { type: String, required: true, trim: true },
    client: { type: String, trim: true },
    description: { type: String, trim: true },
    mediaUrl: { type: String, trim: true },
    caseStudyUrl: { type: String, trim: true }
}, { _id: true });

const verificationDocSchema = new Schema<IVerificationDoc>({
    docType: { type: String, trim: true },
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

const organizationSchema = new Schema<IOrganization>(
    {
        userId: {
            type: Schema.Types.ObjectId,
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

        status: {
            type: String,
            enum: ["pending", "active", "suspended", "rejected"],
            default: "pending"
        },

        cinNumber: {
            type: String,
            trim: true
        },

        registrationNumber: {
            type: String,
            trim: true
        },

        gstNumber: {
            type: String,
            trim: true
        },

        isGstExempt: {
            type: Boolean,
            default: false
        },

        gstExemptionReason: {
            type: String,
            trim: true
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

        responsiblePerson: {
            name: { type: String, trim: true },
            designation: { type: String, trim: true },
            email: { type: String, trim: true },
            phone: { type: String, trim: true }
        },

        location: {
            country: { type: String, default: "India", trim: true },
            state: { type: String, trim: true },
            city: { type: String, trim: true },
            postalCode: { type: String, trim: true },
            address: { type: String, trim: true }
        },

        offices: [officeSchema],
        experienceAndProjects: [projectExperienceSchema],
        portfolioCaseStudies: [portfolioCaseStudySchema],

        teamSize: {
            type: String,
            enum: ["1-10", "11-50", "51-200", "201-500", "500+", ""],
            default: ""
        },

        services: [{ type: String, trim: true }],

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

export const Organization: Model<IOrganization> = mongoose.model<IOrganization>("Organization", organizationSchema);
export default Organization;
