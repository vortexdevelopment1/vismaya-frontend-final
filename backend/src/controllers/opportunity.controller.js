const Opportunity = require("../models/opportunity.model");
const Project = require("../models/project.model");
const Organization = require("../models/organization.model");
const Application = require("../models/application.model");
const TalentProfile = require("../models/talentProfile.model");
const Report = require("../models/report.model");
const { escapeRegex } = require("../utils/sanitize.util");
const { validateOpportunityCreate, validateOpportunityUpdate } = require("../validators/opportunity.validator");

const getApplicantCountApprox = (count) => {
    if (count < 10) return "Under 10";
    if (count < 50) return "10+";
    if (count < 100) return "50+";
    return "100+";
};

const computeEligibilityMatch = (opportunity, profile) => {
    if (!profile) return { matches: true, missing: [] };
    const missing = [];

    const oppEl = opportunity.eligibility || {};

    // 1. Profession Match
    if (oppEl.professions && oppEl.professions.length > 0) {
        const talentProfessions = [
            profile.primaryProfession,
            ...(profile.secondaryProfessions || []),
            profile.primaryDepartment,
            profile.primaryDesignation
        ].filter(Boolean).map(p => p.toLowerCase().trim());

        const hasProfMatch = oppEl.professions.some(p =>
            talentProfessions.includes(p.toLowerCase().trim())
        );

        if (!hasProfMatch) {
            missing.push(`Profession mismatch (Requires: ${oppEl.professions.join(", ")})`);
        }
    }

    // 2. Experience Match
    if (oppEl.minExperienceYears && oppEl.minExperienceYears > 0) {
        const creditsCount = (profile.credits || []).length;
        if (creditsCount < oppEl.minExperienceYears) {
            missing.push(`Minimum experience of ${oppEl.minExperienceYears} project credits required`);
        }
    }

    // 3. Language Match
    if (oppEl.languages && oppEl.languages.length > 0) {
        const talentLangs = (profile.languages || []).map(l => (l.language || "").toLowerCase().trim());
        const missingLangs = oppEl.languages.filter(l => !talentLangs.includes(l.toLowerCase().trim()));
        if (missingLangs.length > 0) {
            missing.push(`Missing language proficiency: ${missingLangs.join(", ")}`);
        }
    }

    // 4. City / Location Match
    if (oppEl.workingCities && oppEl.workingCities.length > 0) {
        const talentCities = [profile.currentCity, ...(profile.workingCities || [])].filter(Boolean).map(c => c.toLowerCase().trim());
        const hasCityMatch = oppEl.workingCities.some(c => talentCities.includes(c.toLowerCase().trim()));
        if (!hasCityMatch && !profile.willingToTravel && !profile.openToWorkAnywhere) {
            missing.push(`Location preference: ${oppEl.workingCities.join(", ")}`);
        }
    }

    // 5. Skills Match
    if (oppEl.skills && oppEl.skills.length > 0) {
        const talentSkills = (profile.skills || []).map(s => (s.name || "").toLowerCase().trim());
        const missingSkills = oppEl.skills.filter(s => !talentSkills.includes(s.toLowerCase().trim()));
        if (missingSkills.length > 0) {
            missing.push(`Required skills: ${missingSkills.join(", ")}`);
        }
    }

    return {
        matches: missing.length === 0,
        missing
    };
};

/**
 * Helper to compute display status, applicant bucket, and sanitize opportunity output
 */
const formatOpportunityForUser = (opportunity, userRole, isOwner, applicantCount = 0, talentProfile = null) => {
    const opp = opportunity.toObject ? opportunity.toObject() : { ...opportunity };

    const now = new Date();
    const deadline = new Date(opp.deadline);
    if (opp.status === "published") {
        if (now > deadline) {
            opp.displayStatus = "Closed";
        } else if (deadline.getTime() - now.getTime() <= 3 * 24 * 60 * 60 * 1000) {
            opp.displayStatus = "Closing Soon";
        } else {
            opp.displayStatus = "Open";
        }
    } else if (opp.status === "closed" || now > deadline) {
        opp.displayStatus = "Closed";
    } else {
        opp.displayStatus = opp.status;
    }

    opp.applicantCountApprox = getApplicantCountApprox(applicantCount);

    if (talentProfile) {
        opp.eligibilityMatch = computeEligibilityMatch(opp, talentProfile);
    }

    // If talent / general user (not owner or admin), hide organization private identity, remuneration, and project org id (§10, §21)
    if (!isOwner && userRole !== "admin") {
        delete opp.remuneration;
        delete opp.rejectionReason;
        delete opp.correctionNotes;
        if (opp.projectId && typeof opp.projectId === "object") {
            delete opp.projectId.organizationId;
        }
    }

    return opp;
};

