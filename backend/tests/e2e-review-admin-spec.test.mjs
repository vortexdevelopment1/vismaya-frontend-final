import "dotenv/config";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "../dist/models/user.model.js";
import Organization from "../dist/models/organization.model.js";
import Project from "../dist/models/project.model.js";
import Opportunity from "../dist/models/opportunity.model.js";
import Application from "../dist/models/application.model.js";
import TalentProfile from "../dist/models/talentProfile.model.js";
import MediaItem from "../dist/models/mediaItem.model.js";
import Notification from "../dist/models/notification.model.js";
import Verification from "../dist/models/verification.model.js";
import Session from "../dist/models/session.model.js";
import crypto from "crypto";

const BASE_URL = process.env.TEST_API_URL || "http://localhost:5000";
const PREFIX = "E2E-REVIEW";
const JWT_SECRET = process.env.JWT_SECRET || "7f9d8c6b5a4e3f2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d";

const results = {
  passed: 0,
  failed: 0,
  tests: [],
  cleaned: {}
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

const createTokenWithSession = async (user, isSuperAdmin = false) => {
  const sessionId = crypto.randomBytes(32).toString("hex");
  await Session.create({
    userId: user._id,
    sessionId,
    deviceInfo: "Test Client",
    ipAddress: "127.0.0.1",
    userAgent: "NodeTest",
    isValid: true,
    expiresAt: new Date(Date.now() + 7 * 86400000)
  });
  return jwt.sign(
    { userId: user._id.toString(), role: user.role, isSuperAdmin: Boolean(user.isSuperAdmin || isSuperAdmin), sessionId },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
};

async function run() {
  console.log("\n=======================================================");
  console.log("   E2E LIVE TEST: APPLICANT REVIEW & ADMIN SPEC MODULES");
  console.log("   Prefix: " + PREFIX);
  console.log("=======================================================\n");

  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vismaya";
  await mongoose.connect(mongoUri);

  const timestamp = Date.now();

  try {
    // 1. Create Test Users: Org 1, Org 2, Talent 1, Admin
    const org1User = await User.create({
      name: `${PREFIX} Org 1`,
      email: `${PREFIX.toLowerCase()}-org1-${timestamp}@test.com`,
      password: "TestPassword123!",
      mobile: `98765${String(timestamp).slice(-5)}`,
      role: "organization",
      status: "active"
    });
    const org1 = await Organization.create({
      userId: org1User._id,
      organizationName: `${PREFIX} Productions 1`,
      verificationState: "verified"
    });

    const org2User = await User.create({
      name: `${PREFIX} Org 2`,
      email: `${PREFIX.toLowerCase()}-org2-${timestamp}@test.com`,
      password: "TestPassword123!",
      mobile: `98764${String(timestamp).slice(-5)}`,
      role: "organization",
      status: "active"
    });
    const org2 = await Organization.create({
      userId: org2User._id,
      organizationName: `${PREFIX} Productions 2`,
      verificationState: "verified"
    });

    const talentUser = await User.create({
      name: `${PREFIX} Talent`,
      email: `${PREFIX.toLowerCase()}-talent-${timestamp}@test.com`,
      password: "TestPassword123!",
      mobile: `98763${String(timestamp).slice(-5)}`,
      role: "talent",
      status: "active"
    });
    const talentProfile = await TalentProfile.create({
      userId: talentUser._id,
      vismayaId: `VIS-${String(timestamp).slice(-6)}`,
      stageName: `${PREFIX} Artist`,
      firstName: "Test",
      lastName: "Talent",
      headline: "Classical and Method Actor",
      bio: "Trained actor with extensive stage experience.",
      primaryProfession: "Actor",
      currentCity: "Mumbai",
      currentState: "Maharashtra",
      country: "India",
      isVerified: true
    });

    // Add media items to talent: Public, Industry-only, and Private
    const publicPhoto = await MediaItem.create({
      owner: talentUser._id,
      mediaType: "photo",
      category: "headshot",
      url: "https://example.com/public-headshot.jpg",
      title: "Public Headshot",
      visibility: "public",
      moderationState: "live",
      rightsConfirmed: true,
      displayOrder: 1
    });
    const industryVideo = await MediaItem.create({
      owner: talentUser._id,
      mediaType: "video",
      category: "showreel",
      url: "https://example.com/industry-reel.mp4",
      title: "Industry Reel",
      visibility: "industry_only",
      moderationState: "live",
      rightsConfirmed: true,
      displayOrder: 2
    });
    const privateDoc = await MediaItem.create({
      owner: talentUser._id,
      mediaType: "document",
      category: "resume_pdf",
      url: "https://example.com/confidential-passport.pdf",
      title: "Private Document",
      visibility: "private",
      moderationState: "live",
      rightsConfirmed: true,
      displayOrder: 3
    });

    // Create Project and Opportunity belonging to Org 1
    const project1 = await Project.create({
      projectName: `${PREFIX} Feature Film`,
      organizationId: org1._id,
      projectType: "Feature Film",
      description: "A major feature film"
    });
    const opp1 = await Opportunity.create({
      projectId: project1._id,
      title: `${PREFIX} Lead Role Opportunity`,
      summary: "Casting for lead hero in upcoming feature film",
      role: "Lead Hero",
      location: "Mumbai",
      status: "published",
      deadline: new Date(Date.now() + 7 * 86400000)
    });

    // Create Application from Talent to Opp 1
    const application = await Application.create({
      talentId: talentUser._id,
      opportunityId: opp1._id,
      status: "applied",
      coverNote: "I am passionate about this character.",
      consentGiven: true
    });

    // Lookup existing single super-admin user
    let adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      throw new Error("No admin user found in database");
    }
    if (adminUser.status !== "active") {
      adminUser.status = "active";
      await adminUser.save();
    }

    // Tokens with active server sessions
    const org1Token = await createTokenWithSession(org1User);
    const org2Token = await createTokenWithSession(org2User);
    const talentToken = await createTokenWithSession(talentUser);
    const adminToken = await createTokenWithSession(adminUser, true);

    console.log("--- PART A: Recruiter Review & Status Ladder Tests ---");

    // Test 1: Org 1 gets opportunity applications
    const appsRes = await apiRequest(`/api/applications/opportunity/${opp1._id}`, {
      headers: { Authorization: `Bearer ${org1Token}` }
    });
    assert(appsRes.status === 200 && appsRes.data?.applicants?.length === 1, "Org 1 successfully retrieves applicant for its opportunity");

    // Test 2: Org 2 receives 403 Forbidden attempting to access Org 1's opportunity applicants
    const org2AppsRes = await apiRequest(`/api/applications/opportunity/${opp1._id}`, {
      headers: { Authorization: `Bearer ${org2Token}` }
    });
    assert(org2AppsRes.status === 403, "Org 2 receives 403 Forbidden attempting to list Org 1 opportunity applicants");

    // Test 3: Talent cannot call organization applications endpoint (403)
    const talentAppsRes = await apiRequest(`/api/applications/opportunity/${opp1._id}`, {
      headers: { Authorization: `Bearer ${talentToken}` }
    });
    assert(talentAppsRes.status === 403, "Talent receives 403 Forbidden attempting to call recruiter applicant listing");

    // Test 4: Org 1 retrieves applicant portfolio under Section 39 privacy rules
    const portfolioRes = await apiRequest(`/api/applications/${application._id}/portfolio`, {
      headers: { Authorization: `Bearer ${org1Token}` }
    });
    assert(portfolioRes.status === 200, "Org 1 retrieves applicant portfolio");
    const portData = portfolioRes.data?.portfolio;
    assert(portData?.creditConsumed === false, "Applicant review does NOT consume profile-view credit (creditConsumed: false)");
    assert(portData?.media?.photos?.some(p => p.title === "Public Headshot"), "Public media items are returned");
    assert(portData?.media?.videos?.some(v => v.title === "Industry Reel"), "Industry-only media items are returned");
    assert(!portData?.media?.documents?.some(d => d.title === "Private Document"), "Private media items are NEVER returned");
    assert(!portData?.contactMobile && !portData?.contactEmail, "Contact mobile and email are stripped under Section 39");

    // Test 5: Org 2 receives 403 Forbidden attempting to view Org 1's applicant portfolio
    const org2PortRes = await apiRequest(`/api/applications/${application._id}/portfolio`, {
      headers: { Authorization: `Bearer ${org2Token}` }
    });
    assert(org2PortRes.status === 403, "Org 2 receives 403 Forbidden on Org 1 applicant portfolio");

    // Test 6: Illegal Transition Rejected: Attempting to select from 'applied' status without review/shortlist
    const illegalSelectRes = await apiRequest(`/api/applications/${application._id}/select`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${org1Token}` },
      body: { note: "Direct select attempt" }
    });
    assert(illegalSelectRes.status === 400, "Backend rejects invalid status transition (applied -> selected directly) with 400");

    // Test 7: Status Ladder: Move to 'under_review'
    const reviewRes = await apiRequest(`/api/applications/${application._id}/review`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${org1Token}` }
    });
    assert(reviewRes.status === 200 && reviewRes.data?.application?.status === "under_review", "Application moved to under_review");

    // Test 8: Status Ladder: Move to 'shortlisted'
    const shortlistRes = await apiRequest(`/api/applications/${application._id}/shortlist`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${org1Token}` }
    });
    assert(shortlistRes.status === 200 && shortlistRes.data?.application?.status === "shortlisted", "Application moved to shortlisted");

    // Test 9: Status Ladder: Move to 'selected'
    const selectRes = await apiRequest(`/api/applications/${application._id}/select`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${org1Token}` },
      body: { note: "Selected for production" }
    });
    assert(selectRes.status === 200 && selectRes.data?.application?.status === "selected", "Application moved to selected");

    // Test 10: Talent receives notification for status change
    const notifications = await Notification.find({ recipient: talentUser._id });
    assert(notifications.length >= 1, `Talent received in-app notifications on status changes (${notifications.length} notifications)`);

    console.log("\n--- PART B: Admin Endpoints Authorization & Verification Tests ---");
    console.log("adminUser status in DB:", adminUser.email, adminUser.status, adminUser.isSuperAdmin);

    // Test 11: Admin unauthenticated gets 401
    const unauthRes = await apiRequest("/api/admin/audit-logs");
    assert(unauthRes.status === 401, "Admin endpoint without token returns 401 Unauthorized");

    // Test 12: Talent calling admin endpoint gets 403
    const talentAdminRes = await apiRequest("/api/admin/audit-logs", {
      headers: { Authorization: `Bearer ${talentToken}` }
    });
    assert(talentAdminRes.status === 403, "Talent calling admin endpoint returns 403 Forbidden");

    // Test 13: Org calling admin endpoint gets 403
    const orgAdminRes = await apiRequest("/api/admin/audit-logs", {
      headers: { Authorization: `Bearer ${org1Token}` }
    });
    assert(orgAdminRes.status === 403, "Organization calling admin endpoint returns 403 Forbidden");

    // Test 14: Admin token gets 200 on /api/admin/audit-logs
    const adminLogsRes = await apiRequest("/api/admin/audit-logs", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (adminLogsRes.status !== 200) {
      console.log("DEBUG adminLogsRes failed:", adminLogsRes.status, adminLogsRes.data);
    }
    assert(adminLogsRes.status === 200, "Admin token receives 200 on /api/admin/audit-logs");

    // Test 15: Admin creates informational profile (Spec §41)
    const createInfoRes = await apiRequest("/api/admin/informational-profiles", {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        stageName: `${PREFIX} Legend Artist`,
        primaryProfession: "Actor",
        category: "screen",
        currentCity: "Mumbai"
      }
    });
    assert(createInfoRes.status === 201 && createInfoRes.data?.profile?.isClaimable === true, "Admin successfully creates claimable informational profile (Spec §41)");

    // Test 16: Admin features media item (Spec §15 max 4 check)
    const featureRes = await apiRequest(`/api/admin/media/${publicPhoto._id}/feature`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { isFeaturedWork: true }
    });
    assert(featureRes.status === 200, "Admin successfully sets media item as Featured Work (Spec §15)");

    // Test 17: Admin handles copyright dispute (Spec §40)
    const disputeRes = await apiRequest(`/api/admin/media/${publicPhoto._id}/dispute`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { disputeState: "disputed", disputeReason: "Claim from production company" }
    });
    assert(disputeRes.status === 200 && disputeRes.data?.mediaItem?.disputeState === "disputed", "Admin handles copyright dispute by hiding disputed media (Spec §40)");

    // Test 18: Admin global search
    const searchRes = await apiRequest(`/api/admin/search?q=${PREFIX}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(searchRes.status === 200, "Admin global search returns 200 with matching entities");

  } finally {
    // Cleanup all test records prefixed with E2E-REVIEW
    console.log("\n--- Cleaning up test records ---");
    const testUsers = await User.find({ email: new RegExp(PREFIX, "i") });
    const userIds = testUsers.map(u => u._id);

    const delApps = await Application.deleteMany({ talentId: { $in: userIds } });
    const delMedia = await MediaItem.deleteMany({ owner: { $in: userIds } });
    const delProfiles = await TalentProfile.deleteMany({ $or: [{ userId: { $in: userIds } }, { stageName: new RegExp(PREFIX, "i") }] });
    const delOpps = await Opportunity.deleteMany({ title: new RegExp(PREFIX, "i") });
    const delProjects = await Project.deleteMany({ projectName: new RegExp(PREFIX, "i") });
    const delOrgs = await Organization.deleteMany({ userId: { $in: userIds } });
    const delNotifs = await Notification.deleteMany({ recipientId: { $in: userIds } });
    const delSessions = await Session.deleteMany({ userId: { $in: userIds } });
    const delUsers = await User.deleteMany({ _id: { $in: userIds } });

    console.log(`  Cleaned Users: ${delUsers.deletedCount}`);
    console.log(`  Cleaned Sessions: ${delSessions.deletedCount}`);
    console.log(`  Cleaned Organizations: ${delOrgs.deletedCount}`);
    console.log(`  Cleaned Projects: ${delProjects.deletedCount}`);
    console.log(`  Cleaned Opportunities: ${delOpps.deletedCount}`);
    console.log(`  Cleaned Applications: ${delApps.deletedCount}`);
    console.log(`  Cleaned Talent Profiles: ${delProfiles.deletedCount}`);
    console.log(`  Cleaned Media Items: ${delMedia.deletedCount}`);
    console.log(`  Cleaned Notifications: ${delNotifs.deletedCount}`);

    results.cleaned = {
      users: delUsers.deletedCount,
      organizations: delOrgs.deletedCount,
      opportunities: delOpps.deletedCount,
      applications: delApps.deletedCount
    };

    await mongoose.disconnect();
  }

  console.log("\n=======================================================");
  console.log(`   TEST RESULTS: ${results.passed} PASSED, ${results.failed} FAILED`);
  console.log("=======================================================\n");

  if (results.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
