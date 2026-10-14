/**
 * Vismaya Status Mapper
 * 
 * Bidirectional mapping between backend enum values and frontend UI labels/states.
 * Enum values are verified directly from Mongoose models.
 */

// 1. Opportunity Statuses
export const OPPORTUNITY_STATUS_MAP = {
  // Backend -> Frontend
  pending: "Pending Review",
  under_vismaya_review: "Under Review",
  corrections_requested: "Corrections Requested",
  published: "Published",
  rejected: "Rejected",
  cancellation_requested: "Cancellation Requested",
  cancelled: "Cancelled",
  closed: "Closed",
  completed: "Completed",
  draft: "Draft",
};

export const OPPORTUNITY_BACKEND_STATUS_MAP = {
  // Frontend -> Backend
  "pending review": "pending",
  pending: "pending",
  "under review": "under_vismaya_review",
  "under vismaya review": "under_vismaya_review",
  under_vismaya_review: "under_vismaya_review",
  "corrections requested": "corrections_requested",
  corrections_requested: "corrections_requested",
  published: "published",
  active: "published",
  rejected: "rejected",
  "cancellation requested": "cancellation_requested",
  cancellation_requested: "cancellation_requested",
  cancelled: "cancelled",
  canceled: "cancelled",
  closed: "closed",
  completed: "completed",
  draft: "pending",
};

// 2. Application Statuses
export const APPLICATION_STATUS_MAP = {
  applied: "Applied",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  selected: "Selected",
  not_selected: "Not Selected",
  withdrawn: "Withdrawn",
};

export const APPLICATION_BACKEND_STATUS_MAP = {
  applied: "applied",
  "under review": "under_review",
  under_review: "under_review",
  shortlisted: "shortlisted",
  selected: "selected",
  "not selected": "not_selected",
  not_selected: "not_selected",
  rejected: "not_selected",
  withdrawn: "withdrawn",
};

// 3. Audition Statuses (includes Target relay contracts)
export const AUDITION_STATUS_MAP = {
  requested: "Audition Requested",
  scheduled: "Audition Scheduled",
  submitted: "Submitted",
  reviewed: "Reviewed",
  completed: "Completed",
  cancelled: "Cancelled",
  // CONTRACT-PENDING: Admin relay workflow statuses
  relayed_to_talent: "Relayed to Talent",
  self_tape_received: "Self-Tape Received",
  forwarded_to_org: "Forwarded to Org",
};

export const AUDITION_BACKEND_STATUS_MAP = {
  requested: "requested",
  "audition requested": "requested",
  scheduled: "scheduled",
  "audition scheduled": "scheduled",
  submitted: "submitted",
  "self tape received": "self_tape_received",
  self_tape_received: "self_tape_received",
  reviewed: "reviewed",
  "forwarded to org": "forwarded_to_org",
  forwarded_to_org: "forwarded_to_org",
  "relayed to talent": "relayed_to_talent",
  relayed_to_talent: "relayed_to_talent",
  completed: "completed",
  cancelled: "cancelled",
  canceled: "cancelled",
};

// 4. Verification Statuses
export const VERIFICATION_STATUS_MAP = {
  pending: "Pending",
  verified: "Verified",
  rejected: "Rejected",
  suspended: "Suspended",
};

export const VERIFICATION_BACKEND_STATUS_MAP = {
  pending: "pending",
  verified: "verified",
  approved: "verified", // normalize "Approved" in UI to backend "verified"
  rejected: "rejected",
  suspended: "suspended",
};

// 5. Media Moderation Statuses
export const MEDIA_STATUS_MAP = {
  uploaded: "Uploaded",
  automated_check: "Automated Check",
  live: "Live",
  restricted: "Restricted",
  admin_review: "Admin Review",
  removed: "Removed",
};

export const MEDIA_BACKEND_STATUS_MAP = {
  uploaded: "uploaded",
  "automated check": "automated_check",
  automated_check: "automated_check",
  live: "live",
  active: "live",
  restricted: "restricted",
  "admin review": "admin_review",
  admin_review: "admin_review",
  removed: "removed",
};

