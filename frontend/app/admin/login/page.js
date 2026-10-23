"use client";

import React, { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import PasswordInput from "@/components/PasswordInput";
import { Lock, Mail, Shield, KeyRound, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { adminService } from "@/lib/api/services/adminService";
import { setAuthToken } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";

function AdminLoginFormContent() {
  const router = useRouter();
  const { saveSession } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // 2FA Challenge State
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [twoFactorSuccess, setTwoFactorSuccess] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setFormError("Please enter your administrator email and password.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const res = await adminService.adminLogin({ email, password });

      if (res.requires2FA) {
        setRequires2FA(true);
        const token = res.twoFactorToken || res.tempToken;
        setTempToken(token);
        if (res.debugOtp) {
          setOtpCode(res.debugOtp);
        }
        setFormError("");
      } else if (res.token && res.user) {
        setAuthToken(res.token);
        saveSession(res.user, res.token);
        router.push("/admin/dashboard");
      } else {
        setFormError(res.message || "Invalid email or password.");
      }
    } catch (err) {
      setFormError(err.message || "Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setFormError("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const res = await adminService.adminVerify2FA({
        email,
        otp: otpCode,
        tempToken,
        twoFactorToken: tempToken,
      });

      if (res.token && res.user) {
        setTwoFactorSuccess(true);
        setAuthToken(res.token);
        saveSession(res.user, res.token);
        setTimeout(() => {
          router.push("/admin/dashboard");
        }, 500);
      } else {
        setFormError(res.message || "Invalid or expired two-factor authentication code.");
      }
    } catch (err) {
      setFormError(err.message || "Invalid or expired verification code.");
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
          <Shield size={13} style={{ color: "var(--gold)" }} />
          <span>Restricted Access</span>
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
          Operations Desk
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-secondary, #777970)", margin: 0, lineHeight: "22px" }}>
          {requires2FA
            ? "Enter the 6-digit two-factor verification code sent to your email."
            : "Sign in with your verified administrative credentials."}
        </p>
      </div>

      {/* Error Alert */}
      {formError && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 14px",
            backgroundColor: "var(--danger-bg, #FFEBEE)",
            border: "1px solid var(--danger-border, #FFCDD2)",
            borderRadius: "var(--radius-card, 6px)",
            color: "var(--danger, #C62828)",
            fontSize: "13px",
            marginBottom: "16px",
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{formError}</span>
        </div>
      )}

      {!requires2FA ? (
        /* Step 1: Admin Credentials Form */
        <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
              Admin Email
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
                }}
              />
            </div>
          </div>

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
              Password
            </label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoComplete="current-password"
              leftIcon={<Lock size={16} />}
              inputStyle={{
                height: "44px",
                backgroundColor: "#FFFFFF",
                border: "1px solid var(--border-color, #E4E1D9)",
                borderRadius: "var(--radius-input, 4px)",
                color: "var(--text-primary, #292C29)",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
              <Link
                href="/admin/forgot-password"
                id="link-admin-forgot-password"
                style={{
                  fontSize: "12.5px",
                  color: "#8A6B2E",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <button
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
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <span>Authenticate Session</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      ) : (
        /* Step 2: 2FA Verification Form */
        <form onSubmit={handle2FASubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
                textAlign: "center",
              }}
            >
              Two-Factor Security Code
            </label>
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
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                required
                autoFocus
                style={{
                  paddingLeft: "42px",
                  width: "100%",
                  height: "46px",
                  fontSize: "20px",
                  letterSpacing: "0.25em",
                  fontFamily: "monospace",
                  textAlign: "center",
                  boxSizing: "border-box",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid var(--border-color, #E4E1D9)",
                  borderRadius: "var(--radius-input, 4px)",
                  color: "var(--text-primary, #292C29)",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || twoFactorSuccess}
            className="btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: "8px",
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {twoFactorSuccess ? (
              <>
                <CheckCircle2 size={16} />
                <span>Access Granted</span>
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Validating OTP...</span>
              </>
            ) : (
              <>
                <span>Verify & Enter Console</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setRequires2FA(false);
              setTempToken("");
              setOtpCode("");
              setFormError("");
            }}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              color: "var(--text-secondary, #777970)",
              fontSize: "13px",
              marginTop: "8px",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Back to credentials login
          </button>
        </form>
      )}

      {/* Security Footer Notice */}
      <div
        style={{
          marginTop: "24px",
          paddingTop: "16px",
          borderTop: "1px solid var(--border-color, #E4E1D9)",
          textAlign: "center",
          fontSize: "11.5px",
          color: "var(--text-secondary, #777970)",
          lineHeight: 1.5,
        }}
      >
        All administrative sessions, API calls, and modifications are cryptographically signed and permanently
        audit-logged.
      </div>

      <style jsx global>{`
        .login-glass-card input,
        .login-glass-card .v-password-input {
          background-color: #FFFFFF !important;
          background: #FFFFFF !important;
          color: #292C29 !important;
          border: 1px solid var(--border-color, #E4E1D9) !important;
        }
        .login-glass-card input:focus,
        .login-glass-card .v-password-input:focus {
          background-color: #FFFFFF !important;
          background: #FFFFFF !important;
          border-color: var(--gold, #80632E) !important;
          box-shadow: 0 0 0 3px rgba(128, 99, 46, 0.15) !important;
          outline: none !important;
        }
        .login-glass-card input:-webkit-autofill,
        .login-glass-card input:-webkit-autofill:hover,
        .login-glass-card input:-webkit-autofill:focus,
        .login-glass-card input:-webkit-autofill:active,
        .login-glass-card input:autofill,
        .login-glass-card input:autofill:hover,
        .login-glass-card input:autofill:focus,
        .login-glass-card input:autofill:active,
        .login-glass-card .v-password-input:-webkit-autofill,
        .login-glass-card .v-password-input:-webkit-autofill:hover,
        .login-glass-card .v-password-input:-webkit-autofill:focus,
        .login-glass-card .v-password-input:-webkit-autofill:active,
        .login-glass-card .v-password-input:autofill {
          -webkit-box-shadow: 0 0 0 1000px #FFFFFF inset !important;
          box-shadow: 0 0 0 1000px #FFFFFF inset !important;
          -webkit-text-fill-color: #292C29 !important;
          caret-color: #292C29 !important;
          transition: background-color 5000s ease-in-out 0s !important;
          background-color: #FFFFFF !important;
        }
        .login-glass-card input:-webkit-autofill:focus,
        .login-glass-card input:autofill:focus,
        .login-glass-card .v-password-input:-webkit-autofill:focus,
        .login-glass-card .v-password-input:autofill:focus {
          -webkit-box-shadow: 0 0 0 3px rgba(128, 99, 46, 0.15), 0 0 0 1000px #FFFFFF inset !important;
          box-shadow: 0 0 0 3px rgba(128, 99, 46, 0.15), 0 0 0 1000px #FFFFFF inset !important;
          border-color: var(--gold, #80632E) !important;
        }
      `}</style>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        backgroundColor: "var(--bg-primary, #FAF9F7)",
      }}
    >
      <PublicNav />

      {/* Hero Section with Centered Glass Card */}
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
            background: "var(--bg-primary, #FAF9F7)",
            pointerEvents: "none",
          }}
        />

        <div
          className="public-container"
          style={{
            position: "relative",
            zIndex: 5,
            display: "flex",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <Suspense fallback={null}>
            <AdminLoginFormContent />
          </Suspense>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
