import express, { Router, Request, Response, NextFunction } from "express";

import { 
    authenticateUser
 } from "../middleware/auth.middleware.js";

import { 
    authorizeRoles
 } from "../middleware/role.middleware.js";

import { 
    createProject,
    getMyProjects,
    getProjectDetails,
    updateProject,
    addToShortlist,
    getProjectShortlist,
    updateShortlistItem,
    removeFromShortlist
 } from "../controllers/project.controller.js";

import {  validateObjectIdParam  } from "../middleware/validateObjectId.middleware.js";

const router = express.Router();

router.param("projectId", validateObjectIdParam);
router.param("shortlistId", validateObjectIdParam);

// Project CRUD
router.post(
    "/",
    authenticateUser,
    authorizeRoles("organization"),
    createProject
);

router.get(
    "/",
    authenticateUser,
    authorizeRoles("organization"),
    getMyProjects
);

router.get(
    "/:projectId",
    authenticateUser,
    authorizeRoles("organization"),
    getProjectDetails
);

router.patch(
    "/:projectId",
    authenticateUser,
    authorizeRoles("organization"),
    updateProject
);

// Project-specific Shortlist
router.post(
    "/:projectId/shortlist",
    authenticateUser,
    authorizeRoles("organization"),
    addToShortlist
);

router.get(
    "/:projectId/shortlist",
    authenticateUser,
    authorizeRoles("organization"),
    getProjectShortlist
);

router.patch(
    "/:projectId/shortlist/:shortlistId",
    authenticateUser,
    authorizeRoles("organization"),
    updateShortlistItem
);

router.delete(
    "/:projectId/shortlist/:shortlistId",
    authenticateUser,
    authorizeRoles("organization"),
    removeFromShortlist
);

export default router;