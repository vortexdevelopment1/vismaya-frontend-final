import express, { Router, Request, Response, NextFunction } from "express";
const router = express.Router();
import {  getPublicStats, submitContactInquiry  } from "../controllers/public.controller.js";

// Platform public statistics
router.get("/public/stats", getPublicStats);
router.get("/stats", getPublicStats);

// Public contact form inquiry
router.post("/contact", submitContactInquiry);

export default router;
