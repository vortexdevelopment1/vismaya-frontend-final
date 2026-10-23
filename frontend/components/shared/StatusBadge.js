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

  // Approved / Active / Published / Verified / Completed
  const approvedConfig = {
    bg: "#F3EFE6",
    text: "#2B2D2A",
    border: "#E8E2D4",
    dot: "#8A6B2E",
  };

  // Pending / Awaiting / Needs action / Shortlisted / Under Review
  const pendingConfig = {
    bg: "rgba(138, 107, 46, 0.12)",
    text: "#6E5420",
    border: "rgba(138, 107, 46, 0.25)",
    dot: "#8A6B2E",
  };

  // Relayed / Submitted / Draft / Info / Inactive
  const neutralConfig = {
    bg: "#F3EFE6",
    text: "#5A584F",
    border: "#E8E2D4",
    dot: "#C9A55C",
  };

  // Rejected / Cancelled / Declined / Suspended
  const redConfig = {
    bg: "rgba(180, 35, 24, 0.08)",
    text: "#B42318",
    border: "rgba(180, 35, 24, 0.25)",
    dot: "#B42318",
  };

  const badgeConfig = {
    // Approved family
    approved: { ...approvedConfig, label: "Approved" },
    active: { ...approvedConfig, label: "Active" },
    selected: { ...approvedConfig, label: "Selected" },
    available: { ...approvedConfig, label: "Available" },
    published: { ...approvedConfig, label: "Published" },
    verified: { ...approvedConfig, label: "Verified" },
    paid: { ...approvedConfig, label: "Paid" },
    successful: { ...approvedConfig, label: "Successful" },
    completed: { ...approvedConfig, label: "Completed" },
    live: { ...approvedConfig, label: "Live" },
    "self-tape-received": { ...approvedConfig, label: "Self-Tape Received" },
    "forwarded-to-org": { ...approvedConfig, label: "Forwarded to Org" },
    "forwarded-&-verified": { ...approvedConfig, label: "Forwarded & Verified" },
    reviewed: { ...approvedConfig, label: "Reviewed" },

    // Pending family
    pending: { ...pendingConfig, label: "Pending" },
    "pending-review": { ...pendingConfig, label: "Pending Review" },
    awaiting: { ...pendingConfig, label: "Awaiting" },
    "needs-action": { ...pendingConfig, label: "Needs Action" },
    shortlisted: { ...pendingConfig, label: "Shortlisted" },
    featured: { ...pendingConfig, label: "Featured" },
    "audition-scheduled": { ...pendingConfig, label: "Audition Scheduled" },
    scheduled: { ...pendingConfig, label: "Scheduled" },
    "under-review": { ...pendingConfig, label: "Under Review" },
    "under-vismaya-review": { ...pendingConfig, label: "Under Review" },
    "corrections-requested": { ...pendingConfig, label: "Corrections Requested" },
    "cancellation-requested": { ...pendingConfig, label: "Cancellation Requested" },
    "audition-requested": { ...pendingConfig, label: "Audition Requested" },
    requested: { ...pendingConfig, label: "Audition Requested" },

    // Neutral family
    submitted: { ...neutralConfig, label: "Submitted" },
    "relayed-to-talent": { ...neutralConfig, label: "Relayed to Talent" },
    applied: { ...neutralConfig, label: "Applied" },
    draft: { ...neutralConfig, label: "Draft" },
    incomplete: { ...neutralConfig, label: "Incomplete" },
    "incomplete-/-draft": { ...neutralConfig, label: "Incomplete / Draft" },
    closed: { ...neutralConfig, label: "Closed" },
    unpaid: { ...neutralConfig, label: "Unpaid / Credit" },
    withdrawn: { ...neutralConfig, label: "Withdrawn" },
    inactive: { ...neutralConfig, label: "Inactive" },
    info: { ...neutralConfig, label: "Info" },

    // Rejected family
    rejected: { ...redConfig, label: "Rejected" },
    declined: { ...redConfig, label: "Declined" },
    cancelled: { ...redConfig, label: "Cancelled" },
    "opportunity-cancelled": { ...redConfig, label: "Opportunity Cancelled" },
    "opportunity_cancelled": { ...redConfig, label: "Opportunity Cancelled" },
    suspended: { ...redConfig, label: "Suspended" },
    "not-selected": { ...redConfig, label: "Not Selected" },
    urgent: { ...redConfig, label: "Urgent" },
    "closing-soon": { ...redConfig, label: "Closing Soon" },
    restricted: { ...redConfig, label: "Restricted" },
    banned: { ...redConfig, label: "Banned" },
  };

  const current = badgeConfig[normalized] || {
    ...neutralConfig,
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
        height: size === "xs" ? "22px" : "26px",
        minHeight: size === "xs" ? "22px" : "26px",
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
        fontFamily: "var(--font-body), 'Inter', sans-serif",
        ...style,
      }}
    >
      {showDot && (
        <span
          style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            backgroundColor: current.dot || current.text,
            flexShrink: 0,
          }}
        />
      )}
      <span>{displayLabel}</span>
    </span>
  );
}
