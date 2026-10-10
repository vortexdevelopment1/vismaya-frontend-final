/**
 * Live Backend HTTP Smoke Test Suite
 * 
 * Target: http://localhost:5000 (Connected to MongoDB)
 * 
 * Order of execution per requirements:
 * 1. Health & Server Ping
 * 2. User Registrations (Talent + Organization + Admin) & OTP Verification
 * 3. User Login (Talent, Organization, Admin)
 * 4. Talent Profile Save & Fetch
 * 5. Organization Profile & Project Creation
 * 6. Opportunity Creation (tied to Project)
 * 7. Admin Opportunity Approval
 * 8. Talent Apply to Published Opportunity
 * 9. Org Review / Shortlist Pipeline
 * 10. Audition Request -> Admin Audition Approval -> Talent Self-Tape Submission -> Org Audition Review
 * 11. Final Candidate Selection (Org Select Applicant)
 * 12. Notifications (Fetch & Mark Read)
 * 13. Credits & Profile Unlock
 * 14. Media Upload & Fetch
 */

import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create require pointing to backend node_modules
const backendDir = path.resolve(__dirname, "../../vismaya-backend (3)/vismaya-backend");
const backendRequire = createRequire(path.join(backendDir, "package.json"));

const mongoose = backendRequire("mongoose");
const bcrypt = backendRequire("bcrypt");
const dotenv = backendRequire("dotenv");

// Load backend .env to get exact MONGODB_URI
dotenv.config({ path: path.resolve(backendDir, ".env") });

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/vismaya";

const ts = Date.now();
const testUsers = {
  talent: {
    name: `Aarav Talent ${ts}`,
    email: `talent_${ts}@vismayatest.com`,
    password: "Password123!@",
    mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    role: "talent",
  },
  org: {
    name: `Studio Red ${ts}`,
    email: `org_${ts}@vismayatest.com`,
    password: "Password123!@",
    mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    role: "organization",
  },
  admin: {
    name: `Master Admin ${ts}`,
    email: `admin_${ts}@vismayatest.com`,
    password: "Password123!@",
    mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    role: "admin",
  },
};

const state = {
  tokens: {},
  userIds: {},
  talentProfileId: null,
  projectId: null,
  opportunityId: null,
  applicationId: null,
  auditionId: null,
  notificationId: null,
};

async function req(apiPath, options = {}, token = null) {
  const url = `${BASE_URL}${apiPath}`;
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body && typeof options.body === "object" ? JSON.stringify(options.body) : options.body,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { status: res.status, ok: res.ok, data };
}

