/**
 * Media Entity Mapper
 */

import { toFrontendStatus, toBackendStatus } from "../statusMapper.js";

function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return "2.5 MB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fromApi(media) {
  if (!media) return null;

  const id = media._id ? String(media._id) : (media.id ? String(media.id) : "");
  const owner = media.owner ? (typeof media.owner === "object" ? String(media.owner._id || media.owner.id) : String(media.owner)) : "";

  // Normalize display type
  let type = "Headshot";
  const cat = (media.category || "").toLowerCase();
  const mType = (media.mediaType || media.type || "").toLowerCase();

  if (cat === "headshot") type = "Headshot";
  else if (cat === "full_body") type = "Full Body";
  else if (cat === "showreel") type = "Showreel";
  else if (cat === "audition") type = "Audition Clip";
  else if (mType === "video") type = "Showreel";
  else if (media.type) type = media.type;

  // Normalize moderation status
  const rawMod = (media.moderationState || media.status || "pending").toLowerCase();
  let status = "Pending";
  if (rawMod === "live" || rawMod === "approved") {
    status = "Approved";
  } else if (rawMod === "rejected" || rawMod === "flagged") {
    status = "Rejected";
  } else if (rawMod === "pending" || rawMod === "in_review") {
    status = "Pending";
  } else if (media.status) {
    status = media.status;
  }

  const createdIso = media.createdAt ? new Date(media.createdAt).toISOString() : new Date().toISOString();
  const displayDate = createdIso.split("T")[0];

  return {
    id,
    _id: id,
    owner,
    userId: owner,
    type,
    mediaType: media.mediaType || (type === "Showreel" || type === "Audition Clip" ? "video" : "photo"),
    category: media.category || (type === "Headshot" ? "headshot" : type === "Full Body" ? "full_body" : type === "Showreel" ? "showreel" : type === "Audition Clip" ? "audition" : "other"),
    title: media.title || "Untitled Media",
    description: media.description || "",
    url: media.url || "",
    thumbnailUrl: media.thumbnailUrl || media.url || "",
    thumbnail: media.thumbnailUrl || media.url || "",
    mimeType: media.mimeType || "",
    fileSizeBytes: media.fileSizeBytes || null,
    fileSize: media.fileSize || formatFileSize(media.fileSizeBytes),
    durationSeconds: media.durationSeconds || null,
    duration: media.duration || (media.durationSeconds ? `${Math.floor(media.durationSeconds / 60)}:${String(media.durationSeconds % 60).padStart(2, "0")}` : undefined),
    displayOrder: media.displayOrder || 0,
    visibility: media.visibility || "public",
    isMainProfilePhoto: Boolean(media.isMainProfilePhoto),
    isMain: Boolean(media.isMainProfilePhoto),
    status,
    moderationState: toFrontendStatus("media", media.moderationState || "live"),
    rawModerationState: media.moderationState || "live",
    moderationNotes: media.moderationNotes || media.reason || "",
    reason: media.moderationNotes || media.reason || "",
    createdAt: createdIso,
    date: media.date || displayDate,
  };
}

export function toApi(media) {
  if (!media) return {};

  let cat = media.category || "other";
  if (media.type === "Headshot" && !media.category) cat = "headshot";
  else if (media.type === "Full Body" && !media.category) cat = "full_body";
  else if (media.type === "Showreel" && !media.category) cat = "showreel";
  else if (media.type === "Audition Clip" && !media.category) cat = "audition";

  const payload = {
    mediaType: media.mediaType || (media.type === "Showreel" || media.type === "Audition Clip" ? "video" : "photo"),
    category: cat,
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
