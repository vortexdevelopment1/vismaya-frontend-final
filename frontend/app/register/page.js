"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
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
  Plus,
  Pencil,
  Loader2,
  Info,
} from "lucide-react";
import { PRICING_CONFIG } from "@/lib/config/pricing";
import { getAuthToken } from "@/lib/api/client";
import { isRealMode } from "@/lib/api/config";
import { uploadMedia } from "@/lib/api/uploadMedia";
import { authService } from "@/lib/api/services/authService";
import { talentService } from "@/lib/api/services/talentService";
import { recruiterService } from "@/lib/api/services/recruiterService";
import {
  isValidImageType,
  loadImageSource,
  checkImageDimensions,
  VALIDATION_MESSAGES,
} from "@/lib/utils/imageProcess";
import PhotoCropModal from "@/components/talent/PhotoCropModal";

function normalizeIndianMobile(raw) {
  if (!raw) return "";
  const clean = String(raw).replace(/[^0-9+]/g, "").trim();
  const digits = clean.replace(/[^0-9]/g, "");
  if (/^[6-9]\d{9}$/.test(digits)) {
    return `+91${digits}`;
  }
  if (/^\+91[6-9]\d{9}$/.test(clean)) {
    return clean;
  }
  return clean;
}

function validateIndianMobile(raw) {
  if (!raw || typeof raw !== "string" || !raw.trim()) {
    return "Mobile number is required.";
  }
  const clean = String(raw).replace(/[^0-9+]/g, "").trim();
  if (!/^(\+91)?[6-9]\d{9}$/.test(clean)) {
    return "Mobile number must be a valid 10-digit Indian number (e.g. +91XXXXXXXXXX or 9876543210)";
  }
  return null;
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams?.get("role");
  const { register, getDashboardPath } = useAuth();
  const [mounted, setMounted] = useState(false);

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
  const [mobileError, setMobileError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isCheckingAccount, setIsCheckingAccount] = useState(false);

  // Step 2: OTP (or inside step 1 for Org)
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  // Step 3 (Talent): Basic Identity + Photo
  const [phone, setPhone] = useState("+91 98765 43210");
  const [city, setCity] = useState("Mumbai");
  const [age, setAge] = useState("24");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photoError, setPhotoError] = useState("");
  const [photoHint, setPhotoHint] = useState("");
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropData, setCropData] = useState(null); // { file, imageSource }
  const fileInputRef = useRef(null);

  const handlePhotoSelect = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setPhotoError("");
    setPhotoHint("");

    // 1. Basic MIME/extension check: JPG, PNG, WebP, HEIC/HEIF
    if (!isValidImageType(file)) {
      setPhotoError(VALIDATION_MESSAGES.INVALID_TYPE);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 2. Decode image source (auto EXIF orientation) and validate dimensions
    try {
      const imgSource = await loadImageSource(file);
      const dimCheck = checkImageDimensions(imgSource.width, imgSource.height);

      if (!dimCheck.valid) {
        imgSource.cleanup?.();
        setPhotoError(dimCheck.error);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // If shorter side between 300 and 599 px, set non-blocking hint
      if (dimCheck.hint) {
        setPhotoHint(dimCheck.hint);
      } else {
        setPhotoHint("");
      }

      // Open Crop / Reposition Modal (fixed 4:5 frame)
      setCropData({ file, imageSource: imgSource });
      setCropModalOpen(true);
    } catch (err) {
      console.error("Photo decode error:", err);
      setPhotoError(VALIDATION_MESSAGES.INVALID_TYPE);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCropComplete = async (croppedResult) => {
    setCropModalOpen(false);
    cropData?.imageSource?.cleanup?.();
    setCropData(null);

    const { file: processedFile, previewUrl } = croppedResult;

    setPhotoPreview(previewUrl);
    setPhotoError("");
    setFormError("");

    setIsUploadingPhoto(true);
    setUploadProgress(15);

    try {
      const result = await uploadMedia({
        file: processedFile,
        category: "headshot",
        title: `${name || "Talent"} Profile Photo`,
        validationType: "profilePhoto",
        isMainProfilePhoto: true,
        isRegistration: true,
        onProgress: (percent) => setUploadProgress(percent),
      });

      const finalUrl = result?.url || previewUrl;

      setPhotoUrl(finalUrl);
      setUploadProgress(100);
      saveDraft({ photoUrl: finalUrl });
    } catch (err) {
      console.warn("Photo upload fallback to preview during registration:", err?.message);
      // Gracefully use local preview so registration flow is never blocked
      const finalUrl = previewUrl;
      setPhotoUrl(finalUrl);
      setUploadProgress(100);
      saveDraft({ photoUrl: finalUrl });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    cropData?.imageSource?.cleanup?.();
    setCropData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemovePhoto = () => {
    if (photoPreview && photoPreview.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(photoPreview);
      } catch (e) {}
    }
    setPhotoPreview("");
    setPhotoUrl("");
    setPhotoError("");
    setPhotoHint("");
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    saveDraft({ photoUrl: "" });
  };

  // Step 2 & 4 (Org): Basic Org Identity & Org Profile
  const [companyType, setCompanyType] = useState("Production House");
  const [orgPhone, setOrgPhone] = useState("+91 98765 43210");
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

  // Store only the lightweight draft session identifier (no form data in localStorage)
  const [draftToken, setDraftToken] = useState(null);

  // Reset draft from database (MongoDB) and restart registration from step 1
  const handleResetRegistration = async () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("vismaya_registration_draft");
        const token = sessionStorage.getItem("vismaya_draft_token") || draftToken;
        if (token) {
          await authService.deleteDraft(token).catch(() => {});
          sessionStorage.removeItem("vismaya_draft_token");
        }
      } catch (e) {}
    }
    setDraftToken(null);
    setCurrentStep(1);
    setIsPaid(false);
    setOrderReceipt(null);
    setFormError("");
    setOtp("");
    setOtpSent(false);
    setEmail("");
    setName("");
    setPhotoUrl("");
    setPhotoPreview("");
    setPhotoError("");
    setUploadProgress(0);
    setPassword("secretpassword123");
    setConfirmPassword("secretpassword123");
  };

  // Restore registration draft directly from MongoDB database
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      try {
        const storedToken = sessionStorage.getItem("vismaya_draft_token");
        if (storedToken) setDraftToken(storedToken);
      } catch (e) {}

      // Purge any legacy localStorage draft key so no form data resides in localStorage
      try {
        localStorage.removeItem("vismaya_registration_draft");
      } catch (e) {}

      const isResetRequested = searchParams?.get("reset") === "true" || searchParams?.get("new") === "true";
      const token = sessionStorage.getItem("vismaya_draft_token");

      if (isResetRequested) {
        if (token) {
          authService.deleteDraft(token).catch(() => {});
          sessionStorage.removeItem("vismaya_draft_token");
        }
        setDraftToken(null);
        setCurrentStep(1);
        return;
      }

      if (token) {
        authService.getDraft(token).then((res) => {
          if (res?.success && res?.draft) {
            const d = res.draft;
            const f = d.formData || {};
            if (d.role) setSelectedRole(d.role);
            if (d.email) setEmail(d.email);
            if (f.name) setName(f.name);
            if (f.phone || f.mobile) {
              const restoredMobile = f.mobile || f.phone;
              if (d.role === "organization") setOrgPhone(restoredMobile);
              else setPhone(restoredMobile);
            }
            if (f.city) setCity(f.city);
            if (f.photoUrl) setPhotoUrl(f.photoUrl);
            if (f.companyType) setCompanyType(f.companyType);
            if (f.website) setWebsite(f.website);
            if (f.aboutStudio) setAboutStudio(f.aboutStudio);
            if (f.genres) setGenres(f.genres);
            if (f.cinNumber) setCinNumber(f.cinNumber);
            if (f.gstNumber) setGstNumber(f.gstNumber);
            if (f.primaryCraft) setPrimaryCraft(f.primaryCraft);
            if (f.skills) setSkills(f.skills);
            if (f.bio) setBio(f.bio);
            if (f.isPaid) setIsPaid(true);
            if (f.orderReceipt) setOrderReceipt(f.orderReceipt);
            if (d.currentStep) {
              if (f.isPaid) {
                const minStep = d.role === "organization" ? 4 : 5;
                setCurrentStep(Math.max(d.currentStep, minStep));
              } else {
                setCurrentStep(d.currentStep);
              }
            }
          }
        }).catch(() => {});
      }
    }
  }, []);

  // Save registration draft directly to MongoDB database
  const saveDraft = async (updated = {}) => {
    const targetEmail = updated.email || email;
    if (!targetEmail || !targetEmail.includes("@")) return;

    const currentContact = selectedRole === "organization" ? orgPhone : phone;
    const normalizedContact = normalizeIndianMobile(currentContact);

    const payload = {
      email: targetEmail.toLowerCase().trim(),
      role: updated.role || selectedRole,
      currentStep: updated.step || currentStep,
      formData: {
        name: updated.name !== undefined ? updated.name : name,
        phone: normalizedContact,
        mobile: normalizedContact,
        city: updated.city !== undefined ? updated.city : city,
        age: updated.age !== undefined ? updated.age : age,
        photoUrl: updated.photoUrl !== undefined ? updated.photoUrl : photoUrl,
        companyType,
        website,
        aboutStudio,
        genres,
        cinNumber,
        gstNumber,
        primaryCraft,
        skills,
        bio,
        isPaid: updated.isPaid !== undefined ? updated.isPaid : isPaid,
        orderReceipt: updated.orderReceipt || orderReceipt,
      },
    };

    try {
      const activeToken = draftToken || (typeof window !== "undefined" ? sessionStorage.getItem("vismaya_draft_token") : null);
      const res = await authService.saveDraft(payload, activeToken);
      if (res?.draftToken) {
        setDraftToken(res.draftToken);
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem("vismaya_draft_token", res.draftToken);
            localStorage.removeItem("vismaya_registration_draft");
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn("Could not sync registration draft to database:", err?.message);
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
    setMobileError("");
    setEmailError("");
    setNameError("");
    setPasswordError("");
    if (role === "organization") {
      setName("Acme Productions Studio");
      setEmail("casting@acmeproductions.io");
      setOrgPhone("+91 98765 43210");
    } else {
      setName("Aanya Sharma");
      setEmail("aanya.sharma@vismaya.io");
      setPhone("+91 98765 43210");
    }
  };

  // Step 1: Submit Account
  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setMobileError("");
    setEmailError("");
    setNameError("");
    setPasswordError("");

    if (!name.trim()) {
      setNameError("Please enter your name.");
      setFormError("Please enter your name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setEmailError("Please enter a valid work email address.");
      setFormError("Please enter a valid work email address.");
      return;
    }

    const currentMobile = selectedRole === "organization" ? orgPhone : phone;
    const mobErr = validateIndianMobile(currentMobile);
    if (mobErr) {
      setMobileError(mobErr);
      setFormError(mobErr);
      return;
    }

    if (!password || password.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      setFormError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      setFormError("Passwords do not match.");
      return;
    }

    const normalizedMobile = normalizeIndianMobile(currentMobile);
    if (selectedRole === "organization") {
      setOrgPhone(normalizedMobile);
    } else {
      setPhone(normalizedMobile);
    }

    // Availability verification on step 1 (check if email or mobile already exists)
    if (isRealMode("auth")) {
      setIsCheckingAccount(true);
      try {
        const checkRes = await authService.checkAvailability({
          email: email.trim(),
          mobile: normalizedMobile,
        });
        if (checkRes && checkRes.available === false) {
          if (checkRes.field === "mobile") {
            setMobileError(checkRes.message || "User with this mobile number already exists");
            setFormError(checkRes.message || "User with this mobile number already exists");
          } else if (checkRes.field === "email") {
            setEmailError(checkRes.message || "User with this email already exists");
            setFormError(checkRes.message || "User with this email already exists");
          } else {
            setFormError(checkRes.message);
          }
          return;
        }
      } catch (checkErr) {
        console.warn("Availability check warning:", checkErr?.message);
      } finally {
        setIsCheckingAccount(false);
      }
    }

    setOtpSent(true);
    setResendTimer(60);
    setCurrentStep(2);
    saveDraft({ step: 2, phone: normalizedMobile, mobile: normalizedMobile });
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
        setFormError("Please add a profile photo to continue.");
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
    setMobileError("");
    setEmailError("");
    setNameError("");
    setPasswordError("");

    try {
      const rawContact = selectedRole === "organization" ? orgPhone : phone;
      const cleanContact = normalizeIndianMobile(rawContact);
      const payload = {
        role: selectedRole === "organization" ? "organization" : "talent",
        email: email.trim(),
        password,
        name: name.trim(),
        studioName: selectedRole === "organization" ? name.trim() : undefined,
        city: city || "Mumbai",
        phone: cleanContact,
        mobile: cleanContact,
        profilePhoto: photoUrl,
        stageName: name.trim(),
        primaryProfession: primaryCraft,
        skills: skills ? skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
        bio: bio ? bio.trim() : "",
        companyType: selectedRole === "organization" ? companyType : undefined,
        cinNumber: selectedRole === "organization" ? cinNumber : undefined,
        registrationNumber: selectedRole === "organization" ? cinNumber : undefined,
        gstNumber: selectedRole === "organization" ? gstNumber : undefined,
        website: selectedRole === "organization" ? website : undefined,
        description: selectedRole === "organization" ? aboutStudio : undefined,
      };

      const res = await register(payload);
      if (res.success && res.user) {
        if (selectedRole === "talent") {
          try {
            await talentService.saveProfile({
              stageName: name.trim(),
              primaryProfession: primaryCraft,
              skills: skills ? skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
              bio: bio.trim(),
              currentCity: city || "Mumbai",
              profilePhoto: photoUrl,
              experienceRange: "1-3 years",
            });
          } catch (profErr) {
            console.warn("Could not auto-save talent profile:", profErr?.message);
          }
        } else if (selectedRole === "organization") {
          try {
            await recruiterService.saveOrganizationProfile({
              companyName: name.trim(),
              companyType,
              phone: cleanContact,
              city: city || "Mumbai",
              website,
              about: aboutStudio,
              genres: genres ? genres.split(",").map((g) => g.trim()).filter(Boolean) : [],
              cinNumber,
              gstNumber,
            });
          } catch (orgErr) {
            console.warn("Could not auto-save organization profile:", orgErr?.message);
          }
        }

        // Clear registration draft from database upon successful onboarding
        const tokenToDelete = draftToken || (typeof window !== "undefined" ? sessionStorage.getItem("vismaya_draft_token") : null);
        if (tokenToDelete) {
          authService.deleteDraft(tokenToDelete).catch(() => {});
          if (typeof window !== "undefined") {
            try {
              sessionStorage.removeItem("vismaya_draft_token");
              localStorage.removeItem("vismaya_registration_draft");
            } catch (e) {}
          }
        }
        router.push(getDashboardPath(selectedRole));
      } else {
        const errMsg = res.error || "Registration error occurred. Please try again.";
        const lower = errMsg.toLowerCase();

        // If backend returns a field error, jump back to the step that owns that field!
        if (lower.includes("mobile") || lower.includes("phone")) {
          setMobileError(errMsg);
          setFormError(errMsg);
          setCurrentStep(1);
        } else if (lower.includes("email")) {
          setEmailError(errMsg);
          setFormError(errMsg);
          setCurrentStep(1);
        } else if (lower.includes("password")) {
          setPasswordError(errMsg);
          setFormError(errMsg);
          setCurrentStep(1);
        } else if (lower.includes("name") || lower.includes("studio")) {
          setNameError(errMsg);
          setFormError(errMsg);
          setCurrentStep(1);
        } else if (lower.includes("photo")) {
          setPhotoError(errMsg);
          setFormError(errMsg);
          setCurrentStep(selectedRole === "talent" ? 3 : 1);
        } else if (lower.includes("city")) {
          setFormError(errMsg);
          setCurrentStep(selectedRole === "talent" ? 3 : 1);
        } else if (lower.includes("company") || lower.includes("genre") || lower.includes("about")) {
          setFormError(errMsg);
          setCurrentStep(4);
        } else {
          setFormError(errMsg);
        }
      }
    } catch (err) {
      const errMsg = err.message || "An unexpected error occurred.";
      const lower = errMsg.toLowerCase();
      if (lower.includes("mobile") || lower.includes("phone")) {
        setMobileError(errMsg);
        setFormError(errMsg);
        setCurrentStep(1);
      } else if (lower.includes("email")) {
        setEmailError(errMsg);
        setFormError(errMsg);
        setCurrentStep(1);
      } else {
        setFormError(errMsg);
      }
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

  if (!mounted) {
    return <div style={{ minHeight: "100vh", backgroundColor: "#FAF9F7" }} />;
  }

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
          {/* Restart option when past step 1 */}
          {currentStep > 1 && (
            <div style={{ width: "100%", maxWidth: "520px", display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
              <button
                type="button"
                onClick={handleResetRegistration}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8A6B2E",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: "4px 8px",
                }}
              >
                ← Start over / Register with different email
              </button>
            </div>
          )}

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
            suppressHydrationWarning
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
                {currentStep === 3 && (selectedRole === "talent" ? "Profile Photo & Details" : "One-Time Registration")}
                {currentStep === 4 && (selectedRole === "talent" ? "One-Time Registration" : "Studio Profile")}
                {currentStep === 5 && (selectedRole === "talent" ? "Craft & Specializations" : "Accreditation Documents")}
              </h1>

              <p style={{ fontSize: "13.5px", color: "var(--text-secondary, #777970)", margin: 0 }}>
                {currentStep === 1 && "Join India's verified entertainment network."}
                {currentStep === 2 && `Enter the 6-digit verification code sent to ${email}`}
                {currentStep === 3 && (selectedRole === "talent" ? "Add a clear, recent photo of your face. It appears on your Vismaya profile and helps casting teams recognise you." : "Secure one-time registration with 100 included credits.")}
                {currentStep === 4 && (selectedRole === "talent" ? "Complete one-time lifetime fee of ₹999." : "Tell artists and casting directors about your production house.")}
                {currentStep === 5 && (selectedRole === "talent" ? "Finalize your professional profile to start applying." : "Corporate documentation for studio verification.")}
              </p>
            </div>

            {/* Error Notification */}
            {formError && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  padding: "10px 14px",
                  backgroundColor: "var(--danger-bg)",
                  border: "1px solid var(--danger-border)",
                  borderRadius: "var(--radius-card, 6px)",
                  color: "var(--danger)",
                  fontSize: "13px",
                  marginBottom: "16px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{formError}</span>
                </div>
                {formError.toLowerCase().includes("already exists") && (
                  <Link
                    href="/login"
                    style={{
                      color: "#8A6B2E",
                      fontWeight: "600",
                      textDecoration: "underline",
                      fontSize: "12.5px",
                      marginLeft: "auto",
                    }}
                  >
                    Sign In instead →
                  </Link>
                )}
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
                      suppressHydrationWarning
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
                      suppressHydrationWarning
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
                      id="input-reg-name"
                      type="text"
                      suppressHydrationWarning
                      placeholder={selectedRole === "organization" ? "e.g. Acme Studios" : "e.g. Aanya Sharma"}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (nameError) setNameError("");
                      }}
                      required
                      style={{
                        paddingLeft: "42px",
                        width: "100%",
                        height: "42px",
                        borderColor: nameError ? "var(--danger, #C53030)" : undefined,
                      }}
                    />
                  </div>
                  {nameError && (
                    <div id="error-reg-name" style={{ color: "var(--danger, #C53030)", fontSize: "12px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <AlertCircle size={13} style={{ flexShrink: 0 }} />
                      <span>{nameError}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Work Email Address
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Mail size={16} style={{ position: "absolute", left: "14px", color: "var(--text-secondary, #777970)", pointerEvents: "none" }} />
                    <input
                      id="input-reg-email"
                      type="email"
                      suppressHydrationWarning
                      placeholder={selectedRole === "organization" ? "casting@studio.com" : "name@example.com"}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError("");
                      }}
                      required
                      style={{
                        paddingLeft: "42px",
                        width: "100%",
                        height: "42px",
                        borderColor: emailError ? "var(--danger, #C53030)" : undefined,
                      }}
                    />
                  </div>
                  {emailError && (
                    <div id="error-reg-email" style={{ color: "var(--danger, #C53030)", fontSize: "12px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <AlertCircle size={13} style={{ flexShrink: 0 }} />
                      <span>{emailError}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Mobile Number
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Phone size={16} style={{ position: "absolute", left: "14px", color: "var(--text-secondary, #777970)", pointerEvents: "none" }} />
                    <input
                      id="input-reg-mobile"
                      type="tel"
                      suppressHydrationWarning
                      placeholder="+91 98765 43210"
                      value={selectedRole === "organization" ? orgPhone : phone}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (selectedRole === "organization") {
                          setOrgPhone(val);
                        } else {
                          setPhone(val);
                        }
                        if (mobileError) setMobileError("");
                      }}
                      required
                      style={{
                        paddingLeft: "42px",
                        width: "100%",
                        height: "42px",
                        borderColor: mobileError ? "var(--danger, #C53030)" : undefined,
                      }}
                    />
                  </div>
                  {mobileError && (
                    <div id="error-reg-mobile" style={{ color: "var(--danger, #C53030)", fontSize: "12px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <AlertCircle size={13} style={{ flexShrink: 0 }} />
                      <span>{mobileError}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Create Password
                  </label>
                  <PasswordInput
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                    }}
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
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                    }}
                    placeholder="Re-enter your password"
                    required
                    autoComplete="new-password"
                    leftIcon={<Lock size={16} />}
                  />
                  {passwordError && (
                    <div id="error-reg-password" style={{ color: "var(--danger, #C53030)", fontSize: "12px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <AlertCircle size={13} style={{ flexShrink: 0 }} />
                      <span>{passwordError}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  suppressHydrationWarning
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
                    Enter the 6-digit verification code sent to your email.
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
            {/* STEP 3 (TALENT): PROFILE PHOTO & DETAILS                  */}
            {/* ========================================================= */}
            {currentStep === 3 && selectedRole === "talent" && (
              <form onSubmit={handleBasicIdentitySubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {/* Crop & Reposition Modal (fixed 4:5 portrait frame) */}
                {cropModalOpen && cropData && (
                  <PhotoCropModal
                    isOpen={cropModalOpen}
                    file={cropData.file}
                    imageSource={cropData.imageSource}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                  />
                )}

                {/* Hidden File Picker Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  style={{ display: "none" }}
                  aria-label="Add profile photo"
                  onChange={handlePhotoSelect}
                />

                {/* Photo Upload Section: Centered */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                  {/* Photo Label with Gold Required Tag */}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "var(--text-primary, #292C29)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Profile photo
                    </span>
                    <span
                      style={{
                        fontSize: "10.5px",
                        fontWeight: "600",
                        color: "#8A6B2E",
                        backgroundColor: "#F3EFE6",
                        border: "1px solid #E8E2D4",
                        borderRadius: "10px",
                        padding: "1px 7px",
                        letterSpacing: "0.02em",
                      }}
                    >
                      Required
                    </span>
                  </div>

                  {/* 120px Circular Avatar with Overlapping Button */}
                  <div style={{ position: "relative", width: "120px", height: "120px", margin: "0 auto 10px" }}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          fileInputRef.current?.click();
                        }
                      }}
                      aria-label={photoPreview || photoUrl ? "Change profile photo" : "Add profile photo"}
                      style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        border: "3px solid #8A6B2E",
                        backgroundColor: "#F3EFE6",
                        backgroundImage: (photoPreview || photoUrl) ? `url(${photoPreview || photoUrl})` : "none",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        overflow: "hidden",
                        boxShadow: "0 2px 8px rgba(138, 107, 46, 0.15)",
                        position: "relative",
                        outline: "none",
                      }}
                    >
                      {!(photoPreview || photoUrl) && (
                        <User size={54} color="#8A6B2E" strokeWidth={1.5} style={{ opacity: 0.7 }} />
                      )}

                      {/* Per-file Upload Progress Indicator */}
                      {isUploadingPhoto && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            backgroundColor: "rgba(43, 45, 42, 0.58)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "50%",
                            color: "#FFFFFF",
                            gap: "4px",
                          }}
                        >
                          <Loader2 size={24} className="animate-spin" color="#FFFFFF" />
                          <span style={{ fontSize: "11px", fontWeight: "600", color: "#FFFFFF" }}>
                            {uploadProgress}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Round button overlapping bottom-right edge */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      aria-label={photoPreview || photoUrl ? "Change profile photo" : "Add profile photo"}
                      style={{
                        position: "absolute",
                        bottom: "2px",
                        right: "2px",
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        backgroundColor: "#8A6B2E",
                        border: "2px solid #FAF9F7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
                        padding: 0,
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#6E5420")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#8A6B2E")}
                    >
                      {photoPreview || photoUrl ? (
                        <Pencil size={15} color="#FFFFFF" strokeWidth={2.2} />
                      ) : (
                        <Plus size={18} color="#FFFFFF" strokeWidth={2.4} />
                      )}
                    </button>
                  </div>

                  {/* Upload Progress Bar */}
                  {isUploadingPhoto && (
                    <div style={{ width: "160px", margin: "4px auto 8px" }}>
                      <div style={{ width: "100%", height: "4px", backgroundColor: "#E8E2D4", borderRadius: "2px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${uploadProgress}%`,
                            height: "100%",
                            backgroundColor: "#8A6B2E",
                            transition: "width 0.2s ease",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* "Remove" text link under avatar */}
                  {(photoPreview || photoUrl) && !isUploadingPhoto && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#8A6B2E",
                        fontSize: "12px",
                        fontWeight: "500",
                        cursor: "pointer",
                        textDecoration: "underline",
                        marginTop: "2px",
                        marginBottom: "4px",
                        padding: "2px 6px",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#6E5420")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#8A6B2E")}
                    >
                      Remove
                    </button>
                  )}

                  {/* Helper text under avatar */}
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#5A584F",
                      lineHeight: 1.45,
                      margin: "6px 0 0",
                      maxWidth: "420px",
                    }}
                  >
                    JPG or PNG. Your face must be clearly visible. Group photos and AI-generated images are not accepted.
                  </p>

                  {/* Non-blocking Hint for 300-599px */}
                  {photoHint && !photoError && (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        marginTop: "8px",
                        padding: "5px 12px",
                        backgroundColor: "#F3EFE6",
                        border: "1px solid #E8E2D4",
                        borderRadius: "6px",
                        color: "#8A6B2E",
                        fontSize: "12px",
                      }}
                    >
                      <Info size={14} style={{ flexShrink: 0 }} />
                      <span>{photoHint}</span>
                    </div>
                  )}

                  {/* Inline Photo Error Message with Try Again */}
                  {photoError && (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        marginTop: "10px",
                        padding: "6px 12px",
                        backgroundColor: "var(--danger-bg, #FFF5F5)",
                        border: "1px solid var(--danger-border, #FED7D7)",
                        borderRadius: "6px",
                        color: "var(--danger, #C53030)",
                        fontSize: "12.5px",
                      }}
                    >
                      <AlertCircle size={14} style={{ flexShrink: 0 }} />
                      <span>{photoError}</span>
                      {photoError === "Upload failed. Please try again." && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#8A6B2E",
                            fontWeight: "600",
                            fontSize: "12.5px",
                            cursor: "pointer",
                            textDecoration: "underline",
                            marginLeft: "4px",
                            padding: 0,
                          }}
                        >
                          Try again
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Form Fields: Two-column grid on desktop, single column on mobile */}
                <div
                  className="talent-details-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "14px",
                    width: "100%",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "var(--text-primary, #292C29)",
                        marginBottom: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Age
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                      style={{ width: "100%", height: "42px", borderRadius: "6px", border: "1px solid #E8E2D4", boxSizing: "border-box" }}
                    />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "var(--text-primary, #292C29)",
                        marginBottom: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Current city
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      style={{ width: "100%", height: "42px", borderRadius: "6px", border: "1px solid #E8E2D4", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                {/* Mobile Phone Full Width Below */}
                <div style={{ width: "100%" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "var(--text-primary, #292C29)",
                      marginBottom: "6px",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Mobile phone
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
                    <Phone
                      size={16}
                      style={{ position: "absolute", left: "14px", color: "var(--text-secondary, #777970)", pointerEvents: "none" }}
                    />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      style={{ paddingLeft: "42px", width: "100%", height: "42px", borderRadius: "6px", border: "1px solid #E8E2D4", boxSizing: "border-box" }}
                    />
                  </div>
                </div>


                {/* Action Buttons Row */}
                <div style={{ display: "flex", gap: "12px", marginTop: "6px" }}>
                  <button
                    type="button"
                    onClick={handleBack}
                    style={{
                      height: "44px",
                      padding: "0 20px",
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
                    disabled={isUploadingPhoto}
                    className="btn-primary"
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      height: "44px",
                      opacity: isUploadingPhoto ? 0.7 : 1,
                      cursor: isUploadingPhoto ? "not-allowed" : "pointer",
                    }}
                  >
                    <span>Continue to payment (₹{PRICING_CONFIG.TALENT_FEE})</span>
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
                  onCancel={handleBack}
                />
                <div style={{ marginTop: "14px", textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={handleResetRegistration}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#8A6B2E",
                      fontSize: "13px",
                      fontWeight: "500",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Want to use a different email? Clear draft and start over
                  </button>
                </div>
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
                  onCancel={handleBack}
                />
                <div style={{ marginTop: "14px", textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={handleResetRegistration}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#8A6B2E",
                      fontSize: "13px",
                      fontWeight: "500",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Want to use a different email? Clear draft and start over
                  </button>
                </div>
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
                    Your organization will be verified after your documents are reviewed.
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
          :global(.talent-details-grid) {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
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
