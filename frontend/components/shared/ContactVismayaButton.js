"use client";

import React from "react";
import Link from "next/link";
import { Mail, MessageCircle, HelpCircle, ExternalLink } from "lucide-react";
import { supportEmail, supportWhatsapp } from "@/lib/config/support";

/**
 * ContactVismayaButton
 * Honest, demo-ready support button component.
 *
 * Props:
 *  - context: string (e.g. "Rejected opportunity", "Rejected audition tape", "Declined cancellation request", "Rejected verification")
 *  - reference: string | number (id or title to quote for support)
 *  - style?: React.CSSProperties
 *  - className?: string
 */
export default function ContactVismayaButton({
  context = "General Support",
  reference = "",
  style = {},
  className = "",
}) {
  const hasEmail = Boolean(supportEmail && supportEmail.trim());
  const hasWhatsapp = Boolean(supportWhatsapp && supportWhatsapp.trim());
  const hasAnyChannel = hasEmail || hasWhatsapp;

  const refStr = reference ? String(reference) : "";
  const subject = `[Vismaya Support] ${context}${refStr ? ` - Ref #${refStr}` : ""}`;
  const emailBody = `Hello Vismaya Support Desk,\n\nI am contacting you regarding: ${context}\nReference ID: ${refStr || "N/A"}\n\n[Please enter details of your inquiry or appeal here]\n\nThank you.`;
  const mailtoUrl = `mailto:${encodeURIComponent(supportEmail.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

  const cleanWhatsapp = (supportWhatsapp || "").replace(/[^0-9]/g, "");
  const whatsappMsg = `Hello Vismaya Support, regarding ${context}${refStr ? ` (Ref #${refStr})` : ""}: `;
  const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(whatsappMsg)}`;

  if (!hasAnyChannel) {
    return (
      <div
        className={`contact-vismaya-unavailable ${className}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
          padding: "8px 12px",
          borderRadius: "8px",
          backgroundColor: "#F3EFE6",
          border: "1px solid #E8E2D4",
          fontSize: "12.5px",
          color: "#5A584F",
          ...style,
        }}
      >
        <HelpCircle size={14} style={{ color: "#8A6B2E", flexShrink: 0 }} />
        <span>Support contact will be available soon.</span>
        <Link
          href="/support"
          style={{
            color: "#8A6B2E",
            fontWeight: "700",
            textDecoration: "underline",
            fontSize: "12.5px",
            marginLeft: "2px",
          }}
        >
          Go to Support &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`contact-vismaya-actions ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
        ...style,
      }}
    >
      {hasEmail && (
        <a
          href={mailtoUrl}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "8px",
            backgroundColor: "#FFFFFF",
            border: "1.5px solid #8A6B2E",
            color: "#8A6B2E",
            fontSize: "13px",
            fontWeight: "600",
            textDecoration: "none",
            transition: "all 0.16s ease",
            cursor: "pointer",
          }}
          title={`Email Vismaya Support: ${supportEmail}`}
        >
          <Mail size={14} style={{ color: "#8A6B2E" }} />
          <span>Email Support</span>
        </a>
      )}

      {hasWhatsapp && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "8px",
            backgroundColor: "#25D366",
            border: "1.5px solid #20BA59",
            color: "#FFFFFF",
            fontSize: "13px",
            fontWeight: "600",
            textDecoration: "none",
            transition: "all 0.16s ease",
            cursor: "pointer",
          }}
          title={`Chat with Vismaya Support on WhatsApp: ${supportWhatsapp}`}
        >
          <MessageCircle size={14} style={{ color: "#FFFFFF" }} />
          <span>WhatsApp Desk</span>
          <ExternalLink size={12} style={{ opacity: 0.8 }} />
        </a>
      )}
    </div>
  );
}
