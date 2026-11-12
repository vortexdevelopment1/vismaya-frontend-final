"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Megaphone,
  FileText,
  Building2,
  Inbox,
  ArrowRight,
  Sparkles,
  Activity,
  Video,
  AlertOctagon,
  ShieldCheck,
  ChevronRight,
  Mail,
  Send,
  Clock,
} from "lucide-react";
import { useAdmin } from "@/lib/admin/AdminContext";
import { useWorkflow } from "@/lib/shared/workflowStore";
import { isRealMode } from "@/lib/api/config";
import { adminService } from "@/lib/api/services/adminService";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/shared/StatusBadge";

export default function AdminDashboardPage() {
  const { talents = [], recruiters = [], activities = [] } = useAdmin();
  const {
    opportunities = [],
    applications = [],
    auditions = [],
    cancellationRequests = [],
    organizations = [],
    isHydrated,
  } = useWorkflow();

  const [metrics, setMetrics] = React.useState(null);
  const [inquiries, setInquiries] = React.useState([]);
  const [inquiriesLoading, setInquiriesLoading] = React.useState(true);
  const isReal = isRealMode("admin");

  React.useEffect(() => {
    let mounted = true;
    adminService.getContactInquiries({ limit: 4 })
      .then((res) => {
        if (mounted && Array.isArray(res?.data)) {
          setInquiries(res.data);
        }
      })
      .catch((err) => console.warn("Failed to load inquiries on dashboard:", err))
      .finally(() => {
        if (mounted) setInquiriesLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  React.useEffect(() => {
    if (!isReal) return;
    let mounted = true;
    adminService.getDashboardMetrics().then((res) => {
      if (mounted && res?.data) {
        setMetrics(res.data);
      }
    }).catch((err) => {
      console.warn("Failed to load dashboard metrics:", err);
    });
    return () => { mounted = false; };
  }, [isReal]);

  // Counts
  const verifiedTalentsCount = useMemo(() => {
    if (isReal && metrics?.users?.verifiedTalent !== undefined) return String(metrics.users.verifiedTalent);
    return String(talents.filter((t) => t.status === "Approved" || t.status === "approved" || t.isProfileApproved).length);
  }, [isReal, metrics, talents]);

  const activeOrganizationsCount = useMemo(() => {
    if (isReal && metrics?.users?.activeOrganization !== undefined) return String(metrics.users.activeOrganization);
    return String(recruiters.filter((r) => r.status === "Verified" || r.status === "active").length);
  }, [isReal, metrics, recruiters]);

  const liveOpportunitiesCount = useMemo(() => {
    if (isReal) return metrics?.opportunities?.published ?? 0;
    return opportunities.filter((o) => o.status === "Published").length;
  }, [isReal, metrics, opportunities]);

  const totalApplicationsCount = useMemo(() => {
    if (isReal) return metrics?.applications?.total ?? 0;
    return applications.length;
  }, [isReal, metrics, applications]);

  const pendingTalentsCount = useMemo(() => {
    if (isReal && metrics?.users?.pending !== undefined) return metrics.users.pending;
    return talents.filter((t) => t.status === "Pending" || t.status === "pending" || !t.isProfileApproved).length;
  }, [isReal, metrics, talents]);

  const pendingOrganizationsCount = useMemo(() => {
    return recruiters.filter((r) => r.status === "Pending" || r.status === "pending").length;
  }, [recruiters]);

  const pendingOpportunitiesCount = useMemo(() => {
    if (isReal) return metrics?.opportunities?.pendingReview ?? 0;
    return opportunities.filter((o) => o.status === "Submitted").length;
  }, [isReal, metrics, opportunities]);

  const pendingCancellationsCount = useMemo(() => {
    if (isReal) return metrics?.opportunities?.cancellationRequests ?? 0;
    return cancellationRequests.filter((c) => c.status === "Pending").length;
  }, [isReal, metrics, cancellationRequests]);

  const auditionRequestsToRelayCount = useMemo(() => {
    if (isReal) return metrics?.auditions?.pendingRelay ?? 0;
    return auditions.filter((a) => a.status === "Requested").length;
  }, [isReal, metrics, auditions]);

  const selfTapesToForwardCount = useMemo(() => {
    if (isReal) return metrics?.auditions?.selfTapesToForward ?? 0;
    return auditions.filter((a) => a.status === "Self-tape Received").length;
  }, [isReal, metrics, auditions]);

  const pendingInquiriesCount = useMemo(() => {
    if (isReal && metrics?.inquiries?.pending !== undefined) return metrics.inquiries.pending;
    return inquiries.filter((i) => i.status === "pending").length;
  }, [isReal, metrics, inquiries]);

  // "Needs Attention" Queue: uniform styling per spec
  const attentionItems = [
    {
      id: "att-inquiries",
      title: "Contact & Helpdesk Inquiries",
      count: pendingInquiriesCount,
      description: "Direct messages received from the public Contact Us desk",
      link: "/admin/inquiries",
      icon: Mail,
    },
    {
      id: "att-opps",
      title: "Opportunities Awaiting Review",
      count: pendingOpportunitiesCount,
      description: "Organization casting submissions awaiting verification and publishing",
      link: "/admin/opportunity-review",
      icon: Inbox,
    },
    {
      id: "att-aud-relay",
      title: "Audition Requests to Relay",
      count: auditionRequestsToRelayCount,
      description: "Organization audition & interview requests queued to relay to talent",
      link: "/admin/auditions",
      icon: Video,
    },
    {
      id: "att-selftapes",
      title: "Self-Tapes to Forward",
      count: selfTapesToForwardCount,
      description: "Artist self-tape submissions ready for moderation & forwarding to organization",
      link: "/admin/auditions",
      icon: Sparkles,
    },
    {
      id: "att-cancel",
      title: "Cancellation Requests",
      count: pendingCancellationsCount,
      description: "Opportunity withdrawal requests requiring review and active applicant notices",
      link: "/admin/cancellation-requests",
      icon: AlertOctagon,
    },
    {
      id: "att-talents",
      title: "Pending Talent Profiles",
      count: pendingTalentsCount,
      description: "New artist registrations requiring photo, age & background verification",
      link: "/admin/talent-management",
      icon: Users,
    },
    {
      id: "att-orgs",
      title: "Pending Organizations",
      count: pendingOrganizationsCount,
      description: "Production houses & agencies awaiting corporate CIN / GST check",
      link: "/admin/recruiter-management",
      icon: Building2,
    },
  ];

  if (!isHydrated) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ height: "48px", background: "#F3EFE6", borderRadius: "12px", width: "40%" }} />
        <div style={{ height: "350px", background: "#FFFFFF", border: "1px solid #E8E2D4", borderRadius: "16px" }} />
      </div>
    );
  }

  return (
    <div className="admin-dash-root" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Top Page Header */}
      <PageHeader
        title="Admin Operations Console"
        subtitle="Vismaya moderation engine: manage opportunity approvals, audition relays, self-tape moderation, and compliance."
        badge="Vismaya Operations"
      />

      {/* 4 Primary Stat Cards */}
      <div
        className="admin-stat-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
          alignItems: "stretch",
        }}
      >
        <StatCard
          title="Verified Talents"
          value={verifiedTalentsCount}
          change={!isReal ? "+18 this week" : undefined}
          isPositive={true}
          description="Verified screen actors, models & voice artists"
          icon={Users}
        />
        <StatCard
          title="Active Organizations"
          value={activeOrganizationsCount}
          change={!isReal ? "+2 approved" : undefined}
          isPositive={true}
          description="Accredited studios & production houses"
          icon={Building2}
        />
        <StatCard
          title="Live Opportunities"
          value={liveOpportunitiesCount.toString()}
          change={!isReal ? "+3 published" : undefined}
          isPositive={true}
          description="Active opportunities accepting submissions"
          icon={Megaphone}
        />
        <StatCard
          title="Total Applications"
          value={totalApplicationsCount.toString()}
          change={!isReal ? "+12 today" : undefined}
          isPositive={true}
          description="Talent submissions across all opportunities"
          icon={FileText}
        />
      </div>

      {/* 2-Column Row: Attention Queues (2fr) + Live Operations Activity (1fr) */}
      <div className="admin-dash-grid">
        {/* Left Column (2fr): Needs Attention Queue */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            borderRadius: "18px",
            padding: "26px",
            boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
          className="admin-dash-card admin-attention-card"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                  fontSize: "22px",
                  fontWeight: 600,
                  color: "#2B2D2A",
                  margin: "0 0 4px 0",
                }}
              >
                Needs attention queue
              </h2>
              <p style={{ fontSize: "14px", color: "#5A584F", margin: 0, fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
                Actionable tasks requiring Vismaya team verification and moderation.
              </p>
            </div>

            {/* Live store sync neutral pill */}
            <div
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#2B2D2A",
                backgroundColor: "#F3EFE6",
                border: "1px solid #E8E2D4",
                padding: "4px 12px",
                borderRadius: "999px",
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                fontFamily: "var(--font-body), 'Inter', sans-serif",
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#8A6B2E" }} />
              <span>Live store sync</span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
              gap: "14px",
              alignItems: "stretch",
            }}
            className="admin-attention-grid"
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
                    padding: "16px",
                    borderRadius: "14px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E8E2D4",
                    borderLeft: hasItems ? "3px solid #8A6B2E" : "1px solid #E8E2D4",
                    textDecoration: "none",
                    transition: "all 0.16s ease",
                    boxShadow: "0 1px 3px rgba(43, 45, 42, 0.03)",
                    opacity: hasItems ? 1 : 0.75,
                  }}
                  className="admin-attention-item"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "10px",
                        background: "#F3EFE6",
                        color: "#8A6B2E",
                        border: "1px solid #E8E2D4",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={19} />
                    </div>

                    <div className="admin-attention-text-wrap" style={{ minWidth: 0, flex: 1 }}>
                      <div
                        className="admin-attention-title"
                        style={{
                          fontWeight: "600",
                          fontSize: "15px",
                          color: "#2B2D2A",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontFamily: "var(--font-body), 'Inter', sans-serif",
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        className="admin-attention-desc"
                        style={{
                          fontSize: "13px",
                          color: "#5A584F",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          marginTop: "2px",
                          fontFamily: "var(--font-body), 'Inter', sans-serif",
                        }}
                      >
                        {item.description}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "10px", flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        padding: "3px 9px",
                        borderRadius: "999px",
                        backgroundColor: hasItems ? "rgba(138, 107, 46, 0.12)" : "#F3EFE6",
                        color: hasItems ? "#6E5420" : "#5A584F",
                        border: `1px solid ${hasItems ? "rgba(138, 107, 46, 0.22)" : "#E8E2D4"}`,
                      }}
                    >
                      {item.count}
                    </span>
                    <ChevronRight size={16} style={{ color: "#8A6B2E" }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Column (1fr): Recent Activity & Desk Pulse */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            borderRadius: "18px",
            padding: "26px",
            boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
          className="admin-dash-card admin-activity-card"
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "#F3EFE6",
                  border: "1px solid #E8E2D4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#8A6B2E",
                }}
              >
                <Activity size={16} />
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#2B2D2A",
                  margin: 0,
                }}
              >
                Operations activity
              </h3>
            </div>
            <Link
              href="/admin/notifications"
              style={{
                fontSize: "13px",
                color: "#8A6B2E",
                fontWeight: "600",
                textDecoration: "none",
                fontFamily: "var(--font-body), 'Inter', sans-serif",
              }}
            >
              View all
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {isReal ? (
              activities.length > 0 ? (
                activities.slice(0, 4).map((act, aIdx) => (
                  <div
                    key={act.id || act._id || `act-${aIdx}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 6px",
                      borderBottom: aIdx === Math.min(activities.length, 4) - 1 ? "none" : "1px solid #E8E2D4",
                    }}
                    className="admin-activity-item"
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#2B2D2A",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontFamily: "var(--font-body), 'Inter', sans-serif",
                        }}
                      >
                        {act.title || act.details?.reason || (typeof act.details === "string" ? act.details : null) || act.action || "Admin Operation"}
                      </span>
                      <span style={{ fontSize: "12px", color: "#5A584F", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
                        {act.createdAt ? new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (act.time || "Recent")}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: "20px 0", textAlign: "center", color: "#5A584F", fontSize: "14px", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
                  No recent operations activity yet
                </div>
              )
            ) : (
              [
                ...(recruiters.length > 0
                  ? [
                      {
                        id: `act-org-${recruiters[0].id || recruiters[0]._id}`,
                        text: `Organization '${recruiters[0].company || recruiters[0].companyName || recruiters[0].name || "Organization"}' registered - review pending`,
                        time: recruiters[0].joinedDate || "Recent",
                        link: "/admin/recruiter-management",
                      },
                    ]
                  : []),
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
              ].slice(0, 4).map((act, aIdx) => (
                <Link
                  key={act.id}
                  href={act.link}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 6px",
                    borderBottom: aIdx === 3 ? "none" : "1px solid #E8E2D4",
                    textDecoration: "none",
                    transition: "background 0.15s ease",
                  }}
                  className="admin-activity-item"
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#2B2D2A",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontFamily: "var(--font-body), 'Inter', sans-serif",
                      }}
                    >
                      {act.text}
                    </span>
                    <span style={{ fontSize: "12px", color: "#5A584F", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
                      {act.time}
                    </span>
                  </div>
                  <ChevronRight size={15} style={{ color: "#8A6B2E", flexShrink: 0, marginLeft: "8px" }} />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Registered Studios & Registered Talents Section (All names capitalized) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(450px, 100%), 1fr))",
          gap: "20px",
          width: "100%",
        }}
      >
        {/* Studios / Production Houses Card */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            borderRadius: "18px",
            padding: "24px",
            boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
          className="admin-dash-card"
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "#F3EFE6",
                  color: "#8A6B2E",
                  border: "1px solid #E8E2D4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Building2 size={18} />
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#2B2D2A",
                    margin: 0,
                  }}
                >
                  Studios &amp; Production Houses
                </h3>
                <p style={{ fontSize: "12.5px", color: "#5A584F", margin: "2px 0 0" }}>
                  Registered casting organizations
                </p>
              </div>
            </div>
            <Link
              href="/admin/recruiter-management"
              style={{
                fontSize: "13px",
                color: "#8A6B2E",
                fontWeight: "600",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              Manage all <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recruiters.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center", color: "#77756B", fontSize: "13.5px" }}>
                No registered studios yet
              </div>
            ) : (
              recruiters.slice(0, 5).map((org) => {
                const studioName = org.companyName || org.company || org.organizationName || org.name || "Studio";
                const contactPerson = org.contactPerson || org.contactName || org.responsiblePerson?.name || "Contact";
                return (
                  <div
                    key={org.id || org._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      backgroundColor: "#FAF9F6",
                      border: "1px solid #E8E2D4",
                      gap: "12px",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "14px",
                          color: "#2B2D2A",
                          textTransform: "capitalize",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={studioName}
                      >
                        {studioName}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#5A584F",
                          marginTop: "2px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          textTransform: "capitalize",
                        }}
                      >
                        <span>{contactPerson}</span>
                        <span>&bull;</span>
                        <span>{org.city || org.location || "Mumbai"}</span>
                      </div>
                    </div>
                    <StatusBadge status={org.status || (org.isVerified ? "Verified" : "Pending")} size="xs" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Talents Card */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            borderRadius: "18px",
            padding: "24px",
            boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
          className="admin-dash-card"
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "#F3EFE6",
                  color: "#8A6B2E",
                  border: "1px solid #E8E2D4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Users size={18} />
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#2B2D2A",
                    margin: 0,
                  }}
                >
                  Artists &amp; Talent Profiles
                </h3>
                <p style={{ fontSize: "12.5px", color: "#5A584F", margin: "2px 0 0" }}>
                  Screen actors, models &amp; performers
                </p>
              </div>
            </div>
            <Link
              href="/admin/talent-management"
              style={{
                fontSize: "13px",
                color: "#8A6B2E",
                fontWeight: "600",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              Manage all <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {talents.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center", color: "#77756B", fontSize: "13.5px" }}>
                No registered talents yet
              </div>
            ) : (
              talents.slice(0, 5).map((tal) => {
                const artistName = tal.stageName || tal.name || "Artist";
                const craft = tal.primaryProfession || tal.profession || tal.craft || "Actor / Screen Artist";
                return (
                  <div
                    key={tal.id || tal._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      backgroundColor: "#FAF9F6",
                      border: "1px solid #E8E2D4",
                      gap: "12px",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "14px",
                          color: "#2B2D2A",
                          textTransform: "capitalize",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={artistName}
                      >
                        {artistName}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#5A584F",
                          marginTop: "2px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          textTransform: "capitalize",
                        }}
                      >
                        <span>{craft}</span>
                        <span>&bull;</span>
                        <span>{tal.currentCity || tal.city || "Mumbai"}</span>
                      </div>
                    </div>
                    <StatusBadge status={tal.status || (tal.isVerified ? "Approved" : "Pending")} size="xs" />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Contact & Helpdesk Inquiries Section */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E2D4",
          borderRadius: "18px",
          padding: "26px",
          boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06)",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          width: "100%",
          boxSizing: "border-box",
        }}
        className="admin-dash-card"
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "#F3EFE6",
                border: "1px solid #E8E2D4",
                color: "#8A6B2E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Mail size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3
                  style={{
                    fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "#2B2D2A",
                    margin: 0,
                  }}
                >
                  Contact &amp; Helpdesk Inquiries
                </h3>
                {pendingInquiriesCount > 0 && (
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "999px",
                      backgroundColor: "rgba(138, 107, 46, 0.12)",
                      color: "#8A6B2E",
                      border: "1px solid rgba(138, 107, 46, 0.25)",
                    }}
                  >
                    {pendingInquiriesCount} Pending
                  </span>
                )}
              </div>
              <p style={{ fontSize: "13px", color: "#5A584F", margin: "2px 0 0", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
                Messages submitted via the Public Contact form &bull; Delivered to <strong>vortexcubesdevelopment@gmail.com</strong>
              </p>
            </div>
          </div>

          <Link
            href="/admin/inquiries"
            style={{
              fontSize: "13.5px",
              color: "#8A6B2E",
              fontWeight: "600",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
            }}
          >
            Open Helpdesk Console <ArrowRight size={15} />
          </Link>
        </div>

        {inquiriesLoading ? (
          <div style={{ padding: "30px 0", textAlign: "center", color: "#77756B", fontSize: "13.5px" }}>
            Loading contact inquiries...
          </div>
        ) : inquiries.length === 0 ? (
          <div style={{ padding: "26px 0", textAlign: "center", color: "#5A584F", fontSize: "14px" }}>
            No contact inquiries received yet. When users submit the Contact form, their inquiries will appear here.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E8E2D4", color: "#77756B", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.06em" }}>
                  <th style={{ padding: "10px 14px", fontWeight: "700" }}>Sender</th>
                  <th style={{ padding: "10px 14px", fontWeight: "700" }}>Subject &amp; Message</th>
                  <th style={{ padding: "10px 14px", fontWeight: "700" }}>Received</th>
                  <th style={{ padding: "10px 14px", fontWeight: "700" }}>Status</th>
                  <th style={{ padding: "10px 14px", fontWeight: "700", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.slice(0, 4).map((item) => (
                  <tr key={item._id} style={{ borderBottom: "1px solid #F3EFE6" }}>
                    <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                      <div style={{ fontWeight: "600", color: "#2B2D2A" }}>{item.name}</div>
                      <div style={{ fontSize: "12px", color: "#8A6B2E" }}>{item.email}</div>
                    </td>
                    <td style={{ padding: "12px 14px", verticalAlign: "middle", maxWidth: "420px" }}>
                      <div style={{ fontWeight: "600", color: "#2B2D2A", fontSize: "13px" }}>{item.subject || "General Inquiry"}</div>
                      <div style={{ fontSize: "12.5px", color: "#5A584F", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                        {item.message}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", verticalAlign: "middle", color: "#77756B", fontSize: "12px", whiteSpace: "nowrap" }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Recent"}
                    </td>
                    <td style={{ padding: "12px 14px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          padding: "3px 8px",
                          borderRadius: "999px",
                          backgroundColor: item.status === "resolved" ? "rgba(16, 185, 129, 0.12)" : "rgba(138, 107, 46, 0.12)",
                          color: item.status === "resolved" ? "#065F46" : "#8A6B2E",
                          border: `1px solid ${item.status === "resolved" ? "rgba(16, 185, 129, 0.25)" : "rgba(138, 107, 46, 0.25)"}`,
                        }}
                      >
                        {item.status || "pending"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", verticalAlign: "middle", textAlign: "right", whiteSpace: "nowrap" }}>
                      <Link
                        href="/admin/inquiries"
                        style={{
                          padding: "5px 12px",
                          borderRadius: "8px",
                          backgroundColor: "#8A6B2E",
                          color: "#FFFFFF",
                          fontSize: "12px",
                          fontWeight: "600",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <Send size={11} /> Reply &amp; Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Workflow Role Architecture Note Card (Full-width) */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E2D4",
          borderRadius: "18px",
          padding: "26px",
          boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "18px",
          width: "100%",
          boxSizing: "border-box",
        }}
        className="admin-dash-card admin-workflow-card"
      >
        <div className="admin-workflow-left" style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <div
            className="admin-workflow-icon"
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              backgroundColor: "#F3EFE6",
              border: "1px solid #E8E2D4",
              color: "#8A6B2E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3
              className="admin-workflow-title"
              style={{
                fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                fontSize: "18px",
                fontWeight: 600,
                color: "#2B2D2A",
                margin: "0 0 6px 0",
              }}
            >
              Vismaya Operating Workflow Model
            </h3>
            <p
              className="admin-workflow-desc"
              style={{
                fontSize: "14px",
                color: "#5A584F",
                margin: 0,
                maxWidth: "760px",
                lineHeight: 1.6,
                fontFamily: "var(--font-body), 'Inter', sans-serif",
              }}
            >
              Organizations screen, shortlist candidates, and make final selections directly. The Vismaya team verifies and approves opportunities before publishing, relays audition invitations, moderates self-tapes, and manages compliance.
            </p>
          </div>
        </div>

        <Link
          href="/admin/opportunity-review"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: "600",
            padding: "0 20px",
            height: "42px",
            backgroundColor: "#8A6B2E",
            color: "#FFFFFF",
            textDecoration: "none",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(138, 107, 46, 0.22)",
            transition: "all 0.16s ease",
            whiteSpace: "nowrap",
            fontFamily: "var(--font-body), 'Inter', sans-serif",
          }}
          className="admin-review-cta"
        >
          <span>Review opportunities</span>
          <ArrowRight size={15} />
        </Link>
      </div>

      <style jsx global>{`
        .admin-dash-grid {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
          gap: 24px;
          align-items: stretch;
          width: 100%;
        }
        @media (max-width: 1024px) {
          .admin-dash-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
        .admin-attention-item:hover {
          background-color: #FAF9F7 !important;
          border-color: #8A6B2E !important;
          transform: translateY(-1px);
        }
        .admin-activity-item:hover {
          background-color: #FAF9F7;
        }
        .admin-review-cta:hover {
          background-color: #6E5420 !important;
        }

        @media (max-width: 640px) {
          .admin-dash-root {
            gap: 14px !important;
          }
          .admin-stat-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
          }
          .admin-dash-grid {
            gap: 14px !important;
          }
          .admin-dash-card {
            padding: 14px 16px !important;
            border-radius: 14px !important;
            gap: 12px !important;
            box-sizing: border-box !important;
            width: 100% !important;
          }
          .admin-attention-card h2,
          .admin-activity-card h3 {
            font-size: 18px !important;
            line-height: 1.25 !important;
          }
          .admin-attention-grid {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .admin-attention-item {
            padding: 12px !important;
            border-radius: 10px !important;
            min-width: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .admin-attention-text-wrap {
            min-width: 0 !important;
            flex: 1 !important;
          }
          .admin-attention-title {
            font-size: 14px !important;
            line-height: 1.3 !important;
            white-space: normal !important;
            word-break: break-word !important;
            overflow-wrap: anywhere !important;
          }
          .admin-attention-desc {
            font-size: 12px !important;
            line-height: 1.35 !important;
            white-space: normal !important;
            word-break: break-word !important;
            overflow-wrap: anywhere !important;
          }
          .admin-workflow-card {
            flex-direction: column !important;
            align-items: stretch !important;
            padding: 14px 16px !important;
            gap: 14px !important;
          }
          .admin-workflow-left {
            gap: 12px !important;
          }
          .admin-workflow-icon {
            width: 36px !important;
            height: 36px !important;
            border-radius: 9px !important;
            min-width: 36px !important;
          }
          .admin-workflow-icon :global(svg) {
            width: 18px !important;
            height: 18px !important;
          }
          .admin-workflow-title {
            font-size: 16px !important;
            line-height: 1.25 !important;
          }
          .admin-workflow-desc {
            font-size: 12.5px !important;
            line-height: 1.5 !important;
          }
          .admin-review-cta {
            width: 100% !important;
            height: 42px !important;
            justify-content: center !important;
            font-size: 13px !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>
    </div>
  );
}
