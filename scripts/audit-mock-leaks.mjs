#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const frontendDir = path.join(rootDir, "frontend");

const KNOWN_MOCK_FILES = [
  "frontend/lib/admin/mockData.js",
  "frontend/lib/api/services/mockSeedData.js",
  "frontend/lib/recruiter/mockData.js",
  "frontend/lib/talent/mockData.js",
];

const ALLOWED_MOCK_IMPORTERS = [
  // Mock data may only be accessed inside the service layer behind isRealMode/USE_MOCK
  "frontend/lib/api/services/adminService.js",
  "frontend/lib/api/services/applicationService.js",
  "frontend/lib/api/services/auditionService.js",
  "frontend/lib/api/services/authService.js",
  "frontend/lib/api/services/creditService.js",
  "frontend/lib/api/services/mediaService.js",
  "frontend/lib/api/services/notificationService.js",
  "frontend/lib/api/services/opportunityService.js",
  "frontend/lib/api/services/paymentService.js",
  "frontend/lib/api/services/projectService.js",
  "frontend/lib/api/services/publicService.js",
  "frontend/lib/api/services/recruiterService.js",
  "frontend/lib/api/services/talentService.js",
  "frontend/lib/api/services/verificationService.js",
  "frontend/lib/api/services/mockSeedData.js",
];

function getAllFiles(dir, exts = [".js", ".jsx", ".ts", ".tsx"]) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!["node_modules", ".next", ".git", "docs", "e2e-evidence"].includes(file)) {
        results = results.concat(getAllFiles(fullPath, exts));
      }
    } else if (exts.some((ext) => file.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

function normalizePath(p) {
  return path.relative(rootDir, p).replace(/\\/g, "/");
}

export function runAudit() {
  const allFrontendFiles = getAllFiles(frontendDir);
  const leaks = [];
  const serviceFallbacks = [];
  const hardcodedDemoIds = [];
  const directMockImports = [];

  for (const filePath of allFrontendFiles) {
    const relPath = normalizePath(filePath);
    if (KNOWN_MOCK_FILES.includes(relPath)) continue;

    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    // 1. Direct Mock Imports Check
    const importRegex = /import\s+(?:[\w*\s{},]+from\s+)?['"]([^'"]*(?:mockData|mockSeedData)[^'"]*)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importSource = match[1];
      const isAllowed = ALLOWED_MOCK_IMPORTERS.some((allowed) => relPath === allowed);
      if (!isAllowed) {
        const lineNo = content.slice(0, match.index).split("\n").length;
        directMockImports.push({
          file: relPath,
          line: lineNo,
          importSource,
          snippet: match[0],
        });
      }
    }

    // 2. Pattern checks line by line
    lines.forEach((line, index) => {
      const lineNo = index + 1;

      // Check for hardcoded mock IDs like "tal-904", "usr_mock", etc. outside of test files and mock fixtures
      if (
        (line.includes('"tal-904"') || line.includes("'tal-904'")) &&
        !relPath.includes("test") &&
        !relPath.includes("services/") &&
        !relPath.includes("workflowStore") &&
        !line.includes("isRealMode")
      ) {
        hardcodedDemoIds.push({
          file: relPath,
          line: lineNo,
          type: "Hardcoded Talent ID tal-904 without isRealMode guard",
          snippet: line.trim(),
        });
      }

      // Check for useState initialized with initialMockData or mock data in components/contexts
      if (
        /useState\s*\(\s*(?:initial(?:Talents|Recruiters|MediaQueue|Applications|Auditions|ProfileData|CastingCalls|Notifications)|mock[A-Z]\w+)/.test(
          line
        ) &&
        !relPath.includes("services/") &&
        !line.includes("isRealMode")
      ) {
        leaks.push({
          file: relPath,
          line: lineNo,
          type: "useState initialized with mock data",
          snippet: line.trim(),
        });
      }

      // Check for || mock or || initialMock fallback in non-service files
      if (
        /(?:\|\|\s*|(?:\?\?\s*))(?:initial(?!Data|State|Reducer)[A-Z]\w+|mock[A-Z]\w+)/.test(line) &&
        !relPath.includes("services/") &&
        !relPath.includes("workflowStore") &&
        !line.includes("isRealMode")
      ) {
        leaks.push({
          file: relPath,
          line: lineNo,
          type: "Fallback to mock/initial data without real mode guard",
          snippet: line.trim(),
        });
      }

      // Check for catch -> return mock in services
      if (relPath.includes("services/")) {
        if (
          /catch\s*\([^)]*\)\s*\{\s*return\s+(?:mock|initial|\{[^}]*data:\s*(?:mock|initial))/i.test(
            line
          )
        ) {
          serviceFallbacks.push({
            file: relPath,
            line: lineNo,
            type: "Catch block swallows error and returns mock data",
            snippet: line.trim(),
          });
        }
      }
    });
  }

  return {
    directMockImports,
    leaks,
    serviceFallbacks,
    hardcodedDemoIds,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const isStrict = process.argv.includes("--strict") || process.argv.includes("--check");
  const results = runAudit();

  console.log("\n=======================================================");
  console.log("       VISMAYA MOCK DATA LEAK AUDIT REPORT             ");
  console.log("=======================================================\n");

  console.log(`1. Direct Mock Imports outside Services: ${results.directMockImports.length}`);
  results.directMockImports.forEach((d) => {
    console.log(`   - [${d.file}:${d.line}] imports "${d.importSource}"`);
  });

  console.log(`\n2. Component/Context State Initialized with Mock: ${results.leaks.length}`);
  results.leaks.forEach((l) => {
    console.log(`   - [${l.file}:${l.line}] ${l.type} -> ${l.snippet}`);
  });

  console.log(`\n3. Hardcoded Demo IDs (tal-904, etc.): ${results.hardcodedDemoIds.length}`);
  results.hardcodedDemoIds.forEach((h) => {
    console.log(`   - [${h.file}:${h.line}] ${h.type} -> ${h.snippet}`);
  });

  console.log(`\n4. Service Catch Swallows returning Mock: ${results.serviceFallbacks.length}`);
  results.serviceFallbacks.forEach((s) => {
    console.log(`   - [${s.file}:${s.line}] ${s.type} -> ${s.snippet}`);
  });

  const totalViolations =
    results.directMockImports.length +
    results.leaks.length +
    results.hardcodedDemoIds.length;

  console.log("\n-------------------------------------------------------");
  console.log(`TOTAL UNGUARDED MOCK LEAKS: ${totalViolations}`);
  console.log("-------------------------------------------------------\n");

  if (isStrict && totalViolations > 0) {
    console.error(`FAILED: ${totalViolations} mock leak(s) found in real mode components/pages.`);
    process.exit(1);
  } else {
    console.log("Audit complete.");
    process.exit(0);
  }
}
