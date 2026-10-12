"use client";

import React, { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import Modal from "@/components/shared/Modal";
import { useWorkflow } from "@/lib/shared/workflowStore";
import { useTalent } from "@/lib/talent/TalentContext";

export default function ApplicationCard({ application }) {
  const { withdrawApplication, getOpportunity, getProject } = useWorkflow();
  const { addToast } = useTalent();

  const [showDetails, setShowDetails] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  const opportunity = getOpportunity(application.opportunityId);
  const project = opportunity ? getProject(opportunity.projectId) : null;

  const isShortlisted = application.status === "Shortlisted";
  const isSelected = application.status === "Selected";
  const isNotSelected = application.status === "Not Selected";
  const isWithdrawn = application.status === "Withdrawn";

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
        className="card-surface"
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
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span
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
              <span style={{ fontSize: "12px", color: "var(--text-muted, #777970)" }}>
                Ref: #{application.id}
              </span>
            </div>

            <h3
              style={{
                fontFamily: "var(--font-heading), Georgia, serif",
                fontSize: "clamp(18px, 3.5vw, 20px)",
                fontWeight: "400",
                color: "var(--text-primary, #292C29)",
                margin: "4px 0 0 0",
                overflowWrap: "anywhere",
              }}
            >
              {opportunity?.title || application.roleApplied}
            </h3>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "13px", color: "var(--text-secondary, #5A5C53)" }}>
              <span>
                Role: <strong style={{ color: "var(--text-primary, #292C29)" }}>{application.roleApplied}</strong>
              </span>
              {project && (
                <span>
                  &bull; Project: <strong style={{ color: "var(--gold, #9B7A3F)" }}>{project.title}</strong>
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "6px" }} className="app-header-badge">
            <StatusBadge status={application.status} size="md" />
            <span style={{ fontSize: "12px", color: "var(--text-muted, #777970)" }}>
              Applied {new Date(application.appliedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Selected Highlight */}
        {isSelected && (
          <div
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
            <Trophy size={24} style={{ color: "var(--gold, #9B7A3F)", flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary, #292C29)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Congratulations! You are Selected
              </span>
              <span style={{ fontSize: "13px", color: "var(--text-secondary, #5A5C53)", lineHeight: 1.4, overflowWrap: "anywhere" }}>
                The organization has officially confirmed your selection for <strong>{application.roleApplied}</strong>. Vismaya casting desk will assist with production onboarding.
              </span>
            </div>
          </div>
        )}

        {/* Shortlisted Highlight */}
        {isShortlisted && (
          <div
            style={{
              backgroundColor: "var(--bg-alt, #F0EEE7)",
              border: "1px solid var(--border-color, #E4E1D9)",
              borderRadius: "4px",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Sparkles size={20} style={{ color: "var(--gold, #9B7A3F)", flexShrink: 0 }} />
            <span style={{ fontSize: "13px", color: "var(--text-primary, #292C29)", fontWeight: "500", lineHeight: 1.4, overflowWrap: "anywhere" }}>
              Your profile has been shortlisted! Look out for audition and self-tape instructions in your Auditions tab.
            </span>
          </div>
        )}

        {/* 4-Stage Visual Progress Tracker */}
        {!isNotSelected && !isWithdrawn ? (
          <div
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
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--gold, #9B7A3F)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Stage {currentStage} of 4: {stages[currentStage - 1]?.label}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted, #777970)" }}>
                    {Math.round((currentStage / 4) * 100)}% Complete
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ width: "100%", height: "6px", backgroundColor: "var(--border-color, #E4E1D9)", borderRadius: "999px", overflow: "hidden" }}>
                  <div
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
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", paddingTop: "4px" }}>
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
                          gap: "4px",
                          textAlign: "center",
                        }}
                      >
                        <div
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
        ) : isWithdrawn ? (
          <div
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
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <RotateCcw size={18} style={{ color: "var(--text-muted, #777970)" }} />
              <span style={{ fontSize: "13px", color: "var(--text-secondary, #5A5C53)" }}>
                Application was withdrawn by artist.
              </span>
            </div>
            <Link
              href="/talent/opportunities"
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
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <XCircle size={18} style={{ color: "var(--text-muted, #777970)" }} />
              <span style={{ fontSize: "13px", color: "var(--text-primary, #292C29)" }}>
                Application not selected for this cycle.
              </span>
            </div>
            <Link
              href="/talent/opportunities"
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
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "6px",
          }}
        >
          <button
            onClick={() => setShowDetails(true)}
            className="btn-secondary btn-dash"
            style={{ borderRadius: "4px" }}
          >
            <Eye size={14} />
            <span>View Timeline</span>
          </button>

          {!isWithdrawn && (
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
              className="withdraw-btn-hover"
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
        title={opportunity?.title || application.roleApplied}
        subtitle={`Role: ${application.roleApplied} • Ref #${application.id}`}
        maxWidth="600px"
        footer={
          <button onClick={() => setShowDetails(false)} className="btn-secondary btn-dash">
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
              <span style={{ color: "var(--text-secondary, #5A5C53)" }}>Candidate Name:</span>
              <span style={{ color: "var(--text-primary, #292C29)", fontWeight: "600" }}>
                {application.talentName}
              </span>
            </div>
          </div>

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
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setShowWithdrawConfirm(false)}
              className="btn-secondary btn-dash"
            >
              Keep Application
            </button>
            <button
              onClick={handleConfirmWithdraw}
              disabled={isSubmittingWithdraw}
              className="btn-danger btn-dash"
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
      `}</style>
    </>
  );
}
