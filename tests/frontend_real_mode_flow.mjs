/**
 * Real-Mode Frontend Service Flow Verification
 * Simulates the end-to-end user actions through frontend service layer with NEXT_PUBLIC_USE_MOCK=false
 */

process.env.NEXT_PUBLIC_USE_MOCK = "false";
process.env.NEXT_PUBLIC_API_MODULES = "all";
process.env.NEXT_PUBLIC_API_URL = "http://localhost:5000";


import { apiClient } from "../lib/api/client.js";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, "../../vismaya-backend (3)/vismaya-backend");
const backendRequire = createRequire(path.join(backendDir, "package.json"));

const mongoose = backendRequire("mongoose");
const bcrypt = backendRequire("bcrypt");
const dotenv = backendRequire("dotenv");
dotenv.config({ path: path.resolve(backendDir, ".env") });

import {
  authService,
  talentService,
  recruiterService,
  adminService,
  publicService,
  notificationService,
  mediaService,
} from "../lib/api/services/index.js";
async function runFrontendRealFlow() {
  console.log("===============================================================================");
  console.log("  FRONTEND REAL-MODE END-TO-END FLOW (NEXT_PUBLIC_USE_MOCK=false)");
  console.log("  Target: http://localhost:5000");
  console.log("===============================================================================\n");

  const timestamp = Date.now();
  const talentEmail = `frontend_talent_${timestamp}@vismayatest.com`;
  const orgEmail = `frontend_org_${timestamp}@vismayatest.com`;
  const adminEmail = `admin@vismaya.com`;
  const password = "Password123!@";

  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vismaya";
  await mongoose.connect(mongoUri);
  const User = mongoose.connection.collection("users");
  const CreditLedger = mongoose.connection.collection("creditledgers");

  // Upsert active admin user
  const hashedAdminPw = await bcrypt.hash(password, 10);
  await User.updateOne(
    { email: adminEmail },
    {
      $set: {
        name: "Admin User",
        email: adminEmail,
        password: hashedAdminPw,
        role: "admin",
        status: "active",
        isPaid: true,
        isEmailVerified: true,
      },
    },
    { upsert: true }
  );

  const results = [];


  // Step 1: Register Talent & Org
  const regTal = await authService.register({
    name: "Frontend Talent",
    email: talentEmail,
    password,
    role: "talent",
    mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
  });
  results.push({ step: "1a. Talent Register", pass: regTal.success, res: regTal });

  const regOrg = await authService.register({
    name: "Frontend Org Admin",
    email: orgEmail,
    password,
    role: "organization",
    mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
  });
  results.push({ step: "1b. Org Register", pass: regOrg.success, res: regOrg });

  console.log("Register talent result:", regTal);
  console.log("Register org result:", regOrg);

  // Set OTP for talent & org to "123456" in DB
  const Otps = mongoose.connection.collection("otps");
  const knownOtpHash = await bcrypt.hash("123456", 10);
  await Otps.updateMany(
    { email: { $in: [talentEmail, orgEmail] }, purpose: "registration" },
    { $set: { otpHash: knownOtpHash } }
  );

  const vTal = await authService.verifyRegistration({ email: talentEmail, otp: "123456" });
  results.push({ step: "1c. Talent Verify OTP", pass: vTal.success, res: vTal });

  const vOrg = await authService.verifyRegistration({ email: orgEmail, otp: "123456" });
  results.push({ step: "1d. Org Verify OTP", pass: vOrg.success, res: vOrg });

  // Ensure isPaid: true for test execution
  await User.updateMany(
    { email: { $in: [talentEmail, orgEmail] } },
    { $set: { isPaid: true, status: "active" } }
  );

  // Step 2: Login as Talent

  const loginTal = await authService.login({ email: talentEmail, password });
  results.push({ step: "2a. Talent Login", pass: loginTal.success && !!loginTal.token, res: loginTal });
  const talentToken = loginTal.token;

  // Step 3: Save Talent Profile
  apiClient.setToken(talentToken);
  const saveProf = await talentService.saveProfile({
    personalDetails: {
      stageName: `Frontend Actor ${timestamp}`,
      firstName: "Frontend",
      lastName: "Actor",
      headline: "Professional Method & Screen Actor",
      bio: "Dedicated classical and contemporary actor with ten years experience across stage and commercial feature film productions. Specializing in high-intensity method roles, complex character depth, emotional versatility, action stunts, and screen presence in Mumbai.",
      currentCity: "Mumbai",
      currentState: "Maharashtra",
      country: "India",
      gender: "male",
      dob: "1995-03-20",
      profilePhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
      category: "open_talent",
      primaryProfession: "Actor",
      secondaryProfessions: ["Voice Artist"],
      workingCities: ["Mumbai", "Delhi", "Hyderabad"],
    },
    physicalDetails: {
      heightCm: 180,
      weightKg: 75,
      skinTone: "Fair",
      eyeColor: "Brown",
      hairColor: "Black",
      bodyType: "Athletic",
    },
    skills: [
      { name: "Stage Combat", proficiency: "advanced" },
      { name: "Method Acting", proficiency: "expert" },
      { name: "Voice Modulation", proficiency: "intermediate" },
    ],
    languages: [
      { language: "Hindi", proficiency: "native" },
      { language: "English", proficiency: "fluent" },
    ],
    credits: [
      { projectTitle: "Shadows of Truth", role: "Inspector Dev", year: 2024 },
      { projectTitle: "The Last Station", role: "Lead Rebel", year: 2025 },
    ],
    socialLinks: {
      instagram: "https://instagram.com/frontend_actor",
    },
  });



  results.push({ step: "3a. Save Talent Profile", pass: saveProf.success, res: saveProf });

  const getMyProf = await talentService.getMyProfile();
  results.push({ step: "3b. Get My Talent Profile", pass: getMyProf.success && !!getMyProf.data, res: getMyProf });
  const talentProfileId = getMyProf.data?.id;

  // Step 4: Login as Organization
  const loginOrg = await authService.login({ email: orgEmail, password });
  results.push({ step: "4a. Org Login", pass: loginOrg.success && !!loginOrg.token, res: loginOrg });
  const orgToken = loginOrg.token;
  apiClient.setToken(orgToken);

  // Save Org Profile
  const saveOrg = await recruiterService.saveOrganizationProfile({
    organizationName: `Vortex Creative Studio ${timestamp}`,
    organizationType: "Production House",
    description: "Leading film production studio creating cinematic feature films.",
    website: "https://vortexstudio.example.com",
    city: "Mumbai",
    state: "Maharashtra",
  });
  results.push({ step: "4b. Save Org Profile", pass: saveOrg.success, res: saveOrg });

  // Create Project
  const createProj = await recruiterService.createProject({
    projectName: `Chronicles of Mumbai ${timestamp}`,
    projectType: "Feature Film",
    description: "Spy action thriller feature film.",
  });
  results.push({ step: "4c. Create Project", pass: createProj.success && !!createProj.data?.id, res: createProj });
  const projectId = createProj.data?.id;

  // Create Opportunity
  const createOpp = await recruiterService.createOpportunity({
    projectId,
    title: `Lead Shadow Operative ${timestamp}`,
    role: "Shadow Operative",
    remuneration: "₹1,50,000",
    positionsCount: 1,
    location: "Mumbai",
    description: "Intense character demanding high martial arts and acting prowess.",
    deadline: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
  });
  results.push({ step: "4d. Create Opportunity", pass: createOpp.success && !!createOpp.data?.id, res: createOpp });
  const opportunityId = createOpp.data?.id;

  // Step 5: Admin Login & Opportunity Approval
  const loginAdmin = await authService.login({ email: adminEmail, password });
  results.push({ step: "5a. Admin Login", pass: loginAdmin.success && !!loginAdmin.token, res: loginAdmin });
  const adminToken = loginAdmin.token;
  apiClient.setToken(adminToken);

  const approveOpp = await adminService.approveOpportunity(opportunityId);
  results.push({ step: "5b. Admin Approve Opportunity", pass: approveOpp.success, res: approveOpp });

  // Step 6: Public Query & Talent Apply
  const pubOpps = await publicService.getPublishedOpportunities();
  results.push({ step: "6a. Public Query Opportunities", pass: pubOpps.success && Array.isArray(pubOpps.data), res: pubOpps });

  apiClient.setToken(talentToken);
  const applyRes = await talentService.applyToOpportunity(opportunityId, {
    coverNote: "Highly motivated and experienced actor perfectly suited for this shadow operative role.",
    consentGiven: true,
  });
  results.push({ step: "6b. Talent Apply", pass: applyRes.success && !!applyRes.data?.id, res: applyRes });
  const applicationId = applyRes.data?.id;

  // Step 7: Org Review & Shortlist
  apiClient.setToken(orgToken);
  const revApp = await recruiterService.markApplicationUnderReview(applicationId);
  results.push({ step: "7a. Org Review App", pass: revApp.success, res: revApp });

  const shortApp = await recruiterService.shortlistApplication(applicationId);
  results.push({ step: "7b. Org Shortlist App", pass: shortApp.success, res: shortApp });

  // Step 8: Org Audition Request -> Admin Approval -> Talent Self-Tape
  const reqAud = await recruiterService.requestAudition(applicationId, {
    type: "self_tape",
    role: "Shadow Operative",
    sceneBrief: "Deliver scene 4 monologue with suppressed intensity.",
    deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
  });
  results.push({ step: "8a. Org Request Audition", pass: reqAud.success && !!reqAud.data?.id, res: reqAud });
  const auditionId = reqAud.data?.id;

  apiClient.setToken(adminToken);
  const appAud = await adminService.reviewAudition(auditionId, { action: "approve" });
  results.push({ step: "8b. Admin Approve Audition", pass: appAud.success, res: appAud });

  apiClient.setToken(talentToken);
  const subTape = await talentService.submitSelfTape(auditionId, {
    selfTapeUrl: "https://res.cloudinary.com/vismaya/video/upload/selftape_hero.mp4",
    notes: "Monologue recorded in 4K studio lighting with directional boom mic.",
  });
  results.push({ step: "8c. Talent Submit Self-Tape", pass: subTape.success, res: subTape });

  apiClient.setToken(orgToken);
  const revTape = await recruiterService.reviewAudition(auditionId, {
    rating: 5,
    feedback: "Exceptional depth, perfectly suited for the production.",
  });
  results.push({ step: "8d. Org Review Audition", pass: revTape.success, res: revTape });

  const selApp = await recruiterService.selectApplication(applicationId);
  results.push({ step: "8e. Org Select Applicant", pass: selApp.success, res: selApp });

  // Step 9: Notifications Check
  apiClient.setToken(talentToken);
  const notifs = await notificationService.getMyNotifications();
  results.push({ step: "9a. Talent Notifications", pass: notifs.success && notifs.data?.length > 0, res: notifs });

  // Step 10: Credits & Profile Unlock
  const orgUserDoc = await User.findOne({ email: orgEmail });
  await CreditLedger.updateOne(
    { organizationId: orgUserDoc._id },
    { $inc: { balance: 5, totalPurchased: 5 } },
    { upsert: true }
  );

  apiClient.setToken(orgToken);
  const credBal = await recruiterService.getCreditBalance();
  results.push({ step: "10a. Org Credit Balance", pass: credBal.success && credBal.balance >= 5, res: credBal });

  const unlockTal = await recruiterService.unlockTalentProfile(talentProfileId);
  results.push({ step: "10b. Unlock Talent Profile", pass: unlockTal.success, res: unlockTal });

  // Step 11: Media Registration
  apiClient.setToken(talentToken);
  const addMed = await mediaService.addMedia({
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
    type: "photo",
    title: "Cinematic Portfolio Headshot 2026",
    isHeadshot: true,
    rightsConfirmed: true,
  });

  results.push({ step: "11a. Add Media", pass: addMed.success && !!addMed.data?.id, res: addMed });

  const myMed = await mediaService.getMyMedia();
  results.push({ step: "11b. Get My Media", pass: myMed.success && myMed.data?.length > 0, res: myMed });

  await mongoose.disconnect();

  console.log("\n===============================================================================");
  const totalPassed = results.filter((r) => r.pass).length;
  console.log(`  FRONTEND REAL FLOW RESULTS: ${totalPassed}/${results.length} PASSED (${results.length - totalPassed} failed)`);
  console.log("===============================================================================\n");

  results.forEach((r) => {
    console.log(`[${r.pass ? "PASS" : "FAIL"}] ${r.step}`);
  });

  if (totalPassed !== results.length) {
    process.exit(1);
  }
}

runFrontendRealFlow().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
