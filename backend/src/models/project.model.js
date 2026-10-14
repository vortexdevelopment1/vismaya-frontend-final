const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
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
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

projectSchema.index({ organizationId: 1, status: 1 });

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;