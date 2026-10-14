const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const { connectDB, clearDB, disconnectDB } = require("./helpers/db");
const { generateAuthToken } = require("./helpers/auth");

const User = require("../src/models/user.model");
const TalentProfile = require("../src/models/talentProfile.model");
const MediaItem = require("../src/models/mediaItem.model");

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

describe("Phase 7: Media & Moderation (M1 - M4)", () => {
    let adminUser, adminToken;
    let talentUser, talentToken, talentProfile;
    let otherTalentUser, otherTalentToken;

    beforeEach(async () => {
        // Admin
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

        // Primary Talent
        talentUser = await User.create({
            name: "Elena Model",
            email: "elena@model.com",
            password: "Password123!",
            role: "talent",
            status: "active",
            isPaid: true
        });
        const talentAuth = await generateAuthToken(talentUser);
        talentToken = talentAuth.token;

        talentProfile = await TalentProfile.create({
            userId: talentUser._id,
            vismayaId: "VIS-7001",
            firstName: "Elena",
            lastName: "Model",
            primaryProfession: "Model",
            gender: "female",
            profileCompletionPercentage: 75,
            isSearchable: true
        });

        // Other Talent
        otherTalentUser = await User.create({
            name: "Sam Actor",
            email: "sam@actor.com",
            password: "Password123!",
            role: "talent",
            status: "active",
            isPaid: true
        });
        const otherAuth = await generateAuthToken(otherTalentUser);
        otherTalentToken = otherAuth.token;
    });

    describe("M1: Defaults, Validations & Duplicate Hash Protection", () => {
        it("rejects direct audio upload", async () => {
            const res = await request(app)
                .post("/api/media")
                .set("Authorization", `Bearer ${talentToken}`)
                .send({
                    mediaType: "audio",
                    url: "https://vismaya.com/audio/track1.mp3",
                    rightsConfirmed: true
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/audio/i);
        });

        it("rejects upload without rights confirmation", async () => {
            const res = await request(app)
                .post("/api/media")
                .set("Authorization", `Bearer ${talentToken}`)
                .send({
                    mediaType: "photo",
                    url: "https://vismaya.com/photos/headshot1.jpg",
                    rightsConfirmed: false
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/rights confirmation/i);
        });

        it("defaults visibility to industry_only", async () => {
            const res = await request(app)
                .post("/api/media")
                .set("Authorization", `Bearer ${talentToken}`)
                .send({
                    mediaType: "photo",
                    category: "headshot",
                    url: "https://vismaya.com/photos/headshot1.jpg",
                    rightsConfirmed: true
                });

            expect(res.status).toBe(201);
            expect(res.body.mediaItem.visibility).toBe("industry_only");
            expect(res.body.mediaItem.moderationState).toBe("live");
        });

        it("rejects exact duplicate content hash per owner with 409", async () => {
            // First upload
            const res1 = await request(app)
                .post("/api/media")
                .set("Authorization", `Bearer ${talentToken}`)
                .send({
                    mediaType: "photo",
                    url: "https://vismaya.com/photos/portfolio_duplicate.jpg",
                    rightsConfirmed: true
                });

            expect(res1.status).toBe(201);

            // Second upload with same URL (hashes match)
            const res2 = await request(app)
                .post("/api/media")
                .set("Authorization", `Bearer ${talentToken}`)
                .send({
                    mediaType: "photo",
                    url: "https://vismaya.com/photos/portfolio_duplicate.jpg",
                    rightsConfirmed: true
                });

            expect(res2.status).toBe(409);
            expect(res2.body.message).toMatch(/duplicate/i);
        });
    });

    describe("M2: Main Profile Photo Governance & Drag-and-Drop Reordering", () => {
        it("setting main profile photo updates TalentProfile and resets previous main photo", async () => {
            // Photo 1 as main
            const photo1Res = await request(app)
                .post("/api/media")
                .set("Authorization", `Bearer ${talentToken}`)
                .send({
                    mediaType: "photo",
                    url: "https://vismaya.com/photos/main1.jpg",
                    isMainProfilePhoto: true,
                    rightsConfirmed: true
                });
            expect(photo1Res.status).toBe(201);

            let profile = await TalentProfile.findOne({ userId: talentUser._id });
            expect(profile.profilePhoto).toBe("https://vismaya.com/photos/main1.jpg");

            // Photo 2 replacing main
            const photo2Res = await request(app)
                .post("/api/media")
                .set("Authorization", `Bearer ${talentToken}`)
                .send({
                    mediaType: "photo",
                    url: "https://vismaya.com/photos/main2.jpg",
                    isMainProfilePhoto: true,
                    rightsConfirmed: true
                });
            expect(photo2Res.status).toBe(201);

            profile = await TalentProfile.findOne({ userId: talentUser._id });
            expect(profile.profilePhoto).toBe("https://vismaya.com/photos/main2.jpg");

            // Verify old photo is no longer main
            const oldPhoto = await MediaItem.findById(photo1Res.body.mediaItem._id);
            expect(oldPhoto.isMainProfilePhoto).toBe(false);
        });

        it("deleting main photo clears it from TalentProfile", async () => {
            const photoRes = await request(app)
                .post("/api/media")
                .set("Authorization", `Bearer ${talentToken}`)
                .send({
                    mediaType: "photo",
                    url: "https://vismaya.com/photos/temp_main.jpg",
                    isMainProfilePhoto: true,
                    rightsConfirmed: true
                });

            const mediaId = photoRes.body.mediaItem._id;
            const delRes = await request(app)
                .delete(`/api/media/${mediaId}`)
                .set("Authorization", `Bearer ${talentToken}`);

            expect(delRes.status).toBe(200);

            const profile = await TalentProfile.findOne({ userId: talentUser._id });
            expect(profile.profilePhoto).toBeFalsy();
        });

        it("reorders media items via PATCH /api/media/order", async () => {
            const m1 = await MediaItem.create({
                owner: talentUser._id,
                mediaType: "photo",
                url: "https://vismaya.com/p1.jpg",
                displayOrder: 0,
                rightsConfirmed: true
            });
            const m2 = await MediaItem.create({
                owner: talentUser._id,
                mediaType: "photo",
                url: "https://vismaya.com/p2.jpg",
                displayOrder: 1,
                rightsConfirmed: true
            });

            const reorderRes = await request(app)
                .patch("/api/media/order")
                .set("Authorization", `Bearer ${talentToken}`)
                .send({
                    order: [m2._id.toString(), m1._id.toString()]
                });

            expect(reorderRes.status).toBe(200);

            const updatedM1 = await MediaItem.findById(m1._id);
            const updatedM2 = await MediaItem.findById(m2._id);
            expect(updatedM2.displayOrder).toBe(0);
            expect(updatedM1.displayOrder).toBe(1);
        });
    });

    describe("M3: Copyright Dispute Flow", () => {
        it("filing copyright dispute temporarily restricts item from public view", async () => {
            const media = await MediaItem.create({
                owner: talentUser._id,
                mediaType: "photo",
                url: "https://vismaya.com/original_work.jpg",
                visibility: "public",
                moderationState: "live",
                rightsConfirmed: true
            });

            // Another user disputes this item
            const disputeRes = await request(app)
                .post(`/api/media/${media._id}/dispute`)
                .set("Authorization", `Bearer ${otherTalentToken}`)
                .send({
                    reason: "This photo belongs to my agency portfolio without permission."
                });

            expect(disputeRes.status).toBe(200);
            expect(disputeRes.body.mediaItem.moderationState).toBe("restricted");
            expect(disputeRes.body.mediaItem.disputeState).toBe("disputed");

            // Public / other talent user cannot see restricted item
            const viewRes = await request(app)
                .get(`/api/media/user/${talentUser._id}`)
                .set("Authorization", `Bearer ${otherTalentToken}`);

            expect(viewRes.status).toBe(200);
            expect(viewRes.body.mediaItems.some(item => item._id.toString() === media._id.toString())).toBe(false);
        });
    });

    describe("M4: Featured Work Nomination & Admin Selection", () => {
        it("talent nominates and admin approves featured work with max 4 limit", async () => {
            const items = [];
            for (let i = 1; i <= 5; i++) {
                const m = await MediaItem.create({
                    owner: talentUser._id,
                    mediaType: "photo",
                    url: `https://vismaya.com/showcase_${i}.jpg`,
                    rightsConfirmed: true
                });
                items.push(m);
            }

            // Talent nominates item 0
            const nomRes = await request(app)
                .post(`/api/media/${items[0]._id}/nominate-featured`)
                .set("Authorization", `Bearer ${talentToken}`);

            expect(nomRes.status).toBe(200);
            expect(nomRes.body.mediaItem.isNominatedFeatured).toBe(true);

            // Admin features 4 items
            for (let i = 0; i < 4; i++) {
                const featRes = await request(app)
                    .patch(`/api/media/${items[i]._id}/feature`)
                    .set("Authorization", `Bearer ${adminToken}`)
                    .send({ isFeatured: true });
                expect(featRes.status).toBe(200);
                expect(featRes.body.mediaItem.isFeatured).toBe(true);
            }

            // Admin attempts to feature 5th item -> rejected (max 4 per user)
            const fifthRes = await request(app)
                .patch(`/api/media/${items[4]._id}/feature`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ isFeatured: true });

            expect(fifthRes.status).toBe(400);
            expect(fifthRes.body.message).toMatch(/maximum of 4/i);
        });
    });
});
