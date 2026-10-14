const mongoose = require("mongoose");

const creditLedgerSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
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

const CreditLedger = mongoose.model("CreditLedger", creditLedgerSchema);

module.exports = CreditLedger;
