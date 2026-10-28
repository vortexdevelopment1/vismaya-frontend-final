"use client";

import React, { useState, useEffect } from "react";
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
  FileText,
  X,
  Filter,
  Users,
  Building2,
  Sparkles,
} from "lucide-react";
import { useAdmin } from "@/lib/admin/AdminContext";
import PageHeader from "@/components/shared/PageHeader";
import Tabs from "@/components/shared/Tabs";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import StatCard from "@/components/shared/StatCard";
import PaymentEntryModal from "@/components/admin/PaymentEntryModal";
import { paymentService } from "@/lib/api/services/paymentService";

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

  const [activeSection, setActiveSection] = useState("platform"); // "platform" | "ledger" | "subscriptions"
  const [platformTransactions, setPlatformTransactions] = useState([]);
  const [platformStatusTab, setPlatformStatusTab] = useState("all");
  const [platformTypeFilter, setPlatformTypeFilter] = useState("all");
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const [activeStatusTab, setActiveStatusTab] = useState("all");
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Load platform transactions
  useEffect(() => {
    async function loadTransactions() {
      try {
        const txs = await paymentService.getAdminTransactions();
        if (Array.isArray(txs)) {
          setPlatformTransactions(txs);
        } else if (txs && Array.isArray(txs.transactions)) {
          setPlatformTransactions(txs.transactions);
        } else {
          setPlatformTransactions([]);
        }
      } catch (err) {
        console.error("Error loading platform transactions:", err);
        setPlatformTransactions([]);
      }
    }
    loadTransactions();
  }, []);

  // Safe array references to prevent runtime TypeError: .filter is not a function
  const safePlatformTransactions = Array.isArray(platformTransactions)
    ? platformTransactions
    : (Array.isArray(platformTransactions?.transactions) ? platformTransactions.transactions : []);

  const safePayments = Array.isArray(payments) ? payments : [];
  const safeSubscriptions = Array.isArray(subscriptions) ? subscriptions : [];

  // Platform Metrics
  const totalPlatformRevenue = safePlatformTransactions
    .filter((tx) => tx.status === "Successful")
    .reduce((acc, tx) => acc + (tx.amount || 0), 0);
  const totalTalentRegistrations = safePlatformTransactions.filter(
    (tx) => tx.type === "talent_registration" && tx.status === "Successful"
  ).length;
  const totalOrgRegistrations = safePlatformTransactions.filter(
    (tx) => tx.type === "organization_registration" && tx.status === "Successful"
  ).length;
  const totalViewPurchases = safePlatformTransactions.filter(
    (tx) => (tx.type === "bundle_views" || tx.type === "single_view") && tx.status === "Successful"
  ).length;

  const platformSuccessfulCount = safePlatformTransactions.filter((tx) => tx.status === "Successful").length;
  const platformFailedCount = safePlatformTransactions.filter((tx) => tx.status === "Failed").length;
  const platformPendingCount = safePlatformTransactions.filter((tx) => tx.status === "Pending").length;

  const platformStatusTabs = [
    { key: "all", label: "All Platform Fees", count: safePlatformTransactions.length },
    { key: "Successful", label: "Successful", count: platformSuccessfulCount },
    { key: "Failed", label: "Failed", count: platformFailedCount },
    { key: "Pending", label: "Pending", count: platformPendingCount },
  ];

  const filteredPlatformTransactions = safePlatformTransactions.filter((tx) => {
    if (platformStatusTab !== "all" && tx.status !== platformStatusTab) return false;
    if (platformTypeFilter !== "all" && tx.type !== platformTypeFilter) return false;
    return true;
  });

  // Live Calculated Financial Metrics
  const totalGrossReceived = safePayments
    .filter((p) => p.status === "Received" || p.status === "Paid Out")
    .reduce((acc, p) => acc + (p.grossAmount || 0), 0);

  const totalCommission = safePayments.reduce((acc, p) => acc + (p.commissionAmount || 0), 0);

  const totalTalentPayouts = safePayments
    .filter((p) => p.status === "Paid Out")
    .reduce((acc, p) => acc + (p.talentPayout || 0), 0);

  const pendingPayouts = safePayments
    .filter((p) => p.status === "Payout Pending")
    .reduce((acc, p) => acc + (p.talentPayout || 0), 0);

  // Status Filter Tabs
  const receivedCount = safePayments.filter((p) => p.status === "Received").length;
  const pendingCount = safePayments.filter((p) => p.status === "Payout Pending").length;
  const paidOutCount = safePayments.filter((p) => p.status === "Paid Out").length;

  const statusTabs = [
    { key: "all", label: "All Transactions", count: safePayments.length },
    { key: "Received", label: "Received", count: receivedCount },
    { key: "Payout Pending", label: "Payout Pending", count: pendingCount },
    { key: "Paid Out", label: "Paid Out", count: paidOutCount },
  ];

  const filteredPayments = safePayments.filter((p) => {
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

  // Platform Fee Transactions Columns
  const platformColumns = [
    {
      key: "userName",
      label: "User / Account",
      render: (val, row) => (
        <div>
          <div style={{ fontSize: "14.5px", fontWeight: 600, color: "#2B2D2A", fontFamily: "var(--font-heading), 'Playfair Display', serif" }}>
            {val || "—"}
          </div>
          <div style={{ fontSize: "12.5px", color: "#5A584F", marginTop: "2px", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
            {row.userEmail || "—"}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      label: "Fee / Service Type",
      render: (val, row) => {
        let label = row.typeLabel || val;
        if (val === "talent_registration") {
          label = "Talent Registration (₹999)";
        } else if (val === "organization_registration") {
          label = "Industry Registration (₹4,999)";
        } else if (val === "bundle_views") {
          label = "25 Profile Views (₹2,000)";
        } else if (val === "single_view") {
          label = "Single Profile View (₹100)";
        }
        return (
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: "999px",
              backgroundColor: "#F3EFE6",
              color: "#6E5420",
              border: "1px solid #E8E2D4",
              display: "inline-block",
            }}
          >
            {label}
          </span>
        );
      },
    },
    {
      key: "amount",
      label: "Amount (INR)",
      render: (val) => (
        <span style={{ fontSize: "15px", fontWeight: 700, color: "#2B2D2A", fontVariantNumeric: "tabular-nums" }}>
          ₹{(val || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      label: "Payment Status",
      render: (val) => (
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: "6px",
            backgroundColor: val === "Successful" ? "#F3EFE6" : "rgba(180, 35, 24, 0.08)",
            color: val === "Successful" ? "#8A6B2E" : "#B42318",
            border: `1px solid ${val === "Successful" ? "#E8E2D4" : "rgba(180, 35, 24, 0.25)"}`,
            display: "inline-block",
          }}
        >
          {val}
        </span>
      ),
    },
    {
      key: "date",
      label: "Transaction Date",
      render: (val) => (
        <span style={{ fontSize: "13px", color: "#5A584F" }}>
          {val || "—"}
        </span>
      ),
    },
    {
      key: "invoiceNumber",
      label: "Invoice & Receipt",
      render: (val, row) => (
        <div>
          <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#2B2D2A", fontFamily: "monospace" }}>
            {val || "Pending"}
          </div>
          <div style={{ fontSize: "11px", color: row.status === "Successful" ? "#8A6B2E" : "#B42318" }}>
            {row.status === "Successful" ? "Digital Receipt Sent" : "Payment Pending"}
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Receipt",
      render: (_, row) => (
        <button
          onClick={() => setSelectedReceipt(row)}
          title="View Digital Invoice"
          style={{
            height: "32px",
            padding: "0 12px",
            borderRadius: "6px",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            color: "#8A6B2E",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.16s ease",
          }}
          className="action-icon-btn"
        >
          <FileText size={13} /> View Invoice
        </button>
      ),
    },
  ];

  const renderPlatformMobileCard = (row) => (
    <div className="admin-payment-mobile-card">
      <div className="admin-payment-card-top">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="admin-payment-amount">
            ₹{(row.amount || 0).toLocaleString()}
          </div>
          <div className="admin-payment-project">
            {row.userName || "User"}
          </div>
        </div>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: "6px",
            backgroundColor: row.status === "Successful" ? "#F3EFE6" : "rgba(180, 35, 24, 0.08)",
            color: row.status === "Successful" ? "#8A6B2E" : "#B42318",
            border: `1px solid ${row.status === "Successful" ? "#E8E2D4" : "rgba(180, 35, 24, 0.25)"}`,
          }}
        >
          {row.status}
        </span>
      </div>

      <div className="admin-payment-meta-line">
        <span className="admin-payment-meta-label">Email:</span> {row.userEmail || "—"}
      </div>

      <div className="admin-payment-details-grid">
        <div className="admin-payment-detail-item">
          <span className="admin-payment-detail-label">Type</span>
          <span className="admin-payment-detail-val" style={{ color: "#8A6B2E" }}>
            {row.typeLabel || row.type}
          </span>
        </div>
        <div className="admin-payment-detail-item">
          <span className="admin-payment-detail-label">Invoice</span>
          <span className="admin-payment-detail-val admin-payment-mono">
            {row.invoiceNumber || "Pending"}
          </span>
        </div>
        <div className="admin-payment-detail-item">
          <span className="admin-payment-detail-label">Date</span>
          <span className="admin-payment-detail-val">
            {row.date}
          </span>
        </div>
        <div className="admin-payment-detail-item">
          <span className="admin-payment-detail-label">Gateway</span>
          <span className="admin-payment-detail-val">
            {row.paymentGateway || "Razorpay"}
          </span>
        </div>
      </div>

      <div className="admin-payment-card-actions">
        <button
          onClick={() => setSelectedReceipt(row)}
          className="admin-payment-action-btn"
          style={{ gridColumn: "span 2" }}
        >
          <FileText size={14} /> View Digital Invoice
        </button>
      </div>
    </div>
  );

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
          {row.commissionPercent != null ? (
            <div style={{ fontSize: "12px", color: "#5A584F" }}>
              ({row.commissionPercent}%)
            </div>
          ) : null}
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
          <span className="admin-payment-detail-label">Commission {row.commissionPercent != null ? `(${row.commissionPercent}%)` : ""}</span>
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

      {/* Financial Stat Cards */}
      <div
        className="admin-stat-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
          alignItems: "stretch",
        }}
      >
        {activeSection === "platform" ? (
          <>
            <StatCard
              title="Platform Fee Revenue"
              value={`₹${totalPlatformRevenue.toLocaleString()}`}
              change="Total Collections"
              isPositive={true}
              description="One-time registrations and view top-ups"
              icon={CreditCard}
            />
            <StatCard
              title="Talent Registrations"
              value={totalTalentRegistrations}
              change="₹999 fee paid"
              isPositive={true}
              description="Verified paid talent profiles"
              icon={Users}
            />
            <StatCard
              title="Industry Registrations"
              value={totalOrgRegistrations}
              change="₹4,999 fee paid"
              isPositive={true}
              description="Studios with 100 included views"
              icon={Building2}
            />
            <StatCard
              title="Profile Views & Bundles"
              value={totalViewPurchases}
              change="Top-ups purchased"
              isPositive={true}
              description="Extra bundle (25) & single views"
              icon={Sparkles}
            />
          </>
        ) : (
          <>
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
          </>
        )}
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
            onClick={() => setActiveSection("platform")}
            style={{
              padding: "8px 18px",
              borderRadius: "10px",
              backgroundColor: activeSection === "platform" ? "#FFFFFF" : "transparent",
              color: activeSection === "platform" ? "#8A6B2E" : "#5A584F",
              border: `1px solid ${activeSection === "platform" ? "#E8E2D4" : "transparent"}`,
              boxShadow: activeSection === "platform" ? "0 1px 3px rgba(43, 45, 42, 0.06)" : "none",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.16s ease",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
            }}
          >
            Platform Registration &amp; Views ({safePlatformTransactions.length})
          </button>

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
            Production Invoices &amp; Payouts ({safePayments.length})
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
            Subscriptions &amp; Membership Fees ({safeSubscriptions.length})
          </button>
        </div>

        {/* SECTION 0: Platform Fees & Registrations Table */}
        {activeSection === "platform" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
              {/* Lower-level Status Tabs */}
              <Tabs tabs={platformStatusTabs} activeTab={platformStatusTab} onChange={setPlatformStatusTab} />

              {/* Type Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#5A584F" }}>Filter Type:</span>
                <select
                  value={platformTypeFilter}
                  onChange={(e) => setPlatformTypeFilter(e.target.value)}
                  style={{
                    height: "36px",
                    padding: "0 12px",
                    borderRadius: "8px",
                    border: "1px solid #E8E2D4",
                    backgroundColor: "#FFFFFF",
                    fontSize: "13px",
                    color: "#2B2D2A",
                    fontFamily: "var(--font-body), 'Inter', sans-serif",
                    cursor: "pointer",
                  }}
                >
                  <option value="all">All Service Types</option>
                  <option value="talent_registration">Talent Registration (₹999)</option>
                  <option value="organization_registration">Industry Registration (₹4,999)</option>
                  <option value="bundle_views">25 Profile Views (₹2,000)</option>
                  <option value="single_view">Single Profile View (₹100)</option>
                </select>
              </div>
            </div>

            <DataTable
              title={`Platform Registration & Fee Transactions (${filteredPlatformTransactions.length})`}
              columns={platformColumns}
              data={filteredPlatformTransactions}
              searchable={true}
              searchPlaceholder="Search by user, email, invoice #..."
              pageSize={6}
              emptyTitle="No platform transactions found"
              emptyDescription="There are no payment entries matching the selected filter."
              renderMobileCard={renderPlatformMobileCard}
            />
          </div>
        )}

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
              title={`Corporate & Artist Subscription Plans (${safeSubscriptions.length})`}
              columns={subscriptionColumns}
              data={safeSubscriptions}
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

      {/* Platform Digital Invoice / Receipt Modal */}
      {selectedReceipt && (
        <div
          className="admin-receipt-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(43, 45, 42, 0.55)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 120,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="admin-receipt-modal-content"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E2D4",
              borderRadius: "20px",
              padding: "28px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 24px 60px rgba(43, 45, 42, 0.18)",
              position: "relative",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", borderBottom: "1px solid #E8E2D4", paddingBottom: "16px" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#F3EFE6", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, color: "#8A6B2E", marginBottom: "6px" }}>
                  <FileText size={12} /> OFFICIAL TAX RECEIPT
                </div>
                <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#2B2D2A", margin: 0, fontFamily: "var(--font-heading), 'Playfair Display', serif" }}>
                  Receipt {selectedReceipt.invoiceNumber ? `#${selectedReceipt.invoiceNumber}` : ""}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                style={{
                  background: "#FAF9F7",
                  border: "1px solid #E8E2D4",
                  borderRadius: "8px",
                  padding: "6px",
                  cursor: "pointer",
                  color: "#5A584F",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Receipt Body */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13.5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#5A584F" }}>
                <span>Date &amp; Time:</span>
                <span style={{ fontWeight: 600, color: "#2B2D2A" }}>{selectedReceipt.paidAt || selectedReceipt.date}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#5A584F" }}>
                <span>Payer Name:</span>
                <span style={{ fontWeight: 600, color: "#2B2D2A" }}>{selectedReceipt.userName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#5A584F" }}>
                <span>Payer Email:</span>
                <span style={{ fontWeight: 600, color: "#2B2D2A" }}>{selectedReceipt.userEmail}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#5A584F" }}>
                <span>Payment Mode:</span>
                <span style={{ fontWeight: 600, color: "#2B2D2A" }}>{selectedReceipt.paymentGateway || "Online (UPI / Cards / NetBanking)"}</span>
              </div>

              <div style={{ borderTop: "1px dashed #E8E2D4", margin: "8px 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", color: "#5A584F" }}>
                <span>Description:</span>
                <span style={{ fontWeight: 600, color: "#2B2D2A" }}>{selectedReceipt.typeLabel || selectedReceipt.type}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#5A584F" }}>
                <span>Base Amount:</span>
                <span style={{ fontWeight: 600, color: "#2B2D2A" }}>₹{selectedReceipt.amount?.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#5A584F" }}>
                <span>Tax / GST:</span>
                <span style={{ fontWeight: 500, color: "#5A584F" }}>Included in pricing</span>
              </div>

              <div style={{ backgroundColor: "#FAF9F7", border: "1px solid #E8E2D4", borderRadius: "10px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#2B2D2A" }}>Total Paid (INR):</span>
                <span style={{ fontSize: "18px", fontWeight: 700, color: "#8A6B2E", fontFamily: "var(--font-heading), 'Playfair Display', serif" }}>
                  ₹{selectedReceipt.amount?.toLocaleString()}
                </span>
              </div>

              <div style={{ fontSize: "12px", color: "#5A584F", textAlign: "center", marginTop: "8px" }}>
                We do not store card details. This digital receipt was generated and confirmation dispatched to {selectedReceipt.userEmail}.
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={() => {
                  if (typeof window !== "undefined") window.print();
                }}
                style={{
                  height: "40px",
                  padding: "0 16px",
                  borderRadius: "10px",
                  backgroundColor: "#FAF9F7",
                  border: "1px solid #E8E2D4",
                  color: "#2B2D2A",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Download size={14} /> Print / Save
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                style={{
                  height: "40px",
                  padding: "0 20px",
                  borderRadius: "10px",
                  backgroundColor: "#8A6B2E",
                  border: "1px solid #8A6B2E",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close
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

          /* Receipt Modal Mobile */
          .admin-receipt-modal-overlay {
            padding: 16px !important;
            align-items: flex-end !important;
          }
          .admin-receipt-modal-content {
            border-radius: 16px 16px 0 0 !important;
            padding: 20px 16px !important;
            max-width: 100vw !important;
          }
        }
      `}</style>
    </div>
  );
}
