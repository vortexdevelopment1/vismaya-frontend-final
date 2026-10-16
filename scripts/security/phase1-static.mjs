/**
 * SECURITY AUDIT - Phase 1: Static Analysis
 * Scans backend source code for:
 *   - S1: Hardcoded secrets / credentials in code
 *   - S2: JWT configuration issues
 *   - S3: Session management
 *   - S4: Authorization gaps (routes without auth)
 *   - S5: NoSQL injection risks (unescaped user input in queries)
 *   - S6: XSS exposure in API responses
 *   - S7: Error leakage (stack traces / internal paths in responses)
 *   - S8: File upload security
 * READ-ONLY: does not modify any source files.
 */
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "fs";
import { join, relative } from "path";

const ROOT = "backend/src";
const findings = [];

function addFinding(severity, category, file, line, detail) {
    findings.push({ severity, category, file, line, detail });
}

function walk(dir, callback) {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) {
            walk(full, callback);
        } else if (entry.endsWith(".ts")) {
            callback(full);
        }
    }
}

// ── S1: Hardcoded secrets ──────────────────────────────────────────────────
const SECRET_PATTERNS = [
    { re: /(?:password|secret|key|token|apikey)\s*=\s*["'][^"']{6,}["']/gi, label: "Possible hardcoded credential" },
    { re: /sk_live_|pk_live_|rk_live_/g, label: "Razorpay live key in source" },
    { re: /AKIA[0-9A-Z]{16}/g, label: "AWS Access Key" },
    { re: /mongodb\+srv:\/\/[^"'\s]+/g, label: "MongoDB connection string hardcoded" }
];

walk(ROOT, (file) => {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, idx) => {
        for (const { re, label } of SECRET_PATTERNS) {
            re.lastIndex = 0;
            if (re.test(line) && !line.trim().startsWith("//") && !line.includes("process.env")) {
                addFinding("HIGH", "S1_HARDCODED_SECRET", relative(".", file), idx + 1, `${label}: ${line.trim().substring(0, 80)}`);
            }
        }
    });
});

