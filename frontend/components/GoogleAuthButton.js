"use client";

import React, { useState, useEffect, useRef } from "react";
import Script from "next/script";
import { useAuth } from "@/context/AuthContext";
import "./GoogleAuthButton.css";

export default function GoogleAuthButton({
  role = null,
  isRegister = false,
  onSuccess = null,
  onError = null,
}) {
  const { loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimeoutRef = useRef(null);

  // Feature Flag check: visible when NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true'
  const isEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const isPlaceholderClientId =
    !clientId ||
    clientId.includes("your_google_client_id_here") ||
    clientId.includes("placeholder");

  const showToast = (msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const handleCredentialResponse = async (idToken) => {
    setIsLoading(true);
    try {
      const res = await loginWithGoogle(idToken, role);
      if (res.success && res.user) {
        if (onSuccess) onSuccess(res.user);
      } else {
        const friendlyMsg = "Google sign-in is not available yet. Please use email and password.";
        showToast(friendlyMsg);
        if (onError) onError(friendlyMsg);
      }
    } catch {
      const friendlyMsg = "Google sign-in is not available yet. Please use email and password.";
      showToast(friendlyMsg);
      if (onError) onError(friendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Google Identity Services when script is ready
  useEffect(() => {
    if (!isEnabled || !scriptLoaded || typeof window === "undefined" || !window.google?.accounts?.id) {
      return;
    }

    if (!isPlaceholderClientId && clientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) {
              handleCredentialResponse(response.credential);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      } catch (e) {
        console.warn("Google Identity Services initialization:", e);
      }
    }
  }, [isEnabled, scriptLoaded, clientId, isPlaceholderClientId, role]);

  if (!isEnabled) {
    return null;
  }

  const handleButtonClick = async () => {
    // On Register page, verify role selection first
    if (isRegister && !role) {
      const msg = "Please select an account type (Talent or Organization) first.";
      showToast(msg);
      if (onError) onError(msg);
      return;
    }

    // If client ID is not configured yet or script unavailable
    if (isPlaceholderClientId || !window.google?.accounts?.id) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        const friendlyMsg = "Google sign-in is not available yet. Please use email and password.";
        showToast(friendlyMsg);
        if (onError) onError(friendlyMsg);
      }, 350);
      return;
    }

    // Trigger Google One Tap / Sign-in prompt
    try {
      setIsLoading(true);
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setIsLoading(false);
          const friendlyMsg = "Google sign-in is not available yet. Please use email and password.";
          showToast(friendlyMsg);
          if (onError) onError(friendlyMsg);
        }
      });
    } catch {
      setIsLoading(false);
      const friendlyMsg = "Google sign-in is not available yet. Please use email and password.";
      showToast(friendlyMsg);
      if (onError) onError(friendlyMsg);
    }
  };

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />

      <div className="v-auth-divider">
        <span>or</span>
      </div>

      <button
        suppressHydrationWarning
        type="button"
        className="v-btn-google"
        onClick={handleButtonClick}
        disabled={isLoading}
        aria-label="Continue with Google"
      >
        {isLoading ? (
          <div className="v-google-spinner" aria-hidden="true" />
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          >
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        )}
        <span>{isLoading ? "Connecting to Google..." : "Continue with Google"}</span>
      </button>

      {toastMessage && (
        <div className="v-google-toast" role="alert">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#C9A55C"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
