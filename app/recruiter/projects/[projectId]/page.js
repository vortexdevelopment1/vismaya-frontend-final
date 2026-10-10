"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  FolderKanban,
  ArrowLeft,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  MapPin,
  DollarSign,
  Layers,
  Users,
  Eye,
  Edit,
  ArrowRight,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import Modal from "@/components/shared/Modal";
import { useWorkflow } from "@/lib/shared/workflowStore";

export default function ProjectDetailsPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { projectId } = params;

  const {
    projects,
    opportunities,
    applications,
    markProjectCompleted,
  } = useWorkflow();

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeError, setCompleteError] = useState("");

  const project = projects.find((p) => p.id === projectId);
  const projOpportunities = opportunities.filter((o) => o.projectId === projectId);

  if (!project) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <Link
          href="/recruiter/projects"
          className="btn-ghost"
          style={{ width: "fit-content", fontSize: "0.85rem", gap: "6px" }}
        >
          <ArrowLeft size={16} /> Back to Projects
        </Link>
        <EmptyState
          title="Project not found"
          description="The requested casting project does not exist or has been removed."
          actionLabel="View All Projects"
          actionHref="/recruiter/projects"
        />
      </div>
    );
  }

  // Check if project has open opportunities
  const openOpportunities = projOpportunities.filter(
    (o) =>
      o.status === "Published" ||
      o.status === "Submitted" ||
      o.status === "Changes Requested" ||
      o.status === "Draft" ||
      o.status === "Cancel Requested"
  );
  const canComplete = openOpportunities.length === 0 && project.status !== "Completed";

  const handleConfirmComplete = () => {
    if (!canComplete) {
      setCompleteError(
        `Cannot complete project while ${openOpportunities.length} opportunities are still active or in review. Please close or cancel them first.`
      );
      return;
    }
    markProjectCompleted(projectId);
    setShowCompleteModal(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Back Link */}
      <Link
        href="/recruiter/projects"
        className="btn-ghost"
        style={{ width: "fit-content", fontSize: "0.825rem", gap: "6px", color: "var(--text-secondary)" }}
      >
        <ArrowLeft size={15} />
        <span>Back to Projects</span>
      </Link>

      {/* Page Header */}
      <PageHeader
        title={project.title}
        subtitle={project.description || "Casting production container"}
        badge={`${project.type} • ${project.status}`}
        action={
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {project.status !== "Completed" && (
              <button
                type="button"
                onClick={() => {
                  setCompleteError("");
                  setShowCompleteModal(true);
                }}
                className="btn-secondary"
                style={{ fontSize: "0.85rem", padding: "8px 18px", gap: "6px" }}
              >
                <CheckCircle2 size={15} />
                <span>Mark Project Completed</span>
              </button>
            )}

            <Link
              href={`/recruiter/opportunities/new?projectId=${project.id}`}
              className="btn-primary"
              style={{ fontSize: "0.85rem", padding: "8px 20px", gap: "6px" }}
            >
              <PlusCircle size={15} />
              <span>Add Opportunity</span>
            </Link>
          </div>
        }
      />

      {/* Project Metadata Overview Card */}
      <div
        className="card-surface"
        style={{
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <span style={{ fontSize: "0.725rem", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: 700 }}>
              Project ID
            </span>
            <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)", }}>
              {project.id}
            </span>
          </div>

          <div style={{ width: "1px", height: "30px", backgroundColor: "var(--border-color)" }} />

          <div>
            <span style={{ fontSize: "0.725rem", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: 700 }}>
              Created Date
            </span>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
              {new Date(project.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div style={{ width: "1px", height: "30px", backgroundColor: "var(--border-color)" }} />

          <div>
            <span style={{ fontSize: "0.725rem", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: 700 }}>
              Opportunities Count
            </span>
            <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--gold)" }}>
              {projOpportunities.length} Total ({projOpportunities.filter((o) => o.status === "Published").length} Live)
            </span>
          </div>
        </div>

        <StatusBadge status={project.status === "Active" ? "Active" : "Approved"} label={project.status} />
      </div>

      {/* 2-Column Section: Opportunities (2fr) + Summary & Actions (1fr) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
          gap: "24px",
          alignItems: "start",
          width: "100%",
        }}
        className="project-details-grid"
      >
        {/* Left Column: Opportunities List (2fr) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: "0 0 4px 0",
                }}
              >
                Project Opportunities ({projOpportunities.length})
              </h2>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
                Character roles and casting briefs grouped under this project
              </p>
            </div>
          </div>

          {projOpportunities.length === 0 ? (
            <EmptyState
              title="No opportunities added yet"
              description="Create and submit character requirements for this project to start receiving verified talent applications."
              icon={Layers}
              actionLabel="Add First Opportunity"
              actionHref={`/recruiter/opportunities/new?projectId=${project.id}`}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {projOpportunities.map((opp) => {
                const oppApps = applications.filter((a) => a.opportunityId === opp.id);
                const isLive = opp.status === "Published";

                return (
                  <div
                    key={opp.id}
                    className="card-surface"
                    style={{
                      padding: "20px 24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "16px",
                      borderRadius: "16px",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(255, 188, 0, 0.12)",
                            color: "var(--gold)",
                            border: "1px solid rgba(255, 188, 0, 0.25)",
                          }}
                        >
                          {opp.opportunityType}
                        </span>
                        <StatusBadge status={opp.status} size="sm" />
                        {isLive && (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            • Closes on <strong style={{ color: "var(--text-primary)" }}>{opp.deadline}</strong>
                          </span>
                        )}
                      </div>

                      <h3
                        style={{
                          fontSize: "1.05rem",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          margin: 0,
                        }}
                      >
                        {opp.title}
                      </h3>

                      <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "0.785rem", color: "var(--text-secondary)", flexWrap: "wrap" }}>
                        <span>Location: <strong>{opp.location}</strong></span>
                        <span>Remuneration: <strong>{opp.remuneration}</strong></span>
                        <span>Roles: <strong>{opp.roles?.length || 1}</strong></span>
                        <span>Applicants: <strong style={{ color: "var(--gold)" }}>{oppApps.length}</strong></span>
                      </div>

                      {opp.adminNote && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            backgroundColor: opp.status === "Changes Requested" ? "rgba(251, 191, 36, 0.1)" : "rgba(255, 255, 255, 0.04)",
                            border: `1px solid ${opp.status === "Changes Requested" ? "rgba(251, 191, 36, 0.3)" : "rgba(255, 255, 255, 0.1)"}`,
                            color: opp.status === "Changes Requested" ? "var(--gold)" : "var(--text-secondary)",
                          }}
                        >
                          <strong>Vismaya Note: </strong>{opp.adminNote}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                      <Link
                        href={`/recruiter/opportunities/${opp.id}/applicants`}
                        className="btn-primary"
                        style={{
                          padding: "0 16px",
                          fontSize: "13px",
                          fontWeight: "600",
                          borderRadius: "10px",
                          gap: "6px",
                          height: "36px",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                        }}
                      >
                        <Users size={14} />
                        <span>View Applicants ({oppApps.length})</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Project Summary & Actions (1fr) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", minWidth: 0 }}>
          {/* Summary Card */}
          <div
            className="card-surface"
            style={{
              padding: "24px",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "#eceaf5", margin: 0 }}>
              Production summary
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#a3acc2" }}>
                <span>Production type</span>
                <strong style={{ color: "#eceaf5" }}>{project.type}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#a3acc2" }}>
                <span>Total briefs posted</span>
                <strong style={{ color: "#eceaf5" }}>{projOpportunities.length}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#a3acc2" }}>
                <span>Active live briefs</span>
                <strong style={{ color: "var(--gold)" }}>
                  {projOpportunities.filter((o) => o.status === "Published").length}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#a3acc2" }}>
                <span>Total applicants</span>
                <strong style={{ color: "#34d399" }}>
                  {applications.filter((a) => projOpportunities.some((o) => o.id === a.opportunityId)).length}
                </strong>
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid rgba(255, 255, 255, 0.08)", margin: "4px 0" }} />

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link
                href={`/recruiter/opportunities/new?projectId=${project.id}`}
                className="btn-primary"
                style={{
                  height: "36px",
                  fontSize: "13px",
                  fontWeight: "600",
                  borderRadius: "10px",
                  width: "100%",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <PlusCircle size={15} />
                <span>Add opportunity</span>
              </Link>

              {project.status !== "Completed" && (
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(true)}
                  className="btn-secondary"
                  style={{
                    height: "36px",
                    fontSize: "13px",
                    fontWeight: "600",
                    borderRadius: "10px",
                    width: "100%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <CheckCircle2 size={15} style={{ color: "#34d399" }} />
                  <span>Mark project completed</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mark Project Completed Modal */}
      {showCompleteModal && (
        <Modal
          isOpen={showCompleteModal}
          onClose={() => setShowCompleteModal(false)}
          title="Mark Project as Completed"
          subtitle="Finalize this casting project and archive all associated production records."
          maxWidth="500px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {completeError ? (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  backgroundColor: "var(--danger-bg)",
                  border: "1px solid var(--danger-border)",
                  color: "var(--danger)",
                  fontSize: "0.85rem",
                  lineHeight: 1.5,
                }}
              >
                {completeError}
              </div>
            ) : (
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                Are you sure you want to mark <strong style={{ color: "var(--text-primary)" }}>"{project.title}"</strong> as Completed?
                All {projOpportunities.length} opportunities under this project will be archived.
              </p>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="btn-secondary"
                style={{ padding: "8px 16px", fontSize: "0.85rem" }}
              >
                Cancel
              </button>
              {canComplete && (
                <button
                  type="button"
                  onClick={handleConfirmComplete}
                  className="btn-primary"
                  style={{ padding: "8px 20px", fontSize: "0.85rem" }}
                >
                  Confirm Completion
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      <style jsx>{`
        @media (max-width: 1023.98px) {
          .project-details-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
