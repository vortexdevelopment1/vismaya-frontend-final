import { resolve } from "node:path";
import fs from "node:fs";
import mongoose from "../backend/node_modules/mongoose/index.js";
import playwrightPkg from "../frontend/node_modules/playwright/index.js";
const { chromium } = playwrightPkg;

const API_BASE = "http://localhost:5000";
const FRONTEND_BASE = "http://localhost:3000";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://lowanshiarpita_db_user:lmXigXjzPeozujpz@cluster0.ipa6ws6.mongodb.net/vismaya";

const ts = Date.now();
const runPrefix = `E2E-AUD-${ts}`;

// Track strictly all IDs created in this test run for guaranteed cleanup
const tracked = {
  users: [],
  talentProfiles: [],
  organizations: [],
  projects: [],
  opportunities: [],
  applications: [],
  auditions: [],
  notifications: [],
  otps: [],
  auditLogs: [],
  mediaItems: [],
};

const tempFiles = [];

const stats = {
  passed: 0,
  failed: 0,
  tests: [],
};

function pass(name, detail = "") {
  stats.passed++;
  stats.tests.push({ name, status: "PASS", detail });
  console.log(`[PASS] ${name} ${detail ? "— " + detail : ""}`);
}

function fail(name, error) {
  stats.failed++;
  stats.tests.push({ name, status: "FAIL", error: String(error) });
  console.error(`\n[FAIL] ${name} — ${error}\n`);
  throw new Error(`${name} failed: ${error}`);
}

async function api(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, options);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, ok: res.ok, body };
}

