import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPaymentTransaction extends Document {
    userId: Types.ObjectId;
    organizationId?: Types.ObjectId;
    packageType: "talent_annual_999" | "industry_annual_4999" | "credit_single_100" | "credit_bundle_25_2000";
    amount: number;
    originalAmount?: number;
    discountAmount: number;
    couponCode?: string;
    currency: string;
    orderId: string;
    paymentId?: string;
    signature?: string;
    status: "created" | "attempted" | "successful" | "failed" | "refunded";
    paymentGateway: string;
    gatewayResponse?: Record<string, unknown>;
    creditsAwarded: number;
    invoiceNumber?: string;
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const paymentTransactionSchema = new Schema<IPaymentTransaction>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization"
        },

        packageType: {
            type: String,
            enum: [
                "talent_annual_999",
                "industry_annual_4999",
                "credit_single_100",
                "credit_bundle_25_2000"
            ],
            required: true
        },

        amount: {
            type: Number,
            required: true
        },

        originalAmount: {
            type: Number
        },

        discountAmount: {
            type: Number,
            default: 0
        },

        couponCode: {
            type: String,
            trim: true,
            uppercase: true
        },

        currency: {
            type: String,
            default: "INR"
        },

        orderId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        paymentId: {
            type: String,
            trim: true,
            sparse: true
        },

        signature: {
            type: String,
            trim: true
        },

        status: {
            type: String,
            enum: [
                "created",
                "attempted",
                "successful",
                "failed",
                "refunded"
            ],
            default: "created"
        },

        paymentGateway: {
            type: String,
            default: "razorpay"
        },

        gatewayResponse: {
            type: Schema.Types.Mixed
        },

        creditsAwarded: {
            type: Number,
            default: 0
        },

        invoiceNumber: {
            type: String,
            trim: true,
            sparse: true
        },

        paidAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

paymentTransactionSchema.index({ userId: 1, createdAt: -1 });
paymentTransactionSchema.index({ status: 1, createdAt: -1 });

export const PaymentTransaction: Model<IPaymentTransaction> = mongoose.model<IPaymentTransaction>("PaymentTransaction", paymentTransactionSchema);
export default PaymentTransaction;
