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
  ChevronRight,
  Search,
  MoreHorizontal,
  Eye,
  Film,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { useWorkflow } from "@/lib/shared/workflowStore";
import PageHeader from "@/components/shared/PageHeader";
import Modal from "@/components/shared/Modal";
import VideoPlayer from "@/components/shared/VideoPlayer";

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

  // Read initial filter values from URL query parameters
  const initialStage = searchParams?.get("stage") || "all";
  const initialOpp = searchParams?.get("opp") || "ALL";
  const initialQ = searchParams?.get("q") || "";

  // Filters & Tabs State
  const [currentTab, setCurrentTab] = useState(initialStage); // all | short | aud | rev | sel | no
  const [selectedOppId, setSelectedOppId] = useState(initialOpp);
  const [searchQuery, setSearchQuery] = useState(initialQ);

  // Sync filter/search state into URL query params
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (currentTab && currentTab !== "all") params.set("stage", currentTab);
    if (selectedOppId && selectedOppId !== "ALL") params.set("opp", selectedOppId);
    if (searchQuery && searchQuery.trim()) params.set("q", searchQuery.trim());

    const qs = params.toString();
    const newUrl = `/recruiter/shortlist-auditions${qs ? `?${qs}` : ""}`;
    const currentUrl = window.location.pathname + window.location.search;
    if (newUrl !== currentUrl) {
      window.history.replaceState(null, "", newUrl);
    }
  }, [currentTab, selectedOppId, searchQuery]);

  // Overflow menu state
  const activeMenuAppIdRef = useRef(null);
  const [activeMenuAppId, setActiveMenuAppId] = useState(null);
  const menuRef = useRef(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Close overflow menu on outside click
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

  // Filter org opportunities (org-1)
  const orgOpportunities = useMemo(() => {
    return opportunities.filter((o) => o.orgId === "org-1" || !o.orgId);
  }, [opportunities]);

  // Shortlisted, Selected, Not Selected, or Audited applications
  const relevantApplications = useMemo(() => {
    return applications.filter((app) => {
      const hasAud = auditions.some((aud) => aud.applicationId === app.id);
      const isShortlistedOrFinal =
        app.status === "Shortlisted" ||
        app.status === "Selected" ||
        (app.status === "Not Selected" && hasAud);

      return isShortlistedOrFinal || hasAud;
    });
  }, [applications, auditions]);

  // Map application to internal stage key: 'rev' | 'short' | 'req' | 'tal' | 'sel' | 'no'
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
    return "short";
  };

  // Helper metadata per stage
  const STAGE_META = {
    short: { name: "Shortlisted", colorKey: "g", color: "#ffbc00" },
    req: { name: "Audition requested", colorKey: "b", color: "#8ab4ff" },
    tal: { name: "With talent", colorKey: "b", color: "#8ab4ff" },
    rev: { name: "Self-tape ready", colorKey: "g", color: "#ffbc00" },
    sel: { name: "Selected", colorKey: "o", color: "#34d399" },
    no: { name: "Not selected", colorKey: "x", color: "#8b94ab" },
  };

  const STAGE_PRIORITY = ["rev", "short", "req", "tal", "sel", "no"];

  // Helpers
  const getAuditionForApp = (appId) => auditions.find((a) => a.applicationId === appId);
  const getOpportunityForApp = (oppId) => opportunities.find((o) => o.id === oppId);
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

  // Filtered by Opportunity & Search Query
  const filteredBaseApplications = useMemo(() => {
    return relevantApplications.filter((app) => {
      if (selectedOppId !== "ALL" && app.opportunityId !== selectedOppId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (app.talentName || "").toLowerCase();
        const role = (app.roleApplied || "").toLowerCase();
        const city = (app.talentProfile?.city || "").toLowerCase();
        const opp = opportunities.find((o) => o.id === app.opportunityId);
        const oppTitle = (opp?.title || "").toLowerCase();
        const proj = opp ? projects.find((p) => p.id === opp.projectId) : null;
        const projTitle = (proj?.title || "").toLowerCase();

        if (
          !name.includes(q) &&
          !role.includes(q) &&
          !city.includes(q) &&
          !oppTitle.includes(q) &&
          !projTitle.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [relevantApplications, selectedOppId, searchQuery, opportunities, projects]);

  // Tab definitions with dynamic filter functions
  const TABS = useMemo(() => [
    { key: "all", label: "All", filter: () => true, color: "#ffbc00" },
    { key: "short", label: "Shortlisted", filter: (app) => getAppStage(app) === "short", color: "#ffbc00" },
    { key: "aud", label: "Audition / Interview", filter: (app) => { const s = getAppStage(app); return s === "req" || s === "tal"; }, color: "#8ab4ff" },
    { key: "rev", label: "Self-tape ready", filter: (app) => getAppStage(app) === "rev", color: "#ffbc00" },
    { key: "sel", label: "Selected", filter: (app) => getAppStage(app) === "sel", color: "#34d399" },
    { key: "no", label: "Not selected", filter: (app) => getAppStage(app) === "no", color: "#8b94ab" },
  ], [auditions]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts = {};
    TABS.forEach((t) => {
      counts[t.key] = filteredBaseApplications.filter(t.filter).length;
    });
    return counts;
  }, [TABS, filteredBaseApplications]);

  // "Need your action" count (Shortlisted + Self-tape ready)
  const needActionCount = useMemo(() => {
    return filteredBaseApplications.filter((app) => {
      const s = getAppStage(app);
      return s === "short" || s === "rev";
    }).length;
  }, [filteredBaseApplications, auditions]);

  // Final filtered & sorted candidate cards for grid
  const displayApplications = useMemo(() => {
    const activeTabObj = TABS.find((t) => t.key === currentTab) || TABS[0];
    const list = filteredBaseApplications.filter(activeTabObj.filter);

    list.sort((a, b) => {
      const pA = STAGE_PRIORITY.indexOf(getAppStage(a));
      const pB = STAGE_PRIORITY.indexOf(getAppStage(b));
      if (pA !== pB) return pA - pB;
      const dateA = new Date(a.appliedDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.appliedDate || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return list;
  }, [TABS, currentTab, filteredBaseApplications]);

  // Actions
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

  // Status message generator for card
  const getStatusMessage = (stage, app, aud) => {
    if (stage === "rev") {
      return "Self-tape ready · 01:24";
    }
    if (stage === "short") {
      return "Needs your action";
    }
    if (stage === "req") {
      return "Audition requested · waiting for Vismaya";
    }
    if (stage === "tal") {
      return "Relayed to talent";
    }
    if (stage === "sel") {
      const dateStr = new Date(app.appliedDate || Date.now()).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
      return `Selected · ${dateStr}`;
    }
    if (stage === "no") {
      const dateStr = new Date(app.appliedDate || Date.now()).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
      return `Not selected · ${dateStr}`;
    }
    return "Under Review";
  };

  // Initials generator
  const getInitials = (name) => {
    if (!name) return "T";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // Loading skeleton
  if (!isHydrated) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ height: "48px", background: "rgba(255, 255, 255, 0.06)", borderRadius: "12px", width: "40%" }} />
        <div style={{ height: "40px", background: "rgba(255, 255, 255, 0.06)", borderRadius: "10px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: "220px", background: "rgba(255, 255, 255, 0.055)", borderRadius: "14px" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 150,
            backgroundColor: "#0f1626",
            border: "1px solid var(--gold)",
            boxShadow: "0 12px 36px rgba(0, 0, 0, 0.6)",
            borderRadius: "12px",
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "var(--tx)",
            fontSize: "13px",
            fontWeight: "600",
            animation: "toastIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <CheckCircle2 size={18} style={{ color: "var(--gold)", flexShrink: 0 }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Shortlist & Auditions"
        subtitle="Move shortlisted talent through audition and review self-tapes before making the final selection."
        breadcrumbs={[
          { label: "Dashboard", href: "/recruiter/dashboard" },
          { label: "Shortlist & Auditions" },
        ]}
      />

      {/* Toolbar: Opportunity Select + Search */}
      <div className="tool">
        <select
          className="sel"
          value={selectedOppId}
          onChange={(e) => setSelectedOppId(e.target.value)}
          aria-label="Filter Opportunity"
        >
          <option value="ALL">All opportunities ({orgOpportunities.length})</option>
          {orgOpportunities.map((opp) => (
            <option key={opp.id} value={opp.id}>
              {opp.title}
            </option>
          ))}
        </select>

        <input
          className="in"
          type="text"
          placeholder="Search candidate, role or project"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search"
        />
      </div>

      {/* Stage Tabs (Horizontally scrolling on small screens) */}
      <div className="tabs" role="tablist">
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
              className={`tab ${isActive ? "on" : ""}`}
              style={{ "--c": tab.color }}
            >
              <span>{tab.label}</span>
              <b>{count}</b>
            </button>
          );
        })}
      </div>

      {/* Summary Pill: "N need your action" */}
      <div className="need">
        <span className="sc g" style={{ display: "inline-flex" }}>
          <i />
          <b>{needActionCount}</b> need your action
        </span>
      </div>

      {/* Candidate Standalone Grid */}
      <div className="grid">
        {displayApplications.length === 0 ? (
          <div className="empty" style={{ gridColumn: "1 / -1" }}>
            No candidates here yet
          </div>
        ) : (
          displayApplications.map((app) => {
            const prof = app.talentProfile || {};
            const aud = getAuditionForApp(app.id);
            const opp = getOpportunityForApp(app.opportunityId);
            const proj = getProjectForOpp(opp);
            const stage = getAppStage(app);
            const meta = STAGE_META[stage] || STAGE_META.short;
            const isClosed = stage === "no";
            const statusMsg = getStatusMessage(stage, app, aud);
            const profileUrl = `/recruiter/applications/${app.id}?from=shortlist&opp=${app.opportunityId}`;

            const isActionShort = stage === "short";
            const isActionRev = stage === "rev";

            return (
              <article
                key={`candidate-card-${app.id}`}
                className={`cd ${isClosed ? "dim" : ""}`}
                style={{ "--c": meta.color }}
              >
                {/* 1. Candidate Info: Avatar + Name + Age/City */}
                <div className="p">
                  <Link
                    href={profileUrl}
                    style={{
                      display: "flex",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    {prof.avatar ? (
                      <img
                        src={prof.avatar}
                        alt={app.talentName}
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "1px solid rgba(255, 255, 255, 0.16)",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        className="av"
                        style={{
                          "--a": "linear-gradient(145deg, #16243e, #0a0f19)",
                          border: "1px solid rgba(255, 188, 0, 0.3)",
                        }}
                      >
                        {getInitials(app.talentName)}
                      </div>
                    )}
                  </Link>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Link
                      href={profileUrl}
                      className="candidate-name-link"
                      style={{
                        textDecoration: "none",
                        color: "var(--tx)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        maxWidth: "100%",
                      }}
                    >
                      <b style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {app.talentName}
                      </b>
                      <ExternalLink size={12} className="link-hover-icon" style={{ color: "var(--gold)", flexShrink: 0 }} />
                    </Link>
                    <span>
                      {prof.age ? `${prof.age} yrs` : "—"} · {prof.city || "Mumbai"}
                    </span>
                  </div>
                </div>

                {/* 2. Role & Project */}
                <div className="role">
                  {app.roleApplied}
                  <small title={getProjectRoleSubtitle(proj, opp)}>
                    {getProjectRoleSubtitle(proj, opp)}
                  </small>
                </div>

                {/* 3. Status Line with Colored Dot */}
                <div className="st" style={{ "--c": meta.color }}>
                  {statusMsg}
                </div>

                {/* 4. Action Row (Pinned to bottom with margin-top: auto) */}
                <div className="row mt" style={{ position: "relative" }}>
                  {isActionShort && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenAuditionModal(app)}
                        className="btn pr"
                      >
                        Request audition
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuAppId(activeMenuAppId === app.id ? null : app.id);
                        }}
                        className="btn"
                        style={{ flex: "0 0 36px", padding: 0 }}
                        aria-label="More options"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </>
                  )}

                  {isActionRev && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenReviewModal(app)}
                        className="btn pr"
                      >
                        Review self-tape
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuAppId(activeMenuAppId === app.id ? null : app.id);
                        }}
                        className="btn"
                        style={{ flex: "0 0 36px", padding: 0 }}
                        aria-label="More options"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </>
                  )}

                  {!isActionShort && !isActionRev && (
                    <Link
                      href={profileUrl}
                      className="btn"
                      style={{ textDecoration: "none" }}
                    >
                      View profile
                    </Link>
                  )}

                  {/* Dropdown Menu for Shortlisted / Self-Tape Ready */}
                  {activeMenuAppId === app.id && (
                    <div
                      ref={menuRef}
                      style={{
                        position: "absolute",
                        bottom: "44px",
                        right: 0,
                        width: "180px",
                        backgroundColor: "#0f1626",
                        border: "1px solid rgba(255, 255, 255, 0.16)",
                        borderRadius: "12px",
                        boxShadow: "0 16px 36px rgba(0, 0, 0, 0.75)",
                        padding: "6px",
                        zIndex: 40,
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        textAlign: "left",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuAppId(null);
                          setSelectedModalApp(app);
                          setSelectedNote("");
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          background: "transparent",
                          border: "none",
                          color: "var(--ok)",
                          fontSize: "13px",
                          fontWeight: "600",
                          fontFamily: "var(--font-sans), Inter, sans-serif",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
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
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          background: "transparent",
                          border: "none",
                          color: "#ff6b6b",
                          fontSize: "13px",
                          fontWeight: "600",
                          fontFamily: "var(--font-sans), Inter, sans-serif",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <XCircle size={14} />
                        <span>Not selected</span>
                      </button>

                      <div style={{ height: "1px", backgroundColor: "rgba(255, 255, 255, 0.08)", margin: "4px 0" }} />

                      <Link
                        href={profileUrl}
                        onClick={() => setActiveMenuAppId(null)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          color: "var(--tx)",
                          fontSize: "13px",
                          fontWeight: "600",
                          fontFamily: "var(--font-sans), Inter, sans-serif",
                          textDecoration: "none",
                        }}
                      >
                        <Eye size={14} style={{ color: "var(--mu)" }} />
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

      {/* MODAL 1: Review Self-Tape Modal */}
      {reviewVideoModalApp && (() => {
        const app = reviewVideoModalApp;
        const aud = getAuditionForApp(app.id);
        const opp = getOpportunityForApp(app.opportunityId);
        const profileUrl = `/recruiter/applications/${app.id}?from=shortlist&opp=${app.opportunityId}`;

        return (
          <Modal
            isOpen={!!reviewVideoModalApp}
            onClose={() => setReviewVideoModalApp(null)}
            title={`Review Self-Tape: ${app.talentName}`}
            subtitle={`Audition for ${app.roleApplied} • ${opp?.title || "Opportunity"}`}
            maxWidth="640px"
            footer={
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: "10px", flexWrap: "wrap" }}>
                <Link
                  href={profileUrl}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    height: "36px",
                    padding: "0 14px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "var(--tx)",
                    fontSize: "13px",
                    fontWeight: "600",
                    textDecoration: "none",
                  }}
                >
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
                    style={{
                      height: "36px",
                      padding: "0 14px",
                      borderRadius: "10px",
                      background: "transparent",
                      border: "1px solid rgba(255, 107, 107, 0.35)",
                      color: "#ff6b6b",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
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
                    style={{
                      height: "36px",
                      padding: "0 16px",
                      borderRadius: "10px",
                      background: "linear-gradient(180deg, var(--gold2), var(--gold))",
                      color: "#1a1300",
                      fontSize: "13px",
                      fontWeight: "600",
                      border: "none",
                      boxShadow: "0 2px 8px rgba(255, 188, 0, 0.25)",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <CheckCircle2 size={15} />
                    <span>Select for role</span>
                  </button>
                </div>
              </div>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <VideoPlayer
                src={aud?.selfTapeUrl}
                fileName={`${app.talentName}-SelfTape.mp4`}
                height="320px"
              />

              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "16px",
                  fontSize: "13px",
                }}
              >
                <div style={{ fontWeight: "600", color: "var(--tx)", marginBottom: "4px" }}>
                  Audition Instructions Relayed by Vismaya:
                </div>
                <p style={{ color: "var(--mu)", margin: 0, lineHeight: 1.5 }}>
                  {aud?.note || "Record a monologue focusing on natural dialogue delivery and camera presence."}
                </p>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* MODAL 2: Request Audition Modal */}
      {auditionModalApp && (
        <Modal
          isOpen={!!auditionModalApp}
          onClose={() => setAuditionModalApp(null)}
          title={`Request Audition for ${auditionModalApp.talentName}`}
          subtitle={`Role: ${auditionModalApp.roleApplied}`}
          maxWidth="560px"
        >
          <form onSubmit={handleSubmitAudition} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "13px", color: "var(--mu)", margin: 0, lineHeight: 1.5 }}>
              The Vismaya Casting Desk coordinates with the talent and relays instructions directly.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--tx)" }}>
                Audition Type *
              </label>
              <select
                value={auditionType}
                onChange={(e) => setAuditionType(e.target.value)}
                style={{
                  height: "40px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "10px",
                  padding: "0 14px",
                  color: "var(--tx)",
                  fontSize: "13px",
                  fontWeight: "600",
                  outline: "none",
                  cursor: "pointer",
                  colorScheme: "dark",
                }}
              >
                <option value="Audition" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>
                  Self-Tape Audition (Video Submission)
                </option>
                <option value="Interview" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>
                  1-on-1 Virtual Interview
                </option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--tx)" }}>
                Preferred Date (Optional)
              </label>
              <input
                type="date"
                value={auditionDate}
                onChange={(e) => setAuditionDate(e.target.value)}
                style={{
                  height: "40px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "10px",
                  padding: "0 14px",
                  color: "var(--tx)",
                  fontSize: "13px",
                  outline: "none",
                  colorScheme: "dark",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--tx)" }}>
                Directions Note for Talent *
              </label>
              <textarea
                rows={4}
                required
                value={auditionNote}
                onChange={(e) => setAuditionNote(e.target.value)}
                placeholder="Specify monologue, scenes, or dialogue directions..."
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  color: "var(--tx)",
                  fontSize: "13px",
                  outline: "none",
                  resize: "vertical",
                  lineHeight: 1.5,
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setAuditionModalApp(null)}
                style={{
                  height: "40px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "var(--tx)",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  height: "40px",
                  padding: "0 18px",
                  borderRadius: "10px",
                  background: "linear-gradient(180deg, var(--gold2), var(--gold))",
                  color: "#1a1300",
                  fontSize: "13px",
                  fontWeight: "600",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(255, 188, 0, 0.25)",
                  cursor: "pointer",
                }}
              >
                Send Request via Vismaya
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: Confirm Role Selection Modal */}
      {selectedModalApp && (
        <Modal
          isOpen={!!selectedModalApp}
          onClose={() => setSelectedModalApp(null)}
          title="Confirm Final Role Selection"
          maxWidth="520px"
        >
          <form onSubmit={handleConfirmSelect} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                backgroundColor: "rgba(52, 211, 153, 0.12)",
                border: "1px solid rgba(52, 211, 153, 0.3)",
                borderRadius: "12px",
                padding: "16px",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
              }}
            >
              <CheckCircle2 size={22} style={{ color: "var(--ok)", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong style={{ fontSize: "14px", color: "var(--tx)", display: "block" }}>
                  Select {selectedModalApp.talentName} for {selectedModalApp.roleApplied}
                </strong>
                <p style={{ fontSize: "12px", color: "var(--mu)", margin: "4px 0 0 0", lineHeight: 1.4 }}>
                  This decision is final and recorded in the audit trail.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--tx)" }}>
                Selection Note (Optional)
              </label>
              <textarea
                rows={3}
                value={selectedNote}
                onChange={(e) => setSelectedNote(e.target.value)}
                placeholder="E.g. Approved by Director for production contracting."
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  color: "var(--tx)",
                  fontSize: "13px",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setSelectedModalApp(null)}
                style={{
                  height: "40px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "var(--tx)",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  height: "40px",
                  padding: "0 18px",
                  borderRadius: "10px",
                  background: "linear-gradient(180deg, var(--gold2), var(--gold))",
                  color: "#1a1300",
                  fontSize: "13px",
                  fontWeight: "600",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(255, 188, 0, 0.25)",
                  cursor: "pointer",
                }}
              >
                Confirm Selection
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 4: Confirm Candidate Not Selected Modal */}
      {notSelectedModalApp && (
        <Modal
          isOpen={!!notSelectedModalApp}
          onClose={() => setNotSelectedModalApp(null)}
          title="Confirm Candidate Not Selected"
          maxWidth="520px"
        >
          <form onSubmit={handleConfirmNotSelected} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "13px", color: "var(--mu)", margin: 0, lineHeight: 1.5 }}>
              Are you sure you want to mark <strong style={{ color: "var(--tx)" }}>{notSelectedModalApp.talentName}</strong> as Not Selected? This decision is final.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--tx)" }}>
                Reason / Feedback (Optional)
              </label>
              <textarea
                rows={3}
                value={notSelectedReason}
                onChange={(e) => setNotSelectedReason(e.target.value)}
                placeholder="E.g. Role cast with alternative character reference."
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  color: "var(--tx)",
                  fontSize: "13px",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setNotSelectedModalApp(null)}
                style={{
                  height: "40px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "var(--tx)",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  height: "40px",
                  padding: "0 18px",
                  borderRadius: "10px",
                  backgroundColor: "transparent",
                  border: "1px solid rgba(255, 107, 107, 0.5)",
                  color: "#ff6b6b",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Confirm Not Selected
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Scoped CSS Styles strictly implementing vismaya-shortlist-v3.html */}
      <style jsx>{`
        :root {
          --bg: #0a0f19;
          --card: rgba(255, 255, 255, 0.055);
          --bd: rgba(255, 255, 255, 0.12);
          --tx: #eceaf5;
          --mu: #a3acc2;
          --gold: #ffbc00;
          --gold2: #ffd54a;
          --blue: #8ab4ff;
          --ok: #34d399;
          --gray: #8b94ab;
        }

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

        .page-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0;
          color: var(--tx, #eceaf5);
          font-family: var(--font-sans), Inter, system-ui, sans-serif;
        }

        .link-hover-icon {
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .candidate-name-link:hover .link-hover-icon {
          opacity: 1;
        }

        .candidate-name-link:hover b {
          color: var(--gold, #ffbc00);
        }

        /* TOOLBAR */
        .tool {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          margin: 22px 0 14px;
        }

        .in,
        .sel {
          height: 40px;
          border-radius: 10px;
          border: 1px solid var(--bd, rgba(255, 255, 255, 0.12));
          background: rgba(255, 255, 255, 0.06);
          color: var(--tx, #eceaf5);
          font: 500 14px var(--font-sans), Inter, sans-serif;
          padding: 0 14px;
          min-width: 0;
          outline: none;
          color-scheme: dark;
        }

        .sel {
          width: 260px;
          cursor: pointer;
        }

        .in {
          flex: 1;
          min-width: 200px;
        }

        /* TABS */
        .tabs {
          display: flex;
          gap: 8px;
          flex-wrap: nowrap;
          overflow-x: auto;
          scrollbar-width: none;
          margin: 6px 0 20px;
          padding-bottom: 2px;
        }

        .tabs::-webkit-scrollbar {
          display: none;
        }

        .tab {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          height: 44px;
          padding: 0 18px;
          border-radius: 12px;
          border: 1px solid var(--bd, rgba(255, 255, 255, 0.12));
          background: var(--card, rgba(255, 255, 255, 0.055));
          color: var(--mu, #a3acc2);
          font: 600 14px var(--font-sans), Inter, sans-serif;
          cursor: pointer;
          flex: 0 0 auto;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .tab b {
          font-weight: 700;
          font-size: 12px;
          background: rgba(255, 255, 255, 0.1);
          color: var(--tx, #eceaf5);
          border-radius: 999px;
          padding: 1px 9px;
        }

        .tab.on {
          background: var(--c, var(--gold));
          border-color: transparent;
          color: #0a0f19;
        }

        .tab.on b {
          background: rgba(0, 0, 0, 0.18);
          color: #0a0f19;
        }

        /* NEED PILL */
        .need {
          margin-bottom: 16px;
        }

        .sc {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid var(--bd, rgba(255, 255, 255, 0.12));
          background: var(--card, rgba(255, 255, 255, 0.055));
          font-size: 13px;
          color: var(--mu, #a3acc2);
        }

        .sc b {
          font: 700 18px var(--font-sans), Inter, sans-serif;
          color: var(--tx, #eceaf5);
        }

        .sc i {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--gold, #ffbc00);
        }

        /* STANDALONE CANDIDATE GRID */
        .grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          align-items: stretch;
        }

        .cd {
          background: #111a2c;
          border: 1px solid var(--bd, rgba(255, 255, 255, 0.12));
          border-top: 3px solid var(--c, var(--gold));
          border-radius: 14px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          height: 100%;
          transition: transform 0.18s, border-color 0.18s;
        }

        .cd:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 188, 0, 0.35);
        }

        .cd.dim {
          opacity: 0.75;
        }

        .p {
          display: flex;
          gap: 10px;
          align-items: center;
          min-width: 0;
        }

        .av {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          flex: none;
          display: grid;
          place-items: center;
          font: 700 13px var(--font-sans), Inter, sans-serif;
          color: #fff;
          background: var(--a, #16243e);
        }

        .p b {
          display: block;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .p span {
          display: block;
          font-size: 12px;
          color: var(--mu, #a3acc2);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .role {
          font-size: 13px;
          font-weight: 600;
          line-height: 1.35;
          overflow-wrap: break-word;
          word-break: normal;
        }

        .role small {
          display: block;
          font-weight: 400;
          font-size: 12px;
          color: var(--mu, #a3acc2);
          margin-top: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .st {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 600;
          color: var(--c, var(--gold));
        }

        .st:before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--c, var(--gold));
          flex-shrink: 0;
        }

        .row {
          display: flex;
          gap: 8px;
        }

        .row .btn {
          flex: 1;
        }

        .mt {
          margin-top: auto;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 36px;
          padding: 0 14px;
          border-radius: 10px;
          font: 600 13px var(--font-sans), Inter, sans-serif;
          border: 1px solid var(--bd, rgba(255, 255, 255, 0.12));
          background: rgba(255, 255, 255, 0.06);
          color: var(--tx, #eceaf5);
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: border-color 0.15s ease;
        }

        .btn:hover {
          border-color: rgba(255, 188, 0, 0.5);
        }

        .btn.pr {
          background: linear-gradient(180deg, var(--gold2, #ffd54a), var(--gold, #ffbc00));
          border-color: transparent;
          color: #1a1300;
          box-shadow: 0 2px 8px rgba(255, 188, 0, 0.25);
        }

        .empty {
          border: 1px dashed var(--bd, rgba(255, 255, 255, 0.12));
          border-radius: 12px;
          padding: 28px 12px;
          text-align: center;
          color: var(--mu, #a3acc2);
          font-size: 13px;
        }

        /* RESPONSIVE BREAKPOINTS EXACTLY AS SPECIFIED */
        @media (max-width: 1199.98px) {
          .grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 899.98px) {
          .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 767.98px) {
          .sel,
          .in {
            width: 100% !important;
            flex: 1 1 100% !important;
          }
          .btn {
            height: 40px;
          }
        }

        @media (max-width: 599.98px) {
          .grid {
            grid-template-columns: 1fr;
          }
          .tab {
            padding: 0 14px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
