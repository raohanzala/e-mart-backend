// routes/newsletter.routes.js
import express from 'express';
import {
  subscribeNewsletter,
  unsubscribeNewsletter,
  getAllSubscribers
} from '../controllers/newsletter.controller.js';
import adminAuth from '../middleware/adminAuth.js';

const newsletterRouter = express.Router();

// Public routes
newsletterRouter.post('/subscribe', subscribeNewsletter);
newsletterRouter.post('/unsubscribe', unsubscribeNewsletter);

// Admin routes
newsletterRouter.get('/subscribers', adminAuth, getAllSubscribers);

export default newsletterRouter;