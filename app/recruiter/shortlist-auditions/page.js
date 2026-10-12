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
  const TABS = useMemo(
    () => [
      { key: "all", label: "All", filter: () => true },
      { key: "short", label: "Shortlisted", filter: (app) => getAppStage(app) === "short" },
      {
        key: "aud",
        label: "Audition / Interview",
        filter: (app) => {
          const s = getAppStage(app);
          return s === "req" || s === "tal";
        },
      },
      { key: "rev", label: "Self-tape ready", filter: (app) => getAppStage(app) === "rev" },
      { key: "sel", label: "Selected", filter: (app) => getAppStage(app) === "sel" },
      { key: "no", label: "Not selected", filter: (app) => getAppStage(app) === "no" },
    ],
    [auditions]
  );

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

  // Render Status Pill for Candidate Card (Strictly light theme tokens)
  const renderStatusPill = (stage, app) => {
    if (stage === "rev") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            fontWeight: 700,
            borderRadius: "999px",
            padding: "6px 12px",
            backgroundColor: "#F3EFE6",
            color: "#2B2D2A",
            width: "fit-content",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: "#8A6B2E",
              flexShrink: 0,
            }}
          />
          <span>Self-tape ready</span>
          <span
            style={{
              color: "#5A584F",
              fontVariantNumeric: "tabular-nums",
              fontWeight: 600,
              fontSize: "11.5px",
            }}
          >
            01:24
          </span>
        </span>
      );
    }

    if (stage === "short") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            fontWeight: 700,
            borderRadius: "999px",
            padding: "6px 12px",
            backgroundColor: "rgba(138, 107, 46, 0.12)",
            color: "#6E5420",
            width: "fit-content",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: "#8A6B2E",
              flexShrink: 0,
            }}
          />
          <span>Needs your action</span>
        </span>
      );
    }

    if (stage === "req" || stage === "tal") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            fontWeight: 700,
            borderRadius: "999px",
            padding: "6px 12px",
            backgroundColor: "rgba(201, 165, 92, 0.18)",
            color: "#6E5420",
            width: "fit-content",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: "#8A6B2E",
              flexShrink: 0,
            }}
          />
          <span>Audition / Interview</span>
        </span>
      );
    }

    if (stage === "sel") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            fontWeight: 700,
            borderRadius: "999px",
            padding: "6px 12px",
            backgroundColor: "rgba(138, 107, 46, 0.14)",
            color: "#6E5420",
            width: "fit-content",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          <CheckCircle2 size={13} style={{ color: "#8A6B2E" }} />
          <span>Selected</span>
        </span>
      );
    }

    if (stage === "no") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            fontWeight: 700,
            borderRadius: "999px",
            padding: "6px 12px",
            backgroundColor: "#F3EFE6",
            color: "#5A584F",
            width: "fit-content",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: "#5A584F",
              flexShrink: 0,
            }}
          />
          <span>Not selected</span>
        </span>
      );
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "12px",
          fontWeight: 700,
          borderRadius: "999px",
          padding: "6px 12px",
          backgroundColor: "#F3EFE6",
          color: "#5A584F",
          width: "fit-content",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        <span>Under Review</span>
      </span>
    );
  };

  // Loading skeleton
  if (!isHydrated) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ height: "48px", background: "#F3EFE6", borderRadius: "12px", width: "40%" }} />
        <div style={{ height: "120px", background: "#FFFFFF", border: "1px solid #E8E2D4", borderRadius: "16px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: "300px", background: "#FFFFFF", border: "1px solid #E8E2D4", borderRadius: "20px" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="v-shortlist-page-wrapper">
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
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            boxShadow: "0 8px 24px rgba(43, 45, 42, 0.12)",
            borderRadius: "12px",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#2B2D2A",
            fontSize: "13.5px",
            fontWeight: 600,
            animation: "toastIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <CheckCircle2 size={18} style={{ color: "#8A6B2E", flexShrink: 0 }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb & Main Page Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
        <nav
          aria-label="Breadcrumb"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            fontFamily: "var(--font-body), 'Inter', sans-serif",
          }}
        >
          <Link
            href="/recruiter/dashboard"
            style={{ color: "#5A584F", textDecoration: "none", transition: "color 0.15s ease" }}
            className="v-breadcrumb-link"
          >
            Dashboard
          </Link>
          <span style={{ color: "#E8E2D4" }}>&gt;</span>
          <span style={{ color: "#8A6B2E", fontWeight: 600 }}>Shortlist & Auditions</span>
        </nav>

        <div>
          <h1
            style={{
              fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
              fontSize: "clamp(28px, 4vw, 40px)",
              lineHeight: 1.2,
              fontWeight: 600,
              color: "#2B2D2A",
              margin: "0 0 8px 0",
              letterSpacing: "-0.015em",
            }}
          >
            Shortlist & Auditions
          </h1>
          <p
            style={{
              fontSize: "16px",
              lineHeight: 1.5,
              color: "#5A584F",
              margin: 0,
              maxWidth: "760px",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
            }}
          >
            Move shortlisted talent through audition and review self-tapes before making the final selection.
          </p>
        </div>
      </div>

      {/* Filter Toolbar Card (Single White Card) */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E2D4",
          borderRadius: "16px",
          padding: "20px 24px",
          boxShadow: "0 2px 12px rgba(43, 45, 42, 0.03)",
          marginBottom: "28px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
        className="v-toolbar-card"
      >
        {/* Top Row: Opportunity Select + Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            width: "100%",
          }}
          className="v-toolbar-top"
        >
          <select
            className="v-opp-select"
            value={selectedOppId}
            onChange={(e) => setSelectedOppId(e.target.value)}
            aria-label="Filter Opportunity"
            style={{
              width: "280px",
              height: "44px",
              borderRadius: "10px",
              border: "1px solid #E8E2D4",
              backgroundColor: "#FFFFFF",
              color: "#2B2D2A",
              fontSize: "15px",
              fontWeight: 500,
              padding: "0 14px",
              outline: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              transition: "border-color 0.18s ease, box-shadow 0.18s ease",
            }}
          >
            <option value="ALL">All opportunities ({orgOpportunities.length})</option>
            {orgOpportunities.map((opp) => (
              <option key={opp.id} value={opp.id}>
                {opp.title}
              </option>
            ))}
          </select>

          <div
            style={{
              flex: "1 1 320px",
              maxWidth: "460px",
              marginLeft: "auto",
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
            className="v-search-box"
          >
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "14px",
                color: "#5A584F",
                pointerEvents: "none",
              }}
            />
            <input
              className="v-search-input"
              type="text"
              placeholder="Search candidate, role or project"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search"
              style={{
                width: "100%",
                height: "44px",
                borderRadius: "10px",
                border: "1px solid #E8E2D4",
                backgroundColor: "#FFFFFF",
                color: "#2B2D2A",
                fontSize: "14px",
                padding: "0 14px 0 40px",
                outline: "none",
                fontFamily: "var(--font-body), 'Inter', sans-serif",
                transition: "border-color 0.18s ease, box-shadow 0.18s ease",
              }}
            />
          </div>
        </div>

        {/* Bottom Row: Pill Tabs + Action Counter */}
        <div
          style={{
            borderTop: "1px solid #E8E2D4",
            paddingTop: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
            width: "100%",
          }}
          className="v-tabs-row"
        >
          <div
            className="v-tabs-scroll-container"
            role="tablist"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
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
                  style={{
                    height: "40px",
                    padding: "0 16px",
                    borderRadius: "999px",
                    fontFamily: "var(--font-body), 'Inter', sans-serif",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "1px solid transparent",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    whiteSpace: "nowrap",
                    transition: "all 0.18s ease",
                    backgroundColor: isActive ? "#8A6B2E" : "transparent",
                    color: isActive ? "#FFFFFF" : "#5A584F",
                    boxShadow: isActive ? "0 2px 6px rgba(138, 107, 46, 0.25)" : "none",
                  }}
                  className={`v-tab-btn ${isActive ? "active" : ""}`}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      height: "22px",
                      minWidth: "22px",
                      padding: "0 7px",
                      borderRadius: "999px",
                      backgroundColor: isActive ? "rgba(255, 255, 255, 0.22)" : "#F3EFE6",
                      color: isActive ? "#FFFFFF" : "#2B2D2A",
                      fontSize: "12px",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.18s ease",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Need Action Indicator */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#6E5420",
              whiteSpace: "nowrap",
              marginLeft: "auto",
            }}
            className="v-need-action-tag"
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#8A6B2E",
                flexShrink: 0,
              }}
            />
            <span>
              <strong style={{ color: "#2B2D2A", fontWeight: 700 }}>{needActionCount}</strong> need your action
            </span>
          </div>
        </div>
      </div>

      {/* Candidate Standalone Grid */}
      <div className="v-candidate-grid">
        {displayApplications.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E2D4",
              borderRadius: "20px",
              padding: "56px 24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              boxShadow: "0 2px 8px rgba(43, 45, 42, 0.03)",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: "#F3EFE6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#8A6B2E",
                marginBottom: "4px",
              }}
            >
              <Users size={32} />
            </div>
            <h3
              style={{
                fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                fontSize: "22px",
                fontWeight: 600,
                color: "#2B2D2A",
                margin: 0,
              }}
            >
              No candidates found
            </h3>
            <p style={{ color: "#5A584F", fontSize: "14px", margin: 0, maxWidth: "420px", lineHeight: 1.5 }}>
              Try selecting another stage filter or search term to view candidates.
            </p>
          </div>
        ) : (
          displayApplications.map((app) => {
            const prof = app.talentProfile || {};
            const aud = getAuditionForApp(app.id);
            const opp = getOpportunityForApp(app.opportunityId);
            const proj = getProjectForOpp(opp);
            const stage = getAppStage(app);
            const isClosed = stage === "no";
            const profileUrl = `/recruiter/applications/${app.id}?from=shortlist&opp=${app.opportunityId}`;

            const isActionShort = stage === "short";
            const isActionRev = stage === "rev";

            return (
              <article
                key={`candidate-card-${app.id}`}
                className={`v-candidate-card ${isClosed ? "closed-card" : ""}`}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8E2D4",
                  borderRadius: "20px",
                  padding: "22px",
                  boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06)",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  boxSizing: "border-box",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                  gap: "14px",
                }}
              >
                {/* 1. Candidate Info: Avatar + Name + Age/City */}
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <Link
                    href={profileUrl}
                    style={{
                      display: "flex",
                      textDecoration: "none",
                      color: "inherit",
                      flexShrink: 0,
                    }}
                  >
                    {prof.avatar ? (
                      <img
                        src={prof.avatar}
                        alt={app.talentName}
                        style={{
                          width: "52px",
                          height: "52px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "1px solid #E8E2D4",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "52px",
                          height: "52px",
                          borderRadius: "50%",
                          backgroundColor: "#F3EFE6",
                          border: "1px solid #E8E2D4",
                          color: "#8A6B2E",
                          fontSize: "16px",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                        }}
                      >
                        {getInitials(app.talentName)}
                      </div>
                    )}
                  </Link>

                  <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
                    <Link
                      href={profileUrl}
                      className="v-candidate-name-link"
                      style={{
                        textDecoration: "none",
                        color: "#2B2D2A",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        maxWidth: "100%",
                      }}
                      title={app.talentName}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                          fontSize: "20px",
                          fontWeight: 600,
                          color: "#2B2D2A",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          lineHeight: 1.25,
                        }}
                        className="v-candidate-name-text"
                      >
                        {app.talentName}
                      </span>
                      <ExternalLink
                        size={13}
                        style={{ color: "#5A584F", flexShrink: 0, transition: "color 0.15s ease" }}
                        className="v-link-icon"
                      />
                    </Link>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#5A584F",
                        lineHeight: 1.3,
                        fontFamily: "var(--font-body), 'Inter', sans-serif",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {prof.age ? `${prof.age} yrs` : "—"} · {prof.city || "Mumbai"}
                    </span>
                  </div>
                </div>

                {/* 2. Role & Project */}
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-body), 'Inter', sans-serif",
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#2B2D2A",
                      lineHeight: 1.35,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                    title={app.roleApplied}
                  >
                    {app.roleApplied}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#5A584F",
                      lineHeight: 1.35,
                      fontFamily: "var(--font-body), 'Inter', sans-serif",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                    title={getProjectRoleSubtitle(proj, opp)}
                  >
                    {getProjectRoleSubtitle(proj, opp)}
                  </div>
                </div>

                {/* 3. Status Line with Colored Pill */}
                <div style={{ paddingTop: "2px" }}>
                  {renderStatusPill(stage, app)}
                </div>

                {/* 4. Action Row (Pinned to bottom with margin-top: auto) */}
                <div
                  style={{
                    marginTop: "auto",
                    paddingTop: "18px",
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                    position: "relative",
                  }}
                  className="v-card-actions-row"
                >
                  {isActionShort ? (
                    <button
                      type="button"
                      onClick={() => handleOpenAuditionModal(app)}
                      style={{
                        flex: 1,
                        height: "44px",
                        backgroundColor: "#8A6B2E",
                        color: "#FFFFFF",
                        borderRadius: "10px",
                        fontSize: "14px",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        fontFamily: "var(--font-body), 'Inter', sans-serif",
                        boxShadow: "0 2px 6px rgba(138, 107, 46, 0.20)",
                        transition: "all 0.18s ease",
                        whiteSpace: "nowrap",
                      }}
                      className="v-card-primary-btn"
                    >
                      Request audition
                    </button>
                  ) : isActionRev ? (
                    <button
                      type="button"
                      onClick={() => handleOpenReviewModal(app)}
                      style={{
                        flex: 1,
                        height: "44px",
                        backgroundColor: "#8A6B2E",
                        color: "#FFFFFF",
                        borderRadius: "10px",
                        fontSize: "14px",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        fontFamily: "var(--font-body), 'Inter', sans-serif",
                        boxShadow: "0 2px 6px rgba(138, 107, 46, 0.20)",
                        transition: "all 0.18s ease",
                        whiteSpace: "nowrap",
                      }}
                      className="v-card-primary-btn"
                    >
                      Review self-tape
                    </button>
                  ) : stage === "req" || stage === "tal" ? (
                    <Link
                      href={profileUrl}
                      style={{
                        flex: 1,
                        height: "44px",
                        backgroundColor: "#8A6B2E",
                        color: "#FFFFFF",
                        borderRadius: "10px",
                        fontSize: "14px",
                        fontWeight: 600,
                        border: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        textDecoration: "none",
                        fontFamily: "var(--font-body), 'Inter', sans-serif",
                        boxShadow: "0 2px 6px rgba(138, 107, 46, 0.20)",
                        transition: "all 0.18s ease",
                        whiteSpace: "nowrap",
                      }}
                      className="v-card-primary-btn"
                    >
                      View audition
                    </Link>
                  ) : (
                    <Link
                      href={profileUrl}
                      style={{
                        flex: 1,
                        height: "44px",
                        backgroundColor: "#8A6B2E",
                        color: "#FFFFFF",
                        borderRadius: "10px",
                        fontSize: "14px",
                        fontWeight: 600,
                        border: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        textDecoration: "none",
                        fontFamily: "var(--font-body), 'Inter', sans-serif",
                        boxShadow: "0 2px 6px rgba(138, 107, 46, 0.20)",
                        transition: "all 0.18s ease",
                        whiteSpace: "nowrap",
                      }}
                      className="v-card-primary-btn"
                    >
                      View profile
                    </Link>
                  )}

                  {/* Overflow "..." Menu Button on all cards */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuAppId(activeMenuAppId === app.id ? null : app.id);
                    }}
                    style={{
                      width: "44px",
                      height: "44px",
                      flex: "0 0 44px",
                      borderRadius: "10px",
                      border: "1px solid #E8E2D4",
                      backgroundColor: "#FFFFFF",
                      color: "#5A584F",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.18s ease",
                    }}
                    className="v-card-menu-btn"
                    aria-label="More options"
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenuAppId === app.id && (
                    <div
                      ref={menuRef}
                      style={{
                        position: "absolute",
                        bottom: "52px",
                        right: 0,
                        width: "190px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E8E2D4",
                        borderRadius: "12px",
                        boxShadow: "0 12px 32px rgba(43, 45, 42, 0.14)",
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
                          color: "#6E5420",
                          fontSize: "13px",
                          fontWeight: 600,
                          fontFamily: "var(--font-body), 'Inter', sans-serif",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background-color 0.15s ease",
                        }}
                        className="v-menu-item-ok"
                      >
                        <CheckCircle2 size={14} style={{ color: "#8A6B2E" }} />
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
                          color: "#B42318",
                          fontSize: "13px",
                          fontWeight: 600,
                          fontFamily: "var(--font-body), 'Inter', sans-serif",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background-color 0.15s ease",
                        }}
                        className="v-menu-item-danger"
                      >
                        <XCircle size={14} style={{ color: "#B42318" }} />
                        <span>Not selected</span>
                      </button>

                      <div style={{ height: "1px", backgroundColor: "#E8E2D4", margin: "4px 0" }} />

                      <Link
                        href={profileUrl}
                        onClick={() => setActiveMenuAppId(null)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          color: "#2B2D2A",
                          fontSize: "13px",
                          fontWeight: 600,
                          fontFamily: "var(--font-body), 'Inter', sans-serif",
                          textDecoration: "none",
                          transition: "background-color 0.15s ease",
                        }}
                        className="v-menu-item-ghost"
                      >
                        <Eye size={14} style={{ color: "#5A584F" }} />
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

      {/* MODAL 1: Review Self-Tape Modal (Light Theme) */}
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <Link
                  href={profileUrl}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    height: "40px",
                    padding: "0 14px",
                    borderRadius: "10px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E8E2D4",
                    color: "#5A584F",
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                  className="v-modal-ghost-btn"
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
                      height: "40px",
                      padding: "0 14px",
                      borderRadius: "10px",
                      background: "transparent",
                      border: "1px solid rgba(180, 35, 24, 0.3)",
                      color: "#B42318",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
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
                    style={{
                      height: "40px",
                      padding: "0 18px",
                      borderRadius: "10px",
                      backgroundColor: "#8A6B2E",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      fontWeight: 600,
                      border: "none",
                      boxShadow: "0 2px 8px rgba(138, 107, 46, 0.22)",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
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

              <div
                style={{
                  backgroundColor: "#F3EFE6",
                  border: "1px solid #E8E2D4",
                  borderRadius: "12px",
                  padding: "16px",
                  fontSize: "13px",
                }}
              >
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

      {/* MODAL 2: Request Audition Modal (Light Theme) */}
      {auditionModalApp && (
        <Modal
          isOpen={!!auditionModalApp}
          onClose={() => setAuditionModalApp(null)}
          title={`Request Audition for ${auditionModalApp.talentName}`}
          subtitle={`Role: ${auditionModalApp.roleApplied}`}
          maxWidth="560px"
        >
          <form onSubmit={handleSubmitAudition} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "13.5px", color: "#5A584F", margin: 0, lineHeight: 1.5 }}>
              The Vismaya Casting Desk coordinates with the talent and relays instructions directly.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>
                Audition Type *
              </label>
              <select
                value={auditionType}
                onChange={(e) => setAuditionType(e.target.value)}
                style={{
                  height: "42px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8E2D4",
                  borderRadius: "10px",
                  padding: "0 14px",
                  color: "#2B2D2A",
                  fontSize: "13.5px",
                  fontWeight: 500,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="Audition">
                  Self-Tape Audition (Video Submission)
                </option>
                <option value="Interview">
                  1-on-1 Virtual Interview
                </option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>
                Preferred Date (Optional)
              </label>
              <input
                type="date"
                value={auditionDate}
                onChange={(e) => setAuditionDate(e.target.value)}
                style={{
                  height: "42px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8E2D4",
                  borderRadius: "10px",
                  padding: "0 14px",
                  color: "#2B2D2A",
                  fontSize: "13.5px",
                  outline: "none",
                }}
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
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8E2D4",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  color: "#2B2D2A",
                  fontSize: "13.5px",
                  outline: "none",
                  resize: "vertical",
                  lineHeight: 1.5,
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setAuditionModalApp(null)}
                style={{
                  height: "42px",
                  padding: "0 16px",
                  borderRadius: "10px",
                  background: "#FFFFFF",
                  border: "1px solid #E8E2D4",
                  color: "#2B2D2A",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  height: "42px",
                  padding: "0 20px",
                  borderRadius: "10px",
                  backgroundColor: "#8A6B2E",
                  color: "#FFFFFF",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  border: "none",
                  boxShadow: "0 2px 8px rgba(138, 107, 46, 0.22)",
                  cursor: "pointer",
                }}
                className="v-modal-primary-btn"
              >
                Send Request via Vismaya
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: Confirm Role Selection Modal (Light Theme) */}
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
                backgroundColor: "rgba(138, 107, 46, 0.08)",
                border: "1px solid rgba(138, 107, 46, 0.22)",
                borderRadius: "12px",
                padding: "16px",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
              }}
            >
              <CheckCircle2 size={22} style={{ color: "#8A6B2E", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong style={{ fontSize: "14px", color: "#2B2D2A", display: "block" }}>
                  Select {selectedModalApp.talentName} for {selectedModalApp.roleApplied}
                </strong>
                <p style={{ fontSize: "12px", color: "#5A584F", margin: "4px 0 0 0", lineHeight: 1.4 }}>
                  This decision is final and recorded in the audit trail.
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
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8E2D4",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  color: "#2B2D2A",
                  fontSize: "13.5px",
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setSelectedModalApp(null)}
                style={{
                  height: "42px",
                  padding: "0 16px",
                  borderRadius: "10px",
                  background: "#FFFFFF",
                  border: "1px solid #E8E2D4",
                  color: "#2B2D2A",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  height: "42px",
                  padding: "0 20px",
                  borderRadius: "10px",
                  backgroundColor: "#8A6B2E",
                  color: "#FFFFFF",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  border: "none",
                  boxShadow: "0 2px 8px rgba(138, 107, 46, 0.22)",
                  cursor: "pointer",
                }}
                className="v-modal-primary-btn"
              >
                Confirm Selection
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 4: Confirm Candidate Not Selected Modal (Light Theme) */}
      {notSelectedModalApp && (
        <Modal
          isOpen={!!notSelectedModalApp}
          onClose={() => setNotSelectedModalApp(null)}
          title="Confirm Candidate Not Selected"
          maxWidth="520px"
        >
          <form onSubmit={handleConfirmNotSelected} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "14px", color: "#5A584F", margin: 0, lineHeight: 1.5 }}>
              Are you sure you want to mark <strong style={{ color: "#2B2D2A" }}>{notSelectedModalApp.talentName}</strong> as Not Selected? This decision is final.
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
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8E2D4",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  color: "#2B2D2A",
                  fontSize: "13.5px",
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setNotSelectedModalApp(null)}
                style={{
                  height: "42px",
                  padding: "0 16px",
                  borderRadius: "10px",
                  background: "#FFFFFF",
                  border: "1px solid #E8E2D4",
                  color: "#2B2D2A",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  height: "42px",
                  padding: "0 20px",
                  borderRadius: "10px",
                  backgroundColor: "#B42318",
                  color: "#FFFFFF",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  border: "none",
                  boxShadow: "0 2px 8px rgba(180, 35, 24, 0.22)",
                  cursor: "pointer",
                }}
              >
                Confirm Not Selected
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Embedded CSS */}
      <style jsx>{`
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
          gap: 0;
          color: #2B2D2A;
          font-family: var(--font-body), 'Inter', sans-serif;
        }

        .v-breadcrumb-link:hover {
          color: #8A6B2E !important;
        }

        .v-opp-select:focus,
        .v-search-input:focus {
          border-color: #8A6B2E !important;
          box-shadow: 0 0 0 3px rgba(138, 107, 46, 0.18) !important;
        }

        .v-tab-btn:not(.active):hover {
          background-color: #F3EFE6 !important;
          color: #2B2D2A !important;
        }

        .v-candidate-card:hover {
          transform: translateY(-3px) !important;
          border-color: #C9A55C !important;
          box-shadow: 0 4px 8px rgba(43, 45, 42, 0.06), 0 16px 32px rgba(43, 45, 42, 0.08) !important;
        }

        .v-candidate-card.closed-card {
          opacity: 0.78;
        }

        .v-candidate-name-link:hover .v-candidate-name-text {
          color: #8A6B2E !important;
        }
        .v-candidate-name-link:hover .v-link-icon {
          color: #8A6B2E !important;
        }

        .v-card-primary-btn:hover {
          background-color: #6E5420 !important;
          transform: translateY(-1px);
        }
        .v-card-primary-btn:active {
          transform: scale(0.98);
        }

        .v-card-menu-btn:hover {
          border-color: #8A6B2E !important;
          background-color: #F3EFE6 !important;
          color: #8A6B2E !important;
        }

        .v-menu-item-ok:hover {
          background-color: #F3EFE6 !important;
        }
        .v-menu-item-danger:hover {
          background-color: rgba(180, 35, 24, 0.08) !important;
        }
        .v-menu-item-ghost:hover {
          background-color: #F3EFE6 !important;
        }

        .v-modal-ghost-btn:hover {
          border-color: #8A6B2E !important;
          background-color: #F3EFE6 !important;
          color: #2B2D2A !important;
        }
        .v-modal-danger-btn:hover {
          background-color: rgba(180, 35, 24, 0.08) !important;
        }
        .v-modal-primary-btn:hover {
          background-color: #6E5420 !important;
        }

        /* GRID RESPONSIVE BREAKPOINTS */
        .v-candidate-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 24px;
          align-items: stretch;
          margin-bottom: 32px;
        }

        @media (max-width: 1280px) {
          .v-candidate-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 16px !important;
          }
          .v-candidate-card {
            padding: 18px 16px !important;
          }
          .v-candidate-name-text {
            font-size: 18px !important;
          }
          .v-card-primary-btn {
            font-size: 13px !important;
            padding: 0 8px !important;
          }
        }

        @media (max-width: 899.98px) {
          .v-candidate-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 20px !important;
          }
          .v-candidate-card {
            padding: 22px !important;
          }
          .v-candidate-name-text {
            font-size: 20px !important;
          }
        }

        @media (max-width: 640px) {
          .v-candidate-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .v-toolbar-card {
            padding: 16px !important;
          }
          .v-toolbar-top {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .v-opp-select {
            width: 100% !important;
          }
          .v-search-box {
            width: 100% !important;
            max-width: 100% !important;
            margin-left: 0 !important;
          }
          .v-tabs-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .v-tabs-scroll-container {
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: auto !important;
            flex-wrap: nowrap !important;
            padding-bottom: 4px !important;
            -webkit-overflow-scrolling: touch;
          }
          .v-need-action-tag {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
