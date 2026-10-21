"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
import { useTalent } from "@/lib/talent/TalentContext";
import { useAuth } from "@/context/AuthContext";
import { isRealMode } from "@/lib/api/config";

export default function TalentApplicationsPage() {
  const { user } = useAuth();
  const { profile, applications: ctxApplications = [] } = useTalent();
  const { applications, isHydrated } = useWorkflow();
  const filterScrollRef = useRef(null);

  const currentTalentId = user?.id || user?._id || profile?.id || profile?._id || profile?.userId || (!isRealMode("talent") ? "tal-904" : "");
  const myApplications = useMemo(() => {
    if (isRealMode("applications") || isRealMode("talent")) {
      return Array.isArray(ctxApplications) ? ctxApplications : [];
    }
    return applications.filter((a) => a.talentId === currentTalentId);
  }, [applications, ctxApplications, currentTalentId]);

  const [activeFilter, setActiveFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" | "oldest"

  // Auto-scroll active filter tab into view on mobile
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 640 && filterScrollRef.current) {
      const activeEl = filterScrollRef.current.querySelector(".active-chip");
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          inline: "nearest",
          block: "nearest",
        });
      }
    }
  }, [activeFilter]);

  // Counts by status
  const counts = {
    all: myApplications.length,
    Applied: myApplications.filter((a) => a.status === "Applied" || a.status === "applied").length,
    "Under Review": myApplications.filter((a) => a.status === "Under Review" || a.status === "under_review").length,
    Shortlisted: myApplications.filter((a) => a.status === "Shortlisted" || a.status === "shortlisted").length,
    Selected: myApplications.filter((a) => a.status === "Selected" || a.status === "selected").length,
    "Not Selected": myApplications.filter((a) => a.status === "Not Selected" || a.status === "not_selected").length,
    Withdrawn: myApplications.filter((a) => a.status === "Withdrawn" || a.status === "withdrawn").length,
    "Opportunity Cancelled": myApplications.filter((a) => a.status === "Opportunity Cancelled" || a.status === "opportunity_cancelled").length,
  };

  const filterChips = [
    { key: "all", label: "All Submissions", count: counts.all },
    { key: "Applied", label: "Applied", count: counts.Applied },
    { key: "Under Review", label: "Under Review", count: counts["Under Review"] },
    { key: "Shortlisted", label: "Shortlisted", count: counts.Shortlisted },
    { key: "Selected", label: "Selected", count: counts.Selected },
    { key: "Not Selected", label: "Not Selected", count: counts["Not Selected"] },
    { key: "Withdrawn", label: "Withdrawn", count: counts.Withdrawn },
    { key: "Opportunity Cancelled", label: "Cancelled Calls", count: counts["Opportunity Cancelled"] },
  ];

  const filteredApplications = useMemo(() => {
    let list = myApplications;

    if (activeFilter !== "all") {
      list = list.filter((a) => {
        if (activeFilter === "Opportunity Cancelled") {
          return a.status === "Opportunity Cancelled" || a.status === "opportunity_cancelled";
        }
        return a.status === activeFilter;
      });
    }

    return [...list].sort((a, b) => {
      const dateA = new Date(a.appliedAt || 0).getTime();
      const dateB = new Date(b.appliedAt || 0).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [myApplications, activeFilter, sortOrder]);

  return (
    <div className="talent-applications-root" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <PageHeader
        title="My Applications"
        subtitle="Track your submitted profile applications across review stages, shortlisted audition rounds, and final selections."
        badge={`${myApplications.length} TOTAL SUBMISSIONS`}
        breadcrumbs={[
          { label: "Talent Dashboard", href: "/talent/dashboard" },
          { label: "My Applications" },
        ]}
        action={
          <Link href="/talent/opportunities" className="btn-primary app-browse-btn" style={{ fontSize: "0.85rem", padding: "8px 18px", borderRadius: "12px" }}>
            <Megaphone size={15} />
            <span>Browse Opportunities</span>
          </Link>
        }
      />

      {/* Filter Chips & Sorting Toolbar */}
      <div
        className="app-filter-toolbar"
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
        <div className="talent-filter-scroll-wrap">
          <div
            ref={filterScrollRef}
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
                  className={`app-filter-chip ${isActive ? "active-chip" : ""}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    minHeight: "38px",
                    padding: "6px 14px",
                    borderRadius: "6px",
                    fontSize: "0.825rem",
                    fontWeight: isActive ? "700" : "500",
                    color: isActive ? "#FFFFFF" : "var(--text-primary)",
                    backgroundColor: isActive ? "var(--gold)" : "var(--bg-alt)",
                    border: `1px solid ${isActive ? "var(--gold)" : "var(--border-color)"}`,
                    boxShadow: isActive ? "0 2px 6px rgba(155, 122, 63, 0.2)" : "none",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>{chip.label}</span>
                  <span
                    className="app-filter-chip-count"
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: "700",
                      padding: "2px 7px",
                      borderRadius: "4px",
                      backgroundColor: isActive ? "rgba(255, 255, 255, 0.25)" : "rgba(41, 44, 41, 0.08)",
                      color: isActive ? "#FFFFFF" : "var(--text-secondary)",
                    }}
                  >
                    {chip.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort By Dropdown */}
        <div className="app-sort-row" style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
          <span className="app-sort-label" style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
            <ArrowUpDown size={13} className="app-sort-icon" /> Sort:
          </span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="app-sort-select"
            style={{
              minHeight: "38px",
              padding: "6px 14px",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              color: "var(--text-primary)",
              fontSize: "0.825rem",
              outline: "none",
            }}
          >
            <option value="newest" style={{ backgroundColor: "#FFFFFF", color: "#292C29" }}>Newest First</option>
            <option value="oldest" style={{ backgroundColor: "#FFFFFF", color: "#292C29" }}>Oldest First</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="app-empty-wrap">
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
        </div>
      ) : (
        <div className="talent-applications-list" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {filteredApplications.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </div>
      )}

      <style jsx>{`
        @media (max-width: 640px) {
          .talent-applications-root {
            gap: 12px !important;
          }
          .talent-applications-root :global(.page-header-container) {
            margin-bottom: 0px !important;
            gap: 10px !important;
          }
          .talent-applications-root :global(.page-header-title-row) {
            gap: 8px !important;
            align-items: center !important;
          }
          .talent-applications-root :global(.page-header-title) {
            font-size: 22px !important;
            line-height: 1.25 !important;
            font-family: var(--font-heading), 'Playfair Display', Georgia, serif !important;
            color: #2B2D2A !important;
          }
          .talent-applications-root :global(.page-header-badge) {
            font-size: 10.5px !important;
            padding: 3px 8px !important;
            letter-spacing: 0.08em !important;
            background-color: #F3EFE6 !important;
            color: #6E5420 !important;
            border: 1px solid #E8E2D4 !important;
          }
          .talent-applications-root :global(.page-header-subtitle) {
            font-size: 13px !important;
            line-height: 1.5 !important;
            color: #5A584F !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 3 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          }
          .talent-applications-root :global(.page-header-actions) {
            width: 100% !important;
            margin-top: 2px !important;
          }
          .talent-applications-root :global(.app-browse-btn) {
            width: 100% !important;
            min-height: 42px !important;
            height: 42px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            letter-spacing: 0.06em !important;
            text-transform: uppercase !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: 8px !important;
            background-color: #8A6B2E !important;
            color: #FFFFFF !important;
            border: 1px solid #8A6B2E !important;
            box-shadow: 0 2px 8px rgba(138, 107, 46, 0.2) !important;
          }
          .talent-applications-root :global(.app-browse-btn:active) {
            background-color: #6E5420 !important;
          }

          /* B. Filter Tabs */
          .app-filter-toolbar {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
            width: 100% !important;
          }
          .talent-filter-scroll-wrap {
            position: static !important;
            width: 100% !important;
            margin: 12px 0 !important;
            overflow: visible !important;
          }
          .talent-filter-scroll-wrap::after {
            display: none !important;
          }
          .talent-filter-scroll {
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: wrap !important;
            gap: 5px !important;
            overflow: visible !important;
            padding: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            scrollbar-width: none !important;
          }
          .talent-filter-scroll::-webkit-scrollbar {
            display: none !important;
          }
          .app-filter-chip {
            flex: 1 1 auto !important;
            height: 28px !important;
            min-height: 28px !important;
            padding: 0 8px !important;
            border-radius: 999px !important;
            font-size: 10.5px !important;
            font-weight: 600 !important;
            font-family: var(--font-body), 'Inter', sans-serif !important;
            white-space: nowrap !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 5px !important;
            margin: 0 !important;
            box-shadow: none !important;
            transition: all 0.15s ease !important;
          }
          .app-filter-chip > span:first-child {
            font-size: 10.5px !important;
            white-space: nowrap !important;
          }
          .app-filter-chip.active-chip {
            background-color: #8A6B2E !important;
            border-color: #8A6B2E !important;
            color: #FFFFFF !important;
            box-shadow: none !important;
          }
          .app-filter-chip.active-chip > span:first-child {
            color: #FFFFFF !important;
          }
          .app-filter-chip.active-chip .app-filter-chip-count {
            background-color: #FFFFFF !important;
            color: #8A6B2E !important;
            border: none !important;
          }
          .app-filter-chip:not(.active-chip) {
            background-color: #FFFFFF !important;
            border: 1px solid #E8E2D4 !important;
            color: #5A584F !important;
          }
          .app-filter-chip:not(.active-chip) > span:first-child {
            color: #5A584F !important;
          }
          .app-filter-chip:not(.active-chip) .app-filter-chip-count {
            background-color: #F3EFE6 !important;
            color: #2B2D2A !important;
            border: 1px solid #E8E2D4 !important;
          }
          .app-filter-chip-count {
            min-width: 16px !important;
            height: 16px !important;
            border-radius: 8px !important;
            font-size: 9.5px !important;
            font-weight: 700 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 4px !important;
            line-height: 16px !important;
            flex-shrink: 0 !important;
          }

          /* C. Sort Row */
          .app-sort-row {
            width: 100% !important;
            height: 38px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: flex-end !important;
            margin-left: 0 !important;
            gap: 10px !important;
          }
          .app-sort-label {
            white-space: nowrap !important;
            font-size: 13px !important;
            color: #5A584F !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 5px !important;
            flex-shrink: 0 !important;
          }
          .app-sort-select {
            height: 36px !important;
            min-height: 36px !important;
            font-size: 13px !important;
            padding: 6px 10px !important;
            border-radius: 6px !important;
            background-color: #FFFFFF !important;
            border: 1px solid #E8E2D4 !important;
            color: #2B2D2A !important;
            min-width: 130px !important;
          }

          /* List and Spacing */
          .talent-applications-list {
            gap: 12px !important;
          }

          /* E. Empty State */
          .app-empty-wrap :global(> div) {
            padding: 24px 16px !important;
            border-radius: 12px !important;
            background-color: #FFFFFF !important;
            border: 1px dashed #E8E2D4 !important;
          }
          .app-empty-wrap :global(> div > div:first-child) {
            width: 40px !important;
            height: 40px !important;
            margin-bottom: 10px !important;
            background-color: #F3EFE6 !important;
            border-color: #E8E2D4 !important;
            color: #8A6B2E !important;
          }
          .app-empty-wrap :global(> div > div:first-child svg) {
            width: 20px !important;
            height: 20px !important;
          }
          .app-empty-wrap :global(h3) {
            font-size: 15px !important;
            margin-bottom: 4px !important;
            color: #2B2D2A !important;
          }
          .app-empty-wrap :global(p) {
            font-size: 13px !important;
            line-height: 1.45 !important;
            margin-bottom: 14px !important;
            color: #5A584F !important;
          }
          .app-empty-wrap :global(.btn-primary) {
            min-height: 38px !important;
            height: 38px !important;
            font-size: 12px !important;
            padding: 0 16px !important;
            border-radius: 8px !important;
            background-color: #8A6B2E !important;
          }
        }

        @media (max-width: 400px) {
          .talent-applications-root :global(.page-header-title) {
            font-size: 20px !important;
          }
          .app-sort-select {
            font-size: 13px !important;
            padding: 6px 8px !important;
          }
        }

        @media (max-width: 380px) {
          .app-filter-chip {
            font-size: 10px !important;
            padding: 0 5px !important;
            gap: 4px !important;
          }
          .app-filter-chip-count {
            font-size: 9px !important;
            min-width: 15px !important;
            height: 15px !important;
            padding: 0 3px !important;
          }
        }
      `}</style>
    </div>
  );
}
