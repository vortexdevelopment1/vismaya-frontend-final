"use client";

import PublicNav from "@/components/PublicNav";
import Hero from "@/components/home/Hero";
import BrandsMarquee from "@/components/home/BrandsMarquee";
import StatsStudioStrip from "@/components/home/StatsStudioStrip";
import TalentRosterSection from "@/components/home/TalentRosterSection";
import WorkflowSection from "@/components/home/WorkflowSection";
import SuccessStoriesSection from "@/components/home/SuccessStoriesSection";

import CtaBannerSection from "@/components/home/CtaBannerSection";
import HomePricingSection from "@/components/home/HomePricingSection";
import PublicFooter from "@/components/PublicFooter";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", width: "100%", maxWidth: "100%", overflowX: "hidden", backgroundColor: "var(--bg-primary)" }}>
      {/* 0. Public Navigation */}
      <PublicNav />

      {/* 1. Hero Section */}
      <Hero />

      {/* 2. Stats & Metrics Strip (directly under Hero) */}
      <StatsStudioStrip />

      {/* 3. Auto-Sliding Trusted Production Houses Marquee (directly below Stats) */}
      <BrandsMarquee />

      {/* 4. Elite Talent Roster */}
      <TalentRosterSection />

      {/* 5. How Vismaya Works (4-Step Workflow) */}
      <WorkflowSection />

      {/* 5.5. Success Stories Carousel */}
      <SuccessStoriesSection />

      {/* 6. Final Call to Action Banner */}
      <CtaBannerSection />

      {/* 6.5. Compact Pricing Overview */}
      <HomePricingSection />

      {/* 7. Public Footer */}
      <PublicFooter />
    </div>
  );
}
