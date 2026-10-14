import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IProjectShortlist extends Document {
    projectId: Types.ObjectId;
    opportunityId?: Types.ObjectId;
    organizationId: Types.ObjectId;
    talentId: Types.ObjectId;
    talentProfileId: Types.ObjectId;
    role: string;
    status: "shortlisted" | "selected";
    addedBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const projectShortlistSchema = new Schema<IProjectShortlist>(
    {
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },

        opportunityId: {
            type: Schema.Types.ObjectId,
            ref: "Opportunity"
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

        talentProfileId: {
            type: Schema.Types.ObjectId,
            ref: "TalentProfile",
            required: true
        },

        role: {
            type: String,
            required: true,
            trim: true
        },

        status: {
            type: String,
            enum: [
                "shortlisted",
                "selected"
            ],
            default: "shortlisted"
        },

        addedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

projectShortlistSchema.index({ projectId: 1, talentId: 1, role: 1 }, { unique: true });
projectShortlistSchema.index({ organizationId: 1, projectId: 1, createdAt: -1 });

export const ProjectShortlist: Model<IProjectShortlist> = mongoose.model<IProjectShortlist>("ProjectShortlist", projectShortlistSchema);
export default ProjectShortlist;
