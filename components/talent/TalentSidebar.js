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
import StatusBadge from "@/components/shared/StatusBadge";

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

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(7, 11, 18, 0.84)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 40,
          }}
        />
      )}

      <aside
        style={{
          width: "var(--sidebar-width)",
          maxWidth: "min(var(--sidebar-width), 85vw)",
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
        className={`talent-sidebar ${mobileOpen ? "sidebar-open" : ""}`}
      >
        {/* Top Header: Logo & Mobile Close */}
        <div
          style={{
            height: "var(--topbar-height)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            flexShrink: 0,
          }}
        >
          <Logo variant="light" size="sm" href="/talent/dashboard" />
          <button
            onClick={onCloseMobile}
            aria-label="Close navigation"
            style={{
              color: "#a3acc2",
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            className="mobile-close-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Talent Portal Pill & Verification Status */}
        <div style={{ padding: "16px 16px 8px 16px", flexShrink: 0 }}>
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
                  Talent Portal
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#a3acc2",
                  }}
                >
                  Artist Workspace
                </span>
              </div>
            </div>

            <StatusBadge status={profile.status} size="xs" />
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav
          style={{
            flex: 1,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
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
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minHeight: "44px",
                  padding: "0 14px",
                  borderRadius: "12px",
                  color: active ? "var(--gold)" : "#a3acc2",
                  backgroundColor: active ? "rgba(255, 188, 0, 0.14)" : "transparent",
                  borderLeft: active ? "3px solid var(--gold)" : "3px solid transparent",
                  fontWeight: active ? "700" : "600",
                  fontSize: "13px",
                  textDecoration: "none",
                  transition: "all var(--transition)",
                }}
                className={`talent-nav-item ${active ? "talent-nav-active" : ""}`}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {Icon && (
                    <Icon
                      size={18}
                      style={{
                        color: active ? "var(--gold)" : "#7e89a3",
                        transition: "color var(--transition)",
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

        {/* Sidebar Bottom: User Card & Logout */}
        <div
          style={{
            padding: "16px 16px calc(16px + env(safe-area-inset-bottom, 0px)) 16px",
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
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundImage: `url(${profile.avatar})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  border: "2px solid rgba(255, 188, 0, 0.35)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.35)",
                  flexShrink: 0,
                  backgroundColor: "#0f1626",
                }}
              />
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
                  {profile.personal.fullName}
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
                  {profile.personal.city} &bull; {profile.status}
                </span>
              </div>
            </Link>

            <Link
              href="/login"
              onClick={async (e) => {
                e.preventDefault();
                await logout();
                router.push("/login");
              }}
              title="Logout of Vismaya"
              style={{
                color: "#a3acc2",
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all var(--transition)",
                textDecoration: "none",
                flexShrink: 0,
              }}
              className="talent-logout-btn"
            >
              <LogOut size={18} />
            </Link>
          </div>
        </div>
      </aside>

      <style jsx global>{`
        @media (max-width: 1023.98px) {
          .talent-sidebar {
            transform: translateX(-100%);
            box-shadow: 8px 0 32px rgba(0, 0, 0, 0.6);
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
        .talent-nav-item:hover:not(.talent-nav-active) {
          background-color: rgba(255, 255, 255, 0.06) !important;
          color: #eceaf5 !important;
        }
        .talent-logout-btn:hover {
          color: var(--gold) !important;
          background-color: rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </>
  );
}
