const mongoose = require("mongoose");

const creditTransactionSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
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
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        description: {
            type: String,
            trim: true
        },

        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        paymentTransactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PaymentTransaction"
        }
    },
    {
        timestamps: true
    }
);

creditTransactionSchema.index({ organizationId: 1, createdAt: -1 });

const CreditTransaction = mongoose.model("CreditTransaction", creditTransactionSchema);

module.exports = CreditTransaction;
