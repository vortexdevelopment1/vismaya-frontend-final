"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Layers,
  Filter,
  ShieldAlert,
  Link as LinkIcon,
  Star,
  Eye,
  AlertTriangle,
  Loader2,
  Flag,
  Video,
  FileText,
  Ban,
  RotateCcw,
} from "lucide-react";
import { useAdmin } from "@/lib/admin/AdminContext";
import PageHeader from "@/components/shared/PageHeader";
import Tabs from "@/components/shared/Tabs";
import EmptyState from "@/components/shared/EmptyState";
import MediaPreviewModal from "@/components/admin/MediaPreviewModal";
import ReasonModal from "@/components/admin/ReasonModal";
import Modal from "@/components/shared/Modal";
import { adminService } from "@/lib/api/services/adminService";
import { isRealMode } from "@/lib/api/config";

export default function ContentModerationPage() {
  const adminCtx = useAdmin();
  const {
    mediaQueue = [],
    approveMedia,
    rejectMedia,
    pendingMediaCount,
    refreshReports,
    addToast,
  } = adminCtx || {};

  const [realMedia, setRealMedia] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [mediaCounts, setMediaCounts] = useState({ pending: 0, approved: 0, rejected: 0, all: 0 });
  const [loading, setLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Pending");

  // Modals & Actions
  const [previewMedia, setPreviewMedia] = useState(null);
  const [rejectingMedia, setRejectingMedia] = useState(null);
  const [feedbackToast, setFeedbackToast] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Report resolution / dismiss modal state
  const [dismissingReport, setDismissingReport] = useState(null);
  const [dismissNote, setDismissNote] = useState("");
  const [resolvingReport, setResolvingReport] = useState(null);
  const [resolveMediaAction, setResolveMediaAction] = useState("remove");
  const [resolveNotes, setResolveNotes] = useState("");

  const showToast = (msg, type = "success") => {
    const message = typeof msg === "string" ? msg : msg?.message || "Notification";
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 3500);
    if (addToast) {
      addToast({
        type,
        title: type === "error" ? "Error" : "Success",
        message,
      });
    }
  };

  const loadMediaData = useCallback(async (tabKey = activeTab) => {
    if (!isRealMode("admin")) return;
    try {
      setLoading(true);
      let stateFilter = "admin_review";
      if (tabKey === "Approved") stateFilter = "live";
      else if (tabKey === "Rejected") stateFilter = "restricted";
      else if (tabKey === "all") stateFilter = "all";

      const res = await adminService.getAdminMedia({ state: stateFilter });
      const list = res?.data || res?.media || [];
      setRealMedia(Array.isArray(list) ? list : []);
      if (res?.counts) {
        setMediaCounts(res.counts);
      }
    } catch (err) {
      console.error("Error loading admin media:", err);
      setRealMedia([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const loadReportsData = useCallback(async () => {
    if (!isRealMode("admin")) return;
    try {
      setReportsLoading(true);
      const res = await adminService.getReports();
      const list = res?.data || res?.reports || [];
      setReportsList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error loading moderation reports:", err);
      setReportsList([]);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "Reports") {
      loadReportsData();
    } else {
      loadMediaData(activeTab);
    }
  }, [activeTab, loadMediaData, loadReportsData]);

  // Initial fetch for both counts on mount
  useEffect(() => {
    if (isRealMode("admin")) {
      loadMediaData("Pending");
      loadReportsData();
    }
  }, [loadMediaData, loadReportsData]);

  const openReportsCount = reportsList.filter(
    (r) => (r.status || "").toLowerCase() === "open"
  ).length;

  const tabs = [
    { key: "Pending", label: "Pending Review", count: isRealMode("admin") ? mediaCounts.pending : mediaQueue.filter((m) => m.status === "Pending").length },
    { key: "Approved", label: "Approved", count: isRealMode("admin") ? mediaCounts.approved : mediaQueue.filter((m) => m.status === "Approved").length },
    { key: "Rejected", label: "Rejected / Restricted", count: isRealMode("admin") ? mediaCounts.rejected : mediaQueue.filter((m) => m.status === "Rejected").length },
    { key: "all", label: "All Content", count: isRealMode("admin") ? mediaCounts.all : mediaQueue.length },
    { key: "Reports", label: "Reports", count: openReportsCount },
  ];

  const effectiveMedia = isRealMode("admin") ? realMedia : mediaQueue;

  // Approve Media Action
  const handleApprove = async (id) => {
    if (!id || actionLoading[id]) return;
    setActionLoading((prev) => ({ ...prev, [id]: "approve" }));
    if (isRealMode("admin")) {
      try {
        await adminService.reviewMediaItem(id, { action: "approve" });
        showToast("Content item approved successfully.", "success");
        await loadMediaData(activeTab);
        if (refreshReports) refreshReports();
      } catch (err) {
        showToast(err?.response?.data?.message || err?.message || "Failed to approve", "error");
      } finally {
        setActionLoading((prev) => {
          const n = { ...prev };
          delete n[id];
          return n;
        });
      }
    } else {
      if (approveMedia) approveMedia(id);
      showToast("Content item approved.", "success");
      setActionLoading((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
    }
    if (previewMedia && (previewMedia.id === id || previewMedia._id === id)) {
      setPreviewMedia(null);
    }
  };

  // Reject / Remove Action
  const handleRejectClick = (media) => {
    setModalError("");
    setRejectingMedia(media);
  };

  const handleRejectSubmit = async (reason) => {
    if (!rejectingMedia) return;
    const id = rejectingMedia.id || rejectingMedia._id;
    if (!id || actionLoading[id]) return;
    setIsModalSubmitting(true);
    setModalError("");
    setActionLoading((prev) => ({ ...prev, [id]: "reject" }));
    if (isRealMode("admin")) {
      try {
        await adminService.reviewMediaItem(id, {
          action: "reject",
          moderationReason: reason,
          notes: reason,
        });
        showToast("Content item rejected and removed. Talent notified with reason.", "success");
        setRejectingMedia(null);
        await loadMediaData(activeTab);
        if (refreshReports) refreshReports();
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || "Failed to reject";
        setModalError(msg);
        showToast(msg, "error");
      } finally {
        setIsModalSubmitting(false);
        setActionLoading((prev) => {
          const n = { ...prev };
          delete n[id];
          return n;
        });
      }
    } else {
      if (rejectMedia) rejectMedia(id, reason);
      showToast("Content item rejected and removed.", "success");
      setRejectingMedia(null);
      setIsModalSubmitting(false);
      setActionLoading((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
    }
    if (previewMedia && (previewMedia.id === id || previewMedia._id === id)) {
      setPreviewMedia(null);
    }
  };

  // Restrict Action
  const handleRestrict = async (media) => {
    const id = media._id || media.id;
    if (!id || actionLoading[id]) return;
    setActionLoading((prev) => ({ ...prev, [id]: "restrict" }));
    if (isRealMode("admin")) {
      try {
        await adminService.reviewMediaItem(id, {
          action: "restrict",
          moderationReason: "Restricted by admin policy review",
          notes: "Restricted by admin",
        });
        showToast("Media restricted to industry-only view.", "success");
        await loadMediaData(activeTab);
      } catch (err) {
        showToast(err?.response?.data?.message || err?.message || "Failed to restrict", "error");
      } finally {
        setActionLoading((prev) => {
          const n = { ...prev };
          delete n[id];
          return n;
        });
      }
    } else {
      showToast("Media restricted to industry-only view.", "success");
      setActionLoading((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
    }
  };

  // Featured Work Toggle (Spec §15: Max 4 selected by Vismaya)
  const handleToggleFeatured = async (media) => {
    const id = media._id || media.id;
    if (!id || actionLoading[id]) return;
    const isCurrentlyFeatured = Boolean(media.isFeatured ?? media.isFeaturedWork);
    const nextState = !isCurrentlyFeatured;
    setActionLoading((prev) => ({ ...prev, [id]: "feature" }));
    if (isRealMode("admin")) {
      try {
        await adminService.setMediaFeaturedWork(id, {
          isFeatured: nextState,
          isFeaturedWork: nextState,
        });
        showToast(nextState ? "Added to Featured Work." : "Removed from Featured Work.", "success");
        await loadMediaData(activeTab);
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || "Failed to update featured work";
        showToast(msg, "error");
      } finally {
        setActionLoading((prev) => {
          const n = { ...prev };
          delete n[id];
          return n;
        });
      }
    } else {
      showToast(nextState ? "Added to Featured Work." : "Removed from Featured Work.", "success");
      setActionLoading((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
    }
  };

  // Copyright Dispute Toggle (Spec §40: Hide disputed media, restore on resolution)
  const handleToggleDispute = async (media) => {
    const id = media._id || media.id;
    if (!id || actionLoading[id]) return;
    const isCurrentlyDisputed = media.disputeState === "disputed";
    const nextState = isCurrentlyDisputed ? "resolved" : "disputed";
    setActionLoading((prev) => ({ ...prev, [id]: "dispute" }));
    if (isRealMode("admin")) {
      try {
        await adminService.handleCopyrightDispute(id, {
          disputeState: nextState,
          disputeReason: isCurrentlyDisputed ? "Resolved by admin" : "Third party copyright claim"
        });
        showToast(nextState === "disputed" ? "Media hidden due to copyright dispute." : "Media dispute resolved and restored.", "success");
        await loadMediaData(activeTab);
      } catch (err) {
        showToast(err?.response?.data?.message || err?.message || "Failed to update dispute status", "error");
      } finally {
        setActionLoading((prev) => {
          const n = { ...prev };
          delete n[id];
          return n;
        });
      }
    } else {
      showToast(nextState === "disputed" ? "Media hidden due to copyright dispute." : "Media dispute resolved and restored.", "success");
      setActionLoading((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
    }
  };

  // Dismiss Report
  const handleDismissReport = async () => {
    if (!dismissingReport) return;
    const id = dismissingReport._id || dismissingReport.id;
    setIsModalSubmitting(true);
    setModalError("");
    try {
      await adminService.reviewReport(id, {
        action: "dismiss",
        resolutionNotes: dismissNote || "Report dismissed after administrative review.",
      });
      showToast("Report dismissed.", "success");
      setDismissingReport(null);
      setDismissNote("");
      await loadReportsData();
      if (refreshReports) refreshReports();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to dismiss report";
      setModalError(msg);
      showToast(msg, "error");
    } finally {
      setIsModalSubmitting(false);
    }
  };

  // Resolve Report
  const handleResolveReport = async () => {
    if (!resolvingReport) return;
    const id = resolvingReport._id || resolvingReport.id;
    if (!resolveNotes.trim()) {
      setModalError("Please provide an administrative resolution note / reason.");
      return;
    }
    setIsModalSubmitting(true);
    setModalError("");
    try {
      await adminService.reviewReport(id, {
        action: "resolve",
        resolutionNotes: resolveNotes.trim(),
        mediaAction: resolveMediaAction,
      });
      showToast("Report resolved successfully. Reporter and owner notified.", "success");
      setResolvingReport(null);
      setResolveNotes("");
      await loadReportsData();
      if (refreshReports) refreshReports();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to resolve report";
      setModalError(msg);
      showToast(msg, "error");
    } finally {
      setIsModalSubmitting(false);
    }
  };

  const formatReasonLabel = (reason) => {
    if (!reason) return "Content Flag";
    return reason
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Toast Feedback */}
      {feedbackToast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: feedbackToast.type === "error" ? "#7A1C1C" : "#2B2D2A",
            color: "#FFFFFF",
            padding: "12px 20px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 600,
            zIndex: 1000,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {feedbackToast.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Content Moderation"
        subtitle="Review uploaded headshots, showreels, and external links against platform policy rules: photo standards, link validation, copyright disputes, and Featured Work selection."
        badge={`${(Number(mediaCounts?.pending) || 0) + (Number(openReportsCount) || 0)} Needing Action`}
      />

      {/* Spec Policy Guidance Card */}
      <div
        style={{
          background: "#FAF9F7",
          border: "1px solid #E8E2D4",
          borderRadius: "14px",
          padding: "16px 20px",
          display: "flex",
          flexWrap: "wrap",
          gap: "18px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <ShieldAlert size={22} style={{ color: "#8A6B2E", flexShrink: 0 }} />
          <div style={{ fontSize: "13px", color: "#5A584F" }}>
            <strong style={{ color: "#2B2D2A" }}>Policy Checklist:</strong> Headshots must show full face, no sunglasses, no filter distortion, no text overlays. Featured Work is curated by Vismaya (max 4 per profile). Disputed items are immediately hidden.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Reports Tab Content */}
      {activeTab === "Reports" ? (
        reportsLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <Loader2 size={32} style={{ color: "#8A6B2E", animation: "spin 1s linear infinite" }} />
          </div>
        ) : reportsList.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {reportsList.map((report) => {
              const repId = report._id || report.id;
              const isResolved = report.status === "resolved";
              const isDismissed = report.status === "dismissed";
              const isOpen = report.status === "open";
              const reporterName = report.reporterId?.name || report.reporterId?.email || "Community User";
              const dateStr = report.createdAt ? new Date(report.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
              }) : "Recent";

              return (
                <div
                  key={repId}
                  style={{
                    background: "#FFFFFF",
                    border: isOpen ? "1.5px solid #E8E2D4" : "1px solid #EAE7E1",
                    borderRadius: "14px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                    boxShadow: "0 2px 4px rgba(43,45,42,0.03)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          background: isOpen ? "#FDEDEC" : "#F3EFE6",
                          color: isOpen ? "#D9534F" : "#5A584F",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Flag size={20} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              background: isOpen ? "#FDEDEC" : isResolved ? "#EBF5ED" : "#F0EEEA",
                              color: isOpen ? "#D9534F" : isResolved ? "#2B5E3B" : "#5A584F",
                            }}
                          >
                            {report.status || "open"}
                          </span>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: "#2B2D2A" }}>
                            {formatReasonLabel(report.reason)}
                          </span>
                          <span style={{ fontSize: "12px", color: "#8A877D" }}>
                            · Reported on {dateStr}
                          </span>
                        </div>
                        <div style={{ fontSize: "12.5px", color: "#5A584F", marginTop: "4px" }}>
                          Reporter: <strong>{reporterName}</strong> · Target: <strong>{report.targetType}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Report Status / Actions */}
                    {isOpen && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setDismissingReport(report);
                            setDismissNote("");
                            setModalError("");
                          }}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            background: "#FFFFFF",
                            border: "1px solid #C4BEB1",
                            color: "#5A584F",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setResolvingReport(report);
                            setResolveNotes("");
                            setResolveMediaAction("remove");
                            setModalError("");
                          }}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            background: "#8A6B2E",
                            border: "none",
                            color: "#FFFFFF",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Resolve Report
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Target Preview Box */}
                  {report.targetPreview && (
                    <div
                      style={{
                        background: "#FAF9F7",
                        border: "1px solid #E8E2D4",
                        borderRadius: "10px",
                        padding: "12px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                      }}
                    >
                      {report.targetPreview.thumbnail || report.targetPreview.url ? (
                        <img
                          src={report.targetPreview.thumbnail || report.targetPreview.url}
                          alt=""
                          style={{ width: "54px", height: "54px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{ width: "54px", height: "54px", borderRadius: "8px", background: "#EAE7E1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <ImageIcon size={22} style={{ color: "#8A6B2E" }} />
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#2B2D2A" }}>
                          {report.targetPreview.title || "Reported Media Asset"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6A685F" }}>
                          {report.targetPreview.type || report.targetPreview.category || "Media Asset"} {report.targetPreview.state ? `· Current state: ${report.targetPreview.state}` : ""}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Details / Notes */}
                  {report.details && (
                    <div style={{ fontSize: "12.5px", color: "#5A584F", background: "#FFFFFF", padding: "10px 14px", border: "1px dashed #D6D0C2", borderRadius: "8px" }}>
                      <strong style={{ color: "#2B2D2A" }}>Reporter details: </strong>
                      {report.details}
                    </div>
                  )}

                  {/* Resolution Notes if resolved */}
                  {report.resolutionNotes && (
                    <div style={{ fontSize: "12px", color: "#2B5E3B", background: "#F2F9F3", padding: "8px 12px", borderRadius: "8px" }}>
                      <strong>Resolution Note: </strong>{report.resolutionNotes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Flag}
            title="No User Reports"
            description="No community reports submitted. When users report inappropriate content or fake opportunities, they appear here."
          />
        )
      ) : (
        /* Media Cards Grid */
        loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <Loader2 size={32} style={{ color: "#8A6B2E", animation: "spin 1s linear infinite" }} />
          </div>
        ) : effectiveMedia.length > 0 ? (
          <div
            className="admin-media-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "20px",
              width: "100%",
            }}
          >
            {effectiveMedia.map((media) => {
              const mediaId = media?.id || media?._id;
              const isFeatured = Boolean(media?.isFeatured ?? media?.isFeaturedWork);
              const isDisputed = media?.disputeState === "disputed";
              const rawState = (media?.moderationState || media?.status || "").toLowerCase();
              const isLive = rawState === "live" || rawState === "approved";
              const isPending = rawState === "admin_review" || rawState === "uploaded" || rawState === "pending";
              const isRestricted = rawState === "restricted";
              const isRemoved = rawState === "removed" || rawState === "rejected";

              const ownerDisplayName = media?.ownerName || media?.talentName || (media?.owner && typeof media.owner === "object" ? (media.owner.name || media.owner.email) : (media?.owner || "Unknown user"));
              const displayTitle = media?.title || media?.caption || "Portfolio Asset";
              const displayType = media?.mediaType || media?.type || "Photo";
              const isBusy = Boolean(actionLoading[mediaId]);

              return (
                <div
                  key={mediaId}
                  style={{
                    background: "#FFFFFF",
                    border: isDisputed ? "1.5px solid #D9534F" : "1px solid #E8E2D4",
                    borderRadius: "16px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    boxShadow: "0 2px 4px rgba(43,45,42,0.04)",
                  }}
                >
                  {/* Media Preview Area */}
                  <div
                    onClick={() => setPreviewMedia(media)}
                    style={{
                      width: "100%",
                      height: "190px",
                      background: "#F3EFE6",
                      position: "relative",
                      cursor: "pointer",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {media?.url || media?.thumbnail ? (
                      <img
                        src={media?.thumbnail || media?.url}
                        alt={displayTitle}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <ImageIcon size={36} style={{ color: "#B5A995" }} />
                    )}

                    {/* Disputed Badge Overlay */}
                    {isDisputed && (
                      <div
                        style={{
                          position: "absolute",
                          top: "10px",
                          left: "10px",
                          background: "#D9534F",
                          color: "#FFFFFF",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        HIDDEN: COPYRIGHT DISPUTE
                      </div>
                    )}

                    {/* Status Pill Overlay */}
                    <div
                      style={{
                        position: "absolute",
                        top: "10px",
                        left: isDisputed ? "auto" : "10px",
                        right: isDisputed ? "10px" : "auto",
                        background: isLive ? "#2B5E3B" : isPending ? "#8A6B2E" : "#7A1C1C",
                        color: "#FFFFFF",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      {rawState}
                    </div>

                    {/* Featured Badge Overlay */}
                    {isFeatured && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "10px",
                          right: "10px",
                          background: "#8A6B2E",
                          color: "#FFFFFF",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Star size={11} fill="#FFFFFF" /> FEATURED
                      </div>
                    )}
                  </div>

                  {/* Content Info */}
                  <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "15px", color: "#2B2D2A", fontWeight: 700 }}>
                        {displayTitle}
                      </h4>
                      <span style={{ fontSize: "12px", color: "#5A584F" }}>
                        Owner: {ownerDisplayName} · {displayType}
                      </span>
                    </div>

                    {/* Controls: Featured Work & Dispute */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "auto", paddingTop: "8px" }}>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleToggleFeatured(media)}
                        style={{
                          flex: 1,
                          padding: "6px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 600,
                          background: isFeatured ? "#FBF8F1" : "#FFFFFF",
                          border: "1px solid #8A6B2E",
                          color: "#8A6B2E",
                          cursor: isBusy ? "not-allowed" : "pointer",
                          opacity: isBusy ? 0.6 : 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                        }}
                      >
                        {actionLoading[mediaId] === "feature" ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Star size={12} fill={isFeatured ? "#8A6B2E" : "none"} />
                        )}
                        <span>{isFeatured ? "Featured" : "Feature"}</span>
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleToggleDispute(media)}
                        style={{
                          flex: 1,
                          padding: "6px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 600,
                          background: isDisputed ? "#FDEDEC" : "#FFFFFF",
                          border: isDisputed ? "1px solid #D9534F" : "1px solid #C4BEB1",
                          color: isDisputed ? "#D9534F" : "#5A584F",
                          cursor: isBusy ? "not-allowed" : "pointer",
                          opacity: isBusy ? 0.6 : 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                        }}
                      >
                        {actionLoading[mediaId] === "dispute" ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <AlertTriangle size={12} />
                        )}
                        <span>{isDisputed ? "Resolve" : "Dispute"}</span>
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: "8px", paddingTop: "8px", borderTop: "1px solid #F0EEEA", flexWrap: "wrap" }}>
                      {/* Approve / Restore Button */}
                      {!isLive && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleApprove(mediaId)}
                          style={{
                            flex: 1,
                            minWidth: "90px",
                            padding: "8px",
                            borderRadius: "8px",
                            background: "#2B5E3B",
                            color: "#FFFFFF",
                            border: "none",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: isBusy ? "not-allowed" : "pointer",
                            opacity: isBusy ? 0.6 : 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                          }}
                        >
                          {actionLoading[mediaId] === "approve" ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle size={14} />
                          )}
                          <span>Approve</span>
                        </button>
                      )}

                      {/* Restrict Button */}
                      {!isRestricted && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleRestrict(media)}
                          style={{
                            flex: 1,
                            minWidth: "90px",
                            padding: "8px",
                            borderRadius: "8px",
                            background: "#FAF9F7",
                            color: "#8A6B2E",
                            border: "1px solid #8A6B2E",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: isBusy ? "not-allowed" : "pointer",
                            opacity: isBusy ? 0.6 : 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                          }}
                        >
                          {actionLoading[mediaId] === "restrict" ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Ban size={14} />
                          )}
                          <span>Restrict</span>
                        </button>
                      )}

                      {/* Reject / Remove Button */}
                      {!isRemoved && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleRejectClick(media)}
                          style={{
                            flex: 1,
                            minWidth: "90px",
                            padding: "8px",
                            borderRadius: "8px",
                            background: "#FFFFFF",
                            color: "#D9534F",
                            border: "1px solid #D9534F",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: isBusy ? "not-allowed" : "pointer",
                            opacity: isBusy ? 0.6 : 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                          }}
                        >
                          {actionLoading[mediaId] === "reject" ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <XCircle size={14} />
                          )}
                          <span>Reject</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={ImageIcon}
            title={activeTab === "Pending" ? "No Media Needs Review" : "No Media Items Found"}
            description={
              activeTab === "Pending"
                ? "No media needs review right now. Items appear here when an upload or report is flagged."
                : `No media items currently under the ${activeTab} filter.`
            }
          />
        )
      )}

      {/* Reject Modal with Mandatory Reason */}
      {rejectingMedia && (
        <ReasonModal
          isOpen={!!rejectingMedia}
          onClose={() => {
            setRejectingMedia(null);
            setModalError("");
          }}
          onSubmit={handleRejectSubmit}
          title="Reject & Remove Content"
          subtitle={`Provide a mandatory reason for rejecting media from ${rejectingMedia?.ownerName || rejectingMedia?.talentName || (rejectingMedia?.owner && typeof rejectingMedia.owner === "object" ? (rejectingMedia.owner.name || rejectingMedia.owner.email) : (rejectingMedia?.owner || "Unknown user"))}.`}
          inputLabel="Reason for Rejection *"
          inputPlaceholder="E.g. Face not clearly visible / sunglasses violation / low resolution."
          submitText="Confirm Rejection"
          isDestructive
          isLoading={isModalSubmitting}
          errorMessage={modalError}
        />
      )}

      {/* Dismiss Report Modal */}
      {dismissingReport && (
        <Modal
          isOpen={!!dismissingReport}
          onClose={() => setDismissingReport(null)}
          title="Dismiss User Report"
          size="sm"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "10px 0" }}>
            <p style={{ fontSize: "13px", color: "#5A584F", margin: 0 }}>
              Dismiss this report if it is unfounded or false. The reporter will be notified that their report was reviewed.
            </p>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#2B2D2A", marginBottom: "6px" }}>
                Administrative Note (Optional)
              </label>
              <textarea
                value={dismissNote}
                onChange={(e) => setDismissNote(e.target.value)}
                placeholder="E.g. Verified by admin: content conforms to talent portfolio guidelines."
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #C4BEB1",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>
            {modalError && (
              <div style={{ fontSize: "12px", color: "#D9534F" }}>{modalError}</div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setDismissingReport(null)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #C4BEB1", background: "#FFFFFF", cursor: "pointer", fontSize: "13px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isModalSubmitting}
                onClick={handleDismissReport}
                style={{ padding: "8px 16px", borderRadius: "8px", background: "#5A584F", color: "#FFFFFF", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 700 }}
              >
                {isModalSubmitting ? "Dismissing..." : "Confirm Dismiss"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Resolve Report Modal */}
      {resolvingReport && (
        <Modal
          isOpen={!!resolvingReport}
          onClose={() => setResolvingReport(null)}
          title="Resolve User Report"
          size="sm"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "10px 0" }}>
            <p style={{ fontSize: "13px", color: "#5A584F", margin: 0 }}>
              Resolving will take administrative action on the reported content and notify both the reporter and content owner.
            </p>

            {resolvingReport.targetType === "MediaItem" && (
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#2B2D2A", marginBottom: "6px" }}>
                  Action to take on Media Item *
                </label>
                <div style={{ display: "flex", gap: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="resolveMediaAction"
                      value="remove"
                      checked={resolveMediaAction === "remove"}
                      onChange={(e) => setResolveMediaAction(e.target.value)}
                    />
                    Remove completely
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="resolveMediaAction"
                      value="restrict"
                      checked={resolveMediaAction === "restrict"}
                      onChange={(e) => setResolveMediaAction(e.target.value)}
                    />
                    Restrict (industry only)
                  </label>
                </div>
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#2B2D2A", marginBottom: "6px" }}>
                Resolution Reason / Note to Owner *
              </label>
              <textarea
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                placeholder="E.g. Inappropriate content removed per community guidelines."
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #C4BEB1",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {modalError && (
              <div style={{ fontSize: "12px", color: "#D9534F" }}>{modalError}</div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setResolvingReport(null)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #C4BEB1", background: "#FFFFFF", cursor: "pointer", fontSize: "13px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isModalSubmitting}
                onClick={handleResolveReport}
                style={{ padding: "8px 16px", borderRadius: "8px", background: "#D9534F", color: "#FFFFFF", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 700 }}
              >
                {isModalSubmitting ? "Resolving..." : "Confirm & Resolve"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Media Preview Modal */}
      {previewMedia && (
        <MediaPreviewModal
          media={previewMedia}
          onClose={() => setPreviewMedia(null)}
          onApprove={handleApprove}
          onReject={() => handleRejectClick(previewMedia)}
        />
      )}
    </div>
  );
}
