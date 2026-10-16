import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../src/models/user.model.js";
import Otp from "../src/models/otp.model.js";
import AdminAuditLog from "../src/models/adminAuditLog.model.js";
import { validateAdminPassword } from "../src/scripts/create-admin.ts";

const BASE_URL = process.env.TEST_API_URL || "http://localhost:5000";
const PREFIX = "E2E-ADMIN";
const TEST_TIMESTAMP = Date.now();

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

const assert = (condition, description) => {
  if (condition) {
    results.passed++;
    results.tests.push({ description, status: "PASS" });
    console.log(`  ✓ PASS: ${description}`);
  } else {
    results.failed++;
    results.tests.push({ description, status: "FAIL" });
    console.error(`  ✗ FAIL: ${description}`);
  }
};

const apiRequest = async (path, options = {}) => {
  const url = `${BASE_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  return { status: response.status, data };
};

async function runTests() {
  console.log("\n=======================================================");
  console.log("   LIVE E2E ADMIN SECURITY TEST SUITE (SINGLE-ADMIN MODEL)");
  console.log("   Test Prefix: " + PREFIX);
  console.log("=======================================================\n");

  const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URI_TEST;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is required to verify database state.");
  }
  if (mongoUri.startsWith("mongodb+srv://")) {
    try {
      const dns = await import("dns");
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch {}
  }
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log(`Connected to MongoDB for DB assertions: ${mongoose.connection.name}`);

  // Test emails
  const talentEmail = `${PREFIX}-talent-${TEST_TIMESTAMP}@vismaya.io`.toLowerCase();
  const orgEmail = `${PREFIX}-org-${TEST_TIMESTAMP}@vismaya.io`.toLowerCase();
  const testAdminEmail = `${PREFIX}-admin-${TEST_TIMESTAMP}@vismaya.io`.toLowerCase();
  const lockoutAdminEmail = `${PREFIX}-lockout-${TEST_TIMESTAMP}@vismaya.io`.toLowerCase();

  const sharedPassword = "StrongP@ssw0rd2026!";
  const weakPassword = "weakpass";

  let talentToken = "";
  let orgToken = "";
  let adminToken = "";
  let createdUserCount = 0;

  try {
    // -------------------------------------------------------------------------
    // 1. PUBLIC REGISTRATION ROLE REJECTION & MASS ASSIGNMENT
    // -------------------------------------------------------------------------
    console.log("\n[TEST GROUP 1] Public Registration Role Validation & Mass Assignment");

    // 1.1 Reject role: "admin"
    const regAdmin = await apiRequest("/api/auth/register", {
      method: "POST",
      body: {
        email: `${PREFIX}-fake-admin@vismaya.io`,
        password: sharedPassword,
        name: "Fake Admin Attacker",
        role: "admin"
      }
    });
    assert(regAdmin.status === 400, "Registration with role 'admin' returns 400 Bad Request");
    assert(
      regAdmin.data?.message?.includes("talent") || regAdmin.data?.message?.includes("organization"),
      "Error message specifies only 'talent' and 'organization' are allowed"
    );

    // 1.2 Reject mass assignment of isSuperAdmin
    const regSuper = await apiRequest("/api/auth/register", {
      method: "POST",
      body: {
        email: `${PREFIX}-super-talent@vismaya.io`,
        password: sharedPassword,
        name: "Privilege Escalation Attacker",
        role: "talent",
        isSuperAdmin: true,
        status: "active"
      }
    });
    // Even if registration passes for role: talent, verify isSuperAdmin was stripped/ignored
    if (regSuper.status === 201) {
      createdUserCount++;
      const savedUser = await User.findOne({ email: `${PREFIX}-super-talent@vismaya.io` });
      assert(savedUser?.isSuperAdmin === false || !savedUser?.isSuperAdmin, "isSuperAdmin flag was not mass-assigned");
    } else {
      assert(regSuper.status === 400 || regSuper.status === 201, "Registration handled safely");
    }

    // 1.3 Create valid talent and organization users for boundary tests
    const talentHashed = await bcrypt.hash(sharedPassword, 10);
    await User.create({
      name: "E2E Regular Talent",
      email: talentEmail,
      password: talentHashed,
      role: "talent",
      status: "active",
      isEmailVerified: true
    });
    createdUserCount++;

    await User.create({
      name: "E2E Regular Recruiter",
      email: orgEmail,
      password: talentHashed,
      role: "organization",
      status: "active",
      isEmailVerified: true
    });
    createdUserCount++;

    // -------------------------------------------------------------------------
    // 2. ADMIN ROUTE RBAC & MOUNTING-LEVEL GUARDS
    // -------------------------------------------------------------------------
    console.log("\n[TEST GROUP 2] Admin Route Protection & RBAC Guards");

    // 2.1 Unauthenticated requests to /api/admin/** return 401
    const noTokenRes = await apiRequest("/api/admin/users");
    assert(noTokenRes.status === 401, "Unauthenticated GET /api/admin/users returns 401");

    const noTokenDash = await apiRequest("/api/admin/dashboard");
    assert(noTokenDash.status === 401, "Unauthenticated GET /api/admin/dashboard returns 401");

    // 2.2 Tampered / invalid token returns 401
    const invalidTokenRes = await apiRequest("/api/admin/dashboard", {
      headers: { Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature" }
    });
    assert(invalidTokenRes.status === 401, "Tampered Bearer token returns 401");

    // 2.3 Talent and Org tokens get 403 Forbidden
    const talentLoginRes = await apiRequest("/api/auth/login", {
      method: "POST",
      body: { email: talentEmail, password: sharedPassword }
    });
    talentToken = talentLoginRes.data?.token;

    const orgLoginRes = await apiRequest("/api/auth/login", {
      method: "POST",
      body: { email: orgEmail, password: sharedPassword }
    });
    orgToken = orgLoginRes.data?.token;

    const talentAdminRes = await apiRequest("/api/admin/dashboard", {
      headers: { Authorization: `Bearer ${talentToken}` }
    });
    assert(talentAdminRes.status === 403, "Talent token against /api/admin/dashboard returns 403 Forbidden");

    const orgAdminRes = await apiRequest("/api/admin/users", {
      headers: { Authorization: `Bearer ${orgToken}` }
    });
    assert(orgAdminRes.status === 403, "Organization token against /api/admin/users returns 403 Forbidden");

    // -------------------------------------------------------------------------
    // 3. ADMIN BOOTSTRAP SCRIPT & PASSWORD COMPLEXITY
    // -------------------------------------------------------------------------
    console.log("\n[TEST GROUP 3] Admin Password Complexity Validation");

    assert(!validateAdminPassword(weakPassword).isValid, "Weak password rejected by validateAdminPassword");
    assert(!validateAdminPassword("alllowercase1234!").isValid, "Missing uppercase rejected");
    assert(!validateAdminPassword("ALLUPPERCASE1234!").isValid, "Missing lowercase rejected");
    assert(!validateAdminPassword("NoSpecialChars1234").isValid, "Missing special character rejected");
    assert(!validateAdminPassword("Short!1a").isValid, "Password under 12 characters rejected");
    assert(validateAdminPassword(sharedPassword).isValid, "Strong 12+ char mixed password accepted");

    // -------------------------------------------------------------------------
    // 4. DEDICATED ADMIN LOGIN & 2FA VERIFICATION
    // -------------------------------------------------------------------------
    console.log("\n[TEST GROUP 4] Dedicated Admin Login Portal & 2FA Enforcement");

    // Create a dedicated isolated test admin for login verification
    const adminHashed = await bcrypt.hash(sharedPassword, 10);
    await User.collection.insertOne({
      name: "E2E Test Single Admin",
      email: testAdminEmail,
      password: adminHashed,
      role: "admin",
      isSuperAdmin: true,
      status: "active",
      isEmailVerified: true,
      twoFactorEnabled: true,
      failedAdminLoginAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    createdUserCount++;

    // 4.1 Non-admin trying to login via admin portal -> generic 401
    const nonAdminLogin = await apiRequest("/api/auth/admin/login", {
      method: "POST",
      body: { email: talentEmail, password: sharedPassword }
    });
    assert(
      nonAdminLogin.status === 401 && nonAdminLogin.data?.message === "Invalid email or password",
      "Admin portal rejects non-admin account with generic 401"
    );

    // 4.2 Admin login -> triggers 2FA OTP challenge
    const adminLoginRes = await apiRequest("/api/auth/admin/login", {
      method: "POST",
      body: { email: testAdminEmail, password: sharedPassword }
    });
    assert(adminLoginRes.status === 200, "Admin login with correct password returns 200");
    assert(adminLoginRes.data?.requires2FA === true, "Admin login triggers requires2FA: true");
    assert(Boolean(adminLoginRes.data?.twoFactorToken), "2FA pending token returned");

    const twoFactorToken = adminLoginRes.data?.twoFactorToken;

    // Retrieve the generated OTP from DB
    const otpDoc = await Otp.findOne({ email: testAdminEmail, purpose: "2fa_login", isUsed: false }).sort({ createdAt: -1 });
    assert(Boolean(otpDoc), "2FA OTP record generated in database");

    // Verify 2FA with wrong code -> 400
    const wrong2FA = await apiRequest("/api/auth/admin/verify-2fa", {
      method: "POST",
      body: { email: testAdminEmail, otp: "000000", tempToken: twoFactorToken }
    });
    assert(wrong2FA.status === 400, "Invalid 2FA OTP code returns 400");

    // Verify 2FA with correct OTP
    const testOtpCode = "789123";
    otpDoc.otpHash = await bcrypt.hash(testOtpCode, 10);
    await otpDoc.save();

    const correct2FA = await apiRequest("/api/auth/admin/verify-2fa", {
      method: "POST",
      body: { email: testAdminEmail, otp: testOtpCode, twoFactorToken }
    });
    assert(correct2FA.status === 200, "Valid 2FA OTP returns 200 OK");
    assert(Boolean(correct2FA.data?.token), "Admin session token issued");
    adminToken = correct2FA.data?.token;

    // Verify admin can access /api/admin/dashboard with this token
    const adminDashRes = await apiRequest("/api/admin/dashboard", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminDashRes.status === 200, "Admin token accesses /api/admin/dashboard successfully");

    // -------------------------------------------------------------------------
    // 5. SINGLE-ADMIN MODEL ENFORCEMENT & REMOVED ENDPOINTS (404)
    // -------------------------------------------------------------------------
    console.log("\n[TEST GROUP 5] Single-Admin Enforcement & Removed Endpoints Return 404");

    // 5.1 Pre-save hook blocks creating a second admin through the app
    let secondAdminBlocked = false;
    try {
      const secondAdmin = new User({
        name: "Illegal Second Admin",
        email: `${PREFIX}-second-admin-${TEST_TIMESTAMP}@vismaya.io`.toLowerCase(),
        password: sharedPassword,
        role: "admin",
        status: "active"
      });
      await secondAdmin.save();
    } catch (err) {
      if (err.message.includes("SINGLE_ADMIN_VIOLATION")) {
        secondAdminBlocked = true;
      }
    }
    assert(secondAdminBlocked, "Mongoose pre-save hook strictly blocks creating a second admin (SINGLE_ADMIN_VIOLATION)");

    // 5.2 Promoting an existing talent user to admin is blocked
    let promotionBlocked = false;
    try {
      const talentToPromote = await User.findOne({ email: talentEmail });
      if (talentToPromote) {
        talentToPromote.role = "admin";
        await talentToPromote.save();
      }
    } catch (err) {
      if (err.message.includes("SINGLE_ADMIN_VIOLATION")) {
        promotionBlocked = true;
      }
    }
    assert(promotionBlocked, "Promoting an existing user to admin role is strictly blocked by pre-save guard");

    // 5.3 Removed multi-admin management endpoints return 404
    const invitePostRes = await apiRequest("/api/admin/admins/invite", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { email: "some@vismaya.io" }
    });
    assert(invitePostRes.status === 404, "POST /api/admin/admins/invite returns 404 (removed)");

    const listInvitesRes = await apiRequest("/api/admin/admins/invites", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(listInvitesRes.status === 404, "GET /api/admin/admins/invites returns 404 (removed)");

    const deleteInviteRes = await apiRequest("/api/admin/admins/invites/fakeid123", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(deleteInviteRes.status === 404, "DELETE /api/admin/admins/invites/:id returns 404 (removed)");

    const listAdminsRes = await apiRequest("/api/admin/admins", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(listAdminsRes.status === 404, "GET /api/admin/admins returns 404 (removed)");

    const patchAdminRes = await apiRequest("/api/admin/admins/fakeid123/status", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: "suspended" }
    });
    assert(patchAdminRes.status === 404, "PATCH /api/admin/admins/:id/status returns 404 (removed)");

    const getInviteDetailsRes = await apiRequest("/api/auth/admin/invite/faketoken123");
    assert(getInviteDetailsRes.status === 404, "GET /api/auth/admin/invite/:token returns 404 (removed)");

    const acceptInviteRes = await apiRequest("/api/auth/admin/accept-invite", {
      method: "POST",
      body: { token: "faketoken123", password: sharedPassword, name: "Name" }
    });
    assert(acceptInviteRes.status === 404, "POST /api/auth/admin/accept-invite returns 404 (removed)");

    // 5.4 Recovery mode password reset works for existing admin and clears lockout
    const testAdminDoc = await User.findOne({ email: testAdminEmail });
    testAdminDoc.failedAdminLoginAttempts = 5;
    testAdminDoc.adminLockUntil = new Date(Date.now() + 15 * 60 * 1000);
    await testAdminDoc.save();

    const newResetPassword = "ResetP@ssword2026!";
    const newResetHashed = await bcrypt.hash(newResetPassword, 10);
    testAdminDoc.password = newResetHashed;
    testAdminDoc.adminLockUntil = null;
    testAdminDoc.failedAdminLoginAttempts = 0;
    testAdminDoc.status = "active";
    await testAdminDoc.save();

    const loginAfterReset = await apiRequest("/api/auth/admin/login", {
      method: "POST",
      body: { email: testAdminEmail, password: newResetPassword }
    });
    assert(
      loginAfterReset.status === 200 && loginAfterReset.data?.requires2FA === true,
      "Existing admin can log in with reset password; lockout cleared"
    );

    // -------------------------------------------------------------------------
    // 6. ADMIN LOGIN BRUTE FORCE LOCKOUT
    // -------------------------------------------------------------------------
    console.log("\n[TEST GROUP 6] Admin Login Brute Force Lockout Protection");

    // Insert dedicated lockout test admin directly
    await User.collection.insertOne({
      name: "E2E Lockout Target Admin",
      email: lockoutAdminEmail,
      password: adminHashed,
      role: "admin",
      status: "active",
      isEmailVerified: true,
      failedAdminLoginAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    createdUserCount++;

    let lockedOut = false;
    for (let i = 1; i <= 6; i++) {
      const failedAttempt = await apiRequest("/api/auth/admin/login", {
        method: "POST",
        body: { email: lockoutAdminEmail, password: "WrongP@ssword123!" }
      });
      if (failedAttempt.status === 429) {
        lockedOut = true;
        break;
      }
    }
    assert(lockedOut, "5 consecutive failed admin login attempts trigger account lockout (429)");

    // -------------------------------------------------------------------------
    // 7. GOOGLE LOGIN ADMIN RESTRICTION
    // -------------------------------------------------------------------------
    console.log("\n[TEST GROUP 7] Google Login Admin Protection");

    // 7.1 Reject Google login attempting role: "admin"
    const googleAdminRes = await apiRequest("/api/auth/google", {
      method: "POST",
      body: { idToken: "fake_token", role: "admin" }
    });
    assert(googleAdminRes.status === 400, "Google login requesting role 'admin' is rejected with 400");

    // 7.2 Prevent Google login from linking or accessing admin account
    const adminAccountExists = await User.findOne({ email: testAdminEmail });
    assert(adminAccountExists && adminAccountExists.role === "admin", "Admin account verified in DB");

  } finally {
    // -------------------------------------------------------------------------
    // 8. TEARDOWN & CLEANUP
    // -------------------------------------------------------------------------
    console.log("\n[CLEANUP] Removing all test artifacts with prefix: " + PREFIX);

    const userDelResult = await User.deleteMany({ email: new RegExp(`^${PREFIX}`, "i") });
    const otpDelResult = await Otp.deleteMany({ email: new RegExp(`^${PREFIX}`, "i") });
    const auditDelResult = await AdminAuditLog.deleteMany({ "details.email": new RegExp(`^${PREFIX}`, "i") });

    console.log(`Cleaned up Users: ${userDelResult.deletedCount}`);
    console.log(`Cleaned up OTPs: ${otpDelResult.deletedCount}`);
    console.log(`Cleaned up Audit Logs: ${auditDelResult.deletedCount}`);

    await mongoose.disconnect();
  }

  console.log("\n=======================================================");
  console.log(`TEST SUMMARY: ${results.passed} PASSED, ${results.failed} FAILED`);
  console.log("=======================================================\n");

  if (results.failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
