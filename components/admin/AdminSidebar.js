"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, X, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";
import { adminNavSections, adminNav } from "@/lib/admin/nav";
import { useAdmin } from "@/lib/admin/AdminContext";
import { useAuth } from "@/context/AuthContext";
import StatusBadge from "@/components/shared/StatusBadge";
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
    // Sort descending by length
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
            backgroundColor: "rgba(7, 11, 18, 0.82)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 40,
          }}
        />
      )}

      <aside
        aria-label="Admin Navigation Sidebar"
        style={{
          width: "var(--sidebar-width, 260px)",
          height: "100vh",
          maxHeight: "100vh",
          backgroundColor: "#070b12",
          borderRight: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
          transition: "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
          transform: mobileOpen ? "translateX(0)" : undefined,
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
            padding: "0 18px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            flexShrink: 0,
          }}
        >
          <Logo variant="light" size="sm" href="/admin/dashboard" />
          <button
            onClick={onCloseMobile}
            aria-label="Close navigation"
            style={{
              color: "#a3acc2",
              padding: "6px",
              borderRadius: "8px",
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

        {/* FIXED TOP: Vismaya Operations Desk Card */}
        <div style={{ padding: "10px 14px 4px 14px", flexShrink: 0 }}>
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "10px",
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <div
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: "var(--gold)",
                  boxShadow: "0 0 8px rgba(255, 188, 0, 0.6)",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#eceaf5",
                    lineHeight: 1.2,
                  }}
                >
                  Vismaya Desk
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    color: "#a3acc2",
                    lineHeight: 1.2,
                  }}
                >
                  Operations Console
                </span>
              </div>
            </div>

            <StatusBadge status="Active" size="xs" />
          </div>
        </div>

        {/* MIDDLE NAV AREA: flex 1, min-height 0, overflow-y auto */}
        <nav
          style={{
            flex: "1 1 0%",
            minHeight: 0,
            overflowY: "auto",
            padding: "6px 12px 12px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
          className="admin-sidebar-scroll"
        >
          {adminNavSections.map((section, sIdx) => (
            <div key={sIdx} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#7e89a3",
                  padding: "4px 10px 2px 10px",
                  userSelect: "none",
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
                      height: "40px",
                      minHeight: "40px",
                      padding: "0 10px",
                      borderRadius: "8px",
                      color: active ? "var(--gold)" : "#a3acc2",
                      backgroundColor: active ? "rgba(255, 188, 0, 0.14)" : "transparent",
                      borderLeft: active ? "3px solid var(--gold)" : "3px solid transparent",
                      fontWeight: active ? "600" : "500",
                      fontSize: "13px",
                      textDecoration: "none",
                      transition: "all var(--transition)",
                      whiteSpace: "nowrap",
                    }}
                    className={`admin-nav-item ${active ? "admin-nav-active" : ""}`}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
                      {Icon && (
                        <Icon
                          size={17}
                          style={{
                            color: active ? "var(--gold)" : "#7e89a3",
                            transition: "color var(--transition)",
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
                          height: "18px",
                          minWidth: "18px",
                          fontSize: "10px",
                          fontWeight: "700",
                          padding: "0 5px",
                          borderRadius: "999px",
                          backgroundColor: active ? "var(--gold)" : "rgba(255, 188, 0, 0.20)",
                          color: active ? "#1a1300" : "var(--gold)",
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
            padding: "10px 14px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            backgroundColor: "#070b12",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 188, 0, 0.12)",
                  border: "1px solid rgba(255, 188, 0, 0.30)",
                  color: "var(--gold)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={16} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#eceaf5",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: 1.2,
                  }}
                >
                  Super Admin
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    color: "#a3acc2",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: 1.2,
                  }}
                >
                  Compliance &bull; Root
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
              title="Logout of Admin Console"
              style={{
                color: "#a3acc2",
                padding: "6px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all var(--transition)",
                textDecoration: "none",
                flexShrink: 0,
              }}
              className="admin-logout-btn"
            >
              <LogOut size={15} />
            </Link>
          </div>
        </div>
      </aside>

      <style jsx global>{`
        .admin-sidebar-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .admin-sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 4px;
        }
        @media (max-width: 1024px) {
          .admin-sidebar {
            transform: translateX(-100%);
            box-shadow: 8px 0 32px rgba(0, 0, 0, 0.6);
          }
          .admin-sidebar.sidebar-open {
            transform: translateX(0);
          }
          .mobile-close-btn {
            display: flex !important;
          }
        }
        @media (min-width: 1025px) {
          .mobile-close-btn {
            display: none !important;
          }
        }
        .admin-nav-item:hover:not(.admin-nav-active) {
          background-color: rgba(255, 255, 255, 0.06) !important;
          color: #eceaf5 !important;
        }
        .admin-logout-btn:hover {
          color: var(--gold) !important;
          background-color: rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </>
  );
}

