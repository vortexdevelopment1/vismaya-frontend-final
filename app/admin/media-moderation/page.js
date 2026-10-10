"use client";

import React, { useState } from "react";
import {
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Layers,
  Filter,
} from "lucide-react";
import { useAdmin } from "@/lib/admin/AdminContext";
import PageHeader from "@/components/shared/PageHeader";
import Tabs from "@/components/shared/Tabs";
import EmptyState from "@/components/shared/EmptyState";
import MediaReviewCard from "@/components/admin/MediaReviewCard";
import MediaPreviewModal from "@/components/admin/MediaPreviewModal";
import ReasonModal from "@/components/admin/ReasonModal";

export default function MediaModerationPage() {
  const {
    mediaQueue,
    approveMedia,
    rejectMedia,
    pendingMediaCount,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState("Pending");
  const [previewMedia, setPreviewMedia] = useState(null);
  const [rejectingMedia, setRejectingMedia] = useState(null);

  // Status Tab Counts
  const approvedCount = mediaQueue.filter((m) => m.status === "Approved").length;
  const rejectedCount = mediaQueue.filter((m) => m.status === "Rejected").length;

  const tabs = [
    { key: "Pending", label: "Pending Review", count: pendingMediaCount },
    { key: "Approved", label: "Approved", count: approvedCount },
    { key: "Rejected", label: "Rejected", count: rejectedCount },
    { key: "all", label: "All Media", count: mediaQueue.length },
  ];

  const filteredMedia = mediaQueue.filter((m) => {
    if (activeTab === "all") return true;
    return m.status === activeTab;
  });

  const handleApprove = (id) => {
    approveMedia(id);
    if (previewMedia && previewMedia.id === id) {
      setPreviewMedia(null);
    }
  };

  const handleRejectClick = (media) => {
    setRejectingMedia(media);
  };

  const handleRejectSubmit = (reason) => {
    if (!rejectingMedia) return;
    rejectMedia(rejectingMedia.id, reason);
    setRejectingMedia(null);
    if (previewMedia && previewMedia.id === rejectingMedia.id) {
      setPreviewMedia(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Page Header */}
      <PageHeader
        title="Media Moderation"
        subtitle="Review uploaded headshots, comp-cards, dramatic showreels, and audition clips before they appear on talent portfolios."
        badge={`${pendingMediaCount} Awaiting Review`}
      />

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Media Cards Grid */}
      {filteredMedia.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
            width: "100%",
          }}
        >
          {filteredMedia.map((media) => (
            <MediaReviewCard
              key={media.id}
              media={media}
              onApprove={handleApprove}
              onReject={(id) => handleRejectClick(media)}
              onPreview={(item) => setPreviewMedia(item)}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.10)",
            borderRadius: "16px",
            padding: "48px 24px",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
            textAlign: "center",
          }}
        >
          <EmptyState
            title="No media in this category"
            description={
              activeTab === "Pending"
                ? "All pending media files have been moderated. New talent uploads will appear here automatically."
                : `No media items found with status "${activeTab}".`
            }
          />
        </div>
      )}

      {/* Preview Modal */}
      {previewMedia && (
        <MediaPreviewModal
          isOpen={!!previewMedia}
          onClose={() => setPreviewMedia(null)}
          media={previewMedia}
          onApprove={handleApprove}
          onReject={(id) => {
            setRejectingMedia(previewMedia);
          }}
        />
      )}

      {/* Reject Reason Modal */}
      {rejectingMedia && (
        <ReasonModal
          isOpen={!!rejectingMedia}
          onClose={() => setRejectingMedia(null)}
          title={`Reject Media: ${rejectingMedia.title}`}
          actionType="reject"
          placeholder="State reason for rejecting this media file..."
          presetReasons={[
            "Blurry image or poor compression quality",
            "Inappropriate content violating community guidelines",
            "Wrong format or unsupported aspect ratio",
            "Watermark / studio logo present on comp-card",
            "Audio out of sync or distorted sound in showreel",
            "Not a clear facial headshot",
          ]}
          onSubmit={handleRejectSubmit}
        />
      )}
    </div>
  );
}
