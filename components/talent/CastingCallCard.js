"use client";

import React from "react";
import {
  MapPin,
  Users,
  Clock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Film,
  Calendar,
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import { useTalent } from "@/lib/talent/TalentContext";

export default function CastingCallCard({ call, onViewDetails, onApply }) {
  const { applications } = useTalent();

  const isApplied = applications.some((app) => app.callId === call.id);
  const isUrgent = call.daysLeft <= 3;

  return (
    <div
      className="card-surface"
      style={{
        border: "1px solid var(--border-color, #E4E1D9)",
        borderRadius: "var(--radius-card, 6px)",
        backgroundColor: "var(--bg-surface, #FFFFFF)",
        boxShadow: "var(--card-shadow, 0 1px 3px rgba(41, 44, 41, 0.05))",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      {/* Header Band (Fixed 100px Height) */}
      <div
        style={{
          height: "100px",
          minHeight: "100px",
          flexShrink: 0,
          width: "100%",
          backgroundColor: "#F3EFE6",
          position: "relative",
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          borderBottom: "1px solid #E8E2D4",
        }}
      >
        {/* Top Badges Row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 2 }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: "700",
              padding: "4px 10px",
              borderRadius: "4px",
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              color: "#FAF9F6",
              backgroundColor: "rgba(201, 165, 92, 0.18)",
              border: "1px solid rgba(138, 107, 46, 0.22)",
              color: "#6E5420",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {call.category}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {call.featured && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  padding: "3px 10px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(138, 107, 46, 0.12)",
                  border: "1px solid rgba(138, 107, 46, 0.28)",
                  color: "#6E5420",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                <Sparkles size={11} style={{ color: "#8A6B2E" }} />
                Featured
              </span>
            )}

            {isUrgent && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  padding: "3px 10px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(138, 107, 46, 0.12)",
                  color: "#6E5420",
                  border: "1px solid rgba(138, 107, 46, 0.28)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                <Clock size={11} />
                {call.daysLeft === 0 ? "Today" : `${call.daysLeft}d Left`}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Info: Location & Deadline */}
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
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <MapPin size={13} style={{ color: "#8A6B2E" }} />
            {call.location}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Calendar size={12} style={{ color: "#8A6B2E" }} />
            {call.deadline}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <h3
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "18px",
              fontWeight: "700",
              color: "var(--text-primary, #292C29)",
              margin: 0,
              lineHeight: "1.35",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "2.7em",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {call.title}
          </h3>
          <span
            style={{
              fontSize: "12px",
              color: "var(--text-secondary, #5A5C53)",
              fontWeight: "500",
              display: "block",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minHeight: "1.4em",
              lineHeight: "1.4",
            }}
          >
            {call.productionHouse}
          </span>
        </div>

        <p
          style={{
            fontSize: "13px",
            color: "var(--text-secondary, #5A5C53)",
            lineHeight: "1.5",
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "3em",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          {call.description}
        </p>

        {/* Roles Strip */}
        <div
          style={{
            backgroundColor: "var(--bg-alt, #F0EEE7)",
            padding: "8px 12px",
            borderRadius: "4px",
            border: "1px solid var(--border-color, #E4E1D9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
            color: "var(--gold, #9B7A3F)",
            fontWeight: "700",
            minHeight: "42px",
          }}
        >
          <span>{call.budget || "Competitive Pay"}</span>
          <span style={{ color: "var(--text-secondary, #5A5C53)", fontWeight: "500" }}>{call.openRoles || "1"} Roles</span>
        </div>

        {/* Action Buttons Pinned to Bottom */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            paddingTop: "6px",
          }}
        >
          <button
            onClick={() => (onViewDetails ? onViewDetails(call) : null)}
            className="btn-secondary btn-dash"
            style={{ flex: 1, justifyContent: "center", minHeight: "40px", borderRadius: "4px" }}
          >
            <span>Details</span>
          </button>

          {isApplied ? (
            <button
              disabled
              style={{
                flex: 1,
                minHeight: "40px",
                borderRadius: "4px",
                backgroundColor: "var(--bg-alt, #F0EEE7)",
                color: "var(--text-primary, #292C29)",
                border: "1px solid var(--border-color, #E4E1D9)",
                fontWeight: "700",
                fontSize: "11px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                cursor: "default",
                textTransform: "uppercase",
              }}
            >
              <CheckCircle2 size={13} style={{ color: "var(--gold, #9B7A3F)" }} />
              <span>Applied</span>
            </button>
          ) : (
            <button
              onClick={() => (onApply ? onApply(call) : null)}
              className="btn-primary btn-dash"
              style={{ flex: 1, justifyContent: "center", minHeight: "40px", borderRadius: "4px" }}
            >
              <span>Apply</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
