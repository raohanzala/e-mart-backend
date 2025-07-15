import {v2 as cloudinary} from 'cloudinary'
import productModel from '../models/product.model.js'

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';
import mongoose, { Types } from 'mongoose';

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
      attributes,
      variants
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
      req.files.image1 && req.files.image1[0],
      req.files.image2 && req.files.image2[0],
      req.files.image3 && req.files.image3[0],
      req.files.image4 && req.files.image4[0],
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

    // Parse attributes if they're provided as a string
    const parsedAttributes = attributes ? (typeof attributes === 'string' ? JSON.parse(attributes) : attributes) : {};

    // Parse variants if they're provided as a string
    const parsedVariants = variants ? (typeof variants === 'string' ? JSON.parse(variants) : variants) : [];

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
      attributes: parsedAttributes,
      variants: parsedVariants
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
      attributes,
      variants
    } = req.body;

    console.log(title, slug, description, price, discount, stock, category, subCategory, brand, attributes, variants);

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
      // Process image without watermark
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
            alt: title || 'Product Image' // Use product title as alt text
          });
        }).end(processedBuffer);
      });
    };

    let imagesData = [];
    if (images.length > 0) {
      imagesData = await Promise.all(images.map((img) => processAndUploadImage(img.path)));
    }

    // Parse attributes if they're provided
    const parsedAttributes = attributes ? (typeof attributes === 'string' ? JSON.parse(attributes) : attributes) : undefined;

    // Parse variants if they're provided
    const parsedVariants = variants ? (typeof variants === 'string' ? JSON.parse(variants) : variants) : undefined;

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
      ...(parsedAttributes && { attributes: parsedAttributes }),
      ...(parsedVariants && { variants: parsedVariants }),
      ...(imagesData.length > 0 && { images: imagesData }),
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
        featured: true // Only get featured products
      })
      .sort({ date: -1 }) // Sort by date in descending order (newest first)
      .limit(limit)
      .select('name description newPrice oldPrice images category gender bestSeller isAffiliate profit'); // Select only needed fields
    
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
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 4; // Default to 4 related products

    // First, get the current product to find its category and gender
    const currentProduct = await productModel.findById(productId);
    
    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Find related products based on the same category and gender
    const relatedProducts = await productModel
      .find({
        _id: { $ne: productId }, // Exclude the current product
        category: currentProduct.category,
        gender: currentProduct.gender,
        published: true // Only get published products
      })
      .sort({ date: -1 }) // Sort by newest first
      .limit(limit)
      .select('name description newPrice oldPrice images category gender bestSeller isAffiliate profit')
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
    // Find 10 most recent best seller products
    const bestSellers = await productModel
      .find({ 
        bestSeller: true,
        published: true // Only get published products
      })
      .sort({ date: -1 }) // Sort by newest first
      .limit(10) // Limit to 10 products
      .select('name description newPrice oldPrice images category gender bestSeller isAffiliate profit')
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
  getBestSellers
};