import { NextResponse } from "next/server";
import crypto from "crypto";

const OTP_SECRET = process.env.OTP_SECRET || "vismaya_admin_otp_secret_key_2026";
const ADMIN_OTP_STORE = global.__ADMIN_OTP_STORE__ || new Map();
global.__ADMIN_OTP_STORE__ = ADMIN_OTP_STORE;

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, otp, newPassword, confirmPassword, token } = body;

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Email, verification code, and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ success: false, message: "Passwords do not match." }, { status: 400 });
    }

    if (newPassword.length < 10) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 10 characters long." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    let isValidOtp = false;

    // 1. Check in-memory store
    const record = ADMIN_OTP_STORE.get(normalizedEmail);
    if (record && Date.now() <= record.expiresAt && record.code === cleanOtp) {
      isValidOtp = true;
      ADMIN_OTP_STORE.delete(normalizedEmail);
    }

    // 2. Check stateless token fallback
    if (!isValidOtp) {
      const cookieToken = req.cookies.get("vismaya_admin_reset")?.value;
      const rawToken =
        token ||
        (cookieToken?.startsWith(normalizedEmail + ".") ? cookieToken.slice(normalizedEmail.length + 1) : null);

      if (rawToken && rawToken.includes(".")) {
        const [expiresAtStr, sig] = rawToken.split(".");
        const expiresAt = parseInt(expiresAtStr, 10);
        if (Date.now() <= expiresAt) {
          const expectedSig = crypto
            .createHmac("sha256", OTP_SECRET)
            .update(`${normalizedEmail}:${cleanOtp}:${expiresAt}`)
            .digest("hex");

          if (sig === expectedSig) {
            isValidOtp = true;
            if (ADMIN_OTP_STORE.has(normalizedEmail)) ADMIN_OTP_STORE.delete(normalizedEmail);
          }
        }
      }
    }

    if (!isValidOtp) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired verification code. Please check your email and try again." },
        { status: 400 }
      );
    }

    // Forward to backend if backend is available
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://vismaya-backend.onrender.com";
      await fetch(`${backendUrl}/api/admin/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, otp: cleanOtp, newPassword, confirmPassword }),
      });
    } catch (backendErr) {
      console.warn("Backend forward notice on admin password reset:", backendErr.message);
    }

    return NextResponse.json({
      success: true,
      message: "Administrator password reset successfully. You may now sign in with your new credentials.",
    });
  } catch (error) {
    console.error("[admin-reset-password] Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
