"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import PasswordInput from "@/components/PasswordInput";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import AuthSubmitButton from "@/components/auth/AuthSubmitButton";
import AuthStatus from "@/components/auth/AuthStatus";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, ArrowLeft, Lock, Mail, AlertCircle } from "lucide-react";
import { isRealMode } from "@/lib/api/config";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams ? searchParams.get("redirect") : null;
  const { login, getDashboardPath } = useAuth();

  const [email, setEmail] = useState(() => isRealMode("auth") ? "" : "aanya.sharma@vismaya.io");
  const [password, setPassword] = useState(() => isRealMode("auth") ? "" : "password123");
  const [authStatus, setAuthStatus] = useState("idle"); // "idle" | "submitting" | "slow" | "success"
  const [formError, setFormError] = useState("");

  const slowTimerRef = useRef(null);
  const emailInputRef = useRef(null);
  const errorAlertRef = useRef(null);

  const isSubmitting = authStatus === "submitting" || authStatus === "slow";
  const isBusy = authStatus !== "idle";

  useEffect(() => {
    return () => {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isBusy) return; // Prevent double submit
    if (!email || !password) {
      setFormError("Please enter both email and password.");
      return;
    }

    setAuthStatus("submitting");
    setFormError("");

    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    slowTimerRef.current = setTimeout(() => {
      setAuthStatus("slow");
    }, 4000);

    try {
      const res = await login({ email, password });
      if (res.success && res.user) {
        if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
        setAuthStatus("success");
        // Keep the form disabled and DO NOT reset this state when the router navigates;
        // the state disappears naturally when the new page mounts.
        if (redirectPath) {
          router.push(redirectPath);
        } else {
          router.push(getDashboardPath());
        }
      } else {
        if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
        setAuthStatus("idle");
        setFormError(res.error || "Login failed. Please check your credentials.");
        setTimeout(() => {
          if (errorAlertRef.current) {
            errorAlertRef.current.focus();
          } else if (emailInputRef.current) {
            emailInputRef.current.focus();
          }
        }, 0);
      }
    } catch (err) {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      setAuthStatus("idle");
      setFormError(err.message || "An unexpected error occurred during login.");
      setTimeout(() => {
        if (errorAlertRef.current) {
          errorAlertRef.current.focus();
        } else if (emailInputRef.current) {
          emailInputRef.current.focus();
        }
      }, 0);
    }
  };

return (
    <div
      className="glass login-glass-card"
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
          <span>Verified Casting Console</span>
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
          Welcome Back
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-secondary, #777970)", margin: 0, lineHeight: "22px" }}>
          Access your talent portfolio, organization briefs, or admin desk.
        </p>
      </div>

      {formError && (
        <div
          ref={errorAlertRef}
          tabIndex={-1}
          role="alert"
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
            outline: "none",
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{formError}</span>
        </div>
      )}

      <form suppressHydrationWarning onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Email Address
          </label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Mail size={16} style={{ position: "absolute", left: "14px", color: "var(--text-secondary, #777970)", pointerEvents: "none" }} />
            <input
              ref={emailInputRef}
              suppressHydrationWarning
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isBusy}
              style={{
                paddingLeft: "42px",
                width: "100%",
                backgroundColor: isBusy ? "#F7F3EA" : undefined,
                color: isBusy ? "#8A8170" : undefined,
                cursor: isBusy ? "not-allowed" : undefined,
              }}
            />
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Password
            </label>
            {isBusy ? (
              <span style={{ fontSize: "12px", color: "#8A8170", fontWeight: "600", cursor: "not-allowed", pointerEvents: "none" }}>
                Forgot?
              </span>
            ) : (
              <Link href="/forgot-password" style={{ fontSize: "12px", color: "var(--gold)", fontWeight: "600", textDecoration: "none" }}>
                Forgot?
              </Link>
            )}
          </div>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            autoComplete="current-password"
            leftIcon={<Lock size={16} />}
            disabled={isBusy}
            inputStyle={
              isBusy
                ? {
                    backgroundColor: "#F7F3EA",
                    color: "#8A8170",
                    cursor: "not-allowed",
                  }
                : {}
            }
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0px", marginTop: "6px" }}>
          <AuthSubmitButton
            status={authStatus}
            defaultText="Sign In to Vismaya"
            submittingText="Signing you in..."
            successText="Signed in"
            icon={<ArrowRight size={15} />}
          />
          <AuthStatus status={authStatus} />
        </div>

        <GoogleAuthButton
          disabled={isBusy}
          onSuccess={(user) => {
            if (redirectPath) {
              router.push(redirectPath);
            } else {
              router.push(getDashboardPath(user?.role));
            }
          }}
          onError={(err) => setFormError(err)}
        />
      </form>

      <div style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "var(--text-secondary, #777970)" }}>
        Don&apos;t have an account?{" "}
        <Link href="/register" style={{ color: "var(--gold)", fontWeight: "600", textDecoration: "none" }}>
          Register here
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", width: "100%", backgroundColor: "var(--bg-primary)" }}>
      {/* Full-Height Centered Section with Back Button and Login Card */}
      <section
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: "clamp(28px, 4vh, 52px)",
          paddingBottom: "clamp(36px, 5vw, 64px)",
          overflow: "hidden",
        }}
      >
        {/* Subtle backdrop glow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--bg-primary)",
            pointerEvents: "none",
          }}
        />

        <div className="public-container" style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          {/* Back to Home Button */}
          <div style={{ width: "100%", maxWidth: "460px", marginBottom: "16px" }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--text-secondary, #777970)",
                textDecoration: "none",
                fontSize: "13.5px",
                fontWeight: "500",
                padding: "6px 0",
                transition: "color 0.18s ease",
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </Link>
          </div>

          <Suspense fallback={null}>
            <LoginFormContent />
          </Suspense>
        </div>
      </section>

      <style jsx>{`
        :global(.demo-btn:hover) {
          background-color: rgba(255, 188, 0, 0.14) !important;
          border-color: rgba(255, 188, 0, 0.40) !important;
          color: var(--gold) !important;
        }
        @media (max-width: 640px) {
          :global(.login-glass-card) {
            padding: 22px 16px !important;
            border-radius: 14px !important;
          }
        }
      `}</style>
    </div>
  );
}
