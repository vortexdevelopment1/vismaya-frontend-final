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
import PageHeader from "@/components/shared/PageHeader";
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
          roles: opp.roles && opp.roles.length > 0 ? opp.roles : [
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
          remunerationType: opp.remuneration && opp.remuneration.includes("₹") ? "Paid" : (opp.remuneration || "Paid"),
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
    minHeight: "44px",
    boxSizing: "border-box",
  };

  if (submittedStatus) {
    const isSubmitted = submittedStatus === "submitted";
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "680px", margin: "40px auto" }}>
        <div
          className="card-surface"
          style={{
            padding: "40px 32px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            borderRadius: "20px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 188, 0, 0.15)",
              border: "2px solid var(--gold)",
              color: "var(--gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 24px rgba(255, 188, 0, 0.3)",
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#eceaf5", margin: "0 0 8px 0" }}>
              {isSubmitted ? "Opportunity Submitted to Vismaya" : "Opportunity Saved as Draft"}
            </h2>
            <p style={{ fontSize: "0.9rem", color: "#a3acc2", margin: 0, lineHeight: 1.6 }}>
              {isSubmitted
                ? "Vismaya reviews every opportunity before it is published. Our moderation desk will verify the role specifications, safety protocols, and budget parameters."
                : "Your opportunity draft has been saved. You can continue editing or submit it for review whenever you are ready."}
            </p>
          </div>

          <div
            style={{
              padding: "14px 18px",
              borderRadius: "12px",
              backgroundColor: "rgba(255, 188, 0, 0.08)",
              border: "1px solid rgba(255, 188, 0, 0.25)",
              fontSize: "0.825rem",
              color: "var(--gold)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textAlign: "left",
            }}
          >
            <ShieldCheck size={20} style={{ flexShrink: 0 }} />
            <span>
              <strong>Opportunity:</strong> "{formData.title || "New Opportunity"}" • Assigned to project: <strong>{selectedProject?.title || inlineProjTitle || "Project"}</strong>
            </span>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", marginTop: "10px" }}>
            <Link
              href="/recruiter/opportunities"
              className="btn-primary"
              style={{ padding: "10px 24px", fontSize: "0.9rem", borderRadius: "12px" }}
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
              className="btn-secondary"
              style={{ padding: "10px 20px", fontSize: "0.9rem", borderRadius: "12px" }}
            >
              Post Another Opportunity
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Page Header */}
      <PageHeader
        title="Submit New Opportunity"
        subtitle="Create verified character requirements, define eligibility parameters, and submit to Vismaya team for publishing."
        breadcrumbs={[
          { label: "Dashboard", href: "/recruiter/dashboard" },
          { label: "Opportunities", href: "/recruiter/opportunities" },
          { label: "New Opportunity" },
        ]}
      />

      {/* Stepper Card (Full Width on Top) */}
      <div
        className="card-surface"
        style={{
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid var(--border-glass)",
          width: "100%",
        }}
      >
        {/* Desktop Stepper Indicator */}
        <div
          style={{
            padding: "18px 24px",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
          }}
          className="desktop-stepper"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "8px",
            }}
          >
            {steps.map((s) => {
              const isDone = s.num < currentStep;
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
                      width: "32px",
                      height: "32px",
                      borderRadius: "10px",
                      background: isDone
                        ? "var(--gold-gradient)"
                        : isCurrent
                        ? "rgba(255, 188, 0, 0.18)"
                        : "rgba(255, 255, 255, 0.05)",
                      color: isDone
                        ? "var(--gold-text)"
                        : isCurrent
                        ? "var(--gold)"
                        : "#7c869e",
                      border: `2px solid ${
                        isDone
                          ? "#ffd54a"
                          : isCurrent
                          ? "var(--gold)"
                          : "rgba(255, 255, 255, 0.12)"
                      }`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "0.825rem",
                      flexShrink: 0,
                      boxShadow: isCurrent ? "0 0 12px rgba(255, 188, 0, 0.25)" : "none",
                    }}
                  >
                    {isDone ? <Check size={16} strokeWidth={3} /> : s.num}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <span style={{ fontSize: "0.68rem", color: "#7c869e", textTransform: "uppercase", fontWeight: 700 }}>
                      Step {s.num}
                    </span>
                    <span
                      style={{
                        fontSize: "0.825rem",
                        fontWeight: isCurrent ? 700 : 500,
                        color: isCurrent ? "var(--gold)" : isDone ? "#eceaf5" : "#a3acc2",
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
            padding: "14px 18px",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            display: "none",
            flexDirection: "column",
            gap: "8px",
          }}
          className="mobile-stepper"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--gold)" }}>
              {steps[currentStep - 1].label}
            </span>
            <span style={{ fontSize: "0.75rem", color: "#a3acc2", fontWeight: 600 }}>
              Step {currentStep} of 4
            </span>
          </div>
          <div
            style={{
              height: "6px",
              borderRadius: "999px",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(currentStep / 4) * 100}%`,
                background: "var(--gold-gradient)",
                borderRadius: "999px",
                transition: "width 0.25s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* 2-Column Layout on >= 1200px: Form Card (flex 1) + Sticky Live Summary Card (340px) */}
      <div className="new-opp-workspace-layout">
        {/* Form Card */}
        <div
          className="card-surface new-opp-form-card"
          style={{
            flex: 1,
            minWidth: 0,
            borderRadius: "16px",
            padding: "clamp(18px, 3vw, 28px)",
            border: "1px solid var(--border-glass)",
          }}
        >
          {/* STEP 1: PROJECT LINK */}
          {currentStep === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#eceaf5", marginBottom: "4px" }}>
                  1. Link to a Casting Project
                </h3>
                <p style={{ fontSize: "0.825rem", color: "#a3acc2", margin: 0 }}>
                  Every opportunity must belong to an active project container.
                </p>
              </div>

              {/* Mode Toggle */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setIsInlineProject(false)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "12px",
                    background: !isInlineProject ? "var(--gold-gradient)" : "rgba(255, 255, 255, 0.05)",
                    color: !isInlineProject ? "var(--gold-text)" : "#a3acc2",
                    border: `1px solid ${!isInlineProject ? "var(--gold)" : "rgba(255, 255, 255, 0.12)"}`,
                    fontSize: "0.825rem",
                    fontWeight: !isInlineProject ? 700 : 500,
                    cursor: "pointer",
                    minHeight: "44px",
                  }}
                >
                  Select Existing Project ({orgProjects.length})
                </button>
                <button
                  type="button"
                  onClick={() => setIsInlineProject(true)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "12px",
                    background: isInlineProject ? "var(--gold-gradient)" : "rgba(255, 255, 255, 0.05)",
                    color: isInlineProject ? "var(--gold-text)" : "#a3acc2",
                    border: `1px solid ${isInlineProject ? "var(--gold)" : "rgba(255, 255, 255, 0.12)"}`,
                    fontSize: "0.825rem",
                    fontWeight: isInlineProject ? 700 : 500,
                    cursor: "pointer",
                    minHeight: "44px",
                  }}
                >
                  + Create New Project Inline
                </button>
              </div>

              {!isInlineProject ? (
                <div>
                  <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 600, color: "#eceaf5", marginBottom: "6px" }}>
                    Select Parent Project *
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => handleFieldChange("projectId", e.target.value)}
                    style={{
                      ...inputStyle,
                      cursor: "pointer",
                    }}
                  >
                    {orgProjects.map((p) => (
                      <option key={p.id} value={p.id} style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>
                        {p.title} ({p.type})
                      </option>
                    ))}
                  </select>
                  {formErrors.projectId && (
                    <span style={{ color: "var(--danger)", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>
                      {formErrors.projectId}
                    </span>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", backgroundColor: "rgba(255, 255, 255, 0.04)", padding: "18px", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 600, color: "#eceaf5", marginBottom: "6px" }}>
                      New Project Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai Diaries Season 3"
                      value={inlineProjTitle}
                      onChange={(e) => setInlineProjTitle(e.target.value)}
                      style={inputStyle}
                    />
                    {formErrors.inlineProjTitle && (
                      <span style={{ color: "var(--danger)", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>
                        {formErrors.inlineProjTitle}
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 600, color: "#eceaf5", marginBottom: "6px" }}>
                      Production Type
                    </label>
                    <select
                      value={inlineProjType}
                      onChange={(e) => setInlineProjType(e.target.value)}
                      style={{
                        ...inputStyle,
                        cursor: "pointer",
                      }}
                    >
                      {["OTT Series", "Feature Film", "Commercial / TVC", "Short Film", "Music Video", "Theater", "Documentary"].map((t) => (
                        <option key={t} value={t} style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 600, color: "#eceaf5", marginBottom: "6px" }}>
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
                        minHeight: "70px",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: OPPORTUNITY & CHARACTER ROLES */}
          {currentStep === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#eceaf5", marginBottom: "4px" }}>
                  2. Opportunity Details & Roles
                </h3>
                <p style={{ fontSize: "0.825rem", color: "#a3acc2", margin: 0 }}>
                  Define public opportunity titles, category, and character roles.
                </p>
              </div>

              <div className="form-responsive-grid-2">
                <div>
                  <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 600, color: "#eceaf5", marginBottom: "6px" }}>
                    Public Opportunity Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai Diaries S3 - Lead Doctor & Trauma Surgeon"
                    value={formData.title}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    style={inputStyle}
                  />
                  {formErrors.title && (
                    <span style={{ color: "var(--danger)", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>
                      {formErrors.title}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 600, color: "#eceaf5", marginBottom: "6px" }}>
                    Opportunity Type
                  </label>
                  <select
                    value={formData.opportunityType}
                    onChange={(e) => handleFieldChange("opportunityType", e.target.value)}
                    style={{
                      ...inputStyle,
                      cursor: "pointer",
                    }}
                  >
                    {OPPORTUNITY_TYPES.map((t) => (
                      <option key={t} value={t} style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-responsive-grid-3">
                <div>
                  <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 600, color: "#eceaf5", marginBottom: "6px" }}>
                    Shoot Location *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai Film City Studios"
                    value={formData.location}
                    onChange={(e) => handleFieldChange("location", e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 600, color: "#eceaf5", marginBottom: "6px" }}>
                    Remuneration Type
                  </label>
                  <select
                    value={formData.remunerationType}
                    onChange={(e) => handleFieldChange("remunerationType", e.target.value)}
                    style={{
                      ...inputStyle,
                      cursor: "pointer",
                    }}
                  >
                    {REMUNERATION_TYPES.map((rt) => (
                      <option key={rt} value={rt} style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>{rt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 600, color: "#eceaf5", marginBottom: "6px" }}>
                    Remuneration Details / Amount {formData.remunerationType === "Paid" ? "*" : ""}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹50,000 / day"
                    value={formData.remunerationAmount}
                    onChange={(e) => handleFieldChange("remunerationAmount", e.target.value)}
                    style={inputStyle}
                  />
                  {formErrors.remunerationAmount && (
                    <span style={{ color: "var(--danger)", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>
                      {formErrors.remunerationAmount}
                    </span>
                  )}
                </div>
              </div>

              {/* Character Roles Builder */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Character Roles ({formData.roles.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddRole}
                    className="btn-secondary"
                    style={{ padding: "6px 14px", fontSize: "0.785rem", gap: "4px", borderRadius: "10px", minHeight: "36px" }}
                  >
                    <Plus size={14} /> Add Role
                  </button>
                </div>

                {formData.roles.map((role, idx) => (
                  <div
                    key={role.id || idx}
                    style={{
                      padding: "16px",
                      borderRadius: "14px",
                      backgroundColor: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#eceaf5" }}>
                        Role #{idx + 1}
                      </span>
                      {formData.roles.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRole(idx)}
                          style={{
                            color: "var(--danger)",
                            fontSize: "0.75rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: "6px",
                            minHeight: "32px",
                          }}
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      )}
                    </div>

                    <div className="form-responsive-grid-3">
                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", color: "#a3acc2", marginBottom: "4px" }}>
                          Character Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Dr. Tanya Roy (Trauma Surgeon)"
                          value={role.roleName}
                          onChange={(e) => handleRoleChange(idx, "roleName", e.target.value)}
                          style={{ ...inputStyle, padding: "8px 12px", fontSize: "0.825rem" }}
                        />
                        {formErrors[`roleName_${idx}`] && (
                          <span style={{ color: "var(--danger)", fontSize: "0.75rem", marginTop: "2px", display: "block" }}>
                            {formErrors[`roleName_${idx}`]}
                          </span>
                        )}
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", color: "#a3acc2", marginBottom: "4px" }}>
                          Gender
                        </label>
                        <select
                          value={role.gender}
                          onChange={(e) => handleRoleChange(idx, "gender", e.target.value)}
                          style={{ ...inputStyle, padding: "8px 12px", fontSize: "0.825rem", cursor: "pointer" }}
                        >
                          <option value="Any" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Any Gender</option>
                          <option value="Female" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Female</option>
                          <option value="Male" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Male</option>
                          <option value="Non-Binary" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Non-Binary</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", color: "#a3acc2", marginBottom: "4px" }}>
                          Age Range
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 21 - 27 years"
                          value={role.ageRange}
                          onChange={(e) => handleRoleChange(idx, "ageRange", e.target.value)}
                          style={{ ...inputStyle, padding: "8px 12px", fontSize: "0.825rem" }}
                        />
                      </div>
                    </div>

                    <div className="form-responsive-grid-2">
                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", color: "#a3acc2", marginBottom: "4px" }}>
                          Skills & Attributes
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Fast Dialogue, Screen Acting"
                          value={role.skills}
                          onChange={(e) => handleRoleChange(idx, "skills", e.target.value)}
                          style={{ ...inputStyle, padding: "8px 12px", fontSize: "0.825rem" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", color: "#a3acc2", marginBottom: "4px" }}>
                          Languages Required
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Hindi (Fluent), English"
                          value={role.language}
                          onChange={(e) => handleRoleChange(idx, "language", e.target.value)}
                          style={{ ...inputStyle, padding: "8px 12px", fontSize: "0.825rem" }}
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
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#eceaf5", marginBottom: "4px" }}>
                  3. Eligibility Criteria & Application Deadline
                </h3>
                <p style={{ fontSize: "0.825rem", color: "#a3acc2", margin: 0 }}>
                  Set artist screening filters and the mandatory automatic expiration deadline.
                </p>
              </div>

              {/* Mandatory Deadline Card */}
              <div
                style={{
                  padding: "18px 20px",
                  borderRadius: "14px",
                  backgroundColor: "rgba(255, 188, 0, 0.08)",
                  border: "1px solid rgba(255, 188, 0, 0.25)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--gold)", fontWeight: 700, fontSize: "0.875rem" }}>
                  <Calendar size={18} />
                  <span>Mandatory Application Deadline *</span>
                </div>
                <p style={{ fontSize: "0.785rem", color: "#a3acc2", margin: 0 }}>
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
                    width: "100%",
                    maxWidth: "280px",
                    border: formErrors.deadline ? "1px solid var(--danger)" : "1px solid rgba(255, 188, 0, 0.35)",
                  }}
                />
                {formErrors.deadline && (
                  <span style={{ color: "var(--danger)", fontSize: "0.75rem", fontWeight: 600 }}>
                    {formErrors.deadline}
                  </span>
                )}
              </div>

              {/* Screening Eligibility Fields */}
              <div className="form-responsive-grid-3">
                <div>
                  <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 600, color: "#eceaf5", marginBottom: "6px" }}>
                    Min Age
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={80}
                    value={formData.ageMin}
                    onChange={(e) => handleFieldChange("ageMin", e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 600, color: "#eceaf5", marginBottom: "6px" }}>
                    Max Age
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={80}
                    value={formData.ageMax}
                    onChange={(e) => handleFieldChange("ageMax", e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 600, color: "#eceaf5", marginBottom: "6px" }}>
                    Target City / Territory
                  </label>
                  <input
                    type="text"
                    value={formData.eligibilityLocation}
                    onChange={(e) => handleFieldChange("eligibilityLocation", e.target.value)}
                    placeholder="e.g. Mumbai / Pan-India"
                    style={inputStyle}
                  />
                </div>
              </div>

              {formErrors.age && (
                <div style={{ color: "var(--danger)", fontSize: "0.8rem", fontWeight: 600 }}>
                  {formErrors.age}
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 600, color: "#eceaf5", marginBottom: "6px" }}>
                  Experience Guidelines
                </label>
                <input
                  type="text"
                  value={formData.experience}
                  onChange={(e) => handleFieldChange("experience", e.target.value)}
                  placeholder="e.g. 1+ years screen or professional theater experience"
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {/* STEP 4: FULL BRIEF & REVIEW */}
          {currentStep === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#eceaf5", marginBottom: "4px" }}>
                  4. Full Casting Brief & Final Review
                </h3>
                <p style={{ fontSize: "0.825rem", color: "#a3acc2", margin: 0 }}>
                  Review your opportunity before sending it to the Vismaya moderation desk.
                </p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 600, color: "#eceaf5", marginBottom: "6px" }}>
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
                    minHeight: "100px",
                  }}
                />
              </div>

              {/* Review Summary Card */}
              <div
                style={{
                  padding: "18px 20px",
                  borderRadius: "14px",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  fontSize: "0.85rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                  <span style={{ color: "#a3acc2" }}>Project:</span>
                  <strong style={{ color: "#eceaf5" }}>{selectedProject?.title || inlineProjTitle || "Assigned Project"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                  <span style={{ color: "#a3acc2" }}>Opportunity Title:</span>
                  <strong style={{ color: "#eceaf5" }}>{formData.title}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                  <span style={{ color: "#a3acc2" }}>Category:</span>
                  <strong style={{ color: "#eceaf5" }}>{formData.opportunityType}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                  <span style={{ color: "#a3acc2" }}>Remuneration:</span>
                  <strong style={{ color: "#eceaf5" }}>{formData.remunerationType === "Paid" ? formData.remunerationAmount : formData.remunerationType}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                  <span style={{ color: "#a3acc2" }}>Application Deadline:</span>
                  <strong style={{ color: "var(--gold)" }}>{formData.deadline} (Mandatory Future Date)</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                  <span style={{ color: "#a3acc2" }}>Character Roles:</span>
                  <strong style={{ color: "#eceaf5" }}>{formData.roles.length} Roles</strong>
                </div>
              </div>

              {/* Vismaya Moderation Notice Banner */}
              <div
                style={{
                  padding: "14px 18px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 188, 0, 0.12)",
                  border: "1px solid rgba(255, 188, 0, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "0.825rem",
                  color: "var(--gold)",
                }}
              >
                <ShieldCheck size={20} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Vismaya reviews every opportunity before it is published.</strong> Once submitted, the Vismaya team verifies budget escrow, character specs, and safety guidelines before making it live to verified talent.
                </span>
              </div>
            </div>
          )}

          {/* Sticky Stepper Navigation Footer */}
          <div
            style={{
              position: "sticky",
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "28px",
              borderTop: "1px solid rgba(255, 255, 255, 0.12)",
              padding: "16px 0 8px 0",
              paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))",
              backgroundColor: "rgba(10, 15, 25, 0.95)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              zIndex: 20,
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="btn-secondary"
                style={{ padding: "8px 18px", fontSize: "0.85rem", gap: "6px", borderRadius: "12px", minHeight: "44px" }}
              >
                <ArrowLeft size={15} /> Back
              </button>
            ) : (
              <Link
                href="/recruiter/opportunities"
                className="btn-ghost"
                style={{ fontSize: "0.85rem", color: "#a3acc2", borderRadius: "12px", padding: "8px 14px", minHeight: "44px", display: "inline-flex", alignItems: "center" }}
              >
                Cancel
              </Link>
            )}

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => handleFormSubmit(true)}
                className="btn-secondary"
                style={{ padding: "8px 18px", fontSize: "0.85rem", gap: "6px", borderRadius: "12px", minHeight: "44px" }}
              >
                <Save size={15} /> Save Draft
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary"
                  style={{ padding: "8px 22px", fontSize: "0.85rem", gap: "6px", borderRadius: "12px", minHeight: "44px" }}
                >
                  <span>Continue</span>
                  <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleFormSubmit(false)}
                  className="btn-primary"
                  style={{ padding: "8px 24px", fontSize: "0.85rem", gap: "6px", borderRadius: "12px", minHeight: "44px" }}
                >
                  <Check size={16} strokeWidth={2.5} />
                  <span>Submit to Vismaya</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Sticky Summary Card (340px, top 96px on >= 1200px) */}
        <div className="new-opp-summary-container">
          <div
            className="card-surface"
            style={{
              padding: "24px",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              position: "sticky",
              top: "96px",
              border: "1px solid var(--border-glass)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#eceaf5", margin: 0 }}>
                Opportunity overview
              </h3>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "var(--gold)",
                  backgroundColor: "rgba(255, 188, 0, 0.12)",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  textTransform: "uppercase",
                }}
              >
                Live preview
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "#a3acc2", display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: "700" }}>
                  Project container
                </span>
                <strong style={{ color: "#eceaf5" }}>
                  {selectedProject?.title || inlineProjTitle || "Untitled Project"}
                </strong>
              </div>

              <div>
                <span style={{ color: "#a3acc2", display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: "700" }}>
                  Opportunity title
                </span>
                <strong style={{ color: "var(--gold)" }}>
                  {formData.title || "Untitled Opportunity"}
                </strong>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <span style={{ color: "#a3acc2", display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: "700" }}>
                    Category
                  </span>
                  <span style={{ color: "#eceaf5" }}>{formData.opportunityType}</span>
                </div>
                <div>
                  <span style={{ color: "#a3acc2", display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: "700" }}>
                    Location
                  </span>
                  <span style={{ color: "#eceaf5" }}>{formData.location || "Mumbai"}</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <span style={{ color: "#a3acc2", display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: "700" }}>
                    Roles count
                  </span>
                  <strong style={{ color: "#34d399" }}>
                    {formData.roles.length} Role{formData.roles.length > 1 ? "s" : ""}
                  </strong>
                </div>
                <div>
                  <span style={{ color: "#a3acc2", display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: "700" }}>
                    Deadline
                  </span>
                  <span style={{ color: "#eceaf5" }}>
                    {formData.deadline ? new Date(formData.deadline).toLocaleDateString() : "Pending"}
                  </span>
                </div>
              </div>

              <div>
                <span style={{ color: "#a3acc2", display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: "700" }}>
                  Remuneration
                </span>
                <span style={{ color: "#eceaf5" }}>
                  {formData.remunerationType === "Paid" ? formData.remunerationAmount || "Paid Role" : formData.remunerationType}
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "10px",
                padding: "12px",
                fontSize: "12px",
                color: "#a3acc2",
                lineHeight: 1.4,
              }}
            >
              <span style={{ color: "var(--gold)", fontWeight: "600", display: "block", marginBottom: "2px" }}>
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
            onClick={handleBack}
            className="btn-secondary"
            style={{ height: "40px", padding: "0 14px", fontSize: "13px" }}
          >
            <ArrowLeft size={15} />
            <span>Back</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => handleFormSubmit(true)}
          className="btn-secondary"
          style={{ flex: 1, height: "40px", padding: "0 12px", fontSize: "13px" }}
        >
          <Save size={15} />
          <span>Save draft</span>
        </button>

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={handleNext}
            className="btn-primary"
            style={{ flex: 1.2, height: "40px", padding: "0 14px", fontSize: "13px" }}
          >
            <span>Continue</span>
            <ArrowRight size={15} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleFormSubmit(false)}
            className="btn-primary"
            style={{ flex: 1.4, height: "40px", padding: "0 14px", fontSize: "13px" }}
          >
            <Check size={15} />
            <span>Submit</span>
          </button>
        )}
      </div>

      <style jsx>{`
        .new-opp-workspace-layout {
          display: flex;
          align-items: flex-start;
          gap: 24px;
          width: 100%;
          min-width: 0;
        }

        .new-opp-summary-container {
          width: 340px;
          flex-shrink: 0;
        }

        .new-opp-mobile-action-bar {
          display: none;
        }

        .form-responsive-grid-2 {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 16px;
        }

        .form-responsive-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        @media (max-width: 1199.98px) {
          .new-opp-workspace-layout {
            flex-direction: column;
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
            gap: 12px !important;
          }
          .new-opp-workspace-layout {
            margin-bottom: 70px;
          }
          .new-opp-mobile-action-bar {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(10, 15, 25, 0.95);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-top: 1px solid rgba(255, 255, 255, 0.12);
            padding: 12px 16px;
            padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
            z-index: 45;
            gap: 10px;
            box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.5);
          }
        }
      `}</style>
    </div>
  );
}

export default function NewOpportunityPage() {
  return (
    <Suspense fallback={<div style={{ padding: "24px", color: "#a3acc2" }}>Loading opportunity form...</div>}>
      <SubmitOpportunityForm />
    </Suspense>
  );
}
