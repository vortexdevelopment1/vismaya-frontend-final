const express = require("express");

const {
    authenticateUser
} = require("../middleware/auth.middleware");

const {
    authorizeRoles
} = require("../middleware/role.middleware");

const {
    createOrUpdateOrganizationProfile,
    getOrganizationProfile,
    getPublicCompanyProfile,
    uploadVerificationDocument
} = require("../controllers/organization.controller");

const {
    addFavourite,
    getFavourites,
    checkFavourite,
    updateFavourite,
    removeFavourite
} = require("../controllers/favourite.controller");

const router = express.Router();

// Public company profile (publicly accessible per O1)
router.get(
    "/public/:slug",
    getPublicCompanyProfile
);

router.get(
    "/company/:slug",
    getPublicCompanyProfile
);

// Organization profile management
router.post(
    "/profile",
    authenticateUser,
    authorizeRoles("organization"),
    createOrUpdateOrganizationProfile
);

router.put(
    "/profile",
    authenticateUser,
    authorizeRoles("organization"),
    createOrUpdateOrganizationProfile
);

router.patch(
    "/profile",
    authenticateUser,
    authorizeRoles("organization"),
    createOrUpdateOrganizationProfile
);

router.get(
    "/profile",
    authenticateUser,
    authorizeRoles("organization"),
    getOrganizationProfile
);

router.post(
    "/verification-doc",
    authenticateUser,
    authorizeRoles("organization"),
    uploadVerificationDocument
);

// Favourites & bookmarks
router.post(
    "/favourites",
    authenticateUser,
    authorizeRoles("organization"),
    addFavourite
);

router.get(
    "/favourites",
    authenticateUser,
    authorizeRoles("organization"),
    getFavourites
);

router.get(
    "/favourites/check/:talentId",
    authenticateUser,
    authorizeRoles("organization"),
    checkFavourite
);

router.patch(
    "/favourites/:talentId",
    authenticateUser,
    authorizeRoles("organization"),
    updateFavourite
);

router.delete(
    "/favourites/:talentId",
    authenticateUser,
    authorizeRoles("organization"),
    removeFavourite
);

// Fallback for public company profile by slug
router.get(
    "/:slug",
    getPublicCompanyProfile
);

module.exports = router;