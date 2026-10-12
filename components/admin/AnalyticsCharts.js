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
      <div style={{ display: "flex", gap: "20px", marginBottom: "14px", fontSize: "13px" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#2B2D2A", fontWeight: "600" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#8A6B2E" }} />
          Talent Registrations
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#5A584F", fontWeight: "600" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#8C8676" }} />
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
              stroke="#E8E2D4"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Lines */}
        <path d={pathTalent} fill="none" stroke="#8A6B2E" strokeWidth="2.5" strokeLinecap="round" />
        <path d={pathRecruiter} fill="none" stroke="#8C8676" strokeWidth="2" strokeDasharray="4 2" strokeLinecap="round" />

        {/* Data points */}
        {pointsTalent.map((p, i) => (
          <circle
            key={`t-${i}`}
            cx={p.x}
            cy={p.y}
            r={hoveredIdx === i ? 6 : 4}
            fill="#FFFFFF"
            stroke="#8A6B2E"
            strokeWidth="2.5"
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
            r={hoveredIdx === i ? 6 : 4}
            fill="#FFFFFF"
            stroke="#8C8676"
            strokeWidth="2.5"
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
            fill="#5A584F"
            fontSize="12"
            fontWeight="500"
            fontFamily="Inter, sans-serif"
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
            padding: "10px 14px",
            borderRadius: "12px",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            boxShadow: "0 8px 24px rgba(43,45,42,0.08)",
            fontSize: "13px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          <div style={{ fontWeight: 700, color: "#2B2D2A", marginBottom: "4px" }}>{data[hoveredIdx]?.label}</div>
          <div style={{ color: "#8A6B2E", fontWeight: 600 }}>Talents: {data[hoveredIdx]?.talent}</div>
          <div style={{ color: "#5A584F", fontWeight: 600 }}>Recruiters: {data[hoveredIdx]?.recruiters}</div>
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
          borderBottom: "1px solid #E8E2D4",
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
                    top: "-28px",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E8E2D4",
                    color: "#8A6B2E",
                    fontSize: "12px",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    boxShadow: "0 4px 12px rgba(43,45,42,0.08)",
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
                  backgroundColor: isHovered ? "#6E5420" : "#8A6B2E",
                  borderRadius: "6px 6px 0 0",
                  transition: "all 0.2s ease",
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
              fontSize: "12px",
              color: hoveredIdx === idx ? "#8A6B2E" : "#5A584F",
              fontWeight: hoveredIdx === idx ? 700 : 500,
              fontFamily: "Inter, sans-serif",
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

  const goldShades = ["#8A6B2E", "#A88A4A", "#C9A55C", "#DDC48F", "#EADFC3"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
      {/* Visual Percentage Bars */}
      <div style={{ display: "flex", height: "12px", borderRadius: "999px", overflow: "hidden", gap: "2px", backgroundColor: "#F3EFE6" }}>
        {data.map((cat, i) => {
          const color = goldShades[i % goldShades.length];
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {data.map((cat, i) => {
          const color = goldShades[i % goldShades.length];
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderRadius: "12px",
                backgroundColor: "#FAF9F7",
                border: "1px solid #E8E2D4",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: color }} />
                <span style={{ fontSize: "13px", color: "#2B2D2A", fontWeight: 500 }}>{cat.name}</span>
              </div>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#8A6B2E" }}>
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

  const funnelShades = ["#8A6B2E", "#A88A4A", "#C9A55C", "#DDC48F", "#EADFC3"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
      {data.map((stage, idx) => {
        const stageColor = funnelShades[idx % funnelShades.length];

        return (
          <div
            key={idx}
            style={{
              padding: "12px 14px",
              borderRadius: "14px",
              backgroundColor: "#FAF9F7",
              border: "1px solid #E8E2D4",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>
                {idx + 1}. {stage.stage}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#2B2D2A" }}>
                  {stage.count.toLocaleString()}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "999px",
                    backgroundColor: "rgba(138, 107, 46, 0.12)",
                    color: "#6E5420",
                    border: "1px solid rgba(138, 107, 46, 0.25)",
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
                borderRadius: "999px",
                backgroundColor: "#F3EFE6",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${stage.percent}%`,
                  height: "100%",
                  backgroundColor: stageColor,
                  borderRadius: "999px",
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

  const cityShades = ["#8A6B2E", "#A88A4A", "#C9A55C", "#DDC48F", "#EADFC3"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
      {data.map((city, idx) => (
        <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
            <span style={{ color: "#2B2D2A", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
              <MapPin size={14} color="#8A6B2E" />
              {city.city}
            </span>
            <span style={{ color: "#5A584F", fontWeight: 500 }}>
              {city.count} ({city.share}%)
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: "6px",
              borderRadius: "999px",
              backgroundColor: "#F3EFE6",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${city.share}%`,
                height: "100%",
                backgroundColor: cityShades[idx % cityShades.length],
                borderRadius: "999px",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
