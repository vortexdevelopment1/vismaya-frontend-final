"use client";

import React, { useState } from "react";
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
  AlertCircle
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import Tabs from "@/components/shared/Tabs";
import EmptyState from "@/components/shared/EmptyState";
import Modal from "@/components/shared/Modal";
import MediaCard from "@/components/talent/MediaCard";
import { useTalent } from "@/lib/talent/TalentContext";

export default function TalentPortfolioPage() {
  const { portfolio, addMedia, deleteMedia } = useTalent();

  const [activeTab, setActiveTab] = useState("all");
  const [showUploadModal, setShowUploadModal] = useState(false);

  // New Upload Form State
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState("Headshot");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");

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

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    addMedia({
      title: uploadTitle.trim(),
      type: uploadType,
      fileName: fileName || `${uploadType.toLowerCase()}-sample.jpg`,
    });

    setUploadTitle("");
    setUploadType("Headshot");
    setFileName("");
    setShowUploadModal(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Page Header */}
      <PageHeader
        title="Media Portfolio &amp; Comp Cards"
        subtitle="Manage high-resolution headshots, full-length profile looks, dramatic showreels, and audition tapes."
        breadcrumbs={[
          { label: "Talent Dashboard", href: "/talent/dashboard" },
          { label: "Portfolio" },
        ]}
        action={
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary"
            style={{ padding: "10px 20px", fontSize: "0.9rem" }}
          >
            <Upload size={16} />
            <span>Upload New Media</span>
          </button>
        }
      />

      {/* Admin Moderation Disclaimer Banner */}
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "16px",
          padding: "18px 24px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            backgroundColor: "rgba(255, 188, 0, 0.12)",
            border: "1px solid rgba(255, 188, 0, 0.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--gold)",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.35)",
          }}
        >
          <ShieldCheck size={22} />
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3px" }}>
          <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "#eceaf5" }}>
            Admin Moderation Protocol
          </span>
          <span style={{ fontSize: "0.825rem", color: "#a3acc2", lineHeight: 1.4 }}>
            Every upload is checked by Vismaya Admin before it becomes visible to casting directors. Please upload high-resolution images (min 1080p) with natural studio lighting.
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(key) => setActiveTab(key)}
        variant="pills"
      />

      {/* Media Cards Grid */}
      {filteredMedia.length === 0 ? (
        <EmptyState
          title={`No ${activeTab === "all" ? "" : activeTab} media uploaded`}
          description="Upload headshots or showreels to boost your casting shortlist chances."
          iconName="Briefcase"
          actionLabel="Upload Media Now"
          onAction={() => setShowUploadModal(true)}
        />
      ) : (
        <div className="talent-media-grid">
          {filteredMedia.map((media) => (
            <MediaCard
              key={media.id}
              media={media}
              onDelete={deleteMedia}
            />
          ))}
        </div>
      )}

      {/* Upload Media Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Talent Media"
        subtitle="Add a photo, showreel, or monologue tape for Admin verification."
        maxWidth="520px"
        footer={
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="btn-secondary"
              style={{ padding: "9px 18px", borderRadius: "12px" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="upload-media-form"
              className="btn-primary"
              style={{ padding: "9px 24px", borderRadius: "12px" }}
            >
              <span>Submit for Moderation</span>
            </button>
          </div>
        }
      >
        <form id="upload-media-form" onSubmit={handleUploadSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#a3acc2", marginBottom: "6px" }}>
              Media Category / Type <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <select
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                backgroundColor: "rgba(255, 255, 255, 0.055)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                borderRadius: "12px",
                color: "#eceaf5",
                fontSize: "0.9rem",
                outline: "none",
              }}
            >
              <option value="Headshot" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Commercial Headshot</option>
              <option value="Full Body" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Full Body Look / Comp Card</option>
              <option value="Showreel" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Dramatic Video Showreel</option>
              <option value="Audition Clip" style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>Audition Monologue Self-Tape</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#a3acc2", marginBottom: "6px" }}>
              Media Title / Caption <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Studio Close-Up 2026, Emotional Hindi Monologue"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                backgroundColor: "rgba(255, 255, 255, 0.055)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                borderRadius: "12px",
                color: "#eceaf5",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
          </div>

          {/* Drag & Drop UI Box */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#a3acc2", marginBottom: "6px" }}>
              File Upload (JPG, PNG, MP4, MOV up to 100MB)
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  setFileName(e.dataTransfer.files[0].name);
                  if (!uploadTitle) setUploadTitle(e.dataTransfer.files[0].name.replace(/\.[^/.]+$/, ""));
                }
              }}
              style={{
                border: `2px dashed ${isDragging ? "var(--gold)" : "rgba(255, 255, 255, 0.16)"}`,
                borderRadius: "16px",
                backgroundColor: isDragging ? "rgba(255, 188, 0, 0.08)" : "rgba(255, 255, 255, 0.03)",
                padding: "28px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                gap: "10px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => {
                const sampleName = `${uploadType.toLowerCase()}_sample_${Date.now().toString().slice(-4)}.jpg`;
                setFileName(sampleName);
                if (!uploadTitle) setUploadTitle(`${uploadType} Preview`);
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 188, 0, 0.12)",
                  border: "1px solid rgba(255, 188, 0, 0.28)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--gold)",
                }}
              >
                <Upload size={20} />
              </div>

              <div>
                <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "#eceaf5", display: "block" }}>
                  {fileName ? `Selected: ${fileName}` : "Click to select or drag and drop file here"}
                </span>
                <span style={{ fontSize: "0.75rem", color: "#7e89a3" }}>
                  Supported: JPEG, PNG, MP4, WebM (Max 100MB)
                </span>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
