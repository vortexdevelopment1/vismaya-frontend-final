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
        background: "var(--bg-gradient)",
        backgroundAttachment: "fixed",
        color: "var(--text-primary)",
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
          marginLeft: "var(--sidebar-width)",
          width: "calc(100% - var(--sidebar-width))",
          minWidth: 0,
          minHeight: "100vh",
        }}
        className="admin-main-container"
      >
        {/* Admin Topbar */}
        <AdminTopbar onOpenMobile={() => setMobileOpen(true)} />

        {/* Page Content Viewport with Standard 1440px Wrapper */}
        <main
          style={{
            flex: 1,
            paddingInline: "clamp(16px, 2.5vw, 32px)",
            paddingBlock: "24px",
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
        @media (max-width: 1024px) {
          .admin-main-container {
            margin-left: 0 !important;
            width: 100% !important;
          }
          .admin-page-main {
            padding-block: 16px !important;
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
