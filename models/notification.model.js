import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['NEW_USER', 'NEW_AFFILIATE', 'NEW_ORDER', 'CUSTOM', 'WITHDRAWAL_PROCESSED', 'WITHDRAWAL_REQUESTED']
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const notificationModel = mongoose.models.notification || mongoose.model('notification', notificationSchema);

export default notificationModel; 