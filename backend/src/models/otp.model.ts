import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOtp extends Document {
    email?: string;
    mobile?: string;
    otpHash: string;
    purpose: "password_reset" | "admin_password_reset" | "email_verification" | "mobile_verification" | "registration" | "2fa_login" | "2fa_setup" | "email_change" | "password_change" | "account_deletion";
    metadata?: Record<string, unknown>;
    attempts: number;
    isUsed: boolean;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const otpSchema = new Schema<IOtp>(
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
                "admin_password_reset",
                "email_verification",
                "mobile_verification",
                "registration",
                "2fa_login",
                "2fa_setup",
                "email_change",
                "password_change",
                "account_deletion"
            ],
            default: "password_reset"
        },

        metadata: {
            type: Schema.Types.Mixed
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

export const Otp: Model<IOtp> = mongoose.model<IOtp>("Otp", otpSchema);
export default Otp;
