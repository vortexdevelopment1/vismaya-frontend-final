"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import ProgressBar from "@/components/shared/ProgressBar";
import { useTalent } from "@/lib/talent/TalentContext";

export default function ProfileSections() {
  const {
    profile,
    updateProfile,
    profileCompletionScore,
    profileChecklist
  } = useTalent();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);
  const [errors, setErrors] = useState({});

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

  const isMinor = Number(formData.personal.age) < 18;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Top Header Card: Status, Live Score & Edit Toggle */}
      <div
        className="card-surface"
        style={{
          padding: "24px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundImage: `url(${formData.avatar})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              border: "2px solid var(--border-color)",
              boxShadow: "var(--shadow-sm)",
              flexShrink: 0,
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h2 style={{ fontSize: "1.35rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                {formData.personal.fullName}
              </h2>
              <StatusBadge status={profile.status} size="sm" />
            </div>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              {profile.statusNote}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="profile-action-group" style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary"
              style={{ padding: "10px 22px", fontSize: "0.9rem", minHeight: "40px" }}
            >
              <Edit3 size={16} />
              <span>Edit Profile Details</span>
            </button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={handleCancel}
                className="btn-secondary"
                style={{ padding: "10px 18px", fontSize: "0.9rem", minHeight: "40px" }}
              >
                <X size={16} />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                className="btn-primary"
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
        className="card-surface"
        style={{
          padding: "20px 24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-primary)" }}>
            Profile Strength &amp; Verification Score
          </span>
          <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "var(--gold)" }}>
            {profileCompletionScore}% Complete
          </span>
        </div>

        <ProgressBar value={profileCompletionScore} height="10px" showPercentage={false} />

        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "14px" }}>
          {profileChecklist.map((item, idx) => (
            <div
              key={idx}
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

      {/* SECTION 1: Personal Details */}
      <div className="card-surface" style={{ padding: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <div style={{ padding: "8px", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-surface-elevated)", border: "1px solid var(--border-color)", color: "var(--gold)" }}>
            <User size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
              1. Personal Details
            </h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Legal identity and contact info</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px" }}>
          <div>
            <label style={labelStyle}>Full Legal Name *</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData.personal.fullName}
              onChange={(e) => handlePersonalChange("fullName", e.target.value)}
              style={inputStyle(isEditing, errors.fullName)}
            />
            {errors.fullName && <span style={errorStyle}>{errors.fullName}</span>}
          </div>

          <div>
            <label style={labelStyle}>Age *</label>
            <input
              type="number"
              disabled={!isEditing}
              value={formData.personal.age}
              onChange={(e) => handlePersonalChange("age", e.target.value)}
              style={inputStyle(isEditing, errors.age)}
            />
            {errors.age && <span style={errorStyle}>{errors.age}</span>}
          </div>

          <div>
            <label style={labelStyle}>Gender *</label>
            <select
              disabled={!isEditing}
              value={formData.personal.gender}
              onChange={(e) => handlePersonalChange("gender", e.target.value)}
              style={inputStyle(isEditing)}
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Non-Binary">Non-Binary</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Primary City *</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData.personal.city}
              onChange={(e) => handlePersonalChange("city", e.target.value)}
              style={inputStyle(isEditing)}
            />
          </div>

          <div>
            <label style={labelStyle}>Contact Phone *</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData.personal.phone}
              onChange={(e) => handlePersonalChange("phone", e.target.value)}
              style={inputStyle(isEditing, errors.phone)}
            />
            {errors.phone && <span style={errorStyle}>{errors.phone}</span>}
          </div>

          <div>
            <label style={labelStyle}>Contact Email *</label>
            <input
              type="email"
              disabled={!isEditing}
              value={formData.personal.email}
              onChange={(e) => handlePersonalChange("email", e.target.value)}
              style={inputStyle(isEditing, errors.email)}
            />
            {errors.email && <span style={errorStyle}>{errors.email}</span>}
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Professional Bio &amp; Monologue Summary</label>
            <textarea
              rows={3}
              disabled={!isEditing}
              value={formData.personal.bio}
              onChange={(e) => handlePersonalChange("bio", e.target.value)}
              style={{ ...inputStyle(isEditing), resize: "vertical" }}
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Child Artist Guardian Consent (Shown ONLY if age < 18) */}
      {isMinor && (
        <div
          className="card-surface"
          style={{
            backgroundColor: "var(--bg-surface-elevated)",
            border: `1px solid ${errors.guardianName || errors.consentGiven ? "var(--danger)" : "var(--border-color)"}`,
            padding: "28px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <ShieldAlert size={22} style={{ color: "var(--warning)" }} />
            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                Child Artist Legal Guardian Consent (Under 18)
              </h3>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                Required under Indian Child Labor and Entertainment Protection Guidelines
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "16px" }}>
            <div>
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

            <div>
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

            <div>
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

            <div>
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
      <div className="card-surface" style={{ padding: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <div style={{ padding: "8px", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-surface-elevated)", border: "1px solid var(--border-color)", color: "var(--gold)" }}>
            <Activity size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
              2. Physical Attributes &amp; Look
            </h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Accurate measurements used by casting directors</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "18px" }}>
          <div>
            <label style={labelStyle}>Height (cm / ft)</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData.physical.height}
              onChange={(e) => handlePhysicalChange("height", e.target.value)}
              style={inputStyle(isEditing)}
            />
          </div>

          <div>
            <label style={labelStyle}>Weight (kg)</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData.physical.weight}
              onChange={(e) => handlePhysicalChange("weight", e.target.value)}
              style={inputStyle(isEditing)}
            />
          </div>

          <div>
            <label style={labelStyle}>Skin Tone</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData.physical.skinTone}
              onChange={(e) => handlePhysicalChange("skinTone", e.target.value)}
              style={inputStyle(isEditing)}
            />
          </div>

          <div>
            <label style={labelStyle}>Hair Color &amp; Length</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData.physical.hairColor}
              onChange={(e) => handlePhysicalChange("hairColor", e.target.value)}
              style={inputStyle(isEditing)}
            />
          </div>

          <div>
            <label style={labelStyle}>Eye Color</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData.physical.eyeColor}
              onChange={(e) => handlePhysicalChange("eyeColor", e.target.value)}
              style={inputStyle(isEditing)}
            />
          </div>

          <div>
            <label style={labelStyle}>Chest - Waist - Hips</label>
            <input
              type="text"
              disabled={!isEditing}
              value={`${formData.physical.chest} - ${formData.physical.waist} - ${formData.physical.hips}`}
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
      <div className="card-surface" style={{ padding: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <div style={{ padding: "8px", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-surface-elevated)", border: "1px solid var(--border-color)", color: "var(--gold)" }}>
            <Award size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
              3. Skills &amp; Spoken Languages
            </h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Specialized artistic abilities and dialect tags</span>
          </div>
        </div>

        {/* Skills Tag Section */}
        <div style={{ marginBottom: "24px" }}>
          <label style={labelStyle}>Performing Skills &amp; Talents</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
            {formData.skills.map((skill, idx) => (
              <span
                key={idx}
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
                    style={{ color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}
                  >
                    <X size={13} />
                  </button>
                )}
              </span>
            ))}
          </div>

          {isEditing && (
            <div style={{ display: "flex", gap: "8px", maxWidth: "360px" }}>
              <input
                type="text"
                placeholder="Add skill (e.g. Scuba Diving, Guitar)"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                style={inputStyle(true)}
              />
              <button type="button" onClick={addSkill} className="btn-secondary" style={{ padding: "8px 14px", flexShrink: 0 }}>
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Languages Tag Section */}
        <div>
          <label style={labelStyle}>Languages &amp; Dialects</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
            {formData.languages.map((lang, idx) => (
              <span
                key={idx}
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
                    style={{ color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}
                  >
                    <X size={13} />
                  </button>
                )}
              </span>
            ))}
          </div>

          {isEditing && (
            <div style={{ display: "flex", gap: "8px", maxWidth: "360px" }}>
              <input
                type="text"
                placeholder="Add language (e.g. Punjabi (Fluent))"
                value={newLang}
                onChange={(e) => setNewLang(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLanguage())}
                style={inputStyle(true)}
              />
              <button type="button" onClick={addLanguage} className="btn-secondary" style={{ padding: "8px 14px", flexShrink: 0 }}>
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5: Experience & Training */}
      <div className="card-surface" style={{ padding: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ padding: "8px", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-surface-elevated)", border: "1px solid var(--border-color)", color: "var(--gold)" }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                4. Experience &amp; Formal Training
              </h3>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Portfolio credits in film, TV, ads &amp; theater</span>
            </div>
          </div>

          {isEditing && (
            <button type="button" onClick={addExperienceItem} className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
              <Plus size={14} /> Add Experience
            </button>
          )}
        </div>

        {/* Experience List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
          {formData.experience.map((exp) => (
            <div
              key={exp.id}
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
                    value={exp.project}
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
                    style={{ color: "var(--danger)", cursor: "pointer", padding: "4px" }}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", fontSize: "0.85rem" }}>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem" }}>Role Character</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={exp.role}
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
                      value={exp.production}
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
                      value={exp.year}
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--text-primary)" }}>
              Formal Acting &amp; Performing Arts Training
            </span>
            {isEditing && (
              <button type="button" onClick={addTrainingItem} className="btn-secondary" style={{ padding: "4px 12px", fontSize: "0.75rem" }}>
                <Plus size={12} /> Add Training
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {formData.training.map((trn) => (
              <div
                key={trn.id}
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
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
                  {isEditing ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <input
                        type="text"
                        value={trn.course}
                        onChange={(e) => updateTrainingItem(trn.id, "course", e.target.value)}
                        placeholder="Course / Workshop"
                        style={inputStyle(true)}
                      />
                      <input
                        type="text"
                        value={trn.institute}
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
                    style={{ color: "var(--danger)", cursor: "pointer", padding: "4px" }}
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
      <div className="card-surface" style={{ padding: "clamp(16px, 3vw, 28px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <div style={{ padding: "8px", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-surface-elevated)", border: "1px solid var(--border-color)", color: "var(--gold)" }}>
            <MapPin size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
              5. Availability &amp; Location Preferences
            </h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Shoot availability and travel clearance</span>
          </div>
        </div>

        <div className="talent-form-grid">
          {/* Willing to Travel Toggle */}
          <div
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
              checked={formData.availability.willingToTravel}
              onChange={(e) => handleAvailabilityChange("willingToTravel", e.target.checked)}
              style={{ width: "20px", height: "20px", accentColor: "var(--gold)", cursor: isEditing ? "pointer" : "default" }}
            />
          </div>

          {/* Valid Passport */}
          <div
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
              checked={formData.availability.hasPassport}
              onChange={(e) => handleAvailabilityChange("hasPassport", e.target.checked)}
              style={{ width: "20px", height: "20px", accentColor: "var(--gold)", cursor: isEditing ? "pointer" : "default" }}
            />
          </div>
        </div>

        {/* Preferred Shoot Cities */}
        <div style={{ marginTop: "18px" }}>
          <label style={labelStyle}>Preferred Shoot Hubs</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
            {(formData.availability.preferredCities || []).map((city, idx) => (
              <span
                key={idx}
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
            <div style={{ display: "flex", gap: "8px", maxWidth: "340px" }}>
              <input
                type="text"
                placeholder="Add city (e.g. Goa, Kolkata)"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCity())}
                style={inputStyle(true)}
              />
              <button type="button" onClick={addCity} className="btn-secondary" style={{ padding: "8px 14px", flexShrink: 0, minHeight: "44px" }}>
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
