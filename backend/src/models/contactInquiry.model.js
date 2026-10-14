const mongoose = require("mongoose");

const contactInquirySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            maxlength: 120
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"]
        },
        subject: {
            type: String,
            trim: true,
            default: "General Inquiry",
            maxlength: 200
        },
        message: {
            type: String,
            required: [true, "Message is required"],
            trim: true,
            maxlength: 3000
        },
        mobile: {
            type: String,
            trim: true,
            maxlength: 25
        },
        category: {
            type: String,
            trim: true,
            default: "general"
        },
        status: {
            type: String,
            enum: ["pending", "reviewed", "resolved"],
            default: "pending"
        },
        ipAddress: {
            type: String
        },
        userAgent: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

contactInquirySchema.index({ status: 1, createdAt: -1 });

const ContactInquiry = mongoose.model("ContactInquiry", contactInquirySchema);

module.exports = ContactInquiry;
