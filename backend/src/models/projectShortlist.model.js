const mongoose = require("mongoose");

const projectShortlistSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },

        opportunityId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Opportunity"
        },

        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true
        },

        talentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        talentProfileId: {
            type: mongoose.Schema.Types.ObjectId,
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
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Compound index to prevent duplicate entries for the same role in a project
projectShortlistSchema.index({ projectId: 1, talentId: 1, role: 1 }, { unique: true });
projectShortlistSchema.index({ organizationId: 1, projectId: 1, createdAt: -1 });

const ProjectShortlist = mongoose.model("ProjectShortlist", projectShortlistSchema);

module.exports = ProjectShortlist;
