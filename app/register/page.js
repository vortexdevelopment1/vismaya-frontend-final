"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import PasswordInput from "@/components/PasswordInput";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, User, Mail, Lock, Building2, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register, getDashboardPath } = useAuth();

  const [selectedRole, setSelectedRole] = useState("talent");
  const [name, setName] = useState("Aanya Sharma");
  const [email, setEmail] = useState("aanya.sharma@vismaya.io");
  const [password, setPassword] = useState("secretpassword123");
  const [confirmPassword, setConfirmPassword] = useState("secretpassword123");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    if (role === "organization") {
      setName("Zee Films Studio");
      setEmail("casting@zeefilms.com");
    } else {
      setName("Aanya Sharma");
      setEmail("aanya.sharma@vismaya.io");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setFormError("Please fill in all required registration fields.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const payload = {
        role: selectedRole === "organization" ? "organization" : "talent",
        email,
        password,
        name: name.trim(),
        studioName: selectedRole === "organization" ? name.trim() : undefined,
      };

      const res = await register(payload);
      if (res.success && res.user) {
        router.push(getDashboardPath());
      } else {
        setFormError(res.error || "Registration failed. Please try again.");
      }
    } catch (err) {
      setFormError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", width: "100%", backgroundColor: "var(--bg-primary)" }}>
      <PublicNav />

      {/* Full-Height Background with Centered Glass Card */}
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
            className="glass register-glass-card"
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
                <span>Join Vismaya Network</span>
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
                Create Account
              </h1>
              <p style={{ fontSize: "14px", color: "var(--text-secondary, #777970)", margin: 0, lineHeight: "22px" }}>
                Connect with verified artists, casting directors, and production studios.
              </p>
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

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Role Selection */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  I want to join as:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => handleRoleChange("talent")}
                    style={{
                      height: "44px",
                      borderRadius: "var(--radius-btn, 4px)",
                      border: selectedRole === "talent" ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                      background: selectedRole === "talent" ? "var(--gold)" : "var(--bg-alt)",
                      color: selectedRole === "talent" ? "var(--text-dark-primary, #FAF9F6)" : "var(--text-primary, #292C29)",
                      fontSize: "12px",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      cursor: "pointer",
                      transition: "all var(--transition)",
                      boxShadow: selectedRole === "talent" ? "var(--gold-glow)" : "none",
                    }}
                  >
                    Talent / Artist
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange("organization")}
                    style={{
                      height: "44px",
                      borderRadius: "var(--radius-btn, 4px)",
                      border: selectedRole === "organization" ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                      background: selectedRole === "organization" ? "var(--gold)" : "var(--bg-alt)",
                      color: selectedRole === "organization" ? "var(--text-dark-primary, #FAF9F6)" : "var(--text-primary, #292C29)",
                      fontSize: "12px",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      cursor: "pointer",
                      transition: "all var(--transition)",
                      boxShadow: selectedRole === "organization" ? "var(--gold-glow)" : "none",
                    }}
                  >
                    Organization
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {selectedRole === "organization" ? "Studio / Organization Name" : "Full Name"}
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  {selectedRole === "organization" ? (
                    <Building2 size={16} style={{ position: "absolute", left: "14px", color: "var(--text-secondary, #777970)", pointerEvents: "none" }} />
                  ) : (
                    <User size={16} style={{ position: "absolute", left: "14px", color: "var(--text-secondary, #777970)", pointerEvents: "none" }} />
                  )}
                  <input
                    type="text"
                    placeholder={selectedRole === "organization" ? "e.g. Zee Films Studio" : "e.g. Aanya Sharma"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ paddingLeft: "42px", width: "100%" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Work Email Address
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Mail size={16} style={{ position: "absolute", left: "14px", color: "var(--text-secondary, #777970)", pointerEvents: "none" }} />
                  <input
                    type="email"
                    placeholder={selectedRole === "organization" ? "casting@studio.com" : "name@example.com"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ paddingLeft: "42px", width: "100%" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Create Password
                </label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  placeholder="Re-enter your password"
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
                <span>{isSubmitting ? "Creating Account..." : "Complete Registration"}</span>
                <ArrowRight size={15} />
              </button>

              <GoogleAuthButton
                role={selectedRole}
                isRegister={true}
                onSuccess={(user) => {
                  router.push(getDashboardPath(user?.role));
                }}
                onError={(err) => setFormError(err)}
              />
            </form>

            <div style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "var(--text-secondary, #777970)" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--gold)", fontWeight: "600", textDecoration: "none" }}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
      <style jsx>{`
        @media (max-width: 640px) {
          :global(.register-glass-card) {
            padding: 22px 16px !important;
            border-radius: 14px !important;
          }
        }
      `}</style>
    </div>
  );
}
