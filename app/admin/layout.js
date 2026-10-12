"use client";

import React, { useState } from "react";
import { AdminProvider, useAdmin } from "@/lib/admin/AdminContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import ToastContainer from "@/components/shared/Toast";

function AdminLayoutContent({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toasts, removeToast } = useAdmin();

  React.useEffect(() => {
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
      `}</style>
    </div>
  );
}

import RequireRole from "@/components/auth/RequireRole";

export default function AdminLayout({ children }) {
  return (
    <RequireRole allowedRoles={["admin"]}>
      <AdminProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </AdminProvider>
    </RequireRole>
  );
}
