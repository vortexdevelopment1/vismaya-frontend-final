"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PlusCircle,
  FolderKanban,
  Check,
  ArrowRight,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Layers,
  Plus,
  Trash2,
  Calendar,
} from "lucide-react";
import { useWorkflow } from "@/lib/shared/workflowStore";

const OPPORTUNITY_TYPES = [
  "Acting",
  "Modelling",
  "Dance",
  "Singing",
  "Voice-over",
  "Anchoring",
  "Crew",
  "Other",
];

const REMUNERATION_TYPES = ["Paid", "Unpaid", "Travel + Stay", "TBA"];

function SubmitOpportunityForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProjectId = searchParams.get("projectId") || "";
  const editId = searchParams.get("edit") || "";

  const { opportunities, projects, createProject, submitOpportunity } = useWorkflow();
  const orgId = "org-1";
  const orgProjects = projects.filter((p) => p.orgId === orgId);

  const [currentStep, setCurrentStep] = useState(1);
  const [formErrors, setFormErrors] = useState({});
  const [submittedStatus, setSubmittedStatus] = useState(null); // null | 'submitted' | 'draft'

  // Inline Project Creation Toggle
  const [isInlineProject, setIsInlineProject] = useState(orgProjects.length === 0);
  const [inlineProjTitle, setInlineProjTitle] = useState("");
  const [inlineProjType, setInlineProjType] = useState("OTT Series");
  const [inlineProjDesc, setInlineProjDesc] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    id: editId || "",
    projectId: preselectedProjectId || orgProjects[0]?.id || "",
    title: "",
    summary: "",
    opportunityType: "Acting",
    roles: [
      {
        id: `r-${Date.now()}`,
        roleName: "Lead Character",
        count: 1,
        ageRange: "20 - 28 years",
        gender: "Any",
        description: "",
        skills: "Screen Acting, Improvisation",
        language: "Hindi, English",
      },
    ],
    location: "Mumbai",
    remunerationType: "Paid",
    remunerationAmount: "₹50,000 / day",
    ageMin: 20,
    ageMax: 30,
    gender: "Any",
    languages: "Hindi, English",
    skills: "Screen Acting",
    experience: "1+ years acting experience",
    eligibilityLocation: "Mumbai",
    deadline: "",
    fullBrief: "",
  });

  // Prefill if edit query param is given
  useEffect(() => {
    if (editId) {
      const opp = opportunities.find((o) => o.id === editId);
      if (opp) {
        setFormData({
          id: opp.id,
          projectId: opp.projectId || "",
          title: opp.title || "",
          summary: opp.summary || "",
          opportunityType: opp.opportunityType || "Acting",
          roles:
            opp.roles && opp.roles.length > 0
              ? opp.roles
              : [
                  {
                    id: `r-${Date.now()}`,
                    roleName: "Lead Character",
                    count: 1,
                    ageRange: "20 - 28 years",
                    gender: "Any",
                    description: "",
                    skills: "Screen Acting",
                    language: "Hindi",
                  },
                ],
          location: opp.location || "Mumbai",
          remunerationType:
            opp.remuneration && opp.remuneration.includes("₹")
              ? "Paid"
              : opp.remuneration || "Paid",
          remunerationAmount: opp.remuneration || "₹50,000 / day",
          ageMin: opp.eligibility?.ageMin || 20,
          ageMax: opp.eligibility?.ageMax || 30,
          gender: opp.eligibility?.gender || "Any",
          languages: (opp.eligibility?.languages || ["Hindi", "English"]).join(", "),
          skills: (opp.eligibility?.skills || ["Screen Acting"]).join(", "),
          experience: opp.eligibility?.experience || "1+ years",
          eligibilityLocation: opp.eligibility?.location || "Mumbai",
          deadline: opp.deadline ? opp.deadline.split("T")[0] : "",
          fullBrief: opp.fullBrief || "",
        });
      }
    }
  }, [editId, opportunities]);

  const minDeadlineDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleRoleChange = (index, field, value) => {
    const updatedRoles = [...formData.roles];
    updatedRoles[index] = { ...updatedRoles[index], [field]: value };
    setFormData((prev) => ({ ...prev, roles: updatedRoles }));
  };

  const handleAddRole = () => {
    setFormData((prev) => ({
      ...prev,
      roles: [
        ...prev.roles,
        {
          id: `r-${Date.now()}`,
          roleName: "",
          count: 1,
          ageRange: "20 - 28 years",
          gender: "Any",
          description: "",
          skills: "Acting, Dialogue Delivery",
          language: "Hindi",
        },
      ],
    }));
  };

  const handleRemoveRole = (index) => {
    if (formData.roles.length <= 1) return;
    const updatedRoles = formData.roles.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, roles: updatedRoles }));
  };

  // Validations per step
  const validateStep1 = () => {
    const errors = {};
    if (isInlineProject) {
      if (!inlineProjTitle.trim()) {
        errors.inlineProjTitle = "Project title is required";
      }
    } else {
      if (!formData.projectId) {
        errors.projectId = "Please select or create a project";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = "Opportunity title is mandatory";
    }
    if (formData.remunerationType === "Paid" && !formData.remunerationAmount.trim()) {
      errors.remunerationAmount = "Remuneration amount is required for paid opportunities";
    }
    if (formData.roles.length === 0) {
      errors.roles = "At least one character role is required";
    } else {
      formData.roles.forEach((r, i) => {
        if (!r.roleName.trim()) {
          errors[`roleName_${i}`] = "Role name is required";
        }
      });
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors = {};
    if (!formData.deadline) {
      errors.deadline = "Application deadline is mandatory";
    } else if (new Date(formData.deadline) <= new Date()) {
      errors.deadline = "Deadline must be a future date";
    }
    if (Number(formData.ageMin) > Number(formData.ageMax)) {
      errors.age = "Minimum age cannot exceed maximum age";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      if (isInlineProject && !formData.projectId) {
        const newProj = {
          id: `proj-${Date.now()}`,
          orgId,
          title: inlineProjTitle.trim(),
          type: inlineProjType,
          description: inlineProjDesc.trim(),
        };
        createProject(newProj);
        setFormData((prev) => ({ ...prev, projectId: newProj.id }));
      }
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

  const handleFormSubmit = (isDraft = false) => {
    let resolvedProjectId = formData.projectId;
    if (isInlineProject && (!resolvedProjectId || resolvedProjectId === "")) {
      const newProj = {
        id: `proj-${Date.now()}`,
        orgId,
        title: inlineProjTitle.trim(),
        type: inlineProjType,
        description: inlineProjDesc.trim(),
      };
      createProject(newProj);
      resolvedProjectId = newProj.id;
    }

    if (!resolvedProjectId) {
      alert("Please assign a project.");
      return;
    }

    if (!isDraft && (!formData.deadline || new Date(formData.deadline) <= new Date())) {
      alert("A valid future deadline is required.");
      return;
    }

    const payload = {
      ...(formData.id ? { id: formData.id } : {}),
      projectId: resolvedProjectId,
      orgId,
      title: formData.title.trim() || "Untitled Opportunity",
      summary: formData.summary.trim() || formData.title.trim(),
      opportunityType: formData.opportunityType,
      roles: formData.roles,
      location: formData.location,
      remuneration:
        formData.remunerationType === "Paid"
          ? formData.remunerationAmount
          : formData.remunerationType,
      deadline: formData.deadline || minDeadlineDate,
      eligibility: {
        ageMin: Number(formData.ageMin) || 18,
        ageMax: Number(formData.ageMax) || 60,
        gender: formData.gender,
        languages: formData.languages.split(",").map((s) => s.trim()).filter(Boolean),
        skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
        experience: formData.experience,
        location: formData.eligibilityLocation,
      },
      fullBrief: formData.fullBrief.trim(),
      isDraft,
    };

    submitOpportunity(payload);
    setSubmittedStatus(isDraft ? "draft" : "submitted");
  };

  const steps = [
    { num: 1, label: "Project Link" },
    { num: 2, label: "Role Details" },
    { num: 3, label: "Eligibility & Deadline" },
    { num: 4, label: "Brief & Submit" },
  ];

  const selectedProject = projects.find((p) => p.id === formData.projectId);

  // Common Input Style with Light Tokens
  const inputStyle = {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E8E2D4",
    borderRadius: "10px",
    padding: "11px 16px",
    color: "#2B2D2A",
    fontSize: "15px",
    fontFamily: "var(--font-body), 'Inter', sans-serif",
    outline: "none",
    width: "100%",
    minHeight: "48px",
    boxSizing: "border-box",
    transition: "border-color 0.18s ease, box-shadow 0.18s ease",
  };

  // POST-SUBMISSION CONFIRMATION SCREEN
  if (submittedStatus) {
    const isSubmitted = submittedStatus === "submitted";
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "680px", margin: "40px auto" }}>
        <div
          style={{
            padding: "48px 36px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "22px",
            borderRadius: "20px",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            boxShadow: "0 4px 20px rgba(43, 45, 42, 0.05)",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "rgba(138, 107, 46, 0.12)",
              border: "2px solid #8A6B2E",
              color: "#8A6B2E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(138, 107, 46, 0.20)",
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <div>
            <h2
              style={{
                fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                fontSize: "28px",
                fontWeight: 600,
                color: "#2B2D2A",
                margin: "0 0 10px 0",
              }}
            >
              {isSubmitted ? "Opportunity Submitted to Vismaya" : "Opportunity Saved as Draft"}
            </h2>
            <p
              style={{
                fontFamily: "var(--font-body), 'Inter', sans-serif",
                fontSize: "15px",
                color: "#5A584F",
                margin: 0,
                lineHeight: 1.7,
              }}
            >
              {isSubmitted
                ? "Vismaya reviews every opportunity before it is published. Our moderation desk will verify the role specifications, safety protocols, and budget parameters."
                : "Your opportunity draft has been saved. You can continue editing or submit it for review whenever you are ready."}
            </p>
          </div>

          <div
            style={{
              padding: "16px 20px",
              borderRadius: "14px",
              backgroundColor: "#F3EFE6",
              border: "1px solid #E8E2D4",
              fontSize: "14px",
              color: "#2B2D2A",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              textAlign: "left",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <ShieldCheck size={22} style={{ color: "#8A6B2E", flexShrink: 0 }} />
            <span style={{ lineHeight: 1.5 }}>
              <strong>Opportunity:</strong> &ldquo;{formData.title || "New Opportunity"}&rdquo; • Assigned to project:{" "}
              <strong>{selectedProject?.title || inlineProjTitle || "Project"}</strong>
            </span>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", marginTop: "10px" }}>
            <Link
              href="/recruiter/opportunities"
              style={{
                padding: "12px 26px",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "10px",
                backgroundColor: "#8A6B2E",
                color: "#FFFFFF",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                boxShadow: "0 2px 8px rgba(138, 107, 46, 0.22)",
              }}
            >
              Go to My Opportunities
            </Link>
            <button
              type="button"
              onClick={() => {
                setSubmittedStatus(null);
                setCurrentStep(1);
                setFormData({
                  id: "",
                  projectId: orgProjects[0]?.id || "",
                  title: "",
                  summary: "",
                  opportunityType: "Acting",
                  roles: [
                    {
                      id: `r-${Date.now()}`,
                      roleName: "",
                      count: 1,
                      ageRange: "20 - 28 years",
                      gender: "Any",
                      description: "",
                      skills: "Acting",
                      language: "Hindi",
                    },
                  ],
                  location: "Mumbai",
                  remunerationType: "Paid",
                  remunerationAmount: "₹50,000 / day",
                  ageMin: 20,
                  ageMax: 30,
                  gender: "Any",
                  languages: "Hindi, English",
                  skills: "Screen Acting",
                  experience: "1+ years",
                  eligibilityLocation: "Mumbai",
                  deadline: "",
                  fullBrief: "",
                });
              }}
              style={{
                padding: "12px 22px",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "10px",
                backgroundColor: "#FFFFFF",
                color: "#2B2D2A",
                border: "1px solid #E8E2D4",
                cursor: "pointer",
              }}
            >
              Post Another Opportunity
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* PAGE HEADER */}
      <div>
        <nav
          aria-label="Breadcrumb"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: "#5A584F",
            marginBottom: "12px",
            fontFamily: "var(--font-body), 'Inter', sans-serif",
          }}
        >
          <Link href="/recruiter/dashboard" style={{ color: "#5A584F", textDecoration: "none" }}>
            Dashboard
          </Link>
          <span style={{ color: "#E8E2D4" }}>/</span>
          <Link href="/recruiter/opportunities" style={{ color: "#5A584F", textDecoration: "none" }}>
            Opportunities
          </Link>
          <span style={{ color: "#E8E2D4" }}>/</span>
          <span style={{ color: "#2B2D2A", fontWeight: 600 }}>Create Opportunity</span>
        </nav>

        <h1
          style={{
            fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
            fontSize: "clamp(30px, 3.5vw, 38px)",
            fontWeight: 600,
            color: "#2B2D2A",
            lineHeight: 1.2,
            margin: "0 0 8px 0",
            letterSpacing: "-0.015em",
          }}
        >
          Create Opportunity
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body), 'Inter', sans-serif",
            fontSize: "16px",
            color: "#5A584F",
            margin: 0,
            lineHeight: 1.7,
            maxWidth: "780px",
          }}
        >
          Create verified character requirements, define eligibility parameters, and submit to Vismaya team for publishing.
        </p>
      </div>

      {/* STEP INDICATOR CARD (Full Width on Top) */}
      <div
        style={{
          borderRadius: "16px",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E2D4",
          boxShadow: "0 2px 10px rgba(43, 45, 42, 0.04)",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Desktop Stepper */}
        <div
          style={{
            padding: "20px 28px",
          }}
          className="desktop-stepper"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              position: "relative",
              gap: "16px",
            }}
          >
            {steps.map((s, idx) => {
              const isDone = s.num < currentStep;
              const isCurrent = s.num === currentStep;

              return (
                <div
                  key={s.num}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: isDone ? "pointer" : "default",
                    position: "relative",
                  }}
                  onClick={() => {
                    if (isDone) setCurrentStep(s.num);
                  }}
                >
                  {/* Step Circle 40px */}
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      backgroundColor: isCurrent ? "#8A6B2E" : isDone ? "#FFFFFF" : "#FFFFFF",
                      color: isCurrent ? "#FFFFFF" : isDone ? "#8A6B2E" : "#5A584F",
                      border: isCurrent
                        ? "none"
                        : isDone
                        ? "2px solid #8A6B2E"
                        : "1.5px solid #E8E2D4",
                      boxShadow: isCurrent ? "0 0 0 4px rgba(138, 107, 46, 0.16)" : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "15px",
                      flexShrink: 0,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {isDone ? <Check size={18} strokeWidth={2.5} /> : s.num}
                  </div>

                  {/* Step Label */}
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#5A584F",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        fontWeight: 600,
                      }}
                    >
                      Step {s.num}
                    </span>
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: isCurrent ? 600 : 500,
                        color: isCurrent ? "#2B2D2A" : isDone ? "#2B2D2A" : "#5A584F",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
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

        {/* Compact Mobile Stepper Indicator */}
        <div
          style={{
            padding: "16px 20px",
            display: "none",
            flexDirection: "column",
            gap: "10px",
          }}
          className="mobile-stepper"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "15px", fontWeight: 600, color: "#2B2D2A" }}>
              Step {currentStep}: {steps[currentStep - 1].label}
            </span>
            <span style={{ fontSize: "12px", color: "#5A584F", fontWeight: 600 }}>
              {currentStep} of 4
            </span>
          </div>
          <div
            style={{
              height: "6px",
              borderRadius: "999px",
              backgroundColor: "#E8E2D4",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(currentStep / 4) * 100}%`,
                backgroundColor: "#8A6B2E",
                borderRadius: "999px",
                transition: "width 0.25s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* 2-Column Workspace Layout: Main Form Card + Sticky Live Preview */}
      <div className="new-opp-workspace-layout">
        {/* FORM CARD (LEFT, MAIN) */}
        <div
          className="new-opp-form-card"
          style={{
            flex: 1,
            minWidth: 0,
            borderRadius: "16px",
            padding: "clamp(22px, 3.5vw, 32px)",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            boxShadow: "0 2px 12px rgba(43, 45, 42, 0.04)",
            boxSizing: "border-box",
          }}
        >
          {/* STEP 1: PROJECT LINK */}
          {currentStep === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
              <div>
                <h2
                  style={{
                    fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                    fontSize: "26px",
                    fontWeight: 600,
                    color: "#2B2D2A",
                    margin: "0 0 6px 0",
                  }}
                >
                  1. Link to a Casting Project
                </h2>
                <p style={{ fontSize: "15px", color: "#5A584F", margin: 0, lineHeight: 1.6 }}>
                  Every opportunity must belong to an active project container.
                </p>
              </div>

              {/* Segmented Toggle Pair */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setIsInlineProject(false)}
                  style={{
                    padding: "0 22px",
                    height: "48px",
                    borderRadius: "10px",
                    backgroundColor: !isInlineProject ? "#8A6B2E" : "#FFFFFF",
                    color: !isInlineProject ? "#FFFFFF" : "#2B2D2A",
                    border: `1px solid ${!isInlineProject ? "#8A6B2E" : "#E8E2D4"}`,
                    fontSize: "14px",
                    fontWeight: 600,
                    fontFamily: "var(--font-body), 'Inter', sans-serif",
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                  }}
                  className="seg-toggle-btn"
                >
                  Select Existing Project ({orgProjects.length})
                </button>
                <button
                  type="button"
                  onClick={() => setIsInlineProject(true)}
                  style={{
                    padding: "0 22px",
                    height: "48px",
                    borderRadius: "10px",
                    backgroundColor: isInlineProject ? "#8A6B2E" : "#FFFFFF",
                    color: isInlineProject ? "#FFFFFF" : "#2B2D2A",
                    border: `1px solid ${isInlineProject ? "#8A6B2E" : "#E8E2D4"}`,
                    fontSize: "14px",
                    fontWeight: 600,
                    fontFamily: "var(--font-body), 'Inter', sans-serif",
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                  }}
                  className="seg-toggle-btn"
                >
                  + Create New Project Inline
                </button>
              </div>

              {!isInlineProject ? (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#2B2D2A",
                      marginBottom: "8px",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Select Parent Project <span style={{ color: "#8A6B2E" }}>*</span>
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => handleFieldChange("projectId", e.target.value)}
                    style={{
                      ...inputStyle,
                      cursor: "pointer",
                    }}
                    className="v-form-select"
                  >
                    {orgProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.type})
                      </option>
                    ))}
                  </select>
                  {formErrors.projectId && (
                    <span style={{ color: "#B42318", fontSize: "12px", marginTop: "6px", display: "block" }}>
                      {formErrors.projectId}
                    </span>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    backgroundColor: "#F3EFE6",
                    padding: "22px",
                    borderRadius: "14px",
                    border: "1px solid #E8E2D4",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#2B2D2A",
                        marginBottom: "6px",
                        letterSpacing: "0.02em",
                      }}
                    >
                      New Project Title <span style={{ color: "#8A6B2E" }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai Diaries Season 3"
                      value={inlineProjTitle}
                      onChange={(e) => setInlineProjTitle(e.target.value)}
                      style={inputStyle}
                      className="v-form-input"
                    />
                    {formErrors.inlineProjTitle && (
                      <span style={{ color: "#B42318", fontSize: "12px", marginTop: "6px", display: "block" }}>
                        {formErrors.inlineProjTitle}
                      </span>
                    )}
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#2B2D2A",
                        marginBottom: "6px",
                        letterSpacing: "0.02em",
                      }}
                    >
                      Production Type
                    </label>
                    <select
                      value={inlineProjType}
                      onChange={(e) => setInlineProjType(e.target.value)}
                      style={{
                        ...inputStyle,
                        cursor: "pointer",
                      }}
                      className="v-form-select"
                    >
                      {["OTT Series", "Feature Film", "Commercial / TVC", "Short Film", "Music Video", "Theater", "Documentary"].map(
                        (t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#2B2D2A",
                        marginBottom: "6px",
                        letterSpacing: "0.02em",
                      }}
                    >
                      Project Synopsis
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Brief context on the storyline or director..."
                      value={inlineProjDesc}
                      onChange={(e) => setInlineProjDesc(e.target.value)}
                      style={{
                        ...inputStyle,
                        resize: "vertical",
                        minHeight: "76px",
                      }}
                      className="v-form-textarea"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: OPPORTUNITY & CHARACTER ROLES */}
          {currentStep === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
              <div>
                <h2
                  style={{
                    fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                    fontSize: "26px",
                    fontWeight: 600,
                    color: "#2B2D2A",
                    margin: "0 0 6px 0",
                  }}
                >
                  2. Opportunity Details & Roles
                </h2>
                <p style={{ fontSize: "15px", color: "#5A584F", margin: 0, lineHeight: 1.6 }}>
                  Define public opportunity titles, category, and character roles.
                </p>
              </div>

              <div className="form-responsive-grid-2">
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#2B2D2A",
                      marginBottom: "6px",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Public Opportunity Title <span style={{ color: "#8A6B2E" }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai Diaries S3 - Lead Doctor & Trauma Surgeon"
                    value={formData.title}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    style={inputStyle}
                    className="v-form-input"
                  />
                  {formErrors.title && (
                    <span style={{ color: "#B42318", fontSize: "12px", marginTop: "6px", display: "block" }}>
                      {formErrors.title}
                    </span>
                  )}
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#2B2D2A",
                      marginBottom: "6px",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Opportunity Type
                  </label>
                  <select
                    value={formData.opportunityType}
                    onChange={(e) => handleFieldChange("opportunityType", e.target.value)}
                    style={{
                      ...inputStyle,
                      cursor: "pointer",
                    }}
                    className="v-form-select"
                  >
                    {OPPORTUNITY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-responsive-grid-3">
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#2B2D2A",
                      marginBottom: "6px",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Shoot Location <span style={{ color: "#8A6B2E" }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai Film City Studios"
                    value={formData.location}
                    onChange={(e) => handleFieldChange("location", e.target.value)}
                    style={inputStyle}
                    className="v-form-input"
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#2B2D2A",
                      marginBottom: "6px",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Remuneration Type
                  </label>
                  <select
                    value={formData.remunerationType}
                    onChange={(e) => handleFieldChange("remunerationType", e.target.value)}
                    style={{
                      ...inputStyle,
                      cursor: "pointer",
                    }}
                    className="v-form-select"
                  >
                    {REMUNERATION_TYPES.map((rt) => (
                      <option key={rt} value={rt}>
                        {rt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#2B2D2A",
                      marginBottom: "6px",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Remuneration Details / Amount {formData.remunerationType === "Paid" ? <span style={{ color: "#8A6B2E" }}>*</span> : ""}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹50,000 / day"
                    value={formData.remunerationAmount}
                    onChange={(e) => handleFieldChange("remunerationAmount", e.target.value)}
                    style={inputStyle}
                    className="v-form-input"
                  />
                  {formErrors.remunerationAmount && (
                    <span style={{ color: "#B42318", fontSize: "12px", marginTop: "6px", display: "block" }}>
                      {formErrors.remunerationAmount}
                    </span>
                  )}
                </div>
              </div>

              {/* Character Roles Builder */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#8A6B2E",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Character Roles ({formData.roles.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddRole}
                    style={{
                      padding: "8px 16px",
                      fontSize: "13px",
                      fontWeight: 600,
                      gap: "6px",
                      borderRadius: "10px",
                      minHeight: "38px",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E8E2D4",
                      color: "#2B2D2A",
                      display: "inline-flex",
                      alignItems: "center",
                      cursor: "pointer",
                      transition: "all 0.18s ease",
                    }}
                    className="add-role-btn"
                  >
                    <Plus size={15} style={{ color: "#8A6B2E" }} />
                    <span>Add Role</span>
                  </button>
                </div>

                {formData.roles.map((role, idx) => (
                  <div
                    key={role.id || idx}
                    style={{
                      padding: "20px",
                      borderRadius: "14px",
                      backgroundColor: "#F3EFE6",
                      border: "1px solid #E8E2D4",
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#2B2D2A" }}>
                        Role #{idx + 1}
                      </span>
                      {formData.roles.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRole(idx)}
                          style={{
                            color: "#B42318",
                            fontSize: "13px",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px 8px",
                          }}
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      )}
                    </div>

                    <div className="form-responsive-grid-3">
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#5A584F", marginBottom: "4px" }}>
                          Character Name <span style={{ color: "#8A6B2E" }}>*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Dr. Tanya Roy"
                          value={role.roleName}
                          onChange={(e) => handleRoleChange(idx, "roleName", e.target.value)}
                          style={inputStyle}
                          className="v-form-input"
                        />
                        {formErrors[`roleName_${idx}`] && (
                          <span style={{ color: "#B42318", fontSize: "12px", marginTop: "4px", display: "block" }}>
                            {formErrors[`roleName_${idx}`]}
                          </span>
                        )}
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#5A584F", marginBottom: "4px" }}>
                          Gender
                        </label>
                        <select
                          value={role.gender}
                          onChange={(e) => handleRoleChange(idx, "gender", e.target.value)}
                          style={{ ...inputStyle, cursor: "pointer" }}
                          className="v-form-select"
                        >
                          <option value="Any">Any Gender</option>
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Non-Binary">Non-Binary</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#5A584F", marginBottom: "4px" }}>
                          Age Range
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 21 - 27 years"
                          value={role.ageRange}
                          onChange={(e) => handleRoleChange(idx, "ageRange", e.target.value)}
                          style={inputStyle}
                          className="v-form-input"
                        />
                      </div>
                    </div>

                    <div className="form-responsive-grid-2">
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#5A584F", marginBottom: "4px" }}>
                          Skills & Attributes
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Fast Dialogue, Screen Acting"
                          value={role.skills}
                          onChange={(e) => handleRoleChange(idx, "skills", e.target.value)}
                          style={inputStyle}
                          className="v-form-input"
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#5A584F", marginBottom: "4px" }}>
                          Languages Required
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Hindi (Fluent), English"
                          value={role.language}
                          onChange={(e) => handleRoleChange(idx, "language", e.target.value)}
                          style={inputStyle}
                          className="v-form-input"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: ELIGIBILITY & MANDATORY DEADLINE */}
          {currentStep === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
              <div>
                <h2
                  style={{
                    fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                    fontSize: "26px",
                    fontWeight: 600,
                    color: "#2B2D2A",
                    margin: "0 0 6px 0",
                  }}
                >
                  3. Eligibility Criteria & Application Deadline
                </h2>
                <p style={{ fontSize: "15px", color: "#5A584F", margin: 0, lineHeight: 1.6 }}>
                  Set artist screening filters and the mandatory automatic expiration deadline.
                </p>
              </div>

              {/* Mandatory Deadline Card */}
              <div
                style={{
                  padding: "22px",
                  borderRadius: "14px",
                  backgroundColor: "#F3EFE6",
                  border: "1px solid #E8E2D4",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#2B2D2A", fontWeight: 700, fontSize: "15px" }}>
                  <Calendar size={18} style={{ color: "#8A6B2E" }} />
                  <span>Mandatory Application Deadline <span style={{ color: "#8A6B2E" }}>*</span></span>
                </div>
                <p style={{ fontSize: "13.5px", color: "#5A584F", margin: 0, lineHeight: 1.5 }}>
                  Published opportunities automatically stop accepting talent applications and move to <strong>Closed</strong> once this date passes.
                </p>

                <input
                  type="date"
                  min={minDeadlineDate}
                  required
                  value={formData.deadline}
                  onChange={(e) => handleFieldChange("deadline", e.target.value)}
                  style={{
                    ...inputStyle,
                    maxWidth: "300px",
                    border: formErrors.deadline ? "1px solid #B42318" : "1px solid #E8E2D4",
                  }}
                  className="v-form-input"
                />
                {formErrors.deadline && (
                  <span style={{ color: "#B42318", fontSize: "12px", fontWeight: 600 }}>
                    {formErrors.deadline}
                  </span>
                )}
              </div>

              {/* Screening Eligibility Fields */}
              <div className="form-responsive-grid-3">
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#2B2D2A",
                      marginBottom: "6px",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Min Age
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={80}
                    value={formData.ageMin}
                    onChange={(e) => handleFieldChange("ageMin", e.target.value)}
                    style={inputStyle}
                    className="v-form-input"
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#2B2D2A",
                      marginBottom: "6px",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Max Age
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={80}
                    value={formData.ageMax}
                    onChange={(e) => handleFieldChange("ageMax", e.target.value)}
                    style={inputStyle}
                    className="v-form-input"
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#2B2D2A",
                      marginBottom: "6px",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Target City / Territory
                  </label>
                  <input
                    type="text"
                    value={formData.eligibilityLocation}
                    onChange={(e) => handleFieldChange("eligibilityLocation", e.target.value)}
                    placeholder="e.g. Mumbai / Pan-India"
                    style={inputStyle}
                    className="v-form-input"
                  />
                </div>
              </div>

              {formErrors.age && (
                <div style={{ color: "#B42318", fontSize: "13px", fontWeight: 600 }}>
                  {formErrors.age}
                </div>
              )}

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#2B2D2A",
                    marginBottom: "6px",
                    letterSpacing: "0.02em",
                  }}
                >
                  Experience Guidelines
                </label>
                <input
                  type="text"
                  value={formData.experience}
                  onChange={(e) => handleFieldChange("experience", e.target.value)}
                  placeholder="e.g. 1+ years screen or professional theater experience"
                  style={inputStyle}
                  className="v-form-input"
                />
              </div>
            </div>
          )}

          {/* STEP 4: FULL BRIEF & REVIEW */}
          {currentStep === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
              <div>
                <h2
                  style={{
                    fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                    fontSize: "26px",
                    fontWeight: 600,
                    color: "#2B2D2A",
                    margin: "0 0 6px 0",
                  }}
                >
                  4. Full Casting Brief & Final Review
                </h2>
                <p style={{ fontSize: "15px", color: "#5A584F", margin: 0, lineHeight: 1.6 }}>
                  Review your opportunity before sending it to the Vismaya moderation desk.
                </p>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#2B2D2A",
                    marginBottom: "6px",
                    letterSpacing: "0.02em",
                  }}
                >
                  Full Casting Brief & Director Notes
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide comprehensive details on storyline context, director vision, audition tape requirements, and shoot dates..."
                  value={formData.fullBrief}
                  onChange={(e) => handleFieldChange("fullBrief", e.target.value)}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    minHeight: "110px",
                  }}
                  className="v-form-textarea"
                />
              </div>

              {/* Review Summary Card */}
              <div
                style={{
                  padding: "20px 24px",
                  borderRadius: "14px",
                  backgroundColor: "#F3EFE6",
                  border: "1px solid #E8E2D4",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  fontSize: "14px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                  <span style={{ color: "#5A584F" }}>Project:</span>
                  <strong style={{ color: "#2B2D2A" }}>
                    {selectedProject?.title || inlineProjTitle || "Assigned Project"}
                  </strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                  <span style={{ color: "#5A584F" }}>Opportunity Title:</span>
                  <strong style={{ color: "#2B2D2A" }}>{formData.title || "Untitled Opportunity"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                  <span style={{ color: "#5A584F" }}>Category:</span>
                  <strong style={{ color: "#2B2D2A" }}>{formData.opportunityType}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                  <span style={{ color: "#5A584F" }}>Remuneration:</span>
                  <strong style={{ color: "#2B2D2A" }}>
                    {formData.remunerationType === "Paid"
                      ? formData.remunerationAmount
                      : formData.remunerationType}
                  </strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                  <span style={{ color: "#5A584F" }}>Application Deadline:</span>
                  <strong style={{ color: "#8A6B2E" }}>
                    {formData.deadline || "Pending"} (Mandatory Future Date)
                  </strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                  <span style={{ color: "#5A584F" }}>Character Roles:</span>
                  <strong style={{ color: "#2B2D2A" }}>{formData.roles.length} Roles</strong>
                </div>
              </div>

              {/* Vismaya Moderation Notice Banner */}
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(138, 107, 46, 0.08)",
                  border: "1px solid rgba(138, 107, 46, 0.22)",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  fontSize: "13.5px",
                  color: "#2B2D2A",
                  lineHeight: 1.5,
                }}
              >
                <ShieldCheck size={22} style={{ color: "#8A6B2E", flexShrink: 0 }} />
                <span>
                  <strong>Vismaya reviews every opportunity before it is published.</strong> Once submitted, the Vismaya team verifies budget escrow, character specs, and safety guidelines before making it live to verified talent.
                </span>
              </div>
            </div>
          )}

          {/* ACTION BAR (Cancel / Save Draft / Continue) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "32px",
              borderTop: "1px solid #E8E2D4",
              paddingTop: "24px",
              gap: "12px",
              flexWrap: "wrap",
            }}
            className="new-opp-action-bar"
          >
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                style={{
                  padding: "0 22px",
                  height: "46px",
                  fontSize: "14px",
                  fontWeight: 600,
                  gap: "8px",
                  borderRadius: "10px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8E2D4",
                  color: "#2B2D2A",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  transition: "all 0.18s ease",
                }}
                className="v-btn-secondary"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            ) : (
              <Link
                href="/recruiter/opportunities"
                style={{
                  fontSize: "14px",
                  color: "#5A584F",
                  padding: "0 8px",
                  textDecoration: "none",
                  fontWeight: 500,
                  transition: "color 0.16s ease",
                }}
                className="v-btn-cancel"
              >
                Cancel
              </Link>
            )}

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => handleFormSubmit(true)}
                style={{
                  padding: "0 20px",
                  height: "46px",
                  fontSize: "14px",
                  fontWeight: 600,
                  gap: "8px",
                  borderRadius: "10px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #8A6B2E",
                  color: "#8A6B2E",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  transition: "all 0.18s ease",
                }}
                className="v-btn-outline-gold"
              >
                <Save size={16} />
                <span>Save Draft</span>
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  style={{
                    padding: "0 24px",
                    height: "46px",
                    fontSize: "14px",
                    fontWeight: 600,
                    gap: "8px",
                    borderRadius: "10px",
                    backgroundColor: "#8A6B2E",
                    border: "none",
                    color: "#FFFFFF",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    boxShadow: "0 2px 8px rgba(138, 107, 46, 0.22)",
                    transition: "all 0.18s ease",
                  }}
                  className="v-btn-primary"
                >
                  <span>Continue</span>
                  <ArrowRight size={16} className="continue-arrow-icon" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleFormSubmit(false)}
                  style={{
                    padding: "0 28px",
                    height: "46px",
                    fontSize: "14px",
                    fontWeight: 600,
                    gap: "8px",
                    borderRadius: "10px",
                    backgroundColor: "#8A6B2E",
                    border: "none",
                    color: "#FFFFFF",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    boxShadow: "0 2px 8px rgba(138, 107, 46, 0.22)",
                    transition: "all 0.18s ease",
                  }}
                  className="v-btn-primary"
                >
                  <Check size={17} strokeWidth={2.5} />
                  <span>Submit to Vismaya</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* LIVE STICKY PREVIEW CARD (RIGHT) */}
        <div className="new-opp-summary-container">
          <div
            style={{
              padding: "28px",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              position: "sticky",
              top: "96px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E2D4",
              boxShadow: "0 2px 12px rgba(43, 45, 42, 0.04)",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3
                style={{
                  fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                  fontSize: "22px",
                  fontWeight: 600,
                  color: "#2B2D2A",
                  margin: 0,
                }}
              >
                Opportunity overview
              </h3>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#8A6B2E",
                  backgroundColor: "rgba(138, 107, 46, 0.10)",
                  border: "1px solid rgba(138, 107, 46, 0.20)",
                  padding: "3px 9px",
                  borderRadius: "999px",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                Live preview
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "14px" }}>
              <div>
                <span
                  style={{
                    color: "#5A584F",
                    display: "block",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    marginBottom: "4px",
                  }}
                >
                  Project container
                </span>
                <strong style={{ color: "#2B2D2A", fontSize: "15px", fontWeight: 600 }}>
                  {selectedProject?.title || inlineProjTitle || "Untitled Project"}
                </strong>
              </div>

              <div>
                <span
                  style={{
                    color: "#5A584F",
                    display: "block",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    marginBottom: "4px",
                  }}
                >
                  Opportunity title
                </span>
                <strong
                  style={{
                    color: formData.title ? "#2B2D2A" : "#6B6A63",
                    fontSize: "16px",
                    fontWeight: formData.title ? 600 : 400,
                  }}
                >
                  {formData.title || "Untitled Opportunity"}
                </strong>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <span
                    style={{
                      color: "#5A584F",
                      display: "block",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      letterSpacing: "0.14em",
                      marginBottom: "4px",
                    }}
                  >
                    Category
                  </span>
                  <span style={{ color: "#2B2D2A", fontWeight: 500 }}>{formData.opportunityType}</span>
                </div>
                <div>
                  <span
                    style={{
                      color: "#5A584F",
                      display: "block",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      letterSpacing: "0.14em",
                      marginBottom: "4px",
                    }}
                  >
                    Location
                  </span>
                  <span style={{ color: "#2B2D2A", fontWeight: 500 }}>{formData.location || "Mumbai"}</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <span
                    style={{
                      color: "#5A584F",
                      display: "block",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      letterSpacing: "0.14em",
                      marginBottom: "4px",
                    }}
                  >
                    Roles count
                  </span>
                  {/* Gold-Brown Roles Count (No Green) */}
                  <strong style={{ color: "#8A6B2E", fontWeight: 700 }}>
                    {formData.roles.length} Role{formData.roles.length > 1 ? "s" : ""}
                  </strong>
                </div>
                <div>
                  <span
                    style={{
                      color: "#5A584F",
                      display: "block",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      letterSpacing: "0.14em",
                      marginBottom: "4px",
                    }}
                  >
                    Deadline
                  </span>
                  <span style={{ color: formData.deadline ? "#2B2D2A" : "#6B6A63", fontWeight: 500 }}>
                    {formData.deadline ? new Date(formData.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Pending"}
                  </span>
                </div>
              </div>

              <div>
                <span
                  style={{
                    color: "#5A584F",
                    display: "block",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    marginBottom: "4px",
                  }}
                >
                  Remuneration
                </span>
                <span style={{ color: "#2B2D2A", fontWeight: 500 }}>
                  {formData.remunerationType === "Paid"
                    ? formData.remunerationAmount || "Paid Role"
                    : formData.remunerationType}
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#F3EFE6",
                border: "1px solid #E8E2D4",
                borderRadius: "12px",
                padding: "16px",
                fontSize: "13px",
                color: "#5A584F",
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: "#2B2D2A", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                Step {currentStep} of 4: {steps[currentStep - 1]?.label}
              </span>
              Fill out all required details before submitting to Vismaya Casting Desk.
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="new-opp-mobile-action-bar">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            style={{
              height: "44px",
              padding: "0 16px",
              fontSize: "13.5px",
              fontWeight: 600,
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E2D4",
              borderRadius: "10px",
              color: "#2B2D2A",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => handleFormSubmit(true)}
          style={{
            flex: 1,
            height: "44px",
            padding: "0 14px",
            fontSize: "13.5px",
            fontWeight: 600,
            backgroundColor: "#FFFFFF",
            border: "1px solid #8A6B2E",
            borderRadius: "10px",
            color: "#8A6B2E",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <Save size={16} />
          <span>Save draft</span>
        </button>

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={handleNext}
            style={{
              flex: 1.2,
              height: "44px",
              padding: "0 16px",
              fontSize: "13.5px",
              fontWeight: 600,
              backgroundColor: "#8A6B2E",
              border: "none",
              borderRadius: "10px",
              color: "#FFFFFF",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <span>Continue</span>
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleFormSubmit(false)}
            style={{
              flex: 1.4,
              height: "44px",
              padding: "0 16px",
              fontSize: "13.5px",
              fontWeight: 600,
              backgroundColor: "#8A6B2E",
              border: "none",
              borderRadius: "10px",
              color: "#FFFFFF",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <Check size={16} strokeWidth={2.5} />
            <span>Submit</span>
          </button>
        )}
      </div>

      <style jsx>{`
        .new-opp-workspace-layout {
          display: flex;
          align-items: flex-start;
          gap: 32px;
          width: 100%;
          min-width: 0;
        }

        .new-opp-summary-container {
          width: 360px;
          flex-shrink: 0;
        }

        .new-opp-mobile-action-bar {
          display: none;
        }

        .form-responsive-grid-2 {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
        }

        .form-responsive-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .v-form-input:focus,
        .v-form-select:focus,
        .v-form-textarea:focus {
          border-color: #8A6B2E !important;
          box-shadow: 0 0 0 3px rgba(138, 107, 46, 0.16) !important;
        }

        .seg-toggle-btn:hover {
          border-color: #8A6B2E !important;
          background-color: #F3EFE6 !important;
        }

        .add-role-btn:hover {
          background-color: #F3EFE6 !important;
          border-color: #8A6B2E !important;
        }

        .v-btn-secondary:hover {
          background-color: #F3EFE6 !important;
          border-color: #8A6B2E !important;
        }

        .v-btn-outline-gold:hover {
          background-color: #F3EFE6 !important;
        }

        .v-btn-primary:hover {
          background-color: #6E5420 !important;
        }

        .v-btn-primary:hover .continue-arrow-icon {
          transform: translateX(3px);
        }

        .continue-arrow-icon {
          transition: transform 0.18s ease;
        }

        .v-btn-cancel:hover {
          color: #2B2D2A !important;
          text-decoration: underline !important;
        }

        @media (max-width: 1099.98px) {
          .new-opp-workspace-layout {
            flex-direction: column;
            gap: 28px;
          }

          .new-opp-summary-container {
            width: 100%;
          }
        }

        @media (max-width: 767.98px) {
          .desktop-stepper {
            display: none !important;
          }
          .mobile-stepper {
            display: flex !important;
          }
          .form-responsive-grid-2,
          .form-responsive-grid-3 {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .new-opp-workspace-layout {
            margin-bottom: 76px;
          }
          .new-opp-action-bar {
            display: none !important;
          }
          .new-opp-mobile-action-bar {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-top: 1px solid #E8E2D4;
            padding: 12px 16px;
            padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
            z-index: 45;
            gap: 10px;
            box-shadow: 0 -4px 16px rgba(43, 45, 42, 0.08);
          }
        }
      `}</style>
    </div>
  );
}

export default function NewOpportunityPage() {
  return (
    <Suspense fallback={<div style={{ padding: "24px", color: "#5A584F" }}>Loading opportunity form...</div>}>
      <SubmitOpportunityForm />
    </Suspense>
  );
}
