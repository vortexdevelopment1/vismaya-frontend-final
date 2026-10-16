/**
 * SECURITY AUDIT - Phase 0: Setup
 * Creates E2E-SEC test users, records tool versions, checks health.
 * READ-ONLY audit: does NOT modify source/config files.
 */
import { execSync } from "child_process";
import { writeFileSync, mkdirSync } from "fs";

const BASE = "http://localhost:5000";

async function post(path, body) {
    const res = await fetch(`${BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return { status: res.status, data };
}

async function get(path, token) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${BASE}${path}`, { headers });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return { status: res.status, data };
}

const results = {};

// 1. Health check
const health = await get("/api/health");
results.health = { status: health.status, ok: health.data.success };
console.log("Health:", health.status, health.data.message);

// 2. Register E2E-SEC talent
const talentReg = await post("/api/auth/register", {
    name: "E2E-SEC Talent",
    email: "e2e-sec-talent@vismaya.test",
    password: "SecurePass@123",
    role: "talent"
});
results.talentReg = { status: talentReg.status, msg: talentReg.data?.message };
console.log("Talent register:", talentReg.status, talentReg.data?.message);

// 3. Register E2E-SEC org
const orgReg = await post("/api/auth/register", {
    name: "E2E-SEC Org",
    email: "e2e-sec-org@vismaya.test",
    password: "SecurePass@123",
    role: "organization"
});
results.orgReg = { status: orgReg.status, msg: orgReg.data?.message };
console.log("Org register:", orgReg.status, orgReg.data?.message);

// 4. Attempt admin role registration (should be blocked with 403)
const adminReg = await post("/api/auth/register", {
    name: "E2E-SEC Admin",
    email: "e2e-sec-admin@vismaya.test",
    password: "SecurePass@123",
    role: "admin"
});
results.adminRegBlocked = {
    status: adminReg.status,
    msg: adminReg.data?.message,
    pass: adminReg.status === 403
};
console.log("Admin register (should 403):", adminReg.status, adminReg.data?.message,
    adminReg.status === 403 ? "PASS" : "FAIL");

// 5. Tool versions
let nodeVersion = "unknown";
try { nodeVersion = execSync("node --version").toString().trim(); } catch {}
let npmVersion = "unknown";
try { npmVersion = execSync("npm --version").toString().trim(); } catch {}
results.toolVersions = { node: nodeVersion, npm: npmVersion };
console.log("Tool versions:", results.toolVersions);

// 6. Save evidence
mkdirSync("docs/security-evidence", { recursive: true });
writeFileSync(
    "docs/security-evidence/phase0-setup.json",
    JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2)
);
console.log("\nEvidence saved to docs/security-evidence/phase0-setup.json");
