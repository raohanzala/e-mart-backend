import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import categoryModel from "../models/category.model.js";
import productModel from '../models/product.model.js'


// Get all categories (fast route - no pagination, sorting, or search)
const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryModel
      .find()
      .select("_id name slug description image isFeatured subCategories")
      .lean(); // Use lean() for faster queries

    res.json(categories);
  } catch (error) {
    console.error("Error in getAllCategories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getCategories = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const sortBy = req.query.sortBy || "name";
  const searchQuery = req.query.search || "";

  if (page <= 0 || pageSize <= 0) {
    return res
      .status(400)
      .json({ error: "Page and pageSize must be positive numbers" });
  }

  let sortCriteria = {};
  switch (sortBy) {
    case "name-asc":
      sortCriteria = { name: 1 };
      break;
    case "name-desc":
      sortCriteria = { name: -1 };
      break;
    default:
      sortCriteria = { name: 1 };
      break;
  }

  try {
    const aggregationPipeline = [
      // Project only required fields
      {
        $project: {
          _id: 1,
          name: 1,
          image: 1,
          createdAt: 1,
        },
      },
    ];

    // Apply search filter
    if (searchQuery) {
      aggregationPipeline.push({
        $match: {
          name: { $regex: searchQuery, $options: "i" },
        },
      });
    }

    // Sort results
    aggregationPipeline.push({ $sort: sortCriteria });

    // Pagination
    const paginatedPipeline = [
      ...aggregationPipeline,
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
    ];

    // Get paginated categories and total count
    const totalCategoriesPipeline = JSON.parse(
      JSON.stringify(aggregationPipeline)
    ); // Deep copy to avoid modification
    totalCategoriesPipeline.push({ $count: "totalCategories" });

    const [categories, totalCategoriesResult] = await Promise.all([
      categoryModel.aggregate(paginatedPipeline),
      categoryModel.aggregate(totalCategoriesPipeline),
    ]);

    const totalCategories = totalCategoriesResult.length
      ? totalCategoriesResult[0].totalCategories
      : 0;

    res.json({
      currentPage: page,
      pageSize: pageSize,
      totalCategories: totalCategories,
      totalPages: Math.ceil(totalCategories / pageSize),
      categories: categories,
    });
  } catch (error) {
    console.error("Error in getCategories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addCategory = async (req, res) => {
  try {
    const {
      name,
      description,
      isFeatured,
      parentCategory,
      isActive
    } = req.body;

    console.log(name,
      description,
      isFeatured,
      parentCategory,
      isActive, 'req.body')

    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    // Generate slug from name
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    // Check if slug already exists
    const existingCategory = await categoryModel.findOne({ slug });
    if (existingCategory) {
      return res.status(400).json({ success: false, message: "Category with this name already exists" });
    }

    let imageObj = undefined;
    if (req.file) {
      // Process the image with Sharp (only resize)
      const processedBuffer = await sharp(req.file.path)
        .resize(500)
        .toBuffer();

      // Upload image to Cloudinary
      const imageUrl = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ resource_type: "image" }, (error, result) => {
          if (error) {
            console.error("Cloudinary Error:", error);
            return reject(error);
          }
          resolve(result.secure_url);
        }).end(processedBuffer);
      });
      imageObj = { url: imageUrl, alt: name };
    }

    // Save category in the database
    const newCategory = new categoryModel({
      name,
      slug,
      description: description || '',
      ...(imageObj && { image: imageObj }),
      ...(parentCategory && { parentCategory }),
      isFeatured: isFeatured === 'true' || isFeatured === true,
      isActive: typeof isActive !== 'undefined' ? (isActive === 'true' || isActive === true) : true
    });

    await newCategory.save();

    res.status(201).json({
      success: true,
      message: "Category added successfully",
      category: newCategory,
    });
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const editCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const {
      name,
      description,
      isFeatured,
      parentCategory,
      
      isActive
    } = req.body;

    // Find category by ID
    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // Generate new slug if name is being updated
    let newSlug = category.slug;
    if (name && name !== category.name) {
      newSlug = name.toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');

      // Check if new slug already exists (excluding current category)
      const existingCategory = await categoryModel.findOne({ slug: newSlug, _id: { $ne: categoryId } });
      if (existingCategory) {
        return res.status(400).json({ success: false, message: "Category with this name already exists" });
      }
    }

    let imageObj = category.image;
    if (req.file) {
      // Process the image with Sharp (only resize)
      const processedBuffer = await sharp(req.file.path)
        .resize(500)
        .toBuffer();

      // Upload new image to Cloudinary
      const imageUrl = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ resource_type: "image" }, (error, result) => {
          if (error) {
            console.error("Cloudinary Error:", error);
            return reject(error);
          }
          resolve(result.secure_url);
        }).end(processedBuffer);
      });
      imageObj = { url: imageUrl, alt: name || category.name };
    }


    // Update category details
    const updatedData = {
      ...(name && { name }),
      ...(newSlug !== category.slug && { slug: newSlug }),
      ...(description !== undefined && { description }),
      ...(imageObj && { image: imageObj }),
      ...(parentCategory && { parentCategory }),
      ...(typeof isFeatured !== 'undefined' && { isFeatured: isFeatured === 'true' || isFeatured === true }),
      ...(typeof isActive !== 'undefined' && { isActive: isActive === 'true' || isActive === true })
    };

    const updatedCategory = await categoryModel.findByIdAndUpdate(
      categoryId,
      updatedData,
      { new: true }
    );

    res.json({
      success: true,
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await categoryModel.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete category" });
  }
};

