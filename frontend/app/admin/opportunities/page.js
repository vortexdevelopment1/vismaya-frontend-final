"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Megaphone,
  Building2,
  FolderKanban,
  Calendar,
  Users,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  AlertOctagon,
  XCircle,
  Sparkles,
  MapPin,
  Lock,
  Globe,
  ChevronRight,
  ChevronDown,
  X,
} from "lucide-react";
import { useWorkflow } from "@/lib/shared/workflowStore";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import Modal from "@/components/shared/Modal";
import { isRealMode } from "@/lib/api/config";
import { adminService } from "@/lib/api/services/adminService";
import { useAdmin } from "@/lib/admin/AdminContext";
import { isOpportunityPending, isOpportunityFinalized } from "@/lib/api/statusMapper";

export default function AdminOpportunitiesPage() {
  const workflow = useWorkflow();
  const adminCtx = useAdmin();
  const addToast = adminCtx?.addToast || (({ title, message }) => console.log(title, message));
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg, type = "success") => {
    setToastMessage(msg);
    addToast({ type, title: type === "success" ? "Success" : "Notice", message: msg });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const [realOpportunities, setRealOpportunities] = useState([]);
  const [realProjects, setRealProjects] = useState([]);
  const [realOrganizations, setRealOrganizations] = useState([]);
  const [realApplications, setRealApplications] = useState([]);
  const [loading, setLoading] = useState(() => isRealMode("admin"));

  const loadData = async () => {
    if (!isRealMode("admin")) return;
    try {
      const [oppsRes, projsRes, orgsRes, appsRes] = await Promise.allSettled([
        adminService.getAllOpportunities(),
        adminService.getAllProjects(),
        adminService.getOrganizationDirectory(),
        adminService.getAllApplications(),
      ]);
      if (oppsRes.status === "fulfilled" && Array.isArray(oppsRes.value?.data)) {
        setRealOpportunities(oppsRes.value.data);
      }
      if (projsRes.status === "fulfilled" && Array.isArray(projsRes.value?.data)) {
        setRealProjects(projsRes.value.data);
      }
      if (orgsRes.status === "fulfilled" && Array.isArray(orgsRes.value?.data)) {
        setRealOrganizations(orgsRes.value.data);
      }
      if (appsRes.status === "fulfilled" && Array.isArray(appsRes.value?.data)) {
        setRealApplications(appsRes.value.data);
      }
    } catch (err) {
      console.warn("Failed to load real admin opportunities:", err);
    }
  };

  useEffect(() => {
    if (!isRealMode("admin")) return;
    let mounted = true;
    loadData().finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const opportunities = isRealMode("admin") ? realOpportunities : (workflow.opportunities || []);
  const projects = isRealMode("admin") ? realProjects : (workflow.projects || []);
  const organizations = isRealMode("admin") ? realOrganizations : (workflow.organizations || []);
  const applications = isRealMode("admin") ? realApplications : (workflow.applications || []);
  const isHydrated = isRealMode("admin") ? !loading : workflow.isHydrated;

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [orgFilter, setOrgFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return new URLSearchParams(window.location.search).get("search") || "";
      } catch {
        return "";
      }
    }
    return "";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleLocationChange = () => {
        const q = new URLSearchParams(window.location.search).get("search") || "";
        if (q) setSearchQuery(q);
      };
      window.addEventListener("popstate", handleLocationChange);
      return () => window.removeEventListener("popstate", handleLocationChange);
    }
  }, []);

  // Detail Modal for view and action
  const [viewModalOpp, setViewModalOpp] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleApproveFromModal = async () => {
    if (!viewModalOpp || actionLoading) return;
    setActionLoading(true);
    try {
      if (isRealMode("admin")) {
        await adminService.approveOpportunity(viewModalOpp.id, { note: "Verified and published by Vismaya Casting Desk." });
        showToast(`Opportunity "${viewModalOpp.title}" has been approved and published.`);
        await loadData();
      } else {
        workflow.adminApproveAndPublish?.(viewModalOpp.id);
        showToast(`Opportunity "${viewModalOpp.title}" approved and published.`);
      }
      setViewModalOpp(null);
      setShowRejectForm(false);
      setRejectReason("");
    } catch (err) {
      console.error("Failed to approve opportunity:", err);
      showToast(err?.response?.data?.message || err?.message || "Failed to approve opportunity.", "danger");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectFromModal = async () => {
    if (!viewModalOpp || actionLoading) return;
    const reason = rejectReason.trim();
    if (reason.length < 10) {
      showToast("Rejection reason must be at least 10 characters.", "danger");
      return;
    }
    setActionLoading(true);
    try {
      if (isRealMode("admin")) {
        await adminService.rejectOpportunity(viewModalOpp.id, { reason, rejectionReason: reason });
        showToast(`Opportunity "${viewModalOpp.title}" has been rejected.`);
        await loadData();
      } else {
        workflow.adminReject?.(viewModalOpp.id, reason);
        showToast(`Opportunity "${viewModalOpp.title}" rejected.`);
      }
      setViewModalOpp(null);
      setShowRejectForm(false);
      setRejectReason("");
    } catch (err) {
      console.error("Failed to reject opportunity:", err);
      showToast(err?.response?.data?.message || err?.message || "Failed to reject opportunity.", "danger");
    } finally {
      setActionLoading(false);
    }
  };

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = {
      ALL: opportunities.length,
      Published: 0,
      Submitted: 0,
      Closed: 0,
      Cancelled: 0,
      Completed: 0,
      Draft: 0,
    };
    opportunities.forEach((o) => {
      const s = String(o.status || "");
      if (isOpportunityPending(s)) {
        counts.Submitted++;
      } else if (counts[s] !== undefined) {
        counts[s]++;
      } else if (s.toLowerCase() === "published" || s.toLowerCase() === "active") {
        counts.Published++;
      }
    });
    return counts;
  }, [opportunities]);

  // Filtered opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // Status
      if (statusFilter !== "ALL") {
        if (statusFilter === "Submitted") {
          if (!isOpportunityPending(opp.status)) return false;
        } else if (statusFilter === "Published") {
          const s = String(opp.status || "").toLowerCase();
          if (s !== "published" && s !== "active") return false;
        } else if (opp.status !== statusFilter) {
          return false;
        }
      }

      // Organization
      if (orgFilter !== "ALL" && opp.orgId !== orgFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const org = organizations.find((o) => o.id === opp.orgId);
        const proj = projects.find((p) => p.id === opp.projectId);

        const match =
          (opp.title || "").toLowerCase().includes(q) ||
          (org?.name || "").toLowerCase().includes(q) ||
          (proj?.title || "").toLowerCase().includes(q) ||
          (opp.opportunityType || "").toLowerCase().includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [opportunities, statusFilter, orgFilter, searchQuery, organizations, projects]);

  const getApplicantsForOpp = (oppId) => {
    return applications.filter((a) => a.opportunityId === oppId);
  };

  const getOrgForOpp = (orgId) => {
    return organizations.find((o) => o.id === orgId);
  };

  const getProjectForOpp = (projId) => {
    return projects.find((p) => p.id === projId);
  };

  const getOpportunityStatusPill = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "published" || s === "active") {
      return {
        label: "PUBLISHED LIVE",
        bg: "#E3F0E7",
        color: "#2F6B45",
        border: "rgba(47, 107, 69, 0.25)",
      };
    }
    if (isOpportunityPending(status)) {
      return {
        label: "IN REVIEW",
        bg: "#FBEBDD",
        color: "#8F3F16",
        border: "rgba(143, 63, 22, 0.25)",
      };
    }
    if (s === "closed") {
      return {
        label: "CLOSED",
        bg: "#EFEAE0",
        color: "#5C5545",
        border: "rgba(92, 85, 69, 0.25)",
      };
    }
    if (s === "cancelled") {
      return {
        label: "CANCELLED",
        bg: "#FBE9E5",
        color: "#A3321F",
        border: "rgba(163, 50, 31, 0.25)",
      };
    }
    if (s === "completed") {
      return {
        label: "COMPLETED",
        bg: "#F3ECDC",
        color: "#5E471B",
        border: "rgba(138, 107, 46, 0.25)",
      };
    }
    return {
      label: (status || "DRAFT").toUpperCase(),
      bg: "#EFEAE0",
      color: "#5C5545",
      border: "rgba(92, 85, 69, 0.25)",
    };
  };

  const mobileStatusTabs = [
    { key: "ALL", label: "All", count: statusCounts.ALL },
    { key: "Published", label: "Published live", count: statusCounts.Published },
    { key: "Submitted", label: "In review", count: statusCounts.Submitted },
    { key: "Closed", label: "Closed", count: statusCounts.Closed },
    { key: "Cancelled", label: "Cancelled", count: statusCounts.Cancelled },
    { key: "Completed", label: "Completed", count: statusCounts.Completed },
  ];

  if (!isHydrated) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ height: "48px", background: "#F3EFE6", borderRadius: "12px", width: "40%" }} />
        <div style={{ height: "400px", background: "#FFFFFF", border: "1px solid #E8E2D4", borderRadius: "16px" }} />
      </div>
    );
  }

  return (
    <div className="admin-opp-page" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ===================== DESKTOP LAYOUT (>= 768px) ===================== */}
      <div className="admin-opp-desktop-layout">
        {/* Page Header */}
      <PageHeader
        title="Opportunities Directory"
        subtitle="Platform-wide directory of casting opportunities, application metrics, auto-closing schedules, and statuses."
        badge={`${opportunities?.length ?? 0} Total Opportunities`}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Opportunities" },
        ]}
      />

      {/* Filter Tabs */}
      <div className="admin-opp-tabs-wrap" style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", width: "100%", maxWidth: "100%" }}>
        {[
          { key: "ALL", label: "All Opportunities", count: statusCounts.ALL },
          { key: "Published", label: "Published Live", count: statusCounts.Published },
          { key: "Submitted", label: "Submitted for Review", count: statusCounts.Submitted },
          { key: "Closed", label: "Closed", count: statusCounts.Closed },
          { key: "Cancelled", label: "Cancelled", count: statusCounts.Cancelled },
          { key: "Completed", label: "Completed", count: statusCounts.Completed },
        ].map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              className={`admin-opp-tab-btn ${isActive ? "active" : ""}`}
              onClick={() => setStatusFilter(tab.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                height: "40px",
                padding: "0 16px",
                borderRadius: "999px",
                fontSize: "14px",
                fontWeight: 600,
                fontFamily: "Inter, sans-serif",
                backgroundColor: isActive ? "#8A6B2E" : "#FFFFFF",
                color: isActive ? "#FFFFFF" : "#5A584F",
                border: `1px solid ${isActive ? "#8A6B2E" : "#E8E2D4"}`,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flex: "none",
                flexShrink: 0,
                transition: "all 0.15s ease",
              }}
            >
              <span>{tab.label}</span>
              <span
                className={`admin-opp-tab-badge ${isActive ? "active" : ""}`}
                style={{
                  minWidth: "22px",
                  height: "22px",
                  padding: "0 6px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isActive ? "rgba(255, 255, 255, 0.22)" : "#F3EFE6",
                  color: isActive ? "#FFFFFF" : "#2B2D2A",
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Organization Dropdown Filter Card */}
      <div
        className="admin-opp-filter-card"
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E2D4",
          borderRadius: "16px",
          padding: "16px 20px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06)",
        }}
      >
        <div
          className="admin-opp-search-wrap vismaya-search-wrap"
          style={{
            flex: "1 1 280px",
            minWidth: "200px",
            position: "relative",
            display: "flex",
            alignItems: "center",
            border: "none",
            background: "transparent",
            padding: 0,
          }}
        >
          <Search
            size={18}
            className="vismaya-search-icon"
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#8A8170",
              stroke: "#8A8170",
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
          <input
            type="text"
            className="admin-opp-search-input vismaya-search-input"
            placeholder="Search opportunity title, studio, project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              height: "44px",
              minHeight: "44px",
              paddingLeft: "42px",
              paddingRight: searchQuery ? "38px" : "14px",
              border: "1px solid #D9D1BF",
              borderRadius: "10px",
              backgroundColor: "#FFFFFF",
              color: "#2A241A",
              fontSize: "14px",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.16s ease, box-shadow 0.16s ease",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="vismaya-search-clear-btn"
              aria-label="Clear search"
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#8A8170",
                padding: "4px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                zIndex: 2,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="admin-opp-org-select-wrap" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A", whiteSpace: "nowrap" }}>Organization:</span>
          <select
            value={orgFilter}
            className="admin-opp-org-select"
            onChange={(e) => setOrgFilter(e.target.value)}
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #D9D2C0",
              borderRadius: "10px",
              height: "44px",
              padding: "0 14px",
              fontSize: "14px",
              color: "#2B2D2A",
              outline: "none",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
            }}
          >
            <option value="ALL">All Organizations</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Opportunities Data Table */}
      {filteredOpportunities.length === 0 ? (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            borderRadius: "16px",
            padding: "48px 20px",
            textAlign: "center",
            boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06)",
          }}
        >
          <Megaphone size={40} style={{ color: "#8A6B2E", marginBottom: "12px" }} />
          <h3 style={{ fontSize: "18px", fontFamily: "var(--font-playfair), serif", color: "#2B2D2A", marginBottom: "6px" }}>
            No Opportunities Found
          </h3>
          <p style={{ color: "#5A584F", fontSize: "14px", margin: 0 }}>
            No opportunities match your filter criteria.
          </p>
        </div>
      ) : (
        <>
          <div
            className="admin-opp-desktop-table"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E2D4",
              borderRadius: "16px",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06)",
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              boxSizing: "border-box",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px", minWidth: "960px", tableLayout: "auto" }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: "#F3EFE6",
                    borderBottom: "1px solid #E8E2D4",
                    color: "#5A584F",
                    fontWeight: "700",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                  }}
                >
                  <th style={{ padding: "16px 20px", whiteSpace: "nowrap", minWidth: "200px", textAlign: "left" }}>Opportunity</th>
                  <th style={{ padding: "16px 20px", whiteSpace: "nowrap", minWidth: "180px", textAlign: "left" }}>Project &amp; Studio</th>
                  <th style={{ padding: "16px 20px", whiteSpace: "nowrap", minWidth: "160px", textAlign: "left" }}>Application Deadline</th>
                  <th style={{ padding: "16px 20px", whiteSpace: "nowrap", minWidth: "110px", textAlign: "left" }}>Applicants</th>
                  <th style={{ padding: "16px 20px", whiteSpace: "nowrap", minWidth: "120px", textAlign: "left" }}>Status</th>
                  <th style={{ padding: "16px 20px", textAlign: "right", whiteSpace: "nowrap", minWidth: "100px" }}>Action</th>
                </tr>
              </thead>
                <tbody>
                  {filteredOpportunities.map((opp) => {
                    const org = getOrgForOpp(opp.orgId);
                    const proj = getProjectForOpp(opp.projectId);
                    const apps = getApplicantsForOpp(opp.id);
                    const isClosed = opp.status === "Closed";

                    return (
                      <tr
                        key={opp.id}
                        style={{
                          borderBottom: "1px solid #E8E2D4",
                          transition: "background-color 0.15s ease",
                        }}
                      >
                        {/* Opportunity Title & Type */}
                        <td style={{ padding: "18px 20px" }}>
                          <div style={{ fontWeight: 600, fontSize: "15px", color: "#2B2D2A" }}>
                            {opp.title}
                          </div>
                          <div style={{ fontSize: "13px", color: "#6E5420", fontWeight: "600", marginTop: "2px" }}>
                            {opp.opportunityType} &bull; {opp.location}
                          </div>
                        </td>

                        {/* Project & Organization */}
                        <td style={{ padding: "18px 20px" }}>
                          <div style={{ fontWeight: 600, color: "#2B2D2A" }}>
                            {proj?.title || "Project"}
                          </div>
                          <div style={{ fontSize: "13px", color: "#5A584F", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                            <Building2 size={13} />
                            <span>{org?.name || "Organization"}</span>
                          </div>
                        </td>

                        {/* Deadline & Auto-close indicator */}
                        <td style={{ padding: "18px 20px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontWeight: 600, color: "#2B2D2A", fontVariantNumeric: "tabular-nums" }}>
                              {opp.deadline}
                            </span>
                            {isClosed ? (
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  color: "#6E5420",
                                  backgroundColor: "rgba(138, 107, 46, 0.12)",
                                  border: "1px solid rgba(138, 107, 46, 0.25)",
                                  padding: "2px 8px",
                                  borderRadius: "999px",
                                  width: "fit-content",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Auto-closed
                              </span>
                            ) : (
                              <span style={{ fontSize: "12px", color: "#5A584F", whiteSpace: "nowrap" }}>
                                Auto-closes on {opp.deadline}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Applicants Count */}
                        <td style={{ padding: "18px 20px", whiteSpace: "nowrap", minWidth: "110px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 10px",
                              borderRadius: "999px",
                              backgroundColor: apps.length > 0 ? "rgba(138, 107, 46, 0.12)" : "#F3EFE6",
                              color: apps.length > 0 ? "#6E5420" : "#5A584F",
                              border: apps.length > 0 ? "1px solid rgba(138, 107, 46, 0.25)" : "1px solid #E8E2D4",
                              fontWeight: 700,
                              fontSize: "12px",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}
                          >
                            <Users size={13} style={{ flexShrink: 0 }} />
                            <span style={{ whiteSpace: "nowrap" }}>{apps.length}</span>
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: "18px 20px", whiteSpace: "nowrap", minWidth: "120px" }}>
                          <StatusBadge status={opp.status} size="sm" />
                        </td>

                        {/* Action */}
                        <td style={{ padding: "18px 20px", textAlign: "right", whiteSpace: "nowrap", minWidth: "100px" }}>
                          <button
                            type="button"
                            onClick={() => setViewModalOpp(opp)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "13px",
                              color: "#8A6B2E",
                              fontWeight: 600,
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              textDecoration: "none",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                          >
                            <Eye size={14} style={{ flexShrink: 0 }} />
                            <span style={{ whiteSpace: "nowrap" }}>Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          </div>
        </>
      )}
      </div>

      {/* ===================== MOBILE LAYOUT (<= 767px) ===================== */}
      <div className="admin-opp-mobile-layout">
        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#6B6254" }}>
            <Link href="/admin/dashboard" style={{ color: "#6B6254", textDecoration: "none" }}>
              Dashboard
            </Link>
            <span>/</span>
            <span style={{ color: "#8A6B2E", fontWeight: 600 }}>Opportunities</span>
          </div>

          {/* Title */}
          <h1
            style={{
              margin: 0,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "30px",
              lineHeight: 1.2,
              fontWeight: 600,
              color: "#2A241A",
            }}
          >
            Opportunities directory
          </h1>

          {/* Total Count Pill */}
          <div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: "26px",
                padding: "0 10px",
                borderRadius: "999px",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                lineHeight: 1,
                whiteSpace: "nowrap",
                backgroundColor: "#F3ECDC",
                color: "#5E471B",
                border: "1px solid rgba(138, 107, 46, 0.25)",
              }}
            >
              {opportunities.length} TOTAL OPPORTUNITIES
            </span>
          </div>

          {/* Description */}
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              lineHeight: 1.55,
              color: "#6B6254",
            }}
          >
            Every casting opportunity on the platform, with application counts and closing status.
          </p>
        </div>

        {/* Status Chips: horizontally scrollable row */}
        <div className="admin-opp-chip-row" role="tablist">
          {mobileStatusTabs.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  flex: "none",
                  height: "40px",
                  padding: "0 14px",
                  borderRadius: "999px",
                  fontSize: "14px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  border: isActive ? "1px solid #C9A95C" : "1px solid #E1D4B3",
                  backgroundColor: isActive ? "#FBF3DF" : "#FFFFFF",
                  color: isActive ? "#5E471B" : "#2A241A",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    minWidth: "20px",
                    height: "20px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 6px",
                    backgroundColor: isActive ? "#8A6B2E" : "#F3ECDC",
                    color: isActive ? "#FFFFFF" : "#5E471B",
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search + Organization Filter */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Search input */}
          <div style={{ position: "relative", width: "100%" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#6B6254",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Search title or studio"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                height: "48px",
                fontSize: "16px",
                borderRadius: "10px",
                border: "1px solid #D9D1BF",
                backgroundColor: "#FFFFFF",
                color: "#2A241A",
                paddingLeft: "42px",
                paddingRight: "14px",
                boxSizing: "border-box",
                outline: "none",
                fontFamily: "Inter, sans-serif",
              }}
            />
          </div>

          {/* Organization Select */}
          <div style={{ position: "relative", width: "100%" }}>
            <select
              aria-label="Organization"
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              style={{
                width: "100%",
                height: "48px",
                fontSize: "16px",
                borderRadius: "10px",
                border: "1px solid #D9D1BF",
                backgroundColor: "#FFFFFF",
                color: "#2A241A",
                paddingLeft: "14px",
                paddingRight: "40px",
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
                boxSizing: "border-box",
                outline: "none",
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
              }}
            >
              <option value="ALL">All organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              style={{
                position: "absolute",
                right: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#6B6254",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Showing counter */}
          <div style={{ fontSize: "13px", color: "#6B6254", marginTop: "-2px" }}>
            Showing {filteredOpportunities.length} of {opportunities.length} opportunities
          </div>
        </div>

        {/* Mobile Opportunity Cards */}
        {filteredOpportunities.length === 0 ? (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E1D2",
              borderRadius: "16px",
              padding: "36px 20px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04)",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "#F3ECDC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#8A6B2E",
                marginBottom: "4px",
              }}
            >
              <Megaphone size={28} />
            </div>
            <h3
              style={{
                fontSize: "20px",
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 600,
                color: "#2A241A",
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              No opportunities found
            </h3>
            <p style={{ color: "#6B6254", fontSize: "14px", margin: 0, lineHeight: 1.45, maxWidth: "280px" }}>
              No opportunities match your filter criteria. Try clearing your search or status filter.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredOpportunities.map((opp) => {
              const org = getOrgForOpp(opp.orgId);
              const proj = getProjectForOpp(opp.projectId);
              const apps = getApplicantsForOpp(opp.id);
              const isClosed = opp.status === "Closed";
              const statusPill = getOpportunityStatusPill(opp.status);

              return (
                <div
                  key={opp.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E8E1D2",
                    borderRadius: "16px",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04)",
                  }}
                >
                  {/* Top row: Category pill + Status pill */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        height: "26px",
                        padding: "0 10px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        lineHeight: 1,
                        whiteSpace: "nowrap",
                        backgroundColor: "#F3ECDC",
                        color: "#5E471B",
                        border: "1px solid rgba(138, 107, 46, 0.25)",
                        textTransform: "uppercase",
                      }}
                    >
                      {opp.opportunityType || "Casting Call"}
                    </span>

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        height: "26px",
                        padding: "0 10px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        lineHeight: 1,
                        whiteSpace: "nowrap",
                        backgroundColor: statusPill.bg,
                        color: statusPill.color,
                        border: `1px solid ${statusPill.border}`,
                      }}
                    >
                      {statusPill.label}
                    </span>
                  </div>

                  {/* Title as h2 */}
                  <h2
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: "22px",
                      lineHeight: 1.25,
                      fontWeight: 600,
                      color: "#2A241A",
                      marginTop: "14px",
                      marginBottom: 0,
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                    }}
                  >
                    {opp.title}
                  </h2>

                  {/* Location line under it */}
                  {opp.location && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "13px",
                        color: "#6B6254",
                        marginTop: "4px",
                      }}
                    >
                      <MapPin size={13} style={{ color: "#8A6B2E", flexShrink: 0 }} />
                      <span>{opp.location}</span>
                    </div>
                  )}

                  {/* 2-column grid block */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                      padding: "14px 0",
                      marginTop: "14px",
                      borderTop: "1px solid #EFE9DA",
                      borderBottom: "1px solid #EFE9DA",
                    }}
                  >
                    {/* Project */}
                    <div>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: "#6B6254",
                          marginBottom: "2px",
                        }}
                      >
                        PROJECT
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#2A241A",
                          overflowWrap: "anywhere",
                          lineHeight: 1.35,
                        }}
                      >
                        {proj?.title || "Project"}
                      </div>
                    </div>

                    {/* Studio */}
                    <div>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: "#6B6254",
                          marginBottom: "2px",
                        }}
                      >
                        STUDIO
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#2A241A",
                          overflowWrap: "anywhere",
                          lineHeight: 1.35,
                        }}
                      >
                        {org?.name || "Studio"}
                      </div>
                    </div>

                    {/* Deadline */}
                    <div>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: "#6B6254",
                          marginBottom: "2px",
                        }}
                      >
                        DEADLINE
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#2A241A",
                          overflowWrap: "anywhere",
                          lineHeight: 1.35,
                        }}
                      >
                        {opp.deadline || "TBD"}
                      </div>
                      {isClosed && (
                        <div style={{ fontSize: "12.5px", color: "#6B6254", marginTop: "2px" }}>
                          Auto-closed
                        </div>
                      )}
                    </div>

                    {/* Applicants */}
                    <div>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: "#6B6254",
                          marginBottom: "2px",
                        }}
                      >
                        APPLICANTS
                      </div>
                      <div
                        style={{
                          fontFamily: "'Playfair Display', Georgia, serif",
                          fontSize: "22px",
                          fontWeight: 600,
                          color: "#2A241A",
                          lineHeight: 1.2,
                        }}
                      >
                        {apps.length}
                      </div>
                    </div>
                  </div>

                  {/* Full-width primary gold button "View details" */}
                  <button
                    type="button"
                    onClick={() => setViewModalOpp(opp)}
                    style={{
                      marginTop: "14px",
                      width: "100%",
                      height: "44px",
                      borderRadius: "10px",
                      border: "none",
                      backgroundColor: "#8A6B2E",
                      color: "#FFFFFF",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      boxShadow: "0 2px 4px rgba(138, 107, 46, 0.2)",
                    }}
                  >
                    <span>View details</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Read-Only Details Modal */}
      {viewModalOpp && (
        <Modal
          isOpen={!!viewModalOpp}
          onClose={() => setViewModalOpp(null)}
          title={`Opportunity Details: ${viewModalOpp.title}`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div
              style={{
                backgroundColor: "#FAF9F7",
                border: "1px solid #E8E2D4",
                borderRadius: "14px",
                padding: "16px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px",
              }}
            >
              <div>
                <span style={{ fontSize: "12px", color: "#5A584F", display: "block" }}>Organization</span>
                <strong style={{ fontSize: "14px", color: "#2B2D2A" }}>
                  {getOrgForOpp(viewModalOpp.orgId)?.name || "Organization"}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "#5A584F", display: "block" }}>Project</span>
                <strong style={{ fontSize: "14px", color: "#2B2D2A" }}>
                  {getProjectForOpp(viewModalOpp.projectId)?.title || "Project"}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "#5A584F", display: "block" }}>Remuneration</span>
                <strong style={{ fontSize: "14px", color: "#2B2D2A" }}>{viewModalOpp.remuneration}</strong>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "#5A584F", display: "block" }}>Deadline</span>
                <strong style={{ fontSize: "14px", color: "#2B2D2A" }}>{viewModalOpp.deadline}</strong>
              </div>
            </div>

            <div>
              <strong style={{ fontSize: "14px", color: "#2B2D2A", display: "block", marginBottom: "6px" }}>
                Full Brief &amp; Synopsis:
              </strong>
              <p style={{ fontSize: "14px", color: "#5A584F", margin: 0, lineHeight: 1.6 }}>
                {viewModalOpp.fullBrief || viewModalOpp.summary}
              </p>
            </div>

            <div>
              <strong style={{ fontSize: "14px", color: "#2B2D2A", display: "block", marginBottom: "8px" }}>
                Roles Required:
              </strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(viewModalOpp.roles || []).map((r, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: "#FAF9F7",
                      border: "1px solid #E8E2D4",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      fontSize: "13px",
                      color: "#2B2D2A",
                    }}
                  >
                    <strong>{r.roleName}</strong> ({r.gender}, {r.ageRange}) &bull; {r.language}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#F3EFE6",
                border: "1px solid #E8E2D4",
                borderRadius: "10px",
                padding: "12px 14px",
                fontSize: "13px",
                color: "#6E5420",
              }}
            >
              Note: Organizations manage and edit their opportunity briefs directly. Admin holds publishing authorization and unpublish controls.
            </div>

            {/* Rejection Form or Action Buttons */}
            {showRejectForm ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginTop: "8px",
                  padding: "14px",
                  backgroundColor: "#FFF8F8",
                  border: "1px solid #FED7D7",
                  borderRadius: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#C53030" }}>
                    Reason for Rejection * (minimum 10 characters)
                  </label>
                  <span style={{ fontSize: "11px", color: rejectReason.trim().length >= 10 ? "#2B8A3E" : "#C53030", fontWeight: 600 }}>
                    {rejectReason.trim().length}/10 characters
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Specify why this opportunity submission cannot be published (min 10 characters)..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #E8B4B4",
                    fontSize: "13px",
                    backgroundColor: "#FFFFFF",
                    color: "#2B2D2A",
                    resize: "vertical",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectReason("");
                    }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "1px solid #E8E2D4",
                      background: "#FAF9F7",
                      color: "#5A584F",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading || rejectReason.trim().length < 10}
                    onClick={handleRejectFromModal}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#C53030",
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: actionLoading || rejectReason.trim().length < 10 ? "not-allowed" : "pointer",
                      opacity: actionLoading || rejectReason.trim().length < 10 ? 0.6 : 1,
                    }}
                  >
                    {actionLoading ? "Rejecting..." : "Confirm Rejection"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => {
                    setViewModalOpp(null);
                    setShowRejectForm(false);
                    setRejectReason("");
                  }}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "10px",
                    backgroundColor: "#FAF9F7",
                    color: "#5A584F",
                    border: "1px solid #E8E2D4",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Close View
                </button>

                {/* Show Approve and Reject buttons ONLY when in pending review state and not finalized */}
                {isOpportunityPending(viewModalOpp.status) && !isOpportunityFinalized(viewModalOpp.status) && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowRejectForm(true)}
                      style={{
                        padding: "10px 18px",
                        borderRadius: "10px",
                        backgroundColor: "#FFF5F5",
                        color: "#C53030",
                        border: "1px solid #FED7D7",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Reject Submission
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleApproveFromModal}
                      style={{
                        padding: "10px 22px",
                        borderRadius: "10px",
                        backgroundColor: "#8A6B2E",
                        color: "#FFFFFF",
                        border: "none",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: actionLoading ? "not-allowed" : "pointer",
                        opacity: actionLoading ? 0.7 : 1,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <CheckCircle2 size={15} />
                      <span>{actionLoading ? "Approving..." : "Approve & Publish"}</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* In-page Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            backgroundColor: "#2B2D2A",
            color: "#FFFFFF",
            padding: "12px 20px",
            borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            zIndex: 9999,
            fontSize: "14px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            border: "1px solid #8A6B2E",
          }}
        >
          <CheckCircle2 size={16} color="#4ADE80" />
          <span>{toastMessage}</span>
        </div>
      )}

      <style jsx>{`
        .admin-opp-page {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          overflow-x: hidden;
        }
        .admin-opp-desktop-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .admin-opp-mobile-layout {
          display: none;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .admin-opp-tabs-wrap {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 8px !important;
          align-items: center !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        .admin-opp-chip-row {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 8px !important;
          align-items: center !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .admin-opp-chip-row::-webkit-scrollbar {
          display: none;
        }

        @media (max-width: 767px) {
          .admin-opp-desktop-layout {
            display: none !important;
          }
          .admin-opp-mobile-layout {
            display: flex !important;
            flex-direction: column;
            gap: 16px;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          }
        }

        @media (max-width: 400px) {
          .admin-opp-chip-row {
            margin: 0 -12px;
            padding: 0 12px;
          }
        }
      `}</style>
    </div>
  );
}
