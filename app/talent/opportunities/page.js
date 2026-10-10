"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  X,
  RotateCcw,
  Sparkles,
  Layers,
  MapPin,
  Calendar,
  DollarSign,
  Megaphone,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import Skeleton from "@/components/shared/Skeleton";
import OpportunityCard from "@/components/talent/OpportunityCard";
import OpportunityApplyModal from "@/components/talent/OpportunityApplyModal";
import { useWorkflow } from "@/lib/shared/workflowStore";

import Modal from "@/components/shared/Modal";

export default function TalentOpportunitiesPage() {
  const { opportunities, projects, getProject, isHydrated } = useWorkflow();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedAge, setSelectedAge] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState("all");

  const [selectedOpportunityForApply, setSelectedOpportunityForApply] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Available options for dropdowns
  const types = ["all", "OTT Series", "Commercial / TVC", "Feature Film", "Theatre", "Music Video", "Short Film", "Print / Editorial"];
  const cities = ["all", "Mumbai", "Delhi", "Bengaluru", "Pune", "Hyderabad", "Pan-India"];
  const ageBrackets = [
    { key: "all", label: "All Ages" },
    { key: "18-25", label: "18 - 25 years" },
    { key: "26-35", label: "26 - 35 years" },
    { key: "36-50", label: "36 - 50 years" },
  ];
  const genders = ["all", "Female", "Male", "Any"];
  const languages = ["all", "Hindi", "English", "Marathi", "Bengali", "Tamil", "Telugu", "Punjabi", "Rajasthani", "Kannada"];
  const paymentOptions = ["all", "Paid", "Unpaid"];

  // Query ONLY Published opportunities
  const publishedOpportunities = useMemo(() => {
    return opportunities.filter((opp) => opp.status === "Published");
  }, [opportunities]);

  // Filter logic
  const filteredOpportunities = useMemo(() => {
    return publishedOpportunities.filter((opp) => {
      const project = getProject(opp.projectId);

      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        opp.title.toLowerCase().includes(query) ||
        (opp.summary && opp.summary.toLowerCase().includes(query)) ||
        (opp.location && opp.location.toLowerCase().includes(query)) ||
        (project && project.title.toLowerCase().includes(query)) ||
        (opp.roles && opp.roles.some((r) => r.roleName.toLowerCase().includes(query)));

      // Type filter
      const matchesType = selectedType === "all" || opp.opportunityType === selectedType;

      // City filter
      const matchesCity =
        selectedCity === "all" ||
        (opp.location && opp.location.toLowerCase().includes(selectedCity.toLowerCase())) ||
        (opp.eligibility?.location && opp.eligibility.location.toLowerCase().includes(selectedCity.toLowerCase()));

      // Age filter
      let matchesAge = true;
      if (selectedAge !== "all") {
        const [minStr, maxStr] = selectedAge.split("-");
        const filterMin = parseInt(minStr);
        const filterMax = parseInt(maxStr);

        const oppMin = opp.eligibility?.ageMin || 18;
        const oppMax = opp.eligibility?.ageMax || 60;

        // Check overlap between bracket and eligibility
        matchesAge = oppMin <= filterMax && oppMax >= filterMin;
      }

      // Gender filter
      const matchesGender =
        selectedGender === "all" ||
        opp.eligibility?.gender === "Any" ||
        opp.eligibility?.gender === selectedGender ||
        (opp.roles && opp.roles.some((r) => r.gender === "Any" || r.gender === selectedGender));

      // Language filter
      const matchesLanguage =
        selectedLanguage === "all" ||
        (opp.eligibility?.languages &&
          opp.eligibility.languages.some((l) => l.toLowerCase().includes(selectedLanguage.toLowerCase()))) ||
        (opp.roles &&
          opp.roles.some((r) => r.language && r.language.toLowerCase().includes(selectedLanguage.toLowerCase())));

      // Paid / Unpaid filter
      let matchesPayment = true;
      if (selectedPayment === "Paid") {
        matchesPayment = !!opp.remuneration && !opp.remuneration.toLowerCase().includes("unpaid");
      } else if (selectedPayment === "Unpaid") {
        matchesPayment = !opp.remuneration || opp.remuneration.toLowerCase().includes("unpaid");
      }

      return (
        matchesSearch &&
        matchesType &&
        matchesCity &&
        matchesAge &&
        matchesGender &&
        matchesLanguage &&
        matchesPayment
      );
    });
  }, [
    publishedOpportunities,
    searchQuery,
    selectedType,
    selectedCity,
    selectedAge,
    selectedGender,
    selectedLanguage,
    selectedPayment,
    getProject,
  ]);

  const activeDropdownCount = [
    selectedType !== "all",
    selectedCity !== "all",
    selectedAge !== "all",
    selectedGender !== "all",
    selectedLanguage !== "all",
    selectedPayment !== "all",
  ].filter(Boolean).length;

  const hasActiveFilters = searchQuery || activeDropdownCount > 0;

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedType("all");
    setSelectedCity("all");
    setSelectedAge("all");
    setSelectedGender("all");
    setSelectedLanguage("all");
    setSelectedPayment("all");
  };

  const renderFilterControls = (isModal = false) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isModal ? "1fr" : "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "14px",
      }}
    >
      {/* Opportunity Type */}
      <div>
        <label style={filterLabelStyle}>Type</label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          style={selectStyle}
        >
          {types.map((t) => (
            <option key={t} value={t} style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>
              {t === "all" ? "All Types" : t}
            </option>
          ))}
        </select>
      </div>

      {/* City */}
      <div>
        <label style={filterLabelStyle}>City / Location</label>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          style={selectStyle}
        >
          {cities.map((c) => (
            <option key={c} value={c} style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>
              {c === "all" ? "All Locations" : c}
            </option>
          ))}
        </select>
      </div>

      {/* Age Range */}
      <div>
        <label style={filterLabelStyle}>Age Range</label>
        <select
          value={selectedAge}
          onChange={(e) => setSelectedAge(e.target.value)}
          style={selectStyle}
        >
          {ageBrackets.map((b) => (
            <option key={b.key} value={b.key} style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>
              {b.label}
            </option>
          ))}
        </select>
      </div>

      {/* Gender */}
      <div>
        <label style={filterLabelStyle}>Gender</label>
        <select
          value={selectedGender}
          onChange={(e) => setSelectedGender(e.target.value)}
          style={selectStyle}
        >
          {genders.map((g) => (
            <option key={g} value={g} style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>
              {g === "all" ? "All Genders" : g}
            </option>
          ))}
        </select>
      </div>

      {/* Language */}
      <div>
        <label style={filterLabelStyle}>Language</label>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          style={selectStyle}
        >
          {languages.map((l) => (
            <option key={l} value={l} style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>
              {l === "all" ? "All Languages" : l}
            </option>
          ))}
        </select>
      </div>

      {/* Paid / Unpaid */}
      <div>
        <label style={filterLabelStyle}>Compensation</label>
        <select
          value={selectedPayment}
          onChange={(e) => setSelectedPayment(e.target.value)}
          style={selectStyle}
        >
          {paymentOptions.map((p) => (
            <option key={p} value={p} style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>
              {p === "all" ? "All Comp Types" : p}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <PageHeader
        title="Live Casting Opportunities"
        subtitle="Explore verified casting briefs posted by certified organizations and published by the Vismaya team across OTT, TV commercials, and feature films."
        badge={`${publishedOpportunities.length} LIVE OPPORTUNITIES`}
        breadcrumbs={[
          { label: "Talent Dashboard", href: "/talent/dashboard" },
          { label: "Opportunities" },
        ]}
      />

      {/* Filter and Search Bar Card */}
      <div
        className="card-surface"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.07)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          borderRadius: "16px",
          padding: "clamp(16px, 3vw, 24px) clamp(16px, 3.5vw, 28px)",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
        }}
      >
        {/* Top Search Input & Mobile Filter Trigger */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center", flex: 1 }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "14px",
                color: "#a3acc2",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Search opportunity title, project, role, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px 12px 42px",
                backgroundColor: "rgba(255, 255, 255, 0.055)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                borderRadius: "12px",
                color: "#eceaf5",
                fontSize: "0.925rem",
                outline: "none",
                minHeight: "44px",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "12px",
                  color: "#a3acc2",
                  cursor: "pointer",
                  padding: "4px",
                  background: "none",
                  border: "none",
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Mobile Filter Button (< 768px) */}
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="mobile-filter-trigger"
            style={{
              minHeight: "44px",
              padding: "0 16px",
              borderRadius: "12px",
              backgroundColor: activeDropdownCount > 0 ? "var(--gold)" : "rgba(255, 255, 255, 0.08)",
              color: activeDropdownCount > 0 ? "#1a1300" : "#eceaf5",
              border: `1px solid ${activeDropdownCount > 0 ? "var(--gold)" : "rgba(255, 255, 255, 0.16)"}`,
              fontSize: "0.85rem",
              fontWeight: "700",
              display: "none",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <Filter size={15} />
            <span>Filters{activeDropdownCount > 0 ? ` (${activeDropdownCount})` : ""}</span>
          </button>
        </div>

        {/* Desktop Multi-Select Filters Row (>= 768px) */}
        <div className="desktop-filters-row">
          {renderFilterControls(false)}
        </div>

        {/* Filter Summary & Clear Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            paddingTop: "14px",
            fontSize: "0.85rem",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <span style={{ color: "#a3acc2" }}>
            Showing <strong style={{ color: "var(--gold)" }}>{filteredOpportunities.length}</strong> published opportunity{filteredOpportunities.length === 1 ? "" : "s"}
          </span>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              style={{
                fontSize: "0.8rem",
                color: "var(--gold)",
                fontWeight: "700",
                padding: "6px 12px",
                minHeight: "36px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <RotateCcw size={13} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Opportunities Grid (3 cols >= 1180px, 2 cols 768-1179px, 1 col < 768px) */}
      {!isHydrated ? (
        <div className="talent-cards-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-surface" style={{ padding: "24px", height: "320px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <Skeleton width="100%" height="135px" borderRadius="14px" />
              <Skeleton width="70%" height="24px" />
              <Skeleton width="90%" height="16px" />
              <Skeleton width="40%" height="16px" />
            </div>
          ))}
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <EmptyState
          title="No live opportunities match your filters"
          description="Try clearing your filters or broadening your search criteria to discover more published opportunities."
          iconName="Megaphone"
          actionLabel="Clear All Filters"
          onAction={clearAllFilters}
        />
      ) : (
        <div className="talent-cards-grid">
          {filteredOpportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              project={getProject(opp.projectId)}
              onApply={(o) => setSelectedOpportunityForApply(o)}
            />
          ))}
        </div>
      )}

      {/* Mobile Filter Bottom Sheet / Modal */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filter Opportunities"
        subtitle="Narrow down casting calls by type, location, age, and compensation."
        maxWidth="500px"
        footer={
          <div style={{ display: "flex", gap: "10px", width: "100%" }}>
            {activeDropdownCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="btn-secondary"
                style={{ flex: 1, minHeight: "44px", borderRadius: "12px" }}
              >
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(false)}
              className="btn-primary"
              style={{ flex: 2, minHeight: "44px", borderRadius: "12px" }}
            >
              Show {filteredOpportunities.length} Result{filteredOpportunities.length === 1 ? "" : "s"}
            </button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {renderFilterControls(true)}
        </div>
      </Modal>

      {/* Apply Confirmation Modal */}
      {selectedOpportunityForApply && (
        <OpportunityApplyModal
          isOpen={!!selectedOpportunityForApply}
          onClose={() => setSelectedOpportunityForApply(null)}
          opportunity={selectedOpportunityForApply}
          project={getProject(selectedOpportunityForApply.projectId)}
        />
      )}

      <style jsx>{`
        @media (max-width: 767.98px) {
          .mobile-filter-trigger {
            display: inline-flex !important;
          }
          .desktop-filters-row {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

const filterLabelStyle = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: "700",
  color: "#a3acc2",
  marginBottom: "4px",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const selectStyle = {
  width: "100%",
  padding: "10px 12px",
  backgroundColor: "rgba(255, 255, 255, 0.055)",
  border: "1px solid rgba(255, 255, 255, 0.14)",
  borderRadius: "12px",
  color: "#eceaf5",
  fontSize: "0.85rem",
  outline: "none",
};
