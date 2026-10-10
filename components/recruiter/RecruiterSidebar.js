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

export default function RecruiterSidebar({ mobileOpen = false, onCloseMobile }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const searchParams = useSearchParams();
  const fromParam = searchParams?.get("from");
  const { unreadNotificationsCount: oldUnread, companyProfile } = useRecruiter();

  let unreadNotificationsCount = oldUnread;
  let shortlistsReadyCount = 0;
  try {
    const { unreadNotificationsCount: wfUnread, applications } = useWorkflow();
    unreadNotificationsCount = wfUnread("organization");
    shortlistsReadyCount = applications.filter((a) => a.status === "Shortlisted").length;
  } catch (e) {
    // fallback
  }

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
            backgroundColor: "rgba(7, 11, 18, 0.82)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 40,
          }}
        />
      )}

      <aside
        style={{
          width: "var(--sidebar-width)",
          backgroundColor: "#070b12",
          borderRight: "1px solid rgba(255, 255, 255, 0.08)",
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
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            paddingTop: "env(safe-area-inset-top, 0px)",
          }}
        >
          <Logo variant="light" size="sm" href="/recruiter/dashboard" />
          <button
            onClick={onCloseMobile}
            aria-label="Close navigation"
            style={{
              color: "#a3acc2",
              padding: "8px",
              minHeight: "44px",
              minWidth: "44px",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
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
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "10px 14px",
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
                  backgroundColor: "var(--gold)",
                  boxShadow: "0 0 8px rgba(255, 188, 0, 0.6)",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#eceaf5",
                  }}
                >
                  Organization
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#a3acc2",
                  }}
                >
                  Studio Console
                </span>
              </div>
            </div>

            <StatusBadge status={companyProfile.status || "Verified"} size="xs" />
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
                  color: active ? "var(--gold)" : "#a3acc2",
                  backgroundColor: active ? "rgba(255, 188, 0, 0.14)" : "transparent",
                  borderLeft: active ? "3px solid var(--gold)" : "3px solid transparent",
                  fontWeight: active ? "700" : "500",
                  fontSize: "13px",
                  textDecoration: "none",
                  outline: "none",
                }}
                className={`recruiter-nav-item ${active ? "recruiter-nav-active" : ""}`}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {Icon && (
                    <Icon
                      size={18}
                      style={{
                        color: active ? "var(--gold)" : "#7e89a3",
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
                      fontSize: "11px",
                      fontWeight: "800",
                      padding: "0 6px",
                      borderRadius: "999px",
                      backgroundColor: active ? "var(--gold)" : "rgba(255, 188, 0, 0.20)",
                      color: active ? "#1a1300" : "var(--gold)",
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
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            backgroundColor: "#070b12",
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
                  backgroundColor: "rgba(255, 188, 0, 0.12)",
                  border: "1px solid rgba(255, 188, 0, 0.30)",
                  color: "var(--gold)",
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
                    color: "#eceaf5",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {companyProfile.name || "Zee Films Studio"}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#a3acc2",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {companyProfile.location || "Mumbai"} • Production
                </span>
              </div>
            </div>

            <Link
              href="/login"
              onClick={async (e) => {
                e.preventDefault();
                await logout();
                router.push("/login");
              }}
              title="Logout of Organization Portal"
              style={{
                color: "#a3acc2",
                padding: "8px",
                minHeight: "44px",
                minWidth: "44px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
              }}
              className="recruiter-logout-btn"
            >
              <LogOut size={16} />
            </Link>
          </div>
        </div>
      </aside>

      <style jsx global>{`
        @media (max-width: 1023.98px) {
          .recruiter-sidebar {
            transform: translateX(-100%);
            box-shadow: 8px 0 32px rgba(0, 0, 0, 0.6);
          }
          .recruiter-sidebar.sidebar-open {
            transform: translateX(0);
          }
          .mobile-close-btn {
            display: flex !important;
          }
        }
        @media (min-width: 1024px) {
          .mobile-close-btn {
            display: none !important;
          }
        }
        @media (hover: hover) {
          .recruiter-nav-item:hover:not(.recruiter-nav-active) {
            background-color: rgba(255, 255, 255, 0.06) !important;
            color: #eceaf5 !important;
          }
          .recruiter-logout-btn:hover {
            color: var(--gold) !important;
            background-color: rgba(255, 255, 255, 0.08);
          }
        }
        .recruiter-nav-item:focus-visible {
          outline: 2px solid var(--gold) !important;
          outline-offset: -2px;
        }
      `}</style>
    </>
  );
}
