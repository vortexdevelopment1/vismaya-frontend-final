import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IUserConsent extends Document {
    userId: Types.ObjectId;
    policyType: "terms_and_conditions" | "privacy_policy" | "registration_consent" | "per_application_consent" | "guardian_consent" | "social_sharing_consent";
    policyVersion: string;
    isAccepted: boolean;
    acceptedAt: Date;
    ipAddress?: string;
    userAgent?: string;
    context?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const userConsentSchema = new Schema<IUserConsent>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        policyType: {
            type: String,
            enum: [
                "terms_and_conditions",
                "privacy_policy",
                "registration_consent",
                "per_application_consent",
                "guardian_consent",
                "social_sharing_consent"
            ],
            required: true,
            index: true
        },
        policyVersion: {
            type: String,
            required: true,
            default: "v2.0"
        },
        isAccepted: {
            type: Boolean,
            required: true,
            default: true
        },
        acceptedAt: {
            type: Date,
            default: Date.now,
            required: true
        },
        ipAddress: {
            type: String,
            trim: true
        },
        userAgent: {
            type: String,
            trim: true
        },
        context: {
            type: String,
            trim: true
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

userConsentSchema.index({ userId: 1, policyType: 1, policyVersion: 1 });

export const UserConsent: Model<IUserConsent> = mongoose.model<IUserConsent>("UserConsent", userConsentSchema);
export default UserConsent;
