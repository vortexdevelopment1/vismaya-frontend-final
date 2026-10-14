const Verification = require("../models/verification.model");

const submitIdentityVerification = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { idType, idNumber, documentFrontUrl, documentBackUrl, selfiePhotoUrl } = req.body;

        if (!idType || !idNumber || !documentFrontUrl || !selfiePhotoUrl) {
            return res.status(400).json({
                success: false,
                message: "ID type, ID number, front document URL and selfie photo are required"
            });
        }

        let verification = await Verification.findOne({ userId, verificationType: "identity" });

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

const submitProfessionalVerification = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { creditsLinks, guildOrUnionName, guildMembershipNumber, supportingDocumentUrls } = req.body;

        let verification = await Verification.findOne({ userId, verificationType: "professional" });

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

const submitBusinessVerification = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { businessRegType, businessRegNumber, legalEntityName, documentUrl } = req.body;

        if (!businessRegType || !businessRegNumber || !legalEntityName || !documentUrl) {
            return res.status(400).json({
                success: false,
                message: "Business registration type, number, legal entity name and document URL are required"
            });
        }

        let verification = await Verification.findOne({ userId, verificationType: "organization_business" });

        if (!verification) {
            verification = new Verification({
                userId,
                verificationType: "organization_business",
                businessData: {
                    businessRegType,
                    businessRegNumber,
                    legalEntityName,
                    documentUrl
                },
                status: "pending",
                submittedAt: new Date()
            });
        } else {
            verification.businessData = {
                businessRegType,
                businessRegNumber,
                legalEntityName,
                documentUrl
            };
            verification.status = "pending";
            verification.moreInfoRequested = false;
            verification.submittedAt = new Date();
        }

        await verification.save();

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

const getMyVerifications = async (req, res) => {
    try {
        const userId = req.user.userId;

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

module.exports = {
    submitIdentityVerification,
    submitProfessionalVerification,
    submitBusinessVerification,
    getMyVerifications
};
