import express from 'express'
import { addCategory, deleteCategory, editCategory, getCategories, getAllCategories } from '../controllers/category.controller.js';
import adminAuth from '../middleware/adminAuth.js';
import upload from '../middleware/multer.js';

const categoryRouter = express.Router();

// Get all categories (fast route - no pagination)
categoryRouter.get("/all", getAllCategories);

// Get all categories (with pagination, sorting, search)
categoryRouter.get("/", getCategories);

// Add a new category
categoryRouter.post('/add', adminAuth, upload.single('image'), addCategory);

categoryRouter.put('/category/:categoryId', upload.single('image'), editCategory);

// Delete a category
categoryRouter.delete("/:id", deleteCategory);

export default categoryRouter;