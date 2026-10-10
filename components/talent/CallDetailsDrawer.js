"use client";

import React from "react";
import {
  X,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import { useTalent } from "@/lib/talent/TalentContext";

export default function CallDetailsDrawer({ isOpen, onClose, call, onApply }) {
  const { applications } = useTalent();

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !call) return null;

  const isApplied = applications.some((app) => app.callId === call.id);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(7, 11, 18, 0.75)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          animation: "fadeIn 0.2s ease-out",
        }}
      />

      {/* Slide-in Panel */}
      <div
        className="card-surface talent-call-drawer"
        style={{
          position: "relative",
          zIndex: 101,
          width: "100%",
          maxWidth: "580px",
          height: "100dvh",
          maxHeight: "100dvh",
          borderLeft: "1px solid var(--border-color)",
          borderRadius: 0,
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          overflowY: "auto",
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "clamp(16px, 3vw, 24px)",
            paddingTop: "calc(clamp(16px, 3vw, 24px) + env(safe-area-inset-top, 0px))",
            borderBottom: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-surface-elevated)",
            position: "sticky",
            top: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span
                style={{
                  fontSize: "0.725rem",
                  fontWeight: "700",
                  padding: "3px 10px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: "rgba(255, 188, 0, 0.12)",
                  color: "var(--gold)",
                  border: "1px solid rgba(255, 188, 0, 0.30)",
                  textTransform: "uppercase",
                }}
              >
                {call.category}
              </span>
              <StatusBadge status={call.budgetType} size="xs" showDot={false} />
            </div>

            <h2 style={{ fontSize: "clamp(1.15rem, 2.5vw, 1.35rem)", fontWeight: "700", color: "var(--text-primary)", margin: 0, lineHeight: 1.3, overflowWrap: "anywhere" }}>
              {call.title}
            </h2>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px", display: "block" }}>
              Posted by Vismaya Admin • Production: <strong style={{ color: "var(--text-primary)" }}>{call.production}</strong>
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              color: "var(--text-secondary)",
              padding: "8px",
              minHeight: "44px",
              minWidth: "44px",
              borderRadius: "var(--radius-pill)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body Content */}
        <div style={{ padding: "clamp(16px, 3vw, 24px)", display: "flex", flexDirection: "column", gap: "24px", flex: 1 }}>
          {/* Quick Metrics Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >
            <div
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                <MapPin size={12} /> Primary Location
              </span>
              <span style={{ fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: "600" }}>{call.city}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{call.location}</span>
            </div>

            <div
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                <Calendar size={12} /> Shoot Dates
              </span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: "600" }}>{call.dates}</span>
              <span style={{ fontSize: "0.75rem", color: call.daysLeft <= 3 ? "var(--danger)" : "var(--text-muted)", fontWeight: call.daysLeft <= 3 ? "700" : "normal" }}>
                Deadline: {call.deadline} ({call.daysLeft} days left)
              </span>
            </div>
          </div>

          {/* Remuneration & Compensation */}
          <div
            style={{
              backgroundColor: "var(--success-bg)",
              border: "1px solid var(--success-border)",
              borderRadius: "var(--radius-md)",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>
                Compensation / Remuneration
              </span>
              <span style={{ fontSize: "1rem", fontWeight: "700", color: "var(--success)" }}>
                {call.budgetLabel}
              </span>
            </div>
            <StatusBadge status={call.budgetType} size="sm" />
          </div>

          {/* Project Overview */}
          <div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-primary)", marginBottom: "8px" }}>
              Project Synopsis &amp; Overview
            </h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, margin: 0, overflowWrap: "anywhere" }}>
              {call.description}
            </p>
          </div>

          {/* Roles Breakdown */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                Open Character Roles ({call.roles ? call.roles.length : 1})
              </h4>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Admin Curated</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {(call.roles || []).map((role, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "var(--bg-surface-elevated)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                    <span style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-primary)" }}>
                      {role.roleName}
                    </span>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: "600",
                        padding: "2px 10px",
                        borderRadius: "var(--radius-pill)",
                        backgroundColor: "rgba(255, 188, 0, 0.12)",
                        color: "var(--gold)",
                        border: "1px solid rgba(255, 188, 0, 0.30)",
                      }}
                    >
                      {role.gender}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "6px", fontSize: "0.8rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>
                      Age Bracket: <strong style={{ color: "var(--text-primary)" }}>{role.ageRange}</strong>
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>
                      Languages: <strong style={{ color: "var(--text-primary)" }}>{role.language}</strong>
                    </span>
                  </div>

                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                    <span style={{ color: "var(--text-muted)" }}>Desired Look: </span>
                    {role.look}
                  </div>

                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                    <span style={{ color: "var(--text-muted)" }}>Key Skills: </span>
                    {role.skills}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submission Requirements & Eligibility */}
          <div
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div>
              <span style={{ fontSize: "0.785rem", fontWeight: "700", color: "var(--text-primary)", display: "block", marginBottom: "3px" }}>
                Required Submission Materials:
              </span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                {call.requiredMaterials}
              </span>
            </div>

            <div>
              <span style={{ fontSize: "0.785rem", fontWeight: "700", color: "var(--text-primary)", display: "block", marginBottom: "3px" }}>
                Eligibility Criteria:
              </span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                {call.eligibility}
              </span>
            </div>
          </div>
        </div>

        {/* Drawer Sticky Footer Action */}
        <div
          style={{
            padding: "16px 24px",
            paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
            borderTop: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-surface-elevated)",
            position: "sticky",
            bottom: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <button onClick={onClose} className="btn-secondary" style={{ padding: "10px 18px", minHeight: "44px", fontSize: "0.875rem", borderRadius: "12px" }}>
            Close
          </button>

          {isApplied ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--success)",
                fontWeight: "600",
                fontSize: "0.9rem",
              }}
            >
              <CheckCircle2 size={18} />
              <span>Already Applied for this Project</span>
            </div>
          ) : (
            <button
              onClick={() => {
                onClose();
                onApply(call);
              }}
              className="btn-primary"
              style={{ padding: "10px 22px", minHeight: "44px", fontSize: "0.9rem", borderRadius: "12px" }}
            >
              <span>Apply for this Call</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @media (max-width: 767.98px) {
          .talent-call-drawer {
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
}
