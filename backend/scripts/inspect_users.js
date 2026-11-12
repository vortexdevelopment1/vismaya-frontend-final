import mongoose from "mongoose";
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const uri = "mongodb+srv://lowanshiarpita_db_user:Arpita12345@cluster0.ipa6ws6.mongodb.net/vismaya";

async function checkInquiries() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;

    const inquiries = await db.collection("contactinquiries").find({}).sort({ createdAt: -1 }).limit(10).toArray();
    console.log(`Found ${inquiries.length} contact inquiry record(s):`);

    for (const inq of inquiries) {
      console.log(JSON.stringify(inq, null, 2));
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

checkInquiries();
