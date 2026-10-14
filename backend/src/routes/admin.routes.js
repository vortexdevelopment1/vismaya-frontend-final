const express = require("express");

const { authenticateUser } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const {
    approveUser,
    getPendingUsers,
    rejectUser,
    suspendUser,
    reactivateUser,
    banUser,
    unbanUser,
    finalizeUserDeletion,
    getAllUsers,
    getTalentDirectory,
    getOrganizationDirectory,
    getPendingOpportunities,
    approveOpportunity,
    rejectOpportunity,
    requestOpportunityCorrections,
    getCancellationRequests,
    reviewOpportunityCancellation,
    completeOpportunity,
    getReports,
    reviewReport,
    getPendingAuditions,
    reviewAudition,
    getReapplicationRequests,
    reviewReapplication,
    getPendingVerifications,
    reviewVerification,
    getPendingMedia,
    reviewMediaItem,
    getPendingProfileChanges,
    reviewProfileChange,
    updateTalentTrendingStatus,
    getPaymentTransactions,
    adjustCreditBalance,
    getCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    getAllOpportunitiesAdmin,
    getAllApplicationsAdmin,
    getAllProjectsAdmin,
    getDashboardMetrics,
    getAuditLogs,
    globalAdminSearch,
    exportAdminData,
    approveTalentProfile,
    rejectTalentProfile,
    suspendTalentProfile,
    reactivateTalentProfile,
    getPendingTalentProfiles,
    getTalentProfileById
} = require("../controllers/admin.controller");

const {
    sendBroadcast,
    getBroadcasts,
    getBroadcastById,
    updateBroadcast,
    deleteBroadcast,
    getBroadcastReach
} = require("../controllers/broadcast.controller");

const { validateObjectIdParam } = require("../middleware/validateObjectId.middleware");

const router = express.Router();

router.param("opportunityId", validateObjectIdParam);
router.param("applicationId", validateObjectIdParam);
router.param("verificationId", validateObjectIdParam);
router.param("mediaId", validateObjectIdParam);
router.param("couponId", validateObjectIdParam);
router.param("profileId", validateObjectIdParam);
router.param("reportId", validateObjectIdParam);
router.param("auditionId", validateObjectIdParam);
router.param("broadcastId", validateObjectIdParam);

// Talent Profile Management
router.get("/talents/pending", authenticateUser, authorizeRoles("admin"), getPendingTalentProfiles);
router.get("/talents", authenticateUser, authorizeRoles("admin"), getTalentDirectory);
router.get("/talents/:talentId", authenticateUser, authorizeRoles("admin"), getTalentProfileById);

router.patch("/talents/:talentId/approve", authenticateUser, authorizeRoles("admin"), approveTalentProfile);
router.post("/talents/:talentId/approve", authenticateUser, authorizeRoles("admin"), approveTalentProfile);
router.patch("/talents/:id/approve", authenticateUser, authorizeRoles("admin"), approveTalentProfile);
router.post("/talents/:id/approve", authenticateUser, authorizeRoles("admin"), approveTalentProfile);

router.patch("/talents/:talentId/reject", authenticateUser, authorizeRoles("admin"), rejectTalentProfile);
router.post("/talents/:talentId/reject", authenticateUser, authorizeRoles("admin"), rejectTalentProfile);
router.patch("/talents/:id/reject", authenticateUser, authorizeRoles("admin"), rejectTalentProfile);
router.post("/talents/:id/reject", authenticateUser, authorizeRoles("admin"), rejectTalentProfile);

router.patch("/talents/:talentId/suspend", authenticateUser, authorizeRoles("admin"), suspendTalentProfile);
router.post("/talents/:talentId/suspend", authenticateUser, authorizeRoles("admin"), suspendTalentProfile);
router.patch("/talents/:id/suspend", authenticateUser, authorizeRoles("admin"), suspendTalentProfile);
router.post("/talents/:id/suspend", authenticateUser, authorizeRoles("admin"), suspendTalentProfile);

router.patch("/talents/:talentId/reactivate", authenticateUser, authorizeRoles("admin"), reactivateTalentProfile);
router.post("/talents/:talentId/reactivate", authenticateUser, authorizeRoles("admin"), reactivateTalentProfile);
router.patch("/talents/:id/reactivate", authenticateUser, authorizeRoles("admin"), reactivateTalentProfile);
router.post("/talents/:id/reactivate", authenticateUser, authorizeRoles("admin"), reactivateTalentProfile);
router.patch("/talents/:talentId/trending", authenticateUser, authorizeRoles("admin"), updateTalentTrendingStatus);

