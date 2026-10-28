"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Sparkles,
  Eye,
  XCircle,
  Video,
  ArrowRight,
  AlertCircle,
  RotateCcw,
  Trophy,
  History,
  Building2,
  Calendar,
  MapPin,
  Link2,
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import Modal from "@/components/shared/Modal";
import { useWorkflow } from "@/lib/shared/workflowStore";
import { useTalent } from "@/lib/talent/TalentContext";
import { apiClient } from "@/lib/api/client";
import { isRealMode } from "@/lib/api/config";
import { mapAudition } from "@/lib/api/mappers/index";

export default function ApplicationCard({ application }) {
  const workflow = useWorkflow();
  const { withdrawApplication, getOpportunity, getProject } = workflow;
  const { addToast } = useTalent();

  const searchParams = useSearchParams();
  const targetId = searchParams?.get("id");
  const [showDetails, setShowDetails] = useState(() => targetId === (application.id || application._id));
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  const [audition, setAudition] = useState(null);
  const [loadingAudition, setLoadingAudition] = useState(false);

  const opportunity = getOpportunity(application.opportunityId);
  const project = opportunity ? getProject(opportunity.projectId) : null;

  const isShortlisted = application.status === "Shortlisted" || application.status === "shortlisted" || application.rawStatus === "shortlisted";
  const isSelected = application.status === "Selected" || application.status === "selected" || application.rawStatus === "selected";
  const isNotSelected = application.status === "Not Selected" || application.status === "not_selected" || application.rawStatus === "not_selected";
  const isWithdrawn = application.status === "Withdrawn" || application.status === "withdrawn" || application.rawStatus === "withdrawn";
  const isOpportunityCancelled = application.status === "Opportunity Cancelled" || application.status === "opportunity_cancelled" || application.rawStatus === "opportunity_cancelled";
  const isShortlistedOrBeyond = isShortlisted || isSelected || isNotSelected || application.status === "Audition Scheduled" || application.status === "Audition Submitted" || application.status === "Audition Reviewed";

  useEffect(() => {
    if (targetId && (targetId === application.id || targetId === application._id)) {
      setShowDetails(true);
    }
  }, [targetId, application.id, application._id]);

  useEffect(() => {
    let active = true;
    const fetchAudition = async () => {
      if (!isShortlistedOrBeyond) return;
      try {
        setLoadingAudition(true);
        if (isRealMode("auditions") || isRealMode("talent")) {
          const res = await apiClient.get(`/api/auditions/application/${application.id || application._id}`);
          const docs = Array.isArray(res?.auditions) ? res.auditions : Array.isArray(res?.data) ? res.data : [];
          if (active && docs.length > 0) {
            setAudition(mapAudition(docs[0]));
          }
        } else {
          const aud = (workflow?.auditions || []).find((a) => a.applicationId === (application.id || application._id));
          if (active && aud) {
            setAudition(aud);
          }
        }
      } catch (err) {
        console.warn("Could not load audition for application:", err);
      } finally {
        if (active) setLoadingAudition(false);
      }
    };
    fetchAudition();
    return () => { active = false; };
  }, [application.id, application._id, isShortlistedOrBeyond, workflow?.auditions]);

  const renderAuditionBlock = () => {
    if (!isShortlistedOrBeyond) return null;

    if (!audition) {
      return (
        <div
          className="app-audition-block"
          style={{
            backgroundColor: "#F3EFE6",
            border: "1px solid #E8E2D4",
            borderRadius: "10px",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Sparkles size={18} style={{ color: "#8A6B2E", flexShrink: 0 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#6E5420", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Audition Round
            </span>
            <span style={{ fontSize: "13px", color: "#5A584F" }}>
              Audition details will be shared by the organization soon
            </span>
          </div>
        </div>
      );
    }

    const methodLabel = audition.type === "video_interview"
      ? "Live Virtual Audition (Google Meet / Zoom)"
      : audition.type === "in_person_audition"
        ? "In-Person Audition / Screen Test"
        : "Video Self-Tape Submission";

    const dateStr = audition.scheduledAt
      ? new Date(audition.scheduledAt).toLocaleString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : (audition.deadline ? `Deadline: ${new Date(audition.deadline).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}` : "Scheduled date TBD");

    const orgName = audition.organizationName || project?.title || project?.productionCompany || "Casting Team";

    return (
      <div
        className="app-audition-block"
        style={{
          backgroundColor: "#FAF9F7",
          border: "1px solid #8A6B2E",
          borderRadius: "12px",
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          boxShadow: "0 2px 6px rgba(138, 107, 46, 0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Video size={18} style={{ color: "#8A6B2E" }} />
            <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#2B2D2A", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Audition: {methodLabel}
            </span>
          </div>
          <span style={{ fontSize: "12px", color: "#6E5420", fontWeight: "600", background: "rgba(138, 107, 46, 0.1)", padding: "3px 8px", borderRadius: "6px" }}>
            {orgName}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px", fontSize: "13px", color: "#5A584F" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Calendar size={15} style={{ color: "#8A6B2E", flexShrink: 0 }} />
            <span><strong>Date &amp; Time:</strong> {dateStr}</span>
          </div>

          {audition.meetingLink && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Link2 size={15} style={{ color: "#8A6B2E", flexShrink: 0 }} />
              <span>
                <strong>Meeting Link:</strong>{" "}
                <a href={audition.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: "#8A6B2E", textDecoration: "underline", wordBreak: "break-all" }}>
                  {audition.meetingLink}
                </a>
              </span>
            </div>
          )}

          {audition.location && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <MapPin size={15} style={{ color: "#8A6B2E", flexShrink: 0 }} />
              <span><strong>Venue:</strong> {audition.location}</span>
            </div>
          )}
        </div>

        {audition.instructions && (
          <div style={{ fontSize: "12.5px", color: "#4A483F", background: "#FFFFFF", padding: "10px 12px", borderRadius: "8px", border: "1px solid #E8E2D4", marginTop: "2px" }}>
            <strong style={{ color: "#2B2D2A", display: "block", marginBottom: "2px" }}>Instructions from Organization:</strong>
            {audition.instructions}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
          <Link
            href="/talent/auditions"
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#8A6B2E",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Go to Auditions Tab <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    );
  };

  const getStageNumber = () => {
    switch (application.status) {
      case "Applied":
        return 1;
      case "Under Review":
        return 2;
      case "Shortlisted":
        return 3;
      case "Selected":
        return 4;
      default:
        return 1;
    }
  };

  const currentStage = getStageNumber();

  const stages = [
    { number: 1, label: "Applied" },
    { number: 2, label: "Under Review" },
    { number: 3, label: "Shortlisted" },
    { number: 4, label: "Selected" },
  ];

  const handleConfirmWithdraw = () => {
    setIsSubmittingWithdraw(true);
    try {
      withdrawApplication(application.id, withdrawReason || "Application withdrawn by talent.");
      addToast({
        type: "info",
        title: "Application Withdrawn",
        message: `Your submission for '${opportunity?.title || application.roleApplied}' has been withdrawn.`,
      });
      setShowWithdrawConfirm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  return (
    <>
      <div
        className="card-surface app-card-root"
        style={{
          padding: "clamp(16px, 3vw, 26px)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
          borderRadius: "18px",
          border: "1px solid #E8E2D4",
          boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06)",
        }}
      >
        {/* Highlight Strip for Shortlisted / Selected */}
        {(isShortlisted || isSelected) && (
          <div
            className="app-card-highlight-strip"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "var(--gold, #9B7A3F)",
            }}
          />
        )}

        {/* Card Header */}
        <div
          className="app-card-header"
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div className="app-card-header-left" style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0, flex: 1 }}>
            <div className="app-card-meta-row-1" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span
                className="app-card-type-pill"
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "3px 10px",
                  borderRadius: "4px",
                  backgroundColor: "var(--bg-alt, #F0EEE7)",
                  color: "var(--gold, #9B7A3F)",
                  border: "1px solid var(--border-color, #E4E1D9)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {opportunity?.opportunityType || "Opportunity"}
              </span>
            </div>

            <h3
              className="app-card-title"
              style={{
                fontFamily: "var(--font-heading), Georgia, serif",
                fontSize: "clamp(18px, 3.5vw, 20px)",
                fontWeight: "400",
                color: "var(--text-primary, #292C29)",
                margin: "4px 0 0 0",
                overflowWrap: "anywhere",
              }}
            >
              {opportunity?.title || application.opportunityTitle || application.roleApplied}
            </h3>

            <div className="app-card-role-project" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "13px", color: "var(--text-secondary, #5A5C53)" }}>
              <span className="app-card-role">
                Role: <strong style={{ color: "var(--text-primary, #292C29)" }}>{application.roleName || application.roleApplied || application.role || opportunity?.role || "—"}</strong>
              </span>
              {project && (
                <span className="app-card-project">
                  <span className="app-card-bullet">&bull; </span>Project: <strong style={{ color: "var(--gold, #9B7A3F)" }}>{project.title}</strong>
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "6px" }} className="app-header-badge">
            <StatusBadge status={application.status} size="md" />
            <span className="app-card-applied-date" style={{ fontSize: "12px", color: "var(--text-muted, #777970)" }}>
              Applied {new Date(application.appliedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Selected Highlight */}
        {isSelected && (
          <div
            className="app-status-box app-status-selected"
            style={{
              backgroundColor: "var(--bg-alt, #F0EEE7)",
              border: "1px solid var(--border-color, #E4E1D9)",
              borderRadius: "4px",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <Trophy size={24} className="app-status-icon" style={{ color: "var(--gold, #9B7A3F)", flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span className="app-status-title" style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary, #292C29)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Congratulations! You are Selected
              </span>
              <span className="app-status-text" style={{ fontSize: "13px", color: "var(--text-secondary, #5A5C53)", lineHeight: 1.4, overflowWrap: "anywhere" }}>
                The organization has officially confirmed your selection for <strong>{application.roleName || application.roleApplied || application.role || opportunity?.role || "the role"}</strong>. Vismaya casting desk will assist with production onboarding.
              </span>
            </div>
          </div>
        )}

        {/* Audition Block on Card */}
        {renderAuditionBlock()}

        {/* 4-Stage Visual Progress Tracker */}
        {!isNotSelected && !isWithdrawn ? (
          <div
            className="app-stage-tracker-wrap"
            style={{
              backgroundColor: "var(--bg-alt, #F0EEE7)",
              padding: "clamp(12px, 2.5vw, 18px) clamp(12px, 3vw, 22px)",
              borderRadius: "4px",
              border: "1px solid var(--border-color, #E4E1D9)",
            }}
          >
            {/* Desktop / Tablet Stepper (>= 580px) */}
            <div className="talent-stepper-desktop">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  position: "relative",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "16px",
                    left: "24px",
                    right: "24px",
                    height: "2px",
                    backgroundColor: "var(--border-color, #E4E1D9)",
                    zIndex: 1,
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    top: "16px",
                    left: "24px",
                    width: `${((Math.min(currentStage, 4) - 1) / 3) * 100}%`,
                    height: "2px",
                    background: "var(--gold, #9B7A3F)",
                    zIndex: 2,
                    transition: "width 0.4s ease",
                  }}
                />

                {stages.map((st) => {
                  const isPassed = currentStage >= st.number;
                  const isCurrent = currentStage === st.number;

                  return (
                    <div
                      key={st.number}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                        position: "relative",
                        zIndex: 3,
                        minWidth: "60px",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          backgroundColor: isPassed
                            ? "var(--gold, #9B7A3F)"
                            : "var(--bg-alt, #F0EEE7)",
                          border: `2px solid ${isPassed ? "var(--gold, #9B7A3F)" : "var(--border-color, #E4E1D9)"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isPassed ? "#FAF9F6" : "var(--text-muted, #777970)",
                          fontSize: "12px",
                          fontWeight: "700",
                          transition: "all var(--transition)",
                        }}
                      >
                        {isPassed ? <CheckCircle2 size={16} /> : st.number}
                      </div>

                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: isCurrent ? "700" : isPassed ? "600" : "500",
                          color: isCurrent ? "var(--gold, #9B7A3F)" : isPassed ? "var(--text-primary, #292C29)" : "var(--text-muted, #777970)",
                          textAlign: "center",
                          whiteSpace: "nowrap",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile Stepper (< 580px) */}
            <div className="talent-stepper-mobile">
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <span className="app-stage-heading" style={{ fontSize: "11px", fontWeight: "700", color: "var(--gold, #9B7A3F)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Stage {currentStage} of 4: {stages[currentStage - 1]?.label}
                  </span>
                  <span className="app-stage-pct" style={{ fontSize: "11px", color: "var(--text-muted, #777970)" }}>
                    {Math.round((currentStage / 4) * 100)}% Complete
                  </span>
                </div>

                {/* Progress bar */}
                <div className="app-stage-bar-bg" style={{ width: "100%", height: "6px", backgroundColor: "var(--border-color, #E4E1D9)", borderRadius: "999px", overflow: "hidden" }}>
                  <div
                    className="app-stage-bar-fill"
                    style={{
                      width: `${(currentStage / 4) * 100}%`,
                      height: "100%",
                      background: "var(--gold, #9B7A3F)",
                      borderRadius: "999px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                {/* 4 stage indicators */}
                <div className="app-stage-steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", paddingTop: "4px" }}>
                  {stages.map((st) => {
                    const isPassed = currentStage >= st.number;
                    const isCurrent = currentStage === st.number;
                    return (
                      <div
                        key={st.number}
                        className="app-stage-step"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "4px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          className="app-stage-circle"
                          style={{
                            width: "22px",
                            height: "22px",
                            borderRadius: "50%",
                            backgroundColor: isPassed
                              ? "var(--gold, #9B7A3F)"
                              : "var(--bg-alt, #F0EEE7)",
                            color: isPassed ? "#FAF9F6" : "var(--text-muted, #777970)",
                            fontSize: "10px",
                            fontWeight: "700",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {isPassed ? "✓" : st.number}
                        </div>
                        <span
                          className="app-stage-label"
                          style={{
                            fontSize: "10px",
                            fontWeight: isCurrent ? "700" : "500",
                            color: isCurrent ? "var(--gold, #9B7A3F)" : isPassed ? "var(--text-primary, #292C29)" : "var(--text-muted, #777970)",
                            lineHeight: 1.2,
                          }}
                        >
                          {st.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : isOpportunityCancelled ? (
          <div
            className="app-status-box app-status-cancelled"
            style={{
              backgroundColor: "rgba(180, 35, 24, 0.08)",
              border: "1px solid rgba(180, 35, 24, 0.25)",
              borderRadius: "4px",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div className="app-status-left" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <XCircle size={18} className="app-status-icon" style={{ color: "#B42318" }} />
              <span className="app-status-text" style={{ fontSize: "13px", color: "#B42318", fontWeight: "600" }}>
                Opportunity Cancelled by Organization.
              </span>
            </div>
            <Link
              href="/talent/opportunities"
              className="app-status-link"
              style={{
                fontSize: "12px",
                color: "var(--gold, #9B7A3F)",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                textDecoration: "none",
              }}
            >
              <span>Explore opportunities</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        ) : isWithdrawn ? (
          <div
            className="app-status-box app-status-withdrawn"
            style={{
              backgroundColor: "var(--bg-alt, #F0EEE7)",
              border: "1px solid var(--border-color, #E4E1D9)",
              borderRadius: "4px",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div className="app-status-left" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <RotateCcw size={18} className="app-status-icon" style={{ color: "var(--text-muted, #777970)" }} />
              <span className="app-status-text" style={{ fontSize: "13px", color: "var(--text-secondary, #5A5C53)" }}>
                Application was withdrawn by artist.
              </span>
            </div>
            <Link
              href="/talent/opportunities"
              className="app-status-link"
              style={{
                fontSize: "12px",
                color: "var(--gold, #9B7A3F)",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                textDecoration: "none",
              }}
            >
              <span>Explore opportunities</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        ) : (
          <div
            className="app-status-box app-status-rejected"
            style={{
              backgroundColor: "var(--bg-alt, #F0EEE7)",
              border: "1px solid var(--border-color, #E4E1D9)",
              borderRadius: "4px",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div className="app-status-left" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <XCircle size={18} className="app-status-icon" style={{ color: "var(--text-muted, #777970)" }} />
              <span className="app-status-text" style={{ fontSize: "13px", color: "var(--text-primary, #292C29)" }}>
                Application not selected for this cycle.
              </span>
            </div>
            <Link
              href="/talent/opportunities"
              className="app-status-link"
              style={{
                fontSize: "12px",
                color: "var(--gold, #9B7A3F)",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                textDecoration: "none",
              }}
            >
              <span>Explore other calls</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {/* Latest History Note */}
        {application.history && application.history.length > 0 && (
          <div
            className="app-latest-note"
            style={{
              backgroundColor: "var(--bg-alt, #F0EEE7)",
              padding: "12px 16px",
              borderRadius: "4px",
              border: "1px solid var(--border-color, #E4E1D9)",
              fontSize: "12px",
              color: "var(--text-secondary, #5A5C53)",
              lineHeight: 1.5,
            }}
          >
            <span style={{ color: "var(--gold, #9B7A3F)", fontWeight: "700" }}>Latest Note: </span>
            {application.history[application.history.length - 1].note || "Status updated."}
          </div>
        )}

        {/* Bottom Actions */}
        <div
          className="app-card-actions"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "6px",
          }}
        >
          <button
            onClick={() => setShowDetails(true)}
            className="btn-secondary btn-dash app-timeline-btn"
            style={{ borderRadius: "4px" }}
          >
            <Eye size={14} />
            <span>View Timeline</span>
          </button>

          {!isWithdrawn && !isOpportunityCancelled && !isSelected && !isNotSelected && (
            <button
              onClick={() => setShowWithdrawConfirm(true)}
              style={{
                fontSize: "12px",
                color: "var(--text-muted, #777970)",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "6px 14px",
                borderRadius: "4px",
                transition: "all var(--transition)",
              }}
              className="withdraw-btn-hover app-withdraw-btn"
            >
              Withdraw Application
            </button>
          )}
        </div>
      </div>

      {/* Details & Status History Timeline Modal */}
      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title={opportunity?.title || application.opportunityTitle || application.roleApplied || "Application Details"}
        subtitle={`Role: ${application.roleName || application.roleApplied || application.role || opportunity?.role || "—"}`}
        maxWidth="600px"
        footer={
          <button onClick={() => setShowDetails(false)} className="btn-secondary btn-dash app-modal-btn">
            Close
          </button>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Submission Info Box */}
          <div
            style={{
              backgroundColor: "var(--bg-alt, #F0EEE7)",
              padding: "16px",
              borderRadius: "4px",
              border: "1px solid var(--border-color, #E4E1D9)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              fontSize: "13px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary, #5A5C53)" }}>Current Status:</span>
              <StatusBadge status={application.status} size="sm" />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary, #5A5C53)" }}>Submission Date:</span>
              <span style={{ color: "var(--text-primary, #292C29)", fontWeight: "600" }}>
                {new Date(application.appliedAt).toLocaleString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary, #5A5C53)" }}>Applied Role:</span>
              <span style={{ color: "var(--gold, #9B7A3F)", fontWeight: "700" }}>
                {application.roleName || application.roleApplied || application.role || opportunity?.role || "—"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary, #5A5C53)" }}>Candidate Name:</span>
              <span style={{ color: "var(--text-primary, #292C29)", fontWeight: "600" }}>
                {application.talentName}
              </span>
            </div>
          </div>

          {/* Audition Details Block inside Details Modal */}
          {renderAuditionBlock()}

          {/* Status History Timeline */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <History size={16} style={{ color: "var(--gold, #9B7A3F)" }} />
              <h4 style={{ fontFamily: "var(--font-heading), Georgia, serif", fontSize: "16px", fontWeight: "400", color: "var(--text-primary, #292C29)", margin: 0 }}>
                Status History Timeline
              </h4>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {(application.history || [
                { status: application.status, timestamp: application.appliedAt, note: "Application submitted with verified talent profile", changedBy: application.talentName },
              ]).map((hist, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "var(--bg-alt, #F0EEE7)",
                    border: "1px solid var(--border-color, #E4E1D9)",
                    borderRadius: "4px",
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <StatusBadge status={hist.status} size="xs" />
                      <span style={{ fontSize: "12px", color: "var(--text-secondary, #5A5C53)" }}>
                        Updated by <strong>{hist.changedBy || "Vismaya"}</strong>
                      </span>
                    </div>

                    <span style={{ fontSize: "11px", color: "var(--text-muted, #777970)" }}>
                      {hist.timestamp
                        ? new Date(hist.timestamp).toLocaleString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Recent"}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary, #5A5C53)", lineHeight: 1.45 }}>
                    {hist.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Withdraw Confirmation Modal */}
      <Modal
        isOpen={showWithdrawConfirm}
        onClose={() => setShowWithdrawConfirm(false)}
        title="Withdraw Casting Application?"
        subtitle="Confirm retraction of your profile submission."
        maxWidth="460px"
        footer={
          <div className="app-modal-footer-actions" style={{ display: "flex", gap: "10px", width: "100%" }}>
            <button
              onClick={() => setShowWithdrawConfirm(false)}
              className="btn-secondary btn-dash app-modal-btn"
            >
              Keep Application
            </button>
            <button
              onClick={handleConfirmWithdraw}
              disabled={isSubmittingWithdraw}
              className="btn-danger btn-dash app-modal-btn"
            >
              {isSubmittingWithdraw ? "Withdrawing..." : "Confirm Withdrawal"}
            </button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <p style={{ color: "var(--text-secondary, #5A5C53)", fontSize: "14px", lineHeight: 1.55, margin: 0 }}>
            Are you sure you want to withdraw your application for <strong style={{ color: "var(--text-primary, #292C29)" }}>{opportunity?.title || application.roleApplied}</strong>?
            The organization will be notified that you have withdrawn from candidate consideration.
          </p>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px" }}>
              Reason for Withdrawal (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Scheduling conflict, accepted another project..."
              value={withdrawReason}
              onChange={(e) => setWithdrawReason(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "4px",
                backgroundColor: "var(--bg-surface, #FFFFFF)",
                border: "1px solid var(--border-color, #E4E1D9)",
                color: "var(--text-primary, #292C29)",
                fontSize: "13px",
                outline: "none",
              }}
            />
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .withdraw-btn-hover:hover {
          color: var(--status-red) !important;
          background-color: rgba(255, 107, 107, 0.12) !important;
        }

        @media (max-width: 640px) {
          /* D. Application Card Root */
          .app-card-root {
            padding: 14px !important;
            border-radius: 14px !important;
            gap: 10px !important;
            border: 1px solid #E8E2D4 !important;
            background-color: #FFFFFF !important;
            box-shadow: 0 2px 8px rgba(43, 45, 42, 0.04) !important;
          }
          .app-card-highlight-strip {
            height: 3px !important;
            background: #8A6B2E !important;
          }

          /* Card Header Grid Reorganization */
          .app-card-header {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) auto !important;
            row-gap: 5px !important;
            column-gap: 10px !important;
            align-items: center !important;
            width: 100% !important;
          }
          .app-card-header-left {
            display: contents !important;
          }
          .app-card-meta-row-1 {
            display: contents !important;
          }
          .app-header-badge {
            display: contents !important;
          }

          /* Header Row 1: Type Pill on Left, Status Pill on Right */
          .app-card-type-pill {
            grid-row: 1 !important;
            grid-column: 1 !important;
            justify-self: start !important;
            height: 24px !important;
            min-height: 24px !important;
            line-height: 22px !important;
            font-size: 10px !important;
            font-weight: 700 !important;
            padding: 0 8px !important;
            border-radius: 4px !important;
            background-color: #F3EFE6 !important;
            color: #8A6B2E !important;
            border: 1px solid #E8E2D4 !important;
            white-space: nowrap !important;
            text-transform: uppercase !important;
            letter-spacing: 0.06em !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .app-header-badge :global(.status-badge) {
            grid-row: 1 !important;
            grid-column: 2 !important;
            justify-self: end !important;
            height: 24px !important;
            min-height: 24px !important;
            font-size: 10px !important;
            padding: 0 8px !important;
            white-space: nowrap !important;
            line-height: 1 !important;
            display: inline-flex !important;
            align-items: center !important;
          }

          /* Header Row 2: Ref on Left, Applied Date on Right */
          .app-card-ref {
            grid-row: 2 !important;
            grid-column: 1 !important;
            justify-self: start !important;
            font-size: 11px !important;
            color: #5A584F !important;
            white-space: nowrap !important;
            line-height: 1.2 !important;
          }
          .app-card-applied-date {
            grid-row: 2 !important;
            grid-column: 2 !important;
            justify-self: end !important;
            font-size: 11px !important;
            color: #5A584F !important;
            white-space: nowrap !important;
            line-height: 1.2 !important;
          }

          /* Header Row 3: Title (Playfair, ~17px, max 2 lines ellipsis) */
          .app-card-title {
            grid-row: 3 !important;
            grid-column: 1 / -1 !important;
            font-family: var(--font-heading), 'Playfair Display', Georgia, serif !important;
            font-size: 17px !important;
            line-height: 1.25 !important;
            font-weight: 500 !important;
            color: #2B2D2A !important;
            margin: 3px 0 0 0 !important;
            text-align: left !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            word-break: normal !important;
            overflow-wrap: break-word !important;
          }

          /* Header Row 4: Role & Project (2 compact lines, ~12.5px, line-height 1.4, margin 2px) */
          .app-card-role-project {
            grid-row: 4 !important;
            grid-column: 1 / -1 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 2px !important;
            margin-top: 2px !important;
            font-size: 12.5px !important;
            line-height: 1.4 !important;
            color: #5A584F !important;
          }
          .app-card-role,
          .app-card-project {
            display: block !important;
            font-size: 12.5px !important;
            line-height: 1.4 !important;
            color: #5A584F !important;
            margin: 0 !important;
          }
          .app-card-role strong {
            color: #2B2D2A !important;
          }
          .app-card-project strong {
            color: #8A6B2E !important;
          }
          .app-card-bullet {
            display: none !important;
          }

          /* Status message box */
          .app-status-box {
            padding: 10px 12px !important;
            border-radius: 8px !important;
            background-color: #F3EFE6 !important;
            border: 1px solid #E8E2D4 !important;
            display: flex !important;
            align-items: flex-start !important;
            gap: 10px !important;
          }
          .app-status-box :global(.app-status-icon) {
            width: 18px !important;
            height: 18px !important;
            min-width: 18px !important;
            margin-top: 1px !important;
            align-self: flex-start !important;
            color: #8A6B2E !important;
            flex-shrink: 0 !important;
          }
          .app-status-box .app-status-title {
            font-size: 12px !important;
            font-weight: 700 !important;
            color: #2B2D2A !important;
            text-transform: uppercase !important;
            letter-spacing: 0.04em !important;
          }
          .app-status-box .app-status-text {
            font-size: 12.5px !important;
            line-height: 1.4 !important;
            color: #2B2D2A !important;
          }
          .app-status-withdrawn,
          .app-status-rejected {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 6px !important;
          }
          .app-status-left {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            width: 100% !important;
          }
          .app-status-box :global(.app-status-link) {
            font-size: 12px !important;
            color: #8A6B2E !important;
            font-weight: 600 !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
            padding-left: 26px !important;
          }

          /* Stage Tracker */
          .talent-stepper-desktop {
            display: none !important;
          }
          .talent-stepper-mobile {
            display: block !important;
          }
          .app-stage-tracker-wrap {
            padding: 10px 12px !important;
            border-radius: 8px !important;
            background-color: #F3EFE6 !important;
            border: 1px solid #E8E2D4 !important;
          }
          .app-stage-heading {
            font-size: 10.5px !important;
            font-weight: 700 !important;
            color: #8A6B2E !important;
            text-transform: uppercase !important;
            letter-spacing: 0.06em !important;
          }
          .app-stage-pct {
            font-size: 10.5px !important;
            color: #5A584F !important;
            font-weight: 500 !important;
          }
          .app-stage-bar-bg {
            height: 6px !important;
            background-color: #E8E2D4 !important;
            border-radius: 999px !important;
          }
          .app-stage-bar-fill {
            height: 100% !important;
            background-color: #8A6B2E !important;
            border-radius: 999px !important;
          }
          .app-stage-steps-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 4px !important;
            padding-top: 2px !important;
            width: 100% !important;
          }
          .app-stage-circle {
            width: 20px !important;
            height: 20px !important;
            min-width: 20px !important;
            border-radius: 50% !important;
            font-size: 10px !important;
            font-weight: 700 !important;
          }
          .app-stage-label {
            font-size: 10px !important;
            line-height: 1.15 !important;
            white-space: nowrap !important;
            text-transform: uppercase !important;
            letter-spacing: 0.02em !important;
            text-align: center !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-width: 100% !important;
          }

          /* Latest Note */
          .app-latest-note {
            font-size: 11.5px !important;
            line-height: 1.4 !important;
            padding: 8px 10px !important;
            border-radius: 6px !important;
            border: 1px solid #E8E2D4 !important;
            background-color: #F3EFE6 !important;
            color: #5A584F !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }

          /* Actions */
          .app-card-actions {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
            width: 100% !important;
            padding-top: 4px !important;
            align-items: stretch !important;
          }
          .app-timeline-btn {
            height: 38px !important;
            min-height: 38px !important;
            font-size: 11.5px !important;
            font-weight: 600 !important;
            letter-spacing: 0.04em !important;
            text-transform: uppercase !important;
            padding: 0 10px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 6px !important;
            border-radius: 6px !important;
            white-space: nowrap !important;
            background-color: #FAF9F7 !important;
            color: #2B2D2A !important;
            border: 1px solid #E8E2D4 !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .app-withdraw-btn {
            height: 38px !important;
            min-height: 38px !important;
            font-size: 11.5px !important;
            font-weight: 600 !important;
            letter-spacing: 0.02em !important;
            padding: 0 8px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: 6px !important;
            white-space: nowrap !important;
            color: #B3261E !important;
            border: 1px solid rgba(179, 38, 30, 0.28) !important;
            background-color: rgba(179, 38, 30, 0.04) !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          /* If Withdraw button is not rendered (e.g. status is Withdrawn), View Timeline expands to full width */
          .app-timeline-btn:only-child {
            grid-column: 1 / -1 !important;
          }

          /* Modals on mobile */
          :global(.app-modal-btn) {
            height: 42px !important;
            min-height: 42px !important;
            font-size: 13px !important;
            border-radius: 6px !important;
            flex: 1 1 0 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          :global(.app-modal-footer-actions) {
            width: 100% !important;
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
          }
          :global(.modal-footer-box > .app-modal-btn) {
            width: 100% !important;
          }
        }

        @media (max-width: 400px) {
          .app-stage-label {
            font-size: 9px !important;
            letter-spacing: 0 !important;
          }
          .app-card-title {
            font-size: 16px !important;
          }
          .app-timeline-btn,
          .app-withdraw-btn {
            font-size: 11px !important;
            padding: 0 4px !important;
          }
        }
      `}</style>
    </>
  );
}
