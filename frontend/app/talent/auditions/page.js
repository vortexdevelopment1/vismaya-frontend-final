"use client";

import React, { useState, useEffect } from "react";
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
import { mediaService } from "@/lib/api/services/mediaService";
import { useAuth } from "@/context/AuthContext";
import { isRealMode } from "@/lib/api/config";
import { talentService } from "@/lib/api/services/talentService";
import { AUDITION_CONFIG } from "@/lib/config/audition";

export default function TalentAuditionsPage() {
  const { user } = useAuth();
  const { profile, addToast } = useTalent();
  const workflow = useWorkflow();
  const { getOpportunity, getProject, submitSelfTape } = workflow;

  const [realAuditions, setRealAuditions] = useState([]);
  const [loadingReal, setLoadingReal] = useState(() => isRealMode("talent"));

  const loadAuditions = async () => {
    if (!isRealMode("talent")) return;
    try {
      const res = await talentService.getMyAuditions();
      if (res && Array.isArray(res.data)) {
        setRealAuditions(res.data);
      }
    } catch (err) {
      console.warn("Could not load talent auditions:", err);
    } finally {
      setLoadingReal(false);
    }
  };

  useEffect(() => {
    loadAuditions();
  }, []);

  const currentTalentId = user?.id || user?._id || profile?.id || profile?._id || profile?.userId || (!isRealMode("talent") ? "tal-904" : "");
  const myAuditions = isRealMode("talent") ? realAuditions : (workflow.auditions || []).filter((a) => a.talentId === currentTalentId);
  const isHydrated = isRealMode("talent") ? !loadingReal : workflow.isHydrated;

  // Form states per audition card
  const [activeUploadId, setActiveUploadId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({}); // { [audId]: [ { file, previewUrl, fileName, fileSize, bytes, duration, durationKnown } ] }
  const [auditionNotes, setAuditionNotes] = useState({});
  const [isSubmittingMap, setIsSubmittingMap] = useState({});
  const [fileErrorMap, setFileErrorMap] = useState({});
  const [uploadProgressMap, setUploadProgressMap] = useState({});
  const [activePreviewTakeMap, setActivePreviewTakeMap] = useState({});

  const readVideoDuration = (file) =>
    new Promise((resolve) => {
      try {
        const url = URL.createObjectURL(file);
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(url);
          resolve(video.duration);
        };
        video.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(null);
        };
        video.src = url;
      } catch {
        resolve(null);
      }
    });

  const handleFileSelect = async (audId, e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    if (rawFiles.length > AUDITION_CONFIG.SELF_TAPE_MAX_VIDEOS_PER_AUDITION) {
      setFileErrorMap((prev) => ({
        ...prev,
        [audId]: `You can upload up to ${AUDITION_CONFIG.SELF_TAPE_MAX_VIDEOS_PER_AUDITION} video`,
      }));
      return;
    }

    const file = rawFiles[0];
    const maxBytes = AUDITION_CONFIG.SELF_TAPE_MAX_FILE_MB * 1024 * 1024;
    const maxDurationSec = AUDITION_CONFIG.SELF_TAPE_MAX_DURATION_MIN * 60;

    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const isAllowedExt = ["mp4", "mov", "webm"].includes(ext);
    const isAllowedMime = (AUDITION_CONFIG.SELF_TAPE_ALLOWED_TYPES || []).includes(file.type);

    if (!isAllowedExt && !isAllowedMime) {
      setFileErrorMap((prev) => ({
        ...prev,
        [audId]: "Only MP4, MOV or WebM files are allowed",
      }));
      return;
    }

    if (file.size > maxBytes) {
      setFileErrorMap((prev) => ({
        ...prev,
        [audId]: `File is too large. Maximum is ${AUDITION_CONFIG.SELF_TAPE_MAX_FILE_MB} MB`,
      }));
      return;
    }

    const duration = await readVideoDuration(file);
    if (duration && duration > maxDurationSec) {
      setFileErrorMap((prev) => ({
        ...prev,
        [audId]: `Video duration exceeds maximum of ${AUDITION_CONFIG.SELF_TAPE_MAX_DURATION_MIN} minutes`,
      }));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    const processed = [{
      file,
      previewUrl,
      fileName: file.name,
      fileSize: `${sizeInMb} MB`,
      bytes: file.size,
      duration: duration ? Math.round(duration) : undefined,
      durationKnown: duration !== null,
    }];

    setFileErrorMap((prev) => ({ ...prev, [audId]: null }));
    setSelectedFiles((prev) => ({ ...prev, [audId]: processed }));
    addToast({
      type: "info",
      title: "Video Loaded",
      message: `${file.name} selected. Ready to submit.`,
    });
  };

  const handleSubmitTape = async (audId) => {
    const fileList = selectedFiles[audId];
    if (!fileList || fileList.length === 0) {
      addToast({
        type: "warning",
        title: "Video File Required",
        message: "Please select an audition video file before submitting.",
      });
      return;
    }

    setIsSubmittingMap((prev) => ({ ...prev, [audId]: true }));
    setUploadProgressMap((prev) => ({ ...prev, [audId]: 15 }));

    const note = auditionNotes[audId] || "Self-tape recorded and submitted as per script sides.";

    try {
      const item = fileList[0];
      setUploadProgressMap((prev) => ({ ...prev, [audId]: 40 }));
      const uploaded = await mediaService.uploadFile(item.file, { folder: "vismaya/self-tapes" });
      setUploadProgressMap((prev) => ({ ...prev, [audId]: 85 }));

      const payload = {
        videoUrl: uploaded.url,
        videoUrls: [uploaded.url],
        videos: [{
          videoUrl: uploaded.url,
          thumbnailUrl: uploaded.thumbnailUrl,
          durationSeconds: uploaded.duration || item.duration,
          fileSizeBytes: uploaded.bytes || item.bytes,
          fileName: item.fileName,
        }],
        thumbnailUrl: uploaded.thumbnailUrl,
        durationSeconds: uploaded.duration || item.duration,
        fileSizeBytes: uploaded.bytes || item.bytes,
        notes: note,
      };

      if (isRealMode("talent") || isRealMode("auditions")) {
        const res = await talentService.submitSelfTape(audId, payload);
        if (res?.success) {
          await loadAuditions();
        } else {
          throw new Error(res?.message || "Failed to submit self-tape");
        }
      } else {
        await submitSelfTape(audId, payload.videoUrl, note, payload);
      }

      setUploadProgressMap((prev) => ({ ...prev, [audId]: 100 }));
      addToast({
        type: "success",
        title: "Self-Tape Submitted!",
        message: "Your self-tape was uploaded and is now under Vismaya review.",
      });
      setActiveUploadId(null);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Could not submit your self-tape. Please try again.";
      setFileErrorMap((prev) => ({ ...prev, [audId]: msg }));
      addToast({
        type: "danger",
        title: "Upload Failed",
        message: msg,
      });
    } finally {
      setIsSubmittingMap((prev) => ({ ...prev, [audId]: false }));
      setTimeout(() => {
        setUploadProgressMap((prev) => ({ ...prev, [audId]: 0 }));
      }, 1000);
    }
  };

  return (
    <div className="talent-auditions-root" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
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
        className="card-surface aud-security-banner"
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
        <div className="aud-security-left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <ShieldCheck size={24} className="aud-security-icon" style={{ color: "#8A6B2E", flexShrink: 0 }} />
          <div className="aud-security-content">
            <span className="aud-security-title" style={{ fontSize: "14px", fontWeight: "700", color: "#2B2D2A", display: "block", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
              Your self-tape is sent through Vismaya
            </span>
            <span className="aud-security-desc" style={{ fontSize: "13px", color: "#5A584F", fontFamily: "var(--font-body), 'Inter', sans-serif" }}>
              All auditions and video callbacks are reviewed and verified by Vismaya before relay to casting teams to guarantee artist privacy.
            </span>
          </div>
        </div>

        <Link
          href="/talent/portfolio"
          className="aud-portfolio-btn"
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
            <div key={i} className="card-surface aud-skeleton-card" style={{ padding: "28px", height: "240px", borderRadius: "18px", backgroundColor: "#FFFFFF", border: "1px solid #E8E2D4" }}>
              <Skeleton width="40%" height="24px" />
              <Skeleton width="80%" height="16px" style={{ marginTop: "12px" }} />
              <Skeleton width="60%" height="16px" style={{ marginTop: "8px" }} />
            </div>
          ))}
        </div>
      ) : myAuditions.length === 0 ? (
        <div className="aud-empty-wrap">
          <EmptyState
            title="No audition invitations yet"
            description="When casting directors shortlist your profile for a role, your audition script sides and self-tape requests will appear here."
            iconName="Video"
            actionLabel="Explore Live Opportunities"
            actionHref="/talent/opportunities"
          />
        </div>
      ) : (
        <div className="aud-cards-list" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {myAuditions.map((aud) => {
            const opp = getOpportunity(aud.opportunityId);
            const project = opp ? getProject(opp.projectId) : null;

            const rawStatus = (aud.rawStatus || aud.status || "").toLowerCase().replace(/\s+/g, "_");
            const isPastDeadline = aud.deadline && new Date() > new Date(aud.deadline);
            const isSubmitted = rawStatus === "submitted" || rawStatus === "self_tape_received" || aud.status === "Submitted" || aud.status === "Self-tape Received" || Boolean(aud.selfTapeSubmission?.submittedAt);
            const isForwarded = rawStatus === "forwarded_to_org" || aud.status === "Forwarded to Organization" || aud.status === "Forwarded to Org";
            const isRejected = rawStatus === "rejected" || aud.status === "Rejected" || aud.vismayaApproval === "rejected";
            const isRequested = (rawStatus === "requested" || aud.status === "Audition Requested" || aud.status === "Requested" || aud.status === "Relayed to Talent") && !isSubmitted && !isRejected;
            const isSelfTape = (aud.type || "").toLowerCase().includes("tape") || aud.type === "self_tape" || aud.type === "Audition";

            // One submission only: after the talent submits, there is no replace and no second upload.
            const canUpload = isSelfTape && isRequested && !isSubmitted && !isPastDeadline && !isForwarded && !isRejected;
            const isUploadOpen = canUpload;

            // Extract primary video
            const submittedVideo = aud.selfTapeSubmission?.videos?.[0]
              || (aud.selfTapeSubmission?.videoUrl ? { videoUrl: aud.selfTapeSubmission.videoUrl, fileName: "Self-Tape-Audition.mp4" } : null)
              || (aud.selfTapeUrl ? { videoUrl: aud.selfTapeUrl, fileName: "Self-Tape-Audition.mp4" } : null);
            const currentSubmittedSrc = submittedVideo?.videoUrl || "";

            return (
              <div
                key={aud.id}
                className="card-surface aud-card-root"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: isRequested ? "1.5px solid #8A6B2E" : "1px solid #E8E2D4",
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
                {/* Header Strip */}
                {isRequested && (
                  <div
                    className="aud-card-highlight-strip"
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
                <div
                  className="aud-card-header"
                  style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}
                >
                  <div className="aud-card-header-left" style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0, flex: 1 }}>
                    <div className="aud-card-meta-row-1" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span
                        className="aud-card-type-pill"
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
                        {isSelfTape ? "Video Self-Tape" : (aud.type || "Audition")}
                      </span>
                      <span className="aud-card-ref" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Ref: #{aud.id}
                      </span>
                    </div>

                    <h3
                      className="aud-card-title"
                      style={{ fontFamily: "Georgia, serif", fontSize: "clamp(1.1rem, 2.5vw, 1.25rem)", fontWeight: "700", color: "var(--text-primary)", margin: "4px 0 0 0", overflowWrap: "anywhere" }}
                    >
                      {opp?.title || aud.opportunityTitle || "Opportunity Audition"}
                    </h3>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      <span>Role: <strong style={{ color: "var(--text-primary)" }}>{aud.role || opp?.role || "Lead Role"}</strong></span>
                      {(aud.projectName || project?.title) && (
                        <span>&bull; Project: <strong style={{ color: "var(--text-primary)" }}>{aud.projectName || project?.title}</strong></span>
                      )}
                      {aud.organizationName && (
                        <span>&bull; Org: <strong style={{ color: "var(--gold)" }}>{aud.organizationName}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="aud-card-header-right" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                    {isSubmitted ? (
                      <span style={{ fontSize: "0.785rem", fontWeight: 700, padding: "4px 10px", borderRadius: "6px", background: "rgba(138, 107, 46, 0.12)", color: "#6E5420", border: "1px solid rgba(138, 107, 46, 0.25)" }}>
                        Submitted - under Vismaya review
                      </span>
                    ) : isRejected ? (
                      <span style={{ fontSize: "0.785rem", fontWeight: 700, padding: "4px 10px", borderRadius: "6px", background: "rgba(180, 35, 24, 0.08)", color: "#B42318", border: "1px solid rgba(180, 35, 24, 0.25)" }}>
                        Rejected
                      </span>
                    ) : isPastDeadline ? (
                      <span style={{ fontSize: "0.785rem", fontWeight: 700, padding: "4px 10px", borderRadius: "6px", background: "rgba(180, 35, 24, 0.08)", color: "#B42318", border: "1px solid rgba(180, 35, 24, 0.25)" }}>
                        Submission closed
                      </span>
                    ) : (
                      <StatusBadge status={aud.status} size="md" />
                    )}

                    <span className="aud-card-requested-date" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {isSelfTape
                        ? `Self-tape requested, submit by ${aud.deadline ? new Date(aud.deadline).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "TBD"}`
                        : aud.scheduledAt
                        ? `Scheduled: ${new Date(aud.scheduledAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                        : `Requested ${new Date(aud.requestedAt || aud.createdAt || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`}
                    </span>
                  </div>
                </div>

                {/* Live Audition Details if any legacy live audition */}
                {!isSelfTape && (aud.meetingLink || aud.location) && (
                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "0.85rem", color: "var(--text-secondary)", background: "var(--bg-alt)", padding: "10px 16px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                    {aud.meetingLink && (
                      <div>
                        <strong>Meeting Link: </strong>
                        <a href={aud.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)", textDecoration: "underline" }}>
                          {aud.meetingLink}
                        </a>
                      </div>
                    )}
                    {aud.location && (
                      <div>
                        <strong>Venue / Location: </strong>
                        <span>{aud.location}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Instructions & Script Sides */}
                <div
                  className="aud-instructions-box"
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
                    <FileText size={15} className="aud-instructions-icon" style={{ color: "var(--gold)" }} />
                    <span className="aud-instructions-heading" style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Audition Instructions &amp; Sides
                    </span>
                  </div>
                  <p className="aud-instructions-text" style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.55, overflowWrap: "anywhere" }}>
                    {aud.instructions || aud.note || aud.sceneBrief || "Please record your audition self-tape and upload via the form below."}
                  </p>
                  {aud.scriptUrl && (
                    <div style={{ marginTop: "4px" }}>
                      <a href={aud.scriptUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)", textDecoration: "underline", fontSize: "0.825rem", fontWeight: 600 }}>
                        Download / View Script Sides &rarr;
                      </a>
                    </div>
                  )}
                </div>

                {/* Rejection Banner if rejected by Vismaya */}
                {isRejected && (
                  <div
                    style={{
                      backgroundColor: "rgba(180, 35, 24, 0.06)",
                      border: "1px solid rgba(180, 35, 24, 0.25)",
                      borderRadius: "6px",
                      padding: "14px 18px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#B42318" }}>
                      Vismaya Moderation Notice (Self-Tape Rejected):
                    </span>
                    <span style={{ fontSize: "0.825rem", color: "#5A584F", lineHeight: 1.5 }}>
                      {aud.vismayaRejectionReason || "Your self-tape submission does not meet guidelines. Resubmissions are not permitted."}
                    </span>
                  </div>
                )}

                {/* Submitted video player section (One submission only, no replacement) */}
                {isSubmitted && currentSubmittedSrc && (
                  <div className="aud-recording-section" style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Video size={16} className="aud-recording-icon" style={{ color: "var(--gold)" }} />
                      <span className="aud-recording-label" style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-primary)" }}>
                        Submitted Self-Tape Recording:
                      </span>
                    </div>
                    <VideoPlayer
                      src={currentSubmittedSrc}
                      height="clamp(180px, 35vw, 260px)"
                      fileName={submittedVideo?.fileName || "Self-Tape-Audition.mp4"}
                      className="aud-video-player"
                    />
                  </div>
                )}

                {/* Forwarded to Org notice */}
                {isForwarded && (
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
                    <CheckCircle2 size={20} style={{ color: "#2B5E3B", flexShrink: 0 }} />
                    <div>
                      <strong style={{ fontSize: "0.875rem", color: "#2B2D2A", display: "block" }}>
                        Approved &amp; Relayed to Organization
                      </strong>
                      <span style={{ fontSize: "0.8rem", color: "#5A584F" }}>
                        Vismaya moderation has verified your tape and relayed it to the casting directors for review.
                      </span>
                    </div>
                  </div>
                )}

                {/* Upload Control Area */}
                {canUpload && isUploadOpen && (
                  <div
                    className="aud-upload-area"
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
                    <div className="aud-upload-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Video size={18} className="aud-upload-icon" style={{ color: "var(--gold)" }} />
                        <h4 className="aud-upload-heading" style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                          Submit Audition Self-Tape
                        </h4>
                      </div>

                      <span className="aud-upload-hint" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        MP4, MOV, WEBM (Max {AUDITION_CONFIG.SELF_TAPE_MAX_FILE_MB} MB, 1 video)
                      </span>
                    </div>

                    {/* File Picker Strip */}
                    <div
                      className="aud-picker-strip"
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
                      <div className="aud-picker-left" style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                        <div
                          className="aud-picker-icon-box"
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
                          <span className="aud-picker-file-name" style={{ fontSize: "0.875rem", fontWeight: "700", color: "var(--text-primary)", display: "block", overflowWrap: "anywhere" }}>
                            {selectedFiles[aud.id]?.length
                              ? selectedFiles[aud.id][0].fileName
                              : "Choose audition video file"}
                          </span>
                          <span className="aud-picker-file-meta" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {selectedFiles[aud.id]?.length
                              ? `${selectedFiles[aud.id][0].fileSize} • Ready to upload`
                              : `Max ${AUDITION_CONFIG.SELF_TAPE_MAX_FILE_MB} MB • Max ${AUDITION_CONFIG.SELF_TAPE_MAX_DURATION_MIN} min duration`}
                          </span>
                        </div>
                      </div>

                      <label
                        className="aud-picker-browse-btn"
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
                        }}
                      >
                        <input
                          type="file"
                          accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                          style={{ display: "none" }}
                          onChange={(e) => handleFileSelect(aud.id, e)}
                        />
                        <span>{selectedFiles[aud.id]?.length ? "Change Video" : "Browse Video"}</span>
                      </label>
                    </div>

                    {/* File validation error if any */}
                    {fileErrorMap[aud.id] && (
                      <div className="aud-error-msg" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--danger)", fontSize: "0.8rem" }}>
                        <AlertCircle size={14} />
                        <span>{fileErrorMap[aud.id]}</span>
                      </div>
                    )}

                    {/* Upload progress bar */}
                    {uploadProgressMap[aud.id] > 0 && (
                      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          <span>Uploading self-tape...</span>
                          <span>{uploadProgressMap[aud.id]}%</span>
                        </div>
                        <div style={{ width: "100%", height: "6px", background: "#E8E2D4", borderRadius: "3px", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${uploadProgressMap[aud.id]}%`,
                              height: "100%",
                              background: "var(--gold)",
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Local Preview of selected files */}
                    {selectedFiles[aud.id]?.length > 0 && (
                      <div className="aud-local-preview-section" style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                        <span className="aud-local-preview-label" style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          Selected Video Preview:
                        </span>
                        <VideoPlayer
                          src={selectedFiles[aud.id][0].previewUrl}
                          fileName={selectedFiles[aud.id][0].fileName}
                          height="clamp(180px, 35vw, 240px)"
                          className="aud-local-video-player"
                        />
                      </div>
                    )}

                    {/* Optional Note to Casting Director */}
                    <div className="aud-notes-field">
                      <label className="aud-textarea-label" style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>
                        Notes / Slate Comments (Optional)
                      </label>
                      <textarea
                        className="aud-textarea"
                        rows={2}
                        placeholder="Mention take details, dialect nuance, or lighting setup..."
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
                    <div className="aud-submit-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", paddingTop: "6px" }}>
                      <span className="aud-submit-badge" style={{ fontSize: "0.785rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                        &bull; Your self-tape is sent through Vismaya for verification before relay
                      </span>

                      <button
                        onClick={() => handleSubmitTape(aud.id)}
                        disabled={isSubmittingMap[aud.id] || !selectedFiles[aud.id]?.length}
                        className="btn-primary aud-submit-btn"
                        style={{
                          padding: "8px 20px",
                          minHeight: "38px",
                          fontSize: "0.85rem",
                          borderRadius: "4px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: (isSubmittingMap[aud.id] || !selectedFiles[aud.id]?.length) ? "not-allowed" : "pointer",
                          opacity: (isSubmittingMap[aud.id] || !selectedFiles[aud.id]?.length) ? 0.6 : 1,
                        }}
                      >
                        {isSubmittingMap[aud.id] ? (
                          <span>Uploading Video...</span>
                        ) : (
                          <>
                            <span>Submit Self-Tape</span>
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

      <style jsx>{`
        @media (max-width: 640px) {
          /* Root and Header */
          .talent-auditions-root {
            gap: 12px !important;
          }
          .talent-auditions-root :global(.page-header-container) {
            margin-bottom: 0px !important;
            gap: 8px !important;
          }
          .talent-auditions-root :global(.page-header-title-row) {
            gap: 8px !important;
            align-items: center !important;
          }
          .talent-auditions-root :global(.page-header-title) {
            font-size: 22px !important;
            line-height: 1.25 !important;
            font-family: var(--font-heading), 'Playfair Display', Georgia, serif !important;
            color: #2B2D2A !important;
          }
          .talent-auditions-root :global(.page-header-badge) {
            font-size: 10.5px !important;
            padding: 3px 8px !important;
            letter-spacing: 0.08em !important;
            background-color: #F3EFE6 !important;
            color: #6E5420 !important;
            border: 1px solid #E8E2D4 !important;
          }
          .talent-auditions-root :global(.page-header-subtitle) {
            font-size: 13px !important;
            line-height: 1.5 !important;
            color: #5A584F !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 3 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          }

          /* B. Info Banner */
          .aud-security-banner {
            padding: 12px !important;
            border-radius: 12px !important;
            gap: 10px !important;
            flex-direction: column !important;
            align-items: stretch !important;
            background-color: #F3EFE6 !important;
            border: 1px solid #E8E2D4 !important;
          }
          .aud-security-left {
            display: flex !important;
            align-items: flex-start !important;
            gap: 10px !important;
            width: 100% !important;
          }
          .aud-security-icon {
            width: 24px !important;
            height: 24px !important;
            min-width: 24px !important;
            color: #8A6B2E !important;
            margin-top: 1px !important;
          }
          .aud-security-title {
            font-size: 13.5px !important;
            line-height: 1.35 !important;
            font-weight: 700 !important;
            color: #2B2D2A !important;
            margin-bottom: 2px !important;
          }
          .aud-security-desc {
            font-size: 12px !important;
            line-height: 1.45 !important;
            color: #5A584F !important;
            display: block !important;
          }
          .aud-portfolio-btn {
            height: 38px !important;
            min-height: 38px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            padding: 0 14px !important;
            border-radius: 6px !important;
            border: 1px solid #8A6B2E !important;
            color: #8A6B2E !important;
            background-color: #FFFFFF !important;
            align-self: flex-start !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            margin-left: 34px !important;
          }

          /* Cards List */
          .aud-cards-list {
            gap: 12px !important;
          }

          /* C. Audition Card */
          .aud-card-root {
            display: flex !important;
            flex-direction: column !important;
            padding: 14px !important;
            border-radius: 14px !important;
            gap: 10px !important;
            border: 1px solid #E8E2D4 !important;
            background-color: #FFFFFF !important;
            box-shadow: 0 2px 8px rgba(43, 45, 42, 0.04) !important;
            width: 100% !important;
          }
          .aud-card-highlight-strip {
            height: 3px !important;
            background: #8A6B2E !important;
          }
          .aud-card-header {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) auto !important;
            row-gap: 5px !important;
            column-gap: 10px !important;
            align-items: center !important;
            width: 100% !important;
          }
          .aud-card-header-left,
          .aud-card-meta-row-1,
          .aud-card-header-right {
            display: contents !important;
          }
          .aud-card-type-pill {
            grid-row: 1 !important;
            grid-column: 1 !important;
            justify-self: start !important;
            height: 24px !important;
            min-height: 24px !important;
            line-height: 22px !important;
            font-size: 10px !important;
            font-weight: 700 !important;
            padding: 0 8px !important;
            border-radius: 4px !important;
            background-color: #F3EFE6 !important;
            color: #8A6B2E !important;
            border: 1px solid #E8E2D4 !important;
            white-space: nowrap !important;
            text-transform: uppercase !important;
            letter-spacing: 0.06em !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .aud-card-header-right :global(.status-badge) {
            grid-row: 1 !important;
            grid-column: 2 !important;
            justify-self: end !important;
            height: 24px !important;
            min-height: 24px !important;
            font-size: 10px !important;
            padding: 0 8px !important;
            white-space: nowrap !important;
            line-height: 1 !important;
            display: inline-flex !important;
            align-items: center !important;
            max-width: 100% !important;
          }
          .aud-card-ref {
            grid-row: 2 !important;
            grid-column: 1 !important;
            justify-self: start !important;
            font-size: 11px !important;
            color: #5A584F !important;
            white-space: nowrap !important;
            line-height: 1.2 !important;
          }
          .aud-card-requested-date {
            grid-row: 2 !important;
            grid-column: 2 !important;
            justify-self: end !important;
            font-size: 11px !important;
            color: #5A584F !important;
            white-space: nowrap !important;
            line-height: 1.2 !important;
          }
          .aud-card-title {
            grid-row: 3 !important;
            grid-column: 1 / -1 !important;
            width: 100% !important;
            font-family: var(--font-heading), 'Playfair Display', Georgia, serif !important;
            font-size: 17px !important;
            line-height: 1.25 !important;
            font-weight: 600 !important;
            color: #2B2D2A !important;
            margin: 3px 0 0 0 !important;
            text-align: left !important;
            overflow-wrap: break-word !important;
            word-break: normal !important;
            hyphens: none !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 3 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          }
          .aud-card-project {
            grid-row: 4 !important;
            grid-column: 1 / -1 !important;
            width: 100% !important;
            font-size: 12.5px !important;
            line-height: 1.4 !important;
            color: #5A584F !important;
            margin: 1px 0 0 0 !important;
            display: block !important;
            overflow-wrap: break-word !important;
            word-break: normal !important;
          }
          .aud-card-project strong {
            color: #2B2D2A !important;
          }

          /* D. Inside the Card */
          .aud-instructions-box {
            padding: 10px 12px !important;
            border-radius: 8px !important;
            background-color: #F3EFE6 !important;
            border: 1px solid #E8E2D4 !important;
            gap: 4px !important;
          }
          .aud-instructions-icon {
            width: 14px !important;
            height: 14px !important;
            color: #8A6B2E !important;
          }
          .aud-instructions-heading {
            font-size: 10.5px !important;
            font-weight: 700 !important;
            color: #8A6B2E !important;
            letter-spacing: 0.04em !important;
            text-transform: uppercase !important;
          }
          .aud-instructions-text {
            font-size: 12.5px !important;
            line-height: 1.5 !important;
            color: #5A584F !important;
          }

          .aud-status-box {
            padding: 10px 12px !important;
            border-radius: 8px !important;
            gap: 8px !important;
            display: flex !important;
            align-items: flex-start !important;
            background-color: #F3EFE6 !important;
            border: 1px solid #E8E2D4 !important;
          }
          .aud-status-box :global(.aud-status-icon) {
            width: 18px !important;
            height: 18px !important;
            min-width: 18px !important;
            margin-top: 1px !important;
            color: #8A6B2E !important;
          }
          .aud-status-title {
            font-size: 13px !important;
            font-weight: 700 !important;
            color: #2B2D2A !important;
            line-height: 1.3 !important;
          }
          .aud-status-desc {
            font-size: 12px !important;
            line-height: 1.4 !important;
            color: #5A584F !important;
          }

          .aud-recording-section {
            gap: 6px !important;
          }
          .aud-recording-icon {
            width: 15px !important;
            height: 15px !important;
            color: #8A6B2E !important;
          }
          .aud-recording-label {
            font-size: 12.5px !important;
            color: #2B2D2A !important;
            font-weight: 600 !important;
          }

          /* Upload Area */
          .aud-upload-area {
            padding: 14px !important;
            gap: 12px !important;
            border-radius: 8px !important;
            background-color: #F3EFE6 !important;
            border: 1px solid #E8E2D4 !important;
          }
          .aud-upload-icon {
            width: 16px !important;
            height: 16px !important;
            color: #8A6B2E !important;
          }
          .aud-upload-heading {
            font-size: 13.5px !important;
            font-weight: 700 !important;
            color: #2B2D2A !important;
          }
          .aud-upload-hint {
            font-size: 11px !important;
            color: #5A584F !important;
          }
          .aud-picker-strip {
            padding: 12px !important;
            gap: 10px !important;
            flex-direction: column !important;
            align-items: stretch !important;
            border: 1px dashed #C9A55C !important;
            background-color: #FFFFFF !important;
            border-radius: 6px !important;
          }
          .aud-picker-left {
            width: 100% !important;
            gap: 10px !important;
          }
          .aud-picker-icon-box {
            width: 28px !important;
            height: 28px !important;
            min-width: 28px !important;
            border-radius: 6px !important;
          }
          .aud-picker-icon-box :global(svg) {
            width: 15px !important;
            height: 15px !important;
          }
          .aud-picker-file-name {
            font-size: 12.5px !important;
            line-height: 1.3 !important;
            font-weight: 600 !important;
            color: #2B2D2A !important;
          }
          .aud-picker-file-meta {
            font-size: 11px !important;
            line-height: 1.3 !important;
            color: #5A584F !important;
          }
          .aud-picker-browse-btn {
            width: 100% !important;
            height: 38px !important;
            min-height: 38px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            border-radius: 6px !important;
            background-color: #F3EFE6 !important;
            color: #2B2D2A !important;
            border: 1px solid #E8E2D4 !important;
          }
          .aud-local-preview-section {
            gap: 6px !important;
          }
          .aud-local-preview-label {
            font-size: 11.5px !important;
            color: #8A6B2E !important;
            font-weight: 700 !important;
          }
          .aud-textarea-label {
            font-size: 12px !important;
            color: #5A584F !important;
            margin-bottom: 4px !important;
          }
          .aud-textarea {
            font-size: 16px !important;
            padding: 8px 10px !important;
            border-radius: 6px !important;
            border: 1px solid #E8E2D4 !important;
            background-color: #FFFFFF !important;
            color: #2B2D2A !important;
          }
          .aud-submit-row {
            flex-direction: column-reverse !important;
            align-items: stretch !important;
            gap: 8px !important;
            padding-top: 2px !important;
          }
          .aud-submit-btn {
            width: 100% !important;
            height: 42px !important;
            min-height: 42px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            letter-spacing: 0.04em !important;
            text-transform: uppercase !important;
            border-radius: 8px !important;
            justify-content: center !important;
            background-color: #8A6B2E !important;
            color: #FFFFFF !important;
            border: 1px solid #8A6B2E !important;
          }
          .aud-submit-badge {
            font-size: 11px !important;
            text-align: center !important;
            color: #5A584F !important;
          }

          /* E. Empty State */
          .aud-empty-wrap :global(> div) {
            padding: 24px 16px !important;
            border-radius: 12px !important;
            background-color: #FFFFFF !important;
            border: 1px dashed #E8E2D4 !important;
          }
          .aud-empty-wrap :global(> div > div:first-child) {
            width: 40px !important;
            height: 40px !important;
            margin-bottom: 10px !important;
            background-color: #F3EFE6 !important;
            border-color: #E8E2D4 !important;
            color: #8A6B2E !important;
          }
          .aud-empty-wrap :global(> div > div:first-child svg) {
            width: 20px !important;
            height: 20px !important;
          }
          .aud-empty-wrap :global(h3) {
            font-size: 15px !important;
            margin-bottom: 4px !important;
            color: #2B2D2A !important;
          }
          .aud-empty-wrap :global(p) {
            font-size: 13px !important;
            line-height: 1.45 !important;
            margin-bottom: 14px !important;
            color: #5A584F !important;
          }
          .aud-empty-wrap :global(.btn-primary) {
            min-height: 38px !important;
            height: 38px !important;
            font-size: 12px !important;
            padding: 0 16px !important;
            border-radius: 8px !important;
            background-color: #8A6B2E !important;
          }
        }

        @media (max-width: 400px) {
          .talent-auditions-root :global(.page-header-title) {
            font-size: 20px !important;
          }
          .aud-card-title {
            font-size: 16px !important;
          }
          .aud-portfolio-btn {
            width: 100% !important;
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
