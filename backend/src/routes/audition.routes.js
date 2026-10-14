const express = require("express");

const {
    authenticateUser
} = require("../middleware/auth.middleware");

const {
    authorizeRoles
} = require("../middleware/role.middleware");

const {
    createAudition,
    submitSelfTape,
    reviewAuditionSubmission,
    getAuditionsForApplication,
    getMyAuditions,
    getOrganizationAuditions
} = require("../controllers/audition.controller");

const { validateObjectIdParam } = require("../middleware/validateObjectId.middleware");

const router = express.Router();

router.param("applicationId", validateObjectIdParam);
router.param("auditionId", validateObjectIdParam);

router.post(
    "/application/:applicationId",
    authenticateUser,
    authorizeRoles("organization"),
    createAudition
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
    "/organization",
    authenticateUser,
    authorizeRoles("organization"),
    getOrganizationAuditions
);

module.exports = router;