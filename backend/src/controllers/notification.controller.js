const Notification = require("../models/notification.model");

const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { unreadOnly, page = 1, limit = 20 } = req.query;

        const filter = { recipient: userId };
        if (unreadOnly === "true") {
            filter.isRead = false;
        }

        const pageNum = parseInt(page, 10) || 1;
        const limitNum = Math.min(parseInt(limit, 10) || 20, 50);
        const skip = (pageNum - 1) * limitNum;

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Notification.countDocuments(filter),
            Notification.countDocuments({ recipient: userId, isRead: false })
        ]);

        res.status(200).json({
            success: true,
            count: notifications.length,
            total,
            unreadCount,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            notifications
        });

    } catch (error) {
        console.error("Get my notifications error:", error);

        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching notifications"
        });
    }
};

const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.userId;

        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isRead: false
        });

        res.status(200).json({
            success: true,
            unreadCount
        });

    } catch (error) {
        console.error("Get unread count error:", error);

        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching unread count"
        });
    }
};

const markNotificationAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { notificationId } = req.params;

        const notification = await Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        if (notification.recipient.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own notifications"
            });
        }

        notification.isRead = true;
        notification.readAt = new Date();

        await notification.save();

        res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification
        });

    } catch (error) {
        console.error("Mark notification read error:", error);

        res.status(500).json({
            success: false,
            message: "Something went wrong while updating notification"
        });
    }
};

const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;

        await Notification.updateMany(
            { recipient: userId, isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
        );

        res.status(200).json({
            success: true,
            message: "All notifications marked as read"
        });

    } catch (error) {
        console.error("Mark all notifications read error:", error);

        res.status(500).json({
            success: false,
            message: "Something went wrong while updating notifications"
        });
    }
};

module.exports = {
    getMyNotifications,
    getUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead
};
