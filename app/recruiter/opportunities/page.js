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
  AlertTriangle,
  Clock,
  Calendar,
  Layers,
  Filter,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
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
      statusFilter === "All" ? true : opp.status.toLowerCase() === statusFilter.toLowerCase();
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Page Header */}
      <PageHeader
        title="My Opportunities"
        subtitle="Manage casting requirements, view application inflows, and coordinate Vismaya moderation status."
        badge={`${orgOpportunities.length} Total Opportunities`}
        action={
          <Link
            href="/recruiter/opportunities/new"
            className="btn-primary"
            style={{ fontSize: "0.85rem", padding: "8px 20px", gap: "6px" }}
          >
            <PlusCircle size={15} />
            <span>Post Opportunity</span>
          </Link>
        }
      />

      {/* Toolbar: Search and Filter */}
      <div
        className="card-surface"
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Status Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "6px 14px",
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                color: "var(--text-primary)",
                fontSize: "0.8rem",
                fontWeight: 600,
                outline: "none",
                cursor: "pointer",
              }}
            >
              {STATUS_FILTERS.map((st) => (
                <option key={st} value={st} style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", flex: "1 1 200px", maxWidth: "280px" }}>
          <Search size={15} style={{ position: "absolute", left: "12px", color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search by title, project..."
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

      {/* Opportunities Table Card */}
      <div
        className="card-surface"
        style={{
          overflow: "hidden",
          borderRadius: "16px",
        }}
      >
        {filteredOpportunities.length === 0 ? (
          <div style={{ padding: "32px 20px" }}>
            <EmptyState
              title="No opportunities found"
              description={searchTerm || statusFilter !== "All" ? "No records matching your search filters." : "Create your first opportunity to start receiving verified talent submissions."}
              icon={Briefcase}
              actionLabel="Post Opportunity"
              actionHref="/recruiter/opportunities/new"
            />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div style={{ overflowX: "auto" }} className="desktop-opps-table">
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontSize: "0.85rem",
                }}
              >
                <thead style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#0d1424" }}>
                  <tr
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                    }}
                  >
                    <th style={{ padding: "12px 18px", fontWeight: 700, color: "#a3acc2", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Opportunity & Project
                    </th>
                    <th style={{ padding: "12px 18px", fontWeight: 700, color: "#a3acc2", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Category
                    </th>
                    <th style={{ padding: "12px 18px", fontWeight: 700, color: "#a3acc2", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Deadline & Schedule
                    </th>
                    <th style={{ padding: "12px 18px", fontWeight: 700, color: "#a3acc2", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Applicants
                    </th>
                    <th style={{ padding: "12px 18px", fontWeight: 700, color: "#a3acc2", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Status
                    </th>
                    <th style={{ padding: "12px 18px", fontWeight: 700, color: "#a3acc2", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "right" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOpportunities.map((opp, idx) => {
                    const proj = projects.find((p) => p.id === opp.projectId);
                    const oppApps = applications.filter((a) => a.opportunityId === opp.id);
                    const canEdit = opp.status === "Draft" || opp.status === "Changes Requested";
                    const canRequestCancel = opp.status === "Published" || opp.status === "Submitted";
                    const canMarkCompleted = opp.status === "Published" || opp.status === "Closed";

                    return (
                      <tr
                        key={opp.id}
                        style={{
                          borderBottom: idx === filteredOpportunities.length - 1 ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
                          transition: "background-color 0.15s ease",
                        }}
                        className="table-row-hover"
                      >
                        {/* Title & Project Link */}
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <Link
                              href={`/recruiter/opportunities/${opp.id}/applicants`}
                              style={{
                                fontSize: "0.9rem",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                textDecoration: "none",
                              }}
                            >
                              {opp.title}
                            </Link>
                            <Link
                              href={`/recruiter/projects/${opp.projectId}`}
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--text-secondary)",
                                textDecoration: "none",
                              }}
                            >
                              Project: {proj?.title || "Assigned Project"}
                            </Link>

                            {opp.adminNote && (
                              <span
                                style={{
                                  fontSize: "0.725rem",
                                  color: opp.status === "Changes Requested" ? "var(--gold)" : "var(--text-muted)",
                                  marginTop: "2px",
                                }}
                              >
                                <strong>Note: </strong>{opp.adminNote}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td style={{ padding: "14px 18px" }}>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              padding: "3px 8px",
                              borderRadius: "8px",
                              backgroundColor: "rgba(255, 188, 0, 0.12)",
                              color: "var(--gold)",
                              border: "1px solid rgba(255, 188, 0, 0.25)",
                            }}
                          >
                            {opp.opportunityType}
                          </span>
                        </td>

                        {/* Deadline & Notice Line */}
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                              {opp.deadline}
                            </span>
                            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                              Closes automatically on {opp.deadline}
                            </span>
                          </div>
                        </td>

                        {/* Applicants Count */}
                        <td style={{ padding: "14px 18px" }}>
                          <Link
                            href={`/recruiter/opportunities/${opp.id}/applicants`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "3px 10px",
                              borderRadius: "8px",
                              backgroundColor: oppApps.length > 0 ? "rgba(255, 188, 0, 0.12)" : "rgba(255, 255, 255, 0.06)",
                              color: oppApps.length > 0 ? "var(--gold)" : "var(--text-secondary)",
                              fontWeight: 700,
                              fontSize: "0.8rem",
                              textDecoration: "none",
                              border: `1px solid ${oppApps.length > 0 ? "rgba(255, 188, 0, 0.28)" : "rgba(255, 255, 255, 0.12)"}`,
                            }}
                          >
                            <Users size={12} />
                            <span>{oppApps.length}</span>
                          </Link>
                        </td>

                        {/* Status Badge */}
                        <td style={{ padding: "14px 18px" }}>
                          <StatusBadge status={opp.status} size="sm" />
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "14px 18px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <Link
                              href={`/recruiter/opportunities/${opp.id}/applicants`}
                              className="btn-ghost"
                              style={{ padding: "5px 10px", fontSize: "0.785rem", gap: "4px" }}
                              title="View Applicants"
                            >
                              <Eye size={13} />
                              <span>View</span>
                            </Link>

                            {canEdit && (
                              <Link
                                href={`/recruiter/opportunities/new?edit=${opp.id}`}
                                className="btn-secondary"
                                style={{ padding: "5px 10px", fontSize: "0.785rem", gap: "4px" }}
                                title="Edit Opportunity"
                              >
                                <Edit size={13} />
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
                                className="btn-ghost"
                                style={{ padding: "5px 8px", fontSize: "0.785rem", color: "var(--danger)" }}
                                title="Request Cancellation from Vismaya"
                              >
                                <XCircle size={13} />
                                <span>Cancel</span>
                              </button>
                            )}

                            {canMarkCompleted && (
                              <button
                                type="button"
                                onClick={() => setCompleteModalOpp(opp)}
                                className="btn-secondary"
                                style={{ padding: "5px 10px", fontSize: "0.785rem", gap: "4px" }}
                                title="Mark Completed"
                              >
                                <CheckCircle2 size={13} />
                                <span>Complete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Stack View */}
            <div style={{ display: "none", flexDirection: "column", gap: "12px", padding: "14px" }} className="mobile-opps-stack">
              {filteredOpportunities.map((opp) => {
                const proj = projects.find((p) => p.id === opp.projectId);
                const oppApps = applications.filter((a) => a.opportunityId === opp.id);
                const canEdit = opp.status === "Draft" || opp.status === "Changes Requested";
                const canRequestCancel = opp.status === "Published" || opp.status === "Submitted";
                const canMarkCompleted = opp.status === "Published" || opp.status === "Closed";

                return (
                  <div
                    key={`mob-${opp.id}`}
                    style={{
                      padding: "16px",
                      borderRadius: "14px",
                      backgroundColor: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                      <div>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "6px",
                            backgroundColor: "rgba(255, 188, 0, 0.12)",
                            color: "var(--gold)",
                            border: "1px solid rgba(255, 188, 0, 0.25)",
                            display: "inline-block",
                            marginBottom: "4px",
                          }}
                        >
                          {opp.opportunityType}
                        </span>
                        <h4 style={{ margin: "2px 0", fontSize: "0.95rem", fontWeight: 700, color: "#eceaf5" }}>
                          {opp.title}
                        </h4>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          Project: {proj?.title || "Assigned Project"}
                        </span>
                      </div>

                      <StatusBadge status={opp.status} size="sm" />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", borderTop: "1px solid rgba(255, 255, 255, 0.06)", paddingTop: "8px" }}>
                      <span>Deadline: <strong style={{ color: "#eceaf5" }}>{opp.deadline}</strong></span>
                      <Link
                        href={`/recruiter/opportunities/${opp.id}/applicants`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          color: "var(--gold)",
                          fontWeight: 700,
                          textDecoration: "none",
                        }}
                      >
                        <Users size={12} />
                        <span>{oppApps.length} Applicants</span>
                      </Link>
                    </div>

                    {opp.adminNote && (
                      <div style={{ fontSize: "0.725rem", color: opp.status === "Changes Requested" ? "var(--gold)" : "var(--text-muted)", padding: "6px 10px", borderRadius: "8px", backgroundColor: "rgba(255, 255, 255, 0.03)" }}>
                        <strong>Note: </strong>{opp.adminNote}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                      <Link
                        href={`/recruiter/opportunities/${opp.id}/applicants`}
                        className="btn-primary"
                        style={{ flex: 1, padding: "8px 12px", fontSize: "0.8rem", justifyContent: "center", minHeight: "44px" }}
                      >
                        <Eye size={14} /> View Applicants
                      </Link>

                      {canEdit && (
                        <Link
                          href={`/recruiter/opportunities/new?edit=${opp.id}`}
                          className="btn-secondary"
                          style={{ padding: "8px 14px", fontSize: "0.8rem", minHeight: "44px" }}
                        >
                          <Edit size={14} /> Edit
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
                          className="btn-ghost"
                          style={{ padding: "8px 12px", fontSize: "0.8rem", color: "var(--danger)", minHeight: "44px" }}
                        >
                          <XCircle size={14} /> Cancel
                        </button>
                      )}

                      {canMarkCompleted && (
                        <button
                          type="button"
                          onClick={() => setCompleteModalOpp(opp)}
                          className="btn-secondary"
                          style={{ padding: "8px 12px", fontSize: "0.8rem", minHeight: "44px" }}
                        >
                          <CheckCircle2 size={14} /> Complete
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

      <style jsx>{`
        @media (max-width: 767.98px) {
          .desktop-opps-table {
            display: none !important;
          }
          .mobile-opps-stack {
            display: flex !important;
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
          <form onSubmit={handleRequestCancellation} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
              Organizations cannot cancel published opportunities directly. The Vismaya team reviews all cancellation requests to notify active applicants and handle escrow adjustments.
            </p>

            {cancelError && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  backgroundColor: "var(--danger-bg)",
                  border: "1px solid var(--danger-border)",
                  color: "var(--danger)",
                  fontSize: "0.8rem",
                }}
              >
                {cancelError}
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Reason for Cancellation *
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Production shoot rescheduled, script role merged with another character..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", fontSize: "0.85rem" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
              <button
                type="button"
                onClick={() => setCancelModalOpp(null)}
                className="btn-secondary"
                style={{ padding: "8px 16px", fontSize: "0.85rem" }}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: "8px 20px", fontSize: "0.85rem", color: "var(--text-on-primary)" }}
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
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
              Are you sure you want to mark <strong style={{ color: "var(--text-primary)" }}>"{completeModalOpp.title}"</strong> as Completed?
              The opportunity will be locked and archived.
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setCompleteModalOpp(null)}
                className="btn-secondary"
                style={{ padding: "8px 16px", fontSize: "0.85rem" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMarkCompleted}
                className="btn-primary"
                style={{ padding: "8px 20px", fontSize: "0.85rem" }}
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
