const express = require("express");
const router = express.Router();
const { getPublicStats, submitContactInquiry } = require("../controllers/public.controller");

// Platform public statistics
router.get("/public/stats", getPublicStats);
router.get("/stats", getPublicStats);

// Public contact form inquiry
router.post("/contact", submitContactInquiry);

module.exports = router;
