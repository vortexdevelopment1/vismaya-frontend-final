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

  return {
    id,
    _id: id,
    title: b.title || "Untitled Broadcast",
    message: b.message || "",
    targetAudience: b.targetAudience || b.audience || "all",
    channels: Array.isArray(b.channels) ? b.channels : (b.channel ? [b.channel] : ["in_app"]),
    priority: b.priority || "normal",
    status: toFrontendStatus("broadcast", b.status || "draft"),
    rawStatus: b.status || "draft",
    scheduledAt: safeIsoDate(b.scheduledAt, null),
    sentAt: safeIsoDate(b.sentAt, typeof b.sentAt === "string" ? b.sentAt : null),
    stats: {
      reachCount: Number(b.stats?.reachCount || b.recipientsCount) || 0,
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
