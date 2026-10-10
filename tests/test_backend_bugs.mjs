import mongoose from "../../vismaya-backend (3)/vismaya-backend/node_modules/mongoose/index.js";
import bcrypt from "../../vismaya-backend (3)/vismaya-backend/node_modules/bcryptjs/index.js";
import dotenv from "../../vismaya-backend (3)/vismaya-backend/node_modules/dotenv/lib/main.js";
dotenv.config({ path: "vismaya-backend (3)/vismaya-backend/.env" });

const BASE_URL = "http://localhost:5000";
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/vismaya_prod_live";

async function req(urlPath, options = {}, token = null) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${urlPath}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = await res.text();
  }
  return { status: res.status, ok: res.ok, data };
}

async function testBackendBugs() {
  console.log("===============================================================================");
  console.log("  BACKEND BUG REPRODUCTION SUITE");
  console.log("===============================================================================\n");

  await mongoose.connect(MONGO_URI);
  const usersCol = mongoose.connection.collection("users");
  const orgsCol = mongoose.connection.collection("organizations");
  const otpsCol = mongoose.connection.collection("otps");

  const testEmail = `bug_test_org_${Date.now()}@vismayatest.com`;
  const talentEmail = `bug_test_talent_${Date.now()}@vismayatest.com`;

  // Register Org
  const regOrg = await req("/api/auth/register", {
    method: "POST",
    body: {
      email: testEmail,
      password: "Password@123",
      role: "organization",
      name: "Bug Test Studio",
      organizationName: "Bug Test Studio",
      contactPerson: "Bug Tester",
      phone: "9876543210",
      mobile: "9876543210",
      termsAccepted: true,
      roleSpecificConsent: true,
    },
  });

  // Register Talent
  const regTalent = await req("/api/auth/register", {
    method: "POST",
    body: {
      email: talentEmail,
      password: "Password@123",
      role: "talent",
      name: "Talent For Unlock",
      mobile: "9876543211",
      termsAccepted: true,
      roleSpecificConsent: true,
    },
  });

  // Verify OTPs
  const otpHash = await bcrypt.hash("123456", 10);
  await otpsCol.updateMany(
    { email: { $in: [testEmail, talentEmail] } },
    { $set: { otpHash } }
  );

  await req("/api/auth/verify-registration", {
    method: "POST",
    body: { email: testEmail, otp: "123456" },
  });
  await req("/api/auth/verify-registration", {
    method: "POST",
    body: { email: talentEmail, otp: "123456" },
  });

  // Set isPaid: true
  await usersCol.updateMany(
    { email: { $in: [testEmail, talentEmail] } },
    { $set: { isPaid: true, status: "active" } }
  );

  // Login Org & Talent
  const orgLogin = await req("/api/auth/login", {
    method: "POST",
    body: { email: testEmail, password: "Password@123" },
  });
  const orgToken = orgLogin.data?.token;
  const orgUserId = orgLogin.data?.user?.id || orgLogin.data?.user?._id;

  const talentLogin = await req("/api/auth/login", {
    method: "POST",
    body: { email: talentEmail, password: "Password@123" },
  });
  const talentUserId = talentLogin.data?.user?.id || talentLogin.data?.user?._id;

  console.log("Logged in Organization with token. Testing Route-Ordering Bug...\n");

  // BUG 1: Route Ordering in organization.routes.js
  console.log("-------------------------------------------------------------------------------");
  console.log("BUG 1: organization.routes.js GET /:slug registered BEFORE /profile and /favourites");
  console.log("-------------------------------------------------------------------------------");
  const profileRes = await req("/api/organization/profile", { method: "GET" }, orgToken);
  console.log("GET /api/organization/profile => HTTP", profileRes.status);
  console.log("Raw Response:", JSON.stringify(profileRes.data, null, 2));

  const favRes = await req("/api/organization/favourites", { method: "GET" }, orgToken);
  console.log("\nGET /api/organization/favourites => HTTP", favRes.status);
  console.log("Raw Response:", JSON.stringify(favRes.data, null, 2));

  // BUG 2: Credit unlock at balance 0
  console.log("\n-------------------------------------------------------------------------------");
  console.log("BUG 2: Credit Unlock Succeeds when Balance is 0");
  console.log("-------------------------------------------------------------------------------");
  // Ensure creditBalance is explicitly 0 in database
  await orgsCol.updateOne({ userId: new mongoose.Types.ObjectId(orgUserId) }, { $set: { creditBalance: 0 } }, { upsert: true });

  const balanceCheck = await req("/api/credits/balance", { method: "GET" }, orgToken);
  console.log("Verified Balance from GET /api/credits/balance:", JSON.stringify(balanceCheck.data));

  const unlockRes = await req(`/api/credits/unlock/${talentUserId}`, { method: "POST" }, orgToken);
  console.log(`POST /api/credits/unlock/${talentUserId} => HTTP ${unlockRes.status}`);
  console.log("Raw Response:", JSON.stringify(unlockRes.data, null, 2));

  await mongoose.disconnect();
}

testBackendBugs();
