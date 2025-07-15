// controllers/newsletter.controller.js
import newsletterModel from '../models/newsletter.model.js';

// Subscribe to newsletter
const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    console.log(email, "email");

    // Validate email
    if (!email || !email.includes('@')) {
      return res.json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Check if email already exists
    const existingSubscriber = await newsletterModel.findOne({ email });
    if (existingSubscriber) {
      if (existingSubscriber.status === 'unsubscribed') {
        // Reactivate subscription
        existingSubscriber.status = 'active';
        await existingSubscriber.save();
        return res.json({
          success: true,
          message: 'Welcome back! Your newsletter subscription has been reactivated.'
        });
      }
      return res.json({
        success: false,
        message: 'This email is already subscribed to our newsletter'
      });
    }

    // Create new subscription
    const newSubscriber = await newsletterModel.create({
      email,
      status: 'active'
    });

    res.json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      subscriber: newSubscriber
    });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Unsubscribe from newsletter
const unsubscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    const subscriber = await newsletterModel.findOne({ email });
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Email not found in our newsletter list'
      });
    }

    subscriber.status = 'unsubscribed';
    await subscriber.save();

    res.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all subscribers (admin only)
const getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await newsletterModel.find()
      .sort({ subscribedAt: -1 });

    res.json({
      success: true,
      subscribers
    });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export {
  subscribeNewsletter,
  unsubscribeNewsletter,
  getAllSubscribers
};