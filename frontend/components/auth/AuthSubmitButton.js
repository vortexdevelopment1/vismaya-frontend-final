"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

/**
 * Shared AuthSubmitButton
 * 
 * Design tokens:
 * - gold #8A6B2E (default)
 * - loading gold #9C7F45 (submitting / slow)
 * - success green #2F6B45 (success)
 * - Height: 52px, Radius: 10px, 13px/700 uppercase, letter-spacing .1em, white text
 * - Full width, inline-flex centered with gap 10px
 * - Respects prefers-reduced-motion
 */
export default function AuthSubmitButton({
  status = "idle", // "idle" | "submitting" | "slow" | "success"
  defaultText = "Sign In to Vismaya",
  submittingText = "Signing you in...",
  successText = "Signed in",
  icon = <ArrowRight size={15} />,
  disabled = false,
  type = "submit",
  id,
  className = "",
  style = {},
  onClick,
}) {
  const isSubmitting = status === "submitting" || status === "slow";
  const isSuccess = status === "success";
  const isDisabled = disabled || isSubmitting || isSuccess;

  // Background color based on auth state
  let backgroundColor = "#8A6B2E";
  let cursor = "pointer";

  if (isSubmitting) {
    backgroundColor = "#9C7F45";
    cursor = "not-allowed";
  } else if (isSuccess) {
    backgroundColor = "#2F6B45";
    cursor = "not-allowed";
  } else if (disabled) {
    cursor = "not-allowed";
  }

  return (
    <button
      suppressHydrationWarning
      type={type}
      id={id}
      disabled={isDisabled}
      aria-busy={isSubmitting ? "true" : "false"}
      onClick={onClick}
      className={`auth-submit-btn ${
        isSuccess
          ? "auth-submit-btn-success"
          : isSubmitting
          ? "auth-submit-btn-submitting"
          : "auth-submit-btn-idle"
      } ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        width: "100%",
        height: "52px",
        minHeight: "52px",
        borderRadius: "10px",
        fontFamily: "var(--font-body), 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: "13px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "#FFFFFF",
        backgroundColor,
        cursor,
        border: "1px solid transparent",
        boxSizing: "border-box",
        userSelect: "none",
        transition: "background-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease",
        ...style,
      }}
    >
      {isSuccess ? (
        <>
          {/* White check icon */}
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{successText}</span>
        </>
      ) : isSubmitting ? (
        <>
          {/* 18px spinner: 2.5px border rgba(255,255,255,.35) with white top border, rotating 0.8s */}
          <span className="auth-spinner-18" aria-hidden="true" />
          <span>{submittingText}</span>
        </>
      ) : (
        <>
          <span>{defaultText}</span>
          {icon}
        </>
      )}
    </button>
  );
}
