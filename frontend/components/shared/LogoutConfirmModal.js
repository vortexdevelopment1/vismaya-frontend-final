"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

export default function LogoutConfirmModal({ isOpen, onClose, onConfirm }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cardRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const confirmBtnRef = useRef(null);
  const triggerElementRef = useRef(null);

  // Manage focus, scroll lock, and escape key
  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
      return;
    }

    // Capture the trigger element that opened the modal so focus returns to it on close
    triggerElementRef.current = document.activeElement;
    setIsSubmitting(false);

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the modal (Cancel button by default for safety)
    const focusTimer = setTimeout(() => {
      if (cancelBtnRef.current) {
        cancelBtnRef.current.focus();
      }
    }, 40);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      // Return focus to the trigger element when modal closes
      if (triggerElementRef.current && typeof triggerElementRef.current.focus === "function") {
        try {
          triggerElementRef.current.focus();
        } catch {
          // ignore if unmounted
        }
      }
    };
  }, [isOpen]);

  // Trap focus and handle Escape
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      if (!isSubmitting && typeof onClose === "function") {
        e.preventDefault();
        onClose();
      }
      return;
    }

    if (e.key === "Tab") {
      if (!cardRef.current) return;
      const focusableElements = Array.from(
        cardRef.current.querySelectorAll(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting && typeof onClose === "function") {
      onClose();
    }
  };

  const handleConfirmClick = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (typeof onConfirm === "function") {
        await onConfirm();
      }
    } catch (err) {
      console.error("Logout confirmation error:", err);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="logout-modal-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(42, 36, 26, 0.55)",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
      }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
        aria-describedby="logout-confirm-desc"
        className="logout-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E1D2",
          borderRadius: "16px",
          boxShadow: "0 20px 48px rgba(42, 36, 26, 0.16)",
          color: "#2A241A",
          width: "100%",
          maxWidth: "440px",
          padding: "24px",
          boxSizing: "border-box",
        }}
      >
        <h2
          id="logout-confirm-title"
          style={{
            fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
            fontSize: "20px",
            fontWeight: 600,
            color: "#2A241A",
            margin: "0 0 8px 0",
            lineHeight: 1.3,
          }}
        >
          Log out of Vismaya?
        </h2>

        <p
          id="logout-confirm-desc"
          style={{
            fontFamily: "var(--font-body), 'Inter', sans-serif",
            fontSize: "14px",
            color: "#6B6254",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          You will need to sign in again to access your dashboard.
        </p>

        <div className="logout-modal-actions">
          <button
            ref={cancelBtnRef}
            type="button"
            className="logout-modal-btn logout-modal-btn-cancel"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E1D2",
              color: "#2A241A",
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>

          <button
            ref={confirmBtnRef}
            type="button"
            className="logout-modal-btn logout-modal-btn-confirm"
            onClick={handleConfirmClick}
            disabled={isSubmitting}
            style={{
              fontFamily: "var(--font-body), 'Inter', sans-serif",
              backgroundColor: "#8A6B2E",
              border: "1px solid #8A6B2E",
              color: "#FFFFFF",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.85 : 1,
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Logging out…</span>
              </>
            ) : (
              <span>Log out</span>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        .logout-modal-backdrop {
          animation: logoutFadeIn 0.16s ease-out forwards;
        }
        .logout-modal-card {
          animation: logoutScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes logoutFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes logoutScaleIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .logout-modal-actions {
          display: flex;
          align-items: center;
          justifyContent: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        .logout-modal-btn {
          height: 42px;
          min-height: 42px;
          padding: 0 20px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justifyContent: center;
          gap: 8px;
          box-sizing: border-box;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .logout-modal-btn-cancel:hover:not(:disabled) {
          background-color: #F3EFE6 !important;
          border-color: #DCD4C4 !important;
        }

        .logout-modal-btn-confirm:hover:not(:disabled) {
          background-color: #755923 !important;
          border-color: #755923 !important;
        }

        .logout-modal-btn:focus-visible {
          outline: 2px solid #8A6B2E;
          outline-offset: 2px;
        }

        /* Mobile layout (<= 640px and 390px) */
        @media (max-width: 640px) {
          .logout-modal-card {
            width: calc(100% - 32px) !important;
            max-width: 440px !important;
            margin: 0 16px !important;
            padding: 22px 18px !important;
          }
          .logout-modal-actions {
            flex-direction: column !important;
            gap: 10px !important;
            margin-top: 20px !important;
            width: 100% !important;
          }
          .logout-modal-btn {
            width: 100% !important;
            height: 48px !important;
            min-height: 48px !important;
            font-size: 14px !important;
          }
          /* Button stacking per specification: Log out on top, Cancel below */
          .logout-modal-btn-confirm {
            order: 1 !important;
          }
          .logout-modal-btn-cancel {
            order: 2 !important;
          }
        }
      `}</style>
    </div>
  );
}
