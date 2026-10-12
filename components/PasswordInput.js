"use client";

import React, { useState } from "react";
import "./PasswordInput.css";

export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder = "••••••••••••",
  required = false,
  autoComplete,
  style = {},
  inputStyle = {},
  className = "",
  leftIcon = null,
  disabled = false,
  "aria-describedby": ariaDescribedBy,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="v-password-wrapper" style={style}>
      {leftIcon && (
        <span
          style={{
            position: "absolute",
            left: "14px",
            color: "var(--text-secondary, #777970)",
            pointerEvents: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          {leftIcon}
        </span>
      )}
      <input
        id={id}
        name={name}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-describedby={ariaDescribedBy}
        className={`v-password-input ${className}`}
        style={{
          paddingLeft: leftIcon ? "42px" : undefined,
          ...inputStyle,
        }}
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        aria-label={showPassword ? "Hide password" : "Show password"}
        aria-pressed={showPassword}
        className="v-password-toggle-btn"
        tabIndex={0}
      >
        {showPassword ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
