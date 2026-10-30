"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./PublicNav.css";

export default function PublicNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const navRef = useRef(null);

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
    return pathname === routeHref;
  };

  // Navigation Links definition - permanent public links
  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "/contact" },
    { label: "Login", href: "/login" },
    { label: "Register", href: "/register" },
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
          </div>
        )}
      </div>
    </header>
  );
}
