"use client";

import React, { useState } from "react";
import { Flag, Loader2, CheckCircle2 } from "lucide-react";
import Modal from "./Modal";
import apiClient from "@/lib/api/client";

const REPORT_REASONS = [
  "Inappropriate content",
  "Copyright",
  "Fake or misleading",
  "Spam",
  "Other",
];

export default function ReportModal({
  isOpen,
  onClose,
  targetType, // "MediaItem" | "Opportunity"
  targetId,
  targetTitle = "this item",
  onSuccess,
}) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetId) return;

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      let endpoint = "";
      if (targetType === "MediaItem") {
        endpoint = `/api/media/${targetId}/report`;
      } else if (targetType === "Opportunity") {
        endpoint = `/api/opportunities/${targetId}/report`;
      } else {
        endpoint = `/api/reports`;
      }

      const res = await apiClient.post(endpoint, {
        targetType,
        targetId,
        reason,
        details: details.trim(),
      });

      const msg = res?.data?.message || res?.message || "Thanks, Vismaya will review this.";
      setSuccessMessage(msg);

      if (onSuccess) {
        onSuccess(res);
      }

      setTimeout(() => {
        onClose();
        setSuccessMessage("");
        setDetails("");
      }, 2000);
    } catch (err) {
      console.error("Report submit error:", err);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit report. Please try again.";
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Report ${targetType === "MediaItem" ? "Media Content" : "Opportunity"}`}
      subtitle={`Flag ${targetTitle} for review by the Vismaya moderation team.`}
      maxWidth="480px"
    >
      {successMessage ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "24px 16px",
            textAlign: "center",
            gap: "12px",
          }}
        >
          <CheckCircle2 size={40} style={{ color: "#34D399" }} />
          <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#2B2D2A" }}>
            Report Submitted
          </h4>
          <p style={{ margin: 0, fontSize: "14px", color: "#5A584F" }}>{successMessage}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                backgroundColor: "#FEECEC",
                border: "1px solid #F5C2C2",
                color: "#D93838",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>
              Reason for reporting *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                height: "40px",
                borderRadius: "8px",
                border: "1px solid #E8E2D4",
                padding: "0 10px",
                fontSize: "13.5px",
                backgroundColor: "#FFFFFF",
                color: "#2B2D2A",
              }}
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>
              Additional details (optional)
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any additional context to assist the moderation team..."
              style={{
                borderRadius: "8px",
                border: "1px solid #E8E2D4",
                padding: "10px 12px",
                fontSize: "13px",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #E8E2D4",
                background: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                border: "none",
                background: "#D93838",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {submitting ? (
                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <Flag size={14} />
              )}
              Submit Report
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
