"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  UserCheck,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  Clock,
  Video,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Eye,
  Trophy,
  ArrowRight,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/shared/StatusBadge";
import NotificationItem from "@/components/talent/NotificationItem";
import Modal from "@/components/shared/Modal";
import PaymentCard from "@/components/payment/PaymentCard";
import { paymentService } from "@/lib/api/services/paymentService";
import { PRICING_CONFIG } from "@/lib/config/pricing";
import { useWorkflow } from "@/lib/shared/workflowStore";
import { useTalent } from "@/lib/talent/TalentContext";
import { isRealMode } from "@/lib/api/config";
import { talentService } from "@/lib/api/services/talentService";
import SuccessStorySection from "@/components/talent/SuccessStorySection";
import { useAuth } from "@/context/AuthContext";

export default function TalentDashboardPage() {
  const { user } = useAuth();
  const {
    applications,
    auditions,
    getOpportunity,
    getNotificationsForRole,
    isHydrated,
  } = useWorkflow();

  const {
    profile,
    applications: talentCtxApplications = [],
    notifications: talentCtxNotifications = [],
    profileCompletionScore,
    profileChecklist,
  } = useTalent();

  const [realApplications, setRealApplications] = useState([]);
  const [realAuditions, setRealAuditions] = useState([]);

  useEffect(() => {
    if (!isRealMode("talent") && !isRealMode("applications")) return;
    let mounted = true;
    Promise.allSettled([
      talentService.getMyApplications(),
      talentService.getMyAuditions(),
    ]).then(([appsRes, audsRes]) => {
      if (mounted) {
        if (appsRes.status === "fulfilled" && Array.isArray(appsRes.value?.data)) {
          setRealApplications(appsRes.value.data);
        }
        if (audsRes.status === "fulfilled" && Array.isArray(audsRes.value?.data)) {
          setRealAuditions(audsRes.value.data);
        }
      }
    }).catch((err) => console.warn(err));
    return () => { mounted = false; };
  }, []);

  const [isPaid, setIsPaid] = useState(() => {
    if (isRealMode("payments") && user?.isPaid) return true;
    return paymentService.isTalentPaid();
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const isUnder60 = (profileCompletionScore || 0) < PRICING_CONFIG.MIN_PROFILE_COMPLETION;

  const currentTalentId = user?.id || user?._id || profile?.id || profile?._id || profile?.userId || (!isRealMode("talent") ? "tal-904" : "");

  // Filter entities for current talent
  const myApplications = useMemo(() => {
    if (isRealMode("applications") || isRealMode("talent")) {
      return realApplications;
    }
    return applications.filter((a) => a.talentId === currentTalentId);
  }, [applications, realApplications, currentTalentId]);

  const myAuditions = useMemo(() => {
    if (isRealMode("talent")) {
      return realAuditions;
    }
    return auditions.filter((aud) => aud.talentId === currentTalentId);
  }, [auditions, realAuditions, currentTalentId]);

  const talentNotifications = useMemo(() => {
    if (isRealMode("notifications") || isRealMode("talent")) {
      return Array.isArray(talentCtxNotifications) ? talentCtxNotifications : [];
    }
    return getNotificationsForRole("talent", currentTalentId);
  }, [talentCtxNotifications, getNotificationsForRole, currentTalentId]);

  // Derived dashboard stats
  const totalAppsCount = myApplications.length;
  const shortlistedCount = myApplications.filter((a) => (a.status || "").toLowerCase() === "shortlisted").length;
  const selectedCount = myApplications.filter((a) => (a.status || "").toLowerCase() === "selected").length;
  const pendingAuditionsCount = myAuditions.filter(
    (aud) => {
      const s = (aud.status || "").toLowerCase();
      return s === "relayed to talent" || s === "relayed" || s === "requested";
    }
  ).length;

  const recentApplications = myApplications.slice(0, 4);
  const totalNotifsCount = talentNotifications.length;
  const recentNotifications = talentNotifications.slice(0, 3);

  // Profile Ring Math
  const ringRadius = 46;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = circumference - (profileCompletionScore / 100) * circumference;

  return (
    <div className="talent-dashboard-root" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* 0. Gate Banners: Payment or Profile Completion */}
      {!isPaid ? (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            borderLeft: "4px solid #8A6B2E",
            borderRadius: "10px",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            boxShadow: "0 4px 12px rgba(43, 45, 42, 0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "#F3EFE6",
                color: "#8A6B2E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: "14.5px", fontWeight: "600", color: "#2B2D2A" }}>
                Complete your one-time registration payment (₹999)
              </div>
              <div style={{ fontSize: "13px", color: "#5A584F", marginTop: "2px" }}>
                Make your comp-card searchable and activate direct application privileges for verified roles.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPaymentModal(true)}
            className="btn-primary"
            style={{
              padding: "0 18px",
              height: "40px",
              fontSize: "13px",
              fontWeight: "600",
              borderRadius: "6px",
              whiteSpace: "nowrap",
            }}
          >
            <span>Pay ₹999 Now</span>
            <ArrowRight size={14} />
          </button>
        </div>
      ) : isUnder60 ? (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            borderLeft: "4px solid #C9A55C",
            borderRadius: "10px",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            boxShadow: "0 4px 12px rgba(43, 45, 42, 0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "#F3EFE6",
                color: "#8A6B2E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AlertCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: "14.5px", fontWeight: "600", color: "#2B2D2A" }}>
                Profile 60% complete karo (Currently at {profileCompletionScore || 0}%)
              </div>
              <div style={{ fontSize: "13px", color: "#5A584F", marginTop: "2px" }}>
                A minimum of 60% profile completion is required to submit applications to verified casting opportunities.
              </div>
            </div>
          </div>
          <Link
            href="/talent/profile"
            className="btn-primary"
            style={{
              padding: "0 18px",
              height: "40px",
              fontSize: "13px",
              fontWeight: "600",
              borderRadius: "6px",
              textDecoration: "none",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>Complete Profile</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : null}

      {/* Payment Modal for unpaid talent */}
      {showPaymentModal && (
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title="Talent Registration Payment"
          subtitle="One-time fee to activate application submission"
          maxWidth="520px"
        >
          <PaymentCard
            type="talent_registration"
            userName={profile?.personal?.fullName || "Talent Member"}
            userEmail={profile?.personal?.email || "user@vismaya.io"}
            onSuccess={() => {
              setIsPaid(true);
              setShowPaymentModal(false);
            }}
            onCancel={() => setShowPaymentModal(false)}
            isModal={true}
          />
        </Modal>
      )}

      {/* Welcome & Overview Header */}
      <div className="talent-welcome-section">
        <div className="talent-welcome-left">
          <div className="talent-avatar-wrap">
            {profile?.avatar ? (
              <div
                className="talent-avatar-img"
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
                className="talent-avatar-initials"
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
          </div>

          <div className="talent-welcome-user-info">
            <div className="talent-welcome-title-row">
              {(() => {
                const welcomeName = profile?.personal?.fullName?.trim() || profile?.name?.trim() || profile?.stageName?.trim() || user?.name?.trim() || "Artist";
                const firstName = welcomeName.split(" ")[0];
                return (
                  <h1 className="talent-welcome-title">
                    Welcome back, {firstName}!
                  </h1>
                );
              })()}
              <div className="talent-welcome-badge">
                <StatusBadge status={profile?.status || "pending"} size="md" />
              </div>
            </div>
            <p className="talent-welcome-desc">
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
        className="card-surface talent-profile-card"
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
            className="profile-ring-wrap"
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
            <svg className="profile-ring-svg" width="124" height="124" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
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
              className="profile-ring-center"
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
                className="profile-score-num"
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
                className="profile-score-label"
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
          <div className="profile-details-col" style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
            <div className="profile-details-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ minWidth: 0, flex: "1 1 240px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={18} style={{ color: "#8A6B2E", flexShrink: 0 }} />
                  <h2 className="profile-section-heading" style={{ fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif", fontSize: "22px", fontWeight: 600, color: "#2B2D2A", margin: 0 }}>
                    Artist Profile Strength
                  </h2>
                </div>
                <span className="profile-section-desc" style={{ fontSize: "14px", color: "#5A584F", marginTop: "4px", display: "block", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
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
                      className="profile-item-label"
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

      {/* Success Story Submission & Review Status Card */}
      <SuccessStorySection profile={profile} user={user} />

      {/* Main Split: Recent Applications (Left) & Recent Notifications (Right) */}
      <div className="talent-split-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: "24px", alignItems: "start" }}>
        {/* Recent Applications Card */}
        <div
          className="card-surface talent-dash-card"
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
          <div className="talent-dash-card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h2 className="talent-dash-card-title" style={{ fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif", fontSize: "22px", fontWeight: 600, color: "#2B2D2A", margin: 0 }}>
                Recent Application Updates
              </h2>
              <span className="talent-dash-card-subtitle" style={{ fontSize: "13px", color: "#6B6254", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
                Latest status in your casting pipeline
              </span>
            </div>

            <Link
              href="/talent/applications"
              className="talent-dash-view-link"
              style={{
                fontSize: "13px",
                color: "#8A6B2E",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                textDecoration: "none",
                fontFamily: "var(--font-body), 'Inter', sans-serif",
                minHeight: "44px",
              }}
            >
              <span>View all ({totalAppsCount})</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="talent-app-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recentApplications.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: "#6B6254", fontSize: "14px" }}>
                No applications submitted yet.
              </div>
            ) : (
              recentApplications.map((app) => {
                const opp = getOpportunity(app.opportunityId);
                const s = (app.status || "").toLowerCase().trim();
                const isShortlisted = s === "shortlisted" || s === "selected";
                const isCancelled = s === "cancelled" || s === "opportunity cancelled" || s === "opportunity_cancelled" || s === "not selected" || s === "not-selected" || s === "withdrawn" || s === "rejected";
                const dotColor = isShortlisted ? "#2F6B45" : isCancelled ? "#A3321F" : "#8A6B2E";

                return (
                  <Link
                    key={app.id || app._id}
                    href={`/talent/applications?id=${app.id || app._id}`}
                    className="recent-app-item"
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E8E1D2",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      textDecoration: "none",
                      cursor: "pointer",
                      transition: "background-color 0.16s ease, border-color 0.16s ease",
                    }}
                  >
                    <div className="recent-app-left" style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                      <span
                        className="recent-app-status-dot"
                        style={{
                          width: "10px",
                          height: "10px",
                          minWidth: "10px",
                          borderRadius: "50%",
                          backgroundColor: dotColor,
                          flexShrink: 0,
                        }}
                      />
                      <div className="recent-app-info" style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0, flex: 1 }}>
                        <span
                          className="recent-app-title"
                          style={{
                            fontSize: "15px",
                            fontWeight: 600,
                            color: "#2B2D2A",
                            overflowWrap: "anywhere",
                            fontFamily: "var(--font-body), 'Inter', sans-serif",
                          }}
                        >
                          {opp?.title || app.opportunityTitle || "Opportunity"}
                        </span>
                        <span className="recent-app-meta" style={{ fontSize: "13px", color: "#6B6254", overflowWrap: "anywhere", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
                          Role: <strong style={{ fontWeight: 600, color: "#2B2D2A" }}>{app.roleApplied || app.roleName || app.role || opp?.role || "Lead Role"}</strong> &bull; {new Date(app.appliedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>

                    <div className="recent-app-right" style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                      <div className="recent-app-badge" style={{ flexShrink: 0 }}>
                        <StatusBadge status={app.status} size="md" />
                      </div>
                      <ChevronRight size={16} className="recent-app-chevron" style={{ color: "#6B6254", flexShrink: 0 }} />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Notifications Card */}
        <div
          className="card-surface talent-dash-card"
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
          <div className="talent-dash-card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h2 className="talent-dash-card-title" style={{ fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif", fontSize: "22px", fontWeight: 600, color: "#2B2D2A", margin: 0 }}>
                Recent Alerts &amp; Announcements
              </h2>
              <span className="talent-dash-card-subtitle" style={{ fontSize: "13px", color: "#6B6254", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
                Audition callbacks and Vismaya notices
              </span>
            </div>

            <Link
              href="/talent/notifications"
              className="talent-dash-view-link"
              style={{
                fontSize: "13px",
                color: "#8A6B2E",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                textDecoration: "none",
                fontFamily: "var(--font-body), 'Inter', sans-serif",
                minHeight: "44px",
              }}
            >
              <span>View all ({totalNotifsCount})</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="talent-dash-notifs-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recentNotifications.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: "#6B6254", fontSize: "14px" }}>
                No notifications right now.
              </div>
            ) : (
              recentNotifications.map((n) => {
                const isUnread = !n.read && !n.isRead;
                const dotColor = isUnread ? "#8A6B2E" : "#D9D1BF";
                const targetLink = n.link || n.actionHref || "/talent/notifications";
                const timeDisplay = n.createdAt
                  ? new Date(n.createdAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    })
                  : n.time || "Recently";

                return (
                  <Link
                    key={n.id || n._id}
                    href={targetLink}
                    className="recent-notif-row"
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E8E1D2",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      textDecoration: "none",
                      cursor: "pointer",
                      transition: "background-color 0.16s ease, border-color 0.16s ease",
                    }}
                  >
                    <div className="recent-notif-left" style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                      <span
                        className="recent-notif-status-dot"
                        style={{
                          width: "10px",
                          height: "10px",
                          minWidth: "10px",
                          borderRadius: "50%",
                          backgroundColor: dotColor,
                          flexShrink: 0,
                        }}
                      />
                      <div className="recent-notif-info" style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0, flex: 1 }}>
                        <span
                          className="recent-notif-title"
                          style={{
                            fontSize: "15px",
                            fontWeight: isUnread ? 700 : 600,
                            color: "#2B2D2A",
                            overflowWrap: "anywhere",
                            fontFamily: "var(--font-body), 'Inter', sans-serif",
                          }}
                        >
                          {n.title || n.message || "Notification"}
                        </span>
                        <span className="recent-notif-meta" style={{ fontSize: "13px", color: "#6B6254", overflowWrap: "anywhere", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
                          {n.message && n.title ? `${n.message.slice(0, 50)}${n.message.length > 50 ? "..." : ""} • ` : ""}{timeDisplay}
                        </span>
                      </div>
                    </div>

                    <div className="recent-notif-right" style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                      <ChevronRight size={16} className="recent-notif-chevron" style={{ color: "#6B6254", flexShrink: 0 }} />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>



      <style jsx>{`
        .talent-welcome-section {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .talent-welcome-left {
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 0;
        }
        .talent-welcome-user-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .talent-welcome-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .talent-welcome-title {
          font-family: var(--font-heading), 'Playfair Display', Georgia, serif;
          font-size: clamp(24px, 3.2vw, 34px);
          fontWeight: 600;
          color: #2B2D2A;
          letter-spacing: -0.015em;
          margin: 0;
        }
        .talent-welcome-desc {
          font-size: 14px;
          color: #5A584F;
          margin: 0;
          font-family: var(--font-body), 'Inter', sans-serif;
        }

        .profile-checklist-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .talent-browse-btn:hover {
          background-color: #6E5420 !important;
        }
        .talent-edit-profile-btn:hover {
          background-color: #F3EFE6 !important;
        }
        .profile-checklist-item:hover {
          background-color: #FAF9F7 !important;
          border-color: #8A6B2E !important;
        }

        .talent-split-grid {
          align-items: start !important;
        }
        :global(.recent-app-item:hover),
        :global(.recent-notif-row:hover) {
          background-color: #FBF8F0 !important;
          border-color: #D9D1BF !important;
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
          .talent-dashboard-root {
            gap: 16px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }

          /* Welcome block redesign */
          .talent-welcome-section {
            display: flex !important;
            flex-direction: column !important;
            gap: 10px !important;
            width: 100% !important;
          }
          .talent-welcome-left {
            display: grid !important;
            grid-template-columns: 48px 1fr !important;
            grid-template-areas:
              "avatar info"
              "desc   desc" !important;
            row-gap: 8px !important;
            column-gap: 12px !important;
            align-items: center !important;
            width: 100% !important;
          }
          .talent-avatar-wrap {
            grid-area: avatar !important;
            width: 48px !important;
            height: 48px !important;
          }
          .talent-avatar-img,
          .talent-avatar-initials {
            width: 48px !important;
            height: 48px !important;
            font-size: 16px !important;
          }
          .talent-welcome-user-info {
            grid-area: info !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 3px !important;
            align-items: flex-start !important;
            text-align: left !important;
            min-width: 0 !important;
          }
          .talent-welcome-title-row {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 3px !important;
            width: 100% !important;
          }
          .talent-welcome-title {
            font-size: 21px !important;
            line-height: 1.25 !important;
            text-align: left !important;
            margin: 0 !important;
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
          }
          .talent-welcome-badge :global(span) {
            font-size: 10.5px !important;
            padding: 2px 7px !important;
          }
          .talent-welcome-desc {
            grid-area: desc !important;
            font-size: 13px !important;
            line-height: 1.5 !important;
            text-align: left !important;
            margin: 0 !important;
            color: #5A584F !important;
          }
          .talent-browse-btn {
            width: 100% !important;
            height: 42px !important;
            font-size: 13px !important;
            justify-content: center !important;
            box-sizing: border-box !important;
            margin-top: 2px !important;
          }

          /* Stat cards 2x2 grid */
          .talent-stat-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
            width: 100% !important;
          }

          /* Profile completeness card */
          .talent-profile-card {
            padding: 14px !important;
            gap: 12px !important;
            border-radius: 14px !important;
          }
          .profile-ring-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            justify-items: center !important;
            text-align: center !important;
          }
          .profile-ring-wrap {
            width: 90px !important;
            height: 90px !important;
          }
          .profile-ring-svg {
            width: 90px !important;
            height: 90px !important;
          }
          .profile-score-num {
            font-size: 1.35rem !important;
          }
          .profile-score-label {
            font-size: 9px !important;
          }
          .profile-details-col {
            width: 100% !important;
            gap: 12px !important;
          }
          .profile-details-header {
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
            text-align: left !important;
          }
          .profile-section-heading {
            font-size: 18px !important;
          }
          .profile-section-desc {
            font-size: 12.5px !important;
            line-height: 1.45 !important;
            margin-top: 4px !important;
          }
          .talent-edit-profile-btn {
            width: 100% !important;
            height: 40px !important;
            margin-top: 2px !important;
            font-size: 13px !important;
            justify-content: center !important;
            box-sizing: border-box !important;
          }
          .profile-checklist-grid {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
            width: 100% !important;
            min-width: 0 !important;
          }
          .profile-checklist-item {
            padding: 10px 12px !important;
            min-height: 42px !important;
            border-radius: 8px !important;
            min-width: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .profile-item-label {
            font-size: 12.5px !important;
            min-width: 0 !important;
            white-space: normal !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
            line-height: 1.35 !important;
          }

          /* Split Grid (Recent Applications & Alerts) */
          .talent-split-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
            width: 100% !important;
          }
          .talent-dash-card {
            padding: 14px !important;
            gap: 12px !important;
            border-radius: 14px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .talent-dash-card-header {
            gap: 6px !important;
          }
          .talent-dash-card-title {
            font-size: 18.5px !important;
          }
          .talent-dash-card-subtitle {
            font-size: 12px !important;
          }
          .talent-dash-view-link {
            font-size: 12px !important;
          }
          .talent-app-list,
          .talent-dash-notifs-list {
            gap: 8px !important;
          }
          .recent-app-item,
          .recent-notif-row {
            padding: 12px 14px !important;
            gap: 10px !important;
            border-radius: 12px !important;
          }
          .recent-app-left,
          .recent-notif-left {
            gap: 10px !important;
            align-items: flex-start !important;
          }
          .recent-app-status-dot,
          .recent-notif-status-dot {
            margin-top: 5px !important;
          }
          .recent-app-info,
          .recent-notif-info {
            min-width: 0 !important;
            gap: 2px !important;
          }
          .recent-app-title,
          .recent-notif-title {
            font-size: 14px !important;
            line-height: 1.35 !important;
            white-space: normal !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
          }
          .recent-app-meta,
          .recent-notif-meta {
            font-size: 12px !important;
            line-height: 1.35 !important;
            white-space: normal !important;
            overflow-wrap: anywhere !important;
          }
        }

        @media (max-width: 480px) {
          .recent-app-item {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
          }
          .recent-app-left {
            width: 100% !important;
          }
          .recent-app-right {
            width: 100% !important;
            padding-left: 20px !important;
            justify-content: flex-start !important;
          }
          .recent-app-chevron,
          .recent-notif-chevron {
            display: none !important;
          }
        }

        @media (max-width: 400px) {
          .talent-welcome-title {
            font-size: 19px !important;
          }
          .talent-stat-grid {
            gap: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}
