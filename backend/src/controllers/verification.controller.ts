import { Request, Response } from "express";
import Verification from "../models/verification.model.js";
import Organization from "../models/organization.model.js";

export const submitIdentityVerification = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { idType, idNumber, documentFrontUrl, documentBackUrl, selfiePhotoUrl } = req.body;

        const latestVerification = await Verification.findOne({ userId, verificationType: "identity" })
            .sort({ createdAt: -1, submittedAt: -1 });

        if (latestVerification && latestVerification.status === "rejected") {
            return res.status(403).json({
                success: false,
                message: "Your verification was rejected. Please contact Vismaya support."
            });
        }

        if (!idType || !idNumber || !documentFrontUrl || !selfiePhotoUrl) {
            return res.status(400).json({
                success: false,
                message: "ID type, ID number, front document URL and selfie photo are required"
            });
        }

        let verification = latestVerification;

        if (!verification) {
            verification = new Verification({
                userId,
                verificationType: "identity",
                identityData: {
                    idType,
                    idNumber,
                    documentFrontUrl,
                    documentBackUrl,
                    selfiePhotoUrl
                },
                status: "pending",
                submittedAt: new Date()
            });
        } else {
            verification.identityData = {
                idType,
                idNumber,
                documentFrontUrl,
                documentBackUrl,
                selfiePhotoUrl
            };
            verification.status = "pending";
            verification.moreInfoRequested = false;
            verification.submittedAt = new Date();
        }

        await verification.save();

        res.status(200).json({
            success: true,
            message: "Identity verification submitted for review",
            verification
        });

    } catch (error) {
        console.error("Submit identity verification error:", error);

        res.status(500).json({
            success: false,
            message: "Something went wrong while submitting identity verification"
        });
    }
};

export const submitProfessionalVerification = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const { creditsLinks, guildOrUnionName, guildMembershipNumber, supportingDocumentUrls } = req.body;

        const latestVerification = await Verification.findOne({ userId, verificationType: "professional" })
            .sort({ createdAt: -1, submittedAt: -1 });

        if (latestVerification && latestVerification.status === "rejected") {
            return res.status(403).json({
                success: false,
                message: "Your verification was rejected. Please contact Vismaya support."
            });
        }

        let verification = latestVerification;

        if (!verification) {
            verification = new Verification({
                userId,
                verificationType: "professional",
                professionalData: {
                    creditsLinks: creditsLinks || [],
                    guildOrUnionName,
                    guildMembershipNumber,
                    supportingDocumentUrls: supportingDocumentUrls || []
                },
                status: "pending",
                submittedAt: new Date()
            });
        } else {
            verification.professionalData = {
                creditsLinks: creditsLinks || [],
                guildOrUnionName,
                guildMembershipNumber,
                supportingDocumentUrls: supportingDocumentUrls || []
            };
            verification.status = "pending";
            verification.moreInfoRequested = false;
            verification.submittedAt = new Date();
        }

        await verification.save();

        res.status(200).json({
            success: true,
            message: "Professional verification submitted for review",
            verification
        });

    } catch (error) {
        console.error("Submit professional verification error:", error);

        res.status(500).json({
            success: false,
            message: "Something went wrong while submitting professional verification"
        });
    }
};

