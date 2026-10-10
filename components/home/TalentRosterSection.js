"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star, CheckCircle2, Lock, Shield, User } from "lucide-react";
import { eliteTalentRoster } from "@/lib/public/homeData";
import "./TalentRosterSection.css";

// Single Talent Card Component with Error Fallback
function TalentCardItem({ talent }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="talent-card">
      {/* 1. Full Bleed 4:5 Photo Area */}
      <div className="talent-photo-wrap">
        {!imgError && talent.image ? (
          <Image
            src={talent.image}
            alt={`${talent.name}, ${talent.role}`}
            fill
            sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 25vw"
            className="talent-photo"
            unoptimized={true}
            priority={true}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="talent-fallback-silhouette" aria-hidden="true">
            <User size={72} strokeWidth={1.2} className="talent-silhouette-icon" />
          </div>
        )}

        {/* Bottom Dark Gradient Vignette Overlay */}
        <div className="talent-photo-gradient" aria-hidden="true" />

        {/* Top-Right Clean Rating Chip */}
        <div className="talent-rating-chip" aria-label={`Rating: ${talent.rating} out of 5 stars`}>
          <Star size={11} fill="#ffc928" stroke="#ffc928" />
          <span>{talent.rating}</span>
        </div>

        {/* Bottom Text Overlaid on Photo Gradient */}
        <div className="talent-photo-info">
          <h3 className="talent-photo-name" title={talent.name}>
            {talent.name}
          </h3>
          <div className="talent-photo-subline" title={`${talent.role} • ${talent.city}`}>
            <span className="talent-photo-role">{talent.role}</span>
            <span className="talent-photo-dot">•</span>
            <span className="talent-photo-city">{talent.city}</span>
          </div>
        </div>
      </div>

      {/* 2. Card Body Details */}
      <div className="talent-card-body">
        {/* Experience Line */}
        <div className="talent-card-exp">
          <CheckCircle2 size={13} className="talent-check-icon" />
          <span>{talent.experience}</span>
        </div>

        {/* Category Tag Chips */}
        <div className="talent-card-tags">
          {talent.tags &&
            talent.tags.map((tag) => (
              <span key={tag} className="talent-tag-pill">
                {tag}
              </span>
            ))}
        </div>

        {/* Locked Portfolio Action Button (Pinned to Bottom) */}
        <Link href="/login" className="talent-card-btn">
          <Lock size={12} />
          <span>LOGIN TO VIEW PORTFOLIO</span>
        </Link>
      </div>
    </div>
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
    }, 150);
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
    <section className="public-section talent-roster-section" id="talent-roster">
      <div className="public-container">
        {/* 1. Header Row (2-Column Grid) */}
        <div className="talent-header-grid">
          {/* Left Column */}
          <div className="talent-header-left">
            <div className="talent-eyebrow">
              <span className="talent-eyebrow-line" />
              <span className="talent-eyebrow-text">VERIFIED SPOTLIGHT</span>
            </div>

            <h2 className="talent-section-title">Elite Talent Roster.</h2>

            <p className="talent-section-desc">
              Discover verified actors, lead models, voice artists, and performers vetted by Vismaya compliance desk.
            </p>

            <Link href="/register" className="talent-join-btn">
              <span>Join as Talent</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Right Column: Glass Info Box with Filter Pills */}
          <div className="talent-info-box">
            <div className="talent-info-header">
              <Shield size={16} className="talent-shield-icon" />
              <h3 className="talent-info-title">Why is data obscured?</h3>
            </div>

            <p className="talent-info-desc">
              To protect our roster from scraping and unsolicited contact, full portfolios and contact details are visible only to logged-in users. All contact is handled through Vismaya.
            </p>

            {/* Segmented Filter Pills */}
            <div
              className="talent-filter-segmented"
              role="group"
              aria-label="Filter talent by category"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`talent-filter-pill ${activeCategory === cat ? "talent-filter-pill-active" : ""}`}
                  onClick={() => handleCategoryChange(cat)}
                  aria-pressed={activeCategory === cat}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 1px Divider Below Header */}
        <div className="talent-header-divider" aria-hidden="true" />

        {/* 2. Talent Cards Grid with Fixed Track Columns */}
        <div className={`talent-cards-grid ${isFading ? "talent-grid-fade" : ""}`}>
          {filteredTalent.length > 0 ? (
            filteredTalent.map((talent) => (
              <TalentCardItem key={talent.slug || talent.name} talent={talent} />
            ))
          ) : (
            <div className="talent-empty-state">
              <p className="talent-empty-text">No talent in this category yet.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
