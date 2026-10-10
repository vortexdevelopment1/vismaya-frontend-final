"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  WifiOff,
  Clock,
  ShieldAlert,
  FileQuestion,
  RefreshCw,
  Home,
  ArrowLeft,
} from "lucide-react";

export default function ErrorState({
  title,
  message,
  statusCode = 500,
  onRetry,
  onBack,
  compact = false,
  fullPage = false,
}) {
  const getIcon = () => {
    if (statusCode === 0) return <WifiOff size={compact ? 24 : 40} style={{ color: "#ff6b6b" }} />;
    if (statusCode === 408) return <Clock size={compact ? 24 : 40} style={{ color: "#ffd54a" }} />;
    if (statusCode === 403 || statusCode === 401) return <ShieldAlert size={compact ? 24 : 40} style={{ color: "#ff8c42" }} />;
    if (statusCode === 404) return <FileQuestion size={compact ? 24 : 40} style={{ color: "#a3acc2" }} />;
    return <AlertTriangle size={compact ? 24 : 40} style={{ color: "#ff6b6b" }} />;
  };

  const getHeading = () => {
    if (title) return title;
    if (statusCode === 0) return "Connection Failed";
    if (statusCode === 408) return "Request Timed Out";
    if (statusCode === 401) return "Session Expired";
    if (statusCode === 403) return "Access Restricted";
    if (statusCode === 404) return "Resource Not Found";
    return "Something Went Wrong";
  };

  const getDescription = () => {
    if (message) return message;
    if (statusCode === 0) return "Unable to reach the server. Please check your internet connection and try again.";
    if (statusCode === 408) return "The operation took too long to complete. Please check your network and retry.";
    if (statusCode === 401) return "Your login session has expired. Please sign in again to continue.";
    if (statusCode === 403) return "You do not have permission to access or modify this resource.";
    if (statusCode === 404) return "The requested record, brief, or applicant was not found.";
    return "An unexpected error occurred while processing your request. Please try again.";
  };

  const content = (
    <div
      className="glass"
      style={{
        width: "100%",
        maxWidth: compact ? "440px" : "540px",
        padding: compact ? "24px" : "36px 32px",
        borderRadius: "20px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        background: "rgba(15, 22, 38, 0.85)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.55)",
        margin: "0 auto",
        boxSizing: "border-box",
        color: "#eceaf5",
      }}
    >
      <div
        style={{
          width: compact ? "48px" : "64px",
          height: compact ? "48px" : "64px",
          borderRadius: "16px",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {getIcon()}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <h3
          style={{
            fontFamily: "var(--font-heading), 'Playfair Display', serif",
            fontSize: compact ? "18px" : "22px",
            fontWeight: 700,
            margin: 0,
            color: "#eceaf5",
          }}
        >
          {getHeading()}
        </h3>
        <p style={{ fontSize: "13px", color: "#a3acc2", margin: 0, lineHeight: 1.5, maxWidth: "420px" }}>
          {getDescription()}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px", flexWrap: "wrap", justifyContent: "center" }}>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="btn-primary"
            style={{
              padding: "8px 18px",
              fontSize: "13px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
        )}

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary"
            style={{
              padding: "8px 16px",
              fontSize: "13px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={14} />
            <span>Go Back</span>
          </button>
        )}

        {!onRetry && !onBack && (
          <Link
            href="/"
            className="btn-secondary"
            style={{
              padding: "8px 16px",
              fontSize: "13px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              textDecoration: "none",
            }}
          >
            <Home size={14} />
            <span>Back to Home</span>
          </Link>
        )}
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "var(--bg-primary, #070b12)",
        }}
      >
        {content}
      </div>
    );
  }

  return <div style={{ padding: "32px 16px", width: "100%" }}>{content}</div>;
}
