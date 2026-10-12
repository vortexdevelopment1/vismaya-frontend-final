"use client";

import React from "react";
import styles from "./broadcasts.module.css";
import { Megaphone, X, Send } from "lucide-react";

export default function SendConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  audience,
  category,
  title,
  message,
  estimatedRecipients,
  channelsSummary,
  deliverySummary,
  isSubmitting,
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(43, 45, 42, 0.55)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--bg-surface, #FFFFFF)",
          border: "1px solid var(--border-color, #E4E1D9)",
          borderRadius: "8px",
          width: "100%",
          maxWidth: "520px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          boxShadow: "0 20px 48px rgba(41, 44, 41, 0.16)",
          color: "var(--text-primary, #292C29)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "rgba(155, 122, 63, 0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--gold, #9B7A3F)",
              }}
            >
              <Megaphone size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", fontFamily: "Georgia, serif", color: "var(--text-primary, #292C29)" }}>
                Confirm Broadcast Dispatch
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-secondary, #5A5C53)" }}>
                Please review the broadcast details before sending.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted, #777970)",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Summary Details */}
        <div
          style={{
            backgroundColor: "var(--bg-alt, #F0EEE7)",
            border: "1px solid var(--border-color, #E4E1D9)",
            borderRadius: "4px",
            padding: "14px",
            display: "grid",
            gap: "10px",
            fontSize: "13px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary, #5A5C53)" }}>Target Audience:</span>
            <b style={{ color: "var(--text-primary, #292C29)" }}>{audience}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary, #5A5C53)" }}>Estimated Reach:</span>
            <b style={{ color: "var(--gold, #9B7A3F)" }}>{estimatedRecipients}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary, #5A5C53)" }}>Category:</span>
            <b style={{ color: "var(--text-primary, #292C29)" }}>{category}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary, #5A5C53)" }}>Channels:</span>
            <b style={{ color: "var(--text-primary, #292C29)" }}>{channelsSummary}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary, #5A5C53)" }}>Delivery:</span>
            <b style={{ color: "var(--text-primary, #292C29)" }}>{deliverySummary}</b>
          </div>
        </div>

        {/* Message preview snippet */}
        <div
          style={{
            backgroundColor: "#FAF9F6",
            border: "1px solid var(--border-color, #E4E1D9)",
            borderRadius: "4px",
            padding: "12px 14px",
            fontSize: "13px",
          }}
        >
          {title?.trim() && (
            <div style={{ fontWeight: "700", marginBottom: "4px", color: "var(--text-primary, #292C29)" }}>
              {title.trim()}
            </div>
          )}
          <div style={{ color: "var(--text-secondary, #5A5C53)", lineHeight: "1.5", fontSize: "12px" }}>
            {message}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
          <button
            type="button"
            className={`${styles.btn} ${styles.gh}`}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.pr}`}
            onClick={onConfirm}
            disabled={isSubmitting}
            style={{ gap: "6px" }}
          >
            <Send size={14} />
            <span>{isSubmitting ? "Dispatching..." : "Confirm & Send"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
