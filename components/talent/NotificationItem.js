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
      return { icon: Video, color: "var(--gold)", bg: "rgba(255, 188, 0, 0.12)", border: "rgba(255, 188, 0, 0.28)", label: "Auditions" };
    }
    if (typeKey.includes("app")) {
      return { icon: FileText, color: "var(--gold)", bg: "rgba(255, 188, 0, 0.12)", border: "rgba(255, 188, 0, 0.28)", label: "Applications" };
    }
    if (typeKey.includes("opp") || typeKey.includes("call")) {
      return { icon: Megaphone, color: "var(--gold)", bg: "rgba(255, 188, 0, 0.12)", border: "rgba(255, 188, 0, 0.28)", label: "Opportunities" };
    }
    if (typeKey.includes("shortlist") || typeKey.includes("select")) {
      return { icon: Sparkles, color: "var(--gold)", bg: "rgba(255, 188, 0, 0.12)", border: "rgba(255, 188, 0, 0.28)", label: "Applications" };
    }
    if (typeKey.includes("vismaya") || typeKey.includes("admin") || typeKey.includes("message")) {
      return { icon: ShieldCheck, color: "var(--gold)", bg: "rgba(255, 188, 0, 0.12)", border: "rgba(255, 188, 0, 0.28)", label: "Vismaya messages" };
    }
    return { icon: Bell, color: "var(--gold)", bg: "rgba(255, 188, 0, 0.12)", border: "rgba(255, 188, 0, 0.28)", label: "Vismaya messages" };
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
        backgroundColor: notification.read ? "var(--bg-glass)" : "rgba(255, 188, 0, 0.08)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${notification.read ? "var(--border-glass)" : "rgba(255, 188, 0, 0.35)"}`,
        padding: "18px 20px",
        display: "flex",
        alignItems: "flex-start",
        gap: "16px",
        cursor: "pointer",
        position: "relative",
        borderRadius: "16px",
        transition: "all var(--transition)",
      }}
    >
      {/* Category Icon */}
      <div
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "12px",
          backgroundColor: conf.bg,
          border: `1px solid ${conf.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: conf.color,
          flexShrink: 0,
        }}
      >
        <Icon size={20} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "0.925rem",
                fontWeight: notification.read ? "600" : "700",
                color: "var(--text-primary)",
              }}
            >
              {notification.title || conf.label}
            </span>

            {/* Unread Glowing Dot */}
            {!notification.read && (
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "var(--gold)",
                  boxShadow: "0 0 8px rgba(255, 188, 0, 0.6)",
                }}
              />
            )}
          </div>

          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {timeDisplay}
          </span>
        </div>

        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
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
              padding: "2px 10px",
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              color: "var(--gold)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            {conf.label}
          </span>

          {targetLink && (
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--gold)",
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
