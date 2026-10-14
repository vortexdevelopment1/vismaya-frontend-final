const TalentProfile = require("../models/talentProfile.model");
const Organization = require("../models/organization.model");
const Opportunity = require("../models/opportunity.model");
const Project = require("../models/project.model");
const SuccessStory = require("../models/successStory.model");
const ContactInquiry = require("../models/contactInquiry.model");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");

/**
 * GET /api/public/stats
 * Aggregates public platform metrics for landing & about pages
 */
const getPublicStats = async (req, res, next) => {
    try {
        const [
            talentCount,
            opportunityCount,
            orgCount,
            projectCount,
            successStoryCount
        ] = await Promise.all([
            TalentProfile.countDocuments({ status: "active" }),
            Opportunity.countDocuments({ status: "Published" }),
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
const submitContactInquiry = async (req, res, next) => {
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
            ipAddress: req.ip || req.connection?.remoteAddress,
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
                await Notification.insertMany(notifications);
            }
        } catch (notifyErr) {
            console.error("Failed to create admin notification for contact inquiry:", notifyErr.message);
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

module.exports = {
    getPublicStats,
    submitContactInquiry
};
