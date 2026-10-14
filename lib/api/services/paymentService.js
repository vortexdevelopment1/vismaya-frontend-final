/**
 * Payments & Credits API Service
 * Handles one-time registration fees, credit purchases, profile view unlocks,
 * digital receipts, and admin ledgers.
 */

import { apiClient } from "../client.js";
import { isRealMode } from "../config.js";
import { PRICING_CONFIG } from "../../config/pricing.js";
import { mapPayment } from "../mappers/index.js";

// Safe local storage helpers
const STORAGE_KEYS = {
  CREDITS: "vismaya_org_credits",
  VIEWED_TALENTS: "vismaya_viewed_talents",
  TRANSACTIONS: "vismaya_transactions",
  CREDIT_LEDGER: "vismaya_credit_ledger",
  TALENT_PAYMENT: "vismaya_talent_payment_status",
};

function safeGetStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    return fallback;
  }
}

function safeSetStorage(key, value) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}

// Initial Mock Seed for Platform Transactions
const SEED_TRANSACTIONS = [
  {
    id: "tx-pay-901",
    orderId: "ord_901_tal",
    userId: "tal-904",
    userName: "Riya Sharma",
    userEmail: "riya.sharma@vismaya.io",
    type: "talent_registration",
    typeLabel: "Talent Registration Fee",
    amount: PRICING_CONFIG.TALENT_FEE,
    currency: "INR",
    status: "Successful",
    paymentGateway: "Razorpay (Mock)",
    invoiceNumber: "INV-2026-901",
    date: "2026-09-20",
    paidAt: "2026-09-20T10:14:00.000Z",
  },
  {
    id: "tx-pay-902",
    orderId: "ord_902_org",
    userId: "org-1",
    userName: "Zee Films Casting Desk",
    userEmail: "casting@zeefilms.com",
    type: "organization_registration",
    typeLabel: "Organization Registration Fee",
    amount: PRICING_CONFIG.INDUSTRY_FEE,
    currency: "INR",
    status: "Successful",
    creditsAwarded: PRICING_CONFIG.INCLUDED_CREDITS,
    paymentGateway: "Razorpay (Mock)",
    invoiceNumber: "INV-2026-902",
    date: "2026-09-22",
    paidAt: "2026-09-22T14:30:00.000Z",
  },
  {
    id: "tx-pay-903",
    orderId: "ord_903_bun",
    userId: "org-1",
    userName: "Zee Films Casting Desk",
    userEmail: "casting@zeefilms.com",
    type: "bundle_views",
    typeLabel: "25 Profile Views Bundle",
    amount: PRICING_CONFIG.BUNDLE_PRICE,
    currency: "INR",
    status: "Successful",
    creditsAwarded: PRICING_CONFIG.BUNDLE_SIZE,
    paymentGateway: "Razorpay (Mock)",
    invoiceNumber: "INV-2026-903",
    date: "2026-10-05",
    paidAt: "2026-10-05T16:45:00.000Z",
  },
];

// Initial Seed for Credit Ledger
const SEED_CREDIT_LEDGER = [
  {
    id: "c-led-101",
    orgId: "org-1",
    orgName: "Zee Films Studio",
    type: "registration_included",
    typeLabel: "Registration Credits Granted",
    change: +100,
    balanceAfter: 100,
    reference: "INV-2026-902",
    notes: "Initial 100 included profile views upon registration",
    date: "2026-09-22T14:30:00.000Z",
  },
  {
    id: "c-led-102",
    orgId: "org-1",
    orgName: "Zee Films Studio",
    type: "profile_view_deduction",
    typeLabel: "Talent Comp-Card View",
    change: -1,
    balanceAfter: 99,
    reference: "tal-904",
    notes: "Full profile unlock: Riya Sharma",
    date: "2026-10-01T11:20:00.000Z",
  },
  {
    id: "c-led-103",
    orgId: "org-1",
    orgName: "Zee Films Studio",
    type: "bundle_purchase",
    typeLabel: "Bulk Views Purchased",
    change: +25,
    balanceAfter: 124,
    reference: "INV-2026-903",
    notes: "25 Profile-views pack (₹2,000)",
    date: "2026-10-05T16:45:00.000Z",
  },
];

