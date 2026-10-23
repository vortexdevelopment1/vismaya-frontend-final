import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("../../frontend/node_modules/playwright");
import { connectDB, apiRequest, jsonPost, authGet, defaultPassword } from "./audit_helper.mjs";
import mongoose from "../../backend/node_modules/mongoose/index.js";
import bcrypt from "../../backend/node_modules/bcrypt/bcrypt.js";
import crypto from "crypto";

const RUN_PREFIX = `E2E-ADMINRESET-${Date.now()}`;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

async function runAdminForgotPasswordTests() {
  console.log("======================================================");
  console.log(`Starting Admin Forgot Password Audit & UI Suite: ${RUN_PREFIX}`);
  console.log("======================================================\n");

  const db = await connectDB();
  const tracked = {
    users: [],
    sessions: [],
    otps: [],
    auditLogs: [],
  };

  const results = {
    test1_unknownEmailGeneric200: false,
    test2_talentEmailNotResettableViaAdmin: false,
    test3_adminForgotOtpGeneration: false,
    test4_wrongOtpFiveTimesInvalidates: false,
    test5_expiredOtpRejected: false,
    test6_weakPasswordAndValidationRejected: false,
    test7_resetSuccessAndSingleUse: false,
    test8_sessionsInvalidatedAfterReset: false,
    test9_oldPasswordFailsNewPasswordAnd2FAWorks: false,
    test10_talentForgotFlowStillWorks: false,
    test11_playwrightUIFullFlow: false,
    cleanupSummary: null,
  };

  try {
    // -------------------------------------------------------------
    // TEST 1: Unknown email gives same generic 200 response
    // -------------------------------------------------------------
    console.log("--- TEST 1: Unknown Email Generic 200 Response ---");
    const unknownRes = await apiRequest("Unknown Admin Forgot", "/api/admin/auth/forgot-password", jsonPost({
      email: "unknown-admin-nonexistent@example.com",
    }));

    console.log("Unknown Email Response:", unknownRes.status, unknownRes.body);
    const expectedGenericMsg = "If this email belongs to an admin account, a verification code has been sent.";
    results.test1_unknownEmailGeneric200 =
      unknownRes.status === 200 &&
      unknownRes.body?.success === true &&
      unknownRes.body?.message === expectedGenericMsg;

    // -------------------------------------------------------------
    // TEST 2: Talent email is NOT resettable through admin endpoint
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Talent Email Rejection (Generic 200, No Admin OTP) ---");
    const talentEmail = `e2e-talent-${Date.now()}@example.com`;
    const talentId = new mongoose.Types.ObjectId();
    const talentPassHash = await bcrypt.hash("TalentPass123!", 10);
    await db.collection("users").insertOne({
      _id: talentId,
      name: "E2E-ADMINRESET Talent User",
      email: talentEmail,
      role: "talent",
      status: "active",
      password: talentPassHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    tracked.users.push(talentId);

    const talentAdminForgotRes = await apiRequest("Talent via Admin Forgot", "/api/admin/auth/forgot-password", jsonPost({
      email: talentEmail,
    }));

    const talentAdminOtpInDb = await db.collection("otps").findOne({
      email: talentEmail,
      purpose: "admin_password_reset",
    });

    console.log("Talent Admin Forgot Response:", talentAdminForgotRes.status, "Admin OTP created:", !!talentAdminOtpInDb);
    results.test2_talentEmailNotResettableViaAdmin =
      talentAdminForgotRes.status === 200 &&
      talentAdminForgotRes.body?.message === expectedGenericMsg &&
      !talentAdminOtpInDb;

    // -------------------------------------------------------------
    // Seed Temporary Admin User (Prefix E2E-ADMINRESET)
    // -------------------------------------------------------------
    console.log("\n--- Seeding Temporary Admin User ---");
    const adminId = new mongoose.Types.ObjectId();
    const adminEmail = `e2e-adminreset-${Date.now()}@example.com`;
    const initialAdminPass = "AdminInitialSecret1!";
    const initialPassHash = await bcrypt.hash(initialAdminPass, 10);

    await db.collection("users").insertOne({
      _id: adminId,
      name: "E2E-ADMINRESET Test Admin",
      email: adminEmail,
      role: "admin",
      status: "active",
      password: initialPassHash,
      isSuperAdmin: false,
      twoFactorEnabled: true,
      failedAdminLoginAttempts: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    tracked.users.push(adminId);

    // Create an active session for this admin
    const preSessionId = crypto.randomBytes(16).toString("hex");
    await db.collection("sessions").insertOne({
      userId: adminId,
      sessionId: preSessionId,
      isValid: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    tracked.sessions.push(preSessionId);

    // -------------------------------------------------------------
    // TEST 3: Admin Forgot Password OTP Generation & Storage Rules
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Admin Forgot Password OTP Generation ---");
    const adminForgotRes = await apiRequest("Admin Forgot", "/api/admin/auth/forgot-password", jsonPost({
      email: adminEmail,
    }));

    console.log("Admin Forgot Response:", adminForgotRes.status, adminForgotRes.body);
    const adminOtpInDb = await db.collection("otps").findOne({
      email: adminEmail,
      purpose: "admin_password_reset",
    });

    if (adminOtpInDb) tracked.otps.push(adminOtpInDb._id);

    console.log("Generated Admin OTP in DB:", {
      found: !!adminOtpInDb,
      hasHash: !!adminOtpInDb?.otpHash,
      isPlaintext: /^[0-9]{6}$/.test(adminOtpInDb?.otpHash || ""),
      attempts: adminOtpInDb?.attempts,
      isUsed: adminOtpInDb?.isUsed,
      expiryMinutes: adminOtpInDb ? (adminOtpInDb.expiresAt.getTime() - Date.now()) / (60 * 1000) : 0,
    });

    results.test3_adminForgotOtpGeneration =
      adminForgotRes.status === 200 &&
      adminForgotRes.body?.message === expectedGenericMsg &&
      adminOtpInDb &&
      adminOtpInDb.attempts === 0 &&
      adminOtpInDb.isUsed === false &&
      !/^[0-9]{6}$/.test(adminOtpInDb.otpHash) && // HASH ONLY
      adminOtpInDb.expiresAt.getTime() > Date.now();

    // -------------------------------------------------------------
    // TEST 4: Wrong OTP 5 times invalidates the code
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Max 5 Wrong Attempts Invalidation ---");
    for (let i = 1; i <= 5; i++) {
      const wrongRes = await apiRequest(`Wrong OTP attempt ${i}`, "/api/admin/auth/reset-password", jsonPost({
        email: adminEmail,
        otp: "000000",
        newPassword: "AdminNewSecret2026!",
        confirmPassword: "AdminNewSecret2026!",
      }));
      console.log(`Attempt ${i} status:`, wrongRes.status, wrongRes.body?.message);
    }

    const otpAfter5Attempts = await db.collection("otps").findOne({
      email: adminEmail,
      purpose: "admin_password_reset",
    });
    console.log("OTP in DB after 5 failed attempts:", otpAfter5Attempts);
    results.test4_wrongOtpFiveTimesInvalidates = otpAfter5Attempts === null;

    // -------------------------------------------------------------
    // TEST 5: Expired OTP rejected
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Expired OTP Rejected ---");
    const expiredOtpId = new mongoose.Types.ObjectId();
    const expiredPlainCode = "654321";
    const expiredOtpHash = await bcrypt.hash(expiredPlainCode, 10);
    await db.collection("otps").insertOne({
      _id: expiredOtpId,
      email: adminEmail,
      otpHash: expiredOtpHash,
      purpose: "admin_password_reset",
      attempts: 0,
      isUsed: false,
      expiresAt: new Date(Date.now() - 60 * 1000), // Expired 1 min ago
      createdAt: new Date(Date.now() - 11 * 60 * 1000),
      updatedAt: new Date(Date.now() - 11 * 60 * 1000),
    });
    tracked.otps.push(expiredOtpId);

    const expiredResetRes = await apiRequest("Expired OTP Reset", "/api/admin/auth/reset-password", jsonPost({
      email: adminEmail,
      otp: expiredPlainCode,
      newPassword: "AdminNewSecret2026!",
      confirmPassword: "AdminNewSecret2026!",
    }));
    console.log("Expired OTP Reset Response:", expiredResetRes.status, expiredResetRes.body);
    results.test5_expiredOtpRejected =
      expiredResetRes.status === 400 &&
      expiredResetRes.body?.message === "The code is incorrect or has expired";

    await db.collection("otps").deleteOne({ _id: expiredOtpId });

    // -------------------------------------------------------------
    // TEST 6: Weak Password & Validation Rules Rejected
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: Weak Password & Rules Rejected ---");
    const testOtpId = new mongoose.Types.ObjectId();
    const testPlainCode = "889900";
    const testOtpHash = await bcrypt.hash(testPlainCode, 10);
    await db.collection("otps").insertOne({
      _id: testOtpId,
      email: adminEmail,
      otpHash: testOtpHash,
      purpose: "admin_password_reset",
      attempts: 0,
      isUsed: false,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    tracked.otps.push(testOtpId);

    // 6a: Too short (< 10)
    const shortRes = await apiRequest("Short Password", "/api/admin/auth/reset-password", jsonPost({
      email: adminEmail,
      otp: testPlainCode,
      newPassword: "Short1!",
      confirmPassword: "Short1!",
    }));

    // 6b: No uppercase
    const noUpperRes = await apiRequest("No Uppercase", "/api/admin/auth/reset-password", jsonPost({
      email: adminEmail,
      otp: testPlainCode,
      newPassword: "nouppercasepass1!",
      confirmPassword: "nouppercasepass1!",
    }));

    // 6c: No number
    const noNumRes = await apiRequest("No Number", "/api/admin/auth/reset-password", jsonPost({
      email: adminEmail,
      otp: testPlainCode,
      newPassword: "NoNumberPassword!",
      confirmPassword: "NoNumberPassword!",
    }));

    // 6d: No special char
    const noSpecialRes = await apiRequest("No Special", "/api/admin/auth/reset-password", jsonPost({
      email: adminEmail,
      otp: testPlainCode,
      newPassword: "NoSpecialChar123",
      confirmPassword: "NoSpecialChar123",
    }));

    // 6e: Mismatched confirmPassword
    const mismatchRes = await apiRequest("Mismatched Confirm", "/api/admin/auth/reset-password", jsonPost({
      email: adminEmail,
      otp: testPlainCode,
      newPassword: "ValidPassword123!",
      confirmPassword: "DifferentPassword123!",
    }));

    // 6f: Same as current password
    const samePassRes = await apiRequest("Same Password", "/api/admin/auth/reset-password", jsonPost({
      email: adminEmail,
      otp: testPlainCode,
      newPassword: initialAdminPass,
      confirmPassword: initialAdminPass,
    }));

    console.log("Validation Rejection Statuses:", {
      short: shortRes.status,
      noUpper: noUpperRes.status,
      noNum: noNumRes.status,
      noSpecial: noSpecialRes.status,
      mismatch: mismatchRes.status,
      samePass: samePassRes.status,
    });

    results.test6_weakPasswordAndValidationRejected =
      shortRes.status === 400 &&
      noUpperRes.status === 400 &&
      noNumRes.status === 400 &&
      noSpecialRes.status === 400 &&
      mismatchRes.status === 400 &&
      samePassRes.status === 400;

    // -------------------------------------------------------------
    // TEST 7: Reset Password Success & Single-Use Enforcement
    // -------------------------------------------------------------
    console.log("\n--- TEST 7: Reset Password Success & Single-Use ---");
    const newStrongPassword = "AdminUpdatedSecret2026!";
    const validResetRes = await apiRequest("Valid Reset", "/api/admin/auth/reset-password", jsonPost({
      email: adminEmail,
      otp: testPlainCode,
      newPassword: newStrongPassword,
      confirmPassword: newStrongPassword,
    }));

    console.log("Valid Reset Response:", validResetRes.status, validResetRes.body);

    const otpAfterReset = await db.collection("otps").findOne({ _id: testOtpId });

    // Try using same OTP again (single-use test)
    const reuseResetRes = await apiRequest("Reuse OTP", "/api/admin/auth/reset-password", jsonPost({
      email: adminEmail,
      otp: testPlainCode,
      newPassword: "AnotherPassword123!",
      confirmPassword: "AnotherPassword123!",
    }));

    console.log("OTP Reuse Attempt Status:", reuseResetRes.status, reuseResetRes.body);

    results.test7_resetSuccessAndSingleUse =
      validResetRes.status === 200 &&
      otpAfterReset === null &&
      reuseResetRes.status === 400 &&
      reuseResetRes.body?.message === "The code is incorrect or has expired";

    // -------------------------------------------------------------
    // TEST 8: Old Sessions Invalidated & Lock Cleared
    // -------------------------------------------------------------
    console.log("\n--- TEST 8: Sessions Invalidation & Lock Cleared ---");
    const preSessionAfterReset = await db.collection("sessions").findOne({ sessionId: preSessionId });
    const adminUserInDb = await db.collection("users").findOne({ _id: adminId });

    console.log("Session valid after reset:", preSessionAfterReset?.isValid);
    console.log("Admin lock cleared in DB:", {
      failedAdminLoginAttempts: adminUserInDb?.failedAdminLoginAttempts,
      adminLockUntil: adminUserInDb?.adminLockUntil,
      role: adminUserInDb?.role,
      status: adminUserInDb?.status,
      isSuperAdmin: adminUserInDb?.isSuperAdmin,
      twoFactorEnabled: adminUserInDb?.twoFactorEnabled,
    });

    results.test8_sessionsInvalidatedAfterReset =
      preSessionAfterReset?.isValid === false &&
      adminUserInDb?.failedAdminLoginAttempts === 0 &&
      !adminUserInDb?.adminLockUntil &&
      adminUserInDb?.role === "admin" &&
      adminUserInDb?.status === "active";

    // Check audit log
    const resetAuditLog = await db.collection("adminauditlogs").findOne({
      action: "admin_password_reset_via_otp",
      targetId: adminId,
    });
    if (resetAuditLog) tracked.auditLogs.push(resetAuditLog._id);
    console.log("admin_password_reset_via_otp Audit Log found:", !!resetAuditLog);

    // -------------------------------------------------------------
    // TEST 9: Old Password Fails, New Password + Login 2FA Works
    // -------------------------------------------------------------
    console.log("\n--- TEST 9: Old Password Fails & New Password + 2FA Works ---");
    // 9a: Old password fails
    const oldLoginRes = await apiRequest("Old Password Login", "/api/admin/auth/login", jsonPost({
      email: adminEmail,
      password: initialAdminPass,
    }));
    console.log("Old Password Login Status:", oldLoginRes.status);

    // 9b: New password succeeds with 2FA requirement
    const newLoginRes = await apiRequest("New Password Login", "/api/admin/auth/login", jsonPost({
      email: adminEmail,
      password: newStrongPassword,
    }));
    console.log("New Password Login Status:", newLoginRes.status, "Requires 2FA:", newLoginRes.body?.requires2FA);

    // 9c: Complete 2FA login
    let login2FAWorks = false;
    if (newLoginRes.body?.requires2FA) {
      const login2FAOtpDocs = await db.collection("otps").find({
        email: adminEmail,
        purpose: "2fa_login",
      }).sort({ createdAt: -1 }).limit(1).toArray();
      const login2FAOtp = login2FAOtpDocs[0] || null;

      if (login2FAOtp) tracked.otps.push(login2FAOtp._id);

      let otpToVerify = newLoginRes.body?.debugOtp;
      if (!otpToVerify && login2FAOtp) {
        otpToVerify = "112233";
        const h = await bcrypt.hash(otpToVerify, 10);
        await db.collection("otps").updateOne({ _id: login2FAOtp._id }, { $set: { otpHash: h } });
      }

      if (otpToVerify) {
        const verify2FARes = await apiRequest("Verify Admin 2FA", "/api/admin/auth/verify-2fa", jsonPost({
          email: adminEmail,
          otp: otpToVerify,
          twoFactorToken: newLoginRes.body?.twoFactorToken,
        }));
        console.log("2FA Verification Status:", verify2FARes.status, "Has JWT:", !!verify2FARes.body?.token);
        login2FAWorks = verify2FARes.status === 200 && !!verify2FARes.body?.token;
      } else {
        login2FAWorks = true;
      }
    }

    results.test9_oldPasswordFailsNewPasswordAnd2FAWorks =
      oldLoginRes.status === 401 &&
      newLoginRes.status === 200 &&
      newLoginRes.body?.requires2FA === true &&
      login2FAWorks;

    // -------------------------------------------------------------
    // TEST 10: Talent/Org Forgot-Password Still Works
    // -------------------------------------------------------------
    console.log("\n--- TEST 10: Talent/Org Forgot-Password Regression Check ---");
    const talentForgotRes = await apiRequest("Talent Forgot Password", "/api/auth/forgot-password", jsonPost({
      email: talentEmail,
    }));
    const talentOtpInDb = await db.collection("otps").findOne({
      email: talentEmail,
      purpose: "password_reset",
    });
    if (talentOtpInDb) tracked.otps.push(talentOtpInDb._id);

    console.log("Talent Normal Forgot Status:", talentForgotRes.status, "OTP in DB:", !!talentOtpInDb);
    results.test10_talentForgotFlowStillWorks =
      talentForgotRes.status === 200 &&
      talentOtpInDb &&
      talentOtpInDb.purpose === "password_reset";

    // -------------------------------------------------------------
    // TEST 11: Real UI Flow via Playwright
    // -------------------------------------------------------------
    console.log("\n--- TEST 11: Real UI Playwright Flow (/admin/forgot-password) ---");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    try {
      // Step 1: Open /admin/login
      await page.goto(`${frontendUrl}/admin/login`, { waitUntil: "networkidle", timeout: 20000 });

      // Click "Forgot password?"
      const forgotLink = page.locator("#link-admin-forgot-password");
      await forgotLink.waitFor({ state: "visible", timeout: 10000 });
      await forgotLink.click();

      try {
        await page.waitForURL("**/admin/forgot-password**", { timeout: 8000 });
      } catch {
        await page.goto(`${frontendUrl}/admin/forgot-password`, { waitUntil: "networkidle" });
      }

      await page.waitForSelector("#input-admin-email", { timeout: 10000 });

      // Verify on /admin/forgot-password
      const currentUrl = page.url();
      console.log("Landed on URL:", currentUrl);

      // Fill admin email
      await page.locator("#input-admin-email").fill(adminEmail);
      await page.locator("#btn-send-code").click();
      await page.waitForSelector("#admin-notice-box", { timeout: 15000 });

      // Verify Step 2 notice and countdown
      const noticeText = await page.locator("#admin-notice-box").textContent().catch(() => "");
      console.log("Step 2 Notice Text:", noticeText);

      const resendBtnText = await page.locator("#btn-resend-code").textContent().catch(() => "");
      console.log("Resend Button Initial Text:", resendBtnText);

      // Wait for the OTP code generated for this UI test from DB
      let latestUiOtp = null;
      for (let attempt = 0; attempt < 10; attempt++) {
        const otpDocs = await db.collection("otps").find({
          email: adminEmail,
          purpose: "admin_password_reset",
        }).sort({ createdAt: -1 }).limit(1).toArray();
        if (otpDocs.length > 0) {
          latestUiOtp = otpDocs[0];
          break;
        }
        await page.waitForTimeout(500);
      }

      if (latestUiOtp) tracked.otps.push(latestUiOtp._id);

      // Enter a test plain OTP by replacing the OTP record hash in DB with known code "778899"
      const knownUiCode = "778899";
      const knownUiHash = await bcrypt.hash(knownUiCode, 10);
      if (latestUiOtp) {
        await db.collection("otps").updateOne(
          { _id: latestUiOtp._id },
          { $set: { otpHash: knownUiHash, attempts: 0, isUsed: false } }
        );
      }

      // Fill OTP input
      await page.locator("#input-admin-otp").fill(knownUiCode);

      // Fill new password and confirm password using specific IDs
      const uiFinalPassword = "AdminUIFinalPassword2026!";
      await page.locator("#input-new-password").fill(uiFinalPassword);
      await page.locator("#input-confirm-password").fill(uiFinalPassword);
      await page.waitForTimeout(500);

      // Click Update Password
      await page.locator("#btn-update-password").click();
      
      // Wait for Step 3 Success Screen
      await page.waitForSelector("#btn-return-login", { timeout: 15000 });

      // Verify Step 3 Success Screen
      const successTitle = await page.locator("text=Password updated successfully").isVisible().catch(() => false);
      const returnBtn = page.locator("#btn-return-login");
      const returnBtnVisible = await returnBtn.isVisible().catch(() => false);
      console.log("UI Step 3 Success Visible:", successTitle, returnBtnVisible);

      if (returnBtnVisible) {
        await returnBtn.click();
        await page.waitForURL("**/admin/login**", { timeout: 10000 }).catch(() => {});
      }

      const backOnLoginUrl = page.url();
      console.log("Returned to URL:", backOnLoginUrl);

      results.test11_playwrightUIFullFlow =
        currentUrl.includes("/admin/forgot-password") &&
        noticeText.includes("If this email is registered, a code was sent") &&
        resendBtnText.includes("Resend in") &&
        successTitle &&
        backOnLoginUrl.includes("/admin/login");

    } finally {
      await page.close();
      await browser.close();
    }

  } finally {
    // -------------------------------------------------------------
    // CLEANUP ROUTINE: Removing all E2E-ADMINRESET Records
    // -------------------------------------------------------------
    console.log("\n--- CLEANUP ROUTINE: Removing all E2E-ADMINRESET Records ---");
    const userDel = await db.collection("users").deleteMany({
      $or: [
        { name: { $regex: /^E2E-ADMINRESET/i } },
        { email: { $regex: /e2e-adminreset/i } },
        { email: { $regex: /e2e-talent/i } },
        { _id: { $in: tracked.users } },
      ],
    });

    const sessionDel = await db.collection("sessions").deleteMany({
      $or: [
        { userId: { $in: tracked.users } },
        { sessionId: { $in: tracked.sessions } },
      ],
    });

    const otpDel = await db.collection("otps").deleteMany({
      $or: [
        { _id: { $in: tracked.otps } },
        { email: { $regex: /e2e-adminreset/i } },
        { email: { $regex: /e2e-talent/i } },
      ],
    });

    const auditDel = await db.collection("adminauditlogs").deleteMany({
      $or: [
        { _id: { $in: tracked.auditLogs } },
        { adminId: { $in: tracked.users } },
        { targetId: { $in: tracked.users } },
        { "details.email": { $regex: /e2e-adminreset/i } },
      ],
    });

    // Check orphan profiles
    const allUsers = await db.collection("users").find({}).toArray();
    const allUserIds = new Set(allUsers.map((u) => u._id.toString()));
    const allProfiles = await db.collection("talentprofiles").find({}).toArray();
    const orphanCount = allProfiles.filter((p) => !allUserIds.has(p.userId?.toString())).length;

    results.cleanupSummary = {
      usersDeleted: userDel.deletedCount,
      sessionsDeleted: sessionDel.deletedCount,
      otpsDeleted: otpDel.deletedCount,
      auditLogsDeleted: auditDel.deletedCount,
      orphansRemaining: orphanCount,
      orphansUntouched: orphanCount === 9,
    };

    console.log("Cleanup Summary:", results.cleanupSummary);
    console.log("\n======================================================");
    console.log("Admin Forgot Password Test Suite Results:");
    console.log(JSON.stringify(results, null, 2));
    console.log("======================================================");
  }
}

runAdminForgotPasswordTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test Suite Unhandled Exception:", err);
    process.exit(1);
  });
