import "dotenv/config";
import dns from "node:dns";
import mongoose from "mongoose";
import request from "supertest";
import app from "../src/app.js";

import User from "../src/models/user.model.js";
import TalentProfile from "../src/models/talentProfile.model.js";
import { generateAuthToken } from "../tests/helpers/auth.js";

const logStep = (step, msg) => console.log(`\n\x1b[36m[STEP ${step}]\x1b[0m \x1b[1m${msg}\x1b[0m`);
const logPass = (desc, detail = "") => console.log(`  \x1b[32m✔ PASS:\x1b[0m ${desc} ${detail ? `\x1b[90m(${detail})\x1b[0m` : ""}`);
const logFail = (desc, err = "") => {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${desc} ${err ? `\x1b[90m(${err})\x1b[0m` : ""}`);
    process.exit(1);
};

async function runModerationVerification() {
    console.log("================================================================================");
    console.log(" VERIFYING COMPLETE TALENT APPROVE, SUSPEND, REJECT & REACTIVATE FLOW");
    console.log(" REAL DATABASE & CROSS-PORTAL SYNCHRONIZATION TEST");
    console.log("================================================================================");

    let mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vismaya";
    if (mongoUri && mongoUri.startsWith("mongodb+srv://")) {
        try {
            dns.setServers(["8.8.8.8", "1.1.1.1"]);
        } catch (e) {}
    }

    try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
        console.log(`Connected to MongoDB Atlas: ${mongoose.connection.name} (${mongoose.connection.host})`);
    } catch (err) {
        console.warn(`Connection to ${mongoUri} failed (${err.message}). Using in-memory test instance...`);
        const { MongoMemoryServer } = require("mongodb-memory-server");
        const mongod = await MongoMemoryServer.create();
        mongoUri = mongod.getUri();
        await mongoose.connect(mongoUri);
    }

    const timestamp = Date.now();
    await User.deleteMany({ email: { $regex: /_mod_/ } });
    await TalentProfile.deleteMany({ stageName: { $regex: /Star_/ } });

    const uniqueStageName = `Star_${timestamp}`;
    const adminUser = await User.create({
        email: `admin_mod_${timestamp}@vismaya.io`,
        password: "Password123!",
        name: "Super Admin",
        role: "admin",
        status: "active",
        isPaid: true
    });
    const { token: adminToken } = await generateAuthToken(adminUser);

    const recruiterUser = await User.create({
        email: `recruiter_mod_${timestamp}@vismaya.io`,
        password: "Password123!",
        name: "Casting Director",
        role: "organization",
        status: "active",
        isPaid: true
    });
    const { token: recruiterToken } = await generateAuthToken(recruiterUser);

    const talentUser = await User.create({
        email: `talent_mod_${timestamp}@vismaya.io`,
        password: "Password123!",
        name: "Arjun Verma",
        mobile: "+91 99887 76655",
        role: "talent",
        status: "active",
        isPaid: true
    });
    const { token: talentToken } = await generateAuthToken(talentUser);

    const talentProfile = await TalentProfile.create({
        userId: talentUser._id,
        vismayaId: `VIS-${timestamp.toString().slice(-6)}`,
        stageName: uniqueStageName,
        firstName: "Arjun",
        lastName: "Verma",
        category: "open_talent",
        primaryProfession: "Lead Actor",
        profileCompletionPercentage: 85,
        status: "pending",
        isProfileApproved: false,
        isVerified: false,
        isSearchable: false
    });

    logStep(1, "Verify Initial State in DB, Admin Queue, Talent View & Recruiter Discovery");
    {
        // Admin Pending Queue
        const pendingRes = await request(app)
            .get("/api/admin/talents/pending")
            .set("Authorization", `Bearer ${adminToken}`);
        const pendingProfiles = pendingRes.body.profiles || pendingRes.body.data || pendingRes.body.talents || [];
        if (pendingRes.status === 200 && pendingProfiles.some(t => t.vismayaId === talentProfile.vismayaId || t._id === talentProfile._id.toString())) {
            logPass("Admin Pending Queue lists the new talent profile");
        } else {
            logFail("Admin Pending Queue failed to list the new talent profile", JSON.stringify(pendingRes.body));
        }

        // Talent's Own Portal View (GET /api/talent-profiles/me)
        const meRes = await request(app)
            .get("/api/talent-profiles/me")
            .set("Authorization", `Bearer ${talentToken}`);
        if (meRes.status === 200 && meRes.body.profile.status === "pending" && meRes.body.profile.isProfileApproved === false) {
            logPass("Talent Portal View shows status='pending' and isProfileApproved=false", meRes.body.profile.statusNote);
        } else {
            logFail("Talent Portal View did not reflect initial pending state", JSON.stringify(meRes.body));
        }

        // Recruiter Search (GET /api/talent-profiles/search) - Should NOT find pending talent
        const searchRes = await request(app)
            .get(`/api/talent-profiles/search?q=${uniqueStageName}`)
            .set("Authorization", `Bearer ${recruiterToken}`);
        const foundInSearch = (searchRes.body.cards || []).some(p => p.stageName === uniqueStageName);
        if (searchRes.status === 200 && !foundInSearch) {
            logPass("Recruiter Discovery correctly excludes unapproved pending talent");
        } else {
            logFail("Recruiter Discovery leaked unapproved talent into search results");
        }
    }

    logStep(2, "Test APPROVE Talent Profile via Admin API and Verify Cross-Portal Reflection");
    {
        const approveRes = await request(app)
            .patch(`/api/admin/talents/${talentProfile.vismayaId}/approve`)
            .set("Authorization", `Bearer ${adminToken}`);
        
        if (approveRes.status === 200 && approveRes.body.profile.status === "approved" && approveRes.body.profile.isProfileApproved === true) {
            logPass("Admin API successfully approved profile by vismayaId", approveRes.body.profile.vismayaId);
        } else {
            logFail("Admin approve API returned error", JSON.stringify(approveRes.body));
        }

        // Verify MongoDB directly
        const dbProfile = await TalentProfile.findById(talentProfile._id);
        const dbUser = await User.findById(talentUser._id);
        if (dbProfile.status === "approved" && dbProfile.isProfileApproved === true && dbProfile.isVerified === true && dbUser.status === "active") {
            logPass("MongoDB reflects profile.status='approved', isProfileApproved=true, user.status='active'");
        } else {
            logFail("MongoDB document was not correctly updated on approval", `profile=${dbProfile?.status}, user=${dbUser?.status}`);
        }

        // Verify Talent Portal View
        const meRes = await request(app)
            .get("/api/talent-profiles/me")
            .set("Authorization", `Bearer ${talentToken}`);
        if (meRes.status === 200 && meRes.body.profile.status === "approved" && meRes.body.profile.isProfileApproved === true) {
            logPass("Talent Portal View reflects approved status with verified note", meRes.body.profile.statusNote);
        } else {
            logFail("Talent Portal View failed to reflect approved status", JSON.stringify(meRes.body));
        }

        // Verify Recruiter Discovery
        const searchRes = await request(app)
            .get(`/api/talent-profiles/search?q=${uniqueStageName}`)
            .set("Authorization", `Bearer ${recruiterToken}`);
        const searchList = searchRes.body.cards || searchRes.body.profiles || searchRes.body.talents || [];
        const found = searchList.some(p => p.stageName === uniqueStageName);
        if (searchRes.status === 200 && found) {
            logPass("Recruiter Discovery successfully surfaces approved talent in search results (cards count: " + searchList.length + ")");
        } else {
            logFail("Recruiter Discovery failed to find approved searchable talent");
        }
    }

    logStep(3, "Test SUSPEND Talent Profile with Reason and Verify Cross-Portal Reflection");
    {
        const suspendReason = "Incomplete KYC verification details provided.";
        const suspendRes = await request(app)
            .patch(`/api/admin/talents/${talentProfile._id}/suspend`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ reason: suspendReason });
        
        if (suspendRes.status === 200 && suspendRes.body.profile.status === "suspended" && suspendRes.body.profile.isProfileApproved === false) {
            logPass("Admin API successfully suspended profile by _id", suspendRes.body.profile.statusReason);
        } else {
            logFail("Admin suspend API returned error", JSON.stringify(suspendRes.body));
        }

        // Verify MongoDB directly
        const dbProfile = await TalentProfile.findById(talentProfile._id);
        const dbUser = await User.findById(talentUser._id);
        if (dbProfile.status === "suspended" && dbProfile.isProfileApproved === false && dbProfile.isSearchable === false && dbUser.status === "suspended") {
            logPass("MongoDB reflects profile.status='suspended', isSearchable=false, user.status='suspended'");
        } else {
            logFail("MongoDB document did not reflect suspension", `profile=${dbProfile?.status}, user=${dbUser?.status}`);
        }

        // Verify Talent Portal View (suspended user is either denied with 403 or shown suspension note)
        const meRes = await request(app)
            .get("/api/talent-profiles/me")
            .set("Authorization", `Bearer ${talentToken}`);
        if (meRes.status === 403 && (meRes.body.message?.includes("suspended") || meRes.body.message?.includes("Session"))) {
            logPass("Talent Portal correctly blocks suspended user with 403", meRes.body.message);
        } else if (meRes.status === 200 && meRes.body.profile?.status === "suspended") {
            logPass("Talent Portal View reflects status='suspended'", meRes.body.profile.statusNote);
        } else {
            logFail("Talent Portal View failed to show suspension restriction", JSON.stringify(meRes.body));
        }

        // Verify Recruiter Discovery - Must be excluded!
        const searchRes = await request(app)
            .get(`/api/talent-profiles/search?q=${uniqueStageName}`)
            .set("Authorization", `Bearer ${recruiterToken}`);
        const found = (searchRes.body.cards || searchRes.body.profiles || searchRes.body.talents || []).some(p => p.stageName === uniqueStageName);
        if (searchRes.status === 200 && !found) {
            logPass("Recruiter Discovery immediately EXCLUDES suspended talent from search results");
        } else {
            logFail("Recruiter Discovery still exposed suspended talent in search results!");
        }
    }

    logStep(4, "Test REACTIVATE Talent Profile and Verify Cross-Portal Restoration");
    {
        const reactivateRes = await request(app)
            .patch(`/api/admin/talents/${talentProfile.vismayaId}/reactivate`)
            .set("Authorization", `Bearer ${adminToken}`);
        
        if (reactivateRes.status === 200 && reactivateRes.body.profile.status === "approved" && reactivateRes.body.profile.isProfileApproved === true) {
            logPass("Admin API successfully reactivated profile", reactivateRes.body.profile.status);
        } else {
            logFail("Admin reactivate API returned error", JSON.stringify(reactivateRes.body));
        }

        // Direct DB
        const dbProfile = await TalentProfile.findById(talentProfile._id);
        const dbUser = await User.findById(talentUser._id);
        if (dbProfile.status === "approved" && dbUser.status === "active") {
            logPass("MongoDB reflects reactivation: profile='approved', user='active'");
        } else {
            logFail("MongoDB did not restore active status on reactivation");
        }
    }

    logStep(5, "Test REJECT Talent Profile with Reason and Verify Cross-Portal Reflection");
    {
        // Re-authenticate talent after reactivation (since suspension revoked previous session)
        const { token: freshTalentToken } = await generateAuthToken(talentUser);

        const rejectReason = "Headshot quality does not meet resolution guidelines.";
        const rejectRes = await request(app)
            .patch(`/api/admin/talents/${talentProfile.vismayaId}/reject`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ reason: rejectReason });
        
        if (rejectRes.status === 200 && rejectRes.body.profile.status === "rejected" && rejectRes.body.profile.isProfileApproved === false) {
            logPass("Admin API successfully rejected profile with reason", rejectRes.body.profile.statusReason);
        } else {
            logFail("Admin reject API returned error", JSON.stringify(rejectRes.body));
        }

        // Direct DB
        const dbProfile = await TalentProfile.findById(talentProfile._id);
        if (dbProfile.status === "rejected" && dbProfile.isProfileApproved === false && dbProfile.rejectionReason === rejectReason) {
            logPass("MongoDB stores rejectionReason and status='rejected'");
        } else {
            logFail("MongoDB did not persist rejection reason accurately");
        }

        // Talent Portal View
        const meRes = await request(app)
            .get("/api/talent-profiles/me")
            .set("Authorization", `Bearer ${freshTalentToken}`);
        if (meRes.status === 200 && meRes.body.profile.status === "rejected" && meRes.body.profile.statusNote.includes(rejectReason)) {
            logPass("Talent Portal View shows rejection notice with rejection reason", meRes.body.profile.statusNote);
        } else {
            console.log("meRes debug:", { status: meRes.status, body: meRes.body });
            logFail("Talent Portal View did not reflect rejection reason");
        }

        // Recruiter Discovery - Must NOT find rejected talent
        const searchRes = await request(app)
            .get(`/api/talent-profiles/search?q=${uniqueStageName}`)
            .set("Authorization", `Bearer ${recruiterToken}`);
        const found = (searchRes.body.cards || searchRes.body.profiles || searchRes.body.talents || []).some(p => p.stageName === uniqueStageName);
        if (searchRes.status === 200 && !found) {
            logPass("Recruiter Discovery excludes rejected talent from search results");
        } else {
            logFail("Recruiter Discovery still exposed rejected talent");
        }
    }

    logStep(6, "Test Legacy Profile Missing vismayaId Auto-Generation");
    {
        const legacyUser = await User.create({
            email: `legacy_talent_${timestamp}@vismaya.io`,
            password: "Password123!",
            name: "Legacy Talent",
            role: "talent",
            status: "pending",
            isPaid: true
        });

        // Insert directly into MongoDB bypassing mongoose schema requirement to simulate legacy doc
        const legacyDoc = await TalentProfile.collection.insertOne({
            userId: legacyUser._id,
            stageName: "Legacy Star",
            status: "pending",
            isProfileApproved: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const legacyId = legacyDoc.insertedId;
        const approveLegacyRes = await request(app)
            .patch(`/api/admin/talents/${legacyId}/approve`)
            .set("Authorization", `Bearer ${adminToken}`);
        
        if (approveLegacyRes.status === 200 && approveLegacyRes.body.profile.vismayaId?.startsWith("VIS-")) {
            logPass("Legacy profile without vismayaId approved cleanly with auto-generated ID", approveLegacyRes.body.profile.vismayaId);
        } else {
            logFail("Legacy profile approval failed with schema error", JSON.stringify(approveLegacyRes.body));
        }
    }

    logStep(7, "Test Unprofiled User Moderation Fallback");
    {
        const unprofiledUser = await User.create({
            email: `unprofiled_${timestamp}@vismaya.io`,
            password: "Password123!",
            name: "Unprofiled Talent",
            role: "talent",
            status: "active",
            isPaid: true
        });

        const suspendUnprofiledRes = await request(app)
            .patch(`/api/admin/talents/${unprofiledUser._id}/suspend`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ reason: "Unprofiled account suspension test" });
        
        if (suspendUnprofiledRes.status === 200 && suspendUnprofiledRes.body.profile.status === "suspended") {
            logPass("Unprofiled talent user suspended with auto-created TalentProfile", suspendUnprofiledRes.body.profile.vismayaId);
        } else {
            logFail("Unprofiled talent user suspension failed", JSON.stringify(suspendUnprofiledRes.body));
        }
    }

    console.log("\n\x1b[32m================================================================================");
    console.log(" ALL MODERATION FLOWS (APPROVE, SUSPEND, REJECT, REACTIVATE) VERIFIED 100% PASS!");
    console.log(" CROSS-PORTAL DB REFLECTION CONFIRMED ACROSS ADMIN, TALENT & RECRUITER PORTALS!");
    console.log("================================================================================\x1b[0m\n");

    // Clean up
    await User.deleteMany({ email: { $regex: timestamp.toString() } });
    await TalentProfile.deleteMany({ userId: { $in: [talentUser._id] } });
    await mongoose.disconnect();
}

runModerationVerification().catch(err => {
    console.error("Fatal test execution error:", err);
    process.exit(1);
});
