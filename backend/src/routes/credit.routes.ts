import express, { Router, Request, Response, NextFunction } from "express";

import { 
    authenticateUser
 } from "../middleware/auth.middleware.js";

import { 
    authorizeRoles
 } from "../middleware/role.middleware.js";

import { 
    getMyCreditBalance,
    getCreditHistory,
    getViewedTalents,
    unlockFullTalentProfile
 } from "../controllers/credit.controller.js";

const router = express.Router();

router.get(
    "/balance",
    authenticateUser,
    authorizeRoles("organization"),
    getMyCreditBalance
);

router.get(
    "/history",
    authenticateUser,
    authorizeRoles("organization"),
    getCreditHistory
);

router.get(
    "/viewed",
    authenticateUser,
    authorizeRoles("organization"),
    getViewedTalents
);

router.post(
    "/unlock/:talentIdOrVismayaId",
    authenticateUser,
    authorizeRoles("organization"),
    unlockFullTalentProfile
);

export default router;