const createOpportunity = async (req, res) => {
    try {
        const userId = req.user.userId;
        const validation = validateOpportunityCreate(req.body);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.errors[0],
                errors: validation.errors
            });
        }

        const {
            projectId,
            title,
            summary,
            role,
            location,
            deadline,
            remuneration,
            positionsCount,
            eligibility,
            customQuestions
        } = req.body;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        let organization = await Organization.findOne({ userId });
        if (!organization && (req.user.role === "admin" || req.user.role === "recruiter")) {
            organization = (project.organizationId ? await Organization.findById(project.organizationId) : null) || await Organization.findOne();
        }

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        if (req.user.role !== "admin" && project.organizationId.toString() !== organization._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only create opportunities for your own projects"
            });
        }

        // O2: Opportunity submission requires an isPaid org in production
        if (process.env.NODE_ENV === "production" && !req.user.isPaid) {
            return res.status(403).json({
                success: false,
                message: "Active paid organization membership is required to submit opportunities"
            });
        }

        const opportunity = await Opportunity.create({
            projectId,
            title: String(title).trim(),
            summary: String(summary).trim(),
            role: String(role).trim(),
            location: String(location).trim(),
            deadline: new Date(deadline),
            remuneration: remuneration ? String(remuneration).trim() : undefined,
            positionsCount: positionsCount ? parseInt(positionsCount, 10) : undefined,
            eligibility: eligibility || {},
            customQuestions: Array.isArray(customQuestions) ? customQuestions : [],
            status: "pending",
            submittedAt: new Date()
        });

        res.status(201).json({
            success: true,
            message: "Opportunity submitted successfully and is pending Vismaya review",
            opportunity: formatOpportunityForUser(opportunity, req.user.role, true)
        });

    } catch (error) {
        console.error("Create opportunity error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while creating opportunity"
        });
    }
};

/**
 * Edit and Resubmit Opportunity (O2: Editing published moves it back to under_vismaya_review)
 * PUT /api/opportunities/:opportunityId
 */
