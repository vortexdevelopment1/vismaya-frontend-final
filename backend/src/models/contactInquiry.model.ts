import mongoose, { Schema, Document, Model } from "mongoose";

export interface IContactInquiry extends Document {
    name: string;
    email: string;
    subject?: string;
    message: string;
    mobile?: string;
    category?: string;
    status: "pending" | "reviewed" | "resolved";
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
    updatedAt: Date;
}

const contactInquirySchema = new Schema<IContactInquiry>(
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

export const ContactInquiry: Model<IContactInquiry> = mongoose.model<IContactInquiry>("ContactInquiry", contactInquirySchema);
export default ContactInquiry;
