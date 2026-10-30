import { NextResponse } from "next/server";

// In-memory OTP storage for registration session verification
const OTP_STORE = global.__REG_OTP_STORE__ || new Map();
global.__REG_OTP_STORE__ = OTP_STORE;

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, message: "Valid email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    // Generate secure 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    OTP_STORE.set(normalizedEmail, {
      code: otpCode,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
    });

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.error("[send-registration-otp] Missing BREVO_API_KEY in environment variables");
      return NextResponse.json({ success: false, message: "Email service not configured" }, { status: 500 });
    }
    const senderEmail = process.env.EMAIL_FROM || "vortexcubesdevelopment@gmail.com";
    const senderName = process.env.EMAIL_FROM_NAME || "Vismaya Studios";

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [{ email: normalizedEmail }],
        subject: "Your Vismaya Account Verification Code",
        textContent: `Hello,\n\nYour 6-digit verification code is: ${otpCode}\n\nThis code will expire in 10 minutes.\n\nBest regards,\nVismaya Security Team`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; background-color: #FAFAF7; border: 1px solid #E4E1D9; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #8A6B2E; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">Vismaya Studios</h2>
              <p style="color: #777970; font-size: 13px; margin-top: 4px;">Account Verification</p>
            </div>
            <div style="background-color: #FFFFFF; border: 1px solid #E8E5DD; border-radius: 6px; padding: 24px; text-align: center;">
              <p style="color: #292C29; font-size: 14px; margin-top: 0; margin-bottom: 16px;">
                Enter the following 6-digit verification code to confirm your email and complete your registration:
              </p>
              <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #1A1A1A; padding: 14px 20px; background-color: #F8F5EE; border-radius: 6px; display: inline-block; margin-bottom: 16px;">
                ${otpCode}
              </div>
              <p style="color: #8A8170; font-size: 12px; margin: 0;">
                This code is valid for <strong>10 minutes</strong>. If you did not request this code, please disregard this email.
              </p>
            </div>
            <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #9A9488;">
              &copy; Vismaya Creative Studios. All rights reserved.
            </div>
          </div>
        `,
      }),
    });

    if (res.ok) {
      return NextResponse.json({ success: true, message: "Verification code sent to your email" });
    } else {
      const errText = await res.text();
      console.error("[send-registration-otp] Brevo error:", errText);
      return NextResponse.json({ success: false, message: "Failed to dispatch email via Brevo" }, { status: 500 });
    }
  } catch (error) {
    console.error("[send-registration-otp] Server error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
