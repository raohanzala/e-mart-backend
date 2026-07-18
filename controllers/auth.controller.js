import jwt from 'jsonwebtoken';
import adminModel from '../models/admin.model.js';

const createToken = (adminId) => {
  return jwt.sign({ id: adminId, role: 'admin' }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = await adminModel.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = createToken(admin._id);

    return res.json({
      message: 'Login successful',
      token,
      user: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Error in loginAdmin:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const seedAdmin = async () => {
  try {
    const count = await adminModel.countDocuments();
    if (count > 0) return;

    const email = process.env.ADMIN_EMAIL || 'admin@luxurywatches.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const name = process.env.ADMIN_NAME || 'Admin';

    await adminModel.create({ name, email, password, role: 'admin' });
    console.log(`Default admin created: ${email}`);
  } catch (error) {
    console.error('Error seeding admin:', error.message);
  }
};

export { loginAdmin, seedAdmin };