const getFeaturedCategories = async (req, res) => {
  try {
    const featuredCategories = await categoryModel
      .find({ 
        isFeatured: true, 
        isActive: true 
      })
      .select("_id name slug description image isFeatured isActive")
      .lean();

    res.json({
      success: true,
      categories: featuredCategories
    });
  } catch (error) {
    console.error("Error in getFeaturedCategories:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Initialize default categories if none exist
// const initializeCategories = async () => {
//   try {
//     const existingCategories = await categoryModel.countDocuments();
    
//     if (existingCategories === 0) {
//       console.log('📝 No categories found. Initializing default categories...');
      
//       const defaultCategories = [
//         {
//           name: "Electronics",
//           slug: "electronics",
//           description: "Latest electronic gadgets and devices",
//           image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500",
//           isFeatured: true,
//           subCategories: [
//             {
//               name: "Smartphones",
//               slug: "smartphones",
//               description: "Latest mobile phones and accessories",
//               image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500",
//               filters: [
//                 {
//                   name: "Brand",
//                   options: ["Apple", "Samsung", "Google", "OnePlus"]
//                 },
//                 {
//                   name: "Price Range",
//                   options: ["Under $500", "$500-$1000", "Over $1000"]
//                 }
//               ]
//             },
//             {
//               name: "Laptops",
//               slug: "laptops",
//               description: "High-performance laptops and computers",
//               image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500",
//               filters: [
//                 {
//                   name: "Brand",
//                   options: ["Apple", "Dell", "HP", "Lenovo", "Asus"]
//                 },
//                 {
//                   name: "Processor",
//                   options: ["Intel i3", "Intel i5", "Intel i7", "Intel i9", "AMD Ryzen"]
//                 }
//               ]
//             }
//           ]
//         },
//         {
//           name: "Fashion",
//           slug: "fashion",
//           description: "Trendy fashion items and accessories",
//           image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=500",
//           isFeatured: false,
//           subCategories: [
//             {
//               name: "Men's Clothing",
//               slug: "mens-clothing",
//               description: "Stylish clothing for men",
//               image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500",
//               filters: [
//                 {
//                   name: "Size",
//                   options: ["S", "M", "L", "XL", "XXL"]
//                 },
//                 {
//                   name: "Style",
//                   options: ["Casual", "Formal", "Sportswear"]
//                 }
//               ]
//             },
//             {
//               name: "Women's Clothing",
//               slug: "womens-clothing",
//               description: "Elegant clothing for women",
//               image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500",
//               filters: [
//                 {
//                   name: "Size",
//                   options: ["XS", "S", "M", "L", "XL"]
//                 },
//                 {
//                   name: "Style",
//                   options: ["Casual", "Formal", "Evening", "Sportswear"]
//                 }
//               ]
//             }
//           ]
//         },
//         {
//           name: "Home & Garden",
//           slug: "home-garden",
//           description: "Everything for your home and garden",
//           image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500",
//           isFeatured: true,
//           subCategories: [
//             {
//               name: "Furniture",
//               slug: "furniture",
//               description: "Quality furniture for every room",
//               image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500",
//               filters: [
//                 {
//                   name: "Room",
//                   options: ["Living Room", "Bedroom", "Kitchen", "Office"]
//                 },
//                 {
//                   name: "Material",
//                   options: ["Wood", "Metal", "Fabric", "Leather"]
//                 }
//               ]
//             },
//             {
//               name: "Garden Tools",
//               slug: "garden-tools",
//               description: "Essential tools for gardening",
//               image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500",
//               filters: [
//                 {
//                   name: "Tool Type",
//                   options: ["Hand Tools", "Power Tools", "Watering", "Planting"]
//                 }
//               ]
//             }
//           ]
//         },
//         {
//           name: "Sports & Fitness",
//           slug: "sports-fitness",
//           description: "Sports equipment and fitness gear",
//           image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500",
//           isFeatured: false,
//           subCategories: [
//             {
//               name: "Fitness Equipment",
//               slug: "fitness-equipment",
//               description: "Home and gym fitness equipment",
//               image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500",
//               filters: [
//                 {
//                   name: "Equipment Type",
//                   options: ["Cardio", "Strength Training", "Yoga", "Accessories"]
//                 },
//                 {
//                   name: "Price Range",
//                   options: ["Under $100", "$100-$500", "Over $500"]
//                 }
//               ]
//             },
//             {
//               name: "Sports Gear",
//               slug: "sports-gear",
//               description: "Equipment for various sports",
//               image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500",
//               filters: [
//                 {
//                   name: "Sport",
//                   options: ["Football", "Basketball", "Tennis", "Golf", "Swimming"]
//                 }
//               ]
//             }
//           ]
//         },
//         {
//           name: "Books & Media",
//           slug: "books-media",
//           description: "Books, movies, music and digital media",
//           image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500",
//           isFeatured: true,
//           subCategories: [
//             {
//               name: "Books",
//               slug: "books",
//               description: "Fiction, non-fiction, and educational books",
//               image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500",
//               filters: [
//                 {
//                   name: "Genre",
//                   options: ["Fiction", "Non-Fiction", "Science Fiction", "Romance", "Mystery"]
//                 },
//                 {
//                   name: "Format",
//                   options: ["Hardcover", "Paperback", "E-Book", "Audiobook"]
//                 }
//               ]
//             },
//             {
//               name: "Digital Media",
//               slug: "digital-media",
//               description: "Movies, music, and digital content",
//               image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500",
//               filters: [
//                 {
//                   name: "Media Type",
//                   options: ["Movies", "TV Shows", "Music", "Podcasts"]
//                 },
//                 {
//                   name: "Format",
//                   options: ["Digital Download", "Streaming", "Physical Copy"]
//                 }
//               ]
//             }
//           ]
//         }
//       ];

//       await categoryModel.insertMany(defaultCategories);
//       console.log('✅ Successfully initialized 5 default categories');
//     } else {
//       console.log(`📊 Found ${existingCategories} existing categories`);
//     }
//   } catch (error) {
//     console.error('❌ Error initializing categories:', error);
//   }
// };

export {
  getCategories,
  addCategory,
  deleteCategory,
  editCategory,
  getAllCategories,
  // initializeCategories,
  getFeaturedCategories
};
