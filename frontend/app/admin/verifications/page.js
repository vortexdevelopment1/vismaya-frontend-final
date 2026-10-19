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
  const [activeTab, setActiveTab] = useState("all");
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { type: 'reject' | 'request_info', verification }
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    if (isRealMode("admin")) {
      try {
        setLoading(true);
        const res = await adminService.getPendingVerifications();
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
          status: "pending",
          documentType: "Aadhaar / Passport",
          documentUrl: "https://example.com/doc-aadhaar.pdf",
          selfieUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
          submittedAt: new Date().toISOString(),
        },
        {
          _id: "ver-mock-2",
          id: "ver-mock-2",
          userId: "usr-2",
          userName: "Ananya Roy",
          verificationType: "professional",
          status: "pending",
          documentType: "IMDb / Credit Contract",
          documentUrl: "https://example.com/credit-proof.pdf",
          portfolioEvidence: "Lead actor in released series 'Shadows in the Mist' (2024)",
          submittedAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const identityCount = verifications.filter((v) => v.verificationType === "identity").length;
  const professionalCount = verifications.filter((v) => v.verificationType === "professional").length;
  const businessCount = verifications.filter((v) => v.verificationType === "organization_business" || v.verificationType === "business").length;

  const tabs = [
    { key: "all", label: "All Queues", count: verifications.length },
    { key: "identity", label: "Identity (Doc + Selfie)", count: identityCount },
    { key: "professional", label: "Professional (Credits + Evidence)", count: professionalCount },
    { key: "organization_business", label: "Business (CIN / GST)", count: businessCount },
  ];

  const filteredVerifications = verifications.filter((v) => {
    if (activeTab === "all") return true;
    if (activeTab === "organization_business") {
      return v.verificationType === "organization_business" || v.verificationType === "business";
    }
    return v.verificationType === activeTab;
  });

  const handleApprove = async (ver) => {
    const id = ver._id || ver.id;
    if (isRealMode("admin")) {
      try {
        await adminService.reviewVerification(id, { status: "verified", notes: "Approved by Admin" });
        setVerifications((prev) => prev.filter((v) => (v._id || v.id) !== id));
        showToast(`Verification for ${ver.userName || "user"} approved successfully.`);
      } catch (err) {
        showToast(err?.message || "Failed to approve verification");
      }
    } else {
      setVerifications((prev) => prev.filter((v) => (v._id || v.id) !== id));
      showToast(`Verification for ${ver.userName || "user"} approved (Mock).`);
    }
  };

  const handleActionSubmit = async (notes) => {
    if (!actionModal) return;
    const { type, verification } = actionModal;
    const id = verification._id || verification.id;
    const status = type === "reject" ? "rejected" : "request_more_info";

    if (isRealMode("admin")) {
      try {
        await adminService.reviewVerification(id, { status, notes });
        setVerifications((prev) => prev.filter((v) => (v._id || v.id) !== id));
        showToast(type === "reject" ? "Verification rejected." : "Information request sent to talent.");
      } catch (err) {
        showToast(err?.message || "Failed to update verification");
      }
    } else {
      setVerifications((prev) => prev.filter((v) => (v._id || v.id) !== id));
      showToast(type === "reject" ? "Verification rejected (Mock)." : "Request more info sent (Mock).");
    }
    setActionModal(null);
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
        badge={`${verifications.length} Awaiting Action`}
      />

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Queue Content */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <Loader2 size={32} style={{ color: "#8A6B2E", animation: "spin 1s linear infinite" }} />
        </div>
      ) : filteredVerifications.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredVerifications.map((ver) => {
            const isIdentity = ver.verificationType === "identity";
            const isBusiness = ver.verificationType === "organization_business" || ver.verificationType === "business";
            const queueLabel = isIdentity
              ? "Identity Verification"
              : isBusiness
              ? "Corporate / Business Verification"
              : "Professional Credits Verification";

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
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#2B2D2A" }}>
                        {ver.userName || (isBusiness ? "Organization" : "Talent Member")}
                      </h3>
                      <span style={{ fontSize: "12.5px", color: "#5A584F" }}>
                        Queue: <strong style={{ color: isIdentity ? "#2B5E3B" : "#8A6B2E" }}>{queueLabel}</strong> · Submitted {new Date(ver.submittedAt || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>

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
                </div>

                {/* Evidence Details */}
                <div style={{ background: "#FAF9F7", border: "1px solid #F0EEEA", borderRadius: "10px", padding: "14px 16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#8A6B2E", textTransform: "uppercase", marginBottom: "4px" }}>
                      Submitted Document Proof
                    </div>
                    <div style={{ fontSize: "13px", color: "#2B2D2A", fontWeight: 600 }}>
                      {ver.documentType || "Official Verification Document"}
                    </div>
                    {ver.documentUrl && (
                      <a
                        href={ver.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#8A6B2E", marginTop: "4px", textDecoration: "none", fontWeight: 600 }}
                      >
                        <ExternalLink size={12} /> Inspect Uploaded Document
                      </a>
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
                </div>

                {/* Action Controls: Approve, Request More Info, Reject */}
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap", paddingTop: "8px", borderTop: "1px solid #F0EEEA" }}>
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
                    onClick={() => handleApprove(ver)}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#2B5E3B",
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <CheckCircle size={14} /> Approve Verification
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={ShieldCheck}
          title="No Verifications Awaiting Review"
          description="All identity and professional credit verification requests are up to date."
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
              : "Specify what additional document, clearer selfie, or credit reference is required from the talent."
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
