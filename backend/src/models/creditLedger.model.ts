import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICreditLedger extends Document {
    organizationId: Types.ObjectId;
    includedCredits: number;
    purchasedCredits: number;
    consumedCredits: number;
    balance: number;
    lastTransactionAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const creditLedgerSchema = new Schema<ICreditLedger>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            unique: true
        },

        includedCredits: {
            type: Number,
            default: 100,
            min: 0
        },

        purchasedCredits: {
            type: Number,
            default: 0,
            min: 0
        },

        consumedCredits: {
            type: Number,
            default: 0,
            min: 0
        },

        balance: {
            type: Number,
            default: 100,
            min: 0
        },

        lastTransactionAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

export const CreditLedger: Model<ICreditLedger> = mongoose.model<ICreditLedger>("CreditLedger", creditLedgerSchema);
export default CreditLedger;
