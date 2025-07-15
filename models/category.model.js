import mongoose from 'mongoose';

const subCategorySchema = new mongoose.Schema({
  name: String,
  slug: String,
  description: String,
  image: String,
  filters: [
    {
      name: String,
      options: [String],
    },
  ],
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  image: String,
  isFeatured: { type: Boolean, default: false },
  subCategories: [subCategorySchema],
});

const categoryModel = mongoose.models.category || mongoose.model('category', categorySchema);

export default categoryModel;
