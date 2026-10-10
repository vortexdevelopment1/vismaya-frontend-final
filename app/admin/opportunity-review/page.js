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

export default function OpportunityReviewPage() {
  const {
    opportunities = [],
    projects = [],
    organizations = [],
    adminApproveAndPublish,
    adminRequestChanges,
    adminReject,
    isHydrated,
  } = useWorkflow();

  // Tab State: "All" is the default first tab
  const [filterTab, setFilterTab] = useState("All"); // All | Submitted | Changes Requested | Rejected
  const [searchQuery, setSearchQuery] = useState("");
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
      Submitted: opportunities.filter((o) => o.status === "Submitted").length,
      "Changes Requested": opportunities.filter((o) => o.status === "Changes Requested").length,
      Rejected: opportunities.filter((o) => o.status === "Rejected").length,
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
      if (filterTab !== "All" && opp.status !== filterTab) {
        return false;
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
    return selectedOpportunity
      ? projects.find((p) => p.id === selectedOpportunity.projectId)
      : null;
  }, [selectedOpportunity, projects]);

  const selectedOrg = useMemo(() => {
    return selectedOpportunity
      ? organizations.find((o) => o.id === selectedOpportunity.orgId)
      : null;
  }, [selectedOpportunity, organizations]);

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
  const handleApprove = (e) => {
    e.preventDefault();
    if (!approveModalOpp) return;
    adminApproveAndPublish(
      approveModalOpp.id,
      approveNote || "Verified and published by Vismaya Casting Desk."
    );
    setApproveModalOpp(null);
    setApproveNote("");
  };

  const handleRequestChanges = (e) => {
    e.preventDefault();
    if (!changesModalOpp || !changesNote.trim()) return;
    adminRequestChanges(changesModalOpp.id, changesNote.trim());
    setChangesModalOpp(null);
    setChangesNote("");
  };

  const handleReject = (e) => {
    e.preventDefault();
    if (!rejectModalOpp || !rejectReason.trim()) return;
    adminReject(rejectModalOpp.id, rejectReason.trim());
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

                {/* Header Action Buttons (Only shown for Submitted status) */}
                {selectedOpportunity.status === "Submitted" && (
                  <div className="opp-header-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setApproveModalOpp(selectedOpportunity);
                        setApproveNote("");
                      }}
                      className="btn-primary opp-action-btn"
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
                {/* 4B. Key Facts: ONE clean 3-col grid inside ONE section surface */}
                <div className="opp-section-block">
                  <div className="opp-key-facts-grid">
                    {/* 1. Organization */}
                    <div className="opp-fact-cell">
                      <span className="opp-fact-label">Organization</span>
                      <strong className="opp-fact-val">{selectedOrg?.name || "Zee Films"}</strong>
                      <span className="opp-fact-sub">
                        {selectedOrg?.type || "Production House"} &bull; {selectedOrg?.status || "Verified"}
                      </span>
                    </div>

                    {/* 2. Project Link */}
                    <div className="opp-fact-cell">
                      <span className="opp-fact-label">Project</span>
                      <strong className="opp-fact-val">{selectedProject?.title || "Mumbai Diaries"}</strong>
                      <span className="opp-fact-sub">
                        {selectedProject?.type || "OTT Series"}
                      </span>
                    </div>

                    {/* 3. Location */}
                    <div className="opp-fact-cell">
                      <span className="opp-fact-label">Location</span>
                      <strong className="opp-fact-val">{selectedOpportunity.location || "Mumbai"}</strong>
                      <span className="opp-fact-sub">On-location / Studio</span>
                    </div>

                    {/* 4. Remuneration */}
                    <div className="opp-fact-cell">
                      <span className="opp-fact-label">Remuneration</span>
                      <strong className="opp-fact-val" style={{ color: "var(--gold)" }}>
                        {selectedOpportunity.remuneration || "Standard Industry Scale"}
                      </strong>
                      <span className="opp-fact-sub">Direct Production Payout</span>
                    </div>

                    {/* 5. Application Deadline */}
                    <div className="opp-fact-cell">
                      <span className="opp-fact-label">Application Deadline</span>
                      <strong className="opp-fact-val">{selectedOpportunity.deadline}</strong>
                      <span className="opp-fact-sub">Auto-closing at 23:59 IST</span>
                    </div>

                    {/* 6. Roles Available */}
                    <div className="opp-fact-cell">
                      <span className="opp-fact-label">Roles Count</span>
                      <strong className="opp-fact-val">
                        {(selectedOpportunity.roles || []).length} Available{" "}
                        {(selectedOpportunity.roles || []).length === 1 ? "Role" : "Roles"}
                      </strong>
                      <span className="opp-fact-sub">Casting breakdowns below</span>
                    </div>
                  </div>
                </div>

                {/* 4C. Description: Brief summary */}
                <div className="opp-section-block opp-divider-top">
                  <h3 className="opp-section-heading">Brief summary</h3>
                  <p className="opp-description-text">
                    {selectedOpportunity.summary || selectedOpportunity.fullBrief}
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
                            {selectedOpportunity.summary || selectedOpportunity.fullBrief}
                          </p>
                          <div className="opp-preview-tags">
                            <span className="opp-preview-tag">
                              <MapPin size={12} style={{ color: "var(--gold)" }} />
                              <span>{selectedOpportunity.location}</span>
                            </span>
                            <span className="opp-preview-tag">
                              <DollarSign size={12} style={{ color: "var(--gold)" }} />
                              <span>{selectedOpportunity.remuneration}</span>
                            </span>
                            <span className="opp-preview-tag">
                              <Calendar size={12} style={{ color: "var(--gold)" }} />
                              <span>Closes: {selectedOpportunity.deadline}</span>
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
                            "Full audition script instructions, detailed character arcs, scene sides, and ensemble breakdown available upon applying."}
                        </p>
                        {selectedOpportunity.eligibility && (
                          <div className="opp-eligibility-strip">
                            <span style={{ color: "#7c869e", fontWeight: 600 }}>Eligibility Match: </span>
                            <span>
                              Age {selectedOpportunity.eligibility.ageMin}–{selectedOpportunity.eligibility.ageMax} &bull;{" "}
                              {selectedOpportunity.eligibility.languages?.join(", ") || "All Languages"} &bull;{" "}
                              {selectedOpportunity.eligibility.location}
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
                                {role.roleName}
                              </strong>
                              {isMulti && (
                                <span style={{ color: "#7c869e" }}>
                                  {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                </span>
                              )}
                            </div>
                            <span className="opp-openings-chip">
                              {role.count} {role.count === 1 ? "opening" : "openings"}
                            </span>
                          </div>

                          {/* Accordion Body */}
                          {isOpen && (
                            <div className="opp-role-body">
                              {/* Meta chips */}
                              <div className="opp-role-chips-row">
                                {role.ageRange && (
                                  <span className="opp-role-meta-chip">
                                    Age: <strong>{role.ageRange}</strong>
                                  </span>
                                )}
                                {role.gender && (
                                  <span className="opp-role-meta-chip">
                                    Gender: <strong>{role.gender}</strong>
                                  </span>
                                )}
                                {role.language && (
                                  <span className="opp-role-meta-chip">
                                    Languages: <strong>{role.language}</strong>
                                  </span>
                                )}
                                {role.skills && Array.isArray(role.skills) && (
                                  <span className="opp-role-meta-chip">
                                    Skills: <strong>{role.skills.join(", ")}</strong>
                                  </span>
                                )}
                              </div>

                              {/* Description */}
                              {role.description && (
                                <p className="opp-role-desc">
                                  {role.description}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Mobile Fixed Action Bar (when status is Submitted) */}
              {selectedOpportunity.status === "Submitted" && (
                <div className="mobile-fixed-action-bar">
                  <button
                    type="button"
                    onClick={() => {
                      setApproveModalOpp(selectedOpportunity);
                      setApproveNote("");
                    }}
                    className="btn-primary"
                    style={{ flex: 1, minHeight: "42px", justifyContent: "center" }}
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
                  Reason for Rejection *
                </label>
                <span style={{ fontSize: "0.725rem", color: "#7c869e" }}>
                  {rejectReason.length} characters
                </span>
              </div>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="E.g. Brief violates platform compliance policies..."
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
                disabled={!rejectReason.trim()}
                style={{
                  backgroundColor: "#ff6b6b",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "8px 18px",
                  fontSize: "0.825rem",
                  fontWeight: "700",
                  cursor: rejectReason.trim() ? "pointer" : "not-allowed",
                  opacity: rejectReason.trim() ? 1 : 0.6,
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
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
          font-size: 0.8rem;
          font-weight: 600;
          color: #a3acc2;
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
          flex-shrink: 0;
          box-sizing: border-box;
        }
        .opp-tab-btn:hover:not(.opp-tab-active) {
          background-color: rgba(255, 255, 255, 0.08);
          color: #eceaf5;
          border-color: rgba(255, 255, 255, 0.2);
        }
        .opp-tab-active {
          background: linear-gradient(135deg, #ffd54a 0%, #ffbc00 100%) !important;
          color: #1a1300 !important;
          border-color: #ffd54a !important;
          box-shadow: 0 4px 12px rgba(255, 188, 0, 0.25);
        }

        .opp-tab-badge {
          padding: 1px 7px;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 700;
          background-color: rgba(255, 255, 255, 0.1);
          color: #eceaf5;
        }
        .opp-tab-badge-active {
          background-color: rgba(26, 19, 0, 0.25) !important;
          color: #1a1300 !important;
        }

        /* 1-4. Search input wrapper & input */
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
          color: #7e89a3;
          pointer-events: none;
          z-index: 2;
        }

        .opp-review-search-input {
          width: 100%;
          height: 40px;
          min-height: 40px;
          padding-left: 42px !important;
          padding-right: 14px !important;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background-color: rgba(255, 255, 255, 0.055);
          border-radius: 12px;
          color: #eceaf5;
          font-size: 0.825rem;
          font-family: inherit;
          outline: none;
          appearance: none;
          -webkit-appearance: none;
          box-sizing: border-box;
          transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
          box-shadow: none;
        }
        .opp-review-search-input.has-value {
          padding-right: 36px !important;
        }
        .opp-review-search-input:hover {
          background-color: rgba(255, 255, 255, 0.075);
          border-color: rgba(255, 255, 255, 0.22);
        }
        .opp-review-search-input:focus {
          border-color: #ffbc00 !important;
          box-shadow: 0 0 0 3px rgba(255, 188, 0, 0.15) !important;
          background-color: rgba(255, 255, 255, 0.075);
        }
        .opp-review-search-input::placeholder {
          color: #7e89a3;
          font-size: 0.825rem;
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
          color: #7e89a3;
          padding: 4px;
          border-radius: 50%;
          z-index: 2;
          transition: color 0.15s ease, background-color 0.15s ease;
        }
        .opp-search-clear-btn:hover {
          color: #eceaf5;
          background-color: rgba(255, 255, 255, 0.1);
        }

        /* Empty State */
        .opp-empty-state-card {
          border-radius: 16px;
          padding: 56px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .opp-empty-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background-color: rgba(255, 188, 0, 0.12);
          border: 1px solid rgba(255, 188, 0, 0.3);
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
          scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
        }
        .opp-review-list-col::-webkit-scrollbar {
          width: 4px;
        }
        .opp-review-list-col::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.18);
          border-radius: 999px;
        }

        /* Left List Item */
        .opp-list-item {
          border-radius: 12px;
          padding: 14px;
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
          display: flex;
          flex-direction: column;
          gap: 6px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-left: 3px solid transparent;
          background-color: rgba(255, 255, 255, 0.03);
          outline: none;
        }
        .opp-list-item:hover:not(.opp-list-item-selected) {
          background-color: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.14);
        }
        .opp-list-item-selected {
          border-left: 3px solid var(--gold) !important;
          background-color: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.14) !important;
        }
        .opp-list-item:focus-visible {
          outline: 2px solid var(--gold) !important;
          outline-offset: 2px !important;
        }

        .opp-item-line1 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .opp-category-chip {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--gold);
          background-color: rgba(255, 188, 0, 0.12);
          border: 1px solid rgba(255, 188, 0, 0.3);
          padding: 2px 7px;
          borderRadius: 6px;
          white-space: nowrap;
        }

        .opp-item-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #eceaf5;
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
          font-size: 0.775rem;
          color: #a3acc2;
          min-width: 0;
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
          font-size: 0.725rem;
          color: #7c869e;
          padding-top: 2px;
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
          font-weight: 500;
        }

        /* Detail Column */
        .opp-review-detail-col {
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
          width: 100%;
          min-width: 0;
        }

        /* Mobile Back Bar */
        .mobile-back-bar {
          display: none;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background-color: rgba(15, 22, 38, 0.9);
        }
        .mobile-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--gold);
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
          background: rgba(15, 22, 38, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: 18px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .opp-header-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
          flex: 1 1 280px;
        }

        .opp-header-chips {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .opp-header-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: "#eceaf5";
          margin: 2px 0 0 0;
          line-height: 1.3;
          word-break: break-word;
        }

        .opp-header-subline {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: #a3acc2;
          margin-top: 2px;
          flex-wrap: wrap;
        }
        .subline-dot {
          color: #7c869e;
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
          padding: 0 14px;
          height: 36px;
          min-height: 36px;
          font-size: 0.775rem;
          font-weight: 700;
          border-radius: 10px;
          cursor: pointer;
          white-space: nowrap;
          min-width: 0;
          transition: all 0.15s ease;
        }

        .opp-btn-changes {
          background-color: rgba(251, 191, 36, 0.12) !important;
          border: 1px solid rgba(251, 191, 36, 0.35) !important;
          color: #fbbf24 !important;
        }
        .opp-btn-changes:hover {
          background-color: rgba(251, 191, 36, 0.2) !important;
        }

        .opp-btn-reject {
          background-color: rgba(255, 107, 107, 0.12) !important;
          border: 1px solid rgba(255, 107, 107, 0.35) !important;
          color: #ff6b6b !important;
        }
        .opp-btn-reject:hover {
          background-color: rgba(255, 107, 107, 0.2) !important;
        }

        /* Detail Content Body */
        .opp-detail-content-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .opp-section-block {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .opp-divider-top {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 24px;
        }

        .opp-section-heading {
          font-size: 0.95rem;
          font-weight: 700;
          color: #eceaf5;
          margin: 0;
        }

        /* Key Facts Grid */
        .opp-key-facts-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px 20px;
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 18px 20px;
        }

        .opp-fact-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .opp-fact-label {
          font-size: 0.7rem;
          color: #7c869e;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .opp-fact-val {
          font-size: 0.9rem;
          color: #eceaf5;
          font-weight: 700;
          word-break: break-word;
        }

        .opp-fact-sub {
          font-size: 0.75rem;
          color: #a3acc2;
          margin-top: 1px;
        }

        /* Description */
        .opp-description-text {
          font-size: 0.875rem;
          line-height: 1.6;
          color: #a3acc2;
          margin: 0;
          max-width: 70ch;
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
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 3px;
          gap: 3px;
        }

        .opp-segment-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 7px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #a3acc2;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .opp-segment-active {
          background-color: rgba(255, 188, 0, 0.15) !important;
          color: var(--gold) !important;
          font-weight: 700 !important;
        }

        .opp-preview-container {
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .opp-public-notice {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.775rem;
          color: #fbbf24;
          background-color: rgba(251, 191, 36, 0.08);
          border: 1px solid rgba(251, 191, 36, 0.2);
          padding: 8px 12px;
          border-radius: 8px;
          line-height: 1.45;
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
          gap: 5px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #eceaf5;
          background-color: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 3px 10px;
          border-radius: 6px;
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
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--gold);
        }

        .opp-loggedin-text {
          font-size: 0.85rem;
          color: #eceaf5;
          margin: 0;
          line-height: 1.55;
        }

        .opp-eligibility-strip {
          font-size: 0.775rem;
          color: #a3acc2;
          padding-top: 6px;
          border-top: 1px dashed rgba(255, 255, 255, 0.08);
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
          gap: 10px;
        }

        .opp-role-card {
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: border-color 0.15s ease, background-color 0.15s ease;
        }
        .opp-role-card:hover {
          border-color: rgba(255, 255, 255, 0.14);
          background-color: rgba(255, 255, 255, 0.04);
        }

        .opp-role-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .opp-role-name {
          font-size: 0.9rem;
          font-weight: 700;
          color: #eceaf5;
        }

        .opp-openings-chip {
          font-size: 0.725rem;
          font-weight: 700;
          color: var(--gold);
          background-color: rgba(255, 188, 0, 0.12);
          border: 1px solid rgba(255, 188, 0, 0.3);
          padding: 2px 8px;
          border-radius: 999px;
          white-space: nowrap;
        }

        .opp-role-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 2px;
        }

        .opp-role-chips-row {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .opp-role-meta-chip {
          font-size: 0.725rem;
          color: #a3acc2;
          background-color: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 2px 8px;
          border-radius: 6px;
        }
        .opp-role-meta-chip strong {
          color: #eceaf5;
        }

        .opp-role-desc {
          font-size: 0.8rem;
          color: #a3acc2;
          margin: 0;
          line-height: 1.45;
        }

        /* Modal Textarea */
        .opp-modal-textarea {
          background-color: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 0.85rem;
          color: #eceaf5;
          outline: none;
          resize: vertical;
          width: 100%;
          box-sizing: border-box;
          font-family: inherit;
        }
        .opp-modal-textarea:focus {
          border-color: rgba(255, 188, 0, 0.5);
        }

        .mobile-fixed-action-bar {
          display: none;
        }

        /* 6. RESPONSIVE BREAKPOINTS */

        @media (max-width: 1023.98px) {
          .opp-review-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          .opp-review-search-wrap {
            max-width: 100%;
          }

          .opp-review-layout {
            grid-template-columns: 1fr;
          }

          /* In mobile/tablet mode, show list OR detail */
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
          .opp-key-facts-grid {
            grid-template-columns: 1fr;
          }

          .opp-header-actions {
            display: none; /* Hide header actions, use mobile bottom bar instead */
          }

          .mobile-fixed-action-bar {
            display: flex;
            align-items: center;
            gap: 8px;
            position: sticky;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px)) 16px;
            background: rgba(15, 22, 38, 0.98);
            border-top: 1px solid rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            z-index: 20;
          }
        }
      `}</style>
    </div>
  );
}
