/**
 * Playwright E2E Test: Shortlist -> Audition -> Notification Flow (Real Mode)
 * Prefix: E2E-SHORTLIST
 * Safety Rules:
 *  - Only cleans up E2E-SHORTLIST created documents with exact ID tracking.
 *  - Prints deleted counts.
 *  - Leaves the 9 orphan profiles untouched.
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("../../frontend/node_modules/playwright");
import mongoose from "../../backend/node_modules/mongoose/index.js";
import {
  connectDB,
  baseUrl,
  frontendUrl,
  apiRequest,
  jsonPost,
  jsonPatch,
  authGet,
  authHeader,
  getAdminToken,
  defaultPassword,
} from "./audit_helper.mjs";

const PREFIX = "E2E-SHORTLIST";
const runTimestamp = Date.now();

const tracked = {
  users: [],
  profiles: [],
  orgs: [],
  projects: [],
  opps: [],
  apps: [],
  auditions: [],
  notifications: [],
};

async function cleanup(db) {
  console.log("\n--- Cleaning up E2E-SHORTLIST test data ---");
  for (const [collectionName, ids] of Object.entries(tracked)) {
    if (!ids || ids.length === 0) continue;
    const mongoCollection = collectionName === "opps" ? "opportunities"
      : collectionName === "apps" ? "applications"
      : collectionName === "orgs" ? "organizations"
      : collectionName;
    const objectIds = ids.map((id) => (typeof id === "string" ? new mongoose.Types.ObjectId(id) : id));
    const res = await db.collection(mongoCollection).deleteMany({
      _id: { $in: objectIds },
    });
    console.log(`Cleaned up ${res.deletedCount} items from '${mongoCollection}'`);
  }
}

export async function runShortlistAuditionFlow(opts = {}) {
  const db = await connectDB();
  let browser;

  try {
    console.log(`\n=============================================================`);
    console.log(`RUNNING E2E-SHORTLIST: AUDITION & NOTIFICATION FLOW TEST`);
    console.log(`=============================================================\n`);

    const adminToken = opts.adminToken || await getAdminToken();
    console.log("Admin token acquired successfully for opportunity approval.");

    // 1. Create Organization User
    const orgEmail = `e2e-shortlist-org-${runTimestamp}@example.com`;
    await apiRequest("Register Org", "/api/auth/register", jsonPost({
      name: "E2E Shortlist Studios",
      email: orgEmail,
      password: defaultPassword,
      role: "organization",
      mobile: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
      companyName: "E2E Shortlist Studios",
    }));

    const orgUser = await db.collection("users").findOne({ email: orgEmail });
    if (!orgUser) throw new Error("Org user not found after registration");
    tracked.users.push(orgUser._id);

    const orgDoc = await db.collection("organizations").findOne({ userId: orgUser._id });
    if (orgDoc) tracked.orgs.push(orgDoc._id);

    // Admin approves org user
    await apiRequest("Admin Approve Org", `/api/admin/users/${orgUser._id}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // Login Org to get real session and token
    const orgLoginRes = await apiRequest("Login Org", "/api/auth/login", jsonPost({
      email: orgEmail,
      password: defaultPassword,
    }));
    const orgToken = orgLoginRes.body?.token;
    if (!orgToken) throw new Error(`Org login failed: ${JSON.stringify(orgLoginRes.body)}`);
    console.log("Org logged in successfully via /api/auth/login");

    // 2. Create Talent User
    const talentEmail = `e2e-shortlist-talent-${runTimestamp}@example.com`;
    await apiRequest("Register Talent", "/api/auth/register", jsonPost({
      name: "E2E Shortlist Talent",
      email: talentEmail,
      password: defaultPassword,
      role: "talent",
      mobile: `+9197${Math.floor(10000000 + Math.random() * 90000000)}`,
    }));

    const talentUser = await db.collection("users").findOne({ email: talentEmail });
    if (!talentUser) throw new Error("Talent user not found after registration");
    tracked.users.push(talentUser._id);

    const talentProfileDoc = await db.collection("talentprofiles").findOne({ userId: talentUser._id });
    if (talentProfileDoc) tracked.profiles.push(talentProfileDoc._id);

    // Admin approves talent user
    await apiRequest("Admin Approve Talent", `/api/admin/users/${talentUser._id}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // Mark talent user & profile as paid and approved for opportunity application gating
    await db.collection("users").updateOne(
      { _id: talentUser._id },
      { $set: { isPaid: true, status: "active", isEmailVerified: true } }
    );
    await db.collection("talentprofiles").updateOne(
      { userId: talentUser._id },
      { $set: { isPaid: true, status: "approved", isProfileApproved: true, isVerified: true, profileCompletionPercentage: 85 } }
    );

    // Login Talent to get real session and token
    const talentLoginRes = await apiRequest("Login Talent", "/api/auth/login", jsonPost({
      email: talentEmail,
      password: defaultPassword,
    }));
    const talentToken = talentLoginRes.body?.token;
    if (!talentToken) throw new Error(`Talent login failed: ${JSON.stringify(talentLoginRes.body)}`);
    console.log("Talent logged in successfully via /api/auth/login");

    // 3. Create Project & Opportunity via Org API
    const projectRes = await apiRequest("Create Project", "/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${orgToken}`,
      },
      body: JSON.stringify({
        projectName: `Shortlist Feature Film ${runTimestamp}`,
        projectType: "Feature Film",
        description: "A feature film project for audition flow test",
      }),
    });
    const project = projectRes.body?.project || projectRes.body?.data || projectRes.body;
    const projectId = project?._id || project?.id;
    if (projectId) tracked.projects.push(projectId);

    const oppRes = await apiRequest("Create Opportunity", "/api/opportunities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${orgToken}`,
      },
      body: JSON.stringify({
        title: `Lead Protagonist Casting ${runTimestamp}`,
        projectId: projectId,
        summary: "Looking for an energetic lead actor for upcoming drama",
        role: "Kabir Sharma",
        location: "Mumbai",
        positionsCount: 1,
        deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      }),
    });
    const opportunity = oppRes.body?.opportunity || oppRes.body?.data || oppRes.body;
    const oppId = opportunity?._id || opportunity?.id;
    if (oppId) tracked.opps.push(oppId);

    console.log(`Created Project: ${projectId}, Opportunity: ${oppId}`);

    // Approve opportunity via admin review API
    if (adminToken) {
      console.log("Approving opportunity via admin approve API...");
      const approveRes = await apiRequest("Admin Approve Opp", `/api/admin/opportunities/${oppId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      });
      console.log("Opp approval status:", approveRes.status);
    }

    // 4. Talent Applies
    const applyRes = await apiRequest("Talent Apply", `/api/applications/${oppId}/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${talentToken}`,
      },
      body: JSON.stringify({
        characterRole: "Kabir Sharma",
        roleApplied: "Kabir Sharma",
        coverNote: "Excited for this lead role!",
        consentGiven: true,
      }),
    });
    console.log("Talent Apply Response:", applyRes.status, JSON.stringify(applyRes.body));
    const application = applyRes.body?.application || applyRes.body?.data || applyRes.body;
    const appId = application?._id || application?.id;
    if (appId) tracked.apps.push(appId);
    console.log(`Talent applied successfully! Application ID: ${appId}`);

    // Launch Playwright Browser for UI Flow
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    // 5. Org shortlists talent via UI/API and schedules audition
    console.log("\n--- Org Shortlists & Schedules Audition ---");
    // Shortlist application
    const shortlistRes1 = await apiRequest("Shortlist App (Call 1)", `/api/applications/${appId}/shortlist`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${orgToken}` },
    });
    console.log("Shortlist Call 1 response:", shortlistRes1.status);

    // Call shortlist AGAIN to test deduplication
    const shortlistRes2 = await apiRequest("Shortlist App (Call 2 - Deduplication)", `/api/applications/${appId}/shortlist`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${orgToken}` },
    });
    console.log("Shortlist Call 2 response:", shortlistRes2.status);

    // Schedule Audition
    const auditionRes = await apiRequest("Schedule Audition", `/api/auditions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${orgToken}`,
      },
      body: JSON.stringify({
        applicationId: appId,
        opportunityId: oppId,
        projectId: projectId,
        type: "video_interview",
        format: "video_interview",
        role: "Kabir Sharma",
        instructions: "Please prepare Monologue #3 from the script sides.",
        meetingLink: "https://meet.google.com/xyz-test-shortlist",
        scheduledAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      }),
    });
    console.log("Audition Response:", auditionRes.status, JSON.stringify(auditionRes.body));
    const auditionDoc = auditionRes.body?.audition || auditionRes.body?.data || auditionRes.body;
    const auditionId = auditionDoc?._id || auditionDoc?.id;
    if (auditionId) tracked.auditions.push(auditionId);
    console.log(`Audition scheduled: ${auditionId}`);

    // 6. Talent Playwright DOM Assertions
    console.log("\n--- Talent DOM Assertions via Playwright ---");
    const talentPage = await context.newPage();

    // Set auth cookie / localStorage for talent
    await talentPage.goto(`${frontendUrl}/login`);
    const sessionUser = talentLoginRes.body?.user || {
      id: talentUser._id,
      name: talentUser.name,
      email: talentUser.email,
      role: "talent",
      status: "active",
    };
    await talentPage.evaluate(({ token, user }) => {
      localStorage.setItem("vismaya_auth_token", token);
      localStorage.setItem("vismaya_user_data", JSON.stringify(user));
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("auth_user", JSON.stringify(user));
      document.cookie = `token=${token}; path=/;`;
    }, { token: talentToken, user: sessionUser });

    // 6.a Dashboard Check: Role & Status
    await talentPage.goto(`${frontendUrl}/talent/dashboard`);
    await talentPage.waitForLoadState("networkidle");

    const appUpdatesSection = await talentPage.content();
    console.log("Checking dashboard for Role and Shortlisted status...");
    const hasRole = appUpdatesSection.includes("Kabir Sharma");
    const hasShortlisted = appUpdatesSection.includes("SHORTLISTED") || appUpdatesSection.includes("Shortlisted");
    console.log(`Dashboard check: Role 'Kabir Sharma' found: ${hasRole}, Status 'Shortlisted' found: ${hasShortlisted}`);
    if (!hasRole) throw new Error("Dashboard 'Recent Application Updates' failed to display role name!");

    // 6.b Application Detail / My Applications Check: Audition Block
    await talentPage.goto(`${frontendUrl}/talent/applications?id=${appId}`);
    await talentPage.waitForLoadState("networkidle");
    await talentPage.waitForTimeout(1000);

    const appsPageContent = await talentPage.content();
    console.log("Checking Applications page for Audition block...");
    const hasAuditionBlock = appsPageContent.includes("Audition Details") || appsPageContent.includes("Audition");
    const hasMeetingLink = appsPageContent.includes("meet.google.com/xyz-test-shortlist");
    const hasInstructions = appsPageContent.includes("Monologue #3");
    console.log(`Audition block: ${hasAuditionBlock}, Meeting Link: ${hasMeetingLink}, Instructions: ${hasInstructions}`);
    if (!hasMeetingLink || !hasInstructions) {
      throw new Error("Application detail failed to show scheduled audition details!");
    }

    // 6.c /talent/auditions Check
    await talentPage.goto(`${frontendUrl}/talent/auditions`);
    await talentPage.waitForLoadState("networkidle");
    await talentPage.waitForTimeout(1000);

    const audPageContent = await talentPage.content();
    const hasAudOnAudPage = audPageContent.includes("Kabir Sharma") && audPageContent.includes("meet.google.com/xyz-test-shortlist");
    console.log(`/talent/auditions shows scheduled audition: ${hasAudOnAudPage}`);
    if (!hasAudOnAudPage) throw new Error("/talent/auditions failed to show scheduled audition!");

    // 6.d /talent/notifications Check: Notifications & Deduplication
    await talentPage.goto(`${frontendUrl}/talent/notifications`);
    await talentPage.waitForLoadState("networkidle");
    await talentPage.waitForTimeout(1000);

    const notifPageContent = await talentPage.content();
    console.log("Checking Notifications page...");
    const hasShortlistNotif = notifPageContent.includes("shortlisted for Kabir Sharma");
    const hasAudNotif = notifPageContent.includes("Audition Scheduled") || notifPageContent.includes("Monologue #3") || notifPageContent.includes("meet.google.com");
    console.log(`Shortlist notification displayed: ${hasShortlistNotif}, Audition notification displayed: ${hasAudNotif}`);

    // Check DB notifications for talent to verify deduplication
    const notifs = await db.collection("notifications").find({
      recipient: talentUser._id || talentUser.id,
    }).toArray();
    for (const n of notifs) tracked.notifications.push(n._id);

    const shortlistCount = notifs.filter(n => n.type === "shortlisted").length;
    const auditionCount = notifs.filter(n => n.type === "audition_scheduled").length;
    console.log(`DB Notification counts for talent: shortlisted=${shortlistCount} (expected 1), audition_scheduled=${auditionCount} (expected 1)`);
    if (shortlistCount !== 1) {
      throw new Error(`Deduplication failed: expected exactly 1 shortlist notification, found ${shortlistCount}`);
    }
    if (auditionCount !== 1) {
      throw new Error(`Expected exactly 1 audition_scheduled notification, found ${auditionCount}`);
    }

    // 7. Test Select & Not Selected Transitions
    console.log("\n--- Testing Selected / Not Selected Transitions ---");
    // Trigger Select
    await apiRequest("Select App", `/api/applications/${appId}/select`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${orgToken}` },
    });
    // Trigger Select Again (Deduplication Check)
    await apiRequest("Select App (Call 2 - Deduplication)", `/api/applications/${appId}/select`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${orgToken}` },
    });

    const notifsAfterSelect = await db.collection("notifications").find({
      recipient: talentUser._id || talentUser.id,
      type: "selected",
    }).toArray();
    for (const n of notifsAfterSelect) {
      if (!tracked.notifications.includes(n._id)) tracked.notifications.push(n._id);
    }
    console.log(`DB Notification count for selected: ${notifsAfterSelect.length} (expected 1)`);
    if (notifsAfterSelect.length !== 1) {
      throw new Error(`Deduplication failed: expected exactly 1 selected notification, found ${notifsAfterSelect.length}`);
    }

    // Trigger Not Selected transition on a separate applicant
    console.log("\n--- Testing Not Selected Transition on Applicant 2 ---");
    const talentEmail2 = `e2e-shortlist-talent2-${runTimestamp}@example.com`;
    await apiRequest("Register Talent 2", "/api/auth/register", jsonPost({
      name: "E2E Shortlist Talent Two",
      email: talentEmail2,
      password: defaultPassword,
      role: "talent",
      mobile: `+9196${Math.floor(10000000 + Math.random() * 90000000)}`,
    }));
    const talentUser2 = await db.collection("users").findOne({ email: talentEmail2 });
    tracked.users.push(talentUser2._id);
    const prof2 = await db.collection("talentprofiles").findOne({ userId: talentUser2._id });
    if (prof2) tracked.profiles.push(prof2._id);

    await apiRequest("Admin Approve Talent 2", `/api/admin/users/${talentUser2._id}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    await db.collection("users").updateOne(
      { _id: talentUser2._id },
      { $set: { isPaid: true, status: "active", isEmailVerified: true } }
    );
    await db.collection("talentprofiles").updateOne(
      { userId: talentUser2._id },
      { $set: { isPaid: true, status: "approved", isProfileApproved: true, isVerified: true, profileCompletionPercentage: 85 } }
    );

    const talentLoginRes2 = await apiRequest("Login Talent 2", "/api/auth/login", jsonPost({
      email: talentEmail2,
      password: defaultPassword,
    }));
    const talentToken2 = talentLoginRes2.body?.token;

    const applyRes2 = await apiRequest("Talent 2 Apply", `/api/applications/${oppId}/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${talentToken2}`,
      },
      body: JSON.stringify({
        characterRole: "Supporting Lead",
        roleApplied: "Supporting Lead",
        coverNote: "Interested in supporting role.",
        consentGiven: true,
      }),
    });
    console.log("Apply 2 Response:", applyRes2.status, JSON.stringify(applyRes2.body));
    const app2 = applyRes2.body?.application || applyRes2.body?.data || applyRes2.body;
    const appId2 = app2?._id || app2?.id;
    if (appId2) tracked.apps.push(appId2);

    // Reject App 2 (Not Selected)
    const rej1 = await apiRequest("Reject App 2", `/api/applications/${appId2}/not-selected`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${orgToken}` },
    });
    console.log("Reject 1 Response:", rej1.status, JSON.stringify(rej1.body));
    // Trigger Reject Again (Deduplication Check)
    await apiRequest("Reject App 2 (Call 2 - Deduplication)", `/api/applications/${appId2}/not-selected`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${orgToken}` },
    });

    const notifsAfterReject = await db.collection("notifications").find({
      recipient: talentUser2._id,
      type: "not_selected",
    }).toArray();
    for (const n of notifsAfterReject) {
      if (!tracked.notifications.includes(n._id)) tracked.notifications.push(n._id);
    }
    console.log(`DB Notification count for not_selected (Talent 2): ${notifsAfterReject.length} (expected 1)`);
    if (notifsAfterReject.length !== 1) {
      throw new Error(`Deduplication failed: expected exactly 1 not_selected notification, found ${notifsAfterReject.length}`);
    }

    console.log("\nALL E2E-SHORTLIST CHECKS PASSED SUCCESSFULLY!");
  } finally {
    if (browser) await browser.close();
    await cleanup(db);
  }
}

if (process.argv[1] && process.argv[1].endsWith("test_shortlist_audition_flow.mjs")) {
  runShortlistAuditionFlow()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Test failed:", err);
      process.exit(1);
    });
}
