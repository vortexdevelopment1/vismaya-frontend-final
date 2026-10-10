"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Megaphone,
  FileText,
  DollarSign,
  Radio,
  Send,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  MessageSquare,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { useAdmin } from "@/lib/admin/AdminContext";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import {
  initialAnalyticsData,
} from "@/lib/admin/mockData";
import {
  UserGrowthLineChart,
  ApplicationsBarChart,
  CategoryDonutChart,
  FunnelStages,
  TopCitiesProgress,
} from "@/components/admin/AnalyticsCharts";

export default function AdminAnalyticsPage() {
  const { broadcasts, sendBroadcast } = useAdmin();

  const [timeRange, setTimeRange] = useState("30d"); // "7d" | "30d" | "90d" | "1y"

  // Broadcast Form State
  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    audience: "Verified Talent (Mumbai)",
    channel: "In-app Notification",
    priority: "Normal",
    message: "",
  });

  const currentData = initialAnalyticsData[timeRange] || initialAnalyticsData["30d"];

  const handleBroadcastSubmit = (e) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      alert("Please enter a broadcast title and message body.");
      return;
    }

    sendBroadcast(broadcastForm);
    setBroadcastForm({
      title: "",
      audience: "Verified Talent (Mumbai)",
      channel: "In-app Notification",
      priority: "Normal",
      message: "",
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Page Header */}
      <PageHeader
        title="Platform Analytics & Intelligence"
        subtitle="Live casting velocity metrics, talent demographic distributions, application conversion funnels, and broadcast messaging center."
        badge="Platform Intelligence"
        action={
          /* Date Range Selector */
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: "12px",
              padding: "4px",
              gap: "4px",
              maxWidth: "100%",
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {[
              { key: "7d", label: "7 Days" },
              { key: "30d", label: "30 Days" },
              { key: "90d", label: "90 Days" },
              { key: "1y", label: "This Year" },
            ].map((range) => {
              const isActive = timeRange === range.key;
              return (
                <button
                  key={range.key}
                  onClick={() => setTimeRange(range.key)}
                  style={{
                    padding: "6px clamp(8px, 2vw, 14px)",
                    borderRadius: "8px",
                    backgroundColor: isActive ? "var(--gold)" : "transparent",
                    color: isActive ? "#1a1300" : "#a3acc2",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {range.label}
                </button>
              );
            })}
          </div>
        }
      />

      {/* Top Row KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
          gap: "16px",
        }}
      >
        <StatCard
          title="Active Platform Users"
          value={currentData.kpis.activeUsers.value}
          change={currentData.kpis.activeUsers.change}
          isPositive={currentData.kpis.activeUsers.isPositive}
          description="Verified artists & recruiters"
          icon={Users}
        />
        <StatCard
          title="Live Casting Calls"
          value={currentData.kpis.liveCalls.value}
          change={currentData.kpis.liveCalls.change}
          isPositive={currentData.kpis.liveCalls.isPositive}
          description="Active public opportunities"
          icon={Megaphone}
        />
        <StatCard
          title="Applications Processed"
          value={currentData.kpis.applications.value}
          change={currentData.kpis.applications.change}
          isPositive={currentData.kpis.applications.isPositive}
          description="Total talent audition submissions"
          icon={FileText}
        />
        <StatCard
          title="Logged Gross Volume"
          value={currentData.kpis.revenue.value}
          change={currentData.kpis.revenue.change}
          isPositive={currentData.kpis.revenue.isPositive}
          description="Total production accounting"
          icon={DollarSign}
        />
      </div>

      {/* Row 1 Charts: User Growth Line Chart (2fr) + Category Breakdown (1fr) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: "20px",
        }}
      >
        {/* User Growth Line Chart */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.07)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: "16px",
            padding: "24px",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "12px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#eceaf5", margin: 0 }}>
                User Growth Velocity
              </h3>
              <p style={{ fontSize: "13px", color: "#a3acc2", margin: "2px 0 0 0" }}>
                Talent profiles verified vs recruiter agency signups
              </p>
            </div>
            <span
              style={{
                fontSize: "11px",
                color: "var(--gold)",
                fontWeight: "700",
                backgroundColor: "rgba(255, 188, 0, 0.14)",
                padding: "2px 8px",
                borderRadius: "999px",
                border: "1px solid rgba(255, 188, 0, 0.30)",
              }}
            >
              {timeRange.toUpperCase()}
            </span>
          </div>

          <UserGrowthLineChart data={currentData.userGrowth} />
        </div>

        {/* Category Breakdown */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.07)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: "16px",
            padding: "24px",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "12px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#eceaf5", margin: 0 }}>
              Casting Calls by Category
            </h3>
            <p style={{ fontSize: "13px", color: "#a3acc2", margin: "2px 0 0 0" }}>
              Distribution across OTT, Films, Commercials & Music
            </p>
          </div>

          <CategoryDonutChart data={currentData.categories} />
        </div>
      </div>

      {/* Row 2 Charts: Applications Monthly Bar Chart (1fr) + Conversion Funnel (1fr) + Top Cities (1fr) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Application Volume Bar Chart */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.07)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: "16px",
            padding: "24px",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "12px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#eceaf5", margin: 0 }}>
              Audition Velocity
            </h3>
            <p style={{ fontSize: "13px", color: "#a3acc2", margin: "2px 0 0 0" }}>
              Monthly application submissions
            </p>
          </div>

          <ApplicationsBarChart data={currentData.applicationsMonthly} />
        </div>

        {/* Application Conversion Funnel */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.07)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: "16px",
            padding: "24px",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "12px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#eceaf5", margin: 0 }}>
              Conversion Funnel
            </h3>
            <p style={{ fontSize: "13px", color: "#a3acc2", margin: "2px 0 0 0" }}>
              Stage drop-off from Applied to Booked
            </p>
          </div>

          <FunnelStages data={currentData.funnel} />
        </div>

        {/* Top Talent Cities Leaderboard */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.07)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: "16px",
            padding: "24px",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "12px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#eceaf5", margin: 0 }}>
              Top Talent Geographic Hubs
            </h3>
            <p style={{ fontSize: "13px", color: "#a3acc2", margin: "2px 0 0 0" }}>
              Artist concentration across Indian cities
            </p>
          </div>

          <TopCitiesProgress data={currentData.topCities} />
        </div>
      </div>

      {/* Row 3: Broadcast Messaging Center */}
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.07)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          borderRadius: "16px",
          padding: "24px",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "14px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "rgba(255, 188, 0, 0.12)",
              color: "var(--gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255, 188, 0, 0.30)",
            }}
          >
            <Radio size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#eceaf5", margin: 0 }}>
              Admin Broadcast Messaging Center
            </h3>
            <p style={{ fontSize: "13px", color: "#a3acc2", margin: "2px 0 0 0" }}>
              Dispatch platform-wide alerts, callback notifications, or casting updates to talent and recruiters.
            </p>
          </div>
        </div>

        {/* Broadcast Creation Form */}
        <form onSubmit={handleBroadcastSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#eceaf5", marginBottom: "6px" }}>
                Target Audience
              </label>
              <select
                value={broadcastForm.audience}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, audience: e.target.value })}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 12px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  color: "#eceaf5",
                  fontSize: "14px",
                  outline: "none",
                }}
              >
                <option value="All Registered Talent" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>All Registered Talent (1,166 artists)</option>
                <option value="Verified Talent (Mumbai)" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Verified Talent (Mumbai - 693 artists)</option>
                <option value="Verified Talent (Delhi NCR)" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Verified Talent (Delhi NCR - 270 artists)</option>
                <option value="All Recruiters" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>All Recruiters & Agencies (118 companies)</option>
                <option value="All Platform Users" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>All Platform Users (1,284 users)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#eceaf5", marginBottom: "6px" }}>
                Channel
              </label>
              <select
                value={broadcastForm.channel}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, channel: e.target.value })}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 12px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  color: "#eceaf5",
                  fontSize: "14px",
                  outline: "none",
                }}
              >
                <option value="In-app Notification" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>In-app Notification Bell</option>
                <option value="In-app + Urgent SMS" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>In-app + Urgent SMS (Callbacks)</option>
                <option value="In-app + WhatsApp Alert" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>In-app + WhatsApp Channel</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#eceaf5", marginBottom: "6px" }}>
                Priority Level
              </label>
              <select
                value={broadcastForm.priority}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, priority: e.target.value })}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 12px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  color: "#eceaf5",
                  fontSize: "14px",
                  outline: "none",
                }}
              >
                <option value="Normal" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Normal Notification</option>
                <option value="Urgent Casting Alert" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Urgent Casting Alert</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#eceaf5", marginBottom: "6px" }}>
              Broadcast Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Urgent Callback Schedule Notice for Mumbai Diaries Season 2"
              value={broadcastForm.title}
              onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
              style={{
                width: "100%",
                height: "40px",
                padding: "0 14px",
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                color: "#eceaf5",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#eceaf5", marginBottom: "6px" }}>
              Message Body *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Write broadcast announcement message details..."
              value={broadcastForm.message}
              onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                color: "#eceaf5",
                fontSize: "14px",
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              className="btn-primary"
              style={{
                height: "40px",
                padding: "0 20px",
                fontSize: "14px",
                borderRadius: "12px",
                gap: "8px",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <Send size={15} /> Send Broadcast Alert
            </button>
          </div>
        </form>

        {/* Recent Broadcasts History */}
        <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "16px" }}>
          <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#eceaf5", margin: "0 0 12px 0" }}>
            Recent Dispatched Broadcasts
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {broadcasts && broadcasts.length > 0 ? (
              broadcasts.map((bc) => (
                <div
                  key={bc.id}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "14px",
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "14px",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "700", color: "#eceaf5" }}>
                        {bc.title}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          backgroundColor: bc.priority === "Urgent Casting Alert" ? "rgba(255, 107, 107, 0.14)" : "rgba(255, 188, 0, 0.14)",
                          color: bc.priority === "Urgent Casting Alert" ? "var(--status-red)" : "var(--gold)",
                          border: `1px solid ${bc.priority === "Urgent Casting Alert" ? "rgba(255, 107, 107, 0.35)" : "rgba(255, 188, 0, 0.35)"}`,
                        }}
                      >
                        {bc.priority}
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "#a3acc2", lineHeight: 1.4, margin: 0 }}>
                      {bc.message}
                    </p>
                    <div style={{ fontSize: "12px", color: "#7e89a3", marginTop: "4px" }}>
                      Audience: <strong style={{ color: "#eceaf5" }}>{bc.audience}</strong> &bull; Channel: <strong style={{ color: "#eceaf5" }}>{bc.channel}</strong> ({bc.recipientsCount} recipients)
                    </div>
                  </div>

                  <span style={{ fontSize: "12px", color: "#7e89a3", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {bc.sentAt}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: "14px", textAlign: "center", color: "#7e89a3", fontSize: "13px" }}>
                No recent broadcasts.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
