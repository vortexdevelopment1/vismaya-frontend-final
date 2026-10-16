"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  AlertOctagon,
  Building2,
  Calendar,
  Users,
  Search,
  CheckCircle2,
  XCircle,
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

  // Status pill using semantic system
  const getStatusPill = (status) => {
    if (status === "Approved") {
      return <StatusBadge status="Approved" size="xs" />;
    }
    if (status === "Declined") {
      return <StatusBadge status="Declined" size="xs" />;
    }
    return <StatusBadge status="Pending" label="Pending Review" size="xs" />;
  };

  if (!isHydrated) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ height: "48px", background: "#F3EFE6", borderRadius: "12px", width: "35%" }} />
        <div style={{ height: "400px", background: "#FFFFFF", border: "1px solid #E8E2D4", borderRadius: "16px" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
      {/* Page Header */}
      <PageHeader
        title="Opportunity Cancellation Requests"
        subtitle="Review formal opportunity withdrawal requests submitted by organizations and manage applicant notifications."
        badge={`${statusCounts.Pending} PENDING REVIEW`}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Cancellation Requests" },
        ]}
      />

      {/* Filter Tabs Row */}
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

      {/* Compact Toolbar Row with Search */}
      <div className="cancel-toolbar-row">
        <div className="cancel-search-wrap">
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#5A584F",
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
            aria-label="Search cancellation requests"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="cancel-search-clear-btn"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Cancellation Requests Content: Desktop Table & Mobile Cards */}
      {filteredRequests.length === 0 ? (
        <div className="cancel-empty-card">
          <div className="cancel-empty-icon-wrap">
            <AlertOctagon size={32} style={{ color: "#8A6B2E" }} />
          </div>
          <h3 style={{ fontSize: "18px", color: "#2B2D2A", fontFamily: "var(--font-heading), 'Playfair Display', serif", fontWeight: 600, margin: "0 0 6px 0" }}>
            No cancellation requests in this category
          </h3>
          <p style={{ color: "#5A584F", fontSize: "14px", margin: 0, maxWidth: "440px", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
            {searchQuery.trim()
              ? `No cancellation requests found matching "${searchQuery}". Try adjusting your search query.`
              : statusFilter === "Pending"
              ? "There are no pending cancellation requests awaiting resolution."
              : `No requests found in "${tabs.find((t) => t.key === statusFilter)?.label || statusFilter}".`}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View (>= 768px) with full-width card wrapper & internal horizontal scroll */}
          <div className="cancel-table-card">
            <div className="cancel-table-scroll">
              <table className="cancel-table">
                <thead>
                  <tr className="cancel-thead-row">
                    <th style={{ width: "18%", minWidth: "150px" }}>Opportunity</th>
                    <th style={{ width: "14%", minWidth: "130px" }}>Organization</th>
                    <th style={{ width: "22%", minWidth: "170px" }}>Reason for Cancellation</th>
                    <th style={{ width: "11%", minWidth: "100px" }}>Active Applicants</th>
                    <th style={{ width: "11%", minWidth: "100px" }}>Requested On</th>
                    <th style={{ width: "11%", minWidth: "110px" }}>Decision Status</th>
                    <th style={{ width: "13%", minWidth: "180px", textAlign: "right" }}>Actions</th>
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
                        <td style={{ padding: "16px 20px" }}>
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
                        <td style={{ padding: "16px 20px" }}>
                          <div className="cancel-org-cell" title={org?.name || "Organization"}>
                            <div className="cancel-org-icon-wrap">
                              <Building2 size={14} style={{ color: "#8A6B2E" }} />
                            </div>
                            <span className="cancel-org-name">
                              {org?.name || "Organization"}
                            </span>
                          </div>
                        </td>

                        {/* 3. Reason for Cancellation Column */}
                        <td style={{ padding: "16px 20px" }}>
                          <p title={req.reason} className="cancel-reason-text">
                            {req.reason}
                          </p>
                        </td>

                        {/* 4. Active Applicants Column */}
                        <td style={{ padding: "16px 20px" }}>
                          <span className="cancel-applicants-chip">
                            <Users size={12} />
                            <span>{apps.length} {apps.length === 1 ? "applicant" : "applicants"}</span>
                          </span>
                        </td>

                        {/* 5. Requested On Column */}
                        <td style={{ padding: "16px 20px" }}>
                          <div className="cancel-date-stack">
                            <span className="cancel-date-val">{date}</span>
                            {time && <span className="cancel-time-val">{time}</span>}
                          </div>
                        </td>

                        {/* 6. Decision Status Column */}
                        <td style={{ padding: "16px 20px" }}>
                          {getStatusPill(req.status)}
                        </td>

                        {/* 7. Moderation Action Column */}
                        <td style={{ padding: "16px 20px", textAlign: "right" }}>
                          {isPending ? (
                            <div className="cancel-actions-cluster">
                              <button
                                type="button"
                                onClick={() => {
                                  setApproveModalReq(req);
                                  setApproveNote("");
                                }}
                                className="cancel-btn-approve"
                              >
                                <CheckCircle2 size={14} />
                                <span>Approve</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setDeclineModalReq(req);
                                  setDeclineReason("");
                                }}
                                className="cancel-btn-decline"
                              >
                                <XCircle size={14} />
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

          {/* Mobile Cards View (< 768px) */}
          <div className="cancel-mobile-cards-stack">
            {filteredRequests.map((req) => {
              const opp = getOpportunityForReq(req.opportunityId);
              const org = getOrgForReq(req.orgId);
              const apps = getApplicantsForOpp(req.opportunityId);
              const isPending = req.status === "Pending";
              const { date, time } = formatRequestedDate(req.requestedAt);

              return (
                <div key={req.id} className="cancel-mobile-card">
                  {/* Card Header: Opp title & Status pill */}
                  <div className="cancel-mobile-top">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <strong className="cancel-opp-title" style={{ fontSize: "15px" }}>
                        {opp?.title || "Opportunity"}
                      </strong>
                      {opp?.opportunityType && (
                        <span className="cancel-opp-category" style={{ marginTop: "4px" }}>
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
                      <div className="cancel-org-icon-wrap" style={{ width: "26px", height: "26px" }}>
                        <Building2 size={13} style={{ color: "#8A6B2E" }} />
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
                    <strong style={{ fontSize: "11px", color: "#5A584F", display: "block", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Reason for Withdrawal:
                    </strong>
                    <p className="cancel-reason-text" style={{ WebkitLineClamp: 3, maxWidth: "100%" }}>
                      {req.reason}
                    </p>
                  </div>

                  {/* Applicants tag & Action buttons */}
                  <div className="cancel-mobile-footer">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: isPending ? "8px" : "0" }}>
                      <span className="cancel-applicants-chip">
                        <Users size={12} />
                        <span>{apps.length} {apps.length === 1 ? "applicant" : "applicants"} impacted</span>
                      </span>

                      {!isPending && (
                        <span className="cancel-resolved-date">
                          Resolved {formatRequestedDate(req.resolvedAt).date}
                        </span>
                      )}
                    </div>

                    {isPending && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", width: "100%" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setApproveModalReq(req);
                            setApproveNote("");
                          }}
                          className="cancel-btn-approve"
                          style={{ height: "40px", justifyContent: "center" }}
                        >
                          <CheckCircle2 size={14} />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeclineModalReq(req);
                            setDeclineReason("");
                          }}
                          className="cancel-btn-decline"
                          style={{ height: "40px", justifyContent: "center" }}
                        >
                          <XCircle size={14} />
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

      {/* MODALS */}
      {/* Modal 1: Approve Confirmation Modal */}
      {approveModalReq && (
        <Modal
          isOpen={!!approveModalReq}
          onClose={() => setApproveModalReq(null)}
          title="Approve Opportunity Cancellation"
        >
          <form onSubmit={handleConfirmApprove} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div className="cancel-modal-warning-box">
              <strong style={{ color: "#B42318", display: "block", marginBottom: "4px" }}>
                Impact Warning:
              </strong>
              Approving this request will permanently change the opportunity status to <strong style={{ color: "#2B2D2A" }}>Cancelled</strong>. All talent with submitted applications will receive automated notification updates.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
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

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button
                type="button"
                onClick={() => setApproveModalReq(null)}
                className="cancel-modal-cancel-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="cancel-btn-approve"
                style={{ padding: "0 22px", height: "42px" }}
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
          <form onSubmit={handleConfirmDecline} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <p style={{ fontSize: "14px", color: "#5A584F", margin: 0, lineHeight: 1.6, fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
              Specify the reason for declining this request. The opportunity will remain Published and the organization will be notified.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
                  Decline Reason / Feedback *
                </label>
                <span style={{ fontSize: "12px", color: "#5A584F" }}>
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

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button
                type="button"
                onClick={() => setDeclineModalReq(null)}
                className="cancel-modal-cancel-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!declineReason.trim()}
                className="cancel-btn-decline"
                style={{
                  padding: "0 22px",
                  height: "42px",
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
        /* Tabs Row */
        .cancel-tabs-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .cancel-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 16px;
          height: 40px;
          min-height: 40px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 600;
          font-family: var(--font-body), 'Inter', sans-serif;
          color: #5A584F;
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.16s ease;
          flex-shrink: 0;
          box-sizing: border-box;
        }
        .cancel-tab-btn:hover:not(.cancel-tab-active) {
          border-color: #8A6B2E !important;
          background-color: #F3EFE6 !important;
          color: #2B2D2A !important;
        }
        .cancel-tab-active {
          background-color: #8A6B2E !important;
          color: #FFFFFF !important;
          border-color: #8A6B2E !important;
          box-shadow: 0 2px 8px rgba(138, 107, 46, 0.22);
        }

        .cancel-tab-badge {
          height: 22px;
          min-width: 22px;
          padding: 0 6px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          background-color: #F3EFE6;
          color: #2B2D2A;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .cancel-tab-badge-active {
          background-color: rgba(255, 255, 255, 0.22) !important;
          color: #FFFFFF !important;
        }

        /* Toolbar Row */
        .cancel-toolbar-row {
          display: flex;
          align-items: center;
          justifyContent: space-between;
          gap: 14px;
          width: 100%;
        }

        .cancel-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1 1 280px;
          max-width: 440px;
        }

        .cancel-search-input {
          width: 100%;
          height: 44px;
          min-height: 44px;
          padding-left: 42px;
          padding-right: 38px;
          border: 1px solid #D9D2C0;
          background-color: #FFFFFF;
          border-radius: 10px;
          color: "#2B2D2A";
          font-size: 14px;
          font-family: var(--font-body), 'Inter', sans-serif;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.16s ease, box-shadow 0.16s ease;
        }
        .cancel-search-input:focus {
          border-color: #8A6B2E !important;
          box-shadow: 0 0 0 3px rgba(138, 107, 46, 0.18) !important;
        }
        .cancel-search-input::placeholder {
          color: #6B6A63;
        }

        .cancel-search-clear-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #5A584F;
          padding: 4px;
          border-radius: 50%;
          z-index: 2;
        }
        .cancel-search-clear-btn:hover {
          color: #2B2D2A;
          background-color: #F3EFE6;
        }

        /* Empty State */
        .cancel-empty-card {
          border-radius: 18px;
          padding: 56px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          box-shadow: 0 2px 4px rgba(43, 45, 42, 0.04);
        }
        .cancel-empty-icon-wrap {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          background-color: #F3EFE6;
          border: 1px solid #E8E2D4;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        /* Table Card (Desktop) */
        .cancel-table-card {
          border-radius: 16px;
          overflow: hidden;
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          box-shadow: 0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06);
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .cancel-table-scroll {
          overflow-x: auto;
          width: 100%;
          max-width: 100%;
          -webkit-overflow-scrolling: touch;
        }

        .cancel-table {
          width: 100%;
          min-width: 960px;
          border-collapse: collapse;
          text-align: left;
          font-size: 14px;
          font-family: var(--font-body), 'Inter', sans-serif;
        }

        .cancel-thead-row {
          background-color: #F3EFE6;
          border-bottom: 1px solid #E8E2D4;
        }

        .cancel-thead-row th {
          padding: 14px 16px;
          color: #5A584F;
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          white-space: nowrap;
          position: sticky;
          top: 0;
          background-color: #F3EFE6;
          z-index: 5;
        }

        .cancel-thead-row th:last-child {
          position: sticky;
          right: 0;
          background-color: #F3EFE6;
          z-index: 7;
          box-shadow: -4px 0 8px rgba(43, 45, 42, 0.04);
        }

        .cancel-tbody-row {
          border-bottom: 1px solid #E8E2D4;
          transition: background-color 0.16s ease;
          background-color: #FFFFFF;
        }
        .cancel-tbody-row:hover {
          background-color: #FAF9F7 !important;
        }

        .cancel-tbody-row td:last-child {
          position: sticky;
          right: 0;
          background-color: #FFFFFF;
          z-index: 3;
          box-shadow: -4px 0 8px rgba(43, 45, 42, 0.04);
        }
        .cancel-tbody-row:hover td:last-child {
          background-color: #FAF9F7 !important;
        }

        .cancel-opp-title {
          font-weight: 600;
          color: #2B2D2A;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 15px;
        }

        .cancel-opp-category {
          font-size: 12px;
          color: #6E5420;
          background-color: rgba(201, 165, 92, 0.16);
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
          display: inline-block;
          margin-top: 4px;
          white-space: nowrap;
        }

        .cancel-org-cell {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .cancel-org-icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #F3EFE6;
          border: 1px solid #E8E2D4;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .cancel-org-name {
          font-weight: 600;
          color: #2B2D2A;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cancel-reason-text {
          font-size: 13px;
          color: #5A584F;
          margin: 0;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cancel-applicants-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #6E5420;
          background-color: #F3EFE6;
          border: 1px solid #E8E2D4;
          padding: 3px 10px;
          border-radius: 999px;
          white-space: nowrap;
        }

        .cancel-date-stack {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .cancel-date-val {
          font-size: 13px;
          font-weight: 600;
          color: #2B2D2A;
          white-space: nowrap;
        }

        .cancel-time-val {
          font-size: 12px;
          color: #5A584F;
          white-space: nowrap;
        }

        .cancel-actions-cluster {
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          white-space: nowrap;
        }

        .cancel-btn-approve {
          height: 40px;
          min-height: 40px;
          padding: 0 14px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          cursor: pointer;
          background-color: #8A6B2E;
          color: #FFFFFF;
          border: 1px solid #8A6B2E;
          transition: all 0.16s ease;
          box-shadow: 0 2px 6px rgba(138, 107, 46, 0.2);
          font-family: var(--font-body), 'Inter', sans-serif;
        }
        .cancel-btn-approve:hover {
          background-color: #6E5420;
          border-color: #6E5420;
        }

        .cancel-btn-decline {
          height: 40px;
          min-height: 40px;
          padding: 0 14px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          cursor: pointer;
          background-color: #FFFFFF;
          color: #B42318;
          border: 1px solid rgba(180, 35, 24, 0.35);
          transition: all 0.16s ease;
          font-family: var(--font-body), 'Inter', sans-serif;
        }
        .cancel-btn-decline:hover {
          background-color: rgba(180, 35, 24, 0.08);
          border-color: #B42318;
        }

        .cancel-modal-cancel-btn {
          height: 42px;
          padding: 0 18px;
          border-radius: 10px;
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          color: #5A584F;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.16s ease;
          font-family: var(--font-body), 'Inter', sans-serif;
        }
        .cancel-modal-cancel-btn:hover {
          background-color: #F3EFE6;
          color: #2B2D2A;
        }

        .cancel-resolved-date {
          font-size: 13px;
          color: #5A584F;
          white-space: nowrap;
          font-family: var(--font-body), 'Inter', sans-serif;
        }

        /* Mobile Cards Layout (< 768px) */
        .cancel-mobile-cards-stack {
          display: none;
          flex-direction: column;
          gap: 14px;
          width: 100%;
        }

        .cancel-mobile-card {
          border-radius: 16px;
          border: 1px solid #E8E2D4;
          background-color: #FFFFFF;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 2px 6px rgba(43, 45, 42, 0.04);
        }

        .cancel-mobile-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .cancel-mobile-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 2px;
        }

        .cancel-mobile-reason-box {
          background-color: #FAF9F7;
          border: 1px solid #E8E2D4;
          border-radius: 12px;
          padding: 12px 14px;
        }

        .cancel-mobile-footer {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* Modals */
        .cancel-modal-warning-box {
          background-color: rgba(180, 35, 24, 0.08);
          border: 1px solid rgba(180, 35, 24, 0.25);
          border-radius: 12px;
          padding: 14px 16px;
          color: #B42318;
          font-size: 14px;
          line-height: 1.5;
        }

        .cancel-modal-textarea {
          background-color: #FFFFFF;
          border: 1px solid #D9D2C0;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 14px;
          color: #2B2D2A;
          outline: none;
          resize: vertical;
          width: 100%;
          box-sizing: border-box;
          font-family: var(--font-body), 'Inter', sans-serif;
          transition: border-color 0.16s ease, box-shadow 0.16s ease;
        }
        .cancel-modal-textarea:focus {
          border-color: #8A6B2E;
          box-shadow: 0 0 0 3px rgba(138, 107, 46, 0.18);
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

        @media (max-width: 640px) {
          .cancel-tabs-row {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 5px !important;
            overflow-x: visible !important;
          }
          .cancel-tab-btn {
            flex: 1 1 auto !important;
            height: 28px !important;
            padding: 0 8px !important;
            border-radius: 999px !important;
            font-size: 10.5px !important;
            font-weight: 600 !important;
            white-space: nowrap !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 4px !important;
          }
          .cancel-tab-badge {
            min-width: 16px !important;
            height: 16px !important;
            font-size: 9.5px !important;
            padding: 0 4px !important;
          }
          .cancel-toolbar-row {
            margin-bottom: 2px !important;
          }
          .cancel-search-wrap {
            max-width: 100% !important;
            width: 100% !important;
          }
          .cancel-search-input {
            height: 40px !important;
            min-height: 40px !important;
            font-size: 16px !important;
          }
          .cancel-mobile-cards-stack {
            gap: 10px !important;
          }
          .cancel-mobile-card {
            padding: 12px !important;
            border-radius: 14px !important;
            gap: 10px !important;
          }
          .cancel-mobile-reason-box {
            padding: 10px 12px !important;
            border-radius: 10px !important;
          }
          .cancel-mobile-reason-box strong {
            font-size: 10px !important;
          }
          .cancel-reason-text {
            font-size: 12.5px !important;
            -webkit-line-clamp: 3 !important;
          }
          .cancel-btn-approve,
          .cancel-btn-decline {
            height: 36px !important;
            min-height: 36px !important;
            font-size: 12px !important;
            border-radius: 8px !important;
          }
          .cancel-modal-textarea {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