// User Management (Supports both PATCH and POST, with :userId or :id parameter)
router.get("/users", authenticateUser, authorizeRoles("admin"), getAllUsers);
router.get("/users/pending", authenticateUser, authorizeRoles("admin"), getPendingUsers);

router.patch("/users/:userId/approve", authenticateUser, authorizeRoles("admin"), approveUser);
router.post("/users/:userId/approve", authenticateUser, authorizeRoles("admin"), approveUser);
router.patch("/users/:id/approve", authenticateUser, authorizeRoles("admin"), approveUser);
router.post("/users/:id/approve", authenticateUser, authorizeRoles("admin"), approveUser);

router.patch("/users/:userId/reject", authenticateUser, authorizeRoles("admin"), rejectUser);
router.post("/users/:userId/reject", authenticateUser, authorizeRoles("admin"), rejectUser);
router.patch("/users/:id/reject", authenticateUser, authorizeRoles("admin"), rejectUser);
router.post("/users/:id/reject", authenticateUser, authorizeRoles("admin"), rejectUser);

router.patch("/users/:userId/suspend", authenticateUser, authorizeRoles("admin"), suspendUser);
router.post("/users/:userId/suspend", authenticateUser, authorizeRoles("admin"), suspendUser);
router.patch("/users/:id/suspend", authenticateUser, authorizeRoles("admin"), suspendUser);
router.post("/users/:id/suspend", authenticateUser, authorizeRoles("admin"), suspendUser);

router.patch("/users/:userId/reactivate", authenticateUser, authorizeRoles("admin"), reactivateUser);
router.post("/users/:userId/reactivate", authenticateUser, authorizeRoles("admin"), reactivateUser);
router.patch("/users/:id/reactivate", authenticateUser, authorizeRoles("admin"), reactivateUser);
router.post("/users/:id/reactivate", authenticateUser, authorizeRoles("admin"), reactivateUser);

router.patch("/users/:userId/ban", authenticateUser, authorizeRoles("admin"), banUser);
router.post("/users/:userId/ban", authenticateUser, authorizeRoles("admin"), banUser);
router.patch("/users/:userId/unban", authenticateUser, authorizeRoles("admin"), unbanUser);
router.post("/users/:userId/unban", authenticateUser, authorizeRoles("admin"), unbanUser);
router.post("/users/:userId/finalize-deletion", authenticateUser, authorizeRoles("admin"), finalizeUserDeletion);
router.delete("/users/:userId", authenticateUser, authorizeRoles("admin"), finalizeUserDeletion);

// Organization Directory
router.get("/organizations", authenticateUser, authorizeRoles("admin"), getOrganizationDirectory);

// Profile Changes Queue & Decisions
router.get("/profile-changes", authenticateUser, authorizeRoles("admin"), getPendingProfileChanges);
router.patch("/profile-changes/:profileId/review", authenticateUser, authorizeRoles("admin"), reviewProfileChange);

// Opportunities Queue & Review
router.get("/opportunities", authenticateUser, authorizeRoles("admin"), getAllOpportunitiesAdmin);
router.get("/opportunities/pending", authenticateUser, authorizeRoles("admin"), getPendingOpportunities);
router.get("/opportunities/cancellations", authenticateUser, authorizeRoles("admin"), getCancellationRequests);
router.get("/cancellation-requests", authenticateUser, authorizeRoles("admin"), getCancellationRequests);
router.patch("/opportunities/:opportunityId/approve", authenticateUser, authorizeRoles("admin"), approveOpportunity);
router.post("/opportunities/:opportunityId/approve", authenticateUser, authorizeRoles("admin"), approveOpportunity);
router.patch("/opportunities/:id/approve", authenticateUser, authorizeRoles("admin"), approveOpportunity);
router.post("/opportunities/:id/approve", authenticateUser, authorizeRoles("admin"), approveOpportunity);

router.patch("/opportunities/:opportunityId/reject", authenticateUser, authorizeRoles("admin"), rejectOpportunity);
router.post("/opportunities/:opportunityId/reject", authenticateUser, authorizeRoles("admin"), rejectOpportunity);
router.patch("/opportunities/:id/reject", authenticateUser, authorizeRoles("admin"), rejectOpportunity);
router.post("/opportunities/:id/reject", authenticateUser, authorizeRoles("admin"), rejectOpportunity);

