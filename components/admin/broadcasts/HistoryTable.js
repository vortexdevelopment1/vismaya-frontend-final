"use client";

import React, { useState, useMemo } from "react";
import styles from "./broadcasts.module.css";
import { Search, Eye, Copy, XCircle } from "lucide-react";

export default function HistoryTable({
  broadcasts = [],
  onDuplicate,
  onCancelScheduled,
  onViewDetails,
}) {
  const [search, setSearch] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("newest");
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const pageSize = 10;

  const formatDate = (isoStr) => {
    if (!isoStr) return "—";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
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

  const filteredHistory = useMemo(() => {
    let list = [...broadcasts];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          (b.title || "").toLowerCase().includes(q) ||
          (b.message || "").toLowerCase().includes(q) ||
          (b.audience || "").toLowerCase().includes(q)
      );
    }

    if (audienceFilter !== "ALL") {
      list = list.filter((b) => (b.audience || "").toLowerCase().includes(audienceFilter.toLowerCase()));
    }

    if (categoryFilter !== "ALL") {
      list = list.filter((b) => b.category === categoryFilter);
    }

    if (statusFilter !== "ALL") {
      list = list.filter((b) => (b.status || "").toLowerCase() === statusFilter.toLowerCase());
    }

    list.sort((a, b) => {
      const timeA = new Date(a.sentAt || a.scheduledFor || a.createdAt || 0).getTime();
      const timeB = new Date(b.sentAt || b.scheduledFor || b.createdAt || 0).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [broadcasts, search, audienceFilter, categoryFilter, statusFilter, sortOrder]);

  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredHistory.slice(start, start + pageSize);
  }, [filteredHistory, page]);

  const totalPages = Math.ceil(filteredHistory.length / pageSize) || 1;

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.ch}>
        <h2>Broadcast History Log</h2>
        <p>Complete historical archive of platform communications, delivery metrics, and logs.</p>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative" }}>
          <input
            type="text"
            className={styles.in}
            placeholder="Search broadcasts..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Audience filter */}
        <select
          className={styles.sel}
          value={audienceFilter}
          onChange={(e) => {
            setAudienceFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="ALL">All Audiences</option>
          <option value="All users">All Users</option>
          <option value="talent">Talent</option>
          <option value="organization">Organizations</option>
        </select>

        {/* Category filter */}
        <select
          className={styles.sel}
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="ALL">All Categories</option>
          <option value="Platform announcement">Platform announcement</option>
          <option value="New opportunities">New opportunities</option>
          <option value="Policy update">Policy update</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Urgent update">Urgent update</option>
        </select>

        {/* Status filter */}
        <select
          className={styles.sel}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="ALL">All Statuses</option>
          <option value="sent">Sent</option>
          <option value="scheduled">Scheduled</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Table Headers */}
      <div className={styles.vh}>
        <span>Date</span>
        <span>Message</span>
        <span>Audience</span>
        <span>Reach</span>
        <span>Status</span>
        <span></span>
      </div>

      {/* Rows */}
      {paginatedList.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--mu, #a3acc2)" }}>
          No broadcasts found matching the current search and filters.
        </div>
      ) : (
        paginatedList.map((bc) => {
          const isMenuOpen = openMenuId === bc.id;
          const displayDate = formatDate(bc.sentAt || bc.scheduledFor || bc.createdAt);
          const reachCount =
            bc.deliveredCount ||
            bc.estimatedRecipients ||
            (bc.audience === "All users" ? 1298 : bc.audience === "All talent" ? 1284 : 14);

          return (
            <div key={bc.id} className={styles.rr}>
              <span className={styles.d}>{displayDate}</span>
              <div className={styles.ms}>
                <b>{bc.title || bc.category || "Platform Announcement"}</b>
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

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: "1px solid var(--bd, rgba(255, 255, 255, 0.12))",
          }}
        >
          <span style={{ fontSize: "13px", color: "var(--mu, #a3acc2)" }}>
            Showing page {page} of {totalPages} ({filteredHistory.length} total)
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className={styles.btn}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ opacity: page <= 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <button
              type="button"
              className={styles.btn}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{ opacity: page >= totalPages ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
