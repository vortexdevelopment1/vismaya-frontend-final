"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Banknote,
  Lock,
  Unlock,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  FileText,
  Sparkles,
  CheckCircle2,
  Tv,
  Film,
} from "lucide-react";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import Skeleton from "@/components/shared/Skeleton";
import { useWorkflow } from "@/lib/shared/workflowStore";
import { useAuth } from "@/context/AuthContext";
import { isRealMode } from "@/lib/api/config";
import { formatDate } from "@/lib/shared/dateUtils";

export default function PublicOpportunityDetailsPage() {
  const params = useParams();
  const { opportunityId } = params;
  const router = useRouter();

  const { getOpportunity, getProject, isHydrated } = useWorkflow();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  // Enforce Master Spec v2.0: /opportunities/[id] redirects to /login if unauthenticated
  useEffect(() => {
    if (isRealMode("opportunities") && !authLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(`/opportunities/${opportunityId}`)}`);
    }
  }, [authLoading, isAuthenticated, opportunityId, router]);

  // Demo logged-in state (defaults to false for public view, toggleable for demo inspection)
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    try {
      const demoAuth = localStorage.getItem("vismaya_demo_logged_in");
      if (demoAuth === "true") {
        setIsLoggedIn(true);
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const toggleDemoLogin = () => {
    const nextState = !isLoggedIn;
    setIsLoggedIn(nextState);
    try {
      localStorage.setItem("vismaya_demo_logged_in", nextState ? "true" : "false");
    } catch (e) {
      console.warn(e);
    }
  };

  const opportunity = getOpportunity(opportunityId);
  const project = opportunity ? getProject(opportunity.projectId) : null;

  const now = new Date().getTime();
  const isAvailable =
    opportunity &&
    opportunity.status === "Published" &&
    new Date(opportunity.deadline).getTime() >= now;

  if (!isHydrated) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", width: "100%", backgroundColor: "var(--bg-primary)" }}>
        <PublicNav />
        <section style={{ paddingTop: "clamp(28px, 4vw, 48px)", paddingBottom: "40px", backgroundColor: "var(--bg-alt)" }}>
          <div className="public-container">
            <Skeleton width="220px" height="36px" />
          </div>
        </section>
        <main className="public-section" style={{ flex: 1, backgroundColor: "var(--bg-primary)" }}>
          <div className="public-container">
            <Skeleton width="100%" height="280px" />
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  if (!opportunity || !isAvailable) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", width: "100%", backgroundColor: "var(--bg-primary)" }}>
        <PublicNav />
        <section style={{ paddingTop: "clamp(28px, 4vw, 48px)", paddingBottom: "40px", backgroundColor: "var(--bg-alt)", borderBottom: "1px solid var(--border-color)" }}>
          <div className="public-container">
            <h1 style={{ fontFamily: "var(--font-heading), Georgia, serif", fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 400, color: "var(--text-primary)", margin: 0 }}>
              Opportunity Closed or Unavailable
            </h1>
          </div>
        </section>
        <main className="public-section" style={{ flex: 1, backgroundColor: "var(--bg-primary)", display: "flex", alignItems: "center" }}>
          <div className="public-container" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <AlertCircle size={48} style={{ color: "var(--text-secondary)" }} />
            <p style={{ color: "var(--text-secondary)", fontSize: "15px", maxWidth: "500px", margin: 0, lineHeight: "24px" }}>
              This opportunity has expired, closed, or is no longer accepting public submissions.
            </p>
            <Link href="/opportunities" className="btn-primary" style={{ marginTop: "12px" }}>
              <ArrowLeft size={16} />
              <span>Browse Active Opportunities</span>
            </Link>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const primaryRole = opportunity.roles?.[0];
  const roleTitle = primaryRole ? primaryRole.roleName : "Audition Candidate";
  const roleDetails = primaryRole
    ? `${primaryRole.gender || "Any"}, ${primaryRole.ageRange || "All ages"}`
    : "Open to all verified applicants";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", width: "100%", backgroundColor: "var(--bg-primary)" }}>
      <PublicNav />

      {/* 1. TOP HEADER */}
      <section
        style={{
          position: "relative",
          paddingTop: "clamp(28px, 4vw, 48px)",
          paddingBottom: "clamp(40px, 5vh, 56px)",
          backgroundColor: "var(--bg-alt)",
          borderBottom: "1px solid var(--border-color)",
          overflow: "hidden",
        }}
      >
        <div className="public-container" style={{ position: "relative", zIndex: 5 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
            <Link
              href="/opportunities"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--text-primary)",
                fontWeight: "600",
                fontSize: "13px",
                textDecoration: "none",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              <ArrowLeft size={15} />
              <span>Back to Casting Calls</span>
            </Link>

            {/* Demo State Switch Button */}
            <button
              onClick={toggleDemoLogin}
              style={{
                fontSize: "11px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "8px 16px",
                borderRadius: "999px",
                backgroundColor: isLoggedIn ? "var(--bg-surface)" : "var(--bg-primary)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.18s ease",
              }}
            >
              {isLoggedIn ? <Unlock size={13} /> : <Lock size={13} />}
              <span>Demo View: {isLoggedIn ? "Logged In Artist" : "Guest (Locked Sides)"} (Click to Toggle)</span>
            </button>
          </div>

          <div style={{ maxWidth: "860px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(119, 121, 112, 0.12)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                  fontSize: "11px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {opportunity.opportunityType}
              </span>

              {project && (
                <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                  Project: <strong style={{ color: "var(--text-primary)" }}>{project.title}</strong>
                </span>
              )}
            </div>

            <h1
              style={{
                fontFamily: "var(--font-heading), Georgia, serif",
                fontSize: "clamp(30px, 4.5vw, 48px)",
                fontWeight: 400,
                color: "var(--text-primary)",
                lineHeight: 1.15,
                margin: "4px 0 0 0",
              }}
            >
              {opportunity.title}
            </h1>
          </div>
        </div>
      </section>

      {/* 2. MAIN CONTENT */}
      <section className="public-section" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="public-container" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Overview Glass Card */}
          <div
            className="card-surface"
            style={{
              borderRadius: "20px",
              padding: "clamp(24px, 4vw, 36px)",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            <div>
              <div className="eyebrow" style={{ marginBottom: "10px" }}>
                <span>Casting Overview</span>
              </div>
              <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: "26px", margin: 0, maxWidth: "900px" }}>
                {opportunity.summary || "Verified opportunity brief published live on the Vismaya Casting Network."}
              </p>
            </div>

            {/* Public Fields Grid: Role, Location, Deadline, Remuneration */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                padding: "20px",
                backgroundColor: "var(--bg-alt)",
                borderRadius: "14px",
                border: "1px solid var(--border-color)",
              }}
            >
              <div>
                <span style={specLabelStyle}>Primary Role</span>
                <span style={specValueStyle}>{roleTitle}</span>
              </div>

              <div>
                <span style={specLabelStyle}>Location</span>
                <span style={specValueStyle}>{opportunity.location || "Mumbai, India"}</span>
              </div>

              <div>
                <span style={specLabelStyle}>Application Deadline</span>
                <span style={specValueStyle}>{formatDate(opportunity.deadline)}</span>
              </div>

              <div>
                <span style={specLabelStyle}>Verified Remuneration</span>
                <span style={{ ...specValueStyle, color: "var(--text-primary)" }}>
                  {opportunity.remuneration || "Industry Standard"}
                </span>
              </div>
            </div>
          </div>

          {/* Locked vs Unlocked Brief Section */}
          <div
            className="card-surface"
            style={{
              borderRadius: "20px",
              padding: "clamp(24px, 4vw, 36px)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div className="eyebrow">
                <span>Audition Brief &amp; Character Sides</span>
              </div>

              {isLoggedIn ? (
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: "999px",
                    backgroundColor: "#e8f5e9",
                    border: "1px solid #c8e6c9",
                    color: "#2e7d32",
                    fontSize: "11px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Unlock size={13} />
                  <span>Full Access Unlocked</span>
                </span>
              ) : (
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: "999px",
                    backgroundColor: "rgba(119, 121, 112, 0.12)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                    fontSize: "11px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Lock size={13} />
                  <span>Sign In Required</span>
                </span>
              )}
            </div>

            {/* Content Area (Blurred if logged out) */}
            <div
              style={{
                filter: isLoggedIn ? "none" : "blur(5px)",
                userSelect: isLoggedIn ? "auto" : "none",
                pointerEvents: isLoggedIn ? "auto" : "none",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
              }}
            >
              <div>
                <h4 style={{ fontFamily: "var(--font-heading), Georgia, serif", fontSize: "18px", color: "var(--text-primary)", marginBottom: "8px" }}>
                  Character Breakdown &amp; Directing Notes
                </h4>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "24px", margin: 0 }}>
                  The candidate should portray a charismatic yet enigmatic protagonist who navigates high-stakes corporate espionage. We are looking for strong emotional range, expressive eyes, and crisp dialogue delivery in Hindi and English.
                </p>
              </div>

              <div>
                <h4 style={{ fontFamily: "var(--font-heading), Georgia, serif", fontSize: "18px", color: "var(--text-primary)", marginBottom: "8px" }}>
                  Audition Script / Sides Excerpt
                </h4>
                <div
                  style={{
                    padding: "16px 20px",
                    backgroundColor: "var(--bg-alt)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "12px",
                    fontSize: "13px",
                    lineHeight: "22px",
                    color: "var(--text-primary)",
                    fontFamily: "monospace",
                  }}
                >
                  [SCENE 14 - INTERIOR - BOARDROOM - NIGHT]<br />
                  (RAHUL paces slowly near the glass wall overlooking the city lights.)<br /><br />
                  RAHUL: &quot;You think this is about the money? It never was. Look out that window. Everyone is waiting for someone to take the blame. Today, it won&apos;t be us.&quot;
                </div>
              </div>

              {isLoggedIn && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                  <Link href={`/talent/opportunities/${opportunity.id}`} className="btn-primary">
                    <span>Submit Application &amp; Self-Tape</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              )}
            </div>

            {/* Login Overlay Box for Logged-Out Users */}
            {!isLoggedIn && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "24px",
                  background: "rgba(41, 44, 41, 0.40)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <div
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "20px",
                    padding: "32px",
                    maxWidth: "480px",
                    textAlign: "center",
                    boxShadow: "var(--shadow-lg)",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      backgroundColor: "var(--bg-alt)",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px auto",
                    }}
                  >
                    <Lock size={22} />
                  </div>

                  <h3
                    style={{
                      fontFamily: "var(--font-heading), Georgia, serif",
                      fontSize: "22px",
                      fontWeight: 400,
                      color: "var(--text-primary)",
                      margin: "0 0 8px 0",
                    }}
                  >
                    Sign In to Access Audition Brief
                  </h3>

                  <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "22px", margin: "0 0 24px 0" }}>
                    Verified casting sides, script excerpts, and self-tape submission portals are reserved for registered talent profiles.
                  </p>

                  <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                    <Link href="/login" className="btn-primary">
                      <span>Sign In</span>
                      <ArrowRight size={14} />
                    </Link>
                    <Link href="/register" className="btn-secondary">
                      <span>Register Free</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

const specLabelStyle = {
  display: "block",
  fontSize: "11px",
  fontWeight: "700",
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.10em",
  marginBottom: "4px",
};

const specValueStyle = {
  display: "block",
  fontSize: "15px",
  fontWeight: "600",
  color: "var(--text-primary)",
};
