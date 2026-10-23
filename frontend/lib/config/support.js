/**
 * Platform Support Configuration
 * Reads public support contact channels from environment variables.
 */

export const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "";
export const supportWhatsapp = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "";

export default {
  supportEmail,
  supportWhatsapp,
};
