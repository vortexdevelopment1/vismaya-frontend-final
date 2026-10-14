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
        maxWidth="720px"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "8px" }}>
          {/* Media Player / Image Viewer Container */}
          <div
            style={{
              width: "100%",
              aspectRatio: "16/9",
              backgroundColor: "#F3EFE6",
              borderRadius: "16px",
              border: "1px solid #E8E2D4",
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
            ) : isVideo && media.url ? (
              <video
                src={media.url}
                controls
                autoPlay
                playsInline
                style={{ width: "100%", height: "100%", backgroundColor: "#1C1D1A", objectFit: "contain" }}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", color: "#5A584F" }}>
                <Video size={36} style={{ color: "#8A6B2E" }} />
              </div>
            )}
          </div>

          {/* Media Info Bar */}
          <div
            style={{
              backgroundColor: "#FAF9F7",
              border: "1px solid #E8E2D4",
              borderRadius: "12px",
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "13px",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
            }}
          >
            <div>
              <span style={{ color: "#5A584F" }}>Resolution: </span>
              <strong style={{ color: "#2B2D2A" }}>{media.resolution || "1080p Full HD"}</strong>
              <span style={{ color: "#5A584F", marginLeft: "14px" }}>Size: </span>
              <strong style={{ color: "#2B2D2A" }}>{media.fileSize || "4.8 MB"}</strong>
            </div>
            <StatusBadge status={media.status} size="xs" />
          </div>

          {/* Action Footer */}
          <div className="media-preview-footer" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", paddingTop: "8px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 18px",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "10px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8E2D4",
                color: "#5A584F",
                cursor: "pointer",
                fontFamily: "var(--font-body), 'Inter', sans-serif",
              }}
            >
              Close
            </button>

            {media.status !== "Rejected" && (
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                style={{
                  padding: "8px 18px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#B42318",
                  border: "1px solid rgba(180, 35, 24, 0.35)",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "10px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
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
                style={{
                  padding: "8px 20px",
                  fontSize: "14px",
                  fontWeight: 600,
                  gap: "6px",
                  borderRadius: "10px",
                  backgroundColor: "#8A6B2E",
                  color: "#FFFFFF",
                  border: "1px solid #8A6B2E",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  boxShadow: "0 2px 6px rgba(138, 107, 46, 0.2)",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
                }}
              >
                <Check size={14} strokeWidth={3} /> Approve Media
              </button>
            )}
          </div>
        </div>

        <style jsx>{`
          @media (max-width: 640px) {
            .media-preview-footer {
              display: grid !important;
              grid-template-columns: repeat(auto-fit, minmax(0, 1fr)) !important;
              gap: 8px !important;
              width: 100% !important;
            }
            .media-preview-footer button {
              width: 100% !important;
              height: 42px !important;
              justify-content: center !important;
              font-size: 13px !important;
              padding: 0 10px !important;
            }
          }
        `}</style>
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
