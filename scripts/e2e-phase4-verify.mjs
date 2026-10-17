import mongoose from "../backend/node_modules/mongoose/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const evidenceDir = path.join(rootDir, "docs", "e2e-evidence", "mock-leak");

if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

const API_BASE = "http://localhost:5000";
const MONGODB_URI = "mongodb+srv://lowanshiarpita_db_user:lmXigXjzPeozujpz@cluster0.ipa6ws6.mongodb.net/vismaya";

async function runPhase4Verification() {
  console.log("=== Phase 4 Live Verification: E2E Real Mode Flow ===");
  const results = {
    step1_registration: null,
    step2_db_verification: null,
    step3_admin_review: null,
    step4_admin_approval: null,
    step5_talent_login_and_pages: null,
    step6_organization_flow: null,
    step7_public_discovery: null,
    verdict: "PENDING"
  };

  await mongoose.connect(MONGODB_URI);
  await mongoose.connection.collection("users").deleteMany({ email: { $regex: /^e2e-mock/i } });
  await mongoose.connection.collection("talentprofiles").deleteMany({ bio: { $regex: /^E2E-MOCK/i } });
  await mongoose.connection.collection("organizations").deleteMany({ $or: [{ organizationName: { $regex: /^E2E-MOCK/i } }, { companyName: { $regex: /^E2E-MOCK/i } }] });

  const timestamp = Date.now();
  const randomSuffix = Math.floor(10000000 + Math.random() * 89999999);
  const testTalentEmail = `e2e-mock-talent-${timestamp}@vismaya.io`;
  const testTalentPhone = `+9191${randomSuffix}`;
  const testTalentName = `E2E-MOCK Artist ${timestamp}`;
  const testTalentBio = `E2E-MOCK-TALENT-BIO-VERIFIED-${timestamp}`;

  // STEP 1: Talent Registration
  console.log("\n1. Registering Talent with distinctive data...");
  const regPayload = {
    role: "talent",
    email: testTalentEmail,
    password: "Password@123",
    name: testTalentName,
    phone: testTalentPhone,
    mobile: testTalentPhone,
    city: "Indore",
    profilePhoto: "https://res.cloudinary.com/e2e-test/image/upload/v1/sample.jpg",
    stageName: testTalentName,
    primaryProfession: "Cinematographer",
    skills: ["Color Grading", "Gaffer", "Drone Pilot"],
    bio: testTalentBio,
    isPaid: true
  };

  const regRes = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(regPayload)
  });
  const regData = await regRes.json();
  console.log("Registration response status:", regRes.status, "token exists:", !!regData.token);
  results.step1_registration = { status: regRes.status, body: regData };

  const talentUserId = regData?.user?.id || regData?.user?._id;
  const talentToken = regData?.token;

  // STEP 2: Direct MongoDB Inspection
  console.log("\n2. Direct MongoDB Inspection...");
  const dbUser = await mongoose.connection.collection("users").findOne({ email: testTalentEmail });
  const dbProfile = await mongoose.connection.collection("talentprofiles").findOne({ userId: dbUser._id });

  console.log("DB User found:", !!dbUser, "Mobile in User doc:", dbUser?.mobile);
  console.log("DB Profile found:", !!dbProfile, "Bio in TalentProfile:", dbProfile?.bio);

  // Activate talent user email for login in test flow
  await mongoose.connection.collection("users").updateOne(
    { _id: dbUser._id },
    { $set: { status: "active", isEmailVerified: true } }
  );

  results.step2_db_verification = {
    userFound: !!dbUser,
    storedUserMobile: dbUser?.mobile,
    profileFound: !!dbProfile,
    storedProfileStageName: dbProfile?.stageName,
    storedProfileBio: dbProfile?.bio,
    storedProfileSkills: dbProfile?.skills
  };

  // STEP 3: Admin Review (Calling Admin APIs with safe dev session)
  console.log("\n3. Admin reviewing talent...");
  const cryptoModule = await import("crypto");
  const jwtModule = await import("../backend/node_modules/jsonwebtoken/index.js");
  const adminUser = await mongoose.connection.collection("users").findOne({ role: "admin", isSuperAdmin: true });
  const adminSessionId = cryptoModule.default.randomBytes(32).toString("hex");
  await mongoose.connection.collection("sessions").insertOne({
    userId: adminUser._id,
    sessionId: adminSessionId,
    deviceInfo: "API Test Client",
    ipAddress: "127.0.0.1",
    userAgent: "E2E-Verifier",
    isValid: true,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });
  const JWT_SECRET = "7f9d8c6b5a4e3f2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d";
  const adminToken = jwtModule.default.sign({
    userId: adminUser._id.toString(),
    role: "admin",
    email: adminUser.email,
    isSuperAdmin: true,
    sessionId: adminSessionId
  }, JWT_SECRET, { expiresIn: "4h" });

  // Call admin pending profiles API
  const pendingProfilesRes = await fetch(`${API_BASE}/api/admin/talents/pending`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const pendingProfilesData = await pendingProfilesRes.json();
  const pendingList = pendingProfilesData?.profiles || [];
  const foundPending = pendingList.find(p => String(p.userId?._id || p.userId) === String(dbUser._id));

  // Call admin talent review drawer endpoint
  const adminProfileRes = await fetch(`${API_BASE}/api/admin/talents/${dbProfile?._id || dbUser._id}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const adminProfileData = await adminProfileRes.json();
  const drawerProfile = adminProfileData?.profile || adminProfileData?.data;

  console.log("Admin Review Mobile in drawerProfile:", drawerProfile?.mobile);
  console.log("Admin Review Phone in drawerProfile:", drawerProfile?.phone);
  console.log("Admin Review ContactDetails Phone:", drawerProfile?.contactDetails?.phone);

  results.step3_admin_review = {
    foundInPendingList: !!foundPending,
    pendingMobile: foundPending?.mobile,
    drawerProfileMobile: drawerProfile?.mobile,
    drawerProfilePhone: drawerProfile?.phone,
    drawerContactDetailsPhone: drawerProfile?.contactDetails?.phone,
    mobilePreserved: drawerProfile?.mobile === testTalentPhone && drawerProfile?.phone === testTalentPhone
  };

  // STEP 4: Admin Approval
  console.log("\n4. Admin approving talent...");
  const approveRes = await fetch(`${API_BASE}/api/admin/talents/${dbProfile?._id || dbUser._id}/approve`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ approvalNotes: "Verified via E2E test" })
  });
  const approveData = await approveRes.json();
  console.log("Admin approve response:", approveRes.status, approveData?.success);
  results.step4_admin_approval = { status: approveRes.status, body: approveData };

  // STEP 5: Talent Login & All Endpoints
  console.log("\n5. Talent logging in and checking all endpoints...");
  const talentLoginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testTalentEmail, password: "Password@123" })
  });
  const talentLoginData = await talentLoginRes.json();
  const activeTalentToken = talentLoginData?.token;

  // Endpoint 5a: /api/talent/profile/my
  const myProfileRes = await fetch(`${API_BASE}/api/talent/profile/my`, {
    headers: { Authorization: `Bearer ${activeTalentToken}` }
  });
  const myProfileData = await myProfileRes.json();
  const activeProfile = myProfileData?.profile;

  // Endpoint 5b: /api/talent/profile/completion-status
  const compRes = await fetch(`${API_BASE}/api/talent/profile/completion-status`, {
    headers: { Authorization: `Bearer ${activeTalentToken}` }
  });
  const compData = await compRes.json();

  // Endpoint 5c: /api/applications/my
  const appsRes = await fetch(`${API_BASE}/api/applications/my`, {
    headers: { Authorization: `Bearer ${activeTalentToken}` }
  });
  const appsData = await appsRes.json();

  // Endpoint 5d: /api/notifications
  const notifRes = await fetch(`${API_BASE}/api/notifications`, {
    headers: { Authorization: `Bearer ${activeTalentToken}` }
  });
  const notifData = await notifRes.json();

  console.log("Talent profile stageName:", activeProfile?.stageName);
  console.log("Talent profile bio:", activeProfile?.bio);
  console.log("Talent profile status:", activeProfile?.status);
  console.log("Talent profile isProfileApproved:", activeProfile?.isProfileApproved);
  console.log("Talent applications count:", Array.isArray(appsData?.data) ? appsData.data.length : 0);

  results.step5_talent_login_and_pages = {
    profileStageName: activeProfile?.stageName,
    profileBio: activeProfile?.bio,
    profileStatus: activeProfile?.status,
    isProfileApproved: activeProfile?.isProfileApproved,
    profilePhone: activeProfile?.phone || activeProfile?.mobile || activeProfile?.contactDetails?.phone,
    completionPercentage: compData?.data?.completionPercentage,
    applicationsReturned: Array.isArray(appsData?.data) ? appsData.data.length : 0,
    notificationsCount: Array.isArray(notifData?.data) ? notifData.data.length : 0,
    isRealTalentDataShown: activeProfile?.bio === testTalentBio && activeProfile?.stageName === testTalentName,
    isRiyaSharmaMockLeakPresent: activeProfile?.stageName === "Riya Sharma" || activeProfile?.bio?.includes("Marathi short films")
  };

  // STEP 6: Organization Registration & Inspection
  console.log("\n6. Testing Organization lifecycle...");
  const orgEmail = `e2e-mock-org-${timestamp}@vismaya.io`;
  const orgName = `E2E-MOCK Studio ${timestamp}`;
  const orgPhone = `+9192${randomSuffix}`;

  const orgRegRes = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: "organization",
      email: orgEmail,
      password: "Password@123",
      name: orgName,
      studioName: orgName,
      companyType: "Production House",
      phone: orgPhone,
      mobile: orgPhone,
      city: "Mumbai",
      isPaid: true
    })
  });
  const orgRegData = await orgRegRes.json();

  // Activate org user for login
  await mongoose.connection.collection("users").updateOne(
    { email: orgEmail },
    { $set: { status: "active", isEmailVerified: true } }
  );

  const orgLoginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: orgEmail, password: "Password@123" })
  });
  const orgLoginData = await orgLoginRes.json();
  const orgToken = orgLoginData?.token;

  const orgProfileRes = await fetch(`${API_BASE}/api/organization/profile`, {
    headers: { Authorization: `Bearer ${orgToken}` }
  });
  const orgProfileData = await orgProfileRes.json();
  const orgProf = orgProfileData?.data || orgProfileData?.organization;

  console.log("Org profile companyName/organizationName:", orgProf?.organizationName || orgProf?.companyName || orgProf?.studioName);
  results.step6_organization_flow = {
    status: orgRegRes.status,
    storedCompanyName: orgProf?.organizationName || orgProf?.companyName || orgProf?.studioName || orgProf?.name,
    phonePreserved: (orgProf?.phone || orgProf?.mobile || orgProf?.contactNumber) === orgPhone
  };

  // STEP 7: Public Discovery
  console.log("\n7. Public Discovery endpoints...");
  const searchRes = await fetch(`${API_BASE}/api/talent/profile/search?q=Indore`);
  const searchData = await searchRes.json();

  const oppsRes = await fetch(`${API_BASE}/api/opportunities/published`);
  const oppsData = await oppsRes.json();

  results.step7_public_discovery = {
    searchStatus: searchRes.status,
    publishedOpportunitiesCount: Array.isArray(oppsData?.data) ? oppsData.data.length : 0
  };

  const isSuccess =
    results.step3_admin_review.mobilePreserved &&
    results.step5_talent_login_and_pages.isRealTalentDataShown &&
    !results.step5_talent_login_and_pages.isRiyaSharmaMockLeakPresent &&
    results.step6_organization_flow.phonePreserved;

  results.verdict = isSuccess ? "ALL_PASS" : "FAIL";

  const evidenceFilePath = path.join(evidenceDir, "07-phase4-live-verification.json");
  fs.writeFileSync(evidenceFilePath, JSON.stringify(results, null, 2));
  console.log(`\nSaved verification evidence to ${evidenceFilePath}`);

  // Clean up MongoDB test documents
  console.log("\nCleaning up test documents with E2E-MOCK prefix...");
  const userDeleteRes = await mongoose.connection.collection("users").deleteMany({
    email: { $in: [testTalentEmail, orgEmail] }
  });
  const profileDeleteRes = await mongoose.connection.collection("talentprofiles").deleteMany({
    bio: testTalentBio
  });
  const orgDeleteRes = await mongoose.connection.collection("organizations").deleteMany({
    $or: [{ organizationName: orgName }, { companyName: orgName }]
  });
  await mongoose.connection.collection("sessions").deleteMany({
    sessionId: adminSessionId
  });

  console.log(`Cleaned up: ${userDeleteRes.deletedCount} users, ${profileDeleteRes.deletedCount} profiles, ${orgDeleteRes.deletedCount} organizations.`);
  await mongoose.disconnect();

  console.log("\nFinal Verdict:", results.verdict);
  if (!isSuccess) {
    process.exit(1);
  }
}

runPhase4Verification().catch(err => {
  console.error("Verification failed with error:", err);
  process.exit(1);
});
