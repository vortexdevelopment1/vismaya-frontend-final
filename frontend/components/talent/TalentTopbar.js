"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Bell } from "lucide-react";
import { useTalent } from "@/lib/talent/TalentContext";
import { useWorkflow } from "@/lib/shared/workflowStore";
import { useAuth } from "@/context/AuthContext";
import { isRealMode } from "@/lib/api/config";

export default function TalentTopbar({ onOpenMobile }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { profile, notifications: ctxNotifications = [] } = useTalent();
  const { getNotificationsForRole, unreadNotificationsCount, markNotificationRead } = useWorkflow();
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const currentTalentId = user?.id || user?._id || profile?.id || profile?._id || profile?.userId || (!isRealMode("talent") ? "tal-904" : "");

  const notifications = useMemo(() => {
    if (isRealMode("notifications") || isRealMode("talent")) {
      return Array.isArray(ctxNotifications) && ctxNotifications.length > 0
        ? ctxNotifications
        : getNotificationsForRole("talent", currentTalentId);
    }
    return getNotificationsForRole("talent", currentTalentId);
  }, [ctxNotifications, getNotificationsForRole, currentTalentId]);

  const unreadCount = isRealMode("notifications")
    ? (Array.isArray(notifications) ? notifications.filter(n => !n.isRead && !n.read).length : 0)
    : unreadNotificationsCount("talent", currentTalentId);

  const getPageTitle = () => {
    if (pathname === "/talent/dashboard") return "Artist Dashboard";
    if (pathname === "/talent/profile") return "My Profile";
    if (pathname === "/talent/portfolio") return "Portfolio";
    if (pathname.startsWith("/talent/opportunities")) return "Casting Calls";
    if (pathname === "/talent/applications") return "Applications";
    if (pathname === "/talent/auditions") return "Auditions";
    if (pathname === "/talent/notifications") return "Notifications";
    if (pathname === "/talent/settings") return "Settings";
    return "Talent Portal";
  };

  const recentUnread = notifications.filter((n) => !n.read && !n.isRead).slice(0, 4);

  const getInitials = (name) => {
    if (!name) return user?.name ? user.name.slice(0, 2).toUpperCase() : "TR";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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
      className="talent-topbar"
    >
      {/* Left: Mobile hamburger & title, Desktop Single Title + Muted Subtitle */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
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
          className="talent-hamburger-btn"
        >
          <Menu size={20} />
        </button>

        {/* Page Title & Subtitle */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px", minWidth: 0, flex: "1 1 auto" }}>
          <h1
            style={{
              fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
              fontSize: "clamp(16px, 2vw, 22px)",
              lineHeight: "28px",
              fontWeight: 600,
              color: "#2B2D2A",
              margin: 0,
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
            }}
          >
            {getPageTitle()}
          </h1>

          <span
            style={{
              fontSize: "12px",
              letterSpacing: "0.10em",
              color: "#5A584F",
              fontWeight: 600,
              textTransform: "uppercase",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              whiteSpace: "nowrap",
              display: "inline-block",
            }}
            className="talent-topbar-subtitle"
          >
            &bull;&nbsp;&nbsp;ARTIST WORKSPACE &bull; VISMAYA TALENT
          </span>
        </div>
      </div>

      {/* Right Actions: Bell & Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        {/* Notifications Bell */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            aria-label={`View notifications (${unreadCount} unread)`}
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E2D4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2B2D2A",
              cursor: "pointer",
              position: "relative",
              transition: "all 0.16s ease",
            }}
            className="talent-bell-btn"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  height: "20px",
                  minWidth: "20px",
                  borderRadius: "999px",
                  backgroundColor: "#8A6B2E",
                  color: "#FFFFFF",
                  fontSize: "11px",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 5px",
                  border: "2px solid #FFFFFF",
                  boxShadow: "0 2px 6px rgba(138, 107, 46, 0.3)",
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifMenu && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: "340px",
                maxWidth: "calc(100vw - 32px)",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8E2D4",
                borderRadius: "16px",
                boxShadow: "0 12px 28px rgba(43, 45, 42, 0.08)",
                padding: "16px",
                zIndex: 50,
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#2B2D2A", fontFamily: "var(--font-heading), 'Playfair Display', serif" }}>
                  Notifications
                </span>
                <Link
                  href="/talent/notifications"
                  onClick={() => setShowNotifMenu(false)}
                  style={{ fontSize: "12px", color: "#8A6B2E", fontWeight: "600", textDecoration: "none" }}
                >
                  View all
                </Link>
              </div>

              {recentUnread.length === 0 ? (
                <div style={{ padding: "20px 0", textAlign: "center", color: "#5A584F", fontSize: "13px" }}>
                  No unread notifications
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {recentUnread.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationRead(notif.id)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "10px",
                        backgroundColor: "#F3EFE6",
                        border: "1px solid #E8E2D4",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                        {notif.title}
                      </span>
                      <span style={{ fontSize: "12px", color: "#5A584F" }}>
                        {notif.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Avatar Circle */}
        <Link
          href="/talent/profile"
          title="My Profile"
          style={{ textDecoration: "none" }}
        >
          {profile?.profilePhoto || profile?.avatar ? (
            <div
              className="talent-topbar-avatar"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundImage: `url(${profile.profilePhoto || profile.avatar})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: "1px solid #E8E2D4",
                backgroundColor: "#F3EFE6",
              }}
            />
          ) : (
            <div
              className="talent-topbar-avatar"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "#F3EFE6",
                border: "1px solid #E8E2D4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "13px",
                color: "#8A6B2E",
                fontFamily: "var(--font-body), 'Inter', sans-serif",
              }}
            >
              {getInitials(profile?.stageName || profile?.personal?.fullName || profile?.name)}
            </div>
          )}
        </Link>
      </div>

      <style jsx global>{`
        @media (max-width: 1400px) {
          .talent-topbar-subtitle {
            display: none !important;
          }
        }
        @media (max-width: 1100px) {
          .talent-hamburger-btn {
            display: flex !important;
          }
        }
        @media (max-width: 640px) {
          .talent-topbar {
            height: 56px !important;
            min-height: 56px !important;
            padding-inline: 16px !important;
          }
          .talent-topbar h1 {
            font-size: 18px !important;
            line-height: 22px !important;
          }
          .talent-hamburger-btn {
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            min-height: 40px !important;
            border-radius: 9px !important;
          }
          .talent-bell-btn {
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            min-height: 40px !important;
            border-radius: 9px !important;
          }
          .talent-topbar-avatar {
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            min-height: 40px !important;
            font-size: 13px !important;
          }
        }
        .talent-bell-btn:hover {
          background-color: #F3EFE6 !important;
          border-color: #8A6B2E !important;
        }
      `}</style>
    </header>
  );
}
