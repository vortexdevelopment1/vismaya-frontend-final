"use client";

import Link from "next/link";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { Mail, Phone, MapPin, Send, MessageSquare, Sparkles } from "lucide-react";

export default function ContactPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", width: "100%", backgroundColor: "var(--bg-primary)" }}>
      <PublicNav />

      {/* 1. TOP HEADER */}
      <section
        style={{
          position: "relative",
          paddingTop: "clamp(28px, 4vw, 48px)",
          paddingBottom: "clamp(48px, 6vh, 64px)",
          backgroundColor: "var(--bg-alt, #F0EEE7)",
          borderBottom: "1px solid var(--border-color, #E4E1D9)",
          overflow: "hidden",
        }}
      >
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
              <span>Contact &amp; Operations Support</span>
            </div>
            <h1
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
              Get in Touch with Vismaya
            </h1>
            <p style={{ fontSize: "16px", lineHeight: "28px", color: "var(--text-secondary, #777970)", margin: 0 }}>
              Have questions about talent verification, enterprise studio onboarding, or need audition assistance? Our operations desk is available.
            </p>
          </div>
        </div>
      </section>

      {/* 2. MAIN CONTENT */}
      <section className="public-section" style={{ backgroundColor: "#FAF9F7", padding: "clamp(36px, 5vw, 64px) 0" }}>
        <div className="public-container">
          <div
            className="contact-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.15fr)",
              gap: "32px",
              alignItems: "start",
            }}
          >
            {/* Left Card: Direct Contact Info (Compact, no stretch) */}
            <div
              className="contact-info-card"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8E2D4",
                borderRadius: "16px",
                padding: "40px",
                display: "flex",
                flexDirection: "column",
                gap: "32px",
                boxShadow: "0 4px 20px rgba(43, 45, 42, 0.04)",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: "#8A6B2E",
                    marginBottom: "8px",
                  }}
                >
                  Direct Channels
                </div>
                <h2
                  style={{
                    fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                    fontSize: "26px",
                    fontWeight: 600,
                    color: "#2B2D2A",
                    margin: "0 0 10px 0",
                    lineHeight: 1.25,
                  }}
                >
                  Helpdesk &amp; Offices
                </h2>
                <p style={{ fontSize: "14px", color: "#5A584F", lineHeight: "24px", margin: 0 }}>
                  We support actors, voice talent, casting directors, and production studios across Mumbai, Delhi, and international hubs.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      backgroundColor: "#F3EFE6",
                      border: "1px solid #E8E2D4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#8A6B2E",
                      flexShrink: 0,
                    }}
                  >
                    <Mail size={20} />
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#5A584F", display: "block", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.10em" }}>
                      Email Inquiries
                    </span>
                    <span style={{ fontSize: "17px", color: "#2B2D2A", fontWeight: "600", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
                      support@vismaya.io
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      backgroundColor: "#F3EFE6",
                      border: "1px solid #E8E2D4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#8A6B2E",
                      flexShrink: 0,
                    }}
                  >
                    <Phone size={20} />
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#5A584F", display: "block", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.10em" }}>
                      Phone &amp; WhatsApp Desk
                    </span>
                    <span style={{ fontSize: "17px", color: "#2B2D2A", fontWeight: "600", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
                      +91 (022) 4892-0000
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      backgroundColor: "#F3EFE6",
                      border: "1px solid #E8E2D4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#8A6B2E",
                      flexShrink: 0,
                    }}
                  >
                    <MapPin size={20} />
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#5A584F", display: "block", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.10em" }}>
                      Headquarters
                    </span>
                    <span style={{ fontSize: "15px", color: "#2B2D2A", fontWeight: "600", lineHeight: "22px", display: "block", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
                      Film City Complex, Goregaon East, Mumbai, Maharashtra 400065
                    </span>
                  </div>
                </div>
              </div>

              {/* Working hours note */}
              <div
                style={{
                  paddingTop: "18px",
                  borderTop: "1px solid #E8E2D4",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "12.5px",
                  color: "#5A584F",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#8A6B2E",
                    flexShrink: 0,
                  }}
                />
                <span>
                  <strong>Desk Hours:</strong> Mon &ndash; Sat, 10:00 &ndash; 19:00 IST &bull; Response within 24 hours
                </span>
              </div>
            </div>

            {/* Right Card: Message Form */}
            <div
              className="contact-form-card"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8E2D4",
                borderRadius: "16px",
                padding: "40px",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                boxShadow: "0 4px 20px rgba(43, 45, 42, 0.04)",
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                    fontSize: "24px",
                    fontWeight: 600,
                    color: "#2B2D2A",
                    margin: "0 0 6px 0",
                  }}
                >
                  Send Us a Message
                </h3>
                <p style={{ fontSize: "14px", color: "#5A584F", margin: 0 }}>
                  Fill in your query below and our operations team will respond within 24 hours.
                </p>
              </div>

              <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#2B2D2A", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Kapoor"
                    style={{
                      width: "100%",
                      height: "44px",
                      padding: "0 14px",
                      borderRadius: "10px",
                      border: "1px solid #E8E2D4",
                      backgroundColor: "#FAF9F7",
                      color: "#2B2D2A",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 0.15s ease",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#2B2D2A", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="you@domain.com"
                    style={{
                      width: "100%",
                      height: "44px",
                      padding: "0 14px",
                      borderRadius: "10px",
                      border: "1px solid #E8E2D4",
                      backgroundColor: "#FAF9F7",
                      color: "#2B2D2A",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 0.15s ease",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#2B2D2A", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Message
                  </label>
                  <textarea
                    rows={4}
                    placeholder="How can our casting desk help you?"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      border: "1px solid #E8E2D4",
                      backgroundColor: "#FAF9F7",
                      color: "#2B2D2A",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                      resize: "vertical",
                      transition: "border-color 0.15s ease",
                      fontFamily: "var(--font-body), 'Inter', sans-serif",
                    }}
                  />
                </div>

                <button
                  type="button"
                  style={{
                    width: "100%",
                    height: "44px",
                    minHeight: "44px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    borderRadius: "10px",
                    backgroundColor: "#8A6B2E",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(138, 107, 46, 0.25)",
                    transition: "background-color 0.15s ease",
                  }}
                  className="contact-submit-btn"
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
        .contact-submit-btn:hover {
          background-color: #6E5420 !important;
        }
        @media (max-width: 900px) {
          .contact-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .contact-info-card,
          .contact-form-card {
            padding: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}
