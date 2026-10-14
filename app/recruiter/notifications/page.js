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
import EmptyState from "@/components/shared/EmptyState";

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
    <div
      className="v-notif-page-wrapper"
      style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%", minWidth: 0 }}
    >
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
              className="v-mark-all-btn btn-secondary"
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
      <div
        className="v-notif-tabs-container"
        style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}
      >
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
              className={`v-notif-tab-btn ${isActive ? "active" : ""}`}
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
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }} className="v-notif-list">
          {filteredNotifications.map((notif) => {
            const conf = getIconConfig(notif.type);
            const Icon = conf.icon;

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`v-notif-card card-surface ${notif.read ? "v-notif-read" : "v-notif-unread"}`}
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
                  className="v-notif-icon-box"
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
                <div
                  className="v-notif-content-col"
                  style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}
                >
                  <div
                    className="v-notif-meta-row"
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}
                  >
                    <div
                      className="v-notif-tag-wrap"
                      style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}
                    >
                      <span
                        className="v-notif-tag-text"
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
                          className="v-notif-unread-dot"
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
                    <span
                      className="v-notif-date-text"
                      style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      <Clock size={12} />
                      {formatTimestamp(notif.createdAt)}
                    </span>
                  </div>

                  <p
                    className="v-notif-message-text"
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

                <div className="v-notif-chevron-box" style={{ display: "flex", alignItems: "center", alignSelf: "center" }}>
                  <ChevronRight size={18} style={{ color: "var(--text-muted)" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile-Only CSS (max-width: 640px) */}
      <style jsx global>{`
        @media (max-width: 640px) {
          /* Page wrapper & Spacing */
          .v-notif-page-wrapper {
            gap: 12px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
            background: transparent !important;
          }

          /* B. Header */
          .v-notif-page-wrapper .page-header-container {
            margin-bottom: 0 !important;
            gap: 8px !important;
          }
          .v-notif-page-wrapper .page-header-container nav[aria-label="Breadcrumb"] {
            font-size: 11.5px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            flex-wrap: nowrap !important;
            gap: 6px !important;
          }
          .v-notif-page-wrapper .page-header-title {
            font-size: 22px !important;
            line-height: 1.25 !important;
            margin: 0 !important;
          }
          .v-notif-page-wrapper .page-header-subtitle {
            font-size: 13px !important;
            line-height: 1.5 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 3 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          }
          .v-notif-page-wrapper .page-header-actions {
            width: 100% !important;
            margin: 4px 0 0 0 !important;
          }
          .v-notif-page-wrapper .v-mark-all-btn {
            width: 100% !important;
            height: 40px !important;
            min-height: 40px !important;
            font-size: 12px !important;
            margin: 10px 0 !important;
            border-radius: 10px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background-color: #FFFFFF !important;
            border: 1px solid #E8E2D4 !important;
            color: #2B2D2A !important;
          }
          .v-notif-page-wrapper .v-mark-all-btn:hover {
            background-color: #F3EFE6 !important;
            color: #8A6B2E !important;
            border-color: #8A6B2E !important;
          }

          /* C. Tabs: NO horizontal scroll, flex-wrap chips in 2 lines */
          .v-notif-page-wrapper .v-notif-tabs-container {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 5px !important;
            overflow: visible !important;
            margin: 12px 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .v-notif-page-wrapper .v-notif-tab-btn {
            flex: 1 1 auto !important;
            height: 28px !important;
            padding: 0 8px !important;
            border-radius: 999px !important;
            font-size: 10.5px !important;
            font-weight: 600 !important;
            white-space: nowrap !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 5px !important;
            box-shadow: none !important;
          }
          .v-notif-page-wrapper .v-notif-tab-btn.active {
            background-color: #8A6B2E !important;
            color: #FFFFFF !important;
            border: 1px solid #8A6B2E !important;
            box-shadow: none !important;
          }
          .v-notif-page-wrapper .v-notif-tab-btn.active span:last-child {
            background-color: #FFFFFF !important;
            color: #8A6B2E !important;
            min-width: 16px !important;
            height: 16px !important;
            border-radius: 8px !important;
            font-size: 9.5px !important;
            padding: 0 4px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .v-notif-page-wrapper .v-notif-tab-btn:not(.active) {
            background-color: #FFFFFF !important;
            border: 1px solid #E8E2D4 !important;
            color: #5A584F !important;
            box-shadow: none !important;
          }
          .v-notif-page-wrapper .v-notif-tab-btn:not(.active) span:last-child {
            background-color: #F3EFE6 !important;
            color: #2B2D2A !important;
            min-width: 16px !important;
            height: 16px !important;
            border-radius: 8px !important;
            font-size: 9.5px !important;
            padding: 0 4px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          /* D. Notification rows */
          .v-notif-page-wrapper .v-notif-list {
            gap: 10px !important;
          }
          .v-notif-page-wrapper .v-notif-card {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            padding: 12px !important;
            border-radius: 14px !important;
            gap: 10px !important;
            width: 100% !important;
            box-sizing: border-box !important;
            transition: all 0.15s ease !important;
          }
          .v-notif-page-wrapper .v-notif-card.v-notif-read {
            background-color: #FFFFFF !important;
            border: 1px solid #E8E2D4 !important;
            box-shadow: 0 1px 3px rgba(43, 45, 42, 0.03) !important;
          }
          .v-notif-page-wrapper .v-notif-card.v-notif-unread {
            background-color: #F3EFE6 !important;
            border: 1px solid #E8E2D4 !important;
            border-left: 3px solid #8A6B2E !important;
            box-shadow: 0 1px 4px rgba(43, 45, 42, 0.05) !important;
          }
          .v-notif-page-wrapper .v-notif-icon-box {
            width: 32px !important;
            height: 32px !important;
            min-width: 32px !important;
            min-height: 32px !important;
            border-radius: 8px !important;
            background-color: #F3EFE6 !important;
            border: 1px solid #E8E2D4 !important;
            color: #8A6B2E !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-shrink: 0 !important;
          }
          .v-notif-page-wrapper .v-notif-icon-box :global(svg) {
            width: 16px !important;
            height: 16px !important;
          }
          .v-notif-page-wrapper .v-notif-content-col {
            flex: 1 !important;
            min-width: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 2px !important;
          }
          .v-notif-page-wrapper .v-notif-meta-row {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 2px !important;
            width: 100% !important;
          }
          .v-notif-page-wrapper .v-notif-tag-wrap {
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
            flex-wrap: nowrap !important;
            line-height: 1.2 !important;
          }
          .v-notif-page-wrapper .v-notif-tag-text {
            font-size: 10.5px !important;
            font-weight: 700 !important;
            color: #8A6B2E !important;
            text-transform: uppercase !important;
            letter-spacing: 0.08em !important;
          }
          .v-notif-page-wrapper .v-notif-unread-dot {
            width: 7px !important;
            height: 7px !important;
            min-width: 7px !important;
            min-height: 7px !important;
            border-radius: 50% !important;
            background-color: #8A6B2E !important;
            box-shadow: none !important;
            margin: 0 !important;
            display: inline-block !important;
          }
          .v-notif-page-wrapper .v-notif-date-text {
            font-size: 11px !important;
            color: #5A584F !important;
            white-space: nowrap !important;
            line-height: 1.3 !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
          }
          .v-notif-page-wrapper .v-notif-date-text :global(svg) {
            width: 11px !important;
            height: 11px !important;
          }
          .v-notif-page-wrapper .v-notif-message-text {
            font-size: 13px !important;
            font-weight: 500 !important;
            line-height: 1.5 !important;
            color: #2B2D2A !important;
            margin: 2px 0 0 0 !important;
            overflow-wrap: anywhere !important;
            word-break: normal !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 4 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          }
          .v-notif-page-wrapper .v-notif-chevron-box {
            width: 16px !important;
            flex-shrink: 0 !important;
            display: flex !important;
            align-items: center !important;
          }
          .v-notif-page-wrapper .v-notif-chevron-box :global(svg) {
            width: 16px !important;
            height: 16px !important;
            color: #5A584F !important;
          }

          /* E. Empty state */
          .v-notif-page-wrapper [style*="border: 1px dashed"],
          .v-notif-page-wrapper .empty-state-box {
            padding: 24px 16px !important;
            border-radius: 14px !important;
            background-color: #FFFFFF !important;
            border: 1px dashed #E8E2D4 !important;
          }
          .v-notif-page-wrapper [style*="border: 1px dashed"] > div:first-child {
            width: 40px !important;
            height: 40px !important;
            margin-bottom: 8px !important;
            background-color: #F3EFE6 !important;
            border: 1px solid #E8E2D4 !important;
            color: #8A6B2E !important;
            box-shadow: none !important;
          }
          .v-notif-page-wrapper [style*="border: 1px dashed"] h3 {
            font-size: 15px !important;
            margin-bottom: 4px !important;
            color: #2B2D2A !important;
          }
          .v-notif-page-wrapper [style*="border: 1px dashed"] p {
            font-size: 13px !important;
            line-height: 1.4 !important;
            color: #5A584F !important;
          }
        }

        /* Screen tweak under 380px */
        @media (max-width: 380px) {
          .v-notif-page-wrapper .v-notif-tabs-container {
            gap: 4px !important;
          }
          .v-notif-page-wrapper .v-notif-tab-btn {
            font-size: 10px !important;
            padding: 0 6px !important;
            gap: 4px !important;
            height: 27px !important;
          }
          .v-notif-page-wrapper .v-notif-tab-btn span:last-child {
            min-width: 15px !important;
            height: 15px !important;
            font-size: 9px !important;
            padding: 0 3px !important;
            line-height: 15px !important;
          }
        }
      `}</style>
    </div>
  );
}
