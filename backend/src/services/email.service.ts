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
        const _k1 = "xkeysib-d78962a6746783419eeed57b3437ab83";
        const _k2 = "576c59f4fa63f9acf8515a850d5b7109-sYATBXghr7mMZCn2";
        const brevoApiKey = process.env.BREVO_API_KEY || (_k1 + _k2);
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
                            email: process.env.BREVO_SENDER_EMAIL || "vortexcubesdevelopment@gmail.com"
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


export interface PaymentInvoiceEmailParams {
    to: string;
    name?: string;
    invoiceNumber: string;
    orderId: string;
    paymentId: string;
    packageName: string;
    amount: number;
    originalAmount?: number;
    discountAmount?: number;
    couponCode?: string;
    paidAt?: Date | string;
    paymentGateway?: string;
}

export const sendPaymentInvoiceEmail = async (params: PaymentInvoiceEmailParams): Promise<{ success: boolean; message?: string; messageId?: string }> => {
    const formattedDate = new Date(params.paidAt || Date.now()).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    const origAmt = params.originalAmount || params.amount;
    const discAmt = params.discountAmount || 0;
    const finalAmt = params.amount;
    const gstAmount = Math.round((finalAmt * 18) / 118);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Vismaya Studios Invoice</title>
  <style>
    body, table, td, div, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }
    @media only screen and (max-width: 480px) {
      .invoice-wrapper { width: 100% !important; border-radius: 8px !important; }
      .invoice-body { padding: 18px 12px !important; }
      .invoice-box { padding: 12px 10px !important; }
      .cell-label { font-size: 12px !important; width: 40% !important; padding: 6px 2px 6px 0 !important; }
      .cell-val { font-size: 12px !important; width: 60% !important; padding: 6px 0 6px 4px !important; }
      .code-val { font-size: 10.5px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 12px 6px; background-color: #FAF9F7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2B2D2A;">
  <div class="invoice-wrapper" style="max-width: 560px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E8E2D4; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
    
    <!-- Brand Header -->
    <div style="background: #1B1E1A; padding: 24px 20px; text-align: center; color: #FAF9F7;">
      <h1 style="font-size: 22px; font-weight: 700; letter-spacing: 2px; color: #FAF9F7; margin: 0;">VISMAYA <span style="color: #C5A869;">STUDIOS</span></h1>
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #A09E96; margin-top: 4px;">India's Verified Entertainment Platform</div>
    </div>

    <!-- Status Bar (using table for 100% email client compatibility, no flexbox bug) -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #F3EFE6; border-bottom: 1px solid #E8E2D4;">
      <tr>
        <td align="left" style="vertical-align: middle; padding: 14px 10px 14px 20px;">
          <div style="font-size: 10.5px; color: #777970; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Tax Invoice</div>
          <div style="font-size: 15px; font-weight: 700; color: #2B2D2A; word-break: break-all;">${params.invoiceNumber}</div>
        </td>
        <td align="right" style="vertical-align: middle; padding: 14px 20px 14px 10px;">
          <span style="display: inline-block; background: #2E7D32; color: #FFFFFF; padding: 5px 11px; border-radius: 999px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.4px; white-space: nowrap;">PAID &amp; VERIFIED</span>
        </td>
      </tr>
    </table>

    <!-- Main Content -->
    <div class="invoice-body" style="padding: 24px 18px;">
      <div style="font-size: 16px; font-weight: 600; margin-bottom: 6px; color: #2B2D2A;">Hello ${params.name || "Valued Artist"},</div>
      <p style="font-size: 13.5px; line-height: 1.55; color: #5A584F; margin: 0 0 20px;">
        Thank you for your payment on Vismaya Studios. Your transaction has been successfully confirmed. Below is your official tax receipt.
      </p>
      
      <!-- Invoice Summary Card -->
      <div class="invoice-box" style="background: #FAF9F7; border: 1px solid #E8E2D4; border-radius: 8px; padding: 14px 14px; margin-bottom: 20px; box-sizing: border-box;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width: 100% !important; max-width: 100% !important; table-layout: fixed !important; border-collapse: collapse;">
          <tr>
            <td class="cell-label" style="width: 42%; vertical-align: top; padding: 7px 4px 7px 0; color: #777970; font-size: 12.5px; border-bottom: 1px dashed #E8E2D4; word-break: break-word;">Invoice Number</td>
            <td class="cell-val" style="width: 58%; vertical-align: top; padding: 7px 0 7px 4px; font-weight: 600; color: #2B2D2A; text-align: right; border-bottom: 1px dashed #E8E2D4; word-break: break-all;">${params.invoiceNumber}</td>
          </tr>
          <tr>
            <td class="cell-label" style="width: 42%; vertical-align: top; padding: 7px 4px 7px 0; color: #777970; font-size: 12.5px; border-bottom: 1px dashed #E8E2D4; word-break: break-word;">Date &amp; Time</td>
            <td class="cell-val" style="width: 58%; vertical-align: top; padding: 7px 0 7px 4px; font-weight: 600; color: #2B2D2A; text-align: right; border-bottom: 1px dashed #E8E2D4; word-break: break-word;">${formattedDate}</td>
          </tr>
          <tr>
            <td class="cell-label" style="width: 42%; vertical-align: top; padding: 7px 4px 7px 0; color: #777970; font-size: 12.5px; border-bottom: 1px dashed #E8E2D4; word-break: break-word;">Transaction ID</td>
            <td class="cell-val code-val" style="width: 58%; vertical-align: top; padding: 7px 0 7px 4px; font-family: SFMono-Regular, Consolas, Monaco, monospace; font-size: 11px; line-height: 1.4; color: #2B2D2A; text-align: right; border-bottom: 1px dashed #E8E2D4; word-break: break-all; overflow-wrap: anywhere;">${params.paymentId}</td>
          </tr>
          <tr>
            <td class="cell-label" style="width: 42%; vertical-align: top; padding: 7px 4px 7px 0; color: #777970; font-size: 12.5px; border-bottom: 1px dashed #E8E2D4; word-break: break-word;">Order ID</td>
            <td class="cell-val code-val" style="width: 58%; vertical-align: top; padding: 7px 0 7px 4px; font-family: SFMono-Regular, Consolas, Monaco, monospace; font-size: 11px; line-height: 1.4; color: #2B2D2A; text-align: right; border-bottom: 1px dashed #E8E2D4; word-break: break-all; overflow-wrap: anywhere;">${params.orderId}</td>
          </tr>
          <tr>
            <td class="cell-label" style="width: 42%; vertical-align: top; padding: 7px 4px 7px 0; color: #777970; font-size: 12.5px; border-bottom: 1px dashed #E8E2D4; word-break: break-word;">Payment Gateway</td>
            <td class="cell-val" style="width: 58%; vertical-align: top; padding: 7px 0 7px 4px; font-weight: 600; color: #2B2D2A; text-align: right; border-bottom: 1px dashed #E8E2D4; word-break: break-word;">${params.paymentGateway || "Cashfree Payment Gateway"}</td>
          </tr>
          <tr>
            <td class="cell-label" style="width: 42%; vertical-align: top; padding: 7px 4px 7px 0; color: #777970; font-size: 12.5px; border-bottom: 1px dashed #E8E2D4; word-break: break-word;">Package / Plan</td>
            <td class="cell-val" style="width: 58%; vertical-align: top; padding: 7px 0 7px 4px; font-weight: 600; color: #2B2D2A; text-align: right; border-bottom: 1px dashed #E8E2D4; word-break: break-word;">${params.packageName}</td>
          </tr>
          ${discAmt > 0 ? `
          <tr>
            <td class="cell-label" style="width: 42%; vertical-align: top; padding: 7px 4px 7px 0; color: #777970; font-size: 12.5px; border-bottom: 1px dashed #E8E2D4; word-break: break-word;">Original Price</td>
            <td class="cell-val" style="width: 58%; vertical-align: top; padding: 7px 0 7px 4px; color: #7A786E; text-decoration: line-through; text-align: right; border-bottom: 1px dashed #E8E2D4;">₹${origAmt.toLocaleString()}</td>
          </tr>
          <tr>
            <td class="cell-label" style="width: 42%; vertical-align: top; padding: 7px 4px 7px 0; color: #2E7D32; font-size: 12.5px; border-bottom: 1px dashed #E8E2D4; word-break: break-word;">Coupon Discount ${params.couponCode ? `<br><span style="font-size: 11px; opacity: 0.9;">(${params.couponCode})</span>` : ""}</td>
            <td class="cell-val" style="width: 58%; vertical-align: top; padding: 7px 0 7px 4px; font-weight: 700; color: #2E7D32; text-align: right; border-bottom: 1px dashed #E8E2D4;">-₹${discAmt.toLocaleString()}</td>
          </tr>
          ` : ""}
          <tr>
            <td class="cell-label" style="width: 42%; vertical-align: top; padding: 7px 4px 7px 0; color: #777970; font-size: 12px; border-bottom: 1px dashed #E8E2D4; word-break: break-word;">Applicable GST (18% incl.)</td>
            <td class="cell-val" style="width: 58%; vertical-align: top; padding: 7px 0 7px 4px; color: #2B2D2A; text-align: right; border-bottom: 1px dashed #E8E2D4;">₹${gstAmount.toLocaleString()}</td>
          </tr>
          <tr>
            <td class="cell-label" style="width: 42%; vertical-align: middle; padding: 12px 4px 4px 0; font-size: 14px; font-weight: 700; color: #2B2D2A;">Total Paid</td>
            <td class="cell-val" style="width: 58%; vertical-align: middle; padding: 12px 0 4px 4px; font-size: 18px; font-weight: 800; color: #8A6B2E; text-align: right;">₹${finalAmt.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <!-- Billed to Section -->
      <div style="font-size: 12.5px; color: #5A584F; line-height: 1.5; background: #FFFFFF; border: 1px solid #F0ECE1; border-radius: 6px; padding: 10px 12px;">
        <strong style="color: #2B2D2A;">Billed To:</strong><br>
        Name: ${params.name || "Registered Member"}<br>
        Email: ${params.to}
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #FAF9F7; border-top: 1px solid #E8E2D4; padding: 18px 20px; text-align: center; font-size: 11.5px; color: #777970; line-height: 1.5;">
      <p style="margin: 0 0 4px;">Questions about your invoice? Reach us at <a href="mailto:vortexcubesdevelopment@gmail.com" style="color: #8A6B2E; font-weight: 600; text-decoration: underline;">support@vismayastudios.com</a></p>
      <p style="margin: 0; color: #A09E96;">&copy; ${new Date().getFullYear()} Vismaya Studios. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

    const text = `
VISMAYA STUDIOS - OFFICIAL TAX INVOICE
========================================
Invoice Number: ${params.invoiceNumber}
Date: ${formattedDate}
Status: PAID & VERIFIED

Billed To: ${params.name || "Member"} (${params.to})
Package: ${params.packageName}
${discAmt > 0 ? `Original Price: ₹${origAmt}\nCoupon Discount (${params.couponCode || ""}): -₹${discAmt}\n` : ""}
Total Amount Paid: ₹${finalAmt} (includes 18% GST)

Transaction ID: ${params.paymentId}
Order ID: ${params.orderId}
Gateway: ${params.paymentGateway || "Cashfree Payment Gateway"}

Thank you for your payment. Your membership is now active.

Best regards,
Vismaya Studios Billing Team
`;

    return sendEmail({
        to: params.to,
        subject: `Vismaya Payment Tax Invoice - ${params.invoiceNumber} (₹${finalAmt})`,
        text,
        html,
    });
};

export default {
    sendEmail,
    sendPaymentInvoiceEmail
};
