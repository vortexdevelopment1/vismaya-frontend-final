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
        <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0 }}>
          {profile?.avatar ? (
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundImage: `url(${profile.avatar})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: "2px solid #E8E2D4",
                backgroundColor: "#F3EFE6",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(43, 45, 42, 0.06)",
              }}
            />
          ) : (
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "#F3EFE6",
                border: "2px solid #E8E2D4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#8A6B2E",
                fontWeight: 700,
                fontSize: "18px",
                flexShrink: 0,
              }}
            >
              {profile?.personal?.fullName ? profile.personal.fullName.slice(0, 2).toUpperCase() : "TR"}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <h1
                style={{
                  fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                  fontSize: "clamp(24px, 3.2vw, 34px)",
                  fontWeight: 600,
                  color: "#2B2D2A",
                  letterSpacing: "-0.015em",
                  margin: 0,
                }}
              >
                Welcome back, {profile.personal.fullName.split(" ")[0]}!
              </h1>
              <StatusBadge status={profile.status} size="md" />
            </div>
            <p style={{ fontSize: "14px", color: "#5A584F", margin: 0, fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
              Here is your casting pipeline summary, upcoming auditions, and published opportunities.
            </p>
          </div>
        </div>

        <Link
          href="/talent/opportunities"
          style={{
            height: "44px",
            padding: "0 22px",
            fontSize: "14px",
            fontWeight: 600,
            borderRadius: "10px",
            backgroundColor: "#8A6B2E",
            color: "#FFFFFF",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
            transition: "all 0.16s ease",
            boxShadow: "0 2px 8px rgba(138, 107, 46, 0.22)",
            fontFamily: "var(--font-body), 'Inter', sans-serif",
          }}
          className="talent-browse-btn"
        >
          <Megaphone size={16} />
          <span>Browse Opportunities</span>
        </Link>
      </div>

      {/* Top 4 Stat Cards */}
      <div
        className="talent-stat-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "24px",
          alignItems: "stretch",
        }}
      >
        <StatCard
          title="Applications"
          value={totalAppsCount}
          change={totalAppsCount > 0 ? "Active in review" : "None"}
          isPositive={true}
          description="Submitted candidate profiles across casting calls"
          iconName="FileText"
        />

        <StatCard
          title="Shortlisted"
          value={shortlistedCount}
          change={shortlistedCount > 0 ? "Under consideration" : "None"}
          isPositive={true}
          description="Shortlisted by production studios and casting directors"
          iconName="UserCheck"
        />

        <StatCard
          title="Selected"
          value={selectedCount}
          change={selectedCount > 0 ? "Roles confirmed" : "None"}
          isPositive={true}
          description="Confirmed character selections and agreements"
          iconName="Trophy"
        />

        <StatCard
          title="Auditions Pending"
          value={pendingAuditionsCount}
          change={pendingAuditionsCount > 0 ? "Self-tape required" : "All clear"}
          isPositive={pendingAuditionsCount > 0}
          description="Audition invitations &amp; video self-tape requests"
          iconName="Video"
        />
      </div>

      {/* Profile Completion Card: "Artist Profile Strength" */}
      <div
        className="card-surface"
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E2D4",
          borderRadius: "18px",
          padding: "clamp(20px, 3vw, 28px)",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "28px",
            alignItems: "center",
          }}
          className="profile-ring-grid"
        >
          {/* Circular SVG Ring */}
          <div
            style={{
              position: "relative",
              width: "124px",
              height: "124px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="124" height="124" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
              <circle
                cx="60"
                cy="60"
                r={ringRadius}
                fill="none"
                stroke="#E8E2D4"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r={ringRadius}
                fill="none"
                stroke="#8A6B2E"
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
                  fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                  fontSize: "1.75rem",
                  fontWeight: 600,
                  color: "#2B2D2A",
                  lineHeight: 1,
                }}
              >
                {profileCompletionScore}%
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#8A6B2E",
                  textTransform: "uppercase",
                  marginTop: "3px",
                  letterSpacing: "0.10em",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
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
                  <Sparkles size={18} style={{ color: "#8A6B2E", flexShrink: 0 }} />
                  <h2 style={{ fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif", fontSize: "22px", fontWeight: 600, color: "#2B2D2A", margin: 0 }}>
                    Artist Profile Strength
                  </h2>
                </div>
                <span style={{ fontSize: "14px", color: "#5A584F", marginTop: "4px", display: "block", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
                  Keep your portfolio clips and looks up to date to increase shortlist rankings with casting teams.
                </span>
              </div>

              <Link
                href="/talent/profile"
                style={{
                  height: "40px",
                  padding: "0 18px",
                  borderRadius: "10px",
                  border: "1px solid #8A6B2E",
                  backgroundColor: "#FFFFFF",
                  color: "#8A6B2E",
                  fontSize: "13px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  textDecoration: "none",
                  transition: "all 0.16s ease",
                  fontFamily: "var(--font-body), 'Inter', sans-serif",
                }}
                className="talent-edit-profile-btn"
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
                    padding: "12px 16px",
                    borderRadius: "10px",
                    backgroundColor: "#F3EFE6",
                    border: "1px solid #E8E2D4",
                    textDecoration: "none",
                    transition: "all 0.16s ease",
                    minHeight: "44px",
                    fontFamily: "var(--font-body), 'Inter', sans-serif",
                  }}
                  className="profile-checklist-item"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                    {item.done ? (
                      <CheckCircle2 size={16} style={{ color: "#8A6B2E", flexShrink: 0 }} />
                    ) : (
                      <AlertCircle size={16} style={{ color: "#5A584F", flexShrink: 0 }} />
                    )}
                    <span
                      style={{
                        fontSize: "13.5px",
                        color: "#2B2D2A",
                        fontWeight: item.done ? "600" : "500",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.label}
                    </span>
                  </div>

                  {!item.done && (
                    <span style={{ fontSize: "12px", color: "#8A6B2E", fontWeight: 700, flexShrink: 0, marginLeft: "6px" }}>
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
      <div className="talent-split-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: "24px" }}>
        {/* Recent Applications Card */}
        <div
          className="card-surface"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            borderRadius: "18px",
            padding: "clamp(20px, 3vw, 26px)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif", fontSize: "20px", fontWeight: 600, color: "#2B2D2A", margin: 0 }}>
                Recent Application Updates
              </h2>
              <span style={{ fontSize: "13px", color: "#5A584F", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
                Latest status in your casting pipeline
              </span>
            </div>

            <Link
              href="/talent/applications"
              style={{
                fontSize: "13px",
                color: "#8A6B2E",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                textDecoration: "none",
                fontFamily: "var(--font-body), 'Inter', sans-serif",
              }}
            >
              <span>View all ({totalAppsCount})</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recentApplications.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: "#5A584F", fontSize: "14px" }}>
                No applications submitted yet.
              </div>
            ) : (
              recentApplications.map((app) => {
                const opp = getOpportunity(app.opportunityId);
                return (
                  <div
                    key={app.id}
                    style={{
                      backgroundColor: "#F3EFE6",
                      border: "1px solid #E8E2D4",
                      borderRadius: "12px",
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#2B2D2A",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontFamily: "var(--font-body), 'Inter', sans-serif",
                        }}
                      >
                        {opp?.title || app.roleApplied}
                      </span>
                      <span style={{ fontSize: "12px", color: "#5A584F", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
                        Role: <strong style={{ color: "#6E5420" }}>{app.roleApplied}</strong> &bull; {new Date(app.appliedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
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
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            borderRadius: "18px",
            padding: "clamp(20px, 3vw, 26px)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif", fontSize: "20px", fontWeight: 600, color: "#2B2D2A", margin: 0 }}>
                Recent Alerts &amp; Announcements
              </h2>
              <span style={{ fontSize: "13px", color: "#5A584F", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
                Audition callbacks and Vismaya notices
              </span>
            </div>

            <Link
              href="/talent/notifications"
              style={{
                fontSize: "13px",
                color: "#8A6B2E",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                textDecoration: "none",
                fontFamily: "var(--font-body), 'Inter', sans-serif",
              }}
            >
              <span>View all</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recentNotifications.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: "#5A584F", fontSize: "14px" }}>
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
            <h2 style={{ fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif", fontSize: "24px", fontWeight: 600, color: "#2B2D2A", margin: 0 }}>
              Live Casting Opportunities
            </h2>
            <span style={{ fontSize: "14px", color: "#5A584F", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
              Verified requirements currently accepting talent submissions
            </span>
          </div>

          <Link
            href="/talent/opportunities"
            style={{
              height: "40px",
              padding: "0 18px",
              borderRadius: "10px",
              border: "1px solid #8A6B2E",
              backgroundColor: "#FFFFFF",
              color: "#8A6B2E",
              fontSize: "13px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
              transition: "all 0.16s ease",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
            }}
            className="talent-view-all-opps-btn"
          >
            <span>View All {publishedOpportunities.length} Live Opportunities</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div
          className="talent-cards-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
            gap: "24px",
          }}
        >
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
          gap: 12px;
        }

        .talent-browse-btn:hover {
          background-color: #6E5420 !important;
        }
        .talent-edit-profile-btn:hover,
        .talent-view-all-opps-btn:hover {
          background-color: #F3EFE6 !important;
        }
        .profile-checklist-item:hover {
          background-color: #FAF9F7 !important;
          border-color: #8A6B2E !important;
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
        @media (max-width: 640px) {
          .talent-split-grid,
          .talent-cards-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
