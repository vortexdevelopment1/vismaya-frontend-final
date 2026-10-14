"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Building2,
  Calendar,
  Layers,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Megaphone,
  Users,
} from "lucide-react";
import { useWorkflow } from "@/lib/shared/workflowStore";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import Modal from "@/components/shared/Modal";

export default function AdminProjectsPage() {
  const {
    projects = [],
    opportunities = [],
    organizations = [],
    applications = [],
    isHydrated,
  } = useWorkflow();

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [orgFilter, setOrgFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Read-only Drawer/Modal state
  const [selectedProject, setSelectedProject] = useState(null);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((proj) => {
      // Status
      if (statusFilter !== "ALL" && proj.status !== statusFilter) {
        return false;
      }

      // Organization
      if (orgFilter !== "ALL" && proj.orgId !== orgFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const org = organizations.find((o) => o.id === proj.orgId);
        const match =
          (proj.title || "").toLowerCase().includes(q) ||
          (proj.type || "").toLowerCase().includes(q) ||
          (org?.name || "").toLowerCase().includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [projects, statusFilter, orgFilter, searchQuery, organizations]);

  const getOpportunitiesForProject = (projId) => {
    return opportunities.filter((o) => o.projectId === projId);
  };

  const getOrgForProject = (orgId) => {
    return organizations.find((o) => o.id === orgId);
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "—";
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (!isHydrated) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ height: "48px", background: "#F3EFE6", borderRadius: "12px", width: "40%" }} />
        <div style={{ height: "350px", background: "#FFFFFF", border: "1px solid #E8E2D4", borderRadius: "16px" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Page Header */}
      <PageHeader
        title="Projects Directory"
        subtitle="Overview of production titles, web series, TVCs, and feature films across accredited organizations."
        badge={`${projects.length} Total Projects`}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Projects" },
        ]}
      />

      {/* Filter and Search Bar Card */}
      <div
        className="admin-projects-filter-card"
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
          className="admin-projects-search-wrap"
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
            placeholder="Search project title, format, studio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-projects-search-input"
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

        <div className="admin-projects-selects-group" style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          {/* Status Filter */}
          <div className="admin-projects-select-item" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A", whiteSpace: "nowrap" }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-projects-select"
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
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Org Filter */}
          <div className="admin-projects-select-item" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A", whiteSpace: "nowrap" }}>Organization:</span>
            <select
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              className="admin-projects-select"
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
      </div>

      {/* Projects Table */}
      {filteredProjects.length === 0 ? (
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
          <FolderKanban size={40} style={{ color: "#8A6B2E", marginBottom: "12px" }} />
          <h3 style={{ fontSize: "18px", fontFamily: "var(--font-playfair), serif", color: "#2B2D2A", marginBottom: "6px" }}>
            No Projects Found
          </h3>
          <p style={{ color: "#5A584F", fontSize: "14px", margin: 0 }}>
            No projects match your filter selection.
          </p>
        </div>
      ) : (
        <>
          <div
            className="admin-projects-desktop-table"
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
                    <th style={{ padding: "16px 20px" }}>Project Name &amp; Format</th>
                    <th style={{ padding: "16px 20px" }}>Organization</th>
                    <th style={{ padding: "16px 20px" }}>Opportunities Linked</th>
                    <th style={{ padding: "16px 20px" }}>Created Date</th>
                    <th style={{ padding: "16px 20px" }}>Status</th>
                    <th style={{ padding: "16px 20px", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((proj) => {
                    const org = getOrgForProject(proj.orgId);
                    const opps = getOpportunitiesForProject(proj.id);

                    return (
                      <tr
                        key={proj.id}
                        style={{
                          borderBottom: "1px solid #E8E2D4",
                          transition: "background-color 0.15s ease",
                        }}
                      >
                        {/* Project Title & Format */}
                        <td style={{ padding: "18px 20px" }}>
                          <div style={{ fontWeight: 600, fontSize: "15px", color: "#2B2D2A" }}>
                            {proj.title}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6E5420", fontWeight: "600", marginTop: "2px" }}>
                            {proj.type}
                          </div>
                        </td>

                        {/* Organization */}
                        <td style={{ padding: "18px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Building2 size={13} style={{ color: "#5A584F" }} />
                            <span style={{ fontWeight: 600, color: "#2B2D2A" }}>
                              {org?.name || "Zee Films"}
                            </span>
                          </div>
                          <div style={{ fontSize: "12px", color: "#5A584F", marginTop: "2px" }}>
                            {org?.type || "Production House"}
                          </div>
                        </td>

                        {/* Opportunities Linked */}
                        <td style={{ padding: "18px 20px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 10px",
                              borderRadius: "999px",
                              backgroundColor: opps.length > 0 ? "rgba(138, 107, 46, 0.12)" : "#F3EFE6",
                              color: opps.length > 0 ? "#6E5420" : "#5A584F",
                              border: opps.length > 0 ? "1px solid rgba(138, 107, 46, 0.25)" : "1px solid #E8E2D4",
                              fontWeight: 700,
                              fontSize: "12px",
                            }}
                          >
                            <Megaphone size={12} />
                            <span>{opps.length} {opps.length === 1 ? "Opportunity" : "Opportunities"}</span>
                          </span>
                        </td>

                        {/* Created Date */}
                        <td style={{ padding: "18px 20px", color: "#5A584F", fontSize: "13px" }}>
                          {formatDate(proj.createdAt)}
                        </td>

                        {/* Status */}
                        <td style={{ padding: "18px 20px" }}>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
                              padding: "4px 10px",
                              borderRadius: "999px",
                              backgroundColor: "#F3EFE6",
                              color: "#2B2D2A",
                              border: "1px solid #E8E2D4",
                            }}
                          >
                            {proj.status}
                          </span>
                        </td>

                        {/* Action */}
                        <td style={{ padding: "18px 20px", textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => setSelectedProject(proj)}
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
                            <span>Drawer</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Stacked Cards (< 768px) */}
          <div className="admin-projects-mobile-cards">
            {filteredProjects.map((proj) => {
              const org = getOrgForProject(proj.orgId);
              const opps = getOpportunitiesForProject(proj.id);

              return (
                <div key={proj.id} className="admin-project-mobile-card">
                  <div className="admin-project-card-top">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <strong className="admin-project-title">
                        {proj.title}
                      </strong>
                      <div className="admin-project-format">
                        {proj.type}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: "999px",
                        backgroundColor: "#F3EFE6",
                        color: "#2B2D2A",
                        border: "1px solid #E8E2D4",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {proj.status}
                    </span>
                  </div>

                  <div className="admin-project-org-row">
                    <Building2 size={13} style={{ color: "#8A6B2E", flexShrink: 0 }} />
                    <span className="admin-project-org-name">
                      {org?.name || "Zee Films"}
                    </span>
                    <span className="admin-project-org-type">
                      • {org?.type || "Production House"}
                    </span>
                  </div>

                  <div className="admin-project-details-grid">
                    <div className="admin-project-detail-item">
                      <span className="admin-project-detail-label">Opportunities</span>
                      <span className="admin-project-opps-chip">
                        <Megaphone size={11} />
                        <span>{opps.length} {opps.length === 1 ? "Role" : "Roles"}</span>
                      </span>
                    </div>

                    <div className="admin-project-detail-item">
                      <span className="admin-project-detail-label">Created Date</span>
                      <span className="admin-project-detail-val">
                        {formatDate(proj.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="admin-project-card-actions">
                    <button
                      type="button"
                      onClick={() => setSelectedProject(proj)}
                      className="admin-project-view-btn"
                    >
                      <Eye size={14} />
                      <span>View Project Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Read-Only Project Drawer Modal */}
      {selectedProject && (
        <Modal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          title={`Project Overview: ${selectedProject.title}`}
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
                  {getOrgForProject(selectedProject.orgId)?.name || "Zee Films"}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "#5A584F", display: "block" }}>Format / Type</span>
                <strong style={{ fontSize: "14px", color: "#2B2D2A" }}>{selectedProject.type}</strong>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "#5A584F", display: "block" }}>Project Status</span>
                <strong style={{ fontSize: "14px", color: "#2B2D2A" }}>{selectedProject.status}</strong>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "#5A584F", display: "block" }}>Registered Date</span>
                <strong style={{ fontSize: "14px", color: "#2B2D2A" }}>{formatDate(selectedProject.createdAt)}</strong>
              </div>
            </div>

            <div>
              <strong style={{ fontSize: "14px", color: "#2B2D2A", display: "block", marginBottom: "6px" }}>
                Synopsis &amp; Production Scope:
              </strong>
              <p style={{ fontSize: "14px", color: "#5A584F", margin: 0, lineHeight: 1.6 }}>
                {selectedProject.description || "Comprehensive multi-episode OTT thriller with high-stakes medical emergency and investigative storylines."}
              </p>
            </div>

            <div>
              <strong style={{ fontSize: "14px", color: "#2B2D2A", display: "block", marginBottom: "8px" }}>
                Opportunities Created Under This Project:
              </strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {getOpportunitiesForProject(selectedProject.id).length === 0 ? (
                  <span style={{ fontSize: "13px", color: "#5A584F" }}>
                    No opportunities posted under this project yet.
                  </span>
                ) : (
                  getOpportunitiesForProject(selectedProject.id).map((opp) => {
                    const apps = applications.filter((a) => a.opportunityId === opp.id);
                    return (
                      <div
                        key={opp.id}
                        style={{
                          backgroundColor: "#FAF9F7",
                          border: "1px solid #E8E2D4",
                          borderRadius: "10px",
                          padding: "12px 14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "10px",
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: "14px", color: "#2B2D2A", display: "block" }}>
                            {opp.title}
                          </strong>
                          <span style={{ fontSize: "12px", color: "#5A584F" }}>
                            {apps.length} applicants &bull; Deadline: {opp.deadline}
                          </span>
                        </div>
                        <StatusBadge status={opp.status} size="xs" />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
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
                Close Drawer
              </button>
            </div>
          </div>
        </Modal>
      )}

      <style jsx>{`
        .admin-projects-mobile-cards {
          display: none;
        }

        @media (max-width: 640px) {
          .admin-projects-desktop-table {
            display: none !important;
          }
          .admin-projects-mobile-cards {
            display: flex !important;
            flex-direction: column !important;
            gap: 10px !important;
            width: 100% !important;
          }
          .admin-projects-filter-card {
            padding: 12px !important;
            gap: 10px !important;
            border-radius: 14px !important;
          }
          .admin-projects-search-wrap {
            flex: 1 1 100% !important;
            width: 100% !important;
            height: 40px !important;
          }
          .admin-projects-search-input {
            font-size: 16px !important;
          }
          .admin-projects-selects-group {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            width: 100% !important;
          }
          .admin-projects-select-item {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 4px !important;
            width: 100% !important;
          }
          .admin-projects-select-item span {
            font-size: 11px !important;
          }
          .admin-projects-select {
            width: 100% !important;
            height: 40px !important;
            font-size: 16px !important;
          }

          /* Mobile Cards */
          .admin-project-mobile-card {
            background-color: #FFFFFF;
            border: 1px solid #E8E2D4;
            border-radius: 14px;
            padding: 14px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            box-shadow: 0 4px 14px rgba(43, 45, 42, 0.04);
            box-sizing: border-box;
            width: 100%;
          }
          .admin-project-card-top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 10px;
          }
          .admin-project-title {
            font-family: var(--font-heading), 'Playfair Display', Georgia, serif;
            font-size: 15px;
            font-weight: 600;
            color: #2B2D2A;
            line-height: 1.25;
            display: block;
          }
          .admin-project-format {
            font-size: 11px;
            color: #6E5420;
            font-weight: 600;
            margin-top: 2px;
          }
          .admin-project-org-row {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #5A584F;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .admin-project-org-name {
            font-weight: 600;
            color: #2B2D2A;
          }
          .admin-project-org-type {
            color: #5A584F;
          }
          .admin-project-details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            background: #FAF9F7;
            border: 1px solid #E8E2D4;
            border-radius: 10px;
            padding: 10px;
          }
          .admin-project-detail-item {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
          }
          .admin-project-detail-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #5A584F;
            font-weight: 600;
          }
          .admin-project-detail-val {
            font-size: 12.5px;
            font-weight: 600;
            color: #2B2D2A;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .admin-project-opps-chip {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 11.5px;
            font-weight: 600;
            color: #6E5420;
          }
          .admin-project-card-actions {
            margin-top: 2px;
          }
          .admin-project-view-btn {
            width: 100%;
            height: 36px;
            border-radius: 8px;
            background-color: #FFFFFF;
            border: 1px solid #E8E2D4;
            color: #8A6B2E;
            font-size: 12.5px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            cursor: pointer;
            transition: all 0.16s ease;
          }
          .admin-project-view-btn:hover {
            background-color: #F3EFE6;
          }
        }
      `}</style>
    </div>
  );
}
