const Application = require("../models/application.model");
const Opportunity = require("../models/opportunity.model");
const Project = require("../models/project.model");
const Organization = require("../models/organization.model");
const TalentProfile = require("../models/talentProfile.model");
const CreditViewHistory = require("../models/creditViewHistory.model");
const ProjectShortlist = require("../models/projectShortlist.model");
const User = require("../models/user.model");
const { notifyUser } = require("../services/notification.service");

const applyForOpportunity = async (req, res) => {
    try {
        const talentId = req.user.userId;
        const opportunityId = req.params.opportunityId || req.body.opportunityId;
        const { coverNote, consentGiven } = req.body;
        const customAnswers = req.body.customAnswers || req.body.answers;

        // 1. Check if opportunity exists
        const opportunity = await Opportunity.findById(opportunityId);
        if (!opportunity) {
            return res.status(404).json({
                success: false,
                message: "Opportunity not found"
            });
        }

        // 2. Validate paid membership gate (A7)
        const profile = await TalentProfile.findOne({ userId: talentId });
        if (!profile || (!profile.isPaid && !req.user.isPaid)) {
            return res.status(403).json({
                success: false,
                message: "Paid talent membership is required to apply for opportunities"
            });
        }

        // 3. O6: Require explicit consentGiven === true
        if (consentGiven !== true) {
            return res.status(400).json({
                success: false,
                message: "Explicit consent is mandatory to submit an application."
            });
        }

        // 4. Only published opportunities can receive applications
        if (opportunity.status !== "published") {
            return res.status(400).json({
                success: false,
                message: "Applications are allowed only for published opportunities"
            });
        }

        // 5. Check if deadline has passed
        if (new Date() > new Date(opportunity.deadline)) {
            return res.status(400).json({
                success: false,
                message: "Application deadline has passed"
            });
        }

        // 6. Validate completion >= 60%
        if (profile.profileCompletionPercentage < 60) {
            return res.status(400).json({
                success: false,
                message: `Minimum 60% profile completion is required to apply for opportunities (current: ${profile.profileCompletionPercentage}%). Please update your profile.`
            });
        }

        // 5. Check Max Active Applications Limit
        const maxActive = parseInt(process.env.MAX_ACTIVE_APPLICATIONS, 10) || 20;
        const activeAppsCount = await Application.countDocuments({
            talentId,
            status: { $in: ["applied", "under_review", "shortlisted"] }
        });

        if (activeAppsCount >= maxActive) {
            return res.status(400).json({
                success: false,
                message: `You have reached the maximum limit of ${maxActive} active applications.`
            });
        }

        // 6. Validate required custom questions
        if (opportunity.customQuestions && opportunity.customQuestions.length > 0) {
            for (const q of opportunity.customQuestions) {
                if (q.isRequired) {
                    const providedAnswer = (customAnswers || []).find(
                        a => (a.questionId && String(a.questionId) === String(q._id)) ||
                             (a.questionText && a.questionText.trim() === q.questionText.trim())
                    );
                    if (!providedAnswer || !providedAnswer.answerText || !providedAnswer.answerText.trim()) {
                        return res.status(400).json({
                            success: false,
                            message: `Answer is required for question: "${q.questionText}"`
                        });
                    }
                }
            }
        }

        // 7. Compute eligibility warnings
        const warnings = [];
        const oppEl = opportunity.eligibility || {};
        if (oppEl.professions && oppEl.professions.length > 0) {
            const hasProfMatch = oppEl.professions.some(p =>
                p.toLowerCase() === (profile.primaryProfession || "").toLowerCase()
            );
            if (!hasProfMatch) warnings.push("Profession does not strictly match preferred criteria");
        }

        // 8. Check for existing application
        const existingApplication = await Application.findOne({
            opportunityId,
            talentId
        });

        if (existingApplication) {
            if (existingApplication.status === "withdrawn") {
                if (!existingApplication.reapplicationApproved) {
                    return res.status(403).json({
                        success: false,
                        message: "You have previously withdrawn from this opportunity. Reapplication requires explicit admin approval."
                    });
                }

                // Approved reapplication: re-run application
                existingApplication.status = "applied";
                existingApplication.coverNote = coverNote || existingApplication.coverNote;
                existingApplication.customAnswers = customAnswers || existingApplication.customAnswers;
                existingApplication.consentGiven = true;
                existingApplication.reapplicationApproved = false;
                existingApplication.reapplicationRequested = false;
                existingApplication.withdrawalReason = undefined;
                existingApplication.withdrawnAt = undefined;
                existingApplication.eligibilityWarnings = warnings;

                await existingApplication.save();

                await notifyUser({
                    recipientId: talentId,
                    type: "application_submitted",
                    title: "Reapplication Submitted",
                    message: `Your reapplication for '${opportunity.title}' has been submitted successfully.`
                });

                return res.status(200).json({
                    success: true,
                    message: "Reapplication submitted successfully",
                    application: existingApplication
                });
            }

            return res.status(409).json({
                success: false,
                message: "You have already applied for this opportunity"
            });
        }

        // 9. Create fresh application
        const application = await Application.create({
            opportunityId,
            talentId,
            coverNote,
            customAnswers: customAnswers || [],
            consentGiven: true,
            eligibilityWarnings: warnings,
            status: "applied"
        });

        await notifyUser({
            recipientId: talentId,
            type: "application_submitted",
            title: "Application Submitted",
            message: `Your application for '${opportunity.title}' has been submitted successfully.`
        });

        res.status(201).json({
            success: true,
            message: "Application submitted successfully",
            application
        });

    } catch (error) {
        console.error("Apply for opportunity error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while applying for opportunity"
        });
    }
};

