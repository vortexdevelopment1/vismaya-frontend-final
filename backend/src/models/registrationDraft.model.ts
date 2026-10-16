import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRegistrationDraft extends Document {
    email: string;
    role: "talent" | "organization";
    currentStep: number;
    formData: Record<string, unknown>;
    tokenHash?: string;
    isPaid: boolean;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const registrationDraftSchema = new Schema<IRegistrationDraft>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        role: {
            type: String,
            enum: ["talent", "organization"],
            required: true
        },
        currentStep: {
            type: Number,
            default: 1,
            min: 1
        },
        formData: {
            type: Schema.Types.Mixed,
            default: {}
        },
        tokenHash: {
            type: String,
            select: false,
            index: true
        },
        isPaid: {
            type: Boolean,
            default: false
        },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days retention
            index: { expires: 0 }
        }
    },
    {
        timestamps: true
    }
);

export const RegistrationDraft: Model<IRegistrationDraft> = mongoose.model<IRegistrationDraft>("RegistrationDraft", registrationDraftSchema);
export default RegistrationDraft;
