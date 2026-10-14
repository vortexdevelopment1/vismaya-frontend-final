const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const { connectDB, clearDB, disconnectDB } = require("./helpers/db");
const { generateAuthToken } = require("./helpers/auth");

const User = require("../src/models/user.model");
const AdminAuditLog = require("../src/models/adminAuditLog.model");
const Notification = require("../src/models/notification.model");
const { audit, sanitizeAuditMeta } = require("../src/services/auditLog.service");
const { notifyUser } = require("../src/services/notification.service");

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

describe("Phase 8: Notifications & Audit Logging (N1 - N2)", () => {
    let adminUser, adminToken;
    let talentUser, talentToken;

    beforeEach(async () => {
        adminUser = await User.create({
            name: "Audit Admin",
            email: "auditadmin@vismaya.com",
            password: "Password123!",
            role: "admin",
            status: "active",
            isPaid: true
        });
        const adminAuth = await generateAuthToken(adminUser);
        adminToken = adminAuth.token;

        talentUser = await User.create({
            name: "John Performer",
            email: "john@performer.com",
            password: "Password123!",
            role: "talent",
            status: "active",
            isPaid: true
        });
        const talentAuth = await generateAuthToken(talentUser);
        talentToken = talentAuth.token;
    });

    describe("N1: Notification Service & Delivery", () => {
        it("creates in-app notifications and queries them", async () => {
            const notif = await notifyUser({
                recipientId: talentUser._id,
                type: "application_submitted",
                title: "Application Received",
                message: "Your application for the role has been successfully submitted.",
                referenceType: "Application"
            });

            expect(notif).toBeDefined();
            expect(notif.recipient.toString()).toBe(talentUser._id.toString());
            expect(notif.type).toBe("application_submitted");

            const inDb = await Notification.findOne({ recipient: talentUser._id, type: "application_submitted" });
            expect(inDb).toBeTruthy();
            expect(inDb.isRead).toBe(false);
        });
    });

    describe("N2: Audit Service & Sensitive Data Redaction", () => {
        it("redacts sensitive fields (passwords, OTPs, tokens, secrets, card data, ID numbers) from audit meta", () => {
            const sensitiveInput = {
                username: "johndoe",
                password: "PlainPassword123!",
                otp: "123456",
                token: "jwt.token.here",
                jwt: "bearer-token",
                secretKey: "secret_12345",
                cardNumber: "4111222233334444",
                cvv: "123",
                idNumber: "ABCDE1234F",
                validField: "kept_safe",
                nested: {
                    rawPassword: "secret_pass",
                    safeData: 42
                }
            };

            const sanitized = sanitizeAuditMeta(sensitiveInput);

            expect(sanitized.password).toBeUndefined();
            expect(sanitized.otp).toBeUndefined();
            expect(sanitized.token).toBeUndefined();
            expect(sanitized.jwt).toBeUndefined();
            expect(sanitized.secretKey).toBeUndefined();
            expect(sanitized.cardNumber).toBeUndefined();
            expect(sanitized.cvv).toBeUndefined();
            expect(sanitized.idNumber).toBeUndefined();
            expect(sanitized.validField).toBe("kept_safe");
            expect(sanitized.nested.rawPassword).toBeUndefined();
            expect(sanitized.nested.safeData).toBe(42);
        });

        it("logs audit events via audit() service without sensitive keys", async () => {
            const log = await audit({
                actor: adminUser._id,
                actorRole: "admin",
                action: "UPDATE_VERIFICATION",
                entityType: "User",
                entityId: talentUser._id,
                requestId: "req-12345-abc",
                meta: {
                    verificationStatus: "approved",
                    password: "attempted_leak_password",
                    adminNotes: "Identity verified via passport"
                }
            });

            expect(log).toBeDefined();
            expect(log.action).toBe("UPDATE_VERIFICATION");
            expect(log.entityType).toBe("User");
            expect(log.requestId).toBe("req-12345-abc");
            expect(log.meta.verificationStatus).toBe("approved");
            expect(log.meta.password).toBeUndefined();

            const fromDb = await AdminAuditLog.findById(log._id);
            expect(fromDb).toBeTruthy();
            expect(fromDb.meta.password).toBeUndefined();
        });

        it("admin fetches paginated and filtered audit logs via GET /api/admin/audit-logs", async () => {
            // Seed a few audit logs
            await audit({
                actor: adminUser._id,
                action: "BAN_USER",
                entityType: "User",
                entityId: talentUser._id,
                meta: { reason: "Terms violation" }
            });

            await audit({
                actor: adminUser._id,
                action: "APPROVE_OPPORTUNITY",
                entityType: "Opportunity",
                meta: { title: "Lead Actor" }
            });

            // Fetch all logs
            const allRes = await request(app)
                .get("/api/admin/audit-logs")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(allRes.status).toBe(200);
            expect(allRes.body.success).toBe(true);
            expect(allRes.body.total).toBe(2);

            // Filter by action
            const filteredRes = await request(app)
                .get("/api/admin/audit-logs?action=BAN_USER")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(filteredRes.status).toBe(200);
            expect(filteredRes.body.total).toBe(1);
            expect(filteredRes.body.logs[0].action).toBe("BAN_USER");
        });
    });
});
