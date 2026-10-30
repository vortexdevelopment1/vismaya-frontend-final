import { NextResponse } from "next/server";
import crypto from "crypto";

const OTP_SECRET = process.env.OTP_SECRET || "vismaya_registration_otp_secret_key_2026";
const OTP_STORE = global.__REG_OTP_STORE__ || new Map();
global.__REG_OTP_STORE__ = OTP_STORE;

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, otp, token } = body;
    if (!email || !otp) {
      return NextResponse.json({ success: false, message: "Email and OTP code are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    // 1. Check in-memory store
    const record = OTP_STORE.get(normalizedEmail);
    if (record && Date.now() <= record.expiresAt && record.code === cleanOtp) {
      OTP_STORE.delete(normalizedEmail);
      return NextResponse.json({
        success: true,
        message: "Email verified successfully",
        token: "vismaya_verified_" + Date.now(),
        user: {
          id: "usr_" + Date.now(),
          email: normalizedEmail,
          status: "active",
          isEmailVerified: true,
        },
      });
    }

    // 2. Check stateless HMAC token from body or cookie (for serverless instances)
    const cookieToken = req.cookies.get("vismaya_reg_otp")?.value;
    const rawToken =
      token || (cookieToken?.startsWith(normalizedEmail + ".") ? cookieToken.slice(normalizedEmail.length + 1) : null);

    if (rawToken && rawToken.includes(".")) {
      const [expiresAtStr, sig] = rawToken.split(".");
      const expiresAt = parseInt(expiresAtStr, 10);
      if (Date.now() <= expiresAt) {
        const expectedSig = crypto
          .createHmac("sha256", OTP_SECRET)
          .update(`${normalizedEmail}:${cleanOtp}:${expiresAt}`)
          .digest("hex");

        if (sig === expectedSig) {
          if (OTP_STORE.has(normalizedEmail)) OTP_STORE.delete(normalizedEmail);
          return NextResponse.json({
            success: true,
            message: "Email verified successfully",
            token: "vismaya_verified_" + Date.now(),
            user: {
              id: "usr_" + Date.now(),
              email: normalizedEmail,
              status: "active",
              isEmailVerified: true,
            },
          });
        }
      }
    }

    return NextResponse.json(
      { success: false, message: "Invalid or expired verification code. Please check your email and try again." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[verify-registration-otp] Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
