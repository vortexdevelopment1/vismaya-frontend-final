"use client";

import React, { useState, useEffect } from "react";
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

export default function RecruiterVerificationPage() {
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
      }
    } catch (err) {
      showNotification("error", err?.response?.data?.message || err?.message || "Failed to submit verification");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isVerified = profile?.isVerified || profile?.status === "active";
  const isRejected = profile?.status === "rejected" || profile?.verificationState === "rejected";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Organization Compliance &amp; KYC Verification"
        subtitle="Submit statutory business credentials to establish verified production house status and publish live casting calls."
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

      {/* Rejection State Box */}
      {isRejected && (
        <div
          style={{
            backgroundColor: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: "14px",
            padding: "24px",
            display: "flex",
            alignItems: "flex-start",
            gap: "16px",
          }}
        >
          <AlertCircle size={28} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#991B1B", margin: "0 0 6px 0" }}>
              Organization Verification Rejected
            </h3>
            <p style={{ fontSize: "14px", color: "#7F1D1D", margin: "0 0 16px 0", lineHeight: "22px" }}>
              Your organization credentials could not be verified by Vismaya Compliance Desk. As required by platform policy, rejected organizations must contact support directly.
            </p>
            <ContactVismayaButton context="Rejected verification appeal" reference={profile?._id || ""} />
          </div>
        </div>
      )}

      {/* Verification Status Overview Card */}
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
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "rgba(138, 107, 46, 0.12)",
              color: "#8A6B2E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={26} />
          </div>
          <div>
            <strong style={{ fontSize: "16px", color: "#2B2D2A", display: "block" }}>
              {profile?.companyName || "Production House"} Compliance Status
            </strong>
            <span style={{ fontSize: "13px", color: "#77756B" }}>
              Corporate verification enables unhindered brief publication and candidate screening
            </span>
          </div>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 14px",
            borderRadius: "8px",
            fontSize: "12.5px",
            fontWeight: "700",
            backgroundColor: isVerified
              ? "rgba(52, 211, 153, 0.15)"
              : isRejected
              ? "rgba(239, 68, 68, 0.15)"
              : "#FFF9E6",
            color: isVerified ? "#10b981" : isRejected ? "#ef4444" : "#8A6B2E",
            border: `1px solid ${
              isVerified
                ? "rgba(52, 211, 153, 0.35)"
                : isRejected
                ? "rgba(239, 68, 68, 0.35)"
                : "#F0D078"
            }`,
          }}
        >
          {isVerified ? <CheckCircle2 size={14} /> : <Clock size={14} />}
          <span>{isVerified ? "VERIFIED PRODUCTION HOUSE" : isRejected ? "REJECTED" : "COMPLIANCE PENDING"}</span>
        </span>
      </div>

      {/* Strict Privacy Notice */}
      <div
        style={{
          backgroundColor: "#FAF9F6",
          border: "1px solid #E8E4DA",
          borderRadius: "12px",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <Info size={18} color="#8A6B2E" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: "13.5px", color: "#5A584F" }}>
          <strong>Confidentiality Guarantee: </strong>
          Business registration documents, tax certificates, and signatory IDs are kept strictly private. They never appear on your public production card and are not accessible to talent or other organizations.
        </span>
      </div>

      {/* Compliance Submission Form Card */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E4DA",
          borderRadius: "16px",
          padding: "28px",
          boxShadow: "0 2px 10px rgba(43, 45, 42, 0.02)",
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#2B2D2A", margin: "0 0 4px 0", borderBottom: "1px solid #F0ECE3", paddingBottom: "12px" }}>
            1. Legal Entity &amp; Registration Information
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                Legal Registered Entity Name *
              </label>
              <input
                type="text"
                placeholder="E.g. Zee Studios Private Limited"
                value={legalEntityName}
                onChange={(e) => setLegalEntityName(e.target.value)}
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
                Business Registration Type *
              </label>
              <select
                value={businessRegType}
                onChange={(e) => setBusinessRegType(e.target.value)}
                style={{
                  height: "42px",
                  borderRadius: "8px",
                  border: "1px solid #DDD8CD",
                  padding: "0 12px",
                  fontSize: "14px",
                  backgroundColor: "#FAF9F6",
                }}
              >
                <option value="cin">Corporate Identification Number (CIN)</option>
                <option value="llpin">LLPIN (Limited Liability Partnership)</option>
                <option value="gstin">GST Registration (Sole Proprietorship / Partnership)</option>
                <option value="trade_license">Municipal Trade License / Shop &amp; Est</option>
                <option value="udyam">MSME Udyam Registration</option>
                <option value="other">Other Official Registration</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                Registration Number *
              </label>
              <input
                type="text"
                placeholder="E.g. U74999MH2021PTC123456"
                value={businessRegNumber}
                onChange={(e) => setBusinessRegNumber(e.target.value)}
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

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                Responsible Authorized Person Name *
              </label>
              <input
                type="text"
                placeholder="E.g. Vikram Malhotra"
                value={responsiblePersonName}
                onChange={(e) => setResponsiblePersonName(e.target.value)}
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
                Designation / Authority *
              </label>
              <input
                type="text"
                placeholder="E.g. Head of Casting / Executive Producer"
                value={responsiblePersonDesignation}
                onChange={(e) => setResponsiblePersonDesignation(e.target.value)}
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
                Official Website
              </label>
              <input
                type="url"
                placeholder="https://yourproductionhouse.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
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

          {/* GST Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", backgroundColor: "#FAF9F6", padding: "16px", borderRadius: "10px", border: "1px solid #E8E4DA" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="checkbox"
                id="gstExempt"
                checked={isGstExempt}
                onChange={(e) => setIsGstExempt(e.target.checked)}
                style={{ width: "16px", height: "16px" }}
              />
              <label htmlFor="gstExempt" style={{ fontSize: "13.5px", fontWeight: "600", color: "#2B2D2A", cursor: "pointer" }}>
                Organization is GST Exempt / Below GST Threshold (Under ₹20/40 Lakhs turnover)
              </label>
            </div>

            {!isGstExempt ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxWidth: "360px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                  GSTIN (15-Digit GST Number)
                </label>
                <input
                  type="text"
                  placeholder="27AAACZ1234F1Z8"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  style={{
                    height: "40px",
                    borderRadius: "8px",
                    border: "1px solid #DDD8CD",
                    padding: "0 12px",
                    fontSize: "14px",
                    backgroundColor: "#FFFFFF",
                  }}
                />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                  GST Exemption Reason / Declaration
                </label>
                <input
                  type="text"
                  placeholder="E.g. Annual aggregate turnover is below the statutory GST threshold limit"
                  value={gstExemptionReason}
                  onChange={(e) => setGstExemptionReason(e.target.value)}
                  style={{
                    height: "40px",
                    borderRadius: "8px",
                    border: "1px solid #DDD8CD",
                    padding: "0 12px",
                    fontSize: "14px",
                    backgroundColor: "#FFFFFF",
                  }}
                />
              </div>
            )}
          </div>

          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#2B2D2A", margin: "16px 0 4px 0", borderBottom: "1px solid #F0ECE3", paddingBottom: "12px" }}>
            2. Compliance Documents Upload
          </h2>

          {/* Doc 1: Company Registration Certificate */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
              Company Registration Document (Incorporation / Trade License / Partnership Deed) *
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
              {regDocUrl ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <FileText size={20} color="#8A6B2E" />
                    <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#2B2D2A" }}>
                      {regDocName || "Registration Certificate uploaded"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <a href={regDocUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#8A6B2E", textDecoration: "underline" }}>
                      Preview
                    </a>
                    <button type="button" onClick={() => setRegDocUrl("")} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "13px" }}>
                      Replace
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <UploadCloud size={28} style={{ color: "#8A6B2E", margin: "0 auto 8px auto" }} />
                  <p style={{ fontSize: "13px", color: "#5A584F", margin: "0 0 8px 0" }}>
                    Official PDF certificate under 15 MB
                  </p>
                  <label className="btn-secondary" style={{ display: "inline-block", cursor: isUploadingReg ? "wait" : "pointer", padding: "6px 14px", fontSize: "13px" }}>
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
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                GST Registration Certificate (Form REG-06)
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
                {gstDocUrl ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <FileText size={20} color="#8A6B2E" />
                      <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#2B2D2A" }}>
                        {gstDocName || "GST Certificate uploaded"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <a href={gstDocUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#8A6B2E", textDecoration: "underline" }}>
                        Preview
                      </a>
                      <button type="button" onClick={() => setGstDocUrl("")} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "13px" }}>
                        Replace
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <UploadCloud size={24} style={{ color: "#8A6B2E", margin: "0 auto 6px auto" }} />
                    <label className="btn-secondary" style={{ display: "inline-block", cursor: isUploadingGst ? "wait" : "pointer", padding: "6px 14px", fontSize: "13px" }}>
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

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingReg || isUploadingGst}
              className="btn-primary"
              style={{ height: "42px", padding: "0 28px", fontSize: "14px", fontWeight: "700" }}
            >
              {isSubmitting ? "Submitting Credentials..." : "Submit Organization For Verification"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
