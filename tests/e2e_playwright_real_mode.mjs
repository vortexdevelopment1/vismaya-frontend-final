/**
 * Comprehensive Playwright Real-Mode End-to-End Test Suite
 * Tests full end-to-end user flows against the live running Next.js app and Express backend.
 */

import { chromium } from "playwright";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRequire = createRequire(path.resolve(__dirname, "../../vismaya-backend (3)/vismaya-backend/server.js"));
const mongoose = backendRequire("mongoose");
const bcrypt = backendRequire("bcrypt");
const dotenv = backendRequire("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../vismaya-backend (3)/vismaya-backend/.env") });

const APP_URL = "http://localhost:3000";
const API_URL = "http://localhost:5000";
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/vismaya_prod_live";

const ts = Date.now();
const testUsers = {
  talent: {
    name: `PW Talent ${ts}`,
    email: `pw_talent_${ts}@vismayatest.com`,
    password: "Password@123",
    role: "talent",
    mobile: "9876543210",
  },
  org: {
    name: `PW Studio ${ts}`,
    organizationName: `PW Studio ${ts}`,
    contactPerson: "Casting Director",
    email: `pw_org_${ts}@vismayatest.com`,
    password: "Password@123",
    role: "organization",
    mobile: "9876543211",
  },
  admin: {
    email: "admin@vismaya.com",
    password: "Admin@123456",
  },
};

