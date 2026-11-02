import { Request, Response } from "express";
import UserConsent from "../models/userConsent.model.js";

export const recordConsent = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required to record consent" });
        }

        const { policyType, policyVersion = "v2.0", context, metadata } = req.body;

        const validTypes = [
            "terms_and_conditions",
            "privacy_policy",
            "registration_consent",
            "per_application_consent",
            "guardian_consent",
            "social_sharing_consent"
        ];

        if (!policyType || !validTypes.includes(policyType)) {
            return res.status(400).json({
                success: false,
                message: `Invalid policy type. Must be one of: ${validTypes.join(", ")}`
            });
        }

        const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
        const userAgent = req.headers["user-agent"] || "";

        const consent = await UserConsent.create({
            userId,
            policyType,
            policyVersion,
            isAccepted: true,
            acceptedAt: new Date(),
            ipAddress: Array.isArray(clientIp) ? clientIp[0] : String(clientIp),
            userAgent,
            context: context || "direct_acceptance",
            metadata: metadata || {}
        });

        res.status(201).json({
            success: true,
            message: "Consent recorded successfully",
            consent: {
                id: consent._id,
                policyType: consent.policyType,
                policyVersion: consent.policyVersion,
                acceptedAt: consent.acceptedAt
            }
        });
    } catch (error: any) {
        console.error("Record consent error:", error);
        res.status(500).json({ success: false, message: "Failed to record user consent" });
    }
};

export const getConsentStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        const consents = await UserConsent.find({ userId }).sort({ acceptedAt: -1 }).lean();

        // Map latest consent for each policyType
        const consentMap: Record<string, any> = {};
        for (const c of consents) {
            if (!consentMap[c.policyType]) {
                consentMap[c.policyType] = {
                    policyType: c.policyType,
                    policyVersion: c.policyVersion,
                    isAccepted: c.isAccepted,
                    acceptedAt: c.acceptedAt
                };
            }
        }

        res.status(200).json({
            success: true,
            consents: consentMap
        });
    } catch (error: any) {
        console.error("Get consent status error:", error);
        res.status(500).json({ success: false, message: "Failed to retrieve consent status" });
    }
};

export const getPolicyInfo = async (req: Request, res: Response): Promise<any> => {
    try {
        const { type } = req.params;
        const normalizedType = String(type).toLowerCase().replace(/-/g, "_");

        const policyMetadata: Record<string, any> = {
            privacy_policy: {
                name: "Vismaya Privacy Policy",
                version: "2.0",
                publishedDate: "2026-10-01",
                effectiveDate: "2026-10-15",
                status: "PUBLISHED_PENDING_LEGAL_COUNSEL",
                jurisdiction: "Mumbai, Maharashtra, India",
                governingLaw: "Information Technology Act, 2000 & Digital Personal Data Protection Act, 2023",
                contactEmail: "privacy@vismaya.com",
                supportEmail: "support@vismaya.com"
            },
            terms_and_conditions: {
                name: "Vismaya Terms of Service & Community Guidelines",
                version: "2.0",
                publishedDate: "2026-10-01",
                effectiveDate: "2026-10-15",
                status: "PUBLISHED_PENDING_LEGAL_COUNSEL",
                commercialRules: {
                    talentFeeINR: 999,
                    industryFeeINR: 4999,
                    includedOrgCredits: 100,
                    additionalSingleViewINR: 100,
                    additionalBundle25ViewsINR: 2000,
                    repeatViewWindowDays: 7,
                    refundPolicy: "Strictly Non-Refundable"
                },
                jurisdiction: "Mumbai, Maharashtra, India",
                contactEmail: "legal@vismaya.com",
                supportEmail: "support@vismaya.com"
            }
        };

        const info = policyMetadata[normalizedType] || {
            name: "Vismaya Platform Agreement",
            version: "2.0",
            status: "PENDING_LEGAL_COUNSEL"
        };

        res.status(200).json({ success: true, policy: info });
    } catch (error: any) {
        console.error("Get policy info error:", error);
        res.status(500).json({ success: false, message: "Failed to get policy info" });
    }
};
