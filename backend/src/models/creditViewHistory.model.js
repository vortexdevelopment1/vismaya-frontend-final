const mongoose = require("mongoose");

const creditViewHistorySchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true
        },

        talentId: {
            type: mongoose.Schema.Types.ObjectId,
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

const CreditViewHistory = mongoose.model("CreditViewHistory", creditViewHistorySchema);

module.exports = CreditViewHistory;
