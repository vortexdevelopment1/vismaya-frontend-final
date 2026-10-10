"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { USE_MOCK } from "@/lib/api/config";
import { toFrontendRole, toBackendRole } from "@/lib/api/roles";

export default function RequireRole({ allowedRoles = [], children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, isLoading, isAuthenticated, getDashboardPath } = useAuth();

  useEffect(() => {
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
  }, [isLoading, isAuthenticated, user, role, allowedRoles, pathname, router, getDashboardPath]);

  // In mock mode, always render children directly
  if (USE_MOCK) {
    return <>{children}</>;
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
            background: "rgba(15, 22, 38, 0.75)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "3px solid rgba(255, 188, 0, 0.2)",
              borderTopColor: "var(--gold, #ffbc00)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span style={{ fontSize: "14px", color: "#a3acc2", fontWeight: "600" }}>
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
