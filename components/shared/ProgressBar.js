import React from "react";

export default function ProgressBar({
  value = 0,
  max = 100,
  label,
  showPercentage = true,
  height = "8px",
  color = "var(--gold, #8A6B2E)",
  gradient = "linear-gradient(90deg, #8A6B2E 0%, #C9A55C 100%)",
  animated = false,
  style = {},
}) {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "6px", ...style }}>
      {(label || showPercentage) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "13px",
          }}
        >
          {label && (
            <span style={{ color: "var(--text-secondary, #5A584F)", fontWeight: "600" }}>{label}</span>
          )}
          {showPercentage && (
            <span style={{ color: "var(--text-primary, #2B2D2A)", fontWeight: "700" }}>{percentage}%</span>
          )}
        </div>
      )}

      <div
        style={{
          width: "100%",
          height,
          backgroundColor: "var(--bg-alt, #F3EFE6)",
          borderRadius: "999px",
          overflow: "hidden",
          border: "1px solid var(--border-color, #E8E2D4)",
          position: "relative",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            background: gradient || color,
            borderRadius: "999px",
            transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 0 8px rgba(138, 107, 46, 0.3)",
          }}
        />
      </div>
    </div>
  );
}
