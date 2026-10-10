"use client";

import React, { useState } from "react";
import { Users, Building2, TrendingUp, Sparkles, MapPin } from "lucide-react";

export function UserGrowthLineChart({ data = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) return null;

  const width = 600;
  const height = 230;
  const padding = 36;

  const maxVal = Math.max(...data.map((d) => Math.max(d.talent, d.recruiters * 8))) || 1500;

  const pointsTalent = data.map((d, i) => {
    const x = padding + (i * (width - 2 * padding)) / (data.length - 1 || 1);
    const y = height - padding - (d.talent / maxVal) * (height - 2 * padding);
    return { x, y, ...d };
  });

  const pointsRecruiter = data.map((d, i) => {
    const x = padding + (i * (width - 2 * padding)) / (data.length - 1 || 1);
    const y = height - padding - ((d.recruiters * 8) / maxVal) * (height - 2 * padding);
    return { x, y, ...d };
  });

  const pathTalent = pointsTalent.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");
  const pathRecruiter = pointsRecruiter.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");

  return (
    <div style={{ position: "relative", width: "100%", overflowX: "auto" }}>
      <div style={{ display: "flex", gap: "16px", marginBottom: "12px", fontSize: "0.785rem" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--gold)", fontWeight: "600" }}>
          <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#ffbc00" }} />
          Talent Registrations
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontWeight: "600" }}>
          <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#a3acc2" }} />
          Recruiters &amp; Agencies
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", minWidth: 0 }}>
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = height - padding - ratio * (height - 2 * padding);
          return (
            <line
              key={i}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="rgba(255, 255, 255, 0.10)"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Lines */}
        <path d={pathTalent} fill="none" stroke="#ffbc00" strokeWidth="2.5" strokeLinecap="round" />
        <path d={pathRecruiter} fill="none" stroke="#a3acc2" strokeWidth="2" strokeDasharray="4 2" strokeLinecap="round" />

        {/* Data points */}
        {pointsTalent.map((p, i) => (
          <circle
            key={`t-${i}`}
            cx={p.x}
            cy={p.y}
            r={hoveredIdx === i ? 5.5 : 3.5}
            fill="#ffbc00"
            stroke="#0a0f19"
            strokeWidth="2"
            style={{ cursor: "pointer", transition: "all 0.2s ease" }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          />
        ))}

        {pointsRecruiter.map((p, i) => (
          <circle
            key={`r-${i}`}
            cx={p.x}
            cy={p.y}
            r={hoveredIdx === i ? 5.5 : 3.5}
            fill="#a3acc2"
            stroke="#0a0f19"
            strokeWidth="2"
            style={{ cursor: "pointer", transition: "all 0.2s ease" }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          />
        ))}

        {/* X Axis Labels */}
        {pointsTalent.map((p, i) => (
          <text
            key={`lbl-${i}`}
            x={p.x}
            y={height - 10}
            fill="#7e89a3"
            fontSize="10"
            fontWeight="500"
            textAnchor="middle"
          >
            {p.label}
          </text>
        ))}
      </svg>

      {hoveredIdx !== null && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            padding: "8px 12px",
            borderRadius: "12px",
            backgroundColor: "var(--bg-alt)",
            border: "1px solid var(--glass-border-elevated)",
            boxShadow: "var(--shadow-md)",
            fontSize: "0.785rem",
          }}
        >
          <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "2px" }}>{data[hoveredIdx]?.label}</div>
          <div style={{ color: "var(--gold)", fontWeight: 600 }}>Talents: {data[hoveredIdx]?.talent}</div>
          <div style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Recruiters: {data[hoveredIdx]?.recruiters}</div>
        </div>
      )}
    </div>
  );
}

