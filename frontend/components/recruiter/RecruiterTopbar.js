"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Bell, PlusCircle, ExternalLink } from "lucide-react";
import { useRecruiter } from "@/lib/recruiter/RecruiterContext";
import { useWorkflow } from "@/lib/shared/workflowStore";

export default function RecruiterTopbar({ onOpenMobile }) {
  const pathname = usePathname();
  const { companyProfile } = useRecruiter();
  const { getNotificationsForRole, unreadNotificationsCount, markNotificationRead } = useWorkflow();
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  let unreadCount = 0;
  let notifications = [];
  try {
    unreadCount = unreadNotificationsCount("organization");
    notifications = getNotificationsForRole("organization");
  } catch (e) {
    // fallback
  }

  const getPageTitle = () => {
    if (pathname === "/recruiter/dashboard") return "Organization Overview";
    if (pathname === "/recruiter/projects") return "Projects Pipeline";
    if (pathname.startsWith("/recruiter/projects/")) return "Project Workspace";
    if (pathname === "/recruiter/opportunities") return "Opportunities & Briefs";
    if (pathname === "/recruiter/opportunities/new") return "Create Opportunity";
    if (pathname.startsWith("/recruiter/opportunities/")) return "Casting Call Details";
    if (pathname === "/recruiter/applications") return "Talent Submissions";
    if (pathname.startsWith("/recruiter/applications/")) return "Candidate Application";
    if (pathname === "/recruiter/shortlist-auditions") return "Auditions & Shortlists";
    if (pathname === "/recruiter/notifications") return "Notification Feed";
    if (pathname === "/recruiter/settings") return "Studio Settings";
    return "Organization Portal";
  };

  const recentUnread = notifications.filter((n) => !n.read).slice(0, 4);

  return (
    <header
      className="recruiter-topbar-header"
      style={{
        height: "var(--topbar-height)",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid #E8E2D4",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 clamp(16px, 3vw, 32px)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Left: Hamburger & Title */}
      <div className="recruiter-topbar-left" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
          }}
          className="recruiter-hamburger-btn"
        >
          <Menu size={20} />
        </button>

        <div className="recruiter-topbar-title-wrap" style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <div
            role="heading"
            aria-level={2}
            className="recruiter-topbar-title"
            style={{
              fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
              fontSize: "clamp(16px, 2vw, 22px)",
              lineHeight: "26px",
              fontWeight: 600,
              color: "#2B2D2A",
              letterSpacing: "-0.015em",
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "clamp(130px, 30vw, 360px)",
            }}
          >
            {getPageTitle()}
          </div>
          <span style={{ color: "#E8E2D4", fontWeight: 300 }} className="topbar-divider">/</span>
          <span
            style={{
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              fontSize: "12px",
              color: "#5A584F",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.10em",
              whiteSpace: "nowrap",
            }}
            className="topbar-subtitle"
          >
            {companyProfile.name || "Zee Films Studio"}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="recruiter-topbar-right" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {!pathname?.startsWith("/recruiter/opportunities/new") && pathname !== "/recruiter/opportunities" && (
          <Link
            href="/recruiter/opportunities/new"
            className="recruiter-topbar-post-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              height: "42px",
              minHeight: "42px",
              padding: "0 18px",
              borderRadius: "8px",
              backgroundColor: "#8A6B2E",
              color: "#FFFFFF",
              fontSize: "13.5px",
              fontWeight: "600",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              textDecoration: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(138, 107, 46, 0.22)",
              transition: "all 0.18s ease",
            }}
          >
            <PlusCircle size={16} />
            <span>Submit opportunity</span>
          </Link>
        )}

        {/* Notifications Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            aria-label="View notifications"
            className="recruiter-bell-btn"
            style={{
              minWidth: "44px",
              minHeight: "44px",
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
                width: "min(320px, calc(100vw - 32px))",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8E2D4",
                borderRadius: "16px",
                boxShadow: "0 16px 40px rgba(43, 45, 42, 0.12)",
                padding: "14px",
                zIndex: 50,
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E8E2D4", paddingBottom: "10px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#2B2D2A" }}>Studio Alerts</span>
                <Link
                  href="/recruiter/notifications"
                  onClick={() => setShowNotifMenu(false)}
                  style={{ fontSize: "11px", color: "#8A6B2E", fontWeight: "700", textDecoration: "none" }}
                >
                  View All
                </Link>
              </div>

              {recentUnread.length === 0 ? (
                <div style={{ padding: "16px 8px", textAlign: "center", fontSize: "13px", color: "#5A584F" }}>
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
                      backgroundColor: "#F3EFE6",
                      fontSize: "12px",
                      cursor: "pointer",
                      border: "1px solid #E8E2D4",
                    }}
                  >
                    <div style={{ fontWeight: "700", color: "#2B2D2A", marginBottom: "2px" }}>{notif.title || notif.message}</div>
                    <div style={{ color: "#5A584F", lineHeight: 1.4 }}>{notif.message}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Studio Avatar Button */}
        <Link
          href="/recruiter/settings"
          title="Studio Settings"
          className="recruiter-avatar-btn"
          style={{
            width: "44px",
            height: "44px",
            minWidth: "44px",
            minHeight: "44px",
            borderRadius: "10px",
            backgroundColor: "#F3EFE6",
            border: "1px solid #E8E2D4",
            color: "#8A6B2E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "700",
            fontSize: "15px",
            textDecoration: "none",
            transition: "all 0.18s ease",
          }}
        >
          {(companyProfile.name || "Z").charAt(0).toUpperCase()}
        </Link>
      </div>

      <style jsx>{`
        @media (max-width: 1023.98px) {
          .recruiter-hamburger-btn {
            display: flex !important;
            min-width: 44px;
            min-height: 44px;
          }
          .topbar-subtitle, .topbar-divider {
            display: none !important;
          }
        }
        @media (max-width: 767.98px) {
          .recruiter-topbar-post-btn {
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            min-height: 40px !important;
            padding: 0 !important;
            justify-content: center !important;
          }
          .recruiter-topbar-post-btn span {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          .recruiter-topbar-header {
            height: 56px !important;
            padding: 0 12px !important;
          }
          .recruiter-topbar-left {
            gap: 8px !important;
            min-width: 0 !important;
            flex: 1 !important;
          }
          .recruiter-hamburger-btn {
            width: 36px !important;
            height: 36px !important;
            min-width: 36px !important;
            min-height: 36px !important;
            border-radius: 8px !important;
            padding: 0 !important;
            flex-shrink: 0 !important;
          }
          .recruiter-hamburger-btn :global(svg) {
            width: 18px !important;
            height: 18px !important;
          }
          .recruiter-topbar-title-wrap {
            min-width: 0 !important;
            flex: 1 !important;
            gap: 0 !important;
          }
          .recruiter-topbar-title {
            font-size: 17px !important;
            line-height: 1.25 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            min-width: 0 !important;
            flex: 1 !important;
            max-width: 100% !important;
          }
          .topbar-subtitle, .topbar-divider {
            display: none !important;
          }
          .recruiter-topbar-right {
            gap: 8px !important;
            flex-shrink: 0 !important;
          }
          .recruiter-topbar-post-btn {
            display: inline-flex !important;
            width: 36px !important;
            height: 36px !important;
            min-width: 36px !important;
            min-height: 36px !important;
            padding: 0 !important;
            border-radius: 8px !important;
            align-items: center !important;
            justify-content: center !important;
            flex-shrink: 0 !important;
          }
          .recruiter-topbar-post-btn span {
            display: none !important;
          }
          .recruiter-topbar-post-btn :global(svg) {
            width: 18px !important;
            height: 18px !important;
          }
          .recruiter-bell-btn {
            width: 36px !important;
            height: 36px !important;
            min-width: 36px !important;
            min-height: 36px !important;
            padding: 0 !important;
            border-radius: 8px !important;
            flex-shrink: 0 !important;
          }
          .recruiter-bell-btn :global(svg) {
            width: 17px !important;
            height: 17px !important;
          }
          .recruiter-avatar-btn {
            width: 34px !important;
            height: 34px !important;
            min-width: 34px !important;
            min-height: 34px !important;
            border-radius: 8px !important;
            font-size: 13.5px !important;
            flex-shrink: 0 !important;
          }
        }
      `}</style>
    </header>
  );
}
