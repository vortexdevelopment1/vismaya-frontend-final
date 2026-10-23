"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  CheckCircle,
  XCircle,
  Quote,
  Loader2,
  EyeOff,
  RotateCcw,
  Eye,
  AlertCircle,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import Tabs from "@/components/shared/Tabs";
import ReasonModal from "@/components/admin/ReasonModal";
import { adminService } from "@/lib/api/services/adminService";
import { isRealMode } from "@/lib/api/config";

export default function SuccessStoriesApprovalPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [stories, setStories] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, published: 0, unpublished: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [rejectingStory, setRejectingStory] = useState(null);
  const [unpublishingStory, setUnpublishingStory] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [modalError, setModalError] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = useCallback(async (tab = activeTab) => {
    if (isRealMode("admin")) {
      try {
        setLoading(true);
        const res = await adminService.getSuccessStories({ status: tab });
        const items = res?.stories || res?.data || [];
        setStories(Array.isArray(items) ? items : []);
        if (res?.counts) {
          setCounts(res.counts);
        }
      } catch (err) {
        console.error("Error loading success stories:", err);
        setStories([]);
      } finally {
        setLoading(false);
      }
    } else {
      // Mock data
      const mockList = [
        {
          _id: "story-1",
          id: "story-1",
          talentName: "Aarav Sharma",
          quote: "Vismaya connected me directly to Zee Studios casting directors. Within 3 weeks of submitting my comp card, I got the callback and signed my first major lead role!",
          roleOrProfession: "Lead Actor",
          projectName: "Shadows in the Mist",
          organizationName: "Zee Studios",
          photoUrl: "",
          externalSharingConsent: true,
          status: "pending",
          submittedAt: new Date().toISOString(),
        },
      ];
      setStories(mockList.filter((s) => s.status === tab));
      setCounts({ pending: 1, published: 0, unpublished: 0, rejected: 0 });
    }
  }, [activeTab]);

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab, loadData]);

  const handleApprove = async (story) => {
    const id = story._id || story.id;
    if (actionLoadingId) return;
    setActionLoadingId(id);
    try {
      if (isRealMode("admin")) {
        await adminService.reviewSuccessStory(id, { decision: "approve" });
        showToast("Success story approved for platform showcase.");
        await loadData(activeTab);
      } else {
        setStories((prev) => prev.filter((s) => (s._id || s.id) !== id));
        showToast("Success story approved (Mock).");
      }
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || "Failed to approve story");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectSubmit = async (reason) => {
    if (!rejectingStory || actionLoadingId) return;
    const trimmedReason = (reason || "").trim();
    if (!trimmedReason) {
      setModalError("Please provide a reason for rejecting this story.");
      return;
    }
    const id = rejectingStory._id || rejectingStory.id;
    setActionLoadingId(id);
    setModalError("");
    try {
      if (isRealMode("admin")) {
        await adminService.reviewSuccessStory(id, { decision: "reject", rejectionReason: trimmedReason });
        showToast("Success story rejected with feedback.");
        setRejectingStory(null);
        await loadData(activeTab);
      } else {
        setStories((prev) => prev.filter((s) => (s._id || s.id) !== id));
        showToast("Success story rejected (Mock).");
        setRejectingStory(null);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to reject story";
      setModalError(msg);
      showToast(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnpublishSubmit = async (reason) => {
    if (!unpublishingStory || actionLoadingId) return;
    const trimmedReason = (reason || "").trim();
    if (!trimmedReason) {
      setModalError("Please provide a reason for unpublishing this story.");
      return;
    }
    const id = unpublishingStory._id || unpublishingStory.id;
    setActionLoadingId(id);
    setModalError("");
    try {
      if (isRealMode("admin")) {
        await adminService.unpublishSuccessStory(id, trimmedReason);
        showToast("Success story unpublished from website.");
        setUnpublishingStory(null);
        await loadData(activeTab);
      } else {
        setStories((prev) => prev.filter((s) => (s._id || s.id) !== id));
        showToast("Success story unpublished (Mock).");
        setUnpublishingStory(null);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to unpublish story";
      setModalError(msg);
      showToast(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRepublish = async (story) => {
    const id = story._id || story.id;
    if (actionLoadingId) return;
    setActionLoadingId(id);
    try {
      if (isRealMode("admin")) {
        await adminService.republishSuccessStory(id);
        showToast("Success story republished to platform showcase.");
        await loadData(activeTab);
      } else {
        setStories((prev) => prev.filter((s) => (s._id || s.id) !== id));
        showToast("Success story republished (Mock).");
      }
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || "Failed to republish story");
    } finally {
      setActionLoadingId(null);
    }
  };

  const tabs = [
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "published", label: "Published", count: counts.published ?? counts.approved ?? 0 },
    { key: "unpublished", label: "Unpublished", count: counts.unpublished ?? 0 },
    { key: "rejected", label: "Rejected", count: counts.rejected ?? 0 },
  ];

  const getEmptyStateProps = () => {
    switch (activeTab) {
      case "published":
        return {
          title: "No Published Stories",
          description: "Approved success stories will appear here and on the public website.",
        };
      case "unpublished":
        return {
          title: "No Unpublished Stories",
          description: "Stories unpublished by admin policy or content violation will appear here.",
        };
      case "rejected":
        return {
          title: "No Rejected Stories",
          description: "Stories declined during editorial review will appear here.",
        };
      case "pending":
      default:
        return {
          title: "No Stories Pending Approval",
          description: "All talent casting success stories have been reviewed.",
        };
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
        title="Success Stories Approval"
        subtitle="Review, publish, unpublish, and manage casting success testimonials per Spec §42."
        badge={`${counts.pending} Pending Approval`}
      />

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Stories Grid */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <Loader2 size={32} style={{ color: "#8A6B2E", animation: "spin 1s linear infinite" }} />
        </div>
      ) : stories.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
          {stories.map((story) => {
            const id = story._id || story.id;
            const isPending = (story.status || "pending") === "pending";
            const isApproved = story.status === "approved";
            const isUnpublished = story.status === "unpublished";
            const isRejected = story.status === "rejected";

            return (
              <div
                key={id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E8E2D4",
                  borderRadius: "16px",
                  padding: "20px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  boxShadow: "0 2px 4px rgba(43,45,42,0.04)",
                }}
              >
                <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  {story.photoUrl || story.photo ? (
                    <img
                      src={story.photoUrl || story.photo}
                      alt={story.talentName || "Talent"}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fb = e.currentTarget.nextElementSibling;
                        if (fb) fb.style.display = "flex";
                      }}
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "10px",
                        objectFit: "cover",
                        border: "1px solid #E8E2D4",
                        flexShrink: 0,
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "10px",
                      background: "#F5EFE1",
                      color: "#8A6B2E",
                      display: story.photoUrl || story.photo ? "none" : "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "18px",
                      border: "1px solid #E8E2D4",
                      flexShrink: 0,
                    }}
                  >
                    {(story.talentName || "T").charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#2B2D2A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {story.talentName || (story.talentId ? `${story.talentId.name || ""}`.trim() : "Talent")}
                    </h3>
                    <div style={{ fontSize: "12.5px", color: "#8A6B2E", fontWeight: 600 }}>
                      {story.roleOrProfession || story.roleOrTitle || "Creative Professional"} · {story.projectName || story.projectTitle || "Featured Project"}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#5A584F", marginBottom: "6px" }}>
                      Organization: {story.organizationName || story.productionHouse || "Independent"}
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: story.externalSharingConsent ? "#2B5E3B" : "#8A877E",
                          background: story.externalSharingConsent ? "#EBF5ED" : "#F0EEEA",
                          border: `1px solid ${story.externalSharingConsent ? "#C6E6CC" : "#E8E2D4"}`,
                          padding: "2px 7px",
                          borderRadius: "4px",
                          display: "inline-block",
                        }}
                      >
                        Social sharing: {story.externalSharingConsent ? "allowed" : "not allowed"}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: isApproved ? "#2B5E3B" : isUnpublished ? "#5A584F" : isRejected ? "#D9534F" : "#8A6B2E",
                      background: isApproved ? "#EBF5ED" : isUnpublished ? "#F0EEEA" : isRejected ? "#FDF2F2" : "#F5EFE1",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      flexShrink: 0,
                    }}
                  >
                    {isApproved ? "PUBLISHED" : isUnpublished ? "UNPUBLISHED" : isRejected ? "REJECTED" : "AWAITING REVIEW"}
                  </span>
                </div>

                {/* Story Testimonial */}
                <div style={{ background: "#FAF9F7", border: "1px solid #F0EEEA", borderRadius: "10px", padding: "12px 14px", position: "relative" }}>
                  <Quote size={16} style={{ color: "#8A6B2E", marginBottom: "4px", opacity: 0.7 }} />
                  <p style={{ margin: 0, fontSize: "13px", color: "#4A483F", lineHeight: 1.5, fontStyle: "italic" }}>
                    "{story.quote || story.storyText || ""}"
                  </p>
                </div>

                {/* Unpublish Reason Feedback if Unpublished */}
                {isUnpublished && story.unpublishReason && (
                  <div
                    style={{
                      backgroundColor: "#FAF9F7",
                      border: "1px solid #E8E2D4",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "12px",
                      color: "#5A584F",
                      display: "flex",
                      gap: "6px",
                      alignItems: "flex-start",
                    }}
                  >
                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: "2px", color: "#8A6B2E" }} />
                    <div>
                      <strong style={{ color: "#2B2D2A" }}>Unpublish Reason:</strong> {story.unpublishReason}
                    </div>
                  </div>
                )}

                {/* Rejection Reason Feedback if Rejected */}
                {isRejected && story.rejectionReason && (
                  <div
                    style={{
                      backgroundColor: "#FFF5F5",
                      border: "1px solid #FED7D7",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "12px",
                      color: "#C53030",
                      display: "flex",
                      gap: "6px",
                      alignItems: "flex-start",
                    }}
                  >
                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <strong>Rejection Feedback:</strong> {story.rejectionReason}
                    </div>
                  </div>
                )}

                {/* Action Buttons based on Tab / Status */}
                <div style={{ display: "flex", gap: "10px", marginTop: "auto", paddingTop: "6px" }}>
                  {isPending && (
                    <>
                      <button
                        type="button"
                        disabled={actionLoadingId === id}
                        onClick={() => handleApprove(story)}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: "8px",
                          background: "#2B5E3B",
                          color: "#FFFFFF",
                          border: "none",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: actionLoadingId === id ? "not-allowed" : "pointer",
                          opacity: actionLoadingId === id ? 0.7 : 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                      >
                        {actionLoadingId === id ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Approving...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={14} /> Approve &amp; Publish
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={actionLoadingId === id}
                        onClick={() => {
                          setModalError("");
                          setRejectingStory(story);
                        }}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: "8px",
                          background: "#FFFFFF",
                          color: "#D9534F",
                          border: "1px solid #D9534F",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: actionLoadingId === id ? "not-allowed" : "pointer",
                          opacity: actionLoadingId === id ? 0.7 : 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </>
                  )}

                  {isApproved && (
                    <button
                      type="button"
                      disabled={actionLoadingId === id}
                      onClick={() => {
                        setModalError("");
                        setUnpublishingStory(story);
                      }}
                      style={{
                        flex: 1,
                        padding: "8px 14px",
                        borderRadius: "8px",
                        background: "#FFFFFF",
                        color: "#C53030",
                        border: "1px solid #FED7D7",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: actionLoadingId === id ? "not-allowed" : "pointer",
                        opacity: actionLoadingId === id ? 0.7 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#FFF5F5";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#FFFFFF";
                      }}
                    >
                      <EyeOff size={14} /> Unpublish from Website
                    </button>
                  )}

                  {isUnpublished && (
                    <button
                      type="button"
                      disabled={actionLoadingId === id}
                      onClick={() => handleRepublish(story)}
                      style={{
                        flex: 1,
                        padding: "8px 14px",
                        borderRadius: "8px",
                        background: "#2B5E3B",
                        color: "#FFFFFF",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: actionLoadingId === id ? "not-allowed" : "pointer",
                        opacity: actionLoadingId === id ? 0.7 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      {actionLoadingId === id ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Republishing...
                        </>
                      ) : (
                        <>
                          <RotateCcw size={14} /> Republish to Website
                        </>
                      )}
                    </button>
                  )}

                  {isRejected && (
                    <button
                      type="button"
                      disabled={actionLoadingId === id}
                      onClick={() => handleApprove(story)}
                      style={{
                        flex: 1,
                        padding: "8px 14px",
                        borderRadius: "8px",
                        background: "#F5EFE1",
                        color: "#8A6B2E",
                        border: "1px solid #E8E2D4",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: actionLoadingId === id ? "not-allowed" : "pointer",
                        opacity: actionLoadingId === id ? 0.7 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      <RotateCcw size={14} /> Re-approve &amp; Publish
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          title={getEmptyStateProps().title}
          description={getEmptyStateProps().description}
        />
      )}

      {/* Rejection Modal */}
      {rejectingStory && (
        <ReasonModal
          isOpen={!!rejectingStory}
          onClose={() => {
            setRejectingStory(null);
            setModalError("");
          }}
          onSubmit={handleRejectSubmit}
          title="Reject Success Story"
          subtitle="Provide editorial feedback or reason for rejecting this success story."
          inputLabel="Reason for Rejection *"
          inputPlaceholder="E.g. Incomplete project verification or duplicate story."
          submitText="Confirm Rejection"
          isDestructive
          isLoading={actionLoadingId === (rejectingStory._id || rejectingStory.id)}
          errorMessage={modalError}
        />
      )}

      {/* Unpublish Modal */}
      {unpublishingStory && (
        <ReasonModal
          isOpen={!!unpublishingStory}
          onClose={() => {
            setUnpublishingStory(null);
            setModalError("");
          }}
          onSubmit={handleUnpublishSubmit}
          title="Unpublish Success Story"
          subtitle="Removing this success story will immediately hide it from the homepage carousel and public success stories page."
          inputLabel="Reason for Unpublishing *"
          inputPlaceholder="E.g. Verified copyright dispute, policy violation, or talent removal request."
          submitText="Confirm Unpublish"
          isDestructive
          isLoading={actionLoadingId === (unpublishingStory._id || unpublishingStory.id)}
          errorMessage={modalError}
        />
      )}
    </div>
  );
}
