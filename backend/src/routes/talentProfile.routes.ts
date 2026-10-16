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
    getShareCard
 } from "../controllers/talentProfile.controller.js";

const router = express.Router();

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
