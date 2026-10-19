"use client";

import React, { Suspense } from "react";
import PageHeader from "@/components/shared/PageHeader";
import ProfileBuilder from "@/components/talent/ProfileBuilder";
import { useTalent } from "@/lib/talent/TalentContext";

export default function TalentEditProfilePage() {
  const { profile } = useTalent();

  return (
    <div className="talent-edit-profile-root" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Edit Profile"
        subtitle="Manage your professional craft, portfolio media, verified work experience, and confidential personal details."
        badge={profile.status}
        breadcrumbs={[
          { label: "Talent Dashboard", href: "/talent/dashboard" },
          { label: "Edit Profile" },
        ]}
      />

      <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "#5A584F" }}>Loading profile builder...</div>}>
        <ProfileBuilder />
      </Suspense>

      <style jsx>{`
        @media (max-width: 640px) {
          .talent-edit-profile-root {
            gap: 14px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>
    </div>
  );
}
