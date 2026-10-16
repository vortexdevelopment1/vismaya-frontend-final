"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Plus,
  CheckCircle,
  Clock,
  ShieldCheck,
  Award,
  Loader2,
  ExternalLink,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import Modal from "@/components/shared/Modal";
import { adminService } from "@/lib/api/services/adminService";
import { isRealMode } from "@/lib/api/config";

export default function InformationalProfilesPage() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    stageName: "",
    primaryProfession: "Actor",
    category: "screen",
    headline: "",
    bio: "",
    currentCity: "Mumbai",
    currentState: "Maharashtra",
    notableCredits: "",
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    if (isRealMode("admin")) {
      try {
        setLoading(true);
        const res = await adminService.getInformationalProfiles();
        if (res?.data) {
          setProfiles(res.data);
        }
      } catch (err) {
        console.error("Error loading informational profiles:", err);
      } finally {
        setLoading(false);
      }
    } else {
      setProfiles([
        {
          _id: "info-1",
          id: "info-1",
          stageName: "Amitabh Verma",
          primaryProfession: "Actor",
          category: "screen",
          vismayaId: "VIS-INFO-001",
          headline: "Veteran Theatre & Feature Actor",
          currentCity: "Mumbai",
          isClaimable: true,
          claimedBy: null,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.stageName.trim()) {
      showToast("Stage Name is required");
      return;
    }

    const payload = {
      ...formData,
      notableCredits: formData.notableCredits
        ? formData.notableCredits.split(",").map((c) => ({ projectTitle: c.trim(), roleOrDesignation: formData.primaryProfession }))
        : [],
    };

    if (isRealMode("admin")) {
      try {
        const res = await adminService.createInformationalProfile(payload);
        if (res?.success) {
          showToast(`Informational profile for '${formData.stageName}' created successfully.`);
          setShowCreateModal(false);
          setFormData({
            stageName: "",
            primaryProfession: "Actor",
            category: "screen",
            headline: "",
            bio: "",
            currentCity: "Mumbai",
            currentState: "Maharashtra",
            notableCredits: "",
          });
          loadData();
        }
      } catch (err) {
        showToast(err?.response?.data?.message || err?.message || "Failed to create profile");
      }
    } else {
      setProfiles((prev) => [
        {
          _id: "info-" + Date.now(),
          id: "info-" + Date.now(),
          stageName: formData.stageName,
          primaryProfession: formData.primaryProfession,
          vismayaId: "VIS-INFO-" + Math.floor(100 + Math.random() * 900),
          headline: formData.headline,
          currentCity: formData.currentCity,
          isClaimable: true,
          claimedBy: null,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      showToast(`Informational profile for '${formData.stageName}' created (Mock).`);
      setShowCreateModal(false);
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
        title="Vismaya-Created Informational Profiles"
        subtitle="Curate claimable talent profiles for notable artists to seed discovery and allow verified talents to claim ownership per Spec §41."
        actions={
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              background: "#8A6B2E",
              color: "#FFFFFF",
              border: "none",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus size={16} /> Create Informational Profile
          </button>
        }
      />

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <Loader2 size={32} style={{ color: "#8A6B2E", animation: "spin 1s linear infinite" }} />
        </div>
      ) : profiles.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {profiles.map((p) => (
            <div
              key={p._id || p.id}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E8E2D4",
                borderRadius: "16px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: "0 2px 4px rgba(43,45,42,0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#2B2D2A" }}>
                    {p.stageName}
                  </h3>
                  <div style={{ fontSize: "12.5px", color: "#5A584F" }}>
                    {p.primaryProfession} · {p.currentCity || "Mumbai"}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: p.claimedBy ? "#2B5E3B" : "#8A6B2E",
                    background: p.claimedBy ? "#EBF5ED" : "#F5EFE1",
                    padding: "3px 8px",
                    borderRadius: "6px",
                  }}
                >
                  {p.claimedBy ? "CLAIMED" : "CLAIMABLE"}
                </span>
              </div>

              {p.vismayaId && (
                <div style={{ fontSize: "12px", color: "#8A6B2E", fontWeight: 600 }}>
                  ID: {p.vismayaId}
                </div>
              )}

              {p.headline && (
                <p style={{ margin: 0, fontSize: "12.5px", color: "#6A685F", fontStyle: "italic" }}>
                  "{p.headline}"
                </p>
              )}

              <div style={{ fontSize: "11.5px", color: "#8A877E", marginTop: "auto", paddingTop: "8px", borderTop: "1px solid #F0EEEA" }}>
                Created: {new Date(p.createdAt || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={UserCheck}
          title="No Informational Profiles Yet"
          description="Create informational profiles to index industry talents and allow them to claim verified profiles later."
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create Informational Talent Profile"
          subtitle="Add an informational profile for notable industry talents per Spec §41."
          maxWidth="560px"
        >
          <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>Stage Name *</label>
              <input
                type="text"
                required
                value={formData.stageName}
                onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                placeholder="E.g. Nawazuddin Siddiqui"
                style={{ height: "40px", border: "1px solid #E8E2D4", borderRadius: "8px", padding: "0 12px", fontSize: "13px" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>Primary Profession</label>
                <select
                  value={formData.primaryProfession}
                  onChange={(e) => setFormData({ ...formData, primaryProfession: e.target.value })}
                  style={{ height: "40px", border: "1px solid #E8E2D4", borderRadius: "8px", padding: "0 8px", fontSize: "13px" }}
                >
                  <option value="Actor">Actor</option>
                  <option value="Voice Artist">Voice Artist</option>
                  <option value="Model">Model</option>
                  <option value="Director">Director</option>
                  <option value="Cinematographer">Cinematographer</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>Location</label>
                <input
                  type="text"
                  value={formData.currentCity}
                  onChange={(e) => setFormData({ ...formData, currentCity: e.target.value })}
                  placeholder="Mumbai"
                  style={{ height: "40px", border: "1px solid #E8E2D4", borderRadius: "8px", padding: "0 12px", fontSize: "13px" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>Professional Headline</label>
              <input
                type="text"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                placeholder="E.g. Method Actor & National Award Winner"
                style={{ height: "40px", border: "1px solid #E8E2D4", borderRadius: "8px", padding: "0 12px", fontSize: "13px" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#2B2D2A" }}>Notable Project Credits (comma-separated)</label>
              <input
                type="text"
                value={formData.notableCredits}
                onChange={(e) => setFormData({ ...formData, notableCredits: e.target.value })}
                placeholder="E.g. Gangs of Wasseypur, Sacred Games, The Lunchbox"
                style={{ height: "40px", border: "1px solid #E8E2D4", borderRadius: "8px", padding: "0 12px", fontSize: "13px" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #E8E2D4", background: "#FFFFFF", fontSize: "13px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#8A6B2E", color: "#FFFFFF", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
              >
                Create Profile
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
