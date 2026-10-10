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
        <div style={{ height: "48px", background: "rgba(255, 255, 255, 0.06)", borderRadius: "12px", width: "40%" }} />
        <div style={{ height: "350px", background: "rgba(255, 255, 255, 0.06)", borderRadius: "16px" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Page Header */}
      <PageHeader
        title="Projects Directory"
        subtitle="Overview of production titles, web series, TVCs, and feature films across accredited organizations."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Projects" },
        ]}
      />

      {/* Filter and Search Bar */}
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
            placeholder="Search project title, format, studio..."
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

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* Status Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.825rem", fontWeight: "600", color: "#a3acc2" }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                borderRadius: "12px",
                padding: "8px 12px",
                fontSize: "0.825rem",
                color: "#eceaf5",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="ALL" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>All Statuses</option>
              <option value="Active" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Active</option>
              <option value="Completed" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Completed</option>
            </select>
          </div>

          {/* Org Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.825rem", fontWeight: "600", color: "#a3acc2" }}>Organization:</span>
            <select
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                borderRadius: "12px",
                padding: "8px 12px",
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
      </div>

      {/* Projects Table */}
      {filteredProjects.length === 0 ? (
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
          <FolderKanban size={40} style={{ color: "#ffbc00", marginBottom: "12px" }} />
          <h3 style={{ fontSize: "1.05rem", color: "#eceaf5", marginBottom: "6px" }}>
            No Projects Found
          </h3>
          <p style={{ color: "#a3acc2", fontSize: "0.85rem", margin: 0 }}>
            No projects match your filter selection.
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
                        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      {/* Project Title & Format */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontWeight: "700", color: "#eceaf5" }}>
                          {proj.title}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#ffbc00", fontWeight: "600" }}>
                          {proj.type}
                        </div>
                      </td>

                      {/* Organization */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Building2 size={13} style={{ color: "#7c869e" }} />
                          <span style={{ fontWeight: "600", color: "#eceaf5" }}>
                            {org?.name || "Zee Films"}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#a3acc2" }}>
                          {org?.type || "Production House"}
                        </div>
                      </td>

                      {/* Opportunities Linked */}
                      <td style={{ padding: "16px 20px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 10px",
                            borderRadius: "999px",
                            backgroundColor: opps.length > 0 ? "rgba(255, 188, 0, 0.14)" : "rgba(255, 255, 255, 0.06)",
                            color: opps.length > 0 ? "#ffbc00" : "#7c869e",
                            border: opps.length > 0 ? "1px solid rgba(255, 188, 0, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
                            fontWeight: "700",
                            fontSize: "0.8rem",
                          }}
                        >
                          <Megaphone size={12} />
                          <span>{opps.length} {opps.length === 1 ? "Opportunity" : "Opportunities"}</span>
                        </span>
                      </td>

                      {/* Created Date */}
                      <td style={{ padding: "16px 20px", color: "#a3acc2", fontSize: "0.825rem" }}>
                        {formatDate(proj.createdAt)}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "16px 20px" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: "700",
                            padding: "4px 10px",
                            borderRadius: "999px",
                            backgroundColor: proj.status === "Active" ? "rgba(52, 211, 153, 0.15)" : "rgba(255, 255, 255, 0.06)",
                            color: proj.status === "Active" ? "#34d399" : "#a3acc2",
                            border: proj.status === "Active" ? "1px solid rgba(52, 211, 153, 0.35)" : "1px solid rgba(255, 255, 255, 0.1)",
                          }}
                        >
                          {proj.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => setSelectedProject(proj)}
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
                  {getOrgForProject(selectedProject.orgId)?.name || "Zee Films"}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#7c869e", display: "block" }}>Format / Type</span>
                <strong style={{ fontSize: "0.9rem", color: "#eceaf5" }}>{selectedProject.type}</strong>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#7c869e", display: "block" }}>Project Status</span>
                <strong style={{ fontSize: "0.9rem", color: "#34d399" }}>{selectedProject.status}</strong>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#7c869e", display: "block" }}>Registered Date</span>
                <strong style={{ fontSize: "0.9rem", color: "#eceaf5" }}>{formatDate(selectedProject.createdAt)}</strong>
              </div>
            </div>

            <div>
              <strong style={{ fontSize: "0.85rem", color: "#eceaf5", display: "block", marginBottom: "6px" }}>
                Synopsis &amp; Production Scope:
              </strong>
              <p style={{ fontSize: "0.85rem", color: "#a3acc2", margin: 0, lineHeight: "1.5" }}>
                {selectedProject.description || "Comprehensive multi-episode OTT thriller with high-stakes medical emergency and investigative storylines."}
              </p>
            </div>

            <div>
              <strong style={{ fontSize: "0.85rem", color: "#eceaf5", display: "block", marginBottom: "8px" }}>
                Opportunities Created Under This Project:
              </strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {getOpportunitiesForProject(selectedProject.id).length === 0 ? (
                  <span style={{ fontSize: "0.8rem", color: "#7c869e" }}>
                    No opportunities posted under this project yet.
                  </span>
                ) : (
                  getOpportunitiesForProject(selectedProject.id).map((opp) => {
                    const apps = applications.filter((a) => a.opportunityId === opp.id);
                    return (
                      <div
                        key={opp.id}
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "10px",
                          padding: "12px 14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "10px",
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: "0.85rem", color: "#eceaf5", display: "block" }}>
                            {opp.title}
                          </strong>
                          <span style={{ fontSize: "0.75rem", color: "#a3acc2" }}>
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
                className="btn-primary"
                style={{ padding: "8px 20px", borderRadius: "12px" }}
              >
                Close Drawer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
