"use client";

import React, { useState } from "react";
import Link from "next/link";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import {
  ShieldCheck,
  CheckCircle2,
  Award,
  Lock,
  UserCheck,
  Building2,
  ArrowRight,
  Clock,
  Sparkles,
  Shield,
  FileCheck2,
  ChevronDown,
  EyeOff,
  Scale,
} from "lucide-react";

export default function KycVerificationPublicPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: "Why is KYC verification mandatory for casting on Vismaya?",
      a: "The Indian entertainment industry has historically suffered from unauthorized middlemen, fraudulent auditions, and impersonation. Vismaya enforces strict verification so that artists can audition in a safe, legitimate ecosystem and production studios receive genuine, authentic talent submissions.",
    },
    {
      q: "Are my government identity documents visible to casting directors or recruiters?",
      a: "Never. Your government ID (Aadhaar, Passport, etc.), selfie evidence, and business registration certificates are strictly encrypted and accessible only to the Vismaya Compliance & Trust Operations desk. Casting directors only see your verified badge, your artistic name, and your approved showreel.",
    },
    {
      q: "What is the difference between the Identity Badge and Professional Badge?",
      a: "The Identity Badge (Blue) verifies your legal name, 18+ eligibility, and authentic persona using government identification. The Professional Badge (Gold / Pro) verifies your industry credits, IMDb filmography, guild memberships (e.g., CINTAA), or released theatrical/commercial work.",
    },
    {
      q: "How long does the KYC verification process take?",
      a: "With our upcoming automated Aadhaar OTP verification, identity confirmation is completed in seconds. For manual document uploads and professional credit vetting, our compliance team reviews submissions within 24 to 48 business hours.",
    },
    {
      q: "Can I still submit applications to casting opportunities without verification?",
      a: "You can create a profile and apply to open casting notices; however, verified profiles are badged with certified authenticity, get indexed first in casting director talent searches, and enjoy significantly higher audition callback rates.",
    },
    {
      q: "Does my verified status ever expire?",
      a: "No. Once approved, your verified badge remains active as long as your account is in good standing. Re-verification is only required if you update critical legal identity information (such as your legal name or date of birth).",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--bg-primary, #FAF9F6)",
      }}
    >
      <PublicNav />

      {/* 1. TOP HEADER BANNER */}
      <header
        style={{
          backgroundColor: "#F2EFE8",
          borderBottom: "1px solid #E4E0D5",
          padding: "clamp(36px, 5vw, 64px) 0 clamp(28px, 4vw, 48px) 0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(55% 55% at 80% 20%, rgba(138, 107, 46, 0.08), transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div className="public-container" style={{ position: "relative", zIndex: 2 }}>
          <div style={{ maxWidth: "860px" }}>
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
                letterSpacing: "0.08em",
                marginBottom: "16px",
              }}
            >
              <ShieldCheck size={16} />
              <span>Vismaya Trust, Safety &amp; Verification Protocol</span>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                fontSize: "clamp(32px, 4.5vw, 50px)",
                fontWeight: 600,
                color: "#2B2D2A",
                lineHeight: 1.15,
                margin: "0 0 14px 0",
                letterSpacing: "-0.01em",
              }}
            >
              KYC &amp; Platform Verification Standards
            </h1>

            <p style={{ fontSize: "16px", lineHeight: "26px", color: "#5A584F", margin: "0 0 24px 0" }}>
              How Vismaya guarantees authenticity, eliminates audition exploitation, and protects both artists and certified production studios through rigorous multi-tier identity vetting.
            </p>

            {/* Quick Feature Badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#2B2D2A",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8E2D4",
                  padding: "6px 12px",
                  borderRadius: "6px",
                }}
              >
                <Lock size={14} style={{ color: "#8A6B2E" }} />
                <span>100% Encrypted Documents</span>
              </div>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#2B2D2A",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8E2D4",
                  padding: "6px 12px",
                  borderRadius: "6px",
                }}
              >
                <EyeOff size={14} style={{ color: "#8A6B2E" }} />
                <span>Zero Public Document Exposure</span>
              </div>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#2B2D2A",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8E2D4",
                  padding: "6px 12px",
                  borderRadius: "6px",
                }}
              >
                <Scale size={14} style={{ color: "#8A6B2E" }} />
                <span>DPDP Act 2023 Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN BODY CONTENT */}
      <main style={{ flex: 1, padding: "clamp(48px, 6vw, 72px) 0 80px 0" }}>
        <div className="public-container">
          <div style={{ display: "flex", flexDirection: "column", gap: "56px" }}>

            {/* SECTION 1: TWO-TIER VERIFICATION FRAMEWORK FOR TALENT */}
            <div>
              <div style={{ marginBottom: "28px" }}>
                <div className="eyebrow" style={{ marginBottom: "8px" }}>
                  <span>Talent Credentialing</span>
                </div>
                <h2
                  style={{
                    fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                    fontSize: "clamp(26px, 3.5vw, 36px)",
                    fontWeight: 500,
                    color: "#2B2D2A",
                    margin: "0 0 10px 0",
                  }}
                >
                  Two Independent Verification Badges
                </h2>
                <p style={{ color: "#5A584F", fontSize: "15px", lineHeight: "25px", margin: 0, maxWidth: "760px" }}>
                  Aspiring artists and seasoned professionals have distinct verification needs. Vismaya separates legal identity verification from professional credit vetting so every talent is evaluated with absolute fairness.
                </p>
              </div>

              {/* 2 Cards Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "28px",
                }}
              >
                {/* Card 1: Identity Verified */}
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E8E2D4",
                    borderRadius: "14px",
                    padding: "clamp(28px, 4vw, 36px)",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 4px 16px rgba(43, 45, 42, 0.03)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "10px",
                        backgroundColor: "rgba(138, 107, 46, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#8A6B2E",
                      }}
                    >
                      <UserCheck size={24} />
                    </div>
                    <span
                      style={{
                        backgroundColor: "#EBF3FF",
                        color: "#0066CC",
                        border: "1px solid #C2DCFF",
                        fontSize: "12px",
                        fontWeight: "700",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <CheckCircle2 size={13} /> Blue Badge
                    </span>
                  </div>

                  <h3
                    style={{
                      fontFamily: "var(--font-heading), Georgia, serif",
                      fontSize: "22px",
                      fontWeight: 500,
                      color: "#2B2D2A",
                      margin: "0 0 10px 0",
                    }}
                  >
                    1. Identity Verification (KYC)
                  </h3>
                  <p style={{ color: "#5A584F", fontSize: "14.5px", lineHeight: "24px", margin: "0 0 20px 0", flex: 1 }}>
                    Confirms that you are a genuine individual aged 18 or above, preventing profile duplication, fraud, and impersonation on the platform.
                  </p>

                  <div style={{ borderTop: "1px solid #F0ECE3", paddingTop: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#8A6B2E" }}>
                      Accepted Evidence
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: "#2B2D2A" }}>
                      <CheckCircle2 size={15} style={{ color: "#2E7D32", flexShrink: 0 }} />
                      <span>Government ID (Aadhaar, Passport, Voter ID, Driving License)</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: "#2B2D2A" }}>
                      <CheckCircle2 size={15} style={{ color: "#2E7D32", flexShrink: 0 }} />
                      <span>Live selfie capture to confirm matching photograph</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: "#2B2D2A" }}>
                      <CheckCircle2 size={15} style={{ color: "#2E7D32", flexShrink: 0 }} />
                      <span>Available to all artists including new and aspiring talents</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Professional Verified */}
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E8E2D4",
                    borderRadius: "14px",
                    padding: "clamp(28px, 4vw, 36px)",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 4px 16px rgba(43, 45, 42, 0.03)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "10px",
                        backgroundColor: "rgba(138, 107, 46, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#8A6B2E",
                      }}
                    >
                      <Award size={24} />
                    </div>
                    <span
                      style={{
                        backgroundColor: "#FFF8E6",
                        color: "#8A6B2E",
                        border: "1px solid #F0D078",
                        fontSize: "12px",
                        fontWeight: "700",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Sparkles size={13} /> Gold Pro Badge
                    </span>
                  </div>

                  <h3
                    style={{
                      fontFamily: "var(--font-heading), Georgia, serif",
                      fontSize: "22px",
                      fontWeight: 500,
                      color: "#2B2D2A",
                      margin: "0 0 10px 0",
                    }}
                  >
                    2. Professional Credit Verification
                  </h3>
                  <p style={{ color: "#5A584F", fontSize: "14.5px", lineHeight: "24px", margin: "0 0 20px 0", flex: 1 }}>
                    Recognizes verified working experience, vetted industry filmography, and legitimate commercial releases for established actors and performers.
                  </p>

                  <div style={{ borderTop: "1px solid #F0ECE3", paddingTop: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#8A6B2E" }}>
                      Accepted Evidence
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: "#2B2D2A" }}>
                      <CheckCircle2 size={15} style={{ color: "#8A6B2E", flexShrink: 0 }} />
                      <span>IMDb verified filmography or released streaming credits</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: "#2B2D2A" }}>
                      <CheckCircle2 size={15} style={{ color: "#8A6B2E", flexShrink: 0 }} />
                      <span>CINTAA or recognized artists guild membership card</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: "#2B2D2A" }}>
                      <CheckCircle2 size={15} style={{ color: "#8A6B2E", flexShrink: 0 }} />
                      <span>Call sheets, commercial contracts, or production credit proofs</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: INDUSTRY & PRODUCTION VERIFICATION */}
            <div
              style={{
                backgroundColor: "#F3EFE6",
                border: "1px solid #E8E2D4",
                borderRadius: "16px",
                padding: "clamp(32px, 5vw, 48px)",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "36px",
                alignItems: "center",
              }}
            >
              <div>
                <div className="eyebrow" style={{ marginBottom: "10px" }}>
                  <span>Studio &amp; Recruiter Compliance</span>
                </div>
                <h2
                  style={{
                    fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                    fontSize: "clamp(24px, 3.5vw, 32px)",
                    fontWeight: 500,
                    color: "#2B2D2A",
                    margin: "0 0 12px 0",
                  }}
                >
                  Industry Organization KYC
                </h2>
                <p style={{ color: "#5A584F", fontSize: "15px", lineHeight: "25px", margin: "0 0 16px 0" }}>
                  To guarantee artist safety, production houses and casting directors cannot browse unmasked contact information or request private auditions without verified business credentials.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#2B2D2A" }}>
                    <Building2 size={16} style={{ color: "#8A6B2E" }} />
                    <span>Incorporation documents (CIN, GSTIN, LLPIN, or Udyam registration)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#2B2D2A" }}>
                    <FileCheck2 size={16} style={{ color: "#8A6B2E" }} />
                    <span>Authorized signatory declaration &amp; verified official domain email</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#2B2D2A" }}>
                    <Shield size={16} style={{ color: "#8A6B2E" }} />
                    <span>Mandatory anti-harassment and fair casting agreement sign-off</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8E2D4",
                  borderRadius: "12px",
                  padding: "28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <ShieldCheck size={28} style={{ color: "#2E7D32" }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: "16px", color: "#2B2D2A", fontWeight: 600 }}>
                      Verified Studio Badge
                    </h4>
                    <span style={{ fontSize: "12.5px", color: "#777970" }}>
                      Earned after business &amp; signatory vetting
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: "13.5px", color: "#5A584F", lineHeight: "22px", margin: 0 }}>
                  Organizations holding this badge gain access to create official casting opportunities, review audition self-tapes, and issue structured callback requests through Vismaya.
                </p>
                <Link
                  href="/register"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#8A6B2E",
                    fontWeight: 600,
                    fontSize: "14px",
                    textDecoration: "none",
                    marginTop: "6px",
                  }}
                >
                  <span>Register as Production Studio</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* SECTION 3: 4-STEP VERIFICATION PROCESS */}
            <div>
              <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 36px auto" }}>
                <div className="eyebrow" style={{ justifyContent: "center", marginBottom: "8px" }}>
                  <span>Simple Process</span>
                </div>
                <h2
                  style={{
                    fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                    fontSize: "clamp(26px, 3.5vw, 34px)",
                    fontWeight: 500,
                    color: "#2B2D2A",
                    margin: "0 0 10px 0",
                  }}
                >
                  How Verification Works
                </h2>
                <p style={{ color: "#5A584F", fontSize: "15px", margin: 0 }}>
                  A smooth, transparent 4-step workflow engineered for artist convenience and speed.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "20px",
                }}
              >
                {[
                  {
                    step: "01",
                    title: "Log In to Your Dashboard",
                    desc: "Sign in to your artist or organization account and navigate to the Verification tab.",
                  },
                  {
                    step: "02",
                    title: "Select Verification Type",
                    desc: "Choose Identity Verification (Gov ID + Selfie) or Professional Verification (IMDb / Guild / Credits).",
                  },
                  {
                    step: "03",
                    title: "Submit Evidence Safely",
                    desc: "Upload clean document photos or complete instant Aadhaar OTP verification.",
                  },
                  {
                    step: "04",
                    title: "Get Badged & Spotlighted",
                    desc: "Upon compliance approval, your profile badge is activated and visible to certified casting directors.",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E8E2D4",
                      borderRadius: "10px",
                      padding: "24px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-heading), Georgia, serif",
                        fontSize: "24px",
                        fontWeight: 700,
                        color: "#8A6B2E",
                      }}
                    >
                      {item.step}
                    </span>
                    <h4 style={{ fontSize: "16px", fontWeight: 600, color: "#2B2D2A", margin: 0 }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: "13.5px", color: "#5A584F", lineHeight: "22px", margin: 0 }}>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 4: FREQUENTLY ASKED QUESTIONS */}
            <div>
              <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 36px auto" }}>
                <div className="eyebrow" style={{ justifyContent: "center", marginBottom: "8px" }}>
                  <span>Got Questions?</span>
                </div>
                <h2
                  style={{
                    fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                    fontSize: "clamp(26px, 3.5vw, 34px)",
                    fontWeight: 500,
                    color: "#2B2D2A",
                    margin: "0 0 10px 0",
                  }}
                >
                  KYC Verification FAQs
                </h2>
              </div>

              <div style={{ maxWidth: "860px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "14px" }}>
                {faqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E8E2D4",
                        borderRadius: "10px",
                        overflow: "hidden",
                        transition: "all 200ms ease",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(idx)}
                        style={{
                          width: "100%",
                          padding: "18px 22px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "16px",
                          background: "none",
                          border: "none",
                          textAlign: "left",
                          cursor: "pointer",
                          color: "#2B2D2A",
                        }}
                      >
                        <span style={{ fontSize: "15px", fontWeight: 600 }}>{faq.q}</span>
                        <ChevronDown
                          size={18}
                          style={{
                            color: "#8A6B2E",
                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 200ms ease",
                            flexShrink: 0,
                          }}
                        />
                      </button>

                      {isOpen && (
                        <div
                          style={{
                            padding: "0 22px 18px 22px",
                            fontSize: "14px",
                            color: "#5A584F",
                            lineHeight: "23px",
                            borderTop: "1px solid #F5F1E8",
                            paddingTop: "14px",
                          }}
                        >
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 5: ACTION CTA CARD */}
            <div
              className="glass"
              style={{
                borderRadius: "14px",
                padding: "clamp(32px, 5vw, 48px)",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E4E1D9",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "28px",
              }}
            >
              <div style={{ maxWidth: "620px" }}>
                <div className="eyebrow" style={{ marginBottom: "10px" }}>
                  <span>Start Your Verification</span>
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                    fontSize: "clamp(22px, 3.5vw, 30px)",
                    fontWeight: 500,
                    margin: "0 0 10px 0",
                    color: "#2B2D2A",
                  }}
                >
                  Ready to Authenticate Your Profile?
                </h3>
                <p style={{ color: "#5A584F", fontSize: "15px", lineHeight: "24px", margin: 0 }}>
                  Gain immediate credibility, protect your creative identity, and unlock verified casting opportunities across India.
                </p>
              </div>

              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
                <Link
                  href="/talent/verification"
                  className="btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <span>Verify as Talent</span>
                  <ArrowRight size={15} />
                </Link>

                <Link
                  href="/recruiter/verification"
                  className="btn-secondary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <span>Verify as Studio</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
