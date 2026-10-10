"use client";

import Link from "next/link";
import "./Hero.css";

export default function Hero() {
  return (
    <section className="hero">
      {/* Subtle overlay for left-side text readability */}
      <div className="hero-overlay" aria-hidden="true" />

      {/* 1. Top Navbar */}
      <header className="hero-navbar-wrapper">
        <nav className="hero-navbar">
          {/* Logo */}
          <Link href="/" className="hero-logo">
            <div className="hero-logo-icon">V</div>
            <span className="hero-logo-text">VISMAYA</span>
          </Link>

          {/* Navigation Links */}
          <div className="hero-nav-links">
            <Link href="/" className="hero-nav-link-active">
              Home
            </Link>

            <Link href="/opportunities" className="hero-nav-link">
              Opportunities
            </Link>

            <Link href="/about" className="hero-nav-link">
              About
            </Link>

            <Link href="/contact" className="hero-nav-link">
              Contact
            </Link>

            <Link href="/login" className="hero-nav-link">
              Login
            </Link>
          </div>

          {/* Register CTA Button */}
          <Link href="/register" className="hero-nav-cta">
            REGISTER →
          </Link>
        </nav>
      </header>

      {/* 2. Left-Side Hero Content */}
      <div className="hero-body-wrapper">
        <div className="hero-content">
          {/* Eyebrow Label */}
          <div className="hero-eyebrow">
            <div className="hero-eyebrow-line" />
            <span className="hero-eyebrow-text">
              INDIA&apos;S PREMIER CASTING NETWORK
            </span>
          </div>

          {/* Main Display Heading */}
          <h1 className="hero-title">
            <span className="hero-title-line">
              YOUR BREAK
            </span>
            <span className="hero-title-accent">
              STARTS HERE
            </span>
          </h1>

          {/* Description Paragraph */}
          <p className="hero-description">
            Organizations post verified opportunities. Talent applies with a
            certified portfolio. Vismaya reviews every brief to guarantee zero
            spam, authentic budgets, and legitimate auditions.
          </p>

          {/* CTA Buttons */}
          <div className="hero-actions">
            <Link href="/opportunities" className="hero-btn-primary">
              <span>BROWSE CASTING CALLS →</span>
            </Link>

            <Link href="/register" className="hero-btn-secondary">
              <span>POST AS ORGANIZATION</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Bottom-Left Decorative Curves */}
      <div className="hero-curves" aria-hidden="true">
        <div className="hero-curve-1" />
        <div className="hero-curve-2" />
      </div>
    </section>
  );
}
