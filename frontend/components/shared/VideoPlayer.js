"use client";

import React, { useState, useEffect } from "react";
import { Film, AlertCircle, Video } from "lucide-react";

export default function VideoPlayer({
  src,
  poster,
  fileName,
  height = "280px",
  style = {},
  className = "",
}) {
  const [hasError, setHasError] = useState(false);

  // Reset error if src changes to a new value
  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div
        className={`video-player-fallback ${className}`}
        style={{
          width: "100%",
          minHeight: height,
          backgroundColor: "var(--bg-alt, #F0EEE7)",
          borderRadius: "14px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-primary, #2B2D2A)",
          textAlign: "center",
          padding: "24px 20px",
          border: "1px solid var(--border-color, #E4E1D9)",
          gap: "10px",
          ...style,
        }}
      >
        <div
          className="video-fallback-icon-wrap"
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: "rgba(138, 107, 46, 0.12)",
            border: "1px solid rgba(138, 107, 46, 0.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--gold, #8A6B2E)",
          }}
        >
          <Film size={24} />
        </div>
        <div>
          <strong
            className="video-fallback-title"
            style={{
              display: "block",
              fontSize: "0.925rem",
              color: "var(--text-primary, #2B2D2A)",
              marginBottom: "4px",
            }}
          >
            Preview not available after refresh
          </strong>
          <p
            className="video-fallback-desc"
            style={{
              fontSize: "0.785rem",
              color: "var(--text-secondary, #5A584F)",
              margin: 0,
              maxWidth: "380px",
              lineHeight: 1.4,
            }}
          >
            {fileName ? `File: ${fileName} • ` : ""}Local object preview URLs reset upon page reload. In production, self-tapes stream from permanent cloud storage.
          </p>
        </div>

        <style jsx>{`
          @media (max-width: 640px) {
            .video-player-fallback {
              min-height: unset !important;
              max-height: 140px !important;
              padding: 12px !important;
              border-radius: 8px !important;
              gap: 8px !important;
              background-color: #F3EFE6 !important;
              border: 1px solid #E8E2D4 !important;
            }
            .video-fallback-icon-wrap {
              width: 32px !important;
              height: 32px !important;
              min-width: 32px !important;
            }
            .video-fallback-icon-wrap :global(svg) {
              width: 16px !important;
              height: 16px !important;
            }
            .video-fallback-title {
              font-size: 13px !important;
              margin-bottom: 2px !important;
              color: #2B2D2A !important;
            }
            .video-fallback-desc {
              font-size: 11.5px !important;
              line-height: 1.35 !important;
              color: #5A584F !important;
              display: -webkit-box !important;
              -webkit-line-clamp: 2 !important;
              -webkit-box-orient: vertical !important;
              overflow: hidden !important;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        aspectRatio: "16 / 9",
        backgroundColor: "#070b12",
        borderRadius: "14px",
        overflow: "hidden",
        border: "1px solid rgba(255, 255, 255, 0.14)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
      className={`video-player-wrap ${className}`}
    >
      <video
        controls
        playsInline
        src={src}
        poster={poster}
        onError={() => setHasError(true)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          backgroundColor: "#070b12",
          outline: "none",
          display: "block",
        }}
      />
      <style jsx>{`
        @media (max-width: 640px) {
          .video-player-wrap {
            max-height: 220px !important;
            border-radius: 8px !important;
          }
          .video-player-wrap video {
            max-height: 220px !important;
          }
        }
      `}</style>
    </div>
  );
}
