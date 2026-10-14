const mongoose = require("mongoose");

const registrationDraftSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        role: {
            type: String,
            enum: ["talent", "organization"],
            required: true
        },
        currentStep: {
            type: Number,
            default: 1,
            min: 1
        },
        formData: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        tokenHash: {
            type: String,
            select: false,
            index: true
        },
        isPaid: {
            type: Boolean,
            default: false
        },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days retention
            index: { expires: 0 }
        }
    },
    {
        timestamps: true
    }
);

const RegistrationDraft = mongoose.model("RegistrationDraft", registrationDraftSchema);

module.exports = RegistrationDraft;
