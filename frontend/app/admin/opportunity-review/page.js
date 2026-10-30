"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Inbox,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  MapPin,
  Building2,
  FolderKanban,
  FileText,
  ShieldCheck,
  Sparkles,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Award,
  Globe,
  Lock,
  ArrowLeft,
  Info,
  DollarSign,
  Users,
  Briefcase,
} from "lucide-react";
import { useWorkflow } from "@/lib/shared/workflowStore";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import Modal from "@/components/shared/Modal";
import { isRealMode } from "@/lib/api/config";
import { adminService } from "@/lib/api/services/adminService";
import { useAdmin } from "@/lib/admin/AdminContext";
import { isOpportunityPending, isOpportunityFinalized } from "@/lib/api/statusMapper";

export default function OpportunityReviewPage() {
  const workflow = useWorkflow();
  const adminCtx = useAdmin();
  const addToast = adminCtx?.addToast || (({ title, message }) => console.log(title, message));
  const [realOpportunities, setRealOpportunities] = useState([]);
  const [realProjects, setRealProjects] = useState([]);
  const [realOrganizations, setRealOrganizations] = useState([]);
  const [loading, setLoading] = useState(() => isRealMode("admin"));

  const loadData = async () => {
    if (!isRealMode("admin")) return;
    try {
      const [oppsRes, projsRes, orgsRes] = await Promise.allSettled([
        adminService.getAllOpportunities(),
        adminService.getAllProjects(),
        adminService.getOrganizationDirectory(),
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
    } catch (err) {
      console.warn("Failed to load real opportunity review data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const opportunities = isRealMode("admin") ? realOpportunities : (workflow.opportunities || []);
  const projects = isRealMode("admin") ? realProjects : (workflow.projects || []);
  const organizations = isRealMode("admin") ? realOrganizations : (workflow.organizations || []);
  const isHydrated = isRealMode("admin") ? !loading : workflow.isHydrated;

  const {
    adminApproveAndPublish,
    adminRequestChanges,
    adminReject,
  } = workflow;

  // Tab State: "All" is the default first tab
  const [filterTab, setFilterTab] = useState("All"); // All | Submitted | Changes Requested | Rejected
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
  const [selectedOppId, setSelectedOppId] = useState(null);
  const [previewTab, setPreviewTab] = useState("public"); // public | loggedIn
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [expandedRoles, setExpandedRoles] = useState({});

  // Action Modals State
  const [approveModalOpp, setApproveModalOpp] = useState(null);
  const [approveNote, setApproveNote] = useState("");

  const [changesModalOpp, setChangesModalOpp] = useState(null);
  const [changesNote, setChangesNote] = useState("");

  const [rejectModalOpp, setRejectModalOpp] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const listContainerRef = useRef(null);

  // Sync tab with URL search params on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) {
        const validTabs = {
          all: "All",
          submitted: "Submitted",
          "changes-requested": "Changes Requested",
          rejected: "Rejected",
        };
        if (validTabs[tabParam.toLowerCase()]) {
          setFilterTab(validTabs[tabParam.toLowerCase()]);
        }
      }
    }
  }, []);

  // Update URL search params when tab changes
  const handleTabChange = (newTab) => {
    setFilterTab(newTab);
    setSelectedOppId(null);
    setShowMobileDetail(false);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (newTab === "All") {
        params.delete("tab");
      } else {
        const tabMap = {
          Submitted: "submitted",
          "Changes Requested": "changes-requested",
          Rejected: "rejected",
        };
        params.set("tab", tabMap[newTab] || newTab.toLowerCase());
      }
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      window.history.replaceState(null, "", newUrl);
    }
  };

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      All: opportunities.length,
      Submitted: opportunities.filter((o) => isOpportunityPending(o.status)).length,
      "Changes Requested": opportunities.filter((o) => {
        const s = String(o.status || "").toLowerCase().replace(/[-_]/g, " ");
        return s === "changes requested" || s === "corrections requested";
      }).length,
      Rejected: opportunities.filter((o) => String(o.status || "").toLowerCase() === "rejected").length,
    };
  }, [opportunities]);

  // Tab definitions: "All Opportunities" is FIRST
  const tabs = [
    { key: "All", label: "All Opportunities", count: tabCounts.All },
    { key: "Submitted", label: "Awaiting Review", count: tabCounts.Submitted },
    { key: "Changes Requested", label: "Changes Requested", count: tabCounts["Changes Requested"] },
    { key: "Rejected", label: "Rejected", count: tabCounts.Rejected },
  ];

  // Filtered opportunities list
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // Status Tab filter
      if (filterTab !== "All") {
        if (filterTab === "Submitted") {
          if (!isOpportunityPending(opp.status)) return false;
        } else if (filterTab === "Changes Requested") {
          const s = String(opp.status || "").toLowerCase().replace(/[-_]/g, " ");
          if (s !== "changes requested" && s !== "corrections requested") return false;
        } else if (filterTab === "Rejected") {
          if (String(opp.status || "").toLowerCase() !== "rejected") return false;
        } else if (opp.status !== filterTab) {
          return false;
        }
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const org = organizations.find((o) => o.id === opp.orgId);
        const proj = projects.find((p) => p.id === opp.projectId);

        const match =
          (opp.title || "").toLowerCase().includes(q) ||
          (org?.name || "").toLowerCase().includes(q) ||
          (proj?.title || "").toLowerCase().includes(q) ||
          (opp.opportunityType || "").toLowerCase().includes(q) ||
          (opp.location || "").toLowerCase().includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [opportunities, filterTab, searchQuery, organizations, projects]);

  // Active Opportunity for Detail Panel (Auto-selects first item on desktop)
  const selectedOpportunity = useMemo(() => {
    if (!selectedOppId && filteredOpportunities.length > 0) {
      return filteredOpportunities[0];
    }
    const found = filteredOpportunities.find((o) => o.id === selectedOppId);
    if (found) return found;
    return filteredOpportunities[0] || null;
  }, [selectedOppId, filteredOpportunities]);

  // Auto-set selectedOppId on filtered list changes if desktop
  useEffect(() => {
    if (filteredOpportunities.length > 0 && !selectedOppId) {
      setSelectedOppId(filteredOpportunities[0].id);
    }
  }, [filteredOpportunities, selectedOppId]);

  const selectedProject = useMemo(() => {
    if (!selectedOpportunity) return null;
    const oppProj = selectedOpportunity.project;
    const targetProjId = String(selectedOpportunity.projectId || oppProj?.id || oppProj?._id || "");
    const found = projects.find(
      (p) => String(p.id || p._id) === targetProjId
    );
    if (found) {
      const count = found.opportunityCount ?? found.opportunitiesCount ?? oppProj?.opportunityCount ?? oppProj?.opportunitiesCount ?? 0;
      return {
        ...found,
        opportunityCount: count,
        opportunitiesCount: count,
      };
    }
    if (oppProj) return oppProj;
    return null;
  }, [selectedOpportunity, projects]);

  const selectedOrg = useMemo(() => {
    if (!selectedOpportunity) return null;
    const orgId = selectedOpportunity.orgId || selectedProject?.orgId || selectedProject?.organizationId;
    const found = organizations.find((o) => String(o.id || o._id) === String(orgId));
    if (found) return found;
    if (selectedOpportunity.project?.organizationName && selectedOpportunity.project.organizationName !== "Not provided") {
      return { name: selectedOpportunity.project.organizationName, type: "Organization", status: "Active" };
    }
    return null;
  }, [selectedOpportunity, selectedProject, organizations]);

  const isProjectSuspended = useMemo(() => {
    const rawSt = String(selectedProject?.rawStatus || selectedProject?.status || "").toLowerCase();
    return rawSt === "suspended";
  }, [selectedProject]);

  // Keyboard navigation through list items
  const handleKeyDown = (e, index) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (index + 1) % filteredOpportunities.length;
      setSelectedOppId(filteredOpportunities[nextIndex].id);
      const nextEl = listContainerRef.current?.children[nextIndex];
      nextEl?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = (index - 1 + filteredOpportunities.length) % filteredOpportunities.length;
      setSelectedOppId(filteredOpportunities[prevIndex].id);
      const prevEl = listContainerRef.current?.children[prevIndex];
      prevEl?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSelectedOppId(filteredOpportunities[index].id);
      setShowMobileDetail(true);
    }
  };

  // Toggle role accordion
  const toggleRole = (roleIdx) => {
    setExpandedRoles((prev) => ({
      ...prev,
      [roleIdx]: prev[roleIdx] === undefined ? false : !prev[roleIdx],
    }));
  };

  // Action Handlers
  const handleApprove = async (e) => {
    e.preventDefault();
    if (!approveModalOpp) return;
    if (isProjectSuspended) {
      addToast({
        type: "danger",
        title: "Action Blocked",
        message: "Cannot approve opportunity: The parent project is suspended.",
      });
      return;
    }
    const oppId = approveModalOpp.id;
    const note = approveNote || "Verified and published by Vismaya Casting Desk.";
    if (isRealMode("admin")) {
      try {
        await adminService.approveOpportunity(oppId, { note });
        addToast({
          type: "success",
          title: "Opportunity Approved",
          message: `"${approveModalOpp.title}" has been approved and published successfully.`,
        });
        await loadData();
      } catch (err) {
        console.error("Failed to approve opportunity:", err);
        addToast({
          type: "danger",
          title: "Approval Failed",
          message: err?.response?.data?.message || err?.message || "Failed to approve opportunity.",
        });
      }
    } else {
      adminApproveAndPublish(oppId, note);
      addToast({
        type: "success",
        title: "Opportunity Approved",
        message: `"${approveModalOpp.title}" has been approved and published.`,
      });
    }
    setApproveModalOpp(null);
    setApproveNote("");
  };

  const handleRequestChanges = async (e) => {
    e.preventDefault();
    if (!changesModalOpp || !changesNote.trim()) return;
    const oppId = changesModalOpp.id;
    const corrections = changesNote.trim();
    if (isRealMode("admin")) {
      try {
        await adminService.requestOpportunityCorrections(oppId, { corrections, correctionNotes: corrections });
        addToast({
          type: "warning",
          title: "Changes Requested",
          message: `Change request sent to organization for "${changesModalOpp.title}".`,
        });
        await loadData();
      } catch (err) {
        console.error("Failed to request changes on opportunity:", err);
        addToast({
          type: "danger",
          title: "Request Failed",
          message: err?.response?.data?.message || err?.message || "Failed to request changes.",
        });
      }
    } else {
      adminRequestChanges(oppId, corrections);
      addToast({
        type: "warning",
        title: "Changes Requested",
        message: `Change request sent to organization for "${changesModalOpp.title}".`,
      });
    }
    setChangesModalOpp(null);
    setChangesNote("");
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectModalOpp) return;
    const reason = rejectReason.trim();
    if (reason.length < 10) {
      addToast({
        type: "danger",
        title: "Validation Error",
        message: "Rejection reason must be at least 10 characters long.",
      });
      return;
    }
    const oppId = rejectModalOpp.id;
    if (isRealMode("admin")) {
      try {
        await adminService.rejectOpportunity(oppId, { reason, rejectionReason: reason });
        addToast({
          type: "success",
          title: "Opportunity Rejected",
          message: `"${rejectModalOpp.title}" has been rejected.`,
        });
        await loadData();
      } catch (err) {
        console.error("Failed to reject opportunity:", err);
        addToast({
          type: "danger",
          title: "Rejection Failed",
          message: err?.response?.data?.message || err?.message || "Failed to reject opportunity.",
        });
      }
    } else {
      adminReject(oppId, reason);
      addToast({
        type: "success",
        title: "Opportunity Rejected",
        message: `"${rejectModalOpp.title}" has been rejected.`,
      });
    }
    setRejectModalOpp(null);
    setRejectReason("");
  };

  // 7. Loading State: Skeletons
  if (!isHydrated) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div
          style={{
            height: "44px",
            background: "rgba(255, 255, 255, 0.06)",
            borderRadius: "12px",
            width: "35%",
            animation: "pulse 1.5s infinite",
          }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  height: "110px",
                  background: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "14px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  animation: "pulse 1.5s infinite",
                }}
              />
            ))}
          </div>
          <div
            style={{
              height: "560px",
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              animation: "pulse 1.5s infinite",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* 2. Header Area: Tighter Spacing */}
      <PageHeader
        title="Opportunity Review Queue"
        subtitle="Review and verify submitted casting briefs from organizations before publishing them live."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Opportunity Review" },
        ]}
        style={{ marginBottom: "8px" }}
      />

      {/* 2. Toolbar: ONE compact row with bottom border */}
      <div className="opp-review-toolbar">
        {/* Tabs: Pill style with count badges */}
        <div className="opp-review-tabs" role="tablist" aria-label="Opportunity filters">
          {tabs.map((tab) => {
            const isActive = filterTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleTabChange(tab.key)}
                className={`opp-tab-btn ${isActive ? "opp-tab-active" : ""}`}
              >
                <span>{tab.label}</span>
                <span className={`opp-tab-badge ${isActive ? "opp-tab-badge-active" : ""}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input: max-width ~320px, height 40px */}
        <div
          className="opp-review-search-wrap"
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            width: "100%",
            maxWidth: "320px",
          }}
        >
          <Search
            size={16}
            className="opp-review-search-icon"
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#7e89a3",
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
          <input
            type="text"
            placeholder="Search title, studio, project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`opp-review-search-input ${searchQuery ? "has-value" : ""}`}
            style={{
              width: "100%",
              height: "40px",
              minHeight: "40px",
              paddingLeft: "42px",
              paddingRight: searchQuery ? "36px" : "14px",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              backgroundColor: "rgba(255, 255, 255, 0.055)",
              borderRadius: "12px",
              color: "#eceaf5",
              fontSize: "0.825rem",
              fontFamily: "inherit",
              outline: "none",
              boxSizing: "border-box",
            }}
            aria-label="Search opportunities"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="opp-search-clear-btn"
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#7e89a3",
                padding: "4px",
                borderRadius: "50%",
                zIndex: 2,
              }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 1 & 7. Empty State: When a filter or search has 0 items */}
      {filteredOpportunities.length === 0 ? (
        <div className="opp-empty-state-card card-surface">
          <div className="opp-empty-icon-wrap">
            <Inbox size={36} style={{ color: "var(--gold)" }} />
          </div>
          <h3 style={{ fontSize: "1.1rem", color: "#eceaf5", fontWeight: 700, margin: "0 0 6px 0" }}>
            No opportunities here
          </h3>
          <p style={{ color: "#a3acc2", fontSize: "0.85rem", margin: 0, maxWidth: "420px" }}>
            {searchQuery.trim()
              ? `No opportunities found matching "${searchQuery}". Try adjusting your search query.`
              : filterTab === "Submitted"
              ? "All submitted opportunities have been verified and moderated."
              : `No opportunities found in the "${filterTab}" category.`}
          </p>
        </div>
      ) : (
        /* 2 & 6. Master-Detail Two-Column Grid */
        <div className={`opp-review-layout ${showMobileDetail ? "mobile-detail-open" : ""}`}>
          {/* Left Column: Opportunity List (Sticky) */}
          <div
            ref={listContainerRef}
            className="opp-review-list-col"
            role="list"
            aria-label="Opportunity list"
          >
            {filteredOpportunities.map((opp, idx) => {
              const isSelected = selectedOpportunity?.id === opp.id;
              const org = organizations.find((o) => o.id === opp.orgId);
              const proj = projects.find((p) => p.id === opp.projectId);

              return (
                <div
                  key={opp.id}
                  role="button"
                  tabIndex={0}
                  aria-selected={isSelected}
                  onClick={() => {
                    setSelectedOppId(opp.id);
                    setShowMobileDetail(true);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className={`opp-list-item card-surface ${isSelected ? "opp-list-item-selected" : ""}`}
                >
                  {/* Line 1: Category Chip + Status Chip */}
                  <div className="opp-item-line1">
                    <span className="opp-category-chip">
                      {opp.opportunityType}
                    </span>
                    <StatusBadge status={opp.status} size="xs" />
                    {(opp.resubmissionCount > 0 || (opp.rejectionHistory && opp.rejectionHistory.length > 0)) && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          backgroundColor: "rgba(180, 35, 24, 0.12)",
                          color: "#B42318",
                          border: "1px solid rgba(180, 35, 24, 0.28)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Resubmitted
                      </span>
                    )}
                  </div>

                  {/* Line 2: Opportunity Title (Clamped to 2 lines) */}
                  <h3
                    title={opp.title}
                    className="opp-item-title"
                  >
                    {opp.title}
                  </h3>

                  {/* Line 3: Organization Name */}
                  <div className="opp-item-org" title={org?.name || "Organization"}>
                    <Building2 size={13} style={{ color: "#7c869e", flexShrink: 0 }} />
                    <span className="opp-truncate-text">{org?.name || "Organization"}</span>
                  </div>

                  {/* Line 4: Project Name & Closes Date */}
                  <div className="opp-item-meta">
                    <div className="opp-item-proj" title={proj?.title || "Project"}>
                      <FolderKanban size={12} style={{ color: "#7c869e", flexShrink: 0 }} />
                      <span className="opp-truncate-text">{proj?.title || "Project"}</span>
                    </div>
                    <span className="opp-item-closes">
                      Closes: {opp.deadline}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Opportunity Detail Panel */}
          {selectedOpportunity && (
            <div className="opp-review-detail-col card-surface">
              {/* Mobile Back Button */}
              <div className="mobile-back-bar">
                <button
                  type="button"
                  onClick={() => setShowMobileDetail(false)}
                  className="mobile-back-btn"
                  aria-label="Back to opportunities list"
                >
                  <ArrowLeft size={16} />
                  <span>Back to opportunities list</span>
                </button>
              </div>

              {/* 4A. Sticky Detail Header */}
              <div className="opp-detail-sticky-header">
                <div className="opp-header-info">
                  {/* Category & Status */}
                  <div className="opp-header-chips">
                    <span className="opp-category-chip">
                      {selectedOpportunity.opportunityType}
                    </span>
                    <StatusBadge status={selectedOpportunity.status} size="xs" />
                    {(selectedOpportunity.resubmissionCount > 0 || (selectedOpportunity.rejectionHistory && selectedOpportunity.rejectionHistory.length > 0)) && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          backgroundColor: "rgba(180, 35, 24, 0.12)",
                          color: "#B42318",
                          border: "1px solid rgba(180, 35, 24, 0.28)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Resubmitted
                      </span>
                    )}
                  </div>

                  {/* Title (rendered once only) */}
                  <h2 className="opp-header-title">
                    {selectedOpportunity.title}
                  </h2>

                  {/* Subline: Organization • Project */}
                  <div className="opp-header-subline">
                    <span>{selectedOrg?.name || "Organization"}</span>
                    <span className="subline-dot">&bull;</span>
                    <span>{selectedProject?.title || "Project"}</span>
                  </div>
                </div>

                {/* Header Action Buttons (Only shown when pending review and not finalized) */}
                {isOpportunityPending(selectedOpportunity?.status) && !isOpportunityFinalized(selectedOpportunity?.status) && (
                  <div className="opp-header-actions">
                    <button
                      type="button"
                      disabled={isProjectSuspended}
                      onClick={() => {
                        if (isProjectSuspended) return;
                        setApproveModalOpp(selectedOpportunity);
                        setApproveNote("");
                      }}
                      className={`btn-primary opp-action-btn ${isProjectSuspended ? "opp-btn-disabled" : ""}`}
                      title={isProjectSuspended ? "Cannot approve: Parent project is suspended" : "Approve & Publish"}
                      style={isProjectSuspended ? { opacity: 0.45, cursor: "not-allowed" } : {}}
                    >
                      <CheckCircle2 size={15} />
                      <span>Approve &amp; Publish</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setChangesModalOpp(selectedOpportunity);
                        setChangesNote("");
                      }}
                      className="btn-secondary opp-action-btn opp-btn-changes"
                    >
                      <AlertTriangle size={15} style={{ color: "#fbbf24" }} />
                      <span>Request Changes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRejectModalOpp(selectedOpportunity);
                        setRejectReason("");
                      }}
                      className="opp-action-btn opp-btn-reject"
                    >
                      <XCircle size={15} />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Detail Content Body */}
              <div className="opp-detail-content-body">
                {/* Resubmission & Previous Rejection History Section */}
                {Boolean(selectedOpportunity.resubmissionCount > 0 || (selectedOpportunity.rejectionHistory && selectedOpportunity.rejectionHistory.length > 0)) && (
                  <div
                    style={{
                      borderRadius: "12px",
                      backgroundColor: "rgba(180, 35, 24, 0.04)",
                      border: "1px solid rgba(180, 35, 24, 0.22)",
                      padding: "16px 18px",
                      marginBottom: "16px",
                    }}
                    className="opp-rejection-history-card"
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <AlertTriangle size={18} style={{ color: "#B42318" }} />
                        <strong style={{ fontSize: "14.5px", color: "#B42318" }}>
                          Resubmitted Opportunity ({selectedOpportunity.resubmissionCount || selectedOpportunity.rejectionHistory?.length} revision{(selectedOpportunity.resubmissionCount || selectedOpportunity.rejectionHistory?.length) > 1 ? "s" : ""})
                        </strong>
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "6px",
                          backgroundColor: "#B42318",
                          color: "#FFFFFF",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Resubmitted
                      </span>
                    </div>

                    <details open style={{ cursor: "pointer" }}>
                      <summary style={{ fontSize: "13px", fontWeight: 600, color: "#5A584F", marginBottom: "10px" }}>
                        Previous Rejection Reason(s) &amp; Admin Notes
                      </summary>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                        {Array.isArray(selectedOpportunity.rejectionHistory) && selectedOpportunity.rejectionHistory.length > 0 ? (
                          selectedOpportunity.rejectionHistory.map((h, i) => (
                            <div
                              key={i}
                              style={{
                                padding: "10px 14px",
                                borderRadius: "8px",
                                backgroundColor: "#FFFFFF",
                                border: "1px solid rgba(180, 35, 24, 0.18)",
                                fontSize: "13px",
                                lineHeight: "1.45",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", color: "#7c869e", fontSize: "11.5px", marginBottom: "4px" }}>
                                <span>Rejection #{i + 1}</span>
                                <span>{h.rejectedAt ? new Date(h.rejectedAt).toLocaleDateString() : "Previous Cycle"}</span>
                              </div>
                              <div style={{ color: "#2B2D2A", fontWeight: 500 }}>{h.reason}</div>
                            </div>
                          ))
                        ) : (
                          <div
                            style={{
                              padding: "10px 14px",
                              borderRadius: "8px",
                              backgroundColor: "#FFFFFF",
                              border: "1px solid rgba(180, 35, 24, 0.18)",
                              fontSize: "13px",
                              lineHeight: "1.45",
                            }}
                          >
                            <div style={{ color: "#2B2D2A", fontWeight: 500 }}>
                              {selectedOpportunity.rejectionReason || "Opportunity was previously rejected."}
                            </div>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                )}
                {/* Suspended Parent Project Warning Banner */}
                {isProjectSuspended && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      padding: "14px 16px",
                      borderRadius: "10px",
                      backgroundColor: "rgba(180, 35, 24, 0.08)",
                      border: "1px solid rgba(180, 35, 24, 0.28)",
                      color: "#B42318",
                      marginBottom: "16px",
                    }}
                  >
                    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: "2px", color: "#B42318" }} />
                    <div style={{ fontSize: "13px", lineHeight: "1.5" }}>
                      <strong style={{ display: "block", fontSize: "14px", fontWeight: "700", marginBottom: "2px" }}>
                        Parent Project is Suspended
                      </strong>
                      Approval is blocked because the parent project &ldquo;{selectedProject?.title || selectedProject?.projectName || "Unknown"}&rdquo; is currently suspended. This opportunity cannot be approved or published until the project suspension is lifted.
                    </div>
                  </div>
                )}

                {/* Parent Project Context Card */}
                <div className="opp-section-block">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FolderKanban size={16} style={{ color: "#8A6B2E" }} />
                      <h3 className="opp-section-heading" style={{ margin: 0 }}>Parent Project Context</h3>
                    </div>
                    <Link
                      href="/admin/projects"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        color: "#8A6B2E",
                        textDecoration: "none",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        backgroundColor: "#F3EFE6",
                        border: "1px solid #E8E2D4",
                        transition: "all 0.18s ease",
                      }}
                    >
                      <span>View in Projects Directory</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", padding: "14px 16px", borderRadius: "10px", backgroundColor: "#FAF8F5", border: "1px solid #E8E2D4", marginBottom: "12px" }}>
                    <div>
                      <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em", color: "#7c869e", display: "block", marginBottom: "3px" }}>Project Name</span>
                      <strong style={{ fontSize: "14px", color: "#2B2D2A", display: "block" }}>
                        {selectedProject?.title || selectedProject?.projectName || selectedOpportunity.projectName || "Not provided"}
                      </strong>
                    </div>

                    <div>
                      <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em", color: "#7c869e", display: "block", marginBottom: "3px" }}>Organization</span>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A", display: "block" }}>
                        {selectedOrg?.name || selectedProject?.organizationName || "Not provided"}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em", color: "#7c869e", display: "block", marginBottom: "3px" }}>Project Status</span>
                      <div>
                        <StatusBadge status={selectedProject?.status || "Active"} size="xs" />
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em", color: "#7c869e", display: "block", marginBottom: "3px" }}>Project Opportunities</span>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A", display: "block" }}>
                        {(() => {
                          const count = selectedProject?.opportunityCount ?? selectedProject?.opportunitiesCount ?? selectedOpportunity?.project?.opportunityCount ?? selectedOpportunity?.project?.opportunitiesCount ?? opportunities.filter(o => {
                            const oppProjId = o.projectId?._id || o.projectId?.id || o.projectId;
                            return String(oppProjId) === String(selectedProject?.id || selectedProject?._id);
                          }).length;
                          return `${count} ${count === 1 ? "Opportunity" : "Opportunities"}`;
                        })()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em", color: "#7c869e", display: "block", marginBottom: "4px" }}>Project Description</span>
                    <p style={{ fontSize: "13px", color: "#5A584F", margin: 0, lineHeight: 1.5 }}>
                      {selectedProject?.description && selectedProject.description !== "Not provided" ? selectedProject.description : "No description provided for this project."}
                    </p>
                  </div>
                </div>

                {/* 4B. Key Facts: ONE clean 3-col grid inside ONE section surface */}
                <div className="opp-section-block opp-divider-top">
                  <div className="opp-key-facts-grid">
                    {/* 1. Organization */}
                    <div className="opp-fact-cell">
                      <span className="opp-fact-label">Organization</span>
                      <strong className="opp-fact-val">{selectedOrg?.name || selectedProject?.organizationName || "Not provided"}</strong>
                      <span className="opp-fact-sub">
                        {selectedOrg?.type || "Production House"} &bull; {selectedOrg?.status || "Verified"}
                      </span>
                    </div>

                    {/* 2. Project Link */}
                    <div className="opp-fact-cell">
                      <span className="opp-fact-label">Project</span>
                      <strong className="opp-fact-val">{selectedProject?.title || selectedProject?.projectName || selectedOpportunity.projectName || "Not provided"}</strong>
                      <span className="opp-fact-sub">
                        {selectedProject?.type || selectedProject?.projectType || "Not provided"}
                      </span>
                    </div>

                    {/* 3. Location */}
                    <div className="opp-fact-cell">
                      <span className="opp-fact-label">Location</span>
                      <strong className="opp-fact-val">{selectedOpportunity.location || "Not provided"}</strong>
                      <span className="opp-fact-sub">On-location / Studio</span>
                    </div>

                    {/* 4. Remuneration */}
                    <div className="opp-fact-cell">
                      <span className="opp-fact-label">Remuneration</span>
                      <strong className="opp-fact-val" style={{ color: "var(--gold)" }}>
                        {selectedOpportunity.remuneration || "Not provided"}
                      </strong>
                      <span className="opp-fact-sub">Direct Production Payout</span>
                    </div>

                    {/* 5. Application Deadline */}
                    <div className="opp-fact-cell">
                      <span className="opp-fact-label">Application Deadline</span>
                      <strong className="opp-fact-val">{selectedOpportunity.deadline || "Not provided"}</strong>
                      <span className="opp-fact-sub">Auto-closing at 23:59 IST</span>
                    </div>

                    {/* 6. Roles Available */}
                    <div className="opp-fact-cell">
                      <span className="opp-fact-label">Roles Count</span>
                      <strong className="opp-fact-val">
                        {(selectedOpportunity.roles || []).length} Available{" "}
                        {(selectedOpportunity.roles || []).length === 1 ? "Role" : "Roles"}
                      </strong>
                      <span className="opp-fact-sub">
                        {selectedOpportunity.positionsCount || (selectedOpportunity.roles || []).length || 1} total {(selectedOpportunity.positionsCount || (selectedOpportunity.roles || []).length) === 1 ? "opening" : "openings"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4C. Description: Brief summary */}
                <div className="opp-section-block opp-divider-top">
                  <h3 className="opp-section-heading">Brief summary</h3>
                  <p className="opp-description-text">
                    {selectedOpportunity.summary || selectedOpportunity.fullBrief || "No brief summary provided."}
                  </p>
                </div>

                {/* 4D. Visibility Preview: Segmented Control + Single Preview Area */}
                <div className="opp-section-block opp-divider-top">
                  <div className="opp-preview-header-row">
                    <h3 className="opp-section-heading" style={{ margin: 0 }}>
                      Visibility Preview
                    </h3>

                    {/* Segmented Control */}
                    <div className="opp-segmented-control" role="tablist" aria-label="Visibility preview mode">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={previewTab === "public"}
                        onClick={() => setPreviewTab("public")}
                        className={`opp-segment-btn ${previewTab === "public" ? "opp-segment-active" : ""}`}
                      >
                        <Globe size={13} />
                        <span>Public View (Guest)</span>
                      </button>

                      <button
                        type="button"
                        role="tab"
                        aria-selected={previewTab === "loggedIn"}
                        onClick={() => setPreviewTab("loggedIn")}
                        className={`opp-segment-btn ${previewTab === "loggedIn" ? "opp-segment-active" : ""}`}
                      >
                        <Lock size={13} />
                        <span>Logged-in View (Full Brief)</span>
                      </button>
                    </div>
                  </div>

                  {/* Preview Area (No card-inside-card) */}
                  <div className="opp-preview-container">
                    {previewTab === "public" ? (
                      <>
                        <div className="opp-public-notice">
                          <Info size={15} style={{ color: "#fbbf24", flexShrink: 0, marginTop: "1px" }} />
                          <span>
                            Guests and unverified visitors see the summary above. Detailed scene briefs and script attachments are hidden until talent logs in.
                          </span>
                        </div>

                        <div className="opp-preview-public-details">
                          <p style={{ fontSize: "0.85rem", color: "#a3acc2", margin: 0, lineHeight: 1.55 }}>
                            {selectedOpportunity.summary || selectedOpportunity.fullBrief || "Not provided"}
                          </p>
                          <div className="opp-preview-tags">
                            <span className="opp-preview-tag">
                              <MapPin size={12} style={{ color: "var(--gold)" }} />
                              <span>{selectedOpportunity.location || "Not provided"}</span>
                            </span>
                            <span className="opp-preview-tag">
                              <DollarSign size={12} style={{ color: "var(--gold)" }} />
                              <span>{selectedOpportunity.remuneration || "Not provided"}</span>
                            </span>
                            <span className="opp-preview-tag">
                              <Calendar size={12} style={{ color: "var(--gold)" }} />
                              <span>Closes: {selectedOpportunity.deadline || "Not provided"}</span>
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="opp-loggedin-brief-box">
                        <div className="opp-loggedin-label">
                          <Lock size={14} style={{ color: "var(--gold)" }} />
                          <span>Verified Talent Full Brief &amp; Script Directives</span>
                        </div>
                        <p className="opp-loggedin-text">
                          {selectedOpportunity.fullBrief ||
                            selectedOpportunity.summary ||
                            "Not provided"}
                        </p>
                        {selectedOpportunity.eligibility && (
                          <div className="opp-eligibility-strip">
                            <span style={{ color: "#7c869e", fontWeight: 600 }}>Eligibility Match: </span>
                            <span>
                              Age {selectedOpportunity.eligibility.ageMin ? `${selectedOpportunity.eligibility.ageMin}–${selectedOpportunity.eligibility.ageMax || ""}` : "Not provided"} &bull;{" "}
                              {selectedOpportunity.eligibility.languages?.length > 0 ? selectedOpportunity.eligibility.languages.join(", ") : "Not provided"} &bull;{" "}
                              {selectedOpportunity.eligibility.workingCities?.join(", ") || selectedOpportunity.location || "Not provided"}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 4E. Casting Roles & Requirements (N) */}
                <div className="opp-section-block opp-divider-top">
                  <div className="opp-roles-header-row">
                    <h3 className="opp-section-heading" style={{ margin: 0 }}>
                      Casting Roles &amp; Requirements ({(selectedOpportunity.roles || []).length})
                    </h3>
                    {(selectedOpportunity.roles || []).length > 3 && (
                      <span style={{ fontSize: "0.75rem", color: "#7c869e" }}>
                        Click role to expand/collapse
                      </span>
                    )}
                  </div>

                  <div className="opp-roles-stack">
                    {(selectedOpportunity.roles || []).map((role, idx) => {
                      const isMulti = (selectedOpportunity.roles || []).length > 3;
                      const isOpen = isMulti ? (expandedRoles[idx] !== undefined ? expandedRoles[idx] : idx === 0) : true;
                      const countVal = Number(role.count || role.positionsCount) || 1;

                      return (
                        <div
                          key={role.id || idx}
                          className="opp-role-card"
                          onClick={() => isMulti && toggleRole(idx)}
                          style={{ cursor: isMulti ? "pointer" : "default" }}
                        >
                          {/* Top row: Role name + openings chip */}
                          <div className="opp-role-top-row">
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <strong className="opp-role-name">
                                {role.roleName || "Not provided"}
                              </strong>
                              {isMulti && (
                                <span style={{ color: "#7c869e" }}>
                                  {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                </span>
                              )}
                            </div>
                            <span className="opp-openings-chip">
                              {countVal} {countVal === 1 ? "opening" : "openings"}
                            </span>
                          </div>

                          {/* Accordion Body */}
                          {isOpen && (
                            <div className="opp-role-body">
                              {/* Meta chips */}
                              <div className="opp-role-chips-row">
                                <span className="opp-role-meta-chip">
                                  Age: <strong>{role.ageRange || "Not provided"}</strong>
                                </span>
                                <span className="opp-role-meta-chip">
                                  Gender: <strong>{role.gender || "Not provided"}</strong>
                                </span>
                                <span className="opp-role-meta-chip">
                                  Languages: <strong>{role.language || "Not provided"}</strong>
                                </span>
                                <span className="opp-role-meta-chip">
                                  Skills: <strong>{Array.isArray(role.skills) && role.skills.length > 0 ? role.skills.join(", ") : "Not provided"}</strong>
                                </span>
                              </div>

                              {/* Description */}
                              <p className="opp-role-desc" style={{ marginTop: "10px" }}>
                                {role.description && role.description !== "Not provided" ? role.description : "No specific role description provided."}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Mobile Fixed Action Bar (when pending review and not finalized) */}
              {isOpportunityPending(selectedOpportunity?.status) && !isOpportunityFinalized(selectedOpportunity?.status) && (
                <div className="mobile-fixed-action-bar">
                  <button
                    type="button"
                    disabled={isProjectSuspended}
                    onClick={() => {
                      if (isProjectSuspended) return;
                      setApproveModalOpp(selectedOpportunity);
                      setApproveNote("");
                    }}
                    className="btn-primary"
                    style={{
                      flex: 1,
                      minHeight: "42px",
                      justifyContent: "center",
                      opacity: isProjectSuspended ? 0.45 : 1,
                      cursor: isProjectSuspended ? "not-allowed" : "pointer",
                    }}
                    title={isProjectSuspended ? "Cannot approve: Parent project is suspended" : "Approve & Publish"}
                  >
                    <CheckCircle2 size={16} />
                    <span>Approve &amp; Publish</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChangesModalOpp(selectedOpportunity);
                      setChangesNote("");
                    }}
                    className="btn-secondary"
                    style={{ color: "#fbbf24", borderColor: "rgba(251, 191, 36, 0.4)", minHeight: "42px" }}
                  >
                    <AlertTriangle size={15} />
                    <span>Changes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectModalOpp(selectedOpportunity);
                      setRejectReason("");
                    }}
                    className="btn-secondary"
                    style={{ color: "#ff6b6b", borderColor: "rgba(255, 107, 107, 0.4)", minHeight: "42px" }}
                  >
                    <XCircle size={15} />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. MODALS */}

      {/* Modal 1: Approve & Publish */}
      {approveModalOpp && (
        <Modal
          isOpen={!!approveModalOpp}
          onClose={() => setApproveModalOpp(null)}
          title="Approve & Publish Opportunity"
        >
          <form onSubmit={handleApprove} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "0.875rem", color: "#a3acc2", margin: 0, lineHeight: 1.5 }}>
              Approving <strong style={{ color: "#eceaf5" }}>'{approveModalOpp.title}'</strong> will publish the opportunity live on the platform. Verified talent matching the role criteria will receive notifications to apply.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.825rem", fontWeight: "600", color: "#eceaf5" }}>
                Approval Note (Optional)
              </label>
              <textarea
                rows={3}
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                placeholder="Verified and approved by Vismaya Casting Desk."
                className="opp-modal-textarea"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setApproveModalOpp(null)}
                className="btn-secondary"
                style={{ borderRadius: "10px", padding: "8px 16px" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ borderRadius: "10px", padding: "8px 18px" }}
              >
                Confirm &amp; Publish Live
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 2: Request Changes */}
      {changesModalOpp && (
        <Modal
          isOpen={!!changesModalOpp}
          onClose={() => setChangesModalOpp(null)}
          title="Request Changes from Organization"
        >
          <form onSubmit={handleRequestChanges} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "0.875rem", color: "#a3acc2", margin: 0, lineHeight: 1.5 }}>
              Specify the revisions needed for <strong style={{ color: "#eceaf5" }}>'{changesModalOpp.title}'</strong>. The organization will be notified and can update their submission.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "0.825rem", fontWeight: "600", color: "#eceaf5" }}>
                  Specific Changes Required *
                </label>
                <span style={{ fontSize: "0.725rem", color: "#7c869e" }}>
                  {changesNote.length} characters
                </span>
              </div>
              <textarea
                rows={4}
                required
                value={changesNote}
                onChange={(e) => setChangesNote(e.target.value)}
                placeholder="E.g. Please clarify daily remuneration rate and specify audition monologue scene guidelines..."
                className="opp-modal-textarea"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setChangesModalOpp(null)}
                className="btn-secondary"
                style={{ borderRadius: "10px", padding: "8px 16px" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!changesNote.trim()}
                style={{
                  backgroundColor: "#fbbf24",
                  color: "#1a1300",
                  border: "none",
                  borderRadius: "10px",
                  padding: "8px 18px",
                  fontSize: "0.825rem",
                  fontWeight: "700",
                  cursor: changesNote.trim() ? "pointer" : "not-allowed",
                  opacity: changesNote.trim() ? 1 : 0.6,
                  transition: "all 0.15s ease",
                }}
              >
                Send Changes Request
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 3: Reject Confirmation */}
      {rejectModalOpp && (
        <Modal
          isOpen={!!rejectModalOpp}
          onClose={() => setRejectModalOpp(null)}
          title="Reject Opportunity Submission"
        >
          <form onSubmit={handleReject} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "0.875rem", color: "#a3acc2", margin: 0, lineHeight: 1.5 }}>
              Are you sure you want to reject <strong style={{ color: "#eceaf5" }}>'{rejectModalOpp.title}'</strong>? The organization will be notified with the reason provided.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "0.825rem", fontWeight: "600", color: "#eceaf5" }}>
                  Reason for Rejection * (min 10 characters)
                </label>
                <span style={{ fontSize: "0.725rem", color: rejectReason.trim().length >= 10 ? "#4ade80" : "#f87171" }}>
                  {rejectReason.trim().length}/10 characters
                </span>
              </div>
              <textarea
                rows={3}
                required
                minLength={10}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="E.g. Brief violates platform compliance policies or missing mandatory parameters..."
                className="opp-modal-textarea"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setRejectModalOpp(null)}
                className="btn-secondary"
                style={{ borderRadius: "10px", padding: "8px 16px" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={rejectReason.trim().length < 10}
                style={{
                  backgroundColor: "#ff6b6b",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "8px 18px",
                  fontSize: "0.825rem",
                  fontWeight: "700",
                  cursor: rejectReason.trim().length >= 10 ? "pointer" : "not-allowed",
                  opacity: rejectReason.trim().length >= 10 ? 1 : 0.6,
                  transition: "all 0.15s ease",
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Embedded Responsive & Layout Styles */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }

        /* Toolbar */
        .opp-review-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding-bottom: 16px;
          border-bottom: 1px solid #E8E2D4;
          width: 100%;
        }

        .opp-review-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          flex-shrink: 0;
        }
        .opp-review-tabs::-webkit-scrollbar {
          display: none;
        }

        .opp-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 16px;
          height: 40px;
          min-height: 40px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 600;
          font-family: var(--font-body), 'Inter', sans-serif;
          color: #5A584F;
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.16s ease;
          flex-shrink: 0;
          box-sizing: border-box;
        }
        .opp-tab-btn:hover:not(.opp-tab-active) {
          background-color: #F3EFE6;
          color: #2B2D2A;
          border-color: #8A6B2E;
        }
        .opp-tab-active {
          background-color: #8A6B2E !important;
          color: #FFFFFF !important;
          border-color: #8A6B2E !important;
          box-shadow: 0 2px 8px rgba(138, 107, 46, 0.22);
        }

        .opp-tab-badge {
          height: 22px;
          min-width: 22px;
          padding: 0 6px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          background-color: #F3EFE6;
          color: #2B2D2A;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .opp-tab-badge-active {
          background-color: rgba(255, 255, 255, 0.22) !important;
          color: #FFFFFF !important;
        }

        /* Search input wrapper & input */
        .opp-review-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          max-width: 320px;
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          box-sizing: border-box;
        }

        .opp-review-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #5A584F;
          pointer-events: none;
          z-index: 2;
        }

        .opp-review-search-input {
          width: 100%;
          height: 44px;
          min-height: 44px;
          padding-left: 42px !important;
          padding-right: 14px !important;
          border: 1px solid #D9D2C0;
          background-color: #FFFFFF;
          border-radius: 10px;
          color: #2B2D2A;
          font-size: 14px;
          font-family: var(--font-body), 'Inter', sans-serif;
          outline: none;
          appearance: none;
          -webkit-appearance: none;
          box-sizing: border-box;
          transition: border-color 0.16s ease, box-shadow 0.16s ease;
          box-shadow: none;
        }
        .opp-review-search-input.has-value {
          padding-right: 36px !important;
        }
        .opp-review-search-input:focus {
          border-color: #8A6B2E !important;
          box-shadow: 0 0 0 3px rgba(138, 107, 46, 0.18) !important;
        }
        .opp-review-search-input::placeholder {
          color: #6B6A63;
          font-size: 14px;
          opacity: 1;
        }

        .opp-search-clear-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #5A584F;
          padding: 4px;
          border-radius: 50%;
          z-index: 2;
          transition: color 0.15s ease, background-color 0.15s ease;
        }
        .opp-search-clear-btn:hover {
          color: #2B2D2A;
          background-color: #F3EFE6;
        }

        /* Empty State */
        .opp-empty-state-card {
          border-radius: 18px;
          padding: 56px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          box-shadow: 0 2px 4px rgba(43, 45, 42, 0.04);
        }
        .opp-empty-icon-wrap {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          background-color: #F3EFE6;
          border: 1px solid #E8E2D4;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        /* Master-Detail Layout */
        .opp-review-layout {
          display: grid;
          grid-template-columns: 360px minmax(0, 1fr);
          gap: 20px;
          align-items: start;
          width: 100%;
        }

        /* Left List Column (Sticky) */
        .opp-review-list-col {
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: sticky;
          top: 20px;
          max-height: calc(100vh - 150px);
          overflow-y: auto;
          padding-right: 4px;
          scrollbar-width: thin;
        }
        .opp-review-list-col::-webkit-scrollbar {
          width: 4px;
        }
        .opp-review-list-col::-webkit-scrollbar-thumb {
          background: #E8E2D4;
          border-radius: 999px;
        }

        /* Left List Item */
        .opp-list-item {
          border-radius: 14px;
          padding: 16px;
          cursor: pointer;
          transition: background-color 0.16s ease, border-color 0.16s ease, transform 0.1s ease;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border: 1px solid #E8E2D4;
          border-left: 3px solid transparent;
          background-color: #FFFFFF;
          outline: none;
          box-shadow: 0 1px 3px rgba(43, 45, 42, 0.03);
        }
        .opp-list-item:hover:not(.opp-list-item-selected) {
          background-color: #FAF9F7;
          border-color: #E8E2D4;
        }
        .opp-list-item-selected {
          border-left: 3px solid #8A6B2E !important;
          background-color: #FAF9F7 !important;
          border-color: #8A6B2E !important;
        }
        .opp-list-item:focus-visible {
          outline: 2px solid #8A6B2E !important;
          outline-offset: 2px !important;
        }

        .opp-item-line1 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .opp-category-chip {
          font-size: 12px;
          font-weight: 600;
          color: #6E5420;
          background-color: rgba(201, 165, 92, 0.16);
          border: 1px solid rgba(201, 165, 92, 0.25);
          padding: 2px 8px;
          border-radius: 6px;
          white-space: nowrap;
          font-family: var(--font-body), 'Inter', sans-serif;
        }

        .opp-item-title {
          font-family: var(--font-heading), 'Playfair Display', Georgia, serif;
          font-size: 16px;
          font-weight: 600;
          color: #2B2D2A;
          margin: 0;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .opp-item-org {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #5A584F;
          min-width: 0;
          font-family: var(--font-body), 'Inter', sans-serif;
        }

        .opp-truncate-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }

        .opp-item-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-size: 12px;
          color: #5A584F;
          padding-top: 2px;
          font-family: var(--font-body), 'Inter', sans-serif;
        }

        .opp-item-proj {
          display: flex;
          align-items: center;
          gap: 5px;
          min-width: 0;
          flex: 1;
        }

        .opp-item-closes {
          white-space: nowrap;
          flex-shrink: 0;
          font-weight: 600;
          color: #2B2D2A;
        }

        /* Detail Column */
        .opp-review-detail-col {
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid #E8E2D4;
          background-color: #FFFFFF;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06);
          width: 100%;
          min-width: 0;
        }

        /* Mobile Back Bar */
        .mobile-back-bar {
          display: none;
          padding: 12px 16px;
          border-bottom: 1px solid #E8E2D4;
          background-color: #F3EFE6;
        }
        .mobile-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #8A6B2E;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
        }

        /* Sticky Detail Header */
        .opp-detail-sticky-header {
          position: sticky;
          top: 0;
          z-index: 10;
          background: #F3EFE6;
          padding: 20px 26px;
          border-bottom: 1px solid #E8E2D4;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .opp-header-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
          flex: 1 1 280px;
        }

        .opp-header-chips {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .opp-header-title {
          font-family: var(--font-heading), 'Playfair Display', Georgia, serif;
          font-size: 28px;
          font-weight: 600;
          color: #2B2D2A;
          margin: 4px 0 0 0;
          line-height: 1.25;
          word-break: break-word;
        }

        .opp-header-subline {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #5A584F;
          margin-top: 2px;
          flex-wrap: wrap;
          font-family: var(--font-body), 'Inter', sans-serif;
        }
        .subline-dot {
          color: #C9A55C;
        }

        .opp-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .opp-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 16px;
          height: 40px;
          min-height: 40px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 10px;
          cursor: pointer;
          white-space: nowrap;
          min-width: 0;
          transition: all 0.16s ease;
          font-family: var(--font-body), 'Inter', sans-serif;
        }

        .opp-btn-changes {
          background-color: #FFFFFF !important;
          border: 1px solid #8A6B2E !important;
          color: #8A6B2E !important;
        }
        .opp-btn-changes:hover {
          background-color: #F3EFE6 !important;
        }

        .opp-btn-reject {
          background-color: #FFFFFF !important;
          border: 1px solid rgba(180, 35, 24, 0.35) !important;
          color: #B42318 !important;
        }
        .opp-btn-reject:hover {
          background-color: rgba(180, 35, 24, 0.08) !important;
        }

        /* Detail Content Body */
        .opp-detail-content-body {
          padding: 26px;
          display: flex;
          flex-direction: column;
          gap: 26px;
        }

        .opp-section-block {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .opp-divider-top {
          border-top: 1px solid #E8E2D4;
          padding-top: 24px;
        }

        .opp-section-heading {
          font-family: var(--font-heading), 'Playfair Display', Georgia, serif;
          font-size: 22px;
          font-weight: 600;
          color: #2B2D2A;
          margin: 0;
        }

        /* Key Facts Grid */
        .opp-key-facts-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px 20px;
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          border-radius: 14px;
          padding: 20px 22px;
          box-shadow: 0 1px 3px rgba(43, 45, 42, 0.03);
        }

        .opp-fact-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .opp-fact-label {
          font-size: 11px;
          color: #5A584F;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-family: var(--font-body), 'Inter', sans-serif;
        }

        .opp-fact-val {
          font-size: 18px;
          color: #2B2D2A;
          font-weight: 600;
          word-break: break-word;
          font-family: var(--font-heading), 'Playfair Display', Georgia, serif;
        }

        .opp-fact-sub {
          font-size: 13px;
          color: #5A584F;
          margin-top: 1px;
          font-family: var(--font-body), 'Inter', sans-serif;
        }

        /* Description */
        .opp-description-text {
          font-size: 15px;
          line-height: 1.7;
          color: #2B2D2A;
          margin: 0;
          max-width: 75ch;
          font-family: var(--font-body), 'Inter', sans-serif;
        }

        /* Visibility Preview */
        .opp-preview-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .opp-segmented-control {
          display: inline-flex;
          background-color: #F3EFE6;
          border: 1px solid #E8E2D4;
          border-radius: 10px;
          padding: 3px;
          gap: 3px;
        }

        .opp-segment-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #5A584F;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.16s ease;
          font-family: var(--font-body), 'Inter', sans-serif;
        }
        .opp-segment-active {
          background-color: #FFFFFF !important;
          color: #8A6B2E !important;
          border: 1px solid #E8E2D4 !important;
          box-shadow: 0 1px 3px rgba(43, 45, 42, 0.05);
        }

        .opp-preview-container {
          background-color: #FAF9F7;
          border: 1px solid #E8E2D4;
          border-radius: 14px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .opp-public-notice {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 13px;
          color: #6E5420;
          background-color: rgba(138, 107, 46, 0.10);
          border: 1px solid rgba(138, 107, 46, 0.22);
          padding: 10px 14px;
          border-radius: 10px;
          line-height: 1.5;
        }

        .opp-preview-public-details {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .opp-preview-tags {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .opp-preview-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #2B2D2A;
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          padding: 4px 12px;
          border-radius: 8px;
        }

        .opp-loggedin-brief-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .opp-loggedin-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 700;
          color: #8A6B2E;
        }

        .opp-loggedin-text {
          font-size: 14px;
          color: #2B2D2A;
          margin: 0;
          line-height: 1.6;
        }

        .opp-eligibility-strip {
          font-size: 13px;
          color: #5A584F;
          padding-top: 8px;
          border-top: 1px dashed #E8E2D4;
        }

        /* Casting Roles */
        .opp-roles-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .opp-roles-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .opp-role-card {
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          border-radius: 14px;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: border-color 0.16s ease, background-color 0.16s ease;
          box-shadow: 0 1px 3px rgba(43, 45, 42, 0.03);
        }
        .opp-role-card:hover {
          border-color: #8A6B2E;
          background-color: #FAF9F7;
        }

        .opp-role-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .opp-role-name {
          font-family: var(--font-heading), 'Playfair Display', Georgia, serif;
          font-size: 17px;
          font-weight: 600;
          color: #2B2D2A;
        }

        .opp-openings-chip {
          font-size: 12px;
          font-weight: 700;
          color: #6E5420;
          background-color: rgba(138, 107, 46, 0.12);
          border: 1px solid rgba(138, 107, 46, 0.22);
          padding: 2px 9px;
          border-radius: 999px;
          white-space: nowrap;
        }

        .opp-role-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-top: 2px;
        }

        .opp-role-chips-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .opp-role-meta-chip {
          font-size: 12px;
          color: #5A584F;
          background-color: #F3EFE6;
          border: 1px solid #E8E2D4;
          padding: 3px 10px;
          border-radius: 6px;
        }
        .opp-role-meta-chip strong {
          color: #2B2D2A;
        }

        .opp-role-desc {
          font-size: 14px;
          color: #5A584F;
          margin: 0;
          line-height: 1.5;
        }

        /* Modal Textarea */
        .opp-modal-textarea {
          background-color: #FFFFFF;
          border: 1px solid #D9D2C0;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 14px;
          color: #2B2D2A;
          outline: none;
          resize: vertical;
          width: 100%;
          box-sizing: border-box;
          font-family: var(--font-body), 'Inter', sans-serif;
          transition: border-color 0.16s ease, box-shadow 0.16s ease;
        }
        .opp-modal-textarea:focus {
          border-color: #8A6B2E;
          box-shadow: 0 0 0 3px rgba(138, 107, 46, 0.18);
        }

        .mobile-fixed-action-bar {
          display: none;
        }

        /* RESPONSIVE BREAKPOINTS */
        @media (max-width: 1023.98px) {
          .opp-review-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .opp-review-search-wrap {
            max-width: 100%;
          }

          .opp-review-layout {
            grid-template-columns: 1fr;
          }

          .opp-review-layout:not(.mobile-detail-open) .opp-review-detail-col {
            display: none !important;
          }
          .opp-review-layout.mobile-detail-open .opp-review-list-col {
            display: none !important;
          }

          .mobile-back-bar {
            display: block;
          }

          .opp-review-list-col {
            position: static;
            max-height: none;
          }

          .opp-key-facts-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 639.98px) {
          .opp-review-toolbar {
            background-color: #FFFFFF !important;
            border: 1px solid #E8E2D4 !important;
            border-radius: 14px !important;
            padding: 12px 14px !important;
            box-shadow: 0 4px 14px rgba(43, 45, 42, 0.05) !important;
            margin-bottom: 4px !important;
            gap: 10px !important;
          }
          .opp-review-tabs {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 5px !important;
            overflow: visible !important;
            width: 100% !important;
          }
          .opp-tab-btn {
            flex: 1 1 auto !important;
            height: 28px !important;
            min-height: 28px !important;
            padding: 0 8px !important;
            border-radius: 999px !important;
            font-size: 10.5px !important;
            font-weight: 600 !important;
            white-space: nowrap !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 5px !important;
          }
          .opp-tab-badge {
            min-width: 16px !important;
            height: 16px !important;
            border-radius: 8px !important;
            font-size: 9.5px !important;
            font-weight: 700 !important;
            padding: 0 4px !important;
            line-height: 16px !important;
          }
          .opp-review-search-wrap {
            max-width: 100% !important;
            width: 100% !important;
          }
          .opp-review-search-input {
            height: 40px !important;
            min-height: 40px !important;
            font-size: 16px !important;
            padding-left: 40px !important;
            border-radius: 10px !important;
          }
          .opp-list-item {
            padding: 12px 14px !important;
            border-radius: 14px !important;
            gap: 6px !important;
          }
          .opp-item-title {
            font-size: 14.5px !important;
            line-height: 1.25 !important;
          }
          .opp-category-chip {
            font-size: 10.5px !important;
            padding: 2px 7px !important;
          }
          .opp-key-facts-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
            padding: 12px 14px !important;
          }
          .opp-fact-val {
            font-size: 15px !important;
          }
          .opp-header-title {
            font-size: 20px !important;
            line-height: 1.2 !important;
          }
          .opp-detail-sticky-header {
            padding: 12px 14px !important;
          }
          .opp-header-actions {
            display: none !important;
          }
          .mobile-fixed-action-bar {
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
            position: sticky !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0px)) 12px !important;
            background: #FFFFFF !important;
            border-top: 1px solid #E8E2D4 !important;
            box-shadow: 0 -4px 16px rgba(43, 45, 42, 0.08) !important;
            z-index: 20 !important;
          }
          .mobile-fixed-action-bar .opp-action-btn {
            flex: 1 1 0 !important;
            height: 40px !important;
            font-size: 12px !important;
            padding: 0 6px !important;
            justify-content: center !important;
            white-space: nowrap !important;
          }
        }
        @media (max-width: 400px) {
          .opp-tab-btn {
            font-size: 10px !important;
            padding: 0 5px !important;
          }
          .opp-tab-badge {
            font-size: 9px !important;
            min-width: 15px !important;
            height: 15px !important;
          }
          .mobile-fixed-action-bar .opp-action-btn {
            font-size: 11px !important;
            padding: 0 4px !important;
          }
        }
      `}</style>
    </div>
  );
}
