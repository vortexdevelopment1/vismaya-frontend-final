"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import PasswordInput from "@/components/PasswordInput";
import {
  Shield,
  Mail,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Check,
  X,
  Info,
} from "lucide-react";
import { adminService } from "@/lib/api/services/adminService";

function AdminForgotPasswordContent() {
  const router = useRouter();

  // Multi-step: 1 = email, 2 = otp + new password, 3 = success
  const [step, setStep] = useState(1);

  // Form State
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [genericNotice, setGenericNotice] = useState("");

  // Resend Countdown
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Password rules validation
  const rules = {
    length: newPassword.length >= 10,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
    match: confirmPassword.length > 0 && newPassword === confirmPassword,
  };

  const isPasswordValid =
    rules.length && rules.upper && rules.lower && rules.number && rules.special;

  // Countdown timer for resend button
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, countdown]);

  // Step 1: Send verification code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      setFormError("Please enter your registered administrator email address.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const res = await adminService.adminForgotPassword({ email: email.trim() });
      if (res && res.success === false) {
        setFormError(res.message || "This email address is not registered.");
        return;
      }
      setGenericNotice(res?.message || "A 6-digit verification code has been sent. Check your inbox.");
      setStep(2);
      setCountdown(60);
      setCanResend(false);
    } catch (err) {
      setFormError(err.message || "This email address is not registered.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend code handler
  const handleResendCode = async () => {
    if (!canResend || isSubmitting) return;

    setIsSubmitting(true);
    setFormError("");

    try {
      await adminService.adminForgotPassword({ email: email.trim() });
      setGenericNotice("A new 6-digit verification code has been dispatched. Check your inbox.");
      setCountdown(60);
      setCanResend(false);
    } catch (err) {
      setFormError("Unable to resend code right now. Please wait a moment and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Reset password
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!otp || otp.trim().length !== 6) {
      setFormError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (!isPasswordValid) {
      setFormError("Please ensure your new password satisfies all security requirements.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match. Please verify both fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await adminService.adminResetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        setStep(3);
      } else {
        setFormError(res.message || "The code is incorrect or has expired.");
      }
    } catch (err) {
      setFormError(err.message || "The code is incorrect or has expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="glass login-glass-card"
      style={{
        width: "100%",
        maxWidth: "460px",
        backgroundColor: "var(--bg-surface, #FFFFFF)",
        borderRadius: "var(--radius-card, 14px)",
        padding: "clamp(28px, 5vw, 40px)",
        boxShadow: "var(--shadow-md, 0 10px 30px rgba(0,0,0,0.06))",
        border: "1px solid var(--border-color, #E4E1D9)",
        boxSizing: "border-box",
        color: "var(--text-primary, #292C29)",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div className="eyebrow" style={{ marginBottom: "12px", justifyContent: "center" }}>
          <Shield size={13} style={{ color: "var(--gold, #8A6B2E)" }} />
          <span>Admin Security</span>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
            fontSize: "26px",
            fontWeight: 400,
            color: "var(--text-primary, #292C29)",
            marginBottom: "6px",
            lineHeight: 1.25,
          }}
        >
          {step === 1 && "Password Recovery"}
          {step === 2 && "Enter Verification Code"}
          {step === 3 && "Password Updated"}
        </h1>

        <p style={{ fontSize: "14px", color: "var(--text-secondary, #777970)", margin: 0, lineHeight: "22px" }}>
          {step === 1 && "Enter your registered administrator email to receive a recovery code."}
          {step === 2 && "Enter the 6-digit code sent to your email and set your new password."}
          {step === 3 && "Your administrator password has been updated. Please sign in to continue."}
        </p>
      </div>

      {/* Info Notice (Step 2) */}
      {step === 2 && genericNotice && (
        <div
          id="admin-notice-box"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            padding: "12px 14px",
            backgroundColor: "#FBF7ED",
            border: "1px solid #E8E2D4",
            borderRadius: "8px",
            color: "#8A6B2E",
            fontSize: "13px",
            marginBottom: "16px",
            lineHeight: 1.45,
          }}
        >
          <Info size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
          <span>{genericNotice}</span>
        </div>
      )}

      {/* Error Alert */}
      {formError && (
        <div
          id="admin-error-box"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 14px",
            backgroundColor: "#FFEBEE",
            border: "1px solid #FFCDD2",
            borderRadius: "6px",
            color: "#C62828",
            fontSize: "13px",
            marginBottom: "16px",
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{formError}</span>
        </div>
      )}

      {/* STEP 1: Enter Email */}
      {step === 1 && (
        <form onSubmit={handleRequestCode} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--text-primary, #292C29)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Admin Email Address
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Mail
                size={16}
                style={{
                  position: "absolute",
                  left: "14px",
                  color: "var(--text-secondary, #777970)",
                  pointerEvents: "none",
                }}
              />
              <input
                id="input-admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vismaya.io"
                required
                autoComplete="email"
                autoFocus
                style={{
                  paddingLeft: "42px",
                  width: "100%",
                  height: "44px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid var(--border-color, #E4E1D9)",
                  borderRadius: "var(--radius-input, 4px)",
                  color: "var(--text-primary, #292C29)",
                  boxSizing: "border-box",
                  outline: "none",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>

          <button
            id="btn-send-code"
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: "8px",
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Sending Code...</span>
              </>
            ) : (
              <>
                <span>Send verification code</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>

          <div style={{ textAlign: "center", marginTop: "12px" }}>
            <Link
              href="/admin/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                color: "var(--text-secondary, #777970)",
                textDecoration: "none",
                fontWeight: "500",
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}

      {/* STEP 2: Enter Code & New Password */}
      {step === 2 && (
        <form onSubmit={handleResetSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* 6-digit Code */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "var(--text-primary, #292C29)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                6-Digit Verification Code
              </label>
              <span style={{ fontSize: "12px", color: "var(--text-secondary, #777970)" }}>Sent to {email}</span>
            </div>

            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <KeyRound
                size={16}
                style={{
                  position: "absolute",
                  left: "14px",
                  color: "var(--text-secondary, #777970)",
                  pointerEvents: "none",
                }}
              />
              <input
                id="input-admin-otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                placeholder="123456"
                required
                autoFocus
                style={{
                  paddingLeft: "42px",
                  width: "100%",
                  height: "44px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid var(--border-color, #E4E1D9)",
                  borderRadius: "var(--radius-input, 4px)",
                  color: "var(--text-primary, #292C29)",
                  boxSizing: "border-box",
                  outline: "none",
                  fontSize: "18px",
                  letterSpacing: "0.2em",
                  fontWeight: "600",
                }}
              />
            </div>
          </div>

          {/* New Password */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--text-primary, #292C29)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              New Password
            </label>
            <PasswordInput
              id="input-new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new strong password"
              required
              autoComplete="new-password"
              inputStyle={{
                height: "44px",
                backgroundColor: "#FFFFFF",
                border: "1px solid var(--border-color, #E4E1D9)",
                borderRadius: "var(--radius-input, 4px)",
                color: "var(--text-primary, #292C29)",
              }}
            />
          </div>

          {/* Live Password Rules Checklist */}
          <div
            style={{
              backgroundColor: "#FAF9F7",
              border: "1px solid #E8E2D4",
              borderRadius: "8px",
              padding: "10px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              fontSize: "12px",
            }}
          >
            <span style={{ fontWeight: 600, color: "#2B2D2A", marginBottom: "2px" }}>Security Requirements:</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }} className="password-rules-grid">
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: rules.length ? "#027A48" : "#7A7870" }}>
                {rules.length ? <Check size={13} /> : <X size={13} />}
                <span>At least 10 characters</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: rules.upper ? "#027A48" : "#7A7870" }}>
                {rules.upper ? <Check size={13} /> : <X size={13} />}
                <span>1 uppercase letter</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: rules.lower ? "#027A48" : "#7A7870" }}>
                {rules.lower ? <Check size={13} /> : <X size={13} />}
                <span>1 lowercase letter</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: rules.number ? "#027A48" : "#7A7870" }}>
                {rules.number ? <Check size={13} /> : <X size={13} />}
                <span>1 number</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: rules.special ? "#027A48" : "#7A7870" }}>
                {rules.special ? <Check size={13} /> : <X size={13} />}
                <span>1 special character</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: rules.match ? "#027A48" : "#7A7870" }}>
                {rules.match ? <Check size={13} /> : <X size={13} />}
                <span>Passwords match</span>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--text-primary, #292C29)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Confirm New Password
            </label>
            <PasswordInput
              id="input-confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
              autoComplete="new-password"
              inputStyle={{
                height: "44px",
                backgroundColor: "#FFFFFF",
                border: `1px solid ${confirmPassword && !rules.match ? "#FDA29B" : "var(--border-color, #E4E1D9)"}`,
                borderRadius: "var(--radius-input, 4px)",
                color: "var(--text-primary, #292C29)",
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            id="btn-update-password"
            type="submit"
            disabled={isSubmitting || !isPasswordValid || !rules.match || otp.length !== 6}
            className="btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: "4px",
              cursor: isSubmitting || !isPasswordValid || !rules.match ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <span>Update Password</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>

          {/* Resend and Back Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "10px",
              paddingTop: "12px",
              borderTop: "1px solid #F3EFE6",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setFormError("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary, #777970)",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: 0,
              }}
            >
              <ArrowLeft size={13} />
              <span>Change email</span>
            </button>

            <button
              id="btn-resend-code"
              type="button"
              onClick={handleResendCode}
              disabled={!canResend || isSubmitting}
              style={{
                background: "none",
                border: "none",
                color: canResend ? "var(--gold-dark, #8A6B2E)" : "var(--text-secondary, #777970)",
                fontSize: "13px",
                fontWeight: "600",
                cursor: canResend ? "pointer" : "not-allowed",
                padding: 0,
              }}
            >
              {canResend ? "Resend code" : `Resend in ${countdown}s`}
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: Success Screen */}
      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", textAlign: "center" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "#ECFDF3",
              border: "2px solid #A6F4C5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#027A48",
            }}
          >
            <CheckCircle2 size={34} strokeWidth={2.2} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "16px", fontWeight: "600", color: "#2B2D2A" }}>
              Password updated successfully!
            </span>
            <p style={{ fontSize: "14px", color: "var(--text-secondary, #777970)", margin: 0, lineHeight: 1.5 }}>
              Password updated. Please sign in with your new password.
            </p>
          </div>

          <button
            id="btn-return-login"
            type="button"
            onClick={() => router.push("/admin/login")}
            className="btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: "8px",
            }}
          >
            <span>Return to Admin Sign In</span>
            <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminForgotPasswordPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "var(--bg-main, #FAF9F7)",
      }}
    >
      {/* Admin Auth Header */}
      <header
        style={{
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingInline: "clamp(16px, 4vw, 40px)",
          borderBottom: "1px solid #E8E2D4",
          backgroundColor: "#FFFFFF",
        }}
      >
        <Logo variant="dark" size="sm" href="/admin/login" />
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#8A6B2E",
            backgroundColor: "#F3EFE6",
            border: "1px solid #E8E2D4",
            padding: "4px 10px",
            borderRadius: "999px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontFamily: "var(--font-body), 'Inter', sans-serif",
          }}
        >
          Operations Console
        </div>
      </header>

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(24px, 5vw, 60px) 16px",
          boxSizing: "border-box",
        }}
      >
        <Suspense fallback={<div style={{ color: "#777970" }}>Loading security desk...</div>}>
          <AdminForgotPasswordContent />
        </Suspense>
      </main>

      {/* Admin Security Footer */}
      <footer
        style={{
          padding: "20px 16px",
          textAlign: "center",
          borderTop: "1px solid #E8E2D4",
          backgroundColor: "#FFFFFF",
          color: "#6B6254",
          fontSize: "12px",
          fontFamily: "var(--font-body), 'Inter', sans-serif",
        }}
      >
        &copy; {new Date().getFullYear()} Vismaya. All rights reserved. Restricted administrative system.
      </footer>

      <style jsx global>{`
        @media (max-width: 640px) {
          .login-glass-card {
            padding: 24px 20px !important;
            border-radius: 12px !important;
          }
          .password-rules-grid {
            grid-template-columns: 1fr !important;
            gap: 4px !important;
          }
        }
      `}</style>
    </div>
  );
}
