"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  AlertCircle,
  Clock,
  Loader2,
  Calendar,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { adminService } from "@/lib/api/services/adminService";
import { isRealMode } from "@/lib/api/config";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const loadData = async () => {
    if (isRealMode("admin")) {
      try {
        setLoading(true);
        const res = await adminService.getAuditLogs();
        if (res?.data) {
          setLogs(res.data);
        }
      } catch (err) {
        console.error("Error loading audit logs:", err);
      } finally {
        setLoading(false);
      }
    } else {
      setLogs([
        {
          _id: "log-1",
          id: "log-1",
          adminEmail: "admin@vismaya.com",
          action: "approve_verification",
          entityType: "verification",
          entityId: "ver-102",
          details: { reason: "Document proof matched legal identity" },
          ipAddress: "192.168.1.1",
          createdAt: new Date().toISOString(),
        },
        {
          _id: "log-2",
          id: "log-2",
          adminEmail: "admin@vismaya.com",
          action: "adjust_credits",
          entityType: "organization",
          entityId: "org-zee",
          details: { delta: 10, reason: "Enterprise subscription top-up" },
          ipAddress: "192.168.1.1",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          _id: "log-3",
          id: "log-3",
          adminEmail: "admin@vismaya.com",
          action: "reject_media",
          entityType: "media",
          entityId: "med-55",
          details: { reason: "Spec §15 violation: sunglasses obscuring face" },
          ipAddress: "192.168.1.1",
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== "all" && log.action !== actionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const action = (log.action || "").toLowerCase();
      const admin = (log.adminEmail || "").toLowerCase();
      const entity = (log.entityType || "").toLowerCase();
      return action.includes(q) || admin.includes(q) || entity.includes(q);
    }
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Page Header */}
      <PageHeader
        title="Admin Audit Trail"
        subtitle="Immutable read-only log of critical administrator actions: approvals, rejections, credit adjustments, and policy enforcement per Spec §44."
        badge={`${logs.length} Total Events`}
      />

      {/* Filter and Search Bar */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E8E2D4",
          borderRadius: "14px",
          padding: "14px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "240px" }}>
          <Search size={16} style={{ color: "#8A6B2E" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by action, admin email or entity..."
            style={{ width: "100%", border: "none", outline: "none", fontSize: "13px", color: "#2B2D2A" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "#5A584F", fontWeight: 600 }}>Action Filter:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{ height: "34px", borderRadius: "8px", border: "1px solid #E8E2D4", padding: "0 8px", fontSize: "12px", background: "#FAF9F7" }}
          >
            <option value="all">All Actions</option>
            <option value="approve_verification">Approve Verification</option>
            <option value="reject_verification">Reject Verification</option>
            <option value="adjust_credits">Adjust Credits</option>
            <option value="approve_opportunity">Approve Opportunity</option>
            <option value="reject_media">Reject Media</option>
            <option value="suspend_user">Suspend User</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <Loader2 size={32} style={{ color: "#8A6B2E", animation: "spin 1s linear infinite" }} />
        </div>
      ) : filteredLogs.length > 0 ? (
        <div style={{ background: "#FFFFFF", border: "1px solid #E8E2D4", borderRadius: "14px", overflowX: "auto", WebkitOverflowScrolling: "touch", width: "100%" }}>
          <table style={{ width: "100%", minWidth: "760px", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#FAF9F7", borderBottom: "1px solid #E8E2D4", color: "#5A584F", fontSize: "11.5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Timestamp</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Admin</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Action</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Entity</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Details &amp; Reason</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log._id || log.id} style={{ borderBottom: "1px solid #F0EEEA" }}>
                  <td style={{ padding: "14px 18px", color: "#5A584F", whiteSpace: "nowrap" }}>
                    {new Date(log.createdAt || Date.now()).toLocaleString("en-IN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td style={{ padding: "14px 18px", fontWeight: 600, color: "#2B2D2A" }}>
                    {log.adminEmail || "Super Admin"}
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: log.action.includes("reject") || log.action.includes("suspend") ? "#D9534F" : "#2B5E3B",
                        background: log.action.includes("reject") || log.action.includes("suspend") ? "#FDEDEC" : "#EBF5ED",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        whiteSpace: "nowrap",
                        display: "inline-block",
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: "14px 18px", color: "#5A584F" }}>
                    {log.entityType}: <code style={{ fontSize: "11px", color: "#8A6B2E" }}>{log.entityId}</code>
                  </td>
                  <td style={{ padding: "14px 18px", color: "#4A483F" }}>
                    {typeof log.details === "object" ? JSON.stringify(log.details) : String(log.details || "—")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={History}
          title="No Audit Logs Found"
          description="No administrative events matched the specified filter criteria."
        />
      )}
    </div>
  );
}
