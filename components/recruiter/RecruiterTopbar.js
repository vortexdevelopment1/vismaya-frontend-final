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
      style={{
        height: "var(--topbar-height)",
        backgroundColor: "rgba(10, 15, 25, 0.88)",
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
      }}
    >
      {/* Left: Hamburger & Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
          }}
          className="recruiter-hamburger-btn"
        >
          <Menu size={20} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <h1
            style={{
              fontFamily: "var(--font-heading), 'Playfair Display', serif",
              fontSize: "clamp(16px, 2.5vw, 20px)",
              lineHeight: "28px",
              fontWeight: "700",
              color: "#eceaf5",
              letterSpacing: "-0.015em",
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "clamp(160px, 35vw, 400px)",
            }}
          >
            {getPageTitle()}
          </h1>
          <span style={{ color: "rgba(255, 255, 255, 0.2)" }} className="topbar-divider">/</span>
          <span
            style={{
              fontSize: "12px",
              color: "var(--gold)",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              whiteSpace: "nowrap",
            }}
            className="topbar-subtitle"
          >
            {companyProfile.name || "Zee Films Studio"}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Link
          href="/recruiter/opportunities/new"
          className="recruiter-topbar-post-btn"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            height: "40px",
            minHeight: "40px",
            padding: "0 14px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #d4af37 0%, #f3e5ab 100%)",
            color: "#0c1222",
            fontSize: "13px",
            fontWeight: "600",
            fontFamily: "var(--font-sans), Inter, sans-serif",
            textDecoration: "none",
            whiteSpace: "nowrap",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(212, 175, 55, 0.25)",
            transition: "all 0.18s ease",
          }}
        >
          <PlusCircle size={15} />
          <span>Submit opportunity</span>
        </Link>

        {/* Notifications Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            aria-label="View notifications"
            style={{
              minWidth: "44px",
              minHeight: "44px",
              width: "44px",
              height: "44px",
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
                width: "min(320px, calc(100vw - 32px))",
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
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#eceaf5" }}>Studio Alerts</span>
                <Link
                  href="/recruiter/notifications"
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
                    <div style={{ fontWeight: "700", color: "#eceaf5", marginBottom: "2px" }}>{notif.title || notif.message}</div>
                    <div style={{ color: "#a3acc2", lineHeight: 1.4 }}>{notif.message}</div>
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
          style={{
            width: "44px",
            height: "44px",
            minWidth: "44px",
            minHeight: "44px",
            borderRadius: "10px",
            backgroundColor: "rgba(255, 188, 0, 0.12)",
            border: "1px solid rgba(255, 188, 0, 0.3)",
            color: "var(--gold)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "800",
            fontSize: "14px",
            textDecoration: "none",
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
      `}</style>
    </header>
  );
}
