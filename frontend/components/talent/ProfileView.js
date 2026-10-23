"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  Image as ImageIcon,
  Briefcase,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Edit3,
  ExternalLink,
  Lock,
  Plus,
  MapPin,
  Calendar,
  Globe,
  Sparkles,
  Phone,
  Mail,
  X,
  Eye,
  Check,
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import ProgressBar from "@/components/shared/ProgressBar";
import { useTalent } from "@/lib/talent/TalentContext";
import { optimizeCloudinaryUrl } from "@/lib/api/uploadMedia";

const CATEGORY_LABELS = {
  open_talent: "Open Talent",
  film_and_tv: "Film & TV Production",
  voice_over: "Voice Over & Dubbing",
  dance_and_performing_arts: "Dance & Performing Arts",
  crew_and_production: "Crew & Technical Production",
};

const AVAILABILITY_LABELS = {
  available_now: "Available Now (Immediate)",
  open_to_opportunities: "Open to Opportunities",
  available_from: "Available Scheduled",
  occupied: "Currently Occupied",
  unavailable: "Unavailable",
};

const CAREER_STAGE_LABELS = {
  aspiring: "Aspiring (0 - 1 years)",
  emerging: "Emerging (1 - 3 years)",
  experienced: "Experienced (3 - 5 years)",
  mid_level: "Mid-Level Professional (5 - 10 years)",
  veteran: "Veteran / Master (10+ years)",
};

