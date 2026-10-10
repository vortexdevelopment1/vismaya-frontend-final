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

  return (
    <header
      style={{
        backgroundColor: "rgba(10, 15, 25, 0.90)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 clamp(16px, 3vw, 32px)",
        position: "sticky",
        top: 0,
        zIndex: 30,
        width: "100%",
        boxSizing: "border-box",
      }}
      className="talent-topbar"
    >
      {/* Left: Mobile Toggle & Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
        <button
          onClick={onOpenMobile}
          aria-label="Open navigation drawer"
          style={{
            color: "#eceaf5",
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
          className="talent-hamburger-btn"
        >
          <Menu size={20} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <h1
            style={{
              fontFamily: "var(--font-heading), 'Playfair Display', serif",
              fontSize: "clamp(16px, 3vw, 20px)",
              lineHeight: 1.3,
              fontWeight: "700",
              color: "#eceaf5",
              letterSpacing: "-0.015em",
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {getPageTitle()}
          </h1>
          <span style={{ color: "rgba(255, 255, 255, 0.2)" }} className="topbar-divider">/</span>
          <span
            style={{
              fontSize: "11px",
              color: "var(--gold)",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              whiteSpace: "nowrap",
            }}
            className="topbar-subtitle"
          >
            Vismaya
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
        {/* Live Board Link (hidden below 768px) */}
        <Link
          href="/opportunities"
          style={{
            fontSize: "12px",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#a3acc2",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "0 14px",
            minHeight: "38px",
            borderRadius: "999px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.10)",
            transition: "all 0.18s ease",
          }}
          className="public-opps-link"
        >
          <span>Live Board</span>
          <ExternalLink size={13} />
        </Link>

        {/* Notifications Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            aria-label="View notifications"
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
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
                  backgroundColor: "var(--gold)",
                  color: "#1a1300",
                  fontSize: "10px",
                  fontWeight: "900",
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
                top: "52px",
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "10px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#eceaf5" }}>Recent Alerts</span>
                <Link
                  href="/talent/notifications"
                  onClick={() => setShowNotifMenu(false)}
                  style={{ fontSize: "11px", color: "var(--gold)", fontWeight: "700", textDecoration: "none" }}
                >
                  View All
                </Link>
              </div>

              {recentUnread.length === 0 ? (
                <div style={{ padding: "16px 8px", textAlign: "center", fontSize: "13px", color: "#a3acc2" }}>
                  No new notifications
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
                    }}
                  >
                    <div style={{ fontWeight: "700", color: "#eceaf5", marginBottom: "2px" }}>{notif.title}</div>
                    <div style={{ color: "#a3acc2", lineHeight: 1.4 }}>{notif.message}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Mobile Avatar Link (shown only on mobile < 1024px) */}
        <Link
          href="/talent/profile"
          aria-label="View artist profile"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundImage: `url(${profile.avatar})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            border: "2px solid rgba(255, 188, 0, 0.4)",
            flexShrink: 0,
            display: "none",
          }}
          className="topbar-mobile-avatar"
        />
      </div>

      <style jsx>{`
        .talent-topbar {
          height: 72px;
        }
        .talent-hamburger-btn {
          display: none;
        }
        @media (max-width: 1023.98px) {
          .talent-topbar {
            height: 64px !important;
          }
          .talent-hamburger-btn {
            display: flex !important;
          }
          .topbar-mobile-avatar {
            display: block !important;
          }
        }
        @media (max-width: 767.98px) {
          .public-opps-link {
            display: none !important;
          }
          .topbar-subtitle,
          .topbar-divider {
            display: none !important;
          }
        }
        :global(.public-opps-link:hover) {
          color: var(--gold) !important;
          border-color: rgba(255, 188, 0, 0.35) !important;
          background-color: rgba(255, 188, 0, 0.10) !important;
        }
      `}</style>
    </header>
  );
}
