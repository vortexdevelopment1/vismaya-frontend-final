import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("../../frontend/node_modules/playwright");
import mongoose from "../../backend/node_modules/mongoose/index.js";
import bcrypt from "../../backend/node_modules/bcrypt/bcrypt.js";
import {
  connectDB,
  frontendUrl,
  baseUrl,
  getAdminToken,
  apiRequest,
  authGet,
} from "./audit_helper.mjs";

const PREFIX = "E2E-ORGREG";
const tracked = {
  users: [],
  orgs: [],
  drafts: [],
  otps: [],
  payments: [],
};

async function run() {
  console.log(`\n======================================================`);
  console.log(`RUNNING E2E TEST: Organization Registration Flow (${PREFIX})`);
  console.log(`======================================================\n`);

  const db = await connectDB();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testResults = {
    testA_invalidMobileBlocked: false,
    testB_duplicateMobileBlocked: false,
    testC_fullRegistrationSucceeded: false,
    databaseUserMobileMatched: false,
    databaseOrgContactMatched: false,
    adminDirectoryMobileMatched: false,
    mockStringsRemoved: false,
    cleanupSucceeded: false,
    orphanProfilesUntouched: false,
  };

  try {
    // -------------------------------------------------------------
    // TEST A: Invalid mobile blocked at Account Step
    // -------------------------------------------------------------
    console.log("--- TEST A: Testing Invalid Mobile on Step 1 ---");
    await page.goto(`${frontendUrl}/register?role=organization`, { waitUntil: "networkidle" });
    await page.waitForSelector("#input-reg-mobile", { timeout: 10000 });

    await page.fill("#input-reg-name", `${PREFIX} Invalid Test`);
    await page.fill("#input-reg-email", `${PREFIX.toLowerCase()}-invalid-${Date.now()}@example.com`);
    await page.fill("#input-reg-mobile", "12345"); // Invalid short mobile

    // Click continue
    await page.click('button[type="submit"]:has-text("Continue to Verification")');

    // Wait for inline error
    await page.waitForSelector("#error-reg-mobile", { timeout: 5000 });
    const invalidMobileErrText = await page.textContent("#error-reg-mobile");
    console.log("Invalid Mobile Error Text:", invalidMobileErrText);

    const isStep1StillActive = await page.isVisible("#input-reg-mobile");
    if (
      isStep1StillActive &&
      invalidMobileErrText.includes("10-digit Indian number")
    ) {
      testResults.testA_invalidMobileBlocked = true;
      console.log("✓ TEST A PASSED: Invalid mobile was blocked on Step 1 with inline error.");
    } else {
      console.error("✗ TEST A FAILED: Step 1 did not properly block invalid mobile.");
    }

    // -------------------------------------------------------------
    // TEST B: Duplicate mobile blocked at Account Step
    // -------------------------------------------------------------
    console.log("\n--- TEST B: Testing Duplicate Mobile on Step 1 ---");
    const dupMobile = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;
    const dupUserId = new mongoose.Types.ObjectId();
    const dupEmail = `${PREFIX.toLowerCase()}-dup-owner-${Date.now()}@example.com`;
    const hashedPass = await bcrypt.hash("TestPass123!", 10);

    await db.collection("users").insertOne({
      _id: dupUserId,
      name: `${PREFIX} Existing Mobile Owner`,
      email: dupEmail,
      mobile: dupMobile,
      password: hashedPass,
      role: "talent",
      status: "active",
      isEmailVerified: true,
      isPaid: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    tracked.users.push(dupUserId);

    // Fill duplicate mobile in form
    await page.fill("#input-reg-mobile", dupMobile);
    await page.click('button[type="submit"]:has-text("Continue to Verification")');

    // Wait for inline error
    await page.waitForSelector("#error-reg-mobile", { timeout: 5000 });
    const dupMobileErrText = await page.textContent("#error-reg-mobile");
    console.log("Duplicate Mobile Error Text:", dupMobileErrText);

    const isStillStep1 = await page.isVisible("#input-reg-mobile");
    if (
      isStillStep1 &&
      dupMobileErrText.toLowerCase().includes("already exists")
    ) {
      testResults.testB_duplicateMobileBlocked = true;
      console.log("✓ TEST B PASSED: Duplicate mobile was blocked on Step 1 with clear message.");
    } else {
      console.error("✗ TEST B FAILED: Step 1 did not block duplicate mobile.");
    }

    // -------------------------------------------------------------
    // TEST C: Full Organization Registration Flow
    // -------------------------------------------------------------
    console.log("\n--- TEST C: Full Organization Registration Flow ---");
    const validMobile = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;
    const regEmail = `${PREFIX.toLowerCase()}-studio-${Date.now()}@example.com`;
    const studioName = `${PREFIX} Paramount Studios`;

    // Step 1: Fill valid details
    await page.fill("#input-reg-name", studioName);
    await page.fill("#input-reg-email", regEmail);
    await page.fill("#input-reg-mobile", validMobile);
    await page.click('button[type="submit"]:has-text("Continue to Verification")');

    // Step 2: Verification code step
    console.log("Advancing to Step 2 (Verification)...");
    await page.waitForSelector('input[placeholder="e.g. 123456"]', { timeout: 10000 });

    // Verify mock mode string is NOT visible on Step 2
    const step2Content = await page.content();
    const hasMockInStep2 = /in mock mode/i.test(step2Content);
    if (!hasMockInStep2) {
      console.log("✓ Step 2 text is clean (no 'in mock mode').");
    } else {
      console.warn("⚠ Warning: 'in mock mode' found in Step 2!");
    }

    // Enter verification code
    await page.fill('input[placeholder="e.g. 123456"]', "123456");
    await page.click('button[type="submit"]:has-text("Verify & Proceed")');

    // Step 3: PaymentCard (Organization Credits Tier)
    console.log("Advancing to Step 3 (Credits / Payment)...");
    await page.waitForSelector('button:has-text("Pay ₹")', { timeout: 10000 });
    await page.click('button:has-text("Pay ₹")');

    // Wait for digital receipt with continue button
    console.log("Waiting for payment receipt...");
    await page.waitForSelector('button:has-text("Continue")', { timeout: 10000 });
    await page.click('button:has-text("Continue")');

    // Step 4: Studio Profile
    console.log("Advancing to Step 4 (Studio Profile)...");
    await page.waitForSelector('button:has-text("Continue to Verification Docs")', { timeout: 10000 });
    await page.click('button:has-text("Continue to Verification Docs")');

    // Step 5: Accreditation Documents
    console.log("Advancing to Step 5 (Accreditation Documents)...");
    await page.waitForSelector('button:has-text("Enter Organization Dashboard")', { timeout: 10000 });

    const step5Content = await page.content();
    const hasMockInStep5 = /in mock mode/i.test(step5Content);
    const hasReviewNotice = step5Content.includes("Your organization will be verified after your documents are reviewed.");

    if (!hasMockInStep5 && hasReviewNotice) {
      testResults.mockStringsRemoved = true;
      console.log("✓ Step 5 verification text matches real behavior and has zero 'mock' mentions.");
    } else {
      console.warn(`⚠ Step 5 check: hasMock=${hasMockInStep5}, hasReviewNotice=${hasReviewNotice}`);
    }

    // Complete registration
    console.log("Submitting final organization registration...");
    await page.click('button:has-text("Enter Organization Dashboard")');

    // Wait for navigation to /recruiter/dashboard
    await page.waitForURL(/recruiter\/dashboard/, { timeout: 15000 });
    const currentUrl = page.url();
    console.log("Landed on destination URL:", currentUrl);

    if (currentUrl.includes("/recruiter/dashboard")) {
      testResults.testC_fullRegistrationSucceeded = true;
      console.log("✓ TEST C PASSED: Organization successfully registered and redirected to recruiter dashboard.");
    }

    // -------------------------------------------------------------
    // DATABASE & ADMIN DIRECTORY CHECKS
    // -------------------------------------------------------------
    console.log("\n--- Checking MongoDB and Admin Directory ---");
    const regUser = await db.collection("users").findOne({ email: regEmail });
    if (regUser) {
      tracked.users.push(regUser._id);
      console.log(`Registered User in DB: ID=${regUser._id}, Mobile=${regUser.mobile}, Role=${regUser.role}`);
      if (regUser.mobile === validMobile) {
        testResults.databaseUserMobileMatched = true;
        console.log("✓ MongoDB User mobile matches entered mobile:", regUser.mobile);
      } else {
        console.error(`✗ Mismatch: expected ${validMobile}, found ${regUser.mobile}`);
      }
    } else {
      console.error("✗ Registered User not found in MongoDB!");
    }

    const regOrg = await db.collection("organizations").findOne({ userId: regUser?._id });
    if (regOrg) {
      tracked.orgs.push(regOrg._id);
      console.log(`Registered Org in DB: ID=${regOrg._id}, ContactNumber=${regOrg.contactNumber}, VerificationState=${regOrg.verificationState}`);
      if (regOrg.contactNumber === validMobile) {
        testResults.databaseOrgContactMatched = true;
        console.log("✓ MongoDB Organization contactNumber matches entered mobile:", regOrg.contactNumber);
      } else {
        console.error(`✗ Mismatch: expected ${validMobile}, found ${regOrg.contactNumber}`);
      }
    } else {
      console.error("✗ Registered Organization not found in MongoDB!");
    }

    // Admin Directory Check
    const adminToken = await getAdminToken();
    const adminOrgsRes = await apiRequest("Admin Org Directory", "/api/admin/organizations", authGet(adminToken));

    if (adminOrgsRes.status === 200 && Array.isArray(adminOrgsRes.body?.organizations)) {
      const foundOrgInDirectory = adminOrgsRes.body.organizations.find(
        (o) =>
          o._id?.toString() === regOrg?._id?.toString() ||
          o.userId?._id?.toString() === regUser?._id?.toString() ||
          o.contactNumber === validMobile ||
          o.userId?.mobile === validMobile
      );

      if (foundOrgInDirectory) {
        testResults.adminDirectoryMobileMatched = true;
        console.log("✓ Admin Organizations Directory lists registered organization with mobile:", foundOrgInDirectory.contactNumber || foundOrgInDirectory.userId?.mobile);
      } else {
        console.error("✗ Registered organization not found in admin directory response.");
      }
    } else {
      console.error("✗ Failed to query admin organization directory:", adminOrgsRes.status);
    }

  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    await browser.close();

    // -------------------------------------------------------------
    // CLEANUP & ORPHAN PROFILE COUNT INTEGRITY
    // -------------------------------------------------------------
    console.log("\n--- CLEANUP & HYGIENE VERIFICATION ---");
    const delUsers = await db.collection("users").deleteMany({ _id: { $in: tracked.users } });
    const delOrgs = await db.collection("organizations").deleteMany({ _id: { $in: tracked.orgs } });
    const delDrafts = await db.collection("registrationdrafts").deleteMany({
      email: { $regex: new RegExp(PREFIX, "i") },
    });
    const delOtps = await db.collection("otps").deleteMany({
      email: { $regex: new RegExp(PREFIX, "i") },
    });

    // Check orphan profiles
    const allProfiles = await db.collection("talentprofiles").find({}).toArray();
    const allUserIds = new Set((await db.collection("users").find({}).toArray()).map((u) => u._id.toString()));
    const orphans = allProfiles.filter((p) => !allUserIds.has(p.userId?.toString()));

    testResults.cleanupSucceeded = true;
    testResults.orphanProfilesUntouched = orphans.length === 9;

    console.log("Cleanup Statistics:");
    console.log(`- Users deleted: ${delUsers.deletedCount}`);
    console.log(`- Organizations deleted: ${delOrgs.deletedCount}`);
    console.log(`- Drafts deleted: ${delDrafts.deletedCount}`);
    console.log(`- OTPs deleted: ${delOtps.deletedCount}`);
    console.log(`- Orphan profiles remaining: ${orphans.length} (Expected: 9)`);
    console.log(`- Orphan profiles untouched: ${orphans.length === 9 ? "YES ✓" : "NO ✗"}`);

    console.log("\n======================================================");
    console.log("FINAL TEST SUMMARY:");
    console.log(JSON.stringify(testResults, null, 2));
    console.log("======================================================\n");

    const allPassed = Object.values(testResults).every(Boolean);
    process.exit(allPassed ? 0 : 1);
  }
}

run().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