router.patch("/opportunities/:opportunityId/request-corrections", authenticateUser, authorizeRoles("admin"), requestOpportunityCorrections);
router.post("/opportunities/:opportunityId/request-corrections", authenticateUser, authorizeRoles("admin"), requestOpportunityCorrections);
router.patch("/opportunities/:opportunityId/review-cancellation", authenticateUser, authorizeRoles("admin"), reviewOpportunityCancellation);
router.patch("/opportunities/:opportunityId/complete", authenticateUser, authorizeRoles("admin"), completeOpportunity);

// Applications Admin Queue
router.get("/applications", authenticateUser, authorizeRoles("admin"), getAllApplicationsAdmin);

// Projects Admin Queue
router.get("/projects", authenticateUser, authorizeRoles("admin"), getAllProjectsAdmin);

// Reports Queue & Review
router.get("/reports", authenticateUser, authorizeRoles("admin"), getReports);
router.patch("/reports/:reportId/review", authenticateUser, authorizeRoles("admin"), reviewReport);

// Auditions Queue & Review
router.get("/auditions", authenticateUser, authorizeRoles("admin"), getPendingAuditions);
router.get("/auditions/pending", authenticateUser, authorizeRoles("admin"), getPendingAuditions);
router.patch("/auditions/:auditionId/review", authenticateUser, authorizeRoles("admin"), reviewAudition);
router.patch("/auditions/:auditionId/approve", authenticateUser, authorizeRoles("admin"), (req, res, next) => {
    req.body.action = "approve";
    return reviewAudition(req, res, next);
});
router.patch("/auditions/:auditionId/reject", authenticateUser, authorizeRoles("admin"), (req, res, next) => {
    req.body.action = "reject";
    return reviewAudition(req, res, next);
});

// Reapplication Requests
router.get("/reapplications/pending", authenticateUser, authorizeRoles("admin"), getReapplicationRequests);
router.patch("/reapplications/:applicationId/review", authenticateUser, authorizeRoles("admin"), reviewReapplication);

// Verification Queue & Decisions
router.get("/verifications/pending", authenticateUser, authorizeRoles("admin"), getPendingVerifications);
router.patch("/verifications/:verificationId/review", authenticateUser, authorizeRoles("admin"), reviewVerification);

// Media Moderation Queue & Decisions
router.get("/media", authenticateUser, authorizeRoles("admin"), getPendingMedia);
router.get("/media/pending", authenticateUser, authorizeRoles("admin"), getPendingMedia);
router.patch("/media/:mediaId/review", authenticateUser, authorizeRoles("admin"), reviewMediaItem);

// Transactions & Credit Balances
router.get("/transactions", authenticateUser, authorizeRoles("admin"), getPaymentTransactions);
router.post("/credits/adjust", authenticateUser, authorizeRoles("admin"), adjustCreditBalance);

// Coupons Management
router.get("/coupons", authenticateUser, authorizeRoles("admin"), getCoupons);
router.post("/coupons", authenticateUser, authorizeRoles("admin"), createCoupon);
router.patch("/coupons/:couponId", authenticateUser, authorizeRoles("admin"), updateCoupon);
router.delete("/coupons/:couponId", authenticateUser, authorizeRoles("admin"), deleteCoupon);

// Dashboard Metrics
router.get("/dashboard", authenticateUser, authorizeRoles("admin"), getDashboardMetrics);

// Audit Logs
router.get("/audit-logs", authenticateUser, authorizeRoles("admin"), getAuditLogs);

// Global Search
router.get("/search", authenticateUser, authorizeRoles("admin"), globalAdminSearch);

// Operational CSV Export
router.get("/export/:type", authenticateUser, authorizeRoles("admin"), exportAdminData);

// Broadcasts — admin notification dispatch & history (in-app + email + SMS + WhatsApp)
router.get("/broadcasts/reach", authenticateUser, authorizeRoles("admin"), getBroadcastReach);
router.get("/broadcasts", authenticateUser, authorizeRoles("admin"), getBroadcasts);
router.get("/broadcasts/:broadcastId", authenticateUser, authorizeRoles("admin"), getBroadcastById);
router.post("/broadcasts", authenticateUser, authorizeRoles("admin"), sendBroadcast);
router.patch("/broadcasts/:broadcastId", authenticateUser, authorizeRoles("admin"), updateBroadcast);
router.delete("/broadcasts/:broadcastId", authenticateUser, authorizeRoles("admin"), deleteBroadcast);

module.exports = router;