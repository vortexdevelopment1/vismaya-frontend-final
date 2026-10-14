const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const { connectDB, clearDB, disconnectDB } = require("./helpers/db");
const { createTalentUser, createAdminUser } = require("./helpers/factory");
const { getAuthHeader } = require("./helpers/auth");
const TalentProfile = require("../src/models/talentProfile.model");
const User = require("../src/models/user.model");
const AdminAuditLog = require("../src/models/adminAuditLog.model");
const Notification = require("../src/models/notification.model");

beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = "vismaya_test_jwt_secret_must_be_over_32_characters_long_1234567890";
    await connectDB();
});

beforeEach(async () => {
    await clearDB();
});

afterAll(async () => {
    await disconnectDB();
});

describe("Admin Talent Profile Approval & Lifecycle Flow", () => {
    let talentUser, talentToken, adminUser, adminToken, talentProfile;

    const setupTestUsers = async (talentOverrides = {}) => {
        const talent = await createTalentUser({ isPaid: true, ...talentOverrides });
        talentUser = talent.user;
        talentToken = talent.token;

        const admin = await createAdminUser();
        adminUser = admin.admin || admin.user;
        adminToken = admin.token;

        // Create a talent profile
        const profRes = await request(app)
            .post("/api/talent-profiles")
            .set("Authorization", getAuthHeader(talentToken))
            .send({
                stageName: "Rohan Varma",
                firstName: "Rohan",
                lastName: "Varma",
                currentCity: "Mumbai",
                currentState: "Maharashtra",
                primaryProfession: "Actors",
                bio: "Professional film and theater actor with extensive experience in method acting, screen appearances, monologue delivery, dramatic presence, and emotional depth in contemporary Indian cinema and stage plays across Mumbai and international festivals.",
                gender: "male",
                dob: "1998-05-12"
            });

        expect(profRes.status).toBe(200);
        talentProfile = profRes.body.profile;
        expect(talentProfile).toBeDefined();
    };

    describe("1. Initial Talent Profile State & Talent's View", () => {
        it("should have pending status and unapproved profile initially", async () => {
            await setupTestUsers();

            const dbProfile = await TalentProfile.findById(talentProfile._id);
            expect(dbProfile.status).toBe("pending");
            expect(dbProfile.isProfileApproved).toBe(false);
            expect(dbProfile.isVerified).toBe(false);

            // Talent fetches own profile
            const meRes = await request(app)
                .get("/api/talent-profiles/me")
                .set("Authorization", getAuthHeader(talentToken));

            expect(meRes.status).toBe(200);
            expect(meRes.body.profile.isProfileApproved).toBe(false);
            expect(meRes.body.profile.status).toBe("pending");
            expect(meRes.body.profile.statusNote).toMatch(/pending verification/i);
        });
    });

    describe("2. Admin Queues & Search", () => {
        it("should list pending profiles in GET /api/admin/talents/pending and filter by status", async () => {
            await setupTestUsers();

            // 1. Pending queue
            const pendingRes = await request(app)
                .get("/api/admin/talents/pending")
                .set("Authorization", getAuthHeader(adminToken));

            expect(pendingRes.status).toBe(200);
            expect(pendingRes.body.count).toBeGreaterThanOrEqual(1);
            const foundPending = pendingRes.body.profiles.find(p => p._id.toString() === talentProfile._id.toString());
            expect(foundPending).toBeDefined();
            expect(foundPending.isProfileApproved).toBe(false);

            // 2. Directory with status=pending
            const dirPending = await request(app)
                .get("/api/admin/talents?status=pending")
                .set("Authorization", getAuthHeader(adminToken));

            expect(dirPending.status).toBe(200);
            const inDirPending = dirPending.body.profiles.find(p => p._id.toString() === talentProfile._id.toString());
            expect(inDirPending).toBeDefined();

            // 3. Search by vismayaId
            const searchRes = await request(app)
                .get(`/api/admin/talents?search=${talentProfile.vismayaId}`)
                .set("Authorization", getAuthHeader(adminToken));

            expect(searchRes.status).toBe(200);
            expect(searchRes.body.profiles.length).toBeGreaterThanOrEqual(1);
            expect(searchRes.body.profiles[0].vismayaId).toBe(talentProfile.vismayaId);

            // 4. Get by ID
            const byIdRes = await request(app)
                .get(`/api/admin/talents/${talentProfile._id}`)
                .set("Authorization", getAuthHeader(adminToken));

            expect(byIdRes.status).toBe(200);
            expect(byIdRes.body.profile._id.toString()).toBe(talentProfile._id.toString());
        });
    });

    describe("3. Admin Approval Flow", () => {
        it("should approve talent profile by profile._id, update database, log audit, and notify talent", async () => {
            await setupTestUsers();

            const approveRes = await request(app)
                .patch(`/api/admin/talents/${talentProfile._id}/approve`)
                .set("Authorization", getAuthHeader(adminToken))
                .send({
                    badgeType: "verified",
                    note: "Profile approved after document inspection"
                });

            expect(approveRes.status).toBe(200);
            expect(approveRes.body.success).toBe(true);
            expect(approveRes.body.profile.isProfileApproved).toBe(true);
            expect(approveRes.body.profile.status).toBe("approved");
            expect(approveRes.body.profile.isVerified).toBe(true);
            expect(approveRes.body.profile.badgeType).toBe("verified");

            // Database verification
            const updatedProfile = await TalentProfile.findById(talentProfile._id);
            expect(updatedProfile.isProfileApproved).toBe(true);
            expect(updatedProfile.status).toBe("approved");
            expect(updatedProfile.isVerified).toBe(true);
            expect(updatedProfile.verifiedAt).toBeDefined();
            expect(updatedProfile.reviewedBy.toString()).toBe(adminUser._id.toString());

            // Audit log verification
            const auditLog = await AdminAuditLog.findOne({
                action: "APPROVE_TALENT_PROFILE",
                targetId: talentProfile._id
            });
            expect(auditLog).toBeDefined();
            expect(auditLog.adminId.toString()).toBe(adminUser._id.toString());

            // Notification verification
            const notif = await Notification.findOne({
                recipient: talentUser._id,
                title: "Talent Profile Approved"
            });
            expect(notif).toBeDefined();
            expect(notif.message).toMatch(/verified and approved/i);

            // Talent views own profile now
            const meRes = await request(app)
                .get("/api/talent-profiles/me")
                .set("Authorization", getAuthHeader(talentToken));

            expect(meRes.status).toBe(200);
            expect(meRes.body.profile.isProfileApproved).toBe(true);
            expect(meRes.body.profile.status).toBe("approved");
            expect(meRes.body.profile.statusNote).toMatch(/verified and approved by Vismaya Admin/i);
        });

        it("should approve talent profile by vismayaId", async () => {
            await setupTestUsers();

            const approveRes = await request(app)
                .patch(`/api/admin/talents/${talentProfile.vismayaId}/approve`)
                .set("Authorization", getAuthHeader(adminToken));

            expect(approveRes.status).toBe(200);
            expect(approveRes.body.profile.isProfileApproved).toBe(true);
            expect(approveRes.body.profile.status).toBe("approved");

            const updatedProfile = await TalentProfile.findOne({ vismayaId: talentProfile.vismayaId });
            expect(updatedProfile.isProfileApproved).toBe(true);
        });

        it("should approve talent profile via POST method fallback", async () => {
            await setupTestUsers();

            const approveRes = await request(app)
                .post(`/api/admin/talents/${talentProfile._id}/approve`)
                .set("Authorization", getAuthHeader(adminToken));

            expect(approveRes.status).toBe(200);
            expect(approveRes.body.profile.isProfileApproved).toBe(true);
        });
    });

    describe("4. Admin Rejection Flow", () => {
        it("should reject talent profile with reason, log audit, and notify user", async () => {
            await setupTestUsers();

            const rejectionReason = "Comp cards did not meet minimum resolution and portfolio is incomplete.";
            const rejectRes = await request(app)
                .patch(`/api/admin/talents/${talentProfile._id}/reject`)
                .set("Authorization", getAuthHeader(adminToken))
                .send({ reason: rejectionReason });

            expect(rejectRes.status).toBe(200);
            expect(rejectRes.body.profile.status).toBe("rejected");
            expect(rejectRes.body.profile.isProfileApproved).toBe(false);
            expect(rejectRes.body.profile.rejectionReason).toBe(rejectionReason);

            // Database check
            const updatedProfile = await TalentProfile.findById(talentProfile._id);
            expect(updatedProfile.status).toBe("rejected");
            expect(updatedProfile.isProfileApproved).toBe(false);
            expect(updatedProfile.statusReason).toBe(rejectionReason);

            // Audit log
            const auditLog = await AdminAuditLog.findOne({
                action: "REJECT_TALENT_PROFILE",
                targetId: talentProfile._id
            });
            expect(auditLog).toBeDefined();

            // Notification check
            const notif = await Notification.findOne({
                recipient: talentUser._id,
                title: "Talent Profile Review Update"
            });
            expect(notif).toBeDefined();
            expect(notif.message).toContain(rejectionReason);

            // Talent views profile
            const meRes = await request(app)
                .get("/api/talent-profiles/me")
                .set("Authorization", getAuthHeader(talentToken));

            expect(meRes.status).toBe(200);
            expect(meRes.body.profile.status).toBe("rejected");
            expect(meRes.body.profile.statusNote).toBe(rejectionReason);
        });
    });

    describe("5. Admin Suspension and Reactivation Flow", () => {
        it("should suspend and reactivate talent profile cleanly", async () => {
            await setupTestUsers();

            // First approve
            await request(app)
                .patch(`/api/admin/talents/${talentProfile._id}/approve`)
                .set("Authorization", getAuthHeader(adminToken));

            // Suspend
            const suspendRes = await request(app)
                .patch(`/api/admin/talents/${talentProfile._id}/suspend`)
                .set("Authorization", getAuthHeader(adminToken))
                .send({ reason: "Violation of terms" });

            expect(suspendRes.status).toBe(200);
            expect(suspendRes.body.profile.status).toBe("suspended");
            expect(suspendRes.body.profile.isProfileApproved).toBe(false);

            const suspendedProfile = await TalentProfile.findById(talentProfile._id);
            expect(suspendedProfile.status).toBe("suspended");

            // Verify User account status is also suspended
            const suspendedUser = await User.findById(talentUser._id);
            expect(suspendedUser.status).toBe("suspended");

            // Reactivate
            const reactivateRes = await request(app)
                .patch(`/api/admin/talents/${talentProfile._id}/reactivate`)
                .set("Authorization", getAuthHeader(adminToken));

            expect(reactivateRes.status).toBe(200);
            expect(reactivateRes.body.profile.status).toBe("approved");
            expect(reactivateRes.body.profile.isProfileApproved).toBe(true);

            const reactivatedProfile = await TalentProfile.findById(talentProfile._id);
            expect(reactivatedProfile.status).toBe("approved");
            expect(reactivatedProfile.isProfileApproved).toBe(true);

            const reactivatedUser = await User.findById(talentUser._id);
            expect(reactivatedUser.status).toBe("active");
        });

        it("should suspend talent profile by vismayaId and resolve from body when route param is literal 'id'", async () => {
            await setupTestUsers();

            // Suspend using vismayaId
            const suspendByVismayaIdRes = await request(app)
                .patch(`/api/admin/talents/${talentProfile.vismayaId}/suspend`)
                .set("Authorization", getAuthHeader(adminToken))
                .send({ reason: "Casting policy violation" });

            expect(suspendByVismayaIdRes.status).toBe(200);
            expect(suspendByVismayaIdRes.body.profile.status).toBe("suspended");

            // Reactivate using route param 'id' with body talentId fallback
            const reactivateWithFallbackRes = await request(app)
                .patch("/api/admin/talents/id/reactivate")
                .set("Authorization", getAuthHeader(adminToken))
                .send({ talentId: talentProfile.vismayaId });

            expect(reactivateWithFallbackRes.status).toBe(200);
            expect(reactivateWithFallbackRes.body.profile.status).toBe("approved");

            // Suspend using route param 'id' with body userId fallback
            const suspendWithUserIdFallbackRes = await request(app)
                .patch("/api/admin/talents/id/suspend")
                .set("Authorization", getAuthHeader(adminToken))
                .send({ userId: talentUser._id, reason: "Account audit" });

            expect(suspendWithUserIdFallbackRes.status).toBe(200);
            expect(suspendWithUserIdFallbackRes.body.profile.status).toBe("suspended");
        });

        it("should suspend, reactivate, and fetch unprofiled talent user without existing TalentProfile document", async () => {
            const admin = await createAdminUser();
            const aToken = admin.token;

            // Create talent user directly with NO TalentProfile document
            const rawTalent = await createTalentUser({ isPaid: false });
            const unprofiledUserId = rawTalent.user._id.toString();

            // Verify no TalentProfile exists yet
            const noProfile = await TalentProfile.findOne({ userId: unprofiledUserId });
            expect(noProfile).toBeNull();

            // GET single talent profile by unprofiled user ID
            const getRes = await request(app)
                .get(`/api/admin/talents/${unprofiledUserId}`)
                .set("Authorization", getAuthHeader(aToken));
            expect(getRes.status).toBe(200);
            expect(getRes.body.profile).toBeDefined();

            // Suspend unprofiled talent user by their user ID
            const suspendRes = await request(app)
                .patch(`/api/admin/talents/${unprofiledUserId}/suspend`)
                .set("Authorization", getAuthHeader(aToken))
                .send({ reason: "Unprofiled talent suspension test" });

            expect(suspendRes.status).toBe(200);
            expect(suspendRes.body.profile.status).toBe("suspended");
            expect(suspendRes.body.profile.vismayaId).toMatch(/^VIS-\d+/);

            // Verify TalentProfile was created and user status is suspended
            const createdProfile = await TalentProfile.findOne({ userId: unprofiledUserId });
            expect(createdProfile).toBeDefined();
            expect(createdProfile.status).toBe("suspended");
            expect(createdProfile.vismayaId).toBeDefined();

            const updatedUser = await User.findById(unprofiledUserId);
            expect(updatedUser.status).toBe("suspended");

            // Reactivate
            const reactivateRes = await request(app)
                .patch(`/api/admin/talents/${unprofiledUserId}/reactivate`)
                .set("Authorization", getAuthHeader(aToken));

            expect(reactivateRes.status).toBe(200);
            expect(reactivateRes.body.profile.status).toBe("approved");

            const reactivatedUser = await User.findById(unprofiledUserId);
            expect(reactivatedUser.status).toBe("active");
        });
    });
});
