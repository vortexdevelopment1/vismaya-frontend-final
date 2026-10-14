"use client";

import React from "react";
import Link from "next/link";
import {
  FolderKanban,
  Megaphone,
  UserCheck,
  Video,
  PlusCircle,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Building2,
  Users,
  ShieldCheck,
  Eye,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/shared/StatusBadge";
import { useWorkflow } from "@/lib/shared/workflowStore";

export default function OrganizationDashboardPage() {
  const {
    projects,
    opportunities,
    applications,
    auditions,
    isHydrated,
  } = useWorkflow();

  // Active organization scope (default org-1: Zee Films)
  const orgId = "org-1";
  const orgProjects = projects.filter((p) => p.orgId === orgId);
  const orgOpportunities = opportunities.filter((o) => o.orgId === orgId);
  const orgOppIds = orgOpportunities.map((o) => o.id);

  const orgApplications = applications.filter((a) => orgOppIds.includes(a.opportunityId));
  const orgAuditions = auditions.filter((aud) => aud.orgId === orgId || orgOppIds.includes(aud.opportunityId));

  // Derived counts for stat cards
  const activeProjectsCount = orgProjects.filter((p) => p.status === "Active").length;
  const liveOpportunitiesCount = orgOpportunities.filter((o) => o.status === "Published").length;
  const applicantsToReviewCount = orgApplications.filter(
    (a) => a.status === "Applied" || a.status === "Under Review"
  ).length;
  const pendingAuditionsCount = orgAuditions.filter(
    (aud) => aud.status === "Requested" || aud.status === "Relayed to Talent" || aud.status === "Self-tape Received"
  ).length;

  // Action needed list
  const newApplicants = orgApplications.filter((a) => a.status === "Applied").slice(0, 3);
  const readyAuditions = orgAuditions.filter((aud) => aud.status === "Forwarded to Organization" || aud.status === "Self-tape Received").slice(0, 3);
  const changesRequestedOpps = orgOpportunities.filter((o) => o.status === "Changes Requested").slice(0, 2);

  const totalActionCount = newApplicants.length + readyAuditions.length + changesRequestedOpps.length;

  // 9-Stage Casting Pipeline Workflow
  const workflowStages = [
    { num: 1, title: "1. Submit Brief", desc: "Define character specs & roles" },
    { num: 2, title: "2. Vismaya Review", desc: "Compliance & budget verification" },
    { num: 3, title: "3. Published Live", desc: "Open to verified talent network" },
    { num: 4, title: "4. Applications", desc: "Profiles & comp-cards inflow" },
    { num: 5, title: "5. Screening", desc: "Screen candidate submissions" },
    { num: 6, title: "6. Shortlist", desc: "Curate top talent pools" },
    { num: 7, title: "7. Audition", desc: "Self-tapes & callbacks via Vismaya" },
    { num: 8, title: "8. Selection", desc: "Lock final cast members" },
    { num: 9, title: "9. Completion", desc: "Archive & close project" },
  ];

  return (
    <div className="recruiter-dashboard-root" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Page Header */}
      <PageHeader
        title="Organization Overview"
        subtitle="Manage casting projects, post verified opportunities, screen talent submissions, and track audition self-tapes."
        badge="Zee Films • Verified Production House"
        action={
          <div className="recruiter-dash-header-actions" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link
              href="/recruiter/opportunities/new"
              className="btn-primary dash-action-btn"
              style={{ fontSize: "13px", fontWeight: "600", height: "36px", padding: "0 18px", gap: "6px", borderRadius: "10px" }}
            >
              <PlusCircle size={15} />
              <span>Post Opportunity</span>
            </Link>
          </div>
        }
      />

      {/* 4 Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "16px",
          width: "100%",
        }}
        className="dashboard-stats-grid"
      >
        <StatCard
          title="Active Projects"
          value={activeProjectsCount.toString()}
          change="+1 this month"
          isPositive={true}
          description="Ongoing casting productions"
          icon={FolderKanban}
          tint="navy"
        />

        <StatCard
          title="Opportunities Live"
          value={liveOpportunitiesCount.toString()}
          change="Accepting applications"
          isPositive={true}
          description="Verified by Vismaya team"
          icon={Megaphone}
          tint="gold"
        />

        <StatCard
          title="Applicants to Review"
          value={applicantsToReviewCount.toString()}
          change={applicantsToReviewCount > 0 ? "Requires review" : "All cleared"}
          isPositive={applicantsToReviewCount === 0}
          description="In Applied & Under Review status"
          icon={UserCheck}
          tint="gold"
        />

        <StatCard
          title="Auditions Pending"
          value={pendingAuditionsCount.toString()}
          change="In Vismaya relay"
          isPositive={true}
          description="Self-tapes & virtual auditions"
          icon={Video}
          tint="navy"
        />
      </div>

      {/* Main Grid: Action Needed (Left 2fr) + Workflow Flow Card (Right 1fr) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
          gap: "20px",
          alignItems: "start",
          width: "100%",
        }}
        className="dashboard-main-grid"
      >
        {/* Left Card: Action Needed List */}
        <div
          className="card-surface recruiter-dash-section-card"
          style={{
            padding: "22px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            minWidth: 0,
            overflow: "hidden",
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E8E2D4",
          }}
        >
          <div
            className="recruiter-section-header"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #E8E2D4",
              paddingBottom: "12px",
            }}
          >
            <div className="recruiter-section-header-left" style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <div
                className="recruiter-section-icon-box"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "10px",
                  background: "#F3EFE6",
                  color: "#8A6B2E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #E8E2D4",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={18} />
              </div>
              <div className="recruiter-section-title-col" style={{ minWidth: 0 }}>
                <h2
                  className="recruiter-section-title"
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  Action Needed
                </h2>
                <p className="recruiter-section-subtitle" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                  Items requiring your immediate review and decisions
                </p>
              </div>
            </div>

            <span
              className="recruiter-count-pill"
              style={{
                fontSize: "0.725rem",
                fontWeight: 700,
                color: "#8A6B2E",
                backgroundColor: "#F3EFE6",
                padding: "3px 10px",
                borderRadius: "8px",
                border: "1px solid #E8E2D4",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {totalActionCount} items
            </span>
          </div>

          <div className="action-needed-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {totalActionCount === 0 ? (
              <div
                style={{
                  padding: "24px 16px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                }}
              >
                No immediate actions pending. All queues are up to date!
              </div>
            ) : (
              <>
                {/* Changes Requested by Vismaya */}
                {changesRequestedOpps.map((opp) => (
                  <Link
                    key={`chg-${opp.id}`}
                    href="/recruiter/opportunities"
                    className="action-needed-row changes-requested-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      backgroundColor: "#F3EFE6",
                      border: "1px solid rgba(201, 165, 92, 0.4)",
                      textDecoration: "none",
                      transition: "all 0.18s ease",
                    }}
                  >
                    <div className="action-row-content" style={{ display: "flex", alignItems: "flex-start", gap: "10px", minWidth: 0 }}>
                      <AlertTriangle size={16} className="action-row-icon" style={{ color: "#8A6B2E", marginTop: "2px", flexShrink: 0 }} />
                      <div className="action-row-text" style={{ minWidth: 0 }}>
                        <div className="action-row-title" style={{ fontSize: "0.825rem", fontWeight: 700, color: "#8A6B2E" }}>
                          Changes Requested: {opp.title}
                        </div>
                        <div className="action-row-meta" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {opp.adminNote || "Please update opportunity details"}
                        </div>
                      </div>
                    </div>
                    <span className="action-row-btn" style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8A6B2E" }}>Edit</span>
                  </Link>
                ))}

                {/* New Self-tapes Received / Forwarded */}
                {readyAuditions.map((aud) => (
                  <Link
                    key={`aud-${aud.id}`}
                    href="/recruiter/shortlist-auditions"
                    className="action-needed-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E8E2D4",
                      textDecoration: "none",
                      transition: "all 0.18s ease",
                    }}
                  >
                    <div className="action-row-content" style={{ display: "flex", alignItems: "flex-start", gap: "10px", minWidth: 0 }}>
                      <Video size={16} className="action-row-icon" style={{ color: "#8A6B2E", marginTop: "2px", flexShrink: 0 }} />
                      <div className="action-row-text" style={{ minWidth: 0 }}>
                        <div className="action-row-title" style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--text-primary)" }}>
                          Audition Video: {aud.talentName}
                        </div>
                        <div className="action-row-meta" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                          Status: {aud.status} • Ready for look-test review
                        </div>
                      </div>
                    </div>
                    <span className="action-row-btn" style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8A6B2E" }}>Review</span>
                  </Link>
                ))}

                {/* New Applicants awaiting review */}
                {newApplicants.map((app) => (
                  <Link
                    key={`app-${app.id}`}
                    href={`/recruiter/applications/${app.id}?from=dashboard&opp=${app.opportunityId}`}
                    className="action-needed-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E8E2D4",
                      textDecoration: "none",
                      transition: "all 0.18s ease",
                    }}
                  >
                    <div className="action-row-content" style={{ display: "flex", alignItems: "flex-start", gap: "10px", minWidth: 0 }}>
                      <UserCheck size={16} className="action-row-icon" style={{ color: "#8A6B2E", marginTop: "2px", flexShrink: 0 }} />
                      <div className="action-row-text" style={{ minWidth: 0 }}>
                        <div className="action-row-title" style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--text-primary)" }}>
                          New Applicant: {app.talentName}
                        </div>
                        <div className="action-row-meta" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                          Role: {app.roleApplied} • Applied {new Date(app.appliedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <span className="action-row-btn" style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8A6B2E" }}>Screen</span>
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Right Card: Full End-to-End Casting Flow */}
        <div
          className="card-surface recruiter-dash-section-card"
          style={{
            padding: "22px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            minWidth: 0,
            overflow: "hidden",
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E8E2D4",
          }}
        >
          <div
            className="recruiter-section-header"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #E8E2D4",
              paddingBottom: "12px",
            }}
          >
            <div className="recruiter-section-header-left" style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <div
                className="recruiter-section-icon-box"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "10px",
                  background: "#F3EFE6",
                  color: "#8A6B2E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #E8E2D4",
                  flexShrink: 0,
                }}
              >
                <Sparkles size={18} />
              </div>
              <div className="recruiter-section-title-col" style={{ minWidth: 0 }}>
                <h2
                  className="recruiter-section-title"
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  Casting Workflow
                </h2>
                <p className="recruiter-section-subtitle" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                  Verified lifecycle connecting Organizations, Vismaya Desk, and Artists
                </p>
              </div>
            </div>

            <span
              className="recruiter-count-pill"
              style={{
                fontSize: "0.725rem",
                fontWeight: 700,
                color: "#8A6B2E",
                backgroundColor: "#F3EFE6",
                padding: "3px 10px",
                borderRadius: "8px",
                border: "1px solid #E8E2D4",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              9 Stages
            </span>
          </div>

          <div
            className="workflow-stages-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(125px, 100%), 1fr))",
              gap: "8px",
            }}
          >
            {workflowStages.map((stage) => (
              <div
                key={stage.num}
                className={`workflow-stage-card stage-${stage.num}`}
                style={{
                  padding: "10px 12px",
                  borderRadius: "12px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8E2D4",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div className="workflow-stage-title" style={{ fontSize: "0.8rem", fontWeight: 700, color: "#8A6B2E" }}>
                  {stage.title}
                </div>
                <div className="workflow-stage-desc" style={{ fontSize: "0.7rem", color: "var(--text-secondary)", lineHeight: 1.3 }}>
                  {stage.desc}
                </div>
              </div>
            ))}
          </div>

          <div
            className="workflow-callout"
            style={{
              padding: "12px 14px",
              borderRadius: "12px",
              backgroundColor: "#F3EFE6",
              border: "1px solid #E8E2D4",
              fontSize: "0.785rem",
              color: "#5A584F",
              lineHeight: 1.4,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <ShieldCheck size={16} style={{ flexShrink: 0, color: "#8A6B2E" }} />
            <span>
              All talent contact, video self-tapes, and physical callbacks are verified and mediated by the Vismaya team.
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1023.98px) {
          .dashboard-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .dashboard-main-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }

        @media (max-width: 640px) {
          .recruiter-dashboard-root {
            gap: 14px !important;
          }

          /* Header Block */
          .recruiter-dashboard-root :global(.page-header-container) {
            margin-bottom: 0 !important;
            gap: 8px !important;
          }
          .recruiter-dashboard-root :global(.page-header-row) {
            gap: 10px !important;
          }
          .recruiter-dashboard-root :global(.page-header-title-row) {
            gap: 8px !important;
            align-items: flex-start !important;
          }
          .recruiter-dashboard-root :global(.page-header-title) {
            font-size: 22px !important;
            line-height: 1.25 !important;
          }
          .recruiter-dashboard-root :global(.page-header-badge) {
            font-size: 10px !important;
            white-space: normal !important;
            line-height: 1.3 !important;
            padding: 3px 8px !important;
            display: inline-block !important;
            max-width: 100% !important;
          }
          .recruiter-dashboard-root :global(.page-header-subtitle) {
            font-size: 13px !important;
            line-height: 1.5 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 3 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          .recruiter-dashboard-root :global(.page-header-actions) {
            width: 100% !important;
            margin-top: 4px !important;
          }

          /* Header Action Buttons */
          .recruiter-dash-header-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 8px !important;
            width: 100% !important;
          }
          .recruiter-dash-header-actions :global(.dash-action-btn) {
            height: 40px !important;
            min-height: 40px !important;
            font-size: 12.5px !important;
            font-weight: 600 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 6px !important;
            border-radius: 8px !important;
            width: 100% !important;
            box-sizing: border-box !important;
            white-space: nowrap !important;
            padding: 0 10px !important;
          }

          /* Stat Cards (2x2 grid) */
          .dashboard-stats-grid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
            width: 100% !important;
          }

          /* Section Cards */
          .recruiter-dash-section-card {
            padding: 14px !important;
            border-radius: 14px !important;
            gap: 12px !important;
          }
          .recruiter-section-header {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
            border-bottom: 1px solid #E8E2D4 !important;
            padding-bottom: 10px !important;
          }
          .recruiter-section-header-left {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            min-width: 0 !important;
            flex: 1 1 auto !important;
          }
          .recruiter-section-icon-box {
            width: 32px !important;
            height: 32px !important;
            min-width: 32px !important;
            min-height: 32px !important;
            border-radius: 8px !important;
            background-color: #F3EFE6 !important;
            border: 1px solid #E8E2D4 !important;
            color: #8A6B2E !important;
          }
          .recruiter-section-icon-box :global(svg) {
            width: 16px !important;
            height: 16px !important;
          }
          .recruiter-section-title-col {
            min-width: 0 !important;
          }
          .recruiter-section-title {
            font-size: 17px !important;
            font-family: var(--font-heading), 'Playfair Display', Georgia, serif !important;
            color: #2B2D2A !important;
            margin: 0 !important;
            line-height: 1.25 !important;
          }
          .recruiter-section-subtitle {
            font-size: 12px !important;
            color: #5A584F !important;
            margin: 2px 0 0 0 !important;
            line-height: 1.35 !important;
          }
          .recruiter-count-pill {
            font-size: 10.5px !important;
            font-weight: 700 !important;
            white-space: nowrap !important;
            flex: none !important;
            padding: 3px 8px !important;
            background-color: #F3EFE6 !important;
            border: 1px solid #E8E2D4 !important;
            color: #8A6B2E !important;
            border-radius: 8px !important;
          }

          /* Main Grid & Gap */
          .dashboard-main-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 14px !important;
            width: 100% !important;
          }

          /* Action Needed Rows */
          .action-needed-list {
            gap: 8px !important;
          }
          .action-needed-row {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            padding: 10px 12px !important;
            border-radius: 10px !important;
            border: 1px solid #E8E2D4 !important;
            background-color: #FFFFFF !important;
            gap: 6px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .action-needed-row.changes-requested-row {
            background-color: #F3EFE6 !important;
            border: 1px solid rgba(201, 165, 92, 0.5) !important;
          }
          .action-row-content {
            display: flex !important;
            align-items: flex-start !important;
            gap: 8px !important;
            width: 100% !important;
            min-width: 0 !important;
          }
          .action-row-icon {
            width: 18px !important;
            height: 18px !important;
            min-width: 18px !important;
            margin-top: 2px !important;
            flex-shrink: 0 !important;
          }
          .action-row-text {
            min-width: 0 !important;
            flex: 1 !important;
          }
          .action-row-title {
            font-size: 13.5px !important;
            font-weight: 700 !important;
            color: #2B2D2A !important;
            line-height: 1.35 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          .changes-requested-row .action-row-title {
            color: #8A6B2E !important;
          }
          .action-row-meta {
            font-size: 12px !important;
            color: #5A584F !important;
            line-height: 1.4 !important;
            margin-top: 2px !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: normal !important;
          }
          .action-row-btn {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            height: 30px !important;
            min-height: 30px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            white-space: nowrap !important;
            color: #8A6B2E !important;
            border: 1px solid #8A6B2E !important;
            background-color: #FAF9F7 !important;
            border-radius: 6px !important;
            padding: 0 12px !important;
            margin-left: 26px !important;
            align-self: flex-start !important;
          }

          /* Casting Workflow Grid */
          .workflow-stages-grid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 12px 16px !important;
          }
          .workflow-stage-card {
            padding: 8px 10px !important;
            border-radius: 10px !important;
            background-color: #FFFFFF !important;
            border: 1px solid #E8E2D4 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 2px !important;
          }
          .workflow-stage-card.stage-9 {
            grid-column: span 2 !important;
          }
          .workflow-stage-title {
            font-size: 13px !important;
            font-weight: 700 !important;
            color: #8A6B2E !important;
            line-height: 1.3 !important;
          }
          .workflow-stage-desc {
            font-size: 11.5px !important;
            color: #5A584F !important;
            line-height: 1.35 !important;
          }
          .workflow-callout {
            padding: 10px 12px !important;
            border-radius: 10px !important;
            background-color: #F3EFE6 !important;
            border: 1px solid #E8E2D4 !important;
            font-size: 11.5px !important;
            color: #5A584F !important;
            line-height: 1.4 !important;
          }
        }

        @media (max-width: 400px) {
          .recruiter-dashboard-root :global(.page-header-title) {
            font-size: 20px !important;
          }
          .recruiter-dash-header-actions :global(.dash-action-btn) {
            font-size: 12px !important;
            padding: 0 6px !important;
          }
        }
      `}</style>
    </div>
  );
}
