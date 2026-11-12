import mongoose from "mongoose";
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const uri = "mongodb+srv://lowanshiarpita_db_user:Arpita12345@cluster0.ipa6ws6.mongodb.net/vismaya";

async function runCleanup() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const db = mongoose.connection.db;

    // Find all talent users except khanfaizan0003
    const talentToDelete = await db.collection("users").find({
      role: "talent",
      email: { $not: /khanfaizan0003/i }
    }).toArray();

    console.log(`Found ${talentToDelete.length} talent user(s) to delete.`);
    const deleteIds = talentToDelete.map(u => u._id);
    const deleteEmails = talentToDelete.map(u => u.email);

    console.log("Emails to delete:", deleteEmails);

    if (deleteIds.length > 0) {
      // 1. Delete talent profiles
      const profileRes = await db.collection("talentprofiles").deleteMany({
        $or: [
          { userId: { $in: deleteIds } },
          { user: { $in: deleteIds } }
        ]
      });
      console.log(`Deleted ${profileRes.deletedCount} talent profiles.`);

      // 2. Delete verifications
      const verifRes = await db.collection("verifications").deleteMany({
        userId: { $in: deleteIds }
      });
      console.log(`Deleted ${verifRes.deletedCount} verification records.`);

      // 3. Delete user consents
      const consentRes = await db.collection("userconsents").deleteMany({
        userId: { $in: deleteIds }
      });
      console.log(`Deleted ${consentRes.deletedCount} user consent records.`);

      // 4. Delete sessions
      const sessionRes = await db.collection("sessions").deleteMany({
        userId: { $in: deleteIds }
      });
      console.log(`Deleted ${sessionRes.deletedCount} sessions.`);

      // 5. Delete payment transactions for these talent users
      const paymentRes = await db.collection("paymenttransactions").deleteMany({
        $or: [
          { userId: { $in: deleteIds } },
          { email: { $in: deleteEmails } },
          { customerEmail: { $in: deleteEmails } }
        ]
      });
      console.log(`Deleted ${paymentRes.deletedCount} payment transactions.`);

      // 6. Delete applications submitted by these users
      const appRes = await db.collection("applications").deleteMany({
        talentId: { $in: deleteIds }
      });
      console.log(`Deleted ${appRes.deletedCount} applications.`);

      // 7. Delete auditions submitted by these users
      const audRes = await db.collection("auditions").deleteMany({
        talentId: { $in: deleteIds }
      });
      console.log(`Deleted ${audRes.deletedCount} auditions.`);

      // 8. Delete users
      const userRes = await db.collection("users").deleteMany({
        _id: { $in: deleteIds }
      });
      console.log(`Deleted ${userRes.deletedCount} users from users collection.`);
    }

    // Verify remaining users
    const remainingUsers = await db.collection("users").find({}).toArray();
    console.log("\n--- Remaining Users in DB ---");
    for (const u of remainingUsers) {
      console.log(`Role: [${u.role}], Email: [${u.email}], Name: [${u.name}], Status: [${u.status}]`);
    }

  } catch (err) {
    console.error("Cleanup error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

runCleanup();
