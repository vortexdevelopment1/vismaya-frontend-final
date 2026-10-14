const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        sessionId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        deviceInfo: {
            type: String,
            default: "Unknown Device"
        },
        ipAddress: {
            type: String,
            default: "127.0.0.1"
        },
        userAgent: {
            type: String,
            default: ""
        },
        isValid: {
            type: Boolean,
            default: true,
            index: true
        },
        lastActiveAt: {
            type: Date,
            default: Date.now
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 } // TTL index automatically cleans up expired sessions
        }
    },
    {
        timestamps: true
    }
);

sessionSchema.index({ userId: 1, isValid: 1 });

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
