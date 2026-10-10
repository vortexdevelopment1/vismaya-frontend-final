"use client";

import React, { useState } from "react";
import { Play, Eye, Trash2, Image as ImageIcon, Video, Mic, ShieldAlert } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import Modal from "@/components/shared/Modal";

export default function MediaCard({ media, onDelete }) {
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getMediaIcon = () => {
    if (media.type === "Showreel") return Video;
    if (media.type === "Audition Clip") return Play;
    if (media.type === "Voice Reel") return Mic;
    return ImageIcon;
  };

  const Icon = getMediaIcon();

  return (
    <>
      <div
        className="card-surface"
        style={{
          border: `1px solid ${media.status === "Rejected" ? "rgba(255, 107, 107, 0.4)" : "var(--glass-border)"}`,
          borderRadius: "20px",
          backgroundColor: "var(--glass-bg)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Media Thumbnail / Preview Area */}
        <div
          style={{
            height: "clamp(140px, 22vw, 190px)",
            width: "100%",
            background: media.gradient || "linear-gradient(135deg, #0f1626 0%, #070b12 100%)",
            backgroundImage: media.url ? `url(${media.url})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Subtle Overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(7, 11, 18, 0.2) 0%, rgba(7, 11, 18, 0.75) 100%)",
            }}
          />

          {/* Type Icon if Video or Audio */}
          {(media.type === "Showreel" || media.type === "Audition Clip") && (
            <div
              onClick={() => setShowPreview(true)}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "rgba(255, 188, 0, 0.9)",
                border: "2px solid rgba(255, 255, 255, 0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1a1300",
                boxShadow: "0 0 16px rgba(255, 188, 0, 0.4)",
                cursor: "pointer",
                position: "relative",
                zIndex: 2,
                transition: "transform var(--transition)",
              }}
              className="media-play-icon"
            >
              <Play size={20} fill="#1a1300" style={{ marginLeft: "3px" }} />
            </div>
          )}

          {/* Top Badges: Translucent Type & Moderation Status */}
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              right: "12px",
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
                padding: "4px 12px",
                borderRadius: "99px",
                backgroundColor: "rgba(7, 11, 18, 0.8)",
                backdropFilter: "blur(6px)",
                color: "#eceaf5",
                border: "1px solid rgba(255, 255, 255, 0.20)",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              <Icon size={12} style={{ color: "var(--gold)" }} />
              {media.type}
            </span>

            <StatusBadge status={media.status} size="xs" />
          </div>

          {/* Duration or Resolution indicator */}
          {(media.duration || media.resolution) && (
            <span
              style={{
                position: "absolute",
                bottom: "10px",
                right: "12px",
                fontSize: "0.7rem",
                fontWeight: "700",
                padding: "2px 8px",
                borderRadius: "99px",
                backgroundColor: "rgba(7, 11, 18, 0.8)",
                backdropFilter: "blur(4px)",
                color: "#eceaf5",
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
            padding: "clamp(12px, 2.5vw, 16px) clamp(12px, 3vw, 18px)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            flex: 1,
            backgroundColor: "transparent",
            minWidth: 0,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
            <h4
              style={{
                fontSize: "0.95rem",
                fontWeight: "700",
                color: "var(--text-primary)",
                margin: 0,
                lineHeight: 1.3,
                overflowWrap: "anywhere",
              }}
            >
              {media.title}
            </h4>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Uploaded on {media.date} • {media.fileSize || "2.5 MB"}
            </span>
          </div>

          {/* Admin Rejection Reason Banner */}
          {media.status === "Rejected" && media.reason && (
            <div
              style={{
                backgroundColor: "var(--danger-bg)",
                border: "1px solid var(--danger-border)",
                borderRadius: "var(--radius-md)",
                padding: "10px 12px",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                marginTop: "4px",
              }}
            >
              <ShieldAlert size={16} style={{ color: "var(--danger)", flexShrink: 0, marginTop: "2px" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--danger)" }}>
                  Admin Moderation Reason:
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.4, overflowWrap: "anywhere" }}>
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
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <button
              onClick={() => setShowPreview(true)}
              className="btn-secondary"
              style={{ fontSize: "0.8rem", padding: "8px 16px", minHeight: "40px", borderRadius: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Eye size={14} />
              <span>Preview</span>
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                color: "var(--text-muted)",
                padding: "8px",
                minHeight: "40px",
                minWidth: "40px",
                borderRadius: "var(--radius-pill)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color var(--transition), background-color var(--transition)",
                cursor: "pointer",
                background: "transparent",
                border: "none",
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
        title={media.title}
        subtitle={`${media.type} • Uploaded ${media.date}`}
        maxWidth="640px"
        footer={
          <button onClick={() => setShowPreview(false)} className="btn-secondary" style={{ padding: "8px 20px" }}>
            Close Preview
          </button>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              width: "100%",
              height: "clamp(200px, 45vh, 360px)",
              borderRadius: "var(--radius-lg)",
              backgroundImage: `url(${media.url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundColor: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {(media.type === "Showreel" || media.type === "Audition Clip") && (
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 188, 0, 0.9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1a1300",
                  boxShadow: "0 0 20px rgba(255, 188, 0, 0.5)",
                }}
              >
                <Play size={28} fill="#1a1300" style={{ marginLeft: "4px" }} />
              </div>
            )}
          </div>

          <div
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              padding: "14px 18px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              fontSize: "0.85rem",
            }}
          >
            <div>
              <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem" }}>
                Moderation Status
              </span>
              <StatusBadge status={media.status} size="sm" />
            </div>

            <div>
              <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem" }}>
                Specs &amp; Resolution
              </span>
              <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>
                {media.resolution || "1080p"} • {media.fileSize || "2.5 MB"}
              </span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Media Item?"
        subtitle="This action cannot be undone."
        maxWidth="440px"
        footer={
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary" style={{ padding: "8px 18px", borderRadius: "12px" }}>
              Cancel
            </button>
            <button
              onClick={() => {
                onDelete(media.id);
                setShowDeleteConfirm(false);
              }}
              style={{
                padding: "8px 18px",
                borderRadius: "12px",
                backgroundColor: "var(--danger)",
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "0.875rem",
                cursor: "pointer",
                border: "none",
              }}
            >
              Confirm Delete
            </button>
          </div>
        }
      >
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
          Are you sure you want to delete <strong style={{ color: "var(--text-primary)" }}>&quot;{media.title}&quot;</strong>?
          It will be permanently removed from your verified talent portfolio.
        </p>
      </Modal>

      <style jsx>{`
        .delete-icon-btn:hover {
          color: var(--danger) !important;
          background-color: var(--danger-bg) !important;
        }
        .media-play-icon:hover {
          transform: scale(1.08);
        }
      `}</style>
    </>
  );
}
