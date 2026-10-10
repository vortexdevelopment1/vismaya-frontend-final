"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  UserCheck,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Calendar,
  Clock,
  Video,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Eye,
  Trophy,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/shared/StatusBadge";
import OpportunityCard from "@/components/talent/OpportunityCard";
import OpportunityApplyModal from "@/components/talent/OpportunityApplyModal";
import NotificationItem from "@/components/talent/NotificationItem";
import { useWorkflow } from "@/lib/shared/workflowStore";
import { useTalent } from "@/lib/talent/TalentContext";

export default function TalentDashboardPage() {
  const {
    opportunities,
    projects,
    applications,
    auditions,
    getProject,
    getOpportunity,
    getNotificationsForRole,
    isHydrated,
  } = useWorkflow();

  const {
    profile,
    profileCompletionScore,
    profileChecklist,
  } = useTalent();

  const currentTalentId = "tal-904";

  const [selectedOppForApply, setSelectedOppForApply] = useState(null);

  // Filter entities for current talent
  const myApplications = useMemo(
    () => applications.filter((a) => a.talentId === currentTalentId),
    [applications]
  );

  const myAuditions = useMemo(
    () => auditions.filter((aud) => aud.talentId === currentTalentId),
    [auditions]
  );

  const publishedOpportunities = useMemo(
    () => opportunities.filter((o) => o.status === "Published"),
    [opportunities]
  );

  const talentNotifications = useMemo(
    () => getNotificationsForRole("talent", currentTalentId),
    [getNotificationsForRole]
  );

  // Derived dashboard stats
  const totalAppsCount = myApplications.length;
  const shortlistedCount = myApplications.filter((a) => a.status === "Shortlisted").length;
  const selectedCount = myApplications.filter((a) => a.status === "Selected").length;
  const pendingAuditionsCount = myAuditions.filter(
    (aud) => aud.status === "Relayed to Talent"
  ).length;

  const recentApplications = myApplications.slice(0, 4);
  const featuredOpportunities = publishedOpportunities.slice(0, 3);
  const recentNotifications = talentNotifications.slice(0, 3);

  // Profile Ring Math
  const ringRadius = 46;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = circumference - (profileCompletionScore / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Welcome & Overview Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <h1
              style={{
                fontSize: "1.9rem",
                fontWeight: "800",
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Welcome back, {profile.personal.fullName.split(" ")[0]}!
            </h1>
            <StatusBadge status={profile.status} size="md" />
          </div>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", margin: 0 }}>
            Here is your casting pipeline summary, upcoming auditions, and published opportunities.
          </p>
        </div>

        <Link
          href="/talent/opportunities"
          className="btn-primary"
          style={{ padding: "10px 22px", fontSize: "0.9rem", borderRadius: "12px" }}
        >
          <Megaphone size={16} />
          <span>Browse Opportunities</span>
        </Link>
      </div>

      {/* Top 4 Stat Cards: Applications, Shortlisted, Selected, Audition requests pending */}
      <div className="talent-stat-grid">
        <StatCard
          title="Applications"
          value={totalAppsCount}
          change={totalAppsCount > 0 ? "Active in review" : "None"}
          isPositive={true}
          description="Submitted candidate profiles"
          iconName="FileText"
        />

        <StatCard
          title="Shortlisted"
          value={shortlistedCount}
          change={shortlistedCount > 0 ? "Under consideration" : "None"}
          isPositive={true}
          description="Shortlisted by organizations"
          iconName="UserCheck"
        />

        <StatCard
          title="Selected"
          value={selectedCount}
          change={selectedCount > 0 ? "Roles confirmed" : "None"}
          isPositive={true}
          description="Confirmed character selections"
          iconName="Trophy"
        />

        <StatCard
          title="Auditions Pending"
          value={pendingAuditionsCount}
          change={pendingAuditionsCount > 0 ? "Self-tape required" : "All clear"}
          isPositive={pendingAuditionsCount > 0}
          description="Audition &amp; interview requests"
          iconName="Video"
        />
      </div>

      {/* Profile Completion Card with Gradient Ring & Checklist */}
      <div
        className="card-surface"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.07)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          borderRadius: "16px",
          padding: "clamp(16px, 3vw, 28px)",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "24px",
            alignItems: "center",
          }}
          className="profile-ring-grid"
        >
          {/* Circular SVG Ring */}
          <div
            style={{
              position: "relative",
              width: "120px",
              height: "120px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
              <defs>
                <linearGradient id="profileRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffd54a" />
                  <stop offset="100%" stopColor="#ffbc00" />
                </linearGradient>
              </defs>
              <circle
                cx="60"
                cy="60"
                r={ringRadius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r={ringRadius}
                fill="none"
                stroke="url(#profileRingGrad)"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
              />
            </svg>

            {/* Center Percentage */}
            <div
              style={{
                position: "absolute",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontSize: "1.45rem",
                  fontWeight: 800,
                  color: "#eceaf5",
                  lineHeight: 1,
                }}
              >
                {profileCompletionScore}%
              </span>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  color: "var(--gold)",
                  textTransform: "uppercase",
                  marginTop: "3px",
                  letterSpacing: "0.06em",
                }}
              >
                Score
              </span>
            </div>
          </div>

          {/* Details & Checklist */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={18} style={{ color: "var(--gold)", flexShrink: 0 }} />
                  <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#eceaf5", margin: 0 }}>
                    Artist Profile Strength
                  </h2>
                </div>
                <span style={{ fontSize: "0.85rem", color: "#a3acc2", marginTop: "4px", display: "block" }}>
                  Keep your portfolio clips and looks up to date to increase shortlist rankings with casting teams.
                </span>
              </div>

              <Link
                href="/talent/profile"
                className="btn-secondary"
                style={{ fontSize: "0.85rem", padding: "8px 18px", borderRadius: "12px", minHeight: "38px" }}
              >
                <span>Edit Profile</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* Checklist items */}
            <div className="profile-checklist-grid">
              {profileChecklist.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.section === "portfolio" ? "/talent/portfolio" : "/talent/profile"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: `1px solid ${item.done ? "rgba(52, 211, 153, 0.35)" : "rgba(255, 188, 0, 0.35)"}`,
                    textDecoration: "none",
                    transition: "all var(--transition)",
                    minHeight: "44px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                    {item.done ? (
                      <CheckCircle2 size={16} style={{ color: "var(--success)", flexShrink: 0 }} />
                    ) : (
                      <AlertCircle size={16} style={{ color: "var(--warning)", flexShrink: 0 }} />
                    )}
                    <span
                      style={{
                        fontSize: "0.825rem",
                        color: item.done ? "#a3acc2" : "#eceaf5",
                        fontWeight: item.done ? "500" : "700",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.label}
                    </span>
                  </div>

                  {!item.done && (
                    <span style={{ fontSize: "0.75rem", color: "var(--gold)", fontWeight: "700", flexShrink: 0, marginLeft: "6px" }}>
                      Add &rarr;
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Split: Recent Applications (Left) & Recent Notifications (Right) */}
      <div className="talent-split-grid">
        {/* Recent Applications Card */}
        <div
          className="card-surface"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.07)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: "16px",
            padding: "clamp(16px, 3vw, 24px)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#eceaf5", margin: 0 }}>
                Recent Application Updates
              </h2>
              <span style={{ fontSize: "0.8rem", color: "#a3acc2" }}>
                Latest status in your casting pipeline
              </span>
            </div>

            <Link
              href="/talent/applications"
              style={{
                fontSize: "0.825rem",
                color: "var(--gold)",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                textDecoration: "none",
              }}
            >
              <span>View all ({totalAppsCount})</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recentApplications.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center", color: "#7e89a3", fontSize: "0.85rem" }}>
                No applications submitted yet.
              </div>
            ) : (
              recentApplications.map((app) => {
                const opp = getOpportunity(app.opportunityId);
                return (
                  <div
                    key={app.id}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: "700",
                          color: "#eceaf5",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {opp?.title || app.roleApplied}
                      </span>
                      <span style={{ fontSize: "0.785rem", color: "#a3acc2", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        Role: <strong style={{ color: "var(--gold)" }}>{app.roleApplied}</strong> &bull; {new Date(app.appliedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      </span>
                    </div>

                    <StatusBadge status={app.status} size="sm" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Notifications Card */}
        <div
          className="card-surface"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.07)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: "16px",
            padding: "clamp(16px, 3vw, 24px)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#eceaf5", margin: 0 }}>
                Recent Alerts &amp; Announcements
              </h2>
              <span style={{ fontSize: "0.8rem", color: "#a3acc2" }}>
                Audition callbacks and Vismaya notices
              </span>
            </div>

            <Link
              href="/talent/notifications"
              style={{
                fontSize: "0.825rem",
                color: "var(--gold)",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                textDecoration: "none",
              }}
            >
              <span>View all</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recentNotifications.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center", color: "#7e89a3", fontSize: "0.85rem" }}>
                No notifications right now.
              </div>
            ) : (
              recentNotifications.map((n) => (
                <NotificationItem key={n.id} notification={n} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Featured Live Opportunities Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: "700", color: "#eceaf5", margin: 0 }}>
              Live Casting Opportunities
            </h2>
            <span style={{ fontSize: "0.875rem", color: "#a3acc2" }}>
              Verified requirements currently accepting talent submissions
            </span>
          </div>

          <Link
            href="/talent/opportunities"
            className="btn-secondary"
            style={{ fontSize: "0.85rem", padding: "8px 18px", borderRadius: "12px", minHeight: "38px" }}
          >
            <span>View All {publishedOpportunities.length} Live Opportunities</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="talent-cards-grid">
          {featuredOpportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              project={getProject(opp.projectId)}
              onApply={(o) => setSelectedOppForApply(o)}
            />
          ))}
        </div>
      </div>

      {/* Apply Modal */}
      {selectedOppForApply && (
        <OpportunityApplyModal
          isOpen={!!selectedOppForApply}
          onClose={() => setSelectedOppForApply(null)}
          opportunity={selectedOppForApply}
          project={getProject(selectedOppForApply.projectId)}
        />
      )}

      <style jsx>{`
        .profile-checklist-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        @media (max-width: 767.98px) {
          .profile-ring-grid {
            grid-template-columns: 1fr !important;
            justify-items: center;
            text-align: center;
          }
          .profile-checklist-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
