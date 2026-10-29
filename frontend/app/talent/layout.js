"use client";

import React, { useState } from "react";
import { TalentProvider, useTalent } from "@/lib/talent/TalentContext";
import TalentSidebar from "@/components/talent/TalentSidebar";
import TalentTopbar from "@/components/talent/TalentTopbar";
import ToastContainer from "@/components/shared/Toast";
import RequireRole from "@/components/auth/RequireRole";
import { useAuth } from "@/context/AuthContext";
import LogoutConfirmModal from "@/components/shared/LogoutConfirmModal";

function TalentLayoutContent({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const { toasts, removeToast } = useTalent();
  const { logout } = useAuth();

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
      {/* Talent Sidebar */}
      <TalentSidebar
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
        className="talent-main-container"
      >
        {/* Talent Topbar */}
        <TalentTopbar onOpenMobile={() => setMobileOpen(true)} />

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
          className="talent-page-main"
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
          await logout();
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
          .talent-main-container {
            margin-left: 0 !important;
            width: 100% !important;
          }
          .talent-page-main {
            padding-inline: 16px !important;
            padding-block: 20px !important;
          }
          .talent-sidebar:not(.sidebar-open) {
            transform: translateX(-105%) !important;
            visibility: hidden !important;
            pointer-events: none !important;
            box-shadow: none !important;
            border-right: none !important;
          }
          .talent-sidebar.sidebar-open {
            transform: translateX(0) !important;
            visibility: visible !important;
            pointer-events: auto !important;
            box-shadow: 8px 0 28px rgba(43, 45, 42, 0.12) !important;
          }
        }
        @media (max-width: 640px) {
          .talent-main-container {
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: hidden !important;
          }
          .talent-page-main {
            padding-inline: 16px !important;
            padding-block: 16px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function TalentLayout({ children }) {
  return (
    <RequireRole allowedRoles={["talent"]}>
      <TalentProvider>
        <TalentLayoutContent>{children}</TalentLayoutContent>
      </TalentProvider>
    </RequireRole>
  );
}
