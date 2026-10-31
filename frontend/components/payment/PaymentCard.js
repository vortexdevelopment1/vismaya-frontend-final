"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  FileText,
  Mail,
  HelpCircle,
} from "lucide-react";
import { PRICING_CONFIG } from "@/lib/config/pricing";
import { paymentService, PACKAGE_TYPE_MAP } from "@/lib/api/services/paymentService";
import { isRealMode } from "@/lib/api/config";
import { getAuthToken } from "@/lib/api/client";
import Link from "next/link";

export default function PaymentCard({
  type = "talent_registration", // 'talent_registration' | 'organization_registration' | 'single_view' | 'bundle_views'
  userName = "Candidate",
  userEmail = "user@vismaya.io",
  onSuccess = null,
  onCancel = null,
  isModal = false,
}) {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const [order, setOrder] = useState(null);
  const [paymentState, setPaymentState] = useState("idle"); // 'idle' | 'processing' | 'success' | 'failed'
  const [receipt, setReceipt] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const isRegistration = type === "talent_registration" || type === "organization_registration";

  // Initialize Order function callable for both initial load and manual retries
  const initOrder = async () => {
    if (isRealMode("payments") && !getAuthToken() && !isRegistration) {
      setPaymentState("failed");
      setErrorMessage("Please verify your account and sign in before starting a payment.");
      return;
    }

    try {
      setPaymentState("processing");
      setErrorMessage("");
      const res = await paymentService.createPaymentOrder(type, {
        userName,
        userEmail,
        couponCode: appliedCoupon?.code,
      });
      if (res && (res.success || res.orderId || res.data?.orderId)) {
        setOrder(res.data || res.order || res);
        setPaymentState("idle");
        setErrorMessage("");
      } else {
        setPaymentState("failed");
        setErrorMessage(res?.message || "Unable to initialize payment. Please try again.");
      }
    } catch (err) {
      setPaymentState("failed");
      setErrorMessage(
        err?.status === 401
          ? "Please verify your account and sign in before starting a payment."
          : (err?.message || "Unable to initialize payment. Please try again.")
      );
    }
  };

  // Automatically evaluate and apply best eligible coupon on checkout mount
  useEffect(() => {
    let isMounted = true;
    const autoApplyBestCoupon = async () => {
      try {
        const base = type === "organization_registration" ? PRICING_CONFIG.INDUSTRY_FEE : PRICING_CONFIG.TALENT_FEE;
        const res = await paymentService.getBestCoupon(type, { baseAmount: base, userEmail, userName });
        if (isMounted && res?.success && res.data) {
          setAppliedCoupon({
            code: res.data.code || res.data.couponCode,
            couponCode: res.data.couponCode || res.data.code,
            discountType: res.data.discountType,
            discountValue: res.data.discountValue,
            discountAmount: res.data.discountAmount,
            finalAmount: res.data.finalAmount,
            description: res.data.description,
          });
        }
      } catch {}
    };
    autoApplyBestCoupon();
    return () => { isMounted = false; };
  }, [type, userEmail, userName]);

  // Initialize Order on mount or dependency changes
  useEffect(() => {
    initOrder();
  }, [type, userName, userEmail, appliedCoupon]);

  // Handle Coupon Application
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    const pkgType = order?.packageType || (PACKAGE_TYPE_MAP && PACKAGE_TYPE_MAP[type]) || type;
    if (!pkgType) {
      setCouponError("Please select a plan before applying a coupon.");
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError("");

    const base = order?.baseAmount || (type === "organization_registration" ? PRICING_CONFIG.INDUSTRY_FEE : PRICING_CONFIG.TALENT_FEE);
    const res = await paymentService.applyCoupon(couponCode, base, pkgType);

    setIsApplyingCoupon(false);
    if (res.success) {
      const payload = res.data || res;
      setAppliedCoupon({
        code: payload.code || payload.couponCode || couponCode.trim().toUpperCase(),
        couponCode: payload.couponCode || payload.code || couponCode.trim().toUpperCase(),
        discountType: payload.discountType || (payload.percent ? "percentage" : "fixed"),
        discountValue: payload.discountValue || payload.percent || payload.flat || 0,
        discountAmount: payload.discountAmount || 0,
        finalAmount: payload.finalAmount || Math.max(0, base - (payload.discountAmount || 0)),
        description: payload.description || payload.message || "",
      });
      setCouponError("");
    } else {
      setAppliedCoupon(null);
      setCouponError(res.message || "Invalid coupon code.");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const handleRetryPayment = async () => {
    setErrorMessage("");
    if (!order) {
      await initOrder();
    } else {
      setPaymentState("idle");
    }
  };

  // Trigger Checkout
  const handlePayNow = async (outcome = "success") => {
    if (!order) {
      await initOrder();
      return;
    }
    setPaymentState("processing");
    setErrorMessage("");

    const mode = order.mode || (isRealMode("payments") ? "razorpay" : "mock");

    // Real Razorpay Mode
    if (mode === "razorpay") {
      try {
        await paymentService.openRazorpayCheckout(
          {
            orderId: order.orderId || order.razorpayOrderId,
            razorpayOrderId: order.razorpayOrderId || order.orderId,
            keyId: order.keyId,
            amount: order.finalAmount || order.amount,
            currency: order.currency || "INR",
            userName,
            userEmail,
            description: order.label || "Vismaya Platform Payment",
            prefill: {
              name: userName,
              email: userEmail,
            },
          },
          {
            onSuccess: (verifyRes) => {
              const tx = verifyRes?.transaction || {};
              const receiptData = verifyRes?.receipt || {
                receiptNumber: tx.invoiceNumber || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                transactionId: tx.paymentId || tx.orderId || order.orderId,
                typeLabel: order.label || "Platform Payment",
                amount: tx.amount || order.finalAmount,
                issuedAt: tx.paidAt || tx.createdAt || new Date().toISOString(),
              };
              setReceipt(receiptData);
              setPaymentState("success");
            },
            onFailure: (err) => {
              setPaymentState("failed");
              const msg =
                err?.status === 400 || err?.statusCode === 400 || err?.response?.status === 400
                  ? "Payment verification failed, please retry or contact support"
                  : (err?.message || "Payment verification failed, please retry or contact support");
              setErrorMessage(msg);
            },
            onDismiss: () => {
              setPaymentState("failed");
              setErrorMessage("Payment was cancelled. You can retry whenever you are ready.");
            },
          }
        );
      } catch (err) {
        setPaymentState("failed");
        const msg =
          err?.status === 400 || err?.statusCode === 400 || err?.response?.status === 400
            ? "Payment verification failed, please retry or contact support"
            : (err?.message || "Failed to initialize payment gateway.");
        setErrorMessage(msg);
      }
      return;
    }

    // Mock Mode: Run existing mock payment flow and call verify with { orderId }
    try {
      const res = await paymentService.confirmPayment(order.orderId, outcome, {
        type: order.type,
        label: order.label,
        amount: order.finalAmount,
        userName,
        userEmail,
        couponCode: appliedCoupon?.code,
      });

      if (res.success) {
        setReceipt(res.receipt);
        setPaymentState("success");
      } else {
        setPaymentState("failed");
        const msg =
          res?.error?.status === 400 || res?.status === 400
            ? "Payment verification failed, please retry or contact support"
            : (res.message || "Payment transaction failed.");
        setErrorMessage(msg);
      }
    } catch (err) {
      setPaymentState("failed");
      const msg =
        err?.status === 400 || err?.statusCode === 400 || err?.response?.status === 400
          ? "Payment verification failed, please retry or contact support"
          : (err.message || "Network error during checkout.");
      setErrorMessage(msg);
    }
  };

  // Derived Amounts
  const baseAmount = order?.baseAmount || (type === "organization_registration" ? PRICING_CONFIG.INDUSTRY_FEE : PRICING_CONFIG.TALENT_FEE);
  const discount = appliedCoupon?.discountAmount || 0;
  const finalAmount = Math.max(0, baseAmount - discount);
  const taxAmount = Math.round((finalAmount * PRICING_CONFIG.GST_RATE_PERCENT) / 100);

  return (
    <div
      className="v-payment-card-root"
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "14px",
        border: "1px solid #E8E2D4",
        padding: "clamp(20px, 4vw, 32px)",
        boxShadow: "0 10px 30px rgba(43, 45, 42, 0.05)",
        maxWidth: "520px",
        width: "100%",
        margin: "0 auto",
        boxSizing: "border-box",
        color: "#2B2D2A",
        fontFamily: 'var(--font-body), "Inter", sans-serif',
      }}
    >
      {/* 1. PROCESSING STATE */}
      {paymentState === "processing" && (
        <div style={{ textAlign: "center", padding: "36px 12px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              border: "3px solid #E8E2D4",
              borderTopColor: "#8A6B2E",
              animation: "v-pay-spin 0.8s linear infinite",
              margin: "0 auto 20px",
            }}
          />
          <h3 style={{ fontSize: "19px", fontWeight: "600", color: "#2B2D2A", margin: "0 0 8px" }}>
            Processing Payment...
          </h3>
          <p style={{ fontSize: "14px", color: "#5A584F", margin: 0, lineHeight: 1.5 }}>
            Connecting to secure gateway. Please do not close or refresh your window.
          </p>
          <style jsx>{`
            @keyframes v-pay-spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      )}

      {/* 2. SUCCESS STATE: DIGITAL RECEIPT */}
      {paymentState === "success" && receipt && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                backgroundColor: "#F3EFE6",
                color: "#8A6B2E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
                border: "2px solid #E8E2D4",
              }}
            >
              <CheckCircle2 size={28} />
            </div>
            <h3 style={{ fontSize: "21px", fontWeight: "600", color: "#2B2D2A", margin: "0 0 6px" }}>
              Payment Confirmed
            </h3>
            <p style={{ fontSize: "13.5px", color: "#5A584F", margin: 0 }}>
              Official Digital Invoice & Confirmation Receipt
            </p>
          </div>

          {/* Receipt Breakdown Card */}
          <div
            style={{
              backgroundColor: "#FAF9F7",
              border: "1px solid #E8E2D4",
              borderRadius: "10px",
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              fontSize: "13.5px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#5A584F" }}>Invoice Number</span>
              <span style={{ fontWeight: "600", color: "#2B2D2A" }}>{receipt.receiptNumber}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#5A584F" }}>Transaction ID</span>
              <span style={{ fontFamily: "monospace", fontSize: "12.5px", color: "#2B2D2A" }}>
                {receipt.transactionId}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#5A584F" }}>Description</span>
              <span style={{ fontWeight: "500", color: "#2B2D2A" }}>{receipt.typeLabel}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#5A584F" }}>Amount Paid</span>
              <span style={{ fontWeight: "700", color: "#8A6B2E", fontSize: "16px" }}>
                ₹{receipt.amount.toLocaleString()}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#5A584F" }}>Date & Time</span>
              <span style={{ color: "#2B2D2A" }}>
                {new Date(receipt.issuedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#5A584F" }}>Status</span>
              <span
                style={{
                  color: "#8A6B2E",
                  fontWeight: "600",
                  backgroundColor: "#F3EFE6",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
              >
                PAID & VERIFIED
              </span>
            </div>
          </div>

          {/* Org bonus credits badge */}
          {type === "organization_registration" && (
            <div
              style={{
                backgroundColor: "#F3EFE6",
                border: "1px solid #E8E2D4",
                borderRadius: "8px",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#8A6B2E",
                fontSize: "13.5px",
                fontWeight: "600",
              }}
            >
              <Sparkles size={18} style={{ flexShrink: 0 }} />
              <span>100 Profile-View Credits have been credited to your studio account!</span>
            </div>
          )}

          {/* Email notice message */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12.5px",
              color: "#5A584F",
              justifyContent: "center",
            }}
          >
            <Mail size={15} style={{ color: "#8A6B2E" }} />
            <span>Digital receipt and tax breakdown sent to {userEmail}</span>
          </div>

          {/* Continue Button */}
          <button
            type="button"
            onClick={() => {
              if (onSuccess) onSuccess(receipt);
            }}
            className="v-pay-btn-primary"
            style={{
              width: "100%",
              height: "44px",
              backgroundColor: "#8A6B2E",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              fontSize: "14.5px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "background 0.2s ease",
            }}
          >
            <span>Continue</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* 3. FAILED / PENDING STATE */}
      {paymentState === "failed" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", textAlign: "center" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              backgroundColor: "#FFF5F5",
              color: "#C53030",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
              border: "2px solid #FEB2B2",
            }}
          >
            <AlertCircle size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#2B2D2A", margin: "0 0 6px" }}>
              Payment Status: Pending
            </h3>
            <p style={{ fontSize: "14px", color: "#5A584F", margin: 0, lineHeight: 1.5 }}>
              {errorMessage || "The transaction could not be authorized. Please retry with your UPI or bank card."}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={handleRetryPayment}
              className="v-pay-btn-primary"
              style={{
                width: "100%",
                height: "44px",
                backgroundColor: "#8A6B2E",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "6px",
                fontSize: "14.5px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <RefreshCw size={15} />
              <span>Retry Payment</span>
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{
                  width: "100%",
                  height: "44px",
                  backgroundColor: "transparent",
                  color: "#5A584F",
                  border: "1px solid #E8E2D4",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <ArrowLeft size={16} />
                <span>Go Back & Edit Registration</span>
              </button>
            )}

            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "14px", marginTop: "4px" }}>
              <Link
                href="/login"
                style={{
                  fontSize: "13px",
                  color: "#8A6B2E",
                  textDecoration: "underline",
                  fontWeight: "600",
                }}
              >
                Sign In to Account
              </Link>
              <span style={{ color: "#D1C9B8" }}>•</span>
              <Link
                href="/support"
                style={{
                  fontSize: "13px",
                  color: "#8A6B2E",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <HelpCircle size={14} />
                <span>Contact Support</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4. IDLE / READY CHECKOUT FORM */}
      {paymentState === "idle" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          {/* Header */}
          <div style={{ borderBottom: "1px solid #E8E2D4", paddingBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <ShieldCheck size={18} style={{ color: "#8A6B2E" }} />
              <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#8A6B2E", fontWeight: "600" }}>
                Secure One-Time Checkout
              </span>
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: "600", margin: 0, color: "#2B2D2A", fontFamily: 'var(--font-heading), Georgia, serif' }}>
              {order?.label || (type === "organization_registration" ? "Organization Registration" : "Talent Registration")}
            </h2>
          </div>

          {/* Order Summary Breakdown Card */}
          <div
            style={{
              backgroundColor: "#FAF9F7",
              border: "1px solid #E8E2D4",
              borderRadius: "10px",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
              <span style={{ color: "#5A584F" }}>Original Package Price</span>
              <span style={{ fontWeight: "600", color: "#2B2D2A" }}>₹{baseAmount.toLocaleString()}</span>
            </div>

            {appliedCoupon && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#8A6B2E" }}>
                <span>
                  Coupon Applied ({appliedCoupon.code || appliedCoupon.couponCode})
                  {appliedCoupon.discountValue ? (
                    <span style={{ fontSize: "12px", marginLeft: "4px", color: "#8A6B2E", fontWeight: "500" }}>
                      ({appliedCoupon.discountType === "percentage" ? `${appliedCoupon.discountValue}% off` : `₹${appliedCoupon.discountValue} off`})
                    </span>
                  ) : null}
                </span>
                <span style={{ fontWeight: "600" }}>-₹{discount.toLocaleString()}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#5A584F" }}>
              <span>Applicable GST (18%)</span>
              <span>₹{taxAmount.toLocaleString()} (Included in price)</span>
            </div>

            <div
              style={{
                borderTop: "1px solid #E8E2D4",
                paddingTop: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#2B2D2A" }}>Final Payable Amount</span>
                <div style={{ fontSize: "11px", color: "#5A584F" }}>One-time payment • No auto-renewal</div>
              </div>
              <span
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#8A6B2E",
                  fontFamily: 'var(--font-heading), Georgia, serif',
                }}
              >
                ₹{finalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Coupon Input Form */}
          {appliedCoupon && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#F3EFE6",
                border: "1px solid #E8E2D4",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "13px",
                color: "#8A6B2E",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={16} style={{ color: "#8A6B2E", flexShrink: 0 }} />
                <span>
                  Automatic Discount Applied: <strong>{appliedCoupon.code}</strong> ({appliedCoupon.description || `${appliedCoupon.discountValue}${appliedCoupon.discountType === "percentage" ? "%" : "₹"} Off`})
                </span>
              </div>
            </div>
          )}

          {couponError && (
            <div style={{ fontSize: "12.5px", color: "#C53030", marginTop: "-14px" }}>
              {couponError}
            </div>
          )}

          {/* Payment Methods Note */}
          <div
            style={{
              backgroundColor: "#FAF9F7",
              border: "1px solid #E8E2D4",
              borderRadius: "8px",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <CreditCard size={20} style={{ color: "#8A6B2E", flexShrink: 0 }} />
            <div style={{ fontSize: "12.5px", color: "#5A584F", lineHeight: 1.4 }}>
              Accepted Payment Methods: <strong style={{ color: "#2B2D2A" }}>UPI, Cards, Net banking, Wallets</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              type="button"
              onClick={() => handlePayNow("success")}
              className="v-pay-btn-primary"
              style={{
                width: "100%",
                height: "44px",
                backgroundColor: "#8A6B2E",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "6px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 2px 8px rgba(138, 107, 46, 0.2)",
              }}
            >
              <Lock size={15} />
              <span>Pay ₹{finalAmount.toLocaleString()}</span>
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{
                  background: "none",
                  border: "none",
                  color: "#5A584F",
                  fontSize: "13px",
                  cursor: "pointer",
                  padding: "6px",
                }}
              >
                Cancel & Return
              </button>
            )}
          </div>

          {/* Security Disclaimer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              fontSize: "11.5px",
              color: "#5A584F",
              textAlign: "center",
            }}
          >
            <ShieldCheck size={14} style={{ color: "#8A6B2E" }} />
            <span>We do not store your card details. End-to-end 256-bit encrypted.</span>
          </div>
        </div>
      )}
    </div>
  );
}
