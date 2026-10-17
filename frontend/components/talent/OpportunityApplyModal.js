"use client";

import React, { useState } from "react";
import { Send, CheckCircle2, AlertCircle, ShieldCheck, User, Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import Modal from "@/components/shared/Modal";
import StatusBadge from "@/components/shared/StatusBadge";
import { useTalent } from "@/lib/talent/TalentContext";
import { useWorkflow } from "@/lib/shared/workflowStore";
import { paymentService } from "@/lib/api/services/paymentService";
import { talentService } from "@/lib/api/services/talentService";
import { PRICING_CONFIG } from "@/lib/config/pricing";
import PaymentCard from "@/components/payment/PaymentCard";
import { useAuth } from "@/context/AuthContext";
import { isRealMode } from "@/lib/api/config";

export default function OpportunityApplyModal({ isOpen, onClose, opportunity, project, onAppliedSuccess }) {
  const { user } = useAuth();
  const { profile, addToast, profileCompletionScore } = useTalent();
  const { applyToOpportunity, applications } = useWorkflow();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaid, setIsPaid] = useState(() => {
    if (isRealMode("payments") && user?.isPaid) return true;
    return paymentService.isTalentPaid();
  });

  if (!opportunity) return null;

  const currentTalentId = user?.id || user?._id || profile?.id || profile?._id || profile?.userId || (!isRealMode("talent") ? "tal-904" : "");
  const isApproved = profile?.status?.toLowerCase() === "approved" || profile?.isProfileApproved || profile?.status === "Approved";
  const alreadyApplied = applications.some(
    (a) => a.opportunityId === opportunity.id && (
      a.talentId === currentTalentId ||
      a.talentId?._id === currentTalentId ||
      a.talentId?.id === currentTalentId ||
      a.userId === currentTalentId
    )
  );

  const handleConfirmApply = async () => {
    if (!isApproved || alreadyApplied) return;

    setIsSubmitting(true);

    if (isRealMode("applications")) {
      try {
        await talentService.applyToOpportunity(opportunity.id || opportunity._id, {
          roleApplied: opportunity.title || "Applicant",
          coverNote: "Application submitted via platform",
        });
        setIsSubmitting(false);
        addToast({
          type: "success",
          title: "Application Submitted",
          message: `You have successfully applied for ${opportunity.title}.`,
        });
        if (onAppliedSuccess) onAppliedSuccess();
        onClose();
        return;
      } catch (err) {
        setIsSubmitting(false);
        addToast({
          type: "danger",
          title: "Application Failed",
          message: err?.message || "Could not submit application.",
        });
        return;
      }
    }

    try {
      applyToOpportunity({
        opportunityId: opportunity.id,
        talentId: currentTalentId,
        talentProfile: {
          name: profile?.personal?.fullName || user?.name || "Talent Member",
          stageName: profile?.personal?.stageName || profile?.personal?.fullName || user?.name || "Artist",
          age: parseInt(profile?.personal?.age) || 22,
          gender: profile?.personal?.gender || "Female",
          city: profile?.personal?.city || user?.city || "Mumbai",
          phone: profile?.personal?.phone || user?.mobile || user?.phone || "",
          email: profile?.personal?.email || user?.email || "",
          avatar: profile?.avatar || user?.profilePhoto || "",
          skills: profile?.skills || [],
          languages: profile?.languages || [],
          bio: profile?.personal?.bio || "",
          showreelUrl: profile?.portfolioShowreelUrl || "",
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

  // 1. Payment Gate
  if (!isPaid) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Registration Payment Required"
        subtitle="Complete your one-time registration to submit applications"
        maxWidth="520px"
      >
        <PaymentCard
          type="talent_registration"
          userName={profile?.personal?.fullName || "Talent Member"}
          userEmail={profile?.personal?.email || "user@vismaya.io"}
          onSuccess={() => {
            setIsPaid(true);
            addToast({
              type: "success",
              title: "Payment Confirmed",
              message: "One-time registration fee paid. You can now apply for verified roles.",
            });
          }}
          onCancel={onClose}
          isModal={true}
        />
      </Modal>
    );
  }

  // 2. Profile Completion < 60% Gate
  if ((profileCompletionScore || 0) < PRICING_CONFIG.MIN_PROFILE_COMPLETION) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Complete your profile to apply"
        subtitle="Profile completion threshold requirement"
        maxWidth="500px"
        footer={
          <div style={{ display: "flex", gap: "10px", width: "100%", justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: "10px 18px", minHeight: "42px" }}>
              Cancel
            </button>
            <Link
              href="/talent/profile"
              className="btn-primary"
              style={{ padding: "10px 20px", minHeight: "42px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <span>Complete Profile</span>
            </Link>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "8px 0" }}>
          <div
            style={{
              backgroundColor: "#FAF9F7",
              border: "1px solid #E8E2D4",
              borderRadius: "10px",
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#2B2D2A" }}>Current Profile Completion</span>
              <span style={{ fontSize: "16px", fontWeight: "700", color: "#8A6B2E" }}>{profileCompletionScore || 0}%</span>
            </div>
            <div style={{ width: "100%", height: "8px", backgroundColor: "#E8E2D4", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(profileCompletionScore || 0, 100)}%`, height: "100%", backgroundColor: "#8A6B2E" }} />
            </div>
            <div style={{ fontSize: "12.5px", color: "#5A584F" }}>
              Required: <strong>{PRICING_CONFIG.MIN_PROFILE_COMPLETION}% or higher</strong> to submit applications to verified opportunities.
            </div>
          </div>

          <p style={{ fontSize: "13.5px", color: "#5A584F", margin: 0, lineHeight: 1.5 }}>
            Production houses and casting directors require detailed personal and craft information to review candidates. Please fill in your basic details, looks, skills, and portfolio before applying.
          </p>
        </div>
      </Modal>
    );
  }

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
            backgroundColor: "var(--bg-surface, #FFFFFF)",
            border: "1px solid var(--border-color, #E4E1D9)",
            borderRadius: "6px",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            boxShadow: "var(--card-shadow, 0 1px 3px rgba(41, 44, 41, 0.05))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.785rem", fontWeight: "700", color: "var(--text-secondary, #5A5C53)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
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
                border: "2px solid var(--gold, #9B7A3F)",
                flexShrink: 0,
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-primary, #292C29)", fontFamily: "Georgia, serif" }}>
                {profile.personal.fullName}
              </span>
              <span style={{ fontSize: "0.825rem", color: "var(--text-secondary, #5A5C53)" }}>
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
              borderTop: "1px solid var(--border-color, #E4E1D9)",
              fontSize: "0.8rem",
            }}
          >
            <div>
              <span style={{ color: "var(--text-muted, #777970)", display: "block" }}>Languages:</span>
              <span style={{ color: "var(--text-primary, #292C29)", fontWeight: "600" }}>
                {Array.isArray(profile.languages) ? profile.languages.join(", ") : "Hindi, English"}
              </span>
            </div>
            <div>
              <span style={{ color: "var(--text-muted, #777970)", display: "block" }}>Primary Skills:</span>
              <span style={{ color: "var(--text-primary, #292C29)", fontWeight: "600" }}>
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
