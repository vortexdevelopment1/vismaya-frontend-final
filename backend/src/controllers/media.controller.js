const crypto = require("crypto");
const MediaItem = require("../models/mediaItem.model");
const TalentProfile = require("../models/talentProfile.model");
const { calculateProfileCompletion } = require("../utils/profileCompletion.util");
const { isSafeUrl } = require("../utils/sanitize.util");
const { uploadFileBuffer, deleteFile, generateSignedUploadParams } = require("../services/cloudinary.service");
const mediaLimits = require("../config/mediaLimits");

/**
 * Upload a single media file directly to Cloudinary
 * POST /api/media/upload
 */
const uploadMediaFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded. Please provide a file in form-data under key 'file'"
            });
        }

        const folder = req.body.folder || "vismaya/media";
        const uploadResult = await uploadFileBuffer(req.file, folder);

        res.status(200).json({
            success: true,
            message: "File uploaded to Cloudinary successfully",
            data: uploadResult
        });
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Something went wrong while uploading file to Cloudinary"
        });
    }
};

/**
 * Upload multiple media files directly to Cloudinary
 * POST /api/media/upload-multiple
 */
const uploadMultipleMediaFiles = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No files uploaded. Please provide files in form-data under key 'files'"
            });
        }

        const folder = req.body.folder || "vismaya/media";
        const uploadPromises = req.files.map(file => uploadFileBuffer(file, folder));
        const results = await Promise.all(uploadPromises);

        res.status(200).json({
            success: true,
            message: `${results.length} files uploaded to Cloudinary successfully`,
            data: results
        });
    } catch (error) {
        console.error("Multiple upload error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Something went wrong while uploading files"
        });
    }
};

/**
 * Generate signed upload parameters for direct browser-to-Cloudinary upload
 * GET /api/media/signature
 */
const getUploadSignature = (req, res) => {
    try {
        const folder = req.query.folder || "vismaya/media";
        const signatureData = generateSignedUploadParams(folder);

        res.status(200).json({
            success: true,
            data: signatureData
        });
    } catch (error) {
        console.error("Get signature error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while generating upload signature"
        });
    }
};

/**
 * Add a media item to user profile (supports both multipart req.file and JSON payload)
 * POST /api/media
 */
const addMediaItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        let {
            mediaType,
            category,
            title,
            description,
            url,
            thumbnailUrl,
            mimeType,
            fileSizeBytes,
            durationSeconds,
            displayOrder,
            visibility,
            isMainProfilePhoto,
            rightsConfirmed,
            contentHash
        } = req.body;

        // Specification Rule: Rights confirmation is mandatory
        if (rightsConfirmed !== true && rightsConfirmed !== "true") {
            return res.status(400).json({
                success: false,
                message: "Rights confirmation is required. You must confirm that you own or have explicit rights to publish this media."
            });
        }

        // Specification Rule: Prohibit direct audio upload
        if (mediaType === "audio" || (mimeType && mimeType.startsWith("audio/"))) {
            return res.status(400).json({
                success: false,
                message: "Direct audio uploads are not supported. Please upload video showreels or external links (e.g. YouTube/Vimeo/SoundCloud)."
            });
        }

        // If file is uploaded directly as multipart form-data, upload to Cloudinary first
        if (req.file) {
            if (req.file.mimetype && req.file.mimetype.startsWith("audio/")) {
                return res.status(400).json({
                    success: false,
                    message: "Direct audio uploads are not supported."
                });
            }

            // Compute SHA-256 hash if buffer present
            if (req.file.buffer) {
                contentHash = crypto.createHash("sha256").update(req.file.buffer).digest("hex");
            }

            const folder = isMainProfilePhoto ? "vismaya/profiles" : "vismaya/media";
            const uploadRes = await uploadFileBuffer(req.file, folder);
            url = uploadRes.url;
            mimeType = mimeType || req.file.mimetype;
            fileSizeBytes = fileSizeBytes || uploadRes.bytes;
            durationSeconds = durationSeconds || uploadRes.duration;

            if (!mediaType) {
                if (req.file.mimetype.startsWith("image/")) mediaType = "photo";
                else if (req.file.mimetype.startsWith("video/")) mediaType = "video";
                else mediaType = "document";
            }
        }

        if (!url || typeof url !== "string") {
            return res.status(400).json({
                success: false,
                message: "Media URL or uploaded file is required"
            });
        }

        if (!isSafeUrl(url.trim())) {
            return res.status(400).json({
                success: false,
                message: "Invalid or unsafe URL format. Only HTTP, HTTPS, or relative paths are permitted."
            });
        }

        if (!["photo", "video", "document", "external_link"].includes(mediaType)) {
            return res.status(400).json({
                success: false,
                message: "Valid media type is required: 'photo', 'video', 'document', or 'external_link'"
            });
        }

        // Size and duration limits check
        if (fileSizeBytes && mediaLimits.MAX_FILE_SIZES[mediaType] && fileSizeBytes > mediaLimits.MAX_FILE_SIZES[mediaType]) {
            return res.status(400).json({
                success: false,
                message: `File size exceeds maximum allowed limit for ${mediaType}`
            });
        }

        if (durationSeconds && mediaLimits.MAX_DURATIONS[mediaType] && durationSeconds > mediaLimits.MAX_DURATIONS[mediaType]) {
            return res.status(400).json({
                success: false,
                message: `Media duration exceeds maximum limit of ${mediaLimits.MAX_DURATIONS[mediaType]} seconds`
            });
        }

        // Count limits per type
        if (mediaLimits.MAX_COUNTS_PER_TYPE[mediaType]) {
            const currentCount = await MediaItem.countDocuments({ owner: userId, mediaType });
            if (currentCount >= mediaLimits.MAX_COUNTS_PER_TYPE[mediaType]) {
                return res.status(400).json({
                    success: false,
                    message: `Maximum count of ${mediaLimits.MAX_COUNTS_PER_TYPE[mediaType]} items reached for media type '${mediaType}'`
                });
            }
        }

        // If contentHash not provided and not computed from file, compute from URL
        if (!contentHash && url) {
            contentHash = crypto.createHash("sha256").update(url.trim()).digest("hex");
        }

        // Exact-duplicate SHA-256 hash check per owner -> 409 Conflict
        if (contentHash) {
            const duplicate = await MediaItem.findOne({ owner: userId, contentHash });
            if (duplicate) {
                return res.status(409).json({
                    success: false,
                    message: "Duplicate media item detected. This file has already been uploaded to your profile."
                });
            }
        }

        // Default visibility is industry_only
        const finalVisibility = ["public", "industry_only", "private"].includes(visibility)
            ? visibility
            : "industry_only";

        // If setting as main profile photo, reset other photos of the user
        if (isMainProfilePhoto === true || isMainProfilePhoto === "true") {
            await MediaItem.updateMany(
                { owner: userId, isMainProfilePhoto: true },
                { $set: { isMainProfilePhoto: false } }
            );

            // Update TalentProfile profilePhoto
            const profile = await TalentProfile.findOne({ userId });
            if (profile) {
                profile.profilePhoto = url;
                await profile.save();
            }
        }

        const mediaItem = await MediaItem.create({
            owner: userId,
            mediaType,
            category: category || "other",
            title,
            description,
            url,
            thumbnailUrl,
            mimeType,
            fileSizeBytes,
            durationSeconds,
            contentHash,
            rightsConfirmed: true,
            displayOrder: displayOrder ? parseInt(displayOrder, 10) : 0,
            visibility: finalVisibility,
            isMainProfilePhoto: isMainProfilePhoto === true || isMainProfilePhoto === "true",
            moderationState: "live"
        });

        // Update profile completion if talent profile exists
        const profile = await TalentProfile.findOne({ userId });
        if (profile) {
            // Ensure portfolio array has this item reference
            if (mediaType === "photo") {
                profile.portfolio.photos = profile.portfolio.photos || [];
                if (!profile.portfolio.photos.includes(url)) profile.portfolio.photos.push(url);
            } else if (mediaType === "video") {
                profile.portfolio.videos = profile.portfolio.videos || [];
                if (!profile.portfolio.videos.includes(url)) profile.portfolio.videos.push(url);
            }
            profile.profileCompletionPercentage = calculateProfileCompletion(profile);
            await profile.save();
        }

        res.status(201).json({
            success: true,
            message: "Media item added successfully",
            mediaItem
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Duplicate media item detected. This file has already been uploaded."
            });
        }
        console.error("Add media item error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while adding media item"
        });
    }
};

