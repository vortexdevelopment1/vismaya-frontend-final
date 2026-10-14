const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            lowercase: true,
            trim: true,
            sparse: true
        },

        mobile: {
            type: String,
            trim: true,
            sparse: true
        },

        otpHash: {
            type: String,
            required: true
        },

        purpose: {
            type: String,
            enum: [
                "password_reset",
                "email_verification",
                "mobile_verification",
                "registration",
                "2fa_login",
                "2fa_setup",
                "email_change"
            ],
            default: "password_reset"
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed
        },

        attempts: {
            type: Number,
            default: 0
        },

        isUsed: {
            type: Boolean,
            default: false
        },

        expiresAt: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
);

// TTL index to automatically remove expired OTPs from MongoDB
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1, purpose: 1 });
otpSchema.index({ mobile: 1, purpose: 1 });

const Otp = mongoose.model("Otp", otpSchema);

module.exports = Otp;
