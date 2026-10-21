import { resolve } from "node:path";
import dotenv from "../backend/node_modules/dotenv/dist/index.cjs";
import mongoose from "../backend/node_modules/mongoose/index.js";

dotenv.config({ path: resolve("backend/.env") });

async function investigate() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) throw new Error("No DB URI found in backend/.env");

  await mongoose.connect(uri);
  console.log("Connected to DB via backend/.env URI successfully.");

  console.log("\n=== 1. TALENT SEARCH (sambhuu) ===");
  const talentUsers = await mongoose.connection.collection("users").find({
    $or: [
      { name: { $regex: "sambhuu", $options: "i" } },
      { email: { $regex: "sambhuu", $options: "i" } },
      { stageName: { $regex: "sambhuu", $options: "i" } }
    ]
  }).toArray();
  console.log("Talent Users found:", talentUsers.length);
  talentUsers.forEach(u => console.log(JSON.stringify({ _id: u._id, name: u.name, email: u.email, role: u.role, stageName: u.stageName })));

  const talentProfiles = await mongoose.connection.collection("talentprofiles").find({
    $or: [
      { stageName: { $regex: "sambhuu", $options: "i" } },
      { "personalInfo.name": { $regex: "sambhuu", $options: "i" } },
      { "personalInfo.stageName": { $regex: "sambhuu", $options: "i" } },
      { userId: { $in: talentUsers.map(u => u._id) } }
    ]
  }).toArray();
  console.log("Talent Profiles found:", talentProfiles.length);
  talentProfiles.forEach(p => console.log(JSON.stringify({ _id: p._id, userId: p.userId, stageName: p.stageName, name: p.personalInfo?.name })));

  console.log("\n=== 2. ORGANIZATION SEARCH (ultra films) ===");
  const orgUsers = await mongoose.connection.collection("users").find({
    $or: [
      { name: { $regex: "ultra", $options: "i" } },
      { email: { $regex: "ultra", $options: "i" } },
      { companyName: { $regex: "ultra", $options: "i" } }
    ]
  }).toArray();
  console.log("Org Users found:", orgUsers.length);
  orgUsers.forEach(u => console.log(JSON.stringify({ _id: u._id, name: u.name, email: u.email, role: u.role, companyName: u.companyName })));

  const orgProfiles = await mongoose.connection.collection("organizations").find({
    $or: [
      { organizationName: { $regex: "ultra", $options: "i" } },
      { companyName: { $regex: "ultra", $options: "i" } },
      { name: { $regex: "ultra", $options: "i" } },
      { userId: { $in: orgUsers.map(u => u._id) } }
    ]
  }).toArray();
  console.log("Organizations found:", orgProfiles.length);
  orgProfiles.forEach(o => console.log(JSON.stringify({ _id: o._id, userId: o.userId, organizationName: o.organizationName, companyName: o.companyName })));

  console.log("\n=== 3. OPPORTUNITIES SEARCH ===");
  const opps = await mongoose.connection.collection("opportunities").find({
    $or: [
      { title: { $regex: "drashyam", $options: "i" } },
      { title: { $regex: "pyar", $options: "i" } }
    ]
  }).toArray();
  console.log("Opportunities found:", opps.length);
  opps.forEach(o => console.log(JSON.stringify({ _id: o._id, title: o.title, organizationId: o.organizationId, status: o.status, projectId: o.projectId })));

  const talentUserIds = talentUsers.map(u => u._id);
  const talentProfileIds = talentProfiles.map(p => p._id);
  const allTalentIds = [...talentUserIds, ...talentProfileIds];

  console.log("\n=== 4. APPLICATIONS SEARCH FOR TALENT ===");
  const applications = await mongoose.connection.collection("applications").find({
    $or: [
      { talentId: { $in: allTalentIds } },
      { userId: { $in: allTalentIds } },
      { opportunityId: { $in: opps.map(o => o._id) } }
    ]
  }).toArray();
  console.log("Applications count:", applications.length);
  applications.forEach(a => console.log(JSON.stringify(a, null, 2)));

  const appIds = applications.map(a => a._id);

  console.log("\n=== 5. AUDITIONS SEARCH ===");
  const auditions = await mongoose.connection.collection("auditions").find({
    $or: [
      { applicationId: { $in: appIds } },
      { talentId: { $in: allTalentIds } },
      { opportunityId: { $in: opps.map(o => o._id) } }
    ]
  }).toArray();
  console.log("Auditions count:", auditions.length);
  auditions.forEach(a => console.log(JSON.stringify(a, null, 2)));

  console.log("\n=== 6. AGGREGATION TEST FOR APPLICANT STATS ===");
  const oppIdStr = "6ad87eccc5fafb14fdd5dd93";
  const oppIdObj = new mongoose.Types.ObjectId(oppIdStr);

  const aggWithStrings = await mongoose.connection.collection("applications").aggregate([
    { $match: { opportunityId: { $in: [oppIdStr] } } },
    { $group: { _id: { oppId: "$opportunityId", status: "$status" }, count: { $sum: 1 } } }
  ]).toArray();
  console.log("Agg with strings:", JSON.stringify(aggWithStrings));

  const aggWithObjects = await mongoose.connection.collection("applications").aggregate([
    { $match: { opportunityId: { $in: [oppIdObj] } } },
    { $group: { _id: { oppId: "$opportunityId", status: "$status" }, count: { $sum: 1 } } }
  ]).toArray();
  console.log("\n=== 7. TEST APPLICATION.FIND FILTER ===");
  const findWithStr = await mongoose.connection.collection("applications").find({ opportunityId: oppIdStr }).toArray();
  console.log("Raw find with string oppId:", findWithStr.length);

  const findWithObj = await mongoose.connection.collection("applications").find({ opportunityId: oppIdObj }).toArray();
  console.log("Raw find with ObjectId oppId:", findWithObj.length);

  await mongoose.disconnect();
}

investigate().catch(err => {
  console.error("Investigation error:", err);
  process.exit(1);
});
