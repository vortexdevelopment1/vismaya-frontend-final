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
  children,
  style = {},
}) {
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
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <h1
              style={{
                fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                fontSize: "clamp(26px, 3.5vw, 40px)",
                lineHeight: 1.15,
                fontWeight: 600,
                color: "#2B2D2A",
                letterSpacing: "-0.02em",
                margin: 0,
                overflowWrap: "break-word",
                wordBreak: "normal",
              }}
            >
              {title}
            </h1>

            {badge && (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "4px 12px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(138, 107, 46, 0.10)",
                  color: "#6E5420",
                  border: "1px solid rgba(138, 107, 46, 0.20)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
                }}
              >
                {badge}
              </span>
            )}
          </div>

          {subtitle && (
            <p
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
        {(action || children) && (
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
            {action}
            {children}
          </div>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .page-header-actions {
            width: 100% !important;
          }
          .page-header-actions > :global(button),
          .page-header-actions > :global(a) {
            flex: 1 1 140px;
            text-align: center;
            justifyContent: center;
          }
        }
      `}</style>
    </div>
  );
}
