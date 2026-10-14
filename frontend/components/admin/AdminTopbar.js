"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Bell } from "lucide-react";
import { useWorkflow } from "@/lib/shared/workflowStore";

export default function AdminTopbar({ onOpenMobile }) {
  const pathname = usePathname();
  const { notifications = [], markNotificationRead } = useWorkflow();
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const adminNotifications = notifications.filter(
    (n) => n.toRole === "vismaya" || (!n.toRole && !n.toUserId)
  );
  const unreadCount = adminNotifications.filter((n) => !n.read).length;

  const getPageTitle = () => {
    if (pathname === "/admin/dashboard" || pathname === "/admin") return "Dashboard";
    if (pathname === "/admin/talent-management") return "Talent Management";
    if (pathname === "/admin/recruiter-management") return "Organization Management";
    if (pathname === "/admin/opportunity-review") return "Opportunity Review";
    if (pathname === "/admin/opportunities") return "Opportunities Directory";
    if (pathname === "/admin/applications") return "Applications Registry";
    if (pathname === "/admin/auditions") return "Auditions & Self-Tapes";
    if (pathname === "/admin/media-moderation") return "Media Moderation";
    if (pathname === "/admin/projects") return "Projects Directory";
    if (pathname === "/admin/payments") return "Escrow & Payments";
    if (pathname === "/admin/cancellation-requests") return "Cancellation Requests";
    if (pathname === "/admin/analytics") return "Platform Analytics";
    if (pathname === "/admin/notifications") return "Notifications & Broadcasts";
    return "Operations Console";
  };

  const recentUnread = adminNotifications.filter((n) => !n.read).slice(0, 4);

  return (
    <header
      style={{
        height: "var(--topbar-height, 72px)",
        minHeight: "72px",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid #E8E2D4",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingInline: "clamp(16px, 2.5vw, 40px)",
        position: "sticky",
        top: 0,
        zIndex: 40,
        width: "100%",
        boxSizing: "border-box",
      }}
      className="admin-topbar-header"
    >
      {/* Left: Mobile hamburger & title, Desktop Single Title + Muted Subtitle */}
      <div className="admin-topbar-left" style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0, flex: "1 1 auto" }}>
        {/* Mobile Hamburger */}
        <button
          onClick={onOpenMobile}
          aria-label="Open navigation drawer"
          style={{
            color: "#2B2D2A",
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            backgroundColor: "#F3EFE6",
            border: "1px solid #E8E2D4",
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
          className="admin-hamburger-btn"
        >
          <Menu size={20} />
        </button>

        {/* Page Title & Subtitle */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px", minWidth: 0, flex: "1 1 auto" }}>
          <h1
            className="admin-topbar-title"
            style={{
              fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
              fontSize: "22px",
              lineHeight: "28px",
              fontWeight: 600,
              color: "#2B2D2A",
              margin: 0,
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {getPageTitle()}
          </h1>

          <span
            className="admin-desktop-subtitle"
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#5A584F",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            Super-Admin Desk &bull; Vismaya Control Center
          </span>
        </div>
      </div>

      {/* Right Controls: System Status Chip + Bell + Avatar */}
      <div className="admin-topbar-right" style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        {/* System Status Chip (Neutral bg #F3EFE6, charcoal text, gold-brown dot) */}
        <div
          style={{
            height: "30px",
            paddingInline: "12px",
            borderRadius: "999px",
            backgroundColor: "#F3EFE6",
            border: "1px solid #E8E2D4",
            color: "#2B2D2A",
            fontFamily: "var(--font-body), 'Inter', sans-serif",
            fontSize: "12px",
            fontWeight: "600",
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            whiteSpace: "nowrap",
          }}
          className="admin-status-chip"
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#8A6B2E",
            }}
          />
          <span>System normal</span>
        </div>

        {/* Notifications Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            aria-label="View system alerts"
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              backgroundColor: showNotifMenu ? "#F3EFE6" : "#FFFFFF",
              border: `1px solid ${showNotifMenu ? "#8A6B2E" : "#E8E2D4"}`,
              color: showNotifMenu ? "#8A6B2E" : "#5A584F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
              transition: "all 0.16s ease",
            }}
            className="admin-notif-btn"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  backgroundColor: "#8A6B2E",
                  color: "#FFFFFF",
                  fontSize: "10px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(138, 107, 46, 0.3)",
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div
              style={{
                position: "absolute",
                top: "52px",
                right: 0,
                width: "min(340px, calc(100vw - 32px))",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8E2D4",
                borderRadius: "16px",
                boxShadow: "0 16px 40px rgba(43, 45, 42, 0.12)",
                padding: "16px",
                zIndex: 50,
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #E8E2D4",
                  paddingBottom: "10px",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#2B2D2A" }}>
                  Operations Alerts
                </span>
                <Link
                  href="/admin/notifications"
                  onClick={() => setShowNotifMenu(false)}
                  style={{
                    fontSize: "12px",
                    color: "#8A6B2E",
                    fontWeight: "600",
                    textDecoration: "none",
                  }}
                >
                  View all
                </Link>
              </div>

              {recentUnread.length === 0 ? (
                <div style={{ padding: "16px 8px", textAlign: "center", fontSize: "13px", color: "#5A584F" }}>
                  You are all caught up
                </div>
              ) : (
                recentUnread.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      markNotificationRead(notif.id);
                      setShowNotifMenu(false);
                    }}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      backgroundColor: "#F3EFE6",
                      border: "1px solid #E8E2D4",
                      fontSize: "12px",
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <div style={{ fontWeight: "600", color: "#2B2D2A", marginBottom: "2px" }}>
                      {notif.title || "Alert"}
                    </div>
                    <div style={{ color: "#5A584F", lineHeight: 1.4 }}>{notif.message}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User Avatar with SA initial */}
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            backgroundColor: "#F3EFE6",
            border: "1.5px solid #E8E2D4",
            color: "#8A6B2E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-body), 'Inter', sans-serif",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            userSelect: "none",
            letterSpacing: "0.02em",
          }}
          title="Super Admin (SA)"
          className="admin-avatar-btn"
        >
          SA
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          .admin-hamburger-btn {
            display: flex !important;
          }
          .admin-desktop-subtitle {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          .admin-topbar-header {
            height: 56px !important;
            min-height: 56px !important;
            padding-inline: 12px !important;
          }
          .admin-topbar-left {
            gap: 8px !important;
          }
          .admin-hamburger-btn {
            width: 36px !important;
            height: 36px !important;
            min-height: 36px !important;
            min-width: 36px !important;
            border-radius: 9px !important;
          }
          .admin-topbar-title {
            font-size: 17px !important;
            line-height: 1.25 !important;
          }
          .admin-status-chip {
            display: none !important;
          }
          .admin-topbar-right {
            gap: 8px !important;
          }
          .admin-notif-btn {
            width: 36px !important;
            height: 36px !important;
            border-radius: 9px !important;
          }
          .admin-avatar-btn {
            width: 34px !important;
            height: 34px !important;
            border-radius: 50% !important;
            font-size: 12px !important;
            flex-shrink: 0 !important;
          }
        }
      `}</style>
    </header>
  );
}
