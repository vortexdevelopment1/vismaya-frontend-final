const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
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
        maxUses: {
            type: Number,
            default: 100,
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
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

couponSchema.index({ code: 1, isActive: 1 });

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;
