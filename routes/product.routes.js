import express from "express";
import {
  addProduct,
  removeProduct,
  singleProduct,
  searchProducts,
  updateProductStatus,
  editProduct,
  products,
  productDetails,
  updatePublishStatus,
  getRelatedProducts,
  getBestSellers,
  getFeaturedProducts
} from "../controllers/product.controller.js";
import upload from "../middleware/multer.js";
import adminAuth from "../middleware/adminAuth.js";

const productRouter = express.Router();

const uploadArray = [
  { name: "image1", maxCount: 1 },
  { name: "image2", maxCount: 1 },
  { name: "image3", maxCount: 1 },
  { name: "image4", maxCount: 1 },
];

// Admin routes
productRouter.post("/add", adminAuth, upload.fields(uploadArray), addProduct);
productRouter.post("/remove", adminAuth, removeProduct);
productRouter.post("/productstatus", adminAuth, updateProductStatus);
productRouter.get("/product-details", adminAuth, productDetails);
productRouter.put("/edit/:productId", upload.fields(uploadArray), editProduct);
productRouter.post("/product/publish-status", updatePublishStatus);

// Public routes
productRouter.get("/", products);
productRouter.get("/search", searchProducts);
productRouter.get("/single/:productSlug", singleProduct);
productRouter.get("/featured", getFeaturedProducts);
productRouter.get("/best-sellers", getBestSellers);
productRouter.get("/related/:productSlug", getRelatedProducts);

export default productRouter;
