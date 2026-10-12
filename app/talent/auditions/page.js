"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Video,
  Upload,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
  Building2,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Film,
  Send,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import Skeleton from "@/components/shared/Skeleton";
import VideoPlayer from "@/components/shared/VideoPlayer";
import { useWorkflow } from "@/lib/shared/workflowStore";
import { useTalent } from "@/lib/talent/TalentContext";

export default function TalentAuditionsPage() {
  const { auditions, getOpportunity, getProject, submitSelfTape, isHydrated } = useWorkflow();
  const { addToast } = useTalent();

  const currentTalentId = "tal-904";
  const myAuditions = auditions.filter((a) => a.talentId === currentTalentId);

  // Form states per audition card
  const [activeUploadId, setActiveUploadId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({}); // { [audId]: { file, previewUrl, fileName, fileSize } }
  const [auditionNotes, setAuditionNotes] = useState({});
  const [isSubmittingMap, setIsSubmittingMap] = useState({});
  const [fileErrorMap, setFileErrorMap] = useState({});

  const handleFileSelect = (audId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (video only)
    const isVideo = file.type.startsWith("video/") || /\.(mp4|mov|webm|mkv|avi)$/i.test(file.name);
    if (!isVideo) {
      setFileErrorMap((prev) => ({
        ...prev,
        [audId]: "Invalid file type. Please select a valid video file (MP4, MOV, WEBM).",
      }));
      addToast({
        type: "danger",
        title: "Invalid File Type",
        message: "Please choose a video file (MP4, MOV, WEBM).",
      });
      return;
    }

    setFileErrorMap((prev) => ({ ...prev, [audId]: null }));

    // Create a local object URL for preview and shared state playback
    const previewUrl = URL.createObjectURL(file);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);

    setSelectedFiles((prev) => ({
      ...prev,
      [audId]: {
        file,
        previewUrl,
        fileName: file.name,
        fileSize: `${sizeInMb} MB`,
      },
    }));

    addToast({
      type: "info",
      title: "Video Loaded",
      message: `Selected "${file.name}" (${sizeInMb} MB). Review preview and submit.`,
    });
  };

  const handleSubmitTape = (audId) => {
    const fileData = selectedFiles[audId];
    if (!fileData || !fileData.previewUrl) {
      addToast({
        type: "warning",
        title: "Video File Required",
        message: "Please select an audition video file before submitting.",
      });
      return;
    }

    setIsSubmittingMap((prev) => ({ ...prev, [audId]: true }));

    const note = auditionNotes[audId] || "Self-tape recorded and submitted as per script sides.";

    setTimeout(() => {
      try {
        // TODO: upload to storage (e.g. AWS S3 / Cloudflare R2 / Supabase Storage) and get permanent CDN URL
        const selfTapeUrl = fileData.previewUrl;

        submitSelfTape(audId, selfTapeUrl, note);
        addToast({
          type: "success",
          title: "Self-Tape Submitted!",
          message: "Your self-tape was uploaded and sent through Vismaya for verification.",
        });
        setActiveUploadId(null);
      } catch (err) {
        console.error(err);
        addToast({
          type: "danger",
          title: "Upload Failed",
          message: "Could not submit your self-tape. Please try again.",
        });
      } finally {
        setIsSubmittingMap((prev) => ({ ...prev, [audId]: false }));
      }
    }, 400);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <PageHeader
        title="Auditions &amp; Self-Tapes"
        subtitle="Manage audition invitations, script sides, and submit recorded self-tapes directly through the secure Vismaya portal."
        badge={`${myAuditions.length} AUDITION INVITATIONS`}
        breadcrumbs={[
          { label: "Talent Dashboard", href: "/talent/dashboard" },
          { label: "Auditions" },
        ]}
      />

      {/* Vismaya Security Channel Banner */}
      <div
        className="card-surface"
        style={{
          backgroundColor: "#F3EFE6",
          border: "1px solid #E8E2D4",
          borderRadius: "14px",
          padding: "18px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <ShieldCheck size={24} style={{ color: "#8A6B2E", flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#2B2D2A", display: "block", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
              Your self-tape is sent through Vismaya
            </span>
            <span style={{ fontSize: "13px", color: "#5A584F", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
              All auditions and video callbacks are reviewed and verified by Vismaya before relay to casting teams to guarantee artist privacy.
            </span>
          </div>
        </div>

        <Link
          href="/talent/portfolio"
          style={{
            fontSize: "13px",
            fontWeight: 600,
            padding: "8px 16px",
            borderRadius: "10px",
            backgroundColor: "#FFFFFF",
            border: "1px solid #8A6B2E",
            color: "#8A6B2E",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            fontFamily: "var(--font-body), 'Inter', sans-serif",
          }}
        >
          <span>View Media Portfolio</span>
        </Link>
      </div>

      {/* Audition Requests List */}
      {!isHydrated ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {[1, 2].map((i) => (
            <div key={i} className="card-surface" style={{ padding: "28px", height: "240px", borderRadius: "18px", backgroundColor: "#FFFFFF", border: "1px solid #E8E2D4" }}>
              <Skeleton width="40%" height="24px" />
              <Skeleton width="80%" height="16px" style={{ marginTop: "12px" }} />
              <Skeleton width="60%" height="16px" style={{ marginTop: "8px" }} />
            </div>
          ))}
        </div>
      ) : myAuditions.length === 0 ? (
        <EmptyState
          title="No audition invitations yet"
          description="When casting directors shortlist your profile for a role, your audition script sides and self-tape requests will appear here."
          iconName="Video"
          actionLabel="Explore Live Opportunities"
          actionHref="/talent/opportunities"
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {myAuditions.map((aud) => {
            const opp = getOpportunity(aud.opportunityId);
            const project = opp ? getProject(opp.projectId) : null;

            const isPendingUpload = aud.status === "Relayed to Talent";
            const isReceived = aud.status === "Self-tape Received";
            const isForwarded = aud.status === "Forwarded to Organization";

            const isUploadOpen = activeUploadId === aud.id || isPendingUpload;

            return (
              <div
                key={aud.id}
                className="card-surface"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: isPendingUpload ? "1.5px solid #8A6B2E" : "1px solid #E8E2D4",
                  borderRadius: "18px",
                  padding: "clamp(18px, 3vw, 26px) clamp(18px, 3.5vw, 28px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                  boxShadow: "0 2px 4px rgba(43, 45, 42, 0.04), 0 12px 28px rgba(43, 45, 42, 0.06)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Pending Upload Top Highlight */}
                {isPendingUpload && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "4px",
                      background: "var(--gold)",
                    }}
                  />
                )}

                {/* Header: Opportunity Title, Type, Status */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: "0.725rem",
                          fontWeight: "700",
                          padding: "3px 10px",
                          borderRadius: "4px",
                          backgroundColor: "var(--bg-alt)",
                          color: "var(--gold)",
                          border: "1px solid var(--border-color)",
                          textTransform: "uppercase",
                        }}
                      >
                        {aud.type || "Audition"}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Ref: #{aud.id}
                      </span>
                    </div>

                    <h3 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(1.1rem, 2.5vw, 1.25rem)", fontWeight: "700", color: "var(--text-primary)", margin: "4px 0 0 0", overflowWrap: "anywhere" }}>
                      {opp?.title || "Opportunity Audition"}
                    </h3>

                    {project && (
                      <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        Project: <strong style={{ color: "var(--text-primary)" }}>{project.title}</strong>
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "6px" }}>
                    <StatusBadge status={aud.status} size="md" />
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Requested {new Date(aud.requestedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* Audition Note / Script Sides Instructions */}
                <div
                  style={{
                    backgroundColor: "var(--bg-alt)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    padding: "16px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <FileText size={15} style={{ color: "var(--gold)" }} />
                    <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Audition Instructions &amp; Sides
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.55, overflowWrap: "anywhere" }}>
                    {aud.note || "Please record your audition self-tape and upload via the form below."}
                  </p>
                </div>

                {/* Status-specific Information Boxes */}
                {isReceived && (
                  <div
                    style={{
                      backgroundColor: "#EFF2EC",
                      border: "1px solid #D1DCC8",
                      borderRadius: "6px",
                      padding: "14px 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <CheckCircle2 size={20} style={{ color: "var(--gold)", flexShrink: 0 }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "var(--text-primary)" }}>
                        Self-tape Received by Vismaya Desk
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", overflowWrap: "anywhere" }}>
                        Your tape is currently being quality-checked by the Vismaya moderation team before being forwarded to the casting director.
                      </span>
                    </div>
                  </div>
                )}

                {isForwarded && (
                  <div
                    style={{
                      backgroundColor: "var(--bg-alt)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                      padding: "14px 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <Sparkles size={20} style={{ color: "var(--gold)", flexShrink: 0 }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "var(--gold)" }}>
                        Forwarded to Organization
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", overflowWrap: "anywhere" }}>
                        Your verified tape has been forwarded to the organization&apos;s casting desk for review and callback consideration.
                      </span>
                    </div>
                  </div>
                )}

                {/* Submitted Video Player Section (When already submitted or forwarded) */}
                {(isReceived || isForwarded) && aud.selfTapeUrl && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Video size={16} style={{ color: "var(--gold)" }} />
                      <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-primary)" }}>
                        Submitted Self-Tape Recording:
                      </span>
                    </div>
                    <VideoPlayer
                      src={aud.selfTapeUrl}
                      height="clamp(180px, 35vw, 260px)"
                      fileName={selectedFiles[aud.id]?.fileName || "Self-Tape-Audition.mp4"}
                    />
                  </div>
                )}

                {/* Self-Tape Upload Area */}
                {(isPendingUpload || isReceived) && (
                  <div
                    style={{
                      backgroundColor: "var(--bg-alt)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                      padding: "clamp(16px, 2.5vw, 20px) clamp(16px, 3vw, 22px)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      width: "100%",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Video size={18} style={{ color: "var(--gold)" }} />
                        <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                          {isReceived ? "Re-upload / Update Self-Tape" : "Submit Audition Self-Tape"}
                        </h4>
                      </div>

                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        MP4, MOV, WEBM (Video only)
                      </span>
                    </div>

                    {/* File Picker Strip */}
                    <div
                      style={{
                        backgroundColor: "var(--bg-surface)",
                        border: "1px dashed var(--gold)",
                        borderRadius: "6px",
                        padding: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "12px",
                        width: "100%",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "6px",
                            backgroundColor: "var(--bg-alt)",
                            border: "1px solid var(--border-color)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--gold)",
                            flexShrink: 0,
                          }}
                        >
                          <Upload size={18} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "var(--text-primary)", display: "block", overflowWrap: "anywhere" }}>
                            {selectedFiles[aud.id]?.fileName || (aud.selfTapeUrl ? "Current: Verified-Self-Tape.mp4" : "Choose audition video file")}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {selectedFiles[aud.id]?.fileSize ? `File size: ${selectedFiles[aud.id].fileSize} • Video validated` : "High-definition landscape recording recommended"}
                          </span>
                        </div>
                      </div>

                      <label
                        style={{
                          padding: "8px 16px",
                          minHeight: "38px",
                          borderRadius: "4px",
                          backgroundColor: "var(--bg-alt)",
                          border: "1px solid var(--border-color)",
                          color: "var(--text-primary)",
                          fontSize: "0.825rem",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          transition: "all var(--transition)",
                        }}
                      >
                        <input
                          type="file"
                          accept="video/*"
                          style={{ display: "none" }}
                          onChange={(e) => handleFileSelect(aud.id, e)}
                        />
                        <span>{selectedFiles[aud.id] ? "Change Video" : "Browse Video"}</span>
                      </label>
                    </div>

                    {/* File validation error if any */}
                    {fileErrorMap[aud.id] && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--danger)", fontSize: "0.8rem" }}>
                        <AlertCircle size={14} />
                        <span>{fileErrorMap[aud.id]}</span>
                      </div>
                    )}

                    {/* Local Preview before submitting */}
                    {selectedFiles[aud.id]?.previewUrl && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          Selected Video Preview:
                        </span>
                        <VideoPlayer
                          src={selectedFiles[aud.id].previewUrl}
                          fileName={selectedFiles[aud.id].fileName}
                          height="clamp(180px, 35vw, 240px)"
                        />
                      </div>
                    )}

                    {/* Optional Note to Casting Director */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>
                        Notes / Slate Comments (Optional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Mention take number, lighting setup, or dialect context..."
                        value={auditionNotes[aud.id] || ""}
                        onChange={(e) =>
                          setAuditionNotes((prev) => ({ ...prev, [aud.id]: e.target.value }))
                        }
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          backgroundColor: "var(--bg-surface)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "4px",
                          color: "var(--text-primary)",
                          fontSize: "0.875rem",
                          outline: "none",
                          resize: "vertical",
                        }}
                      />
                    </div>

                    {/* Submit Button & Vismaya routing note */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", paddingTop: "6px" }}>
                      <span style={{ fontSize: "0.785rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                        &bull; Your self-tape is sent through Vismaya
                      </span>

                      <button
                        onClick={() => handleSubmitTape(aud.id)}
                        disabled={isSubmittingMap[aud.id]}
                        className="btn-primary"
                        style={{
                          padding: "8px 20px",
                          minHeight: "38px",
                          fontSize: "0.85rem",
                          borderRadius: "4px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {isSubmittingMap[aud.id] ? (
                          <span>Uploading Video...</span>
                        ) : (
                          <>
                            <span>{isReceived ? "Update Self-Tape" : "Submit Self-Tape"}</span>
                            <Send size={15} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
