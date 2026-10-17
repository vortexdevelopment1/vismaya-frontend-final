"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  User,
  Shield,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  MessageSquare,
  Sparkles,
  Info,
  Key,
  ShieldCheck,
  Mail,
  MapPin,
  Laptop,
  Check,
  X,
  Radio,
  Globe,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import Modal from "@/components/shared/Modal";
import ProgressBar from "@/components/shared/ProgressBar";
import PasswordInput from "@/components/PasswordInput";
import { useTalent } from "@/lib/talent/TalentContext";
import { authService } from "@/lib/api/services/authService";
import { isRealMode } from "@/lib/api/config";


export default function TalentSettingsPage() {
  const { profile, updateProfile, addToast, updateProfilePhoto, removeProfilePhoto } = useTalent();

  const [activeTab, setActiveTab] = useState("account");
  const tabNavRef = useRef(null);
  const settingsPhotoInputRef = useRef(null);

  // Tab 1: Account Profile State
  const [accountName, setAccountName] = useState(profile.personal.fullName || "");
  const [accountEmail, setAccountEmail] = useState(profile.personal.email || "");
  const [accountPhone, setAccountPhone] = useState(profile.personal.phone || "");
  const [accountCity, setAccountCity] = useState(profile.personal.city || "");

  // Tab 2: Password & Security State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sessions, setSessions] = useState([
    {
      id: "sess-1",
      device: "Chrome on Windows 11",
      location: "Mumbai, Maharashtra",
      ip: "103.21.244.12",
      current: true,
      lastActive: "Active now",
    },
    {
      id: "sess-2",
      device: "Safari on iPhone 15 Pro",
      location: "Mumbai, Maharashtra",
      ip: "103.21.244.98",
      current: false,
      lastActive: "2 hours ago",
    },
  ]);

  // Tab 3: Notification Channels State
  const [notifInApp, setNotifInApp] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(true);
  const [notifWhatsApp, setNotifWhatsApp] = useState(true);
  const [notifAnnouncements, setNotifAnnouncements] = useState(true);

  // Tab 4: Privacy & Data State
  const [profileSearchable, setProfileSearchable] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Auto-scroll mobile tabs when activeTab changes
  useEffect(() => {
    if (!tabNavRef.current) return;
    const activeBtn = tabNavRef.current.querySelector(".settings-tab-active");
    if (activeBtn) {
      const container = tabNavRef.current;
      const scrollLeft =
        activeBtn.offsetLeft - container.offsetWidth / 2 + activeBtn.offsetWidth / 2;
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: "smooth" });
    }
  }, [activeTab]);

  // Sync state if profile changes
  useEffect(() => {
    if (profile?.personal) {
      setAccountName(profile.personal.fullName || "");
      setAccountEmail(profile.personal.email || "");
      setAccountPhone(profile.personal.phone || "");
      setAccountCity(profile.personal.city || "");
    }
  }, [profile]);

  // Password Requirements & Strength
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);

  const calculatePasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 8) score += 34;
    if (/[0-9]/.test(pass)) score += 33;
    if (/[^A-Za-z0-9]/.test(pass)) score += 33;
    return Math.min(100, score);
  };

  const passwordStrength = calculatePasswordStrength(newPassword);

  const getStrengthLabel = (score) => {
    if (score === 0) return "Empty";
    if (score <= 34) return "Weak";
    if (score <= 67) return "Moderate";
    return "Strong";
  };

  const getStrengthColor = (score) => {
    if (score <= 34) return "var(--danger)";
    if (score <= 67) return "var(--warning)";
    return "var(--success)";
  };

  // Handlers
  const handleSaveAccount = (e) => {
    if (e) e.preventDefault();
    updateProfile({
      personal: {
        ...profile.personal,
        fullName: accountName,
        email: accountEmail,
        phone: accountPhone,
        city: accountCity,
      },
    });
    addToast({
      type: "success",
      title: "Account Profile Saved",
      message: "Your primary account contact and identification details have been updated.",
    });
  };

  const handleCancelAccount = () => {
    setAccountName(profile.personal.fullName || "");
    setAccountEmail(profile.personal.email || "");
    setAccountPhone(profile.personal.phone || "");
    setAccountCity(profile.personal.city || "");
    addToast({
      type: "info",
      title: "Changes Reverted",
      message: "Form fields reset to original profile data.",
    });
  };

  const handleUpdatePassword = async (e) => {
    if (e) e.preventDefault();
    if (!currentPassword) {
      addToast({
        type: "danger",
        title: "Current Password Required",
        message: "Please enter your current account password to authorize the change.",
      });
      return;
    }
    if (!hasMinLength || !hasNumber || !hasSymbol) {
      addToast({
        type: "danger",
        title: "Password Requirements Not Met",
        message: "New password must have at least 8 characters, a number, and a symbol.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast({
        type: "danger",
        title: "Passwords Do Not Match",
        message: "New password and confirmation password must match.",
      });
      return;
    }

    if (isRealMode("auth")) {
      try {
        const res = await authService.changePassword({ currentPassword, newPassword });
        if (!res.success) {
          addToast({
            type: "danger",
            title: "Password Update Failed",
            message: res.message || "Could not update password. Please check your current password.",
          });
          return;
        }
      } catch (err) {
        addToast({
          type: "danger",
          title: "Password Update Failed",
          message: err.message || "An error occurred while updating password.",
        });
        return;
      }
    }

    addToast({
      type: "success",
      title: "Password Updated",
      message: "Your authentication credentials have been securely updated.",
    });

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };


  const handleCancelPassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSignOutSession = (sessionId) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    addToast({
      type: "info",
      title: "Session Terminated",
      message: "The selected device session has been signed out.",
    });
  };

  const handleSaveNotifications = () => {
    addToast({
      type: "success",
      title: "Notification Preferences Saved",
      message: "Channel delivery settings have been updated across all alert pathways.",
    });
  };

  const handleTogglePrivacy = (checked) => {
    setProfileSearchable(checked);
    addToast({
      type: "success",
      title: checked ? "Public Profile Enabled" : "Private Profile Mode",
      message: checked
        ? "Your verified profile is discoverable by casting directors on Vismaya."
        : "Your profile is hidden from general casting directories.",
    });
  };

  const menuTabs = [
    { key: "account", label: "Account profile", icon: User },
    { key: "security", label: "Password & security", icon: Lock },
    { key: "notifications", label: "Notification channels", icon: Bell },
    { key: "privacy", label: "Privacy & data", icon: Shield },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "1280px",
        margin: "0 auto",
      }}
    >
      {/* Breadcrumb, Title & Subtitle */}
      <PageHeader
        title="Settings &amp; Preferences"
        subtitle="Manage your authentication credentials, multi-channel notification alerts, and artist privacy options."
        breadcrumbs={[
          { label: "Talent Dashboard", href: "/talent/dashboard" },
          { label: "Settings" },
        ]}
        style={{ marginBottom: "24px" }}
      />

      {/* Main Settings Layout Container */}
      <div className="settings-page-layout">
        {/* Left Settings Menu (Sticky on Desktop, Scrollable Tab Bar below 1024px) */}
        <aside className="settings-sidebar-nav" ref={tabNavRef}>
          <div className="settings-nav-list">
            {menuTabs.map((item) => {
              const isActive = activeTab === item.key;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveTab(item.key)}
                  className={`settings-nav-btn ${isActive ? "settings-tab-active" : ""}`}
                >
                  <Icon size={20} className="settings-nav-icon" />
                  <span className="settings-nav-label">{item.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="settings-content-area">
          {/* TAB 1: Account Profile */}
          {activeTab === "account" && (
            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2 className="settings-card-title">Account identification</h2>
                  <p className="settings-card-description">
                    Primary account identification, verified email, and callback contact details.
                  </p>
                </div>
              </div>
              <div className="settings-card-divider" />

              <div className="settings-card-body">
                <form id="account-settings-form" onSubmit={handleSaveAccount}>
                  {/* Top Row: Headshot + Info + Change Photo Button */}
                  <div className="settings-avatar-row">
                    <input
                      ref={settingsPhotoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/jpg"
                      style={{ display: "none" }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            await updateProfilePhoto(file);
                          } catch (err) {
                            addToast({
                              type: "danger",
                              title: "Photo Update Failed",
                              message: err.message || "Could not upload image.",
                            });
                          }
                          e.target.value = "";
                        }
                      }}
                    />
                    <div
                      className="settings-headshot-circle"
                      style={{
                        backgroundImage: profile.avatar ? `url(${profile.avatar})` : undefined,
                        backgroundColor: "#F3EFE6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#8A6B2E",
                        fontWeight: "700",
                        fontSize: "18px",
                      }}
                    >
                      {!profile.avatar && (profile.personal?.fullName ? profile.personal.fullName.slice(0, 2).toUpperCase() : "TR")}
                    </div>
                    <div className="settings-avatar-info">
                      <span className="settings-avatar-title">Profile display photo</span>
                      <span className="settings-avatar-subtitle">
                        Used across casting shortlist summaries
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => settingsPhotoInputRef.current?.click()}
                        className="btn-secondary settings-photo-btn"
                      >
                        {profile.avatar ? "Change photo" : "Upload photo"}
                      </button>
                      {profile.avatar && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm("Remove profile photo?")) {
                              await removeProfilePhoto();
                            }
                          }}
                          className="btn-secondary settings-photo-btn"
                          style={{ color: "#B42318", borderColor: "#FECDCA" }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2-Column Grid Fields */}
                  <div className="talent-form-grid" style={{ marginTop: "24px" }}>
                    <div>
                      <label className="settings-field-label">Full name</label>
                      <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="e.g. Riya Sharma"
                        required
                        className="settings-input"
                      />
                      <span className="settings-helper-text">Official name used on verified casting call sheets</span>
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <label className="settings-field-label" style={{ margin: 0 }}>Primary email</label>
                        <span className="settings-verified-badge">
                          <CheckCircle2 size={12} />
                          <span>Verified</span>
                        </span>
                      </div>
                      <input
                        type="email"
                        value={accountEmail}
                        onChange={(e) => setAccountEmail(e.target.value)}
                        placeholder="e.g. artist@vismaya.io"
                        required
                        className="settings-input"
                      />
                      <span className="settings-helper-text">Used for sign-in and formal contract communication</span>
                    </div>

                    <div>
                      <label className="settings-field-label">
                        Phone number for WhatsApp / SMS callbacks
                      </label>
                      <input
                        type="tel"
                        value={accountPhone}
                        onChange={(e) => setAccountPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        required
                        className="settings-input"
                      />
                      <span className="settings-helper-text">Emergency channel for rapid audition timing notifications</span>
                    </div>

                    <div>
                      <label className="settings-field-label">City</label>
                      <input
                        type="text"
                        value={accountCity}
                        onChange={(e) => setAccountCity(e.target.value)}
                        placeholder="e.g. Mumbai, Maharashtra"
                        className="settings-input"
                      />
                      <span className="settings-helper-text">Primary domestic base for audition scheduling</span>
                    </div>
                  </div>

                  {/* Desktop Card Footer Row */}
                  <div className="settings-card-footer">
                    <button
                      type="button"
                      onClick={handleCancelAccount}
                      className="btn-secondary settings-footer-btn"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary settings-footer-btn"
                    >
                      <Save size={16} />
                      <span>Save changes</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: Password & Security */}
          {activeTab === "security" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Card 1: Change Password */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <h2 className="settings-card-title">Change password</h2>
                    <p className="settings-card-description">
                      Ensure your account is protected with a strong multi-character credential.
                    </p>
                  </div>
                </div>
                <div className="settings-card-divider" />

                <div className="settings-card-body">
                  <form id="password-settings-form" onSubmit={handleUpdatePassword}>
                    <div className="talent-form-grid">
                      <div className="talent-form-grid-full">
                        <label className="settings-field-label">Current password</label>
                        <PasswordInput
                          placeholder="Enter current password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="settings-input"
                          required
                        />
                        <span className="settings-helper-text">Required to confirm authorization</span>
                      </div>

                      <div>
                        <label className="settings-field-label">New password</label>
                        <PasswordInput
                          placeholder="Minimum 8 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="settings-input"
                          required
                        />
                        {/* Password Strength Meter */}
                        {newPassword && (
                          <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                              <span style={{ color: "var(--text-muted)" }}>Strength:</span>
                              <span style={{ color: getStrengthColor(passwordStrength), fontWeight: "700" }}>
                                {getStrengthLabel(passwordStrength)}
                              </span>
                            </div>
                            <ProgressBar
                              value={passwordStrength}
                              height="6px"
                              showPercentage={false}
                              color={getStrengthColor(passwordStrength)}
                              gradient={getStrengthColor(passwordStrength)}
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="settings-field-label">Confirm new password</label>
                        <PasswordInput
                          placeholder="Re-type new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="settings-input"
                          required
                        />
                        <span className="settings-helper-text">Must match the new password exactly</span>
                      </div>

                      {/* Requirements Checklist */}
                      <div className="talent-form-grid-full">
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", display: "block", marginBottom: "8px" }}>
                          Password requirements:
                        </span>
                        <div className="settings-checklist-grid">
                          <div className={`settings-check-item ${hasMinLength ? "check-pass" : ""}`}>
                            {hasMinLength ? <Check size={14} /> : <div className="settings-check-dot" />}
                            <span>8+ characters</span>
                          </div>
                          <div className={`settings-check-item ${hasNumber ? "check-pass" : ""}`}>
                            {hasNumber ? <Check size={14} /> : <div className="settings-check-dot" />}
                            <span>Contains a number</span>
                          </div>
                          <div className={`settings-check-item ${hasSymbol ? "check-pass" : ""}`}>
                            {hasSymbol ? <Check size={14} /> : <div className="settings-check-dot" />}
                            <span>Contains a special symbol</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="settings-card-footer">
                      <button
                        type="button"
                        onClick={handleCancelPassword}
                        className="btn-secondary settings-footer-btn"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary settings-footer-btn"
                      >
                        <Key size={16} />
                        <span>Update password</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Card 2: Active Sessions */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <h2 className="settings-card-title">Active sessions</h2>
                    <p className="settings-card-description">
                      Devices currently signed into your Vismaya Talent artist account.
                    </p>
                  </div>
                </div>
                <div className="settings-card-divider" />

                <div className="settings-card-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {sessions.map((sess) => (
                    <div key={sess.id} className="settings-session-row">
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
                        <div className="settings-session-icon">
                          <Laptop size={20} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)" }}>
                              {sess.device}
                            </span>
                            {sess.current && (
                              <span className="settings-current-badge">
                                Current session
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {sess.location} &bull; IP {sess.ip} &bull; {sess.lastActive}
                          </span>
                        </div>
                      </div>

                      {!sess.current && (
                        <button
                          type="button"
                          onClick={() => handleSignOutSession(sess.id)}
                          className="btn-secondary settings-signout-btn"
                        >
                          Sign out
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Notification Channels */}
          {activeTab === "notifications" && (
            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2 className="settings-card-title">Notification channels</h2>
                  <p className="settings-card-description">
                    Configure alert dispatch channels. SMS and WhatsApp are reserved strictly for time-sensitive audition callbacks.
                  </p>
                </div>
              </div>
              <div className="settings-card-divider" />

              <div className="settings-card-body">
                <div className="settings-channels-grid">
                  {/* Channel 1: In-App */}
                  <div className="settings-channel-card">
                    <div className="settings-channel-left">
                      <div className="settings-channel-icon">
                        <Bell size={20} />
                      </div>
                      <div className="settings-channel-text">
                        <span className="settings-channel-title">In-app notifications</span>
                        <span className="settings-channel-desc">
                          Real-time alerts delivered in the top bar and notification center
                        </span>
                      </div>
                    </div>
                    <label className="settings-toggle-switch">
                      <input
                        type="checkbox"
                        checked={notifInApp}
                        onChange={(e) => {
                          setNotifInApp(e.target.checked);
                          handleSaveNotifications();
                        }}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  {/* Channel 2: Email */}
                  <div className="settings-channel-card">
                    <div className="settings-channel-left">
                      <div className="settings-channel-icon">
                        <Mail size={20} />
                      </div>
                      <div className="settings-channel-text">
                        <span className="settings-channel-title">Email digests &amp; updates</span>
                        <span className="settings-channel-desc">
                          Formal casting confirmations, application logs, and project briefs
                        </span>
                      </div>
                    </div>
                    <label className="settings-toggle-switch">
                      <input
                        type="checkbox"
                        checked={notifEmail}
                        onChange={(e) => {
                          setNotifEmail(e.target.checked);
                          handleSaveNotifications();
                        }}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  {/* Channel 3: SMS */}
                  <div className="settings-channel-card">
                    <div className="settings-channel-left">
                      <div className="settings-channel-icon">
                        <Smartphone size={20} />
                      </div>
                      <div className="settings-channel-text">
                        <span className="settings-channel-title">SMS emergency alerts</span>
                        <span className="settings-channel-desc">
                          Used only for urgent updates such as audition timing changes or studio callback sides
                        </span>
                      </div>
                    </div>
                    <label className="settings-toggle-switch">
                      <input
                        type="checkbox"
                        checked={notifSms}
                        onChange={(e) => {
                          setNotifSms(e.target.checked);
                          handleSaveNotifications();
                        }}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  {/* Channel 4: WhatsApp */}
                  <div className="settings-channel-card">
                    <div className="settings-channel-left">
                      <div className="settings-channel-icon" style={{ color: "var(--success)" }}>
                        <MessageSquare size={20} />
                      </div>
                      <div className="settings-channel-text">
                        <span className="settings-channel-title">WhatsApp audition notifications</span>
                        <span className="settings-channel-desc">
                          Used only for urgent updates such as audition timing changes or direct script sides
                        </span>
                      </div>
                    </div>
                    <label className="settings-toggle-switch">
                      <input
                        type="checkbox"
                        checked={notifWhatsApp}
                        onChange={(e) => {
                          setNotifWhatsApp(e.target.checked);
                          handleSaveNotifications();
                        }}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>

                  {/* Channel 5: Announcements */}
                  <div className="settings-channel-card" style={{ gridColumn: "1 / -1" }}>
                    <div className="settings-channel-left">
                      <div className="settings-channel-icon">
                        <Sparkles size={20} />
                      </div>
                      <div className="settings-channel-text">
                        <span className="settings-channel-title">Vismaya announcements</span>
                        <span className="settings-channel-desc">
                          Curated platform highlights, spotlight opportunities, and new agency feature briefings
                        </span>
                      </div>
                    </div>
                    <label className="settings-toggle-switch">
                      <input
                        type="checkbox"
                        checked={notifAnnouncements}
                        onChange={(e) => {
                          setNotifAnnouncements(e.target.checked);
                          handleSaveNotifications();
                        }}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Privacy & Data */}
          {activeTab === "privacy" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Privacy Policy Info Card */}
              <div className="settings-info-card">
                <ShieldCheck size={28} className="settings-info-icon" />
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <h3 className="settings-info-title">Verified privacy protocol</h3>
                  <p className="settings-info-text">
                    Your contact details stay hidden and all communication is handled through Vismaya. Recruiters and production houses only receive verified callback access once an audition or shortlist is confirmed.
                  </p>
                </div>
              </div>

              {/* Profile Visibility Card */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <h2 className="settings-card-title">Profile discovery &amp; visibility</h2>
                    <p className="settings-card-description">
                      Control whether casting directors can discover your public comp card in role searches.
                    </p>
                  </div>
                </div>
                <div className="settings-card-divider" />

                <div className="settings-card-body">
                  <div className="settings-channel-card" style={{ border: "none", padding: "8px 0" }}>
                    <div className="settings-channel-left">
                      <div className="settings-channel-icon">
                        <Globe size={20} />
                      </div>
                      <div className="settings-channel-text">
                        <span className="settings-channel-title">Casting directory visibility</span>
                        <span className="settings-channel-desc">
                          Allow verified producers to shortlist your profile for unlisted character briefs
                        </span>
                      </div>
                    </div>
                    <label className="settings-toggle-switch">
                      <input
                        type="checkbox"
                        checked={profileSearchable}
                        onChange={(e) => handleTogglePrivacy(e.target.checked)}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Danger Zone Card */}
              <div className="settings-danger-card">
                <div className="settings-card-header">
                  <div>
                    <h2 className="settings-danger-title">Danger zone</h2>
                    <p className="settings-card-description">
                      Permanently erase your artist profile, portfolio media, and audition submission history.
                    </p>
                  </div>
                </div>
                <div className="settings-card-divider" style={{ borderColor: "rgba(255, 107, 107, 0.2)" }} />

                <div className="settings-card-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                  <div>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--danger)", display: "block" }}>
                      Request account deletion
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      Once submitted, your account will enter a 14-day compliance grace period before permanent purge.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="btn-danger settings-danger-btn"
                  >
                    <Trash2 size={16} />
                    <span>Request account deletion</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Sticky Bottom Action Bar (Only on tabs with editable forms) */}
      {(activeTab === "account" || activeTab === "security") && (
        <div className="talent-sticky-action-bar">
          <button
            type="button"
            onClick={activeTab === "account" ? handleCancelAccount : handleCancelPassword}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={
              activeTab === "account"
                ? () => handleSaveAccount()
                : () => handleUpdatePassword()
            }
            className="btn-primary"
          >
            <Save size={16} />
            <span>Save changes</span>
          </button>
        </div>
      )}

      {/* Account Deletion Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Request Account Deletion"
        subtitle="This action is permanent and cannot be reversed."
        maxWidth="480px"
        footer={
          <div style={{ display: "flex", gap: "10px", width: "100%", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="btn-secondary"
              style={{ padding: "10px 18px" }}
            >
              Keep account
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDeleteModal(false);
                addToast({
                  type: "info",
                  title: "Deletion Request Submitted",
                  message: "Your account deletion request was registered with Vismaya Compliance.",
                });
              }}
              style={{
                padding: "10px 20px",
                borderRadius: "12px",
                backgroundColor: "var(--danger)",
                color: "#ffffff",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Trash2 size={15} />
              <span>Confirm deletion</span>
            </button>
          </div>
        }
      >
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
          Are you sure you want to request deletion of your Vismaya artist account? All verified badges, portfolio showreels, self-tapes, casting submission records, and callback histories will be permanently removed.
        </p>
      </Modal>

      <style jsx global>{`
        /* 2-Column Settings Page Layout */
        .settings-page-layout {
          display: flex;
          gap: 32px;
          align-items: flex-start;
          width: 100%;
        }

        .settings-sidebar-nav {
          width: 240px;
          position: sticky;
          top: 96px;
          flex-shrink: 0;
          z-index: 10;
        }

        .settings-nav-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
        }

        .settings-nav-btn {
          height: 40px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 16px;
          background: transparent;
          border: 1px solid transparent;
          border-left: 3px solid transparent;
          color: var(--text-secondary);
          font-family: var(--font-body), "Inter", sans-serif;
          font-size: 14px;
          font-weight: 600;
          text-transform: none;
          letter-spacing: 0;
          cursor: pointer;
          transition: all 0.18s ease;
          width: 100%;
          text-align: left;
          white-space: nowrap;
        }

        .settings-nav-btn:hover:not(.settings-tab-active) {
          background-color: var(--bg-alt);
          color: var(--text-primary);
        }

        .settings-tab-active {
          background-color: var(--bg-alt) !important;
          color: var(--gold) !important;
          border-left: 3px solid var(--gold) !important;
        }

        .settings-nav-icon {
          color: inherit;
          flex-shrink: 0;
        }

        .settings-content-area {
          flex: 1;
          min-width: 0;
          width: 100%;
        }

        /* Card container for every tab */
        .settings-card {
          background: #FFFFFF;
          border: 1px solid #E8E2D4;
          border-radius: 18px;
          box-shadow: 0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06);
          overflow: hidden;
          width: 100%;
        }

        .settings-card-header {
          padding: 24px;
          display: flex;
          align-items: flex-start;
          justifyContent: space-between;
          gap: 16px;
        }

        .settings-card-title {
          font-family: var(--font-heading), 'Playfair Display', Georgia, serif;
          font-size: 20px;
          fontWeight: 600;
          color: #2B2D2A;
          margin: 0 0 4px 0;
          line-height: 1.3;
        }

        .settings-card-description {
          font-size: 13px;
          color: #5A584F;
          margin: 0;
          line-height: 1.45;
          font-family: var(--font-body), 'Inter', sans-serif;
        }

        .settings-card-divider {
          height: 1px;
          background-color: #E8E2D4;
          width: 100%;
        }

        .settings-card-body {
          padding: 24px;
        }

        .settings-card-footer {
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justifyContent: flex-end;
          gap: 12px;
        }

        .settings-footer-btn {
          min-height: 38px;
          padding: 0 20px;
          font-size: 13px;
          font-weight: 600;
          text-transform: none;
          letter-spacing: 0;
          border-radius: 4px;
        }

        /* Avatar Top Row */
        .settings-avatar-row {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 16px;
          background-color: var(--bg-alt);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          flex-wrap: wrap;
        }

        .settings-headshot-circle {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background-size: cover;
          background-position: center;
          border: 2px solid var(--gold);
          box-shadow: var(--shadow-sm);
          flex-shrink: 0;
          background-color: var(--bg-surface);
        }

        .settings-avatar-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 1;
          min-width: 180px;
        }

        .settings-avatar-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .settings-avatar-subtitle {
          font-size: 13px;
          color: var(--text-muted);
        }

        .settings-photo-btn {
          min-height: 36px;
          padding: 0 16px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 4px;
          text-transform: none;
          letter-spacing: 0;
        }

        /* Form Labels and Inputs */
        .settings-field-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .settings-input {
          width: 100%;
          height: 38px;
          min-height: 38px;
          padding: 0 14px;
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .settings-input:focus {
          border-color: var(--gold);
          box-shadow: 0 0 0 2px rgba(155, 122, 63, 0.2);
        }

        .settings-helper-text {
          display: block;
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 6px;
        }

        .settings-verified-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 4px;
          background-color: #EFF2EC;
          border: 1px solid #D1DCC8;
          color: var(--text-primary);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .settings-eye-toggle {
          position: absolute;
          right: 12px;
          color: var(--text-muted);
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .settings-checklist-grid {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 4px;
        }

        .settings-check-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-muted);
          transition: color 0.2s ease;
        }

        .settings-check-item.check-pass {
          color: var(--gold);
          font-weight: 600;
        }

        .settings-check-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--border-color);
        }

        /* Active Sessions */
        .settings-session-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 6px;
          background-color: var(--bg-alt);
          border: 1px solid var(--border-color);
          flex-wrap: wrap;
        }

        .settings-session-icon {
          width: 38px;
          height: 38px;
          border-radius: 4px;
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          color: var(--gold);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .settings-current-badge {
          display: inline-flex;
          padding: 2px 8px;
          border-radius: 4px;
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          color: var(--gold);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .settings-signout-btn {
          min-height: 34px;
          padding: 0 14px;
          font-size: 12px;
          border-radius: 4px;
        }

        /* Notification Channels Grid */
        .settings-channels-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          width: 100%;
        }

        .settings-channel-card {
          background-color: var(--bg-alt);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .settings-channel-left {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          min-width: 0;
          flex: 1;
        }

        .settings-channel-icon {
          width: 38px;
          height: 38px;
          border-radius: 4px;
          background-color: var(--bg-surface);
          border: 1px solid var(--border-color);
          color: var(--gold);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .settings-channel-text {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .settings-channel-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .settings-channel-desc {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.45;
        }

        /* Sleek Toggle Switch */
        .settings-toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          flex-shrink: 0;
          cursor: pointer;
        }

        .settings-toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .settings-toggle-slider {
          position: absolute;
          inset: 0;
          background-color: var(--border-color);
          border-radius: 999px;
          transition: background-color 0.2s ease;
          border: 1px solid var(--border-color);
        }

        .settings-toggle-slider::before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 2px;
          bottom: 2px;
          background-color: #FFFFFF;
          border-radius: 50%;
          transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .settings-toggle-switch input:checked + .settings-toggle-slider {
          background-color: var(--gold);
          border-color: var(--gold);
        }

        .settings-toggle-switch input:checked + .settings-toggle-slider::before {
          transform: translateX(20px);
          background-color: #FFFFFF;
        }

        /* Privacy Info Card */
        .settings-info-card {
          background: var(--bg-alt);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 22px 24px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .settings-info-icon {
          color: var(--gold);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .settings-info-title {
          font-family: Georgia, serif;
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .settings-info-text {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.55;
          margin: 0;
        }

        /* Danger Zone Card */
        .settings-danger-card {
          background: #FAF0F0;
          border: 1px solid #F5C6C6;
          border-radius: 6px;
          box-shadow: var(--shadow-card);
          overflow: hidden;
          width: 100%;
        }

        .settings-danger-title {
          font-family: Georgia, serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--danger);
          margin: 0 0 4px 0;
        }

        .settings-danger-btn {
          min-height: 38px;
          padding: 0 20px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 4px;
          text-transform: none;
          letter-spacing: 0;
        }

        /* =========================================================================
           RESPONSIVE BREAKPOINTS BELOW 1024px and 768px
           ========================================================================= */
        @media (max-width: 1023.98px) {
          .settings-page-layout {
            flex-direction: column;
            gap: 20px;
          }

          .settings-sidebar-nav {
            width: 100%;
            position: static;
            top: auto;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
            padding-bottom: 4px;
          }

          .settings-sidebar-nav::-webkit-scrollbar {
            display: none;
          }

          .settings-nav-list {
            flex-direction: row;
            gap: 8px;
            width: max-content;
          }

          .settings-nav-btn {
            scroll-snap-align: start;
            flex-shrink: 0;
            width: auto;
            border-left: 1px solid transparent;
            border-radius: 4px;
            padding: 0 18px;
            background-color: var(--bg-alt);
            border: 1px solid var(--border-color);
          }

          .settings-tab-active {
            border-left: 1px solid var(--gold) !important;
            border-color: var(--gold) !important;
            background: var(--bg-alt) !important;
          }

          .settings-channels-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }

        @media (max-width: 767.98px) {
          .settings-card-header {
            padding: 16px;
          }
          .settings-card-body {
            padding: 16px;
          }
          .settings-card-footer {
            display: none; /* Controlled by mobile sticky bar */
          }
        }
      `}</style>
    </div>
  );
}
