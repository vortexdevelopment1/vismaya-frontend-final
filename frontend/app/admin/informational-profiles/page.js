"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Plus,
  Loader2,
  Edit,
  Archive,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import Modal from "@/components/shared/Modal";
import { adminService } from "@/lib/api/services/adminService";
import { mediaService } from "@/lib/api/services/mediaService";
import { isRealMode } from "@/lib/api/config";

const INITIAL_FORM_DATA = {
  stageName: "",
  firstName: "",
  lastName: "",
  primaryProfession: "Actor",
  category: "open_talent",
  headline: "",
  bio: "",
  profilePhoto: "",
  currentCity: "Mumbai",
  currentState: "Maharashtra",
  country: "India",
  notableCredits: "",
  isClaimable: true,
};

export default function InformationalProfilesPage() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("active"); // "active" | "archived"
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Form state
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async (tabToLoad = activeTab) => {
    if (isRealMode("admin")) {
      try {
        setLoading(true);
        const res = await adminService.getInformationalProfiles({ status: tabToLoad });
        const items = res?.profiles || res?.data || [];
        setProfiles(Array.isArray(items) ? items : []);
      } catch (err) {
        console.error("Error loading informational profiles:", err);
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    } else {
      setProfiles([]);
    }
  };

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM_DATA);
    setShowModal(true);
  };

  const handleOpenEdit = (profile) => {
    setEditingId(profile._id || profile.id);
    const creditsStr = Array.isArray(profile.credits)
      ? profile.credits.map((c) => c.projectTitle || c.title || "").filter(Boolean).join(", ")
      : typeof profile.notableCredits === "string"
      ? profile.notableCredits
      : "";

    setFormData({
      stageName: profile.stageName || "",
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      primaryProfession: profile.primaryProfession || "Actor",
      category: profile.category || "open_talent",
      headline: profile.headline || "",
      bio: profile.bio || "",
      profilePhoto: profile.profilePhoto || "",
      currentCity: profile.currentCity || "Mumbai",
      currentState: profile.currentState || "Maharashtra",
      country: profile.country || "India",
      notableCredits: creditsStr,
      isClaimable: profile.isClaimable !== false,
    });
    setShowModal(true);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showToast("Only JPG, PNG, and WebP images are supported.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Photo must be less than 5 MB.");
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const res = await mediaService.uploadFile(file, { folder: "vismaya/profiles" });
      const photoUrl = res?.url || res?.data?.url || res?.secure_url;
      if (photoUrl) {
        setFormData((prev) => ({ ...prev, profilePhoto: photoUrl }));
        showToast("Photo uploaded successfully.");
      } else {
        showToast("Failed to retrieve uploaded photo URL.");
      }
    } catch (err) {
      console.error("Photo upload failed:", err);
      showToast(err?.message || "Failed to upload photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.stageName.trim() && !formData.firstName.trim()) {
      showToast("Stage Name or First Name is required");
      return;
    }

    if (!formData.primaryProfession.trim()) {
      showToast("Primary Profession is required");
      return;
    }

    const payload = {
      ...formData,
      notableCredits: formData.notableCredits
        ? formData.notableCredits
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean)
            .map((title) => ({ projectTitle: title, roleOrDesignation: formData.primaryProfession }))
        : [],
    };

    try {
      setIsSubmitting(true);
      if (editingId) {
        const res = await adminService.updateInformationalProfile(editingId, payload);
        if (res?.success || res?.profile) {
          showToast(`Profile for '${formData.stageName || formData.firstName}' updated successfully.`);
          setShowModal(false);
          loadData();
        } else {
          showToast(res?.message || "Failed to update profile.");
        }
      } else {
        const res = await adminService.createInformationalProfile(payload);
        if (res?.success || res?.profile) {
          showToast(`Informational profile for '${formData.stageName || formData.firstName}' created successfully.`);
          setShowModal(false);
          loadData();
        } else {
          showToast(res?.message || "Failed to create profile.");
        }
      }
    } catch (err) {
      console.error("Form submit error:", err);
      showToast(err?.response?.data?.message || err?.message || "Failed to save profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (id, name) => {
    try {
      setActionLoadingId(id);
      const res = await adminService.archiveInformationalProfile(id);
      if (res?.success) {
        showToast(`'${name}' archived.`);
        loadData();
      } else {
        showToast(res?.message || "Failed to archive profile.");
      }
    } catch (err) {
      console.error("Archive error:", err);
      showToast(err?.response?.data?.message || err?.message || "Failed to archive profile.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRestore = async (id, name) => {
    try {
      setActionLoadingId(id);
      const res = await adminService.restoreInformationalProfile(id);
      if (res?.success) {
        showToast(`'${name}' restored.`);
        loadData();
      } else {
        showToast(res?.message || "Failed to restore profile.");
      }
    } catch (err) {
      console.error("Restore error:", err);
      showToast(err?.response?.data?.message || err?.message || "Failed to restore profile.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "#2B2D2A",
            color: "#FFFFFF",
            padding: "12px 20px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 600,
            zIndex: 1000,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Vismaya-Created Informational Profiles"
        subtitle="Curate profiles for notable artists to seed discovery. Excluded from talent search until claimed."
        action={
          <button
            type="button"
            onClick={handleOpenCreate}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              background: "#8A6B2E",
              color: "#FFFFFF",
              border: "none",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus size={16} /> Create Informational Profile
          </button>
        }
      />

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid #E8E2D4",
          paddingBottom: "8px",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("active")}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            background: activeTab === "active" ? "#8A6B2E" : "transparent",
            color: activeTab === "active" ? "#FFFFFF" : "#5A584F",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          Active Profiles
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("archived")}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            background: activeTab === "archived" ? "#8A6B2E" : "transparent",
            color: activeTab === "archived" ? "#FFFFFF" : "#5A584F",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          Archived Profiles
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <Loader2 size={32} style={{ color: "#8A6B2E", animation: "spin 1s linear infinite" }} />
        </div>
      ) : profiles.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
          {profiles.map((p) => {
            const displayName = p.stageName || `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Notable Talent";
            const initial = displayName.charAt(0).toUpperCase();

            return (
              <div
                key={p._id || p.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E8E2D4",
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  boxShadow: "0 2px 4px rgba(43,45,42,0.04)",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  {p.profilePhoto ? (
                    <img
                      src={p.profilePhoto}
                      alt={displayName}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fb = e.currentTarget.nextElementSibling;
                        if (fb) fb.style.display = "flex";
                      }}
                      style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "10px",
                        objectFit: "cover",
                        border: "1px solid #E8E2D4",
                        flexShrink: 0,
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "10px",
                      background: "#F5EFE1",
                      color: "#8A6B2E",
                      display: p.profilePhoto ? "none" : "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "18px",
                      border: "1px solid #E8E2D4",
                      flexShrink: 0,
                    }}
                  >
                    {initial}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#2B2D2A" }}>
                      {displayName}
                    </h3>
                    <div style={{ fontSize: "12.5px", color: "#5A584F", marginTop: "2px" }}>
                      {p.primaryProfession} · {p.currentCity || "Mumbai"}, {p.currentState || "Maharashtra"}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: p.isArchived ? "#D93838" : p.isClaimable !== false ? "#8A6B2E" : "#5A584F",
                      background: p.isArchived ? "#FEECEC" : p.isClaimable !== false ? "#F5EFE1" : "#E8E2D4",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      flexShrink: 0,
                    }}
                  >
                    {p.isArchived ? "ARCHIVED" : p.isClaimable !== false ? "CLAIMABLE" : "INDEXED"}
                  </span>
                </div>

                {p.headline && (
                  <p style={{ margin: 0, fontSize: "13px", color: "#4A483F", fontStyle: "italic" }}>
                    "{p.headline}"
                  </p>
                )}

                {p.bio && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      color: "#6A685F",
                      lineHeight: 1.5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {p.bio}
                  </p>
                )}

                {/* Actions Row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: "auto",
                    paddingTop: "12px",
                    borderTop: "1px solid #F0EEEA",
                  }}
                >
                  <span style={{ fontSize: "11px", color: "#8A877E" }}>
                    Created:{" "}
                    {new Date(p.createdAt || Date.now()).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid #E8E2D4",
                        background: "#FAF9F6",
                        color: "#2B2D2A",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <Edit size={13} /> Edit
                    </button>

                    {activeTab === "active" ? (
                      <button
                        type="button"
                        disabled={actionLoadingId === (p._id || p.id)}
                        onClick={() => handleArchive(p._id || p.id, displayName)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: "1px solid #E8E2D4",
                          background: "#FAF9F6",
                          color: "#D93838",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {actionLoadingId === (p._id || p.id) ? (
                          <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                        ) : (
                          <Archive size={13} />
                        )}
                        Archive
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={actionLoadingId === (p._id || p.id)}
                        onClick={() => handleRestore(p._id || p.id, displayName)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: "1px solid #8A6B2E",
                          background: "#F5EFE1",
                          color: "#8A6B2E",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {actionLoadingId === (p._id || p.id) ? (
                          <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                        ) : (
                          <RotateCcw size={13} />
                        )}
                        Restore
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={UserCheck}
          title={activeTab === "active" ? "No Active Informational Profiles" : "No Archived Informational Profiles"}
          description={
            activeTab === "active"
              ? "Create informational profiles to index industry talents and allow them to claim verified profiles later."
              : "Archived informational profiles will appear here. They are hidden from active directory and admin lists."
          }
          actionLabel="+ Create Informational Profile"
          onAction={handleOpenCreate}
        />
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingId ? "Edit Informational Profile" : "Create Informational Talent Profile"}
          subtitle="Curate claimable talent profiles for notable artists."
          maxWidth="600px"
        >
          <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>Stage Name *</label>
                <input
                  type="text"
                  required
                  value={formData.stageName}
                  onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                  placeholder="E.g. Nawazuddin Siddiqui"
                  style={{ height: "40px", border: "1px solid #E8E2D4", borderRadius: "8px", padding: "0 12px", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>Primary Profession *</label>
                <select
                  value={formData.primaryProfession}
                  onChange={(e) => setFormData({ ...formData, primaryProfession: e.target.value })}
                  style={{ height: "40px", border: "1px solid #E8E2D4", borderRadius: "8px", padding: "0 8px", fontSize: "13px" }}
                >
                  <option value="Actor">Actor</option>
                  <option value="Voice Artist">Voice Artist</option>
                  <option value="Model">Model</option>
                  <option value="Director">Director</option>
                  <option value="Cinematographer">Cinematographer</option>
                  <option value="Dancer">Dancer</option>
                  <option value="Writer">Writer</option>
                  <option value="Producer">Producer</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>First Name (optional)</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="First name"
                  style={{ height: "40px", border: "1px solid #E8E2D4", borderRadius: "8px", padding: "0 12px", fontSize: "13px" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>Last Name (optional)</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Last name"
                  style={{ height: "40px", border: "1px solid #E8E2D4", borderRadius: "8px", padding: "0 12px", fontSize: "13px" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ height: "40px", border: "1px solid #E8E2D4", borderRadius: "8px", padding: "0 8px", fontSize: "13px" }}
                >
                  <option value="open_talent">Open Talent</option>
                  <option value="film_and_tv">Film & Television</option>
                  <option value="voice_over">Voice Over</option>
                  <option value="dance_and_performing_arts">Dance & Performing Arts</option>
                  <option value="crew_and_production">Crew & Production</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>Location (City, State)</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <input
                    type="text"
                    value={formData.currentCity}
                    onChange={(e) => setFormData({ ...formData, currentCity: e.target.value })}
                    placeholder="City"
                    style={{ height: "40px", border: "1px solid #E8E2D4", borderRadius: "8px", padding: "0 10px", fontSize: "13px" }}
                  />
                  <input
                    type="text"
                    value={formData.currentState}
                    onChange={(e) => setFormData({ ...formData, currentState: e.target.value })}
                    placeholder="State"
                    style={{ height: "40px", border: "1px solid #E8E2D4", borderRadius: "8px", padding: "0 10px", fontSize: "13px" }}
                  />
                </div>
              </div>
            </div>

            {/* Photo Upload & URL */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>Profile Photo (Upload or URL)</label>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "10px",
                    backgroundColor: "#FAF9F6",
                    border: "1px dashed #C8C2B4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {isUploadingPhoto ? (
                    <Loader2 size={18} style={{ color: "#8A6B2E", animation: "spin 1s linear infinite" }} />
                  ) : formData.profilePhoto ? (
                    <img src={formData.profilePhoto} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <ImageIcon size={20} color="#8A877E" />
                  )}
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <label
                      style={{
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #E8E2D4",
                        background: "#FAF9F6",
                        color: "#2B2D2A",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: isUploadingPhoto ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Upload size={13} /> {isUploadingPhoto ? "Uploading..." : "Upload Image"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoUpload}
                        disabled={isUploadingPhoto}
                        style={{ display: "none" }}
                      />
                    </label>
                    <span style={{ fontSize: "11px", color: "#8A877E", alignSelf: "center" }}>JPG/PNG/WebP, max 5MB</span>
                  </div>

                  <input
                    type="url"
                    value={formData.profilePhoto}
                    onChange={(e) => setFormData({ ...formData, profilePhoto: e.target.value })}
                    placeholder="Or paste image URL (https://...)"
                    style={{ height: "36px", border: "1px solid #E8E2D4", borderRadius: "6px", padding: "0 10px", fontSize: "12px" }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>Headline</label>
              <input
                type="text"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                placeholder="E.g. Method Actor & National Award Winner"
                style={{ height: "40px", border: "1px solid #E8E2D4", borderRadius: "8px", padding: "0 12px", fontSize: "13px" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>Bio / Career Background</label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Brief editorial biography or notable career summary..."
                style={{ border: "1px solid #E8E2D4", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>Notable Project Credits (comma-separated)</label>
              <input
                type="text"
                value={formData.notableCredits}
                onChange={(e) => setFormData({ ...formData, notableCredits: e.target.value })}
                placeholder="E.g. Gangs of Wasseypur, Sacred Games, The Lunchbox"
                style={{ height: "40px", border: "1px solid #E8E2D4", borderRadius: "8px", padding: "0 12px", fontSize: "13px" }}
              />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#2B2D2A", cursor: "pointer", marginTop: "4px" }}>
              <input
                type="checkbox"
                checked={formData.isClaimable}
                onChange={(e) => setFormData({ ...formData, isClaimable: e.target.checked })}
              />
              Allow verified talent to claim this profile in the future (isClaimable)
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #E8E2D4", background: "#FFFFFF", fontSize: "13px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isUploadingPhoto}
                style={{
                  padding: "8px 22px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#8A6B2E",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {isSubmitting && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                {editingId ? "Update Profile" : "Create Profile"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
