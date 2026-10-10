"use client";

import React, { useState } from "react";
import { Send, CheckCircle2, AlertCircle, ShieldCheck, User, Mail, Phone, MapPin } from "lucide-react";
import Modal from "@/components/shared/Modal";
import StatusBadge from "@/components/shared/StatusBadge";
import { useTalent } from "@/lib/talent/TalentContext";
import { useWorkflow } from "@/lib/shared/workflowStore";

export default function OpportunityApplyModal({ isOpen, onClose, opportunity, project, onAppliedSuccess }) {
  const { profile, addToast } = useTalent();
  const { applyToOpportunity, applications } = useWorkflow();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!opportunity) return null;

  const currentTalentId = "tal-904";
  const isApproved = profile.status === "Approved";
  const alreadyApplied = applications.some(
    (a) => a.opportunityId === opportunity.id && a.talentId === currentTalentId
  );

  const handleConfirmApply = () => {
    if (!isApproved || alreadyApplied) return;

    setIsSubmitting(true);

    try {
      applyToOpportunity({
        opportunityId: opportunity.id,
        talentId: currentTalentId,
        talentProfile: {
          name: profile.personal.fullName,
          stageName: profile.personal.stageName || profile.personal.fullName,
          age: parseInt(profile.personal.age) || 22,
          gender: profile.personal.gender || "Female",
          city: profile.personal.city || "Mumbai",
          phone: profile.personal.phone || "+91 98765 43210",
          email: profile.personal.email || "riya.sharma@vismaya.io",
          avatar: profile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
          skills: profile.skills || ["Screen Acting", "Method Acting", "Dance"],
          languages: profile.languages || ["Hindi", "English", "Marathi"],
          bio: profile.personal.bio || "Theater and screen trained artist.",
          showreelUrl: profile.portfolioShowreelUrl || "https://www.w3schools.com/html/mov_bbb.mp4",
        },
        roleApplied: opportunity.roles?.[0]?.roleName || "Lead Role",
      });

      addToast({
        type: "success",
        title: "Application Sent!",
        message: `Your verified profile has been submitted for '${opportunity.title}' through Vismaya.`,
      });

      if (onAppliedSuccess) onAppliedSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      addToast({
        type: "danger",
        title: "Submission Failed",
        message: "An unexpected error occurred while submitting your application.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Application"
      subtitle={`${opportunity.title} • ${project?.title || "Production Project"}`}
      maxWidth="540px"
      footer={
        <div style={{ display: "flex", gap: "10px", width: "100%", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: "10px 18px", minHeight: "44px", borderRadius: "12px" }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmApply}
            disabled={!isApproved || alreadyApplied || isSubmitting}
            className="btn-primary"
            style={{
              padding: "10px 24px",
              minHeight: "44px",
              borderRadius: "12px",
              opacity: !isApproved || alreadyApplied || isSubmitting ? 0.6 : 1,
              cursor: !isApproved || alreadyApplied || isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? (
              <span>Submitting Profile...</span>
            ) : alreadyApplied ? (
              <span>Already Applied</span>
            ) : (
              <>
                <span>Confirm &amp; Send Profile</span>
                <Send size={15} />
              </>
            )}
          </button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Approved Status Guard Banner */}
        {!isApproved ? (
          <div
            style={{
              backgroundColor: "rgba(192, 57, 43, 0.08)",
              border: "1px solid rgba(192, 57, 43, 0.25)",
              borderRadius: "16px",
              padding: "16px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <AlertCircle size={20} style={{ color: "var(--danger)", flexShrink: 0, marginTop: "2px" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--danger)" }}>
                Profile Approval Required
              </span>
              <span style={{ fontSize: "0.825rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>
                Your artist profile status is currently <strong>{profile.status}</strong>. Only talent with an <strong>Approved</strong> profile can apply to verified opportunities.
              </span>
            </div>
          </div>
        ) : (
          /* Confirmation Notice */
          <div
            style={{
              backgroundColor: "rgba(255, 188, 0, 0.10)",
              border: "1px solid rgba(255, 188, 0, 0.28)",
              borderRadius: "16px",
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <ShieldCheck size={22} style={{ color: "var(--gold)", flexShrink: 0 }} />
            <span style={{ fontSize: "0.885rem", color: "var(--gold)", fontWeight: "600", lineHeight: 1.45 }}>
              Your profile will be sent to the organization through Vismaya.
            </span>
          </div>
        )}

        {/* Profile Preview Card */}
        <div
          style={{
            backgroundColor: "var(--glass-bg-elevated)",
            border: "1px solid var(--glass-border)",
            borderRadius: "18px",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.785rem", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Profile to be Shared
            </span>
            <StatusBadge status={profile.status} size="xs" />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                backgroundImage: `url(${profile.avatar})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: "2px solid rgba(255, 188, 0, 0.4)",
                flexShrink: 0,
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-primary)" }}>
                {profile.personal.fullName}
              </span>
              <span style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
                {profile.personal.age} yrs &bull; {profile.personal.gender} &bull; {profile.personal.city}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "8px",
              paddingTop: "10px",
              borderTop: "1px solid rgba(255, 255, 255, 0.10)",
              fontSize: "0.8rem",
            }}
          >
            <div>
              <span style={{ color: "var(--text-muted)", display: "block" }}>Languages:</span>
              <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>
                {Array.isArray(profile.languages) ? profile.languages.join(", ") : "Hindi, English"}
              </span>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)", display: "block" }}>Primary Skills:</span>
              <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>
                {Array.isArray(profile.skills) ? profile.skills.slice(0, 3).join(", ") : "Screen Acting"}
              </span>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5, textAlign: "center" }}>
          The casting team will review your verified portfolio, showreels, and measurements directly on Vismaya. Any audition scripts or interview callbacks will be coordinated securely through your portal.
        </p>
      </div>
    </Modal>
  );
}
