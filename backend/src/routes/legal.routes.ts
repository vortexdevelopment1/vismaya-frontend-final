import express from "express";
import { authenticateUser } from "../middleware/auth.middleware.js";
import { recordConsent, getConsentStatus, getPolicyInfo } from "../controllers/legal.controller.js";

const router = express.Router();

router.get("/policies/:type", getPolicyInfo);
router.post("/consent", authenticateUser, recordConsent);
router.get("/consent/status", authenticateUser, getConsentStatus);

export default router;
