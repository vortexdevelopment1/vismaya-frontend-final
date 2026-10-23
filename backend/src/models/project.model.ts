import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IProject extends Document {
    organizationId: Types.ObjectId;
    projectName: string;
    description?: string;
    projectType?: string;
    /** Internal fallback project used when an organization has not supplied one. */
    isSystemDefault?: boolean;
    status: "active" | "completed" | "cancelled" | "suspended";
    completedAt?: Date;
    completedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true
        },

        projectName: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        projectType: {
            type: String,
            trim: true
        },

        isSystemDefault: {
            type: Boolean,
            default: false
        },

        status: {
            type: String,
            enum: ["active", "completed", "cancelled", "suspended"],
            default: "active"
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

projectSchema.index({ organizationId: 1, status: 1 });
projectSchema.index({ organizationId: 1, isSystemDefault: 1 });

export const Project: Model<IProject> = mongoose.model<IProject>("Project", projectSchema);
export default Project;
