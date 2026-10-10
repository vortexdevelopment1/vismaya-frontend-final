"use client";

import React, { useState } from "react";
import {
  Users,
  Eye,
  CheckCircle,
  XCircle,
  Ban,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Baby,
} from "lucide-react";
import { useAdmin } from "@/lib/admin/AdminContext";
import PageHeader from "@/components/shared/PageHeader";
import Tabs from "@/components/shared/Tabs";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import ReviewDrawer from "@/components/admin/ReviewDrawer";
import ReasonModal from "@/components/admin/ReasonModal";

export default function TalentManagementPage() {
  const {
    talents,
    approveTalent,
    rejectTalent,
    suspendTalent,
    reactivateTalent,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState("all");
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [reasonModalConfig, setReasonModalConfig] = useState(null);

  // Status Tabs calculation
  const pendingCount = talents.filter((t) => t.status === "Pending").length;
  const approvedCount = talents.filter((t) => t.status === "Approved").length;
  const rejectedCount = talents.filter((t) => t.status === "Rejected").length;
  const suspendedCount = talents.filter((t) => t.status === "Suspended").length;

  const tabs = [
    { key: "all", label: "All Artists", count: talents.length },
    { key: "Pending", label: "Pending Verification", count: pendingCount },
    { key: "Approved", label: "Approved", count: approvedCount },
    { key: "Rejected", label: "Rejected", count: rejectedCount },
    { key: "Suspended", label: "Suspended", count: suspendedCount },
  ];

  const filteredTalents = talents.filter((t) => {
    if (activeTab === "all") return true;
    return t.status === activeTab;
  });

  const handleOpenReview = (talent) => {
    setSelectedTalent(talent);
    setIsDrawerOpen(true);
  };

  const handleCloseReview = () => {
    setIsDrawerOpen(false);
    setSelectedTalent(null);
  };

  // Re-sync selected talent from context if updated while drawer is open
  const currentSelectedTalent = selectedTalent
    ? talents.find((t) => t.id === selectedTalent.id) || selectedTalent
    : null;

  const columns = [
    {
      key: "name",
      label: "Artist Name",
      minWidth: "260px",
      render: (val, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, maxWidth: "260px" }}>
          <img
            src={row.avatar}
            alt={row.name}
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
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.name}>{row.name}</span>
              {row.age < 18 && (
                <span
                  title="Minor artist (Guardian consent verified)"
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "999px",
                    backgroundColor: "rgba(251, 191, 36, 0.15)",
                    color: "#fbbf24",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                    border: "1px solid rgba(251, 191, 36, 0.35)",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  <Baby size={10} /> Minor
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: "0.725rem",
                color: "var(--text-secondary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={`ID: ${row.id} • ${row.email}`}
            >
              ID: {row.id} &bull; {row.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "city",
      label: "Location",
      minWidth: "140px",
      render: (val, row) => (
        <div style={{ whiteSpace: "nowrap" }}>
          <div style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--text-primary)" }}>{row.city}</div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{row.state}</div>
        </div>
      ),
    },
    {
      key: "age",
      label: "Age / Gender",
      minWidth: "120px",
      render: (val, row) => (
        <div style={{ fontSize: "0.825rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
          {row.age} yrs &bull; {row.gender}
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      minWidth: "140px",
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
          {row.category}
        </span>
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
      minWidth: "140px",
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
        {/* Card Header: Avatar, Name, Minor, ID & Status */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <img
              src={row.avatar}
              alt={row.name}
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
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={row.name}
                >
                  {row.name}
                </span>
                {row.age < 18 && (
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "999px",
                      backgroundColor: "rgba(251, 191, 36, 0.15)",
                      color: "#fbbf24",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                      border: "1px solid rgba(251, 191, 36, 0.35)",
                      flexShrink: 0,
                    }}
                  >
                    <Baby size={10} /> Minor
                  </span>
                )}
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
                ID: {row.id} &bull; {row.email}
              </div>
            </div>
          </div>
          <StatusBadge status={row.status} size="xs" />
        </div>

        {/* Small Fields Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "0.785rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "0.68rem", color: "#7e89a3", textTransform: "uppercase", fontWeight: 700 }}>
              Location
            </span>
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              {row.city}, {row.state}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "0.68rem", color: "#7e89a3", textTransform: "uppercase", fontWeight: 700 }}>
              Age / Gender
            </span>
            <span style={{ color: "var(--text-primary)" }}>
              {row.age} yrs &bull; {row.gender}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "0.68rem", color: "#7e89a3", textTransform: "uppercase", fontWeight: 700 }}>
              Category
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
              {row.category}
            </span>
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
          <span>Review Artist</span>
        </button>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Page Header */}
      <PageHeader
        title="Talent Management"
        subtitle="Verify artist profiles, evaluate comp-cards, review minor guardian consent, and moderate roster status."
        badge={`${talents.length} Registered Artists`}
      />

      {/* Filter Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Talent Data Table */}
      <DataTable
        title={`Artist Directory (${filteredTalents.length})`}
        columns={columns}
        data={filteredTalents}
        searchable={true}
        searchPlaceholder="Search by name, city, category, ID..."
        pageSize={6}
        emptyTitle="No artists found"
        emptyDescription="There are no talent profiles matching the selected status filter."
        renderMobileCard={renderMobileCard}
        minWidth="1050px"
      />

      {/* Review Drawer */}
      {isDrawerOpen && currentSelectedTalent && (
        <ReviewDrawer
          isOpen={isDrawerOpen}
          onClose={handleCloseReview}
          type="talent"
          data={currentSelectedTalent}
          onApprove={(id) => {
            approveTalent(id);
          }}
          onReject={(id, reason) => {
            rejectTalent(id, reason);
          }}
          onSuspend={(id, reason) => {
            suspendTalent(id, reason);
          }}
          onReactivate={(id) => {
            reactivateTalent(id);
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
