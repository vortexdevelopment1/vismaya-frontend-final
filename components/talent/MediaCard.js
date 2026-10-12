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
        className="card-surface"
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

            <StatusBadge status={media.status || "Pending"} size="xs" />
          </div>

          {/* Bottom Duration or Resolution */}
          {(media.duration || media.resolution) && (
            <span
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
          <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
            <h4
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
            <span style={{ fontSize: "0.78rem", color: "#5A584F", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
              Uploaded on {media.date || "Today"} &bull; {media.fileSize || "2.5 MB"}
            </span>
          </div>

          {/* Admin Rejection Reason Banner */}
          {media.status === "Rejected" && media.reason && (
            <div
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
              className="btn-secondary"
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
              className="delete-icon-btn"
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
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className="btn-secondary"
            style={{ padding: "8px 20px", borderRadius: "8px" }}
          >
            Close Preview
          </button>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              width: "100%",
              backgroundColor: "#1C1D1A",
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
          <div style={{ display: "flex", gap: "10px" }}>
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
      `}</style>
    </>
  );
}
