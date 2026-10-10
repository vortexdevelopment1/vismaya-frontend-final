"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Video,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Building2,
  Users,
  Search,
  Filter,
  Eye,
  Send,
  ArrowRight,
  ShieldCheck,
  Film,
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

  // Helper for stage badge styling
  const getStagePill = (status) => {
    const isForwarded = status === "Forwarded to Organization";
    const isReceived = status === "Self-tape Received";
    const isRelayed = status === "Relayed to Talent";

    let bg = "rgba(255, 255, 255, 0.06)";
    let color = "#eceaf5";
    let border = "rgba(255, 255, 255, 0.14)";

    if (isForwarded) {
      bg = "rgba(52, 211, 153, 0.14)";
      color = "var(--status-green)";
      border = "rgba(52, 211, 153, 0.32)";
    } else if (isReceived) {
      bg = "rgba(251, 191, 36, 0.14)";
      color = "#fbbf24";
      border = "rgba(251, 191, 36, 0.35)";
    } else if (isRelayed) {
      bg = "rgba(138, 180, 255, 0.14)";
      color = "#8ab4ff";
      border = "rgba(138, 180, 255, 0.35)";
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
        <div style={{ height: "420px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "16px", animation: "pulse 1.5s infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Page Header */}
      <PageHeader
        title="Auditions & Self-Tapes Channel"
        subtitle="Vismaya moderation channel: relay audition briefs to talent, review uploaded self-tapes, and forward verified videos to organizations."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Auditions & Self-Tapes" },
        ]}
        style={{ marginBottom: "6px" }}
      />

      {/* A. Status Tabs Row: Pill tabs with count badges */}
      <div className="aud-tabs-row" role="tablist" aria-label="Audition stage filters">
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

      {/* A. Compact Toolbar: Search on left, Organization filter on right */}
      <div className="aud-toolbar-row">
        {/* Search Input: max-width ~420px, height 40px */}
        <div
          className="aud-search-wrap"
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
            placeholder="Search candidate name, opportunity, studio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="aud-search-input"
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
            aria-label="Search auditions"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="aud-search-clear-btn"
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

        {/* Organization Filter */}
        <div className="aud-org-filter-wrap">
          <span className="aud-org-label">Organization:</span>
          <select
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            className="aud-org-select"
            aria-label="Filter by organization"
          >
            <option value="ALL" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>
              All Organizations
            </option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id} style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Auditions Content: Desktop Table & Mobile Cards */}
      {filteredAuditions.length === 0 ? (
        <div className="aud-empty-card card-surface">
          <div className="aud-empty-icon-wrap">
            <Video size={36} style={{ color: "var(--gold)" }} />
          </div>
          <h3 style={{ fontSize: "1.1rem", color: "#eceaf5", fontWeight: 700, margin: "0 0 6px 0" }}>
            No auditions in this category
          </h3>
          <p style={{ color: "#a3acc2", fontSize: "0.85rem", margin: 0, maxWidth: "440px" }}>
            {searchQuery.trim()
              ? `No audition records found matching "${searchQuery}". Try adjusting your search query.`
              : statusFilter === "ALL"
              ? "No audition or interview requests found on the platform."
              : `No auditions currently in "${tabs.find((t) => t.key === statusFilter)?.label || statusFilter}".`}
          </p>
        </div>
      ) : (
        <>
          {/* B. Desktop Table View (>= 768px) */}
          <div className="aud-table-card card-surface">
            <div className="aud-table-scroll">
              <table className="aud-table">
                <thead>
                  <tr className="aud-thead-row">
                    <th style={{ width: "22%" }}>Talent / Candidate</th>
                    <th style={{ width: "24%" }}>Opportunity &amp; Studio</th>
                    <th style={{ width: "25%" }}>Type &amp; Instructions</th>
                    <th style={{ width: "14%" }}>Audition Stage</th>
                    <th style={{ width: "15%", textAlign: "right" }}>Moderation Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditions.map((aud) => {
                    const opp = getOpportunityForAud(aud.opportunityId);
                    const org = getOrgForAud(aud.orgId);

                    const isRequested = aud.status === "Requested";
                    const isRelayed = aud.status === "Relayed to Talent";
                    const isReceived = aud.status === "Self-tape Received";
                    const isForwarded = aud.status === "Forwarded to Organization";

                    return (
                      <tr key={aud.id} className="aud-tbody-row">
                        {/* 1. Candidate Column */}
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div className="aud-candidate-avatar">
                              {(aud.talentName || "T")[0]}
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
                        <td style={{ padding: "14px 18px" }}>
                          <div title={opp?.title || "Opportunity"} className="aud-opp-title">
                            {opp?.title || "Opportunity"}
                          </div>
                          <div title={org?.name || "Organization"} className="aud-studio-line">
                            <Building2 size={12} style={{ color: "#7c869e", flexShrink: 0 }} />
                            <span className="aud-truncate-text">{org?.name || "Organization"}</span>
                          </div>
                        </td>

                        {/* 3. Type & Instructions Column */}
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span className="aud-type-chip">
                              {aud.type}
                            </span>
                          </div>
                          <p title={aud.note || "No specific instructions"} className="aud-instructions-text">
                            {aud.note || "No specific instructions provided."}
                          </p>
                        </td>

                        {/* 4. Audition Stage Column */}
                        <td style={{ padding: "14px 18px" }}>
                          {getStagePill(aud.status)}
                        </td>

                        {/* 5. Moderation Action Column */}
                        <td style={{ padding: "14px 18px", textAlign: "right" }}>
                          <div className="aud-actions-cluster">
                            {/* 1. If Requested -> Relay to Talent */}
                            {isRequested && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRelayModalAud(aud);
                                  setRelayNote(aud.note || "");
                                }}
                                className="btn-primary aud-action-btn"
                              >
                                <Send size={13} />
                                <span>Relay to Talent</span>
                              </button>
                            )}

                            {/* 2. If Relayed -> Simulate Upload (Demo) */}
                            {isRelayed && (
                              <button
                                type="button"
                                onClick={() => handleSimulateTalentUpload(aud.id)}
                                className="btn-secondary aud-action-btn"
                                title="Simulate talent submitting self-tape"
                              >
                                <Upload size={13} />
                                <span>Simulate Upload</span>
                              </button>
                            )}

                            {/* 3. If Received -> Preview Video & Forward */}
                            {isReceived && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setPreviewVideoModalAud(aud)}
                                  className="btn-secondary aud-action-btn"
                                >
                                  <Play size={13} />
                                  <span>Preview Video</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setForwardModalAud(aud);
                                    setForwardNote("");
                                  }}
                                  className="btn-primary aud-action-btn"
                                >
                                  <CheckCircle2 size={13} />
                                  <span>Forward</span>
                                </button>
                              </>
                            )}

                            {/* 4. If Forwarded -> Watch Video */}
                            {isForwarded && (
                              <button
                                type="button"
                                onClick={() => setPreviewVideoModalAud(aud)}
                                className="btn-secondary aud-action-btn aud-btn-gold-outline"
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

          {/* E. Mobile Cards View (< 768px) */}
          <div className="aud-mobile-cards-stack">
            {filteredAuditions.map((aud) => {
              const opp = getOpportunityForAud(aud.opportunityId);
              const org = getOrgForAud(aud.orgId);

              const isRequested = aud.status === "Requested";
              const isRelayed = aud.status === "Relayed to Talent";
              const isReceived = aud.status === "Self-tape Received";
              const isForwarded = aud.status === "Forwarded to Organization";

              return (
                <div key={aud.id} className="aud-mobile-card card-surface">
                  {/* Card Header: Avatar, Name, Stage */}
                  <div className="aud-mobile-card-top">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                      <div className="aud-candidate-avatar">
                        {(aud.talentName || "T")[0]}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <strong className="aud-candidate-name" style={{ fontSize: "0.95rem" }}>
                          {aud.talentName}
                        </strong>
                        <span className="aud-candidate-date">
                          Requested {formatDate(aud.requestedAt)}
                        </span>
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {getStagePill(aud.status)}
                    </div>
                  </div>

                  {/* Card Body: Opportunity & Studio */}
                  <div className="aud-mobile-card-body">
                    <div className="aud-opp-title" style={{ fontSize: "0.925rem" }}>
                      {opp?.title || "Opportunity"}
                    </div>
                    <div className="aud-studio-line">
                      <Building2 size={12} style={{ color: "#7c869e", flexShrink: 0 }} />
                      <span>{org?.name || "Organization"}</span>
                    </div>
                  </div>

                  {/* Card Instructions */}
                  <div className="aud-mobile-card-instructions">
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <span className="aud-type-chip">
                        {aud.type}
                      </span>
                    </div>
                    <p className="aud-instructions-text" style={{ WebkitLineClamp: 3 }}>
                      {aud.note || "No specific instructions provided."}
                    </p>
                  </div>

                  {/* Card Footer: Action buttons in 2-col grid */}
                  <div className="aud-mobile-card-footer">
                    {isRequested && (
                      <button
                        type="button"
                        onClick={() => {
                          setRelayModalAud(aud);
                          setRelayNote(aud.note || "");
                        }}
                        className="btn-primary"
                        style={{ width: "100%", height: "38px", justifyContent: "center", fontSize: "0.8rem" }}
                      >
                        <Send size={13} />
                        <span>Relay to Talent</span>
                      </button>
                    )}

                    {isRelayed && (
                      <button
                        type="button"
                        onClick={() => handleSimulateTalentUpload(aud.id)}
                        className="btn-secondary"
                        style={{ width: "100%", height: "38px", justifyContent: "center", fontSize: "0.8rem" }}
                      >
                        <Upload size={13} />
                        <span>Simulate Upload</span>
                      </button>
                    )}

                    {isReceived && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", width: "100%" }}>
                        <button
                          type="button"
                          onClick={() => setPreviewVideoModalAud(aud)}
                          className="btn-secondary"
                          style={{ height: "38px", justifyContent: "center", fontSize: "0.8rem" }}
                        >
                          <Play size={13} />
                          <span>Preview Video</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setForwardModalAud(aud);
                            setForwardNote("");
                          }}
                          className="btn-primary"
                          style={{ height: "38px", justifyContent: "center", fontSize: "0.8rem" }}
                        >
                          <CheckCircle2 size={13} />
                          <span>Forward</span>
                        </button>
                      </div>
                    )}

                    {isForwarded && (
                      <button
                        type="button"
                        onClick={() => setPreviewVideoModalAud(aud)}
                        className="btn-secondary aud-btn-gold-outline"
                        style={{ width: "100%", height: "38px", justifyContent: "center", fontSize: "0.8rem" }}
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

      {/* C. MODALS */}

      {/* Modal 1: Relay to Talent */}
      {relayModalAud && (
        <Modal
          isOpen={!!relayModalAud}
          onClose={() => setRelayModalAud(null)}
          title={`Relay Audition Instructions to ${relayModalAud.talentName}`}
        >
          <form onSubmit={handleRelay} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "0.875rem", color: "#a3acc2", margin: 0, lineHeight: 1.5 }}>
              The Vismaya Casting Desk will verify talent availability and send the official brief instructions to <strong style={{ color: "#eceaf5" }}>{relayModalAud.talentName}</strong>.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "0.825rem", fontWeight: "600", color: "#eceaf5" }}>
                  Audition Directions &amp; Scene Details *
                </label>
                <span style={{ fontSize: "0.725rem", color: "#7c869e" }}>
                  {relayNote.length} characters
                </span>
              </div>
              <textarea
                rows={4}
                required
                value={relayNote}
                onChange={(e) => setRelayNote(e.target.value)}
                className="aud-modal-textarea"
                placeholder="Specify audition dialogue, scene sides, recording framing, and submission deadline..."
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setRelayModalAud(null)}
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
                Relay to Talent
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 2: Video Preview Modal */}
      {previewVideoModalAud && (
        <Modal
          isOpen={!!previewVideoModalAud}
          onClose={() => setPreviewVideoModalAud(null)}
          title={`Self-Tape Preview: ${previewVideoModalAud.talentName}`}
          maxWidth="640px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* 16:9 Video Player */}
            <VideoPlayer
              src={previewVideoModalAud.selfTapeUrl}
              fileName={`${previewVideoModalAud.talentName}-SelfTape.mp4`}
              height="280px"
            />

            <div className="aud-video-note-box">
              <strong style={{ color: "var(--gold)", fontSize: "0.825rem", display: "block", marginBottom: "4px" }}>
                Talent Submission Note:
              </strong>
              <p style={{ color: "#a3acc2", fontSize: "0.825rem", margin: 0, lineHeight: 1.45 }}>
                {previewVideoModalAud.note || "Recorded in studio natural light according to dialogue scene guidelines."}
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setPreviewVideoModalAud(null)}
                className="btn-secondary"
                style={{ borderRadius: "10px", padding: "8px 16px" }}
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
                  className="btn-primary"
                  style={{ borderRadius: "10px", padding: "8px 18px" }}
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
            <p style={{ fontSize: "0.875rem", color: "#a3acc2", margin: 0, lineHeight: 1.5 }}>
              Confirm forwarding self-tape from <strong style={{ color: "#eceaf5" }}>{forwardModalAud.talentName}</strong> to the organization. This unlocks the video player on the organization's shortlist board.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.825rem", fontWeight: "600", color: "#eceaf5" }}>
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
                className="btn-secondary"
                style={{ borderRadius: "10px", padding: "8px 16px" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ borderRadius: "10px", padding: "8px 18px" }}
              >
                Forward &amp; Unlock for Studio
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
        .aud-tabs-row {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 2px;
        }
        .aud-tabs-row::-webkit-scrollbar {
          display: none;
        }

        .aud-tab-btn {
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
        .aud-tab-btn:hover:not(.aud-tab-active) {
          background-color: rgba(255, 255, 255, 0.08);
          color: #eceaf5;
          border-color: rgba(255, 255, 255, 0.2);
        }
        .aud-tab-active {
          background: linear-gradient(135deg, #ffd54a 0%, #ffbc00 100%) !important;
          color: #1a1300 !important;
          border-color: #ffd54a !important;
          box-shadow: 0 4px 12px rgba(255, 188, 0, 0.25);
        }

        .aud-tab-badge {
          padding: 1px 7px;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 700;
          background-color: rgba(255, 255, 255, 0.1);
          color: #eceaf5;
        }
        .aud-tab-badge-active {
          background-color: rgba(26, 19, 0, 0.25) !important;
          color: #1a1300 !important;
        }

        /* Toolbar Row (No big card, simple bottom border) */
        .aud-toolbar-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          width: 100%;
          flex-wrap: wrap;
        }

        .aud-search-wrap {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
        }

        .aud-search-input {
          transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
        }
        .aud-search-input:hover {
          background-color: rgba(255, 255, 255, 0.075) !important;
          border-color: rgba(255, 255, 255, 0.22) !important;
        }
        .aud-search-input:focus {
          border-color: #ffbc00 !important;
          box-shadow: 0 0 0 3px rgba(255, 188, 0, 0.15) !important;
          background-color: rgba(255, 255, 255, 0.075) !important;
        }
        .aud-search-input::placeholder {
          color: #7e89a3;
          font-size: 0.825rem;
        }

        .aud-search-clear-btn:hover {
          color: #eceaf5 !important;
          background-color: rgba(255, 255, 255, 0.1) !important;
        }

        .aud-org-filter-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .aud-org-label {
          font-size: 0.825rem;
          font-weight: 600;
          color: #a3acc2;
          white-space: nowrap;
        }

        .aud-org-select {
          height: 40px;
          background-color: rgba(255, 255, 255, 0.055);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 12px;
          padding: 0 14px;
          font-size: 0.825rem;
          color: #eceaf5;
          outline: none;
          cursor: pointer;
          transition: border-color 0.15s ease;
        }
        .aud-org-select:focus {
          border-color: #ffbc00;
          box-shadow: 0 0 0 3px rgba(255, 188, 0, 0.15);
        }

        /* Empty State */
        .aud-empty-card {
          border-radius: 16px;
          padding: 56px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .aud-empty-icon-wrap {
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
        .aud-table-card {
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
          width: 100%;
        }

        .aud-table-scroll {
          overflow-x: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
        }

        .aud-table {
          width: 100%;
          min-width: 1080px;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.85rem;
        }

        .aud-thead-row {
          background-color: #0a0f19;
          border-bottom: 1px solid rgba(255, 255, 255, 0.10);
        }

        .aud-thead-row th {
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

        .aud-tbody-row {
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          transition: background-color 0.15s ease;
        }
        .aud-tbody-row:hover {
          background-color: rgba(255, 255, 255, 0.035) !important;
        }

        .aud-candidate-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 188, 0, 0.12);
          color: var(--gold);
          border: 1px solid rgba(255, 188, 0, 0.28);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.85rem;
          flex-shrink: 0;
        }

        .aud-candidate-name {
          color: #eceaf5;
          display: block;
          font-size: 0.875rem;
          line-height: 1.3;
        }

        .aud-candidate-date {
          font-size: 0.75rem;
          color: #7e89a3;
          white-space: nowrap;
          display: block;
          margin-top: 1px;
        }

        .aud-opp-title {
          font-weight: 600;
          color: #eceaf5;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 260px;
        }

        .aud-studio-line {
          font-size: 0.775rem;
          color: #a3acc2;
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 240px;
        }

        .aud-truncate-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }

        .aud-type-chip {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--gold);
          background-color: rgba(255, 188, 0, 0.12);
          border: 1px solid rgba(255, 188, 0, 0.3);
          padding: 2px 7px;
          border-radius: 6px;
          white-space: nowrap;
        }

        .aud-instructions-text {
          font-size: 0.775rem;
          color: #a3acc2;
          margin: 3px 0 0 0;
          max-width: 280px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .aud-actions-cluster {
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          width: 100%;
        }

        .aud-action-btn {
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
          transition: all 0.15s ease;
        }

        .aud-btn-gold-outline {
          color: var(--gold) !important;
          border-color: rgba(255, 188, 0, 0.35) !important;
          background-color: rgba(255, 188, 0, 0.08) !important;
        }
        .aud-btn-gold-outline:hover {
          background-color: rgba(255, 188, 0, 0.16) !important;
          border-color: var(--gold) !important;
        }

        /* Mobile Cards Layout (< 768px) */
        .aud-mobile-cards-stack {
          display: none;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .aud-mobile-card {
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background-color: rgba(255, 255, 255, 0.035);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .aud-mobile-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .aud-mobile-card-body {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .aud-mobile-card-instructions {
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 10px 12px;
        }

        .aud-mobile-card-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 4px;
        }

        /* Modal Styles */
        .aud-modal-textarea {
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
        .aud-modal-textarea:focus {
          border-color: #ffbc00;
        }

        .aud-video-note-box {
          background-color: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 12px 14px;
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
            gap: 10px;
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
