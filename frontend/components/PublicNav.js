"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isTokenExpired, getAuthToken } from "@/lib/api/client";
import { isTalent, isRecruiter, isAdmin } from "@/lib/api/roles";
import { ArrowRight } from "lucide-react";
import "./PublicNav.css";

export default function PublicNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const navRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Safe auth consumption
  let user = null;
  let authToken = null;
  let clearSessionFn = null;
  try {
    const auth = useAuth();
    if (auth) {
      user = auth.user;
      authToken = auth.token;
      clearSessionFn = auth.clearSession;
    }
  } catch {
    // Fallback if rendered outside AuthProvider
  }

  // Session verification:
  // 1) Public pages completely ignore an admin session.
  // 2) "Dashboard" is shown ONLY when there is a valid talent or recruiter session with a non-expired token.
  // 3) Stale talent/recruiter or unknown non-admin session is cleared (no API call).
  const rawRole = user?.role;
  const isUserAdmin = isAdmin(rawRole);
  const isUserTalent = isTalent(rawRole);
  const isUserRecruiter = isRecruiter(rawRole);
  const isMemberRole = isUserTalent || isUserRecruiter;

  const currentToken = authToken || (typeof window !== "undefined" ? getAuthToken() : null);
  const isTokenValid = Boolean(currentToken && !isTokenExpired(currentToken));

  const isValidMemberSession = mounted && isMemberRole && isTokenValid;
  const dashboardUrl = isUserRecruiter ? "/recruiter/dashboard" : "/talent/dashboard";

  // Cleanup stale talent/recruiter or unknown non-admin session data
  useEffect(() => {
    if (!mounted) return;
    if (isUserAdmin) return; // Do NOT clear admin session

    const hasStaleSession = (user || currentToken) && (!isMemberRole || !isTokenValid);
    if (hasStaleSession && typeof clearSessionFn === "function") {
      clearSessionFn();
    }
  }, [mounted, isUserAdmin, user, currentToken, isMemberRole, isTokenValid, clearSessionFn]);

  // Scroll listener to toggle compact floating style with blur
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard (Escape) & outside click dismiss for mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Route active helper
  const isRouteActive = (routeHref) => {
    if (!pathname) return false;
    if (routeHref === "/") {
      return pathname === "/";
    }
    if (routeHref === "/about") {
      return pathname === "/about" || pathname.startsWith("/about/");
    }
    if (routeHref === "/contact") {
      return pathname === "/contact" || pathname.startsWith("/contact/");
    }
    if (routeHref === "/pricing") {
      return pathname === "/pricing" || pathname.startsWith("/pricing/");
    }
    if (routeHref === "/login") {
      return pathname === "/login" || pathname.startsWith("/login/");
    }
    if (routeHref === "/register") {
      return pathname.startsWith("/register");
    }
    if (routeHref.includes("dashboard")) {
      return (
        pathname.startsWith("/talent") ||
        pathname.startsWith("/recruiter")
      );
    }
    return pathname === routeHref;
  };

  // Navigation Links definition
  // When visitor / admin / logged out: Home, About, Pricing, Contact, Login, Register
  // When valid talent / recruiter logged in: Home, About, Pricing, Contact (Right CTA button handles Dashboard, avoiding duplicate 'Dashboard' links)
  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "/contact" },
    ...(!isValidMemberSession
      ? [
          { label: "Login", href: "/login" },
          { label: "Register", href: "/register" },
        ]
      : []),
  ];

  return (
    <header
      ref={navRef}
      className={`public-nav-wrapper ${isScrolled ? "is-scrolled" : ""}`}
    >
      <div className="public-nav-card">
        {/* 1. Left: Brand Logo */}
        <Link href="/" className="public-nav-brand" aria-label="Vismaya Creative Studios Home">
          <div className="public-nav-brand-badge" aria-hidden="true">
            V
          </div>
          <div className="public-nav-brand-text">
            <span className="public-nav-brand-title">VISMAYA</span>
            <span className="public-nav-brand-subtitle">CREATIVE STUDIOS</span>
          </div>
        </Link>

        {/* 2. Center: Desktop Navigation Links */}
        <nav className="public-nav-links" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const active = isRouteActive(link.href);
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`public-nav-link ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* 3. Right: Action Buttons (Desktop) */}
        <div className="public-nav-actions">
          {isValidMemberSession && (
            <Link
              href={dashboardUrl}
              className="public-nav-cta"
            >
              <span>Dashboard</span>
              <ArrowRight size={14} className="public-nav-cta-arrow" />
            </Link>
          )}

          {/* Mobile Hamburger Toggle (44x44px touch target) */}
          <button
            type="button"
            suppressHydrationWarning
            className={`public-nav-hamburger ${mobileMenuOpen ? "is-open" : ""}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
          >
            <span className="public-nav-hamburger-bar" />
            <span className="public-nav-hamburger-bar" />
            <span className="public-nav-hamburger-bar" />
          </button>
        </div>

        {/* 4. Mobile Dropdown Panel (<1024px) */}
        {mobileMenuOpen && (
          <div className="public-nav-mobile-panel" role="dialog" aria-label="Mobile Navigation">
            {navLinks.map((link) => {
              const active = isRouteActive(link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`public-nav-mobile-link ${active ? "active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}

            {isValidMemberSession && (
              <>
                <div className="public-nav-mobile-divider" />
                <Link
                  href={dashboardUrl}
                  className="public-nav-mobile-cta"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight size={15} />
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
