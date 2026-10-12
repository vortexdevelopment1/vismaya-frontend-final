"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export default function ToastContainer({ toasts = [], onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  const iconMap = {
    success: { icon: CheckCircle2, color: "var(--gold, #9B7A3F)" },
    danger: { icon: AlertCircle, color: "var(--status-red, #B84A39)" },
    warning: { icon: AlertTriangle, color: "var(--gold, #9B7A3F)" },
    info: { icon: Info, color: "var(--text-primary, #292C29)" },
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 110,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxWidth: "400px",
        width: "calc(100vw - 48px)",
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => {
        const conf = iconMap[toast.type] || iconMap.info;
        const Icon = conf.icon;

        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: "auto",
              padding: "14px 16px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              animation: "toastSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              position: "relative",
              overflow: "hidden",
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--border-color, #E4E1D9)",
              borderRadius: "8px",
              boxShadow: "0 8px 24px rgba(41, 44, 41, 0.12)",
            }}
          >
            {/* Left accent bar */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                width: "4px",
                backgroundColor: conf.color,
              }}
            />

            <div
              style={{
                color: conf.color,
                marginTop: "2px",
                flexShrink: 0,
              }}
            >
              <Icon size={18} />
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
              {toast.title && (
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "var(--text-primary, #292C29)",
                  }}
                >
                  {toast.title}
                </span>
              )}
              {toast.message && (
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary, #5A5C53)",
                    lineHeight: 1.4,
                  }}
                >
                  {toast.message}
                </span>
              )}
            </div>

            {onDismiss && (
              <button
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss toast"
                style={{
                  color: "var(--text-muted, #777970)",
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "all var(--transition)",
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        );
      })}

      <style jsx global>{`
        @keyframes toastSlide {
          from {
            opacity: 0;
            transform: translateX(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
