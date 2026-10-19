import { connectDB } from "./audit_helper.mjs";
import fs from "fs";

async function main() {
  const db = await connectDB();
  const envContent = fs.readFileSync("backend/.env", "utf8");
  const match = envContent.match(/MONGODB_URI=(.+)/);
  const rawUri = match ? match[1].trim() : "";
  const maskedUri = rawUri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");

  console.log("Database Name:", db.databaseName);
  console.log("Database URI Host:", maskedUri);

  const newestUsers = await db.collection("users")
    .find({ role: { $in: ["organization", "recruiter"] } })
    .sort({ createdAt: -1 })
    .limit(3)
    .toArray();

  console.log("\nNewest Org Users (up to 3):");
  for (const u of newestUsers) {
    console.log({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      isPaid: u.isPaid,
      isEmailVerified: u.isEmailVerified,
      createdAt: u.createdAt,
    });

    const orgDoc = await db.collection("organizations").findOne({ userId: u._id });
    console.log("Associated Organization Doc:", orgDoc ? {
      _id: orgDoc._id,
      userId: orgDoc.userId,
      organizationName: orgDoc.organizationName,
      status: orgDoc.status,
      verificationState: orgDoc.verificationState,
      contactNumber: orgDoc.contactNumber,
      createdAt: orgDoc.createdAt,
      registeredAt: orgDoc.registeredAt,
    } : "NONE FOUND");
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
