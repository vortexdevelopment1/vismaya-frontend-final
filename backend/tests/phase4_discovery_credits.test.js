const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const { connectDB, clearDB, disconnectDB } = require("./helpers/db");
const { createTalentUser, createOrgUser, createAdminUser } = require("./helpers/factory");
const { getAuthHeader } = require("./helpers/auth");
const TalentProfile = require("../src/models/talentProfile.model");
const CreditLedger = require("../src/models/creditLedger.model");
const CreditViewHistory = require("../src/models/creditViewHistory.model");
const Project = require("../src/models/project.model");
const ProjectShortlist = require("../src/models/projectShortlist.model");
const Favourite = require("../src/models/favourite.model");
const Application = require("../src/models/application.model");
const Opportunity = require("../src/models/opportunity.model");
const User = require("../src/models/user.model");
const { toCard, toLimitedPreview, toFullProfile, checkDenyList, FORBIDDEN_ORGANIZATION_FULL_KEYS } = require("../src/utils/serializers/talent");

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

describe("Phase 4: Discovery, Search, Credits & Unlock System (D1 - D6)", () => {

    describe("D1 & D3: Privacy Serializers & Role-Aware Search", () => {
        it("should reject unauthenticated search requests with 401", async () => {
            const res = await request(app).get("/api/talent-profiles/search");
            expect(res.status).toBe(401);
        });

        it("should hide city from card view for talent viewers but show to organization viewers", async () => {
            const { user: talent1, token: talentToken1 } = await createTalentUser({ isPaid: true });
            await TalentProfile.create({
                userId: talent1._id,
                vismayaId: "VIS-111222",
                stageName: "Talent City Star",
                category: "open_talent",
                primaryProfession: "Actors",
                currentCity: "Mumbai",
                currentState: "Maharashtra",
                isSearchable: true,
                profileCompletionPercentage: 85
            });

            // Talent viewer search
            const resTalent = await request(app)
                .get("/api/talent-profiles/search")
                .set("Authorization", getAuthHeader(talentToken1));

            expect(resTalent.status).toBe(200);
            expect(resTalent.body.cards.length).toBeGreaterThan(0);
            const cardForTalent = resTalent.body.cards.find(c => c.vismayaId === "VIS-111222");
            expect(cardForTalent.currentCity).toBeUndefined();

            // Org viewer search
            const { org, token: orgToken } = await createOrgUser({ isPaid: true });
            const resOrg = await request(app)
                .get("/api/talent-profiles/search")
                .set("Authorization", getAuthHeader(orgToken));

            expect(resOrg.status).toBe(200);
            const cardForOrg = resOrg.body.cards.find(c => c.vismayaId === "VIS-111222");
            expect(cardForOrg.currentCity).toBe("Mumbai");
        });

        it("should exclude non-active or suspended users from search results", async () => {
            const { user: talentUser, token: talentToken } = await createTalentUser({ isPaid: true, status: "suspended" });
            await TalentProfile.create({
                userId: talentUser._id,
                vismayaId: "VIS-333444",
                stageName: "Suspended Star",
                primaryProfession: "Models",
                isSearchable: true,
                profileCompletionPercentage: 80
            });

            const { org, token: orgToken } = await createOrgUser({ isPaid: true });
            const res = await request(app)
                .get("/api/talent-profiles/search?q=Suspended")
                .set("Authorization", getAuthHeader(orgToken));

            expect(res.status).toBe(200);
            expect(res.body.cards.length).toBe(0);
        });

        it("should pass deny-list safety tests across all serializers", () => {
            const sample = {
                firstName: "Alice",
                lastName: "Wonder",
                email: "alice@secret.com",
                mobile: "+919876543210",
                remunerationExpectation: { ratePerDay: 10000 },
                physicalAttributes: { heightCm: 175 },
                guardianDetails: { guardianName: "Guardian" },
                otp: "123456",
                password: "hash"
            };

            const card = toCard(sample, "guest");
            expect(checkDenyList(card)).toBe(true);

            const preview = toLimitedPreview(sample, "guest");
            expect(checkDenyList(preview)).toBe(true);

            const fullOrg = toFullProfile(sample, { role: "organization" }, { isUnlocked: true });
            expect(checkDenyList(fullOrg)).toBe(true);
        });
    });

    describe("D2 & D4: Credit Consumption, Exemption & Unlock System", () => {
        it("should allow organization to view limited preview for FREE without consuming credits", async () => {
            const { user: talentUser } = await createTalentUser({ isPaid: true });
            const profile = await TalentProfile.create({
                userId: talentUser._id,
                vismayaId: "VIS-444555",
                stageName: "Preview Star",
                primaryProfession: "Singers & Rappers",
                isSearchable: true,
                profileCompletionPercentage: 80
            });

            const { org, token: orgToken } = await createOrgUser({ isPaid: true });
            await CreditLedger.create({
                organizationId: org._id,
                balance: 100,
                includedCredits: 100,
                purchasedCredits: 0,
                consumedCredits: 0
            });

            // GET profile before unlock -> limited preview (isUnlocked: false)
            const resPreview = await request(app)
                .get(`/api/talent-profiles/${profile.vismayaId}`)
                .set("Authorization", getAuthHeader(orgToken));

            expect(resPreview.status).toBe(200);
            expect(resPreview.body.isUnlocked).toBe(false);

            // Ledger balance must remain intact (100)
            const ledger = await CreditLedger.findOne({ organizationId: org._id });
            expect(ledger.balance).toBe(100);
            expect(ledger.consumedCredits).toBe(0);
        });

        it("should unlock profile, consume 1 credit, and grant 7-day free exemption on subsequent views", async () => {
            const { user: talentUser } = await createTalentUser({ isPaid: true });
            const profile = await TalentProfile.create({
                userId: talentUser._id,
                vismayaId: "VIS-555666",
                stageName: "Unlock Star",
                primaryProfession: "Actors",
                isSearchable: true,
                profileCompletionPercentage: 80
            });

            const { org, token: orgToken } = await createOrgUser({ isPaid: true });
            await CreditLedger.create({
                organizationId: org._id,
                balance: 10,
                includedCredits: 10,
                purchasedCredits: 0,
                consumedCredits: 0
            });

            // 1. First Unlock: charges 1 credit
            const resUnlock = await request(app)
                .post(`/api/talent-profiles/${profile.vismayaId}/unlock`)
                .set("Authorization", getAuthHeader(orgToken));

            expect(resUnlock.status).toBe(200);
            expect(resUnlock.body.consumed).toBe(true);
            expect(resUnlock.body.creditBalance).toBe(9);
            expect(resUnlock.body.lowBalanceWarning).toBe(true); // 9 is < 10

            // 2. Second view / unlock within 7 days: 0 credits charged
            const resView2 = await request(app)
                .get(`/api/talent-profiles/${profile.vismayaId}`)
                .set("Authorization", getAuthHeader(orgToken));

            expect(resView2.status).toBe(200);
            expect(resView2.body.isUnlocked).toBe(true);

            const resUnlock2 = await request(app)
                .post(`/api/talent-profiles/${profile.vismayaId}/unlock`)
                .set("Authorization", getAuthHeader(orgToken));

            expect(resUnlock2.status).toBe(200);
            expect(resUnlock2.body.consumed).toBe(false);
            expect(resUnlock2.body.creditBalance).toBe(9);
        });

        it("should return 402 with buyMoreViews:true when credit balance is zero", async () => {
            const { user: talentUser } = await createTalentUser({ isPaid: true });
            const profile = await TalentProfile.create({
                userId: talentUser._id,
                vismayaId: "VIS-777888",
                stageName: "Broke Org Star",
                primaryProfession: "Actors",
                isSearchable: true,
                profileCompletionPercentage: 80
            });

            const { org, token: orgToken } = await createOrgUser({ isPaid: true });
            await CreditLedger.create({
                organizationId: org._id,
                balance: 0,
                includedCredits: 0,
                purchasedCredits: 0,
                consumedCredits: 0
            });

            const res = await request(app)
                .post(`/api/talent-profiles/${profile.vismayaId}/unlock`)
                .set("Authorization", getAuthHeader(orgToken));

            expect(res.status).toBe(402);
            expect(res.body.buyMoreViews).toBe(true);
        });

        it("should return paginated viewed talents via GET /api/credits/viewed", async () => {
            const { user: talentUser } = await createTalentUser({ isPaid: true });
            const profile = await TalentProfile.create({
                userId: talentUser._id,
                vismayaId: "VIS-888999",
                stageName: "History Star",
                primaryProfession: "Actors",
                isSearchable: true,
                profileCompletionPercentage: 80
            });

            const { org, token: orgToken } = await createOrgUser({ isPaid: true });
            await CreditLedger.create({
                organizationId: org._id,
                balance: 100,
                includedCredits: 100,
                purchasedCredits: 0,
                consumedCredits: 0
            });

            // Unlock profile
            await request(app)
                .post(`/api/talent-profiles/${profile.vismayaId}/unlock`)
                .set("Authorization", getAuthHeader(orgToken));

            // Fetch viewed talents
            const resViewed = await request(app)
                .get("/api/credits/viewed")
                .set("Authorization", getAuthHeader(orgToken));

            expect(resViewed.status).toBe(200);
            expect(resViewed.body.viewedTalents.length).toBe(1);
            expect(resViewed.body.viewedTalents[0].isExemptionActive).toBe(true);
        });

        it("should assert 404 for org-to-org credit transfer endpoint", async () => {
            const { org, token: orgToken } = await createOrgUser({ isPaid: true });
            const res = await request(app)
                .post("/api/credits/transfer")
                .set("Authorization", getAuthHeader(orgToken))
                .send({ recipientOrgId: new mongoose.Types.ObjectId(), amount: 10 });

            expect(res.status).toBe(404);
        });
    });

    describe("D5: Favourites & Project Shortlist Governance", () => {
        it("should allow bookmarking with predefined tags only and reject invalid tags", async () => {
            const { user: talentUser } = await createTalentUser({ isPaid: true });
            const profile = await TalentProfile.create({
                userId: talentUser._id,
                vismayaId: "VIS-121212",
                stageName: "Fav Star",
                primaryProfession: "Actors"
            });

            const { org, token: orgToken } = await createOrgUser({ isPaid: true });

            // Invalid tag -> 400
            const resInvalid = await request(app)
                .post("/api/organization/favourites")
                .set("Authorization", getAuthHeader(orgToken))
                .send({
                    talentId: talentUser._id,
                    tags: ["CustomNonStandardTag"]
                });

            expect(resInvalid.status).toBe(400);

            // Valid tag -> 201
            const resValid = await request(app)
                .post("/api/organization/favourites")
                .set("Authorization", getAuthHeader(orgToken))
                .send({
                    talentId: talentUser._id,
                    tags: ["Lead Candidate", "Audition Ready"]
                });

            expect(resValid.status).toBe(201);
            expect(resValid.body.favourite.tags).toContain("Lead Candidate");
        });

        it("should enforce that shortlisting requires an unlocked full profile view or applicant status", async () => {
            const { user: talentUser } = await createTalentUser({ isPaid: true });
            const profile = await TalentProfile.create({
                userId: talentUser._id,
                vismayaId: "VIS-343434",
                stageName: "Shortlist Candidate",
                primaryProfession: "Actors"
            });

            const { org, token: orgToken } = await createOrgUser({ isPaid: true });
            const project = await Project.create({
                organizationId: org._id,
                projectName: "Mega Feature Film",
                projectType: "Feature Film"
            });

            // 1. Not unlocked and not applicant -> 403
            const resFail = await request(app)
                .post(`/api/projects/${project._id}/shortlist`)
                .set("Authorization", getAuthHeader(orgToken))
                .send({
                    talentId: talentUser._id,
                    role: "Protagonist"
                });

            expect(resFail.status).toBe(403);
            expect(resFail.body.message).toMatch(/unlocked full profile view or the talent to be an applicant/i);

            // 2. Organization unlocks the profile
            await CreditViewHistory.create({
                organizationId: org._id,
                talentId: talentUser._id,
                firstViewedAt: new Date(),
                lastViewedAt: new Date(),
                exemptionExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });

            // 3. Now shortlisting succeeds -> 201
            const resSuccess = await request(app)
                .post(`/api/projects/${project._id}/shortlist`)
                .set("Authorization", getAuthHeader(orgToken))
                .send({
                    talentId: talentUser._id,
                    role: "Protagonist"
                });

            expect(resSuccess.status).toBe(201);
            expect(resSuccess.body.shortlist.status).toBe("shortlisted");
        });
    });

    describe("D6: Talent Analytics Privacy", () => {
        it("should increment analytics views on full profile unlock without recording viewer identity", async () => {
            const { user: talentUser, token: talentToken } = await createTalentUser({ isPaid: true });
            const profile = await TalentProfile.create({
                userId: talentUser._id,
                vismayaId: "VIS-565656",
                stageName: "Analytics Star",
                primaryProfession: "Actors",
                isSearchable: true,
                profileCompletionPercentage: 80
            });

            const { org, token: orgToken } = await createOrgUser({ isPaid: true });
            await CreditLedger.create({
                organizationId: org._id,
                balance: 100,
                includedCredits: 100,
                purchasedCredits: 0,
                consumedCredits: 0
            });

            // Unlock full profile
            await request(app)
                .post(`/api/talent-profiles/${profile.vismayaId}/unlock`)
                .set("Authorization", getAuthHeader(orgToken));

            // Fetch analytics as talent
            const resAnalytics = await request(app)
                .get("/api/talent-profiles/analytics")
                .set("Authorization", getAuthHeader(talentToken));

            expect(resAnalytics.status).toBe(200);
            expect(resAnalytics.body.analytics.lifetimeViews).toBeGreaterThanOrEqual(1);
            expect(resAnalytics.body.analytics.viewerDetails).toBeUndefined();
        });
    });
});
