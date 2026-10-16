/**
 * Payment Entity Mapper
 */

import { toFrontendStatus, toBackendStatus } from "../statusMapper.js";

export function fromApi(payment) {
  if (!payment) return null;

  const id = payment._id ? String(payment._id) : (payment.id ? String(payment.id) : "");
  const userObj = payment.userId && typeof payment.userId === "object" ? payment.userId : null;
  const userId = userObj ? String(userObj._id || userObj.id) : (payment.userId ? String(payment.userId) : "");

  return {
    id,
    _id: id,
    userId,
    userName: userObj?.name || payment.userName || "",
    userEmail: userObj?.email || payment.userEmail || "",
    orgId: payment.organizationId ? String(payment.organizationId) : "",
    packageType: payment.packageType || "talent_annual_999",
    amount: Number(payment.amount) || 0,
    amountINR: Number(payment.amount) || 0,
    currency: payment.currency || "INR",
    orderId: payment.orderId || "",
    paymentId: payment.paymentId || "",
    status: toFrontendStatus("payment", payment.status || "created"),
    rawStatus: payment.status || "created",
    paymentGateway: payment.paymentGateway || "razorpay",
    creditsAwarded: Number(payment.creditsAwarded) || 0,
    invoiceNumber: payment.invoiceNumber || "",
    paidAt: payment.paidAt ? new Date(payment.paidAt).toISOString() : null,
    createdAt: payment.createdAt ? new Date(payment.createdAt).toISOString() : new Date().toISOString(),
  };
}

export function toApi(payment) {
  if (!payment) return {};

  const payload = {
    packageType: payment.packageType,
    amount: Number(payment.amount),
    currency: payment.currency || "INR",
    orderId: payment.orderId,
    paymentId: payment.paymentId,
    signature: payment.signature,
  };

  if (payment.status) {
    payload.status = toBackendStatus("payment", payment.status);
  }

  return payload;
}

export default {
  fromApi,
  toApi,
};
