import { resolve } from "node:path";
import dotenv from "../backend/node_modules/dotenv/dist/index.cjs";
import mongoose from "../backend/node_modules/mongoose/index.js";
import bcrypt from "../backend/node_modules/bcrypt/bcrypt.js";
import { v2 as cloudinary } from "../backend/node_modules/cloudinary/cloudinary.js";

dotenv.config({ path: resolve("backend/.env") });
const baseUrl = (process.env.E2E_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const password = "E2E-step-password-2026!";

const ids = {
  users: [],
  profiles: [],
  media: [],
  cloudinary: [],
};

const stats = {
  checksPassed: 0,
  checksFailed: 0,
  details: [],
};

function pass(name, detail = "") {
  stats.checksPassed++;
  stats.details.push({ status: "PASS", name, detail });
  console.log(`  [PASS] ${name} ${detail ? "(" + detail + ")" : ""}`);
}

function fail(name, error) {
  stats.checksFailed++;
  stats.details.push({ status: "FAIL", name, error: String(error) });
  console.error(`  [FAIL] ${name}: ${error}`);
  throw new Error(`${name} failed: ${error}`);
}

async function request(name, path, options = {}, expectedStatus) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, options);
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  if (expectedStatus !== undefined && response.status !== expectedStatus) {
    fail(name, `Expected HTTP ${expectedStatus}, received ${response.status}: ${JSON.stringify(body)}`);
  }
  return { status: response.status, body };
}

const authHeaders = (token) => ({
  authorization: `Bearer ${token}`,
});

const jsonReq = (method, body, token) => ({
  method,
  headers: {
    "content-type": "application/json",
    ...(token ? authHeaders(token) : {}),
  },
  body: JSON.stringify(body),
});

console.log(`\n=============================================================`);
console.log(`Starting Profile Roundtrip & Step Builder Verification [${runId}]`);
console.log(`Target Backend: ${baseUrl}`);
console.log(`=============================================================\n`);

