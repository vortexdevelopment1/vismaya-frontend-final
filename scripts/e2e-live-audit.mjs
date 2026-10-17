import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const evidenceDir = path.resolve(__dirname, "../docs/e2e-evidence/mock-leak");
fs.mkdirSync(evidenceDir, { recursive: true });

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
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { rawText: text };
  }
  return { status: res.status, ok: res.ok, data: json };
}

async function getJson(url, token = null) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(API_BASE + url, {
    method: "GET",
    headers,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { rawText: text };
  }
  return { status: res.status, ok: res.ok, data: json };
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
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { rawText: text };
  }
  return { status: res.status, ok: res.ok, data: json };
}

export async function runLiveAudit() {
  console.log("=== STARTING PHASE 2 LIVE REPRODUCTION AUDIT ===");

  // 1. Check health
  const healthRes = await getJson("/health");
  console.log("1. /health status:", healthRes.status, healthRes.data);
  fs.writeFileSync(
    path.join(evidenceDir, "00-health.json"),
    JSON.stringify(healthRes, null, 2)
  );

  // 2. Admin Login to have token ready
  const adminLoginRes = await postJson("/api/auth/admin/login", {
    email: "admin@vismaya.io",
    password: "Admin@Vismaya2026!",
  });
  console.log("2. Admin login step 1:", adminLoginRes.status, adminLoginRes.data.message);

  let adminToken = null;
  if (adminLoginRes.data.requires2FA && adminLoginRes.data.debugOtp) {
    const admin2FARes = await postJson("/api/auth/admin/verify-2fa", {
      email: "admin@vismaya.io",
      otp: adminLoginRes.data.debugOtp,
      twoFactorToken: adminLoginRes.data.twoFactorToken,
    });
    adminToken = admin2FARes.data.token;
    console.log("   Admin 2FA verified, admin token obtained:", Boolean(adminToken));
  }

  // 3. Register throwaway talent reproducing exact frontend payload
  const talentPayload = {
    role: "talent",
    email: `e2e-mock-talent-${Date.now()}@vismaya.io`,
    password: "E2eMockPass123!",
    name: "E2E-MOCK Aarav Patel",
    city: "Mumbai",
    phone: "9000000011", // EXACT KEY SENT BY FRONTEND REGISTER PAGE
    profilePhoto: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    isPaid: true,
  };

  console.log("\n3. Registering talent with frontend payload (key: 'phone'):", talentPayload.email);
  const regRes = await postJson("/api/auth/register", talentPayload);
  console.log("   Registration response:", regRes.status, regRes.data);
  fs.writeFileSync(
    path.join(evidenceDir, "01-talent-registration-attempt.json"),
    JSON.stringify({ request: talentPayload, response: regRes }, null, 2)
  );

  // 4. Also register with 'mobile' key to compare backend validator behavior
  const talentPayloadWithMobile = {
    ...talentPayload,
    email: `e2e-mock-talent-mobile-${Date.now()}@vismaya.io`,
    mobile: "9000000012",
  };
  const regMobileRes = await postJson("/api/auth/register", talentPayloadWithMobile);
  console.log("   Registration with 'mobile' key response:", regMobileRes.status, regMobileRes.data);
  fs.writeFileSync(
    path.join(evidenceDir, "02-talent-registration-with-mobile.json"),
    JSON.stringify({ request: talentPayloadWithMobile, response: regMobileRes }, null, 2)
  );

  // 5. Query Admin APIs as Admin to review talents
  if (adminToken) {
    const adminPendingTalents = await getJson("/api/admin/talents/pending", adminToken);
    console.log("\n5. Admin /api/admin/talents/pending response count:", adminPendingTalents.data?.count);
    fs.writeFileSync(
      path.join(evidenceDir, "03-admin-pending-talents.json"),
      JSON.stringify(adminPendingTalents, null, 2)
    );

    const adminAllTalents = await getJson("/api/admin/talents", adminToken);
    console.log("   Admin /api/admin/talents response count:", adminAllTalents.data?.count);
    fs.writeFileSync(
      path.join(evidenceDir, "04-admin-all-talents.json"),
      JSON.stringify(adminAllTalents, null, 2)
    );
  }

  console.log("\n=== PHASE 2 REPRODUCTION LIVE RUN COMPLETE ===");
}

runLiveAudit().catch(console.error);
