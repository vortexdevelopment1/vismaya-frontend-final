"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Video,
  Play,
  CheckCircle2,
  Building2,
  Users,
  Search,
  Eye,
  Send,
  Upload,
  X,
} from "lucide-react";
import { useWorkflow } from "@/lib/shared/workflowStore";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import Modal from "@/components/shared/Modal";
import VideoPlayer from "@/components/shared/VideoPlayer";

export default function AdminAuditionsManagementPage() {
  const {
    auditions = [],
    opportunities = [],
    organizations = [],
    adminRelayAudition,
    submitSelfTape,
    adminForwardSelfTape,
    isHydrated,
  } = useWorkflow();

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [orgFilter, setOrgFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [relayModalAud, setRelayModalAud] = useState(null);
  const [relayNote, setRelayNote] = useState("");

  const [previewVideoModalAud, setPreviewVideoModalAud] = useState(null);

  const [forwardModalAud, setForwardModalAud] = useState(null);
  const [forwardNote, setForwardNote] = useState("");

  // Status counts
  const statusCounts = useMemo(() => {
    return {
      ALL: auditions.length,
      Requested: auditions.filter((a) => a.status === "Requested").length,
      "Relayed to Talent": auditions.filter((a) => a.status === "Relayed to Talent").length,
      "Self-tape Received": auditions.filter((a) => a.status === "Self-tape Received").length,
      "Forwarded to Organization": auditions.filter((a) => a.status === "Forwarded to Organization").length,
    };
  }, [auditions]);

  // Tab definitions
  const tabs = [
    { key: "ALL", label: "All Auditions", count: statusCounts.ALL },
    { key: "Requested", label: "Needs Relay", count: statusCounts.Requested },
    { key: "Relayed to Talent", label: "Relayed to Talent", count: statusCounts["Relayed to Talent"] },
    { key: "Self-tape Received", label: "Self-Tapes Received", count: statusCounts["Self-tape Received"] },
    { key: "Forwarded to Organization", label: "Forwarded & Verified", count: statusCounts["Forwarded to Organization"] },
  ];

  // Filtered auditions
  const filteredAuditions = useMemo(() => {
    return auditions.filter((aud) => {
      // Status filter
      if (statusFilter !== "ALL" && aud.status !== statusFilter) {
        return false;
      }

      // Organization filter
      if (orgFilter !== "ALL" && aud.orgId !== orgFilter) {
        return false;
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const opp = opportunities.find((o) => o.id === aud.opportunityId);
        const org = organizations.find((o) => o.id === aud.orgId);

        const match =
          (aud.talentName || "").toLowerCase().includes(q) ||
          (opp?.title || "").toLowerCase().includes(q) ||
          (org?.name || "").toLowerCase().includes(q) ||
          (aud.type || "").toLowerCase().includes(q) ||
          (aud.note || "").toLowerCase().includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [auditions, statusFilter, orgFilter, searchQuery, opportunities, organizations]);

  const getOpportunityForAud = (oppId) => {
    return opportunities.find((o) => o.id === oppId);
  };

  const getOrgForAud = (orgId) => {
    return organizations.find((o) => o.id === orgId);
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "—";
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handlers
  const handleRelay = (e) => {
    e.preventDefault();
    if (!relayModalAud) return;
    adminRelayAudition(
      relayModalAud.id,
      relayNote || relayModalAud.note || "Audition instructions verified and relayed by Vismaya Desk."
    );
    setRelayModalAud(null);
  };

  const handleSimulateTalentUpload = (audId) => {
    submitSelfTape(
      audId,
      "https://vismaya.media/selftapes/simulated-audition.mp4",
      "Audition monologue recorded and submitted in high definition."
    );
  };

  const handleForward = (e) => {
    e.preventDefault();
    if (!forwardModalAud) return;
    adminForwardSelfTape(
      forwardModalAud.id,
      forwardNote || "Self-tape audition verified by Vismaya moderation desk and unlocked for review."
    );
    setForwardModalAud(null);
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
        title="Auditions & Self-Tapes Relay"
        subtitle="Admin gateway between studio requests and talent submissions. Review audition requests, relay invitations, and moderate self-tapes."
        badge={`${statusCounts.Requested} NEEDS RELAY`}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Auditions & Self-Tapes" },
        ]}
      />

      {/* Filter Tabs Row */}
      <div className="aud-tabs-row" role="tablist" aria-label="Audition request filters">
        {tabs.map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setStatusFilter(tab.key)}
              className={`aud-tab-btn ${isActive ? "aud-tab-active" : ""}`}
            >
              <span>{tab.label}</span>
              <span className={`aud-tab-badge ${isActive ? "aud-tab-badge-active" : ""}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toolbar Row */}
      <div className="aud-toolbar-row">
        <div className="aud-search-wrap">
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
            placeholder="Search candidate, role, opportunity, studio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="aud-search-input"
            aria-label="Search auditions"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="aud-search-clear-btn"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Organization Filter Select */}
        <div className="aud-org-filter-wrap">
          <label htmlFor="aud-org-select-input" className="aud-org-label">
            Organization:
          </label>
          <select
            id="aud-org-select-input"
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            className="aud-org-select"
          >
            <option value="ALL">All Organizations ({organizations.length})</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Auditions Content: Desktop Table & Mobile Cards */}
      {filteredAuditions.length === 0 ? (
        <div className="aud-empty-card">
          <div className="aud-empty-icon-wrap">
            <Video size={32} style={{ color: "#8A6B2E" }} />
          </div>
          <h3 style={{ fontSize: "18px", color: "#2B2D2A", fontFamily: "var(--font-heading), 'Playfair Display', serif", fontWeight: 600, margin: "0 0 6px 0" }}>
            No audition requests in this queue
          </h3>
          <p style={{ color: "#5A584F", fontSize: "14px", margin: 0, maxWidth: "440px", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
            {searchQuery.trim()
              ? `No audition records found matching "${searchQuery}". Try clearing search filter.`
              : statusFilter === "Requested"
              ? "All audition requests have been relayed to candidates."
              : `No auditions currently under status "${tabs.find((t) => t.key === statusFilter)?.label || statusFilter}".`}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View (>= 768px) with internal horizontal scroll wrapper */}
          <div className="aud-table-card">
            <div className="aud-table-scroll">
              <table className="aud-table">
                <thead>
                  <tr className="aud-thead-row">
                    <th style={{ width: "22%" }}>Candidate</th>
                    <th style={{ width: "26%" }}>Opportunity &amp; Studio</th>
                    <th style={{ width: "12%" }}>Audition Type</th>
                    <th style={{ width: "16%" }}>Pipeline Stage</th>
                    <th style={{ width: "240px", minWidth: "240px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditions.map((aud) => {
                    const opp = getOpportunityForAud(aud.opportunityId);
                    const org = getOrgForAud(aud.orgId);

                    return (
                      <tr key={aud.id} className="aud-tbody-row">
                        {/* 1. Candidate Column */}
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div className="aud-candidate-avatar">
                              {(aud.talentName || "T").charAt(0).toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <strong className="aud-candidate-name">
                                {aud.talentName}
                              </strong>
                              <span className="aud-candidate-date">
                                Requested {formatDate(aud.requestedAt)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Opportunity & Studio Column */}
                        <td style={{ padding: "16px 20px" }}>
                          <div title={opp?.title || "Opportunity"} className="aud-opp-title">
                            {opp?.title || "Opportunity"}
                          </div>
                          <div className="aud-studio-line" title={org?.name || "Studio"}>
                            <Building2 size={13} style={{ color: "#8A6B2E", flexShrink: 0 }} />
                            <span className="aud-truncate-text">{org?.name || "Studio"}</span>
                          </div>
                        </td>

                        {/* 3. Type Column */}
                        <td style={{ padding: "16px 20px" }}>
                          <span className="aud-type-chip">
                            {aud.type || "Audition"}
                          </span>
                        </td>

                        {/* 4. Stage Column */}
                        <td style={{ padding: "16px 20px" }}>
                          <StatusBadge status={aud.status} size="xs" />
                        </td>

                        {/* 5. Moderation Actions Column */}
                        <td style={{ padding: "16px 20px", textAlign: "right" }}>
                          <div className="aud-actions-cluster">
                            {/* State 1: Needs Relay */}
                            {aud.status === "Requested" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRelayModalAud(aud);
                                  setRelayNote(aud.note || "");
                                }}
                                className="aud-btn-primary"
                              >
                                <Send size={13} />
                                <span>Relay to Talent</span>
                              </button>
                            )}

                            {/* State 2: Relayed - Simulate talent upload */}
                            {aud.status === "Relayed to Talent" && (
                              <button
                                type="button"
                                onClick={() => handleSimulateTalentUpload(aud.id)}
                                className="aud-btn-secondary"
                                title="Simulate candidate submitting audition video"
                              >
                                <Upload size={13} />
                                <span>Simulate Upload</span>
                              </button>
                            )}

                            {/* State 3: Self-tape Received - Preview & Forward */}
                            {aud.status === "Self-tape Received" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setPreviewVideoModalAud(aud)}
                                  className="aud-btn-secondary"
                                >
                                  <Eye size={13} />
                                  <span>Watch Video</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setForwardModalAud(aud);
                                    setForwardNote("");
                                  }}
                                  className="aud-btn-primary"
                                >
                                  <CheckCircle2 size={13} />
                                  <span>Forward</span>
                                </button>
                              </>
                            )}

                            {/* State 4: Forwarded to Organization */}
                            {aud.status === "Forwarded to Organization" && (
                              <button
                                type="button"
                                onClick={() => setPreviewVideoModalAud(aud)}
                                className="aud-btn-secondary"
                              >
                                <Play size={13} />
                                <span>Watch Video</span>
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
          </div>

          {/* Mobile Cards View (< 768px) */}
          <div className="aud-mobile-cards-stack">
            {filteredAuditions.map((aud) => {
              const opp = getOpportunityForAud(aud.opportunityId);
              const org = getOrgForAud(aud.orgId);

              return (
                <div key={aud.id} className="aud-mobile-card">
                  <div className="aud-mobile-card-top">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div className="aud-candidate-avatar">
                        {(aud.talentName || "T").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong className="aud-candidate-name">{aud.talentName}</strong>
                        <span className="aud-candidate-date">{formatDate(aud.requestedAt)}</span>
                      </div>
                    </div>
                    <StatusBadge status={aud.status} size="xs" />
                  </div>

                  <div className="aud-mobile-card-body">
                    <strong className="aud-opp-title">{opp?.title || "Opportunity"}</strong>
                    <div className="aud-studio-line">
                      <Building2 size={13} style={{ color: "#8A6B2E" }} />
                      <span>{org?.name || "Studio"}</span>
                    </div>
                  </div>

                  {aud.note && (
                    <div className="aud-mobile-card-instructions">
                      <strong style={{ fontSize: "11px", color: "#5A584F", display: "block", marginBottom: "2px", textTransform: "uppercase" }}>
                        Audition Instructions:
                      </strong>
                      <p style={{ margin: 0, fontSize: "13px", color: "#2B2D2A", lineHeight: 1.4 }}>
                        {aud.note}
                      </p>
                    </div>
                  )}

                  <div className="aud-mobile-card-footer">
                    {aud.status === "Requested" && (
                      <button
                        type="button"
                        onClick={() => {
                          setRelayModalAud(aud);
                          setRelayNote(aud.note || "");
                        }}
                        className="aud-btn-primary"
                        style={{ width: "100%", justifyContent: "center" }}
                      >
                        <Send size={13} />
                        <span>Relay to Talent</span>
                      </button>
                    )}

                    {aud.status === "Relayed to Talent" && (
                      <button
                        type="button"
                        onClick={() => handleSimulateTalentUpload(aud.id)}
                        className="aud-btn-secondary"
                        style={{ width: "100%", justifyContent: "center" }}
                      >
                        <Upload size={13} />
                        <span>Simulate Upload</span>
                      </button>
                    )}

                    {aud.status === "Self-tape Received" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", width: "100%" }}>
                        <button
                          type="button"
                          onClick={() => setPreviewVideoModalAud(aud)}
                          className="aud-btn-secondary"
                          style={{ justifyContent: "center" }}
                        >
                          <Eye size={13} />
                          <span>Watch Video</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setForwardModalAud(aud);
                            setForwardNote("");
                          }}
                          className="aud-btn-primary"
                          style={{ justifyContent: "center" }}
                        >
                          <CheckCircle2 size={13} />
                          <span>Forward</span>
                        </button>
                      </div>
                    )}

                    {aud.status === "Forwarded to Organization" && (
                      <button
                        type="button"
                        onClick={() => setPreviewVideoModalAud(aud)}
                        className="aud-btn-secondary"
                        style={{ width: "100%", justifyContent: "center" }}
                      >
                        <Play size={13} />
                        <span>Watch Video</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* MODALS */}
      {/* Modal 1: Relay Audition Modal */}
      {relayModalAud && (
        <Modal
          isOpen={!!relayModalAud}
          onClose={() => setRelayModalAud(null)}
          title="Relay Audition Invitation to Talent"
        >
          <form onSubmit={handleRelay} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "14px", color: "#5A584F", margin: 0, lineHeight: 1.6, fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
              Verify script guidelines, audition scene requirements, and relay the invitation to{" "}
              <strong style={{ color: "#2B2D2A" }}>{relayModalAud.talentName}</strong>.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
                Audition Note &amp; Instructions to Artist
              </label>
              <textarea
                rows={4}
                value={relayNote}
                onChange={(e) => setRelayNote(e.target.value)}
                placeholder="Include dialogue scene lines, character nuances, lighting advice..."
                className="aud-modal-textarea"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setRelayModalAud(null)}
                className="aud-modal-cancel-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="aud-btn-primary"
                style={{ padding: "0 20px", height: "42px" }}
              >
                Relay to Artist
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 2: Preview Video Modal */}
      {previewVideoModalAud && (
        <Modal
          isOpen={!!previewVideoModalAud}
          onClose={() => setPreviewVideoModalAud(null)}
          title={`Self-Tape Review: ${previewVideoModalAud.talentName}`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <VideoPlayer
              src={previewVideoModalAud.selfTapeUrl}
              fileName={`${previewVideoModalAud.talentName}-SelfTape.mp4`}
              height="280px"
            />

            <div className="aud-video-note-box">
              <strong style={{ color: "#6E5420", fontSize: "13px", display: "block", marginBottom: "4px" }}>
                Talent Submission Note:
              </strong>
              <p style={{ color: "#5A584F", fontSize: "13px", margin: 0, lineHeight: 1.5 }}>
                {previewVideoModalAud.note || "Recorded in studio natural light according to dialogue scene guidelines."}
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setPreviewVideoModalAud(null)}
                className="aud-modal-cancel-btn"
              >
                Close Player
              </button>
              {previewVideoModalAud.status === "Self-tape Received" && (
                <button
                  type="button"
                  onClick={() => {
                    const target = previewVideoModalAud;
                    setPreviewVideoModalAud(null);
                    setForwardModalAud(target);
                    setForwardNote("");
                  }}
                  className="aud-btn-primary"
                  style={{ padding: "0 20px", height: "42px" }}
                >
                  <CheckCircle2 size={14} />
                  <span>Forward to Studio</span>
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 3: Forward to Organization Modal */}
      {forwardModalAud && (
        <Modal
          isOpen={!!forwardModalAud}
          onClose={() => setForwardModalAud(null)}
          title="Forward Verified Self-Tape to Organization"
        >
          <form onSubmit={handleForward} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "14px", color: "#5A584F", margin: 0, lineHeight: 1.6, fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
              Confirm forwarding self-tape from <strong style={{ color: "#2B2D2A" }}>{forwardModalAud.talentName}</strong> to the organization. This unlocks the video player on the organization's shortlist board.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
                Moderation Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={forwardNote}
                onChange={(e) => setForwardNote(e.target.value)}
                placeholder="Self-tape verified for audio clarity and script adherence."
                className="aud-modal-textarea"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setForwardModalAud(null)}
                className="aud-modal-cancel-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="aud-btn-primary"
                style={{ padding: "0 20px", height: "42px" }}
              >
                Forward &amp; Unlock for Studio
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Embedded CSS */}
      <style jsx global>{`
        /* Tabs Row */
        .aud-tabs-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .aud-tab-btn {
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
        .aud-tab-btn:hover:not(.aud-tab-active) {
          border-color: #8A6B2E !important;
          background-color: #F3EFE6 !important;
          color: #2B2D2A !important;
        }
        .aud-tab-active {
          background-color: #8A6B2E !important;
          color: #FFFFFF !important;
          border-color: #8A6B2E !important;
          box-shadow: 0 2px 8px rgba(138, 107, 46, 0.22);
        }

        .aud-tab-badge {
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
        .aud-tab-badge-active {
          background-color: rgba(255, 255, 255, 0.22) !important;
          color: #FFFFFF !important;
        }

        /* Toolbar Row */
        .aud-toolbar-row {
          display: flex;
          align-items: center;
          justifyContent: space-between;
          gap: 16px;
          width: 100%;
          flex-wrap: wrap;
        }

        .aud-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1 1 280px;
          max-width: 440px;
        }

        .aud-search-input {
          width: 100%;
          height: 44px;
          min-height: 44px;
          padding-left: 42px;
          padding-right: 38px;
          border: 1px solid #D9D2C0;
          background-color: #FFFFFF;
          border-radius: 10px;
          color: #2B2D2A;
          font-size: 14px;
          font-family: var(--font-body), 'Inter', sans-serif;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.16s ease, box-shadow 0.16s ease;
        }
        .aud-search-input:focus {
          border-color: #8A6B2E !important;
          box-shadow: 0 0 0 3px rgba(138, 107, 46, 0.18) !important;
        }
        .aud-search-input::placeholder {
          color: #6B6A63;
        }

        .aud-search-clear-btn {
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
        .aud-search-clear-btn:hover {
          color: #2B2D2A;
          background-color: #F3EFE6;
        }

        .aud-org-filter-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .aud-org-label {
          font-size: 13px;
          font-weight: 600;
          color: #2B2D2A;
          white-space: nowrap;
          font-family: var(--font-body), 'Inter', sans-serif;
        }

        .aud-org-select {
          height: 44px;
          background-color: #FFFFFF;
          border: 1px solid #D9D2C0;
          border-radius: 10px;
          padding: 0 16px;
          font-size: 14px;
          color: #2B2D2A;
          outline: none;
          cursor: pointer;
          font-family: var(--font-body), 'Inter', sans-serif;
          transition: border-color 0.16s ease, box-shadow 0.16s ease;
        }
        .aud-org-select:focus {
          border-color: #8A6B2E;
          box-shadow: 0 0 0 3px rgba(138, 107, 46, 0.18);
        }

        /* Empty State */
        .aud-empty-card {
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
        .aud-empty-icon-wrap {
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
        .aud-table-card {
          border-radius: 16px;
          overflow: hidden;
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          box-shadow: 0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06);
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .aud-table-scroll {
          overflow-x: auto;
          width: 100%;
          max-width: 100%;
          -webkit-overflow-scrolling: touch;
        }

        .aud-table {
          width: 100%;
          min-width: 1020px;
          border-collapse: collapse;
          text-align: left;
          font-size: 14px;
          font-family: var(--font-body), 'Inter', sans-serif;
        }

        .aud-thead-row {
          background-color: #F3EFE6;
          border-bottom: 1px solid #E8E2D4;
        }

        .aud-thead-row th {
          padding: 14px 20px;
          color: #5A584F;
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          white-space: nowrap;
          position: sticky;
          top: 0;
          background-color: #F3EFE6;
          z-index: 5;
        }

        .aud-tbody-row {
          border-bottom: 1px solid #E8E2D4;
          transition: background-color 0.16s ease;
          background-color: #FFFFFF;
        }
        .aud-tbody-row:hover {
          background-color: #FAF9F7 !important;
        }

        .aud-candidate-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #F3EFE6;
          color: #8A6B2E;
          border: 1.5px solid #E8E2D4;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
        }

        .aud-candidate-name {
          color: #2B2D2A;
          display: block;
          font-size: 15px;
          font-weight: 600;
          line-height: 1.3;
        }

        .aud-candidate-date {
          font-size: 12px;
          color: #5A584F;
          white-space: nowrap;
          display: block;
          margin-top: 2px;
        }

        .aud-opp-title {
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

        .aud-studio-line {
          font-size: 13px;
          color: #5A584F;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .aud-truncate-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }

        .aud-type-chip {
          font-size: 12px;
          font-weight: 600;
          color: #6E5420;
          background-color: rgba(201, 165, 92, 0.16);
          padding: 3px 8px;
          border-radius: 6px;
          white-space: nowrap;
        }

        .aud-actions-cluster {
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          white-space: nowrap;
        }

        .aud-btn-primary {
          height: 40px;
          min-height: 40px;
          padding: 0 16px;
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
        .aud-btn-primary:hover {
          background-color: #6E5420;
          border-color: #6E5420;
        }

        .aud-btn-secondary {
          height: 40px;
          min-height: 40px;
          padding: 0 16px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          cursor: pointer;
          background-color: #FFFFFF;
          color: #8A6B2E;
          border: 1px solid #8A6B2E;
          transition: all 0.16s ease;
          font-family: var(--font-body), 'Inter', sans-serif;
        }
        .aud-btn-secondary:hover {
          background-color: #F3EFE6;
        }

        .aud-modal-cancel-btn {
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
        .aud-modal-cancel-btn:hover {
          background-color: #F3EFE6;
          color: #2B2D2A;
        }

        /* Mobile Cards Layout (< 768px) */
        .aud-mobile-cards-stack {
          display: none;
          flex-direction: column;
          gap: 14px;
          width: 100%;
        }

        .aud-mobile-card {
          border-radius: 16px;
          border: 1px solid #E8E2D4;
          background-color: #FFFFFF;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 2px 6px rgba(43, 45, 42, 0.04);
        }

        .aud-mobile-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .aud-mobile-card-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .aud-mobile-card-instructions {
          background-color: #FAF9F7;
          border: 1px solid #E8E2D4;
          border-radius: 12px;
          padding: 12px 14px;
        }

        .aud-mobile-card-footer {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-top: 4px;
        }

        /* Modal Styles */
        .aud-modal-textarea {
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
        .aud-modal-textarea:focus {
          border-color: #8A6B2E;
          box-shadow: 0 0 0 3px rgba(138, 107, 46, 0.18);
        }

        .aud-video-note-box {
          background-color: #FAF9F7;
          border: 1px solid #E8E2D4;
          border-radius: 12px;
          padding: 14px 16px;
        }

        /* RESPONSIVE BREAKPOINTS */
        @media (max-width: 767.98px) {
          .aud-table-card {
            display: none !important;
          }
          .aud-mobile-cards-stack {
            display: flex !important;
          }

          .aud-toolbar-row {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .aud-search-wrap {
            max-width: 100% !important;
          }
          .aud-org-filter-wrap {
            width: 100%;
            justify-content: space-between;
          }
          .aud-org-select {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}
