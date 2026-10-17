"use client";

import React, { useState } from "react";
import {
  X,
  Check,
  Ban,
  ShieldAlert,
  ShieldCheck,
  FileText,
  User,
  Building2,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import ReasonModal from "./ReasonModal";

export default function ReviewDrawer({
  isOpen,
  onClose,
  type = "talent", // "talent" | "recruiter"
  data,
  onApprove,
  onReject,
  onSuspend,
  onReactivate,
}) {
  const [reasonModalConfig, setReasonModalConfig] = useState(null);

  if (!isOpen || !data) return null;

  const isTalent = type === "talent";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(43, 45, 42, 0.45)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 90,
        }}
      />

      {/* Drawer Panel */}
      <div
        className="admin-review-drawer"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "580px",
          maxWidth: "100vw",
          backgroundColor: "#FFFFFF",
          borderLeft: "1px solid #E8E2D4",
          boxShadow: "0 20px 48px rgba(43, 45, 42, 0.16)",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header */}
        <div
          className="admin-review-drawer-header"
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #E8E2D4",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "14px",
            backgroundColor: "#F3EFE6",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
            {isTalent ? (
              data.avatar ? (
                <img
                  src={data.avatar}
                  alt={data.name}
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    objectFit: "cover",
                    border: "1px solid #E8E2D4",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    backgroundColor: "#F3EFE6",
                    color: "#8A6B2E",
                    border: "1px solid #E8E2D4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "800",
                    fontSize: "1.1rem",
                    flexShrink: 0,
                  }}
                >
                  {data.initials || data.name?.charAt(0) || "T"}
                </div>
              )
            ) : (
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  backgroundColor: "#F3EFE6",
                  color: "#8A6B2E",
                  border: "1px solid #E8E2D4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Building2 size={24} />
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "1.15rem", fontFamily: "var(--font-playfair), serif", fontWeight: "700", color: "#2B2D2A", margin: 0 }}>
                  {isTalent ? data.name : data.companyName}
                </h2>
                <StatusBadge status={data.status} size="xs" />
              </div>

              <span style={{ fontSize: "13px", color: "#5A584F" }}>
                {isTalent ? `${data.category} • ${data.city}` : `${data.companyType} • ${data.city}`}
              </span>

              <span style={{ fontSize: "12px", color: "#5A584F" }}>
                Joined: {data.joinedDate} &bull; ID: {data.id}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="admin-review-drawer-close"
            style={{
              color: "#5A584F",
              padding: "8px",
              borderRadius: "10px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E2D4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          className="admin-review-drawer-body"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            backgroundColor: "#FAF9F7",
          }}
        >
          {/* Reason / Suspension Banner if present */}
          {data.statusReason && (
            <div
              style={{
                backgroundColor: "rgba(180, 35, 24, 0.08)",
                border: "1px solid rgba(180, 35, 24, 0.25)",
                borderRadius: "14px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                fontSize: "13px",
              }}
            >
              <AlertTriangle size={15} style={{ color: "#B42318", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong style={{ color: "#B42318", display: "block" }}>
                  Status Action Logged:
                </strong>
                <span style={{ color: "#2B2D2A" }}>{data.statusReason}</span>
              </div>
            </div>
          )}

          {/* TALENT PROFILE DETAILS */}
          {isTalent && (
            <>
              {/* Child Artist Consent Box (if age < 18) */}
              {(data.isChildArtist || data.guardianConsent || (data.age && data.age < 18)) && (data.parentConsent || data.guardianConsent) && (
                <div
                  style={{
                    backgroundColor: "rgba(138, 107, 46, 0.10)",
                    border: "1px solid rgba(138, 107, 46, 0.25)",
                    borderRadius: "14px",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ShieldCheck size={16} style={{ color: "#8A6B2E" }} />
                    <strong style={{ fontSize: "14px", color: "#2B2D2A" }}>
                      Minor Artist Compliance Verified
                    </strong>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "13px" }}>
                    <div>
                      <span style={{ color: "#5A584F" }}>Legal Guardian: </span>
                      <strong style={{ color: "#2B2D2A" }}>
                        {data.parentConsent?.parentName || data.guardianConsent?.guardianName || "Verified Guardian"}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: "#5A584F" }}>Relationship: </span>
                      <span style={{ color: "#2B2D2A" }}>
                        {data.parentConsent?.relationship || "Guardian"}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: "#5A584F" }}>Guardian Phone: </span>
                      <span style={{ color: "#2B2D2A" }}>
                        {data.parentConsent?.contact || data.guardianConsent?.guardianPhone || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: "#5A584F" }}>Aadhaar Check: </span>
                      <span style={{ color: "#2B2D2A", fontWeight: "700" }}>Verified ✓</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bio */}
              {data.bio && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#8A6B2E", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Artist Bio
                  </span>
                  <p style={{ fontSize: "14px", color: "#2B2D2A", margin: 0, lineHeight: 1.6, backgroundColor: "#FFFFFF", padding: "14px 16px", borderRadius: "14px", border: "1px solid #E8E2D4" }}>
                    {data.bio}
                  </p>
                </div>
              )}

              {/* Physical Specs Grid */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#8A6B2E", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Physical Attributes
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                  <div style={{ backgroundColor: "#FFFFFF", padding: "10px 12px", borderRadius: "12px", border: "1px solid #E8E2D4" }}>
                    <span style={{ fontSize: "11px", color: "#5A584F", display: "block" }}>Height</span>
                    <strong style={{ fontSize: "13px", color: "#2B2D2A" }}>{data.physical?.height || data.height || "N/A"}</strong>
                  </div>
                  <div style={{ backgroundColor: "#FFFFFF", padding: "10px 12px", borderRadius: "12px", border: "1px solid #E8E2D4" }}>
                    <span style={{ fontSize: "11px", color: "#5A584F", display: "block" }}>Weight</span>
                    <strong style={{ fontSize: "13px", color: "#2B2D2A" }}>{data.physical?.weight || data.weight || "N/A"}</strong>
                  </div>
                  <div style={{ backgroundColor: "#FFFFFF", padding: "10px 12px", borderRadius: "12px", border: "1px solid #E8E2D4" }}>
                    <span style={{ fontSize: "11px", color: "#5A584F", display: "block" }}>Age</span>
                    <strong style={{ fontSize: "13px", color: "#2B2D2A" }}>{data.age ? `${data.age} yrs` : "N/A"}</strong>
                  </div>
                  <div style={{ backgroundColor: "#FFFFFF", padding: "10px 12px", borderRadius: "12px", border: "1px solid #E8E2D4" }}>
                    <span style={{ fontSize: "11px", color: "#5A584F", display: "block" }}>Skin Tone</span>
                    <strong style={{ fontSize: "13px", color: "#2B2D2A" }}>{data.physical?.skinTone || data.skinTone || "N/A"}</strong>
                  </div>
                </div>
              </div>

              {/* Screen Experience */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#8A6B2E", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Experience &amp; Screen Credits
                </span>
                {Array.isArray(data.experience) && data.experience.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {data.experience.map((item, idx) => (
                      <div
                        key={item?.id || idx}
                        style={{
                          backgroundColor: "#FFFFFF",
                          padding: "12px 14px",
                          borderRadius: "12px",
                          border: "1px solid #E8E2D4",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "6px" }}>
                          <strong style={{ fontSize: "14px", color: "#2B2D2A" }}>
                            {item?.role || "Role"}
                          </strong>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {item?.type && (
                              <span style={{ fontSize: "11px", color: "#6E5420", backgroundColor: "rgba(138, 107, 46, 0.12)", padding: "2px 8px", borderRadius: "999px", fontWeight: "600" }}>
                                {item.type}
                              </span>
                            )}
                            {item?.year && (
                              <span style={{ fontSize: "12px", color: "#5A584F" }}>
                                {item.year}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: "13px", color: "#5A584F", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          {item?.project && <span>{item.project}</span>}
                          {item?.project && item?.production && <span>&bull;</span>}
                          {item?.production && <span>{item.production}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : Array.isArray(data.credits) && data.credits.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {data.credits.map((item, idx) => (
                      <div
                        key={item?.id || idx}
                        style={{
                          backgroundColor: "#FFFFFF",
                          padding: "12px 14px",
                          borderRadius: "12px",
                          border: "1px solid #E8E2D4",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "6px" }}>
                          <strong style={{ fontSize: "14px", color: "#2B2D2A" }}>
                            {item?.role || "Role"}
                          </strong>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {item?.type && (
                              <span style={{ fontSize: "11px", color: "#6E5420", backgroundColor: "rgba(138, 107, 46, 0.12)", padding: "2px 8px", borderRadius: "999px", fontWeight: "600" }}>
                                {item.type}
                              </span>
                            )}
                            {item?.year && (
                              <span style={{ fontSize: "12px", color: "#5A584F" }}>
                                {item.year}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: "13px", color: "#5A584F", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          {item?.project && <span>{item.project}</span>}
                          {item?.project && item?.production && <span>&bull;</span>}
                          {item?.production && <span>{item.production}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : typeof data.experience === "string" && data.experience.trim() ? (
                  <div style={{ backgroundColor: "#FFFFFF", padding: "12px 14px", borderRadius: "14px", border: "1px solid #E8E2D4", fontSize: "13px", color: "#2B2D2A", lineHeight: 1.5 }}>
                    {data.experience}
                  </div>
                ) : (
                  <div style={{ backgroundColor: "#FFFFFF", padding: "12px 14px", borderRadius: "14px", border: "1px solid #E8E2D4", fontSize: "13px", color: "#5A584F", fontStyle: "italic" }}>
                    No credits added
                  </div>
                )}
              </div>

              {/* Skills & Languages */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#8A6B2E", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    Languages Spoken
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {(data.languages || []).map((lang, idx) => (
                      <span key={idx} style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "999px", backgroundColor: "#FFFFFF", border: "1px solid #E8E2D4", color: "#2B2D2A", fontWeight: "600" }}>
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#8A6B2E", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    Key Acting Skills
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {(data.skills || []).map((skill, idx) => (
                      <span key={idx} style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "999px", backgroundColor: "rgba(138, 107, 46, 0.12)", border: "1px solid rgba(138, 107, 46, 0.25)", color: "#6E5420", fontWeight: "700" }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#8A6B2E", textTransform: "uppercase" }}>
                  Direct Contact (Admin Internal View Only)
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", backgroundColor: "#FFFFFF", padding: "12px 14px", borderRadius: "14px", border: "1px solid #E8E2D4" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Phone size={14} style={{ color: "#8A6B2E" }} />
                    <span style={{ color: "#2B2D2A", fontWeight: "600" }}>{data.phone || data.mobile || data.contactDetails?.phone || data.contactDetails?.mobile || data.personal?.phone || data.userId?.mobile || data.userId?.phone || "N/A"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Mail size={14} style={{ color: "#8A6B2E" }} />
                    <span style={{ color: "#2B2D2A", fontWeight: "600" }}>{data.email || data.contactDetails?.email || data.personal?.email || data.userId?.email || "N/A"}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* RECRUITER COMPANY DETAILS */}
          {!isTalent && (
            <>
              {/* Corporate Credentials */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#8A6B2E", textTransform: "uppercase" }}>
                  Corporate Credentials
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                  <div style={{ backgroundColor: "#FFFFFF", padding: "12px 14px", borderRadius: "14px", border: "1px solid #E8E2D4" }}>
                    <span style={{ fontSize: "11px", color: "#5A584F", display: "block" }}>Corporate Registration (CIN)</span>
                    <strong style={{ color: "#2B2D2A" }}>{data.registrationNumber || "N/A"}</strong>
                  </div>
                  <div style={{ backgroundColor: "#FFFFFF", padding: "12px 14px", borderRadius: "14px", border: "1px solid #E8E2D4" }}>
                    <span style={{ fontSize: "11px", color: "#5A584F", display: "block" }}>GSTIN</span>
                    <strong style={{ color: "#2B2D2A" }}>{data.gstNumber || "N/A"}</strong>
                  </div>
                </div>
              </div>

              {/* Authorized Production Contact */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#8A6B2E", textTransform: "uppercase" }}>
                  Authorized Production Contact
                </span>
                <div style={{ backgroundColor: "#FFFFFF", padding: "14px", borderRadius: "14px", border: "1px solid #E8E2D4", display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#5A584F" }}>Executive Name:</span>
                    <strong style={{ color: "#2B2D2A" }}>{data.contactPerson || data.name || "N/A"}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#5A584F" }}>Phone:</span>
                    <span style={{ color: "#2B2D2A", fontWeight: "600" }}>{data.phone || data.mobile || data.contactDetails?.phone || data.contactDetails?.mobile || "N/A"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#5A584F" }}>Email:</span>
                    <span style={{ color: "#2B2D2A", fontWeight: "600" }}>{data.email || data.contactDetails?.email || "N/A"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#5A584F" }}>Website:</span>
                    <a href={data.website} target="_blank" rel="noopener noreferrer" style={{ color: "#8A6B2E", display: "flex", alignItems: "center", gap: "4px", fontWeight: "700" }}>
                      <span>{data.website}</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Uploaded Verification Docs */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#8A6B2E", textTransform: "uppercase" }}>
                  Verification Documents Submitted
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {(data.documents || []).map((doc, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E8E2D4",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <FileText size={16} style={{ color: "#8A6B2E" }} />
                        <div>
                          <strong style={{ fontSize: "14px", color: "#2B2D2A", display: "block" }}>
                            {doc.name}
                          </strong>
                          <span style={{ fontSize: "12px", color: doc.verified ? "#2B2D2A" : "#8A6B2E", fontWeight: "600" }}>
                            {doc.file} &bull; {doc.verified ? "Document Verified ✓" : "Pending Verification"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity metrics */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  padding: "12px 16px",
                  borderRadius: "14px",
                  border: "1px solid #E8E2D4",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                }}
              >
                <span style={{ color: "#5A584F" }}>Requirements Briefs Posted:</span>
                <strong style={{ color: "#8A6B2E" }}>{data.requirementsPosted || 0} Briefs</strong>
              </div>
            </>
          )}
        </div>

        {/* Action Controls Footer */}
        <div
          className="admin-review-drawer-footer"
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #E8E2D4",
            backgroundColor: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div className="admin-review-drawer-left-actions">
            {data.status === "Suspended" ? (
              <button
                type="button"
                onClick={() => {
                  if (isTalent) onReactivate(data.id);
                  else onReactivate(data.id);
                }}
                style={{
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#8A6B2E",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #8A6B2E",
                  borderRadius: "10px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <RotateCcw size={14} /> Reactivate
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setReasonModalConfig({
                    title: isTalent ? "Suspend Talent Account" : "Suspend Recruiter Account",
                    description: `Specify why "${isTalent ? data.name : data.companyName}" is being suspended.`,
                    confirmLabel: "Suspend Account",
                    confirmVariant: "danger",
                    quickReasons: [
                      "Violation of casting terms",
                      "Unresponsive to callbacks",
                      "Unauthorized direct contact",
                      "Identity verification failure",
                    ],
                    onConfirm: (reason) => onSuspend(data.id, reason),
                  })
                }
                style={{
                  color: "#B42318",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(180, 35, 24, 0.35)",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                }}
              >
                <Ban size={14} /> Suspend
              </button>
            )}
          </div>

          <div className="admin-review-drawer-right-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {data.status !== "Rejected" && (
              <button
                type="button"
                onClick={() =>
                  setReasonModalConfig({
                    title: isTalent ? "Reject Talent Profile" : "Reject Recruiter Verification",
                    description: `Specify reason for rejecting "${isTalent ? data.name : data.companyName}".`,
                    confirmLabel: "Reject Profile",
                    confirmVariant: "danger",
                    quickReasons: isTalent
                      ? [
                          "Comp cards did not meet minimum resolution",
                          "Incomplete portfolio",
                          "Missing contact details",
                          "Inappropriate content",
                        ]
                      : [
                          "GSTIN verification failed",
                          "Unregistered company",
                          "Invalid corporate documentation",
                        ],
                    onConfirm: (reason) => onReject(data.id, reason),
                  })
                }
                style={{
                  padding: "8px 16px",
                  fontSize: "13px",
                  color: "#B42318",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(180, 35, 24, 0.35)",
                  borderRadius: "10px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <X size={14} /> Reject
              </button>
            )}

            {data.status !== "Approved" && data.status !== "Verified" && (
              <button
                type="button"
                onClick={() => {
                  onApprove(data.id);
                  onClose();
                }}
                style={{
                  padding: "8px 20px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#FFFFFF",
                  backgroundColor: "#8A6B2E",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Check size={14} strokeWidth={2.5} />
                <span>{isTalent ? "Approve Profile" : "Verify Company"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reason Modal */}
      {reasonModalConfig && (
        <ReasonModal
          isOpen={Boolean(reasonModalConfig)}
          onClose={() => setReasonModalConfig(null)}
          title={reasonModalConfig.title}
          description={reasonModalConfig.description}
          confirmLabel={reasonModalConfig.confirmLabel}
          confirmVariant={reasonModalConfig.confirmVariant}
          quickReasons={reasonModalConfig.quickReasons}
          onConfirm={(reason) => {
            reasonModalConfig.onConfirm(reason);
            onClose();
          }}
        />
      )}

      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes slideUpDrawer {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        @media (max-width: 640px) {
          .admin-review-drawer {
            width: 100vw !important;
            max-width: 100vw !important;
            left: 0 !important;
            right: 0 !important;
            top: auto !important;
            bottom: 0 !important;
            height: 90vh !important;
            max-height: 90vh !important;
            border-left: none !important;
            border-top: 1px solid #E8E2D4 !important;
            border-top-left-radius: 16px !important;
            border-top-right-radius: 16px !important;
            animation: slideUpDrawer 0.28s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }
          .admin-review-drawer-header {
            padding: 14px 16px !important;
          }
          .admin-review-drawer-close {
            width: 38px !important;
            height: 38px !important;
            padding: 0 !important;
          }
          .admin-review-drawer-body {
            padding: 14px 16px !important;
            gap: 12px !important;
          }
          .admin-review-drawer-footer {
            padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px)) 16px !important;
            flex-direction: column !important;
            gap: 8px !important;
          }
          .admin-review-drawer-left-actions,
          .admin-review-drawer-right-actions {
            display: flex !important;
            width: 100% !important;
            gap: 8px !important;
          }
          .admin-review-drawer-footer button {
            flex: 1 1 0 !important;
            height: 42px !important;
            font-size: 13px !important;
            justify-content: center !important;
            white-space: nowrap !important;
            padding: 0 10px !important;
          }
        }
      `}</style>
    </>
  );
}
