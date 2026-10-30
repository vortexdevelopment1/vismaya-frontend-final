"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Camera,
  Trash2,
  Save,
  CheckCircle2,
  Lock,
  Loader2,
  AlertCircle,
  BadgeCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/lib/api/services/adminService";
import { useAdmin } from "@/lib/admin/AdminContext";

export default function AdminProfilePage() {
  const { user, updateUser } = useAuth();
  const { addToast } = useAdmin();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [avatar, setAvatar] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef(null);

  // Load initial profile details from AuthContext or adminService
  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setIsLoading(true);
      try {
        const res = await adminService.getAdminProfile();
        const profile = res?.profile || res?.data || user || {};

        if (mounted) {
          setName(profile.name || user?.name || "Super Admin");
          setEmail(profile.email || user?.email || "vortexcubesdevelopment@gmail.com");
          setMobile(profile.mobile || user?.mobile || "+919876543210");
          setAvatar(profile.avatar || user?.avatar || null);
        }
      } catch (err) {
        console.warn("Failed to fetch fresh admin profile:", err);
        if (mounted && user) {
          setName(user.name || "Super Admin");
          setEmail(user.email || "vortexcubesdevelopment@gmail.com");
          setMobile(user.mobile || "+919876543210");
          setAvatar(user.avatar || null);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [user]);

  // Handle Photo File Upload & Compression
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage("Image file size must be less than 3MB.");
      return;
    }

    setErrorMessage("");

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to a maximum of 400x400 for snappy performance and low storage
        const canvas = document.createElement("canvas");
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setAvatar(compressedDataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Delete / Remove Profile Photo
  const handleDeletePhoto = async () => {
    setIsDeletingPhoto(true);
    setErrorMessage("");
    try {
      setAvatar(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Persist the removal immediately
      await adminService.updateAdminProfile({ avatar: null });
      if (typeof updateUser === "function") {
        updateUser({ avatar: null });
      }

      if (typeof addToast === "function") {
        addToast("Profile photo removed successfully", "info");
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to remove photo.");
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  // Save Name and Details
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Please enter an administrator name.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSaveSuccess(false);

    try {
      const payload = {
        name: name.trim(),
        avatar: avatar || null,
        mobile: mobile.trim(),
      };

      const res = await adminService.updateAdminProfile(payload);

      if (res && res.success === false) {
        throw new Error(res.message || "Could not save profile changes.");
      }

      // Sync with global AuthContext immediately so Topbar and Sidebar update
      if (typeof updateUser === "function") {
        updateUser(payload);
      }

      setSaveSuccess(true);
      if (typeof addToast === "function") {
        addToast("Admin profile updated successfully", "success");
      }

      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } catch (err) {
      setErrorMessage(err.message || "Failed to save profile changes.");
    } finally {
      setIsSaving(false);
    }
  };

  // Computed initials for avatar placeholder
  const getInitials = (str) => {
    if (!str) return "SA";
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "420px",
          gap: "12px",
          color: "#5A584F",
        }}
      >
        <Loader2 size={32} className="spin-animation" style={{ color: "#8A6B2E" }} />
        <span style={{ fontSize: "14px", fontWeight: "500" }}>Loading admin profile...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", width: "100%", paddingBottom: "48px" }}>
      {/* Header section */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <h1
            style={{
              fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
              fontSize: "clamp(24px, 3vw, 30px)",
              fontWeight: 700,
              color: "#2B2D2A",
              margin: 0,
            }}
          >
            Admin Profile
          </h1>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "999px",
              backgroundColor: "#F3EFE6",
              color: "#8A6B2E",
              border: "1px solid #E8E2D4",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={14} />
            Super Administrator
          </span>
        </div>
        <p style={{ margin: 0, color: "#5A584F", fontSize: "14px", lineHeight: 1.5 }}>
          Manage your system administrator account, photo avatar, and contact credentials.
        </p>
      </div>

      {/* Main Profile Form Card */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "14px",
          border: "1px solid #E8E2D4",
          boxShadow: "0 4px 20px rgba(43, 45, 42, 0.04)",
          padding: "clamp(20px, 3.5vw, 36px)",
          boxSizing: "border-box",
        }}
      >
        {/* Top Photo & Identity Section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            paddingBottom: "28px",
            borderBottom: "1px solid #F3EFE6",
            flexWrap: "wrap",
          }}
        >
          {/* Avatar Container */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: "96px",
                height: "96px",
                borderRadius: "50%",
                backgroundColor: "#F3EFE6",
                border: "2px solid #8A6B2E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                boxShadow: "0 4px 14px rgba(138, 107, 46, 0.16)",
                position: "relative",
              }}
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt={name || "Admin"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span
                  style={{
                    fontFamily: "var(--font-heading), 'Playfair Display', serif",
                    fontSize: "32px",
                    fontWeight: 700,
                    color: "#8A6B2E",
                    letterSpacing: "1px",
                  }}
                >
                  {getInitials(name)}
                </span>
              )}
            </div>

            {/* Quick change camera trigger */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload new photo"
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "#8A6B2E",
                color: "#FFFFFF",
                border: "2px solid #FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
                transition: "transform 0.15s ease, background-color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#6E5420")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#8A6B2E")}
            >
              <Camera size={15} />
            </button>
          </div>

          {/* Photo Actions & Text */}
          <div style={{ flex: 1, minWidth: "220px" }}>
            <h3
              style={{
                margin: "0 0 4px 0",
                fontSize: "18px",
                fontWeight: 600,
                color: "#2B2D2A",
              }}
            >
              {name || "Administrator"}
            </h3>
            <p style={{ margin: "0 0 14px 0", fontSize: "13px", color: "#5A584F" }}>
              Upload a profile photo (JPG, PNG or WebP under 3MB).
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                style={{ display: "none" }}
                onChange={handlePhotoSelect}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  backgroundColor: "#8A6B2E",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#6E5420")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#8A6B2E")}
              >
                <Camera size={14} />
                Change Photo
              </button>

              {avatar && (
                <button
                  type="button"
                  onClick={handleDeletePhoto}
                  disabled={isDeletingPhoto}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 14px",
                    borderRadius: "8px",
                    backgroundColor: "#FFF5F5",
                    color: "#BA3C3C",
                    border: "1px solid #F5C6C6",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: isDeletingPhoto ? "not-allowed" : "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isDeletingPhoto) e.currentTarget.style.backgroundColor = "#FFEBEB";
                  }}
                  onMouseLeave={(e) => {
                    if (!isDeletingPhoto) e.currentTarget.style.backgroundColor = "#FFF5F5";
                  }}
                >
                  <Trash2 size={14} />
                  {isDeletingPhoto ? "Removing..." : "Delete Photo"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div
            style={{
              marginTop: "20px",
              padding: "12px 16px",
              borderRadius: "8px",
              backgroundColor: "#FFF5F5",
              border: "1px solid #F5C6C6",
              color: "#BA3C3C",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {saveSuccess && (
          <div
            style={{
              marginTop: "20px",
              padding: "12px 16px",
              borderRadius: "8px",
              backgroundColor: "#F0F9F1",
              border: "1px solid #C8E6C9",
              color: "#2E7D32",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CheckCircle2 size={16} />
            <span>Admin profile updated successfully!</span>
          </div>
        )}

        {/* Editable Form Section */}
        <form onSubmit={handleSaveProfile} style={{ marginTop: "24px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
            {/* 1. Name Field (Editable) */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#2B2D2A",
                  marginBottom: "8px",
                }}
              >
                Administrator Name <span style={{ color: "#BA3C3C" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#8A887E",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <User size={16} />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter administrator name"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px 10px 38px",
                    fontSize: "14px",
                    borderRadius: "8px",
                    border: "1px solid #E8E2D4",
                    backgroundColor: "#FAF9F7",
                    color: "#2B2D2A",
                    boxSizing: "border-box",
                    outline: "none",
                    transition: "border-color 0.15s ease",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#8A6B2E")}
                  onBlur={(e) => (e.target.style.borderColor = "#E8E2D4")}
                />
              </div>
            </div>

            {/* 2. Mobile Number (View & Edit) */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#2B2D2A",
                  marginBottom: "8px",
                }}
              >
                Mobile Number
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#8A887E",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Phone size={16} />
                </span>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+919876543210"
                  style={{
                    width: "100%",
                    padding: "10px 14px 10px 38px",
                    fontSize: "14px",
                    borderRadius: "8px",
                    border: "1px solid #E8E2D4",
                    backgroundColor: "#FAF9F7",
                    color: "#2B2D2A",
                    boxSizing: "border-box",
                    outline: "none",
                    transition: "border-color 0.15s ease",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#8A6B2E")}
                  onBlur={(e) => (e.target.style.borderColor = "#E8E2D4")}
                />
              </div>
            </div>

            {/* 3. Email Address (Information Display - Read-only) */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#2B2D2A",
                  }}
                >
                  Registered Email
                </label>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#8A6B2E",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                  }}
                >
                  <Lock size={12} /> Root Protected
                </span>
              </div>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#8A887E",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  style={{
                    width: "100%",
                    padding: "10px 14px 10px 38px",
                    fontSize: "14px",
                    borderRadius: "8px",
                    border: "1px solid #E8E2D4",
                    backgroundColor: "#F3EFE6",
                    color: "#5A584F",
                    boxSizing: "border-box",
                    cursor: "not-allowed",
                  }}
                />
              </div>
              <span style={{ fontSize: "11.5px", color: "#8A887E", marginTop: "4px", display: "block" }}>
                System root email used for 2FA OTP codes and critical platform recovery alerts.
              </span>
            </div>

            {/* 4. Role & Access Level (Information Display) */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#2B2D2A",
                  marginBottom: "8px",
                }}
              >
                Access Role & Permissions
              </label>
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  backgroundColor: "#F3EFE6",
                  border: "1px solid #E8E2D4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <BadgeCheck size={18} style={{ color: "#8A6B2E" }} />
                  <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#2B2D2A" }}>
                    Super Admin (Level 0)
                  </span>
                </div>
                <span style={{ fontSize: "11.5px", color: "#6E5420", fontWeight: 600 }}>
                  Full Access
                </span>
              </div>
              <span style={{ fontSize: "11.5px", color: "#8A887E", marginTop: "4px", display: "block" }}>
                Unrestricted privileges across Moderation, Payments, Auditions, and System Audits.
              </span>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "12px",
              paddingTop: "20px",
              borderTop: "1px solid #F3EFE6",
            }}
          >
            <button
              type="submit"
              disabled={isSaving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 24px",
                borderRadius: "8px",
                backgroundColor: "#8A6B2E",
                color: "#FFFFFF",
                border: "none",
                fontSize: "14px",
                fontWeight: 600,
                cursor: isSaving ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(138, 107, 46, 0.24)",
                transition: "background-color 0.15s ease, transform 0.1s ease",
              }}
              onMouseEnter={(e) => {
                if (!isSaving) e.currentTarget.style.backgroundColor = "#6E5420";
              }}
              onMouseLeave={(e) => {
                if (!isSaving) e.currentTarget.style.backgroundColor = "#8A6B2E";
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="spin-animation" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
