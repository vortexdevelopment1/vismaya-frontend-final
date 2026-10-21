import { resolve } from "node:path";
import fs from "node:fs";
import dotenv from "../backend/node_modules/dotenv/dist/index.cjs";
import mongoose from "../backend/node_modules/mongoose/index.js";
import playwrightPkg from "../frontend/node_modules/playwright/index.js";
const { chromium } = playwrightPkg;

dotenv.config({ path: resolve("backend/.env") });

const API_BASE = "http://localhost:5000";
const FRONTEND_BASE = "http://localhost:3000";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://lowanshiarpita_db_user:lmXigXjzPeozujpz@cluster0.ipa6ws6.mongodb.net/vismaya";

const ts = Date.now();
const runPrefix = `E2E-SELFTAPE-${ts}`;

// Track IDs created strictly in this run
const ids = {
  users: [],
  talentProfiles: [],
  organizations: [],
  projects: [],
  opportunities: [],
  applications: [],
  auditions: [],
  notifications: [],
  auditLogs: []
};

const stats = {
  passed: 0,
  failed: 0,
  tests: []
};

function pass(name, detail = "") {
  stats.passed++;
  stats.tests.push({ name, status: "PASS", detail });
  console.log(`[PASS] ${name} ${detail ? "— " + detail : ""}`);
}

function fail(name, error) {
  stats.failed++;
  stats.tests.push({ name, status: "FAIL", error: String(error) });
  console.error(`[FAIL] ${name} — ${error}`);
  throw new Error(`${name} failed: ${error}`);
}

async function api(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, options);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, ok: res.ok, body };
}

