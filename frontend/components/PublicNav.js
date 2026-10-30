"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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
  let logout = null;
  let getDashboardPath = () => "/talent/dashboard";
  try {
    const auth = useAuth();
    if (auth) {
      user = auth.user;
      logout = auth.logout;
      if (typeof auth.getDashboardPath === "function") {
        getDashboardPath = auth.getDashboardPath;
      }
    }
  } catch {
    // Fallback if rendered outside AuthProvider
  }

  const handleLogout = async () => {
    if (typeof logout === "function") {
      await logout("/");
    }
  };

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
        pathname.startsWith("/recruiter") ||
        pathname.startsWith("/admin")
      );
    }
    return pathname === routeHref;
  };

  const isLoggedIn = mounted && Boolean(user);
  const dashboardUrl = isLoggedIn ? (getDashboardPath() || "/talent/dashboard") : "/talent/dashboard";

  // Navigation Links definition
  // When logged out: Home, About, Pricing, Contact, Login, Register
  // When logged in: Home, About, Pricing, Contact (Right CTA button handles Dashboard, avoiding duplicate 'Dashboard' links)
  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "/contact" },
    ...(!isLoggedIn
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
          {isLoggedIn && (
            <div className="public-nav-user-actions">
              <Link
                href={dashboardUrl}
                className="public-nav-cta"
              >
                <span>Dashboard</span>
                <ArrowRight size={14} className="public-nav-cta-arrow" />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="public-nav-logout-btn"
                title="Log out of account"
              >
                Logout
              </button>
            </div>
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

            {isLoggedIn && (
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
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="public-nav-mobile-link"
                  style={{
                    textAlign: "left",
                    width: "100%",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#BA3C3C",
                    fontWeight: 600,
                    padding: "12px 16px"
                  }}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
