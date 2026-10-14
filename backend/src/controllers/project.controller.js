const Project = require("../models/project.model");
const Organization = require("../models/organization.model");
const Opportunity = require("../models/opportunity.model");
const TalentProfile = require("../models/talentProfile.model");
const ProjectShortlist = require("../models/projectShortlist.model");
const User = require("../models/user.model");
const { escapeRegex } = require("../utils/sanitize.util");


/**
 * Create a new project
 * POST /api/projects
 */
const createProject = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { projectName, description, projectType } = req.body;

        if (!projectName) {
            return res.status(400).json({
                success: false,
                message: "Project name is required"
            });
        }

        let organization = await Organization.findOne({ userId });
        if (!organization && (req.user.role === "admin" || req.user.role === "recruiter")) {
            organization = await Organization.findOne();
        }

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        const project = await Project.create({
            organizationId: organization._id,
            projectName,
            description,
            projectType
        });

        res.status(201).json({
            success: true,
            message: "Project created successfully",
            project
        });

    } catch (error) {
        console.error("Create project error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while creating project"
        });
    }
};

/**
 * Get all projects owned by the logged-in organization
 * GET /api/projects
 */
const getMyProjects = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { status } = req.query;

        let organization = await Organization.findOne({ userId });
        let filter = {};
        if (organization) {
            filter.organizationId = organization._id;
        } else if (req.user.role === "admin") {
            filter = {};
        } else {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }
        if (status && ["active", "completed", "cancelled"].includes(status)) {
            filter.status = status;
        }

        const projects = await Project.find(filter).sort({ createdAt: -1 }).lean();

        // Attach counts for opportunities and shortlists for each project
        const projectIds = projects.map(p => p._id);
        const [opportunityCounts, shortlistCounts] = await Promise.all([
            Opportunity.aggregate([
                { $match: { projectId: { $in: projectIds } } },
                { $group: { _id: "$projectId", count: { $sum: 1 } } }
            ]),
            ProjectShortlist.aggregate([
                { $match: { projectId: { $in: projectIds } } },
                { $group: { _id: "$projectId", count: { $sum: 1 } } }
            ])
        ]);

        const oppCountMap = {};
        for (const item of opportunityCounts) {
            oppCountMap[item._id.toString()] = item.count;
        }

        const shortlistCountMap = {};
        for (const item of shortlistCounts) {
            shortlistCountMap[item._id.toString()] = item.count;
        }

        const projectsWithStats = projects.map(p => ({
            ...p,
            opportunityCount: oppCountMap[p._id.toString()] || 0,
            shortlistCount: shortlistCountMap[p._id.toString()] || 0
        }));

        res.status(200).json({
            success: true,
            count: projectsWithStats.length,
            projects: projectsWithStats
        });

    } catch (error) {
        console.error("Get my projects error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching projects"
        });
    }
};

/**
 * Get single project details
 * GET /api/projects/:projectId
 */
const getProjectDetails = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { projectId } = req.params;

        const organization = await Organization.findOne({ userId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        const project = await Project.findOne({
            _id: projectId,
            organizationId: organization._id
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found or access denied"
            });
        }

        const [opportunities, shortlists] = await Promise.all([
            Opportunity.find({ projectId }).sort({ createdAt: -1 }),
            ProjectShortlist.find({ projectId })
                .populate({
                    path: "talentProfileId",
                    select: "vismayaId stageName firstName lastName headline profilePhoto category primaryProfession primaryDepartment primaryDesignation skills"
                })
                .sort({ createdAt: -1 })
        ]);

        res.status(200).json({
            success: true,
            project,
            opportunities,
            shortlists
        });

    } catch (error) {
        console.error("Get project details error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching project details"
        });
    }
};

/**
 * Update project
 * PATCH /api/projects/:projectId
 */
