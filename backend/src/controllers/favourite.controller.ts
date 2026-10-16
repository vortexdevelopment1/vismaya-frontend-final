import { Request, Response } from "express";
import Favourite from "../models/favourite.model.js";
import Organization from "../models/organization.model.js";
import TalentProfile from "../models/talentProfile.model.js";
import { FAVOURITE_TAGS } from "../config/taxonomy.js";

/**
 * Add or update a talent bookmark in organization favourites
 * POST /api/organization/favourites
 */
export const addFavourite = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { talentId, vismayaId, tags } = req.body;

        const organization = await Organization.findOne({ userId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        // Validate tags against predefined Vismaya list (D5)
        if (tags && Array.isArray(tags)) {
            const invalidTags = tags.filter((t: string) => !(FAVOURITE_TAGS as readonly string[]).includes(t));
            if (invalidTags.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid tag(s): ${invalidTags.join(", ")}. Tags must be selected from the predefined list.`
                });
            }
        }

        // Find talent profile by talentId (User ID), vismayaId, or Profile _id
        let talentProfile;
        if (vismayaId) {
            talentProfile = await TalentProfile.findOne({ vismayaId });
        } else if (talentId) {
            talentProfile = await TalentProfile.findOne({
                $or: [{ userId: talentId }, { _id: talentId }]
            });
        }

        if (!talentProfile) {
            return res.status(404).json({
                success: false,
                message: "Talent profile not found"
            });
        }

        // Check if already favourited
        let favourite = await Favourite.findOne({
            organizationId: organization._id,
            talentId: talentProfile.userId
        });

        if (favourite) {
            if (tags !== undefined) favourite.tags = tags;
            await favourite.save();

            return res.status(200).json({
                success: true,
                message: "Favourite tags updated successfully",
                favourite
            });
        }

        favourite = await Favourite.create({
            organizationId: organization._id,
            talentId: talentProfile.userId,
            talentProfileId: talentProfile._id,
            tags: tags || []
        });

        res.status(201).json({
            success: true,
            message: "Talent added to favourites successfully",
            favourite
        });

    } catch (error) {
        console.error("Add favourite error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while adding talent to favourites"
        });
    }
};

/**
 * List all favourites for the logged-in organization
 * GET /api/organization/favourites
 */
export const getFavourites = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { tag, page = 1, limit = 20 } = req.query as { tag?: string; page?: string; limit?: string };

        const organization = await Organization.findOne({ userId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 20, 1), 50);
        const skip = (pageNum - 1) * limitNum;

        const filter: Record<string, unknown> = { organizationId: organization._id };
        if (tag) {
            filter.tags = tag;
        }

        const [favourites, total] = await Promise.all([
            Favourite.find(filter)
                .populate({
                    path: "talentProfileId",
                    select: "vismayaId stageName firstName lastName headline profilePhoto category primaryProfession primaryDepartment primaryDesignation careerStage skills currentState profileCompletionPercentage"
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Favourite.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            count: favourites.length,
            favourites
        });

    } catch (error) {
        console.error("Get favourites error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching favourites"
        });
    }
};

/**
 * Check if a talent is favourited by the organization
 * GET /api/organization/favourites/check/:talentId
 */
export const checkFavourite = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { talentId } = req.params;

        const organization = await Organization.findOne({ userId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        let targetUserId: any = talentId;
        if (typeof talentId === "string" && talentId.startsWith("VIS-")) {
            const profile = await TalentProfile.findOne({ vismayaId: talentId }).select("userId");
            if (profile) targetUserId = profile.userId;
        }

        const favourite = await Favourite.findOne({
            organizationId: organization._id,
            talentId: targetUserId
        });

        res.status(200).json({
            success: true,
            isFavourited: !!favourite,
            favourite: favourite || null
        });

    } catch (error) {
        console.error("Check favourite error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while checking favourite status"
        });
    }
};

/**
 * Update favourite tags
 * PATCH /api/organization/favourites/:talentId
 */
export const updateFavourite = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { talentId } = req.params;
        const { tags } = req.body;

        const organization = await Organization.findOne({ userId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        if (tags && Array.isArray(tags)) {
            const invalidTags = tags.filter((t: string) => !(FAVOURITE_TAGS as readonly string[]).includes(t));
            if (invalidTags.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid tag(s): ${invalidTags.join(", ")}. Tags must be selected from the predefined list.`
                });
            }
        }

        let targetUserId: any = talentId;
        if (typeof talentId === "string" && talentId.startsWith("VIS-")) {
            const profile = await TalentProfile.findOne({ vismayaId: talentId }).select("userId");
            if (profile) targetUserId = profile.userId;
        }

        const favourite = await Favourite.findOne({
            organizationId: organization._id,
            talentId: targetUserId
        });

        if (!favourite) {
            return res.status(404).json({
                success: false,
                message: "Talent is not in your favourites"
            });
        }

        if (tags !== undefined) favourite.tags = tags;
        await favourite.save();

        res.status(200).json({
            success: true,
            message: "Favourite updated successfully",
            favourite
        });

    } catch (error) {
        console.error("Update favourite error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while updating favourite"
        });
    }
};

/**
 * Remove a talent from favourites
 * DELETE /api/organization/favourites/:talentId
 */
export const removeFavourite = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { talentId } = req.params;

        const organization = await Organization.findOne({ userId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        let targetUserId: any = talentId;
        if (typeof talentId === "string" && talentId.startsWith("VIS-")) {
            const profile = await TalentProfile.findOne({ vismayaId: talentId }).select("userId");
            if (profile) targetUserId = profile.userId;
        }

        const result = await Favourite.findOneAndDelete({
            organizationId: organization._id,
            talentId: targetUserId
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Talent is not in your favourites"
            });
        }

        res.status(200).json({
            success: true,
            message: "Talent removed from favourites successfully"
        });

    } catch (error) {
        console.error("Remove favourite error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while removing talent from favourites"
        });
    }
};

export default {
    addFavourite,
    getFavourites,
    checkFavourite,
    updateFavourite,
    removeFavourite
};
