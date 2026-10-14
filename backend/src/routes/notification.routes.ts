import express, { Router, Request, Response, NextFunction } from "express";

import { 
    authenticateUser
 } from "../middleware/auth.middleware.js";

import { 
    getMyNotifications,
    getUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead
 } from "../controllers/notification.controller.js";

const router = express.Router();

router.get(
    "/",
    authenticateUser,
    getMyNotifications
);

router.get(
    "/unread-count",
    authenticateUser,
    getUnreadCount
);

router.patch(
    "/:notificationId/read",
    authenticateUser,
    markNotificationAsRead
);

router.patch(
    "/read-all",
    authenticateUser,
    markAllNotificationsAsRead
);

export default router;