const getMyApplications = async (req, res) => {
    try {
        const talentId = req.user.userId;

        const applications = await Application.find({
            talentId
        })
            .populate({
                path: "opportunityId",
                select: "title summary role location deadline status projectId",
                populate: {
                    path: "projectId",
                    select: "projectName projectType"
                }
            })
            .sort({ createdAt: -1 })
            .lean();

        // O5: Remove remuneration from populated fields
        const sanitized = applications.map(app => {
            if (app.opportunityId) {
                delete app.opportunityId.remuneration;
            }
            return app;
        });

        res.status(200).json({
            success: true,
            count: sanitized.length,
            applications: sanitized
        });

    } catch (error) {
        console.error("Get my applications error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching your applications"
        });
    }
};

const withdrawApplication = async (req, res) => {
    try {
        const talentId = req.user.userId;
        const { applicationId } = req.params;
        const { confirm } = req.body;
        const withdrawalReason = req.body.withdrawalReason || req.body.reason;

        // O6: Require reason AND confirm: true
        if (!withdrawalReason || !withdrawalReason.trim() || confirm !== true) {
            return res.status(400).json({
                success: false,
                message: "Withdrawal reason and explicit confirmation (confirm: true) are required."
            });
        }

        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        if (application.talentId.toString() !== talentId) {
            return res.status(403).json({
                success: false,
                message: "You can only withdraw your own application"
            });
        }

        if (application.status === "withdrawn") {
            return res.status(400).json({
                success: false,
                message: "Application is already withdrawn"
            });
        }

        if (["selected", "not_selected"].includes(application.status)) {
            return res.status(400).json({
                success: false,
                message: `Application cannot be withdrawn once final decision is made (${application.status})`
            });
        }

        application.status = "withdrawn";
        application.withdrawalReason = withdrawalReason.trim();
        application.withdrawnAt = new Date();

        await application.save();

        res.status(200).json({
            success: true,
            message: "Application withdrawn successfully",
            application
        });

    } catch (error) {
        console.error("Withdraw application error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while withdrawing application"
        });
    }
};

const requestReapplication = async (req, res) => {
    try {
        const talentId = req.user.userId;
        const { applicationId } = req.params;
        const { reason } = req.body;

        if (!reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: "Reapplication request reason is mandatory"
            });
        }

        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        if (application.talentId.toString() !== talentId) {
            return res.status(403).json({
                success: false,
                message: "You can only request reapplication for your own withdrawn application"
            });
        }

        if (application.status !== "withdrawn") {
            return res.status(400).json({
                success: false,
                message: "Reapplication can only be requested for withdrawn applications"
            });
        }

        application.reapplicationRequested = true;
        application.reapplicationRequestedAt = new Date();
        application.reapplicationRequestReason = reason.trim();
        application.reapplicationApproved = false;

        await application.save();

        res.status(200).json({
            success: true,
            message: "Reapplication request submitted for Vismaya admin review",
            application
        });

    } catch (error) {
        console.error("Request reapplication error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while requesting reapplication"
        });
    }
};

const getOpportunityApplications = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { opportunityId } = req.params;
        const { status } = req.query;

        const opportunity = await Opportunity.findById(opportunityId);
        if (!opportunity) {
            return res.status(404).json({
                success: false,
                message: "Opportunity not found"
            });
        }

        const project = await Project.findById(opportunity.projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        const organization = await Organization.findOne({ userId });
        if (!organization || project.organizationId.toString() !== organization._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only view applications for your own opportunities"
            });
        }

        const filter = { opportunityId };
        if (status) {
            filter.status = status;
        }

        const applications = await Application.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        const talentUserIds = applications.map(a => a.talentId);
        const [profiles, viewHistories] = await Promise.all([
            TalentProfile.find({ userId: { $in: talentUserIds } }).lean(),
            CreditViewHistory.find({
                organizationId: organization._id,
                talentId: { $in: talentUserIds },
                exemptionExpiresAt: { $gt: new Date() }
            }).lean()
        ]);

        const profileMap = {};
        for (const p of profiles) {
            profileMap[p.userId.toString()] = p;
        }

        const unlockedSet = new Set(viewHistories.map(v => v.talentId.toString()));

        // O5: Return name + vismayaId + application data; NEVER email/mobile
        const sanitizedApplicants = applications.map(app => {
            const profile = profileMap[app.talentId.toString()];
            const isUnlocked = unlockedSet.has(app.talentId.toString());

            return {
                _id: app._id,
                opportunityId: app.opportunityId,
                talentId: app.talentId,
                vismayaId: profile?.vismayaId,
                name: profile ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || profile.stageName : "Talent Applicant",
                stageName: profile?.stageName,
                headline: profile?.headline,
                profilePhoto: profile?.profilePhoto,
                primaryProfession: profile?.primaryProfession,
                skills: (profile?.skills || []).slice(0, 5),
                status: app.status,
                coverNote: app.coverNote,
                customAnswers: app.customAnswers,
                eligibilityWarnings: app.eligibilityWarnings,
                profileUnlockRequired: !isUnlocked,
                createdAt: app.createdAt
            };
        });

        res.status(200).json({
            success: true,
            count: sanitizedApplicants.length,
            applicants: sanitizedApplicants
        });

    } catch (error) {
        console.error("Get opportunity applications error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching applications"
        });
    }
};

