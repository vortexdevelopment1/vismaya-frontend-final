"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminProvider, useAdmin } from "@/lib/admin/AdminContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import ToastContainer from "@/components/shared/Toast";
import { adminService } from "@/lib/api/services/adminService";
import { USE_MOCK } from "@/lib/api/config";
import { Loader2 } from "lucide-react";

function AdminLayoutContent({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toasts, removeToast } = useAdmin();

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

      <style jsx global>{`
        :root {
          --sidebar-width: 280px;
          --topbar-height: 72px;
        }
        @media (max-width: 1024px) {
          .admin-main-container {
            margin-left: 0 !important;
            width: 100% !important;
          }
          .admin-page-main {
            padding-inline: 16px !important;
            padding-block: 20px !important;
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

  useEffect(() => {
    if (USE_MOCK) return;

    let isMounted = true;
    async function checkServerSession() {
      try {
        const res = await adminService.verifyAdminSession();
        if (!isMounted) return;

        if (res.success && res.isAdmin) {
          setAuthStatus("authorized");
        } else {
          setAuthStatus("unauthorized");
          router.replace("/admin/login");
        }
      } catch {
        if (isMounted) {
          setAuthStatus("unauthorized");
          router.replace("/admin/login");
        }
      }
    }

    checkServerSession();
    return () => {
      isMounted = false;
    };
  }, [router]);

  // In mock mode, render immediately
  if (USE_MOCK) {
    return (
      <AdminProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </AdminProvider>
    );
  }

  // While verifying with server, show secure spinner (NO UI flash of admin layout or data)
  if (authStatus === "verifying") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#161715",
          color: "#EDEAE4",
          gap: "16px",
        }}
      >
        <Loader2 size={36} className="animate-spin" style={{ color: "#C8A96A" }} />
        <p style={{ fontSize: "13px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#C8A96A" }}>
          Verifying Administrator Privileges...
        </p>
      </div>
    );
  }

  if (authStatus === "unauthorized") {
    return null;
  }

  return (
    <AdminProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminProvider>
  );
}

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  // Public admin authentication page is rendered directly without admin frame or route guard
  const isAuthPage =
    pathname === "/admin/login" ||
    pathname?.startsWith("/admin/login");

  if (isAuthPage) {
    return <>{children}</>;
  }

  return <VerifiedAdminGuard>{children}</VerifiedAdminGuard>;
}
