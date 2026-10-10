"use client";

import React from "react";
import Link from "next/link";
import { X, Calendar, MapPin, DollarSign, Clock, Users, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import RequirementStatusTracker from "./RequirementStatusTracker";

export default function RequirementDrawer({ requirement, isOpen, onClose }) {
  if (!isOpen || !requirement) return null;

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
          transition: "opacity 0.2s ease",
        }}
      />

      {/* Drawer Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "580px",
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
        {/* Drawer Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
            backgroundColor: "var(--bg-surface-elevated)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "0.725rem",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  padding: "3px 8px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: "rgba(255, 188, 0, 0.12)",
                  color: "var(--gold)",
                  border: "1px solid rgba(255, 188, 0, 0.30)",
                }}
              >
                {requirement.type}
              </span>
              <StatusBadge status={requirement.status} size="sm" />
            </div>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                color: "var(--text-primary)",
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {requirement.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              color: "var(--text-secondary)",
              padding: "8px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Status Pipeline Tracker */}
          <div
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-card)",
              padding: "16px 20px",
            }}
          >
            <span
              style={{
                fontSize: "0.785rem",
                fontWeight: "700",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Casting Progression
            </span>
            <RequirementStatusTracker
              status={requirement.status}
              statusStage={requirement.statusStage}
            />
          </div>

          {/* Admin Note Notice (If present) */}
          {requirement.adminNote && (
            <div
              style={{
                backgroundColor: "var(--warning-bg)",
                border: "1px solid var(--warning-border)",
                borderRadius: "var(--radius-md)",
                padding: "16px",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
              }}
            >
              <ShieldAlert size={18} style={{ color: "var(--warning)", flexShrink: 0, marginTop: "2px" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "0.825rem", fontWeight: "700", color: "var(--warning)" }}>
                  Vismaya Admin Clarification
                </span>
                <p style={{ fontSize: "0.8rem", color: "var(--text-primary)", margin: 0, lineHeight: 1.4 }}>
                  {requirement.adminNote}
                </p>
              </div>
            </div>
          )}

          {/* Shortlist Ready Jump Card (if shortlist exists) */}
          {requirement.hasShortlist && (
            <div
              style={{
                backgroundColor: "var(--secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-card)",
                padding: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Users size={20} style={{ color: "var(--gold)" }} />
                <div>
                  <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-primary)", display: "block" }}>
                    {requirement.shortlistCount} Shortlisted Candidates Ready
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                    {requirement.shortlistFeedbackSent ? "Feedback sent & preferences locked" : "Awaiting your selection & ratings"}
                  </span>
                </div>
              </div>

              <Link
                href={`/recruiter/shortlisted-talent?req=${requirement.id}`}
                onClick={onClose}
                className="btn-primary"
                style={{ padding: "8px 14px", fontSize: "0.8rem", whiteSpace: "nowrap" }}
              >
                Review Shortlist
              </Link>
            </div>
          )}

          {/* Project Overview */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <h3
              style={{
                fontSize: "0.875rem",
                fontWeight: "700",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                margin: 0,
              }}
            >
              Project Overview
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-primary)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {requirement.description}
            </p>
          </div>

          {/* Metadata Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px",
            }}
          >
            <div
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                padding: "14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                <MapPin size={14} /> Shoot Locations
              </span>
              <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--text-primary)" }}>
                {requirement.locations}
              </span>
            </div>

            <div
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                padding: "14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Calendar size={14} /> Shoot Dates
              </span>
              <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--text-primary)" }}>
                {requirement.shootStartDate} to {requirement.shootEndDate}
              </span>
            </div>

            <div
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                padding: "14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                <DollarSign size={14} /> Remuneration
              </span>
              <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--success)" }}>
                {requirement.budgetRange} ({requirement.budgetType})
              </span>
            </div>

            <div
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                padding: "14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={14} /> Application Deadline
              </span>
              <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--text-primary)" }}>
                {requirement.deadline || "Open"}
              </span>
            </div>
          </div>

          {/* Character Roles Breakdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3
              style={{
                fontSize: "0.875rem",
                fontWeight: "700",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                margin: 0,
              }}
            >
              Character Roles ({requirement.roles?.length || 0})
            </h3>

            {(requirement.roles || []).map((role, idx) => (
              <div
                key={role.id || idx}
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
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-primary)" }}>
                    {role.roleName}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 188, 0, 0.14)",
                      color: "var(--gold)",
                      border: "1px solid rgba(255, 188, 0, 0.3)",
                    }}
                  >
                    {role.artistsCount} {role.artistsCount === 1 ? "Artist" : "Artists"}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                    fontSize: "0.8rem",
                  }}
                >
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Age & Gender: </span>
                    <strong style={{ color: "var(--text-secondary)" }}>{role.ageRange} • {role.gender}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Languages: </span>
                    <strong style={{ color: "var(--text-secondary)" }}>{role.language}</strong>
                  </div>
                </div>

                {role.look && (
                  <div style={{ fontSize: "0.8rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Look/Appearance: </span>
                    <span style={{ color: "var(--text-secondary)" }}>{role.look}</span>
                  </div>
                )}

                {role.skills && (
                  <div style={{ fontSize: "0.8rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Key Skills: </span>
                    <span style={{ color: "var(--text-secondary)" }}>{role.skills}</span>
                  </div>
                )}

                {role.notes && (
                  <div style={{ fontSize: "0.8rem", fontStyle: "italic", color: "var(--text-muted)" }}>
                    Note: {role.notes}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Required Submission Materials */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <h3
              style={{
                fontSize: "0.875rem",
                fontWeight: "700",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                margin: 0,
              }}
            >
              Required Submission Materials
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {(requirement.requiredMaterials || []).map((mat, idx) => (
                <span
                  key={idx}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "var(--bg-surface-elevated)",
                    border: "1px solid var(--border-color)",
                    fontSize: "0.8rem",
                    color: "var(--text-primary)",
                  }}
                >
                  <CheckCircle2 size={13} style={{ color: "var(--success)" }} />
                  {mat}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-surface-elevated)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "12px",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: "8px 16px", fontSize: "0.85rem" }}
          >
            Close Details
          </button>
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
        `}</style>
      </div>
    </>
  );
}
