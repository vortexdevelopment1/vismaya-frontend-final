import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import dotenv from "../../backend/node_modules/dotenv/dist/index.cjs";
import mongoose from "../../backend/node_modules/mongoose/index.js";
import bcrypt from "../../backend/node_modules/bcrypt/bcrypt.js";
import { v2 as cloudinary } from "../../backend/node_modules/cloudinary/cloudinary.js";

dotenv.config({ path: resolve("backend/.env") });
const baseUrl = (process.env.E2E_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const evidenceDir = resolve("docs/e2e-evidence");
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = "E2E-password-2026!";
const evidence = { runId, startedAt: new Date().toISOString(), checks: [], cleanup: {} };
const ids = { users: [], organizations: [], profiles: [], projects: [], opportunities: [], applications: [], media: [], cloudinary: [] };

await mkdir(evidenceDir, { recursive: true });
const redact = (value) => JSON.parse(JSON.stringify(value, (key, item) => /token|password|otp|secret/i.test(key) ? "[redacted]" : item));
async function request(name, path, options = {}, expected) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  evidence.checks.push({ name, request: { method: options.method || "GET", path }, response: { status: response.status, body: redact(body) }, expected });
  if (expected !== undefined && response.status !== expected) throw new Error(`${name}: expected HTTP ${expected}, received ${response.status}`);
  return body;
}
const json = (body, token) => ({ method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
const auth = (token) => ({ authorization: `Bearer ${token}` });

try {
  await request("health", "/api/health", {}, 200);
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15_000 });
  const db = mongoose.connection.db;
  const now = new Date();
  const orgUserId = new mongoose.Types.ObjectId();
  const talentUserId = new mongoose.Types.ObjectId();
  ids.users.push(orgUserId, talentUserId);
  const hash = await bcrypt.hash(password, 10);
  await db.collection("users").insertMany([
    { _id: orgUserId, name: `E2E Organization ${runId}`, email: `e2e+org+${runId}@example.test`, password: hash, role: "organization", status: "active", isEmailVerified: true, isPaid: true, authProvider: "local", twoFactorEnabled: false, createdAt: now, updatedAt: now },
    { _id: talentUserId, name: `E2E Talent ${runId}`, email: `e2e+talent+${runId}@example.test`, password: hash, role: "talent", status: "active", isEmailVerified: true, isPaid: true, authProvider: "local", twoFactorEnabled: false, createdAt: now, updatedAt: now }
  ]);
  const orgId = new mongoose.Types.ObjectId(); ids.organizations.push(orgId);
  await db.collection("organizations").insertOne({ _id: orgId, userId: orgUserId, organizationName: `E2E Studio ${runId}`, verificationState: "verified", services: [], offices: [], experienceAndProjects: [], portfolioCaseStudies: [], verificationDocuments: [], verificationStatus: { businessVerified: true, identityVerified: true, professionalVerified: true }, createdAt: now, updatedAt: now });
  const profileId = new mongoose.Types.ObjectId(); ids.profiles.push(profileId);
  await db.collection("talentprofiles").insertOne({ _id: profileId, userId: talentUserId, vismayaId: `E2E-${runId}`, firstName: "E2E", lastName: "Talent", primaryProfession: "Actor", skills: [], languages: [], secondaryProfessions: [], specializations: [], secondaryDepartments: [], workingCities: [], credits: [], training: [], awards: [], profileCompletionPercentage: 100, isPaid: true, isProfileApproved: true, isVerified: true, isSearchable: true, status: "active", createdAt: now, updatedAt: now });

  await request("auth invalid login", "/api/auth/login", json({ email: `e2e+talent+${runId}@example.test`, password: "wrong-password" }), 401);
  const orgLogin = await request("auth organization login", "/api/auth/login", json({ email: `e2e+org+${runId}@example.test`, password }), 200);
  const talentLogin = await request("auth talent login", "/api/auth/login", json({ email: `e2e+talent+${runId}@example.test`, password }), 200);
  const orgToken = orgLogin.token; const talentToken = talentLogin.token;
  await request("media unauthenticated", "/api/media", { method: "POST" }, 401);
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9JXl8AAAAASUVORK5CYII=", "base64");
  const uploadForm = new FormData(); uploadForm.set("file", new Blob([png], { type: "image/png" }), `e2e-${runId}.png`); uploadForm.set("folder", "e2e-test");
  try {
    const uploaded = await request("media PNG upload", "/api/media/upload", { method: "POST", headers: auth(talentToken), body: uploadForm }, 200);
    ids.cloudinary.push({ publicId: uploaded.data.publicId, resourceType: uploaded.data.resourceType });
  } catch (error) {
    evidence.mediaStorageFailure = error.message;
  }
  const invalidForm = new FormData(); invalidForm.set("file", new Blob(["not media"], { type: "text/plain" }), "e2e.txt");
  try {
    await request("media wrong MIME", "/api/media/upload", { method: "POST", headers: auth(talentToken), body: invalidForm }, 400);
  } catch (error) {
    evidence.mediaValidationFailure = error.message;
  }

  const deadline = new Date(Date.now() + 7 * 86400000).toISOString();
  const opportunity = await request("opportunity default project create", "/api/opportunities", json({ title: `E2E Opportunity ${runId}`, summary: "E2E opportunity used only for application integration testing.", role: "Actor", location: "Mumbai", deadline, positionsCount: 1, eligibility: { professions: ["Actor"], languages: [], workingCities: [], skills: [] } }, orgToken), 201);
  const opportunityId = opportunity.opportunity._id; ids.opportunities.push(new mongoose.Types.ObjectId(opportunityId));
  const projectId = opportunity.opportunity.projectId?._id; if (projectId) ids.projects.push(new mongoose.Types.ObjectId(projectId));
  await db.collection("opportunities").updateOne({ _id: new mongoose.Types.ObjectId(opportunityId) }, { $set: { status: "published", publishedAt: new Date() } });
  await request("application missing consent", "/api/applications", json({ opportunityId, coverNote: "E2E test" }, talentToken), 400);
  const application = await request("application apply", "/api/applications", json({ opportunityId, coverNote: "E2E application", consentGiven: true }, talentToken), 201);
  const applicationId = application.application._id; ids.applications.push(new mongoose.Types.ObjectId(applicationId));
  await request("application persistence with project", "/api/applications/my", { headers: auth(talentToken) }, 200);
  await request("organization applicants", `/api/applications/opportunity/${opportunityId}`, { headers: auth(orgToken) }, 200);
  await request("application review", `/api/applications/${applicationId}/review`, { method: "PATCH", headers: { "content-type": "application/json", ...auth(orgToken) }, body: "{}" }, 200);
  await request("application shortlist", `/api/applications/${applicationId}/shortlist`, { method: "PATCH", headers: { "content-type": "application/json", ...auth(orgToken) }, body: "{}" }, 200);
  await request("application select", `/api/applications/${applicationId}/select`, { method: "PATCH", headers: { "content-type": "application/json", ...auth(orgToken) }, body: "{}" }, 200);
  evidence.result = evidence.mediaStorageFailure || evidence.mediaValidationFailure ? "FAIL" : "PASS";
  if (evidence.mediaStorageFailure || evidence.mediaValidationFailure) process.exitCode = 1;
} catch (error) {
  evidence.result = "FAIL"; evidence.error = { message: error.message };
  process.exitCode = 1;
} finally {
  try {
    if (mongoose.connection.readyState) {
      const db = mongoose.connection.db;
      evidence.cleanup = {
        applications: (await db.collection("applications").deleteMany({ _id: { $in: ids.applications } })).deletedCount,
        opportunities: (await db.collection("opportunities").deleteMany({ _id: { $in: ids.opportunities } })).deletedCount,
        projects: (await db.collection("projects").deleteMany({ _id: { $in: ids.projects } })).deletedCount,
        profiles: (await db.collection("talentprofiles").deleteMany({ _id: { $in: ids.profiles } })).deletedCount,
        organizations: (await db.collection("organizations").deleteMany({ _id: { $in: ids.organizations } })).deletedCount,
        users: (await db.collection("users").deleteMany({ _id: { $in: ids.users } })).deletedCount,
        notifications: (await db.collection("notifications").deleteMany({ recipientId: { $in: ids.users } })).deletedCount
      };
      await mongoose.disconnect();
    }
    cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
    evidence.cleanup.cloudinary = await Promise.all(ids.cloudinary.map(async ({ publicId, resourceType }) => ({ publicId, result: await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }) })));
  } catch (cleanupError) { evidence.cleanupError = cleanupError.message; process.exitCode = 1; }
  evidence.finishedAt = new Date().toISOString();
  await writeFile(resolve(evidenceDir, "auth-uploads-applications.json"), `${JSON.stringify(evidence, null, 2)}\n`);
  console.table(evidence.checks.map((check) => ({ module: check.name, status: check.response.status === check.expected ? "PASS" : "FAIL", http: check.response.status })));
}
