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
          borderRadius: "999px",
          backgroundColor: "rgba(255, 255, 255, 0.055)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          backdropFilter: "blur(16px) saturate(150%)",
          WebkitBackdropFilter: "blur(16px) saturate(150%)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.40)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        {/* Left: Logo */}
        <Logo href="/" variant="light" />

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
                  borderRadius: "999px",
                  fontWeight: active ? "700" : "500",
                  fontSize: "13px",
                  letterSpacing: "0.02em",
                  display: "inline-flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                  color: active ? "#FFC72C" : "rgba(236, 234, 245, 0.85)",
                  backgroundColor: active ? "rgba(255, 255, 255, 0.08)" : "transparent",
                  border: active ? "1px solid rgba(255, 199, 44, 0.35)" : "1px solid transparent",
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
              minHeight: "42px",
              height: "42px",
              padding: "0 22px",
              fontSize: "12px",
              fontWeight: "900",
              borderRadius: "999px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              backgroundColor: "#FFC72C",
              color: "#080c14",
              textDecoration: "none",
              boxShadow: "0 0 24px rgba(255, 199, 44, 0.55)",
              transition: "all 0.2s ease",
            }}
            className="nav-register-btn"
          >
            <span>Register</span>
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </div>

        {/* Mobile Hamburger (Below 900px) */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          className="public-nav-burger"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            color: "#eceaf5",
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
            backgroundColor: "rgba(15, 22, 38, 0.96)",
            backdropFilter: "blur(20px) saturate(160%)",
            WebkitBackdropFilter: "blur(20px) saturate(160%)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: "24px",
            boxShadow: "0 24px 50px rgba(0, 0, 0, 0.60)",
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
                  fontWeight: active ? "700" : "600",
                  fontSize: "14px",
                  color: active ? "#ffbc00" : "#eceaf5",
                  backgroundColor: active ? "rgba(255, 188, 0, 0.12)" : "transparent",
                  borderRadius: "12px",
                  textDecoration: "none",
                  transition: "all 0.18s ease",
                }}
              >
                {link.label}
              </Link>
            );
          })}

          <div style={{ height: "1px", backgroundColor: "rgba(255, 255, 255, 0.10)", margin: "8px 0" }} />

          <Link
            href="/register"
            onClick={() => setMobileMenuOpen(false)}
            className="btn-primary"
            style={{
              width: "100%",
              height: "48px",
              minHeight: "48px",
              fontSize: "12px",
              fontWeight: "800",
              justifyContent: "center",
              borderRadius: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            <span>Register</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      )}

      <style jsx>{`
        :global(.nav-link-pill:hover) {
          color: #ffbc00 !important;
          background-color: rgba(255, 255, 255, 0.08) !important;
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
