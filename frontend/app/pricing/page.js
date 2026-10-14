"use client";

import React from "react";
import Link from "next/link";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import {
  Check,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  Film,
  UserCheck,
  CreditCard,
  Infinity,
  Clock,
} from "lucide-react";
import { PRICING_CONFIG } from "@/lib/config/pricing";

export default function PricingPage() {
  const talentFeatures = [
    "Official Vismaya verified comp-card & portfolio listing",
    "Submit applications to unlimited casting calls",
    "Receive direct digital audition & self-tape requests",
    "Industry standard privacy & casting protection",
    "Lifetime platform access — zero recurring subscriptions",
  ];

  const industryFeatures = [
    "100 included talent profile-view credits on registration",
    "Post unlimited casting calls & character breakdowns",
    "Access verified talent directory with smart filtering",
    "Request and review digital video audition self-tapes",
    "7-day free repeat window for previously unlocked profiles",
    "Credits never expire; top up extra views anytime",
  ];

  const faqs = [
    {
      q: "Is there any monthly or annual subscription fee?",
      a: "No. Vismaya operates on a pure one-time registration model. There are no recurring subscriptions, auto-debits, or surprise renewal charges.",
    },
    {
      q: "Do organization profile-view credits expire?",
      a: "Never. Your 100 included credits and any purchased bulk view packs remain in your studio ledger permanently until consumed.",
    },
    {
      q: "How does the 7-day repeat view window work?",
      a: "When your casting desk unlocks a candidate's full profile (1 credit), you can review their comp-card, showreels, and audition recordings repeatedly for 7 full days without using another credit.",
    },
    {
      q: "What are the rates for buying additional views?",
      a: "You can purchase individual profile views for ₹100 each, or a 25-view bundle for ₹2,000 (saving ₹500, at ₹80/view).",
    },
    {
      q: "What is your refund policy?",
      a: "Because registration immediately grants digital verification, casting pipeline access, and studio screening tools, all payments are non-refundable.",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", width: "100%", backgroundColor: "var(--bg-primary)" }}>
      <PublicNav />

      {/* Main Pricing Hero Header */}
      <section
        style={{
          paddingTop: "clamp(48px, 8vw, 84px)",
          paddingBottom: "clamp(36px, 6vw, 64px)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(50% 50% at 50% 30%, rgba(201, 165, 92, 0.09), transparent 75%)",
            pointerEvents: "none",
          }}
        />

        <div className="public-container" style={{ position: "relative", zIndex: 2 }}>
          <div className="eyebrow" style={{ marginBottom: "12px", justifyContent: "center" }}>
            <Sparkles size={14} style={{ color: "var(--gold)" }} />
            <span>Transparent Investment</span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-heading), Georgia, serif",
              fontSize: "clamp(32px, 5vw, 44px)",
              fontWeight: 400,
              color: "#2B2D2A",
              marginBottom: "14px",
              lineHeight: 1.2,
            }}
          >
            Simple, One-Time Platform Pricing
          </h1>

          <p
            style={{
              fontSize: "clamp(15px, 2vw, 17px)",
              color: "#5A584F",
              maxWidth: "620px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            No recurring subscriptions. No hidden cuts. Verified artists and accredited studios connect on transparent, one-time fees.
          </p>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section style={{ paddingBottom: "clamp(48px, 8vw, 80px)" }}>
        <div className="public-container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "28px",
              maxWidth: "960px",
              margin: "0 auto",
              alignItems: "stretch",
            }}
            className="pricing-cards-grid"
          >
            {/* Card 1: Talent */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                border: "1px solid #E8E2D4",
                padding: "clamp(28px, 4vw, 36px)",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 10px 30px rgba(43, 45, 42, 0.04)",
                position: "relative",
              }}
            >
              <div style={{ marginBottom: "20px" }}>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#8A6B2E",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  For Artists & Performers
                </span>
                <h3
                  style={{
                    fontFamily: "var(--font-heading), Georgia, serif",
                    fontSize: "26px",
                    fontWeight: 400,
                    color: "#2B2D2A",
                    margin: "0 0 10px",
                  }}
                >
                  Talent Membership
                </h3>
                <p style={{ fontSize: "14px", color: "#5A584F", margin: 0, lineHeight: 1.5 }}>
                  Everything you need to launch and safeguard your professional casting career.
                </p>
              </div>

              <div
                style={{
                  padding: "18px 0",
                  borderTop: "1px solid #E8E2D4",
                  borderBottom: "1px solid #E8E2D4",
                  marginBottom: "24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-heading), Georgia, serif",
                      fontSize: "42px",
                      fontWeight: 700,
                      color: "#8A6B2E",
                    }}
                  >
                    ₹{PRICING_CONFIG.TALENT_FEE.toLocaleString()}
                  </span>
                  <span style={{ fontSize: "14px", color: "#5A584F", fontWeight: "500" }}>
                    one-time fee
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#5A584F", marginTop: "4px" }}>
                  Zero renewal costs • Lifetime verified listing
                </div>
              </div>

              {/* What you get list */}
              <div style={{ flex: 1, marginBottom: "28px" }}>
                <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#2B2D2A", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "14px" }}>
                  What you get:
                </span>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                  {talentFeatures.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13.5px", color: "#2B2D2A", lineHeight: 1.45 }}>
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          backgroundColor: "#F3EFE6",
                          color: "#8A6B2E",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                      >
                        <Check size={12} strokeWidth={2.5} />
                      </div>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/register?role=talent"
                className="btn-primary"
                style={{
                  width: "100%",
                  height: "44px",
                  justifyContent: "center",
                  fontSize: "14.5px",
                  borderRadius: "6px",
                  textDecoration: "none",
                }}
              >
                <span>Register as Talent</span>
                <ArrowRight size={15} />
              </Link>
            </div>

            {/* Card 2: Industry / Organization */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                border: "2px solid #8A6B2E",
                padding: "clamp(28px, 4vw, 36px)",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 14px 40px rgba(138, 107, 46, 0.08)",
                position: "relative",
              }}
            >
              {/* Highlight Ribbon */}
              <div
                style={{
                  position: "absolute",
                  top: "-13px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "#8A6B2E",
                  color: "#FFFFFF",
                  padding: "4px 14px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: "600",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  boxShadow: "0 4px 12px rgba(138, 107, 46, 0.25)",
                  whiteSpace: "nowrap",
                }}
              >
                Includes 100 Profile-View Credits
              </div>

              <div style={{ marginBottom: "20px" }}>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#8A6B2E",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  For Studios & Casting Directors
                </span>
                <h3
                  style={{
                    fontFamily: "var(--font-heading), Georgia, serif",
                    fontSize: "26px",
                    fontWeight: 400,
                    color: "#2B2D2A",
                    margin: "0 0 10px",
                  }}
                >
                  Industry Studio Access
                </h3>
                <p style={{ fontSize: "14px", color: "#5A584F", margin: 0, lineHeight: 1.5 }}>
                  Comprehensive casting infrastructure with included applicant review credits.
                </p>
              </div>

              <div
                style={{
                  padding: "18px 0",
                  borderTop: "1px solid #E8E2D4",
                  borderBottom: "1px solid #E8E2D4",
                  marginBottom: "24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-heading), Georgia, serif",
                      fontSize: "42px",
                      fontWeight: 700,
                      color: "#8A6B2E",
                    }}
                  >
                    ₹{PRICING_CONFIG.INDUSTRY_FEE.toLocaleString()}
                  </span>
                  <span style={{ fontSize: "14px", color: "#5A584F", fontWeight: "500" }}>
                    one-time fee
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#8A6B2E", fontWeight: "600", marginTop: "4px" }}>
                  100 Credits Loaded Immediately • Zero Expiry
                </div>
              </div>

              {/* What you get list */}
              <div style={{ flex: 1, marginBottom: "28px" }}>
                <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#2B2D2A", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "14px" }}>
                  What you get:
                </span>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                  {industryFeatures.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13.5px", color: "#2B2D2A", lineHeight: 1.45 }}>
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          backgroundColor: "#F3EFE6",
                          color: "#8A6B2E",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                      >
                        <Check size={12} strokeWidth={2.5} />
                      </div>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/register?role=organization"
                className="btn-primary"
                style={{
                  width: "100%",
                  height: "44px",
                  justifyContent: "center",
                  fontSize: "14.5px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  backgroundColor: "#8A6B2E",
                }}
              >
                <span>Register as Organization</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Credit Packs Breakdown Strip */}
      <section style={{ backgroundColor: "#F3EFE6", padding: "clamp(32px, 5vw, 48px) 0", borderTop: "1px solid #E8E2D4", borderBottom: "1px solid #E8E2D4" }}>
        <div className="public-container" style={{ textAlign: "center" }}>
          <h3
            style={{
              fontFamily: "var(--font-heading), Georgia, serif",
              fontSize: "22px",
              fontWeight: 400,
              color: "#2B2D2A",
              marginBottom: "8px",
            }}
          >
            Need Extra Talent Profile Views?
          </h3>
          <p style={{ fontSize: "14px", color: "#5A584F", maxWidth: "600px", margin: "0 auto 24px" }}>
            Search and candidate preview cards are always free. Unlocking full contact details, self-tapes, and comp-cards consumes credits.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8E2D4",
                borderRadius: "10px",
                padding: "16px 24px",
                minWidth: "220px",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: "12px", color: "#5A584F", fontWeight: "600", textTransform: "uppercase" }}>Single View</div>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#8A6B2E", margin: "4px 0" }}>₹100</div>
              <div style={{ fontSize: "12px", color: "#5A584F" }}>1 candidate full comp-card unlock</div>
            </div>

            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "2px solid #8A6B2E",
                borderRadius: "10px",
                padding: "16px 24px",
                minWidth: "220px",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: "12px", color: "#8A6B2E", fontWeight: "600", textTransform: "uppercase" }}>Bundle Pack (25 Views)</div>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#8A6B2E", margin: "4px 0" }}>₹2,000</div>
              <div style={{ fontSize: "12px", color: "#5A584F" }}>₹80 / view (Save ₹500 • Never expires)</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section style={{ padding: "clamp(48px, 8vw, 80px) 0" }}>
        <div className="public-container" style={{ maxWidth: "800px" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h2
              style={{
                fontFamily: "var(--font-heading), Georgia, serif",
                fontSize: "28px",
                fontWeight: 400,
                color: "#2B2D2A",
                marginBottom: "8px",
              }}
            >
              Frequently Asked Questions
            </h2>
            <p style={{ fontSize: "14.5px", color: "#5A584F", margin: 0 }}>
              Everything you need to know about Vismaya platform pricing and credit policies.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {faqs.map((faq) => (
              <div
                key={faq.q}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8E2D4",
                  borderRadius: "10px",
                  padding: "20px 24px",
                }}
              >
                <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#2B2D2A", margin: "0 0 8px" }}>
                  {faq.q}
                </h4>
                <p style={{ fontSize: "14px", color: "#5A584F", margin: 0, lineHeight: 1.55 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
