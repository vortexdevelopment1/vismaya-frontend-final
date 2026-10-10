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
        <div style={{ height: "48px", background: "rgba(255, 255, 255, 0.06)", borderRadius: "12px", width: "40%" }} />
        <div style={{ height: "400px", background: "rgba(255, 255, 255, 0.06)", borderRadius: "16px" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Page Header */}
      <PageHeader
        title="Opportunities Directory"
        subtitle="Platform-wide directory of casting opportunities, application metrics, auto-closing schedules, and statuses."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Opportunities" },
        ]}
      />

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
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
                padding: "8px 16px",
                borderRadius: "12px",
                fontSize: "0.825rem",
                fontWeight: isActive ? "700" : "500",
                backgroundColor: isActive ? "#ffbc00" : "rgba(255, 255, 255, 0.06)",
                color: isActive ? "#1a1300" : "#a3acc2",
                border: `1px solid ${isActive ? "#ffbc00" : "rgba(255, 255, 255, 0.14)"}`,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  padding: "2px 7px",
                  borderRadius: "999px",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  backgroundColor: isActive ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.1)",
                  color: isActive ? "#1a1300" : "#eceaf5",
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Organization Dropdown Filter */}
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.07)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          borderRadius: "16px",
          padding: "16px 20px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
        }}
      >
        <div
          style={{
            flex: "1 1 260px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: "12px",
            padding: "8px 14px",
          }}
        >
          <Search size={16} style={{ color: "#7c869e" }} />
          <input
            type="text"
            placeholder="Search opportunity title, studio, project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: "0.85rem",
              color: "#eceaf5",
              width: "100%",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.825rem", fontWeight: "600", color: "#a3acc2" }}>Organization:</span>
          <select
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: "12px",
              padding: "8px 14px",
              fontSize: "0.825rem",
              color: "#eceaf5",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="ALL" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>All Organizations</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id} style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>
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
            backgroundColor: "rgba(255, 255, 255, 0.07)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: "16px",
            padding: "48px 20px",
            textAlign: "center",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
          }}
        >
          <Megaphone size={40} style={{ color: "#ffbc00", marginBottom: "12px" }} />
          <h3 style={{ fontSize: "1.05rem", color: "#eceaf5", marginBottom: "6px" }}>
            No Opportunities Found
          </h3>
          <p style={{ color: "#a3acc2", fontSize: "0.85rem", margin: 0 }}>
            No opportunities match your filter criteria.
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.07)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: "16px",
            overflow: "hidden",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: "#0f1626",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.14)",
                    color: "#ffbc00",
                    fontWeight: "700",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  <th style={{ padding: "16px 20px" }}>Opportunity</th>
                  <th style={{ padding: "16px 20px" }}>Project &amp; Studio</th>
                  <th style={{ padding: "16px 20px" }}>Application Deadline</th>
                  <th style={{ padding: "16px 20px" }}>Applicants</th>
                  <th style={{ padding: "16px 20px" }}>Status</th>
                  <th style={{ padding: "16px 20px", textAlign: "right" }}>Action</th>
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
                        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      {/* Opportunity Title & Type */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontWeight: "700", color: "#eceaf5" }}>
                          {opp.title}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#ffbc00", fontWeight: "600" }}>
                          {opp.opportunityType} &bull; {opp.location}
                        </div>
                      </td>

                      {/* Project & Organization */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontWeight: "600", color: "#eceaf5" }}>
                          {proj?.title || "Project"}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#a3acc2", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Building2 size={12} />
                          <span>{org?.name || "Organization"}</span>
                        </div>
                      </td>

                      {/* Deadline & Auto-close indicator */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: "600", color: "#eceaf5" }}>
                            {opp.deadline}
                          </span>
                          {isClosed ? (
                            <span
                              style={{
                                fontSize: "0.725rem",
                                fontWeight: "700",
                                color: "#fbbf24",
                                backgroundColor: "rgba(251, 191, 36, 0.15)",
                                border: "1px solid rgba(251, 191, 36, 0.35)",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                width: "fit-content",
                              }}
                            >
                              Auto-closed
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.725rem", color: "#7c869e" }}>
                              Auto-closes on {opp.deadline}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Applicants Count */}
                      <td style={{ padding: "16px 20px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 10px",
                            borderRadius: "999px",
                            backgroundColor: apps.length > 0 ? "rgba(255, 188, 0, 0.14)" : "rgba(255, 255, 255, 0.06)",
                            color: apps.length > 0 ? "#ffbc00" : "#7c869e",
                            border: apps.length > 0 ? "1px solid rgba(255, 188, 0, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
                            fontWeight: "700",
                            fontSize: "0.8rem",
                          }}
                        >
                          <Users size={13} />
                          <span>{apps.length}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "16px 20px" }}>
                        <StatusBadge status={opp.status} size="sm" />
                      </td>

                      {/* Action */}
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => setViewModalOpp(opp)}
                          className="btn-ghost"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "0.8rem",
                            color: "#ffbc00",
                            fontWeight: "600",
                            borderRadius: "8px",
                          }}
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
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                padding: "16px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <span style={{ fontSize: "0.75rem", color: "#7c869e", display: "block" }}>Organization</span>
                <strong style={{ fontSize: "0.9rem", color: "#eceaf5" }}>
                  {getOrgForOpp(viewModalOpp.orgId)?.name || "Zee Films"}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#7c869e", display: "block" }}>Project</span>
                <strong style={{ fontSize: "0.9rem", color: "#eceaf5" }}>
                  {getProjectForOpp(viewModalOpp.projectId)?.title || "Project"}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#7c869e", display: "block" }}>Remuneration</span>
                <strong style={{ fontSize: "0.9rem", color: "#eceaf5" }}>{viewModalOpp.remuneration}</strong>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#7c869e", display: "block" }}>Deadline</span>
                <strong style={{ fontSize: "0.9rem", color: "#eceaf5" }}>{viewModalOpp.deadline}</strong>
              </div>
            </div>

            <div>
              <strong style={{ fontSize: "0.85rem", color: "#eceaf5", display: "block", marginBottom: "6px" }}>
                Full Brief &amp; Synopsis:
              </strong>
              <p style={{ fontSize: "0.85rem", color: "#a3acc2", margin: 0, lineHeight: "1.5" }}>
                {viewModalOpp.fullBrief || viewModalOpp.summary}
              </p>
            </div>

            <div>
              <strong style={{ fontSize: "0.85rem", color: "#eceaf5", display: "block", marginBottom: "8px" }}>
                Roles Required:
              </strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(viewModalOpp.roles || []).map((r, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "10px",
                      padding: "10px 14px",
                      fontSize: "0.825rem",
                      color: "#eceaf5",
                    }}
                  >
                    <strong>{r.roleName}</strong> ({r.gender}, {r.ageRange}) &bull; {r.language}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "rgba(255, 188, 0, 0.1)",
                border: "1px solid rgba(255, 188, 0, 0.25)",
                borderRadius: "10px",
                padding: "12px",
                fontSize: "0.775rem",
                color: "#ffbc00",
              }}
            >
              Note: Organizations manage and edit their opportunity briefs directly. Admin holds publishing authorization and unpublish controls.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setViewModalOpp(null)}
                className="btn-primary"
                style={{ padding: "8px 20px", borderRadius: "12px" }}
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
