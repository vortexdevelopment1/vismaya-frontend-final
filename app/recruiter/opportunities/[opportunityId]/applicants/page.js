"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  ArrowLeft,
  MapPin,
  Calendar,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Video,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { useWorkflow } from "@/lib/shared/workflowStore";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";

export default function OpportunityApplicantsPage() {
  const params = useParams();
  const router = useRouter();
  const opportunityId = params?.opportunityId;

  const {
    opportunities,
    projects,
    applications,
    auditions,
    isHydrated,
  } = useWorkflow();

  const opportunity = useMemo(
    () => opportunities.find((o) => o.id === opportunityId),
    [opportunities, opportunityId]
  );

  const project = useMemo(
    () => (opportunity ? projects.find((p) => p.id === opportunity.projectId) : null),
    [projects, opportunity]
  );

  const oppApplications = useMemo(
    () => applications.filter((a) => a.opportunityId === opportunityId),
    [applications, opportunityId]
  );

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [ageRangeFilter, setAgeRangeFilter] = useState("ALL");

  // Unique cities from applicants
  const cities = useMemo(() => {
    const set = new Set();
    oppApplications.forEach((app) => {
      if (app.talentProfile?.city) {
        set.add(app.talentProfile.city);
      }
    });
    return Array.from(set);
  }, [oppApplications]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = {
      ALL: oppApplications.length,
      Applied: 0,
      "Under Review": 0,
      Shortlisted: 0,
      Selected: 0,
      "Not Selected": 0,
      Withdrawn: 0,
    };
    oppApplications.forEach((app) => {
      if (counts[app.status] !== undefined) {
        counts[app.status]++;
      }
    });
    return counts;
  }, [oppApplications]);

  // Filtered Applicants
  const filteredApplicants = useMemo(() => {
    return oppApplications.filter((app) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (app.talentName || "").toLowerCase();
        const stageName = (app.talentProfile?.stageName || "").toLowerCase();
        const role = (app.roleApplied || "").toLowerCase();
        const city = (app.talentProfile?.city || "").toLowerCase();
        const skills = (app.talentProfile?.skills || []).join(" ").toLowerCase();

        const match =
          name.includes(q) ||
          stageName.includes(q) ||
          role.includes(q) ||
          city.includes(q) ||
          skills.includes(q);

        if (!match) return false;
      }

      // Status
      if (statusFilter !== "ALL" && app.status !== statusFilter) {
        return false;
      }

      // City
      if (cityFilter !== "ALL" && app.talentProfile?.city !== cityFilter) {
        return false;
      }

      // Age Range
      if (ageRangeFilter !== "ALL") {
        const age = Number(app.talentProfile?.age) || 0;
        if (ageRangeFilter === "u22" && !(age < 22)) return false;
        if (ageRangeFilter === "22-25" && !(age >= 22 && age <= 25)) return false;
        if (ageRangeFilter === "26-30" && !(age >= 26 && age <= 30)) return false;
        if (ageRangeFilter === "30+" && !(age > 30)) return false;
      }

      return true;
    });
  }, [oppApplications, searchQuery, statusFilter, cityFilter, ageRangeFilter]);

  const getStatusBadge = (status) => {
    return <StatusBadge status={status} size="sm" />;
  };

  const getAuditionForApp = (appId) => {
    return auditions.find((aud) => aud.applicationId === appId);
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "—";
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (!isHydrated) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ height: "48px", background: "rgba(255, 255, 255, 0.06)", borderRadius: "12px", width: "40%" }} />
        <div style={{ height: "300px", background: "rgba(255, 255, 255, 0.06)", borderRadius: "16px" }} />
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div
        style={{
          backgroundColor: "var(--bg-glass)",
          border: "1px solid var(--border-glass)",
          borderRadius: "16px",
          padding: "48px 24px",
          textAlign: "center",
          maxWidth: "600px",
          margin: "40px auto",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(16px)",
        }}
      >
        <AlertCircle size={48} style={{ color: "var(--gold)", marginBottom: "16px" }} />
        <h2 style={{ fontSize: "1.25rem", color: "#eceaf5", marginBottom: "8px" }}>
          Opportunity Not Found
        </h2>
        <p style={{ color: "#a3acc2", fontSize: "0.9rem", marginBottom: "24px" }}>
          The opportunity you requested does not exist or may have been removed.
        </p>
        <Link
          href="/recruiter/opportunities"
          className="btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
            borderRadius: "12px",
          }}
        >
          <ArrowLeft size={16} /> Back to Opportunities
        </Link>
      </div>
    );
  }

  const selectStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "0.825rem",
    color: "#eceaf5",
    outline: "none",
    cursor: "pointer",
    colorScheme: "dark",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Page Header */}
      <PageHeader
        title={`Applicants (${oppApplications.length})`}
        subtitle={`Review and screen candidates who applied for ${opportunity.title}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/recruiter/dashboard" },
          { label: "Opportunities", href: "/recruiter/opportunities" },
          { label: opportunity.title, href: `/recruiter/projects/${opportunity.projectId}` },
          { label: "Applicants" },
        ]}
        actions={
          <Link
            href="/recruiter/opportunities"
            className="btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              fontSize: "0.875rem",
              textDecoration: "none",
              borderRadius: "12px",
            }}
          >
            <ArrowLeft size={16} />
            <span>All Opportunities</span>
          </Link>
        }
      />

      {/* Opportunity Overview Card */}
      <div
        style={{
          backgroundColor: "var(--bg-glass)",
          border: "1px solid var(--border-glass)",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: "700",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "var(--gold)",
                backgroundColor: "rgba(255, 188, 0, 0.12)",
                border: "1px solid rgba(255, 188, 0, 0.3)",
                padding: "3px 10px",
                borderRadius: "8px",
              }}
            >
              {project ? project.title : "Project"}
            </span>
            <span style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.2)" }}>•</span>
            <span style={{ fontSize: "0.85rem", color: "#eceaf5", fontWeight: "600" }}>
              {opportunity.opportunityType}
            </span>
            <span style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.2)" }}>•</span>
            <span style={{ fontSize: "0.85rem", color: "#a3acc2" }}>
              Deadline: {formatDate(opportunity.deadline)}
            </span>
          </div>
          <h2
            style={{
              fontSize: "1.15rem",
              fontWeight: "700",
              color: "#eceaf5",
              margin: 0,
            }}
          >
            {opportunity.title}
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#a3acc2", margin: 0 }}>
            {opportunity.summary || opportunity.fullBrief}
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link
            href="/recruiter/shortlist-auditions"
            className="btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "0 16px",
              height: "36px",
              fontSize: "13px",
              fontWeight: "600",
              textDecoration: "none",
              borderRadius: "10px",
            }}
          >
            <Video size={15} style={{ color: "var(--gold)" }} />
            <span>Shortlist & Auditions</span>
          </Link>
        </div>
      </div>

      {/* Status Summary Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "4px",
        }}
      >
        {[
          { key: "ALL", label: "All Applicants", count: statusCounts.ALL },
          { key: "Applied", label: "Applied", count: statusCounts.Applied },
          { key: "Under Review", label: "Under Review", count: statusCounts["Under Review"] },
          { key: "Shortlisted", label: "Shortlisted", count: statusCounts.Shortlisted },
          { key: "Selected", label: "Selected", count: statusCounts.Selected },
          { key: "Not Selected", label: "Not Selected", count: statusCounts["Not Selected"] },
          { key: "Withdrawn", label: "Withdrawn", count: statusCounts.Withdrawn },
        ].map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "0 14px",
                height: "36px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: isActive ? "700" : "500",
                backgroundColor: isActive ? "var(--gold)" : "var(--bg-glass)",
                color: isActive ? "var(--gold-text)" : "#a3acc2",
                border: `1px solid ${isActive ? "var(--gold)" : "var(--border-glass)"}`,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  padding: "2px 7px",
                  borderRadius: "10px",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  backgroundColor: isActive ? "rgba(26, 19, 0, 0.25)" : "rgba(255, 255, 255, 0.08)",
                  color: isActive ? "var(--gold-text)" : "#a3acc2",
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Dropdown Filter Controls */}
      <div
        style={{
          backgroundColor: "var(--bg-glass)",
          border: "1px solid var(--border-glass)",
          borderRadius: "16px",
          padding: "16px 20px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "14px",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        {/* Search Input */}
        <div
          style={{
            flex: "1 1 240px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: "10px",
            padding: "8px 14px",
            height: "38px",
          }}
        >
          <Search size={16} style={{ color: "#a3acc2" }} />
          <input
            type="text"
            placeholder="Search candidate name, role, skills, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: "0.875rem",
              color: "#eceaf5",
              width: "100%",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                border: "none",
                background: "transparent",
                color: "#a3acc2",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* City Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.8rem", color: "#a3acc2", fontWeight: "600" }}>City:</span>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="ALL" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>All Cities</option>
            {cities.map((city) => (
              <option key={city} value={city} style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Age Range Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.8rem", color: "#a3acc2", fontWeight: "600" }}>Age:</span>
          <select
            value={ageRangeFilter}
            onChange={(e) => setAgeRangeFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="ALL" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>All Ages</option>
            <option value="u22" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Under 22</option>
            <option value="22-25" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>22 - 25 years</option>
            <option value="26-30" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>26 - 30 years</option>
            <option value="30+" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>30+ years</option>
          </select>
        </div>

        {(searchQuery || statusFilter !== "ALL" || cityFilter !== "ALL" || ageRangeFilter !== "ALL") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("ALL");
              setCityFilter("ALL");
              setAgeRangeFilter("ALL");
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--gold)",
              fontSize: "0.8rem",
              fontWeight: "600",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Applicants List / Table */}
      {filteredApplicants.length === 0 ? (
        <div
          style={{
            backgroundColor: "var(--bg-glass)",
            border: "1px solid var(--border-glass)",
            borderRadius: "16px",
            padding: "48px 20px",
            textAlign: "center",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
            backdropFilter: "blur(16px)",
          }}
        >
          <Users size={40} style={{ color: "var(--gold)", marginBottom: "12px" }} />
          <h3 style={{ fontSize: "1.05rem", color: "#eceaf5", marginBottom: "6px" }}>
            No Applicants Found
          </h3>
          <p style={{ color: "#a3acc2", fontSize: "0.85rem", maxWidth: "440px", margin: "0 auto" }}>
            {searchQuery || statusFilter !== "ALL" || cityFilter !== "ALL" || ageRangeFilter !== "ALL"
              ? "No applicants match the current filter criteria. Try adjusting or clearing your filters."
              : "No candidates have applied to this opportunity yet. Once published opportunities receive submissions, they will appear here."}
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "var(--bg-glass)",
            border: "1px solid var(--border-glass)",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <div style={{ overflowX: "auto" }} className="desktop-applicants-table">
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#0d1424" }}>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                    color: "#a3acc2",
                    fontWeight: "600",
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  <th style={{ padding: "16px 20px" }}>Talent / Candidate</th>
                  <th style={{ padding: "16px 20px" }}>Applied Role</th>
                  <th style={{ padding: "16px 20px" }}>Age & Location</th>
                  <th style={{ padding: "16px 20px" }}>Applied Date</th>
                  <th style={{ padding: "16px 20px" }}>Audition / Media</th>
                  <th style={{ padding: "16px 20px" }}>Status</th>
                  <th style={{ padding: "16px 20px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplicants.map((app) => {
                  const prof = app.talentProfile || {};
                  const aud = getAuditionForApp(app.id);
                  const profileUrl = `/recruiter/applications/${app.id}?from=applicants&opp=${opportunityId}`;

                  return (
                    <tr
                      key={app.id}
                      onClick={() => router.push(profileUrl)}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                        cursor: "pointer",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* Talent Info */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {prof.avatar ? (
                            <img
                              src={prof.avatar}
                              alt={app.talentName}
                              style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "12px",
                                objectFit: "cover",
                                border: "1px solid rgba(255, 255, 255, 0.15)",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "12px",
                                background: "linear-gradient(135deg, #0f1626 0%, #070b12 100%)",
                                color: "var(--gold)",
                                border: "1px solid rgba(255, 188, 0, 0.3)",
                                display: "flex",
                                alignItems: "center",
                                justifyCenter: "center",
                                fontWeight: "700",
                                fontSize: "0.9rem",
                              }}
                            >
                              {(app.talentName || "T")[0]}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: "700", color: "#eceaf5" }}>
                              {app.talentName || "Talent"}
                            </div>
                            {prof.stageName && prof.stageName !== app.talentName && (
                              <div style={{ fontSize: "0.75rem", color: "#a3acc2" }}>
                                aka {prof.stageName}
                              </div>
                            )}
                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
                              {(prof.skills || []).slice(0, 2).map((s, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: "0.7rem",
                                    padding: "2px 6px",
                                    borderRadius: "6px",
                                    backgroundColor: "rgba(255, 188, 0, 0.12)",
                                    color: "var(--gold)",
                                    border: "1px solid rgba(255, 188, 0, 0.28)",
                                    fontWeight: "600",
                                  }}
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Applied Role */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontWeight: "600", color: "#eceaf5" }}>
                          {app.roleApplied || "Lead Role"}
                        </div>
                      </td>

                      {/* Age & Location */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ color: "#eceaf5", fontWeight: "500" }}>
                            {prof.age ? `${prof.age} yrs` : "—"} • {prof.gender || "—"}
                          </span>
                          <span
                            style={{
                              fontSize: "0.785rem",
                              color: "#a3acc2",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <MapPin size={12} style={{ color: "var(--gold)" }} />
                            {prof.city || "Mumbai"}
                          </span>
                        </div>
                      </td>

                      {/* Applied Date */}
                      <td style={{ padding: "16px 20px", color: "#a3acc2", fontSize: "0.825rem" }}>
                        {formatDate(app.appliedAt)}
                      </td>

                      {/* Audition / Media Indicator */}
                      <td style={{ padding: "16px 20px" }}>
                        {aud ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Video size={15} style={{ color: "var(--gold)" }} />
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                color:
                                  aud.status === "Forwarded to Organization"
                                    ? "#34d399"
                                    : aud.status === "Self-tape Received"
                                    ? "var(--gold)"
                                    : "#8ab4ff",
                              }}
                            >
                              {aud.status}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "#7c869e" }}>
                            None requested
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: "16px 20px" }}>
                        {getStatusBadge(app.status)}
                      </td>

                      {/* Action */}
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <Link
                          href={profileUrl}
                          className="btn-ghost"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "0 12px",
                            height: "36px",
                            fontSize: "13px",
                            color: "var(--gold)",
                            fontWeight: "600",
                            textDecoration: "none",
                            borderRadius: "10px",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>Review</span>
                          <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Stack */}
          <div style={{ display: "none", flexDirection: "column", gap: "12px", padding: "14px" }} className="mobile-applicants-stack">
            {filteredApplicants.map((app) => {
              const prof = app.talentProfile || {};
              const aud = getAuditionForApp(app.id);
              const profileUrl = `/recruiter/applications/${app.id}?from=applicants&opp=${opportunityId}`;

              return (
                <div
                  key={`mob-app-${app.id}`}
                  onClick={() => router.push(profileUrl)}
                  style={{
                    padding: "16px",
                    borderRadius: "14px",
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {prof.avatar ? (
                        <img
                          src={prof.avatar}
                          alt={app.talentName}
                          style={{ width: "40px", height: "40px", borderRadius: "10px", objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "10px",
                            backgroundColor: "rgba(255, 188, 0, 0.12)",
                            color: "var(--gold)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                          }}
                        >
                          {(app.talentName || "T")[0]}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, color: "#eceaf5", fontSize: "0.95rem" }}>
                          {app.talentName}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          Role: <strong style={{ color: "var(--gold)" }}>{app.roleApplied}</strong>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(app.status)}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", borderTop: "1px solid rgba(255, 255, 255, 0.06)", paddingTop: "8px" }}>
                    <span>{prof.age ? `${prof.age} yrs` : ""} • {prof.city || "Mumbai"}</span>
                    <span>Applied: {formatDate(app.appliedAt)}</span>
                  </div>

                  {aud && (
                    <div style={{ fontSize: "0.75rem", color: "var(--gold)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Video size={13} />
                      <span>Audition: {aud.status}</span>
                    </div>
                  )}

                  <Link
                    href={profileUrl}
                    className="btn-primary"
                    style={{ padding: "0 12px", height: "40px", fontSize: "13px", fontWeight: "600", justifyContent: "center", marginTop: "4px", borderRadius: "10px" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>Review applicant profile</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 767.98px) {
          .desktop-applicants-table {
            display: none !important;
          }
          .mobile-applicants-stack {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
