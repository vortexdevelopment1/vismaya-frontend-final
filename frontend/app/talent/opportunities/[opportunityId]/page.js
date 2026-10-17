"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Banknote,
  Users,
  Clock,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Send,
  FileText,
  Video,
  Info,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import Skeleton from "@/components/shared/Skeleton";
import OpportunityApplyModal from "@/components/talent/OpportunityApplyModal";
import { useWorkflow } from "@/lib/shared/workflowStore";
import { useTalent } from "@/lib/talent/TalentContext";
import { useAuth } from "@/context/AuthContext";
import { isRealMode } from "@/lib/api/config";

export default function TalentOpportunityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { opportunityId } = params;

  const { user } = useAuth();
  const { getOpportunity, getProject, organizations, applications, isHydrated } = useWorkflow();
  const { profile } = useTalent();

  const [showApplyModal, setShowApplyModal] = useState(false);

  const opportunity = getOpportunity(opportunityId);
  const project = opportunity ? getProject(opportunity.projectId) : null;
  const organization = opportunity
    ? organizations.find((o) => o.id === opportunity.orgId)
    : null;

  const currentTalentId = user?.id || user?._id || profile?.id || profile?._id || profile?.userId || (!isRealMode("talent") ? "tal-904" : "");
  const userApplication = applications.find(
    (a) => a.opportunityId === opportunityId && (
      a.talentId === currentTalentId ||
      a.talentId?._id === currentTalentId ||
      a.talentId?.id === currentTalentId ||
      a.userId === currentTalentId
    )
  );
  const isApplied = !!userApplication;

  // Deadline calculation
  const now = new Date().getTime();
  const deadlineTime = opportunity ? new Date(opportunity.deadline).getTime() : 0;
  const diffDays = Math.ceil((deadlineTime - now) / (1000 * 60 * 60 * 24));
  const isExpired = diffDays < 0;
  const isUrgent = diffDays >= 0 && diffDays <= 3;

  if (!isHydrated) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <Skeleton width="200px" height="36px" borderRadius="12px" />
        <Skeleton width="100%" height="260px" borderRadius="22px" />
        <Skeleton width="100%" height="400px" borderRadius="22px" />
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div
        className="card-surface"
        style={{
          padding: "48px 32px",
          textAlign: "center",
          backgroundColor: "var(--bg-surface)",
          borderRadius: "6px",
          border: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <AlertCircle size={44} style={{ color: "var(--warning)" }} />
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.3rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
          Opportunity Not Found
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "460px", margin: 0 }}>
          The requested opportunity brief may have been archived, completed, or is no longer available.
        </p>
        <Link href="/talent/opportunities" className="btn-primary" style={{ padding: "10px 24px", borderRadius: "4px" }}>
          <ArrowLeft size={16} />
          <span>Back to Live Opportunities</span>
        </Link>
      </div>
    );
  }

  // Eligibility Match Guidance Calculations (guidance only)
  const talentAge = parseInt(profile.personal.age) || 22;
  const talentGender = profile.personal.gender || "Female";
  const talentCity = profile.personal.city || "Mumbai";
  const talentLanguages = profile.languages || ["Hindi", "English", "Marathi"];

  const elAgeMin = opportunity.eligibility?.ageMin || 18;
  const elAgeMax = opportunity.eligibility?.ageMax || 60;
  const isAgeMatch = talentAge >= elAgeMin && talentAge <= elAgeMax;

  const elGender = opportunity.eligibility?.gender || "Any";
  const isGenderMatch = elGender === "Any" || elGender.toLowerCase() === talentGender.toLowerCase();

  const elLanguages = opportunity.eligibility?.languages || ["Hindi"];
  const isLangMatch = elLanguages.some((l) =>
    talentLanguages.some((tl) => tl.toLowerCase().includes(l.toLowerCase()))
  );

  const elLocation = opportunity.eligibility?.location || opportunity.location || "Pan-India";
  const isLocMatch =
    elLocation.toLowerCase().includes("pan-india") ||
    elLocation.toLowerCase().includes(talentCity.toLowerCase()) ||
    talentCity.toLowerCase().includes(elLocation.toLowerCase());

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Back Navigation Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <Link
          href="/talent/opportunities"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "var(--gold)",
            fontWeight: "700",
            fontSize: "0.875rem",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Opportunities</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isUrgent && (
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: "700",
                padding: "4px 12px",
                borderRadius: "4px",
                backgroundColor: "var(--bg-alt)",
                color: "var(--danger)",
                border: "1px solid var(--border-color)",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Clock size={12} />
              {diffDays === 0 ? "Closes Today" : diffDays === 1 ? "1 Day Left" : `Closes in ${diffDays} days`}
            </span>
          )}

          <StatusBadge status={opportunity.status} size="sm" />
        </div>
      </div>

      {/* Main Opportunity Hero Header Card */}
      <div
        className="card-surface"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          borderRadius: "6px",
          padding: "32px",
          boxShadow: "var(--shadow-card)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: "700",
                padding: "4px 12px",
                borderRadius: "4px",
                backgroundColor: "var(--bg-alt)",
                color: "var(--gold)",
                border: "1px solid var(--border-color)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {opportunity.opportunityType}
            </span>

            {project && (
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: "600" }}>
                Project: <strong style={{ color: "var(--text-primary)" }}>{project.title}</strong>
              </span>
            )}

            {organization && (
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                &bull; Org: <strong style={{ color: "var(--gold)" }}>{organization.name}</strong>
              </span>
            )}
          </div>

          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "1.85rem",
              fontWeight: "700",
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {opportunity.title}
          </h1>

          <p style={{ fontSize: "0.975rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0, maxWidth: "900px" }}>
            {opportunity.summary}
          </p>
        </div>

        {/* Quick Highlights Bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "14px",
            padding: "16px 20px",
            backgroundColor: "var(--bg-alt)",
            borderRadius: "6px",
            border: "1px solid var(--border-color)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <MapPin size={20} style={{ color: "var(--gold)", flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>Location</span>
              <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "var(--text-primary)" }}>{opportunity.location || "Mumbai"}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Banknote size={20} style={{ color: "var(--gold)", flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>Remuneration</span>
              <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "var(--text-primary)" }}>{opportunity.remuneration || "Negotiable"}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Calendar size={20} style={{ color: "var(--gold)", flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>Application Deadline</span>
              <span style={{ fontSize: "0.875rem", fontWeight: "700", color: isUrgent ? "var(--danger)" : "var(--text-primary)" }}>
                {opportunity.deadline}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Users size={20} style={{ color: "var(--gold)", flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>Open Roles</span>
              <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "var(--text-primary)" }}>
                {opportunity.roles ? opportunity.roles.length : 1} Character Role{opportunity.roles?.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Action Button Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            paddingTop: "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldCheck size={18} style={{ color: "var(--gold)" }} />
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Verified opportunity by Vismaya Casting Desk. Application submissions are profile-only.
            </span>
          </div>

          {isApplied ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                disabled
                style={{
                  padding: "10px 24px",
                  borderRadius: "4px",
                  backgroundColor: "#EFF2EC",
                  color: "var(--text-primary)",
                  border: "1px solid #D1DCC8",
                  fontWeight: "700",
                  fontSize: "0.9rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "default",
                }}
              >
                <CheckCircle2 size={18} style={{ color: "var(--gold)" }} />
                <span>Applied ({userApplication.status})</span>
              </button>
              <Link href="/talent/applications" className="btn-secondary" style={{ padding: "10px 20px", fontSize: "0.875rem", borderRadius: "4px" }}>
                <span>Track Application</span>
              </Link>
            </div>
          ) : isExpired ? (
            <button
              disabled
              style={{
                padding: "10px 24px",
                borderRadius: "4px",
                backgroundColor: "var(--bg-alt)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-color)",
                fontWeight: "700",
                fontSize: "0.9rem",
                cursor: "not-allowed",
              }}
            >
              Application Deadline Passed
            </button>
          ) : (
            <button
              onClick={() => setShowApplyModal(true)}
              className="btn-primary"
              style={{ padding: "10px 28px", fontSize: "0.95rem", borderRadius: "4px" }}
            >
              <span>Apply Now</span>
              <Send size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Eligibility Match Guidance Section */}
      <div
        className="card-surface"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          borderRadius: "6px",
          padding: "clamp(16px, 3vw, 26px) clamp(16px, 3.5vw, 30px)",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={18} style={{ color: "var(--gold)" }} />
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                Profile Eligibility Guidance
              </h2>
            </div>
            <span style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginTop: "4px", display: "block" }}>
              Guidance match analysis against your verified artist profile ({profile.personal.fullName}). Criteria do not block application submission.
            </span>
          </div>

          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: "700",
              padding: "4px 12px",
              borderRadius: "4px",
              backgroundColor: "var(--bg-alt)",
              color: "var(--gold)",
              border: "1px solid var(--border-color)",
            }}
          >
            Guidance Only
          </span>
        </div>

        {/* 4 Eligibility Guidance Chips Grid */}
        <div className="talent-stat-grid">
          {/* Age Chip */}
          <div
            style={{
              backgroundColor: "var(--bg-alt)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase" }}>Age Criteria</span>
              {isAgeMatch ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "var(--gold)", fontWeight: "700" }}>
                  <CheckCircle2 size={13} /> Match
                </span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "var(--warning)", fontWeight: "700" }}>
                  <Info size={13} /> Guidance
                </span>
              )}
            </div>
            <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "var(--text-primary)" }}>
              {elAgeMin} - {elAgeMax} years
            </span>
            <span style={{ fontSize: "0.785rem", color: "var(--text-secondary)" }}>
              Your profile: <strong>{talentAge} yrs</strong>
            </span>
          </div>

          {/* Gender Chip */}
          <div
            style={{
              backgroundColor: "var(--bg-alt)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase" }}>Gender</span>
              {isGenderMatch ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "var(--gold)", fontWeight: "700" }}>
                  <CheckCircle2 size={13} /> Match
                </span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "var(--warning)", fontWeight: "700" }}>
                  <Info size={13} /> Guidance
                </span>
              )}
            </div>
            <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "var(--text-primary)" }}>
              {elGender}
            </span>
            <span style={{ fontSize: "0.785rem", color: "var(--text-secondary)" }}>
              Your profile: <strong>{talentGender}</strong>
            </span>
          </div>

          {/* Language Chip */}
          <div
            style={{
              backgroundColor: "var(--bg-alt)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase" }}>Language</span>
              {isLangMatch ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "var(--gold)", fontWeight: "700" }}>
                  <CheckCircle2 size={13} /> Match
                </span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "var(--warning)", fontWeight: "700" }}>
                  <Info size={13} /> Guidance
                </span>
              )}
            </div>
            <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "var(--text-primary)" }}>
              {Array.isArray(elLanguages) ? elLanguages.join(", ") : "Hindi, English"}
            </span>
            <span style={{ fontSize: "0.785rem", color: "var(--text-secondary)" }}>
              Your profile: <strong>{Array.isArray(talentLanguages) ? talentLanguages.slice(0, 2).join(", ") : "Hindi"}</strong>
            </span>
          </div>

          {/* Location Chip */}
          <div
            style={{
              backgroundColor: "var(--bg-alt)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase" }}>Location Match</span>
              {isLocMatch ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "var(--gold)", fontWeight: "700" }}>
                  <CheckCircle2 size={13} /> Match
                </span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "var(--warning)", fontWeight: "700" }}>
                  <Info size={13} /> Guidance
                </span>
              )}
            </div>
            <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "var(--text-primary)" }}>
              {elLocation}
            </span>
            <span style={{ fontSize: "0.785rem", color: "var(--text-secondary)" }}>
              Your base: <strong>{talentCity}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Split: Left Column (Full Brief & Roles) & Right Column (Project & Organization Info) */}
      <div className="talent-split-grid">
        {/* Left Column: Full Brief and Roles */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Full Brief Section */}
          <div
            className="card-surface"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              padding: "clamp(18px, 3vw, 26px) clamp(18px, 3.5vw, 28px)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FileText size={18} style={{ color: "var(--gold)" }} />
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                Full Creative Brief &amp; Synopsis
              </h2>
            </div>

            <p style={{ color: "var(--text-secondary)", fontSize: "0.925rem", lineHeight: 1.7, margin: 0 }}>
              {opportunity.fullBrief || opportunity.summary || "Complete brief details provided for verified talent submissions."}
            </p>
          </div>

          {/* Character Roles Breakdown */}
          <div
            className="card-surface"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              padding: "clamp(18px, 3vw, 26px) clamp(18px, 3.5vw, 28px)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                Character Roles ({opportunity.roles ? opportunity.roles.length : 1})
              </h2>
              <span style={{ fontSize: "0.785rem", color: "var(--text-muted)" }}>
                Verified Requirement
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {(opportunity.roles || []).map((role, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "var(--bg-alt)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                    <span style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-primary)" }}>
                      {role.roleName}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: "700",
                          padding: "3px 10px",
                          borderRadius: "4px",
                          backgroundColor: "var(--bg-surface)",
                          color: "var(--gold)",
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        {role.gender || "Any"} &bull; {role.ageRange || "All Ages"}
                      </span>
                      {role.count && (
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "600" }}>
                          ({role.count} opening{role.count > 1 ? "s" : ""})
                        </span>
                      )}
                    </div>
                  </div>

                  {role.description && (
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5, margin: 0 }}>
                      {role.description}
                    </p>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.825rem", paddingTop: "6px", borderTop: "1px solid var(--border-color)" }}>
                    {role.skills && (
                      <div>
                        <span style={{ color: "var(--text-muted)", fontWeight: "600" }}>Key Skills: </span>
                        <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>
                          {Array.isArray(role.skills) ? role.skills.join(", ") : role.skills}
                        </span>
                      </div>
                    )}
                    {role.language && (
                      <div>
                        <span style={{ color: "var(--text-muted)", fontWeight: "600" }}>Dialogue: </span>
                        <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>{role.language}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Project & Organization Overview */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Project Details */}
          {project && (
            <div
              className="card-surface"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                padding: "clamp(18px, 3vw, 26px) clamp(18px, 3.5vw, 28px)",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Building2 size={18} style={{ color: "var(--gold)" }} />
                <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                  Project Information
                </h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-primary)" }}>
                  {project.title}
                </span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Type: <strong style={{ color: "var(--gold)" }}>{project.type}</strong> &bull; Status: <strong style={{ color: "var(--text-primary)" }}>{project.status}</strong>
                </span>
              </div>

              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.55, margin: 0 }}>
                {project.description}
              </p>
            </div>
          )}

          {/* Organization Details */}
          {organization && (
            <div
              className="card-surface"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                padding: "clamp(18px, 3vw, 26px) clamp(18px, 3.5vw, 28px)",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.06em" }}>
                Casting Organization
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                {organization.avatar && (
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "6px",
                      backgroundImage: `url(${organization.avatar})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      border: "1px solid var(--border-color)",
                      flexShrink: 0,
                    }}
                  />
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-primary)" }}>
                    {organization.name}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    {organization.type} &bull; Verified Partner
                  </span>
                </div>
              </div>

              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>
                Submissions are screened directly by {organization.name}&apos;s verified casting team on Vismaya.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sticky Action Bar for One-Tap Apply (< 768px) */}
      {!isApplied && !isExpired && (
        <div className="talent-sticky-action-bar">
          <button
            onClick={() => setShowApplyModal(true)}
            className="btn-primary"
            style={{ width: "100%", minHeight: "44px", borderRadius: "12px", fontSize: "0.95rem" }}
          >
            <span>Apply Now</span>
            <Send size={16} />
          </button>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && (
        <OpportunityApplyModal
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
          opportunity={opportunity}
          project={project}
        />
      )}
    </div>
  );
}
