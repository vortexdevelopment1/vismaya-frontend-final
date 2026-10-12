"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Shield, MapPin, User, ArrowRight } from "lucide-react";
import { eliteTalentRoster } from "@/lib/public/homeData";
import "./TalentRosterSection.css";

// Single Talent Card Item
function TalentCardItem({ talent, index }) {
  const [imgError, setImgError] = useState(false);
  const isHighlighted = talent.rating === "5.0" || talent.slug === "kabir-mehta" || talent.featured;

  return (
    <article
      className={`talent-card ${isHighlighted ? "talent-card-highlighted" : ""}`}
      style={{ animationDelay: `${(index + 1) * 90}ms` }}
    >
      {/* 1. Real Portrait Photo Area (4:5 Aspect Ratio, No dark card overlay) */}
      <div className="talent-card-photo-wrap">
        {!imgError && talent.image ? (
          <Image
            src={talent.image}
            alt={`${talent.name}, ${talent.role}`}
            fill
            sizes="(max-width: 600px) 100vw, (max-width: 1050px) 50vw, 25vw"
            className="talent-card-photo"
            unoptimized={true}
            priority={true}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="talent-card-fallback" aria-hidden="true">
            <User size={64} strokeWidth={1.2} className="talent-fallback-icon" />
          </div>
        )}

        {/* Top-Right Clean Rating Badge: White pill, gold star, charcoal score */}
        <div
          className="talent-card-rating-badge"
          aria-label={`Rating: ${talent.rating} out of 5 stars`}
        >
          <Star size={12} fill="#8A6B2E" stroke="#8A6B2E" />
          <span>{talent.rating}</span>
        </div>
      </div>

      {/* 2. Bottom Info Area: White, clean typography, no text truncation */}
      <div className="talent-card-info">
        <h3 className="talent-card-name">{talent.name}</h3>
        <p className="talent-card-role">{talent.role}</p>
        <div className="talent-card-city">
          <MapPin size={13} className="talent-city-icon" />
          <span>{talent.city}</span>
        </div>
      </div>
    </article>
  );
}

export default function TalentRosterSection({ roster }) {
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [isFading, setIsFading] = useState(false);

  const categories = ["ALL", "ACTORS", "MODELS", "VOICE"];
  const allTalent = roster && roster.length > 0 ? roster : eliteTalentRoster;

  const handleCategoryChange = (category) => {
    if (category === activeCategory) return;
    setIsFading(true);
    setTimeout(() => {
      setActiveCategory(category);
      setIsFading(false);
    }, 120);
  };

  const filteredTalent = useMemo(() => {
    if (activeCategory === "ALL") return allTalent;
    return allTalent.filter((item) => {
      if (Array.isArray(item.categories)) {
        return item.categories.some(
          (c) => c.toUpperCase() === activeCategory.toUpperCase()
        );
      }
      return item.category?.toUpperCase() === activeCategory.toUpperCase();
    });
  }, [activeCategory, allTalent]);

  return (
    <section className="talent-roster-section-light" id="talent-roster">
      {/* Subtle radial gold glow at top-left (no pink tint) */}
      <div className="talent-roster-bg-glow" aria-hidden="true" />

      <div className="talent-roster-container">
        {/* 1. Header Row (Left Editorial + Right Info Card) */}
        <div className="talent-roster-header">
          {/* Left Column */}
          <div className="talent-roster-header-left">
            <div className="talent-roster-eyebrow">
              <span className="talent-roster-eyebrow-line" aria-hidden="true" />
              <span className="talent-roster-eyebrow-text">VERIFIED SPOTLIGHT</span>
            </div>

            <h2 className="talent-roster-title">
              Elite Talent Roster<span className="talent-roster-title-dot">.</span>
            </h2>

            <p className="talent-roster-subtext">
              Discover verified actors, lead models, voice artists, and performers vetted by the
              Vismaya compliance desk.
            </p>

            <Link href="/register" className="talent-roster-cta-btn">
              <span>JOIN AS TALENT →</span>
            </Link>
          </div>

          {/* Right Column (~440px Info Card with Filter Pills) */}
          <div className="talent-roster-info-card">
            <div className="talent-roster-info-head">
              <Shield size={18} className="talent-roster-shield-icon" />
              <h3 className="talent-roster-info-title">Why is data obscured?</h3>
            </div>

            <p className="talent-roster-info-body">
              To protect our roster from scraping and unsolicited contact, full portfolios and
              contact details are visible only to logged-in users. All contact is handled through
              Vismaya.
            </p>

            {/* Filter Pills in Track */}
            <div
              className="talent-roster-filter-track"
              role="group"
              aria-label="Filter talent by category"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`talent-roster-filter-pill ${
                    activeCategory === cat ? "active" : ""
                  }`}
                  onClick={() => handleCategoryChange(cat)}
                  aria-pressed={activeCategory === cat}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Cards Grid */}
        <div className={`talent-roster-cards-grid ${isFading ? "is-fading" : ""}`}>
          {filteredTalent.length > 0 ? (
            filteredTalent.map((talent, index) => (
              <TalentCardItem
                key={talent.slug || talent.name}
                talent={talent}
                index={index}
              />
            ))
          ) : (
            <div className="talent-roster-empty">
              <p>No verified talent found in this category.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
