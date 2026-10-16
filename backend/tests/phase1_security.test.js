const request = require("supertest");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const app = require("../src/app");
const { connectDB, clearDB, disconnectDB } = require("./helpers/db");
const { createUser, createAdmin } = require("./helpers/factory");
const { generateAuthToken } = require("./helpers/auth");
const { validateEnvironment } = require("../server");
const Otp = require("../src/models/otp.model");
const Session = require("../src/models/session.model");
const RegistrationDraft = require("../src/models/registrationDraft.model");
const User = require("../src/models/user.model");

jest.setTimeout(60000);

beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = "vismaya_test_jwt_secret_must_be_over_32_characters_long_1234567890";
    process.env.ALLOW_FAKE_GOOGLE_TOKENS = "true";
    process.env.RAZORPAY_WEBHOOK_SECRET = "test_razorpay_mock_webhook_secret_12345";
    await connectDB();
});

beforeEach(async () => {
    await clearDB();
});

afterAll(async () => {
    await disconnectDB();
});

describe("Phase 1: Security & Platform Fixes", () => {

    describe("S1: Google Authentication Signature & Admin Guards", () => {
        it("rejects plain email strings and malformed tokens (400)", async () => {
            const res = await request(app)
                .post("/api/auth/google")
                .send({ idToken: "plain_email_attacker@example.com", role: "talent" });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);

            const userInDb = await User.findOne({ email: "plain_email_attacker@example.com" });
            expect(userInDb).toBeNull();
        });

        it("rejects unverified Google accounts (email_verified === false)", async () => {
            const res = await request(app)
                .post("/api/auth/google")
                .send({ idToken: "unverified_google_token_unverified@example.com", role: "talent" });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/not verified/i);
        });

        it("rejects Google login for existing admin accounts (403)", async () => {
            const admin = await createAdmin({ email: "admin@vismayastudios.com" });

            const res = await request(app)
                .post("/api/auth/google")
                .send({ idToken: `valid_google_token_${admin.email}`, role: "talent" });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/disabled for administrative accounts/i);
        });

        it("rejects request attempting to create admin role via Google (400)", async () => {
            const res = await request(app)
                .post("/api/auth/google")
                .send({ idToken: "valid_google_token_hacker@example.com", role: "admin" });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it("successfully logs in valid verified Google user", async () => {
            const res = await request(app)
                .post("/api/auth/google")
                .send({ idToken: "valid_google_token_talent_user@example.com", role: "talent" });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
            expect(res.body.sessionId).toBeDefined();
            expect(res.body.user.email).toBe("talent_user@example.com");
        });
    });

    describe("S2: Startup Environment Validation", () => {
        it("throws when JWT_SECRET is shorter than 32 characters in production/dev", () => {
            expect(() => {
                validateEnvironment({
                    NODE_ENV: "production",
                    MONGODB_URI: "mongodb+srv://user:pass@cluster.mongodb.net/vismaya",
                    JWT_SECRET: "short_secret_under_32_chars"
                });
            }).toThrow(/too short/i);
        });

        it("throws when JWT_SECRET matches a known insecure default", () => {
            expect(() => {
                validateEnvironment({
                    NODE_ENV: "production",
                    MONGODB_URI: "mongodb+srv://user:pass@cluster.mongodb.net/vismaya",
                    JWT_SECRET: "vismaya_dev_secret_change_this_later"
                });
            }).toThrow(/matches a known insecure default/i);
        });

        it("throws when MONGODB_URI is missing or placeholder", () => {
            expect(() => {
                validateEnvironment({
                    NODE_ENV: "production",
                    MONGODB_URI: "",
                    JWT_SECRET: "valid_length_jwt_secret_with_more_than_32_characters_12345"
                });
            }).toThrow(/MONGODB_URI is missing/i);
        });

        it("passes when valid configuration is provided in production", () => {
            expect(validateEnvironment({
                NODE_ENV: "production",
                MONGODB_URI: "mongodb+srv://user:realpassword@cluster.mongodb.net/vismaya",
                JWT_SECRET: "valid_length_jwt_secret_with_more_than_32_characters_12345"
            })).toBe(true);
        });
    });

    describe("S4: Registration Draft Ownership & Token Protection", () => {
        it("returns a secure draft token upon draft creation (201)", async () => {
            const res = await request(app)
                .post("/api/auth/draft")
                .send({
                    email: "draft_user@example.com",
                    role: "talent",
                    currentStep: 1,
                    formData: { firstName: "Draft" }
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.draftToken).toBeDefined();
            expect(res.headers["x-draft-token"]).toBeDefined();
        });

        it("rejects reading draft without x-draft-token header (401)", async () => {
            // Create draft first
            const createRes = await request(app)
                .post("/api/auth/draft")
                .send({
                    email: "draft_user@example.com",
                    role: "talent",
                    currentStep: 1,
                    formData: { secretData: "secret" }
                });

            const readRes = await request(app)
                .get("/api/auth/draft?email=draft_user@example.com");

            expect(readRes.status).toBe(401);
            expect(readRes.body.success).toBe(false);
            expect(readRes.body.message).toMatch(/x-draft-token header is required/i);
        });

        it("rejects updating another user's draft with an invalid token (403)", async () => {
            const createRes = await request(app)
                .post("/api/auth/draft")
                .send({
                    email: "user_a@example.com",
                    role: "talent",
                    currentStep: 1,
                    formData: { name: "User A" }
                });

            const attackRes = await request(app)
                .post("/api/auth/draft")
                .set("x-draft-token", "invalid_forged_draft_token_12345678")
                .send({
                    email: "user_a@example.com",
                    role: "talent",
                    currentStep: 2,
                    formData: { name: "Tampered" }
                });

            expect(attackRes.status).toBe(403);
            expect(attackRes.body.success).toBe(false);
        });

        it("allows reading and deleting draft with valid x-draft-token", async () => {
            const createRes = await request(app)
                .post("/api/auth/draft")
                .send({
                    email: "legit_user@example.com",
                    role: "talent",
                    currentStep: 1,
                    formData: { bio: "Hello" }
                });

            const draftToken = createRes.body.draftToken;

            // Read
            const readRes = await request(app)
                .get("/api/auth/draft")
                .set("x-draft-token", draftToken);

            expect(readRes.status).toBe(200);
            expect(readRes.body.draft.formData.bio).toBe("Hello");

            // Delete
            const deleteRes = await request(app)
                .delete("/api/auth/draft")
                .set("x-draft-token", draftToken);

            expect(deleteRes.status).toBe(200);

            // Verify deleted
            const reReadRes = await request(app)
                .get("/api/auth/draft")
                .set("x-draft-token", draftToken);

            expect(reReadRes.status).toBe(404);
        });
    });

    describe("S5: Password Reset, OTP Attempt Limits & Session Revocation", () => {
        it("invalidates OTP after 5 incorrect attempts (429)", async () => {
            const user = await createUser({ email: "otp_test@example.com", password: "OldPassword@123" });

            // Request forgot password
            await request(app)
                .post("/api/auth/forgot-password")
                .send({ email: user.email });

            // Try 5 incorrect OTPs
            for (let i = 1; i <= 4; i++) {
                const res = await request(app)
                    .post("/api/auth/verify-otp")
                    .send({ email: user.email, otp: "000000" });

                expect(res.status).toBe(400);
            }

            // 5th incorrect attempt -> 429
            const finalRes = await request(app)
                .post("/api/auth/verify-otp")
                .send({ email: user.email, otp: "000000" });

            expect(finalRes.status).toBe(429);
            expect(finalRes.body.message).toMatch(/too many incorrect attempts/i);

            // Verify OTP record was wiped
            const otpInDb = await Otp.findOne({ email: user.email });
            expect(otpInDb).toBeNull();
        });

        it("enforces single-use reset token and revokes active sessions after reset", async () => {
            const user = await createUser({ email: "single_use@example.com", password: "OriginalPassword@123" });

            // Create an active session
            const { token: userToken, sessionId } = await generateAuthToken(user);

            // Request forgot password
            await request(app)
                .post("/api/auth/forgot-password")
                .send({ email: user.email });

            // Fetch OTP directly from DB for test verification
            const otpRecord = await Otp.findOne({ email: user.email });
            expect(otpRecord).toBeDefined();

            // Create a valid reset token
            const resetToken = jwt.sign(
                { email: user.email, purpose: "password_reset", otpId: otpRecord._id.toString() },
                process.env.JWT_SECRET,
                { expiresIn: "15m" }
            );

            // First reset -> 200
            const resetRes1 = await request(app)
                .post("/api/auth/reset-password")
                .send({
                    resetToken,
                    newPassword: "BrandNewPassword@123"
                });

            expect(resetRes1.status).toBe(200);
            expect(resetRes1.body.success).toBe(true);

            // Second reset attempt with same token -> 401 (single-use)
            const resetRes2 = await request(app)
                .post("/api/auth/reset-password")
                .send({
                    resetToken,
                    newPassword: "AnotherNewPassword@123"
                });

            expect(resetRes2.status).toBe(401);
            expect(resetRes2.body.message).toMatch(/already been used/i);

            // Verify session was revoked in DB
            const sessionInDb = await Session.findOne({ sessionId });
            expect(sessionInDb.isValid).toBe(false);

            // Authenticated request with old token should now be rejected (401)
            const checkSessionRes = await request(app)
                .get("/api/auth/sessions")
                .set("Authorization", `Bearer ${userToken}`);

            expect(checkSessionRes.status).toBe(401);
        });

        it("revokes all active user sessions after change-password", async () => {
            const user = await createUser({ password: "InitialPassword@123" });
            const { token, sessionId } = await generateAuthToken(user);

            const changeRes = await request(app)
                .post("/api/auth/change-password")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    currentPassword: "InitialPassword@123",
                    newPassword: "ChangedPassword@123"
                });

            expect(changeRes.status).toBe(200);

            // Session is revoked
            const sessionInDb = await Session.findOne({ sessionId });
            expect(sessionInDb.isValid).toBe(false);

            // Further authenticated request fails
            const followUp = await request(app)
                .get("/api/auth/sessions")
                .set("Authorization", `Bearer ${token}`);

            expect(followUp.status).toBe(401);
        });
    });

    describe("S6: Session Integrity & JWT Enforcement", () => {
        it("rejects JWT without sessionId (401)", async () => {
            const user = await createUser();
            const { token } = await generateAuthToken(user, { noSession: true });

            const res = await request(app)
                .get("/api/auth/sessions")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(401);
            expect(res.body.message).toMatch(/session identifier missing/i);
        });

        it("rejects forged or expired JWTs (401)", async () => {
            const res = await request(app)
                .get("/api/auth/sessions")
                .set("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.forged.signature");

            expect(res.status).toBe(401);
        });
    });

    describe("S8: Webhook HMAC Signature over Raw Bytes", () => {
        it("verifies valid HMAC over raw bytes and rejects forged signatures (400)", async () => {
            const payload = JSON.stringify({
                event: "payment.captured",
                payload: {
                    payment: {
                        entity: {
                            id: "pay_test_12345",
                            order_id: "order_test_12345"
                        }
                    }
                }
            });

            // Calculate valid HMAC signature over raw payload bytes
            const validSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
                .update(Buffer.from(payload))
                .digest("hex");

            // Valid signature -> 200
            const validRes = await request(app)
                .post("/api/payments/webhook")
                .set("x-razorpay-signature", validSignature)
                .set("Content-Type", "application/json")
                .send(payload);

            expect(validRes.status).toBe(200);
            expect(validRes.body.status).toBe("ok");

            // Forged signature -> 400
            const forgedRes = await request(app)
                .post("/api/payments/webhook")
                .set("x-razorpay-signature", "forged_invalid_signature_hex_1234567890abcdef")
                .set("Content-Type", "application/json")
                .send(payload);

            expect(forgedRes.status).toBe(400);
            expect(forgedRes.body.message).toMatch(/invalid webhook signature/i);
        });
    });

    describe("S9: Helper and Test Route Exposure", () => {
        it("verifies /api/projects/test no longer returns test route success response", async () => {
            const res = await request(app).get("/api/projects/test");
            expect(res.body.message).not.toBe("Project route is working");
        });

        it("does not mount /api/test in production environment", async () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = "production";
            // Require fresh app instance under production NODE_ENV
            jest.resetModules();
            const prodApp = require("../src/app");
            const res = await request(prodApp).get("/api/test/protected");
            expect(res.status).toBe(404);
            process.env.NODE_ENV = originalEnv;
        });
    });

    describe("S10: ObjectId Validation", () => {
        it("returns 400 Bad Request instead of 500 CastError for malformed ObjectIds", async () => {
            const user = await createUser({ role: "organization" });
            const { token } = await generateAuthToken(user);

            const res = await request(app)
                .get("/api/projects/invalid-hex-id-123")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/invalid identifier format/i);
        });
    });

    describe("S11: Request ID Header & Tracing", () => {
        it("attaches x-request-id header to every response", async () => {
            const res = await request(app).get("/api/health");
            expect(res.headers["x-request-id"]).toBeDefined();
            expect(typeof res.headers["x-request-id"]).toBe("string");
        });

        it("preserves incoming x-request-id header", async () => {
            const customRequestId = "client-trace-id-abc-123";
            const res = await request(app)
                .get("/api/health")
                .set("x-request-id", customRequestId);

            expect(res.headers["x-request-id"]).toBe(customRequestId);
        });
    });

});
