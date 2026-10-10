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
  Building2,
  User,
  Calendar,
  Layers,
  Sparkles,
  AlertTriangle,
  FileSpreadsheet,
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
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {val}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Payer: {row.payerName} ({row.payer})
          </div>
        </div>
      ),
    },
    {
      key: "grossAmount",
      label: "Gross Amount",
      render: (val) => (
        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
          ₹{(val || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "commissionAmount",
      label: "Commission",
      render: (val, row) => (
        <div>
          <span style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--accent)" }}>
            ₹{(val || 0).toLocaleString()}
          </span>
          <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
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
          <span style={{ fontSize: "0.825rem", fontWeight: 700, color: "#34d399" }}>
            ₹{(val || 0).toLocaleString()}
          </span>
          {row.talentName && (
            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
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
          <div style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--text-primary)" }}>{val}</div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{row.paymentMode}</div>
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
        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", maxWidth: "160px", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={val}>
          {val || "-"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={() => handleOpenEdit(row)}
            title="Edit Entry"
            className="btn-primary"
            style={{
              padding: "5px 9px",
              fontSize: "0.75rem",
              borderRadius: "8px",
            }}
          >
            <Edit size={12} />
          </button>
          <button
            onClick={() => setDeleteConfirmId(row.id)}
            title="Delete Entry"
            style={{
              padding: "5px 8px",
              borderRadius: "8px",
              backgroundColor: "rgba(255, 107, 107, 0.15)",
              color: "#ff6b6b",
              border: "1px solid rgba(255, 107, 107, 0.35)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Trash2 size={12} />
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
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {val}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
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
            fontSize: "0.75rem",
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: "999px",
            backgroundColor: "rgba(255, 188, 0, 0.14)",
            color: "#ffbc00",
            border: "1px solid rgba(255, 188, 0, 0.3)",
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
        <span style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--text-primary)" }}>
          {val}
        </span>
      ),
    },
    {
      key: "expiryDate",
      label: "Expiry Date",
      render: (val) => (
        <span style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
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
        <div style={{ display: "flex", gap: "6px" }}>
          {row.status !== "Paid" && (
            <button
              onClick={() => updateSubscriptionStatus(row.id, "Paid")}
              className="btn-primary"
              style={{
                padding: "4px 12px",
                fontSize: "0.75rem",
                borderRadius: "8px",
              }}
            >
              Mark Paid
            </button>
          )}
          {row.status === "Paid" && (
            <button
              onClick={() => updateSubscriptionStatus(row.id, "Due")}
              className="btn-secondary"
              style={{
                padding: "4px 12px",
                fontSize: "0.75rem",
                borderRadius: "8px",
              }}
            >
              Set Due
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Page Header */}
      <PageHeader
        title="Offline Payments & Manual Accounting"
        subtitle="Manual financial ledger for logging recruiter client retainers, commission splits, talent bank payouts, and platform subscriptions. (No payment gateway)."
        badge="Manual Accounting Ledger"
        action={
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleExportCSV}
              className="btn-secondary"
              style={{
                padding: "8px 14px",
                fontSize: "0.825rem",
                gap: "5px",
                borderRadius: "12px",
              }}
            >
              <Download size={14} /> Export CSV
            </button>

            <button
              onClick={() => {
                setEditingPayment(null);
                setIsEntryModalOpen(true);
              }}
              className="btn-primary"
              style={{
                padding: "8px 16px",
                fontSize: "0.825rem",
                gap: "5px",
                borderRadius: "12px",
              }}
            >
              <Plus size={15} /> Add Payment Entry
            </button>
          </div>
        }
      />

      {/* 4 Financial Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
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

      {/* Main Mode Switcher: Payment Ledger vs Subscriptions & Fees */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "10px" }}>
        <button
          onClick={() => setActiveSection("ledger")}
          style={{
            padding: "8px 16px",
            borderRadius: "12px",
            backgroundColor: activeSection === "ledger" ? "#ffbc00" : "rgba(255, 255, 255, 0.06)",
            color: activeSection === "ledger" ? "#1a1300" : "#a3acc2",
            border: `1px solid ${activeSection === "ledger" ? "#ffbc00" : "rgba(255, 255, 255, 0.14)"}`,
            fontSize: "0.825rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          Production Invoices & Payouts ({payments.length})
        </button>

        <button
          onClick={() => setActiveSection("subscriptions")}
          style={{
            padding: "8px 16px",
            borderRadius: "12px",
            backgroundColor: activeSection === "subscriptions" ? "#ffbc00" : "rgba(255, 255, 255, 0.06)",
            color: activeSection === "subscriptions" ? "#1a1300" : "#a3acc2",
            border: `1px solid ${activeSection === "subscriptions" ? "#ffbc00" : "rgba(255, 255, 255, 0.14)"}`,
            fontSize: "0.825rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          Subscriptions & Membership Fees ({subscriptions.length})
        </button>
      </div>

      {/* SECTION 1: Production Ledger Table */}
      {activeSection === "ledger" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Status Tabs */}
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
          />
        </div>
      )}

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
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(7, 11, 18, 0.75)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            zIndex: 110,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#121a2b",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: "20px",
              padding: "24px",
              maxWidth: "440px",
              width: "100%",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 107, 107, 0.15)",
                  color: "#ff6b6b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(255, 107, 107, 0.35)",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  Delete Payment Record?
                </h3>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "2px 0 0 0", lineHeight: 1.35 }}>
                  This will remove the transaction from the offline ledger and update summary totals.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="btn-secondary"
                style={{
                  padding: "7px 16px",
                  fontSize: "0.825rem",
                  borderRadius: "12px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirm(deleteConfirmId)}
                style={{
                  padding: "7px 18px",
                  borderRadius: "12px",
                  backgroundColor: "#ff6b6b",
                  color: "#fff",
                  border: "none",
                  fontSize: "0.825rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
