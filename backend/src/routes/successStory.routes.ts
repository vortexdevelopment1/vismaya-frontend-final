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
    getPendingStories,
    reviewSuccessStory
 } from "../controllers/successStory.controller.js";

const router = express.Router();

// Public: Homepage carousel
router.get("/", getPublishedStories);

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

export default router;