const markApplicationUnderReview = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { applicationId } = req.params;

        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        const opportunity = await Opportunity.findById(application.opportunityId);
        const project = await Project.findById(opportunity?.projectId);
        const organization = await Organization.findOne({ userId });

        if (!organization || !project || project.organizationId.toString() !== organization._id.toString()) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        application.status = "under_review";
        await application.save();

        res.status(200).json({
            success: true,
            message: "Application moved to under review",
            application
        });
    } catch (error) {
        console.error("Mark under review error:", error);
        res.status(500).json({ success: false, message: "Failed to update application" });
    }
};

const shortlistApplication = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { applicationId } = req.params;

        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        const opportunity = await Opportunity.findById(application.opportunityId);
        const project = await Project.findById(opportunity?.projectId);
        const organization = await Organization.findOne({ userId });

        if (!organization || !project || project.organizationId.toString() !== organization._id.toString()) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        application.status = "shortlisted";
        await application.save();

        // Auto-add to ProjectShortlist
        const profile = await TalentProfile.findOne({ userId: application.talentId });
        if (profile) {
            await ProjectShortlist.findOneAndUpdate(
                { projectId: project._id, talentId: application.talentId, role: opportunity.role },
                {
                    $setOnInsert: {
                        opportunityId: opportunity._id,
                        organizationId: organization._id,
                        talentProfileId: profile._id,
                        status: "shortlisted",
                        addedBy: userId
                    }
                },
                { upsert: true }
            );
        }

        await notifyUser({
            recipientId: application.talentId,
            type: "application_status_changed",
            title: "Application Shortlisted",
            message: `Congratulations! Your application for '${opportunity.title}' has been shortlisted.`
        });

        res.status(200).json({
            success: true,
            message: "Application shortlisted successfully",
            application
        });
    } catch (error) {
        console.error("Shortlist application error:", error);
        res.status(500).json({ success: false, message: "Failed to shortlist application" });
    }
};

const selectApplication = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { applicationId } = req.params;

        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        const opportunity = await Opportunity.findById(application.opportunityId);
        const project = await Project.findById(opportunity?.projectId);
        const organization = await Organization.findOne({ userId });

        if (!organization || !project || project.organizationId.toString() !== organization._id.toString()) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        application.status = "selected";
        application.selectedAt = new Date();
        application.selectedBy = userId;
        await application.save();

        // Update ProjectShortlist status to selected
        await ProjectShortlist.findOneAndUpdate(
            { projectId: project._id, talentId: application.talentId, role: opportunity.role },
            { $set: { status: "selected" } }
        );

        await notifyUser({
            recipientId: application.talentId,
            type: "selected",
            title: "Application Selected",
            message: `Congratulations! You have been selected for '${opportunity.title}'.`
        });

        res.status(200).json({
            success: true,
            message: "Application marked as selected",
            application
        });
    } catch (error) {
        console.error("Select application error:", error);
        res.status(500).json({ success: false, message: "Failed to select application" });
    }
};

const rejectApplication = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { applicationId } = req.params;
        const { reason } = req.body;

        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        const opportunity = await Opportunity.findById(application.opportunityId);
        const project = await Project.findById(opportunity?.projectId);
        const organization = await Organization.findOne({ userId });

        if (!organization || !project || project.organizationId.toString() !== organization._id.toString()) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        application.status = "not_selected";
        application.notSelectedAt = new Date();
        application.notSelectedReason = reason || "Not selected";
        await application.save();

        await notifyUser({
            recipientId: application.talentId,
            type: "not_selected",
            title: "Application Update",
            message: `Your application for '${opportunity.title}' was not selected.`
        });

        res.status(200).json({
            success: true,
            message: "Application marked as not selected",
            application
        });
    } catch (error) {
        console.error("Reject application error:", error);
        res.status(500).json({ success: false, message: "Failed to reject application" });
    }
};

module.exports = {
    applyForOpportunity,
    getMyApplications,
    withdrawApplication,
    requestReapplication,
    getOpportunityApplications,
    markApplicationUnderReview,
    shortlistApplication,
    selectApplication,
    rejectApplication,
    markNotSelected: rejectApplication
};