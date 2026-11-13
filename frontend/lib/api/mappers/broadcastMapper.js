/**
 * Broadcast Entity Mapper (Target Contract)
 * 
 * CONTRACT-PENDING: Backend broadcast model & API endpoints
 */

import { toFrontendStatus, toBackendStatus } from "../statusMapper.js";

function safeIsoDate(val, fallback = null) {
  if (!val) return fallback;
  const d = new Date(val);
  return !isNaN(d.getTime()) ? d.toISOString() : (typeof val === "string" ? val : fallback);
}

export function fromApi(b) {
  if (!b) return null;

  const id = b._id ? String(b._id) : (b.id ? String(b.id) : "");
  const reach = Number(b.deliveredCount ?? b.recipientsCount ?? b.stats?.reachCount ?? 0);

  return {
    id,
    _id: id,
    title: b.title || "Untitled Broadcast",
    message: b.message || "",
    audience: b.audience || b.targetAudience || "All users",
    targetAudience: b.targetAudience || b.audience || "All users",
    channels: Array.isArray(b.channels) ? b.channels : (b.channel ? [b.channel] : ["in_app"]),
    priority: b.priority || "normal",
    status: toFrontendStatus("broadcast", b.status || "sent") || (b.status || "Sent"),
    rawStatus: b.status || "sent",
    scheduledFor: safeIsoDate(b.scheduledFor || b.scheduledAt, null),
    scheduledAt: safeIsoDate(b.scheduledAt || b.scheduledFor, null),
    sentAt: safeIsoDate(b.sentAt, typeof b.sentAt === "string" ? b.sentAt : null),
    deliveredCount: reach,
    recipientsCount: reach,
    stats: {
      reachCount: reach,
      readCount: Number(b.stats?.readCount) || 0,
    },
    createdAt: safeIsoDate(b.createdAt, new Date().toISOString()),
  };
}

export function toApi(b) {
  if (!b) return {};

  const payload = {
    title: b.title?.trim(),
    message: b.message?.trim(),
    targetAudience: b.targetAudience || "all",
    channels: Array.isArray(b.channels) ? b.channels : ["in_app"],
    priority: b.priority || "normal",
  };

  if (b.scheduledAt) {
    payload.scheduledAt = new Date(b.scheduledAt).toISOString();
  }

  if (b.status) {
    payload.status = toBackendStatus("broadcast", b.status);
  }

  return payload;
}

export default {
  fromApi,
  toApi,
};
