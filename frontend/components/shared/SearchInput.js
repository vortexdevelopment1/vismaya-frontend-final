"use client";

import React from "react";
import { Search, X } from "lucide-react";

/**
 * Standardized Accessible SearchInput Component for Vismaya
 *
 * Design Tokens:
 * - Height: 44px desktop, 48px mobile
 * - Radius: 10px
 * - Border: 1px solid #D9D1BF
 * - Background: #FFFFFF
 * - Text: #2A241A
 * - Placeholder: #8A8170
 * - Font: Inter 14px desktop, 16px mobile (prevents iOS auto-zoom)
 * - Focus: ONE gold ring (border-color #8A6B2E + 3px rgba(138,107,46,.18) shadow)
 * - Icon: Absolutely positioned inside box at left 14px, vertically centered
 * - Input padding-left: 42px (never overlaps text)
 */
export default function SearchInput({
  value = "",
  onChange,
  onClear,
  placeholder = "Search...",
  ariaLabel = "Search",
  className = "",
  style = {},
  inputStyle = {},
  wrapperStyle = {},
  onKeyDown,
  onFocus,
  onBlur,
  disabled = false,
  autoFocus = false,
  name,
  id,
}) {
  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof onClear === "function") {
      onClear();
    } else if (typeof onChange === "function") {
      onChange({ target: { value: "" } });
    }
  };

  return (
    <div
      className={`vismaya-search-wrap ${className}`}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        width: "100%",
        boxSizing: "border-box",
        border: "none",
        background: "transparent",
        padding: 0,
        ...wrapperStyle,
        ...style,
      }}
    >
      <Search
        size={18}
        className="vismaya-search-icon"
        style={{
          position: "absolute",
          left: "14px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "#8A8170",
          stroke: "#8A8170",
          pointerEvents: "none",
          zIndex: 2,
          flexShrink: 0,
        }}
      />
      <input
        type="text"
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-label={ariaLabel}
        disabled={disabled}
        autoFocus={autoFocus}
        className="vismaya-search-input"
        style={{
          width: "100%",
          height: "44px",
          minHeight: "44px",
          paddingLeft: "42px",
          paddingRight: value ? "38px" : "14px",
          border: "1px solid #D9D1BF",
          borderRadius: "10px",
          backgroundColor: "#FFFFFF",
          color: "#2A241A",
          fontSize: "14px",
          fontFamily: "var(--font-body), 'Inter', sans-serif",
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.16s ease, box-shadow 0.16s ease",
          ...inputStyle,
        }}
      />
      {Boolean(value) && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search query"
          className="vismaya-search-clear-btn"
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#8A8170",
            padding: "4px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            zIndex: 2,
            transition: "color 0.15s ease, background-color 0.15s ease",
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
