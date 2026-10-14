import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IProject extends Document {
    organizationId: Types.ObjectId;
    projectName: string;
    description?: string;
    projectType?: string;
    status: "active" | "completed" | "cancelled";
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

        status: {
            type: String,
            enum: ["active", "completed", "cancelled"],
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

export const Project: Model<IProject> = mongoose.model<IProject>("Project", projectSchema);
export default Project;
