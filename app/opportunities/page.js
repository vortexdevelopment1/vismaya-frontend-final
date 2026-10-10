"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";

import { useRouter } from "next/navigation";
import {
  Search,
  X,
  RotateCcw,
} from "lucide-react";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import EmptyState from "@/components/shared/EmptyState";
import Skeleton from "@/components/shared/Skeleton";
import PublicOpportunityCard from "@/components/shared/PublicOpportunityCard";
import { useWorkflow } from "@/lib/shared/workflowStore";
import { useAuth } from "@/context/AuthContext";
import { isRealMode } from "@/lib/api/config";
import "./opportunities.css";

export default function PublicOpportunitiesPage() {
  const { opportunities, isHydrated, getProject } = useWorkflow();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Enforce Master Spec v2.0: /opportunities is authenticated-only for talent/recruiters
  useEffect(() => {
    if (isRealMode("opportunities") && !authLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent("/opportunities")}`);
    }
  }, [authLoading, isAuthenticated, router]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState("all");

  const types = ["all", "OTT Series", "Commercial / TVC", "Feature Film", "Theatre", "Music Video", "Short Film", "Print / Editorial"];
  const cities = ["all", "Mumbai", "Delhi", "Bengaluru", "Pune", "Hyderabad", "Pan-India"];
  const genders = ["all", "Female", "Male", "Any"];
  const paymentOptions = ["all", "Paid", "Unpaid"];

  // Filter ONLY published and active opportunities
  const publicOpportunities = useMemo(() => {
    const now = new Date().getTime();
    return opportunities.filter((opp) => {
      if (opp.status !== "Published") return false;
      const deadlineTime = new Date(opp.deadline).getTime();
      return isNaN(deadlineTime) || deadlineTime >= now;
    });
  }, [opportunities]);

  // Filter logic
  const filteredList = useMemo(() => {
    return publicOpportunities.filter((opp) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        opp.title.toLowerCase().includes(query) ||
        (opp.summary && opp.summary.toLowerCase().includes(query)) ||
        (opp.location && opp.location.toLowerCase().includes(query)) ||
        (opp.roles && opp.roles.some((r) => r.roleName.toLowerCase().includes(query)));

      const matchesType = selectedType === "all" || opp.opportunityType === selectedType;

      const matchesCity =
        selectedCity === "all" ||
        (opp.location && opp.location.toLowerCase().includes(selectedCity.toLowerCase())) ||
        (opp.eligibility?.location && opp.eligibility.location.toLowerCase().includes(selectedCity.toLowerCase()));

      const matchesGender =
        selectedGender === "all" ||
        opp.eligibility?.gender === "Any" ||
        opp.eligibility?.gender === selectedGender ||
        (opp.roles && opp.roles.some((r) => r.gender === "Any" || r.gender === selectedGender));

      let matchesPayment = true;
      if (selectedPayment === "Paid") {
        matchesPayment = !!opp.remuneration && !opp.remuneration.toLowerCase().includes("unpaid");
      } else if (selectedPayment === "Unpaid") {
        matchesPayment = !opp.remuneration || opp.remuneration.toLowerCase().includes("unpaid");
      }

      return matchesSearch && matchesType && matchesCity && matchesGender && matchesPayment;
    });
  }, [publicOpportunities, searchQuery, selectedType, selectedCity, selectedGender, selectedPayment]);

  const hasActiveFilters =
    searchQuery ||
    selectedType !== "all" ||
    selectedCity !== "all" ||
    selectedGender !== "all" ||
    selectedPayment !== "all";

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedType("all");
    setSelectedCity("all");
    setSelectedGender("all");
    setSelectedPayment("all");
  };

  return (
    <div className="opp-page-root">
      <PublicNav />

      {/* 1. TOP COMPACT HEADER BLOCK */}
      <section className="opp-header-section">
        <div className="opp-header-glow" aria-hidden="true" />

        <div className="public-container">
          <div className="opp-header-content">
            <div className="eyebrow opp-eyebrow">
              <span>Verified Casting Pipeline</span>
            </div>
            <h1 className="opp-title">
              Live Casting Opportunities
            </h1>
            <p className="opp-description">
              Browse verified casting briefs published by Vismaya. Register or sign in with your profile to view full character sides and apply.
            </p>
          </div>
        </div>
      </section>

      {/* 2. MAIN CONTENT (FILTER CARD + OPPORTUNITY CARDS) */}
      <section className="opp-main-section">
        <div className="public-container opp-main-container">
          {/* Glass Filter Bar Card */}
          <div className="opp-filter-card">
            {/* Search Input */}
            <div className="opp-search-row">
              <Search size={18} className="opp-search-icon" />
              <input
                type="text"
                placeholder="Search opportunities by title, role name, keywords, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="opp-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="opp-search-clear"
                  aria-label="Clear search query"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filter Dropdowns Grid (4 equal columns on desktop) */}
            <div className="opp-filters-grid">
              <div className="opp-filter-item">
                <label className="opp-filter-label">Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  {types.map((t) => (
                    <option key={t} value={t}>
                      {t === "all" ? "All Types" : t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="opp-filter-item">
                <label className="opp-filter-label">City / Location</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                >
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c === "all" ? "All Locations" : c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="opp-filter-item">
                <label className="opp-filter-label">Gender</label>
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                >
                  {genders.map((g) => (
                    <option key={g} value={g}>
                      {g === "all" ? "All Genders" : g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="opp-filter-item">
                <label className="opp-filter-label">Remuneration</label>
                <select
                  value={selectedPayment}
                  onChange={(e) => setSelectedPayment(e.target.value)}
                >
                  {paymentOptions.map((p) => (
                    <option key={p} value={p}>
                      {p === "all" ? "All Compensation" : p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Count & Reset Row */}
            <div className="opp-results-row">
              <span className="opp-results-text">
                Showing <strong className="opp-results-count">{filteredList.length}</strong> verified casting call{filteredList.length === 1 ? "" : "s"}
              </span>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="opp-reset-btn"
                >
                  <RotateCcw size={13} />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Equal-Height Opportunity Cards Grid */}
          {!isHydrated ? (
            <div className="opp-cards-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card-surface" style={{ padding: "24px", height: "300px" }}>
                  <Skeleton width="100%" height="120px" borderRadius="14px" />
                  <Skeleton width="70%" height="24px" style={{ marginTop: "16px" }} />
                  <Skeleton width="90%" height="16px" style={{ marginTop: "8px" }} />
                </div>
              ))}
            </div>
          ) : filteredList.length === 0 ? (
            <EmptyState
              title="No open opportunities match your filters"
              description="Check back soon or try clearing selected filters to view all active casting calls."
              iconName="Megaphone"
              actionLabel="Reset All Filters"
              onAction={clearAllFilters}
            />
          ) : (
            <div className="opp-cards-grid">
              {filteredList.map((opp, index) => {
                const project = getProject ? getProject(opp.projectId) : null;
                return (
                  <PublicOpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    project={project}
                    index={index}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
