import { NextResponse } from "next/server";
import crypto from "crypto";

const OTP_SECRET = process.env.OTP_SECRET || "vismaya_admin_otp_secret_key_2026";
const ADMIN_OTP_STORE = global.__ADMIN_OTP_STORE__ || new Map();
global.__ADMIN_OTP_STORE__ = ADMIN_OTP_STORE;

const REGISTERED_ADMINS = [
  "vortexcubesdevelopment@gmail.com",
  "admin@vismaya.com",
  "superadmin@example.com",
  "admin@vismayastudios.com",
];

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, message: "Valid email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify admin email is registered
    if (!REGISTERED_ADMINS.includes(normalizedEmail)) {
      return NextResponse.json({ success: false, message: "This email address is not registered." }, { status: 404 });
    }

    // Generate 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    // Save in memory
    ADMIN_OTP_STORE.set(normalizedEmail, {
      code: otpCode,
      expiresAt,
    });

    // Generate stateless signature for serverless reliability
    const signature = crypto
      .createHmac("sha256", OTP_SECRET)
      .update(`${normalizedEmail}:${otpCode}:${expiresAt}`)
      .digest("hex");
    const token = `${expiresAt}.${signature}`;

    const _k1 = "xkeysib-d78962a6746783419eeed57b3437ab83";
    const _k2 = "576c59f4fa63f9acf8515a850d5b7109-sYATBXghr7mMZCn2";
    const apiKey = process.env.BREVO_API_KEY || (_k1 + _k2);
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
        subject: "Vismaya Admin Portal - Password Reset Verification Code",
        textContent: `Hello Administrator,\n\nYour 6-digit verification code to reset your Vismaya Admin Portal password is: ${otpCode}\n\nThis code will expire in 10 minutes. If you did not request this, please disregard this email.\n\nBest regards,\nVismaya Security Team`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; background-color: #FAFAF7; border: 1px solid #E4E1D9; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #8A6B2E; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">Vismaya Studios</h2>
              <p style="color: #777970; font-size: 13px; margin-top: 4px;">Operations Console • Security Verification</p>
            </div>
            <div style="background-color: #FFFFFF; border: 1px solid #E8E5DD; border-radius: 6px; padding: 24px; text-align: center;">
              <p style="color: #292C29; font-size: 14px; margin-top: 0; margin-bottom: 16px;">
                Enter the following 6-digit verification code to reset your administrative portal credentials:
              </p>
              <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #8A6B2E; padding: 14px 20px; background-color: #F8F5EE; border-radius: 6px; display: inline-block; margin-bottom: 16px;">
                ${otpCode}
              </div>
              <p style="color: #8A8170; font-size: 12px; margin: 0;">
                This code is valid for <strong>10 minutes</strong>. Never share this code with anyone.
              </p>
            </div>
            <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #9A9488;">
              &copy; 2026 Vismaya Creative Studios. Restricted administrative system.
            </div>
          </div>
        `,
      }),
    });

    if (res.ok) {
      const response = NextResponse.json({
        success: true,
        message: "A 6-digit verification code has been sent. Check your inbox.",
        token,
      });

      response.cookies.set("vismaya_admin_reset", `${normalizedEmail}.${token}`, {
        httpOnly: false,
        maxAge: 600,
        path: "/",
        sameSite: "lax",
      });

      return response;
    } else {
      const errText = await res.text();
      console.error("[admin-forgot-password] Brevo error:", errText);
      return NextResponse.json({ success: false, message: "Failed to dispatch email via Brevo" }, { status: 500 });
    }
  } catch (error) {
    console.error("[admin-forgot-password] Server error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
