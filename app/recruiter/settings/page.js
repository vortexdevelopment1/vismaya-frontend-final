"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
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
  Smartphone,
  MessageSquare,
  Mail,
  Check,
  Laptop,
  Clock,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import ProgressBar from "@/components/shared/ProgressBar";
import PasswordInput from "@/components/PasswordInput";
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
    if (score <= 25) return "#B42318";
    if (score <= 50) return "#C9A55C";
    if (score <= 75) return "#8A6B2E";
    return "#8A6B2E";
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
    if (e) e.preventDefault();
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
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ height: "48px", background: "#F3EFE6", borderRadius: "12px", width: "40%" }} />
        <div style={{ height: "400px", background: "#FFFFFF", border: "1px solid #E8E2D4", borderRadius: "20px" }} />
      </div>
    );
  }

  const inputStyle = {
    backgroundColor: "#FFFFFF",
    border: "1px solid #D9D2C0",
    borderRadius: "10px",
    padding: "0 16px",
    height: "48px",
    minHeight: "48px",
    color: "#2B2D2A",
    fontSize: "15px",
    fontFamily: "var(--font-body), 'Inter', sans-serif",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  };

  const isCurrentTabDirty = (activeTab === "profile" && isProfileDirty) || (activeTab === "notifications" && isNotifDirty);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Page Header */}
      <div>
        <nav
          aria-label="Breadcrumb"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            color: "#5A584F",
            marginBottom: "8px",
            fontFamily: "var(--font-body), 'Inter', sans-serif",
          }}
        >
          <Link
            href="/recruiter/dashboard"
            style={{
              color: "#5A584F",
              textDecoration: "none",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#8A6B2E")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#5A584F")}
          >
            Dashboard
          </Link>
          <ChevronRight size={13} style={{ color: "#5A584F" }} />
          <span style={{ color: "#8A6B2E", fontWeight: 600 }}>Settings</span>
        </nav>

        <h1
          style={{
            fontFamily: "Playfair Display, Georgia, serif",
            fontSize: "40px",
            fontWeight: 700,
            color: "#2B2D2A",
            margin: "0 0 8px 0",
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
          }}
        >
          Settings & Corporate Profile
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body), 'Inter', sans-serif",
            fontSize: "16px",
            color: "#5A584F",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Manage organization verification credentials, authorized contact details, security, and notification channels.
        </p>
      </div>

      {/* Feedback Toast Banner */}
      {toastMessage && (
        <div
          style={{
            backgroundColor:
              toastType === "error"
                ? "rgba(180, 35, 24, 0.08)"
                : toastType === "info"
                ? "rgba(138, 107, 46, 0.08)"
                : "rgba(138, 107, 46, 0.12)",
            border: `1px solid ${
              toastType === "error"
                ? "rgba(180, 35, 24, 0.3)"
                : "#C9A55C"
            }`,
            color:
              toastType === "error"
                ? "#B42318"
                : "#6E5420",
            padding: "14px 20px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
            fontWeight: 600,
            boxShadow: "0 2px 8px rgba(43, 45, 42, 0.04)",
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
            backgroundColor: "rgba(43, 45, 42, 0.55)",
            backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E2D4",
              borderRadius: "16px",
              padding: "28px",
              maxWidth: "460px",
              width: "100%",
              boxShadow: "0 20px 50px rgba(43, 45, 42, 0.15)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#8A6B2E" }}>
              <AlertTriangle size={24} />
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#2B2D2A",
                  margin: 0,
                  fontFamily: "Playfair Display, Georgia, serif",
                }}
              >
                Unsaved changes detected
              </h3>
            </div>
            <p
              style={{
                fontSize: "14px",
                color: "#5A584F",
                margin: 0,
                lineHeight: 1.5,
                fontFamily: "var(--font-body), 'Inter', sans-serif",
              }}
            >
              You have unsaved changes in this tab. If you switch tabs without saving, your modifications will be discarded.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={handleDiscardChanges}
                style={{
                  height: "42px",
                  padding: "0 18px",
                  borderRadius: "10px",
                  border: "1px solid #B42318",
                  background: "transparent",
                  color: "#B42318",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
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
                style={{
                  height: "42px",
                  padding: "0 20px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#8A6B2E",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
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
                  <span className="menu-item-icon-wrap">
                    <Icon size={20} />
                  </span>
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
            <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
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
                          borderColor: profileErrors.companyName ? "#B42318" : "#D9D2C0",
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
                        className="form-select"
                        style={{
                          ...inputStyle,
                          cursor: "pointer",
                          borderColor: profileErrors.companyType ? "#B42318" : "#D9D2C0",
                        }}
                      >
                        <option value="Production House">Production House</option>
                        <option value="Film Studio">Film Studio</option>
                        <option value="Casting Agency">Casting Agency</option>
                        <option value="Ad Film Agency">Ad Film Agency</option>
                        <option value="OTT Platform / Studio">OTT Platform / Studio</option>
                        <option value="Independent Producer">Independent Producer</option>
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
                          borderColor: profileErrors.website ? "#B42318" : "#D9D2C0",
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
                        rows={3}
                        value={profileForm.address}
                        onChange={(e) => {
                          setProfileForm({ ...profileForm, address: e.target.value });
                          setIsProfileDirty(true);
                        }}
                        style={{
                          ...inputStyle,
                          height: "auto",
                          minHeight: "110px",
                          padding: "12px 16px",
                          resize: "vertical",
                          lineHeight: 1.5,
                          borderColor: profileErrors.address ? "#B42318" : "#D9D2C0",
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
                          borderColor: profileErrors.contactPerson ? "#B42318" : "#D9D2C0",
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
                          borderColor: profileErrors.contactDesignation ? "#B42318" : "#D9D2C0",
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
                          borderColor: profileErrors.contactPhone ? "#B42318" : "#D9D2C0",
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
                          borderColor: profileErrors.contactEmail ? "#B42318" : "#D9D2C0",
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
                        backgroundColor: "#F3EFE6",
                        border: "1px solid #E8E2D4",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "32px",
                        fontWeight: "700",
                        fontFamily: "Playfair Display, Georgia, serif",
                        color: "#8A6B2E",
                        flexShrink: 0,
                      }}
                    >
                      {profileForm.companyName.charAt(0).toUpperCase()}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "220px" }}>
                      <span style={{ fontSize: "15px", fontWeight: "600", color: "#2B2D2A" }}>
                        Corporate watermark preview
                      </span>
                      <span className="form-hint" style={{ marginTop: 0 }}>
                        Recommended: Square PNG, WebP or SVG format. Minimum resolution 400x400px (Max file size 2MB).
                      </span>
                      <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                        <button
                          type="button"
                          onClick={() => showFeedback("File selector opened for corporate logo upload.")}
                          className="btn-upload-logo"
                        >
                          <UploadCloud size={16} style={{ color: "#8A6B2E" }} />
                          <span>Upload logo</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer / Save Bar */}
                <div className="settings-card-footer settings-save-bar">
                  <div className="footer-actions">
                    <button
                      type="button"
                      onClick={handleCancelProfile}
                      className="btn-ghost-cancel"
                      disabled={!isProfileDirty}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary-gold"
                    >
                      <Save size={16} />
                      <span>Save changes</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: VERIFICATION STATUS */}
          {activeTab === "verification" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {/* Status Banner Card */}
              <div className="settings-card">
                <div className="settings-card-body" style={{ padding: "32px" }}>
                  <div
                    style={{
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
                          borderRadius: "16px",
                          backgroundColor: "rgba(138, 107, 46, 0.12)",
                          border: "1px solid rgba(138, 107, 46, 0.25)",
                          color: "#8A6B2E",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <ShieldCheck size={30} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                          <h2
                            style={{
                              fontSize: "22px",
                              fontWeight: "700",
                              color: "#2B2D2A",
                              fontFamily: "Playfair Display, Georgia, serif",
                              margin: 0,
                            }}
                          >
                            Verification status:
                          </h2>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "700",
                              padding: "4px 12px",
                              borderRadius: "8px",
                              backgroundColor: "rgba(138, 107, 46, 0.12)",
                              color: "#6E5420",
                              border: "1px solid rgba(138, 107, 46, 0.25)",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <Check size={14} />
                            Verified Organization
                          </span>
                        </div>
                        <p style={{ fontSize: "14px", color: "#5A584F", margin: "6px 0 0 0" }}>
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
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {/* Document 1 */}
                    <div className="doc-row">
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0 }}>
                        <div className="doc-icon-box">
                          <FileText size={20} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <strong style={{ fontSize: "15px", color: "#2B2D2A", display: "block", fontWeight: 600 }}>
                            Company registration (Certificate of Incorporation)
                          </strong>
                          <span style={{ fontSize: "13px", color: "#5A584F", marginTop: "2px", display: "block" }}>
                            CIN_Zee_Films_Incorporation_2026.pdf • Verified
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <span className="status-chip-active">Verified</span>
                        <button
                          type="button"
                          onClick={() => showFeedback("Replace document dialog opened for Company Registration.")}
                          className="btn-replace-doc"
                        >
                          Replace
                        </button>
                      </div>
                    </div>

                    {/* Document 2 */}
                    <div className="doc-row">
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0 }}>
                        <div className="doc-icon-box">
                          <FileText size={20} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <strong style={{ fontSize: "15px", color: "#2B2D2A", display: "block", fontWeight: 600 }}>
                            GST registration certificate
                          </strong>
                          <span style={{ fontSize: "13px", color: "#5A584F", marginTop: "2px", display: "block" }}>
                            GSTIN_27AAACZ1234F1Z8_Cert.pdf • Verified
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <span className="status-chip-active">Verified</span>
                        <button
                          type="button"
                          onClick={() => showFeedback("Replace document dialog opened for GST Certificate.")}
                          className="btn-replace-doc"
                        >
                          Replace
                        </button>
                      </div>
                    </div>

                    {/* Document 3 */}
                    <div className="doc-row">
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0 }}>
                        <div className="doc-icon-box">
                          <FileText size={20} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <strong style={{ fontSize: "15px", color: "#2B2D2A", display: "block", fontWeight: 600 }}>
                            Authorized signatory identity proof
                          </strong>
                          <span style={{ fontSize: "13px", color: "#5A584F", marginTop: "2px", display: "block" }}>
                            Govt_ID_Vikram_Malhotra.pdf • Verified
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <span className="status-chip-active">Verified</span>
                        <button
                          type="button"
                          onClick={() => showFeedback("Replace document dialog opened for Signatory ID.")}
                          className="btn-replace-doc"
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
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
                    {/* Current Password */}
                    <div className="form-group">
                      <label className="form-label">
                        Current password <span className="req">*</span>
                      </label>
                      <PasswordInput
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        inputStyle={{
                          ...inputStyle,
                          borderColor: securityErrors.currentPassword ? "#B42318" : "#D9D2C0",
                        }}
                        placeholder="••••••••••••"
                        required
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
                      <PasswordInput
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        inputStyle={{
                          ...inputStyle,
                          borderColor: securityErrors.newPassword ? "#B42318" : "#D9D2C0",
                        }}
                        placeholder="••••••••••••"
                        required
                      />
                      {securityErrors.newPassword && (
                        <span className="form-error">{securityErrors.newPassword}</span>
                      )}

                      {/* Password Strength Indicator */}
                      {newPassword && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                          <ProgressBar
                            value={passwordStrength}
                            color={getStrengthColor(passwordStrength)}
                            height="5px"
                            showPercentage={false}
                          />
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                            <span style={{ color: "#5A584F" }}>
                              Strength: <strong style={{ color: getStrengthColor(passwordStrength) }}>{getStrengthLabel(passwordStrength)}</strong>
                            </span>
                            <span style={{ color: "#5A584F" }}>8+ chars, uppercase, number & symbol</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm New Password */}
                    <div className="form-group">
                      <label className="form-label">
                        Confirm new password <span className="req">*</span>
                      </label>
                      <PasswordInput
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        inputStyle={{
                          ...inputStyle,
                          borderColor: securityErrors.confirmPassword ? "#B42318" : "#D9D2C0",
                        }}
                        placeholder="••••••••••••"
                        required
                      />
                      {securityErrors.confirmPassword && (
                        <span className="form-error">{securityErrors.confirmPassword}</span>
                      )}
                    </div>

                    {/* Password Requirements Checklist */}
                    <div
                      style={{
                        backgroundColor: "#FAF9F7",
                        border: "1px solid #E8E2D4",
                        borderRadius: "10px",
                        padding: "14px 16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#2B2D2A" }}>
                        Password requirements:
                      </span>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "13px" }}>
                        <span style={{ color: newPassword.length >= 8 ? "#2B2D2A" : "#5A584F", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Check size={14} style={{ color: newPassword.length >= 8 ? "#8A6B2E" : "#D9D2C0" }} /> At least 8 characters
                        </span>
                        <span style={{ color: /[A-Z]/.test(newPassword) ? "#2B2D2A" : "#5A584F", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Check size={14} style={{ color: /[A-Z]/.test(newPassword) ? "#8A6B2E" : "#D9D2C0" }} /> Uppercase letter
                        </span>
                        <span style={{ color: /[0-9]/.test(newPassword) ? "#2B2D2A" : "#5A584F", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Check size={14} style={{ color: /[0-9]/.test(newPassword) ? "#8A6B2E" : "#D9D2C0" }} /> One number
                        </span>
                        <span style={{ color: /[^A-Za-z0-9]/.test(newPassword) ? "#2B2D2A" : "#5A584F", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Check size={14} style={{ color: /[^A-Za-z0-9]/.test(newPassword) ? "#8A6B2E" : "#D9D2C0" }} /> Special character
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="settings-card-footer settings-save-bar">
                  <div className="footer-actions">
                    <button
                      type="submit"
                      className="btn-primary-gold"
                    >
                      <Lock size={16} />
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
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {activeSessions.map((sess) => (
                      <div key={sess.id} className="session-row">
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0, flex: 1 }}>
                          <div className="session-icon-box">
                            <Laptop size={20} style={{ color: sess.isCurrent ? "#8A6B2E" : "#5A584F" }} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                              <strong style={{ fontSize: "15px", color: "#2B2D2A", fontWeight: 600, overflowWrap: "anywhere" }}>
                                {sess.device}
                              </strong>
                              {sess.isCurrent && (
                                <span className="session-current-chip">Current device</span>
                              )}
                            </div>
                            <span style={{ fontSize: "13px", color: "#5A584F", display: "block", overflowWrap: "anywhere", lineHeight: 1.4 }}>
                              {sess.location} • {sess.ip} • {sess.lastActive}
                            </span>
                          </div>
                        </div>

                        {!sess.isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleSignOutSession(sess.id)}
                            className="btn-signout-session"
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
            <form onSubmit={handleSaveNotifications} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
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
                  <div className="notif-channels-list">
                    {/* In-App Alerts */}
                    <div className="channel-row">
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", minWidth: 0, flex: 1 }}>
                        <div className="channel-icon-box">
                          <Bell size={20} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <strong className="channel-title">In-app notifications</strong>
                          <p className="channel-desc">
                            Real-time alerts inside the Organization portal when talent applies, reviews conclude, or auditions arrive.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifState.inApp}
                        aria-label="Toggle in-app alerts"
                        onClick={() => {
                          setNotifState({ ...notifState, inApp: !notifState.inApp });
                          setIsNotifDirty(true);
                        }}
                        className="notif-toggle-btn"
                        style={{
                          backgroundColor: notifState.inApp ? "#8A6B2E" : "#E8E2D4",
                        }}
                      >
                        <span
                          className="notif-toggle-knob"
                          style={{
                            transform: notifState.inApp ? "translateX(18px)" : "translateX(0px)",
                          }}
                        />
                      </button>
                    </div>

                    {/* Email Digest */}
                    <div className="channel-row">
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", minWidth: 0, flex: 1 }}>
                        <div className="channel-icon-box">
                          <Mail size={20} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <strong className="channel-title">Daily casting email digest</strong>
                          <p className="channel-desc">
                            Consolidated executive summary of applicant pipeline counts, shortlisted talent, and pending deadlines.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifState.email}
                        aria-label="Toggle email notifications"
                        onClick={() => {
                          setNotifState({ ...notifState, email: !notifState.email });
                          setIsNotifDirty(true);
                        }}
                        className="notif-toggle-btn"
                        style={{
                          backgroundColor: notifState.email ? "#8A6B2E" : "#E8E2D4",
                        }}
                      >
                        <span
                          className="notif-toggle-knob"
                          style={{
                            transform: notifState.email ? "translateX(18px)" : "translateX(0px)",
                          }}
                        />
                      </button>
                    </div>

                    {/* WhatsApp Audition Alerts */}
                    <div className="channel-row">
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", minWidth: 0, flex: 1 }}>
                        <div className="channel-icon-box">
                          <MessageSquare size={20} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <strong className="channel-title">WhatsApp audition updates</strong>
                          <p className="channel-desc">
                            Urgent instant notifications for confirmed audition callbacks and fast-turnaround self-tape submissions.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifState.whatsapp}
                        aria-label="Toggle WhatsApp alerts"
                        onClick={() => {
                          setNotifState({ ...notifState, whatsapp: !notifState.whatsapp });
                          setIsNotifDirty(true);
                        }}
                        className="notif-toggle-btn"
                        style={{
                          backgroundColor: notifState.whatsapp ? "#8A6B2E" : "#E8E2D4",
                        }}
                      >
                        <span
                          className="notif-toggle-knob"
                          style={{
                            transform: notifState.whatsapp ? "translateX(18px)" : "translateX(0px)",
                          }}
                        />
                      </button>
                    </div>

                    {/* SMS Urgent Updates */}
                    <div className="channel-row">
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", minWidth: 0, flex: 1 }}>
                        <div className="channel-icon-box">
                          <Smartphone size={20} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <strong className="channel-title">SMS critical alerts</strong>
                          <p className="channel-desc">
                            High-priority SMS alerts when talent confirms availability or when casting call deadlines reach zero.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifState.sms}
                        aria-label="Toggle SMS alerts"
                        onClick={() => {
                          setNotifState({ ...notifState, sms: !notifState.sms });
                          setIsNotifDirty(true);
                        }}
                        className="notif-toggle-btn"
                        style={{
                          backgroundColor: notifState.sms ? "#8A6B2E" : "#E8E2D4",
                        }}
                      >
                        <span
                          className="notif-toggle-knob"
                          style={{
                            transform: notifState.sms ? "translateX(18px)" : "translateX(0px)",
                          }}
                        />
                      </button>
                    </div>

                    {/* Vismaya System Announcements */}
                    <div className="channel-row">
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", minWidth: 0, flex: 1 }}>
                        <div className="channel-icon-box">
                          <Bell size={20} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <strong className="channel-title">Vismaya casting desk bulletins</strong>
                          <p className="channel-desc">
                            Updates on platform casting guidelines, compliance protocols, and seasonal talent network expansions.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifState.announcements}
                        aria-label="Toggle Vismaya announcements"
                        onClick={() => {
                          setNotifState({ ...notifState, announcements: !notifState.announcements });
                          setIsNotifDirty(true);
                        }}
                        className="notif-toggle-btn"
                        style={{
                          backgroundColor: notifState.announcements ? "#8A6B2E" : "#E8E2D4",
                        }}
                      >
                        <span
                          className="notif-toggle-knob"
                          style={{
                            transform: notifState.announcements ? "translateX(18px)" : "translateX(0px)",
                          }}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Important note */}
                  <div
                    style={{
                      marginTop: "24px",
                      backgroundColor: "#F3EFE6",
                      border: "1px solid #E8E2D4",
                      borderRadius: "12px",
                      padding: "16px 20px",
                      fontSize: "13px",
                      color: "#5A584F",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      lineHeight: 1.5,
                    }}
                  >
                    <Clock size={20} style={{ color: "#8A6B2E", flexShrink: 0 }} />
                    <span>
                      <strong style={{ color: "#2B2D2A" }}>Notice:</strong> SMS and WhatsApp notifications are restricted exclusively to urgent updates (such as time-critical audition scheduling and call sheet confirmations) to maintain message privacy and avoid clutter.
                    </span>
                  </div>
                </div>

                <div className="settings-card-footer settings-save-bar">
                  <div className="footer-actions">
                    <button
                      type="button"
                      onClick={handleCancelNotifications}
                      className="btn-ghost-cancel"
                      disabled={!isNotifDirty}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary-gold"
                    >
                      <Save size={16} />
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
            className="btn-ghost-cancel"
            style={{ flex: 1, height: "48px" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={activeTab === "profile" ? handleSaveProfile : handleSaveNotifications}
            className="btn-primary-gold"
            style={{ flex: 1, height: "48px" }}
          >
            <Save size={16} />
            <span>Save changes</span>
          </button>
        </div>
      )}

      {/* Scoped CSS styling */}
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
          flex: 0 0 280px;
          width: 280px;
          position: sticky;
          top: calc(var(--topbar-height, 72px) + 24px);
          z-index: 10;
          background: #FFFFFF;
          border: 1px solid #E8E2D4;
          border-radius: 16px;
          padding: 8px;
          box-shadow: 0 2px 4px rgba(43, 45, 42, 0.04), 0 8px 24px rgba(43, 45, 42, 0.04);
          box-sizing: border-box;
        }

        .settings-menu-track {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 100%;
        }

        .settings-menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 10px;
          width: 100%;
          border: none;
          border-left: 3px solid transparent;
          background: transparent;
          color: #5A584F;
          font-family: var(--font-body), "Inter", sans-serif;
          font-size: 15px;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.18s ease;
          position: relative;
          box-sizing: border-box;
        }

        .settings-menu-item:hover {
          background-color: #F3EFE6;
          color: #2B2D2A;
        }

        .settings-menu-item.active {
          background-color: #F3EFE6;
          color: #8A6B2E;
          font-weight: 600;
          border-left: 3px solid #8A6B2E;
        }

        .settings-menu-item:focus-visible {
          outline: 2px solid #8A6B2E;
          outline-offset: 2px;
        }

        .menu-item-icon-wrap {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: inherit;
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
          background: #8A6B2E;
          flex-shrink: 0;
          box-shadow: 0 0 6px rgba(138, 107, 46, 0.5);
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
          background: #FFFFFF;
          border: 1px solid #E8E2D4;
          border-radius: 20px;
          box-shadow: 0 2px 4px rgba(43, 45, 42, 0.04), 0 14px 32px rgba(43, 45, 42, 0.06);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }

        .settings-card-header {
          padding: 36px 40px 20px 40px;
          border-bottom: 1px solid #E8E2D4;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .settings-card-title {
          font-family: Playfair Display, Georgia, serif;
          font-size: 28px;
          font-weight: 700;
          color: #2B2D2A;
          margin: 0 0 6px 0;
          line-height: 1.25;
        }

        .settings-card-desc {
          font-family: var(--font-body), "Inter", sans-serif;
          font-size: 15px;
          color: #5A584F;
          margin: 0;
          line-height: 1.5;
        }

        .settings-card-body {
          padding: 32px 40px;
        }

        .settings-card-footer {
          padding: 24px 40px 32px 40px;
          border-top: 1px solid #E8E2D4;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        .footer-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Buttons */
        .btn-ghost-cancel {
          height: 48px;
          padding: 0 24px;
          border-radius: 10px;
          border: 1px solid #E8E2D4;
          background-color: #FAF9F7;
          color: #5A584F;
          font-family: var(--font-body), "Inter", sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-ghost-cancel:hover:not(:disabled) {
          background-color: #F3EFE6;
          color: #2B2D2A;
        }

        .btn-ghost-cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary-gold {
          height: 48px;
          padding: 0 28px;
          border-radius: 10px;
          border: none;
          background-color: #8A6B2E;
          color: #FFFFFF;
          font-family: var(--font-body), "Inter", sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background-color 0.2s ease;
        }

        .btn-primary-gold:hover {
          background-color: #6E5420;
        }

        .btn-upload-logo {
          height: 42px;
          padding: 0 18px;
          border-radius: 10px;
          border: 1px solid #E8E2D4;
          background: #FAF9F7;
          color: #2B2D2A;
          font-family: var(--font-body), "Inter", sans-serif;
          font-size: 14px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-upload-logo:hover {
          background: #F3EFE6;
          border-color: #C9A55C;
        }

        .btn-replace-doc {
          height: 38px;
          padding: 0 16px;
          border-radius: 10px;
          border: 1px solid #E8E2D4;
          background: #FAF9F7;
          color: #2B2D2A;
          font-family: var(--font-body), "Inter", sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-replace-doc:hover {
          background: #F3EFE6;
        }

        .btn-signout-session {
          height: 38px;
          padding: 0 16px;
          border-radius: 10px;
          border: 1px solid #E8E2D4;
          background: #FAF9F7;
          color: #2B2D2A;
          font-family: var(--font-body), "Inter", sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .btn-signout-session:hover {
          background: #F3EFE6;
          border-color: rgba(180, 35, 24, 0.3);
          color: #B42318;
        }

        /* Form Grid */
        .settings-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 24px 28px;
          width: 100%;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .span-full {
          grid-column: 1 / -1;
        }

        .form-label {
          font-family: var(--font-body), "Inter", sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #2B2D2A;
          margin-bottom: 8px;
          display: block;
        }

        .req {
          color: #B42318;
          font-weight: 700;
          margin-left: 2px;
        }

        .form-hint {
          font-family: var(--font-body), "Inter", sans-serif;
          font-size: 13px;
          color: #5A584F;
          line-height: 1.4;
          margin-top: 6px;
          display: block;
        }

        .form-error {
          font-family: var(--font-body), "Inter", sans-serif;
          font-size: 13px;
          color: #B42318;
          font-weight: 500;
          margin-top: 6px;
          display: block;
        }

        .form-select {
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235A584F' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 16px center;
          background-size: 16px 16px;
          padding-right: 44px !important;
        }

        /* Focus states */
        input:focus,
        select:focus,
        textarea:focus {
          border-color: #8A6B2E !important;
          box-shadow: 0 0 0 3px rgba(138, 107, 46, 0.18) !important;
          outline: none !important;
        }

        input::placeholder,
        textarea::placeholder {
          color: #6B6A63 !important;
          opacity: 1 !important;
        }

        /* Document row */
        .doc-row {
          padding: 20px 0;
          border-bottom: 1px solid #E8E2D4;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .doc-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .doc-row:first-child {
          padding-top: 0;
        }

        .doc-icon-box,
        .session-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #F3EFE6;
          border: 1px solid #E8E2D4;
          color: #8A6B2E;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .status-chip-active {
          font-family: var(--font-body), "Inter", sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: #6E5420;
          background: rgba(138, 107, 46, 0.12);
          border: 1px solid rgba(138, 107, 46, 0.25);
          padding: 4px 12px;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* Session row */
        .session-row {
          padding: 20px 0;
          border-bottom: 1px solid #E8E2D4;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .session-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .session-row:first-child {
          padding-top: 0;
        }

        .session-current-chip {
          font-family: var(--font-body), "Inter", sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #6E5420;
          background: rgba(138, 107, 46, 0.12);
          border: 1px solid rgba(138, 107, 46, 0.25);
          padding: 2px 8px;
          border-radius: 6px;
        }

        /* Notification Channels List */
        .notif-channels-list {
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        .channel-row {
          padding: 20px 0;
          border-bottom: 1px solid #E8E2D4;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .channel-row:first-child {
          padding-top: 0;
        }

        .channel-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .channel-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #F3EFE6;
          border: 1px solid #E8E2D4;
          color: #8A6B2E;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .channel-title {
          font-family: var(--font-body), "Inter", sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #2B2D2A;
          display: block;
          margin-bottom: 4px;
        }

        .channel-desc {
          font-family: var(--font-body), "Inter", sans-serif;
          font-size: 13px;
          color: #5A584F;
          margin: 0;
          line-height: 1.5;
        }

        .notif-toggle-btn {
          width: 44px;
          height: 26px;
          border-radius: 13px;
          position: relative;
          border: none;
          cursor: pointer;
          padding: 2px;
          transition: background-color 0.2s ease;
          flex-shrink: 0;
          outline: none;
        }

        .notif-toggle-btn:focus-visible {
          outline: 2px solid #8A6B2E !important;
          outline-offset: 2px !important;
        }

        .notif-toggle-knob {
          display: block;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background-color: #FFFFFF;
          box-shadow: 0 1px 3px rgba(43, 45, 42, 0.25);
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Security Tab 2-Column Grid Layout */
        .security-tab-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 28px;
          align-items: start;
          width: 100%;
        }

        /* Mobile Sticky Bottom Bar */
        .mobile-sticky-action-bar {
          display: none;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .settings-layout-container {
            flex-direction: column;
            gap: 24px;
          }

          .settings-menu-nav {
            flex: none;
            width: 100%;
            position: static;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            padding: 6px;
            border-radius: 14px;
          }

          .settings-menu-nav::-webkit-scrollbar {
            display: none;
          }

          .settings-menu-track {
            flex-direction: row;
            gap: 8px;
            width: max-content;
          }

          .settings-menu-item {
            width: auto;
            white-space: nowrap;
            border-left: none;
            border-bottom: 2px solid transparent;
            padding: 10px 14px;
          }

          .settings-menu-item.active {
            border-left: none;
            border-bottom: 2px solid #8A6B2E;
          }

          .security-tab-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }

        @media (max-width: 768px) {
          .settings-card-header {
            padding: 24px 20px 16px 20px;
          }

          .settings-card-title {
            font-size: 24px;
          }

          .settings-card-body {
            padding: 24px 20px;
          }

          .settings-card-footer,
          .settings-save-bar {
            display: flex !important;
            padding: 24px 20px !important;
          }

          .footer-actions {
            flex-direction: column-reverse !important;
            width: 100% !important;
            gap: 12px !important;
          }

          .btn-ghost-cancel,
          .btn-primary-gold {
            width: 100% !important;
            justify-content: center !important;
          }

          .settings-form-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .span-full {
            grid-column: 1;
          }

          .channel-row {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
