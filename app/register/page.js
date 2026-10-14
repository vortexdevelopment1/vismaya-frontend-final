"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import PasswordInput from "@/components/PasswordInput";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import PaymentCard from "@/components/payment/PaymentCard";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  Lock,
  Building2,
  AlertCircle,
  Phone,
  MapPin,
  Camera,
  CheckCircle2,
  Sparkles,
  FileCheck,
  ShieldCheck,
  Briefcase,
} from "lucide-react";
import { PRICING_CONFIG } from "@/lib/config/pricing";

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams?.get("role");
  const { register, getDashboardPath } = useAuth();

  // 1. Role State
  const [selectedRole, setSelectedRole] = useState(
    initialRoleParam === "organization" ? "organization" : "talent"
  );

  // 2. Stepper State
  // Talent: 1: Account -> 2: OTP -> 3: Basic Identity+Photo -> 4: Payment (999) -> 5: Professional Identity -> Done
  // Org: 1: Account+OTP -> 2: Basic Org Identity -> 3: Payment (4999) -> 4: Org Profile -> 5: Verification Docs -> Done
  const [currentStep, setCurrentStep] = useState(1);
  const [isPaid, setIsPaid] = useState(false);
  const [orderReceipt, setOrderReceipt] = useState(null);

  // 3. Form States
  // Step 1: Account
  const [name, setName] = useState("Aanya Sharma");
  const [email, setEmail] = useState("aanya.sharma@vismaya.io");
  const [password, setPassword] = useState("secretpassword123");
  const [confirmPassword, setConfirmPassword] = useState("secretpassword123");

  // Step 2: OTP (or inside step 1 for Org)
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  // Step 3 (Talent): Basic Identity + Photo
  const [phone, setPhone] = useState("+91 98765 43210");
  const [city, setCity] = useState("Mumbai");
  const [age, setAge] = useState("24");
  const [photoUrl, setPhotoUrl] = useState(
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
  );

  // Step 2 & 4 (Org): Basic Org Identity & Org Profile
  const [companyType, setCompanyType] = useState("Production House");
  const [orgPhone, setOrgPhone] = useState("+91 22 6677 8899");
  const [website, setWebsite] = useState("https://zeefilms.com");
  const [aboutStudio, setAboutStudio] = useState(
    "Premier Bollywood and regional feature film and commercial production house."
  );
  const [genres, setGenres] = useState("Feature Films, OTT Series, Ad Commercials");
  const [cinNumber, setCinNumber] = useState("U92100MH2018PTC312456");
  const [gstNumber, setGstNumber] = useState("27AABCZ1234F1Z5");

  // Step 5 (Talent): Professional Identity
  const [primaryCraft, setPrimaryCraft] = useState("Actor / Screen Artist");
  const [skills, setSkills] = useState("Method Acting, Kathak, Voice Modulation");
  const [bio, setBio] = useState(
    "Trained method actor with 3+ years of theatre and commercial experience in Mumbai."
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Restore draft from localStorage if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("vismaya_registration_draft");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.role) setSelectedRole(parsed.role);
          if (parsed.name) setName(parsed.name);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.isPaid) setIsPaid(true);
          if (parsed.orderReceipt) setOrderReceipt(parsed.orderReceipt);
          if (parsed.step) {
            // If already paid, resume at post-payment step
            if (parsed.isPaid) {
              const minStep = parsed.role === "organization" ? 4 : 5;
              setCurrentStep(Math.max(parsed.step, minStep));
            } else {
              setCurrentStep(parsed.step);
            }
          }
        }
      } catch (e) {}
    }
  }, []);

  // Sync draft to localStorage
  const saveDraft = (updated = {}) => {
    if (typeof window !== "undefined") {
      try {
        const draft = {
          role: selectedRole,
          step: updated.step || currentStep,
          name,
          email,
          isPaid: updated.isPaid !== undefined ? updated.isPaid : isPaid,
          orderReceipt: updated.orderReceipt || orderReceipt,
        };
        localStorage.setItem("vismaya_registration_draft", JSON.stringify(draft));
      } catch (e) {}
    }
  };

  // OTP Countdown timer
  useEffect(() => {
    let interval = null;
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, resendTimer]);

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setCurrentStep(1);
    setIsPaid(false);
    setFormError("");
    if (role === "organization") {
      setName("Zee Films Studio");
      setEmail("casting@zeefilms.com");
    } else {
      setName("Aanya Sharma");
      setEmail("aanya.sharma@vismaya.io");
    }
  };

  // Step 1: Submit Account
  const handleAccountSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setFormError("");
    setOtpSent(true);
    setResendTimer(60);

    // If Talent: advance to Step 2 (OTP)
    // If Org: show OTP verification inline in step 1 or advance to OTP
    setCurrentStep(2);
    saveDraft({ step: 2 });
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setFormError("Please enter the verification code sent to your email.");
      return;
    }

    setFormError("");
    const nextStep = 3;
    setCurrentStep(nextStep);
    saveDraft({ step: nextStep });
  };

  // Step 3 (Talent) / Step 2 (Org): Basic Identity Submit
  const handleBasicIdentitySubmit = (e) => {
    e.preventDefault();
    if (selectedRole === "talent") {
      // Photo is strictly mandatory before payment
      if (!photoUrl) {
        setFormError("A verified profile photo or headshot is mandatory before proceeding to payment.");
        return;
      }
      if (!phone || !city) {
        setFormError("Please enter your mobile phone and current city.");
        return;
      }
      setFormError("");
      setCurrentStep(4); // Payment step for Talent
      saveDraft({ step: 4 });
    } else {
      // Organization basic identity
      if (!companyType || !orgPhone || !city) {
        setFormError("Please provide all studio identity details.");
        return;
      }
      setFormError("");
      setCurrentStep(3); // Payment step for Org
      saveDraft({ step: 3 });
    }
  };

  // Payment Success Handler
  const handlePaymentSuccess = (receiptData) => {
    setIsPaid(true);
    setOrderReceipt(receiptData);
    setFormError("");

    if (selectedRole === "talent") {
      const nextStep = 5; // Professional Identity
      setCurrentStep(nextStep);
      saveDraft({ step: nextStep, isPaid: true, orderReceipt: receiptData });
    } else {
      const nextStep = 4; // Org Profile
      setCurrentStep(nextStep);
      saveDraft({ step: nextStep, isPaid: true, orderReceipt: receiptData });
    }
  };

  // Step 4 (Org Profile) -> Step 5 (Org Verification Docs)
  const handleOrgProfileSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    setCurrentStep(5);
    saveDraft({ step: 5 });
  };

  // Final Step: Complete Registration
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      const payload = {
        role: selectedRole === "organization" ? "organization" : "talent",
        email,
        password,
        name: name.trim(),
        studioName: selectedRole === "organization" ? name.trim() : undefined,
        city,
        phone: selectedRole === "organization" ? orgPhone : phone,
        profilePhoto: photoUrl,
        isPaid: true,
      };

      const res = await register(payload);
      if (res.success && res.user) {
        // Clear registration draft upon successful onboarding
        if (typeof window !== "undefined") {
          localStorage.removeItem("vismaya_registration_draft");
        }
        router.push(getDashboardPath());
      } else {
        setFormError(res.error || "Registration error occurred. Please try again.");
      }
    } catch (err) {
      setFormError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Back Button Navigation Rules:
  // Pre-payment: allowed.
  // Post-payment: pre-payment steps are blocked!
  const canGoBack = () => {
    if (isPaid) {
      if (selectedRole === "talent") {
        return currentStep > 5;
      } else {
        return currentStep > 4;
      }
    }
    return currentStep > 1;
  };

  const handleBack = () => {
    if (!canGoBack()) return;
    const prev = currentStep - 1;
    setCurrentStep(prev);
    setFormError("");
    saveDraft({ step: prev });
  };

  // Stepper labels
  const talentStepLabels = [
    "Account",
    "Verification",
    "Identity & Photo",
    "Registration Fee",
    "Craft & Skills",
  ];

  const orgStepLabels = [
    "Account",
    "Verification",
    "Registration & Credits",
    "Studio Profile",
    "Documents",
  ];

  const stepLabels = selectedRole === "talent" ? talentStepLabels : orgStepLabels;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", width: "100%", backgroundColor: "var(--bg-primary)" }}>
      <PublicNav />

      {/* Main Full-Height Section */}
      <section
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: "clamp(32px, 5vh, 60px)",
          paddingBottom: "clamp(48px, 6vw, 80px)",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(60% 60% at 50% 40%, rgba(201, 165, 92, 0.08), transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div className="public-container" style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          {/* Stepper Progress Indicator */}
          <div
            className="register-stepper"
            style={{
              width: "100%",
              maxWidth: "520px",
              marginBottom: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "relative",
            }}
          >
            {stepLabels.map((lbl, idx) => {
              const stepNum = idx + 1;
              const isPassed = currentStep > stepNum;
              const isCurrent = currentStep === stepNum;
              return (
                <div
                  key={lbl}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    zIndex: 2,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: isPassed ? "#8A6B2E" : isCurrent ? "#F3EFE6" : "#FAF9F7",
                      border: isPassed ? "2px solid #8A6B2E" : isCurrent ? "2px solid #8A6B2E" : "1px solid #E8E2D4",
                      color: isPassed ? "#FFFFFF" : isCurrent ? "#8A6B2E" : "#777970",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    {isPassed ? "✓" : stepNum}
                  </div>
                  <span
                    style={{
                      fontSize: "10.5px",
                      fontWeight: isCurrent ? "600" : "500",
                      color: isCurrent ? "#8A6B2E" : "#777970",
                      textAlign: "center",
                      lineHeight: 1.2,
                      display: "block",
                    }}
                  >
                    {lbl}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Stepper Main Card */}
          <div
            className="glass register-glass-card"
            style={{
              width: "100%",
              maxWidth: "520px",
              backgroundColor: "var(--bg-surface)",
              borderRadius: "var(--radius-card, 14px)",
              padding: "clamp(24px, 4vw, 36px)",
              boxShadow: "var(--shadow-md)",
              border: "1px solid var(--border-color)",
              boxSizing: "border-box",
              color: "var(--text-primary)",
            }}
          >
            {/* Header / Subtitle */}
            <div style={{ textAlign: "center", marginBottom: "22px" }}>
              <div className="eyebrow" style={{ marginBottom: "10px", justifyContent: "center" }}>
                <span>Vismaya Onboarding</span>
              </div>

              <h1
                style={{
                  fontFamily: "var(--font-heading), Georgia, serif",
                  fontSize: "24px",
                  fontWeight: 400,
                  color: "var(--text-primary, #292C29)",
                  marginBottom: "4px",
                  lineHeight: 1.25,
                }}
              >
                {currentStep === 1 && "Create Your Account"}
                {currentStep === 2 && "Verify Email Address"}
                {currentStep === 3 && (selectedRole === "talent" ? "Identity & Headshot" : "One-Time Registration")}
                {currentStep === 4 && (selectedRole === "talent" ? "One-Time Registration" : "Studio Profile")}
                {currentStep === 5 && (selectedRole === "talent" ? "Craft & Specializations" : "Accreditation Documents")}
              </h1>

              <p style={{ fontSize: "13.5px", color: "var(--text-secondary, #777970)", margin: 0 }}>
                {currentStep === 1 && "Join India's verified entertainment network."}
                {currentStep === 2 && `Enter the 6-digit verification code sent to ${email}`}
                {currentStep === 3 && (selectedRole === "talent" ? "Upload headshot (required before registration payment)." : "Secure one-time registration with 100 included credits.")}
                {currentStep === 4 && (selectedRole === "talent" ? "Complete one-time lifetime fee of ₹999." : "Tell artists and casting directors about your production house.")}
                {currentStep === 5 && (selectedRole === "talent" ? "Finalize your professional comp-card to start applying." : "Corporate documentation for studio verification.")}
              </p>
            </div>

            {/* Error Notification */}
            {formError && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 14px",
                  backgroundColor: "var(--danger-bg)",
                  border: "1px solid var(--danger-border)",
                  borderRadius: "var(--radius-card, 6px)",
                  color: "var(--danger)",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{formError}</span>
              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 1: ACCOUNT (ROLE + CREDENTIALS + GOOGLE AUTH)         */}
            {/* ========================================================= */}
            {currentStep === 1 && (
              <form onSubmit={handleAccountSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Role Switcher */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    I want to join as:
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => handleRoleChange("talent")}
                      style={{
                        height: "44px",
                        borderRadius: "var(--radius-btn, 4px)",
                        border: selectedRole === "talent" ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                        background: selectedRole === "talent" ? "var(--gold)" : "var(--bg-alt)",
                        color: selectedRole === "talent" ? "var(--text-dark-primary, #FAF9F6)" : "var(--text-primary, #292C29)",
                        fontSize: "12px",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        cursor: "pointer",
                        transition: "all var(--transition)",
                      }}
                    >
                      Talent / Artist
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleChange("organization")}
                      style={{
                        height: "44px",
                        borderRadius: "var(--radius-btn, 4px)",
                        border: selectedRole === "organization" ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                        background: selectedRole === "organization" ? "var(--gold)" : "var(--bg-alt)",
                        color: selectedRole === "organization" ? "var(--text-dark-primary, #FAF9F6)" : "var(--text-primary, #292C29)",
                        fontSize: "12px",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        cursor: "pointer",
                        transition: "all var(--transition)",
                      }}
                    >
                      Organization
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {selectedRole === "organization" ? "Studio / Organization Name" : "Full Name"}
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    {selectedRole === "organization" ? (
                      <Building2 size={16} style={{ position: "absolute", left: "14px", color: "var(--text-secondary, #777970)", pointerEvents: "none" }} />
                    ) : (
                      <User size={16} style={{ position: "absolute", left: "14px", color: "var(--text-secondary, #777970)", pointerEvents: "none" }} />
                    )}
                    <input
                      type="text"
                      placeholder={selectedRole === "organization" ? "e.g. Zee Films Studio" : "e.g. Aanya Sharma"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      style={{ paddingLeft: "42px", width: "100%", height: "42px" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Work Email Address
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Mail size={16} style={{ position: "absolute", left: "14px", color: "var(--text-secondary, #777970)", pointerEvents: "none" }} />
                    <input
                      type="email"
                      placeholder={selectedRole === "organization" ? "casting@studio.com" : "name@example.com"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{ paddingLeft: "42px", width: "100%", height: "42px" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Create Password
                  </label>
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                    autoComplete="new-password"
                    leftIcon={<Lock size={16} />}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Confirm Password
                  </label>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    autoComplete="new-password"
                    leftIcon={<Lock size={16} />}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", marginTop: "6px", height: "44px" }}
                >
                  <span>Continue to Verification</span>
                  <ArrowRight size={15} />
                </button>

                <GoogleAuthButton
                  role={selectedRole}
                  isRegister={true}
                  onSuccess={() => {
                    setCurrentStep(2);
                  }}
                  onError={(err) => setFormError(err)}
                />
              </form>
            )}

            {/* ========================================================= */}
            {/* STEP 2: OTP VERIFICATION                                  */}
            {/* ========================================================= */}
            {currentStep === 2 && (
              <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div style={{ textAlign: "center", padding: "12px 0" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      backgroundColor: "#F3EFE6",
                      color: "#8A6B2E",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px",
                    }}
                  >
                    <Mail size={22} />
                  </div>
                  <div style={{ fontSize: "13px", color: "#5A584F" }}>
                    We sent a 6-digit confirmation OTP to:
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: "#2B2D2A", marginTop: "2px" }}>
                    {email}
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.trim())}
                    style={{
                      width: "100%",
                      height: "44px",
                      fontSize: "18px",
                      letterSpacing: "0.3em",
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  />
                  <div style={{ fontSize: "12px", color: "#5A584F", marginTop: "6px", textAlign: "center" }}>
                    In mock mode: type any 6 digits (e.g. 123456)
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setResendTimer(60);
                      setOtpSent(true);
                    }}
                    disabled={resendTimer > 0}
                    style={{
                      background: "none",
                      border: "none",
                      color: resendTimer > 0 ? "#777970" : "#8A6B2E",
                      fontSize: "12.5px",
                      cursor: resendTimer > 0 ? "default" : "pointer",
                      textDecoration: resendTimer > 0 ? "none" : "underline",
                      fontWeight: "600",
                    }}
                  >
                    {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend Verification Code"}
                  </button>

                  <button
                    type="button"
                    onClick={handleBack}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#5A584F",
                      fontSize: "12.5px",
                      cursor: "pointer",
                    }}
                  >
                    Change Email
                  </button>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", height: "44px" }}
                >
                  <span>Verify & Proceed</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            )}

            {/* ========================================================= */}
            {/* STEP 3 (TALENT): BASIC IDENTITY + MANDATORY PHOTO          */}
            {/* ========================================================= */}
            {currentStep === 3 && selectedRole === "talent" && (
              <form onSubmit={handleBasicIdentitySubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Photo Upload: Strictly Mandatory Before Payment */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Profile Photo / Headshot <span style={{ color: "#C53030" }}>* (Mandatory before payment)</span>
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div
                      style={{
                        width: "68px",
                        height: "68px",
                        borderRadius: "50%",
                        backgroundImage: `url(${photoUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        border: "2px solid #8A6B2E",
                        backgroundColor: "#F3EFE6",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        placeholder="Image URL or default headshot"
                        style={{ width: "100%", height: "38px", fontSize: "12.5px", marginBottom: "6px" }}
                      />
                      <div style={{ fontSize: "11px", color: "#5A584F" }}>
                        JPG or PNG, minimum 600x600px. Used on your official comp-card.
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Age
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                      style={{ width: "100%", height: "42px" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Current City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      style={{ width: "100%", height: "42px" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Mobile Phone
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Phone size={16} style={{ position: "absolute", left: "14px", color: "var(--text-secondary, #777970)", pointerEvents: "none" }} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      style={{ paddingLeft: "42px", width: "100%", height: "42px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={handleBack}
                    style={{
                      height: "44px",
                      padding: "0 18px",
                      backgroundColor: "transparent",
                      border: "1px solid #E8E2D4",
                      borderRadius: "6px",
                      color: "#5A584F",
                      fontSize: "13.5px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: "center", height: "44px" }}
                  >
                    <span>Continue to Payment (₹{PRICING_CONFIG.TALENT_FEE})</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </form>
            )}

            {/* ========================================================= */}
            {/* STEP 3 (ORG): PAYMENT (RS 4,999) + 100 CREDITS             */}
            {/* ========================================================= */}
            {currentStep === 3 && selectedRole === "organization" && (
              <div>
                <PaymentCard
                  type="organization_registration"
                  userName={name}
                  userEmail={email}
                  onSuccess={handlePaymentSuccess}
                  onCancel={canGoBack() ? handleBack : null}
                />
              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 4 (TALENT): PAYMENT (RS 999)                         */}
            {/* ========================================================= */}
            {currentStep === 4 && selectedRole === "talent" && (
              <div>
                <PaymentCard
                  type="talent_registration"
                  userName={name}
                  userEmail={email}
                  onSuccess={handlePaymentSuccess}
                  onCancel={canGoBack() ? handleBack : null}
                />
              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 4 (ORG): ORGANIZATION PROFILE                        */}
            {/* ========================================================= */}
            {currentStep === 4 && selectedRole === "organization" && (
              <form onSubmit={handleOrgProfileSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Company / Studio Type
                  </label>
                  <select
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value)}
                    style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "6px", border: "1px solid #E8E2D4" }}
                  >
                    <option value="Production House">Film & Series Production House</option>
                    <option value="Casting Agency">Accredited Casting Agency</option>
                    <option value="Advertising Agency">Advertising & Commercial Studio</option>
                    <option value="OTT Platform">OTT Platform / Broadcaster</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Studio Overview & Track Record
                  </label>
                  <textarea
                    rows={3}
                    value={aboutStudio}
                    onChange={(e) => setAboutStudio(e.target.value)}
                    placeholder="Brief description of your casting projects and production history..."
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #E8E2D4", fontSize: "13.5px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Primary Production Genres
                  </label>
                  <input
                    type="text"
                    value={genres}
                    onChange={(e) => setGenres(e.target.value)}
                    placeholder="e.g. Feature Films, OTT Web Series, TVCs"
                    style={{ width: "100%", height: "42px" }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", height: "44px", marginTop: "8px" }}
                >
                  <span>Continue to Verification Docs</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            )}

            {/* ========================================================= */}
            {/* STEP 5 (TALENT): PROFESSIONAL IDENTITY & CRAFT            */}
            {/* ========================================================= */}
            {currentStep === 5 && selectedRole === "talent" && (
              <form onSubmit={handleFinalSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Primary Craft & Profession
                  </label>
                  <select
                    value={primaryCraft}
                    onChange={(e) => setPrimaryCraft(e.target.value)}
                    style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "6px", border: "1px solid #E8E2D4" }}
                  >
                    <option value="Actor / Screen Artist">Actor / Screen Artist</option>
                    <option value="Model / Commercial Talent">Model / Commercial Talent</option>
                    <option value="Voice Over Artist">Voice Over Artist</option>
                    <option value="Musical & Classical Dancer">Musical & Classical Dancer</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Core Skills & Languages
                  </label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="e.g. Method Acting, Hindi, English, Kathak"
                    style={{ width: "100%", height: "42px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Professional Bio
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Short summary of your acting background..."
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #E8E2D4", fontSize: "13.5px" }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", height: "44px", marginTop: "8px" }}
                >
                  <span>{isSubmitting ? "Finalizing Profile..." : "Complete Registration"}</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            )}

            {/* ========================================================= */}
            {/* STEP 5 (ORG): VERIFICATION DOCUMENTS                     */}
            {/* ========================================================= */}
            {currentStep === 5 && selectedRole === "organization" && (
              <form onSubmit={handleFinalSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Corporate Identity (CIN) / Registration No.
                  </label>
                  <input
                    type="text"
                    value={cinNumber}
                    onChange={(e) => setCinNumber(e.target.value)}
                    placeholder="e.g. U92100MH2018PTC312456"
                    required
                    style={{ width: "100%", height: "42px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    GST Identification Number (GSTIN)
                  </label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="e.g. 27AABCZ1234F1Z5"
                    required
                    style={{ width: "100%", height: "42px" }}
                  />
                </div>

                <div
                  style={{
                    backgroundColor: "#FAF9F7",
                    border: "1px solid #E8E2D4",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "12.5px",
                    color: "#5A584F",
                  }}
                >
                  <FileCheck size={18} style={{ color: "#8A6B2E", flexShrink: 0 }} />
                  <span>
                    Your credentials and 100 included credits are activated immediately in mock mode.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", height: "44px", marginTop: "8px" }}
                >
                  <span>{isSubmitting ? "Activating Studio Account..." : "Enter Organization Dashboard"}</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            )}

            {/* Bottom link: Sign In */}
            <div style={{ textAlign: "center", marginTop: "22px", fontSize: "13px", color: "var(--text-secondary, #777970)" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--gold)", fontWeight: "600", textDecoration: "none" }}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
      <style jsx>{`
        @media (max-width: 640px) {
          :global(.register-glass-card) {
            padding: 20px 14px !important;
            border-radius: 12px !important;
          }
          :global(.register-stepper) {
            margin-bottom: 14px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#FAF9F7" }} />}>
      <RegisterPageContent />
    </Suspense>
  );
}
