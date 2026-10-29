"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function PageHeader({
  title,
  subtitle,
  badge,
  breadcrumbs = [],
  action,
  actions,
  children,
  style = {},
}) {
  const resolvedAction = action || actions;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        marginBottom: "28px",
        width: "100%",
        ...style,
      }}
      className="page-header-container"
    >
      {/* Optional Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            color: "#5A584F",
            flexWrap: "wrap",
            fontFamily: "var(--font-body), 'Inter', sans-serif",
          }}
        >
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {idx > 0 && <ChevronRight size={13} style={{ color: "#E8E2D4" }} />}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    style={{
                      color: "#5A584F",
                      textDecoration: "none",
                      transition: "color 0.16s ease",
                    }}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    style={{
                      color: isLast ? "#8A6B2E" : "#5A584F",
                      fontWeight: isLast ? "600" : "normal",
                    }}
                  >
                    {crumb.label}
                  </span>
                )}
              </div>
            );
          })}
        </nav>
      )}

      {/* Main Header Row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          width: "100%",
        }}
        className="page-header-row"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: "1 1 300px", minWidth: 0 }}>
          <div className="page-header-title-row" style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <h1
              className="page-header-title"
              style={{
                fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                fontSize: "clamp(28px, 2.2vw, 40px)",
                lineHeight: 1.15,
                fontWeight: 600,
                color: "#2B2D2A",
                letterSpacing: "-0.02em",
                margin: 0,
                overflowWrap: "break-word",
                wordBreak: "normal",
                minWidth: 0,
              }}
            >
              {title}
            </h1>

            {badge && (
              <span
                className="page-header-badge"
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "4px 12px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(138, 107, 46, 0.10)",
                  flex: "none",
                  color: "#6E5420",
                  border: "1px solid rgba(138, 107, 46, 0.20)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
                }}
              >
                {typeof badge === "string"
                  ? badge.replace(/\b(undefined|NaN|null)\b/gi, "0")
                  : badge}
              </span>
            )}
          </div>

          {subtitle && (
            <p
              className="page-header-subtitle"
              style={{
                fontSize: "16px",
                lineHeight: "1.7",
                color: "#5A584F",
                margin: 0,
                maxWidth: "800px",
                overflowWrap: "break-word",
                wordBreak: "normal",
                fontFamily: "var(--font-body), 'Inter', sans-serif",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Action Controls */}
        {(resolvedAction || children) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexShrink: 0,
              flexWrap: "wrap",
            }}
            className="page-header-actions"
          >
            {resolvedAction}
            {children}
          </div>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .page-header-container {
            margin-bottom: 14px !important;
            gap: 8px !important;
            width: 100% !important;
          }
          :global(.page-header-container nav) {
            font-size: 11.5px !important;
            gap: 6px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-width: 100% !important;
            flex-wrap: nowrap !important;
          }
          .page-header-row {
            gap: 10px !important;
            width: 100% !important;
          }
          .page-header-title-row {
            gap: 8px !important;
          }
          .page-header-title {
            font-size: 22px !important;
            line-height: 1.2 !important;
            letter-spacing: -0.01em !important;
          }
          .page-header-badge {
            font-size: 10px !important;
            padding: 2.5px 8px !important;
            letter-spacing: 0.08em !important;
            white-space: nowrap !important;
          }
          .page-header-subtitle {
            font-size: 13px !important;
            line-height: 1.5 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 3 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          }
          .page-header-actions {
            width: 100% !important;
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
          }
          .page-header-actions > :only-child,
          .page-header-actions:has(> :only-child) {
            grid-template-columns: 1fr !important;
            grid-column: 1 / -1 !important;
          }
          .page-header-actions > :global(button),
          .page-header-actions > :global(a) {
            height: 40px !important;
            min-height: 40px !important;
            font-size: 13px !important;
            padding: 0 12px !important;
            border-radius: 10px !important;
            width: 100% !important;
            justify-content: center !important;
            text-align: center !important;
            box-sizing: border-box !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
        }
      `}</style>
    </div>
  );
}
