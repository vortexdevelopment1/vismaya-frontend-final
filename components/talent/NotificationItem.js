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
      className={`card-surface talent-notif-item ${notification.read ? "notif-read" : "notif-unread"}`}
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
        className="talent-notif-icon-box"
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
      <div className="talent-notif-body" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
        <div className="talent-notif-header-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div className="talent-notif-title-wrap" style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
            <span
              className="talent-notif-title"
              style={{
                fontSize: "0.9rem",
                fontWeight: notification.read ? "600" : "700",
                color: "var(--text-primary, #292C29)",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
            >
              {notification.title || conf.label}
            </span>

            {/* Unread Dot */}
            {!notification.read && (
              <span
                className="talent-notif-unread-dot"
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "var(--gold, #9B7A3F)",
                  flexShrink: 0,
                }}
              />
            )}
          </div>

          <span className="talent-notif-time" style={{ fontSize: "0.75rem", color: "var(--text-muted, #777970)", flexShrink: 0 }}>
            {timeDisplay}
          </span>
        </div>

        <p
          className="talent-notif-msg"
          style={{
            fontSize: "0.85rem",
            color: "var(--text-secondary, #5A5C53)",
            lineHeight: 1.5,
            margin: 0,
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          {notification.message}
        </p>

        <div className="talent-notif-footer" style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
          <span
            className="talent-notif-category"
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
              className="talent-notif-link"
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

      <style jsx>{`
        @media (max-width: 640px) {
          :global(.talent-notif-item) {
            padding: 12px !important;
            gap: 10px !important;
            border-radius: 14px !important;
            box-shadow: 0 1px 4px rgba(43, 45, 42, 0.04) !important;
          }
          :global(.talent-notif-item.notif-read) {
            background-color: #FFFFFF !important;
            border: 1px solid #E8E2D4 !important;
          }
          :global(.talent-notif-item.notif-unread) {
            background-color: #FBF7EC !important;
            border: 1px solid rgba(201, 165, 92, 0.6) !important;
          }
          .talent-notif-icon-box {
            width: 32px !important;
            height: 32px !important;
            min-width: 32px !important;
            border-radius: 8px !important;
            margin-top: 2px !important;
          }
          .talent-notif-icon-box :global(svg) {
            width: 16px !important;
            height: 16px !important;
          }
          .talent-notif-body {
            min-width: 0 !important;
            gap: 3px !important;
          }
          .talent-notif-header-row {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 2px !important;
            width: 100% !important;
          }
          .talent-notif-title-wrap {
            display: flex !important;
            align-items: flex-start !important;
            gap: 6px !important;
            width: 100% !important;
          }
          .talent-notif-title {
            font-size: 14px !important;
            font-weight: 600 !important;
            color: #2B2D2A !important;
            line-height: 1.35 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
          }
          .talent-notif-unread-dot {
            width: 7px !important;
            height: 7px !important;
            min-width: 7px !important;
            border-radius: 50% !important;
            background-color: #8A6B2E !important;
            flex-shrink: 0 !important;
            margin-top: 5px !important;
          }
          .talent-notif-time {
            font-size: 11px !important;
            color: #5A584F !important;
            line-height: 1.2 !important;
          }
          .talent-notif-msg {
            font-size: 12.5px !important;
            line-height: 1.5 !important;
            color: #5A584F !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 3 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
            margin-top: 2px !important;
          }
          .talent-notif-footer {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            flex-wrap: wrap !important;
            margin-top: 6px !important;
          }
          .talent-notif-category {
            font-size: 10.5px !important;
            height: 24px !important;
            min-height: 24px !important;
            padding: 0 8px !important;
            border-radius: 4px !important;
            background-color: #F3EFE6 !important;
            color: #8A6B2E !important;
            border: 1px solid #E8E2D4 !important;
            display: inline-flex !important;
            align-items: center !important;
            white-space: nowrap !important;
          }
          .talent-notif-link {
            font-size: 12px !important;
            height: 32px !important;
            min-height: 32px !important;
            color: #8A6B2E !important;
            font-weight: 600 !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
            padding: 0 4px !important;
            white-space: nowrap !important;
          }
        }
      `}</style>
    </div>
  );
}
