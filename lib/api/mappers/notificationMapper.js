/**
 * Notification Entity Mapper
 */

function safeIsoDate(val, fallback = null) {
  if (!val) return fallback;
  const d = new Date(val);
  return !isNaN(d.getTime()) ? d.toISOString() : (typeof val === "string" ? val : fallback);
}

export function fromApi(notif) {
  if (!notif) return null;

  const id = notif._id ? String(notif._id) : (notif.id ? String(notif.id) : "");
  const recipient = notif.recipient ? String(notif.recipient) : "";
  const isRead = Boolean(notif.isRead || notif.read);

  // Compute navigation link based on referenceType
  let link = "/talent/dashboard";
  if (notif.referenceType === "Opportunity") {
    link = `/opportunities/${notif.referenceId || ""}`;
  } else if (notif.referenceType === "Application") {
    link = "/talent/applications";
  } else if (notif.referenceType === "Audition") {
    link = "/talent/auditions";
  }

  return {
    id,
    _id: id,
    recipient,
    type: notif.type || "system",
    title: notif.title || "Notification",
    message: notif.message || "",
    referenceId: notif.referenceId ? String(notif.referenceId) : null,
    referenceType: notif.referenceType || "System",
    isRead,
    read: isRead,
    link: notif.actionHref || link,
    badge: notif.badge,
    time: notif.time,
    readAt: safeIsoDate(notif.readAt, null),
    createdAt: safeIsoDate(notif.createdAt || notif.time, new Date().toISOString()),
  };
}

export function toApi(notif) {
  if (!notif) return {};

  return {
    recipient: notif.recipient,
    type: notif.type || "system",
    title: notif.title?.trim(),
    message: notif.message?.trim(),
    referenceId: notif.referenceId,
    referenceType: notif.referenceType || "System",
    isRead: Boolean(notif.isRead || notif.read),
  };
}

export default {
  fromApi,
  toApi,
};
