"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  ArrowRight,
  Tv,
  Film,
  Clapperboard,
  Music,
  Camera,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import {
  formatDate,
  getDeadlineChipInfo,
  formatTypeShort,
  formatRemunerationDisplay,
} from "@/lib/shared/dateUtils";

const BRAND_GRADIENTS = [
  "linear-gradient(135deg, #1a1c1a 0%, #292c29 60%, #3d413d 100%)",
  "linear-gradient(155deg, #161816 0%, #242724 60%, #383c38 100%)",
  "linear-gradient(175deg, #1e201e 0%, #2b2e2b 60%, #3f433f 100%)",
  "linear-gradient(120deg, #181a18 0%, #262926 60%, #3a3e3a 100%)",
];

function getOpportunityTypeIcon(type) {
  switch (type) {
    case "Commercial / TVC":
    case "Commercial":
      return Tv;
    case "Feature Film":
      return Film;
    case "OTT Series":
      return Clapperboard;
    case "Music Video":
      return Music;
    case "Print / Editorial":
    case "Print":
      return Camera;
    case "Theatre":
      return Sparkles;
    default:
      return Film;
  }
}

export default function PublicOpportunityCard({
  opportunity,
  project,
  index = 0,
}) {
  const [isHovered, setIsHovered] = useState(false);

  if (!opportunity) return null;

  const gradient = BRAND_GRADIENTS[index % BRAND_GRADIENTS.length];
  const TypeIcon = getOpportunityTypeIcon(opportunity.opportunityType);
  const typeShort = formatTypeShort(opportunity.opportunityType);
  const deadlineInfo = getDeadlineChipInfo(opportunity.deadline);
  const remunerationInfo = formatRemunerationDisplay(opportunity.remuneration);

  const primaryRole = opportunity.roles?.[0];
  const roleTitle = primaryRole
    ? `${primaryRole.roleName}${primaryRole.gender && primaryRole.gender !== "Any" ? ` (${primaryRole.gender})` : ""}`
    : "Audition Candidate";

  const projectName =
    project?.title ||
    opportunity.projectName ||
    "Production Studio";

  return (
    <div
      className="public-opp-card card-surface"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: "var(--bg-surface)",
        border: `1px solid ${isHovered ? "var(--text-primary)" : "var(--border-color)"}`,
        borderRadius: "20px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxShadow: isHovered
          ? "var(--shadow-lg)"
          : "var(--shadow-md)",
        transform: isHovered ? "translateY(-4px)" : "translateY(0)",
        transition: "transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease",
      }}
    >
      {/* 1. MEDIA HEADER (DARK STUDIO BANNER) */}
      <div
        style={{
          position: "relative",
          height: "115px",
          background: gradient,
          padding: "14px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          overflow: "hidden",
          flexShrink: 0,
          borderBottom: "1px solid rgba(255, 255, 255, 0.10)",
        }}
      >
        {/* Subtle grid texture overlay */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
            pointerEvents: "none",
          }}
        />

        {/* Large Soft Type Watermark Icon */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "10px",
            bottom: "-10px",
            color: "rgba(255, 255, 255, 0.16)",
            pointerEvents: "none",
            transform: "rotate(-6deg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TypeIcon size={76} strokeWidth={1.2} />
        </div>

        {/* Top-Left Chip: Opportunity Type */}
        <span
          title={opportunity.opportunityType}
          style={{
            position: "relative",
            zIndex: 2,
            backgroundColor: "rgba(255, 255, 255, 0.12)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.22)",
            color: "#FAF9F6",
            fontSize: "11px",
            fontWeight: 700,
            lineHeight: 1,
            borderRadius: "999px",
            padding: "6px 12px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "145px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {typeShort}
        </span>

        {/* Top-Right Chip: Deadline */}
        <span
          title={`Deadline: ${formatDate(opportunity.deadline)}`}
          style={{
            position: "relative",
            zIndex: 2,
            backgroundColor: deadlineInfo.isUrgent
              ? "rgba(255, 107, 107, 0.25)"
              : "rgba(255, 255, 255, 0.12)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: deadlineInfo.isUrgent
              ? "1px solid rgba(255, 107, 107, 0.50)"
              : "1px solid rgba(255, 255, 255, 0.22)",
            color: deadlineInfo.isUrgent ? "#ff8a8a" : "#FAF9F6",
            fontSize: "11px",
            fontWeight: 700,
            lineHeight: 1,
            borderRadius: "999px",
            padding: "6px 12px",
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            letterSpacing: "0.04em",
          }}
        >
          {deadlineInfo.isUrgent && <AlertCircle size={12} style={{ color: "#ff8a8a" }} />}
          <span>{deadlineInfo.label}</span>
        </span>
      </div>

      {/* 2. BODY */}
      <div
        style={{
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          flex: 1,
        }}
      >
        {/* Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <Link
            href={`/opportunities/${opportunity.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <h3
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "18px",
                lineHeight: "1.35",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
                minHeight: "2.7em",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
                cursor: "pointer",
                transition: "color 180ms ease",
              }}
            >
              {opportunity.title}
            </h3>
          </Link>

          {/* Project Line */}
          <div
            title={`Project: ${projectName}`}
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: "1.4",
              minHeight: "1.4em",
            }}
          >
            <span>Project: </span>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{projectName}</span>
          </div>
        </div>

        {/* Role Box */}
        <div
          style={{
            backgroundColor: "var(--bg-alt)",
            border: "1px solid var(--border-color)",
            borderRadius: "4px",
            padding: "10px 12px",
            minHeight: "60px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              letterSpacing: "0.1em",
              fontWeight: 700,
              color: "var(--gold)",
              textTransform: "uppercase",
              display: "block",
              marginBottom: "2px",
              lineHeight: 1.2,
            }}
          >
            Role Details
          </span>
          <span
            title={roleTitle}
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-primary)",
              lineHeight: 1.35,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {roleTitle}
          </span>
        </div>

        {/* Meta List (Location & Deadline) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            minHeight: "44px",
            justifyContent: "center",
          }}
        >
          {/* Location */}
          <div
            title={opportunity.location || "Mumbai"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              color: "var(--text-secondary)",
              minWidth: 0,
            }}
          >
            <MapPin size={14} style={{ color: "var(--gold)", flexShrink: 0 }} />
            <span
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: "1.3",
              }}
            >
              {opportunity.location || "Mumbai, India"}
            </span>
          </div>

          {/* Formatted Deadline */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              color: "var(--text-secondary)",
              whiteSpace: "nowrap",
            }}
          >
            <Calendar size={14} style={{ color: "var(--gold)", flexShrink: 0 }} />
            <span style={{ whiteSpace: "nowrap", lineHeight: "1.3" }}>
              Closes {formatDate(opportunity.deadline)}
            </span>
          </div>
        </div>

        {/* 3. FOOTER PINNED TO BOTTOM */}
        <div
          className="opp-card-footer"
          style={{
            marginTop: "auto",
            borderTop: "1px solid var(--border-color)",
            paddingTop: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          {/* Remuneration */}
          <div
            title={remunerationInfo.full}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              minWidth: 0,
              flex: 1,
            }}
          >
            <span
              style={{
                fontSize: "10px",
                color: "var(--text-secondary)",
                fontWeight: 600,
                lineHeight: 1.2,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Remuneration
            </span>
            <span
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "block",
              }}
            >
              {remunerationInfo.display}
            </span>
          </div>

          {/* View Details Button */}
          <Link
            href={`/opportunities/${opportunity.id}`}
            className="btn-primary opp-view-btn"
            style={{
              height: "36px",
              padding: "0 16px",
              fontSize: "11px",
              borderRadius: "4px",
              flexShrink: 0,
            }}
          >
            <span>View</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 390px) {
          .opp-card-footer {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          :global(.opp-view-btn) {
            width: 100% !important;
            justify-content: center !important;
          }
        }
      `}</style>
    </div>
  );
}
