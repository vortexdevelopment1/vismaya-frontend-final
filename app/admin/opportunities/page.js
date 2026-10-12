"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { useWorkflow } from "@/lib/shared/workflowStore";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import Modal from "@/components/shared/Modal";

export default function AdminOpportunitiesPage() {
  const {
    opportunities = [],
    projects = [],
    organizations = [],
    applications = [],
    isHydrated,
  } = useWorkflow();

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [orgFilter, setOrgFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Detail Modal for read-only view
  const [viewModalOpp, setViewModalOpp] = useState(null);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = {
      ALL: opportunities.length,
      Published: 0,
      Submitted: 0,
      "Changes Requested": 0,
      Closed: 0,
      Cancelled: 0,
      Completed: 0,
      Draft: 0,
    };
    opportunities.forEach((o) => {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      }
    });
    return counts;
  }, [opportunities]);

  // Filtered opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // Status
      if (statusFilter !== "ALL" && opp.status !== statusFilter) {
        return false;
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

  if (!isHydrated) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ height: "48px", background: "#F3EFE6", borderRadius: "12px", width: "40%" }} />
        <div style={{ height: "400px", background: "#FFFFFF", border: "1px solid #E8E2D4", borderRadius: "16px" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Page Header */}
      <PageHeader
        title="Opportunities Directory"
        subtitle="Platform-wide directory of casting opportunities, application metrics, auto-closing schedules, and statuses."
        badge={`${opportunities.length} Total Opportunities`}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Opportunities" },
        ]}
      />

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
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
                transition: "all 0.15s ease",
              }}
            >
              <span>{tab.label}</span>
              <span
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
          style={{
            flex: "1 1 280px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "#FFFFFF",
            border: "1px solid #D9D2C0",
            borderRadius: "10px",
            padding: "0 14px",
            height: "44px",
          }}
        >
          <Search size={16} style={{ color: "#5A584F" }} />
          <input
            type="text"
            placeholder="Search opportunity title, studio, project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: "14px",
              color: "#2B2D2A",
              width: "100%",
              fontFamily: "Inter, sans-serif",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A", whiteSpace: "nowrap" }}>Organization:</span>
          <select
            value={orgFilter}
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
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px", minWidth: "960px" }}>
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
                  <th style={{ padding: "16px 20px" }}>Opportunity</th>
                  <th style={{ padding: "16px 20px" }}>Project &amp; Studio</th>
                  <th style={{ padding: "16px 20px" }}>Application Deadline</th>
                  <th style={{ padding: "16px 20px" }}>Applicants</th>
                  <th style={{ padding: "16px 20px" }}>Status</th>
                  <th style={{ padding: "16px 20px", textAlign: "right", whiteSpace: "nowrap", minWidth: "110px" }}>Action</th>
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
                      <td style={{ padding: "18px 20px" }}>
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
                          }}
                        >
                          <Users size={13} />
                          <span>{apps.length}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "18px 20px" }}>
                        <StatusBadge status={opp.status} size="sm" />
                      </td>

                      {/* Action */}
                      <td style={{ padding: "18px 20px", textAlign: "right", whiteSpace: "nowrap", minWidth: "110px" }}>
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
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                        >
                          <Eye size={14} />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                  {getOrgForOpp(viewModalOpp.orgId)?.name || "Zee Films"}
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

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setViewModalOpp(null)}
                style={{
                  padding: "10px 22px",
                  borderRadius: "10px",
                  backgroundColor: "#8A6B2E",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close View
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
