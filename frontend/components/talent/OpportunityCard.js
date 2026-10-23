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
import { useAuth } from "@/context/AuthContext";
import { useTalent } from "@/lib/talent/TalentContext";
import { isRealMode } from "@/lib/api/config";

export default function OpportunityCard({ opportunity, project, onApply }) {
  const { user } = useAuth();
  const { profile } = useTalent();
  const { applications } = useWorkflow();

  const currentTalentId = user?.id || user?._id || profile?.id || profile?._id || profile?.userId || (!isRealMode("talent") ? "tal-904" : "");
  const isApplied = applications.some(
    (app) => (app.opportunityId === opportunity.id || app.opportunityId === opportunity._id) && (
      app.talentId === currentTalentId ||
      app.talentId?._id === currentTalentId ||
      app.talentId?.id === currentTalentId ||
      app.userId === currentTalentId
    )
  );

  const now = new Date().getTime();
  const deadlineTime = new Date(opportunity.deadline).getTime();
  const diffDays = Math.ceil((deadlineTime - now) / (1000 * 60 * 60 * 24));
  const isExpired = diffDays < 0;
  const isUrgent = diffDays >= 0 && diffDays <= 3;

  const rolesCount = opportunity.roles ? opportunity.roles.length : 1;

  return (
    <div
      className="card-surface"
      style={{
        border: "1px solid #E8E2D4",
        borderRadius: "18px",
        backgroundColor: "#FFFFFF",
        boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
      }}
    >
      {/* Header Banner - Clean Soft Cream Tint Header */}
      <div
        style={{
          minHeight: "88px",
          flexShrink: 0,
          width: "100%",
          backgroundColor: "#F3EFE6",
          position: "relative",
          padding: "14px 18px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "10px",
          borderBottom: "1px solid #E8E2D4",
        }}
      >
        {/* Top Badges Row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 2 }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: "700",
              padding: "3px 10px",
              borderRadius: "999px",
              backgroundColor: "rgba(201, 165, 92, 0.18)",
              color: "#6E5420",
              border: "1px solid rgba(138, 107, 46, 0.22)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
            }}
          >
            {opportunity.opportunityType || "OTT Series"}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {isUrgent && (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "3px 10px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(138, 107, 46, 0.12)",
                  color: "#6E5420",
                  border: "1px solid rgba(138, 107, 46, 0.28)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
                }}
              >
                <Clock size={11} />
                {diffDays === 0 ? "Closes Today" : diffDays === 1 ? "1 Day Left" : `${diffDays}d Left`}
              </span>
            )}

            {isExpired && (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "3px 10px",
                  borderRadius: "999px",
                  backgroundColor: "#FFFFFF",
                  color: "#5A584F",
                  border: "1px solid #E8E2D4",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
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
            color: "#5A584F",
            fontWeight: "600",
            fontFamily: "var(--font-body), 'Inter', sans-serif",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <MapPin size={13} style={{ color: "#8A6B2E" }} />
            {opportunity.location || "Mumbai"}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <Calendar size={13} style={{ color: "#8A6B2E" }} />
            {formatDate(opportunity.deadline)}
          </span>
        </div>
      </div>

      {/* Card Content Area */}
      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
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
                fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                fontSize: "18px",
                fontWeight: "600",
                color: "#2B2D2A",
                margin: 0,
                lineHeight: "1.35",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                minHeight: "2.7em",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
                transition: "color 0.16s ease",
              }}
              className="opp-card-title"
            >
              {opportunity.title}
            </h3>
          </Link>

          <span
            style={{
              fontSize: "12px",
              color: "#5A584F",
              fontWeight: "500",
              display: "block",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minHeight: "1.4em",
              lineHeight: "1.4",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
            }}
          >
            Project: <strong style={{ color: "#2B2D2A" }}>{project?.title || "Production Feature"}</strong>
          </span>
        </div>

        <p
          style={{
            fontSize: "13px",
            color: "#5A584F",
            lineHeight: "1.5",
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "3em",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            fontFamily: "var(--font-body), 'Inter', sans-serif",
          }}
        >
          {opportunity.summary || opportunity.fullBrief || "Seeking verified talent for upcoming production casting."}
        </p>

        {/* Remuneration Strip */}
        <div
          style={{
            backgroundColor: "#F3EFE6",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid #E8E2D4",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
            fontSize: "12px",
            minHeight: "42px",
            fontFamily: "var(--font-body), 'Inter', sans-serif",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Banknote size={15} style={{ color: "#8A6B2E" }} />
            <span style={{ color: "#8A6B2E", fontWeight: "700" }}>
              {opportunity.remuneration || "Not disclosed"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#5A584F", fontWeight: "600" }}>
            <Users size={13} style={{ color: "#8A6B2E" }} />
            <span>{rolesCount} Role{rolesCount > 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Action Buttons Pinned to Bottom */}
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
            style={{
              flex: 1,
              textAlign: "center",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: "40px",
              minHeight: "40px",
              borderRadius: "10px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #8A6B2E",
              color: "#8A6B2E",
              fontSize: "13px",
              fontWeight: "600",
              textDecoration: "none",
              transition: "all 0.16s ease",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
            }}
            className="opp-card-brief-btn"
          >
            <span>View Brief</span>
          </Link>

          {isApplied ? (
            <button
              disabled
              style={{
                flex: 1,
                height: "40px",
                minHeight: "40px",
                padding: "0 14px",
                fontSize: "12px",
                borderRadius: "10px",
                backgroundColor: "#F3EFE6",
                color: "#2B2D2A",
                border: "1px solid #E8E2D4",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "default",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontFamily: "var(--font-body), 'Inter', sans-serif",
              }}
            >
              <CheckCircle2 size={14} style={{ color: "#8A6B2E" }} />
              <span>Applied</span>
            </button>
          ) : isExpired ? (
            <button
              disabled
              style={{
                flex: 1,
                height: "40px",
                minHeight: "40px",
                padding: "0 14px",
                fontSize: "12px",
                borderRadius: "10px",
                backgroundColor: "#F3EFE6",
                color: "#5A584F",
                border: "1px solid #E8E2D4",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "not-allowed",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontFamily: "var(--font-body), 'Inter', sans-serif",
              }}
            >
              Closed
            </button>
          ) : (
            <button
              onClick={() => (onApply ? onApply(opportunity) : null)}
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                height: "40px",
                minHeight: "40px",
                borderRadius: "10px",
                backgroundColor: "#8A6B2E",
                border: "1px solid #8A6B2E",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.16s ease",
                fontFamily: "var(--font-body), 'Inter', sans-serif",
                boxShadow: "0 2px 6px rgba(138, 107, 46, 0.2)",
              }}
              className="opp-card-apply-btn"
            >
              <span>Apply</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .opp-card-title:hover {
          color: #8A6B2E !important;
        }
        .opp-card-brief-btn:hover {
          background-color: #F3EFE6 !important;
        }
        .opp-card-apply-btn:hover {
          background-color: #6E5420 !important;
          border-color: #6E5420 !important;
        }
      `}</style>
    </div>
  );
}
