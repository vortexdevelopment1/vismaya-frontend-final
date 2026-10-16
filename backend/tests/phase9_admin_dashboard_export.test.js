const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const { connectDB, clearDB, disconnectDB } = require("./helpers/db");
const { generateAuthToken } = require("./helpers/auth");

const User = require("../src/models/user.model");
const Organization = require("../src/models/organization.model");
const Opportunity = require("../src/models/opportunity.model");
const Application = require("../src/models/application.model");
const Project = require("../src/models/project.model");
const TalentProfile = require("../src/models/talentProfile.model");
const PaymentTransaction = require("../src/models/paymentTransaction.model");

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

describe("Phase 9: Admin Dashboard, Search, Export & Single Super-Admin (AD1 - AD6)", () => {
    let adminUser, adminToken;
    let orgUser, orgProfile, project, opportunity;
    let talentUser, talentProfile;

    beforeEach(async () => {
        // Admin
        adminUser = await User.create({
            name: "Super Administrator",
            email: "superadmin@vismaya.com",
            password: "Password123!",
            role: "admin",
            status: "active",
            isPaid: true
        });
        const adminAuth = await generateAuthToken(adminUser);
        adminToken = adminAuth.token;

        // Organization
        orgUser = await User.create({
            name: "Paramount Studio",
            email: "studio@paramount.com",
            password: "Password123!",
            role: "organization",
            status: "active",
            isPaid: true
        });

        orgProfile = await Organization.create({
            userId: orgUser._id,
            organizationName: "Paramount Studio",
            slug: "paramount-studio",
            organizationType: "Production House"
        });

        project = await Project.create({
            organizationId: orgProfile._id,
            projectName: "Blockbuster 2026"
        });

        opportunity = await Opportunity.create({
            projectId: project._id,
            organizationId: orgProfile._id,
            title: "Lead Protagonist",
            summary: "Lead Protagonist in Feature Film",
            role: "Protagonist",
            location: "Mumbai",
            category: "acting",
            status: "published",
            positionsCount: 2,
            deadline: new Date(Date.now() + 86400000 * 30),
            applicationDeadline: new Date(Date.now() + 86400000 * 30)
        });

        // Talent
        talentUser = await User.create({
            name: "Priya Star",
            email: "priya@star.com",
            password: "Password123!",
            role: "talent",
            status: "active",
            isPaid: true
        });

        talentProfile = await TalentProfile.create({
            userId: talentUser._id,
            vismayaId: "VIS-9001",
            firstName: "Priya",
            lastName: "Star",
            primaryProfession: "Actor",
            profileCompletionPercentage: 80,
            isSearchable: true
        });

        // Application
        await Application.create({
            opportunityId: opportunity._id,
            talentId: talentUser._id,
            status: "applied",
            consentGiven: true
        });

        // Payment
        await PaymentTransaction.create({
            userId: talentUser._id,
            packageType: "talent_annual_999",
            orderId: "order_99999",
            paymentId: "pay_99999",
            amount: 999,
            currency: "INR",
            status: "successful",
            invoiceNumber: "INV-2026-9999"
        });
    });

    describe("AD1: Global Admin Search with Regex Escaping", () => {
        it("returns cross-entity search results matching query", async () => {
            const res = await request(app)
                .get("/api/admin/search?q=paramount")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.results.organizations.length).toBeGreaterThanOrEqual(1);
            expect(res.body.results.organizations[0].organizationName).toBe("Paramount Studio");
        });

        it("safely handles regex special characters without crashing (ReDoS protection)", async () => {
            const res = await request(app)
                .get("/api/admin/search?q=(.*)+$")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe("AD2: Dashboard Metrics & Operational CSV Export", () => {
        it("computes and returns dashboard metrics aggregate", async () => {
            const res = await request(app)
                .get("/api/admin/dashboard")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.metrics.users.total).toBe(3); // admin, org, talent
            expect(res.body.metrics.opportunities.published).toBe(1);
            expect(res.body.metrics.applications.total).toBe(1);
            expect(res.body.metrics.revenue.totalINR).toBe(999);
        });

        it("exports users as CSV via GET /api/admin/export/users", async () => {
            const res = await request(app)
                .get("/api/admin/export/users")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.headers["content-type"]).toMatch(/text\/csv/);
            expect(res.text).toContain("ID,Name,Email,Role,Status,IsPaid,CreatedAt");
            expect(res.text).toContain("superadmin@vismaya.com");
            expect(res.text).toContain("priya@star.com");
        });

        it("exports opportunities as CSV via GET /api/admin/export/opportunities", async () => {
            const res = await request(app)
                .get("/api/admin/export/opportunities")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.headers["content-type"]).toMatch(/text\/csv/);
            expect(res.text).toContain("Lead Protagonist");
        });

        it("exports transactions as CSV via GET /api/admin/export/transactions", async () => {
            const res = await request(app)
                .get("/api/admin/export/transactions")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.headers["content-type"]).toMatch(/text\/csv/);
            expect(res.text).toContain("INV-2026-9999");
        });

        it("returns 400 for unsupported export type", async () => {
            const res = await request(app)
                .get("/api/admin/export/invalid_entity_type")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/unsupported export type/i);
        });
    });
});