const getMyMedia = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { mediaType, category } = req.query;

        const filter = { owner: userId };
        if (mediaType) filter.mediaType = mediaType;
        if (category) filter.category = category;

        const mediaItems = await MediaItem.find(filter).sort({ displayOrder: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: mediaItems.length,
            mediaItems
        });

    } catch (error) {
        console.error("Get my media error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching your media"
        });
    }
};

const getUserMedia = async (req, res) => {
    try {
        const { userId } = req.params;
        const viewerRole = req.user ? req.user.role : "talent";

        // Privacy rules:
        // - Admin sees all (except removed)
        // - Organization sees public + industry_only (live)
        // - Talent / Public sees only public (live)
        const filter = {
            owner: userId,
            moderationState: "live"
        };

        if (viewerRole === "admin") {
            delete filter.moderationState;
        } else if (viewerRole === "organization") {
            filter.visibility = { $in: ["public", "industry_only"] };
        } else {
            filter.visibility = "public";
        }

        const mediaItems = await MediaItem.find(filter).sort({ displayOrder: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: mediaItems.length,
            mediaItems
        });

    } catch (error) {
        console.error("Get user media error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching user media"
        });
    }
};

const updateMediaItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { mediaId } = req.params;
        const { title, description, visibility, displayOrder, isMainProfilePhoto } = req.body;

        const mediaItem = await MediaItem.findById(mediaId);

        if (!mediaItem) {
            return res.status(404).json({
                success: false,
                message: "Media item not found"
            });
        }

        if (mediaItem.owner.toString() !== userId && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You can only edit your own media items"
            });
        }

        if (title !== undefined) mediaItem.title = title;
        if (description !== undefined) mediaItem.description = description;
        if (visibility !== undefined) mediaItem.visibility = visibility;
        if (displayOrder !== undefined) mediaItem.displayOrder = displayOrder;

        if (isMainProfilePhoto === true || isMainProfilePhoto === "true") {
            await MediaItem.updateMany(
                { owner: userId, isMainProfilePhoto: true },
                { $set: { isMainProfilePhoto: false } }
            );
            mediaItem.isMainProfilePhoto = true;

            const profile = await TalentProfile.findOne({ userId });
            if (profile) {
                profile.profilePhoto = mediaItem.url;
                await profile.save();
            }
        }

        await mediaItem.save();

        res.status(200).json({
            success: true,
            message: "Media item updated successfully",
            mediaItem
        });

    } catch (error) {
        console.error("Update media item error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while updating media item"
        });
    }
};

const deleteMediaItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { mediaId } = req.params;

        const mediaItem = await MediaItem.findById(mediaId);

        if (!mediaItem) {
            return res.status(404).json({
                success: false,
                message: "Media item not found"
            });
        }

        if (mediaItem.owner.toString() !== userId && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own media items"
            });
        }

        await MediaItem.findByIdAndDelete(mediaId);

        // If it was the main profile photo, clear it from TalentProfile
        if (mediaItem.isMainProfilePhoto) {
            const profile = await TalentProfile.findOne({ userId });
            if (profile && profile.profilePhoto === mediaItem.url) {
                profile.profilePhoto = undefined;
                await profile.save();
            }
        }

        res.status(200).json({
            success: true,
            message: "Media item deleted successfully"
        });

    } catch (error) {
        console.error("Delete media item error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while deleting media item"
        });
    }
};

/**
 * Reorder user's media items (drag-and-drop ordering)
 * PATCH /api/media/order
 */
