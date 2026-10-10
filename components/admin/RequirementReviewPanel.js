"use client";

import React, { useState } from "react";
import {
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Megaphone,
  Clock,
  Calendar,
  MapPin,
  DollarSign,
  Building2,
  User,
  Film,
  Sparkles,
  Layers,
  MessageSquare,
  Plus,
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import ReasonModal from "./ReasonModal";

export default function RequirementReviewPanel({
  isOpen,
  onClose,
  requirement,
  onAddNote,
  onMarkNeedsClarification,
  onMarkReadyToPublish,
  onPublishAsCastingCall,
  onDecline,
}) {
  const [newNoteText, setNewNoteText] = useState("");
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showClarificationPrompt, setShowClarificationPrompt] = useState(false);
  const [clarificationReason, setClarificationReason] = useState("");

  if (!isOpen || !requirement) return null;

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    onAddNote(requirement.id, newNoteText.trim());
    setNewNoteText("");
  };

  const handleNeedsClarificationSubmit = () => {
    if (!clarificationReason.trim()) return;
    onMarkNeedsClarification(requirement.id, clarificationReason.trim());
    setShowClarificationPrompt(false);
    setClarificationReason("");
  };

  const isPublished = requirement.status === "Published";
  const isDeclined = requirement.status === "Declined";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(7, 11, 18, 0.75)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 90,
        }}
      />

      {/* Slide-in Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "680px",
          maxWidth: "100vw",
          backgroundColor: "#0f1626",
          borderLeft: "1px solid rgba(255, 255, 255, 0.14)",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.75)",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "14px",
            backgroundColor: "rgba(15, 22, 38, 0.8)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "var(--gold)",
                  padding: "1px 8px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(255, 188, 0, 0.12)",
                  border: "1px solid rgba(255, 188, 0, 0.30)",
                  fontWeight: 700,
                }}
              >
                {requirement.id}
              </span>
              <StatusBadge status={requirement.status} size="xs" />
              <span
                style={{
                  fontSize: "0.725rem",
                  color: "#eceaf5",
                  padding: "1px 8px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  fontWeight: 600,
                }}
              >
                {requirement.projectType || "Requirement"}
              </span>
            </div>
            <h2
              style={{
                fontFamily: "var(--font-heading), 'Playfair Display', serif",
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "#eceaf5",
                margin: 0,
              }}
            >
              {requirement.projectTitle || requirement.title}
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginTop: "4px",
                fontSize: "0.785rem",
                color: "#a3acc2",
                flexWrap: "wrap",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <Building2 size={13} color="var(--gold)" />
                {requirement.company || "Recruiter Company"}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <User size={13} color="#7c869e" />
                {requirement.recruiterName || "Contact Person"}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <Clock size={13} color="#7c869e" />
                Submitted: {requirement.submittedDate}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close panel"
            style={{
              padding: "8px",
              borderRadius: "10px",
              color: "#a3acc2",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {/* Status Alert Banner if Declined */}
          {requirement.status === "Declined" && requirement.statusReason && (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "14px",
                backgroundColor: "rgba(255, 107, 107, 0.12)",
                border: "1px solid rgba(255, 107, 107, 0.32)",
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
              }}
            >
              <AlertCircle size={16} color="#ff6b6b" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "#ff6b6b" }}>
                  Decline Reason
                </div>
                <div style={{ fontSize: "0.785rem", color: "#eceaf5", marginTop: "2px" }}>
                  {requirement.statusReason || requirement.declineReason}
                </div>
              </div>
            </div>
          )}

          {/* Quick Specifications Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "10px",
            }}
          >
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <div style={{ fontSize: "0.68rem", color: "#a3acc2", textTransform: "uppercase", fontWeight: 700 }}>
                Budget
              </div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--gold)", marginTop: "2px" }}>
                {requirement.budget || requirement.budgetRange || "TBA"}
              </div>
            </div>

            <div
              style={{
                padding: "12px 14px",
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <div style={{ fontSize: "0.68rem", color: "#a3acc2", textTransform: "uppercase", fontWeight: 700 }}>
                Shoot Location
              </div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#eceaf5", marginTop: "2px" }}>
                {requirement.locations || "Mumbai"}
              </div>
            </div>

            <div
              style={{
                padding: "12px 14px",
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <div style={{ fontSize: "0.68rem", color: "#a3acc2", textTransform: "uppercase", fontWeight: 700 }}>
                Deadline
              </div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#eceaf5", marginTop: "2px" }}>
                {requirement.deadline || "Open"}
              </div>
            </div>

            <div
              style={{
                padding: "12px 14px",
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <div style={{ fontSize: "0.68rem", color: "#a3acc2", textTransform: "uppercase", fontWeight: 700 }}>
                Shoot Schedule
              </div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#eceaf5", marginTop: "2px" }}>
                {requirement.shootStartDate ? `${requirement.shootStartDate} to ${requirement.shootEndDate || "TBD"}` : "Flexible / TBD"}
              </div>
            </div>
          </div>

          {/* Project Synopsis / Brief */}
          <div>
            <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#eceaf5", marginBottom: "6px" }}>
              Project Description &amp; Brief
            </h3>
            <p
              style={{
                fontSize: "0.825rem",
                lineHeight: "1.5",
                color: "#a3acc2",
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                padding: "12px 14px",
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                margin: 0,
              }}
            >
              {requirement.description || "No project description provided."}
            </p>
          </div>

          {/* Character Roles Breakdown */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#eceaf5", margin: 0 }}>
                Character Roles Breakdown ({requirement.roles?.length || 0})
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {requirement.roles && requirement.roles.length > 0 ? (
                requirement.roles.map((role, idx) => (
                  <div
                    key={role.id || idx}
                    style={{
                      padding: "14px",
                      borderRadius: "14px",
                      backgroundColor: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#eceaf5" }}>
                          {role.roleName || role.name || `Role ${idx + 1}`}
                        </div>
                        <div style={{ fontSize: "0.725rem", color: "#a3acc2", marginTop: "1px" }}>
                          Artists required: <strong style={{ color: "var(--gold)" }}>{role.artistsCount || 1}</strong>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "999px",
                          backgroundColor: "rgba(255, 188, 0, 0.12)",
                          color: "var(--gold)",
                          border: "1px solid rgba(255, 188, 0, 0.30)",
                        }}
                      >
                        {role.gender || "Any Gender"}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                        gap: "6px",
                        fontSize: "0.75rem",
                        color: "#a3acc2",
                        marginBottom: "8px",
                      }}
                    >
                      <div>
                        <span style={{ color: "#7c869e" }}>Age: </span>
                        <strong style={{ color: "#eceaf5" }}>{role.ageRange || "Any"}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#7c869e" }}>Languages: </span>
                        <strong style={{ color: "#eceaf5" }}>{role.language || "Hindi / English"}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#7c869e" }}>Look: </span>
                        <strong style={{ color: "#eceaf5" }}>{role.look || "Not specified"}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#7c869e" }}>Skills: </span>
                        <strong style={{ color: "#eceaf5" }}>{role.skills || "Screen Acting"}</strong>
                      </div>
                    </div>

                    {role.notes && (
                      <div
                        style={{
                          fontSize: "0.725rem",
                          color: "#a3acc2",
                          fontStyle: "italic",
                          borderTop: "1px dashed rgba(255, 255, 255, 0.08)",
                          paddingTop: "6px",
                        }}
                      >
                        Note: {role.notes}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: "14px",
                    textAlign: "center",
                    color: "#a3acc2",
                    fontSize: "0.785rem",
                  }}
                >
                  No specific roles specified in this requirement brief.
                </div>
              )}
            </div>
          </div>

          {/* Required Materials */}
          {requirement.requiredMaterials && requirement.requiredMaterials.length > 0 && (
            <div>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#eceaf5", marginBottom: "6px" }}>
                Required Talent Submissions
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {requirement.requiredMaterials.map((mat, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: "0.725rem",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.10)",
                      color: "#eceaf5",
                      fontWeight: 600,
                    }}
                  >
                    ✓ {mat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Offline Clarification Log */}
          <div
            style={{
              borderRadius: "16px",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MessageSquare size={16} color="var(--gold)" />
                <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#eceaf5", margin: 0 }}>
                  Offline Admin Clarifications Log
                </h3>
              </div>
              <span style={{ fontSize: "0.7rem", color: "#a3acc2" }}>
                Internal notes &amp; phone log
              </span>
            </div>

            {/* Note list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
              {requirement.clarificationNotes && requirement.clarificationNotes.length > 0 ? (
                requirement.clarificationNotes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "12px",
                      backgroundColor: "#0a0f19",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      fontSize: "0.785rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "4px",
                      }}
                    >
                      <span style={{ fontWeight: 700, color: "var(--gold)", fontSize: "0.75rem" }}>
                        {note.author || note.adminName || "Admin"}
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "#7c869e" }}>
                        {note.time || note.timestamp}
                      </span>
                    </div>
                    <p style={{ color: "#eceaf5", lineHeight: 1.4, margin: 0 }}>
                      {note.text || note.note}
                    </p>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: "10px",
                    textAlign: "center",
                    color: "#a3acc2",
                    fontSize: "0.75rem",
                    backgroundColor: "#0a0f19",
                    borderRadius: "10px",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  No offline phone clarifications recorded yet. Record calls or rate confirmations below.
                </div>
              )}
            </div>

            {/* Add note form */}
            <form onSubmit={handleAddNote} style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
              <textarea
                rows={2}
                placeholder="Record offline clarification (e.g. 'Called recruiter on 2 Oct: budget confirmed at ₹60k/day, Mumbai studio verified')..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#eceaf5",
                  fontSize: "0.8rem",
                  resize: "vertical",
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  disabled={!newNoteText.trim()}
                  className="btn-primary"
                  style={{
                    padding: "6px 14px",
                    fontSize: "0.75rem",
                    borderRadius: "10px",
                    opacity: newNoteText.trim() ? 1 : 0.6,
                    cursor: newNoteText.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  <Plus size={13} /> Add Note
                </button>
              </div>
            </form>
          </div>

          {/* Quick Clarification Prompt Box */}
          {showClarificationPrompt && (
            <div
              style={{
                padding: "14px",
                borderRadius: "14px",
                backgroundColor: "rgba(255, 188, 0, 0.08)",
                border: "1px solid rgba(255, 188, 0, 0.35)",
              }}
            >
              <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--gold)", marginBottom: "6px" }}>
                Specify Clarification Required from Recruiter:
              </div>
              <textarea
                rows={2}
                placeholder="What details need offline clarification (budget, dates, roles, safety)?"
                value={clarificationReason}
                onChange={(e) => setClarificationReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#eceaf5",
                  fontSize: "0.8rem",
                  marginBottom: "8px",
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowClarificationPrompt(false)}
                  className="btn-secondary"
                  style={{
                    padding: "6px 12px",
                    fontSize: "0.785rem",
                    borderRadius: "10px",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!clarificationReason.trim()}
                  onClick={handleNeedsClarificationSubmit}
                  className="btn-primary"
                  style={{
                    padding: "6px 16px",
                    fontSize: "0.785rem",
                    borderRadius: "10px",
                    opacity: clarificationReason.trim() ? 1 : 0.6,
                    cursor: clarificationReason.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  Save &amp; Mark Needs Clarification
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            backgroundColor: "rgba(15, 22, 38, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: "8px" }}>
            {!isDeclined && !isPublished && (
              <button
                type="button"
                onClick={() => setShowDeclineModal(true)}
                style={{
                  padding: "8px 16px",
                  color: "#ff6b6b",
                  backgroundColor: "rgba(255, 107, 107, 0.12)",
                  border: "1px solid rgba(255, 107, 107, 0.35)",
                  borderRadius: "12px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                }}
              >
                <XCircle size={14} /> Decline
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {!isPublished && !isDeclined && (
              <>
                <button
                  type="button"
                  onClick={() => setShowClarificationPrompt(true)}
                  className="btn-secondary"
                  style={{
                    padding: "8px 14px",
                    color: "var(--gold)",
                    borderColor: "rgba(255, 188, 0, 0.35)",
                    fontSize: "0.8rem",
                    gap: "5px",
                    borderRadius: "12px",
                  }}
                >
                  <AlertCircle size={14} /> Needs Clarification
                </button>

                <button
                  type="button"
                  onClick={() => onMarkReadyToPublish(requirement.id)}
                  className="btn-secondary"
                  style={{
                    padding: "8px 14px",
                    color: "var(--gold)",
                    fontSize: "0.8rem",
                    gap: "5px",
                    borderRadius: "12px",
                  }}
                >
                  <CheckCircle2 size={14} /> Mark Ready
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onPublishAsCastingCall(requirement);
                    onClose();
                  }}
                  className="btn-primary"
                  style={{
                    padding: "8px 18px",
                    fontSize: "0.8rem",
                    gap: "6px",
                    borderRadius: "12px",
                  }}
                >
                  <Megaphone size={15} /> Publish as Casting Call
                </button>
              </>
            )}

            {isPublished && (
              <span
                style={{
                  fontSize: "0.825rem",
                  color: "var(--status-green)",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <CheckCircle2 size={16} /> Already Published Live
              </span>
            )}

            {isDeclined && (
              <span
                style={{
                  fontSize: "0.825rem",
                  color: "#ff6b6b",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <XCircle size={16} /> Request Declined
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Decline Reason Modal */}
      {showDeclineModal && (
        <ReasonModal
          isOpen={showDeclineModal}
          onClose={() => setShowDeclineModal(false)}
          title={`Decline Requirement: ${requirement.projectTitle || requirement.title}`}
          confirmLabel="Decline Requirement"
          confirmVariant="danger"
          quickReasons={[
            "Unrealistic lead time (shoot starts in less than 3 days)",
            "Budget does not meet minimum artist union guidelines",
            "Missing stunt safety insurance clearance",
            "Recruiter did not respond to offline clarification calls",
            "Incomplete project synopsis and role details",
          ]}
          onConfirm={(reason) => {
            onDecline(requirement.id, reason);
            setShowDeclineModal(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
