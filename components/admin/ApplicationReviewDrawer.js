"use client";

import React, { useState } from "react";
import {
  X,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Video,
  Play,
  Pause,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Sparkles,
  FileText,
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";

export default function ApplicationReviewDrawer({
  isOpen,
  onClose,
  application,
  onStatusChange,
}) {
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  if (!isOpen || !application) return null;

  const hasAuditionClip = application.hasAuditionClip && application.auditionClipUrl;

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

      {/* Drawer Container */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "640px",
          maxWidth: "100vw",
          backgroundColor: "var(--bg-alt)",
          borderLeft: "1px solid var(--glass-border-elevated)",
          boxShadow: "var(--shadow-lg)",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          backdropFilter: "var(--glass-blur)",
          WebkitBackdropFilter: "var(--glass-blur)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "14px",
            backgroundColor: "var(--bg-surface-elevated)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <img
              src={application.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"}
              alt={application.applicantName}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                objectFit: "cover",
                border: "1px solid rgba(255, 188, 0, 0.3)",
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--gold)",
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "rgba(255, 188, 0, 0.12)",
                    border: "1px solid rgba(255, 188, 0, 0.30)",
                  }}
                >
                  {application.id}
                </span>
                <StatusBadge status={application.status} size="xs" />
              </div>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {application.applicantName}
              </h2>
              <p style={{ fontSize: "0.785rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                Applied for: <strong style={{ color: "var(--gold)" }}>{application.roleApplied}</strong>
              </p>
            </div>
          </div>

            <button
              onClick={onClose}
              aria-label="Close drawer"
              style={{
                padding: "6px",
                borderRadius: "10px",
                color: "var(--text-secondary)",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Quick Details Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "8px",
              }}
            >
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "12px",
                  backgroundColor: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Location
                </div>
                <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                  {application.city}, {application.state || "India"}
                </div>
              </div>

              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "12px",
                  backgroundColor: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Age & Gender
                </div>
                <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                  {application.age} yrs &bull; {application.gender}
                </div>
              </div>

              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "12px",
                  backgroundColor: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Applied Date
                </div>
                <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                  {application.appliedDate}
                </div>
              </div>

              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "12px",
                  backgroundColor: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Audition Tape
                </div>
                <div
                  style={{
                    fontSize: "0.785rem",
                    fontWeight: 700,
                    color: hasAuditionClip ? "var(--gold)" : "var(--text-muted)",
                    marginTop: "2px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Video size={13} />
                  {hasAuditionClip ? "Tape Attached" : "No Tape"}
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "14px",
                backgroundColor: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-color)",
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                <Mail size={13} color="var(--gold)" />
                {application.email}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                <Phone size={13} color="var(--gold)" />
                {application.phone}
              </div>
            </div>

            {/* Audition Tape Player */}
            {hasAuditionClip && (
              <div>
                <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Video size={14} color="var(--gold)" />
                  Audition Self-Tape: {application.auditionClipTitle || "Role Audition"}
                </h3>
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    backgroundColor: "var(--bg-deep)",
                    borderRadius: "16px",
                    border: "1px solid var(--border-color)",
                    overflow: "hidden",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isPlayingVideo ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "20px", textAlign: "center" }}>
                      <div style={{ width: "32px", height: "32px", border: "3px solid var(--gold)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                      <span style={{ fontSize: "0.8rem", color: "#ffffff", fontWeight: 600 }}>Streaming 1080p audition tape...</span>
                      <button
                        type="button"
                        onClick={() => setIsPlayingVideo(false)}
                        style={{
                          padding: "5px 12px",
                          borderRadius: "10px",
                          backgroundColor: "var(--bg-surface-elevated)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border-color)",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Pause size={12} /> Pause Preview
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", textAlign: "center", padding: "20px" }}>
                      <button
                        type="button"
                        onClick={() => setIsPlayingVideo(true)}
                        style={{
                          width: "46px",
                          height: "46px",
                          borderRadius: "50%",
                          background: "var(--gold-gradient)",
                          color: "var(--gold-text)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "none",
                          boxShadow: "var(--gold-glow)",
                          cursor: "pointer",
                        }}
                      >
                        <Play size={18} fill="var(--gold-text)" style={{ marginLeft: "2px" }} />
                      </button>
                      <span style={{ fontSize: "0.825rem", fontWeight: 700, color: "#ffffff", marginTop: "2px" }}>
                        Play Audition Tape
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "var(--gold)" }}>
                        Duration: 1m 35s &bull; High Resolution Audio
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Artist Bio */}
            <div>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
                Artist Bio & Background
              </h3>
              <p
                style={{
                  fontSize: "0.825rem",
                  lineHeight: "1.5",
                  color: "var(--text-secondary)",
                  backgroundColor: "var(--bg-surface-elevated)",
                  padding: "10px 14px",
                  borderRadius: "14px",
                  border: "1px solid var(--border-color)",
                  margin: 0,
                }}
              >
                {application.bio || "No detailed biography provided."}
              </p>
            </div>

            {/* Skills & Languages */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <h3 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
                  Skills
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                  {application.skills && application.skills.length > 0 ? (
                    application.skills.map((s, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: "0.725rem",
                          padding: "2px 8px",
                          borderRadius: "var(--radius-pill)",
                          backgroundColor: "var(--bg-surface-elevated)",
                          border: "1px solid var(--border-color)",
                          color: "var(--text-secondary)",
                          fontWeight: 600,
                        }}
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>None listed</span>
                  )}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
                  Languages
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                  {application.languages && application.languages.length > 0 ? (
                    application.languages.map((l, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: "0.725rem",
                          padding: "2px 8px",
                          borderRadius: "var(--radius-pill)",
                          backgroundColor: "rgba(255, 188, 0, 0.12)",
                          border: "1px solid rgba(255, 188, 0, 0.30)",
                          color: "var(--gold)",
                          fontWeight: 700,
                        }}
                      >
                        {l}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>None listed</span>
                  )}
                </div>
              </div>
            </div>

            {/* Physical Attributes */}
            {application.physical && (
              <div>
                <h3 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
                  Physical Attributes
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "6px",
                    fontSize: "0.785rem",
                    color: "var(--text-secondary)",
                    backgroundColor: "var(--bg-surface-elevated)",
                    padding: "10px",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Height: </span>
                    <strong>{application.physical.height || "N/A"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Weight: </span>
                    <strong>{application.physical.weight || "N/A"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Complexion: </span>
                    <strong>{application.physical.skinTone || "N/A"}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Portfolio Headshots */}
            {application.portfolio && application.portfolio.length > 0 && (
              <div>
                <h3 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
                  Portfolio Headshots
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  {application.portfolio.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        height: "100px",
                        borderRadius: "12px",
                        overflow: "hidden",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "var(--bg-surface-elevated)",
                      }}
                    >
                      {item.type === "Photo" ? (
                        <img
                          src={item.url}
                          alt={item.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.7rem", flexDirection: "column", gap: "2px" }}>
                          <Video size={16} />
                          <span>Video Reel</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Evaluation Notes */}
            {application.notes && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 188, 0, 0.08)",
                  border: "1px solid rgba(255, 188, 0, 0.25)",
                }}
              >
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--gold)", marginBottom: "2px" }}>
                  Admin Screening Notes:
                </div>
                <p style={{ fontSize: "0.785rem", color: "var(--text-secondary)", lineHeight: 1.35, margin: 0 }}>
                  {application.notes}
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: "14px 22px",
              borderTop: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-surface-elevated)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => onStatusChange(application.id, "Not Selected")}
              style={{
                padding: "8px 16px",
                borderRadius: "12px",
                backgroundColor: "rgba(255, 107, 107, 0.12)",
                color: "var(--danger)",
                border: "1px solid var(--danger-border)",
                fontSize: "0.785rem",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer",
              }}
            >
              <XCircle size={13} /> Mark Not Selected
            </button>

            <div style={{ display: "flex", gap: "8px" }}>
              {application.status !== "Under Review" && (
                <button
                  type="button"
                  onClick={() => onStatusChange(application.id, "Under Review")}
                  className="btn-secondary"
                  style={{
                    padding: "8px 16px",
                    fontSize: "0.785rem",
                    gap: "4px",
                    borderRadius: "12px",
                  }}
                >
                  <Clock size={13} /> Move Under Review
                </button>
              )}

              <button
                type="button"
                onClick={() => onStatusChange(application.id, "Shortlisted")}
                className="btn-primary"
                style={{
                  padding: "8px 18px",
                  fontSize: "0.785rem",
                  gap: "5px",
                  borderRadius: "12px",
                }}
              >
                <Award size={13} /> Shortlist Candidate
              </button>
            </div>
          </div>
      </div>
    </>
  );
}
