import React, { createContext, useContext, useState, useEffect } from "react";
import {
  initialCompanyProfile,
  initialRequirements,
  initialShortlistedTalent,
  initialRecruiterNotifications,
  initialRecentActivity,
} from "./mockData";
import { isRealMode } from "@/lib/api/config";
import { recruiterService } from "@/lib/api/services/recruiterService";
import { notificationService } from "@/lib/api/services/notificationService";

const RecruiterContext = createContext(null);

export function RecruiterProvider({ children }) {
  // 1. Company Profile State
  const [companyProfile, setCompanyProfile] = useState(initialCompanyProfile);

  // 2. Requirements State
  const [requirements, setRequirements] = useState(initialRequirements);

  // 3. Shortlisted Talent State (keyed by reqId)
  const [shortlistedTalent, setShortlistedTalent] = useState(initialShortlistedTalent);

  // 4. Notifications State
  const [notifications, setNotifications] = useState(initialRecruiterNotifications);

  // 5. Activity Feed State
  const [activities, setActivities] = useState(initialRecentActivity);

  // 6. Toasts State
  const [toasts, setToasts] = useState([]);

  // Fetch real recruiter data on mount when in real API mode
  useEffect(() => {
    if (!isRealMode("recruiter")) return;

    let mounted = true;
    async function loadRecruiterData() {
      try {
        const [orgRes, oppsRes, notifRes, projRes, creditRes, audRes, favRes] = await Promise.allSettled([
          recruiterService.getOrganizationProfile(),
          recruiterService.getMyOpportunities(),
          notificationService.getMyNotifications(),
          recruiterService.getMyProjects(),
          recruiterService.getCreditBalance(),
          recruiterService.getOrganizationAuditions(),
          recruiterService.getFavourites(),
        ]);

        if (mounted) {
          if (orgRes.status === "fulfilled" && orgRes.value?.data) {
            setCompanyProfile((prev) => ({ ...prev, ...orgRes.value.data }));
          }
          if (oppsRes.status === "fulfilled" && Array.isArray(oppsRes.value?.data)) {
            setRequirements(oppsRes.value.data);
          }
          if (notifRes.status === "fulfilled" && Array.isArray(notifRes.value?.data)) {
            setNotifications(notifRes.value.data);
          }
          if (creditRes.status === "fulfilled" && creditRes.value?.balance !== undefined) {
            setCompanyProfile((prev) => ({ ...prev, credits: creditRes.value.balance }));
          }
        }
      } catch (err) {
        console.warn("Failed to load recruiter data in real mode:", err);
      }
    }

    loadRecruiterData();
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

  // Requirement Actions
  const addRequirement = async (reqData, isDraft = false) => {
    if (isRealMode("recruiter")) {
      try {
        const res = await recruiterService.createOpportunity(reqData);
        const createdReq = res?.data || reqData;
        setRequirements((prev) => [createdReq, ...prev]);

        addToast({
          type: isDraft ? "info" : "success",
          title: isDraft ? "Draft Saved" : "Requirement Submitted to Admin",
          message: isDraft
            ? `"${createdReq.title}" saved to your drafts.`
            : `"${createdReq.title}" is queued for Admin review and will be published soon.`,
        });

        return createdReq;
      } catch (err) {
        addToast({
          type: "danger",
          title: "Submission Failed",
          message: err?.message || "Could not submit casting requirement.",
        });
        throw err;
      }
    }

    const newId = "req-" + Date.now().toString().slice(-4);
    const newReq = {
      id: newId,
      title: reqData.title || "Untitled Requirement",
      type: reqData.type || "Film",
      description: reqData.description || "",
      locations: reqData.locations || "Mumbai",
      shootStartDate: reqData.shootStartDate || "",
      shootEndDate: reqData.shootEndDate || "",
      submittedDate: new Date().toISOString().split("T")[0],
      status: isDraft ? "Draft" : "Submitted",
      statusStage: isDraft ? 0 : 1,
      budgetType: reqData.budgetType || "Paid",
      budgetRange: reqData.budgetRange || "Negotiable",
      deadline: reqData.deadline || "",
      requiredMaterials: reqData.requiredMaterials || ["Commercial Headshot", "Audition Monologue Self-Tape"],
      roles: reqData.roles && reqData.roles.length > 0 ? reqData.roles : [
        {
          id: "r-" + Date.now(),
          roleName: "Character Role",
          artistsCount: 1,
          ageRange: "20 - 30 years",
          gender: "Any",
          look: "Contemporary",
          language: "Hindi",
          skills: "Camera Acting",
          notes: "",
        },
      ],
      applicantsCount: 0,
      hasShortlist: false,
      shortlistCount: 0,
      shortlistFeedbackSent: false,
      adminNote: isDraft
        ? null
        : "Sent to Admin for review. Admin may contact you to clarify details.",
    };

    setRequirements((prev) => [newReq, ...prev]);

    // Activity Log
    setActivities((prev) => [
      {
        id: "act-" + Date.now(),
        title: isDraft ? "Requirement Draft Saved" : "New Requirement Submitted",
        description: `"${newReq.title}" (${newReq.type}) ${isDraft ? "saved as draft" : "sent for Admin review"}`,
        time: "Just now",
        type: "requirement",
      },
      ...prev,
    ]);

    // Notification Log
    if (!isDraft) {
      setNotifications((prev) => [
        {
          id: "r-notif-" + Date.now(),
          title: `Requirement Submitted: ${newReq.title}`,
          message: "Your casting requirement is in the queue for Admin review and verification.",
          type: "Requirements",
          time: "Just now",
          read: false,
          actionHref: "/recruiter/my-requirements",
          badge: "Submitted",
        },
        ...prev,
      ]);
    }

    addToast({
      type: isDraft ? "info" : "success",
      title: isDraft ? "Draft Saved" : "Requirement Submitted to Admin",
      message: isDraft
        ? `"${newReq.title}" saved to your drafts.`
        : `"${newReq.title}" is queued for Admin review and will be published soon.`,
    });

    return newReq;
  };

  const updateRequirement = async (id, updatedData) => {
    if (isRealMode("recruiter")) {
      try {
        await recruiterService.updateOpportunity(id, updatedData);
      } catch (err) {
        addToast({
          type: "danger",
          title: "Update Failed",
          message: err?.message || "Could not update requirement.",
        });
        throw err;
      }
    }

    setRequirements((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updatedData } : r))
    );

    addToast({
      type: "success",
      title: "Requirement Updated",
      message: "Casting requirement details have been updated.",
    });
  };

  const deleteRequirement = async (id) => {
    if (isRealMode("recruiter")) {
      try {
        await recruiterService.requestOpportunityCancellation(id, { reason: "Cancellation requested by recruiter" });
      } catch (err) {
        addToast({
          type: "danger",
          title: "Cancellation Failed",
          message: err?.message || "Could not request requirement cancellation.",
        });
        throw err;
      }
    }

    const target = requirements.find((r) => r.id === id);
    setRequirements((prev) => prev.filter((r) => r.id !== id));

    addToast({
      type: "info",
      title: "Requirement Deleted",
      message: target ? `"${target.title}" has been deleted.` : "Requirement removed.",
    });
  };

  // Candidate Selection & Rating Feedback
  const setCandidatePreference = async ({ reqId, candidateId, selectionStatus, starRating }) => {
    if (isRealMode("recruiter") && selectionStatus) {
      try {
        await recruiterService.updateCandidateStatus(candidateId, selectionStatus);
      } catch (err) {
        console.warn("Failed to update candidate status in real mode:", err);
      }
    }

    setShortlistedTalent((prev) => {
      const currentList = prev[reqId] || [];
      const updatedList = currentList.map((cand) => {
        if (cand.id === candidateId) {
          return {
            ...cand,
            selectionStatus: selectionStatus !== undefined ? selectionStatus : cand.selectionStatus,
            starRating: starRating !== undefined ? starRating : cand.starRating,
          };
        }
        return cand;
      });
      return { ...prev, [reqId]: updatedList };
    });
  };

  // Send Feedback to Admin and Lock Preferences
  const sendFeedbackToAdmin = (reqId) => {
    setRequirements((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, shortlistFeedbackSent: true } : r))
    );

    const targetReq = requirements.find((r) => r.id === reqId);

    setNotifications((prev) => [
      {
        id: "r-notif-" + Date.now(),
        title: `Candidate Feedback Sent: ${targetReq ? targetReq.title : "Project"}`,
        message: "Your preferences and star ratings have been received. Vismaya Admin will coordinate audition call sheets and scheduling.",
        type: "Shortlists",
        time: "Just now",
        read: false,
        actionHref: `/recruiter/shortlisted-talent?req=${reqId}`,
        badge: "Feedback Sent",
      },
      ...prev,
    ]);

    addToast({
      type: "success",
      title: "Feedback Sent to Admin",
      message: "Feedback sent. Vismaya will handle scheduling and booking.",
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
      title: "All Marked as Read",
      message: "All recruiter notifications have been marked as read.",
    });
  };

  // Company Profile Actions
  const updateCompanyProfile = async (updatedFields) => {
    if (isRealMode("recruiter")) {
      try {
        const res = await recruiterService.saveOrganizationProfile(updatedFields);
        if (res?.data) {
          setCompanyProfile((prev) => ({ ...prev, ...res.data }));
        } else {
          setCompanyProfile((prev) => ({ ...prev, ...updatedFields }));
        }
      } catch (err) {
        addToast({
          type: "danger",
          title: "Profile Update Failed",
          message: err?.message || "Could not update company profile.",
        });
        throw err;
      }
    } else {
      setCompanyProfile((prev) => ({ ...prev, ...updatedFields }));
    }

    addToast({
      type: "success",
      title: "Company Profile Saved",
      message: "Recruiter corporate information updated successfully.",
    });
  };

  // Credit & Shortlist Actions
  const unlockTalentProfile = async (talentId) => {
    if (isRealMode("recruiter")) {
      try {
        const res = await recruiterService.unlockTalentProfile(talentId);
        addToast({
          type: "success",
          title: "Talent Profile Unlocked",
          message: "Full contact & representative details are now accessible.",
        });
        return res;
      } catch (err) {
        addToast({
          type: "danger",
          title: "Unlock Failed",
          message: err?.message || "Could not unlock talent profile.",
        });
        throw err;
      }
    }

    addToast({
      type: "success",
      title: "Talent Profile Unlocked (Mock)",
      message: "1 credit consumed.",
    });
  };

  const addFavourite = async (talentId) => {
    if (isRealMode("recruiter")) {
      try {
        const res = await recruiterService.addFavourite(talentId);
        addToast({
          type: "success",
          title: "Added to Favourites",
          message: "Artist saved to your organization talent shortlist.",
        });
        return res;
      } catch (err) {
        addToast({
          type: "danger",
          title: "Action Failed",
          message: err?.message || "Could not add to favourites.",
        });
        throw err;
      }
    }

    addToast({
      type: "success",
      title: "Added to Favourites (Mock)",
      message: "Saved to private favourites list.",
    });
  };

  const removeFavourite = async (talentId) => {
    if (isRealMode("recruiter")) {
      try {
        const res = await recruiterService.removeFavourite(talentId);
        addToast({
          type: "info",
          title: "Removed from Favourites",
          message: "Artist removed from favourites list.",
        });
        return res;
      } catch (err) {
        addToast({
          type: "danger",
          title: "Action Failed",
          message: err?.message || "Could not remove from favourites.",
        });
        throw err;
      }
    }

    addToast({
      type: "info",
      title: "Removed (Mock)",
      message: "Removed from private favourites.",
    });
  };

  const addToProjectShortlist = async (projectId, payload) => {
    if (isRealMode("projects")) {
      try {
        const res = await recruiterService.addToShortlist(projectId, payload);
        addToast({
          type: "success",
          title: "Added to Project Shortlist",
          message: "Artist shortlisted for project role.",
        });
        return res;
      } catch (err) {
        addToast({
          type: "danger",
          title: "Shortlist Action Failed",
          message: err?.message || "Could not add artist to project shortlist.",
        });
        throw err;
      }
    }

    addToast({
      type: "success",
      title: "Shortlisted (Mock)",
      message: "Artist added to project roster.",
    });
  };

  // Derived Counts
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
  const shortlistsReadyCount = requirements.filter(
    (r) => r.hasShortlist && !r.shortlistFeedbackSent && r.status !== "Closed"
  ).length;

  return (
    <RecruiterContext.Provider
      value={{
        companyProfile,
        updateCompanyProfile,
        requirements,
        addRequirement,
        updateRequirement,
        deleteRequirement,
        shortlistedTalent,
        setCandidatePreference,
        sendFeedbackToAdmin,
        unlockTalentProfile,
        addFavourite,
        removeFavourite,
        addToProjectShortlist,
        notifications,
        markAsRead,
        markAllAsRead,
        unreadNotificationsCount,
        shortlistsReadyCount,
        activities,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </RecruiterContext.Provider>
  );
}

export function useRecruiter() {
  const context = useContext(RecruiterContext);
  if (!context) {
    throw new Error("useRecruiter must be used within a RecruiterProvider");
  }
  return context;
}
