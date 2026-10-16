"use client";

import React, { useEffect } from "react";
import ErrorState from "@/components/shared/ErrorState";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Global Root Error Boundary caught:", error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#070b12", color: "#eceaf5", fontFamily: "sans-serif" }}>
        <ErrorState
          fullPage
          statusCode={error?.status || 500}
          message={error?.message || "A critical system error occurred. Please reload the platform."}
          onRetry={reset}
        />
      </body>
    </html>
  );
}
