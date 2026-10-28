"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
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
    { key: "account", label: "Account profile", mobileLabel: "Account", icon: User },
    { key: "security", label: "Password & security", mobileLabel: "Password", icon: Lock },
    { key: "notifications", label: "Notification channels", mobileLabel: "Notifications", icon: Bell },
    { key: "privacy", label: "Privacy & account", mobileLabel: "Privacy", icon: Shield },
  ];

  return (
    <div
      className="settings-v2"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "1240px",
        margin: "0 auto",
      }}
    >
      {/* Breadcrumb, Title & Subtitle */}
      <PageHeader
        title="Settings"
        subtitle="Manage your account details, password, notifications and privacy."
        breadcrumbs={[
          { label: "Talent Dashboard", href: "/talent/dashboard" },
          { label: "Settings" },
        ]}
        style={{ marginBottom: "28px" }}
      />

      {/* Mobile Horizontally Scrollable Pill Tabs */}
      <div className="settings-mobile-tabs" ref={tabNavRef}>
        {menuTabs.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={`settings-mobile-tab-btn ${isActive ? "tab-active" : ""}`}
            >
              {item.mobileLabel}
            </button>
          );
        })}
      </div>

      {/* Main Settings Layout Container */}
      <div className="settings-page-layout">
        {/* Left Settings Menu */}
        <aside className="settings-sidebar-nav">
          <div className="settings-nav-card">
            {menuTabs.map((item) => {
              const isActive = activeTab === item.key;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveTab(item.key)}
                  className={`settings-nav-row ${isActive ? "settings-tab-active" : ""}`}
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
                  <h2 className="settings-card-title">Account details</h2>
                  <p className="settings-card-description">
                    Manage your personal identification, display photo, and verified contact details.
                  </p>
                </div>
              </div>
              <div className="settings-card-divider" />

              <form id="account-settings-form" onSubmit={handleSaveAccount}>
                <div className="settings-card-body">
                  {/* Photo Row: 76px round avatar, title + helper, change / remove buttons */}
                  <div className="settings-photo-row">
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
                      className="settings-photo-avatar"
                      style={{
                        backgroundImage: profile.avatar || auth?.user?.profilePhoto || auth?.user?.avatar ? `url(${profile.avatar || auth?.user?.profilePhoto || auth?.user?.avatar})` : undefined,
                      }}
                    >
                      {!(profile.avatar || auth?.user?.profilePhoto || auth?.user?.avatar) &&
                        (accountName ? accountName.slice(0, 2).toUpperCase() : "TR")}
                    </div>
                    <div className="settings-photo-meta">
                      <span className="settings-photo-title">Profile photo</span>
                      <span className="settings-photo-helper">
                        JPG, PNG or WebP, at least 400x400px, max 5 MB
                      </span>
                    </div>
                    <div className="settings-photo-actions">
                      <button
                        type="button"
                        onClick={() => settingsPhotoInputRef.current?.click()}
                        className="settings-btn-secondary settings-photo-action-btn"
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
                          className="settings-btn-red-outline settings-photo-action-btn"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="settings-photo-divider" />

                  {/* Fields in a 2-column grid (gap 26px 28px): Full name, Primary email, Phone, Primary base city */}
                  <div className="settings-form-grid">
                    <div className="settings-field-group">
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

                    <div className="settings-field-group">
                      <label className="settings-field-label">Primary email</label>
                      <input
                        type="email"
                        value={accountEmail}
                        readOnly
                        className="settings-input settings-input-readonly"
                      />
                      <div
                        className="settings-email-status-row"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          flexWrap: "wrap",
                          marginTop: "10px",
                        }}
                      >
                        <div className="settings-pill-container" style={{ display: "inline-flex" }}>
                          {isEmailVerified ? (
                            <span
                              className="settings-pill-verified"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                height: "26px",
                                padding: "0 10px",
                                borderRadius: "999px",
                                backgroundColor: "#E3F0E7",
                                color: "#2F6B45",
                                fontSize: "11px",
                                fontWeight: 700,
                                letterSpacing: "0.06em",
                                lineHeight: 1,
                                whiteSpace: "nowrap",
                              }}
                            >
                              <CheckCircle2 size={12} />
                              <span>VERIFIED</span>
                            </span>
                          ) : (
                            <span
                              className="settings-pill-unverified"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                height: "26px",
                                padding: "0 10px",
                                borderRadius: "999px",
                                backgroundColor: "#FBEBDD",
                                color: "#8F3F16",
                                fontSize: "11px",
                                fontWeight: 700,
                                letterSpacing: "0.06em",
                                lineHeight: 1,
                                whiteSpace: "nowrap",
                              }}
                            >
                              <AlertCircle size={12} />
                              <span>UNVERIFIED</span>
                            </span>
                          )}
                        </div>

                        {!isEmailVerified && (
                          <button
                            type="button"
                            onClick={() => {
                              setNewEmailInput(accountEmail);
                              setEmailPasswordInput("");
                              setEmailOtpInput("");
                              setIsEmailOtpSent(false);
                              setShowEmailModal(true);
                            }}
                            className="settings-email-action-btn settings-email-verify-btn"
                          >
                            Verify email
                          </button>
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
                          className="settings-email-action-btn settings-email-change-btn"
                        >
                          Change email
                        </button>
                      </div>
                      <span className="settings-helper-text">
                        Used for sign-in and formal contract communication. Change requires email verification.
                      </span>
                    </div>

                    <div className="settings-field-group">
                      <label className="settings-field-label">Phone (WhatsApp/SMS)</label>
                      <div className="settings-input-with-icon">
                        <input
                          type="tel"
                          value={accountPhone || ""}
                          placeholder={!accountPhone ? "Not added" : ""}
                          readOnly
                          className="settings-input settings-input-readonly"
                        />
                        <Lock size={16} className="settings-input-lock-icon" />
                      </div>
                      <span className="settings-helper-text">
                        The mobile number is locked.{" "}
                        <Link href="/support" className="settings-support-link">
                          Contact support
                        </Link>{" "}
                        to change it.
                      </span>
                    </div>

                    <div className="settings-field-group">
                      <label className="settings-field-label">Primary base city</label>
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

                    <div className="settings-field-group">
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

                    <div className="settings-field-group">
                      <label className="settings-field-label">Primary profession</label>
                      <div className="settings-input-with-icon">
                        <input
                          type="text"
                          value={primaryProfession}
                          readOnly
                          className="settings-input settings-input-readonly"
                        />
                        <Lock size={16} className="settings-input-lock-icon" />
                      </div>
                      <span className="settings-helper-text">
                        Primary profession is locked to your verification credential. Contact support to migrate.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Bar */}
                <div className="settings-card-footer">
                  <button
                    type="button"
                    onClick={handleCancelAccount}
                    disabled={!hasAccountChanges || isSavingAccount}
                    className="settings-btn-secondary settings-footer-btn"
                    style={{ opacity: !hasAccountChanges ? 0.5 : 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!hasAccountChanges || isSavingAccount}
                    className="settings-btn-primary settings-footer-btn"
                    style={{ opacity: !hasAccountChanges ? 0.6 : 1, cursor: !hasAccountChanges ? "not-allowed" : "pointer" }}
                  >
                    <Save size={16} />
                    <span>{isSavingAccount ? "Saving..." : "Save changes"}</span>
                  </button>
                </div>
              </form>
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
                      Update your account password using your current password or a verification code sent to your email.
                    </p>
                  </div>
                </div>
                <div className="settings-card-divider" />

                <form id="password-settings-form" onSubmit={handleUpdatePassword}>
                  <div className="settings-card-body">
                    {/* Mode Selector */}
                    <div style={{ display: "flex", gap: "20px", marginBottom: "24px", flexWrap: "wrap" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", color: passwordMode === "current" ? "#2A241A" : "#6B6254" }}>
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

                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", color: passwordMode === "otp" ? "#2A241A" : "#6B6254" }}>
                        <input
                          type="radio"
                          name="passwordMode"
                          checked={passwordMode === "otp"}
                          onChange={() => setPasswordMode("otp")}
                        />
                        <span>Verify via Email OTP</span>
                      </label>
                    </div>

                    <div className="settings-form-grid">
                      {passwordMode === "current" ? (
                        <div className="settings-field-group settings-grid-full">
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
                        <div className="settings-field-group settings-grid-full">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <label className="settings-field-label" style={{ margin: 0 }}>Email verification code (OTP)</label>
                            <button
                              type="button"
                              onClick={handleSendPasswordOtp}
                              disabled={isSendingPasswordOtp}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#8A6B2E",
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

                      <div className="settings-field-group">
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
                              <span style={{ color: "#6B6254" }}>Strength:</span>
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
                        <span className="settings-helper-text">Must be at least 8 characters with numbers and symbols</span>
                      </div>

                      <div className="settings-field-group">
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
                      <div className="settings-field-group settings-grid-full">
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#2A241A", display: "block", marginBottom: "8px" }}>
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
                  </div>

                  <div className="settings-card-footer">
                    <button
                      type="button"
                      onClick={handleCancelPassword}
                      className="settings-btn-secondary settings-footer-btn"
                      disabled={isUpdatingPassword}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="settings-btn-primary settings-footer-btn"
                      disabled={isUpdatingPassword}
                    >
                      <Key size={16} />
                      <span>{isUpdatingPassword ? "Updating..." : "Update password"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Card 2: Two-Factor Authentication */}
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
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        backgroundColor: is2FAEnabled ? "#E3F0E7" : "#F3ECDC",
                        color: is2FAEnabled ? "#2F6B45" : "#8A6B2E",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "15px", fontWeight: "600", color: "#2A241A" }}>
                          Two-factor authentication
                        </span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            height: "24px",
                            padding: "0 10px",
                            borderRadius: "999px",
                            backgroundColor: is2FAEnabled ? "#E3F0E7" : "#F3ECDC",
                            color: is2FAEnabled ? "#2F6B45" : "#5E471B",
                            fontSize: "11px",
                            fontWeight: "700",
                            letterSpacing: ".04em",
                            lineHeight: 1,
                          }}
                        >
                          {is2FAEnabled ? "ENABLED" : "DISABLED"}
                        </span>
                      </div>
                      <span style={{ fontSize: "13px", color: "#6B6254", marginTop: "4px", display: "block", lineHeight: 1.5 }}>
                        {is2FAEnabled
                          ? "Verification codes are required to authorize sign-ins from unrecognized browsers."
                          : "Optional security layer. When enabled, a 6-digit code is dispatched to your email on sign in."}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpen2FAModal(is2FAEnabled ? "disable" : "enable")}
                    className={is2FAEnabled ? "settings-btn-secondary" : "settings-btn-primary"}
                    style={{ minHeight: "44px", padding: "0 22px" }}
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
                    Choose how Vismaya reaches you.
                  </p>
                </div>
              </div>
              <div className="settings-card-divider" />

              <div className="settings-card-body">
                <div className="settings-channel-list">
                  {/* Channel 1: In-App (Platform controlled) */}
                  <div className="settings-channel-row">
                    <div className="settings-channel-icon-box">
                      <Bell size={20} />
                    </div>
                    <div className="settings-channel-text-block">
                      <span className="settings-channel-title">In-app notifications</span>
                      <span className="settings-channel-desc">
                        Live alerts delivered directly to your artist dashboard for audition sides, callbacks, and shortlists
                      </span>
                      <div style={{ marginTop: "8px" }}>
                        <span className="settings-pill-platform-managed">
                          PLATFORM MANAGED
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Channel 2: Email (Toggle) */}
                  <div className="settings-channel-row">
                    <div className="settings-channel-icon-box">
                      <Mail size={20} />
                    </div>
                    <div className="settings-channel-text-block">
                      <span className="settings-channel-title">Email digests &amp; updates</span>
                      <span className="settings-channel-desc">
                        Formal casting confirmations, application logs, audition schedules, and production project briefs
                      </span>
                    </div>
                    <label className="settings-toggle-switch" aria-label="Toggle email notifications">
                      <input
                        type="checkbox"
                        role="switch"
                        aria-checked={notifEmail}
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
              <div className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <h2 className="settings-card-title">Privacy protocol</h2>
                    <p className="settings-card-description">
                      How your public comp card, verified credits, and stage name are shared across casting calls.
                    </p>
                  </div>
                </div>
                <div className="settings-card-divider" />
                <div className="settings-card-body" style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                  <div className="settings-channel-icon-box" style={{ flexShrink: 0 }}>
                    <ShieldCheck size={22} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: "15px", fontWeight: "600", color: "#2A241A" }}>
                      Verified artist discoverability
                    </span>
                    <p style={{ fontSize: "13px", color: "#6B6254", lineHeight: 1.55, margin: 0 }}>
                      Visibility controls (Public, Private, or Unlisted) are managed directly per media item in your Portfolio. Your basic comp card, verified credits, and stage name are discoverable by verified casting directors and talent agents.
                    </p>
                  </div>
                </div>
              </div>

              {/* Danger Zone: Separate Card with Red-Tinted Header */}
              <div className="settings-danger-box">
                <div className="settings-danger-box-header">
                  <div>
                    <h2 className="settings-danger-box-title">Danger zone</h2>
                    <p className="settings-danger-box-subtitle">
                      Permanently erase your artist profile, portfolio media, and audition submission history.
                    </p>
                  </div>
                </div>

                <div className="settings-danger-box-body">
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#2A241A" }}>
                      Request account deletion
                    </span>
                    <span style={{ fontSize: "13px", color: "#6B6254", lineHeight: 1.5 }}>
                      This action cannot be undone. All active casting submissions, shortlists, and media items will be immediately removed.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDeleteOtpInput("");
                      setIsDeleteOtpSent(false);
                      setShowDeleteModal(true);
                    }}
                    className="settings-btn-red-outline"
                    style={{ minHeight: "44px", padding: "0 20px" }}
                  >
                    <Trash2 size={16} />
                    <span>Delete account</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      {(activeTab === "account" || activeTab === "security") && (
        <div className="settings-mobile-sticky-bar">
          <button
            type="button"
            onClick={activeTab === "account" ? handleCancelAccount : handleCancelPassword}
            className="settings-btn-secondary"
            style={{ flex: 1, minHeight: "48px" }}
            disabled={activeTab === "account" ? (!hasAccountChanges || isSavingAccount) : isUpdatingPassword}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={activeTab === "account" ? handleSaveAccount : handleUpdatePassword}
            className="settings-btn-primary"
            style={{ flex: 1.4, minHeight: "48px" }}
            disabled={activeTab === "account" ? (!hasAccountChanges || isSavingAccount) : isUpdatingPassword}
          >
            <Save size={16} />
            <span>{activeTab === "account" ? (isSavingAccount ? "Saving..." : "Save changes") : (isUpdatingPassword ? "Updating..." : "Save changes")}</span>
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
        /* =========================================================================
           SETTINGS V2 SCOPED STYLES
           ========================================================================= */
        .settings-v2 {
          width: 100%;
        }

        /* 2-Column Desktop Grid */
        .settings-page-layout {
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          gap: 32px;
          align-items: flex-start;
          width: 100%;
          max-width: 1240px;
        }

        /* Left Nav Column */
        .settings-sidebar-nav {
          width: 260px;
          position: sticky;
          top: 96px;
          flex-shrink: 0;
        }

        .settings-nav-card {
          background: #FFFFFF;
          border: 1px solid #E8E1D2;
          border-radius: 16px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .settings-nav-row {
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 16px;
          background: transparent;
          border: 1px solid transparent;
          color: #4A4234;
          font-family: var(--font-body), "Inter", sans-serif;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.16s ease;
          width: 100%;
          text-align: left;
        }

        .settings-nav-row:hover:not(.settings-tab-active) {
          background-color: #FAF8F3;
          color: #2A241A;
        }

        .settings-nav-row.settings-tab-active {
          background: #FBF3DF !important;
          border: 1px solid #E6D3A2 !important;
          color: #2A241A !important;
          font-weight: 600 !important;
        }

        .settings-nav-icon {
          flex-shrink: 0;
          color: #8A6B2E;
        }

        .settings-nav-row:not(.settings-tab-active) .settings-nav-icon {
          color: #6B6254;
        }

        /* Mobile Horizontal Tabs */
        .settings-mobile-tabs {
          display: none;
        }

        /* Right Content Area */
        .settings-content-area {
          flex: 1;
          min-width: 0;
          width: 100%;
        }

        /* White Cards */
        .settings-card {
          background: #FFFFFF;
          border: 1px solid #E8E1D2;
          border-radius: 16px;
          overflow: hidden;
          width: 100%;
        }

        .settings-card-header {
          padding: 28px 32px 22px;
        }

        .settings-card-title {
          font-family: var(--font-heading), 'Playfair Display', Georgia, serif;
          font-size: 24px;
          font-weight: 600;
          color: #2A241A;
          margin: 0 0 4px 0;
          line-height: 1.25;
        }

        .settings-card-description {
          font-size: 14px;
          color: #6B6254;
          margin: 0;
          line-height: 1.5;
          font-family: var(--font-body), 'Inter', sans-serif;
        }

        .settings-card-divider {
          height: 1px;
          background-color: #EFE9DA;
          width: 100%;
        }

        .settings-card-body {
          padding: 28px 32px;
        }

        .settings-card-footer {
          padding: 18px 32px;
          background: #FCFAF4;
          border-top: 1px solid #EFE9DA;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
        }

        /* Buttons */
        .settings-btn-primary {
          height: 46px;
          padding: 0 24px;
          border-radius: 10px;
          background: #8A6B2E;
          color: #FFFFFF;
          font-family: var(--font-body), 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background-color 0.16s ease;
        }

        .settings-btn-primary:hover:not(:disabled) {
          background: #6E5420;
        }

        .settings-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .settings-btn-secondary {
          height: 46px;
          padding: 0 24px;
          border-radius: 10px;
          background: #FFFFFF;
          color: #2A241A;
          font-family: var(--font-body), 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          border: 1px solid #D9D1BF;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background-color 0.16s ease, border-color 0.16s ease;
        }

        .settings-btn-secondary:hover:not(:disabled) {
          background: #F7F3EA;
          border-color: #C9A95C;
        }

        .settings-btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .settings-btn-red-outline {
          height: 40px;
          padding: 0 18px;
          border-radius: 10px;
          background: #FFFFFF;
          color: #A3321F;
          font-family: var(--font-body), 'Inter', sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          border: 1px solid #E8C5BD;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.16s ease;
        }

        .settings-btn-red-outline:hover:not(:disabled) {
          background: #FBE9E5;
          border-color: #DFA99E;
        }

        .settings-btn-red-outline:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Photo Row */
        .settings-photo-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .settings-photo-left {
          display: flex;
          align-items: center;
          gap: 20px;
          min-width: 0;
        }

        .settings-photo-avatar {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          background-size: cover;
          background-position: center;
          border: 2px solid #8A6B2E;
          background-color: #F3EFE6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 700;
          color: #8A6B2E;
          flex-shrink: 0;
        }

        .settings-photo-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .settings-photo-title {
          font-size: 16px;
          font-weight: 600;
          color: #2A241A;
        }

        .settings-photo-helper {
          font-size: 13px;
          color: #6B6254;
          line-height: 1.45;
        }

        .settings-photo-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .settings-photo-divider {
          height: 1px;
          background-color: #EFE9DA;
          width: 100%;
          margin: 24px 0 28px;
        }

        /* 2-Column Form Grid */
        .settings-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 26px 28px;
          width: 100%;
        }

        .settings-field-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .settings-field-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #6B6254;
          line-height: 1.2;
        }

        .settings-input {
          width: 100%;
          height: 46px;
          padding: 0 16px;
          border-radius: 10px;
          border: 1px solid #D9D1BF;
          background: #FFFFFF;
          color: #2A241A;
          font-family: var(--font-body), 'Inter', sans-serif;
          font-size: 15px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.16s ease, box-shadow 0.16s ease;
        }

        .settings-input:focus {
          border-color: #8A6B2E;
          box-shadow: 0 0 0 2px rgba(138, 107, 46, 0.2);
        }

        .settings-input-readonly {
          background-color: #F7F3EA !important;
          color: #4A4234 !important;
          cursor: default;
        }

        .settings-input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .settings-input-lock-icon {
          position: absolute;
          right: 14px;
          color: #8A6B2E;
          pointer-events: none;
        }

        .settings-helper-text {
          display: block;
          font-size: 13px;
          color: #6B6254;
          line-height: 1.5;
          margin-top: 8px;
        }

        .settings-helper-link,
        .settings-support-link {
          color: #8A6B2E;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: color 0.16s ease;
        }

        .settings-helper-link:hover,
        .settings-helper-link:focus,
        .settings-support-link:hover,
        .settings-support-link:focus {
          color: #6E5420;
          text-decoration: underline;
        }

        /* Email Status Row & Action Buttons */
        .settings-email-status-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 10px;
        }

        .settings-email-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 32px;
          padding: 0 12px;
          border-radius: 10px;
          border: 1px solid #CDBF9E;
          background: #FFFFFF;
          color: #5E471B;
          font-family: var(--font-body), "Inter", sans-serif;
          font-size: 13px;
          font-weight: 600;
          line-height: 1;
          cursor: pointer;
          white-space: nowrap;
          text-decoration: none;
          box-sizing: border-box;
          transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease;
        }

        .settings-email-action-btn:hover:not(:disabled) {
          background-color: #FBF3DF;
          border-color: #C9A95C;
          color: #5E471B;
        }

        .settings-email-action-btn:focus-visible {
          outline: 2px solid #8A6B2E;
          outline-offset: 2px;
        }

        .settings-email-action-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        /* Email Status Pills */
        .settings-pill-verified {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 26px;
          padding: 0 10px;
          border-radius: 999px;
          background: #E3F0E7;
          color: #2F6B45;
          font-family: var(--font-body), "Inter", sans-serif;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          line-height: 1;
          letter-spacing: 0.06em;
          white-space: nowrap;
          box-sizing: border-box;
        }

        .settings-pill-unverified {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 26px;
          padding: 0 10px;
          border-radius: 999px;
          background: #FBEBDD;
          color: #8F3F16;
          font-family: var(--font-body), "Inter", sans-serif;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          line-height: 1;
          letter-spacing: 0.06em;
          white-space: nowrap;
          box-sizing: border-box;
        }

        .settings-pill-platform-managed {
          display: inline-flex;
          align-items: center;
          height: 26px;
          padding: 0 10px;
          border-radius: 999px;
          background: #F3ECDC;
          color: #5E471B;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          line-height: 1;
          letter-spacing: 0.04em;
          width: fit-content;
        }

        /* Notification Channels List */
        .settings-channel-list {
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        .settings-channel-row {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px 0;
          border-top: 1px solid #EFE9DA;
          width: 100%;
        }

        .settings-channel-row:first-child {
          border-top: none;
          padding-top: 0;
        }

        .settings-channel-row:last-child {
          padding-bottom: 0;
        }

        .settings-channel-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #F3ECDC;
          color: #8A6B2E;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .settings-channel-text-block {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          word-break: normal;
          overflow-wrap: break-word;
        }

        .settings-channel-title {
          font-size: 15px;
          font-weight: 600;
          color: #2A241A;
          line-height: 1.35;
          word-break: normal;
        }

        .settings-channel-desc {
          font-size: 13px;
          color: #6B6254;
          line-height: 1.5;
          word-break: normal;
        }

        /* 52x30 Sleek Switch */
        .settings-toggle-switch {
          position: relative;
          display: inline-block;
          width: 52px;
          height: 30px;
          flex: none;
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
          background-color: #D9D1BF;
          border-radius: 999px;
          transition: background-color 0.2s ease;
        }

        .settings-toggle-slider::before {
          position: absolute;
          content: "";
          height: 24px;
          width: 24px;
          left: 3px;
          bottom: 3px;
          background-color: #FFFFFF;
          border-radius: 50%;
          transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
        }

        .settings-toggle-switch input:checked + .settings-toggle-slider {
          background-color: #8A6B2E;
        }

        .settings-toggle-switch input:checked + .settings-toggle-slider::before {
          transform: translateX(22px);
        }

        /* Danger Box */
        .settings-danger-box {
          background: #FFFFFF;
          border: 1px solid #E8C5BD;
          border-radius: 16px;
          overflow: hidden;
          width: 100%;
        }

        .settings-danger-box-header {
          padding: 20px 24px;
          background: #FBE9E5;
          border-bottom: 1px solid #E8C5BD;
        }

        .settings-danger-box-title {
          font-family: var(--font-heading), 'Playfair Display', Georgia, serif;
          font-size: 20px;
          font-weight: 600;
          color: #A3321F;
          margin: 0 0 2px 0;
          line-height: 1.3;
        }

        .settings-danger-box-body {
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        /* Mobile Sticky Footer Bar */
        .settings-mobile-sticky-bar {
          display: none;
        }

        /* Active Sessions & Helpers */
        .settings-session-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 10px;
          background-color: #FAF8F3;
          border: 1px solid #E8E1D2;
          flex-wrap: wrap;
        }

        .settings-session-icon {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background-color: #FFFFFF;
          border: 1px solid #E8E1D2;
          color: #8A6B2E;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
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
          color: #6B6254;
          transition: color 0.16s ease;
        }

        .settings-check-item.check-pass {
          color: #2F6B45;
          font-weight: 600;
        }

        .settings-check-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #D9D1BF;
        }

        /* =========================================================================
           RESPONSIVE BREAKPOINTS (Desktop < 1024px and Mobile <= 767px)
           ========================================================================= */
        @media (max-width: 1023.98px) {
          .settings-page-layout {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }

          .settings-sidebar-nav {
            width: 100%;
            position: static;
            top: auto;
          }

          .settings-nav-card {
            flex-direction: row;
            overflow-x: auto;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
            padding: 8px;
          }

          .settings-nav-card::-webkit-scrollbar {
            display: none;
          }

          .settings-nav-row {
            flex-shrink: 0;
            width: auto;
            padding: 0 16px;
          }
        }

        @media (max-width: 767.98px) {
          .settings-v2 {
            padding-bottom: 100px; /* Leave room for mobile sticky bar */
          }

          /* Hide left nav card on mobile */
          .settings-sidebar-nav {
            display: none !important;
          }

          /* Show horizontal pills */
          .settings-mobile-tabs {
            display: flex !important;
            gap: 8px;
            overflow-x: auto;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
            margin: 0 -16px 20px -16px;
            padding: 0 16px;
            width: calc(100% + 32px);
          }

          .settings-mobile-tabs::-webkit-scrollbar {
            display: none;
          }

          .settings-mobile-tab-btn {
            flex: none;
            height: 44px;
            padding: 0 16px;
            border-radius: 999px;
            font-size: 14px;
            font-weight: 600;
            white-space: nowrap;
            border: 1px solid #E1D4B3;
            background: #FFFFFF;
            color: #4A4234;
            cursor: pointer;
            transition: all 0.16s ease;
          }

          .settings-mobile-tab-btn.settings-tab-active {
            background: #FBF3DF !important;
            border-color: #C9A95C !important;
            color: #2A241A !important;
          }

          /* Card adjustments */
          .settings-card {
            border-radius: 14px;
          }

          .settings-card-header {
            padding: 20px 18px 16px;
          }

          .settings-card-title {
            font-size: 22px !important;
          }

          .settings-card-body {
            padding: 20px 18px;
          }

          /* Single-column fields on mobile with 48px inputs and 16px font */
          .settings-form-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }

          .settings-input {
            height: 48px !important;
            font-size: 16px !important; /* Prevents iOS auto-zoom */
          }

          /* Email status row on mobile: pill on first line, buttons share next line */
          .settings-email-status-row {
            display: flex !important;
            flex-wrap: wrap !important;
            align-items: center !important;
            gap: 10px !important;
          }

          .settings-pill-container {
            flex-basis: 100% !important;
            width: 100% !important;
            display: flex !important;
          }

          .settings-email-status-row .settings-pill-verified,
          .settings-email-status-row .settings-pill-unverified {
            width: fit-content !important;
            flex: 0 0 auto !important;
          }

          .settings-email-action-btn {
            height: 40px !important;
            padding: 0 14px !important;
            font-size: 13px !important;
          }

          /* Photo row on mobile */
          .settings-photo-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }

          .settings-photo-left {
            gap: 16px !important;
          }

          .settings-photo-avatar {
            width: 64px !important;
            height: 64px !important;
          }

          .settings-photo-actions {
            width: 100% !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }

          .settings-photo-actions .settings-btn-secondary,
          .settings-photo-actions .settings-btn-red-outline {
            height: 44px !important;
            width: 100% !important;
            padding: 0 10px !important;
            font-size: 13px !important;
          }

          /* Hide card footer, show sticky mobile bar */
          .settings-card-footer {
            display: none !important;
          }

          .settings-mobile-sticky-bar {
            display: flex !important;
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            height: 88px !important;
            background: #FFFFFF !important;
            border-top: 1px solid #E8E1D2 !important;
            padding: 16px 20px !important;
            gap: 12px !important;
            z-index: 100 !important;
            box-shadow: 0 -4px 16px rgba(43, 45, 42, 0.06) !important;
            align-items: center !important;
          }

          .settings-mobile-sticky-bar .settings-btn-secondary {
            flex: 1 !important;
            height: 48px !important;
          }

          .settings-mobile-sticky-bar .settings-btn-primary {
            flex: 1.4 !important;
            height: 48px !important;
          }
        }
      `}</style>
    </div>
  );
}
