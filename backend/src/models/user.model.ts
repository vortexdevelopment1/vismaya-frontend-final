import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    mobile?: string;
    password?: string;
    googleId?: string;
    authProvider: "local" | "google";
    role: "talent" | "organization" | "admin";
    status: "pending" | "active" | "restricted" | "suspended" | "rejected" | "banned" | "deletion_requested" | "deleted";
    isEmailVerified: boolean;
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
    isSuperAdmin?: boolean;
    adminLockUntil?: Date | null;
    failedAdminLoginAttempts?: number;
    deletionRequestedAt?: Date;
    pendingEmail?: string;
    isPaid: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const normalizeMobile = (val?: unknown): string | undefined => {
    if (!val) return undefined;
    const clean = String(val).replace(/[^0-9+]/g, "").trim();
    if (/^[6-9]\d{9}$/.test(clean)) {
        return `+91${clean}`;
    }
    if (/^\+91[6-9]\d{9}$/.test(clean)) {
        return clean;
    }
    return clean;
};

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        mobile: {
            type: String,
            trim: true,
            set: normalizeMobile,
            validate: {
                validator: function (v?: string): boolean {
                    if (!v) return true;
                    return /^(\+91)?[6-9]\d{9}$/.test(v);
                },
                message: "Mobile number must be a valid 10-digit Indian number (e.g. +91XXXXXXXXXX or 9876543210)"
            }
        },

        password: {
            type: String,
            required: function (this: IUser): boolean {
                return !this.googleId;
            }
        },

        googleId: {
            type: String,
            sparse: true,
            trim: true
        },

        authProvider: {
            type: String,
            enum: ["local", "google"],
            default: "local"
        },

        role: {
            type: String,
            enum: ["talent", "organization", "admin"],
            required: true
        },

        status: {
            type: String,
            enum: [
                "pending",
                "active",
                "restricted",
                "suspended",
                "rejected",
                "banned",
                "deletion_requested",
                "deleted"
            ],
            default: "pending"
        },

        isEmailVerified: {
            type: Boolean,
            default: false
        },

        twoFactorEnabled: {
            type: Boolean,
            default: false
        },

        twoFactorSecret: {
            type: String,
            select: false
        },

        isSuperAdmin: {
            type: Boolean,
            default: false
        },

        adminLockUntil: {
            type: Date,
            default: null
        },

        failedAdminLoginAttempts: {
            type: Number,
            default: 0
        },

        deletionRequestedAt: {
            type: Date
        },

        pendingEmail: {
            type: String,
            lowercase: true,
            trim: true
        },

        isPaid: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

userSchema.index({ mobile: 1 }, { unique: true, sparse: true });

// Single-Admin Enforcement Guard:
// The system strictly allows exactly one administrator account.
// Prevents direct DB or code-path creation or promotion of a second admin account.
userSchema.pre("save", async function (this: any) {
    if (this.isModified("role") && this.role === "admin") {
        const existingAdminCount = await mongoose.model("User").countDocuments({
            role: "admin",
            _id: { $ne: this._id }
        });
        if (existingAdminCount >= 1) {
            throw new Error(
                "SINGLE_ADMIN_VIOLATION: System is strictly restricted to a single administrator account. Cannot create or promote additional admin."
            );
        }
    }
});

export const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default User;
