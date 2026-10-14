"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";

export default function StarRating({
  rating = 0,
  onChange,
  disabled = false,
  size = 18,
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating || rating;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayRating;

        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled && onChange) {
                onChange(star);
              }
            }}
            onMouseEnter={() => {
              if (!disabled) setHoverRating(star);
            }}
            onMouseLeave={() => {
              if (!disabled) setHoverRating(0);
            }}
            style={{
              padding: "2px",
              cursor: disabled ? "default" : "pointer",
              color: isFilled ? "var(--gold)" : "var(--border-color)",
              transition: "transform 0.15s ease, color 0.15s ease",
              transform: !disabled && hoverRating === star ? "scale(1.2)" : "scale(1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
            }}
            title={`${star} Star${star > 1 ? "s" : ""}`}
            aria-label={`Rate ${star} star`}
          >
            <Star
              size={size}
              fill={isFilled ? "var(--gold)" : "transparent"}
              stroke={isFilled ? "var(--gold)" : "var(--text-muted)"}
              strokeWidth={isFilled ? 1.5 : 1.75}
            />
          </button>
        );
      })}
    </div>
  );
}
