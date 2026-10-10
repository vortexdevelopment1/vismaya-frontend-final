import React from "react";
import * as LucideIcons from "lucide-react";
import { Inbox } from "lucide-react";
import Link from "next/link";

export default function EmptyState({
  title = "No items found",
  description = "There are no records to display at this moment.",
  iconName = "Inbox",
  icon: IconComponent,
  actionLabel,
  actionHref,
  onAction,
  style = {},
}) {
  const ResolvedIcon = IconComponent || (iconName && LucideIcons[iconName]) || Inbox;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "48px 24px",
        backgroundColor: "rgba(255, 255, 255, 0.04)",
        border: "1px dashed rgba(255, 255, 255, 0.16)",
        borderRadius: "16px",
        maxWidth: "100%",
        ...style,
      }}
    >
      {/* Icon Bubble */}
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: "rgba(255, 188, 0, 0.12)",
          border: "1px solid rgba(255, 188, 0, 0.28)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--gold)",
          marginBottom: "16px",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25)",
        }}
      >
        <ResolvedIcon size={26} />
      </div>

      <h3
        style={{
          fontFamily: "var(--font-heading), 'Playfair Display', serif",
          fontSize: "18px",
          lineHeight: "24px",
          fontWeight: "700",
          color: "#eceaf5",
          marginBottom: "6px",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: "14px",
          lineHeight: "22px",
          color: "#a3acc2",
          maxWidth: "420px",
          marginBottom: (actionLabel && (actionHref || onAction)) ? "20px" : "0",
        }}
      >
        {description}
      </p>

      {actionLabel && (
        actionHref ? (
          <Link href={actionHref} className="btn-primary" style={{ minHeight: "44px", padding: "0 20px" }}>
            {actionLabel}
          </Link>
        ) : onAction ? (
          <button onClick={onAction} className="btn-primary" style={{ minHeight: "44px", padding: "0 20px" }}>
            {actionLabel}
          </button>
        ) : null
      )}
    </div>
  );
}
