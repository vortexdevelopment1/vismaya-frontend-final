import { sendEmail } from "../dist/services/email.service.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

async function testEmail() {
  console.log("Testing email sending...");
  console.log("BREVO_API_KEY:", process.env.BREVO_API_KEY ? "Present" : "Missing");
  console.log("SMTP_HOST:", process.env.SMTP_HOST);
  console.log("BREVO_SENDER_EMAIL:", process.env.BREVO_SENDER_EMAIL);

  try {
    const res = await sendEmail({
      to: "vortexcubesdevelopment@gmail.com",
      subject: "Test Contact Inquiry Alert",
      text: "This is a direct test inquiry to verify email delivery.",
      html: "<p>This is a <strong>direct test inquiry</strong> to verify email delivery.</p>"
    });
    console.log("SendEmail Result:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("Test email failed:", err);
  }
}

testEmail();
