"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
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
          backgroundColor: "rgba(43, 45, 42, 0.45)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
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
          width: "660px",
          maxWidth: "95vw",
          maxHeight: "90vh",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E2D4",
          borderRadius: "20px",
          boxShadow: "0 20px 48px rgba(43, 45, 42, 0.16)",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 26px",
            borderBottom: "1px solid #E8E2D4",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FFFFFF",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "#F3EFE6",
                color: "#8A6B2E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #E8E2D4",
              }}
            >
              <CreditCard size={20} />
            </div>
            <div>
              <h2 style={{ fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif", fontSize: "22px", fontWeight: 600, color: "#2B2D2A", margin: 0 }}>
                {initialData ? "Edit Payment Entry" : "Log Offline Payment / Retainer"}
              </h2>
              <p style={{ fontSize: "13px", color: "#5A584F", margin: "2px 0 0 0", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
                Manual accounting ledger for client invoices and artist payouts.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              padding: "6px",
              borderRadius: "8px",
              color: "#5A584F",
              backgroundColor: "#F3EFE6",
              border: "1px solid #E8E2D4",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "22px 26px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2D2A", marginBottom: "4px", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
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
                  height: "44px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #D9D2C0",
                  color: "#2B2D2A",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2D2A", marginBottom: "4px", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
                Payer Entity
              </label>
              <select
                value={formData.payer}
                onChange={(e) => setFormData({ ...formData, payer: e.target.value })}
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #D9D2C0",
                  color: "#2B2D2A",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                <option value="Recruiter">Recruiter / Client</option>
                <option value="Talent">Talent / Artist</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2D2A", marginBottom: "4px", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
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
                  height: "44px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #D9D2C0",
                  color: "#2B2D2A",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2D2A", marginBottom: "4px", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
                Target Talent / Artist Name
              </label>
              <input
                type="text"
                placeholder="e.g. Riya Sharma"
                value={formData.talentName}
                onChange={(e) => setFormData({ ...formData, talentName: e.target.value })}
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #D9D2C0",
                  color: "#2B2D2A",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Financial Breakdown Card */}
          <div
            style={{
              padding: "16px 18px",
              borderRadius: "14px",
              backgroundColor: "#F3EFE6",
              border: "1px solid #E8E2D4",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#6E5420", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Financial Calculations
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#5A584F", marginBottom: "4px" }}>
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
                    height: "44px",
                    padding: "0 14px",
                    borderRadius: "10px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #D9D2C0",
                    color: "#2B2D2A",
                    fontSize: "15px",
                    fontWeight: 600,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#5A584F", marginBottom: "4px" }}>
                  Commission Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.commissionPercent}
                  onChange={(e) => setFormData({ ...formData, commissionPercent: e.target.value })}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 14px",
                    borderRadius: "10px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #D9D2C0",
                    color: "#2B2D2A",
                    fontSize: "15px",
                    fontWeight: 600,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", paddingTop: "4px" }}>
              <div style={{ padding: "10px 14px", backgroundColor: "#FFFFFF", borderRadius: "10px", border: "1px solid #E8E2D4" }}>
                <span style={{ fontSize: "11px", color: "#5A584F", fontWeight: 700, textTransform: "uppercase" }}>Vismaya Retained (Platform):</span>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#8A6B2E", marginTop: "2px" }}>
                  ₹{commAmt.toLocaleString()}
                </div>
              </div>

              <div style={{ padding: "10px 14px", backgroundColor: "#FFFFFF", borderRadius: "10px", border: "1px solid #E8E2D4" }}>
                <span style={{ fontSize: "11px", color: "#5A584F", fontWeight: 700, textTransform: "uppercase" }}>Talent Bank Disbursed Payout:</span>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#2B2D2A", marginTop: "2px" }}>
                  ₹{netPayout.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2D2A", marginBottom: "4px" }}>
                Payment Date
              </label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #D9D2C0",
                  color: "#2B2D2A",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2D2A", marginBottom: "4px" }}>
                Payment Channel
              </label>
              <select
                value={formData.paymentMode}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #D9D2C0",
                  color: "#2B2D2A",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI / Digital</option>
                <option value="Cheque">Corporate Cheque</option>
                <option value="Cash / Escrow Slip">Manual Escrow Slip</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2D2A", marginBottom: "4px" }}>
                Ledger Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #D9D2C0",
                  color: "#2B2D2A",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                <option value="Received">Received / Cleared</option>
                <option value="Payout Pending">Payout Pending</option>
                <option value="Paid Out">Paid Out (Disbursed)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2B2D2A", marginBottom: "4px" }}>
              Reference # / Transaction UTR Note
            </label>
            <input
              type="text"
              placeholder="e.g. HDFC-NEFT-9021849182"
              value={formData.referenceNote}
              onChange={(e) => setFormData({ ...formData, referenceNote: e.target.value })}
              style={{
                width: "100%",
                height: "44px",
                padding: "0 14px",
                borderRadius: "10px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #D9D2C0",
                color: "#2B2D2A",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Footer Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0 18px",
                height: "42px",
                borderRadius: "10px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8E2D4",
                color: "#5A584F",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "0 22px",
                height: "42px",
                borderRadius: "10px",
                backgroundColor: "#8A6B2E",
                color: "#FFFFFF",
                border: "1px solid #8A6B2E",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(138, 107, 46, 0.2)",
              }}
            >
              {initialData ? "Save Changes" : "Log Ledger Entry"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
