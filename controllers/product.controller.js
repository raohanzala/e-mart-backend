import {v2 as cloudinary} from 'cloudinary'
import productModel from '../models/product.model.js'

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';
import mongoose, { Types } from 'mongoose';
import categoryModel from '../models/category.model.js';

const addProduct = async (req, res) => {
  try {
    const {
      title,
      slug,
      description,
      price,
      discount,
      stock,
      category,
      subCategory,
      brand,
      specifications, // <-- new field
      variants,
      availability,
      isFeatured,
      published
    } = req.body;

    // Validate required fields
    if (!title || !slug || !description || !price || !category) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields. Required fields are: title, slug, description, price, and category." 
      });
    }

    // Check if slug already exists
    const existingProduct = await productModel.findOne({ slug });
    if (existingProduct) {
      return res.status(400).json({ 
        success: false, 
        message: "Product with this slug already exists" 
      });
    }

    const images = [
      req.files?.image1 && req.files.image1[0],
      req.files?.image2 && req.files.image2[0],
      req.files?.image3 && req.files.image3[0],
      req.files?.image4 && req.files.image4[0],
    ].filter(Boolean);

    const processAndUploadImage = async (filePath) => {
      // Process image without watermark
      const processedBuffer = await sharp(filePath)
        .resize(800) // Resize image to max width 800px
        .webp({ quality: 80 }) // Compress to WebP
        .toBuffer();

      // Upload to Cloudinary
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
          if (error) {
            console.error('Cloudinary Error:', error);
            return reject(error);
          }
          resolve({
            url: result.secure_url,
            alt: title // Use product title as default alt text
          });
        }).end(processedBuffer);
      });
    };

    // Process and upload all images concurrently
    const imagesData = await Promise.all(images.map((img) => processAndUploadImage(img.path)));

    // Parse specifications if provided as a string
    let parsedSpecifications = [];
    if (specifications) {
      if (typeof specifications === 'string') {
        try {
          parsedSpecifications = JSON.parse(specifications);
        } catch (e) {
          return res.status(400).json({ success: false, message: 'Invalid specifications format' });
        }
      } else if (Array.isArray(specifications)) {
        parsedSpecifications = specifications;
      }
      // Validate each specification
      parsedSpecifications = parsedSpecifications.filter(spec => spec.key && spec.value);
    }

    // Parse variants if they're provided as a string
    let parsedVariants = [];
    if (variants) {
      if (typeof variants === 'string') {
        try {
          parsedVariants = JSON.parse(variants);
        } catch (e) {
          return res.status(400).json({ success: false, message: 'Invalid variants format' });
        }
      } else if (Array.isArray(variants)) {
        parsedVariants = variants;
      }
      // Validate each variant (must have at least one of color, size, price, stock)
      parsedVariants = parsedVariants.filter(variant => variant && (variant.color || variant.size || variant.price));
    }

    // Save product details to the database
    const productData = {
      title,
      slug,
      description,
      price: Number(price),
      discount: Number(discount) || 0,
      stock: Number(stock) || 0,
      category,
      subCategory,
      brand: brand || "No Brand",
      images: imagesData,
      specifications: parsedSpecifications,
      variants: parsedVariants,
      ...(availability && { availability }),
      ...(typeof isFeatured !== 'undefined' && { isFeatured }),
      ...(typeof published !== 'undefined' && { published })
    };

    const product = new productModel(productData);
    await product.save();

    res.json({ success: true, message: 'Product Added', product });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const editProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      title,
      slug,
      description,
      price,
      discount,
      stock,
      category,
      subCategory,
      brand,
      specifications, // <-- new field
      variants,
      availability,
      isFeatured,
      published
    } = req.body;

    // Check if slug already exists (if slug is being updated)
    if (slug) {
      const existingProduct = await productModel.findOne({ slug, _id: { $ne: productId } });
      if (existingProduct) {
        return res.status(400).json({ 
          success: false, 
          message: "Product with this slug already exists" 
        });
      }
    }

    const images = [
      req.files?.image1 && req.files.image1[0],
      req.files?.image2 && req.files.image2[0],
      req.files?.image3 && req.files.image3[0],
      req.files?.image4 && req.files.image4[0],
    ].filter(Boolean);

    const processAndUploadImage = async (filePath) => {
      const processedBuffer = await sharp(filePath)
        .resize(800)
        .webp({ quality: 80 })
        .toBuffer();

      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
          if (error) {
            console.error('Cloudinary Error:', error);
            return reject(error);
          }
          resolve({
            url: result.secure_url,
            alt: title || 'Product Image'
          });
        }).end(processedBuffer);
      });
    };

    let imagesData = [];
    if (images.length > 0) {
      imagesData = await Promise.all(images.map((img) => processAndUploadImage(img.path)));
    }

    // Parse specifications if provided
    let parsedSpecifications = undefined;
    if (typeof specifications !== 'undefined') {
      if (typeof specifications === 'string') {
        try {
          parsedSpecifications = JSON.parse(specifications);
        } catch (e) {
          return res.status(400).json({ success: false, message: 'Invalid specifications format' });
        }
      } else if (Array.isArray(specifications)) {
        parsedSpecifications = specifications;
      }
      // Validate each specification
      if (parsedSpecifications) {
        parsedSpecifications = parsedSpecifications.filter(spec => spec.key && spec.value);
      }
    }

    // Parse variants if provided
    let parsedVariants = undefined;
    if (typeof variants !== 'undefined') {
      if (typeof variants === 'string') {
        try {
          parsedVariants = JSON.parse(variants);
        } catch (e) {
          return res.status(400).json({ success: false, message: 'Invalid variants format' });
        }
      } else if (Array.isArray(variants)) {
        parsedVariants = variants;
      }
              // Validate each variant (must have at least one of color, size, price, stock)
        if (parsedVariants) {
          parsedVariants = parsedVariants.filter(variant => variant && (variant.color || variant.size || variant.price));
        }
    }

    const updatedData = {
      ...(title && { title }),
      ...(slug && { slug }),
      ...(description && { description }),
      ...(price !== undefined && { price: Number(price) }),
      ...(discount !== undefined && { discount: Number(discount) }),
      ...(stock !== undefined && { stock: Number(stock) }),
      ...(category && { category }),
      ...(subCategory && { subCategory }),
      ...(brand && { brand }),
      ...(typeof parsedSpecifications !== 'undefined' && { specifications: parsedSpecifications }),
      ...(typeof parsedVariants !== 'undefined' && { variants: parsedVariants }),
      ...(imagesData.length > 0 && { images: imagesData }),
      ...(availability && { availability }),
      ...(typeof isFeatured !== 'undefined' && { isFeatured }),
      ...(typeof published !== 'undefined' && { published })
    };

    const product = await productModel.findByIdAndUpdate(productId, updatedData, { new: true });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product updated successfully', product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const removeProduct = async (req, res)=> {
   try {
      await productModel.findByIdAndDelete(req.body.id)
      res.json({success : true, message : 'Product Removed'})
   } catch (error) {
      console.log(error)
      res.json({success : false, message : error.message})
   }
}

