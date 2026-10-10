"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Filter,
  FileText,
  Users,
  Video,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Info,
  ChevronRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useWorkflow } from "@/lib/shared/workflowStore";
import PageHeader from "@/components/shared/PageHeader";

export default function OrganizationNotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    isHydrated,
  } = useWorkflow();

  const [activeTab, setActiveTab] = useState("ALL"); // ALL | OPPORTUNITY | APPLICANTS | AUDITIONS | VISMAYA

  // Filter org notifications
  const orgNotifications = useMemo(() => {
    return notifications.filter((n) => n.toRole === "organization" || !n.toRole);
  }, [notifications]);

  // Unread count
  const unreadCount = useMemo(() => {
    return orgNotifications.filter((n) => !n.read).length;
  }, [orgNotifications]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts = {
      ALL: orgNotifications.length,
      OPPORTUNITY: 0,
      APPLICANTS: 0,
      AUDITIONS: 0,
      VISMAYA: 0,
    };

    orgNotifications.forEach((n) => {
      const t = (n.type || "").toLowerCase();
      if (t === "opportunity" || t === "project" || t === "review" || t === "cancellation") {
        counts.OPPORTUNITY++;
      } else if (t === "application" || t === "shortlist") {
        counts.APPLICANTS++;
      } else if (t === "audition" || t === "media") {
        counts.AUDITIONS++;
      } else {
        counts.VISMAYA++;
      }
    });

    return counts;
  }, [orgNotifications]);

  // Filtered list
  const filteredNotifications = useMemo(() => {
    if (activeTab === "ALL") return orgNotifications;

    return orgNotifications.filter((n) => {
      const t = (n.type || "").toLowerCase();
      if (activeTab === "OPPORTUNITY") {
        return t === "opportunity" || t === "project" || t === "review" || t === "cancellation";
      }
      if (activeTab === "APPLICANTS") {
        return t === "application" || t === "shortlist";
      }
      if (activeTab === "AUDITIONS") {
        return t === "audition" || t === "media";
      }
      if (activeTab === "VISMAYA") {
        return t === "info" || t === "warning" || t === "danger" || t === "success" || !t;
      }
      return true;
    });
  }, [orgNotifications, activeTab]);

  const handleNotificationClick = (notif) => {
    if (!notif.read) {
      markNotificationRead(notif.id);
    }
    if (notif.link) {
      let targetLink = notif.link;
      if (targetLink.startsWith("/recruiter/applications") && !targetLink.includes("from=")) {
        targetLink += (targetLink.includes("?") ? "&" : "?") + "from=notifications";
      }
      router.push(targetLink);
    }
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead("organization", "org-1");
  };

  const getIconConfig = (type) => {
    const t = (type || "").toLowerCase();
    if (t === "audition" || t === "media") {
      return {
        icon: Video,
        bg: "rgba(255, 188, 0, 0.12)",
        border: "rgba(255, 188, 0, 0.28)",
        color: "var(--gold)",
        tag: "Auditions",
      };
    }
    if (t === "application" || t === "shortlist") {
      return {
        icon: Users,
        bg: "rgba(255, 188, 0, 0.12)",
        border: "rgba(255, 188, 0, 0.28)",
        color: "var(--gold)",
        tag: "Applicants",
      };
    }
    if (t === "opportunity" || t === "project" || t === "review" || t === "cancellation") {
      return {
        icon: Sparkles,
        bg: "rgba(255, 188, 0, 0.12)",
        border: "rgba(255, 188, 0, 0.28)",
        color: "var(--gold)",
        tag: "Opportunity",
      };
    }
    if (t === "warning" || t === "danger") {
      return {
        icon: AlertTriangle,
        bg: "rgba(255, 107, 107, 0.14)",
        border: "rgba(255, 107, 107, 0.35)",
        color: "#ff6b6b",
        tag: "Vismaya Notice",
      };
    }
    return {
      icon: MessageSquare,
      bg: "rgba(255, 188, 0, 0.12)",
      border: "rgba(255, 188, 0, 0.28)",
      color: "var(--gold)",
      tag: "Vismaya Desk",
    };
  };

  const formatTimestamp = (isoStr) => {
    if (!isoStr) return "Recent";
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isHydrated) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ height: "48px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "12px", width: "40%" }} />
        <div style={{ height: "350px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "16px" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%", minWidth: 0 }}>
      {/* Page Header */}
      <PageHeader
        title="Notifications"
        subtitle="Live activity alerts for candidate submissions, self-tapes, and Vismaya reviews."
        breadcrumbs={[
          { label: "Dashboard", href: "/recruiter/dashboard" },
          { label: "Notifications" },
        ]}
        action={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="btn-secondary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 18px",
                fontSize: "0.85rem",
                borderRadius: "12px",
              }}
            >
              <CheckCheck size={16} />
              <span>Mark all as read</span>
            </button>
          ) : null
        }
      />

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
        {[
          { key: "ALL", label: "All Activity", count: tabCounts.ALL },
          { key: "OPPORTUNITY", label: "Opportunity", count: tabCounts.OPPORTUNITY },
          { key: "APPLICANTS", label: "Applicants", count: tabCounts.APPLICANTS },
          { key: "AUDITIONS", label: "Auditions", count: tabCounts.AUDITIONS },
          { key: "VISMAYA", label: "Vismaya Messages", count: tabCounts.VISMAYA },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "12px",
                fontSize: "0.825rem",
                fontWeight: isActive ? "700" : "500",
                backgroundColor: isActive ? "var(--gold)" : "rgba(255, 255, 255, 0.06)",
                color: isActive ? "#1a1300" : "var(--text-secondary)",
                border: `1px solid ${isActive ? "var(--gold)" : "rgba(255, 255, 255, 0.12)"}`,
                boxShadow: isActive ? "0 4px 14px rgba(255, 188, 0, 0.25)" : "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  padding: "2px 7px",
                  borderRadius: "8px",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  backgroundColor: isActive ? "rgba(26, 19, 0, 0.2)" : "rgba(255, 255, 255, 0.1)",
                  color: isActive ? "#1a1300" : "var(--text-muted)",
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          title="No Notifications In This Category"
          description="You are all caught up! New applicant submissions and audition alerts will appear here."
          iconName="Bell"
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredNotifications.map((notif) => {
            const conf = getIconConfig(notif.type);
            const Icon = conf.icon;

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className="card-surface"
                style={{
                  backgroundColor: notif.read ? "var(--bg-glass)" : "rgba(255, 188, 0, 0.08)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: `1px solid ${notif.read ? "var(--border-glass)" : "rgba(255, 188, 0, 0.35)"}`,
                  borderRadius: "16px",
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "16px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {/* Category Icon */}
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    backgroundColor: conf.bg,
                    border: `1px solid ${conf.border}`,
                    color: conf.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: "0.725rem",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          color: conf.color,
                        }}
                      >
                        {conf.tag}
                      </span>
                      {!notif.read && (
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "var(--gold)",
                            boxShadow: "0 0 8px rgba(255, 188, 0, 0.6)",
                          }}
                        />
                      )}
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={12} />
                      {formatTimestamp(notif.createdAt)}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: notif.read ? "500" : "600",
                      color: "var(--text-primary)",
                      margin: "2px 0 0 0",
                      lineHeight: "1.5",
                    }}
                  >
                    {notif.message}
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", alignSelf: "center" }}>
                  <ChevronRight size={18} style={{ color: "var(--text-muted)" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
