"use client";

import React from "react";
import PageHeader from "@/components/shared/PageHeader";
import ProfileSections from "@/components/talent/ProfileSections";
import { useTalent } from "@/lib/talent/TalentContext";

export default function TalentProfilePage() {
  const { profile } = useTalent();

  return (
    <div className="talent-profile-root" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="My Artist Profile"
        subtitle="Manage your personal information, physical measurements, performance skills, experience, and guardian verification."
        badge={profile.status}
        breadcrumbs={[
          { label: "Talent Dashboard", href: "/talent/dashboard" },
          { label: "My Profile" },
        ]}
      />

      <ProfileSections />

      <style jsx>{`
        @media (max-width: 640px) {
          .talent-profile-root {
            gap: 14px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          :global(.talent-profile-root .page-header-container) {
            margin-bottom: 8px !important;
            gap: 10px !important;
            width: 100% !important;
          }
          :global(.talent-profile-root .page-header-container nav) {
            font-size: 12px !important;
            gap: 6px !important;
          }
          :global(.talent-profile-root .page-header-row) {
            gap: 8px !important;
          }
          :global(.talent-profile-root .page-header-title-row) {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
          }
          :global(.talent-profile-root .page-header-title) {
            font-size: 22px !important;
            line-height: 1.25 !important;
          }
          :global(.talent-profile-root .page-header-badge) {
            font-size: 10.5px !important;
            padding: 2.5px 8px !important;
            letter-spacing: 0.08em !important;
          }
          :global(.talent-profile-root .page-header-subtitle) {
            font-size: 13px !important;
            line-height: 1.5 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 3 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          }
        }
      `}</style>
    </div>
  );
}
