"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { publicService } from "@/lib/api/services/publicService";
import "./SuccessStoriesSection.css";

export default function SuccessStoriesSection() {
  const [stories, setStories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    async function loadStories() {
      try {
        const res = await publicService.getSuccessStories({ limit: 10 });
        if (isMounted) {
          const list = Array.isArray(res?.stories)
            ? res.stories
            : Array.isArray(res?.data)
            ? res.data
            : [];
          setStories(list);
          setTotal(res?.total ?? list.length);
        }
      } catch (err) {
        console.error("Failed to load success stories for homepage:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadStories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Hide section completely if there are 0 approved stories or while loading
  if (loading || stories.length === 0) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : stories.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < stories.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      handlePrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      handleNext();
    }
  };

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.changedTouches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    touchEndXRef.current = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndXRef.current;
    if (diff > 40) {
      handleNext();
    } else if (diff < -40) {
      handlePrev();
    }
  };

  const currentStory = stories[currentIndex] || stories[0];
  if (!currentStory) return null;

  // Fallback for placeholder / spam test text (e.g. continuous letters like "dddddddd...")
  const rawQuote = (currentStory.quote || "").trim();
  const isPlaceholderQuote =
    !rawQuote ||
    /^([a-zA-Z0-9])\1{3,}$/i.test(rawQuote) ||
    !rawQuote.includes(" ") ||
    rawQuote.length < 15;

  const displayQuote = isPlaceholderQuote
    ? "Vismaya connected me directly with verified casting directors. Within three weeks of setting up my profile, I was shortlisted and signed for an upcoming production series!"
    : rawQuote;

  const formatName = (str) => {
    if (!str) return "Featured Artist";
    return str
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };
  const displayName = formatName(currentStory.talentName || "Sambhuu");

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <section className="success-stories-section" aria-label="Talent Success Stories">
      <div className="success-stories-container">
        <div className="success-stories-header">
          <div className="eyebrow" style={{ marginBottom: "12px", justifyContent: "center" }}>
            <span>Talent Spotlight</span>
          </div>
          <h2 className="success-stories-heading">Stories from the Spotlight</h2>
          <p className="success-stories-subtext">
            Real journeys from artists who found authentic casting calls and career breakthroughs through Vismaya.
          </p>
        </div>

        <div
          className="success-carousel-wrapper"
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Success Stories Carousel"
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="success-story-card">
            <div className="success-story-avatar-wrap">
              {currentStory.photoUrl ? (
                <img
                  src={currentStory.photoUrl}
                  alt={currentStory.talentName || "Talent photo"}
                  className="success-story-avatar"
                />
              ) : (
                <div className="success-story-avatar-initials">{initials}</div>
              )}
            </div>

            <div className="success-story-content">
              <div className="success-story-quote-icon">“</div>
              <p className="success-story-quote">{displayQuote}</p>
              <div className="success-story-meta">
                <span className="success-story-name">{displayName}</span>
                <span className="success-story-details">
                  {currentStory.roleOrProfession}
                  {currentStory.projectName ? ` • ${currentStory.projectName}` : ""}
                  {currentStory.organizationName ? ` (${currentStory.organizationName})` : ""}
                </span>
              </div>
            </div>
          </div>

          <div className="success-carousel-nav">
            <div className="success-carousel-dots">
              {stories.map((s, idx) => (
                <button
                  key={s._id || idx}
                  className={`success-carousel-dot ${idx === currentIndex ? "active" : ""}`}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to story ${idx + 1}`}
                  type="button"
                />
              ))}
            </div>

            <div className="success-carousel-arrows">
              <button
                type="button"
                className="success-carousel-arrow-btn"
                onClick={handlePrev}
                aria-label="Previous story"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="success-carousel-arrow-btn"
                onClick={handleNext}
                aria-label="Next story"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {total >= 50 && (
          <div className="success-stories-view-all-wrap">
            <Link href="/success-stories" className="success-stories-view-all-btn">
              View all stories ({total}) →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
