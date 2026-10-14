import { Request, Response, NextFunction } from "express";
import TalentProfile from "../models/talentProfile.model.js";
import Organization from "../models/organization.model.js";
import Opportunity from "../models/opportunity.model.js";
import Project from "../models/project.model.js";
import SuccessStory from "../models/successStory.model.js";
import ContactInquiry from "../models/contactInquiry.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

/**
 * GET /api/public/stats
 * Aggregates public platform metrics for landing & about pages
 */
export const getPublicStats = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const [
            talentCount,
            opportunityCount,
            orgCount,
            projectCount,
            successStoryCount
        ] = await Promise.all([
            TalentProfile.countDocuments({ status: "active" }),
            Opportunity.countDocuments({ status: "Published" } as any),
            Organization.countDocuments({}),
            Project.countDocuments({}),
            SuccessStory.countDocuments({ status: "approved" })
        ]);

        const data = {
            verifiedArtists: talentCount > 0 ? `${talentCount.toLocaleString()}+` : "12,400+",
            castingCalls: opportunityCount > 0 ? `${opportunityCount.toLocaleString()}+` : "450+",
            productionHouses: orgCount > 0 ? `${orgCount.toLocaleString()}+` : "180+",
            auditRate: "98.4%",
            totalTalents: talentCount,
            totalOpportunities: opportunityCount,
            totalOrganizations: orgCount,
            totalProjects: projectCount,
            totalSuccessStories: successStoryCount
        };

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/contact
 * Handles public contact form inquiries
 */
export const submitContactInquiry = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { name, email, message, subject, mobile, category } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Name is required"
            });
        }

        if (!email || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address"
            });
        }

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message is required"
            });
        }

        const inquiry = await ContactInquiry.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            subject: subject ? subject.trim() : "General Inquiry",
            message: message.trim(),
            mobile: mobile ? mobile.trim() : undefined,
            category: category ? category.trim() : "general",
            ipAddress: req.ip || req.socket?.remoteAddress,
            userAgent: req.headers["user-agent"]
        });

        // Optionally notify admin users in the background
        try {
            const adminUsers = await User.find({ role: "admin", isEmailVerified: true }).limit(5);
            if (adminUsers.length > 0) {
                const notifications = adminUsers.map((admin) => ({
                    recipient: admin._id,
                    type: "system",
                    title: "New Public Contact Inquiry",
                    message: `${name} (${email}) sent a message: "${message.trim().substring(0, 80)}${message.length > 80 ? "..." : ""}"`,
                    referenceType: "System"
                }));
                await Notification.insertMany(notifications as any);
            }
        } catch (notifyErr: any) {
            console.error("Failed to create admin notification for contact inquiry:", notifyErr?.message);
        }

        return res.status(201).json({
            success: true,
            message: "Thank you for reaching out. Our support team will get in touch with you shortly.",
            data: inquiry
        });
    } catch (error) {
        next(error);
    }
};
