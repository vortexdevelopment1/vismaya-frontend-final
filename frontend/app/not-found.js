"use client";

import React from "react";
import Link from "next/link";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        backgroundColor: "#FAF9F7",
      }}
    >
      <PublicNav />

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(40px, 6vh, 80px) 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            maxWidth: "520px",
            width: "100%",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            borderRadius: "16px",
            padding: "clamp(32px, 6vw, 48px) clamp(24px, 4vw, 36px)",
            boxShadow: "0 4px 24px rgba(43, 45, 42, 0.05)",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "#F3EFE6",
              color: "#8A6B2E",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 20px auto",
            }}
          >
            <Compass size={28} />
          </div>

          <span
            style={{
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#8A6B2E",
              display: "block",
              marginBottom: "8px",
            }}
          >
            404 Error • Page Not Found
          </span>

          <h1
            style={{
              fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
              fontSize: "clamp(26px, 4vw, 34px)",
              fontWeight: 600,
              color: "#2B2D2A",
              margin: "0 0 12px 0",
              lineHeight: 1.2,
            }}
          >
            Scene Out of Frame
          </h1>

          <p
            style={{
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              fontSize: "15px",
              lineHeight: 1.6,
              color: "#5A584F",
              margin: "0 0 28px 0",
            }}
          >
            The production page or talent opportunity you requested doesn&apos;t exist or has moved to a new set.
          </p>

          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              backgroundColor: "#8A6B2E",
              color: "#FFFFFF",
              border: "1px solid #755B25",
              borderRadius: "8px",
              height: "44px",
              padding: "0 24px",
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(138, 107, 46, 0.2)",
              transition: "all 200ms ease",
            }}
          >
            <ArrowLeft size={15} />
            <span>Return to Stage</span>
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
