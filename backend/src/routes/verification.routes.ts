import express, { Router, Request, Response, NextFunction } from "express";

import { 
    authenticateUser
 } from "../middleware/auth.middleware.js";

import { 
    authorizeRoles
 } from "../middleware/role.middleware.js";

import { 
    submitIdentityVerification,
    submitProfessionalVerification,
    submitBusinessVerification,
    getMyVerifications,
    getVerificationDocument,
    initiateAadhaarVerification,
    verifyAadhaarOtp,
    withdrawKycConsent
 } from "../controllers/verification.controller.js";

const router = express.Router();

router.post(
    "/identity",
    authenticateUser,
    submitIdentityVerification
);

router.post(
    "/professional",
    authenticateUser,
    authorizeRoles("talent"),
    submitProfessionalVerification
);

router.post(
    "/business",
    authenticateUser,
    authorizeRoles("organization"),
    submitBusinessVerification
);

router.get(
    "/my",
    authenticateUser,
    getMyVerifications
);

router.get(
    "/:verificationId/document",
    authenticateUser,
    getVerificationDocument
);

// Decoupled Aadhaar Verification Endpoints
router.post(
    "/aadhaar/initiate",
    authenticateUser,
    initiateAadhaarVerification
);

router.post(
    "/aadhaar/verify",
    authenticateUser,
    verifyAadhaarOtp
);

router.post(
    "/aadhaar/withdraw-consent",
    authenticateUser,
    withdrawKycConsent
);

export default router;
