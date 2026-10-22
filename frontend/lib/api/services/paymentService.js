/**
 * Payments & Credits API Service
 * Handles one-time registration fees, credit purchases, profile view unlocks,
 * digital receipts, and admin ledgers.
 */

import { apiClient, getAuthToken } from "../client.js";
import { isRealMode } from "../config.js";
import { PRICING_CONFIG } from "../../config/pricing.js";
import { mapPayment, mapAdminCreditLedgerRow } from "../mappers/index.js";

/**
 * Dynamically loads the Razorpay checkout script on-demand (not bundled).
 * Safe to call multiple times — resolves immediately if already loaded.
 * @returns {Promise<void>}
 */
function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Razorpay cannot be loaded server-side"));
      return;
    }
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout script"));
    document.head.appendChild(script);
  });
}

/**
 * Open the Razorpay checkout modal and handle verify on success.
 * @param {Object} orderData  Response from POST /api/payments/create-order or normalized order
 *   { orderId, razorpayOrderId, amount, currency, keyId, description, prefill, userName, userEmail }
 * @param {Object} options    { onSuccess, onFailure, onDismiss }
 * @returns {Promise<void>}
 */
export async function openRazorpayCheckout(orderData, options = {}) {
  await loadRazorpayScript();

  const razorpayKey =
    orderData.keyId ||
    orderData.key_id ||
    orderData.key ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    "";

  const orderId = orderData.orderId || orderData.razorpayOrderId || orderData.order_id;
  const razorpayOrderId = orderData.razorpayOrderId || orderData.orderId || orderData.order_id;

  let amountInPaise;
  if (typeof orderData.amount === "number") {
    amountInPaise = orderData.amount < 10000 ? Math.round(orderData.amount * 100) : orderData.amount;
  }

  return new Promise((resolve) => {
    const rzpOptions = {
      key: razorpayKey,
      order_id: razorpayOrderId,
      name: "Vismaya",
      description: orderData.description || orderData.label || "Vismaya Platform Payment",
      prefill: orderData.prefill || {
        name: orderData.userName || "",
        email: orderData.userEmail || "",
      },
      theme: { color: "#6366f1" },
      handler: async function (response) {
        // response: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
        // Map Razorpay Checkout handler names to backend contract: { orderId, paymentId, signature }
        try {
          const verifyPayload = {
            orderId: orderId, // use the orderId returned by create-order (stored in DB)
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          };
          const verifyRes = await apiClient.post("/api/payments/verify", verifyPayload);
          const data = verifyRes?.data || verifyRes;
          if (options.onSuccess) options.onSuccess(data);
        } catch (err) {
          const errorMsg =
            err?.status === 400 || err?.statusCode === 400 || err?.response?.status === 400
              ? "Payment verification failed, please retry or contact support"
              : (err?.message || "Payment verification failed, please retry or contact support");
          const customErr = new Error(errorMsg);
          customErr.status = err?.status || 400;
          customErr.statusCode = err?.status || 400;
          customErr.originalError = err;
          if (options.onFailure) options.onFailure(customErr);
        }
        resolve();
      },
      modal: {
        ondismiss: function () {
          if (options.onDismiss) options.onDismiss();
          resolve();
        },
      },
    };

    if (amountInPaise) {
      rzpOptions.amount = amountInPaise;
    }
    if (orderData.currency) {
      rzpOptions.currency = orderData.currency;
    }

    const rzp = new window.Razorpay(rzpOptions);
    rzp.on("payment.failed", function (failResponse) {
      const errorMsg = failResponse?.error?.description || "Payment failed at checkout gateway";
      const err = new Error(errorMsg);
      err.details = failResponse?.error;
      if (options.onFailure) options.onFailure(err);
    });
    rzp.open();
  });
}

/**
 * Verify payment directly with backend contract { orderId, paymentId, signature }
 * In mock mode: { orderId }
 * In razorpay mode: { orderId, paymentId, signature }
 */
export async function verifyPayment({ orderId, paymentId, signature } = {}) {
  if (isRealMode("payments")) {
    const body = { orderId };
    if (paymentId) body.paymentId = paymentId;
    if (signature) body.signature = signature;

    try {
      const res = await apiClient.post("/api/payments/verify", body);
      return res?.data || res;
    } catch (err) {
      if (err?.status === 400 || err?.statusCode === 400 || err?.response?.status === 400) {
        const customError = new Error("Payment verification failed, please retry or contact support");
        customError.status = 400;
        customError.statusCode = 400;
        customError.originalError = err;
        throw customError;
      }
      throw err;
    }
  }

  return {
    success: true,
    message: "Payment verified successfully",
    mode: "mock",
  };
}

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

