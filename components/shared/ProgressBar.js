import React from "react";

export default function ProgressBar({
  value = 0,
  max = 100,
  label,
  showPercentage = true,
  height = "8px",
  color = "var(--gold)",
  gradient = "linear-gradient(90deg, #ffd54a 0%, #ffbc00 100%)",
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
            <span style={{ color: "#a3acc2", fontWeight: "600" }}>{label}</span>
          )}
          {showPercentage && (
            <span style={{ color: "#eceaf5", fontWeight: "700" }}>{percentage}%</span>
          )}
        </div>
      )}

      <div
        style={{
          width: "100%",
          height,
          backgroundColor: "rgba(255, 255, 255, 0.08)",
          borderRadius: "999px",
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.12)",
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
            boxShadow: "0 0 10px rgba(255, 188, 0, 0.4)",
          }}
        />
      </div>
    </div>
  );
}
