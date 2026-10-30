"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  Search,
  Download,
  FileSpreadsheet,
  X,
  Loader2,
  User,
  Building2,
  Briefcase,
} from "lucide-react";
import { useWorkflow } from "@/lib/shared/workflowStore";
import { adminService } from "@/lib/api/services/adminService";
import { useAdmin } from "@/lib/admin/AdminContext";
import { useAuth } from "@/context/AuthContext";

export default function AdminTopbar({ onOpenMobile }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const getInitials = (str) => {
    if (!str) return "SA";
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return str.slice(0, 2).toUpperCase();
  };

  const { notifications = [], markNotificationRead } = useWorkflow();
  const adminCtx = useAdmin();

  // Notifications State
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const notifRef = useRef(null);

  // Export State
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportingType, setExportingType] = useState(null);
  const exportRef = useRef(null);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef(null);
  const directoryCacheRef = useRef({ talents: null, organizations: null, opportunities: null });

  // Clear search on route change
  useEffect(() => {
    setSearchQuery("");
    setSearchResults(null);
    setShowSearchDropdown(false);
  }, [pathname]);

  // Debounced Search (300ms, min 2 chars)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowSearchDropdown(true);

    const timer = setTimeout(async () => {
      try {
        let talents = adminCtx?.talents?.length ? adminCtx.talents : directoryCacheRef.current.talents;
        let orgs = adminCtx?.recruiters?.length ? adminCtx.recruiters : directoryCacheRef.current.organizations;
        let opps = directoryCacheRef.current.opportunities;

        if (!talents || !orgs || !opps) {
          const [tRes, oRes, oppRes] = await Promise.allSettled([
            !talents ? adminService.getTalentDirectory() : Promise.resolve({ data: talents }),
            !orgs ? adminService.getOrganizationDirectory() : Promise.resolve({ data: orgs }),
            !opps ? adminService.getAllOpportunities() : Promise.resolve({ data: opps }),
          ]);
          if (tRes.status === "fulfilled" && tRes.value?.data) {
            talents = Array.isArray(tRes.value.data) ? tRes.value.data : [];
            directoryCacheRef.current.talents = talents;
          }
          if (oRes.status === "fulfilled" && oRes.value?.data) {
            orgs = Array.isArray(oRes.value.data) ? oRes.value.data : [];
            directoryCacheRef.current.organizations = orgs;
          }
          if (oppRes.status === "fulfilled" && oppRes.value?.data) {
            opps = Array.isArray(oppRes.value.data) ? oppRes.value.data : [];
            directoryCacheRef.current.opportunities = opps;
          }
        }

        const q = trimmed.toLowerCase();

        // 1. Talent match
        const matchedTalents = (talents || []).filter((t) => {
          const name = `${t.stageName || ""} ${t.firstName || ""} ${t.lastName || ""} ${t.fullName || ""} ${t.name || ""}`.toLowerCase();
          const role = (t.primaryRole || t.title || t.category || "").toLowerCase();
          const studio = (t.studio || "").toLowerCase();
          return name.includes(q) || role.includes(q) || studio.includes(q);
        }).slice(0, 5);

        // 2. Organization match
        const matchedOrgs = (orgs || []).filter((o) => {
          const name = `${o.organizationName || ""} ${o.name || ""} ${o.companyName || ""}`.toLowerCase();
          const type = (o.organizationType || o.industry || o.type || "").toLowerCase();
          const studio = (o.studio || "").toLowerCase();
          return name.includes(q) || type.includes(q) || studio.includes(q);
        }).slice(0, 5);

        // 3. Opportunities match
        const matchedOpps = (opps || []).filter((opp) => {
          const title = `${opp.title || ""} ${opp.opportunityTitle || ""}`.toLowerCase();
          const role = (opp.role || "").toLowerCase();
          const studio = `${opp.studio || ""} ${opp.projectName || ""} ${opp.organizationName || ""}`.toLowerCase();
          return title.includes(q) || role.includes(q) || studio.includes(q);
        }).slice(0, 5);

        setSearchResults({
          talents: matchedTalents,
          organizations: matchedOrgs,
          opportunities: matchedOpps,
        });
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, adminCtx?.talents, adminCtx?.recruiters]);

  // Click outside listener and Escape key dismiss
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifMenu(false);
      }
    };
    const handleGlobalKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowSearchDropdown(false);
        setShowExportMenu(false);
        setShowNotifMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);

  const handleSearchKeyDown = (e) => {
    if (e.key === "Escape") {
      setShowSearchDropdown(false);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const tCount = searchResults?.talents?.length || 0;
      const oCount = searchResults?.organizations?.length || 0;
      const oppCount = searchResults?.opportunities?.length || 0;
      const totalCount = tCount + oCount + oppCount;

      if (totalCount === 0) {
        setShowSearchDropdown(true);
        return;
      }

      let targetUrl = `/admin/talent-management?search=${encodeURIComponent(searchQuery.trim())}`;
      if (oCount > tCount && oCount >= oppCount) {
        targetUrl = `/admin/recruiter-management?search=${encodeURIComponent(searchQuery.trim())}`;
      } else if (oppCount > tCount && oppCount > oCount) {
        targetUrl = `/admin/opportunities?search=${encodeURIComponent(searchQuery.trim())}`;
      }
      setShowSearchDropdown(false);
      router.push(targetUrl);
    }
  };

  const handleExport = async (type) => {
    setExportingType(type);
    try {
      const exportFn = adminService.exportAdminData || adminService.exportData;
      const res = await exportFn.call(adminService, type);
      if (typeof window !== "undefined") {
        const blob = new Blob([typeof res === "string" ? res : JSON.stringify(res)], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `vismaya-export-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error("Export error:", err);
      alert(`Export failed: ${err?.message || "Error generating CSV"}`);
    } finally {
      setExportingType(null);
      setShowExportMenu(false);
    }
  };

  const adminNotifications = notifications.filter(
    (n) => n.toRole === "vismaya" || (!n.toRole && !n.toUserId)
  );
  const unreadCount = adminNotifications.filter((n) => !n.read).length;

  const getPageTitle = () => {
    if (pathname === "/admin/dashboard" || pathname === "/admin") return "Dashboard";
    if (pathname === "/admin/profile") return "Admin Profile";
    if (pathname === "/admin/talent-management") return "Talent Management";
    if (pathname === "/admin/recruiter-management") return "Organization Management";
    if (pathname === "/admin/informational-profiles") return "Informational Profiles";
    if (pathname === "/admin/verifications") return "Verification Queues";
    if (pathname === "/admin/opportunity-review") return "Opportunity Review";
    if (pathname === "/admin/opportunities") return "Opportunities Directory";
    if (pathname === "/admin/applications") return "Applications Registry";
    if (pathname === "/admin/auditions") return "Auditions & Self-Tapes";
    if (pathname === "/admin/success-stories") return "Success Stories Approval";
    if (pathname === "/admin/media-moderation" || pathname === "/admin/content-moderation") return "Content Moderation";
    if (pathname === "/admin/projects") return "Projects Directory";
    if (pathname === "/admin/payments") return "Escrow & Payments";
    if (pathname === "/admin/credits") return "Organization Credits";
    if (pathname === "/admin/audit-logs") return "Security & Operations Audit Trail";
    if (pathname === "/admin/cancellation-requests") return "Cancellation Requests";
    if (pathname === "/admin/analytics") return "Platform Analytics";
    if (pathname === "/admin/notifications") return "Notifications & Broadcasts";
    return "Operations Console";
  };

  const recentUnread = adminNotifications.filter((n) => !n.read).slice(0, 4);

  return (
    <header className="admin-topbar-header">
      {/* 1. Grid Area: menu */}
      <div className="admin-topbar-menu-area">
        <button
          type="button"
          onClick={onOpenMobile}
          aria-label="Open navigation drawer"
          className="admin-hamburger-btn"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* 2. Grid Area: title */}
      <div className="admin-topbar-title-area">
        <h1 className="admin-topbar-title" title={getPageTitle()}>
          {getPageTitle()}
        </h1>
        <span className="admin-desktop-subtitle">
          Super-Admin &bull; Vismaya
        </span>
      </div>

      {/* 3. Grid Area: search */}
      <div ref={searchContainerRef} className="admin-topbar-search-area">
        <div className="admin-global-search-inner">
          {isSearching ? (
            <Loader2 size={16} className="animate-spin admin-search-icon" />
          ) : (
            <Search size={16} className="admin-search-icon" />
          )}

          <input
            type="text"
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim().length >= 2) {
                setShowSearchDropdown(true);
              }
            }}
            onFocus={() => {
              if (searchQuery.trim().length >= 2) {
                setShowSearchDropdown(true);
              }
            }}
            onKeyDown={handleSearchKeyDown}
            className="admin-global-search-input"
            aria-label="Search records"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSearchResults(null);
                setShowSearchDropdown(false);
              }}
              className="admin-search-clear-btn"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Global Search Results Dropdown */}
        {showSearchDropdown && (
          <div className="admin-search-dropdown-menu">
            {isSearching ? (
              <div className="admin-search-loading">
                <Loader2 size={16} className="animate-spin" />
                <span>Searching records...</span>
              </div>
            ) : searchResults ? (
              <>
                {/* Talent Section */}
                {(searchResults.talents || []).length > 0 && (
                  <div>
                    <div className="admin-search-cat-header">
                      Talent ({searchResults.talents.length})
                    </div>
                    {searchResults.talents.map((t, idx) => {
                      const name =
                        t.stageName ||
                        `${t.firstName || ""} ${t.lastName || ""}`.trim() ||
                        t.name ||
                        "Talent";
                      const subtitle = t.primaryRole || t.title || t.category || "Talent Profile";
                      return (
                        <Link
                          key={`talent-${idx}`}
                          href={`/admin/talent-management?search=${encodeURIComponent(name)}`}
                          onClick={() => setShowSearchDropdown(false)}
                          className="admin-search-item"
                        >
                          <div className="admin-search-item-left">
                            <User size={14} style={{ color: "#8A6B2E", flexShrink: 0 }} />
                            <span className="admin-search-item-title">{name}</span>
                          </div>
                          <span className="admin-search-item-sub">{subtitle}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Organizations Section */}
                {(searchResults.organizations || []).length > 0 && (
                  <div>
                    <div className="admin-search-cat-header">
                      Organizations ({searchResults.organizations.length})
                    </div>
                    {searchResults.organizations.map((org, idx) => {
                      const name = org.organizationName || org.name || org.companyName || "Organization";
                      const subtitle = org.organizationType || org.industry || org.type || "Organization";
                      return (
                        <Link
                          key={`org-${idx}`}
                          href={`/admin/recruiter-management?search=${encodeURIComponent(name)}`}
                          onClick={() => setShowSearchDropdown(false)}
                          className="admin-search-item"
                        >
                          <div className="admin-search-item-left">
                            <Building2 size={14} style={{ color: "#8A6B2E", flexShrink: 0 }} />
                            <span className="admin-search-item-title">{name}</span>
                          </div>
                          <span className="admin-search-item-sub">{subtitle}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Opportunities Section */}
                {(searchResults.opportunities || []).length > 0 && (
                  <div>
                    <div className="admin-search-cat-header">
                      Opportunities ({searchResults.opportunities.length})
                    </div>
                    {searchResults.opportunities.map((opp, idx) => {
                      const title = opp.title || opp.opportunityTitle || opp.role || "Opportunity";
                      const subtitle = opp.role || opp.projectName || opp.organizationName || "Opportunity";
                      return (
                        <Link
                          key={`opp-${idx}`}
                          href={`/admin/opportunities?search=${encodeURIComponent(title)}`}
                          onClick={() => setShowSearchDropdown(false)}
                          className="admin-search-item"
                        >
                          <div className="admin-search-item-left">
                            <Briefcase size={14} style={{ color: "#8A6B2E", flexShrink: 0 }} />
                            <span className="admin-search-item-title">{title}</span>
                          </div>
                          <span className="admin-search-item-sub">{subtitle}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Empty State */}
                {!searchResults.talents?.length &&
                  !searchResults.organizations?.length &&
                  !searchResults.opportunities?.length && (
                    <div className="admin-search-empty">
                      No results for &ldquo;{searchQuery}&rdquo;
                    </div>
                  )}
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* 4. Grid Area: actions */}
      <div className="admin-topbar-actions-area">
        {/* Export CSV Reports */}
        <div ref={exportRef} className="admin-export-wrapper">
          <button
            type="button"
            onClick={() => setShowExportMenu(!showExportMenu)}
            aria-label="Export CSV Reports"
            className="admin-export-btn"
            title="Download Operational CSV Reports"
          >
            {exportingType ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} style={{ color: "#8A6B2E", flexShrink: 0 }} />
            )}
            <span className="admin-export-btn-text">Exports</span>
          </button>

          {showExportMenu && (
            <div className="admin-export-menu">
              <div className="admin-export-menu-header">
                Export CSV Reports
              </div>
              {[
                { type: "users", label: "Users Registry" },
                { type: "organizations", label: "Organizations" },
                { type: "opportunities", label: "Opportunities" },
                { type: "applications", label: "Applications" },
                { type: "transactions", label: "Payment Transactions" },
              ].map((exp) => (
                <button
                  key={exp.type}
                  type="button"
                  onClick={() => handleExport(exp.type)}
                  disabled={!!exportingType}
                  className="admin-export-item"
                >
                  <FileSpreadsheet size={14} style={{ color: "#8A6B2E", flexShrink: 0 }} />
                  <span>{exp.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div ref={notifRef} className="admin-notif-wrapper">
          <button
            type="button"
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            aria-label="View system alerts"
            className={`admin-notif-btn ${showNotifMenu ? "active" : ""}`}
            title="System Alerts"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="admin-notif-badge">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="admin-notif-menu">
              <div className="admin-notif-menu-header">
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#2B2D2A" }}>
                  Operations Alerts
                </span>
                <Link
                  href="/admin/notifications"
                  onClick={() => setShowNotifMenu(false)}
                  style={{
                    fontSize: "12px",
                    color: "#8A6B2E",
                    fontWeight: "600",
                    textDecoration: "none",
                  }}
                >
                  View all
                </Link>
              </div>

              {recentUnread.length === 0 ? (
                <div style={{ padding: "16px 8px", textAlign: "center", fontSize: "13px", color: "#5A584F" }}>
                  You are all caught up
                </div>
              ) : (
                recentUnread.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      markNotificationRead(notif.id);
                      setShowNotifMenu(false);
                    }}
                    className="admin-notif-item"
                  >
                    <div style={{ fontWeight: "600", color: "#2B2D2A", marginBottom: "2px" }}>
                      {notif.title || "Alert"}
                    </div>
                    <div style={{ color: "#5A584F", lineHeight: 1.4 }}>{notif.message}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User Avatar with SA initial linking to Admin Profile */}
        <Link
          href="/admin/profile"
          className={`admin-avatar-btn ${pathname === "/admin/profile" ? "active" : ""}`}
          title={`${user?.name || "Super Admin"} (Admin Profile)`}
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user?.name || "Admin"}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            getInitials(user?.name)
          )}
        </Link>
      </div>

      <style jsx global>{`
        /* ==========================================================================
           Admin Topbar Responsive Grid System
           ========================================================================== */

        /* 1) Below 640px (Mobile) */
        @media (max-width: 639px) {
          .admin-topbar-header {
            display: grid !important;
            grid-template-areas:
              "menu title actions"
              "search search search" !important;
            grid-template-columns: auto minmax(0, 1fr) auto !important;
            grid-template-rows: auto auto !important;
            gap: 10px 8px !important;
            padding: 10px 14px !important;
            height: auto !important;
            min-height: unset !important;
          }
          .admin-hamburger-btn {
            display: flex !important;
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            min-height: 40px !important;
          }
          .admin-topbar-title {
            font-size: 17px !important;
          }
          .admin-export-btn-text,
          .admin-desktop-subtitle {
            display: none !important;
          }
          .admin-export-btn {
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            min-height: 40px !important;
            padding: 0 !important;
            justify-content: center !important;
          }
          .admin-notif-btn {
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            min-height: 40px !important;
          }
          .admin-avatar-btn {
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            min-height: 40px !important;
          }
          .admin-global-search-input {
            height: 40px !important;
          }
        }

        /* Narrow mobile < 380px */
        @media (max-width: 379px) {
          .admin-topbar-header {
            padding: 8px 10px !important;
            gap: 8px 6px !important;
          }
          .admin-topbar-actions-area {
            gap: 6px !important;
          }
          .admin-hamburger-btn,
          .admin-export-btn,
          .admin-notif-btn,
          .admin-avatar-btn {
            width: 38px !important;
            height: 38px !important;
            min-width: 38px !important;
            min-height: 38px !important;
            border-radius: 8px !important;
          }
          .admin-avatar-btn {
            border-radius: 50% !important;
          }
          .admin-topbar-title {
            font-size: 15.5px !important;
          }
          .admin-global-search-input {
            height: 38px !important;
            font-size: 13px !important;
          }
        }

        /* 2) 640px to 1023px (Tablets) */
        @media (min-width: 640px) and (max-width: 1023px) {
          .admin-topbar-header {
            display: grid !important;
            grid-template-areas:
              "menu title actions"
              "search search search" !important;
            grid-template-columns: auto minmax(0, 1fr) auto !important;
            grid-template-rows: auto auto !important;
            gap: 12px 14px !important;
            padding: 12px 24px !important;
            height: auto !important;
            min-height: unset !important;
          }
          .admin-hamburger-btn {
            display: flex !important;
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            min-height: 40px !important;
          }
          .admin-topbar-title {
            font-size: 19px !important;
          }
          .admin-export-btn-text,
          .admin-desktop-subtitle {
            display: none !important;
          }
          .admin-export-btn {
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            min-height: 40px !important;
            padding: 0 !important;
            justify-content: center !important;
          }
          .admin-notif-btn {
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            min-height: 40px !important;
          }
          .admin-avatar-btn {
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            min-height: 40px !important;
          }
          .admin-global-search-input {
            height: 40px !important;
          }
        }

        /* 3) 1024px and above (Desktop) */
        @media (min-width: 1024px) {
          .admin-topbar-header {
            display: grid !important;
            grid-template-areas: "menu title search actions" !important;
            grid-template-columns: auto minmax(0, 1fr) minmax(240px, 420px) auto !important;
            grid-template-rows: auto !important;
            align-items: center !important;
            gap: 16px !important;
            padding: 14px 32px !important;
            height: 72px !important;
            min-height: 72px !important;
          }
          .admin-topbar-title {
            font-size: 20px !important;
          }
          .admin-export-btn-text {
            display: inline !important;
          }
          .admin-export-btn {
            width: auto !important;
            height: 40px !important;
            padding: 0 14px !important;
            gap: 6px !important;
          }
          .admin-desktop-subtitle {
            display: inline !important;
          }
          .admin-global-search-input {
            height: 40px !important;
          }
        }

        /* Hide hamburger when desktop sidebar is statically expanded (> 1100px) */
        @media (min-width: 1101px) {
          .admin-hamburger-btn {
            display: none !important;
          }
        }

        /* When <= 1100px, make sure hamburger is visible */
        @media (max-width: 1100px) {
          .admin-hamburger-btn {
            display: flex !important;
          }
        }

        /* Hide desktop subtitle on medium desktop if space is tight */
        @media (max-width: 1240px) {
          .admin-desktop-subtitle {
            display: none !important;
          }
        }
      `}</style>

      <style jsx>{`
        .admin-topbar-header {
          background-color: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid #E8E2D4;
          position: sticky;
          top: 0;
          z-index: 40;
          width: 100%;
          box-sizing: border-box;
          transition: padding 0.15s ease;
        }

        .admin-topbar-menu-area {
          grid-area: menu;
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .admin-topbar-title-area {
          grid-area: title;
          display: flex;
          align-items: baseline;
          gap: 10px;
          min-width: 0;
          overflow: hidden;
        }

        .admin-topbar-title {
          font-family: var(--font-heading), 'Playfair Display', Georgia, serif;
          line-height: 1.25;
          font-weight: 600;
          color: #2B2D2A;
          margin: 0;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }

        .admin-desktop-subtitle {
          font-family: var(--font-body), 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: #5A584F;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .admin-topbar-search-area {
          grid-area: search;
          position: relative;
          width: 100%;
          min-width: 0;
        }

        .admin-global-search-inner {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .admin-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: "#8A6B2E";
          color: #8A6B2E;
          pointer-events: none;
          z-index: 2;
        }

        .admin-global-search-input {
          width: 100%;
          padding-left: 38px;
          padding-right: 36px;
          border: 1px solid #D9D1BF;
          border-radius: 10px;
          background-color: #FFFFFF;
          color: #2B2D2A;
          font-family: var(--font-body), 'Inter', sans-serif;
          font-size: 13.5px;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .admin-global-search-input:focus {
          border-color: #8A6B2E;
          box-shadow: 0 0 0 3px rgba(138, 107, 46, 0.16);
        }

        .admin-global-search-input::placeholder {
          color: #8A8170;
        }

        .admin-search-clear-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: transparent;
          color: #8A8170;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          transition: color 0.15s ease;
        }

        .admin-search-clear-btn:hover {
          color: #2B2D2A;
        }

        .admin-search-dropdown-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background-color: #FFFFFF;
          border: 1px solid #D9D1BF;
          border-radius: 10px;
          box-shadow: 0 12px 32px rgba(42, 36, 26, 0.14);
          max-height: 420px;
          overflow-y: auto;
          padding: 8px;
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .admin-search-loading {
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          color: #8A6B2E;
          font-family: var(--font-body), 'Inter', sans-serif;
        }

        .admin-search-cat-header {
          font-size: 11px;
          font-weight: 700;
          color: #8A6B2E;
          text-transform: uppercase;
          padding: 4px 8px 6px;
          letter-spacing: 0.06em;
          font-family: var(--font-body), 'Inter', sans-serif;
        }

        .admin-search-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
          border-radius: 8px;
          background-color: #FAF9F7;
          border: 1px solid #F0EEEA;
          text-decoration: none;
          margin-bottom: 4px;
          transition: background 0.12s ease;
        }

        .admin-search-item:hover {
          background-color: #F3EFE6;
        }

        .admin-search-item-left {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .admin-search-item-title {
          font-size: 13px;
          font-weight: 600;
          color: #2B2D2A;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-family: var(--font-body), 'Inter', sans-serif;
        }

        .admin-search-item-sub {
          font-size: 11px;
          color: #8A8170;
          white-space: nowrap;
          flex-shrink: 0;
          margin-left: 8px;
          font-family: var(--font-body), 'Inter', sans-serif;
        }

        .admin-search-empty {
          padding: 16px;
          text-align: center;
          font-size: 13px;
          color: #8A8170;
          font-family: var(--font-body), 'Inter', sans-serif;
        }

        .admin-topbar-actions-area {
          grid-area: actions;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex-shrink: 0;
        }

        .admin-hamburger-btn {
          color: #2B2D2A;
          width: 40px;
          height: 40px;
          min-width: 40px;
          min-height: 40px;
          border-radius: 10px;
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }

        .admin-hamburger-btn:hover {
          background-color: #F3EFE6;
          border-color: #8A6B2E;
        }

        .admin-export-wrapper {
          position: relative;
        }

        .admin-export-btn {
          height: 40px;
          min-height: 40px;
          border-radius: 10px;
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          color: #2B2D2A;
          font-family: var(--font-body), 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          box-sizing: border-box;
          transition: all 0.15s ease;
        }

        .admin-export-btn:hover {
          background-color: #F3EFE6;
          border-color: #8A6B2E;
        }

        .admin-export-menu {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          width: 220px;
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          border-radius: 12px;
          box-shadow: 0 12px 28px rgba(43, 45, 42, 0.12);
          padding: 8px;
          z-index: 60;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .admin-export-menu-header {
          font-size: 11px;
          font-weight: 700;
          color: #5A584F;
          padding: 6px 8px;
          text-transform: uppercase;
          font-family: var(--font-body), 'Inter', sans-serif;
        }

        .admin-export-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 8px;
          border: none;
          background-color: transparent;
          color: #2B2D2A;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
          font-family: var(--font-body), 'Inter', sans-serif;
          transition: background 0.15s ease;
        }

        .admin-export-item:hover {
          background-color: #F3EFE6;
        }

        .admin-notif-wrapper {
          position: relative;
          overflow: visible;
        }

        .admin-notif-btn {
          width: 40px;
          height: 40px;
          min-width: 40px;
          min-height: 40px;
          border-radius: 10px;
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          color: #5A584F;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          overflow: visible;
          flex-shrink: 0;
          transition: all 0.16s ease;
        }

        .admin-notif-btn:hover,
        .admin-notif-btn.active {
          background-color: #F3EFE6;
          border-color: #8A6B2E;
          color: #8A6B2E;
        }

        .admin-notif-badge {
          position: absolute;
          top: -3px;
          right: -3px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background-color: #8A6B2E;
          color: #FFFFFF;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(138, 107, 46, 0.35);
          z-index: 2;
          pointer-events: none;
          font-family: var(--font-body), 'Inter', sans-serif;
        }

        .admin-notif-menu {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          width: min(340px, calc(100vw - 32px));
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          borderRadius: 16px;
          border-radius: 16px;
          box-shadow: 0 16px 40px rgba(43, 45, 42, 0.12);
          padding: 16px;
          z-index: 60;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .admin-notif-menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #E8E2D4;
          padding-bottom: 10px;
          font-family: var(--font-body), 'Inter', sans-serif;
        }

        .admin-notif-item {
          padding: 10px 12px;
          border-radius: 10px;
          background-color: #F3EFE6;
          border: 1px solid #E8E2D4;
          font-size: 12px;
          cursor: pointer;
          font-family: var(--font-body), 'Inter', sans-serif;
          transition: background 0.15s ease;
        }

        .admin-notif-item:hover {
          background-color: #EFE9DC;
        }

        .admin-avatar-btn {
          width: 40px;
          height: 40px;
          min-width: 40px;
          min-height: 40px;
          border-radius: 50%;
          background-color: #F3EFE6;
          border: 1.5px solid #E8E2D4;
          color: #8A6B2E;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-body), 'Inter', sans-serif;
          font-size: 13px;
          fontWeight: 700;
          font-weight: 700;
          cursor: pointer;
          user-select: none;
          letter-spacing: 0.02em;
          text-decoration: none;
          overflow: hidden;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }

        .admin-avatar-btn:hover,
        .admin-avatar-btn.active {
          border-color: #8A6B2E;
          box-shadow: 0 0 0 2px rgba(138, 107, 46, 0.2);
        }
      `}</style>
    </header>
  );
}
