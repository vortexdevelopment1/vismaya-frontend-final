"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Clock,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Edit2,
  Film,
  Users,
} from "lucide-react";
import { useRecruiter } from "@/lib/recruiter/RecruiterContext";

export default function RequirementForm({ initialData = null }) {
  const router = useRouter();
  const { addRequirement, updateRequirement } = useRecruiter();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [submittedId, setSubmittedId] = useState("");
  const [formErrors, setFormErrors] = useState({});

  // Form State
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    type: initialData?.type || "Film",
    description: initialData?.description || "",
    locations: initialData?.locations || "Mumbai",
    shootStartDate: initialData?.shootStartDate || "2026-11-15",
    shootEndDate: initialData?.shootEndDate || "2026-12-10",
    budgetType: initialData?.budgetType || "Paid",
    budgetRange: initialData?.budgetRange || "₹50,000 - ₹1,00,000 / day",
    deadline: initialData?.deadline || "2026-10-25",
    requiredMaterials: initialData?.requiredMaterials || [
      "Commercial Headshot",
      "Full Body Look",
      "Audition Monologue Self-Tape",
    ],
    roles: initialData?.roles && initialData.roles.length > 0
      ? initialData.roles
      : [
          {
            id: "role-1",
            roleName: "Lead Character Role",
            artistsCount: 1,
            ageRange: "20 - 28 years",
            gender: "Any",
            look: "Contemporary urban screen look",
            language: "Hindi (Fluent)",
            skills: "Camera acting, dramatic monologue",
            notes: "Audition self-tape required.",
          },
        ],
  });

  // Step 1 Validation
  const validateStep1 = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = "Project title is required";
    if (!formData.description.trim()) errors.description = "Project description is required";
    if (!formData.locations.trim()) errors.locations = "Shoot location is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const errors = {};
    if (!formData.roles || formData.roles.length === 0) {
      errors.roles = "Please define at least one character role";
    } else {
      formData.roles.forEach((r, idx) => {
        if (!r.roleName.trim()) {
          errors[`roleName_${idx}`] = "Role name is required";
        }
      });
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    const errors = {};
    if (formData.budgetType === "Paid" && !formData.budgetRange.trim()) {
      errors.budgetRange = "Please specify remuneration amount or range";
    }
    if (!formData.deadline) {
      errors.deadline = "Application deadline date is required";
    }
    if (formData.requiredMaterials.length === 0) {
      errors.requiredMaterials = "Please select at least one required material";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    } else if (currentStep === 3 && validateStep3()) {
      setCurrentStep(4);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setFormErrors({});
      setCurrentStep(currentStep - 1);
    }
  };

  // Roles Manipulation
  const handleAddRole = () => {
    setFormData((prev) => ({
      ...prev,
      roles: [
        ...prev.roles,
        {
          id: "role-" + Date.now(),
          roleName: "",
          artistsCount: 1,
          ageRange: "20 - 28 years",
          gender: "Any",
          look: "Natural expressive face",
          language: "Hindi",
          skills: "Camera acting",
          notes: "",
        },
      ],
    }));
  };

  const handleRemoveRole = (index) => {
    if (formData.roles.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.filter((_, i) => i !== index),
    }));
  };

  const handleRoleChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.roles];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, roles: updated };
    });
  };

  // Material Toggle
  const handleMaterialToggle = (material) => {
    setFormData((prev) => {
      const exists = prev.requiredMaterials.includes(material);
      return {
        ...prev,
        requiredMaterials: exists
          ? prev.requiredMaterials.filter((m) => m !== material)
          : [...prev.requiredMaterials, material],
      };
    });
  };

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2() || !validateStep3()) return;

    if (initialData?.id) {
      updateRequirement({
        ...initialData,
        ...formData,
      });
      setSubmittedId(initialData.id);
    } else {
      const newReq = addRequirement({
        ...formData,
        status: "Submitted",
        statusStage: 1,
        candidatesCount: 0,
        unreviewedCount: 0,
      });
      setSubmittedId(newReq?.id || "req-" + Date.now());
    }

    setIsSubmittedSuccess(true);
  };

  const handleSaveDraft = () => {
    if (!formData.title.trim()) {
      alert("Please provide at least a project title to save draft.");
      return;
    }
    addRequirement({
      ...formData,
      status: "Draft",
      statusStage: 0,
      candidatesCount: 0,
      unreviewedCount: 0,
    });
    router.push("/recruiter/my-requirements");
  };

  const steps = [
    { num: 1, label: "Project Details" },
    { num: 2, label: "Character Roles" },
    { num: 3, label: "Budget & Deadlines" },
    { num: 4, label: "Review & Submit" },
  ];

  const inputStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    borderRadius: "12px",
    padding: "10px 14px",
    color: "#eceaf5",
    fontSize: "0.875rem",
    outline: "none",
    colorScheme: "dark",
    width: "100%",
  };

  if (isSubmittedSuccess) {
    return (
      <div
        style={{
          backgroundColor: "var(--bg-glass)",
          border: "1px solid var(--border-glass)",
          borderRadius: "16px",
          padding: "48px 32px",
          textAlign: "center",
          maxWidth: "680px",
          margin: "0 auto",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "var(--gold-gradient)",
            color: "var(--gold-text)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--gold-glow)",
          }}
        >
          <CheckCircle2 size={36} strokeWidth={2.5} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#eceaf5",
              margin: 0,
            }}
          >
            Sent to Admin for Review
          </h2>
          <p style={{ fontSize: "0.95rem", color: "#a3acc2", maxWidth: "480px", margin: "0 auto", lineHeight: 1.5 }}>
            Your casting brief <strong style={{ color: "#eceaf5" }}>"{formData.title}"</strong> has been submitted. Vismaya Admin will review details and may contact you to clarify shoot specifics before turning it into a live casting call.
          </p>
        </div>

        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "14px",
            padding: "16px 20px",
            width: "100%",
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            fontSize: "0.85rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#a3acc2" }}>Requirement ID:</span>
            <strong style={{ color: "#eceaf5" }}>{submittedId || "req-new"}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#a3acc2" }}>Project Type:</span>
            <strong style={{ color: "#eceaf5" }}>{formData.type}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#a3acc2" }}>Roles Included:</span>
            <strong style={{ color: "#eceaf5" }}>{formData.roles.length} Character Roles</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#a3acc2" }}>Initial Status:</span>
            <span style={{ color: "var(--warning)", fontWeight: "600" }}>Submitted (In Moderation Queue)</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px" }}>
          <Link
            href="/recruiter/my-requirements"
            className="btn-primary"
            style={{ padding: "10px 24px", borderRadius: "12px" }}
          >
            Go to My Requirements
          </Link>
          <button
            type="button"
            onClick={() => {
              setIsSubmittedSuccess(false);
              setCurrentStep(1);
              setFormData({
                title: "",
                type: "Film",
                description: "",
                locations: "Mumbai",
                shootStartDate: "",
                shootEndDate: "",
                budgetType: "Paid",
                budgetRange: "",
                deadline: "",
                requiredMaterials: ["Commercial Headshot", "Audition Monologue Self-Tape"],
                roles: [
                  {
                    id: "role-" + Date.now(),
                    roleName: "",
                    artistsCount: 1,
                    ageRange: "20 - 28 years",
                    gender: "Any",
                    look: "",
                    language: "Hindi",
                    skills: "",
                    notes: "",
                  },
                ],
              });
            }}
            className="btn-secondary"
            style={{ padding: "10px 20px", borderRadius: "12px" }}
          >
            Post Another Brief
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "var(--bg-glass)",
        border: "1px solid var(--border-glass)",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      {/* 4-Step Stepper Progress Bar Header */}
      <div
        style={{
          padding: "20px 28px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          backgroundColor: "rgba(255, 255, 255, 0.04)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "8px",
            position: "relative",
          }}
        >
          {steps.map((s, idx) => {
            const isCompleted = s.num < currentStep;
            const isCurrent = s.num === currentStep;

            return (
              <div
                key={s.num}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: s.num < currentStep ? "pointer" : "default",
                }}
                onClick={() => {
                  if (s.num < currentStep) setCurrentStep(s.num);
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "10px",
                    background: isCompleted
                      ? "var(--gold-gradient)"
                      : isCurrent
                      ? "rgba(255, 188, 0, 0.18)"
                      : "rgba(255, 255, 255, 0.05)",
                    color: isCompleted
                      ? "var(--gold-text)"
                      : isCurrent
                      ? "var(--gold)"
                      : "#7c869e",
                    border: `2px solid ${
                      isCompleted
                        ? "#ffd54a"
                        : isCurrent
                        ? "var(--gold)"
                        : "rgba(255, 255, 255, 0.12)"
                    }`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "800",
                    fontSize: "0.85rem",
                    flexShrink: 0,
                    boxShadow: isCurrent
                      ? "0 0 12px rgba(255, 188, 0, 0.25)"
                      : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  {isCompleted ? <Check size={17} strokeWidth={3} /> : s.num}
                </div>

                <div style={{ display: "flex", flexDirection: "column" }} className="stepper-label">
                  <span style={{ fontSize: "0.685rem", color: "#7c869e", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.04em" }}>
                    Step {s.num}
                  </span>
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: isCurrent ? "700" : "600",
                      color: isCurrent
                        ? "var(--gold)"
                        : isCompleted
                        ? "#eceaf5"
                        : "#a3acc2",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content Area */}
      <form onSubmit={handleSubmit} style={{ padding: "28px" }}>
        {/* STEP 1: PROJECT DETAILS */}
        {currentStep === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#eceaf5", margin: "0 0 4px 0" }}>
                Step 1: Project Information
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#a3acc2", margin: 0 }}>
                Specify your production details, media format, and shoot timeline.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }} className="form-grid-2">
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.825rem", fontWeight: "600", color: "#eceaf5" }}>
                  Project Title <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai Diaries Season 2 / Luxury Skincare TVC"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    ...inputStyle,
                    border: `1px solid ${formErrors.title ? "var(--danger)" : "rgba(255, 255, 255, 0.14)"}`,
                  }}
                />
                {formErrors.title && (
                  <span style={{ fontSize: "0.75rem", color: "var(--danger)" }}>{formErrors.title}</span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.825rem", fontWeight: "600", color: "#eceaf5" }}>
                  Project Type <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{
                    ...inputStyle,
                    cursor: "pointer",
                  }}
                >
                  <option value="Film" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Film (Theatrical / Indie)</option>
                  <option value="OTT" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>OTT / Web Series</option>
                  <option value="Ad" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Commercial / Ad Film</option>
                  <option value="Music Video" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Music Video</option>
                  <option value="Event" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Runway / Fashion Event</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.825rem", fontWeight: "600", color: "#eceaf5" }}>
                Project Description & Synopsis <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Describe the storyline, director's vision, tone, and production scale..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{
                  ...inputStyle,
                  border: `1px solid ${formErrors.description ? "var(--danger)" : "rgba(255, 255, 255, 0.14)"}`,
                  resize: "vertical",
                  lineHeight: 1.5,
                }}
              />
              {formErrors.description && (
                <span style={{ fontSize: "0.75rem", color: "var(--danger)" }}>{formErrors.description}</span>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }} className="form-grid-3">
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.825rem", fontWeight: "600", color: "#eceaf5" }}>
                  Shoot Locations <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai & Pune Studios"
                  value={formData.locations}
                  onChange={(e) => setFormData({ ...formData, locations: e.target.value })}
                  style={{
                    ...inputStyle,
                    border: `1px solid ${formErrors.locations ? "var(--danger)" : "rgba(255, 255, 255, 0.14)"}`,
                  }}
                />
                {formErrors.locations && (
                  <span style={{ fontSize: "0.75rem", color: "var(--danger)" }}>{formErrors.locations}</span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.825rem", fontWeight: "600", color: "#eceaf5" }}>
                  Shoot Start Date
                </label>
                <input
                  type="date"
                  value={formData.shootStartDate}
                  onChange={(e) => setFormData({ ...formData, shootStartDate: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.825rem", fontWeight: "600", color: "#eceaf5" }}>
                  Shoot End Date
                </label>
                <input
                  type="date"
                  value={formData.shootEndDate}
                  onChange={(e) => setFormData({ ...formData, shootEndDate: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CHARACTER ROLES */}
        {currentStep === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#eceaf5", margin: "0 0 4px 0" }}>
                  Step 2: Character Roles & Breakdowns
                </h2>
                <p style={{ fontSize: "0.85rem", color: "#a3acc2", margin: 0 }}>
                  Define the character specs. Add or remove multiple roles.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddRole}
                className="btn-secondary"
                style={{ padding: "8px 14px", fontSize: "0.825rem", borderRadius: "10px" }}
              >
                <Plus size={15} /> Add Another Role
              </button>
            </div>

            {formErrors.roles && (
              <span style={{ fontSize: "0.8rem", color: "var(--danger)" }}>{formErrors.roles}</span>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {formData.roles.map((role, idx) => (
                <div
                  key={role.id || idx}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "14px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "6px",
                          backgroundColor: "rgba(255, 188, 0, 0.18)",
                          color: "var(--gold)",
                          border: "1px solid rgba(255, 188, 0, 0.3)",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "#eceaf5" }}>
                        Role #{idx + 1}
                      </span>
                    </div>

                    {formData.roles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRole(idx)}
                        style={{
                          color: "var(--danger)",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "0.785rem",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          backgroundColor: "rgba(255, 107, 107, 0.12)",
                          border: "1px solid rgba(255, 107, 107, 0.3)",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "14px" }} className="form-grid-2">
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "#a3acc2" }}>
                        Character Role Name <span style={{ color: "var(--danger)" }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Tanya Roy (Trauma Specialist)"
                        value={role.roleName}
                        onChange={(e) => handleRoleChange(idx, "roleName", e.target.value)}
                        style={{
                          ...inputStyle,
                          border: `1px solid ${formErrors[`roleName_${idx}`] ? "var(--danger)" : "rgba(255, 255, 255, 0.14)"}`,
                          padding: "8px 12px",
                          fontSize: "0.85rem",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "#a3acc2" }}>
                        Artists Count
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={role.artistsCount}
                        onChange={(e) => handleRoleChange(idx, "artistsCount", parseInt(e.target.value) || 1)}
                        style={{ ...inputStyle, padding: "8px 12px", fontSize: "0.85rem" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }} className="form-grid-3">
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "#a3acc2" }}>
                        Age Range
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 21 - 27 years"
                        value={role.ageRange}
                        onChange={(e) => handleRoleChange(idx, "ageRange", e.target.value)}
                        style={{ ...inputStyle, padding: "8px 12px", fontSize: "0.85rem" }}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "#a3acc2" }}>
                        Gender
                      </label>
                      <select
                        value={role.gender}
                        onChange={(e) => handleRoleChange(idx, "gender", e.target.value)}
                        style={{ ...inputStyle, padding: "8px 12px", fontSize: "0.85rem", cursor: "pointer" }}
                      >
                        <option value="Any" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Any Gender</option>
                        <option value="Female" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Female</option>
                        <option value="Male" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Male</option>
                        <option value="Non-Binary" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Non-Binary</option>
                      </select>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "#a3acc2" }}>
                        Languages
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Hindi (Fluent), English"
                        value={role.language}
                        onChange={(e) => handleRoleChange(idx, "language", e.target.value)}
                        style={{ ...inputStyle, padding: "8px 12px", fontSize: "0.85rem" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }} className="form-grid-2">
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "#a3acc2" }}>
                        Look / Physical Aesthetics
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sharp, intelligent, natural expressive face"
                        value={role.look}
                        onChange={(e) => handleRoleChange(idx, "look", e.target.value)}
                        style={{ ...inputStyle, padding: "8px 12px", fontSize: "0.85rem" }}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "#a3acc2" }}>
                        Key Skills Required
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Fast dialogue delivery, emotional control"
                        value={role.skills}
                        onChange={(e) => handleRoleChange(idx, "skills", e.target.value)}
                        style={{ ...inputStyle, padding: "8px 12px", fontSize: "0.85rem" }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: BUDGET & DEADLINE */}
        {currentStep === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#eceaf5", margin: "0 0 4px 0" }}>
                Step 3: Budget, Deadline & Audition Materials
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#a3acc2", margin: 0 }}>
                Set the remuneration structure and specify what materials talent must submit.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="form-grid-2">
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.825rem", fontWeight: "600", color: "#eceaf5" }}>
                  Remuneration Type <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <select
                  value={formData.budgetType}
                  onChange={(e) => setFormData({ ...formData, budgetType: e.target.value })}
                  style={{
                    ...inputStyle,
                    cursor: "pointer",
                  }}
                >
                  <option value="Paid" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Paid (Daily / Lump Sum Fee)</option>
                  <option value="Travel + Stay" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Travel + Stay Covered</option>
                  <option value="Unpaid" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Unpaid / Deferred Festival Royalty</option>
                  <option value="TBA" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>To Be Announced (Negotiable)</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.825rem", fontWeight: "600", color: "#eceaf5" }}>
                  Amount / Budget Range <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. ₹45,000 - ₹80,000 / day or ₹1,50,000 lump sum"
                  value={formData.budgetRange}
                  onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                  style={{
                    ...inputStyle,
                    border: `1px solid ${formErrors.budgetRange ? "var(--danger)" : "rgba(255, 255, 255, 0.14)"}`,
                  }}
                />
                {formErrors.budgetRange && (
                  <span style={{ fontSize: "0.75rem", color: "var(--danger)" }}>{formErrors.budgetRange}</span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.825rem", fontWeight: "600", color: "#eceaf5" }}>
                Application Deadline <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                style={{
                  ...inputStyle,
                  border: `1px solid ${formErrors.deadline ? "var(--danger)" : "rgba(255, 255, 255, 0.14)"}`,
                  maxWidth: "320px",
                }}
              />
              {formErrors.deadline && (
                <span style={{ fontSize: "0.75rem", color: "var(--danger)" }}>{formErrors.deadline}</span>
              )}
            </div>

            {/* Required Submission Materials Checkboxes */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <label style={{ fontSize: "0.825rem", fontWeight: "600", color: "#eceaf5" }}>
                Required Materials from Applicants <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              {formErrors.requiredMaterials && (
                <span style={{ fontSize: "0.75rem", color: "var(--danger)" }}>{formErrors.requiredMaterials}</span>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }} className="form-grid-2">
                {[
                  "Commercial Headshot",
                  "Full Body Look",
                  "Dramatic Video Showreel",
                  "Audition Monologue Self-Tape",
                ].map((mat) => {
                  const checked = formData.requiredMaterials.includes(mat);

                  return (
                    <div
                      key={mat}
                      onClick={() => handleMaterialToggle(mat)}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "12px",
                        backgroundColor: checked ? "rgba(255, 188, 0, 0.14)" : "rgba(255, 255, 255, 0.04)",
                        border: `1px solid ${checked ? "var(--gold)" : "rgba(255, 255, 255, 0.1)"}`,
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          backgroundColor: checked ? "var(--gold)" : "rgba(255, 255, 255, 0.06)",
                          border: `1px solid ${checked ? "var(--gold)" : "rgba(255, 255, 255, 0.2)"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#1a1300",
                        }}
                      >
                        {checked && <Check size={13} strokeWidth={3} />}
                      </div>
                      <span style={{ fontSize: "0.85rem", fontWeight: checked ? "700" : "500", color: checked ? "var(--gold)" : "#eceaf5" }}>
                        {mat}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & SUBMIT */}
        {currentStep === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#eceaf5", margin: "0 0 4px 0" }}>
                Step 4: Review Brief & Submit to Admin
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#a3acc2", margin: 0 }}>
                Review all entered details before sending to Vismaya Admin for moderation and verification.
              </p>
            </div>

            {/* Review Section 1: Project Details */}
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "14px",
                padding: "18px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--gold)", textTransform: "uppercase" }}>
                  1. Project Overview
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--gold)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontWeight: "600",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Edit2 size={12} /> Edit
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px", fontSize: "0.85rem", marginBottom: "8px" }}>
                <div>
                  <span style={{ color: "#a3acc2", display: "block", fontSize: "0.75rem" }}>Title & Type</span>
                  <strong style={{ color: "#eceaf5" }}>{formData.title} ({formData.type})</strong>
                </div>
                <div>
                  <span style={{ color: "#a3acc2", display: "block", fontSize: "0.75rem" }}>Locations</span>
                  <span style={{ color: "#eceaf5" }}>{formData.locations}</span>
                </div>
              </div>

              <p style={{ fontSize: "0.8rem", color: "#a3acc2", margin: 0, lineHeight: 1.4 }}>
                {formData.description}
              </p>
            </div>

            {/* Review Section 2: Roles */}
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "14px",
                padding: "18px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--gold)", textTransform: "uppercase" }}>
                  2. Character Roles ({formData.roles.length})
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--gold)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontWeight: "600",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Edit2 size={12} /> Edit
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {formData.roles.map((r, i) => (
                  <div key={i} style={{ fontSize: "0.8rem", padding: "8px 12px", backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", color: "#eceaf5" }}>
                      <span>{r.roleName}</span>
                      <span style={{ color: "var(--gold)" }}>{r.artistsCount} Artist{r.artistsCount > 1 ? "s" : ""}</span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#a3acc2", marginTop: "2px" }}>
                      {r.ageRange} • {r.gender} • {r.language}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Section 3: Budget & Deadline */}
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "14px",
                padding: "18px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--gold)", textTransform: "uppercase" }}>
                  3. Budget & Deadline
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--gold)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontWeight: "600",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Edit2 size={12} /> Edit
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.85rem" }}>
                <div>
                  <span style={{ color: "#a3acc2", display: "block", fontSize: "0.75rem" }}>Remuneration</span>
                  <strong style={{ color: "#34d399" }}>{formData.budgetRange} ({formData.budgetType})</strong>
                </div>
                <div>
                  <span style={{ color: "#a3acc2", display: "block", fontSize: "0.75rem" }}>Deadline</span>
                  <strong style={{ color: "#eceaf5" }}>{formData.deadline}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stepper Navigation Footer Buttons */}
        <div
          style={{
            marginTop: "28px",
            paddingTop: "20px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="btn-secondary"
                style={{ padding: "9px 18px", fontSize: "0.85rem", borderRadius: "12px" }}
              >
                <ArrowLeft size={15} /> Back
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveDraft}
                className="btn-secondary"
                style={{ padding: "9px 18px", fontSize: "0.85rem", borderRadius: "12px" }}
              >
                <Save size={15} /> Save as Draft
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {currentStep < 4 ? (
              <>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  style={{
                    padding: "9px 16px",
                    fontSize: "0.85rem",
                    color: "#a3acc2",
                    fontWeight: "500",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary"
                  style={{ padding: "9px 22px", fontSize: "0.85rem", borderRadius: "12px" }}
                >
                  <span>Continue</span>
                  <ArrowRight size={15} />
                </button>
              </>
            ) : (
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: "10px 26px", fontSize: "0.9rem", borderRadius: "12px" }}
              >
                <span>Submit to Admin for Review</span>
                <Check size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </form>

      <style jsx global>{`
        @media (max-width: 640px) {
          .stepper-label {
            display: none !important;
          }
          .form-grid-2,
          .form-grid-3 {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
