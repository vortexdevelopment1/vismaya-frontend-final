"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  PlusCircle,
  Search,
  Users,
  Eye,
  Edit,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import Modal from "@/components/shared/Modal";
import { useWorkflow } from "@/lib/shared/workflowStore";

const STATUS_FILTERS = [
  "All",
  "Published",
  "Submitted",
  "Changes Requested",
  "Draft",
  "Closed",
  "Cancel Requested",
  "Cancelled",
  "Completed",
];

const TABLE_GRID_COLUMNS = "minmax(200px, 1fr) 140px 155px 105px 145px 250px";

export default function MyOpportunitiesPage() {
  const {
    opportunities,
    projects,
    applications,
    requestCancellation,
    markOpportunityCompleted,
  } = useWorkflow();

  const orgId = "org-1";
  const orgOpportunities = opportunities.filter((o) => o.orgId === orgId);

  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State for Request Cancellation
  const [cancelModalOpp, setCancelModalOpp] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");

  // Modal State for Mark Completed
  const [completeModalOpp, setCompleteModalOpp] = useState(null);

  const filteredOpportunities = orgOpportunities.filter((opp) => {
    const matchesStatus =
      statusFilter === "All"
        ? true
        : opp.status.toLowerCase() === statusFilter.toLowerCase();
    const proj = projects.find((p) => p.id === opp.projectId);
    const matchesSearch =
      !searchTerm ||
      opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.opportunityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (proj && proj.title.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleRequestCancellation = (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      setCancelError("Please provide a reason for cancellation.");
      return;
    }

    requestCancellation(cancelModalOpp.id, cancelReason.trim());
    setCancelModalOpp(null);
    setCancelReason("");
    setCancelError("");
  };

  const handleConfirmMarkCompleted = () => {
    if (!completeModalOpp) return;
    markOpportunityCompleted(completeModalOpp.id);
    setCompleteModalOpp(null);
  };

  // Helper for Status Pill
  const renderStatusPill = (status) => {
    const s = (status || "").toLowerCase();
    let bg = "#F3EFE6";
    let text = "#5A584F";
    let border = "1px solid #E8E2D4";
    let dot = null;

    if (s.includes("publish")) {
      bg = "rgba(138, 107, 46, 0.10)";
      text = "#8A6B2E";
      border = "1px solid rgba(138, 107, 46, 0.22)";
      dot = "#8A6B2E";
    } else if (s.includes("change") || s.includes("correction")) {
      bg = "rgba(201, 165, 92, 0.18)";
      text = "#6E5420";
      border = "1px solid rgba(201, 165, 92, 0.32)";
    } else if (s.includes("cancel") || s.includes("reject")) {
      bg = "rgba(180, 35, 24, 0.08)";
      text = "#B42318";
      border = "1px solid rgba(180, 35, 24, 0.20)";
    } else if (s.includes("complete") || s.includes("closed")) {
      bg = "#F3EFE6";
      text = "#2B2D2A";
      border = "1px solid #E8E2D4";
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "5px 12px",
          borderRadius: "999px",
          backgroundColor: bg,
          color: text,
          border: border,
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {dot && (
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: dot,
              flexShrink: 0,
            }}
          />
        )}
        <span>{status}</span>
      </span>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%", maxWidth: "1400px", margin: "0 auto" }} className="opps-page-container">
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
        className="opps-page-header"
      >
        <div style={{ minWidth: 0 }} className="opps-header-text-block">
          <div style={{ display: "flex", alignItems: "baseline", gap: "14px", flexWrap: "wrap" }} className="opps-title-row">
            <h1
              style={{
                fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                fontSize: "clamp(28px, 3.5vw, 40px)",
                lineHeight: 1.15,
                fontWeight: 600,
                color: "#2B2D2A",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
              className="opps-page-h1"
            >
              My Opportunities
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 12px",
                borderRadius: "999px",
                backgroundColor: "rgba(138, 107, 46, 0.10)",
                color: "#8A6B2E",
                border: "1px solid rgba(138, 107, 46, 0.20)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
              className="opps-count-pill"
            >
              {orgOpportunities.length} TOTAL OPPORTUNITIES
            </span>
          </div>
          <p
            style={{
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              fontSize: "16px",
              color: "#5A584F",
              margin: "8px 0 0 0",
              lineHeight: 1.6,
            }}
            className="opps-header-desc"
          >
            Manage casting requirements, view application inflows, and coordinate Vismaya moderation status.
          </p>
        </div>

        <Link
          href="/recruiter/opportunities/new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            borderRadius: "10px",
            backgroundColor: "#8A6B2E",
            color: "#FFFFFF",
            fontWeight: 600,
            fontFamily: "var(--font-body), 'Inter', sans-serif",
            textDecoration: "none",
            boxShadow: "0 2px 8px rgba(138, 107, 46, 0.24)",
            transition: "all 0.18s ease",
          }}
          className="v-primary-post-btn"
        >
          <PlusCircle size={16} />
          <span>Post Opportunity</span>
        </Link>
      </div>

      {/* Toolbar: Search and Filter */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E2D4",
          borderRadius: "16px",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
          boxShadow: "0 2px 12px rgba(43, 45, 42, 0.03)",
        }}
        className="v-filter-toolbar mo-filter"
      >
        {/* Status Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }} className="v-filter-group mo-filter-status">
          <label
            htmlFor="status-select"
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#2B2D2A",
              whiteSpace: "nowrap",
              flexShrink: 0,
              margin: 0,
            }}
            className="v-filter-label mo-filter-label"
          >
            Status:
          </label>
          <select
            id="status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              borderRadius: "10px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E2D4",
              color: "#2B2D2A",
              fontWeight: 500,
              outline: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              transition: "border-color 0.18s ease, box-shadow 0.18s ease",
            }}
            className="v-filter-select mo-filter-select"
          >
            {STATUS_FILTERS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
          className="v-search-wrapper mo-filter-search"
        >
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "14px",
              color: "#5A584F",
              pointerEvents: "none",
            }}
            className="mo-search-icon"
          />
          <input
            type="text"
            placeholder="Search by title, project, type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              height: "44px",
              borderRadius: "10px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E2D4",
              color: "#2B2D2A",
              fontSize: "14px",
              padding: "0 14px 0 40px",
              outline: "none",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              transition: "border-color 0.18s ease, box-shadow 0.18s ease",
            }}
            className="v-search-field mo-search-input"
          />
        </div>
      </div>

      {/* Opportunities Container Card */}
      <div className="v-opps-outer-card">
        {filteredOpportunities.length === 0 ? (
          <div style={{ padding: "48px 24px" }} className="v-opps-empty-wrap">
            <EmptyState
              title="No opportunities found"
              description={
                searchTerm || statusFilter !== "All"
                  ? "No records matching your search filters."
                  : "Create your first opportunity to start receiving verified talent submissions."
              }
              icon={Briefcase}
              actionLabel="Post Opportunity"
              actionHref="/recruiter/opportunities/new"
            />
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= 1024px) */}
            <div style={{ width: "100%", overflowX: "auto" }} className="desktop-table-container">
              <div
                style={{
                  minWidth: "960px",
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                }}
              >
                {/* Fixed Grid Header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: TABLE_GRID_COLUMNS,
                    columnGap: "14px",
                    alignItems: "center",
                    padding: "16px 20px",
                    backgroundColor: "#F3EFE6",
                    borderBottom: "1px solid #E8E2D4",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#5A584F",
                    fontFamily: "var(--font-body), 'Inter', sans-serif",
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ minWidth: 0 }}>Opportunity & Project</div>
                  <div style={{ minWidth: 0 }}>Category</div>
                  <div style={{ minWidth: 0 }}>Deadline & Schedule</div>
                  <div style={{ minWidth: 0 }}>Applicants</div>
                  <div style={{ minWidth: 0 }}>Status</div>
                  <div style={{ textAlign: "right", minWidth: 0 }}>Actions</div>
                </div>

                {/* Grid Data Rows */}
                {filteredOpportunities.map((opp, idx) => {
                  const proj = projects.find((p) => p.id === opp.projectId);
                  const oppApps = applications.filter((a) => a.opportunityId === opp.id);
                  const canEdit = opp.status === "Draft" || opp.status === "Changes Requested";
                  const canRequestCancel = opp.status === "Published" || opp.status === "Submitted";
                  const canMarkCompleted = opp.status === "Published" || opp.status === "Closed";

                  return (
                    <div
                      key={opp.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: TABLE_GRID_COLUMNS,
                        columnGap: "14px",
                        alignItems: "center",
                        padding: "20px 20px",
                        borderBottom:
                          idx === filteredOpportunities.length - 1
                            ? "none"
                            : "1px solid #E8E2D4",
                        transition: "background-color 0.15s ease",
                        backgroundColor: "#FFFFFF",
                        boxSizing: "border-box",
                      }}
                      className="v-opp-table-row"
                    >
                      {/* Column 1: Opportunity & Project */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
                        <Link
                          href={`/recruiter/opportunities/${opp.id}/applicants`}
                          style={{
                            fontSize: "16px",
                            fontWeight: 600,
                            color: "#2B2D2A",
                            textDecoration: "none",
                            lineHeight: 1.4,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            transition: "color 0.16s ease",
                          }}
                          className="v-opp-title-link"
                          title={opp.title}
                        >
                          {opp.title}
                        </Link>
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#5A584F",
                            lineHeight: 1.4,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          className="v-opp-proj-text"
                        >
                          Project: {proj?.title || "Assigned Project"}
                        </span>
                        {opp.adminNote && (
                          <span
                            style={{
                              fontSize: "13px",
                              color: opp.status === "Changes Requested" ? "#8A6B2E" : "#5A584F",
                              marginTop: "2px",
                              lineHeight: 1.4,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            <strong>Note: </strong>
                            {opp.adminNote}
                          </span>
                        )}
                      </div>

                      {/* Column 2: Category */}
                      <div style={{ minWidth: 0 }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            whiteSpace: "nowrap",
                            padding: "6px 12px",
                            borderRadius: "999px",
                            fontSize: "12px",
                            fontWeight: 600,
                            backgroundColor: "rgba(201, 165, 92, 0.16)",
                            color: "#6E5420",
                            border: "1px solid rgba(201, 165, 92, 0.32)",
                          }}
                        >
                          {opp.opportunityType}
                        </span>
                      </div>

                      {/* Column 3: Deadline & Schedule */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
                        <span
                          style={{
                            fontSize: "16px",
                            fontWeight: 600,
                            color: "#2B2D2A",
                            fontVariantNumeric: "tabular-nums",
                            lineHeight: 1.3,
                          }}
                        >
                          {opp.deadline}
                        </span>
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#5A584F",
                            lineHeight: 1.4,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          Closes automatically on {opp.deadline}
                        </span>
                      </div>

                      {/* Column 4: Applicants */}
                      <div style={{ minWidth: 0 }}>
                        <Link
                          href={`/recruiter/opportunities/${opp.id}/applicants`}
                          style={{
                            height: "36px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "0 14px",
                            borderRadius: "999px",
                            backgroundColor: "#F3EFE6",
                            border: "1px solid #E8E2D4",
                            color: "#2B2D2A",
                            fontSize: "14px",
                            fontWeight: 700,
                            textDecoration: "none",
                            transition: "all 0.18s ease",
                          }}
                          className="v-applicants-pill"
                        >
                          <Users size={14} style={{ color: "#8A6B2E" }} />
                          <span>{oppApps.length}</span>
                        </Link>
                      </div>

                      {/* Column 5: Status */}
                      <div style={{ minWidth: 0 }}>
                        {renderStatusPill(opp.status)}
                      </div>

                      {/* Column 6: Actions */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: "6px",
                          flexWrap: "nowrap",
                          minWidth: 0,
                        }}
                      >
                        <Link
                          href={`/recruiter/opportunities/${opp.id}/applicants`}
                          style={{
                            height: "38px",
                            padding: "0 10px",
                            borderRadius: "10px",
                            border: "1px solid #E8E2D4",
                            backgroundColor: "transparent",
                            color: "#5A584F",
                            fontSize: "13px",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            textDecoration: "none",
                            whiteSpace: "nowrap",
                            transition: "all 0.18s ease",
                          }}
                          className="v-action-btn-ghost"
                          title="View Applicants"
                        >
                          <Eye size={15} />
                          <span>View</span>
                        </Link>

                        {canEdit && (
                          <Link
                            href={`/recruiter/opportunities/new?edit=${opp.id}`}
                            style={{
                              height: "38px",
                              padding: "0 10px",
                              borderRadius: "10px",
                              border: "1px solid #E8E2D4",
                              backgroundColor: "transparent",
                              color: "#5A584F",
                              fontSize: "13px",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              textDecoration: "none",
                              whiteSpace: "nowrap",
                              transition: "all 0.18s ease",
                            }}
                            className="v-action-btn-ghost"
                            title="Edit Opportunity"
                          >
                            <Edit size={15} />
                            <span>Edit</span>
                          </Link>
                        )}

                        {canRequestCancel && (
                          <button
                            type="button"
                            onClick={() => {
                              setCancelModalOpp(opp);
                              setCancelReason("");
                              setCancelError("");
                            }}
                            style={{
                              height: "38px",
                              padding: "0 10px",
                              borderRadius: "10px",
                              border: "1px solid rgba(180, 35, 24, 0.25)",
                              backgroundColor: "transparent",
                              color: "#B42318",
                              fontSize: "13px",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              transition: "all 0.18s ease",
                            }}
                            className="v-action-btn-danger"
                            title="Request Cancellation from Vismaya"
                          >
                            <XCircle size={15} />
                            <span>Cancel</span>
                          </button>
                        )}

                        {canMarkCompleted && (
                          <button
                            type="button"
                            onClick={() => setCompleteModalOpp(opp)}
                            style={{
                              height: "38px",
                              padding: "0 10px",
                              borderRadius: "10px",
                              border: "1px solid #8A6B2E",
                              backgroundColor: "transparent",
                              color: "#8A6B2E",
                              fontSize: "13px",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              transition: "all 0.18s ease",
                            }}
                            className="v-action-btn-complete"
                            title="Mark Completed"
                          >
                            <CheckCircle2 size={15} />
                            <span>Complete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Responsive Card-Style View (< 1024px) */}
            <div className="mobile-cards-container">
              {filteredOpportunities.map((opp) => {
                const proj = projects.find((p) => p.id === opp.projectId);
                const oppApps = applications.filter((a) => a.opportunityId === opp.id);
                const canEdit = opp.status === "Draft" || opp.status === "Changes Requested";
                const canRequestCancel = opp.status === "Published" || opp.status === "Submitted";
                const canMarkCompleted = opp.status === "Published" || opp.status === "Closed";

                return (
                  <div
                    key={`card-${opp.id}`}
                    style={{
                      borderRadius: "14px",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E8E2D4",
                      display: "flex",
                      flexDirection: "column",
                      boxShadow: "0 2px 8px rgba(43, 45, 42, 0.03)",
                    }}
                    className="v-responsive-card mo-card"
                  >
                    {/* Card Top: Category, Status & Title */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }} className="v-card-top-group mo-card-header">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }} className="v-card-row-1 mo-card-top">
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            whiteSpace: "nowrap",
                            padding: "4px 10px",
                            borderRadius: "999px",
                            fontSize: "12px",
                            fontWeight: 600,
                            backgroundColor: "rgba(201, 165, 92, 0.16)",
                            color: "#6E5420",
                            border: "1px solid rgba(201, 165, 92, 0.32)",
                          }}
                          className="v-card-type-pill mo-card-type"
                        >
                          {opp.opportunityType}
                        </span>
                        <div className="v-card-status-pill-wrap mo-card-status">
                          {renderStatusPill(opp.status)}
                        </div>
                      </div>

                      <Link
                        href={`/recruiter/opportunities/${opp.id}/applicants`}
                        style={{
                          fontSize: "17px",
                          fontWeight: 600,
                          color: "#2B2D2A",
                          textDecoration: "none",
                          lineHeight: 1.35,
                        }}
                        className="v-card-title-link mo-card-title"
                      >
                        {opp.title}
                      </Link>

                      <span
                        style={{
                          fontSize: "13.5px",
                          color: "#5A584F",
                        }}
                        className="v-card-proj-label mo-card-project"
                      >
                        Project: {proj?.title || "Assigned Project"}
                      </span>
                    </div>

                    {/* Metadata Grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px",
                        padding: "12px 14px",
                        borderRadius: "10px",
                        backgroundColor: "#F3EFE6",
                        border: "1px solid #E8E2D4",
                      }}
                      className="v-card-meta-box mo-card-meta"
                    >
                      <div className="v-card-meta-col mo-meta-col">
                        <span style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.10em", color: "#5A584F", textTransform: "uppercase" }} className="v-card-meta-label mo-meta-label">
                          Deadline
                        </span>
                        <strong style={{ fontSize: "14px", color: "#2B2D2A", fontVariantNumeric: "tabular-nums" }} className="v-card-meta-val mo-meta-val">
                          {opp.deadline}
                        </strong>
                      </div>

                      <div className="v-card-meta-col mo-meta-col">
                        <span style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.10em", color: "#5A584F", textTransform: "uppercase" }} className="v-card-meta-label mo-meta-label">
                          Applicants
                        </span>
                        <Link
                          href={`/recruiter/opportunities/${opp.id}/applicants`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "#8A6B2E",
                            textDecoration: "none",
                          }}
                          className="v-card-meta-apps-link mo-meta-apps"
                        >
                          <Users size={14} />
                          <span>{oppApps.length}</span>
                        </Link>
                      </div>
                    </div>

                    {opp.adminNote && (
                      <div
                        style={{
                          fontSize: "13px",
                          color: opp.status === "Changes Requested" ? "#8A6B2E" : "#5A584F",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          backgroundColor: "#FAF9F7",
                          border: "1px solid #E8E2D4",
                          lineHeight: 1.45,
                        }}
                        className="v-card-note-box mo-card-note"
                      >
                        <strong>Note: </strong>
                        {opp.adminNote}
                      </div>
                    )}

                    {/* Card Actions */}
                    <div className="v-card-actions mo-actions">
                      <Link
                        href={`/recruiter/opportunities/${opp.id}/applicants`}
                        style={{
                          borderRadius: "10px",
                          backgroundColor: "#8A6B2E",
                          color: "#FFFFFF",
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          textDecoration: "none",
                          boxShadow: "0 2px 6px rgba(138, 107, 46, 0.20)",
                        }}
                        className="v-mobile-action-view mo-btn-view"
                      >
                        <Eye size={16} />
                        <span>View</span>
                      </Link>

                      {canEdit && (
                        <Link
                          href={`/recruiter/opportunities/new?edit=${opp.id}`}
                          style={{
                            borderRadius: "10px",
                            border: "1px solid #E8E2D4",
                            backgroundColor: "#FFFFFF",
                            color: "#2B2D2A",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            textDecoration: "none",
                          }}
                          className="v-mobile-action-edit mo-btn-edit"
                        >
                          <Edit size={16} />
                          <span>Edit</span>
                        </Link>
                      )}

                      {canRequestCancel && (
                        <button
                          type="button"
                          onClick={() => {
                            setCancelModalOpp(opp);
                            setCancelReason("");
                            setCancelError("");
                          }}
                          style={{
                            borderRadius: "10px",
                            border: "1px solid rgba(180, 35, 24, 0.25)",
                            backgroundColor: "transparent",
                            color: "#B42318",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            cursor: "pointer",
                          }}
                          className="v-mobile-action-cancel mo-btn-cancel"
                        >
                          <XCircle size={16} />
                          <span>Cancel</span>
                        </button>
                      )}

                      {canMarkCompleted && (
                        <button
                          type="button"
                          onClick={() => setCompleteModalOpp(opp)}
                          style={{
                            borderRadius: "10px",
                            border: "1px solid #8A6B2E",
                            backgroundColor: "transparent",
                            color: "#8A6B2E",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            cursor: "pointer",
                          }}
                          className="v-mobile-action-complete mo-btn-complete"
                        >
                          <CheckCircle2 size={16} />
                          <span>Complete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Embedded Styles for hover and responsive breakpoints */}
      <style jsx global>{`
        /* Base styles for elements whose inline styles were moved to classes */
        .opps-page-container .opps-header-text-block {
          flex: 1 1 340px;
          min-width: 0;
        }
        .opps-page-container .v-primary-post-btn {
          height: 46px;
          padding: 0 22px;
          font-size: 14px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .opps-page-container .v-filter-select {
          width: 200px;
          height: 44px;
          font-size: 14px;
          padding: 0 14px;
        }
        .opps-page-container .v-search-wrapper {
          margin-left: auto;
          flex: 1 1 280px;
          max-width: 420px;
        }
        .opps-page-container .v-opps-outer-card {
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(43, 45, 42, 0.04);
        }
        .opps-page-container .v-responsive-card {
          padding: 20px;
          gap: 14px;
        }
        .opps-page-container .v-card-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          padding-top: 6px;
        }
        .opps-page-container .v-mobile-action-view {
          flex: 1;
          min-width: 110px;
          height: 44px;
          padding: 0 14px;
          font-size: 13.5px;
        }
        .opps-page-container .v-mobile-action-edit,
        .opps-page-container .v-mobile-action-cancel,
        .opps-page-container .v-mobile-action-complete {
          height: 44px;
          padding: 0 14px;
          font-size: 13.5px;
        }

        /* Hover & focus states */
        .opps-page-container .v-primary-post-btn:hover {
          background-color: #6E5420 !important;
          transform: translateY(-1px);
        }
        .opps-page-container .v-filter-select:focus,
        .opps-page-container .v-search-field:focus {
          border-color: #8A6B2E !important;
          box-shadow: 0 0 0 3px rgba(138, 107, 46, 0.18) !important;
        }
        .opps-page-container .v-opp-table-row:hover {
          background-color: #FAF9F7 !important;
        }
        .opps-page-container .v-opp-title-link:hover {
          color: #8A6B2E !important;
        }
        .opps-page-container .v-opp-proj-link:hover {
          color: #2B2D2A !important;
        }
        .opps-page-container .v-applicants-pill:hover {
          border-color: #8A6B2E !important;
          color: #8A6B2E !important;
        }
        .opps-page-container .v-action-btn-ghost:hover {
          border-color: #8A6B2E !important;
          color: #8A6B2E !important;
          background-color: #F3EFE6 !important;
        }
        .opps-page-container .v-action-btn-danger:hover {
          background-color: rgba(180, 35, 24, 0.08) !important;
          border-color: #B42318 !important;
        }
        .opps-page-container .v-action-btn-complete:hover {
          background-color: #F3EFE6 !important;
          border-color: #6E5420 !important;
          color: #6E5420 !important;
        }

        .opps-page-container .desktop-table-container {
          display: block;
        }
        .opps-page-container .mobile-cards-container {
          display: none;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
        }

        @media (max-width: 1024px) {
          .opps-page-container .desktop-table-container {
            display: none !important;
          }
          .opps-page-container .mobile-cards-container {
            display: flex !important;
          }
        }

        @media (max-width: 767.98px) {
          .opps-page-container .v-filter-toolbar {
            padding: 16px !important;
            gap: 12px !important;
          }
          .opps-page-container .v-filter-group {
            width: 100% !important;
          }
          .opps-page-container .v-filter-select {
            flex: 1 !important;
            width: 100% !important;
          }
          .opps-page-container .v-search-wrapper {
            width: 100% !important;
            max-width: 100% !important;
            margin-left: 0 !important;
          }
          .opps-page-container .opps-page-header {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .opps-page-container .v-primary-post-btn {
            width: 100% !important;
            justify-content: center !important;
          }
        }

        @media (max-width: 640px) {
          /* A) Page Wrapper and Direct Children Containers */
          .opps-page-container {
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            align-content: flex-start !important;
            align-items: stretch !important;
            height: auto !important;
            min-height: 0 !important;
            grid-template-rows: none !important;
            grid-auto-rows: auto !important;
            padding: 12px 14px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
            gap: 12px !important;
            margin: 0 auto !important;
          }

          /* Har direct child: flex: 0 0 auto; height: auto; min-height: 0; margin-top/bottom 0 */
          .opps-page-container > * {
            flex: 0 0 auto !important;
            height: auto !important;
            min-height: 0 !important;
            margin-top: 0 !important;
            margin-bottom: 0 !important;
          }

          /* Neutralize card-inside-card outer wrappers */
          .opps-page-container .v-filter-toolbar,
          .opps-page-container .mo-filter {
            background: none !important;
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .opps-page-container .v-opps-outer-card {
            background: none !important;
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            flex: 0 0 auto !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
          }
          .opps-page-container .mobile-cards-container {
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            align-content: flex-start !important;
            align-items: stretch !important;
            gap: 10px !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            flex: 0 0 auto !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
          }

          /* B) Header */
          .opps-page-container .opps-page-header {
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            align-content: flex-start !important;
            align-items: stretch !important;
            gap: 10px !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            flex: 0 0 auto !important;
          }
          .opps-page-container .opps-header-text-block {
            width: 100% !important;
            min-width: 0 !important;
            margin: 0 !important;
            flex: 0 0 auto !important;
            flex-grow: 0 !important;
            flex-shrink: 0 !important;
            flex-basis: auto !important;
            height: auto !important;
            min-height: 0 !important;
          }
          .opps-page-container .opps-title-row {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 8px !important;
            flex-wrap: nowrap !important;
          }
          .opps-page-container .opps-page-h1 {
            font-size: 22px !important;
            line-height: 1.2 !important;
            letter-spacing: -0.015em !important;
            margin: 0 !important;
            color: #2B2D2A !important;
          }
          .opps-page-container .opps-count-pill {
            font-size: 10px !important;
            padding: 3px 8px !important;
            white-space: nowrap !important;
            font-weight: 700 !important;
            letter-spacing: 0.08em !important;
          }
          .opps-page-container .opps-header-desc {
            font-size: 12px !important;
            line-height: 1.4 !important;
            color: #5A584F !important;
            margin: 6px 0 0 0 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          }
          .opps-page-container .v-primary-post-btn {
            width: 100% !important;
            height: 42px !important;
            min-height: 42px !important;
            max-height: 42px !important;
            font-size: 13px !important;
            margin: 0 !important;
            padding: 0 16px !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            box-sizing: border-box !important;
            flex: 0 0 auto !important;
            flex-grow: 0 !important;
            flex-shrink: 0 !important;
          }

          /* C) Filter Section (.mo-filter) */
          .opps-page-container .v-filter-toolbar,
          .opps-page-container .mo-filter {
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            align-content: flex-start !important;
            align-items: stretch !important;
            gap: 8px !important;
            height: auto !important;
            min-height: 0 !important;
            grid-template-rows: none !important;
            grid-auto-rows: auto !important;
            margin: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
            background: none !important;
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            flex: 0 0 auto !important;
          }
          /* Neutralize old wrapper flex properties */
          .opps-page-container .mo-filter-search,
          .opps-page-container .mo-filter-status {
            flex: 0 0 auto !important;
            flex-grow: 0 !important;
            flex-shrink: 0 !important;
            flex-basis: auto !important;
            min-height: 0 !important;
            height: auto !important;
            min-width: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            box-sizing: border-box !important;
          }

          /* 1. Search input first */
          .opps-page-container .mo-filter-search {
            order: 1 !important;
            height: 42px !important;
            min-height: 42px !important;
            max-height: 42px !important;
            position: relative !important;
            display: block !important;
          }
          .opps-page-container .mo-search-input {
            width: 100% !important;
            height: 42px !important;
            min-height: 42px !important;
            font-size: 16px !important;
            border-radius: 10px !important;
            background-color: #FFFFFF !important;
            border: 1px solid #E8E2D4 !important;
            padding: 0 14px 0 40px !important;
            box-sizing: border-box !important;
            color: #2B2D2A !important;
            outline: none !important;
          }
          .opps-page-container .mo-search-icon {
            position: absolute !important;
            left: 14px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            color: #5A584F !important;
            pointer-events: none !important;
            width: 16px !important;
            height: 16px !important;
          }

          /* 2. Status select second */
          .opps-page-container .mo-filter-status {
            order: 2 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 4px !important;
          }
          .opps-page-container .mo-filter-label {
            font-size: 11px !important;
            font-weight: 600 !important;
            color: #5A584F !important;
            margin: 0 !important;
            line-height: 1 !important;
            display: block !important;
            text-align: left !important;
          }
          .opps-page-container .mo-filter-select {
            width: 100% !important;
            height: 42px !important;
            min-height: 42px !important;
            font-size: 16px !important;
            border-radius: 10px !important;
            background-color: #FFFFFF !important;
            border: 1px solid #E8E2D4 !important;
            padding: 0 12px !important;
            box-sizing: border-box !important;
            color: #2B2D2A !important;
            outline: none !important;
          }

          /* D) Opportunity Card (.mo-card) */
          .opps-page-container .mo-card {
            padding: 12px !important;
            border-radius: 14px !important;
            border: 1px solid #E8E2D4 !important;
            background-color: #FFFFFF !important;
            margin: 0 !important;
            margin-bottom: 0 !important;
            box-shadow: 0 2px 6px rgba(43, 45, 42, 0.04) !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
            width: 100% !important;
            box-sizing: border-box !important;
            min-width: 0 !important;
            flex: 0 0 auto !important;
            height: auto !important;
            min-height: 0 !important;
          }
          .opps-page-container .mo-card-header {
            display: flex !important;
            flex-direction: column !important;
            gap: 6px !important;
            width: 100% !important;
            min-width: 0 !important;
          }
          .opps-page-container .mo-card-top {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            gap: 8px !important;
            flex-wrap: nowrap !important;
            width: 100% !important;
            min-width: 0 !important;
          }
          .opps-page-container .mo-card-type {
            font-size: 10px !important;
            padding: 3px 8px !important;
            border-radius: 999px !important;
            background-color: rgba(201, 165, 92, 0.16) !important;
            color: #6E5420 !important;
            border: 1px solid rgba(201, 165, 92, 0.32) !important;
            font-weight: 600 !important;
            white-space: nowrap !important;
            line-height: 1.2 !important;
          }
          .opps-page-container .mo-card-status > span {
            font-size: 10px !important;
            padding: 3px 8px !important;
            border-radius: 999px !important;
            font-weight: 700 !important;
            letter-spacing: 0.08em !important;
            line-height: 1.2 !important;
            white-space: nowrap !important;
          }
          .opps-page-container .mo-card-title {
            font-family: var(--font-heading), 'Playfair Display', Georgia, serif !important;
            font-size: 16px !important;
            line-height: 1.25 !important;
            font-weight: 600 !important;
            color: #2B2D2A !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            text-decoration: none !important;
            margin-top: 8px !important;
            margin-bottom: 0 !important;
            word-break: break-word !important;
          }
          .opps-page-container .mo-card-project {
            font-size: 12px !important;
            color: #5A584F !important;
            line-height: 1.3 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            display: block !important;
            margin: 0 !important;
            min-width: 0 !important;
          }

          /* Deadline + Applicants compact box */
          .opps-page-container .mo-card-meta {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            background-color: #F3EFE6 !important;
            border: 1px solid #E8E2D4 !important;
            border-radius: 10px !important;
            padding: 8px 10px !important;
            box-sizing: border-box !important;
            height: 52px !important;
            min-height: 52px !important;
            align-items: center !important;
            width: 100% !important;
            min-width: 0 !important;
          }
          .opps-page-container .mo-meta-col {
            min-width: 0 !important;
          }
          .opps-page-container .mo-meta-label {
            display: block !important;
            font-size: 9.5px !important;
            font-weight: 700 !important;
            letter-spacing: 0.08em !important;
            color: #5A584F !important;
            text-transform: uppercase !important;
            margin-bottom: 2px !important;
            line-height: 1.2 !important;
          }
          .opps-page-container .mo-meta-val {
            font-size: 14px !important;
            line-height: 1.2 !important;
            color: #2B2D2A !important;
            font-weight: 700 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            display: block !important;
          }
          .opps-page-container .mo-meta-apps {
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
            font-size: 14px !important;
            font-weight: 700 !important;
            color: #8A6B2E !important;
            text-decoration: none !important;
          }

          /* Note Box */
          .opps-page-container .mo-card-note {
            font-size: 11.5px !important;
            padding: 8px 10px !important;
            border-radius: 8px !important;
            line-height: 1.4 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
            background-color: #FAF9F7 !important;
            border: 1px solid #E8E2D4 !important;
            margin: 8px 0 !important;
            width: 100% !important;
            min-width: 0 !important;
          }

          /* Actions (.mo-actions): 3 equal buttons ek row mein */
          .opps-page-container .mo-actions {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 6px !important;
            padding-top: 2px !important;
            width: 100% !important;
            box-sizing: border-box !important;
            min-width: 0 !important;
          }
          .opps-page-container .mo-actions:has(> :nth-child(2):last-child) {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .opps-page-container .mo-actions:has(> :only-child) {
            grid-template-columns: 1fr !important;
          }
          .opps-page-container .mo-actions a,
          .opps-page-container .mo-actions button {
            height: 36px !important;
            min-height: 36px !important;
            max-height: 36px !important;
            padding: 0 4px !important;
            font-size: 11px !important;
            font-weight: 600 !important;
            border-radius: 10px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 4px !important;
            white-space: nowrap !important;
            min-width: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
            text-decoration: none !important;
            cursor: pointer !important;
          }
          .opps-page-container .mo-actions svg {
            width: 14px !important;
            height: 14px !important;
            flex-shrink: 0 !important;
          }
          .opps-page-container .mo-btn-view {
            background-color: #8A6B2E !important;
            color: #FFFFFF !important;
            border: 1px solid #8A6B2E !important;
            box-shadow: 0 1px 4px rgba(138, 107, 46, 0.20) !important;
          }
          .opps-page-container .mo-btn-cancel {
            background-color: #FFFFFF !important;
            color: #B42318 !important;
            border: 1px solid rgba(180, 35, 24, 0.3) !important;
            box-shadow: none !important;
          }
          .opps-page-container .mo-btn-complete {
            background-color: #FFFFFF !important;
            color: #8A6B2E !important;
            border: 1px solid #8A6B2E !important;
            box-shadow: none !important;
          }
          .opps-page-container .mo-btn-edit {
            background-color: #FFFFFF !important;
            color: #5A584F !important;
            border: 1px solid #E8E2D4 !important;
            box-shadow: none !important;
          }

          /* E) Children min-width: 0 */
          .opps-page-container *,
          .opps-page-container .mo-filter *,
          .opps-page-container .mo-card *,
          .opps-page-container .mo-actions * {
            min-width: 0;
          }

          /* Empty State (D) */
          .opps-page-container .v-opps-empty-wrap {
            padding: 24px 12px !important;
            background-color: #FFFFFF !important;
            border-radius: 14px !important;
            border: 1px solid #E8E2D4 !important;
          }
          .opps-page-container .v-opps-empty-wrap div[style*="width: 56px"],
          .opps-page-container .v-opps-empty-wrap div[style*="width:56px"] {
            width: 40px !important;
            height: 40px !important;
            margin-bottom: 10px !important;
          }
          .opps-page-container .v-opps-empty-wrap h3 {
            font-size: 16px !important;
            line-height: 22px !important;
            margin-bottom: 4px !important;
          }
          .opps-page-container .v-opps-empty-wrap p {
            font-size: 13px !important;
            line-height: 18px !important;
          }

          /* Modals (E) */
          .opps-page-container .v-modal-btn-row {
            display: flex !important;
            flex-direction: row !important;
            gap: 8px !important;
            width: 100% !important;
          }
          .opps-page-container .v-modal-btn-row button {
            flex: 1 1 0 !important;
            height: 42px !important;
            min-height: 42px !important;
            font-size: 13px !important;
            padding: 0 8px !important;
          }
          .opps-page-container .v-modal-textarea {
            font-size: 16px !important;
          }
        }
      `}</style>

      {/* Request Cancellation Modal */}
      {cancelModalOpp && (
        <Modal
          isOpen={Boolean(cancelModalOpp)}
          onClose={() => setCancelModalOpp(null)}
          title="Request Opportunity Cancellation"
          subtitle="Submit a formal cancellation request to the Vismaya moderation desk."
          maxWidth="520px"
        >
          <form
            onSubmit={handleRequestCancellation}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <p
              style={{
                fontSize: "14px",
                color: "#5A584F",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Organizations cannot cancel published opportunities directly. The Vismaya team reviews all cancellation requests to notify active applicants and handle escrow adjustments.
            </p>

            {cancelError && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(180, 35, 24, 0.08)",
                  border: "1px solid rgba(180, 35, 24, 0.22)",
                  color: "#B42318",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {cancelError}
              </div>
            )}

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#2B2D2A",
                  marginBottom: "6px",
                }}
              >
                Reason for Cancellation <span style={{ color: "#B42318" }}>*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Production shoot rescheduled, script role merged with another character..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: "14px",
                  borderRadius: "10px",
                  border: "1px solid #E8E2D4",
                  outline: "none",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
                  color: "#2B2D2A",
                  boxSizing: "border-box",
                }}
                className="v-modal-textarea"
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "8px",
              }}
              className="v-modal-btn-row"
            >
              <button
                type="button"
                onClick={() => setCancelModalOpp(null)}
                style={{
                  padding: "0 18px",
                  height: "42px",
                  borderRadius: "10px",
                  border: "1px solid #E8E2D4",
                  backgroundColor: "#FFFFFF",
                  color: "#2B2D2A",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Back
              </button>
              <button
                type="submit"
                style={{
                  padding: "0 22px",
                  height: "42px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#B42318",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(180, 35, 24, 0.22)",
                }}
              >
                Send Cancellation Request
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Mark Completed Modal */}
      {completeModalOpp && (
        <Modal
          isOpen={Boolean(completeModalOpp)}
          onClose={() => setCompleteModalOpp(null)}
          title="Mark Opportunity Completed"
          subtitle="Finalize casting for this opportunity."
          maxWidth="480px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p
              style={{
                fontSize: "14px",
                color: "#5A584F",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Are you sure you want to mark{" "}
              <strong style={{ color: "#2B2D2A" }}>
                "{completeModalOpp.title}"
              </strong>{" "}
              as Completed? The opportunity will be locked and archived.
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "8px",
              }}
              className="v-modal-btn-row"
            >
              <button
                type="button"
                onClick={() => setCompleteModalOpp(null)}
                style={{
                  padding: "0 18px",
                  height: "42px",
                  borderRadius: "10px",
                  border: "1px solid #E8E2D4",
                  backgroundColor: "#FFFFFF",
                  color: "#2B2D2A",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMarkCompleted}
                style={{
                  padding: "0 22px",
                  height: "42px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#8A6B2E",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(138, 107, 46, 0.22)",
                }}
              >
                Confirm Complete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
