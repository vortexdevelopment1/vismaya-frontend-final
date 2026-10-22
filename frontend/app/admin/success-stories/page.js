"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  CheckCircle,
  XCircle,
  Quote,
  Star,
  Award,
  Loader2,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import ReasonModal from "@/components/admin/ReasonModal";
import { adminService } from "@/lib/api/services/adminService";
import { isRealMode } from "@/lib/api/config";

export default function SuccessStoriesApprovalPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rejectingStory, setRejectingStory] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    if (isRealMode("admin")) {
      try {
        setLoading(true);
        const res = await adminService.getSuccessStories();
        if (res?.data) {
          setStories(res.data);
        }
      } catch (err) {
        console.error("Error loading success stories:", err);
      } finally {
        setLoading(false);
      }
    } else {
      setStories([
        {
          _id: "story-1",
          id: "story-1",
          talentName: "Aarav Sharma",
          roleOrTitle: "Lead Actor",
          projectTitle: "Shadows in the Mist",
          productionHouse: "Zee Studios",
          storyText: "Vismaya connected me directly to Zee Studios casting directors. Within 3 weeks of submitting my comp card, I got the callback and signed my first major lead role!",
          status: "pending",
          submittedAt: new Date().toISOString(),
        },
      ]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (story) => {
    const id = story._id || story.id;
    if (isRealMode("admin")) {
      try {
        await adminService.reviewSuccessStory(id, { decision: "approve" });
        setStories((prev) => prev.filter((s) => (s._id || s.id) !== id));
        showToast("Success story approved for platform showcase.");
      } catch (err) {
        showToast(err?.response?.data?.message || err?.message || "Failed to approve story");
      }
    } else {
      setStories((prev) => prev.filter((s) => (s._id || s.id) !== id));
      showToast("Success story approved (Mock).");
    }
  };

  const handleRejectSubmit = async (reason) => {
    if (!rejectingStory) return;
    const trimmedReason = (reason || "").trim();
    if (!trimmedReason) {
      showToast("Please provide a reason for rejecting this story.");
      return;
    }
    const id = rejectingStory._id || rejectingStory.id;
    if (isRealMode("admin")) {
      try {
        await adminService.reviewSuccessStory(id, { decision: "reject", rejectionReason: trimmedReason });
        setStories((prev) => prev.filter((s) => (s._id || s.id) !== id));
        showToast("Success story rejected with feedback.");
        setRejectingStory(null);
      } catch (err) {
        showToast(err?.response?.data?.message || err?.message || "Failed to reject story");
      }
    } else {
      setStories((prev) => prev.filter((s) => (s._id || s.id) !== id));
      showToast("Success story rejected (Mock).");
      setRejectingStory(null);
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
        subtitle="Review casting success testimonials submitted by verified talent for featured promotion on Vismaya public landing pages per Spec §42."
        badge={`${stories.length} Pending Approval`}
      />

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <Loader2 size={32} style={{ color: "#8A6B2E", animation: "spin 1s linear infinite" }} />
        </div>
      ) : stories.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
          {stories.map((story) => (
            <div
              key={story._id || story.id}
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#2B2D2A" }}>
                    {story.talentName}
                  </h3>
                  <div style={{ fontSize: "12.5px", color: "#8A6B2E", fontWeight: 600 }}>
                    {story.roleOrTitle} · {story.projectTitle}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "#5A584F" }}>
                    Production: {story.productionHouse || "Independent"}
                  </div>
                </div>

                <span style={{ fontSize: "11px", fontWeight: 700, color: "#8A6B2E", background: "#F5EFE1", padding: "3px 8px", borderRadius: "6px" }}>
                  AWAITING REVIEW
                </span>
              </div>

              {/* Story Testimonial */}
              <div style={{ background: "#FAF9F7", border: "1px solid #F0EEEA", borderRadius: "10px", padding: "12px 14px", position: "relative" }}>
                <Quote size={16} style={{ color: "#8A6B2E", marginBottom: "4px", opacity: 0.7 }} />
                <p style={{ margin: 0, fontSize: "13px", color: "#4A483F", lineHeight: 1.5, fontStyle: "italic" }}>
                  "{story.storyText}"
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "10px", marginTop: "auto", paddingTop: "6px" }}>
                <button
                  type="button"
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
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <CheckCircle size={14} /> Approve &amp; Publish
                </button>

                <button
                  type="button"
                  onClick={() => setRejectingStory(story)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "#FFFFFF",
                    color: "#D9534F",
                    border: "1px solid #D9534F",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <XCircle size={14} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="No Stories Pending Approval"
          description="All talent casting success stories have been reviewed."
        />
      )}

      {/* Rejection Modal */}
      {rejectingStory && (
        <ReasonModal
          isOpen={!!rejectingStory}
          onClose={() => setRejectingStory(null)}
          onSubmit={handleRejectSubmit}
          title="Reject Success Story"
          subtitle="Provide editorial feedback or reason for rejecting this success story."
          inputLabel="Reason for Rejection *"
          inputPlaceholder="E.g. Incomplete project verification or duplicate story."
          submitText="Confirm Rejection"
          isDestructive
        />
      )}
    </div>
  );
}
