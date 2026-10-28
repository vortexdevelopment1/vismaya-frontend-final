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

  // Calculate missing items count per step for step indicator badge
  const step1MissingCount = [
    Boolean(profile.category && (profile.primaryProfession || profile.profession)),
    Boolean(profile.bio && profile.bio.trim().length >= 200),
    Boolean(profile.currentCity || profile.city),
    Boolean(profile.skills && profile.skills.length > 0),
    Boolean(profile.languages && profile.languages.length > 0),
  ].filter(val => !val).length;

  const step2MissingCount = [
    Boolean(profile.profilePhoto || profile.avatar),
    Boolean(portfolio && portfolio.length > 0),
  ].filter(val => !val).length;

  const step3MissingCount = (profile.credits && profile.credits.length > 0) ? 0 : 1;

  const step4MissingCount = isMinor
    ? [
        Boolean(profile.physicalAttributes?.heightCm),
        Boolean(profile.guardianDetails?.guardianName && profile.guardianDetails?.contactNumber && profile.guardianDetails?.consentGiven),
      ].filter(val => !val).length
    : (profile.physicalAttributes?.heightCm ? 0 : 1);

  // Step names config for Stepper with short "what is missing" hints
  const stepsList = [
    {
      num: 1,
      name: "Professional Details",
      key: "step1",
      done: stepsCompletion.step1,
      missingCount: step1MissingCount > 0 ? step1MissingCount : 1,
      missingHint: "Needs craft, bio & city"
    },
    {
      num: 2,
      name: "Portfolio & Media",
      key: "step2",
      done: stepsCompletion.step2,
      missingCount: step2MissingCount > 0 ? step2MissingCount : 1,
      missingHint: (!profile.profilePhoto && !profile.avatar) ? "Needs photo & 1 media item" : "Needs 1 portfolio item"
    },
    {
      num: 3,
      name: "Work Experience",
      key: "step3",
      done: stepsCompletion.step3,
      missingCount: step3MissingCount > 0 ? step3MissingCount : 1,
      missingHint: "Needs at least 1 credit"
    },
    {
      num: 4,
      name: "Personal Info",
      key: "step4",
      done: stepsCompletion.step4,
      missingCount: step4MissingCount > 0 ? step4MissingCount : 1,
      missingHint: isMinor ? "Needs height & guardian consent" : "Needs height measurement"
    },
  ];

  // Common styles adhering strictly to cream/gold-brown/charcoal tokens
  const cardStyle = {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E8E1D2",
    borderRadius: "16px",
    padding: "28px 32px",
    boxShadow: "0 2px 8px rgba(43, 45, 42, 0.03)",
    display: "flex",
    flexDirection: "column",
    gap: "22px",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    color: "#6B6254",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  };

  const inputStyle = (hasError) => ({
    width: "100%",
    height: "46px",
    padding: "0 14px",
    borderRadius: "10px",
    border: `1px solid ${hasError ? "#A3321F" : "#D9D1BF"}`,
    backgroundColor: "#FFFFFF",
    color: "#2A241A",
    fontSize: "15px",
    fontFamily: "var(--font-body), 'Inter', sans-serif",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.16s ease, box-shadow 0.16s ease",
  });
  const errorTextStyle = {
    fontSize: "12px",
    color: "#B42318",
    marginTop: "4px",
    display: "block",
    fontWeight: "500",
  };

  // Calculate progress ring math (84px desktop, 60px mobile)
  const dRadius = 36;
  const dCircumference = 2 * Math.PI * dRadius;
  const dOffset = dCircumference - (profileStrength / 100) * dCircumference;

  const mRadius = 24;
  const mCircumference = 2 * Math.PI * mRadius;
  const mOffset = mCircumference - (profileStrength / 100) * mCircumference;

  // Determine missing items count and first missing item hint
  const missingItems = stepsList.filter(s => !s.done);
  const itemsLeft = missingItems.length;
  const firstMissingHint = missingItems.length > 0 ? missingItems[0].missingHint : "Profile is fully complete!";

  return (
    <div className="profile-builder-v2">
      {/* ========================================================================= */}
      {/* MOBILE COMPACT HEADER CARDS (<= 767px)                                   */}
      {/* ========================================================================= */}
      <div className="pb-mobile-header-stack">
        {/* Mobile Progress Card */}
        <div className="pb-mobile-progress-card">
          <div className="pb-progress-ring-box" style={{ width: "60px", height: "60px" }}>
            <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: "rotate(-90deg)" }}>
              <circle
                cx="30"
                cy="30"
                r={mRadius}
                fill="transparent"
                stroke="#EFE7D3"
                strokeWidth="5"
              />
              <circle
                cx="30"
                cy="30"
                r={mRadius}
                fill="transparent"
                stroke="#8A6B2E"
                strokeWidth="5"
                strokeDasharray={mCircumference}
                strokeDashoffset={mOffset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
            </svg>
            <span className="pb-ring-text" style={{ fontSize: "13px" }}>{profileStrength}%</span>
          </div>
          <div className="pb-mobile-progress-info">
            <span className="pb-col-label">Profile Strength</span>
            <span className="pb-mobile-items-left">
              {itemsLeft === 0 ? "Profile 100% complete" : `${itemsLeft} item${itemsLeft > 1 ? "s" : ""} left to reach 100%`}
            </span>
            {itemsLeft > 0 && (
              <span className="pb-mobile-hint-text">
                Tip: {firstMissingHint}
              </span>
            )}
          </div>
        </div>

        {/* Mobile 4-Segment Stepper Card */}
        {currentStep !== "complete" && (
          <div className="pb-mobile-stepper-card">
            <div className="pb-mobile-step-title-row">
              <span className="pb-mobile-step-pill">STEP {currentStep} OF 4</span>
              <strong className="pb-mobile-step-title">
                {stepsList.find(s => s.num === currentStep)?.name || "Profile"}
              </strong>
            </div>
            
            {/* 4 Segmented Bar */}
            <div className="pb-mobile-segment-bar">
              {stepsList.map(st => {
                const isCurrent = currentStep === st.num;
                const isDone = st.done;
                let barBg = "#E1D4B3";
                if (isDone) barBg = "#2F6B45";
                if (isCurrent) barBg = "#8A6B2E";

                return (
                  <button
                    key={st.num}
                    type="button"
                    onClick={() => navigateToStep(st.num)}
                    className="pb-mobile-segment-btn"
                    title={isDone ? `${st.name}: Complete` : `${st.name}: ${st.missingHint}`}
                  >
                    <div className="pb-segment-track" style={{ backgroundColor: barBg }} />
                    <span className={`pb-segment-label ${isCurrent ? "active" : ""}`}>
                      {st.name.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP TWO-COLUMN LAYOUT CONTAINER (>= 1024px)                          */}
      {/* ========================================================================= */}
      <div className="pb-desktop-grid">
        {/* LEFT STICKY COLUMN (300px) */}
        <aside className="pb-left-sticky-col">
          {/* Card 1: Profile Strength Ring */}
          <div className="pb-sidebar-card">
            <div className="pb-ring-wrapper">
              <div className="pb-progress-ring-box" style={{ width: "84px", height: "84px" }}>
                <svg width="84" height="84" viewBox="0 0 84 84" style={{ transform: "rotate(-90deg)" }}>
                  <circle
                    cx="42"
                    cy="42"
                    r={dRadius}
                    fill="transparent"
                    stroke="#EFE7D3"
                    strokeWidth="7"
                  />
                  <circle
                    cx="42"
                    cy="42"
                    r={dRadius}
                    fill="transparent"
                    stroke="#8A6B2E"
                    strokeWidth="7"
                    strokeDasharray={dCircumference}
                    strokeDashoffset={dOffset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.5s ease" }}
                  />
                </svg>
                <span className="pb-ring-text" style={{ fontSize: "17px" }}>{profileStrength}%</span>
              </div>
              <div className="pb-ring-meta">
                <span className="pb-col-label">Profile strength</span>
                <span className="pb-items-left-text">
                  {itemsLeft === 0 ? "Profile 100% complete" : `${itemsLeft} item${itemsLeft > 1 ? "s" : ""} left to reach 100%`}
                </span>
              </div>
            </div>

            {itemsLeft > 0 && (
              <div className="pb-gold-tip-box">
                <span className="pb-tip-title">Recommended action</span>
                <p className="pb-tip-desc">{firstMissingHint}</p>
              </div>
            )}
          </div>

          {/* Card 2: Vertical Stepper for Steps 1-4 */}
          <div className="pb-sidebar-card pb-step-list-card">
            <span className="pb-col-label" style={{ marginBottom: "12px", display: "block" }}>Profile Steps</span>
            <div className="pb-step-list">
              {stepsList.map(st => {
                const isCurrent = currentStep === st.num;
                const isDone = st.done;

                let circleClass = "pb-step-circle-incomplete";
                if (isCurrent && isDone) {
                  circleClass = "pb-step-circle-current-done";
                } else if (isCurrent && !isDone) {
                  circleClass = "pb-step-circle-current-incomplete";
                } else if (isDone) {
                  circleClass = "pb-step-circle-done";
                } else {
                  circleClass = "pb-step-circle-incomplete";
                }

                let statusText = "INCOMPLETE";
                if (isCurrent) {
                  statusText = "EDITING";
                } else if (isDone) {
                  statusText = "COMPLETED";
                } else {
                  const count = st.missingCount;
                  if (typeof count === "number" && count > 0) {
                    statusText = count === 1 ? "1 ITEM NEEDED" : `${count} ITEMS NEEDED`;
                  } else {
                    statusText = "INCOMPLETE";
                  }
                }

                return (
                  <button
                    key={st.num}
                    type="button"
                    onClick={() => navigateToStep(st.num)}
                    className={`pb-step-nav-row ${isCurrent ? "current" : ""}`}
                  >
                    <div className={`pb-step-circle ${circleClass}`}>
                      {isDone ? (
                        <Check size={16} strokeWidth={2.5} />
                      ) : (
                        st.num
                      )}
                    </div>
                    <div className="pb-step-nav-content">
                      <span className="pb-step-status-tag">{statusText}</span>
                      <strong className="pb-step-nav-title">{st.name}</strong>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN (Form Steps) */}
        <main className="pb-right-form-col">
      {/* ========================================================================= */}
      {/* SCREEN 1: PROFESSIONAL DETAILS                                           */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="step-screen-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Card 1: Professional Identity */}
          <div style={cardStyle}>
            <div className="pb-card-header">
              <div className="pb-card-icon-box">
                <User size={18} />
              </div>
              <div>
                <h2 className="pb-card-title">
                  Professional Identity
                </h2>
                <p className="pb-card-subtitle">Category, craft, headline and professional stage name</p>
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
                    <span key={idx} className="pb-tag-chip">
                      <span>{sec}</span>
                      <button
                        type="button"
                        onClick={() => removeTag("secondaryProfessions", sec)}
                        className="pb-chip-remove-btn"
                        title="Remove"
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
            <div className="pb-card-header">
              <div className="pb-card-icon-box">
                <Sparkles size={18} />
              </div>
              <div>
                <h2 className="pb-card-title">
                  Profession-Specific Preferences &amp; Specialization
                </h2>
                <p className="pb-card-subtitle">Casting genre strengths and specialized abilities</p>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Specializations &amp; Craft Styles</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                {formState.specializations.map((spec, idx) => (
                  <span key={idx} className="pb-tag-chip">
                    <span>{spec}</span>
                    <button
                      type="button"
                      onClick={() => removeTag("specializations", spec)}
                      className="pb-chip-remove-btn"
                      title="Remove"
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
            <div className="pb-card-header">
              <div className="pb-card-icon-box">
                <Briefcase size={18} />
              </div>
              <div>
                <h2 className="pb-card-title">
                  About &amp; Career Experience
                </h2>
                <p className="pb-card-subtitle">Bio, career stage and professional background</p>
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
            <div className="pb-card-header">
              <div className="pb-card-icon-box">
                <Layers size={18} />
              </div>
              <div>
                <h2 className="pb-card-title">
                  Location &amp; Availability
                </h2>
                <p className="pb-card-subtitle">Primary base city, preferred shoot hubs and travel availability</p>
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
                    <span key={idx} className="pb-tag-chip">
                      <span>{c}</span>
                      <button
                        type="button"
                        onClick={() => removeTag("workingCities", c)}
                        className="pb-chip-remove-btn"
                        title="Remove"
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
                    style={{ width: "20px", height: "20px", accentColor: "#8A6B2E", cursor: "pointer" }}
                  />
                  <span>Willing to travel outstation for shoots</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "#2B2D2A" }}>
                  <input
                    type="checkbox"
                    checked={formState.willingToRelocate}
                    onChange={(e) => handleChange("willingToRelocate", e.target.checked)}
                    style={{ width: "20px", height: "20px", accentColor: "#8A6B2E", cursor: "pointer" }}
                  />
                  <span>Willing to relocate for long-term production</span>
                </label>
              </div>
            </div>
          </div>

          {/* Card 5: Skills & Languages */}
          <div style={cardStyle}>
            <div className="pb-card-header">
              <div className="pb-card-icon-box">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h2 className="pb-card-title">
                  Skills &amp; Languages
                </h2>
                <p className="pb-card-subtitle">Performance skills, dance styles, spoken languages &amp; dialects</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Skills Tags */}
              <div>
                <label style={labelStyle}>Performing Skills &amp; Talents *</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                  {formState.skills.map((sk, idx) => (
                    <span key={idx} className="pb-tag-chip">
                      <span>{sk}</span>
                      <button
                        type="button"
                        onClick={() => removeTag("skills", sk)}
                        className="pb-chip-remove-btn"
                        title="Remove"
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
                    <span key={idx} className="pb-tag-chip">
                      <span>{lg}</span>
                      <button
                        type="button"
                        onClick={() => removeTag("languages", lg)}
                        className="pb-chip-remove-btn"
                        title="Remove"
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

          
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 2: PORTFOLIO & MEDIA                                              */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="step-screen-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Main Profile Photo Card */}
          <div style={cardStyle}>
            <div className="pb-card-header">
              <div className="pb-card-icon-box">
                <Camera size={18} />
              </div>
              <div>
                <h2 className="pb-card-title">
                  Main Profile Photo
                </h2>
                <p className="pb-card-subtitle">Mandatory headshot photo displayed across search and top navigation</p>
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
            <div className="pb-card-header">
              <div className="pb-card-icon-box">
                <Upload size={18} />
              </div>
              <div>
                <h2 className="pb-card-title">
                  Upload Portfolio Item
                </h2>
                <p className="pb-card-subtitle">Add commercial headshots, showreels, self-tapes and comp cards</p>
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
                <div className="pb-card-icon-box">
                  <ImageIcon size={18} />
                </div>
                <div>
                  <h2 className="pb-card-title">
                    Uploaded Portfolio Items ({portfolio.length})
                  </h2>
                  <p className="pb-card-subtitle">Manage active media items and visibility</p>
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

          
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 3: WORK EXPERIENCE & CREDITS                                      */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="step-screen-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Card 1: Add Work Experience */}
          <div style={cardStyle}>
            <div className="pb-card-header">
              <div className="pb-card-icon-box">
                <Briefcase size={18} />
              </div>
              <div>
                <h2 className="pb-card-title">
                  Add Work Experience &amp; Credit
                </h2>
                <p className="pb-card-subtitle">Record films, web series, theatre productions and commercial campaigns</p>
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
                    <span>{isAddingCredit ? "Saving..." : "Submit Credit for Verification"}</span>
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
              <h2 className="pb-card-title">
                Added Work Credits ({(profile.credits || []).length})
              </h2>
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

          
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 4: PERSONAL INFO & MINOR GUARDIAN                                  */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <div className="step-screen-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Card 1: Confidential Personal & Physical Details */}
          <div style={cardStyle}>
            <div className="pb-card-header">
              <div className="pb-card-icon-box">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h2 className="pb-card-title">
                  Personal Details &amp; Physical Measurements
                </h2>
                <p className="pb-card-subtitle">Confidential physical specifications stored strictly for owner &amp; admin</p>
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
                  <h2 className="pb-card-title">
                    Parent / Legal Guardian Details (Under 18)
                  </h2>
                  <p className="pb-card-subtitle">
                    Mandatory child artist protection compliance under Indian entertainment guidelines
                  </p>
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

          
        </div>
      )}

      {/* ACTION BAR AT THE END OF FORM COLUMN */}
      {currentStep !== "complete" && (
        <div className="pb-sticky-bottom-bar">
          <div className="pb-bottom-bar-inner">
            <div className="pb-bottom-bar-left">
              <span className="pb-draft-saved-text">
                {isSaving ? "Saving changes..." : "Draft saved automatically"}
              </span>
            </div>
            <div className="pb-bottom-bar-actions">
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1) handleSaveStep1(false);
                  else if (currentStep === 4) handleSaveStep4(false);
                  else {
                    addToast({
                      type: "info",
                      title: "Draft Saved",
                      message: "Current progress has been saved.",
                    });
                  }
                }}
                disabled={isSaving}
                className="btn-secondary pb-btn-draft"
              >
                <Save size={15} />
                <span>Save draft</span>
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => {
                  if (currentStep === 1) handleSaveStep1(true);
                  else if (currentStep === 2) navigateToStep(3);
                  else if (currentStep === 3) navigateToStep(4);
                  else if (currentStep === 4) handleSaveStep4(true);
                }}
                className="btn-primary pb-btn-continue"
              >
                <span>{currentStep === 4 ? (isSaving ? "Saving..." : "Save & finish") : (isSaving ? "Saving..." : "Save & continue")}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
        </main>
      </div>

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

      {/* Comprehensive layout and responsive styles for Profile Builder V2 */}
      <style jsx>{`
        .profile-builder-v2 {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          box-sizing: border-box;
          position: relative;
        }

        /* Desktop Grid (>= 1024px) */
        .pb-desktop-grid {
          display: grid;
          grid-template-columns: 300px minmax(0, 1fr);
          gap: 32px;
          align-items: start;
          width: 100%;
          box-sizing: border-box;
        }

        .pb-left-sticky-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: sticky;
          top: 88px;
        }

        .pb-sidebar-card {
          background-color: #FFFFFF;
          border: 1px solid #E8E1D2;
          border-radius: 16px;
          padding: 24px;
          box-sizing: border-box;
          box-shadow: 0 2px 8px rgba(43, 45, 42, 0.03);
        }

        .pb-ring-wrapper {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .pb-progress-ring-box {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .pb-ring-text {
          position: absolute;
          font-weight: 700;
          color: #2A241A;
          font-family: var(--font-heading), 'Playfair Display', Georgia, serif;
        }

        .pb-ring-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .pb-col-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #6B6254;
        }

        .pb-items-left-text {
          font-size: 13.5px;
          color: #2A241A;
          font-weight: 500;
          line-height: 1.4;
        }

        .pb-gold-tip-box {
          margin-top: 16px;
          padding: 12px 14px;
          border-radius: 10px;
          background-color: #FBF3DF;
          border: 1px solid #EFE7D3;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pb-tip-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #8A6B2E;
        }

        .pb-tip-desc {
          margin: 0;
          font-size: 12.5px;
          color: #5E471B;
          line-height: 1.45;
          font-weight: 500;
        }

        /* Step List in Sidebar */
        .pb-step-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pb-step-nav-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid transparent;
          background-color: transparent;
          cursor: pointer;
          text-align: left;
          transition: all 0.16s ease;
          width: 100%;
          box-sizing: border-box;
        }

        .pb-step-nav-row:hover {
          background-color: #FAF8F3;
        }

        .pb-step-nav-row.current {
          background-color: #FBF3DF;
          border-color: #8A6B2E;
        }

        .pb-step-circle {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 13px;
          font-weight: 700;
          box-sizing: border-box;
        }

        .pb-step-circle-done {
          background-color: #2F6B45;
          color: #FFFFFF;
        }

        .pb-step-circle-current,
        .pb-step-circle-current-done {
          background-color: #8A6B2E;
          color: #FFFFFF;
        }

        .pb-step-circle-current-incomplete {
          border: 2px solid #8A6B2E;
          background-color: transparent;
          color: #8A6B2E;
        }

        .pb-step-circle-incomplete {
          border: 1.5px solid #D9D1BF;
          background-color: transparent;
          color: #6B6254;
        }

        .pb-step-nav-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .pb-step-status-tag {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6B6254;
        }

        .pb-step-nav-row.current .pb-step-status-tag {
          color: #8A6B2E;
        }

        .pb-step-nav-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #2A241A;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Right Form Column */
        .pb-right-form-col {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Standardized Card Headers */
        :global(.pb-card-header) {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        :global(.pb-card-icon-box) {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background-color: #F3ECDC;
          color: #8A6B2E;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        :global(.pb-card-title) {
          font-family: var(--font-heading), 'Playfair Display', Georgia, serif;
          font-size: 22px;
          font-weight: 600;
          color: #2A241A;
          margin: 0;
          line-height: 1.25;
        }

        :global(.pb-card-subtitle) {
          font-size: 14px;
          color: #6B6254;
          margin: 4px 0 0 0;
          line-height: 1.45;
        }

        :global(.pb-card-divider) {
          width: 100%;
          height: 1px;
          background-color: #EFE9DA;
          margin-bottom: 4px;
        }

        /* Standardized Chips */
        :global(.pb-tag-chip) {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          background-color: #F3ECDC;
          border: 1px solid #E8E1D2;
          font-size: 13px;
          font-weight: 600;
          color: #5E471B;
          box-sizing: border-box;
        }

        :global(.pb-chip-remove-btn) {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(94, 71, 27, 0.12);
          border: none;
          color: #5E471B;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          line-height: 1;
          padding: 0;
          transition: background-color 0.16s ease;
        }

        :global(.pb-chip-remove-btn:hover) {
          background: rgba(94, 71, 27, 0.25);
        }

        /* In-Flow Action Bar on Desktop (>= 768px) */
        .pb-sticky-bottom-bar {
          position: static;
          width: 100%;
          background: transparent;
          border: none;
          box-shadow: none;
          z-index: 1;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #EFE9DA;
          box-sizing: border-box;
        }

        .pb-bottom-bar-inner {
          width: 100%;
          margin: 0;
          height: auto;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          box-sizing: border-box;
        }

        .pb-bottom-bar-left {
          margin-right: auto;
        }

        .pb-draft-saved-text {
          font-size: 13px;
          color: #6B6254;
          white-space: nowrap;
        }

        .pb-bottom-bar-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pb-btn-draft {
          height: 44px;
          padding: 0 20px;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.01em;
          text-transform: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 10px;
          box-sizing: border-box;
        }

        .pb-btn-continue {
          height: 44px;
          padding: 0 20px;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.01em;
          text-transform: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 10px;
          box-sizing: border-box;
        }

        /* Hide mobile stack by default on desktop */
        .pb-mobile-header-stack {
          display: none;
        }

        /* Responsive Breakpoint: Tablet & Mobile (<= 1023px) */
        @media (max-width: 1023px) {
          .pb-desktop-grid {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .pb-left-sticky-col {
            display: none;
          }
          .pb-mobile-header-stack {
            display: flex;
            flex-direction: column;
            gap: 14px;
            margin-bottom: 20px;
          }
          .pb-mobile-progress-card {
            background-color: #FFFFFF;
            border: 1px solid #E8E1D2;
            border-radius: 16px;
            padding: 16px 18px;
            display: flex;
            align-items: center;
            gap: 16px;
            box-sizing: border-box;
          }
          .pb-mobile-progress-info {
            display: flex;
            flex-direction: column;
            gap: 3px;
            min-width: 0;
          }
          .pb-mobile-items-left {
            font-size: 13px;
            font-weight: 600;
            color: #2A241A;
          }
          .pb-mobile-hint-text {
            font-size: 11.5px;
            color: #8A6B2E;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .pb-mobile-stepper-card {
            background-color: #FFFFFF;
            border: 1px solid #E8E1D2;
            border-radius: 16px;
            padding: 14px 18px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            box-sizing: border-box;
          }
          .pb-mobile-step-title-row {
            display: flex;
            align-items: baseline;
            gap: 8px;
          }
          .pb-mobile-step-pill {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
            color: #8A6B2E;
          }
          .pb-mobile-step-title {
            font-size: 14px;
            color: #2A241A;
            font-family: var(--font-heading), 'Playfair Display', Georgia, serif;
          }
          .pb-mobile-segment-bar {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
          }
          .pb-mobile-segment-btn {
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            gap: 6px;
            text-align: center;
          }
          .pb-segment-track {
            height: 6px;
            border-radius: 999px;
            width: 100%;
            transition: background-color 0.2s ease;
          }
          .pb-segment-label {
            font-size: 10.5px;
            color: #6B6254;
            font-weight: 500;
          }
          .pb-segment-label.active {
            color: #8A6B2E;
            font-weight: 700;
          }
        }

        /* Mobile specific (<= 767px) */
        @media (max-width: 767px) {
          :global(.profile-builder-v2) {
            padding: 0 4px;
            overflow-x: hidden;
          }
          :global(.responsive-two-col) {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          :global(.step-screen-container > div) {
            padding: 20px 18px !important;
          }
          :global(input[type="text"]),
          :global(input[type="email"]),
          :global(input[type="tel"]),
          :global(input[type="number"]),
          :global(input[type="date"]),
          :global(select) {
            height: 48px !important;
            font-size: 16px !important;
          }
          :global(.pb-tag-chip) {
            height: 36px !important;
            font-size: 13.5px !important;
          }
          :global(input[type="checkbox"]) {
            width: 22px !important;
            height: 22px !important;
            min-height: 22px !important;
          }
          :global(label:has(input[type="checkbox"])) {
            min-height: 44px !important;
          }
          :global(button.btn-secondary:has(svg:first-child)) {
            min-height: 48px !important;
          }
          /* Action Bar on Mobile (<= 767px) */
          .pb-sticky-bottom-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            height: calc(64px + env(safe-area-inset-bottom, 0px));
            background-color: #FFFFFF;
            border-top: 1px solid #E8E1D2;
            z-index: 40;
            margin-top: 0;
            padding-top: 0;
            padding-bottom: env(safe-area-inset-bottom, 0px);
            box-shadow: 0 -4px 16px rgba(42, 36, 26, 0.05);
            box-sizing: border-box;
          }
          .pb-bottom-bar-inner {
            height: 64px;
            padding: 0 16px;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
          }
          .pb-bottom-bar-left {
            display: none;
          }
          .pb-bottom-bar-actions {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .pb-btn-draft {
            flex: 1;
            height: 44px;
            padding: 0 12px;
            justify-content: center;
            font-size: 14px;
          }
          .pb-btn-continue {
            flex: 1.4;
            height: 44px;
            padding: 0 12px;
            justify-content: center;
            font-size: 14px;
          }
          :global(select) {
            max-width: 100% !important;
            text-overflow: ellipsis !important;
            overflow: hidden !important;
            white-space: nowrap !important;
          }
        }
      `}</style>
    </div>
  );
}
