"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Minus,
  Sparkles,
  Search,
  Building2,
  AlertTriangle,
  CheckCircle2,
  ArrowUpDown,
  History,
  FileText,
  Clock,
  Filter,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import Modal from "@/components/shared/Modal";
import StatusBadge from "@/components/shared/StatusBadge";
import { paymentService } from "@/lib/api/services/paymentService";
import { PRICING_CONFIG } from "@/lib/config/pricing";

export default function AdminCreditsPage() {
  const [activeTab, setActiveTab] = useState("studios"); // 'studios' | 'ledger'
  const [orgSummaries, setOrgSummaries] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Adjust Balance Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState("org-1");
  const [adjustAmount, setAdjustAmount] = useState(25);
  const [isDeduct, setIsDeduct] = useState(false);
  const [adjustReason, setAdjustReason] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const loadData = async () => {
    const res = await paymentService.getAdminCredits();
    if (res) {
      const summaries = res.orgSummaries || [];
      setOrgSummaries(summaries);
      setLedger(res.ledger || []);
      if (summaries.length > 0 && (!selectedOrgId || selectedOrgId === "org-1")) {
        setSelectedOrgId(summaries[0].orgId);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustReason.trim()) {
      showToast("Please provide an internal audit reason for adjustment.");
      return;
    }

    const finalChange = isDeduct ? -Math.abs(Number(adjustAmount)) : Math.abs(Number(adjustAmount));
    const res = await paymentService.adjustCredits(selectedOrgId, finalChange, adjustReason);

    if (res.success) {
      showToast(res.message);
      setIsAdjustModalOpen(false);
      setAdjustReason("");
      loadData();
    }
  };

  // Metrics
  const totalBalance = orgSummaries.reduce((acc, o) => acc + (o.currentBalance || 0), 0);
  const totalConsumed = orgSummaries.reduce((acc, o) => acc + (o.consumedCredits || 0), 0);
  const totalPurchased = orgSummaries.reduce((acc, o) => acc + (o.purchasedCredits || 0), 0);
  const lowBalanceCount = orgSummaries.filter((o) => o.currentBalance < PRICING_CONFIG.LOW_BALANCE).length;

  // Filtered Ledger
  const filteredLedger = ledger.filter((l) => {
    const orgNameText = (l.orgName || l.organization?.organizationName || "").toLowerCase();
    const notesText = (l.notes || l.description || "").toLowerCase();
    const refText = (l.reference || l._id || "").toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      orgNameText.includes(search) ||
      notesText.includes(search) ||
      refText.includes(search);

    if (!matchesSearch) return false;
    if (typeFilter === "all") return true;

    if (l.type === typeFilter) return true;
    if (typeFilter === "included" && (l.type === "included" || l.type === "registration_included")) return true;
    if (typeFilter === "purchased" && (l.type === "purchased" || l.type === "bundle_purchase" || l.type === "single_purchase")) return true;
    if (typeFilter === "consumed" && (l.type === "consumed" || l.type === "profile_view_deduction")) return true;
    if (typeFilter === "adjusted" && (l.type === "adjusted" || l.type === "admin_adjustment")) return true;
    if (typeFilter === "registration_included" && (l.type === "included" || l.type === "registration_included")) return true;
    if ((typeFilter === "bundle_purchase" || typeFilter === "single_purchase") && (l.type === "purchased" || l.type === typeFilter)) return true;
    if (typeFilter === "profile_view_deduction" && (l.type === "consumed" || l.type === "profile_view_deduction")) return true;
    if (typeFilter === "admin_adjustment" && (l.type === "adjusted" || l.type === "admin_adjustment")) return true;
    return false;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
      {/* Page Header */}
      <PageHeader
        title="Organization Credits & Ledger"
        subtitle="Manage studio profile-view credits, review 7-day repeat consumption audit logs, and manually adjust balances."
        badge="Platform Administration"
        action={
          <button
            type="button"
            onClick={() => {
              if (orgSummaries.length > 0 && (!selectedOrgId || selectedOrgId === "org-1")) {
                setSelectedOrgId(orgSummaries[0].orgId);
              }
              setIsDeduct(false);
              setAdjustAmount(25);
              setAdjustReason("");
              setIsAdjustModalOpen(true);
            }}
            className="btn-primary"
            style={{
              fontSize: "13px",
              fontWeight: "600",
              height: "38px",
              padding: "0 18px",
              gap: "6px",
              borderRadius: "8px",
            }}
          >
            <Plus size={15} />
            <span>Adjust Balance</span>
          </button>
        }
      />

      {/* Toast Feedback */}
      {toastMessage && (
        <div
          style={{
            backgroundColor: "#F3EFE6",
            border: "1px solid #E8E2D4",
            borderRadius: "8px",
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#8A6B2E",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "16px",
        }}
      >
        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E8E2D4", borderRadius: "12px", padding: "18px" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "#5A584F", letterSpacing: "0.06em" }}>
            Total Credits in Circulation
          </div>
          <div style={{ fontFamily: "var(--font-heading), Georgia, serif", fontSize: "32px", fontWeight: "700", color: "#8A6B2E", margin: "4px 0" }}>
            {totalBalance}
          </div>
          <div style={{ fontSize: "12px", color: "#5A584F" }}>Across {orgSummaries.length} accredited studios</div>
        </div>

        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E8E2D4", borderRadius: "12px", padding: "18px" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "#5A584F", letterSpacing: "0.06em" }}>
            Total Profiles Unlocked
          </div>
          <div style={{ fontFamily: "var(--font-heading), Georgia, serif", fontSize: "32px", fontWeight: "700", color: "#2B2D2A", margin: "4px 0" }}>
            {totalConsumed}
          </div>
          <div style={{ fontSize: "12px", color: "#5A584F" }}>Candidate profiles reviewed</div>
        </div>

        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E8E2D4", borderRadius: "12px", padding: "18px" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "#5A584F", letterSpacing: "0.06em" }}>
            Total Purchased Views
          </div>
          <div style={{ fontFamily: "var(--font-heading), Georgia, serif", fontSize: "32px", fontWeight: "700", color: "#2B2D2A", margin: "4px 0" }}>
            {totalPurchased}
          </div>
          <div style={{ fontSize: "12px", color: "#5A584F" }}>Bulk packs and single views</div>
        </div>

        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E8E2D4", borderRadius: "12px", padding: "18px" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "#5A584F", letterSpacing: "0.06em" }}>
            Low Balance Studios
          </div>
          <div style={{ fontFamily: "var(--font-heading), Georgia, serif", fontSize: "32px", fontWeight: "700", color: lowBalanceCount > 0 ? "#8A6B2E" : "#2B2D2A", margin: "4px 0" }}>
            {lowBalanceCount}
          </div>
          <div style={{ fontSize: "12px", color: "#5A584F" }}>Studios with &lt; 10 views left</div>
        </div>
      </div>

      {/* Section Switcher Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #E8E2D4", paddingBottom: "12px" }}>
        <button
          type="button"
          onClick={() => setActiveTab("studios")}
          style={{
            padding: "8px 18px",
            borderRadius: "6px",
            border: activeTab === "studios" ? "1px solid #8A6B2E" : "1px solid transparent",
            backgroundColor: activeTab === "studios" ? "#F3EFE6" : "transparent",
            color: activeTab === "studios" ? "#8A6B2E" : "#5A584F",
            fontSize: "13.5px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Studio Balances ({orgSummaries.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ledger")}
          style={{
            padding: "8px 18px",
            borderRadius: "6px",
            border: activeTab === "ledger" ? "1px solid #8A6B2E" : "1px solid transparent",
            backgroundColor: activeTab === "ledger" ? "#F3EFE6" : "transparent",
            color: activeTab === "ledger" ? "#8A6B2E" : "#5A584F",
            fontSize: "13.5px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Credit Ledger &amp; Audit Log ({ledger.length})
        </button>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: STUDIO BALANCES TABLE                          */}
      {/* ========================================================= */}
      {activeTab === "studios" && (
        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E8E2D4", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(43,45,42,0.02)" }}>
          <h3 style={{ fontSize: "17px", fontWeight: "600", color: "#2B2D2A", margin: "0 0 16px" }}>
            Organization Credit Accounts
          </h3>

          {/* Desktop Table View */}
          <div className="admin-credits-desktop-table" style={{ width: "100%", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E8E2D4", textAlign: "left", color: "#5A584F" }}>
                  <th style={{ padding: "12px 14px" }}>Organization</th>
                  <th style={{ padding: "12px 14px" }}>Contact</th>
                  <th style={{ padding: "12px 14px" }}>Included</th>
                  <th style={{ padding: "12px 14px" }}>Purchased</th>
                  <th style={{ padding: "12px 14px" }}>Consumed</th>
                  <th style={{ padding: "12px 14px" }}>Current Balance</th>
                  <th style={{ padding: "12px 14px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orgSummaries.map((org) => (
                  <tr key={org.orgId} style={{ borderBottom: "1px solid #E8E2D4" }}>
                    <td style={{ padding: "14px" }}>
                      <div style={{ fontWeight: "600", color: "#2B2D2A" }}>{org.orgName}</div>
                    </td>
                    <td style={{ padding: "14px" }}>
                      <div>{org.contactPerson}</div>
                      <div style={{ fontSize: "12px", color: "#5A584F" }}>{org.contactEmail}</div>
                    </td>
                    <td style={{ padding: "14px", color: "#5A584F" }}>{org.includedCredits}</td>
                    <td style={{ padding: "14px", color: "#5A584F" }}>+{org.purchasedCredits}</td>
                    <td style={{ padding: "14px", color: "#5A584F" }}>-{org.consumedCredits}</td>
                    <td style={{ padding: "14px" }}>
                      <span
                        style={{
                          fontWeight: "700",
                          fontSize: "15px",
                          color: org.currentBalance < PRICING_CONFIG.LOW_BALANCE ? "#C53030" : "#8A6B2E",
                        }}
                      >
                        {org.currentBalance} Credits
                      </span>
                      {org.currentBalance < PRICING_CONFIG.LOW_BALANCE && (
                        <div style={{ fontSize: "11px", color: "#C53030", fontWeight: "600" }}>LOW BALANCE</div>
                      )}
                    </td>
                    <td style={{ padding: "14px", textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrgId(org.orgId);
                          setIsDeduct(false);
                          setAdjustAmount(25);
                          setAdjustReason("");
                          setIsAdjustModalOpen(true);
                        }}
                        className="btn-secondary"
                        style={{ height: "34px", padding: "0 12px", fontSize: "12.5px", borderRadius: "6px" }}
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards */}
          <div className="admin-credits-mobile-cards" style={{ display: "none", flexDirection: "column", gap: "12px" }}>
            {orgSummaries.map((org) => (
              <div
                key={org.orgId}
                style={{
                  backgroundColor: "#FAF9F7",
                  border: "1px solid #E8E2D4",
                  borderRadius: "10px",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <strong style={{ fontSize: "14.5px", color: "#2B2D2A" }}>{org.orgName}</strong>
                    <div style={{ fontSize: "12px", color: "#5A584F" }}>{org.contactPerson} • {org.contactEmail}</div>
                  </div>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: "700",
                      color: org.currentBalance < PRICING_CONFIG.LOW_BALANCE ? "#C53030" : "#8A6B2E",
                    }}
                  >
                    {org.currentBalance} Credits
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#5A584F" }}>
                  <span>Included: {org.includedCredits}</span>
                  <span>Purchased: +{org.purchasedCredits}</span>
                  <span>Consumed: -{org.consumedCredits}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrgId(org.orgId);
                    setIsDeduct(false);
                    setAdjustAmount(25);
                    setAdjustReason("");
                    setIsAdjustModalOpen(true);
                  }}
                  className="btn-secondary"
                  style={{ width: "100%", height: "36px", fontSize: "12.5px", justifyContent: "center" }}
                >
                  Adjust Balance
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: CREDIT LEDGER AUDIT LOG                       */}
      {/* ========================================================= */}
      {activeTab === "ledger" && (
        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E8E2D4", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(43,45,42,0.02)" }}>
          {/* Filters & Search */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ position: "relative", minWidth: "240px", flex: 1 }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#5A584F" }} />
              <input
                type="text"
                placeholder="Search studio name, notes, reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%", height: "38px", paddingLeft: "36px", borderRadius: "6px", border: "1px solid #E8E2D4", fontSize: "13px" }}
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ height: "38px", padding: "0 12px", borderRadius: "6px", border: "1px solid #E8E2D4", fontSize: "13px" }}
            >
              <option value="all">All Movements</option>
              <option value="included">Included</option>
              <option value="purchased">Purchased</option>
              <option value="consumed">Consumed</option>
              <option value="adjusted">Adjusted</option>
              <option value="other">Other</option>
              <option value="registration_included">Registration Included (+100)</option>
              <option value="bundle_purchase">Bundle Purchases (+25)</option>
              <option value="single_purchase">Single Purchases (+1)</option>
              <option value="profile_view_deduction">Profile Views (-1)</option>
              <option value="admin_adjustment">Admin Adjustments</option>
            </select>
          </div>

          {/* Desktop Table View */}
          <div className="admin-credits-desktop-table" style={{ width: "100%", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E8E2D4", textAlign: "left", color: "#5A584F" }}>
                  <th style={{ padding: "12px" }}>Date</th>
                  <th style={{ padding: "12px" }}>Studio</th>
                  <th style={{ padding: "12px" }}>Transaction Type</th>
                  <th style={{ padding: "12px" }}>Change</th>
                  <th style={{ padding: "12px" }}>Balance After</th>
                  <th style={{ padding: "12px" }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedger.map((row) => (
                  <tr key={row.id || row._id} style={{ borderBottom: "1px solid #E8E2D4" }}>
                    <td style={{ padding: "12px", color: "#5A584F", whiteSpace: "nowrap" }}>
                      {row.date ? new Date(row.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                    </td>
                    <td style={{ padding: "12px", fontWeight: "600", color: "#2B2D2A" }}>
                      {row.orgName}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          backgroundColor: "#FAF9F7",
                          border: "1px solid #E8E2D4",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "11.5px",
                          color: "#5A584F",
                        }}
                      >
                        {row.typeLabel || row.type || "Other"}
                      </span>
                    </td>
                    <td style={{ padding: "12px", fontWeight: "700", color: (row.change || row.amount) > 0 ? "#8A6B2E" : "#C53030" }}>
                      {(row.change || row.amount) > 0 ? `+${row.change || row.amount}` : (row.change || row.amount || 0)}
                    </td>
                    <td style={{ padding: "12px", fontWeight: "600", color: "#2B2D2A" }}>
                      {row.balanceAfter}
                    </td>
                    <td style={{ padding: "12px", color: "#5A584F", fontSize: "12.5px" }}>
                      {row.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards */}
          <div className="admin-credits-mobile-cards" style={{ display: "none", flexDirection: "column", gap: "10px" }}>
            {filteredLedger.map((row) => (
              <div
                key={row.id || row._id}
                style={{
                  backgroundColor: "#FAF9F7",
                  border: "1px solid #E8E2D4",
                  borderRadius: "8px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "12.5px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ color: "#2B2D2A" }}>{row.orgName}</strong>
                  <span style={{ fontWeight: "700", color: (row.change || row.amount) > 0 ? "#8A6B2E" : "#C53030" }}>
                    {(row.change || row.amount) > 0 ? `+${row.change || row.amount}` : (row.change || row.amount || 0)}
                  </span>
                </div>
                <div style={{ color: "#5A584F" }}>{row.typeLabel || row.type || "Other"} • Balance After: {row.balanceAfter}</div>
                <div style={{ fontSize: "11.5px", color: "#777970" }}>{row.notes}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {isAdjustModalOpen && (
        <Modal
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          title="Manual Credit Balance Adjustment"
          subtitle="Audit-logged modification of organization profile-view credits"
          maxWidth="480px"
        >
          <form onSubmit={handleAdjustSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#2B2D2A", marginBottom: "6px", textTransform: "uppercase" }}>
                Target Organization
              </label>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                style={{ width: "100%", height: "40px", padding: "0 10px", borderRadius: "6px", border: "1px solid #E8E2D4" }}
              >
                {orgSummaries.map((org) => (
                  <option key={org.orgId} value={org.orgId}>
                    {org.orgName} (Current Balance: {org.currentBalance})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#2B2D2A", marginBottom: "6px", textTransform: "uppercase" }}>
                Action
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsDeduct(false)}
                  style={{
                    height: "38px",
                    borderRadius: "6px",
                    border: !isDeduct ? "1px solid #8A6B2E" : "1px solid #E8E2D4",
                    backgroundColor: !isDeduct ? "#F3EFE6" : "#FFFFFF",
                    color: !isDeduct ? "#8A6B2E" : "#5A584F",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  + Add Credits
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeduct(true)}
                  style={{
                    height: "38px",
                    borderRadius: "6px",
                    border: isDeduct ? "1px solid #C53030" : "1px solid #E8E2D4",
                    backgroundColor: isDeduct ? "#FFF5F5" : "#FFFFFF",
                    color: isDeduct ? "#C53030" : "#5A584F",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  - Deduct Credits
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#2B2D2A", marginBottom: "6px", textTransform: "uppercase" }}>
                Amount of Credits
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                required
                style={{ width: "100%", height: "40px", padding: "0 12px", borderRadius: "6px", border: "1px solid #E8E2D4" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#2B2D2A", marginBottom: "6px", textTransform: "uppercase" }}>
                Audit Reason &amp; Authorization Note <span style={{ color: "#C53030" }}>*</span>
              </label>
              <textarea
                rows={3}
                placeholder="E.g. Approved promotional pilot pack for organization Season 2 casting..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                required
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #E8E2D4", fontSize: "13px" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="btn-secondary"
                style={{ height: "40px", padding: "0 16px" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ height: "40px", padding: "0 20px" }}
              >
                <span>Confirm Adjustment</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      <style jsx>{`
        @media (max-width: 640px) {
          .admin-credits-desktop-table {
            display: none !important;
          }
          .admin-credits-mobile-cards {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
