"use client";

import React, { useState } from "react";
import { TalentProvider, useTalent } from "@/lib/talent/TalentContext";
import TalentSidebar from "@/components/talent/TalentSidebar";
import TalentTopbar from "@/components/talent/TalentTopbar";
import ToastContainer from "@/components/shared/Toast";

function TalentLayoutContent({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toasts, removeToast } = useTalent();

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
        minHeight: "100dvh",
        background: "var(--bg-gradient)",
        backgroundAttachment: "fixed",
        color: "var(--text-primary)",
        position: "relative",
      }}
    >
      {/* Talent Sidebar */}
      <TalentSidebar
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
          minWidth: 0,
          minHeight: "100dvh",
        }}
        className="talent-main-container"
      >
        {/* Talent Topbar */}
        <TalentTopbar onOpenMobile={() => setMobileOpen(true)} />

        {/* Page Content Viewport */}
        <main
          style={{
            flex: 1,
            padding: "clamp(16px, 3vw, 32px)",
            maxWidth: "1280px",
            width: "100%",
            margin: "0 auto",
            boxSizing: "border-box",
            minWidth: 0,
          }}
        >
          {children}
        </main>
      </div>

      {/* Shared Toasts */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <style jsx global>{`
        @media (max-width: 1023.98px) {
          .talent-main-container {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

import RequireRole from "@/components/auth/RequireRole";

export default function TalentLayout({ children }) {
  return (
    <RequireRole allowedRoles={["talent"]}>
      <TalentProvider>
        <TalentLayoutContent>{children}</TalentLayoutContent>
      </TalentProvider>
    </RequireRole>
  );
}
