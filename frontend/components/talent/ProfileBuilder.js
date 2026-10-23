"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  User,
  Image as ImageIcon,
  Briefcase,
  ShieldCheck,
  ShieldAlert,
  Check,
  ChevronRight,
  ChevronLeft,
  Upload,
  Plus,
  Trash2,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  Camera,
  Layers,
  Sparkles,
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import ProgressBar from "@/components/shared/ProgressBar";
import ContactVismayaButton from "@/components/shared/ContactVismayaButton";
import { validateMediaFile, optimizeCloudinaryUrl } from "@/lib/api/uploadMedia";
import { PHOTO_UPLOAD_CONFIG, validatePhotoFile } from "@/lib/config/photoUpload";
import { useTalent } from "@/lib/talent/TalentContext";

// Category options for Step 1
const CATEGORY_OPTIONS = [
  { value: "open_talent", label: "Open Talent (Actors, Models, Voice & Performing Artists)" },
  { value: "film_and_tv", label: "Film & TV Production (Direction, Crew, Technicians)" },
  { value: "voice_over", label: "Voice Over & Dubbing Artist" },
  { value: "dance_and_performing_arts", label: "Dance & Performing Arts" },
  { value: "crew_and_production", label: "Technical Crew & Production Support" },
];

const CAREER_STAGES = [
  { value: "aspiring", label: "Aspiring (0 - 1 years, Training / Fresh)" },
  { value: "emerging", label: "Emerging (1 - 3 years, Independent Projects)" },
  { value: "experienced", label: "Experienced (3 - 5 years, Commercial Work)" },
  { value: "mid_level", label: "Mid-Level Professional (5 - 10 years)" },
  { value: "veteran", label: "Veteran / Master (10+ years)" },
];

const EXPERIENCE_RANGES = [
  { value: "<1", label: "Under 1 year" },
  { value: "1-3", label: "1 to 3 years" },
  { value: "3-5", label: "3 to 5 years" },
  { value: "5-10", label: "5 to 10 years" },
  { value: "10+", label: "10+ years" },
];

const AVAILABILITY_STATUSES = [
  { value: "available_now", label: "Available Now (Immediate Shoots)" },
  { value: "open_to_opportunities", label: "Open to Live Opportunities" },
  { value: "available_from", label: "Available From Scheduled Date" },
  { value: "occupied", label: "Currently Occupied with Project" },
  { value: "unavailable", label: "Temporarily Unavailable" },
];

const PROJECT_TYPES = [
  "Feature Film",
  "Short Film",
  "TV Series",
  "Web Series",
  "Commercial / Ad Film",
  "Theatre / Stage Play",
  "Music Video",
  "Documentary",
  "Voice / Dubbing Project",
  "Fashion / Print Campaign",
  "Other",
];

const MEDIA_CATEGORIES = [
  { value: "headshot", label: "Headshot (Commercial)" },
  { value: "full_body", label: "Full Body / Comp Card" },
  { value: "showreel", label: "Showreel / Monologue Video" },
  { value: "audition", label: "Audition Self-Tape" },
  { value: "production_still", label: "Production Still / On Set" },
];

