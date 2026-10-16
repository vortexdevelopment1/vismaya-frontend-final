import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ITalentViewEvent extends Document {
    talentId: Types.ObjectId;
    viewerId?: Types.ObjectId;
    viewerRole: "talent" | "organization" | "guest" | "admin";
    isFullProfile: boolean;
    createdAt: Date;
}

const talentViewEventSchema = new Schema<ITalentViewEvent>(
    {
        talentId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        viewerId: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },

        viewerRole: {
            type: String,
            enum: ["talent", "organization", "guest", "admin"],
            default: "guest"
        },

        isFullProfile: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: { createdAt: true, updatedAt: false }
    }
);

talentViewEventSchema.index({ talentId: 1, createdAt: -1 });

export const TalentViewEvent: Model<ITalentViewEvent> = mongoose.model<ITalentViewEvent>("TalentViewEvent", talentViewEventSchema);
export default TalentViewEvent;
