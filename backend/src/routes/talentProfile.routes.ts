import express, { Router, Request, Response, NextFunction } from "express";

import { 
    authenticateUser,
    optionalAuth
 } from "../middleware/auth.middleware.js";

import { 
    authorizeRoles
 } from "../middleware/role.middleware.js";

import { 
    createOrUpdateProfile,
    getMyProfile,
    searchTalentDirectory,
    getFeaturedTalent,
    getPublicTalentProfile,
    unlockTalentProfile,
    getCompletionStatus,
    getMyAnalytics,
    getShareCard,
    getTalentSettings,
    updateTalentSettings,
    updateNotificationSettings,
    addTalentCredit,
    updateTalentCredit,
    deleteTalentCredit
 } from "../controllers/talentProfile.controller.js";

const router = express.Router();

// Talent Settings routes (Spec §34 & §38)
router.get(
    "/settings",
    authenticateUser,
    authorizeRoles("talent"),
    getTalentSettings
);

router.put(
    "/settings",
    authenticateUser,
    authorizeRoles("talent"),
    updateTalentSettings
);

router.post(
    "/settings",
    authenticateUser,
    authorizeRoles("talent"),
    updateTalentSettings
);

router.get(
    "/settings/notifications",
    authenticateUser,
    authorizeRoles("talent"),
    getTalentSettings
);

router.put(
    "/settings/notifications",
    authenticateUser,
    authorizeRoles("talent"),
    updateNotificationSettings
);

router.post(
    "/settings/notifications",
    authenticateUser,
    authorizeRoles("talent"),
    updateNotificationSettings
);

// Talent profile management
router.post(
    "/",
    authenticateUser,
    authorizeRoles("talent"),
    createOrUpdateProfile
);

router.put(
    "/",
    authenticateUser,
    authorizeRoles("talent"),
    createOrUpdateProfile
);

router.get(
    "/my",
    authenticateUser,
    authorizeRoles("talent"),
    getMyProfile
);

router.get(
    "/me",
    authenticateUser,
    authorizeRoles("talent"),
    getMyProfile
);

router.get(
    "/completion-status",
    authenticateUser,
    authorizeRoles("talent"),
    getCompletionStatus
);

router.get(
    "/analytics",
    authenticateUser,
    authorizeRoles("talent"),
    getMyAnalytics
);

// Search & discovery routes — optionalAuth: guests get masked card data, authenticated users get role-aware cards
router.get(
    "/search",
    optionalAuth,
    searchTalentDirectory
);

router.get(
    "/featured",
    optionalAuth,
    getFeaturedTalent
);

// Talent Work Credits Management
router.post(
    "/credits",
    authenticateUser,
    authorizeRoles("talent"),
    addTalentCredit
);

router.put(
    "/credits/:creditId",
    authenticateUser,
    authorizeRoles("talent"),
    updateTalentCredit
);

router.delete(
    "/credits/:creditId",
    authenticateUser,
    authorizeRoles("talent"),
    deleteTalentCredit
);

// Share Card endpoint
router.get(
    "/:vismayaIdOrId/share-card",
    getShareCard
);

// 1-Credit Profile Unlock
router.post(
    "/:vismayaIdOrId/unlock",
    authenticateUser,
    authorizeRoles("organization"),
    unlockTalentProfile
);

// Controlled profile view — optionalAuth: guests get locked preview, auth users get role-aware view
router.get(
    "/:vismayaIdOrId",
    optionalAuth,
    getPublicTalentProfile
);

export default router;
