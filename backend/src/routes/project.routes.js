const express = require("express");

const {
    authenticateUser
} = require("../middleware/auth.middleware");

const {
    authorizeRoles
} = require("../middleware/role.middleware");

const {
    createProject,
    getMyProjects,
    getProjectDetails,
    updateProject,
    addToShortlist,
    getProjectShortlist,
    updateShortlistItem,
    removeFromShortlist
} = require("../controllers/project.controller");

const { validateObjectIdParam } = require("../middleware/validateObjectId.middleware");

const router = express.Router();

router.param("projectId", validateObjectIdParam);
router.param("shortlistId", validateObjectIdParam);

// Project CRUD
router.post(
    "/",
    authenticateUser,
    authorizeRoles("organization"),
    createProject
);

router.get(
    "/",
    authenticateUser,
    authorizeRoles("organization"),
    getMyProjects
);

router.get(
    "/:projectId",
    authenticateUser,
    authorizeRoles("organization"),
    getProjectDetails
);

router.patch(
    "/:projectId",
    authenticateUser,
    authorizeRoles("organization"),
    updateProject
);

// Project-specific Shortlist
router.post(
    "/:projectId/shortlist",
    authenticateUser,
    authorizeRoles("organization"),
    addToShortlist
);

router.get(
    "/:projectId/shortlist",
    authenticateUser,
    authorizeRoles("organization"),
    getProjectShortlist
);

router.patch(
    "/:projectId/shortlist/:shortlistId",
    authenticateUser,
    authorizeRoles("organization"),
    updateShortlistItem
);

router.delete(
    "/:projectId/shortlist/:shortlistId",
    authenticateUser,
    authorizeRoles("organization"),
    removeFromShortlist
);

module.exports = router;