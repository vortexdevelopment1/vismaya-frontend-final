import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICoupon extends Document {
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount?: number;
    applicablePackages: Array<"talent_annual_999" | "industry_annual_4999" | "credit_single_100" | "credit_bundle_25_2000">;
    userEligibility?: "all" | "limited";
    applicableUsers?: string[];
    maxUses: number;
    maxUsesPerUser?: number;
    currentUses: number;
    validFrom: Date;
    validUntil?: Date;
    isActive: boolean;
    createdBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },
        discountType: {
            type: String,
            enum: ["percentage", "fixed"],
            required: true
        },
        discountValue: {
            type: Number,
            required: true,
            min: 0
        },
        minOrderAmount: {
            type: Number,
            default: 0,
            min: 0
        },
        maxDiscountAmount: {
            type: Number,
            min: 0
        },
        applicablePackages: [{
            type: String,
            enum: [
                "talent_annual_999",
                "industry_annual_4999",
                "credit_single_100",
                "credit_bundle_25_2000"
            ]
        }],
        userEligibility: {
            type: String,
            enum: ["all", "limited"],
            default: "all"
        },
        applicableUsers: [{
            type: String,
            trim: true,
            lowercase: true
        }],
        maxUses: {
            type: Number,
            default: 100,
            min: 1
        },
        maxUsesPerUser: {
            type: Number,
            default: 1,
            min: 1
        },
        currentUses: {
            type: Number,
            default: 0,
            min: 0
        },
        validFrom: {
            type: Date,
            default: Date.now
        },
        validUntil: {
            type: Date
        },
        isActive: {
            type: Boolean,
            default: true
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

couponSchema.index({ code: 1, isActive: 1 });

export const Coupon: Model<ICoupon> = mongoose.model<ICoupon>("Coupon", couponSchema);
export default Coupon;
