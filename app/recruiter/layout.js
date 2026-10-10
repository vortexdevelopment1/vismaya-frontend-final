"use client";

import React, { useState, Suspense } from "react";
import { RecruiterProvider, useRecruiter } from "@/lib/recruiter/RecruiterContext";
import RecruiterSidebar from "@/components/recruiter/RecruiterSidebar";
import RecruiterTopbar from "@/components/recruiter/RecruiterTopbar";
import ToastContainer from "@/components/shared/Toast";

function RecruiterLayoutContent({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toasts, removeToast } = useRecruiter();

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
      {/* Recruiter Sidebar with Suspense boundary for search params */}
      <Suspense fallback={null}>
        <RecruiterSidebar
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
      </Suspense>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          marginLeft: "var(--sidebar-width)",
          minWidth: 0,
          minHeight: "100vh",
        }}
        className="recruiter-main-container"
      >
        {/* Recruiter Topbar */}
        <RecruiterTopbar onOpenMobile={() => setMobileOpen(true)} />

        {/* Page Content Viewport */}
        <main
          style={{
            flex: 1,
            width: "100%",
            maxWidth: "1440px",
            marginInline: "auto",
            paddingInline: "clamp(16px, 2.5vw, 32px)",
            paddingBlock: "24px",
            minWidth: 0,
            boxSizing: "border-box",
          }}
          className="recruiter-main-viewport"
        >
          <Suspense fallback={null}>{children}</Suspense>
        </main>
      </div>

      {/* Shared Toasts */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <style jsx global>{`
        :root {
          --sidebar-width: 260px;
          --topbar-height: 72px;
        }
        @media (max-width: 1023.98px) {
          :root {
            --topbar-height: 64px;
          }
          .recruiter-main-container {
            margin-left: 0 !important;
          }
        }

        /* Standardized Organization Dashboard Buttons (Requirement 8) */
        .recruiter-main-container button:not(.nav-item):not(.tab-btn):not(.icon-only-btn):not(.nav-toggle-btn),
        .recruiter-main-container .btn,
        .recruiter-main-container .btn-primary,
        .recruiter-main-container .btn-secondary,
        .recruiter-main-container .btn-ghost,
        .recruiter-main-container .btn-danger,
        .recruiter-main-container .btn-danger-outline,
        .recruiter-main-container .btn-glass,
        .recruiter-main-container .btn-dash,
        .recruiter-main-container .btn-sm {
          font-family: var(--font-body), "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 13px;
          font-weight: 600;
          text-transform: none;
          letter-spacing: normal;
          min-height: 36px;
          border-radius: 10px;
          white-space: nowrap;
        }

        .recruiter-main-container .btn-danger-outline {
          background: transparent;
          color: #ff6b6b;
          border: 1px solid rgba(255, 107, 107, 0.4);
        }
        .recruiter-main-container .btn-danger-outline:hover {
          background: rgba(255, 107, 107, 0.12);
          border-color: #ff6b6b;
        }

        @media (max-width: 767.98px) {
          .recruiter-main-viewport {
            padding-block: 16px !important;
          }
          .recruiter-main-container button:not(.nav-item):not(.tab-btn):not(.icon-only-btn):not(.nav-toggle-btn),
          .recruiter-main-container .btn,
          .recruiter-main-container .btn-primary,
          .recruiter-main-container .btn-secondary,
          .recruiter-main-container .btn-ghost,
          .recruiter-main-container .btn-danger,
          .recruiter-main-container .btn-danger-outline,
          .recruiter-main-container .btn-glass,
          .recruiter-main-container .btn-dash,
          .recruiter-main-container .btn-sm {
            min-height: 40px;
          }
        }
      `}</style>
    </div>
  );
}

import RequireRole from "@/components/auth/RequireRole";

export default function RecruiterLayout({ children }) {
  return (
    <RequireRole allowedRoles={["recruiter", "organization"]}>
      <RecruiterProvider>
        <RecruiterLayoutContent>{children}</RecruiterLayoutContent>
      </RecruiterProvider>
    </RequireRole>
  );
}
