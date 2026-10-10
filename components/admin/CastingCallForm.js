"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Megaphone,
  Save,
  CheckCircle,
  Calendar,
  DollarSign,
  MapPin,
  Film,
  Users,
  FileCheck,
} from "lucide-react";

const PROJECT_TYPES = [
  "OTT Series",
  "Feature Film",
  "Commercial / TVC",
  "Short Film",
  "Music Video",
  "Theater",
  "Print / Editorial",
  "Documentary",
];

const BUDGET_TYPES = ["Paid", "Unpaid", "Travel + Stay", "TBA"];

const MATERIAL_OPTIONS = [
  "Commercial Headshot",
  "Full Body Look",
  "Dramatic Video Showreel",
  "Audition Monologue Self-Tape",
  "Dance / Stunt Video",
  "Voice Modulation Audio Clip",
  "Natural Light Comp-Card",
];

export default function CastingCallForm({
  isOpen,
  onClose,
  initialData = null, // if editing or publishing from requirement
  requirementId = null, // if opened directly from requirement
  onSubmit, // (callData, isDraft) => void
}) {
  const [formData, setFormData] = useState({
    title: "",
    projectTitle: "",
    category: "OTT Series",
    recruiterName: "Vismaya Casting Desk",
    city: "Mumbai",
    shootLocation: "Mumbai Studios",
    shootStartDate: "",
    shootEndDate: "",
    deadline: "",
    budgetType: "Paid",
    budgetAmount: "₹50,000 / day",
    budgetLabel: "₹50,000 / day",
    description: "",
    eligibility: "Open to verified Vismaya artists matching age & language requirements.",
    requiredMaterials: ["Commercial Headshot", "Audition Monologue Self-Tape"],
    roles: [
      {
        id: "r-" + Date.now(),
        roleName: "Lead Character",
        artistsCount: 1,
        ageRange: "20 - 28 years",
        gender: "Any",
        look: "Sharp, photogenic contemporary look",
        language: "Hindi, English",
        skills: "Screen Acting, Voice Modulation",
        notes: "",
      },
    ],
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || initialData.projectTitle || "",
        projectTitle: initialData.projectTitle || initialData.title || "",
        category: initialData.category || initialData.projectType || initialData.type || "OTT Series",
        recruiterName: initialData.recruiterName || initialData.company || "Zee Films",
        city: initialData.city || initialData.locations || "Mumbai",
        shootLocation: initialData.shootLocation || initialData.locations || "Mumbai Film City",
        shootStartDate: initialData.shootStartDate || "",
        shootEndDate: initialData.shootEndDate || "",
        deadline: initialData.deadline || "",
        budgetType: initialData.budgetType || "Paid",
        budgetAmount: initialData.budgetAmount || initialData.budget || initialData.budgetRange || "₹50,000 / day",
        budgetLabel: initialData.budgetLabel || initialData.budget || initialData.budgetRange || "₹50,000 / day",
        description: initialData.description || "",
        eligibility: initialData.eligibility || "Open to verified Vismaya artists matching age & language specs.",
        requiredMaterials: initialData.requiredMaterials && initialData.requiredMaterials.length > 0
          ? initialData.requiredMaterials
          : ["Commercial Headshot", "Audition Monologue Self-Tape"],
        roles: initialData.roles && initialData.roles.length > 0
          ? initialData.roles.map((r, i) => ({
              id: r.id || `r-${Date.now()}-${i}`,
              roleName: r.roleName || r.name || `Role ${i + 1}`,
              artistsCount: r.artistsCount || 1,
              ageRange: r.ageRange || "20 - 30 years",
              gender: r.gender || "Any",
              look: r.look || "",
              language: r.language || "Hindi, English",
              skills: r.skills || "Screen Acting",
              notes: r.notes || "",
            }))
          : [
              {
                id: "r-" + Date.now(),
                roleName: "Lead Role",
                artistsCount: 1,
                ageRange: "20 - 28 years",
                gender: "Any",
                look: "",
                language: "Hindi",
                skills: "Screen Acting",
                notes: "",
              },
            ],
      });
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleMaterial = (mat) => {
    setFormData((prev) => {
      const exists = prev.requiredMaterials.includes(mat);
      if (exists) {
        return {
          ...prev,
          requiredMaterials: prev.requiredMaterials.filter((m) => m !== mat),
        };
      } else {
        return {
          ...prev,
          requiredMaterials: [...prev.requiredMaterials, mat],
        };
      }
    });
  };

  const handleAddRole = () => {
    const newRole = {
      id: "r-" + Date.now(),
      roleName: `Character Role ${formData.roles.length + 1}`,
      artistsCount: 1,
      ageRange: "20 - 30 years",
      gender: "Any",
      look: "",
      language: "Hindi, English",
      skills: "Screen Acting",
      notes: "",
    };
    setFormData((prev) => ({ ...prev, roles: [...prev.roles, newRole] }));
  };

  const handleRoleChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.roles];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, roles: updated };
    });
  };

  const handleRemoveRole = (index) => {
    if (formData.roles.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.filter((_, idx) => idx !== index),
    }));
  };

  const handleFormSubmit = (isDraft = false) => {
    if (!formData.title.trim()) {
      alert("Please enter a casting call title.");
      return;
    }

    const payload = {
      ...formData,
      budgetLabel: formData.budgetType === "Paid" ? formData.budgetAmount : formData.budgetType,
    };

    onSubmit(payload, isDraft, requirementId);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(7, 11, 18, 0.75)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 90,
        }}
      />

      {/* Modal / Dialog */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "900px",
          maxWidth: "95vw",
          maxHeight: "92vh",
          backgroundColor: "#121a2b",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                backgroundColor: "rgba(255, 188, 0, 0.12)",
                color: "var(--gold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255, 188, 0, 0.30)",
              }}
            >
              <Megaphone size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
                {initialData?.id ? "Edit Casting Call" : requirementId ? "Publish Casting Call from Requirement" : "Create Public Casting Call"}
              </h2>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                Admin is the sole publisher of verified public casting calls visible to talent.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              padding: "8px",
              borderRadius: "10px",
              color: "var(--text-secondary)",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Section 1: Basic Information */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              1. Project Overview & Title
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Public Casting Call Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai Diaries Season 2 - Lead Doctor & Journalist Roles"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-input)",
                    backgroundColor: "var(--bg-surface-elevated)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Project Category / Type
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-input)",
                    backgroundColor: "var(--bg-surface-elevated)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                  }}
                >
                  {PROJECT_TYPES.map((t) => (
                    <option key={t} value={t} style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Recruiter / Client
                </label>
                <input
                  type="text"
                  value={formData.recruiterName}
                  onChange={(e) => handleChange("recruiterName", e.target.value)}
                  placeholder="e.g. Zee Films"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Primary City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="e.g. Mumbai"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Application Deadline
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleChange("deadline", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Project Description &amp; Synopsis
              </label>
              <textarea
                rows={3}
                placeholder="Provide details on story, context, director, production scale..."
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Section 2: Budget & Shoot Schedule */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              2. Budget &amp; Shoot Logistics
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Budget Type
                </label>
                <select
                  value={formData.budgetType}
                  onChange={(e) => handleChange("budgetType", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                  }}
                >
                  {BUDGET_TYPES.map((bt) => (
                    <option key={bt} value={bt} style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>
                      {bt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Budget Amount / Label
                </label>
                <input
                  type="text"
                  value={formData.budgetAmount}
                  onChange={(e) => handleChange("budgetAmount", e.target.value)}
                  placeholder="e.g. ₹50,000 / day"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Shoot Start Date
                </label>
                <input
                  type="date"
                  value={formData.shootStartDate}
                  onChange={(e) => handleChange("shootStartDate", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Shoot End Date
                </label>
                <input
                  type="date"
                  value={formData.shootEndDate}
                  onChange={(e) => handleChange("shootEndDate", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Specific Shoot Location
              </label>
              <input
                type="text"
                value={formData.shootLocation}
                onChange={(e) => handleChange("shootLocation", e.target.value)}
                placeholder="e.g. Film City Goregaon &amp; Pune Outdoors"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Section 3: Roles Breakdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                3. Character Roles ({formData.roles.length})
              </h3>
              <button
                type="button"
                onClick={handleAddRole}
                style={{
                  padding: "6px 14px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 188, 0, 0.12)",
                  color: "var(--gold)",
                  border: "1px solid rgba(255, 188, 0, 0.30)",
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                }}
              >
                <Plus size={14} /> Add Another Role
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {formData.roles.map((role, idx) => (
                <div
                  key={role.id || idx}
                  style={{
                    padding: "16px",
                    borderRadius: "16px",
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                    }}
                  >
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                      Role #{idx + 1}
                    </span>
                    {formData.roles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRole(idx)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "8px",
                          color: "var(--danger)",
                          backgroundColor: "rgba(255, 107, 107, 0.12)",
                          border: "none",
                          fontSize: "12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                        Role / Character Name *
                      </label>
                      <input
                        type="text"
                        value={role.roleName}
                        onChange={(e) => handleRoleChange(idx, "roleName", e.target.value)}
                        placeholder="e.g. Dr. Tanya Roy (Trauma Specialist)"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "12px",
                          backgroundColor: "rgba(255, 255, 255, 0.06)",
                          border: "1px solid rgba(255, 255, 255, 0.14)",
                          color: "var(--text-primary)",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                        Gender
                      </label>
                      <select
                        value={role.gender}
                        onChange={(e) => handleRoleChange(idx, "gender", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "12px",
                          backgroundColor: "rgba(255, 255, 255, 0.06)",
                          border: "1px solid rgba(255, 255, 255, 0.14)",
                          color: "var(--text-primary)",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      >
                        <option value="Any" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Any Gender</option>
                        <option value="Female" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Female</option>
                        <option value="Male" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Male</option>
                        <option value="Non-Binary" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Non-Binary</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                        Age Range
                      </label>
                      <input
                        type="text"
                        value={role.ageRange}
                        onChange={(e) => handleRoleChange(idx, "ageRange", e.target.value)}
                        placeholder="e.g. 21 - 27 years"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "12px",
                          backgroundColor: "rgba(255, 255, 255, 0.06)",
                          border: "1px solid rgba(255, 255, 255, 0.14)",
                          color: "var(--text-primary)",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                        Look / Visual Appearance
                      </label>
                      <input
                        type="text"
                        value={role.look}
                        onChange={(e) => handleRoleChange(idx, "look", e.target.value)}
                        placeholder="e.g. Sharp, urban doctor look"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "12px",
                          backgroundColor: "rgba(255, 255, 255, 0.06)",
                          border: "1px solid rgba(255, 255, 255, 0.14)",
                          color: "var(--text-primary)",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                        Languages
                      </label>
                      <input
                        type="text"
                        value={role.language}
                        onChange={(e) => handleRoleChange(idx, "language", e.target.value)}
                        placeholder="e.g. Hindi (Fluent), English"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "12px",
                          backgroundColor: "rgba(255, 255, 255, 0.06)",
                          border: "1px solid rgba(255, 255, 255, 0.14)",
                          color: "var(--text-primary)",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                        Special Skills
                      </label>
                      <input
                        type="text"
                        value={role.skills}
                        onChange={(e) => handleRoleChange(idx, "skills", e.target.value)}
                        placeholder="e.g. Fast dialogue, medical gestures"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "12px",
                          backgroundColor: "rgba(255, 255, 255, 0.06)",
                          border: "1px solid rgba(255, 255, 255, 0.14)",
                          color: "var(--text-primary)",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Required Materials & Eligibility */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              4. Submission Materials & Eligibility
            </h3>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>
                Mandatory Talent Materials Required
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px" }}>
                {MATERIAL_OPTIONS.map((mat) => {
                  const isChecked = formData.requiredMaterials.includes(mat);
                  return (
                    <label
                      key={mat}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 12px",
                        borderRadius: "10px",
                        backgroundColor: isChecked ? "rgba(255, 188, 0, 0.12)" : "rgba(255, 255, 255, 0.04)",
                        border: isChecked ? "1px solid var(--gold)" : "1px solid rgba(255, 255, 255, 0.1)",
                        fontSize: "13px",
                        color: isChecked ? "var(--gold)" : "var(--text-secondary)",
                        cursor: "pointer",
                        fontWeight: isChecked ? "600" : "400",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleMaterial(mat)}
                        style={{ accentColor: "var(--gold)" }}
                      />
                      {mat}
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Eligibility &amp; Rules
              </label>
              <input
                type="text"
                value={formData.eligibility}
                onChange={(e) => handleChange("eligibility", e.target.value)}
                placeholder="e.g. Age 21-30, based in Mumbai. Verified Vismaya profiles only."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "18px 24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{
              padding: "9px 18px",
              fontSize: "13px",
              borderRadius: "12px",
            }}
          >
            Cancel
          </button>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => handleFormSubmit(true)}
              className="btn-secondary"
              style={{
                padding: "9px 18px",
                fontSize: "13px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                borderRadius: "12px",
              }}
            >
              <Save size={15} /> Save as Draft
            </button>

            <button
              type="button"
              onClick={() => handleFormSubmit(false)}
              className="btn-primary"
              style={{
                padding: "9px 20px",
                fontSize: "13px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                borderRadius: "12px",
              }}
            >
              <Megaphone size={15} /> Publish Casting Call Live
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
