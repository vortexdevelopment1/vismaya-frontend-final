"use client";

import React, { useState } from "react";
import styles from "./broadcasts.module.css";
import { Eye, Copy, XCircle } from "lucide-react";

export default function RecentBroadcasts({
  broadcasts = [],
  onViewAllHistory,
  onDuplicate,
  onCancelScheduled,
  onViewDetails,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);

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

  const getStatusColor = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "sent" || s === "delivered") return "var(--ok, #34d399)";
    if (s === "scheduled") return "var(--gold, #ffbc00)";
    return "var(--mu, #a3acc2)";
  };

  // Recent 5 broadcasts
  const recentList = broadcasts.slice(0, 5);

  return (
    <div className={`${styles.card} ${styles.rec}`}>
      {/* Header */}
      <div
        className={styles.ch}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2>Recent broadcasts</h2>
          <p>Last 5 messages sent or scheduled.</p>
        </div>
        <button
          type="button"
          className={styles.btn}
          onClick={onViewAllHistory}
          style={{ textDecoration: "none" }}
        >
          View all history
        </button>
      </div>

      {/* Table / List Header */}
      <div className={styles.vh}>
        <span>Date</span>
        <span>Message</span>
        <span>Audience</span>
        <span>Reach</span>
        <span>Status</span>
        <span></span>
      </div>

      {/* Rows */}
      {recentList.length === 0 ? (
        <div style={{ padding: "32px 0", textAlign: "center", color: "var(--mu, #a3acc2)" }}>
          No broadcasts dispatched yet. Create and dispatch your first broadcast above.
        </div>
      ) : (
        recentList.map((bc) => {
          const isMenuOpen = openMenuId === bc.id;
          const displayDate = formatDate(bc.sentAt || bc.scheduledFor || bc.createdAt);
          const reachCount = bc.deliveredCount || bc.estimatedRecipients || (bc.audience === "All users" ? 1298 : bc.audience === "All talent" ? 1284 : 14);

          return (
            <div key={bc.id} className={styles.rr}>
              <span className={styles.d}>{displayDate}</span>
              <div className={styles.ms}>
                <b>{bc.title || bc.category || "Vismaya Network Broadcast"}</b>
                <span>{bc.message || "No content"}</span>
              </div>
              <span className={styles.a}>
                <span className={styles.chip} style={{ "--c": "var(--blue, #8ab4ff)" }}>
                  {bc.audience || "All users"}
                </span>
              </span>
              <span className={styles.n}>{Number(reachCount).toLocaleString()}</span>
              <span>
                <span className={styles.chip} style={{ "--c": getStatusColor(bc.status) }}>
                  {bc.status === "scheduled" ? "Scheduled" : bc.status === "draft" ? "Draft" : "Sent"}
                </span>
              </span>
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.mo}`}
                  aria-label="More actions"
                  onClick={() => setOpenMenuId(isMenuOpen ? null : bc.id)}
                >
                  ⋯
                </button>

                {isMenuOpen && (
                  <div className={styles.actionMenu}>
                    <button
                      type="button"
                      className={styles.actionMenuItem}
                      onClick={() => {
                        setOpenMenuId(null);
                        onViewDetails?.(bc);
                      }}
                    >
                      <Eye size={14} />
                      <span>View details</span>
                    </button>
                    <button
                      type="button"
                      className={styles.actionMenuItem}
                      onClick={() => {
                        setOpenMenuId(null);
                        onDuplicate?.(bc);
                      }}
                    >
                      <Copy size={14} />
                      <span>Duplicate</span>
                    </button>
                    {bc.status === "scheduled" && (
                      <button
                        type="button"
                        className={`${styles.actionMenuItem} ${styles.danger}`}
                        onClick={() => {
                          setOpenMenuId(null);
                          onCancelScheduled?.(bc.id);
                        }}
                      >
                        <XCircle size={14} />
                        <span>Cancel scheduled</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
