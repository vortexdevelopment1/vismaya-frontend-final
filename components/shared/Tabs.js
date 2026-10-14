"use client";

import React, { useRef, useEffect } from "react";

export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  variant = "pills", // "pills" | "underline" | "segmented"
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
        gap: "8px",
        overflowX: "auto",
        flexWrap: "wrap",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        paddingBottom: variant === "underline" ? "0" : "4px",
        borderBottom: variant === "underline" ? "1px solid #E8E2D4" : "none",
        width: "100%",
        maxWidth: "100%",
        ...style,
      }}
      className="custom-tabs-container"
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
                padding: "10px 16px",
                minHeight: "40px",
                fontSize: "14px",
                fontWeight: isActive ? "600" : "500",
                color: isActive ? "#8A6B2E" : "#5A584F",
                borderBottom: isActive ? "2px solid #8A6B2E" : "2px solid transparent",
                marginBottom: "-1px",
                transition: "all 0.16s ease",
                whiteSpace: "nowrap",
                cursor: "pointer",
                background: "transparent",
                borderTop: "none",
                borderLeft: "none",
                borderRight: "none",
                flexShrink: 0,
                fontFamily: "var(--font-body), 'Inter', sans-serif",
              }}
            >
              {Icon && <Icon size={16} style={{ color: isActive ? "#8A6B2E" : "#5A584F", flexShrink: 0 }} />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    backgroundColor: isActive ? "rgba(138, 107, 46, 0.12)" : "#F3EFE6",
                    color: isActive ? "#8A6B2E" : "#2B2D2A",
                    border: `1px solid ${isActive ? "rgba(138, 107, 46, 0.3)" : "#E8E2D4"}`,
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
              padding: "0 16px",
              height: "40px",
              minHeight: "40px",
              fontSize: "14px",
              fontWeight: "600",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              color: isActive ? "#FFFFFF" : "#5A584F",
              background: isActive ? "#8A6B2E" : "#FFFFFF",
              border: `1px solid ${isActive ? "#8A6B2E" : "#E8E2D4"}`,
              borderRadius: "999px",
              boxShadow: isActive ? "0 2px 8px rgba(138, 107, 46, 0.22)" : "none",
              transition: "all 0.16s ease",
              whiteSpace: "nowrap",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {Icon && <Icon size={15} style={{ color: isActive ? "#FFFFFF" : "#5A584F", flexShrink: 0 }} />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                style={{
                  height: "22px",
                  minWidth: "22px",
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "0 6px",
                  borderRadius: "999px",
                  backgroundColor: isActive ? "rgba(255, 255, 255, 0.22)" : "#F3EFE6",
                  color: isActive ? "#FFFFFF" : "#2B2D2A",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
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
          border-color: #8A6B2E !important;
          background-color: #F3EFE6 !important;
          color: #2B2D2A !important;
        }

        @media (max-width: 640px) {
          .talent-main-container .custom-tabs-container,
          .admin-main-container .custom-tabs-container {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 5px !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 8px 0 12px 0 !important;
            width: 100% !important;
            border-bottom: none !important;
          }
          .talent-main-container .tab-btn,
          .talent-main-container .tab-touch-btn,
          .admin-main-container .tab-btn,
          .admin-main-container .tab-touch-btn {
            flex: 1 1 auto !important;
            height: 28px !important;
            min-height: 28px !important;
            padding: 0 8px !important;
            border-radius: 999px !important;
            font-size: 10.5px !important;
            font-weight: 600 !important;
            font-family: var(--font-body), 'Inter', sans-serif !important;
            white-space: nowrap !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 5px !important;
            margin: 0 !important;
            box-shadow: none !important;
            transition: all 0.15s ease !important;
            border: 1px solid #E8E2D4 !important;
            background-color: #FFFFFF !important;
            color: #5A584F !important;
          }
          .talent-main-container .tab-btn > span,
          .talent-main-container .tab-touch-btn > span,
          .admin-main-container .tab-btn > span,
          .admin-main-container .tab-touch-btn > span {
            font-size: 10.5px !important;
            white-space: nowrap !important;
          }
          .talent-main-container .tab-btn.tab-active,
          .talent-main-container .tab-touch-btn.tab-underline-active,
          .admin-main-container .tab-btn.tab-active,
          .admin-main-container .tab-touch-btn.tab-underline-active {
            background-color: #8A6B2E !important;
            border-color: #8A6B2E !important;
            color: #FFFFFF !important;
            box-shadow: none !important;
          }
          .talent-main-container .tab-btn.tab-active > span,
          .talent-main-container .tab-touch-btn.tab-underline-active > span,
          .admin-main-container .tab-btn.tab-active > span,
          .admin-main-container .tab-touch-btn.tab-underline-active > span {
            color: #FFFFFF !important;
          }
          .talent-main-container .tab-btn.tab-active > span:not(:only-child):last-child,
          .talent-main-container .tab-touch-btn.tab-underline-active > span:not(:only-child):last-child,
          .admin-main-container .tab-btn.tab-active > span:not(:only-child):last-child,
          .admin-main-container .tab-touch-btn.tab-underline-active > span:not(:only-child):last-child {
            background-color: #FFFFFF !important;
            color: #8A6B2E !important;
            border: none !important;
          }
          .talent-main-container .tab-btn:not(.tab-active),
          .talent-main-container .tab-touch-btn:not(.tab-underline-active),
          .admin-main-container .tab-btn:not(.tab-active),
          .admin-main-container .tab-touch-btn:not(.tab-underline-active) {
            background-color: #FFFFFF !important;
            border: 1px solid #E8E2D4 !important;
            color: #5A584F !important;
          }
          .talent-main-container .tab-btn:not(.tab-active) > span,
          .talent-main-container .tab-touch-btn:not(.tab-underline-active) > span,
          .admin-main-container .tab-btn:not(.tab-active) > span,
          .admin-main-container .tab-touch-btn:not(.tab-underline-active) > span {
            color: #5A584F !important;
          }
          .talent-main-container .tab-btn:not(.tab-active) > span:not(:only-child):last-child,
          .talent-main-container .tab-touch-btn:not(.tab-underline-active) > span:not(:only-child):last-child,
          .admin-main-container .tab-btn:not(.tab-active) > span:not(:only-child):last-child,
          .admin-main-container .tab-touch-btn:not(.tab-underline-active) > span:not(:only-child):last-child {
            background-color: #F3EFE6 !important;
            color: #2B2D2A !important;
            border: 1px solid #E8E2D4 !important;
          }
          .talent-main-container .tab-btn > span:not(:only-child):last-child,
          .talent-main-container .tab-touch-btn > span:not(:only-child):last-child,
          .admin-main-container .tab-btn > span:not(:only-child):last-child,
          .admin-main-container .tab-touch-btn > span:not(:only-child):last-child {
            min-width: 16px !important;
            height: 16px !important;
            border-radius: 8px !important;
            font-size: 9.5px !important;
            font-weight: 700 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 4px !important;
            line-height: 16px !important;
            flex-shrink: 0 !important;
          }
        }

        @media (max-width: 380px) {
          .talent-main-container .tab-btn,
          .talent-main-container .tab-touch-btn,
          .admin-main-container .tab-btn,
          .admin-main-container .tab-touch-btn {
            font-size: 10px !important;
            padding: 0 5px !important;
            gap: 4px !important;
          }
          .talent-main-container .tab-btn > span,
          .talent-main-container .tab-touch-btn > span,
          .admin-main-container .tab-btn > span,
          .admin-main-container .tab-touch-btn > span {
            font-size: 10px !important;
          }
          .talent-main-container .tab-btn > span:not(:only-child):last-child,
          .talent-main-container .tab-touch-btn > span:not(:only-child):last-child,
          .admin-main-container .tab-btn > span:not(:only-child):last-child,
          .admin-main-container .tab-touch-btn > span:not(:only-child):last-child {
            font-size: 9px !important;
            min-width: 15px !important;
            height: 15px !important;
            padding: 0 3px !important;
          }
        }
      `}</style>
    </div>
  );
}
