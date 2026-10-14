const mongoose = require("mongoose");

const successStorySchema = new mongoose.Schema(
    {
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

        applicationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Application"
        },

        opportunityId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Opportunity"
        },

        photoUrl: {
            type: String,
            required: true,
            trim: true
        },

        quote: {
            type: String,
            required: true,
            trim: true
        },

        talentName: {
            type: String,
            required: true,
            trim: true
        },

        roleOrProfession: {
            type: String,
            trim: true
        },

        projectName: {
            type: String,
            trim: true
        },

        organizationName: {
            type: String,
            trim: true
        },

        externalSharingConsent: {
            type: Boolean,
            default: false
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "archived"],
            default: "pending"
        },

        rejectionReason: {
            type: String,
            trim: true
        },

        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        reviewedAt: {
            type: Date
        },

        displayOrder: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

successStorySchema.index({ status: 1, createdAt: -1 });

const SuccessStory = mongoose.model("SuccessStory", successStorySchema);

module.exports = SuccessStory;
