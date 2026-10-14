const express = require("express");

const {
    authenticateUser,
    optionalAuth
} = require("../middleware/auth.middleware");

const {
    authorizeRoles
} = require("../middleware/role.middleware");

const {
    createOpportunity,
    updateOpportunity,
    completeOpportunity,
    getPublishedOpportunities,
    getOpportunityById,
    requestOpportunityCancellation,
    getOrganizationOpportunities,
    reportOpportunity
} = require("../controllers/opportunity.controller");

const { validateObjectIdParam } = require("../middleware/validateObjectId.middleware");

const router = express.Router();

router.param("opportunityId", validateObjectIdParam);

// Create opportunity (organization only)
router.post(
    "/",
    authenticateUser,
    authorizeRoles("organization"),
    createOpportunity
);

// Edit & Resubmit opportunity (organization only)
router.put(
    "/:opportunityId",
    authenticateUser,
    authorizeRoles("organization"),
    updateOpportunity
);

router.patch(
    "/:opportunityId",
    authenticateUser,
    authorizeRoles("organization"),
    updateOpportunity
);

// Mark opportunity completed (organization only)
router.post(
    "/:opportunityId/complete",
    authenticateUser,
    authorizeRoles("organization"),
    completeOpportunity
);

// Published opportunities (public exploration + talent/organization matching)
router.get(
    "/published",
    optionalAuth,
    getPublishedOpportunities
);

// Organization own opportunities
router.get(
    "/my-opportunities",
    authenticateUser,
    authorizeRoles("organization"),
    getOrganizationOpportunities
);

// Opportunity details by ID (authenticated users only)
router.get(
    "/view/:opportunityId",
    authenticateUser,
    getOpportunityById
);

router.get(
    "/:opportunityId",
    authenticateUser,
    getOpportunityById
);

// Request opportunity cancellation
router.post(
    "/:opportunityId/cancel-request",
    authenticateUser,
    authorizeRoles("organization"),
    requestOpportunityCancellation
);

router.post(
    "/:opportunityId/request-cancellation",
    authenticateUser,
    authorizeRoles("organization"),
    requestOpportunityCancellation
);

// Report opportunity (§31: only applicants can report)
router.post(
    "/:opportunityId/report",
    authenticateUser,
    authorizeRoles("talent"),
    reportOpportunity
);

module.exports = router;