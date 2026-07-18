import jwt from 'jsonwebtoken';
import adminModel from '../models/admin.model.js';

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  // Legacy header used by older clients
  return req.headers.token;
};

const adminAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized. Please log in again.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // New admin JWT payload: { id, role }
    if (decoded?.id) {
      const admin = await adminModel.findById(decoded.id).select('_id email role');
      if (!admin || admin.role !== 'admin') {
        return res.status(401).json({ success: false, message: 'Not authorized. Please log in again.' });
      }
      req.admin = admin;
      req.adminId = admin._id;
      return next();
    }

    // Legacy token: JWT of ADMIN_EMAIL + ADMIN_PASSWORD
    if (
      process.env.ADMIN_EMAIL &&
      process.env.ADMIN_PASSWORD &&
      decoded === process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD
    ) {
      return next();
    }

    return res.status(401).json({ success: false, message: 'Not authorized. Please log in again.' });
  } catch (error) {
    console.error('adminAuth error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Your session has expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Not authorized. Please log in again.' });
  }
};

export default adminAuth;
