const express = require("express");

const {
    authenticateUser
} = require("../middleware/auth.middleware");

const {
    authorizeRoles
} = require("../middleware/role.middleware");

const {
    applyForOpportunity,
    getMyApplications,
    withdrawApplication,
    requestReapplication,
    getOpportunityApplications,
    markApplicationUnderReview,
    shortlistApplication,
    selectApplication,
    markNotSelected
} = require("../controllers/application.controller");

const { validateObjectIdParam } = require("../middleware/validateObjectId.middleware");

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

module.exports = router;