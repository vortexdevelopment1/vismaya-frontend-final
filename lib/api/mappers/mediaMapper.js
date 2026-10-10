/**
 * Media Entity Mapper
 */

import { toFrontendStatus, toBackendStatus } from "../statusMapper.js";

export function fromApi(media) {
  if (!media) return null;

  const id = media._id ? String(media._id) : (media.id ? String(media.id) : "");
  const owner = media.owner ? (typeof media.owner === "object" ? String(media.owner._id || media.owner.id) : String(media.owner)) : "";

  return {
    id,
    _id: id,
    owner,
    userId: owner,
    type: media.mediaType || "photo",
    mediaType: media.mediaType || "photo",
    category: media.category || "other",
    title: media.title || "",
    description: media.description || "",
    url: media.url || "",
    thumbnailUrl: media.thumbnailUrl || media.url || "",
    thumbnail: media.thumbnailUrl || media.url || "",
    mimeType: media.mimeType || "",
    fileSizeBytes: media.fileSizeBytes || null,
    durationSeconds: media.durationSeconds || null,
    displayOrder: media.displayOrder || 0,
    visibility: media.visibility || "public",
    isMainProfilePhoto: Boolean(media.isMainProfilePhoto),
    isMain: Boolean(media.isMainProfilePhoto),
    moderationState: toFrontendStatus("media", media.moderationState || "live"),
    rawModerationState: media.moderationState || "live",
    moderationNotes: media.moderationNotes || "",
    createdAt: media.createdAt ? new Date(media.createdAt).toISOString() : new Date().toISOString(),
  };
}

export function toApi(media) {
  if (!media) return {};

  const payload = {
    mediaType: media.mediaType || media.type || "photo",
    category: media.category || "other",
    title: media.title?.trim(),
    description: media.description?.trim(),
    url: media.url?.trim(),
    thumbnailUrl: media.thumbnailUrl || media.thumbnail,
    mimeType: media.mimeType,
    fileSizeBytes: media.fileSizeBytes,
    durationSeconds: media.durationSeconds,
    displayOrder: media.displayOrder || 0,
    visibility: media.visibility || "public",
    isMainProfilePhoto: Boolean(media.isMainProfilePhoto || media.isMain),
  };

  if (media.rightsConfirmed !== undefined) {
    payload.rightsConfirmed = Boolean(media.rightsConfirmed);
  }
  if (media.isHeadshot !== undefined) {
    payload.isHeadshot = Boolean(media.isHeadshot);
  }

  if (media.moderationState) {

    payload.moderationState = toBackendStatus("media", media.moderationState);
  }

  return payload;
}

export default {
  fromApi,
  toApi,
};
