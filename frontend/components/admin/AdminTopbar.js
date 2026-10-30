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
import "./AdminTopbar.css";

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
      <div className="admin-topbar-menu-area" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40px", height: "40px" }}>
        <button
          type="button"
          onClick={onOpenMobile}
          aria-label="Open navigation drawer"
          className="admin-hamburger-btn"
          style={{
            width: "40px",
            height: "40px",
            minWidth: "40px",
            minHeight: "40px",
            borderRadius: "10px",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            color: "#2B2D2A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            margin: 0,
            padding: 0,
          }}
        >
          <Menu size={20} />
        </button>
      </div>

      {/* 2. Grid Area: title */}
      <div
        className="admin-topbar-title-area"
        style={{
          display: "flex",
          alignItems: "center",
          minHeight: "40px",
          height: "40px",
          gap: "10px",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <h1
          className="admin-topbar-title"
          title={getPageTitle()}
          style={{
            fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
            lineHeight: 1,
            fontWeight: 600,
            color: "#2B2D2A",
            margin: 0,
            padding: 0,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            height: "100%",
          }}
        >
          {getPageTitle()}
        </h1>
        <span
          className="admin-desktop-subtitle"
          style={{
            fontFamily: "var(--font-body), 'Inter', sans-serif",
            fontSize: "11px",
            fontWeight: 600,
            color: "#5A584F",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            flexShrink: 0,
            lineHeight: 1,
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Super-Admin &bull; Vismaya
        </span>
      </div>

      {/* 3. Grid Area: search */}
      <div
        ref={searchContainerRef}
        className="admin-topbar-search-area"
        style={{
          position: "relative",
          width: "100%",
          minWidth: 0,
        }}
      >
        <div
          className="admin-global-search-inner"
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            width: "100%",
          }}
        >
          {isSearching ? (
            <Loader2
              size={16}
              className="animate-spin admin-search-icon"
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#8A6B2E",
                pointerEvents: "none",
                zIndex: 2,
              }}
            />
          ) : (
            <Search
              size={16}
              className="admin-search-icon"
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#8A6B2E",
                pointerEvents: "none",
                zIndex: 2,
              }}
            />
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
            style={{
              width: "100%",
              height: "42px",
              paddingLeft: "42px",
              paddingRight: "36px",
              border: "1px solid #D9D1BF",
              borderRadius: "10px",
              backgroundColor: "#FFFFFF",
              color: "#2B2D2A",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              fontSize: "13.5px",
              boxSizing: "border-box",
              outline: "none",
            }}
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
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
                color: "#8A8170",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Global Search Results Dropdown */}
        {showSearchDropdown && (
          <div
            className="admin-search-dropdown-menu"
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              backgroundColor: "#FFFFFF",
              border: "1px solid #D9D1BF",
              borderRadius: "10px",
              boxShadow: "0 12px 32px rgba(42, 36, 26, 0.14)",
              maxHeight: "420px",
              overflowY: "auto",
              padding: "8px",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {isSearching ? (
              <div
                style={{
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: "#8A6B2E",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
                }}
              >
                <Loader2 size={16} className="animate-spin" />
                <span>Searching records...</span>
              </div>
            ) : searchResults ? (
              <>
                {/* Talent Section */}
                {(searchResults.talents || []).length > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "#8A6B2E",
                        textTransform: "uppercase",
                        padding: "4px 8px 6px",
                        letterSpacing: "0.06em",
                        fontFamily: "var(--font-body), 'Inter', sans-serif",
                      }}
                    >
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
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 10px",
                            borderRadius: "8px",
                            backgroundColor: "#FAF9F7",
                            border: "1px solid #F0EEEA",
                            textDecoration: "none",
                            marginBottom: "4px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                            <User size={14} style={{ color: "#8A6B2E", flexShrink: 0 }} />
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
                              {name}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#8A8170",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                              marginLeft: "8px",
                              fontFamily: "var(--font-body), 'Inter', sans-serif",
                            }}
                          >
                            {subtitle}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Organizations Section */}
                {(searchResults.organizations || []).length > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "#8A6B2E",
                        textTransform: "uppercase",
                        padding: "4px 8px 6px",
                        letterSpacing: "0.06em",
                        fontFamily: "var(--font-body), 'Inter', sans-serif",
                      }}
                    >
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
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 10px",
                            borderRadius: "8px",
                            backgroundColor: "#FAF9F7",
                            border: "1px solid #F0EEEA",
                            textDecoration: "none",
                            marginBottom: "4px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                            <Building2 size={14} style={{ color: "#8A6B2E", flexShrink: 0 }} />
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
                              {name}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#8A8170",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                              marginLeft: "8px",
                              fontFamily: "var(--font-body), 'Inter', sans-serif",
                            }}
                          >
                            {subtitle}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Opportunities Section */}
                {(searchResults.opportunities || []).length > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "#8A6B2E",
                        textTransform: "uppercase",
                        padding: "4px 8px 6px",
                        letterSpacing: "0.06em",
                        fontFamily: "var(--font-body), 'Inter', sans-serif",
                      }}
                    >
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
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 10px",
                            borderRadius: "8px",
                            backgroundColor: "#FAF9F7",
                            border: "1px solid #F0EEEA",
                            textDecoration: "none",
                            marginBottom: "4px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                            <Briefcase size={14} style={{ color: "#8A6B2E", flexShrink: 0 }} />
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
                              {title}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#8A8170",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                              marginLeft: "8px",
                              fontFamily: "var(--font-body), 'Inter', sans-serif",
                            }}
                          >
                            {subtitle}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Empty State */}
                {!searchResults.talents?.length &&
                  !searchResults.organizations?.length &&
                  !searchResults.opportunities?.length && (
                    <div
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        fontSize: "13px",
                        color: "#8A8170",
                        fontFamily: "var(--font-body), 'Inter', sans-serif",
                      }}
                    >
                      No results for &ldquo;{searchQuery}&rdquo;
                    </div>
                  )}
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* 4. Grid Area: actions (Horizontal Row) */}
      <div
        className="admin-topbar-actions-area"
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "10px",
          flexShrink: 0,
        }}
      >
        {/* Export CSV Reports */}
        <div ref={exportRef} className="admin-export-wrapper" style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setShowExportMenu(!showExportMenu)}
            aria-label="Export CSV Reports"
            className="admin-export-btn"
            title="Download Operational CSV Reports"
            style={{
              height: "40px",
              minHeight: "40px",
              borderRadius: "10px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E2D4",
              color: "#2B2D2A",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              boxSizing: "border-box",
            }}
          >
            {exportingType ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} style={{ color: "#8A6B2E", flexShrink: 0 }} />
            )}
            <span className="admin-export-btn-text" style={{ marginLeft: "6px" }}>
              Exports
            </span>
          </button>

          {showExportMenu && (
            <div
              className="admin-export-menu"
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                width: "220px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8E2D4",
                borderRadius: "12px",
                boxShadow: "0 12px 28px rgba(43, 45, 42, 0.12)",
                padding: "8px",
                zIndex: 60,
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#5A584F",
                  padding: "6px 8px",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
                }}
              >
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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "transparent",
                    color: "#2B2D2A",
                    fontSize: "13px",
                    fontWeight: "500",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "var(--font-body), 'Inter', sans-serif",
                  }}
                >
                  <FileSpreadsheet size={14} style={{ color: "#8A6B2E", flexShrink: 0 }} />
                  <span>{exp.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div ref={notifRef} className="admin-notif-wrapper" style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            aria-label="View system alerts"
            className="admin-notif-btn"
            title="System Alerts"
            style={{
              width: "40px",
              height: "40px",
              minWidth: "40px",
              minHeight: "40px",
              borderRadius: "10px",
              backgroundColor: showNotifMenu ? "#F3EFE6" : "#FFFFFF",
              border: `1px solid ${showNotifMenu ? "#8A6B2E" : "#E8E2D4"}`,
              color: showNotifMenu ? "#8A6B2E" : "#5A584F",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
              flexShrink: 0,
              boxSizing: "border-box",
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                className="admin-notif-badge"
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
                  boxShadow: "0 2px 6px rgba(138, 107, 46, 0.35)",
                  zIndex: 2,
                  pointerEvents: "none",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div
              className="admin-notif-menu"
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                width: "min(340px, calc(100vw - 32px))",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8E2D4",
                borderRadius: "16px",
                boxShadow: "0 16px 40px rgba(43, 45, 42, 0.12)",
                padding: "16px",
                zIndex: 60,
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #E8E2D4",
                  paddingBottom: "10px",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
                }}
              >
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
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      backgroundColor: "#F3EFE6",
                      border: "1px solid #E8E2D4",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontFamily: "var(--font-body), 'Inter', sans-serif",
                    }}
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

        {/* User Avatar Circular Button linking to Admin Profile */}
        <Link
          href="/admin/profile"
          className="admin-avatar-btn"
          title={`${user?.name || "Super Admin"} (Admin Profile)`}
          style={{
            width: "40px",
            height: "40px",
            minWidth: "40px",
            minHeight: "40px",
            borderRadius: "50%",
            backgroundColor: "#F3EFE6",
            border: pathname === "/admin/profile" ? "2px solid #8A6B2E" : "1.5px solid #E8E2D4",
            color: "#8A6B2E",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-body), 'Inter', sans-serif",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            userSelect: "none",
            letterSpacing: "0.02em",
            textDecoration: "none",
            overflow: "hidden",
            flexShrink: 0,
            boxSizing: "border-box",
            transition: "all 0.15s ease",
          }}
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user?.name || "Admin"}
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
            />
          ) : (
            <span>{getInitials(user?.name)}</span>
          )}
        </Link>
      </div>
    </header>
  );
}
