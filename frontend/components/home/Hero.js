"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Users,
  Sparkles,
  ArrowRight,
  UserRound,
  CheckCircle2,
} from "lucide-react";
import "./Hero.css";

export default function Hero() {
  const handleScrollToWorkflow = (e) => {
    e.preventDefault();
    const section =
      document.getElementById("how-it-works") ||
      document.querySelector(".workflow-section");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="hero-master-container">
      {/* Background radial gold glow and decorative lines */}
      <div className="hero-bg-glow" aria-hidden="true" />
      <div className="hero-bg-arc" aria-hidden="true">
        <svg viewBox="0 0 1200 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M480 30C750 110 980 300 1150 560"
            stroke="rgba(201, 165, 92, 0.2)"
            strokeWidth="1.2"
            strokeDasharray="4 6"
          />
        </svg>
      </div>

      {/* 2. Hero Body: Two-Column Layout */}
      <div className="hero-main-layout">
        {/* Left Column: Editorial Presentation */}
        <div className="hero-left-col">
          {/* Eyebrow */}
          <div className="hero-eyebrow hero-anim-fade hero-delay-1">
            <span className="hero-eyebrow-line" aria-hidden="true" />
            <span className="hero-eyebrow-text">A STAGE FOR EVERY CREATIVE JOURNEY</span>
          </div>

          {/* Main H1 Heading */}
          <h1 className="hero-heading hero-anim-fade hero-delay-2">
            <span className="hero-heading-row">India’s Creative</span>
            <span className="hero-heading-row">
              Talent{" "}
              <span className="hero-heading-network-wrap">
                <em className="hero-heading-network">Network.</em>
                <svg
                  className="hero-heading-underline"
                  viewBox="0 0 240 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M4 12C60 4.5 170 3.5 236 10"
                    stroke="#C9A55C"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </span>
          </h1>

          {/* Subtext */}
          <p className="hero-subtext hero-anim-fade hero-delay-3">
            Your craft deserves to be seen. Build your professional identity, find your community,
            and discover your next opportunity.
          </p>

          {/* Action Buttons */}
          <div className="hero-actions-group hero-anim-fade hero-delay-4">
            <Link href="/register?role=talent" className="hero-btn-primary">
              <span>Register as Talent</span>
              <ArrowRight size={15} className="hero-btn-primary-arrow" />
            </Link>
            <Link href="/register?role=organization" className="hero-btn-outline">
              <span>Register as Industry</span>
            </Link>
          </div>

          {/* How Vismaya Works Link */}
          <div className="hero-workflow-link-wrap hero-anim-fade hero-delay-5">
            <a
              href="#how-it-works"
              onClick={handleScrollToWorkflow}
              className="hero-workflow-link"
            >
              <span className="hero-workflow-dot">◉</span>
              <span>How Vismaya works</span>
              <ArrowRight size={14} className="hero-workflow-arrow" />
            </a>
          </div>

          {/* Divider */}
          <div className="hero-divider-line hero-anim-fade hero-delay-5" />

          {/* Trust Badges */}
          <div className="hero-trust-badges hero-anim-fade hero-delay-6">
            <div className="hero-trust-badge">
              <ShieldCheck size={16} className="hero-trust-icon" />
              <span>Identity. Credibility. Opportunity.</span>
            </div>
            <div className="hero-trust-badge">
              <Users size={16} className="hero-trust-icon" />
              <span>Every stage. Every story.</span>
            </div>
            <div className="hero-trust-badge">
              <CheckCircle2 size={16} className="hero-trust-icon" />
              <span>Zero Spam Briefs</span>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Image Collage */}
        <div className="hero-right-col">
          <div className="hero-visual-header hero-anim-fade hero-delay-2">
            <span className="hero-visual-tag">MANY CRAFTS. ONE CREATIVE COMMUNITY.</span>
          </div>

          <div className="hero-collage-grid">
            {/* Left Tall B&W Portrait Card */}
            <div className="hero-card hero-card-tall hero-anim-slide hero-delay-3">
              <img
                src="/images/actor.jpg"
                alt="Black and white portrait of a creative performer"
                className="hero-card-img"
              />
              <div className="hero-card-gradient" />
              {/* Caption positioned above the chip zone so ACTORS & PERFORMERS is never covered */}
              <div className="hero-card-caption hero-caption-tall">
                <span className="hero-caption-title">In front of the lens.</span>
                <span className="hero-caption-category">ACTORS &amp; PERFORMERS</span>
              </div>

              {/* Floating chip positioned cleanly */}
              <div className="hero-floating-chip">
                <Sparkles size={17} className="hero-chip-icon" />
                <span className="hero-chip-text">Your talent. Your next chapter.</span>
              </div>
            </div>

            {/* Right Stacked Cards */}
            <div className="hero-cards-stack">
              {/* Top Card: Film & Photography */}
              <div className="hero-card hero-card-stacked hero-anim-slide hero-delay-4">
                <img
                  src="/images/camera.jpg"
                  alt="Cinema camera on a film production"
                  className="hero-card-img"
                />
                <div className="hero-card-gradient" />
                <div className="hero-card-caption">
                  <span className="hero-caption-title">Behind the story.</span>
                  <span className="hero-caption-category">FILM &amp; PHOTOGRAPHY</span>
                </div>
              </div>

              {/* Bottom Card: Music & Sound */}
              <div className="hero-card hero-card-stacked hero-card-offset hero-anim-slide hero-delay-5">
                <img
                  src="/images/musician.jpg"
                  alt="Independent musician playing guitar"
                  className="hero-card-img"
                />
                <div className="hero-card-gradient" />
                <div className="hero-card-caption">
                  <span className="hero-caption-title">Beyond the ordinary.</span>
                  <span className="hero-caption-category">MUSIC &amp; SOUND</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Strip: Built for your journey */}
      <div className="hero-journey-strip hero-anim-fade hero-delay-6">
        <span className="hero-journey-label">BUILT FOR YOUR JOURNEY</span>
        <div className="hero-journey-items">
          <span className="hero-journey-item">
            <UserRound size={15} className="hero-journey-icon" />
            <span>Aspiring talent</span>
          </span>
          <span className="hero-journey-sep" aria-hidden="true">✧</span>
          <span className="hero-journey-item">
            <Sparkles size={15} className="hero-journey-icon" />
            <span>Emerging talent</span>
          </span>
          <span className="hero-journey-sep" aria-hidden="true">✧</span>
          <span className="hero-journey-item">
            <ShieldCheck size={15} className="hero-journey-icon" />
            <span>Experienced professionals</span>
          </span>
        </div>
      </div>
    </section>
  );
}
