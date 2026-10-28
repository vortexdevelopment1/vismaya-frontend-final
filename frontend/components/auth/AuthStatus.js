"use client";

import React from "react";

/**
 * Shared AuthStatus
 * 
 * Design tokens:
 * - muted: #6B6254
 * - progress track: #EFE6CF
 * - progress gold bar: #8A6B2E
 * - soft gold box: background #FBF3DF, border #EBDDB4, radius 12px, padding 12px 14px, 13px/1.5, color #5E471B
 * - success green: #2F6B45
 * - success spinner track: #CFE3D6, top: #2F6B45
 * - Respects prefers-reduced-motion
 */
export default function AuthStatus({
  status = "idle", // "idle" | "submitting" | "slow" | "success"
  submittingNote = "Verifying your credentials securely",
  slowMessage = "Still working on it. Our server wakes up after a quiet period, so the first sign-in can take up to a minute. Please keep this page open.",
  successNote = "Opening your dashboard...",
  style = {},
}) {
  if (status === "idle") {
    return null;
  }

  if (status === "submitting") {
    return (
      <div
        className="auth-status-container"
        style={{
          marginTop: "12px",
          width: "100%",
          textAlign: "center",
          boxSizing: "border-box",
          ...style,
        }}
      >
        <p
          role="status"
          aria-live="polite"
          className="auth-status-muted"
          style={{
            margin: 0,
            fontSize: "13px",
            color: "#6B6254",
            textAlign: "center",
            lineHeight: 1.4,
            wordBreak: "normal",
            overflowWrap: "break-word",
          }}
        >
          {submittingNote}
        </p>
      </div>
    );
  }

  if (status === "slow") {
    return (
      <div
        className="auth-status-container"
        style={{
          marginTop: "12px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          boxSizing: "border-box",
          ...style,
        }}
      >
        {/* Centred 13px muted line */}
        <p
          role="status"
          aria-live="polite"
          className="auth-status-muted"
          style={{
            margin: 0,
            fontSize: "13px",
            color: "#6B6254",
            textAlign: "center",
            lineHeight: 1.4,
            wordBreak: "normal",
            overflowWrap: "break-word",
          }}
        >
          {submittingNote}
        </p>

        {/* 4px high indeterminate progress bar (track #EFE6CF, 30% wide gold #8A6B2E segment sliding 1.4s loop) */}
        <div
          role="progressbar"
          aria-label="Signing in progress"
          className="auth-progress-track"
          style={{
            height: "4px",
            width: "100%",
            backgroundColor: "#EFE6CF",
            borderRadius: "2px",
            overflow: "hidden",
            position: "relative",
            boxSizing: "border-box",
          }}
        >
          <div
            className="auth-progress-segment"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: "30%",
              backgroundColor: "#8A6B2E",
              borderRadius: "2px",
            }}
          />
        </div>

        {/* Soft gold box: background #FBF3DF, 1px #EBDDB4, radius 12px, padding 12px 14px, 13px/1.5, colour #5E471B */}
        <div
          role="status"
          aria-live="polite"
          className="auth-soft-gold-box"
          style={{
            backgroundColor: "#FBF3DF",
            border: "1px solid #EBDDB4",
            borderRadius: "12px",
            padding: "12px 14px",
            fontSize: "13px",
            lineHeight: 1.5,
            color: "#5E471B",
            textAlign: "left",
            boxSizing: "border-box",
            wordBreak: "normal",
            overflowWrap: "break-word",
          }}
        >
          {slowMessage}
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div
        className="auth-status-container"
        style={{
          marginTop: "12px",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          boxSizing: "border-box",
          ...style,
        }}
      >
        {/* Centred 13px #2F6B45 line with a 14px spinner (2px border #CFE3D6, top #2F6B45): "Opening your dashboard..." */}
        <div
          role="status"
          aria-live="polite"
          className="auth-status-success"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: "13px",
            color: "#2F6B45",
            lineHeight: 1.4,
            textAlign: "center",
            wordBreak: "normal",
            overflowWrap: "break-word",
          }}
        >
          <span className="auth-spinner-14" aria-hidden="true" />
          <span>{successNote}</span>
        </div>
      </div>
    );
  }

  return null;
}
