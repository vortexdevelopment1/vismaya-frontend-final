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

  const valStr = String(value ?? "");
  const numFontSize = valStr.length > 8 ? "28px" : valStr.length > 6 ? "32px" : "40px";
  const numLineHeight = valStr.length > 8 ? "32px" : valStr.length > 6 ? "36px" : "44px";

  return (
    <div
      onClick={onClick}
      className="dash-card card-surface stat-card-consistent"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "24px",
        boxSizing: "border-box",
        backgroundColor: "#FFFFFF",
        borderRadius: "18px",
        border: "1px solid #E8E2D4",
        boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06)",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
        ...style,
      }}
    >
      {/* Top Row: Label left (truncated/nowrap), 44px Icon box right (flex-shrink 0) */}
      <div
        className="stat-card-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <span
          title={title}
          className="stat-card-label"
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "#5A584F",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            fontFamily: "var(--font-body), 'Inter', sans-serif",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            flex: 1,
            minWidth: 0,
          }}
        >
          {title}
        </span>

        <div
          className="stat-card-icon-box"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            backgroundColor: "#F3EFE6",
            border: "1px solid #E8E2D4",
            color: "#8A6B2E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ResolvedIcon size={20} />
        </div>
      </div>

      {/* Number Row */}
      <div className="stat-card-num-row" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <span
          className="stat-card-number"
          style={{
            fontSize: numFontSize,
            lineHeight: numLineHeight,
            fontWeight: "600",
            color: "#2B2D2A",
            fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
            fontVariantNumeric: "lining-nums tabular-nums",
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </span>

        {/* Trend Chip: ALWAYS positioned right under the number */}
        {change && (
          <span
            className="stat-card-trend"
            style={{
              marginTop: "8px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              fontWeight: "600",
              color: "#6E5420",
              backgroundColor: "#F3EFE6",
              border: "1px solid #E8E2D4",
              padding: "3px 10px",
              borderRadius: "999px",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              whiteSpace: "nowrap",
              width: "fit-content",
            }}
          >
            {isPositive && change !== "None" && change !== "All clear" ? (
              <TrendingUp size={12} style={{ color: "#8A6B2E" }} />
            ) : (
              <TrendingDown size={12} style={{ color: "#5A584F" }} />
            )}
            {change}
          </span>
        )}
      </div>

      {/* Description: At the bottom with margin-top: auto */}
      {description && (
        <span
          title={description}
          className="stat-card-desc"
          style={{
            fontSize: "14px",
            color: "#5A584F",
            marginTop: "auto",
            paddingTop: "12px",
            lineHeight: 1.5,
            fontFamily: "var(--font-body), 'Inter', sans-serif",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {description}
        </span>
      )}

      <style jsx>{`
        @media (max-width: 640px) {
          .stat-card-consistent {
            padding: 12px !important;
            border-radius: 14px !important;
            height: 100% !important;
          }
          .stat-card-header {
            margin-bottom: 6px !important;
            gap: 6px !important;
            align-items: flex-start !important;
          }
          .stat-card-label {
            font-size: 10px !important;
            letter-spacing: 0.08em !important;
            line-height: 1.25 !important;
            white-space: normal !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          .stat-card-icon-box {
            width: 28px !important;
            height: 28px !important;
            min-width: 28px !important;
            min-height: 28px !important;
            border-radius: 8px !important;
            flex-shrink: 0 !important;
          }
          .stat-card-icon-box :global(svg) {
            width: 14px !important;
            height: 14px !important;
          }
          .stat-card-number {
            font-size: 26px !important;
            line-height: 28px !important;
          }
          .stat-card-trend {
            font-size: 10px !important;
            padding: 2px 7px !important;
            margin-top: 4px !important;
            white-space: nowrap !important;
            max-width: 100% !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            display: inline-flex !important;
            align-items: center !important;
          }
          .stat-card-trend :global(svg) {
            width: 10px !important;
            height: 10px !important;
          }
          .stat-card-desc {
            font-size: 11.5px !important;
            line-height: 1.35 !important;
            padding-top: 6px !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          }
        }
      `}</style>
    </div>
  );
}
