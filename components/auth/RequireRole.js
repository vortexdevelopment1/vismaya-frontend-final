"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { USE_MOCK } from "@/lib/api/config";
import { toFrontendRole, toBackendRole } from "@/lib/api/roles";

export default function RequireRole({ allowedRoles = [], children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, isLoading, isAuthenticated, getDashboardPath, isLoggingOut } = useAuth();

  useEffect(() => {
    // If user explicitly initiated logout, bail out so router.replace("/") is not overridden
    if (isLoggingOut) return;

    // In mock mode, route guards do not block navigation to maintain demo parity
    if (USE_MOCK) return;

    if (!isLoading) {
      if (!isAuthenticated) {
        const redirectUrl = `/login?redirect=${encodeURIComponent(pathname || "/")}`;
        router.replace(redirectUrl);
        return;
      }

      // Check role authorization
      if (allowedRoles.length > 0 && user) {
        const userFeRole = toFrontendRole(user.role);
        const userBeRole = toBackendRole(user.role);
        const isAllowed = allowedRoles.some((r) => {
          const norm = r.toLowerCase().trim();
          return norm === userFeRole || norm === userBeRole || norm === (user.role || "").toLowerCase().trim();
        });

        if (!isAllowed) {
          router.replace(getDashboardPath());
        }
      }
    }
  }, [isLoading, isAuthenticated, user, role, allowedRoles, pathname, router, getDashboardPath, isLoggingOut]);

  // In mock mode, always render children directly
  if (USE_MOCK) {
    return <>{children}</>;
  }

  // If user is currently logging out, render null until landed on home
  if (isLoggingOut) {
    return null;
  }

  // Real mode: show sleek glass loading screen while verifying session
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary, #070b12)",
          color: "#eceaf5",
        }}
      >
        <div
          className="glass"
          style={{
            padding: "32px 48px",
            borderRadius: "20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            background: "var(--bg-surface, #FFFFFF)",
            border: "1px solid var(--border-color, #E8E2D4)",
            boxShadow: "0 10px 30px rgba(43, 45, 42, 0.08)",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "3px solid rgba(138, 107, 46, 0.2)",
              borderTopColor: "var(--gold, #8A6B2E)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span style={{ fontSize: "14px", color: "var(--text-secondary, #5A584F)", fontWeight: "600" }}>
            Verifying Session Access...
          </span>
          <style jsx>{`
            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // If unauthenticated or unauthorized during real mode redirect, render null / loading
  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles.length > 0 && user) {
    const userFeRole = toFrontendRole(user.role);
    const userBeRole = toBackendRole(user.role);
    const isAllowed = allowedRoles.some((r) => {
      const norm = r.toLowerCase().trim();
      return norm === userFeRole || norm === userBeRole || norm === (user.role || "").toLowerCase().trim();
    });

    if (!isAllowed) {
      return null;
    }
  }

  return <>{children}</>;
}