const reorderMedia = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { items, order } = req.body;

        if (Array.isArray(items)) {
            const bulkOps = items.map((item, idx) => ({
                updateOne: {
                    filter: { _id: item.id || item._id, owner: userId },
                    update: { $set: { displayOrder: item.displayOrder !== undefined ? item.displayOrder : idx } }
                }
            }));
            if (bulkOps.length > 0) {
                await MediaItem.bulkWrite(bulkOps);
            }
        } else if (Array.isArray(order)) {
            const bulkOps = order.map((id, idx) => ({
                updateOne: {
                    filter: { _id: id, owner: userId },
                    update: { $set: { displayOrder: idx } }
                }
            }));
            if (bulkOps.length > 0) {
                await MediaItem.bulkWrite(bulkOps);
            }
        } else {
            return res.status(400).json({
                success: false,
                message: "Please provide 'items' (array of {id, displayOrder}) or 'order' (array of media IDs)"
            });
        }

        const updatedMedia = await MediaItem.find({ owner: userId }).sort({ displayOrder: 1 });

        res.status(200).json({
            success: true,
            message: "Media order updated successfully",
            mediaItems: updatedMedia
        });
    } catch (error) {
        console.error("Reorder media error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while reordering media"
        });
    }
};

/**
 * Copyright Dispute hook: temporarily hides item (restricted) and logs dispute
 * POST /api/media/:mediaId/dispute
 */
const disputeMedia = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { mediaId } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim().length < 5) {
            return res.status(400).json({
                success: false,
                message: "Dispute reason is required (minimum 5 characters)"
            });
        }

        const mediaItem = await MediaItem.findById(mediaId);
        if (!mediaItem) {
            return res.status(404).json({
                success: false,
                message: "Media item not found"
            });
        }

        mediaItem.moderationState = "restricted";
        mediaItem.disputeState = "disputed";
        mediaItem.disputeReason = reason.trim();
        mediaItem.disputedBy = userId;
        mediaItem.moderatedAt = new Date();
        await mediaItem.save();

        res.status(200).json({
            success: true,
            message: "Dispute registered. The media item has been temporarily restricted pending review.",
            mediaItem
        });
    } catch (error) {
        console.error("Dispute media error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while filing media dispute"
        });
    }
};

/**
 * Nominate media item for featured work
 * POST /api/media/:mediaId/nominate-featured
 */
const nominateFeatured = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { mediaId } = req.params;

        const mediaItem = await MediaItem.findOne({ _id: mediaId, owner: userId });
        if (!mediaItem) {
            return res.status(404).json({
                success: false,
                message: "Media item not found or does not belong to you"
            });
        }

        mediaItem.isNominatedFeatured = true;
        await mediaItem.save();

        res.status(200).json({
            success: true,
            message: "Media item successfully nominated for featured showcase",
            mediaItem
        });
    } catch (error) {
        console.error("Nominate featured error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while nominating media item"
        });
    }
};

/**
 * Admin selects / deselects featured work (max 4 per user)
 * PATCH /api/media/:mediaId/feature or PATCH /api/admin/media/:mediaId/featured
 */
const featureMediaItem = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const { isFeatured } = req.body;

        const mediaItem = await MediaItem.findById(mediaId);
        if (!mediaItem) {
            return res.status(404).json({
                success: false,
                message: "Media item not found"
            });
        }

        const shouldFeature = isFeatured !== false;

        if (shouldFeature) {
            const currentFeaturedCount = await MediaItem.countDocuments({
                owner: mediaItem.owner,
                isFeatured: true,
                _id: { $ne: mediaItem._id }
            });

            if (currentFeaturedCount >= mediaLimits.MAX_FEATURED_PER_USER) {
                return res.status(400).json({
                    success: false,
                    message: `User already has the maximum of ${mediaLimits.MAX_FEATURED_PER_USER} featured items.`
                });
            }
        }

        mediaItem.isFeatured = shouldFeature;
        await mediaItem.save();

        res.status(200).json({
            success: true,
            message: `Media item ${shouldFeature ? "featured" : "unfeatured"} successfully`,
            mediaItem
        });
    } catch (error) {
        console.error("Feature media item error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while updating featured status"
        });
    }
};

module.exports = {
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
};

