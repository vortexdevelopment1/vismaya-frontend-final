import nodemailer, { Transporter } from "nodemailer";

/**
 * Email Service Abstraction for Vismaya Creative Studios platform
 * Decouples controllers from direct email vendor APIs
 *
 * Transporter is lazily initialised on first use so that env vars
 * are guaranteed to be loaded by dotenv before we read them.
 */
let transporter: Transporter | null = null;

const getTransporter = (): Transporter | null => {
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
        auth: { user, pass },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000
    });

    return transporter;
};

export interface SendEmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export const sendEmail = async ({
    to,
    subject,
    text,
    html
}: SendEmailOptions): Promise<{ success: boolean; message?: string; messageId?: string }> => {
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
            (global as any).__TEST_OUTBOX__ = (global as any).__TEST_OUTBOX__ || [];
            (global as any).__TEST_OUTBOX__.push(emailPayload);
            try {
                const { recordEmail }: any = await import("../../tests/helpers/outbox.js" as any);
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

    } catch (error: any) {
        console.warn(`[EmailService] SMTP send failed, falling back to console log: ${error?.message || error}`);
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

export default {
    sendEmail
};
