"use client";

import React, { useState, useEffect } from "react";
import { Film, AlertCircle, Video } from "lucide-react";

export default function VideoPlayer({
  src,
  poster,
  fileName,
  height = "280px",
  style = {},
  className = "",
}) {
  const [hasError, setHasError] = useState(false);

  // Reset error if src changes to a new value
  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div
        className={className}
        style={{
          width: "100%",
          minHeight: height,
          backgroundColor: "rgba(255, 255, 255, 0.04)",
          borderRadius: "14px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#eceaf5",
          textAlign: "center",
          padding: "24px 20px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          gap: "10px",
          ...style,
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: "rgba(255, 188, 0, 0.12)",
            border: "1px solid rgba(255, 188, 0, 0.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--gold)",
          }}
        >
          <Film size={24} />
        </div>
        <div>
          <strong
            style={{
              display: "block",
              fontSize: "0.925rem",
              color: "#eceaf5",
              marginBottom: "4px",
            }}
          >
            Preview not available after refresh
          </strong>
          <p
            style={{
              fontSize: "0.785rem",
              color: "#a3acc2",
              margin: 0,
              maxWidth: "380px",
              lineHeight: 1.4,
            }}
          >
            {fileName ? `File: ${fileName} • ` : ""}Local object preview URLs reset upon page reload. In production, self-tapes stream from permanent cloud storage.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        aspectRatio: "16 / 9",
        backgroundColor: "#070b12",
        borderRadius: "14px",
        overflow: "hidden",
        border: "1px solid rgba(255, 255, 255, 0.14)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
      className={className}
    >
      <video
        controls
        playsInline
        src={src}
        poster={poster}
        onError={() => setHasError(true)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          backgroundColor: "#070b12",
          outline: "none",
          display: "block",
        }}
      />
    </div>
  );
}
