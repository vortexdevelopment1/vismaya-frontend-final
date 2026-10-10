"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  DollarSign,
  Building2,
  User,
  Calendar,
  FileText,
  CheckCircle,
  Plus,
  Sparkles,
} from "lucide-react";

export default function PaymentEntryModal({
  isOpen,
  onClose,
  initialData = null,
  onSubmit,
}) {
  const [formData, setFormData] = useState({
    projectTitle: "",
    payer: "Recruiter",
    payerName: "",
    talentName: "",
    grossAmount: 100000,
    commissionModel: "Charged to Recruiter (15%)",
    commissionPercent: 15,
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMode: "Bank Transfer",
    referenceNote: "",
    status: "Received",
    notes: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        projectTitle: initialData.projectTitle || "",
        payer: initialData.payer || "Recruiter",
        payerName: initialData.payerName || "",
        talentName: initialData.talentName || "",
        grossAmount: initialData.grossAmount || 100000,
        commissionModel: initialData.commissionModel || "Charged to Recruiter (15%)",
        commissionPercent: initialData.commissionPercent || 15,
        paymentDate: initialData.paymentDate || new Date().toISOString().split("T")[0],
        paymentMode: initialData.paymentMode || "Bank Transfer",
        referenceNote: initialData.referenceNote || "",
        status: initialData.status || "Received",
        notes: initialData.notes || "",
      });
    }
  }, [initialData]);

  if (!isOpen) return null;

  const gross = Number(formData.grossAmount) || 0;
  const commPct = Number(formData.commissionPercent) || 0;
  const commAmt = Math.round((gross * commPct) / 100);
  const netPayout = gross - commAmt;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.projectTitle || !formData.payerName) {
      alert("Please fill in the project title and payer name.");
      return;
    }

    onSubmit({
      ...formData,
      grossAmount: gross,
      commissionPercent: commPct,
      commissionAmount: commAmt,
      talentPayout: netPayout,
    });
    onClose();
  };

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

      {/* Modal Box */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "640px",
          maxWidth: "95vw",
          maxHeight: "90vh",
          backgroundColor: "#121a2b",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          borderRadius: "20px",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.7)",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
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
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "rgba(15, 22, 38, 0.8)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "rgba(255, 188, 0, 0.12)",
                color: "var(--gold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255, 188, 0, 0.30)",
              }}
            >
              <CreditCard size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#eceaf5", margin: 0 }}>
                {initialData ? "Edit Payment Entry" : "Log Offline Payment / Retainer"}
              </h2>
              <p style={{ fontSize: "0.75rem", color: "#a3acc2", margin: "2px 0 0 0" }}>
                Manual accounting ledger for client invoices and artist payouts.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              padding: "8px",
              borderRadius: "10px",
              color: "#a3acc2",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#eceaf5", marginBottom: "4px" }}>
                Project / Casting Call Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mumbai Diaries Season 2"
                value={formData.projectTitle}
                onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#eceaf5",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#eceaf5", marginBottom: "4px" }}>
                Payer Entity
              </label>
              <select
                value={formData.payer}
                onChange={(e) => setFormData({ ...formData, payer: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  backgroundColor: "#0f1626",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#eceaf5",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              >
                <option value="Recruiter" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Recruiter / Client</option>
                <option value="Talent" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Talent / Artist</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#eceaf5", marginBottom: "4px" }}>
                Payer Name / Company *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Zee Films (Vikram Malhotra)"
                value={formData.payerName}
                onChange={(e) => setFormData({ ...formData, payerName: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#eceaf5",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#eceaf5", marginBottom: "4px" }}>
                Target Talent / Artist Name
              </label>
              <input
                type="text"
                placeholder="e.g. Riya Sharma"
                value={formData.talentName}
                onChange={(e) => setFormData({ ...formData, talentName: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#eceaf5",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Financial Breakdown Card */}
          <div
            style={{
              padding: "16px",
              borderRadius: "16px",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.10)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--gold)" }}>
              Financial Calculations
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#a3acc2", marginBottom: "4px" }}>
                  Gross Invoice Amount (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={formData.grossAmount}
                  onChange={(e) => setFormData({ ...formData, grossAmount: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#eceaf5",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#a3acc2", marginBottom: "4px" }}>
                  Commission (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.commissionPercent}
                  onChange={(e) => setFormData({ ...formData, commissionPercent: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#eceaf5",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Live Auto-Calculated Output Chips */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "2px" }}>
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(10, 15, 25, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div style={{ fontSize: "0.7rem", color: "#a3acc2" }}>Platform Commission:</div>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--gold)", marginTop: "2px" }}>
                  ₹{commAmt.toLocaleString()}
                </div>
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(10, 15, 25, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div style={{ fontSize: "0.7rem", color: "#a3acc2" }}>Talent Net Payout:</div>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--status-green)", marginTop: "2px" }}>
                  ₹{netPayout.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#eceaf5", marginBottom: "4px" }}>
                Payment Date
              </label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#eceaf5",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#eceaf5", marginBottom: "4px" }}>
                Payment Mode
              </label>
              <select
                value={formData.paymentMode}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  backgroundColor: "#0f1626",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#eceaf5",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              >
                <option value="Bank Transfer" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>UPI</option>
                <option value="Cash" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Cash</option>
                <option value="Cheque" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Cheque</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#eceaf5", marginBottom: "4px" }}>
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  backgroundColor: "#0f1626",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#eceaf5",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              >
                <option value="Received" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Received</option>
                <option value="Payout Pending" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Payout Pending</option>
                <option value="Paid Out" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Paid Out</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#eceaf5", marginBottom: "4px" }}>
              Reference / UTR Note
            </label>
            <input
              type="text"
              placeholder="e.g. UTR: HDFC882910392, Advance Retainer for Lead Medical Roles"
              value={formData.referenceNote}
              onChange={(e) => setFormData({ ...formData, referenceNote: e.target.value })}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#eceaf5",
                fontSize: "0.85rem",
                outline: "none",
              }}
            />
          </div>

          {/* Footer Submit */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{
                padding: "8px 18px",
                fontSize: "0.85rem",
                borderRadius: "12px",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{
                padding: "8px 20px",
                fontSize: "0.85rem",
                borderRadius: "12px",
              }}
            >
              {initialData ? "Update Payment Entry" : "Save Payment Entry"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
