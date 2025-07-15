import express from 'express';
import {
  getSettings, 
  updateSettings,
} from '../controllers/settings.controller.js';
import adminAuth from '../middleware/adminAuth.js';

const settingsRouter = express.Router();

// All routes are protected by adminAuth middleware
// settingsRouter.use(adminAuth);

// Get all settings
settingsRouter.get('/', getSettings);

// Update all settings
settingsRouter.put('/', updateSettings);

export default settingsRouter; 