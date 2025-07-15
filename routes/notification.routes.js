import express from 'express';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../controllers/notification.controller.js';
import adminAuth from '../middleware/adminAuth.js';

const notificationRouter = express.Router();

// Get all notifications with pagination
notificationRouter.get('/', adminAuth, getNotifications);

// Mark a notification as read
notificationRouter.put('/:notificationId/read', adminAuth, markAsRead);

// Mark all notifications as read
notificationRouter.put('/read-all', adminAuth, markAllAsRead);

// Delete a notification
notificationRouter.delete('/:notificationId', adminAuth, deleteNotification);

export default notificationRouter; 