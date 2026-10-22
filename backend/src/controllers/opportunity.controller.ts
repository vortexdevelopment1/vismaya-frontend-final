import { Request, Response } from "express";
import mongoose from "mongoose";
import Opportunity from "../models/opportunity.model.js";
import Project from "../models/project.model.js";
import Organization from "../models/organization.model.js";
import Application from "../models/application.model.js";
import TalentProfile from "../models/talentProfile.model.js";
import Report from "../models/report.model.js";
import { escapeRegex } from "../utils/sanitize.util.js";
import { validateOpportunityCreate, validateOpportunityUpdate } from "../validators/opportunity.validator.js";

const getApplicantCountApprox = (count: number): string => {
    if (count < 10) return "Under 10";
    if (count < 50) return "10+";
    if (count < 100) return "50+";
    return "100+";
};

/** Resolve a project without ever allowing an organization to reference another org's project. */
const resolveOpportunityProject = async (
    organizationId: any,
    projectId?: unknown,
    projectName?: unknown
) => {
    if (projectId) {
        if (!mongoose.isValidObjectId(String(projectId))) {
            return { error: { status: 400, message: "Invalid project ID" } };
        }
        const project = await Project.findById(String(projectId));
        if (!project) return { error: { status: 404, message: "Project not found" } };
        if (String(project.organizationId) !== String(organizationId)) {
            return { error: { status: 403, message: "You can only use projects from your own organization" } };
        }
        return { project };
    }

    const normalizedName = typeof projectName === "string" ? projectName.trim() : "";
    if (normalizedName) {
        const exactName = new RegExp(`^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
        let project = await Project.findOne({ organizationId, projectName: exactName });
        if (!project) {
            project = await Project.create({
                organizationId,
                projectName: normalizedName,
                projectType: "Casting",
                description: "Project created automatically for a casting opportunity.",
                status: "active"
            });
        }
        return { project };
    }

    let project = await Project.findOne({ organizationId, isSystemDefault: true });
    if (!project) {
        project = await Project.create({
            organizationId,
            projectName: "General Casting",
            projectType: "Casting",
            description: "System default project for casting opportunities.",
            isSystemDefault: true,
            status: "active"
        });
    }
    return { project };
};

const computeEligibilityMatch = (opportunity: any, profile: any): { matches: boolean; missing: string[] } => {
    if (!profile) return { matches: true, missing: [] };
    const missing: string[] = [];

    const oppEl = opportunity.eligibility || {};

    // 1. Profession Match
    if (oppEl.professions && oppEl.professions.length > 0) {
        const talentProfessions = [
            profile.primaryProfession,
            ...(profile.secondaryProfessions || []),
            profile.primaryDepartment,
            profile.primaryDesignation
        ].filter(Boolean).map((p: string) => p.toLowerCase().trim());

        const hasProfMatch = oppEl.professions.some((p: string) =>
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
        const talentLangs = (profile.languages || []).map((l: any) => (l.language || "").toLowerCase().trim());
        const missingLangs = oppEl.languages.filter((l: string) => !talentLangs.includes(l.toLowerCase().trim()));
        if (missingLangs.length > 0) {
            missing.push(`Missing language proficiency: ${missingLangs.join(", ")}`);
        }
    }

    // 4. City / Location Match
    if (oppEl.workingCities && oppEl.workingCities.length > 0) {
        const talentCities = [profile.currentCity, ...(profile.workingCities || [])].filter(Boolean).map((c: string) => c.toLowerCase().trim());
        const hasCityMatch = oppEl.workingCities.some((c: string) => talentCities.includes(c.toLowerCase().trim()));
        if (!hasCityMatch && !profile.willingToTravel && !profile.openToWorkAnywhere) {
            missing.push(`Location preference: ${oppEl.workingCities.join(", ")}`);
        }
    }

    // 5. Skills Match
    if (oppEl.skills && oppEl.skills.length > 0) {
        const talentSkills = (profile.skills || []).map((s: any) => (s.name || "").toLowerCase().trim());
        const missingSkills = oppEl.skills.filter((s: string) => !talentSkills.includes(s.toLowerCase().trim()));
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
const formatOpportunityForUser = (opportunity: any, userRole?: string, isOwner?: boolean, applicantCount = 0, talentProfile: any = null): any => {
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

export const createOpportunity = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
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
            projectName,
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

        let organization = await Organization.findOne({ userId });

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        const resolved = await resolveOpportunityProject(organization._id, projectId, projectName);
        if (resolved.error) return res.status(resolved.error.status).json({ success: false, message: resolved.error.message });
        const project = resolved.project!;

        // O2: Opportunity submission requires an isPaid org in production
        if (process.env.NODE_ENV === "production" && !req.user?.isPaid) {
            return res.status(403).json({
                success: false,
                message: "Active paid organization membership is required to submit opportunities"
            });
        }

        const opportunity = await Opportunity.create({
            projectId: project._id,
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

        await opportunity.populate("projectId", "projectName");
        res.status(201).json({
            success: true,
            message: "Opportunity submitted successfully and is pending Vismaya review",
            opportunity: formatOpportunityForUser(opportunity, req.user?.role, true)
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
export const updateOpportunity = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { opportunityId } = req.params;
        const validation = validateOpportunityUpdate(req.body);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.errors[0]
            });
        }

        const opportunity = await Opportunity.findById(String(opportunityId));
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

        if (req.body.projectId !== undefined || req.body.projectName !== undefined) {
            const resolved = await resolveOpportunityProject(organization._id, req.body.projectId, req.body.projectName);
            if (resolved.error) return res.status(resolved.error.status).json({ success: false, message: resolved.error.message });
            opportunity.projectId = resolved.project!._id;
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
                    (opportunity as any)[field] = req.body[field];
                }
            }
        }

        // O2: Editing a published opportunity moves it back to under_vismaya_review
        if (isPublishedEdit || opportunity.status === "corrections_requested" || req.body.resubmit) {
            opportunity.status = "under_vismaya_review";
            opportunity.resubmittedAt = new Date();
        }

        await opportunity.save();
        await opportunity.populate("projectId", "projectName");

        res.status(200).json({
            success: true,
            message: opportunity.status === "under_vismaya_review"
                ? "Opportunity resubmitted for Vismaya review"
                : "Opportunity updated successfully",
            opportunity: formatOpportunityForUser(opportunity, req.user?.role, true)
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
export const completeOpportunity = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { opportunityId } = req.params;

        const opportunity = await Opportunity.findById(String(opportunityId));
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
            opportunity: formatOpportunityForUser(opportunity, req.user?.role, true)
        });

    } catch (error) {
        console.error("Complete opportunity error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while requesting opportunity completion"
        });
    }
};

export const getPublishedOpportunities = async (req: Request, res: Response): Promise<any> => {
    try {
        const { profession, city, keyword, search, page = 1, limit = 20 } = req.query;
        const searchTerm = keyword || search;

        const now = new Date();
        const andFilters: any[] = [
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

        const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 20, 1), 50);
        const skip = (pageNum - 1) * limitNum;

        const [opportunities, total] = await Promise.all([
            Opportunity.find(filter)
                .populate("projectId", "projectName")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Opportunity.countDocuments(filter)
        ]);

        let talentProfile: any = null;
        if (req.user?.role === "talent") {
            talentProfile = await TalentProfile.findOne({ userId: req.user.userId }).lean();
        }

        // Get applicant count for each opportunity
        const oppObjectIds = opportunities.map(o => new mongoose.Types.ObjectId(o._id));
        const oppIdStrings = opportunities.map(o => o._id.toString());
        const appCounts = await Application.aggregate([
            { $match: { opportunityId: { $in: [...oppObjectIds, ...oppIdStrings] } } },
            { $group: { _id: "$opportunityId", count: { $sum: 1 } } }
        ]);

        const appCountMap: Record<string, number> = {};
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

export const getOpportunityById = async (req: Request, res: Response): Promise<any> => {
    try {
        const { opportunityId } = req.params;

        const opportunity = await Opportunity.findById(String(opportunityId))
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
        const isClosed = opportunity.status === "closed" || (opportunity.deadline ? now > new Date(opportunity.deadline) : false);

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

        let talentProfile: any = null;
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

export const requestOpportunityCancellation = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { opportunityId } = req.params;
        const { cancellationReason } = req.body;

        if (!cancellationReason) {
            return res.status(400).json({
                success: false,
                message: "Cancellation reason is required"
            });
        }

        const opportunity = await Opportunity.findById(String(opportunityId));
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
        opportunity.cancellationRequest = {
            requestedBy: userId as any,
            reason: cancellationReason,
            requestedAt: new Date(),
            decision: "pending"
        };

        await opportunity.save();

        res.status(200).json({
            success: true,
            message: "Cancellation request submitted for Vismaya review",
            opportunity: formatOpportunityForUser(opportunity, req.user?.role, true)
        });

    } catch (error) {
        console.error("Request opportunity cancellation error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while submitting cancellation request"
        });
    }
};

export const getOrganizationOpportunities = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;

        let organization = await Organization.findOne({ userId });
        if (!organization && req.user?.role === "admin") {
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

        const oppIds = opportunities.map(o => o._id.toString());
        const oppObjectIds = opportunities.map(o => new mongoose.Types.ObjectId(o._id));
        const appCounts = await Application.aggregate([
            { $match: { opportunityId: { $in: [...oppObjectIds, ...oppIds] } } },
            { $group: { _id: { oppId: "$opportunityId", status: "$status" }, count: { $sum: 1 } } }
        ]);

        const statsMap: Record<string, { applied: number; under_review: number; shortlisted: number; selected: number; not_selected: number; total: number }> = {};
        for (const id of oppIds) {
            statsMap[id] = { applied: 0, under_review: 0, shortlisted: 0, selected: 0, not_selected: 0, total: 0 };
        }
        for (const row of appCounts) {
            const oppId = String(row._id.oppId);
            const rawStatus = String(row._id.status || "").toLowerCase().trim();
            const normalizedStatus = rawStatus.replace(/[\s-]+/g, "_");
            if (statsMap[oppId]) {
                statsMap[oppId].total += row.count;
                if (normalizedStatus === "applied") statsMap[oppId].applied += row.count;
                else if (normalizedStatus === "under_review") statsMap[oppId].under_review += row.count;
                else if (normalizedStatus === "shortlisted") statsMap[oppId].shortlisted += row.count;
                else if (normalizedStatus === "selected") statsMap[oppId].selected += row.count;
                else if (normalizedStatus === "not_selected" || normalizedStatus === "rejected") statsMap[oppId].not_selected += row.count;
            }
        }

        const formatted = opportunities.map(o => {
            const formattedOpp = formatOpportunityForUser(o, "organization", true);
            formattedOpp.applicantStats = statsMap[o._id.toString()] || { applied: 0, under_review: 0, shortlisted: 0, selected: 0, not_selected: 0, total: 0 };
            return formattedOpp;
        });

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
export const reportOpportunity = async (req: Request, res: Response): Promise<any> => {
    try {
        const talentId = req.user?.userId;
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
            opportunityId: String(opportunityId),
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
            targetId: String(opportunityId),
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
            targetId: String(opportunityId),
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
