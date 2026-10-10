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
        className="card-surface media-moderation-card"
        style={{
          borderRadius: "16px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
          transition: "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        {/* A. Top Thumbnail Preview Container (16:10 Aspect Ratio) */}
        <div
          onClick={() => onPreview && onPreview(media)}
          style={{
            width: "100%",
            aspectRatio: "16 / 10",
            position: "relative",
            cursor: "pointer",
            backgroundColor: "#070b12",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Top Gradient Overlay for Badge Contrast */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "65%",
              background: "linear-gradient(180deg, rgba(7, 11, 18, 0.75) 0%, rgba(7, 11, 18, 0.25) 60%, transparent 100%)",
              zIndex: 2,
              pointerEvents: "none",
            }}
          />

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
                backgroundColor: "#0a0f19",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                color: "#7e89a3",
              }}
            >
              {isVideo ? (
                <Video size={32} style={{ color: "var(--gold)", opacity: 0.8 }} />
              ) : (
                <ImageIcon size={32} style={{ color: "#7e89a3", opacity: 0.8 }} />
              )}
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#7e89a3" }}>
                {imgError ? "Preview unavailable" : `Click to preview ${media.type || "media"}`}
              </span>
            </div>
          )}

          {/* Top-Left: Media Type Badge */}
          <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 4 }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "3px 8px",
                borderRadius: "6px",
                backgroundColor: "rgba(7, 11, 18, 0.85)",
                color: "var(--gold)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 188, 0, 0.35)",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {isVideo ? <Video size={11} /> : <ImageIcon size={11} />}
              <span>{media.type}</span>
            </span>
          </div>

          {/* Top-Right: Status Badge (with Backdrop Blur for Light Backgrounds) */}
          <div
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              zIndex: 4,
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              borderRadius: "999px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
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
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(7, 11, 18, 0.75)",
                  border: "1px solid rgba(255, 188, 0, 0.5)",
                  color: "var(--gold)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.5)",
                  transition: "transform 0.18s ease, background-color 0.18s ease",
                }}
              >
                <Play size={18} fill="var(--gold)" style={{ marginLeft: "2px" }} />
              </div>
            </div>
          )}

          {/* Bottom-Right: Duration Chip for Videos */}
          {media.duration && (
            <div
              style={{
                position: "absolute",
                bottom: "8px",
                right: "8px",
                backgroundColor: "rgba(7, 11, 18, 0.85)",
                color: "#eceaf5",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                zIndex: 4,
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
              }}
            >
              <Clock size={11} style={{ color: "var(--gold)" }} />
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
              bottom: "8px",
              left: "8px",
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              backgroundColor: "rgba(7, 11, 18, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              color: "#eceaf5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 4,
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              transition: "background-color 0.18s ease, transform 0.18s ease, color 0.18s ease",
            }}
          >
            <Eye size={14} />
          </button>
        </div>

        {/* B. Card Body (Consistent padding & reserved 2-line title height) */}
        <div
          style={{
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            flex: 1,
            boxSizing: "border-box",
          }}
        >
          {/* Title - Clamped to 2 lines, 2.7em reserved height */}
          <h3
            title={media.title}
            style={{
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "#eceaf5",
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
              fontSize: "0.785rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0, flex: 1 }}>
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 188, 0, 0.14)",
                  color: "var(--gold)",
                  border: "1px solid rgba(255, 188, 0, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: 800,
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
                  color: "#a3acc2",
                }}
                title={`Uploaded by ${media.talentName}`}
              >
                <span style={{ fontSize: "0.725rem", color: "#7e89a3" }}>Uploaded by </span>
                <strong style={{ color: "#eceaf5", fontWeight: 600 }}>{media.talentName}</strong>
              </div>
            </div>
            <span style={{ fontSize: "0.725rem", color: "#7e89a3", whiteSpace: "nowrap", flexShrink: 0 }}>
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
              paddingTop: "2px",
            }}
          >
            {(media.resolution || media.dimensions) && (
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "#a3acc2",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  whiteSpace: "nowrap",
                }}
              >
                {media.resolution || media.dimensions}
              </span>
            )}
            {media.fileSize && (
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "#a3acc2",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  whiteSpace: "nowrap",
                }}
              >
                {media.fileSize}
              </span>
            )}
            {media.category && (
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "#a3acc2",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "140px",
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
                backgroundColor: "rgba(255, 107, 107, 0.12)",
                border: "1px solid rgba(255, 107, 107, 0.32)",
                borderRadius: "8px",
                padding: "6px 10px",
                fontSize: "0.725rem",
                color: "#ff6b6b",
                marginTop: "4px",
              }}
            >
              <strong>Reject Reason: </strong>{media.rejectReason}
            </div>
          )}
        </div>

        {/* C. Card Footer with Equal-Width Action Buttons */}
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "rgba(15, 22, 38, 0.6)",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
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
                gap: "10px",
                width: "100%",
              }}
            >
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="btn-secondary"
                style={{
                  width: "100%",
                  padding: "0 10px",
                  minHeight: "36px",
                  height: "36px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#ff6b6b",
                  border: "1px solid rgba(255, 107, 107, 0.35)",
                  backgroundColor: "rgba(255, 107, 107, 0.08)",
                  borderRadius: "10px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                  minWidth: 0,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                <X size={13} strokeWidth={2.5} />
                <span>Reject</span>
              </button>

              <button
                type="button"
                onClick={() => onApprove(media.id)}
                className="btn-primary"
                style={{
                  width: "100%",
                  padding: "0 10px",
                  minHeight: "36px",
                  height: "36px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  borderRadius: "10px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                  minWidth: 0,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                <Check size={13} strokeWidth={3} />
                <span>Approve</span>
              </button>
            </div>
          ) : media.status === "Approved" ? (
            <div style={{ width: "100%" }}>
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="btn-secondary"
                style={{
                  width: "100%",
                  padding: "0 12px",
                  minHeight: "36px",
                  height: "36px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#ff6b6b",
                  border: "1px solid rgba(255, 107, 107, 0.35)",
                  backgroundColor: "rgba(255, 107, 107, 0.08)",
                  borderRadius: "10px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                <X size={13} strokeWidth={2.5} />
                <span>Revoke / Reject</span>
              </button>
            </div>
          ) : (
            <div style={{ width: "100%" }}>
              <button
                type="button"
                onClick={() => onApprove(media.id)}
                className="btn-primary"
                style={{
                  width: "100%",
                  padding: "0 12px",
                  minHeight: "36px",
                  height: "36px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  borderRadius: "10px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                <Check size={13} strokeWidth={3} />
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
          border-color: rgba(255, 188, 0, 0.5) !important;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55), 0 0 20px rgba(255, 188, 0, 0.12) !important;
        }
        .media-moderation-card:hover .card-thumb-img {
          transform: scale(1.03);
        }
        .media-moderation-card:hover .play-overlay-btn {
          transform: scale(1.1);
          background-color: rgba(7, 11, 18, 0.9);
          border-color: var(--gold);
        }
        .media-moderation-card:hover .thumb-preview-btn {
          background-color: var(--gold);
          color: #1a1300;
          border-color: var(--gold);
        }
        .media-moderation-card button:focus-visible {
          outline: 2px solid var(--gold) !important;
          outline-offset: 2px !important;
        }
      `}</style>
    </>
  );
}
