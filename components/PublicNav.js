"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { Menu, X, ArrowRight } from "lucide-react";

export default function PublicNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Opportunities", href: "/opportunities" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Login", href: "/login" },
  ];

  return (
    <header
      className="public-nav-wrapper"
      style={{
        position: "absolute",
        top: "clamp(16px, 2.5vh, 28px)",
        left: 0,
        right: 0,
        width: "100%",
        zIndex: 50,
        padding: "0 clamp(20px, 3.5vw, 64px)",
      }}
    >
      <div
        className="nav-pill-container"
        style={{
          width: "100%",
          maxWidth: "1480px",
          margin: "0 auto",
          height: "64px",
          padding: "0 10px 0 24px",
          borderRadius: "var(--radius-card, 6px)",
          backgroundColor: "rgba(250, 249, 246, 0.95)",
          border: "1px solid var(--border-color, #E4E1D9)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "var(--shadow-sm, 0 1px 4px rgba(41, 44, 41, 0.04))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        {/* Left: Logo */}
        <Logo href="/" variant="dark" />

        {/* Center: Navigation Links */}
        <nav
          className="public-nav-links"
          aria-label="Main Navigation"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                style={{
                  padding: "8px 18px",
                  borderRadius: "var(--radius-pill, 999px)",
                  fontWeight: active ? "600" : "400",
                  fontSize: "13px",
                  letterSpacing: "0.02em",
                  display: "inline-flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                  color: active ? "var(--gold, #9B7A3F)" : "var(--text-primary, #292C29)",
                  backgroundColor: active ? "var(--gold-bg, rgba(155, 122, 63, 0.1))" : "transparent",
                  border: active ? "1px solid var(--gold-border, rgba(155, 122, 63, 0.28))" : "1px solid transparent",
                  transition: "all 0.18s ease",
                }}
                className="nav-link-pill"
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Register CTA */}
        <div className="public-nav-cta" style={{ display: "flex", alignItems: "center" }}>
          <Link
            href="/register"
            style={{
              minHeight: "40px",
              height: "40px",
              padding: "0 22px",
              fontSize: "12px",
              fontWeight: "600",
              borderRadius: "var(--radius-btn, 4px)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              backgroundColor: "var(--gold, #9B7A3F)",
              color: "var(--text-dark-primary, #FAF9F6)",
              textDecoration: "none",
              boxShadow: "var(--gold-glow)",
              transition: "all 0.2s ease",
            }}
            className="nav-register-btn"
          >
            <span>Register</span>
            <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </div>

        {/* Mobile Hamburger (Below 900px) */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          className="public-nav-burger"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "var(--radius-btn, 4px)",
            border: "1px solid var(--border-color, #E4E1D9)",
            backgroundColor: "var(--bg-surface, #FFFFFF)",
            color: "var(--text-primary, #292C29)",
            cursor: "pointer",
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
          }}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div
          className="public-mobile-dropdown"
          style={{
            marginTop: "12px",
            width: "100%",
            maxWidth: "1280px",
            margin: "12px auto 0 auto",
            padding: "20px 24px",
            backgroundColor: "var(--bg-surface, #FFFFFF)",
            border: "1px solid var(--border-color, #E4E1D9)",
            borderRadius: "var(--radius-card, 6px)",
            boxShadow: "var(--shadow-md)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  height: "44px",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 14px",
                  fontWeight: active ? "600" : "400",
                  fontSize: "14px",
                  color: active ? "var(--gold, #9B7A3F)" : "var(--text-primary, #292C29)",
                  backgroundColor: active ? "var(--gold-bg, rgba(155, 122, 63, 0.1))" : "transparent",
                  borderRadius: "var(--radius-btn, 4px)",
                  textDecoration: "none",
                  transition: "all 0.18s ease",
                }}
              >
                {link.label}
              </Link>
            );
          })}

          <div style={{ height: "1px", backgroundColor: "var(--border-color, #E4E1D9)", margin: "8px 0" }} />

          <Link
            href="/register"
            onClick={() => setMobileMenuOpen(false)}
            className="btn-primary"
            style={{
              width: "100%",
              height: "44px",
              minHeight: "44px",
              fontSize: "12px",
              fontWeight: "600",
              justifyContent: "center",
              borderRadius: "var(--radius-btn, 4px)",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              backgroundColor: "var(--gold, #9B7A3F)",
              color: "var(--text-dark-primary, #FAF9F6)",
            }}
          >
            <span>Register</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      )}

      <style jsx>{`
        :global(.nav-link-pill:hover) {
          color: var(--gold, #9B7A3F) !important;
          background-color: var(--gold-bg, rgba(155, 122, 63, 0.08)) !important;
        }

        @media (max-width: 900px) {
          .public-nav-links,
          .public-nav-cta {
            display: none !important;
          }
          .public-nav-burger {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
