"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getAuthToken } from "@/lib/api/client";
import { USE_MOCK } from "@/lib/api/config";
import { toFrontendRole, toBackendRole } from "@/lib/api/roles";
import RoleGateLoader from "@/components/auth/RoleGateLoader";

export default function RequireRole({ allowedRoles = [], children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, isLoading, isAuthenticated, getDashboardPath, isLoggingOut } = useAuth();
  const [isWakingUp, setIsWakingUp] = useState(false);

  // Fast-path immediate redirect for unauthenticated visitors without stored token
  useEffect(() => {
    if (USE_MOCK || isLoggingOut) return;

    const token = getAuthToken();
    const rawUser = typeof window !== "undefined" ? localStorage.getItem("vismaya_user_data") : null;
    if (!token && !rawUser) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname || "/")}`;
      router.replace(redirectUrl);
    }
  }, [pathname, router, isLoggingOut]);

  // 8-second wake-up hint timer while verifying session
  useEffect(() => {
    if (!isLoading) {
      setIsWakingUp(false);
      return;
    }
    const timer = setTimeout(() => {
      setIsWakingUp(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [isLoading]);

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

  // Real mode: show shared RoleGateLoader with warm cream theme for talent/recruiter
  if (isLoading) {
    return (
      <RoleGateLoader
        theme="cream"
        statusText="LOADING YOUR WORKSPACE"
        isWakingUp={isWakingUp}
      />
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
