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

      {/* 1. TOP DARK HEADER */}
      <section
        style={{
          position: "relative",
          paddingTop: "clamp(120px, 15vh, 150px)",
          paddingBottom: "clamp(48px, 6vh, 64px)",
          backgroundColor: "#070b12",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          overflow: "hidden",
        }}
      >
        {/* Subtle background glow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(50% 50% at 80% 20%, rgba(255, 188, 0, 0.10), transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div className="public-container" style={{ position: "relative", zIndex: 5 }}>
          <div style={{ maxWidth: "820px" }}>
            <div className="eyebrow" style={{ marginBottom: "14px" }}>
              <span>About Vismaya Platform</span>
            </div>
            <h1
              style={{
                fontFamily: "var(--font-heading), 'Playfair Display', serif",
                fontSize: "clamp(34px, 5vw, 56px)",
                fontWeight: 700,
                color: "#eceaf5",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                margin: "0 0 16px 0",
              }}
            >
              Transforming Entertainment Casting
            </h1>
            <p style={{ fontSize: "16px", lineHeight: "28px", color: "#a3acc2", margin: 0 }}>
              Empowering artists and revolutionizing casting management across film, television, OTT, commercials, and fashion.
            </p>
          </div>
        </div>
      </section>

      {/* 2. MAIN CONTENT (DARK GLASS) */}
      <section className="public-section" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="public-container">
          <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
            {/* Vision Box */}
            <div
              className="card-surface"
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
                style={{
                  fontFamily: "var(--font-heading), 'Playfair Display', serif",
                  fontSize: "clamp(24px, 3.5vw, 34px)",
                  fontWeight: 700,
                  color: "#eceaf5",
                  margin: 0,
                  lineHeight: 1.25,
                }}
              >
                Building the Future of Indian &amp; Global Entertainment Casting
              </h2>

              <p style={{ color: "#a3acc2", fontSize: "15px", lineHeight: "26px", margin: 0 }}>
                Vismaya is engineered to bridge the fragmentation in traditional casting processes. We bring together actors, models, voice talents, casting directors, and production studios into a single synchronized digital environment.
              </p>

              <p style={{ color: "#a3acc2", fontSize: "15px", lineHeight: "26px", margin: 0 }}>
                From discovering emerging talent in regional hubs to managing large-scale ensemble auditions for blockbuster features, Vismaya provides the infrastructure, verification tools, and management workflow for seamless collaboration.
              </p>
            </div>

            {/* Platform Pillars Grid */}
            <div>
              <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 40px auto" }}>
                <div className="eyebrow" style={{ marginBottom: "12px", justifyContent: "center" }}>
                  <span>Platform Pillars</span>
                </div>
                <h2
                  style={{
                    fontFamily: "var(--font-heading), 'Playfair Display', serif",
                    fontSize: "clamp(28px, 4vw, 38px)",
                    fontWeight: 700,
                    color: "#eceaf5",
                    margin: "0 0 10px 0",
                  }}
                >
                  Why Industry Leaders Trust Vismaya
                </h2>
                <p style={{ color: "#a3acc2", fontSize: "15px", lineHeight: "26px", margin: 0 }}>
                  Engineered with rigorous compliance, verified artist profiles, and encrypted audition delivery pipelines.
                </p>
              </div>

              <div
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
                      className="card-surface"
                      style={{
                        padding: "32px 24px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        borderRadius: "20px",
                        minHeight: "220px",
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "14px",
                          backgroundColor: "rgba(255, 188, 0, 0.12)",
                          border: "1px solid rgba(255, 188, 0, 0.28)",
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
                          fontFamily: "var(--font-heading), 'Playfair Display', serif",
                          fontSize: "20px",
                          fontWeight: 700,
                          color: "#eceaf5",
                          margin: 0,
                        }}
                      >
                        {item.title}
                      </h3>
                      <p style={{ fontSize: "14px", color: "#a3acc2", lineHeight: "22px", margin: 0 }}>
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom CTA Box */}
            <div
              className="glass"
              style={{
                borderRadius: "20px",
                padding: "clamp(32px, 5vw, 48px)",
                background: "linear-gradient(135deg, #0f1626 0%, #070b12 100%)",
                border: "1px solid rgba(255, 188, 0, 0.30)",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "24px",
              }}
            >
              <div style={{ maxWidth: "600px" }}>
                <h3
                  style={{
                    fontFamily: "var(--font-heading), 'Playfair Display', serif",
                    fontSize: "clamp(22px, 3vw, 28px)",
                    fontWeight: 700,
                    margin: "0 0 8px 0",
                    color: "#eceaf5",
                  }}
                >
                  Ready to Start Your Casting Journey?
                </h3>
                <p style={{ color: "#a3acc2", fontSize: "15px", lineHeight: "24px", margin: 0 }}>
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
    </div>
  );
}
