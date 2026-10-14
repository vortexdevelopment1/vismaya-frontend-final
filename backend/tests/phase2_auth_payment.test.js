const request = require("supertest");
const crypto = require("crypto");
const app = require("../src/app");
const User = require("../src/models/user.model");
const Otp = require("../src/models/otp.model");
const RegistrationDraft = require("../src/models/registrationDraft.model");
const PaymentTransaction = require("../src/models/paymentTransaction.model");
const TalentProfile = require("../src/models/talentProfile.model");
const Organization = require("../src/models/organization.model");
const Project = require("../src/models/project.model");
const Opportunity = require("../src/models/opportunity.model");
const { getOutbox, clearOutbox } = require("./helpers/outbox");
const { generateAuthToken } = require("./helpers/auth");
const { createUser: createTestUser, createAdmin, createTalent, createOrganization } = require("./helpers/factory");
const { connectDB, clearDB, disconnectDB } = require("./helpers/db");



jest.setTimeout(60000);

describe("Phase 2: Auth, Registration & Payment Gate (P2)", () => {
    beforeAll(async () => {
        process.env.NODE_ENV = "test";
        process.env.JWT_SECRET = "vismaya_test_jwt_secret_must_be_over_32_characters_long_1234567890";
        process.env.RAZORPAY_WEBHOOK_SECRET = "test_razorpay_mock_webhook_secret_12345";
        await connectDB();
    });

    beforeEach(async () => {
        await clearDB();
        clearOutbox();
    });

    afterAll(async () => {
        await disconnectDB();
    });


    describe("A1: Mobile Validation & Uniqueness", () => {
        it("should accept valid 10-digit Indian mobile and normalize with +91 prefix", async () => {
            const res = await request(app)
                .post("/api/auth/register")
                .send({
                    name: "Rahul Sharma",
                    email: "rahul.sharma@example.com",
                    mobile: "9876543210",
                    password: "SecurePassword123!",
                    role: "talent"
                });

            expect(res.status).toBe(201);
            const user = await User.findOne({ email: "rahul.sharma@example.com" });
            expect(user).not.toBeNull();
            expect(user.mobile).toBe("+919876543210");
        });

        it("should reject invalid mobile number formats with 400", async () => {
            const res = await request(app)
                .post("/api/auth/register")
                .send({
                    name: "Invalid Mobile User",
                    email: "invalid.mobile@example.com",
                    mobile: "12345",
                    password: "SecurePassword123!",
                    role: "talent"
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it("should return 409 Conflict when registering with an existing mobile number", async () => {
            await createTestUser({
                email: "first.user@example.com",
                mobile: "+919811122233"
            });

            const res = await request(app)
                .post("/api/auth/register")
                .send({
                    name: "Duplicate Mobile User",
                    email: "second.user@example.com",
                    mobile: "9811122233",
                    password: "SecurePassword123!",
                    role: "talent"
                });

            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/mobile/i);
        });
    });

    describe("A2 & A3: Registration OTP Flow & SMTP Outbox", () => {
        it("should register user with pending status and send 6-digit OTP", async () => {
            const email = "pending.actor@example.com";
            const res = await request(app)
                .post("/api/auth/register")
                .send({
                    name: "Pending Actor",
                    email,
                    password: "SecurePassword123!",
                    role: "talent"
                });

            expect(res.status).toBe(201);
            expect(res.body.status).toBe("pending");

            const outbox = getOutbox();
            expect(outbox.length).toBeGreaterThan(0);
            const regEmail = outbox.find(e => e.to === email);
            expect(regEmail).toBeDefined();
            expect(regEmail.subject).toMatch(/verify/i);

            // Extract OTP
            const otpMatch = regEmail.text.match(/\b\d{6}\b/);
            expect(otpMatch).not.toBeNull();
        });

        it("should block login for users in pending status with 403", async () => {
            await request(app)
                .post("/api/auth/register")
                .send({
                    name: "Unverified User",
                    email: "unverified@example.com",
                    password: "Password123!",
                    role: "talent"
                });

            const loginRes = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "unverified@example.com",
                    password: "Password123!"
                });

            expect(loginRes.status).toBe(403);
            expect(loginRes.body.success).toBe(false);
            expect(loginRes.body.isEmailVerified).toBe(false);
        });

        it("should verify registration OTP and activate user with JWT session", async () => {
            const email = "verify.me@example.com";
            await request(app)
                .post("/api/auth/register")
                .send({
                    name: "Verify Me",
                    email,
                    password: "Password123!",
                    role: "talent"
                });

            const outbox = getOutbox();
            const regEmail = outbox.find(e => e.to === email);
            const otpCode = regEmail.text.match(/\b\d{6}\b/)[0];

            const verifyRes = await request(app)
                .post("/api/auth/verify-registration")
                .send({
                    email,
                    otp: otpCode
                });

            expect(verifyRes.status).toBe(200);
            expect(verifyRes.body.success).toBe(true);
            expect(verifyRes.body.token).toBeDefined();
            expect(verifyRes.body.user.status).toBe("active");
            expect(verifyRes.body.user.isEmailVerified).toBe(true);

            // Can now log in successfully
            const loginRes = await request(app)
                .post("/api/auth/login")
                .send({
                    email,
                    password: "Password123!"
                });

            expect(loginRes.status).toBe(200);
            expect(loginRes.body.user.status).toBe("active");
        });

        it("should resend registration OTP for pending user", async () => {
            const email = "resend.test@example.com";
            await request(app)
                .post("/api/auth/register")
                .send({
                    name: "Resend Test",
                    email,
                    password: "Password123!",
                    role: "talent"
                });

            clearOutbox();

            const res = await request(app)
                .post("/api/auth/resend-registration-otp")
                .send({ email });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            const outbox = getOutbox();
            expect(outbox.length).toBe(1);
            expect(outbox[0].to === email).toBe(true);
        });
    });

    describe("A4: Optional 2FA Flow", () => {
        let user;
        let token;

        beforeEach(async () => {
            user = await createTestUser({
                email: "twofactor.user@example.com",
                password: "Password123!",
                status: "active"
            });
            token = (await generateAuthToken(user)).token;
        });

        it("should enable 2FA via setup OTP verification", async () => {
            // 1. Setup 2FA
            const setupRes = await request(app)
                .post("/api/auth/2fa/setup")
                .set("Authorization", `Bearer ${token}`);

            expect(setupRes.status).toBe(200);
            const outbox = getOutbox();
            const otpCode = outbox[0].text.match(/\b\d{6}\b/)[0];

            // 2. Verify setup
            const verifyRes = await request(app)
                .post("/api/auth/2fa/verify")
                .set("Authorization", `Bearer ${token}`)
                .send({ otp: otpCode });

            expect(verifyRes.status).toBe(200);
            const updatedUser = await User.findById(user._id);
            expect(updatedUser.twoFactorEnabled).toBe(true);
        });

        it("should challenge 2FA upon login and issue session only after challenge verification", async () => {
            user.twoFactorEnabled = true;
            await user.save();
            clearOutbox();

            // Login attempt
            const loginRes = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "twofactor.user@example.com",
                    password: "Password123!"
                });

            expect(loginRes.status).toBe(200);
            expect(loginRes.body.requires2FA).toBe(true);
            expect(loginRes.body.twoFactorToken).toBeDefined();
            expect(loginRes.body.token).toBeUndefined();

            const outbox = getOutbox();
            const otpCode = outbox[0].text.match(/\b\d{6}\b/)[0];

            // Submit 2FA challenge
            const challengeRes = await request(app)
                .post("/api/auth/2fa/challenge")
                .send({
                    twoFactorToken: loginRes.body.twoFactorToken,
                    otp: otpCode
                });

            expect(challengeRes.status).toBe(200);
            expect(challengeRes.body.token).toBeDefined();
            expect(challengeRes.body.user.email).toBe("twofactor.user@example.com");
        });

        it("should allow disabling 2FA with current password", async () => {
            user.twoFactorEnabled = true;
            await user.save();

            const disableRes = await request(app)
                .post("/api/auth/2fa/disable")
                .set("Authorization", `Bearer ${token}`)
                .send({ password: "Password123!" });

            expect(disableRes.status).toBe(200);
            const updatedUser = await User.findById(user._id);
            expect(updatedUser.twoFactorEnabled).toBe(false);
        });
    });

    describe("A5: Registration Resume & Draft Payment Lock", () => {
        it("should compute registrationStep accurately during login", async () => {
            const talent = await createTestUser({
                email: "resume.talent@example.com",
                password: "Password123!",
                role: "talent",
                isPaid: false
            });

            // 1. Without profile -> talent_profile
            const login1 = await request(app)
                .post("/api/auth/login")
                .send({ email: "resume.talent@example.com", password: "Password123!" });
            expect(login1.status).toBe(200);
            expect(login1.body.user.registrationStep).toBe("talent_profile");

            // 2. With profile, not paid -> payment_pending
            await TalentProfile.create({
                userId: talent._id,
                vismayaId: "VIS-112233",
                firstName: "Resume",
                lastName: "Star",
                stageName: "Resume Star",
                profileCompletionPercentage: 50
            });

            const login2 = await request(app)
                .post("/api/auth/login")
                .send({ email: "resume.talent@example.com", password: "Password123!" });
            expect(login2.status).toBe(200);
            expect(login2.body.user.registrationStep).toBe("payment_pending");

            // 3. Paid -> completed
            talent.isPaid = true;
            await talent.save();

            const login3 = await request(app)
                .post("/api/auth/login")
                .send({ email: "resume.talent@example.com", password: "Password123!" });
            expect(login3.status).toBe(200);
            expect(login3.body.user.registrationStep).toBe("completed");
        });

        it("should lock registration draft modifications when account is already paid", async () => {
            await createTestUser({
                email: "paid.draft@example.com",
                isPaid: true
            });

            const res = await request(app)
                .post("/api/auth/draft")
                .send({
                    email: "paid.draft@example.com",
                    role: "talent",
                    currentStep: 2,
                    formData: { stageName: "Should Be Locked" }
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/locked/i);
        });
    });

    describe("A6: Unified Idempotent Payment Fulfillment", () => {
        let talentUser;
        let talentToken;

        beforeEach(async () => {
            talentUser = await createTestUser({
                email: "paid.talent.order@example.com",
                role: "talent",
                isPaid: false
            });
            talentToken = (await generateAuthToken(talentUser)).token;
            await TalentProfile.create({
                userId: talentUser._id,
                vismayaId: "VIS-998877",
                firstName: "Talent",
                lastName: "Star",
                stageName: "Talent Star",
                profileCompletionPercentage: 70
            });
        });

        it("should verify payment, generate sequential invoice number, and fulfill idempotently", async () => {
            // 1. Create Order
            const orderRes = await request(app)
                .post("/api/payments/create-order")
                .set("Authorization", `Bearer ${talentToken}`)
                .send({ packageType: "talent_annual_999" });

            expect(orderRes.status).toBe(201);
            const { orderId } = orderRes.body.order;

            // 2. Verify Payment
            const verifyRes1 = await request(app)
                .post("/api/payments/verify")
                .set("Authorization", `Bearer ${talentToken}`)
                .send({ orderId, paymentId: "pay_test_12345" });

            expect(verifyRes1.status).toBe(200);
            expect(verifyRes1.body.transaction.status).toBe("successful");
            expect(verifyRes1.body.transaction.invoiceNumber).toMatch(/^INV-\d{4}-\d{5}$/);

            const updatedUser = await User.findById(talentUser._id);
            expect(updatedUser.isPaid).toBe(true);

            // 3. Second verification (Idempotency)
            const verifyRes2 = await request(app)
                .post("/api/payments/verify")
                .set("Authorization", `Bearer ${talentToken}`)
                .send({ orderId, paymentId: "pay_test_12345" });

            expect(verifyRes2.status).toBe(200);
            expect(verifyRes2.body.message).toMatch(/idempotent/i);
            expect(verifyRes2.body.transaction.invoiceNumber).toBe(verifyRes1.body.transaction.invoiceNumber);
        });
    });

    describe("A7: Payment Gating", () => {
        it("should block unpaid talent from applying to opportunities with 403", async () => {
            const unpaidTalent = await createTestUser({
                email: "unpaid.talent@example.com",
                role: "talent",
                isPaid: false
            });
            const unpaidToken = (await generateAuthToken(unpaidTalent)).token;
            await TalentProfile.create({
                userId: unpaidTalent._id,
                vismayaId: "VIS-445566",
                firstName: "Unpaid",
                lastName: "Actor",
                stageName: "Unpaid Actor",
                profileCompletionPercentage: 80,
                isPaid: false
            });

            // Create opportunity
            const orgUser = await createTestUser({
                email: "org.opp.owner@example.com",
                role: "organization",
                isPaid: true
            });
            const org = await Organization.create({
                userId: orgUser._id,
                organizationName: "Test Org Studios",
                isPaid: true
            });
            const project = await Project.create({
                organizationId: org._id,
                projectName: "Test Movie"
            });
            const opp = await Opportunity.create({
                projectId: project._id,
                title: "Lead Actor",
                role: "Actor",
                summary: "Lead role in movie",
                location: "Mumbai",
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                status: "published"
            });

            const applyRes = await request(app)
                .post(`/api/applications/${opp._id}/apply`)
                .set("Authorization", `Bearer ${unpaidToken}`)
                .send({ coverNote: "Hire me please" });

            expect(applyRes.status).toBe(403);
            expect(applyRes.body.success).toBe(false);
            expect(applyRes.body.message).toMatch(/paid/i);
        });

        it("should block unpaid organization from creating opportunities with 403", async () => {
            const unpaidOrgUser = await createTestUser({
                email: "unpaid.org@example.com",
                role: "organization",
                isPaid: false
            });
            const unpaidOrgToken = (await generateAuthToken(unpaidOrgUser)).token;
            const org = await Organization.create({
                userId: unpaidOrgUser._id,
                organizationName: "Unpaid Org Studios",
                isPaid: false
            });
            const project = await Project.create({
                organizationId: org._id,
                projectName: "Unpaid Project"
            });

            const oppRes = await request(app)
                .post("/api/opportunities")
                .set("Authorization", `Bearer ${unpaidOrgToken}`)
                .send({
                    projectId: project._id,
                    title: "Test Role",
                    role: "Actor",
                    summary: "Role description",
                    location: "Bengaluru",
                    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                });

            expect(oppRes.status).toBe(403);
            expect(oppRes.body.success).toBe(false);
            expect(oppRes.body.message).toMatch(/paid/i);
        });
    });


    describe("A8: Account Lifecycle & Admin Moderation", () => {
        it("should handle self-deletion request and reject subsequent logins", async () => {
            const user = await createTestUser({
                email: "delete.me@example.com",
                password: "Password123!",
                status: "active"
            });
            const { token } = await generateAuthToken(user);

            const deleteRes = await request(app)
                .delete("/api/auth/account")
                .set("Authorization", `Bearer ${token}`);

            expect(deleteRes.status).toBe(200);

            const updatedUser = await User.findById(user._id);
            expect(updatedUser.status).toBe("deletion_requested");

            // Attempt login
            const loginRes = await request(app)
                .post("/api/auth/login")
                .send({ email: "delete.me@example.com", password: "Password123!" });

            expect(loginRes.status).toBe(403);
        });

        it("should allow admin to ban user and block access", async () => {
            const admin = await createTestUser({ email: "admin.ban@example.com", role: "admin" });
            const adminToken = (await generateAuthToken(admin)).token;

            const targetUser = await createTestUser({
                email: "target.banned@example.com",
                password: "Password123!",
                status: "active"
            });

            const banRes = await request(app)
                .patch(`/api/admin/users/${targetUser._id}/ban`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ reason: "Terms of service violation" });

            expect(banRes.status).toBe(200);
            const updated = await User.findById(targetUser._id);
            expect(updated.status).toBe("banned");

            // Login attempt
            const loginRes = await request(app)
                .post("/api/auth/login")
                .send({ email: "target.banned@example.com", password: "Password123!" });

            expect(loginRes.status).toBe(403);
        });

        it("should allow admin to finalize user deletion and scrub PII", async () => {
            const admin = await createTestUser({ email: "admin.delete@example.com", role: "admin" });
            const adminToken = (await generateAuthToken(admin)).token;

            const targetUser = await createTestUser({
                email: "target.scrub@example.com",
                mobile: "+919876500000",
                name: "Real Name Target",
                status: "deletion_requested"
            });

            const finalizeRes = await request(app)
                .post(`/api/admin/users/${targetUser._id}/finalize-deletion`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(finalizeRes.status).toBe(200);

            const scrubbed = await User.findById(targetUser._id);
            expect(scrubbed.status).toBe("deleted");
            expect(scrubbed.name).toBe("Deleted User");
            expect(scrubbed.email).toBe(`deleted_${targetUser._id}@deleted.local`);
            expect(scrubbed.mobile).toBeUndefined();
        });
    });

    describe("A9: Email Change with Re-Verification & Mobile Policy", () => {
        it("should require password, send verification OTP to new email, and update email upon verification", async () => {
            const user = await createTestUser({
                email: "current.email@example.com",
                password: "Password123!"
            });
            const { token } = await generateAuthToken(user);

            // 1. Request email change
            const reqRes = await request(app)
                .post("/api/auth/change-email")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    newEmail: "new.verified@example.com",
                    password: "Password123!"
                });

            expect(reqRes.status).toBe(200);
            const outbox = getOutbox();
            const emailObj = outbox.find(e => e.to === "new.verified@example.com");
            expect(emailObj).toBeDefined();
            const otpCode = emailObj.text.match(/\b\d{6}\b/)[0];

            // 2. Verify email change
            const verifyRes = await request(app)
                .post("/api/auth/verify-email-change")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    newEmail: "new.verified@example.com",
                    otp: otpCode
                });

            expect(verifyRes.status).toBe(200);

            const updatedUser = await User.findById(user._id);
            expect(updatedUser.email).toBe("new.verified@example.com");
        });

        it("should disallow changing mobile number with 403", async () => {
            const user = await createTestUser({ email: "mobile.user@example.com" });
            const { token } = await generateAuthToken(user);

            const res = await request(app)
                .put("/api/auth/change-mobile")
                .set("Authorization", `Bearer ${token}`)
                .send({ mobile: "9876543210" });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/not permitted/i);
        });
    });
});
