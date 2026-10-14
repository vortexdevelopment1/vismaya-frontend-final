const express = require("express");

const {
    authenticateUser
} = require("../middleware/auth.middleware");

const {
    authorizeRoles
} = require("../middleware/role.middleware");

const {
    createOrUpdateProfile,
    getMyProfile,
    searchTalentDirectory,
    getFeaturedTalent,
    getPublicTalentProfile,
    unlockTalentProfile,
    getCompletionStatus,
    getMyAnalytics,
    getShareCard
} = require("../controllers/talentProfile.controller");

const router = express.Router();

// Talent profile management
router.post(
    "/",
    authenticateUser,
    authorizeRoles("talent"),
    createOrUpdateProfile
);

router.put(
    "/",
    authenticateUser,
    authorizeRoles("talent"),
    createOrUpdateProfile
);

router.get(
    "/my",
    authenticateUser,
    authorizeRoles("talent"),
    getMyProfile
);

router.get(
    "/me",
    authenticateUser,
    authorizeRoles("talent"),
    getMyProfile
);

router.get(
    "/completion-status",
    authenticateUser,
    authorizeRoles("talent"),
    getCompletionStatus
);

router.get(
    "/analytics",
    authenticateUser,
    authorizeRoles("talent"),
    getMyAnalytics
);

// Search & discovery routes (Strictly authenticated per §1 & §7)
router.get(
    "/search",
    authenticateUser,
    searchTalentDirectory
);

router.get(
    "/featured",
    authenticateUser,
    getFeaturedTalent
);

// Share Card endpoint
router.get(
    "/:vismayaIdOrId/share-card",
    getShareCard
);

// 1-Credit Profile Unlock
router.post(
    "/:vismayaIdOrId/unlock",
    authenticateUser,
    authorizeRoles("organization"),
    unlockTalentProfile
);

// Controlled profile view (masked for preview / consumes credit for full view)
router.get(
    "/:vismayaIdOrId",
    authenticateUser,
    getPublicTalentProfile
);

module.exports = router;
