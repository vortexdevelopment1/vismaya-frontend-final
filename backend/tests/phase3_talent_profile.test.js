const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const { connectDB, clearDB, disconnectDB } = require("./helpers/db");
const { createTalentUser, createOrgUser, createAdminUser } = require("./helpers/factory");
const { getAuthHeader } = require("./helpers/auth");
const TalentProfile = require("../src/models/talentProfile.model");
const Verification = require("../src/models/verification.model");
const MediaItem = require("../src/models/mediaItem.model");
const { calculateProfileCompletion, calculateProfileCompletionDetails } = require("../src/utils/profileCompletion.util");
const { toCard, toLimitedPreview, toFullProfile, checkDenyList, FORBIDDEN_ORGANIZATION_FULL_KEYS } = require("../src/utils/serializers/talent");
const { calculateTrendingTalent } = require("../src/jobs/trending.job");

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

describe("Phase 3: Talent Profile Engine (T1 - T9)", () => {

    describe("T1 & T2: Schema Fields, Career Stages & Taxonomy", () => {
        it("should accept updated careerStage and language proficiency values", async () => {
            const { user, token } = await createTalentUser({ isPaid: true });

            const res = await request(app)
                .post("/api/talent-profiles")
                .set("Authorization", getAuthHeader(token))
                .send({
                    stageName: "Aria Stark",
                    careerStage: "emerging",
                    languages: [{ language: "English", proficiency: "professional" }],
                    availability: { status: "available_now" },
                    remoteMode: "hybrid",
                    experienceRange: "3-5"
                });

            expect(res.status).toBe(200);
            expect(res.body.profile.careerStage).toBe("emerging");
            expect(res.body.profile.languages[0].proficiency).toBe("professional");
            expect(res.body.profile.availability.status).toBe("available_now");
        });

        it("should expose profession form configuration and favourite tags via taxonomy endpoints", async () => {
            const resForm = await request(app).get("/api/taxonomy/Actors/form");
            expect(resForm.status).toBe(200);
            expect(resForm.body.success).toBe(true);
            expect(resForm.body.formConfig.portfolioRequirements.minPhotos).toBeDefined();

            const resTags = await request(app).get("/api/taxonomy/favourite-tags");
            expect(resTags.status).toBe(200);
            expect(resTags.body.tags).toBeInstanceOf(Array);
            expect(resTags.body.tags.length).toBeGreaterThan(0);
        });
    });

    describe("T3: Validations & Under-18 Minor Protection", () => {
        it("should reject bio shorter than 200 characters when provided", async () => {
            const { user, token } = await createTalentUser({ isPaid: true });

            const res = await request(app)
                .post("/api/talent-profiles")
                .set("Authorization", getAuthHeader(token))
                .send({
                    stageName: "Short Bio Star",
                    bio: "Too short bio for profile."
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/200 characters/i);
        });

        it("should enforce secondary profession/department maximum limits", async () => {
            const { user, token } = await createTalentUser({ isPaid: true });

            // Open talent max 3 secondary
            const resOpen = await request(app)
                .post("/api/talent-profiles")
                .set("Authorization", getAuthHeader(token))
                .send({
                    category: "open_talent",
                    primaryProfession: "Actors",
                    secondaryProfessions: ["Models", "Singers & Rappers", "Dancers", "Choreographers"]
                });

            expect(resOpen.status).toBe(400);
            expect(resOpen.body.message).toMatch(/maximum of 3 secondary/i);
        });

        it("should require guardian consent for under-18 users and hide guardian data from public serializer", async () => {
            const { user, token } = await createTalentUser({ isPaid: true });
            const minorDob = new Date(Date.now() - 15 * 365.25 * 24 * 60 * 60 * 1000); // 15 years old

            // Missing guardian details -> 400
            const resFail = await request(app)
                .post("/api/talent-profiles")
                .set("Authorization", getAuthHeader(token))
                .send({
                    stageName: "Young Star",
                    dob: minorDob
                });

            expect(resFail.status).toBe(400);

            // Valid guardian details -> 200
            const resSuccess = await request(app)
                .post("/api/talent-profiles")
                .set("Authorization", getAuthHeader(token))
                .send({
                    stageName: "Young Star",
                    dob: minorDob,
                    guardianDetails: {
                        guardianName: "Jane Doe Sr.",
                        relationship: "Mother",
                        contactNumber: "+919876543210",
                        consentGiven: true
                    }
                });

            expect(resSuccess.status).toBe(200);
            expect(resSuccess.body.profile.isUnder18).toBe(true);

            // Fetch by organization -> guardian details MUST NOT be present
            const { org, token: orgToken } = await createOrgUser({ isPaid: true });
            const resView = await request(app)
                .get(`/api/talent-profiles/${resSuccess.body.profile.vismayaId}`)
                .set("Authorization", getAuthHeader(orgToken));

            expect(resView.status).toBe(200);
            expect(resView.body.profile.guardianDetails).toBeUndefined();
            expect(resView.body.profile.remunerationExpectation).toBeUndefined();
        });
    });

    describe("T4 & T5: Profile Strength & Profession-Aware Completion Calculator", () => {
        it("should accurately calculate completion and list missing sections", () => {
            const emptyProfile = {};
            const resEmpty = calculateProfileCompletionDetails(emptyProfile);
            expect(resEmpty.percentage).toBe(0);
            expect(resEmpty.missingSections.length).toBeGreaterThan(0);

            const completeProfile = {
                firstName: "John",
                lastName: "Doe",
                profilePhoto: "https://vismaya.com/photo.jpg",
                bio: "This is a rich comprehensive professional biography describing years of dedicated acting experience across theatre, commercial cinema, television drama, and voice work in major regional productions with top casting directors.".padEnd(210, "."),
                dob: new Date("1995-05-15"),
                gender: "male",
                currentCity: "Mumbai",
                category: "open_talent",
                primaryProfession: "Actors",
                careerStage: "emerging",
                skills: [{ name: "Method Acting", proficiency: "advanced" }],
                languages: [{ language: "Hindi", proficiency: "native" }],
                credits: [
                    { projectTitle: "Film Alpha", projectStatus: "released" },
                    { projectTitle: "Web Series Beta", projectStatus: "completed" }
                ],
                portfolio: { photos: ["p1.jpg", "p2.jpg"], showreelUrl: "https://youtube.com/reel" },
                workingCities: ["Mumbai", "Hyderabad"],
                training: [{ institution: "FTII", courseName: "Dramatic Arts" }]
            };

            const resComplete = calculateProfileCompletionDetails(completeProfile);
            expect(resComplete.percentage).toBe(100);
            expect(resComplete.missingSections.length).toBe(0);
        });
    });

    describe("T6: Profile Edit Workflow (Critical Fields vs Minor Edits)", () => {
        it("should block direct category switching with 403", async () => {
            const { user, token } = await createTalentUser({ isPaid: true });

            await request(app)
                .post("/api/talent-profiles")
                .set("Authorization", getAuthHeader(token))
                .send({
                    stageName: "Original Actor",
                    category: "open_talent",
                    primaryProfession: "Actors"
                });

            const resSwitch = await request(app)
                .post("/api/talent-profiles")
                .set("Authorization", getAuthHeader(token))
                .send({
                    category: "film_and_tv",
                    primaryDepartment: "Direction & Writing"
                });

            expect(resSwitch.status).toBe(403);
            expect(resSwitch.body.message).toMatch(/switching of talent category is restricted/i);
        });

        it("should route critical edits (name, DOB, primaryProfession) to pendingChanges for admin review", async () => {
            const { user, token } = await createTalentUser({ isPaid: true });

            // Create initial profile
            await request(app)
                .post("/api/talent-profiles")
                .set("Authorization", getAuthHeader(token))
                .send({
                    firstName: "Robert",
                    lastName: "Downey",
                    primaryProfession: "Actors",
                    category: "open_talent",
                    currentCity: "Mumbai"
                });

            // Update critical field (primaryProfession) + minor field (currentCity)
            const resUpdate = await request(app)
                .post("/api/talent-profiles")
                .set("Authorization", getAuthHeader(token))
                .send({
                    primaryProfession: "Singers & Rappers",
                    currentCity: "Bengaluru"
                });

            expect(resUpdate.status).toBe(200);
            // Live profile retains old primaryProfession while updating city
            expect(resUpdate.body.profile.primaryProfession).toBe("Actors");
            expect(resUpdate.body.profile.currentCity).toBe("Bengaluru");
            expect(resUpdate.body.pendingChanges.primaryProfession).toBe("Singers & Rappers");

            // Admin reviews and approves the change
            const { admin, token: adminToken } = await createAdminUser();
            const resPendingList = await request(app)
                .get("/api/admin/profile-changes")
                .set("Authorization", getAuthHeader(adminToken));

            expect(resPendingList.status).toBe(200);
            expect(resPendingList.body.count).toBeGreaterThan(0);

            const profileId = resUpdate.body.profile._id;
            const resApprove = await request(app)
                .patch(`/api/admin/profile-changes/${profileId}/review`)
                .set("Authorization", getAuthHeader(adminToken))
                .send({ action: "approve" });

            expect(resApprove.status).toBe(200);
            expect(resApprove.body.profile.primaryProfession).toBe("Singers & Rappers");
            expect(resApprove.body.profile.pendingChanges).toBeNull();
        });
    });

    describe("T7: Vismaya ID Generation & Uniqueness", () => {
        it("should assign a unique VIS- format ID to every talent profile", async () => {
            const { user: user1, token: token1 } = await createTalentUser({ isPaid: true });
            const { user: user2, token: token2 } = await createTalentUser({ isPaid: true });

            const res1 = await request(app)
                .post("/api/talent-profiles")
                .set("Authorization", getAuthHeader(token1))
                .send({ stageName: "Star One", primaryProfession: "Actors" });

            const res2 = await request(app)
                .post("/api/talent-profiles")
                .set("Authorization", getAuthHeader(token2))
                .send({ stageName: "Star Two", primaryProfession: "Models" });

            expect(res1.body.profile.vismayaId).toMatch(/^VIS-\d{6}$/);
            expect(res2.body.profile.vismayaId).toMatch(/^VIS-\d{6}$/);
            expect(res1.body.profile.vismayaId).not.toBe(res2.body.profile.vismayaId);
        });
    });

    describe("T8: Trending Talent Job & Admin Override", () => {
        it("should compute trending score and allow admin exclusion", async () => {
            const { user, token } = await createTalentUser({ isPaid: true });

            const profile = await TalentProfile.create({
                userId: user._id,
                vismayaId: "VIS-998877",
                stageName: "Trending Candidate",
                category: "open_talent",
                primaryProfession: "Actors",
                isSearchable: true,
                profileCompletionPercentage: 80
            });

            await calculateTrendingTalent();

            const refreshed = await TalentProfile.findById(profile._id);
            expect(refreshed.isTrending).toBe(true);

            // Admin excludes from trending
            const { admin, token: adminToken } = await createAdminUser();
            const resExclude = await request(app)
                .patch(`/api/admin/talents/${profile._id}/trending`)
                .set("Authorization", getAuthHeader(adminToken))
                .send({ remove: true });

            expect(resExclude.status).toBe(200);
            expect(resExclude.body.profile.trendingExcluded).toBe(true);
            expect(resExclude.body.profile.isTrending).toBe(false);
        });
    });

    describe("T9: Verification Rules & Badges", () => {
        it("should reject professional verification if aspiring talent has zero credits", async () => {
            const { user, token } = await createTalentUser({ isPaid: true });

            await TalentProfile.create({
                userId: user._id,
                vismayaId: "VIS-554433",
                stageName: "Zero Credit Star",
                careerStage: "aspiring",
                credits: []
            });

            const verification = await Verification.create({
                userId: user._id,
                verificationType: "professional",
                status: "pending"
            });

            const { admin, token: adminToken } = await createAdminUser();
            const resApprove = await request(app)
                .patch(`/api/admin/verifications/${verification._id}/review`)
                .set("Authorization", getAuthHeader(adminToken))
                .send({ action: "approve" });

            expect(resApprove.status).toBe(400);
            expect(resApprove.body.message).toMatch(/Aspiring talent with zero credits cannot be granted professional verification/i);
        });

        it("should approve professional verification when criteria are satisfied and set profile badge", async () => {
            const { user, token } = await createTalentUser({ isPaid: true });

            await TalentProfile.create({
                userId: user._id,
                vismayaId: "VIS-667788",
                stageName: "Veteran Star",
                careerStage: "experienced",
                credits: [{ projectTitle: "Blockbuster", projectStatus: "released" }]
            });

            await MediaItem.create({
                owner: user._id,
                moderationState: "live",
                mediaType: "photo",
                url: "https://vismaya.com/media1.jpg"
            });

            const verification = await Verification.create({
                userId: user._id,
                verificationType: "professional",
                status: "pending"
            });

            const { admin, token: adminToken } = await createAdminUser();
            const resApprove = await request(app)
                .patch(`/api/admin/verifications/${verification._id}/review`)
                .set("Authorization", getAuthHeader(adminToken))
                .send({ action: "approve" });

            expect(resApprove.status).toBe(200);
            expect(resApprove.body.verification.status).toBe("verified");

            const profile = await TalentProfile.findOne({ userId: user._id });
            expect(profile.isVerified).toBe(true);
            expect(profile.badgeType).toBe("verified");
        });
    });

    describe("Privacy & Deny-List Serialization Protection", () => {
        it("should verify that deny-list keys never leak in public or organization serializers", () => {
            const mockProfile = {
                vismayaId: "VIS-123456",
                firstName: "John",
                lastName: "Doe",
                stageName: "JD",
                email: "john@secret.com",
                mobile: "+919876543210",
                remunerationExpectation: { ratePerDay: 50000 },
                physicalAttributes: { heightCm: 180 },
                guardianDetails: { guardianName: "Parent" }
            };

            const card = toCard(mockProfile, "guest");
            expect(checkDenyList(card)).toBe(true);
            expect(card.email).toBeUndefined();
            expect(card.mobile).toBeUndefined();
            expect(card.displayName).toBe("JD");

            const preview = toLimitedPreview(mockProfile, "guest");
            expect(checkDenyList(preview)).toBe(true);
            expect(preview.remunerationExpectation).toBeUndefined();

            const fullOrg = toFullProfile(mockProfile, { role: "organization" }, { isUnlocked: true });
            expect(checkDenyList(fullOrg)).toBe(true);
            expect(fullOrg.email).toBeUndefined();
            expect(fullOrg.mobile).toBeUndefined();
            expect(fullOrg.guardianDetails).toBeUndefined();
        });
    });
});
