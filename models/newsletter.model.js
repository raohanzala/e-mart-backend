// models/newsletter.model.js
import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['active', 'unsubscribed'],
    default: 'active'
  },
  date: {
    type: Number,
    required: true,
    default: () => Date.now()
  }
});

const newsletterModel = mongoose.models.newsletter || mongoose.model("newsletter", newsletterSchema);

export default newsletterModel;