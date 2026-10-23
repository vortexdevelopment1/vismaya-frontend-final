import { Request, Response } from "express";
import mongoose from "mongoose";
import Application from "../models/application.model.js";
import Opportunity from "../models/opportunity.model.js";
import Project from "../models/project.model.js";
import Organization from "../models/organization.model.js";
import TalentProfile from "../models/talentProfile.model.js";
import CreditViewHistory from "../models/creditViewHistory.model.js";
import ProjectShortlist from "../models/projectShortlist.model.js";
import MediaItem from "../models/mediaItem.model.js";
import Verification from "../models/verification.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import { notifyUser } from "../services/notification.service.js";
import { calculateAge } from "../validators/talentProfile.validator.js";

export const applyForOpportunity = async (req: Request, res: Response): Promise<any> => {
    try {
        const talentId = req.user?.userId;
        const opportunityId = req.params.opportunityId || req.body.opportunityId;
        const { coverNote, consentGiven } = req.body;
        const customAnswers = req.body.customAnswers || req.body.answers;

        // 1. Check if opportunity exists
        const opportunity = await Opportunity.findById(String(opportunityId));
        if (!opportunity) {
            return res.status(404).json({
                success: false,
                message: "Opportunity not found"
            });
        }

        // 2. Cancelled opportunities check (Part A D6b)
        if (opportunity.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Cannot apply to a cancelled opportunity"
            });
        }

        // 3. Validate paid membership gate (A7)
        const profile = await TalentProfile.findOne({ userId: talentId });
        if (!profile || (!profile.isPaid && !req.user?.isPaid)) {
            return res.status(403).json({
                success: false,
                message: "Paid talent membership is required to apply for opportunities"
            });
        }

        // 3b. Validate profile approval gate (only talent with approved profile can apply)
        const isApproved = Boolean(profile.isProfileApproved || profile.status === "approved" || profile.status === "active");
        if (!isApproved) {
            return res.status(403).json({
                success: false,
                message: "Profile approval required. Only talent with an approved profile can apply for opportunities."
            });
        }

        // 4. O6: Require explicit consentGiven === true
        if (consentGiven !== true) {
            return res.status(400).json({
                success: false,
                message: "Explicit consent is mandatory to submit an application."
            });
        }

        // 5. Only published opportunities can receive applications
        if (opportunity.status !== "published") {
            return res.status(400).json({
                success: false,
                message: "Applications are allowed only for published opportunities"
            });
        }

        // 5. Check if deadline has passed
        if (opportunity.deadline && new Date() > new Date(opportunity.deadline)) {
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
        const maxActive = parseInt(process.env.MAX_ACTIVE_APPLICATIONS || "", 10) || 20;
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
                        (a: any) => (a.questionId && String(a.questionId) === String(q._id)) ||
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
        const warnings: string[] = [];
        const oppEl = (opportunity.eligibility || {}) as any;
        if (oppEl.professions && oppEl.professions.length > 0) {
            const hasProfMatch = oppEl.professions.some((p: string) =>
                p.toLowerCase() === (profile.primaryProfession || "").toLowerCase()
            );
            if (!hasProfMatch) warnings.push("Profession does not strictly match preferred criteria");
        }

        // 8. Check for existing application
        const existingApplication = await Application.findOne({
            opportunityId: String(opportunityId),
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
            opportunityId: String(opportunityId),
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

export const getMyApplications = async (req: Request, res: Response): Promise<any> => {
    try {
        const talentId = req.user?.userId;

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
        const sanitized = applications.map((app: any) => {
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

export const withdrawApplication = async (req: Request, res: Response): Promise<any> => {
    try {
        const talentId = req.user?.userId;
        const { applicationId } = req.params;
        const { confirm } = req.body;
        const withdrawalReason = req.body.withdrawalReason || req.body.reason;

        const application = await Application.findById(String(applicationId));
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

        const opportunity = await Opportunity.findById(application.opportunityId);

        if (opportunity?.status === "cancelled" || application.status === "opportunity_cancelled") {
            return res.status(400).json({
                success: false,
                message: "Cannot withdraw an application for a cancelled opportunity"
            });
        }

        // O6: Require reason AND confirm: true
        if (!withdrawalReason || !withdrawalReason.trim() || confirm !== true) {
            return res.status(400).json({
                success: false,
                message: "Withdrawal reason and explicit confirmation (confirm: true) are required."
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

        // Notify organization user (Part C)
        try {
            const project = await Project.findById(opportunity?.projectId);
            const orgId = (opportunity as any)?.organizationId || project?.organizationId;
            const org = await Organization.findById(orgId);
            const talentUser = await User.findById(talentId);

            if (org && org.userId) {
                const existingNotif = await Notification.findOne({
                    recipient: org.userId,
                    referenceId: application._id,
                    type: "application_withdrawn"
                });
                if (!existingNotif) {
                    await notifyUser({
                        recipientId: org.userId,
                        type: "application_withdrawn",
                        title: "Application Withdrawn",
                        message: `${talentUser?.name || "An applicant"} has withdrawn their application for "${opportunity?.title || "Opportunity"}". Reason: ${application.withdrawalReason}`,
                        referenceId: application._id,
                        referenceType: "Application",
                        sendEmailAlert: true
                    });
                }
            }
        } catch (notifErr: any) {
            console.error("Failed to notify org about application withdrawal:", notifErr.message);
        }

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

export const requestReapplication = async (req: Request, res: Response): Promise<any> => {
    try {
        const talentId = req.user?.userId;
        const { applicationId } = req.params;
        const { reason } = req.body;

        if (!reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: "Reapplication request reason is mandatory"
            });
        }

        const application = await Application.findById(String(applicationId));
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

export const getOpportunityApplications = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { opportunityId } = req.params;
        const { status } = req.query;

        const opportunity = await Opportunity.findById(String(opportunityId));
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

        const oppObjectId = mongoose.Types.ObjectId.isValid(String(opportunityId))
            ? new mongoose.Types.ObjectId(String(opportunityId))
            : opportunityId;
        const filter: any = {
            $or: [
                { opportunityId: oppObjectId },
                { opportunityId: String(opportunityId) }
            ]
        };
        if (status) {
            const normalizedStatus = String(status).toLowerCase().trim().replace(/[\s-]+/g, "_");
            filter.status = { $regex: new RegExp(`^${normalizedStatus}$`, "i") };
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

        const profileMap: Record<string, any> = {};
        for (const p of profiles) {
            profileMap[p.userId.toString()] = p;
        }

        const unlockedSet = new Set(viewHistories.map(v => v.talentId.toString()));

        // O5: Return name + vismayaId + application data; NEVER email/mobile
        const sanitizedApplicants = applications.map((app: any) => {
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
                consentGiven: app.consentGiven,
                eligibilityWarnings: app.eligibilityWarnings,
                profileUnlockRequired: false, // Applicant profile view is exempt from credits per client spec
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

/**
 * Get Applicant Portfolio
 * Full applicant portfolio view under Section 39 privacy rules:
 * - Public and Industry-only items returned; Private items NEVER.
 * - Disputed/hidden items NEVER.
 * - Strips forbidden contact info (email, phone, guardian) and hidden attributes (physical, remuneration).
 * - Direct applicant viewing from own opportunity does NOT consume a profile-view credit.
 */
export const getApplicantPortfolio = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { applicationId } = req.params;

        const application = await Application.findById(String(applicationId));
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        const opportunity = await Opportunity.findById(application.opportunityId);
        if (!opportunity) {
            return res.status(404).json({ success: false, message: "Opportunity not found" });
        }

        const project = await Project.findById(opportunity.projectId);
        const organization = await Organization.findOne({ userId });

        if (!organization || !project || project.organizationId.toString() !== organization._id.toString()) {
            return res.status(403).json({ success: false, message: "Access denied. You can only view applicants of your own opportunities." });
        }

        const profile = await TalentProfile.findOne({ userId: application.talentId });
        if (!profile) {
            return res.status(404).json({ success: false, message: "Talent profile not found for this applicant" });
        }

        // Verification Badges
        const verifications = await Verification.find({
            userId: application.talentId,
            status: "verified"
        }).select("verificationType");

        const verificationBadges = {
            identityVerified: verifications.some(v => v.verificationType === "identity") || Boolean(profile.isVerified),
            professionalVerified: verifications.some(v => v.verificationType === "professional")
        };

        // Media items: only public & industry_only, not disputed, not restricted/removed
        const mediaItems = await MediaItem.find({
            owner: application.talentId,
            visibility: { $in: ["public", "industry_only"] },
            disputeState: { $ne: "disputed" },
            moderationState: { $nin: ["restricted", "removed"] }
        }).sort({ displayOrder: 1, createdAt: -1 }).lean();

        const photos = mediaItems.filter(m => m.mediaType === "photo");
        const videos = mediaItems.filter(m => m.mediaType === "video");
        const documents = mediaItems.filter(m => m.mediaType === "document");
        const externalLinks = mediaItems.filter(m => m.mediaType === "external_link");

        // Section 39 Clean Portfolio (no email, mobile, guardian, physical, remuneration, exact DOB)
        const rawApplicantDob = profile.dob || (profile as any).dateOfBirth;
        const applicantAge = rawApplicantDob ? calculateAge(rawApplicantDob) : (typeof (profile as any).age === "number" ? (profile as any).age : null);
        let applicantAgeRange: string | undefined = undefined;
        if (applicantAge !== null) {
            if (applicantAge < 18) applicantAgeRange = "Under 18";
            else if (applicantAge <= 25) applicantAgeRange = "18-25";
            else if (applicantAge <= 35) applicantAgeRange = "26-35";
            else if (applicantAge <= 50) applicantAgeRange = "36-50";
            else applicantAgeRange = "50+";
        }

        const safePortfolio = {
            vismayaId: profile.vismayaId,
            name: `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || profile.stageName || "Talent Candidate",
            stageName: profile.stageName,
            firstName: profile.firstName,
            lastName: profile.lastName,
            headline: profile.headline,
            bio: profile.bio,
            profilePhoto: profile.profilePhoto,
            category: profile.category,
            primaryProfession: profile.primaryProfession,
            secondaryProfessions: profile.secondaryProfessions || [],
            primaryDepartment: profile.primaryDepartment,
            primaryDesignation: profile.primaryDesignation,
            specializations: profile.specializations || [],
            careerStage: profile.careerStage,
            age: applicantAge,
            ageRange: applicantAgeRange,
            currentCity: profile.currentCity,
            currentState: profile.currentState,
            country: profile.country,
            workingCities: profile.workingCities || [],
            skills: profile.skills || [],
            languages: profile.languages || [],
            credits: (profile.credits || []).map((c: any) => ({
                _id: c._id,
                projectTitle: c.projectTitle,
                projectType: c.projectType,
                projectStatus: c.projectStatus,
                roleOrDesignation: c.roleOrDesignation,
                year: c.year,
                directorOrProduction: c.directorOrProduction,
                characterName: c.characterName,
                referenceLink: c.referenceLink,
                isVerifiedCredit: c.isVerifiedCredit
            })),
            training: profile.training || [],
            awards: profile.awards || [],
            verificationBadges,
            media: {
                photos,
                videos,
                documents,
                externalLinks
            },
            profileCompletionPercentage: profile.profileCompletionPercentage,
            creditConsumed: false,
            creditExemptReason: "Direct application to organization opportunity"
        };

        const applicationDetails = {
            _id: application._id,
            opportunityId: application.opportunityId,
            opportunityTitle: opportunity.title,
            role: opportunity.role,
            projectId: project._id,
            projectName: project.projectName,
            status: application.status,
            coverNote: application.coverNote,
            customAnswers: application.customAnswers || [],
            consentGiven: application.consentGiven,
            eligibilityWarnings: application.eligibilityWarnings || [],
            appliedAt: application.createdAt
        };

        res.status(200).json({
            success: true,
            application: applicationDetails,
            portfolio: safePortfolio
        });
    } catch (error) {
        console.error("Get applicant portfolio error:", error);
        res.status(500).json({ success: false, message: "Failed to retrieve applicant portfolio" });
    }
};

export const markApplicationUnderReview = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { applicationId } = req.params;

        const application = await Application.findById(String(applicationId));
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        const opportunity = await Opportunity.findById(application.opportunityId);
        const project = await Project.findById(opportunity?.projectId);
        const organization = await Organization.findOne({ userId });

        if (!organization || !project || project.organizationId.toString() !== organization._id.toString()) {
            return res.status(403).json({ success: false, message: "Access denied. You can only act on applicants of your own opportunities." });
        }

        // Status Ladder: Applied -> Under Review
        if (application.status === "under_review") {
            return res.status(200).json({
                success: true,
                message: "Application is already under review",
                application
            });
        }

        if (application.status !== "applied") {
            return res.status(400).json({
                success: false,
                message: `Cannot move to 'under_review' from status '${application.status}'. Application must be in 'applied' status.`
            });
        }

        application.status = "under_review";
        await application.save();

        const existingUnderReview = await Notification.findOne({
            recipient: application.talentId,
            referenceId: application._id,
            type: "application_status_changed"
        });
        if (!existingUnderReview) {
            await notifyUser({
                recipientId: application.talentId,
                type: "application_status_changed",
                title: "Application Under Review",
                message: `Your application for '${opportunity?.title}' is now under review.`,
                referenceId: application._id,
                referenceType: "Application",
                sendEmailAlert: true
            });
        }

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

export const shortlistApplication = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { applicationId } = req.params;

        const application = await Application.findById(String(applicationId));
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        const opportunity = await Opportunity.findById(application.opportunityId);
        const project = await Project.findById(opportunity?.projectId);
        const organization = await Organization.findOne({ userId });

        if (!organization || !project || project.organizationId.toString() !== organization._id.toString()) {
            return res.status(403).json({ success: false, message: "Access denied. You can only act on applicants of your own opportunities." });
        }

        // Status Ladder: Under Review (or Applied) -> Shortlisted
        if (application.status === "shortlisted") {
            return res.status(200).json({
                success: true,
                message: "Application is already shortlisted",
                application
            });
        }

        if (["selected", "not_selected", "withdrawn"].includes(application.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot shortlist application from status '${application.status}'.`
            });
        }

        application.status = "shortlisted";
        await application.save();

        // Auto-add to ProjectShortlist
        const profile = await TalentProfile.findOne({ userId: application.talentId });
        if (profile) {
            await ProjectShortlist.findOneAndUpdate(
                { projectId: project._id, talentId: application.talentId, role: opportunity?.role },
                {
                    $setOnInsert: {
                        opportunityId: opportunity?._id,
                        organizationId: organization._id,
                        talentProfileId: profile._id,
                        status: "shortlisted",
                        addedBy: userId
                    }
                },
                { upsert: true }
            );
        }

        // Deduplicated notification for talent on shortlist
        const existingShortlistNotif = await Notification.findOne({
            recipient: application.talentId,
            referenceId: application._id,
            type: "shortlisted"
        });
        if (!existingShortlistNotif) {
            await notifyUser({
                recipientId: application.talentId,
                type: "shortlisted",
                title: "Application Shortlisted",
                message: `You have been shortlisted for ${opportunity?.role || 'the role'} in ${opportunity?.title}`,
                referenceId: application._id,
                referenceType: "Application",
                sendEmailAlert: true
            });
        }

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

export const selectApplication = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { applicationId } = req.params;

        const application = await Application.findById(String(applicationId));
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        const opportunity = await Opportunity.findById(application.opportunityId);
        const project = await Project.findById(opportunity?.projectId);
        const organization = await Organization.findOne({ userId });

        if (!organization || !project || project.organizationId.toString() !== organization._id.toString()) {
            return res.status(403).json({ success: false, message: "Access denied. You can only act on applicants of your own opportunities." });
        }

        // Status Ladder: Shortlisted (or Under Review) -> Selected
        if (application.status === "selected") {
            return res.status(200).json({
                success: true,
                message: "Application is already marked as selected",
                application
            });
        }

        if (application.status === "applied") {
            return res.status(400).json({
                success: false,
                message: "Applicant must be reviewed and shortlisted before final selection."
            });
        }

        if (["not_selected", "withdrawn"].includes(application.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot select application from status '${application.status}'.`
            });
        }

        application.status = "selected";
        application.selectedAt = new Date();
        application.selectedBy = userId as any;
        await application.save();

        // Update ProjectShortlist status to selected
        await ProjectShortlist.findOneAndUpdate(
            { projectId: project._id, talentId: application.talentId, role: opportunity?.role },
            { $set: { status: "selected" } }
        );

        const existingSelectNotif = await Notification.findOne({
            recipient: application.talentId,
            referenceId: application._id,
            type: "selected"
        });
        if (!existingSelectNotif) {
            await notifyUser({
                recipientId: application.talentId,
                type: "selected",
                title: "Application Selected",
                message: `Congratulations! You have been selected for '${opportunity?.role || 'the role'}' in '${opportunity?.title}'.`,
                referenceId: application._id,
                referenceType: "Application",
                sendEmailAlert: true
            });
        }

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

export const rejectApplication = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { applicationId } = req.params;
        const reason = req.body?.reason;

        const application = await Application.findById(String(applicationId));
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        const opportunity = await Opportunity.findById(application.opportunityId);
        const project = await Project.findById(opportunity?.projectId);
        const organization = await Organization.findOne({ userId });

        if (!organization || !project || project.organizationId.toString() !== organization._id.toString()) {
            return res.status(403).json({ success: false, message: "Access denied. You can only act on applicants of your own opportunities." });
        }

        // Status Ladder: Cannot reject already selected or withdrawn
        if (application.status === "not_selected") {
            return res.status(200).json({
                success: true,
                message: "Application is already marked as not selected",
                application
            });
        }

        if (application.status === "selected") {
            return res.status(400).json({
                success: false,
                message: "Cannot mark a selected candidate as not selected."
            });
        }

        if (application.status === "withdrawn") {
            return res.status(400).json({
                success: false,
                message: "Cannot reject a withdrawn application."
            });
        }

        application.status = "not_selected";
        application.notSelectedAt = new Date();
        application.notSelectedReason = reason || "Not selected";
        await application.save();

        const existingRejectNotif = await Notification.findOne({
            recipient: application.talentId,
            referenceId: application._id,
            type: "not_selected"
        });
        if (!existingRejectNotif) {
            await notifyUser({
                recipientId: application.talentId,
                type: "not_selected",
                title: "Application Update",
                message: `Your application for '${opportunity?.role || 'the role'}' in '${opportunity?.title}' was not selected.`,
                referenceId: application._id,
                referenceType: "Application",
                sendEmailAlert: true
            });
        }

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

export const markNotSelected = rejectApplication;
