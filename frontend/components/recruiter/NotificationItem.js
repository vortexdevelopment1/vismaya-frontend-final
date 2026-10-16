"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Users, FileText, AlertTriangle, Info, CheckCircle2, ChevronRight, MessageSquare } from "lucide-react";

export default function NotificationItem({ notification, onMarkRead }) {
  const router = useRouter();

  const getIcon = (type) => {
    switch (type) {
      case "Shortlists":
        return {
          icon: Users,
          color: "var(--gold)",
          bg: "rgba(255, 188, 0, 0.12)",
          border: "rgba(255, 188, 0, 0.28)",
        };
      case "Requirements":
        return {
          icon: FileText,
          color: "var(--gold)",
          bg: "rgba(255, 188, 0, 0.12)",
          border: "rgba(255, 188, 0, 0.28)",
        };
      case "Admin Messages":
        return {
          icon: MessageSquare,
          color: "var(--gold)",
          bg: "rgba(255, 188, 0, 0.12)",
          border: "rgba(255, 188, 0, 0.28)",
        };
      default:
        return {
          icon: Info,
          color: "var(--gold)",
          bg: "rgba(255, 188, 0, 0.12)",
          border: "rgba(255, 188, 0, 0.28)",
        };
    }
  };

  const conf = getIcon(notification.type);
  const Icon = conf.icon;

  const handleClick = () => {
    if (!notification.read && onMarkRead) {
      onMarkRead(notification.id);
    }
    if (notification.actionHref) {
      router.push(notification.actionHref);
    }
  };

  return (
    <div
      onClick={handleClick}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      style={{
        backgroundColor: !notification.read ? "rgba(255, 188, 0, 0.08)" : "var(--glass-bg)",
        border: !notification.read ? "1px solid rgba(255, 188, 0, 0.35)" : "1px solid var(--glass-border)",
        borderRadius: "18px",
        padding: "16px 20px",
        display: "flex",
        alignItems: "flex-start",
        gap: "16px",
        cursor: "pointer",
        position: "relative",
        transition: "all 0.2s ease",
        boxShadow: "var(--shadow-sm)",
      }}
      className="recruiter-notif-item"
    >
      {/* Category Icon */}
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "var(--radius-md)",
          backgroundColor: conf.bg,
          border: `1px solid ${conf.border}`,
          color: conf.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "0.9rem",
                fontWeight: !notification.read ? "700" : "600",
                color: "var(--text-primary)",
              }}
            >
              {notification.title}
            </span>
            {notification.badge && (
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: "700",
                  padding: "1px 6px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: "rgba(255, 188, 0, 0.12)",
                  color: "var(--gold)",
                  border: "1px solid rgba(255, 188, 0, 0.30)",
                }}
              >
                {notification.badge}
              </span>
            )}
          </div>

          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            {notification.time}
          </span>
        </div>

        <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
          {notification.message}
        </p>

        {notification.actionHref && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.785rem",
              color: "var(--gold)",
              fontWeight: "700",
              marginTop: "4px",
            }}
          >
            <span>View Details</span>
            <ChevronRight size={13} />
          </div>
        )}
      </div>

      {/* Unread Indicator Dot */}
      {!notification.read && (
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "var(--gold)",
            boxShadow: "0 0 8px rgba(255, 188, 0, 0.6)",
            flexShrink: 0,
            marginTop: "6px",
          }}
          title="Unread"
        />
      )}

      <style jsx global>{`
        .recruiter-notif-item:hover {
          background-color: var(--bg-surface-elevated) !important;
          border-color: var(--gold) !important;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.3) !important;
        }
      `}</style>
    </div>
  );
}
