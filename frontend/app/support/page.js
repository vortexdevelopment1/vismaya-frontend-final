"use client";

import React, { useState } from "react";
import Link from "next/link";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import {
  HelpCircle,
  ShieldCheck,
  CreditCard,
  UserCheck,
  Briefcase,
  User,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { supportEmail, supportWhatsapp as supportWhatsApp } from "@/lib/config/support";

const SUPPORT_TOPICS = [
  {
    id: "account",
    title: "Account",
    icon: User,
    description: "Login issues, email changes, OTP verification, password recovery, and security settings.",
    faqs: [
      {
        q: "How do I change my registered email address?",
        a: "Go to your account settings and select 'Change Email'. A 6-digit verification code will be sent to your new email address to confirm ownership.",
      },
      {
        q: "What should I do if I am not receiving OTP codes?",
        a: "Check your spam/junk folder. Ensure your email provider allows emails from vismayastudios.com. If using mobile OTP, confirm your number is in international +91 format.",
      },
      {
        q: "Can I temporarily deactivate my account?",
        a: "In accordance with Vismaya platform policy, temporary deactivation is not supported. You may request permanent account deletion with a 30-day recovery grace period.",
      },
    ],
  },
  {
    id: "payment",
    title: "Payment",
    icon: CreditCard,
    description: "Annual talent and industry memberships, credit bundles, refunds, and GST invoices.",
    faqs: [
      {
        q: "What are the registration fees?",
        a: "Talent registration is ₹999/year covering directory publishing and application access. Organization registration is ₹4,999/year and includes 100 profile-view credits.",
      },
      {
        q: "My payment failed or money was deducted without activation.",
        a: "Payment verification runs automatically via our payment gateway. If a deduction occurred without instant fulfillment, our reconciliation job processes it within 2 hours. You can also reach our support desk below.",
      },
      {
        q: "Where can I download my tax invoice / receipt?",
        a: "Digital GST invoices are generated upon every successful transaction. You can download invoices directly from your dashboard under Billing & Invoices.",
      },
    ],
  },
  {
    id: "verification",
    title: "Verification",
    icon: UserCheck,
    description: "Government identity badges, professional credits verification, and studio documentation.",
    faqs: [
      {
        q: "Why are there two verification badges?",
        a: "Vismaya separates Identity Verification (government ID proof) from Professional Verification (validated industry credits). Both can be earned independently.",
      },
      {
        q: "What happens if my verification is rejected?",
        a: "If a verification submission is rejected, you cannot resubmit directly through the portal. Please contact Vismaya support with your supporting documentation to request re-examination.",
      },
      {
        q: "How long does verification take?",
        a: "Identity verifications are reviewed within 24 business hours. Professional credits and studio business registrations typically take 48-72 business hours.",
      },
    ],
  },
  {
    id: "opportunity",
    title: "Opportunity",
    icon: Briefcase,
    description: "Casting calls, applying for roles, deadlines, custom questions, and application status.",
    faqs: [
      {
        q: "Can I edit an application after submitting?",
        a: "To preserve casting integrity, applications cannot be edited once submitted. You may withdraw your application with an explanation and re-apply only if approved by administration.",
      },
      {
        q: "How do audition relays work?",
        a: "All self-tape and audition invitations are moderated and relayed by Vismaya administration. Once you upload your self-tape, our review desk inspects the submission before forwarding it to the production team.",
      },
      {
        q: "What does 'Closing Soon' mean on an opportunity?",
        a: "Opportunities marked 'Closing Soon' are within 3 calendar days of their submission deadline. Once the deadline passes, the opportunity automatically closes.",
      },
    ],
  },
  {
    id: "profile",
    title: "Profile",
    icon: ShieldCheck,
    description: "Profile strength percentage, comp-cards, showreels, critical edits review, and searchability.",
    faqs: [
      {
        q: "When does my profile become searchable to industry directors?",
        a: "Your comp-card becomes searchable once you reach at least 60% profile completion, maintain an active paid subscription, and your profile is approved.",
      },
      {
        q: "Why are my profile changes pending review?",
        a: "Critical identity fields (such as legal name, date of birth, and primary craft) require administrative review. Your previous profile remains live and visible while changes are pending.",
      },
    ],
  },
  {
    id: "safety",
    title: "Safety",
    icon: AlertTriangle,
    description: "Copyright disputes, content moderation, underage talent protection, and reporting violations.",
    faqs: [
      {
        q: "How are underage talents protected on Vismaya?",
        a: "Talents under 18 require documented guardian consent and guardian contact details. Physical and contact details are strictly restricted from public and industry access.",
      },
      {
        q: "How do I dispute a copyright infringement?",
        a: "You can file a copyright dispute directly from any media item. Disputed items are immediately restricted from view pending administrative review.",
      },
    ],
  },
  {
    id: "other",
    title: "Other",
    icon: HelpCircle,
    description: "General inquiries, browser compatibility, API access, and partnership requests.",
    faqs: [
      {
        q: "Is direct messaging available between talents and recruiters?",
        a: "No. Vismaya maintains a secure, curated casting environment. All communication happens through auditions, status updates, and official administrative relays.",
      },
    ],
  },
];

export default function SupportPage() {
  const [selectedTopic, setSelectedTopic] = useState("account");
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const currentTopic = SUPPORT_TOPICS.find((t) => t.id === selectedTopic) || SUPPORT_TOPICS[0];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#FAF9F7" }}>
      <PublicNav />

      {/* Header Banner */}
      <section
        style={{
          backgroundColor: "#F0EEE7",
          borderBottom: "1px solid #E4E1D9",
          padding: "clamp(36px, 5vw, 56px) 24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#8A6B2E", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>
            <Sparkles size={14} />
            <span>Vismaya Help &amp; Support Center</span>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
              fontSize: "clamp(32px, 4.5vw, 48px)",
              color: "#2B2D2A",
              lineHeight: 1.15,
              margin: "0 0 12px 0",
              fontWeight: 600,
            }}
          >
            How can our desk assist you?
          </h1>
          <p style={{ color: "#5A584F", fontSize: "16px", maxWidth: "680px", lineHeight: 1.6, margin: 0 }}>
            Browse guidance by category, find answers to common questions about verification and payments, or contact our support operations desk.
          </p>
        </div>
      </section>

      {/* Main Support Grid */}
      <section style={{ maxWidth: "1120px", margin: "0 auto", padding: "clamp(32px, 4vw, 56px) 24px", width: "100%", flex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px", alignItems: "start" }}>
          {/* Left: Topic Selector List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#8A6B2E", marginBottom: "8px" }}>
              Help Topics
            </div>
            {SUPPORT_TOPICS.map((topic) => {
              const Icon = topic.icon;
              const isSelected = selectedTopic === topic.id;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => {
                    setSelectedTopic(topic.id);
                    setOpenFaqIndex(0);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px 16px",
                    borderRadius: "10px",
                    border: `1px solid ${isSelected ? "#8A6B2E" : "#E8E2D4"}`,
                    backgroundColor: isSelected ? "#FFFFFF" : "transparent",
                    color: isSelected ? "#8A6B2E" : "#2B2D2A",
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: "14.5px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 150ms ease",
                    boxShadow: isSelected ? "0 2px 8px rgba(138, 107, 46, 0.08)" : "none",
                  }}
                >
                  <Icon size={18} style={{ color: isSelected ? "#8A6B2E" : "#777970", flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{topic.title}</span>
                  <ArrowRight size={14} style={{ opacity: isSelected ? 1 : 0.3 }} />
                </button>
              );
            })}

            {/* Direct Inquiries Link Card */}
            <div
              style={{
                marginTop: "20px",
                padding: "20px",
                borderRadius: "12px",
                backgroundColor: "#F3EFE6",
                border: "1px solid #E8E2D4",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#2B2D2A", marginBottom: "6px" }}>
                Need enterprise casting assistance?
              </div>
              <p style={{ fontSize: "12.5px", color: "#5A584F", lineHeight: 1.5, margin: "0 0 14px 0" }}>
                Our corporate studio operations desk handles physical auditions, enterprise contracts, and bespoke briefs.
              </p>
              <Link
                href="/contact"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: "#8A6B2E",
                  textDecoration: "none",
                }}
              >
                <span>Visit Contact &amp; Offices Desk</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Right: Topic FAQs & Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8E2D4",
                borderRadius: "14px",
                padding: "28px",
                boxShadow: "0 2px 8px rgba(43, 45, 42, 0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#8A6B2E" }}>
                  Knowledge Base • {currentTopic.title}
                </span>
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                  fontSize: "24px",
                  color: "#2B2D2A",
                  margin: "0 0 8px 0",
                  fontWeight: 600,
                }}
              >
                {currentTopic.title} Guidance
              </h2>
              <p style={{ fontSize: "14px", color: "#5A584F", lineHeight: 1.5, margin: "0 0 20px 0" }}>
                {currentTopic.description}
              </p>

              {/* FAQs Accordion */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {currentTopic.faqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      style={{
                        border: "1px solid #E8E2D4",
                        borderRadius: "8px",
                        overflow: "hidden",
                        backgroundColor: isOpen ? "#FAF9F7" : "#FFFFFF",
                        transition: "background-color 150ms ease",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                        style={{
                          width: "100%",
                          padding: "14px 16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "12px",
                          background: "none",
                          border: "none",
                          textAlign: "left",
                          cursor: "pointer",
                          color: "#2B2D2A",
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        <span>{faq.q}</span>
                        {isOpen ? <ChevronUp size={16} style={{ color: "#8A6B2E" }} /> : <ChevronDown size={16} style={{ color: "#777970" }} />}
                      </button>
                      {isOpen && (
                        <div
                          style={{
                            padding: "0 16px 16px 16px",
                            fontSize: "13.5px",
                            color: "#5A584F",
                            lineHeight: 1.6,
                            borderTop: "1px solid #EFECE6",
                            paddingTop: "12px",
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

            {/* Support Desk Direct Channels Card */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8E2D4",
                borderRadius: "14px",
                padding: "24px 28px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#8A6B2E" }}>
                Direct Assistance Channels
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                {/* Email Support */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      backgroundColor: "#F3EFE6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#8A6B2E",
                      flexShrink: 0,
                    }}
                  >
                    <Mail size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#5A584F", textTransform: "uppercase", fontWeight: 600, display: "block" }}>
                      Support Email
                    </span>
                    <span style={{ fontSize: "13.5px", color: "#2B2D2A", fontWeight: 600 }}>
                      {supportEmail ? (
                        <a href={`mailto:${supportEmail}`} style={{ color: "#8A6B2E", textDecoration: "none" }}>
                          {supportEmail}
                        </a>
                      ) : (
                        <span style={{ color: "#777970", fontWeight: 500 }}>Support contact will be available soon</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* WhatsApp Support */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      backgroundColor: "#F3EFE6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#8A6B2E",
                      flexShrink: 0,
                    }}
                  >
                    <Phone size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#5A584F", textTransform: "uppercase", fontWeight: 600, display: "block" }}>
                      Support WhatsApp
                    </span>
                    <span style={{ fontSize: "13.5px", color: "#2B2D2A", fontWeight: 600 }}>
                      {supportWhatsApp ? (
                        <a href={`https://wa.me/${supportWhatsApp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" style={{ color: "#8A6B2E", textDecoration: "none" }}>
                          {supportWhatsApp}
                        </a>
                      ) : (
                        <span style={{ color: "#777970", fontWeight: 500 }}>Support contact will be available soon</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
