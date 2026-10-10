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
        <div style={{ height: "48px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "12px", width: "40%" }} />
        <div style={{ height: "400px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "16px" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Page Header */}
      <PageHeader
        title="Application Pipeline Overview"
        subtitle="Read-only platform pipeline of talent applications across all studio casting opportunities."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Applications" },
        ]}
      />

      {/* Status Tabs */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
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
                padding: "8px 16px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                backgroundColor: isActive ? "var(--gold)" : "rgba(255, 255, 255, 0.06)",
                color: isActive ? "#1a1300" : "#eceaf5",
                border: `1px solid ${isActive ? "var(--gold)" : "rgba(255, 255, 255, 0.14)"}`,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.18s ease",
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  padding: "1px 7px",
                  borderRadius: "999px",
                  fontSize: "10px",
                  fontWeight: "800",
                  backgroundColor: isActive ? "rgba(26, 19, 0, 0.20)" : "rgba(255, 255, 255, 0.12)",
                  color: isActive ? "#1a1300" : "#eceaf5",
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Selectors */}
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
        }}
      >
        <div
          style={{
            flex: "1 1 240px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: "12px",
            padding: "0 14px",
            height: "40px",
          }}
        >
          <Search size={16} style={{ color: "#a3acc2" }} />
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
              color: "#eceaf5",
              width: "100%",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* Opportunity Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#a3acc2" }}>Opportunity:</span>
            <select
              value={oppFilter}
              onChange={(e) => setOppFilter(e.target.value)}
              style={{
                height: "40px",
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                borderRadius: "12px",
                padding: "0 12px",
                fontSize: "13px",
                color: "#eceaf5",
                outline: "none",
                cursor: "pointer",
                maxWidth: "200px",
              }}
            >
              <option value="ALL" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>All Opportunities</option>
              {opportunities.map((o) => (
                <option key={o.id} value={o.id} style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>
                  {o.title}
                </option>
              ))}
            </select>
          </div>

          {/* Organization Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#a3acc2" }}>Organization:</span>
            <select
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              style={{
                height: "40px",
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                borderRadius: "12px",
                padding: "0 12px",
                fontSize: "13px",
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
      </div>

      {/* Applications Data Table */}
      {filteredApplications.length === 0 ? (
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.07)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: "16px",
            padding: "48px 20px",
            textAlign: "center",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <FileText size={40} style={{ color: "#7e89a3", marginBottom: "12px" }} />
          <h3 style={{ fontSize: "18px", color: "#eceaf5", marginBottom: "6px" }}>
            No Applications Found
          </h3>
          <p style={{ color: "#a3acc2", fontSize: "14px", margin: 0 }}>
            No talent applications match your filter selection.
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.07)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <div className="admin-app-table-wrap" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: "#0f1626",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.10)",
                    color: "var(--gold)",
                    fontWeight: "700",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.10em",
                  }}
                >
                  <th style={{ padding: "14px 20px", position: "sticky", top: 0, backgroundColor: "#0f1626" }}>Candidate / Talent</th>
                  <th style={{ padding: "14px 20px", position: "sticky", top: 0, backgroundColor: "#0f1626" }}>Applied Role</th>
                  <th style={{ padding: "14px 20px", position: "sticky", top: 0, backgroundColor: "#0f1626" }}>Opportunity &amp; Studio</th>
                  <th style={{ padding: "14px 20px", position: "sticky", top: 0, backgroundColor: "#0f1626" }}>Applied Date</th>
                  <th style={{ padding: "14px 20px", position: "sticky", top: 0, backgroundColor: "#0f1626" }}>Status</th>
                  <th style={{ padding: "14px 20px", position: "sticky", top: 0, backgroundColor: "#0f1626", textAlign: "right" }}>Action</th>
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
                        height: "48px",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                        transition: "background-color 0.15s ease",
                      }}
                      className="admin-row-hover"
                    >
                      {/* Candidate */}
                      <td style={{ padding: "12px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {prof.avatar ? (
                            <img
                              src={prof.avatar}
                              alt={app.talentName}
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "10px",
                                objectFit: "cover",
                                border: "1px solid rgba(255, 188, 0, 0.3)",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "10px",
                                background: "linear-gradient(135deg, #0f1626 0%, #070b12 100%)",
                                color: "var(--gold)",
                                border: "1px solid rgba(255, 188, 0, 0.3)",
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
                            <div style={{ fontWeight: "600", color: "#eceaf5" }}>
                              {app.talentName}
                            </div>
                            <div style={{ fontSize: "12px", color: "#a3acc2" }}>
                              {prof.age ? `${prof.age} yrs` : "—"} &bull; {prof.city || "Mumbai"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Applied Role */}
                      <td style={{ padding: "12px 20px" }}>
                        <div style={{ fontWeight: "600", color: "var(--gold)" }}>
                          {app.roleApplied}
                        </div>
                      </td>

                      {/* Opportunity & Studio */}
                      <td style={{ padding: "12px 20px" }}>
                        <div style={{ fontWeight: "600", color: "#eceaf5" }}>
                          {opp?.title || "Opportunity"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#a3acc2", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Building2 size={12} style={{ color: "#7e89a3" }} />
                          <span>{org?.name || "Organization"}</span>
                        </div>
                      </td>

                      {/* Applied Date */}
                      <td style={{ padding: "12px 20px", color: "#a3acc2", fontSize: "13px" }}>
                        {formatDate(app.appliedAt)}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "12px 20px" }}>
                        <StatusBadge status={app.status} size="sm" />
                      </td>

                      {/* Action */}
                      <td style={{ padding: "12px 20px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => setTimelineApp(app)}
                          className="btn-secondary"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "13px",
                            padding: "6px 14px",
                            borderRadius: "12px",
                            color: "var(--gold)",
                            borderColor: "rgba(255, 188, 0, 0.3)",
                          }}
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
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "14px",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {prof.avatar ? (
                        <img
                          src={prof.avatar}
                          alt={app.talentName}
                          style={{ width: "36px", height: "36px", borderRadius: "10px", objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            background: "#0f1626",
                            color: "var(--gold)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "700",
                            fontSize: "13px",
                          }}
                        >
                          {(app.talentName || "T")[0]}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: "600", color: "#eceaf5", fontSize: "14px" }}>{app.talentName}</div>
                        <div style={{ fontSize: "11px", color: "#a3acc2" }}>{prof.city || "Mumbai"}</div>
                      </div>
                    </div>
                    <StatusBadge status={app.status} size="xs" />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "13px" }}>
                    <span style={{ color: "var(--gold)", fontWeight: "600" }}>{app.roleApplied}</span>
                    <span style={{ color: "#eceaf5" }}>{opp?.title || "Opportunity"}</span>
                    <span style={{ color: "#7e89a3", fontSize: "11px" }}>{org?.name || "Organization"} &bull; {formatDate(app.appliedAt)}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                    <button
                      type="button"
                      onClick={() => setTimelineApp(app)}
                      className="btn-secondary"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        padding: "6px 14px",
                        borderRadius: "10px",
                        color: "var(--gold)",
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
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "14px",
                padding: "16px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <span style={{ fontSize: "12px", color: "#a3acc2", display: "block" }}>Applied Role</span>
                <strong style={{ fontSize: "14px", color: "#eceaf5" }}>{timelineApp.roleApplied}</strong>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "#a3acc2", display: "block" }}>Current Status</span>
                <StatusBadge status={timelineApp.status} size="xs" />
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "#a3acc2", display: "block" }}>Opportunity</span>
                <strong style={{ fontSize: "14px", color: "#eceaf5" }}>
                  {getOpportunityForApp(timelineApp.opportunityId)?.title || "Opportunity"}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "#a3acc2", display: "block" }}>Applied On</span>
                <strong style={{ fontSize: "14px", color: "#eceaf5" }}>{formatDate(timelineApp.appliedAt)}</strong>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#eceaf5", marginBottom: "12px" }}>
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
                        backgroundColor: idx === timelineApp.history.length - 1 ? "var(--gold)" : "rgba(255, 255, 255, 0.3)",
                        boxShadow: idx === timelineApp.history.length - 1 ? "0 0 8px rgba(255, 188, 0, 0.6)" : "none",
                        marginTop: "5px",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <strong style={{ fontSize: "14px", color: "#eceaf5" }}>{h.status}</strong>
                        <span style={{ fontSize: "12px", color: "#7e89a3" }}>{formatDate(h.timestamp)}</span>
                      </div>
                      <p style={{ fontSize: "13px", color: "#a3acc2", margin: 0 }}>
                        {h.note}
                      </p>
                      {h.changedBy && (
                        <span style={{ fontSize: "11px", color: "#7e89a3" }}>
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
                backgroundColor: "rgba(255, 188, 0, 0.08)",
                border: "1px solid rgba(255, 188, 0, 0.25)",
                borderRadius: "12px",
                padding: "12px",
                fontSize: "12px",
                color: "var(--gold)",
              }}
            >
              Note: Screening, shortlisting, and final selections are handled directly by the hiring organization.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setTimelineApp(null)}
                className="btn-primary"
                style={{ padding: "0 20px", height: "40px", borderRadius: "12px", fontSize: "14px" }}
              >
                Close Timeline
              </button>
            </div>
          </div>
        </Modal>
      )}

      <style jsx global>{`
        .admin-row-hover:hover {
          background-color: rgba(255, 255, 255, 0.04) !important;
        }
      `}</style>
    </div>
  );
}
