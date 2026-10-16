"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Plus,
  ShieldCheck,
  Image as ImageIcon,
  Video,
  Mic,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  Film,
  FileCheck,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import Tabs from "@/components/shared/Tabs";
import EmptyState from "@/components/shared/EmptyState";
import Modal from "@/components/shared/Modal";
import MediaCard from "@/components/talent/MediaCard";
import ProgressBar from "@/components/shared/ProgressBar";
import { useTalent } from "@/lib/talent/TalentContext";
import { validateMediaFile, MEDIA_LIMITS } from "@/lib/api/uploadMedia";

const CATEGORY_OPTIONS = [
  { value: "Headshot", category: "headshot", label: "Commercial Headshot", type: "photo" },
  { value: "Full Body", category: "full_body", label: "Full Body / Comp Card", type: "photo" },
  { value: "Showreel", category: "showreel", label: "Dramatic Showreel", type: "video" },
  { value: "Audition Clip", category: "audition", label: "Audition Self-Tape", type: "video" },
];

export default function TalentPortfolioPage() {
  const { portfolio, addMedia, deleteMedia, refreshPortfolio, addToast } = useTalent();

  const [activeTab, setActiveTab] = useState("all");
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Queue State
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const fileInputRef = useRef(null);

  // Reload media on mount
  useEffect(() => {
    if (typeof refreshPortfolio === "function") {
      refreshPortfolio();
    }
  }, []);

  // Prevent leaving page if upload is in progress
  useEffect(() => {
    const isUploading = uploadQueue.some((item) => item.status === "uploading");
    const handleBeforeUnload = (e) => {
      if (isUploading) {
        e.preventDefault();
        e.returnValue = "Upload in progress. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [uploadQueue]);

  const tabs = [
    { key: "all", label: "All Media", count: portfolio.length },
    { key: "Headshot", label: "Headshots", count: portfolio.filter((m) => m.type === "Headshot").length },
    { key: "Full Body", label: "Full Body", count: portfolio.filter((m) => m.type === "Full Body").length },
    { key: "Showreel", label: "Showreels", count: portfolio.filter((m) => m.type === "Showreel").length },
    { key: "Audition Clip", label: "Audition Clips", count: portfolio.filter((m) => m.type === "Audition Clip").length },
  ];

  const filteredMedia = activeTab === "all"
    ? portfolio
    : portfolio.filter((m) => m.type === activeTab);

  // File selection & queue generation
  const handleFilesSelected = (filesList) => {
    setGlobalError("");
    const newItems = [];

    Array.from(filesList).forEach((file) => {
      const isVideo = file.type?.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(file.name);
      const defaultType = isVideo ? "Showreel" : "Headshot";
      const defaultCat = isVideo ? "showreel" : "headshot";

      try {
        validateMediaFile(file, isVideo ? "video" : "photo");

        const previewUrl = URL.createObjectURL(file);
        const titleWithoutExt = file.name.replace(/\.[^/.]+$/, "");

        newItems.push({
          id: "queue_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
          file,
          previewUrl,
          title: titleWithoutExt,
          type: defaultType,
          category: defaultCat,
          isVideo,
          sizeMb: (file.size / (1024 * 1024)).toFixed(1),
          progress: 0,
          status: "ready", // ready | uploading | success | error
          error: null,
          abortController: new AbortController(),
        });
      } catch (err) {
        setGlobalError(err.message || `File "${file.name}" is not eligible for upload.`);
      }
    });

    if (newItems.length > 0) {
      setUploadQueue((prev) => [...prev, ...newItems]);
      setShowUploadModal(true);
    }
  };

  const handleQueueFieldChange = (id, field, value) => {
    setUploadQueue((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (field === "type") {
            const opt = CATEGORY_OPTIONS.find((c) => c.value === value);
            return {
              ...item,
              type: value,
              category: opt ? opt.category : item.category,
            };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const removeFromQueue = (id) => {
    setUploadQueue((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.abortController) {
        item.abortController.abort();
      }
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  // Upload single item
  const uploadSingleItem = async (item) => {
    setUploadQueue((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: "uploading", error: null, progress: 10 } : i))
    );

    try {
      await addMedia({
        file: item.file,
        title: item.title.trim() || item.file.name,
        type: item.type,
        category: item.category,
        onProgress: (percent) => {
          setUploadQueue((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, progress: percent } : i))
          );
        },
        signal: item.abortController?.signal,
      });

      setUploadQueue((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "success", progress: 100 } : i))
      );
    } catch (err) {
      setUploadQueue((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: "error", error: err.message || "Upload failed." }
            : i
        )
      );
    }
  };

  // Upload all ready or failed items
  const handleUploadAll = async () => {
    const readyItems = uploadQueue.filter((i) => i.status === "ready" || i.status === "error");
    if (readyItems.length === 0) return;

    for (const item of readyItems) {
      await uploadSingleItem(item);
    }

    // Check if all succeeded
    setTimeout(() => {
      setUploadQueue((prev) => {
        const remaining = prev.filter((i) => i.status !== "success");
        if (remaining.length === 0) {
          setShowUploadModal(false);
          return [];
        }
        return remaining;
      });
    }, 1200);
  };

  const isAnyUploading = uploadQueue.some((i) => i.status === "uploading");

  return (
    <div className="talent-portfolio-root" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesSelected(e.target.files);
            e.target.value = "";
          }
        }}
      />

      {/* Page Header */}
      <PageHeader
        title="Media Portfolio &amp; Comp Cards"
        subtitle="Manage high-resolution headshots, full-length profile looks, dramatic showreels, and audition tapes backed by Cloudinary."
        breadcrumbs={[
          { label: "Talent Dashboard", href: "/talent/dashboard" },
          { label: "Portfolio" },
        ]}
        action={
          <button
            onClick={() => {
              setGlobalError("");
              if (fileInputRef.current) fileInputRef.current.click();
            }}
            className="btn-primary portfolio-header-upload-btn"
            style={{
              padding: "10px 20px",
              fontSize: "0.9rem",
              borderRadius: "8px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Upload size={16} />
            <span>Upload Photos &amp; Videos</span>
          </button>
        }
      />

      {/* Admin Moderation Protocol Banner */}
      <div
        className="portfolio-moderation-banner"
        style={{
          backgroundColor: "#F3EFE6",
          border: "1px solid #E8E2D4",
          borderRadius: "14px",
          padding: "16px 22px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          className="portfolio-moderation-icon"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#8A6B2E",
            flexShrink: 0,
            boxShadow: "0 2px 6px rgba(43, 45, 42, 0.04)",
          }}
        >
          <ShieldCheck size={22} />
        </div>

        <div className="portfolio-moderation-text" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3px" }}>
          <span className="portfolio-moderation-title" style={{ fontSize: "14px", fontWeight: "700", color: "#2B2D2A", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
            Admin Moderation Protocol
          </span>
          <span className="portfolio-moderation-desc" style={{ fontSize: "13px", color: "#5A584F", lineHeight: 1.5, fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
            Every photo and video upload is queued for Vismaya Admin verification before appearing in recruiter comp cards. Images up to 5MB (JPG, PNG, WebP) and videos up to 100MB (MP4, WebM, MOV) are supported.
          </span>
        </div>
      </div>

      {/* Drag & Drop Quick Zone */}
      <div
        className="portfolio-drop-zone"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFilesSelected(e.dataTransfer.files);
          }
        }}
        onClick={() => {
          if (fileInputRef.current) fileInputRef.current.click();
        }}
        style={{
          border: `2px dashed ${isDragging ? "#8A6B2E" : "#E8E2D4"}`,
          borderRadius: "14px",
          backgroundColor: isDragging ? "#F3EFE6" : "#FFFFFF",
          padding: "32px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: "12px",
          cursor: "pointer",
          transition: "all 0.18s ease",
          boxShadow: "0 2px 6px rgba(43, 45, 42, 0.03)",
        }}
      >
        <div
          className="portfolio-drop-icon"
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            backgroundColor: "#F3EFE6",
            border: "1px solid #E8E2D4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#8A6B2E",
          }}
        >
          <Upload size={24} />
        </div>

        <div className="portfolio-drop-text">
          <span className="portfolio-drop-title" style={{ fontSize: "1rem", fontWeight: "700", color: "#2B2D2A", display: "block" }}>
            Drag and drop high-res photos or showreel clips here
          </span>
          <span className="portfolio-drop-subtitle" style={{ fontSize: "0.825rem", color: "#5A584F", marginTop: "4px", display: "block" }}>
            Or click to browse from your device &bull; Photos up to 5 MB, Videos up to 100 MB
          </span>
        </div>
      </div>

      {/* Global Error Banner if file rejected */}
      {globalError && (
        <div
          style={{
            backgroundColor: "#FEF3F2",
            border: "1px solid #FECDCA",
            borderRadius: "10px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#B42318",
            fontSize: "0.875rem",
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{globalError}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="portfolio-tabs-wrap">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(key) => setActiveTab(key)}
          variant="pills"
        />
      </div>

      {/* Media Cards Grid */}
      {filteredMedia.length === 0 ? (
        <div className="portfolio-empty-wrap">
          <EmptyState
            title={`No ${activeTab === "all" ? "" : activeTab} media uploaded`}
            description="Upload professional headshots, comp cards, or dramatic showreels to build your casting presence."
            iconName="Briefcase"
            actionLabel="Upload Media Now"
            onAction={() => {
              if (fileInputRef.current) fileInputRef.current.click();
            }}
          />
        </div>
      ) : (
        <div
          className="portfolio-media-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "24px",
            width: "100%",
          }}
        >
          {filteredMedia.map((media) => (
            <MediaCard
              key={media.id || media._id}
              media={media}
              onDelete={deleteMedia}
            />
          ))}
        </div>
      )}

      {/* Upload Queue Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          if (!isAnyUploading) setShowUploadModal(false);
        }}
        title="Upload Portfolio Media"
        subtitle="Review category labels, captions, and file sizes before submitting to Admin moderation."
        maxWidth="680px"
        footer={
          <div className="upload-modal-footer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.click();
              }}
              className="btn-secondary upload-modal-add-btn"
              disabled={isAnyUploading}
              style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={14} />
              <span>Add More Files</span>
            </button>

            <div className="upload-modal-action-btns" style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                disabled={isAnyUploading}
                className="btn-secondary upload-modal-close-btn"
                style={{ padding: "8px 18px", borderRadius: "8px" }}
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleUploadAll}
                disabled={isAnyUploading || uploadQueue.length === 0}
                className="btn-primary upload-modal-submit-btn"
                style={{
                  padding: "8px 24px",
                  borderRadius: "8px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: "600",
                }}
              >
                {isAnyUploading ? (
                  <span>Uploading to Cloudinary...</span>
                ) : (
                  <span>Submit {uploadQueue.length} {uploadQueue.length === 1 ? "Item" : "Items"}</span>
                )}
              </button>
            </div>
          </div>
        }
      >
        <div className="upload-queue-container" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {uploadQueue.length === 0 ? (
            <div
              style={{
                padding: "36px 20px",
                textAlign: "center",
                color: "#5A584F",
                border: "1px dashed #E8E2D4",
                borderRadius: "10px",
              }}
            >
              <span>No files in the upload queue. Click below to add files.</span>
            </div>
          ) : (
            uploadQueue.map((item) => (
              <div
                key={item.id}
                className="upload-queue-card"
                style={{
                  backgroundColor: "#FAF9F7",
                  border: item.error ? "1px solid #FECDCA" : "1px solid #E8E2D4",
                  borderRadius: "12px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {/* Top Row: Preview, Title, Category, Remove */}
                <div className="upload-queue-row" style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                  {/* Thumbnail */}
                  <div
                    className="upload-queue-thumb"
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "8px",
                      backgroundColor: "#2B2D2A",
                      overflow: "hidden",
                      flexShrink: 0,
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.isVideo ? (
                      <video
                        src={item.previewUrl}
                        preload="metadata"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <img
                        src={item.previewUrl}
                        alt="Preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                    {item.isVideo && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundColor: "rgba(43, 45, 42, 0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#FAF9F7",
                        }}
                      >
                        <Film size={18} />
                      </div>
                    )}
                  </div>

                  {/* Inputs */}
                  <div className="upload-queue-inputs" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 }}>
                    <div className="upload-queue-fields-row" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <input
                        type="text"
                        value={item.title}
                        disabled={item.status === "uploading" || item.status === "success"}
                        placeholder="Caption / Title"
                        onChange={(e) => handleQueueFieldChange(item.id, "title", e.target.value)}
                        className="upload-queue-title-input"
                        style={{
                          flex: 1,
                          minWidth: "160px",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "1px solid #E8E2D4",
                          backgroundColor: "#FFFFFF",
                          fontSize: "0.875rem",
                          color: "#2B2D2A",
                          outline: "none",
                        }}
                      />

                      <select
                        value={item.type}
                        disabled={item.status === "uploading" || item.status === "success"}
                        onChange={(e) => handleQueueFieldChange(item.id, "type", e.target.value)}
                        className="upload-queue-type-select"
                        style={{
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "1px solid #E8E2D4",
                          backgroundColor: "#FFFFFF",
                          fontSize: "0.85rem",
                          color: "#2B2D2A",
                          outline: "none",
                        }}
                      >
                        {CATEGORY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="upload-queue-meta-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.75rem", color: "#5A584F" }}>
                      <span>
                        {item.file.name} &bull; {item.sizeMb} MB
                      </span>
                      {item.status === "success" && (
                        <span style={{ color: "#027A48", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <CheckCircle2 size={13} /> Uploaded &amp; Queued
                        </span>
                      )}
                      {item.status === "error" && (
                        <span style={{ color: "#B42318", fontWeight: "700" }}>
                          {item.error}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions (Remove / Retry) */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {item.status === "error" && (
                      <button
                        type="button"
                        onClick={() => uploadSingleItem(item)}
                        title="Retry Upload"
                        style={{
                          padding: "6px",
                          borderRadius: "6px",
                          backgroundColor: "#F3EFE6",
                          border: "1px solid #E8E2D4",
                          color: "#8A6B2E",
                          cursor: "pointer",
                        }}
                      >
                        <RotateCcw size={15} />
                      </button>
                    )}

                    {item.status !== "uploading" && (
                      <button
                        type="button"
                        onClick={() => removeFromQueue(item.id)}
                        title="Remove"
                        style={{
                          padding: "6px",
                          borderRadius: "6px",
                          backgroundColor: "transparent",
                          border: "none",
                          color: "#5A584F",
                          cursor: "pointer",
                        }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {item.status === "uploading" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#8A6B2E" }}>
                      <span>Streaming to Cloudinary...</span>
                      <span>{item.progress}%</span>
                    </div>
                    <ProgressBar
                      value={item.progress}
                      height="6px"
                      showPercentage={false}
                      color="#8A6B2E"
                      gradient="#C9A55C"
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Modal>

      <style jsx>{`
        @media (max-width: 640px) {
          .talent-portfolio-root {
            gap: 14px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }

          /* Header */
          :global(.talent-portfolio-root .page-header-container) {
            margin-bottom: 0px !important;
            gap: 8px !important;
          }
          :global(.talent-portfolio-root .page-header-container nav) {
            font-size: 12px !important;
            gap: 6px !important;
          }
          :global(.talent-portfolio-root .page-header-title) {
            font-size: 22px !important;
            line-height: 1.25 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          }
          :global(.talent-portfolio-root .page-header-subtitle) {
            font-size: 13px !important;
            line-height: 1.5 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 3 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          }
          :global(.talent-portfolio-root .page-header-actions) {
            width: 100% !important;
            margin-top: 4px !important;
          }
          :global(.talent-portfolio-root .portfolio-header-upload-btn) {
            width: 100% !important;
            height: 42px !important;
            min-height: 42px !important;
            font-size: 12px !important;
            font-weight: 700 !important;
            letter-spacing: 0.05em !important;
            text-transform: uppercase !important;
            justify-content: center !important;
            border-radius: 10px !important;
          }

          /* Moderation Protocol Banner */
          .portfolio-moderation-banner {
            padding: 12px !important;
            display: flex !important;
            flex-direction: row !important;
            align-items: flex-start !important;
            gap: 10px !important;
            border-radius: 12px !important;
          }
          .portfolio-moderation-icon {
            width: 28px !important;
            height: 28px !important;
            min-width: 28px !important;
            border-radius: 50% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-shrink: 0 !important;
          }
          .portfolio-moderation-icon :global(svg) {
            width: 15px !important;
            height: 15px !important;
          }
          .portfolio-moderation-text {
            flex: 1 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 2px !important;
            min-width: 0 !important;
          }
          .portfolio-moderation-title {
            font-size: 13px !important;
            line-height: 1.3 !important;
          }
          .portfolio-moderation-desc {
            font-size: 12px !important;
            line-height: 1.45 !important;
          }

          /* Drop Zone */
          .portfolio-drop-zone {
            padding: 16px !important;
            border-width: 1.5px !important;
            border-radius: 14px !important;
            gap: 8px !important;
          }
          .portfolio-drop-icon {
            width: 32px !important;
            height: 32px !important;
            min-width: 32px !important;
          }
          .portfolio-drop-icon :global(svg) {
            width: 16px !important;
            height: 16px !important;
          }
          .portfolio-drop-title {
            font-size: 14px !important;
            line-height: 1.3 !important;
          }
          .portfolio-drop-subtitle {
            font-size: 11.5px !important;
            line-height: 1.35 !important;
            margin-top: 3px !important;
          }

          /* Category Tabs - Horizontally scrollable row */
          .portfolio-tabs-wrap {
            margin-left: -16px !important;
            margin-right: -16px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: none !important;
          }
          .portfolio-tabs-wrap::-webkit-scrollbar {
            display: none !important;
          }
          .portfolio-tabs-wrap :global(.custom-tabs-container) {
            display: flex !important;
            flex-wrap: nowrap !important;
            overflow-x: visible !important;
            gap: 8px !important;
            padding-bottom: 2px !important;
            width: max-content !important;
          }
          .portfolio-tabs-wrap :global(.tab-btn) {
            height: 34px !important;
            min-height: 34px !important;
            padding: 0 12px !important;
            font-size: 12.5px !important;
            gap: 6px !important;
            flex-shrink: 0 !important;
            white-space: nowrap !important;
          }
          .portfolio-tabs-wrap :global(.tab-btn span:last-child) {
            font-size: 11px !important;
            height: 18px !important;
            min-width: 18px !important;
            padding: 0 5px !important;
          }

          /* Media Cards Grid */
          .portfolio-media-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
            width: 100% !important;
          }

          /* Empty State */
          .portfolio-empty-wrap :global(> div) {
            padding: 24px 16px !important;
            border-radius: 14px !important;
          }
          .portfolio-empty-wrap :global(h3) {
            font-size: 16px !important;
          }
          .portfolio-empty-wrap :global(p) {
            font-size: 12.5px !important;
            line-height: 1.45 !important;
            margin-bottom: 14px !important;
          }
          .portfolio-empty-wrap :global(button) {
            height: 40px !important;
            min-height: 40px !important;
            font-size: 13px !important;
          }

          /* Upload Modal */
          .upload-modal-footer {
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
            width: 100% !important;
          }
          .upload-modal-add-btn {
            width: 100% !important;
            height: 40px !important;
            justify-content: center !important;
            font-size: 12.5px !important;
            border-radius: 8px !important;
          }
          .upload-modal-action-btns {
            display: grid !important;
            grid-template-columns: 1fr 1.6fr !important;
            gap: 8px !important;
            width: 100% !important;
          }
          .upload-modal-close-btn,
          .upload-modal-submit-btn {
            height: 44px !important;
            justify-content: center !important;
            font-size: 13px !important;
            border-radius: 8px !important;
            width: 100% !important;
          }
          .upload-queue-card {
            padding: 12px !important;
            gap: 10px !important;
            border-radius: 10px !important;
          }
          .upload-queue-thumb {
            width: 44px !important;
            height: 44px !important;
            min-width: 44px !important;
            border-radius: 6px !important;
          }
          .upload-queue-fields-row {
            flex-direction: column !important;
            gap: 8px !important;
          }
          .upload-queue-title-input,
          .upload-queue-type-select {
            width: 100% !important;
            height: 42px !important;
            min-height: 42px !important;
            font-size: 16px !important;
            border-radius: 8px !important;
            padding: 0 10px !important;
            box-sizing: border-box !important;
          }
          .upload-queue-meta-row {
            font-size: 12px !important;
          }
        }

        @media (max-width: 400px) {
          :global(.talent-portfolio-root .page-header-title) {
            font-size: 20px !important;
          }
          .portfolio-drop-title {
            font-size: 13px !important;
          }
          .portfolio-media-grid {
            gap: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}
