"use client";

import React, { useRef, useEffect } from "react";

export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  variant = "pills", // "pills" | "underline"
  style = {},
}) {
  const containerRef = useRef(null);

  // Auto-scroll active tab into view smoothly
  useEffect(() => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector(".tab-active, .tab-underline-active");
    if (activeEl) {
      const container = containerRef.current;
      const scrollLeft = activeEl.offsetLeft - (container.offsetWidth / 2) + (activeEl.offsetWidth / 2);
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: "smooth" });
    }
  }, [activeTab]);

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        alignItems: "center",
        gap: variant === "pills" ? "8px" : "16px",
        overflowX: "auto",
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        paddingBottom: variant === "underline" ? "0" : "4px",
        borderBottom: variant === "underline" ? "1px solid rgba(255, 255, 255, 0.12)" : "none",
        width: "100%",
        maxWidth: "100%",
        ...style,
      }}
      className="custom-tabs-container scroll-snap-x"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const Icon = tab.icon;

        if (variant === "underline") {
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`scroll-snap-item tab-touch-btn ${isActive ? "tab-underline-active" : ""}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                minHeight: "44px",
                fontSize: "13px",
                fontWeight: isActive ? "700" : "600",
                color: isActive ? "var(--gold)" : "#a3acc2",
                borderBottom: isActive ? "2px solid var(--gold)" : "2px solid transparent",
                marginBottom: "-1px",
                transition: "all var(--transition)",
                whiteSpace: "nowrap",
                cursor: "pointer",
                background: "transparent",
                borderTop: "none",
                borderLeft: "none",
                borderRight: "none",
                flexShrink: 0,
              }}
            >
              {Icon && <Icon size={16} style={{ color: isActive ? "var(--gold)" : "#7e89a3", flexShrink: 0 }} />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    backgroundColor: isActive ? "rgba(255, 188, 0, 0.18)" : "rgba(255, 255, 255, 0.08)",
                    color: isActive ? "var(--gold)" : "#a3acc2",
                    border: `1px solid ${isActive ? "rgba(255, 188, 0, 0.35)" : "rgba(255, 255, 255, 0.12)"}`,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        }

        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`tab-btn scroll-snap-item tab-touch-btn ${isActive ? "tab-active" : ""}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "0 18px",
              minHeight: "44px",
              fontSize: "12px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: isActive ? "#1a1300" : "#eceaf5",
              background: isActive ? "linear-gradient(135deg, #ffd54a 0%, #ffbc00 100%)" : "rgba(255, 255, 255, 0.06)",
              border: `1px solid ${isActive ? "#ffd54a" : "rgba(255, 255, 255, 0.14)"}`,
              borderRadius: "999px",
              boxShadow: isActive ? "0 4px 14px rgba(255, 188, 0, 0.32)" : "none",
              transition: "all var(--transition)",
              whiteSpace: "nowrap",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {Icon && <Icon size={14} style={{ color: isActive ? "#1a1300" : "#a3acc2", flexShrink: 0 }} />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "800",
                  padding: "1px 7px",
                  borderRadius: "999px",
                  backgroundColor: isActive ? "rgba(26, 19, 0, 0.20)" : "rgba(255, 255, 255, 0.12)",
                  color: isActive ? "#1a1300" : "#eceaf5",
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}

      <style jsx global>{`
        .custom-tabs-container::-webkit-scrollbar {
          display: none;
        }
        .tab-btn:hover:not(.tab-active) {
          background-color: rgba(255, 255, 255, 0.10) !important;
          color: #ffffff !important;
        }
      `}</style>
    </div>
  );
}
