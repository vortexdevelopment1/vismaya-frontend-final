"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  UploadCloud,
  FileText,
  User,
  Award,
  ExternalLink,
  ChevronRight,
  Info,
  HelpCircle,
  Eye,
  Camera,
  X,
  RefreshCw,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import ProgressBar from "@/components/shared/ProgressBar";
import { verificationService } from "@/lib/api/services/verificationService";
import { mediaService } from "@/lib/api/services/mediaService";
import { useTalent } from "@/lib/talent/TalentContext";
import { isRealMode } from "@/lib/api/config";

export default function TalentVerificationPage() {
  const { profile } = useTalent();
  const [activeTab, setActiveTab] = useState("identity"); // 'identity' | 'professional'
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Identity Form State
  const [idType, setIdType] = useState("aadhaar");
  const [idNumber, setIdNumber] = useState("");
  const [docFrontUrl, setDocFrontUrl] = useState("");
  const [docBackUrl, setDocBackUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");
  const [isUploadingFront, setIsUploadingFront] = useState(false);
  const [isUploadingBack, setIsUploadingBack] = useState(false);
  const [isUploadingSelfie, setIsUploadingSelfie] = useState(false);
  const [isSubmittingId, setIsSubmittingId] = useState(false);

  // Professional Form State
  const [imdbLink, setImdbLink] = useState("");
  const [workLink1, setWorkLink1] = useState("");
  const [guildName, setGuildName] = useState("");
  const [guildNumber, setGuildNumber] = useState("");
  const [proofDocUrl, setProofDocUrl] = useState("");
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isSubmittingProf, setIsSubmittingProf] = useState(false);

  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadVerifications = async () => {
    try {
      setLoading(true);
      const res = await verificationService.getMyVerifications();
      if (res?.data) {
        setVerifications(res.data);
      }
    } catch (err) {
      console.warn("Could not load verifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVerifications();
  }, []);

  const identityVer = verifications.find((v) => v.type === "identity" || v.verificationType === "identity");
  const professionalVer = verifications.find((v) => v.type === "professional" || v.verificationType === "professional");

  const getStatusBadge = (ver) => {
    if (!ver) {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 10px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "700",
            backgroundColor: "#F2EFE8",
            color: "#77756B",
            border: "1px solid #DDD8CD",
          }}
        >
          NOT SUBMITTED
        </span>
      );
    }

    const st = (ver.status || ver.rawStatus || "").toLowerCase();
    if (st === "verified" || st === "approved") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "700",
            backgroundColor: "rgba(52, 211, 153, 0.15)",
            color: "#10b981",
            border: "1px solid rgba(52, 211, 153, 0.35)",
          }}
        >
          <CheckCircle2 size={13} />
          <span>VERIFIED BADGE ACTIVE</span>
        </span>
      );
    }

    if (st === "rejected") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "700",
            backgroundColor: "rgba(239, 68, 68, 0.12)",
            color: "#ef4444",
            border: "1px solid rgba(239, 68, 68, 0.3)",
          }}
        >
          <AlertCircle size={13} />
          <span>REJECTED</span>
        </span>
      );
    }

    if (ver.moreInfoRequested || st === "additional_info_required") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "700",
            backgroundColor: "rgba(255, 188, 0, 0.15)",
            color: "#8A6B2E",
            border: "1px solid rgba(255, 188, 0, 0.35)",
          }}
        >
          <Clock size={13} />
          <span>ADDITIONAL INFO REQUIRED</span>
        </span>
      );
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "4px 12px",
          borderRadius: "8px",
          fontSize: "12px",
          fontWeight: "700",
          backgroundColor: "#FFF9E6",
          color: "#8A6B2E",
          border: "1px solid #F0D078",
        }}
      >
        <Clock size={13} />
        <span>PENDING VETTING</span>
      </span>
    );
  };

  // Upload Handlers
  const handleFileUpload = async (file, setUrl, setLoadingState) => {
    if (!file) return;
    try {
      setLoadingState(true);
      const res = await mediaService.uploadFile(file, { folder: "vismaya/kyc" });
      const url = res?.url || res?.secure_url || (typeof res === "string" ? res : "");
      if (url) {
        setUrl(url);
        showNotification("success", `File ${file.name} uploaded successfully.`);
      }
    } catch (err) {
      showNotification("error", err?.message || "Failed to upload file");
    } finally {
      setLoadingState(false);
    }
  };

  const handleSubmitIdentity = async (e) => {
    e.preventDefault();
    if (!idNumber.trim()) {
      showNotification("error", "Please provide your government ID number");
      return;
    }
    if (!docFrontUrl) {
      showNotification("error", "Please upload the front side of your government ID document");
      return;
    }
    if (!selfieUrl) {
      showNotification("error", "Please upload a selfie photo for visual face matching");
      return;
    }

    try {
      setIsSubmittingId(true);
      const res = await verificationService.submitIdentityVerification({
        idType,
        idNumber,
        documentFrontUrl: docFrontUrl,
        documentBackUrl: docBackUrl || undefined,
        selfiePhotoUrl: selfieUrl,
      });

      if (res?.success) {
        showNotification("success", "Identity verification dossier submitted for review!");
        await loadVerifications();
      }
    } catch (err) {
      showNotification("error", err?.response?.data?.message || err?.message || "Failed to submit verification");
    } finally {
      setIsSubmittingId(false);
    }
  };

  const handleSubmitProfessional = async (e) => {
    e.preventDefault();
    const creditsLinks = [imdbLink, workLink1].filter(Boolean);
    if (creditsLinks.length === 0 && !proofDocUrl) {
      showNotification("error", "Please provide at least one professional credit link or supporting document");
      return;
    }

    try {
      setIsSubmittingProf(true);
      const res = await verificationService.submitProfessionalVerification({
        creditsLinks,
        guildOrUnionName: guildName || undefined,
        guildMembershipNumber: guildNumber || undefined,
        supportingDocumentUrls: proofDocUrl ? [proofDocUrl] : [],
      });

      if (res?.success) {
        showNotification("success", "Professional verification credentials submitted for review!");
        await loadVerifications();
      }
    } catch (err) {
      showNotification("error", err?.response?.data?.message || err?.message || "Failed to submit verification");
    } finally {
      setIsSubmittingProf(false);
    }
  };

  const isAspiring = (profile?.careerStage || "").toLowerCase() === "aspiring";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="KYC Verification Desk"
        subtitle="Complete identity and professional credentials verification to earn verified badges and establish casting credibility."
      />

      {notification && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: "10px",
            backgroundColor: notification.type === "success" ? "#ECFDF5" : "#FEF2F2",
            border: `1px solid ${notification.type === "success" ? "#A7F3D0" : "#FECACA"}`,
            color: notification.type === "success" ? "#065F46" : "#991B1B",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top 2 Badges Overview Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Badge 1: Identity Verified */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E4DA",
            borderRadius: "14px",
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                backgroundColor: "rgba(138, 107, 46, 0.12)",
                color: "#8A6B2E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <User size={22} />
            </div>
            <div>
              <strong style={{ fontSize: "15px", color: "#2B2D2A", display: "block" }}>
                Identity Verified Badge
              </strong>
              <span style={{ fontSize: "12.5px", color: "#77756B" }}>
                Govt ID document &amp; photo match
              </span>
            </div>
          </div>
          {getStatusBadge(identityVer)}
        </div>

        {/* Badge 2: Professional Verified */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E4DA",
            borderRadius: "14px",
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                backgroundColor: "rgba(138, 107, 46, 0.12)",
                color: "#8A6B2E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Award size={22} />
            </div>
            <div>
              <strong style={{ fontSize: "15px", color: "#2B2D2A", display: "block" }}>
                Professional Verified Badge
              </strong>
              <span style={{ fontSize: "12.5px", color: "#77756B" }}>
                Documented screen credits &amp; guild membership
              </span>
            </div>
          </div>
          {getStatusBadge(professionalVer)}
        </div>
      </div>

      {/* Navigation Tabs for Independent Verification Categories */}
      <div style={{ borderBottom: "1px solid #E8E4DA", display: "flex", gap: "24px" }}>
        <button
          type="button"
          onClick={() => setActiveTab("identity")}
          style={{
            padding: "12px 0",
            fontSize: "14px",
            fontWeight: "700",
            border: "none",
            background: "none",
            color: activeTab === "identity" ? "#8A6B2E" : "#5A584F",
            borderBottom: activeTab === "identity" ? "2px solid #8A6B2E" : "2px solid transparent",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <ShieldCheck size={16} />
          <span>1. Identity Verification</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("professional")}
          style={{
            padding: "12px 0",
            fontSize: "14px",
            fontWeight: "700",
            border: "none",
            background: "none",
            color: activeTab === "professional" ? "#8A6B2E" : "#5A584F",
            borderBottom: activeTab === "professional" ? "2px solid #8A6B2E" : "2px solid transparent",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Award size={16} />
          <span>2. Professional Credentials Verification</span>
        </button>
      </div>

      {/* TAB 1: IDENTITY VERIFICATION */}
      {activeTab === "identity" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Identity Rejection Support Guidance */}
          {(identityVer?.status === "rejected" || identityVer?.rawStatus === "rejected") && (
            <div
              style={{
                backgroundColor: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "12px",
                padding: "20px 24px",
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
              }}
            >
              <AlertCircle size={24} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong style={{ fontSize: "16px", color: "#991B1B", display: "block", marginBottom: "4px" }}>
                  Identity Verification Not Approved
                </strong>
                <p style={{ fontSize: "14px", color: "#7F1D1D", margin: "0 0 12px 0", lineHeight: "22px" }}>
                  Your identity verification submission could not be approved. As directed by Vismaya compliance rules, rejected users should contact platform support directly to resolve discrepancies.
                </p>
                <a
                  href="mailto:support@vismaya.com?subject=Identity%20Verification%20Appeal"
                  className="btn-secondary"
                  style={{ fontSize: "13px", height: "36px", padding: "0 16px" }}
                >
                  Contact Vismaya Support Desk
                </a>
              </div>
            </div>
          )}

          {/* Form Card */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E4DA",
              borderRadius: "16px",
              padding: "28px",
              boxShadow: "0 2px 10px rgba(43, 45, 42, 0.02)",
            }}
          >
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#2B2D2A", margin: "0 0 6px 0" }}>
                Government Identity Evidence
              </h2>
              <p style={{ fontSize: "13.5px", color: "#5A584F", margin: 0 }}>
                Upload a government-issued photo identity document and a live verification selfie. These documents are strictly confidential and accessible solely to authorized Vismaya Compliance Officers.
              </p>
            </div>

            <form onSubmit={handleSubmitIdentity} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                    Identity Document Type *
                  </label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    style={{
                      height: "42px",
                      borderRadius: "8px",
                      border: "1px solid #DDD8CD",
                      padding: "0 12px",
                      fontSize: "14px",
                      backgroundColor: "#FAF9F6",
                    }}
                  >
                    <option value="aadhaar">Aadhaar Card (UIDAI)</option>
                    <option value="passport">Indian Passport</option>
                    <option value="driving_license">Driving License</option>
                    <option value="voter_id">Voter ID (Election Commission)</option>
                    <option value="pan">PAN Card</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                    ID Number *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter document reference number"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    style={{
                      height: "42px",
                      borderRadius: "8px",
                      border: "1px solid #DDD8CD",
                      padding: "0 12px",
                      fontSize: "14px",
                      backgroundColor: "#FAF9F6",
                    }}
                  />
                </div>
              </div>

              {/* Upload 1: Document Front */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                  Document Front Side (Clear Scan or Photo) *
                </label>
                <div
                  style={{
                    border: "2px dashed #DDD8CD",
                    borderRadius: "10px",
                    padding: "20px",
                    textAlign: "center",
                    backgroundColor: "#FAF9F6",
                  }}
                >
                  {docFrontUrl ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <FileText size={20} color="#8A6B2E" />
                        <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#2B2D2A" }}>
                          Front side document uploaded
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <a href={docFrontUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#8A6B2E", textDecoration: "underline" }}>
                          Preview
                        </a>
                        <button type="button" onClick={() => setDocFrontUrl("")} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "13px" }}>
                          Replace
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <UploadCloud size={28} style={{ color: "#8A6B2E", margin: "0 auto 8px auto" }} />
                      <p style={{ fontSize: "13px", color: "#5A584F", margin: "0 0 8px 0" }}>
                        PDF, JPG, or PNG under 10 MB
                      </p>
                      <label className="btn-secondary" style={{ display: "inline-block", cursor: isUploadingFront ? "wait" : "pointer", padding: "6px 14px", fontSize: "13px" }}>
                        {isUploadingFront ? "Uploading..." : "Select Front Document"}
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          style={{ display: "none" }}
                          disabled={isUploadingFront}
                          onChange={(e) => handleFileUpload(e.target.files[0], setDocFrontUrl, setIsUploadingFront)}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload 2: Document Back (Optional) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                  Document Back Side (Optional / For 2-Sided IDs)
                </label>
                <div
                  style={{
                    border: "2px dashed #DDD8CD",
                    borderRadius: "10px",
                    padding: "20px",
                    textAlign: "center",
                    backgroundColor: "#FAF9F6",
                  }}
                >
                  {docBackUrl ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <FileText size={20} color="#8A6B2E" />
                        <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#2B2D2A" }}>
                          Back side document uploaded
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <a href={docBackUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#8A6B2E", textDecoration: "underline" }}>
                          Preview
                        </a>
                        <button type="button" onClick={() => setDocBackUrl("")} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "13px" }}>
                          Replace
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <UploadCloud size={24} style={{ color: "#8A6B2E", margin: "0 auto 6px auto" }} />
                      <label className="btn-secondary" style={{ display: "inline-block", cursor: isUploadingBack ? "wait" : "pointer", padding: "6px 14px", fontSize: "13px" }}>
                        {isUploadingBack ? "Uploading..." : "Select Back Document"}
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          style={{ display: "none" }}
                          disabled={isUploadingBack}
                          onChange={(e) => handleFileUpload(e.target.files[0], setDocBackUrl, setIsUploadingBack)}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload 3: Live Verification Selfie */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                  Verification Selfie / Face Photograph *
                </label>
                <div
                  style={{
                    border: "2px dashed #DDD8CD",
                    borderRadius: "10px",
                    padding: "20px",
                    textAlign: "center",
                    backgroundColor: "#FAF9F6",
                  }}
                >
                  {selfieUrl ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <img src={selfieUrl} alt="Selfie preview" style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }} />
                        <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#2B2D2A" }}>
                          Verification photograph uploaded
                        </span>
                      </div>
                      <button type="button" onClick={() => setSelfieUrl("")} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "13px" }}>
                        Replace Photo
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Camera size={28} style={{ color: "#8A6B2E", margin: "0 auto 8px auto" }} />
                      <p style={{ fontSize: "13px", color: "#5A584F", margin: "0 0 8px 0" }}>
                        Clear frontal selfie without sunglasses or hats for facial matching
                      </p>
                      <label className="btn-secondary" style={{ display: "inline-block", cursor: isUploadingSelfie ? "wait" : "pointer", padding: "6px 14px", fontSize: "13px" }}>
                        {isUploadingSelfie ? "Uploading..." : "Upload Selfie Photo"}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          disabled={isUploadingSelfie}
                          onChange={(e) => handleFileUpload(e.target.files[0], setSelfieUrl, setIsUploadingSelfie)}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button
                  type="submit"
                  disabled={isSubmittingId || isUploadingFront || isUploadingSelfie}
                  className="btn-primary"
                  style={{ height: "42px", padding: "0 24px", fontSize: "14px", fontWeight: "700" }}
                >
                  {isSubmittingId ? "Submitting Dossier..." : "Submit Identity For Verification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: PROFESSIONAL VERIFICATION */}
      {activeTab === "professional" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Aspiring Talent Warning Box */}
          {isAspiring && (
            <div
              style={{
                backgroundColor: "#FFF9E6",
                border: "1px solid #F0D078",
                borderRadius: "12px",
                padding: "18px 22px",
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
              }}
            >
              <Info size={20} color="#8A6B2E" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div style={{ fontSize: "13.5px", color: "#5A584F", lineHeight: "22px" }}>
                <strong style={{ color: "#2B2D2A" }}>Aspiring Artist Rule: </strong>
                According to Vismaya Master Specification §47, an aspiring talent without professional screen credits cannot receive the &apos;Professional Verified&apos; badge. Once you have at least one released project, television credit, or recognized theatre production, submit your evidence here for verification.
              </div>
            </div>
          )}

          {/* Form Card */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E4DA",
              borderRadius: "16px",
              padding: "28px",
              boxShadow: "0 2px 10px rgba(43, 45, 42, 0.02)",
            }}
          >
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#2B2D2A", margin: "0 0 6px 0" }}>
                Professional Credits &amp; Guild Affiliation
              </h2>
              <p style={{ fontSize: "13.5px", color: "#5A584F", margin: 0 }}>
                Submit verified links to released productions, IMDb credits, or union/guild documentation to earn the Professional Verified badge.
              </p>
            </div>

            <form onSubmit={handleSubmitProfessional} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                  IMDb Profile Link or Official Filmography Link
                </label>
                <input
                  type="url"
                  placeholder="https://www.imdb.com/name/nm..."
                  value={imdbLink}
                  onChange={(e) => setImdbLink(e.target.value)}
                  style={{
                    height: "42px",
                    borderRadius: "8px",
                    border: "1px solid #DDD8CD",
                    padding: "0 12px",
                    fontSize: "14px",
                    backgroundColor: "#FAF9F6",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                  Live Project Reference or Video Link
                </label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?... or OTT streaming credit link"
                  value={workLink1}
                  onChange={(e) => setWorkLink1(e.target.value)}
                  style={{
                    height: "42px",
                    borderRadius: "8px",
                    border: "1px solid #DDD8CD",
                    padding: "0 12px",
                    fontSize: "14px",
                    backgroundColor: "#FAF9F6",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                    Artist Guild / Trade Union (e.g. CINTAA)
                  </label>
                  <input
                    type="text"
                    placeholder="E.g. CINTAA, SWA, FWICE"
                    value={guildName}
                    onChange={(e) => setGuildName(e.target.value)}
                    style={{
                      height: "42px",
                      borderRadius: "8px",
                      border: "1px solid #DDD8CD",
                      padding: "0 12px",
                      fontSize: "14px",
                      backgroundColor: "#FAF9F6",
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                    Guild Membership Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter membership badge ID"
                    value={guildNumber}
                    onChange={(e) => setGuildNumber(e.target.value)}
                    style={{
                      height: "42px",
                      borderRadius: "8px",
                      border: "1px solid #DDD8CD",
                      padding: "0 12px",
                      fontSize: "14px",
                      backgroundColor: "#FAF9F6",
                    }}
                  />
                </div>
              </div>

              {/* Upload Supporting Document */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                  Supporting Document (Contract, Call-Sheet, or Guild Certificate)
                </label>
                <div
                  style={{
                    border: "2px dashed #DDD8CD",
                    borderRadius: "10px",
                    padding: "20px",
                    textAlign: "center",
                    backgroundColor: "#FAF9F6",
                  }}
                >
                  {proofDocUrl ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <FileText size={20} color="#8A6B2E" />
                        <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#2B2D2A" }}>
                          Proof document attached
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <a href={proofDocUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#8A6B2E", textDecoration: "underline" }}>
                          Preview
                        </a>
                        <button type="button" onClick={() => setProofDocUrl("")} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "13px" }}>
                          Replace
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <UploadCloud size={26} style={{ color: "#8A6B2E", margin: "0 auto 6px auto" }} />
                      <p style={{ fontSize: "13px", color: "#5A584F", margin: "0 0 8px 0" }}>
                        PDF, JPG, or PNG under 15 MB
                      </p>
                      <label className="btn-secondary" style={{ display: "inline-block", cursor: isUploadingProof ? "wait" : "pointer", padding: "6px 14px", fontSize: "13px" }}>
                        {isUploadingProof ? "Uploading..." : "Upload Evidence"}
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          style={{ display: "none" }}
                          disabled={isUploadingProof}
                          onChange={(e) => handleFileUpload(e.target.files[0], setProofDocUrl, setIsUploadingProof)}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button
                  type="submit"
                  disabled={isSubmittingProf || isUploadingProof}
                  className="btn-primary"
                  style={{ height: "42px", padding: "0 24px", fontSize: "14px", fontWeight: "700" }}
                >
                  {isSubmittingProf ? "Submitting..." : "Submit Professional Evidence"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
