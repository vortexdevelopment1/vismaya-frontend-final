"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Mail,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  Send,
  User,
  Phone,
  Calendar,
  X,
  Check,
  Copy,
  Inbox,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { adminService } from "@/lib/api/services/adminService";

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'pending' | 'reviewed' | 'resolved'
  const [selectedInquiry, setSelectedInquiry] = useState(null); // For Read Full Modal
  const [replyInquiry, setReplyInquiry] = useState(null); // For In-App Reply Modal
  const [replyMessage, setReplyMessage] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [replyMarkResolved, setReplyMarkResolved] = useState(true);
  const [replySending, setReplySending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await adminService.getContactInquiries({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: search.trim() || undefined,
      });
      if (res && Array.isArray(res.data)) {
        setInquiries(res.data);
      } else if (Array.isArray(res)) {
        setInquiries(res);
      }
    } catch (err) {
      console.error("Failed to fetch inquiries:", err);
      setFeedback({ type: "error", message: err?.message || "Failed to load inquiries from server" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInquiries();
  };

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Status changer (Resolve / Pending / Reviewed)
  const handleStatusUpdate = async (id, newStatus) => {
    setActionLoading(true);
    try {
      const res = await adminService.updateContactInquiryStatus(id, newStatus);
      // Verify success
      const isOk = res?.success || res?._id || res?.data?._id;
      if (isOk) {
        setInquiries((prev) =>
          prev.map((item) => (item._id === id ? { ...item, status: newStatus } : item))
        );
        if (selectedInquiry && selectedInquiry._id === id) {
          setSelectedInquiry((prev) => ({ ...prev, status: newStatus }));
        }
        showFeedback("success", `Inquiry status updated to "${newStatus}"`);
      } else {
        showFeedback("error", res?.message || "Failed to update inquiry status");
      }
    } catch (err) {
      console.error("Status update error:", err);
      showFeedback("error", err?.message || "Failed to update inquiry status");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete inquiry
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this contact message? This action cannot be undone.")) return;
    setActionLoading(true);
    try {
      const res = await adminService.deleteContactInquiry(id);
      const isOk = res?.success || !res?.error;
      if (isOk) {
        setInquiries((prev) => prev.filter((item) => item._id !== id));
        if (selectedInquiry?._id === id) setSelectedInquiry(null);
        if (replyInquiry?._id === id) setReplyInquiry(null);
        showFeedback("success", "Inquiry deleted successfully");
      } else {
        showFeedback("error", res?.message || "Failed to delete inquiry");
      }
    } catch (err) {
      console.error("Delete error:", err);
      showFeedback("error", err?.message || "Failed to delete inquiry");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Reply Modal
  const handleOpenReply = (item) => {
    setReplyInquiry(item);
    setReplySubject(`Re: ${item.subject || "Vismaya Inquiry"}`);
    setReplyMessage("");
    setReplyMarkResolved(true);
  };

  // Submit in-app Email Reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyInquiry || !replyMessage.trim()) return;

    setReplySending(true);
    try {
      const res = await adminService.replyToContactInquiry(replyInquiry._id, {
        replyMessage: replyMessage.trim(),
        replySubject: replySubject.trim(),
        markResolved: replyMarkResolved,
      });

      if (res?.success || res?.data) {
        const updatedStatus = replyMarkResolved ? "resolved" : "reviewed";
        setInquiries((prev) =>
          prev.map((item) => (item._id === replyInquiry._id ? { ...item, status: updatedStatus } : item))
        );
        showFeedback("success", `Email response successfully sent to ${replyInquiry.email}!`);
        setReplyInquiry(null);
      } else {
        showFeedback("error", res?.message || "Failed to send email reply");
      }
    } catch (err) {
      console.error("Send reply error:", err);
      showFeedback("error", err?.message || "Failed to send email reply. Check Brevo service credentials.");
    } finally {
      setReplySending(false);
    }
  };

  // Copy email to clipboard
  const handleCopyEmail = (email, id) => {
    if (!email) return;
    navigator.clipboard?.writeText(email);
    setCopiedId(id);
    showFeedback("success", `Copied "${email}" to clipboard`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Metrics summary
  const totalCount = inquiries.length;
  const pendingCount = useMemo(() => inquiries.filter((i) => i.status === "pending").length, [inquiries]);
  const reviewedCount = useMemo(() => inquiries.filter((i) => i.status === "reviewed").length, [inquiries]);
  const resolvedCount = useMemo(() => inquiries.filter((i) => i.status === "resolved").length, [inquiries]);

  // Client filtered list
  const filteredList = useMemo(() => {
    return inquiries.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return (
        item.name?.toLowerCase().includes(s) ||
        item.email?.toLowerCase().includes(s) ||
        item.subject?.toLowerCase().includes(s) ||
        item.message?.toLowerCase().includes(s)
      );
    });
  }, [inquiries, statusFilter, search]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span
            style={{
              fontSize: "11px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              padding: "4px 10px",
              borderRadius: "999px",
              backgroundColor: "rgba(138, 107, 46, 0.12)",
              color: "#8A6B2E",
              border: "1px solid rgba(138, 107, 46, 0.25)",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <Clock size={12} /> Pending
          </span>
        );
      case "reviewed":
        return (
          <span
            style={{
              fontSize: "11px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              padding: "4px 10px",
              borderRadius: "999px",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              color: "#1D4ED8",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <MessageSquare size={12} /> Reviewed
          </span>
        );
      case "resolved":
        return (
          <span
            style={{
              fontSize: "11px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              padding: "4px 10px",
              borderRadius: "999px",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              color: "#065F46",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <CheckCircle2 size={12} /> Resolved
          </span>
        );
      default:
        return (
          <span
            style={{
              fontSize: "11px",
              fontWeight: "600",
              padding: "4px 10px",
              borderRadius: "999px",
              backgroundColor: "#F3EFE6",
              color: "#5A584F",
            }}
          >
            {status}
          </span>
        );
    }
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 20px 60px" }}>
      {/* 1. Header */}
      <PageHeader
        title="Contact Inquiries &amp; Helpdesk"
        subtitle="Manage, review, and reply to inquiries submitted via the Vismaya Contact page. All submissions are also alerted to vortexcubesdevelopment@gmail.com."
        actions={
          <button
            onClick={fetchInquiries}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 16px",
              borderRadius: "10px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E2D4",
              fontSize: "13px",
              fontWeight: "600",
              color: "#2B2D2A",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 1px 3px rgba(43, 45, 42, 0.04)",
            }}
          >
            <RefreshCw size={15} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        }
      />

      {feedback && (
        <div
          style={{
            margin: "16px 0",
            padding: "12px 18px",
            borderRadius: "10px",
            backgroundColor: feedback.type === "success" ? "#ECFDF5" : "#FEF2F2",
            border: `1px solid ${feedback.type === "success" ? "#A7F3D0" : "#FECACA"}`,
            color: feedback.type === "success" ? "#065F46" : "#991B1B",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {feedback.type === "success" ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 2. Top Stats Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          margin: "24px 0",
        }}
      >
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            borderRadius: "14px",
            padding: "20px",
            boxShadow: "0 2px 6px rgba(43, 45, 42, 0.03)",
          }}
        >
          <div style={{ fontSize: "12px", color: "#77756B", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Total Inquiries
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#2B2D2A", marginTop: "6px" }}>
            {totalCount}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            borderLeft: "4px solid #8A6B2E",
            borderRadius: "14px",
            padding: "20px",
            boxShadow: "0 2px 6px rgba(43, 45, 42, 0.03)",
          }}
        >
          <div style={{ fontSize: "12px", color: "#8A6B2E", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Pending Action
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#8A6B2E", marginTop: "6px" }}>
            {pendingCount}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            borderRadius: "14px",
            padding: "20px",
            boxShadow: "0 2px 6px rgba(43, 45, 42, 0.03)",
          }}
        >
          <div style={{ fontSize: "12px", color: "#77756B", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Reviewed / In Progress
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#2B2D2A", marginTop: "6px" }}>
            {reviewedCount}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            borderRadius: "14px",
            padding: "20px",
            boxShadow: "0 2px 6px rgba(43, 45, 42, 0.03)",
          }}
        >
          <div style={{ fontSize: "12px", color: "#77756B", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Resolved
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#065F46", marginTop: "6px" }}>
            {resolvedCount}
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Search */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E2D4",
          borderRadius: "14px",
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
        }}
      >
        {/* Status Tabs */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {[
            { key: "all", label: `All (${totalCount})` },
            { key: "pending", label: `Pending (${pendingCount})` },
            { key: "reviewed", label: `Reviewed (${reviewedCount})` },
            { key: "resolved", label: `Resolved (${resolvedCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              style={{
                padding: "8px 16px",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: statusFilter === tab.key ? "700" : "500",
                backgroundColor: statusFilter === tab.key ? "#8A6B2E" : "#FAF9F7",
                color: statusFilter === tab.key ? "#FFFFFF" : "#5A584F",
                border: `1px solid ${statusFilter === tab.key ? "#8A6B2E" : "#E8E2D4"}`,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 300px", maxWidth: "420px" }}>
          <div style={{ position: "relative", width: "100%" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#77756B" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sender, email, subject, keyword..."
              style={{
                width: "100%",
                height: "38px",
                paddingLeft: "36px",
                paddingRight: "14px",
                borderRadius: "10px",
                border: "1px solid #E8E2D4",
                backgroundColor: "#FAF9F7",
                fontSize: "13.5px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: "0 16px",
              height: "38px",
              borderRadius: "10px",
              backgroundColor: "#2B2D2A",
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Search
          </button>
        </form>
      </div>

      {/* 4. Table / Inquiries List */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E2D4",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(43, 45, 42, 0.04)",
        }}
      >
        {loading ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#77756B" }}>
            <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
            <div>Loading inquiries from server...</div>
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#5A584F" }}>
            <Mail size={36} style={{ color: "#D1C9B8", margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#2B2D2A", margin: "0 0 6px" }}>
              No inquiries found
            </h3>
            <p style={{ fontSize: "13.5px", margin: 0, color: "#77756B" }}>
              {statusFilter !== "all"
                ? `No inquiries currently marked as "${statusFilter}".`
                : "No contact submissions received yet. When users submit the Contact form, their inquiries will appear here."}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto", width: "100%" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ backgroundColor: "#FAF9F7", borderBottom: "1px solid #E8E2D4", color: "#77756B", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.07em" }}>
                  <th style={{ padding: "14px 20px", fontWeight: "700" }}>Sender</th>
                  <th style={{ padding: "14px 16px", fontWeight: "700" }}>Subject &amp; Message</th>
                  <th style={{ padding: "14px 16px", fontWeight: "700" }}>Received At</th>
                  <th style={{ padding: "14px 16px", fontWeight: "700" }}>Status</th>
                  <th style={{ padding: "14px 20px", fontWeight: "700", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item) => {
                  const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }) : "Recently";

                  return (
                    <tr
                      key={item._id}
                      style={{
                        borderBottom: "1px solid #E8E2D4",
                        backgroundColor: item.status === "pending" ? "#FFFDF9" : "#FFFFFF",
                        transition: "background-color 0.12s ease",
                      }}
                    >
                      {/* Sender */}
                      <td style={{ padding: "16px 20px", verticalAlign: "top" }}>
                        <div style={{ fontWeight: "600", color: "#2B2D2A", fontSize: "14px" }}>
                          {item.name}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                          <span style={{ color: "#8A6B2E", fontSize: "12.5px", fontWeight: "500" }}>
                            {item.email}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyEmail(item.email, item._id)}
                            title="Copy Email Address"
                            style={{
                              background: "none",
                              border: "none",
                              padding: "2px",
                              cursor: "pointer",
                              color: copiedId === item._id ? "#065F46" : "#77756B",
                            }}
                          >
                            {copiedId === item._id ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                        {item.mobile && (
                          <div style={{ color: "#77756B", fontSize: "12px", marginTop: "2px" }}>
                            📞 {item.mobile}
                          </div>
                        )}
                      </td>

                      {/* Subject & Message snippet */}
                      <td style={{ padding: "16px 16px", verticalAlign: "top", maxWidth: "460px" }}>
                        <div style={{ fontWeight: "600", color: "#2B2D2A", marginBottom: "4px" }}>
                          {item.subject || "General Inquiry"}
                        </div>
                        <div
                          style={{
                            color: "#5A584F",
                            fontSize: "13px",
                            lineHeight: "1.45",
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {item.message}
                        </div>
                      </td>

                      {/* Date */}
                      <td style={{ padding: "16px 16px", verticalAlign: "top", color: "#77756B", fontSize: "12.5px", whiteSpace: "nowrap" }}>
                        {dateStr}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "16px 16px", verticalAlign: "top", whiteSpace: "nowrap" }}>
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "16px 20px", verticalAlign: "top", textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          {/* 1. Read Full Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedInquiry(item)}
                            title="Read full message details"
                            style={{
                              padding: "6px 12px",
                              borderRadius: "8px",
                              backgroundColor: "#FAF9F7",
                              border: "1px solid #E8E2D4",
                              fontSize: "12.5px",
                              fontWeight: "600",
                              color: "#2B2D2A",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            Read Full
                          </button>

                          {/* 2. Direct Reply Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenReply(item)}
                            title="Reply to sender via Email"
                            style={{
                              padding: "6px 12px",
                              borderRadius: "8px",
                              backgroundColor: "#8A6B2E",
                              color: "#FFFFFF",
                              fontSize: "12.5px",
                              fontWeight: "600",
                              border: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              cursor: "pointer",
                              boxShadow: "0 1px 2px rgba(138, 107, 46, 0.2)",
                            }}
                          >
                            <Send size={12} /> Reply
                          </button>

                          {/* 3. Status Action: Resolve / Re-open */}
                          {item.status === "pending" || item.status === "reviewed" ? (
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(item._id, "resolved")}
                              disabled={actionLoading}
                              title="Mark this inquiry as Resolved"
                              style={{
                                padding: "6px 10px",
                                borderRadius: "8px",
                                backgroundColor: "#ECFDF5",
                                border: "1px solid #A7F3D0",
                                color: "#065F46",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: actionLoading ? "not-allowed" : "pointer",
                              }}
                            >
                              Resolve
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(item._id, "pending")}
                              disabled={actionLoading}
                              title="Re-open inquiry as Pending"
                              style={{
                                padding: "6px 10px",
                                borderRadius: "8px",
                                backgroundColor: "#F3EFE6",
                                border: "1px solid #E8E2D4",
                                color: "#8A6B2E",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: actionLoading ? "not-allowed" : "pointer",
                              }}
                            >
                              Re-open
                            </button>
                          )}

                          {/* 4. Delete Action */}
                          <button
                            type="button"
                            onClick={() => handleDelete(item._id)}
                            disabled={actionLoading}
                            title="Delete this message"
                            style={{
                              padding: "6px 8px",
                              borderRadius: "8px",
                              backgroundColor: "transparent",
                              border: "none",
                              color: "#DC2626",
                              cursor: actionLoading ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Read Full Details Modal */}
      {selectedInquiry && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
          }}
          onClick={() => setSelectedInquiry(null)}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              maxWidth: "640px",
              width: "100%",
              padding: "28px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
              border: "1px solid #E8E2D4",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "18px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600", color: "#2B2D2A", fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif" }}>
                    Inquiry Details
                  </h2>
                  {getStatusBadge(selectedInquiry.status)}
                </div>
                <div style={{ fontSize: "12.5px", color: "#77756B", marginTop: "4px" }}>
                  Received on {selectedInquiry.createdAt ? new Date(selectedInquiry.createdAt).toLocaleString("en-IN") : "Recently"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#77756B",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Info Table */}
            <div style={{ backgroundColor: "#FAF9F7", border: "1px solid #E8E2D4", borderRadius: "10px", padding: "16px", marginBottom: "20px", fontSize: "13.5px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: "10px", marginBottom: "8px" }}>
                <span style={{ color: "#77756B", fontWeight: "600" }}>Sender Name:</span>
                <span style={{ fontWeight: "600", color: "#2B2D2A" }}>{selectedInquiry.name}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: "10px", marginBottom: "8px" }}>
                <span style={{ color: "#77756B", fontWeight: "600" }}>Email Address:</span>
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#8A6B2E", fontWeight: "600" }}>{selectedInquiry.email}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyEmail(selectedInquiry.email, selectedInquiry._id)}
                    title="Copy Email"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#77756B" }}
                  >
                    <Copy size={13} />
                  </button>
                </span>
              </div>
              {selectedInquiry.mobile && (
                <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ color: "#77756B", fontWeight: "600" }}>Mobile:</span>
                  <span style={{ color: "#2B2D2A" }}>{selectedInquiry.mobile}</span>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: "10px" }}>
                <span style={{ color: "#77756B", fontWeight: "600" }}>Subject:</span>
                <span style={{ fontWeight: "600", color: "#2B2D2A" }}>{selectedInquiry.subject || "General Inquiry"}</span>
              </div>
            </div>

            {/* Message Body */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#8A6B2E", marginBottom: "8px" }}>
                Message:
              </div>
              <div
                style={{
                  padding: "18px",
                  borderRadius: "10px",
                  backgroundColor: "#FAF9F7",
                  border: "1px solid #E8E2D4",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  color: "#2B2D2A",
                  whiteSpace: "pre-wrap",
                }}
              >
                {selectedInquiry.message}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", borderTop: "1px solid #E8E2D4", paddingTop: "18px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                {selectedInquiry.status !== "resolved" ? (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(selectedInquiry._id, "resolved")}
                    disabled={actionLoading}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "10px",
                      backgroundColor: "#065F46",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      fontWeight: "600",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Check size={14} /> Mark as Resolved
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(selectedInquiry._id, "pending")}
                    disabled={actionLoading}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "10px",
                      backgroundColor: "#F3EFE6",
                      color: "#8A6B2E",
                      fontSize: "13px",
                      fontWeight: "600",
                      border: "1px solid #E8E2D4",
                      cursor: "pointer",
                    }}
                  >
                    Re-open Inquiry
                  </button>
                )}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedInquiry;
                    setSelectedInquiry(null);
                    handleOpenReply(target);
                  }}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "10px",
                    backgroundColor: "#8A6B2E",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: "600",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                  }}
                >
                  <Send size={14} /> Reply to {selectedInquiry.name}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. In-App Direct Email Reply Modal */}
      {replyInquiry && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.55)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
          }}
          onClick={() => !replySending && setReplyInquiry(null)}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              maxWidth: "600px",
              width: "100%",
              padding: "28px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
              border: "1px solid #E8E2D4",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    backgroundColor: "#F3EFE6",
                    border: "1px solid #E8E2D4",
                    color: "#8A6B2E",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Send size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "#2B2D2A", fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif" }}>
                    Reply to {replyInquiry.name}
                  </h3>
                  <div style={{ fontSize: "12px", color: "#77756B" }}>
                    Recipient: <strong>{replyInquiry.email}</strong>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !replySending && setReplyInquiry(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#77756B" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Original message snippet */}
            <div
              style={{
                backgroundColor: "#FAF9F7",
                border: "1px solid #E8E2D4",
                borderRadius: "10px",
                padding: "12px 16px",
                fontSize: "13px",
                color: "#5A584F",
                marginBottom: "18px",
                lineHeight: "1.45",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#8A6B2E", marginBottom: "4px" }}>
                User Inquiry:
              </div>
              "{replyInquiry.message}"
            </div>

            <form onSubmit={handleSendReply} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#2B2D2A", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 12px",
                    borderRadius: "10px",
                    border: "1px solid #E8E2D4",
                    backgroundColor: "#FAF9F7",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#2B2D2A", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Your Response Message *
                </label>
                <textarea
                  rows={6}
                  required
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder={`Hi ${replyInquiry.name},\n\nThank you for reaching out to Vismaya Creative Studios...`}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #E8E2D4",
                    backgroundColor: "#FAF9F7",
                    fontSize: "14px",
                    lineHeight: "1.55",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  id="markResolvedCheck"
                  checked={replyMarkResolved}
                  onChange={(e) => setReplyMarkResolved(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "#8A6B2E", cursor: "pointer" }}
                />
                <label htmlFor="markResolvedCheck" style={{ fontSize: "13px", color: "#2B2D2A", cursor: "pointer", fontWeight: "500" }}>
                  Mark this inquiry as <strong>Resolved</strong> once the email is sent
                </label>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "14px", borderTop: "1px solid #E8E2D4" }}>
                {/* Secondary: open in desktop mail app */}
                <a
                  href={`mailto:${replyInquiry.email}?subject=${encodeURIComponent(replySubject)}&body=${encodeURIComponent(replyMessage || `Dear ${replyInquiry.name},\n\n`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "12.5px",
                    color: "#8A6B2E",
                    textDecoration: "none",
                    fontWeight: "600",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <ExternalLink size={13} /> Or open in default email client
                </a>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setReplyInquiry(null)}
                    disabled={replySending}
                    style={{
                      padding: "9px 16px",
                      borderRadius: "10px",
                      backgroundColor: "#FAF9F7",
                      border: "1px solid #E8E2D4",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#5A584F",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={replySending || !replyMessage.trim()}
                    style={{
                      padding: "9px 20px",
                      borderRadius: "10px",
                      backgroundColor: "#8A6B2E",
                      color: "#FFFFFF",
                      fontSize: "13.5px",
                      fontWeight: "600",
                      border: "none",
                      cursor: replySending || !replyMessage.trim() ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 1px 3px rgba(138, 107, 46, 0.25)",
                    }}
                  >
                    {replySending ? (
                      <>
                        <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Sending...
                      </>
                    ) : (
                      <>
                        <Send size={14} /> Send Email Reply
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
