import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("../../frontend/node_modules/playwright");
import mongoose from "../../backend/node_modules/mongoose/index.js";
import bcrypt from "../../backend/node_modules/bcrypt/bcrypt.js";
import jwt from "../../backend/node_modules/jsonwebtoken/index.js";
import {
  connectDB,
  baseUrl,
  frontendUrl,
  adminEmail,
  adminPassword,
  defaultPassword,
  apiRequest,
  jsonPost,
  authGet,
  getAdminToken,
} from "./audit_helper.mjs";

const PREFIX = "E2E-OPPAPPR";
const runTimestamp = Date.now();

const tracked = {
  users: [],
  profiles: [],
  orgs: [],
  projects: [],
  opps: [],
  apps: [],
  notifications: [],
  sessions: [],
  auditLogs: [],
};

async function createAuthenticatedUser(db, { role, name, isPaid = false }) {
  const uId = new mongoose.Types.ObjectId();
  const email = `${PREFIX.toLowerCase()}-${role}-${runTimestamp}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  const hash = await bcrypt.hash(defaultPassword, 10);
  const now = new Date();

  const userDoc = {
    _id: uId,
    name,
    email,
    mobile: `+9193${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: hash,
    role,
    status: "active",
    isEmailVerified: true,
    isPaid: Boolean(isPaid),
    emailNotificationsEnabled: true,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection("users").insertOne(userDoc);
  tracked.users.push(uId);

  const sessionId = new mongoose.Types.ObjectId().toString();
  await db.collection("sessions").insertOne({
    userId: uId,
    sessionId,
    ipAddress: "127.0.0.1",
    userAgent: "playwright-test/opp-appr",
    isValid: true,
    expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
    createdAt: now,
    updatedAt: now,
  });
  tracked.sessions.push(sessionId);

  const token = jwt.sign(
    {
      userId: uId.toString(),
      role,
      email,
      isPaid: Boolean(isPaid),
      sessionId,
    },
    process.env.JWT_SECRET,
    { expiresIn: "4h" }
  );

  return { user: userDoc, token, sessionId };
}

async function injectSession(page, user, token, role) {
  await page.goto(`${frontendUrl}/login`, { waitUntil: "networkidle" });
  await page.evaluate(
    ({ t, u, r }) => {
      localStorage.setItem("vismaya_auth_token", t);
      localStorage.setItem("vismaya_user_data", JSON.stringify(u));
      localStorage.setItem("vismaya_user_role", r);
    },
    {
      t: token,
      u: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isPaid: user.isPaid,
      },
      r: role,
    }
  );
}

