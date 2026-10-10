"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Filter,
  ArrowUpDown,
  Megaphone,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Trophy,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import ApplicationCard from "@/components/talent/ApplicationCard";
import { useWorkflow } from "@/lib/shared/workflowStore";

export default function TalentApplicationsPage() {
  const { applications, isHydrated } = useWorkflow();

  const currentTalentId = "tal-904";
  const myApplications = useMemo(() => {
    return applications.filter((a) => a.talentId === currentTalentId);
  }, [applications]);

  const [activeFilter, setActiveFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" | "oldest"

  // Counts by status
  const counts = {
    all: myApplications.length,
    Applied: myApplications.filter((a) => a.status === "Applied").length,
    "Under Review": myApplications.filter((a) => a.status === "Under Review").length,
    Shortlisted: myApplications.filter((a) => a.status === "Shortlisted").length,
    Selected: myApplications.filter((a) => a.status === "Selected").length,
    "Not Selected": myApplications.filter((a) => a.status === "Not Selected").length,
    Withdrawn: myApplications.filter((a) => a.status === "Withdrawn").length,
  };

  const filterChips = [
    { key: "all", label: "All Submissions", count: counts.all },
    { key: "Applied", label: "Applied", count: counts.Applied },
    { key: "Under Review", label: "Under Review", count: counts["Under Review"] },
    { key: "Shortlisted", label: "Shortlisted", count: counts.Shortlisted },
    { key: "Selected", label: "Selected", count: counts.Selected },
    { key: "Not Selected", label: "Not Selected", count: counts["Not Selected"] },
    { key: "Withdrawn", label: "Withdrawn", count: counts.Withdrawn },
  ];

  const filteredApplications = useMemo(() => {
    let list = myApplications;

    if (activeFilter !== "all") {
      list = list.filter((a) => a.status === activeFilter);
    }

    return [...list].sort((a, b) => {
      const dateA = new Date(a.appliedAt || 0).getTime();
      const dateB = new Date(b.appliedAt || 0).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [myApplications, activeFilter, sortOrder]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <PageHeader
        title="My Applications"
        subtitle="Track your submitted profile applications across review stages, shortlisted audition rounds, and final selections."
        badge={`${myApplications.length} TOTAL SUBMISSIONS`}
        breadcrumbs={[
          { label: "Talent Dashboard", href: "/talent/dashboard" },
          { label: "My Applications" },
        ]}
        action={
          <Link href="/talent/opportunities" className="btn-primary" style={{ fontSize: "0.85rem", padding: "8px 18px", borderRadius: "12px" }}>
            <Megaphone size={15} />
            <span>Browse Opportunities</span>
          </Link>
        }
      />

      {/* Filter Chips & Sorting Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          width: "100%",
        }}
      >
        {/* Status Filter Chips with Horizontal Scroll */}
        <div
          className="talent-filter-scroll"
          style={{
            maxWidth: "100%",
            paddingBottom: "4px",
          }}
        >
          {filterChips.map((chip) => {
            const isActive = activeFilter === chip.key;
            return (
              <button
                key={chip.key}
                onClick={() => setActiveFilter(chip.key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  minHeight: "44px",
                  padding: "8px 16px",
                  borderRadius: "12px",
                  fontSize: "0.825rem",
                  fontWeight: isActive ? "700" : "500",
                  color: isActive ? "#1a1300" : "var(--text-secondary)",
                  backgroundColor: isActive ? "var(--gold)" : "rgba(255, 255, 255, 0.06)",
                  border: `1px solid ${isActive ? "var(--gold)" : "rgba(255, 255, 255, 0.12)"}`,
                  boxShadow: isActive ? "0 4px 14px rgba(255, 188, 0, 0.25)" : "none",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <span>{chip.label}</span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: "700",
                    padding: "2px 7px",
                    borderRadius: "8px",
                    backgroundColor: isActive ? "rgba(26, 19, 0, 0.2)" : "rgba(255, 255, 255, 0.1)",
                    color: isActive ? "#1a1300" : "var(--text-muted)",
                  }}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sort By Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
            <ArrowUpDown size={13} /> Sort:
          </span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              minHeight: "44px",
              padding: "8px 14px",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: "12px",
              color: "var(--text-primary)",
              fontSize: "0.825rem",
              outline: "none",
            }}
          >
            <option value="newest" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Newest First</option>
            <option value="oldest" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Oldest First</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <EmptyState
          title="No applications found in this view"
          description={
            activeFilter === "all"
              ? "You have not applied to any opportunities yet. Explore live opportunities and submit your profile."
              : `There are currently no applications with status "${activeFilter}".`
          }
          iconName="FileText"
          actionLabel="Browse Live Opportunities"
          actionHref="/talent/opportunities"
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {filteredApplications.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </div>
      )}
    </div>
  );
}
