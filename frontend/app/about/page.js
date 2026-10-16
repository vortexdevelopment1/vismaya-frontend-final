"use client";

import Image from "next/image";
import Link from "next/link";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { Sparkles, ShieldCheck, Film, Users, Award, ArrowRight } from "lucide-react";

export default function AboutPage() {
  const highlights = [
    {
      icon: Film,
      title: "Industry Standard",
      desc: "Connecting talent directly with verified casting directors, producers, and ad agencies across India and internationally.",
    },
    {
      icon: ShieldCheck,
      title: "Verified Profiles",
      desc: "Strict KYC verification, showreel vetting, and anti-fraud checks ensuring safe, legitimate auditions.",
    },
    {
      icon: Users,
      title: "Unified Ecosystem",
      desc: "One comprehensive platform handling discovery, auditions, digital self-tapes, callbacks, and talent pipelines.",
    },
    {
      icon: Award,
      title: "Transparency First",
      desc: "Real-time status tracking for every application, feedback loop from casting directors, and escrow-backed payouts.",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", width: "100%", backgroundColor: "var(--bg-primary)" }}>
      <PublicNav />

      {/* 1. TOP HEADER */}
      <section
        className="about-header-section"
        style={{
          position: "relative",
          paddingTop: "clamp(28px, 4vw, 48px)",
          paddingBottom: "clamp(48px, 6vh, 64px)",
          backgroundColor: "var(--bg-alt, #F0EEE7)",
          borderBottom: "1px solid var(--border-color, #E4E1D9)",
          overflow: "hidden",
        }}
      >
        {/* Subtle background glow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(50% 50% at 80% 20%, rgba(155, 122, 63, 0.08), transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div className="public-container" style={{ position: "relative", zIndex: 5 }}>
          <div style={{ maxWidth: "820px" }}>
            <div className="eyebrow" style={{ marginBottom: "14px" }}>
              <span>About Vismaya Platform</span>
            </div>
            <h1
              className="about-title-heading"
              style={{
                fontFamily: "var(--font-heading), Georgia, serif",
                fontSize: "clamp(34px, 5vw, 56px)",
                fontWeight: 400,
                color: "var(--text-primary, #292C29)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                margin: "0 0 16px 0",
              }}
            >
              Transforming Entertainment Casting
            </h1>
            <p className="about-header-subtext" style={{ fontSize: "16px", lineHeight: "28px", color: "var(--text-secondary, #777970)", margin: 0 }}>
              Empowering artists and revolutionizing casting management across film, television, OTT, commercials, and fashion.
            </p>
          </div>
        </div>
      </section>

      {/* 2. MAIN CONTENT (DARK GLASS) */}
      <section className="public-section" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="public-container">
          <div className="about-main-gap" style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
            {/* Vision Box */}
            <div
              className="card-surface about-vision-card"
              style={{
                borderRadius: "20px",
                padding: "clamp(32px, 5vw, 48px)",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              <div className="eyebrow">
                <span>Our Vision</span>
              </div>

              <h2
                className="about-vision-heading"
                style={{
                  fontFamily: "var(--font-heading), Georgia, serif",
                  fontSize: "clamp(24px, 3.5vw, 34px)",
                  fontWeight: 400,
                  color: "var(--text-primary, #292C29)",
                  margin: 0,
                  lineHeight: 1.25,
                }}
              >
                Building the Future of Indian &amp; Global Entertainment Casting
              </h2>

              <p style={{ color: "var(--text-secondary, #777970)", fontSize: "15px", lineHeight: "26px", margin: 0 }}>
                Vismaya is engineered to bridge the fragmentation in traditional casting processes. We bring together actors, models, voice talents, casting directors, and production studios into a single synchronized digital environment.
              </p>

              <p style={{ color: "var(--text-secondary, #777970)", fontSize: "15px", lineHeight: "26px", margin: 0 }}>
                From discovering emerging talent in regional hubs to managing large-scale ensemble auditions for blockbuster features, Vismaya provides the infrastructure, verification tools, and management workflow for seamless collaboration.
              </p>
            </div>

            {/* Platform Pillars Grid */}
            <div>
              <div className="about-pillars-header" style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 40px auto" }}>
                <div className="eyebrow" style={{ marginBottom: "12px", justifyContent: "center" }}>
                  <span>Platform Pillars</span>
                </div>
                <h2
                  className="about-pillars-heading"
                  style={{
                    fontFamily: "var(--font-heading), Georgia, serif",
                    fontSize: "clamp(28px, 4vw, 38px)",
                    fontWeight: 400,
                    color: "var(--text-primary, #292C29)",
                    margin: "0 0 10px 0",
                  }}
                >
                  Why Industry Leaders Trust Vismaya
                </h2>
                <p style={{ color: "var(--text-secondary, #777970)", fontSize: "15px", lineHeight: "26px", margin: 0 }}>
                  Engineered with rigorous compliance, verified artist profiles, and encrypted audition delivery pipelines.
                </p>
              </div>

              <div
                className="about-pillars-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "24px",
                }}
              >
                {highlights.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="card-surface about-pillar-card"
                      style={{
                        padding: "32px 24px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        borderRadius: "var(--radius-card, 6px)",
                        minHeight: "220px",
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "var(--radius-btn, 4px)",
                          backgroundColor: "var(--gold-bg)",
                          border: "1px solid var(--gold-border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--gold)",
                        }}
                      >
                        <Icon size={22} />
                      </div>
                      <h3
                        style={{
                          fontFamily: "var(--font-heading), Georgia, serif",
                          fontSize: "20px",
                          fontWeight: 400,
                          color: "var(--text-primary, #292C29)",
                          margin: 0,
                        }}
                      >
                        {item.title}
                      </h3>
                      <p style={{ fontSize: "14px", color: "var(--text-secondary, #777970)", lineHeight: "22px", margin: 0 }}>
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom CTA Box */}
            <div
              className="glass about-cta-box"
              style={{
                borderRadius: "var(--radius-card, 6px)",
                padding: "clamp(32px, 5vw, 48px)",
                backgroundColor: "var(--bg-surface, #FFFFFF)",
                border: "1px solid var(--border-color, #E4E1D9)",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "24px",
              }}
            >
              <div style={{ maxWidth: "600px" }}>
                <h3
                  className="about-cta-heading"
                  style={{
                    fontFamily: "var(--font-heading), Georgia, serif",
                    fontSize: "clamp(22px, 3vw, 28px)",
                    fontWeight: 400,
                    margin: "0 0 8px 0",
                    color: "var(--text-primary, #292C29)",
                  }}
                >
                  Ready to Start Your Casting Journey?
                </h3>
                <p style={{ color: "var(--text-secondary, #777970)", fontSize: "15px", lineHeight: "24px", margin: 0 }}>
                  Join thousands of verified actors, models, casting directors, and certified studios on Vismaya today.
                </p>
              </div>

              <Link href="/register" className="btn-primary">
                <span>Create Free Account</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />

      <style jsx>{`
        @media (max-width: 640px) {
          :global(.about-header-section) {
            padding-top: 24px !important;
            padding-bottom: 24px !important;
          }
          :global(.about-title-heading) {
            font-size: 26px !important;
            line-height: 1.18 !important;
            margin-bottom: 10px !important;
          }
          :global(.about-header-subtext) {
            font-size: 14px !important;
            line-height: 1.55 !important;
          }
          :global(.about-main-gap) {
            gap: 24px !important;
          }
          :global(.about-vision-card) {
            padding: 18px 16px !important;
            gap: 12px !important;
            border-radius: 14px !important;
          }
          :global(.about-vision-heading) {
            font-size: 20px !important;
            line-height: 1.25 !important;
          }
          :global(.about-pillars-header) {
            margin-bottom: 18px !important;
          }
          :global(.about-pillars-heading) {
            font-size: 22px !important;
            line-height: 1.2 !important;
            margin-bottom: 6px !important;
          }
          :global(.about-pillars-grid) {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          :global(.about-pillar-card) {
            padding: 16px !important;
            min-height: auto !important;
            border-radius: 12px !important;
            gap: 10px !important;
          }
          :global(.about-cta-box) {
            padding: 18px 16px !important;
            gap: 14px !important;
            border-radius: 14px !important;
          }
          :global(.about-cta-heading) {
            font-size: 20px !important;
            line-height: 1.25 !important;
          }
          :global(.about-cta-box .btn-primary) {
            width: 100% !important;
            justify-content: center !important;
            height: 42px !important;
          }
        }
      `}</style>
    </div>
  );
}
