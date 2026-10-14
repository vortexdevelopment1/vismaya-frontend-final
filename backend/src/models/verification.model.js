const mongoose = require("mongoose");

const verificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        verificationType: {
            type: String,
            enum: [
                "identity",
                "professional",
                "organization_business"
            ],
            required: true
        },

        // Identity Verification Data
        identityData: {
            idType: {
                type: String,
                enum: ["aadhaar", "passport", "driving_license", "voter_id", "pan"]
            },
            idNumber: { type: String, trim: true },
            documentFrontUrl: { type: String, trim: true },
            documentBackUrl: { type: String, trim: true },
            selfiePhotoUrl: { type: String, trim: true }
        },

        // Professional Verification Data
        professionalData: {
            creditsLinks: [{ type: String, trim: true }],
            guildOrUnionName: { type: String, trim: true },
            guildMembershipNumber: { type: String, trim: true },
            supportingDocumentUrls: [{ type: String, trim: true }]
        },

        // Organization Business Verification Data
        businessData: {
            businessRegType: {
                type: String,
                enum: ["cin", "gstin", "llpin", "trade_license", "udyam", "other"]
            },
            businessRegNumber: { type: String, trim: true },
            legalEntityName: { type: String, trim: true },
            documentUrl: { type: String, trim: true }
        },

        // Verification State Machine
        status: {
            type: String,
            enum: [
                "pending",
                "verified",
                "rejected",
                "suspended"
            ],
            default: "pending"
        },

        rejectionReason: {
            type: String,
            trim: true
        },

        moreInfoRequested: {
            type: Boolean,
            default: false
        },

        moreInfoNotes: {
            type: String,
            trim: true
        },

        reviewedAt: {
            type: Date
        },

        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        submittedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Compound index so each user has at most one record per verification type
verificationSchema.index({ userId: 1, verificationType: 1 }, { unique: true });
verificationSchema.index({ status: 1, createdAt: -1 });

const Verification = mongoose.model("Verification", verificationSchema);

module.exports = Verification;
