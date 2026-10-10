"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  initialProfileData,
  initialPortfolioMedia,
  initialCastingCalls,
  initialApplications,
  initialNotifications,
} from "./mockData";

import { isRealMode } from "@/lib/api/config";
import { talentService } from "@/lib/api/services/talentService";
import { mediaService } from "@/lib/api/services/mediaService";
import { notificationService } from "@/lib/api/services/notificationService";
import { verificationService } from "@/lib/api/services/verificationService";

const TalentContext = createContext(null);

export function TalentProvider({ children }) {
  // 1. Profile State
  const [profile, setProfile] = useState(initialProfileData);

  // 2. Portfolio State
  const [portfolio, setPortfolio] = useState(initialPortfolioMedia);

  // 3. Casting Calls State
  const [castingCalls, setCastingCalls] = useState(initialCastingCalls);

  // 4. Applications State
  const [applications, setApplications] = useState(initialApplications);

  // 5. Notifications State
  const [notifications, setNotifications] = useState(initialNotifications);

  // 6. Toasts State
  const [toasts, setToasts] = useState([]);

  // Fetch real data on mount when in real API mode
  useEffect(() => {
    if (!isRealMode("talent")) return;

    let mounted = true;
    async function loadTalentData() {
      try {
        const [profRes, mediaRes, appRes, notifRes, audRes, verRes, compRes] = await Promise.allSettled([
          talentService.getMyProfile(),
          mediaService.getMyMedia(),
          talentService.getMyApplications(),
          notificationService.getMyNotifications(),
          talentService.getMyAuditions(),
          verificationService.getMyVerifications(),
          talentService.getCompletionStatus(),
        ]);

        if (mounted) {
          if (profRes.status === "fulfilled" && profRes.value?.data) {
            setProfile((prev) => ({ ...prev, ...profRes.value.data }));
          }
          if (mediaRes.status === "fulfilled" && Array.isArray(mediaRes.value?.data)) {
            setPortfolio(mediaRes.value.data);
          }
          if (appRes.status === "fulfilled" && Array.isArray(appRes.value?.data)) {
            setApplications(appRes.value.data);
          }
          if (notifRes.status === "fulfilled" && Array.isArray(notifRes.value?.data)) {
            setNotifications(notifRes.value.data);
          }
        }
      } catch (err) {
        console.warn("Failed to load talent data in real mode:", err);
      }
    }

    loadTalentData();
    return () => {
      mounted = false;
    };
  }, []);

  // Toast Helpers
  const addToast = ({ type = "success", title, message, duration = 4000 }) => {
    const id = "toast_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Profile Update Action
  const updateProfile = async (updatedFields) => {
    if (isRealMode("talent")) {
      try {
        const res = await talentService.saveProfile(updatedFields);
        if (res?.data) {
          setProfile((prev) => ({ ...prev, ...res.data }));
        } else {
          setProfile((prev) => ({ ...prev, ...updatedFields }));
        }
      } catch (err) {
        addToast({
          type: "danger",
          title: "Profile Update Failed",
          message: err?.message || "Could not save profile changes.",
        });
        throw err;
      }
    } else {
      setProfile((prev) => ({
        ...prev,
        ...updatedFields,
        status: "Submitted",
        statusNote: "Profile changes have been submitted and are pending Vismaya Admin review.",
      }));
    }

    addToast({
      type: "info",
      title: "Profile Changes Submitted",
      message: "Your profile updates are saved and submitted for Admin approval.",
    });
  };

  // Portfolio Media Actions
  const addMedia = async (mediaItem) => {
    if (isRealMode("media")) {
      try {
        const res = await mediaService.addMedia(mediaItem);
        const savedMedia = res?.data || mediaItem;
        setPortfolio((prev) => [savedMedia, ...prev]);
        addToast({
          type: "success",
          title: "Media Uploaded for Moderation",
          message: `"${savedMedia.title || "Media"}" is queued for Admin review.`,
        });
        return savedMedia;
      } catch (err) {
        addToast({
          type: "danger",
          title: "Upload Failed",
          message: err?.message || "Could not upload media.",
        });
        throw err;
      }
    }

    const newMedia = {
      id: "m-" + Date.now(),
      title: mediaItem.title || "Untitled Upload",
      type: mediaItem.type || "Headshot",
      date: new Date().toISOString().split("T")[0],
      status: "Pending", // Every upload goes through Admin moderation
      url: mediaItem.url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
      gradient: "linear-gradient(135deg, #0f1626 0%, #070b12 100%)",
      fileSize: mediaItem.fileSize || "3.2 MB",
      resolution: mediaItem.resolution || "1080p Full HD",
      duration: mediaItem.duration || (mediaItem.type?.includes("reel") || mediaItem.type?.includes("Clip") ? "1:15" : undefined),
    };

    setPortfolio((prev) => [newMedia, ...prev]);

    addToast({
      type: "success",
      title: "Media Uploaded for Moderation",
      message: `"${newMedia.title}" is queued for Admin review before becoming visible.`,
    });
    return newMedia;
  };

  const deleteMedia = async (id) => {
    if (isRealMode("media")) {
      try {
        await mediaService.deleteMedia(id);
      } catch (err) {
        addToast({
          type: "danger",
          title: "Delete Failed",
          message: err?.message || "Could not remove media.",
        });
        throw err;
      }
    }

    const target = portfolio.find((m) => m.id === id);
    setPortfolio((prev) => prev.filter((m) => m.id !== id));

    addToast({
      type: "info",
      title: "Media Removed",
      message: target ? `"${target.title}" has been deleted.` : "Media file removed from portfolio.",
    });
  };

  // Casting Call Application Action
  const applyToCall = async ({ callId, roleName, submittedClipName, applicantNote }) => {
    if (isRealMode("applications")) {
      try {
        const res = await talentService.applyToOpportunity(callId, {
          roleName,
          submittedClipName,
          notes: applicantNote,
        });
        if (res?.data) {
          setApplications((prev) => [res.data, ...prev]);
        }
        addToast({
          type: "success",
          title: "Application Submitted!",
          message: `Applied for ${roleName || "the role"}. Track it in My Applications.`,
        });
        return res?.data;
      } catch (err) {
        addToast({
          type: "danger",
          title: "Application Failed",
          message: err?.message || "Could not submit application.",
        });
        throw err;
      }
    }

    const call = castingCalls.find((c) => c.id === callId);
    if (!call) return;

    // Check if already applied
    const alreadyApplied = applications.some((a) => a.callId === callId);
    if (alreadyApplied) {
      addToast({
        type: "warning",
        title: "Already Applied",
        message: "You have already submitted an application for this casting call.",
      });
      return;
    }

    const newApp = {
      id: "app-" + (Date.now().toString().slice(-4)),
      callId,
      projectTitle: call.title,
      roleName: roleName || (call.roles && call.roles[0]?.roleName) || "Audition Candidate",
      category: call.category,
      city: call.city,
      appliedDate: new Date().toISOString().split("T")[0],
      status: "Applied",
      stage: 1,
      adminNote: "Application received and queued for Vismaya Admin screening.",
      submittedClipName: submittedClipName || "Showreel-Monologue-2026.mp4",
      applicantNote: applicantNote || "Looking forward to hearing from the casting team.",
      timeline: [
        { step: "Application Submitted", date: "Just now", done: true },
        { step: "Admin Verification", date: "In Queue", done: false },
        { step: "Shortlist Announcement", date: "Pending", done: false },
        { step: "Audition Scheduling", date: "Pending", done: false },
      ],
    };

    setApplications((prev) => [newApp, ...prev]);

    // Create confirmation notification
    const newNotif = {
      id: "notif-" + Date.now(),
      title: `Application Submitted: ${call.title}`,
      message: `Your application for "${newApp.roleName}" was received and is pending Admin review.`,
      type: "Applications",
      time: "Just now",
      read: false,
      actionHref: "/talent/applications",
      icon: "FileText",
      badge: "Submitted",
    };

    setNotifications((prev) => [newNotif, ...prev]);

    addToast({
      type: "success",
      title: "Application Submitted!",
      message: `Applied for ${newApp.roleName} in ${call.title}. Track it in My Applications.`,
    });
  };

  const withdrawApplication = async (appId) => {
    if (isRealMode("applications")) {
      try {
        await talentService.withdrawApplication(appId);
      } catch (err) {
        addToast({
          type: "danger",
          title: "Withdrawal Failed",
          message: err?.message || "Could not withdraw application.",
        });
        throw err;
      }
    }

    const target = applications.find((a) => a.id === appId);
    if (!target) return;

    if (target.status === "Shortlisted" || target.status === "Audition Scheduled") {
      addToast({
        type: "danger",
        title: "Cannot Withdraw",
        message: "Shortlisted applications cannot be withdrawn directly. Please contact Vismaya support.",
      });
      return;
    }

    setApplications((prev) => prev.filter((a) => a.id !== appId));

    addToast({
      type: "info",
      title: "Application Withdrawn",
      message: `Your submission for "${target.projectTitle}" has been withdrawn.`,
    });
  };

  // Notification Actions
  const markAsRead = async (id) => {
    if (isRealMode("notifications")) {
      try {
        await notificationService.markAsRead(id);
      } catch (err) {
        console.warn("Failed to mark notification as read:", err);
      }
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (isRealMode("notifications")) {
      try {
        await notificationService.markAllAsRead();
      } catch (err) {
        console.warn("Failed to mark all notifications as read:", err);
      }
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    addToast({
      type: "success",
      title: "All Notifications Read",
      message: "Marked all active notifications as read.",
    });
  };

  // Unread Count Sync
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Profile Completion Percentage Calculation
  const calculateProfileCompletion = () => {
    let score = 0;
    const checklist = [];

    // Personal details (25 pts)
    if (profile.personal.fullName && profile.personal.age && profile.personal.bio && profile.personal.city) {
      score += 25;
      checklist.push({ label: "Personal Details & Bio Completed", done: true, section: "personal" });
    } else {
      checklist.push({ label: "Add personal details & bio", done: false, section: "personal" });
    }

    // Physical attributes (20 pts)
    if (profile.physical.height && profile.physical.skinTone && profile.physical.eyeColor) {
      score += 20;
      checklist.push({ label: "Physical Measurements & Looks Listed", done: true, section: "physical" });
    } else {
      checklist.push({ label: "Fill in height & physical looks", done: false, section: "physical" });
    }

    // Skills & Languages (20 pts)
    if (profile.skills.length >= 3 && profile.languages.length >= 2) {
      score += 20;
      checklist.push({ label: "Key Skills & Languages Added", done: true, section: "skills" });
    } else {
      checklist.push({ label: "Add at least 3 skills & 2 languages", done: false, section: "skills" });
    }

    // Experience & Training (15 pts)
    if (profile.experience.length >= 1 || profile.training.length >= 1) {
      score += 15;
      checklist.push({ label: "Acting Experience or Training Provided", done: true, section: "experience" });
    } else {
      checklist.push({ label: "Add prior acting experience or training", done: false, section: "experience" });
    }

    // Portfolio uploads (20 pts)
    const approvedOrPendingMedia = portfolio.filter((m) => m.status !== "Rejected");
    if (approvedOrPendingMedia.length >= 3) {
      score += 20;
      checklist.push({ label: "Headshots & Video Showreel Uploaded", done: true, section: "portfolio" });
    } else {
      checklist.push({ label: "Upload at least 3 portfolio media items", done: false, section: "portfolio" });
    }

    return { score, checklist };
  };

  const { score: profileCompletionScore, checklist: profileChecklist } = calculateProfileCompletion();

  // Reapplication & Verification Actions
  const requestReapplication = async (applicationId, reason) => {
    if (isRealMode("applications")) {
      try {
        const res = await talentService.requestReapplication(applicationId, { reason });
        addToast({
          type: "success",
          title: "Reapplication Requested",
          message: "Your reapplication request has been submitted for Admin review.",
        });
        return res;
      } catch (err) {
        addToast({
          type: "danger",
          title: "Reapplication Failed",
          message: err?.message || "Could not submit reapplication request.",
        });
        throw err;
      }
    }

    addToast({
      type: "info",
      title: "Reapplication Requested (Mock)",
      message: "Request queued for Admin review.",
    });
  };

  const submitIdentityVerification = async (payload) => {
    if (isRealMode("verifications")) {
      try {
        const res = await verificationService.submitIdentityVerification(payload);
        addToast({
          type: "success",
          title: "Identity Documents Submitted",
          message: "Your government identity documents are queued for verification.",
        });
        return res;
      } catch (err) {
        addToast({
          type: "danger",
          title: "Verification Submission Failed",
          message: err?.message || "Could not submit identity documents.",
        });
        throw err;
      }
    }

    addToast({
      type: "success",
      title: "Identity Verified (Mock)",
      message: "Documents uploaded.",
    });
  };

  const submitProfessionalVerification = async (payload) => {
    if (isRealMode("verifications")) {
      try {
        const res = await verificationService.submitProfessionalVerification(payload);
        addToast({
          type: "success",
          title: "Professional Work Submitted",
          message: "Your professional credits and links are under review.",
        });
        return res;
      } catch (err) {
        addToast({
          type: "danger",
          title: "Submission Failed",
          message: err?.message || "Could not submit professional credits.",
        });
        throw err;
      }
    }

    addToast({
      type: "success",
      title: "Credits Submitted (Mock)",
      message: "Work submitted.",
    });
  };

  return (
    <TalentContext.Provider
      value={{
        profile,
        updateProfile,
        profileCompletionScore,
        profileChecklist,
        portfolio,
        addMedia,
        deleteMedia,
        castingCalls,
        applications,
        applyToCall,
        withdrawApplication,
        requestReapplication,
        submitIdentityVerification,
        submitProfessionalVerification,
        notifications,
        markAsRead,
        markAllAsRead,
        unreadCount,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </TalentContext.Provider>
  );
}

export function useTalent() {
  const context = useContext(TalentContext);
  if (!context) {
    throw new Error("useTalent must be used within a TalentProvider");
  }
  return context;
}
