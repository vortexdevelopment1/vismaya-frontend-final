import express, { Router, Request, Response, NextFunction } from "express";

import { 
    authenticateUser
 } from "../middleware/auth.middleware.js";

import { 
    uploadMedia
 } from "../middleware/upload.middleware.js";

import { 
    uploadMediaFile,
    uploadMultipleMediaFiles,
    getUploadSignature,
    addMediaItem,
    getMyMedia,
    getUserMedia,
    updateMediaItem,
    deleteMediaItem,
    reorderMedia,
    disputeMedia,
    nominateFeatured,
    featureMediaItem
 } from "../controllers/media.controller.js";

import {  authorizeRoles  } from "../middleware/role.middleware.js";
import {  validateObjectIdParam  } from "../middleware/validateObjectId.middleware.js";

const router = express.Router();

router.param("userId", validateObjectIdParam);
router.param("mediaId", validateObjectIdParam);

// 1. Direct Cloudinary Upload Endpoints
router.post(
    "/upload",
    authenticateUser,
    uploadMedia.single("file"),
    uploadMediaFile
);

router.post(
    "/upload-multiple",
    authenticateUser,
    uploadMedia.array("files", 5),
    uploadMultipleMediaFiles
);

router.get(
    "/signature",
    authenticateUser,
    getUploadSignature
);

// 2. Media CRUD & Profile Attachment
router.post(
    "/",
    authenticateUser,
    uploadMedia.single("file"),
    addMediaItem
);

router.patch(
    "/order",
    authenticateUser,
    reorderMedia
);

router.get(
    "/my",
    authenticateUser,
    getMyMedia
);

router.get(
    "/user/:userId",
    authenticateUser,
    getUserMedia
);

router.post(
    "/:mediaId/dispute",
    authenticateUser,
    disputeMedia
);

router.post(
    "/:mediaId/nominate-featured",
    authenticateUser,
    nominateFeatured
);

router.patch(
    "/:mediaId/feature",
    authenticateUser,
    authorizeRoles("admin"),
    featureMediaItem
);

router.patch(
    "/:mediaId",
    authenticateUser,
    updateMediaItem
);

router.delete(
    "/:mediaId",
    authenticateUser,
    deleteMediaItem
);

export default router;
