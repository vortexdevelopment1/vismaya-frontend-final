import { Request, Response } from "express";
import Organization from "../models/organization.model.js";
import User from "../models/user.model.js";
import Verification from "../models/verification.model.js";

const generateSlug = (name: string): string => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
};

/**
 * Create or Update Organization Profile
 * POST /api/organization/profile, PUT /api/organization/profile
 */
export const createOrUpdateOrganizationProfile = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const rawBody = req.body || {};

        const allowedFields = [
            "organizationName", "legalBusinessName", "organizationType", "description", "website",
            "contactNumber", "address", "responsiblePerson", "location", "offices",
            "experienceAndProjects", "portfolioCaseStudies", "teamSize", "services", "logoUrl"
        ];

        const updateData: Record<string, any> = {};
        for (const field of allowedFields) {
            if (rawBody[field] !== undefined) {
                updateData[field] = rawBody[field];
            }
        }

        if (updateData.organizationName) {
            updateData.slug = generateSlug(updateData.organizationName);
        }

        let organization = await Organization.findOne({ userId });

        if (!organization) {
            if (!updateData.organizationName) {
                return res.status(400).json({
                    success: false,
                    message: "Organization name is required"
                });
            }

            organization = await Organization.create({
                userId,
                ...updateData
            });

            return res.status(201).json({
                success: true,
                message: "Organization profile created successfully",
                organization
            });
        }

        Object.assign(organization, updateData);
        await organization.save();

        res.status(200).json({
            success: true,
            message: "Organization profile updated successfully",
            organization
        });

    } catch (error) {
        console.error("Create/update organization profile error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while saving organization profile"
        });
    }
};

export const createOrganizationProfile = createOrUpdateOrganizationProfile;

/**
 * Get organization profile for current logged-in organization
 * GET /api/organization/profile
 */
export const getOrganizationProfile = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;

        const organization = await Organization.findOne({ userId }).select("-verificationDocuments");

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        res.status(200).json({
            success: true,
            organization
        });

    } catch (error) {
        console.error("Get organization profile error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching organization profile"
        });
    }
};

/**
 * Get public company profile by slug (Logged-in any role)
 * GET /api/company/:slug
 */
export const getPublicCompanyProfile = async (req: Request, res: Response): Promise<any> => {
    try {
        const slug = String(req.params.slug);

        const organization = await Organization.findOne({
            $or: [{ slug }, { _id: slug.match(/^[0-9a-fA-F]{24}$/) ? slug : null }]
        }).lean();

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Company profile not found"
            });
        }

        // Return public fields only per O1 (never return legal docs, responsible person, or raw contact)
        const publicProfile = {
            organizationName: organization.organizationName,
            slug: organization.slug,
            organizationType: organization.organizationType,
            description: organization.description,
            website: organization.website,
            logoUrl: organization.logoUrl,
            city: organization.location?.city,
            state: organization.location?.state,
            country: organization.location?.country,
            services: organization.services || [],
            experienceAndProjects: organization.experienceAndProjects || [],
            portfolioCaseStudies: organization.portfolioCaseStudies || [],
            isBusinessVerified: !!organization.verificationStatus?.businessVerified,
            createdAt: (organization as any).createdAt
        };

        res.status(200).json({
            success: true,
            company: publicProfile,
            organization: publicProfile
        });

    } catch (error) {
        console.error("Get public company profile error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch company profile"
        });
    }
};

/**
 * Upload verification document for organization
 * POST /api/organization/verification-doc
 */
export const uploadVerificationDocument = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const rawBody = req.body || {};
        const docType = rawBody.docType || rawBody.documentType;
        const fileUrl = rawBody.fileUrl || rawBody.documentUrl || rawBody.url;
        const docCategory = rawBody.docCategory || rawBody.category || "business_registration";

        if (!docType || !fileUrl) {
            return res.status(400).json({
                success: false,
                message: "Document type and file URL are required"
            });
        }

        const organization = await Organization.findOne({ userId });
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization profile not found"
            });
        }

        const existingVerification = await Verification.findOne({ userId, verificationType: "organization_business" });
        if (organization.verificationState === "rejected" || organization.status === "rejected" || (existingVerification && existingVerification.status === "rejected")) {
            return res.status(403).json({
                success: false,
                message: "Your verification was rejected. Please contact Vismaya support."
            });
        }

        if (!Array.isArray(organization.verificationDocuments)) {
            organization.verificationDocuments = [];
        }

        organization.verificationDocuments.push({
            docType,
            docCategory,
            fileUrl,
            status: "pending",
            submittedAt: new Date()
        } as any);

        await organization.save();

        res.status(200).json({
            success: true,
            message: "Verification document uploaded successfully and is pending admin review",
            verificationDocuments: organization.verificationDocuments
        });

    } catch (error) {
        console.error("Upload verification doc error:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while uploading verification document"
        });
    }
};