// 6. Payment Statuses
export const PAYMENT_STATUS_MAP = {
  created: "Created",
  attempted: "Attempted",
  successful: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

export const PAYMENT_BACKEND_STATUS_MAP = {
  created: "created",
  attempted: "attempted",
  successful: "successful",
  paid: "successful",
  failed: "failed",
  refunded: "refunded",
  unpaid: "created",
};

// 7. User Account Statuses
export const USER_STATUS_MAP = {
  pending: "Pending",
  active: "Active",
  restricted: "Restricted",
  suspended: "Suspended",
  rejected: "Rejected",
  banned: "Banned",
  deletion_requested: "Deletion Requested",
  deleted: "Deleted",
};

export const USER_BACKEND_STATUS_MAP = {
  pending: "pending",
  active: "active",
  approved: "active",
  restricted: "restricted",
  suspended: "suspended",
  rejected: "rejected",
  banned: "banned",
  "deletion requested": "deletion_requested",
  deletion_requested: "deletion_requested",
  deleted: "deleted",
};

// 8. Project Statuses
export const PROJECT_STATUS_MAP = {
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PROJECT_BACKEND_STATUS_MAP = {
  active: "active",
  completed: "completed",
  cancelled: "cancelled",
  canceled: "cancelled",
};

// 9. Broadcast Statuses
export const BROADCAST_STATUS_MAP = {
  draft: "Draft",
  scheduled: "Scheduled",
  sent: "Sent",
  cancelled: "Cancelled",
  failed: "Failed",
};

export const BROADCAST_BACKEND_STATUS_MAP = {
  draft: "draft",
  scheduled: "scheduled",
  sent: "sent",
  cancelled: "cancelled",
  canceled: "cancelled",
  failed: "failed",
};

// 10. Success Story Statuses
export const SUCCESS_STORY_STATUS_MAP = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  archived: "Archived",
};

export const SUCCESS_STORY_BACKEND_STATUS_MAP = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
  archived: "archived",
};

const ENTITY_FORWARD_MAPS = {
  opportunity: OPPORTUNITY_STATUS_MAP,
  application: APPLICATION_STATUS_MAP,
  audition: AUDITION_STATUS_MAP,
  verification: VERIFICATION_STATUS_MAP,
  media: MEDIA_STATUS_MAP,
  payment: PAYMENT_STATUS_MAP,
  user: USER_STATUS_MAP,
  project: PROJECT_STATUS_MAP,
  broadcast: BROADCAST_STATUS_MAP,
  successStory: SUCCESS_STORY_STATUS_MAP,
};

const ENTITY_BACKWARD_MAPS = {
  opportunity: OPPORTUNITY_BACKEND_STATUS_MAP,
  application: APPLICATION_BACKEND_STATUS_MAP,
  audition: AUDITION_BACKEND_STATUS_MAP,
  verification: VERIFICATION_BACKEND_STATUS_MAP,
  media: MEDIA_BACKEND_STATUS_MAP,
  payment: PAYMENT_BACKEND_STATUS_MAP,
  user: USER_BACKEND_STATUS_MAP,
  project: PROJECT_BACKEND_STATUS_MAP,
  broadcast: BROADCAST_BACKEND_STATUS_MAP,
  successStory: SUCCESS_STORY_BACKEND_STATUS_MAP,
};

/**
 * Convert backend status value to human-readable frontend label.
 * Falls back safely to formatted string if unrecognized.
 *
 * @param {string} entityType - e.g. "opportunity", "application", "audition", "verification", "user", "project", "media", "payment"
 * @param {string} backendStatus - e.g. "under_vismaya_review"
 * @returns {string} e.g. "Under Review"
 */
export function toFrontendStatus(entityType, backendStatus) {
  if (!backendStatus) return "";
  const map = ENTITY_FORWARD_MAPS[entityType];
  const key = String(backendStatus).toLowerCase().trim();
  if (map && map[key]) {
    return map[key];
  }
  // Safe fallback: format snake_case or raw string
  return String(backendStatus)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Convert frontend label to backend enum value.
 * Falls back to lowercase snake_case string.
 *
 * @param {string} entityType - e.g. "opportunity", "application", "audition", "verification", "user"
 * @param {string} frontendStatus - e.g. "Under Review"
 * @returns {string} e.g. "under_vismaya_review"
 */
export function toBackendStatus(entityType, frontendStatus) {
  if (!frontendStatus) return "";
  const map = ENTITY_BACKWARD_MAPS[entityType];
  const key = String(frontendStatus).toLowerCase().trim();
  if (map && map[key]) {
    return map[key];
  }
  return key.replace(/\s+/g, "_");
}
