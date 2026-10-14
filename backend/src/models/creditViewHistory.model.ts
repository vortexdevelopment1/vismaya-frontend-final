import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICreditViewHistory extends Document {
    organizationId: Types.ObjectId;
    talentId: Types.ObjectId;
    firstViewedAt: Date;
    lastViewedAt: Date;
    exemptionExpiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const creditViewHistorySchema = new Schema<ICreditViewHistory>(
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

        firstViewedAt: {
            type: Date,
            default: Date.now
        },

        lastViewedAt: {
            type: Date,
            default: Date.now
        },

        exemptionExpiresAt: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
);

creditViewHistorySchema.index({ organizationId: 1, talentId: 1 }, { unique: true });
creditViewHistorySchema.index({ exemptionExpiresAt: 1 });

export const CreditViewHistory: Model<ICreditViewHistory> = mongoose.model<ICreditViewHistory>("CreditViewHistory", creditViewHistorySchema);
export default CreditViewHistory;
