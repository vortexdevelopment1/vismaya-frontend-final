"use client";

import { useMemo } from "react";
import { useWorkflow } from "@/lib/shared/workflowStore";
import Hero from "@/components/home/Hero";
import BrandsMarquee from "@/components/home/BrandsMarquee";
import StatsStudioStrip from "@/components/home/StatsStudioStrip";
import PortalsSection from "@/components/home/PortalsSection";
import OpportunitiesSection from "@/components/home/OpportunitiesSection";
import TalentRosterSection from "@/components/home/TalentRosterSection";
import WorkflowSection from "@/components/home/WorkflowSection";
import CtaBannerSection from "@/components/home/CtaBannerSection";
import PublicFooter from "@/components/PublicFooter";

export default function Home() {
  const { opportunities, getProject } = useWorkflow();

  // Filter latest published opportunities (top 3)
  const latestOpportunities = useMemo(() => {
    if (!opportunities || opportunities.length === 0) return [];
    const now = new Date().getTime();
    const published = opportunities.filter((opp) => {
      if (opp.status !== "Published") return false;
      const deadlineTime = new Date(opp.deadline).getTime();
      return isNaN(deadlineTime) || deadlineTime >= now;
    });

    const list = published.length > 0 ? published : opportunities;
    const sorted = [...list].sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.publishedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return sorted.slice(0, 3);
  }, [opportunities]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", width: "100%", backgroundColor: "var(--bg-primary)" }}>
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. Stats & Metrics Strip (directly under Hero) */}
      <StatsStudioStrip />

      {/* 3. Auto-Sliding Trusted Production Houses Marquee (directly below Stats) */}
      <BrandsMarquee />

      {/* 4. Unified Ecosystem / Workstation Portals */}
      <PortalsSection />

      {/* 5. Active Casting Calls */}
      <OpportunitiesSection opportunities={latestOpportunities} getProject={getProject} />

      {/* 6. Elite Talent Roster */}
      <TalentRosterSection />

      {/* 7. How Vismaya Works (4-Step Workflow) */}
      <WorkflowSection />

      {/* 8. Final Call to Action Banner */}
      <CtaBannerSection />

      {/* 9. Public Footer */}
      <PublicFooter />
    </div>
  );
}
