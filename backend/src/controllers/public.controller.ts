import { Request, Response, NextFunction } from "express";
import TalentProfile from "../models/talentProfile.model.js";
import Organization from "../models/organization.model.js";
import Opportunity from "../models/opportunity.model.js";
import Project from "../models/project.model.js";
import SuccessStory from "../models/successStory.model.js";
import ContactInquiry from "../models/contactInquiry.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import AdminAuditLog from "../models/adminAuditLog.model.js";
import { sendEmail } from "../services/email.service.js";

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
            TalentProfile.countDocuments({ status: "active", isInformational: { $ne: true } }),
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

        const targetAdminEmail = "vortexcubesdevelopment@gmail.com";

        // 1. Send email to Admin inbox (vortexcubesdevelopment@gmail.com)
        try {
            await sendEmail({
                to: targetAdminEmail,
                subject: `[Vismaya Contact Inquiry] ${name.trim()} - ${subject ? subject.trim() : "General Inquiry"}`,
                text: `New Contact Inquiry Received\n\nName: ${name.trim()}\nEmail: ${email.trim()}\nMobile: ${mobile ? mobile.trim() : "Not provided"}\nSubject: ${subject ? subject.trim() : "General Inquiry"}\n\nMessage:\n${message.trim()}\n\nReceived At: ${new Date().toLocaleString("en-IN")}`,
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E8E2D4; border-radius: 12px; overflow: hidden;">
                    <div style="background-color: #8A6B2E; color: #FFFFFF; padding: 20px 24px;">
                        <h2 style="margin: 0; font-size: 20px; font-family: Georgia, serif;">Vismaya Creative Studios</h2>
                        <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">New Public Contact Inquiry Received</p>
                    </div>
                    <div style="padding: 24px; background-color: #FFFFFF; color: #2B2D2A;">
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
                            <tr>
                                <td style="padding: 8px 0; color: #77756B; width: 130px;"><strong>Sender Name:</strong></td>
                                <td style="padding: 8px 0; font-weight: 600;">${name.trim()}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #77756B;"><strong>Sender Email:</strong></td>
                                <td style="padding: 8px 0;"><a href="mailto:${email.trim()}" style="color: #8A6B2E; font-weight: 600;">${email.trim()}</a></td>
                            </tr>
                            ${mobile ? `<tr><td style="padding: 8px 0; color: #77756B;"><strong>Mobile Number:</strong></td><td style="padding: 8px 0;">${mobile.trim()}</td></tr>` : ""}
                            <tr>
                                <td style="padding: 8px 0; color: #77756B;"><strong>Subject:</strong></td>
                                <td style="padding: 8px 0;">${subject ? subject.trim() : "General Inquiry"}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #77756B;"><strong>Received At:</strong></td>
                                <td style="padding: 8px 0;">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
                            </tr>
                        </table>
                        <div style="background-color: #FAF9F7; border: 1px solid #E8E2D4; border-radius: 8px; padding: 16px; margin-top: 10px;">
                            <div style="font-size: 12px; font-weight: 700; color: #8A6B2E; text-transform: uppercase; margin-bottom: 6px;">Message:</div>
                            <div style="font-size: 14px; line-height: 1.6; color: #2B2D2A; white-space: pre-wrap;">${message.trim()}</div>
                        </div>
                    </div>
                    <div style="background-color: #F5F3EC; padding: 14px 24px; text-align: center; font-size: 12px; color: #77756B; border-top: 1px solid #E8E2D4;">
                        Automated notification from Vismaya Helpdesk Desk &bull; Reply directly to <a href="mailto:${email.trim()}">${email.trim()}</a>
                    </div>
                </div>`
            });
        } catch (emailErr: any) {
            console.warn("[SubmitContactInquiry] Admin email alert notice:", emailErr?.message);
        }

        // 2. Deliver in-app notification to Admin Dashboard & insert into Admin Operations Activity
        try {
            const adminUsers = await User.find({ role: "admin" }).limit(10);
            if (adminUsers.length > 0) {
                const notifications = adminUsers.map((admin) => ({
                    recipient: admin._id,
                    type: "system",
                    title: `New Contact Inquiry: ${name.trim()}`,
                    message: `${name.trim()} (${email.trim()}): "${message.trim().substring(0, 100)}${message.trim().length > 100 ? "..." : ""}"`,
                    referenceType: "System"
                }));
                await Notification.insertMany(notifications as any);

                await AdminAuditLog.create({
                    adminId: adminUsers[0]._id,
                    action: "CONTACT_INQUIRY_RECEIVED",
                    targetType: "System",
                    targetId: inquiry._id,
                    details: `Inquiry from ${name.trim()} (${email.trim()}): "${message.trim().substring(0, 80)}${message.trim().length > 80 ? "..." : ""}"`,
                    ipAddress: req.ip || req.socket?.remoteAddress,
                    userAgent: req.headers["user-agent"]
                });
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
