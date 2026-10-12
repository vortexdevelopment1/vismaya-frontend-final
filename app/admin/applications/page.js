"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Users,
  Building2,
  Calendar,
  Clock,
  Search,
  Filter,
  Eye,
  MapPin,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Video,
} from "lucide-react";
import { useWorkflow } from "@/lib/shared/workflowStore";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import Modal from "@/components/shared/Modal";

export default function AdminApplicationsOverviewPage() {
  const {
    applications = [],
    opportunities = [],
    organizations = [],
    auditions = [],
    isHydrated,
  } = useWorkflow();

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [oppFilter, setOppFilter] = useState("ALL");
  const [orgFilter, setOrgFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Selected Application for Timeline Drawer/Modal
  const [timelineApp, setTimelineApp] = useState(null);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = {
      ALL: applications.length,
      Applied: 0,
      "Under Review": 0,
      Shortlisted: 0,
      Selected: 0,
      "Not Selected": 0,
      Withdrawn: 0,
    };
    applications.forEach((a) => {
      if (counts[a.status] !== undefined) {
        counts[a.status]++;
      }
    });
    return counts;
  }, [applications]);

  // Filtered Applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Status
      if (statusFilter !== "ALL" && app.status !== statusFilter) {
        return false;
      }

      // Opportunity
      if (oppFilter !== "ALL" && app.opportunityId !== oppFilter) {
        return false;
      }

      // Organization
      const opp = opportunities.find((o) => o.id === app.opportunityId);
      if (orgFilter !== "ALL" && opp?.orgId !== orgFilter) {
        return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const org = organizations.find((o) => o.id === opp?.orgId);
        const name = (app.talentName || "").toLowerCase();
        const role = (app.roleApplied || "").toLowerCase();
        const city = (app.talentProfile?.city || "").toLowerCase();
        const oppTitle = (opp?.title || "").toLowerCase();
        const orgName = (org?.name || "").toLowerCase();

        const match =
          name.includes(q) ||
          role.includes(q) ||
          city.includes(q) ||
          oppTitle.includes(q) ||
          orgName.includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [applications, statusFilter, oppFilter, orgFilter, searchQuery, opportunities, organizations]);

  const getOpportunityForApp = (oppId) => {
    return opportunities.find((o) => o.id === oppId);
  };

  const getOrgForOpp = (opp) => {
    return opp ? organizations.find((o) => o.id === opp.orgId) : null;
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "—";
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
        title="Application Pipeline Overview"
        subtitle="Read-only platform pipeline of talent applications across all studio casting opportunities."
        badge={`${applications.length} Total Applications`}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Applications" },
        ]}
      />

      {/* Status Tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[
          { key: "ALL", label: "All Applications", count: statusCounts.ALL },
          { key: "Applied", label: "Applied", count: statusCounts.Applied },
          { key: "Under Review", label: "Under Review", count: statusCounts["Under Review"] },
          { key: "Shortlisted", label: "Shortlisted", count: statusCounts.Shortlisted },
          { key: "Selected", label: "Selected", count: statusCounts.Selected },
          { key: "Not Selected", label: "Not Selected", count: statusCounts["Not Selected"] },
          { key: "Withdrawn", label: "Withdrawn", count: statusCounts.Withdrawn },
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

      {/* Search & Filter Selectors Card */}
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
            flex: "1 1 260px",
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
            placeholder="Search candidate name, role, city..."
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

        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          {/* Opportunity Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A", whiteSpace: "nowrap" }}>Opportunity:</span>
            <select
              value={oppFilter}
              onChange={(e) => setOppFilter(e.target.value)}
              style={{
                height: "44px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #D9D2C0",
                borderRadius: "10px",
                padding: "0 14px",
                fontSize: "14px",
                color: "#2B2D2A",
                outline: "none",
                cursor: "pointer",
                maxWidth: "220px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              <option value="ALL">All Opportunities</option>
              {opportunities.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </select>
          </div>

          {/* Organization Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A", whiteSpace: "nowrap" }}>Organization:</span>
            <select
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              style={{
                height: "44px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #D9D2C0",
                borderRadius: "10px",
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
      </div>

      {/* Applications Data Table */}
      {filteredApplications.length === 0 ? (
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
          <FileText size={40} style={{ color: "#8A6B2E", marginBottom: "12px" }} />
          <h3 style={{ fontSize: "18px", fontFamily: "var(--font-playfair), serif", color: "#2B2D2A", marginBottom: "6px" }}>
            No Applications Found
          </h3>
          <p style={{ color: "#5A584F", fontSize: "14px", margin: 0 }}>
            No talent applications match your filter selection.
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
          <div className="admin-app-table-wrap" style={{ overflowX: "auto" }}>
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
                  <th style={{ padding: "16px 20px" }}>Candidate / Talent</th>
                  <th style={{ padding: "16px 20px" }}>Applied Role</th>
                  <th style={{ padding: "16px 20px" }}>Opportunity &amp; Studio</th>
                  <th style={{ padding: "16px 20px" }}>Applied Date</th>
                  <th style={{ padding: "16px 20px" }}>Status</th>
                  <th style={{ padding: "16px 20px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => {
                  const prof = app.talentProfile || {};
                  const opp = getOpportunityForApp(app.opportunityId);
                  const org = getOrgForOpp(opp);

                  return (
                    <tr
                      key={app.id}
                      style={{
                        borderBottom: "1px solid #E8E2D4",
                        transition: "background-color 0.15s ease",
                      }}
                      className="admin-row-hover"
                    >
                      {/* Candidate */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {prof.avatar ? (
                            <img
                              src={prof.avatar}
                              alt={app.talentName}
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: "1px solid #E8E2D4",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                backgroundColor: "#F3EFE6",
                                color: "#8A6B2E",
                                border: "1px solid #E8E2D4",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "700",
                                fontSize: "14px",
                              }}
                            >
                              {(app.talentName || "T")[0]}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: "#2B2D2A" }}>
                              {app.talentName}
                            </div>
                            <div style={{ fontSize: "12px", color: "#5A584F", marginTop: "2px" }}>
                              {prof.age ? `${prof.age} yrs` : "—"} &bull; {prof.city || "Mumbai"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Applied Role */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontWeight: 600, color: "#6E5420" }}>
                          {app.roleApplied}
                        </div>
                      </td>

                      {/* Opportunity & Studio */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontWeight: 600, color: "#2B2D2A" }}>
                          {opp?.title || "Opportunity"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#5A584F", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                          <Building2 size={12} style={{ color: "#5A584F" }} />
                          <span>{org?.name || "Organization"}</span>
                        </div>
                      </td>

                      {/* Applied Date */}
                      <td style={{ padding: "16px 20px", color: "#5A584F", fontSize: "13px" }}>
                        {formatDate(app.appliedAt)}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "16px 20px" }}>
                        <StatusBadge status={app.status} size="sm" />
                      </td>

                      {/* Action */}
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => setTimelineApp(app)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "13px",
                            padding: "6px 14px",
                            borderRadius: "8px",
                            color: "#8A6B2E",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #8A6B2E",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F3EFE6")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                        >
                          <Eye size={14} />
                          <span>Timeline</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card View (< 768px) */}
          <div className="admin-app-mobile-cards" style={{ padding: "14px", flexDirection: "column", gap: "12px" }}>
            {filteredApplications.map((app) => {
              const prof = app.talentProfile || {};
              const opp = getOpportunityForApp(app.opportunityId);
              const org = getOrgForOpp(opp);

              return (
                <div
                  key={app.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E8E2D4",
                    borderRadius: "14px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {prof.avatar ? (
                        <img
                          src={prof.avatar}
                          alt={app.talentName}
                          style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "1px solid #E8E2D4" }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: "#F3EFE6",
                            color: "#8A6B2E",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "13px",
                            border: "1px solid #E8E2D4",
                          }}
                        >
                          {(app.talentName || "T")[0]}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: "#2B2D2A", fontSize: "14px" }}>{app.talentName}</div>
                        <div style={{ fontSize: "12px", color: "#5A584F" }}>{prof.city || "Mumbai"}</div>
                      </div>
                    </div>
                    <StatusBadge status={app.status} size="xs" />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "13px" }}>
                    <span style={{ color: "#6E5420", fontWeight: 600 }}>{app.roleApplied}</span>
                    <span style={{ color: "#2B2D2A" }}>{opp?.title || "Opportunity"}</span>
                    <span style={{ color: "#5A584F", fontSize: "12px" }}>{org?.name || "Organization"} &bull; {formatDate(app.appliedAt)}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                    <button
                      type="button"
                      onClick={() => setTimelineApp(app)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        padding: "6px 14px",
                        borderRadius: "8px",
                        color: "#8A6B2E",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #8A6B2E",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <Eye size={13} />
                      <span>Audit Trail</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Read-Only Status History Timeline Modal */}
      {timelineApp && (
        <Modal
          isOpen={!!timelineApp}
          onClose={() => setTimelineApp(null)}
          title={`Application Audit Trail: ${timelineApp.talentName}`}
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
                <span style={{ fontSize: "12px", color: "#5A584F", display: "block" }}>Applied Role</span>
                <strong style={{ fontSize: "14px", color: "#2B2D2A" }}>{timelineApp.roleApplied}</strong>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "#5A584F", display: "block" }}>Current Status</span>
                <StatusBadge status={timelineApp.status} size="xs" />
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "#5A584F", display: "block" }}>Opportunity</span>
                <strong style={{ fontSize: "14px", color: "#2B2D2A" }}>
                  {getOpportunityForApp(timelineApp.opportunityId)?.title || "Opportunity"}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "#5A584F", display: "block" }}>Applied On</span>
                <strong style={{ fontSize: "14px", color: "#2B2D2A" }}>{formatDate(timelineApp.appliedAt)}</strong>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#2B2D2A", marginBottom: "12px" }}>
                Status History Timeline
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {(timelineApp.history || []).map((h, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        backgroundColor: idx === timelineApp.history.length - 1 ? "#8A6B2E" : "#D9D2C0",
                        boxShadow: idx === timelineApp.history.length - 1 ? "0 0 8px rgba(138, 107, 46, 0.4)" : "none",
                        marginTop: "5px",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <strong style={{ fontSize: "14px", color: "#2B2D2A" }}>{h.status}</strong>
                        <span style={{ fontSize: "12px", color: "#5A584F" }}>{formatDate(h.timestamp)}</span>
                      </div>
                      <p style={{ fontSize: "13px", color: "#5A584F", margin: 0 }}>
                        {h.note}
                      </p>
                      {h.changedBy && (
                        <span style={{ fontSize: "11px", color: "#5A584F" }}>
                          Updated By: {h.changedBy}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#F3EFE6",
                border: "1px solid #E8E2D4",
                borderRadius: "12px",
                padding: "12px",
                fontSize: "12px",
                color: "#6E5420",
              }}
            >
              Note: Screening, shortlisting, and final selections are handled directly by the hiring organization.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setTimelineApp(null)}
                style={{
                  padding: "0 22px",
                  height: "40px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  backgroundColor: "#8A6B2E",
                  color: "#FFFFFF",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Close Timeline
              </button>
            </div>
          </div>
        </Modal>
      )}

      <style jsx global>{`
        .admin-row-hover:hover {
          background-color: #FAF9F7 !important;
        }
      `}</style>
    </div>
  );
}
