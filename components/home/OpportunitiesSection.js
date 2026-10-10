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
            <div className="eyebrow" style={{ marginBottom: "12px" }}>
              <span>Live Auditions</span>
            </div>
            <h2
              style={{
                fontFamily: "var(--font-heading), 'Playfair Display', serif",
                fontSize: "clamp(30px, 4vw, 44px)",
                lineHeight: 1.15,
                fontWeight: 700,
                color: "#eceaf5",
                margin: "0 0 12px 0",
              }}
            >
              Active Casting Calls
            </h2>
            <p style={{ fontSize: "15px", color: "#a3acc2", margin: 0, lineHeight: "26px" }}>
              Verified casting opportunities currently accepting candidate submissions. Sign in with your profile to view full character sides and apply.
            </p>
          </div>

          <Link href="/opportunities" className="btn-secondary" style={{ flexShrink: 0 }}>
            <span>View All Opportunities</span>
            <ArrowRight size={14} />
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
    </section>
  );
}
