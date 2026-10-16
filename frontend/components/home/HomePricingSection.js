"use client";

import React from "react";
import Link from "next/link";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { PRICING_CONFIG } from "@/lib/config/pricing";

export default function HomePricingSection() {
  return (
    <section
      style={{
        padding: "clamp(48px, 6vw, 72px) 0",
        backgroundColor: "#FAF9F7",
        borderTop: "1px solid #E8E2D4",
        position: "relative",
      }}
    >
      <div className="public-container">
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div className="eyebrow" style={{ marginBottom: "10px", justifyContent: "center" }}>
            <Sparkles size={14} style={{ color: "var(--gold)" }} />
            <span>Transparent Investment</span>
          </div>
          <h2
            style={{
              fontFamily: "var(--font-heading), Georgia, serif",
              fontSize: "clamp(26px, 4vw, 34px)",
              fontWeight: 400,
              color: "#2B2D2A",
              marginBottom: "8px",
            }}
          >
            One-Time Access. No Subscriptions.
          </h2>
          <p style={{ fontSize: "14.5px", color: "#5A584F", maxWidth: "560px", margin: "0 auto" }}>
            Choose your portal and join India&apos;s verified entertainment network with pure one-time access.
          </p>
        </div>

        {/* 2 Compact Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
            maxWidth: "840px",
            margin: "0 auto",
          }}
        >
          {/* Talent Card */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E2D4",
              borderRadius: "12px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 4px 20px rgba(43, 45, 42, 0.03)",
            }}
          >
            <div style={{ marginBottom: "16px" }}>
              <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#8A6B2E", letterSpacing: "0.06em" }}>
                Talent Portal
              </span>
              <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#2B2D2A", margin: "4px 0" }}>
                Artist Membership
              </h3>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "10px" }}>
                <span style={{ fontFamily: "var(--font-heading), Georgia, serif", fontSize: "32px", fontWeight: 700, color: "#8A6B2E" }}>
                  ₹{PRICING_CONFIG.TALENT_FEE.toLocaleString()}
                </span>
                <span style={{ fontSize: "13px", color: "#5A584F" }}>one-time lifetime</span>
              </div>
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
              <li style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#2B2D2A" }}>
                <Check size={14} style={{ color: "#8A6B2E" }} />
                <span>Verified comp-card & portfolio listing</span>
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#2B2D2A" }}>
                <Check size={14} style={{ color: "#8A6B2E" }} />
                <span>Apply to unlimited casting calls</span>
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#2B2D2A" }}>
                <Check size={14} style={{ color: "#8A6B2E" }} />
                <span>Direct digital audition self-tape requests</span>
              </li>
            </ul>

            <Link
              href="/register?role=talent"
              className="btn-primary"
              style={{
                width: "100%",
                height: "42px",
                justifyContent: "center",
                fontSize: "13.5px",
                borderRadius: "6px",
                textDecoration: "none",
              }}
            >
              <span>Register as Talent</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Industry Card */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "2px solid #8A6B2E",
              borderRadius: "12px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 8px 24px rgba(138, 107, 46, 0.08)",
              position: "relative",
            }}
          >
            <div style={{ marginBottom: "16px" }}>
              <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#8A6B2E", letterSpacing: "0.06em" }}>
                Organization Portal
              </span>
              <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#2B2D2A", margin: "4px 0" }}>
                Studio Casting Desk
              </h3>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "10px" }}>
                <span style={{ fontFamily: "var(--font-heading), Georgia, serif", fontSize: "32px", fontWeight: 700, color: "#8A6B2E" }}>
                  ₹{PRICING_CONFIG.INDUSTRY_FEE.toLocaleString()}
                </span>
                <span style={{ fontSize: "13px", color: "#5A584F" }}>one-time fee</span>
              </div>
              <div style={{ fontSize: "11.5px", color: "#8A6B2E", fontWeight: "600", marginTop: "2px" }}>
                ★ Includes 100 Profile-View Credits
              </div>
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
              <li style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#2B2D2A" }}>
                <Check size={14} style={{ color: "#8A6B2E" }} />
                <span>100 candidate profile-view credits</span>
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#2B2D2A" }}>
                <Check size={14} style={{ color: "#8A6B2E" }} />
                <span>Post unlimited verified casting calls</span>
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#2B2D2A" }}>
                <Check size={14} style={{ color: "#8A6B2E" }} />
                <span>7-day free repeat window for unlocked profiles</span>
              </li>
            </ul>

            <Link
              href="/register?role=organization"
              className="btn-primary"
              style={{
                width: "100%",
                height: "42px",
                justifyContent: "center",
                fontSize: "13.5px",
                borderRadius: "6px",
                textDecoration: "none",
                backgroundColor: "#8A6B2E",
              }}
            >
              <span>Register as Organization</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Link to Full Pricing */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <Link
            href="/pricing"
            style={{
              fontSize: "13.5px",
              color: "#8A6B2E",
              fontWeight: "600",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>View Full Pricing, Credit Packs & FAQs</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