export const submitBusinessVerification = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        const {
            businessRegType,
            businessRegNumber,
            legalEntityName,
            documentUrl,
            businessRegistrationDocUrl,
            businessRegistrationDocName,
            gstin,
            isGstExempt,
            gstExemptionReason,
            gstCertificateUrl,
            gstCertificateDocName,
            professionalProofType,
            professionalProofUrl,
            professionalProofDocUrl,
            professionalProofDocName,
            otherEvidenceUrls,
            otherEvidenceDocNames,
            responsiblePersonName,
            responsiblePersonDesignation,
            website,
            location,
            businessDescription
        } = req.body;

        const effectiveDocUrl = documentUrl || businessRegistrationDocUrl;

        const latestVerification = await Verification.findOne({ userId, verificationType: "organization_business" })
            .sort({ createdAt: -1, submittedAt: -1 });

        if (latestVerification && latestVerification.status === "rejected") {
            return res.status(403).json({
                success: false,
                message: "Your verification was rejected. Please contact Vismaya support at support@vismaya.com."
            });
        }

        if (!businessRegType || !businessRegNumber || !legalEntityName || !effectiveDocUrl) {
            return res.status(400).json({
                success: false,
                message: "Business registration type, number, legal entity name and document are required"
            });
        }

        const businessData = {
            businessRegType,
            businessRegNumber,
            legalEntityName,
            documentUrl: effectiveDocUrl,
            businessRegistrationDocUrl: effectiveDocUrl,
            businessRegistrationDocName: businessRegistrationDocName || "Registration_Certificate.pdf",
            gstin,
            isGstExempt: Boolean(isGstExempt),
            gstExemptionReason,
            gstCertificateUrl,
            gstCertificateDocName: gstCertificateDocName || "GST_Certificate.pdf",
            professionalProofType,
            professionalProofUrl,
            professionalProofDocUrl,
            professionalProofDocName,
            otherEvidenceUrls: Array.isArray(otherEvidenceUrls) ? otherEvidenceUrls : [],
            otherEvidenceDocNames: Array.isArray(otherEvidenceDocNames) ? otherEvidenceDocNames : []
        };

        let verification = latestVerification;

        if (!verification) {
            verification = new Verification({
                userId,
                verificationType: "organization_business",
                businessData,
                status: "pending",
                submittedAt: new Date()
            });
        } else {
            verification.businessData = businessData;
            verification.status = "pending";
            verification.moreInfoRequested = false;
            verification.submittedAt = new Date();
        }

        await verification.save();

        // Sync with Organization model if exists
        try {
            await Organization.findOneAndUpdate(
                { $or: [{ userId }, { _id: userId }] },
                {
                    $set: {
                        legalBusinessName: legalEntityName,
                        businessRegNumber,
                        gstin: gstin || undefined,
                        verificationState: "pending",
                        website: website || undefined,
                        location: location || undefined,
                        description: businessDescription || undefined,
                        responsiblePersonName: responsiblePersonName || undefined,
                        responsiblePersonDesignation: responsiblePersonDesignation || undefined
                    }
                }
            );
        } catch (orgErr) {
            console.warn("Could not sync organization details on verification submit:", orgErr);
        }

        res.status(200).json({
            success: true,
            message: "Business verification submitted for review",
            verification
        });

    } catch (error) {
        console.error("Submit business verification error:", error);

        res.status(500).json({
            success: false,
            message: "Something went wrong while submitting business verification"
        });
    }
};

export const getVerificationDocument = async (req: Request, res: Response): Promise<any> => {
    try {
        const { verificationId } = req.params;
        const { docKey = "documentFrontUrl" } = req.query;
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        const verification = await Verification.findById(verificationId);
        if (!verification) {
            return res.status(404).json({ success: false, message: "Verification record not found" });
        }

        const isOwner = String(verification.userId) === String(userId);
        const isAdmin = userRole === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Access Denied. You do not have permission to view this sensitive verification document."
            });
        }

        // Extract safe document URL based on requested key
        let targetUrl: string | undefined;
        if (verification.identityData) {
            const idData: any = verification.identityData;
            targetUrl = idData[String(docKey)];
        }
        if (!targetUrl && verification.businessData) {
            const bizData: any = verification.businessData;
            targetUrl = bizData[String(docKey)] || bizData.documentUrl || bizData.businessRegistrationDocUrl;
        }
        if (!targetUrl && verification.professionalData) {
            const profData: any = verification.professionalData;
            targetUrl = profData.supportingDocumentUrls?.[0] || profData.creditsLinks?.[0];
        }

        if (!targetUrl) {
            return res.status(404).json({ success: false, message: "Requested document file not found on this record" });
        }

        res.status(200).json({
            success: true,
            documentUrl: targetUrl,
            verificationType: verification.verificationType
        });
    } catch (error) {
        console.error("Get verification document error:", error);
        res.status(500).json({ success: false, message: "Failed to access verification document" });
    }
};

export const getMyVerifications = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;

        const verifications = await Verification.find({ userId });

        res.status(200).json({
            success: true,
            count: verifications.length,
            verifications
        });

    } catch (error) {
        console.error("Get my verifications error:", error);

        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching verifications"
        });
    }
};
