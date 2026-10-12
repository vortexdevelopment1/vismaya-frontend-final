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
            <span style={{ fontSize: "0.725rem", color: "var(--text-secondary, #5A5C53)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
                    backgroundColor: reason === preset ? "rgba(155, 122, 63, 0.14)" : "var(--bg-alt, #F0EEE7)",
                    border: `1px solid ${reason === preset ? "var(--gold, #9B7A3F)" : "var(--border-color, #E4E1D9)"}`,
                    color: reason === preset ? "var(--gold, #9B7A3F)" : "var(--text-primary, #292C29)",
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
          <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary, #292C29)" }}>
            Reason / Moderation Notes <span style={{ color: "var(--status-red, #B84A39)" }}>*</span>
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
              backgroundColor: "var(--bg-surface, #FFFFFF)",
              border: `1px solid ${error ? "var(--status-red, #B84A39)" : "var(--border-color, #E4E1D9)"}`,
              borderRadius: "4px",
              padding: "10px 12px",
              color: "var(--text-primary, #292C29)",
              fontSize: "0.85rem",
              outline: "none",
              resize: "vertical",
            }}
          />
          {error && (
            <span style={{ fontSize: "0.725rem", color: "var(--status-red, #B84A39)" }}>{error}</span>
          )}
        </div>

        {/* Footer Buttons */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", paddingTop: "6px" }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: "8px 16px", fontSize: "0.825rem", borderRadius: "4px" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: "8px 18px",
              fontSize: "0.825rem",
              backgroundColor: confirmVariant === "danger"
                ? "var(--status-red, #B84A39)"
                : "var(--gold, #9B7A3F)",
              color: "#FAF9F6",
              borderRadius: "4px",
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
