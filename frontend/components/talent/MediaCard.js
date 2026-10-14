"use client";

import React, { useState } from "react";
import { Play, Eye, Trash2, Image as ImageIcon, Video, Mic, ShieldAlert, Sparkles } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import Modal from "@/components/shared/Modal";
import { optimizeCloudinaryUrl, getCloudinaryVideoThumbnail } from "@/lib/api/uploadMedia";

export default function MediaCard({ media, onDelete }) {
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isVideo =
    media.type === "Showreel" ||
    media.type === "Audition Clip" ||
    media.mediaType === "video" ||
    (media.mimeType && media.mimeType.startsWith("video/")) ||
    (typeof media.url === "string" && (media.url.endsWith(".mp4") || media.url.endsWith(".webm") || media.url.endsWith(".mov")));

  const getMediaIcon = () => {
    if (isVideo) return Video;
    if (media.type === "Voice Reel") return Mic;
    return ImageIcon;
  };

  const Icon = getMediaIcon();
  const optimizedImgUrl = optimizeCloudinaryUrl(media.url, { width: 640, quality: "auto" });
  const videoThumbUrl = isVideo ? getCloudinaryVideoThumbnail(media.url, 640) : null;

  return (
    <>
      <div
        className="card-surface media-card-root"
        style={{
          border: media.status === "Rejected" ? "1px solid rgba(180, 35, 24, 0.35)" : "1px solid #E8E2D4",
          borderRadius: "16px",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04), 0 10px 24px rgba(43, 45, 42, 0.05)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
      >
        {/* Media Thumbnail / Preview Area (Aspect ~ 4/3 or clamp) */}
        <div
          className={`media-card-thumbnail-wrap ${isVideo ? "is-video" : "is-photo"}`}
          style={{
            height: "200px",
            width: "100%",
            backgroundColor: "#2B2D2A",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {isVideo ? (
            <>
              {videoThumbUrl && videoThumbUrl !== media.url ? (
                // Cloudinary generated video poster frame
                <img
                  src={videoThumbUrl}
                  alt={media.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  loading="lazy"
                />
              ) : (
                // HTML5 video metadata preview
                <video
                  src={media.url}
                  preload="metadata"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    pointerEvents: "none",
                  }}
                />
              )}

              {/* Play Overlay Button */}
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                aria-label={`Play ${media.title}`}
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  backgroundColor: "#8A6B2E",
                  border: "2px solid #FAF9F7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FAF9F7",
                  boxShadow: "0 4px 14px rgba(43, 45, 42, 0.4)",
                  cursor: "pointer",
                  position: "absolute",
                  zIndex: 2,
                  transition: "transform 0.2s ease, background-color 0.2s ease",
                }}
                className="media-play-icon"
              >
                <Play size={20} fill="#FAF9F7" style={{ marginLeft: "3px" }} />
              </button>
            </>
          ) : (
            // Photo thumbnail with Cloudinary optimization
            <img
              src={optimizedImgUrl}
              alt={media.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
              loading="lazy"
            />
          )}

          {/* Subtle Top Gradient for Badge Readability */}
          <div
            className="media-card-gradient"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "50px",
              background: "linear-gradient(180deg, rgba(43, 45, 42, 0.6) 0%, rgba(43, 45, 42, 0) 100%)",
              pointerEvents: "none",
              zIndex: 2,
            }}
          />

          {/* Top Badges: Type & Moderation Status */}
          <div
            className="media-card-top-badges"
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              right: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              zIndex: 3,
            }}
          >
            <span
              className="media-category-badge"
              style={{
                fontSize: "0.72rem",
                fontWeight: "700",
                padding: "4px 10px",
                borderRadius: "6px",
                backgroundColor: "rgba(43, 45, 42, 0.85)",
                color: "#FAF9F7",
                border: "1px solid rgba(255, 255, 255, 0.20)",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}
            >
              <Icon size={12} style={{ color: "#C9A55C" }} />
              {media.type || (isVideo ? "Showreel" : "Photo")}
            </span>

            <span className="media-status-badge">
              <StatusBadge status={media.status || "Pending"} size="xs" />
            </span>
          </div>

          {/* Bottom Duration or Resolution */}
          {(media.duration || media.resolution) && (
            <span
              className="media-specs-badge"
              style={{
                position: "absolute",
                bottom: "10px",
                right: "10px",
                fontSize: "0.7rem",
                fontWeight: "700",
                padding: "2px 8px",
                borderRadius: "4px",
                backgroundColor: "rgba(43, 45, 42, 0.85)",
                color: "#FAF9F7",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                zIndex: 3,
              }}
            >
              {media.duration || media.resolution}
            </span>
          )}
        </div>

        {/* Media Details */}
        <div
          className="media-card-body"
          style={{
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            flex: 1,
            backgroundColor: "#FFFFFF",
            minWidth: 0,
          }}
        >
          <div className="media-card-info" style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
            <h4
              className="media-card-title"
              style={{
                fontSize: "0.95rem",
                fontWeight: "700",
                color: "#2B2D2A",
                margin: 0,
                lineHeight: 1.35,
                overflowWrap: "anywhere",
                fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
              }}
            >
              {media.title || "Untitled Media"}
            </h4>
            <span className="media-card-meta" style={{ fontSize: "0.78rem", color: "#5A584F", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
              Uploaded on {media.date || "Today"} &bull; {media.fileSize || "2.5 MB"}
            </span>
          </div>

          {/* Admin Rejection Reason Banner */}
          {media.status === "Rejected" && media.reason && (
            <div
              className="media-rejection-banner"
              style={{
                backgroundColor: "#FEF3F2",
                border: "1px solid #FECDCA",
                borderRadius: "8px",
                padding: "10px 12px",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                marginTop: "4px",
              }}
            >
              <ShieldAlert size={16} style={{ color: "#B42318", flexShrink: 0, marginTop: "2px" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#B42318" }}>
                  Moderation Feedback:
                </span>
                <span style={{ fontSize: "0.75rem", color: "#5A584F", lineHeight: 1.4, overflowWrap: "anywhere" }}>
                  {media.reason}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div
            className="media-card-actions"
            style={{
              marginTop: "auto",
              paddingTop: "12px",
              borderTop: "1px solid #E8E2D4",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="btn-secondary media-preview-btn"
              style={{
                fontSize: "0.82rem",
                padding: "8px 16px",
                minHeight: "36px",
                borderRadius: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: "600",
              }}
            >
              <Eye size={14} />
              <span>Preview</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                color: "#5A584F",
                padding: "8px",
                minHeight: "36px",
                minWidth: "36px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                transition: "color 0.15s ease, background-color 0.15s ease",
              }}
              title="Delete Media"
              className="delete-icon-btn media-delete-btn"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={media.title || "Media Preview"}
        subtitle={`${media.type || (isVideo ? "Showreel" : "Photo")} • Uploaded ${media.date || "Recently"}`}
        maxWidth="720px"
        footer={
          <div className="preview-modal-footer" style={{ width: "100%" }}>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="btn-secondary"
              style={{ padding: "8px 20px", borderRadius: "8px" }}
            >
              Close Preview
            </button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            className="preview-media-container"
            style={{
              width: "100%",
              backgroundColor: isVideo ? "#000000" : "#F3EFE6",
              borderRadius: "12px",
              border: "1px solid #E8E2D4",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "260px",
            }}
          >
            {isVideo ? (
              <video
                src={media.url}
                controls
                autoPlay
                playsInline
                style={{
                  width: "100%",
                  maxHeight: "440px",
                  display: "block",
                  backgroundColor: "#000",
                }}
              />
            ) : (
              <img
                src={optimizeCloudinaryUrl(media.url, { width: 1200, quality: "auto" })}
                alt={media.title}
                style={{
                  width: "100%",
                  maxHeight: "480px",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            )}
          </div>

          <div
            style={{
              backgroundColor: "#F3EFE6",
              padding: "14px 18px",
              borderRadius: "10px",
              border: "1px solid #E8E2D4",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              fontSize: "0.85rem",
            }}
          >
            <div>
              <span style={{ color: "#5A584F", display: "block", fontSize: "0.75rem", marginBottom: "4px" }}>
                Moderation Status
              </span>
              <StatusBadge status={media.status || "Pending"} size="sm" />
            </div>

            <div>
              <span style={{ color: "#5A584F", display: "block", fontSize: "0.75rem", marginBottom: "4px" }}>
                Specs &amp; File Size
              </span>
              <span style={{ color: "#2B2D2A", fontWeight: "600" }}>
                {media.resolution || (isVideo ? "1080p Full HD" : "High Resolution")} &bull; {media.fileSize || "2.5 MB"}
              </span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Portfolio Media?"
        subtitle="This action cannot be undone."
        maxWidth="440px"
        footer={
          <div className="delete-modal-footer" style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="btn-secondary"
              style={{ padding: "8px 18px", borderRadius: "8px" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete(media.id || media._id);
                setShowDeleteConfirm(false);
              }}
              style={{
                padding: "8px 18px",
                borderRadius: "8px",
                backgroundColor: "#B42318",
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "0.875rem",
                cursor: "pointer",
                border: "none",
                transition: "background-color 0.15s ease",
              }}
            >
              Confirm Delete
            </button>
          </div>
        }
      >
        <p style={{ color: "#5A584F", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
          Are you sure you want to delete <strong style={{ color: "#2B2D2A" }}>&quot;{media.title}&quot;</strong>?
          It will be permanently removed from your talent portfolio.
        </p>
      </Modal>

      <style jsx>{`
        .delete-icon-btn:hover {
          color: #b42318 !important;
          background-color: #fef3f2 !important;
        }
        .media-play-icon:hover {
          transform: scale(1.1);
          background-color: #6e5420 !important;
        }

        @media (max-width: 640px) {
          .media-card-root {
            border-radius: 14px !important;
            box-shadow: 0 1px 4px rgba(43, 45, 42, 0.04) !important;
            border: 1px solid #E8E2D4 !important;
          }
          .media-card-thumbnail-wrap {
            height: auto !important;
          }
          .media-card-thumbnail-wrap.is-photo {
            aspect-ratio: 4 / 5 !important;
          }
          .media-card-thumbnail-wrap.is-video {
            aspect-ratio: 4 / 3 !important;
            background-color: #F3EFE6 !important;
          }
          .media-card-thumbnail-wrap video {
            background-color: #F3EFE6 !important;
          }
          .media-card-thumbnail-wrap img,
          .media-card-thumbnail-wrap video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            object-position: center top !important;
          }
          .media-card-gradient {
            height: 36px !important;
          }
          .media-card-top-badges {
            top: 6px !important;
            left: 6px !important;
            right: 6px !important;
            display: flex !important;
            flex-wrap: wrap !important;
            align-items: flex-start !important;
            justifyContent: space-between !important;
            gap: 4px !important;
          }
          .media-category-badge {
            font-size: 9.5px !important;
            font-weight: 700 !important;
            padding: 2.5px 6px !important;
            border-radius: 4px !important;
            background-color: rgba(255, 255, 255, 0.94) !important;
            color: #2B2D2A !important;
            border: 1px solid rgba(232, 226, 212, 0.9) !important;
            box-shadow: 0 1px 3px rgba(43, 45, 42, 0.12) !important;
            letter-spacing: 0.02em !important;
          }
          .media-category-badge :global(svg) {
            width: 10px !important;
            height: 10px !important;
            color: #8A6B2E !important;
          }
          .media-status-badge :global(span) {
            font-size: 9.5px !important;
            padding: 2px 6px !important;
            border-radius: 4px !important;
            box-shadow: 0 1px 3px rgba(43, 45, 42, 0.12) !important;
          }
          .media-specs-badge {
            bottom: 6px !important;
            right: 6px !important;
            font-size: 9.5px !important;
            padding: 2px 6px !important;
            border-radius: 4px !important;
            background-color: rgba(255, 255, 255, 0.94) !important;
            color: #2B2D2A !important;
            border: 1px solid rgba(232, 226, 212, 0.9) !important;
            box-shadow: 0 1px 3px rgba(43, 45, 42, 0.12) !important;
          }
          .media-play-icon {
            width: 36px !important;
            height: 36px !important;
            min-width: 36px !important;
            min-height: 36px !important;
            box-shadow: 0 2px 8px rgba(43, 45, 42, 0.25) !important;
          }
          .media-play-icon :global(svg) {
            width: 14px !important;
            height: 14px !important;
            margin-left: 2px !important;
          }
          .media-card-body {
            padding: 9px 10px 10px !important;
            gap: 6px !important;
          }
          .media-card-info {
            gap: 2px !important;
          }
          .media-card-title {
            font-size: 13px !important;
            line-height: 1.25 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            word-break: break-word !important;
          }
          .media-card-meta {
            font-size: 10.5px !important;
            line-height: 1.35 !important;
          }
          .media-rejection-banner {
            padding: 6px 8px !important;
            border-radius: 6px !important;
            gap: 6px !important;
            margin-top: 2px !important;
          }
          .media-rejection-banner :global(svg) {
            width: 13px !important;
            height: 13px !important;
          }
          .media-rejection-banner span {
            font-size: 10.5px !important;
            line-height: 1.3 !important;
          }
          .media-card-actions {
            margin-top: auto !important;
            padding-top: 8px !important;
            gap: 6px !important;
          }
          .media-preview-btn {
            height: 32px !important;
            min-height: 32px !important;
            font-size: 11px !important;
            font-weight: 700 !important;
            padding: 0 8px !important;
            border-radius: 6px !important;
            flex: 1 !important;
            justify-content: center !important;
            letter-spacing: 0.04em !important;
            text-transform: uppercase !important;
          }
          .media-delete-btn {
            width: 32px !important;
            min-width: 32px !important;
            height: 32px !important;
            min-height: 32px !important;
            padding: 0 !important;
            border-radius: 6px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .media-delete-btn :global(svg) {
            width: 14px !important;
            height: 14px !important;
          }
          .preview-media-container {
            min-height: 180px !important;
          }
          .preview-media-container video,
          .preview-media-container img {
            max-height: 55vh !important;
          }
          .preview-modal-footer {
            width: 100% !important;
          }
          .preview-modal-footer :global(button) {
            width: 100% !important;
            height: 40px !important;
            justify-content: center !important;
          }
          .delete-modal-footer {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            width: 100% !important;
          }
          .delete-modal-footer :global(button) {
            width: 100% !important;
            height: 40px !important;
            justify-content: center !important;
          }
        }

        @media (max-width: 400px) {
          .media-card-body {
            padding: 8px 8px 9px !important;
          }
          .media-card-title {
            font-size: 12px !important;
          }
          .media-card-meta {
            font-size: 10px !important;
          }
          .media-preview-btn {
            font-size: 10px !important;
            padding: 0 4px !important;
          }
        }
      `}</style>
    </>
  );
}
