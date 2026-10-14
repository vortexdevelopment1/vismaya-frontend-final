const nodemailer = require("nodemailer");

/**
 * Email Service Abstraction for Vismaya Creative Studios platform
 * Decouples controllers from direct email vendor APIs
 *
 * Transporter is lazily initialised on first use so that env vars
 * are guaranteed to be loaded by dotenv before we read them.
 */
let transporter = null;

const getTransporter = () => {
    if (transporter) return transporter;

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const port = parseInt(process.env.SMTP_PORT || "587", 10);

    if (!host || !user) return null;

    transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
    });

    return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
    try {
        if (!to || !subject || (!text && !html)) {
            console.warn("[EmailService] Missing required parameters to send email");
            return { success: false, message: "Missing required email parameters" };
        }

        const emailPayload = {
            from: process.env.EMAIL_FROM || "no-reply@vismayastudios.com",
            to,
            subject,
            text,
            html: html || (text ? text.replace(/\n/g, "<br>") : "")
        };

        // In test mode, record email to memory outbox
        if (process.env.NODE_ENV === "test") {
            global.__TEST_OUTBOX__ = global.__TEST_OUTBOX__ || [];
            global.__TEST_OUTBOX__.push(emailPayload);
            try {
                const { recordEmail } = require("../../tests/helpers/outbox");
                recordEmail(emailPayload);
            } catch (e) {
                // Ignore if outbox helper not found
            }
            return {
                success: true,
                messageId: "test_msg_" + Date.now()
            };
        }

        const transport = getTransporter();
        if (transport) {
            const info = await transport.sendMail(emailPayload);
            return {
                success: true,
                messageId: info.messageId
            };
        } else {
            console.log(`\n================== [DEV EMAIL SERVICE] ==================`);
            console.log(`To: ${to}`);
            console.log(`Subject: "${subject}"`);
            console.log(`Content:\n${text || html}`);
            console.log(`========================================================\n`);
            return {
                success: true,
                messageId: "dev_msg_" + Date.now()
            };
        }

    } catch (error) {
        console.warn(`[EmailService] SMTP send failed, falling back to console log: ${error.message}`);
        console.log(`\n================== [DEV EMAIL SERVICE FALLBACK] ==================`);
        console.log(`To: ${to}`);
        console.log(`Subject: "${subject}"`);
        console.log(`Content:\n${text || html}`);
        console.log(`==================================================================\n`);
        return {
            success: true,
            messageId: "dev_msg_" + Date.now()
        };
    }
};

module.exports = {
    sendEmail
};

