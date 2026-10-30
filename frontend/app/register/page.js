"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  Upload,
  X,
  ExternalLink,
  Clock,
} from "lucide-react";
import { PRICING_CONFIG } from "@/lib/config/pricing";
import { PHOTO_UPLOAD_CONFIG } from "@/lib/config/photoUpload";
import { getAuthToken, setAuthToken } from "@/lib/api/client";
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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isCheckingAccount, setIsCheckingAccount] = useState(false);

  // Step 2: OTP (or inside step 1 for Org)
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [otpDemoMode, setOtpDemoMode] = useState(false);

  // Step 3 (Talent): Basic Identity + Photo
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [age, setAge] = useState("");
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

    // 1. Basic MIME/extension check: JPG, PNG, WebP
    if (!isValidImageType(file)) {
      setPhotoError("Photo must be a JPG, PNG, or WebP.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 2. Exact file size validation with actual vs required message
    if (file.size > PHOTO_UPLOAD_CONFIG.maxSizeBytes) {
      const actualMB = (file.size / (1024 * 1024)).toFixed(1);
      setPhotoError(`Your photo is ${actualMB} MB. Maximum allowed size is ${PHOTO_UPLOAD_CONFIG.maxSizeMB} MB.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 3. Decode image source (auto EXIF orientation) and validate dimensions
    try {
      const imgSource = await loadImageSource(file);
      const dimCheck = checkImageDimensions(imgSource.width, imgSource.height);

      if (!dimCheck.valid) {
        imgSource.cleanup?.();
        setPhotoError(dimCheck.error);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // If shorter side between 400 and 599 px, set non-blocking hint
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
      setPhotoError(err?.message || "Invalid image file format.");
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
  const [orgPhone, setOrgPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [aboutStudio, setAboutStudio] = useState("");
  const [genres, setGenres] = useState("");
  // Step 5 (Org): Accreditation Documents & Legal Credentials
  const [cinNumber, setCinNumber] = useState("");
  const [regNumberError, setRegNumberError] = useState("");
  const [businessDocUrl, setBusinessDocUrl] = useState("");
  const [businessDocName, setBusinessDocName] = useState("");
  const [businessDocError, setBusinessDocError] = useState("");
  const [isUploadingBusinessDoc, setIsUploadingBusinessDoc] = useState(false);

  const [gstNumber, setGstNumber] = useState("");
  const [isGstExempt, setIsGstExempt] = useState(false);
  const [gstExemptionReason, setGstExemptionReason] = useState("");
  const [gstCertUrl, setGstCertUrl] = useState("");
  const [gstCertName, setGstCertName] = useState("");
  const [gstError, setGstError] = useState("");
  const [isUploadingGstCert, setIsUploadingGstCert] = useState(false);

  const [professionalProofUrl, setProfessionalProofUrl] = useState("");
  const [professionalProofDocUrl, setProfessionalProofDocUrl] = useState("");
  const [professionalProofDocName, setProfessionalProofDocName] = useState("");
  const [professionalProofError, setProfessionalProofError] = useState("");
  const [isUploadingProfProof, setIsUploadingProfProof] = useState(false);

  const [otherEvidenceList, setOtherEvidenceList] = useState([]); // [{ url, name }]
  const [otherEvidenceError, setOtherEvidenceError] = useState("");
  const [isUploadingOther, setIsUploadingOther] = useState(false);

  const validateRegNumberFormat = (val) => {
    if (!val || typeof val !== "string" || !val.trim()) {
      return "Registration number is required.";
    }
    const clean = val.trim().toUpperCase();
    const isCinLike = clean.length === 21 || /^[LU][0-9]{5}/.test(clean);
    if (isCinLike) {
      const cinRegex = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
      if (!cinRegex.test(clean)) {
        return "Invalid CIN format. Must be 21 characters (e.g. U92100MH2018PTC312456).";
      }
    } else {
      const alphanumericRegex = /^[A-Z0-9\-\/]{6,30}$/;
      if (!alphanumericRegex.test(clean)) {
        return "Registration number must be 6-30 alphanumeric characters (LLPIN / Udyam).";
      }
    }
    return null;
  };

  const validateGstFormat = (val, exempt) => {
    if (exempt) return null;
    if (!val || typeof val !== "string" || !val.trim()) {
      return "GSTIN is required unless exempt.";
    }
    const clean = val.trim().toUpperCase();
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(clean)) {
      return "Invalid GSTIN format (15 characters, e.g. 27AABCZ1234F1Z5).";
    }
    return null;
  };

  const handleFileUpload = async (e, setUrl, setName, setError, setUploading) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setError("");
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) {
      setError("Invalid file type. Only PDF, JPG, and PNG files under 5 MB are accepted.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File exceeds 5 MB limit. Please upload a file smaller than 5 MB.");
      e.target.value = "";
      return;
    }

    try {
      setUploading(true);
      const res = await authService.uploadAccreditationDocument(file);
      if (res?.url) {
        setUrl(res.url);
        setName(res.originalFilename || file.name);
      } else {
        setError(res?.message || "Upload failed. Please try again.");
      }
    } catch (err) {
      setError(err?.message || "Upload failed. Please check file and try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleAddOtherEvidence = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setOtherEvidenceError("");
    if (otherEvidenceList.length >= 2) {
      setOtherEvidenceError("You can upload a maximum of 2 additional evidence files.");
      e.target.value = "";
      return;
    }
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) {
      setOtherEvidenceError("Invalid file type. Only PDF, JPG, and PNG files under 5 MB are accepted.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setOtherEvidenceError("File exceeds 5 MB limit. Please upload a file smaller than 5 MB.");
      e.target.value = "";
      return;
    }

    try {
      setIsUploadingOther(true);
      const res = await authService.uploadAccreditationDocument(file);
      if (res?.url) {
        setOtherEvidenceList((prev) => [
          ...prev,
          { url: res.url, name: res.originalFilename || file.name },
        ]);
      } else {
        setOtherEvidenceError(res?.message || "Upload failed. Please try again.");
      }
    } catch (err) {
      setOtherEvidenceError(err?.message || "Upload failed. Please check file and try again.");
    } finally {
      setIsUploadingOther(false);
      e.target.value = "";
    }
  };

  // Step 5 (Talent): Professional Identity
  const [primaryCraft, setPrimaryCraft] = useState("Actor / Screen Artist");
  const [skills, setSkills] = useState("");
  const [bio, setBio] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(false);
  const [isAccountActivated, setIsAccountActivated] = useState(false);
  const [formError, setFormError] = useState("");

  // Store only the lightweight draft session identifier (no form data in localStorage)
  const [draftToken, setDraftToken] = useState(null);

  // Reset draft from database (MongoDB) and restart registration from step 1
  const handleResetRegistration = async () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("vismaya_registration_draft");
        sessionStorage.removeItem("vismaya_reg_session_active");
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
    setPhone("");
    setOrgPhone("");
    setCity("");
    setAge("");
    setCompanyType("Production House");
    setWebsite("");
    setAboutStudio("");
    setGenres("");
    setCinNumber("");
    setGstNumber("");
    setPhotoUrl("");
    setPhotoPreview("");
    setPhotoError("");
    setPhotoHint("");
    setUploadProgress(0);
    setPassword("");
    setConfirmPassword("");
    setSkills("");
    setBio("");
    setIsRegistrationComplete(false);
    setIsAccountActivated(false);
  };

  // Restore registration draft directly from MongoDB database
  useEffect(() => {
    setMounted(true);

    // Fetch public OTP configuration (demo mode indicator)
    authService
      .getOtpConfig()
      .then((cfg) => {
        if (cfg?.demoMode) setOtpDemoMode(true);
      })
      .catch(() => {});

    if (typeof window !== "undefined") {
      // Purge any legacy localStorage draft key
      try {
        localStorage.removeItem("vismaya_registration_draft");
      } catch (e) {}

      const isResetRequested = searchParams?.get("reset") === "true" || searchParams?.get("new") === "true";
      const isSessionActive = sessionStorage.getItem("vismaya_reg_session_active") === "true";
      const token = sessionStorage.getItem("vismaya_draft_token");

      // Requirement 2: The form must start empty on every fresh visit;
      // any saved draft must be cleared on mount of a fresh register page.
      // Keep in-progress state ONLY within the same active multi-step session.
      if (isResetRequested || !isSessionActive) {
        if (token) {
          authService.deleteDraft(token).catch(() => {});
          sessionStorage.removeItem("vismaya_draft_token");
        }
        sessionStorage.removeItem("vismaya_reg_session_active");
        setDraftToken(null);
        setCurrentStep(1);
        return;
      }

      if (token && isSessionActive) {
        setDraftToken(token);
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
            if (f.age) setAge(f.age);
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
    setName("");
    setEmail("");
    setPhone("");
    setOrgPhone("");
    setPassword("");
    setConfirmPassword("");
    setCity("");
    setAge("");
    setWebsite("");
    setAboutStudio("");
    setGenres("");
    setCinNumber("");
    setGstNumber("");
    setSkills("");
    setBio("");
    setPhotoUrl("");
    setPhotoPreview("");
    setPhotoError("");
    setPhotoHint("");
    setUploadProgress(0);
    setDraftToken(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("vismaya_draft_token");
      sessionStorage.removeItem("vismaya_reg_session_active");
      localStorage.removeItem("vismaya_registration_draft");
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

    try {
      authService.resendRegistrationOtp({ email }).catch(() => {});
    } catch {}

    setOtpSent(true);
    setResendTimer(60);
    setCurrentStep(2);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("vismaya_reg_session_active", "true");
    }
    saveDraft({ step: 2, phone: normalizedMobile, mobile: normalizedMobile });
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setFormError("Please enter the verification code sent to your email.");
      return;
    }

    setFormError("");
    try {
      const verifyRes = await authService.verifyRegistration({ email, otp: otp.trim() });
      if (verifyRes && verifyRes.success === false) {
        setFormError(verifyRes.message || "Invalid verification code. Please check and try again.");
        return;
      }
    } catch (vErr) {
      setFormError(vErr.message || "Invalid verification code. Please check and try again.");
      return;
    }

    const nextStep = 3;
    setCurrentStep(nextStep);
    saveDraft({ step: nextStep });
  };

  // Step 3 (Talent) / Step 2 (Org): Basic Identity Submit
  const handleBasicIdentitySubmit = (e) => {
    e.preventDefault();
    if (selectedRole === "talent") {
      // Photo, Age and City are optional - can be completed later in profile
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
    setRegNumberError("");
    setBusinessDocError("");
    setGstError("");
    setProfessionalProofError("");

    if (selectedRole === "organization") {
      let hasClientErr = false;

      // 1. Registration Number validation
      const regErr = validateRegNumberFormat(cinNumber);
      if (regErr) {
        setRegNumberError(regErr);
        hasClientErr = true;
      }

      // 2. Business registration document upload validation
      if (!businessDocUrl) {
        setBusinessDocError("Business registration document upload is required.");
        hasClientErr = true;
      }

      // 3. GSTIN + Certificate or Exemption reason
      if (!isGstExempt) {
        const gstErr = validateGstFormat(gstNumber, false);
        if (gstErr) {
          setGstError(gstErr);
          hasClientErr = true;
        } else if (!gstCertUrl) {
          setGstError("GST certificate upload is required when GST registered.");
          hasClientErr = true;
        }
      } else {
        if (!gstExemptionReason || gstExemptionReason.trim().length < 3) {
          setGstError("Please provide a valid reason for GST exemption (minimum 3 characters).");
          hasClientErr = true;
        }
      }

      // 4. Professional / Industry proof (website/portfolio link or uploaded document)
      const hasLink = Boolean((website && website.trim()) || (professionalProofUrl && professionalProofUrl.trim()));
      const hasDoc = Boolean(professionalProofDocUrl);
      if (!hasLink && !hasDoc) {
        setProfessionalProofError("Please provide either a website/portfolio link or upload a professional proof document.");
        hasClientErr = true;
      }

      if (hasClientErr) {
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const rawContact = selectedRole === "organization" ? orgPhone : phone;
      const cleanContact = normalizeIndianMobile(rawContact);
      const effectiveWebsite = professionalProofUrl.trim() || (website ? website.trim() : undefined);
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
        cinNumber: selectedRole === "organization" ? cinNumber.trim().toUpperCase() : undefined,
        registrationNumber: selectedRole === "organization" ? cinNumber.trim().toUpperCase() : undefined,
        gstNumber: selectedRole === "organization" ? (isGstExempt ? undefined : gstNumber.trim().toUpperCase()) : undefined,
        isGstExempt: selectedRole === "organization" ? Boolean(isGstExempt) : undefined,
        gstExemptionReason: selectedRole === "organization" && isGstExempt ? gstExemptionReason.trim() : undefined,
        businessRegistrationDocUrl: selectedRole === "organization" ? businessDocUrl : undefined,
        businessRegistrationDocName: selectedRole === "organization" ? businessDocName : undefined,
        gstCertificateUrl: selectedRole === "organization" && !isGstExempt ? gstCertUrl : undefined,
        gstCertificateDocName: selectedRole === "organization" && !isGstExempt ? gstCertName : undefined,
        professionalProofType: selectedRole === "organization" ? (professionalProofDocUrl && effectiveWebsite ? "both" : (professionalProofDocUrl ? "document" : "website")) : undefined,
        professionalProofUrl: selectedRole === "organization" ? effectiveWebsite : undefined,
        professionalProofDocUrl: selectedRole === "organization" ? professionalProofDocUrl : undefined,
        professionalProofDocName: selectedRole === "organization" ? professionalProofDocName : undefined,
        otherEvidenceUrls: selectedRole === "organization" ? otherEvidenceList.map((i) => i.url) : undefined,
        otherEvidenceDocNames: selectedRole === "organization" ? otherEvidenceList.map((i) => i.name) : undefined,
        website: selectedRole === "organization" ? effectiveWebsite : undefined,
        description: selectedRole === "organization" ? aboutStudio : undefined,
      };

      const res = await register(payload);
      if (res.success && res.user) {
        const activated = res.user.status === "active" && Boolean(res.token);
        setIsAccountActivated(activated);
        // Clear registration draft and active session from storage upon successful onboarding.
        const tokenToDelete = draftToken || (typeof window !== "undefined" ? sessionStorage.getItem("vismaya_draft_token") : null);
        if (tokenToDelete) {
          authService.deleteDraft(tokenToDelete).catch(() => {});
          if (typeof window !== "undefined") {
            try {
              sessionStorage.removeItem("vismaya_draft_token");
              sessionStorage.removeItem("vismaya_reg_session_active");
              localStorage.removeItem("vismaya_registration_draft");
            } catch (e) {}
          }
        }
        setIsRegistrationComplete(true);
        if (activated) {
          setTimeout(() => {
            router.push(getDashboardPath(selectedRole));
          }, 1500);
        }
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
      console.error("[handleFinalSubmit] CAUGHT ERROR:", err);
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
          {/* Back to Home Button */}
          <div style={{ width: "100%", maxWidth: "520px", marginBottom: "14px" }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--text-secondary, #777970)",
                textDecoration: "none",
                fontSize: "13.5px",
                fontWeight: "500",
                padding: "6px 0",
                transition: "color 0.18s ease",
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Restart option when past step 1 */}
          {!isRegistrationComplete && currentStep > 1 && (
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
          {!isRegistrationComplete && (
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
          )}

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
                <span>{isRegistrationComplete ? "Registration Complete" : "Vismaya Onboarding"}</span>
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
                {isRegistrationComplete ? (
                  "Welcome to Vismaya Creative Studios"
                ) : (
                  <>
                    {currentStep === 1 && "Create Your Account"}
                    {currentStep === 2 && "Verify Email Address"}
                    {currentStep === 3 && (selectedRole === "talent" ? "Profile Photo & Details" : "One-Time Registration")}
                    {currentStep === 4 && (selectedRole === "talent" ? "One-Time Registration" : "Studio Profile")}
                    {currentStep === 5 && (selectedRole === "talent" ? "Craft & Specializations" : "Accreditation Documents")}
                  </>
                )}
              </h1>

              <p style={{ fontSize: "13.5px", color: "var(--text-secondary, #777970)", margin: 0 }}>
                {isRegistrationComplete ? (
                  "Your account registration has been processed successfully."
                ) : (
                  <>
                    {currentStep === 1 && "Join India's verified entertainment network."}
                    {currentStep === 2 && `Enter the 6-digit verification code sent to ${email}`}
                    {currentStep === 3 && (selectedRole === "talent" ? "Add a clear, recent photo of your face. It appears on your Vismaya profile and helps casting teams recognise you." : "Secure one-time registration with 100 included credits.")}
                    {currentStep === 4 && (selectedRole === "talent" ? "Complete one-time lifetime fee of ₹999." : "Tell artists and casting directors about your production house.")}
                    {currentStep === 5 && (selectedRole === "talent" ? "Finalize your professional profile to start applying." : "Corporate documentation for studio verification.")}
                  </>
                )}
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

            {isRegistrationComplete ? (
              <div style={{ textAlign: "center", padding: "20px 8px" }}>
                {isAccountActivated ? (
                  <>
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        backgroundColor: "#FAF9F7",
                        border: "2px solid #E8E2D4",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 16px",
                      }}
                    >
                      <CheckCircle2 size={34} style={{ color: "var(--gold, #8A6B2E)" }} />
                    </div>
                    <h2
                      style={{
                        fontFamily: "var(--font-heading), Georgia, serif",
                        fontSize: "20px",
                        fontWeight: 600,
                        color: "var(--text-primary, #292C29)",
                        marginBottom: "8px",
                      }}
                    >
                      Account Activated Successfully
                    </h2>
                    <p
                      style={{
                        fontSize: "13.5px",
                        color: "var(--text-secondary, #5A584F)",
                        maxWidth: "460px",
                        margin: "0 auto 20px",
                        lineHeight: "1.5",
                      }}
                    >
                      {selectedRole === "organization"
                        ? "Your studio account has been activated with 100 included profile-view credits. Your accreditation documents have been submitted to compliance officers for review."
                        : "Your talent account has been activated. Welcome to Vismaya's verified entertainment network!"}
                    </p>

                    <div
                      style={{
                        backgroundColor: "#FAF9F7",
                        border: "1px solid #E8E2D4",
                        borderRadius: "8px",
                        padding: "12px 16px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "13px",
                        color: "#8A6B2E",
                        fontWeight: "600",
                        marginBottom: "24px",
                      }}
                    >
                      <Sparkles size={16} />
                      <span>Redirecting to your dashboard...</span>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => router.push(getDashboardPath(selectedRole))}
                        className="btn-primary"
                        style={{ margin: "0 auto", padding: "0 28px", height: "44px", justifyContent: "center" }}
                      >
                        <span>Enter Dashboard Now</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        backgroundColor: "#F3EFE6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 16px",
                      }}
                    >
                      <ShieldCheck size={34} style={{ color: "#8A6B2E" }} />
                    </div>
                    <h2
                      style={{
                        fontFamily: "var(--font-heading), Georgia, serif",
                        fontSize: "20px",
                        fontWeight: 600,
                        color: "var(--text-primary, #292C29)",
                        marginBottom: "8px",
                      }}
                    >
                      Registration Initiated - Pending Activation
                    </h2>
                    <p
                      style={{
                        fontSize: "13.5px",
                        color: "var(--text-secondary, #5A584F)",
                        maxWidth: "460px",
                        margin: "0 auto 18px",
                        lineHeight: "1.5",
                      }}
                    >
                      {selectedRole === "organization"
                        ? "Your organization registration is incomplete. Payment and OTP verification are required before your studio dashboard can be accessed."
                        : "Your talent registration is incomplete. Payment and OTP verification are required before your talent dashboard can be accessed."}
                    </p>

                    <div
                      style={{
                        backgroundColor: "#FAF9F7",
                        border: "1px solid #E8E2D4",
                        borderRadius: "8px",
                        padding: "12px 18px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
                        fontSize: "13px",
                        color: "#8A6B2E",
                        fontWeight: "600",
                        marginBottom: "24px",
                      }}
                    >
                      <Clock size={16} />
                      <span>Status: Incomplete Registration (Payment / OTP Required)</span>
                    </div>

                    <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                      <button
                        type="button"
                        onClick={() => router.push("/login")}
                        className="btn-primary"
                        style={{ padding: "0 28px", height: "44px", justifyContent: "center" }}
                      >
                        <span>Go to Sign In</span>
                        <ArrowRight size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push("/")}
                        style={{
                          height: "44px",
                          padding: "0 22px",
                          backgroundColor: "transparent",
                          border: "1px solid #E8E2D4",
                          borderRadius: "var(--radius-btn, 4px)",
                          color: "#5A584F",
                          fontSize: "13px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        Return Home
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
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
                      autoComplete="name"
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
                      autoComplete="email"
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
                      autoComplete="tel"
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
                    autoComplete="one-time-code"
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
                  {otpDemoMode && (
                    <div
                      id="otp-demo-mode-banner"
                      style={{
                        backgroundColor: "#F3EFE6",
                        border: "1px solid #D0C9BA",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        marginTop: "8px",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#8A6B2E",
                        textAlign: "center",
                      }}
                    >
                      Demo mode: use code 123456
                    </div>
                  )}
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
                      authService.resendRegistrationOtp({ email }).catch(() => {});
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
                        color: "#777970",
                        backgroundColor: "#F0EEE7",
                        border: "1px solid #E4E1D9",
                        borderRadius: "10px",
                        padding: "1px 7px",
                        letterSpacing: "0.02em",
                      }}
                    >
                      Optional
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
                    {PHOTO_UPLOAD_CONFIG.helperText}. Your face must be clearly visible. Group photos and AI-generated images are not accepted.
                  </p>

                  {/* Non-blocking Hint for 400-599px */}
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
                      autoComplete="off"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
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
                      autoComplete="address-level2"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
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
                      autoComplete="tel"
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
                    autoComplete="off"
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
                    autoComplete="off"
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
            {/* STEP 5 (ORG): ACCREDITATION DOCUMENTS                     */}
            {/* ========================================================= */}
            {currentStep === 5 && selectedRole === "organization" && (
              <form onSubmit={handleFinalSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {/* 1. Registration number */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Registration number (CIN / LLPIN / Udyam) *
                    </label>
                  </div>
                  <input
                    type="text"
                    autoComplete="off"
                    value={cinNumber}
                    onChange={(e) => {
                      setCinNumber(e.target.value);
                      if (regNumberError) setRegNumberError("");
                    }}
                    placeholder="e.g. U92100MH2018PTC312456, LLP-12345, or UDYAM-MH-01-0012345"
                    style={{ width: "100%", height: "42px", borderColor: regNumberError ? "var(--danger, #C53030)" : undefined }}
                  />
                  <div style={{ fontSize: "11px", color: "#777970", marginTop: "4px" }}>
                    CIN must be 21 characters; LLPIN or Udyam must be 6-30 alphanumeric characters.
                  </div>
                  {regNumberError && (
                    <div style={{ color: "var(--danger, #C53030)", fontSize: "12px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <AlertCircle size={13} style={{ flexShrink: 0 }} />
                      <span>{regNumberError}</span>
                    </div>
                  )}
                </div>

                {/* 2. Business registration document upload */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Business registration document upload *
                    </label>
                    <span style={{ fontSize: "10.5px", fontWeight: "600", color: "#8A6B2E", backgroundColor: "#F3EFE6", border: "1px solid #E8E2D4", borderRadius: "10px", padding: "1px 7px" }}>
                      Required
                    </span>
                  </div>

                  {businessDocUrl ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#F4F8F4", border: "1px solid #C4DFC7", borderRadius: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                        <CheckCircle2 size={16} color="#2B5E3B" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#1F4228", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {businessDocName || "Registration Document"}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                        <a href={businessDocUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#8A6B2E", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                          <ExternalLink size={12} /> View
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setBusinessDocUrl("");
                            setBusinessDocName("");
                          }}
                          style={{ background: "none", border: "none", color: "#9B1C1C", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : isUploadingBusinessDoc ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", border: "1px dashed #E8E2D4", borderRadius: "6px", color: "#8A6B2E", fontSize: "13px" }}>
                      <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                      <span>Uploading document...</span>
                    </div>
                  ) : (
                    <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px", border: businessDocError ? "1px dashed var(--danger, #C53030)" : "1px dashed #D0C9BA", borderRadius: "6px", cursor: "pointer", background: "#FAF9F7", transition: "border-color 0.15s" }}>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        style={{ display: "none" }}
                        onChange={(e) => handleFileUpload(e, setBusinessDocUrl, setBusinessDocName, setBusinessDocError, setIsUploadingBusinessDoc)}
                      />
                      <Upload size={18} color="#8A6B2E" style={{ marginBottom: "4px" }} />
                      <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#2B2D2A" }}>
                        Upload Incorporation / Registration Certificate
                      </span>
                      <span style={{ fontSize: "11px", color: "#777970" }}>PDF, JPG, PNG (Max 5 MB)</span>
                    </label>
                  )}
                  {businessDocError && (
                    <div style={{ color: "var(--danger, #C53030)", fontSize: "12px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <AlertCircle size={13} style={{ flexShrink: 0 }} />
                      <span>{businessDocError}</span>
                    </div>
                  )}
                </div>

                {/* 3. GSTIN + Certificate OR Exemption */}
                <div style={{ border: "1px solid #E8E2D4", borderRadius: "8px", padding: "14px", background: "#FCFBF9" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#2B2D2A", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Goods & Services Tax (GST)
                    </span>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", cursor: "pointer", color: "#4A483F", userSelect: "none" }}>
                      <input
                        type="checkbox"
                        checked={isGstExempt}
                        onChange={(e) => {
                          setIsGstExempt(e.target.checked);
                          if (gstError) setGstError("");
                        }}
                        style={{ width: "15px", height: "15px", accentColor: "#8A6B2E", cursor: "pointer" }}
                      />
                      <span style={{ fontWeight: 600 }}>Not GST registered</span>
                    </label>
                  </div>

                  {!isGstExempt ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: "600", color: "#5A584F", marginBottom: "4px", textTransform: "uppercase" }}>
                          GSTIN (15 characters) *
                        </label>
                        <input
                          type="text"
                          autoComplete="off"
                          value={gstNumber}
                          onChange={(e) => {
                            setGstNumber(e.target.value.toUpperCase());
                            if (gstError) setGstError("");
                          }}
                          placeholder="e.g. 27AABCZ1234F1Z5"
                          maxLength={15}
                          style={{ width: "100%", height: "40px" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: "600", color: "#5A584F", marginBottom: "4px", textTransform: "uppercase" }}>
                          GST Certificate Upload *
                        </label>
                        {gstCertUrl ? (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#F4F8F4", border: "1px solid #C4DFC7", borderRadius: "6px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                              <CheckCircle2 size={15} color="#2B5E3B" style={{ flexShrink: 0 }} />
                              <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#1F4228", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {gstCertName || "GST Certificate"}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                              <a href={gstCertUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#8A6B2E", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                <ExternalLink size={12} /> View
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  setGstCertUrl("");
                                  setGstCertName("");
                                }}
                                style={{ background: "none", border: "none", color: "#9B1C1C", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : isUploadingGstCert ? (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", border: "1px dashed #E8E2D4", borderRadius: "6px", color: "#8A6B2E", fontSize: "12.5px" }}>
                            <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                            <span>Uploading certificate...</span>
                          </div>
                        ) : (
                          <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", border: "1px dashed #D0C9BA", borderRadius: "6px", cursor: "pointer", background: "#FAF9F7" }}>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                              style={{ display: "none" }}
                              onChange={(e) => handleFileUpload(e, setGstCertUrl, setGstCertName, setGstError, setIsUploadingGstCert)}
                            />
                            <Upload size={16} color="#8A6B2E" />
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "#2B2D2A" }}>Upload GST Certificate (PDF, JPG, PNG max 5 MB)</span>
                          </label>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: "600", color: "#5A584F", marginBottom: "4px", textTransform: "uppercase" }}>
                        Reason for GST Exemption *
                      </label>
                      <input
                        type="text"
                        value={gstExemptionReason}
                        onChange={(e) => {
                          setGstExemptionReason(e.target.value);
                          if (gstError) setGstError("");
                        }}
                        placeholder="e.g. Annual aggregate turnover is below ₹20L exemption threshold"
                        style={{ width: "100%", height: "40px" }}
                      />
                    </div>
                  )}

                  {gstError && (
                    <div style={{ color: "var(--danger, #C53030)", fontSize: "12px", marginTop: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <AlertCircle size={13} style={{ flexShrink: 0 }} />
                      <span>{gstError}</span>
                    </div>
                  )}
                </div>

                {/* 4. Professional / Industry Proof */}
                <div style={{ border: "1px solid #E8E2D4", borderRadius: "8px", padding: "14px", background: "#FCFBF9" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Professional / Industry Proof *
                    </label>
                    <span style={{ fontSize: "10.5px", fontWeight: "600", color: "#8A6B2E", backgroundColor: "#F3EFE6", border: "1px solid #E8E2D4", borderRadius: "10px", padding: "1px 7px" }}>
                      Required (At least one)
                    </span>
                  </div>
                  <p style={{ fontSize: "11.5px", color: "#5A584F", margin: "0 0 10px 0" }}>
                    Provide at least one: a studio/portfolio website URL or an uploaded trade/industry proof document.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#777970", marginBottom: "4px", textTransform: "uppercase" }}>
                        Website / Portfolio URL
                      </label>
                      <input
                        type="url"
                        value={professionalProofUrl || website}
                        onChange={(e) => {
                          setProfessionalProofUrl(e.target.value);
                          if (professionalProofError) setProfessionalProofError("");
                        }}
                        placeholder="https://yourstudio.com or IMDb / Vimeo profile"
                        style={{ width: "100%", height: "38px" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#777970", marginBottom: "4px", textTransform: "uppercase" }}>
                        OR Upload Proof Document (Contract, Trade Association, License)
                      </label>
                      {professionalProofDocUrl ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#F4F8F4", border: "1px solid #C4DFC7", borderRadius: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                            <CheckCircle2 size={15} color="#2B5E3B" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#1F4228", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {professionalProofDocName || "Professional Proof Document"}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                            <a href={professionalProofDocUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#8A6B2E", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                              <ExternalLink size={12} /> View
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                setProfessionalProofDocUrl("");
                                setProfessionalProofDocName("");
                              }}
                              style={{ background: "none", border: "none", color: "#9B1C1C", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : isUploadingProfProof ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", border: "1px dashed #E8E2D4", borderRadius: "6px", color: "#8A6B2E", fontSize: "12px" }}>
                          <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                          <span>Uploading proof document...</span>
                        </div>
                      ) : (
                        <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", border: "1px dashed #D0C9BA", borderRadius: "6px", cursor: "pointer", background: "#FAF9F7" }}>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                            style={{ display: "none" }}
                            onChange={(e) => handleFileUpload(e, setProfessionalProofDocUrl, setProfessionalProofDocName, setProfessionalProofError, setIsUploadingProfProof)}
                          />
                          <Upload size={15} color="#8A6B2E" />
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "#2B2D2A" }}>Upload Industry Proof (PDF, JPG, PNG max 5 MB)</span>
                        </label>
                      )}
                    </div>
                  </div>

                  {professionalProofError && (
                    <div style={{ color: "var(--danger, #C53030)", fontSize: "12px", marginTop: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <AlertCircle size={13} style={{ flexShrink: 0 }} />
                      <span>{professionalProofError}</span>
                    </div>
                  )}
                </div>

                {/* 5. Other Evidence (Optional, up to 2 files) */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary, #292C29)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Other evidence (Optional, up to 2 files)
                    </label>
                    <span style={{ fontSize: "11px", color: "#777970" }}>
                      {otherEvidenceList.length} / 2 uploaded
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {otherEvidenceList.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#FAF9F7", border: "1px solid #E8E2D4", borderRadius: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                          <FileCheck size={14} color="#8A6B2E" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "#2B2D2A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {item.name || `Evidence ${idx + 1}`}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11.5px", color: "#8A6B2E", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                            <ExternalLink size={11} /> View
                          </a>
                          <button
                            type="button"
                            onClick={() => setOtherEvidenceList((prev) => prev.filter((_, i) => i !== idx))}
                            style={{ background: "none", border: "none", color: "#9B1C1C", fontSize: "11.5px", cursor: "pointer" }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}

                    {otherEvidenceList.length < 2 && (
                      isUploadingOther ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", border: "1px dashed #E8E2D4", borderRadius: "6px", color: "#8A6B2E", fontSize: "12px" }}>
                          <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                          <span>Uploading additional evidence...</span>
                        </div>
                      ) : (
                        <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", border: "1px dashed #D0C9BA", borderRadius: "6px", cursor: "pointer", background: "#FAF9F7" }}>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                            style={{ display: "none" }}
                            onChange={handleAddOtherEvidence}
                          />
                          <Upload size={14} color="#8A6B2E" />
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "#4A483F" }}>
                            + Add Evidence File (PDF, JPG, PNG max 5 MB)
                          </span>
                        </label>
                      )
                    )}
                  </div>

                  {otherEvidenceError && (
                    <div style={{ color: "var(--danger, #C53030)", fontSize: "12px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <AlertCircle size={13} style={{ flexShrink: 0 }} />
                      <span>{otherEvidenceError}</span>
                    </div>
                  )}
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
                    fontSize: "12px",
                    color: "#5A584F",
                  }}
                >
                  <ShieldCheck size={18} style={{ color: "#8A6B2E", flexShrink: 0 }} />
                  <span>
                    Accreditation documents are stored securely and reviewed exclusively by authorized Vismaya compliance officers.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingBusinessDoc || isUploadingGstCert || isUploadingProfProof || isUploadingOther}
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", height: "44px", marginTop: "6px" }}
                >
                  <span>{isSubmitting ? "Submitting Registration..." : "Complete Registration & Enter Dashboard"}</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            )}
              </>
            )}

            {/* Bottom link: Sign In */}
            {!isRegistrationComplete && (
              <div style={{ textAlign: "center", marginTop: "22px", fontSize: "13px", color: "var(--text-secondary, #777970)" }}>
                Already have an account?{" "}
                <Link href="/login" style={{ color: "var(--gold)", fontWeight: "600", textDecoration: "none" }}>
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

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
