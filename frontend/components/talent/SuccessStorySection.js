"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Quote,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  Plus,
  EyeOff,
} from "lucide-react";
import Modal from "@/components/shared/Modal";
import { talentService } from "@/lib/api/services/talentService";
import { mediaService } from "@/lib/api/services/mediaService";
import { isRealMode } from "@/lib/api/config";

export default function SuccessStorySection({ profile, user }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const defaultPhoto = profile?.profilePhoto || profile?.avatar || "";
  const defaultRole = profile?.primaryProfession || profile?.primaryDesignation || "";

  const [formData, setFormData] = useState({
    quote: "",
    roleOrProfession: defaultRole,
    projectName: "",
    organizationName: "",
    photoUrl: defaultPhoto,
    externalSharingConsent: false,
  });

  const loadMyStories = async () => {
    try {
      setLoading(true);
      const res = await talentService.getMySuccessStories();
      const list = res?.stories || res?.data || [];
      setStories(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load talent success stories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyStories();
  }, []);

  useEffect(() => {
    if (defaultPhoto && !formData.photoUrl) {
      setFormData((prev) => ({ ...prev, photoUrl: defaultPhoto }));
    }
    if (defaultRole && !formData.roleOrProfession) {
      setFormData((prev) => ({ ...prev, roleOrProfession: defaultRole }));
    }
  }, [defaultPhoto, defaultRole]);

  const handleOpenModal = () => {
    setErrorMessage("");
    setSuccessMessage("");
    setFormData({
      quote: "",
      roleOrProfession: profile?.primaryProfession || profile?.primaryDesignation || "",
      projectName: "",
      organizationName: "",
      photoUrl: profile?.profilePhoto || profile?.avatar || "",
      externalSharingConsent: false,
    });
    setShowModal(true);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("Please upload an image file in JPG, PNG, or WebP format.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Photo size must be under 5 MB.");
      return;
    }

    setUploadingPhoto(true);
    setErrorMessage("");
    try {
      const res = await mediaService.uploadFile(file, { folder: "vismaya/stories" });
      const uploadedUrl = res?.url || res?.data?.url || (typeof res === "string" ? res : "");
      if (uploadedUrl) {
        setFormData((prev) => ({ ...prev, photoUrl: uploadedUrl }));
      } else {
        throw new Error("Could not extract uploaded image URL");
      }
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || err?.message || "Failed to upload photo. You can still use your profile photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const quoteLen = (formData.quote || "").trim().length;
    if (quoteLen < 20 || quoteLen > 300) {
      setErrorMessage("Quote must be between 20 and 300 characters long.");
      return;
    }

    if (!formData.roleOrProfession?.trim()) {
      setErrorMessage("Role or profession is required.");
      return;
    }

    if (!formData.photoUrl) {
      setErrorMessage("A photo is required for your success story testimonial.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await talentService.submitSuccessStory(formData);
      if (res?.success) {
        setSuccessMessage("Your success story has been submitted for editorial review! Once approved, it will appear in public showcases.");
        loadMyStories();
        setTimeout(() => {
          setShowModal(false);
          setSuccessMessage("");
        }, 2200);
      } else {
        throw new Error(res?.message || "Failed to submit story");
      }
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || err?.message || "Failed to submit success story");
    } finally {
      setSubmitting(false);
    }
  };

  const hasPendingStory = stories.some((s) => s.status === "pending");

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E8E2D4",
        borderRadius: "18px",
        padding: "clamp(20px, 3vw, 28px)",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06)",
        position: "relative",
      }}
    >
      {/* Header Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: "260px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "rgba(138, 107, 46, 0.12)",
                color: "#8A6B2E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={18} />
            </div>
            <h2
              style={{
                fontFamily: "var(--font-heading), 'Playfair Display', serif",
                fontSize: "19px",
                fontWeight: 700,
                color: "#2B2D2A",
                margin: 0,
              }}
            >
              Share Your Casting Success Story
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: "13.5px", color: "#5A584F", lineHeight: 1.5 }}>
            Did Vismaya connect you with a casting director or role? Share your milestone to be featured on our landing page and public showcases per Spec §42.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          disabled={hasPendingStory}
          title={hasPendingStory ? "You already have a story pending review" : "Share your story"}
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            backgroundColor: hasPendingStory ? "#E8E2D4" : "#8A6B2E",
            color: hasPendingStory ? "#8A877E" : "#FFFFFF",
            border: "none",
            fontSize: "13.5px",
            fontWeight: 700,
            cursor: hasPendingStory ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.16s ease",
            boxShadow: hasPendingStory ? "none" : "0 2px 8px rgba(138, 107, 46, 0.25)",
          }}
        >
          <Plus size={16} />
          <span>{hasPendingStory ? "Story Pending Review" : "Share Your Story"}</span>
        </button>
      </div>

      {/* Stories List */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
          <Loader2 size={24} style={{ color: "#8A6B2E", animation: "spin 1s linear infinite" }} />
        </div>
      ) : stories.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid #F0EEEA", paddingTop: "16px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8A877E" }}>
            Your Submitted Stories ({stories.length})
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
            {stories.map((s) => {
              const isApproved = s.status === "approved";
              const isRejected = s.status === "rejected";
              const isPending = s.status === "pending";
              const isUnpublished = s.status === "unpublished";

              return (
                <div
                  key={s._id}
                  style={{
                    backgroundColor: "#FAF9F7",
                    border: "1px solid #E8E2D4",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      {s.photoUrl && (
                        <img
                          src={s.photoUrl}
                          alt={s.talentName}
                          style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover" }}
                        />
                      )}
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#2B2D2A" }}>
                          {s.projectName || s.roleOrProfession || "Success Story"}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#8A877E" }}>
                          {s.roleOrProfession} {s.organizationName ? `· ${s.organizationName}` : ""}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        backgroundColor: isApproved ? "#EBF5ED" : isRejected ? "#FDF2F2" : isUnpublished ? "#F0EEEA" : "#F5EFE1",
                        color: isApproved ? "#2B5E3B" : isRejected ? "#D9534F" : isUnpublished ? "#5A584F" : "#8A6B2E",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {isApproved && <CheckCircle size={11} />}
                      {isPending && <Clock size={11} />}
                      {isRejected && <XCircle size={11} />}
                      {isUnpublished && <EyeOff size={11} />}
                      {isApproved ? "Approved & Live" : isRejected ? "Rejected" : isUnpublished ? "Unpublished" : "In Review"}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: "12.5px", color: "#4A483F", lineHeight: 1.5, fontStyle: "italic" }}>
                    "{s.quote}"
                  </p>

                  {isRejected && s.rejectionReason && (
                    <div
                      style={{
                        backgroundColor: "#FFF5F5",
                        border: "1px solid #FED7D7",
                        borderRadius: "8px",
                        padding: "8px 10px",
                        fontSize: "12px",
                        color: "#C53030",
                        display: "flex",
                        gap: "6px",
                        alignItems: "flex-start",
                      }}
                    >
                      <AlertCircle size={14} style={{ flexShrink: 0, marginTop: "2px" }} />
                      <div>
                        <strong>Editorial Feedback:</strong> {s.rejectionReason}
                      </div>
                    </div>
                  )}

                  {isUnpublished && (s.unpublishReason || s.rejectionReason) && (
                    <div
                      style={{
                        backgroundColor: "#FAF9F7",
                        border: "1px solid #E8E2D4",
                        borderRadius: "8px",
                        padding: "8px 10px",
                        fontSize: "12px",
                        color: "#5A584F",
                        display: "flex",
                        gap: "6px",
                        alignItems: "flex-start",
                      }}
                    >
                      <AlertCircle size={14} style={{ flexShrink: 0, marginTop: "2px", color: "#8A6B2E" }} />
                      <div>
                        <strong style={{ color: "#2B2D2A" }}>Unpublished Reason:</strong> {s.unpublishReason || s.rejectionReason}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Submission Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            if (!submitting) setShowModal(false);
          }}
          title="Share Your Casting Success Story"
          subtitle="Tell the Vismaya community how your profile or audition led to your recent casting milestone."
          maxWidth="560px"
        >
          <div
            style={{
              fontSize: "12.5px",
              color: "#5A584F",
              lineHeight: 1.5,
              padding: "10px 14px",
              backgroundColor: "#FAF9F7",
              borderRadius: "10px",
              border: "1px solid #E8E2D4",
              marginBottom: "16px",
            }}
          >
            Approved stories may appear on the Vismaya website as covered by the registration terms.
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {errorMessage && (
              <div
                style={{
                  backgroundColor: "#FFF5F5",
                  border: "1px solid #FED7D7",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "#C53030",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div
                style={{
                  backgroundColor: "#EBF5ED",
                  border: "1px solid #C6E6CC",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "#2B5E3B",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <CheckCircle size={16} style={{ flexShrink: 0 }} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Quote (required, 20-300 chars, counter) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "13px", fontWeight: 700, color: "#2B2D2A" }}>
                  Your Testimonial Quote *
                </label>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: formData.quote.trim().length < 20 || formData.quote.trim().length > 300 ? "#D9534F" : "#8A877E",
                  }}
                >
                  {formData.quote.trim().length} / 300 chars (min 20)
                </span>
              </div>
              <textarea
                required
                rows={4}
                value={formData.quote}
                onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                placeholder="Describe your breakthrough: the role, how the director contacted you, or your casting experience..."
                style={{
                  width: "100%",
                  border: "1px solid #E8E2D4",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  fontSize: "13.5px",
                  lineHeight: 1.5,
                  resize: "vertical",
                  outline: "none",
                }}
              />
            </div>

            {/* Role & Profession (required) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 700, color: "#2B2D2A" }}>
                  Role or Profession *
                </label>
                <input
                  type="text"
                  required
                  value={formData.roleOrProfession}
                  onChange={(e) => setFormData({ ...formData, roleOrProfession: e.target.value })}
                  placeholder="E.g. Lead Protagonist, Voice Artist"
                  style={{
                    height: "40px",
                    border: "1px solid #E8E2D4",
                    borderRadius: "8px",
                    padding: "0 12px",
                    fontSize: "13px",
                  }}
                />
              </div>

              {/* Project Name (optional) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 700, color: "#2B2D2A" }}>
                  Project Name (optional)
                </label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  placeholder="E.g. Shadows in the Mist"
                  style={{
                    height: "40px",
                    border: "1px solid #E8E2D4",
                    borderRadius: "8px",
                    padding: "0 12px",
                    fontSize: "13px",
                  }}
                />
              </div>
            </div>

            {/* Organization Name (optional) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#2B2D2A" }}>
                Production House / Studio (optional)
              </label>
              <input
                type="text"
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                placeholder="E.g. Zee Studios, Dharma Productions"
                style={{
                  height: "40px",
                  border: "1px solid #E8E2D4",
                  borderRadius: "8px",
                  padding: "0 12px",
                  fontSize: "13px",
                }}
              />
            </div>

            {/* Photo Selection & Upload */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#2B2D2A" }}>
                Featured Photo *
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "12px",
                  backgroundColor: "#FAF9F7",
                  border: "1px solid #E8E2D4",
                  borderRadius: "10px",
                }}
              >
                {formData.photoUrl ? (
                  <img
                    src={formData.photoUrl}
                    alt="Preview"
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "10px",
                      objectFit: "cover",
                      border: "1px solid #E8E2D4",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "10px",
                      backgroundColor: "#F0EEEA",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#8A877E",
                      flexShrink: 0,
                    }}
                  >
                    <Upload size={20} />
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12.5px", color: "#5A584F", marginBottom: "6px" }}>
                    {formData.photoUrl === defaultPhoto && defaultPhoto
                      ? "Using your current verified profile photo"
                      : "Custom photo selected"}
                  </div>
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #D6D0C2",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#2B2D2A",
                      cursor: uploadingPhoto ? "not-allowed" : "pointer",
                    }}
                  >
                    {uploadingPhoto ? (
                      <>
                        <Loader2 size={13} className="animate-spin" /> Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={13} /> Upload New Photo (Max 5MB)
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Consent Checkbox (OPTIONAL for social/external sharing) */}
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "10px 12px",
                backgroundColor: "#FDFCFB",
                border: "1px solid #E8E2D4",
                borderRadius: "10px",
                fontSize: "12.5px",
                color: "#2B2D2A",
                cursor: "pointer",
                lineHeight: 1.5,
              }}
            >
              <input
                type="checkbox"
                checked={!!formData.externalSharingConsent}
                onChange={(e) => setFormData({ ...formData, externalSharingConsent: e.target.checked })}
                style={{ marginTop: "3px" }}
              />
              <span>
                I also allow Vismaya to share my story and photo on social media and other external channels.
              </span>
            </label>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={submitting}
                style={{
                  padding: "9px 18px",
                  borderRadius: "8px",
                  border: "1px solid #E8E2D4",
                  backgroundColor: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting || uploadingPhoto || formData.quote.trim().length < 20}
                style={{
                  padding: "9px 22px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#8A6B2E",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: submitting || formData.quote.trim().length < 20 ? "not-allowed" : "pointer",
                  opacity: submitting || formData.quote.trim().length < 20 ? 0.7 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  <>Submit for Editorial Review</>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
