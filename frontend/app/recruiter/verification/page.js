"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  UploadCloud,
  FileText,
  ExternalLink,
  ChevronRight,
  Info,
  X,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { verificationService } from "@/lib/api/services/verificationService";
import { recruiterService } from "@/lib/api/services/recruiterService";
import { mediaService } from "@/lib/api/services/mediaService";
import ContactVismayaButton from "@/components/shared/ContactVismayaButton";
import { useRecruiter } from "@/lib/recruiter/RecruiterContext";

function RecruiterVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams?.get("onboarding") === "true";
  const { refreshCompanyProfile } = useRecruiter() || {};
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [legalEntityName, setLegalEntityName] = useState("");
  const [businessRegType, setBusinessRegType] = useState("cin");
  const [businessRegNumber, setBusinessRegNumber] = useState("");
  const [gstin, setGstin] = useState("");
  const [isGstExempt, setIsGstExempt] = useState(false);
  const [gstExemptionReason, setGstExemptionReason] = useState("");
  const [responsiblePersonName, setResponsiblePersonName] = useState("");
  const [responsiblePersonDesignation, setResponsiblePersonDesignation] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");

  // Document states
  const [regDocUrl, setRegDocUrl] = useState("");
  const [regDocName, setRegDocName] = useState("");
  const [gstDocUrl, setGstDocUrl] = useState("");
  const [gstDocName, setGstDocName] = useState("");
  const [signatoryDocUrl, setSignatoryDocUrl] = useState("");

  const [isUploadingReg, setIsUploadingReg] = useState(false);
  const [isUploadingGst, setIsUploadingGst] = useState(false);
  const [isUploadingSignatory, setIsUploadingSignatory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await recruiterService.getOrganizationProfile();
      if (res?.data) {
        const p = res.data;
        setProfile(p);
        setLegalEntityName(p.legalBusinessName || p.companyName || "");
        setBusinessRegNumber(p.businessRegNumber || p.cinNumber || "");
        setGstin(p.gstin || "");
        setResponsiblePersonName(p.responsiblePersonName || p.contactPerson || "");
        setResponsiblePersonDesignation(p.responsiblePersonDesignation || p.contactDesignation || "");
        setLocation(p.location || p.city || "Mumbai, India");
        setWebsite(p.website || "");
        setBusinessDescription(p.description || "");
      }
    } catch (err) {
      console.warn("Could not load organization profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (file, setUrl, setName, setLoadingState) => {
    if (!file) return;
    try {
      setLoadingState(true);
      const res = await mediaService.uploadFile(file, { folder: "vismaya/compliance" });
      const url = res?.url || res?.secure_url || (typeof res === "string" ? res : "");
      if (url) {
        setUrl(url);
        if (setName) setName(file.name);
        showNotification("success", `File ${file.name} uploaded successfully.`);
      }
    } catch (err) {
      showNotification("error", err?.message || "Failed to upload document");
    } finally {
      setLoadingState(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!legalEntityName.trim()) {
      showNotification("error", "Please provide legal entity name");
      return;
    }
    if (!businessRegNumber.trim()) {
      showNotification("error", "Please provide company registration number");
      return;
    }
    if (!regDocUrl) {
      showNotification("error", "Please upload company registration document");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await verificationService.submitBusinessVerification({
        businessRegType,
        businessRegNumber,
        legalEntityName,
        documentUrl: regDocUrl,
        businessRegistrationDocUrl: regDocUrl,
        businessRegistrationDocName: regDocName || "Registration_Certificate.pdf",
        gstin: isGstExempt ? undefined : gstin,
        isGstExempt,
        gstExemptionReason: isGstExempt ? gstExemptionReason : undefined,
        gstCertificateUrl: gstDocUrl || undefined,
        gstCertificateDocName: gstDocName || undefined,
        responsiblePersonName,
        responsiblePersonDesignation,
        location,
        website,
        businessDescription,
      });

      if (res?.success) {
        showNotification("success", "Compliance documentation submitted for Vismaya review!");
        await loadData();
        if (typeof refreshCompanyProfile === "function") {
          await refreshCompanyProfile();
        }
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    } catch (err) {
      showNotification("error", err?.response?.data?.message || err?.message || "Failed to submit verification");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isVerified = Boolean(profile?.isVerified);
  const isRejected = profile?.status === "rejected" || profile?.verificationState === "rejected";
  const isUnderReview = Boolean(
    !isVerified &&
    (profile?.isPendingReview ||
      profile?.hasSubmittedKyc ||
      profile?.verificationStatus === "in_review" ||
      profile?.verificationStatus === "under_review" ||
      profile?.verificationState === "pending" ||
      regDocUrl ||
      businessRegNumber)
  );

  const inputStyle = {
    height: "40px",
    borderRadius: "8px",
    border: "1px solid #DDD8CD",
    padding: "0 12px",
    fontSize: "13.5px",
    backgroundColor: "#FAF9F6",
    width: "100%",
    boxSizing: "border-box",
    color: "#2B2D2A",
    outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
      {/* Top Header Row with Skip / Dashboard Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "280px" }}>
          <PageHeader
            title="Organization Compliance &amp; KYC Verification"
            subtitle="Submit statutory business credentials to establish verified production house status and publish live casting calls."
          />
        </div>
        {isOnboarding && (
          <button
            type="button"
            onClick={() => router.push("/recruiter/dashboard")}
            className="btn-secondary"
            style={{
              height: "38px",
              padding: "0 18px",
              fontSize: "13px",
              fontWeight: "600",
              borderRadius: "8px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#FAF9F6",
              flexShrink: 0,
            }}
          >
            <span>Skip for Now (Go to Dashboard)</span>
            <ArrowRight size={15} />
          </button>
        )}
      </div>

      {/* Floating Viewport Notification (Always visible at top of viewport regardless of scroll position) */}
      {notification && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            minWidth: "320px",
            maxWidth: "92vw",
            padding: "14px 20px",
            borderRadius: "12px",
            backgroundColor: notification.type === "success" ? "#065F46" : "#991B1B",
            color: "#FFFFFF",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            border: `1px solid ${notification.type === "success" ? "#34D399" : "#F87171"}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {notification.type === "success" ? (
              <CheckCircle2 size={20} color="#34D399" style={{ flexShrink: 0 }} />
            ) : (
              <AlertCircle size={20} color="#F87171" style={{ flexShrink: 0 }} />
            )}
            <span style={{ fontSize: "14px", fontWeight: "600" }}>{notification.message}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {notification.type === "success" && (
              <button
                type="button"
                onClick={() => router.push("/recruiter/dashboard")}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "1px solid rgba(255,255,255,0.4)",
                  color: "#FFFFFF",
                  padding: "4px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>Dashboard</span>
                <ArrowRight size={13} />
              </button>
            )}
            <button
              onClick={() => setNotification(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#FFFFFF", opacity: 0.8 }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Rejection State Box */}
      {isRejected && (
        <div
          style={{
            backgroundColor: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: "14px",
            padding: "20px 24px",
            display: "flex",
            alignItems: "flex-start",
            gap: "16px",
          }}
        >
          <AlertCircle size={24} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#991B1B", margin: "0 0 6px 0" }}>
              Organization Verification Rejected
            </h3>
            <p style={{ fontSize: "13.5px", color: "#7F1D1D", margin: "0 0 14px 0", lineHeight: "20px" }}>
              Your organization credentials could not be verified by Vismaya Compliance Desk. As required by platform policy, rejected organizations must contact support directly.
            </p>
            <ContactVismayaButton context="Rejected verification appeal" reference={profile?._id || ""} />
          </div>
        </div>
      )}

      {/* Main Responsive 2-Column Grid */}
      <div className="recruiter-kyc-grid">
        {/* Left Column: Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E4DA",
              borderRadius: "16px",
              padding: "24px 28px",
              boxShadow: "0 2px 8px rgba(43, 45, 42, 0.02)",
            }}
          >
            <form onSubmit={handleSubmit} id="verification-form" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Section 1 Header */}
              <div style={{ borderBottom: "1px solid #F0ECE3", paddingBottom: "10px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#2B2D2A", margin: 0 }}>
                  1. Statutory Entity &amp; Signatory Details
                </h2>
                <p style={{ fontSize: "12px", color: "#77756B", margin: "3px 0 0 0" }}>
                  Official registration credentials recorded with corporate or trade registries
                </p>
              </div>

              {/* 2-Column Inputs Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }} className="responsive-two-col">
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#2B2D2A" }}>
                    Legal Registered Entity Name *
                  </label>
                  <input
                    type="text"
                    placeholder="E.g. Zee Studios Private Limited"
                    value={legalEntityName}
                    onChange={(e) => setLegalEntityName(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#2B2D2A" }}>
                    Business Registration Type *
                  </label>
                  <select
                    value={businessRegType}
                    onChange={(e) => setBusinessRegType(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="cin">Corporate Identification Number (CIN)</option>
                    <option value="llpin">LLPIN (Limited Liability Partnership)</option>
                    <option value="gstin">GST Registration (Sole Proprietorship / Partnership)</option>
                    <option value="trade_license">Municipal Trade License / Shop &amp; Est</option>
                    <option value="udyam">MSME Udyam Registration</option>
                    <option value="other">Other Official Registration</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#2B2D2A" }}>
                    Registration Number (CIN / LLPIN / Udyam) *
                  </label>
                  <input
                    type="text"
                    placeholder="E.g. U74999MH2021PTC123456 / UDYAM-..."
                    value={businessRegNumber}
                    onChange={(e) => setBusinessRegNumber(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#2B2D2A" }}>
                    Official Website / Portfolio
                  </label>
                  <input
                    type="url"
                    placeholder="https://yourproductionhouse.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#2B2D2A" }}>
                    Responsible Authorized Signatory Name *
                  </label>
                  <input
                    type="text"
                    placeholder="E.g. Vikram Malhotra"
                    value={responsiblePersonName}
                    onChange={(e) => setResponsiblePersonName(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#2B2D2A" }}>
                    Designation / Authority *
                  </label>
                  <input
                    type="text"
                    placeholder="E.g. Executive Producer / Casting Director"
                    value={responsiblePersonDesignation}
                    onChange={(e) => setResponsiblePersonDesignation(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* GST Section */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", backgroundColor: "#FAF9F6", padding: "14px 18px", borderRadius: "10px", border: "1px solid #E8E4DA" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="checkbox"
                    id="gstExempt"
                    checked={isGstExempt}
                    onChange={(e) => setIsGstExempt(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#8A6B2E", cursor: "pointer" }}
                  />
                  <label htmlFor="gstExempt" style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A", cursor: "pointer" }}>
                    Organization is GST Exempt / Below GST Threshold (Under ₹20/40 Lakhs turnover)
                  </label>
                </div>

                {!isGstExempt ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label style={{ fontSize: "12px", fontWeight: "600", color: "#2B2D2A" }}>
                        GSTIN (15-Digit GST Number) *
                      </label>
                      <span style={{ fontSize: "11px", color: "#8A6B2E" }}>e.g. 27AABCZ1234F1Z5</span>
                    </div>
                    <input
                      type="text"
                      placeholder="27AABCZ1234F1Z5"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      style={{ ...inputStyle, backgroundColor: "#FFFFFF" }}
                    />
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#2B2D2A" }}>
                      GST Exemption Reason / Declaration
                    </label>
                    <input
                      type="text"
                      placeholder="E.g. Annual aggregate turnover is below statutory GST limit"
                      value={gstExemptionReason}
                      onChange={(e) => setGstExemptionReason(e.target.value)}
                      style={{ ...inputStyle, backgroundColor: "#FFFFFF" }}
                    />
                  </div>
                )}
              </div>

              {/* Section 2 Header */}
              <div style={{ borderBottom: "1px solid #F0ECE3", paddingBottom: "10px", marginTop: "4px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#2B2D2A", margin: 0 }}>
                  2. Accreditation Documents Upload
                </h2>
                <p style={{ fontSize: "12px", color: "#77756B", margin: "3px 0 0 0" }}>
                  Official PDF certificate or clear document scan (max 15 MB)
                </p>
              </div>

              {/* 2-Column Documents Upload Grid */}
              <div style={{ display: "grid", gridTemplateColumns: isGstExempt ? "1fr" : "1fr 1fr", gap: "14px" }} className="responsive-two-col">
                {/* Doc 1: Registration Document */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#2B2D2A" }}>
                    Company Registration Document *
                  </label>
                  <div
                    style={{
                      border: "2px dashed #DDD8CD",
                      borderRadius: "10px",
                      padding: "16px",
                      textAlign: "center",
                      backgroundColor: "#FAF9F6",
                      minHeight: "88px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxSizing: "border-box",
                    }}
                  >
                    {regDocUrl ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", width: "100%" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                          <FileText size={18} color="#8A6B2E" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {regDocName || "Registration Certificate"}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                          <a href={regDocUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#8A6B2E", textDecoration: "underline" }}>
                            Preview
                          </a>
                          <button type="button" onClick={() => setRegDocUrl("")} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "12px" }}>
                            Replace
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                        <UploadCloud size={20} style={{ color: "#8A6B2E" }} />
                        <label className="btn-secondary" style={{ display: "inline-block", cursor: isUploadingReg ? "wait" : "pointer", padding: "5px 14px", fontSize: "12px", borderRadius: "6px" }}>
                          {isUploadingReg ? "Uploading..." : "Upload Certificate"}
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            style={{ display: "none" }}
                            disabled={isUploadingReg}
                            onChange={(e) => handleFileUpload(e.target.files[0], setRegDocUrl, setRegDocName, setIsUploadingReg)}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Doc 2: GST Certificate */}
                {!isGstExempt && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#2B2D2A" }}>
                      GST Certificate (Form REG-06)
                    </label>
                    <div
                      style={{
                        border: "2px dashed #DDD8CD",
                        borderRadius: "10px",
                        padding: "16px",
                        textAlign: "center",
                        backgroundColor: "#FAF9F6",
                        minHeight: "88px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxSizing: "border-box",
                      }}
                    >
                      {gstDocUrl ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", width: "100%" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                            <FileText size={18} color="#8A6B2E" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {gstDocName || "GST Certificate"}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                            <a href={gstDocUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#8A6B2E", textDecoration: "underline" }}>
                              Preview
                            </a>
                            <button type="button" onClick={() => setGstDocUrl("")} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "12px" }}>
                              Replace
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                          <UploadCloud size={20} style={{ color: "#8A6B2E" }} />
                          <label className="btn-secondary" style={{ display: "inline-block", cursor: isUploadingGst ? "wait" : "pointer", padding: "5px 14px", fontSize: "12px", borderRadius: "6px" }}>
                            {isUploadingGst ? "Uploading..." : "Upload GST Certificate"}
                            <input
                              type="file"
                              accept=".pdf,image/*"
                              style={{ display: "none" }}
                              disabled={isUploadingGst}
                              onChange={(e) => handleFileUpload(e.target.files[0], setGstDocUrl, setGstDocName, setIsUploadingGst)}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Inline Submit Feedback Banner */}
              {notification && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    backgroundColor: notification.type === "success" ? "#ECFDF5" : "#FEF2F2",
                    border: `1px solid ${notification.type === "success" ? "#A7F3D0" : "#FECACA"}`,
                    color: notification.type === "success" ? "#065F46" : "#991B1B",
                    fontSize: "13.5px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {notification.type === "success" ? (
                      <CheckCircle2 size={18} style={{ color: "#10b981", flexShrink: 0 }} />
                    ) : (
                      <AlertCircle size={18} style={{ color: "#ef4444", flexShrink: 0 }} />
                    )}
                    <span style={{ fontWeight: 600 }}>{notification.message}</span>
                  </div>
                  {notification.type === "success" && (
                    <button
                      type="button"
                      onClick={() => router.push("/recruiter/dashboard")}
                      className="btn-primary"
                      style={{
                        height: "32px",
                        padding: "0 14px",
                        fontSize: "12px",
                        fontWeight: "600",
                        borderRadius: "6px",
                        backgroundColor: "#065F46",
                        color: "#FFFFFF",
                        border: "none",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        flexShrink: 0,
                      }}
                    >
                      <span>Go to Dashboard</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              )}

              {/* Submit Action Row */}
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px", paddingTop: "12px", borderTop: "1px solid #F0ECE3" }}>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingReg || isUploadingGst}
                  className="btn-primary"
                  style={{ height: "42px", padding: "0 28px", fontSize: "13.5px", fontWeight: "700", borderRadius: "8px" }}
                >
                  {isSubmitting ? "Submitting Credentials..." : "Submit Organization For Verification"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Sticky Sidebar (320px) */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "16px", position: "sticky", top: "20px" }}>
          {/* Status Card */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E4DA",
              borderRadius: "14px",
              padding: "18px 20px",
              boxShadow: "0 2px 6px rgba(43, 45, 42, 0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(138, 107, 46, 0.12)",
                  color: "#8A6B2E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Building2 size={22} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <strong style={{ fontSize: "14.5px", color: "#2B2D2A", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {profile?.companyName || "Studio"} Compliance
                </strong>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    marginTop: "3px",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "700",
                    backgroundColor: isVerified
                      ? "rgba(52, 211, 153, 0.15)"
                      : isRejected
                      ? "rgba(239, 68, 68, 0.15)"
                      : isUnderReview
                      ? "rgba(138, 107, 46, 0.12)"
                      : "#FFF9E6",
                    color: isVerified ? "#10b981" : isRejected ? "#ef4444" : "#8A6B2E",
                  }}
                >
                  {isVerified ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                  <span>{isVerified ? "VERIFIED" : isRejected ? "REJECTED" : isUnderReview ? "UNDER REVIEW" : "ACTION REQUIRED"}</span>
                </span>
              </div>
            </div>

            <div style={{ fontSize: "12px", color: "#5A584F", lineHeight: "1.6", borderTop: "1px solid #F0ECE3", paddingTop: "12px" }}>
              <strong style={{ color: "#2B2D2A", display: "block", marginBottom: "6px" }}>What verification unlocks:</strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <span>✓ Publish &amp; manage public casting notices</span>
                <span>✓ Direct screening of verified artists</span>
                <span>✓ Verified Recruiter trust badge on calls</span>
              </div>
            </div>
          </div>

          {/* Confidentiality Guarantee Card */}
          <div
            style={{
              backgroundColor: "#FAF9F6",
              border: "1px solid #E8E4DA",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
            }}
          >
            <Info size={16} color="#8A6B2E" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ fontSize: "12px", color: "#5A584F", lineHeight: "1.5" }}>
              <strong style={{ color: "#2B2D2A" }}>Confidentiality Guarantee: </strong>
              Statutory documents, tax IDs, and certificates are strictly private. They never appear on public cards or to talent.
            </div>
          </div>

          {/* Need Assistance Action */}
          <div style={{ textAlign: "center" }}>
            <ContactVismayaButton context="Recruiter compliance inquiry" reference={profile?._id || ""} />
          </div>
        </aside>
      </div>

      <style jsx global>{`
        .recruiter-kyc-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 22px;
          align-items: start;
          width: 100%;
        }
        @media (max-width: 960px) {
          .recruiter-kyc-grid {
            grid-template-columns: 1fr !important;
            gap: 18px !important;
          }
        }
        @media (max-width: 640px) {
          .responsive-two-col {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function RecruiterVerificationPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "#5A584F" }}>Loading Studio Verification Desk...</div>}>
      <RecruiterVerificationContent />
    </Suspense>
  );
}
