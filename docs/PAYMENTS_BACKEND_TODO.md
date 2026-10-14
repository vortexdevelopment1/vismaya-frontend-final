# Payments & Credits Backend Integration Guide & TODO

This document details the required backend API endpoints for integrating the Vismaya payment and credit ledger systems with a real payment gateway (Razorpay / Cashfree) and database.

---

## 1. Overview of Platform Pricing Rules
- **Talent Registration**: ₹999 one-time. Grants verified comp-card, application submission rights, and audition pipeline access. No recurring subscription.
- **Organization Registration**: ₹4,999 one-time. Grants studio posting privileges and includes **100 initial profile-view credits**.
- **Credit Purchases**:
  - Single Profile View: ₹100
  - 25 Profile Views Bundle: ₹2,000 (₹80/view)
- **Credit Consumption**:
  - Unlocking a full candidate profile (video audition, contact, comp-card): **1 credit**.
  - **7-day repeat view**: Free re-access within 7 days of initial unlock.
  - Search and limited card previews: **100% Free**.

---

## 2. Required Backend Endpoints

### 2.1 Order Creation
`POST /api/payments/create-order`
- **Request Payload**:
  ```json
  {
    "type": "talent_registration | organization_registration | bundle_views | single_view",
    "couponCode": "OPTIONAL_STRING"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "orderId": "order_rzp_12345",
    "amount": 999,
    "currency": "INR",
    "keyId": "rzp_live_xxx"
  }
  ```

### 2.2 Payment Verification & Webhook
`POST /api/payments/verify`
- **Request Payload**:
  ```json
  {
    "orderId": "order_rzp_12345",
    "paymentId": "pay_293849",
    "signature": "razorpay_signature_hash",
    "type": "talent_registration | organization_registration | bundle_views | single_view"
  }
  ```
- **Backend Actions**:
  1. Verify cryptographic HMAC SHA256 signature using Razorpay Secret.
  2. Mark user payment status as active.
  3. If organization: credit 100 or purchased views to organization ledger.
  4. Generate and email digital GST tax invoice.

### 2.3 Coupon Validation
`POST /api/payments/apply-coupon`
- **Request Payload**:
  ```json
  {
    "code": "VISMAYA10",
    "baseAmount": 999
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "code": "VISMAYA10",
    "discountAmount": 100,
    "finalAmount": 899
  }
  ```

### 2.4 Organization Credit Balance & Ledger
`GET /api/credits/balance`
- Returns current available balance, included credits, purchased credits, and consumed credits.

`POST /api/credits/view-talent`
- **Request**: `{ "talentId": "tal-904" }`
- **Actions**:
  - Checks if unlocked within last 7 days. If yes, returns `{ "free": true }`.
  - If not, decrements 1 credit, logs transaction in credit ledger table, and returns `{ "deducted": 1, "remainingBalance": 99 }`.

### 2.5 Admin Console Endpoints
- `GET /api/admin/payments/transactions`: Returns list of all user payments, statuses, and invoices.
- `GET /api/admin/credits/ledger`: Returns studio-wise balances and platform credit movements.
- `POST /api/admin/credits/adjust`: Allows admin to manually credit/debit views with an audit note.
