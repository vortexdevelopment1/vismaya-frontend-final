"use client";

import React, { useState, useEffect } from "react";
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
import { isRealMode } from "@/lib/api/config";
import { adminService } from "@/lib/api/services/adminService";
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
  const [metricsData, setMetricsData] = useState(null);

  useEffect(() => {
    let mounted = true;
    adminService.getDashboardMetrics().then((res) => {
      if (mounted && res?.data) {
        setMetricsData(res.data);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Broadcast Form State
  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    audience: "Verified Talent (Mumbai)",
    channel: "In-app Notification",
    priority: "Normal",
    message: "",
  });

  const realData = metricsData ? {
    kpis: {
      activeUsers: { value: String(metricsData.users?.total ?? 0), change: "+0%", isPositive: true },
      liveCalls: { value: String(metricsData.opportunities?.published ?? 0), change: "+0%", isPositive: true },
      applications: { value: String(metricsData.applications?.total ?? 0), change: "+0%", isPositive: true },
      revenue: { value: `₹${(metricsData.revenue?.total ?? 0).toLocaleString("en-IN")}`, change: "+0%", isPositive: true },
    },
    userGrowth: Array.isArray(metricsData.userGrowth) ? metricsData.userGrowth : [],
    applicationsMonthly: Array.isArray(metricsData.applicationsMonthly) ? metricsData.applicationsMonthly : [],
    categories: Array.isArray(metricsData.categories) ? metricsData.categories : [],
    funnel: Array.isArray(metricsData.funnel) ? metricsData.funnel : [],
    topCities: Array.isArray(metricsData.topCities) ? metricsData.topCities : [],
  } : {
    kpis: {
      activeUsers: { value: "0", change: "+0%", isPositive: true },
      liveCalls: { value: "0", change: "+0%", isPositive: true },
      applications: { value: "0", change: "+0%", isPositive: true },
      revenue: { value: "₹0", change: "+0%", isPositive: true },
    },
    userGrowth: [],
    applicationsMonthly: [],
    categories: [],
    funnel: [],
    topCities: [],
  };

  const currentData = isRealMode("admin")
    ? realData
    : (metricsData ? (metricsData[timeRange] || metricsData["30d"]) : realData);

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
    <div className="admin-analytics-page" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Page Header */}
      <PageHeader
        title="Platform Analytics & Intelligence"
        subtitle="Live casting velocity metrics, talent demographic distributions, application conversion funnels, and broadcast messaging center."
        badge="Platform Intelligence"
        action={
          /* Date Range Selector - Segmented Control */
          <div
            className="admin-time-range-wrap"
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#F3EFE6",
              border: "1px solid #E8E2D4",
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
                  className={`admin-time-range-btn ${isActive ? "active" : ""}`}
                  onClick={() => setTimeRange(range.key)}
                  style={{
                    padding: "6px clamp(10px, 2vw, 14px)",
                    borderRadius: "8px",
                    backgroundColor: isActive ? "#8A6B2E" : "transparent",
                    color: isActive ? "#FFFFFF" : "#5A584F",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    fontFamily: "Inter, sans-serif",
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
        className="admin-stat-grid"
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
        className="admin-chart-row-1"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: "20px",
        }}
      >
        {/* User Growth Line Chart */}
        <div
          className="admin-chart-card"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 2px 4px rgba(43,45,42,0.04), 0 12px 28px rgba(43,45,42,0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #E8E2D4", paddingBottom: "14px" }}>
            <div>
              <h3 style={{ fontSize: "20px", fontFamily: "var(--font-playfair), serif", fontWeight: "600", color: "#2B2D2A", margin: 0 }}>
                User Growth Velocity
              </h3>
              <p style={{ fontSize: "14px", color: "#5A584F", margin: "4px 0 0 0" }}>
                Talent profiles verified vs recruiter agency signups
              </p>
            </div>
            <span
              style={{
                fontSize: "11px",
                color: "#6E5420",
                fontWeight: "700",
                backgroundColor: "rgba(138, 107, 46, 0.12)",
                padding: "3px 10px",
                borderRadius: "999px",
                border: "1px solid rgba(138, 107, 46, 0.25)",
              }}
            >
              {timeRange.toUpperCase()}
            </span>
          </div>

          <UserGrowthLineChart data={currentData.userGrowth} />
        </div>

        {/* Category Breakdown */}
        <div
          className="admin-chart-card"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 2px 4px rgba(43,45,42,0.04), 0 12px 28px rgba(43,45,42,0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ borderBottom: "1px solid #E8E2D4", paddingBottom: "14px" }}>
            <h3 style={{ fontSize: "20px", fontFamily: "var(--font-playfair), serif", fontWeight: "600", color: "#2B2D2A", margin: 0 }}>
              Casting Calls by Category
            </h3>
            <p style={{ fontSize: "14px", color: "#5A584F", margin: "4px 0 0 0" }}>
              Distribution across OTT, Films, Commercials &amp; Music
            </p>
          </div>

          <CategoryDonutChart data={currentData.categories} />
        </div>
      </div>

      {/* Row 2 Charts: Applications Monthly Bar Chart (1fr) + Conversion Funnel (1fr) + Top Cities (1fr) */}
      <div
        className="admin-chart-row-2"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Application Volume Bar Chart */}
        <div
          className="admin-chart-card"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 2px 4px rgba(43,45,42,0.04), 0 12px 28px rgba(43,45,42,0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ borderBottom: "1px solid #E8E2D4", paddingBottom: "14px" }}>
            <h3 style={{ fontSize: "20px", fontFamily: "var(--font-playfair), serif", fontWeight: "600", color: "#2B2D2A", margin: 0 }}>
              Audition Velocity
            </h3>
            <p style={{ fontSize: "14px", color: "#5A584F", margin: "4px 0 0 0" }}>
              Monthly application submissions
            </p>
          </div>

          <ApplicationsBarChart data={currentData.applicationsMonthly} />
        </div>

        {/* Application Conversion Funnel */}
        <div
          className="admin-chart-card"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 2px 4px rgba(43,45,42,0.04), 0 12px 28px rgba(43,45,42,0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ borderBottom: "1px solid #E8E2D4", paddingBottom: "14px" }}>
            <h3 style={{ fontSize: "20px", fontFamily: "var(--font-playfair), serif", fontWeight: "600", color: "#2B2D2A", margin: 0 }}>
              Conversion Funnel
            </h3>
            <p style={{ fontSize: "14px", color: "#5A584F", margin: "4px 0 0 0" }}>
              Stage drop-off from Applied to Booked
            </p>
          </div>

          <FunnelStages data={currentData.funnel} />
        </div>

        {/* Top Talent Cities Leaderboard */}
        <div
          className="admin-chart-card"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 2px 4px rgba(43,45,42,0.04), 0 12px 28px rgba(43,45,42,0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ borderBottom: "1px solid #E8E2D4", paddingBottom: "14px" }}>
            <h3 style={{ fontSize: "20px", fontFamily: "var(--font-playfair), serif", fontWeight: "600", color: "#2B2D2A", margin: 0 }}>
              Top Talent Geographic Hubs
            </h3>
            <p style={{ fontSize: "14px", color: "#5A584F", margin: "4px 0 0 0" }}>
              Artist concentration across Indian cities
            </p>
          </div>

          <TopCitiesProgress data={currentData.topCities} />
        </div>
      </div>

      {/* Row 3: Broadcast Messaging Center */}
      <div
        className="admin-broadcast-card"
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E2D4",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 2px 4px rgba(43,45,42,0.04), 0 12px 28px rgba(43,45,42,0.06)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #E8E2D4", paddingBottom: "14px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              backgroundColor: "#F3EFE6",
              border: "1px solid #E8E2D4",
              color: "#8A6B2E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Radio size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "20px", fontFamily: "var(--font-playfair), serif", fontWeight: "600", color: "#2B2D2A", margin: 0 }}>
              Admin Broadcast Messaging Center
            </h3>
            <p style={{ fontSize: "14px", color: "#5A584F", margin: "4px 0 0 0" }}>
              Dispatch platform-wide alerts, callback notifications, or casting updates to talent and recruiters.
            </p>
          </div>
        </div>

        {/* Broadcast Creation Form */}
        <form onSubmit={handleBroadcastSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="admin-broadcast-fields" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#2B2D2A", marginBottom: "6px" }}>
                Target Audience
              </label>
              <select
                value={broadcastForm.audience}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, audience: e.target.value })}
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 12px",
                  borderRadius: "10px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #D9D2C0",
                  color: "#2B2D2A",
                  fontSize: "14px",
                  outline: "none",
                }}
              >
                <option value="All Registered Talent">All Registered Talent (1,166 artists)</option>
                <option value="Verified Talent (Mumbai)">Verified Talent (Mumbai - 693 artists)</option>
                <option value="Verified Talent (Delhi NCR)">Verified Talent (Delhi NCR - 270 artists)</option>
                <option value="All Recruiters">All Recruiters &amp; Agencies (118 companies)</option>
                <option value="All Platform Users">All Platform Users (1,284 users)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#2B2D2A", marginBottom: "6px" }}>
                Channel
              </label>
              <select
                value={broadcastForm.channel}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, channel: e.target.value })}
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 12px",
                  borderRadius: "10px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #D9D2C0",
                  color: "#2B2D2A",
                  fontSize: "14px",
                  outline: "none",
                }}
              >
                <option value="In-app Notification">In-app Notification Bell</option>
                <option value="In-app + Urgent SMS">In-app + Urgent SMS (Callbacks)</option>
                <option value="In-app + WhatsApp Alert">In-app + WhatsApp Channel</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#2B2D2A", marginBottom: "6px" }}>
                Priority Level
              </label>
              <select
                value={broadcastForm.priority}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, priority: e.target.value })}
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 12px",
                  borderRadius: "10px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #D9D2C0",
                  color: "#2B2D2A",
                  fontSize: "14px",
                  outline: "none",
                }}
              >
                <option value="Normal">Normal Notification</option>
                <option value="Urgent Casting Alert">Urgent Casting Alert</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#2B2D2A", marginBottom: "6px" }}>
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
                height: "44px",
                padding: "0 14px",
                borderRadius: "10px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #D9D2C0",
                color: "#2B2D2A",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#2B2D2A", marginBottom: "6px" }}>
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
                padding: "12px 14px",
                borderRadius: "10px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #D9D2C0",
                color: "#2B2D2A",
                fontSize: "14px",
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              className="admin-broadcast-btn"
              style={{
                height: "44px",
                padding: "0 22px",
                fontSize: "14px",
                fontWeight: "600",
                borderRadius: "10px",
                gap: "8px",
                display: "inline-flex",
                alignItems: "center",
                backgroundColor: "#8A6B2E",
                color: "#FFFFFF",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#6E5420")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#8A6B2E")}
            >
              <Send size={15} /> Send Broadcast Alert
            </button>
          </div>
        </form>

        {/* Recent Broadcasts History */}
        <div style={{ borderTop: "1px solid #E8E2D4", paddingTop: "16px" }}>
          <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#2B2D2A", margin: "0 0 12px 0" }}>
            Recent Dispatched Broadcasts
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {broadcasts && broadcasts.length > 0 ? (
              broadcasts.map((bc) => (
                <div
                  key={bc.id}
                  className="admin-broadcast-history-item"
                  style={{
                    padding: "16px 18px",
                    borderRadius: "14px",
                    backgroundColor: "#FAF9F7",
                    border: "1px solid #E8E2D4",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "14px",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "15px", fontWeight: "700", color: "#2B2D2A" }}>
                        {bc.title}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          backgroundColor: bc.priority === "Urgent Casting Alert" ? "rgba(180, 35, 24, 0.08)" : "rgba(138, 107, 46, 0.12)",
                          color: bc.priority === "Urgent Casting Alert" ? "#B42318" : "#6E5420",
                          border: `1px solid ${bc.priority === "Urgent Casting Alert" ? "rgba(180, 35, 24, 0.25)" : "rgba(138, 107, 46, 0.25)"}`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {bc.priority}
                      </span>
                    </div>
                    <p style={{ fontSize: "14px", color: "#5A584F", lineHeight: 1.5, margin: 0 }}>
                      {bc.message}
                    </p>
                    <div style={{ fontSize: "13px", color: "#5A584F", marginTop: "6px" }}>
                      Audience: <strong style={{ color: "#2B2D2A" }}>{bc.audience}</strong> &bull; Channel: <strong style={{ color: "#2B2D2A" }}>{bc.channel}</strong> ({bc.recipientsCount} recipients)
                    </div>
                  </div>

                  <span className="admin-broadcast-history-date" style={{ fontSize: "12px", color: "#5A584F", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {bc.sentAt}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: "16px", textAlign: "center", color: "#5A584F", fontSize: "14px" }}>
                No recent broadcasts.
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .admin-analytics-page {
            gap: 16px !important;
          }
          .admin-time-range-wrap {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 5px !important;
            padding: 3px !important;
            background-color: #F3EFE6 !important;
            border-radius: 999px !important;
          }
          .admin-time-range-btn {
            flex: 1 1 auto !important;
            height: 28px !important;
            padding: 0 8px !important;
            font-size: 10.5px !important;
            border-radius: 999px !important;
            font-weight: 600 !important;
            text-align: center !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .admin-time-range-btn.active {
            background-color: #8A6B2E !important;
            color: #FFFFFF !important;
          }
          .admin-stat-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
          }
          .admin-chart-row-1,
          .admin-chart-row-2 {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .admin-chart-card,
          .admin-broadcast-card {
            padding: 14px 14px !important;
            border-radius: 14px !important;
            gap: 12px !important;
          }
          .admin-chart-card h3,
          .admin-broadcast-card h3 {
            font-size: 16px !important;
            line-height: 1.25 !important;
          }
          .admin-chart-card p,
          .admin-broadcast-card p {
            font-size: 12px !important;
            line-height: 1.4 !important;
          }
          .admin-broadcast-fields {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .admin-broadcast-card input,
          .admin-broadcast-card select {
            height: 42px !important;
            font-size: 16px !important;
            border-radius: 10px !important;
          }
          .admin-broadcast-card textarea {
            font-size: 16px !important;
            border-radius: 10px !important;
            min-height: 84px !important;
          }
          .admin-broadcast-btn {
            width: 100% !important;
            height: 42px !important;
            justify-content: center !important;
            font-size: 13px !important;
          }
          .admin-broadcast-history-item {
            flex-direction: column !important;
            gap: 8px !important;
            padding: 12px 14px !important;
            border-radius: 12px !important;
          }
          .admin-broadcast-history-date {
            align-self: flex-start !important;
            font-size: 11px !important;
          }
        }
        @media (max-width: 400px) {
          .admin-time-range-btn {
            font-size: 10px !important;
            padding: 0 6px !important;
          }
        }
      `}</style>
    </div>
  );
}
