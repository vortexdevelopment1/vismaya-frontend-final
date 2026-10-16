"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useAdmin } from "@/lib/admin/AdminContext";
import PageHeader from "@/components/shared/PageHeader";
import Tabs from "@/components/shared/Tabs";
import EmptyState from "@/components/shared/EmptyState";
import MediaReviewCard from "@/components/admin/MediaReviewCard";
import MediaPreviewModal from "@/components/admin/MediaPreviewModal";
import ReasonModal from "@/components/admin/ReasonModal";
import Modal from "@/components/shared/Modal";
import { adminService } from "@/lib/api/services/adminService";
import { isRealMode } from "@/lib/api/config";

export default function ContentModerationPage() {
  const {
    mediaQueue,
    approveMedia,
    rejectMedia,
    pendingMediaCount,
  } = useAdmin();

  const [realMedia, setRealMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Pending");
  const [previewMedia, setPreviewMedia] = useState(null);
  const [rejectingMedia, setRejectingMedia] = useState(null);
  const [policyCheckMedia, setPolicyCheckMedia] = useState(null);
  const [feedbackToast, setFeedbackToast] = useState(null);

  const showToast = (msg) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (isRealMode("admin")) {
        try {
          setLoading(true);
          const res = await adminService.getPendingMedia();
          if (isMounted && res?.data) {
            setRealMedia(res.data);
          }
        } catch (err) {
          console.error("Error loading pending media:", err);
        } finally {
          if (isMounted) setLoading(false);
        }
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const effectiveMedia = realMedia.length > 0 ? realMedia : mediaQueue;

  // Counts
  const pendingCount = effectiveMedia.filter((m) => (m.status || m.moderationState) === "Pending" || (m.status || m.moderationState) === "pending").length;
  const approvedCount = effectiveMedia.filter((m) => (m.status || m.moderationState) === "Approved" || (m.status || m.moderationState) === "approved").length;
  const rejectedCount = effectiveMedia.filter((m) => (m.status || m.moderationState) === "Rejected" || (m.status || m.moderationState) === "removed").length;

  const tabs = [
    { key: "Pending", label: "Pending Review", count: pendingCount },
    { key: "Approved", label: "Approved", count: approvedCount },
    { key: "Rejected", label: "Rejected / Restricted", count: rejectedCount },
    { key: "all", label: "All Content", count: effectiveMedia.length },
  ];

  const filteredMedia = effectiveMedia.filter((m) => {
    const st = (m.status || m.moderationState || "").toLowerCase();
    if (activeTab === "all") return true;
    if (activeTab === "Pending") return st === "pending";
    if (activeTab === "Approved") return st === "approved";
    if (activeTab === "Rejected") return st === "rejected" || st === "removed" || st === "restricted";
    return true;
  });

  const handleApprove = async (id) => {
    if (isRealMode("admin")) {
      try {
        await adminService.reviewMediaItem(id, { action: "approve" });
        setRealMedia((prev) =>
          prev.map((m) => (m._id === id || m.id === id ? { ...m, status: "Approved", moderationState: "approved" } : m))
        );
        showToast("Content item approved successfully.");
      } catch (err) {
        showToast(err?.message || "Failed to approve");
      }
    } else {
      approveMedia(id);
      showToast("Content item approved (Mock).");
    }
    if (previewMedia && (previewMedia.id === id || previewMedia._id === id)) {
      setPreviewMedia(null);
    }
  };

  const handleRejectClick = (media) => {
    setRejectingMedia(media);
  };

  const handleRejectSubmit = async (reason) => {
    if (!rejectingMedia) return;
    const id = rejectingMedia.id || rejectingMedia._id;
    if (isRealMode("admin")) {
      try {
        await adminService.reviewMediaItem(id, { action: "reject", notes: reason });
        setRealMedia((prev) =>
          prev.map((m) => (m._id === id || m.id === id ? { ...m, status: "Rejected", moderationState: "removed" } : m))
        );
        showToast("Content item rejected and removed with reason.");
      } catch (err) {
        showToast(err?.message || "Failed to reject");
      }
    } else {
      rejectMedia(id, reason);
      showToast("Content item rejected (Mock).");
    }
    setRejectingMedia(null);
    if (previewMedia && (previewMedia.id === id || previewMedia._id === id)) {
      setPreviewMedia(null);
    }
  };

  // Featured Work Toggle (Spec §15: Max 4 selected by Vismaya)
  const handleToggleFeatured = async (media) => {
    const id = media._id || media.id;
    const nextState = !media.isFeaturedWork;
    if (isRealMode("admin")) {
      try {
        await adminService.setMediaFeaturedWork(id, { isFeaturedWork: nextState });
        setRealMedia((prev) =>
          prev.map((m) => (m._id === id || m.id === id ? { ...m, isFeaturedWork: nextState } : m))
        );
        showToast(nextState ? "Added to Featured Work (Spec §15)." : "Removed from Featured Work.");
      } catch (err) {
        showToast(err?.response?.data?.message || err?.message || "Failed to update featured work");
      }
    } else {
      showToast(nextState ? "Added to Featured Work (Mock)." : "Removed from Featured Work (Mock).");
    }
  };

  // Copyright Dispute Toggle (Spec §40: Hide disputed media, restore on resolution)
  const handleToggleDispute = async (media) => {
    const id = media._id || media.id;
    const isCurrentlyDisputed = media.disputeState === "disputed";
    const nextState = isCurrentlyDisputed ? "resolved" : "disputed";
    if (isRealMode("admin")) {
      try {
        await adminService.handleCopyrightDispute(id, {
          disputeState: nextState,
          disputeReason: isCurrentlyDisputed ? "Resolved by admin" : "Third party copyright claim"
        });
        setRealMedia((prev) =>
          prev.map((m) => (m._id === id || m.id === id ? { ...m, disputeState: nextState } : m))
        );
        showToast(nextState === "disputed" ? "Media hidden due to copyright dispute (Spec §40)." : "Media dispute resolved and restored.");
      } catch (err) {
        showToast(err?.message || "Failed to update dispute status");
      }
    } else {
      showToast(nextState === "disputed" ? "Media hidden due to copyright dispute (Mock)." : "Media restored (Mock).");
    }
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
            background: "#2B2D2A",
            color: "#FFFFFF",
            padding: "12px 20px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 600,
            zIndex: 1000,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          }}
        >
          {feedbackToast}
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Content Moderation"
        subtitle="Review uploaded headshots, showreels, and external links against Spec §15 & §40 policy rules: photo standards, link validation, copyright disputes, and Featured Work selection."
        badge={`${pendingCount} Awaiting Review`}
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
            <strong style={{ color: "#2B2D2A" }}>Spec §15 Policy Checklist:</strong> Headshots must show full face, no sunglasses, no filter distortion, no text overlays. Featured Work is curated by Vismaya (max 4 per profile). Disputed items (§40) are immediately hidden.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Media Cards Grid */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <Loader2 size={32} style={{ color: "#8A6B2E", animation: "spin 1s linear infinite" }} />
        </div>
      ) : filteredMedia.length > 0 ? (
        <div
          className="admin-media-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "20px",
            width: "100%",
          }}
        >
          {filteredMedia.map((media) => {
            const isFeatured = Boolean(media.isFeaturedWork);
            const isDisputed = media.disputeState === "disputed";

            return (
              <div
                key={media.id || media._id}
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
                  {media.url || media.thumbnail ? (
                    <img
                      src={media.thumbnail || media.url}
                      alt={media.title || "Media"}
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

                  {/* Featured Badge Overlay */}
                  {isFeatured && (
                    <div
                      style={{
                        position: "absolute",
                        top: "10px",
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
                      {media.title || media.caption || "Portfolio Asset"}
                    </h4>
                    <span style={{ fontSize: "12px", color: "#5A584F" }}>
                      Owner: {media.ownerName || media.talentName || "Talent Member"} · {media.mediaType || media.type || "Photo"}
                    </span>
                  </div>

                  {/* Spec §15 Photo Policy Quick Checklist */}
                  <div
                    style={{
                      background: "#FAF9F7",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      fontSize: "11px",
                      color: "#4A483F",
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                    }}
                  >
                    <span>✓ Clear facial visibility</span>
                    <span>✓ No obstructive sunglasses or heavy filters</span>
                    <span>✓ No promotional watermarks/overlays</span>
                  </div>

                  {/* Controls: Featured Work & Dispute */}
                  <div style={{ display: "flex", gap: "8px", marginTop: "auto", paddingTop: "8px" }}>
                    <button
                      type="button"
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
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                      }}
                    >
                      <Star size={12} fill={isFeatured ? "#8A6B2E" : "none"} />
                      <span>{isFeatured ? "Featured" : "Feature"}</span>
                    </button>

                    <button
                      type="button"
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
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                      }}
                    >
                      <AlertTriangle size={12} />
                      <span>{isDisputed ? "Resolve" : "Dispute"}</span>
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: "8px", paddingTop: "6px", borderTop: "1px solid #F0EEEA" }}>
                    <button
                      type="button"
                      onClick={() => handleApprove(media.id || media._id)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "8px",
                        background: "#2B5E3B",
                        color: "#FFFFFF",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                      }}
                    >
                      <CheckCircle size={14} /> Approve
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRejectClick(media)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "8px",
                        background: "#FFFFFF",
                        color: "#D9534F",
                        border: "1px solid #D9534F",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                      }}
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={ImageIcon}
          title="No Media in Queue"
          description={
            activeTab === "Pending"
              ? "All submitted photos, reels, and media items have been moderated."
              : `No items found in the '${activeTab}' filter.`
          }
        />
      )}

      {/* Reject Modal with Mandatory Reason */}
      {rejectingMedia && (
        <ReasonModal
          isOpen={!!rejectingMedia}
          onClose={() => setRejectingMedia(null)}
          onSubmit={handleRejectSubmit}
          title="Reject & Remove Content"
          subtitle={`Provide a mandatory reason for rejecting media from ${rejectingMedia.ownerName || rejectingMedia.talentName || "talent"}.`}
          inputLabel="Reason for Rejection *"
          inputPlaceholder="E.g. Face not clearly visible / sunglasses violation / low resolution."
          submitText="Confirm Rejection"
          isDestructive
        />
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