const updateProject = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { projectId } = req.params;
        const { projectName, description, projectType, status } = req.body;

        const organization = await Organization.findOne({ userId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        const project = await Project.findOne({
            _id: projectId,
            organizationId: organization._id
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        if (projectName) project.projectName = projectName;
        if (description !== undefined) project.description = description;
        if (projectType) project.projectType = projectType;
        if (status && ["active", "completed", "cancelled"].includes(status)) {
            project.status = status;
            if (status === "completed") {
                project.completedAt = new Date();
                project.completedBy = userId;
            }
        }

        await project.save();

        res.status(200).json({
            success: true,
            message: "Project updated successfully",
            project
        });

    } catch (error) {
        console.error("Update project error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while updating project"
        });
    }
};

const CreditViewHistory = require("../models/creditViewHistory.model");
const Application = require("../models/application.model");

/**
 * Add talent to project shortlist
 * POST /api/projects/:projectId/shortlist
 */
const addToShortlist = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { projectId } = req.params;
        const { talentId, vismayaId, role, opportunityId } = req.body;

        if (!role) {
            return res.status(400).json({
                success: false,
                message: "Role is required for shortlisting talent"
            });
        }

        const organization = await Organization.findOne({ userId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        // Validate project ownership
        const project = await Project.findOne({
            _id: projectId,
            organizationId: organization._id
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found or not owned by your organization"
            });
        }

        // Find talent profile
        let talentProfile;
        if (vismayaId) {
            talentProfile = await TalentProfile.findOne({ vismayaId });
        } else if (talentId) {
            talentProfile = await TalentProfile.findOne({
                $or: [{ userId: talentId }, { _id: talentId }]
            });
        }

        if (!talentProfile) {
            return res.status(404).json({
                success: false,
                message: "Talent profile not found"
            });
        }

        // D5: Shortlisting requires org to have a full-profile view or the talent to be an applicant
        const hasUnlockedView = await CreditViewHistory.exists({
            organizationId: organization._id,
            talentId: talentProfile.userId
        });

        const isApplicant = await Application.exists({
            talentId: talentProfile.userId,
            $or: [{ projectId: project._id }, { opportunityId: { $in: await Opportunity.find({ projectId: project._id }).select("_id") } }]
        });

        if (!hasUnlockedView && !isApplicant) {
            return res.status(403).json({
                success: false,
                message: "Shortlisting requires an unlocked full profile view or the talent to be an applicant for this project."
            });
        }

        // Check if already in shortlist for this role
        const existingShortlist = await ProjectShortlist.findOne({
            projectId,
            talentId: talentProfile.userId,
            role: role.trim()
        });

        if (existingShortlist) {
            return res.status(409).json({
                success: false,
                message: `Talent is already shortlisted for role '${role}' in this project`,
                shortlist: existingShortlist
            });
        }

        const shortlist = await ProjectShortlist.create({
            projectId,
            opportunityId: opportunityId || null,
            organizationId: organization._id,
            talentId: talentProfile.userId,
            talentProfileId: talentProfile._id,
            role: role.trim(),
            status: "shortlisted",
            addedBy: userId
        });

        res.status(201).json({
            success: true,
            message: "Talent added to project shortlist successfully",
            shortlist
        });

    } catch (error) {
        console.error("Add to shortlist error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while adding talent to project shortlist"
        });
    }
};

/**
 * List all shortlisted talent for a project
 * GET /api/projects/:projectId/shortlist
 */
const getProjectShortlist = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { projectId } = req.params;
        const { status, role } = req.query;

        const organization = await Organization.findOne({ userId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        const project = await Project.findOne({
            _id: projectId,
            organizationId: organization._id
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found or access denied"
            });
        }

        const filter = { projectId };
        if (status) filter.status = status;
        if (role) filter.role = new RegExp(escapeRegex(String(role).trim()), "i");

        const shortlist = await ProjectShortlist.find(filter)
            .populate({
                path: "talentProfileId",
                select: "vismayaId stageName firstName lastName headline profilePhoto category primaryProfession primaryDepartment primaryDesignation skills currentState"
            })
            .populate({
                path: "opportunityId",
                select: "title department designation"
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: shortlist.length,
            shortlist
        });

    } catch (error) {
        console.error("Get project shortlist error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching project shortlist"
        });
    }
};

/**
 * Update shortlisted candidate status
 * PATCH /api/projects/:projectId/shortlist/:shortlistId
 */
const updateShortlistItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { projectId, shortlistId } = req.params;
        const { status, role } = req.body;

        const organization = await Organization.findOne({ userId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        const shortlist = await ProjectShortlist.findOne({
            _id: shortlistId,
            projectId,
            organizationId: organization._id
        });

        if (!shortlist) {
            return res.status(404).json({
                success: false,
                message: "Shortlisted record not found or access denied"
            });
        }

        if (status && ["shortlisted", "selected"].includes(status)) {
            shortlist.status = status;
        }
        if (role) shortlist.role = role.trim();

        await shortlist.save();

        res.status(200).json({
            success: true,
            message: "Shortlist record updated successfully",
            shortlist
        });

    } catch (error) {
        console.error("Update shortlist item error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while updating shortlist item"
        });
    }
};

/**
 * Remove candidate from project shortlist
 * DELETE /api/projects/:projectId/shortlist/:shortlistId
 */
const removeFromShortlist = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { projectId, shortlistId } = req.params;

        const organization = await Organization.findOne({ userId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        const result = await ProjectShortlist.findOneAndDelete({
            _id: shortlistId,
            projectId,
            organizationId: organization._id
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Shortlisted record not found or access denied"
            });
        }

        res.status(200).json({
            success: true,
            message: "Candidate removed from project shortlist successfully"
        });

    } catch (error) {
        console.error("Remove from shortlist error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while removing candidate from shortlist"
        });
    }
};

module.exports = {
    createProject,
    getMyProjects,
    getProjectDetails,
    updateProject,
    addToShortlist,
    getProjectShortlist,
    updateShortlistItem,
    removeFromShortlist
};