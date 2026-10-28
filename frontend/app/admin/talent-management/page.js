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
import { adminService } from "@/lib/api/services/adminService";

const getInitials = (name) => {
  if (!name) return "T";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0] ? parts[0].slice(0, 2).toUpperCase() : "T";
};

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

  // Status Tabs calculation: every profile appears in exactly one status tab
  const pendingCount = talents.filter((t) => t.status === "Pending").length;
  const approvedCount = talents.filter((t) => t.status === "Approved").length;
  const rejectedCount = talents.filter((t) => t.status === "Rejected").length;
  const suspendedCount = talents.filter((t) => t.status === "Suspended").length;
  const draftCount = talents.filter((t) => t.status === "Incomplete / Draft" || t.status === "Draft" || t.status === "Incomplete").length;

  const tabs = [
    { key: "all", label: "All Artists", count: talents.length },
    { key: "Pending", label: "Pending Verification", count: pendingCount },
    { key: "Approved", label: "Approved", count: approvedCount },
    { key: "Rejected", label: "Rejected", count: rejectedCount },
    { key: "Suspended", label: "Suspended", count: suspendedCount },
    { key: "Incomplete / Draft", label: "Incomplete / Draft", count: draftCount },
  ];

  const filteredTalents = talents.filter((t) => {
    if (activeTab === "all") return true;
    if (activeTab === "Incomplete / Draft") {
      return t.status === "Incomplete / Draft" || t.status === "Draft" || t.status === "Incomplete";
    }
    return t.status === activeTab;
  });

  const handleOpenReview = async (talent) => {
    setSelectedTalent(talent);
    setIsDrawerOpen(true);
    const targetId = talent._id || talent.id || talent.userId;
    if (targetId) {
      try {
        const res = await adminService.getTalentById(targetId);
        if (res?.success && res.data) {
          setSelectedTalent((prev) => ({
            ...prev,
            ...res.data,
            id: prev?.id || res.data.id,
            status: prev?.status || res.data.status,
          }));
        }
      } catch (err) {
        console.warn("Failed to fetch detailed talent profile:", err);
      }
    }
  };

  const handleCloseReview = () => {
    setIsDrawerOpen(false);
    setSelectedTalent(null);
  };

  // Re-sync selected talent from context if updated while drawer is open
  const currentSelectedTalent = selectedTalent
    ? { ...(talents.find((t) => t.id === selectedTalent.id || t._id === selectedTalent._id) || {}), ...selectedTalent }
    : null;

  const columns = [
    {
      key: "name",
      label: "Artist Name",
      minWidth: "260px",
      render: (val, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, maxWidth: "260px" }}>
          {row.avatar ? (
            <img
              src={row.avatar}
              alt={row.name}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "1px solid #E8E2D4",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "#F3EFE6",
                color: "#8A6B2E",
                border: "1px solid #E8E2D4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "13px",
                flexShrink: 0,
              }}
            >
              {getInitials(row.name)}
            </div>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#2B2D2A",
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
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "999px",
                    backgroundColor: "rgba(138, 107, 46, 0.12)",
                    color: "#6E5420",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                    border: "1px solid rgba(138, 107, 46, 0.25)",
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
                fontSize: "12px",
                color: "#5A584F",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={row.email}
            >
              {row.email}
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
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#2B2D2A" }}>{row.city}</div>
          <div style={{ fontSize: "12px", color: "#5A584F" }}>{row.state}</div>
        </div>
      ),
    },
    {
      key: "age",
      label: "Age / Gender",
      minWidth: "120px",
      render: (val, row) => (
        <div style={{ fontSize: "13px", color: "#5A584F", whiteSpace: "nowrap" }}>
          {row.age ? `${row.age} yrs • ` : ""}{row.gender || "Unspecified"}
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
            fontSize: "12px",
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: "999px",
            backgroundColor: "rgba(201, 165, 92, 0.16)",
            color: "#6E5420",
            border: "1px solid rgba(201, 165, 92, 0.3)",
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
      render: (val, row) => (
        <span style={{ fontSize: "13px", color: "#5A584F", whiteSpace: "nowrap" }}>
          {val || (row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—")}
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
          style={{
            padding: "6px 14px",
            fontSize: "13px",
            fontWeight: "600",
            gap: "6px",
            borderRadius: "8px",
            height: "36px",
            display: "inline-flex",
            alignItems: "center",
            whiteSpace: "nowrap",
            backgroundColor: "#8A6B2E",
            color: "#FFFFFF",
            border: "none",
            cursor: "pointer",
            transition: "background-color 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#6E5420")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#8A6B2E")}
        >
          <Eye size={13} /> Review
        </button>
      ),
    },
  ];

  const renderMobileCard = (row) => {
    return (
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E2D4",
          borderRadius: "14px",
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          width: "100%",
          boxSizing: "border-box",
          boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06)",
        }}
      >
        {/* Card Header: Avatar, Name, Minor, ID & Status */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            {row.avatar ? (
              <img
                src={row.avatar}
                alt={row.name}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "1px solid #E8E2D4",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#F3EFE6",
                  color: "#8A6B2E",
                  border: "1px solid #E8E2D4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "13px",
                  flexShrink: 0,
                }}
              >
                {getInitials(row.name)}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#2B2D2A",
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
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "999px",
                      backgroundColor: "rgba(138, 107, 46, 0.12)",
                      color: "#6E5420",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                      border: "1px solid rgba(138, 107, 46, 0.25)",
                      flexShrink: 0,
                    }}
                  >
                    <Baby size={10} /> Minor
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#5A584F",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={row.email}
              >
                {row.email}
              </div>
            </div>
          </div>
          <StatusBadge status={row.status} size="xs" />
        </div>

        {/* Small Fields Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "13px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "11px", color: "#5A584F", textTransform: "uppercase", fontWeight: 700 }}>
              Location
            </span>
            <span style={{ color: "#2B2D2A", fontWeight: 600 }}>
              {row.city}, {row.state}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "11px", color: "#5A584F", textTransform: "uppercase", fontWeight: 700 }}>
              Age / Gender
            </span>
            <span style={{ color: "#2B2D2A" }}>
              {row.age ? `${row.age} yrs • ` : ""}{row.gender || "Unspecified"}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "11px", color: "#5A584F", textTransform: "uppercase", fontWeight: 700 }}>
              Category
            </span>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "999px",
                backgroundColor: "rgba(201, 165, 92, 0.16)",
                color: "#6E5420",
                border: "1px solid rgba(201, 165, 92, 0.3)",
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
            <span style={{ fontSize: "11px", color: "#5A584F", textTransform: "uppercase", fontWeight: 700 }}>
              Joined Date
            </span>
            <span style={{ color: "#5A584F" }}>
              {row.joinedDate || (row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—")}
            </span>
          </div>
        </div>

        {/* Full Width Review Button */}
        <button
          type="button"
          onClick={() => handleOpenReview(row)}
          style={{
            width: "100%",
            justifyContent: "center",
            height: "36px",
            fontSize: "13px",
            fontWeight: "600",
            gap: "6px",
            borderRadius: "10px",
            marginTop: "4px",
            backgroundColor: "#8A6B2E",
            color: "#FFFFFF",
            border: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
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
        searchPlaceholder="Search by name, city, category..."
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
