import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import categoryModel from "../models/category.model.js";


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

const getCategoryById = async (req, res) => {
  try {
    const category = await categoryModel.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: "Failed to get category" });
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
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          description: 1,
          image: 1,
          isFeatured: 1,
          isActive: 1,
          parentCategory: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ];

    // Apply search filter
    if (searchQuery) {
      aggregationPipeline.push({
        $match: {
          $or: [
            { name: { $regex: searchQuery, $options: "i" } },
            { slug: { $regex: searchQuery, $options: "i" } },
            { description: { $regex: searchQuery, $options: "i" } },
          ],
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
      slug: slugInput,
      description,
      isFeatured,
      parentCategory,
      isActive
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    // Generate slug from name, or use provided slug
    const slug = (slugInput || name).toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

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
      slug: slugInput,
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

    // Generate new slug if name/slug is being updated
    let newSlug = category.slug;
    if (slugInput && slugInput !== category.slug) {
      newSlug = String(slugInput).toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    } else if (name && name !== category.name) {
      newSlug = name.toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    if (newSlug !== category.slug) {
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

export {
  getCategories,
  addCategory,
  deleteCategory,
  editCategory,
  getAllCategories,
  getFeaturedCategories,
  getCategoryById
};
