import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IFavourite extends Document {
    organizationId: Types.ObjectId;
    talentId: Types.ObjectId;
    talentProfileId: Types.ObjectId;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

const favouriteSchema = new Schema<IFavourite>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true
        },

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

        tags: [{
            type: String,
            trim: true
        }]
    },
    {
        timestamps: true
    }
);

favouriteSchema.index({ organizationId: 1, talentId: 1 }, { unique: true });
favouriteSchema.index({ organizationId: 1, createdAt: -1 });

export const Favourite: Model<IFavourite> = mongoose.model<IFavourite>("Favourite", favouriteSchema);
export default Favourite;
