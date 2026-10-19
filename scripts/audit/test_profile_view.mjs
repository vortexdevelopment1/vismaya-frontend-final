/**
 * Live Playwright E2E Test Suite for Profile View & Edit Roundtrip
 * Prefix: E2E-VIEW
 */

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("../../frontend/node_modules/playwright");
import mongoose from "../../backend/node_modules/mongoose/index.js";
import bcrypt from "../../backend/node_modules/bcrypt/bcrypt.js";
import {
  connectDB,
  baseUrl,
  frontendUrl,
  defaultPassword,
  apiRequest,
  jsonPost,
  jsonPut,
  authGet,
  getAdminToken,
} from "./audit_helper.mjs";

const RUN_PREFIX = `E2E-VIEW-${Date.now()}`;
const tracked = {
  users: [],
  profiles: [],
  sessions: [],
  credits: [],
  media: [],
};

async function createTalentUser({ name, dob = "1996-04-12", isMinor = false, createInitialProfile = false }) {
  const db = await connectDB();
  const uId = new mongoose.Types.ObjectId();
  const email = `${RUN_PREFIX.toLowerCase()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
  const hash = await bcrypt.hash(defaultPassword, 10);
  const now = new Date();

  const userDoc = {
    _id: uId,
    name,
    email,
    mobile: `+9191${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: hash,
    role: "talent",
    status: "active",
    isEmailVerified: true,
    isPaid: true,
    emailNotificationsEnabled: true,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection("users").insertOne(userDoc);
  tracked.users.push(uId);

  let profileDoc = null;
  if (createInitialProfile) {
    const pId = new mongoose.Types.ObjectId();
    profileDoc = {
      _id: pId,
      userId: uId,
      vismayaId: `VIS-VIEW${Math.floor(100000 + Math.random() * 900000)}`,
      category: "open_talent",
      primaryProfession: "Actor",
      stageName: name,
      firstName: name.split(" ")[0],
      currentCity: "Bengaluru",
      currentState: "Karnataka",
      bio: "Professional actor with extensive experience in commercial theatre and screen productions. Dedicated to authentic performance and creative storytelling across classical and contemporary genres.",
      profilePhoto: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400",
      status: "approved",
      isProfileApproved: true,
      dob: new Date(dob),
      isUnder18: isMinor,
      skills: [{ name: "Method Acting", proficiency: "intermediate" }],
      languages: [{ language: "English", proficiency: "conversational" }],
      credits: [],
      portfolio: { photos: [], videos: [], showreelUrl: "" },
      createdAt: now,
      updatedAt: now,
    };
    await db.collection("talentprofiles").insertOne(profileDoc);
    tracked.profiles.push(pId);
  }

  const sessionId = new mongoose.Types.ObjectId().toString();
  await db.collection("sessions").insertOne({
    userId: uId,
    sessionId,
    ipAddress: "127.0.0.1",
    userAgent: "Playwright-View-Test",
    isValid: true,
    expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
    createdAt: now,
    updatedAt: now,
  });
  tracked.sessions.push(sessionId);

  const jwt = await import("../../backend/node_modules/jsonwebtoken/index.js");
  const signJwt = jwt.default || jwt;
  const token = signJwt.sign(
    {
      userId: uId.toString(),
      role: "talent",
      email,
      sessionId,
    },
    process.env.JWT_SECRET || "vismaya_jwt_secret_dev_key_2026",
    { expiresIn: "4h" }
  );

  return { user: userDoc, profile: profileDoc, token, email };
}

async function injectSession(page, u, token, role = "talent") {
  await page.goto(`${frontendUrl}/login`, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.evaluate(({ u, token, role }) => {
    localStorage.removeItem("vismaya_talent_profile");
    localStorage.removeItem("vismaya_talent_portfolio");
    localStorage.setItem("vismaya_auth_token", token);
    localStorage.setItem("vismaya_user_data", JSON.stringify({
      id: u._id.toString(),
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: role,
      isEmailVerified: true,
      isPaid: true,
    }));
  }, { u, token, role });
}

async function runProfileViewTests() {
  console.log("======================================================");
  console.log(`Starting Profile View & Roundtrip Test Suite: ${RUN_PREFIX}`);
  console.log("======================================================\n");

  const db = await connectDB();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const testReport = {
    test1_emptyProfileLandsInBuilder: false,
    test2_adultProfileSaveAndDOMVerification: false,
    test3_reloadAndEditPrefillRoundtrip: false,
    test4_minorGuardianDetailsVisibility: false,
    test5_checklistCardFunctionality: false,
    test6_recruiterPrivacyProtection: false,
    test7_cleanupVerification: false,
  };

  try {
    // -----------------------------------------------------------------
    // TEST 1: New Talent with Empty Profile Lands in Builder Form
    // -----------------------------------------------------------------
    console.log("--- TEST 1: New Talent Empty Profile Lands in Builder ---");
    const newTalent = await createTalentUser({ name: "E2E-VIEW Fresh Talent", createInitialProfile: false });
    await injectSession(page, newTalent.user, newTalent.token);
    await page.goto(`${frontendUrl}/talent/profile`, { waitUntil: "networkidle", timeout: 15000 });

    // Assert that the page displays the builder (Step 1) and not an empty ProfileView
    const hasStepper = await page.locator(".profile-stepper-nav").isVisible().catch(() => false);
    const hasCategorySelect = await page.locator("select").first().isVisible().catch(() => false);
    console.log("Test 1 Result:", { hasStepper, hasCategorySelect });
    testReport.test1_emptyProfileLandsInBuilder = hasStepper && hasCategorySelect;

    // -----------------------------------------------------------------
    // TEST 2: Adult Talent Saves All 4 Steps & Profile View DOM Assertions
    // -----------------------------------------------------------------
    console.log("\n--- TEST 2: Adult Talent Save All 4 Steps & Profile View DOM Check ---");
    const adultTalent = await createTalentUser({ name: "E2E-VIEW Master Performer", createInitialProfile: false });
    await injectSession(page, adultTalent.user, adultTalent.token);
    await page.goto(`${frontendUrl}/talent/profile?step=1`, { waitUntil: "networkidle", timeout: 15000 });

    // Step 1: Fill inputs
    // Headline
    const headlineInput = page.locator("input[placeholder*='Method Actor']");
    await headlineInput.fill("E2E-VIEW Award Winning Dramatic Actor");

    // Stage Name
    const stageNameInput = page.locator("input[placeholder*='Stage Name']");
    await stageNameInput.fill("E2E-VIEW Master Performer");

    // Primary Profession
    const profInput = page.locator("input[placeholder*='Actor, Model']");
    await profInput.fill("Actor");

    // Secondary Professions tags
    const secProfInput = page.locator("input[placeholder*='Add secondary craft']");
    await secProfInput.fill("Voice Artist");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(100);
    await secProfInput.fill("Commercial Model");
    await page.keyboard.press("Enter");

    // Specializations tags
    const specInput = page.locator("input[placeholder*='Method Acting, Stunts']");
    await specInput.fill("Method Acting");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(100);
    await specInput.fill("Shakespearean");
    await page.keyboard.press("Enter");

    // Bio
    const bioText = "Accomplished, dedicated, and professionally trained performing artist with extensive stage, short film, and commercial experience across classical and modern drama productions in India and internationally. Trained in classical theatre and method acting.";
    const bioTextarea = page.locator("textarea");
    await bioTextarea.fill(bioText);

    // City & State
    const cityInput = page.locator("input[placeholder*='Mumbai, Bengaluru']");
    await cityInput.fill("Bengaluru");
    const stateInput = page.locator("input[placeholder*='Maharashtra, Karnataka']");
    await stateInput.fill("Karnataka");

    // Working cities tags
    const workCityInput = page.locator("input[placeholder*='Hyderabad, Chennai']");
    await workCityInput.fill("Mumbai");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(100);
    await workCityInput.fill("Hyderabad");
    await page.keyboard.press("Enter");

    // Skills
    const skillInput = page.locator("input[placeholder*='Method Acting, Classical Dance']");
    await skillInput.fill("Method Acting");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(100);
    await skillInput.fill("Stage Combat");
    await page.keyboard.press("Enter");

    // Languages
    const langInput = page.locator("input[placeholder*='Hindi (Native)']");
    await langInput.fill("English");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(100);
    await langInput.fill("Hindi");
    await page.keyboard.press("Enter");

    // Click Save & Continue to Step 2
    const saveStep1Btn = page.locator("button:has-text('Save & Continue')");
    await saveStep1Btn.click();
    await page.waitForTimeout(1000);

    // Step 2: Portfolio - Advance to Step 3
    const step2ContinueBtn = page.locator("button:has-text('Save & Continue')");
    await step2ContinueBtn.click();
    await page.waitForTimeout(1000);

    // Step 3: Add Credit
    const creditTitleInput = page.locator("input[placeholder*='e.g. Sacred Games']");
    await creditTitleInput.fill("E2E-VIEW Masterpiece Film");
    const creditRoleInput = page.locator("input[placeholder*='e.g. Lead Antagonist']");
    await creditRoleInput.fill("Lead Protagonist");
    const addCreditBtn = page.locator("button:has-text('Submit Credit for Verification')");
    await addCreditBtn.click();
    await page.waitForTimeout(1000);

    const step3ContinueBtn = page.locator("button:has-text('Save & Continue')");
    await step3ContinueBtn.click();
    await page.waitForTimeout(1000);

    // Step 4: Personal Info
    const heightInput = page.locator("input[placeholder*='175']");
    await heightInput.fill("175");
    const weightInput = page.locator("input[placeholder*='68']");
    await weightInput.fill("70");

    // Save & Finish
    const finishBtn = page.locator("button:has-text('Save & Finish')");
    await finishBtn.click();
    await page.waitForTimeout(2000);

    // Assert that we returned to PROFILE VIEW (no ?step=)
    const currentUrl = page.url();
    const hasEditProfileBtn = await page.locator("#btn-edit-profile").isVisible().catch(() => false);

    // Check all DOM values
    const domStageName = await page.locator("#view-stage-name").textContent().catch(() => "");
    const domHeadline = await page.locator("#view-headline").textContent().catch(() => "");
    const domLocation = await page.locator("#view-location").textContent().catch(() => "");
    const domSecProf = await page.locator("#view-secondary-professions").textContent().catch(() => "");
    const domSpec = await page.locator("#view-specializations").textContent().catch(() => "");
    const domWorkingCities = await page.locator("#view-working-cities").textContent().catch(() => "");
    const domSkills = await page.locator("#view-skills").textContent().catch(() => "");
    const domLanguages = await page.locator("#view-languages").textContent().catch(() => "");
    const domHeight = await page.locator("#view-height").textContent().catch(() => "");
    const domWeight = await page.locator("#view-weight").textContent().catch(() => "");
    const domGuardianVisible = await page.locator("#view-guardian-card").isVisible().catch(() => false);

    console.log("Test 2 Profile View DOM Results:", {
      currentUrl,
      hasEditProfileBtn,
      domStageName,
      domHeadline,
      domLocation,
      domSecProf,
      domSpec,
      domWorkingCities,
      domSkills,
      domLanguages,
      domHeight,
      domWeight,
      domGuardianVisible,
    });

    const adultProfileSavedInDB = await db.collection("talentprofiles").findOne({ userId: adultTalent.user._id });
    if (adultProfileSavedInDB) tracked.profiles.push(adultProfileSavedInDB._id);

    testReport.test2_adultProfileSaveAndDOMVerification =
      hasEditProfileBtn &&
      domStageName.includes("E2E-VIEW Master Performer") &&
      domHeadline.includes("E2E-VIEW Award Winning Dramatic Actor") &&
      domLocation.includes("Bengaluru") &&
      domSecProf.includes("Voice Artist") &&
      domSkills.includes("Method Acting") &&
      domLanguages.includes("English") &&
      domHeight.includes("175") &&
      !domGuardianVisible;

    // -----------------------------------------------------------------
    // TEST 3: Reload Page & Prefill Roundtrip in Builder
    // -----------------------------------------------------------------
    console.log("\n--- TEST 3: Reload Page & Builder Prefill Roundtrip ---");
    await page.reload({ waitUntil: "networkidle" });
    const afterReloadHeadline = await page.locator("#view-headline").textContent().catch(() => "");

    // Click "Edit Profile"
    await page.locator("#btn-edit-profile").click();
    await page.waitForTimeout(1000);

    // Verify fields prefilled in builder
    const prefilledHeadline = await page.locator("input[placeholder*='Method Actor']").inputValue().catch(() => "");
    const prefilledStageName = await page.locator("input[placeholder*='Stage Name']").inputValue().catch(() => "");
    const prefilledCity = await page.locator("input[placeholder*='Mumbai, Bengaluru']").inputValue().catch(() => "");
    const prefilledState = await page.locator("input[placeholder*='Maharashtra, Karnataka']").inputValue().catch(() => "");

    // Change headline and save
    await page.locator("input[placeholder*='Method Actor']").fill("E2E-VIEW Updated Star Headline");
    await page.locator("button:has-text('Save Draft')").click();
    await page.waitForTimeout(1000);

    // Click "View Profile"
    const viewProfBtn = page.locator("button:has-text('View Profile')");
    if (await viewProfBtn.isVisible().catch(() => false)) {
      await viewProfBtn.click();
    } else {
      await page.goto(`${frontendUrl}/talent/profile`, { waitUntil: "networkidle" });
    }
    await page.waitForTimeout(1000);

    const updatedViewHeadline = await page.locator("#view-headline").textContent().catch(() => "");
    console.log("Test 3 Prefill & Update Results:", {
      afterReloadHeadline,
      prefilledHeadline,
      prefilledStageName,
      prefilledCity,
      prefilledState,
      updatedViewHeadline,
    });

    testReport.test3_reloadAndEditPrefillRoundtrip =
      prefilledHeadline.includes("E2E-VIEW Award Winning Dramatic Actor") &&
      prefilledCity === "Bengaluru" &&
      prefilledState === "Karnataka" &&
      updatedViewHeadline.includes("E2E-VIEW Updated Star Headline");

    // -----------------------------------------------------------------
    // TEST 4: Minor Talent Guardian Details Visibility
    // -----------------------------------------------------------------
    console.log("\n--- TEST 4: Minor Talent Guardian Details Visibility ---");
    const minorTalent = await createTalentUser({
      name: "E2E-VIEW Minor Artist",
      dob: "2012-07-15",
      isMinor: true,
      createInitialProfile: false,
    });

    // Seed minor profile in DB with guardian details
    const minorProfId = new mongoose.Types.ObjectId();
    const minorDoc = {
      _id: minorProfId,
      userId: minorTalent.user._id,
      vismayaId: `VIS-MIN${Math.floor(100000 + Math.random() * 900000)}`,
      category: "open_talent",
      primaryProfession: "Actor",
      stageName: "E2E-VIEW Minor Artist",
      firstName: "E2E-VIEW",
      headline: "Child Actor & Performer",
      currentCity: "Mumbai",
      currentState: "Maharashtra",
      bio: "Talented young performer with exceptional spontaneity, camera confidence, and vocal articulation. Extensive training in theatre workshops, voice projection, classical drama, and commercial advertising campaigns across regional productions.",
      profilePhoto: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400",
      status: "approved",
      isProfileApproved: true,
      stepsCompletion: { step1: true, step2: true, step3: true, step4: true },
      dob: new Date("2012-07-15"),
      isUnder18: true,
      skills: [{ name: "Dance", proficiency: "intermediate" }],
      languages: [{ language: "Hindi", proficiency: "fluent" }],
      physicalAttributes: { heightCm: 148, weightKg: 38 },
      guardianDetails: {
        guardianName: "E2E-VIEW Guardian Parent",
        relationship: "Mother",
        contactNumber: "+919876543210",
        guardianEmail: "guardian.parent@example.com",
        consentGiven: true,
      },
      credits: [{ projectTitle: "Junior Star Film", roleOrDesignation: "Young Lead", projectType: "Feature Film", year: 2024 }],
      portfolio: { photos: ["https://images.unsplash.com/photo-1544717305-2782549b5136?w=400"], videos: [], showreelUrl: "" },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection("talentprofiles").insertOne(minorDoc);
    tracked.profiles.push(minorProfId);

    await injectSession(page, minorTalent.user, minorTalent.token);
    await page.goto(`${frontendUrl}/talent/profile`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForSelector("#view-guardian-card", { timeout: 8000 }).catch(() => {});

    const minorGuardianCardVisible = await page.locator("#view-guardian-card").isVisible().catch(() => false);
    const domGuardianName = minorGuardianCardVisible ? await page.locator("#view-guardian-name").textContent().catch(() => "") : "";
    const domGuardianRel = minorGuardianCardVisible ? await page.locator("#view-guardian-relationship").textContent().catch(() => "") : "";
    const domGuardianPhone = minorGuardianCardVisible ? await page.locator("#view-guardian-phone").textContent().catch(() => "") : "";
    const domGuardianEmail = minorGuardianCardVisible ? await page.locator("#view-guardian-email").textContent().catch(() => "") : "";

    console.log("Test 4 Minor Guardian Results:", {
      minorGuardianCardVisible,
      domGuardianName,
      domGuardianRel,
      domGuardianPhone,
      domGuardianEmail,
    });

    testReport.test4_minorGuardianDetailsVisibility =
      minorGuardianCardVisible &&
      domGuardianName.includes("E2E-VIEW Guardian Parent") &&
      domGuardianRel.includes("Mother") &&
      domGuardianEmail.includes("guardian.parent@example.com");

    // -----------------------------------------------------------------
    // TEST 5: Checklist Card Functionality & Navigation
    // -----------------------------------------------------------------
    console.log("\n--- TEST 5: Checklist Card & Step Navigation ---");
    // Adult talent profile had 1 credit and no portfolio media, so strength < 100%
    await injectSession(page, adultTalent.user, adultTalent.token);
    await page.goto(`${frontendUrl}/talent/profile`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForSelector("#checklist-card", { timeout: 8000 }).catch(() => {});

    const checklistVisible = await page.locator("#checklist-card").isVisible().catch(() => false);
    let checklistNavWorked = false;

    if (checklistVisible) {
      const step2Btn = page.locator("#checklist-card button:has-text('Go to Step 2')").first();
      if (await step2Btn.isVisible().catch(() => false)) {
        await step2Btn.click();
        await page.waitForTimeout(800);
        checklistNavWorked = page.url().includes("step=2");
      }
    }

    console.log("Test 5 Checklist Results:", { checklistVisible, checklistNavWorked });
    testReport.test5_checklistCardFunctionality = checklistVisible && checklistNavWorked;

    // -----------------------------------------------------------------
    // TEST 6: Recruiter Privacy Protection Verification
    // -----------------------------------------------------------------
    console.log("\n--- TEST 6: Recruiter Privacy Filter Verification ---");
    // When a recruiter or public viewer views the adult profile via API:
    // GET /api/talent/profile/:id (using public or recruiter view)
    const publicProfileRes = await apiRequest("Public Profile View", `/api/talent/profile/${adultTalent.user._id}`);
    const pubData = publicProfileRes.body?.profile || publicProfileRes.body?.data || publicProfileRes.body;

    const recruiterHidesPhone = !pubData?.mobile && !pubData?.phone && !pubData?.contactDetails?.mobile;
    const recruiterHidesPhysical = !pubData?.physicalAttributes?.heightCm && !pubData?.physical?.height;
    const recruiterHidesGuardian = !pubData?.guardianDetails?.guardianName;

    console.log("Test 6 Privacy Results:", {
      recruiterHidesPhone,
      recruiterHidesPhysical,
      recruiterHidesGuardian,
    });

    testReport.test6_recruiterPrivacyProtection =
      recruiterHidesPhone && recruiterHidesPhysical && recruiterHidesGuardian;

  } finally {
    await context.close();
    await browser.close();

    // -----------------------------------------------------------------
    // CLEANUP ROUTINE (Prefix E2E-VIEW)
    // -----------------------------------------------------------------
    console.log("\n--- CLEANUP ROUTINE: Removing all E2E-VIEW Records ---");
    const userDel = await db.collection("users").deleteMany({
      $or: [
        { name: { $regex: /^E2E-VIEW/i } },
        { email: { $regex: /e2e-view/i } },
        { _id: { $in: tracked.users } },
      ],
    });

    const profDel = await db.collection("talentprofiles").deleteMany({
      $or: [
        { stageName: { $regex: /^E2E-VIEW/i } },
        { headline: { $regex: /^E2E-VIEW/i } },
        { userId: { $in: tracked.users } },
        { _id: { $in: tracked.profiles } },
      ],
    });

    const sessDel = await db.collection("sessions").deleteMany({
      $or: [
        { userId: { $in: tracked.users } },
        { sessionId: { $in: tracked.sessions } },
      ],
    });

    // Check orphan profiles
    const allUsers = await db.collection("users").find({}).toArray();
    const allUserIds = new Set(allUsers.map((u) => u._id.toString()));
    const allProfiles = await db.collection("talentprofiles").find({}).toArray();
    const orphanCount = allProfiles.filter((p) => !allUserIds.has(p.userId?.toString())).length;

    console.log("Cleanup Summary:", {
      usersDeleted: userDel.deletedCount,
      profilesDeleted: profDel.deletedCount,
      sessionsDeleted: sessDel.deletedCount,
      orphansRemaining: orphanCount,
      orphansUntouched: orphanCount === 9,
    });

    testReport.test7_cleanupVerification = orphanCount === 9;
  }

  console.log("\n======================================================");
  console.log("Profile View Live E2E Test Suite Results:");
  console.log(JSON.stringify(testReport, null, 2));
  console.log("======================================================");

  const allPassed = Object.values(testReport).every(Boolean);
  if (!allPassed) {
    process.exit(1);
  }
}

runProfileViewTests().catch((err) => {
  console.error("Test Suite Unhandled Exception:", err);
  process.exit(1);
});
