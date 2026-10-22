import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICustomQuestion {
    _id?: Types.ObjectId;
    questionText: string;
    isRequired: boolean;
}

export interface IOpportunity extends Document {
    projectId: Types.ObjectId;
    title: string;
    summary: string;
    role: string;
    location: string;
    deadline: Date;
    remuneration?: string;
    positionsCount?: number;
    eligibility?: {
        professions: string[];
        minExperienceYears: number;
        languages: string[];
        workingCities: string[];
        skills: string[];
    };
    customQuestions: ICustomQuestion[];
    status: "pending" | "under_vismaya_review" | "corrections_requested" | "published" | "rejected" | "cancellation_requested" | "cancelled" | "closed" | "completed";
    statusBeforeCancellationRequest?: string;
    completionRequested: boolean;
    completionRequestedAt?: Date;
    rejectionReason?: string;
    correctionNotes?: string;
    correctionRequestedAt?: Date;
    correctionRequestedBy?: Types.ObjectId;
    submittedAt: Date;
    resubmittedAt?: Date;
    approvedAt?: Date;
    approvedBy?: Types.ObjectId;
    cancellationReason?: string;
    cancellationRequestedAt?: Date;
    cancellationReviewedAt?: Date;
    cancellationReviewedBy?: Types.ObjectId;
    cancellationRequest?: {
        requestedBy?: Types.ObjectId;
        reason: string;
        requestedAt: Date;
        decision: "pending" | "approved" | "declined";
        decidedBy?: Types.ObjectId;
        decidedAt?: Date;
        adminNote?: string;
        declineReason?: string;
    };
    publishedAt?: Date;
    closedAt?: Date;
    autoClosedAt?: Date;
    completedAt?: Date;
    completedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const customQuestionSchema = new Schema<ICustomQuestion>({
    questionText: {
        type: String,
        required: true,
        trim: true
    },
    isRequired: {
        type: Boolean,
        default: false
    }
}, { _id: true });

const opportunitySchema = new Schema<IOpportunity>(
    {
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        summary: {
            type: String,
            required: true,
            trim: true
        },

        role: {
            type: String,
            required: true,
            trim: true
        },

        location: {
            type: String,
            required: true,
            trim: true
        },

        deadline: {
            type: Date,
            required: true
        },

        remuneration: {
            type: String,
            trim: true
        },

        positionsCount: {
            type: Number,
            min: 1
        },

        eligibility: {
            professions: [{ type: String, trim: true }],
            minExperienceYears: { type: Number, default: 0 },
            languages: [{ type: String, trim: true }],
            workingCities: [{ type: String, trim: true }],
            skills: [{ type: String, trim: true }]
        },

        customQuestions: [customQuestionSchema],

        status: {
            type: String,
            enum: [
                "pending",
                "under_vismaya_review",
                "corrections_requested",
                "published",
                "rejected",
                "cancellation_requested",
                "cancelled",
                "closed",
                "completed"
            ],
            default: "pending"
        },

        statusBeforeCancellationRequest: {
            type: String
        },

        completionRequested: {
            type: Boolean,
            default: false
        },
        completionRequestedAt: {
            type: Date
        },

        rejectionReason: {
            type: String,
            trim: true
        },

        correctionNotes: {
            type: String,
            trim: true
        },
        correctionRequestedAt: {
            type: Date
        },
        correctionRequestedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },

        submittedAt: {
            type: Date,
            default: Date.now
        },
        resubmittedAt: {
            type: Date
        },
        approvedAt: {
            type: Date
        },
        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },

        cancellationReason: {
            type: String,
            trim: true
        },
        cancellationRequestedAt: {
            type: Date
        },
        cancellationReviewedAt: {
            type: Date
        },
        cancellationReviewedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        cancellationRequest: {
            requestedBy: { type: Schema.Types.ObjectId, ref: "User" },
            reason: { type: String, trim: true },
            requestedAt: { type: Date },
            decision: { type: String, enum: ["pending", "approved", "declined"] },
            decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
            decidedAt: { type: Date },
            adminNote: { type: String, trim: true },
            declineReason: { type: String, trim: true }
        },

        publishedAt: {
            type: Date
        },
        closedAt: {
            type: Date
        },
        autoClosedAt: {
            type: Date
        },
        completedAt: {
            type: Date
        },
        completedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

opportunitySchema.index({ status: 1, deadline: 1 });
opportunitySchema.index({ projectId: 1 });

export const Opportunity: Model<IOpportunity> = mongoose.model<IOpportunity>("Opportunity", opportunitySchema);
export default Opportunity;
