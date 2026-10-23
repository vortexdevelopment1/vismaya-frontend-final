import express, { Router, Request, Response, NextFunction } from "express";

import { 
    authenticateUser
 } from "../middleware/auth.middleware.js";

import { 
    authorizeRoles
 } from "../middleware/role.middleware.js";

import { 
    submitSuccessStory,
    getPublishedStories,
    getMySuccessStories,
    getPendingStories,
    reviewSuccessStory,
    unpublishSuccessStory,
    republishSuccessStory
 } from "../controllers/successStory.controller.js";

const router = express.Router();

// Public: Homepage carousel & directory
router.get("/", getPublishedStories);

// Talent: Get own stories
router.get(
    "/mine",
    authenticateUser,
    authorizeRoles("talent"),
    getMySuccessStories
);

// Talent: Submit success story
router.post(
    "/",
    authenticateUser,
    authorizeRoles("talent"),
    submitSuccessStory
);

// Admin: Review queue & decision
router.get(
    "/pending",
    authenticateUser,
    authorizeRoles("admin"),
    getPendingStories
);

router.patch(
    "/:storyId/review",
    authenticateUser,
    authorizeRoles("admin"),
    reviewSuccessStory
);

router.patch(
    "/:storyId/unpublish",
    authenticateUser,
    authorizeRoles("admin"),
    unpublishSuccessStory
);

router.patch(
    "/:storyId/republish",
    authenticateUser,
    authorizeRoles("admin"),
    republishSuccessStory
);

export default router;
