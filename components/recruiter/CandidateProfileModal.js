"use client";

import React, { useState } from "react";
import { X, Check, Star, Video, Image as ImageIcon, ShieldCheck, Sparkles, Play, Pause, AlertCircle } from "lucide-react";
import StarRating from "./StarRating";

export default function CandidateProfileModal({
  candidate,
  reqId,
  isLocked = false,
  isOpen,
  onClose,
  onPreferenceChange,
}) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "audition" | "portfolio"
  const [isPlaying, setIsPlaying] = useState(false);

  if (!isOpen || !candidate) return null;

  const isSelected = candidate.selectionStatus === "Selected";
  const isRejected = candidate.selectionStatus === "Rejected";

  const handleSelect = () => {
    if (isLocked) return;
    const newStatus = isSelected ? "Pending" : "Selected";
    if (onPreferenceChange) {
      onPreferenceChange({
        reqId,
        candidateId: candidate.id,
        selectionStatus: newStatus,
      });
    }
  };

  const handleReject = () => {
    if (isLocked) return;
    const newStatus = isRejected ? "Pending" : "Rejected";
    if (onPreferenceChange) {
      onPreferenceChange({
        reqId,
        candidateId: candidate.id,
        selectionStatus: newStatus,
      });
    }
  };

  const handleRatingChange = (rating) => {
    if (isLocked) return;
    if (onPreferenceChange) {
      onPreferenceChange({
        reqId,
        candidateId: candidate.id,
        starRating: rating,
      });
    }
  };

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
          zIndex: 100,
        }}
      />

      {/* Modal Container */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 110,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          pointerEvents: "none",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            pointerEvents: "auto",
            width: "100%",
            maxWidth: "760px",
            maxHeight: "90vh",
            backgroundColor: "var(--bg-alt)",
            border: "1px solid var(--glass-border-elevated)",
            borderRadius: "20px",
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            backdropFilter: "var(--glass-blur)",
            WebkitBackdropFilter: "var(--glass-blur)",
          }}
        >
          {/* Modal Header */}
          <div
            style={{
              padding: "24px 28px",
              borderBottom: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-surface-elevated)",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {candidate.avatar ? (
                <img
                  src={candidate.avatar}
                  alt={candidate.name}
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "16px",
                    objectFit: "cover",
                    border: "2px solid rgba(255, 188, 0, 0.4)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "16px",
                    background: "linear-gradient(135deg, #0f1626 0%, #070b12 100%)",
                    color: "var(--gold)",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "800",
                    fontSize: "1.5rem",
                  }}
                >
                  {candidate.initials || candidate.name?.charAt(0) || "T"}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <h2
                    style={{
                      fontSize: "1.35rem",
                      fontWeight: "700",
                      color: "var(--text-primary)",
                      margin: 0,
                    }}
                  >
                    {candidate.name}
                  </h2>
                  <span
                    style={{
                      fontSize: "0.725rem",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-pill)",
                      backgroundColor: "var(--success-bg)",
                      color: "var(--success)",
                      border: "1px solid var(--success-border)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <ShieldCheck size={12} /> Verified Artist
                  </span>
                  {candidate.matchScore && (
                    <span
                      style={{
                        fontSize: "0.725rem",
                        fontWeight: "700",
                        padding: "2px 8px",
                        borderRadius: "var(--radius-pill)",
                        backgroundColor: "rgba(255, 188, 0, 0.12)",
                        color: "var(--gold)",
                        border: "1px solid rgba(255, 188, 0, 0.30)",
                      }}
                    >
                      {candidate.matchScore} Match Score
                    </span>
                  )}
                </div>

                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Shortlisted for <strong style={{ color: "var(--gold)" }}>{candidate.primaryRole}</strong>
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.775rem", color: "var(--text-muted)" }}>
                  <span>{candidate.age} yrs</span>
                  <span>•</span>
                  <span>{candidate.gender}</span>
                  <span>•</span>
                  <span>{candidate.city}</span>
                  {candidate.height && (
                    <>
                      <span>•</span>
                      <span>{candidate.height}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close modal"
              style={{
                color: "var(--text-secondary)",
                padding: "8px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div
            style={{
              padding: "0 28px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              gap: "16px",
              backgroundColor: "var(--bg-surface)",
            }}
          >
            {[
              { id: "overview", label: "Artist Profile" },
              { id: "audition", label: "Audition Self-Tape", icon: Video },
              { id: "portfolio", label: `Comp Cards (${candidate.portfolioCount || 4})`, icon: ImageIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "14px 4px",
                  fontSize: "0.85rem",
                  fontWeight: activeTab === tab.id ? "700" : "500",
                  color: activeTab === tab.id ? "var(--gold)" : "var(--text-secondary)",
                  borderBottom: activeTab === tab.id ? "2px solid var(--gold)" : "2px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                  cursor: "pointer",
                  background: "transparent",
                  borderTop: "none",
                  borderLeft: "none",
                  borderRight: "none",
                }}
              >
                {tab.icon && <tab.icon size={14} />}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Modal Scrollable Body */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "24px 28px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {activeTab === "overview" && (
              <>
                {/* Admin Curation Note */}
                <div
                  style={{
                    backgroundColor: "rgba(255, 188, 0, 0.08)",
                    border: "1px solid rgba(255, 188, 0, 0.25)",
                    borderRadius: "var(--radius-md)",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.785rem", fontWeight: "700", color: "var(--gold)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Sparkles size={14} /> Vismaya Admin Curation Note
                    </span>
                    {candidate.adminScore && (
                      <span style={{ fontSize: "0.775rem", color: "var(--text-secondary)" }}>
                        Curation Rating: <strong style={{ color: "var(--text-primary)" }}>{candidate.adminScore}</strong>
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-primary)", margin: 0, fontStyle: "italic", lineHeight: 1.5 }}>
                    "{candidate.adminCuratorNote || "Candidate passed screen test and verified by Vismaya Senior Casting Director."}"
                  </p>
                </div>

                {/* Demographics & Physical Specs */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "0.785rem", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                    Physical Demographics
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                    <div style={{ backgroundColor: "var(--bg-surface-elevated)", padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Height</span>
                      <strong style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{candidate.height || "5'6\""}</strong>
                    </div>
                    <div style={{ backgroundColor: "var(--bg-surface-elevated)", padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Age</span>
                      <strong style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{candidate.age} Years</strong>
                    </div>
                    <div style={{ backgroundColor: "var(--bg-surface-elevated)", padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>City</span>
                      <strong style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{candidate.city}</strong>
                    </div>
                    <div style={{ backgroundColor: "var(--bg-surface-elevated)", padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Gender</span>
                      <strong style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{candidate.gender}</strong>
                    </div>
                  </div>
                  {candidate.physicalAttributes && (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      {candidate.physicalAttributes}
                    </span>
                  )}
                </div>

                {/* Experience & Past Work */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "0.785rem", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                    Screen Experience & Credits
                  </span>
                  <div style={{ backgroundColor: "var(--bg-surface-elevated)", padding: "14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.825rem", color: "var(--text-primary)", lineHeight: 1.5 }}>
                    {candidate.experience || "Extensive theatre and digital commercial screen experience."}
                  </div>
                </div>

                {/* Languages & Skills */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <span style={{ fontSize: "0.785rem", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                      Languages Spoken
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {(candidate.languages || []).map((lang, idx) => (
                        <span key={idx} style={{ fontSize: "0.75rem", padding: "4px 10px", borderRadius: "var(--radius-xs)", backgroundColor: "var(--bg-surface-elevated)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}>
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.785rem", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                      Acting Skills
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {(candidate.skills || []).map((skill, idx) => (
                        <span key={idx} style={{ fontSize: "0.75rem", padding: "4px 10px", borderRadius: "var(--radius-xs)", backgroundColor: "rgba(255, 188, 0, 0.12)", border: "1px solid rgba(255, 188, 0, 0.30)", color: "var(--gold)", fontWeight: "600" }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "audition" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    backgroundColor: "var(--bg-deep)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {isPlaying ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "40px", height: "40px", border: "3px solid var(--gold)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                      <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#ffffff" }}>
                        Streaming Audition Monologue Self-Tape...
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsPlaying(false)}
                        className="btn-secondary"
                        style={{ padding: "6px 14px", fontSize: "0.75rem" }}
                      >
                        <Pause size={14} /> Pause Video
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", textAlign: "center", padding: "20px" }}>
                      <button
                        type="button"
                        onClick={() => setIsPlaying(true)}
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "50%",
                          background: "var(--gold-gradient)",
                          color: "var(--gold-text)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "var(--gold-glow)",
                          cursor: "pointer",
                          transition: "transform 0.15s ease",
                          border: "none",
                        }}
                      >
                        <Play size={22} fill="var(--gold-text)" style={{ marginLeft: "3px" }} />
                      </button>
                      <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "#ffffff" }}>
                        {candidate.auditionClipTitle || "Self-Tape Monologue Audition Submission"}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--gold)" }}>
                        Duration: {candidate.auditionDuration || "1:24 min"} • 1080p HD Studio Quality
                      </span>
                    </div>
                  )}

                  <div style={{ position: "absolute", bottom: "10px", left: "14px", right: "14px", display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    <span>Role: {candidate.primaryRole}</span>
                    <span>Curated via Vismaya Talent Portal</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "portfolio" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                {[
                  "Close-up Headshot",
                  "Left Profile",
                  "Right Profile",
                  "Full Body Front",
                  "Casual Look",
                  "Character Expression",
                ].map((title, idx) => (
                  <div
                    key={idx}
                    style={{
                      aspectRatio: "3/4",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--bg-surface-elevated)",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "12px",
                      textAlign: "center",
                      gap: "6px",
                    }}
                  >
                    <ImageIcon size={24} style={{ color: "var(--gold)" }} />
                    <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-primary)" }}>
                      {title}
                    </span>
                    <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                      Comp Card
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Offline Casting Policy Notice */}
            <div
              style={{
                backgroundColor: "var(--warning-bg)",
                border: "1px solid var(--warning-border)",
                borderRadius: "var(--radius-md)",
                padding: "12px 16px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                fontSize: "0.775rem",
                color: "var(--warning)",
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>
                <strong>Vismaya Policy:</strong> Vismaya coordinates all auditions and bookings. You do not need to contact talent directly.
              </span>
            </div>
          </div>

          {/* Modal Sticky Bottom Controls */}
          <div
            style={{
              padding: "16px 28px",
              borderTop: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-surface-elevated)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>
                Your Star Rating:
              </span>
              <StarRating
                rating={candidate.starRating || 0}
                onChange={handleRatingChange}
                disabled={isLocked}
                size={18}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Reject Button */}
              <button
                type="button"
                disabled={isLocked}
                onClick={handleReject}
                style={{
                  padding: "8px 18px",
                  borderRadius: "12px",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: isRejected ? "var(--danger)" : "transparent",
                  color: isRejected ? "#ffffff" : "var(--danger)",
                  border: "1.5px solid var(--danger)",
                  cursor: isLocked ? "not-allowed" : "pointer",
                  opacity: isLocked ? 0.6 : 1,
                  boxShadow: isRejected ? "0 2px 8px rgba(255, 107, 107, 0.3)" : "none",
                }}
              >
                <X size={14} strokeWidth={2.5} />
                <span>{isRejected ? "Rejected" : "Reject"}</span>
              </button>

              {/* Select Button */}
              <button
                type="button"
                disabled={isLocked}
                onClick={handleSelect}
                style={{
                  padding: "8px 22px",
                  borderRadius: "12px",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: isSelected ? "var(--gold-gradient)" : "rgba(255, 188, 0, 0.12)",
                  color: isSelected ? "var(--gold-text)" : "var(--gold)",
                  border: `1px solid ${isSelected ? "var(--gold)" : "rgba(255, 188, 0, 0.35)"}`,
                  boxShadow: isSelected ? "var(--gold-glow)" : "none",
                  cursor: isLocked ? "not-allowed" : "pointer",
                  opacity: isLocked ? 0.6 : 1,
                }}
              >
                <Check size={14} strokeWidth={2.5} />
                <span>{isSelected ? "Selected" : "Select Artist"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
