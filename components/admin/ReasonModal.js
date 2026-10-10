"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, X, Check } from "lucide-react";
import Modal from "@/components/shared/Modal";

export default function ReasonModal({
  isOpen,
  onClose,
  title = "Provide Action Reason",
  description = "A specific reason is required for platform record and compliance logging.",
  confirmLabel = "Confirm Action",
  confirmVariant = "danger", // "danger" | "warning" | "primary"
  quickReasons = [],
  onConfirm,
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please provide a reason before submitting.");
      return;
    }
    onConfirm(reason.trim());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      maxWidth="480px"
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", paddingTop: "6px" }}>
        {/* Quick Reason Chips */}
        {quickReasons && quickReasons.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "0.725rem", color: "#a3acc2", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Quick Selection Presets:
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {quickReasons.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setReason(preset);
                    setError("");
                  }}
                  style={{
                    fontSize: "0.75rem",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    backgroundColor: reason === preset ? "rgba(255, 188, 0, 0.18)" : "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${reason === preset ? "var(--gold)" : "rgba(255, 255, 255, 0.12)"}`,
                    color: reason === preset ? "var(--gold)" : "#eceaf5",
                    cursor: "pointer",
                    fontWeight: reason === preset ? "700" : "500",
                    transition: "all 0.15s ease",
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reason Text Area */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#eceaf5" }}>
            Reason / Moderation Notes <span style={{ color: "var(--status-danger, #ff6b6b)" }}>*</span>
          </label>
          <textarea
            rows={3}
            placeholder="Type reason or clarification notes..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError("");
            }}
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: `1px solid ${error ? "#ff6b6b" : "rgba(255, 255, 255, 0.14)"}`,
              borderRadius: "12px",
              padding: "10px 12px",
              color: "#eceaf5",
              fontSize: "0.85rem",
              outline: "none",
              resize: "vertical",
            }}
          />
          {error && (
            <span style={{ fontSize: "0.725rem", color: "#ff6b6b" }}>{error}</span>
          )}
        </div>

        {/* Footer Buttons */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", paddingTop: "6px" }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: "8px 16px", fontSize: "0.825rem", borderRadius: "12px" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: "8px 18px",
              fontSize: "0.825rem",
              background: confirmVariant === "danger"
                ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                : "var(--gold-gradient, linear-gradient(135deg, #ffd54a 0%, #ffbc00 100%))",
              color: confirmVariant === "danger" ? "#ffffff" : "#1a1300",
              borderRadius: "12px",
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
              boxShadow: confirmVariant === "danger" ? "0 4px 14px rgba(220, 38, 38, 0.35)" : "0 4px 14px rgba(255, 188, 0, 0.35)",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
