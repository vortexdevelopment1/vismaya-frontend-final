const express = require("express");

const {
    authenticateUser
} = require("../middleware/auth.middleware");

const {
    uploadMedia
} = require("../middleware/upload.middleware");

const {
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
} = require("../controllers/media.controller");

const { authorizeRoles } = require("../middleware/role.middleware");
const { validateObjectIdParam } = require("../middleware/validateObjectId.middleware");

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

module.exports = router;
