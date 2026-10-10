import React from "react";

export default function StatusBadge({
  status = "Active",
  label,
  size = "md",
  showDot = true,
  className = "",
  style = {},
}) {
  const normalized = (status || "").toLowerCase().trim().replace(/\s+/g, "-");

  const badgeConfig = {
    approved: {
      bg: "rgba(52, 211, 153, 0.14)",
      text: "#34d399",
      border: "rgba(52, 211, 153, 0.35)",
      label: "Approved",
    },
    active: {
      bg: "rgba(52, 211, 153, 0.14)",
      text: "#34d399",
      border: "rgba(52, 211, 153, 0.35)",
      label: "Active",
    },
    selected: {
      bg: "rgba(52, 211, 153, 0.14)",
      text: "#34d399",
      border: "rgba(52, 211, 153, 0.35)",
      label: "Selected",
    },
    available: {
      bg: "rgba(52, 211, 153, 0.14)",
      text: "#34d399",
      border: "rgba(52, 211, 153, 0.35)",
      label: "Available",
    },
    published: {
      bg: "rgba(52, 211, 153, 0.14)",
      text: "#34d399",
      border: "rgba(52, 211, 153, 0.35)",
      label: "Published",
    },
    verified: {
      bg: "rgba(52, 211, 153, 0.14)",
      text: "#34d399",
      border: "rgba(52, 211, 153, 0.35)",
      label: "Verified",
    },
    paid: {
      bg: "rgba(52, 211, 153, 0.14)",
      text: "#34d399",
      border: "rgba(52, 211, 153, 0.35)",
      label: "Paid",
    },
    successful: {
      bg: "rgba(52, 211, 153, 0.14)",
      text: "#34d399",
      border: "rgba(52, 211, 153, 0.35)",
      label: "Paid",
    },
    completed: {
      bg: "rgba(52, 211, 153, 0.14)",
      text: "#34d399",
      border: "rgba(52, 211, 153, 0.35)",
      label: "Completed",
    },
    shortlisted: {
      bg: "rgba(255, 188, 0, 0.14)",
      text: "#ffbc00",
      border: "rgba(255, 188, 0, 0.35)",
      label: "Shortlisted",
    },
    featured: {
      bg: "rgba(255, 188, 0, 0.14)",
      text: "#ffbc00",
      border: "rgba(255, 188, 0, 0.35)",
      label: "Featured",
    },
    "audition-scheduled": {
      bg: "rgba(255, 188, 0, 0.14)",
      text: "#ffbc00",
      border: "rgba(255, 188, 0, 0.35)",
      label: "Audition Scheduled",
    },
    scheduled: {
      bg: "rgba(255, 188, 0, 0.14)",
      text: "#ffbc00",
      border: "rgba(255, 188, 0, 0.35)",
      label: "Audition Scheduled",
    },
    "under-review": {
      bg: "rgba(255, 188, 0, 0.14)",
      text: "#ffbc00",
      border: "rgba(255, 188, 0, 0.35)",
      label: "Under Review",
    },
    "under-vismaya-review": {
      bg: "rgba(255, 188, 0, 0.14)",
      text: "#ffbc00",
      border: "rgba(255, 188, 0, 0.35)",
      label: "Under Review",
    },
    "corrections-requested": {
      bg: "rgba(255, 188, 0, 0.14)",
      text: "#ffbc00",
      border: "rgba(255, 188, 0, 0.35)",
      label: "Corrections Requested",
    },
    "cancellation-requested": {
      bg: "rgba(255, 188, 0, 0.14)",
      text: "#ffbc00",
      border: "rgba(255, 188, 0, 0.35)",
      label: "Cancellation Requested",
    },
    pending: {
      bg: "rgba(255, 188, 0, 0.14)",
      text: "#ffbc00",
      border: "rgba(255, 188, 0, 0.35)",
      label: "Pending Review",
    },
    submitted: {
      bg: "rgba(255, 188, 0, 0.14)",
      text: "#ffbc00",
      border: "rgba(255, 188, 0, 0.35)",
      label: "Submitted",
    },
    "audition-requested": {
      bg: "rgba(255, 188, 0, 0.14)",
      text: "#ffbc00",
      border: "rgba(255, 188, 0, 0.35)",
      label: "Audition Requested",
    },
    requested: {
      bg: "rgba(255, 188, 0, 0.14)",
      text: "#ffbc00",
      border: "rgba(255, 188, 0, 0.35)",
      label: "Audition Requested",
    },
    "relayed-to-talent": {
      bg: "rgba(255, 188, 0, 0.14)",
      text: "#ffbc00",
      border: "rgba(255, 188, 0, 0.35)",
      label: "Relayed to Talent",
    },
    "self-tape-received": {
      bg: "rgba(52, 211, 153, 0.14)",
      text: "#34d399",
      border: "rgba(52, 211, 153, 0.35)",
      label: "Self-Tape Received",
    },
    "forwarded-to-org": {
      bg: "rgba(52, 211, 153, 0.14)",
      text: "#34d399",
      border: "rgba(52, 211, 153, 0.35)",
      label: "Forwarded to Org",
    },
    reviewed: {
      bg: "rgba(52, 211, 153, 0.14)",
      text: "#34d399",
      border: "rgba(52, 211, 153, 0.35)",
      label: "Reviewed",
    },
    applied: {
      bg: "rgba(255, 255, 255, 0.08)",
      text: "#eceaf5",
      border: "rgba(255, 255, 255, 0.20)",
      label: "Applied",
    },
    draft: {
      bg: "rgba(255, 255, 255, 0.06)",
      text: "#a3acc2",
      border: "rgba(255, 255, 255, 0.14)",
      label: "Draft",
    },
    rejected: {
      bg: "rgba(255, 107, 107, 0.14)",
      text: "#ff6b6b",
      border: "rgba(255, 107, 107, 0.35)",
      label: "Rejected",
    },
    cancelled: {
      bg: "rgba(255, 107, 107, 0.14)",
      text: "#ff6b6b",
      border: "rgba(255, 107, 107, 0.35)",
      label: "Cancelled",
    },
    closed: {
      bg: "rgba(255, 255, 255, 0.06)",
      text: "#a3acc2",
      border: "rgba(255, 255, 255, 0.14)",
      label: "Closed",
    },
    "not-selected": {
      bg: "rgba(255, 107, 107, 0.14)",
      text: "#ff6b6b",
      border: "rgba(255, 107, 107, 0.35)",
      label: "Not Selected",
    },
    urgent: {
      bg: "rgba(255, 107, 107, 0.14)",
      text: "#ff6b6b",
      border: "rgba(255, 107, 107, 0.35)",
      label: "Urgent",
    },
    "closing-soon": {
      bg: "rgba(255, 107, 107, 0.14)",
      text: "#ff6b6b",
      border: "rgba(255, 107, 107, 0.35)",
      label: "Closing Soon",
    },
    unpaid: {
      bg: "rgba(255, 255, 255, 0.06)",
      text: "#a3acc2",
      border: "rgba(255, 255, 255, 0.14)",
      label: "Unpaid / Credit",
    },
    withdrawn: {
      bg: "rgba(255, 255, 255, 0.06)",
      text: "#a3acc2",
      border: "rgba(255, 255, 255, 0.14)",
      label: "Withdrawn",
    },
    restricted: {
      bg: "rgba(255, 107, 107, 0.14)",
      text: "#ff6b6b",
      border: "rgba(255, 107, 107, 0.35)",
      label: "Restricted",
    },
    banned: {
      bg: "rgba(255, 107, 107, 0.14)",
      text: "#ff6b6b",
      border: "rgba(255, 107, 107, 0.35)",
      label: "Banned",
    },
    live: {
      bg: "rgba(52, 211, 153, 0.14)",
      text: "#34d399",
      border: "rgba(52, 211, 153, 0.35)",
      label: "Live",
    },
  };

  const current = badgeConfig[normalized] || {
    bg: "rgba(255, 255, 255, 0.08)",
    text: "#eceaf5",
    border: "rgba(255, 255, 255, 0.18)",
    label: label || status,
  };

  const displayLabel = label || current.label;

  return (
    <span
      className={`status-badge ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        height: size === "xs" ? "20px" : "24px",
        minHeight: size === "xs" ? "20px" : "24px",
        padding: size === "xs" ? "0 8px" : "0 10px",
        fontSize: size === "xs" ? "10px" : "11px",
        fontWeight: "700",
        borderRadius: "999px",
        backgroundColor: current.bg,
        color: current.text,
        border: `1px solid ${current.border}`,
        whiteSpace: "nowrap",
        lineHeight: 1,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        ...style,
      }}
    >
      {showDot && (
        <span
          style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            backgroundColor: current.text,
            flexShrink: 0,
          }}
        />
      )}
      <span>{displayLabel}</span>
    </span>
  );
}
