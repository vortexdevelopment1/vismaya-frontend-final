"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminProvider, useAdmin } from "@/lib/admin/AdminContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import ToastContainer from "@/components/shared/Toast";
import { adminService } from "@/lib/api/services/adminService";
import { getAuthToken, removeAuthToken } from "@/lib/api/client";
import { USE_MOCK } from "@/lib/api/config";
import RoleGateLoader from "@/components/auth/RoleGateLoader";
import { useAuth } from "@/context/AuthContext";
import LogoutConfirmModal from "@/components/shared/LogoutConfirmModal";

function AdminLayoutContent({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const { toasts, removeToast } = useAdmin();
  const { logout } = useAuth();

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = mobileOpen ? "hidden" : "";
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [mobileOpen]);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#FAF9F7",
        color: "#2B2D2A",
        position: "relative",
      }}
    >
      {/* Admin Sidebar */}
      <AdminSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onOpenLogout={() => setLogoutModalOpen(true)}
      />

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          marginLeft: "var(--sidebar-width, 280px)",
          width: "calc(100% - var(--sidebar-width, 280px))",
          minWidth: 0,
          minHeight: "100vh",
          backgroundColor: "#FAF9F7",
        }}
        className="admin-main-container"
      >
        {/* Admin Topbar */}
        <AdminTopbar onOpenMobile={() => setMobileOpen(true)} />

        {/* Page Content Viewport */}
        <main
          style={{
            flex: 1,
            paddingInline: "clamp(16px, 2.5vw, 40px)",
            paddingBlock: "clamp(24px, 3vw, 36px)",
            maxWidth: "1440px",
            width: "100%",
            marginInline: "auto",
            minWidth: 0,
            boxSizing: "border-box",
          }}
          className="admin-page-main"
        >
          {children}
        </main>
      </div>

      {/* Shared Toasts */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={async () => {
          await logout("/admin/login");
        }}
      />

      <style jsx global>{`
        :root {
          --sidebar-width: 280px;
          --topbar-height: 72px;
        }
        @media (max-width: 1366px) {
          :root {
            --sidebar-width: 240px;
          }
        }
        @media (max-width: 1100px) {
          .admin-main-container {
            margin-left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            overflow-x: hidden !important;
          }
          .admin-page-main {
            padding-inline: 16px !important;
            padding-block: 20px !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
          }
        }
        @media (max-width: 640px) {
          :root {
            --sidebar-width: min(82vw, 300px);
            --topbar-height: 56px;
          }
          .admin-main-container {
            margin-left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: hidden !important;
          }
          .admin-page-main {
            padding-inline: 16px !important;
            padding-block: 16px 24px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
          }
        }
        @media (max-width: 400px) {
          .admin-page-main {
            padding-inline: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}

function VerifiedAdminGuard({ children }) {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState(USE_MOCK ? "authorized" : "verifying");
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    if (USE_MOCK) return;

    // Fast path: if no stored auth token exists, immediately redirect to /admin/login without backend call
    const token = getAuthToken();
    if (!token) {
      setAuthStatus("unauthorized");
      router.replace("/admin/login");
      return;
    }

    let isMounted = true;
    setErrorMessage(null);
    setIsWakingUp(false);
    setAuthStatus("verifying");

    // 8-second wake-up hint timer
    const wakeTimer = setTimeout(() => {
      if (isMounted) {
        setIsWakingUp(true);
      }
    }, 8000);

    async function checkServerSession() {
      try {
        const res = await adminService.verifyAdminSession();
        if (!isMounted) return;

        if (res.success && res.isAdmin) {
          clearTimeout(wakeTimer);
          setAuthStatus("authorized");
        } else {
          // Explicit unauthorized response (401, 403 or non-admin)
          if (res.status === 401 || res.status === 403 || res.isAdmin === false) {
            clearTimeout(wakeTimer);
            removeAuthToken();
            setAuthStatus("unauthorized");
            router.replace("/admin/login");
          } else {
            // Network error / server unreachable
            clearTimeout(wakeTimer);
            setAuthStatus("error");
            setErrorMessage("Could not reach the server. Please check your connection.");
          }
        }
      } catch (err) {
        if (!isMounted) return;
        clearTimeout(wakeTimer);
        const status = err?.status;
        if (status === 401 || status === 403) {
          removeAuthToken();
          setAuthStatus("unauthorized");
          router.replace("/admin/login");
        } else {
          setAuthStatus("error");
          setErrorMessage("Could not reach the server. Please check your connection.");
        }
      }
    }

    checkServerSession();

    return () => {
      isMounted = false;
      clearTimeout(wakeTimer);
    };
  }, [router, retryNonce]);

  // In mock mode, render immediately
  if (USE_MOCK) {
    return (
      <AdminProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </AdminProvider>
    );
  }

  // Fast-path redirecting for unauthenticated visitors
  if (authStatus === "unauthorized") {
    return null;
  }

  // While verifying with server, show shared RoleGateLoader
  if (authStatus === "verifying") {
    return (
      <RoleGateLoader
        theme="admin"
        statusText="VERIFYING ACCESS"
        isWakingUp={isWakingUp}
      />
    );
  }

  // Network / server connection error state with retry button
  if (authStatus === "error") {
    return (
      <RoleGateLoader
        theme="admin"
        statusText="SERVER UNREACHABLE"
        errorMessage={errorMessage || "Could not reach the server."}
        onRetry={() => {
          setRetryNonce((prev) => prev + 1);
        }}
      />
    );
  }

  return (
    <AdminProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminProvider>
  );
}

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  // Public admin authentication and recovery pages are rendered directly without admin frame or route guard
  const isAuthPage =
    pathname === "/admin/login" ||
    pathname?.startsWith("/admin/login") ||
    pathname === "/admin/forgot-password" ||
    pathname?.startsWith("/admin/forgot-password");

  if (isAuthPage) {
    return <>{children}</>;
  }

  return <VerifiedAdminGuard>{children}</VerifiedAdminGuard>;
}