// Package type mapping: frontend type -> backend packageType identifier
export const PACKAGE_TYPE_MAP = {
  talent_registration:       "talent_annual_999",
  organization_registration: "industry_annual_4999",
  industry_registration:     "industry_annual_4999",
  bundle_views:              "credit_bundle_25_2000",
  single_view:               "credit_single_100",
};

export const paymentService = {
  /**
   * Apply promotional coupon code
   * @param {string} code Coupon code string
   * @param {number} baseAmount Original amount before coupon
   * @param {string} [packageType] Backend or frontend package type
   */
  async applyCoupon(code, baseAmount, packageType) {
    const cleanCode = (code || "").trim().toUpperCase();
    if (!cleanCode) {
      return {
        success: false,
        message: "Please enter a coupon code.",
      };
    }

    const normalizedPackageType = PACKAGE_TYPE_MAP[packageType] || packageType;

    // Real backend POST /api/payments/apply-coupon (requires authenticated session)
    if (isRealMode("payments") && getAuthToken()) {
      if (!normalizedPackageType) {
        return {
          success: false,
          message: "Please select a plan before applying a coupon.",
        };
      }
      try {
        const res = await apiClient.post("/api/payments/apply-coupon", {
          couponCode: cleanCode,
          packageType: normalizedPackageType,
        });
        return res?.data || res;
      } catch (err) {
        return {
          success: false,
          message: err?.message || "Invalid or expired coupon code.",
        };
      }
    }

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
    const packageType = PACKAGE_TYPE_MAP[type] || type;
    const isRegistration = type === "talent_registration" || type === "organization_registration";

    if ((isRealMode("payments") && getAuthToken()) || isRegistration) {
      const body = {
        packageType,
        email: metadata.userEmail,
        userEmail: metadata.userEmail,
        userName: metadata.userName,
        ...metadata
      };
      // Pass couponCode explicitly if present
      if (metadata.couponCode) {
        body.couponCode = metadata.couponCode;
      }
      try {
        const res = await apiClient.post("/api/payments/create-order", body);
        const raw = res?.data || res;
        const orderInfo = raw?.order || {};
        const orderId = raw?.orderId || orderInfo.orderId || raw?.razorpayOrderId;
        const razorpayOrderId = raw?.razorpayOrderId || orderInfo.razorpayOrderId || orderId;
        const keyId = raw?.keyId || orderInfo.keyId || orderInfo.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
        const mode = raw?.mode || orderInfo.mode || "mock";
        const amount = raw?.amount ?? orderInfo.amount;

        const normalizedData = {
          orderId,
          razorpayOrderId,
          keyId,
          mode,
          type,
          packageType: orderInfo.packageType || packageType,
          label: orderInfo.packageName || (type === "organization_registration" ? "Organization Registration" : "Talent Registration"),
          baseAmount: orderInfo.originalAmount ?? amount,
          discountAmount: orderInfo.discountAmount ?? 0,
          finalAmount: amount,
          amount,
          currency: raw?.currency || orderInfo.currency || "INR",
          createdAt: new Date().toISOString(),
          ...orderInfo,
        };

        return {
          ...raw,
          success: raw?.success ?? true,
          mode,
          orderId,
          razorpayOrderId,
          keyId,
          data: normalizedData,
        };
      } catch (err) {
        console.warn("API create-order notice:", err?.message);
        if (!isRegistration) throw err;
      }
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
      const couponRes = await this.applyCoupon(metadata.couponCode, baseAmount, packageType);
      if (couponRes.success) {
        discountAmount = couponRes.data.discountAmount;
      }
    }

    const finalAmount = Math.max(0, baseAmount - discountAmount);
    const orderId = `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    return {
      success: true,
      mode: "mock",
      data: {
        orderId,
        type,
        label,
        baseAmount,
        discountAmount,
        finalAmount,
        amount: finalAmount,
        currency: PRICING_CONFIG.CURRENCY,
        createdAt: new Date().toISOString(),
        mode: "mock",
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

    // Real backend POST /api/payments/verify or /api/payments/mock-confirm
    const isRegistration = payload.type === "talent_registration" || payload.type === "organization_registration";
    if ((isRealMode("payments") && getAuthToken()) || isRegistration) {
      if (shouldFail) {
        return {
          success: false,
          status: "Pending",
          message: "Payment transaction could not be processed. Your card was not debited.",
          orderId,
        };
      }

      try {
        const verifyBody = {
          orderId,
        };
        const paymentId = payload.paymentId || payload.razorpayPaymentId || payload.razorpay_payment_id;
        const signature = payload.signature || payload.razorpaySignature || payload.razorpay_signature;
        if (paymentId) verifyBody.paymentId = paymentId;
        if (signature) verifyBody.signature = signature;

        const res = await apiClient.post("/api/payments/verify", verifyBody);
        const data = res?.data || res;
        const tx = data?.transaction || {};
        return {
          success: data?.success ?? true,
          status: "Successful",
          mode: data?.mode,
          transaction: tx,
          receipt: {
            receiptNumber: tx.invoiceNumber || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            transactionId: tx.paymentId || tx.orderId || orderId,
            orderId: tx.orderId || orderId,
            amount: tx.amount || payload.amount,
            currency: tx.currency || "INR",
            issuedAt: tx.paidAt || tx.createdAt || new Date().toISOString(),
            type: tx.packageType || payload.type,
            typeLabel: payload.label || "Platform Payment",
            userName: payload.userName || "Verified User",
            userEmail: payload.userEmail || "user@vismaya.io",
            status: "Paid",
          },
          message: data?.message || "Payment verified and membership/credits activated successfully",
        };
      } catch (err) {
        const errorMsg =
          err?.status === 400 || err?.statusCode === 400 || err?.response?.status === 400
            ? "Payment verification failed, please retry or contact support"
            : (err?.message || "Payment verification failed, please retry or contact support");
        return {
          success: false,
          status: "Failed",
          message: errorMsg,
          orderId,
          error: err,
        };
      }
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
    if (isRealMode("credits") || isRealMode("payments")) {
      try {
        const res = await apiClient.get("/api/credits/balance");
        return res?.data || res;
      } catch (err) {
        console.warn("Failed to fetch credits balance from backend:", err?.message);
        throw err;
      }
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
    if (isRealMode("credits") || isRealMode("payments")) {
      try {
        const res = await apiClient.get("/api/credits/viewed");
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.history) ? res.history : Array.isArray(res) ? res : [];
        return list;
      } catch (err) {
        console.warn("Failed to fetch viewed talents from backend:", err?.message);
        return [];
      }
    }

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
    if (isRealMode("payments")) {
      try {
        // Correct backend route: GET /api/admin/transactions
        const res = await apiClient.get("/api/admin/transactions");
        const rawList = Array.isArray(res?.transactions)
          ? res.transactions
          : Array.isArray(res?.data?.transactions)
          ? res.data.transactions
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];

        return rawList.map((tx) => {
          // Normalize status: "successful" -> "Successful", "failed" -> "Failed", "attempted" / "created" -> "Pending"
          let normalizedStatus = "Pending";
          const rawStatus = String(tx.status || "").toLowerCase();
          if (rawStatus === "successful" || rawStatus === "paid") {
            normalizedStatus = "Successful";
          } else if (rawStatus === "failed") {
            normalizedStatus = "Failed";
          } else if (tx.status === "Successful") {
            normalizedStatus = "Successful";
          }

          // Normalize type: "talent_annual_999" -> "talent_registration", "industry_annual_4999" -> "organization_registration", etc.
          let normalizedType = tx.type || "talent_registration";
          let typeLabel = tx.typeLabel;
          if (tx.packageType === "talent_annual_999" || tx.type === "talent_registration") {
            normalizedType = "talent_registration";
            typeLabel = typeLabel || "Talent Registration Fee";
          } else if (tx.packageType === "industry_annual_4999" || tx.type === "organization_registration") {
            normalizedType = "organization_registration";
            typeLabel = typeLabel || "Organization Registration Fee";
          } else if (tx.packageType === "credit_bundle_25_2000" || tx.type === "bundle_views") {
            normalizedType = "bundle_views";
            typeLabel = typeLabel || "Credit Bundle (25 Views)";
          } else if (tx.packageType === "credit_single_100" || tx.type === "single_view") {
            normalizedType = "single_view";
            typeLabel = typeLabel || "Single View Top-up";
          }

          const userObj = typeof tx.userId === "object" ? tx.userId : null;
          const orgObj = typeof tx.organizationId === "object" ? tx.organizationId : null;
          const userName = tx.userName || userObj?.name || orgObj?.organizationName || "User";
          const userEmail = tx.userEmail || userObj?.email || "—";

          return {
            id: tx._id || tx.id || `tx-${Date.now()}`,
            orderId: tx.orderId || "—",
            userId: userObj?._id || tx.userId || "—",
            userName,
            userEmail,
            type: normalizedType,
            typeLabel: typeLabel || normalizedType,
            amount: tx.amount || 0,
            currency: tx.currency || "INR",
            status: normalizedStatus,
            paymentGateway: tx.paymentGateway || "Razorpay",
            invoiceNumber: tx.invoiceNumber || `INV-${String(tx._id || Date.now()).slice(-6).toUpperCase()}`,
            date: tx.paidAt ? new Date(tx.paidAt).toISOString().split("T")[0] : tx.createdAt ? new Date(tx.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            paidAt: tx.paidAt || tx.createdAt || new Date().toISOString(),
            raw: tx,
          };
        });
      } catch (err) {
        console.error("Failed to fetch real admin transactions:", err);
        return [];
      }
    }

    const mockTxs = safeGetStorage(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    return Array.isArray(mockTxs) ? mockTxs : [];
  },

  /**
   * Fetch organization credits and ledger for admin console
   */
  async getAdminCredits() {
    if (isRealMode("payments")) {
      try {
        const res = await apiClient.get("/api/admin/credits/ledger");
        const data = res?.data || res;
        const rawLedger = Array.isArray(data?.ledger) ? data.ledger : [];

        // Build organization summaries from ledger rows and embedded orgBalance
        const orgMap = new Map();
        for (const entry of rawLedger) {
          const org = entry.organization;
          const orgId = typeof org === "object" ? (org?._id ? String(org._id) : "") : (org ? String(org) : "");
          if (!orgId) continue;

          if (!orgMap.has(orgId)) {
            const orgName = (typeof org === "object" ? (org?.name || org?.studioName || org?.organizationName) : "") || `Organization (${orgId.slice(-6)})`;
            const ob = entry.orgBalance || {};
            orgMap.set(orgId, {
              orgId,
              orgName,
              contactPerson: "Studio Desk",
              contactEmail: "-",
              currentBalance: typeof ob.balance === "number" ? ob.balance : (entry.balanceAfter || 0),
              includedCredits: typeof ob.includedCredits === "number" ? ob.includedCredits : 0,
              purchasedCredits: typeof ob.purchasedCredits === "number" ? ob.purchasedCredits : 0,
              consumedCredits: typeof ob.consumedCredits === "number" ? ob.consumedCredits : 0,
              status: "Active",
              lastActivity: entry.createdAt || new Date().toISOString(),
            });
          }
        }

        const mappedLedger = rawLedger.map((row) => mapAdminCreditLedgerRow(row));

        return {
          success: data?.success ?? true,
          count: data?.count ?? mappedLedger.length,
          total: data?.total ?? mappedLedger.length,
          page: data?.page ?? 1,
          totalPages: data?.totalPages ?? 1,
          orgSummaries: Array.from(orgMap.values()),
          ledger: mappedLedger,
        };
      } catch (err) {
        if (err?.status === 404 || err?.response?.status === 404) {
          return {
            success: true,
            count: 0,
            total: 0,
            page: 1,
            totalPages: 1,
            orgSummaries: [],
            ledger: [],
          };
        }
        throw err;
      }
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
      success: true,
      count: ledger.length,
      total: ledger.length,
      page: 1,
      totalPages: 1,
      orgSummaries,
      ledger,
    };
  },

  /**
   * Admin adjust organization credit balance
   */
  async adjustCredits(orgId, amount, reason = "Manual Admin Adjustment") {
    if (isRealMode("payments")) {
      const res = await apiClient.post("/api/admin/credits/adjust", {
        organizationId: orgId,
        amount: Number(amount),
        reason,
      });
      const data = res?.data || res;
      return {
        success: data?.success ?? true,
        newBalance: data?.ledger?.balance,
        message: data?.message || `Adjusted credit balance by ${amount > 0 ? "+" + amount : amount}.`,
      };
    }
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

  openRazorpayCheckout,
  verifyPayment,
};

export default paymentService;
