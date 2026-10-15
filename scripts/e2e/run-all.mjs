/**
 * Minimal, dependency-free HTTP preflight for the live E2E suite.
 * Module tests can be added here only after this check has a reachable backend.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const baseUrl = (process.env.E2E_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const evidenceDir = resolve("docs/e2e-evidence");
await mkdir(evidenceDir, { recursive: true });

const record = {
  request: { method: "GET", url: `${baseUrl}/api/health` },
  timestamp: new Date().toISOString(),
};

try {
  const response = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(15_000) });
  const body = await response.text();
  record.response = { status: response.status, bodyExcerpt: body.slice(0, 1000) };
  await writeFile(resolve(evidenceDir, "phase0-health.json"), `${JSON.stringify(record, null, 2)}\n`);
  console.table([{ module: "environment/health", status: response.ok ? "PASS" : "FAIL", evidence: "docs/e2e-evidence/phase0-health.json" }]);
  process.exitCode = response.ok ? 0 : 1;
} catch (error) {
  record.error = { name: error?.name || "Error", message: error?.message || String(error) };
  await writeFile(resolve(evidenceDir, "phase0-health.json"), `${JSON.stringify(record, null, 2)}\n`);
  console.table([{ module: "environment/health", status: "BLOCKED", evidence: "docs/e2e-evidence/phase0-health.json" }]);
  console.error("Live E2E preflight could not reach the backend. Start the backend with a reachable MongoDB first.");
  process.exitCode = 1;
}
