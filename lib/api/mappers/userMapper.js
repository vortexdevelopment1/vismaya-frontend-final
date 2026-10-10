/**
 * User Entity Mapper
 */

import { toFrontendRole, toBackendRole } from "../roles.js";
import { toFrontendStatus, toBackendStatus } from "../statusMapper.js";

export function fromApi(user) {
  if (!user) return null;

  const id = user._id ? String(user._id) : (user.id ? String(user.id) : "");
  
  return {
    id,
    _id: id,
    name: user.name || "",
    email: user.email || "",
    mobile: user.mobile || "",
    role: toFrontendRole(user.role),
    status: toFrontendStatus("user", user.status || "active"),
    rawStatus: user.status || "active",
    isPaid: Boolean(user.isPaid),
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
    updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : null,
  };
}

export function toApi(user) {
  if (!user) return {};

  const payload = {
    name: user.name?.trim(),
    email: user.email?.trim()?.toLowerCase(),
    mobile: user.mobile?.trim(),
    role: toBackendRole(user.role),
  };

  if (user.password) {
    payload.password = user.password;
  }

  if (user.status) {
    payload.status = toBackendStatus("user", user.status);
  }

  if (user.isPaid !== undefined) {
    payload.isPaid = Boolean(user.isPaid);
  }

  return payload;
}

export default {
  fromApi,
  toApi,
};
