/**
 * Vismaya Platform Pricing & Credits Configuration
 * Central source of truth for all pricing, fees, and credit rules.
 * All monetary amounts are in INR (₹).
 */

export const PRICING_CONFIG = {
  // One-time registration fees
  TALENT_FEE: 999,
  INDUSTRY_FEE: 4999,

  // Organization Credits rules
  INCLUDED_CREDITS: 100, // Provided upon initial organization registration
  SINGLE_VIEW: 100,      // Price (₹) for 1 additional talent profile view
  BUNDLE_SIZE: 25,       // Credits in a bulk pack
  BUNDLE_PRICE: 2000,    // Price (₹) for 25 views (₹80/view, saving ₹500)
  LOW_BALANCE: 10,       // Threshold below which confirmation/warning is triggered
  REPEAT_WINDOW_DAYS: 7, // Free re-access window after unlocking a talent profile

  // Talent gating rules
  MIN_PROFILE_COMPLETION: 60, // Minimum % completion required before applying

  // Currency & Tax settings
  CURRENCY: "INR",
  CURRENCY_SYMBOL: "₹",
  GST_RATE_PERCENT: 18,  // Configurable tax rate (displayed on separate line where required)
  TAX_INCLUSIVE: true,   // Display note: "Inclusive of applicable GST" or separate line

  // Mock coupon codes for testing
  VALID_COUPONS: {
    VISMAYA10: { code: "VISMAYA10", percent: 10, description: "10% Platform Welcome Discount" },
    CREATIVE20: { code: "CREATIVE20", percent: 20, description: "20% Studio Launch Discount" },
    TALENT100: { code: "TALENT100", flat: 100, description: "₹100 Early Artist Grant" },
  },
};

export default PRICING_CONFIG;
