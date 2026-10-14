const mongoose = require("mongoose");

const talentViewEventSchema = new mongoose.Schema(
    {
        talentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        viewerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        viewerRole: {
            type: String,
            enum: ["talent", "organization", "guest", "admin"],
            default: "guest"
        },

        isFullProfile: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: { createdAt: true, updatedAt: false }
    }
);

talentViewEventSchema.index({ talentId: 1, createdAt: -1 });

const TalentViewEvent = mongoose.model("TalentViewEvent", talentViewEventSchema);

module.exports = TalentViewEvent;
