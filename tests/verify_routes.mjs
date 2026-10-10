/**
 * Verify Next.js Route Rendering Matrix (Mock Mode Baseline)
 * Verifies all 43 app router pages render cleanly on http://localhost:3000
 */

const BASE_URL = "http://localhost:3000";

const routes = [
  // Public & Auth (8 routes)
  { path: "/", name: "Public Landing Page" },
  { path: "/about", name: "About Vismaya Page" },
  { path: "/contact", name: "Contact Us Page" },
  { path: "/login", name: "User Login Page" },
  { path: "/register", name: "User Registration Page" },
  { path: "/forgot-password", name: "Password Recovery Page" },
  { path: "/opportunities", name: "Opportunities Catalog" },
  { path: "/opportunities/opp-1", name: "Opportunity Detail Page" },

  // Talent Portal (10 routes)
  { path: "/talent", name: "Talent Portal Index" },
  { path: "/talent/dashboard", name: "Talent Dashboard" },
  { path: "/talent/profile", name: "Talent Profile View/Edit" },
  { path: "/talent/portfolio", name: "Talent Media Portfolio" },
  { path: "/talent/applications", name: "Talent Applications Tracker" },
  { path: "/talent/auditions", name: "Talent Auditions Hub" },
  { path: "/talent/opportunities", name: "Talent Opportunities Directory" },
  { path: "/talent/opportunities/opp-1", name: "Talent Opportunity Detail" },
  { path: "/talent/notifications", name: "Talent Notifications Center" },
  { path: "/talent/settings", name: "Talent Account Settings" },

  // Recruiter Portal (10 routes)
  { path: "/recruiter", name: "Recruiter Portal Index" },
  { path: "/recruiter/dashboard", name: "Recruiter Dashboard" },
  { path: "/recruiter/projects", name: "Recruiter Projects List" },
  { path: "/recruiter/projects/proj-1", name: "Recruiter Project Detail" },
  { path: "/recruiter/opportunities", name: "Recruiter Casting Opportunities" },
  { path: "/recruiter/opportunities/new", name: "Recruiter Create Opportunity" },
  { path: "/recruiter/opportunities/opp-1/applicants", name: "Recruiter Opportunity Applicants" },
  { path: "/recruiter/shortlist-auditions", name: "Recruiter Shortlists & Auditions" },
  { path: "/recruiter/notifications", name: "Recruiter Notifications Center" },
  { path: "/recruiter/settings", name: "Recruiter Account Settings" },

  // Admin Portal (14 routes)
  { path: "/admin", name: "Admin Portal Index" },
  { path: "/admin/dashboard", name: "Admin Dashboard" },
  { path: "/admin/talent-management", name: "Admin Talent Management" },
  { path: "/admin/recruiter-management", name: "Admin Recruiter Management" },
  { path: "/admin/projects", name: "Admin Projects Directory" },
  { path: "/admin/opportunities", name: "Admin Opportunities Directory" },
  { path: "/admin/opportunity-review", name: "Admin Opportunity Review Queue" },
  { path: "/admin/cancellation-requests", name: "Admin Cancellation Requests" },
  { path: "/admin/applications", name: "Admin Applications Tracker" },
  { path: "/admin/auditions", name: "Admin Auditions Moderation" },
  { path: "/admin/media-moderation", name: "Admin Media Moderation Queue" },
  { path: "/admin/payments", name: "Admin Payments & Ledger" },
  { path: "/admin/analytics", name: "Admin Analytics & Metrics" },
  { path: "/admin/notifications", name: "Admin Notifications Management" },
];

async function verifyAllRoutes() {
  console.log("===============================================================================");
  console.log("  VERIFYING NEXT.JS ROUTE RENDERING MATRIX (MOCK MODE BASELINE)");
  console.log(`  Target: ${BASE_URL}`);
  console.log("===============================================================================\n");

  const results = [];

  for (const r of routes) {
    const url = `${BASE_URL}${r.path}`;
    try {
      const startTime = Date.now();
      const res = await fetch(url, { headers: { "User-Agent": "Vismaya-Route-Verifier" } });
      const elapsed = Date.now() - startTime;
      const html = await res.text();
      const is200 = res.status === 200;
      const hasContent = html.includes("<html") || html.includes("<!DOCTYPE") || html.length > 500;

      results.push({
        path: r.path,
        name: r.name,
        status: res.status,
        passed: is200 && hasContent,
        elapsedMs: elapsed,
        sizeBytes: html.length,
      });

      console.log(`[HTTP ${res.status}] ${r.path.padEnd(45)} => ${is200 ? "PASS" : "FAIL"} (${elapsed}ms, ${html.length} bytes)`);
    } catch (err) {
      results.push({
        path: r.path,
        name: r.name,
        status: 0,
        passed: false,
        details: err.message,
      });
      console.log(`[ERR]     ${r.path.padEnd(45)} => FAIL (${err.message})`);
    }
  }

  const passedCount = results.filter((r) => r.passed).length;
  console.log("\n===============================================================================");
  console.log(`  ROUTE MATRIX VERIFICATION: ${passedCount}/${results.length} PASSED (${results.length - passedCount} failed)`);
  console.log("===============================================================================\n");

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

verifyAllRoutes();
