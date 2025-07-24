import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },         // Example: "Clothing", "Electronics"
  slug: { type: String, required: true, unique: true },         // For SEO URLs
  description: { type: String },                                // Optional category description

  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'category', default: null },

  image: {
    url: { type: String },
    alt: { type: String }
  },

  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }

}, { timestamps: true });

const categoryModel = mongoose.models.category || mongoose.model("category", categorySchema);
export default categoryModel;
