"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import {
  Scale,
  ShieldCheck,
  Search,
  Printer,
  ChevronRight,
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  Lock,
} from "lucide-react";
import { TERMS_AND_CONDITIONS_SECTIONS, LEGAL_METADATA } from "@/lib/config/legalPolicies";

export default function TermsAndConditionsPage() {
  const [activeSection, setActiveSection] = useState(TERMS_AND_CONDITIONS_SECTIONS[0].id);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = TERMS_AND_CONDITIONS_SECTIONS.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q);
  });

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90; // offset for fixed navbar
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      for (const section of TERMS_AND_CONDITIONS_SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="v-legal-page-root" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-primary, #FAF9F6)" }}>
      <PublicNav />

      {/* Header Banner */}
      <header
        style={{
          backgroundColor: "#F2EFE8",
          borderBottom: "1px solid #E4E0D5",
          padding: "clamp(36px, 5vw, 64px) 0 clamp(28px, 4vw, 48px) 0",
          position: "relative",
        }}
      >
        <div className="public-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ maxWidth: "880px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                borderRadius: "20px",
                backgroundColor: "rgba(138, 107, 46, 0.12)",
                border: "1px solid rgba(138, 107, 46, 0.3)",
                color: "#8A6B2E",
                fontSize: "12.5px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "16px",
              }}
            >
              <Scale size={16} />
              <span>Platform Terms &amp; Community Standards</span>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-heading), Georgia, serif",
                fontSize: "clamp(32px, 4.5vw, 48px)",
                fontWeight: 700,
                color: "#2B2D2A",
                lineHeight: 1.15,
                margin: "0 0 14px 0",
              }}
            >
              Terms &amp; Conditions
            </h1>

            <p style={{ fontSize: "16px", lineHeight: "26px", color: "#5A584F", margin: "0 0 20px 0" }}>
              General terms of service, commercial fee schedules, profile-view credit guidelines, casting workflow rules, and community conduct standards governing the Vismaya platform.
            </p>

            {/* Version & Date Metadata */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "16px",
                fontSize: "13px",
                color: "#77756B",
                paddingTop: "8px",
                borderTop: "1px solid #E4E0D5",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Scale size={14} style={{ color: "#8A6B2E" }} />
                <span>Version {LEGAL_METADATA.version} (Master Release)</span>
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Calendar size={14} style={{ color: "#8A6B2E" }} />
                <span>Effective Date: {LEGAL_METADATA.effectiveDate}</span>
              </span>
              <span>Jurisdiction: {LEGAL_METADATA.jurisdiction}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar Table of Contents */}
      <main style={{ flex: 1, padding: "48px 0 80px 0" }}>
        <div className="public-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
          
          {/* Pending Legal Counsel Notice Banner */}
          <div
            style={{
              backgroundColor: "#FFF9E6",
              border: "1px solid #F0D078",
              borderRadius: "12px",
              padding: "16px 20px",
              marginBottom: "36px",
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
            }}
          >
            <AlertCircle size={20} color="#8A6B2E" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ fontSize: "13.5px", color: "#5A584F", lineHeight: "22px" }}>
              <strong style={{ color: "#2B2D2A" }}>Master Specification Notice: </strong>
              {LEGAL_METADATA.statusNote} All commercial fees (Talent ₹999 / Industry ₹4,999) and credit parameters reflect approved product specifications. Official inquiries may be sent to{" "}
              <a href={`mailto:${LEGAL_METADATA.legalEmail}`} style={{ color: "#8A6B2E", fontWeight: 600, textDecoration: "underline" }}>
                {LEGAL_METADATA.legalEmail}
              </a>.
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "300px minmax(0, 1fr)",
              gap: "40px",
              alignItems: "start",
            }}
            className="v-legal-grid"
          >
            {/* Left Column: Sticky Table of Contents */}
            <aside
              style={{
                position: "sticky",
                top: "96px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8E4DA",
                borderRadius: "14px",
                padding: "20px",
                boxShadow: "0 4px 16px rgba(43, 45, 42, 0.03)",
              }}
              className="v-legal-sidebar"
            >
              {/* Search within terms */}
              <div style={{ position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: "12px", top: "11px", color: "#8A877E" }} />
                <input
                  type="text"
                  placeholder="Search in terms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    height: "38px",
                    padding: "0 12px 0 36px",
                    borderRadius: "8px",
                    border: "1px solid #DDD8CD",
                    fontSize: "13px",
                    backgroundColor: "#FAF9F6",
                    color: "#2B2D2A",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #EFECE6", paddingBottom: "10px" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#8A6B2E", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  All Sections ({filteredSections.length})
                </span>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="btn-print"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "12px",
                    color: "#5A584F",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 8px",
                    borderRadius: "6px",
                  }}
                  title="Print Terms"
                >
                  <Printer size={13} />
                  <span>Print</span>
                </button>
              </div>

              {/* Navigation Links */}
              <nav style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
                {filteredSections.map((sec) => {
                  const isActive = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => scrollToSection(sec.id)}
                      style={{
                        textAlign: "left",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        lineHeight: "1.4",
                        border: "none",
                        backgroundColor: isActive ? "rgba(138, 107, 46, 0.12)" : "transparent",
                        color: isActive ? "#8A6B2E" : "#5A584F",
                        fontWeight: isActive ? "700" : "500",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {sec.title}
                      </span>
                      {isActive && <ChevronRight size={14} style={{ flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </nav>

              <div style={{ borderTop: "1px solid #EFECE6", paddingTop: "12px", fontSize: "12px", color: "#8A877E" }}>
                Related:{" "}
                <Link href="/privacy" style={{ color: "#8A6B2E", fontWeight: "600", textDecoration: "underline" }}>
                  Privacy Policy
                </Link>
              </div>
            </aside>

            {/* Right Column: Policy Section Content */}
            <article style={{ display: "flex", flexDirection: "column", gap: "40px" }} className="v-legal-content">
              {filteredSections.map((sec) => (
                <section
                  key={sec.id}
                  id={sec.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E8E4DA",
                    borderRadius: "16px",
                    padding: "36px clamp(20px, 4vw, 40px)",
                    boxShadow: "0 2px 12px rgba(43, 45, 42, 0.02)",
                    scrollMarginTop: "90px",
                  }}
                >
                  <h2
                    style={{
                      fontFamily: "var(--font-heading), Georgia, serif",
                      fontSize: "24px",
                      fontWeight: "700",
                      color: "#2B2D2A",
                      borderBottom: "1px solid #F0ECE3",
                      paddingBottom: "16px",
                      margin: "0 0 20px 0",
                    }}
                  >
                    {sec.title}
                  </h2>

                  <div
                    style={{
                      fontSize: "15px",
                      lineHeight: "26px",
                      color: "#3F3D35",
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                    }}
                    className="v-legal-markdown"
                  >
                    {sec.content.split("\n\n").map((paragraph, pIdx) => {
                      const trimmed = paragraph.trim();
                      if (!trimmed) return null;

                      // Bullet list formatting
                      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
                        const items = trimmed.split("\n").filter((i) => i.trim().length > 0);
                        return (
                          <ul key={pIdx} style={{ margin: "6px 0", paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                            {items.map((item, itemIdx) => {
                              const cleanItem = item.replace(/^[*\-]\s+/, "");
                              return (
                                <li key={itemIdx} style={{ lineHeight: "24px" }}>
                                  {formatInlineMarkdown(cleanItem)}
                                </li>
                              );
                            })}
                          </ul>
                        );
                      }

                      return <p key={pIdx} style={{ margin: 0 }}>{formatInlineMarkdown(trimmed)}</p>;
                    })}
                  </div>
                </section>
              ))}

              {filteredSections.length === 0 && (
                <div style={{ padding: "64px 24px", textAlign: "center", backgroundColor: "#FFFFFF", borderRadius: "14px", border: "1px solid #E8E4DA" }}>
                  <p style={{ fontSize: "16px", color: "#5A584F" }}>No terms sections found matching &quot;{searchQuery}&quot;.</p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="btn-secondary"
                    style={{ marginTop: "12px", height: "36px", padding: "0 18px", fontSize: "13px" }}
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </article>
          </div>
        </div>
      </main>

      <PublicFooter />

      <style jsx global>{`
        @media (max-width: 991.98px) {
          .v-legal-grid {
            grid-template-columns: 1fr !important;
          }
          .v-legal-sidebar {
            position: relative !important;
            top: 0 !important;
          }
        }
        @media print {
          nav, footer, .v-legal-sidebar, .btn-print {
            display: none !important;
          }
          .v-legal-grid {
            display: block !important;
          }
          body {
            background-color: #fff !important;
            color: #000 !important;
          }
        }
      `}</style>
    </div>
  );
}

// Simple markdown bold and link formatter
function formatInlineMarkdown(text) {
  const parts = text.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} style={{ color: "#2B2D2A" }}>{part.slice(2, -2)}</strong>;
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a key={index} href={linkMatch[2]} style={{ color: "#8A6B2E", fontWeight: 600, textDecoration: "underline" }}>
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}
