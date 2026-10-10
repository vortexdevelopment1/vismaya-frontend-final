import React from "react";
import * as LucideIcons from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({
  title,
  value,
  change,
  isPositive = true,
  description,
  iconName = "BarChart3",
  icon: IconComponent,
  tint,
  onClick,
  style = {},
}) {
  const ResolvedIcon = IconComponent || (iconName && LucideIcons[iconName]) || LucideIcons.Activity;

  return (
    <div
      onClick={onClick}
      className="dash-card"
      style={{
        padding: "20px 22px",
        minHeight: "108px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "rgba(255, 255, 255, 0.07)",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.18s ease, border-color 0.18s ease",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {/* Label */}
          <span
            style={{
              fontSize: "12px",
              fontWeight: "700",
              color: "#a3acc2",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {title}
          </span>

          {/* Stat Number */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
            <span
              style={{
                fontSize: "28px",
                lineHeight: "34px",
                fontWeight: "700",
                color: "#eceaf5",
                fontFamily: "var(--font-body), 'Inter', sans-serif",
                fontVariantNumeric: "lining-nums",
              }}
            >
              {value}
            </span>

            {change && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11px",
                  fontWeight: "700",
                  color: isPositive ? "var(--status-green)" : "var(--status-red)",
                  backgroundColor: isPositive ? "rgba(52, 211, 153, 0.14)" : "rgba(255, 107, 107, 0.14)",
                  border: `1px solid ${isPositive ? "rgba(52, 211, 153, 0.32)" : "rgba(255, 107, 107, 0.32)"}`,
                  padding: "2px 8px",
                  borderRadius: "999px",
                }}
              >
                {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {change}
              </span>
            )}
          </div>
        </div>

        {/* 44px Glass Icon Square */}
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            color: "var(--gold)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
          }}
        >
          <ResolvedIcon size={20} />
        </div>
      </div>

      {description && (
        <span
          style={{
            fontSize: "12px",
            color: "#7e89a3",
            marginTop: "8px",
          }}
        >
          {description}
        </span>
      )}
    </div>
  );
}
