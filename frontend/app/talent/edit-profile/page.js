"use client";

import React, { Suspense } from "react";
import PageHeader from "@/components/shared/PageHeader";
import ProfileBuilder from "@/components/talent/ProfileBuilder";
import { useTalent } from "@/lib/talent/TalentContext";

export default function TalentEditProfilePage() {
  const { profile } = useTalent();

  return (
    <div className="talent-edit-profile-root profile-builder-v2-page" style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1240px", margin: "0 auto", paddingBottom: "32px" }}>
      <PageHeader
        title="Edit Profile"
        subtitle="Manage your professional craft, portfolio media, verified work experience, and confidential personal details."
        badge={profile.status || "APPROVED"}
        breadcrumbs={[
          { label: "Talent Dashboard", href: "/talent/dashboard" },
          { label: "Edit Profile" },
        ]}
        action={
          <a
            href="/talent/profile"
            className="btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 20px",
              fontSize: "14px",
              fontWeight: 500,
              textDecoration: "none",
              borderRadius: "10px",
              border: "1px solid #D9D1BF",
              color: "#2A241A",
              backgroundColor: "#FFFFFF",
              whiteSpace: "nowrap",
            }}
          >
            <span>View profile</span>
          </a>
        }
      />

      <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "#6B6254" }}>Loading profile builder...</div>}>
        <ProfileBuilder />
      </Suspense>

      <style jsx>{`
        @media (max-width: 640px) {
          .talent-edit-profile-root {
            gap: 16px !important;
            width: 100% !important;
            max-width: 100% !important;
            padding-bottom: 88px !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>
    </div>
  );
}
