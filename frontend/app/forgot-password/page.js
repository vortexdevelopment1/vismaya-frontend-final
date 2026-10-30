"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import PasswordInput from "@/components/PasswordInput";
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
      if (res && res.success) {
        setSuccessMessage("Verification OTP sent to your email.");
        setStep(2);
      } else {
        setErrorMessage(res?.message || "This email address is not registered.");
      }
    } catch (err) {
      setErrorMessage(err.message || "This email address is not registered.");
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
          paddingTop: "clamp(36px, 5vh, 64px)",
          paddingBottom: "clamp(48px, 6vw, 80px)",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(60% 60% at 50% 40%, rgba(201, 165, 92, 0.08), transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div className="public-container" style={{ position: "relative", zIndex: 5, display: "flex", justifyContent: "center", width: "100%" }}>
          <div
            className="glass"
            style={{
              width: "100%",
              maxWidth: "460px",
              backgroundColor: "var(--bg-surface)",
              borderRadius: "var(--radius-card)",
              padding: "clamp(28px, 5vw, 40px)",
              boxShadow: "var(--shadow-md)",
              border: "1px solid var(--border-color)",
              boxSizing: "border-box",
              color: "var(--text-primary)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div className="eyebrow" style={{ marginBottom: "12px", justifyContent: "center" }}>
                <span>Account Recovery</span>
              </div>

              <h1
                style={{
                  fontFamily: "var(--font-heading), Georgia, serif",
                  fontSize: "26px",
                  fontWeight: 400,
                  color: "var(--text-primary, #292C29)",
                  marginBottom: "6px",
                  lineHeight: 1.25,
                }}
              >
                {step === 4 ? "Password Reset Complete" : "Reset Password"}
              </h1>
              <p style={{ fontSize: "14px", color: "var(--text-secondary, #777970)", margin: 0, lineHeight: "22px" }}>
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
                  backgroundColor: "var(--danger-bg)",
                  border: "1px solid var(--danger-border)",
                  borderRadius: "var(--radius-card, 6px)",
                  color: "var(--danger)",
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
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Registered Email Address
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Mail size={16} style={{ position: "absolute", left: "14px", color: "var(--text-secondary, #777970)", pointerEvents: "none" }} />
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
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    6-Digit OTP Code
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <KeyRound size={16} style={{ position: "absolute", left: "14px", color: "var(--text-secondary, #777970)", pointerEvents: "none" }} />
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
                    color: "var(--text-secondary, #777970)",
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
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    New Password
                  </label>
                  <PasswordInput
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                    autoComplete="new-password"
                    leftIcon={<Lock size={16} />}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Confirm Password
                  </label>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    autoComplete="new-password"
                    leftIcon={<Lock size={16} />}
                  />
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
                <CheckCircle2 size={48} style={{ color: "var(--success)" }} />
                <p style={{ color: "var(--text-primary, #292C29)", fontSize: "14px", margin: 0 }}>
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

            <div style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "var(--text-secondary, #777970)" }}>
              Remember your password?{" "}
              <Link href="/login" style={{ color: "var(--gold)", fontWeight: "600", textDecoration: "none" }}>
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
