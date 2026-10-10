"use client";

import React from "react";
import PageHeader from "@/components/shared/PageHeader";
import ProfileSections from "@/components/talent/ProfileSections";
import { useTalent } from "@/lib/talent/TalentContext";

export default function TalentProfilePage() {
  const { profile } = useTalent();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
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
    </div>
  );
}
