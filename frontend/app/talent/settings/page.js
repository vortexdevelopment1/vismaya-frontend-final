"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  User,
  Shield,
  Bell,
  Lock,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Key,
  ShieldCheck,
  Mail,
  Smartphone,
  Check,
  X,
  Info,
  RefreshCw,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import Modal from "@/components/shared/Modal";
import ProgressBar from "@/components/shared/ProgressBar";
import PasswordInput from "@/components/PasswordInput";
import { useTalent } from "@/lib/talent/TalentContext";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/lib/api/services/authService";
import { talentService } from "@/lib/api/services/talentService";
import { isRealMode } from "@/lib/api/config";

export default function TalentSettingsPage() {
  const auth = useAuth();
  const { profile, updateProfile, addToast, updateProfilePhoto, removeProfilePhoto } = useTalent();

  const [activeTab, setActiveTab] = useState("account");
  const tabNavRef = useRef(null);
  const settingsPhotoInputRef = useRef(null);

  // Tab 1: Account Profile Canonical Fields
  const initialName = useMemo(() => profile?.personal?.fullName || profile?.name || auth?.user?.name || "", [profile, auth?.user]);
  const initialEmail = useMemo(() => profile?.personal?.email || profile?.email || auth?.user?.email || "", [profile, auth?.user]);
  const initialPhone = useMemo(() => profile?.personal?.phone || profile?.phone || profile?.personal?.mobile || profile?.mobile || auth?.user?.mobile || auth?.user?.phone || "", [profile, auth?.user]);
  const initialCity = useMemo(() => profile?.personal?.city || profile?.city || profile?.currentCity || "", [profile]);
  const initialState = useMemo(() => profile?.personal?.state || profile?.state || profile?.currentState || "", [profile]);
  const isEmailVerified = Boolean(profile?.isEmailVerified !== undefined ? profile.isEmailVerified : (auth?.user?.isEmailVerified ?? false));
  const primaryProfession = profile?.primaryProfession || profile?.personal?.primaryRole || profile?.profession || "Actor / Screen Artist";

  const [accountName, setAccountName] = useState(initialName);
  const [accountEmail, setAccountEmail] = useState(initialEmail);
  const [accountPhone, setAccountPhone] = useState(initialPhone);
  const [accountCity, setAccountCity] = useState(initialCity);
  const [accountState, setAccountState] = useState(initialState);
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // Email Change Modal State (Spec §38: Email change allowed with re-verification)
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState("");
  const [emailPasswordInput, setEmailPasswordInput] = useState("");
  const [emailOtpInput, setEmailOtpInput] = useState("");
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);

  // Tab 2: Password & Security State (Spec §38: Current password OR OTP)
  const [passwordMode, setPasswordMode] = useState("current"); // "current" | "otp"
  const [currentPassword, setCurrentPassword] = useState("");
  const [passwordOtp, setPasswordOtp] = useState("");
  const [isPasswordOtpSent, setIsPasswordOtpSent] = useState(false);
  const [isSendingPasswordOtp, setIsSendingPasswordOtp] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // 2FA State (Spec §6 & §38: 2FA is optional)
  const is2FAEnabled = Boolean(profile?.twoFactorEnabled !== undefined ? profile.twoFactorEnabled : (auth?.user?.twoFactorEnabled ?? false));
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFAAction, setTwoFAAction] = useState("enable"); // "enable" | "disable"
  const [twoFAOtpInput, setTwoFAOtpInput] = useState("");
  const [twoFAPasswordInput, setTwoFAPasswordInput] = useState("");
  const [is2FASubmitting, setIs2FASubmitting] = useState(false);

  // Tab 3: Notification Channels State (Spec §38: Email toggle only)
  const [notifEmail, setNotifEmail] = useState(() => {
    return profile?.emailNotificationsEnabled !== undefined
      ? Boolean(profile.emailNotificationsEnabled)
      : (auth?.user?.emailNotificationsEnabled !== undefined ? Boolean(auth.user.emailNotificationsEnabled) : true);
  });
  const [isUpdatingNotif, setIsUpdatingNotif] = useState(false);

  // Tab 4: Account & Privacy (Spec §38: Delete profile request with OTP + confirmation)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOtpInput, setDeleteOtpInput] = useState("");
  const [isDeleteOtpSent, setIsDeleteOtpSent] = useState(false);
  const [isSendingDeleteOtp, setIsSendingDeleteOtp] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

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

  // Sync state if profile or auth user changes
  useEffect(() => {
    const name = profile?.personal?.fullName || profile?.name || auth?.user?.name || "";
    const email = profile?.personal?.email || profile?.email || auth?.user?.email || "";
    const phone = profile?.personal?.phone || profile?.phone || profile?.personal?.mobile || profile?.mobile || auth?.user?.mobile || auth?.user?.phone || "";
    const city = profile?.personal?.city || profile?.city || profile?.currentCity || "";
    const state = profile?.personal?.state || profile?.state || profile?.currentState || "";

    setAccountName(name);
    setAccountEmail(email);
    setAccountPhone(phone);
    setAccountCity(city);
    setAccountState(state);
    setNotifEmail(
      profile?.emailNotificationsEnabled !== undefined
        ? Boolean(profile.emailNotificationsEnabled)
        : (auth?.user?.emailNotificationsEnabled !== undefined ? Boolean(auth.user.emailNotificationsEnabled) : true)
    );
  }, [profile, auth?.user]);

  // Check pristine state for Tab 1
  const hasAccountChanges = (accountName.trim() !== initialName.trim()) || (accountCity.trim() !== initialCity.trim()) || (accountState.trim() !== initialState.trim());

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

  // Handlers: Tab 1 Account Profile
  const handleSaveAccount = async (e) => {
    if (e) e.preventDefault();
    if (!hasAccountChanges || isSavingAccount) return;

    setIsSavingAccount(true);
    try {
      if (isRealMode("talent")) {
        const res = await talentService.updateSettings({
          fullName: accountName.trim(),
          name: accountName.trim(),
          city: accountCity.trim(),
          currentCity: accountCity.trim(),
          state: accountState.trim(),
          currentState: accountState.trim(),
        });

        if (res?.success) {
          if (auth?.updateUser) {
            auth.updateUser({ name: accountName.trim() });
          }
          await updateProfile({
            city: accountCity.trim(),
            currentCity: accountCity.trim(),
            state: accountState.trim(),
            currentState: accountState.trim(),
            personal: {
              ...profile.personal,
              fullName: accountName.trim(),
              city: accountCity.trim(),
              state: accountState.trim(),
            },
          });
          addToast({
            type: "success",
            title: "Account Profile Saved",
            message: "Your profile identification and base city/state have been updated.",
          });
        } else {
          throw new Error(res?.message || "Failed to save settings");
        }
      } else {
        updateProfile({
          city: accountCity.trim(),
          currentCity: accountCity.trim(),
          state: accountState.trim(),
          currentState: accountState.trim(),
          personal: {
            ...profile.personal,
            fullName: accountName.trim(),
            city: accountCity.trim(),
            state: accountState.trim(),
          },
        });
        if (auth?.updateUser) {
          auth.updateUser({ name: accountName.trim() });
        }
        addToast({
          type: "success",
          title: "Account Profile Saved",
          message: "Your profile identification and base city/state have been updated.",
        });
      }
    } catch (err) {
      addToast({
        type: "danger",
        title: "Save Failed",
        message: err.message || "Could not save account profile changes.",
      });
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleCancelAccount = () => {
    setAccountName(initialName);
    setAccountCity(initialCity);
    setAccountState(initialState);
    addToast({
      type: "info",
      title: "Changes Reverted",
      message: "Form fields reset to original profile data.",
    });
  };

  // Email Change Handlers (Spec §38)
  const handleRequestEmailOtp = async (e) => {
    if (e) e.preventDefault();
    if (!newEmailInput || !/^\S+@\S+\.\S+$/.test(newEmailInput)) {
      addToast({ type: "danger", title: "Invalid Email", message: "Please enter a valid new email address." });
      return;
    }
    if (newEmailInput.toLowerCase().trim() === accountEmail.toLowerCase().trim()) {
      addToast({ type: "danger", title: "Same Email", message: "New email must be different from current email." });
      return;
    }

    setIsEmailSubmitting(true);
    try {
      const res = await authService.requestEmailChange({
        newEmail: newEmailInput.trim(),
        password: emailPasswordInput,
      });
      if (res?.success || !isRealMode("auth")) {
        setIsEmailOtpSent(true);
        addToast({
          type: "success",
          title: "Verification Code Sent",
          message: `A 6-digit verification code has been dispatched to ${newEmailInput}.`,
        });
      } else {
        throw new Error(res?.message || "Failed to send email verification code");
      }
    } catch (err) {
      addToast({
        type: "danger",
        title: "Request Failed",
        message: err.message || "Could not initiate email change.",
      });
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  const handleVerifyEmailChange = async (e) => {
    if (e) e.preventDefault();
    if (!emailOtpInput || emailOtpInput.trim().length !== 6) {
      addToast({ type: "danger", title: "Invalid Code", message: "Please enter the 6-digit verification code." });
      return;
    }

    setIsEmailSubmitting(true);
    try {
      const res = await authService.verifyEmailChange({
        newEmail: newEmailInput.trim(),
        otp: emailOtpInput.trim(),
      });
      if (res?.success || !isRealMode("auth")) {
        setAccountEmail(newEmailInput.trim());
        if (auth?.updateUser) {
          auth.updateUser({ email: newEmailInput.trim(), isEmailVerified: true });
        }
        await updateProfile({
          isEmailVerified: true,
          personal: {
            ...profile.personal,
            email: newEmailInput.trim(),
            isEmailVerified: true,
          },
        });
        setShowEmailModal(false);
        setIsEmailOtpSent(false);
        setNewEmailInput("");
        setEmailPasswordInput("");
        setEmailOtpInput("");
        addToast({
          type: "success",
          title: "Email Verified & Updated",
          message: "Your primary account email is now verified and active.",
        });
      } else {
        throw new Error(res?.message || "Invalid verification code");
      }
    } catch (err) {
      addToast({
        type: "danger",
        title: "Verification Failed",
        message: err.message || "Failed to verify new email.",
      });
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  // Handlers: Tab 2 Password Update (Spec §38: Current password OR OTP)
  const handleSendPasswordOtp = async () => {
    setIsSendingPasswordOtp(true);
    try {
      const res = await authService.requestChangePasswordOtp();
      if (res?.success || !isRealMode("auth")) {
        setIsPasswordOtpSent(true);
        addToast({
          type: "success",
          title: "Code Dispatched",
          message: `Verification code sent to ${accountEmail || "your registered email"}.`,
        });
      } else {
        throw new Error(res?.message || "Failed to send verification code");
      }
    } catch (err) {
      addToast({
        type: "danger",
        title: "Request Failed",
        message: err.message || "Could not dispatch password verification code.",
      });
    } finally {
      setIsSendingPasswordOtp(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    if (e) e.preventDefault();

    if (passwordMode === "current" && !currentPassword) {
      addToast({
        type: "danger",
        title: "Current Password Required",
        message: "Please enter your current account password to authorize the change.",
      });
      return;
    }

    if (passwordMode === "otp" && (!passwordOtp || passwordOtp.trim().length !== 6)) {
      addToast({
        type: "danger",
        title: "Verification Code Required",
        message: "Please enter the 6-digit verification code sent to your email.",
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
        message: "New password and confirmation password must match exactly.",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const payload = {
        newPassword,
        ...(passwordMode === "current" ? { currentPassword } : { otp: passwordOtp.trim() }),
      };
      const res = await authService.changePassword(payload);
      if (res?.success || !isRealMode("auth")) {
        addToast({
          type: "success",
          title: "Password Updated",
          message: "Your authentication credentials have been securely updated.",
        });
        setCurrentPassword("");
        setPasswordOtp("");
        setIsPasswordOtpSent(false);
        setNewPassword("");
        setConfirmPassword("");
      } else {
        throw new Error(res?.message || "Could not update password.");
      }
    } catch (err) {
      addToast({
        type: "danger",
        title: "Password Update Failed",
        message: err.message || "An error occurred while updating password.",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleCancelPassword = () => {
    setCurrentPassword("");
    setPasswordOtp("");
    setIsPasswordOtpSent(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  // Handlers: 2FA Management (Spec §6 & §38)
  const handleOpen2FAModal = async (action) => {
    setTwoFAAction(action);
    setTwoFAOtpInput("");
    setTwoFAPasswordInput("");
    setShow2FAModal(true);

    if (action === "enable") {
      try {
        const res = await authService.setup2FA();
        if (res?.success || !isRealMode("auth")) {
          addToast({
            type: "info",
            title: "2FA Setup Code Sent",
            message: `Verification code sent to ${accountEmail || "your registered email"}.`,
          });
        }
      } catch (err) {
        addToast({
          type: "danger",
          title: "Setup Failed",
          message: err.message || "Could not generate 2FA setup code.",
        });
      }
    }
  };

  const handleConfirm2FA = async (e) => {
    if (e) e.preventDefault();
    setIs2FASubmitting(true);
    try {
      if (twoFAAction === "enable") {
        if (!twoFAOtpInput || twoFAOtpInput.trim().length !== 6) {
          addToast({ type: "danger", title: "Invalid Code", message: "Please enter 6-digit 2FA code." });
          return;
        }
        const res = await authService.verify2FASetup({ otp: twoFAOtpInput.trim() });
        if (res?.success || !isRealMode("auth")) {
          if (auth?.updateUser) auth.updateUser({ twoFactorEnabled: true });
          await updateProfile({ twoFactorEnabled: true });
          setShow2FAModal(false);
          addToast({
            type: "success",
            title: "2FA Enabled",
            message: "Two-Factor Authentication is now active on your account.",
          });
        } else {
          throw new Error(res?.message || "Invalid 2FA code");
        }
      } else {
        if (!twoFAPasswordInput) {
          addToast({ type: "danger", title: "Password Required", message: "Please enter your password to disable 2FA." });
          return;
        }
        const res = await authService.disable2FA({ password: twoFAPasswordInput });
        if (res?.success || !isRealMode("auth")) {
          if (auth?.updateUser) auth.updateUser({ twoFactorEnabled: false });
          await updateProfile({ twoFactorEnabled: false });
          setShow2FAModal(false);
          addToast({
            type: "success",
            title: "2FA Disabled",
            message: "Two-Factor Authentication has been turned off.",
          });
        } else {
          throw new Error(res?.message || "Failed to disable 2FA");
        }
      }
    } catch (err) {
      addToast({
        type: "danger",
        title: "2FA Action Failed",
        message: err.message || "Failed to update 2FA status.",
      });
    } finally {
      setIs2FASubmitting(false);
    }
  };

  // Handlers: Tab 3 Notification Channels (Spec §38: Email toggle only)
  const handleToggleEmailNotification = async (checked) => {
    setNotifEmail(checked);
    setIsUpdatingNotif(true);
    try {
      if (isRealMode("talent")) {
        await talentService.updateNotificationSettings({ emailNotificationsEnabled: checked });
      }
      if (auth?.updateUser) {
        auth.updateUser({ emailNotificationsEnabled: checked });
      }
      addToast({
        type: "success",
        title: checked ? "Email Notifications Enabled" : "Email Notifications Disabled",
        message: checked
          ? "You will receive audition callback notices and digests via email."
          : "Email notification digests have been turned off.",
      });
    } catch (err) {
      setNotifEmail(!checked);
      addToast({
        type: "danger",
        title: "Update Failed",
        message: err.message || "Failed to update notification settings.",
      });
    } finally {
      setIsUpdatingNotif(false);
    }
  };

  // Handlers: Tab 4 Account Deletion (Spec §38: OTP + confirmation)
  const handleRequestDeleteOtp = async () => {
    setIsSendingDeleteOtp(true);
    try {
      const res = await authService.requestDeleteAccountOtp();
      if (res?.success || !isRealMode("auth")) {
        setIsDeleteOtpSent(true);
        addToast({
          type: "info",
          title: "Confirmation Code Sent",
          message: `A 6-digit confirmation code has been dispatched to ${accountEmail || "your registered email"}.`,
        });
      } else {
        throw new Error(res?.message || "Failed to send deletion code");
      }
    } catch (err) {
      addToast({
        type: "danger",
        title: "Request Failed",
        message: err.message || "Could not dispatch account deletion code.",
      });
    } finally {
      setIsSendingDeleteOtp(false);
    }
  };

  const handleConfirmDelete = async (e) => {
    if (e) e.preventDefault();
    if (!deleteOtpInput || deleteOtpInput.trim().length !== 6) {
      addToast({
        type: "danger",
        title: "Code Required",
        message: "Please enter the 6-digit code sent to your registered email.",
      });
      return;
    }

    setIsDeletingAccount(true);
    try {
      const res = await authService.confirmDeleteAccount({ otp: deleteOtpInput.trim() });
      if (res?.success || !isRealMode("auth")) {
        setShowDeleteModal(false);
        addToast({
          type: "success",
          title: "Account Deletion Requested",
          message: "Your profile has been marked for deletion. Signing out...",
        });
        setTimeout(() => {
          if (auth?.clearSession) auth.clearSession();
          window.location.href = "/login";
        }, 1500);
      } else {
        throw new Error(res?.message || "Invalid confirmation code");
      }
    } catch (err) {
      addToast({
        type: "danger",
        title: "Deletion Failed",
        message: err.message || "Could not confirm account deletion.",
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const menuTabs = [
    { key: "account", label: "Account profile", icon: User },
    { key: "security", label: "Password & security", icon: Lock },
    { key: "notifications", label: "Notification channels", icon: Bell },
    { key: "privacy", label: "Privacy & account", icon: Shield },
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
        subtitle="Manage your authentication credentials, notification preferences, and account controls."
        breadcrumbs={[
          { label: "Talent Dashboard", href: "/talent/dashboard" },
          { label: "Settings" },
        ]}
        style={{ marginBottom: "24px" }}
      />

      {/* Main Settings Layout Container */}
      <div className="settings-page-layout">
        {/* Left Settings Menu */}
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
                            addToast({
                              type: "success",
                              title: "Profile Photo Updated",
                              message: "Your new display photo is live across casting shortlists.",
                            });
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
                        backgroundImage: profile.avatar || auth?.user?.profilePhoto || auth?.user?.avatar ? `url(${profile.avatar || auth?.user?.profilePhoto || auth?.user?.avatar})` : undefined,
                        backgroundColor: "#F3EFE6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#8A6B2E",
                        fontWeight: "700",
                        fontSize: "18px",
                      }}
                    >
                      {!(profile.avatar || auth?.user?.profilePhoto || auth?.user?.avatar) &&
                        (accountName ? accountName.slice(0, 2).toUpperCase() : "TR")}
                    </div>
                    <div className="settings-avatar-info">
                      <span className="settings-avatar-title">Profile display photo</span>
                      <span className="settings-avatar-subtitle">
                        Used across comp cards and verified casting shortlist summaries
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => settingsPhotoInputRef.current?.click()}
                        className="btn-secondary settings-photo-btn"
                      >
                        {profile.avatar || auth?.user?.profilePhoto ? "Change photo" : "Upload photo"}
                      </button>
                      {(profile.avatar || auth?.user?.profilePhoto) && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (
                              window.confirm(
                                "A profile photo is mandatory for talent verification. To replace it, please upload a new photo. Do you still wish to remove your current photo?"
                              )
                            ) {
                              try {
                                await removeProfilePhoto();
                              } catch (err) {
                                addToast({
                                  type: "danger",
                                  title: "Removal Failed",
                                  message: err.message || "Could not remove photo.",
                                });
                              }
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

                  {/* Form Grid Fields */}
                  <div className="talent-form-grid" style={{ marginTop: "24px" }}>
                    <div>
                      <label className="settings-field-label">Full name</label>
                      <input
                        id="settings-name-input"
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
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {isEmailVerified ? (
                            <span className="settings-verified-badge">
                              <CheckCircle2 size={12} />
                              <span>Verified</span>
                            </span>
                          ) : (
                            <span
                              className="settings-verified-badge"
                              style={{ backgroundColor: "#FEF3F2", color: "#B42318", borderColor: "#FECDCA" }}
                            >
                              <AlertCircle size={12} />
                              <span>Unverified</span>
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setNewEmailInput("");
                              setEmailPasswordInput("");
                              setEmailOtpInput("");
                              setIsEmailOtpSent(false);
                              setShowEmailModal(true);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--gold)",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              textDecoration: "underline",
                              padding: 0,
                            }}
                          >
                            Change email
                          </button>
                        </div>
                      </div>
                      <input
                        type="email"
                        value={accountEmail}
                        readOnly
                        className="settings-input"
                        style={{ backgroundColor: "#F9FAFB", cursor: "default", opacity: 0.9 }}
                      />
                      <span className="settings-helper-text">
                        Used for sign-in and formal contract communication. Change requires email verification.
                      </span>
                    </div>

                    <div>
                      <label className="settings-field-label">
                        Phone number for WhatsApp / SMS callbacks
                      </label>
                      <input
                        type="tel"
                        value={accountPhone}
                        readOnly
                        className="settings-input"
                        style={{ backgroundColor: "#F9FAFB", cursor: "not-allowed", opacity: 0.85 }}
                      />
                      <span className="settings-helper-text">
                        Mobile number cannot be changed. Contact support for help.
                      </span>
                    </div>

                    <div>
                      <label className="settings-field-label">Primary Base City</label>
                      <input
                        id="settings-city-input"
                        type="text"
                        value={accountCity}
                        onChange={(e) => setAccountCity(e.target.value)}
                        placeholder="e.g. Mumbai, Bengaluru, Delhi"
                        className="settings-input"
                      />
                      <span className="settings-helper-text">Primary domestic base city for audition scheduling</span>
                    </div>

                    <div>
                      <label className="settings-field-label">State / Province</label>
                      <input
                        id="settings-state-input"
                        type="text"
                        value={accountState}
                        onChange={(e) => setAccountState(e.target.value)}
                        placeholder="e.g. Maharashtra, Karnataka"
                        className="settings-input"
                      />
                      <span className="settings-helper-text">Domestic state or union territory</span>
                    </div>

                    <div className="talent-form-grid-full">
                      <label className="settings-field-label">Primary profession</label>
                      <input
                        type="text"
                        value={primaryProfession}
                        readOnly
                        className="settings-input"
                        style={{ backgroundColor: "#F9FAFB", cursor: "not-allowed", opacity: 0.85 }}
                      />
                      <span className="settings-helper-text">
                        Primary profession cannot be changed here. Contact support to request profession migration.
                      </span>
                    </div>
                  </div>

                  {/* Desktop Card Footer Row */}
                  <div className="settings-card-footer">
                    <button
                      type="button"
                      onClick={handleCancelAccount}
                      disabled={!hasAccountChanges || isSavingAccount}
                      className="btn-secondary settings-footer-btn"
                      style={{ opacity: !hasAccountChanges ? 0.5 : 1 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!hasAccountChanges || isSavingAccount}
                      className="btn-primary settings-footer-btn"
                      style={{ opacity: !hasAccountChanges ? 0.6 : 1, cursor: !hasAccountChanges ? "not-allowed" : "pointer" }}
                    >
                      <Save size={16} />
                      <span>{isSavingAccount ? "Saving..." : "Save changes"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: Password & Security */}
          {activeTab === "security" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Card 1: Change Password (Spec §38: Current password OR OTP) */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <h2 className="settings-card-title">Change password</h2>
                    <p className="settings-card-description">
                      Update your account password using your current password or a verification code sent to your email.
                    </p>
                  </div>
                </div>
                <div className="settings-card-divider" />

                <div className="settings-card-body">
                  {/* Mode Selector */}
                  <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", color: passwordMode === "current" ? "var(--text-primary)" : "var(--text-muted)" }}>
                      <input
                        type="radio"
                        name="passwordMode"
                        checked={passwordMode === "current"}
                        onChange={() => {
                          setPasswordMode("current");
                          setPasswordOtp("");
                          setIsPasswordOtpSent(false);
                        }}
                      />
                      <span>Use current password</span>
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", color: passwordMode === "otp" ? "var(--text-primary)" : "var(--text-muted)" }}>
                      <input
                        type="radio"
                        name="passwordMode"
                        checked={passwordMode === "otp"}
                        onChange={() => setPasswordMode("otp")}
                      />
                      <span>Verify via Email OTP</span>
                    </label>
                  </div>

                  <form id="password-settings-form" onSubmit={handleUpdatePassword}>
                    <div className="talent-form-grid">
                      {passwordMode === "current" ? (
                        <div className="talent-form-grid-full">
                          <label className="settings-field-label">Current password</label>
                          <PasswordInput
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="settings-input"
                            required={passwordMode === "current"}
                          />
                          <span className="settings-helper-text">Required to confirm authorization</span>
                        </div>
                      ) : (
                        <div className="talent-form-grid-full">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <label className="settings-field-label" style={{ margin: 0 }}>Email verification code (OTP)</label>
                            <button
                              type="button"
                              onClick={handleSendPasswordOtp}
                              disabled={isSendingPasswordOtp}
                              style={{
                                background: "none",
                                border: "none",
                                color: "var(--gold)",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: "pointer",
                                textDecoration: "underline",
                              }}
                            >
                              {isSendingPasswordOtp ? "Sending code..." : (isPasswordOtpSent ? "Resend code" : "Send code to email")}
                            </button>
                          </div>
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="Enter 6-digit code sent to your email"
                            value={passwordOtp}
                            onChange={(e) => setPasswordOtp(e.target.value.replace(/\D/g, ""))}
                            className="settings-input"
                            required={passwordMode === "otp"}
                          />
                          <span className="settings-helper-text">
                            A 6-digit security code sent to {accountEmail || "your registered email"}
                          </span>
                        </div>
                      )}

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
                        disabled={isUpdatingPassword}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary settings-footer-btn"
                        disabled={isUpdatingPassword}
                      >
                        <Key size={16} />
                        <span>{isUpdatingPassword ? "Updating..." : "Update password"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Card 2: Two-Factor Authentication (Spec §6 & §38) */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <h2 className="settings-card-title">Two-factor authentication (2FA)</h2>
                    <p className="settings-card-description">
                      Add an additional verification layer to safeguard your artist comp card and audition data.
                    </p>
                  </div>
                </div>
                <div className="settings-card-divider" />

                <div className="settings-card-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "10px",
                        backgroundColor: is2FAEnabled ? "rgba(46, 125, 50, 0.1)" : "#F3EFE6",
                        color: is2FAEnabled ? "var(--success)" : "#8A6B2E",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "14.5px", fontWeight: "700", color: "var(--text-primary)" }}>
                          Two-factor authentication
                        </span>
                        <span
                          className="settings-verified-badge"
                          style={{
                            backgroundColor: is2FAEnabled ? "rgba(46, 125, 50, 0.1)" : "#F3EFE6",
                            color: is2FAEnabled ? "var(--success)" : "var(--text-muted)",
                            borderColor: is2FAEnabled ? "rgba(46, 125, 50, 0.2)" : "#E8E2D4",
                          }}
                        >
                          {is2FAEnabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      <span style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "2px", display: "block" }}>
                        {is2FAEnabled
                          ? "Verification codes are required to authorize sign-ins from unrecognized browsers."
                          : "Optional security layer. When enabled, a 6-digit code is dispatched to your email on sign in."}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpen2FAModal(is2FAEnabled ? "disable" : "enable")}
                    className={is2FAEnabled ? "btn-secondary" : "btn-primary"}
                    style={{ minWidth: "120px" }}
                  >
                    {is2FAEnabled ? "Disable 2FA" : "Enable 2FA"}
                  </button>
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
                    Manage your alert dispatch channels per client specification (Spec §38: Email notification toggle).
                  </p>
                </div>
              </div>
              <div className="settings-card-divider" />

              <div className="settings-card-body">
                <div className="settings-channels-grid">
                  {/* Channel 1: In-App (Platform controlled) */}
                  <div className="settings-channel-card">
                    <div className="settings-channel-left">
                      <div className="settings-channel-icon">
                        <Bell size={20} />
                      </div>
                      <div className="settings-channel-text">
                        <span className="settings-channel-title">In-app notifications</span>
                        <span className="settings-channel-desc">
                          Live alerts delivered directly to your artist dashboard for audition sides, callbacks, and shortlists
                        </span>
                      </div>
                    </div>
                    <span
                      className="settings-verified-badge"
                      style={{ backgroundColor: "#F3EFE6", color: "#8A6B2E", borderColor: "#E8E2D4", whiteSpace: "nowrap" }}
                    >
                      Platform managed
                    </span>
                  </div>

                  {/* Channel 2: Email (Single Real Toggle per Spec §38) */}
                  <div className="settings-channel-card">
                    <div className="settings-channel-left">
                      <div className="settings-channel-icon">
                        <Mail size={20} />
                      </div>
                      <div className="settings-channel-text">
                        <span className="settings-channel-title">Email digests &amp; updates</span>
                        <span className="settings-channel-desc">
                          Formal casting confirmations, application logs, audition schedules, and production project briefs
                        </span>
                      </div>
                    </div>
                    <label className="settings-toggle-switch">
                      <input
                        type="checkbox"
                        checked={notifEmail}
                        disabled={isUpdatingNotif}
                        onChange={(e) => handleToggleEmailNotification(e.target.checked)}
                      />
                      <span className="settings-toggle-slider" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Privacy & Account */}
          {activeTab === "privacy" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Privacy Protocol Info Card */}
              <div className="settings-info-card">
                <ShieldCheck size={28} className="settings-info-icon" />
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <h3 className="settings-info-title">Verified privacy protocol</h3>
                  <p className="settings-info-text">
                    Per Vismaya Privacy Protocol (Spec §38), visibility controls (Public, Private, or Unlisted) are managed directly per media item in your Portfolio. Your basic comp card, verified credits, and stage name are discoverable by verified casting directors.
                  </p>
                </div>
              </div>

              {/* Danger Zone: Delete Profile */}
              <div className="settings-danger-card">
                <div className="settings-card-header">
                  <div>
                    <h2 className="settings-danger-title">Danger zone</h2>
                    <p className="settings-card-description">
                      Permanently erase your artist profile, portfolio media, and audition submission history. Temporary deactivation is not supported per client specification (Spec §38).
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
                      Requires email OTP verification. Once confirmed, your artist profile and active submissions will be permanently removed.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDeleteOtpInput("");
                      setIsDeleteOtpSent(false);
                      setShowDeleteModal(true);
                    }}
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

      {/* Mobile Sticky Bottom Action Bar */}
      {(activeTab === "account" || activeTab === "security") && (
        <div className="talent-sticky-action-bar">
          <button
            type="button"
            onClick={activeTab === "account" ? handleCancelAccount : handleCancelPassword}
            className="btn-secondary"
            disabled={activeTab === "account" ? (!hasAccountChanges || isSavingAccount) : isUpdatingPassword}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={activeTab === "account" ? handleSaveAccount : handleUpdatePassword}
            className="btn-primary"
            disabled={activeTab === "account" ? (!hasAccountChanges || isSavingAccount) : isUpdatingPassword}
          >
            <Save size={16} />
            <span>{activeTab === "account" ? (isSavingAccount ? "Saving..." : "Save changes") : (isUpdatingPassword ? "Updating..." : "Update password")}</span>
          </button>
        </div>
      )}

      {/* MODAL 1: Email Change with Re-Verification (Spec §38) */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title="Change Primary Email"
        subtitle="Verification required before the new address becomes active"
        maxWidth="480px"
      >
        <form onSubmit={isEmailOtpSent ? handleVerifyEmailChange : handleRequestEmailOtp}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
            <div>
              <label className="settings-field-label">Current active email</label>
              <input
                type="email"
                value={accountEmail}
                readOnly
                className="settings-input"
                style={{ backgroundColor: "#F9FAFB", cursor: "default" }}
              />
            </div>

            <div>
              <label className="settings-field-label">New email address *</label>
              <input
                type="email"
                required
                disabled={isEmailOtpSent}
                value={newEmailInput}
                onChange={(e) => setNewEmailInput(e.target.value)}
                placeholder="e.g. new.artist@vismaya.io"
                className="settings-input"
              />
            </div>

            {!isEmailOtpSent && (
              <div>
                <label className="settings-field-label">Current password (to authorize)</label>
                <PasswordInput
                  placeholder="Enter current password"
                  value={emailPasswordInput}
                  onChange={(e) => setEmailPasswordInput(e.target.value)}
                  className="settings-input"
                />
                <span className="settings-helper-text">Leave blank if signed in via Google OAuth</span>
              </div>
            )}

            {isEmailOtpSent && (
              <div>
                <label className="settings-field-label">6-digit verification code *</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={emailOtpInput}
                  onChange={(e) => setEmailOtpInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter code sent to new email"
                  className="settings-input"
                />
                <span className="settings-helper-text">
                  A verification code was dispatched to {newEmailInput}. Valid for 10 minutes.
                </span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="btn-secondary"
                disabled={isEmailSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isEmailSubmitting}
              >
                {isEmailSubmitting ? "Processing..." : (isEmailOtpSent ? "Verify & Update Email" : "Send Verification Code")}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: 2FA Setup & Verification (Spec §6 & §38) */}
      <Modal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        title={twoFAAction === "enable" ? "Enable Two-Factor Authentication" : "Disable Two-Factor Authentication"}
        subtitle={twoFAAction === "enable" ? "Enter the 6-digit code sent to your email" : "Confirm with your password"}
        maxWidth="460px"
      >
        <form onSubmit={handleConfirm2FA}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
            {twoFAAction === "enable" ? (
              <div>
                <label className="settings-field-label">6-digit verification code</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={twoFAOtpInput}
                  onChange={(e) => setTwoFAOtpInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter code sent to email"
                  className="settings-input"
                />
                <span className="settings-helper-text">Dispatched to {accountEmail || "your registered email"}</span>
              </div>
            ) : (
              <div>
                <label className="settings-field-label">Account password</label>
                <PasswordInput
                  required
                  placeholder="Enter your account password"
                  value={twoFAPasswordInput}
                  onChange={(e) => setTwoFAPasswordInput(e.target.value)}
                  className="settings-input"
                />
                <span className="settings-helper-text">Required to authorize disabling 2FA security</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
              <button
                type="button"
                onClick={() => setShow2FAModal(false)}
                className="btn-secondary"
                disabled={is2FASubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={is2FASubmitting}
              >
                {is2FASubmitting ? "Processing..." : (twoFAAction === "enable" ? "Verify & Enable 2FA" : "Disable 2FA")}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Account Deletion Confirmation with OTP (Spec §38) */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Request Account Deletion"
        subtitle="This action is permanent and cannot be reversed."
        maxWidth="480px"
      >
        <form onSubmit={handleConfirmDelete}>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6, margin: "0 0 16px 0" }}>
            Are you sure you want to request deletion of your Vismaya artist account? All verified badges, portfolio showreels, self-tapes, casting submission records, and callback histories will be permanently removed.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>
                Step 1: Security Verification Code
              </span>
              <button
                type="button"
                onClick={handleRequestDeleteOtp}
                disabled={isSendingDeleteOtp}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--gold)",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                {isSendingDeleteOtp ? "Sending code..." : (isDeleteOtpSent ? "Resend code" : "Send code to email")}
              </button>
            </div>

            {isDeleteOtpSent && (
              <div>
                <label className="settings-field-label">Enter 6-digit confirmation code</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={deleteOtpInput}
                  onChange={(e) => setDeleteOtpInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 6-digit deletion code"
                  className="settings-input"
                />
                <span className="settings-helper-text">Code sent to {accountEmail || "your registered email"}</span>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", width: "100%", justifyContent: "flex-end", marginTop: "12px" }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
                disabled={isDeletingAccount}
              >
                Keep account
              </button>
              <button
                type="submit"
                disabled={!isDeleteOtpSent || isDeletingAccount}
                style={{
                  padding: "10px 20px",
                  borderRadius: "12px",
                  backgroundColor: !isDeleteOtpSent ? "#ccc" : "var(--danger)",
                  color: "#ffffff",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: !isDeleteOtpSent ? "not-allowed" : "pointer",
                  border: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: isDeletingAccount ? 0.7 : 1,
                }}
              >
                <Trash2 size={15} />
                <span>{isDeletingAccount ? "Deleting..." : "Confirm deletion"}</span>
              </button>
            </div>
          </div>
        </form>
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
