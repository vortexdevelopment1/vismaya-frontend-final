"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { publicService } from "@/lib/api/services/publicService";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function SuccessStoriesPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStories() {
      try {
        const res = await publicService.getSuccessStories({ limit: 50 });
        const list = Array.isArray(res?.stories)
          ? res.stories
          : Array.isArray(res?.data)
          ? res.data
          : [];
        setStories(list);
      } catch (err) {
        console.error("Failed to load success stories:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStories();
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-primary)" }}>
      <PublicNav />

      <main style={{ flex: 1, padding: "48px 24px 80px 24px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        {/* Navigation & Header */}
        <div style={{ marginBottom: "32px" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--text-secondary)",
              fontSize: "14px",
              textDecoration: "none",
              marginBottom: "16px",
            }}
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>

          <div className="eyebrow" style={{ marginBottom: "12px" }}>
            <span>Spotlight & Achievements</span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-heading), Georgia, "Times New Roman", serif',
              fontSize: "clamp(32px, 4vw, 44px)",
              fontWeight: 500,
              color: "var(--text-primary)",
              lineHeight: 1.15,
              margin: "0 0 12px 0",
            }}
          >
            Talent Success Stories
          </h1>
          <p style={{ fontSize: "16px", color: "var(--text-secondary)", maxWidth: "680px", margin: 0, lineHeight: 1.6 }}>
            Real journeys from artists and creators who connected with certified casting directors and production teams through Vismaya.
          </p>
        </div>

        {/* Content area */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0", color: "var(--text-secondary)" }}>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  border: "3px solid var(--border-color)",
                  borderTopColor: "var(--gold)",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 16px auto",
                }}
              />
              <p>Loading stories...</p>
            </div>
          </div>
        ) : stories.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 24px",
              background: "var(--bg-surface)",
              borderRadius: "16px",
              border: "1px solid var(--border-color)",
            }}
          >
            <Sparkles size={40} color="var(--gold)" style={{ margin: "0 auto 16px auto", opacity: 0.6 }} />
            <h3 style={{ fontSize: "20px", color: "var(--text-primary)", margin: "0 0 8px 0" }}>No Success Stories Yet</h3>
            <p style={{ color: "var(--text-secondary)", maxWidth: "460px", margin: "0 auto", fontSize: "14px" }}>
              Stories will appear here once approved by our editorial review team.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "24px",
            }}
          >
            {stories.map((story) => {
              const initials = (story.talentName || "T")
                .split(" ")
                .map((w) => w[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <div
                  key={story._id || story.id}
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "16px",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 2px 8px rgba(41, 44, 41, 0.04)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "28px", color: "var(--gold)", opacity: 0.4, lineHeight: 1, marginBottom: "8px", fontFamily: "Georgia, serif" }}>
                      “
                    </div>
                    <p
                      style={{
                        fontFamily: 'var(--font-heading), Georgia, serif',
                        fontStyle: "italic",
                        fontSize: "16px",
                        lineHeight: 1.6,
                        color: "var(--text-primary)",
                        margin: "0 0 20px 0",
                      }}
                    >
                      {story.quote}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "14px", paddingTop: "16px", borderTop: "1px solid var(--border-color)" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        backgroundColor: "var(--bg-alt)",
                        border: "1px solid var(--gold-border)",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {story.photoUrl ? (
                        <img
                          src={story.photoUrl}
                          alt={story.talentName || "Talent"}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <span style={{ fontWeight: 600, color: "var(--gold)", fontSize: "16px" }}>{initials}</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)" }}>
                        {story.talentName}
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                        {story.roleOrProfession}
                        {story.projectName ? ` • ${story.projectName}` : ""}
                        {story.organizationName ? ` (${story.organizationName})` : ""}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
