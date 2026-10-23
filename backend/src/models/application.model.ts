import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICustomAnswer {
    questionId?: Types.ObjectId;
    questionText?: string;
    answerText?: string;
}

export interface IApplication extends Document {
    opportunityId: Types.ObjectId;
    talentId: Types.ObjectId;
    roleName?: string;
    coverNote?: string;
    customAnswers: ICustomAnswer[];
    consentGiven: boolean;
    eligibilityWarnings: string[];
    status: "applied" | "under_review" | "shortlisted" | "selected" | "not_selected" | "withdrawn" | "opportunity_cancelled";
    withdrawalReason?: string;
    withdrawnAt?: Date;
    reapplicationRequested: boolean;
    reapplicationRequestedAt?: Date;
    reapplicationRequestReason?: string;
    reapplicationApproved: boolean;
    reapplicationReviewedAt?: Date;
    reapplicationReviewedBy?: Types.ObjectId;
    reapplicationDecisionNotes?: string;
    selectedAt?: Date;
    selectedBy?: Types.ObjectId;
    notSelectedAt?: Date;
    notSelectedReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const customAnswerSchema = new Schema<ICustomAnswer>({
    questionId: {
        type: Schema.Types.ObjectId
    },
    questionText: {
        type: String,
        trim: true
    },
    answerText: {
        type: String,
        trim: true
    }
}, { _id: false });

const applicationSchema = new Schema<IApplication>(
    {
        opportunityId: {
            type: Schema.Types.ObjectId,
            ref: "Opportunity",
            required: true
        },

        talentId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        roleName: {
            type: String,
            trim: true
        },

        coverNote: {
            type: String,
            trim: true
        },

        customAnswers: [customAnswerSchema],

        consentGiven: {
            type: Boolean,
            default: false
        },

        eligibilityWarnings: [{
            type: String,
            trim: true
        }],

        status: {
            type: String,
            enum: [
                "applied",
                "under_review",
                "shortlisted",
                "selected",
                "not_selected",
                "withdrawn",
                "opportunity_cancelled"
            ],
            default: "applied"
        },

        withdrawalReason: {
            type: String,
            trim: true
        },
        withdrawnAt: {
            type: Date
        },

        reapplicationRequested: {
            type: Boolean,
            default: false
        },
        reapplicationRequestedAt: {
            type: Date
        },
        reapplicationRequestReason: {
            type: String,
            trim: true
        },
        reapplicationApproved: {
            type: Boolean,
            default: false
        },
        reapplicationReviewedAt: {
            type: Date
        },
        reapplicationReviewedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        reapplicationDecisionNotes: {
            type: String,
            trim: true
        },

        selectedAt: {
            type: Date
        },
        selectedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        notSelectedAt: {
            type: Date
        },
        notSelectedReason: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

applicationSchema.index({ opportunityId: 1, talentId: 1 }, { unique: true });
applicationSchema.index({ talentId: 1, status: 1 });
applicationSchema.index({ opportunityId: 1, status: 1 });

export const Application: Model<IApplication> = mongoose.model<IApplication>("Application", applicationSchema);
export default Application;
