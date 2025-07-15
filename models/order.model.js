import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  // Guest user info
  guestUser: {
    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    email:     { type: String, required: true },
    phone:     { type: String, required: true }
  },
  // Address info
  address: {
    address:  { type: String, required: true },
    city:     { type: String, required: true },
    state:    { type: String, required: true },
    zipCode:  { type: String, required: true },
    country:  { type: String, required: true }
  },
  // Cart items
  items: [{
    title:    { type: String, required: true },
    image:    { type: String, required: true },
    price:    { type: Number, required: true },
    quantity: { type: Number, required: true },
    sku:      { type: String, required: true }
  }],
  // Order total
  amount: { type: Number, required: true },
  // Order status
  status: { type: String, default: 'Order Placed' },
  // Timestamps
  createdAt: { type: Date, default: Date.now }
});

const orderModel = mongoose.models.order || mongoose.model('order', orderSchema);
export default orderModel;