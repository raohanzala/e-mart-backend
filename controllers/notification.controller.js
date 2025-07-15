import notificationModel from '../models/notification.model.js';

// Create a new notification
const createNotification = async (type, title, message, data = {}) => {
  try {
    const notification = new notificationModel({
      type,
      title,
      message,
      data
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Get all notifications
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, unreadOnly = false } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      notificationModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      notificationModel.countDocuments(query)
    ]);

    const unreadCount = await notificationModel.countDocuments({ isRead: false });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        },
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.json({
      success: false,
      message: error.message
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await notificationModel.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.json({
      success: false,
      message: error.message
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    await notificationModel.updateMany(
      { isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.json({
      success: false,
      message: error.message
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await notificationModel.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.json({
      success: false,
      message: error.message
    });
  }
};

export {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
}; 