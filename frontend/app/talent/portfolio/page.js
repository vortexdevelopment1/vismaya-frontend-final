"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Upload,
  Plus,
  Trash2,
  Edit2,
  Film,
  Play,
  Image as ImageIcon,
  AlertCircle,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  X,
  FileText,
} from "lucide-react";
import { useTalent } from "@/lib/talent/TalentContext";
import { optimizeCloudinaryUrl, MEDIA_LIMITS } from "@/lib/api/uploadMedia";
import Modal from "@/components/shared/Modal";

// Standard category options for portfolio items
const MEDIA_CATEGORIES = [
  { value: "headshot", label: "Headshot" },
  { value: "full_body", label: "Full Body / Comp Card" },
  { value: "showreel", label: "Showreel / Video" },
  { value: "audition", label: "Audition Self-Tape" },
  { value: "production_still", label: "Production Still" },
  { value: "lookbook", label: "Lookbook" },
  { value: "comp_card", label: "Comp Card" },
  { value: "other", label: "Other" },
];

export default function TalentPortfolioPage() {
  const {
    portfolio = [],
    addMedia,
    updateMedia,
    deleteMedia,
    refreshPortfolio,
    refreshProfile,
    addToast,
  } = useTalent();

  // Loading & error state
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Active category filter
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Add Item Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addCategory, setAddCategory] = useState("headshot");
  const [addVisibility, setAddVisibility] = useState("public");
  const [addFile, setAddFile] = useState(null);
  const [addError, setAddError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const addFileInputRef = useRef(null);

  // Edit Item Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("headshot");
  const [editVisibility, setEditVisibility] = useState("public");
  const [editError, setEditError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Confirmation Dialog state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Video Preview Modal state
  const [previewVideoUrl, setPreviewVideoUrl] = useState(null);
  const [previewVideoTitle, setPreviewVideoTitle] = useState("");

  // Load portfolio on mount
  const loadPortfolioData = async () => {
    setLoadError(null);
    setInitialLoading(true);
    try {
      if (typeof refreshPortfolio === "function") {
        await refreshPortfolio();
      }
    } catch (err) {
      setLoadError(err?.message || "Could not load portfolio items.");
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolioData();
  }, []);

  // Compute stats: total, approved, pending, rejected
  const stats = useMemo(() => {
    let approved = 0;
    let pending = 0;
    let rejected = 0;

    portfolio.forEach((item) => {
      const st = (item.status || item.moderationState || "approved").toLowerCase();
      if (st === "approved" || st === "live") {
        approved++;
      } else if (st === "pending" || st === "in_review" || st === "under-review") {
        pending++;
      } else if (st === "rejected" || st === "flagged") {
        rejected++;
      } else {
        approved++;
      }
    });

    return {
      total: portfolio.length,
      approved,
      pending,
      rejected,
    };
  }, [portfolio]);

  // Extract unique categories present in items + standard options
  const filterCategories = useMemo(() => {
    const categoriesSet = new Set();
    portfolio.forEach((item) => {
      const cat = (item.category || item.type || "other").toLowerCase();
      if (cat) categoriesSet.add(cat);
    });

    // Match labels
    const list = [{ key: "all", label: "All" }];
    MEDIA_CATEGORIES.forEach((catOpt) => {
      if (categoriesSet.has(catOpt.value.toLowerCase())) {
        list.push({ key: catOpt.value, label: catOpt.label.split("/")[0].trim() });
        categoriesSet.delete(catOpt.value.toLowerCase());
      }
    });

    // Any remaining custom categories
    categoriesSet.forEach((c) => {
      list.push({
        key: c,
        label: c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, " "),
      });
    });

    return list;
  }, [portfolio]);

  // Filtered portfolio list
  const filteredItems = useMemo(() => {
    if (selectedCategory === "all") return portfolio;
    return portfolio.filter((item) => {
      const cat = (item.category || item.type || "other").toLowerCase();
      return cat === selectedCategory.toLowerCase();
    });
  }, [portfolio, selectedCategory]);

  // Handle Add Item Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddError("");

    if (!addFile) {
      setAddError("Please select an image or video file to upload.");
      return;
    }

    if (!addTitle.trim()) {
      setAddError("Please enter a title for this portfolio item.");
      return;
    }

    setIsUploading(true);
    try {
      const isVideo = addCategory === "showreel" || addCategory === "audition" || addFile.type?.startsWith("video/");
      await addMedia({
        file: addFile,
        title: addTitle.trim(),
        category: addCategory,
        visibility: addVisibility,
        type: isVideo ? "Showreel" : "Headshot",
      });

      // Refresh talent profile to recompute score if needed
      if (typeof refreshProfile === "function") {
        refreshProfile();
      }

      // Reset and close
      setIsAddModalOpen(false);
      setAddTitle("");
      setAddFile(null);
      setAddCategory("headshot");
      setAddVisibility("public");
      if (addFileInputRef.current) addFileInputRef.current.value = "";
    } catch (err) {
      setAddError(err?.message || "Failed to upload portfolio item. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditTitle(item.title || "");
    setEditCategory(item.category || (item.type === "Showreel" ? "showreel" : "headshot"));
    setEditVisibility(item.visibility || "public");
    setEditError("");
    setIsEditModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setEditError("");

    if (!editTitle.trim()) {
      setEditError("Title cannot be empty.");
      return;
    }

    setIsUpdating(true);
    try {
      const id = editingItem.id || editingItem._id;
      if (typeof updateMedia === "function") {
        await updateMedia(id, {
          title: editTitle.trim(),
          category: editCategory,
          visibility: editVisibility,
        });
      } else {
        throw new Error("Update media is not supported on this client.");
      }

      setIsEditModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      setEditError(err?.message || "Failed to update item.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const id = deleteTarget.id || deleteTarget._id;
      await deleteMedia(id);

      // Trigger profile refresh to keep score in sync
      if (typeof refreshProfile === "function") {
        refreshProfile();
      }

      setDeleteTarget(null);
    } catch (err) {
      // Toast is already fired inside deleteMedia
    } finally {
      setIsDeleting(false);
    }
  };

  const isVideoItem = (item) => {
    const t = (item.type || "").toLowerCase();
    const c = (item.category || "").toLowerCase();
    const m = (item.mediaType || "").toLowerCase();
    const u = (item.url || "").toLowerCase();
    return (
      t === "showreel" ||
      t === "video" ||
      c === "showreel" ||
      c === "audition" ||
      m === "video" ||
      u.endsWith(".mp4") ||
      u.endsWith(".mov") ||
      u.endsWith(".webm")
    );
  };

  return (
    <div className="portfolio-v2">
      {/* 1. Header & Breadcrumbs */}
      <div className="portfolio-header">
        <div className="portfolio-header-left">
          <nav aria-label="Breadcrumb" className="portfolio-breadcrumbs">
            <Link href="/talent/dashboard" className="breadcrumb-link">
              Talent Dashboard
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Portfolio</span>
          </nav>

          <h1 className="portfolio-title">Portfolio</h1>
          <p className="portfolio-description">
            Your headshots, showreels and comp cards. Casting teams see approved items.
          </p>
        </div>

        <div className="portfolio-header-right">
          <button
            type="button"
            className="btn-add-item"
            onClick={() => {
              setAddError("");
              setIsAddModalOpen(true);
            }}
          >
            <Upload size={18} />
            <span>Add item</span>
          </button>
        </div>
      </div>

      {/* 2. Summary Status Chips */}
      <div className="portfolio-summary-bar">
        <span className="summary-chip summary-chip-total">
          <strong>{stats.total}</strong> {stats.total === 1 ? "item" : "items"}
        </span>
        <span className="summary-chip summary-chip-approved">
          <CheckCircle2 size={13} />
          <strong>{stats.approved}</strong> approved
        </span>
        <span className="summary-chip summary-chip-pending">
          <Clock size={13} />
          <strong>{stats.pending}</strong> pending review
        </span>
        {stats.rejected > 0 && (
          <span className="summary-chip summary-chip-rejected">
            <XCircle size={13} />
            <strong>{stats.rejected}</strong> needs review
          </span>
        )}
      </div>

      {/* 3. Category Filter Chips */}
      {filterCategories.length > 1 && (
        <div className="portfolio-filters-wrap">
          <div className="portfolio-filters" role="tablist" aria-label="Media Categories">
            {filterCategories.map((cat) => {
              const active = selectedCategory.toLowerCase() === cat.key.toLowerCase();
              return (
                <button
                  key={cat.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`category-chip ${active ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat.key)}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Content Area: Loading, Error, Empty, or Grid */}
      {initialLoading ? (
        <div className="portfolio-grid">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="skeleton-card">
              <div className="skeleton-media" />
              <div className="skeleton-content">
                <div className="skeleton-line line-title" />
                <div className="skeleton-line line-meta" />
                <div className="skeleton-line line-actions" />
              </div>
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="portfolio-error-card">
          <div className="error-icon-box">
            <AlertCircle size={28} />
          </div>
          <h3 className="error-title">Could not load portfolio</h3>
          <p className="error-msg">{loadError}</p>
          <button type="button" className="btn-primary" onClick={loadPortfolioData}>
            <RefreshCw size={15} />
            <span>Try Again</span>
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="portfolio-empty-card">
          <div className="empty-icon-box">
            <ImageIcon size={30} />
          </div>
          <h3 className="empty-title">
            {portfolio.length === 0 ? "No portfolio items yet" : "No items in this category"}
          </h3>
          <p className="empty-description">
            {portfolio.length === 0
              ? "Upload high-resolution headshots, showreels, or monologue tapes to showcase your talent to top casting directors."
              : "Try switching to another category or upload a new item here."}
          </p>
          <button
            type="button"
            className="btn-add-item"
            style={{ marginTop: "12px" }}
            onClick={() => {
              setAddError("");
              setIsAddModalOpen(true);
            }}
          >
            <Upload size={16} />
            <span>Add item</span>
          </button>
        </div>
      ) : (
        <div className="portfolio-grid">
          {filteredItems.map((item) => {
            const isVideo = isVideoItem(item);
            const statusRaw = (item.status || item.moderationState || "approved").toLowerCase();
            const isApproved = statusRaw === "approved" || statusRaw === "live";
            const isPending = statusRaw === "pending" || statusRaw === "in_review" || statusRaw === "under-review";
            const isRejected = statusRaw === "rejected" || statusRaw === "flagged";

            const displayCategory = (item.category || item.type || "Photo")
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());

            const displayVisibility = (item.visibility || "public").toLowerCase() === "industry_only"
              ? "Industry only"
              : (item.visibility || "Public").toLowerCase() === "private"
              ? "Private"
              : "Public";

            return (
              <div key={item.id || item._id} className="portfolio-card">
                {/* Media Area 4:3 */}
                <div
                  className="card-media-box"
                  onClick={() => {
                    if (isVideo && item.url) {
                      setPreviewVideoUrl(item.url);
                      setPreviewVideoTitle(item.title || "Showreel Video");
                    }
                  }}
                  style={{ cursor: isVideo && item.url ? "pointer" : "default" }}
                >
                  {isVideo ? (
                    <div className="video-poster-box">
                      {item.thumbnailUrl && item.thumbnailUrl !== item.url ? (
                        <img
                          src={optimizeCloudinaryUrl(item.thumbnailUrl, { width: 500, quality: "auto" })}
                          alt={item.title || "Showreel video"}
                          loading="lazy"
                          className="media-img"
                        />
                      ) : (
                        <div className="video-fallback-bg">
                          <Film size={36} style={{ color: "#8A6B2E", opacity: 0.8 }} />
                        </div>
                      )}
                      {/* Play overlay button */}
                      <div className="video-play-overlay" title="Play Video">
                        <div className="play-button-icon">
                          <Play size={18} fill="#FFFFFF" style={{ marginLeft: "2px" }} />
                        </div>
                      </div>
                      {/* Duration badge if available */}
                      {item.duration && (
                        <span className="video-duration-badge">{item.duration}</span>
                      )}
                    </div>
                  ) : (
                    <img
                      src={optimizeCloudinaryUrl(item.url || item.thumbnailUrl, { width: 500, quality: "auto" })}
                      alt={item.title || "Portfolio headshot"}
                      loading="lazy"
                      className="media-img"
                    />
                  )}

                  {/* Category Pill Top-Left */}
                  <span className="media-category-badge">{displayCategory}</span>
                </div>

                {/* Card Body */}
                <div className="card-body">
                  <h3 className="card-title" title={item.title || "Untitled"}>
                    {item.title || "Untitled"}
                  </h3>

                  {/* Meta Row: Visibility + Status Pill */}
                  <div className="card-meta-row">
                    <span className="visibility-text">{displayVisibility}</span>
                    <span className="meta-bullet">•</span>
                    {isApproved && (
                      <span className="status-pill status-pill-approved">
                        APPROVED
                      </span>
                    )}
                    {isPending && (
                      <span className="status-pill status-pill-pending">
                        PENDING
                      </span>
                    )}
                    {isRejected && (
                      <span className="status-pill status-pill-rejected">
                        REJECTED
                      </span>
                    )}
                    {!isApproved && !isPending && !isRejected && (
                      <span className="status-pill status-pill-pending">
                        {(item.status || "PENDING").toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Action Row */}
                  <div className="card-actions-row">
                    <button
                      type="button"
                      className="btn-card-edit"
                      onClick={() => handleOpenEdit(item)}
                    >
                      <Edit2 size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="btn-card-delete"
                      onClick={() => setDeleteTarget(item)}
                      title="Delete item"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. ADD ITEM MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          if (!isUploading) {
            setIsAddModalOpen(false);
            setAddError("");
          }
        }}
        title="Add Portfolio Item"
        subtitle="Upload commercial headshots, showreels, self-tapes and comp cards"
        maxWidth="540px"
      >
        <form onSubmit={handleAddSubmit} className="portfolio-modal-form">
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              value={addCategory}
              onChange={(e) => setAddCategory(e.target.value)}
              className="form-select"
              disabled={isUploading}
            >
              {MEDIA_CATEGORIES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Visibility</label>
            <select
              value={addVisibility}
              onChange={(e) => setAddVisibility(e.target.value)}
              className="form-select"
              disabled={isUploading}
            >
              <option value="public">Public (All verified industry visitors)</option>
              <option value="industry_only">Industry Only (Verified casting directors)</option>
              <option value="private">Private (Only you &amp; Vismaya Admin)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Item Title *</label>
            <input
              type="text"
              placeholder="e.g. Dramatic Monologue 2026, Commercial Look"
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
              className="form-input"
              disabled={isUploading}
              maxLength={120}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              File (JPG, PNG, WebP max 5 MB; MP4, MOV, WebM max 100 MB) *
            </label>
            <input
              ref={addFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg,video/mp4,video/quicktime,video/webm"
              onChange={(e) => setAddFile(e.target.files && e.target.files[0])}
              className="form-file-input"
              disabled={isUploading}
            />
            {addFile && (
              <p className="file-selected-hint">
                Selected: <strong>{addFile.name}</strong> ({(addFile.size / (1024 * 1024)).toFixed(1)} MB)
              </p>
            )}
          </div>

          {addError && (
            <div className="form-error-banner">
              <AlertCircle size={15} />
              <span>{addError}</span>
            </div>
          )}

          <div className="modal-actions-bar">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isUploading}
            >
              <Upload size={15} />
              <span>{isUploading ? "Uploading to Cloudinary..." : "Upload Item"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* 6. EDIT ITEM MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          if (!isUpdating) {
            setIsEditModalOpen(false);
            setEditingItem(null);
            setEditError("");
          }
        }}
        title="Edit Portfolio Item"
        subtitle="Update title, media category and privacy visibility"
        maxWidth="500px"
      >
        <form onSubmit={handleEditSubmit} className="portfolio-modal-form">
          <div className="form-group">
            <label className="form-label">Item Title *</label>
            <input
              type="text"
              placeholder="Item title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="form-input"
              disabled={isUpdating}
              maxLength={120}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="form-select"
              disabled={isUpdating}
            >
              {MEDIA_CATEGORIES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Visibility</label>
            <select
              value={editVisibility}
              onChange={(e) => setEditVisibility(e.target.value)}
              className="form-select"
              disabled={isUpdating}
            >
              <option value="public">Public (All verified industry visitors)</option>
              <option value="industry_only">Industry Only (Verified casting directors)</option>
              <option value="private">Private (Only you &amp; Vismaya Admin)</option>
            </select>
          </div>

          {editError && (
            <div className="form-error-banner">
              <AlertCircle size={15} />
              <span>{editError}</span>
            </div>
          )}

          <div className="modal-actions-bar">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isUpdating}
            >
              <span>{isUpdating ? "Saving Changes..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* 7. DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        title="Delete Portfolio Item?"
        subtitle="This action cannot be undone."
        maxWidth="440px"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ margin: 0, fontSize: "14px", color: "#5A584F", lineHeight: 1.5 }}>
            Are you sure you want to permanently delete{" "}
            <strong style={{ color: "#2B2D2A" }}>
              &ldquo;{deleteTarget?.title || "this item"}&rdquo;
            </strong>{" "}
            from your artist portfolio?
          </p>

          <div className="modal-actions-bar">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-danger-solid"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              <Trash2 size={15} />
              <span>{isDeleting ? "Deleting..." : "Delete Item"}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* 8. VIDEO PREVIEW MODAL */}
      {previewVideoUrl && (
        <Modal
          isOpen={Boolean(previewVideoUrl)}
          onClose={() => setPreviewVideoUrl(null)}
          title={previewVideoTitle || "Video Preview"}
          maxWidth="720px"
        >
          <div style={{ width: "100%", borderRadius: "12px", overflow: "hidden", backgroundColor: "#000" }}>
            <video
              src={previewVideoUrl}
              controls
              autoPlay
              style={{ width: "100%", maxHeight: "70vh", display: "block" }}
            />
          </div>
        </Modal>
      )}

      {/* SCOPED STYLES: .portfolio-v2 */}
      <style jsx global>{`
        .portfolio-v2 {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          background-color: #FAF8F3;
          font-family: var(--font-body), "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #2B2D2A;
          min-height: 80vh;
        }

        /* 1. Header */
        .portfolio-header {
          display: flex;
          align-items: flex-end;
          justifyContent: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .portfolio-header-left {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
          min-width: 260px;
        }

        .portfolio-breadcrumbs {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #7A766B;
          margin-bottom: 2px;
        }

        .breadcrumb-link {
          color: #7A766B;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .breadcrumb-link:hover {
          color: #8A6B2E;
        }

        .breadcrumb-separator {
          color: #C5BFB0;
        }

        .breadcrumb-current {
          color: #2B2D2A;
          font-weight: 500;
        }

        .portfolio-title {
          font-family: var(--font-heading), "Playfair Display", Georgia, serif;
          font-size: 40px;
          font-weight: 600;
          color: #2B2D2A;
          line-height: 1.15;
          margin: 0;
          letter-spacing: -0.01em;
          word-break: normal;
          overflow-wrap: break-word;
        }

        .portfolio-description {
          font-size: 14.5px;
          color: #5A584F;
          margin: 0;
          line-height: 1.5;
          max-width: 600px;
          word-break: normal;
          overflow-wrap: break-word;
        }

        .portfolio-header-right {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .btn-add-item {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 46px;
          padding: 0 24px;
          background-color: #8A6B2E;
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.01em;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(138, 107, 46, 0.25);
          transition: background-color 0.15s ease, transform 0.1s ease;
          white-space: nowrap;
        }

        .btn-add-item:hover {
          background-color: #5E471B;
        }

        .btn-add-item:active {
          transform: scale(0.98);
        }

        /* 2. Summary Status Chips */
        .portfolio-summary-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .summary-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 500;
          line-height: 1;
          white-space: nowrap;
        }

        .summary-chip-total {
          background-color: #FFFFFF;
          color: #4A473E;
          border: 1px solid #E8E1D2;
        }

        .summary-chip-approved {
          background-color: #E3F0E7;
          color: #2F6B45;
          border: 1px solid rgba(47, 107, 69, 0.2);
        }

        .summary-chip-pending {
          background-color: #FBEBDD;
          color: #8F3F16;
          border: 1px solid rgba(143, 63, 22, 0.2);
        }

        .summary-chip-rejected {
          background-color: #FBE9E5;
          color: #A3321F;
          border: 1px solid rgba(163, 50, 31, 0.2);
        }

        /* 3. Category Filter Chips */
        .portfolio-filters-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .portfolio-filters-wrap::-webkit-scrollbar {
          display: none;
        }

        .portfolio-filters {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: min-content;
          padding: 2px 0;
        }

        .category-chip {
          height: 40px;
          padding: 0 18px;
          border-radius: 999px;
          background-color: #FFFFFF;
          color: #5A584F;
          border: 1px solid #E8E1D2;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .category-chip:hover {
          color: #8A6B2E;
          border-color: #C5BFB0;
        }

        .category-chip.active {
          background-color: #8A6B2E;
          color: #FFFFFF;
          border-color: #8A6B2E;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(138, 107, 46, 0.22);
        }

        /* 4. Grid of Item Cards */
        .portfolio-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
          width: 100%;
        }

        .portfolio-card {
          background-color: #FFFFFF;
          border: 1px solid #E8E1D2;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 8px rgba(43, 45, 42, 0.04);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .portfolio-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(43, 45, 42, 0.08);
        }

        /* Media Area 4:3 */
        .card-media-box {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          background-color: #1A1A18;
          overflow: hidden;
        }

        .media-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.3s ease;
        }

        .portfolio-card:hover .media-img {
          transform: scale(1.02);
        }

        .video-poster-box {
          width: 100%;
          height: 100%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .video-fallback-bg {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #1F1D1A 0%, #2E2922 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .video-play-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(0, 0, 0, 0.25);
          transition: background-color 0.2s ease;
        }

        .card-media-box:hover .video-play-overlay {
          background-color: rgba(0, 0, 0, 0.4);
        }

        .play-button-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: rgba(138, 107, 46, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
          transition: transform 0.15s ease;
        }

        .card-media-box:hover .play-button-icon {
          transform: scale(1.08);
          background-color: #8A6B2E;
        }

        .video-duration-badge {
          position: absolute;
          bottom: 10px;
          right: 10px;
          font-size: 11px;
          font-weight: 600;
          color: #FFFFFF;
          background-color: rgba(0, 0, 0, 0.75);
          padding: 2px 7px;
          border-radius: 4px;
          backdrop-filter: blur(4px);
        }

        .media-category-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          font-size: 11px;
          font-weight: 600;
          color: #FFFFFF;
          background-color: rgba(21, 20, 18, 0.75);
          padding: 4px 10px;
          border-radius: 999px;
          backdrop-filter: blur(6px);
          letter-spacing: 0.02em;
        }

        /* Card Content */
        .card-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .card-title {
          font-size: 15px;
          font-weight: 600;
          color: #2B2D2A;
          line-height: 1.35;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          word-break: normal;
          overflow-wrap: break-word;
        }

        .card-meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: #6E6B62;
        }

        .visibility-text {
          font-weight: 500;
          color: #5A584F;
        }

        .meta-bullet {
          color: #C5BFB0;
        }

        /* Status Pills: height 24px, inline-flex, centered text, line-height 1, white-space nowrap */
        .status-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 24px;
          line-height: 1;
          padding: 0 10px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.06em;
          white-space: nowrap;
          text-transform: uppercase;
        }

        .status-pill-approved {
          background-color: #E3F0E7;
          color: #2F6B45;
          border: 1px solid rgba(47, 107, 69, 0.2);
        }

        .status-pill-pending {
          background-color: #FBEBDD;
          color: #8F3F16;
          border: 1px solid rgba(143, 63, 22, 0.2);
        }

        .status-pill-rejected {
          background-color: #FBE9E5;
          color: #A3321F;
          border: 1px solid rgba(163, 50, 31, 0.2);
        }

        /* Action Row: buttons 40px high */
        .card-actions-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: auto;
          padding-top: 4px;
        }

        .btn-card-edit {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 40px;
          border-radius: 10px;
          background-color: #FAF8F3;
          border: 1px solid #E8E1D2;
          color: #2B2D2A;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }

        .btn-card-edit:hover {
          background-color: #F0ECE1;
          border-color: #C5BFB0;
          color: #8A6B2E;
        }

        .btn-card-delete {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 40px;
          border-radius: 10px;
          background-color: transparent;
          border: 1px solid #FECDCA;
          color: #B42318;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }

        .btn-card-delete:hover {
          background-color: #FEF3F2;
          border-color: #FDA29B;
        }

        /* Skeleton States */
        .skeleton-card {
          background-color: #FFFFFF;
          border: 1px solid #E8E1D2;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .skeleton-media {
          width: 100%;
          aspect-ratio: 4 / 3;
          background-color: #EFEBE1;
          animation: pulseSkeleton 1.4s ease-in-out infinite;
        }

        .skeleton-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skeleton-line {
          border-radius: 6px;
          background-color: #EFEBE1;
          animation: pulseSkeleton 1.4s ease-in-out infinite;
        }

        .line-title {
          height: 18px;
          width: 75%;
        }

        .line-meta {
          height: 14px;
          width: 45%;
        }

        .line-actions {
          height: 38px;
          width: 100%;
          margin-top: 6px;
        }

        @keyframes pulseSkeleton {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        /* Empty & Error Cards */
        .portfolio-empty-card,
        .portfolio-error-card {
          background-color: #FFFFFF;
          border: 1px dashed #E8E1D2;
          border-radius: 20px;
          padding: 56px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 12px 0;
        }

        .empty-icon-box {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background-color: rgba(138, 107, 46, 0.1);
          color: #8A6B2E;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .error-icon-box {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background-color: #FEF3F2;
          color: #B42318;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .empty-title,
        .error-title {
          font-family: var(--font-heading), "Playfair Display", Georgia, serif;
          font-size: 22px;
          font-weight: 600;
          color: #2B2D2A;
          margin: 0 0 8px 0;
        }

        .empty-description,
        .error-msg {
          font-size: 14px;
          color: #5A584F;
          margin: 0 0 16px 0;
          max-width: 440px;
          line-height: 1.5;
        }

        /* Modal Forms */
        .portfolio-modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 13px;
          font-weight: 600;
          color: #2B2D2A;
        }

        .form-input,
        .form-select {
          height: 42px;
          padding: 0 14px;
          border-radius: 10px;
          border: 1px solid #E8E1D2;
          background-color: #FFFFFF;
          color: #2B2D2A;
          font-size: 13.5px;
          font-family: inherit;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .form-input:focus,
        .form-select:focus {
          border-color: #8A6B2E;
          box-shadow: 0 0 0 3px rgba(138, 107, 46, 0.15);
        }

        .form-file-input {
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px dashed #E8E1D2;
          background-color: #FAF8F3;
          font-size: 13px;
          color: #4A473E;
          cursor: pointer;
        }

        .file-selected-hint {
          font-size: 12px;
          color: #2F6B45;
          margin: 2px 0 0 0;
        }

        .form-error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 8px;
          background-color: #FEF3F2;
          border: 1px solid #FECDCA;
          color: #B42318;
          font-size: 13px;
        }

        .modal-actions-bar {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 8px;
          flex-wrap: wrap;
        }

        .btn-danger-solid {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 42px;
          padding: 0 20px;
          border-radius: 10px;
          background-color: #D92D20;
          color: #FFFFFF;
          border: none;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .btn-danger-solid:hover {
          background-color: #B42318;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1023px) {
          .portfolio-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
          }
        }

        @media (max-width: 768px) {
          .portfolio-header {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }

          .portfolio-title {
            font-size: 30px;
          }

          .portfolio-header-right {
            width: 100%;
          }

          .btn-add-item {
            width: 100%;
            height: 46px;
          }
        }

        @media (max-width: 480px) {
          .portfolio-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .card-actions-row button {
            min-height: 44px; /* 44px minimum tap target for mobile */
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .portfolio-card,
          .btn-add-item,
          .media-img,
          .skeleton-media,
          .skeleton-line {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
