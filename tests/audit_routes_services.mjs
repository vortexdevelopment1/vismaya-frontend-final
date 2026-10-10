import fs from "fs";
import path from "path";

const routesDir = "vismaya-backend (3)/vismaya-backend/src/routes";
const routeFiles = fs.readdirSync(routesDir).filter((f) => f.endsWith(".js"));

const filePrefixes = {
  "health.routes.js": ["/api/health"],
  "auth.routes.js": ["/api/auth"],
  "admin.routes.js": ["/api/admin"],
  "organization.routes.js": ["/api/organization", "/api/company"],
  "project.routes.js": ["/api/projects"],
  "opportunity.routes.js": ["/api/opportunities"],
  "application.routes.js": ["/api/applications"],
  "audition.routes.js": ["/api/auditions"],
  "notification.routes.js": ["/api/notifications"],
  "talentProfile.routes.js": ["/api/talent/profile", "/api/talent-profiles", "/api/talent"],
  "media.routes.js": ["/api/media"],
  "verification.routes.js": ["/api/verifications"],
  "credit.routes.js": ["/api/credits"],
  "payment.routes.js": ["/api/payments"],
  "taxonomy.routes.js": ["/api/taxonomy"],
  "successStory.routes.js": ["/api/success-stories"],
  "test.routes.js": ["/api/test"],
};

const backendRoutes = [];

for (const file of routeFiles) {
  const content = fs.readFileSync(path.join(routesDir, file), "utf8");
  // Regex to match router.get/post/put/patch/delete with path on same or next line
  const routeRegex = /router\.(get|post|put|patch|delete)\s*\(\s*["'`]([^"'`]+)["'`]/gi;
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2];
    const prefixes = filePrefixes[file] || ["/api"];
    // calculate line number
    const lineNum = content.substring(0, match.index).split("\n").length;
    for (const p of prefixes) {
      const fullPath = (p + (routePath === "/" ? "" : routePath)).replace(/\/+/g, "/");
      backendRoutes.push({
        method,
        subPath: routePath,
        fullPath,
        file,
        line: lineNum,
      });
    }
  }
}

console.log("Extracted Backend Routes Count:", backendRoutes.length);

const servicesDir = "frontend/lib/api/services";
const serviceFiles = fs.readdirSync(servicesDir).filter((f) => f.endsWith(".js") && f !== "index.js" && f !== "mockSeedData.js");

const serviceEndpoints = [];

for (const sFile of serviceFiles) {
  const content = fs.readFileSync(path.join(servicesDir, sFile), "utf8");
  const lines = content.split("\n");
  let currentFn = null;
  let currentFnLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fnMatch = line.match(/^\s*(async\s+)?([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/);
    if (fnMatch && fnMatch[2] !== "if" && fnMatch[2] !== "for" && fnMatch[2] !== "while" && fnMatch[2] !== "switch") {
      currentFn = fnMatch[2];
      currentFnLine = i + 1;
    }

    const apiCallMatch = line.match(/apiClient\.(get|post|put|patch|delete)\s*\(\s*([`"'][^`"']+[`"'])/i);
    if (apiCallMatch && currentFn) {
      const method = apiCallMatch[1].toUpperCase();
      let pathTemplate = apiCallMatch[2].replace(/[`"']/g, "");

      // Check against backend routes
      const match = backendRoutes.find((br) => {
        if (br.method !== method) return false;
        
        // Convert Express route pattern (e.g. /api/applications/:applicationId/review) to regex
        const pattern = "^" + br.fullPath
          .replace(/\/:[a-zA-Z0-9_]+/g, "/[^/]+")
          + "$";
        
        // Convert service path template (e.g. /api/applications/${applicationId}/review) to concrete test string
        const testPath = pathTemplate.replace(/\$\{[^}]+\}/g, "placeholder_id");
        
        return new RegExp(pattern).test(testPath) || br.fullPath === pathTemplate;
      });

      serviceEndpoints.push({
        service: sFile.replace(".js", ""),
        functionName: currentFn,
        fnLine: currentFnLine,
        method,
        path: pathTemplate,
        matchedRoute: match ? `${match.method} ${match.fullPath} (${match.file}:${match.line})` : "NO BACKEND ROUTE (GAP)",
        hasBackendRoute: !!match,
      });
    }
  }
}

console.log("\n===============================================================================");
console.log("  FRONTEND SERVICE FUNCTION -> BACKEND ROUTE MATRIX");
console.log("===============================================================================\n");

console.log("| Service | Function | Method & Path | Backend Route Definition | Status |");
console.log("|---|---|---|---|---|");

for (const ep of serviceEndpoints) {
  const status = ep.hasBackendRoute ? "EXISTS" : "**FLAGGED (NO BACKEND ROUTE)**";
  console.log(`| \`${ep.service}\` | \`${ep.functionName}\` | \`${ep.method} ${ep.path}\` | \`${ep.matchedRoute}\` | ${status} |`);
}

const gaps = serviceEndpoints.filter((ep) => !ep.hasBackendRoute);
console.log(`\nTotal Service Endpoints Audited: ${serviceEndpoints.length}`);
console.log(`Endpoints with matching backend routes: ${serviceEndpoints.length - gaps.length}`);
console.log(`Endpoints without backend routes (GAPS): ${gaps.length}`);
if (gaps.length > 0) {
  console.log("\nFLAGGED GAPS:");
  gaps.forEach((g) => console.log(` - ${g.service}.${g.functionName} -> ${g.method} ${g.path}`));
}
