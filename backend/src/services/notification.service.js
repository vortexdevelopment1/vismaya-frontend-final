const Notification = require("../models/notification.model");
const User = require("../models/user.model");
const { sendEmail } = require("./email.service");
const { sendSms } = require("./sms.service");

/**
 * Creates an in-app notification and optionally dispatches email / SMS / WhatsApp alerts.
 *
 * @param {Object}  params
 * @param {string}  params.recipientId      - User ObjectId
 * @param {string}  params.type             - Notification type
 * @param {string}  params.title            - Short title
 * @param {string}  params.message          - Full message body
 * @param {*}       params.referenceId      - Optional linked document ID
 * @param {string}  params.referenceType    - Optional linked model name
 * @param {boolean} params.sendEmailAlert   - Send email to user
 * @param {string}  params.emailSubject     - Custom email subject (defaults to title)
 * @param {boolean} params.sendSmsAlert     - Send SMS via Fast2SMS
 * @param {boolean} params.sendWhatsappAlert- Send WhatsApp via Fast2SMS (same API channel)
 */
const notifyUser = async ({
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
}) => {
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
            ? await User.findById(recipientId).select("email name mobile")
            : null;

        // Email alert
        if (sendEmailAlert && recipient?.email) {
            await sendEmail({
                to: recipient.email,
                subject: emailSubject || title,
                text: `Hello ${recipient.name},\n\n${message}\n\nBest regards,\nVismaya Creative Studios Team`
            }).catch(err => console.error("[NotificationService] Email failed:", err.message));
        }

        // SMS alert (Fast2SMS)
        if (sendSmsAlert && recipient?.mobile) {
            await sendSms({
                to: recipient.mobile,
                message: `Vismaya: ${title} — ${message}`.slice(0, 160)
            }).catch(err => console.error("[NotificationService] SMS failed:", err.message));
        }

        // WhatsApp alert — Fast2SMS routes to WhatsApp when recipient has WA on that number
        if (sendWhatsappAlert && recipient?.mobile) {
            await sendSms({
                to: recipient.mobile,
                message: `[Vismaya WhatsApp] ${title}: ${message}`.slice(0, 160)
            }).catch(err => console.error("[NotificationService] WhatsApp SMS failed:", err.message));
        }

        return notification;

    } catch (error) {
        console.error("[NotificationService] Error creating notification:", error);
        return null;
    }
};

module.exports = {
    notifyUser
};

