import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },

  category: { type: mongoose.Schema.Types.ObjectId, ref: 'category', required: true },
  subCategory: { type: String },
  brand: { type: String, default: "No Brand" },

  images: [{
    url: { type: String, required: true },
    alt: { type: String }
  }],

  // ✅ Flexible specifications for all product types
  specifications: [{
    key: { type: String, required: true },         // e.g., "Battery Life", "Material"
    value: { type: mongoose.Schema.Types.Mixed, required: true } // e.g., "10 hours", 1.5, ["iPhone 13", "iPhone 14"]
  }],

  // ✅ Variants for clothing or variable products
  variants: [{
    color: { type: String },
    size: { type: String },
    price: { type: Number },
    stock: { type: Number, default: 0 },
    // sku: { type: String, unique: true }
  }],

  availability: { type: String, default: "In Stock" },
  isFeatured: { type: Boolean, default: false },
  published: { type: Boolean, default: true },
}, {
  timestamps: true
});

// ✅ Indexes for better query performance
productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ slug: 1 });
productSchema.index({ category: 1 });
productSchema.index({ subCategory: 1 });
productSchema.index({ brand: 1 });

const productModel = mongoose.models.product || mongoose.model("product", productSchema);
export default productModel;