const singleProduct = async (req, res) => {
  try {
    const { productSlug } = req.params;

    if (!productSlug) {
      return res.status(400).json({ success: false, message: "Product slug is required" });
    }

    const product = await productModel.findOne({ slug: productSlug })
      .populate('category')
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Format the response to match the desired structure
    const formattedProduct = {
      _id: product._id,
      title: product.title,
      description: product.description,
      slug: product.slug,
      price: product.price,
      discount: product.discount,
      brand: product.brand,
      images: product.images,
      variants: product.variants || [],
      specifications: product.specifications || [],
      stock: product.stock,
      category: product.category,
      subCategory: product.subCategory,
      availability: product.availability,
      isFeatured: product.isFeatured,
      published: product.published,
      attributes: product.attributes,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };

    res.json({ success: true, product: formattedProduct });
  } catch (error) {
    console.error('Error fetching single product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const searchProducts = async (req, res) => {
  const { query, category } = req.query;

  if (!query) {
    return res.status(400).json({ success: false, message: 'Query parameter is required' });
  }

  try {
    const searchFilter = {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ],
      published: true,
      availability: 'In Stock'
    };

    // If category is provided and is a valid ObjectId, filter by category
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      searchFilter.category = category;
    }

    const products = await productModel.find(searchFilter)
      .select('_id title slug price discount brand images variants stock category subCategory availability');

    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const products = async (req, res) => {
  try {
    console.log('Products API called with query params:', req.query);
    
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const sortBy = req.query.sortBy || "date";
    const categorySlug = req.query.category || "";
    const subCategorySlug = req.query.subCategory || "";
    const filterBy = req.query.filterBy || "";
    const searchQuery = req.query.search || "";
    const isAdmin = req.query.isAdmin === "true";

    console.log('Parsed parameters:', {
      page,
      pageSize,
      sortBy,
      categorySlug,
      subCategorySlug,
      filterBy,
      searchQuery,
      isAdmin
    });

    if (page <= 0 || pageSize <= 0) {
      return res.status(400).json({ error: "Page and pageSize must be positive numbers" });
    }

    let sortCriteria = {};
    switch (sortBy) {
      case "price-low-high":
        sortCriteria.price = 1;
        break;
      case "price-high-low":
        sortCriteria.price = -1;
        break;
      case "newest":
        sortCriteria.createdAt = -1;
        break;
      case "oldest":
        sortCriteria.createdAt = 1;
        break;
      case "on-sale":
        sortCriteria.discount = -1;
        break;
      case "date":
      default:
        sortCriteria.createdAt = -1;
        break;
    }

    const aggregationPipeline = [];

    if (!isAdmin) {
      aggregationPipeline.push({ $match: { published: true } });
    }

    if (searchQuery) {
      aggregationPipeline.push({
        $match: {
          $or: [
            { title: { $regex: searchQuery, $options: "i" } },
            { description: { $regex: searchQuery, $options: "i" } },
          ],
        },
      });
    }

    // Filter by category slug
    if (categorySlug) {
      aggregationPipeline.push({
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryData",
        },
      });
      
      aggregationPipeline.push({
        $match: {
          "categoryData.slug": categorySlug
        }
      });
    }

    // Filter by subcategory slug
    if (subCategorySlug) {
      aggregationPipeline.push({
        $match: {
          subCategory: subCategorySlug
        }
      });
    }

    // Main category lookup (if not already done for filtering)
    if (!categorySlug) {
      aggregationPipeline.push({
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      });
      aggregationPipeline.push({ $unwind: { path: "$category", preserveNullAndEmptyArrays: true } });
    } else {
      // If we already did lookup for filtering, just unwind
      aggregationPipeline.push({ $unwind: { path: "$categoryData", preserveNullAndEmptyArrays: true } });
      aggregationPipeline.push({
        $addFields: {
          category: "$categoryData"
        }
      });
    }

    aggregationPipeline.push({
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        slug: 1,
        price: 1,
        discount: 1,
        images: 1,
        category: 1,
        availability: 1,
        variants: 1,
        createdAt: 1,
      },
    });

    aggregationPipeline.push({ $sort: sortCriteria });
    aggregationPipeline.push({ $skip: (page - 1) * pageSize }, { $limit: pageSize });

    const [productResults, totalProducts] = await Promise.all([
      productModel.aggregate(aggregationPipeline),
      productModel.countDocuments({
        published: isAdmin ? { $in: [true, false] } : true,
        ...(searchQuery && {
          $or: [
            { title: { $regex: searchQuery, $options: "i" } },
            { description: { $regex: searchQuery, $options: "i" } },
          ],
        }),
        ...(categorySlug && { category: { $exists: true } }),
      }),
    ]);

    res.json({
      currentPage: page,
      pageSize: pageSize,
      totalProducts: totalProducts,
      totalPages: Math.ceil(totalProducts / pageSize),
      products: productResults,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateProductStatus = async (req, res)=> {
  try {
    const { productId, status } = req.body; 
    const updatedProduct = await productModel.findByIdAndUpdate(
      productId,
      { availability: status }, 
      { new: true } 
    );

    if (!updatedProduct) {
      return res.json({ success: false, message: "Product not found" });
    }

    res.json({success : true, status : updatedProduct, message : 'Status updated successfully'})
  } catch (error) {
    console.log(error)
    res.json({success : false, message : error.message})
  }
}

const updatePublishStatus = async (req, res) => {
  try {
    const { productId, published } = req.body;

    await productModel.findByIdAndUpdate(productId, { published });

    res.json({ success: true, message: `Product ${published ? "published" : "unpublished"} successfully` });
  } catch (error) {
    console.error("Error updating publish status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const productDetails = async (req, res) => {
  try {
    // Total number of products
    const totalProducts = await productModel.countDocuments();

    // Total number of products by category
    const productsByCategory = await productModel.aggregate([
      { $group: { _id: "$category", totalProducts: { $sum: 1 } } },
      { $sort: { totalProducts: -1 } },
    ]);

    // Best sellers
    const bestSellers = await productModel.find({ bestSeller: true }).limit(5);

    // Average price of products
    const averagePriceResult = await productModel.aggregate([
      {
        $group: {
          _id: null,
          averagePrice: { $avg: "$newPrice" },
        },
      },
    ]);
    const averagePrice =
      averagePriceResult.length > 0 ? averagePriceResult[0].averagePrice : 0;

    // Product availability breakdown
    const availabilityStatus = await productModel.aggregate([
      { $group: { _id: "$availability", count: { $sum: 1 } } },
    ]);

    // Most recent products added
    const recentProducts = await productModel.find().sort({ date: -1 }).limit(5);

    // Price range of products
    const priceRange = await productModel.aggregate([
      {
        $group: {
          _id: null,
          minPrice: { $min: "$newPrice" },
          maxPrice: { $max: "$newPrice" },
        },
      },
    ]);

    // Products by subcategory
    const productsBySubCategory = await productModel.aggregate([
      { $group: { _id: "$subCategory", totalProducts: { $sum: 1 } } },
      { $sort: { totalProducts: -1 } },
    ]);

    res.json({
      totalProducts,
      productsByCategory,
      bestSellers,
      averagePrice,
      availabilityStatus,
      recentProducts,
      priceRange,
      productsBySubCategory,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const getFeaturedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8; // Default to 8 products, can be changed via query param
    
    const featuredProducts = await productModel
      .find({ 
        published: true,
        isFeatured: true // Only get featured products
      })
      .sort({ createdAt: -1 }) // Sort by date in descending order (newest first)
      .limit(limit)
      .select('title description price discount slug images category subCategory brand variants stock availability'); // Select only needed fields
    
      console.log(featuredProducts)

    res.json({ 
      success: true, 
      products: featuredProducts 
    });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const getRelatedProducts = async (req, res) => {
  try {
    const { productSlug } = req.params;
    const limit = parseInt(req.query.limit) || 4; // Default to 4 related products

    if (!productSlug) {
      return res.status(400).json({
        success: false,
        message: "Product slug is required"
      });
    }

    // First, get the current product to find its category
    const currentProduct = await productModel.findOne({ slug: productSlug });
    
    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Find related products based on the same category
    const relatedProducts = await productModel
      .find({
        slug: { $ne: productSlug }, // Exclude the current product
        category: currentProduct.category,
        published: true // Only get published products
      })
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(limit)
      .select('title description slug price discount images category subCategory brand variants stock availability')
      .populate('category', 'name'); // Populate category name

    res.json({
      success: true,
      products: relatedProducts
    });
  } catch (error) {
    console.error('Error fetching related products:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getBestSellers = async (req, res) => {
  try {
    // Find 10 most recent featured products (since bestSeller field doesn't exist in current schema)
    const bestSellers = await productModel
      .find({ 
        isFeatured: true,
        published: true // Only get published products
      })
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(10) // Limit to 10 products
      .select('title description slug price discount images category subCategory brand variants stock availability')
      .populate('category', 'name');

    res.json({
      success: true,
      products: bestSellers
    });
  } catch (error) {
    console.error('Error fetching best sellers:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getProductsByCategorySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const sortBy = req.query.sortBy || "createdAt";

    if (page <= 0 || pageSize <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Page and pageSize must be positive numbers" 
      });
    }

    console.log(slug, 'SLUG PARAM')

    // Find the category by slug
    const category = await categoryModel.findOne({ slug });

    console.log(category)

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    let sortCriteria = {};
    switch (sortBy) {
      case "price-low-high":
        sortCriteria = { price: 1 };
        break;
      case "price-high-low":
        sortCriteria = { price: -1 };
        break;
      case "name-asc":
        sortCriteria = { title: 1 };
        break;
      case "name-desc":
        sortCriteria = { title: -1 };
        break;
      case "createdAt-asc":
        sortCriteria = { createdAt: 1 };
        break;
      case "createdAt-desc":
      default:
        sortCriteria = { createdAt: -1 };
        break;
    }

    // Get total count of products in this category
    const totalProducts = await productModel.countDocuments({ 
      category: category._id,
      published: true 
    });

    // Get paginated products with this category's ObjectId
    const products = await productModel
      .find({ 
        category: category._id,
        published: true 
      })
      .select('_id title description slug price discount images variants stock availability createdAt')
      .sort(sortCriteria)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    res.json({
      success: true,
      category: category.name,
      categorySlug: category.slug,
      currentPage: page,
      pageSize: pageSize,
      totalProducts: totalProducts,
      totalPages: Math.ceil(totalProducts / pageSize),
      products,
    });
  } catch (error) {
    console.error("Error in getProductsByCategorySlug:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export {
  addProduct,
  removeProduct,
  singleProduct,
  searchProducts,
  updateProductStatus,
  editProduct,
  products,
  productDetails,
  updatePublishStatus,
  getFeaturedProducts,
  getRelatedProducts,
  getBestSellers,
  getProductsByCategorySlug
};