async function run() {
  console.log(`\n================================================================`);
  console.log(`RUNNING E2E TEST: Opportunity Approval Flow (${PREFIX})`);
  console.log(`================================================================\n`);

  const db = await connectDB();

  // Pre-test cleanup of any previous test run artifacts
  await db.collection("users").deleteMany({ email: { $regex: PREFIX, $options: "i" } });
  await db.collection("organizations").deleteMany({ organizationName: { $regex: PREFIX, $options: "i" } });
  await db.collection("projects").deleteMany({ projectName: { $regex: PREFIX, $options: "i" } });
  await db.collection("opportunities").deleteMany({ title: { $regex: PREFIX, $options: "i" } });
  await db.collection("talentprofiles").deleteMany({ vismayaId: { $regex: `VIS-${PREFIX.slice(0, 4)}`, $options: "i" } });

  // 0. Verify initial 9 orphan profiles
  const initialProfiles = await db.collection("talentprofiles").find({}).toArray();
  const initialUserIds = new Set((await db.collection("users").find({}).toArray()).map((u) => u._id.toString()));
  const initialOrphans = initialProfiles.filter((p) => !initialUserIds.has(p.userId?.toString()));
  console.log(`Initial orphan profiles count: ${initialOrphans.length} (expected: 9)`);
  if (initialOrphans.length !== 9) {
    console.warn(`Warning: expected exactly 9 orphan profiles, found ${initialOrphans.length}`);
  }

  // 1. Create Organization & Project
  console.log("\n1. Creating test Organization & Project...");
  const orgAuth = await createAuthenticatedUser(db, {
    role: "organization",
    name: `${PREFIX} Premier Productions`,
    isPaid: true,
  });

  const orgDoc = {
    _id: new mongoose.Types.ObjectId(),
    userId: orgAuth.user._id,
    organizationName: `${PREFIX} Premier Productions`,
    contactPerson: "Rajesh Sharma",
    contactEmail: orgAuth.user.email,
    contactNumber: orgAuth.user.mobile,
    status: "approved",
    isPaid: true,
    verificationStatus: "verified",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.collection("organizations").insertOne(orgDoc);
  tracked.orgs.push(orgDoc._id);

  // Project creation (defaults to status: "active", no approval required)
  const projDoc = {
    _id: new mongoose.Types.ObjectId(),
    organizationId: orgDoc._id,
    projectName: `${PREFIX} Bollywood Epic 2026`,
    description: "Main commercial feature film project.",
    projectType: "Feature Film",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.collection("projects").insertOne(projDoc);
  tracked.projects.push(projDoc._id);
  console.log(`✓ Project created with status: "${projDoc.status}" (ID: ${projDoc._id})`);

  // 2. Org creates 2 Opportunities
  console.log("\n2. Org creating Opportunities 1 and 2 via API...");
  const opp1Res = await apiRequest("Create Opportunity 1", "/api/opportunities", jsonPost({
    projectId: projDoc._id.toString(),
    title: `${PREFIX} Lead Protagonist Role`,
    summary: "Seeking a lead dramatic actor for high intensity dialogue and emotional scenes.",
    role: "Lead Actor",
    location: "Mumbai",
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    remuneration: "₹85,000 / day",
    positionsCount: 1,
    eligibility: {
      professions: ["Actor"],
      languages: ["Hindi"],
      minExperienceYears: 0,
    },
  }, orgAuth.token));

  if (opp1Res.status !== 201) {
    throw new Error(`Failed to create Opportunity 1: HTTP ${opp1Res.status} ${JSON.stringify(opp1Res.body)}`);
  }
  const opp1Id = new mongoose.Types.ObjectId(opp1Res.body.opportunity?._id || opp1Res.body.opportunity?.id);
  tracked.opps.push(opp1Id);
  console.log(`✓ Opportunity 1 created: "${opp1Res.body.opportunity.title}" (Status: ${opp1Res.body.opportunity.status}, ID: ${opp1Id})`);

  const opp2Res = await apiRequest("Create Opportunity 2", "/api/opportunities", jsonPost({
    projectId: projDoc._id.toString(),
    title: `${PREFIX} Background Supporting Extra`,
    summary: "Background courtroom crowd and dialogue reaction extra roles.",
    role: "Supporting Extra",
    location: "Delhi",
    deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    remuneration: "₹5,000 / day",
    positionsCount: 5,
    eligibility: {
      professions: ["Actor"],
      languages: ["Hindi"],
      minExperienceYears: 0,
    },
  }, orgAuth.token));

  if (opp2Res.status !== 201) {
    throw new Error(`Failed to create Opportunity 2: HTTP ${opp2Res.status} ${JSON.stringify(opp2Res.body)}`);
  }
  const opp2Id = new mongoose.Types.ObjectId(opp2Res.body.opportunity?._id || opp2Res.body.opportunity?.id);
  tracked.opps.push(opp2Id);
  console.log(`✓ Opportunity 2 created: "${opp2Res.body.opportunity.title}" (Status: ${opp2Res.body.opportunity.status}, ID: ${opp2Id})`);

  // 3. Create Paid Talent Profile
  console.log("\n3. Creating verified Paid Talent...");
  const talentAuth = await createAuthenticatedUser(db, {
    role: "talent",
    name: `${PREFIX} Verified Performer`,
    isPaid: true,
  });

  const talentProfileDoc = {
    _id: new mongoose.Types.ObjectId(),
    userId: talentAuth.user._id,
    vismayaId: `VIS-${PREFIX.slice(0, 4)}${Date.now().toString().slice(-4)}`,
    category: "open_talent",
    primaryProfession: "Actor",
    currentCity: "Mumbai",
    workingCities: ["Mumbai", "Delhi"],
    languages: [{ language: "Hindi", proficiency: "fluent" }],
    skills: [{ name: "Method Acting", proficiency: "expert" }],
    isPaid: true,
    isProfileApproved: true,
    status: "approved",
    profileCompletionPercentage: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.collection("talentprofiles").insertOne(talentProfileDoc);
  tracked.profiles.push(talentProfileDoc._id);
  console.log(`✓ Paid Talent created (User ID: ${talentAuth.user._id}, Profile ID: ${talentProfileDoc._id})`);

  // 4. Verify Talent side BEFORE approval
  console.log("\n4. Verifying Talent Explore Feed & Apply before Admin approval...");
  const pubFeedBefore = await apiRequest("Get Published Opportunities (Before)", "/api/opportunities/published", authGet(talentAuth.token));
  const oppsListBefore = pubFeedBefore.body?.opportunities || (Array.isArray(pubFeedBefore.body) ? pubFeedBefore.body : []);
  const foundOpp1Before = oppsListBefore.find((o) => (o._id || o.id) === opp1Id.toString());
  const foundOpp2Before = oppsListBefore.find((o) => (o._id || o.id) === opp2Id.toString());

  console.log(`- Opp 1 in published feed before approval: ${Boolean(foundOpp1Before)} (expected: false)`);
  console.log(`- Opp 2 in published feed before approval: ${Boolean(foundOpp2Before)} (expected: false)`);
  if (foundOpp1Before || foundOpp2Before) {
    throw new Error("FAIL: Non-published opportunities were visible in the talent explore feed!");
  }

  // Talent attempts to apply to Opp 1 before approval -> expect 400
  const applyBefore = await apiRequest("Apply to Pending Opp 1", `/api/applications/${opp1Id}/apply`, jsonPost({
    consentGiven: true,
    coverNote: "Application to pending opportunity should be rejected",
  }, talentAuth.token));

  console.log(`- Apply to pending Opp 1 status: HTTP ${applyBefore.status} (expected: 400)`);
  console.log(`- Apply response message: "${applyBefore.body?.message}"`);
  if (applyBefore.status < 400 || applyBefore.status >= 500) {
    throw new Error(`FAIL: Expected 4xx status when applying to non-published opportunity, got ${applyBefore.status}`);
  }
  console.log("✓ Correctly rejected application to pending opportunity with 4xx.");

  // 5. Admin Approves Opportunity 1 via Playwright UI
  console.log("\n5. Launching Playwright to test Admin UI approval...");
  const adminToken = await getAdminToken();
  const adminUser = await db.collection("users").findOne({ role: "admin", status: "active" });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Inject admin session
  await injectSession(page, adminUser, adminToken, "admin");

  console.log("Navigating to /admin/opportunity-review...");
  await page.goto(`${frontendUrl}/admin/opportunity-review`, { waitUntil: "networkidle", timeout: 20000 });

  // Wait for list items to render
  await page.waitForSelector(".opp-review-card, .opp-card, .opp-item, div:has-text('Lead Protagonist Role')", { timeout: 15000 });

  // Click on Opportunity 1
  console.log(`Selecting Opportunity 1 ("${PREFIX} Lead Protagonist Role") in UI...`);
  const opp1Card = page.locator(`text="${PREFIX} Lead Protagonist Role"`).first();
  await opp1Card.click();
  await page.waitForTimeout(600);

  // Assert Approve & Publish button is rendered and visible
  const approveBtn = page.locator('button:has-text("Approve & Publish")').first();
  await approveBtn.waitFor({ state: "visible", timeout: 10000 });
  console.log("✓ 'Approve & Publish' button is visible for pending opportunity in /admin/opportunity-review!");

  // Click Approve & Publish
  await approveBtn.click();
  console.log("Clicked 'Approve & Publish', waiting for confirmation modal...");

  // Modal confirmation
  const confirmPublishBtn = page.locator('button:has-text("Confirm & Publish Live")').first();
  await confirmPublishBtn.waitFor({ state: "visible", timeout: 8000 });
  await confirmPublishBtn.click();
  console.log("Clicked 'Confirm & Publish Live'. Waiting for processing...");

  // Wait for modal to close and state to update
  await page.waitForTimeout(2000);

  // Verify status in MongoDB
  const opp1InDb = await db.collection("opportunities").findOne({ _id: opp1Id });
  console.log(`✓ Opportunity 1 status in DB after UI approval: "${opp1InDb?.status}" (expected: "published")`);
  if (opp1InDb?.status !== "published") {
    throw new Error(`FAIL: Opportunity 1 status is ${opp1InDb?.status}, expected "published"`);
  }

  // 6. Verify Talent Explore Feed & Apply on Opportunity 1
  console.log("\n6. Verifying Talent Explore Feed & Application on approved Opportunity 1...");
  const pubFeedAfter = await apiRequest("Get Published Opportunities (After)", "/api/opportunities/published", authGet(talentAuth.token));
  const oppsListAfter = pubFeedAfter.body?.opportunities || (Array.isArray(pubFeedAfter.body) ? pubFeedAfter.body : []);
  const foundOpp1After = oppsListAfter.find((o) => (o._id || o.id) === opp1Id.toString());
  const foundOpp2After = oppsListAfter.find((o) => (o._id || o.id) === opp2Id.toString());

  console.log(`- Opp 1 in published feed after approval: ${Boolean(foundOpp1After)} (expected: true)`);
  console.log(`- Opp 2 in published feed: ${Boolean(foundOpp2Before)} (expected: false)`);
  if (!foundOpp1After) {
    throw new Error("FAIL: Approved opportunity 1 did not appear in talent published feed!");
  }
  if (foundOpp2After) {
    throw new Error("FAIL: Non-approved opportunity 2 appeared in talent published feed!");
  }
  console.log("✓ Talent explore feed correctly displays only approved opportunity 1.");

  // Talent applies to approved Opportunity 1 -> expect 201 Success
  const applyAfter = await apiRequest("Apply to Approved Opp 1", `/api/applications/${opp1Id}/apply`, jsonPost({
    consentGiven: true,
    coverNote: "I have prepared the monologue and looking forward to auditioning.",
  }, talentAuth.token));

  console.log(`- Apply to approved Opp 1 status: HTTP ${applyAfter.status} (expected: 201)`);
  if (applyAfter.status !== 201) {
    throw new Error(`FAIL: Apply to approved opportunity failed: HTTP ${applyAfter.status} ${JSON.stringify(applyAfter.body)}`);
  }
  const appId = new mongoose.Types.ObjectId(applyAfter.body.application?._id || applyAfter.body.application?.id);
  tracked.apps.push(appId);
  console.log(`✓ Application submitted successfully! (ID: ${appId})`);

  // 7. Admin Rejects Opportunity 2 via Drawer in /admin/opportunities
  console.log("\n7. Admin navigating to /admin/opportunities to reject Opportunity 2 via Detail Drawer...");
  await page.goto(`${frontendUrl}/admin/opportunities`, { waitUntil: "networkidle", timeout: 20000 });

  // Locate Opportunity 2 row
  await page.waitForSelector(`text="${PREFIX} Background Supporting Extra"`, { timeout: 15000 });
  console.log(`Found Opportunity 2 in table. Opening Details modal...`);

  // Click Details button in that row
  const opp2Row = page.locator("tr", { has: page.locator(`text="${PREFIX} Background Supporting Extra"`) }).first();
  const detailsBtn = opp2Row.locator('button:has-text("Details")').first();
  await detailsBtn.click();

  // Wait for details modal
  await page.waitForSelector('.modal-dialog-panel h3:has-text("Opportunity Details")', { timeout: 10000 });
  console.log("✓ Opportunity Details drawer modal opened.");

  // Verify Reject Submission button is visible
  const rejectSubBtn = page.locator('.modal-dialog-panel button:has-text("Reject Submission")').first();
  await rejectSubBtn.waitFor({ state: "visible", timeout: 8000 });
  console.log("✓ 'Reject Submission' button is visible in details modal!");

  await rejectSubBtn.click();
  console.log("Clicked 'Reject Submission'. Filling rejection reason...");

  // Fill rejection reason (min 10 chars)
  const rejectionReasonText = "Compliance guideline violation: Incomplete cast remuneration terms and requirements.";
  const reasonTextarea = page.locator('textarea[placeholder*="Specify why this opportunity submission cannot be published"]').first();
  await reasonTextarea.waitFor({ state: "visible", timeout: 5000 });
  await reasonTextarea.fill(rejectionReasonText);

  // Click Confirm Rejection
  const confirmRejectBtn = page.locator('button:has-text("Confirm Rejection")').first();
  await confirmRejectBtn.click();
  console.log("Clicked 'Confirm Rejection'. Waiting for processing...");

  await page.waitForTimeout(2000);

  // 8. Assert Rejection outcome
  console.log("\n8. Verifying Rejection outcome in DB, Talent Feed, and Org View...");
  const opp2InDb = await db.collection("opportunities").findOne({ _id: opp2Id });
  console.log(`- Opportunity 2 status in DB: "${opp2InDb?.status}" (expected: "rejected")`);
  console.log(`- Opportunity 2 stored rejectionReason: "${opp2InDb?.rejectionReason}"`);
  if (opp2InDb?.status !== "rejected") {
    throw new Error(`FAIL: Opportunity 2 status is ${opp2InDb?.status}, expected "rejected"`);
  }
  if (!opp2InDb?.rejectionReason?.includes("Compliance guideline violation")) {
    throw new Error("FAIL: Rejection reason was not properly stored in DB!");
  }

  // Talent explore feed must NEVER show Opportunity 2
  const pubFeedFinal = await apiRequest("Get Published Opportunities (Final)", "/api/opportunities/published", authGet(talentAuth.token));
  const oppsListFinal = pubFeedFinal.body?.opportunities || (Array.isArray(pubFeedFinal.body) ? pubFeedFinal.body : []);
  const foundOpp2Final = oppsListFinal.find((o) => (o._id || o.id) === opp2Id.toString());
  console.log(`- Opp 2 in talent published feed after rejection: ${Boolean(foundOpp2Final)} (expected: false)`);
  if (foundOpp2Final) {
    throw new Error("FAIL: Rejected opportunity appeared in talent feed!");
  }

  // Org notifications: verify notification was created for org user
  const orgNotif = await db.collection("notifications").findOne({
    recipient: orgAuth.user._id,
    type: "opportunity_rejected",
    title: "Opportunity Rejected",
  });
  console.log(`- Org notification received: ${Boolean(orgNotif)}`);
  if (orgNotif) {
    console.log(`  Notification message: "${orgNotif.message}"`);
  }
  if (!orgNotif) {
    throw new Error("FAIL: Organization did not receive a rejection notification!");
  }

  // Org views their opportunity: rejection reason is visible
  const orgOppView = await apiRequest("Org View Opp 2", `/api/opportunities/${opp2Id}`, authGet(orgAuth.token));
  console.log(`- Org retrieves Opp 2: status="${orgOppView.body?.opportunity?.status}", rejectionReason="${orgOppView.body?.opportunity?.rejectionReason}"`);
  if (orgOppView.body?.opportunity?.status !== "rejected" && orgOppView.body?.opportunity?.displayStatus !== "rejected") {
    console.warn("Notice: Org view status check:", orgOppView.body?.opportunity?.status);
  }

  await browser.close();

  // 9. Cleanup routine
  console.log(`\n9. Performing cleanup for ${PREFIX} test artifacts...`);
  const delUsers = await db.collection("users").deleteMany({ _id: { $in: tracked.users } });
  const delProfiles = await db.collection("talentprofiles").deleteMany({ _id: { $in: tracked.profiles } });
  const delOrgs = await db.collection("organizations").deleteMany({ _id: { $in: tracked.orgs } });
  const delProjects = await db.collection("projects").deleteMany({ _id: { $in: tracked.projects } });
  const delOpps = await db.collection("opportunities").deleteMany({ _id: { $in: tracked.opps } });
  const delApps = await db.collection("applications").deleteMany({ _id: { $in: tracked.apps } });
  const delSessions = await db.collection("sessions").deleteMany({ sessionId: { $in: tracked.sessions } });
  const delNotifs = await db.collection("notifications").deleteMany({
    $or: [
      { recipient: { $in: tracked.users } },
      { referenceId: { $in: tracked.opps } },
    ],
  });
  const delAudit = await db.collection("adminauditlogs").deleteMany({
    targetId: { $in: tracked.opps },
  });

  console.log("\nCleanup Summary:");
  console.log(`  Users deleted:         ${delUsers.deletedCount}`);
  console.log(`  Profiles deleted:      ${delProfiles.deletedCount}`);
  console.log(`  Organizations deleted: ${delOrgs.deletedCount}`);
  console.log(`  Projects deleted:      ${delProjects.deletedCount}`);
  console.log(`  Opportunities deleted: ${delOpps.deletedCount}`);
  console.log(`  Applications deleted:  ${delApps.deletedCount}`);
  console.log(`  Sessions deleted:      ${delSessions.deletedCount}`);
  console.log(`  Notifications deleted: ${delNotifs.deletedCount}`);
  console.log(`  Audit logs deleted:    ${delAudit.deletedCount}`);

  // Assert 9 orphan profiles are untouched
  const finalProfiles = await db.collection("talentprofiles").find({}).toArray();
  const finalUserIds = new Set((await db.collection("users").find({}).toArray()).map((u) => u._id.toString()));
  const finalOrphans = finalProfiles.filter((p) => !finalUserIds.has(p.userId?.toString()));
  console.log(`\nFinal orphan profiles count: ${finalOrphans.length} (expected: 9)`);
  if (finalOrphans.length !== 9) {
    throw new Error(`FAIL: Orphan profiles count changed from 9 to ${finalOrphans.length}!`);
  }
  console.log("✓ All 9 orphan profiles remained completely untouched.");

  console.log(`\n================================================================`);
  console.log(`SUCCESS: Opportunity Approval Flow E2E test passed cleanly!`);
  console.log(`================================================================\n`);

  process.exit(0);
}

run().catch((err) => {
  console.error("FATAL ERROR in test_opp_approval_flow:", err);
  process.exit(1);
});
