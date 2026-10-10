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
          backgroundColor: "rgba(7, 11, 18, 0.75)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 90,
        }}
      />

      {/* Drawer Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "580px",
          maxWidth: "100vw",
          backgroundColor: "#0f1626",
          borderLeft: "1px solid rgba(255, 255, 255, 0.14)",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.75)",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "14px",
            backgroundColor: "rgba(15, 22, 38, 0.8)",
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
                    borderRadius: "14px",
                    objectFit: "cover",
                    border: "1px solid rgba(255, 188, 0, 0.35)",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #0f1626 0%, #070b12 100%)",
                    color: "var(--gold)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
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
                  borderRadius: "14px",
                  background: "rgba(255, 188, 0, 0.12)",
                  color: "var(--gold)",
                  border: "1px solid rgba(255, 188, 0, 0.30)",
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
                <h2 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#eceaf5", margin: 0 }}>
                  {isTalent ? data.name : data.companyName}
                </h2>
                <StatusBadge status={data.status} size="xs" />
              </div>

              <span style={{ fontSize: "0.785rem", color: "#a3acc2" }}>
                {isTalent ? `${data.category} • ${data.city}` : `${data.companyType} • ${data.city}`}
              </span>

              <span style={{ fontSize: "0.7rem", color: "#7c869e" }}>
                Joined: {data.joinedDate} &bull; ID: {data.id}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              color: "#a3acc2",
              padding: "8px",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
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
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Reason / Suspension Banner if present */}
          {data.statusReason && (
            <div
              style={{
                backgroundColor: "rgba(255, 107, 107, 0.12)",
                border: "1px solid rgba(255, 107, 107, 0.32)",
                borderRadius: "14px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                fontSize: "0.8rem",
              }}
            >
              <AlertTriangle size={15} style={{ color: "#ff6b6b", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong style={{ color: "#ff6b6b", display: "block" }}>
                  Status Action Logged:
                </strong>
                <span style={{ color: "#eceaf5" }}>{data.statusReason}</span>
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
                    backgroundColor: "rgba(255, 188, 0, 0.08)",
                    border: "1px solid rgba(255, 188, 0, 0.30)",
                    borderRadius: "14px",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ShieldCheck size={16} style={{ color: "var(--gold)" }} />
                    <strong style={{ fontSize: "0.85rem", color: "#eceaf5" }}>
                      Minor Artist Compliance Verified
                    </strong>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "0.785rem" }}>
                    <div>
                      <span style={{ color: "#a3acc2" }}>Legal Guardian: </span>
                      <strong style={{ color: "#eceaf5" }}>
                        {data.parentConsent?.parentName || data.guardianConsent?.guardianName || "Verified Guardian"}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: "#a3acc2" }}>Relationship: </span>
                      <span style={{ color: "#eceaf5" }}>
                        {data.parentConsent?.relationship || "Guardian"}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: "#a3acc2" }}>Guardian Phone: </span>
                      <span style={{ color: "#eceaf5" }}>
                        {data.parentConsent?.contact || data.guardianConsent?.guardianPhone || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: "#a3acc2" }}>Aadhaar Check: </span>
                      <span style={{ color: "var(--status-green)", fontWeight: "700" }}>Verified ✓</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bio */}
              {data.bio && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "0.725rem", fontWeight: "700", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Artist Bio
                  </span>
                  <p style={{ fontSize: "0.825rem", color: "#eceaf5", margin: 0, lineHeight: 1.5, backgroundColor: "rgba(255, 255, 255, 0.04)", padding: "12px 14px", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    {data.bio}
                  </p>
                </div>
              )}

              {/* Physical Specs Grid */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "0.725rem", fontWeight: "700", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Physical Attributes
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                  <div style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", padding: "10px 12px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <span style={{ fontSize: "0.68rem", color: "#a3acc2", display: "block" }}>Height</span>
                    <strong style={{ fontSize: "0.825rem", color: "#eceaf5" }}>{data.physical?.height || data.height || "N/A"}</strong>
                  </div>
                  <div style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", padding: "10px 12px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <span style={{ fontSize: "0.68rem", color: "#a3acc2", display: "block" }}>Weight</span>
                    <strong style={{ fontSize: "0.825rem", color: "#eceaf5" }}>{data.physical?.weight || data.weight || "N/A"}</strong>
                  </div>
                  <div style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", padding: "10px 12px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <span style={{ fontSize: "0.68rem", color: "#a3acc2", display: "block" }}>Age</span>
                    <strong style={{ fontSize: "0.825rem", color: "#eceaf5" }}>{data.age ? `${data.age} yrs` : "N/A"}</strong>
                  </div>
                  <div style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", padding: "10px 12px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <span style={{ fontSize: "0.68rem", color: "#a3acc2", display: "block" }}>Skin Tone</span>
                    <strong style={{ fontSize: "0.825rem", color: "#eceaf5" }}>{data.physical?.skinTone || data.skinTone || "N/A"}</strong>
                  </div>
                </div>
              </div>

              {/* Screen Experience */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "0.725rem", fontWeight: "700", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Experience &amp; Screen Credits
                </span>
                {Array.isArray(data.experience) && data.experience.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {data.experience.map((item, idx) => (
                      <div
                        key={item?.id || idx}
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.04)",
                          padding: "10px 14px",
                          borderRadius: "12px",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "6px" }}>
                          <strong style={{ fontSize: "0.825rem", color: "#eceaf5" }}>
                            {item?.role || "Role"}
                          </strong>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {item?.type && (
                              <span style={{ fontSize: "0.7rem", color: "var(--gold)", backgroundColor: "rgba(255, 188, 0, 0.12)", padding: "2px 6px", borderRadius: "6px", fontWeight: "600" }}>
                                {item.type}
                              </span>
                            )}
                            {item?.year && (
                              <span style={{ fontSize: "0.725rem", color: "#7c869e" }}>
                                {item.year}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: "0.785rem", color: "#a3acc2", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          {item?.project && <span>{item.project}</span>}
                          {item?.project && item?.production && <span style={{ color: "#7c869e" }}>&bull;</span>}
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
                          backgroundColor: "rgba(255, 255, 255, 0.04)",
                          padding: "10px 14px",
                          borderRadius: "12px",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "6px" }}>
                          <strong style={{ fontSize: "0.825rem", color: "#eceaf5" }}>
                            {item?.role || "Role"}
                          </strong>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {item?.type && (
                              <span style={{ fontSize: "0.7rem", color: "var(--gold)", backgroundColor: "rgba(255, 188, 0, 0.12)", padding: "2px 6px", borderRadius: "6px", fontWeight: "600" }}>
                                {item.type}
                              </span>
                            )}
                            {item?.year && (
                              <span style={{ fontSize: "0.725rem", color: "#7c869e" }}>
                                {item.year}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: "0.785rem", color: "#a3acc2", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          {item?.project && <span>{item.project}</span>}
                          {item?.project && item?.production && <span style={{ color: "#7c869e" }}>&bull;</span>}
                          {item?.production && <span>{item.production}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : typeof data.experience === "string" && data.experience.trim() ? (
                  <div style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", padding: "12px 14px", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)", fontSize: "0.825rem", color: "#eceaf5", lineHeight: 1.45 }}>
                    {data.experience}
                  </div>
                ) : (
                  <div style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", padding: "12px 14px", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)", fontSize: "0.825rem", color: "#7c869e", fontStyle: "italic" }}>
                    No credits added
                  </div>
                )}
              </div>

              {/* Skills & Languages */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <span style={{ fontSize: "0.725rem", fontWeight: "700", color: "var(--gold)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    Languages Spoken
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {(data.languages || []).map((lang, idx) => (
                      <span key={idx} style={{ fontSize: "0.725rem", padding: "4px 10px", borderRadius: "999px", backgroundColor: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.10)", color: "#eceaf5", fontWeight: "600" }}>
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "0.725rem", fontWeight: "700", color: "var(--gold)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    Key Acting Skills
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {(data.skills || []).map((skill, idx) => (
                      <span key={idx} style={{ fontSize: "0.725rem", padding: "4px 10px", borderRadius: "999px", backgroundColor: "rgba(255, 188, 0, 0.12)", border: "1px solid rgba(255, 188, 0, 0.30)", color: "var(--gold)", fontWeight: "700" }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "0.725rem", fontWeight: "700", color: "var(--gold)", textTransform: "uppercase" }}>
                  Direct Contact (Admin Internal View Only)
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.8rem", backgroundColor: "rgba(255, 255, 255, 0.04)", padding: "12px 14px", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Phone size={14} style={{ color: "var(--gold)" }} />
                    <span style={{ color: "#eceaf5", fontWeight: "600" }}>{data.phone}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Mail size={14} style={{ color: "var(--gold)" }} />
                    <span style={{ color: "#eceaf5", fontWeight: "600" }}>{data.email}</span>
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
                <span style={{ fontSize: "0.725rem", fontWeight: "700", color: "var(--gold)", textTransform: "uppercase" }}>
                  Corporate Credentials
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.8rem" }}>
                  <div style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", padding: "12px 14px", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <span style={{ fontSize: "0.68rem", color: "#a3acc2", display: "block" }}>Corporate Registration (CIN)</span>
                    <strong style={{ color: "#eceaf5" }}>{data.registrationNumber || "N/A"}</strong>
                  </div>
                  <div style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", padding: "12px 14px", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <span style={{ fontSize: "0.68rem", color: "#a3acc2", display: "block" }}>GSTIN</span>
                    <strong style={{ color: "#eceaf5" }}>{data.gstNumber || "N/A"}</strong>
                  </div>
                </div>
              </div>

              {/* Authorized Production Contact */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "0.725rem", fontWeight: "700", color: "var(--gold)", textTransform: "uppercase" }}>
                  Authorized Production Contact
                </span>
                <div style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", padding: "14px", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.8rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#a3acc2" }}>Executive Name:</span>
                    <strong style={{ color: "#eceaf5" }}>{data.contactPerson}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#a3acc2" }}>Phone:</span>
                    <span style={{ color: "#eceaf5", fontWeight: "600" }}>{data.phone}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#a3acc2" }}>Email:</span>
                    <span style={{ color: "#eceaf5", fontWeight: "600" }}>{data.email}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#a3acc2" }}>Website:</span>
                    <a href={data.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)", display: "flex", alignItems: "center", gap: "4px", fontWeight: "700" }}>
                      <span>{data.website}</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Uploaded Verification Docs */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "0.725rem", fontWeight: "700", color: "var(--gold)", textTransform: "uppercase" }}>
                  Verification Documents Submitted
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {(data.documents || []).map((doc, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <FileText size={16} style={{ color: "var(--gold)" }} />
                        <div>
                          <strong style={{ fontSize: "0.825rem", color: "#eceaf5", display: "block" }}>
                            {doc.name}
                          </strong>
                          <span style={{ fontSize: "0.7rem", color: doc.verified ? "var(--status-green)" : "var(--gold)", fontWeight: "600" }}>
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
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  padding: "12px 16px",
                  borderRadius: "14px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.8rem",
                }}
              >
                <span style={{ color: "#a3acc2" }}>Requirements Briefs Posted:</span>
                <strong style={{ color: "var(--gold)" }}>{data.requirementsPosted || 0} Briefs</strong>
              </div>
            </>
          )}
        </div>

        {/* Action Controls Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            backgroundColor: "rgba(15, 22, 38, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            {data.status === "Suspended" ? (
              <button
                type="button"
                onClick={() => {
                  if (isTalent) onReactivate(data.id);
                  else onReactivate(data.id);
                }}
                className="btn-secondary"
                style={{ padding: "8px 16px", fontSize: "0.8rem", gap: "6px", borderRadius: "12px" }}
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
                  color: "#ff6b6b",
                  backgroundColor: "rgba(255, 107, 107, 0.12)",
                  border: "1px solid rgba(255, 107, 107, 0.35)",
                  padding: "8px 14px",
                  borderRadius: "12px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
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

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                  fontSize: "0.8rem",
                  color: "#ff6b6b",
                  backgroundColor: "rgba(255, 107, 107, 0.12)",
                  border: "1px solid rgba(255, 107, 107, 0.35)",
                  borderRadius: "12px",
                  fontWeight: 700,
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
                className="btn-primary"
                style={{ padding: "8px 20px", fontSize: "0.825rem", gap: "6px", borderRadius: "12px" }}
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
      `}</style>
    </>
  );
}
