const express = require("express");

const {
    authenticateUser
} = require("../middleware/auth.middleware");

const {
    getMyNotifications,
    getUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead
} = require("../controllers/notification.controller");

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

module.exports = router;
