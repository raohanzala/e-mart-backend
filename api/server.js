import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import connectDB from '../config/mongoDB.js';
import connectCloudinary from '../config/cloudinary.js';
import productRouter from '../routes/product.routes.js';
import cartRouter from '../routes/cart.routes.js';
import orderRouter from '../routes/order.routes.js';
import settingsRouter from '../routes/settings.routes.js';
import newsletterRouter from '../routes/newsletter.routes.js';
import categoryRouter from '../routes/category.routes.js';
import notificationRouter from '../routes/notification.routes.js';
import { initializeCategories } from '../controllers/category.controller.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

const server = http.createServer(app);

// Connect to MongoDB
(async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Initialize default categories
    await initializeCategories();

    connectCloudinary();
    console.log('Cloudinary configured');
  } catch (error) {
    console.error('Error initializing services:', error.message);
    process.exit(1); // Exit on critical failure
  }
})();

// Middleware
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL.split(',')
    : ['http://localhost:5173', 'http://localhost:5174'],
  methods: '*',
  allowedHeaders: ['Content-Type', 'Authorization', 'token'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/products', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/notifications', notificationRouter);

// Root Endpoint
app.get('/', (req, res) => {
  res.send('Express App is Running');
});

// Start the Server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


