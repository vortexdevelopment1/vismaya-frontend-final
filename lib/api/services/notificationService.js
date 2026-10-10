/**
 * Notifications API Service
 * Handles user notifications fetching, unread counters, and mark-read operations.
 */

import { apiClient } from "../client.js";
import { isRealMode } from "../config.js";
import { mapNotification } from "../mappers/index.js";
import { initialNotifications } from "../../talent/mockData.js";
import { mockNotifications } from "./mockSeedData.js";

export const notificationService = {
  /**
   * Fetch notifications for authenticated user
   */
  async getMyNotifications() {
    if (!isRealMode("notifications")) {
      return {
        success: true,
        data: initialNotifications.map(mapNotification),
      };
    }

    const res = await apiClient.get("/api/notifications");
    const docs = Array.isArray(res?.notifications) ? res.notifications : Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    return {
      success: true,
      data: docs.map(mapNotification),
      unreadCount: res?.unreadCount,
      total: res?.total,
    };
  },

  /**
   * Alias for getMyNotifications
   */
  async getNotifications() {
    return this.getMyNotifications();
  },


  /**
   * Get unread notifications count
   */
  async getUnreadCount() {
    if (!isRealMode("notifications")) {
      const count = initialNotifications.filter((n) => !n.read && !n.isRead).length;
      return {
        success: true,
        count,
      };
    }

    const res = await apiClient.get("/api/notifications/unread-count");
    return {
      success: true,
      count: res?.count ?? res?.data?.count ?? 0,
    };
  },

  /**
   * Mark a single notification as read
   * @param {string} notificationId
   */
  async markAsRead(notificationId) {
    if (!isRealMode("notifications")) {
      return {
        success: true,
        data: mapNotification({ id: notificationId, read: true }),
      };
    }

    const res = await apiClient.patch(`/api/notifications/${notificationId}/read`);
    const doc = res?.data || res;
    return {
      success: true,
      data: doc ? mapNotification(doc) : null,
    };
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    if (!isRealMode("notifications")) {
      return {
        success: true,
        message: "All notifications marked as read (Mock)",
      };
    }

    const res = await apiClient.patch("/api/notifications/read-all");
    return {
      success: true,
      data: res?.data || res,
    };
  },
};
