"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { authService } from "@/lib/api/services/authService";
import { ArrowRight, Mail, KeyRound, Lock, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await authService.forgotPassword({ email });
      if (res.success) {
        setSuccessMessage("Verification OTP sent to your email.");
        setStep(2);
      } else {
        setErrorMessage(res.message || "Could not send OTP. Please verify your email.");
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to send reset code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setErrorMessage("Please enter the 6-digit OTP code.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await authService.verifyOtp({ email, otp });
      if (res.success) {
        setSuccessMessage("OTP verified successfully. Now create a new password.");
        setStep(3);
      } else {
        setErrorMessage(res.message || "Invalid or expired OTP code.");
      }
    } catch (err) {
      setErrorMessage(err.message || "OTP verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await authService.resetPassword({ email, otp, newPassword });
      if (res.success) {
        setStep(4);
      } else {
        setErrorMessage(res.message || "Failed to reset password.");
      }
    } catch (err) {
      setErrorMessage(err.message || "Password reset failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", width: "100%", backgroundColor: "var(--bg-primary)" }}>
      <PublicNav />

      <section
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: "clamp(120px, 16vh, 160px)",
          paddingBottom: "clamp(56px, 8vw, 96px)",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(60% 60% at 50% 40%, rgba(255, 188, 0, 0.12), transparent 70%), linear-gradient(180deg, #070b12 0%, #0a0f19 100%)",
            pointerEvents: "none",
          }}
        />

        <div className="public-container" style={{ position: "relative", zIndex: 5, display: "flex", justifyContent: "center", width: "100%" }}>
          <div
            className="glass"
            style={{
              width: "100%",
              maxWidth: "460px",
              backgroundColor: "rgba(15, 22, 38, 0.85)",
              borderRadius: "24px",
              padding: "clamp(28px, 5vw, 40px)",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.65)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              boxSizing: "border-box",
              color: "#eceaf5",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div className="eyebrow" style={{ marginBottom: "12px", justifyContent: "center" }}>
                <span>Account Recovery</span>
              </div>

              <h1
                style={{
                  fontFamily: "var(--font-heading), 'Playfair Display', serif",
                  fontSize: "26px",
                  fontWeight: 700,
                  color: "#eceaf5",
                  marginBottom: "6px",
                  lineHeight: 1.25,
                }}
              >
                {step === 4 ? "Password Reset Complete" : "Reset Password"}
              </h1>
              <p style={{ fontSize: "14px", color: "#a3acc2", margin: 0, lineHeight: "22px" }}>
                {step === 1 && "Enter your registered email address to receive a verification OTP."}
                {step === 2 && `Enter the 6-digit OTP code sent to ${email}.`}
                {step === 3 && "Create a secure new password for your account."}
                {step === 4 && "Your password has been successfully updated. You can now sign in."}
              </p>
            </div>

            {errorMessage && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 14px",
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.35)",
                  borderRadius: "10px",
                  color: "#fca5a5",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#a3acc2", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Registered Email Address
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Mail size={16} style={{ position: "absolute", left: "14px", color: "#7e89a3", pointerEvents: "none" }} />
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{ paddingLeft: "42px", width: "100%" }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", marginTop: "6px", cursor: isSubmitting ? "not-allowed" : "pointer" }}
                >
                  <span>{isSubmitting ? "Sending OTP..." : "Send Verification OTP"}</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#a3acc2", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    6-Digit OTP Code
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <KeyRound size={16} style={{ position: "absolute", left: "14px", color: "#7e89a3", pointerEvents: "none" }} />
                    <input
                      type="text"
                      placeholder="e.g. 123456"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.trim())}
                      required
                      style={{ paddingLeft: "42px", width: "100%", letterSpacing: "0.2em", fontSize: "16px", fontWeight: "700" }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", marginTop: "6px", cursor: isSubmitting ? "not-allowed" : "pointer" }}
                >
                  <span>{isSubmitting ? "Verifying..." : "Verify Code"}</span>
                  <ArrowRight size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#a3acc2",
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                  }}
                >
                  <ArrowLeft size={12} />
                  <span>Change Email</span>
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#a3acc2", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    New Password
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Lock size={16} style={{ position: "absolute", left: "14px", color: "#7e89a3", pointerEvents: "none" }} />
                    <input
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      style={{ paddingLeft: "42px", width: "100%" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#a3acc2", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Confirm Password
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Lock size={16} style={{ position: "absolute", left: "14px", color: "#7e89a3", pointerEvents: "none" }} />
                    <input
                      type="password"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      style={{ paddingLeft: "42px", width: "100%" }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", marginTop: "6px", cursor: isSubmitting ? "not-allowed" : "pointer" }}
                >
                  <span>{isSubmitting ? "Updating Password..." : "Save New Password"}</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            )}

            {step === 4 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", textAlign: "center" }}>
                <CheckCircle2 size={48} style={{ color: "#10b981" }} />
                <p style={{ color: "#eceaf5", fontSize: "14px", margin: 0 }}>
                  You can now log in to your account with your new credentials.
                </p>
                <Link
                  href="/login"
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <span>Go to Login</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            )}

            <div style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "#a3acc2" }}>
              Remember your password?{" "}
              <Link href="/login" style={{ color: "var(--gold)", fontWeight: "700", textDecoration: "none" }}>
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