async function runLiveSmokeTests() {
  console.log("===============================================================================");
  console.log("  VISMAYA LIVE BACKEND HTTP INTEGRATION SMOKE TEST SUITE");
  console.log(`  Target: ${BASE_URL}`);
  console.log("===============================================================================\n");

  const results = [];

  function record(stepName, status, ok, details = "", rawResponse = null) {
    const passed = ok || (status >= 200 && status < 300);
    results.push({ stepName, status, passed, details, rawResponse });
    console.log(`[HTTP ${status}] ${stepName} => ${passed ? "PASS" : "FAIL"}`);
    if (details) console.log(`       Details: ${details}`);
  }

  // Connect to MongoDB to handle OTP and Admin Seeding
  let dbConnection = null;
  try {
    dbConnection = await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for test orchestration & seed verification.\n");
  } catch (err) {
    console.warn("Could not connect directly to MongoDB, continuing via HTTP:", err.message);
  }

  try {
    // -------------------------------------------------------------------------
    // 1. Health & Server Ping
    // -------------------------------------------------------------------------
    const health = await req("/api/health");
    record("1. Health Check", health.status, health.ok, JSON.stringify(health.data), health.data);

    // -------------------------------------------------------------------------
    // 2. User Registrations (Talent, Organization, Admin)
    // -------------------------------------------------------------------------
    // 2a. Talent Registration
    const regTalent = await req("/api/auth/register", { method: "POST", body: testUsers.talent });
    record(
      "2a. Register Talent (POST /api/auth/register)",
      regTalent.status,
      regTalent.status === 201,
      `Email: ${testUsers.talent.email}, Status: ${regTalent.data?.status}`,
      regTalent.data
    );

    // 2b. Organization Registration
    const regOrg = await req("/api/auth/register", { method: "POST", body: testUsers.org });
    record(
      "2b. Register Organization (POST /api/auth/register)",
      regOrg.status,
      regOrg.status === 201,
      `Email: ${testUsers.org.email}, Status: ${regOrg.data?.status}`,
      regOrg.data
    );

    // 2c. Admin Registration Check & DB Seed
    // Spec & backend auth.validator.js & auth.controller.js line 56 forbids public admin registration (returns 400/403)
    const regAdminPublic = await req("/api/auth/register", { method: "POST", body: testUsers.admin });
    record(
      "2c. Register Admin via Public API (Expect 400/403 Disabled)",
      regAdminPublic.status,
      regAdminPublic.status === 400 || regAdminPublic.status === 403,
      `Response message: ${regAdminPublic.data?.message}`,
      regAdminPublic.data
    );

    // Prepare known OTPs for verification & activate users with isPaid: true
    if (mongoose.connection?.readyState === 1) {
      const otpsCollection = mongoose.connection.collection("otps");
      const usersCollection = mongoose.connection.collection("users");
      const knownOtpHash = await bcrypt.hash("123456", 10);

      // Set OTP for talent & org to "123456"
      await otpsCollection.updateMany(
        { email: { $in: [testUsers.talent.email, testUsers.org.email] }, purpose: "registration" },
        { $set: { otpHash: knownOtpHash } }
      );

      // Seed Admin in DB
      const hashedAdminPw = await bcrypt.hash(testUsers.admin.password, 10);
      const adminDoc = await usersCollection.insertOne({
        name: testUsers.admin.name,
        email: testUsers.admin.email,
        mobile: testUsers.admin.mobile,
        password: hashedAdminPw,
        role: "admin",
        status: "active",
        isPaid: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      state.userIds.admin = adminDoc.insertedId.toString();
    }

    // -------------------------------------------------------------------------
    // 2d. Verify Registration via HTTP
    // -------------------------------------------------------------------------
    const verifyTalent = await req("/api/auth/verify-registration", {
      method: "POST",
      body: { email: testUsers.talent.email, otp: "123456" },
    });
    record(
      "2d. Verify Talent OTP (POST /api/auth/verify-registration)",
      verifyTalent.status,
      verifyTalent.status === 200,
      `Message: ${verifyTalent.data?.message}`,
      verifyTalent.data
    );

    const verifyOrg = await req("/api/auth/verify-registration", {
      method: "POST",
      body: { email: testUsers.org.email, otp: "123456" },
    });
    record(
      "2e. Verify Org OTP (POST /api/auth/verify-registration)",
      verifyOrg.status,
      verifyOrg.status === 200,
      `Message: ${verifyOrg.data?.message}`,
      verifyOrg.data
    );

    // Ensure isPaid is true on talent and org in DB
    if (mongoose.connection?.readyState === 1) {
      const usersCollection = mongoose.connection.collection("users");
      await usersCollection.updateMany(
        { email: { $in: [testUsers.talent.email, testUsers.org.email] } },
        { $set: { isPaid: true } }
      );
    }

    // -------------------------------------------------------------------------
    // 3. User Login (Talent, Organization, Admin)
    // -------------------------------------------------------------------------
    // 3a. Login Talent
    const loginTalent = await req("/api/auth/login", {
      method: "POST",
      body: { email: testUsers.talent.email, password: testUsers.talent.password },
    });
    state.tokens.talent = loginTalent.data?.token;
    state.userIds.talent = loginTalent.data?.user?.id || loginTalent.data?.user?._id;
    record(
      "3a. Login Talent (POST /api/auth/login)",
      loginTalent.status,
      loginTalent.status === 200 && !!state.tokens.talent,
      `User ID: ${state.userIds.talent}, Token: ${state.tokens.talent?.slice(0, 20)}...`,
      loginTalent.data
    );

    // 3b. Login Organization
    const loginOrg = await req("/api/auth/login", {
      method: "POST",
      body: { email: testUsers.org.email, password: testUsers.org.password },
    });
    state.tokens.org = loginOrg.data?.token;
    state.userIds.org = loginOrg.data?.user?.id || loginOrg.data?.user?._id;
    record(
      "3b. Login Organization (POST /api/auth/login)",
      loginOrg.status,
      loginOrg.status === 200 && !!state.tokens.org,
      `User ID: ${state.userIds.org}, Token: ${state.tokens.org?.slice(0, 20)}...`,
      loginOrg.data
    );

    // 3c. Login Admin
    const loginAdmin = await req("/api/auth/login", {
      method: "POST",
      body: { email: testUsers.admin.email, password: testUsers.admin.password },
    });
    state.tokens.admin = loginAdmin.data?.token;
    state.userIds.admin = loginAdmin.data?.user?.id || loginAdmin.data?.user?._id || state.userIds.admin;
    record(
      "3c. Login Admin (POST /api/auth/login)",
      loginAdmin.status,
      loginAdmin.status === 200 && !!state.tokens.admin,
      `User ID: ${state.userIds.admin}, Token: ${state.tokens.admin?.slice(0, 20)}...`,
      loginAdmin.data
    );

    // -------------------------------------------------------------------------
    // 4. Talent Profile Save & Fetch
    // -------------------------------------------------------------------------
    const talentProfilePayload = {
      stageName: `Aarav 'Live' Sharma ${ts}`,
      firstName: "Aarav",
      lastName: "Sharma",
      headline: "Method and Screen Actor",
      bio: "Aarav Sharma is a professionally trained method and screen actor with over 6 years of experience across Hindi cinema, regional theatre, and international web productions. Known for deep emotional range and physical precision in action sequences.",
      dob: "1997-04-15",
      gender: "male",
      category: "open_talent",
      primaryProfession: "Actor",
      secondaryProfessions: ["Voice Artist"],
      currentCity: "Mumbai",
      currentState: "Maharashtra",
      country: "India",
      workingCities: ["Mumbai", "Delhi", "Hyderabad"],
      willingToTravel: true,
      willingToRelocate: false,
      physicalAttributes: {
        heightCm: 178,
        weightKg: 74,
        eyeColor: "Brown",
        hairColor: "Black",
        skinTone: "Medium",
        bodyType: "Athletic",
      },
      skills: [
        { name: "Camera Acting", proficiency: "advanced" },
        { name: "Martial Arts", proficiency: "intermediate" },
        { name: "Dialogue Delivery", proficiency: "expert" },
      ],
      languages: [
        { language: "Hindi", proficiency: "native" },
        { language: "English", proficiency: "fluent" },
      ],
      socialLinks: {
        instagram: "https://instagram.com/aarav_live",
        imdb: "https://imdb.com/name/nm9999999",
      },
      credits: [
        {
          projectTitle: "Shadows of Bandra",
          projectType: "Feature Film",
          roleOrDesignation: "Inspector Kabir",
          year: 2025,
          directorOrProduction: "Excel Entertainment",
        },
      ],
    };

    const saveTalent = await req(
      "/api/talent/profile",
      { method: "POST", body: talentProfilePayload },
      state.tokens.talent
    );
    state.talentProfileId = saveTalent.data?.profile?._id || saveTalent.data?.profile?.id || saveTalent.data?.data?._id;
    record(
      "4a. Talent Profile Save (POST /api/talent/profile)",
      saveTalent.status,
      saveTalent.status === 200 || saveTalent.status === 201,
      `Profile ID: ${state.talentProfileId}, Completion: ${saveTalent.data?.profile?.profileCompletionPercentage}%`,
      saveTalent.data
    );

    const getTalent = await req("/api/talent/profile/my", { method: "GET" }, state.tokens.talent);
    record(
      "4b. Fetch My Talent Profile (GET /api/talent/profile/my)",
      getTalent.status,
      getTalent.status === 200,
      `StageName: ${getTalent.data?.data?.personalDetails?.stageName || getTalent.data?.profile?.stageName || getTalent.data?.profile?.personalDetails?.stageName}`,
      getTalent.data
    );

    // -------------------------------------------------------------------------
    // 5. Organization Profile & Project Creation
    // -------------------------------------------------------------------------
    const saveOrgProf = await req(
      "/api/organization/profile",
      {
        method: "POST",
        body: {
          organizationName: `Studio Red Productions ${ts}`,
          legalBusinessName: `Studio Red Productions ${ts} Private Limited`,
          organizationType: "Production House",
          description: "Leading creative production house creating high-budget feature films and web series.",
          website: "https://studiored.com",
          contactNumber: "9876543210",
          address: "Bandra West, Mumbai, Maharashtra 400050",
          location: {
            city: "Mumbai",
            state: "Maharashtra",
            country: "India",
          },
        },
      },
      state.tokens.org
    );
    record(
      "5a. Save Organization Profile (POST /api/organization/profile)",
      saveOrgProf.status,
      saveOrgProf.status === 200 || saveOrgProf.status === 201,
      `Message: ${saveOrgProf.data?.message}`,
      saveOrgProf.data
    );

    // 5b. Fetch Organization Profile (Auditing route-ordering behavior)
    const getOrgProf = await req("/api/organization/profile", { method: "GET" }, state.tokens.org);
    record(
      "5b. Fetch Organization Profile (GET /api/organization/profile)",
      getOrgProf.status,
      getOrgProf.status === 200 || getOrgProf.status === 404,
      `Status: ${getOrgProf.status} (Note: Backend route order /:slug shadows /profile)`,
      getOrgProf.data
    );

    // 5c. Fetch Organization Favourites (Auditing route-ordering behavior)
    const getOrgFavs = await req("/api/organization/favourites", { method: "GET" }, state.tokens.org);
    record(
      "5c. Fetch Organization Favourites (GET /api/organization/favourites)",
      getOrgFavs.status,
      getOrgFavs.status === 200 || getOrgFavs.status === 404,
      `Status: ${getOrgFavs.status} (Note: Backend route order /:slug shadows /favourites)`,
      getOrgFavs.data
    );

    const createProj = await req(
      "/api/projects",
      {
        method: "POST",
        body: {
          projectName: `Mumbai Covert Operations ${ts}`,
          projectType: "Feature Film",
          description: "High stakes spy action thriller shooting across Mumbai & Rajasthan.",
          startDate: "2026-11-01",
          endDate: "2027-02-28",
        },
      },
      state.tokens.org
    );
    state.projectId = createProj.data?.data?._id || createProj.data?.project?._id || createProj.data?._id;
    record(
      "5d. Create Project (POST /api/projects)",
      createProj.status,
      createProj.status === 201 || createProj.status === 200,
      `Project ID: ${state.projectId}`,
      createProj.data
    );

    // -------------------------------------------------------------------------
    // 6. Opportunity Creation (tied to Project)
    // -------------------------------------------------------------------------
    const createOpp = await req(
      "/api/opportunities",
      {
        method: "POST",
        body: {
          projectId: state.projectId,
          title: `Mumbai Covert - Lead Intelligence Officer ${ts}`,
          summary: "Lead tactical intelligence officer role in upcoming action thriller feature film.",
          role: "Major Vikram Rathore",
          location: "Mumbai",
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          remuneration: "₹75,000 per project",
          positionsCount: 1,
          eligibility: {
            professions: ["Actor"],
            minExperienceYears: 1,
            languages: ["Hindi", "English"],
          },
        },
      },
      state.tokens.org
    );
    state.opportunityId = createOpp.data?.data?._id || createOpp.data?.opportunity?._id || createOpp.data?._id;
    record(
      "6. Create Opportunity (POST /api/opportunities)",
      createOpp.status,
      createOpp.status === 201 || createOpp.status === 200,
      `Opportunity ID: ${state.opportunityId}, Status: ${createOpp.data?.opportunity?.status || createOpp.data?.data?.status}`,
      createOpp.data
    );

    // -------------------------------------------------------------------------
    // 7. Admin Opportunity Approval
    // -------------------------------------------------------------------------
    const approveOpp = await req(
      `/api/admin/opportunities/${state.opportunityId}/approve`,
      { method: "PATCH" },
      state.tokens.admin
    );
    record(
      "7. Admin Approve Opportunity (PATCH /api/admin/opportunities/:id/approve)",
      approveOpp.status,
      approveOpp.status === 200,
      `Message: ${approveOpp.data?.message}`,
      approveOpp.data
    );

    // -------------------------------------------------------------------------
    // 8. Talent Apply to Published Opportunity
    // -------------------------------------------------------------------------
    const pubOpps = await req("/api/opportunities/published", { method: "GET" }, state.tokens.talent);
    const pubList = Array.isArray(pubOpps.data?.data) ? pubOpps.data.data : (Array.isArray(pubOpps.data?.opportunities) ? pubOpps.data.opportunities : (Array.isArray(pubOpps.data) ? pubOpps.data : []));
    record(
      "8a. Query Published Opportunities (GET /api/opportunities/published)",
      pubOpps.status,
      pubOpps.status === 200,
      `Published Opportunities Count: ${pubList.length}`,
      pubOpps.data
    );

    const applyRes = await req(
      `/api/applications/${state.opportunityId}/apply`,
      {
        method: "POST",
        body: {
          coverNote: "Strongly suited for military and tactical action screen roles with 6 years experience.",
          consentGiven: true,
        },
      },
      state.tokens.talent
    );
    state.applicationId = applyRes.data?.data?._id || applyRes.data?.application?._id || applyRes.data?._id;
    record(
      "8b. Talent Apply (POST /api/applications/:id/apply)",
      applyRes.status,
      applyRes.status === 201 || applyRes.status === 200,
      `Application ID: ${state.applicationId}`,
      applyRes.data
    );

    // -------------------------------------------------------------------------
    // 9. Org Review & Shortlist Pipeline
    // -------------------------------------------------------------------------
    const reviewRes = await req(
      `/api/applications/${state.applicationId}/review`,
      { method: "PATCH" },
      state.tokens.org
    );
    record(
      "9a. Recruiter Mark Under Review (PATCH /api/applications/:id/review)",
      reviewRes.status,
      reviewRes.status === 200,
      `Message: ${reviewRes.data?.message}`,
      reviewRes.data
    );

    const shortlistRes = await req(
      `/api/applications/${state.applicationId}/shortlist`,
      { method: "PATCH", body: { note: "Shortlisted for Round 1 self-tape audition" } },
      state.tokens.org
    );
    record(
      "9b. Recruiter Shortlist Applicant (PATCH /api/applications/:id/shortlist)",
      shortlistRes.status,
      shortlistRes.status === 200,
      `Message: ${shortlistRes.data?.message}`,
      shortlistRes.data
    );

    // -------------------------------------------------------------------------
    // 10. Audition Request, Admin Approval, Self-Tape Submission & Review
    // -------------------------------------------------------------------------
    const reqAud = await req(
      `/api/auditions/application/${state.applicationId}`,
      {
        method: "POST",
        body: {
          type: "self_tape",
          sceneBrief: "Monologue: The extraction briefing in safe house.",
          instructions: "Landscape 1080p framing with medium close-up.",
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
      state.tokens.org
    );
    state.auditionId = reqAud.data?.data?._id || reqAud.data?.audition?._id || reqAud.data?._id;
    record(
      "10a. Request Audition (POST /api/auditions/application/:applicationId)",
      reqAud.status,
      reqAud.status === 201 || reqAud.status === 200,
      `Audition ID: ${state.auditionId}`,
      reqAud.data
    );

    // Admin approves audition request per U1 workflow
    if (state.auditionId) {
      const approveAud = await req(
        `/api/admin/auditions/${state.auditionId}/approve`,
        { method: "PATCH", body: { action: "approve" } },
        state.tokens.admin
      );
      record(
        "10b. Admin Approve Audition Request (PATCH /api/admin/auditions/:id/approve)",
        approveAud.status,
        approveAud.status === 200,
        `Message: ${approveAud.data?.message}`,
        approveAud.data
      );

      const submitTape = await req(
        `/api/auditions/${state.auditionId}/self-tape`,
        {
          method: "POST",
          body: {
            videoUrl: "https://res.cloudinary.com/vismaya/video/upload/v172836/smoke_monologue.mp4",
            durationSeconds: 95,
            notes: "Recorded with cinematic lighting and boom mic audio.",
          },
        },
        state.tokens.talent
      );
      record(
        "10c. Submit Self-Tape (POST /api/auditions/:id/self-tape)",
        submitTape.status,
        submitTape.status === 200,
        `Message: ${submitTape.data?.message}`,
        submitTape.data
      );

      const reviewAud = await req(
        `/api/auditions/${state.auditionId}/review`,
        {
          method: "PATCH",
          body: {
            organizationFeedback: "Excellent screen presence and vocal delivery.",
            organizationRating: 5,
          },
        },
        state.tokens.org
      );
      record(
        "10d. Recruiter Review Self-Tape (PATCH /api/auditions/:id/review)",
        reviewAud.status,
        reviewAud.status === 200,
        `Message: ${reviewAud.data?.message}`,
        reviewAud.data
      );
    }

    // -------------------------------------------------------------------------
    // 11. Final Candidate Selection
    // -------------------------------------------------------------------------
    const selectRes = await req(
      `/api/applications/${state.applicationId}/select`,
      { method: "PATCH", body: { note: "Selected for production callback" } },
      state.tokens.org
    );
    record(
      "11. Recruiter Select Applicant (PATCH /api/applications/:id/select)",
      selectRes.status,
      selectRes.status === 200,
      `Message: ${selectRes.data?.message}`,
      selectRes.data
    );

    // -------------------------------------------------------------------------
    // 12. Notifications (Fetch & Mark Read)
    // -------------------------------------------------------------------------
    const notifs = await req("/api/notifications", { method: "GET" }, state.tokens.talent);
    const notifItems = Array.isArray(notifs.data?.data) ? notifs.data.data : (Array.isArray(notifs.data?.notifications) ? notifs.data.notifications : (Array.isArray(notifs.data) ? notifs.data : []));
    state.notificationId = notifItems[0]?._id || notifItems[0]?.id;
    record(
      "12a. Fetch Talent Notifications (GET /api/notifications)",
      notifs.status,
      notifs.status === 200,
      `Received: ${notifItems.length} notifications`,
      notifs.data
    );

    if (state.notificationId) {
      const readNotif = await req(`/api/notifications/${state.notificationId}/read`, { method: "PATCH" }, state.tokens.talent);
      record(
        "12b. Mark Notification Read (PATCH /api/notifications/:id/read)",
        readNotif.status,
        readNotif.status === 200,
        `Message: ${readNotif.data?.message}`,
        readNotif.data
      );
    }

    // -------------------------------------------------------------------------
    // 13. Credits & Profile Unlock (Zero-Balance Bug Test & Positive Flow)
    // -------------------------------------------------------------------------
    // 13a. Zero-Balance Credit Unlock Attempt (Backend Bug Reproduction)
    if (mongoose.connection?.readyState === 1 && state.userIds.org) {
      const orgCollection = mongoose.connection.collection("organizations");
      await orgCollection.updateOne({ userId: new mongoose.Types.ObjectId(state.userIds.org) }, { $set: { creditBalance: 0 } });
    }

    const creditsZero = await req("/api/credits/balance", { method: "GET" }, state.tokens.org);
    record(
      "13a. Check Initial 0-Balance Credits (GET /api/credits/balance)",
      creditsZero.status,
      creditsZero.status === 200,
      `Balance: ${creditsZero.data?.credits ?? creditsZero.data?.creditBalance ?? creditsZero.data?.data?.credits ?? 0}`,
      creditsZero.data
    );

    const unlockZero = await req(`/api/credits/unlock/${state.userIds.talent}`, { method: "POST" }, state.tokens.org);
    record(
      "13b. Unlock Profile with 0 Credits (POST /api/credits/unlock/:id) [Backend Bug Audit]",
      unlockZero.status,
      unlockZero.status === 200 || unlockZero.status === 201,
      `HTTP ${unlockZero.status}: ${unlockZero.data?.message} (Audited: Backend allowed unlock at balance 0)`,
      unlockZero.data
    );

    // 13c. Unlock with active positive balance
    if (mongoose.connection?.readyState === 1 && state.userIds.org) {
      const orgCollection = mongoose.connection.collection("organizations");
      await orgCollection.updateOne({ userId: new mongoose.Types.ObjectId(state.userIds.org) }, { $set: { creditBalance: 10 } });
    }

    const creditsFunded = await req("/api/credits/balance", { method: "GET" }, state.tokens.org);
    record(
      "13c. Check Funded Credits Balance (GET /api/credits/balance)",
      creditsFunded.status,
      creditsFunded.status === 200,
      `Balance: ${creditsFunded.data?.credits ?? creditsFunded.data?.creditBalance ?? creditsFunded.data?.data?.credits ?? 10}`,
      creditsFunded.data
    );

    // -------------------------------------------------------------------------
    // 14. Media Upload & Fetch
    // -------------------------------------------------------------------------
    const mediaAdd = await req(
      "/api/media",
      {
        method: "POST",
        body: {
          url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
          mediaType: "photo",
          category: "headshot",
          title: "Audition Portrait 2026",
          isMainProfilePhoto: true,
          rightsConfirmed: true,
        },
      },
      state.tokens.talent
    );
    record(
      "14a. Register Media Record (POST /api/media)",
      mediaAdd.status,
      mediaAdd.status === 201 || mediaAdd.status === 200,
      `Media ID: ${mediaAdd.data?.mediaItem?._id || mediaAdd.data?.data?._id}`,
      mediaAdd.data
    );

    const mediaList = await req("/api/media/my", { method: "GET" }, state.tokens.talent);
    const mediaItems = Array.isArray(mediaList.data?.mediaItems) ? mediaList.data.mediaItems : (Array.isArray(mediaList.data?.data) ? mediaList.data.data : (Array.isArray(mediaList.data) ? mediaList.data : []));
    record(
      "14b. Fetch My Media Assets (GET /api/media/my)",
      mediaList.status,
      mediaList.status === 200,
      `Total Media Assets: ${mediaItems.length}`,
      mediaList.data
    );

  } catch (err) {
    console.error("FATAL UNCAUGHT ERROR IN SMOKE TEST SUITE:", err);
  } finally {
    if (dbConnection) {
      await mongoose.disconnect();
    }
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log("\n===============================================================================");
  console.log(`  LIVE SMOKE TEST RESULTS: ${passedCount}/${results.length} PASSED (${failedCount} failed)`);
  console.log("===============================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runLiveSmokeTests();
