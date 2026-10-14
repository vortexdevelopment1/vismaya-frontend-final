import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISession extends Document {
    userId: Types.ObjectId;
    sessionId: string;
    deviceInfo: string;
    ipAddress: string;
    userAgent: string;
    isValid: boolean;
    lastActiveAt: Date;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
    {
        userId: {
            type: Schema.Types.ObjectId,
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

export const Session: Model<ISession> = mongoose.model<ISession>("Session", sessionSchema);
export default Session;