export const paymentService = {
  /**
   * Apply promotional coupon code
   * @param {string} code Coupon code string
   * @param {number} baseAmount Original amount before coupon
   */
  async applyCoupon(code, baseAmount) {
    // TODO: Real backend POST /api/payments/apply-coupon
    if (isRealMode("payments")) {
      const res = await apiClient.post("/api/payments/apply-coupon", { code, baseAmount });
      return res?.data || res;
    }

    const cleanCode = (code || "").trim().toUpperCase();
    const coupon = PRICING_CONFIG.VALID_COUPONS[cleanCode];

    if (!coupon) {
      return {
        success: false,
        message: "Invalid or expired coupon code. Try VISMAYA10 or CREATIVE20.",
      };
    }

    let discountAmount = 0;
    if (coupon.percent) {
      discountAmount = Math.round((baseAmount * coupon.percent) / 100);
    } else if (coupon.flat) {
      discountAmount = Math.min(coupon.flat, baseAmount);
    }

    const finalAmount = Math.max(0, baseAmount - discountAmount);

    return {
      success: true,
      data: {
        code: coupon.code,
        description: coupon.description,
        discountAmount,
        finalAmount,
      },
    };
  },

  /**
   * Create an order for payment checkout
   * @param {string} type 'talent_registration' | 'organization_registration' | 'single_view' | 'bundle_views'
   * @param {Object} metadata Extra data like couponCode, userId, etc.
   */
  async createPaymentOrder(type, metadata = {}) {
    // TODO: Real backend POST /api/payments/create-order
    if (isRealMode("payments")) {
      const res = await apiClient.post("/api/payments/create-order", { type, ...metadata });
      return res?.data || res;
    }

    let baseAmount = PRICING_CONFIG.TALENT_FEE;
    let label = "Talent Registration Fee";

    if (type === "organization_registration") {
      baseAmount = PRICING_CONFIG.INDUSTRY_FEE;
      label = "Organization Registration & 100 Credits";
    } else if (type === "bundle_views") {
      baseAmount = PRICING_CONFIG.BUNDLE_PRICE;
      label = "25 Profile Views Bundle";
    } else if (type === "single_view") {
      baseAmount = PRICING_CONFIG.SINGLE_VIEW;
      label = "Single Talent Profile View";
    }

    let discountAmount = 0;
    if (metadata.couponCode) {
      const couponRes = await this.applyCoupon(metadata.couponCode, baseAmount);
      if (couponRes.success) {
        discountAmount = couponRes.data.discountAmount;
      }
    }

    const finalAmount = Math.max(0, baseAmount - discountAmount);
    const orderId = `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    return {
      success: true,
      data: {
        orderId,
        type,
        label,
        baseAmount,
        discountAmount,
        finalAmount,
        currency: PRICING_CONFIG.CURRENCY,
        createdAt: new Date().toISOString(),
      },
    };
  },

  /**
   * Confirm and process payment checkout
   * @param {string} orderId
   * @param {string} outcome 'success' | 'fail'
   * @param {Object} payload { type, amount, userName, userEmail, orgId, couponCode }
   */
  async confirmPayment(orderId, outcome = "success", payload = {}) {
    // Check for simulated failure query (?pay=fail)
    let shouldFail = outcome === "fail";
    if (typeof window !== "undefined" && window.location.search.includes("pay=fail")) {
      shouldFail = true;
    }

    // Simulate 1.5s gateway latency
    await new Promise((res) => setTimeout(res, 1500));

    // TODO: Real backend POST /api/payments/verify
    if (isRealMode("payments")) {
      const res = await apiClient.post("/api/payments/verify", { orderId, outcome, ...payload });
      return res?.data || res;
    }

    const txId = `pay_tx_${Date.now()}`;
    const invoiceNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (shouldFail) {
      const failedTx = {
        id: txId,
        orderId,
        userName: payload.userName || "Candidate",
        userEmail: payload.userEmail || "user@vismaya.io",
        type: payload.type || "talent_registration",
        typeLabel: payload.label || "Platform Payment",
        amount: payload.amount || 999,
        currency: "INR",
        status: "Failed",
        invoiceNumber: "PENDING",
        date: new Date().toISOString().split("T")[0],
        paidAt: null,
      };

      const existingTxs = safeGetStorage(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
      safeSetStorage(STORAGE_KEYS.TRANSACTIONS, [failedTx, ...existingTxs]);

      return {
        success: false,
        status: "Pending",
        message: "Payment transaction could not be processed. Your card was not debited.",
        orderId,
      };
    }

    // Success transaction record
    const successfulTx = {
      id: txId,
      orderId,
      userId: payload.userId || (payload.type === "talent_registration" ? "tal-904" : "org-1"),
      userName: payload.userName || "Verified User",
      userEmail: payload.userEmail || "user@vismaya.io",
      type: payload.type || "talent_registration",
      typeLabel: payload.label || "Registration Fee",
      amount: payload.amount || (payload.type === "organization_registration" ? PRICING_CONFIG.INDUSTRY_FEE : PRICING_CONFIG.TALENT_FEE),
      currency: "INR",
      status: "Successful",
      invoiceNumber: invoiceNum,
      date: new Date().toISOString().split("T")[0],
      paidAt: new Date().toISOString(),
      creditsAwarded: payload.type === "organization_registration" ? PRICING_CONFIG.INCLUDED_CREDITS : payload.type === "bundle_views" ? PRICING_CONFIG.BUNDLE_SIZE : payload.type === "single_view" ? 1 : 0,
      paymentGateway: "Razorpay (Mock)",
    };

    // Save transaction
    const existingTxs = safeGetStorage(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    safeSetStorage(STORAGE_KEYS.TRANSACTIONS, [successfulTx, ...existingTxs]);

    // Handle credits update
    if (payload.type === "organization_registration") {
      this.initOrgCredits("org-1", PRICING_CONFIG.INCLUDED_CREDITS, invoiceNum);
    } else if (payload.type === "bundle_views") {
      this.addCredits("org-1", PRICING_CONFIG.BUNDLE_SIZE, "bundle_purchase", invoiceNum, "Purchased 25 Profile Views");
    } else if (payload.type === "single_view") {
      this.addCredits("org-1", 1, "single_purchase", invoiceNum, "Purchased 1 Profile View");
    } else if (payload.type === "talent_registration") {
      safeSetStorage(STORAGE_KEYS.TALENT_PAYMENT, { paid: true, date: new Date().toISOString() });
    }

    return {
      success: true,
      status: "Successful",
      receipt: {
        receiptNumber: invoiceNum,
        transactionId: txId,
        orderId,
        amount: successfulTx.amount,
        currency: "INR",
        issuedAt: successfulTx.paidAt,
        type: successfulTx.type,
        typeLabel: successfulTx.typeLabel,
        userName: successfulTx.userName,
        userEmail: successfulTx.userEmail,
        status: "Paid",
      },
      message: "Payment confirmed successfully. Confirmation sent to your registered email.",
    };
  },

  /**
   * Check if talent has completed one-time payment
   */
  isTalentPaid() {
    if (typeof window === "undefined") return true;
    const status = safeGetStorage(STORAGE_KEYS.TALENT_PAYMENT, null);
    if (status && status.paid) return true;
    // Default mock user is marked as paid
    return true;
  },

  /**
   * Set talent payment status explicitly
   */
  setTalentPaid(val = true) {
    safeSetStorage(STORAGE_KEYS.TALENT_PAYMENT, { paid: val, date: new Date().toISOString() });
  },

  /**
   * Get organization credits ledger and balance
   */
  async getCredits(orgId = "org-1") {
    // TODO: Real backend GET /api/credits/balance
    if (isRealMode("payments")) {
      const res = await apiClient.get("/api/credits/balance");
      return res?.data || res;
    }

    const defaultLedger = {
      balance: PRICING_CONFIG.INCLUDED_CREDITS,
      includedCredits: PRICING_CONFIG.INCLUDED_CREDITS,
      purchasedCredits: 25,
      consumedCredits: 1,
      lowBalanceWarning: false,
    };

    const stored = safeGetStorage(STORAGE_KEYS.CREDITS, defaultLedger);
    stored.lowBalanceWarning = stored.balance < PRICING_CONFIG.LOW_BALANCE;
    return stored;
  },

  /**
   * Initialize organization credits upon registration
   */
  initOrgCredits(orgId = "org-1", credits = PRICING_CONFIG.INCLUDED_CREDITS, invoiceNum = "") {
    const data = {
      balance: credits,
      includedCredits: credits,
      purchasedCredits: 0,
      consumedCredits: 0,
      lowBalanceWarning: false,
    };
    safeSetStorage(STORAGE_KEYS.CREDITS, data);

    const ledgerEntry = {
      id: `c-led-${Date.now()}`,
      orgId,
      orgName: "Zee Films Studio",
      type: "registration_included",
      typeLabel: "Registration Credits Granted",
      change: +credits,
      balanceAfter: credits,
      reference: invoiceNum,
      notes: `${credits} profile-view credits credited upon registration`,
      date: new Date().toISOString(),
    };

    const existingLedger = safeGetStorage(STORAGE_KEYS.CREDIT_LEDGER, SEED_CREDIT_LEDGER);
    safeSetStorage(STORAGE_KEYS.CREDIT_LEDGER, [ledgerEntry, ...existingLedger]);
  },

  /**
   * Add credits to organization
   */
  addCredits(orgId = "org-1", amount = 25, type = "bundle_purchase", reference = "", notes = "") {
    const current = safeGetStorage(STORAGE_KEYS.CREDITS, {
      balance: 100,
      includedCredits: 100,
      purchasedCredits: 0,
      consumedCredits: 0,
    });

    const newBalance = current.balance + amount;
    current.balance = newBalance;
    current.purchasedCredits = (current.purchasedCredits || 0) + amount;
    current.lowBalanceWarning = newBalance < PRICING_CONFIG.LOW_BALANCE;

    safeSetStorage(STORAGE_KEYS.CREDITS, current);

    const ledgerEntry = {
      id: `c-led-${Date.now()}`,
      orgId,
      orgName: "Zee Films Studio",
      type,
      typeLabel: type === "bundle_purchase" ? "Bulk Views Purchased" : "Single View Purchased",
      change: +amount,
      balanceAfter: newBalance,
      reference,
      notes: notes || `Credited ${amount} views`,
      date: new Date().toISOString(),
    };

    const existingLedger = safeGetStorage(STORAGE_KEYS.CREDIT_LEDGER, SEED_CREDIT_LEDGER);
    safeSetStorage(STORAGE_KEYS.CREDIT_LEDGER, [ledgerEntry, ...existingLedger]);
  },

  /**
   * Unlock and view talent profile with 7-day repeat check
   * @param {string} talentId
   * @param {Object} talentInfo { name, avatar, role }
   * @param {boolean} confirmLowBalance If user explicitly confirmed low-balance warning
   */
  async viewTalentProfile(talentId, talentInfo = {}, confirmLowBalance = false) {
    if (!talentId) return { allowed: true };

    // 1. Check if already unlocked within 7 days
    const viewedList = safeGetStorage(STORAGE_KEYS.VIEWED_TALENTS, [
      {
        talentId: "tal-904",
        talentName: "Riya Sharma",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
        role: "Actor / Model",
        viewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        freeUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);

    const existing = viewedList.find((v) => v.talentId === talentId);
    if (existing) {
      const freeUntilDate = new Date(existing.freeUntil);
      if (freeUntilDate > new Date()) {
        return {
          allowed: true,
          free: true,
          freeUntil: existing.freeUntil,
          message: "Profile previously unlocked. Free view active.",
        };
      }
    }

    // 2. Fetch current credits
    const credits = await this.getCredits();

    // 3. Zero balance check
    if (credits.balance <= 0) {
      return {
        allowed: false,
        reason: "zero_credits",
        balance: 0,
        message: "You have 0 profile-view credits remaining. Please buy more views to unlock candidate profiles.",
      };
    }

    // 4. Low balance warning check (< 10)
    if (credits.balance < PRICING_CONFIG.LOW_BALANCE && !confirmLowBalance) {
      return {
        allowed: false,
        reason: "low_balance_confirm",
        balance: credits.balance,
        message: `Low balance alert: You have only ${credits.balance} credits remaining. Unlocking this profile will consume 1 credit.`,
      };
    }

    // 5. Deduct 1 credit
    const newBalance = credits.balance - 1;
    credits.balance = newBalance;
    credits.consumedCredits = (credits.consumedCredits || 0) + 1;
    credits.lowBalanceWarning = newBalance < PRICING_CONFIG.LOW_BALANCE;
    safeSetStorage(STORAGE_KEYS.CREDITS, credits);

    // 6. Record 7-day repeat window
    const now = new Date();
    const freeUntil = new Date(now.getTime() + PRICING_CONFIG.REPEAT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const newViewed = {
      talentId,
      talentName: talentInfo.name || "Talent Candidate",
      avatar: talentInfo.avatar || "",
      role: talentInfo.role || "Artist",
      viewedAt: now.toISOString(),
      freeUntil,
    };

    const updatedViewedList = [newViewed, ...viewedList.filter((v) => v.talentId !== talentId)];
    safeSetStorage(STORAGE_KEYS.VIEWED_TALENTS, updatedViewedList);

    // 7. Record in ledger
    const ledgerEntry = {
      id: `c-led-${Date.now()}`,
      orgId: "org-1",
      orgName: "Zee Films Studio",
      type: "profile_view_deduction",
      typeLabel: "Talent Comp-Card View",
      change: -1,
      balanceAfter: newBalance,
      reference: talentId,
      notes: `Full profile unlock: ${talentInfo.name || talentId}`,
      date: now.toISOString(),
    };

    const existingLedger = safeGetStorage(STORAGE_KEYS.CREDIT_LEDGER, SEED_CREDIT_LEDGER);
    safeSetStorage(STORAGE_KEYS.CREDIT_LEDGER, [ledgerEntry, ...existingLedger]);

    return {
      allowed: true,
      free: false,
      deducted: 1,
      remainingBalance: newBalance,
      freeUntil,
      message: `1 credit deducted. ${newBalance} credits remaining.`,
    };
  },

  /**
   * Get list of previously viewed talent for organization
   */
  async getViewedTalents() {
    return safeGetStorage(STORAGE_KEYS.VIEWED_TALENTS, [
      {
        talentId: "tal-904",
        talentName: "Riya Sharma",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
        role: "Actor / Model",
        viewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        freeUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
  },

  /**
   * Fetch all platform transactions for admin console
   */
  async getAdminTransactions() {
    // TODO: Real backend GET /api/admin/payments/transactions
    if (isRealMode("payments")) {
      const res = await apiClient.get("/api/admin/payments/transactions");
      return res?.data || res;
    }

    return safeGetStorage(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
  },

  /**
   * Fetch organization credits and ledger for admin console
   */
  async getAdminCredits() {
    // TODO: Real backend GET /api/admin/credits/ledger
    if (isRealMode("payments")) {
      const res = await apiClient.get("/api/admin/credits/ledger");
      return res?.data || res;
    }

    const ledger = safeGetStorage(STORAGE_KEYS.CREDIT_LEDGER, SEED_CREDIT_LEDGER);
    const orgCredits = safeGetStorage(STORAGE_KEYS.CREDITS, {
      balance: PRICING_CONFIG.INCLUDED_CREDITS,
      includedCredits: PRICING_CONFIG.INCLUDED_CREDITS,
      purchasedCredits: 25,
      consumedCredits: 1,
    });

    const orgSummaries = [
      {
        orgId: "org-1",
        orgName: "Zee Films Studio",
        contactPerson: "Vikram Malhotra",
        contactEmail: "casting@zeefilms.com",
        currentBalance: orgCredits.balance,
        includedCredits: orgCredits.includedCredits,
        purchasedCredits: orgCredits.purchasedCredits,
        consumedCredits: orgCredits.consumedCredits,
        status: "Active",
        lastActivity: new Date().toISOString(),
      },
      {
        orgId: "org-2",
        orgName: "Dharma Productions",
        contactPerson: "Karan Johar Desk",
        contactEmail: "talent@dharma.com",
        currentBalance: 78,
        includedCredits: 100,
        purchasedCredits: 0,
        consumedCredits: 22,
        status: "Active",
        lastActivity: "2026-10-10T12:00:00.000Z",
      },
      {
        orgId: "org-3",
        orgName: "Yash Raj Films",
        contactPerson: "Shanoo Sharma Desk",
        contactEmail: "casting@yrf.com",
        currentBalance: 145,
        includedCredits: 100,
        purchasedCredits: 50,
        consumedCredits: 5,
        status: "Active",
        lastActivity: "2026-10-12T09:30:00.000Z",
      },
    ];

    return {
      orgSummaries,
      ledger,
    };
  },

  /**
   * Admin adjust organization credit balance
   */
  async adjustCredits(orgId, amount, reason = "Manual Admin Adjustment") {
    const current = safeGetStorage(STORAGE_KEYS.CREDITS, {
      balance: 100,
      includedCredits: 100,
      purchasedCredits: 0,
      consumedCredits: 0,
    });

    const newBalance = Math.max(0, current.balance + Number(amount));
    current.balance = newBalance;
    current.lowBalanceWarning = newBalance < PRICING_CONFIG.LOW_BALANCE;
    safeSetStorage(STORAGE_KEYS.CREDITS, current);

    const ledgerEntry = {
      id: `c-led-${Date.now()}`,
      orgId,
      orgName: orgId === "org-1" ? "Zee Films Studio" : "Organization",
      type: "admin_adjustment",
      typeLabel: "Administrative Adjustment",
      change: Number(amount),
      balanceAfter: newBalance,
      reference: "ADMIN-OP",
      notes: reason,
      date: new Date().toISOString(),
    };

    const existingLedger = safeGetStorage(STORAGE_KEYS.CREDIT_LEDGER, SEED_CREDIT_LEDGER);
    safeSetStorage(STORAGE_KEYS.CREDIT_LEDGER, [ledgerEntry, ...existingLedger]);

    return {
      success: true,
      newBalance,
      message: `Adjusted credit balance by ${amount > 0 ? "+" + amount : amount}. New balance: ${newBalance}.`,
    };
  },
};

export default paymentService;
