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
  CreditCard,
  Sparkles,
} from "lucide-react";
import { useWorkflow } from "@/lib/shared/workflowStore";
import { adminService } from "@/lib/api/services/adminService";

export default function AdminTopbar({ onOpenMobile }) {
  const pathname = usePathname();
  const router = useRouter();
  const { notifications = [], markNotificationRead } = useWorkflow();
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // Export State
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportingType, setExportingType] = useState(null);
  const exportRef = useRef(null);

  // Debounced Search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await adminService.globalSearch(searchQuery.trim());
        if (res && res.data) {
          setSearchResults(res.data);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = async (type) => {
    setExportingType(type);
    try {
      const res = await adminService.exportAdminData(type);
      if (typeof window !== "undefined") {
        const blob = new Blob([typeof res === "string" ? res : JSON.stringify(res)], { type: "text/csv;charset=utf-8;" });
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
    <header
      style={{
        height: "var(--topbar-height, 72px)",
        minHeight: "72px",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid #E8E2D4",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingInline: "clamp(16px, 2.5vw, 40px)",
        position: "sticky",
        top: 0,
        zIndex: 40,
        width: "100%",
        boxSizing: "border-box",
        gap: "16px",
      }}
      className="admin-topbar-header"
    >
      {/* Left: Mobile hamburger & title, Desktop Single Title + Muted Subtitle */}
      <div className="admin-topbar-left" style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0, flex: "0 1 auto" }}>
        {/* Mobile Hamburger */}
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
            flexShrink: 0,
          }}
          className="admin-hamburger-btn"
        >
          <Menu size={20} />
        </button>

        {/* Page Title & Subtitle */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px", minWidth: 0, flex: "1 1 auto" }}>
          <h1
            className="admin-topbar-title"
            style={{
              fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
              fontSize: "clamp(16px, 1.8vw, 20px)",
              lineHeight: "26px",
              fontWeight: 600,
              color: "#2B2D2A",
              margin: 0,
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
            }}
          >
            <span className="admin-title-desktop">{getPageTitle()}</span>
            <span className="admin-title-mobile">
              {pathname?.startsWith("/admin/verification") ? "Verification" : getPageTitle()}
            </span>
          </h1>

          <span
            className="admin-desktop-subtitle"
            style={{
              fontSize: "11px",
              fontWeight: "600",
              color: "#5A584F",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            Super-Admin &bull; Vismaya
          </span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div
        ref={searchContainerRef}
        style={{
          flex: "1 1 220px",
          maxWidth: "420px",
          minWidth: "160px",
          position: "relative",
        }}
        className={`admin-global-search-container ${mobileSearchOpen ? "mobile-search-active" : ""}`}
      >
        <div
          className="admin-global-search-inner"
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#F8F6F2",
            border: "1px solid #E8E2D4",
            borderRadius: "12px",
            padding: "0 12px",
            height: "40px",
            transition: "all 0.15s ease",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {isSearching ? (
            <Loader2 size={16} className="animate-spin" style={{ color: "#8A6B2E", flexShrink: 0 }} />
          ) : (
            <Search size={16} style={{ color: "#8A6B2E", flexShrink: 0 }} />
          )}
          <input
            type="text"
            placeholder="Global search users, orgs, opportunities..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => {
              if (searchResults) setShowSearchDropdown(true);
            }}
            style={{
              border: "none",
              backgroundColor: "transparent",
              outline: "none",
              width: "100%",
              fontSize: "13px",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              color: "#2B2D2A",
              paddingLeft: "8px",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchResults(null);
                setShowSearchDropdown(false);
              }}
              style={{
                border: "none",
                background: "transparent",
                color: "#5A584F",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
              }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
          {mobileSearchOpen && (
            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen(false);
                setShowSearchDropdown(false);
              }}
              style={{
                border: "none",
                background: "transparent",
                color: "#5A584F",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                marginLeft: "6px",
              }}
              aria-label="Close search"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Global Search Results Dropdown */}
        {showSearchDropdown && searchResults && (
          <div
            style={{
              position: "absolute",
              top: "46px",
              left: 0,
              right: 0,
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E2D4",
              borderRadius: "14px",
              boxShadow: "0 12px 32px rgba(43, 45, 42, 0.12)",
              maxHeight: "380px",
              overflowY: "auto",
              padding: "12px",
              zIndex: 60,
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {/* Talent Profiles */}
            {(searchResults.talentProfiles || []).length > 0 && (
              <div>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#8A6B2E", textTransform: "uppercase", marginBottom: "6px", letterSpacing: "0.05em" }}>
                  Talent Profiles
                </div>
                {searchResults.talentProfiles.map((tp) => (
                  <Link
                    key={tp._id}
                    href={`/admin/talent-management?search=${encodeURIComponent(tp.vismayaId || tp.stageName || "")}`}
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
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <User size={14} style={{ color: "#8A6B2E" }} />
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                        {tp.stageName || `${tp.firstName || ""} ${tp.lastName || ""}`.trim() || "Talent"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Organizations */}
            {(searchResults.organizations || []).length > 0 && (
              <div>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#8A6B2E", textTransform: "uppercase", marginBottom: "6px", letterSpacing: "0.05em" }}>
                  Organizations
                </div>
                {searchResults.organizations.map((org) => (
                  <Link
                    key={org._id}
                    href={`/admin/recruiter-management?search=${encodeURIComponent(org.organizationName || "")}`}
                    onClick={() => setShowSearchDropdown(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      backgroundColor: "#FAF9F7",
                      border: "1px solid #F0EEEA",
                      textDecoration: "none",
                      marginBottom: "4px",
                    }}
                  >
                    <Building2 size={14} style={{ color: "#8A6B2E" }} />
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                      {org.organizationName}
                    </span>
                    <span style={{ fontSize: "11px", color: "#5A584F" }}>({org.organizationType || "Org"})</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Opportunities */}
            {(searchResults.opportunities || []).length > 0 && (
              <div>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#8A6B2E", textTransform: "uppercase", marginBottom: "6px", letterSpacing: "0.05em" }}>
                  Opportunities
                </div>
                {searchResults.opportunities.map((opp) => (
                  <Link
                    key={opp._id}
                    href={`/admin/opportunities?search=${encodeURIComponent(opp.title || "")}`}
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
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Briefcase size={14} style={{ color: "#8A6B2E" }} />
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                        {opp.title}
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#5A584F" }}>{opp.role}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Users */}
            {(searchResults.users || []).length > 0 && (
              <div>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#8A6B2E", textTransform: "uppercase", marginBottom: "6px", letterSpacing: "0.05em" }}>
                  Users
                </div>
                {searchResults.users.map((u) => (
                  <Link
                    key={u._id}
                    href={`/admin/${u.role === "organization" ? "recruiter-management" : "talent-management"}?search=${encodeURIComponent(u.email || u.name || "")}`}
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
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <User size={14} style={{ color: "#5A584F" }} />
                      <span style={{ fontSize: "13px", color: "#2B2D2A" }}>{u.name || u.email}</span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#8A6B2E", textTransform: "capitalize" }}>{u.role}</span>
                  </Link>
                ))}
              </div>
            )}

            {(!searchResults.talentProfiles?.length && !searchResults.organizations?.length && !searchResults.opportunities?.length && !searchResults.users?.length) && (
              <div style={{ padding: "16px", textAlign: "center", fontSize: "13px", color: "#5A584F" }}>
                No records found matching &ldquo;{searchQuery}&rdquo;.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls: Exports + System Status Chip + Bell + Avatar */}
      <div className="admin-topbar-right" style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
        {/* Export Data Control */}
        <div ref={exportRef} style={{ position: "relative" }} className="admin-export-wrapper">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            aria-label="Export CSV Reports"
            className="admin-export-btn"
            style={{
              height: "36px",
              paddingInline: "12px",
              borderRadius: "10px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E2D4",
              color: "#2B2D2A",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              fontSize: "12px",
              fontWeight: "600",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Download Operational CSV Reports"
          >
            {exportingType ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} style={{ color: "#8A6B2E" }} />}
            <span className="admin-export-btn-text">Exports</span>
          </button>

          {showExportMenu && (
            <div
              style={{
                position: "absolute",
                top: "44px",
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
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#5A584F", padding: "6px 8px", textTransform: "uppercase" }}>
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
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F3EFE6")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <FileSpreadsheet size={14} style={{ color: "#8A6B2E" }} />
                  <span>{exp.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* System Status Chip (Neutral bg #F3EFE6, charcoal text, gold-brown dot) */}
        <div
          style={{
            height: "30px",
            paddingInline: "12px",
            borderRadius: "999px",
            backgroundColor: "#F3EFE6",
            border: "1px solid #E8E2D4",
            color: "#2B2D2A",
            fontFamily: "var(--font-body), 'Inter', sans-serif",
            fontSize: "12px",
            fontWeight: "600",
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            whiteSpace: "nowrap",
          }}
          className="admin-status-chip"
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#8A6B2E",
            }}
          />
          <span>System normal</span>
        </div>

        {/* Mobile Search Trigger Button (44px on <= 767px) */}
        <button
          type="button"
          onClick={() => setMobileSearchOpen(true)}
          aria-label="Search"
          className="admin-mobile-search-btn"
          style={{
            display: "none",
          }}
        >
          <Search size={18} style={{ color: "#8A6B2E" }} />
        </button>

        {/* Notifications Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            aria-label="View system alerts"
            style={{
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
              transition: "all 0.16s ease",
            }}
            className="admin-notif-btn"
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
                width: "min(340px, calc(100vw - 32px))",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8E2D4",
                borderRadius: "16px",
                boxShadow: "0 16px 40px rgba(43, 45, 42, 0.12)",
                padding: "16px",
                zIndex: 50,
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
                      transition: "background 0.15s ease",
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

        {/* User Avatar with SA initial */}
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            backgroundColor: "#F3EFE6",
            border: "1.5px solid #E8E2D4",
            color: "#8A6B2E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-body), 'Inter', sans-serif",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            userSelect: "none",
            letterSpacing: "0.02em",
          }}
          title="Super Admin (SA)"
          className="admin-avatar-btn"
        >
          SA
        </div>
      </div>

      <style jsx>{`
        .admin-title-mobile {
          display: none;
        }
        .admin-title-desktop {
          display: inline;
        }
        .admin-mobile-search-btn {
          display: none !important;
        }

        @media (max-width: 1400px) {
          .admin-desktop-subtitle {
            display: none !important;
          }
        }

        @media (max-width: 1366px) {
          .admin-export-btn-text {
            display: none !important;
          }
          .admin-export-btn {
            padding: 0 10px !important;
            gap: 0 !important;
          }
        }

        @media (max-width: 1280px) {
          .admin-global-search-container:not(.mobile-search-active) {
            display: none !important;
          }
          .admin-mobile-search-btn {
            display: flex !important;
          }
          .admin-status-chip span:last-child {
            display: none !important;
          }
          .admin-status-chip {
            padding-inline: 0 !important;
            width: 26px !important;
            height: 26px !important;
            justify-content: center !important;
          }
        }

        @media (max-width: 1100px) {
          .admin-hamburger-btn {
            display: flex !important;
          }
        }

        @media (max-width: 767px) {
          .admin-topbar-header {
            height: 64px !important;
            min-height: 64px !important;
            padding-inline: 16px !important;
            gap: 12px !important;
            position: relative !important;
          }
          .admin-topbar-left {
            gap: 10px !important;
            flex: 1 1 auto !important;
            min-width: 0 !important;
          }
          .admin-hamburger-btn {
            width: 44px !important;
            height: 44px !important;
            min-width: 44px !important;
            min-height: 44px !important;
            border-radius: 10px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-shrink: 0 !important;
          }
          .admin-title-desktop {
            display: none !important;
          }
          .admin-title-mobile {
            display: inline !important;
            font-family: var(--font-heading), 'Playfair Display', Georgia, serif !important;
            font-size: 18px !important;
            line-height: 1.25 !important;
            font-weight: 600 !important;
            color: #2B2D2A !important;
            white-space: nowrap !important;
          }
          .admin-topbar-title {
            font-size: 18px !important;
            line-height: 1.25 !important;
            max-width: none !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          .admin-global-search-container:not(.mobile-search-active) {
            display: none !important;
          }
          .admin-global-search-container.mobile-search-active {
            display: flex !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 100% !important;
            background: #FFFFFF !important;
            z-index: 60 !important;
            padding: 0 12px !important;
            align-items: center !important;
            box-sizing: border-box !important;
          }
          .admin-global-search-container.mobile-search-active .admin-global-search-inner {
            height: 44px !important;
            width: 100% !important;
            border-radius: 10px !important;
            background: #F8F6F2 !important;
          }
          .admin-global-search-container.mobile-search-active input {
            font-size: 16px !important;
          }
          .admin-topbar-right {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            flex-shrink: 0 !important;
          }
          .admin-hamburger-btn,
          .admin-mobile-search-btn,
          .admin-notif-btn {
            display: flex !important;
            width: 44px !important;
            height: 44px !important;
            min-width: 44px !important;
            min-height: 44px !important;
            border-radius: 12px !important;
            border: 1px solid #E8E1D2 !important;
            background: #FFFFFF !important;
            color: #5E471B !important;
            align-items: center !important;
            justify-content: center !important;
            cursor: pointer !important;
            flex-shrink: 0 !important;
            transition: background 0.15s ease, border-color 0.15s ease !important;
          }
          .admin-hamburger-btn:hover,
          .admin-hamburger-btn:active,
          .admin-mobile-search-btn:hover,
          .admin-mobile-search-btn:active,
          .admin-notif-btn:hover,
          .admin-notif-btn:active {
            background: #FBF3DF !important;
          }
          .admin-hamburger-btn:focus-visible,
          .admin-mobile-search-btn:focus-visible,
          .admin-notif-btn:focus-visible {
            outline: 2px solid #8A6B2E !important;
            outline-offset: 2px !important;
          }
          .admin-hamburger-btn svg,
          .admin-mobile-search-btn svg,
          .admin-notif-btn svg {
            width: 20px !important;
            height: 20px !important;
            stroke: #5E471B !important;
            color: #5E471B !important;
          }
          .admin-avatar-btn {
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            min-height: 40px !important;
            border-radius: 50% !important;
            font-size: 13px !important;
            font-weight: 700 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-shrink: 0 !important;
          }
          .admin-status-chip,
          .admin-export-wrapper {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
