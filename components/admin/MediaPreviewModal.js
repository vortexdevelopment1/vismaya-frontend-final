"use client";

import React, { useState } from "react";
import { X, Check, Play, Pause, Video, Image as ImageIcon, AlertCircle } from "lucide-react";
import Modal from "@/components/shared/Modal";
import StatusBadge from "@/components/shared/StatusBadge";
import ReasonModal from "./ReasonModal";

export default function MediaPreviewModal({
  isOpen,
  onClose,
  media,
  onApprove,
  onReject,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  if (!isOpen || !media) return null;

  const isVideo = media.type?.includes("Clip") || media.type?.includes("Showreel") || media.type?.includes("Video");

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={media.title}
        description={`Uploaded by ${media.talentName} • ${media.type} • ${media.uploadDate}`}
        maxWidth="700px"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "8px" }}>
          {/* Media Player / Image Viewer Container */}
          <div
            style={{
              width: "100%",
              aspectRatio: "16/9",
              backgroundColor: "rgba(10, 15, 25, 0.9)",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {media.url && !isVideo ? (
              <img
                src={media.url}
                alt={media.title}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : isVideo ? (
              isPlaying ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", border: "3px solid var(--gold)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#eceaf5" }}>
                    Playing Audition Video Stream...
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPlaying(false)}
                    className="btn-secondary"
                    style={{ padding: "6px 14px", fontSize: "0.75rem", borderRadius: "10px" }}
                  >
                    <Pause size={14} /> Pause Video
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", textAlign: "center", padding: "20px" }}>
                  <button
                    type="button"
                    onClick={() => setIsPlaying(true)}
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      background: "var(--gold-gradient, linear-gradient(135deg, #ffd54a 0%, #ffbc00 100%))",
                      color: "#1a1300",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 16px rgba(255, 188, 0, 0.35)",
                      cursor: "pointer",
                      border: "none",
                      transition: "transform 0.18s ease",
                    }}
                  >
                    <Play size={22} style={{ marginLeft: "3px" }} fill="#1a1300" />
                  </button>
                  <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "#eceaf5" }}>
                    {media.title}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#a3acc2" }}>
                    Duration: {media.duration || "1:20 min"} &bull; 1080p HD
                  </span>
                </div>
              )
            ) : null}
          </div>

          {/* Media Info Bar */}
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.8rem",
            }}
          >
            <div>
              <span style={{ color: "#a3acc2" }}>Resolution: </span>
              <strong style={{ color: "#eceaf5" }}>{media.resolution || "1080p Full HD"}</strong>
              <span style={{ color: "#a3acc2", marginLeft: "14px" }}>Size: </span>
              <strong style={{ color: "#eceaf5" }}>{media.fileSize || "4.8 MB"}</strong>
            </div>
            <StatusBadge status={media.status} size="xs" />
          </div>

          {/* Action Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", paddingTop: "8px" }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: "8px 16px", fontSize: "0.85rem", borderRadius: "12px" }}
            >
              Close
            </button>

            {media.status !== "Rejected" && (
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="btn-secondary"
                style={{
                  padding: "8px 16px",
                  fontSize: "0.85rem",
                  color: "#ff6b6b",
                  border: "1px solid rgba(255, 107, 107, 0.35)",
                  backgroundColor: "rgba(255, 107, 107, 0.08)",
                  borderRadius: "12px",
                }}
              >
                <X size={14} /> Reject
              </button>
            )}

            {media.status !== "Approved" && (
              <button
                type="button"
                onClick={() => {
                  onApprove(media.id);
                  onClose();
                }}
                className="btn-primary"
                style={{ padding: "8px 18px", fontSize: "0.85rem", gap: "6px", borderRadius: "12px" }}
              >
                <Check size={14} strokeWidth={3} /> Approve Media
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <ReasonModal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          title="Reject Media File"
          description={`Specify reason for rejecting "${media.title}".`}
          confirmLabel="Reject Media"
          confirmVariant="danger"
          quickReasons={[
            "Blurry image",
            "Inappropriate content",
            "Wrong format",
            "Audio is unclear",
            "Watermarked photo",
          ]}
          onConfirm={(reason) => {
            onReject(media.id, reason);
            setShowRejectModal(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
