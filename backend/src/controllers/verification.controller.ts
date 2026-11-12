import { Request, Response } from "express";
import Verification from "../models/verification.model.js";
import Organization from "../models/organization.model.js";
import { TalentProfile } from "../models/talentProfile.model.js";
import UserConsent from "../models/userConsent.model.js";
import { getActiveKycProvider } from "../services/kycProvider.service.js";
import { kycSessionStore } from "../services/kycSession.service.js";

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

/**
 * Initiate Aadhaar OTP Verification
 * Rate-limited (max 3/hr, 60s cooldown), session-bound, requires explicit consent.
 */
export const initiateAadhaarVerification = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        const { aadhaarNumber } = req.body;
        const consentAccepted = req.body.consentAccepted || req.body.consentGiven;

        // 1. Mandatory statutory consent check
        if (!consentAccepted) {
            return res.status(400).json({
                success: false,
                message: "Explicit statutory consent is mandatory before initiating Aadhaar verification."
            });
        }

        // 2. Validate clean 12-digit format
        const cleanAadhaar = String(aadhaarNumber || "").replace(/\D/g, "");
        if (cleanAadhaar.length !== 12) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid 12-digit Aadhaar number."
            });
        }

        // 3. Rate limiting and cooldown check
        const rateCheck = kycSessionStore.checkRateLimit(String(userId));
        if (!rateCheck.allowed) {
            return res.status(429).json({
                success: false,
                message: rateCheck.message,
                waitSeconds: rateCheck.waitSeconds
            });
        }

        // 4. Call provider layer
        const provider = getActiveKycProvider();
        const result = await provider.initiateAadhaarOtp(cleanAadhaar);

        if (!result.success || !result.refId) {
            return res.status(400).json({
                success: false,
                message: result.message || "Failed to trigger OTP. Please check the Aadhaar number."
            });
        }

        // 5. Bind session & record rate usage
        kycSessionStore.recordTrigger(String(userId));
        kycSessionStore.createSession(result.refId, String(userId));

        // 6. Record statutory consent in UserConsent collection
        try {
            await UserConsent.create({
                userId,
                policyType: "aadhaar_kyc_consent",
                policyVersion: "v2.0_oct2026",
                isAccepted: true,
                acceptedAt: new Date(),
                ipAddress: req.ip,
                userAgent: req.get("user-agent"),
                context: "onboarding_or_profile_kyc",
                metadata: {
                    provider: provider.providerName,
                    refId: result.refId
                }
            });
        } catch (consentErr) {
            console.warn("Could not persist consent audit log:", consentErr);
        }

        return res.status(200).json({
            success: true,
            refId: result.refId,
            message: result.message
        });

    } catch (error: any) {
        console.error("Initiate Aadhaar verification error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Failed to initiate Aadhaar verification."
        });
    }
};

/**
 * Verify Aadhaar OTP and Award Verified Status
 * Binds session ownership, prevents replay, updates TalentProfile.
 */
export const verifyAadhaarOtp = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        const { refId, otp } = req.body;

        if (!refId || !otp) {
            return res.status(400).json({
                success: false,
                message: "Reference ID and OTP are required."
            });
        }

        // 1. Session verification & ownership check
        const session = kycSessionStore.getSession(String(refId));
        if (!session) {
            return res.status(400).json({
                success: false,
                message: "Verification session has expired. Please request a new OTP."
            });
        }

        // Cross-user verification hijack guard
        if (session.userId !== String(userId)) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized verification attempt. Session does not belong to active user."
            });
        }

        // Anti-replay guard
        if (session.completed) {
            return res.status(400).json({
                success: false,
                message: "This OTP verification has already been completed."
            });
        }

        // Attempt limiter
        const attempts = kycSessionStore.recordAttempt(String(refId));
        if (attempts > 3) {
            return res.status(429).json({
                success: false,
                message: "Maximum verification attempts exceeded for this OTP. Please request a new OTP."
            });
        }

        // 2. Call provider layer
        const provider = getActiveKycProvider();
        const verifyResult = await provider.verifyAadhaarOtp(String(refId), String(otp));

        if (!verifyResult.success) {
            return res.status(400).json({
                success: false,
                message: verifyResult.message || "Invalid or expired OTP."
            });
        }

        // 3. Mark session complete
        kycSessionStore.completeSession(String(refId));

        // 4. Update Verification collection with minimized metadata (no 12-digit Aadhaar, no raw DOB)
        let verification = await Verification.findOne({ userId, verificationType: "identity" })
            .sort({ createdAt: -1, submittedAt: -1 });

        if (!verification) {
            verification = new Verification({
                userId,
                verificationType: "identity",
                status: "verified",
                submittedAt: new Date(),
                reviewedAt: new Date(),
                aadhaarData: {
                    refId: verifyResult.refId,
                    nameOnId: verifyResult.nameOnId,
                    isAgeEligible: verifyResult.isAgeEligible,
                    maskedAadhaarPreview: verifyResult.maskedAadhaarPreview,
                    verifiedAt: new Date(),
                    verificationMethod: provider.providerName
                }
            });
        } else {
            verification.status = "verified";
            verification.reviewedAt = new Date();
            verification.aadhaarData = {
                refId: verifyResult.refId,
                nameOnId: verifyResult.nameOnId,
                isAgeEligible: verifyResult.isAgeEligible,
                maskedAadhaarPreview: verifyResult.maskedAadhaarPreview,
                verifiedAt: new Date(),
                verificationMethod: provider.providerName
            };
        }
        await verification.save();

        // 5. Update TalentProfile to verified status with Blue Tick
        await TalentProfile.findOneAndUpdate(
            { userId },
            {
                isVerified: true,
                badgeType: "verified",
                verifiedAt: new Date()
            }
        );

        return res.status(200).json({
            success: true,
            message: verifyResult.message,
            isVerified: true,
            maskedAadhaar: verifyResult.maskedAadhaarPreview
        });

    } catch (error: any) {
        console.error("Verify Aadhaar OTP error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Failed to complete Aadhaar verification."
        });
    }
};

/**
 * Consent Withdrawal & Data Deletion
 * Decoupled from account deletion; revokes verified badge and stamps consent_withdrawn.
 */
export const withdrawKycConsent = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        const verification = await Verification.findOne({ userId, verificationType: "identity" })
            .sort({ createdAt: -1 });

        if (verification) {
            verification.status = "consent_withdrawn";
            await verification.save();
        }

        // Revoke badge from talent profile
        await TalentProfile.findOneAndUpdate(
            { userId },
            {
                isVerified: false,
                badgeType: "none"
            }
        );

        const trackingId = `ack_wd_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

        return res.status(200).json({
            success: true,
            trackingId,
            message: "Identity verification consent withdrawn. Verified badge has been removed."
        });

    } catch (error: any) {
        console.error("Withdraw KYC consent error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Failed to withdraw verification consent."
        });
    }
};
