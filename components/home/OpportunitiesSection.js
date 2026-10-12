"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PublicOpportunityCard from "@/components/shared/PublicOpportunityCard";

export default function OpportunitiesSection({ opportunities = [], getProject }) {
  return (
    <section className="public-section" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div className="public-container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "24px",
            marginBottom: "40px",
          }}
        >
          <div style={{ maxWidth: "680px" }}>
            <div className="eyebrow" style={{ marginBottom: "12px", color: "#8A6B2E" }}>
              <span>Live Auditions</span>
            </div>
            <h2
              style={{
                fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                fontSize: "clamp(30px, 4vw, 44px)",
                lineHeight: 1.15,
                fontWeight: 600,
                color: "#2B2D2A",
                margin: "0 0 12px 0",
              }}
            >
              Active Casting Calls
            </h2>
            <p
              style={{
                fontFamily: "var(--font-body), 'Inter', sans-serif",
                fontSize: "15px",
                color: "#5A584F",
                margin: 0,
                lineHeight: 1.7,
              }}
            >
              Verified casting opportunities currently accepting candidate submissions. Sign in with your profile to view full character sides and apply.
            </p>
          </div>

          <Link href="/opportunities" className="opp-view-all-btn" style={{ flexShrink: 0 }}>
            <span>View All Opportunities</span>
            <ArrowRight size={14} className="opp-view-all-arrow" />
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
            alignItems: "stretch",
          }}
        >
          {opportunities.map((opp, idx) => {
            const project = getProject ? getProject(opp.projectId) : null;
            return (
              <PublicOpportunityCard
                key={opp.id}
                opportunity={opp}
                project={project}
                index={idx}
              />
            );
          })}
        </div>
      </div>

      <style jsx>{`
        :global(.opp-view-all-btn) {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 44px;
          min-height: 44px;
          padding: 0 22px;
          border-radius: 8px;
          font-family: var(--font-body), 'Inter', sans-serif;
          font-size: 12.5px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          color: #2B2D2A !important;
          background-color: #F3EFE6 !important;
          border: 1px solid #E8E2D4 !important;
          box-shadow: 0 1px 3px rgba(43, 45, 42, 0.04);
          transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease, transform 180ms ease, box-shadow 200ms ease;
        }

        :global(.opp-view-all-btn:hover) {
          background-color: #8A6B2E !important;
          border-color: #755B25 !important;
          color: #FFFFFF !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(138, 107, 46, 0.24);
        }

        :global(.opp-view-all-btn:hover .opp-view-all-arrow) {
          transform: translateX(4px);
        }

        :global(.opp-view-all-btn:active) {
          transform: scale(0.97);
        }

        :global(.opp-view-all-btn:focus-visible) {
          outline: 2px solid #8A6B2E;
          outline-offset: 3px;
        }

        :global(.opp-view-all-arrow) {
          transition: transform 200ms ease;
        }
      `}</style>
    </section>
  );
}
