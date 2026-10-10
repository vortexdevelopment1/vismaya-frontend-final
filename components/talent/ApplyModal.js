"use client";

import React, { useState } from "react";
import { Video, Send } from "lucide-react";
import Modal from "@/components/shared/Modal";
import { useTalent } from "@/lib/talent/TalentContext";

export default function ApplyModal({ isOpen, onClose, call }) {
  const { applyToCall, portfolio } = useTalent();

  const [selectedRole, setSelectedRole] = useState(
    call?.roles && call.roles.length > 0 ? call.roles[0].roleName : "Lead Role"
  );
  const [selectedClip, setSelectedClip] = useState("Showreel-Monologue-2026.mp4");
  const [applicantNote, setApplicantNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  if (!call) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!agreedToTerms) return;

    setIsSubmitting(true);

    setTimeout(() => {
      applyToCall({
        callId: call.id,
        roleName: selectedRole,
        submittedClipName: selectedClip,
        applicantNote: applicantNote || "Looking forward to screening and audition callback.",
      });

      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  const videoClips = portfolio.filter(
    (m) => (m.type === "Showreel" || m.type === "Audition Clip") && m.status === "Approved"
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Apply for ${call.title}`}
      subtitle={`Production: ${call.production} • ${call.city}`}
      maxWidth="540px"
      footer={
        <div style={{ display: "flex", gap: "10px", width: "100%", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: "10px 18px", minHeight: "44px", borderRadius: "12px" }}>
            Cancel
          </button>
          <button
            type="submit"
            form="apply-call-form"
            disabled={isSubmitting || !agreedToTerms}
            className="btn-primary"
            style={{
              padding: "10px 22px",
              minHeight: "44px",
              borderRadius: "12px",
              opacity: !agreedToTerms || isSubmitting ? 0.6 : 1,
              cursor: !agreedToTerms || isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? (
              <span>Submitting Application...</span>
            ) : (
              <>
                <span>Submit Application</span>
                <Send size={15} />
              </>
            )}
          </button>
        </div>
      }
    >
      <form id="apply-call-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {/* Role Selection Dropdown */}
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>
            Select Character Role <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            style={{
              width: "100%",
              minHeight: "44px",
              padding: "10px 14px",
              backgroundColor: "var(--bg-input)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-input)",
              color: "var(--text-primary)",
              fontSize: "0.9rem",
              outline: "none",
            }}
          >
            {(call.roles || [{ roleName: "Audition Candidate" }]).map((r, idx) => (
              <option key={idx} value={r.roleName} style={{ backgroundColor: "#0f1626", color: "#eceaf5" }}>
                {r.roleName} {r.gender ? `(${r.gender}, ${r.ageRange || ""})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Video Audition Clip Selection */}
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>
            Attach Audition Tape / Verified Showreel
          </label>
          <div
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              border: "1px dashed var(--border-color)",
              borderRadius: "var(--radius-md)",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--gold)",
                }}
              >
                <Video size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-primary)", display: "block" }}>
                  {videoClips.length > 0 ? videoClips[0].title : "Monologue-SelfTape-HD.mp4"}
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--success)" }}>
                  • Verified from your Vismaya portfolio
                </span>
              </div>
            </div>

            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Admin will automatically review your primary approved headshots and verified comp card along with this tape.
            </span>
          </div>
        </div>

        {/* Short Cover Note */}
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>
            Short Note to Casting Team (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="Mention your availability for shoot dates, special skills relevant to this role, or past similar work..."
            value={applicantNote}
            onChange={(e) => setApplicantNote(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              backgroundColor: "var(--bg-input)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-input)",
              color: "var(--text-primary)",
              fontSize: "0.875rem",
              outline: "none",
              resize: "vertical",
            }}
          />
        </div>

        {/* Terms and Consent Checkbox */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginTop: "4px" }}>
          <input
            type="checkbox"
            id="apply-consent"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            style={{ marginTop: "4px", accentColor: "var(--gold)", cursor: "pointer" }}
          />
          <label htmlFor="apply-consent" style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.4, cursor: "pointer" }}>
            I confirm that my profile information is up to date and I am available for the scheduled shoot dates in {call.city}.
          </label>
        </div>
      </form>
    </Modal>
  );
}
