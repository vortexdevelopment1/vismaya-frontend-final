"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Bell, ShieldCheck, User } from "lucide-react";
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
    if (pathname === "/admin/opportunities") return "Opportunities";
    if (pathname === "/admin/applications") return "Applications";
    if (pathname === "/admin/auditions") return "Auditions & Self-Tapes";
    if (pathname === "/admin/media-moderation") return "Media Moderation";
    if (pathname === "/admin/projects") return "Projects";
    if (pathname === "/admin/payments") return "Payments";
    if (pathname === "/admin/cancellation-requests") return "Cancellation Requests";
    if (pathname === "/admin/analytics") return "Platform Analytics";
    if (pathname === "/admin/notifications") return "Notifications & Broadcasts";
    return "Admin Console";
  };

  const recentUnread = adminNotifications.filter((n) => !n.read).slice(0, 4);

  return (
    <header
      style={{
        height: "var(--topbar-height, 72px)",
        minHeight: "72px",
        backgroundColor: "rgba(10, 15, 25, 0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingInline: "clamp(16px, 2.5vw, 32px)",
        position: "sticky",
        top: 0,
        zIndex: 30,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Left: Mobile hamburger & title, Desktop Desk Name Chip */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
        {/* Mobile Hamburger */}
        <button
          onClick={onOpenMobile}
          aria-label="Open navigation drawer"
          style={{
            color: "#eceaf5",
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
          className="admin-hamburger-btn"
        >
          <Menu size={20} />
        </button>

        {/* Mobile Title (shown only on mobile) */}
        <div className="admin-mobile-title-wrap" style={{ minWidth: 0 }}>
          <h2
            style={{
              fontSize: "15px",
              fontWeight: "600",
              color: "#eceaf5",
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {getPageTitle()}
          </h2>
        </div>

        {/* Desktop Desk Name Chip (do NOT repeat page title on desktop) */}
        <div
          className="admin-desktop-desk-chip"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 12px",
            borderRadius: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <ShieldCheck size={16} style={{ color: "var(--gold)" }} />
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#eceaf5" }}>
            Super-Admin Desk
          </span>
          <span style={{ color: "rgba(255, 255, 255, 0.2)", margin: "0 2px" }}>&bull;</span>
          <span style={{ fontSize: "12px", color: "var(--gold)", fontWeight: "600" }}>
            Vismaya Control Center
          </span>
        </div>
      </div>

      {/* Right Controls: System Status Chip + Bell + Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        {/* System Status Chip (26px high, Inter 12px weight 600, sentence case, tinted green with a dot) */}
        <div
          style={{
            height: "26px",
            paddingInline: "10px",
            borderRadius: "999px",
            backgroundColor: "rgba(52, 211, 153, 0.12)",
            border: "1px solid rgba(52, 211, 153, 0.30)",
            color: "var(--status-green)",
            fontFamily: "var(--font-body), 'Inter', sans-serif",
            fontSize: "12px",
            fontWeight: "600",
            textTransform: "none",
            letterSpacing: "normal",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            whiteSpace: "nowrap",
          }}
          className="admin-status-chip"
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "var(--status-green)",
              boxShadow: "0 0 6px rgba(52, 211, 153, 0.6)",
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
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              backgroundColor: showNotifMenu ? "rgba(255, 188, 0, 0.14)" : "rgba(255, 255, 255, 0.06)",
              border: `1px solid ${showNotifMenu ? "rgba(255, 188, 0, 0.35)" : "rgba(255, 255, 255, 0.12)"}`,
              color: showNotifMenu ? "var(--gold)" : "#eceaf5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
              transition: "all 0.18s ease",
            }}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-3px",
                  right: "-3px",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  backgroundColor: "var(--gold)",
                  color: "#1a1300",
                  fontSize: "10px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.4)",
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
                top: "46px",
                right: 0,
                width: "320px",
                maxWidth: "calc(100vw - 32px)",
                backgroundColor: "#0f1626",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                borderRadius: "16px",
                boxShadow: "0 16px 40px rgba(0, 0, 0, 0.65)",
                padding: "14px",
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
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  paddingBottom: "10px",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#eceaf5" }}>
                  Operations Alerts
                </span>
                <Link
                  href="/admin/notifications"
                  onClick={() => setShowNotifMenu(false)}
                  style={{
                    fontSize: "12px",
                    color: "var(--gold)",
                    fontWeight: "600",
                    textDecoration: "none",
                  }}
                >
                  View all
                </Link>
              </div>

              {recentUnread.length === 0 ? (
                <div style={{ padding: "16px 8px", textAlign: "center", fontSize: "13px", color: "#a3acc2" }}>
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
                      padding: "10px",
                      borderRadius: "10px",
                      backgroundColor: "rgba(255, 255, 255, 0.04)",
                      fontSize: "12px",
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <div style={{ fontWeight: "600", color: "#eceaf5", marginBottom: "2px" }}>
                      {notif.title || "Alert"}
                    </div>
                    <div style={{ color: "#a3acc2", lineHeight: 1.4 }}>{notif.message}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User Avatar with SA initial */}
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "rgba(255, 188, 0, 0.14)",
            border: "1.5px solid rgba(255, 188, 0, 0.40)",
            color: "var(--gold)",
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
        >
          SA
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          .admin-hamburger-btn {
            display: flex !important;
          }
          .admin-mobile-title-wrap {
            display: block !important;
          }
          .admin-desktop-desk-chip {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .admin-status-chip {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}

