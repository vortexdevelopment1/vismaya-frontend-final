"use client";

import React from "react";
import { Check, X, Video, MapPin, Sparkles, CheckCircle2, ShieldAlert } from "lucide-react";
import StarRating from "./StarRating";

export default function CandidateCard({
  candidate,
  reqId,
  isLocked = false,
  onPreferenceChange,
  onViewProfile,
  onPlayAudition,
}) {
  const isSelected = candidate.selectionStatus === "Selected";
  const isRejected = candidate.selectionStatus === "Rejected";

  const handleSelect = (e) => {
    e.stopPropagation();
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

  const handleReject = (e) => {
    e.stopPropagation();
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

  const darkGradients = [
    "linear-gradient(135deg, #0f1626 0%, #070b12 100%)",
    "linear-gradient(135deg, #131c31 0%, #0a0f19 100%)",
    "linear-gradient(135deg, #1a233a 0%, #0f1626 100%)",
  ];
  const charCode = (candidate.id || "1").charCodeAt(0) || 0;
  const gradient = darkGradients[charCode % darkGradients.length];

  return (
    <div
      onClick={() => onViewProfile && onViewProfile(candidate)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onViewProfile && onViewProfile(candidate);
        }
      }}
      style={{
        backgroundColor: isSelected
          ? "rgba(255, 188, 0, 0.08)"
          : isRejected
          ? "rgba(255, 107, 107, 0.08)"
          : "var(--glass-bg)",
        border: `1px solid ${
          isSelected
            ? "var(--gold)"
            : isRejected
            ? "rgba(255, 107, 107, 0.4)"
            : "var(--glass-border)"
        }`,
        borderRadius: "20px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: isSelected
          ? "0 8px 24px rgba(255, 188, 0, 0.15)"
          : "var(--shadow-sm)",
        cursor: "pointer",
        position: "relative",
        transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
      }}
      className="candidate-card"
    >
      {/* Top Banner Ribbon / Match Score */}
      <div
        style={{
          position: "absolute",
          top: "14px",
          right: "14px",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {isSelected && (
          <span
            style={{
              fontSize: "0.725rem",
              fontWeight: "700",
              padding: "3px 10px",
              borderRadius: "99px",
              background: "var(--gold-gradient)",
              color: "var(--gold-text)",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              boxShadow: "var(--gold-glow)",
            }}
          >
            <Check size={12} strokeWidth={3} /> Selected
          </span>
        )}
        {isRejected && (
          <span
            style={{
              fontSize: "0.725rem",
              fontWeight: "700",
              padding: "3px 10px",
              borderRadius: "99px",
              backgroundColor: "var(--danger)",
              color: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              boxShadow: "0 2px 6px rgba(255, 107, 107, 0.35)",
            }}
          >
            <X size={12} strokeWidth={3} /> Rejected
          </span>
        )}
        {candidate.matchScore && (
          <span
            style={{
              fontSize: "0.725rem",
              fontWeight: "700",
              padding: "3px 10px",
              borderRadius: "99px",
              backgroundColor: "rgba(255, 188, 0, 0.12)",
              color: "var(--gold)",
              border: "1px solid rgba(255, 188, 0, 0.30)",
            }}
          >
            {candidate.matchScore} match
          </span>
        )}
      </div>

      <div style={{ padding: "22px" }}>
        {/* Candidate Photo & Header Info */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            {candidate.avatar ? (
              <img
                src={candidate.avatar}
                alt={candidate.name}
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "16px",
                  objectFit: "cover",
                  border: "1px solid rgba(255, 188, 0, 0.4)",
                }}
              />
            ) : (
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "16px",
                  background: gradient,
                  color: "var(--gold)",
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "1.35rem",
                }}
              >
                {candidate.initials || candidate.name?.charAt(0) || "T"}
              </div>
            )}
            <span
              style={{
                position: "absolute",
                bottom: "-2px",
                right: "-2px",
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                backgroundColor: "var(--success)",
                border: "2px solid var(--bg-primary)",
              }}
              title="Verified Artist"
            />
          </div>

          <div style={{ flex: 1, minWidth: 0, paddingRight: "70px" }}>
            <h3
              style={{
                fontSize: "1.08rem",
                fontWeight: "700",
                color: "var(--text-primary)",
                margin: "0 0 3px 0",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {candidate.name}
            </h3>
            <span
              style={{
                fontSize: "0.825rem",
                fontWeight: "700",
                color: "var(--gold)",
                display: "block",
                marginBottom: "4px",
              }}
            >
              {candidate.primaryRole}
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.785rem",
                color: "var(--text-muted)",
                flexWrap: "wrap",
              }}
            >
              <span>{candidate.age} yrs</span>
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

        {/* Admin Curator Note Box */}
        {candidate.adminCuratorNote && (
          <div
            style={{
              backgroundColor: "rgba(255, 188, 0, 0.08)",
              border: "1px solid rgba(255, 188, 0, 0.25)",
              borderRadius: "14px",
              padding: "10px 14px",
              fontSize: "0.785rem",
              color: "var(--text-secondary)",
              lineHeight: 1.45,
              marginBottom: "14px",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >
            <Sparkles size={14} style={{ color: "var(--gold)", flexShrink: 0, marginTop: "2px" }} />
            <p style={{ margin: 0 }}>
              <strong style={{ color: "var(--text-primary)" }}>Admin Note: </strong>
              {candidate.adminCuratorNote}
            </p>
          </div>
        )}

        {/* Languages & Key Skills Tags */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {(candidate.languages || []).slice(0, 3).map((lang, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: "0.725rem",
                  padding: "3px 10px",
                  borderRadius: "99px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-color)",
                  fontWeight: "500",
                }}
              >
                {lang}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {(candidate.skills || []).slice(0, 3).map((skill, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: "0.725rem",
                  padding: "3px 10px",
                  borderRadius: "99px",
                  backgroundColor: "rgba(255, 188, 0, 0.12)",
                  color: "var(--gold)",
                  border: "1px solid rgba(255, 188, 0, 0.28)",
                  fontWeight: "700",
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Watch Audition Clip Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPlayAudition && onPlayAudition(candidate);
          }}
          className="btn-secondary"
          style={{
            width: "100%",
            padding: "9px 14px",
            fontSize: "0.825rem",
            justifyContent: "center",
            gap: "8px",
            borderRadius: "12px",
          }}
        >
          <Video size={15} style={{ color: "var(--gold)" }} />
          <span>Watch Audition Clip ({candidate.auditionDuration || "1:20 min"})</span>
        </button>
      </div>

      {/* Footer Controls: Star Rating and Select / Reject buttons */}
      <div
        style={{
          padding: "16px 22px",
          backgroundColor: "var(--bg-surface-elevated)",
          borderTop: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.785rem", color: "var(--text-secondary)", fontWeight: "600" }}>
            Your Rating:
          </span>
          <StarRating
            rating={candidate.starRating || 0}
            onChange={handleRatingChange}
            disabled={isLocked}
            size={17}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {/* Select Button */}
          <button
            type="button"
            disabled={isLocked}
            onClick={handleSelect}
            style={{
              padding: "8px 14px",
              borderRadius: "12px",
              fontSize: "0.825rem",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              background: isSelected ? "var(--gold-gradient)" : "rgba(255, 188, 0, 0.12)",
              color: isSelected ? "var(--gold-text)" : "var(--gold)",
              border: `1px solid ${isSelected ? "var(--gold)" : "rgba(255, 188, 0, 0.35)"}`,
              cursor: isLocked ? "not-allowed" : "pointer",
              opacity: isLocked ? 0.6 : 1,
              transition: "all 0.15s ease",
              boxShadow: isSelected ? "var(--gold-glow)" : "none",
            }}
          >
            <Check size={14} strokeWidth={3} />
            <span>{isSelected ? "Selected" : "Select"}</span>
          </button>

          {/* Reject Button */}
          <button
            type="button"
            disabled={isLocked}
            onClick={handleReject}
            style={{
              padding: "8px 14px",
              borderRadius: "12px",
              fontSize: "0.825rem",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              backgroundColor: isRejected ? "var(--danger)" : "transparent",
              color: isRejected ? "#ffffff" : "var(--danger)",
              border: `1.5px solid var(--danger)`,
              cursor: isLocked ? "not-allowed" : "pointer",
              opacity: isLocked ? 0.6 : 1,
              transition: "all 0.15s ease",
              boxShadow: isRejected ? "0 2px 8px rgba(255, 107, 107, 0.3)" : "none",
            }}
          >
            <X size={14} strokeWidth={3} />
            <span>{isRejected ? "Rejected" : "Reject"}</span>
          </button>
        </div>

        {isLocked && (
          <span style={{ fontSize: "0.72rem", color: "var(--warning)", textAlign: "center", fontWeight: "600" }}>
            Feedback submitted to Admin • Locked
          </span>
        )}
      </div>

      <style jsx global>{`
        .candidate-card:hover {
          transform: translateY(-2px);
          border-color: var(--gold) !important;
          box-shadow: 0 8px 26px rgba(0, 0, 0, 0.4) !important;
        }
      `}</style>
    </div>
  );
}
