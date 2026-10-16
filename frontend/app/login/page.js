"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import PasswordInput from "@/components/PasswordInput";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, Lock, Mail, Sparkles, AlertCircle } from "lucide-react";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams ? searchParams.get("redirect") : null;
  const { login, getDashboardPath } = useAuth();

  const [email, setEmail] = useState("aanya.sharma@vismaya.io");
  const [password, setPassword] = useState("password123");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setFormError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const res = await login({ email, password });
      if (res.success && res.user) {
        if (redirectPath) {
          router.push(redirectPath);
        } else {
          router.push(getDashboardPath());
        }
      } else {
        setFormError(res.error || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      setFormError(err.message || "An unexpected error occurred during login.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = async (targetRole) => {
    setIsSubmitting(true);
    setFormError("");
    try {
      const emailMap = {
        talent: "aanya.sharma@vismaya.io",
        recruiter: "recruiter@zee.com",
        admin: "admin@vismaya.io",
      };
      const pathMap = {
        talent: "/talent/dashboard",
        recruiter: "/recruiter/dashboard",
        admin: "/admin/dashboard",
      };
      await login({ email: emailMap[targetRole] || "aanya.sharma@vismaya.io", password: "password123" });
      router.push(pathMap[targetRole] || "/talent/dashboard");
    } catch {
      const pathMap = {
        talent: "/talent/dashboard",
        recruiter: "/recruiter/dashboard",
        admin: "/admin/dashboard",
      };
      router.push(pathMap[targetRole] || "/talent/dashboard");
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

      {/* Fast Demo Access */}
      <div
        style={{
          backgroundColor: "var(--bg-alt, #F0EEE7)",
          border: "1px solid var(--border-color, #E4E1D9)",
          borderRadius: "var(--radius-card, 6px)",
          padding: "14px",
          marginBottom: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Sparkles size={13} style={{ color: "var(--gold)" }} />
          <span
            style={{
              fontSize: "11px",
              fontWeight: "600",
              color: "var(--gold)",
              textTransform: "uppercase",
              letterSpacing: "0.10em",
            }}
          >
            Quick Demo Workspace
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <Link
            href="/talent/dashboard"
            style={{
              fontSize: "11px",
              textAlign: "center",
              padding: "6px 4px",
              borderRadius: "var(--radius-btn, 4px)",
              backgroundColor: "var(--bg-surface, #FFFFFF)",
              border: "1px solid var(--border-color, #E4E1D9)",
              color: "var(--text-primary, #292C29)",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              textDecoration: "none",
              minHeight: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.18s ease",
            }}
            className="demo-btn"
          >
            Talent
          </Link>
          <Link
            href="/recruiter/dashboard"
            style={{
              fontSize: "11px",
              textAlign: "center",
              padding: "6px 4px",
              borderRadius: "var(--radius-btn, 4px)",
              backgroundColor: "var(--bg-surface, #FFFFFF)",
              border: "1px solid var(--border-color, #E4E1D9)",
              color: "var(--text-primary, #292C29)",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              textDecoration: "none",
              minHeight: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.18s ease",
            }}
            className="demo-btn"
          >
            Studio
          </Link>
        </div>
      </div>

      {formError && (
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
              suppressHydrationWarning
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ paddingLeft: "42px", width: "100%" }}
            />
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Password
            </label>
            <Link href="/forgot-password" style={{ fontSize: "12px", color: "var(--gold)", fontWeight: "600", textDecoration: "none" }}>
              Forgot?
            </Link>
          </div>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            autoComplete="current-password"
            leftIcon={<Lock size={16} />}
          />
        </div>

        <button
          suppressHydrationWarning
          type="submit"
          disabled={isSubmitting}
          className="btn-primary"
          style={{ width: "100%", justifyContent: "center", marginTop: "6px", cursor: isSubmitting ? "not-allowed" : "pointer" }}
        >
          <span>{isSubmitting ? "Signing in..." : "Sign In to Vismaya"}</span>
          <ArrowRight size={15} />
        </button>

        <GoogleAuthButton
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
      <PublicNav />

      {/* Full-Height Hero Background with Centered Glass Card */}
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

        <div className="public-container" style={{ position: "relative", zIndex: 5, display: "flex", justifyContent: "center", width: "100%" }}>
          <Suspense fallback={null}>
            <LoginFormContent />
          </Suspense>
        </div>
      </section>

      <PublicFooter />

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
