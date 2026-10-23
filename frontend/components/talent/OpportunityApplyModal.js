"use client";

import React, { useState, useMemo } from "react";
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
import { toFrontendStatus } from "@/lib/api/statusMapper";

export default function OpportunityApplyModal({ isOpen, onClose, opportunity, project, onAppliedSuccess }) {
  const { user } = useAuth();
  const { profile, addToast, profileCompletionScore } = useTalent();
  const { applyToOpportunity, applications } = useWorkflow();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const talentIsPaid = Boolean(
    user?.isPaid ||
    profile?.isPaid ||
    (!isRealMode("payments") && paymentService.isTalentPaid())
  );
  const [isPaid, setIsPaid] = useState(talentIsPaid);

  React.useEffect(() => {
    setIsPaid(talentIsPaid);
  }, [talentIsPaid]);

  const oppRoles = useMemo(() => {
    return Array.isArray(opportunity?.roles) && opportunity.roles.length > 0 ? opportunity.roles : [];
  }, [opportunity?.roles]);
  const hasMultipleRoles = oppRoles.length > 1;

  const [selectedRoleName, setSelectedRoleName] = useState(() => {
    if (oppRoles.length > 0) return oppRoles[0].roleName;
    return opportunity?.role || "";
  });

  React.useEffect(() => {
    if (oppRoles.length > 0) {
      setSelectedRoleName((prev) => {
        const exists = oppRoles.some((r) => r.roleName === prev);
        return exists ? prev : oppRoles[0].roleName;
      });
    } else {
      setSelectedRoleName(opportunity?.role || "");
    }
  }, [opportunity?.id, opportunity?._id, opportunity?.role, oppRoles]);

  const selectedRole = hasMultipleRoles
    ? oppRoles.find((r) => r.roleName === selectedRoleName) || oppRoles[0]
    : (oppRoles.length === 1 ? oppRoles[0] : null);

  const activeRoleName = selectedRole?.roleName || opportunity?.role || "—";

  // Eligibility evaluation against the selected role's criteria
  const talentAge = parseInt(profile?.personal?.age || profile?.age) || null;
  const talentGender = (profile?.personal?.gender || profile?.gender || "").trim();
  const talentSkills = (profile?.skills || []).map((s) => (typeof s === "string" ? s : s?.name || s?.skillName || "").toLowerCase());
  const talentLanguages = (profile?.languages || []).map((l) => (typeof l === "string" ? l : l?.name || l?.language || "").toLowerCase());

  const eligibilityWarnings = React.useMemo(() => {
    const list = [];
    if (selectedRole) {
      // Age check
      const minAge = selectedRole.ageMin !== undefined && selectedRole.ageMin !== null ? Number(selectedRole.ageMin) : null;
      const maxAge = selectedRole.ageMax !== undefined && selectedRole.ageMax !== null ? Number(selectedRole.ageMax) : null;
      if (talentAge !== null) {
        if (minAge !== null && talentAge < minAge) {
          list.push(`Age: Your profile age (${talentAge} yrs) is below the preferred minimum (${minAge} yrs).`);
        }
        if (maxAge !== null && talentAge > maxAge) {
          list.push(`Age: Your profile age (${talentAge} yrs) is above the preferred maximum (${maxAge} yrs).`);
        }
      }

      // Gender check
      if (selectedRole.gender && !["any", "all"].includes(selectedRole.gender.toLowerCase().trim())) {
        if (talentGender && talentGender.toLowerCase() !== selectedRole.gender.toLowerCase().trim()) {
          list.push(`Gender: Role prefers ${selectedRole.gender} (your profile: ${talentGender}).`);
        }
      }

      // Skills check
      if (Array.isArray(selectedRole.skills) && selectedRole.skills.length > 0) {
        const matchesSkill = selectedRole.skills.some((sk) => {
          const skNorm = sk.toLowerCase().trim();
          return talentSkills.some((ts) => ts.includes(skNorm) || skNorm.includes(ts));
        });
        if (!matchesSkill) {
          list.push(`Skills: Preferred skills include ${selectedRole.skills.join(", ")}.`);
        }
      }

      // Languages check
      const roleLangs = selectedRole.languages || (selectedRole.language ? [selectedRole.language] : []);
      if (Array.isArray(roleLangs) && roleLangs.length > 0) {
        const matchesLang = roleLangs.some((lang) => {
          const lNorm = lang.toLowerCase().trim();
          return talentLanguages.some((tl) => tl.includes(lNorm) || lNorm.includes(tl));
        });
        if (!matchesLang) {
          list.push(`Languages: Preferred languages include ${roleLangs.join(", ")}.`);
        }
      }
    }
    return list;
  }, [selectedRole, talentAge, talentGender, talentSkills, talentLanguages]);

  if (!opportunity) return null;

  const currentTalentId = user?.id || user?._id || profile?.id || profile?._id || profile?.userId || (!isRealMode("talent") ? "tal-904" : "");
  const rawStatus = (profile?.rawStatus || profile?.status || "").toLowerCase().trim();
  const isApproved = Boolean(
    profile?.isProfileApproved ||
    rawStatus === "approved" ||
    rawStatus === "active" ||
    profile?.status === "Approved" ||
    profile?.status === "Active"
  );
  const displayStatus = profile?.status
    ? (profile.status.toLowerCase() === "approved" || profile.status.toLowerCase() === "active" ? "Approved" : toFrontendStatus("user", profile.status))
    : (toFrontendStatus("user", rawStatus) || "Pending Review");
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
    if (hasMultipleRoles && !selectedRoleName) {
      addToast({
        type: "danger",
        title: "Role Selection Required",
        message: "Please select a character role to submit your application.",
      });
      return;
    }

    setIsSubmitting(true);

    if (isRealMode("applications")) {
      try {
        await talentService.applyToOpportunity(opportunity.id || opportunity._id, {
          roleName: activeRoleName,
          roleApplied: activeRoleName,
          coverNote: "Application submitted via platform",
        });
        setIsSubmitting(false);
        addToast({
          type: "success",
          title: "Application Submitted",
          message: `You have successfully applied for ${opportunity.title} (${activeRoleName}).`,
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
        roleName: activeRoleName,
        roleApplied: activeRoleName,
        talentProfile: {
          name: profile?.personal?.fullName || user?.name || "Talent Member",
          stageName: profile?.personal?.stageName || profile?.personal?.fullName || user?.name || "Artist",
          age: parseInt(profile?.personal?.age || profile?.age) || null,
          gender: profile?.personal?.gender || profile?.gender || null,
          city: profile?.personal?.city || profile?.currentCity || user?.city || "",
          phone: profile?.personal?.phone || user?.mobile || user?.phone || "",
          email: profile?.personal?.email || user?.email || "",
          avatar: profile?.avatar || user?.profilePhoto || "",
          skills: profile?.skills || [],
          languages: profile?.languages || [],
          bio: profile?.personal?.bio || "",
          showreelUrl: profile?.portfolioShowreelUrl || "",
        },
      });

      addToast({
        type: "success",
        title: "Application Sent!",
        message: `Your verified profile has been submitted for '${opportunity.title}' (${activeRoleName}) through Vismaya.`,
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
  const effectiveCompletionScore = profileCompletionScore ?? profile?.profileCompletionPercentage ?? 0;
  if (effectiveCompletionScore < PRICING_CONFIG.MIN_PROFILE_COMPLETION) {
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
      maxWidth="580px"
      footer={
        <div style={{ display: "flex", gap: "10px", width: "100%", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: "10px 18px", minHeight: "44px", borderRadius: "12px" }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmApply}
            disabled={!isApproved || alreadyApplied || isSubmitting || (hasMultipleRoles && !selectedRoleName)}
            className="btn-primary"
            style={{
              padding: "10px 24px",
              minHeight: "44px",
              borderRadius: "12px",
              opacity: !isApproved || alreadyApplied || isSubmitting || (hasMultipleRoles && !selectedRoleName) ? 0.6 : 1,
              cursor: !isApproved || alreadyApplied || isSubmitting || (hasMultipleRoles && !selectedRoleName) ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? (
              <span>Submitting Profile...</span>
            ) : alreadyApplied ? (
              <span>Already Applied</span>
            ) : (
              <>
                <span>Confirm &amp; Apply for {activeRoleName}</span>
                <Send size={15} />
              </>
            )}
          </button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
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
                Your artist profile status is currently <strong>{displayStatus}</strong>. Only talent with an <strong>Approved</strong> profile can apply to verified opportunities.
              </span>
            </div>
          </div>
        ) : (
          /* Confirmation Notice */
          <div
            style={{
              backgroundColor: "rgba(255, 188, 0, 0.10)",
              border: "1px solid rgba(255, 188, 0, 0.28)",
              borderRadius: "12px",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <ShieldCheck size={20} style={{ color: "var(--gold)", flexShrink: 0 }} />
            <span style={{ fontSize: "0.85rem", color: "var(--gold)", fontWeight: "600", lineHeight: 1.4 }}>
              Your verified artist profile will be submitted directly to the casting desk.
            </span>
          </div>
        )}

        {/* ROLE SELECTION (Required when multiple roles) */}
        {hasMultipleRoles ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.825rem", fontWeight: "700", color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Select Role to Apply <span style={{ color: "var(--danger)" }}>*</span>
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                1 application per opportunity
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "280px", overflowY: "auto", paddingRight: "4px" }}>
              {oppRoles.map((r, idx) => {
                const isSelectedRole = selectedRoleName === r.roleName;
                const roleCount = r.count || r.positionsCount || 1;
                const roleAge = r.ageRange || (r.ageMin && r.ageMax ? `${r.ageMin} - ${r.ageMax} yrs` : (r.ageMin ? `${r.ageMin}+ yrs` : "All Ages"));

                return (
                  <div
                    key={r._id || idx}
                    onClick={() => setSelectedRoleName(r.roleName)}
                    style={{
                      border: isSelectedRole ? "2px solid var(--gold)" : "1px solid var(--border-color)",
                      backgroundColor: isSelectedRole ? "rgba(155, 122, 63, 0.08)" : "var(--bg-alt)",
                      borderRadius: "8px",
                      padding: "12px 14px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      transition: "all 0.15s ease",
                      boxShadow: isSelectedRole ? "0 2px 8px rgba(155, 122, 63, 0.15)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input
                          type="radio"
                          name="appliedOpportunityRole"
                          checked={isSelectedRole}
                          onChange={() => setSelectedRoleName(r.roleName)}
                          style={{ accentColor: "var(--gold)", cursor: "pointer" }}
                        />
                        <span style={{ fontSize: "0.95rem", fontWeight: "700", color: isSelectedRole ? "var(--gold)" : "var(--text-primary)" }}>
                          {r.roleName}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: "600",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            backgroundColor: "var(--bg-surface)",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {r.gender || "Any"} &bull; {roleAge}
                        </span>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: "700",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            backgroundColor: isSelectedRole ? "var(--gold)" : "var(--bg-surface)",
                            color: isSelectedRole ? "#FFFFFF" : "var(--text-muted)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          {roleCount} opening{roleCount > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {r.description && (
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.45, paddingLeft: "24px" }}>
                        {r.description}
                      </p>
                    )}

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", paddingLeft: "24px", paddingTop: "2px", fontSize: "0.75rem" }}>
                      {Array.isArray(r.skills) && r.skills.length > 0 && (
                        <span style={{ color: "var(--text-muted)" }}>
                          Skills: <strong style={{ color: "var(--text-primary)" }}>{r.skills.join(", ")}</strong>
                        </span>
                      )}
                      {(Array.isArray(r.languages) && r.languages.length > 0) || r.language ? (
                        <span style={{ color: "var(--text-muted)" }}>
                          &bull; Lang: <strong style={{ color: "var(--text-primary)" }}>{Array.isArray(r.languages) ? r.languages.join(", ") : r.language}</strong>
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: "var(--bg-alt)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Character Role:</span>
            <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--gold)" }}>
              {activeRoleName}
            </span>
          </div>
        )}

        {/* ELIGIBILITY WARNING BANNER (Warn but allow application) */}
        {eligibilityWarnings.length > 0 && (
          <div
            style={{
              backgroundColor: "rgba(255, 188, 0, 0.08)",
              border: "1px solid rgba(255, 188, 0, 0.35)",
              borderRadius: "10px",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertCircle size={15} style={{ color: "var(--gold)", flexShrink: 0 }} />
                <span style={{ fontSize: "0.825rem", fontWeight: "700", color: "var(--gold)" }}>
                  Eligibility Match Notice ({activeRoleName})
                </span>
              </div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                Warn but allow application
              </span>
            </div>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.775rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>
              {eligibilityWarnings.map((warning, wIdx) => (
                <li key={wIdx}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Profile Preview Card */}
        <div
          style={{
            backgroundColor: "var(--bg-surface, #FFFFFF)",
            border: "1px solid var(--border-color, #E4E1D9)",
            borderRadius: "6px",
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
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
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundImage: `url(${profile.avatar})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: "2px solid var(--gold, #9B7A3F)",
                flexShrink: 0,
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-primary, #292C29)", fontFamily: "Georgia, serif" }}>
                {profile.personal.fullName}
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary, #5A5C53)" }}>
                {profile.personal.age} yrs &bull; {profile.personal.gender} &bull; {profile.personal.city}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "8px",
              paddingTop: "8px",
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
        <p style={{ margin: 0, fontSize: "0.785rem", color: "var(--text-secondary)", lineHeight: 1.45, textAlign: "center" }}>
          The casting team will review your verified portfolio directly on Vismaya. Callbacks and auditions will be coordinated securely through your portal.
        </p>
      </div>
    </Modal>
  );
}
