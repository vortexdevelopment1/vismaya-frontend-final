import express, { Router, Request, Response, NextFunction } from "express";

import { 
    authenticateUser
 } from "../middleware/auth.middleware.js";

import { 
    authorizeRoles
 } from "../middleware/role.middleware.js";

import { 
    createOrUpdateOrganizationProfile,
    getOrganizationProfile,
    getPublicCompanyProfile,
    uploadVerificationDocument
 } from "../controllers/organization.controller.js";

import { 
    addFavourite,
    getFavourites,
    checkFavourite,
    updateFavourite,
    removeFavourite
 } from "../controllers/favourite.controller.js";

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

export default router;