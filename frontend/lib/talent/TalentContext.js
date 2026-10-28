"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

import { isRealMode } from "@/lib/api/config";
import { talentService } from "@/lib/api/services/talentService";
import { mediaService } from "@/lib/api/services/mediaService";
import { notificationService } from "@/lib/api/services/notificationService";
import { verificationService } from "@/lib/api/services/verificationService";
import { publicService } from "@/lib/api/services/publicService";
import { uploadMedia, validateMediaFile } from "@/lib/api/uploadMedia";
import { useAuth } from "@/context/AuthContext";

const TalentContext = createContext(null);

export const emptyProfileData = {
  id: "",
  status: "pending",
  statusNote: "Your profile has been submitted and is pending verification by Vismaya Admin.",
  avatar: "",
  profilePhoto: "",
  name: "",
  stageName: "",
  firstName: "",
  lastName: "",
  bio: "",
  headline: "",
  category: "open_talent",
  careerStage: "aspiring",
  primaryProfession: "",
  profession: "",
  secondaryProfessions: [],
  city: "",
  currentCity: "",
  state: "",
  currentState: "",
  location: "",
  country: "India",
  dob: "",
  gender: "prefer_not_to_say",
  nationality: "Indian",
  email: "",
  mobile: "",
  phone: "",
  personal: {
    fullName: "",
    stageName: "",
    age: "",
    dob: "",
    gender: "prefer_not_to_say",
    city: "",
    state: "",
    phone: "",
    email: "",
    bio: "",
    headline: "",
    primaryRole: "",
    instagram: "",
    imdb: "",
    avatar: "",
    profilePhoto: "",
  },
  physical: {
    height: "",
    weight: "",
    skinTone: "",
    hairColor: "",
    hairLength: "",
    eyeColor: "",
    bodyType: "",
    chest: "",
    waist: "",
    hips: "",
    shoeSize: "",
    tattoos: "",
    piercings: "",
  },
  physicalAttributes: {
    heightCm: null,
    weightKg: null,
    eyeColor: "",
    hairColor: "",
    skinTone: "",
    bodyType: "",
  },
  skills: [],
  languages: [],
  credits: [],
  training: [],
  awards: [],
  portfolio: {
    photos: [],
    videos: [],
    showreelUrl: "",
  },
  photos: [],
  videos: [],
  showreel: "",
  availability: {
    availableDays: [],
    willingToTravel: true,
    hasPassport: false,
    preferredCities: [],
    noticePeriod: "Immediate",
  },
  guardianConsent: {
    guardianName: "",
    guardianPhone: "",
    relationship: "",
    consentLetterUploaded: false,
  },
  profileCompletionPercentage: 0,
  completionPercentage: 0,
  isSearchable: false,
  isFeatured: false,
  isTrending: false,
};

