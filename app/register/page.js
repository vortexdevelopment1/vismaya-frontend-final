"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, User, Mail, Lock, Building2, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register, getDashboardPath } = useAuth();

  const [selectedRole, setSelectedRole] = useState("talent");
  const [name, setName] = useState("Aanya Sharma");
  const [email, setEmail] = useState("aanya.sharma@vismaya.io");
  const [password, setPassword] = useState("secretpassword123");
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
    if (!name || !email || !password) {
      setFormError("Please fill in all required registration fields.");
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
                <span>Join Vismaya Network</span>
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
                Create Account
              </h1>
              <p style={{ fontSize: "14px", color: "#a3acc2", margin: 0, lineHeight: "22px" }}>
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
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.35)",
                  borderRadius: "10px",
                  color: "#fca5a5",
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
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#a3acc2", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  I want to join as:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => handleRoleChange("talent")}
                    style={{
                      height: "44px",
                      borderRadius: "10px",
                      border: selectedRole === "talent" ? "1px solid #ffd54a" : "1px solid rgba(255, 255, 255, 0.14)",
                      background: selectedRole === "talent" ? "linear-gradient(135deg, #ffd54a 0%, #ffbc00 100%)" : "rgba(255, 255, 255, 0.05)",
                      color: selectedRole === "talent" ? "#1a1300" : "#eceaf5",
                      fontSize: "12px",
                      fontWeight: "800",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      cursor: "pointer",
                      transition: "all var(--transition)",
                      boxShadow: selectedRole === "talent" ? "0 4px 14px rgba(255, 188, 0, 0.35)" : "none",
                    }}
                  >
                    Talent / Artist
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange("organization")}
                    style={{
                      height: "44px",
                      borderRadius: "10px",
                      border: selectedRole === "organization" ? "1px solid #ffd54a" : "1px solid rgba(255, 255, 255, 0.14)",
                      background: selectedRole === "organization" ? "linear-gradient(135deg, #ffd54a 0%, #ffbc00 100%)" : "rgba(255, 255, 255, 0.05)",
                      color: selectedRole === "organization" ? "#1a1300" : "#eceaf5",
                      fontSize: "12px",
                      fontWeight: "800",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      cursor: "pointer",
                      transition: "all var(--transition)",
                      boxShadow: selectedRole === "organization" ? "0 4px 14px rgba(255, 188, 0, 0.35)" : "none",
                    }}
                  >
                    Organization
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#a3acc2", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {selectedRole === "organization" ? "Studio / Organization Name" : "Full Name"}
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  {selectedRole === "organization" ? (
                    <Building2 size={16} style={{ position: "absolute", left: "14px", color: "#7e89a3", pointerEvents: "none" }} />
                  ) : (
                    <User size={16} style={{ position: "absolute", left: "14px", color: "#7e89a3", pointerEvents: "none" }} />
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
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#a3acc2", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Work Email Address
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Mail size={16} style={{ position: "absolute", left: "14px", color: "#7e89a3", pointerEvents: "none" }} />
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
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#a3acc2", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Create Password
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Lock size={16} style={{ position: "absolute", left: "14px", color: "#7e89a3", pointerEvents: "none" }} />
                  <input
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                <span>{isSubmitting ? "Creating Account..." : "Complete Registration"}</span>
                <ArrowRight size={15} />
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "#a3acc2" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--gold)", fontWeight: "700", textDecoration: "none" }}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
