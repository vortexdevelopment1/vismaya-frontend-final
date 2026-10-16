const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const { connectDB, clearDB, disconnectDB } = require("./helpers/db");
const { generateAuthToken } = require("./helpers/auth");

const User = require("../src/models/user.model");
const Organization = require("../src/models/organization.model");
const Project = require("../src/models/project.model");
const Opportunity = require("../src/models/opportunity.model");
const Application = require("../src/models/application.model");
const TalentProfile = require("../src/models/talentProfile.model");
const Audition = require("../src/models/audition.model");
const Notification = require("../src/models/notification.model");

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

describe("Phase 6: Auditions, Applications & Communications (U1 - U3)", () => {
    let adminUser, adminToken;
    let orgUser, orgToken, orgProfile, testProject, testOpp;
    let otherOrgUser, otherOrgToken, otherOrgProfile;
    let talentUser, talentToken, talentProfile;
    let shortlistedApp, appliedApp;

    beforeEach(async () => {
        // Admin
        adminUser = await User.create({
            name: "Admin Super",
            email: "admin@vismaya.com",
            password: "Password123!",
            role: "admin",
            status: "active",
            isPaid: true
        });
        const adminAuth = await generateAuthToken(adminUser);
        adminToken = adminAuth.token;

        // Organization
        orgUser = await User.create({
            name: "Cinema Studio",
            email: "studio@cinema.com",
            password: "Password123!",
            role: "organization",
            status: "active",
            isPaid: true
        });
        const orgAuth = await generateAuthToken(orgUser);
        orgToken = orgAuth.token;

        orgProfile = await Organization.create({
            userId: orgUser._id,
            organizationName: "Cinema Studio",
            slug: "cinema-studio",
            organizationType: "Production House"
        });

        testProject = await Project.create({
            organizationId: orgProfile._id,
            projectName: "Film 2026",
            description: "Feature film project"
        });

        testOpp = await Opportunity.create({
            projectId: testProject._id,
            organizationId: orgProfile._id,
            title: "Supporting Actor",
            summary: "Supporting actor role",
            role: "Supporting Actor",
            location: "Mumbai",
            category: "acting",
            status: "published",
            positionsCount: 1,
            deadline: new Date(Date.now() + 86400000 * 10),
            applicationDeadline: new Date(Date.now() + 86400000 * 10)
        });

        // Other Organization
        otherOrgUser = await User.create({
            name: "Other Media",
            email: "other@media.com",
            password: "Password123!",
            role: "organization",
            status: "active",
            isPaid: true
        });
        const otherOrgAuth = await generateAuthToken(otherOrgUser);
        otherOrgToken = otherOrgAuth.token;

        otherOrgProfile = await Organization.create({
            userId: otherOrgUser._id,
            organizationName: "Other Media",
            slug: "other-media",
            organizationType: "Agency"
        });

        // Talent
        talentUser = await User.create({
            name: "Alex Performer",
            email: "alex@performer.com",
            password: "Password123!",
            role: "talent",
            status: "active",
            isPaid: true
        });
        const talentAuth = await generateAuthToken(talentUser);
        talentToken = talentAuth.token;

        talentProfile = await TalentProfile.create({
            userId: talentUser._id,
            vismayaId: "VIS-6001",
            firstName: "Alex",
            lastName: "Performer",
            primaryProfession: "Actor",
            gender: "male",
            profileCompletionPercentage: 85,
            isSearchable: true
        });

        // Shortlisted Application
        shortlistedApp = await Application.create({
            opportunityId: testOpp._id,
            talentId: talentUser._id,
            talentProfileId: talentProfile._id,
            status: "shortlisted",
            consentGiven: true
        });

        const testOpp2 = await Opportunity.create({
            projectId: testProject._id,
            organizationId: orgProfile._id,
            title: "Extra Role",
            summary: "Extra role",
            role: "Extra",
            location: "Mumbai",
            category: "acting",
            status: "published",
            positionsCount: 1,
            deadline: new Date(Date.now() + 86400000 * 10),
            applicationDeadline: new Date(Date.now() + 86400000 * 10)
        });

        // Applied (Not yet shortlisted) Application
        appliedApp = await Application.create({
            opportunityId: testOpp2._id,
            talentId: talentUser._id,
            talentProfileId: talentProfile._id,
            status: "applied",
            consentGiven: true
        });
    });

    describe("U1: Audition Creation, Admin Moderation & Talent Notification Flow", () => {
        it("creates audition with vismayaApproval: pending and does NOT notify talent until admin approval", async () => {
            // Organization requests self-tape audition
            const res = await request(app)
                .post(`/api/auditions/application/${shortlistedApp._id}`)
                .set("Authorization", `Bearer ${orgToken}`)
                .send({
                    type: "self_tape",
                    sceneBrief: "Perform monologue scene 3",
                    instructions: "1-2 minutes in landscape mode",
                    scriptUrl: "https://vismaya.com/scripts/scene3.pdf"
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.audition.vismayaApproval).toBe("pending");
            expect(res.body.audition.status).toBe("requested");
            const auditionId = res.body.audition._id;

            // Verify talent has NOT received an invitation notification yet
            const talentNotificationsBefore = await Notification.find({
                recipient: talentUser._id,
                type: "audition_invitation"
            });
            expect(talentNotificationsBefore.length).toBe(0);

            // Talent also cannot see pending audition in GET /api/auditions/my
            const myAuditionsRes = await request(app)
                .get("/api/auditions/my")
                .set("Authorization", `Bearer ${talentToken}`);
            expect(myAuditionsRes.status).toBe(200);
            expect(myAuditionsRes.body.auditions.length).toBe(0);

            // Admin queue includes this pending audition
            const pendingQueueRes = await request(app)
                .get("/api/admin/auditions")
                .set("Authorization", `Bearer ${adminToken}`);
            expect(pendingQueueRes.status).toBe(200);
            expect(pendingQueueRes.body.auditions.some(a => a._id.toString() === auditionId.toString())).toBe(true);

            // Admin approves the audition and attaches official script
            const approveRes = await request(app)
                .patch(`/api/admin/auditions/${auditionId}/review`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    action: "approve",
                    scriptUrl: "https://vismaya.com/scripts/scene3_approved.pdf"
                });

            expect(approveRes.status).toBe(200);
            expect(approveRes.body.audition.vismayaApproval).toBe("approved");
            expect(approveRes.body.audition.scriptUrl).toBe("https://vismaya.com/scripts/scene3_approved.pdf");

            // Talent NOW receives notification
            const talentNotificationsAfter = await Notification.find({
                recipient: talentUser._id,
                type: "audition_invitation"
            });
            expect(talentNotificationsAfter.length).toBe(1);

            // Talent can now see the approved audition in GET /api/auditions/my
            const myAuditionsAfter = await request(app)
                .get("/api/auditions/my")
                .set("Authorization", `Bearer ${talentToken}`);
            expect(myAuditionsAfter.status).toBe(200);
            expect(myAuditionsAfter.body.auditions.length).toBe(1);
        });

        it("admin rejection sets status to cancelled and notifies organization", async () => {
            const audition = await Audition.create({
                applicationId: shortlistedApp._id,
                opportunityId: testOpp._id,
                projectId: testProject._id,
                organizationId: orgProfile._id,
                talentId: talentUser._id,
                type: "self_tape",
                vismayaApproval: "pending",
                deadline: new Date(Date.now() + 86400000 * 5)
            });

            const rejectRes = await request(app)
                .patch(`/api/admin/auditions/${audition._id}/review`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    action: "reject",
                    rejectionReason: "Inappropriate script content."
                });

            expect(rejectRes.status).toBe(200);
            expect(rejectRes.body.audition.vismayaApproval).toBe("rejected");
            expect(rejectRes.body.audition.status).toBe("cancelled");
            expect(rejectRes.body.audition.vismayaRejectionReason).toBe("Inappropriate script content.");

            // Verify org notification
            const orgNotification = await Notification.findOne({
                recipient: orgUser._id,
                type: "audition_rejected"
            });
            expect(orgNotification).toBeTruthy();
        });
    });

    describe("U2: Audition Constraints & Self-Tape Atomic Submission", () => {
        it("rejects audition creation if application is not shortlisted", async () => {
            const res = await request(app)
                .post(`/api/auditions/application/${appliedApp._id}`)
                .set("Authorization", `Bearer ${orgToken}`)
                .send({ type: "self_tape" });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/shortlisted/i);
        });

        it("rejects audition creation from non-owning organization", async () => {
            const res = await request(app)
                .post(`/api/auditions/application/${shortlistedApp._id}`)
                .set("Authorization", `Bearer ${otherOrgToken}`)
                .send({ type: "self_tape" });

            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/own/i);
        });

        it("rejects duplicate audition creation for the same application", async () => {
            await Audition.create({
                applicationId: shortlistedApp._id,
                opportunityId: testOpp._id,
                projectId: testProject._id,
                organizationId: orgProfile._id,
                talentId: talentUser._id,
                type: "self_tape",
                vismayaApproval: "pending"
            });

            const res = await request(app)
                .post(`/api/auditions/application/${shortlistedApp._id}`)
                .set("Authorization", `Bearer ${orgToken}`)
                .send({ type: "self_tape" });

            expect(res.status).toBe(409);
            expect(res.body.message).toMatch(/already exists/i);
        });

        it("enforces single self-tape submission and notifies organization", async () => {
            const audition = await Audition.create({
                applicationId: shortlistedApp._id,
                opportunityId: testOpp._id,
                projectId: testProject._id,
                organizationId: orgProfile._id,
                talentId: talentUser._id,
                type: "self_tape",
                status: "requested",
                vismayaApproval: "approved",
                deadline: new Date(Date.now() + 86400000 * 5)
            });

            // First submission succeeds
            const firstSubRes = await request(app)
                .post(`/api/auditions/${audition._id}/self-tape`)
                .set("Authorization", `Bearer ${talentToken}`)
                .send({
                    videoUrl: "https://cloudinary.com/vismaya/selftape1.mp4",
                    durationSeconds: 90
                });

            expect(firstSubRes.status).toBe(200);
            expect(firstSubRes.body.success).toBe(true);
            expect(firstSubRes.body.audition.status).toBe("submitted");
            expect(firstSubRes.body.audition.selfTapeSubmission.submittedAt).toBeDefined();

            // Org received notification
            const orgNotif = await Notification.findOne({
                recipient: orgUser._id,
                type: "audition_submitted"
            });
            expect(orgNotif).toBeTruthy();

            // Second submission is rejected (single submission rule)
            const secondSubRes = await request(app)
                .post(`/api/auditions/${audition._id}/self-tape`)
                .set("Authorization", `Bearer ${talentToken}`)
                .send({
                    videoUrl: "https://cloudinary.com/vismaya/selftape2.mp4"
                });

            expect(secondSubRes.status).toBe(400);
            expect(secondSubRes.body.message).toMatch(/already been submitted/i);
        });

        it("rejects unsafe video URLs", async () => {
            const audition = await Audition.create({
                applicationId: shortlistedApp._id,
                opportunityId: testOpp._id,
                projectId: testProject._id,
                organizationId: orgProfile._id,
                talentId: talentUser._id,
                type: "self_tape",
                status: "requested",
                vismayaApproval: "approved",
                deadline: new Date(Date.now() + 86400000 * 5)
            });

            const res = await request(app)
                .post(`/api/auditions/${audition._id}/self-tape`)
                .set("Authorization", `Bearer ${talentToken}`)
                .send({
                    videoUrl: "javascript:alert('XSS')"
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/valid/i);
        });
    });

    describe("U3: Audition Review Governance & Feedback", () => {
        it("organization reviews submission, ignores client-provided status, and notifies talent", async () => {
            const audition = await Audition.create({
                applicationId: shortlistedApp._id,
                opportunityId: testOpp._id,
                projectId: testProject._id,
                organizationId: orgProfile._id,
                talentId: talentUser._id,
                type: "self_tape",
                status: "submitted",
                vismayaApproval: "approved",
                selfTapeSubmission: {
                    videoUrl: "https://cloudinary.com/vismaya/selftape.mp4",
                    submittedAt: new Date()
                }
            });

            const reviewRes = await request(app)
                .patch(`/api/auditions/${audition._id}/review`)
                .set("Authorization", `Bearer ${orgToken}`)
                .send({
                    organizationFeedback: "Great emotional range and clear voice delivery.",
                    organizationRating: 5,
                    status: "arbitrary_custom_status" // should be ignored
                });

            expect(reviewRes.status).toBe(200);
            expect(reviewRes.body.success).toBe(true);
            expect(reviewRes.body.audition.status).toBe("reviewed");
            expect(reviewRes.body.audition.organizationFeedback).toBe("Great emotional range and clear voice delivery.");
            expect(reviewRes.body.audition.organizationRating).toBe(5);

            // Talent received feedback notification
            const talentNotif = await Notification.findOne({
                recipient: talentUser._id,
                type: "audition_reviewed"
            });
            expect(talentNotif).toBeTruthy();
        });

        it("fails review if self-tape has not been submitted by talent", async () => {
            const audition = await Audition.create({
                applicationId: shortlistedApp._id,
                opportunityId: testOpp._id,
                projectId: testProject._id,
                organizationId: orgProfile._id,
                talentId: talentUser._id,
                type: "self_tape",
                status: "requested",
                vismayaApproval: "approved"
            });

            const reviewRes = await request(app)
                .patch(`/api/auditions/${audition._id}/review`)
                .set("Authorization", `Bearer ${orgToken}`)
                .send({
                    organizationFeedback: "Cannot review missing tape."
                });

            expect(reviewRes.status).toBe(400);
            expect(reviewRes.body.message).toMatch(/before talent submits/i);
        });
    });
});
