"use client";

import React, { useEffect, useState } from "react";

/**
 * Shared Role & Auth Gate Loader
 * 
 * Aesthetic loading screen matching:
 * - Admin: Dark background #151412, gold accent #8A6B2E, light text
 * - Talent/Recruiter: Warm cream background #FAF8F3, dark text #2B2D2A
 * - Centered column with pulsing 56px rounded-square Vismaya "V" logo mark
 * - Thin 160px progress line with indeterminate sliding gold bar
 * - Uppercase status text with animated dots
 * - Friendly 8s delayed server wake-up hint
 * - Respects prefers-reduced-motion
 */
export default function RoleGateLoader({
  theme = "admin", // "admin" | "cream" | "talent" | "recruiter"
  statusText,
  isWakingUp = false,
  onRetry = null,
  errorMessage = null,
}) {
  const isDark = theme === "admin";
  const defaultStatus = isDark ? "VERIFYING ACCESS" : "LOADING YOUR WORKSPACE";
  const displayText = statusText || defaultStatus;

  // Local animated dots (1 to 3 dots)
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    // If reduced motion is preferred or retry state is shown, skip interval
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const timer = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 450);
    return () => clearInterval(timer);
  }, []);

  const dots = ".".repeat(dotCount);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isDark ? "#151412" : "#FAF8F3",
        color: isDark ? "#FAF9F6" : "#2B2D2A",
        zIndex: 9999,
        padding: "24px",
        boxSizing: "border-box",
        fontFamily: "var(--font-body), 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: "380px",
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* Vismaya "V" Logo Mark: 56px rounded square, gold #8A6B2E, white serif V */}
        <div
          className="vismaya-loader-logo"
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            backgroundColor: "#8A6B2E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isDark
              ? "0 10px 28px rgba(0, 0, 0, 0.45), 0 0 20px rgba(138, 107, 46, 0.25)"
              : "0 10px 24px rgba(43, 45, 42, 0.12), 0 0 16px rgba(138, 107, 46, 0.2)",
            userSelect: "none",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
              fontSize: "30px",
              fontWeight: 700,
              color: "#FFFFFF",
              lineHeight: 1,
              transform: "translateY(-1px)",
            }}
          >
            V
          </span>
        </div>

        {/* 160px Indeterminate Sliding Progress Bar */}
        {!errorMessage && (
          <div
            style={{
              width: "160px",
              height: "2px",
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(43, 45, 42, 0.1)",
              borderRadius: "2px",
              marginTop: "24px",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              className="vismaya-loader-bar"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                width: "45%",
                backgroundColor: "#8A6B2E",
                borderRadius: "2px",
              }}
            />
          </div>
        )}

        {/* Status Text: 13px uppercase letter-spacing .14em with animated dots */}
        <div
          style={{
            marginTop: errorMessage ? "20px" : "18px",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: isDark ? "#D8D2C4" : "#4A473E",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "20px",
          }}
        >
          <span>{displayText}</span>
          {!errorMessage && (
            <span
              aria-hidden="true"
              style={{
                display: "inline-block",
                width: "20px",
                textAlign: "left",
                fontFamily: "monospace",
              }}
            >
              {dots}
            </span>
          )}
        </div>

        {/* 8s Delayed Waking Server Hint */}
        {isWakingUp && !errorMessage && (
          <p
            className="vismaya-loader-fadein"
            style={{
              marginTop: "12px",
              fontSize: "12px",
              lineHeight: 1.5,
              color: isDark ? "#8E887B" : "#7A766B",
              maxWidth: "300px",
              marginInline: "auto",
            }}
          >
            The server is waking up, this can take up to a minute...
          </p>
        )}

        {/* Friendly Error / Retry State */}
        {errorMessage && (
          <div
            className="vismaya-loader-fadein"
            style={{
              marginTop: "16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                lineHeight: 1.5,
                color: isDark ? "#E08577" : "#B84A39",
                margin: 0,
                maxWidth: "320px",
              }}
            >
              {errorMessage}
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                style={{
                  marginTop: "4px",
                  padding: "8px 20px",
                  backgroundColor: "#8A6B2E",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(138, 107, 46, 0.25)",
                  transition: "opacity 0.15s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.opacity = "0.9";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        /* Breathing / pulse animation: scale 1 to 1.06, 1.6s ease-in-out infinite */
        .vismaya-loader-logo {
          animation: logoPulse 1.6s ease-in-out infinite;
        }

        @keyframes logoPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.06);
          }
        }

        /* Indeterminate sliding gold bar: 1.4s linear infinite */
        .vismaya-loader-bar {
          animation: slidingBar 1.4s linear infinite;
        }

        @keyframes slidingBar {
          0% {
            left: -45%;
          }
          100% {
            left: 100%;
          }
        }

        .vismaya-loader-fadein {
          animation: fadeInHint 0.3s ease-out forwards;
        }

        @keyframes fadeInHint {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Respect prefers-reduced-motion (disable animations) */
        @media (prefers-reduced-motion: reduce) {
          .vismaya-loader-logo,
          .vismaya-loader-bar,
          .vismaya-loader-fadein {
            animation: none !important;
          }
          .vismaya-loader-bar {
            left: 27% !important;
            width: 45% !important;
          }
        }
      `}</style>
    </div>
  );
}
