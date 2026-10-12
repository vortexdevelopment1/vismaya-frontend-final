"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, X } from "lucide-react";
import Logo from "@/components/Logo";
import { talentNav } from "@/lib/talent/nav";
import { useTalent } from "@/lib/talent/TalentContext";
import { useWorkflow } from "@/lib/shared/workflowStore";
import { useAuth } from "@/context/AuthContext";

export default function TalentSidebar({ mobileOpen = false, onCloseMobile }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { profile } = useTalent();
  const { applications, auditions, unreadNotificationsCount } = useWorkflow();

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && mobileOpen) {
        onCloseMobile?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  // Close sidebar on route change
  useEffect(() => {
    if (mobileOpen) {
      onCloseMobile?.();
    }
  }, [pathname]);

  const currentTalentId = "tal-904";

  const unreadNotifsCount = unreadNotificationsCount("talent", currentTalentId);
  const shortlistedCount = applications.filter(
    (a) => a.talentId === currentTalentId && (a.status === "Shortlisted" || a.status === "Selected")
  ).length;
  const pendingAuditionsCount = auditions.filter(
    (aud) => aud.talentId === currentTalentId && aud.status === "Relayed to Talent"
  ).length;

  const isNavActive = (href) => {
    if (pathname === href) return true;
    if (href !== "/talent/dashboard" && pathname.startsWith(href)) return true;
    return false;
  };

  const getInitials = (name) => {
    if (!name) return "TA";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
        aria-label="Talent Navigation Sidebar"
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
        className={`talent-sidebar ${mobileOpen ? "sidebar-open" : ""}`}
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
          <Logo variant="dark" size="sm" href="/talent/dashboard" />
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

        {/* FIXED TOP: Talent Portal Card */}
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
                  Talent Portal
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#5A584F",
                    lineHeight: 1.2,
                    fontFamily: "var(--font-body), 'Inter', sans-serif",
                  }}
                >
                  Artist Workspace
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
              APPROVED
            </span>
          </div>
        </div>

        {/* MIDDLE NAV: flex 1, min-height 0, overflow-y auto */}
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
          className="talent-sidebar-scroll"
        >
          {talentNav.map((item) => {
            const active = isNavActive(item.href);
            const Icon = item.icon;
            let badgeCount = null;
            if (item.badgeKey === "unreadNotifications") {
              badgeCount = unreadNotifsCount;
            } else if (item.badgeKey === "shortlistedCount") {
              badgeCount = shortlistedCount;
            } else if (item.badgeKey === "pendingAuditions") {
              badgeCount = pendingAuditionsCount;
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                title={item.title}
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
                className={`talent-nav-item ${active ? "talent-nav-active" : ""}`}
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
                    {item.title}
                  </span>
                </div>

                {badgeCount !== null && badgeCount > 0 && (
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
        </nav>

        {/* FIXED BOTTOM: User Profile Block */}
        <div
          style={{
            padding: "14px 16px calc(14px + env(safe-area-inset-bottom, 0px)) 16px",
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
            <Link
              href="/talent/profile"
              onClick={onCloseMobile}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                minWidth: 0,
                textDecoration: "none",
              }}
            >
              {profile?.avatar ? (
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    backgroundImage: `url(${profile.avatar})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    border: "1px solid #E8E2D4",
                    flexShrink: 0,
                    backgroundColor: "#F3EFE6",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    backgroundColor: "#F3EFE6",
                    border: "1px solid #E8E2D4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "13px",
                    color: "#8A6B2E",
                    flexShrink: 0,
                  }}
                >
                  {getInitials(profile?.personal?.fullName)}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#2B2D2A",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontFamily: "var(--font-body), 'Inter', sans-serif",
                  }}
                >
                  {profile?.personal?.fullName || "Artist Profile"}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#5A584F",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontFamily: "var(--font-body), 'Inter', sans-serif",
                  }}
                >
                  {profile?.personal?.city || "Mumbai"} &bull; Verified
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                await logout();
              }}
              title="Logout of Vismaya"
              aria-label="Logout"
              style={{
                color: "#5A584F",
                width: "34px",
                height: "34px",
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
              className="talent-logout-btn"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <style jsx global>{`
        @media (max-width: 1023.98px) {
          .talent-sidebar {
            transform: translateX(-100%);
          }
          .talent-sidebar.sidebar-open {
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
        .talent-sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: #E8E2D4 transparent;
        }
        .talent-sidebar-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .talent-sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .talent-sidebar-scroll::-webkit-scrollbar-thumb {
          background: #E8E2D4;
          border-radius: 4px;
        }
        .talent-nav-item:hover:not(.talent-nav-active) {
          background-color: #F3EFE6 !important;
          color: #2B2D2A !important;
        }
        .talent-logout-btn:hover {
          color: #8A6B2E !important;
          background-color: #F3EFE6 !important;
        }
      `}</style>
    </>
  );
}
