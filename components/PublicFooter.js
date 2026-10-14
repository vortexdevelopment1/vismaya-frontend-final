"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import PublicFooterOld from "./PublicFooter.old";
import "./PublicFooter.css";

// Switch between new light footer trial and backup old design
const USE_NEW_FOOTER = true;

export default function PublicFooter() {
  const pathname = usePathname();

  // Switch to backup old footer if toggle is false
  if (!USE_NEW_FOOTER) {
    return <PublicFooterOld />;
  }

  const platformLinks = [
    { label: "Talent Portal", href: "/talent/dashboard", isHighlight: true },
    { label: "Organization Portal", href: "/recruiter/dashboard" },
    { label: "Vismaya Desk", href: "/admin/dashboard" },
  ];

  const companyLinks = [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact Support", href: "/contact" },
    { label: "Join Network", href: "/register" },
  ];

  const legalLinks = [
    { label: "KYC Verification", href: "/about" },
    { label: "Privacy Policy", href: "/about" },
    { label: "Terms of Service", href: "/about" },
    { label: "Account Sign In", href: "/login" },
  ];

  return (
    <footer className="public-footer-light">
      {/* Decorative top gold hairline accent */}
      <div className="public-footer-accent-line" aria-hidden="true" />

      <div className="public-footer-container">
        {/* Top Row: Brand Info + 3 Columns */}
        <div className="public-footer-top-row">
          {/* Left: Brand Column */}
          <div className="public-footer-brand-col">
            <Link href="/" className="public-footer-logo-link">
              <div className="public-footer-logo-badge">V</div>
              <div className="public-footer-logo-text">
                <span className="public-footer-logo-title">VISMAYA</span>
                <span className="public-footer-logo-sub">CASTING PLATFORM</span>
              </div>
            </Link>

            <p className="public-footer-description">
              India&apos;s premier verified entertainment casting platform connecting elite artists,
              casting directors, and top production houses with guaranteed authenticity.
            </p>
          </div>

          {/* Right: 3 Navigation Link Columns */}
          <div className="public-footer-nav-grid">
            {/* 1. Platform Column */}
            <div className="public-footer-col">
              <span className="public-footer-col-title">Platform</span>
              <span className="public-footer-col-line" aria-hidden="true" />
              <div className="public-footer-col-links">
                {platformLinks.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`public-footer-link ${isActive ? "active" : ""} ${
                        item.isHighlight ? "highlight" : ""
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 2. Company Column */}
            <div className="public-footer-col">
              <span className="public-footer-col-title">Company</span>
              <span className="public-footer-col-line" aria-hidden="true" />
              <div className="public-footer-col-links">
                {companyLinks.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`public-footer-link ${isActive ? "active" : ""}`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 3. Trust & Legal Column */}
            <div className="public-footer-col">
              <span className="public-footer-col-title">Trust &amp; Legal</span>
              <span className="public-footer-col-line" aria-hidden="true" />
              <div className="public-footer-col-links">
                {legalLinks.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`public-footer-link ${isActive ? "active" : ""}`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Infrastructure Bar */}
        <div className="public-footer-bottom-bar">
          <span className="public-footer-copyright">
            &copy; {new Date().getFullYear()} Vismaya Casting &amp; Talent Platform. All rights reserved.
          </span>
          <div className="public-footer-trust-badge">
            <ShieldCheck size={15} className="public-footer-shield-icon" />
            <span>Verified Casting Infrastructure</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
