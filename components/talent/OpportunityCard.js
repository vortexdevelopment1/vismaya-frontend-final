"use client";

import React from "react";
import Link from "next/link";
import {
  MapPin,
  Users,
  Clock,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Banknote,
} from "lucide-react";
import { useWorkflow } from "@/lib/shared/workflowStore";
import { formatDate } from "@/lib/shared/dateUtils";

export default function OpportunityCard({ opportunity, project, onApply }) {
  const { applications } = useWorkflow();

  const currentTalentId = "tal-904";
  const isApplied = applications.some(
    (app) => app.opportunityId === opportunity.id && app.talentId === currentTalentId
  );

  const now = new Date().getTime();
  const deadlineTime = new Date(opportunity.deadline).getTime();
  const diffDays = Math.ceil((deadlineTime - now) / (1000 * 60 * 60 * 24));
  const isExpired = diffDays < 0;
  const isUrgent = diffDays >= 0 && diffDays <= 3;

  const gradients = [
    "linear-gradient(135deg, #070b12 0%, #0f1626 50%, rgba(255, 188, 0, 0.15) 100%)",
    "linear-gradient(155deg, #0a0f19 0%, #141c2e 50%, rgba(255, 188, 0, 0.18) 100%)",
    "linear-gradient(175deg, #070b12 0%, #10192b 50%, rgba(255, 213, 74, 0.15) 100%)",
    "linear-gradient(120deg, #0a0f19 0%, #151e33 50%, rgba(255, 188, 0, 0.16) 100%)",
  ];
  const charCode = (opportunity.id || "1").charCodeAt(opportunity.id.length - 1) || 0;
  const gradient = gradients[charCode % gradients.length];

  const rolesCount = opportunity.roles ? opportunity.roles.length : 1;

  return (
    <div
      className="card-surface"
      style={{
        border: `1px solid ${isUrgent ? "rgba(255, 107, 107, 0.40)" : "rgba(255, 255, 255, 0.12)"}`,
        borderRadius: "16px",
        backgroundColor: "rgba(255, 255, 255, 0.07)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.2s ease, border-color 0.2s ease",
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          height: "120px",
          width: "100%",
          background: gradient,
          position: "relative",
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Top Badges Row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 2 }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: "800",
              padding: "4px 10px",
              borderRadius: "999px",
              backgroundColor: "rgba(255, 255, 255, 0.10)",
              backdropFilter: "blur(6px)",
              color: "#eceaf5",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {opportunity.opportunityType || "OTT Series"}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {isUrgent && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "800",
                  padding: "3px 10px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(255, 107, 107, 0.22)",
                  color: "#ff6b6b",
                  border: "1px solid rgba(255, 107, 107, 0.45)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  textTransform: "uppercase",
                }}
              >
                <Clock size={11} />
                {diffDays === 0 ? "Closes Today" : diffDays === 1 ? "1 Day Left" : `${diffDays}d Left`}
              </span>
            )}

            {isExpired && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  padding: "3px 10px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  color: "#a3acc2",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  textTransform: "uppercase",
                }}
              >
                Deadline Passed
              </span>
            )}
          </div>
        </div>

        {/* Bottom Location & Deadline */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 2,
            fontSize: "12px",
            color: "#eceaf5",
            fontWeight: "600",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <MapPin size={13} style={{ color: "var(--gold)" }} />
            {opportunity.location || "Mumbai"}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Calendar size={12} style={{ color: "var(--gold)" }} />
            {formatDate(opportunity.deadline)}
          </span>
        </div>
      </div>

      {/* Card Content Area */}
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <Link
            href={`/talent/opportunities/${opportunity.id}`}
            style={{
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-heading), 'Playfair Display', serif",
                fontSize: "18px",
                fontWeight: "700",
                color: "#eceaf5",
                margin: 0,
                lineHeight: 1.35,
                transition: "color 0.2s ease",
              }}
              className="opp-card-title"
            >
              {opportunity.title}
            </h3>
          </Link>

          <span style={{ fontSize: "12px", color: "#a3acc2", fontWeight: "500", display: "flex", alignItems: "center", gap: "4px" }}>
            Project: <strong style={{ color: "#eceaf5" }}>{project?.title || "Production Feature"}</strong>
          </span>
        </div>

        <p
          style={{
            fontSize: "13px",
            color: "#a3acc2",
            lineHeight: 1.5,
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {opportunity.summary || opportunity.fullBrief || "Seeking verified talent for upcoming production casting."}
        </p>

        {/* Remuneration Strip */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            padding: "10px 14px",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
            fontSize: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Banknote size={15} style={{ color: "var(--gold)" }} />
            <span style={{ color: "var(--gold)", fontWeight: "700" }}>
              {opportunity.remuneration || "Negotiable"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#a3acc2", fontWeight: "600" }}>
            <Users size={13} style={{ color: "var(--gold)" }} />
            <span>{rolesCount} Role{rolesCount > 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: "6px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Link
            href={`/talent/opportunities/${opportunity.id}`}
            className="btn-secondary btn-dash"
            style={{
              flex: 1,
              textAlign: "center",
              justifyContent: "center",
              minHeight: "44px",
            }}
          >
            <span>View Brief</span>
          </Link>

          {isApplied ? (
            <button
              disabled
              style={{
                flex: 1,
                minHeight: "44px",
                padding: "0 14px",
                fontSize: "11px",
                borderRadius: "12px",
                backgroundColor: "rgba(52, 211, 153, 0.16)",
                color: "var(--status-green)",
                border: "1px solid rgba(52, 211, 153, 0.35)",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "default",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              <CheckCircle2 size={14} />
              <span>Applied</span>
            </button>
          ) : isExpired ? (
            <button
              disabled
              style={{
                flex: 1,
                minHeight: "44px",
                padding: "0 14px",
                fontSize: "11px",
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "#7e89a3",
                border: "1px solid rgba(255, 255, 255, 0.10)",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "not-allowed",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Closed
            </button>
          ) : (
            <button
              onClick={() => (onApply ? onApply(opportunity) : null)}
              className="btn-primary btn-dash"
              style={{
                flex: 1,
                justifyContent: "center",
                minHeight: "44px",
              }}
            >
              <span>Apply</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .opp-card-title:hover {
          color: var(--gold) !important;
        }
      `}</style>
    </div>
  );
}
