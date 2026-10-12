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
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%", maxWidth: "1400px", margin: "0 auto" }}>
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
        <div style={{ flex: "1 1 340px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "14px", flexWrap: "wrap" }}>
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
            height: "46px",
            padding: "0 22px",
            borderRadius: "10px",
            backgroundColor: "#8A6B2E",
            color: "#FFFFFF",
            fontSize: "14px",
            fontWeight: 600,
            fontFamily: "var(--font-body), 'Inter', sans-serif",
            textDecoration: "none",
            boxShadow: "0 2px 8px rgba(138, 107, 46, 0.24)",
            transition: "all 0.18s ease",
            whiteSpace: "nowrap",
            flexShrink: 0,
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
        className="v-filter-toolbar"
      >
        {/* Status Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }} className="v-filter-group">
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
          >
            Status:
          </label>
          <select
            id="status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: "200px",
              height: "44px",
              borderRadius: "10px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E2D4",
              color: "#2B2D2A",
              fontSize: "14px",
              fontWeight: 500,
              padding: "0 14px",
              outline: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              transition: "border-color 0.18s ease, box-shadow 0.18s ease",
            }}
            className="v-filter-select"
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
            marginLeft: "auto",
            flex: "1 1 280px",
            maxWidth: "420px",
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
          className="v-search-wrapper"
        >
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "14px",
              color: "#5A584F",
              pointerEvents: "none",
            }}
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
            className="v-search-field"
          />
        </div>
      </div>

      {/* Opportunities Container Card */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E2D4",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(43, 45, 42, 0.04)",
        }}
      >
        {filteredOpportunities.length === 0 ? (
          <div style={{ padding: "48px 24px" }}>
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
                        <Link
                          href={`/recruiter/projects/${opp.projectId}`}
                          style={{
                            fontSize: "13px",
                            color: "#5A584F",
                            textDecoration: "none",
                            lineHeight: 1.4,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            transition: "color 0.16s ease",
                          }}
                          className="v-opp-proj-link"
                        >
                          Project: {proj?.title || "Assigned Project"}
                        </Link>
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
                      padding: "20px",
                      borderRadius: "14px",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E8E2D4",
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                      boxShadow: "0 2px 8px rgba(43, 45, 42, 0.03)",
                    }}
                    className="v-responsive-card"
                  >
                    {/* Card Top: Category, Status & Title */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
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
                        >
                          {opp.opportunityType}
                        </span>
                        {renderStatusPill(opp.status)}
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
                      >
                        {opp.title}
                      </Link>

                      <Link
                        href={`/recruiter/projects/${opp.projectId}`}
                        style={{
                          fontSize: "13.5px",
                          color: "#5A584F",
                          textDecoration: "none",
                        }}
                      >
                        Project: {proj?.title || "Assigned Project"}
                      </Link>
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
                    >
                      <div>
                        <span style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.10em", color: "#5A584F", textTransform: "uppercase" }}>
                          Deadline
                        </span>
                        <strong style={{ fontSize: "14px", color: "#2B2D2A", fontVariantNumeric: "tabular-nums" }}>
                          {opp.deadline}
                        </strong>
                      </div>

                      <div>
                        <span style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.10em", color: "#5A584F", textTransform: "uppercase" }}>
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
                      >
                        <strong>Note: </strong>
                        {opp.adminNote}
                      </div>
                    )}

                    {/* Card Actions */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                        paddingTop: "6px",
                      }}
                      className="v-card-actions"
                    >
                      <Link
                        href={`/recruiter/opportunities/${opp.id}/applicants`}
                        style={{
                          flex: 1,
                          minWidth: "110px",
                          height: "44px",
                          padding: "0 14px",
                          borderRadius: "10px",
                          backgroundColor: "#8A6B2E",
                          color: "#FFFFFF",
                          fontSize: "13.5px",
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          textDecoration: "none",
                          boxShadow: "0 2px 6px rgba(138, 107, 46, 0.20)",
                        }}
                      >
                        <Eye size={16} />
                        <span>View</span>
                      </Link>

                      {canEdit && (
                        <Link
                          href={`/recruiter/opportunities/new?edit=${opp.id}`}
                          style={{
                            height: "44px",
                            padding: "0 14px",
                            borderRadius: "10px",
                            border: "1px solid #E8E2D4",
                            backgroundColor: "#FFFFFF",
                            color: "#2B2D2A",
                            fontSize: "13.5px",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            textDecoration: "none",
                          }}
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
                            height: "44px",
                            padding: "0 14px",
                            borderRadius: "10px",
                            border: "1px solid rgba(180, 35, 24, 0.25)",
                            backgroundColor: "transparent",
                            color: "#B42318",
                            fontSize: "13.5px",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            cursor: "pointer",
                          }}
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
                            height: "44px",
                            padding: "0 14px",
                            borderRadius: "10px",
                            border: "1px solid #8A6B2E",
                            backgroundColor: "transparent",
                            color: "#8A6B2E",
                            fontSize: "13.5px",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            cursor: "pointer",
                          }}
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
      <style jsx>{`
        .v-primary-post-btn:hover {
          background-color: #6E5420 !important;
          transform: translateY(-1px);
        }
        .v-filter-select:focus,
        .v-search-field:focus {
          border-color: #8A6B2E !important;
          box-shadow: 0 0 0 3px rgba(138, 107, 46, 0.18) !important;
        }
        .v-opp-table-row:hover {
          background-color: #FAF9F7 !important;
        }
        .v-opp-title-link:hover {
          color: #8A6B2E !important;
        }
        .v-opp-proj-link:hover {
          color: #2B2D2A !important;
        }
        .v-applicants-pill:hover {
          border-color: #8A6B2E !important;
          color: #8A6B2E !important;
        }
        .v-action-btn-ghost:hover {
          border-color: #8A6B2E !important;
          color: #8A6B2E !important;
          background-color: #F3EFE6 !important;
        }
        .v-action-btn-danger:hover {
          background-color: rgba(180, 35, 24, 0.08) !important;
          border-color: #B42318 !important;
        }
        .v-action-btn-complete:hover {
          background-color: #F3EFE6 !important;
          border-color: #6E5420 !important;
          color: #6E5420 !important;
        }

        .desktop-table-container {
          display: block;
        }
        .mobile-cards-container {
          display: none;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
        }

        @media (max-width: 1024px) {
          .desktop-table-container {
            display: none !important;
          }
          .mobile-cards-container {
            display: flex !important;
          }
        }

        @media (max-width: 767.98px) {
          .v-filter-toolbar {
            padding: 16px !important;
            gap: 12px !important;
          }
          .v-filter-group {
            width: 100% !important;
          }
          .v-filter-select {
            flex: 1 !important;
            width: 100% !important;
          }
          .v-search-wrapper {
            width: 100% !important;
            max-width: 100% !important;
            margin-left: 0 !important;
          }
          .opps-page-header {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .v-primary-post-btn {
            width: 100% !important;
            justify-content: center !important;
          }
        }

        @media (max-width: 480px) {
          .v-card-actions {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .v-card-actions a,
          .v-card-actions button {
            width: 100% !important;
            justify-content: center !important;
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
