import express, { Router, Request, Response, NextFunction } from "express";

import { 
    authenticateUser
 } from "../middleware/auth.middleware.js";

import { 
    authorizeRoles
 } from "../middleware/role.middleware.js";

import { 
    createAudition,
    submitSelfTape,
    reviewAuditionSubmission,
    rescheduleAudition,
    cancelAudition,
    getAuditionsForApplication,
    getMyAuditions,
    getOrganizationAuditions
 } from "../controllers/audition.controller.js";

import {  validateObjectIdParam  } from "../middleware/validateObjectId.middleware.js";

const router = express.Router();

router.param("applicationId", validateObjectIdParam);
router.param("auditionId", validateObjectIdParam);

router.post(
    "/",
    authenticateUser,
    authorizeRoles("organization"),
    createAudition
);

router.post(
    "/application/:applicationId",
    authenticateUser,
    authorizeRoles("organization"),
    createAudition
);

router.patch(
    "/:auditionId/reschedule",
    authenticateUser,
    authorizeRoles("organization"),
    rescheduleAudition
);

router.patch(
    "/:auditionId/cancel",
    authenticateUser,
    authorizeRoles("organization"),
    cancelAudition
);

router.post(
    "/:auditionId/self-tape",
    authenticateUser,
    authorizeRoles("talent"),
    submitSelfTape
);

router.patch(
    "/:auditionId/review",
    authenticateUser,
    authorizeRoles("organization"),
    reviewAuditionSubmission
);

router.get(
    "/application/:applicationId",
    authenticateUser,
    getAuditionsForApplication
);

router.get(
    "/my",
    authenticateUser,
    authorizeRoles("talent"),
    getMyAuditions
);

router.get(
    "/my-auditions",
    authenticateUser,
    authorizeRoles("talent"),
    getMyAuditions
);

router.get(
    "/organization",
    authenticateUser,
    authorizeRoles("organization"),
    getOrganizationAuditions
);

export default router;