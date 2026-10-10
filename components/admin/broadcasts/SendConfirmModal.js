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
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
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
          background: "#0d1424",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "520px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8)",
          color: "var(--tx, #eceaf5)",
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
                borderRadius: "10px",
                backgroundColor: "rgba(255, 188, 0, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--gold, #ffbc00)",
              }}
            >
              <Megaphone size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#eceaf5" }}>
                Confirm Broadcast Dispatch
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--mu, #a3acc2)" }}>
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
              color: "var(--mu, #a3acc2)",
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
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "14px",
            display: "grid",
            gap: "10px",
            fontSize: "13px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--mu, #a3acc2)" }}>Target Audience:</span>
            <b style={{ color: "#eceaf5" }}>{audience}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--mu, #a3acc2)" }}>Estimated Reach:</span>
            <b style={{ color: "var(--gold, #ffbc00)" }}>{estimatedRecipients}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--mu, #a3acc2)" }}>Category:</span>
            <b style={{ color: "#eceaf5" }}>{category}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--mu, #a3acc2)" }}>Channels:</span>
            <b style={{ color: "#eceaf5" }}>{channelsSummary}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--mu, #a3acc2)" }}>Delivery:</span>
            <b style={{ color: "#eceaf5" }}>{deliverySummary}</b>
          </div>
        </div>

        {/* Message preview snippet */}
        <div
          style={{
            backgroundColor: "#111a2c",
            border: "1px solid rgba(255, 188, 0, 0.25)",
            borderRadius: "10px",
            padding: "12px 14px",
            fontSize: "13px",
          }}
        >
          {title?.trim() && (
            <div style={{ fontWeight: "600", marginBottom: "4px", color: "#eceaf5" }}>
              {title.trim()}
            </div>
          )}
          <div style={{ color: "#eceaf5", lineHeight: "1.5", fontSize: "12px" }}>
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
