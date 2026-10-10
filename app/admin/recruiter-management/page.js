"use client";

import React, { useState } from "react";
import {
  Building2,
  Eye,
  CheckCircle,
  XCircle,
  Ban,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  FolderKanban,
} from "lucide-react";
import { useAdmin } from "@/lib/admin/AdminContext";
import PageHeader from "@/components/shared/PageHeader";
import Tabs from "@/components/shared/Tabs";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import ReviewDrawer from "@/components/admin/ReviewDrawer";
import ReasonModal from "@/components/admin/ReasonModal";

export default function RecruiterManagementPage() {
  const {
    recruiters,
    verifyRecruiter,
    rejectRecruiter,
    suspendRecruiter,
    reactivateRecruiter,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState("all");
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [reasonModalConfig, setReasonModalConfig] = useState(null);

  // Status Tabs calculation
  const pendingCount = recruiters.filter((r) => r.status === "Pending").length;
  const verifiedCount = recruiters.filter((r) => r.status === "Verified").length;
  const rejectedCount = recruiters.filter((r) => r.status === "Rejected").length;
  const suspendedCount = recruiters.filter((r) => r.status === "Suspended").length;

  const tabs = [
    { key: "all", label: "All Organizations", count: recruiters.length },
    { key: "Pending", label: "Pending Verification", count: pendingCount },
    { key: "Verified", label: "Verified", count: verifiedCount },
    { key: "Rejected", label: "Rejected", count: rejectedCount },
    { key: "Suspended", label: "Suspended", count: suspendedCount },
  ];

  const filteredRecruiters = recruiters.filter((r) => {
    if (activeTab === "all") return true;
    return r.status === activeTab;
  });

  const handleOpenReview = (recruiter) => {
    setSelectedRecruiter(recruiter);
    setIsDrawerOpen(true);
  };

  const handleCloseReview = () => {
    setIsDrawerOpen(false);
    setSelectedRecruiter(null);
  };

  // Re-sync selected recruiter from context if updated while drawer is open
  const currentSelectedRecruiter = selectedRecruiter
    ? recruiters.find((r) => r.id === selectedRecruiter.id) || selectedRecruiter
    : null;

  const columns = [
    {
      key: "company",
      label: "Company / Production",
      minWidth: "260px",
      render: (val, row) => {
        const compName = row.company || row.companyName || "Organization";
        const subInfo = `ID: ${row.id} • ${row.gstNumber || row.registrationNumber || "GST Pending"}`;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, maxWidth: "260px" }}>
            <img
              src={row.avatar || "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&auto=format&fit=crop&q=80"}
              alt={compName}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                objectFit: "cover",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={compName}
              >
                {compName}
              </div>
              <div
                style={{
                  fontSize: "0.725rem",
                  color: "var(--text-secondary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={subInfo}
              >
                {subInfo}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "contactPerson",
      label: "Contact Person",
      minWidth: "220px",
      render: (val, row) => {
        const name = val || row.contactName || "Contact";
        const email = row.email || "";
        return (
          <div style={{ minWidth: 0, maxWidth: "220px" }}>
            <div
              style={{
                fontSize: "0.825rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={name}
            >
              {name}
            </div>
            <div
              style={{
                fontSize: "0.725rem",
                color: "var(--text-secondary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "210px",
              }}
              title={email}
            >
              {email}
            </div>
          </div>
        );
      },
    },
    {
      key: "type",
      label: "Business Type",
      minWidth: "160px",
      render: (val, row) => (
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: "999px",
            backgroundColor: "rgba(255, 188, 0, 0.14)",
            color: "#ffbc00",
            border: "1px solid rgba(255, 188, 0, 0.3)",
            display: "inline-flex",
            alignItems: "center",
            width: "fit-content",
            whiteSpace: "nowrap",
          }}
        >
          {val || row.companyType || "Production"}
        </span>
      ),
    },
    {
      key: "city",
      label: "City",
      minWidth: "110px",
      render: (val, row) => (
        <span style={{ fontSize: "0.825rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
          {val || row.location || "Mumbai"}
        </span>
      ),
    },
    {
      key: "requirementsCount",
      label: "Briefs Posted",
      minWidth: "90px",
      render: (val) => (
        <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
          <FolderKanban size={13} color="var(--accent)" />
          <span style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {val ?? 0}
          </span>
        </div>
      ),
    },
    {
      key: "joinedDate",
      label: "Joined Date",
      minWidth: "120px",
      render: (val) => (
        <span style={{ fontSize: "0.825rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
          {val}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      minWidth: "160px",
      render: (val) => <StatusBadge status={val} size="xs" />,
    },
    {
      key: "actions",
      label: "Actions",
      minWidth: "110px",
      render: (_, row) => (
        <button
          onClick={() => handleOpenReview(row)}
          className="btn-primary"
          style={{
            padding: "4px 10px",
            fontSize: "0.725rem",
            gap: "4px",
            borderRadius: "8px",
            minHeight: "28px",
            height: "28px",
            display: "inline-flex",
            alignItems: "center",
            whiteSpace: "nowrap",
          }}
        >
          <Eye size={12} /> Review
        </button>
      ),
    },
  ];

  const renderMobileCard = (row) => {
    const compName = row.company || row.companyName || "Organization";
    const subInfo = `ID: ${row.id} • ${row.gstNumber || row.registrationNumber || "GST Pending"}`;
    const contactName = row.contactPerson || row.contactName || "Contact";
    const email = row.email || "";

    return (
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "14px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Card Header: Logo, Name, ID & Status */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <img
              src={row.avatar || "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&auto=format&fit=crop&q=80"}
              alt={compName}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                objectFit: "cover",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={compName}
              >
                {compName}
              </div>
              <div
                style={{
                  fontSize: "0.725rem",
                  color: "var(--text-secondary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {subInfo}
              </div>
            </div>
          </div>
          <StatusBadge status={row.status} size="xs" />
        </div>

        {/* Contact Info */}
        <div
          style={{
            padding: "10px 12px",
            backgroundColor: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            borderRadius: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          <span style={{ fontSize: "0.68rem", color: "#7e89a3", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
            Authorized Contact
          </span>
          <div style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--text-primary)" }}>
            {contactName}
          </div>
          {email && (
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={email}
            >
              {email}
            </div>
          )}
        </div>

        {/* Small Fields Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "0.785rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "0.68rem", color: "#7e89a3", textTransform: "uppercase", fontWeight: 700 }}>
              Business Type
            </span>
            <span
              style={{
                fontSize: "0.725rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "999px",
                backgroundColor: "rgba(255, 188, 0, 0.14)",
                color: "#ffbc00",
                border: "1px solid rgba(255, 188, 0, 0.3)",
                display: "inline-flex",
                alignItems: "center",
                width: "fit-content",
                whiteSpace: "nowrap",
              }}
            >
              {row.type || row.companyType || "Production"}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "0.68rem", color: "#7e89a3", textTransform: "uppercase", fontWeight: 700 }}>
              City
            </span>
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              {row.city || row.location || "Mumbai"}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "0.68rem", color: "#7e89a3", textTransform: "uppercase", fontWeight: 700 }}>
              Briefs Posted
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <FolderKanban size={13} color="var(--accent)" />
              <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                {row.requirementsCount ?? 0}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "0.68rem", color: "#7e89a3", textTransform: "uppercase", fontWeight: 700 }}>
              Joined Date
            </span>
            <span style={{ color: "var(--text-secondary)" }}>
              {row.joinedDate}
            </span>
          </div>
        </div>

        {/* Full Width Review Button */}
        <button
          type="button"
          onClick={() => handleOpenReview(row)}
          className="btn-primary"
          style={{
            width: "100%",
            justifyContent: "center",
            minHeight: "38px",
            height: "38px",
            fontSize: "0.8rem",
            gap: "6px",
            borderRadius: "10px",
            marginTop: "4px",
          }}
        >
          <Eye size={14} />
          <span>Review Organization</span>
        </button>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Page Header */}
      <PageHeader
        title="Organization Management"
        subtitle="Verify corporate identities, review CIN and GST registration documents, and manage accredited studio accounts."
        badge={`${recruiters.length} Registered Organizations`}
      />

      {/* Filter Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Organization Data Table */}
      <DataTable
        title={`Organization Directory (${filteredRecruiters.length})`}
        columns={columns}
        data={filteredRecruiters}
        searchable={true}
        searchPlaceholder="Search by company, contact person, GST, city..."
        pageSize={6}
        emptyTitle="No organizations found"
        emptyDescription="There are no organization accounts matching the selected status filter."
        renderMobileCard={renderMobileCard}
        minWidth="1230px"
      />

      {/* Review Drawer */}
      {isDrawerOpen && currentSelectedRecruiter && (
        <ReviewDrawer
          isOpen={isDrawerOpen}
          onClose={handleCloseReview}
          type="recruiter"
          data={currentSelectedRecruiter}
          onApprove={(id) => {
            verifyRecruiter(id);
          }}
          onReject={(id, reason) => {
            rejectRecruiter(id, reason);
          }}
          onSuspend={(id, reason) => {
            suspendRecruiter(id, reason);
          }}
          onReactivate={(id) => {
            reactivateRecruiter(id);
          }}
        />
      )}

      {/* Standalone Reason Modal */}
      {reasonModalConfig && (
        <ReasonModal
          isOpen={!!reasonModalConfig}
          onClose={() => setReasonModalConfig(null)}
          title={reasonModalConfig.title}
          actionType={reasonModalConfig.actionType}
          placeholder={reasonModalConfig.placeholder}
          presetReasons={reasonModalConfig.presetReasons}
          onSubmit={(reason) => {
            reasonModalConfig.onSubmit(reason);
            setReasonModalConfig(null);
          }}
        />
      )}
    </div>
  );
}