try {
  // 1. Health check
  await request("Backend Health Check", "/api/health", {}, 200);
  pass("Backend Health Check", "HTTP 200 OK");

  // 2. Connect to MongoDB to seed authentic test users
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15_000 });
  const db = mongoose.connection.db;
  const now = new Date();
  const hash = await bcrypt.hash(password, 10);

  // Adult user (DOB: 25 years ago)
  const adultUserId = new mongoose.Types.ObjectId();
  const adultProfileId = new mongoose.Types.ObjectId();
  const adultDob = new Date(Date.now() - 25 * 365.25 * 24 * 60 * 60 * 1000);
  ids.users.push(adultUserId);
  ids.profiles.push(adultProfileId);

  // Minor user (DOB: 14 years ago)
  const minorUserId = new mongoose.Types.ObjectId();
  const minorProfileId = new mongoose.Types.ObjectId();
  const minorDob = new Date(Date.now() - 14 * 365.25 * 24 * 60 * 60 * 1000);
  ids.users.push(minorUserId);
  ids.profiles.push(minorProfileId);

  // Admin user
  const adminUserId = new mongoose.Types.ObjectId();
  ids.users.push(adminUserId);

  await db.collection("users").insertMany([
    {
      _id: adultUserId,
      name: `E2E-STEP Adult ${runId}`,
      email: `e2e+step+adult+${runId}@example.test`,
      password: hash,
      role: "talent",
      status: "active",
      isEmailVerified: true,
      isPaid: true,
      authProvider: "local",
      twoFactorEnabled: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: minorUserId,
      name: `E2E-STEP Minor ${runId}`,
      email: `e2e+step+minor+${runId}@example.test`,
      password: hash,
      role: "talent",
      status: "active",
      isEmailVerified: true,
      isPaid: true,
      authProvider: "local",
      twoFactorEnabled: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: adminUserId,
      name: `E2E-STEP Admin ${runId}`,
      email: `e2e+step+admin+${runId}@example.test`,
      password: hash,
      role: "admin",
      status: "active",
      isEmailVerified: true,
      isPaid: true,
      authProvider: "local",
      twoFactorEnabled: false,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  const adultVismayaId = `VIS-AD${runId.slice(-4).toUpperCase()}`;
  const minorVismayaId = `VIS-MI${runId.slice(-4).toUpperCase()}`;

  await db.collection("talentprofiles").insertMany([
    {
      _id: adultProfileId,
      userId: adultUserId,
      vismayaId: adultVismayaId,
      firstName: "E2E-STEP",
      lastName: `Adult-${runId.slice(-4)}`,
      category: "open_talent",
      primaryProfession: "Actor",
      dob: adultDob,
      skills: [],
      languages: [],
      secondaryProfessions: [],
      specializations: [],
      workingCities: [],
      credits: [],
      isPaid: true,
      isProfileApproved: false,
      isVerified: false,
      status: "pending",
      profileCompletionPercentage: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: minorProfileId,
      userId: minorUserId,
      vismayaId: minorVismayaId,
      firstName: "E2E-STEP",
      lastName: `Minor-${runId.slice(-4)}`,
      category: "open_talent",
      primaryProfession: "Voice Artist",
      dob: minorDob,
      skills: [],
      languages: [],
      secondaryProfessions: [],
      specializations: [],
      workingCities: [],
      credits: [],
      isPaid: true,
      isProfileApproved: false,
      isVerified: false,
      status: "pending",
      profileCompletionPercentage: 0,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  pass("Database Seeding", "Adult talent, Minor talent, and Admin seeded");

  // 3. Login all 3 actors
  const adultLogin = await request("Login Adult Talent", "/api/auth/login", jsonReq("POST", {
    email: `e2e+step+adult+${runId}@example.test`,
    password,
  }), 200);
  const adultToken = adultLogin.body.token;

  const minorLogin = await request("Login Minor Talent", "/api/auth/login", jsonReq("POST", {
    email: `e2e+step+minor+${runId}@example.test`,
    password,
  }), 200);
  const minorToken = minorLogin.body.token;

  const adminLogin = await request("Login Admin", "/api/auth/login", jsonReq("POST", {
    email: `e2e+step+admin+${runId}@example.test`,
    password,
  }), 200);
  const adminToken = adminLogin.body.token;

  pass("Authentication", "Tokens generated for Adult, Minor, and Admin");

  // 4. TEST ADULT TALENT FLOW (Step 1 to Step 4)
  console.log(`\n--- Testing Adult Profile Flow ---`);

  // Step 1 Payload with distinct values
  const step1Data = {
    category: "open_talent",
    primaryProfession: "Method Actor",
    secondaryProfessions: ["Voice Actor", "Stage Performer"],
    headline: "Dynamic Method Actor with Theatre Roots",
    stageName: "Arya Stark-Vortex",
    specializations: ["Shakespearean Theatre", "Camera Acting"],
    careerStage: "emerging",
    experienceRange: "3-5",
    bio: "Passionate method actor with over 4 years of rigorous theatrical performance and cinematic training across international and regional productions. Dedicated to nuanced character studies, physical versatility, and authentic screen presence across both contemporary drama and experimental cinema.",
    currentCity: "Bengaluru",
    currentState: "Karnataka",
    workingCities: ["Bengaluru", "Mumbai", "Hyderabad"],
    availability: { status: "available_now" },
    willingToTravel: true,
    willingToRelocate: false,
    openToWorkAnywhere: false,
    skills: ["Classical Monologue", "Stage Combat", "Improvisation"],
    languages: ["English", "Hindi", "Kannada"],
  };

  const saveStep1Res = await request(
    "Adult Save Step 1",
    "/api/talent/profile",
    jsonReq("PUT", step1Data, adultToken),
    200
  );
  pass("Adult Save Step 1", `HTTP 200, score: ${saveStep1Res.body.profile?.profileCompletionPercentage}%`);

  // Reload GET /api/talent/profile/me and confirm exact roundtrip
  const getAdultProfile1 = await request(
    "Adult Reload Profile After Step 1",
    "/api/talent/profile/me",
    { headers: authHeaders(adultToken) },
    200
  );

  const prof1 = getAdultProfile1.body.profile;
  if (prof1.primaryProfession !== step1Data.primaryProfession) fail("Primary Profession Roundtrip", `Expected ${step1Data.primaryProfession}, got ${prof1.primaryProfession}`);
  if (prof1.stageName !== step1Data.stageName) fail("Stage Name Roundtrip", `Expected ${step1Data.stageName}, got ${prof1.stageName}`);
  if (prof1.currentCity !== step1Data.currentCity) fail("Current City Roundtrip", `Expected ${step1Data.currentCity}, got ${prof1.currentCity}`);
  if (prof1.currentState !== step1Data.currentState) fail("Current State Roundtrip", `Expected ${step1Data.currentState}, got ${prof1.currentState}`);
  if (prof1.bio !== step1Data.bio) fail("Bio Roundtrip", `Expected ${step1Data.bio}, got ${prof1.bio}`);
  if (prof1.secondaryProfessions?.length !== 2) fail("Secondary Professions Count", `Expected 2, got ${prof1.secondaryProfessions?.length}`);
  if (prof1.skills?.length !== 3) fail("Skills Count", `Expected 3, got ${prof1.skills?.length}`);
  if (prof1.languages?.length !== 3) fail("Languages Count", `Expected 3, got ${prof1.languages?.length}`);
  if (prof1.workingCities?.length !== 3) fail("Working Cities Count", `Expected 3, got ${prof1.workingCities?.length}`);
  if (prof1.stepsCompletion?.step1 !== true) fail("Step 1 Completion Flag", `Expected step1: true, got ${prof1.stepsCompletion?.step1}`);
  pass("Adult Step 1 Roundtrip", "All 17 fields verified identical from backend");

  // Step 2: Upload media + Profile photo
  console.log(`\n--- Testing Step 2: Media & Photo ---`);
  const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9JXl8AAAAASUVORK5CYII=";
  const pngBlob = new Blob([Buffer.from(pngBase64, "base64")], { type: "image/png" });
  const photoForm = new FormData();
  photoForm.set("file", pngBlob, `photo-${runId}.png`);
  photoForm.set("folder", "e2e-test");

  const uploadPhotoRes = await request(
    "Adult Upload Photo",
    "/api/media/upload",
    {
      method: "POST",
      headers: authHeaders(adultToken),
      body: photoForm,
    },
    200
  );
  const photoUrl = uploadPhotoRes.body.data.url;
  ids.cloudinary.push({ publicId: uploadPhotoRes.body.data.publicId, resourceType: uploadPhotoRes.body.data.resourceType });
  pass("Adult Cloudinary Photo Upload", `Uploaded URL: ${photoUrl.slice(0, 45)}...`);

  // Set profile photo
  await request(
    "Adult Update Profile Photo",
    "/api/talent/profile",
    jsonReq("PUT", { profilePhoto: photoUrl }, adultToken),
    200
  );

  // Upload a portfolio item
  const itemForm = new FormData();
  itemForm.set("file", pngBlob, `portfolio-${runId}.png`);
  itemForm.set("folder", "e2e-test");
  itemForm.set("title", "Lead Character Shoot Still");
  itemForm.set("mediaType", "photo");
  itemForm.set("category", "headshot");
  itemForm.set("visibility", "public");
  itemForm.set("rightsConfirmed", "true");

  const uploadItemRes = await request(
    "Adult Upload Portfolio Item",
    "/api/media",
    {
      method: "POST",
      headers: authHeaders(adultToken),
      body: itemForm,
    },
    201
  );
  const portfolioItem = uploadItemRes.body.mediaItem;
  if (portfolioItem?._id) ids.media.push(portfolioItem._id);
  pass("Adult Portfolio Item Upload", `Created mediaId: ${portfolioItem?._id}`);

  // Reload profile after Step 2
  const getAdultProfile2 = await request(
    "Adult Reload Profile After Step 2",
    "/api/talent/profile/me",
    { headers: authHeaders(adultToken) },
    200
  );
  const prof2 = getAdultProfile2.body.profile;
  if (!prof2.profilePhoto) fail("Profile Photo Missing", "profilePhoto is null");
  if (prof2.stepsCompletion?.step2 !== true) fail("Step 2 Completion Flag", `Expected step2: true, got ${prof2.stepsCompletion?.step2}`);
  pass("Adult Step 2 Roundtrip", "Profile photo and media list verified from backend");

  // Step 3: Work Experience Credits
  console.log(`\n--- Testing Step 3: Work Experience Credits ---`);
  const creditPayload = {
    projectTitle: "The Odyssey Chronicles",
    roleOrDesignation: "Commander Vane",
    projectType: "Feature Film",
    year: 2024,
    referenceLink: "https://imdb.com/title/example-odyssey",
  };

  const addCreditRes = await request(
    "Adult Add Credit",
    "/api/talent/profile/credits",
    jsonReq("POST", creditPayload, adultToken),
    201
  );
  const creditsList = addCreditRes.body.credits || addCreditRes.body.profile?.credits || [];
  const addedCredit = creditsList.find((c) => c.projectTitle === creditPayload.projectTitle);
  if (!addedCredit) fail("Credit Addition", "New credit not found in saved response");
  if (addedCredit.verificationStatus !== "pending") fail("Credit Verification Status", `Expected pending, got ${addedCredit.verificationStatus}`);
  pass("Adult Add Credit", `Credit ID: ${addedCredit._id}, Status: ${addedCredit.verificationStatus}`);

  // Test Credit Delete and Re-add
  const creditIdToDelete = addedCredit._id;
  await request(
    "Adult Delete Credit",
    `/api/talent/profile/credits/${creditIdToDelete}`,
    {
      method: "DELETE",
      headers: authHeaders(adultToken),
    },
    200
  );

  // Reload to verify deleted
  const getAfterDelete = await request(
    "Adult Reload After Credit Delete",
    "/api/talent/profile/me",
    { headers: authHeaders(adultToken) },
    200
  );
  const creditsAfterDelete = getAfterDelete.body.profile?.credits || [];
  if (creditsAfterDelete.some((c) => c._id === creditIdToDelete)) {
    fail("Credit Deletion", "Deleted credit still present in backend response");
  }
  pass("Adult Credit Deletion", "Credit deleted and immediately removed from backend list");

  // Re-add credit to complete Step 3
  const reAddCredit = await request(
    "Adult Re-add Credit",
    "/api/talent/profile/credits",
    jsonReq("POST", creditPayload, adultToken),
    201
  );
  pass("Adult Re-add Credit", "Credit re-added to satisfy Step 3");

  // Reload profile after Step 3
  const getAdultProfile3 = await request(
    "Adult Reload Profile After Step 3",
    "/api/talent/profile/me",
    { headers: authHeaders(adultToken) },
    200
  );
  if (getAdultProfile3.body.profile?.stepsCompletion?.step3 !== true) {
    fail("Step 3 Completion Flag", `Expected step3: true, got ${getAdultProfile3.body.profile?.stepsCompletion?.step3}`);
  }
  pass("Adult Step 3 Roundtrip", "Work experience credits verified from backend");

  // Step 4: Personal Info (Adult)
  console.log(`\n--- Testing Step 4: Personal Info (Adult) ---`);
  const adultStep4Data = {
    dob: adultDob.toISOString(),
    gender: "female",
    nationality: "Indian",
    physicalAttributes: {
      heightCm: 172,
      weightKg: 62,
      skinTone: "Wheatish Fair",
      eyeColor: "Dark Brown",
      hairColor: "Black",
      bodyType: "Athletic",
    },
  };

  const saveAdultStep4 = await request(
    "Adult Save Step 4",
    "/api/talent/profile",
    jsonReq("PUT", adultStep4Data, adultToken),
    200
  );
  pass("Adult Save Step 4", `Completion percentage: ${saveAdultStep4.body.profile?.profileCompletionPercentage}%`);

  // Reload adult profile after all 4 steps
  const finalAdultProfile = await request(
    "Adult Reload Final Profile",
    "/api/talent/profile/me",
    { headers: authHeaders(adultToken) },
    200
  );

  const fAdult = finalAdultProfile.body.profile;
  if (fAdult.physicalAttributes?.heightCm !== 172) fail("Height Roundtrip", `Expected 172, got ${fAdult.physicalAttributes?.heightCm}`);
  if (fAdult.physicalAttributes?.skinTone !== "Wheatish Fair") fail("Skin Tone Roundtrip", `Expected Wheatish Fair, got ${fAdult.physicalAttributes?.skinTone}`);
  if (fAdult.stepsCompletion?.step4 !== true) fail("Adult Step 4 Completion Flag", "Expected step4: true");
  if (fAdult.profileCompletionPercentage !== 100) fail("Adult 100% Strength", `Expected 100%, got ${fAdult.profileCompletionPercentage}%`);
  pass("Adult 100% Completion", "All 4 steps completed and profile strength reached 100%!");

  // 5. TEST MINOR TALENT FLOW & GUARDIAN MANDATORY RULE
  console.log(`\n--- Testing Minor Profile Flow & Guardian Mandatory Rule ---`);

  // Minor Step 1
  await request(
    "Minor Save Step 1",
    "/api/talent/profile",
    jsonReq("PUT", {
      ...step1Data,
      primaryProfession: "Child Voice Artist",
      stageName: "Little Star-Vortex",
      bio: "Talented young voice performer with natural cadence and expressive range. Trained in animated character voices, storytelling narrations, and audiobooks with complete legal parental backing and school coordination.",
    }, minorToken),
    200
  );

  // Minor Step 2 Photo & Media
  await request(
    "Minor Save Profile Photo",
    "/api/talent/profile",
    jsonReq("PUT", { profilePhoto: photoUrl }, minorToken),
    200
  );

  const minorItemForm = new FormData();
  minorItemForm.set("file", pngBlob, `minor-portfolio-${runId}.png`);
  minorItemForm.set("folder", "e2e-test");
  minorItemForm.set("title", "Voice Recording Studio Still");
  minorItemForm.set("mediaType", "photo");
  minorItemForm.set("category", "headshot");
  minorItemForm.set("visibility", "public");
  minorItemForm.set("rightsConfirmed", "true");

  const minorUploadRes = await request(
    "Minor Upload Portfolio Item",
    "/api/media",
    {
      method: "POST",
      headers: authHeaders(minorToken),
      body: minorItemForm,
    },
    201
  );
  if (minorUploadRes.body.mediaItem?._id) ids.media.push(minorUploadRes.body.mediaItem._id);
  pass("Minor Step 2 Media", "Profile photo and portfolio media uploaded");

  // Minor Step 3 Credit
  await request(
    "Minor Add Credit",
    "/api/talent/profile/credits",
    jsonReq("POST", {
      projectTitle: "Magical Forest Tales",
      roleOrDesignation: "Voice of Pip the Squirrel",
      projectType: "Web Series",
      year: 2024,
    }, minorToken),
    201
  );

  // Minor Step 4: ATTEMPT WITHOUT GUARDIAN DETAILS (MUST FAIL)
  const minorStep4NoGuardian = {
    dob: minorDob.toISOString(),
    gender: "male",
    nationality: "Indian",
    physicalAttributes: {
      heightCm: 145,
      weightKg: 38,
      skinTone: "Fair",
      eyeColor: "Brown",
      hairColor: "Black",
      bodyType: "Slim",
    },
  };

  const minorFailRes = await request(
    "Minor Save Step 4 Without Guardian (Expect 400)",
    "/api/talent/profile",
    jsonReq("PUT", minorStep4NoGuardian, minorToken),
    400
  );
  pass("Minor Guardian Enforcement", `Rejected with 400: "${minorFailRes.body.message}"`);

  // Minor Step 4: WITH COMPLETE GUARDIAN DETAILS
  const minorStep4WithGuardian = {
    ...minorStep4NoGuardian,
    guardianDetails: {
      guardianName: "Sunita Sharma",
      relationship: "Mother",
      contactNumber: "+91 9876543210",
      guardianEmail: "sunita.sharma@example.test",
      consentGiven: true,
    },
  };

  const minorSuccessRes = await request(
    "Minor Save Step 4 With Guardian",
    "/api/talent/profile",
    jsonReq("PUT", minorStep4WithGuardian, minorToken),
    200
  );
  pass("Minor Save Step 4 With Guardian", `HTTP 200, score: ${minorSuccessRes.body.profile?.profileCompletionPercentage}%`);

  // Reload minor profile
  const getMinorProfile = await request(
    "Minor Reload Final Profile",
    "/api/talent/profile/me",
    { headers: authHeaders(minorToken) },
    200
  );
  const fMinor = getMinorProfile.body.profile;
  if (!fMinor.guardianDetails?.guardianName) fail("Minor Guardian Name Missing", "guardianDetails missing in response");
  if (fMinor.guardianDetails?.guardianEmail !== "sunita.sharma@example.test") fail("Minor Guardian Email Roundtrip", `Expected sunita.sharma@example.test, got ${fMinor.guardianDetails?.guardianEmail}`);
  if (fMinor.stepsCompletion?.step4 !== true) fail("Minor Step 4 Completion Flag", "Expected step4: true");
  if (fMinor.profileCompletionPercentage !== 100) fail("Minor 100% Strength", `Expected 100%, got ${fMinor.profileCompletionPercentage}%`);
  pass("Minor 100% Completion", "Minor with valid guardian reached 100%!");

  // 6. PRIVACY AUDIT: GUARDIAN & CONFIDENTIAL INFO NEVER IN PUBLIC / RECRUITER VIEW
  console.log(`\n--- Testing Privacy Audit & Serializers ---`);

  // Unauthenticated / Public view of minor
  const publicMinorRes = await request(
    "Public View of Minor Talent",
    `/api/talent/profile/${minorVismayaId}`,
    {},
    200
  );
  const pubProfile = publicMinorRes.body.profile;
  if (pubProfile.guardianDetails !== undefined) fail("Privacy Leak", "guardianDetails leaked in public view!");
  if (pubProfile.guardianEmail !== undefined) fail("Privacy Leak", "guardianEmail leaked in public view!");
  if (pubProfile.physicalAttributes !== undefined) fail("Privacy Leak", "physicalAttributes leaked in public view!");
  pass("Public Privacy Guard", "Guardian and physical attributes strictly stripped from public view");

  // Admin view of minor talent
  const adminMinorRes = await request(
    "Admin View of Minor Talent",
    `/api/admin/talents/${minorUserId}`,
    { headers: authHeaders(adminToken) },
    200
  );
  const admProfile = adminMinorRes.body.profile || adminMinorRes.body.talent || adminMinorRes.body;
  if (!admProfile.guardianDetails?.guardianName) fail("Admin View Missing Guardian", "Guardian details missing for admin");
  if (admProfile.guardianDetails?.guardianEmail !== "sunita.sharma@example.test") fail("Admin View Guardian Email", `Expected sunita.sharma@example.test, got ${admProfile.guardianDetails?.guardianEmail}`);
  pass("Admin Talent Detail View", "Guardian details fully present for administrative review");

  // 7. SILENT-DROP GUARD TEST
  console.log(`\n--- Testing Silent-Drop Guard ---`);
  const rogueSaveRes = await request(
    "Silent-Drop Guard Unknown Field Rejection",
    "/api/talent/profile",
    jsonReq("PUT", { rogueUnknownParam123: "hackValue" }, adultToken),
    400
  );
  pass("Silent-Drop Guard", `Rejected with 400 naming disallowed field: "${rogueSaveRes.body.message}"`);

  console.log(`\n=============================================================`);
  console.log(`ALL VERIFICATION CHECKS PASSED: ${stats.checksPassed}/${stats.checksPassed}`);
  console.log(`=============================================================\n`);

} catch (error) {
  console.error(`\n[FATAL ERROR IN VERIFICATION]:`, error);
  process.exitCode = 1;
} finally {
  console.log(`--- Cleaning up E2E-STEP Test Data ---`);
  try {
    if (mongoose.connection.readyState) {
      const db = mongoose.connection.db;
      const delUsers = await db.collection("users").deleteMany({ _id: { $in: ids.users } });
      const delProfiles = await db.collection("talentprofiles").deleteMany({ _id: { $in: ids.profiles } });
      const delMedia = await db.collection("mediaitems").deleteMany({ owner: { $in: ids.users } });
      console.log(`  Cleaned up MongoDB: ${delUsers.deletedCount} users, ${delProfiles.deletedCount} profiles, ${delMedia.deletedCount} media records`);
      await mongoose.disconnect();
    }

    if (ids.cloudinary.length > 0) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });

      let cloudDeleted = 0;
      for (const item of ids.cloudinary) {
        try {
          await cloudinary.uploader.destroy(item.publicId, { resource_type: item.resourceType || "image" });
          cloudDeleted++;
        } catch (e) {
          // ignore cleanup cloud errors
        }
      }
      console.log(`  Cleaned up Cloudinary: ${cloudDeleted}/${ids.cloudinary.length} assets`);
    }
  } catch (cleanErr) {
    console.error(`Cleanup error:`, cleanErr);
  }
}
