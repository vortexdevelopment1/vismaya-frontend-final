import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "../backend/node_modules/mongoose/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const evidenceDir = path.resolve(__dirname, "../docs/e2e-evidence/mock-leak");

const API_BASE = "http://localhost:5000";

async function postJson(url, data, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(API_BASE + url, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  const text = await res.text();
  try { return { status: res.status, ok: res.ok, data: JSON.parse(text) }; }
  catch { return { status: res.status, ok: res.ok, data: { rawText: text } }; }
}

async function getJson(url, token = null) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(API_BASE + url, { method: "GET", headers });
  const text = await res.text();
  try { return { status: res.status, ok: res.ok, data: JSON.parse(text) }; }
  catch { return { status: res.status, ok: res.ok, data: { rawText: text } }; }
}

async function patchJson(url, data = {}, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(API_BASE + url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });
  const text = await res.text();
  try { return { status: res.status, ok: res.ok, data: JSON.parse(text) }; }
  catch { return { status: res.status, ok: res.ok, data: { rawText: text } }; }
}

async function run() {
  await mongoose.connect("mongodb+srv://lowanshiarpita_db_user:lmXigXjzPeozujpz@cluster0.ipa6ws6.mongodb.net/vismaya");
  console.log("Connected to MongoDB for OTP retrieval and verification");

  const email = `e2e-mock-lifecycle-${Date.now()}@vismaya.io`;
  const password = "E2eMockPass123!";

  // 1. Register
  console.log("Step 1: Registering talent:", email);
  const regRes = await postJson("/api/auth/register", {
    role: "talent",
    email,
    password,
    name: "E2E-MOCK Kabir Sen",
    city: "Kolkata",
    phone: "9000000033", // frontend uses phone
    profilePhoto: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
  });
  console.log("   Register result:", regRes.status);

  // 2. Fetch OTP from DB
  const otpRecord = await mongoose.connection.collection("otps").findOne({ email, purpose: "registration" });
  console.log("Step 2: Found OTP record in DB:", Boolean(otpRecord));

  // Mark user verified in DB directly for test speed
  await mongoose.connection.collection("users").updateOne(
    { email },
    { $set: { isEmailVerified: true, status: "pending", isPaid: true } }
  );

  // 3. Login as talent
  console.log("Step 3: Logging in as registered talent...");
  const loginRes = await postJson("/api/auth/login", { email, password });
  console.log("   Login status:", loginRes.status, loginRes.data.success);
  const talentToken = loginRes.data.token;

  let profileCreationRes = null;
  if (talentToken) {
    // 4. Create Talent Profile
    console.log("Step 4: Saving talent profile via /api/talent/profile...");
    profileCreationRes = await postJson("/api/talent/profile", {
      stageName: "E2E-MOCK Kabir",
      primaryProfession: "Singer / Lyricist",
      skills: ["Vocalist", "Songwriting"],
      bio: "E2E-MOCK-BIO Award-winning indie vocalist and composer based in Kolkata.",
      currentCity: "Kolkata",
      profilePhoto: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      experienceRange: "3-5 years",
    }, talentToken);
    console.log("   Profile create status:", profileCreationRes.status, profileCreationRes.data.success);
  }

  // 5. Admin login and approve talent
  console.log("Step 5: Admin approves talent...");
  const adminLogin = await postJson("/api/auth/admin/login", {
    email: "admin@vismaya.io",
    password: "Admin@Vismaya2026!",
  });
  let adminToken = null;
  if (adminLogin.data.requires2FA && adminLogin.data.debugOtp) {
    const admin2FA = await postJson("/api/auth/admin/verify-2fa", {
      email: "admin@vismaya.io",
      otp: adminLogin.data.debugOtp,
      twoFactorToken: adminLogin.data.twoFactorToken,
    });
    adminToken = admin2FA.data.token;
  }

  const userDoc = await mongoose.connection.collection("users").findOne({ email });
  const profileDoc = await mongoose.connection.collection("talentprofiles").findOne({ userId: userDoc?._id });

  let adminApproveRes = null;
  if (adminToken && profileDoc) {
    adminApproveRes = await patchJson(`/api/admin/talents/${profileDoc._id}/approve`, {}, adminToken);
    console.log("   Admin approve status:", adminApproveRes.status, adminApproveRes.data?.message);
    await patchJson(`/api/admin/users/${userDoc._id}/approve`, {}, adminToken);
  }

  // 6. Talent fetches /api/talent/profile/my
  console.log("Step 6: Talent fetches /api/talent/profile/my...");
  const myProfileRes = await getJson("/api/talent/profile/my", talentToken);
  console.log("   My profile status:", myProfileRes.status);
  console.log("   My profile data:", {
    vismayaId: myProfileRes.data?.profile?.vismayaId,
    stageName: myProfileRes.data?.profile?.stageName,
    bio: myProfileRes.data?.profile?.bio,
    status: myProfileRes.data?.profile?.status,
    mobile: myProfileRes.data?.profile?.contactDetails?.mobile
  });

  const fullEvidence = {
    testUser: {
      email,
      name: "E2E-MOCK Kabir Sen",
      phoneSent: "9000000033",
      dbUserRecord: userDoc,
      dbProfileRecord: profileDoc,
    },
    apiResponses: {
      registration: regRes,
      login: loginRes,
      profileCreation: profileCreationRes,
      adminApproval: adminApproveRes,
      talentMyProfile: myProfileRes,
    },
  };

  fs.writeFileSync(
    path.join(evidenceDir, "06-talent-lifecycle-evidence.json"),
    JSON.stringify(fullEvidence, null, 2)
  );

  console.log("Evidence saved to 06-talent-lifecycle-evidence.json");
  process.exit(0);
}

run().catch((err) => {
  console.error("Error in lifecycle script:", err);
  process.exit(1);
});
