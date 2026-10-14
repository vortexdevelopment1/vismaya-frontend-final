import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IIdentityData {
    idType?: "aadhaar" | "passport" | "driving_license" | "voter_id" | "pan";
    idNumber?: string;
    documentFrontUrl?: string;
    documentBackUrl?: string;
    selfiePhotoUrl?: string;
}

export interface IProfessionalData {
    creditsLinks: string[];
    guildOrUnionName?: string;
    guildMembershipNumber?: string;
    supportingDocumentUrls: string[];
}

export interface IBusinessData {
    businessRegType?: "cin" | "gstin" | "llpin" | "trade_license" | "udyam" | "other";
    businessRegNumber?: string;
    legalEntityName?: string;
    documentUrl?: string;
}

export interface IVerification extends Document {
    userId: Types.ObjectId;
    verificationType: "identity" | "professional" | "organization_business";
    identityData?: IIdentityData;
    professionalData?: IProfessionalData;
    businessData?: IBusinessData;
    status: "pending" | "verified" | "rejected" | "suspended";
    rejectionReason?: string;
    moreInfoRequested: boolean;
    moreInfoNotes?: string;
    reviewedAt?: Date;
    reviewedBy?: Types.ObjectId;
    submittedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const verificationSchema = new Schema<IVerification>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        verificationType: {
            type: String,
            enum: [
                "identity",
                "professional",
                "organization_business"
            ],
            required: true
        },

        identityData: {
            idType: {
                type: String,
                enum: ["aadhaar", "passport", "driving_license", "voter_id", "pan"]
            },
            idNumber: { type: String, trim: true },
            documentFrontUrl: { type: String, trim: true },
            documentBackUrl: { type: String, trim: true },
            selfiePhotoUrl: { type: String, trim: true }
        },

        professionalData: {
            creditsLinks: [{ type: String, trim: true }],
            guildOrUnionName: { type: String, trim: true },
            guildMembershipNumber: { type: String, trim: true },
            supportingDocumentUrls: [{ type: String, trim: true }]
        },

        businessData: {
            businessRegType: {
                type: String,
                enum: ["cin", "gstin", "llpin", "trade_license", "udyam", "other"]
            },
            businessRegNumber: { type: String, trim: true },
            legalEntityName: { type: String, trim: true },
            documentUrl: { type: String, trim: true }
        },

        status: {
            type: String,
            enum: [
                "pending",
                "verified",
                "rejected",
                "suspended"
            ],
            default: "pending"
        },

        rejectionReason: {
            type: String,
            trim: true
        },

        moreInfoRequested: {
            type: Boolean,
            default: false
        },

        moreInfoNotes: {
            type: String,
            trim: true
        },

        reviewedAt: {
            type: Date
        },

        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },

        submittedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

verificationSchema.index({ userId: 1, verificationType: 1 }, { unique: true });
verificationSchema.index({ status: 1, createdAt: -1 });

export const Verification: Model<IVerification> = mongoose.model<IVerification>("Verification", verificationSchema);
export default Verification;
