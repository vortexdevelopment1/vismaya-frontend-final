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
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Page Header */}
      <PageHeader
        title="Organization Overview"
        subtitle="Manage casting projects, post verified opportunities, screen talent submissions, and track audition self-tapes."
        badge="Zee Films • Verified Production House"
        action={
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link
              href="/recruiter/projects"
              className="btn-secondary"
              style={{ fontSize: "13px", fontWeight: "600", height: "36px", padding: "0 16px", gap: "6px", borderRadius: "10px" }}
            >
              <FolderKanban size={15} />
              <span>Projects</span>
            </Link>
            <Link
              href="/recruiter/opportunities/new"
              className="btn-primary"
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
          className="card-surface"
          style={{
            padding: "22px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              paddingBottom: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "10px",
                  background: "rgba(251, 191, 36, 0.14)",
                  color: "var(--gold)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(251, 191, 36, 0.35)",
                }}
              >
                <AlertTriangle size={18} />
              </div>
              <div>
                <h2
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  Action Needed
                </h2>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                  Items requiring your immediate review and decisions
                </p>
              </div>
            </div>

            <span
              style={{
                fontSize: "0.725rem",
                fontWeight: 700,
                color: "var(--gold)",
                backgroundColor: "rgba(255, 188, 0, 0.12)",
                padding: "3px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 188, 0, 0.25)",
              }}
            >
              {totalActionCount} items
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      backgroundColor: "rgba(251, 191, 36, 0.08)",
                      border: "1px solid rgba(251, 191, 36, 0.25)",
                      textDecoration: "none",
                      transition: "all 0.18s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", minWidth: 0 }}>
                      <AlertTriangle size={16} style={{ color: "var(--gold)", marginTop: "2px", flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--gold)" }}>
                          Changes Requested: {opp.title}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {opp.adminNote || "Please update opportunity details"}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--gold)" }}>Edit</span>
                  </Link>
                ))}

                {/* New Self-tapes Received / Forwarded */}
                {readyAuditions.map((aud) => (
                  <Link
                    key={`aud-${aud.id}`}
                    href="/recruiter/shortlist-auditions"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      backgroundColor: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      textDecoration: "none",
                      transition: "all 0.18s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", minWidth: 0 }}>
                      <Video size={16} style={{ color: "var(--gold)", marginTop: "2px", flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--text-primary)" }}>
                          Audition Video: {aud.talentName}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                          Status: {aud.status} • Ready for look-test review
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--gold)" }}>Review</span>
                  </Link>
                ))}

                {/* New Applicants awaiting review */}
                {newApplicants.map((app) => (
                  <Link
                    key={`app-${app.id}`}
                    href={`/recruiter/applications/${app.id}?from=dashboard&opp=${app.opportunityId}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      backgroundColor: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      textDecoration: "none",
                      transition: "all 0.18s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", minWidth: 0 }}>
                      <UserCheck size={16} style={{ color: "var(--gold)", marginTop: "2px", flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--text-primary)" }}>
                          New Applicant: {app.talentName}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                          Role: {app.roleApplied} • Applied {new Date(app.appliedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--gold)" }}>Screen</span>
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Right Card: Full End-to-End Casting Flow */}
        <div
          className="card-surface"
          style={{
            padding: "22px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              paddingBottom: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "10px",
                  background: "rgba(255, 188, 0, 0.12)",
                  color: "var(--gold)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(255, 188, 0, 0.28)",
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <h2
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  Casting Workflow
                </h2>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                  Verified lifecycle connecting Organizations, Vismaya Desk, and Artists
                </p>
              </div>
            </div>

            <span
              style={{
                fontSize: "0.725rem",
                fontWeight: 700,
                color: "var(--gold)",
                backgroundColor: "rgba(255, 188, 0, 0.12)",
                padding: "3px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 188, 0, 0.25)",
              }}
            >
              9 Stages
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(125px, 100%), 1fr))",
              gap: "8px",
            }}
          >
            {workflowStages.map((stage) => (
              <div
                key={stage.num}
                style={{
                  padding: "10px 12px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--gold)" }}>
                  {stage.title}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", lineHeight: 1.3 }}>
                  {stage.desc}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: "12px",
              backgroundColor: "rgba(255, 188, 0, 0.06)",
              border: "1px solid rgba(255, 188, 0, 0.2)",
              fontSize: "0.785rem",
              color: "var(--gold)",
              lineHeight: 1.4,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <ShieldCheck size={16} style={{ flexShrink: 0 }} />
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
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 599.98px) {
          .dashboard-stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
