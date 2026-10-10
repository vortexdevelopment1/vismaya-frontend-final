"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  initialTalents,
  initialRecruiters,
  initialMediaQueue,
  initialRequirementRequests,
  initialCastingCalls,
  initialAdminNotifications,
  initialRecentAdminActivity,
  initialApplications,
  initialShortlists,
  initialBookings,
  initialPayments,
  initialSubscriptions,
  initialBroadcasts,
} from "./mockData";
import { isRealMode } from "@/lib/api/config";
import { adminService } from "@/lib/api/services/adminService";
import { notificationService } from "@/lib/api/services/notificationService";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  // 1. Talents State
  const [talents, setTalents] = useState(initialTalents);

  // 2. Recruiters State
  const [recruiters, setRecruiters] = useState(initialRecruiters);

  // 3. Media Moderation Queue State
  const [mediaQueue, setMediaQueue] = useState(initialMediaQueue);

  // 4. Requirement Requests State
  const [requirementRequests, setRequirementRequests] = useState(initialRequirementRequests);

  // 5. Casting Calls State
  const [castingCalls, setCastingCalls] = useState(initialCastingCalls);

  // 6. Applications State
  const [applications, setApplications] = useState(initialApplications);

  // 7. Shortlists State
  const [shortlists, setShortlists] = useState(initialShortlists);

  // 8. Bookings State
  const [bookings, setBookings] = useState(initialBookings);

  // 9. Payments State
  const [payments, setPayments] = useState(initialPayments);

  // 10. Subscriptions State
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);

  // 11. Broadcasts State
  const [broadcasts, setBroadcasts] = useState(initialBroadcasts);

  // 12. Admin Notifications State
  const [notifications, setNotifications] = useState(initialAdminNotifications);

  // 13. Recent Activity Feed State
  const [activities, setActivities] = useState(initialRecentAdminActivity);

  // 14. Toasts State
  const [toasts, setToasts] = useState([]);

  // Fetch real data on mount when in real API mode
  useEffect(() => {
    if (!isRealMode("admin")) return;

    let mounted = true;
    async function loadAdminData() {
      try {
        const [talentsRes, orgsRes, mediaRes, notifRes, oppsRes, cancRes, audRes, payRes, metricsRes, verRes, logsRes] = await Promise.allSettled([
          adminService.getAllUsers({ role: "talent" }),
          adminService.getAllUsers({ role: "organization" }),
          adminService.getPendingMedia(),
          notificationService.getMyNotifications(),
          adminService.getPendingOpportunities(),
          adminService.getCancellationRequests(),
          adminService.getPendingAuditions(),
          adminService.getPaymentTransactions(),
          adminService.getDashboardMetrics(),
          adminService.getPendingVerifications(),
          adminService.getAuditLogs(),
        ]);

        if (mounted) {
          if (talentsRes.status === "fulfilled" && Array.isArray(talentsRes.value?.data)) {
            setTalents(talentsRes.value.data);
          }
          if (orgsRes.status === "fulfilled" && Array.isArray(orgsRes.value?.data)) {
            setRecruiters(orgsRes.value.data);
          }
          if (mediaRes.status === "fulfilled" && Array.isArray(mediaRes.value?.data)) {
            setMediaQueue(mediaRes.value.data);
          }
          if (notifRes.status === "fulfilled" && Array.isArray(notifRes.value?.data)) {
            setNotifications(notifRes.value.data);
          }
          if (oppsRes.status === "fulfilled" && Array.isArray(oppsRes.value?.data)) {
            setRequirementRequests(oppsRes.value.data);
          }
          if (payRes.status === "fulfilled" && Array.isArray(payRes.value?.data)) {
            setPayments(payRes.value.data);
          }
          if (logsRes.status === "fulfilled" && Array.isArray(logsRes.value?.data)) {
            setActivities(logsRes.value.data);
          }
        }
      } catch (err) {
        console.warn("Failed to load admin data in real mode:", err);
      }
    }

    loadAdminData();
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

  // ----------------------------------------------------
  // ----------------------------------------------------
  // TALENT MANAGEMENT ACTIONS
  // ----------------------------------------------------
  const approveTalent = async (id) => {
    if (isRealMode("admin")) {
      try {
        await adminService.approveUser(id);
      } catch (err) {
        addToast({
          type: "danger",
          title: "Approval Failed",
          message: err?.message || "Could not approve talent account.",
        });
        return;
      }
    }

    const target = talents.find((t) => t.id === id);
    setTalents((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "Approved", statusReason: null } : t))
    );

    setActivities((prev) => [
      {
        id: "adm-act-" + Date.now(),
        title: "Talent Profile Approved",
        description: `Approved artist profile for "${target?.name || "Artist"}"`,
        time: "Just now",
        type: "talent",
      },
      ...prev,
    ]);

    addToast({
      type: "success",
      title: "Talent Profile Approved",
      message: `${target?.name || "Artist"} is now verified and can apply to casting calls.`,
    });
  };

  const rejectTalent = async (id, reason) => {
    if (isRealMode("admin")) {
      try {
        await adminService.rejectUser(id, { reason });
      } catch (err) {
        addToast({
          type: "danger",
          title: "Action Failed",
          message: err?.message || "Could not reject talent registration.",
        });
        return;
      }
    }

    const target = talents.find((t) => t.id === id);
    setTalents((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "Rejected", statusReason: reason } : t))
    );

    setActivities((prev) => [
      {
        id: "adm-act-" + Date.now(),
        title: "Talent Profile Rejected",
        description: `Rejected "${target?.name || "Artist"}": ${reason}`,
        time: "Just now",
        type: "talent",
      },
      ...prev,
    ]);

    addToast({
      type: "warning",
      title: "Talent Profile Rejected",
      message: `${target?.name || "Artist"} marked as rejected with reason noted.`,
    });
  };

  const suspendTalent = async (id, reason) => {
    if (isRealMode("admin")) {
      try {
        await adminService.suspendUser(id, { reason });
      } catch (err) {
        addToast({
          type: "danger",
          title: "Action Failed",
          message: err?.message || "Could not suspend talent account.",
        });
        return;
      }
    }

    const target = talents.find((t) => t.id === id);
    setTalents((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "Suspended", statusReason: reason } : t))
    );

    addToast({
      type: "danger",
      title: "Talent Account Suspended",
      message: `${target?.name || "Artist"} account has been temporarily suspended.`,
    });
  };

  const reactivateTalent = async (id) => {
    if (isRealMode("admin")) {
      try {
        await adminService.reactivateUser(id);
      } catch (err) {
        addToast({
          type: "danger",
          title: "Action Failed",
          message: err?.message || "Could not reactivate talent account.",
        });
        return;
      }
    }

    const target = talents.find((t) => t.id === id);
    setTalents((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "Approved", statusReason: null } : t))
    );

    addToast({
      type: "success",
      title: "Talent Account Reactivated",
      message: `${target?.name || "Artist"} is restored to active status.`,
    });
  };

  // ----------------------------------------------------
  // RECRUITER MANAGEMENT ACTIONS
  // ----------------------------------------------------
  const verifyRecruiter = async (id) => {
    if (isRealMode("admin")) {
      try {
        await adminService.approveUser(id);
      } catch (err) {
        addToast({
          type: "danger",
          title: "Verification Failed",
          message: err?.message || "Could not verify recruiter account.",
        });
        return;
      }
    }

    const target = recruiters.find((r) => r.id === id);
    setRecruiters((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Verified", statusReason: null } : r))
    );

    setActivities((prev) => [
      {
        id: "adm-act-" + Date.now(),
        title: "Recruiter Company Verified",
        description: `Verified corporate registration for "${target?.company || target?.companyName || "Recruiter"}"`,
        time: "Just now",
        type: "recruiter",
      },
      ...prev,
    ]);

    addToast({
      type: "success",
      title: "Recruiter Company Verified",
      message: `${target?.company || target?.companyName || "Recruiter"} is now verified to post casting briefs.`,
    });
  };

  const rejectRecruiter = async (id, reason) => {
    if (isRealMode("admin")) {
      try {
        await adminService.rejectUser(id, { reason });
      } catch (err) {
        addToast({
          type: "danger",
          title: "Action Failed",
          message: err?.message || "Could not reject recruiter verification.",
        });
        return;
      }
    }

    const target = recruiters.find((r) => r.id === id);
    setRecruiters((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Rejected", statusReason: reason } : r))
    );

    addToast({
      type: "warning",
      title: "Recruiter Verification Rejected",
      message: `${target?.company || target?.companyName || "Recruiter"} marked as rejected with reason noted.`,
    });
  };

  const suspendRecruiter = async (id, reason) => {
    if (isRealMode("admin")) {
      try {
        await adminService.suspendUser(id, { reason });
      } catch (err) {
        addToast({
          type: "danger",
          title: "Action Failed",
          message: err?.message || "Could not suspend recruiter account.",
        });
        return;
      }
    }

    const target = recruiters.find((r) => r.id === id);
    setRecruiters((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Suspended", statusReason: reason } : r))
    );

    addToast({
      type: "danger",
      title: "Recruiter Suspended",
      message: `${target?.company || target?.companyName || "Recruiter"} account has been suspended.`,
    });
  };

  const reactivateRecruiter = async (id) => {
    if (isRealMode("admin")) {
      try {
        await adminService.reactivateUser(id);
      } catch (err) {
        addToast({
          type: "danger",
          title: "Action Failed",
          message: err?.message || "Could not reactivate recruiter account.",
        });
        return;
      }
    }

    const target = recruiters.find((r) => r.id === id);
    setRecruiters((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Verified", statusReason: null } : r))
    );

    addToast({
      type: "success",
      title: "Recruiter Account Reactivated",
      message: `${target?.company || target?.companyName || "Recruiter"} restored to active verified status.`,
    });
  };

  // ----------------------------------------------------
  // MEDIA MODERATION ACTIONS
  // ----------------------------------------------------
  const approveMedia = async (id) => {
    if (isRealMode("admin")) {
      try {
        await adminService.reviewMediaItem(id, { action: "approve" });
      } catch (err) {
        addToast({
          type: "danger",
          title: "Media Approval Failed",
          message: err?.message || "Could not approve media asset.",
        });
        return;
      }
    }

    const target = mediaQueue.find((m) => m.id === id);
    setMediaQueue((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "Approved", statusReason: null } : m))
    );

    setActivities((prev) => [
      {
        id: "adm-act-" + Date.now(),
        title: "Media File Approved",
        description: `Approved ${target?.type} "${target?.title}" for ${target?.talentName}`,
        time: "Just now",
        type: "media",
      },
      ...prev,
    ]);

    addToast({
      type: "success",
      title: "Media Approved",
      message: `"${target?.title || "Media"}" is now visible on the talent portfolio.`,
    });
  };

  const rejectMedia = async (id, reason) => {
    if (isRealMode("admin")) {
      try {
        await adminService.reviewMediaItem(id, { action: "reject", moderationNotes: reason });
      } catch (err) {
        addToast({
          type: "danger",
          title: "Media Rejection Failed",
          message: err?.message || "Could not reject media asset.",
        });
        return;
      }
    }

    const target = mediaQueue.find((m) => m.id === id);
    setMediaQueue((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "Rejected", statusReason: reason } : m))
    );

    addToast({
      type: "warning",
      title: "Media Rejected",
      message: `"${target?.title || "Media"}" rejected: ${reason}`,
    });
  };

  // ----------------------------------------------------
  // REQUIREMENT REQUESTS & CLARIFICATION ACTIONS
  // ----------------------------------------------------
  const addClarificationNote = (reqId, noteText) => {
    // // TODO: API - POST /api/admin/requirements/:id/notes
    const newNote = {
      id: "cn-" + Date.now(),
      author: "Admin Lead",
      adminName: "Admin Lead",
      time: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      timestamp: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      text: noteText,
      note: noteText,
    };

    setRequirementRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              clarificationNotes: [newNote, ...(r.clarificationNotes || [])],
            }
          : r
      )
    );

    addToast({
      type: "info",
      title: "Clarification Note Saved",
      message: "Admin offline notes recorded with timestamp.",
    });
  };

  const markNeedsClarification = (reqId, noteText) => {
    // // TODO: API - PATCH /api/admin/requirements/:id/clarification
    const target = requirementRequests.find((r) => r.id === reqId);
    const newNote = noteText
      ? {
          id: "cn-" + Date.now(),
          author: "Admin Compliance",
          adminName: "Admin Compliance",
          time: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
          timestamp: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
          text: noteText,
          note: noteText,
        }
      : null;

    setRequirementRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status: "Needs Clarification",
              statusReason: noteText || r.statusReason,
              clarificationNotes: newNote
                ? [newNote, ...(r.clarificationNotes || [])]
                : r.clarificationNotes,
            }
          : r
      )
    );

    addToast({
      type: "warning",
      title: "Marked as Needs Clarification",
      message: `"${target?.projectTitle || target?.title}" marked for offline recruiter clarification.`,
    });
  };

  const markReadyToPublish = async (reqId) => {
    if (isRealMode("admin")) {
      try {
        await adminService.approveOpportunity(reqId);
      } catch (err) {
        addToast({
          type: "danger",
          title: "Approval Failed",
          message: err?.message || "Could not approve opportunity.",
        });
        return;
      }
    }

    const target = requirementRequests.find((r) => r.id === reqId);
    setRequirementRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: "Published" } : r))
    );

    addToast({
      type: "success",
      title: "Opportunity Approved & Published",
      message: `"${target?.projectTitle || target?.title}" is approved and published live.`,
    });
  };

  const declineRequirement = async (reqId, reason) => {
    if (isRealMode("admin")) {
      try {
        await adminService.rejectOpportunity(reqId, { rejectionReason: reason });
      } catch (err) {
        addToast({
          type: "danger",
          title: "Action Failed",
          message: err?.message || "Could not reject opportunity.",
        });
        return;
      }
    }

    const target = requirementRequests.find((r) => r.id === reqId);
    setRequirementRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: "Rejected", statusReason: reason, declineReason: reason } : r))
    );

    addToast({
      type: "danger",
      title: "Requirement Declined",
      message: `"${target?.projectTitle || target?.title}" declined with reason recorded.`,
    });
  };

  const publishRequirementAsCastingCall = (reqId, callData) => {
    // // TODO: API - POST /api/admin/casting-calls/publish-from-req
    const targetReq = requirementRequests.find((r) => r.id === reqId);
    const newCallId = "call-" + Date.now().toString().slice(-4);

    const newCall = {
      id: newCallId,
      title: callData.title || targetReq?.projectTitle || targetReq?.title || "New Casting Call",
      projectTitle: targetReq?.projectTitle || targetReq?.title || callData.title,
      category: callData.category || targetReq?.projectType || targetReq?.type || "OTT Series",
      type: callData.type || targetReq?.projectType || targetReq?.type || "OTT",
      city: callData.city || targetReq?.locations || "Mumbai",
      description: callData.description || targetReq?.description || "",
      budgetLabel: callData.budgetLabel || targetReq?.budget || targetReq?.budgetRange || "Paid",
      budgetType: callData.budgetType || targetReq?.budgetType || "Paid",
      budgetAmount: callData.budgetAmount || targetReq?.budget || targetReq?.budgetRange || "",
      deadline: callData.deadline || targetReq?.deadline || "2026-10-31",
      shootStartDate: callData.shootStartDate || targetReq?.shootStartDate || "",
      shootEndDate: callData.shootEndDate || targetReq?.shootEndDate || "",
      applicationsCount: 0,
      status: "Live",
      recruiterName: targetReq?.company || targetReq?.recruiterName || "Zee Films",
      roles: callData.roles || (targetReq?.roles || []).map((r, i) => ({
        id: `cr-${Date.now()}-${i}`,
        roleName: r.roleName || r.name,
        characterDesc: r.look || "Character role",
        ageRange: r.ageRange,
        gender: r.gender,
        look: r.look,
        language: r.language,
        skills: r.skills,
      })),
      requiredMaterials: callData.requiredMaterials || targetReq?.requiredMaterials || ["Commercial Headshot", "Audition Monologue Self-Tape"],
      eligibility: callData.eligibility || "Verified Vismaya artists matching age & language specs.",
    };

    setCastingCalls((prev) => [newCall, ...prev]);

    setRequirementRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: "Published" } : r))
    );

    setActivities((prev) => [
      {
        id: "adm-act-" + Date.now(),
        title: "Casting Call Published Live",
        description: `Published "${newCall.title}" live from ${newCall.recruiterName}'s requirement brief`,
        time: "Just now",
        type: "casting",
      },
      ...prev,
    ]);

    addToast({
      type: "success",
      title: "Casting Call Published Live!",
      message: `"${newCall.title}" is now active on the public Talent Portal for verified artist applications.`,
    });

    return newCall;
  };

  // ----------------------------------------------------
  // CASTING CALL ACTIONS
  // ----------------------------------------------------
  const createCastingCall = (callData, isDraft = false) => {
    // // TODO: API - POST /api/admin/casting-calls
    const newId = "call-" + Date.now().toString().slice(-4);
    const newCall = {
      id: newId,
      title: callData.title || "Untitled Casting Call",
      projectTitle: callData.projectTitle || callData.title || "Project",
      category: callData.category || "Film",
      type: callData.type || callData.category || "Film",
      city: callData.city || "Mumbai",
      description: callData.description || "",
      budgetLabel: callData.budgetLabel || "Paid",
      budgetType: callData.budgetType || "Paid",
      budgetAmount: callData.budgetAmount || "",
      deadline: callData.deadline || "",
      shootStartDate: callData.shootStartDate || "",
      shootEndDate: callData.shootEndDate || "",
      applicationsCount: 0,
      status: isDraft ? "Draft" : "Live",
      recruiterName: callData.recruiterName || "Vismaya Casting Desk",
      roles: callData.roles && callData.roles.length > 0 ? callData.roles : [
        {
          id: "cr-" + Date.now(),
          roleName: "Character Role",
          characterDesc: "",
          ageRange: "20 - 30 years",
          gender: "Any",
          look: "",
          language: "Hindi",
          skills: "Acting",
        },
      ],
      requiredMaterials: callData.requiredMaterials || ["Commercial Headshot", "Audition Monologue Self-Tape"],
      eligibility: callData.eligibility || "Open to verified talent.",
    };

    setCastingCalls((prev) => [newCall, ...prev]);

    addToast({
      type: isDraft ? "info" : "success",
      title: isDraft ? "Casting Call Draft Saved" : "Casting Call Published Live",
      message: isDraft
        ? `"${newCall.title}" saved to drafts.`
        : `"${newCall.title}" is now accepting applications from talent.`,
    });

    return newCall;
  };

  const updateCastingCall = (id, updatedData) => {
    // // TODO: API - PUT /api/admin/casting-calls/:id
    setCastingCalls((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c))
    );

    addToast({
      type: "success",
      title: "Casting Call Updated",
      message: "Casting call specifications updated successfully.",
    });
  };

  const closeCastingCall = (id) => {
    // // TODO: API - PATCH /api/admin/casting-calls/:id/close
    const target = castingCalls.find((c) => c.id === id);
    setCastingCalls((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "Closed" } : c))
    );

    addToast({
      type: "info",
      title: "Casting Call Closed",
      message: `"${target?.title || "Casting Call"}" has been closed. Applications stopped.`,
    });
  };

  const reopenCastingCall = (id) => {
    // // TODO: API - PATCH /api/admin/casting-calls/:id/reopen
    const target = castingCalls.find((c) => c.id === id);
    setCastingCalls((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "Live" } : c))
    );

    addToast({
      type: "success",
      title: "Casting Call Reopened",
      message: `"${target?.title || "Casting Call"}" is live again.`,
    });
  };

  const deleteCastingCall = (id) => {
    // // TODO: API - DELETE /api/admin/casting-calls/:id
    const target = castingCalls.find((c) => c.id === id);
    setCastingCalls((prev) => prev.filter((c) => c.id !== id));

    addToast({
      type: "info",
      title: "Casting Call Removed",
      message: target ? `"${target.title}" has been deleted.` : "Casting call removed.",
    });
  };

  // ----------------------------------------------------
  // APPLICATIONS ACTIONS
  // ----------------------------------------------------
  const updateApplicationStatus = (appId, newStatus) => {
    // // TODO: API - PATCH /api/admin/applications/:id/status
    const target = applications.find((a) => a.id === appId);
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );

    addToast({
      type: newStatus === "Shortlisted" ? "success" : newStatus === "Not Selected" ? "warning" : "info",
      title: `Application ${newStatus}`,
      message: `${target?.applicantName || "Applicant"} status updated to "${newStatus}".`,
    });
  };

  const markApplicationUnderReview = (appId) => {
    const target = applications.find((a) => a.id === appId);
    if (target && target.status === "Applied") {
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: "Under Review" } : a))
      );
    }
  };

  const bulkUpdateApplications = (appIds, newStatus) => {
    // // TODO: API - POST /api/admin/applications/bulk-status
    setApplications((prev) =>
      prev.map((a) => (appIds.includes(a.id) ? { ...a, status: newStatus } : a))
    );

    addToast({
      type: newStatus === "Shortlisted" ? "success" : "info",
      title: `Bulk Status Updated`,
      message: `Updated ${appIds.length} applicant(s) to "${newStatus}".`,
    });
  };

  // ----------------------------------------------------
  // SHORTLISTING ACTIONS
  // ----------------------------------------------------
  const moveCandidateToShortlist = (callId, appId) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: "Shortlisted" } : a))
    );

    const app = applications.find((a) => a.id === appId);
    addToast({
      type: "success",
      title: "Added to Shortlist",
      message: `${app?.applicantName || "Candidate"} moved to curated shortlist.`,
    });
  };

  const moveCandidateToPool = (callId, appId) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: "Under Review" } : a))
    );

    const app = applications.find((a) => a.id === appId);
    addToast({
      type: "info",
      title: "Moved to Review Pool",
      message: `${app?.applicantName || "Candidate"} moved back to review pool.`,
    });
  };

  const markCandidateNotSelected = (callId, appId) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: "Not Selected" } : a))
    );

    const app = applications.find((a) => a.id === appId);
    addToast({
      type: "warning",
      title: "Candidate Not Selected",
      message: `${app?.applicantName || "Candidate"} marked as Not Selected.`,
    });
  };

  const sendShortlistToRecruiter = (callId) => {
    // // TODO: API - POST /api/admin/shortlists/:callId/send
    const call = castingCalls.find((c) => c.id === callId);
    const shortlistedCandidates = applications.filter(
      (a) => a.callId === callId && a.status === "Shortlisted"
    );

    setShortlists((prev) => ({
      ...prev,
      [callId]: {
        callId,
        callTitle: call?.title || "Casting Opportunity",
        recruiterId: "rec-201",
        recruiterCompany: call?.recruiterName || "Zee Films",
        status: "Sent to recruiter",
        sentDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        recruiterFeedback: prev[callId]?.recruiterFeedback || [
          ...shortlistedCandidates.map((c, i) => ({
            applicationId: c.id,
            talentId: c.talentId,
            talentName: c.applicantName,
            roleName: c.roleApplied,
            avatar: c.avatar,
            city: c.city,
            recruiterDecision: i === 0 ? "Selected" : "Selected",
            starRating: 5,
            feedbackNotes: "Impressive screen presence and voice control. Call for audition.",
            auditionDateSuggestion: "2026-10-15, 11:00 AM",
            movedToBookings: false,
          }))
        ],
      },
    }));

    // Add activity
    setActivities((prev) => [
      {
        id: "adm-act-" + Date.now(),
        title: "Shortlist Sent to Recruiter",
        description: `Dispatched ${shortlistedCandidates.length} shortlisted artist profiles for "${call?.title || "Project"}" to recruiter`,
        time: "Just now",
        type: "casting",
      },
      ...prev,
    ]);

    addToast({
      type: "success",
      title: "Shortlist Dispatched to Recruiter!",
      message: `Verified profile batch (${shortlistedCandidates.length} artists) sent to recruiter for feedback.`,
    });
  };

  const moveSelectedCandidatesToBookings = (callId) => {
    const currentShortlist = shortlists[callId];
    if (!currentShortlist || !currentShortlist.recruiterFeedback) return;

    const selectedFeedback = currentShortlist.recruiterFeedback.filter(
      (f) => f.recruiterDecision === "Selected" && !f.movedToBookings
    );

    if (selectedFeedback.length === 0) {
      addToast({
        type: "info",
        title: "No New Selected Candidates",
        message: "All selected candidates have already been transferred to bookings.",
      });
      return;
    }

    const newBookings = selectedFeedback.map((cand, idx) => ({
      id: "bk-" + Date.now().toString().slice(-4) + "-" + idx,
      talentId: cand.talentId,
      talentName: cand.talentName,
      talentPhone: "+91 98765 43210",
      talentEmail: `${cand.talentName.toLowerCase().replace(/\s+/g, ".")}@vismaya.io`,
      avatar: cand.avatar,
      projectTitle: currentShortlist.callTitle,
      recruiterName: currentShortlist.recruiterCompany,
      role: cand.roleName,
      auditionDate: cand.auditionDateSuggestion ? cand.auditionDateSuggestion.split(",")[0] : "2026-10-15",
      auditionTime: cand.auditionDateSuggestion ? cand.auditionDateSuggestion.split(",")[1]?.trim() || "11:00 AM" : "11:00 AM",
      location: "Famous Studios, Studio 4, Mahalaxmi, Mumbai",
      status: "Selected",
      lastUpdated: "Just now",
      scriptSides: "Audition Sides & Dialogue Test Pack",
      coordinationNotes: [
        {
          id: "cn-" + Date.now(),
          author: "Admin Automated",
          time: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
          text: `Moved to offline audition queue following recruiter approval (${cand.starRating || 5} Stars).`
        }
      ]
    }));

    setBookings((prev) => [...newBookings, ...prev]);

    // Mark as moved in shortlist
    setShortlists((prev) => ({
      ...prev,
      [callId]: {
        ...prev[callId],
        recruiterFeedback: prev[callId].recruiterFeedback.map((f) =>
          f.recruiterDecision === "Selected" ? { ...f, movedToBookings: true } : f
        ),
      },
    }));

    addToast({
      type: "success",
      title: "Transferred to Bookings & Auditions",
      message: `Created ${newBookings.length} booking record(s) for recruiter-selected artists.`,
    });
  };

  // ----------------------------------------------------
  // BOOKINGS & AUDITION COORDINATION ACTIONS
  // ----------------------------------------------------
  const updateBookingStatus = (bookingId, newStatus) => {
    // // TODO: API - PATCH /api/admin/bookings/:id/status
    const target = bookings.find((b) => b.id === bookingId);
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, status: newStatus, lastUpdated: "Just now" }
          : b
      )
    );

    addToast({
      type: newStatus === "Confirmed" || newStatus === "Completed" ? "success" : newStatus === "Cancelled" ? "danger" : "info",
      title: `Booking Status: ${newStatus}`,
      message: `${target?.talentName || "Artist"} booking status updated to "${newStatus}".`,
    });
  };

  const updateBookingSchedule = (bookingId, scheduleData) => {
    // // TODO: API - PUT /api/admin/bookings/:id/schedule
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              auditionDate: scheduleData.auditionDate || b.auditionDate,
              auditionTime: scheduleData.auditionTime || b.auditionTime,
              location: scheduleData.location || b.location,
              scriptSides: scheduleData.scriptSides || b.scriptSides,
              status: b.status === "Selected" ? "Scheduled" : b.status,
              lastUpdated: "Just now",
            }
          : b
      )
    );

    addToast({
      type: "success",
      title: "Audition Schedule Updated",
      message: "Studio room slot and script sides logged.",
    });
  };

  const addBookingCoordinationNote = (bookingId, noteText) => {
    const newNote = {
      id: "cn-" + Date.now(),
      author: "Admin Coordinator",
      time: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      text: noteText,
    };

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              coordinationNotes: [newNote, ...(b.coordinationNotes || [])],
              lastUpdated: "Just now",
            }
          : b
      )
    );

    addToast({
      type: "info",
      title: "Coordination Note Saved",
      message: "Offline phone/WhatsApp interaction recorded.",
    });
  };

  const sendAuditionAlert = (bookingId) => {
    const target = bookings.find((b) => b.id === bookingId);
    addToast({
      type: "success",
      title: "Audition Alert Queued",
      message: `In-app notification and urgent SMS/WhatsApp alert queued for ${target?.talentName || "Artist"}.`,
    });
  };

  const confirmBooking = (bookingId) => {
    const target = bookings.find((b) => b.id === bookingId);
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status: "Confirmed", lastUpdated: "Just now" } : b
      )
    );

    addToast({
      type: "success",
      title: "Booking Confirmed",
      message: `Booking agreement confirmed for ${target?.talentName || "Artist"}. Notifications queued.`,
    });
  };

  // ----------------------------------------------------
  // PAYMENTS & MANUAL ACCOUNTING ACTIONS
  // ----------------------------------------------------
  const addPaymentEntry = (paymentData) => {
    // // TODO: API - POST /api/admin/payments
    const gross = Number(paymentData.grossAmount) || 0;
    const commPct = Number(paymentData.commissionPercent) || 15;
    const commAmt = Math.round((gross * commPct) / 100);
    const netPayout = gross - commAmt;

    const newPayment = {
      id: "pay-" + Date.now().toString().slice(-4),
      projectTitle: paymentData.projectTitle || "Casting Production",
      payer: paymentData.payer || "Recruiter",
      payerName: paymentData.payerName || "Production Client",
      grossAmount: gross,
      commissionModel: paymentData.commissionModel || `Charged to ${paymentData.payer} (${commPct}%)`,
      commissionPercent: commPct,
      commissionAmount: commAmt,
      talentPayout: netPayout,
      paymentDate: paymentData.paymentDate || new Date().toISOString().split("T")[0],
      paymentMode: paymentData.paymentMode || "Bank Transfer",
      referenceNote: paymentData.referenceNote || "Offline Transaction Logged",
      status: paymentData.status || "Received",
      talentName: paymentData.talentName || "Artist",
      notes: paymentData.notes || "",
    };

    setPayments((prev) => [newPayment, ...prev]);

    addToast({
      type: "success",
      title: "Payment Entry Logged",
      message: `Recorded ₹${gross.toLocaleString()} for "${newPayment.projectTitle}". Commission: ₹${commAmt.toLocaleString()}.`,
    });
  };

  const updatePaymentEntry = (id, updatedData) => {
    // // TODO: API - PUT /api/admin/payments/:id
    setPayments((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const gross = updatedData.grossAmount !== undefined ? Number(updatedData.grossAmount) : p.grossAmount;
        const commPct = updatedData.commissionPercent !== undefined ? Number(updatedData.commissionPercent) : p.commissionPercent;
        const commAmt = Math.round((gross * commPct) / 100);
        const netPayout = gross - commAmt;

        return {
          ...p,
          ...updatedData,
          grossAmount: gross,
          commissionPercent: commPct,
          commissionAmount: commAmt,
          talentPayout: netPayout,
        };
      })
    );

    addToast({
      type: "success",
      title: "Payment Entry Updated",
      message: "Payment record and calculations updated.",
    });
  };

  const deletePaymentEntry = (id) => {
    // // TODO: API - DELETE /api/admin/payments/:id
    setPayments((prev) => prev.filter((p) => p.id !== id));

    addToast({
      type: "info",
      title: "Payment Entry Deleted",
      message: "Record removed from manual ledger.",
    });
  };

  const updateSubscriptionStatus = (id, newStatus, newExpiryDate) => {
    // // TODO: API - PATCH /api/admin/subscriptions/:id
    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: newStatus,
              expiryDate: newExpiryDate || s.expiryDate,
              lastPaymentDate: newStatus === "Paid" ? new Date().toISOString().split("T")[0] : s.lastPaymentDate,
            }
          : s
      )
    );

    addToast({
      type: "success",
      title: "Subscription Updated",
      message: `Status updated to "${newStatus}".`,
    });
  };

  // ----------------------------------------------------
  // BROADCAST ACTIONS
  // ----------------------------------------------------
  const sendBroadcast = (broadcastData) => {
    // // TODO: API - POST /api/admin/broadcasts
    const newBroadcast = {
      id: "bc-" + Date.now().toString().slice(-4),
      title: broadcastData.title,
      audience: broadcastData.audience,
      channel: broadcastData.channel,
      priority: broadcastData.priority || "Normal",
      sentAt: "Just now",
      recipientsCount: broadcastData.audience?.includes("Recruiters") ? 118 : 650,
      message: broadcastData.message,
    };

    setBroadcasts((prev) => [newBroadcast, ...prev]);

    setActivities((prev) => [
      {
        id: "adm-act-" + Date.now(),
        title: "Broadcast Dispatched",
        description: `Sent "${newBroadcast.title}" to ${newBroadcast.audience} via ${newBroadcast.channel}`,
        time: "Just now",
        type: "casting",
      },
      ...prev,
    ]);

    addToast({
      type: "success",
      title: "Broadcast Dispatched Successfully!",
      message: `Alert sent to ${newBroadcast.recipientsCount} recipient(s) across ${newBroadcast.channel}.`,
    });
  };

  // ----------------------------------------------------
  // NOTIFICATION ACTIONS
  // ----------------------------------------------------
  const markAsRead = (id) => {
    // // TODO: API - PATCH /api/admin/notifications/:id/read
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    // // TODO: API - POST /api/admin/notifications/mark-all-read
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    addToast({
      type: "success",
      title: "All Notifications Marked Read",
      message: "Admin alerts updated.",
    });
  };

  // ----------------------------------------------------
  // DERIVED STATS & PENDING COUNTERS
  // ----------------------------------------------------
  const pendingTalentsCount = talents.filter((t) => t.status === "Pending").length;
  const pendingRecruitersCount = recruiters.filter((r) => r.status === "Pending").length;
  const pendingMediaCount = mediaQueue.filter((m) => m.status === "Pending").length;
  const pendingRequirementsCount = requirementRequests.filter(
    (r) => r.status === "New" || r.status === "Needs Clarification" || r.status === "Ready to Publish"
  ).length;
  const totalPendingApprovals =
    pendingTalentsCount + pendingRecruitersCount + pendingMediaCount + pendingRequirementsCount;
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <AdminContext.Provider
      value={{
        talents,
        approveTalent,
        rejectTalent,
        suspendTalent,
        reactivateTalent,
        recruiters,
        verifyRecruiter,
        rejectRecruiter,
        suspendRecruiter,
        reactivateRecruiter,
        mediaQueue,
        approveMedia,
        rejectMedia,
        requirementRequests,
        addClarificationNote,
        markNeedsClarification,
        markReadyToPublish,
        declineRequirement,
        publishRequirementAsCastingCall,
        castingCalls,
        createCastingCall,
        updateCastingCall,
        closeCastingCall,
        reopenCastingCall,
        deleteCastingCall,
        applications,
        updateApplicationStatus,
        markApplicationUnderReview,
        bulkUpdateApplications,
        shortlists,
        moveCandidateToShortlist,
        moveCandidateToPool,
        markCandidateNotSelected,
        sendShortlistToRecruiter,
        moveSelectedCandidatesToBookings,
        bookings,
        updateBookingStatus,
        updateBookingSchedule,
        addBookingCoordinationNote,
        sendAuditionAlert,
        confirmBooking,
        payments,
        addPaymentEntry,
        updatePaymentEntry,
        deletePaymentEntry,
        subscriptions,
        updateSubscriptionStatus,
        broadcasts,
        sendBroadcast,
        notifications,
        markAsRead,
        markAllAsRead,
        activities,
        toasts,
        addToast,
        removeToast,
        pendingTalentsCount,
        pendingRecruitersCount,
        pendingMediaCount,
        pendingRequirementsCount,
        totalPendingApprovals,
        unreadNotificationsCount,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}


