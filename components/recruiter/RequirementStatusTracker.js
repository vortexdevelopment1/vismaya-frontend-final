"use client";

import React from "react";
import { Check, Clock, Film, CheckCircle2 } from "lucide-react";

export default function RequirementStatusTracker({ status = "Submitted", statusStage = 1 }) {
  const stages = [
    { stage: 1, label: "Submitted", desc: "Brief sent to Admin", icon: Clock },
    { stage: 2, label: "Under Review", desc: "Admin moderation & scope", icon: Clock },
    { stage: 3, label: "Live Call", desc: "Accepting talent applications", icon: Film },
    { stage: 4, label: "Closed", desc: "Casting finalized", icon: CheckCircle2 },
  ];

  // Resolve active stage number
  let currentStage = statusStage;
  if (status === "Draft") currentStage = 0;
  else if (status === "Submitted") currentStage = 1;
  else if (status === "Under Admin Review") currentStage = 2;
  else if (status === "Live") currentStage = 3;
  else if (status === "Closed") currentStage = 4;

  if (status === "Draft") {
    return (
      <div
        style={{
          padding: "12px 16px",
          borderRadius: "14px",
          backgroundColor: "rgba(255, 188, 0, 0.08)",
          border: "1px dashed rgba(255, 188, 0, 0.3)",
          color: "var(--text-secondary)",
          fontSize: "0.85rem",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <Clock size={16} style={{ color: "var(--gold)" }} />
        <span>Draft Brief • Not yet submitted to Admin for moderation.</span>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", padding: "16px 0" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          position: "relative",
        }}
      >
        {stages.map((item, idx) => {
          const isDone = item.stage < currentStage;
          const isCurrent = item.stage === currentStage;
          const isPending = item.stage > currentStage;

          return (
            <div
              key={item.stage}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                position: "relative",
              }}
            >
              {/* Connector line between steps */}
              {idx < stages.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    top: "18px",
                    left: "50%",
                    width: "100%",
                    height: "2px",
                    backgroundColor: isDone ? "var(--gold)" : "rgba(255, 255, 255, 0.12)",
                    background: isDone ? "linear-gradient(90deg, #ffd54a, #ffbc00)" : "rgba(255, 255, 255, 0.12)",
                    zIndex: 1,
                    transition: "all 0.3s ease",
                  }}
                />
              )}

              {/* Step Circle Indicator */}
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: isDone
                    ? "var(--gold-gradient)"
                    : isCurrent
                    ? "rgba(255, 188, 0, 0.18)"
                    : "var(--bg-surface-elevated)",
                  border: isDone
                    ? "2px solid #ffd54a"
                    : isCurrent
                    ? "2px solid var(--gold)"
                    : "2px solid var(--border-color)",
                  color: isDone ? "var(--gold-text)" : isCurrent ? "var(--gold)" : "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "0.85rem",
                  position: "relative",
                  zIndex: 2,
                  boxShadow: isCurrent ? "0 0 14px rgba(255, 188, 0, 0.35)" : isDone ? "var(--gold-glow)" : "none",
                  transition: "all 0.3s ease",
                }}
              >
                {isDone ? (
                  <Check size={18} strokeWidth={3} />
                ) : (
                  <span>{item.stage}</span>
                )}
              </div>

              {/* Label & Description */}
              <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <span
                  style={{
                    fontSize: "0.825rem",
                    fontWeight: isCurrent || isDone ? "700" : "500",
                    color: isCurrent
                      ? "var(--gold)"
                      : isDone
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.25,
                  }}
                  className="stage-desc"
                >
                  {item.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .stage-desc {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
