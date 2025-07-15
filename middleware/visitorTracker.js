import visitorModel from '../models/visitor.model.js';

const visitorTracker = async (req, res, next) => {
  try {
    // Skip tracking for admin routes and static files
    if (req.path.startsWith('/admin') || req.path.startsWith('/static')) {
      return next();
    }

    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const path = req.path;

    // Check if this is a unique visit (same IP within last 24 hours)
    const lastVisit = await visitorModel.findOne({
      ip,
      date: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    });

    // Create new visitor record
    await visitorModel.create({
      ip,
      userAgent,
      path,
      isUnique: !lastVisit
    });

    next();
  } catch (error) {
    console.error('Error tracking visitor:', error);
    next(); // Continue even if tracking fails
  }
};

export default visitorTracker; 