const updateOpportunity = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { opportunityId } = req.params;
        const validation = validateOpportunityUpdate(req.body);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.errors[0]
            });
        }

        const opportunity = await Opportunity.findById(opportunityId);
        if (!opportunity) {
            return res.status(404).json({
                success: false,
                message: "Opportunity not found"
            });
        }

        const organization = await Organization.findOne({ userId });
        const project = await Project.findById(opportunity.projectId);

        if (!organization || !project || project.organizationId.toString() !== organization._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only edit your own opportunities."
            });
        }

        if (["cancelled", "closed", "completed"].includes(opportunity.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot edit opportunity in '${opportunity.status}' state.`
            });
        }

        const allowedFields = [
            "title", "summary", "role", "location", "deadline", "remuneration",
            "positionsCount", "eligibility", "customQuestions"
        ];

        let isPublishedEdit = opportunity.status === "published";

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                if (field === "deadline") {
                    opportunity.deadline = new Date(req.body.deadline);
                } else {
                    opportunity[field] = req.body[field];
                }
            }
        }

        // O2: Editing a published opportunity moves it back to under_vismaya_review
        if (isPublishedEdit || opportunity.status === "corrections_requested" || req.body.resubmit) {
            opportunity.status = "under_vismaya_review";
            opportunity.resubmittedAt = new Date();
        }

        await opportunity.save();

        res.status(200).json({
            success: true,
            message: opportunity.status === "under_vismaya_review"
                ? "Opportunity resubmitted for Vismaya review"
                : "Opportunity updated successfully",
            opportunity: formatOpportunityForUser(opportunity, req.user.role, true)
        });

    } catch (error) {
        console.error("Update opportunity error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while updating opportunity"
        });
    }
};

/**
 * Request completion through Vismaya workflow (O3)
 * POST /api/opportunities/:opportunityId/complete
 */
const completeOpportunity = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { opportunityId } = req.params;

        const opportunity = await Opportunity.findById(opportunityId);
        if (!opportunity) {
            return res.status(404).json({
                success: false,
                message: "Opportunity not found"
            });
        }

        const organization = await Organization.findOne({ userId });
        const project = await Project.findById(opportunity.projectId);

        if (!organization || !project || project.organizationId.toString() !== organization._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only complete your own opportunities."
            });
        }

        if (!["published", "closed"].includes(opportunity.status)) {
            return res.status(400).json({
                success: false,
                message: "Opportunity completion can only be requested for published or closed opportunities."
            });
        }

        opportunity.completionRequested = true;
        opportunity.completionRequestedAt = new Date();
        await opportunity.save();

        res.status(200).json({
            success: true,
            message: "Opportunity completion requested through Vismaya. Admin confirmation pending.",
            opportunity: formatOpportunityForUser(opportunity, req.user.role, true)
        });

    } catch (error) {
        console.error("Complete opportunity error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while requesting opportunity completion"
        });
    }
};

const getPublishedOpportunities = async (req, res) => {
    try {
        const { profession, city, keyword, search, page = 1, limit = 20 } = req.query;
        const searchTerm = keyword || search;

        const now = new Date();
        const andFilters = [
            { status: "published" },
            { deadline: { $gt: now } }
        ];

        if (city) {
            andFilters.push({
                location: new RegExp(escapeRegex(String(city).trim()), "i")
            });
        }

        if (profession) {
            const profRegex = new RegExp(escapeRegex(String(profession).trim()), "i");
            andFilters.push({
                $or: [
                    { role: profRegex },
                    { "eligibility.professions": { $in: [profRegex] } }
                ]
            });
        }

        if (searchTerm) {
            const kwRegex = new RegExp(escapeRegex(String(searchTerm).trim()), "i");
            andFilters.push({
                $or: [
                    { title: kwRegex },
                    { summary: kwRegex },
                    { role: kwRegex }
                ]
            });
        }

        const filter = { $and: andFilters };

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
        const skip = (pageNum - 1) * limitNum;

        const [opportunities, total] = await Promise.all([
            Opportunity.find(filter)
                .populate("projectId", "projectName")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Opportunity.countDocuments(filter)
        ]);

        let talentProfile = null;
        if (req.user?.role === "talent") {
            talentProfile = await TalentProfile.findOne({ userId: req.user.userId }).lean();
        }

        // Get applicant count for each opportunity
        const oppIds = opportunities.map(o => o._id);
        const appCounts = await Application.aggregate([
            { $match: { opportunityId: { $in: oppIds } } },
            { $group: { _id: "$opportunityId", count: { $sum: 1 } } }
        ]);

        const appCountMap = {};
        for (const item of appCounts) {
            appCountMap[item._id.toString()] = item.count;
        }

        const formatted = opportunities.map(o =>
            formatOpportunityForUser(o, req.user?.role, false, appCountMap[o._id.toString()] || 0, talentProfile)
        );

        res.status(200).json({
            success: true,
            count: formatted.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            opportunities: formatted
        });

    } catch (error) {
        console.error("Get published opportunities error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching opportunities"
        });
    }
};

const getOpportunityById = async (req, res) => {
    try {
        const { opportunityId } = req.params;

        const opportunity = await Opportunity.findById(opportunityId)
            .populate("projectId", "projectName organizationId");

        if (!opportunity) {
            return res.status(404).json({
                success: false,
                message: "Opportunity not found"
            });
        }

        let isOwner = false;
        if (req.user?.role === "organization") {
            const organization = await Organization.findOne({ userId: req.user.userId });
            const project = await Project.findById(opportunity.projectId);
            if (organization && project && project.organizationId.toString() === organization._id.toString()) {
                isOwner = true;
            }
        }

        const now = new Date();
        const isClosed = opportunity.status === "closed" || now > new Date(opportunity.deadline);

        // O4: If closed, applicants (and only applicants, or owner/admin) can fetch it
        if (isClosed && !isOwner && req.user?.role !== "admin") {
            const hasApplied = await Application.exists({
                opportunityId: opportunity._id,
                talentId: req.user?.userId
            });

            if (!hasApplied) {
                return res.status(404).json({
                    success: false,
                    message: "Opportunity is closed"
                });
            }
        } else if (opportunity.status !== "published" && !isClosed && !isOwner && req.user?.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Opportunity is not publicly available"
            });
        }

        let talentProfile = null;
        if (req.user?.role === "talent") {
            talentProfile = await TalentProfile.findOne({ userId: req.user.userId }).lean();
        }

        const appCount = await Application.countDocuments({ opportunityId: opportunity._id });
        const formatted = formatOpportunityForUser(opportunity, req.user?.role, isOwner, appCount, talentProfile);

        res.status(200).json({
            success: true,
            opportunity: formatted
        });

    } catch (error) {
        console.error("Get opportunity by ID error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching opportunity details"
        });
    }
};

const requestOpportunityCancellation = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { opportunityId } = req.params;
        const { cancellationReason } = req.body;

        if (!cancellationReason) {
            return res.status(400).json({
                success: false,
                message: "Cancellation reason is required"
            });
        }

        const opportunity = await Opportunity.findById(opportunityId);
        if (!opportunity) {
            return res.status(404).json({
                success: false,
                message: "Opportunity not found"
            });
        }

        const organization = await Organization.findOne({ userId });
        const project = await Project.findById(opportunity.projectId);

        if (!organization || !project || project.organizationId.toString() !== organization._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only request cancellation for your own opportunities"
            });
        }

        if (["cancelled", "completed"].includes(opportunity.status)) {
            return res.status(400).json({
                success: false,
                message: `Opportunity is already ${opportunity.status}`
            });
        }

        // Store status before cancellation request per O3
        opportunity.statusBeforeCancellationRequest = opportunity.status;
        opportunity.status = "cancellation_requested";
        opportunity.cancellationReason = cancellationReason;
        opportunity.cancellationRequestedAt = new Date();

        await opportunity.save();

        res.status(200).json({
            success: true,
            message: "Cancellation request submitted for Vismaya review",
            opportunity: formatOpportunityForUser(opportunity, req.user.role, true)
        });

    } catch (error) {
        console.error("Request opportunity cancellation error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while submitting cancellation request"
        });
    }
};

const getOrganizationOpportunities = async (req, res) => {
    try {
        const userId = req.user.userId;

        let organization = await Organization.findOne({ userId });
        if (!organization && req.user.role === "admin") {
            const opportunities = await Opportunity.find()
                .populate("projectId", "projectName")
                .sort({ createdAt: -1 });

            const formatted = opportunities.map(o => formatOpportunityForUser(o, "organization", true));

            return res.status(200).json({
                success: true,
                count: formatted.length,
                opportunities: formatted
            });
        }

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        const projects = await Project.find({ organizationId: organization._id }).select("_id");
        const projectIds = projects.map(p => p._id);

        const opportunities = await Opportunity.find({ projectId: { $in: projectIds } })
            .populate("projectId", "projectName")
            .sort({ createdAt: -1 });

        const formatted = opportunities.map(o => formatOpportunityForUser(o, "organization", true));

        res.status(200).json({
            success: true,
            count: formatted.length,
            opportunities: formatted
        });

    } catch (error) {
        console.error("Get organization opportunities error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching organization opportunities"
        });
    }
};

/**
 * Report an opportunity (§31: "Only applicants can report")
 * POST /api/opportunities/:opportunityId/report
 */
const reportOpportunity = async (req, res) => {
    try {
        const talentId = req.user.userId;
        const { opportunityId } = req.params;
        const { reason, details } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: "Reporting reason is required"
            });
        }

        const validReasons = [
            "misleading_information",
            "scam_or_fraud",
            "offensive_content",
            "copyright_infringement",
            "impersonation",
            "other"
        ];

        if (!validReasons.includes(reason)) {
            return res.status(400).json({
                success: false,
                message: "Invalid reporting reason"
            });
        }

        const hasApplied = await Application.findOne({
            opportunityId,
            talentId
        });

        if (!hasApplied) {
            return res.status(403).json({
                success: false,
                message: "Only verified applicants may report an opportunity."
            });
        }

        const existingReport = await Report.findOne({
            reporterId: talentId,
            targetId: opportunityId,
            targetType: "Opportunity"
        });

        if (existingReport) {
            return res.status(409).json({
                success: false,
                message: "You have already submitted a report for this opportunity."
            });
        }

        const report = await Report.create({
            reporterId: talentId,
            targetId: opportunityId,
            targetType: "Opportunity",
            reason,
            details: details ? String(details).trim() : "",
            status: "pending"
        });

        res.status(201).json({
            success: true,
            message: "Report submitted successfully. Vismaya moderation team will review this listing.",
            report,
            reportId: report._id
        });

    } catch (error) {
        console.error("Report opportunity error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while submitting opportunity report"
        });
    }
};

module.exports = {
    createOpportunity,
    updateOpportunity,
    completeOpportunity,
    getPublishedOpportunities,
    getOpportunityById,
    requestOpportunityCancellation,
    getOrganizationOpportunities,
    reportOpportunity
};