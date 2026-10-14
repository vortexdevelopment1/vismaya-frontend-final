"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, X, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";
import { adminNavSections, adminNav } from "@/lib/admin/nav";
import { useAdmin } from "@/lib/admin/AdminContext";
import { useAuth } from "@/context/AuthContext";
import { useWorkflow } from "@/lib/shared/workflowStore";

export default function AdminSidebar({ mobileOpen = false, onCloseMobile }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const {
    pendingTalentsCount,
    pendingRecruitersCount,
    pendingMediaCount,
  } = useAdmin();

  const {
    opportunities = [],
    auditions = [],
    cancellationRequests = [],
    notifications = [],
  } = useWorkflow();

  const pendingOpportunitiesCount = opportunities.filter((o) => o.status === "Submitted").length;
  const pendingAuditionsCount = auditions.filter(
    (a) => a.status === "Requested" || a.status === "Self-tape Received"
  ).length;
  const pendingCancellationsCount = cancellationRequests.filter((c) => c.status === "Pending").length;
  const unreadAdminNotificationsCount = notifications.filter(
    (n) => !n.read && (n.toRole === "vismaya" || (!n.toRole && !n.toUserId))
  ).length;

  // Auto-close on escape key and route change on mobile
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && mobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  useEffect(() => {
    if (mobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  }, [pathname]);

  // "Longest match wins" rule for active nav item
  const activeHref = useMemo(() => {
    const allHrefs = adminNav.map((i) => i.href);
    const matches = allHrefs.filter((href) => {
      if (href === "/admin/dashboard") {
        return pathname === "/admin/dashboard" || pathname === "/admin";
      }
      return pathname === href || pathname.startsWith(href + "/");
    });
    if (matches.length === 0) return null;
    matches.sort((a, b) => b.length - a.length);
    return matches[0];
  }, [pathname]);

  const getBadgeCount = (badgeKey) => {
    switch (badgeKey) {
      case "pendingTalents":
        return pendingTalentsCount;
      case "pendingOrganizations":
        return pendingRecruitersCount;
      case "pendingMedia":
        return pendingMediaCount;
      case "pendingOpportunities":
        return pendingOpportunitiesCount;
      case "pendingAuditions":
        return pendingAuditionsCount;
      case "pendingCancellations":
        return pendingCancellationsCount;
      case "unreadNotifications":
        return unreadAdminNotificationsCount;
      default:
        return 0;
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          aria-hidden="true"
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
        aria-label="Admin Navigation Sidebar"
        style={{
          width: "var(--sidebar-width, 280px)",
          height: "100vh",
          maxHeight: "100vh",
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid #E8E2D4",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
          transition: "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
          transform: mobileOpen ? "translateX(0)" : undefined,
          boxShadow: mobileOpen ? "8px 0 28px rgba(43, 45, 42, 0.12)" : "none",
        }}
        className={`admin-sidebar ${mobileOpen ? "sidebar-open" : ""}`}
      >
        {/* FIXED TOP: Logo Header */}
        <div
          style={{
            height: "var(--topbar-height, 72px)",
            minHeight: "var(--topbar-height, 72px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            borderBottom: "1px solid #E8E2D4",
            backgroundColor: "#FFFFFF",
            flexShrink: 0,
          }}
        >
          <Logo variant="dark" size="sm" href="/admin/dashboard" />
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

        {/* FIXED TOP: Vismaya Operations Desk Card */}
        <div style={{ padding: "12px 16px 8px 16px", flexShrink: 0 }}>
          <div
            style={{
              backgroundColor: "#F3EFE6",
              border: "1px solid #E8E2D4",
              borderRadius: "14px",
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
                  backgroundColor: "#8A6B2E",
                  boxShadow: "0 0 6px rgba(138, 107, 46, 0.4)",
                  flexShrink: 0,
                }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#2B2D2A",
                    lineHeight: 1.25,
                    fontFamily: "var(--font-body), 'Inter', sans-serif",
                  }}
                >
                  Vismaya Desk
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#5A584F",
                    lineHeight: 1.2,
                    fontFamily: "var(--font-body), 'Inter', sans-serif",
                  }}
                >
                  Operations Console
                </span>
              </div>
            </div>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "3px 9px",
                borderRadius: "999px",
                backgroundColor: "rgba(138, 107, 46, 0.12)",
                border: "1px solid rgba(138, 107, 46, 0.22)",
                color: "#8A6B2E",
                fontSize: "10px",
                fontWeight: "700",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              ACTIVE
            </span>
          </div>
        </div>

        {/* MIDDLE NAV AREA: flex 1, min-height 0, overflow-y auto */}
        <nav
          style={{
            flex: "1 1 0%",
            minHeight: 0,
            overflowY: "auto",
            padding: "8px 14px 16px 14px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
          className="admin-sidebar-scroll"
        >
          {adminNavSections.map((section, sIdx) => (
            <div key={sIdx} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  color: "#5A584F",
                  padding: "16px 10px 6px 10px",
                  userSelect: "none",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
                }}
              >
                {section.group}
              </div>

              {section.items.map((item) => {
                const active = activeHref === item.href;
                const Icon = item.icon;
                const badgeCount = getBadgeCount(item.badgeKey);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    title={item.label}
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      height: "44px",
                      minHeight: "44px",
                      padding: "0 14px",
                      borderRadius: "10px",
                      color: active ? "#8A6B2E" : "#5A584F",
                      backgroundColor: active ? "#F3EFE6" : "transparent",
                      borderLeft: active ? "3px solid #8A6B2E" : "3px solid transparent",
                      fontWeight: active ? "600" : "500",
                      fontSize: "15px",
                      fontFamily: "var(--font-body), 'Inter', sans-serif",
                      textDecoration: "none",
                      transition: "all 0.16s ease",
                      whiteSpace: "nowrap",
                    }}
                    className={`admin-nav-item ${active ? "admin-nav-active" : ""}`}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                      {Icon && (
                        <Icon
                          size={20}
                          strokeWidth={2}
                          style={{
                            color: active ? "#8A6B2E" : "#5A584F",
                            transition: "color 0.16s ease",
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <span
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.label}
                      </span>
                    </div>

                    {badgeCount > 0 && (
                      <span
                        style={{
                          height: "22px",
                          minWidth: "22px",
                          fontSize: "12px",
                          fontWeight: "700",
                          padding: "0 6px",
                          borderRadius: "999px",
                          backgroundColor: "#8A6B2E",
                          color: "#FFFFFF",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginLeft: "6px",
                        }}
                      >
                        {badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* FIXED BOTTOM: User Profile Block */}
        <div
          style={{
            padding: "14px 16px",
            borderTop: "1px solid #E8E2D4",
            backgroundColor: "#FFFFFF",
            flexShrink: 0,
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
                  backgroundColor: "rgba(138, 107, 46, 0.12)",
                  border: "1px solid rgba(138, 107, 46, 0.25)",
                  color: "#8A6B2E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={18} />
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
                    lineHeight: 1.25,
                    fontFamily: "var(--font-body), 'Inter', sans-serif",
                  }}
                >
                  Super Admin
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#5A584F",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: 1.2,
                    fontFamily: "var(--font-body), 'Inter', sans-serif",
                  }}
                >
                  Compliance &bull; Root
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                await logout();
              }}
              title="Logout of Admin Console"
              aria-label="Logout of Admin Console"
              style={{
                color: "#5A584F",
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.16s ease",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                flexShrink: 0,
              }}
              className="admin-logout-btn"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <style jsx global>{`
        .admin-sidebar-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .admin-sidebar-scroll::-webkit-scrollbar-thumb {
          background: #E8E2D4;
          border-radius: 4px;
        }
        @media (max-width: 1024px) {
          .admin-sidebar {
            transform: translateX(-105%) !important;
            visibility: hidden !important;
            pointer-events: none !important;
            box-shadow: none !important;
            border-right: none !important;
          }
          .admin-sidebar.sidebar-open {
            transform: translateX(0) !important;
            visibility: visible !important;
            pointer-events: auto !important;
            box-shadow: 8px 0 32px rgba(43, 45, 42, 0.18) !important;
            border-right: 1px solid #E8E2D4 !important;
          }
          .mobile-close-btn {
            display: flex !important;
          }
        }
        @media (max-width: 640px) {
          .admin-sidebar {
            width: min(82vw, 300px) !important;
            max-width: 300px !important;
          }
          :global(.admin-sidebar .admin-nav-item) {
            height: 44px !important;
            min-height: 44px !important;
            font-size: 14px !important;
          }
        }
        @media (min-width: 1025px) {
          .mobile-close-btn {
            display: none !important;
          }
        }
        .admin-nav-item:hover:not(.admin-nav-active) {
          background-color: #F3EFE6 !important;
          color: #2B2D2A !important;
        }
        .admin-logout-btn:hover {
          color: #8A6B2E !important;
          background-color: #F3EFE6;
        }
      `}</style>
    </>
  );
}
