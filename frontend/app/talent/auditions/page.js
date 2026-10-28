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
import { AUDITION_CONFIG, maxResubmissionsAfterRejection } from "@/lib/config/audition";
import ContactVismayaButton from "@/components/shared/ContactVismayaButton";
import { isDeadlineExpired } from "@/lib/shared/dateUtils";

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
  const [statusFilter, setStatusFilter] = useState("all");

  // Filter categorization for chips
  const filterCounts = React.useMemo(() => {
    let actionNeeded = 0;
    let underReview = 0;
    let approved = 0;

    myAuditions.forEach((aud) => {
      const rawStatus = (aud.rawStatus || aud.status || "").toLowerCase().replace(/\s+/g, "_");
      const isPastDeadline = Boolean(aud.isExpired || (aud.deadline && isDeadlineExpired(aud.deadline)));
      const isRejected = rawStatus === "rejected" || aud.status === "Rejected" || aud.vismayaApproval === "rejected";
      const isSubmitted = (rawStatus === "submitted" || rawStatus === "self_tape_received" || aud.status === "Submitted" || aud.status === "Self-tape Received" || Boolean(aud.selfTapeSubmission?.submittedAt)) && !isRejected;
      const isForwarded = (rawStatus === "forwarded_to_org" || aud.status === "Forwarded to Organization" || aud.status === "Forwarded to Org") && !isRejected;
      const isRequested = (rawStatus === "requested" || aud.status === "Audition Requested" || aud.status === "Requested" || aud.status === "Relayed to Talent") && !isSubmitted && !isRejected;

      if (isForwarded) {
        approved++;
      } else if (isSubmitted) {
        underReview++;
      } else if (isRequested || (isRejected && !isPastDeadline)) {
        actionNeeded++;
      }
    });

    return {
      all: myAuditions.length,
      action_needed: actionNeeded,
      under_review: underReview,
      approved: approved,
    };
  }, [myAuditions]);

  const filteredAuditions = React.useMemo(() => {
    if (statusFilter === "all") return myAuditions;
    return myAuditions.filter((aud) => {
      const rawStatus = (aud.rawStatus || aud.status || "").toLowerCase().replace(/\s+/g, "_");
      const isPastDeadline = Boolean(aud.isExpired || (aud.deadline && isDeadlineExpired(aud.deadline)));
      const isRejected = rawStatus === "rejected" || aud.status === "Rejected" || aud.vismayaApproval === "rejected";
      const isSubmitted = (rawStatus === "submitted" || rawStatus === "self_tape_received" || aud.status === "Submitted" || aud.status === "Self-tape Received" || Boolean(aud.selfTapeSubmission?.submittedAt)) && !isRejected;
      const isForwarded = (rawStatus === "forwarded_to_org" || aud.status === "Forwarded to Organization" || aud.status === "Forwarded to Org") && !isRejected;
      const isRequested = (rawStatus === "requested" || aud.status === "Audition Requested" || aud.status === "Requested" || aud.status === "Relayed to Talent") && !isSubmitted && !isRejected;

      if (statusFilter === "action_needed") {
        return isRequested || (isRejected && !isPastDeadline);
      }
      if (statusFilter === "under_review") {
        return isSubmitted;
      }
      if (statusFilter === "approved") {
        return isForwarded;
      }
      return true;
    });
  }, [myAuditions, statusFilter]);

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
    <div className="talent-auditions-root auditions-v2" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <PageHeader
        title="Auditions & Self-Tapes"
        subtitle="Review your invitations and submit self-tapes through Vismaya."
        breadcrumbs={[
          { label: "Talent Dashboard", href: "/talent/dashboard" },
          { label: "Auditions" },
        ]}
      />

      {/* Vismaya Security Channel Banner */}
      <div
        className="aud-info-banner"
      >
        <ShieldCheck size={20} className="aud-info-banner-icon" />
        <div className="aud-info-banner-content">
          <strong className="aud-info-banner-title">
            Sent through Vismaya, always
          </strong>
          <span className="aud-info-banner-desc">
            Every self-tape is reviewed by Vismaya before it reaches casting teams, to protect your privacy.
          </span>
        </div>
      </div>

      {/* Filter Chips */}
      {myAuditions.length > 0 && (
        <div className="aud-filter-chips-row">
          <button
            type="button"
            className={`aud-filter-chip ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            <span>All Auditions</span>
            <span className="aud-filter-badge">{filterCounts.all}</span>
          </button>
          <button
            type="button"
            className={`aud-filter-chip ${statusFilter === "action_needed" ? "active" : ""}`}
            onClick={() => setStatusFilter("action_needed")}
          >
            <span>Action Needed</span>
            <span className="aud-filter-badge">{filterCounts.action_needed}</span>
          </button>
          <button
            type="button"
            className={`aud-filter-chip ${statusFilter === "under_review" ? "active" : ""}`}
            onClick={() => setStatusFilter("under_review")}
          >
            <span>Under Review</span>
            <span className="aud-filter-badge">{filterCounts.under_review}</span>
          </button>
          <button
            type="button"
            className={`aud-filter-chip ${statusFilter === "approved" ? "active" : ""}`}
            onClick={() => setStatusFilter("approved")}
          >
            <span>Approved / Relayed</span>
            <span className="aud-filter-badge">{filterCounts.approved}</span>
          </button>
        </div>
      )}

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
      ) : filteredAuditions.length === 0 ? (
        <div className="aud-empty-wrap">
          <EmptyState
            title="No auditions match this filter"
            description="Try switching tabs to view all auditions and invitations."
            iconName="Video"
            actionLabel="Show All Auditions"
            onAction={() => setStatusFilter("all")}
          />
        </div>
      ) : (
        <div className="aud-cards-list" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {filteredAuditions.map((aud) => {
            const opp = getOpportunity(aud.opportunityId);
            const project = opp ? getProject(opp.projectId) : null;

            const rawStatus = (aud.rawStatus || aud.status || "").toLowerCase().replace(/\s+/g, "_");
            const isPastDeadline = Boolean(aud.isExpired || (aud.deadline && isDeadlineExpired(aud.deadline)));
            const isRejected = rawStatus === "rejected" || aud.status === "Rejected" || aud.vismayaApproval === "rejected";
            const isSubmitted = (rawStatus === "submitted" || rawStatus === "self_tape_received" || aud.status === "Submitted" || aud.status === "Self-tape Received" || Boolean(aud.selfTapeSubmission?.submittedAt)) && !isRejected;
            const isForwarded = (rawStatus === "forwarded_to_org" || aud.status === "Forwarded to Organization" || aud.status === "Forwarded to Org") && !isRejected;
            const isRequested = (rawStatus === "requested" || aud.status === "Audition Requested" || aud.status === "Requested" || aud.status === "Relayed to Talent") && !isSubmitted && !isRejected;
            const isSelfTape = (aud.type || "").toLowerCase().includes("tape") || aud.type === "self_tape" || aud.type === "Audition";

            const resubmissionCount = Number(aud.resubmissionCount || 0);
            const isClosedOrCancelled = aud.status === "cancelled" || aud.status === "completed";
            const canResubmit = isRejected && resubmissionCount < maxResubmissionsAfterRejection && !isPastDeadline && !isClosedOrCancelled;
            const isFinalRejection = isRejected && (resubmissionCount >= maxResubmissionsAfterRejection || isClosedOrCancelled);

            // One submission normally; if rejected, allows exactly one resubmission if limit not reached
            const canUpload = isSelfTape && !isPastDeadline && !isForwarded && ((isRequested && !isSubmitted && !isRejected) || canResubmit);
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
                  border: isRequested ? "1.5px solid #8A6B2E" : "1px solid #E8E1D2",
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
                {/* 1. Top row: flex, justify-content space-between, align-items center, flex-wrap wrap, gap 10px */}
                <div className="aud-card-top-row">
                  <div className="aud-card-type-pill">
                    <Video size={13} style={{ flexShrink: 0 }} />
                    <span>{isSelfTape ? "Video Self-Tape" : (aud.type || "Audition")}</span>
                  </div>

                  <div className="aud-card-status-wrapper">
                    {isForwarded ? (
                      <span className="aud-status-pill pill-approved">
                        Approved &amp; Relayed
                      </span>
                    ) : isSubmitted ? (
                      <span className="aud-status-pill pill-submitted">
                        Submitted - Awaiting Vismaya Review
                      </span>
                    ) : isRejected ? (
                      <span className="aud-status-pill pill-rejected">
                        {isFinalRejection ? "Rejected (Final Decision)" : "Rejected - Resubmission Allowed"}
                      </span>
                    ) : isPastDeadline ? (
                      <span className="aud-status-pill pill-rejected">
                        Expired
                      </span>
                    ) : (
                      <span className="aud-status-pill pill-action">
                        {aud.status || "Action Needed"}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Title: Playfair 24px 600, line-height 1.25, margin 14px 0 */}
                <h3 className="aud-card-title">
                  {opp?.title || aud.opportunityTitle || "Opportunity Audition"}
                </h3>

                {/* 3. Details as a definition list, grid with columns 92px and 1fr, gap 8px 12px */}
                <dl className="aud-card-details-list">
                  <dt className="aud-detail-label">Role</dt>
                  <dd className="aud-detail-value">{aud.role || opp?.role || "Lead Role"}</dd>

                  {(aud.projectName || project?.title) && (
                    <>
                      <dt className="aud-detail-label">Project</dt>
                      <dd className="aud-detail-value">{aud.projectName || project?.title}</dd>
                    </>
                  )}

                  {aud.organizationName && (
                    <>
                      <dt className="aud-detail-label">Organization</dt>
                      <dd className="aud-detail-value" style={{ color: "var(--gold)" }}>{aud.organizationName}</dd>
                    </>
                  )}

                  <dt className="aud-detail-label">
                    {isSelfTape ? "Due by" : "Requested"}
                  </dt>
                  <dd className={`aud-detail-value ${isPastDeadline ? "aud-due-urgent" : ""}`}>
                    {isSelfTape
                      ? (aud.deadline ? new Date(aud.deadline).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "TBD")
                      : aud.scheduledAt
                      ? `Scheduled: ${new Date(aud.scheduledAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                      : new Date(aud.requestedAt || aud.createdAt || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </dd>
                </dl>


                {/* 5. 1px #EFE9DA divider with 16px vertical margin */}
                <div className="aud-card-divider" />

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

                {/* 6. Instructions box: background #F7F3EA, radius 12px, padding 14px 16px, 14px text line-height 1.55; heading row INSTRUCTIONS & SIDES 12px 700 uppercase letter-spacing .06em gold with small document icon */}
                <div className="aud-instructions-box">
                  <div className="aud-instructions-heading-row">
                    <FileText size={14} className="aud-instructions-icon" />
                    <span className="aud-instructions-heading">
                      Instructions &amp; Sides
                    </span>
                  </div>
                  <p className="aud-instructions-text">
                    {aud.instructions || aud.note || aud.sceneBrief || "Please record your audition self-tape and upload via the form below."}
                  </p>
                  {aud.scriptUrl && (
                    <div style={{ marginTop: "6px" }}>
                      <a href={aud.scriptUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)", textDecoration: "underline", fontSize: "13px", fontWeight: 600 }}>
                        Download / View Script Sides &rarr;
                      </a>
                    </div>
                  )}
                </div>

                {/* 7. Submitted video: label 'Your submitted tape' 13px 600 muted, then video element 16/9, radius 12px, object-fit contain on #1E1A14 */}
                {isSubmitted && currentSubmittedSrc && (
                  <div className="aud-submitted-tape-section">
                    <div className="aud-submitted-tape-label">
                      Your submitted tape
                    </div>
                    <div className="aud-video-player-frame">
                      <VideoPlayer
                        src={currentSubmittedSrc}
                        fileName={submittedVideo?.fileName || "Self-Tape-Audition.mp4"}
                        className="aud-custom-video-element"
                      />
                    </div>
                  </div>
                )}

                {/* 8. Status banner at the bottom (flex, gap 12px, radius 12px, padding 14px 16px) */}
                {isForwarded ? (
                  <div className="aud-bottom-status-banner status-banner-approved">
                    <CheckCircle2 size={20} className="status-banner-icon-approved" />
                    <div>
                      <strong className="status-banner-title">
                        Approved &amp; Relayed to Organization
                      </strong>
                      <span className="status-banner-desc">
                        Vismaya moderation has verified your tape and relayed it to the casting directors for review.
                      </span>
                    </div>
                  </div>
                ) : isRejected ? (
                  <div className="aud-bottom-status-banner status-banner-rejected">
                    <AlertCircle size={20} className="status-banner-icon-rejected" />
                    <div>
                      <strong className="status-banner-title" style={{ color: "#A3321F" }}>
                        Vismaya Moderation Notice (Self-Tape Rejected)
                      </strong>
                      <span className="status-banner-desc" style={{ color: "#A3321F" }}>
                        {aud.vismayaRejectionReason || "Your self-tape submission does not meet guidelines."}
                      </span>
                      {canResubmit && (
                        <div style={{ fontSize: "12px", color: "#8A6B2E", fontWeight: 600, marginTop: "4px" }}>
                          You are permitted one resubmission ({resubmissionCount}/{maxResubmissionsAfterRejection} used). Please review the feedback and upload your new self-tape below.
                        </div>
                      )}
                      {isFinalRejection && (
                        <div style={{ fontSize: "12px", color: "#A3321F", fontWeight: 600, marginTop: "4px" }}>
                          Final Decision: Resubmission limit reached ({resubmissionCount}/{maxResubmissionsAfterRejection}).
                        </div>
                      )}
                      <div style={{ marginTop: "8px" }}>
                        <ContactVismayaButton context="Rejected audition tape" reference={aud.id || aud._id} />
                      </div>
                    </div>
                  </div>
                ) : isSubmitted ? (
                  <div className="aud-bottom-status-banner status-banner-submitted">
                    <Clock size={20} className="status-banner-icon-submitted" />
                    <div>
                      <strong className="status-banner-title" style={{ color: "#5E471B" }}>
                        Submitted - under Vismaya review
                      </strong>
                      <span className="status-banner-desc" style={{ color: "#5E471B" }}>
                        Your self-tape has been received. Our team will review the quality before relaying it to the casting directors.
                      </span>
                    </div>
                  </div>
                ) : null}

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
                          {canResubmit ? "Resubmit Audition Self-Tape" : "Submit Audition Self-Tape"}
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

                    {/* Submit Button & Actions */}
                    <div className="aud-action-area">
                      <button
                        onClick={() => handleSubmitTape(aud.id)}
                        disabled={isSubmittingMap[aud.id] || !selectedFiles[aud.id]?.length}
                        className="btn-primary aud-submit-btn"
                      >
                        {isSubmittingMap[aud.id] ? (
                          <span>Uploading Video...</span>
                        ) : (
                          <>
                            <Upload size={18} />
                            <span>Submit Self-Tape</span>
                          </>
                        )}
                      </button>

                      <Link
                        href="/talent/portfolio"
                        className="aud-portfolio-secondary-btn"
                      >
                        <Film size={17} />
                        <span>View Media Portfolio</span>
                      </Link>

                      <span className="aud-submit-badge">
                        &bull; Your self-tape is sent through Vismaya for verification before relay
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        /* Base / Desktop styles scoped to .auditions-v2 */
        .auditions-v2 {
          width: 100%;
          max-width: 100%;
        }

        /* 1. Page Header Scoped Overrides */
        .auditions-v2 :global(.page-header-container) {
          margin-bottom: 0 !important;
        }
        .auditions-v2 :global(.page-header-breadcrumbs) {
          font-size: 13px !important;
          color: #6B6254 !important;
          margin-bottom: 8px !important;
        }
        .auditions-v2 :global(.page-header-title) {
          font-family: var(--font-heading), 'Playfair Display', Georgia, serif !important;
          font-size: 34px !important;
          font-weight: 600 !important;
          line-height: 1.2 !important;
          color: #2A241A !important;
          letter-spacing: -0.01em !important;
        }
        .auditions-v2 :global(.page-header-subtitle) {
          font-family: var(--font-body), 'Inter', sans-serif !important;
          font-size: 15px !important;
          line-height: 1.5 !important;
          color: #6B6254 !important;
          margin-top: 6px !important;
          max-width: 680px !important;
        }

        /* 2. Info Banner */
        .aud-info-banner {
          background-color: #FBF3DF;
          border: 1px solid #EBDDB4;
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .aud-info-banner-icon {
          color: #8A6B2E;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .aud-info-banner-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .aud-info-banner-title {
          font-size: 15px;
          font-weight: 600;
          color: #5E471B;
          line-height: 1.3;
        }
        .aud-info-banner-desc {
          font-size: 13px;
          line-height: 1.45;
          color: #6B6254;
        }

        /* 3. Filter Chips */
        .aud-filter-chips-row {
          display: flex;
          align-items: center;
          gap: 10px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 2px;
        }
        .aud-filter-chips-row::-webkit-scrollbar {
          display: none;
        }
        .aud-filter-chip {
          height: 40px;
          min-height: 40px;
          padding: 0 16px;
          border-radius: 9999px;
          border: 1px solid #E1D4B3;
          background-color: #FFFFFF;
          color: #6B6254;
          font-size: 13.5px;
          font-weight: 500;
          white-space: nowrap;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .aud-filter-chip:hover {
          border-color: #C9A95C;
          background-color: #FAF6ED;
          color: #2A241A;
        }
        .aud-filter-chip.active {
          background-color: #FBF3DF;
          border-color: #C9A95C;
          color: #5E471B;
          font-weight: 600;
        }
        .aud-filter-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 9999px;
          font-size: 11.5px;
          font-weight: 700;
          background: #EFE6D1;
          color: #5E471B;
          line-height: 1;
        }
        .aud-filter-chip.active .aud-filter-badge {
          background: #8A6B2E;
          color: #FFFFFF;
        }

        /* 4. Audition Cards */
        .aud-cards-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .aud-card-root {
          background-color: #FFFFFF !important;
          border: 1px solid #E8E1D2 !important;
          border-radius: 16px !important;
          padding: 18px !important;
          display: flex;
          flex-direction: column;
          gap: 0;
          position: relative;
          box-shadow: 0 1px 3px rgba(43, 45, 42, 0.04);
        }
        .aud-card-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          width: 100%;
        }
        .aud-card-type-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 26px;
          padding: 0 10px;
          border-radius: 6px;
          background-color: #F3ECDC;
          color: #5E471B;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          line-height: 1;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .aud-card-status-wrapper {
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
        }
        .aud-status-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 26px;
          padding: 0 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          line-height: 1;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .pill-approved {
          background-color: #E3F0E7;
          color: #2F6B45;
        }
        .pill-submitted {
          background-color: #F3ECDC;
          color: #5E471B;
        }
        .pill-action {
          background-color: #FBEBDD;
          color: #8F3F16;
        }
        .pill-rejected {
          background-color: #FBE9E5;
          color: #A3321F;
        }

        .aud-card-title {
          font-family: var(--font-heading), 'Playfair Display', Georgia, serif;
          font-size: 24px;
          font-weight: 600;
          line-height: 1.25;
          margin: 14px 0;
          color: #2A241A;
          overflow-wrap: break-word;
          word-break: normal;
        }

        /* 3. Details list (Definition list) */
        .aud-card-details-list {
          display: grid;
          grid-template-columns: 92px 1fr;
          gap: 8px 12px;
          font-size: 14px;
          line-height: 1.45;
          margin: 0;
          padding: 0;
        }
        .aud-detail-label {
          color: #6B6254;
          font-weight: 500;
          margin: 0;
          padding: 0;
        }
        .aud-detail-value {
          color: #2A241A;
          font-weight: 600;
          margin: 0;
          padding: 0;
          overflow-wrap: break-word;
          word-break: normal;
        }
        .aud-due-urgent {
          color: #8F3F16 !important;
        }

        /* 4. Ref number */
        .aud-card-ref-line {
          font-size: 12px;
          color: #8A8170;
          overflow-wrap: anywhere;
          margin-top: 12px;
        }

        /* 5. Divider */
        .aud-card-divider {
          height: 1px;
          background-color: #EFE9DA;
          margin: 16px 0;
          width: 100%;
        }

        /* 6. Instructions box */
        .aud-instructions-box {
          background-color: #F7F3EA;
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 14px;
          line-height: 1.55;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .aud-instructions-heading-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .aud-instructions-icon {
          color: #8A6B2E;
          flex-shrink: 0;
        }
        .aud-instructions-heading {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #8A6B2E;
        }
        .aud-instructions-text {
          color: #2A241A;
          margin: 0;
          line-height: 1.55;
          font-size: 14px;
          overflow-wrap: break-word;
        }

        /* 7. Submitted video */
        .aud-submitted-tape-section {
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .aud-submitted-tape-label {
          font-size: 13px;
          font-weight: 600;
          color: #6B6254;
        }
        .aud-video-player-frame {
          border-radius: 12px;
          overflow: hidden;
          background-color: #1E1A14;
          aspect-ratio: 16 / 9;
          width: 100%;
        }
        .aud-video-player-frame :global(video) {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 12px;
        }

        /* 8. Bottom status banners */
        .aud-bottom-status-banner {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          border-radius: 12px;
          padding: 14px 16px;
          margin-top: 14px;
        }
        .status-banner-approved {
          background-color: #E8F2EB;
        }
        .status-banner-icon-approved {
          color: #2F6B45;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .status-banner-approved .status-banner-title {
          font-size: 15px;
          font-weight: 600;
          color: #1F4D32;
          display: block;
        }
        .status-banner-approved .status-banner-desc {
          font-size: 13px;
          color: #2F6B45;
          line-height: 1.45;
          display: block;
        }

        .status-banner-rejected {
          background-color: #FBE9E5;
        }
        .status-banner-icon-rejected {
          color: #A3321F;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .status-banner-rejected .status-banner-title {
          font-size: 15px;
          font-weight: 600;
          color: #A3321F;
          display: block;
        }
        .status-banner-rejected .status-banner-desc {
          font-size: 13px;
          color: #A3321F;
          line-height: 1.45;
          display: block;
        }

        .status-banner-submitted {
          background-color: #F3ECDC;
        }
        .status-banner-icon-submitted {
          color: #5E471B;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .status-banner-submitted .status-banner-title {
          font-size: 15px;
          font-weight: 600;
          color: #5E471B;
          display: block;
        }
        .status-banner-submitted .status-banner-desc {
          font-size: 13px;
          color: #5E471B;
          line-height: 1.45;
          display: block;
        }

        /* 9. Action Area */
        .aud-upload-area {
          margin-top: 14px;
          background-color: #FAF8F3;
          border: 1px solid #E8E1D2;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
        }
        .aud-action-area {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          margin-top: 4px;
        }
        .aud-submit-btn {
          width: 100% !important;
          height: 48px !important;
          min-height: 48px !important;
          background-color: #8A6B2E !important;
          color: #FFFFFF !important;
          border: 1px solid #8A6B2E !important;
          border-radius: 8px !important;
          font-size: 15px !important;
          font-weight: 600 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }
        .aud-submit-btn:hover:not(:disabled) {
          background-color: #725724 !important;
        }
        .aud-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .aud-portfolio-secondary-btn {
          width: 100% !important;
          height: 48px !important;
          min-height: 48px !important;
          background-color: #FFFFFF !important;
          color: #5E471B !important;
          border: 1px solid #CDBF9E !important;
          border-radius: 8px !important;
          font-size: 15px !important;
          font-weight: 600 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          text-decoration: none !important;
          transition: all 0.15s ease;
        }
        .aud-portfolio-secondary-btn:hover {
          background-color: #FAF6ED !important;
          border-color: #8A6B2E !important;
        }
        .aud-submit-badge {
          font-size: 12px;
          color: #6B6254;
          text-align: center;
          line-height: 1.4;
          margin-top: 2px;
        }

        /* Mobile specific adjustments (<= 640px) */
        @media (max-width: 640px) {
          .auditions-v2 {
            gap: 20px !important;
          }
          .auditions-v2 :global(.page-header-title) {
            font-size: 30px !important;
            line-height: 1.2 !important;
          }
          .auditions-v2 :global(.page-header-subtitle) {
            font-size: 15px !important;
            line-height: 1.45 !important;
          }
          .aud-card-root {
            padding: 16px !important;
            border-radius: 16px !important;
          }
          .aud-card-title {
            font-size: 22px !important;
            line-height: 1.25 !important;
            margin: 12px 0 !important;
          }
          .aud-card-details-list {
            grid-template-columns: 88px 1fr !important;
            gap: 8px 10px !important;
            font-size: 13.5px !important;
          }
          .aud-picker-strip {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .aud-picker-browse-btn {
            width: 100% !important;
            height: 44px !important;
            min-height: 44px !important;
            justify-content: center !important;
          }
        }
      `}</style>
    </div>
  );
}
