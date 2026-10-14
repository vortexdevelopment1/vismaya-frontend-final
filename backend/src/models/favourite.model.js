const mongoose = require("mongoose");

const favouriteSchema = new mongoose.Schema(
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

        talentProfileId: {
            type: mongoose.Schema.Types.ObjectId,
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

// Ensure an organization cannot favourite the same talent multiple times
favouriteSchema.index({ organizationId: 1, talentId: 1 }, { unique: true });
favouriteSchema.index({ organizationId: 1, createdAt: -1 });

const Favourite = mongoose.model("Favourite", favouriteSchema);

module.exports = Favourite;
