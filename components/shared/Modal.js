"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "560px",
  style = {},
}) {
  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      className="modal-backdrop-wrap"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(43, 45, 42, 0.55)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          animation: "fadeIn 0.2s ease-out",
        }}
      />

      {/* Modal / Bottom-Sheet Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "relative",
          zIndex: 101,
          width: "100%",
          maxWidth: `min(${maxWidth}, calc(100vw - 32px))`,
          maxHeight: "min(90dvh, 90vh)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          backgroundColor: "var(--bg-surface, #FFFFFF)",
          border: "1px solid var(--border-color, #E4E1D9)",
          borderRadius: "8px",
          boxShadow: "0 20px 48px rgba(41, 44, 41, 0.16)",
          color: "var(--text-primary, #292C29)",
          ...style,
        }}
        className="modal-dialog-panel"
      >
        {/* Mobile Drag Handle */}
        <div className="modal-sheet-handle-wrap">
          <div className="bottom-sheet-drag-handle" />
        </div>

        {/* Header - Gold-Brown Theme Band */}
        {(title || onClose) && (
          <div
            style={{
              padding: "18px 24px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.18)",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "16px",
              backgroundColor: "var(--gold, #9B7A3F)",
              color: "#FAF9F6",
              flexShrink: 0,
            }}
            className="modal-header-box"
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              {title && (
                <h3
                  style={{
                    fontFamily: "var(--font-heading), Georgia, serif",
                    fontSize: "20px",
                    lineHeight: "26px",
                    fontWeight: "700",
                    color: "#FAF9F6",
                    margin: 0,
                  }}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p
                  style={{
                    fontSize: "13px",
                    lineHeight: "20px",
                    color: "rgba(250, 249, 246, 0.88)",
                    margin: "4px 0 0 0",
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>

            {onClose && (
              <button
                onClick={onClose}
                aria-label="Close dialog"
                style={{
                  color: "#FAF9F6",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  cursor: "pointer",
                  transition: "all var(--transition)",
                  flexShrink: 0,
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Scrollable Body */}
        <div
          style={{
            padding: "24px",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            flex: 1,
            backgroundColor: "#FAF9F6",
            color: "var(--text-primary, #292C29)",
          }}
          className="modal-body-content"
        >
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid var(--border-color, #E4E1D9)",
              backgroundColor: "var(--bg-surface, #FFFFFF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "12px",
              flexShrink: 0,
            }}
            className="modal-footer-box"
          >
            {footer}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalPop {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes sheetSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .modal-dialog-panel {
          animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .modal-sheet-handle-wrap {
          display: none;
        }

        @media (max-width: 599.98px) {
          .modal-backdrop-wrap {
            align-items: flex-end !important;
            padding: 0 !important;
          }
          .modal-dialog-panel {
            max-width: 100% !important;
            width: 100% !important;
            max-height: 88dvh !important;
            border-bottom-left-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
            border-top-left-radius: 20px !important;
            border-top-right-radius: 20px !important;
            border-bottom: none !important;
            animation: sheetSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }
          .modal-sheet-handle-wrap {
            display: block !important;
          }
          .modal-header-box {
            padding: 14px 18px !important;
          }
          .modal-body-content {
            padding: 18px !important;
          }
          .modal-footer-box {
            padding: 14px 18px calc(14px + env(safe-area-inset-bottom, 0px)) 18px !important;
          }
        }
      `}</style>
    </div>
  );
}