export function ApplicationsBarChart({ data = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.count)) || 3000;
  const height = 200;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "10px",
          height: `${height}px`,
          padding: "16px 8px 0 8px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.10)",
        }}
      >
        {data.map((item, idx) => {
          const barHeightPct = (item.count / maxVal) * 100;
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                height: "100%",
                justifyContent: "flex-end",
                position: "relative",
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {isHovered && (
                <div
                  style={{
                    position: "absolute",
                    top: "-26px",
                    padding: "2px 7px",
                    borderRadius: "6px",
                    backgroundColor: "var(--bg-alt)",
                    border: "1px solid var(--gold)",
                    color: "var(--gold)",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    boxShadow: "var(--shadow-sm)",
                    zIndex: 10,
                  }}
                >
                  {item.count.toLocaleString()}
                </div>
              )}

              <div
                style={{
                  width: "70%",
                  maxWidth: "38px",
                  height: `${barHeightPct}%`,
                  background: isHovered
                    ? "var(--gold-gradient)"
                    : "linear-gradient(180deg, rgba(255, 188, 0, 0.6) 0%, rgba(255, 188, 0, 0.2) 100%)",
                  borderRadius: "6px 6px 0 0",
                  transition: "all 0.2s ease",
                  boxShadow: isHovered ? "var(--gold-glow)" : "none",
                  cursor: "pointer",
                }}
              />
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 8px" }}>
        {data.map((item, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: "0.75rem",
              color: hoveredIdx === idx ? "var(--gold)" : "var(--text-muted)",
              fontWeight: hoveredIdx === idx ? 700 : 500,
            }}
          >
            {item.month}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CategoryDonutChart({ data = [] }) {
  if (!data || data.length === 0) return null;

  const goldColors = ["#ffd54a", "#ffbc00", "#d49b00", "#aa7c00", "#7a5900"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%" }}>
      {/* Visual Percentage Bars */}
      <div style={{ display: "flex", height: "10px", borderRadius: "var(--radius-pill)", overflow: "hidden", gap: "2px" }}>
        {data.map((cat, i) => {
          const color = goldColors[i % goldColors.length];
          return (
            <div
              key={i}
              style={{
                width: `${cat.value}%`,
                backgroundColor: color,
                transition: "width 0.3s ease",
              }}
              title={`${cat.name}: ${cat.value}%`}
            />
          );
        })}
      </div>

      {/* Legend Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {data.map((cat, i) => {
          const color = goldColors[i % goldColors.length];
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                borderRadius: "12px",
                backgroundColor: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: color }} />
                <span style={{ fontSize: "0.785rem", color: "var(--text-secondary)", fontWeight: 500 }}>{cat.name}</span>
              </div>
              <span style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--gold)" }}>
                {cat.value}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FunnelStages({ data = [] }) {
  if (!data || data.length === 0) return null;

  const funnelColors = ["#ffd54a", "#ffbc00", "#e6a800", "#b38300", "#805d00"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
      {data.map((stage, idx) => {
        const stageColor = funnelColors[idx % funnelColors.length];

        return (
          <div
            key={idx}
            style={{
              padding: "10px 14px",
              borderRadius: "14px",
              backgroundColor: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>
                {idx + 1}. {stage.stage}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--gold)" }}>
                  {stage.count.toLocaleString()}
                </span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: "rgba(255, 188, 0, 0.12)",
                    color: "var(--gold)",
                    border: "1px solid rgba(255, 188, 0, 0.30)",
                  }}
                >
                  {stage.percent}%
                </span>
              </div>
            </div>

            <div
              style={{
                width: "100%",
                height: "6px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${stage.percent}%`,
                  height: "100%",
                  backgroundColor: stageColor,
                  borderRadius: "var(--radius-pill)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TopCitiesProgress({ data = [] }) {
  if (!data || data.length === 0) return null;

  const cityColors = ["#ffd54a", "#ffbc00", "#e6a800", "#b38300", "#805d00"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
      {data.map((city, idx) => (
        <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.785rem" }}>
            <span style={{ color: "var(--text-primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
              <MapPin size={12} color="var(--gold)" />
              {city.city}
            </span>
            <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>
              {city.count} ({city.share}%)
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: "6px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${city.share}%`,
                height: "100%",
                backgroundColor: cityColors[idx % cityColors.length],
                borderRadius: "var(--radius-pill)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
