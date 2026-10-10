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
          backgroundColor: "rgba(255, 255, 255, 0.07)",
          borderRadius: "16px",
          border: `1px solid ${
            isSelected
              ? "rgba(52, 211, 153, 0.45)"
              : isShortlisted
              ? "rgba(255, 188, 0, 0.45)"
              : "rgba(255, 255, 255, 0.12)"
          }`,
          boxShadow: isSelected
            ? "0 6px 24px rgba(52, 211, 153, 0.15)"
            : "0 10px 30px rgba(0, 0, 0, 0.35)",
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
              background: isSelected
                ? "linear-gradient(90deg, #34d399 0%, #10b981 100%)"
                : "linear-gradient(90deg, #ffd54a 0%, #ffbc00 100%)",
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
                  fontWeight: "800",
                  padding: "3px 10px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(255, 188, 0, 0.12)",
                  color: "var(--gold)",
                  border: "1px solid rgba(255, 188, 0, 0.28)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {opportunity?.opportunityType || "Opportunity"}
              </span>
              <span style={{ fontSize: "12px", color: "#7e89a3" }}>
                Ref: #{application.id}
              </span>
            </div>

            <h3
              style={{
                fontFamily: "var(--font-heading), 'Playfair Display', serif",
                fontSize: "clamp(18px, 3.5vw, 20px)",
                fontWeight: "700",
                color: "#eceaf5",
                margin: "4px 0 0 0",
                overflowWrap: "anywhere",
              }}
            >
              {opportunity?.title || application.roleApplied}
            </h3>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "13px", color: "#a3acc2" }}>
              <span>
                Role: <strong style={{ color: "#eceaf5" }}>{application.roleApplied}</strong>
              </span>
              {project && (
                <span>
                  &bull; Project: <strong style={{ color: "var(--gold)" }}>{project.title}</strong>
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "6px" }} className="app-header-badge">
            <StatusBadge status={application.status} size="md" />
            <span style={{ fontSize: "12px", color: "#7e89a3" }}>
              Applied {new Date(application.appliedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Selected Highlight */}
        {isSelected && (
          <div
            style={{
              backgroundColor: "rgba(52, 211, 153, 0.14)",
              border: "1px solid rgba(52, 211, 153, 0.35)",
              borderRadius: "14px",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <Trophy size={26} style={{ color: "var(--status-green)", flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ fontSize: "14px", fontWeight: "800", color: "var(--status-green)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Congratulations! You are Selected
              </span>
              <span style={{ fontSize: "13px", color: "#eceaf5", lineHeight: 1.4, overflowWrap: "anywhere" }}>
                The organization has officially confirmed your selection for <strong>{application.roleApplied}</strong>. Vismaya casting desk will assist with production onboarding.
              </span>
            </div>
          </div>
        )}

        {/* Shortlisted Highlight */}
        {isShortlisted && (
          <div
            style={{
              backgroundColor: "rgba(255, 188, 0, 0.12)",
              border: "1px solid rgba(255, 188, 0, 0.30)",
              borderRadius: "14px",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Sparkles size={20} style={{ color: "var(--gold)", flexShrink: 0 }} />
            <span style={{ fontSize: "13px", color: "#eceaf5", fontWeight: "600", lineHeight: 1.4, overflowWrap: "anywhere" }}>
              Your profile has been shortlisted! Look out for audition and self-tape instructions in your Auditions tab.
            </span>
          </div>
        )}

        {/* 4-Stage Visual Progress Tracker (Responsive Desktop & Mobile) */}
        {!isNotSelected && !isWithdrawn ? (
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              padding: "clamp(12px, 2.5vw, 18px) clamp(12px, 3vw, 22px)",
              borderRadius: "14px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
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
                    backgroundColor: "rgba(255, 255, 255, 0.10)",
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
                    background: isSelected
                      ? "linear-gradient(90deg, #ffd54a, #34d399)"
                      : "linear-gradient(90deg, #ffd54a, #ffbc00)",
                    zIndex: 2,
                    transition: "width 0.4s ease",
                    boxShadow: "0 0 8px rgba(255, 188, 0, 0.5)",
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
                            ? (isSelected && st.number === 4 ? "#34d399" : "#ffbc00")
                            : "#0f1626",
                          border: `2px solid ${isPassed ? (isSelected && st.number === 4 ? "#34d399" : "#ffd54a") : "rgba(255, 255, 255, 0.16)"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isPassed ? "#1a1300" : "#a3acc2",
                          fontSize: "12px",
                          fontWeight: "800",
                          boxShadow: isCurrent ? "0 0 12px rgba(255, 188, 0, 0.5)" : "none",
                          transition: "all var(--transition)",
                        }}
                      >
                        {isPassed ? <CheckCircle2 size={16} /> : st.number}
                      </div>

                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: isCurrent ? "700" : isPassed ? "600" : "500",
                          color: isCurrent ? "var(--gold)" : isPassed ? "#eceaf5" : "#7e89a3",
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

            {/* Mobile Stepper (< 580px): Compact, Clean Horizontal Chain with Legible Labels */}
            <div className="talent-stepper-mobile">
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Stage {currentStage} of 4: {stages[currentStage - 1]?.label}
                  </span>
                  <span style={{ fontSize: "11px", color: "#7e89a3" }}>
                    {Math.round((currentStage / 4) * 100)}% Complete
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(255, 255, 255, 0.10)", borderRadius: "999px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${(currentStage / 4) * 100}%`,
                      height: "100%",
                      background: isSelected
                        ? "linear-gradient(90deg, #ffd54a, #34d399)"
                        : "linear-gradient(90deg, #ffd54a, #ffbc00)",
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
                              ? (isSelected && st.number === 4 ? "#34d399" : "#ffbc00")
                              : "rgba(255, 255, 255, 0.08)",
                            color: isPassed ? "#1a1300" : "#7e89a3",
                            fontSize: "10px",
                            fontWeight: "800",
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
                            color: isCurrent ? "var(--gold)" : isPassed ? "#eceaf5" : "#7e89a3",
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
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "14px",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <RotateCcw size={18} style={{ color: "#a3acc2" }} />
              <span style={{ fontSize: "13px", color: "#a3acc2" }}>
                Application was withdrawn by artist.
              </span>
            </div>
            <Link
              href="/talent/opportunities"
              style={{
                fontSize: "12px",
                color: "var(--gold)",
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
              backgroundColor: "rgba(255, 107, 107, 0.08)",
              border: "1px solid rgba(255, 107, 107, 0.25)",
              borderRadius: "14px",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <XCircle size={18} style={{ color: "#ff6b6b" }} />
              <span style={{ fontSize: "13px", color: "#eceaf5" }}>
                Application not selected for this cycle.
              </span>
            </div>
            <Link
              href="/talent/opportunities"
              style={{
                fontSize: "12px",
                color: "var(--gold)",
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
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              fontSize: "12px",
              color: "#a3acc2",
              lineHeight: 1.5,
            }}
          >
            <span style={{ color: "var(--gold)", fontWeight: "700" }}>Latest Note: </span>
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
            style={{ borderRadius: "10px" }}
          >
            <Eye size={14} />
            <span>View Timeline</span>
          </button>

          {!isWithdrawn && (
            <button
              onClick={() => setShowWithdrawConfirm(true)}
              style={{
                fontSize: "12px",
                color: "#a3acc2",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "6px 14px",
                borderRadius: "10px",
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
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              padding: "16px",
              borderRadius: "14px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              fontSize: "13px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#a3acc2" }}>Current Status:</span>
              <StatusBadge status={application.status} size="sm" />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#a3acc2" }}>Submission Date:</span>
              <span style={{ color: "#eceaf5", fontWeight: "600" }}>
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
              <span style={{ color: "#a3acc2" }}>Candidate Name:</span>
              <span style={{ color: "#eceaf5", fontWeight: "600" }}>
                {application.talentName}
              </span>
            </div>
          </div>

          {/* Status History Timeline */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <History size={16} style={{ color: "var(--gold)" }} />
              <h4 style={{ fontFamily: "var(--font-heading), 'Playfair Display', serif", fontSize: "16px", fontWeight: "700", color: "#eceaf5", margin: 0 }}>
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
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <StatusBadge status={hist.status} size="xs" />
                      <span style={{ fontSize: "12px", color: "#a3acc2" }}>
                        Updated by <strong>{hist.changedBy || "Vismaya"}</strong>
                      </span>
                    </div>

                    <span style={{ fontSize: "11px", color: "#7e89a3" }}>
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

                  <p style={{ margin: 0, fontSize: "13px", color: "#a3acc2", lineHeight: 1.45 }}>
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
          <p style={{ color: "#a3acc2", fontSize: "14px", lineHeight: 1.55, margin: 0 }}>
            Are you sure you want to withdraw your application for <strong style={{ color: "#eceaf5" }}>{opportunity?.title || application.roleApplied}</strong>?
            The organization will be notified that you have withdrawn from candidate consideration.
          </p>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#a3acc2", marginBottom: "6px" }}>
              Reason for Withdrawal (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Scheduling conflict, accepted another project..."
              value={withdrawReason}
              onChange={(e) => setWithdrawReason(e.target.value)}
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
