import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("../../frontend/node_modules/playwright");
import mongoose from "../../backend/node_modules/mongoose/index.js";
import bcrypt from "../../backend/node_modules/bcrypt/bcrypt.js";
import jwt from "../../backend/node_modules/jsonwebtoken/index.js";
import {
  connectDB,
  frontendUrl,
  defaultPassword,
  apiRequest,
  jsonPost,
} from "./audit_helper.mjs";

const PREFIX = "E2E-APPLYGATE";
const runTimestamp = Date.now();

const tracked = {
  users: [],
  profiles: [],
  orgs: [],
  projects: [],
  opps: [],
  apps: [],
  sessions: [],
  notifications: [],
  auditLogs: [],
  orders: [],
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
    userAgent: "playwright-test/applygate",
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

async function createTalentWithProfile(db, { name, dob, isPaid = false, completionTier = "full" }) {
  console.log(`\nCreating talent ${name} via API (isPaid: ${isPaid}, tier: ${completionTier})...`);
  const auth = await createAuthenticatedUser(db, {
    role: "talent",
    name,
    isPaid,
  });

  let profilePayload;
  if (completionTier === "full") {
    profilePayload = {
      stageName: name,
      firstName: name.split(" ")[0],
      lastName: name.split(" ")[1] || "Artist",
      dob: dob || "1999-04-15",
      gender: "male",
      nationality: "Indian",
      category: "open_talent",
      primaryProfession: "Actors",
      currentCity: "Mumbai",
      currentState: "Maharashtra",
      country: "India",
      workingCities: ["Mumbai", "Delhi"],
      willingToTravel: true,
      bio: "Professional film and theater actor with extensive experience in method acting, screen appearances, monologue delivery, dramatic presence, voice modulation, and emotional depth in contemporary Indian cinema and international stage productions across Mumbai and Delhi.",
      skills: ["Method Acting", "Monologue Delivery", "Voice Modulation"],
      languages: ["Hindi", "English"],
      profilePhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
      portfolio: {
        photos: ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"],
        showreelUrl: "https://www.youtube.com/watch?v=sample"
      },
      credits: [{
        projectTitle: `${PREFIX} Indie Showcase`,
        roleOrDesignation: "Lead Protagonist",
        year: 2024,
        directorOrProduction: "Arun Films"
      }],
      physicalAttributes: {
        heightCm: 178,
        bodyType: "Athletic",
        eyeColor: "Brown",
        hairColor: "Black"
      }
    };
  } else {
    // Minimal profile: <60% completion
    profilePayload = {
      stageName: name,
      firstName: name.split(" ")[0],
      category: "open_talent",
      currentCity: "Mumbai",
    };
  }

  // Save profile through the real backend API: status naturally becomes 'pending'
  const profRes = await apiRequest("Save Profile via API", "/api/talent/profile", jsonPost(profilePayload, auth.token));
  if (profRes.status !== 200 && profRes.status !== 201) {
    throw new Error(`Profile creation failed: HTTP ${profRes.status} ${JSON.stringify(profRes.body)}`);
  }

  const profile = profRes.body.profile || profRes.body.data;
  const profileId = new mongoose.Types.ObjectId(profile._id || profile.id);
  tracked.profiles.push(profileId);
  console.log(`✓ Profile created via API (ID: ${profileId}, Status: ${profile.status}, Completion: ${profile.profileCompletionPercentage}%)`);

  return { user: auth.user, token: auth.token, profile };
}

async function injectSession(page, user, token, role) {
  await page.goto(`${frontendUrl}/login`, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ t, u, r }) => {
      localStorage.clear();
      localStorage.setItem("vismaya_auth_token", t);
      localStorage.setItem("vismaya_user_data", JSON.stringify(u));
      localStorage.setItem("vismaya_user_role", r);
    },
    {
      t: token,
      u: {
        id: user._id?.toString() || user.id,
        _id: user._id?.toString() || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isPaid: Boolean(user.isPaid),
      },
      r: role,
    }
  );
}