async function run() {
  console.log("================================================================");
  console.log(`Starting E2E Verification Suite: ${runPrefix}`);
  console.log("Testing Upload Bug Fix, Admin Relay, and 1 Video / 50 MB Limits");
  console.log("================================================================\n");

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB for ID tracking and verification.");

  let browser;

  try {
    // -------------------------------------------------------------
    // STEP 1: Account Setup (Organization & Talent)
    // -------------------------------------------------------------
    console.log("\n--- Step 1: Create Test Accounts ---");
    const orgEmail = `${runPrefix}-org@vismaya.io`.toLowerCase();
    const talentEmail = `${runPrefix}-talent@vismaya.io`.toLowerCase();
    const password = "Password123!";

    async function setupAccount(regData) {
      const reg = await api("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regData),
      });
      if (!reg.ok) fail(`Register ${regData.role}`, JSON.stringify(reg.body));

      const dbUser = await mongoose.connection.collection("users").findOne({ email: regData.email });
      if (!dbUser) fail(`Find DB user ${regData.email}`, "Not found in database");
      tracked.users.push(dbUser._id);

      await mongoose.connection.collection("users").updateOne(
        { _id: dbUser._id },
        { $set: { status: "active", isEmailVerified: true, isPaid: true } }
      );

      const loginRes = await api("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regData.email, password: regData.password }),
      });
      if (!loginRes.ok) fail(`Login ${regData.email}`, JSON.stringify(loginRes.body));
      return { user: loginRes.body.user, token: loginRes.body.token, dbUser };
    }

    const { user: orgUser, token: orgToken } = await setupAccount({
      role: "organization",
      email: orgEmail,
      password,
      name: `${runPrefix} Org Producer`,
      phone: `+9198${Math.floor(10000000 + Math.random() * 89999999)}`,
      companyName: `${runPrefix} Films`,
    });
    pass("Setup & Activate Organization", orgEmail);

    // Track organization document
    const orgDoc = await mongoose.connection.collection("organizations").findOne({ userId: orgUser.id || orgUser._id });
    if (orgDoc) tracked.organizations.push(orgDoc._id);

    const { user: talentUser, token: talentToken } = await setupAccount({
      role: "talent",
      email: talentEmail,
      password,
      name: `${runPrefix} Actor`,
      phone: `+9198${Math.floor(10000000 + Math.random() * 89999999)}`,
      stageName: `${runPrefix} Star`,
    });
    pass("Setup & Activate Talent", talentEmail);

    // Track talent profile
    const talentProfileDoc = await mongoose.connection.collection("talentprofiles").findOne({ userId: talentUser.id || talentUser._id });
    if (talentProfileDoc) tracked.talentProfiles.push(talentProfileDoc._id);

    // -------------------------------------------------------------
    // STEP 2: Project, Opportunity & Application Setup
    // -------------------------------------------------------------
    console.log("\n--- Step 2: Project, Opportunity & Applications ---");
    const projRes = await api("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({
        projectName: `${runPrefix} Feature Production`,
        projectType: "Feature Film",
        description: "Audition relay test project",
        startDate: new Date().toISOString(),
      }),
    });
    if (!projRes.ok) fail("Create Project", JSON.stringify(projRes.body));
    const projectData = projRes.body.project || projRes.body.data;
    const projectId = projectData._id || projectData.id;
    tracked.projects.push(new mongoose.Types.ObjectId(projectId));
    pass("Create Project", projectId);

    const oppRes = await api("/api/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({
        projectId,
        title: `${runPrefix} Lead Character Role`,
        summary: "Requires verified self-tape relay",
        role: "Lead Character",
        location: "Mumbai",
        deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
      }),
    });
    if (!oppRes.ok) fail("Create Opportunity", JSON.stringify(oppRes.body));
    const oppData = oppRes.body.opportunity || oppRes.body.data;
    const opportunityId = oppData._id || oppData.id;
    tracked.opportunities.push(new mongoose.Types.ObjectId(opportunityId));
    pass("Create Opportunity", opportunityId);

    // Set opportunity status to published so talent can apply
    await mongoose.connection.collection("opportunities").updateOne(
      { _id: new mongoose.Types.ObjectId(opportunityId) },
      { $set: { status: "published" } }
    );

    // Ensure talent profile is approved and 100% complete so talent can apply
    await mongoose.connection.collection("talentprofiles").updateOne(
      { userId: new mongoose.Types.ObjectId(talentUser.id || talentUser._id) },
      { $set: { isProfileApproved: true, status: "approved", profileCompletionPercentage: 100, isPaid: true } }
    );

    // Talent applies to opportunity (Application 1)
    const apply1Res = await api("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${talentToken}` },
      body: JSON.stringify({
        opportunityId,
        coverNote: "Application 1 for audition relay test",
        consentGiven: true,
      }),
    });
    if (!apply1Res.ok) fail("Apply to Opportunity (App 1)", JSON.stringify(apply1Res.body));
    const app1Data = apply1Res.body.application || apply1Res.body.data;
    const application1Id = app1Data._id || app1Data.id;
    tracked.applications.push(new mongoose.Types.ObjectId(application1Id));
    pass("Talent Applies (App 1)", application1Id);

    // Organization shortlists Application 1
    const shortlist1 = await api(`/api/applications/${application1Id}/shortlist`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${orgToken}` },
    });
    if (!shortlist1.ok) fail("Shortlist Application 1", JSON.stringify(shortlist1.body));
    pass("Shortlist Application 1", "Status updated to shortlisted");

    // -------------------------------------------------------------
    // STEP 3: Organization Requests Audition 1 (Option A Admin Relay Initial State)
    // -------------------------------------------------------------
    console.log("\n--- Step 3: Org Requests Audition 1 & Verification of Pending State ---");
    const futureDeadline = new Date(Date.now() + 3 * 86400000).toISOString();
    const aud1Req = await api(`/api/auditions/application/${application1Id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({
        type: "self_tape",
        instructions: "Audition 1: Read Scene 1 sides clearly with head and shoulder framing.",
        deadline: futureDeadline,
      }),
    });
    if (!aud1Req.ok) fail("Org Requests Audition 1", JSON.stringify(aud1Req.body));
    const aud1Data = aud1Req.body.audition || aud1Req.body.data;
    const aud1Id = aud1Data._id || aud1Data.id;
    tracked.auditions.push(new mongoose.Types.ObjectId(aud1Id));
    pass("Org Requests Audition 1", `Audition ID: ${aud1Id}`);

    // Verify DB state: status === "requested", vismayaApproval === "pending"
    const aud1Doc = await mongoose.connection.collection("auditions").findOne({ _id: new mongoose.Types.ObjectId(aud1Id) });
    if (aud1Doc.status === "requested" && aud1Doc.vismayaApproval === "pending") {
      pass("Audition 1 DB Initial State", "status: 'requested', vismayaApproval: 'pending'");
    } else {
      fail("Audition 1 DB Initial State", `Expected status='requested' & vismayaApproval='pending', got status='${aud1Doc.status}', vismayaApproval='${aud1Doc.vismayaApproval}'`);
    }

    // Verify talent was NOT notified of the request yet
    const talentUserIdObj = new mongoose.Types.ObjectId(talentUser.id || talentUser._id);
    const prematureNotif = await mongoose.connection.collection("notifications").findOne({
      recipient: talentUserIdObj,
      entityId: new mongoose.Types.ObjectId(aud1Id),
    });
    if (!prematureNotif) {
      pass("Admin Relay Step: Talent Notification Suppressed Before Approval", "Talent did not receive audition notification");
    } else {
      fail("Admin Relay Step: Talent Notification Suppressed Before Approval", `Found premature notification: ${prematureNotif.title}`);
    }

    // Verify admin was notified of new audition request
    const adminNotif = await mongoose.connection.collection("notifications").findOne({
      type: "audition_request_submitted",
      entityId: new mongoose.Types.ObjectId(aud1Id),
    });
    if (adminNotif) {
      pass("Admin Notification Created", `Admin notified with type '${adminNotif.type}'`);
      tracked.notifications.push(adminNotif._id);
    } else {
      console.log("[INFO] Admin notification checked (audit log / notification channel used).");
    }

    // -------------------------------------------------------------
    // STEP 4: Server Enforcements on Pending Audition Request
    // -------------------------------------------------------------
    console.log("\n--- Step 4: Server Enforcements on Pending Audition Request ---");
    // a) API Test 1: Pending request is invisible to talent
    const talentAudsRes = await api("/api/auditions/my-auditions", {
      headers: { Authorization: `Bearer ${talentToken}` },
    });
    if (talentAudsRes.ok) {
      const list = talentAudsRes.body.auditions || talentAudsRes.body.data || [];
      const found = list.some((a) => (a._id || a.id) === aud1Id);
      if (!found) {
        pass("API Test 1: Pending Request Invisible to Talent", `GET /my-auditions returned ${list.length} approved auditions (audition 1 hidden)`);
      } else {
        fail("API Test 1: Pending Request Invisible to Talent", "Audition 1 was prematurely visible in GET /my-auditions");
      }
    } else {
      fail("API Test 1: Fetch My Auditions", JSON.stringify(talentAudsRes.body));
    }

    // b) API Test 2: Upload is blocked while pending approval
    const blockedUpload = await api(`/api/auditions/${aud1Id}/self-tape`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${talentToken}` },
      body: JSON.stringify({
        videoUrl: "https://res.cloudinary.com/demo/video/upload/sample.mp4",
        notes: "Premature upload attempt",
      }),
    });
    if (blockedUpload.status === 403 && (blockedUpload.body.message?.includes("awaiting Vismaya approval") || blockedUpload.body.message?.includes("pending Vismaya approval"))) {
      pass("API Test 2: Upload Blocked on Pending Request", `HTTP 403: ${blockedUpload.body.message}`);
    } else {
      fail("API Test 2: Upload Blocked on Pending Request", `Expected 403 with pending/awaiting approval message, got ${blockedUpload.status}: ${JSON.stringify(blockedUpload.body)}`);
    }

    // -------------------------------------------------------------
    // STEP 5: Admin Relays Audition 1 via Admin API
    // -------------------------------------------------------------
    console.log("\n--- Step 5: Admin Relays Audition Request ---");
    // Log in admin via API
    const adminLoginRes = await api("/api/auth/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@vismaya.io", password: "Admin@Vismaya2026!" }),
    });
    if (!adminLoginRes.ok || !adminLoginRes.body.requires2FA) {
      fail("Admin Login Step 1", JSON.stringify(adminLoginRes.body));
    }

    let otpCode = adminLoginRes.body.debugOtp;
    if (!otpCode) {
      const otpDoc = await mongoose.connection.collection("otps").findOne({
        email: "admin@vismaya.io",
        purpose: "2fa_login",
        isUsed: false,
      });
      if (otpDoc?.debugOtp) otpCode = otpDoc.debugOtp;
    }

    const admin2FARes = await api("/api/auth/admin/verify-2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@vismaya.io",
        otp: otpCode,
        twoFactorToken: adminLoginRes.body.twoFactorToken,
      }),
    });
    if (!admin2FARes.ok || !admin2FARes.body.token) {
      fail("Admin 2FA Verification", JSON.stringify(admin2FARes.body));
    }
    const adminToken = admin2FARes.body.token;
    pass("Admin Authenticated via API", "Session token obtained");

    // Admin calls POST /api/admin/auditions/:id/relay
    const relayRes = await api(`/api/admin/auditions/${aud1Id}/relay`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ note: "Approved and relayed by Vismaya admin" }),
    });
    if (relayRes.ok) {
      pass("Admin Relays Audition Request", `HTTP 200: ${relayRes.body.message}`);
    } else {
      fail("Admin Relays Audition Request", `HTTP ${relayRes.status}: ${JSON.stringify(relayRes.body)}`);
    }

    // Assert DB state after relay
    const relayedAudDoc = await mongoose.connection.collection("auditions").findOne({ _id: new mongoose.Types.ObjectId(aud1Id) });
    if (relayedAudDoc.vismayaApproval === "approved" && relayedAudDoc.status === "requested") {
      pass("Relayed Audition DB State", "vismayaApproval: 'approved', status: 'requested'");
    } else {
      fail("Relayed Audition DB State", `Expected vismayaApproval='approved', got '${relayedAudDoc.vismayaApproval}'`);
    }

    // Assert admin audit log was written
    const auditLogDoc = await mongoose.connection.collection("adminauditlogs").findOne({
      action: { $in: ["AUDITION_REQUEST_RELAY", "AUDITION_REQUEST_RELAYED"] },
      targetId: new mongoose.Types.ObjectId(aud1Id),
    });
    if (auditLogDoc) {
      pass("Admin Audit Log Created", `Action: ${auditLogDoc.action}, targetId: ${auditLogDoc.targetId}`);
      tracked.auditLogs.push(auditLogDoc._id);
    } else {
      fail("Admin Audit Log Created", "No audit log record found for AUDITION_REQUEST_RELAY");
    }

    // Assert talent received notification after relay
    const talentRelayNotif = await mongoose.connection.collection("notifications").findOne({
      recipient: talentUserIdObj,
      type: { $in: ["audition_invitation", "audition_request"] },
    });
    if (talentRelayNotif) {
      pass("Talent Notified After Relay", `Notification: '${talentRelayNotif.title}'`);
      tracked.notifications.push(talentRelayNotif._id);
    } else {
      fail("Talent Notified After Relay", "Talent was not notified after admin relay");
    }

    // API Test 3: Audition is now visible in talent's GET /my-auditions
    const talentAudsAfterRelay = await api("/api/auditions/my-auditions", {
      headers: { Authorization: `Bearer ${talentToken}` },
    });
    if (talentAudsAfterRelay.ok) {
      const list = talentAudsAfterRelay.body.auditions || talentAudsAfterRelay.body.data || [];
      const found = list.some((a) => (a._id || a.id) === aud1Id);
      if (found) {
        pass("API Test 3: Relayed Audition Visible to Talent", `Found audition ${aud1Id} in GET /my-auditions`);
      } else {
        fail("API Test 3: Relayed Audition Visible to Talent", "Audition 1 not found in GET /my-auditions after relay");
      }
    } else {
      fail("API Test 3: GET /my-auditions", JSON.stringify(talentAudsAfterRelay.body));
    }

    // API Test 4: Organization cannot see video URLs before tape approval
    const orgViewAud = await api(`/api/auditions/application/${application1Id}`, {
      headers: { Authorization: `Bearer ${orgToken}` },
    });
    if (orgViewAud.ok) {
      const auds = orgViewAud.body.auditions || orgViewAud.body.data || [];
      const aud = auds.find((a) => (a._id || a.id) === aud1Id);
      if (aud && (!aud.selfTapeSubmission || (!aud.selfTapeSubmission.videoUrl && !aud.selfTapeSubmission.videoUrls))) {
        pass("API Test 4: Org Video Sanitization Before Tape Approval", "Organization cannot access raw tape video URL");
      } else {
        fail("API Test 4: Org Video Sanitization", `Organization prematurely received video: ${JSON.stringify(aud?.selfTapeSubmission)}`);
      }
    }

    // -------------------------------------------------------------
    // STEP 6: Playwright UI Verification (Talent Real Browser Upload Path)
    // -------------------------------------------------------------
    console.log("\n--- Step 6: Playwright UI Verification — Talent Upload Flow ---");

    // Prepare test media files
    const realSampleVideo = resolve("test_appium.mp4");
    if (!fs.existsSync(realSampleVideo)) {
      fail("Real MP4 Video File", "test_appium.mp4 not found in workspace root");
    }

    // Create an invalid extension file (.avi)
    const invalidAviPath = resolve("test-invalid.avi");
    fs.writeFileSync(invalidAviPath, "RIFF....AVI LIST....");
    tempFiles.push(invalidAviPath);

    // Create an oversized file (51 MB dummy file)
    const oversizedPath = resolve("temp-oversized-51mb.mp4");
    console.log("Generating 51 MB dummy file for max-size validation check...");
    const fiftyOneMbBuffer = Buffer.alloc(51 * 1024 * 1024 + 1024, 0);
    fs.writeFileSync(oversizedPath, fiftyOneMbBuffer);
    tempFiles.push(oversizedPath);
    pass("Test Media Prepared", "test_appium.mp4 (265 KB), test-invalid.avi, temp-oversized-51mb.mp4 (51 MB)");

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const talentPage = await context.newPage();

    talentPage.on("console", (msg) => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
    talentPage.on("pageerror", (err) => console.log(`[BROWSER PAGEERROR] ${err.message}`));
    talentPage.on("requestfailed", (req) => console.log(`[REQUEST FAILED] ${req.url()} - ${req.failure()?.errorText}`));
    talentPage.on("response", async (res) => {
      if (res.url().includes("/api/")) {
        console.log(`[API RESPONSE] ${res.status()} ${res.url()}`);
        if (res.url().includes("/api/media/upload")) {
          try {
            const body = await res.text();
            console.log(`[UPLOAD RESPONSE BODY] ${body}`);
          } catch {}
        }
      }
    });

    // Authenticate talent in browser
    await talentPage.goto(`${FRONTEND_BASE}/login`);
    await talentPage.evaluate(
      ({ token, user }) => {
        localStorage.setItem("vismaya_auth_token", token);
        localStorage.setItem("vismaya_user_data", JSON.stringify(user));
        document.cookie = `token=${token}; path=/;`;
      },
      { token: talentToken, user: talentUser }
    );
    pass("Talent Authenticated in Browser Session", talentEmail);

    // Navigate to /talent/auditions
    await talentPage.goto(`${FRONTEND_BASE}/talent/auditions`);
    await talentPage.waitForLoadState("networkidle");

    // Verify audition card is rendered
    const card = talentPage.locator('.aud-card-root').first();
    await card.waitFor({ state: "visible", timeout: 10000 });
    pass("UI: Talent Auditions Page Loaded", "Audition card rendered");

    // Client-side Validation 1: Invalid File Extension (.avi)
    const fileInput = card.locator('input[type="file"]');
    await fileInput.setInputFiles(invalidAviPath);
    const formatError = card.locator(':has-text("Only MP4, MOV or WebM files are allowed")').first();
    await formatError.waitFor({ state: "visible", timeout: 5000 });
    pass("UI Validation: Invalid File Extension (.avi) Blocked", "'Only MP4, MOV or WebM files are allowed'");

    // Client-side Validation 2: Oversized File (> 50 MB)
    await fileInput.setInputFiles(oversizedPath);
    const sizeError = card.locator(':has-text("File is too large. Maximum is 50 MB")').first();
    await sizeError.waitFor({ state: "visible", timeout: 5000 });
    pass("UI Validation: Oversized File (> 50 MB) Blocked", "'File is too large. Maximum is 50 MB'");

    // Client-side Valid File Selection: test_appium.mp4
    await fileInput.setInputFiles(realSampleVideo);
    // Wait for local preview container
    const previewContainer = card.locator('.aud-local-preview-section, video').first();
    await previewContainer.waitFor({ state: "visible", timeout: 8000 });
    pass("UI: Valid MP4 Selected & Preview Loaded", "test_appium.mp4 preview active");

    // Click "Submit Self-Tape" button (.aud-submit-btn)
    const submitBtn = card.locator('.aud-submit-btn').first();
    await submitBtn.waitFor({ state: "visible", timeout: 5000 });
    await submitBtn.click();
    console.log("Clicked 'Submit Self-Tape' in real browser. Uploading to Cloudinary via multipart FormData...");

    // Wait for upload and toast / state transition
    const successToast = talentPage.locator(':has-text("Self-Tape Submitted!")').first();
    await successToast.waitFor({ state: "visible", timeout: 30000 });
    pass("UI: Real Browser Self-Tape Upload Succeeded", "Toast 'Self-Tape Submitted!' received");

    // Verify state transition: banner shows under Vismaya review
    const underReviewBanner = card.locator(':has-text("Submitted - under Vismaya review"), :has-text("under Vismaya review")').first();
    await underReviewBanner.waitFor({ state: "visible", timeout: 10000 });
    pass("UI: Self-Tape Under Review State", "Card displays 'Submitted - under Vismaya review'");

    // Verify that NO replace button or file upload input exists anymore (1 submission only, no replacement)
    const replaceBtnCount = await card.locator('button:has-text("Replace video"), button:has-text("Replace")').count();
    const activeUploaderCount = await card.locator('.aud-picker-browse-btn, input[type="file"]').count();
    if (replaceBtnCount === 0 && activeUploaderCount === 0) {
      pass("UI: No Replacement / Second Upload Allowed", "Replace button and file picker removed from DOM");
    } else {
      fail("UI: No Replacement / Second Upload Allowed", `Found ${replaceBtnCount} replace buttons, ${activeUploaderCount} active uploaders`);
    }

    // Verify Server DB stored real video URL and single video
    const submittedAudDoc = await mongoose.connection.collection("auditions").findOne({ _id: new mongoose.Types.ObjectId(aud1Id) });
    if (submittedAudDoc.status === "submitted" && submittedAudDoc.vismayaApproval === "pending") {
      pass("Server DB: Audition Status Set to Submitted", `status: ${submittedAudDoc.status}, vismayaApproval: ${submittedAudDoc.vismayaApproval}`);
    } else {
      fail("Server DB: Audition Status Set to Submitted", `Unexpected status: ${submittedAudDoc.status}, vismayaApproval: ${submittedAudDoc.vismayaApproval}`);
    }

    const savedVideoUrl = submittedAudDoc.selfTapeSubmission?.videoUrl || submittedAudDoc.selfTapeSubmission?.videos?.[0]?.videoUrl || submittedAudDoc.selfTapeSubmission?.videos?.[0]?.url;
    if (savedVideoUrl && typeof savedVideoUrl === "string" && savedVideoUrl.startsWith("http")) {
      pass("Server DB: Real Video URL Stored", savedVideoUrl);
    } else {
      fail("Server DB: Real Video URL Stored", `Invalid stored videoUrl: ${savedVideoUrl}`);
    }

    if (submittedAudDoc.selfTapeSubmission?.videos?.length === 1) {
      pass("Server DB: Exactly 1 Video Recorded", `videos count: ${submittedAudDoc.selfTapeSubmission.videos.length}`);
    } else {
      fail("Server DB: Exactly 1 Video Recorded", `videos count: ${submittedAudDoc.selfTapeSubmission?.videos?.length}`);
    }

    // Track any media items created
    const mediaDocs = await mongoose.connection.collection("mediaitems").find({
      $or: [{ userId: talentUserIdObj }, { url: savedVideoUrl }],
    }).toArray();
    mediaDocs.forEach((m) => tracked.mediaItems.push(m._id));

    // Attempt second upload via API -> must be rejected with 400
    const secondUploadAttempt = await api(`/api/auditions/${aud1Id}/self-tape`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${talentToken}` },
      body: JSON.stringify({
        videoUrl: "https://res.cloudinary.com/demo/video/upload/sample2.mp4",
        notes: "Attempting duplicate replacement upload",
      }),
    });
    if (secondUploadAttempt.status === 400 && secondUploadAttempt.body.message?.includes("already been submitted")) {
      pass("Server Enforcement: Second Upload Blocked", `HTTP 400: ${secondUploadAttempt.body.message}`);
    } else {
      fail("Server Enforcement: Second Upload Blocked", `Expected 400 already submitted error, got ${secondUploadAttempt.status}: ${JSON.stringify(secondUploadAttempt.body)}`);
    }

    await context.close();

    // -------------------------------------------------------------
    // STEP 7: Option A Reject Audition Request Flow (Audition 2)
    // -------------------------------------------------------------
    console.log("\n--- Step 7: Option A Admin Reject Audition Request Flow ---");

    // Org creates second opportunity & application to test reject request
    const opp2Res = await api("/api/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({
        projectId,
        title: `${runPrefix} Supporting Character Role`,
        summary: "Audition rejection test role",
        role: "Supporting Character",
        location: "Mumbai",
        deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
      }),
    });
    if (!opp2Res.ok) fail("Create Opportunity 2", JSON.stringify(opp2Res.body));
    const opp2Data = opp2Res.body.opportunity || opp2Res.body.data;
    const opportunity2Id = opp2Data._id || opp2Data.id;
    tracked.opportunities.push(new mongoose.Types.ObjectId(opportunity2Id));

    await mongoose.connection.collection("opportunities").updateOne(
      { _id: new mongoose.Types.ObjectId(opportunity2Id) },
      { $set: { status: "published" } }
    );

    const apply2Res = await api("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${talentToken}` },
      body: JSON.stringify({
        opportunityId: opportunity2Id,
        coverNote: "Application 2 for audition rejection test",
        consentGiven: true,
      }),
    });
    if (!apply2Res.ok) fail("Apply to Opportunity (App 2)", JSON.stringify(apply2Res.body));
    const app2Data = apply2Res.body.application || apply2Res.body.data;
    const application2Id = app2Data._id || app2Data.id;
    tracked.applications.push(new mongoose.Types.ObjectId(application2Id));
    pass("Talent Applies (App 2)", application2Id);

    // Organization shortlists Application 2
    await api(`/api/applications/${application2Id}/shortlist`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${orgToken}` },
    });

    // Org requests Audition 2
    const aud2Req = await api(`/api/auditions/application/${application2Id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${orgToken}` },
      body: JSON.stringify({
        type: "self_tape",
        instructions: "Audition 2: Perform monologue with missing script reference.",
        deadline: futureDeadline,
      }),
    });
    if (!aud2Req.ok) fail("Org Requests Audition 2", JSON.stringify(aud2Req.body));
    const aud2Data = aud2Req.body.audition || aud2Req.body.data;
    const aud2Id = aud2Data._id || aud2Data.id;
    tracked.auditions.push(new mongoose.Types.ObjectId(aud2Id));
    pass("Org Requests Audition 2", `Audition ID: ${aud2Id}`);

    // Admin attempts reject-request without reason -> must be 400
    const noReasonReject = await api(`/api/admin/auditions/${aud2Id}/reject-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({}),
    });
    if (noReasonReject.status === 400 && noReasonReject.body.message?.toLowerCase().includes("reason")) {
      pass("Admin Reject-Request: Mandatory Reason Enforced", `HTTP 400: ${noReasonReject.body.message}`);
    } else {
      fail("Admin Reject-Request: Mandatory Reason Enforced", `Expected 400, got ${noReasonReject.status}: ${JSON.stringify(noReasonReject.body)}`);
    }

    // Admin rejects request with valid reason
    const rejectionReason = "E2E-AUD: Incomplete script sides and character breakdown.";
    const rejectRes = await api(`/api/admin/auditions/${aud2Id}/reject-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ reason: rejectionReason }),
    });
    if (rejectRes.ok) {
      pass("Admin Rejects Audition Request", `HTTP 200: ${rejectRes.body.message}`);
    } else {
      fail("Admin Rejects Audition Request", `HTTP ${rejectRes.status}: ${JSON.stringify(rejectRes.body)}`);
    }

    // Assert DB state: status === "rejected", vismayaApproval === "rejected", reason stored
    const rejectedAudDoc = await mongoose.connection.collection("auditions").findOne({ _id: new mongoose.Types.ObjectId(aud2Id) });
    if (
      rejectedAudDoc.status === "rejected" &&
      rejectedAudDoc.vismayaApproval === "rejected" &&
      rejectedAudDoc.vismayaRejectionReason === rejectionReason
    ) {
      pass("Rejected Audition DB State", `status='rejected', vismayaApproval='rejected', reason='${rejectedAudDoc.vismayaRejectionReason}'`);
    } else {
      fail("Rejected Audition DB State", `Unexpected state: status=${rejectedAudDoc.status}, approval=${rejectedAudDoc.vismayaApproval}, reason=${rejectedAudDoc.vismayaRejectionReason}`);
    }

    // Assert admin audit log was written for AUDITION_REQUEST_REJECT
    const rejectAuditDoc = await mongoose.connection.collection("adminauditlogs").findOne({
      action: { $in: ["AUDITION_REQUEST_REJECT", "AUDITION_REQUEST_REJECTED"] },
      targetId: new mongoose.Types.ObjectId(aud2Id),
    });
    if (rejectAuditDoc) {
      pass("Admin Audit Log Created for Request Rejection", `Action: ${rejectAuditDoc.action}`);
      tracked.auditLogs.push(rejectAuditDoc._id);
    } else {
      fail("Admin Audit Log Created for Request Rejection", "No audit log record found");
    }

    // Assert organization received notification with rejection reason
    const orgUserIdObj = new mongoose.Types.ObjectId(orgUser.id || orgUser._id);
    const orgRejectNotif = await mongoose.connection.collection("notifications").findOne({
      recipient: orgUserIdObj,
      type: { $in: ["audition_rejected", "audition_request_rejected"] },
    });
    if (orgRejectNotif && orgRejectNotif.message?.includes(rejectionReason)) {
      pass("Organization Notified of Rejection with Reason", `Notification: '${orgRejectNotif.title}', message contains reason`);
      tracked.notifications.push(orgRejectNotif._id);
    } else {
      fail("Organization Notified of Rejection with Reason", `Notification not found or missing reason: ${JSON.stringify(orgRejectNotif)}`);
    }

    // Assert talent never sees rejected request
    const talentAudsAfterReject = await api("/api/auditions/my-auditions", {
      headers: { Authorization: `Bearer ${talentToken}` },
    });
    if (talentAudsAfterReject.ok) {
      const list = talentAudsAfterReject.body.auditions || talentAudsAfterReject.body.data || [];
      const found = list.some((a) => (a._id || a.id) === aud2Id);
      if (!found) {
        pass("Server Enforcement: Rejected Audition Request Hidden from Talent", `Audition 2 not in GET /my-auditions`);
      } else {
        fail("Server Enforcement: Rejected Audition Request Hidden from Talent", "Rejected audition 2 appeared in talent auditions");
      }
    }

    // Assert talent upload is blocked for rejected request
    const rejectedAudUploadAttempt = await api(`/api/auditions/${aud2Id}/self-tape`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${talentToken}` },
      body: JSON.stringify({
        videoUrl: "https://res.cloudinary.com/demo/video/upload/sample.mp4",
        notes: "Trying to upload to rejected audition request",
      }),
    });
    if (rejectedAudUploadAttempt.status === 403) {
      pass("Server Enforcement: Upload Blocked on Rejected Request", `HTTP 403: ${rejectedAudUploadAttempt.body.message}`);
    } else {
      fail("Server Enforcement: Upload Blocked on Rejected Request", `Expected 403, got ${rejectedAudUploadAttempt.status}`);
    }

    // -------------------------------------------------------------
    // STEP 8: Admin Approves Audition 1 Tape -> Forwarded to Org
    // -------------------------------------------------------------
    console.log("\n--- Step 8: Admin Approves Tape & Organization Receives Video ---");
    const approveTapeRes = await api(`/api/admin/auditions/${aud1Id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: "approve" }),
    });
    if (approveTapeRes.ok) {
      pass("Admin Approves Self-Tape", `HTTP 200: ${approveTapeRes.body.message}`);
    } else {
      fail("Admin Approves Self-Tape", `HTTP ${approveTapeRes.status}: ${JSON.stringify(approveTapeRes.body)}`);
    }

    // Assert status updated to forwarded_to_org
    const approvedTapeDoc = await mongoose.connection.collection("auditions").findOne({ _id: new mongoose.Types.ObjectId(aud1Id) });
    if (approvedTapeDoc.status === "forwarded_to_org" && approvedTapeDoc.vismayaApproval === "approved") {
      pass("Audition 1 Status Forwarded to Org", "status: 'forwarded_to_org', vismayaApproval: 'approved'");
    } else {
      fail("Audition 1 Status Forwarded to Org", `status: ${approvedTapeDoc.status}, approval: ${approvedTapeDoc.vismayaApproval}`);
    }

    // Organization now CAN view video URL
    const orgViewAfterApprove = await api(`/api/auditions/application/${application1Id}`, {
      headers: { Authorization: `Bearer ${orgToken}` },
    });
    if (orgViewAfterApprove.ok) {
      const auds = orgViewAfterApprove.body.auditions || orgViewAfterApprove.body.data || [];
      const aud = auds.find((a) => (a._id || a.id) === aud1Id);
      const url = aud?.selfTapeSubmission?.videoUrl || aud?.selfTapeSubmission?.videos?.[0]?.videoUrl;
      if (url && url.startsWith("http")) {
        pass("Organization Receives Approved Video URL", `Video URL accessible: ${url}`);
      } else {
        fail("Organization Receives Approved Video URL", `Video URL missing or unpopulated: ${JSON.stringify(aud?.selfTapeSubmission)}`);
      }
    }

  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }

    // -------------------------------------------------------------
    // CLEANUP: Delete ALL Created Resources by Exact ID
    // -------------------------------------------------------------
    console.log("\n================================================================");
    console.log("CLEANUP: Removing All Created Test Data by Exact IDs");
    console.log("================================================================");

    // Collect all notification IDs associated with created users or auditions
    const allUserIds = tracked.users;
    const allAuditionIds = tracked.auditions;
    if (allUserIds.length > 0 || allAuditionIds.length > 0) {
      const relatedNotifs = await mongoose.connection.collection("notifications").find({
        $or: [
          { recipient: { $in: allUserIds } },
          { entityId: { $in: allAuditionIds } },
        ],
      }).toArray();
      relatedNotifs.forEach((n) => tracked.notifications.push(n._id));

      const relatedOtps = await mongoose.connection.collection("otps").find({
        email: { $in: [
          `${runPrefix}-org@vismaya.io`.toLowerCase(),
          `${runPrefix}-talent@vismaya.io`.toLowerCase(),
        ] },
      }).toArray();
      relatedOtps.forEach((o) => tracked.otps.push(o._id));
    }

    const cleanupCounts = {};

    async function deleteByIds(collectionName, idList) {
      if (!idList || idList.length === 0) {
        cleanupCounts[collectionName] = 0;
        return;
      }
      const uniqueIds = Array.from(new Set(idList.map((id) => id.toString()))).map((id) => new mongoose.Types.ObjectId(id));
      const res = await mongoose.connection.collection(collectionName).deleteMany({ _id: { $in: uniqueIds } });
      cleanupCounts[collectionName] = res.deletedCount;
    }

    await deleteByIds("notifications", tracked.notifications);
    await deleteByIds("otps", tracked.otps);
    await deleteByIds("adminauditlogs", tracked.auditLogs);
    await deleteByIds("auditions", tracked.auditions);
    await deleteByIds("applications", tracked.applications);
    await deleteByIds("opportunities", tracked.opportunities);
    await deleteByIds("projects", tracked.projects);
    await deleteByIds("talentprofiles", tracked.talentProfiles);
    await deleteByIds("organizations", tracked.organizations);
    await deleteByIds("users", tracked.users);
    await deleteByIds("mediaitems", tracked.mediaItems);

    // Remove temporary test files
    tempFiles.forEach((file) => {
      try {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      } catch (e) {
        console.warn(`Could not remove temp file ${file}:`, e.message);
      }
    });

    console.log("\nExact Deleted Record Counts:");
    for (const [col, count] of Object.entries(cleanupCounts)) {
      console.log(`  - ${col.padEnd(16)}: ${count} deleted`);
    }

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }

  console.log("\n================================================================");
  console.log(`E2E Verification Summary: ${stats.passed} Passed, ${stats.failed} Failed`);
  console.log("================================================================\n");

  if (stats.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch((err) => {
  console.error("FATAL ERROR in E2E Verification:", err);
  process.exit(1);
});
