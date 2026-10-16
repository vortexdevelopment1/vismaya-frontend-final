import { Request, Response } from "express";
import crypto from "crypto";
import MediaItem from "../models/mediaItem.model.js";
import TalentProfile from "../models/talentProfile.model.js";
import { calculateProfileCompletion } from "../utils/profileCompletion.util.js";
import { isSafeUrl } from "../utils/sanitize.util.js";
import { uploadFileBuffer, generateSignedUploadParams } from "../services/cloudinary.service.js";
import mediaLimits from "../config/mediaLimits.js";

/**
 * Upload a single media file directly to Cloudinary
 * POST /api/media/upload
 */
export const uploadMediaFile = async (req: Request, res: Response): Promise<any> => {
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
    } catch (error: any) {
        console.error("Cloudinary upload error:", error);
        res.status(502).json({
            success: false,
            message: "Media storage upload failed. Please try again shortly."
        });
    }
};

/**
 * Upload multiple media files directly to Cloudinary
 * POST /api/media/upload-multiple
 */
export const uploadMultipleMediaFiles = async (req: Request, res: Response): Promise<any> => {
    try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No files uploaded. Please provide files in form-data under key 'files'"
            });
        }

        const folder = req.body.folder || "vismaya/media";
        const uploadPromises = files.map(file => uploadFileBuffer(file, folder));
        const results = await Promise.all(uploadPromises);

        res.status(200).json({
            success: true,
            message: `${results.length} files uploaded to Cloudinary successfully`,
            data: results
        });
    } catch (error: any) {
        console.error("Multiple upload error:", error);
        res.status(502).json({
            success: false,
            message: "Media storage upload failed. Please try again shortly."
        });
    }
};

/**
 * Generate signed upload parameters for direct browser-to-Cloudinary upload
 * GET /api/media/signature
 */
export const getUploadSignature = (req: Request, res: Response): any => {
    try {
        const folder = (req.query.folder as string) || "vismaya/media";
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
export const addMediaItem = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
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
        const maxSizes = mediaLimits.MAX_FILE_SIZES as Record<string, number>;
        if (fileSizeBytes && maxSizes[mediaType] && fileSizeBytes > maxSizes[mediaType]) {
            return res.status(400).json({
                success: false,
                message: `File size exceeds maximum allowed limit for ${mediaType}`
            });
        }

        const maxDurations = mediaLimits.MAX_DURATIONS as Record<string, number>;
        if (durationSeconds && maxDurations[mediaType] && durationSeconds > maxDurations[mediaType]) {
            return res.status(400).json({
                success: false,
                message: `Media duration exceeds maximum limit of ${maxDurations[mediaType]} seconds`
            });
        }

        // Count limits per type
        const maxCounts = mediaLimits.MAX_COUNTS_PER_TYPE as Record<string, number>;
        if (maxCounts[mediaType]) {
            const currentCount = await MediaItem.countDocuments({ owner: userId, mediaType });
            if (currentCount >= maxCounts[mediaType]) {
                return res.status(400).json({
                    success: false,
                    message: `Maximum count of ${maxCounts[mediaType]} items reached for media type '${mediaType}'`
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
            const p = profile as any;
            p.portfolio = p.portfolio || {};
            // Ensure portfolio array has this item reference
            if (mediaType === "photo") {
                p.portfolio.photos = p.portfolio.photos || [];
                if (!p.portfolio.photos.includes(url)) p.portfolio.photos.push(url);
            } else if (mediaType === "video") {
                p.portfolio.videos = p.portfolio.videos || [];
                if (!p.portfolio.videos.includes(url)) p.portfolio.videos.push(url);
            }
            profile.profileCompletionPercentage = calculateProfileCompletion(profile);
            await profile.save();
        }

        res.status(201).json({
            success: true,
            message: "Media item added successfully",
            mediaItem
        });

    } catch (error: any) {
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

export const getMyMedia = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { mediaType, category } = req.query;

        const filter: any = { owner: userId };
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

export const getUserMedia = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId } = req.params;
        const viewerRole = req.user ? req.user.role : "talent";

        // Privacy rules:
        // - Admin sees all (except removed)
        // - Organization sees public + industry_only (live)
        // - Talent / Public sees only public (live)
        const filter: any = {
            owner: String(userId),
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

export const updateMediaItem = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { mediaId } = req.params;
        const { title, description, visibility, displayOrder, isMainProfilePhoto } = req.body;

        const mediaItem = await MediaItem.findById(String(mediaId));

        if (!mediaItem) {
            return res.status(404).json({
                success: false,
                message: "Media item not found"
            });
        }

        if (mediaItem.owner.toString() !== userId && req.user?.role !== "admin") {
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

export const deleteMediaItem = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { mediaId } = req.params;

        const mediaItem = await MediaItem.findById(String(mediaId));

        if (!mediaItem) {
            return res.status(404).json({
                success: false,
                message: "Media item not found"
            });
        }

        if (mediaItem.owner.toString() !== userId && req.user?.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own media items"
            });
        }

        await MediaItem.findByIdAndDelete(String(mediaId));

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
export const reorderMedia = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { items, order } = req.body;

        if (Array.isArray(items)) {
            const bulkOps = items.map((item: any, idx: number) => ({
                updateOne: {
                    filter: { _id: item.id || item._id, owner: userId },
                    update: { $set: { displayOrder: item.displayOrder !== undefined ? item.displayOrder : idx } }
                }
            }));
            if (bulkOps.length > 0) {
                await MediaItem.bulkWrite(bulkOps as any);
            }
        } else if (Array.isArray(order)) {
            const bulkOps = order.map((id: any, idx: number) => ({
                updateOne: {
                    filter: { _id: id, owner: userId },
                    update: { $set: { displayOrder: idx } }
                }
            }));
            if (bulkOps.length > 0) {
                await MediaItem.bulkWrite(bulkOps as any);
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
export const disputeMedia = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { mediaId } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim().length < 5) {
            return res.status(400).json({
                success: false,
                message: "Dispute reason is required (minimum 5 characters)"
            });
        }

        const mediaItem = await MediaItem.findById(String(mediaId));
        if (!mediaItem) {
            return res.status(404).json({
                success: false,
                message: "Media item not found"
            });
        }

        mediaItem.moderationState = "restricted";
        mediaItem.disputeState = "disputed";
        mediaItem.disputeReason = reason.trim();
        mediaItem.disputedBy = userId as any;
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
export const nominateFeatured = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { mediaId } = req.params;

        const mediaItem = await MediaItem.findOne({ _id: String(mediaId), owner: userId });
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
export const featureMediaItem = async (req: Request, res: Response): Promise<any> => {
    try {
        const { mediaId } = req.params;
        const { isFeatured } = req.body;

        const mediaItem = await MediaItem.findById(String(mediaId));
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
