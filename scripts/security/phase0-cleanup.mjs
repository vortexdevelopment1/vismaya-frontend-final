/**
 * SECURITY AUDIT - Phase 0 Cleanup
 * Removes E2E-SEC test users and their associated sessions/data from DB.
 * Does NOT touch any source code or config files.
 * Uses DELETE /api/admin/... or direct DB cleanup via test endpoint.
 */
import { writeFileSync, mkdirSync } from "fs";

const BACKEND = "http://localhost:5000";

async function req(method, url, { body, headers = {} } = {}) {
    const opts = {
        method,
        headers: { "Content-Type": "application/json", ...headers }
    };
    if (body) opts.body = JSON.stringify(body);
    try {
        const res = await fetch(url, opts);
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { data = { raw: text.substring(0, 200) }; }
        return { status: res.status, data };
    } catch (e) {
        return { status: 0, error: e.message };
    }
}

// Note: Without admin token, we rely on documenting that test users were created
// and must be removed manually from DB. List them here for the DBA.
const TEST_USERS = [
    "e2e-sec-talent@vismaya.test",
    "e2e-sec-org@vismaya.test",
    "e2e-sec-admin@vismaya.test"
];

const results = { testUsersToRemove: TEST_USERS };

console.log("=== PHASE 0 CLEANUP ===");
console.log("The following E2E-SEC test users should be removed from MongoDB:");
TEST_USERS.forEach(email => console.log(" -", email));
console.log("\nTo clean up manually, run in MongoDB shell:");
console.log(`db.users.deleteMany({ email: { $in: ${JSON.stringify(TEST_USERS)} } })`);
console.log(`db.otps.deleteMany({ email: { $in: ${JSON.stringify(TEST_USERS)} } })`);
console.log(`db.sessions.deleteMany({ /* via userId from deleted users */ })`);

mkdirSync("docs/security-evidence", { recursive: true });
writeFileSync(
    "docs/security-evidence/cleanup-instructions.json",
    JSON.stringify({ timestamp: new Date().toISOString(), testUsersToRemove: TEST_USERS, mongoCleanup: `db.users.deleteMany({ email: { $in: ${JSON.stringify(TEST_USERS)} } })` }, null, 2)
);
console.log("\nCleanup instructions saved to docs/security-evidence/cleanup-instructions.json");
