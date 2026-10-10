"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Users,
  ArrowLeft,
  MapPin,
  Calendar,
  ShieldCheck,
  Video,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Lock,
  Phone,
  Mail,
  User,
  Film,
  Award,
  BookOpen,
  MessageSquare,
  Play,
  Share2,
  Check,
  X,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useWorkflow } from "@/lib/shared/workflowStore";
import PageHeader from "@/components/shared/PageHeader";
import Modal from "@/components/shared/Modal";
import VideoPlayer from "@/components/shared/VideoPlayer";

// Constant to hide talent phone and email directly as per platform requirement
const HIDE_TALENT_CONTACT = true;

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = params?.applicationId;
  const fromParam = searchParams?.get("from");
  const oppParam = searchParams?.get("opp");

  const {
    applications,
    opportunities,
    projects,
    auditions,
    openApplication,
    setApplicationStatus,
    requestAudition,
    isHydrated,
  } = useWorkflow();

  const application = useMemo(
    () => applications.find((a) => a.id === applicationId),
    [applications, applicationId]
  );

  const effectiveOppId = oppParam || application?.opportunityId;

  const opportunity = useMemo(
    () => (effectiveOppId ? opportunities.find((o) => o.id === effectiveOppId) : null),
    [opportunities, effectiveOppId]
  );

  const project = useMemo(
    () => (opportunity ? projects.find((p) => p.id === opportunity.projectId) : null),
    [projects, opportunity]
  );

  const appAuditions = useMemo(
    () => auditions.filter((aud) => aud.applicationId === applicationId),
    [auditions, applicationId]
  );

  const activeAudition = appAuditions[0];

  // Resolve origin context (from query param -> sessionStorage -> fallback)
  const [origin, setOrigin] = useState("dashboard");

  useEffect(() => {
    let resolved = fromParam;
    if (!resolved && typeof window !== "undefined") {
      resolved = sessionStorage.getItem("orgProfileOrigin");
    }
    if (!resolved) {
      resolved = opportunity || oppParam || application?.opportunityId ? "applicants" : "dashboard";
    }
    setOrigin(resolved);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("orgProfileOrigin", resolved);
      if (opportunity?.id || oppParam || application?.opportunityId) {
        sessionStorage.setItem("orgProfileOppId", opportunity?.id || oppParam || application?.opportunityId);
      }
    }
  }, [fromParam, oppParam, opportunity, application?.opportunityId]);

  // Auto-move status from "Applied" to "Under Review" upon opening
  useEffect(() => {
    if (application && application.status === "Applied") {
      openApplication(application.id);
    }
  }, [application?.id, application?.status, openApplication]);

  // Modals state
  const [isAuditionModalOpen, setIsAuditionModalOpen] = useState(false);
  const [auditionType, setAuditionType] = useState("Audition"); // "Audition" | "Interview"
  const [auditionNote, setAuditionNote] = useState("");

  const [isNotSelectedModalOpen, setIsNotSelectedModalOpen] = useState(false);
  const [notSelectedReason, setNotSelectedReason] = useState("");

  const [isSelectedModalOpen, setIsSelectedModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState("");

  // Action Handlers
  const handleShortlist = () => {
    if (!application) return;
    setApplicationStatus(
      application.id,
      "Shortlisted",
      "Shortlisted for further audition and screening rounds.",
      "Zee Films"
    );
  };

  const handleOpenAuditionModal = () => {
    setAuditionType("Audition");
    setAuditionNote(
      opportunity
        ? `Please record a 60-90 second self-tape for '${application?.roleApplied || opportunity.title}'. Deliver the lines with natural emotional intensity.`
        : ""
    );
    setIsAuditionModalOpen(true);
  };

  const handleSubmitAuditionRequest = (e) => {
    e.preventDefault();
    if (!application) return;
    requestAudition({
      applicationId: application.id,
      type: auditionType,
      note: auditionNote,
    });
    setIsAuditionModalOpen(false);
  };

  const handleConfirmNotSelected = (e) => {
    e.preventDefault();
    if (!application) return;
    setApplicationStatus(
      application.id,
      "Not Selected",
      notSelectedReason || "Candidate not selected for this specific role.",
      "Zee Films"
    );
    setIsNotSelectedModalOpen(false);
  };

  const handleConfirmSelected = (e) => {
    e.preventDefault();
    if (!application) return;
    setApplicationStatus(
      application.id,
      "Selected",
      selectedNote || "Final selection confirmed for the casting role.",
      "Zee Films"
    );
    setIsSelectedModalOpen(false);
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "—";
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Determine back destination and label
  const { backLabel, backRoute } = useMemo(() => {
    if (origin === "shortlist") {
      return {
        backLabel: "Back to Shortlist & Auditions",
        backRoute: "/recruiter/shortlist-auditions",
      };
    }
    if (origin === "applicants") {
      return {
        backLabel: "Back to Applicants",
        backRoute: opportunity
          ? `/recruiter/opportunities/${opportunity.id}/applicants`
          : "/recruiter/opportunities",
      };
    }
    if (origin === "notifications") {
      return {
        backLabel: "Back to Notifications",
        backRoute: "/recruiter/notifications",
      };
    }
    return {
      backLabel: "Back to Dashboard",
      backRoute: "/recruiter/dashboard",
    };
  }, [origin, opportunity]);

  const handleBackNavigation = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(backRoute);
    }
  };

  // Determine dynamic breadcrumbs based on origin
  const breadcrumbs = useMemo(() => {
    const candidateName = application?.talentName || "Applicant Profile";

    if (origin === "shortlist") {
      return [
        { label: "Dashboard", href: "/recruiter/dashboard" },
        { label: "Shortlist & Auditions", href: "/recruiter/shortlist-auditions" },
        { label: candidateName },
      ];
    }
    if (origin === "applicants") {
      return [
        { label: "Dashboard", href: "/recruiter/dashboard" },
        { label: "My opportunities", href: "/recruiter/opportunities" },
        ...(opportunity
          ? [
              {
                label: opportunity.title,
                href: `/recruiter/opportunities/${opportunity.id}/applicants`,
              },
            ]
          : []),
        {
          label: "Applicants",
          href: opportunity
            ? `/recruiter/opportunities/${opportunity.id}/applicants`
            : "/recruiter/opportunities",
        },
        { label: candidateName },
      ];
    }
    if (origin === "notifications") {
      return [
        { label: "Dashboard", href: "/recruiter/dashboard" },
        { label: "Notifications", href: "/recruiter/notifications" },
        { label: candidateName },
      ];
    }
    return [
      { label: "Dashboard", href: "/recruiter/dashboard" },
      { label: candidateName },
    ];
  }, [origin, opportunity, application?.talentName]);

  if (!isHydrated) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ height: "48px", background: "rgba(255, 255, 255, 0.06)", borderRadius: "12px", width: "40%" }} />
        <div style={{ height: "400px", background: "rgba(255, 255, 255, 0.06)", borderRadius: "16px" }} />
      </div>
    );
  }

  if (!application) {
    return (
      <div
        style={{
          backgroundColor: "var(--bg-glass)",
          border: "1px solid var(--border-glass)",
          borderRadius: "16px",
          padding: "48px 24px",
          textAlign: "center",
          maxWidth: "600px",
          margin: "40px auto",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(16px)",
        }}
      >
        <AlertCircle size={48} style={{ color: "var(--gold)", marginBottom: "16px" }} />
        <h2 style={{ fontSize: "1.25rem", color: "#eceaf5", marginBottom: "8px" }}>
          Application Not Found
        </h2>
        <p style={{ color: "#a3acc2", fontSize: "0.9rem", marginBottom: "24px" }}>
          The requested application could not be found or has been removed.
        </p>
        <button
          type="button"
          onClick={handleBackNavigation}
          className="btn-secondary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "0 18px",
            height: "40px",
            fontSize: "13px",
            fontWeight: "600",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={16} /> {backLabel}
        </button>
      </div>
    );
  }

  const prof = application.talentProfile || {};
  const isFinalSelected = application.status === "Selected";
  const isFinalNotSelected = application.status === "Not Selected";
  const isShortlisted = application.status === "Shortlisted";
  const isWithdrawn = application.status === "Withdrawn";

  const inputStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    borderRadius: "12px",
    padding: "10px 14px",
    color: "#eceaf5",
    fontSize: "0.875rem",
    outline: "none",
    colorScheme: "dark",
    width: "100%",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", minWidth: 0 }}>
      {/* Back text button above page title */}
      <div>
        <button
          type="button"
          onClick={handleBackNavigation}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255, 255, 255, 0.04)",
            color: "#a3acc2",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "10px",
            height: "40px",
            minHeight: "40px",
            padding: "0 16px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            fontFamily: "var(--font-body), 'Inter', sans-serif",
            transition: "all 0.18s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
            e.currentTarget.style.color = "#eceaf5";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.24)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
            e.currentTarget.style.color = "#a3acc2";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
          }}
        >
          <ArrowLeft size={16} />
          <span>{backLabel}</span>
        </button>
      </div>

      {/* Navigation Header */}
      <PageHeader
        title={application.talentName || "Talent Profile"}
        subtitle={`Applied for ${application.roleApplied} • ${opportunity?.title || "Opportunity"}`}
        breadcrumbs={breadcrumbs}
      />

      {/* Main Profile Header Card */}
      <div
        style={{
          backgroundColor: "var(--bg-glass)",
          border: "1px solid var(--border-glass)",
          borderRadius: "16px",
          padding: "28px",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
          }}
        >
          {/* Talent Header Summary */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {prof.avatar ? (
              <img
                src={prof.avatar}
                alt={application.talentName}
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "16px",
                  objectFit: "cover",
                  border: "2px solid rgba(255, 188, 0, 0.4)",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.3)",
                }}
              />
            ) : (
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, #0f1626 0%, #070b12 100%)",
                  color: "var(--gold)",
                  border: "1px solid rgba(255, 188, 0, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                  fontWeight: "700",
                }}
              >
                {(application.talentName || "T")[0]}
              </div>
            )}

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h1
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "800",
                    color: "#eceaf5",
                    margin: 0,
                  }}
                >
                  {application.talentName}
                </h1>
                {prof.stageName && prof.stageName !== application.talentName && (
                  <span style={{ fontSize: "0.9rem", color: "#a3acc2", fontWeight: "600" }}>
                    ({prof.stageName})
                  </span>
                )}
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    padding: "4px 12px",
                    borderRadius: "10px",
                    backgroundColor:
                      application.status === "Selected"
                        ? "rgba(52, 211, 153, 0.15)"
                        : application.status === "Shortlisted"
                        ? "rgba(255, 188, 0, 0.15)"
                        : application.status === "Not Selected"
                        ? "rgba(255, 107, 107, 0.15)"
                        : "rgba(255, 255, 255, 0.08)",
                    color:
                      application.status === "Selected"
                        ? "#34d399"
                        : application.status === "Shortlisted"
                        ? "var(--gold)"
                        : application.status === "Not Selected"
                        ? "#ff6b6b"
                        : "#eceaf5",
                    border: `1px solid ${
                      application.status === "Selected"
                        ? "rgba(52, 211, 153, 0.35)"
                        : application.status === "Shortlisted"
                        ? "rgba(255, 188, 0, 0.35)"
                        : application.status === "Not Selected"
                        ? "rgba(255, 107, 107, 0.35)"
                        : "rgba(255, 255, 255, 0.14)"
                    }`,
                  }}
                >
                  {application.status}
                </span>
              </div>

              <p style={{ fontSize: "0.95rem", color: "var(--gold)", fontWeight: "600", margin: "4px 0 6px 0" }}>
                Applied for: <span style={{ color: "#eceaf5" }}>{application.roleApplied}</span>
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", fontSize: "0.85rem", color: "#a3acc2" }}>
                <span>{prof.age ? `${prof.age} years old` : "Age specified"}</span>
                <span>•</span>
                <span>{prof.gender || "Gender unspecified"}</span>
                <span>•</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <MapPin size={13} style={{ color: "var(--gold)" }} /> {prof.city || "Mumbai"}
                </span>
                <span>•</span>
                <span>Applied {formatDate(application.appliedAt)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }} className="applicant-actions-toolbar">
            {!isFinalSelected && !isFinalNotSelected && !isWithdrawn && (
              <>
                {/* Shortlist Action */}
                {!isShortlisted && (
                  <button
                    type="button"
                    onClick={handleShortlist}
                    className="btn-secondary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "0 16px",
                      height: "36px",
                      fontSize: "13px",
                      fontWeight: "600",
                      borderRadius: "10px",
                    }}
                  >
                    <Sparkles size={15} style={{ color: "var(--gold)" }} />
                    <span>Shortlist</span>
                  </button>
                )}

                {/* Request Audition */}
                <button
                  type="button"
                  onClick={handleOpenAuditionModal}
                  className="btn-secondary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "0 16px",
                    height: "36px",
                    fontSize: "13px",
                    fontWeight: "600",
                    borderRadius: "10px",
                  }}
                >
                  <Video size={15} style={{ color: "var(--gold)" }} />
                  <span>Request audition</span>
                </button>

                {/* Select for Role (Only available when Shortlisted) */}
                {isShortlisted && (
                  <button
                    type="button"
                    onClick={() => setIsSelectedModalOpen(true)}
                    className="btn-primary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "0 18px",
                      height: "36px",
                      fontSize: "13px",
                      fontWeight: "600",
                      borderRadius: "10px",
                    }}
                  >
                    <CheckCircle2 size={15} />
                    <span>Select for role</span>
                  </button>
                )}

                {/* Not Selected Action (Danger outline button) */}
                <button
                  type="button"
                  onClick={() => setIsNotSelectedModalOpen(true)}
                  style={{
                    backgroundColor: "transparent",
                    color: "#ff6b6b",
                    border: "1px solid rgba(255, 107, 107, 0.4)",
                    borderRadius: "10px",
                    padding: "0 16px",
                    height: "36px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.15s ease",
                    fontFamily: "var(--font-body), 'Inter', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 107, 107, 0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <XCircle size={15} />
                  <span>Not selected</span>
                </button>
              </>
            )}

            {isFinalSelected && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 14px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(52, 211, 153, 0.15)",
                  border: "1px solid rgba(52, 211, 153, 0.35)",
                  color: "#34d399",
                  fontWeight: "700",
                  fontSize: "13px",
                }}
              >
                <CheckCircle2 size={16} />
                <span>Selected for role</span>
              </div>
            )}

            {isFinalNotSelected && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 14px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(255, 107, 107, 0.15)",
                  border: "1px solid rgba(255, 107, 107, 0.35)",
                  color: "#ff6b6b",
                  fontWeight: "700",
                  fontSize: "13px",
                }}
              >
                <XCircle size={16} />
                <span>Not selected</span>
              </div>
            )}
          </div>
        </div>

        {/* Contact Privacy Notice (Platform Compliance) */}
        {HIDE_TALENT_CONTACT && (
          <div
            style={{
              backgroundColor: "rgba(255, 188, 0, 0.08)",
              border: "1px solid rgba(255, 188, 0, 0.25)",
              borderRadius: "14px",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <ShieldCheck size={20} style={{ color: "var(--gold)", flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: "0.875rem", color: "#eceaf5" }}>
                  Contact is handled through Vismaya
                </strong>
                <p style={{ fontSize: "0.8rem", color: "#a3acc2", margin: "2px 0 0 0" }}>
                  Direct phone numbers and personal emails are managed exclusively by Vismaya Casting Desk to ensure secure communications, contract protection, and seamless scheduling.
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: "700",
                color: "var(--gold)",
                backgroundColor: "rgba(255, 188, 0, 0.15)",
                border: "1px solid rgba(255, 188, 0, 0.3)",
                padding: "4px 10px",
                borderRadius: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Lock size={12} /> Compliance Active
            </span>
          </div>
        )}
      </div>

      {/* Grid: Profile Details (1fr) + Auditions / History (360px) */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: "24px", width: "100%" }} className="applicant-profile-grid">
        {/* Left Column: Details, Physical, Skills, Bio, Portfolio */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Physical Attributes Card */}
          <div
            style={{
              backgroundColor: "var(--bg-glass)",
              border: "1px solid var(--border-glass)",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
              backdropFilter: "blur(16px)",
            }}
          >
            <h2
              style={{
                fontSize: "1.05rem",
                fontWeight: "700",
                color: "#eceaf5",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <User size={18} style={{ color: "var(--gold)" }} />
              <span>Physical Attributes & Specs</span>
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "14px",
              }}
            >
              <div style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", padding: "12px 14px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <span style={{ fontSize: "0.75rem", color: "#a3acc2", display: "block" }}>Height</span>
                <strong style={{ fontSize: "0.9rem", color: "#eceaf5" }}>5'9" (175 cm)</strong>
              </div>
              <div style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", padding: "12px 14px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <span style={{ fontSize: "0.75rem", color: "#a3acc2", display: "block" }}>Weight</span>
                <strong style={{ fontSize: "0.9rem", color: "#eceaf5" }}>64 kg</strong>
              </div>
              <div style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", padding: "12px 14px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <span style={{ fontSize: "0.75rem", color: "#a3acc2", display: "block" }}>Eye Color</span>
                <strong style={{ fontSize: "0.9rem", color: "#eceaf5" }}>Dark Brown</strong>
              </div>
              <div style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", padding: "12px 14px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <span style={{ fontSize: "0.75rem", color: "#a3acc2", display: "block" }}>Hair Color / Style</span>
                <strong style={{ fontSize: "0.9rem", color: "#eceaf5" }}>Black / Wavy</strong>
              </div>
              <div style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", padding: "12px 14px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <span style={{ fontSize: "0.75rem", color: "#a3acc2", display: "block" }}>Complexion</span>
                <strong style={{ fontSize: "0.9rem", color: "#eceaf5" }}>Fair / Wheatish</strong>
              </div>
              <div style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", padding: "12px 14px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <span style={{ fontSize: "0.75rem", color: "#a3acc2", display: "block" }}>Body Type</span>
                <strong style={{ fontSize: "0.9rem", color: "#eceaf5" }}>Athletic / Fit</strong>
              </div>
            </div>
          </div>

          {/* Skills & Languages */}
          <div
            style={{
              backgroundColor: "var(--bg-glass)",
              border: "1px solid var(--border-glass)",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
              backdropFilter: "blur(16px)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "1.05rem",
                  fontWeight: "700",
                  color: "#eceaf5",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Award size={18} style={{ color: "var(--gold)" }} />
                <span>Skills & Performance Talents</span>
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {(prof.skills && prof.skills.length > 0
                  ? prof.skills
                  : ["Screen Acting", "Method Acting", "Dialogue Modulation", "Martial Arts"]
                ).map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: "0.825rem",
                      fontWeight: "600",
                      padding: "6px 14px",
                      borderRadius: "10px",
                      backgroundColor: "rgba(255, 188, 0, 0.12)",
                      color: "var(--gold)",
                      border: "1px solid rgba(255, 188, 0, 0.28)",
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid rgba(255, 255, 255, 0.08)", margin: "4px 0" }} />

            <div>
              <h2
                style={{
                  fontSize: "1.05rem",
                  fontWeight: "700",
                  color: "#eceaf5",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <BookOpen size={18} style={{ color: "var(--gold)" }} />
                <span>Languages Spoken</span>
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {(prof.languages && prof.languages.length > 0
                  ? prof.languages
                  : ["Hindi (Native)", "English (Fluent)", "Marathi"]
                ).map((lang, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: "0.825rem",
                      fontWeight: "600",
                      padding: "6px 14px",
                      borderRadius: "10px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      color: "#eceaf5",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bio & Experience */}
          <div
            style={{
              backgroundColor: "var(--bg-glass)",
              border: "1px solid var(--border-glass)",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
              backdropFilter: "blur(16px)",
            }}
          >
            <h2
              style={{
                fontSize: "1.05rem",
                fontWeight: "700",
                color: "#eceaf5",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Film size={18} style={{ color: "var(--gold)" }} />
              <span>Bio & Professional Background</span>
            </h2>
            <p style={{ fontSize: "0.9rem", color: "#a3acc2", lineHeight: "1.6", margin: "0 0 16px 0" }}>
              {prof.bio ||
                "Screen actor with extensive theater training and camera experience across digital series and national commercials. Comfortable with multi-camera live sound workflows and intense character transformations."}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <strong style={{ fontSize: "0.825rem", color: "#eceaf5", letterSpacing: "0.02em" }}>
                Notable Past Work & Training
              </strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem", color: "#a3acc2" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <span style={{ color: "var(--gold)", fontWeight: "700" }}>•</span>
                  <span><strong style={{ color: "#eceaf5" }}>FTII Acting Intensive</strong> • 2-year diploma in screen performance (2024)</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <span style={{ color: "var(--gold)", fontWeight: "700" }}>•</span>
                  <span><strong style={{ color: "#eceaf5" }}>Prithvi Theatre Production</strong> • Lead protagonist in 14 stage performances</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <span style={{ color: "var(--gold)", fontWeight: "700" }}>•</span>
                  <span><strong style={{ color: "#eceaf5" }}>National TVC Campaign</strong> • Featured artist in Airtel 5G campaign</span>
                </div>
              </div>
            </div>
          </div>

          {/* Portfolio & Headshots Gallery */}
          <div
            style={{
              backgroundColor: "var(--bg-glass)",
              border: "1px solid var(--border-glass)",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
              backdropFilter: "blur(16px)",
            }}
          >
            <h2
              style={{
                fontSize: "1.05rem",
                fontWeight: "700",
                color: "#eceaf5",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Sparkles size={18} style={{ color: "var(--gold)" }} />
              <span>Portfolio & Verified Headshots</span>
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {[
                { title: "Frontal Headshot", tag: "Studio Neutral" },
                { title: "Profile / Side", tag: "Cinematic Lighting" },
                { title: "Full Body Shot", tag: "Natural Light" },
              ].map((shot, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "14px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      height: "140px",
                      background: idx === 0 && prof.avatar ? `url(${prof.avatar}) center/cover` : "linear-gradient(135deg, #131c31 0%, #070b12 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#eceaf5",
                      position: "relative",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        bottom: "8px",
                        left: "8px",
                        backgroundColor: "rgba(0,0,0,0.75)",
                        color: "#eceaf5",
                        fontSize: "0.685rem",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      {shot.tag}
                    </span>
                  </div>
                  <div style={{ padding: "8px 12px" }}>
                    <span style={{ fontSize: "0.775rem", fontWeight: "600", color: "#eceaf5" }}>
                      {shot.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Audition Status + Audit Trail */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Audition / Self-tape Section */}
          <div
            style={{
              backgroundColor: "var(--bg-glass)",
              border: "1px solid var(--border-glass)",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
              backdropFilter: "blur(16px)",
            }}
          >
            <h2
              style={{
                fontSize: "1.05rem",
                fontWeight: "700",
                color: "#eceaf5",
                marginBottom: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Video size={18} style={{ color: "var(--gold)" }} />
              <span>Audition & Self-Tape Status</span>
            </h2>

            {activeAudition ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "14px",
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#eceaf5" }}>
                      Type: {activeAudition.type}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        padding: "3px 10px",
                        borderRadius: "10px",
                        backgroundColor:
                          activeAudition.status === "Forwarded to Organization"
                            ? "rgba(52, 211, 153, 0.15)"
                            : activeAudition.status === "Self-tape Received"
                            ? "rgba(255, 188, 0, 0.15)"
                            : "rgba(255, 255, 255, 0.08)",
                        color:
                          activeAudition.status === "Forwarded to Organization"
                            ? "#34d399"
                            : activeAudition.status === "Self-tape Received"
                            ? "var(--gold)"
                            : "#8ab4ff",
                        border: `1px solid ${
                          activeAudition.status === "Forwarded to Organization"
                            ? "rgba(52, 211, 153, 0.35)"
                            : activeAudition.status === "Self-tape Received"
                            ? "rgba(255, 188, 0, 0.35)"
                            : "rgba(255, 255, 255, 0.14)"
                        }`,
                      }}
                    >
                      {activeAudition.status}
                    </span>
                  </div>

                  <p style={{ fontSize: "0.825rem", color: "#a3acc2", margin: "0 0 10px 0", lineHeight: "1.5" }}>
                    <strong style={{ color: "#eceaf5" }}>Note:</strong> {activeAudition.note}
                  </p>

                  <div style={{ fontSize: "0.75rem", color: "#7c869e" }}>
                    Requested on {formatDate(activeAudition.requestedAt)}
                  </div>
                </div>

                {/* Self Tape Player Preview */}
                {activeAudition.status === "Forwarded to Organization" ? (
                  <VideoPlayer
                    src={activeAudition.selfTapeUrl}
                    fileName={`${application?.talentName || "Candidate"}-SelfTape.mp4`}
                    height="220px"
                  />
                ) : (
                  <div
                    style={{
                      padding: "14px",
                      borderRadius: "12px",
                      backgroundColor: "rgba(255, 188, 0, 0.08)",
                      border: "1px solid rgba(255, 188, 0, 0.25)",
                      fontSize: "0.8rem",
                      color: "var(--gold)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                    }}
                  >
                    <Clock size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                    <span>
                      Self-tape will unlock here as soon as Vismaya Casting Desk reviews and forwards the submission.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  border: "1px dashed rgba(255, 255, 255, 0.14)",
                  borderRadius: "14px",
                  padding: "24px 16px",
                  textAlign: "center",
                }}
              >
                <Video size={28} style={{ color: "var(--gold)", marginBottom: "8px" }} />
                <p style={{ fontSize: "0.825rem", color: "#a3acc2", margin: "0 0 12px 0" }}>
                  No audition or self-tape requested yet for this candidate.
                </p>
                {!isFinalSelected && !isFinalNotSelected && !isWithdrawn && (
                  <button
                    type="button"
                    onClick={handleOpenAuditionModal}
                    className="btn-secondary"
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      padding: "0 14px",
                      height: "36px",
                      borderRadius: "10px",
                    }}
                  >
                    Request audition
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Status History Audit Trail */}
          <div
            style={{
              backgroundColor: "var(--bg-glass)",
              border: "1px solid var(--border-glass)",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
              backdropFilter: "blur(16px)",
            }}
          >
            <h2
              style={{
                fontSize: "1.05rem",
                fontWeight: "700",
                color: "#eceaf5",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Clock size={18} style={{ color: "var(--gold)" }} />
              <span>Application Audit Trail</span>
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "relative" }}>
              {(application.history || []).map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: idx === application.history.length - 1 ? "var(--gold)" : "rgba(255, 255, 255, 0.3)",
                      boxShadow: idx === application.history.length - 1 ? "0 0 8px rgba(255, 188, 0, 0.6)" : "none",
                      marginTop: "4px",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <strong style={{ fontSize: "0.85rem", color: "#eceaf5" }}>
                        {step.status}
                      </strong>
                      <span style={{ fontSize: "0.725rem", color: "#a3acc2" }}>
                        {formatDate(step.timestamp)}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "#a3acc2", margin: 0 }}>
                      {step.note}
                    </p>
                    {step.changedBy && (
                      <span style={{ fontSize: "0.7rem", color: "#7c869e" }}>
                        By: {step.changedBy}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 1. Request Audition Modal */}
      {isAuditionModalOpen && (
        <Modal
          isOpen={isAuditionModalOpen}
          onClose={() => setIsAuditionModalOpen(false)}
          title="Request Audition / Interview via Vismaya"
        >
          <form onSubmit={handleSubmitAuditionRequest} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "0.85rem", color: "#a3acc2", margin: 0 }}>
              Specify the audition type and directions. The Vismaya Casting Desk coordinates directly with <strong style={{ color: "#eceaf5" }}>{application.talentName}</strong> and relays instructions.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.825rem", fontWeight: "600", color: "#eceaf5" }}>
                Request Type *
              </label>
              <select
                value={auditionType}
                onChange={(e) => setAuditionType(e.target.value)}
                style={{
                  ...inputStyle,
                  cursor: "pointer",
                }}
              >
                <option value="Audition" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Self-Tape Audition (Video Submission)</option>
                <option value="Interview" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>1-on-1 Virtual Interview</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.825rem", fontWeight: "600", color: "#eceaf5" }}>
                Script / Instructions Note *
              </label>
              <textarea
                rows={4}
                required
                value={auditionNote}
                onChange={(e) => setAuditionNote(e.target.value)}
                placeholder="E.g. Record the hospital emergency scene from Page 4. Deliver with urgency..."
                style={{
                  ...inputStyle,
                  resize: "vertical",
                }}
              />
            </div>

            <div
              style={{
                backgroundColor: "rgba(255, 188, 0, 0.12)",
                border: "1px solid rgba(255, 188, 0, 0.3)",
                borderRadius: "10px",
                padding: "12px",
                fontSize: "0.8rem",
                color: "var(--gold)",
              }}
            >
              Note: Once submitted, Vismaya team will verify candidate availability and relay instructions within 24 hours.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setIsAuditionModalOpen(false)}
                className="btn-ghost"
                style={{ borderRadius: "10px", height: "36px", padding: "0 16px", fontSize: "13px", fontWeight: "600" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ borderRadius: "10px", height: "36px", padding: "0 18px", fontSize: "13px", fontWeight: "600" }}
              >
                Send request via Vismaya
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 2. Not Selected Confirmation Modal */}
      {isNotSelectedModalOpen && (
        <Modal
          isOpen={isNotSelectedModalOpen}
          onClose={() => setIsNotSelectedModalOpen(false)}
          title="Confirm Candidate Not Selected"
        >
          <form onSubmit={handleConfirmNotSelected} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "0.85rem", color: "#a3acc2", margin: 0 }}>
              Are you sure you want to mark <strong style={{ color: "#eceaf5" }}>{application.talentName}</strong> as <strong style={{ color: "#ff6b6b" }}>Not Selected</strong> for the role of <strong style={{ color: "#eceaf5" }}>{application.roleApplied}</strong>?
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.825rem", fontWeight: "600", color: "#eceaf5" }}>
                Optional Feedback / Archive Reason
              </label>
              <textarea
                rows={3}
                value={notSelectedReason}
                onChange={(e) => setNotSelectedReason(e.target.value)}
                placeholder="E.g. Profile does not match the character age bracket for this season..."
                style={{
                  ...inputStyle,
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setIsNotSelectedModalOpen(false)}
                className="btn-ghost"
                style={{ borderRadius: "10px", height: "36px", padding: "0 16px", fontSize: "13px", fontWeight: "600" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  backgroundColor: "transparent",
                  color: "#ff6b6b",
                  border: "1px solid rgba(255, 107, 107, 0.5)",
                  borderRadius: "10px",
                  padding: "0 18px",
                  height: "36px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
                }}
              >
                Confirm not selected
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. Final Selection Confirmation Modal */}
      {isSelectedModalOpen && (
        <Modal
          isOpen={isSelectedModalOpen}
          onClose={() => setIsSelectedModalOpen(false)}
          title="Confirm Final Role Selection"
        >
          <form onSubmit={handleConfirmSelected} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                backgroundColor: "rgba(52, 211, 153, 0.12)",
                border: "1px solid rgba(52, 211, 153, 0.3)",
                borderRadius: "12px",
                padding: "16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <CheckCircle2 size={24} style={{ color: "#34d399", flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: "0.9rem", color: "#eceaf5" }}>
                  Confirm Selection for {application.roleApplied}
                </strong>
                <p style={{ fontSize: "0.8rem", color: "#a3acc2", margin: "2px 0 0 0" }}>
                  This will mark {application.talentName} as the selected candidate. Vismaya team will initiate contracting and onboarding escrow steps.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.825rem", fontWeight: "600", color: "#eceaf5" }}>
                Selection Note / Next Steps
              </label>
              <textarea
                rows={3}
                value={selectedNote}
                onChange={(e) => setSelectedNote(e.target.value)}
                placeholder="E.g. Final selection approved by Director. Proceed with contract terms."
                style={{
                  ...inputStyle,
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setIsSelectedModalOpen(false)}
                className="btn-ghost"
                style={{ borderRadius: "10px", height: "36px", padding: "0 16px", fontSize: "13px", fontWeight: "600" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ borderRadius: "10px", height: "36px", padding: "0 18px", fontSize: "13px", fontWeight: "600" }}
              >
                Confirm final selection
              </button>
            </div>
          </form>
        </Modal>
      )}

      <style jsx>{`
        @media (max-width: 1199.98px) {
          .applicant-profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 767.98px) {
          .applicant-actions-toolbar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(10, 15, 25, 0.95);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-top: 1px solid rgba(255, 255, 255, 0.12);
            padding: 12px 16px;
            padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
            z-index: 40;
            justify-content: stretch;
          }
          .applicant-actions-toolbar button {
            flex: 1 1 auto;
            min-height: 44px;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
