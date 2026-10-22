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
        showToast(`Verification for ${ver.userName || "user"} approved (Mock).`);
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
      showToast(type === "reject" ? "Verification rejected (Mock)." : "Request more info sent (Mock).");
      setActionModal(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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

      {/* Page Header */}
      <PageHeader
        title="Department-Specific Verification Queues"
        subtitle="Review identity submissions (Government ID + Live Selfie) and professional credentials (Credits + Portfolio Evidence) per Spec §40 & §44."
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
