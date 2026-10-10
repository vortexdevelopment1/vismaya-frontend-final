"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Megaphone,
  FileText,
  Clock,
  ShieldCheck,
  Building2,
  Inbox,
  Award,
  ArrowRight,
  Sparkles,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Video,
  AlertOctagon,
  FolderKanban,
  Check,
  ChevronRight,
} from "lucide-react";
import { useAdmin } from "@/lib/admin/AdminContext";
import { useWorkflow } from "@/lib/shared/workflowStore";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";

export default function AdminDashboardPage() {
  const { talents = [], recruiters = [] } = useAdmin();
  const {
    opportunities = [],
    projects = [],
    applications = [],
    auditions = [],
    cancellationRequests = [],
    organizations = [],
    isHydrated,
  } = useWorkflow();

  // Counts
  const pendingTalentsCount = useMemo(() => {
    return talents.filter((t) => t.status === "Pending").length || 3;
  }, [talents]);

  const pendingOrganizationsCount = useMemo(() => {
    return (
      organizations.filter((o) => o.status === "Pending").length ||
      recruiters.filter((r) => r.status === "Pending").length ||
      1
    );
  }, [organizations, recruiters]);

  const pendingOpportunitiesCount = useMemo(() => {
    return opportunities.filter((o) => o.status === "Submitted").length;
  }, [opportunities]);

  const pendingCancellationsCount = useMemo(() => {
    return cancellationRequests.filter((c) => c.status === "Pending").length;
  }, [cancellationRequests]);

  const auditionRequestsToRelayCount = useMemo(() => {
    return auditions.filter((a) => a.status === "Requested").length;
  }, [auditions]);

  const selfTapesToForwardCount = useMemo(() => {
    return auditions.filter((a) => a.status === "Self-tape Received").length;
  }, [auditions]);

  const liveOpportunitiesCount = useMemo(() => {
    return opportunities.filter((o) => o.status === "Published").length;
  }, [opportunities]);

  const totalApplicationsCount = applications.length;

  // "Needs Attention" Queue
  const attentionItems = [
    {
      id: "att-opps",
      title: "Opportunities Awaiting Review",
      count: pendingOpportunitiesCount,
      description: "Organization casting submissions awaiting verification and publishing",
      link: "/admin/opportunity-review",
      icon: Inbox,
      tint: {
        bg: "rgba(255, 188, 0, 0.12)",
        border: "rgba(255, 188, 0, 0.35)",
        color: "var(--gold)",
      },
    },
    {
      id: "att-aud-relay",
      title: "Audition Requests to Relay",
      count: auditionRequestsToRelayCount,
      description: "Organization audition & interview requests queued to relay to talent",
      link: "/admin/auditions",
      icon: Video,
      tint: {
        bg: "rgba(138, 180, 255, 0.12)",
        border: "rgba(138, 180, 255, 0.35)",
        color: "#8ab4ff",
      },
    },
    {
      id: "att-selftapes",
      title: "Self-Tapes to Forward",
      count: selfTapesToForwardCount,
      description: "Artist self-tape submissions ready for moderation & forwarding to organization",
      link: "/admin/auditions",
      icon: Sparkles,
      tint: {
        bg: "rgba(255, 188, 0, 0.14)",
        border: "rgba(255, 188, 0, 0.4)",
        color: "var(--gold)",
      },
    },
    {
      id: "att-cancel",
      title: "Cancellation Requests",
      count: pendingCancellationsCount,
      description: "Opportunity withdrawal requests requiring review and active applicant notices",
      link: "/admin/cancellation-requests",
      icon: AlertOctagon,
      tint: {
        bg: "rgba(255, 107, 107, 0.14)",
        border: "rgba(255, 107, 107, 0.35)",
        color: "var(--status-red)",
      },
    },
    {
      id: "att-talents",
      title: "Pending Talent Profiles",
      count: pendingTalentsCount,
      description: "New artist registrations requiring photo, age & background verification",
      link: "/admin/talent-management",
      icon: Users,
      tint: {
        bg: "rgba(52, 211, 153, 0.14)",
        border: "rgba(52, 211, 153, 0.32)",
        color: "var(--status-green)",
      },
    },
    {
      id: "att-orgs",
      title: "Pending Organizations",
      count: pendingOrganizationsCount,
      description: "Production houses & agencies awaiting corporate CIN / GST check",
      link: "/admin/recruiter-management",
      icon: Building2,
      tint: {
        bg: "rgba(255, 188, 0, 0.12)",
        border: "rgba(255, 188, 0, 0.32)",
        color: "var(--gold)",
      },
    },
  ];

  if (!isHydrated) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ height: "48px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "12px", width: "40%" }} />
        <div style={{ height: "350px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "16px" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Page Header */}
      <PageHeader
        title="Admin Operations Console"
        subtitle="Vismaya moderation engine: manage opportunity approvals, audition relays, self-tape moderation, and compliance."
        badge="Vismaya Operations"
      />

      {/* 4 Primary Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        <StatCard
          title="Verified Talents"
          value="1,284"
          change="+18 this week"
          isPositive={true}
          description="Verified screen actors, models & voice artists"
          icon={Users}
        />
        <StatCard
          title="Active Organizations"
          value={organizations.length > 0 ? organizations.length.toString() : "14"}
          change="+2 approved"
          isPositive={true}
          description="Accredited studios & production houses"
          icon={Building2}
        />
        <StatCard
          title="Live Opportunities"
          value={liveOpportunitiesCount.toString()}
          change="+3 published"
          isPositive={true}
          description="Active opportunities accepting submissions"
          icon={Megaphone}
        />
        <StatCard
          title="Total Applications"
          value={totalApplicationsCount.toString()}
          change="+12 today"
          isPositive={true}
          description="Talent submissions across all opportunities"
          icon={FileText}
        />
      </div>

      {/* 2-Column Row: Attention Queues (2fr) + Live Operations Activity (1fr) */}
      <div className="admin-dash-grid">
        {/* Left Column (2fr): Needs Attention Queue */}
        <div
          className="card-surface"
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#eceaf5",
                  margin: "0 0 4px 0",
                }}
              >
                Needs attention queue
              </h2>
              <p style={{ fontSize: "13px", color: "#a3acc2", margin: 0 }}>
                Actionable tasks requiring Vismaya team verification and moderation.
              </p>
            </div>

            <div
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--status-green)",
                backgroundColor: "rgba(52, 211, 153, 0.12)",
                border: "1px solid rgba(52, 211, 153, 0.30)",
                padding: "4px 12px",
                borderRadius: "999px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--status-green)" }} />
              <span>Live store sync</span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "12px",
            }}
          >
            {attentionItems.map((item) => {
              const Icon = item.icon;
              const hasItems = item.count > 0;

              return (
                <Link
                  key={item.id}
                  href={item.link}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: `1px solid ${hasItems ? item.tint.border : "rgba(255, 255, 255, 0.08)"}`,
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                  }}
                  className="admin-attention-item"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "10px",
                        background: item.tint.bg,
                        color: item.tint.color,
                        border: `1px solid ${item.tint.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={18} />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: "600",
                          fontSize: "13px",
                          color: "#eceaf5",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#a3acc2",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          marginTop: "2px",
                        }}
                      >
                        {item.description}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "8px", flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        backgroundColor: hasItems ? item.tint.bg : "rgba(255, 255, 255, 0.06)",
                        color: hasItems ? item.tint.color : "#7e89a3",
                        border: `1px solid ${hasItems ? item.tint.border : "rgba(255, 255, 255, 0.10)"}`,
                      }}
                    >
                      {item.count}
                    </span>
                    <ArrowRight size={14} style={{ color: "#7e89a3" }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Column (1fr): Recent Activity & Desk Pulse */}
        <div
          className="card-surface"
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={16} style={{ color: "var(--gold)" }} />
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#eceaf5", margin: 0 }}>
                Operations activity
              </h3>
            </div>
            <Link
              href="/admin/notifications"
              style={{ fontSize: "12px", color: "var(--gold)", fontWeight: "600", textDecoration: "none" }}
            >
              View all
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              {
                id: "act-1",
                text: "Opportunity 'Project Tiger' awaiting review",
                time: "10m ago",
                link: "/admin/opportunity-review",
              },
              {
                id: "act-2",
                text: "Self-tape from Riya Sharma queued for relay",
                time: "25m ago",
                link: "/admin/auditions",
              },
              {
                id: "act-3",
                text: "Escrow TXN-9021 verified (₹1,45,000)",
                time: "1h ago",
                link: "/admin/payments",
              },
              {
                id: "act-4",
                text: "3 media portfolio items in moderation queue",
                time: "2h ago",
                link: "/admin/media-moderation",
              },
            ].map((act) => (
              <Link
                key={act.id}
                href={act.link}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  textDecoration: "none",
                  transition: "background 0.15s ease",
                }}
                className="admin-attention-item"
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#eceaf5",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {act.text}
                  </span>
                  <span style={{ fontSize: "11px", color: "#7e89a3" }}>{act.time}</span>
                </div>
                <ChevronRight size={14} style={{ color: "#7e89a3", flexShrink: 0, marginLeft: "6px" }} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Workflow Role Architecture Note Card (Full-width) */}
      <div
        className="card-surface"
        style={{
          padding: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              backgroundColor: "rgba(255, 188, 0, 0.12)",
              border: "1px solid rgba(255, 188, 0, 0.30)",
              color: "var(--gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#eceaf5", margin: "0 0 4px 0" }}>
              Vismaya Operating Workflow Model
            </h3>
            <p style={{ fontSize: "13px", color: "#a3acc2", margin: 0, maxWidth: "700px", lineHeight: 1.5 }}>
              Organizations screen, shortlist candidates, and make final selections directly. The Vismaya team verifies and approves opportunities before publishing, relays audition invitations, moderates self-tapes, and manages compliance.
            </p>
          </div>
        </div>

        <Link
          href="/admin/opportunity-review"
          className="btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            fontWeight: "600",
            padding: "0 18px",
            height: "36px",
            textDecoration: "none",
            borderRadius: "10px",
          }}
        >
          <span>Review opportunities</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      <style jsx global>{`
        .admin-dash-grid {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
          gap: 24px;
          align-items: flex-start;
          width: 100%;
        }
        @media (max-width: 1024px) {
          .admin-dash-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
        .admin-attention-item:hover {
          background-color: rgba(255, 255, 255, 0.08) !important;
          transform: translateY(-1px);
          border-color: rgba(255, 188, 0, 0.4) !important;
        }
      `}</style>
    </div>
  );
}
