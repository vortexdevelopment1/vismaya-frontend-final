import React, { useState, useRef, useEffect } from "react";
import {
  User,
  Activity,
  Award,
  BookOpen,
  MapPin,
  ShieldAlert,
  Plus,
  Trash2,
  Check,
  Edit3,
  Save,
  X,
  AlertCircle,
  Camera,
  Upload,
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import ProgressBar from "@/components/shared/ProgressBar";
import { useTalent } from "@/lib/talent/TalentContext";
import { validateMediaFile, optimizeCloudinaryUrl } from "@/lib/api/uploadMedia";

function getInitials(name) {
  if (!name) return "TR";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfileSections() {
  const {
    profile,
    updateProfile,
    updateProfilePhoto,
    removeProfilePhoto,
    profileCompletionScore,
    profileChecklist
  } = useTalent();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);
  const [errors, setErrors] = useState({});

  // Sync formData with profile
  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  // Profile Photo Upload State
  const photoInputRef = useRef(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");

  const handlePhotoSelect = (e) => {
    setPhotoError("");
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      validateMediaFile(file, "profilePhoto");
      setSelectedPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    } catch (err) {
      setPhotoError(err.message || "Photo must be a JPG or PNG.");
    }
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

  const handleCancelPhoto = () => {
    setSelectedPhotoFile(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
    setPhotoError("");
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm("Are you sure you want to remove your profile photo?")) return;
    setIsUploadingPhoto(true);
    setPhotoError("");
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

  // Local state for adding new tag inputs
  const [newSkill, setNewSkill] = useState("");
  const [newLang, setNewLang] = useState("");
  const [newCity, setNewCity] = useState("");

  // Handler for nested field changes
  const handlePersonalChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      personal: { ...prev.personal, [field]: value },
    }));
  };

  const handlePhysicalChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      physical: { ...prev.physical, [field]: value },
    }));
  };

  const handleAvailabilityChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      availability: { ...prev.availability, [field]: value },
    }));
  };

  const handleGuardianChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      guardianConsent: { ...prev.guardianConsent, [field]: value },
    }));
  };

  // Skill Tags
  const addSkill = () => {
    if (!newSkill.trim()) return;
    if (!formData.skills.includes(newSkill.trim())) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
    }
    setNewSkill("");
  };

  const removeSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  // Language Tags
  const addLanguage = () => {
    if (!newLang.trim()) return;
    if (!formData.languages.includes(newLang.trim())) {
      setFormData((prev) => ({ ...prev, languages: [...prev.languages, newLang.trim()] }));
    }
    setNewLang("");
  };

  const removeLanguage = (langToRemove) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.filter((l) => l !== langToRemove),
    }));
  };

  // Preferred Cities
  const addCity = () => {
    if (!newCity.trim()) return;
    const currentCities = formData.availability.preferredCities || [];
    if (!currentCities.includes(newCity.trim())) {
      handleAvailabilityChange("preferredCities", [...currentCities, newCity.trim()]);
    }
    setNewCity("");
  };

  const removeCity = (cityToRemove) => {
    const currentCities = formData.availability.preferredCities || [];
    handleAvailabilityChange(
      "preferredCities",
      currentCities.filter((c) => c !== cityToRemove)
    );
  };

  // Experience Add / Remove
  const addExperienceItem = () => {
    const newItem = {
      id: "exp-" + Date.now(),
      role: "Character Role",
      project: "New Project / Campaign",
      production: "Production House",
      year: new Date().getFullYear().toString(),
      type: "Film",
      notes: "",
    };
    setFormData((prev) => ({
      ...prev,
      experience: [newItem, ...prev.experience],
    }));
  };

  const updateExperienceItem = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    }));
  };

  const removeExperienceItem = (id) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((exp) => exp.id !== id),
    }));
  };

  // Training Add / Remove
  const addTrainingItem = () => {
    const newItem = {
      id: "trn-" + Date.now(),
      institute: "Acting Academy / Studio",
      course: "Diploma / Workshop",
      year: new Date().getFullYear().toString(),
    };
    setFormData((prev) => ({
      ...prev,
      training: [newItem, ...prev.training],
    }));
  };

  const updateTrainingItem = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      training: prev.training.map((trn) =>
        trn.id === id ? { ...trn, [field]: value } : trn
      ),
    }));
  };

  const removeTrainingItem = (id) => {
    setFormData((prev) => ({
      ...prev,
      training: prev.training.filter((trn) => trn.id !== id),
    }));
  };

  // Validation & Save
  const handleSave = () => {
    const newErrors = {};

    if (!formData.personal.fullName?.trim()) {
      newErrors.fullName = "Full name is required";
    }

    const ageNum = Number(formData.personal.age);
    if (!ageNum || ageNum < 4 || ageNum > 100) {
      newErrors.age = "Please enter a valid age";
    }

    // Phone validation
    const cleanPhone = formData.personal.phone.replace(/[\s-]/g, "");
    if (!formData.personal.phone?.trim() || cleanPhone.length < 10) {
      newErrors.phone = "Valid phone number required";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.personal.email)) {
      newErrors.email = "Valid email address required";
    }

    // Bio length validation
    const bioText = (formData.personal?.bio || "").trim();
    if (bioText.length > 0 && bioText.length < 200) {
      newErrors.bio = "Bio must be at least 200 characters in length";
    } else if (bioText.length > 1000) {
      newErrors.bio = "Bio cannot exceed 1000 characters in length";
    }

    // If age under 18, validate guardian consent
    if (ageNum < 18) {
      if (!formData.guardianConsent?.guardianName?.trim()) {
        newErrors.guardianName = "Guardian legal name is required for minors";
      }
      if (!formData.guardianConsent?.phone?.trim()) {
        newErrors.guardianPhone = "Guardian phone is required";
      }
      if (!formData.guardianConsent?.consentGiven) {
        newErrors.consentGiven = "Guardian consent checkbox must be confirmed";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    updateProfile(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(profile);
    setErrors({});
    setIsEditing(false);
  };

  const ageNum = Number(formData?.personal?.age);
  const isMinor = (!isNaN(ageNum) && ageNum > 0 && ageNum < 18) || Boolean(formData?.isUnder18 && (!ageNum || ageNum < 18));

  return (
    <div className={`talent-profile-sections-root ${isEditing ? "is-editing" : ""}`} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Top Header Card: Status, Live Score & Edit Toggle */}
      <div
        className="card-surface profile-hero-card"
        style={{
          padding: "24px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div className="profile-hero-left" style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div className="profile-hero-avatar-wrap">
            {profile?.avatar || formData?.avatar ? (
              <img
                src={optimizeCloudinaryUrl(profile.avatar || formData.avatar, { width: 120, quality: "auto" })}
                alt={formData.personal.fullName}
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #E8E2D4",
                  boxShadow: "0 2px 6px rgba(43, 45, 42, 0.04)",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "#F3EFE6",
                  border: "2px solid #E8E2D4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#8A6B2E",
                  fontWeight: 700,
                  fontSize: "18px",
                  flexShrink: 0,
                }}
              >
                {getInitials(formData.personal.fullName)}
              </div>
            )}
          </div>

          <div className="profile-hero-info" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div className="profile-hero-title-row" style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h2 className="profile-hero-name" style={{ fontSize: "1.35rem", fontWeight: "700", color: "#2B2D2A", margin: 0 }}>
                {formData.personal.fullName}
              </h2>
              <div className="profile-hero-badge">
                <StatusBadge status={profile.status} size="sm" />
              </div>
            </div>
            <span className="profile-hero-status-note" style={{ fontSize: "0.85rem", color: "#5A584F" }}>
              {profile.statusNote}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="profile-action-group" style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary profile-edit-btn"
              style={{ padding: "10px 22px", fontSize: "0.9rem", minHeight: "40px" }}
            >
              <Edit3 size={16} />
              <span>Edit Profile Details</span>
            </button>
          ) : (
            <div className="profile-editing-btn-row" style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={handleCancel}
                className="btn-secondary profile-cancel-btn"
                style={{ padding: "10px 18px", fontSize: "0.9rem", minHeight: "40px" }}
              >
                <X size={16} />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                className="btn-primary profile-save-btn"
                style={{ padding: "10px 22px", fontSize: "0.9rem", minHeight: "40px" }}
              >
                <Save size={16} />
                <span>Save &amp; Submit Changes</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Completion Live Meter Card */}
      <div
        className="card-surface profile-meter-card"
        style={{
          padding: "20px 24px",
        }}
      >
        <div className="profile-meter-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span className="profile-meter-title" style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-primary)" }}>
            Profile Strength &amp; Verification Score
          </span>
          <span className="profile-meter-score" style={{ fontSize: "0.875rem", fontWeight: "700", color: "var(--gold)" }}>
            {profileCompletionScore}% Complete
          </span>
        </div>

        <ProgressBar value={profileCompletionScore} height="10px" showPercentage={false} />

        <div className="profile-checklist-container" style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "14px" }}>
          {profileChecklist.map((item, idx) => (
            <div
              key={idx}
              className="profile-checklist-pill"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.785rem",
                padding: "4px 12px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: item.done ? "var(--success-bg)" : "var(--bg-surface-elevated)",
                color: item.done ? "var(--success)" : "var(--text-muted)",
                border: `1px solid ${item.done ? "var(--success-border)" : "var(--border-color)"}`,
              }}
            >
              {item.done ? <Check size={12} /> : <AlertCircle size={12} />}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION: 120px Dedicated Profile Photo Block */}
      <div
        className="card-surface profile-photo-card"
        style={{
          padding: "24px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "24px",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E2D4",
          borderRadius: "16px",
        }}
      >
        <div className="profile-photo-inner" style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap", width: "100%" }}>
          <div className="profile-photo-top-row" style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            {/* Round 120px Avatar */}
            <div
              className="profile-photo-avatar"
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "3px solid #E8E2D4",
                boxShadow: "0 4px 14px rgba(43, 45, 42, 0.08)",
                backgroundColor: "#F3EFE6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                flexShrink: 0,
              }}
            >
              {photoPreview || profile.avatar || formData.avatar ? (
                <img
                  src={photoPreview || optimizeCloudinaryUrl(profile.avatar || formData.avatar, { width: 240, quality: "auto" })}
                  alt={formData.personal?.fullName || "Profile Photo"}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span
                  style={{
                    fontSize: "36px",
                    fontWeight: 700,
                    color: "#8A6B2E",
                    fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                  }}
                >
                  {getInitials(formData.personal?.fullName)}
                </span>
              )}
            </div>

            {/* Details & Actions */}
            <div className="profile-photo-details" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <h3
                className="profile-photo-title"
                style={{
                  fontSize: "1.15rem",
                  fontWeight: "700",
                  color: "#2B2D2A",
                  margin: 0,
                  fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                }}
              >
                Artist Profile Photo
              </h3>
              <p className="profile-photo-desc" style={{ fontSize: "0.85rem", color: "#5A584F", margin: 0, lineHeight: 1.4, maxWidth: "420px" }}>
                Displayed across casting director searches, roster comp cards, top bar, and talent sidebar.
                Upload JPG, PNG, or WebP. Your face must be clearly visible.
              </p>

              {photoError && (
                <span style={{ fontSize: "0.8rem", color: "#B42318", fontWeight: "600", marginTop: "4px" }}>
                  {photoError}
                </span>
              )}
            </div>
          </div>

          {/* Hidden Input */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            style={{ display: "none" }}
            onChange={handlePhotoSelect}
          />

          {/* Photo Action Buttons */}
          <div className="profile-photo-btn-group" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px", flexWrap: "wrap" }}>
            {selectedPhotoFile ? (
              <>
                <button
                  type="button"
                  onClick={handleSavePhoto}
                  disabled={isUploadingPhoto}
                  className="btn-primary"
                  style={{ padding: "8px 18px", fontSize: "0.85rem", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Save size={15} />
                  <span>{isUploadingPhoto ? "Uploading to Cloudinary..." : "Save Photo"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelPhoto}
                  disabled={isUploadingPhoto}
                  className="btn-secondary"
                  style={{ padding: "8px 16px", fontSize: "0.85rem", borderRadius: "6px" }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (photoInputRef.current) photoInputRef.current.click();
                  }}
                  className="btn-primary"
                  style={{ padding: "8px 18px", fontSize: "0.85rem", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Upload size={15} />
                  <span>{profile.avatar || formData.avatar ? "Change Photo" : "Upload Photo"}</span>
                </button>

                {(profile.avatar || formData.avatar) && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={isUploadingPhoto}
                    className="btn-secondary"
                    style={{
                      padding: "8px 16px",
                      fontSize: "0.85rem",
                      borderRadius: "6px",
                      color: "#B42318",
                      borderColor: "#FECDCA",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Remove</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: Personal Details */}
      <div className="card-surface profile-section-card" style={{ padding: "28px" }}>
        <div className="profile-section-header" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <div className="profile-section-icon" style={{ padding: "8px", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-surface-elevated)", border: "1px solid var(--border-color)", color: "var(--gold)" }}>
            <User size={20} />
          </div>
          <div>
            <h3 className="profile-section-title" style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
              1. Personal Details
            </h3>
            <span className="profile-section-subtitle" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Legal identity and contact info</span>
          </div>
        </div>

        <div className="profile-form-grid profile-personal-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px" }}>
          <div className="field-full">
            <label style={labelStyle}>Full Legal Name *</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData?.personal?.fullName ?? ""}
              onChange={(e) => handlePersonalChange("fullName", e.target.value)}
              style={inputStyle(isEditing, errors.fullName)}
            />
            {errors.fullName && <span style={errorStyle}>{errors.fullName}</span>}
          </div>

          <div className="field-short">
            <label style={labelStyle}>Age *</label>
            <input
              type="number"
              disabled={!isEditing}
              value={formData?.personal?.age ?? ""}
              onChange={(e) => handlePersonalChange("age", e.target.value)}
              style={inputStyle(isEditing, errors.age)}
            />
            {errors.age && <span style={errorStyle}>{errors.age}</span>}
          </div>

          <div className="field-short">
            <label style={labelStyle}>Gender *</label>
            <select
              disabled={!isEditing}
              value={(() => {
                const g = String(formData?.personal?.gender || "").toLowerCase().replace(/[-\s]+/g, "_");
                if (["female", "male", "non_binary", "transgender", "other", "prefer_not_to_say"].includes(g)) return g;
                return "prefer_not_to_say";
              })()}
              onChange={(e) => handlePersonalChange("gender", e.target.value)}
              style={inputStyle(isEditing)}
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non_binary">Non-Binary</option>
              <option value="transgender">Transgender</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          <div className="field-full">
            <label style={labelStyle}>Primary City *</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData?.personal?.city ?? ""}
              onChange={(e) => handlePersonalChange("city", e.target.value)}
              style={inputStyle(isEditing)}
            />
          </div>

          <div className="field-full">
            <label style={labelStyle}>Contact Phone *</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData?.personal?.phone ?? ""}
              onChange={(e) => handlePersonalChange("phone", e.target.value)}
              style={inputStyle(isEditing, errors.phone)}
            />
            {errors.phone && <span style={errorStyle}>{errors.phone}</span>}
          </div>

          <div className="field-full">
            <label style={labelStyle}>Contact Email *</label>
            <input
              type="email"
              disabled={!isEditing}
              value={formData?.personal?.email ?? ""}
              onChange={(e) => handlePersonalChange("email", e.target.value)}
              style={inputStyle(isEditing, errors.email)}
            />
            {errors.email && <span style={errorStyle}>{errors.email}</span>}
          </div>

          <div className="field-full" style={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
              <label style={labelStyle}>Professional Bio &amp; Monologue Summary (200 - 1000 characters)</label>
              <span style={{ fontSize: "0.75rem", color: (formData?.personal?.bio?.length || 0) > 1000 ? "var(--danger)" : "var(--text-muted)" }}>
                {formData?.personal?.bio?.length || 0} / 1000
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={1000}
              disabled={!isEditing}
              value={formData?.personal?.bio ?? ""}
              onChange={(e) => handlePersonalChange("bio", e.target.value)}
              style={{ ...inputStyle(isEditing, errors.bio), resize: "vertical" }}
            />
            {errors.bio && <span style={errorStyle}>{errors.bio}</span>}
          </div>
        </div>
      </div>

      {/* SECTION 2: Child Artist Guardian Consent (Shown ONLY if age < 18) */}
      {isMinor && (
        <div
          className="card-surface profile-section-card profile-guardian-card"
          style={{
            backgroundColor: "var(--bg-surface-elevated)",
            border: `1px solid ${errors.guardianName || errors.consentGiven ? "var(--danger)" : "var(--border-color)"}`,
            padding: "28px",
          }}
        >
          <div className="profile-section-header" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <div className="profile-section-icon" style={{ padding: "8px", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-surface-elevated)", border: "1px solid var(--border-color)", color: "var(--warning)" }}>
              <ShieldAlert size={20} style={{ color: "var(--warning)" }} />
            </div>
            <div>
              <h3 className="profile-section-title" style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                Child Artist Legal Guardian Consent (Under 18)
              </h3>
              <span className="profile-section-subtitle" style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                Required under Indian Child Labor and Entertainment Protection Guidelines
              </span>
            </div>
          </div>

          <div className="profile-form-grid profile-guardian-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "16px" }}>
            <div className="field-full">
              <label style={labelStyle}>Guardian Legal Full Name *</label>
              <input
                type="text"
                disabled={!isEditing}
                placeholder="Parent / Legal Guardian Name"
                value={formData.guardianConsent?.guardianName || ""}
                onChange={(e) => handleGuardianChange("guardianName", e.target.value)}
                style={inputStyle(isEditing, errors.guardianName)}
              />
              {errors.guardianName && <span style={errorStyle}>{errors.guardianName}</span>}
            </div>

            <div className="field-short">
              <label style={labelStyle}>Relationship to Artist *</label>
              <input
                type="text"
                disabled={!isEditing}
                placeholder="Mother / Father / Legal Guardian"
                value={formData.guardianConsent?.relation || ""}
                onChange={(e) => handleGuardianChange("relation", e.target.value)}
                style={inputStyle(isEditing)}
              />
            </div>

            <div className="field-short">
              <label style={labelStyle}>Guardian Contact Phone *</label>
              <input
                type="text"
                disabled={!isEditing}
                placeholder="+91 98765 00000"
                value={formData.guardianConsent?.phone || ""}
                onChange={(e) => handleGuardianChange("phone", e.target.value)}
                style={inputStyle(isEditing, errors.guardianPhone)}
              />
              {errors.guardianPhone && <span style={errorStyle}>{errors.guardianPhone}</span>}
            </div>

            <div className="field-full">
              <label style={labelStyle}>Government ID Upload (Aadhaar / Passport)</label>
              <div
                style={{
                  backgroundColor: "var(--bg-input)",
                  border: "1px dashed var(--border-color)",
                  borderRadius: "var(--radius-input)",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                }}
              >
                <span>Guardian_ID_Proof.pdf</span>
                <span style={{ color: "var(--success)", fontSize: "0.75rem", fontWeight: "600" }}>Verified</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginTop: "8px" }}>
            <input
              type="checkbox"
              id="guardian-consent-check"
              disabled={!isEditing}
              checked={formData.guardianConsent?.consentGiven || false}
              onChange={(e) => handleGuardianChange("consentGiven", e.target.checked)}
              style={{ marginTop: "4px", accentColor: "var(--gold)" }}
            />
            <label htmlFor="guardian-consent-check" style={{ fontSize: "0.825rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
              I hereby declare that I am the legal parent/guardian of the minor artist and authorize Vismaya platform to manage audition applications and bookings under adult supervision.
            </label>
          </div>
          {errors.consentGiven && <span style={errorStyle}>{errors.consentGiven}</span>}
        </div>
      )}

      {/* SECTION 3: Physical Attributes */}
      <div className="card-surface profile-section-card" style={{ padding: "28px" }}>
        <div className="profile-section-header" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <div className="profile-section-icon" style={{ padding: "8px", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-surface-elevated)", border: "1px solid var(--border-color)", color: "var(--gold)" }}>
            <Activity size={20} />
          </div>
          <div>
            <h3 className="profile-section-title" style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
              2. Physical Attributes &amp; Look
            </h3>
            <span className="profile-section-subtitle" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Accurate measurements used by casting directors</span>
          </div>
        </div>

        <div className="profile-form-grid profile-physical-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "18px" }}>
          <div className="field-short">
            <label style={labelStyle}>Height (cm / ft)</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData?.physical?.height || ""}
              onChange={(e) => handlePhysicalChange("height", e.target.value)}
              style={inputStyle(isEditing)}
            />
          </div>

          <div className="field-short">
            <label style={labelStyle}>Weight (kg)</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData?.physical?.weight || ""}
              onChange={(e) => handlePhysicalChange("weight", e.target.value)}
              style={inputStyle(isEditing)}
            />
          </div>

          <div className="field-short">
            <label style={labelStyle}>Skin Tone</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData?.physical?.skinTone || ""}
              onChange={(e) => handlePhysicalChange("skinTone", e.target.value)}
              style={inputStyle(isEditing)}
            />
          </div>

          <div className="field-short">
            <label style={labelStyle}>Eye Color</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData?.physical?.eyeColor || ""}
              onChange={(e) => handlePhysicalChange("eyeColor", e.target.value)}
              style={inputStyle(isEditing)}
            />
          </div>

          <div className="field-short">
            <label style={labelStyle}>Hair Color &amp; Length</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData?.physical?.hairColor || ""}
              onChange={(e) => handlePhysicalChange("hairColor", e.target.value)}
              style={inputStyle(isEditing)}
            />
          </div>

          <div className="field-short">
            <label style={labelStyle}>Chest - Waist - Hips</label>
            <input
              type="text"
              disabled={!isEditing}
              value={`${formData?.physical?.chest || ""} - ${formData?.physical?.waist || ""} - ${formData?.physical?.hips || ""}`}
              onChange={(e) => {
                const parts = e.target.value.split("-");
                if (parts[0]) handlePhysicalChange("chest", parts[0].trim());
                if (parts[1]) handlePhysicalChange("waist", parts[1].trim());
                if (parts[2]) handlePhysicalChange("hips", parts[2].trim());
              }}
              style={inputStyle(isEditing)}
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: Skills & Languages (Tag Inputs) */}
      <div className="card-surface profile-section-card" style={{ padding: "28px" }}>
        <div className="profile-section-header" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <div className="profile-section-icon" style={{ padding: "8px", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-surface-elevated)", border: "1px solid var(--border-color)", color: "var(--gold)" }}>
            <Award size={20} />
          </div>
          <div>
            <h3 className="profile-section-title" style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
              3. Skills &amp; Spoken Languages
            </h3>
            <span className="profile-section-subtitle" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Specialized artistic abilities and dialect tags</span>
          </div>
        </div>

        {/* Skills Tag Section */}
        <div className="profile-tag-group" style={{ marginBottom: "24px" }}>
          <label style={labelStyle}>Performing Skills &amp; Talents</label>
          <div className="profile-chips-wrap" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
            {(formData?.skills || []).map((skill, idx) => (
              <span
                key={idx}
                className="profile-tag-chip"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: "var(--bg-surface-elevated)",
                  color: "var(--gold)",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  border: "1px solid var(--border-color)",
                }}
              >
                {skill}
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    style={{ color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", background: "none", border: "none" }}
                  >
                    <X size={13} />
                  </button>
                )}
              </span>
            ))}
          </div>

          {isEditing && (
            <div className="profile-tag-input-row" style={{ display: "flex", gap: "8px", maxWidth: "360px" }}>
              <input
                type="text"
                placeholder="Add skill (e.g. Scuba Diving, Guitar)"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                style={inputStyle(true)}
              />
              <button type="button" onClick={addSkill} className="btn-secondary profile-tag-add-btn" style={{ padding: "8px 14px", flexShrink: 0 }}>
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Languages Tag Section */}
        <div className="profile-tag-group">
          <label style={labelStyle}>Languages &amp; Dialects</label>
          <div className="profile-chips-wrap" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
            {(formData?.languages || []).map((lang, idx) => (
              <span
                key={idx}
                className="profile-tag-chip"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: "var(--bg-surface-elevated)",
                  color: "var(--gold)",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  border: "1px solid var(--border-color)",
                }}
              >
                {lang}
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => removeLanguage(lang)}
                    style={{ color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", background: "none", border: "none" }}
                  >
                    <X size={13} />
                  </button>
                )}
              </span>
            ))}
          </div>

          {isEditing && (
            <div className="profile-tag-input-row" style={{ display: "flex", gap: "8px", maxWidth: "360px" }}>
              <input
                type="text"
                placeholder="Add language (e.g. Punjabi (Fluent))"
                value={newLang}
                onChange={(e) => setNewLang(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLanguage())}
                style={inputStyle(true)}
              />
              <button type="button" onClick={addLanguage} className="btn-secondary profile-tag-add-btn" style={{ padding: "8px 14px", flexShrink: 0 }}>
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5: Experience & Training */}
      <div className="card-surface profile-section-card" style={{ padding: "28px" }}>
        <div className="profile-section-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="profile-section-icon" style={{ padding: "8px", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-surface-elevated)", border: "1px solid var(--border-color)", color: "var(--gold)" }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="profile-section-title" style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                4. Experience &amp; Formal Training
              </h3>
              <span className="profile-section-subtitle" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Portfolio credits in film, TV, ads &amp; theater</span>
            </div>
          </div>

          {isEditing && (
            <button type="button" onClick={addExperienceItem} className="btn-secondary profile-add-btn" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
              <Plus size={14} /> Add Experience
            </button>
          )}
        </div>

        {/* Experience List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
          {(formData?.experience || []).map((exp) => (
            <div
              key={exp.id}
              className="profile-exp-card"
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                {isEditing ? (
                  <input
                    type="text"
                    value={exp.project || ""}
                    onChange={(e) => updateExperienceItem(exp.id, "project", e.target.value)}
                    placeholder="Project Name"
                    style={{ ...inputStyle(true), fontWeight: "600", fontSize: "0.95rem" }}
                  />
                ) : (
                  <span style={{ fontWeight: "700", fontSize: "0.95rem", color: "var(--text-primary)" }}>
                    {exp.project}
                  </span>
                )}

                {isEditing && (
                  <button
                    type="button"
                    onClick={() => removeExperienceItem(exp.id)}
                    style={{ color: "var(--danger)", cursor: "pointer", padding: "4px", background: "none", border: "none" }}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              <div className="profile-exp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", fontSize: "0.85rem" }}>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem" }}>Role Character</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={exp.role || ""}
                      onChange={(e) => updateExperienceItem(exp.id, "role", e.target.value)}
                      style={inputStyle(true)}
                    />
                  ) : (
                    <span style={{ color: "var(--text-primary)" }}>{exp.role}</span>
                  )}
                </div>

                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem" }}>Production House</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={exp.production || ""}
                      onChange={(e) => updateExperienceItem(exp.id, "production", e.target.value)}
                      style={inputStyle(true)}
                    />
                  ) : (
                    <span style={{ color: "var(--text-primary)" }}>{exp.production}</span>
                  )}
                </div>

                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem" }}>Year</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={exp.year || ""}
                      onChange={(e) => updateExperienceItem(exp.id, "year", e.target.value)}
                      style={inputStyle(true)}
                    />
                  ) : (
                    <span style={{ color: "var(--text-primary)" }}>{exp.year}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Training List */}
        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "18px" }}>
          <div className="profile-training-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--text-primary)" }}>
              Formal Acting &amp; Performing Arts Training
            </span>
            {isEditing && (
              <button type="button" onClick={addTrainingItem} className="btn-secondary profile-add-btn" style={{ padding: "4px 12px", fontSize: "0.75rem" }}>
                <Plus size={12} /> Add Training
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {(formData?.training || []).map((trn) => (
              <div
                key={trn.id}
                className="profile-trn-card"
                style={{
                  backgroundColor: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, minWidth: 0 }}>
                  {isEditing ? (
                    <div className="profile-trn-inputs" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <input
                        type="text"
                        value={trn.course || ""}
                        onChange={(e) => updateTrainingItem(trn.id, "course", e.target.value)}
                        placeholder="Course / Workshop"
                        style={inputStyle(true)}
                      />
                      <input
                        type="text"
                        value={trn.institute || ""}
                        onChange={(e) => updateTrainingItem(trn.id, "institute", e.target.value)}
                        placeholder="Institute / Studio"
                        style={inputStyle(true)}
                      />
                    </div>
                  ) : (
                    <>
                      <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text-primary)" }}>
                        {trn.course}
                      </span>
                      <span style={{ fontSize: "0.785rem", color: "var(--text-secondary)" }}>
                        {trn.institute} • {trn.year}
                      </span>
                    </>
                  )}
                </div>

                {isEditing && (
                  <button
                    type="button"
                    onClick={() => removeTrainingItem(trn.id)}
                    style={{ color: "var(--danger)", cursor: "pointer", padding: "4px", background: "none", border: "none" }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 6: Availability & Travel Preferences */}
      <div className="card-surface profile-section-card" style={{ padding: "clamp(16px, 3vw, 28px)" }}>
        <div className="profile-section-header" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <div className="profile-section-icon" style={{ padding: "8px", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-surface-elevated)", border: "1px solid var(--border-color)", color: "var(--gold)" }}>
            <MapPin size={20} />
          </div>
          <div>
            <h3 className="profile-section-title" style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
              5. Availability &amp; Location Preferences
            </h3>
            <span className="profile-section-subtitle" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Shoot availability and travel clearance</span>
          </div>
        </div>

        <div className="talent-form-grid profile-avail-grid">
          {/* Willing to Travel Toggle */}
          <div
            className="profile-toggle-card"
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: "44px",
            }}
          >
            <div>
              <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--text-primary)", display: "block" }}>
                Willing to Travel Outstation
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Domestic &amp; International shoots
              </span>
            </div>

            <input
              type="checkbox"
              disabled={!isEditing}
              checked={Boolean(formData?.availability?.willingToTravel)}
              onChange={(e) => handleAvailabilityChange("willingToTravel", e.target.checked)}
              style={{ width: "20px", height: "20px", accentColor: "var(--gold)", cursor: isEditing ? "pointer" : "default" }}
            />
          </div>

          {/* Valid Passport */}
          <div
            className="profile-toggle-card"
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: "44px",
            }}
          >
            <div>
              <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--text-primary)", display: "block" }}>
                Valid Passport for International
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Ready for foreign schedules
              </span>
            </div>

            <input
              type="checkbox"
              disabled={!isEditing}
              checked={Boolean(formData?.availability?.hasPassport)}
              onChange={(e) => handleAvailabilityChange("hasPassport", e.target.checked)}
              style={{ width: "20px", height: "20px", accentColor: "var(--gold)", cursor: isEditing ? "pointer" : "default" }}
            />
          </div>
        </div>

        {/* Preferred Shoot Cities */}
        <div style={{ marginTop: "18px" }}>
          <label style={labelStyle}>Preferred Shoot Hubs</label>
          <div className="profile-chips-wrap" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
            {(formData?.availability?.preferredCities || []).map((city, idx) => (
              <span
                key={idx}
                className="profile-tag-chip"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 14px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: "var(--bg-surface-elevated)",
                  color: "var(--gold)",
                  fontSize: "0.825rem",
                  fontWeight: "600",
                  border: "1px solid var(--border-color)",
                }}
              >
                {city}
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => removeCity(city)}
                    style={{ color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", background: "none", border: "none" }}
                  >
                    <X size={12} />
                  </button>
                )}
              </span>
            ))}
          </div>

          {isEditing && (
            <div className="profile-tag-input-row" style={{ display: "flex", gap: "8px", maxWidth: "340px" }}>
              <input
                type="text"
                placeholder="Add city (e.g. Goa, Kolkata)"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCity())}
                style={inputStyle(true)}
              />
              <button type="button" onClick={addCity} className="btn-secondary profile-tag-add-btn" style={{ padding: "8px 14px", flexShrink: 0, minHeight: "44px" }}>
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sticky Action Bar for Edit Mode */}
      {isEditing && (
        <div className="talent-sticky-action-bar">
          <button type="button" onClick={handleCancel} className="btn-secondary">
            <X size={16} />
            <span>Cancel</span>
          </button>
          <button type="button" onClick={handleSave} className="btn-primary">
            <Save size={16} />
            <span>Save Profile</span>
          </button>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 640px) {
          .talent-profile-sections-root {
            gap: 14px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .talent-profile-sections-root.is-editing {
            padding-bottom: 74px !important;
          }

          /* Top Profile Hero Card */
          .profile-hero-card {
            padding: 14px 16px !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
            border-radius: 14px !important;
          }
          .profile-hero-left {
            display: grid !important;
            grid-template-columns: 56px 1fr !important;
            grid-template-areas:
              "avatar info"
              "desc   desc" !important;
            row-gap: 8px !important;
            column-gap: 12px !important;
            align-items: center !important;
            width: 100% !important;
          }
          .profile-hero-avatar-wrap {
            grid-area: avatar !important;
            width: 56px !important;
            height: 56px !important;
          }
          .profile-hero-avatar-wrap img,
          .profile-hero-avatar-wrap > div {
            width: 56px !important;
            height: 56px !important;
          }
          .profile-hero-info {
            grid-area: info !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 3px !important;
            align-items: flex-start !important;
            text-align: left !important;
            min-width: 0 !important;
          }
          .profile-hero-title-row {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 3px !important;
            width: 100% !important;
          }
          .profile-hero-name {
            font-family: var(--font-heading), 'Playfair Display', Georgia, serif !important;
            font-size: 20px !important;
            line-height: 1.25 !important;
            text-align: left !important;
            color: #2B2D2A !important;
            margin: 0 !important;
          }
          .profile-hero-badge :global(span) {
            font-size: 10.5px !important;
            padding: 2px 7px !important;
          }
          .profile-hero-status-note {
            grid-area: desc !important;
            font-size: 13px !important;
            line-height: 1.5 !important;
            text-align: left !important;
            color: #5A584F !important;
            margin: 0 !important;
          }
          .profile-action-group {
            width: 100% !important;
            margin-top: 2px !important;
          }
          .profile-edit-btn {
            width: 100% !important;
            height: 42px !important;
            min-height: 42px !important;
            font-size: 12px !important;
            font-weight: 700 !important;
            letter-spacing: 0.05em !important;
            text-transform: uppercase !important;
            justify-content: center !important;
            box-sizing: border-box !important;
            border-radius: 10px !important;
          }
          .profile-editing-btn-row {
            display: grid !important;
            grid-template-columns: 1fr 1.5fr !important;
            gap: 8px !important;
            width: 100% !important;
          }
          .profile-editing-btn-row button {
            height: 42px !important;
            min-height: 42px !important;
            font-size: 12px !important;
            justify-content: center !important;
            border-radius: 10px !important;
          }

          /* Profile Strength Live Meter Card */
          .profile-meter-card {
            padding: 14px 16px !important;
            border-radius: 14px !important;
          }
          .profile-meter-header {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            margin-bottom: 8px !important;
            gap: 8px !important;
          }
          .profile-meter-title {
            font-size: 15px !important;
            font-weight: 700 !important;
            color: #2B2D2A !important;
          }
          .profile-meter-score {
            font-size: 14px !important;
            font-weight: 700 !important;
            color: #8A6B2E !important;
            white-space: nowrap !important;
          }
          .profile-meter-card :global(.progress-bar-container) {
            height: 7px !important;
            border-radius: 999px !important;
          }
          .profile-meter-card :global(.progress-bar-fill) {
            background: #8A6B2E !important;
          }
          .profile-checklist-container {
            display: flex !important;
            flex-direction: column !important;
            gap: 7px !important;
            margin-top: 12px !important;
            width: 100% !important;
          }
          .profile-checklist-pill {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            height: 35px !important;
            min-height: 35px !important;
            padding: 0 12px !important;
            border-radius: 8px !important;
            background-color: #F3EFE6 !important;
            border: 1px solid #E8E2D4 !important;
            color: #2B2D2A !important;
            font-size: 12.5px !important;
            font-weight: 500 !important;
            box-sizing: border-box !important;
            width: 100% !important;
          }
          .profile-checklist-pill :global(svg) {
            width: 14px !important;
            height: 14px !important;
            color: #8A6B2E !important;
            flex-shrink: 0 !important;
          }

          /* Artist Profile Photo Card */
          .profile-photo-card {
            padding: 14px 16px !important;
            border-radius: 14px !important;
          }
          .profile-photo-inner {
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
            width: 100% !important;
          }
          .profile-photo-top-row {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            gap: 14px !important;
            flex-wrap: nowrap !important;
            width: 100% !important;
          }
          .profile-photo-avatar {
            width: 84px !important;
            height: 84px !important;
            min-width: 84px !important;
            border-width: 2px !important;
          }
          .profile-photo-avatar span {
            font-size: 26px !important;
          }
          .profile-photo-details {
            display: flex !important;
            flex-direction: column !important;
            gap: 3px !important;
            min-width: 0 !important;
            flex: 1 !important;
          }
          .profile-photo-title {
            font-size: 17px !important;
            line-height: 1.25 !important;
          }
          .profile-photo-desc {
            font-size: 12.5px !important;
            line-height: 1.4 !important;
          }
          .profile-photo-btn-group {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
            width: 100% !important;
            margin-top: 2px !important;
          }
          .profile-photo-btn-group button {
            width: 100% !important;
            height: 40px !important;
            min-height: 40px !important;
            padding: 0 8px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            letter-spacing: 0.04em !important;
            text-transform: uppercase !important;
            border-radius: 8px !important;
            justify-content: center !important;
            box-sizing: border-box !important;
          }
          .profile-photo-btn-group button:only-child {
            grid-column: 1 / -1 !important;
          }

          /* Form Section Cards */
          .profile-section-card {
            padding: 14px 16px !important;
            border-radius: 14px !important;
          }
          .profile-section-header {
            gap: 10px !important;
            margin-bottom: 12px !important;
          }
          .profile-section-icon {
            width: 32px !important;
            height: 32px !important;
            min-width: 32px !important;
            padding: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: 8px !important;
          }
          .profile-section-icon :global(svg) {
            width: 16px !important;
            height: 16px !important;
          }
          .profile-section-title {
            font-size: 17.5px !important;
            line-height: 1.25 !important;
          }
          .profile-section-subtitle {
            font-size: 12px !important;
            line-height: 1.35 !important;
          }

          /* Mobile Form Grids: Single-column on mobile, only Age+Gender and Height+Weight pairs stay 2 columns */
          .profile-form-grid {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 12px 12px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .field-full,
          .field-short,
          .profile-form-grid > * {
            grid-column: 1 / -1 !important;
            min-width: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          /* Allowed short pairs on mobile where inputs are >= 120px */
          .profile-personal-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .profile-personal-grid > :nth-child(2),
          .profile-personal-grid > :nth-child(3) {
            grid-column: span 1 !important;
          }
          .profile-physical-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .profile-physical-grid > :nth-child(1),
          .profile-physical-grid > :nth-child(2) {
            grid-column: span 1 !important;
          }
          .profile-section-card input[type="text"],
          .profile-section-card input[type="number"],
          .profile-section-card input[type="email"],
          .profile-section-card select {
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            height: 42px !important;
            min-height: 42px !important;
            font-size: 16px !important;
            padding: 0 12px !important;
            border-radius: 10px !important;
            background-color: #F3EFE6 !important;
            border: 1px solid #E8E2D4 !important;
            box-sizing: border-box !important;
            color: #2B2D2A !important;
            text-overflow: ellipsis !important;
          }
          .profile-section-card select {
            padding-right: 32px !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
            overflow: hidden !important;
          }
          .profile-section-card textarea {
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            font-size: 16px !important;
            padding: 10px 12px !important;
            border-radius: 10px !important;
            background-color: #F3EFE6 !important;
            border: 1px solid #E8E2D4 !important;
            min-height: 96px !important;
            height: auto !important;
            box-sizing: border-box !important;
            color: #2B2D2A !important;
            line-height: 1.4 !important;
            resize: vertical !important;
            overflow-x: hidden !important;
            overflow-y: auto !important;
          }
          .profile-section-card label {
            font-size: 12px !important;
            font-weight: 600 !important;
            line-height: 1.3 !important;
            margin-bottom: 4px !important;
            color: #2B2D2A !important;
            width: 100% !important;
            max-width: 100% !important;
            display: block !important;
          }

          /* Chips and Tags */
          .profile-tag-group {
            margin-bottom: 16px !important;
          }
          .profile-chips-wrap {
            gap: 6px !important;
            margin-bottom: 8px !important;
          }
          .profile-tag-chip {
            height: 29px !important;
            min-height: 29px !important;
            padding: 0 10px !important;
            font-size: 12px !important;
            border-radius: 999px !important;
            gap: 5px !important;
            border: 1px solid #E8E2D4 !important;
            background-color: #F3EFE6 !important;
            color: #8A6B2E !important;
          }
          .profile-tag-input-row {
            max-width: 100% !important;
          }
          .profile-tag-input-row input {
            height: 42px !important;
            min-height: 42px !important;
            font-size: 16px !important;
            border-radius: 10px !important;
          }
          .profile-tag-add-btn {
            height: 42px !important;
            min-height: 42px !important;
            border-radius: 10px !important;
          }

          /* Experience & Training */
          .profile-add-btn {
            padding: 5px 12px !important;
            font-size: 12px !important;
            border-radius: 8px !important;
          }
          .profile-exp-card,
          .profile-trn-card {
            padding: 12px 14px !important;
            border-radius: 10px !important;
            gap: 8px !important;
          }
          .profile-exp-grid {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .profile-trn-inputs {
            grid-template-columns: 1fr !important;
            gap: 6px !important;
          }
          .profile-exp-card input,
          .profile-trn-card input {
            height: 40px !important;
            min-height: 40px !important;
            font-size: 16px !important;
            border-radius: 8px !important;
          }

          /* Availability */
          .profile-avail-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
          }
          .profile-toggle-card {
            padding: 10px 14px !important;
            min-height: 42px !important;
            border-radius: 10px !important;
          }
        }

        @media (max-width: 400px) {
          .profile-hero-name {
            font-size: 18.5px !important;
          }
          .profile-form-grid {
            gap: 8px 8px !important;
          }
          .profile-section-card {
            padding: 12px 14px !important;
          }
        }
      `}</style>
    </div>
  );
}

// Styling Helpers
const labelStyle = {
  display: "block",
  fontSize: "0.825rem",
  fontWeight: "600",
  color: "var(--text-secondary)",
  marginBottom: "8px",
};

const inputStyle = (isEditing, hasError) => ({
  width: "100%",
  minHeight: "44px",
  padding: "10px 14px",
  backgroundColor: isEditing ? "var(--bg-input)" : "var(--bg-surface-elevated)",
  border: `1px solid ${hasError ? "var(--danger)" : isEditing ? "var(--border-color)" : "var(--border-subtle)"}`,
  borderRadius: "var(--radius-input)",
  color: "var(--text-primary)",
  fontSize: "0.875rem",
  outline: "none",
  cursor: isEditing ? "text" : "default",
  transition: "border-color var(--transition)",
  boxSizing: "border-box",
});

const errorStyle = {
  fontSize: "0.75rem",
  color: "var(--danger)",
  marginTop: "4px",
  display: "block",
};
