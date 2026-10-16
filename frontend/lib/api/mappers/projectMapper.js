/**
 * Project Entity Mapper
 */

import { toFrontendStatus, toBackendStatus } from "../statusMapper.js";

export function fromApi(project) {
  if (!project) return null;

  const id = project._id ? String(project._id) : (project.id ? String(project.id) : "");
  const orgIdObj = project.organizationId && typeof project.organizationId === "object" ? project.organizationId : null;
  const orgId = orgIdObj ? String(orgIdObj._id || orgIdObj.id) : (project.organizationId ? String(project.organizationId) : (project.orgId ? String(project.orgId) : ""));

  return {
    id,
    _id: id,
    orgId,
    organizationId: orgId,
    title: project.projectName || project.title || "Untitled Project",
    projectName: project.projectName || project.title || "Untitled Project",
    type: project.projectType || project.type || "Feature Film",
    projectType: project.projectType || project.type || "Feature Film",
    description: project.description || "",
    status: toFrontendStatus("project", project.status || "active"),
    rawStatus: project.status || "active",
    createdAt: project.createdAt ? new Date(project.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: project.updatedAt ? new Date(project.updatedAt).toISOString() : null,
  };
}

export function toApi(project) {
  if (!project) return {};

  const payload = {
    projectName: project.projectName?.trim() || project.title?.trim(),
    projectType: project.projectType?.trim() || project.type?.trim(),
    description: project.description?.trim(),
  };

  if (project.organizationId || project.orgId) {
    payload.organizationId = project.organizationId || project.orgId;
  }

  if (project.status) {
    payload.status = toBackendStatus("project", project.status);
  }

  return payload;
}

export default {
  fromApi,
  toApi,
};
