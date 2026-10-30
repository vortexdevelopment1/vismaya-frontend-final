import { NextResponse } from "next/server";

const OTP_STORE = global.__REG_OTP_STORE__ || new Map();
global.__REG_OTP_STORE__ = OTP_STORE;

export async function POST(req) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) {
      return NextResponse.json({ success: false, message: "Email and OTP code are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();
    const record = OTP_STORE.get(normalizedEmail);

    if (!record) {
      return NextResponse.json(
        { success: false, message: "Verification code expired or not requested. Please request a new code." },
        { status: 400 }
      );
    }

    if (Date.now() > record.expiresAt) {
      OTP_STORE.delete(normalizedEmail);
      return NextResponse.json(
        { success: false, message: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    if (record.code !== cleanOtp) {
      return NextResponse.json(
        { success: false, message: "Invalid verification code. Please check your email and try again." },
        { status: 400 }
      );
    }

    // OTP is valid! Invalidate so it can't be reused
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
  } catch (error) {
    console.error("[verify-registration-otp] Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