async function run() {
  console.log(`\n================================================================`);
  console.log(`RUNNING E2E TEST: Apply Gates & Talent Directory (${PREFIX})`);
  console.log(`================================================================\n`);

  const db = await connectDB();

  // Pre-test cleanup of any previous test run artifacts
  await db.collection("users").deleteMany({ email: { $regex: PREFIX, $options: "i" } });
  await db.collection("organizations").deleteMany({ organizationName: { $regex: PREFIX, $options: "i" } });
  await db.collection("projects").deleteMany({ projectName: { $regex: PREFIX, $options: "i" } });
  await db.collection("opportunities").deleteMany({ title: { $regex: PREFIX, $options: "i" } });
  await db.collection("talentprofiles").deleteMany({ stageName: { $regex: PREFIX, $options: "i" } });

  // 0. Verify initial 9 orphan profiles
  const initialProfiles = await db.collection("talentprofiles").find({}).toArray();
  const initialUserIds = new Set((await db.collection("users").find({}).toArray()).map((u) => u._id.toString()));
  const initialOrphans = initialProfiles.filter((p) => !initialUserIds.has(p.userId?.toString()));
  console.log(`Initial orphan profiles count: ${initialOrphans.length} (expected: 9)`);
  if (initialOrphans.length !== 9) {
    console.warn(`Warning: expected exactly 9 orphan profiles, found ${initialOrphans.length}`);
  }

  // 1. Setup Organization, Project & Published Opportunity via API
  console.log("\n1. Setting up Organization, Project & Published Opportunity via API...");
  const orgAuth = await createAuthenticatedUser(db, {
    role: "organization",
    name: `${PREFIX} Casting House`,
    isPaid: true,
  });

  const orgDoc = {
    _id: new mongoose.Types.ObjectId(),
    userId: orgAuth.user._id,
    organizationName: `${PREFIX} Casting House`,
    contactPerson: "Kavita Rao",
    contactEmail: orgAuth.user.email,
    status: "approved",
    isPaid: true,
    verificationStatus: "verified",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.collection("organizations").insertOne(orgDoc);
  tracked.orgs.push(orgDoc._id);

  const projDoc = {
    _id: new mongoose.Types.ObjectId(),
    organizationId: orgDoc._id,
    projectName: `${PREFIX} Feature Film 2026`,
    description: "Major cinema project",
    projectType: "Feature Film",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.collection("projects").insertOne(projDoc);
  tracked.projects.push(projDoc._id);

  // Create Opportunity via API
  const oppRes = await apiRequest("Create Opportunity", "/api/opportunities", jsonPost({
    projectId: projDoc._id.toString(),
    title: `${PREFIX} Lead Character`,
    summary: "Seeking a versatile male actor for central protagonist role.",
    role: "Lead Actor",
    location: "Mumbai",
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    remuneration: "₹75,000 / day",
    positionsCount: 1,
    eligibility: { professions: ["Actors"], languages: ["Hindi"], minExperienceYears: 0 },
  }, orgAuth.token));

  const oppId = new mongoose.Types.ObjectId(oppRes.body.opportunity?._id || oppRes.body.opportunity?.id);
  tracked.opps.push(oppId);

  // Create authenticated Admin user to approve Opportunity via API
  const adminAuth = await createAuthenticatedUser(db, {
    role: "admin",
    name: `${PREFIX} System Admin`,
    isPaid: true,
  });

  const oppApproveRes = await apiRequest("Approve Opportunity", `/api/admin/opportunities/${oppId}/approve`, jsonPost({
    status: "published"
  }, adminAuth.token));
  if (!oppApproveRes.success) {
    throw new Error(`Opportunity approval failed: ${JSON.stringify(oppApproveRes.body)}`);
  }
  console.log(`✓ Opportunity created and published via API (ID: ${oppId})`);

  // 2. Create Talent 1: Pending profile, paid, completion >= 60%
  const talent1 = await createTalentWithProfile(db, {
    name: `${PREFIX} Pending Performer`,
    dob: "1999-04-15", // Age 27
    isPaid: true,
    completionTier: "full",
  });

  // Launch Playwright Browser
  console.log("\n2. Launching Playwright browser in real mode...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Track console warnings/errors
  const consoleMessages = [];
  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error" || text.includes("Warning:") || text.includes("<img")) {
      consoleMessages.push({ type: msg.type(), text });
    }
  });

  // -------------------------------------------------------------
  // Test Scenario A: Talent 1 (Pending) sees Approval Required in apply modal
  // -------------------------------------------------------------
  console.log("\n--- Scenario A: Talent 1 (Pending Profile) Apply Gate ---");
  await injectSession(page, talent1.user, talent1.token, "talent");
  await page.goto(`${frontendUrl}/talent/opportunities`, { waitUntil: "networkidle" });

  const oppCard = page.locator(".card-surface").filter({ hasText: `${PREFIX} Lead Character` }).first();
  await oppCard.waitFor({ timeout: 15000 });
  const applyBtn = oppCard.locator(".opp-card-apply-btn, button:has-text('Apply')").first();
  await applyBtn.click();

  // Verify the Confirm Application modal opens
  const modal = page.locator("div[role='dialog']").last();
  await modal.waitFor({ timeout: 10000 });

  // Assert Profile Approval Required is displayed
  const approvalHeader = modal.locator("text=Profile Approval Required");
  await approvalHeader.waitFor({ timeout: 5000 });
  console.log("✓ 'Profile Approval Required' title is present");

  // Assert status text is NOT empty
  const statusBannerText = await modal.locator("text=Your artist profile status is currently").innerText();
  console.log(`✓ Status Banner text: "${statusBannerText.trim()}"`);
  if (!statusBannerText.includes("Pending") && !statusBannerText.includes("Under Review")) {
    throw new Error(`FAIL: Status banner has empty or invalid status text! Found: "${statusBannerText}"`);
  }

  // Assert Confirm button is disabled
  const submitBtn = modal.locator("button:has-text('Confirm & Send Profile')");
  const isDisabled = await submitBtn.isDisabled();
  console.log(`✓ 'Confirm & Send Profile' button is disabled: ${isDisabled}`);
  if (!isDisabled) {
    throw new Error("FAIL: Apply submit button should be disabled for pending profile!");
  }

  // Close the modal
  const cancelBtn = modal.locator("button:has-text('Cancel')").first();
  await cancelBtn.click();
  await page.waitForTimeout(500);

  // -------------------------------------------------------------
  // Test Scenario B: Admin Talent Management (no img error, age, joinedDate, tab counts)
  // -------------------------------------------------------------
  console.log("\n--- Scenario B: Admin Talent Management Inspection & UI Approval ---");
  await injectSession(page, adminAuth.user, adminAuth.token, "admin");

  consoleMessages.length = 0; // Clear console messages before visiting admin page
  await page.goto(`${frontendUrl}/admin/talent-management`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // Assert NO console error about img src=""
  const emptyImgErrors = consoleMessages.filter((m) =>
    m.text.includes("empty string") || m.text.includes("<img src") || (m.type === "error" && m.text.includes("src"))
  );
  console.log(`Console empty img src errors count: ${emptyImgErrors.length}`);
  if (emptyImgErrors.length > 0) {
    console.error("Empty img errors found:", emptyImgErrors);
    throw new Error("FAIL: Admin talent management logged empty string passed to <img src>!");
  }
  console.log("✓ No console error about empty <img src>");

  // Assert Tab counts sum to total in UI
  const tabSumMatch = await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll("button")).filter(b => b.textContent && (b.textContent.includes("Artists") || b.textContent.includes("Pending") || b.textContent.includes("Approved") || b.textContent.includes("Rejected") || b.textContent.includes("Suspended") || b.textContent.includes("Draft")));
    const allTab = tabs.find(t => t.textContent.includes("All Artists"));
    if (!allTab) return null;
    const allMatch = allTab.textContent.match(/\d+/);
    const allCount = allMatch ? parseInt(allMatch[0], 10) : 0;
    
    let sum = 0;
    tabs.forEach(t => {
      if (!t.textContent.includes("All Artists")) {
        const m = t.textContent.match(/\d+/);
        if (m) sum += parseInt(m[0], 10);
      }
    });
    return { allCount, sum, matches: allCount === sum };
  });

  console.log(`✓ Tab Counts check: Total=${tabSumMatch?.allCount}, Sum of status tabs=${tabSumMatch?.sum}, Balanced=${tabSumMatch?.matches}`);
  if (!tabSumMatch || !tabSumMatch.matches) {
    throw new Error(`FAIL: Tab counts do not sum to total! Total: ${tabSumMatch?.allCount}, Sum: ${tabSumMatch?.sum}`);
  }

  // Assert Age / Gender and Joined Date for Talent 1
  const talentRow = page.locator("tr").filter({ hasText: `${PREFIX} Pending Performer` }).first();
  await talentRow.waitFor({ timeout: 10000 });

  const rowText = await talentRow.innerText();
  console.log(`Talent row text preview: ${rowText.replace(/\n+/g, " • ")}`);

  if (!/\d+\s*yrs/i.test(rowText)) {
    throw new Error(`FAIL: Age is missing from row! Found: "${rowText}"`);
  }
  if (/^\s*yrs\s*•/m.test(rowText) || /\n\s*yrs\s*•/.test(rowText)) {
    throw new Error(`FAIL: Found orphaned 'yrs •' without age! Found: "${rowText}"`);
  }
  if (!rowText.includes("2026") && !rowText.includes("Oct")) {
    throw new Error(`FAIL: Joined date is missing or not formatted in row! Found: "${rowText}"`);
  }
  console.log("✓ Age is computed from date of birth and Joined Date is populated cleanly");

  // Admin approves Talent 1 in UI
  console.log("Admin clicking 'Review' button for Talent 1...");
  const reviewBtn = talentRow.locator("button:has-text('Review')").first();
  await reviewBtn.click();

  const drawer = page.locator(".admin-review-drawer").first();
  await drawer.waitFor({ timeout: 10000 });

  const approveProfileBtn = drawer.locator("button:has-text('Approve Profile')").first();
  await approveProfileBtn.click();

  const successToast = page.locator("text=Talent Profile Approved").first();
  await successToast.waitFor({ timeout: 10000 });
  console.log("✓ Admin UI approval completed and toast confirmed");

  // -------------------------------------------------------------
  // Test Scenario C: Talent 1 applies successfully after approval
  // -------------------------------------------------------------
  console.log("\n--- Scenario C: Talent 1 Re-attempts Application After Approval ---");
  await injectSession(page, talent1.user, talent1.token, "talent");
  await page.goto(`${frontendUrl}/talent/opportunities`, { waitUntil: "networkidle" });

  const oppCardAfter = page.locator(".card-surface").filter({ hasText: `${PREFIX} Lead Character` }).first();
  await oppCardAfter.waitFor({ timeout: 15000 });
  const applyBtnAfter = oppCardAfter.locator(".opp-card-apply-btn, button:has-text('Apply')").first();
  await applyBtnAfter.click();

  const modalAfter = page.locator("div[role='dialog']").last();
  await modalAfter.waitFor({ timeout: 10000 });

  // Assert Profile Approval Required is GONE and Notice is shown
  const approvalBannerAfter = modalAfter.locator("text=Profile Approval Required");
  const isBannerVisible = await approvalBannerAfter.isVisible();
  console.log(`✓ 'Profile Approval Required' banner visible: ${isBannerVisible} (expected: false)`);
  if (isBannerVisible) {
    throw new Error("FAIL: Profile Approval Required banner is still shown after approval!");
  }

  // Submit button is now enabled
  const confirmBtn = modalAfter.locator("button:has-text('Confirm & Send Profile')");
  const isSubmitDisabled = await confirmBtn.isDisabled();
  console.log(`✓ 'Confirm & Send Profile' button disabled: ${isSubmitDisabled} (expected: false)`);
  if (isSubmitDisabled) {
    throw new Error("FAIL: Submit button should be enabled after admin approval!");
  }

  // Click Submit
  await confirmBtn.click();

  // Application confirmation
  await page.waitForTimeout(1000);
  const createdApp = await db.collection("applications").findOne({
    opportunityId: oppId
  });
  if (!createdApp) {
    throw new Error("FAIL: Application record was not created in database!");
  }
  tracked.apps.push(createdApp._id);
  console.log(`✓ Application submitted successfully in database (ID: ${createdApp._id})!`);

  // -------------------------------------------------------------
  // Test Scenario D: Talent 2 (Unpaid Talent) sees Payment Gate
  // -------------------------------------------------------------
  console.log("\n--- Scenario D: Talent 2 (Unpaid Talent) Apply Gate ---");
  const talent2 = await createTalentWithProfile(db, {
    name: `${PREFIX} Unpaid Performer`,
    dob: "2000-01-10",
    isPaid: false,
    completionTier: "full",
  });

  await injectSession(page, talent2.user, talent2.token, "talent");
  await page.goto(`${frontendUrl}/talent/opportunities`, { waitUntil: "networkidle" });

  const oppCard2 = page.locator(".card-surface").filter({ hasText: `${PREFIX} Lead Character` }).first();
  await oppCard2.waitFor({ timeout: 15000 });
  await oppCard2.locator(".opp-card-apply-btn, button:has-text('Apply')").first().click();

  const payModal = page.getByText(/Registration Payment Required|Complete your one-time registration/).first();
  await payModal.waitFor({ timeout: 10000 });
  console.log("✓ Unpaid talent correctly sees 'Registration Payment Required' gate");

  const closePayBtn = page.locator("button:has-text('Cancel'), button[aria-label='Close']").first();
  if (await closePayBtn.isVisible()) await closePayBtn.click();

  // -------------------------------------------------------------
  // Test Scenario E: Talent 3 (<60% Profile Completion) sees Completion Gate
  // -------------------------------------------------------------
  console.log("\n--- Scenario E: Talent 3 (<60% Completion) Apply Gate ---");
  const talent3 = await createTalentWithProfile(db, {
    name: `${PREFIX} Incomplete Performer`,
    dob: "2001-07-22",
    isPaid: true,
    completionTier: "minimal", // < 60%
  });

  await injectSession(page, talent3.user, talent3.token, "talent");
  await page.goto(`${frontendUrl}/talent/opportunities`, { waitUntil: "networkidle" });

  const oppCard3 = page.locator(".card-surface").filter({ hasText: `${PREFIX} Lead Character` }).first();
  await oppCard3.waitFor({ timeout: 15000 });
  await oppCard3.locator(".opp-card-apply-btn, button:has-text('Apply')").first().click();

  const compModal = page.getByText(/Complete your profile to apply|Current Profile Completion/).first();
  await compModal.waitFor({ timeout: 10000 });
  console.log("✓ Incomplete talent (<60%) correctly sees 'Complete your profile to apply' gate");

  await browser.close();

  // -------------------------------------------------------------
  // Cleanup routine
  // -------------------------------------------------------------
  console.log(`\n--- Cleanup Routine for ${PREFIX} Test Artifacts ---`);
  const delUsers = await db.collection("users").deleteMany({ _id: { $in: tracked.users } });
  const delProfiles = await db.collection("talentprofiles").deleteMany({ _id: { $in: tracked.profiles } });
  const delOrgs = await db.collection("organizations").deleteMany({ _id: { $in: tracked.orgs } });
  const delProjects = await db.collection("projects").deleteMany({ _id: { $in: tracked.projects } });
  const delOpps = await db.collection("opportunities").deleteMany({ _id: { $in: tracked.opps } });
  const delApps = await db.collection("applications").deleteMany({ _id: { $in: tracked.apps } });
  const delSessions = await db.collection("sessions").deleteMany({ sessionId: { $in: tracked.sessions } });
  const delNotifs = await db.collection("notifications").deleteMany({
    $or: [{ recipient: { $in: tracked.users } }, { referenceId: { $in: tracked.opps } }]
  });
  const delAudit = await db.collection("adminauditlogs").deleteMany({
    targetId: { $in: [...tracked.opps, ...tracked.users, ...tracked.profiles] }
  });
  const delOrders = await db.collection("paymenttransactions").deleteMany({
    orderId: { $in: tracked.orders }
  });

  console.log("\nCleanup Counts:");
  console.log(`  Users deleted:         ${delUsers.deletedCount}`);
  console.log(`  Profiles deleted:      ${delProfiles.deletedCount}`);
  console.log(`  Organizations deleted: ${delOrgs.deletedCount}`);
  console.log(`  Projects deleted:      ${delProjects.deletedCount}`);
  console.log(`  Opportunities deleted: ${delOpps.deletedCount}`);
  console.log(`  Applications deleted:  ${delApps.deletedCount}`);
  console.log(`  Payment transactions:  ${delOrders.deletedCount}`);
  console.log(`  Notifications deleted: ${delNotifs.deletedCount}`);
  console.log(`  Audit logs deleted:    ${delAudit.deletedCount}`);

  // Assert 9 orphan profiles remained completely untouched
  const finalProfiles = await db.collection("talentprofiles").find({}).toArray();
  const finalUserIds = new Set((await db.collection("users").find({}).toArray()).map((u) => u._id.toString()));
  const finalOrphans = finalProfiles.filter((p) => !finalUserIds.has(p.userId?.toString()));
  console.log(`\nFinal orphan profiles count: ${finalOrphans.length} (expected: 9)`);
  if (finalOrphans.length !== 9) {
    throw new Error(`FAIL: Orphan profiles count changed from 9 to ${finalOrphans.length}!`);
  }
  console.log("✓ All 9 orphan profiles remained completely untouched.");

  console.log(`\n================================================================`);
  console.log(`SUCCESS: All Apply Gates & Talent Directory tests passed cleanly!`);
  console.log(`================================================================\n`);

  process.exit(0);
}

run().catch((err) => {
  console.error("FATAL ERROR in test_apply_gates:", err);
  process.exit(1);
});
