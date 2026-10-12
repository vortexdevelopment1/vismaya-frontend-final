"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Bell, ExternalLink } from "lucide-react";
import { useTalent } from "@/lib/talent/TalentContext";
import { useWorkflow } from "@/lib/shared/workflowStore";

export default function TalentTopbar({ onOpenMobile }) {
  const pathname = usePathname();
  const { profile } = useTalent();
  const { getNotificationsForRole, unreadNotificationsCount, markNotificationRead } = useWorkflow();
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const currentTalentId = "tal-904";
  const unreadCount = unreadNotificationsCount("talent", currentTalentId);
  const notifications = getNotificationsForRole("talent", currentTalentId);

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

  const recentUnread = notifications.filter((n) => !n.read).slice(0, 4);

  const getInitials = (name) => {
    if (!name) return "AS";
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
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px", minWidth: 0 }}>
          <h1
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

      {/* Right Actions: LIVE BOARD button, Bell & Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        {/* Live Opportunities Directory Link */}
        <Link
          href="/opportunities"
          target="_blank"
          rel="noopener noreferrer"
          title="Browse Live Public Casting Board"
          style={{
            height: "40px",
            padding: "0 16px",
            borderRadius: "10px",
            border: "1px solid #E8E2D4",
            backgroundColor: "#FFFFFF",
            color: "#5A584F",
            fontSize: "13px",
            fontWeight: "600",
            fontFamily: "var(--font-body), 'Inter', sans-serif",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
            transition: "all 0.16s ease",
            whiteSpace: "nowrap",
          }}
          className="talent-live-board-btn"
        >
          <span>LIVE BOARD</span>
          <ExternalLink size={14} style={{ color: "#8A6B2E" }} />
        </Link>

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
          {profile?.avatar ? (
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundImage: `url(${profile.avatar})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: "1px solid #E8E2D4",
                backgroundColor: "#F3EFE6",
              }}
            />
          ) : (
            <div
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
              {getInitials(profile?.personal?.fullName)}
            </div>
          )}
        </Link>
      </div>

      <style jsx global>{`
        @media (max-width: 1024px) {
          .talent-hamburger-btn {
            display: flex !important;
          }
          .talent-topbar-subtitle {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .talent-live-board-btn {
            display: none !important;
          }
        }
        .talent-live-board-btn:hover {
          border-color: #8A6B2E !important;
          color: #8A6B2E !important;
          background-color: #F3EFE6 !important;
        }
        .talent-bell-btn:hover {
          background-color: #F3EFE6 !important;
          border-color: #8A6B2E !important;
        }
      `}</style>
    </header>
  );
}
