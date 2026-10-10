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
  "linear-gradient(135deg, #070b12 0%, #0f1626 50%, rgba(255, 188, 0, 0.15) 100%)",
  "linear-gradient(155deg, #0a0f19 0%, #141c2e 50%, rgba(255, 188, 0, 0.18) 100%)",
  "linear-gradient(175deg, #070b12 0%, #10192b 50%, rgba(255, 213, 74, 0.15) 100%)",
  "linear-gradient(120deg, #0a0f19 0%, #151e33 50%, rgba(255, 188, 0, 0.16) 100%)",
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
  const [isBtnHovered, setIsBtnHovered] = useState(false);

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
      className="public-opp-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.055)",
        border: `1px solid ${isHovered ? "rgba(255, 188, 0, 0.45)" : "rgba(255, 255, 255, 0.14)"}`,
        borderRadius: "20px",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxShadow: isHovered
          ? "0 20px 45px rgba(0, 0, 0, 0.55), 0 0 24px rgba(255, 188, 0, 0.15)"
          : "0 10px 30px rgba(0, 0, 0, 0.35)",
        transform: isHovered ? "translateY(-4px)" : "translateY(0)",
        transition: "transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease",
      }}
    >
      {/* 1. MEDIA HEADER */}
      <div
        style={{
          position: "relative",
          height: "120px",
          background: gradient,
          padding: "14px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          overflow: "hidden",
          flexShrink: 0,
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
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
            color: "rgba(255, 255, 255, 0.12)",
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
            backgroundColor: "rgba(255, 255, 255, 0.10)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.20)",
            color: "#eceaf5",
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

        {/* Top-Right Chip: Deadline (Red-tinted when urgent, else glass chip) */}
        <span
          title={`Deadline: ${formatDate(opportunity.deadline)}`}
          style={{
            position: "relative",
            zIndex: 2,
            backgroundColor: deadlineInfo.isUrgent
              ? "rgba(255, 107, 107, 0.22)"
              : "rgba(255, 255, 255, 0.10)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: deadlineInfo.isUrgent
              ? "1px solid rgba(255, 107, 107, 0.50)"
              : "1px solid rgba(255, 255, 255, 0.20)",
            color: deadlineInfo.isUrgent ? "#ff6b6b" : "#eceaf5",
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
          {deadlineInfo.isUrgent && <AlertCircle size={12} style={{ color: "#ff6b6b" }} />}
          <span>{deadlineInfo.label}</span>
        </span>
      </div>

      {/* 2. BODY */}
      <div
        style={{
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          flex: 1,
        }}
      >
        {/* Title: Playfair Display */}
        <div>
          <Link
            href={`/opportunities/${opportunity.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <h3
              style={{
                fontFamily: "var(--font-heading), 'Playfair Display', serif",
                fontSize: "20px",
                lineHeight: "28px",
                fontWeight: 700,
                color: isHovered ? "var(--gold)" : "#eceaf5",
                margin: 0,
                minHeight: "56px",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                cursor: "pointer",
                transition: "color 180ms ease",
              }}
            >
              {opportunity.title}
            </h3>
          </Link>
        </div>

        {/* Project Line */}
        <div
          title={`Project: ${projectName}`}
          style={{
            fontSize: "13px",
            color: "#a3acc2",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineHeight: "18px",
            marginTop: "-6px",
          }}
        >
          <span style={{ color: "#7e89a3", fontWeight: 400 }}>Project: </span>
          <span style={{ fontWeight: 600, color: "#eceaf5" }}>{projectName}</span>
        </div>

        {/* Role Box */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "12px 14px",
            minHeight: "64px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              letterSpacing: "0.14em",
              fontWeight: 800,
              color: "var(--gold)",
              textTransform: "uppercase",
              display: "block",
              marginBottom: "3px",
              lineHeight: 1.2,
            }}
          >
            Role Details
          </span>
          <span
            title={roleTitle}
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#eceaf5",
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

        {/* Meta List */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginTop: "2px",
          }}
        >
          {/* Location */}
          <div
            title={opportunity.location || "Mumbai"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              color: "#a3acc2",
              minWidth: 0,
            }}
          >
            <MapPin size={15} style={{ color: "var(--gold)", flexShrink: 0 }} />
            <span
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: "18px",
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
              fontSize: "13px",
              color: "#a3acc2",
              whiteSpace: "nowrap",
            }}
          >
            <Calendar size={15} style={{ color: "var(--gold)", flexShrink: 0 }} />
            <span style={{ whiteSpace: "nowrap", lineHeight: "18px" }}>
              Closes {formatDate(opportunity.deadline)}
            </span>
          </div>
        </div>

        {/* 3. FOOTER */}
        <div
          className="opp-card-footer"
          style={{
            marginTop: "auto",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            paddingTop: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
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
                fontSize: "11px",
                color: "#a3acc2",
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
                fontFamily: "var(--font-heading), 'Playfair Display', serif",
                fontSize: "17px",
                fontWeight: 700,
                color: "var(--gold)",
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
            onMouseEnter={() => setIsBtnHovered(true)}
            onMouseLeave={() => setIsBtnHovered(false)}
            className="opp-view-btn"
            style={{
              height: "42px",
              minHeight: "42px",
              borderRadius: "10px",
              backgroundColor: isBtnHovered ? "var(--gold)" : "rgba(255, 255, 255, 0.08)",
              border: `1px solid ${isBtnHovered ? "var(--gold)" : "rgba(255, 255, 255, 0.18)"}`,
              color: isBtnHovered ? "#1a1300" : "#eceaf5",
              fontSize: "11px",
              fontWeight: 800,
              padding: "0 18px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              textDecoration: "none",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              transition: "all 180ms ease",
              flexShrink: 0,
              cursor: "pointer",
              boxShadow: isBtnHovered ? "0 4px 14px rgba(255, 188, 0, 0.35)" : "none",
            }}
          >
            <span>View</span>
            <ArrowRight
              size={14}
              style={{
                transform: isBtnHovered ? "translateX(2px)" : "translateX(0)",
                transition: "transform 180ms ease",
              }}
            />
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
