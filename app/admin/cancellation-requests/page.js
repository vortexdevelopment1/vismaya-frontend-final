"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  AlertOctagon,
  Building2,
  Calendar,
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Megaphone,
  AlertTriangle,
  X,
} from "lucide-react";
import { useWorkflow } from "@/lib/shared/workflowStore";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import Modal from "@/components/shared/Modal";

export default function AdminCancellationRequestsPage() {
  const {
    cancellationRequests = [],
    opportunities = [],
    organizations = [],
    applications = [],
    adminResolveCancellation,
    isHydrated,
  } = useWorkflow();

  const [statusFilter, setStatusFilter] = useState("Pending"); // Pending | Approved | Declined | ALL
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [approveModalReq, setApproveModalReq] = useState(null);
  const [approveNote, setApproveNote] = useState("");

  const [declineModalReq, setDeclineModalReq] = useState(null);
  const [declineReason, setDeclineReason] = useState("");

  // Status counts
  const statusCounts = useMemo(() => {
    return {
      ALL: cancellationRequests.length,
      Pending: cancellationRequests.filter((r) => r.status === "Pending").length,
      Approved: cancellationRequests.filter((r) => r.status === "Approved").length,
      Declined: cancellationRequests.filter((r) => r.status === "Declined").length,
    };
  }, [cancellationRequests]);

  // Tab definitions
  const tabs = [
    { key: "Pending", label: "Pending Review", count: statusCounts.Pending },
    { key: "Approved", label: "Approved Cancellations", count: statusCounts.Approved },
    { key: "Declined", label: "Declined Requests", count: statusCounts.Declined },
    { key: "ALL", label: "All Requests", count: statusCounts.ALL },
  ];

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return cancellationRequests.filter((req) => {
      // Status filter
      if (statusFilter !== "ALL" && req.status !== statusFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const opp = opportunities.find((o) => o.id === req.opportunityId);
        const org = organizations.find((o) => o.id === req.orgId);

        const match =
          (opp?.title || "").toLowerCase().includes(q) ||
          (opp?.opportunityType || "").toLowerCase().includes(q) ||
          (org?.name || "").toLowerCase().includes(q) ||
          (req.reason || "").toLowerCase().includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [cancellationRequests, statusFilter, searchQuery, opportunities, organizations]);

  const getOpportunityForReq = (oppId) => {
    return opportunities.find((o) => o.id === oppId);
  };

  const getOrgForReq = (orgId) => {
    return organizations.find((o) => o.id === orgId);
  };

  const getApplicantsForOpp = (oppId) => {
    return applications.filter((a) => a.opportunityId === oppId);
  };

  const formatRequestedDate = (isoStr) => {
    if (!isoStr) return { date: "—", time: "" };
    const d = new Date(isoStr);
    const date = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { date, time };
  };

  // Handlers
  const handleConfirmApprove = (e) => {
    e.preventDefault();
    if (!approveModalReq) return;
    adminResolveCancellation(
      approveModalReq.id,
      "Approved",
      approveNote || "Cancellation request approved by Vismaya compliance desk."
    );
    setApproveModalReq(null);
    setApproveNote("");
  };

  const handleConfirmDecline = (e) => {
    e.preventDefault();
    if (!declineModalReq || !declineReason.trim()) {
      return;
    }
    adminResolveCancellation(declineModalReq.id, "Declined", declineReason.trim());
    setDeclineModalReq(null);
    setDeclineReason("");
  };

  // Helper for status pill
  const getStatusPill = (status) => {
    const isApproved = status === "Approved";
    const isDeclined = status === "Declined";

    let bg = "rgba(251, 191, 36, 0.14)";
    let color = "var(--status-amber)";
    let border = "rgba(251, 191, 36, 0.35)";

    if (isApproved) {
      bg = "rgba(52, 211, 153, 0.14)";
      color = "var(--status-green)";
      border = "rgba(52, 211, 153, 0.32)";
    } else if (isDeclined) {
      bg = "rgba(255, 107, 107, 0.14)";
      color = "var(--status-red)";
      border = "rgba(255, 107, 107, 0.35)";
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          whiteSpace: "nowrap",
          width: "fit-content",
          fontSize: "11px",
          fontWeight: "700",
          padding: "3px 10px",
          borderRadius: "999px",
          backgroundColor: bg,
          color: color,
          border: `1px solid ${border}`,
        }}
      >
        {status}
      </span>
    );
  };

  if (!isHydrated) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ height: "48px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "12px", width: "35%", animation: "pulse 1.5s infinite" }} />
        <div style={{ height: "400px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "16px", animation: "pulse 1.5s infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Page Header */}
      <PageHeader
        title="Opportunity Cancellation Requests"
        subtitle="Review formal opportunity withdrawal requests submitted by organizations and manage applicant notifications."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Cancellation Requests" },
        ]}
        style={{ marginBottom: "6px" }}
      />

      {/* A. Filter Tabs Row: Pill tabs with count badges */}
      <div className="cancel-tabs-row" role="tablist" aria-label="Cancellation request filters">
        {tabs.map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setStatusFilter(tab.key)}
              className={`cancel-tab-btn ${isActive ? "cancel-tab-active" : ""}`}
            >
              <span>{tab.label}</span>
              <span className={`cancel-tab-badge ${isActive ? "cancel-tab-badge-active" : ""}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* A. Compact Toolbar Row (No big card, simple bottom border) */}
      <div className="cancel-toolbar-row">
        <div
          className="cancel-search-wrap"
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            flex: "1 1 260px",
            maxWidth: "420px",
          }}
        >
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#7e89a3",
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
          <input
            type="text"
            placeholder="Search cancellation reason, opportunity, studio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="cancel-search-input"
            style={{
              width: "100%",
              height: "40px",
              minHeight: "40px",
              paddingLeft: "42px",
              paddingRight: searchQuery ? "36px" : "14px",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              backgroundColor: "rgba(255, 255, 255, 0.055)",
              borderRadius: "12px",
              color: "#eceaf5",
              fontSize: "0.825rem",
              fontFamily: "inherit",
              outline: "none",
              boxSizing: "border-box",
            }}
            aria-label="Search cancellation requests"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="cancel-search-clear-btn"
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#7e89a3",
                padding: "4px",
                borderRadius: "50%",
                zIndex: 2,
              }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Cancellation Requests Content: Desktop Table & Mobile Cards */}
      {filteredRequests.length === 0 ? (
        <div className="cancel-empty-card card-surface">
          <div className="cancel-empty-icon-wrap">
            <AlertOctagon size={36} style={{ color: "var(--gold)" }} />
          </div>
          <h3 style={{ fontSize: "1.1rem", color: "#eceaf5", fontWeight: 700, margin: "0 0 6px 0" }}>
            No cancellation requests in this category
          </h3>
          <p style={{ color: "#a3acc2", fontSize: "0.85rem", margin: 0, maxWidth: "440px" }}>
            {searchQuery.trim()
              ? `No cancellation requests found matching "${searchQuery}". Try adjusting your search query.`
              : statusFilter === "Pending"
              ? "There are no pending cancellation requests awaiting resolution."
              : `No requests found in "${tabs.find((t) => t.key === statusFilter)?.label || statusFilter}".`}
          </p>
        </div>
      ) : (
        <>
          {/* B. Desktop Table View (>= 768px) */}
          <div className="cancel-table-card card-surface">
            <div className="cancel-table-scroll">
              <table className="cancel-table">
                <thead>
                  <tr className="cancel-thead-row">
                    <th style={{ width: "24%" }}>Opportunity</th>
                    <th style={{ width: "16%" }}>Organization</th>
                    <th style={{ width: "26%" }}>Reason for Cancellation</th>
                    <th style={{ width: "11%" }}>Active Applicants</th>
                    <th style={{ width: "11%" }}>Requested On</th>
                    <th style={{ width: "12%" }}>Decision Status</th>
                    <th style={{ width: "220px", minWidth: "220px", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => {
                    const opp = getOpportunityForReq(req.opportunityId);
                    const org = getOrgForReq(req.orgId);
                    const apps = getApplicantsForOpp(req.opportunityId);
                    const isPending = req.status === "Pending";
                    const { date, time } = formatRequestedDate(req.requestedAt);

                    return (
                      <tr key={req.id} className="cancel-tbody-row">
                        {/* 1. Opportunity Column */}
                        <td style={{ padding: "14px 18px" }}>
                          <div title={opp?.title || "Opportunity"} className="cancel-opp-title">
                            {opp?.title || "Opportunity"}
                          </div>
                          {opp?.opportunityType && (
                            <span className="cancel-opp-category">
                              {opp.opportunityType}
                            </span>
                          )}
                        </td>

                        {/* 2. Organization Column */}
                        <td style={{ padding: "14px 18px" }}>
                          <div className="cancel-org-cell" title={org?.name || "Organization"}>
                            <div className="cancel-org-icon-wrap">
                              <Building2 size={13} style={{ color: "var(--gold)" }} />
                            </div>
                            <span className="cancel-org-name">
                              {org?.name || "Organization"}
                            </span>
                          </div>
                        </td>

                        {/* 3. Reason for Cancellation Column */}
                        <td style={{ padding: "14px 18px" }}>
                          <p title={req.reason} className="cancel-reason-text">
                            {req.reason}
                          </p>
                        </td>

                        {/* 4. Active Applicants Column (Neutral / Gold token instead of danger red) */}
                        <td style={{ padding: "14px 18px" }}>
                          <span className="cancel-applicants-chip">
                            <Users size={11} />
                            <span>{apps.length} {apps.length === 1 ? "applicant" : "applicants"}</span>
                          </span>
                        </td>

                        {/* 5. Requested On Column (Stacked Date & Time) */}
                        <td style={{ padding: "14px 18px" }}>
                          <div className="cancel-date-stack">
                            <span className="cancel-date-val">{date}</span>
                            {time && <span className="cancel-time-val">{time}</span>}
                          </div>
                        </td>

                        {/* 6. Decision Status Column */}
                        <td style={{ padding: "14px 18px" }}>
                          {getStatusPill(req.status)}
                        </td>

                        {/* 7. Moderation Action Column (Fixed ~220px, right-aligned) */}
                        <td style={{ padding: "14px 18px", textAlign: "right" }}>
                          {isPending ? (
                            <div className="cancel-actions-cluster">
                              <button
                                type="button"
                                onClick={() => {
                                  setApproveModalReq(req);
                                  setApproveNote("");
                                }}
                                className="btn-primary cancel-action-btn"
                              >
                                <CheckCircle2 size={13} />
                                <span>Approve</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setDeclineModalReq(req);
                                  setDeclineReason("");
                                }}
                                className="cancel-action-btn cancel-btn-decline"
                              >
                                <XCircle size={13} />
                                <span>Decline</span>
                              </button>
                            </div>
                          ) : (
                            <span className="cancel-resolved-date">
                              Resolved {formatRequestedDate(req.resolvedAt).date}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* E. Mobile Cards View (< 768px) */}
          <div className="cancel-mobile-cards-stack">
            {filteredRequests.map((req) => {
              const opp = getOpportunityForReq(req.opportunityId);
              const org = getOrgForReq(req.orgId);
              const apps = getApplicantsForOpp(req.opportunityId);
              const isPending = req.status === "Pending";
              const { date, time } = formatRequestedDate(req.requestedAt);

              return (
                <div key={req.id} className="cancel-mobile-card card-surface">
                  {/* Card Header: Opp title & Status pill */}
                  <div className="cancel-mobile-top">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <strong className="cancel-opp-title" style={{ fontSize: "0.95rem" }}>
                        {opp?.title || "Opportunity"}
                      </strong>
                      {opp?.opportunityType && (
                        <span className="cancel-opp-category" style={{ marginTop: "2px" }}>
                          {opp.opportunityType}
                        </span>
                      )}
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {getStatusPill(req.status)}
                    </div>
                  </div>

                  {/* Organization & Date row */}
                  <div className="cancel-mobile-meta-row">
                    <div className="cancel-org-cell">
                      <div className="cancel-org-icon-wrap" style={{ width: "24px", height: "24px" }}>
                        <Building2 size={12} style={{ color: "var(--gold)" }} />
                      </div>
                      <span className="cancel-org-name">{org?.name || "Organization"}</span>
                    </div>

                    <div className="cancel-date-stack" style={{ alignItems: "flex-end" }}>
                      <span className="cancel-date-val">{date}</span>
                      {time && <span className="cancel-time-val">{time}</span>}
                    </div>
                  </div>

                  {/* Reason text */}
                  <div className="cancel-mobile-reason-box">
                    <strong style={{ fontSize: "0.75rem", color: "#a3acc2", display: "block", marginBottom: "2px" }}>
                      Reason for Withdrawal:
                    </strong>
                    <p className="cancel-reason-text" style={{ WebkitLineClamp: 3, maxWidth: "100%" }}>
                      {req.reason}
                    </p>
                  </div>

                  {/* Applicants tag & Action buttons */}
                  <div className="cancel-mobile-footer">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: isPending ? "6px" : "0" }}>
                      <span className="cancel-applicants-chip">
                        <Users size={11} />
                        <span>{apps.length} {apps.length === 1 ? "applicant" : "applicants"} impacted</span>
                      </span>

                      {!isPending && (
                        <span className="cancel-resolved-date">
                          Resolved {formatRequestedDate(req.resolvedAt).date}
                        </span>
                      )}
                    </div>

                    {isPending && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", width: "100%" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setApproveModalReq(req);
                            setApproveNote("");
                          }}
                          className="btn-primary"
                          style={{ height: "38px", justifyContent: "center", fontSize: "0.8rem" }}
                        >
                          <CheckCircle2 size={13} />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeclineModalReq(req);
                            setDeclineReason("");
                          }}
                          className="cancel-btn-decline"
                          style={{ height: "38px", justifyContent: "center", fontSize: "0.8rem", borderRadius: "10px" }}
                        >
                          <XCircle size={13} />
                          <span>Decline</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* C. MODALS */}

      {/* Modal 1: Approve Confirmation Modal */}
      {approveModalReq && (
        <Modal
          isOpen={!!approveModalReq}
          onClose={() => setApproveModalReq(null)}
          title="Approve Opportunity Cancellation"
        >
          <form onSubmit={handleConfirmApprove} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="cancel-modal-warning-box">
              <strong style={{ color: "#ff8585", display: "block", marginBottom: "4px" }}>
                Impact Warning:
              </strong>
              Approving this request will permanently change the opportunity status to <strong style={{ color: "#ffffff" }}>Cancelled</strong>. All talent with submitted applications will receive automated notification updates.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.825rem", fontWeight: "600", color: "#eceaf5" }}>
                Resolution Note (Optional)
              </label>
              <textarea
                rows={3}
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                placeholder="Cancellation verified and approved by Vismaya compliance desk."
                className="cancel-modal-textarea"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setApproveModalReq(null)}
                className="btn-secondary"
                style={{ borderRadius: "10px", padding: "8px 16px" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ borderRadius: "10px", padding: "8px 20px" }}
              >
                Confirm Cancellation
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 2: Decline Request Modal */}
      {declineModalReq && (
        <Modal
          isOpen={!!declineModalReq}
          onClose={() => setDeclineModalReq(null)}
          title="Decline Cancellation Request"
        >
          <form onSubmit={handleConfirmDecline} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "0.875rem", color: "#a3acc2", margin: 0, lineHeight: 1.5 }}>
              Specify the reason for declining this request. The opportunity will remain Published and the organization will be notified.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "0.825rem", fontWeight: "600", color: "#eceaf5" }}>
                  Decline Reason / Feedback *
                </label>
                <span style={{ fontSize: "0.725rem", color: "#7c869e" }}>
                  {declineReason.length} characters
                </span>
              </div>
              <textarea
                rows={4}
                required
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="E.g. Candidate selection process is already in final stages. Please contact compliance desk..."
                className="cancel-modal-textarea"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setDeclineModalReq(null)}
                className="btn-secondary"
                style={{ borderRadius: "10px", padding: "8px 16px" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!declineReason.trim()}
                className="btn-primary"
                style={{
                  borderRadius: "10px",
                  padding: "8px 20px",
                  opacity: declineReason.trim() ? 1 : 0.6,
                  cursor: declineReason.trim() ? "pointer" : "not-allowed",
                }}
              >
                Decline Request
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Embedded CSS */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }

        /* Tabs Row */
        .cancel-tabs-row {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 2px;
        }
        .cancel-tabs-row::-webkit-scrollbar {
          display: none;
        }

        .cancel-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 16px;
          height: 38px;
          min-height: 38px;
          border-radius: 999px;
          font-size: 0.775rem;
          font-weight: 600;
          color: #a3acc2;
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
          flex-shrink: 0;
          box-sizing: border-box;
        }
        .cancel-tab-btn:hover:not(.cancel-tab-active) {
          background-color: rgba(255, 255, 255, 0.08);
          color: #eceaf5;
          border-color: rgba(255, 255, 255, 0.2);
        }
        .cancel-tab-active {
          background: linear-gradient(135deg, #ffd54a 0%, #ffbc00 100%) !important;
          color: #1a1300 !important;
          border-color: #ffd54a !important;
          box-shadow: 0 4px 12px rgba(255, 188, 0, 0.25);
        }

        .cancel-tab-badge {
          padding: 1px 7px;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 700;
          background-color: rgba(255, 255, 255, 0.1);
          color: #eceaf5;
        }
        .cancel-tab-badge-active {
          background-color: rgba(26, 19, 0, 0.25) !important;
          color: #1a1300 !important;
        }

        /* Toolbar Row */
        .cancel-toolbar-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          width: 100%;
        }

        .cancel-search-wrap {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
        }

        .cancel-search-input {
          transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
        }
        .cancel-search-input:hover {
          background-color: rgba(255, 255, 255, 0.075) !important;
          border-color: rgba(255, 255, 255, 0.22) !important;
        }
        .cancel-search-input:focus {
          border-color: #ffbc00 !important;
          box-shadow: 0 0 0 3px rgba(255, 188, 0, 0.15) !important;
          background-color: rgba(255, 255, 255, 0.075) !important;
        }
        .cancel-search-input::placeholder {
          color: #7e89a3;
          font-size: 0.825rem;
        }

        .cancel-search-clear-btn:hover {
          color: #eceaf5 !important;
          background-color: rgba(255, 255, 255, 0.1) !important;
        }

        /* Empty State */
        .cancel-empty-card {
          border-radius: 16px;
          padding: 56px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .cancel-empty-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background-color: rgba(255, 188, 0, 0.12);
          border: 1px solid rgba(255, 188, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        /* Table Card (Desktop) */
        .cancel-table-card {
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
          width: 100%;
        }

        .cancel-table-scroll {
          overflow-x: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
        }

        .cancel-table {
          width: 100%;
          min-width: 1100px;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.85rem;
        }

        .cancel-thead-row {
          background-color: #0a0f19;
          border-bottom: 1px solid rgba(255, 255, 255, 0.10);
        }

        .cancel-thead-row th {
          padding: 14px 18px;
          color: #7c869e;
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          white-space: nowrap;
          position: sticky;
          top: 0;
          background-color: #0a0f19;
          z-index: 5;
        }

        .cancel-tbody-row {
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          transition: background-color 0.15s ease;
        }
        .cancel-tbody-row:hover {
          background-color: rgba(255, 255, 255, 0.035) !important;
        }

        .cancel-opp-title {
          font-weight: 700;
          color: #eceaf5;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 250px;
          font-size: 0.875rem;
        }

        .cancel-opp-category {
          font-size: 0.725rem;
          color: var(--gold);
          font-weight: 600;
          display: block;
          margin-top: 2px;
          white-space: nowrap;
        }

        .cancel-org-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .cancel-org-icon-wrap {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .cancel-org-name {
          font-weight: 600;
          color: #eceaf5;
          font-size: 0.825rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 150px;
        }

        .cancel-reason-text {
          font-size: 0.8rem;
          color: #a3acc2;
          margin: 0;
          max-width: 280px;
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cancel-applicants-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.725rem;
          font-weight: 700;
          color: var(--gold);
          background-color: rgba(255, 188, 0, 0.10);
          border: 1px solid rgba(255, 188, 0, 0.28);
          padding: 3px 9px;
          border-radius: 999px;
          white-space: nowrap;
        }

        .cancel-date-stack {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .cancel-date-val {
          font-size: 0.775rem;
          font-weight: 600;
          color: #eceaf5;
          white-space: nowrap;
        }

        .cancel-time-val {
          font-size: 0.7rem;
          color: #7e89a3;
          white-space: nowrap;
        }

        .cancel-actions-cluster {
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          width: 100%;
        }

        .cancel-action-btn {
          height: 36px;
          min-height: 36px;
          padding: 0 14px;
          font-size: 0.775rem;
          font-weight: 700;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          cursor: pointer;
          min-width: 0;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }

        .cancel-btn-decline {
          background-color: rgba(255, 107, 107, 0.12) !important;
          color: #ff6b6b !important;
          border: 1px solid rgba(255, 107, 107, 0.35) !important;
        }
        .cancel-btn-decline:hover {
          background-color: rgba(255, 107, 107, 0.22) !important;
          border-color: #ff6b6b !important;
        }

        .cancel-resolved-date {
          font-size: 0.75rem;
          color: #7e89a3;
          white-space: nowrap;
        }

        /* Mobile Cards Layout (< 768px) */
        .cancel-mobile-cards-stack {
          display: none;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .cancel-mobile-card {
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background-color: rgba(255, 255, 255, 0.035);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .cancel-mobile-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .cancel-mobile-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding-bottom: 2px;
        }

        .cancel-mobile-reason-box {
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 10px 12px;
        }

        .cancel-mobile-footer {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        /* Modals */
        .cancel-modal-warning-box {
          background-color: rgba(255, 107, 107, 0.12);
          border: 1px solid rgba(255, 107, 107, 0.35);
          border-radius: 12px;
          padding: 12px 14px;
          color: #ff8585;
          font-size: 0.85rem;
          line-height: 1.45;
        }

        .cancel-modal-textarea {
          background-color: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 0.85rem;
          color: #eceaf5;
          outline: none;
          resize: vertical;
          width: 100%;
          box-sizing: border-box;
          font-family: inherit;
        }
        .cancel-modal-textarea:focus {
          border-color: #ffbc00;
        }

        /* RESPONSIVE BREAKPOINTS */
        @media (max-width: 767.98px) {
          .cancel-table-card {
            display: none !important;
          }
          .cancel-mobile-cards-stack {
            display: flex !important;
          }
          .cancel-search-wrap {
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
