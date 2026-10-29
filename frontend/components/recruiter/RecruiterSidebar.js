"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { LogOut, X, Building2 } from "lucide-react";
import Logo from "@/components/Logo";
import { recruiterNav, getActiveRecruiterNavItem } from "@/lib/recruiter/nav";
import { useRecruiter } from "@/lib/recruiter/RecruiterContext";
import { useWorkflow } from "@/lib/shared/workflowStore";
import { useAuth } from "@/context/AuthContext";
import StatusBadge from "@/components/shared/StatusBadge";

export default function RecruiterSidebar({ mobileOpen = false, onCloseMobile, onOpenLogout }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const searchParams = useSearchParams();
  const fromParam = searchParams?.get("from");
  const { unreadNotificationsCount: oldUnread, companyProfile } = useRecruiter();
  const { unreadNotificationsCount: wfUnread, applications = [] } = useWorkflow() || {};

  const unreadNotificationsCount = typeof wfUnread === "function" ? wfUnread("organization") : oldUnread;
  const shortlistsReadyCount = applications.filter((a) => a.status === "Shortlisted").length;

  // Active item determined by "most specific / longest match wins" and origin context
  const activeHref = getActiveRecruiterNavItem(pathname, fromParam);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && mobileOpen) {
        onCloseMobile();
      }
    };
    if (mobileOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  // Close drawer on route change
  useEffect(() => {
    if (mobileOpen) {
      onCloseMobile();
    }
  }, [pathname]);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(43, 45, 42, 0.45)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            zIndex: 40,
          }}
        />
      )}

      <aside
        style={{
          width: "var(--sidebar-width)",
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid #E8E2D4",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          height: "100dvh",
          maxHeight: "100dvh",
          zIndex: 50,
          transition: "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
          transform: mobileOpen ? "translateX(0)" : undefined,
          boxShadow: mobileOpen ? "8px 0 28px rgba(43, 45, 42, 0.12)" : "none",
        }}
        className={`recruiter-sidebar ${mobileOpen ? "sidebar-open" : ""}`}
      >
        {/* Top Header */}
        <div
          style={{
            height: "var(--topbar-height)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            borderBottom: "1px solid #E8E2D4",
            paddingTop: "env(safe-area-inset-top, 0px)",
            backgroundColor: "#FFFFFF",
          }}
        >
          <Logo variant="dark" size="sm" href="/recruiter/dashboard" />
          <button
            onClick={onCloseMobile}
            aria-label="Close navigation"
            style={{
              color: "#5A584F",
              padding: "8px",
              minHeight: "44px",
              minWidth: "44px",
              borderRadius: "10px",
              backgroundColor: "#F3EFE6",
              border: "1px solid #E8E2D4",
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            className="mobile-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Organization Status Box */}
        <div style={{ padding: "16px 16px 8px 16px" }}>
          <div
            style={{
              backgroundColor: "#F3EFE6",
              border: "1px solid #E8E2D4",
              borderRadius: "14px",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#8A6B2E",
                  boxShadow: "0 0 6px rgba(138, 107, 46, 0.4)",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#2B2D2A",
                  }}
                >
                  Organization
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#5A584F",
                  }}
                >
                  Studio Console
                </span>
              </div>
            </div>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "2px 8px",
                borderRadius: "999px",
                backgroundColor: "rgba(138, 107, 46, 0.10)",
                border: "1px solid rgba(138, 107, 46, 0.20)",
                color: "#8A6B2E",
                fontSize: "10px",
                fontWeight: "700",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              VERIFIED
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {recruiterNav.map((item) => {
            const active = activeHref === item.href;
            const Icon = item.icon;
            let badgeCount = null;
            if (item.badgeKey === "unreadNotifications") {
              badgeCount = unreadNotificationsCount;
            } else if (item.badgeKey === "shortlistsReady") {
              badgeCount = shortlistsReadyCount;
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                aria-current={active ? "page" : undefined}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minHeight: "44px",
                  height: "44px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  color: active ? "#8A6B2E" : "#5A584F",
                  backgroundColor: active ? "#F3EFE6" : "transparent",
                  borderLeft: active ? "3px solid #8A6B2E" : "3px solid transparent",
                  fontWeight: active ? "600" : "500",
                  fontSize: "15px",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
                  textDecoration: "none",
                  outline: "none",
                  transition: "all 0.16s ease",
                }}
                className={`recruiter-nav-item ${active ? "recruiter-nav-active" : ""}`}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {Icon && (
                    <Icon
                      size={20}
                      strokeWidth={2}
                      style={{
                        color: active ? "#8A6B2E" : "#5A584F",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <span>{item.title}</span>
                </div>

                {badgeCount !== null && badgeCount > 0 && (
                  <span
                    style={{
                      height: "20px",
                      minWidth: "20px",
                      fontSize: "12px",
                      fontWeight: "700",
                      padding: "0 6px",
                      borderRadius: "999px",
                      backgroundColor: "#8A6B2E",
                      color: "#FFFFFF",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Studio Info */}
        <div
          style={{
            padding: "16px",
            paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
            borderTop: "1px solid #E8E2D4",
            backgroundColor: "#FFFFFF",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  backgroundColor: "#F3EFE6",
                  border: "1px solid #E8E2D4",
                  color: "#8A6B2E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Building2 size={18} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#2B2D2A",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {companyProfile?.companyName || companyProfile?.name || companyProfile?.studioName || ""}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#5A584F",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {companyProfile.location || "Mumbai"} • Production
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (typeof onOpenLogout === "function") {
                  onOpenLogout();
                } else {
                  logout();
                }
              }}
              title="Logout of Organization Portal"
              aria-label="Logout of Organization Portal"
              style={{
                color: "#5A584F",
                padding: "8px",
                minHeight: "44px",
                minWidth: "44px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                transition: "all 0.16s ease",
              }}
              className="recruiter-logout-btn"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <style jsx global>{`
        @media (max-width: 1366px) and (min-width: 1101px) {
          .recruiter-sidebar {
            width: 240px !important;
          }
          :global(.recruiter-sidebar .recruiter-nav-item) {
            padding: 8px 12px !important;
            font-size: 13px !important;
          }
        }
        @media (max-width: 1100px) {
          .recruiter-sidebar:not(.sidebar-open) {
            transform: translateX(-115%) !important;
            left: -320px !important;
            visibility: hidden !important;
            pointer-events: none !important;
            box-shadow: none !important;
            border-right: none !important;
          }
          .recruiter-sidebar.sidebar-open {
            left: 0 !important;
            transform: translateX(0) !important;
            visibility: visible !important;
            pointer-events: auto !important;
            box-shadow: 8px 0 28px rgba(43, 45, 42, 0.12) !important;
            border-right: 1px solid #E8E2D4 !important;
          }
          .mobile-close-btn {
            display: flex !important;
          }
        }
        @media (min-width: 1101px) {
          .mobile-close-btn {
            display: none !important;
          }
        }
        @media (hover: hover) {
          .recruiter-nav-item:hover:not(.recruiter-nav-active) {
            background-color: #F3EFE6 !important;
            color: #2B2D2A !important;
          }
          .recruiter-logout-btn:hover {
            color: #8A6B2E !important;
            background-color: #F3EFE6;
          }
        }
        .recruiter-nav-item:focus-visible {
          outline: 2px solid #8A6B2E !important;
          outline-offset: -2px;
        }
      `}</style>
    </>
  );
}
