"use client";

import React, { useState } from "react";
import {
  CreditCard,
  DollarSign,
  Plus,
  Download,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useAdmin } from "@/lib/admin/AdminContext";
import PageHeader from "@/components/shared/PageHeader";
import Tabs from "@/components/shared/Tabs";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import StatCard from "@/components/shared/StatCard";
import PaymentEntryModal from "@/components/admin/PaymentEntryModal";

export default function AdminPaymentsPage() {
  const {
    payments,
    addPaymentEntry,
    updatePaymentEntry,
    deletePaymentEntry,
    subscriptions,
    updateSubscriptionStatus,
    addToast,
  } = useAdmin();

  const [activeSection, setActiveSection] = useState("ledger"); // "ledger" | "subscriptions"
  const [activeStatusTab, setActiveStatusTab] = useState("all");
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Live Calculated Financial Metrics
  const totalGrossReceived = payments
    .filter((p) => p.status === "Received" || p.status === "Paid Out")
    .reduce((acc, p) => acc + (p.grossAmount || 0), 0);

  const totalCommission = payments.reduce((acc, p) => acc + (p.commissionAmount || 0), 0);

  const totalTalentPayouts = payments
    .filter((p) => p.status === "Paid Out")
    .reduce((acc, p) => acc + (p.talentPayout || 0), 0);

  const pendingPayouts = payments
    .filter((p) => p.status === "Payout Pending")
    .reduce((acc, p) => acc + (p.talentPayout || 0), 0);

  // Status Filter Tabs
  const receivedCount = payments.filter((p) => p.status === "Received").length;
  const pendingCount = payments.filter((p) => p.status === "Payout Pending").length;
  const paidOutCount = payments.filter((p) => p.status === "Paid Out").length;

  const statusTabs = [
    { key: "all", label: "All Transactions", count: payments.length },
    { key: "Received", label: "Received", count: receivedCount },
    { key: "Payout Pending", label: "Payout Pending", count: pendingCount },
    { key: "Paid Out", label: "Paid Out", count: paidOutCount },
  ];

  const filteredPayments = payments.filter((p) => {
    if (activeStatusTab === "all") return true;
    return p.status === activeStatusTab;
  });

  const handleExportCSV = () => {
    addToast({
      type: "success",
      title: "Ledger Export Generated",
      message: `Exported vismaya_payment_ledger_${new Date().getFullYear()}.csv (${payments.length} records).`,
    });
  };

  const handleOpenEdit = (payment) => {
    setEditingPayment(payment);
    setIsEntryModalOpen(true);
  };

  const handleFormSubmit = (data) => {
    if (editingPayment) {
      updatePaymentEntry(editingPayment.id, data);
    } else {
      addPaymentEntry(data);
    }
    setEditingPayment(null);
  };

  const handleDeleteConfirm = (id) => {
    deletePaymentEntry(id);
    setDeleteConfirmId(null);
  };

  // Payment Table Columns
  const paymentColumns = [
    {
      key: "projectTitle",
      label: "Project & Payer",
      render: (val, row) => (
        <div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#2B2D2A", fontFamily: "var(--font-heading), 'Playfair Display', serif" }}>
            {val}
          </div>
          <div style={{ fontSize: "13px", color: "#5A584F", marginTop: "2px", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
            Payer: {row.payerName} ({row.payer})
          </div>
        </div>
      ),
    },
    {
      key: "grossAmount",
      label: "Gross Amount",
      render: (val) => (
        <span style={{ fontSize: "15px", fontWeight: 600, color: "#2B2D2A", fontVariantNumeric: "tabular-nums" }}>
          ₹{(val || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "commissionAmount",
      label: "Commission",
      render: (val, row) => (
        <div>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#8A6B2E", fontVariantNumeric: "tabular-nums" }}>
            ₹{(val || 0).toLocaleString()}
          </span>
          <div style={{ fontSize: "12px", color: "#5A584F" }}>
            ({row.commissionPercent || 15}%)
          </div>
        </div>
      ),
    },
    {
      key: "talentPayout",
      label: "Talent Payout",
      render: (val, row) => (
        <div>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#2B2D2A", fontVariantNumeric: "tabular-nums" }}>
            ₹{(val || 0).toLocaleString()}
          </span>
          {row.talentName && (
            <div style={{ fontSize: "12px", color: "#5A584F" }}>
              To: {row.talentName}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "paymentDate",
      label: "Date & Mode",
      render: (val, row) => (
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>{val}</div>
          <div style={{ fontSize: "12px", color: "#5A584F" }}>{row.paymentMode}</div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (val) => <StatusBadge status={val} size="xs" />,
    },
    {
      key: "referenceNote",
      label: "Reference",
      render: (val) => (
        <span
          style={{
            fontSize: "12px",
            color: "#5A584F",
            maxWidth: "160px",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: "monospace",
          }}
          title={val}
        >
          {val || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
          <button
            onClick={() => handleOpenEdit(row)}
            title="Edit Entry"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E2D4",
              color: "#8A6B2E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.16s ease",
            }}
            className="action-icon-btn"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => setDeleteConfirmId(row.id)}
            title="Delete Entry"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              color: "#B42318",
              border: "1px solid rgba(180, 35, 24, 0.35)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.16s ease",
            }}
            className="action-delete-btn"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  // Subscriptions Table Columns
  const subscriptionColumns = [
    {
      key: "name",
      label: "User / Organization",
      render: (val, row) => (
        <div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#2B2D2A", fontFamily: "var(--font-heading), 'Playfair Display', serif" }}>
            {val}
          </div>
          <div style={{ fontSize: "13px", color: "#5A584F" }}>
            Type: {row.userType}
          </div>
        </div>
      ),
    },
    {
      key: "plan",
      label: "Membership Plan",
      render: (val) => (
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: "999px",
            backgroundColor: "rgba(201, 165, 92, 0.16)",
            color: "#6E5420",
            border: "1px solid rgba(201, 165, 92, 0.25)",
          }}
        >
          {val}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Annual / Monthly Fee",
      render: (val) => (
        <span style={{ fontSize: "14px", fontWeight: 600, color: "#2B2D2A" }}>
          {val}
        </span>
      ),
    },
    {
      key: "expiryDate",
      label: "Expiry Date",
      render: (val) => (
        <span style={{ fontSize: "13px", color: "#5A584F" }}>
          {val}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (val) => <StatusBadge status={val} size="xs" />,
    },
    {
      key: "actions",
      label: "Admin Controls",
      render: (_, row) => (
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          {row.status !== "Paid" && (
            <button
              onClick={() => updateSubscriptionStatus(row.id, "Paid")}
              style={{
                height: "36px",
                padding: "0 14px",
                fontSize: "13px",
                fontWeight: 600,
                borderRadius: "8px",
                backgroundColor: "#8A6B2E",
                color: "#FFFFFF",
                border: "1px solid #8A6B2E",
                cursor: "pointer",
              }}
            >
              Mark Paid
            </button>
          )}
          {row.status === "Paid" && (
            <button
              onClick={() => updateSubscriptionStatus(row.id, "Due")}
              style={{
                height: "36px",
                padding: "0 14px",
                fontSize: "13px",
                fontWeight: 600,
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                color: "#8A6B2E",
                border: "1px solid #8A6B2E",
                cursor: "pointer",
              }}
            >
              Set Due
            </button>
          )}
        </div>
      ),
    },
  ];

  // Mobile Card Renderers
  const renderPaymentMobileCard = (row) => (
    <div className="admin-payment-mobile-card">
      <div className="admin-payment-card-top">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="admin-payment-amount">
            ₹{(row.grossAmount || 0).toLocaleString()}
          </div>
          <div className="admin-payment-project">
            {row.projectTitle}
          </div>
        </div>
        <StatusBadge status={row.status} size="xs" />
      </div>

      <div className="admin-payment-meta-line">
        <span className="admin-payment-meta-label">Payer:</span> {row.payerName} ({row.payer})
      </div>

      <div className="admin-payment-details-grid">
        <div className="admin-payment-detail-item">
          <span className="admin-payment-detail-label">Commission ({row.commissionPercent || 15}%)</span>
          <span className="admin-payment-detail-val" style={{ color: "#8A6B2E" }}>
            ₹{(row.commissionAmount || 0).toLocaleString()}
          </span>
        </div>
        <div className="admin-payment-detail-item">
          <span className="admin-payment-detail-label">Talent Payout</span>
          <span className="admin-payment-detail-val">
            ₹{(row.talentPayout || 0).toLocaleString()}
          </span>
        </div>
        <div className="admin-payment-detail-item">
          <span className="admin-payment-detail-label">Date & Mode</span>
          <span className="admin-payment-detail-val">
            {row.paymentDate} • {row.paymentMode}
          </span>
        </div>
        <div className="admin-payment-detail-item">
          <span className="admin-payment-detail-label">Reference</span>
          <span className="admin-payment-detail-val admin-payment-mono" title={row.referenceNote}>
            {row.referenceNote || "—"}
          </span>
        </div>
      </div>

      <div className="admin-payment-card-actions">
        <button
          onClick={() => handleOpenEdit(row)}
          className="admin-payment-action-btn"
        >
          <Edit size={14} /> Edit Entry
        </button>
        <button
          onClick={() => setDeleteConfirmId(row.id)}
          className="admin-payment-delete-btn"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );

  const renderSubscriptionMobileCard = (row) => (
    <div className="admin-payment-mobile-card">
      <div className="admin-payment-card-top">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="admin-sub-name">{row.name}</div>
          <div className="admin-sub-type">Type: {row.userType}</div>
        </div>
        <StatusBadge status={row.status} size="xs" />
      </div>

      <div className="admin-payment-details-grid">
        <div className="admin-payment-detail-item">
          <span className="admin-payment-detail-label">Membership Plan</span>
          <span className="admin-sub-plan-pill">{row.plan}</span>
        </div>
        <div className="admin-payment-detail-item">
          <span className="admin-payment-detail-label">Fee</span>
          <span className="admin-payment-detail-val">{row.amount}</span>
        </div>
        <div className="admin-payment-detail-item" style={{ gridColumn: "span 2" }}>
          <span className="admin-payment-detail-label">Expiry Date</span>
          <span className="admin-payment-detail-val">{row.expiryDate}</span>
        </div>
      </div>

      <div className="admin-payment-card-actions">
        {row.status !== "Paid" ? (
          <button
            onClick={() => updateSubscriptionStatus(row.id, "Paid")}
            className="admin-sub-action-btn admin-sub-paid-btn"
          >
            Mark Paid
          </button>
        ) : (
          <button
            onClick={() => updateSubscriptionStatus(row.id, "Due")}
            className="admin-sub-action-btn admin-sub-due-btn"
          >
            Set Due
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }} className="admin-payments-container">
      {/* Page Header */}
      <PageHeader
        title="Escrow & Financial Ledger"
        subtitle="Manual financial ledger for logging recruiter client retainers, commission splits, talent bank payouts, and platform subscriptions."
        badge="Manual Accounting Ledger"
        action={
          <div className="admin-payments-header-actions" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={handleExportCSV}
              style={{
                height: "42px",
                padding: "0 18px",
                fontSize: "13.5px",
                fontWeight: 600,
                gap: "6px",
                borderRadius: "10px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #8A6B2E",
                color: "#8A6B2E",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                transition: "all 0.16s ease",
              }}
              className="export-btn"
            >
              <Download size={15} /> Export CSV
            </button>

            <button
              onClick={() => {
                setEditingPayment(null);
                setIsEntryModalOpen(true);
              }}
              style={{
                height: "42px",
                padding: "0 20px",
                fontSize: "13.5px",
                fontWeight: 600,
                gap: "6px",
                borderRadius: "10px",
                backgroundColor: "#8A6B2E",
                color: "#FFFFFF",
                border: "1px solid #8A6B2E",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                boxShadow: "0 2px 8px rgba(138, 107, 46, 0.22)",
                transition: "all 0.16s ease",
              }}
              className="add-entry-btn"
            >
              <Plus size={16} /> Add Payment Entry
            </button>
          </div>
        }
      />

      {/* 4 Financial Stat Cards - Numbers all charcoal/gold-brown */}
      <div
        className="admin-stat-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
          alignItems: "stretch",
        }}
      >
        <StatCard
          title="Total Received"
          value={`₹${totalGrossReceived.toLocaleString()}`}
          change="Gross Invoices"
          isPositive={true}
          description="Total client payments logged"
          icon={CreditCard}
        />
        <StatCard
          title="Total Commission"
          value={`₹${totalCommission.toLocaleString()}`}
          change="Platform Net"
          isPositive={true}
          description="Vismaya retained commission"
          icon={DollarSign}
        />
        <StatCard
          title="Talent Payouts"
          value={`₹${totalTalentPayouts.toLocaleString()}`}
          change="Disbursed"
          isPositive={true}
          description="Net payouts transferred to artists"
          icon={CheckCircle2}
        />
        <StatCard
          title="Pending Payouts"
          value={`₹${pendingPayouts.toLocaleString()}`}
          change="Action required"
          isPositive={pendingPayouts === 0}
          description="Awaiting shoot wrap confirmation"
          icon={Clock}
        />
      </div>

      {/* Two-Level Tabs: Top level segmented control */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div
          className="admin-payments-section-tabs"
          style={{
            display: "inline-flex",
            backgroundColor: "#F3EFE6",
            border: "1px solid #E8E2D4",
            borderRadius: "12px",
            padding: "4px",
            gap: "4px",
            width: "fit-content",
            maxWidth: "100%",
            overflowX: "auto",
          }}
        >
          <button
            onClick={() => setActiveSection("ledger")}
            style={{
              padding: "8px 18px",
              borderRadius: "10px",
              backgroundColor: activeSection === "ledger" ? "#FFFFFF" : "transparent",
              color: activeSection === "ledger" ? "#8A6B2E" : "#5A584F",
              border: `1px solid ${activeSection === "ledger" ? "#E8E2D4" : "transparent"}`,
              boxShadow: activeSection === "ledger" ? "0 1px 3px rgba(43, 45, 42, 0.06)" : "none",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.16s ease",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
            }}
          >
            Production Invoices &amp; Payouts ({payments.length})
          </button>

          <button
            onClick={() => setActiveSection("subscriptions")}
            style={{
              padding: "8px 18px",
              borderRadius: "10px",
              backgroundColor: activeSection === "subscriptions" ? "#FFFFFF" : "transparent",
              color: activeSection === "subscriptions" ? "#8A6B2E" : "#5A584F",
              border: `1px solid ${activeSection === "subscriptions" ? "#E8E2D4" : "transparent"}`,
              boxShadow: activeSection === "subscriptions" ? "0 1px 3px rgba(43, 45, 42, 0.06)" : "none",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.16s ease",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
            }}
          >
            Subscriptions &amp; Membership Fees ({subscriptions.length})
          </button>
        </div>

        {/* SECTION 1: Production Ledger Table */}
        {activeSection === "ledger" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Lower-level Pill Tabs */}
            <Tabs tabs={statusTabs} activeTab={activeStatusTab} onChange={setActiveStatusTab} />

            <DataTable
              title={`Transaction Ledger (${filteredPayments.length})`}
              columns={paymentColumns}
              data={filteredPayments}
              searchable={true}
              searchPlaceholder="Search project, payer, reference..."
              pageSize={6}
              emptyTitle="No payment records found"
              emptyDescription="There are no payment entries matching the selected status filter."
              renderMobileCard={renderPaymentMobileCard}
            />
          </div>
        )}

        {/* SECTION 2: Subscriptions Table */}
        {activeSection === "subscriptions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <DataTable
              title={`Corporate & Artist Subscription Plans (${subscriptions.length})`}
              columns={subscriptionColumns}
              data={subscriptions}
              searchable={true}
              searchPlaceholder="Search by name, plan, type..."
              pageSize={6}
              emptyTitle="No subscription records found"
              emptyDescription="No subscriptions listed."
              renderMobileCard={renderSubscriptionMobileCard}
            />
          </div>
        )}
      </div>

      {/* Add / Edit Payment Modal */}
      {isEntryModalOpen && (
        <PaymentEntryModal
          isOpen={isEntryModalOpen}
          onClose={() => {
            setIsEntryModalOpen(false);
            setEditingPayment(null);
          }}
          initialData={editingPayment}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          className="admin-delete-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(43, 45, 42, 0.45)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 110,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="admin-delete-modal-content"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E2D4",
              borderRadius: "20px",
              padding: "26px",
              maxWidth: "460px",
              width: "100%",
              boxShadow: "0 20px 48px rgba(43, 45, 42, 0.16)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(180, 35, 24, 0.08)",
                  color: "#B42318",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(180, 35, 24, 0.25)",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#2B2D2A", margin: 0, fontFamily: "var(--font-heading), 'Playfair Display', serif" }}>
                  Delete Payment Record?
                </h3>
                <p style={{ fontSize: "14px", color: "#5A584F", margin: "4px 0 0 0", lineHeight: 1.5, fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
                  This will remove the transaction from the offline ledger and update summary totals.
                </p>
              </div>
            </div>

            <div className="admin-delete-modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  padding: "0 18px",
                  height: "40px",
                  fontSize: "14px",
                  fontWeight: 600,
                  borderRadius: "10px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8E2D4",
                  color: "#5A584F",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirm(deleteConfirmId)}
                style={{
                  padding: "0 20px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "#FFFFFF",
                  color: "#B42318",
                  border: "1px solid rgba(180, 35, 24, 0.35)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.16s ease",
                }}
                className="action-delete-btn"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .action-icon-btn:hover {
          background-color: #F3EFE6 !important;
        }
        .action-delete-btn:hover {
          background-color: rgba(180, 35, 24, 0.08) !important;
        }
        .export-btn:hover {
          background-color: #F3EFE6 !important;
        }
        .add-entry-btn:hover {
          background-color: #6E5420 !important;
        }

        @media (max-width: 640px) {
          .admin-payments-container {
            gap: 16px !important;
          }
          .admin-payments-header-actions {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            width: 100% !important;
            gap: 8px !important;
          }
          .admin-payments-header-actions button {
            width: 100% !important;
            justify-content: center !important;
            font-size: 12.5px !important;
            padding: 0 10px !important;
            height: 40px !important;
          }
          .admin-payments-section-tabs {
            width: 100% !important;
            display: flex !important;
          }
          .admin-payments-section-tabs button {
            flex: 1 1 50% !important;
            padding: 8px 6px !important;
            font-size: 11.5px !important;
            text-align: center !important;
            white-space: normal !important;
            line-height: 1.25 !important;
            min-height: 38px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          /* Mobile Cards for Ledger */
          .admin-payment-mobile-card {
            background: #FFFFFF;
            border: 1px solid #E8E2D4;
            border-radius: 14px;
            padding: 14px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            box-shadow: 0 4px 14px rgba(43, 45, 42, 0.04);
            box-sizing: border-box;
            width: 100%;
          }
          .admin-payment-card-top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 10px;
          }
          .admin-payment-amount {
            font-family: var(--font-heading), 'Playfair Display', Georgia, serif;
            font-size: 18px;
            font-weight: 700;
            color: "#2B2D2A";
            line-height: 1.2;
          }
          .admin-payment-project {
            font-size: 13.5px;
            font-weight: 600;
            color: #2B2D2A;
            margin-top: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .admin-payment-meta-line {
            font-size: 12px;
            color: #5A584F;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .admin-payment-meta-label {
            font-weight: 600;
            color: #2B2D2A;
          }
          .admin-payment-details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            background: #FAF9F7;
            border: 1px solid #E8E2D4;
            border-radius: 10px;
            padding: 10px;
          }
          .admin-payment-detail-item {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
          }
          .admin-payment-detail-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #5A584F;
            font-weight: 600;
          }
          .admin-payment-detail-val {
            font-size: 12.5px;
            font-weight: 600;
            color: #2B2D2A;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .admin-payment-mono {
            font-family: monospace;
            font-size: 11.5px;
          }
          .admin-payment-card-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-top: 2px;
          }
          .admin-payment-action-btn {
            height: 36px;
            border-radius: 8px;
            background-color: #FFFFFF;
            border: 1px solid #E8E2D4;
            color: #8A6B2E;
            font-size: 12px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            cursor: pointer;
          }
          .admin-payment-delete-btn {
            height: 36px;
            border-radius: 8px;
            background-color: #FFFFFF;
            border: 1px solid rgba(180, 35, 24, 0.35);
            color: #B42318;
            font-size: 12px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            cursor: pointer;
          }

          /* Subscriptions Mobile Card */
          .admin-sub-name {
            font-family: var(--font-heading), 'Playfair Display', Georgia, serif;
            font-size: 16px;
            font-weight: 600;
            color: #2B2D2A;
            line-height: 1.2;
          }
          .admin-sub-type {
            font-size: 12px;
            color: #5A584F;
            margin-top: 2px;
          }
          .admin-sub-plan-pill {
            display: inline-block;
            font-size: 11px;
            font-weight: 600;
            color: #6E5420;
            background: rgba(201, 165, 92, 0.16);
            border: 1px solid rgba(201, 165, 92, 0.25);
            padding: 2px 8px;
            border-radius: 999px;
            width: fit-content;
          }
          .admin-sub-action-btn {
            grid-column: span 2;
            height: 36px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
          }
          .admin-sub-paid-btn {
            background-color: #8A6B2E;
            color: #FFFFFF;
            border: 1px solid #8A6B2E;
          }
          .admin-sub-due-btn {
            background-color: #FFFFFF;
            color: #8A6B2E;
            border: 1px solid #8A6B2E;
          }

          /* Delete Modal */
          .admin-delete-modal-overlay {
            padding: 16px !important;
            align-items: flex-end !important;
          }
          .admin-delete-modal-content {
            border-radius: 16px 16px 0 0 !important;
            padding: 20px 16px !important;
            max-width: 100vw !important;
          }
          .admin-delete-modal-footer {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
          .admin-delete-modal-footer button {
            width: 100% !important;
            height: 42px !important;
            font-size: 13px !important;
          }
        }
      `}</style>
    </div>
  );
}
