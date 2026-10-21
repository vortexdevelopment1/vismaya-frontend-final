"use client";

import React, { useState, useMemo } from "react";
import {
  Bell,
  CheckCheck,
  Calendar,
  FileText,
  Megaphone,
  Sparkles,
  Video,
  ShieldCheck,
  Inbox,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import Tabs from "@/components/shared/Tabs";
import EmptyState from "@/components/shared/EmptyState";
import NotificationItem from "@/components/talent/NotificationItem";
import { useWorkflow } from "@/lib/shared/workflowStore";
import { useTalent } from "@/lib/talent/TalentContext";
import { useAuth } from "@/context/AuthContext";
import { isRealMode } from "@/lib/api/config";

export default function TalentNotificationsPage() {
  const { user } = useAuth();
  const { profile, notifications: ctxNotifications = [], addToast } = useTalent();
  const { getNotificationsForRole, markAllNotificationsRead, unreadNotificationsCount, isHydrated } = useWorkflow();

  const currentTalentId = user?.id || user?._id || profile?.id || profile?._id || profile?.userId || (!isRealMode("talent") ? "tal-904" : "");
  const [activeTab, setActiveTab] = useState("all");

  const notifications = useMemo(() => {
    if (isRealMode("notifications") || isRealMode("talent")) {
      return Array.isArray(ctxNotifications) ? ctxNotifications : [];
    }
    return getNotificationsForRole("talent", currentTalentId);
  }, [ctxNotifications, getNotificationsForRole, currentTalentId]);

  const unreadCount = isRealMode("notifications")
    ? (Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0)
    : unreadNotificationsCount("talent", currentTalentId);

  // Categorization helpers
  const categorize = (type) => {
    const t = (type || "").toLowerCase();
    if (t.includes("audition")) return "Auditions";
    if (t.includes("app") || t.includes("shortlist") || t.includes("select")) return "Applications";
    if (t.includes("opp") || t.includes("call")) return "Opportunities";
    return "Vismaya messages";
  };

  const applicationsCount = notifications.filter((n) => categorize(n.type) === "Applications").length;
  const auditionsCount = notifications.filter((n) => categorize(n.type) === "Auditions").length;
  const opportunitiesCount = notifications.filter((n) => categorize(n.type) === "Opportunities").length;
  const vismayaMessagesCount = notifications.filter((n) => categorize(n.type) === "Vismaya messages").length;

  const tabs = [
    { key: "all", label: "All Notifications", count: notifications.length },
    { key: "unread", label: "Unread", count: unreadCount },
    { key: "Applications", label: "Applications", count: applicationsCount },
    { key: "Auditions", label: "Auditions", count: auditionsCount },
    { key: "Opportunities", label: "Opportunities", count: opportunitiesCount },
    { key: "Vismaya messages", label: "Vismaya Messages", count: vismayaMessagesCount },
  ];

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === "all") return true;
      if (activeTab === "unread") return !n.read;
      return categorize(n.type) === activeTab;
    });
  }, [notifications, activeTab]);

  const handleMarkAllRead = () => {
    markAllNotificationsRead("talent", currentTalentId);
    addToast({
      type: "success",
      title: "All Notifications Read",
      message: "All talent notifications have been marked as read.",
    });
  };

  return (
    <div className="talent-notifications-root" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <PageHeader
        title="Notification Center"
        subtitle="Real-time alerts regarding application review statuses, shortlisted audition tapes, live opportunities, and direct Vismaya casting updates."
        badge={`${unreadCount} UNREAD`}
        breadcrumbs={[
          { label: "Talent Dashboard", href: "/talent/dashboard" },
          { label: "Notifications" },
        ]}
        action={
          unreadCount > 0 ? (
            <button
              onClick={handleMarkAllRead}
              className="btn-secondary notif-mark-all-btn"
              style={{ fontSize: "0.85rem", padding: "8px 18px", borderRadius: "4px" }}
            >
              <CheckCheck size={16} />
              <span>Mark All as Read</span>
            </button>
          ) : null
        }
      />

      {/* Tabs Filter Bar */}
      <div className="notif-tabs-scroll-wrap">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(key) => setActiveTab(key)}
          variant="pills"
        />
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="notif-empty-wrap">
          <EmptyState
            title="You are all caught up!"
            description="There are no notifications in this category. You'll receive real-time updates as casting teams review your submissions."
            iconName="Bell"
          />
        </div>
      ) : (
        <div className="notif-list-container" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredNotifications.map((notif) => (
            <NotificationItem key={notif.id} notification={notif} />
          ))}
        </div>
      )}

      <style jsx>{`
        @media (max-width: 640px) {
          .talent-notifications-root {
            gap: 14px !important;
          }

          /* Header & Breadcrumbs */
          .talent-notifications-root :global(.page-header-container) {
            margin-bottom: 0 !important;
            gap: 8px !important;
          }
          .talent-notifications-root :global(.page-header-container nav) {
            font-size: 12px !important;
            gap: 6px !important;
          }
          .talent-notifications-root :global(.page-header-row) {
            gap: 8px !important;
          }
          .talent-notifications-root :global(.page-header-title-row) {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            flex-wrap: wrap !important;
          }
          .talent-notifications-root :global(.page-header-title) {
            font-size: 22px !important;
            line-height: 1.25 !important;
            letter-spacing: -0.01em !important;
          }
          .talent-notifications-root :global(.page-header-badge) {
            font-size: 10px !important;
            padding: 3px 8px !important;
            letter-spacing: 0.08em !important;
          }
          .talent-notifications-root :global(.page-header-subtitle) {
            font-size: 13px !important;
            line-height: 1.5 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 3 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-width: 100% !important;
          }
          .talent-notifications-root :global(.page-header-actions) {
            width: 100% !important;
            margin-top: 2px !important;
          }

          /* MARK ALL AS READ Button */
          .talent-notifications-root :global(.notif-mark-all-btn) {
            width: 100% !important;
            height: 40px !important;
            min-height: 40px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 6px !important;
            margin: 6px 0 0 0 !important;
            border-radius: 8px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.04em !important;
          }

          /* 2-line Filter Chips Wrap */
          .notif-tabs-scroll-wrap {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 12px 0 !important;
            overflow: visible !important;
          }
          .notif-tabs-scroll-wrap::after {
            display: none !important;
          }
          .notif-tabs-scroll-wrap :global(.custom-tabs-container) {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 5px !important;
            overflow: visible !important;
            padding: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            border-bottom: none !important;
          }
          .notif-tabs-scroll-wrap :global(.custom-tabs-container::-webkit-scrollbar) {
            display: none !important;
          }
          .notif-tabs-scroll-wrap :global(.tab-btn) {
            flex: 1 1 auto !important;
            height: 28px !important;
            min-height: 28px !important;
            padding: 0 8px !important;
            border-radius: 999px !important;
            font-size: 10.5px !important;
            font-weight: 600 !important;
            font-family: var(--font-body), 'Inter', sans-serif !important;
            white-space: nowrap !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 5px !important;
            margin: 0 !important;
            box-shadow: none !important;
            transition: all 0.15s ease !important;
          }
          .notif-tabs-scroll-wrap :global(.tab-btn > span) {
            font-size: 10.5px !important;
            white-space: nowrap !important;
          }
          .notif-tabs-scroll-wrap :global(.tab-btn.tab-active) {
            background-color: #8A6B2E !important;
            border-color: #8A6B2E !important;
            color: #FFFFFF !important;
            box-shadow: none !important;
          }
          .notif-tabs-scroll-wrap :global(.tab-btn.tab-active > span) {
            color: #FFFFFF !important;
          }
          .notif-tabs-scroll-wrap :global(.tab-btn.tab-active > span:not(:only-child):last-child) {
            background-color: #FFFFFF !important;
            color: #8A6B2E !important;
            border: none !important;
          }
          .notif-tabs-scroll-wrap :global(.tab-btn:not(.tab-active)) {
            background-color: #FFFFFF !important;
            border: 1px solid #E8E2D4 !important;
            color: #5A584F !important;
          }
          .notif-tabs-scroll-wrap :global(.tab-btn:not(.tab-active) > span) {
            color: #5A584F !important;
          }
          .notif-tabs-scroll-wrap :global(.tab-btn:not(.tab-active) > span:not(:only-child):last-child) {
            background-color: #F3EFE6 !important;
            color: #2B2D2A !important;
            border: 1px solid #E8E2D4 !important;
          }
          .notif-tabs-scroll-wrap :global(.tab-btn > span:not(:only-child):last-child) {
            min-width: 16px !important;
            height: 16px !important;
            border-radius: 8px !important;
            font-size: 9.5px !important;
            font-weight: 700 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 4px !important;
            line-height: 16px !important;
            flex-shrink: 0 !important;
          }

          /* Notification List */
          .notif-list-container {
            gap: 10px !important;
            width: 100% !important;
          }

          /* Compact Empty State */
          .notif-empty-wrap :global(div[style*="padding: 48px"]) {
            padding: 28px 16px !important;
            border-radius: 12px !important;
          }
          .notif-empty-wrap :global(div[style*="width: 56px"]) {
            width: 40px !important;
            height: 40px !important;
            margin-bottom: 10px !important;
          }
          .notif-empty-wrap :global(div[style*="width: 56px"] svg) {
            width: 20px !important;
            height: 20px !important;
          }
          .notif-empty-wrap :global(h3) {
            font-size: 15px !important;
            line-height: 1.3 !important;
            margin-bottom: 4px !important;
          }
          .notif-empty-wrap :global(p) {
            font-size: 13px !important;
            line-height: 1.5 !important;
          }

          /* Modal / Drawer details styles if opened */
          :global(.modal-container),
          :global(.modal-content),
          :global(.dialog-content),
          :global(.drawer-content) {
            max-width: 100% !important;
            width: 100% !important;
            max-height: 90vh !important;
            padding: 16px !important;
            box-sizing: border-box !important;
          }
          :global(.modal-body),
          :global(.drawer-body) {
            overflow-y: auto !important;
          }
          :global(.modal-footer button),
          :global(.drawer-footer button) {
            min-height: 42px !important;
          }
        }

        @media (max-width: 400px) {
          .talent-notifications-root :global(.page-header-title) {
            font-size: 20px !important;
          }
          .talent-notifications-root :global(.page-header-badge) {
            font-size: 9.5px !important;
          }
        }

        @media (max-width: 380px) {
          .notif-tabs-scroll-wrap :global(.tab-btn) {
            font-size: 10px !important;
            padding: 0 5px !important;
            gap: 4px !important;
          }
          .notif-tabs-scroll-wrap :global(.tab-btn > span) {
            font-size: 10px !important;
          }
          .notif-tabs-scroll-wrap :global(.tab-btn > span:not(:only-child):last-child) {
            font-size: 9px !important;
            min-width: 15px !important;
            height: 15px !important;
            padding: 0 3px !important;
          }
        }
      `}</style>
    </div>
  );
}
