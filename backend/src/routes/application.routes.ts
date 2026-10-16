import express, { Router, Request, Response, NextFunction } from "express";

import { 
    authenticateUser
 } from "../middleware/auth.middleware.js";

import { 
    authorizeRoles
 } from "../middleware/role.middleware.js";

import { 
    applyForOpportunity,
    getMyApplications,
    withdrawApplication,
    requestReapplication,
    getOpportunityApplications,
    getApplicantPortfolio,
    markApplicationUnderReview,
    shortlistApplication,
    selectApplication,
    markNotSelected
 } from "../controllers/application.controller.js";

import {  validateObjectIdParam  } from "../middleware/validateObjectId.middleware.js";

const router = express.Router();

router.param("opportunityId", validateObjectIdParam);
router.param("applicationId", validateObjectIdParam);

router.post(
    "/",
    authenticateUser,
    authorizeRoles("talent"),
    applyForOpportunity
);

router.post(
    "/apply",
    authenticateUser,
    authorizeRoles("talent"),
    applyForOpportunity
);

router.post(
    "/:opportunityId/apply",
    authenticateUser,
    authorizeRoles("talent"),
    applyForOpportunity
);

router.get(
    "/my",
    authenticateUser,
    authorizeRoles("talent"),
    getMyApplications
);

router.patch(
    "/:applicationId/withdraw",
    authenticateUser,
    authorizeRoles("talent"),
    withdrawApplication
);

router.post(
    "/:applicationId/withdraw",
    authenticateUser,
    authorizeRoles("talent"),
    withdrawApplication
);

router.post(
    "/:applicationId/reapplication-request",
    authenticateUser,
    authorizeRoles("talent"),
    requestReapplication
);

router.get(
    "/opportunity/:opportunityId",
    authenticateUser,
    authorizeRoles("organization"),
    getOpportunityApplications
);

router.get(
    "/:applicationId/portfolio",
    authenticateUser,
    authorizeRoles("organization"),
    getApplicantPortfolio
);

router.patch(
    "/:applicationId/review",
    authenticateUser,
    authorizeRoles("organization"),
    markApplicationUnderReview
);

router.patch(
    "/:applicationId/shortlist",
    authenticateUser,
    authorizeRoles("organization"),
    shortlistApplication
);

router.patch(
    "/:applicationId/select",
    authenticateUser,
    authorizeRoles("organization"),
    selectApplication
);

router.patch(
    "/:applicationId/not-selected",
    authenticateUser,
    authorizeRoles("organization"),
    markNotSelected
);

export default router;