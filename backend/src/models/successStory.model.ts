import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISuccessStory extends Document {
    talentId: Types.ObjectId;
    talentProfileId: Types.ObjectId;
    applicationId?: Types.ObjectId;
    opportunityId?: Types.ObjectId;
    photoUrl: string;
    quote: string;
    talentName: string;
    roleOrProfession?: string;
    projectName?: string;
    organizationName?: string;
    externalSharingConsent: boolean;
    status: "pending" | "approved" | "rejected" | "archived";
    rejectionReason?: string;
    reviewedBy?: Types.ObjectId;
    reviewedAt?: Date;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

const successStorySchema = new Schema<ISuccessStory>(
    {
        talentId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        talentProfileId: {
            type: Schema.Types.ObjectId,
            ref: "TalentProfile",
            required: true
        },

        applicationId: {
            type: Schema.Types.ObjectId,
            ref: "Application"
        },

        opportunityId: {
            type: Schema.Types.ObjectId,
            ref: "Opportunity"
        },

        photoUrl: {
            type: String,
            required: true,
            trim: true
        },

        quote: {
            type: String,
            required: true,
            trim: true
        },

        talentName: {
            type: String,
            required: true,
            trim: true
        },

        roleOrProfession: {
            type: String,
            trim: true
        },

        projectName: {
            type: String,
            trim: true
        },

        organizationName: {
            type: String,
            trim: true
        },

        externalSharingConsent: {
            type: Boolean,
            default: false
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "archived"],
            default: "pending"
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

        displayOrder: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

successStorySchema.index({ status: 1, createdAt: -1 });

export const SuccessStory: Model<ISuccessStory> = mongoose.model<ISuccessStory>("SuccessStory", successStorySchema);
export default SuccessStory;
