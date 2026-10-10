"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Plus,
  ArrowRight,
  Film,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import Modal from "@/components/shared/Modal";
import { useWorkflow } from "@/lib/shared/workflowStore";

const PROJECT_TYPES = [
  "OTT Series",
  "Feature Film",
  "Commercial / TVC",
  "Short Film",
  "Music Video",
  "Theater",
  "Documentary",
  "Print / Editorial",
  "Other",
];

export default function OrganizationProjectsPage() {
  const { projects, opportunities, createProject } = useWorkflow();
  const orgId = "org-1";

  const orgProjects = projects.filter((p) => p.orgId === orgId);

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("OTT Series");
  const [newDesc, setNewDesc] = useState("");
  const [formError, setFormError] = useState("");

  const filteredProjects = orgProjects.filter((p) => {
    const matchesFilter =
      activeFilter === "all" ? true : p.status.toLowerCase() === activeFilter.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormError("Project title is required.");
      return;
    }

    createProject({
      orgId,
      title: newTitle.trim(),
      type: newType,
      description: newDesc.trim(),
    });

    setNewTitle("");
    setNewType("OTT Series");
    setNewDesc("");
    setFormError("");
    setShowNewProjectModal(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Page Header */}
      <PageHeader
        title="Projects Management"
        subtitle="Organize casting productions, manage multi-role opportunities, and track project timelines."
        badge={`${orgProjects.length} Projects Total`}
        action={
          <button
            type="button"
            onClick={() => setShowNewProjectModal(true)}
            className="btn-primary"
            style={{ fontSize: "0.85rem", padding: "8px 20px", gap: "6px" }}
          >
            <Plus size={16} />
            <span>New Project</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div
        className="card-surface"
        style={{
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {/* Status Filter Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {["all", "active", "completed"].map((tab) => {
            const isActive = activeFilter === tab;
            const count =
              tab === "all"
                ? orgProjects.length
                : orgProjects.filter((p) => p.status.toLowerCase() === tab).length;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "12px",
                  backgroundColor: isActive ? "var(--gold)" : "rgba(255, 255, 255, 0.06)",
                  color: isActive ? "#1a1300" : "var(--text-secondary)",
                  border: `1px solid ${isActive ? "var(--gold)" : "rgba(255, 255, 255, 0.12)"}`,
                  fontSize: "0.8rem",
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  textTransform: "capitalize",
                }}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", flex: "1 1 200px", maxWidth: "280px" }}>
          <Search size={15} style={{ position: "absolute", left: "12px", color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "8px 14px 8px 34px",
              borderRadius: "12px",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              color: "var(--text-primary)",
              fontSize: "0.825rem",
              width: "100%",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description={searchTerm ? `No projects matching "${searchTerm}"` : "Create your first casting production project to begin posting verified opportunities."}
          icon={FolderKanban}
          actionLabel="Create Project"
          onAction={() => setShowNewProjectModal(true)}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "20px",
            width: "100%",
          }}
          className="projects-grid"
        >
          {filteredProjects.map((project) => {
            const projOpps = opportunities.filter((o) => o.projectId === project.id);
            const liveOppsCount = projOpps.filter((o) => o.status === "Published").length;
            const isCompleted = project.status === "Completed";

            return (
              <div
                key={project.id}
                className="card-surface"
                style={{
                  padding: "22px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "16px",
                  opacity: isCompleted ? 0.85 : 1,
                  borderRadius: "16px",
                  border: "1px solid var(--border-glass)",
                }}
              >
                {/* Top Row: Type Tag & Status Badge */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span
                    style={{
                      fontSize: "0.725rem",
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 188, 0, 0.12)",
                      color: "var(--gold)",
                      border: "1px solid rgba(255, 188, 0, 0.25)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {project.type}
                  </span>

                  <StatusBadge status={project.status === "Active" ? "Active" : "Approved"} label={project.status} size="sm" />
                </div>

                {/* Project Title & Description */}
                <div>
                  <h3
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      margin: "0 0 6px 0",
                    }}
                  >
                    {project.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.825rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {project.description || "No description provided."}
                  </p>
                </div>

                {/* Meta Counts Strip */}
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "0.785rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Layers size={14} style={{ color: "var(--gold)" }} />
                    <span>
                      <strong style={{ color: "var(--text-primary)" }}>{projOpps.length}</strong> Opportunities
                    </span>
                  </div>

                  <span style={{ color: liveOppsCount > 0 ? "var(--success)" : "var(--text-muted)", fontWeight: 600 }}>
                    {liveOppsCount} Published Live
                  </span>
                </div>

                {/* Action Link to Details */}
                <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.725rem", color: "var(--text-muted)" }}>
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </span>

                  <Link
                    href={`/recruiter/projects/${project.id}`}
                    className="btn-secondary"
                    style={{
                      padding: "6px 14px",
                      fontSize: "0.8rem",
                      borderRadius: "12px",
                      gap: "6px",
                    }}
                  >
                    <span>View Project</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <Modal
          isOpen={showNewProjectModal}
          onClose={() => setShowNewProjectModal(false)}
          title="Create New Project"
          subtitle="Define a casting project container to organize character opportunities and submissions."
          maxWidth="540px"
        >
          <form onSubmit={handleCreateProject} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {formError && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(255, 107, 107, 0.12)",
                  border: "1px solid rgba(255, 107, 107, 0.35)",
                  color: "var(--danger)",
                  fontSize: "0.8rem",
                }}
              >
                {formError}
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Project Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Mumbai Diaries Season 3 or Urban Melodies TVC"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: "0.875rem",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  borderRadius: "12px",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Production Type
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: "0.875rem",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  borderRadius: "12px",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t} style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Project Synopsis & Description
              </label>
              <textarea
                rows={4}
                placeholder="Briefly describe the story background, director, production scale, or target audience..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: "0.875rem",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  borderRadius: "12px",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setShowNewProjectModal(false)}
                className="btn-secondary"
                style={{ padding: "8px 16px", fontSize: "0.85rem", borderRadius: "12px" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: "8px 20px", fontSize: "0.85rem", borderRadius: "12px" }}
              >
                Create Project
              </button>
            </div>
          </form>
        </Modal>
      )}

      <style jsx>{`
        @media (max-width: 1023.98px) {
          .projects-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 599.98px) {
          .projects-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
