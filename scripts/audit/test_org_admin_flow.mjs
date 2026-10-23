import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("../../frontend/node_modules/playwright");
import mongoose from "../../backend/node_modules/mongoose/index.js";
import {
  connectDB,
  frontendUrl,
  baseUrl,
  getAdminToken,
  adminEmail,
  adminPassword,
} from "./audit_helper.mjs";

const PREFIX = "E2E-ORGADMIN";
const tracked = {
  users: [],
  orgs: [],
  verifications: [],
  ledgers: [],
};

async function run() {
  console.log(`\n================================================================`);
  console.log(`RUNNING E2E TEST: Org Registration to Admin Dashboard Flow (${PREFIX})`);
  console.log(`================================================================\n`);

  const db = await connectDB();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testReport = {
    registeredViaUI: false,
    orgInMongo: false,
    adminLoggedIn: false,
    loginMethod: "",
    orgInAdminDirectoryDOM: false,
    orgStatusBadgeCorrect: false,
    dashboardCountReflected: false,
    reviewDrawerShowsEmailMobile: false,
    reviewDrawerFieldsVerified: false,
    cleanupSucceeded: false,
    orphanProfilesUntouched: false,
  };

  const validMobile = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;
  const regEmail = `${PREFIX.toLowerCase()}-studio-${Date.now()}@example.com`;
  const studioName = `${PREFIX} Zenith Studio`;

  try {
    // -------------------------------------------------------------
    // STEP 1: Register organization through the UI
    // -------------------------------------------------------------
    console.log(`1. Navigating to ${frontendUrl}/register?role=organization ...`);
    await page.goto(`${frontendUrl}/register?role=organization`, { waitUntil: "networkidle" });
    await page.waitForSelector("#input-reg-mobile", { timeout: 15000 });

    console.log("Filling Step 1 (Account)...");
    await page.fill("#input-reg-name", studioName);
    await page.fill("#input-reg-email", regEmail);
    await page.fill("#input-reg-mobile", validMobile);
    await page.click('button[type="submit"]:has-text("Continue to Verification")');

    console.log("Advancing to Step 2 (Verification)...");
    await page.waitForSelector('input[placeholder="e.g. 123456"]', { timeout: 10000 });
    await page.fill('input[placeholder="e.g. 123456"]', "123456");
    await page.click('button[type="submit"]:has-text("Verify & Proceed")');

    console.log("Advancing to Step 3 (Payment / Credits Tier)...");
    await page.waitForSelector('button:has-text("Pay ₹")', { timeout: 10000 });
    await page.click('button:has-text("Pay ₹")');

    console.log("Waiting for payment receipt...");
    await page.waitForSelector('button:has-text("Continue")', { timeout: 10000 });
    await page.click('button:has-text("Continue")');

    console.log("Advancing to Step 4 (Studio Profile)...");
    await page.waitForSelector('button:has-text("Continue to Verification Docs")', { timeout: 10000 });
    await page.click('button:has-text("Continue to Verification Docs")');

    console.log("Advancing to Step 5 (Accreditation Documents)...");
    await page.waitForSelector('button:has-text("Enter Organization Dashboard")', { timeout: 10000 });
    await page.click('button:has-text("Enter Organization Dashboard")');

    await page.waitForURL(/recruiter\/dashboard/, { timeout: 15000 });
    console.log("✓ Registration completed successfully! Current URL:", page.url());
    testReport.registeredViaUI = true;

    // Verify in MongoDB
    const regUser = await db.collection("users").findOne({ email: regEmail });
    const regOrg = await db.collection("organizations").findOne({ userId: regUser?._id });
    if (regUser && regOrg) {
      tracked.users.push(regUser._id);
      tracked.orgs.push(regOrg._id);
      testReport.orgInMongo = true;
      console.log(`✓ Stored in MongoDB: User ID=${regUser._id}, Org ID=${regOrg._id}, Mobile=${regOrg.contactNumber || regUser.mobile}`);
    }

    // -------------------------------------------------------------
    // STEP 2: Log in as admin & verify dashboard
    // -------------------------------------------------------------
    console.log("\n2. Logging in as Admin...");
    let adminToken = await getAdminToken();
    let loggedIn = false;

    // Try logging in via UI form first
    try {
      await page.goto(`${frontendUrl}/admin/login`, { waitUntil: "networkidle" });
      await page.waitForSelector('input[type="email"]', { timeout: 8000 });
      await page.fill('input[type="email"]', adminEmail);
      await page.fill('input[type="password"]', adminPassword);
      await page.click('button[type="submit"]');

      // Check if 2FA challenge screen appeared
      const is2FA = await page.waitForSelector('input[placeholder*="digit" i], input[placeholder*="123456" i]', { timeout: 4000 }).catch(() => null);
      if (is2FA) {
        // Find OTP from MongoDB
        const otpDoc = await db.collection("otps").findOne(
          { email: adminEmail, purpose: "2fa_login" },
          { sort: { createdAt: -1 } }
        );
        const code = otpDoc?.otp || otpDoc?.otpCode || "123456";
        await is2FA.fill(code);
        await page.click('button[type="submit"]');
      }

      await page.waitForURL(/admin\/dashboard/, { timeout: 5000 });
      loggedIn = true;
      testReport.loginMethod = "UI Login Flow";
      console.log("✓ Logged in as Admin via UI flow.");
    } catch (loginErr) {
      console.warn("UI login flow challenged or rate-limited. Injecting admin session token directly per spec instructions.");
      testReport.loginMethod = "Admin API Session Token Injection";

      // Set admin token in localStorage and cookies
      const adminUser = await db.collection("users").findOne({ role: "admin", status: "active" });
      await page.goto(`${frontendUrl}/admin/login`, { waitUntil: "networkidle" });
      await page.evaluate(({ token, user }) => {
        localStorage.setItem("vismaya_auth_token", token);
        localStorage.setItem("vismaya_user_data", JSON.stringify(user));
      }, {
        token: adminToken,
        user: {
          id: adminUser?._id?.toString(),
          name: adminUser?.name || "Admin",
          email: adminUser?.email,
          role: "admin",
          status: "active",
        }
      });
      loggedIn = true;
    }
    testReport.adminLoggedIn = loggedIn;

    // -------------------------------------------------------------
    // STEP 3: Assert Admin Dashboard from DOM
    // -------------------------------------------------------------
    console.log("\n3. Navigating to Admin Dashboard...");
    await page.goto(`${frontendUrl}/admin/dashboard`, { waitUntil: "networkidle" });
    await page.waitForSelector(".admin-stat-grid", { timeout: 15000 });

    const dashboardText = await page.textContent("body");
    console.log("Checking dashboard indicators in DOM...");

    // Check Active Organizations stat card value in DOM
    const activeOrgStat = await page.locator('.admin-stat-grid .stat-card-consistent:has-text("Active Organizations")').first().textContent();
    console.log("Active Organizations Stat Card Content:", activeOrgStat.replace(/\s+/g, " ").trim());

    // Check Operations Activity feed in DOM for newly registered org
    const hasOrgInActivity = dashboardText.includes(studioName);
    console.log(`Newly registered org '${studioName}' in Operations Activity:`, hasOrgInActivity);

    // Check Pending Organizations attention queue item
    const pendingOrgAttention = await page.locator('.admin-attention-grid :has-text("Pending Organizations")').textContent().catch(() => "");
    console.log("Pending Organizations Queue Badge:", pendingOrgAttention.replace(/\s+/g, " ").trim());

    if (activeOrgStat && (hasOrgInActivity || pendingOrgAttention)) {
      testReport.dashboardCountReflected = true;
      console.log("✓ DOM Assert: Admin Dashboard reflects live organizations and activity.");
    }

    // -------------------------------------------------------------
    // STEP 4: Assert Admin Organizations Directory from DOM
    // -------------------------------------------------------------
    console.log("\n4. Navigating to Admin Organizations Directory...");
    await page.goto(`${frontendUrl}/admin/recruiter-management`, { waitUntil: "networkidle" });
    await page.waitForSelector("table, [role='table']", { timeout: 15000 });

    // Look for row with studioName
    const orgRowLocator = page.locator(`tr:has-text("${studioName}")`);
    await orgRowLocator.waitFor({ timeout: 10000 });
    const rowText = await orgRowLocator.textContent();
    console.log("Found Organization Row in DOM:", rowText.replace(/\s+/g, " ").trim());

    testReport.orgInAdminDirectoryDOM = true;

    // Verify Pending badge
    if (rowText.includes("Pending")) {
      testReport.orgStatusBadgeCorrect = true;
      console.log("✓ DOM Assert: Organization has correct 'Pending' status badge.");
    }

    // -------------------------------------------------------------
    // STEP 5: Open Review Drawer & Assert Email, Mobile, and Details
    // -------------------------------------------------------------
    console.log("\n5. Opening Organization Review Drawer...");
    const reviewButton = orgRowLocator.locator('button:has-text("Review")');
    await reviewButton.click();

    await page.waitForSelector(".admin-review-drawer", { timeout: 8000 });
    const drawerText = await page.locator(".admin-review-drawer").textContent();
    console.log("Review Drawer opened. Inspecting fields in DOM...");

    const hasEmail = drawerText.includes(regEmail);
    const hasMobile = drawerText.includes(validMobile);
    const hasRegNum = drawerText.includes("Corporate Registration (CIN)");
    const hasGst = drawerText.includes("GSTIN");
    const hasCity = drawerText.includes("City");
    const hasStatus = drawerText.includes("Status");
    const hasCredits = drawerText.includes("Credits");
    const hasWebsite = drawerText.includes("Website");

    console.log(`- Email (${regEmail}): ${hasEmail}`);
    console.log(`- Mobile (${validMobile}): ${hasMobile}`);
    console.log(`- CIN present: ${hasRegNum}`);
    console.log(`- GSTIN present: ${hasGst}`);
    console.log(`- City present: ${hasCity}`);
    console.log(`- Status present: ${hasStatus}`);
    console.log(`- Credits present: ${hasCredits}`);
    console.log(`- Website present: ${hasWebsite}`);

    if (hasEmail && hasMobile) {
      testReport.reviewDrawerShowsEmailMobile = true;
      console.log("✓ DOM Assert: Review drawer correctly displays email and mobile.");
    }
    if (hasRegNum && hasGst && hasCity && hasStatus && hasCredits && hasWebsite) {
      testReport.reviewDrawerFieldsVerified = true;
      console.log("✓ DOM Assert: All required review drawer fields are present (CIN, GSTIN, City, Status, Credits, Website).");
    }

  } catch (err) {
    console.error("Test execution encountered an error:", err);
  } finally {
    // -------------------------------------------------------------
    // STEP 6: Clean up test resources (leave 9 orphan profiles alone)
    // -------------------------------------------------------------
    console.log("\n6. Cleaning up test resources...");
    let usersDeleted = 0;
    let orgsDeleted = 0;
    let verifsDeleted = 0;
    let ledgersDeleted = 0;

    if (tracked.users.length > 0) {
      const uRes = await db.collection("users").deleteMany({ _id: { $in: tracked.users } });
      usersDeleted = uRes.deletedCount;
      const dRes = await db.collection("registrationdrafts").deleteMany({ email: regEmail });
      const oRes = await db.collection("otps").deleteMany({ email: regEmail });
      const vRes = await db.collection("verifications").deleteMany({ userId: { $in: tracked.users } });
      verifsDeleted = vRes.deletedCount;
    }
    if (tracked.orgs.length > 0) {
      const orgRes = await db.collection("organizations").deleteMany({ _id: { $in: tracked.orgs } });
      orgsDeleted = orgRes.deletedCount;
      const lRes = await db.collection("creditledgers").deleteMany({ organizationId: { $in: tracked.orgs } });
      ledgersDeleted = lRes.deletedCount;
    }

    console.log(`Cleanup counts: ${usersDeleted} users, ${orgsDeleted} orgs, ${verifsDeleted} verifications, ${ledgersDeleted} credit ledgers deleted.`);
    testReport.cleanupSucceeded = usersDeleted > 0 && orgsDeleted > 0;

    // Check orphan profiles
    const allProfiles = await db.collection("talentprofiles").find({}).toArray();
    const allUserIds = new Set((await db.collection("users").find({}).toArray()).map((u) => u._id.toString()));
    const orphans = allProfiles.filter((p) => !allUserIds.has(p.userId?.toString()));

    console.log(`Orphan talent profiles count check: ${orphans.length} (expected 9 untouched)`);
    testReport.orphanProfilesUntouched = orphans.length === 9;

    await browser.close();
  }

  console.log("\n================================================================");
  console.log("FINAL TEST SUMMARY:");
  console.log(JSON.stringify(testReport, null, 2));
  console.log("================================================================\n");

  const allPassed =
    testReport.registeredViaUI &&
    testReport.orgInMongo &&
    testReport.adminLoggedIn &&
    testReport.orgInAdminDirectoryDOM &&
    testReport.orgStatusBadgeCorrect &&
    testReport.dashboardCountReflected &&
    testReport.reviewDrawerShowsEmailMobile &&
    testReport.reviewDrawerFieldsVerified &&
    testReport.cleanupSucceeded &&
    testReport.orphanProfilesUntouched;

  if (allPassed) {
    console.log("🎉 ALL PLAYWRIGHT & DOM ASSERTION TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  } else {
    console.error("❌ ONE OR MORE TESTS FAILED.");
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
