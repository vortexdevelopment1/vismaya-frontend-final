"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import ProfileBuilder from "@/components/talent/ProfileBuilder";
import ProfileView from "@/components/talent/ProfileView";
import { useTalent } from "@/lib/talent/TalentContext";

function TalentProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useTalent();

  const stepParam = searchParams.get("step");
  const editParam = searchParams.get("edit");

  // Step 1 complete check: authoritative stepsCompletion.step1, or has primary profession, city, and bio >= 200 chars
  const hasSavedStep1 = Boolean(
    profile.stepsCompletion?.step1 ||
    ((profile.primaryProfession || profile.profession || profile.personal?.primaryRole) &&
     (profile.currentCity || profile.personal?.city || profile.city) &&
     (profile.bio?.trim()?.length >= 200 || profile.personal?.bio?.trim()?.length >= 200))
  );

  // Builder opens only when:
  // (a) Deep link has ?step= (1, 2, 3, 4)
  // (b) Explicit ?edit=true
  // (c) Profile has NOT completed Step 1 yet (brand new / incomplete profile)
  const isEditing = Boolean(stepParam || editParam === "true" || !hasSavedStep1);

  const handleEditStep = (stepNum = 1) => {
    router.push(`/talent/profile?step=${stepNum}`, { scroll: false });
  };

  const handleFinish = () => {
    router.push("/talent/profile", { scroll: false });
  };

  return (
    <div className="talent-profile-root" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title={isEditing ? "Edit Artist Profile" : "My Artist Profile"}
        subtitle={
          isEditing
            ? "Manage your professional craft, portfolio media, verified work experience, and confidential personal details."
            : "Review your verified craft identity, media portfolio, screen credits, and private specifications."
        }
        badge={profile.status}
        breadcrumbs={[
          { label: "Talent Dashboard", href: "/talent/dashboard" },
          { label: isEditing ? "Edit Profile" : "My Profile" },
        ]}
      />

      {isEditing ? (
        <ProfileBuilder onFinish={handleFinish} />
      ) : (
        <ProfileView onEditStep={handleEditStep} />
      )}
    </div>
  );
}

export default function TalentProfilePage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "#5A584F" }}>Loading profile...</div>}>
      <TalentProfileContent />
      <style jsx global>{`
        @media (max-width: 640px) {
          .talent-profile-root {
            gap: 14px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .talent-profile-root .page-header-container {
            margin-bottom: 8px !important;
            gap: 10px !important;
            width: 100% !important;
          }
          .talent-profile-root .page-header-container nav {
            font-size: 12px !important;
            gap: 6px !important;
          }
          .talent-profile-root .page-header-row {
            gap: 8px !important;
          }
          .talent-profile-root .page-header-title-row {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
          }
          .talent-profile-root .page-header-title {
            font-size: 22px !important;
            line-height: 1.25 !important;
          }
          .talent-profile-root .page-header-badge {
            font-size: 10.5px !important;
            padding: 2.5px 8px !important;
            letter-spacing: 0.08em !important;
          }
          .talent-profile-root .page-header-subtitle {
            font-size: 13px !important;
            line-height: 1.5 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 3 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          }
        }
      `}</style>
    </Suspense>
  );
}