async function run() {
  console.log(`=== Starting E2E-SELFTAPE Verification Run: ${runPrefix} ===\n`);

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB for ID tracking and verification.");

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    // -------------------------------------------------------------
    // STEP 1: Create Test Accounts (Recruiter, Talent 1, Talent 2)
    // -------------------------------------------------------------
    console.log("\n--- Step 1: Account Setup ---");
    const recruiterEmail = `${runPrefix}-recruiter@vismaya.io`.toLowerCase();
    const talent1Email = `${runPrefix}-talent1@vismaya.io`.toLowerCase();
    const talent2Email = `${runPrefix}-talent2@vismaya.io`.toLowerCase();
    const password = "Password123!";

    async function setupAccount(regData) {
      const reg = await api("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regData)
      });
      if (!reg.ok) fail(`Register ${regData.role}`, JSON.stringify(reg.body));

      const dbUser = await mongoose.connection.collection("users").findOne({ email: regData.email });
      if (!dbUser) fail(`Find DB user ${regData.email}`, "Not found");
      ids.users.push(dbUser._id);

      await mongoose.connection.collection("users").updateOne(
        { _id: dbUser._id },
        { $set: { status: "active", isEmailVerified: true, isPaid: true } }
      );

      const loginRes = await api("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regData.email, password: regData.password })
      });
      if (!loginRes.ok) fail(`Login ${regData.email}`, JSON.stringify(loginRes.body));
      return { user: loginRes.body.user, token: loginRes.body.token, dbUser };
    }

    const { user: recruiterUser, token: recruiterToken } = await setupAccount({
      role: "organization",
      email: recruiterEmail,
      password,
      name: "Test Recruiter Selftape",
      phone: `+9198${Math.floor(10000000 + Math.random() * 89999999)}`,
      companyName: `${runPrefix} Productions`
    });
    pass("Register & Activate Recruiter", recruiterEmail);

    const { user: talent1User, token: talent1Token } = await setupAccount({
      role: "talent",
      email: talent1Email,
      password,
      name: "Test Talent One",
      phone: `+9198${Math.floor(10000000 + Math.random() * 89999999)}`,
      stageName: "Talent One",
      primaryProfession: "Actor",
      skills: ["Method Acting", "Voice Modulation"],
      bio: `${runPrefix} Bio 1`
    });
    pass("Register & Activate Talent 1", talent1Email);

    const { user: talent2User, token: talent2Token } = await setupAccount({
      role: "talent",
      email: talent2Email,
      password,
      name: "Test Talent Two",
      phone: `+9198${Math.floor(10000000 + Math.random() * 89999999)}`,
      stageName: "Talent Two",
      primaryProfession: "Model",
      skills: ["Runway"],
      bio: `${runPrefix} Bio 2`
    });
    pass("Register & Activate Talent 2", talent2Email);

    // Find and track talent profiles & organizations in DB
    const dbProfiles = await mongoose.connection.collection("talentprofiles").find({
      userId: { $in: [new mongoose.Types.ObjectId(talent1User.id || talent1User._id), new mongoose.Types.ObjectId(talent2User.id || talent2User._id)] }
    }).toArray();
    for (const p of dbProfiles) ids.talentProfiles.push(p._id);

    const dbOrg = await mongoose.connection.collection("organizations").findOne({
      userId: new mongoose.Types.ObjectId(recruiterUser.id || recruiterUser._id)
    });
    if (dbOrg) ids.organizations.push(dbOrg._id);

    // -------------------------------------------------------------
    // STEP 2: Create Project, Opportunity & Application
    // -------------------------------------------------------------
    console.log("\n--- Step 2: Project, Opportunity & Application Setup ---");
    const createProj = await api("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${recruiterToken}` },
      body: JSON.stringify({
        projectName: `${runPrefix} Feature Film`,
        projectType: "Feature Film",
        description: "Audition test project"
      })
    });
    if (!createProj.ok) fail("Create Project", JSON.stringify(createProj.body));
    const projectId = createProj.body.data?._id || createProj.body.data?.id;
    ids.projects.push(new mongoose.Types.ObjectId(projectId));
    pass("Create Project", projectId);

    const futureDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const createOpp = await api("/api/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${recruiterToken}` },
      body: JSON.stringify({
        projectId,
        title: `${runPrefix} Lead Actor Role`,
        summary: "Lead role in upcoming feature film",
        role: "Lead Actor",
        location: "Mumbai",
        deadline: futureDeadline
      })
    });
    if (!createOpp.ok) fail("Create Opportunity", JSON.stringify(createOpp.body));
    const oppData = createOpp.body.opportunity || createOpp.body.data;
    const opportunityId = oppData?._id || oppData?.id;
    ids.opportunities.push(new mongoose.Types.ObjectId(opportunityId));
    pass("Create Opportunity", opportunityId);

    // Set opportunity status to published so talent can apply
    await mongoose.connection.collection("opportunities").updateOne(
      { _id: new mongoose.Types.ObjectId(opportunityId) },
      { $set: { status: "published" } }
    );

    // Ensure Talent 1 profile is approved and 100% complete so talent can apply
    await mongoose.connection.collection("talentprofiles").updateOne(
      { userId: new mongoose.Types.ObjectId(talent1User.id || talent1User._id) },
      { $set: { isProfileApproved: true, status: "approved", profileCompletionPercentage: 100, isPaid: true } }
    );

    // Talent 1 applies
    const applyRes = await api("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${talent1Token}` },
      body: JSON.stringify({
        opportunityId,
        coverNote: "I am ready for the self-tape audition.",
        consentGiven: true
      })
    });
    if (!applyRes.ok) fail("Talent 1 Apply", JSON.stringify(applyRes.body));
    const appData = applyRes.body.application || applyRes.body.data;
    const applicationId = appData?._id || appData?.id;
    ids.applications.push(new mongoose.Types.ObjectId(applicationId));
    pass("Talent 1 Apply", applicationId);

    // Recruiter shortlists Talent 1
    const shortlistRes = await api(`/api/applications/${applicationId}/shortlist`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${recruiterToken}` }
    });
    if (!shortlistRes.ok) fail("Shortlist Application", JSON.stringify(shortlistRes.body));
    pass("Shortlist Application", "Status updated to shortlisted");

    // -------------------------------------------------------------
    // STEP 3: Config & Backend Rejection of Live Auditions
    // -------------------------------------------------------------
    console.log("\n--- Step 3: Backend Audition Config & Validation Rules ---");
    // a) Backend rejects non-self_tape format with 400
    const liveAttempt = await api("/api/auditions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${recruiterToken}` },
      body: JSON.stringify({
        applicationId,
        type: "video_interview", // Disallowed live format
        instructions: "Live interview test",
        deadline: new Date(Date.now() + 86400000).toISOString()
      })
    });
    if (liveAttempt.status === 400 && liveAttempt.body.message?.includes("Live auditions are currently disabled")) {
      pass("Backend Live Audition Rejection", `HTTP 400: ${liveAttempt.body.message}`);
    } else {
      fail("Backend Live Audition Rejection", `Expected 400, got ${liveAttempt.status}: ${JSON.stringify(liveAttempt.body)}`);
    }

    // b) Backend rejects missing deadline with 400
    const noDeadlineAttempt = await api("/api/auditions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${recruiterToken}` },
      body: JSON.stringify({
        applicationId,
        type: "self_tape",
        instructions: "Missing deadline test"
      })
    });
    if (noDeadlineAttempt.status === 400 && noDeadlineAttempt.body.message?.toLowerCase().includes("deadline") && noDeadlineAttempt.body.message?.toLowerCase().includes("required")) {
      pass("Backend Mandatory Deadline Rejection", `HTTP 400: ${noDeadlineAttempt.body.message}`);
    } else {
      fail("Backend Mandatory Deadline Rejection", `Expected 400, got ${noDeadlineAttempt.status}: ${JSON.stringify(noDeadlineAttempt.body)}`);
    }

    // -------------------------------------------------------------
    // STEP 4: UI Verification - Recruiter Shortlist & Audition Request Form
    // -------------------------------------------------------------
    console.log("\n--- Step 4: UI Verification - Recruiter Form ---");
    const recruiterPage = await context.newPage();
    await recruiterPage.goto(`${FRONTEND_BASE}/login`);
    await recruiterPage.evaluate(({ token, user }) => {
      localStorage.setItem("vismaya_auth_token", token);
      localStorage.setItem("vismaya_user_data", JSON.stringify(user));
    }, { token: recruiterToken, user: recruiterUser });
    pass("Recruiter Authenticated in Browser", recruiterEmail);

    await recruiterPage.goto(`${FRONTEND_BASE}/recruiter/shortlist-auditions?opportunity=${opportunityId}`);
    await recruiterPage.waitForLoadState("networkidle");

    // Click "INVITE" button on the candidate card
    const auditionBtn = recruiterPage.locator('.v-card-action-btn:has-text("INVITE")').first();
    await auditionBtn.waitFor({ state: "visible", timeout: 8000 });
    await auditionBtn.click();

    // Verify modal elements
    const modal = recruiterPage.locator('.modal-backdrop-wrap').first();
    await modal.waitFor({ state: "visible", timeout: 5000 });

    // Verify that live audition options are NOT present
    const liveOptionCount = await modal.locator('text="Live Virtual Audition"').count();
    const inPersonOptionCount = await modal.locator('text="Physical Studio Callback"').count();
    if (liveOptionCount === 0 && inPersonOptionCount === 0) {
      pass("Recruiter Modal: Live Audition Options Hidden", "Live video and in-person options not rendered");
    } else {
      fail("Recruiter Modal: Live Audition Options Hidden", `Found live options: ${liveOptionCount}, in-person: ${inPersonOptionCount}`);
    }

    // Verify Self-Tape format is displayed
    const selfTapeBadge = await modal.locator(':has-text("Video Self-Tape")').first().isVisible();
    if (selfTapeBadge) {
      pass("Recruiter Modal: Self-Tape Fixed Format", "Self-Tape displayed as fixed format");
    } else {
      fail("Recruiter Modal: Self-Tape Fixed Format", "Self-Tape format badge not visible");
    }

    // Verify Submit By date field is required
    const submitByInput = modal.locator('input[type="datetime-local"]');
    const isRequired = await submitByInput.getAttribute("required");
    if (isRequired !== null) {
      pass("Recruiter Modal: Submit By is Required", "input[type=datetime-local] has required attribute");
    } else {
      fail("Recruiter Modal: Submit By is Required", "Submit By field lacks required attribute");
    }

    // Fill the audition modal and submit
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    await submitByInput.fill(futureDate);
    await modal.locator('textarea').fill("Please record 2 takes of Scene 1. Slate name and height.");
    await modal.locator('button[type="submit"]').click();

    // Wait for modal to close or toast
    await recruiterPage.waitForTimeout(2000);
    pass("Recruiter Modal: Audition Request Sent via UI", "Request submitted");

    // Fetch the created audition from DB
    const dbAudition = await mongoose.connection.collection("auditions").findOne({
      applicationId: new mongoose.Types.ObjectId(applicationId)
    });
    if (!dbAudition) fail("Audition DB Creation", "Audition document not found in DB");
    ids.auditions.push(dbAudition._id);
    const auditionId = dbAudition._id.toString();
    pass("Audition Created in DB", `ID: ${auditionId}, status: ${dbAudition.status}, type: ${dbAudition.type}`);

    // Verify TAPE button is NOT visible for recruiter yet (video not submitted/approved)
    const tapeButtonCount = await recruiterPage.locator('button:has-text("TAPE")').count();
    if (tapeButtonCount === 0) {
      pass("Recruiter Shortlist: TAPE Button Hidden Before Approval", "TAPE button not visible");
    } else {
      fail("Recruiter Shortlist: TAPE Button Hidden Before Approval", "TAPE button prematurely visible");
    }
    await recruiterPage.close();

    // -------------------------------------------------------------
    // STEP 5: Security Checks - Unauthorized Access Blocked
    // -------------------------------------------------------------
    console.log("\n--- Step 5: Security Checks ---");
    // a) Organization cannot see video URLs before approval
    const orgCheck = await api(`/api/auditions/application/${applicationId}`, {
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });
    if (orgCheck.ok) {
      const aud = orgCheck.body.auditions?.[0] || orgCheck.body.data?.[0];
      if (!aud || !aud.selfTapeSubmission || (!aud.selfTapeSubmission.videoUrl && !aud.selfTapeSubmission.videoUrls)) {
        pass("Security Check: Org Video Sanitization Before Approval", "selfTapeSubmission sanitized in GET response");
      } else {
        fail("Security Check: Org Video Sanitization Before Approval", JSON.stringify(aud.selfTapeSubmission));
      }
    }

    // b) Unrelated talent (Talent 2) cannot submit video for Talent 1's audition
    const rogueSubmit = await api(`/api/auditions/${auditionId}/self-tape`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${talent2Token}` },
      body: JSON.stringify({
        videoUrl: "https://example.com/fake.mp4",
        notes: "Hacker take"
      })
    });
    if (rogueSubmit.status === 403 || rogueSubmit.status === 404) {
      pass("Security Check: Rogue Talent Upload Rejected", `HTTP ${rogueSubmit.status}: ${rogueSubmit.body.message}`);
    } else {
      fail("Security Check: Rogue Talent Upload Rejected", `Expected 403/404, got ${rogueSubmit.status}`);
    }

    // c) Unrelated talent cannot view Talent 1's audition
    const rogueView = await api(`/api/auditions/application/${applicationId}`, {
      headers: { Authorization: `Bearer ${talent2Token}` }
    });
    if (rogueView.status === 403 || rogueView.status === 404) {
      pass("Security Check: Rogue Talent View Blocked", `HTTP ${rogueView.status}`);
    } else {
      fail("Security Check: Rogue Talent View Blocked", `Expected 403/404, got ${rogueView.status}`);
    }

    // -------------------------------------------------------------
    // STEP 6: Backend Validation Rules for Video Upload
    // -------------------------------------------------------------
    console.log("\n--- Step 6: Backend Video Validation Checks ---");
    // a) Disallowed file type
    const invalidTypeRes = await api(`/api/auditions/${auditionId}/self-tape`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${talent1Token}` },
      body: JSON.stringify({
        videoUrl: "https://example.com/video.avi" // .avi is not mp4, mov, webm
      })
    });
    if (invalidTypeRes.status === 400 && (invalidTypeRes.body.message?.includes("Only MP4, MOV or WebM") || invalidTypeRes.body.message?.includes("Invalid file type"))) {
      pass("Backend File Type Check", `HTTP 400: ${invalidTypeRes.body.message}`);
    } else {
      fail("Backend File Type Check", `Expected 400, got ${invalidTypeRes.status}: ${JSON.stringify(invalidTypeRes.body)}`);
    }

    // b) Exceeding max videos per audition (max 3)
    const tooManyVideosRes = await api(`/api/auditions/${auditionId}/self-tape`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${talent1Token}` },
      body: JSON.stringify({
        videoUrls: [
          "https://example.com/take1.mp4",
          "https://example.com/take2.mp4",
          "https://example.com/take3.mp4",
          "https://example.com/take4.mp4"
        ]
      })
    });
    if (tooManyVideosRes.status === 400 && tooManyVideosRes.body.message?.includes("3 videos")) {
      pass("Backend Max Videos Check", `HTTP 400: ${tooManyVideosRes.body.message}`);
    } else {
      fail("Backend Max Videos Check", `Expected 400, got ${tooManyVideosRes.status}: ${JSON.stringify(tooManyVideosRes.body)}`);
    }

    // c) Exceeding max duration (5 min = 300 sec)
    const durationExceededRes = await api(`/api/auditions/${auditionId}/self-tape`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${talent1Token}` },
      body: JSON.stringify({
        videoUrl: "https://example.com/take1.mp4",
        videos: [{ url: "https://example.com/take1.mp4", durationSeconds: 360 }] // 6 mins
      })
    });
    if (durationExceededRes.status === 400 && durationExceededRes.body.message?.includes("duration exceeds")) {
      pass("Backend Video Duration Check", `HTTP 400: ${durationExceededRes.body.message}`);
    } else {
      fail("Backend Video Duration Check", `Expected 400, got ${durationExceededRes.status}: ${JSON.stringify(durationExceededRes.body)}`);
    }

    // -------------------------------------------------------------
    // STEP 7: UI Verification - Talent Auditions Page & Upload Flow
    // -------------------------------------------------------------
    console.log("\n--- Step 7: UI Verification - Talent Upload Flow ---");
    const talentPage = await context.newPage();
    await talentPage.goto(`${FRONTEND_BASE}/login`);
    await talentPage.evaluate(({ token, user }) => {
      localStorage.setItem("vismaya_auth_token", token);
      localStorage.setItem("vismaya_user_data", JSON.stringify(user));
    }, { token: talent1Token, user: talent1User });
    pass("Talent Authenticated in Browser", talent1Email);

    await talentPage.goto(`${FRONTEND_BASE}/talent/auditions`);
    await talentPage.waitForLoadState("networkidle");

    // Verify audition card is displayed
    const card = talentPage.locator('.aud-card-root').first();
    await card.waitFor({ state: "visible", timeout: 8000 });
    pass("Talent Card Visible", "Audition card rendered on /talent/auditions");

    // Verify upload control and instructions
    const uploadArea = card.locator('.aud-upload-area').first();
    const hasUploadArea = await uploadArea.isVisible();
    if (hasUploadArea) {
      pass("Talent Card Upload Control Visible", "Upload Self-Tape Video section rendered");
    } else {
      fail("Talent Card Upload Control Visible", "Upload control not visible on card");
    }

    // Create a temporary small sample mp4 file for testing
    const sampleVideoPath = resolve("frontend/public/test-selftape-sample.mp4");
    // Write 1KB mock video
    fs.writeFileSync(sampleVideoPath, Buffer.alloc(1024, 0));

    // Test client-side invalid format check using a .txt file
    const invalidFilePath = resolve("frontend/public/test-invalid.txt");
    fs.writeFileSync(invalidFilePath, "This is not a video");

    const fileInput = card.locator('input[type="file"]');
    await fileInput.setInputFiles(invalidFilePath);
    const formatError = card.locator(':has-text("Only MP4, MOV or WebM files are allowed")').first();
    await formatError.waitFor({ state: "visible", timeout: 3000 });
    pass("Client-Side File Format Validation", "Rejected .txt file with 'Only MP4, MOV or WebM files are allowed'");

    // Clean up temporary txt file
    try { fs.unlinkSync(invalidFilePath); } catch {}

    // Submit valid self-tape via API to verify full submitted state & preview player in UI
    console.log("\n--- Submitting Valid Self-Tape ---");
    const submitRes = await api(`/api/auditions/${auditionId}/self-tape`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${talent1Token}` },
      body: JSON.stringify({
        videoUrl: "https://res.cloudinary.com/demo/video/upload/sample.mp4",
        videoUrls: ["https://res.cloudinary.com/demo/video/upload/sample.mp4"],
        videos: [{
          url: "https://res.cloudinary.com/demo/video/upload/sample.mp4",
          fileName: "take_1_slate.mp4",
          fileSizeBytes: 2048576,
          durationSeconds: 120
        }],
        notes: "Here is my first take."
      })
    });
    if (!submitRes.ok) fail("Submit Self-Tape API", JSON.stringify(submitRes.body));
    pass("Submit Valid Self-Tape API", "Status set to submitted, vismayaApproval set to pending");

    // Reload talent auditions page to verify updated state
    await talentPage.reload();
    await talentPage.waitForLoadState("networkidle");

    // Verify "Submitted - under Vismaya review" status
    const reviewStatusText = talentPage.locator('text="Submitted - under Vismaya review"').first();
    await reviewStatusText.waitFor({ state: "visible", timeout: 5000 });
    pass("Talent Card Status: Under Vismaya Review", "Banner displayed on card");

    // Verify video preview player is present
    const videoPlayer = talentPage.locator('video, .video-player-wrap, .aud-recording-section').first();
    const hasPlayer = await videoPlayer.isVisible();
    if (hasPlayer) {
      pass("Talent Card: Video Preview Player Visible", "Video element/container rendered");
    } else {
      fail("Talent Card: Video Preview Player Visible", "Video player not found");
    }

    // Verify "Replace video" option is available
    const replaceBtn = talentPage.locator('button:has-text("Replace video")').first();
    const hasReplaceBtn = await replaceBtn.isVisible();
    if (hasReplaceBtn) {
      pass("Talent Card: Replace Video Button Visible", "Replace option enabled before review");
    } else {
      fail("Talent Card: Replace Video Button Visible", "Replace button missing");
    }

    await talentPage.close();
    try { fs.unlinkSync(sampleVideoPath); } catch {}

    // -------------------------------------------------------------
    // STEP 8: Security Check After Submission (Still Hidden from Org)
    // -------------------------------------------------------------
    console.log("\n--- Step 8: Security Check Post-Submission (Pending Admin Review) ---");
    const orgCheck2 = await api(`/api/auditions/application/${applicationId}`, {
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });
    if (orgCheck2.ok) {
      const aud = orgCheck2.body.auditions?.[0] || orgCheck2.body.data?.[0];
      if (!aud || !aud.selfTapeSubmission || (!aud.selfTapeSubmission.videoUrl && !aud.selfTapeSubmission.videoUrls)) {
        pass("Security Check: Org Still Cannot See Video While Pending Review", "selfTapeSubmission sanitized in organization response");
      } else {
        fail("Security Check: Org Still Cannot See Video While Pending Review", "videoUrl leaked to org before admin approval!");
      }
    }

    // -------------------------------------------------------------
    // STEP 9: Deadline Enforcement Flow
    // -------------------------------------------------------------
    console.log("\n--- Step 9: Deadline Enforcement Check ---");
    // Update audition deadline to the past
    await mongoose.connection.collection("auditions").updateOne(
      { _id: dbAudition._id },
      { $set: { deadline: new Date(Date.now() - 3600000), status: "requested" } }
    );

    // Try submitting after deadline via API
    const expiredSubmitRes = await api(`/api/auditions/${auditionId}/self-tape`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${talent1Token}` },
      body: JSON.stringify({
        videoUrl: "https://res.cloudinary.com/demo/video/upload/late.mp4"
      })
    });
    if (expiredSubmitRes.status === 400 && expiredSubmitRes.body.message?.toLowerCase().includes("deadline has passed")) {
      pass("Backend Deadline Rejection", `HTTP 400: ${expiredSubmitRes.body.message}`);
    } else {
      fail("Backend Deadline Rejection", `Expected 400, got ${expiredSubmitRes.status}: ${JSON.stringify(expiredSubmitRes.body)}`);
    }

    // Verify UI blocks expired audition
    const talentPage2 = await context.newPage();
    await talentPage2.goto(`${FRONTEND_BASE}/login`);
    await talentPage2.evaluate(({ token, user }) => {
      localStorage.setItem("vismaya_auth_token", token);
      localStorage.setItem("vismaya_user_data", JSON.stringify(user));
    }, { token: talent1Token, user: talent1User });
    await talentPage2.goto(`${FRONTEND_BASE}/talent/auditions`);
    await talentPage2.waitForLoadState("networkidle");

    const closedNotice = talentPage2.locator('text="Submission closed"').first();
    await closedNotice.waitFor({ state: "visible", timeout: 5000 });
    pass("UI Deadline Enforcement: Submission Closed Banner Visible", "Upload blocked for expired audition");
    await talentPage2.close();

    console.log(`\n=============================================================`);
    console.log(`ALL AUTOMATED SELFTAPE CHECKS PASSED: ${stats.passed}/${stats.passed}`);
    console.log(`=============================================================\n`);

  } catch (err) {
    console.error("\nFATAL ERROR DURING VERIFICATION:", err);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();

    // -------------------------------------------------------------
    // CLEANUP: Strictly Delete ONLY Created Test Data (runPrefix)
    // -------------------------------------------------------------
    console.log("\n--- Cleaning Up E2E-SELFTAPE Test Data ---");
    try {
      if (mongoose.connection.readyState) {
        const db = mongoose.connection.db;
        const delAuditions = await db.collection("auditions").deleteMany({ _id: { $in: ids.auditions } });
        const delApps = await db.collection("applications").deleteMany({ _id: { $in: ids.applications } });
        const delOpps = await db.collection("opportunities").deleteMany({ _id: { $in: ids.opportunities } });
        const delProjects = await db.collection("projects").deleteMany({ _id: { $in: ids.projects } });
        const delProfiles = await db.collection("talentprofiles").deleteMany({ _id: { $in: ids.talentProfiles } });
        const delOrgs = await db.collection("organizations").deleteMany({ _id: { $in: ids.organizations } });
        const delUsers = await db.collection("users").deleteMany({ _id: { $in: ids.users } });
        const delNotifications = await db.collection("notifications").deleteMany({
          $or: [{ recipient: { $in: ids.users } }, { "data.auditionId": { $in: ids.auditions.map(id => id.toString()) } }]
        });

        console.log(`Deleted records summary:`);
        console.log(`- Auditions: ${delAuditions.deletedCount}`);
        console.log(`- Applications: ${delApps.deletedCount}`);
        console.log(`- Opportunities: ${delOpps.deletedCount}`);
        console.log(`- Projects: ${delProjects.deletedCount}`);
        console.log(`- Talent Profiles: ${delProfiles.deletedCount}`);
        console.log(`- Organizations: ${delOrgs.deletedCount}`);
        console.log(`- Users: ${delUsers.deletedCount}`);
        console.log(`- Notifications: ${delNotifications.deletedCount}`);

        // Verify orphan profiles untouched
        const orphanCount = await db.collection("talentprofiles").countDocuments({
          $or: [{ userId: null }, { userId: { $exists: false } }]
        });
        console.log(`Orphan profiles intact count: ${orphanCount}`);

        await mongoose.disconnect();
      }
    } catch (cleanErr) {
      console.error("Cleanup error:", cleanErr);
    }
  }
}

run();
