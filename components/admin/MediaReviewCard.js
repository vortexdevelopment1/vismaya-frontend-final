"use client";

import React, { useState } from "react";
import { Check, X, Eye, Video, Image as ImageIcon, Clock, Play } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import ReasonModal from "./ReasonModal";

export default function MediaReviewCard({
  media,
  onApprove,
  onReject,
  onPreview,
}) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isVideo =
    media?.type?.toLowerCase().includes("video") ||
    media?.type?.toLowerCase().includes("showreel") ||
    media?.type?.toLowerCase().includes("clip");

  const thumbnailSrc = media?.thumbnail || (!isVideo ? media?.url : null);

  return (
    <>
      <div
        className="media-moderation-card"
        style={{
          borderRadius: "20px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E2D4",
          boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06)",
          transition: "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        {/* Top Thumbnail Preview Container */}
        <div
          onClick={() => onPreview && onPreview(media)}
          style={{
            width: "100%",
            aspectRatio: "16 / 10",
            position: "relative",
            cursor: "pointer",
            backgroundColor: "#F3EFE6",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Media Image or Styled Fallback */}
          {thumbnailSrc && !imgError ? (
            <img
              src={thumbnailSrc}
              alt=""
              onError={() => setImgError(true)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                transition: "transform 0.25s ease",
              }}
              className="card-thumb-img"
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#F3EFE6",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                color: "#5A584F",
              }}
            >
              {isVideo ? (
                <Video size={32} style={{ color: "#8A6B2E" }} />
              ) : (
                <ImageIcon size={32} style={{ color: "#5A584F" }} />
              )}
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#5A584F", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
                {imgError ? "Preview unavailable" : `Click to preview ${media.type || "media"}`}
              </span>
            </div>
          )}

          {/* Top-Left: Type chip - White pill with charcoal text over image */}
          <div style={{ position: "absolute", top: "12px", left: "12px", zIndex: 4 }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "4px 10px",
                borderRadius: "999px",
                backgroundColor: "#FFFFFF",
                color: "#2B2D2A",
                border: "1px solid #E8E2D4",
                boxShadow: "0 2px 8px rgba(43, 45, 42, 0.12)",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontFamily: "var(--font-body), 'Inter', sans-serif",
              }}
            >
              {isVideo ? <Video size={12} style={{ color: "#8A6B2E" }} /> : <ImageIcon size={12} style={{ color: "#8A6B2E" }} />}
              <span>{media.type}</span>
            </span>
          </div>

          {/* Top-Right: Status Badge */}
          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              zIndex: 4,
              boxShadow: "0 2px 8px rgba(43, 45, 42, 0.12)",
              borderRadius: "999px",
            }}
          >
            <StatusBadge status={media.status} size="xs" />
          </div>

          {/* Video Play Overlay */}
          {isVideo && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 3,
                pointerEvents: "none",
              }}
            >
              <div
                className="play-overlay-btn"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  border: "1px solid #E8E2D4",
                  color: "#8A6B2E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 16px rgba(43, 45, 42, 0.15)",
                  transition: "transform 0.18s ease",
                }}
              >
                <Play size={20} fill="#8A6B2E" style={{ marginLeft: "2px" }} />
              </div>
            </div>
          )}

          {/* Bottom-Right: Duration Chip for Videos */}
          {media.duration && (
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                right: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                color: "#2B2D2A",
                border: "1px solid #E8E2D4",
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                zIndex: 4,
                boxShadow: "0 2px 6px rgba(43, 45, 42, 0.08)",
              }}
            >
              <Clock size={11} style={{ color: "#8A6B2E" }} />
              <span>{media.duration}</span>
            </div>
          )}

          {/* Bottom-Left: Icon Preview Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview && onPreview(media);
            }}
            aria-label="Preview media"
            title="Preview media"
            className="thumb-preview-btn"
            style={{
              position: "absolute",
              bottom: "10px",
              left: "10px",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E2D4",
              color: "#5A584F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 4,
              boxShadow: "0 2px 6px rgba(43, 45, 42, 0.08)",
              transition: "all 0.16s ease",
            }}
          >
            <Eye size={15} />
          </button>
        </div>

        {/* Card Body */}
        <div
          style={{
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            flex: 1,
            boxSizing: "border-box",
          }}
        >
          {/* Title - Playfair 18px charcoal */}
          <h3
            title={media.title}
            style={{
              fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
              fontSize: "18px",
              fontWeight: 600,
              color: "#2B2D2A",
              margin: 0,
              lineHeight: "1.35",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minHeight: "2.7em",
            }}
          >
            {media.title}
          </h3>

          {/* Uploader & Date Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              fontSize: "13px",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "#F3EFE6",
                  color: "#8A6B2E",
                  border: "1px solid #E8E2D4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {media.talentName?.charAt(0) || "T"}
              </div>
              <div
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: "#5A584F",
                }}
                title={`Uploaded by ${media.talentName}`}
              >
                <span style={{ color: "#5A584F" }}>Uploaded by </span>
                <strong style={{ color: "#8A6B2E", fontWeight: 600 }}>{media.talentName}</strong>
              </div>
            </div>
            <span style={{ fontSize: "12px", color: "#5A584F", whiteSpace: "nowrap", flexShrink: 0 }}>
              {media.uploadDate}
            </span>
          </div>

          {/* Specs Chips Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexWrap: "wrap",
              marginTop: "auto",
              paddingTop: "4px",
            }}
          >
            {(media.resolution || media.dimensions) && (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#5A584F",
                  backgroundColor: "#F3EFE6",
                  border: "1px solid #E8E2D4",
                  padding: "3px 9px",
                  borderRadius: "6px",
                  whiteSpace: "nowrap",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
                }}
              >
                {media.resolution || media.dimensions}
              </span>
            )}
            {media.fileSize && (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#5A584F",
                  backgroundColor: "#F3EFE6",
                  border: "1px solid #E8E2D4",
                  padding: "3px 9px",
                  borderRadius: "6px",
                  whiteSpace: "nowrap",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
                }}
              >
                {media.fileSize}
              </span>
            )}
            {media.category && (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#6E5420",
                  backgroundColor: "rgba(201, 165, 92, 0.16)",
                  border: "1px solid rgba(201, 165, 92, 0.25)",
                  padding: "3px 9px",
                  borderRadius: "6px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "140px",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
                }}
                title={media.category}
              >
                {media.category}
              </span>
            )}
          </div>

          {/* Rejection Reason Alert if rejected */}
          {media.rejectReason && (
            <div
              style={{
                backgroundColor: "rgba(180, 35, 24, 0.08)",
                border: "1px solid rgba(180, 35, 24, 0.25)",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "12px",
                color: "#B42318",
                marginTop: "4px",
                lineHeight: 1.4,
              }}
            >
              <strong>Reject Reason: </strong>{media.rejectReason}
            </div>
          )}
        </div>

        {/* Card Footer with Equal-Width 44px Action Buttons */}
        <div
          style={{
            padding: "16px 20px",
            backgroundColor: "#FFFFFF",
            borderTop: "1px solid #E8E2D4",
            display: "flex",
            alignItems: "center",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {media.status === "Pending" ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                width: "100%",
              }}
            >
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="media-btn-reject"
                style={{
                  width: "100%",
                  height: "44px",
                  minHeight: "44px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#B42318",
                  border: "1px solid rgba(180, 35, 24, 0.35)",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "10px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  transition: "all 0.16s ease",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
                }}
              >
                <X size={15} strokeWidth={2.5} />
                <span>Reject</span>
              </button>

              <button
                type="button"
                onClick={() => onApprove(media.id)}
                className="media-btn-approve"
                style={{
                  width: "100%",
                  height: "44px",
                  minHeight: "44px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#FFFFFF",
                  backgroundColor: "#8A6B2E",
                  border: "1px solid #8A6B2E",
                  borderRadius: "10px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(138, 107, 46, 0.2)",
                  transition: "all 0.16s ease",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
                }}
              >
                <Check size={15} strokeWidth={3} />
                <span>Approve</span>
              </button>
            </div>
          ) : media.status === "Approved" ? (
            <div style={{ width: "100%" }}>
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="media-btn-reject"
                style={{
                  width: "100%",
                  height: "44px",
                  minHeight: "44px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#B42318",
                  border: "1px solid rgba(180, 35, 24, 0.35)",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "10px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  transition: "all 0.16s ease",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
                }}
              >
                <X size={15} strokeWidth={2.5} />
                <span>Revoke / Reject</span>
              </button>
            </div>
          ) : (
            <div style={{ width: "100%" }}>
              <button
                type="button"
                onClick={() => onApprove(media.id)}
                className="media-btn-approve"
                style={{
                  width: "100%",
                  height: "44px",
                  minHeight: "44px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#FFFFFF",
                  backgroundColor: "#8A6B2E",
                  border: "1px solid #8A6B2E",
                  borderRadius: "10px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(138, 107, 46, 0.2)",
                  transition: "all 0.16s ease",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
                }}
              >
                <Check size={15} strokeWidth={3} />
                <span>Approve Media</span>
              </button>
            </div>
          )}
        </div>
      </div>

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
            "Blurry image or poor compression quality",
            "Inappropriate content violating community guidelines",
            "Wrong format or unsupported aspect ratio",
            "Watermark / studio logo present on comp-card",
            "Audio out of sync or distorted sound in showreel",
            "Not a clear facial headshot",
          ]}
          onConfirm={(reason) => onReject(media.id, reason)}
        />
      )}

      <style jsx global>{`
        .media-moderation-card:hover {
          transform: translateY(-2px);
          border-color: #8A6B2E !important;
          box-shadow: 0 4px 8px rgba(43, 45, 42, 0.06), 0 16px 36px rgba(43, 45, 42, 0.08) !important;
        }
        .media-moderation-card:hover .card-thumb-img {
          transform: scale(1.03);
        }
        .media-btn-reject:hover {
          background-color: rgba(180, 35, 24, 0.08) !important;
          border-color: #B42318 !important;
        }
        .media-btn-approve:hover {
          background-color: #6E5420 !important;
          border-color: #6E5420 !important;
        }
        .thumb-preview-btn:hover {
          background-color: #8A6B2E !important;
          color: #FFFFFF !important;
          border-color: #8A6B2E !important;
        }
      `}</style>
    </>
  );
}
