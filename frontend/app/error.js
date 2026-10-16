"use client";

import React, { useEffect } from "react";
import ErrorState from "@/components/shared/ErrorState";

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    // Log uncaught errors safely in client context
    if (process.env.NODE_ENV !== "production") {
      console.error("App Route Error Boundary caught:", error);
    }
  }, [error]);

  return (
    <div style={{ padding: "48px 16px", minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <ErrorState
        statusCode={error?.status || 500}
        message={error?.message || "An unexpected error occurred while rendering this page."}
        onRetry={reset}
      />
    </div>
  );
}
