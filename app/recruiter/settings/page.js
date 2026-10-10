"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Building2,
  ShieldCheck,
  Lock,
  Bell,
  Save,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileText,
  Eye,
  EyeOff,
  Smartphone,
  MessageSquare,
  Mail,
  Check,
  Laptop,
  Globe,
  Radio,
  Clock,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  X,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import ProgressBar from "@/components/shared/ProgressBar";
import { useWorkflow } from "@/lib/shared/workflowStore";
import { authService } from "@/lib/api/services/authService";
import { isRealMode } from "@/lib/api/config";


const SETTINGS_MENU_ITEMS = [
  { key: "profile", label: "Organization profile", icon: Building2 },
  { key: "verification", label: "Verification status", icon: ShieldCheck },
  { key: "security", label: "Security and password", icon: Lock },
  { key: "notifications", label: "Notification channels", icon: Bell },
];

export default function OrganizationSettingsPage() {
  const { organizations, isHydrated } = useWorkflow();

  const currentOrg = useMemo(() => {
    return (
      organizations.find((o) => o.id === "org-1") ||
      organizations[0] || {
        name: "Zee Films",
        type: "Production House",
        status: "Verified",
        registrationNumber: "CIN: U92100MH1992PLC068301",
        gstNumber: "27AAACZ1234F1Z8",
        contactPerson: "Vikram Malhotra",
        contactEmail: "vikram.malhotra@zeefilms.com",
        contactPhone: "+91 98201 54321",
        address: "Plot 19, Film City Complex, Goregaon East, Mumbai, Maharashtra 400065",
      }
    );
  }, [organizations]);

  const [activeTab, setActiveTab] = useState("profile");
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState("success");
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);

  // Tab button refs for horizontal scrolling below 1024px
  const tabRefs = useRef({});

  // 1. Company Profile Form State & Initial Baseline
  const initialProfileState = useMemo(() => ({
    companyName: currentOrg.name || "Zee Films",
    companyType: currentOrg.type || "Production House",
    registrationNumber: currentOrg.registrationNumber || "CIN: U92100MH1992PLC068301",
    gstNumber: currentOrg.gstNumber || "27AAACZ1234F1Z8",
    website: "https://zeefilms.com",
    address: currentOrg.address || "Plot 19, Film City Complex, Goregaon East, Mumbai, Maharashtra 400065",
    contactPerson: currentOrg.contactPerson || "Vikram Malhotra",
    contactDesignation: "Head of Casting & Production",
    contactEmail: currentOrg.contactEmail || "vikram.malhotra@zeefilms.com",
    contactPhone: currentOrg.contactPhone || "+91 98201 54321",
    logoUrl: "",
  }), [currentOrg]);

  const [profileForm, setProfileForm] = useState(initialProfileState);
  const [profileErrors, setProfileErrors] = useState({});
  const [isProfileDirty, setIsProfileDirty] = useState(false);

  // 2. Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [securityErrors, setSecurityErrors] = useState({});

  // Active sessions state
  const [activeSessions, setActiveSessions] = useState([
    {
      id: "sess-1",
      device: "MacBook Pro 16\" • Chrome 124",
      location: "Mumbai, Maharashtra, India",
      lastActive: "Active now (Current session)",
      ip: "103.21.124.45",
      isCurrent: true,
    },
    {
      id: "sess-2",
      device: "Windows Desktop • Edge 122",
      location: "Bandra Studio, Mumbai",
      lastActive: "2 hours ago",
      ip: "103.21.124.89",
      isCurrent: false,
    },
    {
      id: "sess-3",
      device: "iPhone 15 Pro • Safari Mobile",
      location: "Andheri West, Mumbai",
      lastActive: "Yesterday at 6:45 PM",
      ip: "49.36.112.18",
      isCurrent: false,
    },
  ]);

  // 3. Notification Preferences State
  const initialNotifs = useMemo(() => ({
    inApp: true,
    email: true,
    sms: true,
    whatsapp: true,
    announcements: true,
  }), []);

  const [notifState, setNotifState] = useState(initialNotifs);
  const [isNotifDirty, setIsNotifDirty] = useState(false);

  // Sync profile form when currentOrg loads
  useEffect(() => {
    setProfileForm(initialProfileState);
    setIsProfileDirty(false);
  }, [initialProfileState]);

  const showFeedback = (msg, type = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Password Strength Calculation
  const calculatePasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  const passwordStrength = calculatePasswordStrength(newPassword);

  const getStrengthLabel = (score) => {
    if (score === 0) return "Empty";
    if (score <= 25) return "Weak";
    if (score <= 50) return "Fair";
    if (score <= 75) return "Good";
    return "Strong";
  };

  const getStrengthColor = (score) => {
    if (score <= 25) return "var(--danger)";
    if (score <= 50) return "var(--warning)";
    if (score <= 75) return "var(--info)";
    return "var(--success)";
  };

  // Tab switching with dirty state detection
  const handleTabClick = (key) => {
    if (key === activeTab) return;

    if (activeTab === "profile" && isProfileDirty) {
      setPendingTab(key);
      setShowUnsavedPrompt(true);
      return;
    }

    if (activeTab === "notifications" && isNotifDirty) {
      setPendingTab(key);
      setShowUnsavedPrompt(true);
      return;
    }

    switchTab(key);
  };

  const switchTab = (key) => {
    setActiveTab(key);
    setShowUnsavedPrompt(false);
    setPendingTab(null);

    // Scroll active tab into view on mobile
    if (tabRefs.current[key]) {
      tabRefs.current[key].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  };

  const handleDiscardChanges = () => {
    if (activeTab === "profile") {
      setProfileForm(initialProfileState);
      setProfileErrors({});
      setIsProfileDirty(false);
    }
    if (activeTab === "notifications") {
      setNotifState(initialNotifs);
      setIsNotifDirty(false);
    }
    if (pendingTab) {
      switchTab(pendingTab);
    } else {
      setShowUnsavedPrompt(false);
    }
  };

  // Profile Form Validation
  const validateProfileForm = () => {
    const errs = {};
    if (!profileForm.companyName.trim()) {
      errs.companyName = "Organization name is required.";
    }
    if (!profileForm.companyType) {
      errs.companyType = "Please select an organization type.";
    }
    if (!profileForm.address.trim()) {
      errs.address = "Registered studio address is required.";
    }
    if (!profileForm.contactPerson.trim()) {
      errs.contactPerson = "Authorized contact person is required.";
    }
    if (!profileForm.contactDesignation.trim()) {
      errs.contactDesignation = "Designation is required.";
    }
    if (!profileForm.contactEmail.trim()) {
      errs.contactEmail = "Work email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.contactEmail)) {
      errs.contactEmail = "Please enter a valid work email address.";
    }
    if (!profileForm.contactPhone.trim()) {
      errs.contactPhone = "Contact phone number is required.";
    } else if (profileForm.contactPhone.trim().length < 8) {
      errs.contactPhone = "Please enter a valid phone number with country code.";
    }
    if (profileForm.website && !/^https?:\/\//i.test(profileForm.website)) {
      errs.website = "Website must begin with http:// or https://";
    }

    setProfileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveProfile = (e) => {
    if (e) e.preventDefault();
    if (!validateProfileForm()) {
      showFeedback("Please resolve required fields before saving.", "error");
      return;
    }
    setIsProfileDirty(false);
    showFeedback("Organization identity and contact details saved successfully.");
  };

  const handleCancelProfile = () => {
    setProfileForm(initialProfileState);
    setProfileErrors({});
    setIsProfileDirty(false);
    showFeedback("Profile changes discarded.", "info");
  };

  // Security Form Submit
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!currentPassword) {
      errs.currentPassword = "Enter your current password.";
    }
    if (!newPassword || newPassword.length < 8) {
      errs.newPassword = "New password must be at least 8 characters long.";
    }
    if (newPassword !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errs).length > 0) {
      setSecurityErrors(errs);
      return;
    }

    if (isRealMode("auth")) {
      try {
        const res = await authService.changePassword({ currentPassword, newPassword });
        if (!res.success) {
          showFeedback(res.message || "Failed to update password. Please check your current password.", "error");
          return;
        }
      } catch (err) {
        showFeedback(err.message || "Error updating password.", "error");
        return;
      }
    }

    setSecurityErrors({});
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    showFeedback("Password updated securely.");
  };


  const handleSignOutSession = (sessionId) => {
    setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
    showFeedback("Signed out of session successfully.");
  };

  // Notifications Submit
  const handleSaveNotifications = (e) => {
    if (e) e.preventDefault();
    setIsNotifDirty(false);
    showFeedback("Notification delivery preferences saved.");
  };

  const handleCancelNotifications = () => {
    setNotifState(initialNotifs);
    setIsNotifDirty(false);
    showFeedback("Notification preferences reset.", "info");
  };

  if (!isHydrated) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
        <div style={{ height: "48px", background: "rgba(255, 255, 255, 0.06)", borderRadius: "12px", width: "40%" }} />
        <div style={{ height: "400px", background: "rgba(255, 255, 255, 0.06)", borderRadius: "16px" }} />
      </div>
    );
  }

  const inputStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    borderRadius: "10px",
    padding: "0 14px",
    height: "44px",
    minHeight: "44px",
    color: "#eceaf5",
    fontSize: "13px",
    fontFamily: "var(--font-body), 'Inter', sans-serif",
    outline: "none",
    colorScheme: "dark",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  };

  const isCurrentTabDirty = (activeTab === "profile" && isProfileDirty) || (activeTab === "notifications" && isNotifDirty);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%", minWidth: 0 }}>
      {/* Page Header */}
      <PageHeader
        title="Settings & Corporate Profile"
        subtitle="Manage organization verification credentials, authorized contact details, security, and notification channels."
        breadcrumbs={[
          { label: "Dashboard", href: "/recruiter/dashboard" },
          { label: "Settings" },
        ]}
      />

      {/* Feedback Toast Banner */}
      {toastMessage && (
        <div
          style={{
            backgroundColor:
              toastType === "error"
                ? "rgba(239, 68, 68, 0.15)"
                : toastType === "info"
                ? "rgba(59, 130, 246, 0.15)"
                : "rgba(52, 211, 153, 0.15)",
            border: `1px solid ${
              toastType === "error"
                ? "rgba(239, 68, 68, 0.35)"
                : toastType === "info"
                ? "rgba(59, 130, 246, 0.35)"
                : "rgba(52, 211, 153, 0.35)"
            }`,
            color:
              toastType === "error"
                ? "#ef4444"
                : toastType === "info"
                ? "#60a5fa"
                : "#34d399",
            padding: "14px 18px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13px",
            fontWeight: "600",
            backdropFilter: "blur(12px)",
          }}
        >
          {toastType === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Unsaved Changes Modal Dialog */}
      {showUnsavedPrompt && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(7, 11, 18, 0.8)",
            backdropFilter: "blur(8px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#0d1424",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "460px",
              width: "100%",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--gold)" }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#eceaf5", margin: 0 }}>
                Unsaved changes detected
              </h3>
            </div>
            <p style={{ fontSize: "13px", color: "#a3acc2", margin: 0, lineHeight: 1.5 }}>
              You have unsaved changes in this tab. If you switch tabs without saving, your modifications will be discarded.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={handleDiscardChanges}
                className="btn-danger-outline"
                style={{ height: "36px", padding: "0 16px", fontSize: "13px" }}
              >
                Discard changes
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeTab === "profile") handleSaveProfile();
                  if (activeTab === "notifications") handleSaveNotifications();
                  if (pendingTab) switchTab(pendingTab);
                }}
                className="btn-primary"
                style={{ height: "36px", padding: "0 16px", fontSize: "13px" }}
              >
                Save & continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Settings Layout */}
      <div className="settings-layout-container">
        {/* Left Sticky Settings Menu (Desktop) / Horizontal Tab Bar (Mobile) */}
        <nav aria-label="Settings categories" className="settings-menu-nav">
          <div className="settings-menu-track">
            {SETTINGS_MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;

              return (
                <button
                  key={item.key}
                  ref={(el) => (tabRefs.current[item.key] = el)}
                  type="button"
                  onClick={() => handleTabClick(item.key)}
                  className={`settings-menu-item ${isActive ? "active" : ""}`}
                >
                  <Icon size={20} className="menu-item-icon" />
                  <span className="menu-item-label">{item.label}</span>
                  {item.key === "profile" && isProfileDirty && (
                    <span className="dirty-dot" title="Unsaved edits" />
                  )}
                  {item.key === "notifications" && isNotifDirty && (
                    <span className="dirty-dot" title="Unsaved edits" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Right Settings Content Area */}
        <div className="settings-content-area">
          {/* TAB 1: ORGANIZATION PROFILE */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Card 1: Organization Identity */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <h2 className="settings-card-title">Organization identity</h2>
                    <p className="settings-card-desc">
                      Official company legal details and verified studio registration information.
                    </p>
                  </div>
                </div>

                <div className="settings-card-body">
                  <div className="settings-form-grid">
                    {/* Organization Name */}
                    <div className="form-group">
                      <label className="form-label">
                        Organization / Studio name <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        value={profileForm.companyName}
                        onChange={(e) => {
                          setProfileForm({ ...profileForm, companyName: e.target.value });
                          setIsProfileDirty(true);
                        }}
                        style={{
                          ...inputStyle,
                          borderColor: profileErrors.companyName ? "var(--danger)" : undefined,
                        }}
                        placeholder="e.g. Zee Films Studios"
                      />
                      {profileErrors.companyName && (
                        <span className="form-error">{profileErrors.companyName}</span>
                      )}
                    </div>

                    {/* Organization Type */}
                    <div className="form-group">
                      <label className="form-label">
                        Organization type <span className="req">*</span>
                      </label>
                      <select
                        value={profileForm.companyType}
                        onChange={(e) => {
                          setProfileForm({ ...profileForm, companyType: e.target.value });
                          setIsProfileDirty(true);
                        }}
                        style={{
                          ...inputStyle,
                          cursor: "pointer",
                          borderColor: profileErrors.companyType ? "var(--danger)" : undefined,
                        }}
                      >
                        <option value="Production House" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Production House</option>
                        <option value="Film Studio" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Film Studio</option>
                        <option value="Casting Agency" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Casting Agency</option>
                        <option value="Ad Film Agency" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Ad Film Agency</option>
                        <option value="OTT Platform / Studio" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>OTT Platform / Studio</option>
                        <option value="Independent Producer" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Independent Producer</option>
                      </select>
                      {profileErrors.companyType && (
                        <span className="form-error">{profileErrors.companyType}</span>
                      )}
                    </div>

                    {/* CIN */}
                    <div className="form-group">
                      <label className="form-label">
                        Corporate identification number (CIN)
                      </label>
                      <input
                        type="text"
                        value={profileForm.registrationNumber}
                        onChange={(e) => {
                          setProfileForm({ ...profileForm, registrationNumber: e.target.value });
                          setIsProfileDirty(true);
                        }}
                        style={inputStyle}
                        placeholder="e.g. U92100MH1992PLC068301"
                      />
                      <span className="form-hint">Format: 21-character alphanumeric MCA registration</span>
                    </div>

                    {/* GSTIN */}
                    <div className="form-group">
                      <label className="form-label">
                        GSTIN (Tax identification)
                      </label>
                      <input
                        type="text"
                        value={profileForm.gstNumber}
                        onChange={(e) => {
                          setProfileForm({ ...profileForm, gstNumber: e.target.value });
                          setIsProfileDirty(true);
                        }}
                        style={inputStyle}
                        placeholder="e.g. 27AAACZ1234F1Z8"
                      />
                      <span className="form-hint">Format: 15-character state-coded GST identification</span>
                    </div>

                    {/* Website URL */}
                    <div className="form-group span-full">
                      <label className="form-label">
                        Official website URL
                      </label>
                      <input
                        type="url"
                        value={profileForm.website}
                        onChange={(e) => {
                          setProfileForm({ ...profileForm, website: e.target.value });
                          setIsProfileDirty(true);
                        }}
                        style={{
                          ...inputStyle,
                          borderColor: profileErrors.website ? "var(--danger)" : undefined,
                        }}
                        placeholder="https://zeefilms.com"
                      />
                      {profileErrors.website && (
                        <span className="form-error">{profileErrors.website}</span>
                      )}
                    </div>

                    {/* Registered Address */}
                    <div className="form-group span-full">
                      <label className="form-label">
                        Registered studio address <span className="req">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={profileForm.address}
                        onChange={(e) => {
                          setProfileForm({ ...profileForm, address: e.target.value });
                          setIsProfileDirty(true);
                        }}
                        style={{
                          ...inputStyle,
                          height: "auto",
                          minHeight: "72px",
                          padding: "10px 14px",
                          resize: "vertical",
                          lineHeight: 1.5,
                          borderColor: profileErrors.address ? "var(--danger)" : undefined,
                        }}
                        placeholder="Complete studio/registered office address..."
                      />
                      {profileErrors.address && (
                        <span className="form-error">{profileErrors.address}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Authorized Contact */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <h2 className="settings-card-title">Authorized contact</h2>
                    <p className="settings-card-desc">
                      Vismaya coordinators and talent agents communicate with this designated point of contact.
                    </p>
                  </div>
                </div>

                <div className="settings-card-body">
                  <div className="settings-form-grid">
                    {/* Contact Person */}
                    <div className="form-group">
                      <label className="form-label">
                        Contact person <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        value={profileForm.contactPerson}
                        onChange={(e) => {
                          setProfileForm({ ...profileForm, contactPerson: e.target.value });
                          setIsProfileDirty(true);
                        }}
                        style={{
                          ...inputStyle,
                          borderColor: profileErrors.contactPerson ? "var(--danger)" : undefined,
                        }}
                        placeholder="e.g. Vikram Malhotra"
                      />
                      {profileErrors.contactPerson && (
                        <span className="form-error">{profileErrors.contactPerson}</span>
                      )}
                    </div>

                    {/* Designation */}
                    <div className="form-group">
                      <label className="form-label">
                        Designation / Role <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        value={profileForm.contactDesignation}
                        onChange={(e) => {
                          setProfileForm({ ...profileForm, contactDesignation: e.target.value });
                          setIsProfileDirty(true);
                        }}
                        style={{
                          ...inputStyle,
                          borderColor: profileErrors.contactDesignation ? "var(--danger)" : undefined,
                        }}
                        placeholder="e.g. Head of Casting"
                      />
                      {profileErrors.contactDesignation && (
                        <span className="form-error">{profileErrors.contactDesignation}</span>
                      )}
                    </div>

                    {/* Work Phone */}
                    <div className="form-group">
                      <label className="form-label">
                        Phone / WhatsApp <span className="req">*</span>
                      </label>
                      <input
                        type="tel"
                        value={profileForm.contactPhone}
                        onChange={(e) => {
                          setProfileForm({ ...profileForm, contactPhone: e.target.value });
                          setIsProfileDirty(true);
                        }}
                        style={{
                          ...inputStyle,
                          borderColor: profileErrors.contactPhone ? "var(--danger)" : undefined,
                        }}
                        placeholder="+91 98201 54321"
                      />
                      {profileErrors.contactPhone && (
                        <span className="form-error">{profileErrors.contactPhone}</span>
                      )}
                    </div>

                    {/* Work Email */}
                    <div className="form-group">
                      <label className="form-label">
                        Work email <span className="req">*</span>
                      </label>
                      <input
                        type="email"
                        value={profileForm.contactEmail}
                        onChange={(e) => {
                          setProfileForm({ ...profileForm, contactEmail: e.target.value });
                          setIsProfileDirty(true);
                        }}
                        style={{
                          ...inputStyle,
                          borderColor: profileErrors.contactEmail ? "var(--danger)" : undefined,
                        }}
                        placeholder="vikram@zeefilms.com"
                      />
                      {profileErrors.contactEmail && (
                        <span className="form-error">{profileErrors.contactEmail}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Studio Logo */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <h2 className="settings-card-title">Studio logo & branding</h2>
                    <p className="settings-card-desc">
                      Displayed on public opportunity briefs, talent call sheets, and audition communications.
                    </p>
                  </div>
                </div>

                <div className="settings-card-body">
                  <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "16px",
                        backgroundColor: "rgba(255, 188, 0, 0.12)",
                        border: "1px solid rgba(255, 188, 0, 0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "28px",
                        fontWeight: "800",
                        color: "var(--gold)",
                        flexShrink: 0,
                      }}
                    >
                      {profileForm.companyName.charAt(0).toUpperCase()}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "200px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "#eceaf5" }}>
                        Corporate watermark preview
                      </span>
                      <span className="form-hint">
                        Recommended: Square PNG, WebP or SVG format. Minimum resolution 400x400px (Max file size 2MB).
                      </span>
                      <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                        <button
                          type="button"
                          onClick={() => showFeedback("File selector opened for corporate logo upload.")}
                          className="btn-secondary"
                          style={{ height: "36px", padding: "0 14px", fontSize: "13px" }}
                        >
                          <UploadCloud size={15} style={{ color: "var(--gold)" }} />
                          <span>Upload logo</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop Card Footer */}
                <div className="settings-card-footer">
                  <div className="footer-actions">
                    <button
                      type="button"
                      onClick={handleCancelProfile}
                      className="btn-secondary"
                      disabled={!isProfileDirty}
                      style={{
                        height: "36px",
                        padding: "0 16px",
                        opacity: isProfileDirty ? 1 : 0.5,
                        cursor: isProfileDirty ? "pointer" : "not-allowed",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ height: "36px", padding: "0 20px" }}
                    >
                      <Save size={15} />
                      <span>Save changes</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: VERIFICATION STATUS */}
          {activeTab === "verification" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Status Banner Card */}
              <div className="settings-card">
                <div className="settings-card-body" style={{ padding: "24px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div
                        style={{
                          width: "52px",
                          height: "52px",
                          borderRadius: "14px",
                          backgroundColor: "rgba(52, 211, 153, 0.18)",
                          border: "1px solid rgba(52, 211, 153, 0.35)",
                          color: "#34d399",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <ShieldCheck size={28} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#eceaf5", margin: 0 }}>
                            Verification status:
                          </h2>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "700",
                              padding: "4px 12px",
                              borderRadius: "8px",
                              backgroundColor: "rgba(52, 211, 153, 0.2)",
                              color: "#34d399",
                              border: "1px solid rgba(52, 211, 153, 0.4)",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                            }}
                          >
                            Verified Organization
                          </span>
                        </div>
                        <p style={{ fontSize: "13px", color: "#a3acc2", margin: "4px 0 0 0" }}>
                          Last compliance review by Vismaya Senior Casting Desk: <strong>October 02, 2026</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents Card */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <h2 className="settings-card-title">Submitted compliance credentials</h2>
                    <p className="settings-card-desc">
                      Official credentials verified during onboarding to ensure authentic and compliant casting calls.
                    </p>
                  </div>
                </div>

                <div className="settings-card-body">
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {/* Document 1 */}
                    <div className="doc-row">
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
                        <div className="doc-icon-box">
                          <FileText size={20} style={{ color: "var(--gold)" }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <strong style={{ fontSize: "14px", color: "#eceaf5", display: "block" }}>
                            Company registration (Certificate of Incorporation)
                          </strong>
                          <span style={{ fontSize: "12px", color: "#a3acc2" }}>
                            CIN_Zee_Films_Incorporation_2026.pdf • Verified
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span className="status-chip-active">Verified</span>
                        <button
                          type="button"
                          onClick={() => showFeedback("Replace document dialog opened for Company Registration.")}
                          className="btn-secondary"
                          style={{ height: "36px", padding: "0 12px", fontSize: "13px" }}
                        >
                          Replace
                        </button>
                      </div>
                    </div>

                    {/* Document 2 */}
                    <div className="doc-row">
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
                        <div className="doc-icon-box">
                          <FileText size={20} style={{ color: "var(--gold)" }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <strong style={{ fontSize: "14px", color: "#eceaf5", display: "block" }}>
                            GST registration certificate
                          </strong>
                          <span style={{ fontSize: "12px", color: "#a3acc2" }}>
                            GSTIN_27AAACZ1234F1Z8_Cert.pdf • Verified
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span className="status-chip-active">Verified</span>
                        <button
                          type="button"
                          onClick={() => showFeedback("Replace document dialog opened for GST Certificate.")}
                          className="btn-secondary"
                          style={{ height: "36px", padding: "0 12px", fontSize: "13px" }}
                        >
                          Replace
                        </button>
                      </div>
                    </div>

                    {/* Document 3 */}
                    <div className="doc-row">
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
                        <div className="doc-icon-box">
                          <FileText size={20} style={{ color: "var(--gold)" }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <strong style={{ fontSize: "14px", color: "#eceaf5", display: "block" }}>
                            Authorized signatory identity proof
                          </strong>
                          <span style={{ fontSize: "12px", color: "#a3acc2" }}>
                            Govt_ID_Vikram_Malhotra.pdf • Verified
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span className="status-chip-active">Verified</span>
                        <button
                          type="button"
                          onClick={() => showFeedback("Replace document dialog opened for Signatory ID.")}
                          className="btn-secondary"
                          style={{ height: "36px", padding: "0 12px", fontSize: "13px" }}
                        >
                          Replace
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY & PASSWORD */}
          {activeTab === "security" && (
            <div className="security-tab-grid">
              {/* LEFT CARD: Change account password */}
              <form onSubmit={handleUpdatePassword} className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <h2 className="settings-card-title">Change account password</h2>
                    <p className="settings-card-desc">
                      Ensure your organization portal is protected with multi-layer strong credentials.
                    </p>
                  </div>
                </div>

                <div className="settings-card-body">
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
                    {/* Current Password */}
                    <div className="form-group">
                      <label className="form-label">
                        Current password <span className="req">*</span>
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        style={{
                          ...inputStyle,
                          borderColor: securityErrors.currentPassword ? "var(--danger)" : undefined,
                        }}
                        placeholder="••••••••••••"
                      />
                      {securityErrors.currentPassword && (
                        <span className="form-error">{securityErrors.currentPassword}</span>
                      )}
                    </div>

                    {/* New Password */}
                    <div className="form-group">
                      <label className="form-label">
                        New password <span className="req">*</span>
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          style={{
                            ...inputStyle,
                            paddingRight: "40px",
                            borderColor: securityErrors.newPassword ? "var(--danger)" : undefined,
                          }}
                          placeholder="••••••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          style={{
                            position: "absolute",
                            right: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "transparent",
                            border: "none",
                            color: "#a3acc2",
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {securityErrors.newPassword && (
                        <span className="form-error">{securityErrors.newPassword}</span>
                      )}

                      {/* Password Strength Indicator */}
                      {newPassword && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                          <ProgressBar
                            progress={passwordStrength}
                            color={getStrengthColor(passwordStrength)}
                            height={4}
                          />
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                            <span style={{ color: "#a3acc2" }}>
                              Strength: <strong style={{ color: getStrengthColor(passwordStrength) }}>{getStrengthLabel(passwordStrength)}</strong>
                            </span>
                            <span style={{ color: "#7c869e" }}>8+ chars, uppercase, number & symbol</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm New Password */}
                    <div className="form-group">
                      <label className="form-label">
                        Confirm new password <span className="req">*</span>
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={{
                          ...inputStyle,
                          borderColor: securityErrors.confirmPassword ? "var(--danger)" : undefined,
                        }}
                        placeholder="••••••••••••"
                      />
                      {securityErrors.confirmPassword && (
                        <span className="form-error">{securityErrors.confirmPassword}</span>
                      )}
                    </div>

                    {/* Password Requirements Checklist */}
                    <div
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "10px",
                        padding: "12px 14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#a3acc2" }}>
                        Password requirements:
                      </span>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "12px" }}>
                        <span style={{ color: newPassword.length >= 8 ? "#34d399" : "#7c869e", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Check size={12} /> At least 8 characters
                        </span>
                        <span style={{ color: /[A-Z]/.test(newPassword) ? "#34d399" : "#7c869e", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Check size={12} /> Uppercase letter
                        </span>
                        <span style={{ color: /[0-9]/.test(newPassword) ? "#34d399" : "#7c869e", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Check size={12} /> One number
                        </span>
                        <span style={{ color: /[^A-Za-z0-9]/.test(newPassword) ? "#34d399" : "#7c869e", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Check size={12} /> Special character
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="security-card-footer">
                  <div className="footer-actions" style={{ width: "100%", justifyContent: "flex-end" }}>
                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ height: "36px", padding: "0 20px" }}
                    >
                      <Lock size={15} />
                      <span>Update password</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* RIGHT CARD: Active login sessions */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <h2 className="settings-card-title">Active login sessions</h2>
                    <p className="settings-card-desc">
                      Manage devices and studio workstations currently authenticated with this organization profile.
                    </p>
                  </div>
                </div>

                <div className="settings-card-body">
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {activeSessions.map((sess) => (
                      <div key={sess.id} className="session-row">
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                          <div className="session-icon-box">
                            <Laptop size={20} style={{ color: sess.isCurrent ? "var(--gold)" : "#a3acc2" }} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                              <strong style={{ fontSize: "14px", color: "#eceaf5", overflowWrap: "anywhere" }}>
                                {sess.device}
                              </strong>
                              {sess.isCurrent && (
                                <span className="session-current-chip">Current device</span>
                              )}
                            </div>
                            <span style={{ fontSize: "12px", color: "#a3acc2", display: "block", overflowWrap: "anywhere", lineHeight: 1.4 }}>
                              {sess.location} • {sess.ip} • {sess.lastActive}
                            </span>
                          </div>
                        </div>

                        {!sess.isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleSignOutSession(sess.id)}
                            className="btn-secondary"
                            style={{ height: "36px", padding: "0 12px", fontSize: "13px", flexShrink: 0 }}
                          >
                            Sign out
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATION CHANNELS */}
          {activeTab === "notifications" && (
            <form onSubmit={handleSaveNotifications} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <h2 className="settings-card-title">Notification delivery channels</h2>
                    <p className="settings-card-desc">
                      Configure alert methods for candidate submissions, self-tapes forwarded by Vismaya, and audition bookings.
                    </p>
                  </div>
                </div>

                <div className="settings-card-body">
                  <div className="notif-channels-grid">
                    {/* In-App Alerts */}
                    <div className="channel-card">
                      <div className="channel-header">
                        <div className="channel-icon-box">
                          <Bell size={20} style={{ color: "var(--gold)" }} />
                        </div>
                        <input
                          type="checkbox"
                          checked={notifState.inApp}
                          onChange={(e) => {
                            setNotifState({ ...notifState, inApp: e.target.checked });
                            setIsNotifDirty(true);
                          }}
                          className="channel-toggle"
                          aria-label="Toggle in-app alerts"
                        />
                      </div>
                      <strong className="channel-title">In-app notifications</strong>
                      <p className="channel-desc">
                        Real-time alerts inside the Organization portal when talent applies, reviews conclude, or auditions arrive.
                      </p>
                    </div>

                    {/* Email Digest */}
                    <div className="channel-card">
                      <div className="channel-header">
                        <div className="channel-icon-box">
                          <Mail size={20} style={{ color: "var(--gold)" }} />
                        </div>
                        <input
                          type="checkbox"
                          checked={notifState.email}
                          onChange={(e) => {
                            setNotifState({ ...notifState, email: e.target.checked });
                            setIsNotifDirty(true);
                          }}
                          className="channel-toggle"
                          aria-label="Toggle email notifications"
                        />
                      </div>
                      <strong className="channel-title">Daily casting email digest</strong>
                      <p className="channel-desc">
                        Consolidated executive summary of applicant pipeline counts, shortlisted talent, and pending deadlines.
                      </p>
                    </div>

                    {/* WhatsApp Audition Alerts */}
                    <div className="channel-card">
                      <div className="channel-header">
                        <div className="channel-icon-box">
                          <MessageSquare size={20} style={{ color: "var(--gold)" }} />
                        </div>
                        <input
                          type="checkbox"
                          checked={notifState.whatsapp}
                          onChange={(e) => {
                            setNotifState({ ...notifState, whatsapp: e.target.checked });
                            setIsNotifDirty(true);
                          }}
                          className="channel-toggle"
                          aria-label="Toggle WhatsApp alerts"
                        />
                      </div>
                      <strong className="channel-title">WhatsApp audition updates</strong>
                      <p className="channel-desc">
                        Urgent instant notifications for confirmed audition callbacks and fast-turnaround self-tape submissions.
                      </p>
                    </div>

                    {/* SMS Urgent Updates */}
                    <div className="channel-card">
                      <div className="channel-header">
                        <div className="channel-icon-box">
                          <Smartphone size={20} style={{ color: "var(--gold)" }} />
                        </div>
                        <input
                          type="checkbox"
                          checked={notifState.sms}
                          onChange={(e) => {
                            setNotifState({ ...notifState, sms: e.target.checked });
                            setIsNotifDirty(true);
                          }}
                          className="channel-toggle"
                          aria-label="Toggle SMS alerts"
                        />
                      </div>
                      <strong className="channel-title">SMS critical alerts</strong>
                      <p className="channel-desc">
                        High-priority SMS alerts when talent confirms availability or when casting call deadlines reach zero.
                      </p>
                    </div>

                    {/* Vismaya System Announcements */}
                    <div className="channel-card span-full-desktop">
                      <div className="channel-header">
                        <div className="channel-icon-box">
                          <Radio size={20} style={{ color: "var(--gold)" }} />
                        </div>
                        <input
                          type="checkbox"
                          checked={notifState.announcements}
                          onChange={(e) => {
                            setNotifState({ ...notifState, announcements: e.target.checked });
                            setIsNotifDirty(true);
                          }}
                          className="channel-toggle"
                          aria-label="Toggle Vismaya announcements"
                        />
                      </div>
                      <strong className="channel-title">Vismaya casting desk bulletins</strong>
                      <p className="channel-desc">
                        Updates on platform casting guidelines, compliance protocols, and seasonal talent network expansions.
                      </p>
                    </div>
                  </div>

                  {/* Important note */}
                  <div
                    style={{
                      marginTop: "20px",
                      backgroundColor: "rgba(255, 188, 0, 0.08)",
                      border: "1px solid rgba(255, 188, 0, 0.25)",
                      borderRadius: "12px",
                      padding: "14px 18px",
                      fontSize: "12px",
                      color: "var(--gold)",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <Clock size={18} style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Notice:</strong> SMS and WhatsApp notifications are restricted exclusively to urgent updates (such as time-critical audition scheduling and call sheet confirmations) to maintain message privacy and avoid clutter.
                    </span>
                  </div>
                </div>

                <div className="settings-card-footer">
                  <div className="footer-actions">
                    <button
                      type="button"
                      onClick={handleCancelNotifications}
                      className="btn-secondary"
                      disabled={!isNotifDirty}
                      style={{
                        height: "36px",
                        padding: "0 16px",
                        opacity: isNotifDirty ? 1 : 0.5,
                        cursor: isNotifDirty ? "pointer" : "not-allowed",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ height: "36px", padding: "0 20px" }}
                    >
                      <Save size={15} />
                      <span>Save changes</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar for Editable Tabs */}
      {isCurrentTabDirty && (
        <div className="mobile-sticky-action-bar">
          <button
            type="button"
            onClick={activeTab === "profile" ? handleCancelProfile : handleCancelNotifications}
            className="btn-secondary"
            style={{ flex: 1, height: "40px", fontSize: "13px" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={activeTab === "profile" ? handleSaveProfile : handleSaveNotifications}
            className="btn-primary"
            style={{ flex: 1, height: "40px", fontSize: "13px" }}
          >
            <Save size={15} />
            <span>Save changes</span>
          </button>
        </div>
      )}

      {/* Scoped CSS styling for Part B Layout and Cards */}
      <style jsx>{`
        .settings-layout-container {
          display: flex;
          align-items: flex-start;
          gap: 32px;
          width: 100%;
          min-width: 0;
        }

        /* Desktop Sticky Left Menu */
        .settings-menu-nav {
          width: 240px;
          flex-shrink: 0;
          position: sticky;
          top: 96px;
          z-index: 10;
        }

        .settings-menu-track {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .settings-menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          height: 44px;
          min-height: 44px;
          padding: 0 16px;
          border-radius: 12px;
          background: transparent;
          border: 1px solid transparent;
          color: #a3acc2;
          font-family: var(--font-body), "Inter", sans-serif;
          font-size: 14px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.18s ease;
          position: relative;
        }

        .settings-menu-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #eceaf5;
        }

        .settings-menu-item.active {
          background: rgba(255, 188, 0, 0.14);
          color: var(--gold);
          border-left: 3px solid var(--gold);
        }

        .menu-item-icon {
          flex-shrink: 0;
        }

        .menu-item-label {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dirty-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--gold);
          flex-shrink: 0;
          box-shadow: 0 0 6px var(--gold);
        }

        /* Content Area */
        .settings-content-area {
          flex: 1;
          min-width: 0;
          width: 100%;
        }

        /* Standard Full-Width Settings Card */
        .settings-card {
          width: 100%;
          background: var(--bg-glass);
          border: 1px solid var(--border-glass);
          border-radius: 16px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .settings-card-header {
          padding: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justifyContent: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .settings-card-title {
          font-size: 18px;
          font-weight: 600;
          color: #eceaf5;
          margin: 0 0 4px 0;
        }

        .settings-card-desc {
          font-size: 13px;
          color: #a3acc2;
          margin: 0;
          line-height: 1.5;
        }

        .settings-card-body {
          padding: 24px;
        }

        .settings-card-footer {
          padding: 16px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.02);
          display: flex;
          align-items: center;
          justifyContent: flex-end;
        }

        .footer-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Form Grid */
        .settings-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px 24px;
          width: 100%;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .span-full {
          grid-column: 1 / -1;
        }

        .form-label {
          font-size: 13px;
          font-weight: 600;
          color: #eceaf5;
        }

        .req {
          color: var(--danger);
        }

        .form-hint {
          font-size: 12px;
          color: #7c869e;
          line-height: 1.4;
        }

        .form-error {
          font-size: 12px;
          color: var(--danger);
          font-weight: 500;
        }

        /* Document row */
        .doc-row {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justifyContent: space-between;
          flex-wrap: wrap;
          gap: 14px;
        }

        .doc-icon-box,
        .session-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justifyContent: center;
          flex-shrink: 0;
        }

        .status-chip-active {
          font-size: 12px;
          font-weight: 700;
          color: #34d399;
          background: rgba(52, 211, 153, 0.15);
          border: 1px solid rgba(52, 211, 153, 0.35);
          padding: 4px 10px;
          border-radius: 8px;
        }

        /* Session row */
        .session-row {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justifyContent: space-between;
          flex-wrap: wrap;
          gap: 14px;
        }

        .session-current-chip {
          font-size: 11px;
          font-weight: 700;
          color: var(--gold);
          background: rgba(255, 188, 0, 0.15);
          border: 1px solid rgba(255, 188, 0, 0.3);
          padding: 2px 8px;
          borderRadius: 6px;
        }

        /* Notification Channels Grid */
        .notif-channels-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .channel-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 14px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .span-full-desktop {
          grid-column: 1 / -1;
        }

        .channel-header {
          display: flex;
          align-items: center;
          justifyContent: space-between;
          margin-bottom: 4px;
        }

        .channel-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255, 188, 0, 0.12);
          border: 1px solid rgba(255, 188, 0, 0.25);
          display: flex;
          align-items: center;
          justifyContent: center;
        }

        .channel-toggle {
          width: 20px;
          height: 20px;
          accent-color: var(--gold);
          cursor: pointer;
        }

        .channel-title {
          font-size: 14px;
          font-weight: 600;
          color: #eceaf5;
        }

        .channel-desc {
          font-size: 12px;
          color: #a3acc2;
          margin: 0;
          line-height: 1.5;
        }

        /* Security Tab 2-Column Grid Layout */
        .security-tab-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
          align-items: start;
          width: 100%;
        }

        .security-card-footer {
          padding: 16px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.02);
          display: flex;
          align-items: center;
          justifyContent: flex-end;
        }

        /* Mobile Sticky Bottom Bar */
        .mobile-sticky-action-bar {
          display: none;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1023.98px) {
          .settings-layout-container {
            flex-direction: column;
            gap: 20px;
          }

          .settings-menu-nav {
            width: 100%;
            position: relative;
            top: 0;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }

          .settings-menu-nav::-webkit-scrollbar {
            display: none;
          }

          .settings-menu-track {
            flex-direction: row;
            gap: 8px;
            width: max-content;
            padding-bottom: 4px;
          }

          .settings-menu-item {
            flex-shrink: 0;
            border-left: 1px solid transparent;
            border-radius: 10px;
          }

          .settings-menu-item.active {
            border-left: 1px solid var(--gold);
            border-color: var(--gold);
          }
        }

        @media (max-width: 860px) {
          .security-tab-grid {
            grid-template-columns: 1fr !important;
            gap: 20px;
          }
        }

        @media (max-width: 767.98px) {
          .settings-card-header,
          .settings-card-body,
          .settings-card-footer {
            padding: 16px;
          }

          .security-card-footer {
            padding: 16px !important;
          }

          .settings-form-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .span-full {
            grid-column: 1;
          }

          .notif-channels-grid {
            grid-template-columns: 1fr;
          }

          .span-full-desktop {
            grid-column: 1;
          }

          .settings-card-footer {
            display: none;
          }

          .mobile-sticky-action-bar {
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
            gap: 12px;
            box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.5);
          }
        }
      `}</style>
    </div>
  );
}