export function TalentProvider({ children }) {
  const auth = useAuth();

  // 1. Profile State
  const [profile, setProfile] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("vismaya_talent_profile");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (isRealMode("talent")) {
            // Reject stale mock data in real mode
            if (parsed && parsed.id !== "tal_904" && parsed.personal?.fullName !== "Riya Sharma") {
              return parsed;
            }
          } else {
            return parsed;
          }
        }
      } catch {}
    }
    if (isRealMode("talent")) {
      return emptyProfileData;
    }
    return talentService.getInitialState().profile || emptyProfileData;
  });

  // 2. Portfolio State
  const [portfolio, setPortfolio] = useState(() => {
    if (isRealMode("media")) {
      return [];
    }
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("vismaya_talent_portfolio");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return talentService.getInitialState().portfolio || [];
  });

  // 3. Casting Calls State
  const [castingCalls, setCastingCalls] = useState(() => isRealMode("opportunities") ? [] : (talentService.getInitialState().castingCalls || []));

  // 4. Applications State
  const [applications, setApplications] = useState(() => isRealMode("applications") || isRealMode("talent") ? [] : (talentService.getInitialState().applications || []));

  // 5. Notifications State
  const [notifications, setNotifications] = useState(() => isRealMode("notifications") || isRealMode("talent") ? [] : (talentService.getInitialState().notifications || []));

  // 6. Toasts State
  const [toasts, setToasts] = useState([]);

  // Sync profile data with auth user if available in real mode
  useEffect(() => {
    if (auth?.user && isRealMode("talent")) {
      const uPhoto = auth.user.profilePhoto || auth.user.avatar;
      setProfile((prev) => ({
        ...prev,
        avatar: uPhoto || prev.avatar,
        profilePhoto: uPhoto || prev.profilePhoto,
        name: prev.name || auth.user.name || "",
        email: prev.email || auth.user.email || "",
        mobile: prev.mobile || auth.user.mobile || auth.user.phone || "",
        phone: prev.phone || auth.user.mobile || auth.user.phone || "",
        personal: {
          ...prev.personal,
          fullName: prev.personal?.fullName || auth.user.name || "",
          email: prev.personal?.email || auth.user.email || "",
          phone: prev.personal?.phone || auth.user.mobile || auth.user.phone || "",
          avatar: uPhoto || prev.personal?.avatar || "",
          profilePhoto: uPhoto || prev.personal?.profilePhoto || "",
        },
      }));
    }
  }, [auth?.user]);

  // Fetch real data on mount when in real API mode
  const currentUserId = auth?.user?.id || auth?.user?._id;
  useEffect(() => {
    if (!isRealMode("talent") && !isRealMode("media")) return;

    let mounted = true;
    async function loadTalentData() {
      try {
        const [profRes, mediaRes, appRes, notifRes, audRes, verRes, compRes, oppsRes] = await Promise.allSettled([
          isRealMode("talent") ? talentService.getMyProfile() : Promise.reject(),
          isRealMode("media") ? mediaService.getMyMedia() : Promise.reject(),
          isRealMode("talent") ? talentService.getMyApplications() : Promise.reject(),
          isRealMode("talent") ? notificationService.getMyNotifications() : Promise.reject(),
          isRealMode("talent") ? talentService.getMyAuditions() : Promise.reject(),
          isRealMode("talent") ? verificationService.getMyVerifications() : Promise.reject(),
          isRealMode("talent") ? talentService.getCompletionStatus() : Promise.reject(),
          isRealMode("opportunities") ? publicService.getPublishedOpportunities() : Promise.reject(),
        ]);

        if (mounted) {
          if (profRes.status === "fulfilled" && profRes.value?.data) {
            const raw = profRes.value.data;
            const merged = {
              ...raw,
              email: raw.email || auth?.user?.email || "",
              mobile: raw.mobile || auth?.user?.mobile || auth?.user?.phone || "",
              phone: raw.phone || auth?.user?.mobile || auth?.user?.phone || "",
              isEmailVerified: raw.isEmailVerified !== undefined ? raw.isEmailVerified : (auth?.user?.isEmailVerified ?? false),
              personal: {
                ...raw.personal,
                email: raw.personal?.email || raw.email || auth?.user?.email || "",
                phone: raw.personal?.phone || raw.phone || auth?.user?.mobile || auth?.user?.phone || "",
                isEmailVerified: raw.personal?.isEmailVerified !== undefined ? raw.personal.isEmailVerified : (raw.isEmailVerified ?? auth?.user?.isEmailVerified ?? false),
              }
            };
            setProfile(merged);
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem("vismaya_talent_profile", JSON.stringify(merged));
              } catch {}
            }
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
          if (oppsRes.status === "fulfilled" && Array.isArray(oppsRes.value?.data)) {
            setCastingCalls(oppsRes.value.data);
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
  }, [currentUserId]);

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
    let result = null;
    if (isRealMode("talent")) {
      try {
        const mergedPayload = { ...profile, ...updatedFields };
        const res = await talentService.saveProfile(mergedPayload);
        result = res;
        if (res?.data) {
          const fresh = res.data;
          setProfile((prev) => {
            const canonicalEmail = fresh.email || prev.email || auth?.user?.email || "";
            const canonicalMobile = fresh.mobile || fresh.phone || prev.mobile || prev.phone || auth?.user?.mobile || auth?.user?.phone || "";
            const verified = fresh.isEmailVerified !== undefined ? fresh.isEmailVerified : (prev.isEmailVerified ?? auth?.user?.isEmailVerified ?? false);

            return {
              ...prev,
              ...fresh,
              email: canonicalEmail,
              mobile: canonicalMobile,
              phone: canonicalMobile,
              isEmailVerified: verified,
              profileCompletionPercentage: res.profileCompletionPercentage !== null && res.profileCompletionPercentage !== undefined
                ? res.profileCompletionPercentage
                : (fresh.profileCompletionPercentage !== undefined ? fresh.profileCompletionPercentage : prev.profileCompletionPercentage),
              stepsCompletion: res.stepsCompletion || fresh.stepsCompletion || prev.stepsCompletion,
              personal: {
                ...prev.personal,
                ...fresh.personal,
                email: fresh.personal?.email || canonicalEmail,
                phone: fresh.personal?.phone || canonicalMobile,
                isEmailVerified: fresh.personal?.isEmailVerified !== undefined ? fresh.personal.isEmailVerified : verified,
              },
            };
          });
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("vismaya_talent_profile", JSON.stringify(res.data));
            } catch {}
          }
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
      setProfile((prev) => {
        const next = {
          ...prev,
          ...updatedFields,
          status: "Submitted",
          statusNote: "Profile changes have been submitted and are pending Vismaya Admin review.",
        };
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("vismaya_talent_profile", JSON.stringify(next));
          } catch {}
        }
        return next;
      });
    }

    addToast({
      type: "info",
      title: "Profile Changes Saved",
      message: "Your profile updates have been saved to the platform.",
    });

    return result;
  };

  // Dedicated Profile Photo Upload / Change Action
  const updateProfilePhoto = async (fileOrUrl) => {
    let photoUrl = "";

    if (typeof fileOrUrl === "string") {
      photoUrl = fileOrUrl;
    } else if (fileOrUrl instanceof Blob || (typeof File !== "undefined" && fileOrUrl instanceof File)) {
      validateMediaFile(fileOrUrl, "profilePhoto");

      if (isRealMode("media") || isRealMode("uploads")) {
        const uploadRes = await uploadMedia({
          file: fileOrUrl,
          category: "headshot",
          title: "Profile Photo",
          isMainProfilePhoto: true,
          validationType: "profilePhoto",
        });
        photoUrl = uploadRes.url;
      } else {
        photoUrl = URL.createObjectURL(fileOrUrl);
      }
    }

    if (!photoUrl) {
      throw new Error("Invalid photo source.");
    }

    // Persist to backend if talent module is real
    if (isRealMode("talent")) {
      try {
        await talentService.saveProfile({ profilePhoto: photoUrl });
      } catch (err) {
        console.warn("Could not save profile photo to backend:", err);
      }
    }

    // Update Profile state & localStorage
    setProfile((prev) => {
      const updated = {
        ...prev,
        avatar: photoUrl,
        profilePhoto: photoUrl,
        personal: {
          ...prev.personal,
          avatar: photoUrl,
          profilePhoto: photoUrl,
        },
      };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("vismaya_talent_profile", JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });

    // Sync AuthContext so Topbar & Sidebar update immediately without relogin
    if (auth?.updateUser) {
      auth.updateUser({ avatar: photoUrl, profilePhoto: photoUrl });
    }

    addToast({
      type: "success",
      title: "Profile Photo Updated",
      message: "Your artist avatar has been updated and saved.",
    });

    return photoUrl;
  };

  // Remove Profile Photo Action
  const removeProfilePhoto = async () => {
    if (isRealMode("talent")) {
      try {
        await talentService.saveProfile({ profilePhoto: "" });
      } catch (err) {
        console.warn("Could not clear profile photo in backend:", err);
      }
    }

    setProfile((prev) => {
      const updated = {
        ...prev,
        avatar: "",
        profilePhoto: "",
        personal: {
          ...prev.personal,
          avatar: "",
          profilePhoto: "",
        },
      };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("vismaya_talent_profile", JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });

    if (auth?.updateUser) {
      auth.updateUser({ avatar: "", profilePhoto: "" });
    }

    addToast({
      type: "info",
      title: "Profile Photo Removed",
      message: "Photo removed. Initials will be displayed as your avatar.",
    });
  };

  // Refresh Portfolio from backend
  const refreshPortfolio = async () => {
    if (isRealMode("media")) {
      try {
        const res = await mediaService.getMyMedia();
        if (Array.isArray(res?.data)) {
          setPortfolio(res.data);
          return res.data;
        }
      } catch (e) {
        console.warn("Failed to refresh portfolio:", e);
      }
    }
    return portfolio;
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

    // Mock Mode Implementation
    let fileUrl = mediaItem.url;
    let fileSize = mediaItem.fileSize || "3.2 MB";
    let isVideo = false;

    if (mediaItem.file instanceof Blob || (typeof File !== "undefined" && mediaItem.file instanceof File)) {
      fileUrl = URL.createObjectURL(mediaItem.file);
      fileSize = `${(mediaItem.file.size / (1024 * 1024)).toFixed(1)} MB`;
      isVideo = mediaItem.file.type?.startsWith("video/");
    }

    const newMedia = {
      id: "m-" + Date.now(),
      title: mediaItem.title || "Untitled Upload",
      type: mediaItem.type || (isVideo ? "Showreel" : "Headshot"),
      date: new Date().toISOString().split("T")[0],
      status: "Pending", // Every upload goes through Admin moderation
      url: fileUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
      fileSize,
      resolution: isVideo ? "1080p Full HD" : "High Res Studio",
      duration: isVideo ? "1:15" : undefined,
    };

    setPortfolio((prev) => {
      const updated = [newMedia, ...prev];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("vismaya_talent_portfolio", JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });

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
    setPortfolio((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("vismaya_talent_portfolio", JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });

    addToast({
      type: "info",
      title: "Media Removed",
      message: target ? `"${target.title}" has been deleted.` : "Media file removed from portfolio.",
    });
  };

  const updateMedia = async (id, payload) => {
    let updatedItem = null;
    if (isRealMode("media")) {
      try {
        const res = await mediaService.updateMedia(id, payload);
        updatedItem = res?.data || null;
      } catch (err) {
        addToast({
          type: "danger",
          title: "Update Failed",
          message: err?.message || "Could not update media.",
        });
        throw err;
      }
    }

    setPortfolio((prev) => {
      const updated = prev.map((m) => {
        if (m.id === id || m._id === id) {
          return {
            ...m,
            ...(updatedItem || {}),
            ...payload,
          };
        }
        return m;
      });
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("vismaya_talent_portfolio", JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });

    addToast({
      type: "success",
      title: "Media Updated",
      message: "Portfolio item updated successfully.",
    });
    return updatedItem;
  };

  // Refresh Profile from Backend
  const refreshProfile = useCallback(async () => {
    if (!isRealMode("talent")) return;
    try {
      const res = await talentService.getMyProfile();
      if (res?.data) {
        const fresh = res.data;
        setProfile((prev) => ({
          ...prev,
          ...fresh,
          email: fresh.email || prev.email || auth?.user?.email || "",
          mobile: fresh.mobile || fresh.phone || prev.mobile || prev.phone || auth?.user?.mobile || auth?.user?.phone || "",
          phone: fresh.mobile || fresh.phone || prev.mobile || prev.phone || auth?.user?.mobile || auth?.user?.phone || "",
          isEmailVerified: fresh.isEmailVerified !== undefined ? fresh.isEmailVerified : (prev.isEmailVerified ?? auth?.user?.isEmailVerified ?? false),
          profileCompletionPercentage: res.profileCompletionPercentage !== undefined ? res.profileCompletionPercentage : (fresh.profileCompletionPercentage !== undefined ? fresh.profileCompletionPercentage : prev.profileCompletionPercentage),
          stepsCompletion: res.stepsCompletion || fresh.stepsCompletion || prev.stepsCompletion,
        }));
      }
    } catch (err) {
      console.warn("Failed to refresh profile:", err);
    }
  }, [auth?.user]);

  // Talent Work Credit Actions
  const addCredit = async (creditData) => {
    try {
      const res = await talentService.addCredit(creditData);
      if (res?.credits) {
        setProfile((prev) => ({
          ...prev,
          credits: res.credits.map((c) => ({
            id: c._id ? String(c._id) : (c.id || ""),
            _id: c._id ? String(c._id) : (c.id || ""),
            projectTitle: c.projectTitle || "",
            roleOrDesignation: c.roleOrDesignation || "",
            projectType: c.projectType || "Film / Project",
            year: c.year || null,
            referenceLink: c.referenceLink || "",
            isVerifiedCredit: Boolean(c.isVerifiedCredit),
            verificationStatus: c.verificationStatus || "pending",
          })),
          profileCompletionPercentage: res.profileCompletionPercentage !== undefined ? res.profileCompletionPercentage : prev.profileCompletionPercentage,
          stepsCompletion: res.stepsCompletion || prev.stepsCompletion
        }));
      } else if (res?.data) {
        setProfile((prev) => ({
          ...prev,
          credits: [res.data, ...(prev.credits || [])]
        }));
      }
      addToast({
        type: "success",
        title: "Credit Submitted",
        message: "Work credit submitted for admin verification.",
      });
      return res;
    } catch (err) {
      addToast({
        type: "danger",
        title: "Add Credit Failed",
        message: err?.message || "Could not add credit.",
      });
      throw err;
    }
  };

  const updateCredit = async (creditId, creditData) => {
    try {
      const res = await talentService.updateCredit(creditId, creditData);
      if (res?.credits) {
        setProfile((prev) => ({
          ...prev,
          credits: res.credits.map((c) => ({
            id: c._id ? String(c._id) : (c.id || ""),
            _id: c._id ? String(c._id) : (c.id || ""),
            projectTitle: c.projectTitle || "",
            roleOrDesignation: c.roleOrDesignation || "",
            projectType: c.projectType || "Film / Project",
            year: c.year || null,
            referenceLink: c.referenceLink || "",
            isVerifiedCredit: Boolean(c.isVerifiedCredit),
            verificationStatus: c.verificationStatus || "pending",
          })),
          profileCompletionPercentage: res.profileCompletionPercentage !== undefined ? res.profileCompletionPercentage : prev.profileCompletionPercentage,
          stepsCompletion: res.stepsCompletion || prev.stepsCompletion
        }));
      }
      addToast({
        type: "success",
        title: "Credit Updated",
        message: "Work credit updated and queued for review.",
      });
      return res;
    } catch (err) {
      addToast({
        type: "danger",
        title: "Update Credit Failed",
        message: err?.message || "Could not update credit.",
      });
      throw err;
    }
  };

  const deleteCredit = async (creditId) => {
    try {
      const res = await talentService.deleteCredit(creditId);
      if (res?.credits) {
        setProfile((prev) => ({
          ...prev,
          credits: res.credits.map((c) => ({
            id: c._id ? String(c._id) : (c.id || ""),
            _id: c._id ? String(c._id) : (c.id || ""),
            projectTitle: c.projectTitle || "",
            roleOrDesignation: c.roleOrDesignation || "",
            projectType: c.projectType || "Film / Project",
            year: c.year || null,
            referenceLink: c.referenceLink || "",
            isVerifiedCredit: Boolean(c.isVerifiedCredit),
            verificationStatus: c.verificationStatus || "pending",
          })),
          profileCompletionPercentage: res.profileCompletionPercentage !== undefined ? res.profileCompletionPercentage : prev.profileCompletionPercentage,
          stepsCompletion: res.stepsCompletion || prev.stepsCompletion
        }));
      } else {
        setProfile((prev) => ({
          ...prev,
          credits: (prev.credits || []).filter((c) => (c.id !== creditId && c._id !== creditId))
        }));
      }
      addToast({
        type: "info",
        title: "Credit Removed",
        message: "Work credit removed from your profile.",
      });
      return res;
    } catch (err) {
      addToast({
        type: "danger",
        title: "Delete Failed",
        message: err?.message || "Could not delete credit.",
      });
      throw err;
    }
  };

  // Casting Call Application Action
  const applyToCall = async ({ callId, roleName, submittedClipName, applicantNote }) => {
    if (isRealMode("applications")) {
      try {
        const res = await talentService.applyToOpportunity(callId, {
          roleApplied: roleName,
          coverNote: applicantNote,
          consentGiven: true,
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
        const res = await talentService.withdrawApplication(appId, { withdrawalReason: "Application withdrawn by talent.", confirm: true });
        setApplications((prev) => prev.map((application) => application.id === appId ? res.data : application));
        return res.data;
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
    // If backend provided authoritative profileCompletionPercentage, honor it
    if (profile?.profileCompletionPercentage !== undefined && profile.profileCompletionPercentage !== null) {
      const score = Math.min(100, Math.max(0, Math.round(Number(profile.profileCompletionPercentage))));
      
      // If backend returned profession-aware breakdown, construct rich actionable suggestions
      if (Array.isArray(profile.breakdown) && profile.breakdown.length > 0) {
        const checklist = profile.breakdown.map((item) => {
          const isDone = item.earned >= item.weight;
          const sectionKey = item.section.toLowerCase();
          const targetSection = sectionKey.includes("photo") || sectionKey.includes("portfolio") || sectionKey.includes("media") || sectionKey.includes("reel") || sectionKey.includes("sample")
            ? "portfolio"
            : sectionKey.includes("credit") || sectionKey.includes("experience")
            ? "experience"
            : sectionKey.includes("physical") || sectionKey.includes("height")
            ? "physical"
            : "personal";

          const missingHint = Array.isArray(item.missing) && item.missing.length > 0
            ? item.missing[0]
            : null;

          return {
            label: isDone ? item.section : (missingHint || `Complete ${item.section}`),
            done: isDone,
            weight: item.weight,
            earned: item.earned,
            section: targetSection,
            missing: item.missing || []
          };
        });
        return { score, checklist };
      }

      // Fallback if missing breakdown but has missingSections
      if (Array.isArray(profile.missingSections) && profile.missingSections.length > 0) {
        const checklist = profile.missingSections.map((hint) => ({
          label: hint,
          done: false,
          section: hint.toLowerCase().includes("portfolio") || hint.toLowerCase().includes("photo") || hint.toLowerCase().includes("video") ? "portfolio" : "personal",
          missing: [hint]
        }));
        return { score, checklist };
      }

      const sc = profile.stepsCompletion || {};
      const checklist = [
        { label: "Step 1: Professional Details", done: Boolean(sc.step1), section: "personal" },
        { label: "Step 2: Portfolio & Profile Photo", done: Boolean(sc.step2), section: "portfolio" },
        { label: "Step 3: Work Experience Credits", done: Boolean(sc.step3), section: "experience" },
        { label: "Step 4: Personal & Physical Measurements", done: Boolean(sc.step4), section: "physical" },
      ];
      return { score, checklist };
    }

    let score = 0;
    const checklist = [];

    // Personal details (25 pts)
    if (profile?.personal?.fullName && profile?.personal?.bio && (profile?.personal?.city || profile?.currentCity)) {
      score += 25;
      checklist.push({ label: "Personal Details & Bio Completed", done: true, section: "personal" });
    } else {
      checklist.push({ label: "Add personal details & bio", done: false, section: "personal" });
    }

    // Physical attributes (20 pts)
    if (profile?.physical?.height && profile?.physical?.skinTone && profile?.physical?.eyeColor) {
      score += 20;
      checklist.push({ label: "Physical Measurements & Looks Listed", done: true, section: "physical" });
    } else {
      checklist.push({ label: "Fill in height & physical looks", done: false, section: "physical" });
    }

    // Skills & Languages (20 pts)
    if (Array.isArray(profile?.skills) && profile.skills.length >= 3 && Array.isArray(profile?.languages) && profile.languages.length >= 2) {
      score += 20;
      checklist.push({ label: "Key Skills & Languages Added", done: true, section: "skills" });
    } else {
      checklist.push({ label: "Add at least 3 skills & 2 languages", done: false, section: "skills" });
    }

    // Experience & Training (15 pts)
    if ((Array.isArray(profile?.experience) && profile.experience.length >= 1) || (Array.isArray(profile?.training) && profile.training.length >= 1)) {
      score += 15;
      checklist.push({ label: "Acting Experience or Training Provided", done: true, section: "experience" });
    } else {
      checklist.push({ label: "Add prior acting experience or training", done: false, section: "experience" });
    }

    // Portfolio uploads (20 pts)
    const approvedOrPendingMedia = Array.isArray(portfolio) ? portfolio.filter((m) => m?.status !== "Rejected") : [];
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
      title: "Reapplication Requested",
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
        const errorMsg = (err?.status === 403 || err?.message?.includes("rejected"))
          ? "Your verification was rejected. Please contact Vismaya support."
          : (err?.message || "Could not submit identity documents.");
        addToast({
          type: "danger",
          title: "Verification Submission Failed",
          message: errorMsg,
        });
        throw err;
      }
    }

    addToast({
      type: "success",
      title: "Identity Documents Submitted",
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
        const errorMsg = (err?.status === 403 || err?.message?.includes("rejected"))
          ? "Your verification was rejected. Please contact Vismaya support."
          : (err?.message || "Could not submit professional credits.");
        addToast({
          type: "danger",
          title: "Submission Failed",
          message: errorMsg,
        });
        throw err;
      }
    }

    addToast({
      type: "success",
      title: "Credits Submitted",
      message: "Work submitted.",
    });
  };

  return (
    <TalentContext.Provider
      value={{
        profile,
        refreshProfile,
        updateProfile,
        updateProfilePhoto,
        removeProfilePhoto,
        addCredit,
        updateCredit,
        deleteCredit,
        profileCompletionScore,
        profileChecklist,
        portfolio,
        refreshPortfolio,
        addMedia,
        updateMedia,
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