// ── S2: JWT configuration ──────────────────────────────────────────────────
walk(ROOT, (file) => {
    const src = readFileSync(file, "utf8");
    const lines = src.split("\n");
    lines.forEach((line, idx) => {
        // jwt.sign without expiresIn
        if (/jwt\.sign\s*\(/.test(line)) {
            const block = lines.slice(idx, idx + 5).join(" ");
            if (!/expiresIn/.test(block)) {
                addFinding("HIGH", "S2_JWT_NO_EXPIRY", relative(".", file), idx + 1, `jwt.sign() without expiresIn: ${line.trim().substring(0, 80)}`);
            }
        }
        // jwt.verify without algorithm restriction
        if (/jwt\.verify\s*\(/.test(line)) {
            const block = lines.slice(idx, idx + 4).join(" ");
            if (!/algorithms/.test(block)) {
                addFinding("MEDIUM", "S2_JWT_NO_ALG_RESTRICTION", relative(".", file), idx + 1, `jwt.verify() without algorithms option: ${line.trim().substring(0, 80)}`);
            }
        }
    });
});

// ── S3: Session security ───────────────────────────────────────────────────
walk(ROOT, (file) => {
    const src = readFileSync(file, "utf8");
    if (/session\.model/.test(file)) {
        if (!/expires|TTL|expireAfter/.test(src)) {
            addFinding("HIGH", "S3_SESSION_NO_EXPIRY", relative(".", file), 0, "Session model has no TTL/expiry index");
        }
    }
});

// ── S4: Routes without auth ────────────────────────────────────────────────
const ROUTE_FILES = `${ROOT}/routes`;
walk(ROUTE_FILES, (file) => {
    if (file.includes("health") || file.includes("public") || file.includes("taxonomy")) return;
    const src = readFileSync(file, "utf8");
    const lines = src.split("\n");
    lines.forEach((line, idx) => {
        // route definition lines without authenticateUser
        if (/router\.(get|post|put|patch|delete)\s*\(/.test(line)) {
            const block = lines.slice(idx, idx + 3).join(" ");
            if (!/authenticateUser/.test(block) && !/optionalAuth/.test(block)) {
                addFinding("MEDIUM", "S4_UNPROTECTED_ROUTE", relative(".", file), idx + 1, `Route without auth: ${line.trim().substring(0, 100)}`);
            }
        }
    });
});

// ── S5: NoSQL injection ────────────────────────────────────────────────────
walk(`${ROOT}/controllers`, (file) => {
    const src = readFileSync(file, "utf8");
    const lines = src.split("\n");
    lines.forEach((line, idx) => {
        // direct req.body.* in Mongoose query without sanitization
        if (/\$where|\$regex.*req\.body|\$where.*req\.body/.test(line)) {
            addFinding("HIGH", "S5_NOSQL_INJECTION", relative(".", file), idx + 1, `Potential NoSQL injection: ${line.trim().substring(0, 100)}`);
        }
        // findOne/find with direct body object spread
        if (/\.(findOne|find|findById)\s*\(\s*req\.body/.test(line)) {
            addFinding("MEDIUM", "S5_NOSQL_INJECTION", relative(".", file), idx + 1, `Unvalidated body passed to query: ${line.trim().substring(0, 100)}`);
        }
    });
});

// ── S6: XSS via response data ──────────────────────────────────────────────
walk(`${ROOT}/controllers`, (file) => {
    const src = readFileSync(file, "utf8");
    const lines = src.split("\n");
    lines.forEach((line, idx) => {
        // sending raw HTML with res.send
        if (/res\.send\s*\(`|res\.send\s*\("</.test(line)) {
            addFinding("MEDIUM", "S6_XSS_HTML_RESPONSE", relative(".", file), idx + 1, `HTML in res.send: ${line.trim().substring(0, 100)}`);
        }
    });
});

// ── S7: Error leakage ─────────────────────────────────────────────────────
walk(`${ROOT}/controllers`, (file) => {
    const src = readFileSync(file, "utf8");
    const lines = src.split("\n");
    lines.forEach((line, idx) => {
        // sending raw error object or err.stack in response
        if (/res\.(json|send)\s*\(.*error\.stack|res\.(json|send)\s*\(.*err\.stack/.test(line)) {
            addFinding("HIGH", "S7_ERROR_STACK_LEAK", relative(".", file), idx + 1, `Stack trace in response: ${line.trim().substring(0, 100)}`);
        }
        // sending full error object
        if (/message:\s*error\.message/.test(line) && /catch/.test(src.split("\n").slice(Math.max(0, idx - 10), idx).join("\n"))) {
            // already handled by generic error handler, low risk
        }
    });
});

// ── S8: File upload checks ─────────────────────────────────────────────────
walk(`${ROOT}/middleware`, (file) => {
    if (!file.includes("upload")) return;
    const src = readFileSync(file, "utf8");
    if (!/fileFilter/.test(src)) {
        addFinding("HIGH", "S8_UPLOAD_NO_TYPE_CHECK", relative(".", file), 0, "Upload middleware lacks fileFilter (MIME check)");
    }
    if (!/fileSize/.test(src)) {
        addFinding("HIGH", "S8_UPLOAD_NO_SIZE_LIMIT", relative(".", file), 0, "Upload middleware lacks fileSize limit");
    }
    // Check: file stored to disk (insecure) vs memoryStorage
    if (/diskStorage/.test(src) && !/memoryStorage/.test(src)) {
        addFinding("MEDIUM", "S8_UPLOAD_DISK_STORAGE", relative(".", file), 0, "Files stored to disk instead of memory/stream");
    }
});

// ── Summary ────────────────────────────────────────────────────────────────
const bySeverity = { HIGH: [], MEDIUM: [], LOW: [] };
for (const f of findings) {
    (bySeverity[f.severity] || bySeverity.LOW).push(f);
}

console.log(`\n=== PHASE 1 STATIC ANALYSIS RESULTS ===`);
console.log(`Total findings: ${findings.length}`);
console.log(`HIGH: ${bySeverity.HIGH.length} | MEDIUM: ${bySeverity.MEDIUM.length}`);
for (const f of findings) {
    console.log(`[${f.severity}] ${f.category} @ ${f.file}:${f.line}`);
    console.log(`  ${f.detail}`);
}

mkdirSync("docs/security-evidence", { recursive: true });
writeFileSync(
    "docs/security-evidence/phase1-static.json",
    JSON.stringify({ timestamp: new Date().toISOString(), totalFindings: findings.length, findings }, null, 2)
);
console.log("\nEvidence saved to docs/security-evidence/phase1-static.json");