function calculateClientAge(dobStr) {
  if (!dobStr) return null;
  const d = new Date(dobStr);
  if (isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  const ageDt = new Date(diffMs);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
}

function formatDate(dobStr) {
  if (!dobStr) return null;
  const d = new Date(dobStr);
  if (isNaN(d.getTime())) return dobStr;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getInitials(name) {
  if (!name) return "TA";
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Common card style adhering strictly to cream/gold-brown/charcoal
const cardStyle = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E8E2D4",
  borderRadius: "16px",
  padding: "24px 28px",
  boxShadow: "0 2px 8px rgba(43, 45, 42, 0.03)",
  display: "flex",
  flexDirection: "column",
  gap: "18px",
};

export default function ProfileView({ onEditStep }) {
  const { profile, portfolio = [] } = useTalent();
  const [showRecruiterPreview, setShowRecruiterPreview] = useState(false);

  const profileStrength = Math.min(100, Math.max(0, Number(profile.profileCompletionPercentage || 0)));
  const computedAge = calculateClientAge(profile.dob || profile.personal?.dob);
  const isMinor = computedAge !== null ? computedAge < 18 : Boolean(profile.isUnder18);

  const displayName = profile.stageName?.trim() || profile.personal?.stageName?.trim() || profile.personal?.fullName?.trim() || profile.name?.trim() || "Artist Profile";
  const mainPhoto = profile.profilePhoto || profile.avatar || profile.personal?.avatar || profile.personal?.profilePhoto;

  const primaryProf = profile.primaryProfession || profile.profession || profile.personal?.primaryRole || "";
  const headline = profile.headline || profile.personal?.headline || "";
  const currentCity = profile.currentCity || profile.personal?.city || profile.city || "";
  const currentState = profile.currentState || profile.personal?.state || profile.state || "";
  const locationStr = [currentCity, currentState].filter(Boolean).join(", ") || (currentCity || currentState || "");

  // Missing sections items for checklist
  const missingItems = Array.isArray(profile.missingSections) && profile.missingSections.length > 0
    ? profile.missingSections
    : (() => {
        const items = [];
        if (!primaryProf || !profile.category) items.push("Step 1: Set Talent Category and Primary Profession.");
        if (!profile.bio || profile.bio.trim().length < 200) items.push("Step 1: Add a Professional Bio between 200 and 1000 characters.");
        if (!currentCity) items.push("Step 1: Provide your current City.");
        if (!profile.skills || profile.skills.length === 0 || !profile.languages || profile.languages.length === 0) {
          items.push("Step 1: Add at least 1 Performing Skill and 1 Language.");
        }
        if (!mainPhoto) items.push("Step 2: Upload a Main Profile Photo.");
        if (!portfolio || portfolio.length === 0) items.push("Step 2: Upload at least 1 portfolio photo or showreel video.");
        if (!profile.credits || profile.credits.length === 0) items.push("Step 3: Add at least 1 past work credit or experience.");
        if (!profile.physicalAttributes?.heightCm && !profile.physical?.height) {
          items.push(isMinor ? "Step 4: Add your height measurement and Guardian details." : "Step 4: Add your height measurement.");
        }
        return items;
      })();

  const getStepForMissing = (msg) => {
    if (msg.includes("Step 1")) return 1;
    if (msg.includes("Step 2")) return 2;
    if (msg.includes("Step 3")) return 3;
    if (msg.includes("Step 4")) return 4;
    return 1;
  };

  const renderValue = (val, id) => {
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      return <span id={id} style={{ color: "#2B2D2A", fontWeight: "600" }}>{String(val)}</span>;
    }
    return <span id={id} style={{ color: "#7A7870", fontStyle: "italic", fontWeight: "400" }}>Not added yet</span>;
  };

  return (
    <div className="talent-profile-view-root" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      {/* 1. HEADER CARD */}
      <div style={cardStyle} className="view-card-header">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            {/* Main Photo / Initials */}
            <div
              style={{
                width: "96px",
                height: "96px",
                borderRadius: "50%",
                backgroundColor: "#F3EFE6",
                border: "2px solid #E8E2D4",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(43, 45, 42, 0.06)",
              }}
            >
              {mainPhoto ? (
                <img
                  src={optimizeCloudinaryUrl(mainPhoto, { width: 200, height: 200, crop: "fill" })}
                  alt={displayName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span
                  style={{
                    fontSize: "32px",
                    fontWeight: 700,
                    color: "#8A6B2E",
                    fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                  }}
                >
                  {getInitials(displayName)}
                </span>
              )}
            </div>

            {/* Basic Info */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h1
                  id="view-stage-name"
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#2B2D2A",
                    margin: 0,
                    fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                  }}
                >
                  {displayName}
                </h1>
                <StatusBadge status={profile.status || "approved"} />
              </div>

              {/* Vismaya ID & Category/Profession */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "13px", color: "#5A584F" }}>
                <span
                  id="view-vismaya-id"
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    backgroundColor: "#F3EFE6",
                    color: "#8A6B2E",
                    border: "1px solid #E8E2D4",
                    letterSpacing: "0.04em",
                  }}
                >
                  {profile.vismayaId || profile.id || "VIS-TALENT"}
                </span>
                <span>&bull;</span>
                <span id="view-profession" style={{ fontWeight: 600, color: "#8A6B2E" }}>
                  {CATEGORY_LABELS[profile.category] || "Open Talent"} &bull; {primaryProf || "Actor"}
                </span>
              </div>

              {/* Headline */}
              <div id="view-headline" style={{ fontSize: "14px", color: headline ? "#2B2D2A" : "#7A7870", fontStyle: headline ? "normal" : "italic", marginTop: "2px" }}>
                {headline || "Not added yet"}
              </div>

              {/* Location & Availability */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", fontSize: "12.5px", color: "#5A584F", marginTop: "4px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <MapPin size={14} style={{ color: "#8A6B2E" }} />
                  <span id="view-location">{locationStr || "Not added yet"}</span>
                </span>
                <span>&bull;</span>
                <span id="view-availability" style={{ fontWeight: 600, color: "#2B2D2A" }}>
                  {AVAILABILITY_LABELS[profile.availability?.status] || "Available Now"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              id="btn-recruiter-preview"
              type="button"
              onClick={() => setShowRecruiterPreview(true)}
              className="btn-secondary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                fontSize: "13px",
                height: "38px",
                borderRadius: "8px",
              }}
            >
              <Eye size={15} />
              <span>View as recruiters see me</span>
            </button>

            <button
              id="btn-edit-profile"
              type="button"
              onClick={() => onEditStep(1)}
              className="btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 20px",
                fontSize: "13px",
                height: "38px",
                borderRadius: "8px",
                backgroundColor: "#8A6B2E",
                color: "#FFFFFF",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              <Edit3 size={15} />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Profile Strength Progress Bar */}
        <div style={{ borderTop: "1px solid #F3EFE6", paddingTop: "14px", marginTop: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Sparkles size={16} style={{ color: "#8A6B2E" }} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#2B2D2A" }}>
                Profile Completion Score
              </span>
            </div>
            <span
              id="view-profile-strength"
              style={{
                fontSize: "12.5px",
                fontWeight: "700",
                color: profileStrength >= 100 ? "#027A48" : "#8A6B2E",
              }}
            >
              {profileStrength}% Complete
            </span>
          </div>
          <ProgressBar progress={profileStrength} />
        </div>
      </div>

      {/* 2. "COMPLETE YOUR PROFILE" CHECKLIST CARD (ONLY when strength < 100%) */}
      {profileStrength < 100 && (
        <div
          id="checklist-card"
          style={{
            ...cardStyle,
            backgroundColor: "#FDFBF7",
            border: "1px solid #E8E2D4",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ padding: "6px", borderRadius: "8px", backgroundColor: "#F3EFE6", color: "#8A6B2E" }}>
                <AlertCircle size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#2B2D2A", margin: 0 }}>
                  Complete Your Artist Profile ({profileStrength}% / 100%)
                </h3>
                <span style={{ fontSize: "12px", color: "#5A584F" }}>
                  Higher completion unlocks priority casting director discovery and verified auditions.
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
            {missingItems.map((item, idx) => {
              const stepTarget = getStepForMissing(item);
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E8E2D4",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "#8A6B2E",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: "13px", color: "#2B2D2A", fontWeight: "500" }}>
                      {item}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEditStep(stepTarget)}
                    className="btn-secondary"
                    style={{
                      padding: "4px 12px",
                      fontSize: "12px",
                      height: "30px",
                      borderRadius: "6px",
                      flexShrink: 0,
                    }}
                  >
                    Go to Step {stepTarget}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. PROFESSIONAL DETAILS CARD */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F3EFE6", paddingBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "#F3EFE6", color: "#8A6B2E" }}>
              <User size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#2B2D2A", margin: 0 }}>
                Professional Craft &amp; Identity
              </h2>
              <span style={{ fontSize: "12px", color: "#5A584F" }}>Primary and secondary disciplines, bio, and locations</span>
            </div>
          </div>

          <button
            id="link-edit-step1"
            type="button"
            onClick={() => onEditStep(1)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              color: "#8A6B2E",
              backgroundColor: "transparent",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Edit3 size={14} />
            <span>Edit</span>
          </button>
        </div>

        {/* Content Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }} className="view-grid-2col">
          {/* Category & Primary */}
          <div>
            <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#7A7870", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
              Talent Category &bull; Primary Profession
            </span>
            <span id="view-category-primary" style={{ fontSize: "14px", fontWeight: 600, color: "#2B2D2A" }}>
              {CATEGORY_LABELS[profile.category] || "Open Talent"} &bull; {primaryProf || "Actor"}
            </span>
          </div>

          {/* Secondary Professions / Departments */}
          <div>
            <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#7A7870", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
              Secondary Professions
            </span>
            <div id="view-secondary-professions" style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {Array.isArray(profile.secondaryProfessions) && profile.secondaryProfessions.length > 0 ? (
                profile.secondaryProfessions.map((sp, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: "inline-block",
                      padding: "3px 10px",
                      borderRadius: "999px",
                      backgroundColor: "#F3EFE6",
                      border: "1px solid #E8E2D4",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#8A6B2E",
                    }}
                  >
                    {sp}
                  </span>
                ))
              ) : (
                <span style={{ color: "#7A7870", fontStyle: "italic", fontSize: "13px" }}>Not added yet</span>
              )}
            </div>
          </div>

          {/* Specializations */}
          <div>
            <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#7A7870", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
              Specializations &amp; Craft Styles
            </span>
            <div id="view-specializations" style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {Array.isArray(profile.specializations) && profile.specializations.length > 0 ? (
                profile.specializations.map((spec, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: "inline-block",
                      padding: "3px 10px",
                      borderRadius: "999px",
                      backgroundColor: "#FAF9F7",
                      border: "1px solid #E8E2D4",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#2B2D2A",
                    }}
                  >
                    {spec}
                  </span>
                ))
              ) : (
                <span style={{ color: "#7A7870", fontStyle: "italic", fontSize: "13px" }}>Not added yet</span>
              )}
            </div>
          </div>

          {/* Career Stage */}
          <div>
            <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#7A7870", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
              Career Stage &bull; Experience Range
            </span>
            <span id="view-career-stage" style={{ fontSize: "14px", fontWeight: 600, color: "#2B2D2A" }}>
              {CAREER_STAGE_LABELS[profile.careerStage] || "Aspiring"} &bull; {profile.experienceRange ? `${profile.experienceRange} yrs` : "<1 yr"}
            </span>
          </div>

          {/* Professional Bio (Span 2) */}
          <div style={{ gridColumn: "1 / -1" }}>
            <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#7A7870", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
              Professional Bio
            </span>
            <p
              id="view-bio"
              style={{
                fontSize: "13.5px",
                lineHeight: "1.6",
                color: profile.bio ? "#2B2D2A" : "#7A7870",
                fontStyle: profile.bio ? "normal" : "italic",
                margin: 0,
                whiteSpace: "pre-wrap",
                backgroundColor: "#FAF9F7",
                padding: "14px 16px",
                borderRadius: "10px",
                border: "1px solid #E8E2D4",
              }}
            >
              {profile.bio || "Not added yet"}
            </p>
          </div>

          {/* Location & Working Cities */}
          <div>
            <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#7A7870", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
              Current Primary Location
            </span>
            <span style={{ fontSize: "14px" }}>
              {renderValue(locationStr, "view-full-location")}
            </span>
            <div style={{ fontSize: "12px", color: "#7A7870", marginTop: "3px" }}>
              City: {renderValue(currentCity, "view-city")} &bull; State: {renderValue(currentState, "view-state")}
            </div>
          </div>

          <div>
            <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#7A7870", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
              Working Cities
            </span>
            <div id="view-working-cities" style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {Array.isArray(profile.workingCities) && profile.workingCities.length > 0 ? (
                profile.workingCities.map((c, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: "inline-block",
                      padding: "3px 10px",
                      borderRadius: "999px",
                      backgroundColor: "#F3EFE6",
                      border: "1px solid #E8E2D4",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#8A6B2E",
                    }}
                  >
                    {c}
                  </span>
                ))
              ) : (
                <span style={{ color: "#7A7870", fontStyle: "italic", fontSize: "13px" }}>Not added yet</span>
              )}
            </div>
          </div>

          {/* Travel & Relocation Toggles */}
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "13px", color: "#2B2D2A" }}>
            <span>
              Willing to travel:{" "}
              <strong id="view-willing-to-travel" style={{ color: profile.willingToTravel ? "#027A48" : "#7A7870" }}>
                {profile.willingToTravel ? "Yes" : "No"}
              </strong>
            </span>
            <span>
              Willing to relocate:{" "}
              <strong id="view-willing-to-relocate" style={{ color: profile.willingToRelocate ? "#027A48" : "#7A7870" }}>
                {profile.willingToRelocate ? "Yes" : "No"}
              </strong>
            </span>
            <span>
              Open to work anywhere:{" "}
              <strong id="view-open-anywhere" style={{ color: profile.openToWorkAnywhere ? "#027A48" : "#7A7870" }}>
                {profile.openToWorkAnywhere ? "Yes" : "No"}
              </strong>
            </span>
          </div>

          {/* Skills Chips */}
          <div>
            <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#7A7870", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
              Performing Skills &amp; Talents
            </span>
            <div id="view-skills" style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {Array.isArray(profile.skills) && profile.skills.length > 0 ? (
                profile.skills.map((sk, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: "inline-block",
                      padding: "3px 10px",
                      borderRadius: "999px",
                      backgroundColor: "#F3EFE6",
                      border: "1px solid #E8E2D4",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#8A6B2E",
                    }}
                  >
                    {typeof sk === "string" ? sk : sk.name}
                  </span>
                ))
              ) : (
                <span style={{ color: "#7A7870", fontStyle: "italic", fontSize: "13px" }}>Not added yet</span>
              )}
            </div>
          </div>

          {/* Languages Chips */}
          <div>
            <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#7A7870", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
              Languages &amp; Dialects
            </span>
            <div id="view-languages" style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {Array.isArray(profile.languages) && profile.languages.length > 0 ? (
                profile.languages.map((l, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: "inline-block",
                      padding: "3px 10px",
                      borderRadius: "999px",
                      backgroundColor: "#FAF9F7",
                      border: "1px solid #E8E2D4",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#2B2D2A",
                    }}
                  >
                    {typeof l === "string" ? l : l.language}
                  </span>
                ))
              ) : (
                <span style={{ color: "#7A7870", fontStyle: "italic", fontSize: "13px" }}>Not added yet</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. PORTFOLIO & MEDIA CARD */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F3EFE6", paddingBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "#F3EFE6", color: "#8A6B2E" }}>
              <ImageIcon size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#2B2D2A", margin: 0 }}>
                Portfolio &amp; Media Gallery
              </h2>
              <span style={{ fontSize: "12px", color: "#5A584F" }}>Headshots, comp cards, showreels, and audition tapes</span>
            </div>
          </div>

          <button
            id="link-edit-step2"
            type="button"
            onClick={() => onEditStep(2)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              color: "#8A6B2E",
              backgroundColor: "transparent",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Edit3 size={14} />
            <span>Edit</span>
          </button>
        </div>

        {/* Media Grid or Empty State */}
        {portfolio.length === 0 && !mainPhoto ? (
          <div
            style={{
              padding: "36px 20px",
              textAlign: "center",
              borderRadius: "12px",
              backgroundColor: "#FAF9F7",
              border: "1px dashed #E8E2D4",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "#F3EFE6", display: "flex", alignItems: "center", justifyContent: "center", color: "#8A6B2E" }}>
              <ImageIcon size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: "14.5px", fontWeight: "700", color: "#2B2D2A", margin: "0 0 4px 0" }}>
                No portfolio items uploaded yet
              </h3>
              <p style={{ fontSize: "12.5px", color: "#7A7870", margin: 0, maxWidth: "380px" }}>
                Upload high-resolution headshots, showreels, and comp cards to showcase your craft to verified casting directors.
              </p>
            </div>
            <button
              id="btn-add-portfolio"
              type="button"
              onClick={() => onEditStep(2)}
              className="btn-primary"
              style={{ padding: "8px 18px", fontSize: "13px", borderRadius: "8px" }}
            >
              <Plus size={14} /> Add portfolio
            </button>
          </div>
        ) : (
          <div
            id="view-portfolio-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "16px",
            }}
          >
            {/* If Main Photo exists, show it as first item */}
            {mainPhoto && (
              <div
                style={{
                  borderRadius: "12px",
                  border: "2px solid #8A6B2E",
                  overflow: "hidden",
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 2px 8px rgba(43, 45, 42, 0.06)",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ position: "relative", width: "100%", height: "160px", backgroundColor: "#F3EFE6" }}>
                  <img
                    src={optimizeCloudinaryUrl(mainPhoto, { width: 300, height: 260, crop: "fill" })}
                    alt="Main Profile Photo"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      top: "8px",
                      left: "8px",
                      padding: "2px 8px",
                      borderRadius: "999px",
                      backgroundColor: "#8A6B2E",
                      color: "#FFFFFF",
                      fontSize: "10.5px",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                    }}
                  >
                    Main Photo
                  </span>
                </div>
                <div style={{ padding: "8px 10px" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: "700", color: "#2B2D2A", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    Primary Profile Photo
                  </span>
                  <span style={{ fontSize: "11px", color: "#5A584F" }}>Public &bull; Headshot</span>
                </div>
              </div>
            )}

            {/* Other Portfolio Items */}
            {portfolio.map((item, idx) => (
              <div
                key={item._id || item.id || idx}
                style={{
                  borderRadius: "12px",
                  border: "1px solid #E8E2D4",
                  overflow: "hidden",
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 2px 6px rgba(43, 45, 42, 0.04)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ position: "relative", width: "100%", height: "160px", backgroundColor: "#F3EFE6" }}>
                  {item.thumbnailUrl || item.url ? (
                    <img
                      src={optimizeCloudinaryUrl(item.thumbnailUrl || item.url, { width: 300, height: 260, crop: "fill" })}
                      alt={item.title || "Portfolio Item"}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#8A6B2E" }}>
                      <ImageIcon size={30} />
                    </div>
                  )}
                  <span
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      padding: "2px 7px",
                      borderRadius: "999px",
                      backgroundColor: item.visibility === "private" ? "rgba(43, 45, 42, 0.75)" : "rgba(138, 107, 46, 0.85)",
                      color: "#FFFFFF",
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "capitalize",
                    }}
                  >
                    {item.visibility || "Public"}
                  </span>
                </div>
                <div style={{ padding: "8px 10px" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: "700", color: "#2B2D2A", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.title || "Portfolio Media"}
                  </span>
                  <span style={{ fontSize: "11px", color: "#5A584F", textTransform: "capitalize" }}>
                    {item.category?.replace(/_/g, " ") || "Media"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. WORK EXPERIENCE CARD */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F3EFE6", paddingBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "#F3EFE6", color: "#8A6B2E" }}>
              <Briefcase size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#2B2D2A", margin: 0 }}>
                Verified Work Experience &amp; Credits
              </h2>
              <span style={{ fontSize: "12px", color: "#5A584F" }}>Film, television, theatre, commercial and voice productions</span>
            </div>
          </div>

          <button
            id="link-edit-step3"
            type="button"
            onClick={() => onEditStep(3)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              color: "#8A6B2E",
              backgroundColor: "transparent",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Edit3 size={14} />
            <span>Edit</span>
          </button>
        </div>

        {/* Credits List or Empty State */}
        {!Array.isArray(profile.credits) || profile.credits.length === 0 ? (
          <div
            style={{
              padding: "36px 20px",
              textAlign: "center",
              borderRadius: "12px",
              backgroundColor: "#FAF9F7",
              border: "1px dashed #E8E2D4",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "#F3EFE6", display: "flex", alignItems: "center", justifyContent: "center", color: "#8A6B2E" }}>
              <Briefcase size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: "14.5px", fontWeight: "700", color: "#2B2D2A", margin: "0 0 4px 0" }}>
                No work credits added yet
              </h3>
              <p style={{ fontSize: "12.5px", color: "#7A7870", margin: 0, maxWidth: "380px" }}>
                Add your past roles, screen credits, or theatre productions to build trust with casting directors.
              </p>
            </div>
            <button
              id="btn-add-credits"
              type="button"
              onClick={() => onEditStep(3)}
              className="btn-primary"
              style={{ padding: "8px 18px", fontSize: "13px", borderRadius: "8px" }}
            >
              <Plus size={14} /> Add work experience
            </button>
          </div>
        ) : (
          <div id="view-credits-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {profile.credits.map((c, idx) => (
              <div
                key={c._id || c.id || idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  backgroundColor: "#FAF9F7",
                  border: "1px solid #E8E2D4",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#2B2D2A" }}>
                      {c.projectTitle || c.project}
                    </span>
                    {c.year && (
                      <span style={{ fontSize: "12px", color: "#5A584F", fontWeight: 500 }}>
                        ({c.year})
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "12.5px", color: "#5A584F" }}>
                    <strong>Role:</strong> {c.roleOrDesignation || c.role || "Performer"} &bull; <strong>Type:</strong> {c.projectType || "Feature Film"}
                  </span>
                  {c.referenceLink && (
                    <a
                      href={c.referenceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: "11.5px", color: "#8A6B2E", display: "inline-flex", alignItems: "center", gap: "4px", textDecoration: "none", marginTop: "2px" }}
                    >
                      <ExternalLink size={12} /> Link Reference
                    </a>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <StatusBadge status={c.verificationStatus || (c.isVerifiedCredit ? "verified" : "pending")} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. PERSONAL INFO CARD (Step 4) */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F3EFE6", paddingBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "#F3EFE6", color: "#8A6B2E" }}>
              <Lock size={18} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#2B2D2A", margin: 0 }}>
                  Confidential Personal Info &amp; Physical Specifications
                </h2>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    backgroundColor: "#FEF3F2",
                    color: "#B42318",
                    fontSize: "11px",
                    fontWeight: 700,
                    border: "1px solid #FECDCA",
                  }}
                >
                  <Lock size={11} /> Private: visible only to you and Vismaya admin
                </span>
              </div>
              <span style={{ fontSize: "12px", color: "#5A584F" }}>
                Physical attributes and date of birth are never published publicly.
              </span>
            </div>
          </div>

          <button
            id="link-edit-step4"
            type="button"
            onClick={() => onEditStep(4)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              color: "#8A6B2E",
              backgroundColor: "transparent",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Edit3 size={14} />
            <span>Edit</span>
          </button>
        </div>

        {/* Physical & Demographic Details Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }} className="view-grid-3col">
          {/* DOB & Age */}
          <div>
            <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#7A7870", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
              Date of Birth &bull; Age
            </span>
            <span id="view-dob" style={{ fontSize: "14px" }}>
              {profile.dob || profile.personal?.dob ? (
                <span style={{ color: "#2B2D2A", fontWeight: "600" }}>
                  {formatDate(profile.dob || profile.personal?.dob)} {computedAge !== null ? `(${computedAge} yrs)` : ""}
                </span>
              ) : (
                <span style={{ color: "#7A7870", fontStyle: "italic" }}>Not added yet</span>
              )}
            </span>
          </div>

          {/* Gender */}
          <div>
            <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#7A7870", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
              Gender
            </span>
            <span id="view-gender" style={{ fontSize: "14px" }}>
              {renderValue(profile.gender || profile.personal?.gender, "view-gender-val")}
            </span>
          </div>

          {/* Nationality */}
          <div>
            <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#7A7870", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
              Nationality
            </span>
            <span id="view-nationality" style={{ fontSize: "14px" }}>
              {renderValue(profile.nationality || "Indian", "view-nationality-val")}
            </span>
          </div>

          {/* Height */}
          <div>
            <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#7A7870", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
              Height
            </span>
            <span id="view-height" style={{ fontSize: "14px" }}>
              {profile.physicalAttributes?.heightCm || profile.physical?.height ? (
                <span style={{ color: "#2B2D2A", fontWeight: "600" }}>
                  {profile.physicalAttributes?.heightCm ? `${profile.physicalAttributes.heightCm} cm` : profile.physical?.height}
                </span>
              ) : (
                <span style={{ color: "#7A7870", fontStyle: "italic" }}>Not added yet</span>
              )}
            </span>
          </div>

          {/* Weight */}
          <div>
            <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#7A7870", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
              Weight
            </span>
            <span id="view-weight" style={{ fontSize: "14px" }}>
              {profile.physicalAttributes?.weightKg || profile.physical?.weight ? (
                <span style={{ color: "#2B2D2A", fontWeight: "600" }}>
                  {profile.physicalAttributes?.weightKg ? `${profile.physicalAttributes.weightKg} kg` : profile.physical?.weight}
                </span>
              ) : (
                <span style={{ color: "#7A7870", fontStyle: "italic" }}>Not added yet</span>
              )}
            </span>
          </div>

          {/* Body Type */}
          <div>
            <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#7A7870", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
              Body Type
            </span>
            <span id="view-body-type" style={{ fontSize: "14px" }}>
              {renderValue(profile.physicalAttributes?.bodyType || profile.physical?.bodyType, "view-body-type-val")}
            </span>
          </div>

          {/* Skin Tone */}
          <div>
            <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#7A7870", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
              Skin Tone
            </span>
            <span id="view-skin-tone" style={{ fontSize: "14px" }}>
              {renderValue(profile.physicalAttributes?.skinTone || profile.physical?.skinTone, "view-skin-tone-val")}
            </span>
          </div>

          {/* Eye Color */}
          <div>
            <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#7A7870", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
              Eye Color
            </span>
            <span id="view-eye-color" style={{ fontSize: "14px" }}>
              {renderValue(profile.physicalAttributes?.eyeColor || profile.physical?.eyeColor, "view-eye-color-val")}
            </span>
          </div>

          {/* Hair Color */}
          <div>
            <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#7A7870", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
              Hair Color
            </span>
            <span id="view-hair-color" style={{ fontSize: "14px" }}>
              {renderValue(profile.physicalAttributes?.hairColor || profile.physical?.hairColor, "view-hair-color-val")}
            </span>
          </div>
        </div>

        {/* 7. GUARDIAN / PARENT CARD (Rendered ONLY if under 18) */}
        {isMinor && (
          <div
            id="view-guardian-card"
            style={{
              marginTop: "8px",
              padding: "16px 18px",
              borderRadius: "12px",
              backgroundColor: "#FAF9F7",
              border: "1px solid #E8E2D4",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldAlert size={18} style={{ color: "#8A6B2E" }} />
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#2B2D2A" }}>
                Verified Legal Guardian / Parent Consent (Minor Performer)
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }} className="view-grid-2col">
              <div>
                <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#7A7870", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>
                  Guardian Name
                </span>
                <span id="view-guardian-name" style={{ fontSize: "13.5px" }}>
                  {renderValue(profile.guardianDetails?.guardianName || profile.guardianConsent?.guardianName, "view-guardian-name-val")}
                </span>
              </div>

              <div>
                <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#7A7870", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>
                  Relationship to Minor
                </span>
                <span id="view-guardian-relationship" style={{ fontSize: "13.5px" }}>
                  {renderValue(profile.guardianDetails?.relationship || profile.guardianConsent?.relationship, "view-guardian-relationship-val")}
                </span>
              </div>

              <div>
                <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#7A7870", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>
                  Contact Phone
                </span>
                <span id="view-guardian-phone" style={{ fontSize: "13.5px" }}>
                  {renderValue(profile.guardianDetails?.contactNumber || profile.guardianConsent?.guardianPhone || profile.guardianConsent?.phone, "view-guardian-phone-val")}
                </span>
              </div>

              <div>
                <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#7A7870", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>
                  Guardian Email
                </span>
                <span id="view-guardian-email" style={{ fontSize: "13.5px" }}>
                  {renderValue(profile.guardianDetails?.guardianEmail || profile.guardianConsent?.guardianEmail, "view-guardian-email-val")}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "#027A48", fontWeight: 600 }}>
              <CheckCircle2 size={16} />
              <span id="view-guardian-consent">Legal representation and audition participation consent verified</span>
            </div>
          </div>
        )}
      </div>

      {/* RECRUITER PREVIEW MODAL */}
      {showRecruiterPreview && (
        <div
          id="recruiter-preview-modal"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(43, 45, 42, 0.65)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowRecruiterPreview(false)}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E2D4",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 40px rgba(43, 45, 42, 0.2)",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 22px",
                borderBottom: "1px solid #E8E2D4",
                backgroundColor: "#FAF9F7",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Eye size={18} style={{ color: "#8A6B2E" }} />
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#2B2D2A", margin: 0 }}>
                    Public Recruiter View (Privacy Filter Active)
                  </h3>
                  <span style={{ fontSize: "11.5px", color: "#5A584F" }}>
                    Private phone numbers, physical specifications, and guardian details are hidden from recruiters.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRecruiterPreview(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#5A584F",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Recruiter Preview Body */}
            <div style={{ padding: "22px", display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    backgroundColor: "#F3EFE6",
                    border: "1px solid #E8E2D4",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {mainPhoto ? (
                    <img src={mainPhoto} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: "24px", fontWeight: 700, color: "#8A6B2E" }}>{getInitials(displayName)}</span>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "18px", fontWeight: "700", color: "#2B2D2A" }}>{displayName}</span>
                    <StatusBadge status={profile.status || "approved"} />
                  </div>
                  <span style={{ fontSize: "13px", color: "#8A6B2E", fontWeight: 600 }}>
                    {CATEGORY_LABELS[profile.category] || "Open Talent"} &bull; {primaryProf}
                  </span>
                  <span style={{ fontSize: "12.5px", color: "#5A584F" }}>
                    {locationStr || "India"} &bull; {AVAILABILITY_LABELS[profile.availability?.status] || "Available"}
                  </span>
                </div>
              </div>

              {headline && (
                <div style={{ fontSize: "13.5px", color: "#2B2D2A", fontStyle: "italic", borderLeft: "3px solid #8A6B2E", paddingLeft: "10px" }}>
                  &ldquo;{headline}&rdquo;
                </div>
              )}

              {profile.bio && (
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#7A7870", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>
                    Professional Bio
                  </span>
                  <p style={{ fontSize: "13px", lineHeight: 1.5, color: "#2B2D2A", margin: 0 }}>{profile.bio}</p>
                </div>
              )}

              {/* Private Fields Guarded Notice */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  backgroundColor: "#FEF3F2",
                  border: "1px solid #FECDCA",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <Lock size={16} style={{ color: "#B42318", flexShrink: 0 }} />
                <span style={{ fontSize: "12px", color: "#B42318", fontWeight: 600 }}>
                  Contact details, physical specifications, and guardian info are kept strictly confidential by Vismaya.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "14px 22px", borderTop: "1px solid #E8E2D4", backgroundColor: "#FAF9F7", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowRecruiterPreview(false)}
                className="btn-secondary"
                style={{ padding: "8px 18px", fontSize: "13px" }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scoped CSS for responsive viewports */}
      <style jsx>{`
        @media (max-width: 640px) {
          .talent-profile-view-root {
            gap: 14px !important;
          }
          .view-grid-2col,
          .view-grid-3col {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .view-card-header {
            padding: 16px 18px !important;
          }
        }
      `}</style>
    </div>
  );
}
