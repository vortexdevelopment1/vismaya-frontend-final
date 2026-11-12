"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  UploadCloud,
  FileText,
  User,
  Award,
  ExternalLink,
  ChevronRight,
  Info,
  HelpCircle,
  Eye,
  Camera,
  X,
  RefreshCw,
  ArrowRight,
  KeyRound,
  Lock,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import ProgressBar from "@/components/shared/ProgressBar";
import { verificationService } from "@/lib/api/services/verificationService";
import { mediaService } from "@/lib/api/services/mediaService";
import { useTalent } from "@/lib/talent/TalentContext";
import { isRealMode } from "@/lib/api/config";
import { useAuth } from "@/context/AuthContext";

function TalentVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get("onboarding") === "true";

  const { profile, refreshProfile } = useTalent();
  const { clearSession, logout } = useAuth();
  const [isSubmittedForReview, setIsSubmittedForReview] = useState(false);

  const [activeTab, setActiveTab] = useState("identity"); // 'identity' | 'professional'
  const [identityMode, setIdentityMode] = useState("aadhaar"); // 'aadhaar' | 'manual'
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Aadhaar e-KYC State
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [aadhaarInlineError, setAadhaarInlineError] = useState(null);
  const [otpRefId, setOtpRefId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isWithdrawingConsent, setIsWithdrawingConsent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Identity Form State (Manual fallback)
  const [idType, setIdType] = useState("aadhaar");
  const [idNumber, setIdNumber] = useState("");
  const [docFrontUrl, setDocFrontUrl] = useState("");
  const [docBackUrl, setDocBackUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");
  const [isUploadingFront, setIsUploadingFront] = useState(false);
  const [isUploadingBack, setIsUploadingBack] = useState(false);
  const [isUploadingSelfie, setIsUploadingSelfie] = useState(false);
  const [isSubmittingId, setIsSubmittingId] = useState(false);

  // Professional Form State
  const [imdbLink, setImdbLink] = useState("");
  const [workLink1, setWorkLink1] = useState("");
  const [guildName, setGuildName] = useState("");
  const [guildNumber, setGuildNumber] = useState("");
  const [proofDocUrl, setProofDocUrl] = useState("");
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isSubmittingProf, setIsSubmittingProf] = useState(false);

  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 6000);
  };

  // Resend Countdown Timer
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      const res = await verificationService.getMyVerifications();
      if (res?.data) {
        setVerifications(res.data);
      }
    } catch (err) {
      console.warn("Could not load verifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVerifications();
  }, []);

  const identityVer = verifications.find((v) => v.type === "identity" || v.verificationType === "identity");
  const professionalVer = verifications.find((v) => v.type === "professional" || v.verificationType === "professional");

  const isIdentityVerified =
    Boolean(profile?.isVerified) ||
    Boolean(profile?.verificationBadges?.identityVerified) ||
    (identityVer && (identityVer.status === "verified" || identityVer.rawStatus === "verified" || identityVer.status === "approved"));

  const getStatusBadge = (ver, isIdentity = false) => {
    if (isIdentity && isIdentityVerified) {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "700",
            backgroundColor: "rgba(52, 211, 153, 0.15)",
            color: "#10b981",
            border: "1px solid rgba(52, 211, 153, 0.35)",
          }}
        >
          <CheckCircle2 size={13} />
          <span>VERIFIED BADGE ACTIVE</span>
        </span>
      );
    }

    if (!ver) {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 10px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "700",
            backgroundColor: "#F2EFE8",
            color: "#77756B",
            border: "1px solid #DDD8CD",
          }}
        >
          NOT SUBMITTED
        </span>
      );
    }

    const st = (ver.status || ver.rawStatus || "").toLowerCase();
    if (st === "verified" || st === "approved") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "700",
            backgroundColor: "rgba(52, 211, 153, 0.15)",
            color: "#10b981",
            border: "1px solid rgba(52, 211, 153, 0.35)",
          }}
        >
          <CheckCircle2 size={13} />
          <span>VERIFIED BADGE ACTIVE</span>
        </span>
      );
    }

    if (st === "rejected") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "700",
            backgroundColor: "rgba(239, 68, 68, 0.12)",
            color: "#ef4444",
            border: "1px solid rgba(239, 68, 68, 0.3)",
          }}
        >
          <AlertCircle size={13} />
          <span>REJECTED</span>
        </span>
      );
    }

    if (st === "consent_withdrawn") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 10px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "700",
            backgroundColor: "#F2EFE8",
            color: "#77756B",
            border: "1px solid #DDD8CD",
          }}
        >
          CONSENT WITHDRAWN
        </span>
      );
    }

    if (ver.moreInfoRequested || st === "additional_info_required") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "700",
            backgroundColor: "rgba(255, 188, 0, 0.15)",
            color: "#8A6B2E",
            border: "1px solid rgba(255, 188, 0, 0.35)",
          }}
        >
          <Clock size={13} />
          <span>ADDITIONAL INFO REQUIRED</span>
        </span>
      );
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "4px 12px",
          borderRadius: "8px",
          fontSize: "12px",
          fontWeight: "700",
          backgroundColor: "#FFF9E6",
          color: "#8A6B2E",
          border: "1px solid #F0D078",
        }}
      >
        <Clock size={13} />
        <span>PENDING VETTING</span>
      </span>
    );
  };

  // Upload Handlers
  const handleFileUpload = async (file, setUrl, setLoadingState) => {
    if (!file) return;
    try {
      setLoadingState(true);
      const res = await mediaService.uploadFile(file, { folder: "vismaya/kyc" });
      const url = res?.url || res?.secure_url || (typeof res === "string" ? res : "");
      if (url) {
        setUrl(url);
        showNotification("success", `File ${file.name} uploaded successfully.`);
      }
    } catch (err) {
      showNotification("error", err?.message || "Failed to upload file");
    } finally {
      setLoadingState(false);
    }
  };

  // Aadhaar Input Formatter
  const handleAadhaarChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    setAadhaarNumber(formatted);
  };
  const sanitizedAadhaar = aadhaarNumber.replace(/\s+/g, "");

  // Request Aadhaar OTP Handler
  const handleRequestOtp = async (e) => {
    e?.preventDefault?.();
    const cleanDigits = String(aadhaarNumber || "").replace(/\D/g, "");
    if (cleanDigits.length !== 12) {
      setAadhaarInlineError("Please enter a valid 12-digit Aadhaar number (e.g. 4244 4390 4679).");
      showNotification("error", "Please enter a valid 12-digit Aadhaar number.");
      return;
    }
    if (!consentGiven) {
      setAadhaarInlineError("Please tick the voluntary Aadhaar consent checkbox above to proceed.");
      showNotification("error", "Please accept the voluntary Aadhaar verification consent checkbox above before proceeding.");
      return;
    }
    setAadhaarInlineError(null);
    try {
      setIsSendingOtp(true);
      const consentText = "I voluntarily provide consent to Vismaya Creative Studios to initiate OTP-based identity verification via Cashfree Verification Suite. I understand full Aadhaar numbers and OTPs are never stored, verification is optional, and alternative manual upload is available.";
      const res = await verificationService.initiateAadhaarVerification({
        aadhaarNumber: cleanDigits,
        consentGiven: true,
        consentAccepted: true,
        consentText,
      });

      if (res?.success) {
        setOtpRefId(res.data?.refId || res?.refId || "mock_session");
        setOtpSent(true);
        setResendCountdown(60);
        showNotification("success", res.message || "OTP generated! Use test OTP 123456.");
      } else {
        const msg = res?.message || "Failed to initiate Aadhaar OTP.";
        setAadhaarInlineError(msg);
        showNotification("error", msg);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to initiate Aadhaar OTP";
      setAadhaarInlineError(msg);
      showNotification("error", msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify Aadhaar OTP Handler
  const handleVerifyOtp = async (e) => {
    e?.preventDefault?.();
    if (!otpRefId) {
      showNotification("error", "No active verification session. Please request a fresh OTP.");
      return;
    }
    if (!otpCode || otpCode.trim().length < 6) {
      showNotification("error", "Please enter the 6-digit OTP received on your mobile.");
      return;
    }
    try {
      setIsVerifyingOtp(true);
      const res = await verificationService.verifyAadhaarOtp({
        refId: otpRefId,
        otp: otpCode.trim(),
      });

      if (res?.success) {
        showNotification("success", "Aadhaar Identity Verified successfully! Verified Badge is active.");
        setOtpSent(false);
        setOtpCode("");
        setAadhaarNumber("");
        await loadVerifications();
        if (typeof refreshProfile === "function") {
          await refreshProfile();
        }
        if (isOnboarding) {
          try {
            if (typeof clearSession === "function") {
              clearSession();
            }
          } catch (e) {}
          setTimeout(() => {
            setIsSubmittedForReview(true);
          }, 1500);
        }
      } else {
        showNotification("error", res?.message || "OTP verification failed. Please try again.");
      }
    } catch (err) {
      showNotification("error", err?.response?.data?.message || err?.message || "Verification failed");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Withdraw Aadhaar Consent Handler
  const handleWithdrawConsent = async () => {
    if (!window.confirm("Are you sure you want to withdraw your Aadhaar KYC consent? Your Verified Badge will be removed from your profile and applications.")) {
      return;
    }
    try {
      setIsWithdrawingConsent(true);
      const res = await verificationService.withdrawConsent("aadhaar_kyc_consent");
      if (res?.success) {
        showNotification("success", "Aadhaar verification consent withdrawn and badge removed.");
        await loadVerifications();
        if (typeof refreshProfile === "function") {
          await refreshProfile();
        }
      }
    } catch (err) {
      showNotification("error", err?.response?.data?.message || err?.message || "Failed to withdraw consent");
    } finally {
      setIsWithdrawingConsent(false);
    }
  };

  // Submit Manual Identity Verification
  const handleSubmitIdentity = async (e) => {
    e.preventDefault();
    if (!idNumber.trim()) {
      showNotification("error", "Please provide your government ID number");
      return;
    }
    if (!docFrontUrl) {
      showNotification("error", "Please upload the front side of your government ID document");
      return;
    }
    if (!selfieUrl) {
      showNotification("error", "Please upload a selfie photo for visual face matching");
      return;
    }

    try {
      setIsSubmittingId(true);
      const res = await verificationService.submitIdentityVerification({
        idType,
        idNumber,
        documentFrontUrl: docFrontUrl,
        documentBackUrl: docBackUrl || undefined,
        selfiePhotoUrl: selfieUrl,
      });

      if (res?.success) {
        showNotification("success", "Identity verification dossier submitted for admin review!");
        await loadVerifications();
      }
    } catch (err) {
      showNotification("error", err?.response?.data?.message || err?.message || "Failed to submit verification");
    } finally {
      setIsSubmittingId(false);
    }
  };

  // Submit Professional Verification
  const handleSubmitProfessional = async (e) => {
    e.preventDefault();
    const creditsLinks = [imdbLink, workLink1].filter(Boolean);
    if (creditsLinks.length === 0 && !proofDocUrl) {
      showNotification("error", "Please provide at least one professional credit link or supporting document");
      return;
    }

    try {
      setIsSubmittingProf(true);
      const res = await verificationService.submitProfessionalVerification({
        creditsLinks,
        guildOrUnionName: guildName || undefined,
        guildMembershipNumber: guildNumber || undefined,
        supportingDocumentUrls: proofDocUrl ? [proofDocUrl] : [],
      });

      if (res?.success) {
        showNotification("success", "Professional verification credentials submitted for review!");
        await loadVerifications();
      }
    } catch (err) {
      showNotification("error", err?.response?.data?.message || err?.message || "Failed to submit verification");
    } finally {
      setIsSubmittingProf(false);
    }
  };

  const isAspiring = (profile?.careerStage || "").toLowerCase() === "aspiring";

  const handleCompleteAndSubmitForReview = async () => {
    try {
      if (typeof clearSession === "function") {
        clearSession();
      } else if (typeof logout === "function") {
        await logout();
      }
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("vismaya_auth_token");
          localStorage.removeItem("vismaya_user_data");
          sessionStorage.clear();
        } catch (e) {}
      }
    } catch (e) {}
    setIsSubmittedForReview(true);
  };

  // Dedicated Onboarding View: Renders a standalone registration-sized card matching /register (no dashboard layout)
  if (isOnboarding) {
    if (isSubmittedForReview) {
      return (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "clamp(28px, 4vw, 40px) clamp(20px, 3.5vw, 36px)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)",
              border: "1px solid #E8E6DF",
              boxSizing: "border-box",
              textAlign: "center",
            }}
          >
            {/* Eyebrow */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#8A6B2E",
                marginBottom: "16px",
              }}
            >
              <span style={{ width: "24px", height: "1px", backgroundColor: "#8A6B2E" }} />
              <span>REGISTRATION COMPLETE</span>
              <span style={{ width: "24px", height: "1px", backgroundColor: "#8A6B2E" }} />
            </div>

            {/* Pending Icon */}
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: "#FDF8E8",
                border: "1px solid #F6E2B3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
                color: "#8A6B2E",
              }}
            >
              <Clock size={32} />
            </div>

            <h2
              style={{
                fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                fontSize: "22px",
                fontWeight: 600,
                color: "#292C29",
                marginBottom: "8px",
                lineHeight: 1.3,
              }}
            >
              Registration Submitted Successfully
            </h2>

            <p
              style={{
                fontSize: "13.5px",
                color: "#5A584F",
                maxWidth: "440px",
                margin: "0 auto 18px",
                lineHeight: "1.55",
              }}
            >
              Your talent registration details have been received and are currently under review by the Vismaya administration team.
            </p>

            <div
              style={{
                backgroundColor: "#FAF9F7",
                border: "1px solid #E8E2D4",
                borderRadius: "10px",
                padding: "12px 18px",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "13px",
                color: "#8A6B2E",
                fontWeight: "600",
                marginBottom: "20px",
              }}
            >
              <ShieldCheck size={16} />
              <span>Status: Pending Administrator Approval</span>
            </div>

            <p
              style={{
                fontSize: "12.5px",
                color: "#77756B",
                maxWidth: "420px",
                margin: "0 auto 24px",
                lineHeight: "1.5",
              }}
            >
              Once an administrator verifies and approves your profile, your account will be activated and you will be able to sign in to access your dashboard.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="btn-primary"
                style={{
                  width: "100%",
                  height: "46px",
                  fontSize: "14px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <span>Go to Sign In</span>
                <ArrowRight size={15} />
              </button>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="btn-secondary"
                style={{
                  width: "100%",
                  height: "42px",
                  fontSize: "13px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Standalone Registration-size Card */}
        <div
          style={{
            width: "100%",
            maxWidth: "520px",
            backgroundColor: "#FFFFFF",
            borderRadius: "14px",
            padding: "clamp(24px, 4vw, 36px)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)",
            border: "1px solid #E8E6DF",
            boxSizing: "border-box",
          }}
        >
          {/* Eyebrow & Title */}
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#8A6B2E",
                marginBottom: "8px",
              }}
            >
              <span style={{ width: "24px", height: "1px", backgroundColor: "#8A6B2E" }} />
              <span>VISMAYA ONBOARDING</span>
              <span style={{ width: "24px", height: "1px", backgroundColor: "#8A6B2E" }} />
            </div>

            <h1
              style={{
                fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                fontSize: "24px",
                fontWeight: 400,
                color: "#292C29",
                marginBottom: "6px",
                lineHeight: 1.25,
              }}
            >
              Aadhaar Identity Verification
            </h1>

            <p
              style={{
                fontSize: "13.5px",
                color: "#5A584F",
                maxWidth: "460px",
                margin: "0 auto",
                lineHeight: "1.5",
              }}
            >
              Verify your identity in seconds using UIDAI OTP for priority casting visibility. Aadhaar verification is completely optional — you can verify now or skip and submit for review.
            </p>
          </div>

          {notification && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                backgroundColor: notification.type === "success" ? "#ECFDF5" : "#FEF2F2",
                border: `1px solid ${notification.type === "success" ? "#A7F3D0" : "#FECACA"}`,
                color: notification.type === "success" ? "#065F46" : "#991B1B",
                fontSize: "13.5px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "18px",
              }}
            >
              <span>{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {isIdentityVerified ? (
            <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "#ECFDF5",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#166534", marginBottom: "6px" }}>
                Identity Verified Successfully!
              </h3>
              <p style={{ fontSize: "13.5px", color: "#5A584F", marginBottom: "22px" }}>
                Your profile has earned the official <strong>Verified Talent Badge</strong>.
              </p>
              <button
                type="button"
                onClick={handleCompleteAndSubmitForReview}
                className="btn-primary"
                style={{ width: "100%", height: "46px", fontSize: "14px", fontWeight: "700" }}
              >
                Submit Registration for Review →
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Voluntary Aadhaar Consent Box */}
              <div
                style={{
                  backgroundColor: "#FAF9F6",
                  border: "1px solid #E8E2D4",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#8A6B2E", fontSize: "12.5px", fontWeight: "700" }}>
                  <Lock size={14} />
                  <span>Voluntary Aadhaar Consent (UIDAI & DPDPA Compliant)</span>
                </div>
                <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#8A6B2E", flexShrink: 0 }}
                  />
                  <span style={{ fontSize: "12px", color: "#5A584F", lineHeight: "17px" }}>
                    I voluntarily consent to verify my identity via Cashfree UIDAI OTP. I understand my 12-digit Aadhaar number and OTP are <strong>NEVER stored</strong>, only 18+ eligibility status is recorded, and verification is voluntary.{" "}
                    <Link href="/kyc" target="_blank" style={{ color: "#8A6B2E", textDecoration: "underline", fontWeight: "600" }}>
                      Read Policy
                    </Link>
                  </span>
                </label>
              </div>

              {!otpSent ? (
                /* Step 1: Aadhaar Number Entry */
                <form onSubmit={handleRequestOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                      Enter 12-Digit Aadhaar Number *
                    </label>
                    <input
                      type="text"
                      placeholder="XXXX  XXXX  XXXX"
                      value={aadhaarNumber}
                      onChange={handleAadhaarChange}
                      maxLength={14}
                      style={{
                        height: "46px",
                        borderRadius: "8px",
                        border: "1px solid #DDD8CD",
                        padding: "0 14px",
                        fontSize: "17px",
                        letterSpacing: "0.15em",
                        backgroundColor: "#FAF9F6",
                        fontFamily: "monospace",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    />
                    <span style={{ fontSize: "12px", color: "#77756B" }}>
                      OTP will be sent to the mobile number registered with your UIDAI Aadhaar.
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
                    {aadhaarInlineError && (
                      <div
                        style={{
                          padding: "10px 14px",
                          backgroundColor: "#FEF2F2",
                          border: "1px solid #FECACA",
                          borderRadius: "8px",
                          color: "#991B1B",
                          fontSize: "13px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <AlertCircle size={16} style={{ flexShrink: 0 }} />
                        <span>{aadhaarInlineError}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={isSendingOtp}
                      className="btn-primary"
                      style={{
                        height: "46px",
                        width: "100%",
                        fontSize: "14px",
                        fontWeight: "700",
                        opacity: isSendingOtp ? 0.7 : 1,
                        cursor: isSendingOtp ? "not-allowed" : "pointer",
                      }}
                    >
                      {isSendingOtp ? "Requesting OTP..." : "Request Aadhaar OTP"}
                    </button>

                    <button
                      type="button"
                      onClick={handleCompleteAndSubmitForReview}
                      className="btn-secondary"
                      style={{
                        height: "44px",
                        width: "100%",
                        fontSize: "13.5px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      Skip for Now / Submit Registration →
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: OTP Verification */
                <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div
                    style={{
                      backgroundColor: "#EFF6FF",
                      border: "1px solid #BFDBFE",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#1E40AF", fontSize: "13px" }}>
                      <KeyRound size={16} />
                      <span>OTP sent to Aadhaar-linked mobile.</span>
                    </div>
                    {otpRefId && (
                      <span style={{ fontSize: "11px", color: "#3B82F6", fontFamily: "monospace" }}>
                        Ref: {otpRefId.slice(0, 8)}...
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      backgroundColor: "#F0FDF4",
                      border: "1px solid #BBF7D0",
                      borderRadius: "8px",
                      padding: "9px 12px",
                      fontSize: "12.5px",
                      color: "#166534",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <span><strong>Test Sandbox Mode:</strong> Use test OTP <strong>123456</strong>.</span>
                    <button
                      type="button"
                      onClick={() => setOtpCode("123456")}
                      style={{
                        padding: "3px 8px",
                        backgroundColor: "#16A34A",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "5px",
                        fontSize: "11px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      Fill 123456
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A", textAlign: "center" }}>
                      Enter 6-Digit OTP *
                    </label>
                    <input
                      type="text"
                      placeholder="••••••"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      autoFocus
                      style={{
                        height: "48px",
                        borderRadius: "8px",
                        border: "1px solid #DDD8CD",
                        padding: "0 14px",
                        fontSize: "22px",
                        letterSpacing: "0.35em",
                        textAlign: "center",
                        backgroundColor: "#FAF9F6",
                        fontFamily: "monospace",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode("");
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#6E6B5E",
                          fontSize: "12px",
                          cursor: "pointer",
                          textDecoration: "underline",
                          padding: 0,
                        }}
                      >
                        ← Change Aadhaar Number
                      </button>

                      {resendCountdown > 0 ? (
                        <span style={{ fontSize: "12px", color: "#77756B" }}>
                          Resend in {resendCountdown}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={isSendingOtp}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#8A6B2E",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                            textDecoration: "underline",
                            padding: 0,
                          }}
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
                    <button
                      type="submit"
                      disabled={isVerifyingOtp || otpCode.length !== 6}
                      className="btn-primary"
                      style={{
                        height: "46px",
                        width: "100%",
                        fontSize: "14px",
                        fontWeight: "700",
                        opacity: otpCode.length !== 6 ? 0.6 : 1,
                        cursor: (otpCode.length !== 6 || isVerifyingOtp) ? "not-allowed" : "pointer",
                      }}
                    >
                      {isVerifyingOtp ? "Verifying..." : "Verify OTP & Complete KYC"}
                    </button>

                    <button
                      type="button"
                      onClick={handleCompleteAndSubmitForReview}
                      className="btn-secondary"
                      style={{
                        height: "44px",
                        width: "100%",
                        fontSize: "13.5px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      Skip for Now / Submit Registration →
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Security badge at bottom */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#77756B", fontSize: "12px", marginTop: "16px" }}>
          <Lock size={12} />
          <span>256-bit encrypted. Full Aadhaar number & OTP are never stored in database.</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="KYC Verification Desk"
        subtitle="Complete identity and professional credentials verification to earn verified badges and establish casting credibility."
      />

      {notification && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: "10px",
            backgroundColor: notification.type === "success" ? "#ECFDF5" : "#FEF2F2",
            border: `1px solid ${notification.type === "success" ? "#A7F3D0" : "#FECACA"}`,
            color: notification.type === "success" ? "#065F46" : "#991B1B",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Onboarding Welcome Banner (Shown when coming right after registration) */}
      {isOnboarding && (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "2px solid #8A6B2E",
            borderRadius: "16px",
            padding: "24px 28px",
            boxShadow: "0 4px 20px rgba(138, 107, 46, 0.12)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                backgroundColor: "#F3EFE6",
                color: "#8A6B2E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#2B2D2A",
                  margin: "0 0 6px 0",
                  fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                }}
              >
                Welcome to Vismaya Creative Studios!
              </h2>
              <p style={{ fontSize: "14px", color: "#5A584F", margin: 0, lineHeight: "22px" }}>
                Verify your Aadhaar now to earn the official <strong>Verified Talent Badge</strong> and get top priority in director casting calls. Aadhaar verification is completely optional — you can verify right now in under 60 seconds via OTP or skip and verify anytime later from your dashboard.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
              paddingTop: "8px",
              borderTop: "1px solid #E8E2D4",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab("identity");
                setIdentityMode("aadhaar");
              }}
              className="btn-primary"
              style={{
                height: "44px",
                padding: "0 22px",
                fontSize: "14px",
                fontWeight: "700",
                borderRadius: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ShieldCheck size={18} />
              <span>Verify Aadhaar (Instant OTP)</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/talent/dashboard")}
              className="btn-secondary"
              style={{
                height: "44px",
                padding: "0 22px",
                fontSize: "14px",
                fontWeight: "600",
                borderRadius: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#FAF9F6",
              }}
            >
              <span>Skip for Now (Go to Dashboard)</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Top 2 Badges Overview Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Badge 1: Identity Verified */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E4DA",
            borderRadius: "14px",
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                backgroundColor: isIdentityVerified ? "rgba(16, 185, 129, 0.12)" : "rgba(138, 107, 46, 0.12)",
                color: isIdentityVerified ? "#10b981" : "#8A6B2E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <User size={22} />
            </div>
            <div>
              <strong style={{ fontSize: "15px", color: "#2B2D2A", display: "block" }}>
                Identity Verified Badge
              </strong>
              <span style={{ fontSize: "12.5px", color: "#77756B" }}>
                {isIdentityVerified ? "Aadhaar e-KYC Verified" : "Aadhaar e-KYC or Govt ID document"}
              </span>
            </div>
          </div>
          {getStatusBadge(identityVer, true)}
        </div>

        {/* Badge 2: Professional Verified */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E4DA",
            borderRadius: "14px",
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                backgroundColor: "rgba(138, 107, 46, 0.12)",
                color: "#8A6B2E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Award size={22} />
            </div>
            <div>
              <strong style={{ fontSize: "15px", color: "#2B2D2A", display: "block" }}>
                Professional Verified Badge
              </strong>
              <span style={{ fontSize: "12.5px", color: "#77756B" }}>
                Documented screen credits &amp; guild membership
              </span>
            </div>
          </div>
          {getStatusBadge(professionalVer, false)}
        </div>
      </div>

      {/* Navigation Tabs for Independent Verification Categories */}
      <div style={{ borderBottom: "1px solid #E8E4DA", display: "flex", gap: "24px" }}>
        <button
          type="button"
          onClick={() => setActiveTab("identity")}
          style={{
            padding: "12px 0",
            fontSize: "14px",
            fontWeight: "700",
            border: "none",
            background: "none",
            color: activeTab === "identity" ? "#8A6B2E" : "#5A584F",
            borderBottom: activeTab === "identity" ? "2px solid #8A6B2E" : "2px solid transparent",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <ShieldCheck size={16} />
          <span>1. Identity Verification (Aadhaar / Govt ID)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("professional")}
          style={{
            padding: "12px 0",
            fontSize: "14px",
            fontWeight: "700",
            border: "none",
            background: "none",
            color: activeTab === "professional" ? "#8A6B2E" : "#5A584F",
            borderBottom: activeTab === "professional" ? "2px solid #8A6B2E" : "2px solid transparent",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Award size={16} />
          <span>2. Professional Credentials Verification</span>
        </button>
      </div>

      {/* TAB 1: IDENTITY VERIFICATION */}
      {activeTab === "identity" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Identity Rejection Support Guidance */}
          {(identityVer?.status === "rejected" || identityVer?.rawStatus === "rejected") && (
            <div
              style={{
                backgroundColor: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "12px",
                padding: "20px 24px",
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
              }}
            >
              <AlertCircle size={24} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong style={{ fontSize: "16px", color: "#991B1B", display: "block", marginBottom: "4px" }}>
                  Identity Verification Not Approved
                </strong>
                <p style={{ fontSize: "14px", color: "#7F1D1D", margin: "0 0 12px 0", lineHeight: "22px" }}>
                  Your identity verification submission could not be approved. As directed by Vismaya compliance rules, rejected users should contact platform support directly to resolve discrepancies.
                </p>
                <a
                  href="mailto:support@vismaya.com?subject=Identity%20Verification%20Appeal"
                  className="btn-secondary"
                  style={{ fontSize: "13px", height: "36px", padding: "0 16px" }}
                >
                  Contact Vismaya Support Desk
                </a>
              </div>
            </div>
          )}

          {/* Identity Mode Selector (Aadhaar Instant e-KYC vs Manual Document Upload) */}
          <div
            style={{
              backgroundColor: "#FAF9F6",
              border: "1px solid #E8E4DA",
              borderRadius: "12px",
              padding: "6px",
              display: "inline-flex",
              gap: "6px",
              alignSelf: "flex-start",
            }}
          >
            <button
              type="button"
              onClick={() => setIdentityMode("aadhaar")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                fontSize: "13.5px",
                fontWeight: identityMode === "aadhaar" ? "700" : "500",
                backgroundColor: identityMode === "aadhaar" ? "#8A6B2E" : "transparent",
                color: identityMode === "aadhaar" ? "#FFFFFF" : "#5A584F",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease",
              }}
            >
              <ShieldCheck size={16} />
              <span>Aadhaar Instant e-KYC (Fastest &amp; Paperless)</span>
            </button>

            <button
              type="button"
              onClick={() => setIdentityMode("manual")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                fontSize: "13.5px",
                fontWeight: identityMode === "manual" ? "700" : "500",
                backgroundColor: identityMode === "manual" ? "#8A6B2E" : "transparent",
                color: identityMode === "manual" ? "#FFFFFF" : "#5A584F",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease",
              }}
            >
              <FileText size={16} />
              <span>Manual Document Upload (Alternative)</span>
            </button>
          </div>

          {/* MODE 1: AADHAAR INSTANT E-KYC */}
          {identityMode === "aadhaar" && (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8E4DA",
                borderRadius: "16px",
                padding: "28px",
                boxShadow: "0 2px 10px rgba(43, 45, 42, 0.02)",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
              }}
            >
              {isIdentityVerified ? (
                /* Already Verified State */
                <div
                  style={{
                    backgroundColor: "#F0FDF4",
                    border: "1px solid #BBF7D0",
                    borderRadius: "12px",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        backgroundColor: "#DCFCE7",
                        color: "#16A34A",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <CheckCircle2 size={28} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#166534", margin: "0 0 6px 0" }}>
                        Aadhaar Identity Verified
                      </h3>
                      <p style={{ fontSize: "14px", color: "#15803D", margin: 0, lineHeight: "22px" }}>
                        Your identity has been authenticated via Aadhaar verification. Your Verified Badge is active on your public comp-card and all casting submissions.
                      </p>
                      {identityVer?.aadhaarData?.maskedAadhaarPreview && (
                        <div style={{ marginTop: "10px", fontSize: "13px", color: "#166534" }}>
                          <strong>Masked Reference: </strong>
                          <span style={{ fontFamily: "monospace" }}>{identityVer.aadhaarData.maskedAadhaarPreview}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: "14px",
                      borderTop: "1px solid #DCFCE7",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    <span style={{ fontSize: "12.5px", color: "#4B7C59" }}>
                      Voluntary consent recorded. You can withdraw your verification consent at any time.
                    </span>

                    <button
                      type="button"
                      disabled={isWithdrawingConsent}
                      onClick={handleWithdrawConsent}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "6px",
                        border: "1px solid #FCA5A5",
                        backgroundColor: "#FEF2F2",
                        color: "#DC2626",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        cursor: isWithdrawingConsent ? "wait" : "pointer",
                      }}
                    >
                      {isWithdrawingConsent ? "Processing..." : "Withdraw Verification Consent"}
                    </button>
                  </div>
                </div>
              ) : (
                /* Unverified State: Request OTP or Enter OTP */
                <>
                  <div>
                    <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#2B2D2A", margin: "0 0 6px 0" }}>
                      Aadhaar Paperless e-KYC Verification
                    </h2>
                    <p style={{ fontSize: "13.5px", color: "#5A584F", margin: 0 }}>
                      Verify your identity in seconds using UIDAI OTP. Aadhaar verification is completely optional — skipping will never restrict your access to registration, login, or platform tools.
                    </p>
                  </div>

                  {/* Statutory Consent Box */}
                  <div
                    style={{
                      backgroundColor: "#FAF9F6",
                      border: "1px solid #E8E2D4",
                      borderRadius: "12px",
                      padding: "18px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#8A6B2E", fontWeight: "700", fontSize: "14px" }}>
                      <Lock size={16} />
                      <span>Voluntary Aadhaar Consent (UIDAI &amp; DPDP Compliant)</span>
                    </div>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        cursor: "pointer",
                        fontSize: "13px",
                        color: "#2B2D2A",
                        lineHeight: "20px",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={consentGiven}
                        onChange={(e) => setConsentGiven(e.target.checked)}
                        style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#8A6B2E", cursor: "pointer" }}
                      />
                      <span>
                        I voluntarily provide my consent to Vismaya Creative Studios to initiate OTP-based identity verification via Cashfree Verification Suite. I understand that:
                        (1) Aadhaar verification is entirely optional and skipping will never restrict my account,
                        (2) My full 12-digit Aadhaar number and OTP are NEVER stored,
                        (3) Only adult age verification status and masked audit details will be retained,
                        (4) I can withdraw my consent and remove the verification badge at any time from this desk, and
                        (5) Alternative manual document upload is available.{" "}
                        <Link href="/kyc" target="_blank" style={{ color: "#8A6B2E", textDecoration: "underline", fontWeight: "600" }}>
                          Read Full KYC Policy
                        </Link>
                      </span>
                    </label>
                  </div>

                  {!otpSent ? (
                    /* Step 1: Aadhaar Number Entry */
                    <form onSubmit={handleRequestOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxWidth: "420px" }}>
                        <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                          Enter 12-Digit Aadhaar Number *
                        </label>
                        <input
                          type="text"
                          placeholder="XXXX  XXXX  XXXX"
                          value={aadhaarNumber}
                          onChange={handleAadhaarChange}
                          maxLength={14}
                          style={{
                            height: "44px",
                            borderRadius: "8px",
                            border: "1px solid #DDD8CD",
                            padding: "0 14px",
                            fontSize: "16px",
                            letterSpacing: "0.15em",
                            backgroundColor: "#FAF9F6",
                            fontFamily: "monospace",
                          }}
                        />
                        <span style={{ fontSize: "12px", color: "#77756B" }}>
                          OTP will be sent to the mobile number registered with your UIDAI Aadhaar.
                        </span>
                      </div>

                      {aadhaarInlineError && (
                        <div
                          style={{
                            padding: "10px 14px",
                            backgroundColor: "#FEF2F2",
                            border: "1px solid #FECACA",
                            borderRadius: "8px",
                            color: "#991B1B",
                            fontSize: "13px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            maxWidth: "420px",
                          }}
                        >
                          <AlertCircle size={16} style={{ flexShrink: 0 }} />
                          <span>{aadhaarInlineError}</span>
                        </div>
                      )}

                      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "8px" }}>
                        <button
                          type="button"
                          onClick={handleRequestOtp}
                          disabled={isSendingOtp}
                          className="btn-primary"
                          style={{
                            height: "44px",
                            padding: "0 24px",
                            fontSize: "14px",
                            fontWeight: "700",
                            opacity: isSendingOtp ? 0.7 : 1,
                            cursor: isSendingOtp ? "not-allowed" : "pointer",
                          }}
                        >
                          {isSendingOtp ? "Requesting OTP..." : "Request Aadhaar OTP"}
                        </button>

                        {isOnboarding && (
                          <button
                            type="button"
                            onClick={() => router.push("/talent/dashboard")}
                            className="btn-secondary"
                            style={{ height: "44px", padding: "0 20px", fontSize: "13.5px" }}
                          >
                            Skip for Now
                          </button>
                        )}
                      </div>
                    </form>
                  ) : (
                    /* Step 2: OTP Verification */
                    <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                      <div
                        style={{
                          backgroundColor: "#EFF6FF",
                          border: "1px solid #BFDBFE",
                          borderRadius: "10px",
                          padding: "14px 18px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "12px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#1E40AF", fontSize: "13.5px" }}>
                          <KeyRound size={18} />
                          <span>OTP has been sent to your Aadhaar-linked mobile phone.</span>
                        </div>
                        <span style={{ fontSize: "12px", color: "#3B82F6", fontFamily: "monospace" }}>
                          Ref: {otpRefId ? String(otpRefId).slice(0, 12) + "..." : "Active"}
                        </span>
                      </div>

                      <div
                        style={{
                          backgroundColor: "#F0FDF4",
                          border: "1px solid #BBF7D0",
                          borderRadius: "8px",
                          padding: "10px 14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "10px",
                          fontSize: "12.5px",
                          color: "#166534",
                        }}
                      >
                        <span>
                          🧪 <strong>Sandbox Mode:</strong> Real UIDAI phone SMS requires live Cashfree KYC API credentials. For testing right now, use test OTP: <strong>123456</strong>.
                        </span>
                        <button
                          type="button"
                          onClick={() => setOtpCode("123456")}
                          style={{
                            padding: "4px 10px",
                            backgroundColor: "#166534",
                            color: "#FFFFFF",
                            borderRadius: "6px",
                            border: "none",
                            fontWeight: "600",
                            fontSize: "11.5px",
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                        >
                          Auto-fill 123456
                        </button>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxWidth: "320px" }}>
                        <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                          Enter 6-Digit OTP *
                        </label>
                        <input
                          type="text"
                          placeholder="••••••"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          maxLength={6}
                          style={{
                            height: "46px",
                            borderRadius: "8px",
                            border: "1px solid #DDD8CD",
                            padding: "0 14px",
                            fontSize: "20px",
                            letterSpacing: "0.4em",
                            textAlign: "center",
                            backgroundColor: "#FAF9F6",
                            fontFamily: "monospace",
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                        <button
                          type="submit"
                          disabled={isVerifyingOtp || otpCode.trim().length < 6}
                          className="btn-primary"
                          style={{
                            height: "44px",
                            padding: "0 26px",
                            fontSize: "14px",
                            fontWeight: "700",
                            opacity: otpCode.trim().length < 6 ? 0.6 : 1,
                          }}
                        >
                          {isVerifyingOtp ? "Verifying OTP..." : "Verify OTP & Activate Badge"}
                        </button>

                        <button
                          type="button"
                          disabled={resendCountdown > 0 || isSendingOtp}
                          onClick={handleRequestOtp}
                          style={{
                            background: "none",
                            border: "none",
                            color: resendCountdown > 0 ? "#A3A199" : "#8A6B2E",
                            fontSize: "13px",
                            fontWeight: "600",
                            cursor: resendCountdown > 0 ? "not-allowed" : "pointer",
                            textDecoration: "underline",
                          }}
                        >
                          {resendCountdown > 0 ? `Resend OTP in ${resendCountdown}s` : "Resend OTP"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setOtpCode("");
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#5A584F",
                            fontSize: "13px",
                            cursor: "pointer",
                          }}
                        >
                          &larr; Change Aadhaar Number
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          )}

          {/* MODE 2: MANUAL DOCUMENT UPLOAD FORM (ORIGINAL FLOW PRESERVED) */}
          {identityMode === "manual" && (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8E4DA",
                borderRadius: "16px",
                padding: "28px",
                boxShadow: "0 2px 10px rgba(43, 45, 42, 0.02)",
              }}
            >
              <div style={{ marginBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#2B2D2A", margin: "0 0 6px 0" }}>
                  Government Identity Evidence (Manual Upload)
                </h2>
                <p style={{ fontSize: "13.5px", color: "#5A584F", margin: 0 }}>
                  Upload a government-issued photo identity document and a live verification selfie. These documents are strictly confidential and accessible solely to authorized Vismaya Compliance Officers.
                </p>
              </div>

              <form onSubmit={handleSubmitIdentity} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                      Identity Document Type *
                    </label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      style={{
                        height: "42px",
                        borderRadius: "8px",
                        border: "1px solid #DDD8CD",
                        padding: "0 12px",
                        fontSize: "14px",
                        backgroundColor: "#FAF9F6",
                      }}
                    >
                      <option value="aadhaar">Aadhaar Card (UIDAI)</option>
                      <option value="passport">Indian Passport</option>
                      <option value="driving_license">Driving License</option>
                      <option value="voter_id">Voter ID (Election Commission)</option>
                      <option value="pan">PAN Card</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                      ID Number *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter document reference number"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      style={{
                        height: "42px",
                        borderRadius: "8px",
                        border: "1px solid #DDD8CD",
                        padding: "0 12px",
                        fontSize: "14px",
                        backgroundColor: "#FAF9F6",
                      }}
                    />
                  </div>
                </div>

                {/* Upload 1: Document Front */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                    Document Front Side (Clear Scan or Photo) *
                  </label>
                  <div
                    style={{
                      border: "2px dashed #DDD8CD",
                      borderRadius: "10px",
                      padding: "20px",
                      textAlign: "center",
                      backgroundColor: "#FAF9F6",
                    }}
                  >
                    {docFrontUrl ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <FileText size={20} color="#8A6B2E" />
                          <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#2B2D2A" }}>
                            Front side document uploaded
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <a href={docFrontUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#8A6B2E", textDecoration: "underline" }}>
                            Preview
                          </a>
                          <button type="button" onClick={() => setDocFrontUrl("")} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "13px" }}>
                            Replace
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <UploadCloud size={28} style={{ color: "#8A6B2E", margin: "0 auto 8px auto" }} />
                        <p style={{ fontSize: "13px", color: "#5A584F", margin: "0 0 8px 0" }}>
                          PDF, JPG, or PNG under 10 MB
                        </p>
                        <label className="btn-secondary" style={{ display: "inline-block", cursor: isUploadingFront ? "wait" : "pointer", padding: "6px 14px", fontSize: "13px" }}>
                          {isUploadingFront ? "Uploading..." : "Select Front Document"}
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            style={{ display: "none" }}
                            disabled={isUploadingFront}
                            onChange={(e) => handleFileUpload(e.target.files[0], setDocFrontUrl, setIsUploadingFront)}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload 2: Document Back (Optional) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                    Document Back Side (Optional / For 2-Sided IDs)
                  </label>
                  <div
                    style={{
                      border: "2px dashed #DDD8CD",
                      borderRadius: "10px",
                      padding: "20px",
                      textAlign: "center",
                      backgroundColor: "#FAF9F6",
                    }}
                  >
                    {docBackUrl ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <FileText size={20} color="#8A6B2E" />
                          <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#2B2D2A" }}>
                            Back side document uploaded
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <a href={docBackUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#8A6B2E", textDecoration: "underline" }}>
                            Preview
                          </a>
                          <button type="button" onClick={() => setDocBackUrl("")} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "13px" }}>
                            Replace
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <UploadCloud size={24} style={{ color: "#8A6B2E", margin: "0 auto 6px auto" }} />
                        <label className="btn-secondary" style={{ display: "inline-block", cursor: isUploadingBack ? "wait" : "pointer", padding: "6px 14px", fontSize: "13px" }}>
                          {isUploadingBack ? "Uploading..." : "Select Back Document"}
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            style={{ display: "none" }}
                            disabled={isUploadingBack}
                            onChange={(e) => handleFileUpload(e.target.files[0], setDocBackUrl, setIsUploadingBack)}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload 3: Live Verification Selfie */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                    Verification Selfie / Face Photograph *
                  </label>
                  <div
                    style={{
                      border: "2px dashed #DDD8CD",
                      borderRadius: "10px",
                      padding: "20px",
                      textAlign: "center",
                      backgroundColor: "#FAF9F6",
                    }}
                  >
                    {selfieUrl ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <img src={selfieUrl} alt="Selfie preview" style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }} />
                          <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#2B2D2A" }}>
                            Verification photograph uploaded
                          </span>
                        </div>
                        <button type="button" onClick={() => setSelfieUrl("")} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "13px" }}>
                          Replace Photo
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Camera size={28} style={{ color: "#8A6B2E", margin: "0 auto 8px auto" }} />
                        <p style={{ fontSize: "13px", color: "#5A584F", margin: "0 0 8px 0" }}>
                          Clear frontal selfie without sunglasses or hats for facial matching
                        </p>
                        <label className="btn-secondary" style={{ display: "inline-block", cursor: isUploadingSelfie ? "wait" : "pointer", padding: "6px 14px", fontSize: "13px" }}>
                          {isUploadingSelfie ? "Uploading..." : "Upload Selfie Photo"}
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            disabled={isUploadingSelfie}
                            onChange={(e) => handleFileUpload(e.target.files[0], setSelfieUrl, setIsUploadingSelfie)}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                  <button
                    type="submit"
                    disabled={isSubmittingId || isUploadingFront || isUploadingSelfie}
                    className="btn-primary"
                    style={{ height: "42px", padding: "0 24px", fontSize: "14px", fontWeight: "700" }}
                  >
                    {isSubmittingId ? "Submitting Dossier..." : "Submit Identity For Verification"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROFESSIONAL VERIFICATION */}
      {activeTab === "professional" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Aspiring Talent Warning Box */}
          {isAspiring && (
            <div
              style={{
                backgroundColor: "#FFF9E6",
                border: "1px solid #F0D078",
                borderRadius: "12px",
                padding: "18px 22px",
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
              }}
            >
              <Info size={20} color="#8A6B2E" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div style={{ fontSize: "13.5px", color: "#5A584F", lineHeight: "22px" }}>
                <strong style={{ color: "#2B2D2A" }}>Aspiring Artist Rule: </strong>
                According to Vismaya Master Specification §47, an aspiring talent without professional screen credits cannot receive the &apos;Professional Verified&apos; badge. Once you have at least one released project, television credit, or recognized theatre production, submit your evidence here for verification.
              </div>
            </div>
          )}

          {/* Form Card */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E4DA",
              borderRadius: "16px",
              padding: "28px",
              boxShadow: "0 2px 10px rgba(43, 45, 42, 0.02)",
            }}
          >
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#2B2D2A", margin: "0 0 6px 0" }}>
                Professional Credits &amp; Guild Affiliation
              </h2>
              <p style={{ fontSize: "13.5px", color: "#5A584F", margin: 0 }}>
                Submit verified links to released productions, IMDb credits, or union/guild documentation to earn the Professional Verified badge.
              </p>
            </div>

            <form onSubmit={handleSubmitProfessional} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                  IMDb Profile Link or Official Filmography Link
                </label>
                <input
                  type="url"
                  placeholder="https://www.imdb.com/name/nm..."
                  value={imdbLink}
                  onChange={(e) => setImdbLink(e.target.value)}
                  style={{
                    height: "42px",
                    borderRadius: "8px",
                    border: "1px solid #DDD8CD",
                    padding: "0 12px",
                    fontSize: "14px",
                    backgroundColor: "#FAF9F6",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                  Live Project Reference or Video Link
                </label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?... or OTT streaming credit link"
                  value={workLink1}
                  onChange={(e) => setWorkLink1(e.target.value)}
                  style={{
                    height: "42px",
                    borderRadius: "8px",
                    border: "1px solid #DDD8CD",
                    padding: "0 12px",
                    fontSize: "14px",
                    backgroundColor: "#FAF9F6",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                    Artist Guild / Trade Union (e.g. CINTAA)
                  </label>
                  <input
                    type="text"
                    placeholder="E.g. CINTAA, SWA, FWICE"
                    value={guildName}
                    onChange={(e) => setGuildName(e.target.value)}
                    style={{
                      height: "42px",
                      borderRadius: "8px",
                      border: "1px solid #DDD8CD",
                      padding: "0 12px",
                      fontSize: "14px",
                      backgroundColor: "#FAF9F6",
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                    Guild Membership Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter membership badge ID"
                    value={guildNumber}
                    onChange={(e) => setGuildNumber(e.target.value)}
                    style={{
                      height: "42px",
                      borderRadius: "8px",
                      border: "1px solid #DDD8CD",
                      padding: "0 12px",
                      fontSize: "14px",
                      backgroundColor: "#FAF9F6",
                    }}
                  />
                </div>
              </div>

              {/* Upload Supporting Document */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                  Supporting Document (Contract, Call-Sheet, or Guild Certificate)
                </label>
                <div
                  style={{
                    border: "2px dashed #DDD8CD",
                    borderRadius: "10px",
                    padding: "20px",
                    textAlign: "center",
                    backgroundColor: "#FAF9F6",
                  }}
                >
                  {proofDocUrl ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <FileText size={20} color="#8A6B2E" />
                        <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#2B2D2A" }}>
                          Proof document attached
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <a href={proofDocUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#8A6B2E", textDecoration: "underline" }}>
                          Preview
                        </a>
                        <button type="button" onClick={() => setProofDocUrl("")} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "13px" }}>
                          Replace
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <UploadCloud size={26} style={{ color: "#8A6B2E", margin: "0 auto 6px auto" }} />
                      <p style={{ fontSize: "13px", color: "#5A584F", margin: "0 0 8px 0" }}>
                        PDF, JPG, or PNG under 15 MB
                      </p>
                      <label className="btn-secondary" style={{ display: "inline-block", cursor: isUploadingProof ? "wait" : "pointer", padding: "6px 14px", fontSize: "13px" }}>
                        {isUploadingProof ? "Uploading..." : "Upload Evidence"}
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          style={{ display: "none" }}
                          disabled={isUploadingProof}
                          onChange={(e) => handleFileUpload(e.target.files[0], setProofDocUrl, setIsUploadingProof)}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button
                  type="submit"
                  disabled={isSubmittingProf || isUploadingProof}
                  className="btn-primary"
                  style={{ height: "42px", padding: "0 24px", fontSize: "14px", fontWeight: "700" }}
                >
                  {isSubmittingProf ? "Submitting..." : "Submit Professional Evidence"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TalentVerificationPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "#5A584F" }}>Loading KYC Verification Desk...</div>}>
      <TalentVerificationContent />
    </Suspense>
  );
}
