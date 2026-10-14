const express = require("express");

const {
    authenticateUser
} = require("../middleware/auth.middleware");

const {
    authorizeRoles
} = require("../middleware/role.middleware");

const {
    submitSuccessStory,
    getPublishedStories,
    getPendingStories,
    reviewSuccessStory
} = require("../controllers/successStory.controller");

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

module.exports = router;
