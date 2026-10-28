"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  HelpCircle,
  FileText,
  User,
  Award,
  ExternalLink,
  Loader2,
  AlertCircle,
  Building2,
  Filter,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import Tabs from "@/components/shared/Tabs";
import EmptyState from "@/components/shared/EmptyState";
import Modal from "@/components/shared/Modal";
import ReasonModal from "@/components/admin/ReasonModal";
import { adminService } from "@/lib/api/services/adminService";
import { isRealMode } from "@/lib/api/config";

export default function VerificationQueuesPage() {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeStatusTab, setActiveStatusTab] = useState("pending");
  const [activeQueueFilter, setActiveQueueFilter] = useState("all");
  const [actionModal, setActionModal] = useState(null); // { type: 'reject' | 'request_info', verification }
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    if (isRealMode("admin")) {
      try {
        setLoading(true);
        // Load all verifications so status tabs have real counts
        const res = await adminService.getPendingVerifications({ status: "all" });
        if (res?.data) {
          setVerifications(res.data);
        }
      } catch (err) {
        console.error("Error loading verifications:", err);
      } finally {
        setLoading(false);
      }
    } else {
      // Mock data
      setVerifications([
        {
          _id: "ver-mock-1",
          id: "ver-mock-1",
          userId: "usr-1",
          userName: "Aarav Sharma",
          verificationType: "identity",
          status: "Pending",
          rawStatus: "pending",
          documentType: "Aadhaar / Passport",
          documentUrl: "https://example.com/doc-aadhaar.pdf",
          documentName: "doc-aadhaar.pdf",
          selfieUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
          submittedAt: new Date().toISOString(),
        },
        {
          _id: "ver-mock-2",
          id: "ver-mock-2",
          userId: "usr-2",
          userName: "Ananya Roy",
          verificationType: "professional",
          status: "Pending",
          rawStatus: "pending",
          documentType: "IMDb / Credit Contract",
          documentUrl: "https://example.com/credit-proof.pdf",
          documentName: "credit-proof.pdf",
          portfolioEvidence: "Lead actor in released series 'Shadows in the Mist' (2024)",
          submittedAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isItemPending = (v) => {
    const st = (v.rawStatus || v.status || "").toLowerCase();
    return (st === "pending" || v.moreInfoRequested) && st !== "rejected" && st !== "verified";
  };
  const isItemVerified = (v) => (v.rawStatus || v.status || "").toLowerCase() === "verified";
  const isItemRejected = (v) => (v.rawStatus || v.status || "").toLowerCase() === "rejected";

  const pendingCount = verifications.filter(isItemPending).length;
  const verifiedCount = verifications.filter(isItemVerified).length;
  const rejectedCount = verifications.filter(isItemRejected).length;
  const allCount = verifications.length;

  const statusTabs = [
    { key: "pending", label: "Pending Review", count: pendingCount },
    { key: "verified", label: "Verified", count: verifiedCount },
    { key: "rejected", label: "Rejected", count: rejectedCount },
    { key: "all", label: "All Items", count: allCount },
  ];

  const filteredVerifications = verifications.filter((v) => {
    // 1. Status Filter
    if (activeStatusTab === "pending" && !isItemPending(v)) return false;
    if (activeStatusTab === "verified" && !isItemVerified(v)) return false;
    if (activeStatusTab === "rejected" && !isItemRejected(v)) return false;

    // 2. Queue Filter
    if (activeQueueFilter === "all") return true;
    if (activeQueueFilter === "organization_business") {
      return v.verificationType === "organization_business" || v.verificationType === "business";
    }
    return v.verificationType === activeQueueFilter;
  });

  const handleApprove = async (ver) => {
    if (ver?.userMissing || ver?.isUserMissing || !ver?.userId) {
      showToast("Cannot approve verification: User account no longer exists.");
      return;
    }
    if (isItemRejected(ver)) {
      showToast("Cannot approve a rejected verification. A new verification request must be submitted.");
      return;
    }
    const id = ver._id || ver.id;
    if (actionLoadingId) return;
    setActionLoadingId(id);
    try {
      if (isRealMode("admin")) {
        const res = await adminService.reviewVerification(id, { action: "approve", status: "verified", notes: "Approved by Admin" });
        showToast(res?.message || `Verification for ${ver.userName || "user"} approved successfully.`);
        await loadData();
      } else {
        setVerifications((prev) => prev.filter((v) => (v._id || v.id) !== id));
        showToast(`Verification for ${ver.userName || "user"} approved successfully.`);
      }
    } catch (err) {
      showToast(err?.message || "Failed to approve verification");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleActionSubmit = async (notes) => {
    if (!actionModal) return;
    const { type, verification } = actionModal;
    if (verification?.userMissing || verification?.isUserMissing || !verification?.userId) {
      showToast("Cannot perform action: User account no longer exists.");
      setActionModal(null);
      return;
    }
    const id = verification._id || verification.id;
    const action = type === "reject" ? "reject" : "request_more_info";
    const status = type === "reject" ? "rejected" : "request_more_info";

    if (isRealMode("admin")) {
      try {
        const res = await adminService.reviewVerification(id, { action, status, notes, rejectionReason: notes });
        showToast(res?.message || (type === "reject" ? "Verification rejected." : "Information request sent."));
        setActionModal(null);
        await loadData();
      } catch (err) {
        showToast(err?.message || "Failed to submit review");
      }
    } else {
      setVerifications((prev) => prev.filter((v) => (v._id || v.id) !== id));
      showToast(type === "reject" ? "Verification rejected." : "Request more info sent.");
      setActionModal(null);
    }
  };

  const getSubmissionDocuments = (ver) => {
    const docs = [];
    const isBusiness = ver.verificationType === "organization_business" || ver.verificationType === "business";
    if (isBusiness) {
      if (ver.businessRegistrationDocUrl || ver.documentUrl) {
        docs.push({
          type: "Business Registration",
          name: ver.businessRegistrationDocName || ver.documentName || "Registration Document",
          url: ver.businessRegistrationDocUrl || ver.documentUrl,
        });
      }
      if (ver.gstCertificateUrl) {
        docs.push({
          type: "GST Certificate",
          name: ver.gstCertificateDocName || "GST Certificate",
          url: ver.gstCertificateUrl,
        });
      }
      if (ver.professionalProofDocUrl) {
        docs.push({
          type: "Industry Proof Document",
          name: ver.professionalProofDocName || "Proof Document",
          url: ver.professionalProofDocUrl,
        });
      }
      if (Array.isArray(ver.otherEvidenceUrls) && ver.otherEvidenceUrls.length > 0) {
        ver.otherEvidenceUrls.forEach((url, idx) => {
          const name = (Array.isArray(ver.otherEvidenceDocNames) && ver.otherEvidenceDocNames[idx]) || `Evidence File ${idx + 1}`;
          docs.push({
            type: "Additional Evidence",
            name,
            url,
          });
        });
      }
    } else {
      if (ver.documentUrl) {
        docs.push({
          type: ver.documentType || (ver.verificationType === "identity" ? "Government ID" : "Credit Proof / Contract"),
          name: ver.documentName || "Official Verification Document",
          url: ver.documentUrl,
        });
      }
    }
    return docs;
  };

  const formatSubmittedDate = (dateStr) => {
    if (!dateStr) return "Submitted Recently";
    try {
      const d = new Date(dateStr);
      return `Submitted ${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`;
    } catch {
      return "Submitted Recently";
    }
  };

  return (
    <div className="admin-verif-page-root" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "#2B2D2A",
            color: "#FFFFFF",
            padding: "12px 20px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 600,
            zIndex: 1000,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* ===================== DESKTOP LAYOUT (>= 768px) ===================== */}
      <div className="admin-verif-desktop-layout">
        {/* Page Header */}
        <PageHeader
          title="Department-Specific Verification Queues"
          subtitle="Review identity submissions (Government ID + Live Selfie) and professional credentials (Credits + Portfolio Evidence)."
          badge={`${pendingCount} Awaiting Action`}
        />

        {/* Status Tabs */}
        <Tabs tabs={statusTabs} activeTab={activeStatusTab} onChange={setActiveStatusTab} />

        {/* Secondary Queue Filters */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", padding: "4px 0" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#706E66", display: "flex", alignItems: "center", gap: "4px", marginRight: "4px" }}>
            <Filter size={13} /> Queue:
          </span>
          {[
            { key: "all", label: "All Queues" },
            { key: "identity", label: "Identity" },
            { key: "professional", label: "Professional Credits" },
            { key: "organization_business", label: "Business Registration" },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setActiveQueueFilter(f.key)}
              style={{
                padding: "5px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 600,
                border: activeQueueFilter === f.key ? "1px solid #8A6B2E" : "1px solid #E8E2D4",
                background: activeQueueFilter === f.key ? "#8A6B2E" : "#FFFFFF",
                color: activeQueueFilter === f.key ? "#FFFFFF" : "#5A584F",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

      {/* Queue Content */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <Loader2 size={32} style={{ color: "#8A6B2E", animation: "spin 1s linear infinite" }} />
        </div>
      ) : filteredVerifications.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredVerifications.map((ver) => {
            const isUserMissing = Boolean(ver.userMissing || ver.isUserMissing || !ver.userId);
            const isIdentity = ver.verificationType === "identity";
            const isBusiness = ver.verificationType === "organization_business" || ver.verificationType === "business";
            const queueLabel = isIdentity
              ? "Identity Verification"
              : isBusiness
              ? "Corporate / Business Verification"
              : "Professional Credits Verification";

            const rejected = isItemRejected(ver);
            const verified = isItemVerified(ver);
            const pending = isItemPending(ver);

            return (
              <div
                key={ver._id || ver.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E8E2D4",
                  borderRadius: "14px",
                  padding: "20px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  boxShadow: "0 2px 4px rgba(43,45,42,0.04)",
                }}
              >
                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        background: isIdentity ? "#EBF5ED" : isBusiness ? "#F4EFEA" : "#FBF8F1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isIdentity ? "#2B5E3B" : isBusiness ? "#6E5420" : "#8A6B2E",
                      }}
                    >
                      {isIdentity ? <ShieldCheck size={22} /> : isBusiness ? <Building2 size={22} /> : <Award size={22} />}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: isUserMissing ? "#706E66" : "#2B2D2A" }}>
                          {isUserMissing ? "User no longer exists" : (ver.userName || (isBusiness ? "Organization" : "Talent Member"))}
                        </h3>
                        {isUserMissing && (
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#8A6B2E", background: "#F5EFE1", padding: "2px 8px", borderRadius: "6px", border: "1px solid #E8DECA" }}>
                            Account Deleted
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "12.5px", color: "#5A584F" }}>
                        Queue: <strong style={{ color: isIdentity ? "#2B5E3B" : "#8A6B2E" }}>{queueLabel}</strong> · Submitted {new Date(ver.submittedAt || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>

                  {/* True Status Badge */}
                  {rejected ? (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#9B1C1C",
                        background: "#FDE8E8",
                        padding: "4px 10px",
                        borderRadius: "8px",
                        border: "1px solid #F8B4B4",
                      }}
                    >
                      REJECTED
                    </span>
                  ) : verified ? (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#03543F",
                        background: "#DEF7EC",
                        padding: "4px 10px",
                        borderRadius: "8px",
                        border: "1px solid #BCF0DA",
                      }}
                    >
                      VERIFIED
                    </span>
                  ) : ver.moreInfoRequested ? (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#713F12",
                        background: "#FEF08A",
                        padding: "4px 10px",
                        borderRadius: "8px",
                        border: "1px solid #FDE047",
                      }}
                    >
                      MORE INFO REQUESTED
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#8A6B2E",
                        background: "#F5EFE1",
                        padding: "4px 10px",
                        borderRadius: "8px",
                        border: "1px solid #E8DECA",
                      }}
                    >
                      PENDING REVIEW
                    </span>
                  )}
                </div>

                {/* Evidence Details */}
                <div style={{ background: "#FAF9F7", border: "1px solid #F0EEEA", borderRadius: "10px", padding: "14px 16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
                  {isBusiness ? (
                    <>
                      {/* Business Registration Document */}
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#8A6B2E", textTransform: "uppercase", marginBottom: "4px" }}>
                          Business Registration Document
                        </div>
                        {(ver.businessRegistrationDocUrl || ver.documentUrl) ? (
                          <a
                            href={ver.businessRegistrationDocUrl || ver.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#8A6B2E", marginTop: "4px", textDecoration: "none", fontWeight: 600 }}
                          >
                            <ExternalLink size={12} /> Inspect Registration Document ({ver.businessRegistrationDocName || ver.documentName || "Document"})
                          </a>
                        ) : (
                          <div style={{ fontSize: "12px", color: "#A8A29E", fontStyle: "italic", marginTop: "4px" }}>
                            No document uploaded yet
                          </div>
                        )}
                      </div>

                      {/* Registration Number */}
                      {(ver.businessData?.businessRegNumber && String(ver.businessData.businessRegNumber).trim().toUpperCase() !== "PENDING") && (
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#8A6B2E", textTransform: "uppercase", marginBottom: "4px" }}>
                            Registration Number (CIN / LLPIN / Udyam)
                          </div>
                          <div style={{ fontSize: "13px", color: "#2B2D2A", fontWeight: 600 }}>
                            {String(ver.businessData.businessRegNumber).trim()}
                          </div>
                        </div>
                      )}

                      {/* GSTIN / Tax Status */}
                      {ver.isGstExempt ? (
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#8A6B2E", textTransform: "uppercase", marginBottom: "4px" }}>
                            GST Status
                          </div>
                          <div style={{ fontSize: "12.5px", color: "#4A483F" }}>
                            <strong style={{ color: "#2B2D2A" }}>Not GST registered</strong>
                            {ver.gstExemptionReason && (
                              <div style={{ fontSize: "12px", color: "#5A584F", marginTop: "2px" }}>
                                Reason: {ver.gstExemptionReason}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (ver.gstin || ver.businessData?.gstin) ? (
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#8A6B2E", textTransform: "uppercase", marginBottom: "4px" }}>
                            GSTIN & Certificate
                          </div>
                          <div style={{ fontSize: "13px", color: "#2B2D2A", fontWeight: 600 }}>
                            {ver.gstin || ver.businessData?.gstin}
                          </div>
                          {ver.gstCertificateUrl ? (
                            <a
                              href={ver.gstCertificateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#8A6B2E", marginTop: "4px", textDecoration: "none", fontWeight: 600 }}
                            >
                              <ExternalLink size={12} /> Inspect GST Certificate ({ver.gstCertificateDocName || "Certificate"})
                            </a>
                          ) : null}
                        </div>
                      ) : null}

                      {/* Professional / Industry Proof */}
                      {(ver.professionalProofUrl || ver.professionalProofDocUrl) && (
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#8A6B2E", textTransform: "uppercase", marginBottom: "4px" }}>
                            Professional / Industry Proof
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                            {ver.professionalProofUrl && (
                              <a
                                href={ver.professionalProofUrl.startsWith("http") ? ver.professionalProofUrl : `https://${ver.professionalProofUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#8A6B2E", textDecoration: "none", fontWeight: 600 }}
                              >
                                <ExternalLink size={12} /> {ver.professionalProofUrl}
                              </a>
                            )}
                            {ver.professionalProofDocUrl && (
                              <a
                                href={ver.professionalProofDocUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#8A6B2E", textDecoration: "none", fontWeight: 600 }}
                              >
                                <ExternalLink size={12} /> Inspect Proof Document ({ver.professionalProofDocName || "Document"})
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Other Evidence */}
                      {Array.isArray(ver.otherEvidenceUrls) && ver.otherEvidenceUrls.length > 0 && (
                        <div style={{ gridColumn: "1 / -1" }}>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#8A6B2E", textTransform: "uppercase", marginBottom: "4px" }}>
                            Other Evidence ({ver.otherEvidenceUrls.length})
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
                            {ver.otherEvidenceUrls.map((url, idx) => {
                              const name = (Array.isArray(ver.otherEvidenceDocNames) && ver.otherEvidenceDocNames[idx]) || `Evidence File ${idx + 1}`;
                              return (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#8A6B2E", textDecoration: "none", fontWeight: 600, background: "#FFFFFF", border: "1px solid #E8E2D4", padding: "4px 8px", borderRadius: "6px" }}
                                >
                                  <ExternalLink size={12} /> {name}
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#8A6B2E", textTransform: "uppercase", marginBottom: "4px" }}>
                          Submitted Document Proof
                        </div>
                        <div style={{ fontSize: "13px", color: "#2B2D2A", fontWeight: 600 }}>
                          {ver.documentType || "Official Verification Document"}
                        </div>
                        {ver.documentUrl ? (
                          <a
                            href={ver.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#8A6B2E", marginTop: "4px", textDecoration: "none", fontWeight: 600 }}
                          >
                            <ExternalLink size={12} /> Inspect Uploaded Document ({ver.documentName || "File"})
                          </a>
                        ) : (
                          <div style={{ fontSize: "12px", color: "#A8A29E", fontStyle: "italic", marginTop: "4px" }}>
                            No document uploaded yet
                          </div>
                        )}
                      </div>

                      {isIdentity && ver.selfieUrl && (
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#8A6B2E", textTransform: "uppercase", marginBottom: "4px" }}>
                            Verification Selfie
                          </div>
                          <a href={ver.selfieUrl} target="_blank" rel="noopener noreferrer">
                            <img
                              src={ver.selfieUrl}
                              alt="Selfie"
                              style={{ width: "64px", height: "64px", borderRadius: "8px", objectFit: "cover", border: "1px solid #E8E2D4" }}
                            />
                          </a>
                        </div>
                      )}

                      {!isIdentity && ver.portfolioEvidence && (
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#8A6B2E", textTransform: "uppercase", marginBottom: "4px" }}>
                            Credit Evidence
                          </div>
                          <div style={{ fontSize: "12.5px", color: "#4A483F", lineHeight: 1.45 }}>
                            {ver.portfolioEvidence}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {ver.rejectionReason && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#9B1C1C", textTransform: "uppercase", marginBottom: "4px" }}>
                        Rejection Reason
                      </div>
                      <div style={{ fontSize: "12.5px", color: "#9B1C1C", lineHeight: 1.45, fontStyle: "italic" }}>
                        {ver.rejectionReason}
                      </div>
                    </div>
                  )}

                  {ver.moreInfoRequested && ver.moreInfoNotes && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#713F12", textTransform: "uppercase", marginBottom: "4px" }}>
                        Information Requested By Admin
                      </div>
                      <div style={{ fontSize: "12.5px", color: "#713F12", lineHeight: 1.45, fontStyle: "italic" }}>
                        {ver.moreInfoNotes}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Controls */}
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap", paddingTop: "8px", borderTop: "1px solid #F0EEEA" }}>
                  {isUserMissing ? (
                    <span style={{ fontSize: "12px", color: "#706E66", marginRight: "auto", fontStyle: "italic" }}>
                      User no longer exists. Actions disabled.
                    </span>
                  ) : rejected ? (
                    <span style={{ fontSize: "12.5px", color: "#9B1C1C", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", marginRight: "auto" }}>
                      <XCircle size={15} /> Rejected — Applicant must submit a new verification request to be reviewed again.
                    </span>
                  ) : verified ? (
                    <span style={{ fontSize: "12.5px", color: "#03543F", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", marginRight: "auto" }}>
                      <CheckCircle size={15} /> Verification Approved
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setActionModal({ type: "request_info", verification: ver })}
                        style={{
                          padding: "8px 14px",
                          borderRadius: "8px",
                          border: "1px solid #8A6B2E",
                          background: "#FAF9F7",
                          color: "#8A6B2E",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <HelpCircle size={14} /> Request More Information
                      </button>

                      <button
                        type="button"
                        onClick={() => setActionModal({ type: "reject", verification: ver })}
                        style={{
                          padding: "8px 14px",
                          borderRadius: "8px",
                          border: "1px solid #D9534F",
                          background: "#FFFFFF",
                          color: "#D9534F",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <XCircle size={14} /> Reject
                      </button>

                      <button
                        type="button"
                        disabled={actionLoadingId === (ver._id || ver.id)}
                        onClick={() => handleApprove(ver)}
                        style={{
                          padding: "8px 18px",
                          borderRadius: "8px",
                          border: "none",
                          background: "#2B5E3B",
                          color: "#FFFFFF",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: actionLoadingId === (ver._id || ver.id) ? "not-allowed" : "pointer",
                          opacity: actionLoadingId === (ver._id || ver.id) ? 0.7 : 1,
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {actionLoadingId === (ver._id || ver.id) ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Approving...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={14} /> Approve Verification
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={ShieldCheck}
          title={
            activeStatusTab === "pending"
              ? "No Verifications Awaiting Review"
              : activeStatusTab === "rejected"
              ? "No Rejected Verifications"
              : activeStatusTab === "verified"
              ? "No Verified Records Found"
              : "No Verifications Found"
          }
          description={
            activeStatusTab === "pending"
              ? "All identity and professional credit verification requests are up to date."
              : "There are no verification items in this view matching your filters."
          }
        />
      )}
      </div>

      {/* ===================== MOBILE LAYOUT (<= 767px) ===================== */}
      <div className="admin-verif-mobile-layout">
        {/* Mobile Header */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "30px",
              lineHeight: 1.2,
              fontWeight: 600,
              color: "#2A241A",
            }}
          >
            Verification queues
          </h1>
          {pendingCount > 0 && (
            <div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  height: "26px",
                  padding: "0 10px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  background: "#FBEBDD",
                  color: "#8F3F16",
                  border: "1px solid rgba(143, 63, 22, 0.25)",
                }}
              >
                {pendingCount} AWAITING ACTION
              </span>
            </div>
          )}
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              lineHeight: 1.55,
              color: "#6B6254",
            }}
          >
            Review identity submissions and professional credentials before approving accounts.
          </p>
        </div>

        {/* Status Filter: horizontally scrollable row */}
        <div className="admin-verif-chip-row">
          {statusTabs.map((tab) => {
            const isActive = activeStatusTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveStatusTab(tab.key)}
                style={{
                  flex: "none",
                  height: "40px",
                  padding: "0 14px",
                  borderRadius: "999px",
                  fontSize: "14px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  border: isActive ? "1px solid #C9A95C" : "1px solid #E1D4B3",
                  background: isActive ? "#FBF3DF" : "#FFFFFF",
                  color: isActive ? "#5E471B" : "#2A241A",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    minWidth: "20px",
                    height: "20px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 6px",
                    background: isActive ? "#8A6B2E" : "#F3ECDC",
                    color: isActive ? "#FFFFFF" : "#5E471B",
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Queue Filter: small uppercase label and scrollable chip row */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#6B6254",
            }}
          >
            QUEUE
          </div>
          <div className="admin-verif-chip-row">
            {[
              { key: "all", label: "All queues" },
              { key: "identity", label: "Identity" },
              { key: "professional", label: "Professional credits" },
              { key: "organization_business", label: "Business registration" },
            ].map((f) => {
              const isActive = activeQueueFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setActiveQueueFilter(f.key)}
                  style={{
                    flex: "none",
                    height: "40px",
                    padding: "0 14px",
                    borderRadius: "999px",
                    fontSize: "14px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    border: isActive ? "1px solid #C9A95C" : "1px solid #E1D4B3",
                    background: isActive ? "#FBF3DF" : "#FFFFFF",
                    color: isActive ? "#5E471B" : "#2A241A",
                    display: "inline-flex",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Content */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <Loader2 size={32} style={{ color: "#8A6B2E", animation: "spin 1s linear infinite" }} />
          </div>
        ) : filteredVerifications.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredVerifications.map((ver) => {
              const isUserMissing = Boolean(ver.userMissing || ver.isUserMissing || !ver.userId);
              const isIdentity = ver.verificationType === "identity";
              const isBusiness = ver.verificationType === "organization_business" || ver.verificationType === "business";
              const queueLabel = isIdentity
                ? "Identity Verification"
                : isBusiness
                ? "Business Registration"
                : "Professional Credits";

              const rejected = isItemRejected(ver);
              const verified = isItemVerified(ver);
              const pending = isItemPending(ver);
              const docs = getSubmissionDocuments(ver);

              return (
                <div
                  key={ver._id || ver.id}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E8E1D2",
                    borderRadius: "16px",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 2px 4px rgba(43,45,42,0.04)",
                  }}
                >
                  {/* Top row: 44px icon box + text column */}
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        background: "#F3ECDC",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#8A6B2E",
                        flexShrink: 0,
                      }}
                    >
                      {isBusiness ? <Building2 size={22} /> : isIdentity ? <User size={22} /> : <Award size={22} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2
                        style={{
                          margin: 0,
                          fontFamily: "'Playfair Display', Georgia, serif",
                          fontSize: "22px",
                          lineHeight: 1.25,
                          fontWeight: 600,
                          color: isUserMissing ? "#6B6254" : "#2A241A",
                          overflowWrap: "anywhere",
                          wordBreak: "break-word",
                        }}
                      >
                        {isUserMissing ? "User no longer exists" : (ver.userName || (isBusiness ? "Organization" : "Talent Member"))}
                      </h2>
                      <div style={{ fontSize: "13px", color: "#6B6254", marginTop: "3px" }}>
                        {queueLabel}
                      </div>
                      <div style={{ fontSize: "13px", color: "#6B6254", marginTop: "2px" }}>
                        {formatSubmittedDate(ver.submittedAt)}
                      </div>
                    </div>
                  </div>

                  {/* Status pill (margin-top 12px) */}
                  <div style={{ marginTop: "12px" }}>
                    {rejected ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          height: "26px",
                          padding: "0 10px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          lineHeight: 1,
                          whiteSpace: "nowrap",
                          background: "#FBE9E5",
                          color: "#A3321F",
                          border: "1px solid rgba(163, 50, 31, 0.25)",
                        }}
                      >
                        REJECTED
                      </span>
                    ) : verified ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          height: "26px",
                          padding: "0 10px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          lineHeight: 1,
                          whiteSpace: "nowrap",
                          background: "#E3F0E7",
                          color: "#2F6B45",
                          border: "1px solid rgba(47, 107, 69, 0.25)",
                        }}
                      >
                        VERIFIED
                      </span>
                    ) : ver.moreInfoRequested ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          height: "26px",
                          padding: "0 10px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          lineHeight: 1,
                          whiteSpace: "nowrap",
                          background: "#FBEBDD",
                          color: "#8F3F16",
                          border: "1px solid rgba(143, 63, 22, 0.25)",
                        }}
                      >
                        MORE INFO REQUESTED
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          height: "26px",
                          padding: "0 10px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          lineHeight: 1,
                          whiteSpace: "nowrap",
                          background: "#FBEBDD",
                          color: "#8F3F16",
                          border: "1px solid rgba(143, 63, 22, 0.25)",
                        }}
                      >
                        PENDING REVIEW
                      </span>
                    )}
                  </div>

                  {/* Section label "DOCUMENTS" */}
                  <div style={{ marginTop: "14px", borderTop: "1px solid #EFE9DA", paddingTop: "12px" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#6B6254",
                        marginBottom: "4px",
                      }}
                    >
                      DOCUMENTS
                    </div>
                    {docs.length > 0 ? (
                      docs.map((doc, dIdx) => (
                        <div
                          key={dIdx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "12px 0",
                            borderTop: dIdx > 0 ? "1px solid #EFE9DA" : "none",
                          }}
                        >
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "8px",
                              background: "#F3ECDC",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#8A6B2E",
                              flexShrink: 0,
                            }}
                          >
                            <FileText size={18} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#2A241A", lineHeight: 1.3 }}>
                              {doc.type}
                            </div>
                            <div
                              style={{
                                fontSize: "12.5px",
                                color: "#6B6254",
                                overflowWrap: "anywhere",
                                wordBreak: "break-word",
                                lineHeight: 1.3,
                                marginTop: "2px",
                              }}
                            >
                              {doc.name}
                            </div>
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              height: "36px",
                              padding: "0 12px",
                              borderRadius: "8px",
                              border: "1px solid #CDBF9E",
                              background: "#FFFFFF",
                              color: "#5E471B",
                              fontSize: "13px",
                              fontWeight: 600,
                              flexShrink: 0,
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            View
                          </a>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: "12.5px", color: "#6B6254", fontStyle: "italic", padding: "6px 0" }}>
                        No document uploaded yet
                      </div>
                    )}
                  </div>

                  {/* Detail fields */}
                  {/* Business: Registration number */}
                  {isBusiness && ver.businessData?.businessRegNumber && String(ver.businessData.businessRegNumber).trim().toUpperCase() !== "PENDING" && (
                    <div style={{ padding: "12px 0", borderTop: "1px solid #EFE9DA" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6254", marginBottom: "4px" }}>
                        REGISTRATION NUMBER (CIN / LLPIN / UDYAM)
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 600, lineHeight: 1.4, color: "#2A241A", overflowWrap: "anywhere" }}>
                        {String(ver.businessData.businessRegNumber).trim()}
                      </div>
                    </div>
                  )}

                  {/* Business: GSTIN / Tax Status */}
                  {isBusiness && (ver.isGstExempt ? (
                    <div style={{ padding: "12px 0", borderTop: "1px solid #EFE9DA" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6254", marginBottom: "4px" }}>
                        GST STATUS
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 600, lineHeight: 1.4, color: "#2A241A", overflowWrap: "anywhere" }}>
                        Not GST registered
                        {ver.gstExemptionReason && (
                          <span style={{ display: "block", fontSize: "12.5px", fontWeight: 400, color: "#6B6254", marginTop: "2px" }}>
                            Reason: {ver.gstExemptionReason}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (ver.gstin || ver.businessData?.gstin) ? (
                    <div style={{ padding: "12px 0", borderTop: "1px solid #EFE9DA" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6254", marginBottom: "4px" }}>
                        GSTIN
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 600, lineHeight: 1.4, color: "#2A241A", overflowWrap: "anywhere" }}>
                        {ver.gstin || ver.businessData?.gstin}
                      </div>
                    </div>
                  ) : null)}

                  {/* Business: Website / Industry Proof */}
                  {isBusiness && ver.professionalProofUrl && (
                    <div style={{ padding: "12px 0", borderTop: "1px solid #EFE9DA" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6254", marginBottom: "4px" }}>
                        WEBSITE / INDUSTRY PROOF
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 600, lineHeight: 1.4, overflowWrap: "anywhere" }}>
                        <a
                          href={ver.professionalProofUrl.startsWith("http") ? ver.professionalProofUrl : `https://${ver.professionalProofUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#8A6B2E", textDecoration: "none" }}
                        >
                          {ver.professionalProofUrl}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Identity: Verification Selfie */}
                  {isIdentity && ver.selfieUrl && (
                    <div style={{ padding: "12px 0", borderTop: "1px solid #EFE9DA" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6254", marginBottom: "6px" }}>
                        VERIFICATION SELFIE
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <a href={ver.selfieUrl} target="_blank" rel="noopener noreferrer">
                          <img
                            src={ver.selfieUrl}
                            alt="Verification Selfie"
                            style={{ width: "64px", height: "64px", borderRadius: "8px", objectFit: "cover", border: "1px solid #E8E1D2" }}
                          />
                        </a>
                        <a
                          href={ver.selfieUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            height: "36px",
                            padding: "0 12px",
                            borderRadius: "8px",
                            border: "1px solid #CDBF9E",
                            background: "#FFFFFF",
                            color: "#5E471B",
                            fontSize: "13px",
                            fontWeight: 600,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          View Selfie
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Professional: Credit Evidence */}
                  {!isIdentity && !isBusiness && ver.portfolioEvidence && (
                    <div style={{ padding: "12px 0", borderTop: "1px solid #EFE9DA" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6254", marginBottom: "4px" }}>
                        CREDIT EVIDENCE
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 600, lineHeight: 1.4, color: "#2A241A", overflowWrap: "anywhere" }}>
                        {ver.portfolioEvidence}
                      </div>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {ver.rejectionReason && (
                    <div style={{ padding: "12px 0", borderTop: "1px solid #EFE9DA" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#A3321F", marginBottom: "4px" }}>
                        REJECTION REASON
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 600, lineHeight: 1.4, color: "#A3321F", fontStyle: "italic", overflowWrap: "anywhere" }}>
                        {ver.rejectionReason}
                      </div>
                    </div>
                  )}

                  {/* Information Requested */}
                  {ver.moreInfoRequested && ver.moreInfoNotes && (
                    <div style={{ padding: "12px 0", borderTop: "1px solid #EFE9DA" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8F3F16", marginBottom: "4px" }}>
                        INFORMATION REQUESTED BY ADMIN
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 600, lineHeight: 1.4, color: "#8F3F16", fontStyle: "italic", overflowWrap: "anywhere" }}>
                        {ver.moreInfoNotes}
                      </div>
                    </div>
                  )}

                  {/* Divider, then actions */}
                  <div style={{ borderTop: "1px solid #EFE9DA", paddingTop: "14px", marginTop: "4px" }}>
                    {isUserMissing ? (
                      <div style={{ fontSize: "12.5px", color: "#6B6254", fontStyle: "italic" }}>
                        User no longer exists. Actions disabled.
                      </div>
                    ) : rejected ? (
                      <div style={{ fontSize: "13px", color: "#A3321F", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                        <XCircle size={15} /> Rejected — Applicant must submit a new verification request to be reviewed again.
                      </div>
                    ) : verified ? (
                      <div style={{ fontSize: "13px", color: "#2F6B45", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                        <CheckCircle size={15} /> Verification Approved
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {/* Approve verification full width 48px */}
                        <button
                          type="button"
                          disabled={actionLoadingId === (ver._id || ver.id)}
                          onClick={() => handleApprove(ver)}
                          style={{
                            width: "100%",
                            height: "48px",
                            borderRadius: "8px",
                            border: "none",
                            background: "#8A6B2E",
                            color: "#FFFFFF",
                            fontSize: "14px",
                            fontWeight: 700,
                            cursor: actionLoadingId === (ver._id || ver.id) ? "not-allowed" : "pointer",
                            opacity: actionLoadingId === (ver._id || ver.id) ? 0.7 : 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            boxShadow: "0 2px 4px rgba(138, 107, 46, 0.2)",
                          }}
                        >
                          {actionLoadingId === (ver._id || ver.id) ? (
                            <>
                              <Loader2 size={16} className="animate-spin" /> Approving...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={16} /> Approve verification
                            </>
                          )}
                        </button>

                        {/* 2-column grid (1.5fr / 1fr, gap 10px) */}
                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "10px" }}>
                          <button
                            type="button"
                            onClick={() => setActionModal({ type: "request_info", verification: ver })}
                            style={{
                              height: "44px",
                              padding: "0 8px",
                              borderRadius: "8px",
                              border: "1px solid #CDBF9E",
                              background: "#FFFFFF",
                              color: "#5E471B",
                              fontSize: "13px",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                            }}
                          >
                            <HelpCircle size={15} /> Request more info
                          </button>

                          <button
                            type="button"
                            onClick={() => setActionModal({ type: "reject", verification: ver })}
                            style={{
                              height: "44px",
                              padding: "0 8px",
                              borderRadius: "8px",
                              border: "1px solid #E8C5BD",
                              background: "#FFFFFF",
                              color: "#A3321F",
                              fontSize: "13px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                            }}
                          >
                            <XCircle size={15} /> Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E8E1D2",
              borderRadius: "16px",
              padding: "36px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#F3ECDC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#8A6B2E",
                marginBottom: "4px",
              }}
            >
              <ShieldCheck size={28} />
            </div>
            <h3
              style={{
                margin: 0,
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "20px",
                fontWeight: 600,
                color: "#2A241A",
                lineHeight: 1.3,
              }}
            >
              Nothing in this queue
            </h3>
            <p style={{ margin: 0, fontSize: "14px", color: "#6B6254", maxWidth: "280px", lineHeight: 1.45 }}>
              There are no verification items in this view matching your filters.
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-verif-desktop-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .admin-verif-mobile-layout {
          display: none;
        }
        .admin-verif-chip-row {
          display: flex;
          flex-wrap: nowrap;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          margin: 0 -16px;
          padding: 0 16px;
          -webkit-overflow-scrolling: touch;
        }
        .admin-verif-chip-row::-webkit-scrollbar {
          display: none;
        }

        @media (max-width: 767px) {
          .admin-verif-desktop-layout {
            display: none !important;
          }
          .admin-verif-mobile-layout {
            display: flex !important;
            flex-direction: column;
            gap: 16px;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          }
        }

        @media (max-width: 400px) {
          .admin-verif-chip-row {
            margin: 0 -12px;
            padding: 0 12px;
          }
        }
      `}</style>

      {/* Action Notes Modal */}
      {actionModal && (
        <ReasonModal
          isOpen={!!actionModal}
          onClose={() => setActionModal(null)}
          onSubmit={handleActionSubmit}
          title={actionModal.type === "reject" ? "Reject Verification" : "Request Additional Evidence"}
          subtitle={
            actionModal.type === "reject"
              ? "Provide a mandatory reason for rejecting this verification request."
              : "Specify what additional document, clearer selfie, or credit reference is required."
          }
          inputLabel={actionModal.type === "reject" ? "Rejection Reason *" : "Information Required *"}
          inputPlaceholder={
            actionModal.type === "reject"
              ? "E.g. Document expired or unreadable."
              : "E.g. Please provide a government ID where full legal name matches profile."
          }
          submitText={actionModal.type === "reject" ? "Confirm Rejection" : "Send Information Request"}
          isDestructive={actionModal.type === "reject"}
        />
      )}
    </div>
  );
}
