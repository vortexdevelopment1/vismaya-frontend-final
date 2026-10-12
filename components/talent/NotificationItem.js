"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  FileText,
  Megaphone,
  Bell,
  ArrowRight,
  Video,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useWorkflow } from "@/lib/shared/workflowStore";

export default function NotificationItem({ notification }) {
  const router = useRouter();
  const { markNotificationRead } = useWorkflow();

  const typeKey = (notification.type || "").toLowerCase();

  const getIconConfig = () => {
    if (typeKey.includes("audition")) {
      return { icon: Video, color: "var(--gold, #9B7A3F)", bg: "var(--bg-alt, #F0EEE7)", border: "var(--border-color, #E4E1D9)", label: "Auditions" };
    }
    if (typeKey.includes("app")) {
      return { icon: FileText, color: "var(--gold, #9B7A3F)", bg: "var(--bg-alt, #F0EEE7)", border: "var(--border-color, #E4E1D9)", label: "Applications" };
    }
    if (typeKey.includes("opp") || typeKey.includes("call")) {
      return { icon: Megaphone, color: "var(--gold, #9B7A3F)", bg: "var(--bg-alt, #F0EEE7)", border: "var(--border-color, #E4E1D9)", label: "Opportunities" };
    }
    if (typeKey.includes("shortlist") || typeKey.includes("select")) {
      return { icon: Sparkles, color: "var(--gold, #9B7A3F)", bg: "var(--bg-alt, #F0EEE7)", border: "var(--border-color, #E4E1D9)", label: "Applications" };
    }
    if (typeKey.includes("vismaya") || typeKey.includes("admin") || typeKey.includes("message")) {
      return { icon: ShieldCheck, color: "var(--gold, #9B7A3F)", bg: "var(--bg-alt, #F0EEE7)", border: "var(--border-color, #E4E1D9)", label: "Vismaya messages" };
    }
    return { icon: Bell, color: "var(--gold, #9B7A3F)", bg: "var(--bg-alt, #F0EEE7)", border: "var(--border-color, #E4E1D9)", label: "Vismaya messages" };
  };

  const conf = getIconConfig();
  const Icon = conf.icon;

  const targetLink = notification.link || notification.actionHref;

  const handleClick = () => {
    if (!notification.read) {
      markNotificationRead(notification.id);
    }
    if (targetLink) {
      router.push(targetLink);
    }
  };

  const timeDisplay = notification.createdAt
    ? new Date(notification.createdAt).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : notification.time || "Recently";

  return (
    <div
      onClick={handleClick}
      className="card-surface"
      style={{
        backgroundColor: notification.read ? "#FFFFFF" : "#F3EFE6",
        border: notification.read ? "1px solid #E8E2D4" : "1px solid #8A6B2E",
        padding: "16px 20px",
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        cursor: "pointer",
        position: "relative",
        borderRadius: "14px",
        boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04)",
        transition: "all 0.16s ease",
      }}
    >
      {/* Category Icon */}
      <div
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "10px",
          backgroundColor: "#F3EFE6",
          border: "1px solid #E8E2D4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#8A6B2E",
          flexShrink: 0,
        }}
      >
        <Icon size={18} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "0.9rem",
                fontWeight: notification.read ? "600" : "700",
                color: "var(--text-primary, #292C29)",
              }}
            >
              {notification.title || conf.label}
            </span>

            {/* Unread Dot */}
            {!notification.read && (
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "var(--gold, #9B7A3F)",
                }}
              />
            )}
          </div>

          <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #777970)" }}>
            {timeDisplay}
          </span>
        </div>

        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--text-secondary, #5A5C53)",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {notification.message}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: "600",
              padding: "2px 8px",
              borderRadius: "4px",
              backgroundColor: "var(--bg-alt, #F0EEE7)",
              color: "var(--gold, #9B7A3F)",
              border: "1px solid var(--border-color, #E4E1D9)",
            }}
          >
            {conf.label}
          </span>

          {targetLink && (
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--gold, #9B7A3F)",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <span>View details</span>
              <ArrowRight size={12} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
