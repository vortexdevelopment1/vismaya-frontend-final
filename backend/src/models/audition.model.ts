import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISelfTapeSubmission {
    videoUrl?: string;
    thumbnailUrl?: string;
    durationSeconds?: number;
    fileSizeBytes?: number;
    notes?: string;
    submittedAt?: Date;
}

export interface IAudition extends Document {
    applicationId: Types.ObjectId;
    opportunityId: Types.ObjectId;
    projectId: Types.ObjectId;
    organizationId: Types.ObjectId;
    talentId: Types.ObjectId;
    type: "self_tape" | "in_person_audition" | "video_interview";
    role?: string;
    sceneBrief?: string;
    instructions?: string;
    scriptUrl?: string;
    meetingLink?: string;
    location?: string;
    scheduledAt?: Date;
    deadline?: Date;
    status: "requested" | "scheduled" | "submitted" | "reviewed" | "completed" | "cancelled";
    selfTapeSubmission?: ISelfTapeSubmission;
    organizationFeedback?: string;
    organizationRating?: number;
    reviewedAt?: Date;
    reviewedBy?: Types.ObjectId;
    vismayaApproval: "pending" | "approved" | "rejected";
    vismayaReviewedBy?: Types.ObjectId;
    vismayaReviewedAt?: Date;
    vismayaRejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const auditionSchema = new Schema<IAudition>(
    {
        applicationId: {
            type: Schema.Types.ObjectId,
            ref: "Application",
            required: true
        },

        opportunityId: {
            type: Schema.Types.ObjectId,
            ref: "Opportunity",
            required: true
        },

        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },

        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true
        },

        talentId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            enum: [
                "self_tape",
                "in_person_audition",
                "video_interview"
            ],
            required: true
        },

        role: {
            type: String,
            trim: true
        },

        sceneBrief: {
            type: String,
            trim: true
        },

        instructions: {
            type: String,
            trim: true
        },

        scriptUrl: {
            type: String,
            trim: true
        },

        meetingLink: {
            type: String,
            trim: true
        },

        location: {
            type: String,
            trim: true
        },

        scheduledAt: {
            type: Date
        },

        deadline: {
            type: Date
        },

        status: {
            type: String,
            enum: [
                "requested",
                "scheduled",
                "submitted",
                "reviewed",
                "completed",
                "cancelled"
            ],
            default: "requested"
        },

        selfTapeSubmission: {
            videoUrl: {
                type: String,
                trim: true
            },
            thumbnailUrl: {
                type: String,
                trim: true
            },
            durationSeconds: {
                type: Number
            },
            fileSizeBytes: {
                type: Number
            },
            notes: {
                type: String,
                trim: true
            },
            submittedAt: {
                type: Date
            }
        },

        organizationFeedback: {
            type: String,
            trim: true
        },
        organizationRating: {
            type: Number,
            min: 1,
            max: 5
        },
        reviewedAt: {
            type: Date
        },
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },

        vismayaApproval: {
            type: String,
            enum: [
                "pending",
                "approved",
                "rejected"
            ],
            default: "pending"
        },
        vismayaReviewedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        vismayaReviewedAt: {
            type: Date
        },
        vismayaRejectionReason: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

auditionSchema.index({ applicationId: 1 }, { unique: true });
auditionSchema.index({ talentId: 1, status: 1 });
auditionSchema.index({ organizationId: 1, status: 1 });
auditionSchema.index({ vismayaApproval: 1, createdAt: -1 });

export const Audition: Model<IAudition> = mongoose.model<IAudition>("Audition", auditionSchema);
export default Audition;
