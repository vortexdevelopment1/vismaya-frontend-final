const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const { connectDB, clearDB, disconnectDB } = require("./helpers/db");

const User = require("../src/models/user.model");
const Organization = require("../src/models/organization.model");
const Project = require("../src/models/project.model");
const Opportunity = require("../src/models/opportunity.model");
const Application = require("../src/models/application.model");
const TalentProfile = require("../src/models/talentProfile.model");
const ProjectShortlist = require("../src/models/projectShortlist.model");
const Report = require("../src/models/report.model");
const AdminAuditLog = require("../src/models/adminAuditLog.model");

const { generateAuthToken } = require("./helpers/auth");

const JWT_SECRET = process.env.JWT_SECRET || "vismaya_test_jwt_secret_must_be_over_32_characters_long_1234567890";

beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = JWT_SECRET;
    await connectDB();
});

beforeEach(async () => {
    await clearDB();
});

afterAll(async () => {
    await disconnectDB();
});

describe("Phase 5: Organization, Projects & Opportunity Engine (O1 - O7)", () => {
    let adminUser, adminToken;
    let orgUser, orgToken, orgProfile, testProject;
    let talentUser, talentToken, talentProfile;

    beforeEach(async () => {
        // Create Admin
        adminUser = await User.create({
            name: "Admin User",
            email: "admin@vismaya.com",
            password: "Password123!",
            role: "admin",
            status: "active",
            isPaid: true
        });
        const adminAuth = await generateAuthToken(adminUser);
        adminToken = adminAuth.token;

        // Create Org User & Org
        orgUser = await User.create({
            name: "Studio Head",
            email: "studio@creative.com",
            password: "Password123!",
            role: "organization",
            status: "active",
            isPaid: true
        });
        const orgAuth = await generateAuthToken(orgUser);
        orgToken = orgAuth.token;

        orgProfile = await Organization.create({
            userId: orgUser._id,
            organizationName: "Creative Production House",
            legalBusinessName: "Creative Production Pvt Ltd",
            slug: "creative-production-house",
            organizationType: "Production House",
            verificationState: "verified",
            description: "Leading film and media production house."
        });

        testProject = await Project.create({
            organizationId: orgProfile._id,
            projectName: "Blockbuster 2026",
            description: "A major feature film",
            status: "active"
        });

        // Create Talent User & Profile
        talentUser = await User.create({
            name: "Jane Actor",
            email: "jane@actor.com",
            mobile: "9876543210",
            password: "Password123!",
            role: "talent",
            status: "active",
            isPaid: true
        });
        const talentAuth = await generateAuthToken(talentUser);
        talentToken = talentAuth.token;

        talentProfile = await TalentProfile.create({
            userId: talentUser._id,
            vismayaId: "VIS-1001",
            stageName: "Jane Star",
            firstName: "Jane",
            lastName: "Doe",
            primaryProfession: "Actor",
            gender: "female",
            age: 26,
            dateOfBirth: new Date("2000-01-01"),
            languages: [{ language: "English", proficiency: "fluent" }, { language: "Hindi", proficiency: "fluent" }],
            experienceYears: 4,
            currentCity: "Mumbai",
            profileCompletionPercentage: 80,
            isSearchable: true
        });
    });

    describe("O1: Organization Profile & Public Company View", () => {
        it("should retrieve public company profile by slug without leaking private identity or verification docs", async () => {
            const res = await request(app)
                .get(`/api/company/${orgProfile.slug}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.organization.organizationName).toBe("Creative Production House");
            expect(res.body.organization.slug).toBe("creative-production-house");
            expect(res.body.organization.verificationDocs).toBeUndefined();
            expect(res.body.organization.legalBusinessName).toBeUndefined();
        });
    });

    describe("O2: Opportunity Creation & Editing", () => {
        it("editing a published opportunity moves status to under_vismaya_review with resubmittedAt timestamp", async () => {
            const opp = await Opportunity.create({
                projectId: testProject._id,
                organizationId: orgProfile._id,
                title: "Lead Actress",
                summary: "Lead actress for feature film",
                role: "Lead",
                description: "Looking for lead actress",
                category: "acting",
                status: "published",
                publishedAt: new Date(),
                positionsCount: 1,
                experienceLevel: "Mid-level",
                locationType: "on-site",
                location: "Mumbai",
                deadline: new Date(Date.now() + 86400000 * 10),
                applicationDeadline: new Date(Date.now() + 86400000 * 10)
            });

            const res = await request(app)
                .put(`/api/opportunities/${opp._id}`)
                .set("Authorization", `Bearer ${orgToken}`)
                .send({
                    title: "Lead Actress - Updated",
                    description: "Updated description for lead actress"
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.opportunity.title).toBe("Lead Actress - Updated");
            expect(res.body.opportunity.status).toBe("under_vismaya_review");
            expect(res.body.opportunity.resubmittedAt).toBeDefined();
        });
    });

    describe("O3: Opportunity Completion & Cancellation Lifecycle", () => {
        it("admin completes opportunity and deletes temporary shortlists", async () => {
            const opp = await Opportunity.create({
                projectId: testProject._id,
                organizationId: orgProfile._id,
                title: "Cinematographer",
                summary: "Cinematographer for feature film",
                role: "Lead",
                location: "Mumbai",
                category: "direction",
                status: "published",
                positionsCount: 1,
                deadline: new Date(Date.now() + 86400000 * 5),
                applicationDeadline: new Date(Date.now() + 86400000 * 5)
            });

            await ProjectShortlist.create({
                projectId: testProject._id,
                opportunityId: opp._id,
                organizationId: orgProfile._id,
                talentId: talentUser._id,
                talentProfileId: talentProfile._id,
                role: "Cinematographer",
                addedBy: orgUser._id
            });

            const completeRes = await request(app)
                .patch(`/api/admin/opportunities/${opp._id}/complete`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(completeRes.status).toBe(200);
            expect(completeRes.body.success).toBe(true);
            expect(completeRes.body.opportunity.status).toBe("completed");
            expect(completeRes.body.opportunity.completedAt).toBeDefined();

            // Verify project shortlists deleted
            const shortlists = await ProjectShortlist.find({ opportunityId: opp._id });
            expect(shortlists.length).toBe(0);
        });

        it("cancellation request stores statusBeforeCancellationRequest and admin reject restores it", async () => {
            const opp = await Opportunity.create({
                projectId: testProject._id,
                organizationId: orgProfile._id,
                title: "Sound Designer",
                summary: "Sound designer for feature film",
                role: "Designer",
                location: "Mumbai",
                category: "music",
                status: "published",
                positionsCount: 1,
                deadline: new Date(Date.now() + 86400000 * 5),
                applicationDeadline: new Date(Date.now() + 86400000 * 5)
            });

            // Recruiter requests cancellation
            const cancelRes = await request(app)
                .post(`/api/opportunities/${opp._id}/request-cancellation`)
                .set("Authorization", `Bearer ${orgToken}`)
                .send({ cancellationReason: "Project postponed" });

            expect(cancelRes.status).toBe(200);
            expect(cancelRes.body.opportunity.status).toBe("cancellation_requested");
            expect(cancelRes.body.opportunity.statusBeforeCancellationRequest).toBe("published");

            // Admin rejects cancellation -> should restore to published
            const reviewRes = await request(app)
                .patch(`/api/admin/opportunities/${opp._id}/review-cancellation`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ action: "reject" });

            expect(reviewRes.status).toBe(200);
            expect(reviewRes.body.opportunity.status).toBe("published");
        });
    });

    describe("O4: Opportunity Discovery & Remuneration Shielding", () => {
        it("returns applicantCountApprox, displayStatus, and eligibilityMatch while shielding remuneration", async () => {
            const opp = await Opportunity.create({
                projectId: testProject._id,
                organizationId: orgProfile._id,
                title: "Female Lead",
                summary: "Lead actor for major project",
                role: "Lead Actor",
                location: "Mumbai",
                category: "acting",
                status: "published",
                publishedAt: new Date(),
                positionsCount: 1,
                minAge: 20,
                maxAge: 30,
                genderPreference: "female",
                requiredProfessions: ["Actor"],
                requiredLanguages: ["Hindi"],
                remunerationMin: 50000,
                remunerationMax: 100000,
                deadline: new Date(Date.now() + 86400000 * 10),
                applicationDeadline: new Date(Date.now() + 86400000 * 10)
            });

            const res = await request(app)
                .get(`/api/opportunities/view/${opp._id}`)
                .set("Authorization", `Bearer ${talentToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.opportunity.remunerationMin).toBeUndefined();
            expect(res.body.opportunity.remunerationMax).toBeUndefined();
            expect(res.body.opportunity.applicantCountApprox).toBeDefined();
            expect(res.body.opportunity.displayStatus).toBe("Open");
            expect(res.body.opportunity.eligibilityMatch).toBeDefined();
            expect(res.body.opportunity.eligibilityMatch.matches).toBe(true);
        });
    });

    describe("O5: Application Submission Gating & Consent", () => {
        let opp;

        beforeEach(async () => {
            opp = await Opportunity.create({
                projectId: testProject._id,
                organizationId: orgProfile._id,
                title: "Lead Actress Role",
                summary: "Lead actress casting call",
                role: "Lead Actress",
                location: "Mumbai",
                category: "acting",
                status: "published",
                publishedAt: new Date(),
                positionsCount: 1,
                deadline: new Date(Date.now() + 86400000 * 5),
                applicationDeadline: new Date(Date.now() + 86400000 * 5),
                customQuestions: [
                    { questionText: "Have you acted in feature films before?", isRequired: true }
                ]
            });
        });

        it("fails application when consentGiven is not true", async () => {
            const res = await request(app)
                .post("/api/applications")
                .set("Authorization", `Bearer ${talentToken}`)
                .send({
                    opportunityId: opp._id,
                    consentGiven: false,
                    answers: [{ questionText: "Have you acted in feature films before?", answerText: "Yes" }]
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/consent/i);
        });

        it("fails application when required custom questions are missing", async () => {
            const res = await request(app)
                .post("/api/applications")
                .set("Authorization", `Bearer ${talentToken}`)
                .send({
                    opportunityId: opp._id,
                    consentGiven: true,
                    answers: []
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/required/i);
        });

        it("successfully applies when consent is given and required questions are answered", async () => {
            const res = await request(app)
                .post("/api/applications")
                .set("Authorization", `Bearer ${talentToken}`)
                .send({
                    opportunityId: opp._id,
                    consentGiven: true,
                    answers: [{ questionText: "Have you acted in feature films before?", answerText: "Yes, 2 films." }]
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.application.status).toBe("applied");
            expect(res.body.application.consentGiven).toBe(true);
        });
    });

    describe("O6: Application Withdrawal Flow", () => {
        it("requires reason and confirm to withdraw application", async () => {
            const opp = await Opportunity.create({
                projectId: testProject._id,
                organizationId: orgProfile._id,
                title: "Dancer",
                summary: "Dancer casting call",
                role: "Background Dancer",
                location: "Mumbai",
                category: "dance",
                status: "published",
                positionsCount: 2,
                deadline: new Date(Date.now() + 86400000 * 5),
                applicationDeadline: new Date(Date.now() + 86400000 * 5)
            });

            const appDoc = await Application.create({
                opportunityId: opp._id,
                talentId: talentUser._id,
                talentProfileId: talentProfile._id,
                status: "applied",
                consentGiven: true
            });

            const failRes = await request(app)
                .post(`/api/applications/${appDoc._id}/withdraw`)
                .set("Authorization", `Bearer ${talentToken}`)
                .send({});

            expect(failRes.status).toBe(400);

            const successRes = await request(app)
                .post(`/api/applications/${appDoc._id}/withdraw`)
                .set("Authorization", `Bearer ${talentToken}`)
                .send({ reason: "Scheduling conflict", confirm: true });

            expect(successRes.status).toBe(200);
            expect(successRes.body.success).toBe(true);
            expect(successRes.body.application.status).toBe("withdrawn");
        });
    });

    describe("O7: Report Opportunity & Admin Queue Review", () => {
        let opp;

        beforeEach(async () => {
            opp = await Opportunity.create({
                projectId: testProject._id,
                organizationId: orgProfile._id,
                title: "Suspicious Casting Call",
                summary: "Suspicious casting call summary",
                role: "Extra",
                location: "Mumbai",
                category: "acting",
                status: "published",
                positionsCount: 1,
                deadline: new Date(Date.now() + 86400000 * 5),
                applicationDeadline: new Date(Date.now() + 86400000 * 5)
            });

            await Application.create({
                opportunityId: opp._id,
                talentId: talentUser._id,
                talentProfileId: talentProfile._id,
                status: "applied",
                consentGiven: true
            });
        });

        it("applicant can report opportunity and admin can review report", async () => {
            // Applicant reports opportunity
            const reportRes = await request(app)
                .post(`/api/opportunities/${opp._id}/report`)
                .set("Authorization", `Bearer ${talentToken}`)
                .send({
                    reason: "scam_or_fraud",
                    details: "Asking for money before audition."
                });

            expect(reportRes.status).toBe(201);
            expect(reportRes.body.success).toBe(true);
            const reportId = reportRes.body.report._id;

            // Admin fetches reports queue
            const listRes = await request(app)
                .get("/api/admin/reports")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(listRes.status).toBe(200);
            expect(listRes.body.reports.length).toBeGreaterThan(0);

            // Admin resolves report
            const reviewRes = await request(app)
                .patch(`/api/admin/reports/${reportId}/review`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    action: "resolve",
                    resolutionNotes: "Warning sent to recruiter."
                });

            expect(reviewRes.status).toBe(200);
            expect(reviewRes.body.report.status).toBe("resolved");
        });
    });
});
