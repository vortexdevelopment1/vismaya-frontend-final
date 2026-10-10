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

export default function TalentNotificationsPage() {
  const { getNotificationsForRole, markAllNotificationsRead, unreadNotificationsCount, isHydrated } = useWorkflow();
  const { addToast } = useTalent();

  const currentTalentId = "tal-904";
  const [activeTab, setActiveTab] = useState("all");

  const notifications = useMemo(
    () => getNotificationsForRole("talent", currentTalentId),
    [getNotificationsForRole]
  );

  const unreadCount = unreadNotificationsCount("talent", currentTalentId);

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
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
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
              className="btn-secondary"
              style={{ fontSize: "0.85rem", padding: "8px 18px", borderRadius: "12px" }}
            >
              <CheckCheck size={16} />
              <span>Mark All as Read</span>
            </button>
          ) : null
        }
      />

      {/* Tabs Filter Bar */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(key) => setActiveTab(key)}
        variant="pills"
      />

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          title="You are all caught up!"
          description="There are no notifications in this category. You'll receive real-time updates as casting teams review your submissions."
          iconName="Bell"
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredNotifications.map((notif) => (
            <NotificationItem key={notif.id} notification={notif} />
          ))}
        </div>
      )}
    </div>
  );
}
