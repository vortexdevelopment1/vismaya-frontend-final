"use client";

import { useEffect } from "react";
import { API_URL } from "@/lib/api/config";

/**
 * Fires a single non-blocking health check to the backend on first client load
 * so the Render free service starts waking up as soon as someone opens the site.
 * Errors are safely ignored.
 */
export default function BackendWakeupPing() {
  useEffect(() => {
    try {
      const url = `${API_URL.replace(/\/+$/, "")}/health`;
      // Fire-and-forget fetch without await, ignoring all network results/errors
      fetch(url, { method: "GET", mode: "cors" }).catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  return null;
}