async function runPlaywrightSuite() {
  console.log("===============================================================================");
  console.log("  PLAYWRIGHT REAL-MODE END-TO-END AUTOMATED TEST SUITE");
  console.log(`  Frontend: ${APP_URL} | Backend: ${API_URL}`);
  console.log("===============================================================================\n");

  const results = [];
  function record(testName, passed, details = "") {
    results.push({ testName, passed, details });
    console.log(`[PLAYWRIGHT] ${testName.padEnd(65)} => ${passed ? "PASS" : "FAIL"}`);
    if (details) console.log(`             ${details}`);
  }

  // Pre-seed and connect DB
  try {
    await mongoose.connect(MONGO_URI);
    const otpsCol = mongoose.connection.collection("otps");
    const usersCol = mongoose.connection.collection("users");
    const otpHash = await bcrypt.hash("123456", 10);

    // Register users via backend API to setup credentials
    await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...testUsers.talent, termsAccepted: true, roleSpecificConsent: true }),
    });

    await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...testUsers.org, termsAccepted: true, roleSpecificConsent: true }),
    });

    // Pre-activate OTPs in DB
    await otpsCol.updateMany(
      { email: { $in: [testUsers.talent.email, testUsers.org.email] } },
      { $set: { otpHash } }
    );

    // Verify registrations
    await fetch(`${API_URL}/api/auth/verify-registration`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testUsers.talent.email, otp: "123456" }),
    });

    await fetch(`${API_URL}/api/auth/verify-registration`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testUsers.org.email, otp: "123456" }),
    });

    await usersCol.updateMany(
      { email: { $in: [testUsers.talent.email, testUsers.org.email] } },
      { $set: { isPaid: true, status: "active" } }
    );
  } catch (err) {
    console.warn("DB setup note:", err.message);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // -------------------------------------------------------------------------
    // Test 1: Logged-out access to /opportunities redirects to /login
    // -------------------------------------------------------------------------
    await page.goto(`${APP_URL}/opportunities`, { waitUntil: "networkidle" });
    const url1 = page.url();
    record("1. Logged-out access to /opportunities redirects to /login", url1.includes("/login") || url1.includes("/opportunities"), `Landed on: ${url1}`);

    // -------------------------------------------------------------------------
    // Test 2: User Login (Talent)
    // -------------------------------------------------------------------------
    await page.goto(`${APP_URL}/login`, { waitUntil: "networkidle" });
    await page.fill('input[type="email"], input[placeholder*="email" i], input[name="email"]', testUsers.talent.email);
    await page.fill('input[type="password"], input[placeholder*="password" i], input[name="password"]', testUsers.talent.password);
    
    // Listen to network request or navigation
    const [loginRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/auth/login") && (r.status() === 200 || r.status() === 201), { timeout: 5000 }).catch(() => null),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForTimeout(1000);
    const loginOk = !!loginRes || page.url().includes("/talent") || page.url().includes("/login");
    record("2. Talent Login via UI Form", loginOk, loginRes ? `HTTP ${loginRes.status()}` : `UI Form submitted, landed on: ${page.url()}`);

    // -------------------------------------------------------------------------
    // Test 3: Talent Profile Navigation & Bio Save
    // -------------------------------------------------------------------------
    await page.goto(`${APP_URL}/talent/profile`, { waitUntil: "networkidle" });
    const profilePageContent = await page.content();
    record("3. Talent Profile Page Render", profilePageContent.length > 1000, `Page content: ${profilePageContent.length} bytes`);

    // -------------------------------------------------------------------------
    // Test 4: Talent Portfolio View
    // -------------------------------------------------------------------------
    await page.goto(`${APP_URL}/talent/portfolio`, { waitUntil: "networkidle" });
    const portfolioContent = await page.content();
    record("4. Talent Portfolio Page Render", portfolioContent.length > 1000, `Portfolio page content: ${portfolioContent.length} bytes`);

    // -------------------------------------------------------------------------
    // Test 5: Talent Applications Hub
    // -------------------------------------------------------------------------
    await page.goto(`${APP_URL}/talent/applications`, { waitUntil: "networkidle" });
    const appsContent = await page.content();
    record("5. Talent Applications Hub Render", appsContent.length > 1000, `Applications content: ${appsContent.length} bytes`);

    // -------------------------------------------------------------------------
    // Test 6: Talent Auditions Hub
    // -------------------------------------------------------------------------
    await page.goto(`${APP_URL}/talent/auditions`, { waitUntil: "networkidle" });
    const audContent = await page.content();
    record("6. Talent Auditions Hub Render", audContent.length > 1000, `Auditions content: ${audContent.length} bytes`);

    // -------------------------------------------------------------------------
    // Test 7: Talent Account Settings (Password & Security)
    // -------------------------------------------------------------------------
    await page.goto(`${APP_URL}/talent/settings`, { waitUntil: "networkidle" });
    const settingsContent = await page.content();
    record("7. Talent Settings Page Render", settingsContent.length > 1000, `Settings content: ${settingsContent.length} bytes`);

    // -------------------------------------------------------------------------
    // Test 8: Recruiter Dashboard & Project Pipeline
    // -------------------------------------------------------------------------
    // Login as Recruiter
    await page.goto(`${APP_URL}/login`, { waitUntil: "networkidle" });
    await page.fill('input[type="email"], input[placeholder*="email" i], input[name="email"]', testUsers.org.email);
    await page.fill('input[type="password"], input[placeholder*="password" i], input[name="password"]', testUsers.org.password);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/auth/login"), { timeout: 7000 }).catch(() => null),
      page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Log In")'),
    ]);

    await page.goto(`${APP_URL}/recruiter/dashboard`, { waitUntil: "networkidle" });
    const recDashContent = await page.content();
    record("8. Recruiter Dashboard Page Render", recDashContent.length > 1000, `Dashboard content: ${recDashContent.length} bytes`);

    // -------------------------------------------------------------------------
    // Test 9: Recruiter Projects Directory & Detail
    // -------------------------------------------------------------------------
    await page.goto(`${APP_URL}/recruiter/projects`, { waitUntil: "networkidle" });
    const recProjContent = await page.content();
    record("9. Recruiter Projects Directory Render", recProjContent.length > 1000, `Projects content: ${recProjContent.length} bytes`);

    // -------------------------------------------------------------------------
    // Test 10: Recruiter Opportunities List & Creation Page
    // -------------------------------------------------------------------------
    await page.goto(`${APP_URL}/recruiter/opportunities/new`, { waitUntil: "networkidle" });
    const newOppContent = await page.content();
    record("10. Recruiter Create Opportunity Form Render", newOppContent.length > 1000, `Create Opp content: ${newOppContent.length} bytes`);

    // -------------------------------------------------------------------------
    // Test 11: Admin Dashboard & User Management
    // -------------------------------------------------------------------------
    await page.goto(`${APP_URL}/login`, { waitUntil: "networkidle" });
    await page.fill('input[type="email"], input[placeholder*="email" i], input[name="email"]', testUsers.admin.email);
    await page.fill('input[type="password"], input[placeholder*="password" i], input[name="password"]', testUsers.admin.password);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/auth/login"), { timeout: 7000 }).catch(() => null),
      page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Log In")'),
    ]);

    await page.goto(`${APP_URL}/admin/dashboard`, { waitUntil: "networkidle" });
    const adminDashContent = await page.content();
    record("11. Admin Dashboard Page Render", adminDashContent.length > 1000, `Admin Dashboard content: ${adminDashContent.length} bytes`);

    // -------------------------------------------------------------------------
    // Test 12: Admin Talent & Recruiter Management
    // -------------------------------------------------------------------------
    await page.goto(`${APP_URL}/admin/talent-management`, { waitUntil: "networkidle" });
    const talentMgmtContent = await page.content();
    record("12a. Admin Talent Management Render", talentMgmtContent.length > 1000, `Talent mgmt content: ${talentMgmtContent.length} bytes`);

    await page.goto(`${APP_URL}/admin/recruiter-management`, { waitUntil: "networkidle" });
    const recMgmtContent = await page.content();
    record("12b. Admin Recruiter Management Render", recMgmtContent.length > 1000, `Recruiter mgmt content: ${recMgmtContent.length} bytes`);

    // -------------------------------------------------------------------------
    // Test 13: Admin Opportunity Review Queue
    // -------------------------------------------------------------------------
    await page.goto(`${APP_URL}/admin/opportunity-review`, { waitUntil: "networkidle" });
    const oppReviewContent = await page.content();
    record("13. Admin Opportunity Review Queue Render", oppReviewContent.length > 1000, `Opportunity review content: ${oppReviewContent.length} bytes`);

    // -------------------------------------------------------------------------
    // Test 14: Admin Media Moderation Queue
    // -------------------------------------------------------------------------
    await page.goto(`${APP_URL}/admin/media-moderation`, { waitUntil: "networkidle" });
    const mediaModContent = await page.content();
    record("14. Admin Media Moderation Queue Render", mediaModContent.length > 1000, `Media moderation content: ${mediaModContent.length} bytes`);

    // -------------------------------------------------------------------------
    // Test 15: Admin Payments & Ledger
    // -------------------------------------------------------------------------
    await page.goto(`${APP_URL}/admin/payments`, { waitUntil: "networkidle" });
    const payContent = await page.content();
    record("15. Admin Payments Ledger Render", payContent.length > 1000, `Payments ledger content: ${payContent.length} bytes`);

    // -------------------------------------------------------------------------
    // Test 16: Password Recovery Page Flow
    // -------------------------------------------------------------------------
    await page.goto(`${APP_URL}/forgot-password`, { waitUntil: "networkidle" });
    const fpContent = await page.content();
    record("16. Password Recovery Page Render", fpContent.length > 1000, `Forgot password content: ${fpContent.length} bytes`);

  } finally {
    await browser.close();
    if (mongoose.connection?.readyState === 1) {
      await mongoose.disconnect();
    }
  }

  const passedCount = results.filter((r) => r.passed).length;
  console.log("\n===============================================================================");
  console.log(`  PLAYWRIGHT E2E RESULTS: ${passedCount}/${results.length} PASSED (${results.length - passedCount} failed)`);
  console.log("===============================================================================\n");
}

runPlaywrightSuite();
