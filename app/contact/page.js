"use client";

import Link from "next/link";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { Mail, Phone, MapPin, Send, MessageSquare, Sparkles } from "lucide-react";

export default function ContactPage() {
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
              <span>Contact &amp; Operations Support</span>
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
              Get in Touch with Vismaya
            </h1>
            <p style={{ fontSize: "16px", lineHeight: "28px", color: "#a3acc2", margin: 0 }}>
              Have questions about talent verification, enterprise studio onboarding, or need audition assistance? Our operations desk is available.
            </p>
          </div>
        </div>
      </section>

      {/* 2. MAIN CONTENT (DARK GLASS) */}
      <section className="public-section" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="public-container">
          <div
            className="contact-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.15fr",
              gap: "32px",
              alignItems: "stretch",
            }}
          >
            {/* Left Card: Direct Contact Info */}
            <div
              className="card-surface"
              style={{
                borderRadius: "20px",
                padding: "clamp(28px, 4vw, 40px)",
                display: "flex",
                flexDirection: "column",
                gap: "28px",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div className="eyebrow" style={{ marginBottom: "10px" }}>
                  <span>Direct Channels</span>
                </div>
                <h2
                  style={{
                    fontFamily: "var(--font-heading), 'Playfair Display', serif",
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#eceaf5",
                    margin: "0 0 10px 0",
                  }}
                >
                  Helpdesk &amp; Offices
                </h2>
                <p style={{ fontSize: "14px", color: "#a3acc2", lineHeight: "24px", margin: 0 }}>
                  We support actors, voice talent, casting directors, and production studios across Mumbai, Delhi, and international hubs.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      backgroundColor: "rgba(255, 188, 0, 0.12)",
                      border: "1px solid rgba(255, 188, 0, 0.28)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--gold)",
                      flexShrink: 0,
                    }}
                  >
                    <Mail size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#a3acc2", display: "block", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Email Inquiries
                    </span>
                    <span style={{ fontSize: "15px", color: "#eceaf5", fontWeight: "700" }}>
                      support@vismaya.io
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      backgroundColor: "rgba(255, 188, 0, 0.12)",
                      border: "1px solid rgba(255, 188, 0, 0.28)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--gold)",
                      flexShrink: 0,
                    }}
                  >
                    <Phone size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#a3acc2", display: "block", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Phone &amp; WhatsApp Desk
                    </span>
                    <span style={{ fontSize: "15px", color: "#eceaf5", fontWeight: "700" }}>
                      +91 (022) 4892-0000
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      backgroundColor: "rgba(255, 188, 0, 0.12)",
                      border: "1px solid rgba(255, 188, 0, 0.28)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--gold)",
                      flexShrink: 0,
                    }}
                  >
                    <MapPin size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#a3acc2", display: "block", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Headquarters
                    </span>
                    <span style={{ fontSize: "14px", color: "#eceaf5", fontWeight: "600", lineHeight: "22px", display: "block" }}>
                      Film City Complex, Goregaon East, Mumbai, Maharashtra 400065
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Message Form */}
            <div
              className="card-surface"
              style={{
                borderRadius: "20px",
                padding: "clamp(28px, 4vw, 40px)",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: "var(--font-heading), 'Playfair Display', serif",
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "#eceaf5",
                    margin: "0 0 6px 0",
                  }}
                >
                  Send Us a Message
                </h3>
                <p style={{ fontSize: "14px", color: "#a3acc2", margin: 0 }}>
                  Fill in your query below and our operations team will respond within 24 hours.
                </p>
              </div>

              <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#a3acc2", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Kapoor"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#a3acc2", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="you@domain.com"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#a3acc2", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Message
                  </label>
                  <textarea
                    rows={4}
                    placeholder="How can our casting desk help you?"
                  />
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", marginTop: "4px" }}
                >
                  <span>Submit Message</span>
                  <Send size={15} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />

      <style jsx>{`
        @media (max-width: 900px) {
          .contact-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
