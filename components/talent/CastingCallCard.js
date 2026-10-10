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

  const gradients = [
    "linear-gradient(135deg, #070b12 0%, #0f1626 50%, rgba(255, 188, 0, 0.15) 100%)",
    "linear-gradient(155deg, #0a0f19 0%, #141c2e 50%, rgba(255, 188, 0, 0.18) 100%)",
    "linear-gradient(175deg, #070b12 0%, #10192b 50%, rgba(255, 213, 74, 0.15) 100%)",
  ];
  const charCode = (call.id || "1").charCodeAt(0) || 0;
  const gradient = gradients[charCode % gradients.length];

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
      }}
    >
      {/* Gradient Thumbnail */}
      <div
        style={{
          height: "120px",
          width: "100%",
          background: gradient,
          position: "relative",
          padding: "12px 14px",
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
            {call.category}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {call.featured && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "800",
                  padding: "3px 10px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(255, 188, 0, 0.18)",
                  border: "1px solid rgba(255, 188, 0, 0.35)",
                  color: "var(--gold)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  textTransform: "uppercase",
                }}
              >
                <Sparkles size={11} />
                Featured
              </span>
            )}

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
            color: "#eceaf5",
            fontWeight: "600",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <MapPin size={13} style={{ color: "var(--gold)" }} />
            {call.location}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Calendar size={12} style={{ color: "var(--gold)" }} />
            {call.deadline}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        <div>
          <h3
            style={{
              fontFamily: "var(--font-heading), 'Playfair Display', serif",
              fontSize: "18px",
              fontWeight: "700",
              color: "#eceaf5",
              margin: 0,
              lineHeight: 1.35,
            }}
          >
            {call.title}
          </h3>
          <span style={{ fontSize: "12px", color: "#a3acc2", fontWeight: "500", marginTop: "2px", display: "block" }}>
            {call.productionHouse}
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
          {call.description}
        </p>

        {/* Roles Strip */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            padding: "8px 12px",
            borderRadius: "10px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
            color: "var(--gold)",
            fontWeight: "700",
          }}
        >
          <span>{call.budget || "Competitive Pay"}</span>
          <span style={{ color: "#a3acc2", fontWeight: "500" }}>{call.openRoles || "1"} Roles</span>
        </div>

        {/* Action Buttons */}
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
            style={{ flex: 1, justifyContent: "center", minHeight: "44px" }}
          >
            <span>Details</span>
          </button>

          {isApplied ? (
            <button
              disabled
              style={{
                flex: 1,
                minHeight: "44px",
                borderRadius: "12px",
                backgroundColor: "rgba(52, 211, 153, 0.16)",
                color: "var(--status-green)",
                border: "1px solid rgba(52, 211, 153, 0.35)",
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
              <CheckCircle2 size={13} />
              <span>Applied</span>
            </button>
          ) : (
            <button
              onClick={() => (onApply ? onApply(call) : null)}
              className="btn-primary btn-dash"
              style={{ flex: 1, justifyContent: "center", minHeight: "44px" }}
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
