import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import { sendEmail } from "./email.service.js";
import { sendSms } from "./sms.service.js";

/**
 * Creates an in-app notification and optionally dispatches email / SMS / WhatsApp alerts.
 */
export const notifyUser = async ({
    recipientId,
    type,
    title,
    message,
    referenceId,
    referenceType,
    sendEmailAlert = false,
    emailSubject,
    sendSmsAlert = false,
    sendWhatsappAlert = false
}: {
    recipientId?: any;
    type?: string;
    title: string;
    message: string;
    referenceId?: any;
    referenceType?: "Application" | "Opportunity" | "Audition" | "Project" | "User" | "Broadcast" | "System";
    sendEmailAlert?: boolean;
    emailSubject?: string;
    sendSmsAlert?: boolean;
    sendWhatsappAlert?: boolean;
}): Promise<any> => {
    try {
        if (!recipientId || !title || !message) {
            console.warn("[NotificationService] Missing required parameters");
            return null;
        }

        const notification = await Notification.create({
            recipient: recipientId,
            type: type || "system",
            title,
            message,
            referenceId,
            referenceType: referenceType || "System"
        });

        // Fetch user only if any external channel is needed
        const needsUser = sendEmailAlert || sendSmsAlert || sendWhatsappAlert;
        const recipient = needsUser
            ? await User.findById(recipientId).select("email name mobile emailNotificationsEnabled")
            : null;

        // Email alert
        if (sendEmailAlert && recipient?.email && recipient.emailNotificationsEnabled !== false) {
            await sendEmail({
                to: recipient.email,
                subject: emailSubject || title,
                text: `Hello ${recipient.name},\n\n${message}\n\nBest regards,\nVismaya Creative Studios Team`
            }).catch((err: any) => console.error("[NotificationService] Email failed:", err.message));
        }

        // SMS alert (Fast2SMS)
        if (sendSmsAlert && recipient?.mobile) {
            await sendSms({
                to: recipient.mobile,
                message: `Vismaya: ${title} — ${message}`.slice(0, 160)
            }).catch((err: any) => console.error("[NotificationService] SMS failed:", err.message));
        }

        // WhatsApp alert — Fast2SMS routes to WhatsApp when recipient has WA on that number
        if (sendWhatsappAlert && recipient?.mobile) {
            await sendSms({
                to: recipient.mobile,
                message: `[Vismaya WhatsApp] ${title}: ${message}`.slice(0, 160)
            }).catch((err: any) => console.error("[NotificationService] WhatsApp SMS failed:", err.message));
        }

        return notification;

    } catch (error) {
        console.error("[NotificationService] Error creating notification:", error);
        return null;
    }
};

export default {
    notifyUser
};
