"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  Video,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Search,
  MoreHorizontal,
  Eye,
  ArrowLeft,
  FolderKanban,
  Calendar,
} from "lucide-react";
import { useWorkflow } from "@/lib/shared/workflowStore";
import Modal from "@/components/shared/Modal";
import VideoPlayer from "@/components/shared/VideoPlayer";

function formatPostedDate(dateStr) {
  if (!dateStr) return "recently";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "recently";
    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (e) {
    return "recently";
  }
}

export default function ShortlistAuditionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    opportunities,
    applications,
    auditions,
    projects,
    setApplicationStatus,
    requestAudition,
    isHydrated,
  } = useWorkflow();

  const orgId = "org-1";

  // Filter org opportunities
  const orgOpportunities = useMemo(() => {
    return opportunities.filter((o) => o.orgId === orgId || !o.orgId);
  }, [opportunities]);

  // Read opportunity from URL query parameter (?opportunity=id or ?opp=id)
  const oppParam = searchParams?.get("opportunity") || searchParams?.get("opp") || null;

  const selectedOpp = useMemo(() => {
    if (!oppParam || oppParam === "ALL") return null;
    return orgOpportunities.find((o) => o.id === oppParam) || null;
  }, [orgOpportunities, oppParam]);

  // Read initial filter values for Level 2
  const initialStage = searchParams?.get("stage") || "all";
  const initialQ = searchParams?.get("q") || "";

  const [currentTab, setCurrentTab] = useState(initialStage);
  const [searchQuery, setSearchQuery] = useState(initialQ);

  // Sync Level 2 filter/search state into URL query params
  useEffect(() => {
    if (typeof window === "undefined" || !selectedOpp) return;
    const params = new URLSearchParams(window.location.search);
    params.set("opportunity", selectedOpp.id);
    if (currentTab && currentTab !== "all") {
      params.set("stage", currentTab);
    } else {
      params.delete("stage");
    }
    if (searchQuery && searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    } else {
      params.delete("q");
    }

    const qs = params.toString();
    const newUrl = `/recruiter/shortlist-auditions${qs ? `?${qs}` : ""}`;
    const currentUrl = window.location.pathname + window.location.search;
    if (newUrl !== currentUrl) {
      window.history.replaceState(null, "", newUrl);
    }
  }, [selectedOpp, currentTab, searchQuery]);

  // Navigation handlers
  const handleSelectOpportunity = (oppId) => {
    setCurrentTab("all");
    setSearchQuery("");
    router.push(`/recruiter/shortlist-auditions?opportunity=${encodeURIComponent(oppId)}`);
  };

  const handleBackToLevel1 = () => {
    setCurrentTab("all");
    setSearchQuery("");
    router.push("/recruiter/shortlist-auditions");
  };

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Overflow menu state
  const [activeMenuAppId, setActiveMenuAppId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuAppId(null);
      }
    };
    if (activeMenuAppId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeMenuAppId]);

  // Modals state
  const [reviewVideoModalApp, setReviewVideoModalApp] = useState(null);
  const [auditionModalApp, setAuditionModalApp] = useState(null);
  const [auditionType, setAuditionType] = useState("Audition");
  const [auditionNote, setAuditionNote] = useState("");
  const [auditionDate, setAuditionDate] = useState("");

  const [selectedModalApp, setSelectedModalApp] = useState(null);
  const [selectedNote, setSelectedNote] = useState("");

  const [notSelectedModalApp, setNotSelectedModalApp] = useState(null);
  const [notSelectedReason, setNotSelectedReason] = useState("");

  // Helpers for opportunity statistics (Level 1)
  const getOpportunityStats = (oppId) => {
    const apps = applications.filter((a) => a.opportunityId === oppId);
    const auds = auditions.filter(
      (aud) => aud.opportunityId === oppId || apps.some((a) => a.id === aud.applicationId)
    );
    const applied = apps.length;
    const shortlist = apps.filter(
      (a) => a.status === "Shortlisted" || a.status === "Selected"
    ).length;
    const audition = auds.length;
    return { applied, shortlist, audition };
  };

  // Applications belonging to selected opportunity (Level 2)
  const oppApplications = useMemo(() => {
    if (!selectedOpp) return [];
    return applications.filter((app) => app.opportunityId === selectedOpp.id);
  }, [applications, selectedOpp]);

  // Auditions for selected opportunity (Level 2)
  const oppAuditions = useMemo(() => {
    if (!selectedOpp) return [];
    const appIds = oppApplications.map((a) => a.id);
    return auditions.filter(
      (aud) => aud.opportunityId === selectedOpp.id || appIds.includes(aud.applicationId)
    );
  }, [auditions, selectedOpp, oppApplications]);

  // Map application to stage key: 'rev' | 'short' | 'req' | 'tal' | 'sel' | 'no' | 'applied'
  const getAppStage = (app) => {
    if (app.status === "Selected") return "sel";
    if (app.status === "Not Selected") return "no";
    const aud = auditions.find((a) => a.applicationId === app.id);
    if (aud) {
      if (aud.status === "Forwarded to Organization" || aud.status === "Self-tape Received") {
        return "rev";
      }
      if (aud.status === "Relayed to Talent") {
        return "tal";
      }
      return "req";
    }
    if (app.status === "Shortlisted") return "short";
    return "applied";
  };

  const STAGE_PRIORITY = ["rev", "short", "req", "tal", "applied", "sel", "no"];

  const getAuditionForApp = (appId) => auditions.find((a) => a.applicationId === appId);
  const getProjectForOpp = (opp) => (opp ? projects.find((p) => p.id === opp.projectId) : null);

  const getProjectRoleSubtitle = (proj, opp) => {
    const oppTitle = opp?.title || "";
    const projTitle = proj?.title || "";
    if (!projTitle) return oppTitle || "Opportunity";
    if (!oppTitle) return projTitle;
    if (oppTitle.toLowerCase().includes(projTitle.toLowerCase())) {
      return oppTitle;
    }
    if (projTitle.toLowerCase().includes(oppTitle.toLowerCase())) {
      return projTitle;
    }
    return `${projTitle} • ${oppTitle}`;
  };

  // Tabs for Level 2
  const TABS = useMemo(
    () => [
      { key: "all", label: "All", filter: () => true },
      { key: "applied", label: "Applied", filter: (app) => getAppStage(app) === "applied" },
      { key: "short", label: "Shortlisted", filter: (app) => getAppStage(app) === "short" },
      {
        key: "aud",
        label: "Audition",
        filter: (app) => {
          const s = getAppStage(app);
          return s === "rev" || s === "req" || s === "tal";
        },
      },
      { key: "sel", label: "Selected", filter: (app) => getAppStage(app) === "sel" },
      { key: "no", label: "Not selected", filter: (app) => getAppStage(app) === "no" },
    ],
    [auditions]
  );

  // Tab counts for Level 2
  const tabCounts = useMemo(() => {
    const counts = {};
    TABS.forEach((t) => {
      counts[t.key] = oppApplications.filter(t.filter).length;
    });
    return counts;
  }, [TABS, oppApplications]);

  // Level 2 "Need action" count
  const needActionCount = useMemo(() => {
    return oppApplications.filter((app) => {
      const s = getAppStage(app);
      return s === "short" || s === "rev" || s === "applied";
    }).length;
  }, [oppApplications, auditions]);

  // Filtered & sorted candidates for Level 2
  const displayApplications = useMemo(() => {
    const activeTabObj = TABS.find((t) => t.key === currentTab) || TABS[0];
    let list = oppApplications.filter(activeTabObj.filter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((app) => {
        const name = (app.talentName || "").toLowerCase();
        const role = (app.roleApplied || "").toLowerCase();
        const city = (app.talentProfile?.city || "").toLowerCase();
        return name.includes(q) || role.includes(q) || city.includes(q);
      });
    }

    list.sort((a, b) => {
      const pA = STAGE_PRIORITY.indexOf(getAppStage(a));
      const pB = STAGE_PRIORITY.indexOf(getAppStage(b));
      if (pA !== pB) return pA - pB;
      const dateA = new Date(app.appliedDate || app.appliedAt || app.createdAt || 0).getTime();
      const dateB = new Date(b.appliedDate || b.appliedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return list;
  }, [TABS, currentTab, oppApplications, searchQuery, auditions]);

  // Action handlers
  const handleShortlistApplicant = (app) => {
    setApplicationStatus(
      app.id,
      "Shortlisted",
      "Shortlisted for casting callback / audition.",
      "Zee Films"
    );
    showToast(`${app.talentName} has been shortlisted.`);
  };

  const handleOpenAuditionModal = (app) => {
    setActiveMenuAppId(null);
    const opp = opportunities.find((o) => o.id === app.opportunityId);
    setAuditionModalApp(app);
    setAuditionType("Audition");
    setAuditionDate("");
    setAuditionNote(
      opp
        ? `Please record a self-tape for '${app.roleApplied}' focusing on natural dialogue delivery and camera presence.`
        : ""
    );
  };

  const handleSubmitAudition = (e) => {
    e.preventDefault();
    if (!auditionModalApp) return;
    requestAudition({
      applicationId: auditionModalApp.id,
      type: auditionType,
      note: auditionNote,
      preferredDate: auditionDate || undefined,
    });
    showToast(`Audition request for ${auditionModalApp.talentName} sent to Vismaya Casting Desk.`);
    setAuditionModalApp(null);
  };

  const handleConfirmSelect = (e) => {
    e.preventDefault();
    if (!selectedModalApp) return;
    setApplicationStatus(
      selectedModalApp.id,
      "Selected",
      selectedNote || "Final selection confirmed for production.",
      "Zee Films"
    );
    showToast(`${selectedModalApp.talentName} has been marked as Selected for the role.`);
    setSelectedModalApp(null);
    if (reviewVideoModalApp?.id === selectedModalApp.id) {
      setReviewVideoModalApp(null);
    }
  };

  const handleConfirmNotSelected = (e) => {
    e.preventDefault();
    if (!notSelectedModalApp) return;
    setApplicationStatus(
      notSelectedModalApp.id,
      "Not Selected",
      notSelectedReason || "Candidate not selected for this role.",
      "Zee Films"
    );
    showToast(`${notSelectedModalApp.talentName} has been marked as Not Selected.`);
    setNotSelectedModalApp(null);
    if (reviewVideoModalApp?.id === notSelectedModalApp.id) {
      setReviewVideoModalApp(null);
    }
  };

  const handleOpenReviewModal = (app) => {
    setActiveMenuAppId(null);
    setReviewVideoModalApp(app);
  };

  const getInitials = (name) => {
    if (!name) return "T";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // Status pill renderer
  const renderStatusPill = (stage, app) => {
    if (stage === "rev") {
      return (
        <span className="v-stage-status-pill rev">
          <span className="v-pill-dot" />
          <span>Self-tape ready</span>
          <span className="v-pill-time">01:24</span>
        </span>
      );
    }
    if (stage === "short") {
      return (
        <span className="v-stage-status-pill short">
          <span className="v-pill-dot" />
          <span>Shortlisted</span>
        </span>
      );
    }
    if (stage === "req" || stage === "tal") {
      return (
        <span className="v-stage-status-pill aud">
          <span className="v-pill-dot" />
          <span>Audition / Interview</span>
        </span>
      );
    }
    if (stage === "sel") {
      return (
        <span className="v-stage-status-pill sel">
          <span className="v-pill-dot" />
          <span>Selected for role</span>
        </span>
      );
    }
    if (stage === "no") {
      return (
        <span className="v-stage-status-pill no">
          <span>Not selected</span>
        </span>
      );
    }
    return (
      <span className="v-stage-status-pill applied">
        <span className="v-pill-dot" />
        <span>Applied</span>
      </span>
    );
  };

  // Skeleton during hydration
  if (!isHydrated) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ height: "48px", background: "#F3EFE6", borderRadius: "12px", width: "40%" }} />
        <div style={{ height: "120px", background: "#FFFFFF", border: "1px solid #E8E2D4", borderRadius: "16px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: "280px", background: "#FFFFFF", border: "1px solid #E8E2D4", borderRadius: "16px" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="v-shortlist-page-wrapper">
      {/* Toast Notification */}
      {toastMessage && (
        <div role="status" aria-live="polite" className="v-toast-notification">
          <CheckCircle2 size={18} style={{ color: "#8A6B2E", flexShrink: 0 }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          LEVEL 1: OPPORTUNITY CARDS (DEFAULT VIEW)
          ========================================================================= */}
      {!selectedOpp ? (
        <div className="v-level1-container">
          {/* Header */}
          <div className="v-page-header-wrap">
            <nav aria-label="Breadcrumb" className="v-breadcrumb-nav">
              <Link href="/recruiter/dashboard" className="v-breadcrumb-link">
                Organization Dashboard
              </Link>
              <span className="v-breadcrumb-sep">&gt;</span>
              <span className="v-breadcrumb-active">Shortlist &amp; Auditions</span>
            </nav>

            <div className="v-header-title-row">
              <h1 className="v-page-title">Shortlist &amp; Auditions</h1>
              <span className="v-pill-opportunities">{orgOpportunities.length} OPPORTUNITIES</span>
            </div>

            <p className="v-page-description">
              Choose an opportunity to review the talents who applied to it.
            </p>
          </div>

          {/* Cards Grid or Empty State */}
          {orgOpportunities.length === 0 ? (
            <div className="v-empty-state-card">
              <div className="v-empty-icon-wrap">
                <FolderKanban size={32} />
              </div>
              <h3 className="v-empty-title">No Opportunities Found</h3>
              <p className="v-empty-desc">
                Post your first casting opportunity to review applicants, manage shortlists, and request self-tape auditions.
              </p>
              <Link href="/recruiter/opportunities/new" className="v-empty-action-btn">
                Post Opportunity
              </Link>
            </div>
          ) : (
            <div className="v-opportunity-grid">
              {orgOpportunities.map((opp) => {
                const stats = getOpportunityStats(opp.id);
                const isClosed =
                  opp.status === "Completed" ||
                  opp.status === "Cancelled" ||
                  opp.status === "Closed";
                const typeBadge = (opp.opportunityType || "CASTING CALL").toUpperCase();
                const city = opp.location || opp.eligibility?.location || "Mumbai";
                const postedDate = formatPostedDate(opp.publishedAt || opp.createdAt);

                return (
                  <div
                    key={`opp-card-${opp.id}`}
                    className="v-opp-card"
                    onClick={() => handleSelectOpportunity(opp.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleSelectOpportunity(opp.id);
                      }
                    }}
                  >
                    {/* 1. Top Row: Type Badge + Status Pill */}
                    <div className="v-opp-card-top-row">
                      <span className="v-opp-type-badge">{typeBadge}</span>
                      {isClosed ? (
                        <span className="v-opp-status-pill closed">CLOSED</span>
                      ) : (
                        <span className="v-opp-status-pill open">OPEN</span>
                      )}
                    </div>

                    {/* 2. Opportunity Title (Playfair, 2 lines max) */}
                    <h2 className="v-opp-card-title" title={opp.title}>
                      {opp.title}
                    </h2>

                    {/* 3. Meta Line: city + "Posted <date>" */}
                    <div className="v-opp-card-meta">
                      <span>{city}</span>
                      <span className="v-meta-dot">•</span>
                      <span>Posted {postedDate}</span>
                    </div>

                    {/* 4. 3 Count Boxes Row: APPLIED, SHORTLIST, AUDITION */}
                    <div className="v-opp-count-boxes-row">
                      <div className="v-opp-count-box">
                        <span className="v-opp-count-num">{stats.applied}</span>
                        <span className="v-opp-count-lbl">APPLIED</span>
                      </div>
                      <div className="v-opp-count-box">
                        <span className="v-opp-count-num">{stats.shortlist}</span>
                        <span className="v-opp-count-lbl">SHORTLIST</span>
                      </div>
                      <div className="v-opp-count-box">
                        <span className="v-opp-count-num">{stats.audition}</span>
                        <span className="v-opp-count-lbl">AUDITION</span>
                      </div>
                    </div>

                    {/* 5. Bottom Full-width Button */}
                    <div className="v-opp-card-bottom">
                      {stats.applied > 0 ? (
                        <button
                          type="button"
                          className="v-opp-card-btn filled"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectOpportunity(opp.id);
                          }}
                        >
                          <span>VIEW APPLICANTS</span>
                          <span className="v-arrow-glyph">→</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="v-opp-card-btn outlined disabled"
                          disabled
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>NO APPLICANTS YET</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* =========================================================================
            LEVEL 2: APPLICANTS FOR SELECTED OPPORTUNITY
            ========================================================================= */
        <div className="v-level2-container">
          {/* Header */}
          <div className="v-page-header-wrap">
            <button
              type="button"
              onClick={handleBackToLevel1}
              className="v-back-btn"
            >
              <ArrowLeft size={14} />
              <span>← BACK TO OPPORTUNITIES</span>
            </button>

            <nav aria-label="Breadcrumb" className="v-breadcrumb-nav">
              <button
                type="button"
                onClick={handleBackToLevel1}
                className="v-breadcrumb-btn-link"
              >
                Shortlist &amp; Auditions
              </button>
              <span className="v-breadcrumb-sep">&gt;</span>
              <span className="v-breadcrumb-active">{selectedOpp.title}</span>
            </nav>

            <div className="v-header-title-row">
              <h1 className="v-page-title">{selectedOpp.title}</h1>
              <span className="v-pill-opp-meta">
                {selectedOpp.opportunityType || "Opportunity"} · {selectedOpp.status || "Open"}
              </span>
            </div>

            <p className="v-page-subtitle">
              {selectedOpp.roles?.[0]?.roleName || selectedOpp.opportunityType || "All Roles"} · {oppApplications.length} talents applied
            </p>
          </div>

          {/* 3 Summary Boxes (APPLIED, SHORTLISTED, AUDITIONS) */}
          <div className="v-summary-boxes-grid">
            <div className="v-summary-box">
              <span className="v-summary-box-lbl">APPLIED</span>
              <span className="v-summary-box-num">{oppApplications.length}</span>
              <span className="v-summary-box-desc">Total Submissions</span>
            </div>
            <div className="v-summary-box">
              <span className="v-summary-box-lbl">SHORTLISTED</span>
              <span className="v-summary-box-num">
                {oppApplications.filter((a) => a.status === "Shortlisted" || a.status === "Selected").length}
              </span>
              <span className="v-summary-box-desc">Under Consideration</span>
            </div>
            <div className="v-summary-box">
              <span className="v-summary-box-lbl">AUDITIONS</span>
              <span className="v-summary-box-num">{oppAuditions.length}</span>
              <span className="v-summary-box-desc">Self-tapes &amp; Relays</span>
            </div>
          </div>

          {/* Toolbar: Search + Filter Chips */}
          <div className="v-toolbar-card">
            <div className="v-toolbar-top">
              <div className="v-search-box">
                <Search size={16} className="v-search-icon" />
                <input
                  className="v-search-input"
                  type="text"
                  placeholder="Search candidates by name, role or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search candidates"
                />
              </div>
            </div>

            <div className="v-tabs-row">
              <div className="v-tabs-scroll-container" role="tablist">
                {TABS.map((tab) => {
                  const isActive = currentTab === tab.key;
                  const count = tabCounts[tab.key] || 0;

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setCurrentTab(tab.key)}
                      className={`v-tab-btn ${isActive ? "active" : ""}`}
                    >
                      <span>{tab.label}</span>
                      <span className="v-tab-count-pill">{count}</span>
                    </button>
                  );
                })}
              </div>

              {needActionCount > 0 && (
                <div className="v-need-action-tag">
                  <span className="v-action-dot" />
                  <span>
                    <strong>{needActionCount}</strong> need your action
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Candidate Cards Grid */}
          <div className="v-candidate-grid">
            {displayApplications.length === 0 ? (
              <div className="v-empty-state-card">
                <div className="v-empty-icon-wrap">
                  <Users size={32} />
                </div>
                <h3 className="v-empty-title">No candidates found</h3>
                <p className="v-empty-desc">
                  {searchQuery
                    ? `No candidates matching "${searchQuery}" for this filter.`
                    : "No candidates currently in this stage for this opportunity."}
                </p>
              </div>
            ) : (
              displayApplications.map((app) => {
                const prof = app.talentProfile || {};
                const aud = getAuditionForApp(app.id);
                const proj = getProjectForOpp(selectedOpp);
                const stage = getAppStage(app);
                const isClosed = stage === "no";
                const profileUrl = `/recruiter/applications/${app.id}?from=shortlist&opp=${app.opportunityId}`;

                const isActionShort = stage === "short";
                const isActionRev = stage === "rev";
                const isApplied = stage === "applied";

                return (
                  <article
                    key={`candidate-card-${app.id}`}
                    className={`v-candidate-card ${isClosed ? "closed-card" : ""}`}
                  >
                    {/* Top: Avatar + Name + Age/City */}
                    <div className="v-candidate-top">
                      <Link href={profileUrl} className="v-avatar-link">
                        {prof.avatar ? (
                          <img
                            src={prof.avatar}
                            alt={app.talentName}
                            className="v-candidate-avatar"
                          />
                        ) : (
                          <div className="v-candidate-avatar initials">
                            {getInitials(app.talentName)}
                          </div>
                        )}
                      </Link>

                      <div className="v-candidate-name-col">
                        <Link
                          href={profileUrl}
                          className="v-candidate-name-link"
                          title={app.talentName}
                        >
                          <span className="v-candidate-name-text">
                            {app.talentName}
                          </span>
                          <ExternalLink size={13} className="v-link-icon" />
                        </Link>
                        <span className="v-candidate-meta-text">
                          {prof.age ? `${prof.age} yrs` : "—"} · {prof.city || "Mumbai"}
                        </span>
                      </div>
                    </div>

                    {/* Role Applied & Project Subtitle */}
                    <div className="v-candidate-info-col">
                      <div className="v-candidate-role-text" title={app.roleApplied}>
                        {app.roleApplied}
                      </div>
                      <div className="v-candidate-applied-date">
                        Applied on {formatPostedDate(app.appliedDate || app.appliedAt || app.createdAt)}
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="v-candidate-status-wrap">
                      {renderStatusPill(stage, app)}
                    </div>

                    {/* Actions Row */}
                    <div className="v-card-actions-row">
                      {/* VIEW button */}
                      <Link
                        href={profileUrl}
                        className="v-card-view-btn"
                        title="View talent profile and comp-card"
                      >
                        <Eye size={14} />
                        <span>VIEW</span>
                      </Link>

                      {/* Primary contextual action */}
                      {isApplied ? (
                        <button
                          type="button"
                          onClick={() => handleShortlistApplicant(app)}
                          className="v-card-action-btn primary"
                        >
                          <Sparkles size={14} />
                          <span>SHORTLIST</span>
                        </button>
                      ) : isActionShort ? (
                        <button
                          type="button"
                          onClick={() => handleOpenAuditionModal(app)}
                          className="v-card-action-btn primary"
                        >
                          <Video size={14} />
                          <span>INVITE</span>
                        </button>
                      ) : isActionRev ? (
                        <button
                          type="button"
                          onClick={() => handleOpenReviewModal(app)}
                          className="v-card-action-btn primary"
                        >
                          <Play size={14} />
                          <span>TAPE</span>
                        </button>
                      ) : stage === "req" || stage === "tal" ? (
                        <button
                          type="button"
                          onClick={() => handleOpenAuditionModal(app)}
                          className="v-card-action-btn secondary"
                        >
                          <Clock size={14} />
                          <span>AUDITION</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedModalApp(app);
                            setSelectedNote("");
                          }}
                          className="v-card-action-btn secondary"
                        >
                          <CheckCircle2 size={14} />
                          <span>SELECT</span>
                        </button>
                      )}

                      {/* More Options Dropdown Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuAppId(activeMenuAppId === app.id ? null : app.id);
                        }}
                        className="v-card-menu-btn"
                        aria-label="More options"
                      >
                        <MoreHorizontal size={17} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuAppId === app.id && (
                        <div ref={menuRef} className="v-card-dropdown-menu">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuAppId(null);
                              setSelectedModalApp(app);
                              setSelectedNote("");
                            }}
                            className="v-menu-item-ok"
                          >
                            <CheckCircle2 size={14} />
                            <span>Select for role</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuAppId(null);
                              setNotSelectedModalApp(app);
                              setNotSelectedReason("");
                            }}
                            className="v-menu-item-danger"
                          >
                            <XCircle size={14} />
                            <span>Not selected</span>
                          </button>

                          <div className="v-menu-divider" />

                          <Link
                            href={profileUrl}
                            onClick={() => setActiveMenuAppId(null)}
                            className="v-menu-item-ghost"
                          >
                            <Eye size={14} />
                            <span>View profile</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS PRESERVED WITH SAME LOGIC
          ========================================================================= */}
      {/* MODAL 1: Review Self-Tape */}
      {reviewVideoModalApp && (() => {
        const app = reviewVideoModalApp;
        const aud = getAuditionForApp(app.id);
        const opp = selectedOpp || opportunities.find((o) => o.id === app.opportunityId);
        const profileUrl = `/recruiter/applications/${app.id}?from=shortlist&opp=${app.opportunityId}`;

        return (
          <Modal
            isOpen={!!reviewVideoModalApp}
            onClose={() => setReviewVideoModalApp(null)}
            title={`Review Self-Tape: ${app.talentName}`}
            subtitle={`Audition for ${app.roleApplied} • ${opp?.title || "Opportunity"}`}
            maxWidth="640px"
            footer={
              <div className="v-modal-footer-row">
                <Link href={profileUrl} className="v-modal-ghost-btn">
                  <Eye size={15} />
                  <span>View profile</span>
                </Link>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setNotSelectedModalApp(app);
                      setNotSelectedReason("");
                    }}
                    className="v-modal-danger-btn"
                  >
                    <XCircle size={15} />
                    <span>Not selected</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedModalApp(app);
                      setSelectedNote("");
                    }}
                    className="v-modal-primary-btn"
                  >
                    <CheckCircle2 size={15} />
                    <span>Select for role</span>
                  </button>
                </div>
              </div>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #E8E2D4" }}>
                <VideoPlayer
                  src={aud?.selfTapeUrl}
                  fileName={`${app.talentName}-SelfTape.mp4`}
                  height="320px"
                />
              </div>

              <div className="v-modal-instructions-box">
                <div style={{ fontWeight: 600, color: "#2B2D2A", marginBottom: "4px" }}>
                  Audition Instructions Relayed by Vismaya:
                </div>
                <p style={{ color: "#5A584F", margin: 0, lineHeight: 1.5 }}>
                  {aud?.note || "Record a monologue focusing on natural dialogue delivery and camera presence."}
                </p>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* MODAL 2: Request Audition */}
      {auditionModalApp && (
        <Modal
          isOpen={!!auditionModalApp}
          onClose={() => setAuditionModalApp(null)}
          title={`Request Audition for ${auditionModalApp.talentName}`}
          subtitle={`Role: ${auditionModalApp.roleApplied}`}
          maxWidth="560px"
        >
          <form onSubmit={handleSubmitAudition} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>
                Audition Format *
              </label>
              <select
                value={auditionType}
                onChange={(e) => setAuditionType(e.target.value)}
                className="v-modal-input"
              >
                <option value="Audition">Video Self-Tape (Standard Submission)</option>
                <option value="Virtual Interview">Live Virtual Audition (Google Meet / Zoom)</option>
                <option value="Screen Test">Physical Studio Callback</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>
                Deadline / Target Date (Optional)
              </label>
              <input
                type="date"
                value={auditionDate}
                onChange={(e) => setAuditionDate(e.target.value)}
                className="v-modal-input"
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>
                Directions Note for Talent *
              </label>
              <textarea
                rows={4}
                required
                value={auditionNote}
                onChange={(e) => setAuditionNote(e.target.value)}
                placeholder="Specify monologue, scenes, or dialogue directions..."
                className="v-modal-textarea"
              />
            </div>

            <div className="v-modal-footer-btns">
              <button
                type="button"
                onClick={() => setAuditionModalApp(null)}
                className="v-modal-cancel-btn"
              >
                Cancel
              </button>
              <button type="submit" className="v-modal-submit-btn">
                Send Request via Vismaya
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: Confirm Role Selection */}
      {selectedModalApp && (
        <Modal
          isOpen={!!selectedModalApp}
          onClose={() => setSelectedModalApp(null)}
          title="Confirm Final Role Selection"
          maxWidth="520px"
        >
          <form onSubmit={handleConfirmSelect} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="v-modal-confirm-banner">
              <CheckCircle2 size={22} style={{ color: "#8A6B2E", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong style={{ fontSize: "14px", color: "#2B2D2A", display: "block" }}>
                  Select {selectedModalApp.talentName} for {selectedModalApp.roleApplied}
                </strong>
                <p style={{ fontSize: "12px", color: "#5A584F", margin: "4px 0 0 0", lineHeight: 1.4 }}>
                  This decision will be updated in the talent pipeline.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>
                Selection Note (Optional)
              </label>
              <textarea
                rows={3}
                value={selectedNote}
                onChange={(e) => setSelectedNote(e.target.value)}
                placeholder="E.g. Approved by Director for production contracting."
                className="v-modal-textarea"
              />
            </div>

            <div className="v-modal-footer-btns">
              <button
                type="button"
                onClick={() => setSelectedModalApp(null)}
                className="v-modal-cancel-btn"
              >
                Cancel
              </button>
              <button type="submit" className="v-modal-submit-btn">
                Confirm Selection
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 4: Confirm Not Selected */}
      {notSelectedModalApp && (
        <Modal
          isOpen={!!notSelectedModalApp}
          onClose={() => setNotSelectedModalApp(null)}
          title="Confirm Candidate Not Selected"
          maxWidth="520px"
        >
          <form onSubmit={handleConfirmNotSelected} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "14px", color: "#5A584F", margin: 0, lineHeight: 1.5 }}>
              Are you sure you want to mark <strong style={{ color: "#2B2D2A" }}>{notSelectedModalApp.talentName}</strong> as Not Selected?
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>
                Reason / Feedback (Optional)
              </label>
              <textarea
                rows={3}
                value={notSelectedReason}
                onChange={(e) => setNotSelectedReason(e.target.value)}
                placeholder="E.g. Role cast with alternative character reference."
                className="v-modal-textarea"
              />
            </div>

            <div className="v-modal-footer-btns">
              <button
                type="button"
                onClick={() => setNotSelectedModalApp(null)}
                className="v-modal-cancel-btn"
              >
                Cancel
              </button>
              <button type="submit" className="v-modal-danger-submit-btn">
                Confirm Not Selected
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Embedded CSS */}
      <style jsx global>{`
        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .v-shortlist-page-wrapper {
          display: flex;
          flex-direction: column;
          width: 100%;
          color: #2B2D2A;
          font-family: var(--font-body), 'Inter', sans-serif;
        }

        .v-toast-notification {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 150;
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          box-shadow: 0 8px 24px rgba(43, 45, 42, 0.12);
          border-radius: 12px;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #2B2D2A;
          font-size: 13.5px;
          font-weight: 600;
          animation: toastIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Header & Breadcrumb */
        .v-page-header-wrap {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 24px;
        }
        .v-breadcrumb-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #5A584F;
          font-family: var(--font-body), 'Inter', sans-serif;
        }
        .v-breadcrumb-link,
        .v-breadcrumb-btn-link {
          color: #5A584F;
          text-decoration: none;
          background: none;
          border: none;
          padding: 0;
          font-size: inherit;
          font-family: inherit;
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .v-breadcrumb-link:hover,
        .v-breadcrumb-btn-link:hover {
          color: #8A6B2E;
        }
        .v-breadcrumb-sep {
          color: #E8E2D4;
        }
        .v-breadcrumb-active {
          color: #8A6B2E;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .v-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          align-self: flex-start;
          height: 32px;
          padding: 0 12px;
          border-radius: 8px;
          background-color: #F3EFE6;
          border: 1px solid #E8E2D4;
          color: #8A6B2E;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.18s ease;
          margin-bottom: 4px;
        }
        .v-back-btn:hover {
          background-color: #E8E2D4;
          color: #6E5420;
        }

        .v-header-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .v-page-title {
          font-family: var(--font-heading), 'Playfair Display', Georgia, serif;
          font-size: clamp(26px, 3.5vw, 36px);
          line-height: 1.2;
          font-weight: 600;
          color: "#2B2D2A";
          margin: 0;
          letter-spacing: -0.015em;
        }
        .v-pill-opportunities {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 999px;
          background-color: #F3EFE6;
          border: 1px solid #E8E2D4;
          color: #8A6B2E;
        }
        .v-pill-opp-meta {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 999px;
          background-color: #F3EFE6;
          border: 1px solid #E8E2D4;
          color: #8A6B2E;
        }
        .v-page-description,
        .v-page-subtitle {
          font-size: 15px;
          line-height: 1.5;
          color: #5A584F;
          margin: 0;
          font-family: var(--font-body), 'Inter', sans-serif;
        }

        /* =========================================================================
           LEVEL 1: OPPORTUNITY GRID & CARDS
           ========================================================================= */
        .v-opportunity-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
          align-items: stretch;
          margin-bottom: 32px;
        }
        .v-opp-card {
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          border-radius: 16px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 2px 4px rgba(43, 45, 42, 0.03), 0 8px 20px rgba(43, 45, 42, 0.04);
          cursor: pointer;
          transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
          outline: none;
        }
        .v-opp-card:hover {
          border-color: #8A6B2E;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(43, 45, 42, 0.05), 0 16px 28px rgba(43, 45, 42, 0.08);
        }
        .v-opp-card-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .v-opp-type-badge {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #8A6B2E;
          background-color: rgba(138, 107, 46, 0.08);
          border: 1px solid rgba(138, 107, 46, 0.22);
          border-radius: 6px;
          padding: 3px 8px;
        }
        .v-opp-status-pill {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          padding: 2px 9px;
          border-radius: 999px;
        }
        .v-opp-status-pill.open {
          border: 1px solid #C9A55C;
          color: #8A6B2E;
          background: transparent;
        }
        .v-opp-status-pill.closed {
          border: 1px solid #E8E2D4;
          color: #5A584F;
          background: #F3EFE6;
        }
        .v-opp-card-title {
          font-family: var(--font-heading), 'Playfair Display', Georgia, serif;
          font-size: 19px;
          line-height: 1.35;
          font-weight: 600;
          color: #2B2D2A;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .v-opp-card-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #5A584F;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .v-meta-dot {
          color: #C9A55C;
          font-weight: bold;
        }
        .v-opp-count-boxes-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 2px;
        }
        .v-opp-count-box {
          background-color: #F3EFE6;
          border: 1px solid #E8E2D4;
          border-radius: 10px;
          padding: 10px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          text-align: center;
        }
        .v-opp-count-num {
          font-family: var(--font-heading), 'Playfair Display', Georgia, serif;
          font-size: 20px;
          font-weight: 700;
          color: #2B2D2A;
          line-height: 1.1;
        }
        .v-opp-count-lbl {
          font-size: 10px;
          font-weight: 700;
          color: #6E5420;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .v-opp-card-bottom {
          margin-top: auto;
          padding-top: 4px;
        }
        .v-opp-card-btn {
          width: 100%;
          height: 42px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.05em;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.18s ease;
          font-family: var(--font-body), 'Inter', sans-serif;
        }
        .v-opp-card-btn.filled {
          background-color: #8A6B2E;
          color: #FFFFFF;
          border: none;
          box-shadow: 0 2px 6px rgba(138, 107, 46, 0.20);
        }
        .v-opp-card-btn.filled:hover {
          background-color: #6E5420;
        }
        .v-opp-card-btn.outlined.disabled {
          background-color: transparent;
          border: 1px solid #E8E2D4;
          color: #5A584F;
          cursor: default;
          opacity: 0.85;
        }
        .v-arrow-glyph {
          font-size: 15px;
          transition: transform 0.18s ease;
        }
        .v-opp-card:hover .v-arrow-glyph {
          transform: translateX(3px);
        }

        /* =========================================================================
           LEVEL 2: SUMMARY BOXES & TOOLBAR
           ========================================================================= */
        .v-summary-boxes-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .v-summary-box {
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          border-radius: 14px;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: 0 2px 6px rgba(43, 45, 42, 0.02);
        }
        .v-summary-box-lbl {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #6E5420;
        }
        .v-summary-box-num {
          font-family: var(--font-heading), 'Playfair Display', Georgia, serif;
          font-size: 26px;
          font-weight: 700;
          color: #2B2D2A;
          line-height: 1.15;
        }
        .v-summary-box-desc {
          font-size: 12px;
          color: #5A584F;
        }

        /* Toolbar Card */
        .v-toolbar-card {
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          border-radius: 16px;
          padding: 18px 22px;
          box-shadow: 0 2px 10px rgba(43, 45, 42, 0.03);
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .v-toolbar-top {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
        }
        .v-search-box {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        .v-search-icon {
          position: absolute;
          left: 14px;
          color: #5A584F;
          pointer-events: none;
        }
        .v-search-input {
          width: 100%;
          height: 42px;
          border-radius: 10px;
          border: 1px solid #E8E2D4;
          background-color: #FFFFFF;
          color: #2B2D2A;
          font-size: 14px;
          padding: 0 14px 0 40px;
          outline: none;
          font-family: var(--font-body), 'Inter', sans-serif;
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
        }
        .v-search-input:focus {
          border-color: #8A6B2E;
          box-shadow: 0 0 0 3px rgba(138, 107, 46, 0.18);
        }

        .v-tabs-row {
          border-top: 1px solid #E8E2D4;
          padding-top: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          width: 100%;
        }
        .v-tabs-scroll-container {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .v-tab-btn {
          height: 38px;
          padding: 0 16px;
          border-radius: 999px;
          font-family: var(--font-body), 'Inter', sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid transparent;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          transition: all 0.18s ease;
          background-color: transparent;
          color: #5A584F;
        }
        .v-tab-btn:not(.active):hover {
          background-color: #F3EFE6;
          color: #2B2D2A;
        }
        .v-tab-btn.active {
          background-color: #8A6B2E;
          color: #FFFFFF;
          box-shadow: 0 2px 6px rgba(138, 107, 46, 0.25);
        }
        .v-tab-count-pill {
          height: 20px;
          min-width: 20px;
          padding: 0 6px;
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .v-tab-btn.active .v-tab-count-pill {
          background-color: rgba(255, 255, 255, 0.24);
          color: #FFFFFF;
        }
        .v-tab-btn:not(.active) .v-tab-count-pill {
          background-color: #F3EFE6;
          color: #2B2D2A;
        }

        .v-need-action-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #6E5420;
          white-space: nowrap;
          margin-left: auto;
        }
        .v-action-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #8A6B2E;
          flex-shrink: 0;
        }

        /* =========================================================================
           LEVEL 2: CANDIDATE GRID & CARDS
           ========================================================================= */
        .v-candidate-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
          align-items: stretch;
          margin-bottom: 32px;
        }
        .v-candidate-card {
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          border-radius: 18px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(43, 45, 42, 0.04), 0 10px 24px rgba(43, 45, 42, 0.05);
          display: flex;
          flex-direction: column;
          height: 100%;
          box-sizing: border-box;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
          gap: 12px;
        }
        .v-candidate-card:hover {
          transform: translateY(-2px);
          border-color: #C9A55C;
          box-shadow: 0 4px 8px rgba(43, 45, 42, 0.06), 0 14px 28px rgba(43, 45, 42, 0.08);
        }
        .v-candidate-card.closed-card {
          opacity: 0.8;
        }

        .v-candidate-top {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .v-avatar-link {
          display: flex;
          text-decoration: none;
          color: inherit;
          flex-shrink: 0;
        }
        .v-candidate-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid #E8E2D4;
          flex-shrink: 0;
        }
        .v-candidate-avatar.initials {
          background-color: #F3EFE6;
          color: #8A6B2E;
          font-size: 16px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-heading), 'Playfair Display', Georgia, serif;
        }
        .v-candidate-name-col {
          min-width: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .v-candidate-name-link {
          text-decoration: none;
          color: #2B2D2A;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          max-width: 100%;
        }
        .v-candidate-name-text {
          font-family: var(--font-heading), 'Playfair Display', Georgia, serif;
          font-size: 19px;
          font-weight: 600;
          color: #2B2D2A;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.25;
          transition: color 0.15s ease;
        }
        .v-candidate-name-link:hover .v-candidate-name-text {
          color: #8A6B2E;
        }
        .v-link-icon {
          color: #5A584F;
          flex-shrink: 0;
          transition: color 0.15s ease;
        }
        .v-candidate-name-link:hover .v-link-icon {
          color: #8A6B2E;
        }
        .v-candidate-meta-text {
          font-size: 12.5px;
          color: #5A584F;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .v-candidate-info-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .v-candidate-role-text {
          font-size: 14.5px;
          font-weight: 600;
          color: #2B2D2A;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .v-candidate-applied-date {
          font-size: 12px;
          color: #5A584F;
          line-height: 1.3;
        }

        /* Status Pills */
        .v-candidate-status-wrap {
          padding-top: 2px;
        }
        .v-stage-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 700;
          border-radius: 999px;
          padding: 5px 11px;
          width: fit-content;
          line-height: 1;
          white-space: nowrap;
        }
        .v-stage-status-pill .v-pill-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #8A6B2E;
          flex-shrink: 0;
        }
        .v-stage-status-pill.rev {
          background-color: #F3EFE6;
          color: #2B2D2A;
        }
        .v-stage-status-pill.short {
          background-color: rgba(138, 107, 46, 0.12);
          color: #6E5420;
        }
        .v-stage-status-pill.aud {
          background-color: rgba(201, 165, 92, 0.18);
          color: #6E5420;
        }
        .v-stage-status-pill.sel {
          background-color: rgba(138, 107, 46, 0.14);
          color: #6E5420;
        }
        .v-stage-status-pill.no {
          background-color: #F3EFE6;
          color: #5A584F;
        }
        .v-stage-status-pill.applied {
          background-color: #F3EFE6;
          color: #5A584F;
        }
        .v-pill-time {
          color: #5A584F;
          font-variant-numeric: tabular-nums;
          font-weight: 600;
          font-size: 11px;
          margin-left: 2px;
        }

        /* Action Buttons Row */
        .v-card-actions-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: auto;
          padding-top: 14px;
          position: relative;
        }
        .v-card-view-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          height: 40px;
          padding: 0 12px;
          border-radius: 9px;
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          color: #5A584F;
          font-size: 12.5px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.16s ease;
        }
        .v-card-view-btn:hover {
          background-color: #F3EFE6;
          color: #2B2D2A;
          border-color: #8A6B2E;
        }
        .v-card-action-btn {
          flex: 1;
          height: 40px;
          border-radius: 9px;
          font-size: 12.5px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.16s ease;
          border: none;
          font-family: var(--font-body), 'Inter', sans-serif;
        }
        .v-card-action-btn.primary {
          background-color: #8A6B2E;
          color: #FFFFFF;
          box-shadow: 0 2px 6px rgba(138, 107, 46, 0.20);
        }
        .v-card-action-btn.primary:hover {
          background-color: #6E5420;
        }
        .v-card-action-btn.secondary {
          background-color: #F3EFE6;
          border: 1px solid #E8E2D4;
          color: #6E5420;
        }
        .v-card-action-btn.secondary:hover {
          background-color: #E8E2D4;
          color: #2B2D2A;
        }
        .v-card-menu-btn {
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          border-radius: 9px;
          border: 1px solid #E8E2D4;
          background-color: #FFFFFF;
          color: #5A584F;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.16s ease;
        }
        .v-card-menu-btn:hover {
          border-color: #8A6B2E;
          background-color: #F3EFE6;
          color: #8A6B2E;
        }

        /* Dropdown Menu */
        .v-card-dropdown-menu {
          position: absolute;
          bottom: 48px;
          right: 0;
          width: 180px;
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          border-radius: 12px;
          box-shadow: 0 10px 28px rgba(43, 45, 42, 0.12);
          padding: 6px;
          z-index: 40;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .v-menu-item-ok,
        .v-menu-item-danger,
        .v-menu-item-ghost {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 8px;
          background: transparent;
          border: none;
          font-size: 13px;
          font-weight: 600;
          font-family: var(--font-body), 'Inter', sans-serif;
          cursor: pointer;
          text-decoration: none;
          transition: background-color 0.15s ease;
        }
        .v-menu-item-ok {
          color: #6E5420;
        }
        .v-menu-item-ok:hover {
          background-color: #F3EFE6;
        }
        .v-menu-item-danger {
          color: #B42318;
        }
        .v-menu-item-danger:hover {
          background-color: rgba(180, 35, 24, 0.08);
        }
        .v-menu-item-ghost {
          color: #2B2D2A;
        }
        .v-menu-item-ghost:hover {
          background-color: #F3EFE6;
        }
        .v-menu-divider {
          height: 1px;
          background-color: #E8E2D4;
          margin: 4px 0;
        }

        /* Empty State Card */
        .v-empty-state-card {
          grid-column: 1 / -1;
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          border-radius: 18px;
          padding: 48px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(43, 45, 42, 0.02);
        }
        .v-empty-icon-wrap {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background-color: #F3EFE6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8A6B2E;
        }
        .v-empty-title {
          font-family: var(--font-heading), 'Playfair Display', Georgia, serif;
          font-size: 20px;
          font-weight: 600;
          color: #2B2D2A;
          margin: 0;
        }
        .v-empty-desc {
          color: #5A584F;
          font-size: 14px;
          margin: 0;
          max-width: 440px;
          line-height: 1.5;
        }
        .v-empty-action-btn {
          height: 40px;
          padding: 0 20px;
          border-radius: 10px;
          background-color: #8A6B2E;
          color: #FFFFFF;
          font-size: 13.5px;
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-top: 6px;
          transition: background-color 0.16s ease;
        }
        .v-empty-action-btn:hover {
          background-color: #6E5420;
        }

        /* Modals Generic Elements */
        .v-modal-input,
        .v-modal-textarea {
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          border-radius: 10px;
          padding: 10px 14px;
          color: #2B2D2A;
          font-size: 13.5px;
          outline: none;
          font-family: var(--font-body), 'Inter', sans-serif;
        }
        .v-modal-input {
          height: 42px;
        }
        .v-modal-textarea {
          line-height: 1.5;
          resize: vertical;
        }
        .v-modal-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 10px;
          flex-wrap: wrap;
        }
        .v-modal-instructions-box {
          background-color: #F3EFE6;
          border: 1px solid #E8E2D4;
          border-radius: 12px;
          padding: 14px;
          font-size: 13px;
        }
        .v-modal-confirm-banner {
          background-color: rgba(138, 107, 46, 0.08);
          border: 1px solid rgba(138, 107, 46, 0.22);
          border-radius: 12px;
          padding: 14px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .v-modal-footer-btns {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 8px;
        }
        .v-modal-cancel-btn {
          height: 40px;
          padding: 0 16px;
          border-radius: 10px;
          background: #FFFFFF;
          border: 1px solid #E8E2D4;
          color: #2B2D2A;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .v-modal-submit-btn {
          height: 40px;
          padding: 0 20px;
          border-radius: 10px;
          background-color: #8A6B2E;
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 600;
          border: none;
          box-shadow: 0 2px 8px rgba(138, 107, 46, 0.22);
          cursor: pointer;
        }
        .v-modal-submit-btn:hover {
          background-color: #6E5420;
        }
        .v-modal-danger-submit-btn {
          height: 40px;
          padding: 0 20px;
          border-radius: 10px;
          background-color: #B42318;
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 600;
          border: none;
          box-shadow: 0 2px 8px rgba(180, 35, 24, 0.22);
          cursor: pointer;
        }
        .v-modal-ghost-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 0 14px;
          border-radius: 9px;
          background-color: #FFFFFF;
          border: 1px solid #E8E2D4;
          color: #5A584F;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
        }
        .v-modal-danger-btn {
          height: 38px;
          padding: 0 14px;
          border-radius: 9px;
          background: transparent;
          border: 1px solid rgba(180, 35, 24, 0.3);
          color: #B42318;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .v-modal-primary-btn {
          height: 38px;
          padding: 0 18px;
          border-radius: 9px;
          background-color: #8A6B2E;
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 600;
          border: none;
          box-shadow: 0 2px 8px rgba(138, 107, 46, 0.22);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        /* =========================================================================
           TABLET RESPONSIVENESS (641px - 1023.98px)
           ========================================================================= */
        @media (max-width: 1023.98px) {
          .v-opportunity-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .v-candidate-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        /* =========================================================================
           MOBILE RESPONSIVENESS (max-width: 640px)
           - Header title 21px, meta 11-12px
           - Cards gap 10px, no horizontal scroll
           - Level 1: 1 column, count box num 15px & label 8.5px, btn 36px
           - Level 2: action buttons full width equal row, height 36px
           - Wrap chips onto 2 lines, no single line scroll
           ========================================================================= */
        /* =========================================================================
           MOBILE RESPONSIVENESS (max-width: 640px)
           - Root cause fix: minmax(0, 1fr) columns, box-sizing, min-width: 0
           - Page wrapper padding 12px 14px, zero horizontal overflow
           - Top row badge (9.5px, ellipsis) + status pill (9.5px, flex: none)
           - Title 16px, line-height 1.25, 2 lines, word-break anywhere
           - Meta flex-wrap, 11px
           - 3 count boxes: repeat(3, minmax(0, 1fr)), gap 6px, padding 6px 2px, num 15px, lbl 8.5px
           - Full-width button: 36px, 10.5px, letter-spacing 0.08em
           - Header wrap, 21px title, 10px pill, 12px subtitle
           - Top bar title ellipsis fit with icons
           ========================================================================= */
        @media (max-width: 640px) {
          .recruiter-main-viewport:has(.v-shortlist-page-wrapper) {
            padding: 0 !important;
          }

          .v-shortlist-page-wrapper {
            padding: 12px 14px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
          }

          /* Topbar Title Fit on Mobile */
          .recruiter-topbar-header {
            box-sizing: border-box !important;
            max-width: 100vw !important;
          }
          .recruiter-topbar-left {
            min-width: 0 !important;
            flex: 1 1 auto !important;
            overflow: hidden !important;
          }
          .recruiter-topbar-title-wrap {
            min-width: 0 !important;
            flex: 1 1 auto !important;
            overflow: hidden !important;
          }
          .recruiter-topbar-title {
            font-size: 16px !important;
            line-height: 1.25 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            min-width: 0 !important;
            max-width: 100% !important;
          }

          /* Header */
          .v-page-header-wrap {
            margin-bottom: 14px !important;
            gap: 6px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .v-breadcrumb-nav {
            display: flex !important;
            flex-wrap: wrap !important;
            font-size: 11.5px !important;
            gap: 4px 6px !important;
            white-space: normal !important;
            min-width: 0 !important;
            width: 100% !important;
          }
          .v-header-title-row {
            display: flex !important;
            flex-wrap: wrap !important;
            align-items: center !important;
            gap: 6px !important;
            min-width: 0 !important;
            width: 100% !important;
          }
          .v-page-title {
            font-size: 21px !important;
            line-height: 1.25 !important;
          }
          .v-pill-opportunities,
          .v-pill-opp-meta {
            font-size: 10px !important;
            padding: 2px 8px !important;
            white-space: nowrap !important;
          }
          .v-page-description,
          .v-page-subtitle {
            font-size: 12px !important;
            line-height: 1.4 !important;
          }

          /* Back button */
          .v-back-btn {
            height: 28px !important;
            padding: 0 10px !important;
            font-size: 11px !important;
          }

          /* LEVEL 1: Container & Grid */
          .v-level1-container {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            min-width: 0 !important;
          }
          .v-opportunity-grid {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 10px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            margin-bottom: 18px !important;
          }
          .v-opportunity-grid > * {
            min-width: 0 !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }

          /* LEVEL 1: Opportunity Card */
          .v-opp-card {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            padding: 12px !important;
            border-radius: 14px !important;
            overflow: hidden !important;
            min-width: 0 !important;
            gap: 8px !important;
          }
          .v-opp-card-top-row {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            gap: 8px !important;
            min-width: 0 !important;
            width: 100% !important;
          }
          .v-opp-type-badge {
            font-size: 9.5px !important;
            padding: 3px 8px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            min-width: 0 !important;
            flex: 0 1 auto !important;
          }
          .v-opp-status-pill {
            font-size: 9.5px !important;
            padding: 3px 8px !important;
            flex: none !important;
            white-space: nowrap !important;
          }
          .v-opp-card-title {
            font-size: 16px !important;
            line-height: 1.25 !important;
            margin-top: 8px !important;
            margin-bottom: 0 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            word-break: break-word !important;
            overflow-wrap: anywhere !important;
          }
          .v-opp-card-meta {
            font-size: 11px !important;
            display: flex !important;
            flex-wrap: wrap !important;
            white-space: normal !important;
            gap: 4px 8px !important;
            min-width: 0 !important;
          }

          /* LEVEL 1: 3 Count Boxes */
          .v-opp-count-boxes-row {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 6px !important;
            margin: 10px 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .v-opp-count-box {
            padding: 6px 2px !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
            text-align: center !important;
            overflow: hidden !important;
          }
          .v-opp-count-num {
            font-size: 15px !important;
            line-height: 1.1 !important;
          }
          .v-opp-count-lbl {
            font-size: 8.5px !important;
            letter-spacing: 0.04em !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            display: block !important;
          }

          /* LEVEL 1: Button */
          .v-opp-card-bottom {
            width: 100% !important;
            margin-top: auto !important;
          }
          .v-opp-card-btn {
            width: 100% !important;
            height: 36px !important;
            min-height: 36px !important;
            font-size: 10.5px !important;
            letter-spacing: 0.08em !important;
            box-sizing: border-box !important;
            padding: 0 8px !important;
            border-radius: 8px !important;
          }

          /* LEVEL 2: Summary Boxes Mobile */
          .v-summary-boxes-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 6px !important;
            margin-bottom: 12px !important;
          }
          .v-summary-box {
            padding: 8px 6px !important;
            border-radius: 10px !important;
            align-items: center !important;
            text-align: center !important;
            gap: 2px !important;
          }
          .v-summary-box-lbl {
            font-size: 9px !important;
          }
          .v-summary-box-num {
            font-size: 17px !important;
          }
          .v-summary-box-desc {
            display: none !important;
          }

          /* LEVEL 2: Toolbar Mobile */
          .v-toolbar-card {
            padding: 12px !important;
            border-radius: 14px !important;
            gap: 10px !important;
            margin-bottom: 14px !important;
          }
          .v-search-input {
            height: 38px !important;
            font-size: 14px !important;
            padding: 0 12px 0 36px !important;
          }
          .v-tabs-row {
            padding-top: 8px !important;
            gap: 8px !important;
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .v-tabs-scroll-container {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 5px !important;
            overflow: visible !important;
            width: 100% !important;
          }
          .v-tab-btn {
            height: 28px !important;
            padding: 0 8px !important;
            font-size: 11px !important;
            gap: 4px !important;
            flex: 1 1 auto !important;
            justify-content: center !important;
          }
          .v-tab-count-pill {
            height: 16px !important;
            min-width: 16px !important;
            font-size: 9.5px !important;
            padding: 0 4px !important;
          }
          .v-need-action-tag {
            font-size: 11.5px !important;
            margin-left: 0 !important;
            margin-top: 2px !important;
          }

          /* LEVEL 2: Candidate Cards Mobile */
          .v-candidate-grid {
            display: flex !important;
            flex-direction: column !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
            margin-bottom: 20px !important;
          }
          .v-candidate-card {
            padding: 14px !important;
            border-radius: 14px !important;
            gap: 10px !important;
          }
          .v-candidate-avatar {
            width: 42px !important;
            height: 42px !important;
          }
          .v-candidate-name-text {
            font-size: 17px !important;
          }
          .v-candidate-meta-text {
            font-size: 11.5px !important;
          }
          .v-candidate-role-text {
            font-size: 13.5px !important;
          }
          .v-candidate-applied-date {
            font-size: 11.5px !important;
          }

          /* Level 2 actions: full width row, equal width, height 36px */
          .v-card-actions-row {
            display: flex !important;
            width: 100% !important;
            gap: 6px !important;
            margin-top: 6px !important;
            padding-top: 8px !important;
          }
          .v-card-actions-row .v-card-view-btn,
          .v-card-actions-row .v-card-action-btn {
            flex: 1 1 0 !important;
            width: 100% !important;
            height: 36px !important;
            min-height: 36px !important;
            font-size: 11.5px !important;
            padding: 0 6px !important;
            justify-content: center !important;
            border-radius: 8px !important;
            white-space: nowrap !important;
          }
          .v-card-actions-row .v-card-menu-btn {
            flex: 0 0 36px !important;
            width: 36px !important;
            height: 36px !important;
            min-width: 36px !important;
            min-height: 36px !important;
            border-radius: 8px !important;
          }

          .v-empty-state-card {
            padding: 28px 16px !important;
            border-radius: 14px !important;
          }
        }
      `}</style>
    </div>
  );
}
