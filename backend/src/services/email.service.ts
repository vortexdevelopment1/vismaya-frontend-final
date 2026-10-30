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
            return {
                success: true,
                messageId: "test_msg_" + Date.now()
            };
        }

        // Brevo REST API Integration
        const brevoApiKey = process.env.BREVO_API_KEY;
        if (brevoApiKey) {
            try {
                const response = await fetch("https://api.brevo.com/v3/smtp/email", {
                    method: "POST",
                    headers: {
                        "api-key": brevoApiKey,
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        sender: {
                            name: process.env.EMAIL_FROM_NAME || "Vismaya Studios",
                            email: process.env.EMAIL_FROM || "vortexcubesdevelopment@gmail.com"
                        },
                        to: [{ email: to }],
                        subject,
                        textContent: text || "",
                        htmlContent: html || (text ? text.replace(/\n/g, "<br>") : "")
                    })
                });

                if (response.ok) {
                    const data: any = await response.json();
                    return {
                        success: true,
                        messageId: data?.messageId || "brevo_" + Date.now()
                    };
                } else {
                    const errText = await response.text();
                    console.warn(`[EmailService] Brevo API error (${response.status}): ${errText}`);
                }
            } catch (brevoErr: any) {
                console.warn(`[EmailService] Brevo API request failed: ${brevoErr?.message || brevoErr}`);
            }
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
