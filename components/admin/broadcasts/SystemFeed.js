"use client";

import React, { useState, useMemo } from "react";
import styles from "./broadcasts.module.css";
import {
  Bell,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Video,
  AlertTriangle,
  CreditCard,
  Check,
} from "lucide-react";

export default function SystemFeed({
  notifications = [],
  onMarkRead,
  onMarkAllRead,
}) {
  const [feedFilter, setFeedFilter] = useState("ALL");

  const vismayaNotifications = useMemo(() => {
    return notifications.filter(
      (n) => n.toRole === "vismaya" || (!n.toRole && !n.toUserId)
    );
  }, [notifications]);

  const filteredFeed = useMemo(() => {
    return vismayaNotifications.filter((n) => {
      if (feedFilter === "UNREAD") return !n.read;
      if (feedFilter === "Approvals") return n.category === "Approvals" || n.type === "review";
      if (feedFilter === "Media") return n.category === "Media" || n.type === "media";
      if (feedFilter === "Auditions") return n.category === "Auditions" || n.type === "audition";
      if (feedFilter === "Cancellations") return n.category === "Cancellations" || n.type === "cancellation";
      if (feedFilter === "Payments") return n.category === "Payments" || n.type === "payment";
      return true;
    });
  }, [vismayaNotifications, feedFilter]);

  const getSystemFeedIcon = (type, categoryName) => {
    if (categoryName === "Approvals" || type === "review") {
      return <FileText size={18} style={{ color: "var(--gold, #ffbc00)" }} />;
    }
    if (categoryName === "Media" || type === "media") {
      return <ImageIcon size={18} style={{ color: "var(--gold2, #ffd54a)" }} />;
    }
    if (categoryName === "Auditions" || type === "audition") {
      return <Video size={18} style={{ color: "var(--blue, #8ab4ff)" }} />;
    }
    if (categoryName === "Cancellations" || type === "cancellation") {
      return <AlertTriangle size={18} style={{ color: "var(--red, #ff6b6b)" }} />;
    }
    if (categoryName === "Payments" || type === "payment") {
      return <CreditCard size={18} style={{ color: "var(--ok, #34d399)" }} />;
    }
    return <Bell size={18} style={{ color: "var(--gold, #ffbc00)" }} />;
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "Just now";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filterOptions = [
    { key: "ALL", label: "All Alerts" },
    { key: "UNREAD", label: "Unread" },
    { key: "Approvals", label: "Approvals" },
    { key: "Media", label: "Media" },
    { key: "Auditions", label: "Auditions" },
    { key: "Cancellations", label: "Cancellations" },
    { key: "Payments", label: "Payments" },
  ];

  return (
    <div className={styles.card}>
      {/* Header */}
      <div
        className={styles.ch}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h2>System Alert Feed</h2>
          <p>Real-time audit log and automated administrative notifications.</p>
        </div>
        <button
          type="button"
          className={styles.btn}
          onClick={onMarkAllRead}
          style={{ gap: "6px" }}
        >
          <CheckCircle2 size={14} />
          <span>Mark all as read</span>
        </button>
      </div>

      {/* Filter Tabs / Chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
        {filterOptions.map((f) => {
          const isSelected = feedFilter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              className={`${styles.btn} ${isSelected ? styles.pr : ""}`}
              style={{
                height: "32px",
                fontSize: "12px",
                borderRadius: "8px",
                backgroundColor: isSelected ? undefined : "rgba(255, 255, 255, 0.04)",
              }}
              onClick={() => setFeedFilter(f.key)}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Feed List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filteredFeed.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--mu, #a3acc2)" }}>
            No system notifications matching this filter.
          </div>
        ) : (
          filteredFeed.map((n) => {
            return (
              <div
                key={n.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  backgroundColor: n.read ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${n.read ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 188, 0, 0.25)"}`,
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {getSystemFeedIcon(n.type, n.category)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: "600", fontSize: "14px", color: "var(--tx, #eceaf5)" }}>
                        {n.title || n.message}
                      </span>
                      {n.category && (
                        <span className={styles.chip} style={{ height: "20px", fontSize: "11px", "--c": "var(--gold, #ffbc00)" }}>
                          {n.category}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--mu, #a3acc2)", whiteSpace: "nowrap" }}>
                      {formatDate(n.createdAt || n.timestamp)}
                    </span>
                  </div>

                  {n.title && n.message && n.title !== n.message && (
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--mu, #a3acc2)", lineHeight: "1.4" }}>
                      {n.message}
                    </p>
                  )}
                </div>

                {!n.read && (
                  <button
                    type="button"
                    className={styles.btn}
                    style={{ height: "28px", padding: "0 10px", fontSize: "11px" }}
                    onClick={() => onMarkRead(n.id)}
                    title="Mark as read"
                  >
                    <Check size={12} style={{ marginRight: "4px" }} />
                    Read
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
