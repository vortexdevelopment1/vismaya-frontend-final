import crypto from "crypto";
import { createRequire } from "node:module";
import assert from "node:assert";
const require = createRequire(import.meta.url);
const { chromium } = require("../../frontend/node_modules/playwright");
import mongoose from "../../backend/node_modules/mongoose/index.js";
import bcrypt from "../../backend/node_modules/bcrypt/bcrypt.js";
import jwt from "../../backend/node_modules/jsonwebtoken/index.js";
import {
  connectDB,
  frontendUrl,
  baseUrl,
  adminEmail,
  adminPassword,
  getAdminToken,
} from "./audit_helper.mjs";

const PREFIX = "E2E-SWEEP2";

function expect(condition, message) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

async function runSweepTest() {
  const hardCapTimer = setTimeout(() => {
    console.error("\n❌ Hard cap of 10 minutes reached! Aborting test run.");
    process.exit(1);
  }, 10 * 60 * 1000);
  hardCapTimer.unref();

  console.log(`\n================================================================`);
  console.log(`RUNNING PLAYWRIGHT REAL-MODE AUDIT SWEEP (${PREFIX})`);
  console.log(`================================================================\n`);

  const db = await connectDB();
  const jwtSecret = process.env.JWT_SECRET || "fallback_super_secret_jwt_key_for_development";

  // Check initial orphan profiles count (must not be touched)
  const allInitialProfiles = await db.collection("talentprofiles").find({}).toArray();
  const allInitialUsers = await db.collection("users").find({}, { projection: { _id: 1 } }).toArray();
  const initialUserIdsSet = new Set(allInitialUsers.map(u => u._id.toString()));
  const initialOrphans = allInitialProfiles.filter(p => !initialUserIdsSet.has(p.userId?.toString())).length;
  console.log(`Initial orphan profiles count: ${initialOrphans} (expected: 9)`);

  const timestamp = Date.now();
  const testTalentEmail = `${PREFIX.toLowerCase()}-talent-${timestamp}@test.io`;
  const testOrgEmail = `${PREFIX.toLowerCase()}-org-${timestamp}@test.io`;
  const testSecEmail = `${PREFIX.toLowerCase()}-sec-${timestamp}@test.io`;
  const adminInjEmail = `${PREFIX.toLowerCase()}-injadmin-${timestamp}@test.io`;
  const defaultPassword = "Password123!";

  const tracked = {
    users: [],
    talentProfiles: [],
    organizations: [],
    ledgers: [],
    projects: [],
    opportunities: [],
    applications: [],
    notifications: [],
    transactions: [],
    sessions: [],
    otps: [],
  };

  const pageResults = [];
  let browser;

  try {
    // -----------------------------------------------------------------
    // 1. INJECTION TEST 1: REGISTER WITH ROLE "ADMIN"
    // -----------------------------------------------------------------
    console.log("1. Running Injection Test 1: Register with role 'admin'...");
    const adminInjRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "admin",
        name: "Malicious Admin Candidate",
        email: adminInjEmail,
        password: defaultPassword,
        mobile: "9876543290"
      })
    });
    expect(adminInjRes.status === 400 || adminInjRes.status === 403, `Admin role injection must be rejected (got HTTP ${adminInjRes.status})`);
    const storedInjAdmin = await db.collection("users").findOne({ email: adminInjEmail });
    expect(storedInjAdmin === null, "SECURITY VULNERABILITY: User with role 'admin' was created via public register API!");
    console.log("  PASS: Injection Test 1 verified: registration with role 'admin' strictly rejected.");

    // -----------------------------------------------------------------
    // 2. INJECTION TEST 2: TALENT REGISTRATION WITH isPaid:true, status:'active', credits:9999
    // -----------------------------------------------------------------
    console.log("\n2. Running Injection Test 2: Register talent with isPaid:true & status:'active'...");
    const secRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "talent",
        name: "Security Injection Candidate",
        email: testSecEmail,
        password: defaultPassword,
        mobile: "9876543299",
        city: "Mumbai",
        isPaid: true,
        status: "active",
        credits: 9999,
        verificationState: "verified"
      })
    });
    const secRegData = await secRegRes.json();
    expect(secRegRes.status === 201, `Security registration expected HTTP 201, got ${secRegRes.status}: ${JSON.stringify(secRegData)}`);

    const storedSecUser = await db.collection("users").findOne({ email: testSecEmail });
    expect(storedSecUser !== null, "Stored security user must exist in database");
    tracked.users.push(storedSecUser._id);

    // Verify stored user has isPaid=false and status='pending'
    expect(storedSecUser.isPaid === false, `SECURITY VULNERABILITY: Stored user has isPaid=${storedSecUser.isPaid}, expected false!`);
    expect(storedSecUser.status === "pending", `SECURITY VULNERABILITY: Stored user has status='${storedSecUser.status}', expected 'pending'!`);

    const storedSecProfile = await db.collection("talentprofiles").findOne({ userId: storedSecUser._id });
    if (storedSecProfile) {
      tracked.talentProfiles.push(storedSecProfile._id);
      expect(storedSecProfile.isPaid === false, "SECURITY VULNERABILITY: TalentProfile has isPaid=true!");
      expect(storedSecProfile.status === "pending", "TalentProfile status must be pending");
    }
    console.log("  PASS: Injection Test 2 verified: client-supplied isPaid, status, and credits strictly ignored.");

    // -----------------------------------------------------------------
    // 3. INJECTION TEST 3 & ORG SEED: ORG REGISTER WITH isPaid:true & credits:9999
    // -----------------------------------------------------------------
    console.log("\n3. Registering Organization via Real API with isPaid:true & credits:9999...");
    const orgRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "organization",
        name: `${PREFIX} Productions`,
        studioName: `${PREFIX} Productions`,
        email: testOrgEmail,
        password: defaultPassword,
        mobile: "9876543201",
        city: "Mumbai",
        companyType: "Production House",
        isPaid: true,
        credits: 9999,
        status: "active"
      })
    });
    expect(orgRegRes.status === 201, `Org registration expected HTTP 201, got ${orgRegRes.status}`);

    const storedOrgUser = await db.collection("users").findOne({ email: testOrgEmail });
    expect(storedOrgUser !== null, "Org user must exist in DB");
    tracked.users.push(storedOrgUser._id);
    expect(storedOrgUser.isPaid === false, `SECURITY VULNERABILITY: Org user stored isPaid=${storedOrgUser.isPaid}, expected false!`);
    expect(storedOrgUser.status === "pending", `SECURITY VULNERABILITY: Org user stored status='${storedOrgUser.status}', expected 'pending'!`);

    const storedOrg = await db.collection("organizations").findOne({ userId: storedOrgUser._id });
    expect(storedOrg !== null, "Organization document must exist in DB");
    tracked.organizations.push(storedOrg._id);

    // Registration alone must NOT grant credits
    const prePaymentLedger = await db.collection("creditledgers").findOne({ organizationId: storedOrg._id });
    expect(prePaymentLedger === null, "Registration alone must NOT grant credit ledger!");
    console.log("  PASS: Org registration with isPaid:true & credits:9999 created with isPaid=false and NO credit ledger.");

    // Activate Org via OTP Verification
    const orgOtpDoc = await db.collection("otps").findOne({ email: testOrgEmail, purpose: "registration" });
    if (orgOtpDoc) {
      tracked.otps.push(orgOtpDoc._id);
      const knownOtp = "123456";
      const hash = await bcrypt.hash(knownOtp, 10);
      await db.collection("otps").updateOne({ _id: orgOtpDoc._id }, { $set: { otpHash: hash, expiresAt: new Date(Date.now() + 600000) } });
      const verifyRes = await fetch(`${baseUrl}/api/auth/verify-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testOrgEmail, otp: knownOtp })
      });
      expect(verifyRes.status === 200, `Org verify-registration returned ${verifyRes.status}`);
    }

    // Real Login flow for Org
    const orgLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testOrgEmail, password: defaultPassword })
    });
    const orgLoginData = await orgLoginRes.json();
    expect(orgLoginRes.status === 200 && !!orgLoginData.token, "Org login failed");
    const orgToken = orgLoginData.token;

    // Track org session
    const orgSession = await db.collection("usersessions").findOne({ userId: storedOrgUser._id });
    if (orgSession) tracked.sessions.push(orgSession._id);
    console.log("  PASS: Organization authenticated via real login flow.");

    // Admin approves Org
    const adminToken = await getAdminToken();
    const adminApproveRes = await fetch(`${baseUrl}/api/admin/users/${storedOrgUser._id}/approve`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    expect(adminApproveRes.status === 200, `Admin approve org returned HTTP ${adminApproveRes.status}`);

    // Create payment order for org annual plan
    console.log("  Creating org payment order via /api/payments/create-order...");
    const orgOrderRes = await fetch(`${baseUrl}/api/payments/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${orgToken}` },
      body: JSON.stringify({ packageType: "industry_annual_4999" })
    });
    const orgOrderData = await orgOrderRes.json();
    expect(orgOrderRes.status === 201, `Create payment order returned ${orgOrderRes.status}`);
    const orgOrderId = orgOrderData.order?.orderId || orgOrderData.orderId;
    expect(!!orgOrderId, "Order ID must be returned");

    // Track payment transaction for cleanup
    const txDoc = await db.collection("paymenttransactions").findOne({ orderId: orgOrderId });
    if (txDoc) tracked.transactions.push(txDoc._id);

    // Verify payment 1st time
    console.log("  Verifying org payment via /api/payments/verify...");
    const verifyPayRes1 = await fetch(`${baseUrl}/api/payments/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${orgToken}` },
      body: JSON.stringify({ orderId: orgOrderId })
    });
    expect(verifyPayRes1.status === 200, `Verify payment returned ${verifyPayRes1.status}`);

    // Check DB: exactly 1 ledger, balance 100
    const ledgers1 = await db.collection("creditledgers").find({ organizationId: storedOrg._id }).toArray();
    expect(ledgers1.length === 1, `Expected exactly 1 credit ledger, found ${ledgers1.length}`);
    expect(ledgers1[0].balance === 100, `Expected balance 100, got ${ledgers1[0].balance}`);
    tracked.ledgers.push(ledgers1[0]._id);

    // Verify payment 2nd time (IDEMPOTENCY TEST)
    console.log("  Verifying org payment 2nd time (idempotency check)...");
    const verifyPayRes2 = await fetch(`${baseUrl}/api/payments/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${orgToken}` },
      body: JSON.stringify({ orderId: orgOrderId })
    });
    expect(verifyPayRes2.status === 200, `2nd verify payment returned ${verifyPayRes2.status}`);

    const ledgers2 = await db.collection("creditledgers").find({ organizationId: storedOrg._id }).toArray();
    expect(ledgers2.length === 1, `IDEMPOTENCY FAILED: Duplicate ledgers found: ${ledgers2.length}`);
    expect(ledgers2[0].balance === 100, `IDEMPOTENCY FAILED: Double payment credited twice! Balance: ${ledgers2[0].balance}`);
    console.log("  PASS: Payment idempotency verified: paying twice results in exactly 1 ledger and balance 100.");

    // -----------------------------------------------------------------
    // 4. SEED PROJECT & OPPORTUNITY VIA REAL ORG API & ADMIN PUBLISH
    // -----------------------------------------------------------------
    console.log("\n4. Creating Project & Opportunity via Real Org API...");
    const projRes = await fetch(`${baseUrl}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${orgToken}` },
      body: JSON.stringify({
        title: `${PREFIX} Feature Film`,
        projectName: `${PREFIX} Feature Film`,
        type: "Feature Film",
        projectType: "Feature Film",
        description: "Official E2E-SWEEP2 audit test project"
      })
    });
    const projData = await projRes.json();
    expect(projRes.status === 201, `Create project returned ${projRes.status}`);
    const projectId = projData.project?._id || projData.data?._id || projData._id;
    expect(!!projectId, "Project ID must be returned");
    tracked.projects.push(new mongoose.Types.ObjectId(projectId));

    const oppRes = await fetch(`${baseUrl}/api/opportunities`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${orgToken}` },
      body: JSON.stringify({
        projectId: projectId,
        title: `${PREFIX} Lead Protagonist`,
        opportunityType: "Feature Film",
        summary: "Lead Protagonist for sweep test film",
        role: "Lead Protagonist",
        location: "Mumbai",
        deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
        roles: [{ roleName: "Lead Protagonist", count: 1, gender: "Any", ageRange: "20-35" }]
      })
    });
    const oppData = await oppRes.json();
    expect(oppRes.status === 201, `Create opportunity returned ${oppRes.status}`);
    const oppId = oppData.opportunity?._id || oppData.data?._id || oppData._id;
    expect(!!oppId, "Opportunity ID must be returned");
    tracked.opportunities.push(new mongoose.Types.ObjectId(oppId));

    // Admin publishes opportunity through the real admin API (approve endpoint)
    const pubRes = await fetch(`${baseUrl}/api/admin/opportunities/${oppId}/approve`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    expect(pubRes.status === 200, `Admin approve opportunity endpoint expected HTTP 200, got ${pubRes.status}`);
    console.log("  PASS: Project & Published Opportunity created and approved via real Admin API.");

    // -----------------------------------------------------------------
    // 5. SEED TALENT VIA REAL API & APPLICATION
    // -----------------------------------------------------------------
    console.log("\n5. Registering Talent & Submitting Application via Real API...");
    const talentRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "talent",
        name: `${PREFIX} Talent Artist`,
        email: testTalentEmail,
        password: defaultPassword,
        mobile: "9876543202",
        city: "Mumbai",
        primaryProfession: "Actor / Screen Artist"
      })
    });
    expect(talentRegRes.status === 201, `Talent registration returned ${talentRegRes.status}`);

    const storedTalentUser = await db.collection("users").findOne({ email: testTalentEmail });
    expect(storedTalentUser !== null, "Talent user must exist in DB");
    tracked.users.push(storedTalentUser._id);
    expect(storedTalentUser.isPaid === false, "Talent user must start with isPaid=false");

    const storedTalentProfile = await db.collection("talentprofiles").findOne({ userId: storedTalentUser._id });
    if (storedTalentProfile) tracked.talentProfiles.push(storedTalentProfile._id);

    // Activate Talent via OTP
    const talentOtpDoc = await db.collection("otps").findOne({ email: testTalentEmail, purpose: "registration" });
    if (talentOtpDoc) {
      tracked.otps.push(talentOtpDoc._id);
      const knownOtp = "123456";
      const hash = await bcrypt.hash(knownOtp, 10);
      await db.collection("otps").updateOne({ _id: talentOtpDoc._id }, { $set: { otpHash: hash, expiresAt: new Date(Date.now() + 600000) } });
      await fetch(`${baseUrl}/api/auth/verify-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testTalentEmail, otp: knownOtp })
      });
    }

    // Talent real login
    const talentLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testTalentEmail, password: defaultPassword })
    });
    const talentLoginData = await talentLoginRes.json();
    expect(talentLoginRes.status === 200 && !!talentLoginData.token, "Talent login failed");
    const talentToken = talentLoginData.token;

    // Track talent session
    const talentSession = await db.collection("usersessions").findOne({ userId: storedTalentUser._id });
    if (talentSession) tracked.sessions.push(talentSession._id);

    // Talent Payment via Real API
    const talentOrderRes = await fetch(`${baseUrl}/api/payments/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${talentToken}` },
      body: JSON.stringify({ packageType: "talent_annual_999" })
    });
    const talentOrderData = await talentOrderRes.json();
    expect(talentOrderRes.status === 201, `Talent create order returned ${talentOrderRes.status}`);
    const talentOrderId = talentOrderData.order?.orderId || talentOrderData.orderId;

    const talentTx = await db.collection("paymenttransactions").findOne({ orderId: talentOrderId });
    if (talentTx) tracked.transactions.push(talentTx._id);

    const talentPayVerifyRes = await fetch(`${baseUrl}/api/payments/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${talentToken}` },
      body: JSON.stringify({ orderId: talentOrderId })
    });
    expect(talentPayVerifyRes.status === 200, `Talent payment verify returned ${talentPayVerifyRes.status}`);

    const updatedTalentUser = await db.collection("users").findOne({ _id: storedTalentUser._id });
    expect(updatedTalentUser.isPaid === true, "Talent user must be isPaid=true after verified payment");

    // Profile Completion update to pass 60% gate
    await db.collection("talentprofiles").updateOne(
      { userId: storedTalentUser._id },
      { $set: { profileCompletionPercentage: 80, isPaid: true, status: "approved" } }
    );

    // Apply to opportunity
    const applyRes = await fetch(`${baseUrl}/api/applications/${oppId}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${talentToken}` },
      body: JSON.stringify({ consentGiven: true, characterRole: "Lead Protagonist" })
    });
    const applyData = await applyRes.json();
    expect(applyRes.status === 201 || applyRes.status === 200, `Apply returned HTTP ${applyRes.status}: ${JSON.stringify(applyData)}`);
    const appId = applyData.application?._id || applyData.data?._id || applyData._id;
    if (appId) tracked.applications.push(new mongoose.Types.ObjectId(appId));
    console.log("  PASS: Talent paid and applied to opportunity via real APIs.");

    // Query exact DB numbers for dashboard assertions
    const totalActiveOrgsDB = await db.collection("users").countDocuments({ role: "organization", status: { $in: ["active", "approved", "verified"] } });
    const totalPublishedOppsDB = await db.collection("opportunities").countDocuments({ status: "published" });
    const totalAppsDB = await db.collection("applications").countDocuments({});
    console.log(`\nVerified DB Counts -> Active Orgs: ${totalActiveOrgsDB}, Published Opps: ${totalPublishedOppsDB}, Applications: ${totalAppsDB}`);

    // Create browser session helper
    const adminUser = await db.collection("users").findOne({ email: adminEmail });
    expect(adminUser !== null, "Admin user must exist");

    // Launch Playwright
    browser = await chromium.launch({ headless: true });

    const forbiddenPatterns = [/\bmock\b/i, /\blorem\b/i, /\bdemo\b/i, /Zee Films/i];
    const unhandledErrorPatterns = [/Unhandled Runtime Error/i, /Application error: a client-side exception/i, /Internal Server Error/i];

    async function checkPage(page, url, roleName, expectedAssertionsDesc, customAssertionFn = null) {
      const pageName = url.replace(frontendUrl, "");
      let loaded = "NO";
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
        await page.waitForTimeout(2000);
        loaded = "YES";

        const bodyText = await page.innerText("body");

        // Assert no unhandled error
        for (const errPat of unhandledErrorPatterns) {
          expect(!errPat.test(bodyText), `Page '${pageName}' contains unhandled error matching ${errPat}`);
        }

        // Assert no forbidden words
        for (const forbPat of forbiddenPatterns) {
          expect(!forbPat.test(bodyText), `Page '${pageName}' contains forbidden text matching ${forbPat}`);
        }

        if (customAssertionFn) {
          await customAssertionFn(page, bodyText);
        }

        pageResults.push({
          panel: roleName,
          page: pageName,
          loaded: "YES",
          status: "PASSED",
          assertions: expectedAssertionsDesc
        });
        console.log(`  ✓ [${roleName}] Page: ${pageName} | Loaded: YES | Asserted: ${expectedAssertionsDesc}`);
      } catch (err) {
        pageResults.push({
          panel: roleName,
          page: pageName,
          loaded: loaded === "YES" ? "YES" : "NO/TIMEOUT",
          status: "FAILED",
          assertions: `${expectedAssertionsDesc} (Error: ${err.message})`
        });
        console.error(`  ✗ [${roleName}] Page: ${pageName} | Loaded: ${loaded === "YES" ? "YES" : "NO/TIMEOUT"} | FAILED: ${err.message}`);
      }
    }

    // -----------------------------------------------------------------
    // 6. TEST ADMIN PANEL (14 PAGES)
    // -----------------------------------------------------------------
    console.log("\n================================================================");
    console.log("TESTING ADMIN PANEL (14 PAGES)");
    console.log("================================================================");

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    // Set auth tokens for admin
    await adminPage.goto(`${frontendUrl}/admin/login`, { waitUntil: "domcontentloaded" });
    await adminPage.evaluate(({ token, user }) => {
      localStorage.setItem("vismaya_auth_token", token);
      localStorage.setItem("vismaya_user_data", JSON.stringify(user));
      document.cookie = `token=${token}; path=/; max-age=7200`;
    }, {
      token: adminToken,
      user: { id: String(adminUser._id), email: adminUser.email, role: "admin", name: adminUser.name }
    });

    // Page 1: Admin Dashboard
    await checkPage(adminPage, `${frontendUrl}/admin/dashboard`, "Admin", "No forbidden text, StatCard numbers match DB counts exactly", async (page, bodyText) => {
      await page.waitForFunction((expected) => {
        const cards = Array.from(document.querySelectorAll(".stat-card-consistent"));
        const orgCard = cards.find(c => c.querySelector(".stat-card-label")?.innerText?.includes("ORGANIZATIONS"));
        const num = orgCard?.querySelector(".stat-card-number")?.innerText?.trim();
        return num === String(expected);
      }, totalActiveOrgsDB, { timeout: 10000 }).catch(() => {});

      const statCardNumbers = await page.$$eval(".stat-card-consistent", (cards) => {
        return cards.map(c => {
          const label = c.querySelector(".stat-card-label")?.innerText?.trim();
          const num = c.querySelector(".stat-card-number")?.innerText?.trim();
          return { label, num };
        });
      });

      const orgCard = statCardNumbers.find(c => c.label && c.label.includes("ORGANIZATIONS"));
      const oppCard = statCardNumbers.find(c => c.label && c.label.includes("OPPORTUNITIES"));
      const appCard = statCardNumbers.find(c => c.label && c.label.includes("APPLICATIONS"));

      expect(orgCard && orgCard.num === String(totalActiveOrgsDB), `Active Orgs StatCard (${orgCard?.num}) !== DB count (${totalActiveOrgsDB})`);
      expect(oppCard && oppCard.num === String(totalPublishedOppsDB), `Live Opps StatCard (${oppCard?.num}) !== DB count (${totalPublishedOppsDB})`);
      expect(appCard && appCard.num === String(totalAppsDB), `Total Apps StatCard (${appCard?.num}) !== DB count (${totalAppsDB})`);
    });

    // Page 2: Talent Management
    await checkPage(adminPage, `${frontendUrl}/admin/talent-management`, "Admin", "Talent directory contains seeded talent 'E2E-SWEEP2 Talent Artist'", async (page) => {
      await page.waitForFunction((prefix) => document.body.innerText.includes(`${prefix} Talent Artist`), PREFIX, { timeout: 8000 }).catch(() => {});
      const bodyText = await page.innerText("body");
      expect(bodyText.includes(`${PREFIX} Talent Artist`), `Admin talent directory must contain seeded talent '${PREFIX} Talent Artist'`);
    });

    // Page 3: Organization Management
    await checkPage(adminPage, `${frontendUrl}/admin/recruiter-management`, "Admin", "Organizations table contains seeded org 'E2E-SWEEP2 Productions'", async (page) => {
      await page.waitForFunction((prefix) => document.body.innerText.includes(`${prefix} Productions`), PREFIX, { timeout: 8000 }).catch(() => {});
      const bodyText = await page.innerText("body");
      expect(bodyText.includes(`${PREFIX} Productions`), `Admin recruiter management must contain seeded org '${PREFIX} Productions'`);
    });

    // Page 4: Informational Profiles
    await checkPage(adminPage, `${frontendUrl}/admin/informational-profiles`, "Admin", "No forbidden text, informational profiles rendered");
    // Page 5: Verifications Queue
    await checkPage(adminPage, `${frontendUrl}/admin/verifications`, "Admin", "No forbidden text, verifications queue rendered");
    // Page 6: Content Moderation
    await checkPage(adminPage, `${frontendUrl}/admin/content-moderation`, "Admin", "No forbidden text, moderation queue rendered");
    // Page 7: Opportunity Review
    await checkPage(adminPage, `${frontendUrl}/admin/opportunity-review`, "Admin", "No forbidden text, opportunity review items rendered");
    // Page 8: Auditions
    await checkPage(adminPage, `${frontendUrl}/admin/auditions`, "Admin", "No forbidden text, auditions queue rendered");
    // Page 9: Cancellation Requests
    await checkPage(adminPage, `${frontendUrl}/admin/cancellation-requests`, "Admin", "No forbidden text, cancellation requests rendered");

    // Page 10: Opportunities Directory
    await checkPage(adminPage, `${frontendUrl}/admin/opportunities`, "Admin", "Opportunities directory contains seeded 'E2E-SWEEP2 Lead Protagonist'", async (page) => {
      await page.waitForFunction((prefix) => document.body.innerText.includes(`${prefix} Lead Protagonist`), PREFIX, { timeout: 8000 }).catch(() => {});
      const bodyText = await page.innerText("body");
      expect(bodyText.includes(`${PREFIX} Lead Protagonist`), `Admin opportunities directory must contain seeded '${PREFIX} Lead Protagonist'`);
    });

    // Page 11: Projects Directory
    await checkPage(adminPage, `${frontendUrl}/admin/projects`, "Admin", "Projects directory contains seeded 'E2E-SWEEP2 Feature Film'", async (page) => {
      await page.waitForFunction((prefix) => document.body.innerText.includes(`${prefix} Feature Film`), PREFIX, { timeout: 8000 }).catch(() => {});
      const bodyText = await page.innerText("body");
      expect(bodyText.includes(`${PREFIX} Feature Film`), `Admin projects directory must contain seeded '${PREFIX} Feature Film'`);
    });

    // Page 12: Applications Registry
    await checkPage(adminPage, `${frontendUrl}/admin/applications`, "Admin", "Applications registry contains seeded application", async (page) => {
      await page.waitForFunction((prefix) => document.body.innerText.includes(`${prefix} Lead Protagonist`) || document.body.innerText.includes(`${prefix} Talent Artist`), PREFIX, { timeout: 8000 }).catch(() => {});
      const bodyText = await page.innerText("body");
      expect(bodyText.includes(`${PREFIX} Lead Protagonist`) || bodyText.includes(`${PREFIX} Talent Artist`), "Admin applications registry must contain seeded application");
    });

    // Page 13: Payments & Escrow
    await checkPage(adminPage, `${frontendUrl}/admin/payments`, "Admin", "Payments page contains seeded payment transaction (4,999)", async (page) => {
      await page.waitForFunction((prefix) => document.body.innerText.includes("4,999") || document.body.innerText.includes(prefix), PREFIX, { timeout: 8000 }).catch(() => {});
      const bodyText = await page.innerText("body");
      expect(bodyText.includes("4,999") || bodyText.includes(PREFIX), "Admin payments page must contain seeded payment record");
    });

    // Page 14: Credits Ledger
    await checkPage(adminPage, `${frontendUrl}/admin/credits`, "Admin", "Credits ledger contains seeded org 'E2E-SWEEP2 Productions'", async (page) => {
      await page.waitForFunction((prefix) => document.body.innerText.includes(`${prefix} Productions`) || document.body.innerText.includes("100"), PREFIX, { timeout: 8000 }).catch(() => {});
      const bodyText = await page.innerText("body");
      expect(bodyText.includes(`${PREFIX} Productions`) || bodyText.includes("100"), "Admin credits ledger must contain seeded org credit record");
    });

    // -----------------------------------------------------------------
    // 7. TEST ORGANIZATION PANEL (8 PAGES)
    // -----------------------------------------------------------------
    console.log("\n================================================================");
    console.log("TESTING ORGANIZATION PANEL (8 PAGES)");
    console.log("================================================================");

    const orgContext = await browser.newContext();
    const orgPage = await orgContext.newPage();

    // Set auth tokens for org
    await orgPage.goto(`${frontendUrl}/login`, { waitUntil: "domcontentloaded" });
    await orgPage.evaluate(({ token, user }) => {
      localStorage.setItem("vismaya_auth_token", token);
      localStorage.setItem("vismaya_user_data", JSON.stringify(user));
      document.cookie = `token=${token}; path=/; max-age=7200`;
    }, {
      token: orgToken,
      user: { id: String(storedOrgUser._id), email: testOrgEmail, role: "organization", name: `${PREFIX} Productions` }
    });

    // Page 1: Org Dashboard
    await checkPage(orgPage, `${frontendUrl}/recruiter/dashboard`, "Organization", "Credits element equals exactly 100, active projects listed, no forbidden text", async (page) => {
      await page.waitForFunction(() => {
        const spans = Array.from(document.querySelectorAll("span"));
        const balanceSpan = spans.find(s => s.innerText?.includes("Profile-View Credits Available"));
        const numSpan = balanceSpan ? balanceSpan.previousElementSibling : null;
        return numSpan && numSpan.innerText?.trim() === "100";
      }, { timeout: 10000 });

      const creditsBalance = await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll("span"));
        const balanceSpan = spans.find(s => s.innerText?.includes("Profile-View Credits Available"));
        const numSpan = balanceSpan ? balanceSpan.previousElementSibling : null;
        return numSpan ? numSpan.innerText.trim() : null;
      });
      const bodyText = await page.innerText("body");
      expect(creditsBalance === "100", `Org dashboard credits element expected exactly '100', got '${creditsBalance}'`);
      expect(bodyText.toLowerCase().includes("active projects"), "Org dashboard must render active projects section");
    });

    // Page 2: Projects
    await checkPage(orgPage, `${frontendUrl}/recruiter/projects`, "Organization", "Contains seeded project title 'E2E-SWEEP2 Feature Film'", async (page) => {
      await page.waitForFunction((prefix) => document.body.innerText.includes(`${prefix} Feature Film`), PREFIX, { timeout: 8000 }).catch(() => {});
      const bodyText = await page.innerText("body");
      expect(bodyText.includes(`${PREFIX} Feature Film`), `Recruiter projects page must contain '${PREFIX} Feature Film'`);
    });

    // Page 3: Submit Opportunity
    await checkPage(orgPage, `${frontendUrl}/recruiter/opportunities/new`, "Organization", "New opportunity form rendered with no mock data");

    // Page 4: My Opportunities
    await checkPage(orgPage, `${frontendUrl}/recruiter/opportunities`, "Organization", "Contains seeded opportunity 'E2E-SWEEP2 Lead Protagonist'", async (page) => {
      await page.waitForFunction((prefix) => document.body.innerText.includes(`${prefix} Lead Protagonist`), PREFIX, { timeout: 8000 }).catch(() => {});
      const bodyText = await page.innerText("body");
      expect(bodyText.includes(`${PREFIX} Lead Protagonist`), `Recruiter opportunities page must contain '${PREFIX} Lead Protagonist'`);
    });

    // Page 5: Shortlist & Auditions
    await checkPage(orgPage, `${frontendUrl}/recruiter/shortlist-auditions`, "Organization", "Shortlist and audition management rendered");
    // Page 6: Notifications
    await checkPage(orgPage, `${frontendUrl}/recruiter/notifications`, "Organization", "Organization notifications rendered");

    // Page 7: Credits
    await checkPage(orgPage, `${frontendUrl}/recruiter/credits`, "Organization", "Credits balance 100 and transaction history rendered", async (page) => {
      await page.waitForFunction(() => document.body.innerText.includes("100"), null, { timeout: 8000 }).catch(() => {});
      const bodyText = await page.innerText("body");
      expect(bodyText.includes("100"), "Credits page must reflect 100 balance");
    });

    // Page 8: Settings
    await checkPage(orgPage, `${frontendUrl}/recruiter/settings`, "Organization", "Organization settings rendered");

    // -----------------------------------------------------------------
    // 8. TEST TALENT PANEL (8 PAGES)
    // -----------------------------------------------------------------
    console.log("\n================================================================");
    console.log("TESTING TALENT PANEL (8 PAGES)");
    console.log("================================================================");

    const talentContext = await browser.newContext();
    const talentPage = await talentContext.newPage();

    // Set auth tokens for talent
    await talentPage.goto(`${frontendUrl}/login`, { waitUntil: "domcontentloaded" });
    await talentPage.evaluate(({ token, user }) => {
      localStorage.setItem("vismaya_auth_token", token);
      localStorage.setItem("vismaya_user_data", JSON.stringify(user));
      document.cookie = `token=${token}; path=/; max-age=7200`;
    }, {
      token: talentToken,
      user: { id: String(storedTalentUser._id), email: testTalentEmail, role: "talent", name: `${PREFIX} Talent Artist` }
    });

    // Page 1: Talent Dashboard
    await checkPage(talentPage, `${frontendUrl}/talent/dashboard`, "Talent", "Applications StatCard equals exactly 1", async (page) => {
      await page.waitForFunction(() => {
        const cards = Array.from(document.querySelectorAll(".stat-card-consistent"));
        const appCard = cards.find(c => c.querySelector(".stat-card-label")?.innerText?.includes("APPLICATIONS"));
        const num = appCard?.querySelector(".stat-card-number")?.innerText?.trim();
        return num === "1";
      }, { timeout: 10000 });

      const statCards = await page.$$eval(".stat-card-consistent", (cards) => {
        return cards.map(c => ({
          label: c.querySelector(".stat-card-label")?.innerText?.trim(),
          num: c.querySelector(".stat-card-number")?.innerText?.trim()
        }));
      });
      const appCard = statCards.find(c => c.label && c.label.includes("APPLICATIONS"));
      expect(appCard && appCard.num === "1", `Talent Dashboard applications StatCard expected '1', got '${appCard?.num}'`);
    });

    // Page 2: My Profile
    await checkPage(talentPage, `${frontendUrl}/talent/profile`, "Talent", "Talent comp-card and profile editor rendered");
    // Page 3: Portfolio
    await checkPage(talentPage, `${frontendUrl}/talent/portfolio`, "Talent", "Media gallery and portfolio upload view rendered");

    // Page 4: Opportunities
    await checkPage(talentPage, `${frontendUrl}/talent/opportunities`, "Talent", "Opportunities feed contains published opportunity 'E2E-SWEEP2 Lead Protagonist'", async (page) => {
      await page.waitForFunction((prefix) => document.body.innerText.includes(`${prefix} Lead Protagonist`), PREFIX, { timeout: 8000 }).catch(() => {});
      const bodyText = await page.innerText("body");
      expect(bodyText.includes(`${PREFIX} Lead Protagonist`), `Talent opportunities feed must contain '${PREFIX} Lead Protagonist'`);
    });

    // Page 5: My Applications
    await checkPage(talentPage, `${frontendUrl}/talent/applications`, "Talent", "Applied opportunities contains 'E2E-SWEEP2 Lead Protagonist'", async (page) => {
      await page.waitForFunction((prefix) => document.body.innerText.includes(`${prefix} Lead Protagonist`), PREFIX, { timeout: 8000 }).catch(() => {});
      const bodyText = await page.innerText("body");
      expect(bodyText.includes(`${PREFIX} Lead Protagonist`), `Talent applications page must contain '${PREFIX} Lead Protagonist'`);
    });

    // Page 6: Auditions
    await checkPage(talentPage, `${frontendUrl}/talent/auditions`, "Talent", "Auditions view rendered");
    // Page 7: Notifications
    await checkPage(talentPage, `${frontendUrl}/talent/notifications`, "Talent", "Talent notifications rendered");
    // Page 8: Settings
    await checkPage(talentPage, `${frontendUrl}/talent/settings`, "Talent", "Talent account settings rendered");

  } finally {
    clearTimeout(hardCapTimer);
    if (browser) await browser.close();

    // -----------------------------------------------------------------
    // 9. CLEANUP: Clean up tracked test data with counts
    // -----------------------------------------------------------------
    console.log("\n================================================================");
    console.log("CLEANING UP TRACKED E2E-SWEEP2 DATA");
    console.log("================================================================");

    const cleanedCounts = {};
    if (tracked.users.length) {
      const res = await db.collection("users").deleteMany({ _id: { $in: tracked.users } });
      cleanedCounts.users = res.deletedCount;
    }
    if (tracked.talentProfiles.length) {
      const res = await db.collection("talentprofiles").deleteMany({ _id: { $in: tracked.talentProfiles } });
      cleanedCounts.talentProfiles = res.deletedCount;
    }
    if (tracked.organizations.length) {
      const res = await db.collection("organizations").deleteMany({ _id: { $in: tracked.organizations } });
      cleanedCounts.organizations = res.deletedCount;
    }
    if (tracked.ledgers.length) {
      const res = await db.collection("creditledgers").deleteMany({ _id: { $in: tracked.ledgers } });
      cleanedCounts.ledgers = res.deletedCount;
    }
    if (tracked.projects.length) {
      const res = await db.collection("projects").deleteMany({ _id: { $in: tracked.projects } });
      cleanedCounts.projects = res.deletedCount;
    }
    if (tracked.opportunities.length) {
      const res = await db.collection("opportunities").deleteMany({ _id: { $in: tracked.opportunities } });
      cleanedCounts.opportunities = res.deletedCount;
    }
    if (tracked.applications.length) {
      const res = await db.collection("applications").deleteMany({ _id: { $in: tracked.applications } });
      cleanedCounts.applications = res.deletedCount;
    }
    if (tracked.transactions.length) {
      const res = await db.collection("paymenttransactions").deleteMany({ _id: { $in: tracked.transactions } });
      cleanedCounts.paymentTransactions = res.deletedCount;
    }
    if (tracked.notifications.length) {
      const res = await db.collection("notifications").deleteMany({ _id: { $in: tracked.notifications } });
      cleanedCounts.notifications = res.deletedCount;
    }
    if (tracked.otps.length) {
      const res = await db.collection("otps").deleteMany({ _id: { $in: tracked.otps } });
      cleanedCounts.otps = res.deletedCount;
    }
    if (tracked.sessions.length) {
      const res = await db.collection("usersessions").deleteMany({ _id: { $in: tracked.sessions } });
      cleanedCounts.sessions = res.deletedCount;
    }
    console.log("Cleanup completed with counts:", JSON.stringify(cleanedCounts));

    // Verify 9 orphan profiles are untouched
    const allFinalProfiles = await db.collection("talentprofiles").find({}).toArray();
    const allFinalUsers = await db.collection("users").find({}, { projection: { _id: 1 } }).toArray();
    const finalUserIdsSet = new Set(allFinalUsers.map(u => u._id.toString()));
    const finalOrphans = allFinalProfiles.filter(p => !finalUserIdsSet.has(p.userId?.toString())).length;
    console.log(`Final orphan profiles count: ${finalOrphans} (expected: ${initialOrphans})`);
    expect(finalOrphans === initialOrphans, `CRITICAL: Orphan profiles count changed from ${initialOrphans} to ${finalOrphans}!`);
    console.log("PASS: 9 orphan profiles completely untouched.");

    // Close Mongo connection
    await mongoose.disconnect();
  }

  console.log(`\n================================================================`);
  console.log(`SWEEP PLAYWRIGHT TEST SUMMARY: ${pageResults.length} PAGES TESTED`);
  console.log(`================================================================`);
  console.table(pageResults);

  const hasFailures = pageResults.some(r => r.status === "FAILED");
  if (hasFailures) {
    console.error("\n❌ ONE OR MORE PAGES FAILED ASSERTIONS. EXITING WITH CODE 1.\n");
    process.exit(1);
  }

  console.log("\n>>> ALL SWEEP PLAYWRIGHT CHECKS PASSED HONESTLY <<<\n");
  process.exit(0);
}

runSweepTest().catch((err) => {
  console.error("\n❌ Sweep test failed with error:\n", err);
  process.exit(1);
});