function calculateClientAge(dobStr) {
  if (!dobStr) return null;
  const d = new Date(dobStr);
  if (isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  const ageDt = new Date(diffMs);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
}

export default function ProfileBuilder({ onFinish }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");
  const viewParam = searchParams.get("view");

  const {
    profile,
    updateProfile,
    updateProfilePhoto,
    removeProfilePhoto,
    addCredit,
    deleteCredit,
    portfolio,
    addMedia,
    deleteMedia,
    refreshPortfolio,
    refreshProfile,
    addToast,
  } = useTalent();

  // Active step: 1, 2, 3, 4, or "complete"
  const [currentStep, setCurrentStep] = useState(1);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Sync with URL query param ?step=
  useEffect(() => {
    if (viewParam === "preview") {
      setIsPreviewMode(true);
      return;
    }
    setIsPreviewMode(false);

    if (stepParam === "complete") {
      setCurrentStep("complete");
    } else if (["1", "2", "3", "4"].includes(stepParam)) {
      setCurrentStep(parseInt(stepParam, 10));
    }
  }, [stepParam, viewParam]);

  // Handle URL step navigation
  const navigateToStep = (step) => {
    const nextStep = step.toString();
    router.push(`?step=${nextStep}`, { scroll: false });
    setCurrentStep(step);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Form State initialized strictly from real profile
  const [formState, setFormState] = useState({
    // Step 1: Professional Details
    category: profile.category || "open_talent",
    primaryProfession: profile.primaryProfession || profile.profession || "",
    secondaryProfessions: Array.isArray(profile.secondaryProfessions) ? [...profile.secondaryProfessions] : [],
    headline: profile.headline || "",
    stageName: profile.stageName || profile.personal?.stageName || "",
    specializations: Array.isArray(profile.specializations) ? [...profile.specializations] : [],
    careerStage: profile.careerStage || "aspiring",
    experienceRange: profile.experienceRange || "<1",
    bio: profile.bio || profile.personal?.bio || "",
    currentCity: profile.currentCity || profile.personal?.city || profile.city || "",
    currentState: profile.currentState || profile.personal?.state || profile.state || "",
    workingCities: Array.isArray(profile.workingCities) ? [...profile.workingCities] : [],
    availabilityStatus: profile.availability?.status || "available_now",
    willingToTravel: profile.willingToTravel !== undefined ? Boolean(profile.willingToTravel) : true,
    willingToRelocate: Boolean(profile.willingToRelocate),
    openToWorkAnywhere: Boolean(profile.openToWorkAnywhere),
    skills: Array.isArray(profile.skills) ? [...profile.skills] : [],
    languages: Array.isArray(profile.languages) ? [...profile.languages] : [],

    // Step 4: Personal Info
    dob: profile.dob || profile.personal?.dob || "",
    gender: profile.gender || profile.personal?.gender || "prefer_not_to_say",
    nationality: profile.nationality || "Indian",
    heightCm: profile.physicalAttributes?.heightCm || (profile.physical?.height ? parseInt(profile.physical.height, 10) : "") || "",
    weightKg: profile.physicalAttributes?.weightKg || (profile.physical?.weight ? parseInt(profile.physical.weight, 10) : "") || "",
    skinTone: profile.physicalAttributes?.skinTone || profile.physical?.skinTone || "",
    eyeColor: profile.physicalAttributes?.eyeColor || profile.physical?.eyeColor || "",
    hairColor: profile.physicalAttributes?.hairColor || profile.physical?.hairColor || "",
    bodyType: profile.physicalAttributes?.bodyType || profile.physical?.bodyType || "",
    chest: profile.physical?.chest || "",
    waist: profile.physical?.waist || "",
    hips: profile.physical?.hips || "",

    // Minor / Guardian Details
    guardianName: profile.guardianDetails?.guardianName || profile.guardianConsent?.guardianName || "",
    guardianRelationship: profile.guardianDetails?.relationship || profile.guardianConsent?.relationship || profile.guardianConsent?.relation || "",
    guardianPhone: profile.guardianDetails?.contactNumber || profile.guardianDetails?.phone || profile.guardianConsent?.guardianPhone || profile.guardianConsent?.phone || "",
    guardianEmail: profile.guardianDetails?.guardianEmail || profile.guardianConsent?.guardianEmail || profile.guardianConsent?.email || "",
    guardianConsentGiven: Boolean(profile.guardianDetails?.consentGiven || profile.guardianConsent?.consentGiven),
  });

  // Sync formState whenever profile updates from backend
  useEffect(() => {
    setFormState({
      category: profile.category || "open_talent",
      primaryProfession: profile.primaryProfession || profile.profession || "",
      secondaryProfessions: Array.isArray(profile.secondaryProfessions) ? [...profile.secondaryProfessions] : [],
      headline: profile.headline || "",
      stageName: profile.stageName || profile.personal?.stageName || "",
      specializations: Array.isArray(profile.specializations) ? [...profile.specializations] : [],
      careerStage: profile.careerStage || "aspiring",
      experienceRange: profile.experienceRange || "<1",
      bio: profile.bio || profile.personal?.bio || "",
      currentCity: profile.currentCity || profile.personal?.city || profile.city || "",
      currentState: profile.currentState || profile.personal?.state || profile.state || "",
      workingCities: Array.isArray(profile.workingCities) ? [...profile.workingCities] : [],
      availabilityStatus: profile.availability?.status || "available_now",
      willingToTravel: profile.willingToTravel !== undefined ? Boolean(profile.willingToTravel) : true,
      willingToRelocate: Boolean(profile.willingToRelocate),
      openToWorkAnywhere: Boolean(profile.openToWorkAnywhere),
      skills: Array.isArray(profile.skills) ? [...profile.skills] : [],
      languages: Array.isArray(profile.languages) ? [...profile.languages] : [],

      dob: profile.dob || profile.personal?.dob || "",
      gender: profile.gender || profile.personal?.gender || "prefer_not_to_say",
      nationality: profile.nationality || "Indian",
      heightCm: profile.physicalAttributes?.heightCm || (profile.physical?.height ? parseInt(profile.physical.height, 10) : "") || "",
      weightKg: profile.physicalAttributes?.weightKg || (profile.physical?.weight ? parseInt(profile.physical.weight, 10) : "") || "",
      skinTone: profile.physicalAttributes?.skinTone || profile.physical?.skinTone || "",
      eyeColor: profile.physicalAttributes?.eyeColor || profile.physical?.eyeColor || "",
      hairColor: profile.physicalAttributes?.hairColor || profile.physical?.hairColor || "",
      bodyType: profile.physicalAttributes?.bodyType || profile.physical?.bodyType || "",
      chest: profile.physical?.chest || "",
      waist: profile.physical?.waist || "",
      hips: profile.physical?.hips || "",

      guardianName: profile.guardianDetails?.guardianName || profile.guardianConsent?.guardianName || "",
      guardianRelationship: profile.guardianDetails?.relationship || profile.guardianConsent?.relationship || profile.guardianConsent?.relation || "",
      guardianPhone: profile.guardianDetails?.contactNumber || profile.guardianDetails?.phone || profile.guardianConsent?.guardianPhone || profile.guardianConsent?.phone || "",
      guardianEmail: profile.guardianDetails?.guardianEmail || profile.guardianConsent?.guardianEmail || profile.guardianConsent?.email || "",
      guardianConsentGiven: Boolean(profile.guardianDetails?.consentGiven || profile.guardianConsent?.consentGiven),
    });
  }, [profile]);

  // Compute live age from DOB
  const computedAge = calculateClientAge(formState.dob) ?? (profile.dob ? calculateClientAge(profile.dob) : null);
  const isMinor = computedAge !== null ? computedAge < 18 : Boolean(profile.isUnder18);

  // Validation Errors & Saving State
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Tag inputs state
  const [newSecProf, setNewSecProf] = useState("");
  const [newSpec, setNewSpec] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [newLang, setNewLang] = useState("");

  // Step 2 Upload State
  const photoInputRef = useRef(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");

  const [portfolioTitle, setPortfolioTitle] = useState("");
  const [portfolioCategory, setPortfolioCategory] = useState("headshot");
  const [portfolioVisibility, setPortfolioVisibility] = useState("public");
  const [portfolioFile, setPortfolioFile] = useState(null);
  const [isUploadingPortfolio, setIsUploadingPortfolio] = useState(false);
  const [portfolioError, setPortfolioError] = useState("");
  const portfolioInputRef = useRef(null);

  // Step 3 Credit Input State
  const [newCreditTitle, setNewCreditTitle] = useState("");
  const [newCreditRole, setNewCreditRole] = useState("");
  const [newCreditType, setNewCreditType] = useState("Feature Film");
  const [newCreditYear, setNewCreditYear] = useState(new Date().getFullYear().toString());
  const [newCreditLink, setNewCreditLink] = useState("");
  const [isAddingCredit, setIsAddingCredit] = useState(false);
  const [creditError, setCreditError] = useState("");

  // Stepper completion status (Authoritative from backend, with local fallback)
  const stepsCompletion = profile.stepsCompletion || {
    step1: Boolean(
      (profile.category && (profile.primaryProfession || profile.profession)) &&
      (profile.bio && profile.bio.trim().length >= 200) &&
      (profile.currentCity || profile.city) &&
      (profile.skills && profile.skills.length > 0) &&
      (profile.languages && profile.languages.length > 0)
    ),
    step2: Boolean(profile.profilePhoto && portfolio.length > 0),
    step3: Boolean(profile.credits && profile.credits.length > 0),
    step4: Boolean(
      profile.physicalAttributes?.heightCm &&
      (!isMinor || (profile.guardianDetails?.guardianName && profile.guardianDetails?.contactNumber && profile.guardianDetails?.consentGiven))
    ),
  };

  const profileStrength = Math.min(100, Math.max(0, Number(profile.profileCompletionPercentage || 0)));

  // Field change handler
  const handleChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Tag list helpers
  const addTag = (field, value, maxCount = 50) => {
    if (!value || !value.trim()) return;
    const currentList = formState[field] || [];
    if (currentList.length >= maxCount) {
      addToast({ type: "warning", title: "Limit Reached", message: `Maximum ${maxCount} tags permitted.` });
      return;
    }
    if (!currentList.includes(value.trim())) {
      setFormState((prev) => ({ ...prev, [field]: [...prev[field], value.trim()] }));
    }
  };

  const removeTag = (field, itemToRemove) => {
    setFormState((prev) => ({
      ...prev,
      [field]: (prev[field] || []).filter((item) => item !== itemToRemove),
    }));
  };

  // Step 1 Save Action
  const handleSaveStep1 = async (advance = true) => {
    const errs = {};
    if (!formState.primaryProfession?.trim()) errs.primaryProfession = "Primary profession is required.";
    const bioTrimmed = formState.bio?.trim() || "";
    if (!bioTrimmed) {
      errs.bio = "Professional bio is required (200 - 1000 characters).";
    } else if (bioTrimmed.length < 200) {
      errs.bio = `Bio is too short (${bioTrimmed.length}/200 characters). Must be at least 200 characters.`;
    } else if (bioTrimmed.length > 1000) {
      errs.bio = `Bio exceeds 1000 characters (${bioTrimmed.length}/1000).`;
    }
    if (!formState.currentCity?.trim()) errs.currentCity = "Primary city is required.";
    if (!formState.skills || formState.skills.length === 0) errs.skills = "Add at least one performing skill.";
    if (!formState.languages || formState.languages.length === 0) errs.languages = "Add at least one language.";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      addToast({ type: "danger", title: "Missing Required Fields", message: "Please resolve the marked errors on Step 1." });
      return;
    }

    setIsSaving(true);
    setErrors({});
    try {
      const payload = {
        category: formState.category,
        primaryProfession: formState.primaryProfession.trim(),
        secondaryProfessions: formState.secondaryProfessions,
        headline: formState.headline.trim(),
        stageName: formState.stageName.trim(),
        specializations: formState.specializations,
        careerStage: formState.careerStage,
        experienceRange: formState.experienceRange,
        bio: bioTrimmed,
        currentCity: formState.currentCity.trim(),
        currentState: formState.currentState.trim(),
        workingCities: formState.workingCities,
        availability: { status: formState.availabilityStatus },
        willingToTravel: formState.willingToTravel,
        willingToRelocate: formState.willingToRelocate,
        openToWorkAnywhere: formState.openToWorkAnywhere,
        skills: formState.skills,
        languages: formState.languages,
      };

      await updateProfile(payload);
      if (advance) {
        navigateToStep(2);
      }
    } catch (err) {
      // Error handled by TalentContext toast
    } finally {
      setIsSaving(false);
    }
  };

  // Step 2: Photo Selection & Save
  const handlePhotoSelect = (e) => {
    setPhotoError("");
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const basicCheck = validatePhotoFile(file);
    if (!basicCheck.valid) {
      setPhotoError(basicCheck.error);
      if (photoInputRef.current) photoInputRef.current.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const dimCheck = validatePhotoFile(file, img.naturalWidth, img.naturalHeight);
      if (!dimCheck.valid) {
        URL.revokeObjectURL(objectUrl);
        setPhotoError(dimCheck.error);
        if (photoInputRef.current) photoInputRef.current.value = "";
        return;
      }
      setSelectedPhotoFile(file);
      setPhotoPreview(objectUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setPhotoError("Failed to decode image file. Please choose a valid image.");
      if (photoInputRef.current) photoInputRef.current.value = "";
    };
    img.src = objectUrl;
  };

  const handleSavePhoto = async () => {
    if (!selectedPhotoFile) return;
    setIsUploadingPhoto(true);
    setPhotoError("");
    try {
      await updateProfilePhoto(selectedPhotoFile);
      setSelectedPhotoFile(null);
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
        setPhotoPreview(null);
      }
    } catch (err) {
      setPhotoError(err.message || "Failed to update profile photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm("Are you sure you want to remove your profile photo?")) return;
    setIsUploadingPhoto(true);
    try {
      await removeProfilePhoto();
      setSelectedPhotoFile(null);
      setPhotoPreview(null);
    } catch (err) {
      setPhotoError(err.message || "Failed to remove photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Step 2: Upload Portfolio Media Item
  const handleUploadPortfolioItem = async (e) => {
    e.preventDefault();
    setPortfolioError("");
    if (!portfolioFile) {
      setPortfolioError("Please choose a file to upload.");
      return;
    }
    if (!portfolioTitle.trim()) {
      setPortfolioError("Please give this media item a title.");
      return;
    }

    setIsUploadingPortfolio(true);
    try {
      await addMedia({
        file: portfolioFile,
        title: portfolioTitle.trim(),
        category: portfolioCategory,
        visibility: portfolioVisibility,
        type: portfolioCategory === "showreel" || portfolioCategory === "audition" ? "Showreel" : "Headshot",
      });

      // Reset upload card fields
      setPortfolioTitle("");
      setPortfolioFile(null);
      if (portfolioInputRef.current) portfolioInputRef.current.value = "";
    } catch (err) {
      setPortfolioError(err.message || "Failed to upload portfolio item.");
    } finally {
      setIsUploadingPortfolio(false);
    }
  };

  // Step 3: Add Credit
  const handleAddCredit = async (e) => {
    e.preventDefault();
    setCreditError("");
    if (!newCreditTitle.trim()) {
      setCreditError("Project name is required.");
      return;
    }
    if (!newCreditRole.trim()) {
      setCreditError("Role or designation is required.");
      return;
    }

    setIsAddingCredit(true);
    try {
      await addCredit({
        projectTitle: newCreditTitle.trim(),
        roleOrDesignation: newCreditRole.trim(),
        projectType: newCreditType,
        year: newCreditYear ? parseInt(newCreditYear, 10) : undefined,
        referenceLink: newCreditLink.trim() || undefined,
      });

      // Clear input fields
      setNewCreditTitle("");
      setNewCreditRole("");
      setNewCreditLink("");
    } catch (err) {
      setCreditError(err.message || "Could not add work credit.");
    } finally {
      setIsAddingCredit(false);
    }
  };

  // Step 4: Save & Finish
  const handleSaveStep4 = async (advance = true) => {
    const errs = {};
    const h = Number(formState.heightCm);
    if (!formState.heightCm || isNaN(h) || h < 50 || h > 260) {
      errs.heightCm = "Height is required (between 50 and 260 cm).";
    }

    // Minor validation
    if (isMinor) {
      if (!formState.guardianName?.trim()) errs.guardianName = "Guardian full name is mandatory for minors.";
      if (!formState.guardianRelationship?.trim()) errs.guardianRelationship = "Relationship to artist is required.";
      if (!formState.guardianPhone?.trim() || !/^[0-9+\s-]{10,15}$/.test(formState.guardianPhone.trim())) {
        errs.guardianPhone = "Valid 10-15 digit guardian mobile is required.";
      }
      if (!formState.guardianEmail?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.guardianEmail.trim())) {
        errs.guardianEmail = "Valid guardian email address is required.";
      }
      if (!formState.guardianConsentGiven) {
        errs.guardianConsentGiven = "Legal guardian consent checkbox must be accepted.";
      }
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      addToast({ type: "danger", title: "Incomplete Personal Info", message: "Please fill in all mandatory private fields." });
      return;
    }

    setIsSaving(true);
    setErrors({});
    try {
      const payload = {
        dob: formState.dob ? new Date(formState.dob) : undefined,
        gender: formState.gender,
        nationality: formState.nationality || "Indian",
        physicalAttributes: {
          heightCm: h,
          weightKg: formState.weightKg ? Number(formState.weightKg) : undefined,
          skinTone: formState.skinTone?.trim() || undefined,
          eyeColor: formState.eyeColor?.trim() || undefined,
          hairColor: formState.hairColor?.trim() || undefined,
          bodyType: formState.bodyType || undefined,
        },
      };

      if (isMinor) {
        payload.guardianDetails = {
          guardianName: formState.guardianName.trim(),
          relationship: formState.guardianRelationship.trim(),
          contactNumber: formState.guardianPhone.trim(),
          guardianEmail: formState.guardianEmail.trim(),
          consentGiven: Boolean(formState.guardianConsentGiven),
        };
      }

      await updateProfile(payload);
      addToast({
        type: "success",
        title: "Profile Saved",
        message: "Your profile has been saved successfully!",
      });
      if (advance) {
        if (onFinish) {
          onFinish();
        } else {
          router.push("/talent/profile");
        }
      }
    } catch (err) {
      // Error handled by TalentContext toast
    } finally {
      setIsSaving(false);
    }
  };

  // Step names config for Stepper with short "what is missing" hints
  const stepsList = [
    {
      num: 1,
      name: "Professional Details",
      key: "step1",
      done: stepsCompletion.step1,
      missingHint: "Needs craft, bio & city"
    },
    {
      num: 2,
      name: "Portfolio & Media",
      key: "step2",
      done: stepsCompletion.step2,
      missingHint: (!profile.profilePhoto && !profile.avatar) ? "Needs photo & 1 media item" : "Needs 1 portfolio item"
    },
    {
      num: 3,
      name: "Work Experience",
      key: "step3",
      done: stepsCompletion.step3,
      missingHint: "Needs at least 1 credit"
    },
    {
      num: 4,
      name: "Personal Info",
      key: "step4",
      done: stepsCompletion.step4,
      missingHint: isMinor ? "Needs height & guardian consent" : "Needs height measurement"
    },
  ];

  // Common styles adhering strictly to cream/gold-brown/charcoal tokens
  const cardStyle = {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E8E2D4",
    borderRadius: "16px",
    padding: "24px 28px",
    boxShadow: "0 2px 8px rgba(43, 45, 42, 0.03)",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  };

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    color: "#2B2D2A",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };

  const inputStyle = (hasError) => ({
    width: "100%",
    height: "42px",
    padding: "0 14px",
    borderRadius: "8px",
    border: `1px solid ${hasError ? "#B42318" : "#E8E2D4"}`,
    backgroundColor: "#FFFFFF",
    color: "#2B2D2A",
    fontSize: "14px",
    fontFamily: "var(--font-body), 'Inter', sans-serif",
    outline: "none",
    boxSizing: "border-box",
  });

  const errorTextStyle = {
    fontSize: "12px",
    color: "#B42318",
    marginTop: "4px",
    display: "block",
    fontWeight: "500",
  };

  return (
    <div className="profile-builder-container" style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Top Header Card with Stepper and Strength Chip */}
      <div
        className="profile-stepper-header-card"
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E2D4",
          borderRadius: "16px",
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#8A6B2E", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Artist Profile Builder
            </span>
            <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2B2D2A", margin: "2px 0 0 0", fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif" }}>
              {currentStep === 1 && "Step 1: Professional Identity & Craft"}
              {currentStep === 2 && "Step 2: Portfolio Media & Profile Photo"}
              {currentStep === 3 && "Step 3: Work Experience & Credits"}
              {currentStep === 4 && "Step 4: Confidential Personal Info"}
              {currentStep === "complete" && "Profile Setup Complete!"}
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: "700",
                padding: "6px 14px",
                borderRadius: "999px",
                backgroundColor: profileStrength >= 100 ? "#ECFDF3" : profileStrength >= 60 ? "#FBF7ED" : "#FEF3F2",
                color: profileStrength >= 100 ? "#027A48" : "#8A6B2E",
                border: `1px solid ${profileStrength >= 100 ? "#A6F4C5" : "#E8E2D4"}`,
                letterSpacing: "0.02em",
              }}
            >
              Profile strength {profileStrength}%
            </span>

            {Boolean(profile.stepsCompletion?.step1 || profile.primaryProfession || profile.profession) && (
              <button
                type="button"
                onClick={() => {
                  if (onFinish) onFinish();
                  else router.push("/talent/profile");
                }}
                className="btn-secondary"
                style={{ padding: "8px 16px", fontSize: "13px", height: "36px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Eye size={14} />
                <span>View Profile</span>
              </button>
            )}

            {currentStep !== "complete" && (
              <button
                type="button"
                onClick={() => handleSaveStep1(false)}
                disabled={isSaving}
                className="btn-secondary"
                style={{ padding: "8px 16px", fontSize: "13px", height: "36px" }}
              >
                <Save size={14} />
                <span>Save Draft</span>
              </button>
            )}
          </div>
        </div>

        {/* 4-Step Stepper Tabs */}
        <nav
          aria-label="Profile Builder Stepper"
          className="profile-stepper-nav"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "10px",
            borderTop: "1px solid #F3EFE6",
            paddingTop: "14px",
          }}
        >
          {stepsList.map((st) => {
            const isActive = currentStep === st.num;
            const isDone = st.done;

            return (
              <button
                key={st.num}
                type="button"
                onClick={() => navigateToStep(st.num)}
                title={isDone ? `${st.name}: Complete` : `${st.name}: ${st.missingHint}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: `1px solid ${isActive ? "#8A6B2E" : isDone ? "#D0D5DD" : "#E8E2D4"}`,
                  backgroundColor: isActive ? "#FBF7ED" : "#FFFFFF",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.16s ease",
                }}
                className={`stepper-pill ${isActive ? "active" : ""}`}
              >
                <span
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "700",
                    backgroundColor: isDone ? "#027A48" : isActive ? "#8A6B2E" : "#F3EFE6",
                    color: isDone || isActive ? "#FFFFFF" : "#5A584F",
                    flexShrink: 0,
                  }}
                >
                  {isDone ? <Check size={14} strokeWidth={3} /> : st.num}
                </span>

                <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span style={{ fontSize: "11px", color: isActive ? "#8A6B2E" : "#7A7870", fontWeight: "600" }}>
                    Step {st.num}
                  </span>
                  <span
                    style={{
                      fontSize: "12.5px",
                      fontWeight: isActive ? "700" : "600",
                      color: isActive ? "#2B2D2A" : "#5A584F",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {st.name}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      color: isDone ? "#027A48" : "#8A6B2E",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      marginTop: "1px",
                    }}
                  >
                    {isDone ? "Completed" : st.missingHint}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* SCREEN 1: PROFESSIONAL DETAILS                                           */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="step-screen-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Card 1: Professional Identity */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #F3EFE6", paddingBottom: "12px" }}>
              <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "#F3EFE6", color: "#8A6B2E" }}>
                <User size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#2B2D2A", margin: 0 }}>
                  Professional Identity
                </h3>
                <span style={{ fontSize: "12px", color: "#5A584F" }}>Category, craft, headline and professional stage name</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="responsive-two-col">
              <div>
                <label style={labelStyle}>Talent Category *</label>
                <select
                  value={formState.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  style={inputStyle(false)}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Primary Profession *</label>
                <input
                  type="text"
                  placeholder="e.g. Actor, Model, Voice Over Artist"
                  value={formState.primaryProfession}
                  onChange={(e) => handleChange("primaryProfession", e.target.value)}
                  style={inputStyle(errors.primaryProfession)}
                />
                {errors.primaryProfession && <span style={errorTextStyle}>{errors.primaryProfession}</span>}
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Secondary Professions (Max 3)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                  {formState.secondaryProfessions.map((sec, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        backgroundColor: "#F3EFE6",
                        border: "1px solid #E8E2D4",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        color: "#2B2D2A",
                      }}
                    >
                      {sec}
                      <button
                        type="button"
                        onClick={() => removeTag("secondaryProfessions", sec)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#7A7870", display: "flex", padding: 0 }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {formState.secondaryProfessions.length < 3 && (
                  <div style={{ display: "flex", gap: "8px", maxWidth: "380px" }}>
                    <input
                      type="text"
                      placeholder="Add secondary craft (e.g. Model, Dancer)"
                      value={newSecProf}
                      onChange={(e) => setNewSecProf(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag("secondaryProfessions", newSecProf, 3);
                          setNewSecProf("");
                        }
                      }}
                      style={inputStyle(false)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addTag("secondaryProfessions", newSecProf, 3);
                        setNewSecProf("");
                      }}
                      className="btn-secondary"
                      style={{ padding: "0 14px", height: "42px", flexShrink: 0 }}
                    >
                      <Plus size={15} /> Add
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Professional Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Method Actor | Theatre Artist | Commercial Model"
                  value={formState.headline}
                  onChange={(e) => handleChange("headline", e.target.value)}
                  style={inputStyle(false)}
                />
              </div>

              <div>
                <label style={labelStyle}>Professional / Stage Name</label>
                <input
                  type="text"
                  placeholder="Stage Name (optional)"
                  value={formState.stageName}
                  onChange={(e) => handleChange("stageName", e.target.value)}
                  style={inputStyle(false)}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Profession-Specific Preferences */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #F3EFE6", paddingBottom: "12px" }}>
              <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "#F3EFE6", color: "#8A6B2E" }}>
                <Sparkles size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#2B2D2A", margin: 0 }}>
                  Profession-Specific Preferences &amp; Specialization
                </h3>
                <span style={{ fontSize: "12px", color: "#5A584F" }}>Casting genre strengths and specialized abilities</span>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Specializations &amp; Craft Styles</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                {formState.specializations.map((spec, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      backgroundColor: "#F3EFE6",
                      border: "1px solid #E8E2D4",
                      fontSize: "12.5px",
                      fontWeight: "600",
                      color: "#8A6B2E",
                    }}
                  >
                    {spec}
                    <button
                      type="button"
                      onClick={() => removeTag("specializations", spec)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#7A7870", display: "flex", padding: 0 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: "8px", maxWidth: "380px" }}>
                <input
                  type="text"
                  placeholder="e.g. Method Acting, Stunts, Dialect"
                  value={newSpec}
                  onChange={(e) => setNewSpec(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag("specializations", newSpec, 10);
                      setNewSpec("");
                    }
                  }}
                  style={inputStyle(false)}
                />
                <button
                  type="button"
                  onClick={() => {
                    addTag("specializations", newSpec, 10);
                    setNewSpec("");
                  }}
                  className="btn-secondary"
                  style={{ padding: "0 14px", height: "42px", flexShrink: 0 }}
                >
                  <Plus size={15} /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: About & Experience */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #F3EFE6", paddingBottom: "12px" }}>
              <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "#F3EFE6", color: "#8A6B2E" }}>
                <Briefcase size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#2B2D2A", margin: 0 }}>
                  About &amp; Career Experience
                </h3>
                <span style={{ fontSize: "12px", color: "#5A584F" }}>Bio, career stage and professional background</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="responsive-two-col">
              <div>
                <label style={labelStyle}>Career Stage *</label>
                <select
                  value={formState.careerStage}
                  onChange={(e) => handleChange("careerStage", e.target.value)}
                  style={inputStyle(false)}
                >
                  {CAREER_STAGES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Industry Experience Range *</label>
                <select
                  value={formState.experienceRange}
                  onChange={(e) => handleChange("experienceRange", e.target.value)}
                  style={inputStyle(false)}
                >
                  {EXPERIENCE_RANGES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>
                    Professional Bio * (200 - 1000 characters)
                  </label>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: formState.bio.length < 200 || formState.bio.length > 1000 ? "#B42318" : "#027A48",
                    }}
                  >
                    {formState.bio.length} / 1000 characters {formState.bio.length < 200 ? `(need ${200 - formState.bio.length} more)` : "✓"}
                  </span>
                </div>
                <textarea
                  rows={5}
                  placeholder="Describe your artistic journey, training background, monologue strengths, notable roles, and craft aspirations. Minimum 200 characters required."
                  value={formState.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  style={{
                    ...inputStyle(errors.bio),
                    height: "auto",
                    padding: "12px 14px",
                    lineHeight: 1.5,
                  }}
                />
                {errors.bio && <span style={errorTextStyle}>{errors.bio}</span>}
              </div>
            </div>
          </div>

          {/* Card 4: Location & Availability */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #F3EFE6", paddingBottom: "12px" }}>
              <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "#F3EFE6", color: "#8A6B2E" }}>
                <Layers size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#2B2D2A", margin: 0 }}>
                  Location &amp; Availability
                </h3>
                <span style={{ fontSize: "12px", color: "#5A584F" }}>Primary base city, preferred shoot hubs and travel availability</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="responsive-two-col">
              <div>
                <label style={labelStyle}>Primary Base City *</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai, Bengaluru, Delhi"
                  value={formState.currentCity}
                  onChange={(e) => handleChange("currentCity", e.target.value)}
                  style={inputStyle(errors.currentCity)}
                />
                {errors.currentCity && <span style={errorTextStyle}>{errors.currentCity}</span>}
              </div>

              <div>
                <label style={labelStyle}>State / Province</label>
                <input
                  type="text"
                  placeholder="e.g. Maharashtra, Karnataka"
                  value={formState.currentState}
                  onChange={(e) => handleChange("currentState", e.target.value)}
                  style={inputStyle(false)}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Working Cities (Max 5)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                  {formState.workingCities.map((c, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        backgroundColor: "#F3EFE6",
                        border: "1px solid #E8E2D4",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        color: "#2B2D2A",
                      }}
                    >
                      {c}
                      <button
                        type="button"
                        onClick={() => removeTag("workingCities", c)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#7A7870", display: "flex", padding: 0 }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {formState.workingCities.length < 5 && (
                  <div style={{ display: "flex", gap: "8px", maxWidth: "380px" }}>
                    <input
                      type="text"
                      placeholder="Add city (e.g. Hyderabad, Chennai)"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag("workingCities", newCity, 5);
                          setNewCity("");
                        }
                      }}
                      style={inputStyle(false)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addTag("workingCities", newCity, 5);
                        setNewCity("");
                      }}
                      className="btn-secondary"
                      style={{ padding: "0 14px", height: "42px", flexShrink: 0 }}
                    >
                      <Plus size={15} /> Add
                    </button>
                  </div>
                )}
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Current Availability Status</label>
                <select
                  value={formState.availabilityStatus}
                  onChange={(e) => handleChange("availabilityStatus", e.target.value)}
                  style={inputStyle(false)}
                >
                  {AVAILABILITY_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Toggles */}
              <div style={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", gap: "18px", marginTop: "4px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "#2B2D2A" }}>
                  <input
                    type="checkbox"
                    checked={formState.willingToTravel}
                    onChange={(e) => handleChange("willingToTravel", e.target.checked)}
                    style={{ width: "18px", height: "18px", accentColor: "#8A6B2E" }}
                  />
                  <span>Willing to travel outstation for shoots</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "#2B2D2A" }}>
                  <input
                    type="checkbox"
                    checked={formState.willingToRelocate}
                    onChange={(e) => handleChange("willingToRelocate", e.target.checked)}
                    style={{ width: "18px", height: "18px", accentColor: "#8A6B2E" }}
                  />
                  <span>Willing to relocate for long-term production</span>
                </label>
              </div>
            </div>
          </div>

          {/* Card 5: Skills & Languages */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #F3EFE6", paddingBottom: "12px" }}>
              <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "#F3EFE6", color: "#8A6B2E" }}>
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#2B2D2A", margin: 0 }}>
                  Skills &amp; Languages
                </h3>
                <span style={{ fontSize: "12px", color: "#5A584F" }}>Performance skills, dance styles, spoken languages &amp; dialects</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Skills Tags */}
              <div>
                <label style={labelStyle}>Performing Skills &amp; Talents *</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                  {formState.skills.map((sk, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "5px 12px",
                        borderRadius: "999px",
                        backgroundColor: "#F3EFE6",
                        border: "1px solid #E8E2D4",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        color: "#8A6B2E",
                      }}
                    >
                      {sk}
                      <button
                        type="button"
                        onClick={() => removeTag("skills", sk)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#7A7870", display: "flex", padding: 0 }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "8px", maxWidth: "380px" }}>
                  <input
                    type="text"
                    placeholder="e.g. Method Acting, Classical Dance, Guitar"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag("skills", newSkill);
                        setNewSkill("");
                      }
                    }}
                    style={inputStyle(errors.skills)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      addTag("skills", newSkill);
                      setNewSkill("");
                    }}
                    className="btn-secondary"
                    style={{ padding: "0 14px", height: "42px", flexShrink: 0 }}
                  >
                    <Plus size={15} /> Add
                  </button>
                </div>
                {errors.skills && <span style={errorTextStyle}>{errors.skills}</span>}
              </div>

              {/* Languages Tags */}
              <div>
                <label style={labelStyle}>Languages &amp; Spoken Dialects *</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                  {formState.languages.map((lg, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "5px 12px",
                        borderRadius: "999px",
                        backgroundColor: "#F3EFE6",
                        border: "1px solid #E8E2D4",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        color: "#8A6B2E",
                      }}
                    >
                      {lg}
                      <button
                        type="button"
                        onClick={() => removeTag("languages", lg)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#7A7870", display: "flex", padding: 0 }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "8px", maxWidth: "380px" }}>
                  <input
                    type="text"
                    placeholder="e.g. Hindi (Native), English (Fluent)"
                    value={newLang}
                    onChange={(e) => setNewLang(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag("languages", newLang);
                        setNewLang("");
                      }
                    }}
                    style={inputStyle(errors.languages)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      addTag("languages", newLang);
                      setNewLang("");
                    }}
                    className="btn-secondary"
                    style={{ padding: "0 14px", height: "42px", flexShrink: 0 }}
                  >
                    <Plus size={15} /> Add
                  </button>
                </div>
                {errors.languages && <span style={errorTextStyle}>{errors.languages}</span>}
              </div>
            </div>
          </div>

          {/* Action Bar for Step 1 */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "6px" }}>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveStep1(true)}
              className="btn-primary"
              style={{ padding: "10px 28px", height: "44px", fontSize: "14px" }}
            >
              <span>{isSaving ? "Saving..." : "Save & Continue"}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 2: PORTFOLIO & MEDIA                                              */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="step-screen-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Main Profile Photo Card */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #F3EFE6", paddingBottom: "12px" }}>
              <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "#F3EFE6", color: "#8A6B2E" }}>
                <Camera size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#2B2D2A", margin: 0 }}>
                  Main Profile Photo
                </h3>
                <span style={{ fontSize: "12px", color: "#5A584F" }}>Mandatory headshot photo displayed across search and top navigation</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
              {/* 120px Round Avatar */}
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  border: "3px solid #E8E2D4",
                  overflow: "hidden",
                  backgroundColor: "#F3EFE6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(43, 45, 42, 0.08)",
                  flexShrink: 0,
                }}
              >
                {photoPreview || profile.profilePhoto || profile.avatar ? (
                  <img
                    src={photoPreview || optimizeCloudinaryUrl(profile.profilePhoto || profile.avatar, { width: 240, quality: "auto" })}
                    alt="Artist Profile"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <User size={48} style={{ color: "#8A6B2E" }} />
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <p style={{ fontSize: "13px", color: "#5A584F", margin: 0, maxWidth: "440px", lineHeight: 1.5 }}>
                  Clear, forward-facing commercial headshot ({PHOTO_UPLOAD_CONFIG.helperText}). Updates instantly across your profile and top bar.
                </p>

                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  style={{ display: "none" }}
                  onChange={handlePhotoSelect}
                />

                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  {selectedPhotoFile ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSavePhoto}
                        disabled={isUploadingPhoto}
                        className="btn-primary"
                        style={{ padding: "8px 18px", fontSize: "13px", height: "38px" }}
                      >
                        <Save size={14} />
                        <span>{isUploadingPhoto ? "Uploading to Cloudinary..." : "Update Profile Photo"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPhotoFile(null);
                          if (photoPreview) URL.revokeObjectURL(photoPreview);
                          setPhotoPreview(null);
                        }}
                        disabled={isUploadingPhoto}
                        className="btn-secondary"
                        style={{ padding: "8px 14px", fontSize: "13px", height: "38px" }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => photoInputRef.current && photoInputRef.current.click()}
                        className="btn-primary"
                        style={{ padding: "8px 18px", fontSize: "13px", height: "38px" }}
                      >
                        <Upload size={14} />
                        <span>{profile.profilePhoto || profile.avatar ? "Change Photo" : "Choose File"}</span>
                      </button>

                      {(profile.profilePhoto || profile.avatar) && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          disabled={isUploadingPhoto}
                          className="btn-secondary"
                          style={{ padding: "8px 14px", fontSize: "13px", height: "38px", color: "#B42318", borderColor: "#FECDCA" }}
                        >
                          <Trash2 size={13} />
                          <span>Remove</span>
                        </button>
                      )}
                    </>
                  )}
                </div>

                {photoError && <span style={errorTextStyle}>{photoError}</span>}
              </div>
            </div>
          </div>

          {/* Upload Portfolio Item Card */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #F3EFE6", paddingBottom: "12px" }}>
              <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "#F3EFE6", color: "#8A6B2E" }}>
                <Upload size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#2B2D2A", margin: 0 }}>
                  Upload Portfolio Item
                </h3>
                <span style={{ fontSize: "12px", color: "#5A584F" }}>Add commercial headshots, showreels, self-tapes and comp cards</span>
              </div>
            </div>

            <form onSubmit={handleUploadPortfolioItem} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="responsive-two-col">
              <div>
                <label style={labelStyle}>Category *</label>
                <select
                  value={portfolioCategory}
                  onChange={(e) => setPortfolioCategory(e.target.value)}
                  style={inputStyle(false)}
                >
                  {MEDIA_CATEGORIES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Visibility</label>
                <select
                  value={portfolioVisibility}
                  onChange={(e) => setPortfolioVisibility(e.target.value)}
                  style={inputStyle(false)}
                >
                  <option value="public">Public (All verified industry visitors)</option>
                  <option value="industry_only">Industry Only (Verified casting directors)</option>
                  <option value="private">Private (Only you &amp; Vismaya Admin)</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Item Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Dramatic Monologue 2026, Commercial Look"
                  value={portfolioTitle}
                  onChange={(e) => setPortfolioTitle(e.target.value)}
                  style={inputStyle(false)}
                />
              </div>

              <div>
                <label style={labelStyle}>File (JPG, PNG, WebP, MP4, MOV) *</label>
                <input
                  ref={portfolioInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                  onChange={(e) => setPortfolioFile(e.target.files && e.target.files[0])}
                  style={{ ...inputStyle(false), paddingTop: "8px" }}
                />
              </div>

              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {portfolioError && <span style={errorTextStyle}>{portfolioError}</span>}
                <div style={{ marginLeft: "auto" }}>
                  <button
                    type="submit"
                    disabled={isUploadingPortfolio}
                    className="btn-primary"
                    style={{ padding: "8px 22px", fontSize: "13px", height: "40px" }}
                  >
                    <Upload size={14} />
                    <span>{isUploadingPortfolio ? "Uploading to Cloudinary..." : "Upload Portfolio Item"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Uploaded Portfolio Items List */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F3EFE6", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "#F3EFE6", color: "#8A6B2E" }}>
                  <ImageIcon size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#2B2D2A", margin: 0 }}>
                    Uploaded Portfolio Items ({portfolio.length})
                  </h3>
                  <span style={{ fontSize: "12px", color: "#5A584F" }}>Manage active media items and visibility</span>
                </div>
              </div>
            </div>

            {portfolio.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 16px", color: "#5A584F", backgroundColor: "#FAF9F7", borderRadius: "12px", border: "1px dashed #E8E2D4" }}>
                <ImageIcon size={32} style={{ color: "#8A6B2E", opacity: 0.7, marginBottom: "8px" }} />
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#2B2D2A" }}>No portfolio items uploaded yet</p>
                <p style={{ margin: "4px 0 0 0", fontSize: "12.5px" }}>Upload your headshots and showreel videos above to showcase your work.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                {portfolio.map((item) => (
                  <div
                    key={item.id || item._id}
                    style={{
                      border: "1px solid #E8E2D4",
                      borderRadius: "12px",
                      overflow: "hidden",
                      backgroundColor: "#FAF9F7",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Media Thumbnail */}
                    <div style={{ height: "160px", backgroundColor: "#2B2D2A", position: "relative", overflow: "hidden" }}>
                      {item.url && (item.type === "Showreel" || item.type === "video" || item.category === "showreel" || item.category === "audition") ? (
                        <video
                          src={item.url}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          controls={false}
                        />
                      ) : (
                        <img
                          src={optimizeCloudinaryUrl(item.url || item.thumbnailUrl, { width: 400, quality: "auto" })}
                          alt={item.title || "Portfolio media"}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      )}
                      <span
                        style={{
                          position: "absolute",
                          top: "8px",
                          left: "8px",
                          fontSize: "11px",
                          fontWeight: "700",
                          backgroundColor: "rgba(43, 45, 42, 0.75)",
                          color: "#FFFFFF",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          backdropFilter: "blur(4px)",
                          textTransform: "capitalize",
                        }}
                      >
                        {item.category || item.type || "Photo"}
                      </span>
                    </div>

                    {/* Media Info */}
                    <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                        <strong style={{ fontSize: "13.5px", color: "#2B2D2A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.title || "Untitled"}
                        </strong>
                        <button
                          type="button"
                          onClick={() => deleteMedia(item.id || item._id)}
                          style={{ color: "#B42318", background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                          title="Delete media"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: "#5A584F" }}>
                        <span style={{ textTransform: "capitalize" }}>{item.visibility || "Public"}</span>
                        <span>•</span>
                        <StatusBadge status={item.status || "Approved"} size="sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Bar for Step 2 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
            <button
              type="button"
              onClick={() => navigateToStep(1)}
              className="btn-secondary"
              style={{ padding: "10px 20px", height: "44px", fontSize: "14px" }}
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToStep(3)}
              className="btn-primary"
              style={{ padding: "10px 28px", height: "44px", fontSize: "14px" }}
            >
              <span>Save &amp; Continue</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 3: WORK EXPERIENCE & CREDITS                                      */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="step-screen-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Card 1: Add Work Experience */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #F3EFE6", paddingBottom: "12px" }}>
              <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "#F3EFE6", color: "#8A6B2E" }}>
                <Briefcase size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#2B2D2A", margin: 0 }}>
                  Add Work Experience &amp; Credit
                </h3>
                <span style={{ fontSize: "12px", color: "#5A584F" }}>Record films, web series, theatre productions and commercial campaigns</span>
              </div>
            </div>

            <form onSubmit={handleAddCredit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="responsive-two-col">
              <div>
                <label style={labelStyle}>Project Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Sacred Games, Gully Boy, Lakme Fashion"
                  value={newCreditTitle}
                  onChange={(e) => setNewCreditTitle(e.target.value)}
                  style={inputStyle(false)}
                />
              </div>

              <div>
                <label style={labelStyle}>Role / Character *</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Antagonist, Inspector Joshi"
                  value={newCreditRole}
                  onChange={(e) => setNewCreditRole(e.target.value)}
                  style={inputStyle(false)}
                />
              </div>

              <div>
                <label style={labelStyle}>Project Type</label>
                <select
                  value={newCreditType}
                  onChange={(e) => setNewCreditType(e.target.value)}
                  style={inputStyle(false)}
                >
                  {PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Year</label>
                <input
                  type="number"
                  placeholder="e.g. 2024"
                  value={newCreditYear}
                  onChange={(e) => setNewCreditYear(e.target.value)}
                  style={inputStyle(false)}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Evidence / Project Link (Optional)</label>
                <input
                  type="url"
                  placeholder="e.g. https://www.imdb.com/title/... or YouTube link"
                  value={newCreditLink}
                  onChange={(e) => setNewCreditLink(e.target.value)}
                  style={inputStyle(false)}
                />
              </div>

              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {creditError && <span style={errorTextStyle}>{creditError}</span>}
                <div style={{ marginLeft: "auto" }}>
                  <button
                    type="submit"
                    disabled={isAddingCredit}
                    className="btn-primary"
                    style={{ padding: "8px 22px", fontSize: "13px", height: "40px" }}
                  >
                    <Plus size={15} />
                    <span>{isAddingCredit ? "Saving to Backend..." : "Submit Credit for Verification"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Card 2: Credit Verification Info Card */}
          <div
            style={{
              backgroundColor: "#FBF7ED",
              border: "1px solid #E8E2D4",
              borderRadius: "14px",
              padding: "16px 20px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <ShieldCheck size={20} style={{ color: "#8A6B2E", flexShrink: 0, marginTop: "2px" }} />
            <div style={{ fontSize: "13px", lineHeight: 1.5, color: "#2B2D2A" }}>
              <strong style={{ color: "#8A6B2E", display: "block", marginBottom: "2px" }}>
                Credit Verification Process
              </strong>
              Submitted work credits receive "Pending" status and are reviewed by Vismaya verification moderators. Once validated against production evidence, verified credits receive the official green checkmark badge, elevating your profile ranking for casting directors.
            </div>
          </div>

          {/* Card 3: Added Credits List */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F3EFE6", paddingBottom: "12px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#2B2D2A", margin: 0 }}>
                Added Work Credits ({(profile.credits || []).length})
              </h3>
            </div>

            {(!profile.credits || profile.credits.length === 0) ? (
              <div style={{ textAlign: "center", padding: "32px 16px", color: "#5A584F", backgroundColor: "#FAF9F7", borderRadius: "12px", border: "1px dashed #E8E2D4" }}>
                <Briefcase size={32} style={{ color: "#8A6B2E", opacity: 0.7, marginBottom: "8px" }} />
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#2B2D2A" }}>No credits listed yet</p>
                <p style={{ margin: "4px 0 0 0", fontSize: "12.5px" }}>Credits are optional to proceed, but adding past experience completes Step 3 and boosts your profile strength.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {profile.credits.map((cr) => {
                  const creditId = cr.id || cr._id;
                  const isVerified = cr.isVerifiedCredit || cr.verificationStatus === "verified";
                  const isRejected = cr.verificationStatus === "rejected";

                  return (
                    <div
                      key={creditId}
                      style={{
                        padding: "14px 18px",
                        borderRadius: "12px",
                        backgroundColor: "#FAF9F7",
                        border: "1px solid #E8E2D4",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "12px",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <strong style={{ fontSize: "14px", color: "#2B2D2A" }}>
                            {cr.projectTitle}
                          </strong>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "700",
                              padding: "2px 8px",
                              borderRadius: "999px",
                              backgroundColor: isVerified ? "#ECFDF3" : isRejected ? "#FEF3F2" : "#FBF7ED",
                              color: isVerified ? "#027A48" : isRejected ? "#B42318" : "#8A6B2E",
                              border: `1px solid ${isVerified ? "#A6F4C5" : isRejected ? "#FECDCA" : "#E8E2D4"}`,
                            }}
                          >
                            {isVerified ? "✓ Verified" : isRejected ? "Rejected" : "Pending Verification"}
                          </span>
                        </div>

                        <span style={{ fontSize: "12.5px", color: "#5A584F" }}>
                          {cr.roleOrDesignation} • {cr.projectType || "Project"} {cr.year ? `(${cr.year})` : ""}
                        </span>

                        {cr.referenceLink && (
                          <a
                            href={cr.referenceLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: "12px", color: "#8A6B2E", display: "inline-flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
                          >
                            <span>Evidence link</span>
                            <ExternalLink size={12} />
                          </a>
                        )}

                        {isRejected && (
                          <div style={{ marginTop: "6px" }}>
                            <ContactVismayaButton context="Rejected verification" reference={creditId} />
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteCredit(creditId)}
                        style={{ color: "#B42318", background: "none", border: "none", cursor: "pointer", padding: "6px" }}
                        title="Delete credit"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Bar for Step 3 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
            <button
              type="button"
              onClick={() => navigateToStep(2)}
              className="btn-secondary"
              style={{ padding: "10px 20px", height: "44px", fontSize: "14px" }}
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToStep(4)}
              className="btn-primary"
              style={{ padding: "10px 28px", height: "44px", fontSize: "14px" }}
            >
              <span>Save &amp; Continue</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 4: PERSONAL INFO & MINOR GUARDIAN                                  */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <div className="step-screen-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Card 1: Confidential Personal & Physical Details */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #F3EFE6", paddingBottom: "12px" }}>
              <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "#F3EFE6", color: "#8A6B2E" }}>
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#2B2D2A", margin: 0 }}>
                  Personal Details &amp; Physical Measurements
                </h3>
                <span style={{ fontSize: "12px", color: "#5A584F" }}>Confidential physical specifications stored strictly for owner &amp; admin</span>
              </div>
            </div>

            {/* Privacy Note */}
            <div
              style={{
                backgroundColor: "#FAF9F7",
                border: "1px solid #E8E2D4",
                borderRadius: "10px",
                padding: "12px 14px",
                fontSize: "12.5px",
                color: "#5A584F",
                lineHeight: 1.5,
              }}
            >
              🔒 <strong>Confidential &amp; Private:</strong> These physical specifications and personal details are strictly private (accessible only to you and Vismaya Admin). They will NEVER be displayed on public profiles or shared with recruiters.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Date of Birth *</label>
                <input
                  type="date"
                  value={formState.dob ? formState.dob.split("T")[0] : ""}
                  onChange={(e) => handleChange("dob", e.target.value)}
                  style={inputStyle(false)}
                />
                {computedAge !== null && (
                  <span style={{ fontSize: "12px", color: "#8A6B2E", fontWeight: "600", marginTop: "4px", display: "block" }}>
                    Age: {computedAge} years {isMinor ? "(Under 18 - Minor rule active)" : "(Adult)"}
                  </span>
                )}
              </div>

              <div>
                <label style={labelStyle}>Gender</label>
                <select
                  value={formState.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                  style={inputStyle(false)}
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non_binary">Non-Binary</option>
                  <option value="transgender">Transgender</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Height (cm) * (50 - 260 cm)</label>
                <input
                  type="number"
                  placeholder="e.g. 175"
                  value={formState.heightCm}
                  onChange={(e) => handleChange("heightCm", e.target.value)}
                  style={inputStyle(errors.heightCm)}
                />
                {errors.heightCm && <span style={errorTextStyle}>{errors.heightCm}</span>}
              </div>

              <div>
                <label style={labelStyle}>Weight (kg) (20 - 300 kg)</label>
                <input
                  type="number"
                  placeholder="e.g. 68"
                  value={formState.weightKg}
                  onChange={(e) => handleChange("weightKg", e.target.value)}
                  style={inputStyle(false)}
                />
              </div>

              <div>
                <label style={labelStyle}>Eye Color</label>
                <input
                  type="text"
                  placeholder="e.g. Dark Brown, Black"
                  value={formState.eyeColor}
                  onChange={(e) => handleChange("eyeColor", e.target.value)}
                  style={inputStyle(false)}
                />
              </div>

              <div>
                <label style={labelStyle}>Hair Color</label>
                <input
                  type="text"
                  placeholder="e.g. Black, Brown"
                  value={formState.hairColor}
                  onChange={(e) => handleChange("hairColor", e.target.value)}
                  style={inputStyle(false)}
                />
              </div>

              <div>
                <label style={labelStyle}>Skin Tone</label>
                <input
                  type="text"
                  placeholder="e.g. Fair, Wheatish, Dusky"
                  value={formState.skinTone}
                  onChange={(e) => handleChange("skinTone", e.target.value)}
                  style={inputStyle(false)}
                />
              </div>

              <div>
                <label style={labelStyle}>Body Type</label>
                <select
                  value={formState.bodyType}
                  onChange={(e) => handleChange("bodyType", e.target.value)}
                  style={inputStyle(false)}
                >
                  <option value="">Select body type</option>
                  <option value="Athletic">Athletic</option>
                  <option value="Slim">Slim</option>
                  <option value="Average">Average</option>
                  <option value="Muscular">Muscular</option>
                  <option value="Heavy">Heavy</option>
                </select>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Chest - Waist - Hips Measurements</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  <input
                    type="text"
                    placeholder="Chest (e.g. 38)"
                    value={formState.chest}
                    onChange={(e) => handleChange("chest", e.target.value)}
                    style={inputStyle(false)}
                  />
                  <input
                    type="text"
                    placeholder="Waist (e.g. 32)"
                    value={formState.waist}
                    onChange={(e) => handleChange("waist", e.target.value)}
                    style={inputStyle(false)}
                  />
                  <input
                    type="text"
                    placeholder="Hips (e.g. 38)"
                    value={formState.hips}
                    onChange={(e) => handleChange("hips", e.target.value)}
                    style={inputStyle(false)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Parent / Guardian Details (Rendered ONLY if Age < 18) */}
          {isMinor && (
            <div
              style={{
                ...cardStyle,
                backgroundColor: "#FBF7ED",
                border: "1px solid #D8C28A",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #E8E2D4", paddingBottom: "12px" }}>
                <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "#FFFFFF", color: "#8A6B2E", border: "1px solid #E8E2D4" }}>
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#2B2D2A", margin: 0 }}>
                    Parent / Legal Guardian Details (Under 18)
                  </h3>
                  <span style={{ fontSize: "12px", color: "#5A584F" }}>
                    Mandatory child artist protection compliance under Indian entertainment guidelines
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="responsive-two-col">
                <div>
                  <label style={labelStyle}>Guardian Full Legal Name *</label>
                  <input
                    type="text"
                    placeholder="Parent / Legal Guardian Name"
                    value={formState.guardianName}
                    onChange={(e) => handleChange("guardianName", e.target.value)}
                    style={inputStyle(errors.guardianName)}
                  />
                  {errors.guardianName && <span style={errorTextStyle}>{errors.guardianName}</span>}
                </div>

                <div>
                  <label style={labelStyle}>Relationship to Artist *</label>
                  <input
                    type="text"
                    placeholder="e.g. Mother, Father, Legal Guardian"
                    value={formState.guardianRelationship}
                    onChange={(e) => handleChange("guardianRelationship", e.target.value)}
                    style={inputStyle(errors.guardianRelationship)}
                  />
                  {errors.guardianRelationship && <span style={errorTextStyle}>{errors.guardianRelationship}</span>}
                </div>

                <div>
                  <label style={labelStyle}>Guardian Contact Mobile *</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={formState.guardianPhone}
                    onChange={(e) => handleChange("guardianPhone", e.target.value)}
                    style={inputStyle(errors.guardianPhone)}
                  />
                  {errors.guardianPhone && <span style={errorTextStyle}>{errors.guardianPhone}</span>}
                </div>

                <div>
                  <label style={labelStyle}>Guardian Email Address *</label>
                  <input
                    type="email"
                    placeholder="e.g. parent@example.com"
                    value={formState.guardianEmail}
                    onChange={(e) => handleChange("guardianEmail", e.target.value)}
                    style={inputStyle(errors.guardianEmail)}
                  />
                  {errors.guardianEmail && <span style={errorTextStyle}>{errors.guardianEmail}</span>}
                </div>

                <div style={{ gridColumn: "1 / -1", marginTop: "4px" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "13px", color: "#2B2D2A", lineHeight: 1.4 }}>
                    <input
                      type="checkbox"
                      checked={formState.guardianConsentGiven}
                      onChange={(e) => handleChange("guardianConsentGiven", e.target.checked)}
                      style={{ width: "18px", height: "18px", accentColor: "#8A6B2E", marginTop: "2px" }}
                    />
                    <span>
                      I hereby declare that I am the legal parent/guardian of the minor talent and authorize the Vismaya platform to manage audition applications and casting bookings under adult supervision.
                    </span>
                  </label>
                  {errors.guardianConsentGiven && <span style={errorTextStyle}>{errors.guardianConsentGiven}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Action Bar for Step 4 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
            <button
              type="button"
              onClick={() => navigateToStep(3)}
              className="btn-secondary"
              style={{ padding: "10px 20px", height: "44px", fontSize: "14px" }}
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveStep4(true)}
              className="btn-primary"
              style={{ padding: "10px 28px", height: "44px", fontSize: "14px" }}
            >
              <span>{isSaving ? "Saving to Backend..." : "Save & Finish"}</span>
              <Check size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMPLETION SCREEN: SHOWN AFTER STEP 4                                    */}
      {/* ========================================================================= */}
      {currentStep === "complete" && (
        <div
          style={{
            ...cardStyle,
            textAlign: "center",
            padding: "48px 32px",
            alignItems: "center",
            gap: "24px",
          }}
        >
          {/* Trophy / Check Circle */}
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              backgroundColor: "#ECFDF3",
              border: "2px solid #A6F4C5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#027A48",
            }}
          >
            <Check size={36} strokeWidth={2.5} />
          </div>

          <div>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#8A6B2E", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              All 4 Steps Completed
            </span>
            <h2
              style={{
                fontSize: "26px",
                fontWeight: "700",
                color: "#2B2D2A",
                margin: "4px 0 8px 0",
                fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
              }}
            >
              Your Artist Profile is Live &amp; Complete!
            </h2>
            <p style={{ fontSize: "14px", color: "#5A584F", maxWidth: "520px", margin: "0 auto", lineHeight: 1.5 }}>
              All information has been saved directly to MongoDB. Your profile strength is at 100%, unlocking live casting call applications and casting director search placement.
            </p>
          </div>

          {/* Profile Strength Pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 20px",
              borderRadius: "999px",
              backgroundColor: "#ECFDF3",
              border: "1px solid #A6F4C5",
              color: "#027A48",
              fontWeight: "700",
              fontSize: "14px",
            }}
          >
            <Sparkles size={16} />
            <span>Profile Strength: 100% Complete</span>
          </div>

          {/* Checklist Summary */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "12px",
              width: "100%",
              maxWidth: "540px",
              textAlign: "left",
            }}
          >
            {stepsList.map((st) => (
              <div
                key={st.num}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  backgroundColor: "#FAF9F7",
                  border: "1px solid #E8E2D4",
                  fontSize: "13px",
                  color: "#2B2D2A",
                  fontWeight: "600",
                }}
              >
                <Check size={16} style={{ color: "#027A48", flexShrink: 0 }} />
                <span>{st.name}</span>
              </div>
            ))}
          </div>

          {/* Navigation Action Buttons */}
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center", marginTop: "12px" }}>
            <button
              type="button"
              onClick={() => navigateToStep(1)}
              className="btn-secondary"
              style={{ padding: "10px 22px", height: "44px", fontSize: "14px" }}
            >
              <span>Edit Profile Sections</span>
            </button>

            <Link
              href="/talent/dashboard"
              className="btn-primary"
              style={{
                padding: "10px 24px",
                height: "44px",
                fontSize: "14px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>Go to Dashboard</span>
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Responsive mobile stylesheet strictly scoped to <= 640px */}
      <style jsx>{`
        @media (max-width: 640px) {
          .profile-builder-container {
            gap: 16px !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .profile-stepper-header-card {
            padding: 16px !important;
          }
          .profile-stepper-nav {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
          .responsive-two-col {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
