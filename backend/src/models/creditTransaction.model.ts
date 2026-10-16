import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICreditTransaction extends Document {
    organizationId: Types.ObjectId;
    type: "registration_bonus" | "purchase" | "profile_view_deduction" | "admin_adjustment";
    amount: number;
    balanceAfter: number;
    talentId?: Types.ObjectId;
    description?: string;
    adminId?: Types.ObjectId;
    paymentTransactionId?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const creditTransactionSchema = new Schema<ICreditTransaction>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true
        },

        type: {
            type: String,
            enum: [
                "registration_bonus",
                "purchase",
                "profile_view_deduction",
                "admin_adjustment"
            ],
            required: true
        },

        amount: {
            type: Number,
            required: true
        },

        balanceAfter: {
            type: Number,
            required: true
        },

        talentId: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },

        description: {
            type: String,
            trim: true
        },

        adminId: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },

        paymentTransactionId: {
            type: Schema.Types.ObjectId,
            ref: "PaymentTransaction"
        }
    },
    {
        timestamps: true
    }
);

creditTransactionSchema.index({ organizationId: 1, createdAt: -1 });

export const CreditTransaction: Model<ICreditTransaction> = mongoose.model<ICreditTransaction>("CreditTransaction", creditTransactionSchema);
export default CreditTransaction;
