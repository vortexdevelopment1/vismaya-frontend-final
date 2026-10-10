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
        gap: "10px",
        marginBottom: "24px",
        ...style,
      }}
    >
      {/* Optional Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: "#7e89a3",
          }}
        >
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {idx > 0 && <ChevronRight size={13} style={{ color: "#7e89a3" }} />}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    style={{
                      color: "#a3acc2",
                      textDecoration: "none",
                      transition: "color var(--transition)",
                    }}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    style={{
                      color: isLast ? "var(--gold)" : "inherit",
                      fontWeight: isLast ? "700" : "normal",
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
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <h1
              style={{
                fontFamily: "var(--font-heading), 'Playfair Display', serif",
                fontSize: "26px",
                lineHeight: 1.25,
                fontWeight: "700",
                color: "#eceaf5",
                letterSpacing: "-0.015em",
                margin: 0,
              }}
            >
              {title}
            </h1>

            {badge && (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "3px 10px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(255, 188, 0, 0.12)",
                  color: "var(--gold)",
                  border: "1px solid rgba(255, 188, 0, 0.28)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {badge}
              </span>
            )}
          </div>

          {subtitle && (
            <p
              style={{
                fontSize: "14px",
                lineHeight: "22px",
                color: "#a3acc2",
                margin: 0,
                maxWidth: "740px",
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
          >
            {action}
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
